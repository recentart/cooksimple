// Saved recipes: favorites plus any recipe with personal notes.

import { initPage, loadData, getFavorites, setFavorite, notedRecipes, getNotes, esc } from './core.js';
import { cardHTML } from '../lib/card.js';

initPage();
const grid = document.querySelector('[data-saved]');
const count = document.querySelector('[data-saved-count]');
const empty = document.querySelector('[data-saved-empty]');

async function render() {
  let entries = [];
  try {
    entries = await loadData('index.json');
  } catch {
    count.textContent = 'Saved recipes couldn’t load. Check your connection.';
    return;
  }
  const byId = new Map(entries.map((e) => [e.id, e]));
  const favs = getFavorites().filter((id) => byId.has(id));
  const noted = notedRecipes().filter((id) => byId.has(id) && !favs.includes(id));
  const ids = [...favs, ...noted];
  count.textContent = ids.length ? `${ids.length} ${ids.length === 1 ? 'recipe' : 'recipes'}` : 'No saved recipes';
  empty.hidden = ids.length > 0;
  grid.innerHTML = ids
    .map((id) => {
      const note = getNotes(id);
      const extra = `<div class="match">${favs.includes(id) ? `<button type="button" class="link-btn" data-unsave="${esc(id)}">Remove from saved</button>` : '<p class="muted">Has your notes</p>'}${note ? `<p class="saved-note">${esc(note.length > 140 ? `${note.slice(0, 140)}…` : note)}</p>` : ''}</div>`;
      return cardHTML(byId.get(id), { extra });
    })
    .join('');
}

grid.addEventListener('click', (e) => {
  const b = e.target.closest('[data-unsave]');
  if (!b) return;
  setFavorite(b.dataset.unsave, false);
  render();
});
window.addEventListener('storage', (e) => e.key && e.key.startsWith('cs:') && render());
render();
