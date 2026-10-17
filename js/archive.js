/* Orquesta – Archiv: Songs ansehen, bearbeiten, Spotify zuordnen, Playlists importieren */
"use strict";

let archiveQuery = "";
let archiveFilter = "all";   // all | open | missing | off
let matching = null;         // { done, total } während „Alle zuordnen“

const STATUS = {
  ok: { t: "bestätigt", c: "ok" },
  auto: { t: "automatisch zugeordnet", c: "auto" },
  open: { t: "noch nicht gesucht", c: "open" },
  missing: { t: "nicht gefunden", c: "missing" }
};

function archiveList() {
  const q = norm(archiveQuery);
  return store.archive.filter((s) => {
    if (archiveFilter === "open" && s.status !== "open") return false;
    if (archiveFilter === "missing" && s.status !== "missing") return false;
    if (archiveFilter === "off" && s.active) return false;
    if (!q) return true;
    return norm(`${s.orq} ${s.title} ${s.singer || ""} ${s.year || ""}`).includes(q);
  });
}

function renderArchive() {
  const all = store.archive;
  const list = archiveList();
  const groups = new Map();
  for (const s of list) { if (!groups.has(s.orq)) groups.set(s.orq, []); groups.get(s.orq).push(s); }
  const keys = [...groups.keys()].sort((a, b) => norm(a).localeCompare(norm(b)));
  const nOpen = all.filter((s) => s.status === "open").length;
  const nMissing = all.filter((s) => s.status === "missing").length;
  const nOff = all.filter((s) => !s.active).length;

  $("#view").innerHTML = `
    <header class="page-head">
      <h1>Archiv</h1>
      <p class="muted">${all.length} Songs · ${orchestraNames().length} Orchester</p>
    </header>
    <div class="row-btns">
      <button class="btn" data-act="addSong">+ Song</button>
      <button class="btn" data-act="importPlaylist">Playlist importieren</button>
    </div>
    ${nOpen && isLoggedIn() ? `<section class="card notice">
      ${matching ? `<p>Suche auf Spotify … ${matching.done} von ${matching.total}</p><div class="bar"><span style="width:${Math.round(matching.done / matching.total * 100)}%"></span></div>`
        : `<p>${nOpen} Songs sind noch keinem Spotify-Track zugeordnet. Das passiert sonst automatisch beim ersten Abspielen.</p>
           <button class="btn" data-act="matchAll">Jetzt alle zuordnen</button>`}
    </section>` : ""}
    <input class="search" type="search" placeholder="Suchen: Orchester, Titel, Sänger, Jahr" value="${esc(archiveQuery)}" data-input="archiveSearch" aria-label="Archiv durchsuchen">
    <div class="chips">
      <button class="chip" aria-pressed="${archiveFilter === "all"}" data-act="archiveFilter" data-f="all">Alle</button>
      ${nOpen ? `<button class="chip" aria-pressed="${archiveFilter === "open"}" data-act="archiveFilter" data-f="open">Offen <span class="count">${nOpen}</span></button>` : ""}
      ${nMissing ? `<button class="chip" aria-pressed="${archiveFilter === "missing"}" data-act="archiveFilter" data-f="missing">Nicht gefunden <span class="count">${nMissing}</span></button>` : ""}
      ${nOff ? `<button class="chip" aria-pressed="${archiveFilter === "off"}" data-act="archiveFilter" data-f="off">Ausgeschaltet <span class="count">${nOff}</span></button>` : ""}
    </div>
    <div id="archive-list">${archiveGroups(keys, groups)}</div>`;
}

function archiveGroups(keys, groups) {
  if (!keys.length) return `<p class="muted center">Keine Songs gefunden.</p>`;
  return keys.map((k) => `
    <h2 class="group">${esc(k)} <span class="muted small">${groups.get(k).length}</span></h2>
    <section class="card list">
      ${groups.get(k).sort((a, b) => (a.year || 9999) - (b.year || 9999) || norm(a.title).localeCompare(norm(b.title))).map((s) => `
        <button class="row song ${s.active ? "" : "off"}" data-act="editSong" data-id="${esc(s.id)}">
          <span class="status ${STATUS[s.status]?.c || "open"}" title="${STATUS[s.status]?.t || ""}" aria-label="${STATUS[s.status]?.t || ""}"></span>
          <span class="grow"><span class="t">${esc(s.title)}</span><br>
            <span class="muted small">${[s.year, s.singer === "" ? "instrumental" : s.singer, GENRES[s.genre]].filter(Boolean).map(esc).join(" · ")}</span></span>
          <span class="chev" aria-hidden="true">›</span>
        </button>`).join("")}
    </section>`).join("");
}

// Suche ohne Neuaufbau des Eingabefelds (Tastatur bleibt offen)
document.addEventListener("input", (e) => {
  if (e.target.dataset.input !== "archiveSearch") return;
  archiveQuery = e.target.value;
  const list = archiveList();
  const groups = new Map();
  for (const s of list) { if (!groups.has(s.orq)) groups.set(s.orq, []); groups.get(s.orq).push(s); }
  $("#archive-list").innerHTML = archiveGroups([...groups.keys()].sort((a, b) => norm(a).localeCompare(norm(b))), groups);
});

actions.archiveFilter = (el) => { archiveFilter = el.dataset.f; renderArchive(); };

actions.matchAll = async () => {
  if (matching) return;
  const todo = store.archive.filter((s) => s.status === "open");
  matching = { done: 0, total: todo.length };
  renderArchive();
  let found = 0;
  try {
    for (const s of todo) {
      if (await matchSong(s)) found++;
      matching.done++;
      if (tab === "archive") renderArchive();
      await sleep(250);
    }
    toast(`${found} von ${todo.length} Songs zugeordnet.`);
  } catch (e) {
    toast(e.message || "Spotify antwortet nicht.", 4000);
  } finally {
    matching = null; save(); if (tab === "archive") renderArchive();
  }
};

/* ================= Song bearbeiten ================= */
function songForm(s) {
  return `
    <label class="field"><span>Orchester</span><input name="orq" list="orq-list" value="${esc(s.orq)}" required autocomplete="off"></label>
    <datalist id="orq-list">${[...new Set([...orchestraNames(), ...ORCHESTRAS.map((o) => o.name)])].map((o) => `<option value="${esc(o)}">`).join("")}</datalist>
    <label class="field"><span>Titel</span><input name="title" value="${esc(s.title)}" required autocomplete="off"></label>
    <div class="two">
      <label class="field"><span>Jahr</span><input name="year" inputmode="numeric" pattern="[0-9]*" value="${esc(s.year || "")}" placeholder="z. B. 1941"></label>
      <label class="field"><span>Art</span><select name="genre">${Object.entries(GENRES).map(([k, v]) => `<option value="${k}" ${s.genre === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
    </div>
    <label class="field"><span>Sänger</span><input name="singer" value="${esc(s.singer || "")}" placeholder="leer = unbekannt" autocomplete="off"></label>
    <label class="row check plain-row"><input type="checkbox" name="instrumental" ${s.singer === "" ? "checked" : ""}><span>Instrumental</span></label>`;
}

function readForm(d, s) {
  const f = (n) => d.querySelector(`[name="${n}"]`);
  const orq = f("orq").value.trim(), title = f("title").value.trim();
  if (!orq || !title) { toast("Orchester und Titel ausfüllen."); return false; }
  const changedIdentity = orq !== s.orq || title !== s.title;
  s.orq = orq; s.title = title;
  const y = parseInt(f("year").value, 10);
  s.year = y >= 1900 && y <= 2100 ? y : null;
  s.genre = f("genre").value;
  s.singer = f("instrumental").checked ? "" : (f("singer").value.trim() || null);
  if (changedIdentity && s.status !== "ok") { s.spotify = null; s.status = "open"; }
  return true;
}

function spotifyBlock(s) {
  const sp = s.spotify;
  return `
    <h3 class="sub">Spotify</h3>
    ${sp ? `<div class="track card">
        ${sp.image ? `<img src="${esc(sp.image)}" alt="" width="48" height="48">` : ""}
        <span class="grow"><b>${esc(sp.name)}</b><br><span class="muted small">${esc(sp.artists)}${sp.album ? ` · ${esc(sp.album)}` : ""}${sp.release ? ` (${esc(sp.release.slice(0, 4))})` : ""}</span></span>
      </div>
      <p class="muted small">Status: ${STATUS[s.status]?.t || ""}</p>
      <div class="row-btns">
        <button class="btn" data-act="preview" data-uri="${esc(sp.uri)}">▶ Probehören</button>
        ${s.status !== "ok" ? `<button class="btn" data-act="confirmTrack" data-id="${esc(s.id)}">✓ Passt</button>` : ""}
      </div>` : `<p class="muted">${s.status === "missing" ? `Nicht automatisch gefunden${s.lastSearch ? ` – ${s.lastSearch.n} Treffer${s.lastSearch.best ? `, bester: ${esc(s.lastSearch.best)}` : ""}` : ""}.` : "Noch nicht zugeordnet."}</p>`}
    <div class="row-btns">
      <button class="btn" data-act="findTracks" data-id="${esc(s.id)}" ${isLoggedIn() ? "" : "disabled"}>Auf Spotify suchen</button>
    </div>
    <label class="field"><span>…oder Spotify-Link einfügen</span>
      <input data-link-for="${esc(s.id)}" placeholder="https://open.spotify.com/track/…" autocomplete="off"></label>
    <div id="candidates"></div>`;
}

actions.editSong = (el) => {
  const s = songById(el.dataset.id);
  if (!s) return;
  closeSheet();
  openSheet(`
    <div class="sheet-head"><h3>Song</h3><button class="btn primary small" data-act="saveSong" data-id="${esc(s.id)}">Sichern</button></div>
    <form class="form" onsubmit="return false">${songForm(s)}
      <label class="row check plain-row"><input type="checkbox" name="active" ${s.active ? "checked" : ""}><span>Im Spiel verwenden</span></label>
    </form>
    ${spotifyBlock(s)}
    <button class="btn danger-ghost" data-act="deleteSong" data-id="${esc(s.id)}">Song löschen</button>`, () => render());
};

actions.saveSong = (el) => {
  const s = songById(el.dataset.id);
  const d = $("#sheet");
  if (!readForm(d, s)) return;
  s.active = d.querySelector('[name="active"]').checked;
  const link = d.querySelector("[data-link-for]");
  if (link && link.value.trim()) { setTrackFromLink(s, link.value.trim()); return; }
  save(); closeSheet(); toast("Gesichert.");
};

async function setTrackFromLink(s, value) {
  const id = parseSpotifyId(value, "track");
  if (!id) { toast("Das ist kein Spotify-Song-Link."); return; }
  try {
    const t = await trackById(id);
    s.spotify = trackInfo(t); s.status = "ok";
    save(); closeSheet(); toast("Song zugeordnet.");
  } catch (e) { toast(e.message, 4000); }
}

actions.addSong = () => {
  const s = { id: "eigen-" + uid(), orq: "", title: "", year: null, singer: null, genre: "tango", active: true, source: "eigen", spotify: null, status: "open" };
  openSheet(`
    <div class="sheet-head"><h3>Song hinzufügen</h3><button class="btn primary small" data-act="createSong">Hinzufügen</button></div>
    <form class="form" onsubmit="return false">${songForm(s)}</form>
    <label class="field"><span>Spotify-Link (optional)</span><input name="link" placeholder="https://open.spotify.com/track/…" autocomplete="off"></label>
    <p class="muted small">Ohne Link sucht die App den Song selbst auf Spotify.</p>`, () => render());
  actions.createSong = async () => {
    const d = $("#sheet");
    if (!readForm(d, s)) return;
    const link = d.querySelector('[name="link"]').value.trim();
    if (store.archive.some((x) => norm(x.orq) === norm(s.orq) && norm(x.title) === norm(s.title) && (x.year || 0) === (s.year || 0))) {
      if (!confirm("Diesen Song gibt es schon im Archiv. Trotzdem hinzufügen?")) return;
    }
    store.archive.push(s);
    if (link) { await setTrackFromLink(s, link); return; }
    save(); closeSheet(); toast("Song hinzugefügt.");
  };
};

actions.deleteSong = (el) => {
  const s = songById(el.dataset.id);
  if (!s || !confirm(`„${s.title}“ (${s.orq}) aus dem Archiv löschen?`)) return;
  store.archive = store.archive.filter((x) => x.id !== s.id);
  if (s.source === "archiv") store.removed.push(s.id);
  save(); closeSheet();
};

actions.confirmTrack = (el) => {
  const s = songById(el.dataset.id);
  s.status = "ok"; save(); toast("Zuordnung bestätigt."); actions.editSong(el);
};

actions.findTracks = async (el) => {
  const s = songById(el.dataset.id);
  const d = $("#sheet");
  readForm(d, s);
  const box = $("#candidates");
  box.innerHTML = `<p class="muted">Suche …</p>`;
  try {
    const c = await findCandidates(s);
    if (!c.length) { box.innerHTML = `<p class="muted">Nichts gefunden. Versuch es mit einem Spotify-Link.</p>`; return; }
    window.__cands = c.map((x) => x.t);
    box.innerHTML = `<div class="card list">${c.slice(0, 10).map((x, i) => {
      const t = trackInfo(x.t);
      return `<div class="row cand">
        ${t.image ? `<img src="${esc(t.image)}" alt="" width="40" height="40">` : ""}
        <span class="grow"><b>${esc(t.name)}</b><br><span class="muted small">${esc(t.artists)} · ${esc(t.album)}${t.release ? ` (${esc(t.release.slice(0, 4))})` : ""}</span></span>
        <button class="icon-btn" data-act="preview" data-uri="${esc(t.uri)}" aria-label="Probehören"><svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z"/></svg></button>
        <button class="btn small" data-act="pickCand" data-i="${i}" data-id="${esc(s.id)}">Wählen</button>
      </div>`;
    }).join("")}</div>`;
  } catch (e) { box.innerHTML = `<p class="danger">${esc(e.message)}</p>`; }
};

actions.pickCand = (el) => {
  const s = songById(el.dataset.id);
  const t = window.__cands && window.__cands[+el.dataset.i];
  if (!t) return;
  const d = $("#sheet");
  readForm(d, s);
  s.active = d.querySelector('[name="active"]').checked;
  s.spotify = trackInfo(t); s.status = "ok";
  save(); closeSheet(); toast("Song zugeordnet.");
};

actions.preview = async (el) => {
  try { await spotifyPlay(el.dataset.uri, 0); toast("Läuft auf Spotify."); }
  catch (e) { handleSpotifyError(e); }
};

/* ================= Playlist-Import ================= */
actions.importPlaylist = async () => {
  if (!isLoggedIn()) { toast("Bitte zuerst mit Spotify verbinden."); return; }
  openSheet(`
    <div class="sheet-head"><h3>Playlist importieren</h3><button class="btn ghost small" data-act="closeSheet">Abbrechen</button></div>
    <label class="field"><span>Link zur Playlist</span><input id="pl-link" placeholder="https://open.spotify.com/playlist/…" autocomplete="off"></label>
    <button class="btn primary" data-act="loadPlaylistLink">Laden</button>
    <h3 class="sub">Deine Playlists</h3>
    <div id="pl-list"><p class="muted">Lade …</p></div>
    <p class="muted small">Spotify gibt nur eigene oder gemeinsame Playlists frei. Fremde Playlists vorher in Spotify in eine eigene kopieren.</p>`, () => render());
  try {
    const [mine, list] = await Promise.all([spotifyMe(), myPlaylists()]);
    const own = list.filter((p) => p.owner && p.owner.id === mine.id || p.collaborative);
    const box = $("#pl-list");
    if (!box) return;
    box.innerHTML = own.length ? `<div class="card list">${own.map((p) => {
      const n = (p.items && p.items.total) ?? (p.tracks && p.tracks.total);
      return `<button class="row" data-act="previewPlaylist" data-id="${esc(p.id)}" data-name="${esc(p.name)}">
        <span class="grow">${esc(p.name)}${n !== undefined ? `<br><span class="muted small">${n} Songs</span>` : ""}</span><span class="chev">›</span></button>`;
    }).join("")}</div>` : `<p class="muted">Keine eigenen Playlists gefunden.</p>`;
  } catch (e) { const box = $("#pl-list"); if (box) box.innerHTML = `<p class="danger">${esc(e.message)}</p>`; }
};

actions.loadPlaylistLink = async () => {
  const id = parseSpotifyId($("#pl-link").value, "playlist");
  if (!id) { toast("Das ist kein Playlist-Link."); return; }
  let name = "Playlist";
  try { name = (await playlistInfo(id)).name || name; } catch (e) { /* Name ist nur Kosmetik */ }
  actions.previewPlaylist({ dataset: { id, name } });
};

actions.previewPlaylist = async (el) => {
  const { id, name } = el.dataset;
  const d = $("#sheet");
  d.querySelector(".sheet-inner").innerHTML = `<div class="sheet-head"><h3>${esc(name)}</h3><button class="btn ghost small" data-act="closeSheet">Abbrechen</button></div><p class="muted">Lade Songs …</p>`;
  try {
    const tracks = await playlistTracks(id);
    const songs = tracks.map(trackToSong);
    const known = new Set(store.archive.map((s) => s.spotify && s.spotify.id).filter(Boolean));
    const keyOf = (s) => `${norm(s.orq)}|${norm(s.title)}`;
    const knownKeys = new Set(store.archive.map(keyOf));
    const fresh = [];
    for (const s of songs) {
      if (known.has(s.spotify.id) || knownKeys.has(keyOf(s))) continue;
      known.add(s.spotify.id); knownKeys.add(keyOf(s)); fresh.push(s);
    }
    window.__import = fresh;
    d.querySelector(".sheet-inner").innerHTML = `
      <div class="sheet-head"><h3>${esc(name)}</h3><button class="btn primary small" data-act="doImport" ${fresh.length ? "" : "disabled"}>${fresh.length} importieren</button></div>
      <p class="muted">${tracks.length} Songs in der Playlist, ${tracks.length - fresh.length} davon schon im Archiv.</p>
      ${fresh.length ? `<p class="muted small">Orchester, Sänger, Jahr und Art liest die App aus den Spotify-Angaben – prüf sie kurz und korrigiere bei Bedarf später im Archiv.</p>
      <div class="card list">${fresh.slice(0, 200).map((s) => `<div class="row"><span class="grow"><b>${esc(s.title)}</b><br>
        <span class="muted small">${[s.orq, s.year, s.singer, GENRES[s.genre]].filter(Boolean).map(esc).join(" · ")}</span></span></div>`).join("")}</div>` : ""}`;
  } catch (e) {
    d.querySelector(".sheet-inner").innerHTML = `<div class="sheet-head"><h3>${esc(name)}</h3><button class="btn ghost small" data-act="closeSheet">Schließen</button></div><p class="danger">${esc(e.message)}</p>`;
  }
};

actions.doImport = () => {
  const list = window.__import || [];
  store.archive.push(...list);
  save(); closeSheet();
  toast(`${list.length} Songs importiert.`);
  archiveFilter = "all";
};
