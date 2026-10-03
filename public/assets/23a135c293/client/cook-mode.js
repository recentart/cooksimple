// Cook Mode: one step at a time in large type, ingredients one tap away,
// timers built in, the screen kept awake where the browser allows it, and
// the back button closes Cook Mode instead of leaving the recipe.

import { store, esc } from './core.js';
import { renderStep, stepTimers, clock } from '../lib/tokens.js';
import { ingredientParts, ingredientHTML, ingredientText } from '../lib/ingredient.js';
import * as timers from './timers.js';

let dialog = null;
let current = null; // { recipe, getState, onCheck, step }
let wakeLock = null;
let unsubscribe = null;

const stepKey = (id) => `cs:cook:${id}`;
const sizeKey = 'cs:cook-size';

async function keepAwake() {
  if (!('wakeLock' in navigator)) return false;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener?.('release', () => (wakeLock = null));
    return true;
  } catch {
    return false;
  }
}

function releaseAwake() {
  try {
    wakeLock?.release();
  } catch {
    /* already released */
  }
  wakeLock = null;
}

function onVisibility() {
  if (document.visibilityState === 'visible' && isOpen() && !wakeLock) keepAwake().then(updateAwake);
}

function updateAwake(ok) {
  const el = dialog?.querySelector('[data-awake]');
  if (!el) return;
  if (ok === undefined) ok = !!wakeLock;
  el.textContent = ok ? 'Screen stays on while Cook Mode is open.' : 'Tip: this browser can’t keep the screen on by itself. Raise your screen timeout while you cook.';
}

export function isOpen() {
  return !!(dialog && dialog.open);
}

function build() {
  dialog = document.createElement('dialog');
  dialog.className = 'cook';
  dialog.setAttribute('aria-labelledby', 'cook-title');
  dialog.innerHTML = `
<div class="cook-shell">
  <header class="cook-top">
    <div class="cook-top-row">
      <p class="cook-recipe" id="cook-title"></p>
      <div class="cook-top-actions">
        <button type="button" class="cook-icon-btn" data-cook="size" aria-label="Change text size">Aa</button>
        <button type="button" class="cook-exit" data-cook="exit">Exit</button>
      </div>
    </div>
    <div class="cook-progress">
      <div class="cook-bar" role="progressbar" aria-valuemin="1" aria-label="Recipe progress"><span></span></div>
      <p class="cook-count" data-count></p>
    </div>
  </header>
  <div class="cook-main" data-main tabindex="-1">
    <div class="cook-step" data-step aria-live="polite"></div>
  </div>
  <section class="cook-timers" aria-label="Running timers" hidden><ul class="timer-list"></ul></section>
  <nav class="cook-nav" aria-label="Steps">
    <button type="button" class="cook-nav-btn" data-cook="prev"><span aria-hidden="true">←</span> Back</button>
    <button type="button" class="cook-nav-btn cook-ing-btn" data-cook="ingredients" aria-expanded="false">Ingredients</button>
    <button type="button" class="cook-nav-btn cook-next" data-cook="next">Next <span aria-hidden="true">→</span></button>
  </nav>
  <div class="cook-sheet" data-sheet hidden>
    <div class="cook-sheet-inner" role="region" aria-labelledby="cook-ing-title">
      <div class="cook-sheet-head">
        <h2 id="cook-ing-title">Ingredients</h2>
        <button type="button" class="cook-exit" data-cook="close-sheet">Close</button>
      </div>
      <p class="cook-sheet-servings" data-servings></p>
      <ul class="cook-ing-list" data-ing></ul>
    </div>
  </div>
  <p class="cook-awake" data-awake></p>
</div>`;
  document.body.append(dialog);

  dialog.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cook]');
    if (!btn) return;
    const act = btn.getAttribute('data-cook');
    if (act === 'prev') go(current.step - 1);
    else if (act === 'next') go(current.step + 1);
    else if (act === 'ingredients') toggleSheet();
    else if (act === 'close-sheet') toggleSheet(false);
    else if (act === 'exit') requestClose();
    else if (act === 'size') cycleSize();
    else if (act === 'restart') go(0);
    else if (act === 'start-timer') {
      const s = current.recipe.steps[Number(btn.dataset.step)];
      const t = stepTimers(s.text)[Number(btn.dataset.t)];
      if (t) timers.start({ key: `${current.recipe.id}:${btn.dataset.step}:${btn.dataset.t}`, label: `Step ${Number(btn.dataset.step) + 1}: ${t.label}`, seconds: t.seconds, href: current.recipe.url });
    }
  });
  dialog.addEventListener('change', (e) => {
    const box = e.target.closest('input[data-i]');
    if (box) current.onCheck(Number(box.dataset.i), box.checked);
  });
  // Esc closes the ingredients sheet first, then Cook Mode.
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    if (!dialog.querySelector('[data-sheet]').hidden) toggleSheet(false);
    else requestClose();
  });
  dialog.addEventListener('keydown', (e) => {
    if (e.target.closest('input, select, textarea')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault();
      go(current.step + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      go(current.step - 1);
    }
  });
  // Swipe left / right on the step to move between steps.
  const main = dialog.querySelector('[data-main]');
  let sx = 0;
  let sy = 0;
  let tracking = false;
  main.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    tracking = true;
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
  }, { passive: true });
  main.addEventListener('touchend', (e) => {
    if (!tracking) return;
    tracking = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - sx;
    const dy = t.clientY - sy;
    if (Math.abs(dx) > 70 && Math.abs(dy) < 50) go(current.step + (dx < 0 ? 1 : -1));
  }, { passive: true });

  const timerBox = dialog.querySelector('.cook-timers');
  timers.bindTimerActions(timerBox);
  let sig = '';
  unsubscribe = timers.onChange((list, tickOnly) => {
    if (!isOpen()) return;
    const s = list.map((t) => `${t.id}:${t.state}`).join('|');
    if (tickOnly && s === sig) {
      timers.refreshClocks(timerBox);
      refreshStepButtons();
      return;
    }
    sig = s;
    timerBox.querySelector('ul').innerHTML = timers.timersHTML(list);
    timerBox.hidden = list.length === 0;
    refreshStepButtons();
  });
}

function refreshStepButtons() {
  if (!current) return;
  for (const b of dialog.querySelectorAll('[data-cook="start-timer"]')) {
    const t = timers.find(`${current.recipe.id}:${b.dataset.step}:${b.dataset.t}`);
    const label = b.querySelector('span');
    const base = b.dataset.base;
    if (t && t.state === 'running') label.textContent = `Running · ${clock(timers.remaining(t))}`;
    else if (t && t.state === 'paused') label.textContent = `Paused · ${clock(timers.remaining(t))}`;
    else if (t && t.state === 'done') label.textContent = 'Done · restart';
    else label.textContent = base;
    b.classList.toggle('is-running', !!t && t.state !== 'done');
  }
}

function cycleSize() {
  const sizes = ['size-l', 'size-xl', 'size-m'];
  const now = sizes.find((s) => dialog.classList.contains(s)) || 'size-l';
  const next = sizes[(sizes.indexOf(now) + 1) % sizes.length];
  dialog.classList.remove(...sizes);
  dialog.classList.add(next);
  store.set('local', sizeKey, next);
}

function toggleSheet(force) {
  const sheet = dialog.querySelector('[data-sheet]');
  const btn = dialog.querySelector('[data-cook="ingredients"]');
  const show = force === undefined ? sheet.hidden : force;
  sheet.hidden = !show;
  btn.setAttribute('aria-expanded', String(show));
  if (show) {
    renderSheet();
    sheet.querySelector('[data-cook="close-sheet"]').focus();
  } else {
    btn.focus();
  }
}

function renderSheet() {
  const { recipe } = current;
  const { factor, system, checked, servingsText } = current.getState();
  dialog.querySelector('[data-servings]').textContent = servingsText;
  let html = '';
  let group = null;
  for (const ing of recipe.ingredients) {
    if (ing.group !== group) {
      group = ing.group;
      if (group) html += `<li class="cook-ing-group">${esc(group)}</li>`;
    }
    const p = ingredientParts(ing, factor, system);
    html += `<li><label><input type="checkbox" data-i="${ing.i}"${checked.has(ing.i) ? ' checked' : ''}><span>${ingredientHTML(p)}</span></label></li>`;
  }
  dialog.querySelector('[data-ing]').innerHTML = html;
}

function renderStepView() {
  const { recipe, step } = current;
  const total = recipe.steps.length;
  const { factor, system } = current.getState();
  const box = dialog.querySelector('[data-step]');
  const bar = dialog.querySelector('.cook-bar');
  const done = step >= total;
  bar.setAttribute('aria-valuemax', String(total));
  bar.setAttribute('aria-valuenow', String(Math.min(step + 1, total)));
  bar.querySelector('span').style.width = `${(Math.min(step + 1, total) / total) * 100}%`;
  dialog.querySelector('[data-count]').textContent = done ? 'All steps done' : `Step ${step + 1} of ${total}`;
  const prev = dialog.querySelector('[data-cook="prev"]');
  const next = dialog.querySelector('[data-cook="next"]');
  prev.disabled = step === 0;
  next.disabled = done;
  next.innerHTML = step === total - 1 ? 'Finish <span aria-hidden="true">✓</span>' : 'Next <span aria-hidden="true">→</span>';

  if (done) {
    box.innerHTML = `<div class="cook-finish"><p class="cook-step-label">Finished</p><p class="cook-text">That’s every step. Enjoy your ${esc(recipe.title.toLowerCase())}.</p>
      <div class="cook-finish-actions"><button type="button" class="btn" data-cook="restart">Start over</button><button type="button" class="btn btn-primary" data-cook="exit">Close Cook Mode</button></div></div>`;
    return;
  }
  const s = recipe.steps[step];
  const uses = (s.uses || []).map((i) => recipe.ingredients[i]).filter(Boolean);
  const ts = stepTimers(s.text);
  box.innerHTML = `
    <p class="cook-step-label">Step ${step + 1}</p>
    <p class="cook-text">${renderStep(s.text, { factor, system })}</p>
    ${uses.length ? `<div class="cook-uses"><p class="cook-uses-label">You’ll need</p><ul>${uses.map((ing) => `<li>${esc(ingredientText(ingredientParts(ing, factor, system)))}</li>`).join('')}</ul></div>` : ''}
    ${ts.length ? `<div class="cook-step-timers">${ts.map((t, j) => `<button type="button" class="btn btn-timer" data-cook="start-timer" data-step="${step}" data-t="${j}" data-base="Start ${clock(t.seconds)} timer"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 9v4l2.5 2.5M9 2h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>Start ${clock(t.seconds)} timer</span></button>`).join('')}</div>` : ''}`;
  refreshStepButtons();
}

function go(n) {
  const total = current.recipe.steps.length;
  const step = Math.max(0, Math.min(total, n));
  if (step === current.step) return;
  current.step = step;
  store.set('session', stepKey(current.recipe.id), step);
  renderStepView();
  dialog.querySelector('[data-main]').scrollTop = 0;
}

/** Re-render after servings or units change. */
export function refresh() {
  if (!isOpen()) return;
  renderStepView();
  if (!dialog.querySelector('[data-sheet]').hidden) renderSheet();
}

export function open({ recipe, getState, onCheck, fromHash = false }) {
  if (!dialog) build();
  if (isOpen()) return;
  const saved = store.get('session', stepKey(recipe.id), 0);
  current = { recipe, getState, onCheck, step: Number.isInteger(saved) && saved >= 0 && saved <= recipe.steps.length ? saved : 0 };
  dialog.classList.remove('size-m', 'size-l', 'size-xl');
  dialog.classList.add(store.get('local', sizeKey, 'size-l'));
  dialog.querySelector('#cook-title').textContent = recipe.title;
  dialog.querySelector('[data-sheet]').hidden = true;
  renderStepView();
  dialog.showModal();
  document.documentElement.classList.add('cooking');
  // Let the back button close Cook Mode rather than leave the page.
  if (!fromHash) history.pushState({ cook: true }, '', `${location.pathname}${location.search}#cook`);
  else history.replaceState({ cook: true }, '', `${location.pathname}${location.search}#cook`);
  keepAwake().then(updateAwake);
  document.addEventListener('visibilitychange', onVisibility);
  // Paint timers that were already running.
  const list = timers.list();
  const timerBox = dialog.querySelector('.cook-timers');
  timerBox.querySelector('ul').innerHTML = timers.timersHTML(list);
  timerBox.hidden = list.length === 0;
  dialog.querySelector('[data-cook="next"]').focus();
}

function requestClose() {
  if (history.state && history.state.cook) history.back();
  else close();
}

export function close() {
  if (!isOpen()) return;
  dialog.close();
  document.documentElement.classList.remove('cooking');
  releaseAwake();
  document.removeEventListener('visibilitychange', onVisibility);
  if (location.hash === '#cook') history.replaceState(null, '', `${location.pathname}${location.search}`);
  document.querySelector('[data-action="cook"]')?.focus();
}

window.addEventListener('popstate', () => {
  if (isOpen() && location.hash !== '#cook') close();
});

export function destroy() {
  unsubscribe?.();
}
