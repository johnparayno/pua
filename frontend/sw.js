/**
 * Service worker for pua PWA — offline caching
 * When bumping version in index.html, update CACHE_NAME here too (e.g. pua-v1.0.2)
 * so users get fresh assets and old cache is cleared.
 */
const CACHE_NAME = 'pua-v1.0.3';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css?v=1.0.3',
  '/app.js?v=1.0.3',
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

  // Network-first for HTML so users get latest version on load/refresh
  if (request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    e.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Network-first for content.json so we get fresh data when online
  if (url.pathname === '/content.json') {
    e.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

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
