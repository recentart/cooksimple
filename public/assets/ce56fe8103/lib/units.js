// Unit definitions and conversions. Volume is converted through millilitres,
// weight through grams. Count units (clove, can...) never convert.
// US customary factors are the exact legal definitions.

export const ML_PER = {
  tsp: 4.92892159375,
  tbsp: 14.78676478125,
  floz: 29.5735295625,
  cup: 236.5882365,
  pint: 473.176473,
  quart: 946.352946,
  gallon: 3785.411784,
  ml: 1,
  l: 1000,
};

export const G_PER = {
  oz: 28.349523125,
  lb: 453.59237,
  g: 1,
  kg: 1000,
};

export const CM_PER_INCH = 2.54;

// Display labels: [singular, plural]. Abbreviations never pluralise.
const LABELS = {
  tsp: ['tsp', 'tsp'], tbsp: ['tbsp', 'tbsp'], floz: ['fl oz', 'fl oz'], cup: ['cup', 'cups'],
  pint: ['pint', 'pints'], quart: ['quart', 'quarts'], gallon: ['gallon', 'gallons'],
  ml: ['mL', 'mL'], l: ['L', 'L'], oz: ['oz', 'oz'], lb: ['lb', 'lb'], g: ['g', 'g'], kg: ['kg', 'kg'],
  clove: ['clove', 'cloves'], can: ['can', 'cans'], jar: ['jar', 'jars'], package: ['package', 'packages'],
  pinch: ['pinch', 'pinches'], dash: ['dash', 'dashes'], slice: ['slice', 'slices'], sprig: ['sprig', 'sprigs'],
  bunch: ['bunch', 'bunches'], stalk: ['stalk', 'stalks'], head: ['head', 'heads'], piece: ['piece', 'pieces'],
  handful: ['handful', 'handfuls'], block: ['block', 'blocks'], fillet: ['fillet', 'fillets'],
  sheet: ['sheet', 'sheets'], ear: ['ear', 'ears'], stick: ['stick', 'sticks'],
};

const ALIASES = {
  tsp: ['tsp', 'tsps', 'teaspoon', 'teaspoons'],
  tbsp: ['tbsp', 'tbsps', 'tablespoon', 'tablespoons', 'tbs'],
  floz: ['floz', 'fl oz', 'fl. oz', 'fluid ounce', 'fluid ounces'],
  cup: ['cup', 'cups', 'c'],
  pint: ['pint', 'pints', 'pt'],
  quart: ['quart', 'quarts', 'qt'],
  gallon: ['gallon', 'gallons', 'gal'],
  ml: ['ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres'],
  l: ['l', 'liter', 'liters', 'litre', 'litres'],
  oz: ['oz', 'ounce', 'ounces'],
  lb: ['lb', 'lbs', 'pound', 'pounds'],
  g: ['g', 'gram', 'grams'],
  kg: ['kg', 'kilogram', 'kilograms'],
};

const ALIAS_MAP = new Map();
for (const [id, names] of Object.entries(ALIASES)) for (const n of names) ALIAS_MAP.set(n, id);
for (const [id, [one, many]] of Object.entries(LABELS)) {
  if (!ALIAS_MAP.has(id)) ALIAS_MAP.set(id, id);
  if (!ALIAS_MAP.has(one.toLowerCase())) ALIAS_MAP.set(one.toLowerCase(), id);
  if (!ALIAS_MAP.has(many.toLowerCase())) ALIAS_MAP.set(many.toLowerCase(), id);
}

/** Canonical unit id for a unit name or alias, or null. */
export function unitId(name) {
  if (name == null) return null;
  const key = String(name).trim().toLowerCase().replace(/\.$/, '').replace(/\s+/g, ' ');
  return ALIAS_MAP.get(key) || null;
}

export function isKnownUnit(id) {
  return Object.prototype.hasOwnProperty.call(LABELS, id);
}

/** 'volume' | 'weight' | 'count' */
export function dimensionOf(unit) {
  if (unit == null) return 'count';
  if (ML_PER[unit]) return 'volume';
  if (G_PER[unit]) return 'weight';
  return 'count';
}

export function isMetricUnit(unit) {
  return unit === 'ml' || unit === 'l' || unit === 'g' || unit === 'kg';
}

/** Convert an amount in `unit` to the dimension's base (mL or g). */
export function toBase(value, unit) {
  if (ML_PER[unit]) return value * ML_PER[unit];
  if (G_PER[unit]) return value * G_PER[unit];
  return value;
}

export function unitLabel(unit, value) {
  const pair = LABELS[unit];
  if (!pair) return unit;
  return value > 1 + 1e-9 ? pair[1] : pair[0];
}

export function fToC(f) {
  return ((f - 32) * 5) / 9;
}

export function cToF(c) {
  return (c * 9) / 5 + 32;
}
