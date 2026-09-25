import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { build } from '../scripts/build.mjs';
import { loadAll, ROOT } from '../scripts/lib/recipes.mjs';

const out = mkdtempSync(join(tmpdir(), 'cooksimple-test-'));
const summary = build(out);
const { recipes } = loadAll();
const site = JSON.parse(readFileSync(join(ROOT, 'site.config.json'), 'utf8'));
const read = (p) => readFileSync(join(out, p), 'utf8');
const ldBlocks = (h) => [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));

test.after(() => rmSync(out, { recursive: true, force: true }));

test('builds every page', () => {
  assert.equal(summary.recipes, recipes.length);
  for (const p of ['index.html', 'search/index.html', 'what-can-i-make/index.html', 'shopping-list/index.html', 'recipes/index.html', 'about/index.html', '404.html', 'sitemap.xml', 'robots.txt', '_headers', 'manifest.webmanifest', 'favicon.svg']) {
    assert.ok(existsSync(join(out, p)), p);
  }
});

test('every recipe page is complete, unique and indexable', () => {
  const titles = new Set();
  for (const r of recipes) {
    const h = read(`recipes/${r.id}/index.html`);
    const title = h.match(/<title>(.*?)<\/title>/)[1];
    assert.ok(!titles.has(title), `duplicate title ${title}`);
    titles.add(title);
    assert.match(h, new RegExp(`<link rel="canonical" href="${site.url}/recipes/${r.id}/">`));
    assert.match(h, /<meta name="description" content="[^"]{50,}">/);
    assert.match(h, /<meta property="og:image" content="https:[^"]+\.png">/);
    assert.equal((h.match(/<h1[ >]/g) || []).length, 1);
    assert.ok(!h.includes('name="robots" content="noindex"'));
    const recipe = ldBlocks(h).find((d) => d['@type'] === 'Recipe');
    assert.ok(recipe, `${r.id}: Recipe JSON-LD`);
    for (const f of ['name', 'image', 'description', 'recipeIngredient', 'recipeInstructions', 'prepTime', 'cookTime', 'totalTime', 'recipeYield', 'author', 'datePublished', 'recipeCuisine', 'recipeCategory']) assert.ok(recipe[f], `${r.id}: ${f}`);
    assert.match(recipe.totalTime, /^PT(\d+H)?(\d+M)?$/);
    assert.equal(recipe.recipeIngredient.length, r.ingredients.length);
    assert.equal(recipe.recipeInstructions.length, r.steps.length);
    for (const s of recipe.recipeInstructions) assert.ok(!/[{}]/.test(s.text), 'tokens rendered');
    for (const img of recipe.image) assert.ok(existsSync(join(out, new URL(img).pathname)), img);
    assert.ok(ldBlocks(h).some((d) => d['@type'] === 'BreadcrumbList'));
    // No leftover tokens anywhere in the visible page.
    assert.ok(!/\{(temp|time|qty|len|count) /.test(h.replace(/<script[\s\S]*?<\/script>/g, '')), `${r.id}: raw token in HTML`);
  }
});

test('internal links resolve', () => {
  const pages = [];
  const walk = (d) => {
    for (const f of readdirSync(d, { withFileTypes: true })) {
      if (f.isDirectory()) walk(join(d, f.name));
      else if (f.name.endsWith('.html')) pages.push(join(d, f.name));
    }
  };
  walk(out);
  const missing = new Set();
  for (const p of pages) {
    for (const [, href] of readFileSync(p, 'utf8').matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
      const target = href.endsWith('/') ? join(out, href, 'index.html') : join(out, href);
      if (!existsSync(target)) missing.add(href);
    }
  }
  assert.deepEqual([...missing], []);
});

test('sitemap, robots and headers', () => {
  const sitemap = read('sitemap.xml');
  for (const r of recipes) assert.ok(sitemap.includes(`${site.url}/recipes/${r.id}/`));
  assert.ok(!sitemap.includes('shopping-list'));
  assert.match(read('robots.txt'), /Sitemap: https:\/\/.+\/sitemap\.xml/);
  const headers = read('_headers');
  assert.match(headers, /script-src 'self' 'sha256-[A-Za-z0-9+/=]+'/);
  assert.ok(read('shopping-list/index.html').includes('name="robots" content="noindex"'));
});

test('no ads, trackers, third-party scripts or autoplay media', () => {
  for (const p of ['index.html', `recipes/${recipes[0].id}/index.html`, 'search/index.html']) {
    const h = read(p);
    assert.ok(!/<script[^>]+src="https?:/i.test(h));
    assert.ok(!/<(video|audio|iframe)/i.test(h));
    assert.ok(!/google-analytics|gtag|googletagmanager|doubleclick|facebook\.net/i.test(h));
    assert.ok(!/<aside class="ad-slot/.test(h), 'ads are disabled in V1');
  }
});

test('public/ is up to date with the source', () => {
  const pub = join(ROOT, 'public');
  const a = [];
  const walk = (d, base = '') => {
    for (const f of readdirSync(d, { withFileTypes: true })) {
      if (f.isDirectory()) walk(join(d, f.name), `${base}${f.name}/`);
      else a.push(`${base}${f.name}`);
    }
  };
  walk(out);
  for (const f of a) {
    assert.ok(existsSync(join(pub, f)), `public/${f} missing — run npm run build`);
    assert.ok(readFileSync(join(pub, f)).equals(readFileSync(join(out, f))), `public/${f} is stale — run npm run build`);
  }
});
