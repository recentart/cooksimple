import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadAll } from '../scripts/lib/recipes.mjs';
import { searchEntry } from '../src/templates/pages.js';
import { prepareIndex, searchRecipes, parseQuery } from '../src/lib/search.js';
import { buildTermIndex, resolveTerm } from '../src/lib/vocab.js';
import { discover } from '../src/lib/discover.js';
import { splitTerms, normalize } from '../src/lib/text.js';
import { recipeItems, addRecipe, removeRecipe, addCustom, mergedRows, rowText, groupedRows, sanitizeList, emptyList, listAsText } from '../src/lib/shopping.js';

const { vocab, recipes, errors } = loadAll();
recipes.forEach((r, i) => (r.order = i));
const byId = Object.fromEntries(recipes.map((r) => [r.id, r]));
const entries = recipes.map((r) => searchEntry(r, vocab));
const index = prepareIndex(entries);
const ids = (res) => res.results.map((r) => r.entry.id);

test('all recipes validate', () => {
  assert.deepEqual(errors, []);
  assert.ok(recipes.length >= 20);
});

test('text normalisation', () => {
  assert.equal(normalize('Tomatoes'), 'tomato');
  assert.equal(normalize('  Green ONIONS '), 'green onion');
  assert.equal(normalize('Jalapeños'), 'jalapeno');
  assert.deepEqual(splitTerms('chicken, rice;; onion\n garlic, , Chicken'), ['chicken', 'rice', 'onion', 'garlic']);
  assert.deepEqual(splitTerms(''), []);
  assert.equal(splitTerms('a,'.repeat(50)).length, 1);
});

test('search: name, ingredient, cuisine, meal type, time', () => {
  assert.ok(ids(searchRecipes(index, { q: 'pancakes' })).includes('classic-pancakes'));
  const chick = ids(searchRecipes(index, { q: 'chickpeas' }));
  assert.ok(chick.includes('coconut-chickpea-curry') && chick.includes('chickpea-salad-sandwiches'));
  assert.ok(ids(searchRecipes(index, { q: 'garbanzo' })).includes('coconut-chickpea-curry'), 'synonyms match');
  assert.ok(ids(searchRecipes(index, { q: 'italian' })).every((id) => byId[id].cuisine === 'Italian'));
  assert.ok(ids(searchRecipes(index, { q: 'dessert' })).every((id) => byId[id].mealTypes.includes('dessert') || /dessert/i.test(byId[id].description)));
  const q30 = searchRecipes(index, { q: 'under 30 minutes' });
  assert.equal(q30.parsed.maxTime, 30);
  assert.ok(ids(q30).length > 0 && ids(q30).every((id) => byId[id].totalMinutes <= 30));
});

test('search: filters combine and never invent diet labels', () => {
  const vegan = ids(searchRecipes(index, { diets: ['vegan'] }));
  assert.ok(vegan.length >= 5 && vegan.every((id) => byId[id].diets.includes('vegan')));
  const vegDinner = ids(searchRecipes(index, { diets: ['vegetarian'], meals: ['dinner'] }));
  assert.ok(vegDinner.every((id) => byId[id].diets.includes('vegetarian') && byId[id].mealTypes.includes('dinner')));
  assert.ok(ids(searchRecipes(index, { quick: true })).every((id) => byId[id].totalMinutes <= 30));
  assert.ok(ids(searchRecipes(index, { tags: ['one-pan'] })).every((id) => byId[id].tags.includes('one-pan')));
  assert.equal(ids(searchRecipes(index, { q: 'zzzqqq' })).length, 0);
  assert.equal(ids(searchRecipes(index, { q: '<script>alert(1)</script>' })).length, 0);
  assert.equal(searchRecipes(index, {}).results.length, recipes.length);
});

test('search: partial matches when not every word matches', () => {
  const res = searchRecipes(index, { q: 'chicken unicorn' });
  assert.equal(res.partial, true);
  assert.ok(ids(res).length > 0);
  assert.deepEqual(parseQuery('quick vegan dinner').words, ['vegan', 'dinner']);
});

test('what can I make: resolves common names and finds real recipes', () => {
  const termIndex = buildTermIndex(vocab, new Set(recipes.flatMap((r) => r.ingredients.map((i) => i.key))));
  assert.ok(resolveTerm(termIndex, 'chicken').includes('boneless chicken thighs'));
  assert.ok(resolveTerm(termIndex, 'scallions').includes('green onions'));
  assert.ok(resolveTerm(termIndex, 'onion').includes('yellow onions'));
  assert.ok(!resolveTerm(termIndex, 'rice').includes('rice vinegar'), '"rice" does not mean rice vinegar');
  assert.deepEqual(resolveTerm(termIndex, 'unobtainium'), []);
  const res = discover(entries, termIndex, ['chicken', 'rice', 'onion', 'garlic']);
  assert.ok(['chicken-fried-rice', 'one-pan-chicken-and-rice'].includes(res.results[0].entry.id));
  assert.equal(res.results[0].used.length, 4);
  assert.ok(res.results[0].missing.length > 0 && res.results[0].missing.every((m) => !m.optional));
  const withPantry = discover(entries, termIndex, ['chickpeas'], { assumePantry: true });
  const noPantry = discover(entries, termIndex, ['chickpeas'], { assumePantry: false });
  const curry = (r) => r.results.find((x) => x.entry.id === 'coconut-chickpea-curry');
  assert.ok(curry(noPantry).missing.length > curry(withPantry).missing.length, 'pantry toggle changes the missing list');
  const odd = discover(entries, termIndex, ['dragonfruit']);
  assert.deepEqual(odd.unmatched, ['dragonfruit']);
  assert.equal(odd.results.length, 0);
});

test('shopping list: merges duplicates across recipes and scales', () => {
  let list = emptyList();
  const chicken = byId['lemon-garlic-chicken-thighs'];
  const curry = byId['coconut-chickpea-curry'];
  list = addRecipe(list, { id: chicken.id, title: chicken.title, items: recipeItems(chicken.ingredients, 1) });
  list = addRecipe(list, { id: curry.id, title: curry.title, items: recipeItems(curry.ingredients, 2) });
  const rows = mergedRows(list);
  const garlic = rows.filter((r) => r.key === 'garlic');
  assert.equal(garlic.length, 1);
  assert.equal(rowText(garlic[0]), '12 cloves garlic');
  assert.ok(!rows.some((r) => r.key === 'water'));
  // Re-adding replaces instead of duplicating
  list = addRecipe(list, { id: chicken.id, title: chicken.title, items: recipeItems(chicken.ingredients, 2) });
  assert.equal(list.recipes.length, 2);
  assert.equal(rowText(mergedRows(list).find((r) => r.key === 'garlic')), '18 cloves garlic');
  // Units follow the reader's choice
  assert.equal(rowText(mergedRows(list).find((r) => r.key === 'bone-in chicken thighs'), 'metric'), '1.81 kg bone-in chicken thighs');
  // Cans keep their size
  assert.equal(rowText(mergedRows(list).find((r) => r.key === 'canned chickpeas')), '4 (15 oz) cans canned chickpeas');
  const groups = groupedRows(list).map((g) => g.aisle);
  assert.equal(groups[0], 'produce');
  assert.equal(groups.at(-1), 'staples');
  list = removeRecipe(list, curry.id);
  assert.ok(!mergedRows(list).some((r) => r.key === 'canned chickpeas'));
});

test('shopping list: skips checked ingredients, handles counts and custom items', () => {
  const pancakes = byId['classic-pancakes'];
  const items = recipeItems(pancakes.ingredients, 0.25, new Set([0]));
  assert.ok(!items.some((i) => i.key === 'all-purpose flour'));
  const eggs = items.find((i) => i.key === 'eggs');
  assert.deepEqual(eggs.base, { min: 1, max: 1 }, 'half an egg rounds to 1');
  let list = addRecipe(emptyList(), { id: 'p', title: 'P', items });
  assert.equal(rowText(mergedRows(list).find((r) => r.key === 'eggs')), '1 egg');
  list = addCustom(list, '  paper   towels ', 'c1');
  list = addCustom(list, 'Paper towels', 'c2');
  list = addCustom(list, '   ', 'c3');
  assert.deepEqual(list.custom.map((c) => c.text), ['paper towels']);
  assert.ok(listAsText(list).includes('[ ] paper towels'));
});

test('shopping list: bad stored data is ignored safely', () => {
  assert.deepEqual(sanitizeList(null), emptyList());
  assert.deepEqual(sanitizeList('junk'), emptyList());
  assert.deepEqual(sanitizeList({ v: 2, recipes: [1] }), emptyList());
  const clean = sanitizeList({ v: 1, recipes: [{ id: 'x', title: 'X', items: [{ key: 'garlic', name: 'garlic' }, null, 5] }, { nope: true }], custom: [{ id: 'a', text: 'x'.repeat(500) }, { id: 'b' }], checked: { a: true, b: 'yes' } });
  assert.equal(clean.recipes.length, 1);
  assert.equal(clean.recipes[0].items.length, 1);
  assert.equal(clean.custom.length, 1);
  assert.equal(clean.custom[0].text.length, 120);
  assert.deepEqual(clean.checked, { a: true });
});

test('diet labels are consistent with ingredients', () => {
  for (const r of recipes) {
    const flags = new Set(r.ingredients.flatMap((i) => vocab[i.key].contains || []));
    if (r.diets.includes('vegetarian')) assert.ok(!['meat', 'fish', 'rennet'].some((f) => flags.has(f)), r.id);
    if (r.diets.includes('vegan')) assert.ok(!['meat', 'fish', 'rennet', 'dairy', 'egg', 'honey'].some((f) => flags.has(f)), r.id);
  }
});
