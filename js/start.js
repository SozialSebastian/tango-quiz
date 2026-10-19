/* Orquesta – Start, Updates. Muss zuletzt geladen werden. */
"use strict";

(async () => {
  const seeded = seedArchive();
  if (applyFixedTracks() || seeded) save();
  // laufendes Spiel: aktueller Song wurde aus dem Archiv entfernt → nächsten nehmen
  const g = store.game;
  if (g && !g.finished && g.current && !songById(g.current.songId)) {
    const n = nextSong(g);
    g.current = n ? { songId: n.id, phase: "ready", marks: {}, pos: null } : null;
    save();
  }
  const back = await handleSpotifyCallback();
  render();
  if (back && isLoggedIn()) { spotifyMe().then(() => { if (tab === "settings") render(); }).catch(() => {}); pickDevice().then(() => render()).catch(() => {}); }
  else if (isLoggedIn()) spotifyMe().catch(() => {});
})();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register("sw.js").then((reg) => {
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") reg.update().catch(() => {}); });
  }).catch((e) => console.warn("SW", e));
  // Neue Version → neu laden, aber nicht mitten in einer Runde oder in einem offenen Fenster
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || reloading) return;
    const tryReload = () => {
      const g = store.game;
      if ((g && !g.finished && g.current && g.current.phase !== "ready") || document.querySelector("dialog[open]")) return setTimeout(tryReload, 5000);
      reloading = true; location.reload();
    };
    tryReload();
  });
}
