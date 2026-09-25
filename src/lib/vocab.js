// Ingredient vocabulary lookups: resolving what a reader types in
// "What can I make?" to vocabulary keys.

import { normalize, words } from './text.js';

/**
 * Build a term index from the vocabulary.
 *   exact:  normalised key or synonym  -> Set(keys)
 *   family: normalised family name     -> Set(keys)
 */
export function buildTermIndex(vocab, onlyKeys) {
  const exact = new Map();
  const family = new Map();
  const add = (map, term, key) => {
    const n = normalize(term);
    if (!n) return;
    if (!map.has(n)) map.set(n, new Set());
    map.get(n).add(key);
  };
  for (const [key, v] of Object.entries(vocab)) {
    if (key.startsWith('_')) continue;
    if (onlyKeys && !onlyKeys.has(key)) continue;
    add(exact, key, key);
    if (v.one) add(exact, v.one, key);
    for (const s of v.syn || []) add(exact, s, key);
    for (const f of v.family || []) add(family, f, key);
  }
  return { exact, family, keys: [...(onlyKeys || Object.keys(vocab).filter((k) => !k.startsWith('_')))] };
}

/**
 * Keys a typed term refers to. Exact names and synonyms win, then family
 * names ("chicken" -> every chicken cut), then keys containing all the
 * typed words ("thigh" -> "boneless chicken thighs").
 */
export function resolveTerm(index, term) {
  const n = normalize(term);
  if (!n) return [];
  const found = new Set();
  for (const k of index.exact.get(n) || []) found.add(k);
  for (const k of index.family.get(n) || []) found.add(k);
  if (found.size) return [...found];
  const tw = n.split(' ');
  for (const key of index.keys) {
    const kw = words(key);
    if (tw.every((w) => kw.includes(w))) found.add(key);
  }
  return [...found];
}
