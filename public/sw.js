// CookSimple service worker (generated from src/sw-template.js by the build).
// Makes the site usable in a kitchen with bad Wi-Fi:
//   - pages: network first, falling back to the saved copy, then /offline/
//   - /assets/ (content-hashed) and /images/: cache first
// Nothing is sent anywhere; this only caches files from this site.

const VERSION = '91fb7e46e7';
const STATIC = `cs-static-${VERSION}`;
const PAGES = 'cs-pages';
const IMAGES = 'cs-images';
const PRECACHE = ["/","/offline/","/search/","/saved/","/meal-planner/","/shopping-list/","/what-can-i-make/","/collections/","/favicon.svg","/manifest.webmanifest","/assets/91fb7e46e7/client/cook-mode.js","/assets/91fb7e46e7/client/core.js","/assets/91fb7e46e7/client/discover-page.js","/assets/91fb7e46e7/client/home.js","/assets/91fb7e46e7/client/offline-page.js","/assets/91fb7e46e7/client/planner-page.js","/assets/91fb7e46e7/client/recipe-page.js","/assets/91fb7e46e7/client/saved-page.js","/assets/91fb7e46e7/client/search-page.js","/assets/91fb7e46e7/client/shopping-page.js","/assets/91fb7e46e7/client/timers.js","/assets/91fb7e46e7/data/index.json","/assets/91fb7e46e7/data/vocab.json","/assets/91fb7e46e7/lib/card.js","/assets/91fb7e46e7/lib/discover.js","/assets/91fb7e46e7/lib/format.js","/assets/91fb7e46e7/lib/ingredient.js","/assets/91fb7e46e7/lib/quantity.js","/assets/91fb7e46e7/lib/search.js","/assets/91fb7e46e7/lib/shopping.js","/assets/91fb7e46e7/lib/text.js","/assets/91fb7e46e7/lib/tokens.js","/assets/91fb7e46e7/lib/units.js","/assets/91fb7e46e7/lib/vocab.js","/assets/91fb7e46e7/styles/site.css"];

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
  if (url.origin !== self.location.origin || url.pathname.startsWith('/ad/')) return;
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
