/* Orquesta – feste Spotify-Zuordnungen für das Standard-Archiv.
   Schlüssel = Song-ID aus dem Archiv, Wert = Spotify-Track. Damit muss kein Handy diese Songs selbst suchen.
   Wird aus einer Sicherung (Einstellungen → Sicherung speichern) erzeugt: node tools/tracks-from-backup.mjs <datei.json>
   Bei Änderungen TRACKS_VERSION erhöhen, dann übernehmen alle Geräte die neuen Zuordnungen. */
"use strict";

const TRACKS_VERSION = 0;
const TRACKS = {};
