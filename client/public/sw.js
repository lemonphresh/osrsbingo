/* eslint-disable no-restricted-globals */
const CACHE_NAME = 'osrs-bingo-hub-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;
  if (request.url.includes('/graphql') || request.url.includes('/api/')) return;
  if (request.headers.get('upgrade') === 'websocket') return;

  // Navigations always go straight to the network — otherwise a stale cached
  // index.html can reference hashed JS filenames from a prior deploy that no
  // longer exist, leaving the page blank until a manual refresh.
  if (request.mode === 'navigate') return;

  event.respondWith(
    fetch(request)
      .then((response) => {
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
      .catch(() => caches.match(request).then((cached) => cached || new Response('Offline', { status: 503 })))
  );
});
