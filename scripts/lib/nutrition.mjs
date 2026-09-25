// Nutrition estimates and ingredient-derived labels (build time).
//
// Nutrition: each vocabulary entry may carry
//   n:    [kcal, protein g, carbohydrate g, fat g] per 100 g (USDA FoodData Central values, rounded)
//   gCup: grams in one US cup (for turning volumes into weight; falls back to gramsPerCup)
//   ug:   grams per counted unit, e.g. { "": 150 } for one onion, { "clove": 5 } for garlic
// A recipe only gets an estimate when EVERY ingredient that counts has data;
// otherwise nothing is shown. Optional ingredients, "to taste" seasoning and
// fixed-scale items (pasta water, oil to coat a pan) are left out, and the page says so.

import { toBase, dimensionOf, ML_PER } from '../../src/lib/units.js';

export const LABEL_RULES = {
  'dairy-free': { flag: 'dairy', name: 'Dairy-free' },
  'egg-free': { flag: 'egg', name: 'Egg-free' },
  'gluten-free': { flag: 'gluten', name: 'Gluten-free' },
  'nut-free': { flag: 'nut', name: 'Nut-free' },
};

/** Grams of one ingredient at 1× (null when the vocabulary can't say). */
export function ingredientGrams(ing, v) {
  if (!ing.amount) return 0;
  const amount = (ing.amount.min + ing.amount.max) / 2;
  const dim = dimensionOf(ing.unit);
  if (dim === 'weight') return toBase(amount, ing.unit);
  if (dim === 'volume') {
    const perCup = v.gCup ?? v.gramsPerCup;
    if (!perCup) return null;
    return (toBase(amount, ing.unit) / ML_PER.cup) * perCup;
  }
  if (ing.size) {
    const s = (ing.size.amount.min + ing.size.amount.max) / 2;
    return amount * toBase(s, ing.size.unit); // mL of canned liquid ≈ grams
  }
  const per = v.ug ? v.ug[ing.unit || ''] : undefined;
  return per == null ? null : amount * per;
}

/**
 * Estimated nutrition per serving (or per piece), or { missing: [...] }.
 */
export function estimateNutrition(recipe, vocab) {
  const total = [0, 0, 0, 0];
  const missing = [];
  for (const ing of recipe.ingredients) {
    if (ing.optional || ing.scale === 'taste' || ing.scale === 'fixed') continue;
    const v = vocab[ing.key] || {};
    if (!v.n) {
      missing.push(ing.key);
      continue;
    }
    const g = ingredientGrams(ing, v);
    if (g == null) {
      missing.push(ing.key);
      continue;
    }
    for (let i = 0; i < 4; i++) total[i] += (v.n[i] * g) / 100;
  }
  if (missing.length) return { missing: [...new Set(missing)] };
  const per = total.map((x) => x / recipe.servings);
  return {
    kcal: Math.round(per[0] / 5) * 5,
    protein: Math.round(per[1]),
    carbs: Math.round(per[2]),
    fat: Math.round(per[3]),
  };
}

/** Labels such as "gluten-free" that follow from the ingredient flags. */
export function deriveLabels(recipe, vocab) {
  const out = [];
  for (const [label, rule] of Object.entries(LABEL_RULES)) {
    const blocked = recipe.ingredients.some((ing) => {
      const v = vocab[ing.key] || {};
      return (v.contains || []).includes(rule.flag) || Object.prototype.hasOwnProperty.call(v.varies || {}, rule.flag);
    });
    if (!blocked) out.push(label);
  }
  return out;
}
