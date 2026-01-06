/* eslint-disable no-restricted-globals */
const CACHE_NAME = 'osrs-bingo-hub-v1';

// Assets to cache on install
const PRECACHE_ASSETS = ['/', '/index.html', '/bundle.js', '/manifest.json'];

// Install - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch - network first, fall back to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip GraphQL and API requests - always go to network
  if (request.url.includes('/graphql') || request.url.includes('/api/')) {
    return;
  }

  // Skip WebSocket upgrades
  if (request.headers.get('upgrade') === 'websocket') {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses for static assets
        if (
          response.ok &&
          (request.url.endsWith('.js') ||
            request.url.endsWith('.css') ||
            request.url.endsWith('.png') ||
            request.url.endsWith('.webp') ||
            request.url.endsWith('.woff2'))
        ) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If it's a navigation request, return cached index.html
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});
