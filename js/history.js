/* Orquesta – Gespielte Spiele: speichern, Liste, Details (wer hat was erkannt) */
"use strict";

let showAllGames = false;

// Kopie der Song-Angaben, damit der Verlauf stimmt, auch wenn der Song später geändert oder gelöscht wird
function songSnapshot(s) {
  return s ? { orq: s.orq, title: s.title, year: s.year || null, singer: s.singer ?? null, genre: s.genre } : null;
}

function finishedRecord(g) {
  return {
    id: g.savedId || "g-" + uid(),
    date: g.endedAt || new Date().toISOString(),
    players: g.players.map((p) => ({ name: p.name, score: p.score })),
    turns: g.history.map((h) => ({
      player: h.player,
      song: h.song || songSnapshot(songById(h.songId)) || { orq: "?", title: "?" },
      cats: h.cats || [{ k: "orq", label: "Orchester" }, { k: "title", label: "Titel" }],
      marks: h.marks || {},
      pts: h.pts || 0
    }))
  };
}

function finishGame(g) {
  g.finished = true;
  if (g.savedId) return;
  g.endedAt = new Date().toISOString();
  const rec = finishedRecord(g);
  g.savedId = rec.id;
  if (rec.turns.length) {
    store.games.unshift(rec);
    if (store.games.length > 100) store.games.length = 100;
  }
}

function ranking(rec) { return rec.players.map((p, i) => ({ ...p, i })).sort((a, b) => b.score - a.score); }
function winnerText(rec) {
  const r = ranking(rec);
  if (!r.length) return "–";
  if (r.length > 1 && r[0].score === r[1].score) return "Unentschieden";
  return r[0].name;
}
const fmtDate = (iso) => new Date(iso).toLocaleString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

// „Orchester 2/3 · Titel 1/3 · Jahr 0/2“ für einen Spieler
function playerStats(rec, i) {
  const turns = rec.turns.filter((t) => t.player === i);
  const keys = [];
  for (const t of turns) for (const c of t.cats) if (!keys.find((k) => k.k === c.k)) keys.push({ k: c.k, label: c.k === "year" ? "Jahr" : c.k === "singer" ? "Sänger" : c.label });
  return keys.map((k) => {
    const offered = turns.filter((t) => t.cats.some((c) => c.k === k.k));
    return `${k.label} ${offered.filter((t) => t.marks[k.k]).length}/${offered.length}`;
  }).join(" · ");
}

function turnHtml(t, withPlayer, rec) {
  const s = t.song;
  const meta = [s.year, s.singer === "" ? "instrumental" : s.singer].filter(Boolean).map(esc).join(" · ");
  return `<div class="turn">
    <div class="turn-top">
      <span class="grow"><b>${esc(s.title)}</b> <span class="muted">· ${esc(s.orq)}</span>${meta ? `<br><span class="muted small">${meta}</span>` : ""}</span>
      <span class="turn-pts ${t.pts ? "" : "zero"}">${t.pts ? `+${t.pts}` : "0"}</span>
    </div>
    <div class="ticks">
      ${withPlayer ? `<span class="who-small" style="--c:var(--p${(t.player % 6) + 1})">${esc(rec.players[t.player].name)}</span>` : ""}
      ${t.cats.map((c) => `<span class="tickchip ${t.marks[c.k] ? "yes" : "no"}">${t.marks[c.k] ? "✓" : "✗"} ${esc(c.label)}</span>`).join("")}
    </div>
  </div>`;
}

function gameDetailHtml(rec) {
  const r = ranking(rec);
  return `
    <section class="card list">
      ${r.map((p, place) => {
        const turns = rec.turns.filter((t) => t.player === p.i);
        return `<details class="pl">
          <summary class="row rank">
            <span class="place">${place + 1}</span>
            <span class="dot" style="--c:var(--p${(p.i % 6) + 1})"></span>
            <span class="grow"><b>${esc(p.name)}</b><br><span class="muted small">${playerStats(rec, p.i) || "keine Songs"}</span></span>
            <span class="big-pts">${p.score}</span>
            <span class="chev" aria-hidden="true">›</span>
          </summary>
          <div class="turns">${turns.length ? turns.map((t) => turnHtml(t, false, rec)).join("") : `<p class="muted small">Keine Songs gespielt.</p>`}</div>
        </details>`;
      }).join("")}
    </section>
    ${rec.turns.length ? `<details class="card all-turns">
      <summary class="row"><span class="grow">Alle Songs der Reihe nach</span><span class="chev" aria-hidden="true">›</span></summary>
      <div class="turns">${rec.turns.map((t) => turnHtml(t, true, rec)).join("")}</div>
    </details>` : ""}`;
}

function pastGamesHtml() {
  const games = store.games;
  if (!games.length) return "";
  const list = showAllGames ? games : games.slice(0, 5);
  return `
    <h2>Gespielte Spiele</h2>
    <section class="card list">
      ${list.map((rec) => `<button class="row past" data-act="openPastGame" data-id="${esc(rec.id)}">
        <span class="grow"><span class="muted small">${esc(fmtDate(rec.date))}</span><br>
          <b>${esc(winnerText(rec))}</b> <span class="muted small">${ranking(rec).map((p) => `${esc(p.name)} ${p.score}`).join(" · ")}</span></span>
        <span class="chev" aria-hidden="true">›</span>
      </button>`).join("")}
      ${games.length > 5 && !showAllGames ? `<button class="row add" data-act="showAllGames">Alle ${games.length} Spiele anzeigen</button>` : ""}
    </section>`;
}

actions.showAllGames = () => { showAllGames = true; renderSetup(); };

actions.openPastGame = (el) => {
  const rec = store.games.find((x) => x.id === el.dataset.id);
  if (!rec) return;
  openSheet(`
    <div class="sheet-head"><h3>${esc(winnerText(rec))}</h3><button class="btn ghost small" data-act="closeSheet">Fertig</button></div>
    <p class="muted">${esc(fmtDate(rec.date))} · ${rec.turns.length} Songs · Tippe auf einen Namen für die Details</p>
    ${gameDetailHtml(rec)}
    <button class="btn danger-ghost" data-act="deletePastGame" data-id="${esc(rec.id)}">Spiel aus dem Verlauf löschen</button>`, () => render());
};

actions.deletePastGame = (el) => {
  if (!confirm("Dieses Spiel aus dem Verlauf löschen?")) return;
  store.games = store.games.filter((x) => x.id !== el.dataset.id);
  save(); closeSheet();
};
