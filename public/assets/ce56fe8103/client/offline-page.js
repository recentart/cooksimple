// Offline page: list the recipe pages this device has saved.

import { initPage, loadData, esc } from './core.js';

initPage();
const list = document.querySelector('[data-offline-list]');

try {
  const urls = new Set();
  for (const name of await caches.keys()) {
    const cache = await caches.open(name);
    for (const req of await cache.keys()) {
      const m = new URL(req.url).pathname.match(/^\/recipes\/([a-z0-9-]+)\/$/);
      if (m) urls.add(m[1]);
    }
  }
  let titles = new Map();
  try {
    titles = new Map((await loadData('index.json')).map((e) => [e.id, e.title]));
  } catch {
    /* index not cached */
  }
  const ids = [...urls].sort((a, b) => (titles.get(a) || a).localeCompare(titles.get(b) || b));
  list.innerHTML = ids.length ? ids.map((id) => `<li><a href="/recipes/${esc(id)}/">${esc(titles.get(id) || id)}</a></li>`).join('') : '<li>No recipes saved on this device yet. Open a recipe while online, or tap Save on it.</li>';
} catch {
  list.innerHTML = '<li>This browser doesn’t support offline recipes.</li>';
}
