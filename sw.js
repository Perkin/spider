const CACHE_NAME = 'spider-v4';
const STATIC_ASSETS = [
  '/spider/',
  '/spider/index.html',
  '/spider/style.css',
  '/spider/script.js',
  '/spider/manifest.json',
  '/spider/icons/icon-48x48.png',
  '/spider/icons/icon-72x72.png',
  '/spider/icons/icon-96x96.png',
  '/spider/icons/icon-128x128.png',
  '/spider/icons/icon-144x144.png',
  '/spider/icons/icon-152x152.png',
  '/spider/icons/icon-192x192.png',
  '/spider/icons/icon-256x256.png',
  '/spider/icons/icon-384x384.png',
  '/spider/icons/icon-512x512.png',
  '/spider/icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);

      const shouldServeIndex = event.request.mode === 'navigate' && !cached;
      return shouldServeIndex
        ? caches.match('./index.html').then((idx) => idx || fetchPromise)
        : cached || fetchPromise;
    })
  );
});
