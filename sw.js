// Provaxis service worker — enables "Add to Home Screen" / install, and basic offline support.
// Bump CACHE_VERSION whenever you want returning visitors to pick up fresh files sooner.
const CACHE_VERSION = 'provaxis-v1';

const CORE_ASSETS = [
  '/index.html',
  '/bottleneck-audit.html',
  '/solutions.html',
  '/company.html',
  '/referral.html',
  '/contact.html',
  '/assets/style.css',
  '/assets/script.js',
  '/assets/logo.png',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // API calls: always go to the network, never cached (live data)
  if (request.url.includes('/api/')) return;

  // Pages (HTML): network-first, so updates show up right away; fall back to cache offline
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html')))
    );
    return;
  }

  // Static assets (css, js, images): cache-first for speed, network fallback
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
                      
