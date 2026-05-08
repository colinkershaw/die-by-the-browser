const CACHE_NAME = 'die-by-browser-v1.22';
const ASSETS = [
  './die-by-the-browser.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './favicon.ico'
];

// Precache static assets (omit the HTML app shell here if you prefer always fetching the shell)
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Network-first for navigation requests (HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          // Optionally update cache for offline usage
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
          return networkResponse;
        })
        .catch(() => caches.match(event.request).then(resp => resp || caches.match('./die-by-the-browser.html')))
    );
    return;
  }

  // Cache-first for other requests (images, manifest, etc.)
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
