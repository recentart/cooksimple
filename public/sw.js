// CookSimple service worker (generated from src/sw-template.js by the build).
// Makes the site usable in a kitchen with bad Wi-Fi:
//   - pages: network first, falling back to the saved copy, then /offline/
//   - /assets/ (content-hashed) and /images/: cache first
// Nothing is sent anywhere; this only caches files from this site.

const VERSION = 'ce56fe8103';
const STATIC = `cs-static-${VERSION}`;
const PAGES = 'cs-pages';
const IMAGES = 'cs-images';
const PRECACHE = ["/","/offline/","/search/","/saved/","/meal-planner/","/shopping-list/","/what-can-i-make/","/collections/","/favicon.svg","/manifest.webmanifest","/assets/ce56fe8103/client/cook-mode.js","/assets/ce56fe8103/client/core.js","/assets/ce56fe8103/client/discover-page.js","/assets/ce56fe8103/client/home.js","/assets/ce56fe8103/client/offline-page.js","/assets/ce56fe8103/client/planner-page.js","/assets/ce56fe8103/client/recipe-page.js","/assets/ce56fe8103/client/saved-page.js","/assets/ce56fe8103/client/search-page.js","/assets/ce56fe8103/client/shopping-page.js","/assets/ce56fe8103/client/timers.js","/assets/ce56fe8103/data/index.json","/assets/ce56fe8103/data/vocab.json","/assets/ce56fe8103/lib/card.js","/assets/ce56fe8103/lib/discover.js","/assets/ce56fe8103/lib/format.js","/assets/ce56fe8103/lib/ingredient.js","/assets/ce56fe8103/lib/quantity.js","/assets/ce56fe8103/lib/search.js","/assets/ce56fe8103/lib/shopping.js","/assets/ce56fe8103/lib/text.js","/assets/ce56fe8103/lib/tokens.js","/assets/ce56fe8103/lib/units.js","/assets/ce56fe8103/lib/vocab.js","/assets/ce56fe8103/styles/site.css"];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('cs-static-') && k !== STATIC).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  const cache = await caches.open(PAGES);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request, { ignoreSearch: true })) || (await caches.match(request, { ignoreSearch: true })) || (await caches.match('/offline/')) || Response.error();
  }
}

async function cacheFirst(request, cacheName) {
  const hit = await caches.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) (await caches.open(cacheName)).put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
  } else if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request, STATIC));
  } else if (url.pathname.startsWith('/images/')) {
    event.respondWith(cacheFirst(request, IMAGES));
  }
});

// Saved recipes are fetched ahead of time so they open offline.
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'cache-pages' && Array.isArray(data.urls)) {
    event.waitUntil(
      caches.open(PAGES).then((cache) =>
        Promise.all(
          data.urls
            .filter((u) => typeof u === 'string' && u.startsWith('/'))
            .map((u) => fetch(u).then((r) => (r.ok ? cache.put(u, r) : null)).catch(() => null)),
        ),
      ),
    );
  }
});
