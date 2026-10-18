/* Orquesta – Spiel: Spieler, Runden, Abspielen, Aufdecken, Punkte */
"use strict";

let busy = false;   // läuft gerade eine Spotify-Aktion?

/* ================= Topf ================= */
function eligible(s, f = store.settings) {
  return s.active && s.status !== "missing" && f.genres[s.genre] !== false &&
    (!f.orchestras.length || f.orchestras.includes(s.orq));
}
function poolSize() { return store.archive.filter((s) => eligible(s)).length; }

function nextSong(g) {
  const all = store.archive.filter((s) => eligible(s, g.filters));
  if (!all.length) return null;
  let pool = all.filter((s) => !g.used.includes(s.id));
  if (!pool.length) { g.used = []; pool = all; toast("Alle Songs gespielt – der Topf ist neu gemischt."); }
  // möglichst nicht zweimal hintereinander dasselbe Orchester
  const last = g.history.length ? songById(g.history[g.history.length - 1].songId) : null;
  const other = last ? pool.filter((s) => s.orq !== last.orq) : pool;
  const from = other.length ? other : pool;
  const s = from[Math.floor(Math.random() * from.length)];
  g.used.push(s.id);
  return s;
}
const songById = (id) => store.archive.find((s) => s.id === id);

/* ================= Was geraten wird ================= */
// Kategorien für einen Song nach den aktuellen Einstellungen
function guessCats(song, st = store.settings) {
  const p = st.points;
  const cats = [{ k: "orq", label: "Orchester", pts: p.orq }, { k: "title", label: "Titel", pts: p.title }];
  if (st.year && song && song.year) cats.push({ k: "year", label: st.yearTol ? `Jahr ±${st.yearTol}` : "Jahr", pts: p.year });
  if (st.singer && song && song.singer !== null && song.singer !== undefined) cats.push({ k: "singer", label: song.singer === "" ? "Instrumental" : "Sänger", pts: p.singer });
  return cats;
}
const catPoints = (cats, marks) => cats.reduce((a, c) => a + (marks[c.k] ? c.pts : 0), 0);

/* ================= Ansichten ================= */
function renderGame() {
  const g = store.game;
  if (!g) return renderSetup();
  if (g.finished) return renderResult();
  renderTurn();
}

function spotifyCard() {
  if (!clientId()) {
    return `<section class="card notice">
      <h3>Spotify einrichten</h3>
      <p class="muted">Trage einmalig die Client ID aus dem Spotify-Dashboard ein.</p>
      <button class="btn" data-act="tab" data-tab="settings">Zu den Einstellungen</button>
    </section>`;
  }
  if (!isLoggedIn()) {
    return `<section class="card notice">
      <h3>Mit Spotify verbinden</h3>
      <p class="muted">Einmal anmelden, danach bleibt die App verbunden.</p>
      <button class="btn primary" data-act="login">Mit Spotify verbinden</button>
    </section>`;
  }
  const n = store.settings.deviceName;
  return `<button class="device-chip" data-act="devices" aria-label="Wiedergabegerät wählen">
    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>
    <span>${n ? `Spielt auf <b>${esc(n)}</b>` : "Wiedergabegerät wählen"}</span>
  </button>`;
}

function renderSetup() {
  const s = store.settings;
  const count = (g) => store.archive.filter((x) => x.active && x.status !== "missing" && x.genre === g && (!s.orchestras.length || s.orchestras.includes(x.orq))).length;
  const n = poolSize();
  $("#view").innerHTML = `
    <header class="hero">
      <p class="eyebrow">Tango-Quiz</p>
      <h1>Orquesta</h1>
      <p class="muted">Song läuft – wer erkennt Orchester, Titel${s.year ? " und Jahr" : ""}?</p>
    </header>
    ${spotifyCard()}
    <h2>Spieler</h2>
    <section class="card list">
      ${store.players.map((p, i) => `
        <div class="row player-row">
          <span class="dot" style="--c:var(--p${(i % 6) + 1})"></span>
          <input class="plain" value="${esc(p)}" data-change="playerName" data-i="${i}" aria-label="Name Spieler ${i + 1}" maxlength="24">
          ${store.players.length > 1 ? `<button class="icon-btn" data-act="removePlayer" data-i="${i}" aria-label="${esc(p)} entfernen">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>` : ""}
        </div>`).join("")}
      ${store.players.length < 8 ? `<button class="row add" data-act="addPlayer">+ Spieler hinzufügen</button>` : ""}
    </section>

    <h2>Runden pro Spieler</h2>
    <div class="seg" role="radiogroup" aria-label="Runden pro Spieler">
      ${[3, 5, 10, 0].map((r) => `<button role="radio" aria-checked="${s.rounds === r}" data-act="rounds" data-r="${r}">${r || "∞"}</button>`).join("")}
    </div>

    <h2>Musik</h2>
    <div class="chips">
      ${Object.entries(GENRES).map(([k, v]) => `<button class="chip" aria-pressed="${s.genres[k] !== false}" data-act="genre" data-g="${k}">${v} <span class="count">${count(k)}</span></button>`).join("")}
    </div>
    <button class="row link-row" data-act="orchestras">
      <span>Orchester</span>
      <span class="muted">${s.orchestras.length ? `${s.orchestras.length} ausgewählt` : "alle"} ›</span>
    </button>

    ${pastGamesHtml()}

    <div class="sticky-cta">
      <button class="btn primary big" data-act="startGame" ${n && store.players.length ? "" : "disabled"}>Spiel starten</button>
      <p class="muted small center">${n} Songs im Topf</p>
    </div>`;
}

function scoreboard(g) {
  return `<div class="scores" role="list">
    ${g.players.map((p, i) => `<div class="score ${i === g.turn ? "on" : ""}" role="listitem" style="--c:var(--p${(i % 6) + 1})">
      <span class="name">${esc(p.name)}</span><span class="pts">${p.score}</span></div>`).join("")}
  </div>`;
}

function renderTurn() {
  const g = store.game;
  const c = g.current;
  const song = c && songById(c.songId);
  const p = g.players[g.turn];
  const phase = c ? c.phase : "ready";
  const playing = phase === "playing";
  const roundTxt = g.rounds ? `Runde ${g.round} von ${g.rounds}` : `Runde ${g.round}`;

  let body;
  if (!song) {
    body = `<section class="card notice"><p>Keine passenden Songs im Topf. Prüfe die Auswahl oder das Archiv.</p>
      <button class="btn" data-act="endGame">Spiel beenden</button></section>`;
  } else if (phase !== "revealed") {
    body = `
      <div class="stage">
        <button class="disc ${playing ? "spin" : ""} ${busy ? "wait" : ""}" data-act="${playing ? "pause" : "play"}" aria-label="${playing ? "Pause" : "Abspielen"}">
          <span class="grooves" aria-hidden="true"></span>
          <span class="label" aria-hidden="true">
            ${playing ? `<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>` : `<svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z"/></svg>`}
          </span>
        </button>
        ${c && c.stuck && phase !== "playing" ? `<div class="card notice stuck">
          <p><b>Spotify startet nicht von selbst.</b> iOS erlaubt das auf diesem Handy gerade nicht.</p>
          <p class="small">Notlösung: <b>Handy umdrehen</b> (Titel steht in Spotify), dann „In Spotify starten“, dort auf ▶ tippen und zurück zu Orquesta wechseln.</p>
          <a class="btn primary" href="${esc(song.spotify && song.spotify.id ? `spotify:track:${song.spotify.id}` : "spotify:")}" data-act="openSpotifyStuck">In Spotify starten</a>
          <p class="muted small">Ist der Song in Spotify ausgegraut, ist diese Aufnahme für das Konto nicht verfügbar – dann hier „Anderer Song“.</p>
        </div>` : ""}
        <p class="stage-hint">${busy ? "Einen Moment …" : playing ? "Läuft – hör genau hin" : phase === "paused" ? "Pausiert" : "Tippen zum Abspielen"}</p>
        <div class="mini-actions">
          <button class="btn ghost small" data-act="restart" ${phase === "ready" ? "disabled" : ""}>Von vorn</button>
          <button class="btn ghost small" data-act="skip">Anderer Song</button>
        </div>
      </div>
      <div class="sticky-cta"><button class="btn primary big" data-act="reveal">Aufdecken</button></div>`;
  } else {
    const cats = guessCats(song);
    const sum = catPoints(cats, c.marks);
    const meta = [song.singer === "" ? "instrumental" : song.singer, GENRES[song.genre]].filter(Boolean).map(esc).join(" · ");
    body = `
      <section class="reveal">
        ${song.spotify && song.spotify.image ? `<img class="cover" src="${esc(song.spotify.image)}" alt="" width="64" height="64">` : ""}
        <p class="eyebrow">Orchester</p>
        <h2 class="orq">${esc(song.orq)}</h2>
        <p class="eyebrow">Titel</p>
        <p class="title">${esc(song.title)}</p>
        ${song.year ? `<p class="eyebrow">Jahr</p><p class="year">${esc(song.year)}</p>` : ""}
        <p class="muted meta">${meta}</p>
        ${song.status === "auto" && song.spotify ? `<p class="muted small">Gespielt: ${esc(song.spotify.name)} – ${esc(song.spotify.artists)} <button class="link" data-act="editSong" data-id="${esc(song.id)}">stimmt nicht?</button></p>` : ""}
      </section>
      <p class="muted center">Was hat <b>${esc(p.name)}</b> erkannt?</p>
      <div class="marks">
        ${cats.map((x) => `<button class="mark" aria-pressed="${!!c.marks[x.k]}" data-act="mark" data-k="${x.k}"><span>${esc(x.label)}</span><b>+${x.pts}</b></button>`).join("")}
      </div>
      <div class="sticky-cta"><button class="btn primary big" data-act="next">${sum ? `+${sum} für ${esc(p.name)} · weiter` : "Weiter"}</button></div>`;
  }

  $("#view").innerHTML = `
    <header class="turn-head">
      <span class="muted small">${roundTxt}</span>
      <button class="btn ghost small" data-act="endGame">Beenden</button>
    </header>
    ${scoreboard(g)}
    ${isLoggedIn() ? "" : spotifyCard()}
    <div class="turn-name"><p class="eyebrow">Am Zug</p><p class="who" style="--c:var(--p${(g.turn % 6) + 1})">${esc(p.name)}</p></div>
    ${body}`;
}

function renderResult() {
  const g = store.game;
  const rec = finishedRecord(g);
  $("#view").innerHTML = `
    <header class="hero">
      <p class="eyebrow">Ergebnis</p>
      <h1>${esc(winnerText(rec))}</h1>
      <p class="muted">${rec.turns.length} Songs gespielt · Tippe auf einen Namen für die Details</p>
    </header>
    ${gameDetailHtml(rec)}
    <div class="sticky-cta">
      <button class="btn primary big" data-act="again">Nochmal mit denselben Spielern</button>
      <button class="btn ghost" data-act="newGame">Neues Spiel einrichten</button>
    </div>`;
}

/* ================= Aktionen ================= */
actions.tab = (el) => setTab(el.dataset.tab);
actions.login = () => spotifyLogin();
actions.playerName = (el) => { store.players[+el.dataset.i] = el.value.trim() || `Spieler ${+el.dataset.i + 1}`; save(); };
actions.addPlayer = () => { store.players.push(`Spieler ${store.players.length + 1}`); save(); renderSetup(); const ins = $$(".player-row input"); const last = ins[ins.length - 1]; if (last) { last.focus(); last.select(); } };
actions.removePlayer = (el) => { store.players.splice(+el.dataset.i, 1); save(); renderSetup(); };
actions.rounds = (el) => { store.settings.rounds = +el.dataset.r; save(); renderSetup(); };
actions.genre = (el) => {
  const g = store.settings.genres;
  g[el.dataset.g] = g[el.dataset.g] === false;
  if (!Object.values(g).some((v) => v !== false)) g[el.dataset.g] = true;   // mindestens eine Art
  save(); renderSetup();
};

actions.orchestras = () => {
  const s = store.settings;
  const names = orchestraNames();
  const cnt = (o) => store.archive.filter((x) => x.orq === o && x.active).length;
  openSheet(`
    <div class="sheet-head"><h3>Orchester</h3><button class="btn ghost small" data-act="closeSheet">Fertig</button></div>
    <p class="muted small">Keins ausgewählt = alle Orchester.</p>
    <div class="list card">
      ${names.map((o) => `<label class="row check"><input type="checkbox" data-change="toggleOrq" value="${esc(o)}" ${s.orchestras.includes(o) ? "checked" : ""}>
        <span class="grow">${esc(o)}</span><span class="muted small">${cnt(o)}</span></label>`).join("")}
    </div>
    <button class="btn ghost" data-act="clearOrq">Alle Orchester</button>`, () => render());
};
actions.toggleOrq = (el) => {
  const s = store.settings;
  s.orchestras = el.checked ? [...new Set([...s.orchestras, el.value])] : s.orchestras.filter((o) => o !== el.value);
  save();
};
actions.clearOrq = () => { store.settings.orchestras = []; save(); closeSheet(); };
actions.closeSheet = () => closeSheet();

function newGame(players) {
  const s = store.settings;
  const g = {
    players: players.map((name) => ({ name, score: 0 })),
    rounds: s.rounds, round: 1, turn: 0, used: [], history: [],
    filters: { genres: { ...s.genres }, orchestras: [...s.orchestras] },
    current: null, finished: false
  };
  const song = nextSong(g);
  g.current = song ? { songId: song.id, phase: "ready", marks: {}, pos: null } : null;
  store.game = g;
  save();
  render();
}

actions.startGame = () => {
  if (!isLoggedIn()) { toast("Bitte zuerst mit Spotify verbinden."); return; }
  newGame(store.players.map((p) => p.trim()).filter(Boolean));
};
actions.again = () => newGame(store.game.players.map((p) => p.name));
actions.newGame = () => { store.game = null; save(); render(); };
actions.endGame = () => {
  if (!confirm("Spiel jetzt beenden und Ergebnis zeigen?")) return;
  spotifyPause().catch(() => {});
  finishGame(store.game); save(); render();
};

async function withBusy(fn) {
  if (busy) return;
  busy = true; renderTurn();
  try { await fn(); }
  catch (e) { handleSpotifyError(e); }
  finally { busy = false; save(); renderTurn(); }
}

function handleSpotifyError(e) {
  if (e && e.reason === "NO_ACTIVE_DEVICE") { showDevices(true); return; }
  if (e && e.reason === "LOGIN") { toast(e.message, 4000); render(); return; }
  toast((e && e.message) || "Spotify antwortet nicht.", 4000);
}

async function ensureTrack(g) {
  // Song ohne Spotify-Zuordnung: jetzt suchen; nicht gefunden → nächster Song
  for (let tries = 0; tries < 5; tries++) {
    const song = songById(g.current.songId);
    if (song.spotify && song.spotify.uri) return song;
    const found = await matchSong(song);
    if (found) return song;
    toast(`„${song.title}“ (${song.orq}) nicht auf Spotify gefunden${song.lastSearch && song.lastSearch.n ? ` (${song.lastSearch.n} Treffer, keiner passend)` : " (0 Treffer)"} – nächster Song.`, 4000);
    const n = nextSong(g);
    if (!n) return null;
    g.current = { songId: n.id, phase: "ready", marks: {}, pos: null };
  }
  return null;
}

actions.play = () => withBusy(async () => {
  const g = store.game, c = g.current;
  if (c.phase === "paused") {
    try { await spotifyResume(); c.phase = "playing"; return; } catch (e) { /* neu starten */ }
  }
  const song = await ensureTrack(g);
  if (!song) return;
  const cur = g.current;
  if (cur.pos === null) {
    const d = song.spotify.duration || 0;
    cur.pos = store.settings.start === "random" && d > 60000 ? Math.round(d * (0.15 + Math.random() * 0.35)) : 0;
  }
  await spotifyPlay(song.spotify.uri, cur.pos);
  cur.phase = "playing";
  const chk = await spotifyCheck(song.spotify.uri);
  if (!chk.ok && chk.unplayable) {
    // andere Aufnahme suchen und gleich nochmal
    song.spotify = null; song.status = "open"; save();
    toast(`${chk.why} Suche eine andere Aufnahme …`, 4000);
    cur.pos = null;
    return;
  }
  if (!chk.ok) {
    cur.phase = "ready";
    cur.stuck = true;   // Notlösung anbieten
    toast(chk.why, 5000);
  }
});
actions.openSpotifyStuck = (el) => {
  const c = store.game && store.game.current;
  if (c) { c.stuck = false; c.phase = "playing"; save(); }
  location.href = el.getAttribute("href");
  setTimeout(() => renderTurn(), 800);
};
actions.pause = () => withBusy(async () => { await spotifyPause(); store.game.current.phase = "paused"; });
actions.restart = () => withBusy(async () => {
  const song = songById(store.game.current.songId);
  await spotifyPlay(song.spotify.uri, store.game.current.pos || 0);
  store.game.current.phase = "playing";
});
actions.skip = () => withBusy(async () => {
  const g = store.game;
  const wasPlaying = g.current && g.current.phase === "playing";
  const n = nextSong(g);
  g.current = n ? { songId: n.id, phase: "ready", marks: {}, pos: null } : null;
  if (wasPlaying && n) {
    const song = await ensureTrack(g);
    if (song) { g.current.pos = 0; await spotifyPlay(song.spotify.uri, 0); g.current.phase = "playing"; }
  } else if (wasPlaying) await spotifyPause();
});
actions.reveal = () => {
  const c = store.game.current;
  if (!c) return;
  c.phase = "revealed"; c.marks = {};
  save(); renderTurn(); window.scrollTo(0, 0);
};
actions.mark = (el) => { const m = store.game.current.marks; m[el.dataset.k] = !m[el.dataset.k]; save(); renderTurn(); };
actions.next = () => {
  const g = store.game, c = g.current, s = store.settings;
  const song = songById(c.songId);
  const cats = guessCats(song, s);
  const pts = catPoints(cats, c.marks);
  g.players[g.turn].score += pts;
  g.history.push({ player: g.turn, songId: c.songId, song: songSnapshot(song), cats, marks: { ...c.marks }, pts });
  spotifyPause().catch(() => {});
  g.turn++;
  if (g.turn >= g.players.length) { g.turn = 0; g.round++; }
  if (g.rounds && g.round > g.rounds) { finishGame(g); save(); render(); return; }
  const n = nextSong(g);
  g.current = n ? { songId: n.id, phase: "ready", marks: {}, pos: null } : null;
  save(); render(); window.scrollTo(0, 0);
};

/* ================= Wiedergabegerät ================= */
const DEVICE_ICONS = {
  Smartphone: `<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>`,
  Computer: `<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>`,
  Speaker: `<rect x="6" y="2.5" width="12" height="19" rx="3"/><circle cx="12" cy="14" r="3.5"/><circle cx="12" cy="7" r="1.2"/>`
};

async function showDevices(noneActive = false) {
  openSheet(`<div class="sheet-head"><h3>Wiedergabegerät</h3><button class="btn ghost small" data-act="closeSheet">Fertig</button></div>
    <p class="muted">Suche Geräte …</p>`);
  let list = [];
  let err = "";
  let who = null;
  try { list = await spotifyDevices(); } catch (e) { err = e.message; }
  try { who = await spotifyMe(); } catch (e) { /* nur Anzeige */ }
  const d = $("#sheet");
  if (!d.open) return;
  const cur = store.settings.deviceId;
  d.innerHTML = `<div class="sheet-inner">
    <div class="sheet-head"><h3>Wiedergabegerät</h3><button class="btn ghost small" data-act="closeSheet">Fertig</button></div>
    ${!list.length && !err ? `<p><b>Spotify meldet gerade kein Gerät.</b></p>` : ""}
    ${err ? `<p class="danger">${esc(err)}</p>` : ""}
    ${list.length ? `<div class="card list">${list.map((x) => `
      <button class="row device ${x.id === cur ? "on" : ""}" data-act="pickDevice" data-id="${esc(x.id)}" data-name="${esc(x.name)}">
        <svg viewBox="0 0 24 24" aria-hidden="true">${DEVICE_ICONS[x.type] || DEVICE_ICONS.Speaker}</svg>
        <span class="grow">${esc(x.name)}<br><span class="muted small">${esc(x.type)}${x.is_active ? " · aktiv" : ""}</span></span>
        ${x.id === cur ? `<span class="tick" aria-label="gewählt">✓</span>` : ""}
      </button>`).join("")}</div>` : ""}
    <div class="help">
      <p><b>Gerät fehlt?</b> Öffne die Spotify-App, starte irgendeinen Song und <b>lass ihn laufen</b>. Komm dann hierher zurück – die Liste aktualisiert sich von selbst. Sobald du im Spiel auf die Platte tippst, wird der laufende Song ersetzt.</p>
      ${who ? `<p class="small">Angemeldet als <b>${esc(who.display_name || who.id)}</b>. Die Spotify-App auf diesem Handy muss mit <b>demselben Konto</b> angemeldet sein.</p>` : ""}
      <p class="muted small">Bluetooth-Boxen erscheinen hier nicht – das ist richtig so: Die App steuert Spotify auf dem iPhone, der Ton geht von dort zur Box.</p>
      <p class="muted small">Tipp: Spotify zeigt den laufenden Song auf dem Sperrbildschirm – dort also nicht hinschauen.</p>
    </div>
    <div class="row-btns">
      <a class="btn" href="spotify:">Spotify öffnen</a>
      <button class="btn primary" data-act="refreshDevices">Erneut suchen</button>
    </div>
  </div>`;
}
actions.devices = () => showDevices(false);
// Zurück aus der Spotify-App: Geräteliste automatisch neu laden
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  const d = $("#sheet");
  if (d.open && d.querySelector('[data-act="refreshDevices"]')) setTimeout(() => showDevices(false), 700);
});
actions.refreshDevices = () => showDevices(false);
actions.pickDevice = (el) => {
  store.settings.deviceId = el.dataset.id; store.settings.deviceName = el.dataset.name; save();
  closeSheet(); toast(`Wiedergabe auf ${el.dataset.name}`); render();
};
