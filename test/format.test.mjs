import { test } from 'node:test';
import assert from 'node:assert/strict';
import { usVolumeParts, usWeightParts, partsText, formatMeasure, formatQuantity, formatCount, pluralize, metricVolumeText, metricWeightText } from '../src/lib/format.js';
import { ML_PER, G_PER, toBase, fToC, cToF, unitId, dimensionOf } from '../src/lib/units.js';
import { ingredientParts, ingredientText } from '../src/lib/ingredient.js';

const us = (amount, unit) => partsText(usVolumeParts(amount * ML_PER[unit], unit));
const q = (min, max = min) => ({ min, max });

test('exact conversion factors', () => {
  assert.equal(ML_PER.cup, 236.5882365);
  assert.equal(ML_PER.tbsp * 3, ML_PER.tsp * 9);
  assert.ok(Math.abs(ML_PER.cup - 16 * ML_PER.tbsp) < 1e-9);
  assert.ok(Math.abs(ML_PER.cup - 8 * ML_PER.floz) < 1e-9);
  assert.equal(G_PER.lb, 453.59237);
  assert.ok(Math.abs(G_PER.lb - 16 * G_PER.oz) < 1e-9);
});

test('temperature conversion', () => {
  assert.equal(fToC(212), 100);
  assert.equal(fToC(32), 0);
  assert.equal(cToF(100), 212);
  assert.ok(Math.abs(fToC(350) - 176.6667) < 1e-3);
});

test('unit aliases and dimensions', () => {
  assert.equal(unitId('Tablespoons'), 'tbsp');
  assert.equal(unitId('fl oz'), 'floz');
  assert.equal(unitId('lbs'), 'lb');
  assert.equal(unitId('cloves'), 'clove');
  assert.equal(unitId('parsec'), null);
  assert.equal(dimensionOf('oz'), 'weight');
  assert.equal(dimensionOf('floz'), 'volume');
  assert.equal(dimensionOf('clove'), 'count');
  assert.equal(dimensionOf(null), 'count');
});

test('US volume: authored amounts read back unchanged', () => {
  assert.equal(us(1, 'cup'), '1 cup');
  assert.equal(us(2, 'cup'), '2 cups');
  assert.equal(us(0.25, 'cup'), '¼ cup');
  assert.equal(us(1 / 3, 'cup'), '⅓ cup');
  assert.equal(us(2 / 3, 'cup'), '⅔ cup');
  assert.equal(us(1.5, 'cup'), '1½ cups');
  assert.equal(us(0.5, 'tsp'), '½ tsp');
  assert.equal(us(1.5, 'tsp'), '1½ tsp');
  assert.equal(us(0.125, 'tsp'), '⅛ tsp');
  assert.equal(us(2, 'tbsp'), '2 tbsp');
  assert.equal(us(4, 'tbsp'), '4 tbsp');
  assert.equal(us(2.5, 'tbsp'), '2½ tbsp');
});

test('US volume: scaled amounts become sensible measures', () => {
  assert.equal(us(3, 'tsp'), '1 tbsp'); // 1 tsp × 3
  assert.equal(us(4, 'tsp'), '1 tbsp + 1 tsp');
  assert.equal(us(0.125, 'cup'), '2 tbsp'); // ¼ cup × ½
  assert.equal(us(6, 'tbsp'), '6 tbsp'); // 2 tbsp × 3
  assert.equal(us(0.375, 'cup'), '¼ cup + 2 tbsp'); // ¼ cup × 1.5 (authored in cups)
  assert.equal(us(12, 'tbsp'), '¾ cup'); // 3 tbsp × 4
  assert.equal(us(10, 'tbsp'), '½ cup + 2 tbsp');
  assert.equal(us(4, 'cup'), '4 cups');
  assert.equal(us(1.125, 'cup'), '1 cup + 2 tbsp');
  assert.equal(us(0.75, 'tsp'), '¾ tsp');
  assert.equal(us(1 / 32, 'tsp'), 'a pinch');
  assert.equal(us(1.5, 'floz'), '3 tbsp');
  assert.equal(us(1, 'pint'), '2 cups');
});

test('US weight', () => {
  const w = (amount, unit) => partsText(usWeightParts(amount * G_PER[unit]));
  assert.equal(w(8, 'oz'), '8 oz');
  assert.equal(w(16, 'oz'), '1 lb');
  assert.equal(w(1.5, 'lb'), '1½ lb');
  assert.equal(w(2, 'lb'), '2 lb');
  assert.equal(w(14.5, 'oz'), '14½ oz');
  assert.equal(w(1.3125, 'lb'), '1 lb + 5 oz');
  assert.equal(w(225, 'g'), '8 oz');
  assert.equal(w(1000, 'g'), '2¼ lb');
});

test('metric text rounding', () => {
  assert.equal(metricVolumeText(ML_PER.cup), '237 mL');
  assert.equal(metricVolumeText(4 * ML_PER.cup), '946 mL');
  assert.equal(metricVolumeText(6 * ML_PER.cup), '1.42 L');
  assert.equal(metricVolumeText(ML_PER.tsp / 2), '2.5 mL');
  assert.equal(metricWeightText(G_PER.lb), '454 g');
  assert.equal(metricWeightText(15 * G_PER.oz), '425 g');
  assert.equal(metricWeightText(3 * G_PER.lb), '1.36 kg');
  assert.equal(metricWeightText(4.2), '4 g');
});

test('metric: spoons stay spoons with mL alongside; cups become mL', () => {
  const m = (amount, unit, g) => formatMeasure(q(toBase(amount, unit)), dimensionOf(unit), 'metric', unit, g);
  assert.deepEqual(m(1, 'tbsp'), { text: '1 tbsp', alt: '15 mL' });
  assert.deepEqual(m(0.5, 'tsp'), { text: '½ tsp', alt: '2.5 mL' });
  assert.deepEqual(m(1, 'cup'), { text: '237 mL', alt: '' });
  assert.deepEqual(m(0.25, 'cup'), { text: '59 mL', alt: '' });
  assert.deepEqual(m(8, 'oz'), { text: '227 g', alt: '' });
});

test('density: volume becomes weight only when grams per cup is known', () => {
  const flour = (amount, system) => formatMeasure(q(toBase(amount, 'cup')), 'volume', system, 'cup', 125);
  assert.deepEqual(flour(2, 'metric'), { text: '250 g', alt: '' });
  assert.deepEqual(flour(2, 'us'), { text: '2 cups', alt: '250 g' });
  assert.deepEqual(flour(1.5, 'metric'), { text: '188 g', alt: '' });
  // no density: stays volume
  assert.deepEqual(formatMeasure(q(toBase(2, 'cup')), 'volume', 'metric', 'cup', null), { text: '473 mL', alt: '' });
});

test('ranges keep one unit', () => {
  assert.equal(formatQuantity(q(2, 3), 'tbsp', 'us').text, '2–3 tbsp');
  assert.equal(formatQuantity(q(0.5, 1), 'cup', 'us').text, '½–1 cup');
  assert.equal(formatQuantity(q(2, 3), 'tbsp', 'metric').alt, '30–44 mL');
  assert.equal(formatQuantity(q(1, 2), 'lb', 'metric').text, '454–907 g');
});

test('counts and plurals', () => {
  assert.equal(formatCount(q(1.5), false), '1½');
  assert.equal(formatCount(q(0.5), false), '½');
  assert.equal(formatCount(q(2 / 3), false), '⅔');
  assert.equal(formatCount(q(1.5), true), '2');
  assert.equal(formatCount(q(0.4), true), '1');
  assert.equal(formatCount(q(6, 8), false), '6–8');
  assert.equal(pluralize('yellow onion'), 'yellow onions');
  assert.equal(pluralize('tomato'), 'tomatoes');
  assert.equal(pluralize('bay leaf'), 'bay leaves');
  assert.equal(pluralize('cherry'), 'cherries');
  assert.equal(pluralize('radish'), 'radishes');
  assert.equal(pluralize('large egg'), 'large eggs');
});

const ing = (o) => ({ amount: null, unit: null, item: 'x', scale: 'linear', gramsPerCup: null, size: null, ...o });
const line = (o, factor = 1, system = 'us') => ingredientText(ingredientParts(ing(o), factor, system));

test('ingredient lines: scaling doubles, halves, and handles counts', () => {
  const flour = { amount: q(2), unit: 'cup', item: 'all-purpose flour', gramsPerCup: 125 };
  assert.equal(line(flour), '2 cups (250 g) all-purpose flour');
  assert.equal(line(flour, 2), '4 cups (500 g) all-purpose flour');
  assert.equal(line(flour, 0.5), '1 cup (125 g) all-purpose flour');
  assert.equal(line(flour, 2, 'metric'), '500 g all-purpose flour');
  const onion = { amount: q(1), item: 'yellow onion', prep: 'diced' };
  assert.equal(line(onion), '1 yellow onion, diced');
  assert.equal(line(onion, 2), '2 yellow onions, diced');
  assert.equal(line(onion, 0.5), '½ yellow onion, diced');
  assert.equal(line(onion, 1.5), '1½ yellow onions, diced');
  const garlic = { amount: q(1), unit: 'clove', item: 'garlic' };
  assert.equal(line(garlic), '1 clove garlic');
  assert.equal(line(garlic, 3), '3 cloves garlic');
});

test('ingredient lines: eggs stay whole and say what they were rounded from', () => {
  const eggs = { amount: q(3), item: 'large egg', scale: 'whole' };
  assert.equal(line(eggs), '3 large eggs');
  const half = ingredientParts(ing(eggs), 0.5, 'us');
  assert.equal(half.amount, '2');
  assert.equal(half.rounded, '1½');
  assert.equal(ingredientParts(ing({ amount: q(1), item: 'large egg', scale: 'whole' }), 0.25).amount, '1');
});

test('ingredient lines: fixed, taste, optional, size', () => {
  const water = { amount: q(4), unit: 'quart', item: 'water', scale: 'fixed', scaleNote: 'big pot' };
  assert.equal(line(water, 3), '16 cups water');
  const wp = ingredientParts(ing(water), 3);
  assert.equal(wp.fixed, true);
  assert.equal(ingredientParts(ing(water), 3).amount, ingredientParts(ing(water), 1).amount);
  assert.equal(line({ item: 'kosher salt', scale: 'taste' }), 'Kosher salt, to taste');
  assert.equal(line({ amount: q(2), unit: 'tbsp', item: 'parsley', optional: true }), '2 tbsp parsley (optional)');
  const beans = { amount: q(1), unit: 'can', item: 'black beans', size: { amount: q(15), unit: 'oz' }, prep: 'drained' };
  assert.equal(line(beans), '1 (15 oz) can black beans, drained');
  assert.equal(line(beans, 2), '2 (15 oz) cans black beans, drained');
  assert.equal(line(beans, 1, 'metric'), '1 (425 g) can black beans, drained');
});

test('ingredient notes scale through tokens', () => {
  const thyme = { amount: q(4), unit: 'sprig', item: 'fresh thyme', note: 'or {qty 1/2 tsp} dried' };
  assert.equal(line(thyme), '4 sprigs fresh thyme (or ½ tsp dried)');
  assert.equal(line(thyme, 2), '8 sprigs fresh thyme (or 1 tsp dried)');
});
