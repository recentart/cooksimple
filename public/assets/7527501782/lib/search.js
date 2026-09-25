// Recipe search over the small built-in index. Pure functions: the build
// creates the entries, the browser (and the tests) run the queries.

import { normalize, words } from './text.js';

const STOP = new Set(['a', 'an', 'and', 'the', 'with', 'for', 'of', 'in', 'to', 'recipe', 'on', 'or', 'my', 'some', 'dish', 'meal', 'food', 'easy', 'best', 'simple']);

// Query words that mean "quick" rather than a literal word to match.
const QUICK_WORDS = new Set(['quick', 'fast', 'weeknight']);

/** Prepare the searchable word lists for each entry once. */
export function prepareIndex(entries) {
  // Cuisine names are matched as cuisines only, so "italian" doesn't match
  // "Italian parsley" in an ingredient list.
  const cuisineWords = new Set(entries.flatMap((e) => words(e.cuisine)));
  return entries.map((e) => ({
    entry: e,
    title: words(e.title),
    ingredients: new Set(e.searchIngredients.flatMap((s) => words(s)).filter((w) => !cuisineWords.has(w))),
    facets: new Set([...words(e.cuisine), ...e.mealTypes.flatMap((m) => words(m)), ...e.diets.flatMap((d) => words(d)), ...e.tags.flatMap((t) => words(t.replace(/-/g, ' '))), ...(e.tags.includes('one-pan') ? ['one', 'pan', 'pot', 'sheet'] : [])]),
    desc: new Set(words(e.description)),
  }));
}

/**
 * Parse a free-text query. Pulls out time limits ("30 minutes", "under 20 min")
 * and "quick", leaving the words to match.
 */
export function parseQuery(q) {
  let text = String(q || '').slice(0, 200);
  let maxTime = null;
  let quick = false;
  text = text.replace(/(?:under|less than|in|within)?\s*(\d{1,3})\s*(?:-|\s)?\s*(?:min|mins|minute|minutes)\b/gi, (_, n) => {
    maxTime = Number(n);
    return ' ';
  });
  const list = [];
  for (const w of words(text)) {
    if (STOP.has(w)) continue;
    if (QUICK_WORDS.has(w)) {
      quick = true;
      continue;
    }
    if (!list.includes(w)) list.push(w);
  }
  return { words: list, maxTime, quick };
}

function scoreWord(item, w) {
  const prefix = w.length >= 3;
  const inList = (list, exactPts, prefixPts) => {
    let best = 0;
    for (const x of list) {
      if (x === w) return exactPts;
      if (prefix && x.startsWith(w)) best = prefixPts;
    }
    return best;
  };
  return Math.max(inList(item.title, 10, 6), inList(item.ingredients, 6, 3), inList(item.facets, 5, 3), inList(item.desc, 2, 1));
}

/**
 * Run a search.
 *   opts: { q, meals: [], diets: [], tags: [], quick, maxTime, cuisine, sort }
 * Returns { results: [{entry, score}], partial: bool, parsed }.
 * Every query word must match (AND). If that finds nothing, recipes that
 * match some of the words are returned with partial = true.
 */
export function searchRecipes(index, opts = {}) {
  const parsed = parseQuery(opts.q);
  const maxTime = Math.min(opts.maxTime || Infinity, parsed.maxTime || Infinity);
  const quick = opts.quick || parsed.quick;
  const meals = opts.meals || [];
  const diets = opts.diets || [];
  const tags = opts.tags || [];
  const cuisine = opts.cuisine ? normalize(opts.cuisine) : '';

  const pass = index.filter(({ entry: e }) => {
    if (meals.length && !meals.some((m) => e.mealTypes.includes(m))) return false;
    if (diets.some((d) => !e.diets.includes(d))) return false;
    if (tags.some((t) => !e.tags.includes(t))) return false;
    if (quick && !e.quick) return false;
    if (e.totalMinutes > maxTime) return false;
    if (cuisine && normalize(e.cuisine) !== cuisine) return false;
    return true;
  });

  let results = [];
  let partial = false;
  if (!parsed.words.length) {
    results = pass.map((item) => ({ entry: item.entry, score: 0 }));
  } else {
    const scored = pass.map((item) => {
      const scores = parsed.words.map((w) => scoreWord(item, w));
      return { entry: item.entry, score: scores.reduce((a, b) => a + b, 0), all: scores.every((s) => s > 0) };
    });
    results = scored.filter((s) => s.all);
    if (!results.length) {
      results = scored.filter((s) => s.score > 0);
      partial = results.length > 0;
    }
    results = results.map(({ entry, score }) => ({ entry, score }));
  }
  sortResults(results, opts.sort || (parsed.words.length ? 'relevance' : 'featured'));
  return { results, partial, parsed: { ...parsed, maxTime: Number.isFinite(maxTime) ? maxTime : null, quick } };
}

export function sortResults(results, sort) {
  const byTitle = (a, b) => a.entry.title.localeCompare(b.entry.title);
  const cmp = {
    relevance: (a, b) => b.score - a.score || a.entry.totalMinutes - b.entry.totalMinutes || byTitle(a, b),
    quickest: (a, b) => a.entry.totalMinutes - b.entry.totalMinutes || byTitle(a, b),
    newest: (a, b) => b.entry.added.localeCompare(a.entry.added) || b.entry.order - a.entry.order,
    az: byTitle,
    featured: (a, b) => Number(b.entry.featured) - Number(a.entry.featured) || byTitle(a, b),
  }[sort] || ((a, b) => b.score - a.score || byTitle(a, b));
  results.sort(cmp);
  return results;
}
