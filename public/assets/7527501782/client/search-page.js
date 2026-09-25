// Search page: live filtering over the built-in index. State lives in the URL
// so results can be bookmarked and the back button works.

import { initPage, readJSON, debounce } from './core.js';
import { prepareIndex, searchRecipes } from '../lib/search.js';
import { cardHTML } from '../lib/card.js';

initPage();
const entries = readJSON('search-data') || [];
const index = prepareIndex(entries);
const form = document.querySelector('[data-search-form]');
const grid = document.querySelector('[data-results]');
const count = document.getElementById('results-count');
const note = document.querySelector('[data-results-note]');
const empty = document.querySelector('[data-empty]');
const reset = form.querySelector('[data-action="reset-filters"]');

const MEALS = ['breakfast', 'lunch', 'dinner', 'dessert', 'side', 'snack'];
const DIETS = ['vegetarian', 'vegan'];
const TAGS = ['one-pan', 'make-ahead'];
const SORTS = ['', 'quickest', 'newest', 'az'];

function fromURL() {
  const p = new URLSearchParams(location.search);
  const time = Number(p.get('time'));
  const cuisines = [...form.elements.cuisine.options].map((o) => o.value);
  return {
    q: (p.get('q') || '').slice(0, 200),
    meals: p.getAll('meal').filter((m) => MEALS.includes(m)),
    diets: p.getAll('diet').filter((d) => DIETS.includes(d)),
    tags: p.getAll('tag').filter((t) => TAGS.includes(t)),
    quick: p.get('quick') === '1',
    maxTime: [15, 30, 45, 60, 90].includes(time) ? time : null,
    cuisine: cuisines.includes(p.get('cuisine')) ? p.get('cuisine') : '',
    sort: SORTS.includes(p.get('sort')) ? p.get('sort') : '',
  };
}

function toForm(s) {
  form.elements.q.value = s.q;
  for (const box of form.querySelectorAll('input[type="checkbox"]')) {
    const { name, value } = box;
    box.checked = name === 'meal' ? s.meals.includes(value) : name === 'diet' ? s.diets.includes(value) : name === 'tag' ? s.tags.includes(value) : name === 'quick' ? s.quick : false;
  }
  form.elements.time.value = s.maxTime ? String(s.maxTime) : '';
  form.elements.cuisine.value = s.cuisine;
  form.elements.sort.value = s.sort;
}

function fromForm() {
  const checked = (name) => [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((b) => b.value);
  return {
    q: form.elements.q.value.slice(0, 200),
    meals: checked('meal'),
    diets: checked('diet'),
    tags: checked('tag'),
    quick: form.elements.quick.checked,
    maxTime: Number(form.elements.time.value) || null,
    cuisine: form.elements.cuisine.value,
    sort: form.elements.sort.value,
  };
}

function toURL(s) {
  const p = new URLSearchParams();
  if (s.q.trim()) p.set('q', s.q.trim());
  for (const m of s.meals) p.append('meal', m);
  for (const d of s.diets) p.append('diet', d);
  for (const t of s.tags) p.append('tag', t);
  if (s.quick) p.set('quick', '1');
  if (s.maxTime) p.set('time', String(s.maxTime));
  if (s.cuisine) p.set('cuisine', s.cuisine);
  if (s.sort) p.set('sort', s.sort);
  const qs = p.toString();
  history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
}

function run(s) {
  const { results, partial, parsed } = searchRecipes(index, { ...s, sort: s.sort || undefined });
  grid.innerHTML = results.map((r) => cardHTML(r.entry)).join('');
  const n = results.length;
  count.textContent = n ? `${n} ${n === 1 ? 'recipe' : 'recipes'}${partial ? ' match some of your words' : ''}` : 'No recipes found';
  empty.hidden = n > 0;
  const notes = [];
  if (partial) notes.push('No recipe matches every word, so these match some of them.');
  if (parsed.maxTime && !s.maxTime) notes.push(`Showing recipes ready in ${parsed.maxTime} minutes or less.`);
  note.hidden = !notes.length;
  note.textContent = notes.join(' ');
  const filtered = s.meals.length || s.diets.length || s.tags.length || s.quick || s.maxTime || s.cuisine || s.sort || s.q.trim();
  reset.hidden = !filtered;
}

const update = () => {
  const s = fromForm();
  toURL(s);
  run(s);
};

const initial = fromURL();
toForm(initial);
run(initial);

form.addEventListener('submit', (e) => {
  e.preventDefault();
  update();
  form.elements.q.blur();
});
form.addEventListener('change', update);
form.elements.q.addEventListener('input', debounce(update, 150));
reset.addEventListener('click', () => {
  toForm({ q: '', meals: [], diets: [], tags: [], quick: false, maxTime: null, cuisine: '', sort: '' });
  update();
});
