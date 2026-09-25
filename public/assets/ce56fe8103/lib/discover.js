// "What can I make?": find recipes in the CookSimple collection that use the
// ingredients a reader already has. It only searches existing recipes; it
// does not invent new ones.

import { resolveTerm } from './vocab.js';
import { normalize } from './text.js';

/**
 * entries: search entries with `ingredients: [{key, name, optional, pantry}]`
 * termIndex: from buildTermIndex()
 * terms: strings the reader typed
 * opts.assumePantry: treat salt, pepper, oil, flour, sugar, water... as on hand
 */
export function discover(entries, termIndex, terms, { assumePantry = true } = {}) {
  const resolved = [];
  const unmatched = [];
  for (const term of terms) {
    const keys = resolveTerm(termIndex, term);
    if (keys.length) resolved.push({ term, keys: new Set(keys) });
    else unmatched.push(term);
  }
  const have = new Set(resolved.flatMap((r) => [...r.keys]));
  const results = [];
  for (const e of entries) {
    const recipeKeys = new Set(e.ingredients.map((i) => i.key));
    const used = resolved.filter((r) => [...r.keys].some((k) => recipeKeys.has(k)));
    if (!used.length) continue;
    const missing = [];
    const pantryNeeded = [];
    for (const i of e.ingredients) {
      if (i.optional || have.has(i.key)) continue;
      if (i.pantry && assumePantry) pantryNeeded.push(i);
      else missing.push(i);
    }
    results.push({
      entry: e,
      used: used.map((u) => u.term),
      missing,
      pantryNeeded,
    });
  }
  results.sort(
    (a, b) =>
      b.used.length - a.used.length ||
      a.missing.length - b.missing.length ||
      a.entry.totalMinutes - b.entry.totalMinutes ||
      a.entry.title.localeCompare(b.entry.title),
  );
  return {
    resolved: resolved.map((r) => ({ term: r.term, keys: [...r.keys] })),
    unmatched,
    results,
  };
}

/** Terms a reader could type, for autocomplete: every key and synonym used in the collection. */
export function suggestionList(vocab, usedKeys) {
  const out = new Map();
  for (const key of usedKeys) {
    const v = vocab[key] || {};
    for (const name of [key, ...(v.family || []), ...(v.syn || [])]) {
      const n = normalize(name);
      if (n && !out.has(n)) out.set(n, name);
    }
  }
  return [...out.values()].sort((a, b) => a.localeCompare(b));
}
