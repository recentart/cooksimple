// Loading, validating and normalising recipe files (build-time only).
// Every rule here exists so that a mistake in a recipe file fails the build
// with a clear message instead of reaching readers.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseAmount } from '../../src/lib/quantity.js';
import { unitId, isKnownUnit, dimensionOf } from '../../src/lib/units.js';
import { tokenErrors, stepTimers, stepTemps } from '../../src/lib/tokens.js';
import { singularize } from '../../src/lib/text.js';

export const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const RECIPES_DIR = join(ROOT, 'recipes');
export const VOCAB_FILE = join(ROOT, 'data', 'ingredients.json');
export const VOCAB_ADDITIONS_DIR = join(ROOT, 'data', 'vocab-additions');
export const ILLUSTRATIONS_DIR = join(ROOT, 'src', 'illustrations');

export const CUISINES = ['American', 'Mexican', 'Tex-Mex', 'Italian', 'Chinese', 'Chinese-American', 'Indian', 'Middle Eastern', 'Mediterranean', 'North African', 'Thai', 'Japanese', 'Korean', 'French', 'Greek', 'British', 'Global'];
export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'dessert', 'snack', 'side'];
export const DIETS = ['vegetarian', 'vegan'];
export const TAGS = ['one-pan', 'make-ahead', 'no-cook', 'freezer-friendly', 'baking'];
export const AISLES = {
  produce: 'Produce',
  'meat-seafood': 'Meat & seafood',
  'dairy-eggs': 'Dairy & eggs',
  bakery: 'Bread & bakery',
  pantry: 'Pantry',
  baking: 'Baking',
  spices: 'Spices & seasonings',
  frozen: 'Frozen',
  other: 'Other',
};
export const FLAGS = ['meat', 'fish', 'dairy', 'egg', 'honey', 'rennet'];
const NOT_VEGETARIAN = ['meat', 'fish', 'rennet'];
const NOT_VEGAN = [...NOT_VEGETARIAN, 'dairy', 'egg', 'honey'];
const SCALE_RULES = ['linear', 'fixed', 'whole', 'taste'];
const QUICK_MINUTES = 30;

const ING_FIELDS = new Set(['id', 'amount', 'unit', 'item', 'plural', 'key', 'prep', 'note', 'scale', 'scaleNote', 'gramsPerCup', 'size', 'optional']);
const RECIPE_FIELDS = new Set(['id', 'title', 'description', 'added', 'servings', 'servingsLabel', 'scaleOptions', 'scaleNote', 'prepMinutes', 'cookMinutes', 'totalMinutes', 'cuisine', 'mealTypes', 'diets', 'tags', 'featured', 'equipment', 'image', 'source', 'ingredients', 'steps', 'notes']);

// ---------- Vocabulary ----------

export function loadVocab() {
  const errors = [];
  const vocab = {};
  const files = [VOCAB_FILE];
  if (existsSync(VOCAB_ADDITIONS_DIR)) {
    for (const f of readdirSync(VOCAB_ADDITIONS_DIR).sort()) if (f.endsWith('.json')) files.push(join(VOCAB_ADDITIONS_DIR, f));
  }
  for (const file of files) {
    let data;
    try {
      data = JSON.parse(readFileSync(file, 'utf8'));
    } catch (e) {
      errors.push(`${basename(file)}: invalid JSON (${e.message})`);
      continue;
    }
    for (const [key, v] of Object.entries(data)) {
      if (key.startsWith('_')) continue;
      const where = `${basename(file)} → "${key}"`;
      if (vocab[key]) errors.push(`${where}: duplicate key (already defined)`);
      if (key !== key.toLowerCase()) errors.push(`${where}: keys must be lowercase`);
      if (!AISLES[v.aisle]) errors.push(`${where}: aisle must be one of ${Object.keys(AISLES).join(', ')}`);
      for (const f of v.contains || []) if (!FLAGS.includes(f)) errors.push(`${where}: unknown flag "${f}" in contains`);
      for (const f of Object.keys(v.varies || {})) if (!FLAGS.includes(f)) errors.push(`${where}: unknown flag "${f}" in varies`);
      if (v.gramsPerCup != null && !(v.gramsPerCup > 0)) errors.push(`${where}: gramsPerCup must be a positive number`);
      const known = new Set(['one', 'aisle', 'family', 'syn', 'pantry', 'contains', 'varies', 'gramsPerCup', 'shop']);
      for (const f of Object.keys(v)) if (!known.has(f)) errors.push(`${where}: unknown field "${f}"`);
      vocab[key] = v;
    }
  }
  return { vocab, errors };
}

// ---------- Recipes ----------

export function recipeFiles() {
  if (!existsSync(RECIPES_DIR)) return [];
  return readdirSync(RECIPES_DIR).filter((f) => f.endsWith('.json') && !f.startsWith('_')).sort();
}

export function loadRecipeFile(file) {
  const raw = readFileSync(join(RECIPES_DIR, file), 'utf8');
  return JSON.parse(raw);
}

function flattenIngredients(list, errors) {
  const out = [];
  if (!Array.isArray(list) || !list.length) {
    errors.push('ingredients must be a non-empty array');
    return out;
  }
  for (const entry of list) {
    if (entry && typeof entry === 'object' && 'group' in entry) {
      if (typeof entry.group !== 'string' || !entry.group.trim()) errors.push('ingredient group needs a "group" title');
      if (!Array.isArray(entry.items) || !entry.items.length) errors.push(`ingredient group "${entry.group}" needs a non-empty "items" array`);
      for (const it of entry.items || []) out.push({ ...it, group: entry.group });
    } else {
      out.push({ ...entry, group: null });
    }
  }
  return out;
}

const isStr = (v) => typeof v === 'string' && v.trim().length > 0;

/**
 * Validate one recipe and return { recipe (normalised), errors, warnings }.
 * `opts.illustrations` = true to require the image file to exist.
 */
export function validateRecipe(r, vocab, { file, illustrations = true } = {}) {
  const errors = [];
  const warnings = [];
  const err = (m) => errors.push(m);

  if (!r || typeof r !== 'object') return { errors: ['file does not contain a JSON object'], warnings };
  for (const f of Object.keys(r)) if (!RECIPE_FIELDS.has(f)) err(`unknown field "${f}"`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(r.id || '')) err('id must be a lowercase slug like "chicken-fried-rice"');
  if (file && r.id && file !== `${r.id}.json`) err(`id "${r.id}" must match the file name (${file})`);
  if (!isStr(r.title) || r.title.length > 70) err('title is required (max 70 characters)');
  if (!isStr(r.description) || r.description.length < 50 || r.description.length > 160) err(`description must be 50–160 characters (has ${r.description ? r.description.length : 0})`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.added || '') || Number.isNaN(Date.parse(r.added))) err('added must be a date like 2026-09-24');
  if (!Number.isInteger(r.servings) || r.servings < 1 || r.servings > 100) err('servings must be a whole number from 1 to 100');
  if (r.servingsLabel != null && (!isStr(r.servingsLabel) || r.servingsLabel !== r.servingsLabel.toLowerCase())) err('servingsLabel must be a lowercase plural noun like "cookies"');
  if (r.scaleOptions != null) {
    if (!Array.isArray(r.scaleOptions) || r.scaleOptions.length < 2 || r.scaleOptions.some((n) => !Number.isInteger(n) || n < 1 || n > 100)) err('scaleOptions must be an array of whole numbers from 1 to 100');
    else if (!r.scaleOptions.includes(r.servings)) err('scaleOptions must include the base servings');
  }
  if (r.scaleNote != null && !isStr(r.scaleNote)) err('scaleNote must be text');
  for (const f of ['prepMinutes', 'cookMinutes']) if (!Number.isInteger(r[f]) || r[f] < 0 || r[f] > 2880) err(`${f} must be a whole number of minutes`);
  if (r.totalMinutes != null && (!Number.isInteger(r.totalMinutes) || r.totalMinutes < (r.prepMinutes || 0) + (r.cookMinutes || 0))) err('totalMinutes (optional) must be at least prepMinutes + cookMinutes');
  if (!CUISINES.includes(r.cuisine)) err(`cuisine must be one of: ${CUISINES.join(', ')}`);
  if (!Array.isArray(r.mealTypes) || !r.mealTypes.length || r.mealTypes.some((m) => !MEAL_TYPES.includes(m))) err(`mealTypes must list one or more of: ${MEAL_TYPES.join(', ')}`);
  if (!Array.isArray(r.diets) || r.diets.some((d) => !DIETS.includes(d))) err(`diets must be an array using only: ${DIETS.join(', ')} (use [] for none)`);
  if (!Array.isArray(r.tags) || r.tags.some((t) => !TAGS.includes(t))) err(`tags must be an array using only: ${TAGS.join(', ')}`);
  if (r.featured != null && typeof r.featured !== 'boolean') err('featured must be true or false');
  if (r.equipment != null && (!Array.isArray(r.equipment) || r.equipment.some((e) => !isStr(e)))) err('equipment must be an array of strings');
  for (const e of r.equipment || []) for (const m of tokenErrors(e)) err(`equipment: ${m}`);

  // Image
  if (!r.image || !isStr(r.image.file) || !isStr(r.image.alt)) err('image needs "file" and "alt"');
  else if (illustrations && !existsSync(join(ILLUSTRATIONS_DIR, r.image.file))) err(`image file src/illustrations/${r.image.file} does not exist`);

  // Source / licence
  const src = r.source || {};
  if (src.type === 'original') {
    // nothing else needed
  } else if (src.type === 'licensed') {
    for (const f of ['title', 'author', 'url', 'license', 'licenseUrl']) if (!isStr(src[f])) err(`source.${f} is required for licensed recipes`);
  } else {
    err('source.type must be "original" or "licensed"');
  }

  // Ingredients
  const flat = flattenIngredients(r.ingredients, errors);
  const ids = new Set();
  const ings = [];
  flat.forEach((ing, i) => {
    const where = `ingredient ${i + 1}${ing.item ? ` ("${ing.item}")` : ''}`;
    for (const f of Object.keys(ing)) if (f !== 'group' && !ING_FIELDS.has(f)) err(`${where}: unknown field "${f}"`);
    if (!isStr(ing.item)) err(`${where}: item is required`);
    if (ing.id != null) {
      if (!/^[a-z0-9-]+$/.test(ing.id)) err(`${where}: id must be a short lowercase slug`);
      if (ids.has(ing.id)) err(`${where}: duplicate id "${ing.id}"`);
      ids.add(ing.id);
    }
    const rule = ing.scale || 'linear';
    if (!SCALE_RULES.includes(rule)) err(`${where}: scale must be one of ${SCALE_RULES.join(', ')}`);
    if (rule === 'fixed' && !isStr(ing.scaleNote)) err(`${where}: scale "fixed" needs a scaleNote explaining why`);
    let amount = null;
    if (rule === 'taste') {
      if (ing.amount != null) err(`${where}: scale "taste" items have no amount`);
    } else {
      amount = parseAmount(ing.amount);
      if (!amount) err(`${where}: amount "${ing.amount}" is not a valid amount (e.g. "1", "1 1/2", "2-3")`);
    }
    let unit = null;
    if (ing.unit != null) {
      unit = unitId(ing.unit);
      if (!unit || !isKnownUnit(unit)) err(`${where}: unknown unit "${ing.unit}"`);
      if (unit !== ing.unit) err(`${where}: write the unit as "${unit}"`);
    }
    if (rule === 'taste' && unit) err(`${where}: scale "taste" items have no unit`);
    const dim = dimensionOf(unit);
    if (rule === 'whole' && dim !== 'count') err(`${where}: scale "whole" is only for counted items (eggs, cans)`);
    let size = null;
    if (ing.size != null) {
      const m = String(ing.size).match(/^(.+?)\s+([a-zA-Z][a-zA-Z .]*)$/);
      const a = m && parseAmount(m[1]);
      const u = m && unitId(m[2]);
      if (!a || !u || dimensionOf(u) === 'count') err(`${where}: size must look like "15 oz" or "400 g"`);
      else size = { amount: a, unit: u };
      if (dim !== 'count') err(`${where}: size only makes sense with a count unit such as "can"`);
    }
    const v = vocab[ing.key];
    if (!isStr(ing.key)) err(`${where}: key is required (a key from data/ingredients.json)`);
    else if (!v) err(`${where}: key "${ing.key}" is not in data/ingredients.json`);
    if (ing.gramsPerCup != null && !(ing.gramsPerCup > 0)) err(`${where}: gramsPerCup must be positive`);
    const gramsPerCup = ing.gramsPerCup || (v && v.gramsPerCup) || null;
    if (ing.plural != null && !isStr(ing.plural)) err(`${where}: plural must be text`);
    if (ing.optional != null && typeof ing.optional !== 'boolean') err(`${where}: optional must be true or false`);
    for (const f of ['prep', 'note', 'scaleNote']) if (ing[f] != null && !isStr(ing[f])) err(`${where}: ${f} must be text`);
    if (ing.note && /^\(.*\)$/.test(ing.note.trim())) err(`${where}: write the note without surrounding parentheses`);
    for (const f of ['prep', 'note', 'item']) if (isStr(ing[f])) for (const m of tokenErrors(ing[f])) err(`${where}: ${f}: ${m}`);
    if (isStr(ing.item) && /\{/.test(ing.item)) err(`${where}: tokens are not allowed in item (use prep or note)`);
    if (ing.prep && /^,/.test(ing.prep.trim())) err(`${where}: write prep without a leading comma`);
    ings.push({
      i,
      id: ing.id || null,
      group: ing.group,
      key: ing.key,
      item: ing.item,
      plural: ing.plural || null,
      prep: ing.prep || null,
      note: ing.note || null,
      amount,
      unit,
      dim,
      scale: rule,
      scaleNote: ing.scaleNote || null,
      gramsPerCup: dim === 'volume' ? gramsPerCup : null,
      size,
      optional: !!ing.optional,
      aisle: v ? v.aisle : 'other',
      pantry: !!(v && v.pantry),
      shop: !(v && v.shop === false),
      one: v ? v.one || ing.key : ing.key,
    });
  });

  // Steps
  const steps = [];
  if (!Array.isArray(r.steps) || !r.steps.length) err('steps must be a non-empty array');
  (r.steps || []).forEach((s, i) => {
    const step = typeof s === 'string' ? { text: s } : s;
    const where = `step ${i + 1}`;
    if (!step || !isStr(step.text)) {
      err(`${where}: text is required`);
      return;
    }
    for (const f of Object.keys(step)) if (!['text', 'uses'].includes(f)) err(`${where}: unknown field "${f}"`);
    for (const m of tokenErrors(step.text)) err(`${where}: ${m}`);
    if (step.text.length > 420) warnings.push(`${where}: ${step.text.length} characters — consider splitting (Cook Mode shows one step at a time)`);
    const uses = [];
    for (const u of step.uses || []) {
      const ing = ings.find((x) => x.id === u);
      if (!ing) err(`${where}: uses "${u}" but no ingredient has that id`);
      else uses.push(ing.i);
    }
    for (const t of stepTemps(step.text)) {
      const f = t.unit === 'F' ? t.value : (t.value * 9) / 5 + 32;
      if (t.kind === 'oven' && (f < 170 || f > 550)) err(`${where}: oven temperature ${t.value}${t.unit} looks wrong`);
      if (t.kind === 'internal' && (f < 100 || f > 212)) err(`${where}: internal temperature ${t.value}${t.unit} looks wrong`);
    }
    steps.push({ text: step.text, uses, timers: stepTimers(step.text) });
  });
  if (r.notes != null && (!Array.isArray(r.notes) || r.notes.some((n) => !isStr(n)))) err('notes must be an array of strings');
  for (const n of r.notes || []) for (const m of tokenErrors(n)) err(`notes: ${m}`);

  // Diets: claims must agree with the ingredient flags.
  const flags = new Set();
  const labelChecks = [];
  for (const ing of ings) {
    const v = vocab[ing.key];
    if (!v) continue;
    for (const f of v.contains || []) flags.add(f);
  }
  const claims = new Set(r.diets || []);
  if (claims.has('vegan')) claims.add('vegetarian');
  const offending = (list) => ings.filter((ing) => (vocab[ing.key]?.contains || []).some((f) => list.includes(f))).map((x) => x.item);
  if (claims.has('vegetarian') && NOT_VEGETARIAN.some((f) => flags.has(f))) err(`labelled vegetarian but uses: ${offending(NOT_VEGETARIAN).join(', ')}`);
  if (claims.has('vegan') && NOT_VEGAN.some((f) => flags.has(f))) err(`labelled vegan but uses: ${offending(NOT_VEGAN).join(', ')}`);
  if (!claims.has('vegetarian') && !NOT_VEGETARIAN.some((f) => flags.has(f))) warnings.push('no meat, fish or rennet — should this be labelled vegetarian?');
  else if (claims.has('vegetarian') && !claims.has('vegan') && !NOT_VEGAN.some((f) => flags.has(f))) warnings.push('no animal products — should this be labelled vegan?');
  for (const ing of ings) {
    const v = vocab[ing.key];
    for (const [flag, note] of Object.entries((v && v.varies) || {})) {
      const relevant = (claims.has('vegan') && NOT_VEGAN.includes(flag)) || (claims.has('vegetarian') && NOT_VEGETARIAN.includes(flag));
      if (relevant && !labelChecks.some((c) => c.key === ing.key)) labelChecks.push({ key: ing.key, item: ing.item, note });
    }
  }

  const prep = r.prepMinutes || 0;
  const cook = r.cookMinutes || 0;
  const total = r.totalMinutes || prep + cook;
  const ovenTemps = [];
  for (const s of steps) for (const t of stepTemps(s.text)) if (t.kind === 'oven' && !ovenTemps.some((o) => o.value === t.value && o.unit === t.unit)) ovenTemps.push({ value: t.value, unit: t.unit, kind: 'oven' });

  const servingsLabel = r.servingsLabel || 'servings';
  const recipe = {
    id: r.id,
    title: r.title,
    description: r.description,
    added: r.added,
    servings: r.servings,
    servingsLabel,
    servingsLabelOne: singularize(servingsLabel),
    scaleOptions: r.scaleOptions || defaultScaleOptions(r.servings, servingsLabel),
    scaleNote: r.scaleNote || null,
    prepMinutes: prep,
    cookMinutes: cook,
    totalMinutes: total,
    quick: total <= QUICK_MINUTES,
    cuisine: r.cuisine,
    mealTypes: r.mealTypes || [],
    diets: DIETS.filter((d) => claims.has(d)),
    tags: r.tags || [],
    featured: !!r.featured,
    equipment: r.equipment || [],
    image: r.image || {},
    source: src,
    ingredients: ings,
    groups: [...new Set(ings.map((x) => x.group))],
    steps,
    notes: r.notes || [],
    ovenTemps,
    labelChecks,
  };
  return { recipe, errors, warnings };
}

export function defaultScaleOptions(servings, label) {
  if (label === 'servings') {
    const set = new Set([2, 4, 6, 8, 10, servings]);
    return [...set].sort((a, b) => a - b);
  }
  const half = Math.max(1, Math.round(servings / 2));
  return [...new Set([half, servings, servings * 2, servings * 3])].filter((n) => n <= 100).sort((a, b) => a - b);
}

/** Load and validate everything. */
export function loadAll({ illustrations = true, only = null } = {}) {
  const { vocab, errors: vocabErrors } = loadVocab();
  const results = [];
  const errors = vocabErrors.map((e) => `data: ${e}`);
  const warnings = [];
  const seen = { title: new Map(), description: new Map() };
  for (const file of recipeFiles()) {
    if (only && !only.includes(file.replace(/\.json$/, ''))) continue;
    let raw;
    try {
      raw = loadRecipeFile(file);
    } catch (e) {
      errors.push(`${file}: invalid JSON (${e.message})`);
      continue;
    }
    const res = validateRecipe(raw, vocab, { file, illustrations });
    for (const e of res.errors) errors.push(`${file}: ${e}`);
    for (const w of res.warnings) warnings.push(`${file}: ${w}`);
    if (res.recipe) {
      for (const f of ['title', 'description']) {
        const val = res.recipe[f];
        if (seen[f].has(val)) errors.push(`${file}: same ${f} as ${seen[f].get(val)}`);
        seen[f].set(val, file);
      }
      results.push(res.recipe);
    }
  }
  return { vocab, recipes: results, errors, warnings };
}
