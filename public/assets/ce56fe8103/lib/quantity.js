// Parsing and formatting of numeric amounts: whole numbers, decimals,
// fractions ("1/2"), mixed numbers ("1 1/2"), unicode fractions ("1½")
// and ranges ("2-3", "2 to 3", [2, 3]).
// Shared by the build (Node) and the browser; no DOM access here.

const GLYPH_VALUES = {
  '½': '1/2', '⅓': '1/3', '⅔': '2/3', '¼': '1/4', '¾': '3/4', '⅕': '1/5', '⅖': '2/5',
  '⅗': '3/5', '⅘': '4/5', '⅙': '1/6', '⅚': '5/6', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8',
};

// Fraction glyphs used for display, keyed by value.
const GLYPHS = [
  [1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [3 / 8, '⅜'], [1 / 2, '½'],
  [5 / 8, '⅝'], [2 / 3, '⅔'], [3 / 4, '¾'], [7 / 8, '⅞'],
];

const EPS = 1e-9;

/** Parse one number. Returns NaN when the text is not a plain positive number. */
export function parseNumber(input) {
  if (typeof input === 'number') return Number.isFinite(input) ? input : NaN;
  if (typeof input !== 'string') return NaN;
  let s = input.trim().replace(/[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, (g) => ' ' + GLYPH_VALUES[g]).trim();
  s = s.replace(/⁄/g, '/').replace(/\s+/g, ' ');
  let m;
  if ((m = s.match(/^(\d*\.?\d+)$/))) return Number(m[1]);
  if ((m = s.match(/^(\d+)\/(\d+)$/))) return Number(m[2]) === 0 ? NaN : Number(m[1]) / Number(m[2]);
  if ((m = s.match(/^(\d+) (\d+)\/(\d+)$/))) {
    const den = Number(m[3]);
    if (den === 0 || Number(m[2]) >= den) return NaN;
    return Number(m[1]) + Number(m[2]) / den;
  }
  return NaN;
}

/**
 * Parse an amount into { min, max }. Accepts a number, a string or a
 * two-item array. Returns null when invalid (not positive, max < min...).
 */
export function parseAmount(input) {
  let min;
  let max;
  if (Array.isArray(input)) {
    if (input.length !== 2) return null;
    min = parseNumber(input[0]);
    max = parseNumber(input[1]);
  } else if (typeof input === 'number') {
    min = max = parseNumber(input);
  } else if (typeof input === 'string') {
    const parts = input.trim().split(/\s*(?:–|—|-|\bto\b)\s*/);
    if (parts.length === 1) {
      min = max = parseNumber(parts[0]);
    } else if (parts.length === 2) {
      min = parseNumber(parts[0]);
      max = parseNumber(parts[1]);
    } else {
      return null;
    }
  } else {
    return null;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  if (min <= 0 || max < min) return null;
  return { min, max };
}

/**
 * Round a value to the nearest whole number plus one of the allowed
 * fractional parts. `fracs` must include 0.
 */
export function roundToFractions(value, fracs) {
  const whole = Math.floor(value + EPS);
  const part = value - whole;
  let best = 0;
  let bestErr = Infinity;
  for (const f of [...fracs, 1]) {
    const err = Math.abs(part - f);
    if (err < bestErr - EPS) {
      best = f;
      bestErr = err;
    }
  }
  return whole + best;
}

/** Largest value of the form whole + allowed fraction that does not exceed `value`. */
export function floorToFractions(value, fracs) {
  const whole = Math.floor(value + EPS);
  const part = value - whole;
  let best = 0;
  for (const f of fracs) if (f <= part + EPS && f > best) best = f;
  return whole + best;
}

/** Format a value that is already a whole number plus a glyph fraction, e.g. 1.5 -> "1½". */
export function formatFraction(value) {
  const whole = Math.floor(value + EPS);
  const part = value - whole;
  if (part < EPS) return String(whole);
  let glyph = null;
  for (const [v, g] of GLYPHS) if (Math.abs(part - v) < 1e-6) glyph = g;
  if (!glyph) return formatDecimal(value, 0.01);
  return whole === 0 ? glyph : `${whole}${glyph}`;
}

/** Round to a step (e.g. 0.5, 1, 0.01) and print without trailing zeros. */
export function formatDecimal(value, step = 1) {
  const rounded = Math.round(value / step) * step;
  const decimals = step >= 1 ? 0 : Math.min(4, Math.ceil(-Math.log10(step) - EPS));
  let text = rounded.toFixed(decimals);
  if (text.includes('.')) text = text.replace(/0+$/, '').replace(/\.$/, '');
  return text;
}

/** Common cooking fractions for counts (onions, lemons...). */
export const COUNT_FRACTIONS = [0, 1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4];
