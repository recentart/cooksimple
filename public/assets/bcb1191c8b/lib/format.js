// Turning scaled amounts into readable kitchen measurements.
//
// US customary output uses the measures people actually own: teaspoons in
// eighths, tablespoons in halves and cups in quarters and thirds. When a
// scaled amount does not land on one of those, it is written as a
// combination ("¼ cup + 2 tbsp") rather than an odd fraction ("⅜ cup").
//
// Metric output uses mL / L and g / kg. Spoon-sized volumes (under ¼ cup)
// stay as tsp / tbsp with mL alongside, because metric kitchens use spoons.
// Volume is only turned into weight when the ingredient has a stated
// grams-per-cup density; there is no universal volume-to-weight conversion.

import { roundToFractions, floorToFractions, formatFraction, formatDecimal, COUNT_FRACTIONS } from './quantity.js';
import { ML_PER, G_PER, dimensionOf, toBase, unitLabel } from './units.js';

const TSP = ML_PER.tsp;
const TSP_FRACS = [0, 1 / 8, 1 / 4, 1 / 2, 3 / 4];
const TBSP_FRACS = [0, 1 / 2];
const CUP_FRACS = [0, 1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4];
const OZ_FRACS = [0, 1 / 4, 1 / 2, 3 / 4];
const SMALL_OZ_FRACS = [0, 1 / 8, 1 / 4, 1 / 2, 3 / 4];
const LB_FRACS = [0, 1 / 4, 1 / 2, 3 / 4];
const EPS = 1e-9;

// Below this many mL, metric mode keeps spoon measures (¼ cup is 59.15 mL).
export const SPOON_LIMIT_ML = ML_PER.cup / 4 - 0.01;

function relErr(approx, exact) {
  return Math.abs(approx - exact) / exact;
}

/**
 * US volume as a list of parts, e.g. [{n: 0.25, unit: 'cup'}, {n: 2, unit: 'tbsp'}].
 * `prefer` is the unit the recipe was written in; tablespoons stay tablespoons
 * (up to 8) when they come out clean, so "2 tbsp butter" doubles to "4 tbsp".
 */
export function usVolumeParts(ml, prefer) {
  const tsp = ml / TSP;
  if (tsp < 1 / 16) return [{ n: 1, unit: 'pinch' }];
  if (tsp < 3 - EPS) {
    const n = roundToFractions(tsp, TSP_FRACS);
    if (n >= 3 - EPS) return [{ n: 1, unit: 'tbsp' }];
    return [{ n: n < EPS ? 1 / 8 : n, unit: 'tsp' }];
  }
  const tbsp = tsp / 3;
  const tb = roundToFractions(tbsp, TBSP_FRACS);
  const tbClean = relErr(tb * 3, tsp) <= 0.04;
  if (tsp < 12 - EPS) {
    if (tbClean) return [{ n: tb, unit: 'tbsp' }];
    const whole = Math.floor(tbsp + EPS);
    const rem = roundToFractions(tsp - whole * 3, [0, 1 / 4, 1 / 2, 3 / 4]);
    if (rem >= 3 - EPS) return [{ n: whole + 1, unit: 'tbsp' }];
    if (rem < EPS) return [{ n: whole, unit: 'tbsp' }];
    return [{ n: whole, unit: 'tbsp' }, { n: rem, unit: 'tsp' }];
  }
  if (prefer === 'tbsp' && tbClean && tb <= 8) return [{ n: tb, unit: 'tbsp' }];
  const cups = tsp / 48;
  const c = roundToFractions(cups, CUP_FRACS);
  if (relErr(c * 48, tsp) <= 0.03) return [{ n: c, unit: 'cup' }];
  if (prefer !== 'cup' && tbClean && tb <= 8) return [{ n: tb, unit: 'tbsp' }];
  // Split on quarter cups: a quarter cup is exactly 4 tbsp, a third is not.
  const base = floorToFractions(cups, [0, 1 / 4, 1 / 2, 3 / 4]);
  const remTb = roundToFractions((cups - base) * 16, TBSP_FRACS);
  if (remTb < EPS) return [{ n: base, unit: 'cup' }];
  return [{ n: base, unit: 'cup' }, { n: remTb, unit: 'tbsp' }];
}

/**
 * US weight as parts: ounces under a pound, then pounds (or "1 lb 5 oz").
 * Amounts written in ounces stay in ounces up to 2 lb (can sizes: "28 oz").
 */
export function usWeightParts(g, prefer) {
  const oz = g / G_PER.oz;
  if (oz < 16 - EPS || (prefer === 'oz' && oz < 32 - EPS)) {
    const n = roundToFractions(oz, oz < 1 ? SMALL_OZ_FRACS : OZ_FRACS);
    if (n >= 16 - EPS && prefer !== 'oz') return [{ n: 1, unit: 'lb' }];
    return [{ n: n < EPS ? 1 / 8 : n, unit: 'oz' }];
  }
  const lb = oz / 16;
  const l = roundToFractions(lb, LB_FRACS);
  if (relErr(l * 16, oz) <= 0.03) return [{ n: l, unit: 'lb' }];
  const whole = Math.floor(lb + EPS);
  const remOz = Math.round(oz - whole * 16);
  if (remOz >= 16) return [{ n: whole + 1, unit: 'lb' }];
  if (remOz <= 0) return [{ n: whole, unit: 'lb' }];
  return [{ n: whole, unit: 'lb' }, { n: remOz, unit: 'oz' }];
}

export function metricVolumeText(ml) {
  if (ml >= 1000 - EPS) return `${formatDecimal(ml / 1000, 0.01)} L`;
  if (ml < 10) return `${formatDecimal(ml, 0.5)} mL`;
  return `${formatDecimal(ml, 1)} mL`;
}

export function metricWeightText(g) {
  if (g >= 1000 - EPS) return `${formatDecimal(g / 1000, 0.01)} kg`;
  if (g < 10) return `${formatDecimal(g, 0.5)} g`;
  return `${formatDecimal(g, 1)} g`;
}

export function partsText(parts) {
  return parts
    .map((p) => (p.unit === 'pinch' ? 'a pinch' : `${formatFraction(p.n)} ${unitLabel(p.unit, p.n)}`))
    .join(' + ');
}

/** Fractions allowed when a single unit must be used (ranges). */
const RANGE_FRACS = { tsp: TSP_FRACS, tbsp: TBSP_FRACS, cup: CUP_FRACS, oz: OZ_FRACS, lb: LB_FRACS };

function inUnit(base, unit) {
  return base / (ML_PER[unit] || G_PER[unit]);
}

/**
 * Format a measured (volume or weight) amount given in base units.
 * Returns { text, alt } where alt is an optional secondary measure.
 *   base: { min, max } in mL or g
 *   dim: 'volume' | 'weight'
 *   system: 'us' | 'metric'
 *   prefer: authored unit id (only a hint)
 *   gramsPerCup: optional density for volume ingredients
 */
export function formatMeasure(base, dim, system, prefer, gramsPerCup) {
  const isRange = base.max - base.min > EPS;
  if (dim === 'volume' && gramsPerCup) {
    const grams = { min: (base.min / ML_PER.cup) * gramsPerCup, max: (base.max / ML_PER.cup) * gramsPerCup };
    if (system === 'metric') {
      return { text: rangeOrSingle(grams, (v) => metricWeightText(v), isRange), alt: '' };
    }
    const vol = formatMeasure(base, 'volume', 'us', prefer, null);
    return { text: vol.text, alt: rangeOrSingle(grams, (v) => metricWeightText(v), isRange) };
  }
  if (system === 'metric') {
    if (dim === 'volume') {
      if (base.max < SPOON_LIMIT_ML) {
        const spoons = formatMeasure(base, 'volume', 'us', prefer, null).text;
        return { text: spoons, alt: rangeOrSingle(base, metricVolumeText, isRange) };
      }
      return { text: rangeOrSingle(base, metricVolumeText, isRange), alt: '' };
    }
    return { text: rangeOrSingle(base, metricWeightText, isRange), alt: '' };
  }
  const partsFor = (v) => (dim === 'volume' ? usVolumeParts(v, prefer) : usWeightParts(v, prefer));
  if (!isRange) return { text: partsText(partsFor(base.min)), alt: '' };
  // Ranges use one unit for both ends, chosen from the larger end.
  const unit = partsFor(base.max)[0].unit;
  if (unit === 'pinch') return { text: 'a pinch', alt: '' };
  const fracs = RANGE_FRACS[unit] || [0, 1 / 2];
  let lo = roundToFractions(inUnit(base.min, unit), fracs);
  const hi = roundToFractions(inUnit(base.max, unit), fracs);
  if (lo < EPS) lo = fracs[1] || 1;
  if (Math.abs(hi - lo) < EPS) return { text: `${formatFraction(hi)} ${unitLabel(unit, hi)}`, alt: '' };
  return { text: `${formatFraction(lo)}–${formatFraction(hi)} ${unitLabel(unit, hi)}`, alt: '' };
}

function rangeOrSingle(r, fmt, isRange) {
  if (!isRange) return fmt(r.min);
  const lo = fmt(r.min);
  const hi = fmt(r.max);
  if (lo === hi) return hi;
  const [loNum, loUnit] = splitUnit(lo);
  const [hiNum, hiUnit] = splitUnit(hi);
  if (loUnit === hiUnit) return `${loNum}–${hiNum} ${hiUnit}`;
  return `${lo}–${hi}`;
}

function splitUnit(text) {
  const i = text.lastIndexOf(' ');
  return [text.slice(0, i), text.slice(i + 1)];
}

/** Format a count (onions, eggs). `whole` forces whole numbers (minimum 1). */
export function formatCount(r, whole) {
  const fmt = (v) => {
    if (whole) return String(Math.max(1, Math.round(v)));
    const n = roundToFractions(v, COUNT_FRACTIONS);
    return formatFraction(n < EPS ? 1 / 4 : n);
  };
  const lo = fmt(r.min);
  const hi = fmt(r.max);
  return lo === hi ? hi : `${lo}–${hi}`;
}

export function countValue(r, whole) {
  const v = r.max;
  if (whole) return Math.max(1, Math.round(v));
  return roundToFractions(v, COUNT_FRACTIONS);
}

// ---------- Plurals ----------

const IRREGULAR = { leaf: 'leaves', half: 'halves', loaf: 'loaves', knife: 'knives', potato: 'potatoes', tomato: 'tomatoes', mango: 'mangoes' };

export function pluralize(phrase) {
  const m = phrase.match(/^(.*?)([A-Za-z]+)$/);
  if (!m) return phrase;
  const [, head, word] = m;
  const lower = word.toLowerCase();
  let plural;
  if (IRREGULAR[lower]) plural = IRREGULAR[lower];
  else if (/[^aeiou]y$/.test(lower)) plural = word.slice(0, -1) + 'ies';
  else if (/(s|x|z|ch|sh)$/.test(lower)) plural = word + 'es';
  else plural = word + 's';
  if (IRREGULAR[lower] && word[0] === word[0].toUpperCase()) plural = plural[0].toUpperCase() + plural.slice(1);
  return head + plural;
}

// ---------- Scaling ----------

/** Scale an amount range by a factor according to the ingredient's scaling rule. */
export function scaleRange(r, factor, rule) {
  if (!r) return null;
  if (rule === 'fixed') return { min: r.min, max: r.max };
  return { min: r.min * factor, max: r.max * factor };
}

/** Format a free-standing quantity ({qty} tokens and shopping list rows). */
export function formatQuantity(amount, unit, system, gramsPerCup) {
  const dim = dimensionOf(unit);
  if (dim === 'count') {
    const text = formatCount(amount, false);
    return { text: unit ? `${text} ${unitLabel(unit, amount.max)}` : text, alt: '' };
  }
  const base = { min: toBase(amount.min, unit), max: toBase(amount.max, unit) };
  return formatMeasure(base, dim, system, unit, gramsPerCup);
}
