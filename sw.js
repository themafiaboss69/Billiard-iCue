const CACHE_NAME = 'icue-guide-v16';
const urlsToCache = [
  './',
  './index.html',
  './style.css?v=16',
  './main.js?v=16',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request).catch(
          () => console.log('Fetch failed; returning offline page instead.', event.request.url)
        );
      })
  );
});
