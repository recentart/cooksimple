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
 * Google AdSense settings from site.config.json, or null when ads are off.
 * Ads switch on only with "enabled": true, a publisher ID (ca-pub-...) and
 * at least one ad unit ID; a half-filled config fails the build instead of
 * shipping a broken slot. Rules for placement are in ADS.md.
 */
export function adsConfig(site) {
  const a = site.ads || {};
  if (!a.enabled) return null;
  if (!/^ca-pub-\d{10,20}$/.test(a.client || '')) throw new Error('site.config.json: ads.client must be your AdSense publisher ID, e.g. "ca-pub-1234567890123456"');
  const slots = Object.fromEntries(Object.entries(a.slots || {}).filter(([, id]) => id));
  for (const [pos, id] of Object.entries(slots)) {
    if (!AD_POSITIONS.includes(pos)) throw new Error(`site.config.json: unknown ad position "${pos}" (allowed: ${AD_POSITIONS.join(', ')})`);
    if (!/^\d{6,20}$/.test(id)) throw new Error(`site.config.json: ads.slots["${pos}"] must be an AdSense ad unit ID (digits only)`);
  }
  if (!Object.keys(slots).length) throw new Error('site.config.json: ads are enabled but no ads.slots ad unit ID is set');
  return { client: a.client, slots };
}

export const AD_POSITIONS = ['below-recipe', 'home-between-sections'];

/**
 * One small, labelled ad. Renders only a comment unless that position has an
 * ad unit ID. The size is fixed in CSS (320x100 on phones, 728x90 wider) so
 * the space is reserved before the ad loads and nothing on the page moves.
 */
export function adSlot(site, position) {
  const ads = adsConfig(site);
  const slot = ads && ads.slots[position];
  if (!slot) return raw(`<!-- ad position reserved: ${position} (no ad) -->`);
  return html`<aside class="ad-slot ad-${position}" aria-label="Advertisement"><span class="ad-label">Advertisement</span><ins class="adsbygoogle" data-ad-client="${ads.client}" data-ad-slot="${slot}"></ins></aside>`;
}
