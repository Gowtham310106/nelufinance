// public/sw.js - Vetrinel PWA Service Worker
// Bump CACHE_VERSION whenever the precached files change so old caches are purged.
const CACHE_VERSION = 'v3';
const CACHE_NAME = `vetrinel-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';
const STATIC_ASSETS = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icon-192.svg',
  '/icon-512.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      // `reload` bypasses the HTTP cache so a fresh copy is precached.
      .then((cache) => cache.addAll(STATIC_ASSETS.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 1. Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // 2. NEVER intercept API calls or cross-origin requests (e.g. a separate API host).
  //    Returning without respondWith lets the browser handle them normally, uncached.
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api')) {
    return;
  }

  // 3. Page navigations: network only, falling back to the offline page when the network fails.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then(
          (cached) =>
            cached ||
            new Response('You are offline. / இணைய இணைப்பு இல்லை.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            })
        )
      )
    );
    return;
  }

  // 4. Cache first for the precached static assets only (icons, manifest, offline page).
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => cachedResponse || fetch(request))
    );
  }
});
