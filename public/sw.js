/* AnaxDevBook — service worker (modo offline).
   Páginas y JSON: red primero, caché si no hay conexión (contenido siempre fresco).
   Recursos de /_next/static, iconos y fuentes: caché primero (llevan hash o no cambian). */
const CACHE = 'anaxdevbook-v2';
const OFFLINE_SHELL = ['/', '/manifest.json', '/icons/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(OFFLINE_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  const immutable = url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/');
  const put = (res) => {
    if (res && res.ok) {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
    }
    return res;
  };

  if (immutable) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then(put)));
    return;
  }
  event.respondWith(
    fetch(req)
      .then(put)
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('/')))
  );
});
