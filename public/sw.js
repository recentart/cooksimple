// CookSimple service worker (generated from src/sw-template.js by the build).
// Makes the site usable in a kitchen with bad Wi-Fi:
//   - pages: network first, falling back to the saved copy, then /offline/
//   - /assets/ (content-hashed) and /images/: cache first
// Nothing is sent anywhere; this only caches files from this site.

const VERSION = 'bcb1191c8b';
const STATIC = `cs-static-${VERSION}`;
const PAGES = 'cs-pages';
const IMAGES = 'cs-images';
const PRECACHE = ["/","/offline/","/search/","/saved/","/meal-planner/","/shopping-list/","/what-can-i-make/","/collections/","/favicon.svg","/manifest.webmanifest","/assets/bcb1191c8b/client/cook-mode.js","/assets/bcb1191c8b/client/core.js","/assets/bcb1191c8b/client/discover-page.js","/assets/bcb1191c8b/client/home.js","/assets/bcb1191c8b/client/offline-page.js","/assets/bcb1191c8b/client/planner-page.js","/assets/bcb1191c8b/client/recipe-page.js","/assets/bcb1191c8b/client/saved-page.js","/assets/bcb1191c8b/client/search-page.js","/assets/bcb1191c8b/client/shopping-page.js","/assets/bcb1191c8b/client/timers.js","/assets/bcb1191c8b/data/index.json","/assets/bcb1191c8b/data/vocab.json","/assets/bcb1191c8b/lib/card.js","/assets/bcb1191c8b/lib/discover.js","/assets/bcb1191c8b/lib/format.js","/assets/bcb1191c8b/lib/ingredient.js","/assets/bcb1191c8b/lib/quantity.js","/assets/bcb1191c8b/lib/search.js","/assets/bcb1191c8b/lib/shopping.js","/assets/bcb1191c8b/lib/text.js","/assets/bcb1191c8b/lib/tokens.js","/assets/bcb1191c8b/lib/units.js","/assets/bcb1191c8b/lib/vocab.js","/assets/bcb1191c8b/styles/site.css"];

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
