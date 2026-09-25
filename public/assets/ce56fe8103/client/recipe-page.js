// Recipe page: serving scaler, units, ingredient checklist, shopping list,
// print, step timers and Cook Mode.

import { initPage, bindUnitToggles, getUnits, store, readJSON, loadList, saveList, toast, getFavorites, setFavorite, getNotes, setNotes, addToPlan, shareLink, cachePages, debounce } from './core.js';
import { ingredientParts, ingredientHTML } from '../lib/ingredient.js';
import { renderStep, stepScales, clock } from '../lib/tokens.js';
import { recipeItems, addRecipe } from '../lib/shopping.js';
import { servingsText } from '../lib/card.js';
import * as timers from './timers.js';
import * as cook from './cook-mode.js';

initPage();
const recipe = readJSON('recipe-data');
if (recipe) setup(recipe);

function setup(r) {
  const root = document.querySelector('.recipe');
  const maxServings = Math.max(100, r.servings * 10);
  const servingsKey = `cs:servings:${r.id}`;
  const checksKey = `cs:checks:${r.id}`;

  let servings = r.servings;
  const saved = store.get('session', servingsKey, null);
  if (Number.isInteger(saved) && saved >= 1 && saved <= maxServings) servings = saved;
  const checked = new Set((store.get('session', checksKey, []) || []).filter((i) => Number.isInteger(i) && r.ingredients[i]));

  const factor = () => servings / r.servings;
  const state = () => ({ factor: factor(), system: getUnits(), checked, servingsText: servingsText(r, servings) });

  const dual = (fn) => {
    const us = fn('us');
    const metric = fn('metric');
    return us === metric ? us : `<span class="u-us">${us}</span><span class="u-metric">${metric}</span>`;
  };

  // ---------- Rendering ----------
  function renderIngredients() {
    const f = factor();
    for (const li of root.querySelectorAll('.ing[data-i]')) {
      const ing = r.ingredients[Number(li.dataset.i)];
      const text = li.querySelector('.ing-text');
      text.innerHTML = dual((sys) => ingredientHTML(ingredientParts(ing, f, sys)));
    }
  }

  function renderSteps() {
    const f = factor();
    r.steps.forEach((s, i) => {
      if (!stepScales(s.text)) return;
      const p = root.querySelector(`[data-step-text="${i}"]`);
      if (p) p.innerHTML = dual((sys) => renderStep(s.text, { factor: f, system: sys }));
    });
  }

  function renderStatus() {
    const box = root.querySelector('[data-scale-status]');
    const fact = root.querySelector('[data-servings-fact]');
    const scaled = servings !== r.servings;
    if (fact) fact.textContent = r.servingsLabel === 'servings' ? String(servings) : servingsText(r, servings);
    if (!box) return;
    box.hidden = !scaled;
    if (scaled) {
      const f = factor();
      const mult = Number.isInteger(f) ? `×${f}` : `×${f.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}`;
      box.querySelector('[data-scale-text]').textContent = `Scaled to ${servingsText(r, servings)} (${mult} the original ${r.servings}). Times and temperatures stay the same.`;
    }
  }

  function renderAll() {
    renderIngredients();
    renderSteps();
    renderStatus();
    applyChecks();
    cook.refresh();
  }

  // ---------- Servings ----------
  const radios = [...root.querySelectorAll('input[name="servings"]')];
  const custom = root.querySelector('[data-custom-servings]');
  const errId = 'servings-error';
  let err = document.getElementById(errId);
  if (custom && !err) {
    err = document.createElement('p');
    err.id = errId;
    err.className = 'field-error';
    err.hidden = true;
    custom.closest('fieldset').append(err);
    custom.setAttribute('aria-describedby', errId);
  }

  function syncControls() {
    let matched = false;
    for (const rd of radios) {
      rd.checked = Number(rd.value) === servings;
      matched ||= rd.checked;
    }
    if (custom) custom.value = matched ? '' : String(servings);
  }

  function setServings(n) {
    servings = n;
    if (n === r.servings) store.remove('session', servingsKey);
    else store.set('session', servingsKey, n);
    syncControls();
    renderAll();
  }

  for (const rd of radios) rd.addEventListener('change', () => rd.checked && setServings(Number(rd.value)));

  function readCustom(commit) {
    const raw = custom.value.trim();
    if (raw === '') {
      err.hidden = true;
      custom.removeAttribute('aria-invalid');
      return;
    }
    const n = Number(raw);
    const ok = /^\d+$/.test(raw) && n >= 1 && n <= maxServings;
    err.hidden = ok;
    if (!ok) {
      err.textContent = `Enter a whole number from 1 to ${maxServings}.`;
      custom.setAttribute('aria-invalid', 'true');
      return;
    }
    custom.removeAttribute('aria-invalid');
    if (commit || n !== servings) setServings(n);
  }
  if (custom) {
    custom.addEventListener('input', () => readCustom(false));
    custom.addEventListener('change', () => readCustom(true));
    custom.addEventListener('keydown', (e) => e.key === 'Enter' && (e.preventDefault(), readCustom(true)));
  }
  root.querySelector('[data-action="reset-servings"]')?.addEventListener('click', () => setServings(r.servings));

  // ---------- Units ----------
  bindUnitToggles(root);
  document.addEventListener('cs:units', () => cook.refresh());

  // ---------- Checklist ----------
  const clearBtn = root.querySelector('[data-action="clear-checks"]');
  function applyChecks() {
    for (const box of root.querySelectorAll('.ing-box')) {
      const i = Number(box.dataset.i);
      box.checked = checked.has(i);
      box.closest('.ing').classList.toggle('is-checked', box.checked);
    }
    if (clearBtn) clearBtn.hidden = checked.size === 0;
    updateShopLabel();
  }
  function setCheck(i, on) {
    if (on) checked.add(i);
    else checked.delete(i);
    store.set('session', checksKey, [...checked]);
    applyChecks();
  }
  root.addEventListener('change', (e) => {
    const box = e.target.closest('.ing-box');
    if (box) setCheck(Number(box.dataset.i), box.checked);
  });
  clearBtn?.addEventListener('click', () => {
    checked.clear();
    store.remove('session', checksKey);
    applyChecks();
  });

  // ---------- Shopping list ----------
  const shopBtn = root.querySelector('[data-action="shop"]');
  function updateShopLabel() {
    const label = shopBtn?.querySelector('[data-shop-label]');
    if (!label) return;
    const onList = loadList().recipes.some((x) => x.id === r.id);
    label.textContent = onList ? 'Update list' : 'Add to list';
    shopBtn.setAttribute('aria-label', onList ? 'Update the ingredients on your shopping list' : 'Add ingredients to your shopping list');
  }
  shopBtn?.addEventListener('click', () => {
    const items = recipeItems(r.ingredients, factor(), checked);
    const list = loadList();
    const already = list.recipes.some((x) => x.id === r.id);
    if (!items.length) {
      toast('Everything is already checked off, so there was nothing to add.');
      return;
    }
    const next = addRecipe(list, { id: r.id, title: r.title, url: r.url, servings, servingsLabel: r.servingsLabel, servingsLabelOne: r.servingsLabelOne, items });
    if (!saveList(next)) {
      toast('Your browser blocked saving the list (private mode or storage full).');
      return;
    }
    const skipped = checked.size ? ` Skipped ${checked.size} you’ve checked off.` : '';
    toast(`${already ? 'Updated' : 'Added'} ${items.length} ingredients for ${servingsText(r, servings)}.${skipped}`, { href: '/shopping-list/', text: 'View list' });
    updateShopLabel();
  });

  // ---------- Print ----------
  root.querySelector('[data-action="print"]')?.addEventListener('click', () => window.print());

  // ---------- Step timers on the page ----------
  timers.setBaseTitle(document.title);
  timers.mountTray();
  const stepButtons = [...root.querySelectorAll('.timer-btn')];
  const keyFor = (b) => `${r.id}:${b.dataset.step}:${b.dataset.t}`;
  for (const b of stepButtons) {
    b.dataset.base = b.querySelector('span').textContent;
    b.addEventListener('click', () => {
      timers.start({ key: keyFor(b), label: b.dataset.label, seconds: Number(b.dataset.seconds), href: r.url });
    });
  }
  const refreshButtons = () => {
    for (const b of stepButtons) {
      const t = timers.find(keyFor(b));
      const span = b.querySelector('span');
      if (t && t.state === 'running') span.textContent = `Running · ${clock(timers.remaining(t))}`;
      else if (t && t.state === 'paused') span.textContent = `Paused · ${clock(timers.remaining(t))}`;
      else if (t && t.state === 'done') span.textContent = 'Done · start again';
      else span.textContent = b.dataset.base;
      b.classList.toggle('is-running', !!t && t.state !== 'done');
    }
  };
  timers.onChange(refreshButtons);
  refreshButtons();

  // ---------- Cook Mode ----------
  const openCook = (fromHash = false) => cook.open({ recipe: r, getState: state, onCheck: setCheck, fromHash });
  root.querySelector('[data-action="cook"]')?.addEventListener('click', () => openCook(false));
  if (location.hash === '#cook') openCook(true);

  // Leaving with a timer running or Cook Mode open asks first.
  window.addEventListener('beforeunload', (e) => {
    if (timers.anyRunning() || cook.isOpen()) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // ---------- Save (favorite) ----------
  const saveBtn = root.querySelector('[data-action="save"]');
  const syncSave = () => {
    const on = getFavorites().includes(r.id);
    saveBtn.setAttribute('aria-pressed', String(on));
    saveBtn.querySelector('[data-save-label]').textContent = on ? 'Saved' : 'Save';
  };
  saveBtn?.addEventListener('click', () => {
    const on = !getFavorites().includes(r.id);
    setFavorite(r.id, on);
    syncSave();
    toast(on ? 'Saved. It will also open offline.' : 'Removed from saved recipes.', on ? { href: '/saved/', text: 'View saved' } : null);
  });
  if (saveBtn) syncSave();
  cachePages([r.url]);

  // ---------- Meal plan ----------
  const planBtn = root.querySelector('[data-action="plan"]');
  const planForm = root.querySelector('[data-plan-form]');
  planBtn?.addEventListener('click', () => {
    const open = planForm.hidden;
    planForm.hidden = !open;
    planBtn.setAttribute('aria-expanded', String(open));
    if (open) {
      planForm.elements.servings.value = String(servings);
      const today = (new Date().getDay() + 6) % 7;
      planForm.elements.day.value = String(today);
      planForm.elements.day.focus();
    }
  });
  planForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const n = Number(planForm.elements.servings.value);
    const day = Number(planForm.elements.day.value);
    if (!Number.isInteger(n) || n < 1 || n > maxServings) {
      toast(`Enter a whole number from 1 to ${maxServings}.`);
      return;
    }
    if (!addToPlan(r.id, day, n)) {
      toast('Your browser blocked saving the plan (private mode or storage full).');
      return;
    }
    planForm.hidden = true;
    planBtn.setAttribute('aria-expanded', 'false');
    toast(`Added to ${planForm.elements.day.options[day].text}.`, { href: '/meal-planner/', text: 'Open meal planner' });
  });

  // ---------- Share ----------
  root.querySelector('[data-action="share"]')?.addEventListener('click', async () => {
    const res = await shareLink(r.title, r.url);
    if (res === 'copied') toast('Link copied.');
    else if (res === 'failed') toast('Sharing isn’t available here. Copy the address from the address bar.');
  });

  // ---------- My notes ----------
  const notes = root.querySelector('#my-notes');
  const notesStatus = root.querySelector('[data-notes-status]');
  const notesPrint = root.querySelector('[data-notes-print]');
  if (notes) {
    notes.value = getNotes(r.id);
    const syncPrint = () => {
      notesPrint.textContent = notes.value.trim() ? `My notes: ${notes.value.trim()}` : '';
    };
    syncPrint();
    const saveNotes = debounce(() => {
      notesStatus.textContent = setNotes(r.id, notes.value) ? 'Saved in this browser only.' : 'Couldn’t save: your browser blocked storage.';
    }, 400);
    notes.addEventListener('input', () => {
      notesStatus.textContent = 'Saving…';
      syncPrint();
      saveNotes();
    });
  }

  syncControls();
  if (servings !== r.servings || checked.size) renderAll();
  else applyChecks();
}
