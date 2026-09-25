// Meal planner: recipes by day for one week, then everything to the shopping list.

import { initPage, loadData, getPlan, savePlan, loadList, saveList, toast, esc } from './core.js';
import { recipeItems, addRecipe } from '../lib/shopping.js';
import { servingsText } from '../lib/card.js';

initPage();
const root = document.querySelector('[data-planner]');
let entries = [];
let byId = new Map();
let byTitle = new Map();

function render() {
  const plan = getPlan();
  for (const day of root.querySelectorAll('.plan-day')) {
    const d = Number(day.dataset.day);
    const items = plan.items.filter((it) => it.day === d && byId.has(it.id));
    day.querySelector('[data-list]').innerHTML = items.length
      ? items
          .map((it) => {
            const e = byId.get(it.id);
            return `<li class="plan-item" data-uid="${esc(it.uid)}">
  <a href="/recipes/${esc(e.id)}/">${esc(e.title)}</a>
  <span class="plan-servings"><button type="button" class="tbtn" data-act="less" aria-label="Fewer ${esc(e.servingsLabel || 'servings')}">−</button><span>${esc(servingsText(e, it.servings))}</span><button type="button" class="tbtn" data-act="more" aria-label="More ${esc(e.servingsLabel || 'servings')}">+</button></span>
  <button type="button" class="tbtn" data-act="remove" aria-label="Remove ${esc(e.title)}">✕</button>
</li>`;
          })
          .join('')
      : '<li class="plan-empty muted">Nothing planned</li>';
  }
  root.querySelector('[data-action="plan-to-list"]').disabled = !plan.items.length;
}

root.addEventListener('click', async (e) => {
  const act = e.target.closest('[data-act]')?.dataset.act;
  const uid = e.target.closest('[data-uid]')?.dataset.uid;
  const plan = getPlan();
  if (act && uid) {
    const it = plan.items.find((x) => x.uid === uid);
    if (!it) return;
    if (act === 'remove') plan.items = plan.items.filter((x) => x !== it);
    if (act === 'more') it.servings = Math.min(it.servings + 1, 1000);
    if (act === 'less') it.servings = Math.max(it.servings - 1, 1);
    savePlan(plan);
    render();
    return;
  }
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action === 'clear-plan' && plan.items.length && window.confirm('Remove every recipe from this week’s plan?')) {
    savePlan({ v: 1, items: [] });
    render();
  }
  if (action === 'plan-to-list' && plan.items.length) {
    // Combine repeats of the same recipe, then scale each once.
    const totals = new Map();
    for (const it of plan.items) if (byId.has(it.id)) totals.set(it.id, (totals.get(it.id) || 0) + it.servings);
    try {
      const recipes = await Promise.all([...totals.keys()].map((id) => loadData(`r/${id}.json`)));
      let list = loadList();
      for (const r of recipes) {
        const servings = totals.get(r.id);
        list = addRecipe(list, { id: r.id, title: r.title, url: r.url, servings, servingsLabel: r.servingsLabel, servingsLabelOne: r.servingsLabelOne, items: recipeItems(r.ingredients, servings / r.servings) });
      }
      saveList(list);
      toast(`Added ingredients for ${recipes.length} ${recipes.length === 1 ? 'recipe' : 'recipes'} to your shopping list.`, { href: '/shopping-list/', text: 'View list' });
    } catch {
      toast('Couldn’t load the recipes. Check your connection and try again.');
    }
  }
});

root.addEventListener('submit', (e) => {
  const form = e.target.closest('[data-add]');
  if (!form) return;
  e.preventDefault();
  const input = form.querySelector('input');
  const text = input.value.trim().toLowerCase();
  if (!text) return;
  const match = byTitle.get(text) || entries.find((x) => x.title.toLowerCase().includes(text));
  if (!match) {
    toast(`No recipe called “${input.value.trim()}”. Pick one from the suggestions.`);
    return;
  }
  const plan = getPlan();
  plan.items.push({ uid: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, id: match.id, day: Number(form.closest('.plan-day').dataset.day), servings: match.servings });
  savePlan(plan);
  input.value = '';
  render();
});

window.addEventListener('storage', (e) => e.key === 'cs:plan' && render());

try {
  entries = await loadData('index.json');
  byId = new Map(entries.map((x) => [x.id, x]));
  byTitle = new Map(entries.map((x) => [x.title.toLowerCase(), x]));
  root.querySelector('[data-plan-options]').innerHTML = entries.map((x) => `<option value="${esc(x.title)}"></option>`).join('');
} catch {
  toast('The recipe list couldn’t load. Check your connection.');
}
render();
