// public/sw.js - Vetrinel PWA Service Worker
const CACHE_NAME = 'vetrinel-v2';
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/icon-192.svg',
  '/icon-512.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // 1. Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // 2. NEVER intercept API calls or cross-origin requests
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api')) {
    return;
  }

  // 3. For local navigation (HTML pages), try network first, fallback to cached offline shell
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/manifest.webmanifest');
      })
    );
    return;
  }

  // 4. Cache first for static local assets (icons, manifest, etc.)
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request);
      })
    );
  }
});
