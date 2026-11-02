// Offline-Betrieb: App-Gerüst wird beim ersten Start gespeichert, Läufe-Daten kommen bevorzugt frisch aus dem Netz.
// Bei jeder Änderung an der App VERSION hochzählen, damit alte Dateien ersetzt werden.
const VERSION = "v28";
const SHELL = `pacehunt-shell-${VERSION}`;
const DATA = `pacehunt-data-${VERSION}`;
const SHELL_FILES = [
  "./",
  "index.html",
  "css/fonts.css",
  "css/app.css",
  "js/app.js",
  "fonts/barlow-400-latin.woff2",
  "fonts/barlow-400-latin-ext.woff2",
  "fonts/barlow-500-latin.woff2",
  "fonts/barlow-500-latin-ext.woff2",
  "fonts/barlow-600-latin.woff2",
  "fonts/barlow-600-latin-ext.woff2",
  "fonts/barlow-700-latin.woff2",
  "fonts/barlow-700-latin-ext.woff2",
  "fonts/barlow-condensed-600-latin.woff2",
  "fonts/barlow-condensed-600-latin-ext.woff2",
  "fonts/barlow-condensed-700-latin.woff2",
  "fonts/barlow-condensed-700-latin-ext.woff2",
  "fonts/barlow-condensed-800-latin.woff2",
  "fonts/barlow-condensed-800-latin-ext.woff2",
  "fonts/permanent-marker-400-latin.woff2",
  "manifest.webmanifest",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("pacehunt-") && k !== SHELL && k !== DATA).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Läufe- und Ortsdaten: erst Netz, bei Ausfall die zuletzt gespeicherte Fassung
  if (url.origin === location.origin && url.pathname.includes("/data/")) {
    e.respondWith(
      fetch(req)
        .then(res => { if (res.ok) { const copy = res.clone(); caches.open(DATA).then(c => c.put(req, copy)); } return res; })
        .catch(() => caches.match(req))
    );
    return;
  }

  // App-Gerüst: erst frisch aus dem Netz (damit Neuerungen sofort ankommen), ohne Netz aus dem Speicher
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req, { cache: "no-cache" })
        .then(res => { if (res.ok) { const copy = res.clone(); caches.open(SHELL).then(c => c.put(req, copy)); } return res; })
        .catch(() => caches.match(req).then(hit => hit || caches.match("index.html")))
    );
  }
});
