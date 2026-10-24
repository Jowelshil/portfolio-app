// Offline support: the app shell is served from cache, prices from the network
// (falling back to the last copy when the ship's internet is down).
const CACHE = "portfolio-v3";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // Network first for everything, so a new app version or new prices show
  // up straight away; the cache is only the offline fallback.
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(new URL(e.request.url).pathname, copy));
      }
      return res;
    }).catch(() => caches.match(new URL(e.request.url).pathname, { ignoreSearch: true })
      .then(r => r || caches.match("index.html")))
  );
});
