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
  window.addEventListener('storage', (e) => {
    if (e.key === LIST_KEY) updateListCount();
    if (e.key === UNITS_KEY) {
      setUnits(e.newValue === 'metric' ? 'metric' : 'us');
    }
  });
}
