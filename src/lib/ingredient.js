// Rendering one recipe ingredient at a given scale and unit system.
// The same code runs at build time (pre-rendered HTML) and in the browser
// (after the reader changes servings or units), so the two always match.

import { formatMeasure, formatCount, countValue, pluralize, scaleRange } from './format.js';
import { formatFraction } from './quantity.js';
import { toBase, unitLabel, dimensionOf } from './units.js';
import { renderStep } from './tokens.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function sizeText(size, system) {
  if (!size) return '';
  const dim = dimensionOf(size.unit);
  const base = { min: toBase(size.amount.min, size.unit), max: toBase(size.amount.max, size.unit) };
  return formatMeasure(base, dim, system, size.unit, null).text;
}

/**
 * ing: normalised ingredient (see recipe-model.js):
 *   { amount: {min,max}|null, unit, item, plural, prep, note, scale, gramsPerCup, size, optional }
 * Returns display parts; nothing here is HTML-escaped yet.
 */
export function ingredientParts(ing, factor = 1, system = 'us') {
  const rule = ing.scale || 'linear';
  const text = (t) => (t ? renderStep(t, { factor: rule === 'fixed' ? 1 : factor, system, mode: 'text' }) : '');
  const parts = { amount: '', alt: '', name: ing.item, prep: text(ing.prep), note: text(ing.note), toTaste: false, optional: !!ing.optional, fixed: false, rounded: '' };
  if (!ing.amount) {
    parts.toTaste = rule === 'taste';
    return parts;
  }
  const amt = scaleRange(ing.amount, factor, rule);
  parts.fixed = rule === 'fixed' && Math.abs(factor - 1) > 1e-9;
  const dim = dimensionOf(ing.unit);
  const size = sizeText(ing.size, system);
  if (dim === 'count') {
    const whole = rule === 'whole';
    const n = countValue(amt, whole);
    let text = formatCount(amt, whole);
    if (whole && Math.abs(amt.max - n) > 0.01) parts.rounded = formatFraction(Math.round(amt.max * 4) / 4) || String(amt.max);
    if (size) text += ` (${size})`;
    if (ing.unit) text += ` ${unitLabel(ing.unit, n)}`;
    else if (n > 1) parts.name = ing.plural || pluralize(ing.item);
    parts.amount = text;
  } else {
    const base = { min: toBase(amt.min, ing.unit), max: toBase(amt.max, ing.unit) };
    const m = formatMeasure(base, dim, system, ing.unit, ing.gramsPerCup);
    parts.amount = m.text + (size ? ` (${size})` : '');
    parts.alt = m.alt;
  }
  return parts;
}

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** Plain one-line text, e.g. "2 cups (250 g) all-purpose flour, sifted (or bread flour)". */
export function ingredientText(p) {
  let s = p.amount ? `${p.amount}${p.alt ? ` (${p.alt})` : ''} ${p.name}` : cap(p.name);
  if (p.prep) s += `, ${p.prep}`;
  if (p.toTaste) s += ', to taste';
  if (p.note) s += ` (${p.note})`;
  if (p.optional) s += ' (optional)';
  return s;
}

/** HTML for the ingredient line (inside the checklist label). */
export function ingredientHTML(p) {
  let h = '';
  if (p.amount) {
    h += `<strong class="amt">${esc(p.amount)}</strong>`;
    if (p.alt) h += ` <span class="alt">(${esc(p.alt)})</span>`;
    h += ` ${esc(p.name)}`;
  } else {
    h += esc(cap(p.name));
  }
  if (p.prep) h += `<span class="prep">, ${esc(p.prep)}</span>`;
  if (p.toTaste) h += '<span class="prep">, to taste</span>';
  if (p.optional) h += ' <span class="opt">(optional)</span>';
  if (p.note) h += ` <span class="note">${esc(p.note)}</span>`;
  if (p.fixed) h += ' <span class="flag" title="This amount does not change with servings">not scaled</span>';
  if (p.rounded) h += ` <span class="flag" title="Rounded to a whole number">rounded from ${esc(p.rounded)}</span>`;
  return h;
}
