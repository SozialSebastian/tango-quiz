/* Orquesta – Speicher, Hilfsfunktionen, Navigation */
"use strict";

/* Hier die Client ID aus dem Spotify-Dashboard eintragen (sie ist öffentlich, kein Geheimnis).
   Alternativ in der App unter Einstellungen → Spotify eingeben. */
const SPOTIFY_CLIENT_ID = "8c751573d816430b8ce84dd65f97ca1c";

const STORE_KEY = "orquesta.v1";   // Schlüssel nie ändern, sonst sind Archiv und Spielstände weg
const AUTH_KEY = "orquesta.auth";

/* ================= Hilfen ================= */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Math.random().toString(36).slice(2, 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Vergleichsform: klein, ohne Akzente, ohne Satzzeichen
function norm(s) {
  return String(s || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’'`´]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Titel ohne Zusätze wie „(Remastered)“, „- 1938“, „feat. …“
function cleanTitle(s) {
  return String(s || "")
    .replace(/\s*[\(\[][^\)\]]*[\)\]]\s*/g, " ")
    .replace(/\s+-\s+.*$/, "")
    .replace(/\s+(feat|ft)\.?\s+.*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const GENRES = { tango: "Tango", vals: "Vals", milonga: "Milonga" };

/* ================= Speicher ================= */
const DEFAULT_SETTINGS = {
  clientId: "",
  points: { orq: 1, title: 1, year: 1, singer: 1 },
  year: true,           // Jahr raten
  yearTol: 2,           // Jahr zählt als richtig bei ± so vielen Jahren (0 = genau)
  singer: false,        // Sänger als Bonus raten
  start: "begin",       // begin | random
  repeat: true,         // Song läuft in Schleife, bis „Weiter“
  rounds: 5,            // Runden pro Spieler, 0 = ohne Ende
  genres: { tango: true, vals: true, milonga: true },
  orchestras: [],       // leer = alle
  deviceId: "",
  deviceName: ""
};

function loadStore() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(STORE_KEY) || "null"); } catch (e) { s = null; }
  s = s && typeof s === "object" ? s : {};
  s.archive = Array.isArray(s.archive) ? s.archive : [];
  s.players = Array.isArray(s.players) && s.players.length ? s.players : ["Spieler 1", "Spieler 2"];
  s.settings = { ...DEFAULT_SETTINGS, ...(s.settings || {}) };
  s.settings.points = { ...DEFAULT_SETTINGS.points, ...(s.settings.points || {}) };
  s.settings.genres = { ...DEFAULT_SETTINGS.genres, ...(s.settings.genres || {}) };
  s.game = s.game || null;
  s.games = Array.isArray(s.games) ? s.games : [];      // abgeschlossene Spiele, neueste zuerst
  s.seedVersion = s.seedVersion || 0;
  s.removed = Array.isArray(s.removed) ? s.removed : [];   // gelöschte Standard-Songs nicht wieder anlegen
  // Version 2: Songs, die wegen eines verschluckten Suchfehlers als „nicht gefunden“ markiert wurden, neu suchen
  if ((s.fix || 0) < 2) { for (const x of s.archive) if (x.status === "missing") x.status = "open"; s.fix = 2; }
  return s;
}

let store = loadStore();
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); }
  catch (e) { toast("Speichern fehlgeschlagen – ist der Speicher voll?"); }
}

/* Standard-Archiv einspielen: neue Standard-Songs ergänzen, eigene Änderungen bleiben */
function songId(orq, title, year) { return norm(`${orq} ${title} ${year || ""}`).replace(/ /g, "-"); }
function seedArchive(force = false) {
  if (!force && store.seedVersion >= ARCHIVE_VERSION) return false;
  const have = new Set(store.archive.map((s) => s.id));
  let added = 0;
  for (const [orq, title, year, singer, genre] of ARCHIVE_DEFAULT) {
    const id = songId(orq, title, year);
    if (have.has(id) || (!force && store.removed.includes(id))) continue;
    store.archive.push({ id, orq, title, year, singer, genre, active: true, source: "archiv", spotify: null, status: "open" });
    added++;
  }
  if (force) store.removed = [];
  store.seedVersion = ARCHIVE_VERSION;
  return added;
}

function orchestraNames() {
  const set = new Set(store.archive.map((s) => s.orq).filter(Boolean));
  return [...set].sort((a, b) => norm(a).localeCompare(norm(b)));
}

/* Langen Künstlernamen auf das Orchester zurückführen */
function orchestraFromArtist(name) {
  const n = norm(name);
  let best = null;
  for (const o of ORCHESTRAS) for (const k of o.keys) {
    if (n.includes(k) && (!best || k.length > best.k.length)) best = { k, name: o.name };
  }
  if (best) return best.name;
  return String(name || "")
    .replace(/\s+y\s+su\s+orquesta.*$/i, "")
    .replace(/^orquesta\s+t[ií]pica\s+/i, "")
    .replace(/\s+orquesta\s+t[ií]pica.*$/i, "")
    .trim();
}

/* ================= Oberfläche ================= */
let tab = "game";

function setTab(t) { tab = t; render(); window.scrollTo(0, 0); }

function render() {
  $$(".tabbar button").forEach((b) => { if (b.dataset.tab === tab) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
  if (tab === "game") renderGame();
  else if (tab === "archive") renderArchive();
  else renderSettings();
}

let toastTimer = 0;
function toast(msg, ms = 2600) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), ms);
}

/* Unteres Blatt (Dialog) */
function openSheet(html, onClose) {
  const d = $("#sheet");
  d.innerHTML = `<div class="sheet-inner">${html}</div>`;
  d.onclose = () => { d.innerHTML = ""; if (onClose) onClose(); };
  if (!d.open) d.showModal();
  return d;
}
function closeSheet() { const d = $("#sheet"); if (d.open) d.close(); }

/* Klicks über data-act verteilen */
const actions = {};
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]");
  if (!el) return;
  const fn = actions[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el, e); }
});
document.addEventListener("change", (e) => {
  const el = e.target.closest("[data-change]");
  if (!el) return;
  const fn = actions[el.dataset.change];
  if (fn) fn(el, e);
});
// Klick auf den abgedunkelten Hintergrund schließt das Blatt
document.addEventListener("click", (e) => { const d = $("#sheet"); if (e.target === d) d.close(); });

$$(".tabbar button").forEach((b) => b.addEventListener("click", () => { tab = b.dataset.tab; render(); window.scrollTo(0, 0); }));
