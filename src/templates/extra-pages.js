// Collections, saved recipes, meal planner and the offline page.

import { html, raw } from './html.js';
import { layout } from './layout.js';
import { recipeCard } from './components.js';
import { DAYS } from './pages.js';

/** Recipes matching a collection's rules (see data/collections.json). */
export function collectionRecipes(c, recipes) {
  const m = c.match || {};
  const re = m.titleMatch ? new RegExp(`\\b(${m.titleMatch})\\b`, 'i') : null;
  return recipes
    .filter((r) => {
      if (m.meals && m.meals.length && !m.meals.some((x) => r.mealTypes.includes(x))) return false;
      if (m.notMeals && m.notMeals.some((x) => r.mealTypes.includes(x))) return false;
      if (m.diets && m.diets.some((d) => !r.diets.includes(d))) return false;
      if (m.labels && m.labels.some((l) => !r.labels.includes(l))) return false;
      if (m.tags && m.tags.some((t) => !r.tags.includes(t))) return false;
      if (m.anyTags && !m.anyTags.some((t) => r.tags.includes(t))) return false;
      if (m.quick && !r.quick) return false;
      if (m.maxTime && r.totalMinutes > m.maxTime) return false;
      if (re && !re.test(r.title)) return false;
      return true;
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export const MIN_COLLECTION = 4;

export function collectionsIndexPage(ctx) {
  const list = ctx.collections;
  const body = html`
<div class="wrap page-head">
  <h1>Collections</h1>
  <p class="page-lede">Hand-made groupings of CookSimple recipes. Every recipe in a collection is a complete recipe; nothing here is filler.</p>
</div>
<div class="wrap collection-grid">
  ${list.map(
    (c) => html`<a class="collection-tile" href="/collections/${c.slug}/">
    <span class="collection-thumbs">${c.recipes.slice(0, 3).map((r) => html`<img src="/images/recipes/${r.id}.svg" width="400" height="300" alt="" loading="lazy" decoding="async">`)}</span>
    <span class="collection-name">${c.title}</span>
    <span class="collection-count">${c.recipes.length} recipes</span>
  </a>`,
  )}
</div>`;
  return layout(ctx, {
    path: '/collections/',
    title: 'Recipe collections',
    description: 'Browse CookSimple recipes by collection: weeknight dinners, 30-minute meals, one-pan dinners, vegetarian mains, baking and more.',
    body,
  });
}

export function collectionPage(ctx, c) {
  const body = html`
<div class="wrap page-head">
  <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/collections/">Collections</a></li><li aria-current="page">${c.title}</li></ol></nav>
  <h1>${c.title}</h1>
  <p class="page-lede">${c.intro} ${c.recipes.length} recipes.</p>
</div>
<section class="wrap" aria-label="Recipes">
  <div class="card-grid">${c.recipes.map((r) => recipeCard(r))}</div>
</section>
<section class="wrap more-collections" aria-labelledby="more-col">
  <h2 id="more-col">More collections</h2>
  <ul class="pill-list">${ctx.collections.filter((o) => o.slug !== c.slug).map((o) => html`<li><a class="pill-link" href="/collections/${o.slug}/">${o.title}</a></li>`)}</ul>
</section>`;
  return layout(ctx, {
    path: `/collections/${c.slug}/`,
    title: c.title,
    description: c.description,
    body,
    jsonld: [
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: c.title,
        itemListElement: c.recipes.map((r, i) => ({ '@type': 'ListItem', position: i + 1, url: `${ctx.site.url}/recipes/${r.id}/` })),
      },
    ],
  });
}

export function savedPage(ctx) {
  const body = html`
<div class="wrap page-head">
  <h1>Saved recipes</h1>
  <p class="page-lede">Recipes you saved with the heart button, and any you have written notes on. Stored in this browser only; saved recipes also work offline.</p>
</div>
<section class="wrap" aria-labelledby="saved-count">
  <h2 id="saved-count" class="results-count" aria-live="polite" data-saved-count>Loading…</h2>
  <div class="card-grid" data-saved></div>
  <div class="empty-state" data-saved-empty hidden>
    <p><strong>Nothing saved yet.</strong> Tap <em>Save</em> on any recipe to keep it here.</p>
    <p><a class="btn" href="/search/">Find a recipe</a></p>
  </div>
</section>
<noscript><div class="wrap"><p class="notice">Saved recipes need JavaScript because they are stored in your browser.</p></div></noscript>`;
  return layout(ctx, {
    path: '/saved/',
    title: 'Saved recipes',
    description: 'Your saved CookSimple recipes, stored only in this browser.',
    body,
    script: 'saved-page.js',
    noindex: true,
  });
}

export function plannerPage(ctx) {
  const body = html`
<div class="wrap page-head">
  <h1>Meal planner</h1>
  <p class="page-lede">Plan the week, then send every ingredient to your shopping list in one go. Saved in this browser only.</p>
</div>
<div class="wrap planner" data-planner>
  <div class="planner-toolbar needs-js">
    <button type="button" class="btn btn-primary" data-action="plan-to-list">Add the week to my shopping list</button>
    <button type="button" class="btn btn-danger" data-action="clear-plan">Clear the week</button>
  </div>
  <div class="planner-days">
    ${DAYS.map(
      (d, i) => html`<section class="plan-day" data-day="${i}" aria-labelledby="day-${i}">
      <h2 id="day-${i}">${d}</h2>
      <ul class="plan-list" data-list></ul>
      <form class="plan-add needs-js" data-add>
        <label class="vh" for="add-${i}">Add a recipe for ${d}</label>
        <input id="add-${i}" list="plan-recipes" placeholder="Add a recipe…" autocomplete="off" maxlength="80">
        <button class="btn" type="submit">Add</button>
      </form>
    </section>`,
    )}
  </div>
  <datalist id="plan-recipes" data-plan-options></datalist>
  <p class="hint">Tip: you can also use the <strong>Plan</strong> button on any recipe page.</p>
</div>
<noscript><div class="wrap"><p class="notice">The meal planner needs JavaScript because it is stored in your browser.</p></div></noscript>`;
  return layout(ctx, {
    path: '/meal-planner/',
    title: 'Meal planner',
    description: 'Plan a week of CookSimple recipes and send all the ingredients to your shopping list. Stored only in your browser.',
    body,
    script: 'planner-page.js',
    noindex: true,
  });
}

export function offlinePage(ctx) {
  const body = html`
<div class="wrap page-head">
  <h1>You’re offline</h1>
  <p class="page-lede">This page hasn’t been saved on this device yet. Recipes you have opened before, and recipes you saved, still work without a connection.</p>
</div>
<section class="wrap" aria-labelledby="cached-h">
  <h2 id="cached-h" class="results-count">Available offline</h2>
  <ul class="offline-list" data-offline-list><li>Checking…</li></ul>
  <p><a href="/shopping-list/">Your shopping list</a> and <a href="/meal-planner/">meal plan</a> also work offline once you have opened them.</p>
</section>`;
  return layout(ctx, {
    path: '/offline/',
    title: 'Offline',
    description: 'You are offline. Recipes you have already opened are still available.',
    body,
    script: 'offline-page.js',
    noindex: true,
  });
}

export { raw };
