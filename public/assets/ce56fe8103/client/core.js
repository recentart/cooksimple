// Shared browser helpers: storage that never throws, the unit preference,
// the shopping-list badge and a small non-blocking toast.

import { sanitizeList, itemCount } from '../lib/shopping.js';

const areas = { local: () => window.localStorage, session: () => window.sessionStorage };

export const store = {
  get(area, key, fallback = null) {
    try {
      const raw = areas[area]().getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(area, key, value) {
    try {
      areas[area]().setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(area, key) {
    try {
      areas[area]().removeItem(key);
    } catch {
      /* storage unavailable */
    }
  },
};

// ---------- Units (US / metric) ----------

const UNITS_KEY = 'cs-units';

export function getUnits() {
  try {
    return window.localStorage.getItem(UNITS_KEY) === 'metric' ? 'metric' : 'us';
  } catch {
    return document.documentElement.getAttribute('data-units') === 'metric' ? 'metric' : 'us';
  }
}

export function setUnits(units) {
  const u = units === 'metric' ? 'metric' : 'us';
  if (u === 'metric') document.documentElement.setAttribute('data-units', 'metric');
  else document.documentElement.removeAttribute('data-units');
  try {
    window.localStorage.setItem(UNITS_KEY, u);
  } catch {
    /* preference just won't persist */
  }
  document.dispatchEvent(new CustomEvent('cs:units', { detail: u }));
}

/** Wire every name="units" radio group inside `root` to the preference. */
export function bindUnitToggles(root = document) {
  const radios = root.querySelectorAll('input[type="radio"][name="units"]');
  const sync = () => {
    const u = getUnits();
    for (const r of radios) r.checked = r.value === u;
  };
  for (const r of radios) r.addEventListener('change', () => r.checked && setUnits(r.value));
  document.addEventListener('cs:units', sync);
  sync();
}

// ---------- Shopping list storage ----------

export const LIST_KEY = 'cs:shopping';

export function loadList() {
  return sanitizeList(store.get('local', LIST_KEY, null));
}

export function saveList(list) {
  const ok = store.set('local', LIST_KEY, list);
  updateListCount(list);
  return ok;
}

export function updateListCount(list = loadList()) {
  const n = itemCount(list);
  for (const el of document.querySelectorAll('[data-list-count]')) {
    el.hidden = n === 0;
    el.textContent = n ? String(n) : '';
    el.setAttribute('aria-label', `${n} ${n === 1 ? 'item' : 'items'}`);
  }
}

// ---------- Toast ----------

let toastTimer = 0;

/** Show a short message at the bottom of the screen. Never blocks the page. */
export function toast(message, link) {
  const el = document.querySelector('.toast');
  if (!el) return;
  el.replaceChildren(document.createTextNode(message));
  if (link) {
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.text;
    el.append(' ', a);
  }
  el.hidden = false;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('is-visible');
    el.hidden = true;
  }, 5000);
}

export function readJSON(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  try {
    return JSON.parse(el.textContent);
  } catch {
    return null;
  }
}

export function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function debounce(fn, ms) {
  let t = 0;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/** Common setup for every page. */
export function initPage() {
  updateListCount();
  registerServiceWorker();
  window.addEventListener('storage', (e) => {
    if (e.key === LIST_KEY) updateListCount();
    if (e.key === UNITS_KEY) {
      setUnits(e.newValue === 'metric' ? 'metric' : 'us');
    }
  });
}

// ---------- Saved recipes, notes and meal plan (browser only) ----------

const FAV_KEY = 'cs:favorites';
const PLAN_KEY = 'cs:plan';
const notesKey = (id) => `cs:notes:${id}`;

export function getFavorites() {
  const raw = store.get('local', FAV_KEY, []);
  return Array.isArray(raw) ? raw.filter((x) => typeof x === 'string' && /^[a-z0-9-]+$/.test(x)) : [];
}

export function setFavorite(id, on) {
  const list = getFavorites().filter((x) => x !== id);
  if (on) list.unshift(id);
  store.set('local', FAV_KEY, list);
  if (on) cachePages([`/recipes/${id}/`]);
  return list;
}

export function getNotes(id) {
  const v = store.get('local', notesKey(id), '');
  return typeof v === 'string' ? v.slice(0, 2000) : '';
}

export function setNotes(id, text) {
  const t = String(text || '').slice(0, 2000);
  if (t.trim()) return store.set('local', notesKey(id), t);
  store.remove('local', notesKey(id));
  return true;
}

/** Ids of every recipe with notes saved. */
export function notedRecipes() {
  const out = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('cs:notes:')) out.push(k.slice(9));
    }
  } catch {
    /* storage unavailable */
  }
  return out;
}

/** Meal plan: { v: 1, items: [{ uid, id, day (0-6), servings }] } */
export function getPlan() {
  const raw = store.get('local', PLAN_KEY, null);
  const plan = { v: 1, items: [] };
  if (raw && raw.v === 1 && Array.isArray(raw.items)) {
    for (const it of raw.items) {
      if (it && typeof it.id === 'string' && /^[a-z0-9-]+$/.test(it.id) && Number.isInteger(it.day) && it.day >= 0 && it.day <= 6 && Number.isInteger(it.servings) && it.servings >= 1 && it.servings <= 1000) {
        plan.items.push({ uid: String(it.uid || Math.random().toString(36).slice(2)), id: it.id, day: it.day, servings: it.servings });
      }
    }
  }
  return plan;
}

export function savePlan(plan) {
  return store.set('local', PLAN_KEY, { v: 1, items: plan.items.slice(0, 200) });
}

export function addToPlan(id, day, servings) {
  const plan = getPlan();
  plan.items.push({ uid: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, id, day, servings });
  return savePlan(plan);
}

// ---------- Data files (content-hashed, cached by the service worker) ----------

const dataCache = new Map();
export function loadData(name) {
  if (!dataCache.has(name)) {
    const url = new URL(`../data/${name}`, import.meta.url);
    dataCache.set(
      name,
      fetch(url).then((r) => {
        if (!r.ok) throw new Error(`Could not load ${name}`);
        return r.json();
      }),
    );
  }
  return dataCache.get(name);
}

// ---------- Offline support ----------

export function cachePages(urls) {
  try {
    navigator.serviceWorker?.controller?.postMessage({ type: 'cache-pages', urls });
  } catch {
    /* no service worker */
  }
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || location.protocol !== 'https:' && location.hostname !== 'localhost') return;
  navigator.serviceWorker
    .register('/sw.js')
    .then(() => navigator.serviceWorker.ready)
    .then(() => {
      const favs = getFavorites();
      if (favs.length) cachePages(favs.map((id) => `/recipes/${id}/`));
    })
    .catch(() => {});
}

// ---------- Sharing ----------

export async function shareLink(title, url) {
  const full = new URL(url, location.origin).href;
  if (navigator.share) {
    try {
      await navigator.share({ title, url: full });
      return 'shared';
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled';
    }
  }
  try {
    await navigator.clipboard.writeText(full);
    return 'copied';
  } catch {
    return 'failed';
  }
}
