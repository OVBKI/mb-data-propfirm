// Service worker Fleetly — rend l'app installable et utilisable hors-ligne.
// Stratégie : "network-first" pour les pages (toujours frais quand il y a du réseau,
// repli sur le cache sinon), "cache-first" pour les ressources statiques.
const CACHE = "fleetly-v1";
const OFFLINE_URLS = ["/app", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(OFFLINE_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // On ne gère que notre propre origine (pas les tuiles de carte, fonts, etc.).
  if (url.origin !== self.location.origin) return;

  const isAsset = /\.(?:js|css|png|jpg|jpeg|svg|webp|ico|woff2?)$/.test(url.pathname);

  if (isAsset) {
    // Cache-first pour les ressources statiques.
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            return res;
          })
      )
    );
    return;
  }

  // Network-first pour les pages/navigation.
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match("/app")))
  );
});
