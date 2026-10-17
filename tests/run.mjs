// Automatische Tests für Orquesta: startet die App im Browser (iPhone-Größe) und prüft die wichtigsten Abläufe.
// Aufruf: cd tests && npm install && npx playwright install chromium && node run.mjs
// Spotify wird im Test nachgebildet – es gehen keine echten Anfragen raus.
import { chromium, devices } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const shots = path.join(root, "tests", "screens");
fs.mkdirSync(shots, { recursive: true });
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webmanifest": "application/manifest+json", ".json": "application/json" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0].split("#")[0]);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const BASE = `http://localhost:${server.address().port}/`;
const executablePath = process.env.CHROMIUM_PATH || undefined;
const browser = await chromium.launch(executablePath ? { executablePath } : {});

const json = (r, body, status = 200) => r.fulfill({ status, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) });
const LOGGED = { access: "tok", refresh: "ref", expires: Date.now() + 3600e3 };

// Nachgebildeter Spotify-Track
const track = (id, name, artist, extra = {}) => ({
  id, uri: `spotify:track:${id}`, name, type: "track", duration_ms: 180000,
  artists: [{ name: artist }, ...(extra.singer ? [{ name: extra.singer }] : [])],
  album: { name: extra.album || "Tango", release_date: extra.release || "2005", images: [] }
});

async function open({ auth, settings, store, dark, noDevice, url = "" } = {}) {
  const ctx = await browser.newContext({ ...devices["iPhone 13"], colorScheme: dark ? "dark" : "light" });
  const page = await ctx.newPage();
  const errors = [];
  const calls = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  page.on("dialog", (d) => d.accept());
  await page.route("https://accounts.spotify.com/api/token", async (r) => {
    calls.push({ m: "POST", p: "token", body: r.request().postData() });
    json(r, { access_token: "tok2", refresh_token: "ref2", expires_in: 3600 });
  });
  await page.route("https://accounts.spotify.com/authorize**", (r) => { calls.push({ m: "GET", p: "authorize", url: r.request().url() }); r.fulfill({ status: 200, contentType: "text/html", body: "<p>Spotify</p>" }); });
  await page.route("https://api.spotify.com/**", async (r) => {
    const u = new URL(r.request().url());
    const p = u.pathname.replace("/v1", "");
    const m = r.request().method();
    calls.push({ m, p, q: Object.fromEntries(u.searchParams), body: r.request().postData() });
    if (p === "/me") return json(r, { id: "seb", display_name: "Sebastian" });
    if (p === "/me/player/devices") return json(r, { devices: noDevice ? [] : [{ id: "dev1", name: "iPhone von Sebastian", type: "Smartphone", is_active: false }] });
    if (p.startsWith("/me/player")) return r.fulfill({ status: 204, headers: { "access-control-allow-origin": "*" } });
    if (p === "/search") {
      const q = u.searchParams.get("q").toLowerCase();
      // Suche liefert passende Aufnahme + falsches Orchester + Live-Version
      const t = q.split(" ")[0];
      return json(r, { tracks: { items: [
        track("live" + t, "La yumba - En vivo", "Osvaldo Pugliese", { album: "En vivo en el Colón" }),
        track("wrong" + t, cap(q.split(/ (juan|carlos|osvaldo|an|miguel|francisco|ricardo|pedro|lucio|ángel|rodolfo|edgardo|enrique)/)[0]), "Orquesta Típica Otra"),
        track("good" + t, cap(q.split(/ (juan|carlos|osvaldo|aníbal|miguel|francisco|ricardo|pedro|lucio|ángel|rodolfo|edgardo|enrique)/)[0]) + " (Remastered)", artistFor(q), { album: "Grandes éxitos 1940" })
      ] } });
    }
    if (p === "/me/playlists") return json(r, { items: [{ id: "PL1", name: "Tandas Sonntag", owner: { id: "seb" }, items: { total: 3 } }, { id: "PL2", name: "Fremde", owner: { id: "x" }, items: { total: 9 } }], next: null });
    if (p === "/playlists/PL1/items") return json(r, { items: [
      { item: track("a1", "Zorro gris", "Francisco Canaro", { album: "Bailando 1942" }) },
      { item: track("a2", "Pocas palabras", "Ricardo Tanturi y su Orquesta Típica", { singer: "Alberto Castillo" }) },
      { item: track("a3", "Milonga sentimental", "Francisco Canaro") },
      { item: track("a4", "La yumba", "Osvaldo Pugliese") }
    ], next: null });
    if (p.startsWith("/tracks/")) return json(r, track(p.split("/")[2], "Linktitel", "Juan D'Arienzo"));
    return json(r, { error: { status: 404, message: "nicht nachgebildet" } }, 404);
  });
  await page.addInitScript(([auth, settings, store]) => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    localStorage.clear();
    if (auth) localStorage.setItem("orquesta.auth", JSON.stringify(auth));
    if (settings || store) localStorage.setItem("orquesta.v1", JSON.stringify({ ...(store || {}), settings: { clientId: "testclient", ...(settings || {}) } }));
  }, [auth || null, settings || null, store || null]);
  await page.goto(BASE + url);
  await page.waitForTimeout(400);
  return { page, ctx, errors, calls };
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
function artistFor(q) {
  for (const a of ["d'arienzo", "di sarli", "pugliese", "troilo", "caló", "canaro", "tanturi", "laurenz", "demare", "d'agostino", "fresedo", "biagi", "donato", "rodríguez"]) if (q.includes(a)) return a;
  return "Unbekannt";
}
const store = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("orquesta.v1")));
const shot = (page, name) => page.screenshot({ path: path.join(shots, name + ".png"), fullPage: true });

let failed = 0;
async function test(name, fn) {
  try { await fn(); console.log("✓", name); }
  catch (e) { failed++; console.log("✗", name, "\n  ", e.stack.split("\n").slice(0, 4).join("\n   ")); }
}

/* ================= Tests ================= */
await test("Erststart: Archiv angelegt, Verbinden angeboten", async () => {
  const ctx = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(BASE);
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Mit Spotify verbinden" }).waitFor();
  const s = await store(page);
  const n = await page.evaluate(() => ARCHIVE_DEFAULT.length);
  assert.equal(s.archive.length, n);
  assert.ok(n >= 80, "mindestens 80 Standard-Songs");
  const ids = new Set(s.archive.map((x) => x.id));
  assert.equal(ids.size, n, "IDs eindeutig");
  assert.ok(s.archive.every((x) => ["tango", "vals", "milonga"].includes(x.genre)));
  await page.locator(".tabbar [data-tab=settings]").click();
  await page.locator('[data-change="clientId"]').fill("abc123");
  await page.locator('[data-change="clientId"]').blur();
  await page.waitForTimeout(100);
  assert.equal((await store(page)).settings.clientId, "abc123");
  assert.deepEqual(errors, []);
  await ctx.close();
});

await test("Anmeldung mit PKCE: richtige Parameter, Rückkehr tauscht Code gegen Token", async () => {
  const { page, ctx, errors, calls } = await open({ settings: {} });
  await page.getByRole("button", { name: "Mit Spotify verbinden" }).click();
  await page.waitForURL(/accounts\.spotify\.com/);
  const u = new URL(calls.find((c) => c.p === "authorize").url);
  assert.equal(u.searchParams.get("client_id"), "testclient");
  assert.equal(u.searchParams.get("code_challenge_method"), "S256");
  assert.equal(u.searchParams.get("redirect_uri"), BASE);
  assert.match(u.searchParams.get("scope"), /user-modify-playback-state/);
  const state = u.searchParams.get("state");
  await page.goto(`${BASE}?code=CODE1&state=${state}`);
  await page.waitForTimeout(500);
  const tok = calls.find((c) => c.p === "token");
  assert.ok(tok, "Token-Abfrage");
  assert.match(tok.body, /grant_type=authorization_code/);
  assert.match(tok.body, /code_verifier=/);
  assert.equal(new URL(page.url()).search, "", "Code aus der Adresse entfernt");
  const a = await page.evaluate(() => JSON.parse(localStorage.getItem("orquesta.auth")));
  assert.equal(a.access, "tok2");
  assert.equal(await page.getByRole("button", { name: "Spiel starten" }).isEnabled(), true);
  assert.deepEqual(errors, []);
  await ctx.close();
});

await test("Spielrunde: abspielen, aufdecken, Punkte, nächster Spieler", async () => {
  const { page, ctx, errors, calls } = await open({ auth: LOGGED, settings: { genres: { tango: true, vals: false, milonga: false }, orchestras: ["Osvaldo Pugliese"] } });
  await shot(page, "1-start-hell");
  await page.locator(".player-row input").first().fill("Sebastian");
  await page.locator(".player-row input").first().blur();
  await page.getByRole("button", { name: "Spiel starten" }).click();
  await page.getByText("Am Zug").waitFor();
  assert.equal(await page.locator(".who").textContent(), "Sebastian");
  await page.getByRole("button", { name: "Abspielen" }).click();
  await page.getByRole("button", { name: "Pause" }).waitFor();
  await shot(page, "2-laeuft-hell");
  const play = calls.find((c) => c.p === "/me/player/play");
  assert.ok(play, "Wiedergabe gestartet");
  assert.equal(play.q.device_id, "dev1");
  assert.match(JSON.parse(play.body).uris[0], /^spotify:track:good/, "richtige Aufnahme gewählt (nicht live, nicht falsches Orchester)");
  await page.waitForTimeout(700);
  assert.ok(calls.some((c) => c.p === "/me/player/repeat" && c.q.state === "track"), "Song in Schleife");
  await page.getByRole("button", { name: "Aufdecken" }).click();
  await page.locator(".reveal .orq").waitFor();
  assert.equal(await page.locator(".reveal .orq").textContent(), "Osvaldo Pugliese");
  await page.locator('.mark[data-k="orq"]').click();
  await page.locator('.mark[data-k="title"]').click();
  await shot(page, "3-aufgedeckt-hell");
  await page.getByRole("button", { name: /\+2 für Sebastian/ }).click();
  await page.getByText("Am Zug").waitFor();
  assert.equal(await page.locator(".who").textContent(), "Spieler 2");
  const s = await store(page);
  assert.equal(s.game.players[0].score, 2);
  assert.equal(s.game.history.length, 1);
  assert.notEqual(s.game.current.songId, s.game.history[0].songId);
  assert.ok(calls.some((c) => c.p === "/me/player/pause"), "Musik pausiert beim Weiter");
  assert.deepEqual(errors, []);
  await ctx.close();
});

await test("Spielende nach eingestellten Runden mit Rangliste", async () => {
  const { page, ctx, errors } = await open({ auth: LOGGED, settings: { rounds: 3 }, store: { players: ["Ana", "Bea"] } });
  await page.getByRole("button", { name: "Spiel starten" }).click();
  for (let i = 0; i < 6; i++) {
    await page.getByRole("button", { name: "Aufdecken" }).click();
    if (i % 2 === 1) await page.locator('.mark[data-k="orq"]').click();
    await page.locator(".sticky-cta .btn.primary").click();
  }
  await page.getByText("Ergebnis").waitFor();
  assert.equal(await page.locator(".hero h1").textContent(), "Bea");
  await shot(page, "4-ergebnis-hell");
  await page.getByRole("button", { name: "Nochmal mit denselben Spielern" }).click();
  assert.equal((await store(page)).game.players.map((p) => p.score).join(), "0,0");
  assert.deepEqual(errors, []);
  await ctx.close();
});

await test("Kein Spotify-Gerät: Hilfe mit Geräteauswahl erscheint", async () => {
  const { page, ctx, errors } = await open({ auth: LOGGED, noDevice: true });
  await page.getByRole("button", { name: "Spiel starten" }).click();
  await page.getByRole("button", { name: "Abspielen" }).click();
  await page.getByText("Spotify ist gerade nicht bereit.").waitFor();
  await page.getByText("Spotify öffnen").waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

await test("Archiv: suchen, Song auf Spotify zuordnen, bearbeiten", async () => {
  const { page, ctx, errors, calls } = await open({ auth: LOGGED });
  await page.locator(".tabbar [data-tab=archive]").click();
  await page.getByText("Jetzt alle zuordnen").waitFor();
  await shot(page, "5-archiv-hell");
  await page.locator("input.search").fill("bahia");
  assert.equal(await page.locator(".row.song").count(), 1);
  await page.locator(".row.song").click();
  await page.getByRole("button", { name: "Auf Spotify suchen" }).click();
  await page.locator(".cand").first().waitFor();
  assert.ok(calls.some((c) => c.p === "/search"));
  // bester Treffer zuerst
  assert.match(await page.locator(".cand").first().textContent(), /Remastered/);
  await page.locator('.cand [data-act="pickCand"]').first().click();
  const s = await store(page);
  const song = s.archive.find((x) => x.title === "Bahía Blanca");
  assert.equal(song.status, "ok");
  assert.match(song.spotify.uri, /good/);
  // bearbeiten
  await page.locator(".row.song").click();
  await page.locator('[name="year"]').fill("1958");
  await page.getByRole("button", { name: "Sichern" }).click();
  assert.equal((await store(page)).archive.find((x) => x.title === "Bahía Blanca").year, 1958);
  assert.deepEqual(errors, []);
  await ctx.close();
});

await test("Archiv: alle zuordnen", async () => {
  const few = [["Juan D'Arienzo", "El flete", 1936, "", "tango"], ["Carlos Di Sarli", "Don Juan", 1955, "", "tango"]];
  const { page, ctx, errors } = await open({ auth: LOGGED, store: { seedVersion: 99, archive: few.map(([orq, title, year, singer, genre], i) => ({ id: "x" + i, orq, title, year, singer, genre, active: true, source: "archiv", spotify: null, status: "open" })) } });
  await page.locator(".tabbar [data-tab=archive]").click();
  await page.getByText("Jetzt alle zuordnen").click();
  await page.waitForFunction(() => !document.querySelector(".bar") && !/noch keinem/.test(document.body.textContent), null, { timeout: 8000 });
  const s = await store(page);
  assert.ok(s.archive.every((x) => x.status === "auto"), JSON.stringify(s.archive.map((x) => x.status)));
  assert.deepEqual(errors, []);
  await ctx.close();
});

await test("Playlist-Import: eigene Playlists, Doppelte überspringen, Angaben auslesen", async () => {
  const { page, ctx, errors } = await open({ auth: LOGGED });
  await page.locator(".tabbar [data-tab=archive]").click();
  const before = (await store(page)).archive.length;
  await page.getByRole("button", { name: "Playlist importieren" }).click();
  await page.getByText("Tandas Sonntag").waitFor();
  assert.equal(await page.getByText("Fremde", { exact: true }).count(), 0, "fremde Playlist nicht angeboten");
  await page.getByText("Tandas Sonntag").click();
  await page.getByRole("button", { name: "2 importieren" }).waitFor();  // Milonga sentimental + La yumba schon da
  await shot(page, "6-import-hell");
  await page.getByRole("button", { name: "2 importieren" }).click();
  const s = await store(page);
  assert.equal(s.archive.length, before + 2);
  const pocas = s.archive.find((x) => x.title === "Pocas palabras");
  assert.equal(pocas.orq, "Ricardo Tanturi");
  assert.equal(pocas.singer, "Alberto Castillo");
  const zorro = s.archive.find((x) => x.title === "Zorro gris");
  assert.equal(zorro.year, 1942);
  assert.equal(zorro.status, "ok");
  assert.deepEqual(errors, []);
  await ctx.close();
});

await test("Einstellungen: Punkte, Sänger-Bonus, Sicherung", async () => {
  const { page, ctx, errors } = await open({ auth: LOGGED });
  await page.locator(".tabbar [data-tab=settings]").click();
  await page.getByText("Verbunden").waitFor();
  await page.locator('[data-act="pts"][data-k="orq"][data-d="1"]').click();
  await page.locator('[data-change="setSinger"]').check();
  await shot(page, "7-einstellungen-hell");
  const s = await store(page);
  assert.equal(s.settings.points.orq, 2);
  assert.equal(s.settings.singer, true);
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByText("Sicherung speichern").click()]);
  const data = JSON.parse(fs.readFileSync(await dl.path(), "utf8"));
  assert.equal(data.app, "orquesta");
  assert.equal(data.archive.length, s.archive.length);
  assert.deepEqual(errors, []);
  await ctx.close();
});

await test("Dunkler Modus: Bildschirmfotos ohne Fehler", async () => {
  const { page, ctx, errors } = await open({ auth: LOGGED, dark: true, settings: { singer: true } });
  await shot(page, "1-start-dunkel");
  await page.getByRole("button", { name: "Spiel starten" }).click();
  await page.getByRole("button", { name: "Abspielen" }).click();
  await page.getByRole("button", { name: "Pause" }).waitFor();
  await shot(page, "2-laeuft-dunkel");
  await page.getByRole("button", { name: "Aufdecken" }).click();
  await shot(page, "3-aufgedeckt-dunkel");
  await page.locator(".tabbar [data-tab=archive]").click();
  await shot(page, "5-archiv-dunkel");
  assert.deepEqual(errors, []);
  await ctx.close();
});

await browser.close();
server.close();
if (failed) { console.log(`\n${failed} Test(s) fehlgeschlagen`); process.exit(1); }
console.log("\nAlle Tests bestanden.");
