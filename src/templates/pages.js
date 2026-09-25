import { html, raw, jsonScript } from './html.js';
import { layout } from './layout.js';
import { recipeCard, cardGrid, adSlot, minutes, servingsText, isoDuration, MEAL_LABELS, DIET_LABELS, TAG_LABELS } from './components.js';
import { ingredientParts, ingredientHTML, ingredientText } from '../lib/ingredient.js';
import { renderStep, formatTemp, clock } from '../lib/tokens.js';

export const LABEL_NAMES = { 'dairy-free': 'Dairy-free', 'egg-free': 'Egg-free', 'gluten-free': 'Gluten-free', 'nut-free': 'Nut-free' };
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SYSTEMS = ['us', 'metric'];

/** Render the same thing in US and metric; one span when they match. */
function dual(fn, cls = '') {
  const us = fn('us');
  const metric = fn('metric');
  if (us === metric) return raw(cls ? `<span class="${cls}">${us}</span>` : us);
  return raw(`<span class="u-us${cls ? ` ${cls}` : ''}">${us}</span><span class="u-metric${cls ? ` ${cls}` : ''}">${metric}</span>`);
}

const dateText = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

// ---------------------------------------------------------------- Home

function pick(recipes, filter, sort, count, seen) {
  const pool = recipes.filter(filter).sort(sort);
  const fresh = pool.filter((r) => !seen.has(r.id));
  const chosen = [...fresh, ...pool.filter((r) => seen.has(r.id))].slice(0, count);
  for (const r of chosen) seen.add(r.id);
  return chosen;
}

export function homePage(ctx) {
  const { site, recipes } = ctx;
  const seen = new Set();
  const byTitle = (a, b) => a.title.localeCompare(b.title);
  const isMain = (r) => r.mealTypes.some((m) => ['breakfast', 'lunch', 'dinner'].includes(m));
  const sections = [
    { id: 'popular', title: 'Popular recipes', note: 'Hand-picked classics. We don’t track visits, so this list is chosen by people, not clicks.', list: pick(recipes, (r) => r.featured, byTitle, 6, seen), more: ['/search/?sort=az', 'Browse all recipes'] },
    { id: 'quick', title: 'Quick meals', note: 'On the table in 30 minutes or less, prep included.', list: pick(recipes, (r) => r.quick && isMain(r), (a, b) => a.totalMinutes - b.totalMinutes || byTitle(a, b), 4, seen), more: ['/search/?quick=1', 'All quick meals'] },
    { id: 'one-pan', title: 'One-pan meals', note: 'One skillet, pot or sheet pan. Less washing up.', list: pick(recipes, (r) => r.tags.includes('one-pan') && isMain(r), byTitle, 4, seen), more: ['/search/?tag=one-pan', 'All one-pan meals'] },
    { id: 'vegetarian', title: 'Vegetarian', note: 'Meat-free meals, labelled only when every ingredient qualifies.', list: pick(recipes, (r) => r.diets.includes('vegetarian') && isMain(r), byTitle, 4, seen), more: ['/search/?diet=vegetarian', 'All vegetarian recipes'] },
    { id: 'desserts', title: 'Desserts', note: 'Cookies, brownies and other sweet things.', list: pick(recipes, (r) => r.mealTypes.includes('dessert'), byTitle, 4, seen), more: ['/search/?meal=dessert', 'All desserts'] },
    { id: 'recent', title: 'Recently added', note: 'The newest recipes in the collection.', list: pick(recipes, () => true, (a, b) => b.added.localeCompare(a.added) || b.order - a.order, 4, seen), more: ['/search/?sort=newest', 'Newest first'] },
  ].filter((s) => s.list.length);

  const body = html`
<section class="hero">
  <div class="wrap">
    <h1 class="hero-title">Recipes without the clutter.</h1>
    <p class="hero-lede">Open a recipe, see what you need, start cooking. No life stories, no pop-ups, no autoplay video.</p>
    <form class="hero-search" action="/search/" method="get" role="search">
      <label for="home-q" class="hero-label">What do you want to cook?</label>
      <div class="search-row">
        <input id="home-q" name="q" type="search" placeholder="Try “chicken”, “pasta” or “30 minutes”" autocomplete="off" maxlength="200" enterkeyhint="search">
        <button class="btn btn-primary" type="submit">Search</button>
      </div>
    </form>
    <ul class="hero-links">
      <li><a class="pill-link" href="/what-can-i-make/">What can I make with what I have?</a></li>
      <li><a class="pill-link" href="/search/?quick=1">Quick meals</a></li>
      <li><a class="pill-link" href="/meal-planner/">Plan the week</a></li>
      <li><a class="pill-link" href="/collections/">Collections</a></li>
    </ul>
  </div>
</section>
${sections.map(
  (s, i) => html`
<section class="home-section" aria-labelledby="sec-${s.id}">
  <div class="wrap">
    <div class="section-head">
      <div>
        <h2 id="sec-${s.id}">${s.title}</h2>
        <p class="section-note">${s.note}</p>
      </div>
      <a class="more-link" href="${s.more[0]}">${s.more[1]} <span aria-hidden="true">→</span></a>
    </div>
    ${raw(`<div class="card-row">${s.list.map((r) => recipeCard(r, { eager: i === 0 })).join('')}</div>`)}
  </div>
</section>
${i === 2 ? adSlot(site, 'home-between-sections') : ''}`,
)}
${ctx.collections.length ? html`<section class="home-section" aria-labelledby="sec-collections">
  <div class="wrap">
    <div class="section-head">
      <div><h2 id="sec-collections">Collections</h2><p class="section-note">Recipes grouped by what you need tonight.</p></div>
      <a class="more-link" href="/collections/">All collections <span aria-hidden="true">→</span></a>
    </div>
    <ul class="pill-list">${ctx.collections.map((c) => html`<li><a class="pill-link" href="/collections/${c.slug}/">${c.title} <span class="muted">${c.recipes.length}</span></a></li>`)}</ul>
  </div>
</section>` : ''}
<section class="home-promise">
  <div class="wrap promise-grid">
    <div><h2>Built for the stove</h2><p>Scale servings, switch to metric, tick off ingredients and follow Cook Mode one step at a time, with timers.</p></div>
    <div><h2>Nothing in the way</h2><p>The recipe starts at the top of the page. No signup walls, no notification requests, no videos that play by themselves.</p></div>
    <div><h2>Your data stays yours</h2><p>No accounts and no tracking. Your shopping list and checklists are saved only in this browser.</p></div>
  </div>
</section>`;

  return layout(ctx, {
    path: '/',
    title: `${site.name}: ${site.tagline}`,
    description: site.description,
    body,
    script: 'home.js',
    jsonld: [
      { '@context': 'https://schema.org', '@type': 'WebSite', name: site.name, url: `${site.url}/`, description: site.description },
      { '@context': 'https://schema.org', '@type': 'Organization', name: site.name, url: `${site.url}/`, logo: `${site.url}/images/icons/icon-512.png` },
    ],
  });
}

// ---------------------------------------------------------------- Recipe

export function clientRecipe(r, site) {
  return {
    id: r.id,
    title: r.title,
    url: `/recipes/${r.id}/`,
    servings: r.servings,
    servingsLabel: r.servingsLabel,
    servingsLabelOne: r.servingsLabelOne,
    scaleOptions: r.scaleOptions,
    ingredients: r.ingredients.map(({ i, id, group, key, item, plural, prep, note, amount, unit, dim, scale, scaleNote, gramsPerCup, size, optional, aisle, pantry, shop, one }) => ({ i, id, group, key, item, plural, prep, note, amount, unit, dim, scale, scaleNote, gramsPerCup, size, optional, aisle, pantry, shop, one })),
    steps: r.steps.map((s) => ({ text: s.text, uses: s.uses })),
  };
}

function ingredientItem(ing) {
  const line = dual((sys) => ingredientHTML(ingredientParts(ing, 1, sys)), 'ing-line');
  return html`<li class="ing" data-i="${ing.i}"><label><input type="checkbox" class="ing-box" data-i="${ing.i}"><span class="ing-text">${line}</span></label></li>`;
}

function ingredientsBlock(r) {
  const groups = [];
  for (const ing of r.ingredients) {
    let g = groups[groups.length - 1];
    if (!g || g.title !== ing.group) {
      g = { title: ing.group, items: [] };
      groups.push(g);
    }
    g.items.push(ing);
  }
  return groups.map(
    (g) => html`${g.title ? html`<h3 class="ing-group">${g.title}</h3>` : ''}<ul class="ing-list">${g.items.map(ingredientItem)}</ul>`,
  );
}

function timerButtons(step, i) {
  if (!step.timers.length) return '';
  return html`<div class="step-timers needs-js">${step.timers.map(
    (t, j) => html`<button type="button" class="timer-btn" data-step="${i}" data-t="${j}" data-seconds="${t.seconds}" data-label="Step ${i + 1}: ${t.label}"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 9v4l2.5 2.5M9 2h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>Start ${clock(t.seconds)} timer</span></button>`,
  )}</div>`;
}

function related(recipes, r) {
  const score = (o) => (o.mealTypes.some((m) => r.mealTypes.includes(m)) ? 3 : 0) + (o.cuisine === r.cuisine ? 1 : 0) + (o.diets.some((d) => r.diets.includes(d)) ? 1 : 0) + (o.tags.some((t) => r.tags.includes(t)) ? 1 : 0);
  return recipes
    .filter((o) => o.id !== r.id)
    .map((o) => ({ o, s: score(o) }))
    .sort((a, b) => b.s - a.s || a.o.title.localeCompare(b.o.title))
    .slice(0, 3)
    .map((x) => x.o);
}

export function recipeJsonLd(r, site, photo) {
  const url = `${site.url}/recipes/${r.id}/`;
  const img = (v) => `${site.url}/images/recipes/${r.id}-${v}.png`;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    '@id': `${url}#recipe`,
    name: r.title,
    description: r.description,
    image: [...(photo ? [`${site.url}/images/photos/${r.id}.jpg`] : []), img('1x1'), img('4x3'), img('16x9')],
    author: { '@type': 'Organization', name: site.name, url: `${site.url}/` },
    publisher: { '@type': 'Organization', name: site.name, url: `${site.url}/` },
    datePublished: r.added,
    url,
    prepTime: isoDuration(r.prepMinutes),
    cookTime: isoDuration(r.cookMinutes),
    totalTime: isoDuration(r.totalMinutes),
    recipeYield: [String(r.servings), servingsText(r)],
    recipeCategory: MEAL_LABELS[r.mealTypes[0]],
    recipeCuisine: r.cuisine,
    keywords: [...r.mealTypes.map((m) => MEAL_LABELS[m].toLowerCase()), ...r.tags, ...(r.quick ? ['quick'] : []), ...r.diets].join(', '),
    recipeIngredient: r.ingredients.map((ing) => ingredientText(ingredientParts(ing, 1, 'us'))),
    recipeInstructions: r.steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, text: renderStep(s.text, { mode: 'text', system: 'us', both: true }), url: `${url}#step-${i + 1}` })),
  };
  if (r.equipment.length) data.tool = r.equipment.map((e) => ({ '@type': 'HowToTool', name: renderStep(e, { mode: 'text', system: 'us' }) }));
  const diets = { vegetarian: 'https://schema.org/VegetarianDiet', vegan: 'https://schema.org/VeganDiet' };
  if (r.diets.length) data.suitableForDiet = r.diets.map((d) => diets[d]);
  if (r.source.type === 'licensed') {
    data.isBasedOn = { '@type': 'CreativeWork', name: r.source.title, author: r.source.author, url: r.source.url, license: r.source.licenseUrl };
  }
  return data;
}

export function recipePage(ctx, r) {
  const { site, recipes } = ctx;
  const meal = r.mealTypes[0];
  const url = `${site.url}/recipes/${r.id}/`;
  const labelIsServings = r.servingsLabel === 'servings';
  const fixedIngs = r.ingredients.filter((i) => i.scale === 'fixed');

  const facts = html`<dl class="facts">
    <div><dt>${labelIsServings ? 'Servings' : 'Makes'}</dt><dd data-servings-fact>${labelIsServings ? r.servings : servingsText(r)}</dd></div>
    ${r.prepMinutes ? html`<div><dt>Prep</dt><dd>${minutes(r.prepMinutes)}</dd></div>` : ''}
    ${r.cookMinutes ? html`<div><dt>Cook</dt><dd>${minutes(r.cookMinutes)}</dd></div>` : ''}
    <div><dt>Total</dt><dd>${minutes(r.totalMinutes)}</dd></div>
    ${r.ovenTemps.length ? html`<div><dt>Oven</dt><dd>${dual((sys) => r.ovenTemps.map((t) => formatTemp(t, sys)).join(', '))}</dd></div>` : ''}
  </dl>`;

  const tagLinks = [
    ...r.mealTypes.map((m) => [`/search/?meal=${m}`, MEAL_LABELS[m]]),
    ...(r.quick ? [['/search/?quick=1', 'Quick']] : []),
    ...(r.diets.includes('vegan') ? [['/search/?diet=vegan', 'Vegan']] : r.diets.includes('vegetarian') ? [['/search/?diet=vegetarian', 'Vegetarian']] : []),
    ...r.tags.map((t) => [`/search/?tag=${t}`, TAG_LABELS[t]]),
    ...r.labels.filter((l) => !(r.diets.includes('vegan') && (l === 'dairy-free' || l === 'egg-free'))).map((l) => [`/search/?label=${l}`, LABEL_NAMES[l]]),
    [`/search/?cuisine=${encodeURIComponent(r.cuisine)}`, r.cuisine],
  ];
  const photo = ctx.photos[r.id];

  const body = html`
<article class="recipe" data-recipe-id="${r.id}">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/search/?meal=${meal}">${MEAL_LABELS[meal]}</a></li><li aria-current="page">${r.title}</li></ol></nav>
    <header class="recipe-head">
      <div class="recipe-head-text">
        <h1>${r.title}</h1>
        <p class="recipe-desc">${r.description}</p>
        ${facts}
        <ul class="tag-links" aria-label="Recipe tags">${tagLinks.map(([href, label]) => html`<li><a href="${href}">${label}</a></li>`)}</ul>
        ${r.labelChecks.length ? html`<p class="label-check"><strong>${r.diets.includes('vegan') ? 'Vegan' : 'Vegetarian'} tip:</strong> check the labels on ${r.labelChecks.map((c, i) => html`${i ? (i === r.labelChecks.length - 1 ? ' and ' : ', ') : ''}${c.item} (${c.note})`)}.</p>` : ''}
      </div>
      ${photo
        ? html`<figure class="recipe-img has-photo"><img src="/images/photos/${r.id}.jpg" width="${photo.width}" height="${photo.height}" alt="Photo: ${photo.alt}" decoding="async" fetchpriority="high"><figcaption>Photo of ${photo.alt.toLowerCase()} (not this exact recipe) by ${photo.author}, <a href="${photo.sourceUrl}" rel="noopener">Wikimedia Commons</a>, <a href="${photo.licenseUrl}" rel="license noopener">${photo.license}</a></figcaption></figure>`
        : html`<figure class="recipe-img"><img src="/images/recipes/${r.id}.svg" width="400" height="300" alt="${r.image.alt}" decoding="async" fetchpriority="high"></figure>`}
    </header>

    <div class="recipe-actions needs-js">
      <button type="button" class="btn btn-primary btn-cook" data-action="cook"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>Start Cook Mode</button>
      <button type="button" class="btn" data-action="shop" aria-label="Add ingredients to your shopping list"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg><span data-shop-label>Add to list</span></button>
      <button type="button" class="btn" data-action="print"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>Print</button>
      <button type="button" class="btn" data-action="save" aria-pressed="false"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path class="heart" d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg><span data-save-label>Save</span></button>
      <button type="button" class="btn" data-action="plan" aria-expanded="false" aria-controls="plan-panel"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M4 6h16v14H4zM4 10h16M8 3v5M16 3v5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>Plan</button>
      <button type="button" class="btn" data-action="share"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M12 3v12M7 8l5-5 5 5M5 14v6h14v-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Share</button>
    </div>
    <form class="plan-panel needs-js" id="plan-panel" data-plan-form hidden>
      <label>Day <select name="day">${DAYS.map((d, i) => html`<option value="${i}">${d}</option>`)}</select></label>
      <label>${labelIsServings ? 'Servings' : r.servingsLabel[0].toUpperCase() + r.servingsLabel.slice(1)} <input name="servings" type="number" inputmode="numeric" min="1" max="${Math.max(100, r.servings * 10)}" value="${r.servings}" required></label>
      <button class="btn btn-primary" type="submit">Add to meal plan</button>
      <a href="/meal-planner/">Open meal planner</a>
    </form>

    <div class="recipe-body">
      <section class="ingredients" aria-labelledby="h-ingredients">
        <div class="block-head">
          <h2 id="h-ingredients">Ingredients</h2>
          <button type="button" class="link-btn needs-js" data-action="clear-checks" hidden>Uncheck all</button>
        </div>
        <div class="controls needs-js">
          <fieldset class="seg servings-ctl">
            <legend>${labelIsServings ? 'Servings' : r.servingsLabel[0].toUpperCase() + r.servingsLabel.slice(1)}</legend>
            <div class="seg-row">
              ${r.scaleOptions.map((n) => html`<input type="radio" name="servings" id="srv-${n}" value="${n}"${n === r.servings ? raw(' checked') : ''}><label for="srv-${n}"${n === r.servings ? raw(' class="is-base" title="Original recipe"') : ''}>${n}</label>`)}
              <label class="srv-custom"><span class="vh">Other amount</span><input type="number" inputmode="numeric" min="1" max="${Math.max(100, r.servings * 10)}" step="1" placeholder="Other" data-custom-servings></label>
            </div>
          </fieldset>
          <fieldset class="seg units-ctl">
            <legend>Units</legend>
            <div class="seg-row">
              <input type="radio" name="units" id="units-us" value="us" checked><label for="units-us">US</label>
              <input type="radio" name="units" id="units-metric" value="metric"><label for="units-metric">Metric</label>
            </div>
          </fieldset>
        </div>
        <div class="scale-status" data-scale-status hidden>
          <p data-scale-text></p>
          ${r.scaleNote ? html`<p class="scale-note">${renderStep(r.scaleNote, { mode: 'text' }) === r.scaleNote ? r.scaleNote : dual((sys) => renderStep(r.scaleNote, { system: sys }))}</p>` : ''}
          ${fixedIngs.length ? html`<ul class="fixed-notes">${fixedIngs.map((i) => html`<li><strong>${i.item}</strong> stays the same: ${i.scaleNote}</li>`)}</ul>` : ''}
          <button type="button" class="link-btn" data-action="reset-servings">Back to ${servingsText(r)}</button>
        </div>
        ${ingredientsBlock(r)}
        ${r.equipment.length ? html`<div class="equipment"><h3>Equipment</h3><ul>${r.equipment.map((e) => html`<li>${dual((sys) => renderStep(e, { system: sys }))}</li>`)}</ul></div>` : ''}
      </section>

      <section class="instructions" aria-labelledby="h-steps">
        <h2 id="h-steps">Instructions</h2>
        <ol class="steps">
          ${r.steps.map(
            (s, i) => html`<li class="step" id="step-${i + 1}"><p class="step-text" data-step-text="${i}">${dual((sys) => renderStep(s.text, { system: sys }))}</p>${timerButtons(s, i)}</li>`,
          )}
        </ol>
        ${r.notes.length ? html`<section class="notes" aria-labelledby="h-notes"><h2 id="h-notes">Notes</h2><ul>${r.notes.map((n, i) => html`<li data-note="${i}">${dual((sys) => renderStep(n, { system: sys }))}</li>`)}</ul></section>` : ''}
        <section class="my-notes needs-js" aria-labelledby="h-my-notes">
          <h2 id="h-my-notes">My notes</h2>
          <label for="my-notes" class="vh">Your notes for this recipe</label>
          <textarea id="my-notes" rows="3" maxlength="2000" placeholder="Add your own notes, e.g. “used half the chili flakes”"></textarea>
          <p class="hint" data-notes-status>Saved in this browser only.</p>
          <div class="print-only my-notes-print" data-notes-print></div>
        </section>
        ${r.nutrition && r.nutrition.kcal != null ? html`<section class="nutrition" aria-labelledby="h-nutrition">
          <h2 id="h-nutrition">Nutrition estimate</h2>
          <dl class="nutri">
            <div><dt>Calories</dt><dd>${r.nutrition.kcal}</dd></div>
            <div><dt>Protein</dt><dd>${r.nutrition.protein} g</dd></div>
            <div><dt>Carbs</dt><dd>${r.nutrition.carbs} g</dd></div>
            <div><dt>Fat</dt><dd>${r.nutrition.fat} g</dd></div>
          </dl>
          <p class="hint">Per ${labelIsServings ? 'serving' : r.servingsLabelOne}, estimated from USDA FoodData Central values for the listed amounts. Optional ingredients and to-taste seasoning are not included, and actual values vary by brand. <a href="/about/#nutrition">How we estimate</a></p>
        </section>` : ''}
      </section>
    </div>

    <footer class="recipe-foot">
      <p class="source-line">${
        r.source.type === 'licensed'
          ? html`Adapted from <a href="${r.source.url}" rel="noopener">${r.source.title}</a> by ${r.source.author}, used under <a href="${r.source.licenseUrl}" rel="license noopener">${r.source.license}</a>.`
          : html`An original recipe written for ${site.name}.`
      } Illustration: ${r.image.credit || `original artwork for ${site.name}`}. Added ${dateText(r.added)}.</p>
      <p class="print-only print-url">${url}</p>
    </footer>
  </div>
</article>
${adSlot(site, 'below-recipe')}
<section class="related" aria-labelledby="h-related">
  <div class="wrap">
    <h2 id="h-related">More to cook</h2>
    ${raw(`<div class="card-row">${related(recipes, r).map((o) => recipeCard(o)).join('')}</div>`)}
  </div>
</section>
<script type="application/json" id="recipe-data">${jsonScript(clientRecipe(r, site))}</script>`;

  return layout(ctx, {
    path: `/recipes/${r.id}/`,
    title: r.title,
    description: r.description,
    image: `${site.url}/images/recipes/${r.id}-16x9.png`,
    imageAlt: r.image.alt,
    ogType: 'article',
    body,
    script: 'recipe-page.js',
    bodyClass: 'page-recipe',
    jsonld: [
      recipeJsonLd(r, site, ctx.photos[r.id]),
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${site.url}/` },
          { '@type': 'ListItem', position: 2, name: MEAL_LABELS[meal], item: `${site.url}/search/?meal=${meal}` },
          { '@type': 'ListItem', position: 3, name: r.title, item: url },
        ],
      },
    ],
  });
}

// ---------------------------------------------------------------- Search

export function searchEntry(r, vocab) {
  const searchIngredients = new Set();
  for (const ing of r.ingredients) {
    const v = vocab[ing.key] || {};
    for (const s of [ing.key, ing.item, ...(v.family || []), ...(v.syn || [])]) searchIngredients.add(s);
  }
  const ingredients = [];
  for (const ing of r.ingredients) {
    const existing = ingredients.find((x) => x.key === ing.key);
    if (existing) {
      if (!ing.optional) existing.optional = false;
      continue;
    }
    ingredients.push({ key: ing.key, name: ing.item, optional: ing.optional, pantry: ing.pantry });
  }
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    totalMinutes: r.totalMinutes,
    servings: r.servings,
    servingsLabel: r.servingsLabel,
    servingsLabelOne: r.servingsLabelOne,
    cuisine: r.cuisine,
    mealTypes: r.mealTypes,
    diets: r.diets,
    tags: r.tags,
    labels: r.labels,
    quick: r.quick,
    added: r.added,
    featured: r.featured,
    order: r.order,
    searchIngredients: [...searchIngredients],
    ingredients,
  };
}

export function searchPage(ctx) {
  const { site, recipes } = ctx;
  const cuisines = [...new Set(recipes.map((r) => r.cuisine))].sort();
  const sorted = [...recipes].sort((a, b) => Number(b.featured) - Number(a.featured) || a.title.localeCompare(b.title));
  const chip = (name, value, label) => html`<input type="checkbox" name="${name}" value="${value}" id="f-${name}-${value}"><label for="f-${name}-${value}">${label}</label>`;
  const body = html`
<div class="wrap page-head">
  <h1>Find a recipe</h1>
  <p class="page-lede">Search by name, ingredient, cuisine, meal or time, like “chicken rice” or “vegan 30 minutes”.</p>
</div>
<form class="wrap search-form" action="/search/" method="get" role="search" data-search-form>
  <div class="search-row">
    <label for="q" class="vh">Search recipes</label>
    <input id="q" name="q" type="search" placeholder="Search recipes" autocomplete="off" maxlength="200" enterkeyhint="search">
    <button class="btn btn-primary" type="submit">Search</button>
  </div>
  <div class="filters needs-js">
    <fieldset class="chip-set"><legend>Meal</legend><div class="chips">${chip('meal', 'breakfast', 'Breakfast')}${chip('meal', 'lunch', 'Lunch')}${chip('meal', 'dinner', 'Dinner')}${chip('meal', 'dessert', 'Dessert')}${chip('meal', 'side', 'Sides')}${chip('meal', 'snack', 'Snacks')}</div></fieldset>
    <fieldset class="chip-set"><legend>Diet and style</legend><div class="chips">${chip('diet', 'vegetarian', 'Vegetarian')}${chip('diet', 'vegan', 'Vegan')}<input type="checkbox" name="quick" value="1" id="f-quick"><label for="f-quick">Quick (30 min or less)</label>${chip('tag', 'one-pan', 'One-pan')}${chip('tag', 'make-ahead', 'Make-ahead')}${chip('tag', 'freezer-friendly', 'Freezer-friendly')}</div></fieldset>
    <fieldset class="chip-set"><legend>Free from</legend><div class="chips">${Object.entries(LABEL_NAMES).map(([k, v]) => chip('label', k, v))}</div><p class="hint">Based on the ingredients listed; always check packaged foods if you have an allergy.</p></fieldset>
    <div class="select-row">
      <label>Max time <select name="time"><option value="">Any</option><option value="15">15 min</option><option value="30">30 min</option><option value="45">45 min</option><option value="60">1 hour</option><option value="90">1½ hours</option></select></label>
      <label>Cuisine <select name="cuisine"><option value="">Any</option>${cuisines.map((c) => html`<option value="${c}">${c}</option>`)}</select></label>
      <label>Sort <select name="sort"><option value="">Best match</option><option value="quickest">Quickest</option><option value="newest">Newest</option><option value="az">A–Z</option></select></label>
      <button type="button" class="link-btn" data-action="reset-filters" hidden>Clear all</button>
    </div>
  </div>
</form>
<section class="wrap results" aria-labelledby="results-count">
  <h2 id="results-count" class="results-count" aria-live="polite" aria-atomic="true">${recipes.length} recipes</h2>
  <p class="results-note" data-results-note hidden></p>
  <div class="card-grid" data-results>${sorted.map((r) => recipeCard(r))}</div>
  <div class="empty-state" data-empty hidden>
    <p><strong>No recipes match that yet.</strong> Try fewer words, remove a filter, or <a href="/what-can-i-make/">search by the ingredients you have</a>.</p>
  </div>
</section>
`;
  return layout(ctx, {
    path: '/search/',
    title: 'Search recipes',
    description: `Search ${recipes.length} clutter-free recipes by name, ingredient, cuisine, meal type or cooking time. Filter for vegetarian, vegan and quick meals.`,
    body,
    script: 'search-page.js',
  });
}

// ---------------------------------------------------------------- What can I make?

export function discoverPage(ctx) {
  const { recipes, vocab } = ctx;
  const usedKeys = new Set(recipes.flatMap((r) => r.ingredients.map((i) => i.key)));
  const staples = [...usedKeys].filter((k) => vocab[k].pantry && vocab[k].shop !== false).sort();
  const tryList = ['chicken', 'rice', 'eggs', 'pasta', 'onion', 'garlic', 'tomatoes', 'black beans', 'chickpeas', 'potatoes', 'spinach', 'lemon'];
  const body = html`
<div class="wrap page-head">
  <h1>What can I make?</h1>
  <p class="page-lede">Type the ingredients you have. CookSimple looks through its own recipes and shows the ones that use them, with anything you would still need. It finds existing recipes; it doesn’t invent new ones.</p>
</div>
<form class="wrap discover-form" action="/what-can-i-make/" method="get" data-discover-form>
  <label for="have" class="field-label">Ingredients you have</label>
  <div class="have-box">
    <ul class="have-chips" data-chips aria-label="Your ingredients"></ul>
    <input id="have" name="have" list="ingredient-suggestions" placeholder="e.g. chicken, rice, onion, garlic" autocomplete="off" maxlength="300" enterkeyhint="done" aria-describedby="have-hint">
  </div>
  <datalist id="ingredient-suggestions" data-suggestions></datalist>
  <p class="hint" id="have-hint">Separate ingredients with commas or press Enter after each one.</p>
  <label class="check-row"><input type="checkbox" name="pantry" value="1" checked data-pantry> I have the basics: ${staples.join(', ')}</label>
  <div class="form-actions">
    <button class="btn btn-primary" type="submit">Find recipes</button>
    <button class="btn" type="button" data-action="clear" hidden>Clear</button>
  </div>
  <div class="try-row needs-js"><span>Try:</span> ${tryList.map((t) => html`<button type="button" class="pill-btn" data-add="${t}">${t}</button>`)}</div>
</form>
<section class="wrap discover-results" aria-labelledby="discover-count">
  <h2 id="discover-count" class="results-count" aria-live="polite" aria-atomic="true" data-discover-count hidden></h2>
  <p class="results-note" data-unmatched hidden></p>
  <div class="card-grid" data-discover-results></div>
</section>
<noscript><div class="wrap"><p class="notice">This tool needs JavaScript. You can still <a href="/search/">search all recipes</a>.</p></div></noscript>
`;
  return layout(ctx, {
    path: '/what-can-i-make/',
    title: 'What can I make with what I have?',
    description: 'Enter the ingredients in your kitchen and find CookSimple recipes that use them, with a clear list of anything you still need.',
    body,
    script: 'discover-page.js',
  });
}

// ---------------------------------------------------------------- Shopping list

export function shoppingPage(ctx) {
  const body = html`
<div class="wrap page-head">
  <h1>Shopping list</h1>
  <p class="page-lede">Saved in this browser only. Nothing is sent anywhere, and there is no account.</p>
</div>
<div class="wrap shop" data-shop>
  <div class="shop-toolbar needs-js">
    <fieldset class="seg units-ctl">
      <legend>Units</legend>
      <div class="seg-row">
        <input type="radio" name="units" id="units-us" value="us" checked><label for="units-us">US</label>
        <input type="radio" name="units" id="units-metric" value="metric"><label for="units-metric">Metric</label>
      </div>
    </fieldset>
    <div class="shop-buttons">
      <button type="button" class="btn" data-action="copy">Copy list</button>
      <button type="button" class="btn" data-action="print">Print</button>
      <button type="button" class="btn" data-action="clear-checked">Remove checked</button>
      <button type="button" class="btn btn-danger" data-action="clear-all">Clear list</button>
    </div>
  </div>
  <form class="add-item needs-js" data-add-item>
    <label for="new-item" class="field-label">Add your own item</label>
    <div class="search-row">
      <input id="new-item" maxlength="120" placeholder="e.g. paper towels" autocomplete="off" enterkeyhint="done">
      <button class="btn" type="submit">Add</button>
    </div>
  </form>
  <div class="shop-recipes" data-shop-recipes></div>
  <div class="shop-groups" data-shop-groups></div>
  <div class="empty-state" data-shop-empty>
    <p><strong>Your list is empty.</strong> Open any recipe and choose “Add to shopping list”. Ingredients from several recipes are combined, and you can tick things off as you shop.</p>
    <p><a class="btn" href="/search/">Find a recipe</a></p>
  </div>
</div>
<noscript><div class="wrap"><p class="notice">The shopping list needs JavaScript because it is stored in your browser.</p></div></noscript>`;
  return layout(ctx, {
    path: '/shopping-list/',
    title: 'Shopping list',
    description: 'Your CookSimple shopping list, combined from the recipes you picked and saved only in this browser.',
    body,
    script: 'shopping-page.js',
    noindex: true,
    bodyClass: 'page-shopping',
  });
}

// ---------------------------------------------------------------- All recipes

export function allRecipesPage(ctx) {
  const { recipes } = ctx;
  const order = ['breakfast', 'lunch', 'dinner', 'side', 'dessert', 'snack'];
  const groups = order
    .map((m) => ({ m, list: recipes.filter((r) => r.mealTypes[0] === m).sort((a, b) => a.title.localeCompare(b.title)) }))
    .filter((g) => g.list.length);
  const body = html`
<div class="wrap page-head">
  <h1>All recipes</h1>
  <p class="page-lede">${recipes.length} recipes, each one complete and tested against the same checklist. Prefer to filter? <a href="/search/">Search recipes</a>.</p>
</div>
${groups.map(
  (g) => html`<section class="wrap list-section" aria-labelledby="all-${g.m}"><h2 id="all-${g.m}">${MEAL_LABELS[g.m]}</h2>${cardGrid(g.list)}</section>`,
)}`;
  return layout(ctx, {
    path: '/recipes/',
    title: 'All recipes',
    description: `Every CookSimple recipe in one place: ${recipes.length} clutter-free recipes for breakfast, lunch, dinner and dessert.`,
    body,
  });
}

// ---------------------------------------------------------------- About

export function aboutPage(ctx) {
  const { site, recipes } = ctx;
  const body = html`
<div class="wrap prose">
  <h1>About CookSimple</h1>
  <p class="page-lede">${site.name} is a recipe site built around one idea: open a recipe, immediately see what you need, and cook it.</p>

  <h2 id="how">How it works</h2>
  <ul>
    <li>Every recipe starts at the top of the page: title, times, ingredients, then the method. No introduction to scroll past.</li>
    <li><strong>Serving scaler.</strong> Pick a number of servings and every amount updates, including quantities mentioned in the steps.</li>
    <li><strong>US and metric.</strong> Switch units at any time. Your choice is remembered in this browser.</li>
    <li><strong>Cook Mode</strong> shows one step at a time in large type, keeps your screen awake where the browser allows it, and has built-in timers.</li>
    <li><strong>Checklists, shopping lists, saved recipes, notes and your meal plan</strong> are saved in your browser, never on a server.</li>
  </ul>

  <h2 id="sources">Where the recipes come from</h2>
  <p>All ${recipes.length} recipes are original, written for ${site.name}. We do not copy recipes, photos or text from other websites or books. If we ever publish a recipe from another source, it will be one we have permission to use or one with an open licence, and the recipe page will credit it. The illustrations are original artwork made for this site.</p>
  <p>Diet labels (vegetarian, vegan) are only applied when every ingredient in the recipe qualifies, and they are checked automatically. We don’t make health or nutrition claims.</p>

  <h2 id="scaling">How scaling works</h2>
  <p>Amounts are multiplied by the ratio between the servings you choose and the servings the recipe was written for. Results are rounded to measures you can actually use: teaspoons in eighths, tablespoons in halves, and cups in quarters and thirds. When a scaled amount falls between those, it is written as a combination such as “¼ cup + 2 tbsp”.</p>
  <ul>
    <li>Eggs and other things you can’t split are rounded to whole numbers, and the recipe shows what they were rounded from.</li>
    <li>A few amounts don’t change with batch size, such as the water for boiling pasta. They are marked “not scaled” and the recipe explains why.</li>
    <li>Cooking times and temperatures are not scaled. A much larger batch may need a bigger pan or more time; recipes say so where it matters.</li>
  </ul>

  <h2 id="conversions">How conversions work</h2>
  <p>Conversions use the exact definitions: 1 US cup = 236.59 mL, 1 tablespoon = 14.79 mL, 1 teaspoon = 4.93 mL, 1 ounce = 28.35 g and 1 pound = 453.59 g. Metric amounts are rounded to the nearest millilitre or gram.</p>
  <ul>
    <li><strong>Volume and weight are different things.</strong> A cup is a volume; an ounce (oz) is a weight; a fluid ounce (fl oz) is a volume. We only turn a cup into grams for ingredients that are commonly weighed and have a stated weight per cup, such as flour (125 g per cup), sugar and butter. Everything else stays in millilitres, because a cup of chopped onion and a cup of honey weigh very different amounts.</li>
    <li>Teaspoons and tablespoons stay as spoons in metric mode, with millilitres alongside, because metric kitchens use measuring spoons too.</li>
    <li>Oven temperatures are converted and rounded to the nearest 5°C (425°F becomes 220°C). Doneness temperatures, such as 165°F for chicken, are rounded to the nearest degree (74°C).</li>
    <li>Lengths and pan sizes are converted to centimetres.</li>
  </ul>

  <h2 id="labels">Free-from labels</h2>
  <p>Dairy-free, egg-free, gluten-free and nut-free labels are worked out automatically from the ingredient list. A recipe only gets a label when none of its ingredients, including optional ones, contain that ingredient or commonly do depending on the brand (for example, some broths contain wheat and some plant milks are made from nuts). These labels are a guide, not a guarantee: if you have an allergy or coeliac disease, always check the labels of packaged ingredients.</p>

  <h2 id="nutrition">Nutrition estimates</h2>
  <p>Nutrition figures are estimates per serving, calculated from USDA FoodData Central values for each ingredient at the amounts listed. They leave out optional ingredients, to-taste seasoning and things you don’t eat all of (such as oil for greasing a pan or water for boiling pasta). Real values depend on brands, portion sizes and how much fat renders away, so treat them as a rough guide. If an ingredient has no reliable data, the recipe shows no estimate rather than a guess.</p>

  <h2 id="offline">Offline use</h2>
  <p>Once you have opened a recipe, it keeps working without an internet connection on the same device. Saved recipes are stored for offline use automatically. The shopping list, meal plan, checklists and timers all work offline.</p>

  <h2 id="photos">Photos</h2>
  <p>Some recipes show a photo of the dish alongside our illustration. The photos come from Wikimedia Commons under free licences and are credited on each page; they show the dish in general, not the exact recipe on the page.</p>

  <h2 id="privacy">Privacy</h2>
  <p>There are no accounts, no analytics, no tracking pixels, no advertising networks and no cookies. Your unit choice, ingredient checklists, timers and shopping list are stored with your browser’s local storage on your device. They are never sent to us or anyone else. Clearing your browser data removes them.</p>

  <h2 id="ads">Advertising</h2>
  <p>${site.name} has no ads today. If ads are ever added, they will stay out of the way: never covering or interrupting ingredients or instructions, never in Cook Mode, no autoplay video, no pop-ups and nothing designed to be clicked by mistake.</p>

  <h2 id="source-code">Source code</h2>
  <p>${site.name} is a small static website. The code is on <a href="${site.repo}">GitHub</a>.</p>
</div>`;
  return layout(ctx, {
    path: '/about/',
    title: 'About, privacy and how conversions work',
    description: 'How CookSimple works: original recipes, exact US and metric conversions, honest scaling, and no accounts, tracking or pop-ups.',
    body,
  });
}

// ---------------------------------------------------------------- 404

export function notFoundPage(ctx) {
  const body = html`
<div class="wrap page-head not-found">
  <h1>That page isn’t here</h1>
  <p class="page-lede">The link may be old or mistyped. Try a search instead.</p>
  <form class="search-row" action="/search/" method="get" role="search">
    <label for="nf-q" class="vh">Search recipes</label>
    <input id="nf-q" name="q" type="search" placeholder="Search recipes" maxlength="200">
    <button class="btn btn-primary" type="submit">Search</button>
  </form>
  <p><a href="/">Go to the home page</a> or <a href="/recipes/">see all recipes</a>.</p>
</div>`;
  return layout(ctx, {
    path: '/404.html',
    title: 'Page not found',
    description: 'This page could not be found on CookSimple.',
    body,
    noindex: true,
  });
}
