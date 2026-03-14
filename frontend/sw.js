/**
 * Service worker for pua PWA — offline caching
 */
const CACHE_NAME = 'pua-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/content.json',
  '/icons/icon.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(ASSETS.map((url) => cache.add(url).catch(() => {})))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;
  if (!url.pathname.startsWith('/') || url.pathname.startsWith('/api/')) return;

  e.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        const clone = res.clone();
        if (res.ok && request.method === 'GET')
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        return res;
      });
    })
  );
});
