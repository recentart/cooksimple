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
 * Adsterra banner settings from site.config.json, or null while ads are off.
 * Ads are on when at least one banner has its Adsterra code: the script src
 * address from the unit's snippet. Adsterra changes the format over time, e.g.
 * "https://bauval.org/22/<key>" or "//www.highperformanceformat.com/<key>/invoke.js";
 * any https address whose path holds the unit's 32-character key works.
 * A mistyped code stops the build instead of shipping a broken slot.
 */
export const AD_SIZES = ['728x90', '320x50'];
const AD_SRC = /^(?:https?:)?\/\/([a-z0-9.-]+\.[a-z]{2,})(\/(?:[\w.-]+\/)*?([a-f0-9]{32})(?:\/[\w.-]+)*)$/i;

export function adsConfig(site) {
  const banners = (site.ads && site.ads.banners) || {};
  const live = {};
  for (const [size, code] of Object.entries(banners)) {
    if (!code) continue;
    if (!AD_SIZES.includes(size)) throw new Error(`site.config.json: unknown banner size "${size}" (allowed: ${AD_SIZES.join(', ')})`);
    const m = AD_SRC.exec(code.trim());
    if (!m) throw new Error(`site.config.json: ads.banners["${size}"] must be the script src address from Adsterra's banner code (it contains the unit's 32-character key)`);
    live[size] = { src: `https://${m[1]}${m[2]}`, key: m[3] };
  }
  return Object.keys(live).length ? live : null;
}

/**
 * One small, labelled ad below the recipe. Renders only a comment while ads
 * are off. The box has a fixed size in CSS (320x50 on phones, 728x90 from
 * 768px) so the space is reserved and nothing moves; recipe-page.js loads
 * the matching banner in its own frame (/ad/<size>).
 */
export function adSlot(site, position) {
  const ads = adsConfig(site);
  if (!ads || position !== 'below-recipe') return raw(`<!-- ad position reserved: ${position} (no ad) -->`);
  return html`<aside class="ad-slot ad-${position}" aria-label="Advertisement" data-ad-sizes="${AD_SIZES.filter((s) => ads[s]).join(' ')}"><span class="ad-label">Advertisement</span><div class="ad-box"></div></aside>`;
}
