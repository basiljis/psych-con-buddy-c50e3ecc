// Universum service worker
// Strategy: network-first for navigation/API, cache-first for hashed assets.
// Old workbox caches are purged on activate to recover stuck clients.

const ASSET_CACHE = 'assets-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((n) => n.startsWith('workbox-') || (n !== ASSET_CACHE))
        .map((n) => caches.delete(n))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try { url = new URL(request.url); } catch { return; }

  // Only handle same-origin
  if (url.origin !== self.location.origin) return;

  // Navigation: network-first, fall back to cached index
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html') || Response.error())
    );
    return;
  }

  // Supabase / auth / API paths — always network, no caching
  if (
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/rest/') ||
    url.pathname.startsWith('/storage/') ||
    url.pathname.startsWith('/functions/')
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // Hashed immutable assets — cache-first
  if (
    url.pathname.startsWith('/assets/') &&
    /-[A-Za-z0-9_-]{6,}\.[a-z0-9]+$/i.test(url.pathname)
  ) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      try {
        const res = await fetch(request);
        if (res.ok) {
          const cache = await caches.open(ASSET_CACHE);
          cache.put(request, res.clone());
        }
        return res;
      } catch {
        return cached || Response.error();
      }
    })());
    return;
  }

  // Default: network passthrough
});
