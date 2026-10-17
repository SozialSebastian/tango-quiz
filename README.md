# Orquesta

Tango-Quiz als Web-App (PWA) fürs iPhone: Spotify spielt eine Aufnahme der Época de Oro, wer dran ist, rät **Orchester** und **Titel** – aufdecken, abhaken, Punkte. Für mehrere Spieler an einem Handy.

## Funktionen
- **Spiel:** 1–8 Spieler reihum, 3/5/10 Runden oder ohne Ende, Auswahl nach Tango/Vals/Milonga und Orchester, Startpunkt Anfang oder zufällig, Sänger als Bonus
- **Archiv:** ~100 bekannte Aufnahmen (D'Arienzo, Di Sarli, Pugliese, Troilo, Caló, Canaro, Tanturi, Laurenz, Demare …), bearbeiten, eigene Songs, Spotify-Zuordnung prüfen und korrigieren
- **Playlist-Import:** eigene Spotify-Playlists ins Archiv übernehmen (Orchester, Sänger, Jahr werden ausgelesen)
- **Sicherung** des Archivs als JSON-Datei

## Spotify
- Anmeldung direkt in der App (OAuth mit PKCE), kein Server, kein Geheimnis im Code
- Wiedergabe über Spotify Connect: die App steuert die Spotify-App auf dem iPhone (oder eine Box) fern
- Spotify-Dashboard: App „Orquesta“, Redirect URI `https://sozialsebastian.github.io/tango-quiz/`, Client ID steht in `js/core.js`
- Entwicklermodus: Spotify Premium nötig, weitere Konten unter „User Management“ freischalten

## Aufbau
| Datei | Inhalt |
|---|---|
| `index.html`, `styles.css` | Seite und Aussehen (hell/dunkel) |
| `js/archive-data.js` | Standard-Archiv – neue Songs anhängen und `ARCHIVE_VERSION` erhöhen |
| `js/core.js` | Speicher (`localStorage` „orquesta.v1“ – Schlüssel nie ändern), Hilfen, Navigation |
| `js/spotify.js` | Anmeldung, Wiedergabe, Suche, Playlists |
| `js/game.js` | Spiel |
| `js/archive.js` | Archiv und Import |
| `js/settings.js` | Einstellungen, Sicherung |
| `js/start.js` | Start, Updates (muss zuletzt kommen) |
| `sw.js` | Offline-Cache |
| `tests/run.mjs` | automatische Tests (Spotify nachgebildet) |

## Tests
Laufen bei jeder Änderung auf GitHub (Actions → „Tests“), inkl. Bildschirmfotos als Download. Lokal:
```
cd tests && npm install && npx playwright install chromium && node run.mjs
```

## Installation aufs iPhone
1. `https://sozialsebastian.github.io/tango-quiz/` in Safari öffnen
2. Teilen → „Zum Home-Bildschirm“
3. In der App „Mit Spotify verbinden“

## Updates
Nach Änderungen in `sw.js` die `VERSION` erhöhen (und neue Dateien in `FILES` eintragen).
