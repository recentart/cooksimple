// Shopping list page. The list is stored in this browser only.

import { initPage, bindUnitToggles, getUnits, loadList, saveList, esc, toast, LIST_KEY } from './core.js';
import { groupedRows, rowText, removeRecipe, addCustom, pruneChecked, listAsText, itemCount, rowKeyOf } from '../lib/shopping.js';
import { servingsText } from '../lib/card.js';

initPage();
const root = document.querySelector('[data-shop]');
const groupsEl = root.querySelector('[data-shop-groups]');
const recipesEl = root.querySelector('[data-shop-recipes]');
const emptyEl = root.querySelector('[data-shop-empty]');
const toolbar = root.querySelector('.shop-toolbar');
let list = pruneChecked(loadList());

function persist() {
  list = pruneChecked(list);
  saveList(list);
  render();
}

function render() {
  const system = getUnits();
  const empty = itemCount(list) === 0;
  emptyEl.hidden = !empty;
  toolbar.hidden = empty;
  recipesEl.innerHTML = list.recipes.length
    ? `<h2 class="shop-h">From ${list.recipes.length} ${list.recipes.length === 1 ? 'recipe' : 'recipes'}</h2><ul class="shop-recipe-list">${list.recipes
        .map((r) => `<li><a href="${esc(r.url)}">${esc(r.title)}</a> <span class="muted">· ${esc(servingsText(r, r.servings))}</span> <button type="button" class="link-btn" data-remove-recipe="${esc(r.id)}" aria-label="Remove ${esc(r.title)} from the list">Remove</button></li>`)
        .join('')}</ul>`
    : '';
  groupsEl.innerHTML = groupedRows(list)
    .map(
      (g) => `<section class="shop-group${g.aisle === 'staples' ? ' is-staples' : ''}" aria-labelledby="g-${g.aisle}">
  <h2 class="shop-h" id="g-${g.aisle}">${esc(g.label)}</h2>
  <ul class="shop-items">
    ${g.rows.map((row) => item(row.rowKey, rowText(row, system), `for ${row.recipes.join(', ')}${row.optional ? ' (optional)' : ''}`)).join('')}
    ${g.custom.map((c) => item(`custom:${c.id}`, c.text, 'added by you', c.id)).join('')}
  </ul>
</section>`,
    )
    .join('');
}

function item(key, text, sub, customId) {
  const on = !!list.checked[key];
  return `<li class="shop-item${on ? ' is-checked' : ''}"><label><input type="checkbox" data-key="${esc(key)}"${on ? ' checked' : ''}><span class="shop-text">${esc(text)}<span class="shop-sub">${esc(sub)}</span></span></label>${customId ? `<button type="button" class="link-btn" data-remove-custom="${esc(customId)}" aria-label="Remove ${esc(text)}">✕</button>` : ''}</li>`;
}

root.addEventListener('change', (e) => {
  const box = e.target.closest('input[data-key]');
  if (!box) return;
  if (box.checked) list.checked[box.dataset.key] = true;
  else delete list.checked[box.dataset.key];
  persist();
});

root.addEventListener('click', async (e) => {
  const t = e.target;
  const recipeBtn = t.closest('[data-remove-recipe]');
  const customBtn = t.closest('[data-remove-custom]');
  const act = t.closest('[data-action]')?.dataset.action;
  if (recipeBtn) {
    list = removeRecipe(list, recipeBtn.dataset.removeRecipe);
    persist();
  } else if (customBtn) {
    list = { ...list, custom: list.custom.filter((c) => c.id !== customBtn.dataset.removeCustom) };
    persist();
  } else if (act === 'clear-checked') {
    // Checked recipe rows are hidden by un-listing them; recipes stay so the rest remains.
    const checkedCustom = new Set(Object.keys(list.checked).filter((k) => k.startsWith('custom:')).map((k) => k.slice(7)));
    const checkedKeys = new Set(Object.keys(list.checked).filter((k) => !k.startsWith('custom:')));
    list = {
      ...list,
      custom: list.custom.filter((c) => !checkedCustom.has(c.id)),
      recipes: list.recipes.map((r) => ({ ...r, items: r.items.filter((i) => !checkedKeys.has(rowKeyOf(i))) })).filter((r) => r.items.length),
      checked: {},
    };
    persist();
  } else if (act === 'clear-all') {
    if (window.confirm('Remove everything from your shopping list?')) {
      list = { v: 1, recipes: [], custom: [], checked: {} };
      persist();
    }
  } else if (act === 'print') {
    window.print();
  } else if (act === 'copy') {
    const text = listAsText(list, getUnits());
    try {
      await navigator.clipboard.writeText(text);
      toast('Shopping list copied.');
    } catch {
      toast('Copying isn’t allowed here. Select the list and copy it instead.');
    }
  }
});

root.querySelector('[data-add-item]').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = e.currentTarget.querySelector('input');
  const before = list.custom.length;
  list = addCustom(list, input.value, `c${Date.now().toString(36)}`);
  if (list.custom.length === before && input.value.trim()) toast('That item is already on your list.');
  input.value = '';
  persist();
});

bindUnitToggles(root);
document.addEventListener('cs:units', render);
window.addEventListener('storage', (e) => {
  if (e.key === LIST_KEY) {
    list = pruneChecked(loadList());
    render();
  }
});
render();
