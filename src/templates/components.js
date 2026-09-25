import { html, raw } from './html.js';
import { cardHTML, minutes, servingsText } from '../lib/card.js';

export { minutes, servingsText };

/** ISO 8601 duration for structured data, e.g. 75 -> "PT1H15M". */
export function isoDuration(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `PT${h ? `${h}H` : ''}${m || !h ? `${m}M` : ''}`;
}

export const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', dessert: 'Dessert', snack: 'Snack', side: 'Side dish' };
export const DIET_LABELS = { vegetarian: 'Vegetarian', vegan: 'Vegan' };
export const TAG_LABELS = { 'one-pan': 'One-pan', 'make-ahead': 'Make-ahead', 'no-cook': 'No-cook', 'freezer-friendly': 'Freezer-friendly', baking: 'Baking' };

export function recipeCard(r, opts = {}) {
  return raw(cardHTML(r, opts));
}

export function cardGrid(recipes, opts) {
  return html`<div class="card-grid">${recipes.map((r) => recipeCard(r, opts))}</div>`;
}

/**
 * Reserved advertising position. Ads are OFF in V1, so this renders only a
 * comment. Allowed positions and rules are in ADS.md: never inside the
 * ingredients, the instructions or Cook Mode, never covering content.
 */
export function adSlot(site, position) {
  if (!site.ads || !site.ads.enabled) return raw(`<!-- ad position reserved: ${position} (ads disabled) -->`);
  return html`<aside class="ad-slot ad-${position}" aria-label="Advertisement"><span class="ad-label">Advertisement</span></aside>`;
}
