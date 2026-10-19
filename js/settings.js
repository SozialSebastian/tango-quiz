/* Orquesta – Einstellungen, Sicherung */
"use strict";

function renderSettings() {
  const s = store.settings;
  const logged = isLoggedIn();
  $("#view").innerHTML = `
    <header class="page-head"><h1>Einstellungen</h1></header>

    <h2>Spotify</h2>
    <section class="card pad">
      <p>${logged ? `Verbunden${me && me.display_name ? ` als <b>${esc(me.display_name)}</b>` : ""}.` : "Nicht verbunden."}</p>
      <div class="row-btns">
        ${logged ? `<button class="btn" data-act="devices">Wiedergabegerät${s.deviceName ? `: ${esc(s.deviceName)}` : ""}</button>
                    <button class="btn ghost" data-act="logout">Abmelden</button>`
                 : `<button class="btn primary" data-act="login" ${clientId() ? "" : "disabled"}>Mit Spotify verbinden</button>`}
      </div>
      <label class="field"><span>Client ID</span>
        <input data-change="clientId" value="${esc(s.clientId || SPOTIFY_CLIENT_ID)}" placeholder="aus dem Spotify-Dashboard" autocomplete="off" autocapitalize="off" spellcheck="false"></label>
      <p class="muted small">Im Spotify-Dashboard als Redirect URI eintragen:</p>
      <button class="code" data-act="copyRedirect">${esc(redirectUri())}</button>
    </section>

    ${spLog.length ? `<details class="card splog"><summary class="row"><span class="grow">Spotify-Protokoll<br><span class="muted small">für die Fehlersuche – bei Problemen Bildschirmfoto schicken</span></span><span class="chev">›</span></summary>
      <div class="pad small mono">${spLog.map((x) => `<div>${esc(x.t)} · ${esc(x.m)} ${esc(x.p)} → <b>${esc(x.s)}</b>${x.e ? ` · ${esc(x.e)}` : ""}</div>`).join("")}</div></details>` : ""}

    <h2>Wiedergabe</h2>
    <section class="card list">
      <div class="row"><span class="grow">Startpunkt</span>
        <div class="seg small" role="radiogroup" aria-label="Startpunkt">
          <button role="radio" aria-checked="${s.start === "begin"}" data-act="setStart" data-v="begin">Anfang</button>
          <button role="radio" aria-checked="${s.start === "random"}" data-act="setStart" data-v="random">Zufällig</button>
        </div></div>
      <label class="row check"><span class="grow">Song wiederholen, bis „Weiter“<br><span class="muted small">sonst spielt Spotify danach etwas anderes</span></span>
        <input type="checkbox" class="switch" data-change="setRepeat" ${s.repeat ? "checked" : ""}></label>
    </section>

    <h2>Punkte</h2>
    <section class="card list">
      ${pointRow("orq", "Orchester")}
      ${pointRow("title", "Titel")}
      <label class="row check"><span class="grow">Jahr raten</span>
        <input type="checkbox" class="switch" data-change="setYear" ${s.year ? "checked" : ""}></label>
      ${s.year ? `${pointRow("year", "Jahr")}
      <div class="row"><span class="grow">Jahr zählt als richtig</span>
        <div class="seg small" role="radiogroup" aria-label="Toleranz beim Jahr">
          ${[0, 2, 5].map((t) => `<button role="radio" aria-checked="${s.yearTol === t}" data-act="setYearTol" data-v="${t}">${t ? `±${t}` : "genau"}</button>`).join("")}
        </div></div>` : ""}
      <label class="row check"><span class="grow">Sänger als Bonus<br><span class="muted small">auch „instrumental“ erkennen zählt</span></span>
        <input type="checkbox" class="switch" data-change="setSinger" ${s.singer ? "checked" : ""}></label>
      ${s.singer ? pointRow("singer", "Sänger") : ""}
    </section>

    <h2>Archiv</h2>
    <section class="card list">
      <button class="row" data-act="exportArchive"><span class="grow">Sicherung speichern<br><span class="muted small">Archiv und gespielte Spiele</span></span><span class="chev">›</span></button>
      <label class="row file-row"><span class="grow">Sicherung laden</span><span class="chev">›</span>
        <input type="file" accept="application/json,.json" data-change="importArchive" hidden></label>
      <button class="row" data-act="reseed"><span class="grow">Fehlende Standard-Songs wiederherstellen</span><span class="chev">›</span></button>
    </section>

    <h2>So geht's</h2>
    <section class="card pad help">
      <p>Wer dran ist, tippt auf die Platte. Spotify spielt den Song auf deinem iPhone (oder einer Box). Raten – laut sagen – dann <b>Aufdecken</b> und abhaken, was richtig war.</p>
      <p>Kommt kein Ton? Spotify-App öffnen, kurz irgendeinen Song starten und pausieren, zurück in die App.</p>
      <p class="muted small">Spotify zeigt den laufenden Song auf dem Sperrbildschirm und in der Dynamic Island – dort nicht hinschauen.</p>
    </section>
    <p class="muted small center">Orquesta · Archiv-Stand ${ARCHIVE_VERSION}</p>`;
}

function pointRow(k, label) {
  const v = store.settings.points[k];
  return `<div class="row"><span class="grow">${label}</span>
    <div class="stepper"><button class="icon-btn" data-act="pts" data-k="${k}" data-d="-1" aria-label="${label} weniger" ${v <= 0 ? "disabled" : ""}>−</button>
    <b aria-live="polite">${v}</b>
    <button class="icon-btn" data-act="pts" data-k="${k}" data-d="1" aria-label="${label} mehr" ${v >= 5 ? "disabled" : ""}>+</button></div></div>`;
}

actions.clientId = (el) => { store.settings.clientId = el.value.trim(); save(); renderSettings(); };
actions.logout = () => { if (confirm("Von Spotify abmelden?")) spotifyLogout(); };
actions.copyRedirect = async () => {
  try { await navigator.clipboard.writeText(redirectUri()); toast("Kopiert."); } catch (e) { toast(redirectUri()); }
};
actions.setStart = (el) => { store.settings.start = el.dataset.v; save(); renderSettings(); };
actions.setRepeat = (el) => { store.settings.repeat = el.checked; save(); };
actions.setYear = (el) => { store.settings.year = el.checked; save(); renderSettings(); };
actions.setYearTol = (el) => { store.settings.yearTol = +el.dataset.v; save(); renderSettings(); };
actions.setSinger = (el) => { store.settings.singer = el.checked; save(); renderSettings(); };
actions.pts = (el) => {
  const p = store.settings.points;
  p[el.dataset.k] = Math.min(5, Math.max(0, p[el.dataset.k] + +el.dataset.d));
  save(); renderSettings();
};

actions.exportArchive = () => {
  const data = JSON.stringify({ app: "orquesta", version: 1, exported: new Date().toISOString(), archive: store.archive, removed: store.removed, games: store.games }, null, 1);
  const blob = new Blob([data], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `orquesta-archiv-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
};

actions.importArchive = async (el) => {
  const f = el.files && el.files[0];
  if (!f) return;
  try {
    const j = JSON.parse(await f.text());
    if (!j || !Array.isArray(j.archive)) throw new Error("Keine Orquesta-Sicherung.");
    if (!confirm(`Archiv mit ${j.archive.length} Songs laden? Das aktuelle Archiv wird ersetzt.`)) return;
    store.archive = j.archive.filter((s) => s && s.id && s.orq && s.title);
    store.removed = Array.isArray(j.removed) ? j.removed : [];
    if (Array.isArray(j.games)) store.games = j.games;
    save(); toast(`${store.archive.length} Songs geladen.`); renderSettings();
  } catch (e) { toast(e.message || "Datei nicht lesbar."); }
  finally { el.value = ""; }
};

actions.reseed = () => {
  const n = seedArchive(true);
  store.tracksVersion = 0; applyFixedTracks();   // wiederhergestellte Songs bekommen ihre feste Spotify-Zuordnung
  save(); toast(n ? `${n} Standard-Songs wiederhergestellt.` : "Alle Standard-Songs sind schon da.");
};
