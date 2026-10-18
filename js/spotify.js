/* Orquesta – Spotify: Login (PKCE), Wiedergabe über Spotify Connect, Suche, Playlist-Import
   Kein Server nötig: Die App meldet sich direkt bei Spotify an und steuert die Spotify-App fern. */
"use strict";

const SP_AUTH = "https://accounts.spotify.com/authorize";
const SP_TOKEN = "https://accounts.spotify.com/api/token";
const SP_API = "https://api.spotify.com/v1";
const SP_SCOPES = "user-read-playback-state user-modify-playback-state playlist-read-private playlist-read-collaborative";

class SpotifyError extends Error {
  constructor(status, reason, message) { super(message || reason || `Spotify ${status}`); this.status = status; this.reason = reason || ""; }
}

function clientId() { return (store.settings.clientId || SPOTIFY_CLIENT_ID || "").trim(); }
function redirectUri() { return location.origin + location.pathname.replace(/index\.html$/, ""); }

function loadAuth() { try { return JSON.parse(localStorage.getItem(AUTH_KEY) || "{}") || {}; } catch (e) { return {}; } }
function saveAuth(a) { localStorage.setItem(AUTH_KEY, JSON.stringify(a)); }
let auth = loadAuth();
const isLoggedIn = () => !!(auth.refresh || (auth.access && auth.expires > Date.now()));

function b64url(bytes) {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/* ================= Anmeldung ================= */
async function spotifyLogin() {
  const id = clientId();
  if (!id) { toast("Zuerst die Client ID in den Einstellungen eintragen."); setTab("settings"); return; }
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(64)));
  const challenge = b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  const state = b64url(crypto.getRandomValues(new Uint8Array(12)));
  auth = { ...auth, verifier, state };
  saveAuth(auth);
  const u = new URL(SP_AUTH);
  u.search = new URLSearchParams({
    response_type: "code", client_id: id, scope: SP_SCOPES, redirect_uri: redirectUri(),
    state, code_challenge_method: "S256", code_challenge: challenge
  }).toString();
  location.assign(u.toString());
}

function spotifyLogout() {
  auth = {};
  saveAuth(auth);
  me = null;
  toast("Von Spotify abgemeldet.");
  render();
}

// Rückkehr von Spotify: ?code=…&state=… gegen Token tauschen
async function handleSpotifyCallback() {
  const sp = new URLSearchParams(location.search);
  const code = sp.get("code"), err = sp.get("error"), state = sp.get("state");
  if (!code && !err) return false;
  history.replaceState(null, "", location.pathname);
  if (err) { toast(err === "access_denied" ? "Spotify-Anmeldung abgebrochen." : `Spotify meldet: ${err}`); return true; }
  if (!auth.verifier || state !== auth.state) {
    toast("Anmeldung nicht zuordenbar. Bitte in der App vom Home-Bildschirm erneut verbinden.", 5000);
    return true;
  }
  try {
    const res = await fetch(SP_TOKEN, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri(), client_id: clientId(), code_verifier: auth.verifier })
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error_description || j.error || res.status);
    auth = { access: j.access_token, refresh: j.refresh_token, expires: Date.now() + (j.expires_in || 3600) * 1000 };
    saveAuth(auth);
    toast("Mit Spotify verbunden.");
  } catch (e) {
    toast(`Anmeldung fehlgeschlagen: ${e.message}`, 5000);
  }
  return true;
}

let refreshing = null;
async function accessToken() {
  if (auth.access && auth.expires - 60000 > Date.now()) return auth.access;
  if (!auth.refresh) throw new SpotifyError(401, "LOGIN", "Nicht mit Spotify verbunden.");
  if (!refreshing) {
    refreshing = (async () => {
      const res = await fetch(SP_TOKEN, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: auth.refresh, client_id: clientId() })
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (j.error === "invalid_grant") { auth = {}; saveAuth(auth); }
        throw new SpotifyError(401, "LOGIN", "Spotify-Anmeldung abgelaufen – bitte neu verbinden.");
      }
      auth = { ...auth, access: j.access_token, refresh: j.refresh_token || auth.refresh, expires: Date.now() + (j.expires_in || 3600) * 1000 };
      saveAuth(auth);
      return auth.access;
    })().finally(() => { refreshing = null; });
  }
  return refreshing;
}

/* ================= Web API ================= */
/* Protokoll der letzten Spotify-Anfragen (für die Fehlersuche, sichtbar in den Einstellungen) */
const spLog = [];
function logSp(entry) {
  spLog.unshift({ t: new Date().toLocaleTimeString("de-DE"), ...entry });
  if (spLog.length > 15) spLog.length = 15;
}

async function api(path, { method = "GET", query, body } = {}, retried = false) {
  const token = await accessToken();
  const u = new URL(SP_API + path);
  if (query) for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, v);
  const res = await fetch(u.toString(), {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!path.startsWith("/search")) logSp({ m: method, p: path, s: res.status });
  if (res.status === 401 && !retried) { auth.expires = 0; return api(path, { method, query, body }, true); }
  if (res.status === 204 || res.status === 202) return null;
  const text = await res.text();
  let j = null;
  try { j = text ? JSON.parse(text) : null; } catch (e) { j = null; }
  if (!res.ok) {
    const er = (j && j.error) || {};
    if (spLog[0] && spLog[0].p === path) spLog[0].e = [er.reason, er.message].filter(Boolean).join(" – ");
    throw new SpotifyError(res.status, er.reason || "", spotifyMessage(res.status, er.reason, er.message, res.headers.get("retry-after")));
  }
  return j;
}

function spotifyMessage(status, reason, msg, retry) {
  if (reason === "NO_ACTIVE_DEVICE" || (status === 404 && /device/i.test(msg || ""))) return "Kein aktives Spotify-Gerät gefunden.";
  if (reason === "PREMIUM_REQUIRED") return "Für die Wiedergabe ist Spotify Premium nötig.";
  if (status === 403 && /not registered|developer dashboard/i.test(msg || "")) return "Dieses Spotify-Konto ist im Spotify-Dashboard nicht unter „User Management“ eingetragen.";
  if (reason === "QUOTA_EXCEEDED") {
    const h = retry ? Math.ceil(+retry / 3600) : 0;
    return `Spotify-Kontingent aufgebraucht – Spotify sperrt die App ${h ? `für ca. ${h} Std.` : "vorübergehend"}. Danach geht es wieder.`;
  }
  if (status === 429) return `Zu viele Anfragen an Spotify – bitte ${retry ? `${retry} s` : "kurz"} warten.`;
  return msg || `Spotify-Fehler ${status}`;
}

let me = null;
async function spotifyMe() {
  if (me) return me;
  me = await api("/me");
  return me;
}

/* ================= Wiedergabe ================= */
async function spotifyDevices() {
  const j = await api("/me/player/devices");
  return (j && j.devices) || [];
}

// passendes Gerät: gewähltes, sonst aktives, sonst Smartphone, sonst erstes
async function pickDevice() {
  const list = await spotifyDevices();
  const s = store.settings;
  let d = list.find((x) => x.id === s.deviceId) || list.find((x) => s.deviceName && x.name === s.deviceName);
  if (!d) d = list.find((x) => x.is_active) || list.find((x) => x.type === "Smartphone") || list[0];
  if (d && d.id !== s.deviceId) { s.deviceId = d.id; s.deviceName = d.name; save(); }
  return d || null;
}

let repeatSetFor = "";   // Wiederholen nur einmal pro Gerät setzen (spart Anfragen)
async function spotifyPlay(uri, positionMs = 0) {
  const body = { uris: [uri], position_ms: Math.max(0, Math.round(positionMs)) };
  // Erst das gemerkte Gerät direkt probieren – Geräteliste nur abfragen, wenn das nicht klappt
  let d = store.settings.deviceId ? { id: store.settings.deviceId, name: store.settings.deviceName } : null;
  let done = false;
  if (d) {
    try { await api("/me/player/play", { method: "PUT", query: { device_id: d.id }, body }); done = true; }
    catch (e) { if (e.status !== 404) throw e; }
  }
  if (!done) {
    d = await pickDevice();
    if (!d) throw new SpotifyError(404, "NO_ACTIVE_DEVICE", "Kein aktives Spotify-Gerät gefunden.");
    try {
      await api("/me/player/play", { method: "PUT", query: { device_id: d.id }, body });
    } catch (e) {
      if (e.status !== 404) throw e;
      // Gerät schläft: Wiedergabe erst dorthin übertragen, dann erneut starten
      await api("/me/player", { method: "PUT", body: { device_ids: [d.id], play: false } });
      await sleep(600);
      await api("/me/player/play", { method: "PUT", query: { device_id: d.id }, body });
    }
  }
  if (store.settings.repeat && repeatSetFor !== d.id) {
    repeatSetFor = d.id;
    setTimeout(() => api("/me/player/repeat", { method: "PUT", query: { state: "track", device_id: d.id } }).catch(() => { repeatSetFor = ""; }), 500);
  }
  return d;
}

// Nach dem Startbefehl nachsehen, ob Spotify wirklich diesen Song spielt
async function spotifyCheck(uri) {
  let kicked = 0;
  for (let i = 0; i < 2; i++) {
    await sleep(i ? 1500 : 1800);
    let st = null;
    try { st = await api("/me/player", { query: { market: "from_token" } }); } catch (e) { return { ok: false, why: e.message }; }
    if (st && st.is_playing && st.item && st.item.uri === uri) return { ok: true };
    if (st && st.item && st.item.uri === uri && st.item.is_playable === false) return { ok: false, unplayable: true, why: "Diese Aufnahme ist für dieses Spotify-Konto nicht abspielbar (Land/Lizenz)." };
    // Song geladen, aber pausiert (iOS lässt Spotify im Hintergrund oft nicht selbst starten): nachschieben
    if (st && st.item && st.item.uri === uri && !st.is_playing && kicked < 1) {
      kicked++;
      const dev = st.device && st.device.id;
      try {
        await api("/me/player/play", { method: "PUT", query: dev ? { device_id: dev } : {} });
      } catch (e) { /* nächster Versuch */ }
      continue;
    }
    if (i === 1) {
      if (!st) return { ok: false, why: "Spotify meldet keine laufende Wiedergabe." };
      if (st.item && st.item.uri !== uri) return { ok: false, why: `Spotify spielt etwas anderes (${st.item.name}).` };
      if (!st.is_playing) return { ok: false, why: `Spotify hat den Song geladen, spielt aber nicht${st.device ? ` (Gerät: ${st.device.name})` : ""}.` };
    }
  }
  return { ok: false, why: "Keine Bestätigung von Spotify." };
}

async function spotifyPause() {
  try { await api("/me/player/pause", { method: "PUT", query: store.settings.deviceId ? { device_id: store.settings.deviceId } : {} }); }
  catch (e) { if (e.status !== 403 && e.status !== 404) throw e; }
}

async function spotifyResume() {
  await api("/me/player/play", { method: "PUT", query: store.settings.deviceId ? { device_id: store.settings.deviceId } : {} });
}

/* ================= Songs auf Spotify finden ================= */
function orqKeys(orq) {
  const o = ORCHESTRAS.find((x) => x.name === orq);
  if (o) return o.keys;
  const n = norm(orq).split(" ");
  return [n[n.length - 1]].filter(Boolean);
}

function scoreTrack(song, t) {
  const tn = norm(cleanTitle(t.name)), st = norm(cleanTitle(song.title));
  let title = 0;
  if (tn === st) title = 50;
  else if (tn.startsWith(st) || st.startsWith(tn)) title = 30;
  else if (tn.includes(st) || st.includes(tn)) title = 20;
  const artists = (t.artists || []).map((a) => norm(a.name)).join(" | ");
  const artist = orqKeys(song.orq).some((k) => artists.includes(k)) ? 35 : 0;
  let bonus = 0;
  const full = `${norm(t.name)} ${norm(t.album && t.album.name)}`;
  if (song.singer) {
    const last = norm(song.singer).split(" ").pop();
    if (last && (artists.includes(last) || full.includes(last))) bonus += 8;
  }
  if (song.year) {
    if (full.includes(String(song.year))) bonus += 8;
    if (t.album && String(t.album.release_date || "").startsWith(String(song.year))) bonus += 4;
  }
  if (/\b(en vivo|live|remix|karaoke|cover|ensayo|en concierto|electro|lounge)\b/.test(full)) bonus -= 25;
  return { total: title + artist + bonus, ok: title >= 20 && artist >= 35 };
}

function trackInfo(t) {
  const img = t.album && t.album.images && t.album.images.length ? t.album.images[t.album.images.length - 1].url : "";
  return {
    uri: t.uri, id: t.id, name: t.name,
    artists: (t.artists || []).map((a) => a.name).join(", "),
    album: (t.album && t.album.name) || "",
    release: (t.album && t.album.release_date) || "",
    image: img, duration: t.duration_ms || 0
  };
}

async function searchTracks(q) {
  const j = await api("/search", { query: { q, type: "track", limit: 10 } });
  return ((j && j.tracks && j.tracks.items) || []).filter(Boolean);
}

// Kandidaten für einen Archiv-Song, bester zuerst
async function findCandidates(song) {
  const queries = [`${song.title} ${song.orq}`];
  const key = orqKeys(song.orq)[0];
  queries.push(`track:${song.title} artist:${key}`);
  const seen = new Map();
  for (const q of queries) {
    const items = await searchTracks(q);   // Fehler nicht verschlucken – sonst gilt der Song fälschlich als „nicht gefunden“
    for (const t of items) if (!seen.has(t.id)) seen.set(t.id, { t, s: scoreTrack(song, t) });
    const best = [...seen.values()].sort((a, b) => b.s.total - a.s.total)[0];
    if (best && best.s.ok) break;   // passt – zweite Suche sparen
  }
  return [...seen.values()].sort((a, b) => b.s.total - a.s.total);
}

// Song automatisch zuordnen; gibt true zurück, wenn ein passender Track gefunden wurde
async function matchSong(song) {
  const c = await findCandidates(song);
  const best = c[0];
  song.lastSearch = { n: c.length, best: best ? `${best.t.name} – ${(best.t.artists || []).map((a) => a.name).join(", ")}` : "" };
  if (best && best.s.ok) {
    song.spotify = trackInfo(best.t);
    song.status = "auto";
  } else {
    song.status = "missing";
  }
  save();
  return song.status === "auto";
}

function parseSpotifyId(input, kind) {
  const s = String(input || "").trim();
  const m = s.match(new RegExp(`(?:open\\.spotify\\.com/(?:intl-[a-z]+/)?${kind}/|spotify:${kind}:)([A-Za-z0-9]{22})`));
  if (m) return m[1];
  return /^[A-Za-z0-9]{22}$/.test(s) ? s : null;
}

async function trackById(id) { return api(`/tracks/${id}`); }

/* ================= Playlists ================= */
async function myPlaylists() {
  const out = [];
  let offset = 0;
  for (let i = 0; i < 6; i++) {
    const j = await api("/me/playlists", { query: { limit: 50, offset } });
    out.push(...((j && j.items) || []).filter(Boolean));
    if (!j || !j.next) break;
    offset += 50;
  }
  return out;
}

async function playlistInfo(id) { return api(`/playlists/${id}`, { query: { fields: "id,name,owner(id,display_name)" } }); }

async function playlistTracks(id) {
  const out = [];
  let offset = 0;
  for (let i = 0; i < 40; i++) {
    let j;
    try { j = await api(`/playlists/${id}/items`, { query: { limit: 50, offset } }); }
    catch (e) {
      if (e.status === 403 || e.status === 404) throw new SpotifyError(e.status, "PLAYLIST", "Spotify gibt nur eigene oder gemeinsame Playlists frei. Kopiere die Playlist in Spotify in eine eigene („Zu anderer Playlist hinzufügen“) und importiere dann diese.");
      throw e;
    }
    for (const x of (j && j.items) || []) {
      const t = x && (x.item || x.track);
      if (t && t.type === "track" && !t.is_local && t.uri) out.push(t);
    }
    if (!j || !j.next) break;
    offset += 50;
  }
  return out;
}

// Spotify-Track → Archiv-Eintrag
function trackToSong(t) {
  const artists = t.artists || [];
  const orq = orchestraFromArtist(artists[0] ? artists[0].name : "");
  const isOrq = (n) => /orquesta|orchestra|sexteto|quinteto|cuarteto/i.test(n) || ORCHESTRAS.some((o) => o.keys.some((k) => norm(n).includes(k)));
  const singers = artists.slice(1).map((a) => a.name).filter((n) => !isOrq(n));
  let singer = singers.length ? singers.join(", ") : null;
  const feat = t.name.match(/\((?:feat\.?|con|canta|vocals?:?)\s+([^)]+)\)/i);
  if (!singer && feat) singer = feat[1].trim();
  const text = `${t.name} ${(t.album && t.album.name) || ""}`;
  const ym = text.match(/\b(19[1-6]\d)\b/);
  const genre = /\b(vals|valsecito|waltz)\b/.test(norm(text)) ? "vals" : /\bmilonga\b/.test(norm(t.name)) ? "milonga" : "tango";
  return {
    id: "sp-" + t.id, orq, title: cleanTitle(t.name), year: ym ? +ym[1] : null, singer, genre,
    active: true, source: "import", spotify: trackInfo(t), status: "ok"
  };
}
