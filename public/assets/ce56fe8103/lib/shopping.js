// Shopping list logic (pure). The list lives in the reader's browser only.
//
// State shape (version 1):
//   { v: 1,
//     recipes: [{ id, title, url, servings, servingsLabel, items: [Item] }],
//     custom:  [{ id, text }],
//     checked: { [rowKey]: true } }
// Item: { key, name, one, aisle, pantry, dim, unit, size, base, gramsPerCup }
//   dim 'volume' | 'weight' base in mL / g; dim 'count' base is a count of `unit` (or of the item)
//   base is null for "to taste" items.

import { scaleRange, formatMeasure, formatCount, countValue } from './format.js';
import { toBase, unitLabel } from './units.js';

export const AISLE_ORDER = ['produce', 'meat-seafood', 'dairy-eggs', 'bakery', 'pantry', 'baking', 'spices', 'frozen', 'other'];
export const AISLE_LABELS = {
  produce: 'Produce',
  'meat-seafood': 'Meat & seafood',
  'dairy-eggs': 'Dairy & eggs',
  bakery: 'Bread & bakery',
  pantry: 'Pantry',
  baking: 'Baking',
  spices: 'Spices & seasonings',
  frozen: 'Frozen',
  other: 'Other',
  staples: 'Staples you may already have',
};

export function emptyList() {
  return { v: 1, recipes: [], custom: [], checked: {} };
}

/** Make sure a value read from storage is a usable list. */
export function sanitizeList(raw) {
  const list = emptyList();
  if (!raw || typeof raw !== 'object' || raw.v !== 1) return list;
  if (Array.isArray(raw.recipes)) {
    for (const r of raw.recipes) {
      if (r && typeof r.id === 'string' && typeof r.title === 'string' && Array.isArray(r.items)) {
        list.recipes.push({ ...r, items: r.items.filter((i) => i && typeof i.key === 'string' && typeof i.name === 'string') });
      }
    }
  }
  if (Array.isArray(raw.custom)) {
    for (const c of raw.custom) if (c && typeof c.id === 'string' && typeof c.text === 'string' && c.text.trim()) list.custom.push({ id: c.id, text: c.text.slice(0, 120) });
  }
  if (raw.checked && typeof raw.checked === 'object') {
    for (const [k, v] of Object.entries(raw.checked)) if (v === true) list.checked[k] = true;
  }
  return list;
}

/**
 * Shopping items for a recipe at a scale. `skip` is a Set of ingredient
 * indexes to leave out (the ones the reader already ticked off).
 */
export function recipeItems(ingredients, factor, skip = new Set()) {
  const items = [];
  for (const ing of ingredients) {
    if (!ing.shop || skip.has(ing.i)) continue;
    const amt = ing.amount ? scaleRange(ing.amount, factor, ing.scale) : null;
    let base = null;
    if (amt) {
      if (ing.dim === 'count') {
        const whole = ing.scale === 'whole';
        base = whole ? { min: countValue({ max: amt.min }, true), max: countValue(amt, true) } : amt;
      } else {
        base = { min: toBase(amt.min, ing.unit), max: toBase(amt.max, ing.unit) };
      }
    }
    items.push({
      key: ing.key,
      name: ing.key,
      one: ing.one || ing.key,
      aisle: ing.aisle,
      pantry: !!ing.pantry,
      dim: ing.dim,
      unit: ing.dim === 'count' ? ing.unit || null : null,
      size: ing.size || null,
      base,
      gramsPerCup: ing.gramsPerCup || null,
      optional: !!ing.optional,
    });
  }
  return items;
}

/** Add (or replace) a recipe on the list. Re-adding a recipe never duplicates it. */
export function addRecipe(list, recipe) {
  const next = { ...list, recipes: list.recipes.filter((r) => r.id !== recipe.id) };
  next.recipes.push(recipe);
  return next;
}

export function removeRecipe(list, id) {
  return { ...list, recipes: list.recipes.filter((r) => r.id !== id) };
}

export function addCustom(list, text, id) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  if (!clean) return list;
  if (list.custom.some((c) => c.text.toLowerCase() === clean.toLowerCase())) return list;
  return { ...list, custom: [...list.custom, { id, text: clean }] };
}

function sizeKey(size) {
  if (!size) return '';
  return `${Math.round(toBase(size.amount.max, size.unit))}${size.unit === 'g' || size.unit === 'kg' || size.unit === 'oz' || size.unit === 'lb' ? 'g' : 'ml'}`;
}

/** Merged-row key for an item: one row per ingredient (and per can size). */
export function rowKeyOf(it) {
  return `${it.key}${it.size ? `|${sizeKey(it.size)}` : ''}`;
}

const add = (a, b) => (a ? { min: a.min + b.min, max: a.max + b.max } : { ...b });

/** Merge items from every recipe into one row per ingredient (and can size). */
export function mergedRows(list) {
  const rows = new Map();
  for (const r of list.recipes) {
    for (const it of r.items) {
      const rowKey = rowKeyOf(it);
      let row = rows.get(rowKey);
      if (!row) {
        row = { rowKey, key: it.key, name: it.name, one: it.one, aisle: it.aisle, pantry: it.pantry, size: it.size, gramsPerCup: it.gramsPerCup, volume: null, weight: null, counts: {}, noAmount: false, recipes: [], optional: true };
        rows.set(rowKey, row);
      }
      if (!row.recipes.includes(r.title)) row.recipes.push(r.title);
      if (!it.optional) row.optional = false;
      if (!it.base) row.noAmount = true;
      else if (it.dim === 'volume') row.volume = add(row.volume, it.base);
      else if (it.dim === 'weight') row.weight = add(row.weight, it.base);
      else row.counts[it.unit || ''] = add(row.counts[it.unit || ''], it.base);
      if (!row.gramsPerCup && it.gramsPerCup) row.gramsPerCup = it.gramsPerCup;
    }
  }
  return [...rows.values()];
}

/** Human text for a merged row, e.g. "3 yellow onions", "1½ cups (188 g) + 2 oz all-purpose flour". */
export function rowText(row, system = 'us') {
  const parts = [];
  let countOnly = null;
  for (const [unit, amt] of Object.entries(row.counts)) {
    const text = formatCount(amt, false);
    if (unit) {
      const size = row.size ? ` (${formatMeasure({ min: toBase(row.size.amount.min, row.size.unit), max: toBase(row.size.amount.max, row.size.unit) }, row.size.unit === 'oz' || row.size.unit === 'lb' || row.size.unit === 'g' || row.size.unit === 'kg' ? 'weight' : 'volume', system, row.size.unit, null).text})` : '';
      parts.push(`${text}${size} ${unitLabel(unit, amt.max)}`);
    } else {
      parts.push(text);
      countOnly = amt;
    }
  }
  if (row.volume) {
    const m = formatMeasure(row.volume, 'volume', system, null, row.gramsPerCup);
    parts.push(m.alt ? `${m.text} (${m.alt})` : m.text);
  }
  if (row.weight) parts.push(formatMeasure(row.weight, 'weight', system, null, null).text);
  const onlyCounts = countOnly && parts.length === 1;
  const name = onlyCounts ? (countOnly.max > 1 ? row.name : row.one) : row.name;
  return parts.length ? `${parts.join(' + ')} ${name}` : name[0].toUpperCase() + name.slice(1);
}

/** Rows grouped by aisle, with pantry staples in their own group at the end. */
export function groupedRows(list) {
  const rows = mergedRows(list);
  const groups = new Map();
  for (const row of rows) {
    const g = row.pantry ? 'staples' : AISLE_ORDER.includes(row.aisle) ? row.aisle : 'other';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(row);
  }
  const order = [...AISLE_ORDER, 'staples'];
  return order
    .filter((g) => groups.has(g) || (g === 'other' && list.custom.length))
    .map((g) => ({ aisle: g, label: AISLE_LABELS[g], rows: (groups.get(g) || []).sort((a, b) => a.name.localeCompare(b.name)), custom: g === 'other' ? list.custom : [] }));
}

/** Remove checked marks for rows that no longer exist. */
export function pruneChecked(list) {
  const keys = new Set(mergedRows(list).map((r) => r.rowKey));
  for (const c of list.custom) keys.add(`custom:${c.id}`);
  const checked = {};
  for (const k of Object.keys(list.checked)) if (keys.has(k)) checked[k] = true;
  return { ...list, checked };
}

/** Plain-text version for copying into a notes app or message. */
export function listAsText(list, system = 'us') {
  const lines = [];
  for (const g of groupedRows(list)) {
    lines.push(g.label.toUpperCase());
    for (const row of g.rows) lines.push(`${list.checked[row.rowKey] ? '[x]' : '[ ]'} ${rowText(row, system)}`);
    for (const c of g.custom) lines.push(`${list.checked[`custom:${c.id}`] ? '[x]' : '[ ]'} ${c.text}`);
    lines.push('');
  }
  return lines.join('\n').trim();
}

export function itemCount(list) {
  return mergedRows(list).length + list.custom.length;
}
