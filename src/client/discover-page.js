// "What can I make?": the reader lists ingredients; we show recipes from the
// collection that use them and what is still missing.

import { initPage, readJSON, esc, store } from './core.js';
import { buildTermIndex } from '../lib/vocab.js';
import { discover, suggestionList } from '../lib/discover.js';
import { splitTerms, normalize } from '../lib/text.js';
import { cardHTML } from '../lib/card.js';

initPage();
const data = readJSON('discover-data') || { entries: [], vocab: {} };
const keys = new Set(Object.keys(data.vocab));
const termIndex = buildTermIndex(data.vocab, keys);
const form = document.querySelector('[data-discover-form]');
const input = form.querySelector('#have');
const chipsEl = form.querySelector('[data-chips]');
const pantry = form.querySelector('[data-pantry]');
const clearBtn = form.querySelector('[data-action="clear"]');
const results = document.querySelector('[data-discover-results]');
const count = document.querySelector('[data-discover-count]');
const unmatchedEl = document.querySelector('[data-unmatched]');
const MAX_TERMS = 20;

form.querySelector('[data-suggestions]').innerHTML = suggestionList(data.vocab, keys)
  .map((s) => `<option value="${esc(s)}"></option>`)
  .join('');

let terms = [];

function addTerms(text) {
  for (const t of splitTerms(text)) {
    if (terms.length >= MAX_TERMS) break;
    if (!terms.some((x) => normalize(x) === normalize(t))) terms.push(t);
  }
}

function sync() {
  const p = new URLSearchParams();
  if (terms.length) p.set('have', terms.join(','));
  if (!pantry.checked) p.set('pantry', '0');
  const qs = p.toString();
  history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
  store.set('session', 'cs:have', { terms, pantry: pantry.checked });
}

function render() {
  chipsEl.innerHTML = terms.map((t, i) => `<li><span>${esc(t)}</span><button type="button" data-remove="${i}" aria-label="Remove ${esc(t)}">✕</button></li>`).join('');
  clearBtn.hidden = !terms.length;
  if (!terms.length) {
    results.innerHTML = '';
    count.hidden = true;
    unmatchedEl.hidden = true;
    return;
  }
  const res = discover(data.entries, termIndex, terms, { assumePantry: pantry.checked });
  count.hidden = false;
  const n = res.results.length;
  count.textContent = n ? `${n} ${n === 1 ? 'recipe uses' : 'recipes use'} your ingredients` : 'No recipes use those ingredients yet';
  unmatchedEl.hidden = !res.unmatched.length;
  unmatchedEl.textContent = res.unmatched.length ? `No recipes in the collection use: ${res.unmatched.join(', ')}. Check the spelling or try a more general word.` : '';
  const recognised = terms.length - res.unmatched.length;
  results.innerHTML = res.results
    .map((m) => {
      const missing = m.missing.map((i) => i.name);
      const staples = m.pantryNeeded.map((i) => i.name);
      const extra = `<div class="match">
  <p class="match-used"><strong>Uses ${m.used.length} of your ${recognised}:</strong> ${esc(m.used.join(', '))}</p>
  ${missing.length ? `<p class="match-missing"><strong>You’d also need (${missing.length}):</strong> ${esc(missing.join(', '))}</p>` : `<p class="match-ready"><strong>You have everything${staples.length ? ' except basic staples' : ''}.</strong></p>`}
  ${staples.length ? `<p class="match-staples">Staples: ${esc(staples.join(', '))}</p>` : ''}
</div>`;
      return cardHTML(m.entry, { extra });
    })
    .join('');
}

function update() {
  sync();
  render();
}

// Restore from the URL, or from earlier in this session.
const params = new URLSearchParams(location.search);
if (params.has('have')) {
  addTerms((params.get('have') || '').slice(0, 600));
  pantry.checked = params.get('pantry') !== '0';
} else {
  const saved = store.get('session', 'cs:have', null);
  if (saved && Array.isArray(saved.terms)) {
    addTerms(saved.terms.filter((t) => typeof t === 'string').join(','));
    pantry.checked = saved.pantry !== false;
  }
}
update();

form.addEventListener('submit', (e) => {
  e.preventDefault();
  addTerms(input.value);
  input.value = '';
  update();
});
input.addEventListener('keydown', (e) => {
  if (e.key === 'Backspace' && !input.value && terms.length) {
    terms.pop();
    update();
  }
});
input.addEventListener('input', () => {
  // A typed comma (or a picked suggestion followed by one) commits the term.
  if (/[,;]/.test(input.value)) {
    addTerms(input.value);
    input.value = '';
    update();
  }
});
pantry.addEventListener('change', update);
clearBtn.addEventListener('click', () => {
  terms = [];
  update();
  input.focus();
});
chipsEl.addEventListener('click', (e) => {
  const b = e.target.closest('[data-remove]');
  if (!b) return;
  terms.splice(Number(b.dataset.remove), 1);
  update();
  input.focus();
});
form.addEventListener('click', (e) => {
  const b = e.target.closest('[data-add]');
  if (!b) return;
  addTerms(b.dataset.add);
  update();
});
