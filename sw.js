// Offline-Cache für die App. Bei jeder Änderung an den Dateien VERSION erhöhen.
const VERSION = "orquesta-v18";
const FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./js/archive-data.js",
  "./js/tracks.js",
  "./js/core.js",
  "./js/spotify.js",
  "./js/game.js",
  "./js/history.js",
  "./js/archive.js",
  "./js/settings.js",
  "./js/start.js",
  "./manifest.webmanifest",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Erst Netz (damit Updates sofort ankommen), offline aus dem Cache. Spotify nie cachen.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("./index.html")))
  );
});
