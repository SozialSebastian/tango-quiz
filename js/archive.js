/* Orquesta – Archiv ansehen (nur lesen). Änderungen und Korrekturen ausschließlich im Code. */
"use strict";

let archiveQuery = "";
let archiveLevel = "alle";   // alle | leicht | mittel | schwer

function archiveList() {
  const q = norm(archiveQuery);
  return store.archive.filter((s) => {
    if (archiveLevel !== "alle" && songLevel(s) !== archiveLevel) return false;
    if (!q) return true;
    return norm(`${s.orq} ${s.title} ${s.singer || ""} ${s.year || ""}`).includes(q);
  });
}

function groupHtml() {
  const groups = new Map();
  for (const s of archiveList()) { if (!groups.has(s.orq)) groups.set(s.orq, []); groups.get(s.orq).push(s); }
  const keys = [...groups.keys()].sort((a, b) => norm(a).localeCompare(norm(b)));
  if (!keys.length) return `<p class="muted center">Keine Songs gefunden.</p>`;
  return keys.map((k) => `
    <h2 class="group">${esc(k)} <span class="muted small">${groups.get(k).length}</span></h2>
    <section class="card list">
      ${groups.get(k).sort((a, b) => (a.year || 9999) - (b.year || 9999) || norm(a.title).localeCompare(norm(b.title))).map((s) => `
        <button class="row song" data-act="showSong" data-id="${esc(s.id)}">
          <span class="grow"><span class="t">${esc(s.title)}</span><br>
            <span class="muted small">${[s.year, s.singer === "" ? "instrumental" : s.singer, GENRES[s.genre]].filter(Boolean).map(esc).join(" · ")}</span></span>
          <span class="lv lv-${songLevel(s)}">${LEVELS[songLevel(s)]}</span>
        </button>`).join("")}
    </section>`).join("");
}

function renderArchive() {
  const all = store.archive;
  const cnt = (l) => all.filter((s) => songLevel(s) === l).length;
  $("#view").innerHTML = `
    <header class="page-head">
      <h1>Archiv</h1>
      <p class="muted">${all.length} Songs · ${orchestraNames().length} Orchester</p>
    </header>
    <input class="search" type="search" placeholder="Suchen: Orchester, Titel, Sänger, Jahr" value="${esc(archiveQuery)}" data-input="archiveSearch" aria-label="Archiv durchsuchen">
    <div class="chips">
      <button class="chip" aria-pressed="${archiveLevel === "alle"}" data-act="archiveLevel" data-l="alle">Alle</button>
      ${Object.entries(LEVELS).map(([k, v]) => `<button class="chip" aria-pressed="${archiveLevel === k}" data-act="archiveLevel" data-l="${k}">${v} <span class="count">${cnt(k)}</span></button>`).join("")}
    </div>
    <div id="archive-list">${groupHtml()}</div>`;
}

// Suche ohne Neuaufbau des Eingabefelds (Tastatur bleibt offen)
document.addEventListener("input", (e) => {
  if (e.target.dataset.input !== "archiveSearch") return;
  archiveQuery = e.target.value;
  $("#archive-list").innerHTML = groupHtml();
});

actions.archiveLevel = (el) => { archiveLevel = el.dataset.l; renderArchive(); };

// Song-Details (nur ansehen, Probehören)
actions.showSong = (el) => {
  const s = songById(el.dataset.id);
  if (!s) return;
  const sp = s.spotify;
  const row = (k, v) => v ? `<div class="row"><span class="muted grow">${k}</span><span>${esc(v)}</span></div>` : "";
  openSheet(`
    <div class="sheet-head"><h3>${esc(s.title)}</h3><button class="btn ghost small" data-act="closeSheet">Fertig</button></div>
    <section class="card list">
      ${row("Orchester", s.orq)}
      ${row("Jahr", s.year)}
      ${row("Sänger", s.singer === "" ? "instrumental" : s.singer)}
      ${row("Art", GENRES[s.genre])}
      ${row("Schwierigkeit", LEVELS[songLevel(s)])}
    </section>
    ${sp ? `<div class="track card">
        ${sp.image ? `<img src="${esc(sp.image)}" alt="" width="48" height="48">` : ""}
        <span class="grow"><b>${esc(sp.name)}</b><br><span class="muted small">${esc(sp.artists)}${sp.album ? ` · ${esc(sp.album)}` : ""}</span></span>
      </div>
      <div class="row-btns"><button class="btn" data-act="preview" data-uri="${esc(sp.uri)}" ${isLoggedIn() ? "" : "disabled"}>▶ Probehören</button></div>`
      : `<p class="muted small">Noch keine Spotify-Aufnahme hinterlegt – wird beim ersten Abspielen gesucht.</p>`}`);
};

actions.preview = async (el) => {
  try { await spotifyPlay(el.dataset.uri, 0); toast("Läuft auf Spotify."); }
  catch (e) { handleSpotifyError(e); }
};
