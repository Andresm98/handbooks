/* Generado por tools/build.py — no editar a mano.
   La versión cambia automáticamente cuando cambia cualquier archivo precacheado,
   así que cada build invalida la caché anterior. */
const CACHE_VERSION = '91f3b3f4d27b';
const CACHE_NAME = `anaxdevbook-${CACHE_VERSION}`;
const PRECACHE = [
  "./",
  "assets/handbook.css",
  "assets/handbook.js",
  "docs/arquitectura-software.html",
  "docs/ia-generativa.html",
  "docs/roadmap.html",
  "docs/software-engineer.html",
  "docs/solutions-architect.html",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "index.html",
  "manifest.json",
  "search-index.json"
];

// Rutas relativas a la ubicación del service worker: funciona en la raíz
// del dominio y en subrutas (p. ej. GitHub Pages /HandBooks/).
const toUrl = (p) => new URL(p, self.registration.scope).toString();

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE.map(toUrl)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// HTML y JSON: red primero (contenido siempre fresco), caché si no hay conexión.
// CSS, JS, imágenes y fuentes: caché primero.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com');
  if (!sameOrigin && !isFont) return;

  const isDocument = req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('.json') || url.pathname.endsWith('/');

  if (isDocument && sameOrigin) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match(toUrl('index.html'))))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res && (res.ok || res.type === 'opaque')) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, copy));
      }
      return res;
    }))
  );
});
