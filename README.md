# Orquesta

Tango-Quiz als Web-App (PWA) fürs iPhone: Spotify spielt eine Aufnahme der Época de Oro, wer dran ist, rät **Orchester** und **Titel** – aufdecken, abhaken, Punkte. Für mehrere Spieler an einem Handy.

## Funktionen
- **Spiel:** 1–8 Spieler reihum, 3/5/10 Runden oder ohne Ende, Auswahl nach Tango/Vals/Milonga und Orchester, Startpunkt Anfang oder zufällig; geraten werden Orchester, Titel, Jahr (Toleranz einstellbar) und optional Sänger
- **Schwierigkeit:** Leicht, Mittel, Schwer oder Alle – jeder Song ist nach Bekanntheit eingestuft (`js/levels.js`)
- **Gespielte Spiele:** Verlauf auf der Spiel-Seite; je Spieler aufklappbar, was richtig war und wofür es Punkte gab
- **Archiv:** 266 Aufnahmen der Época de Oro mit fester Spotify-Zuordnung – in der App nur ansehen und probehören, Änderungen ausschließlich im Code (`js/archive-data.js`, `js/tracks.js`, `js/levels.js`)
- **Sicherung** der gespielten Spiele als JSON-Datei

## Spotify
- Anmeldung direkt in der App (OAuth mit PKCE), kein Server, kein Geheimnis im Code
- Wiedergabe über Spotify Connect: die App steuert die Spotify-App auf dem iPhone (oder eine Box) fern
- Spotify-Dashboard: App „Orquesta“, Redirect URI `https://sozialsebastian.github.io/tango-quiz/`, Client ID steht in `js/core.js`
- Entwicklermodus: Spotify Premium nötig, weitere Konten unter „User Management“ freischalten

## Aufbau
| Datei | Inhalt |
|---|---|
| `index.html`, `styles.css` | Seite und Aussehen (hell/dunkel) |
| `js/archive-data.js` | Archiv – Songs hier ergänzen, ändern oder löschen |
| `js/levels.js` | Schwierigkeit je Song (leicht/schwer-Listen, Rest mittel) |
| `js/tracks.js` | feste Spotify-Zuordnungen (`node tools/tracks-from-backup.mjs <Sicherung>`) |
| `js/core.js` | Speicher (`localStorage` „orquesta.v1“ – Schlüssel nie ändern), Archiv aus dem Code aufbauen, Hilfen, Navigation |
| `js/spotify.js` | Anmeldung, Wiedergabe, Suche (nur Rückfall für Songs ohne feste Zuordnung) |
| `js/game.js` | Spiel |
| `js/history.js` | Gespielte Spiele und Details |
| `js/archive.js` | Archiv ansehen (nur lesen) |
| `js/settings.js` | Einstellungen, Sicherung der gespielten Spiele |
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
