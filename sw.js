/* =============================================
 * Service Worker — Network-First Strategy
 * ============================================= */
const CACHE_NAME = 'cycle-shop-v1';

const PRE_CACHE = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './libs/chart.min.js',
  './libs/html2canvas.min.js',
  './js/auth.js',
  './js/state.js',
  './js/router.js',
  './js/products.js',
  './js/cart.js',
  './js/history.js',
  './js/dashboard.js',
  './js/invoice.js',
  './js/init.js',
  './js/firebase-config.js'
];

/* Install — Pre-cache core assets */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRE_CACHE))
      .then(() => self.skipWaiting())
  );
});

/* Activate — Clear old caches */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Fetch — Network-First (Stale-While-Revalidate) */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // If network is available, update the cache and return the response
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // If network is unavailable, fall back to the cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // If not in cache and it's a document request, show the landing page
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
