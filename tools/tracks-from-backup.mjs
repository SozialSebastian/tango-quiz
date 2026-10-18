// Erzeugt js/tracks.js aus einer Orquesta-Sicherung (Einstellungen → Sicherung speichern).
// Aufruf: node tools/tracks-from-backup.mjs orquesta-archiv-2026-10-18.json
// Übernimmt alle Standard-Songs mit Spotify-Zuordnung; bestehende feste Zuordnungen bleiben, neue überschreiben sie.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = process.argv[2];
if (!file) { console.error("Bitte Sicherungsdatei angeben."); process.exit(1); }
const backup = JSON.parse(fs.readFileSync(file, "utf8"));
if (!Array.isArray(backup.archive)) { console.error("Keine Orquesta-Sicherung."); process.exit(1); }

const src = fs.readFileSync(path.join(root, "js/tracks.js"), "utf8");
const old = new Function(src.replace(/"use strict";/, "") + ";return { v: TRACKS_VERSION, t: TRACKS };")();
const tracks = { ...old.t };
let added = 0, skipped = 0;
for (const s of backup.archive) {
  if (s.source !== "archiv" || !s.spotify || !s.spotify.id) { if (s.source !== "archiv") skipped++; continue; }
  if (!["ok", "auto", "fixed"].includes(s.status)) continue;
  const sp = s.spotify;
  tracks[s.id] = { id: sp.id, name: sp.name, artists: sp.artists, album: sp.album, release: sp.release, image: sp.image, duration: sp.duration };
  added++;
}
const keys = Object.keys(tracks).sort();
const body = keys.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(tracks[k])}`).join(",\n");
const head = src.split("const TRACKS_VERSION")[0];
fs.writeFileSync(path.join(root, "js/tracks.js"), `${head}const TRACKS_VERSION = ${old.v + 1};\nconst TRACKS = {\n${body}\n};\n`);
console.log(`${added} Zuordnungen aus der Sicherung, ${keys.length} insgesamt, Version ${old.v + 1}. Eigene/importierte Songs nicht übernommen: ${skipped}`);
