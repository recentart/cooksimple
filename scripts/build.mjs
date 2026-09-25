// Build the static site into public/ (the directory Wrangler deploys).
//   node scripts/build.mjs           build (fails on any recipe error)
//   node scripts/build.mjs --check   build into a temp folder and fail if public/ is out of date
// No dependencies: Node built-ins only.

import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, copyFileSync, existsSync, mkdtempSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { loadAll, ROOT } from './lib/recipes.mjs';
import { homePage, recipePage, searchPage, discoverPage, shoppingPage, allRecipesPage, aboutPage, notFoundPage, searchEntry, clientRecipe } from '../src/templates/pages.js';
import { collectionsIndexPage, collectionPage, savedPage, plannerPage, offlinePage, collectionRecipes, MIN_COLLECTION } from '../src/templates/extra-pages.js';

const HEAD_SCRIPT = "document.documentElement.classList.add('js');try{if(localStorage.getItem('cs-units')==='metric')document.documentElement.setAttribute('data-units','metric')}catch(e){}";

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function write(file, content) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

function copyTree(from, to, filter = () => true) {
  for (const f of walk(from)) {
    if (!filter(f)) continue;
    const dest = join(to, relative(from, f));
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(f, dest);
  }
}

export function build(outDir) {
  const site = JSON.parse(readFileSync(join(ROOT, 'site.config.json'), 'utf8'));
  const { vocab, recipes, errors, warnings } = loadAll({ illustrations: true });
  for (const w of warnings) console.warn(`warning  ${w}`);
  if (errors.length) {
    for (const e of errors) console.error(`ERROR    ${e}`);
    throw new Error(`${errors.length} recipe error(s); nothing was built`);
  }
  if (!recipes.length) throw new Error('no recipes found in recipes/');
  recipes.forEach((r, i) => (r.order = i));

  // Client code is served from a folder named after a hash of its contents,
  // so it can be cached forever and every deploy busts the cache.
  const clientDirs = ['src/lib', 'src/client', 'src/styles'];
  const photosFile = join(ROOT, 'data', 'photos.json');
  const photos = existsSync(photosFile) ? JSON.parse(readFileSync(photosFile, 'utf8')) : {};
  for (const id of Object.keys(photos)) if (!existsSync(join(ROOT, 'src', 'photos', `${id}.jpg`))) throw new Error(`photos.json lists ${id} but src/photos/${id}.jpg is missing`);

  // Data the browser fetches: the search index, a small vocabulary for
  // "What can I make?", and one file per recipe (meal planner -> shopping list).
  const usedKeys = new Set(recipes.flatMap((r) => r.ingredients.map((i) => i.key)));
  const miniVocab = {};
  for (const k of [...usedKeys].sort()) miniVocab[k] = { one: vocab[k].one, family: vocab[k].family, syn: vocab[k].syn, pantry: vocab[k].pantry };
  const dataFiles = { 'index.json': JSON.stringify(recipes.map((r) => searchEntry(r, vocab))), 'vocab.json': JSON.stringify(miniVocab) };
  for (const r of recipes) dataFiles[`r/${r.id}.json`] = JSON.stringify(clientRecipe(r, site));

  const hash = createHash('sha256');
  for (const [name, content] of Object.entries(dataFiles)) hash.update(name).update(content);
  for (const d of clientDirs) for (const f of walk(join(ROOT, d))) hash.update(relative(ROOT, f).replace(/\\/g, '/')).update(readFileSync(f, 'utf8').replace(/\r\n/g, '\n'));
  const assetHash = hash.digest('hex').slice(0, 10);
  const assets = `/assets/${assetHash}`;

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  for (const d of clientDirs) copyTree(join(ROOT, d), join(outDir, 'assets', assetHash, d.replace('src/', '')));
  copyTree(join(ROOT, 'src', 'illustrations'), join(outDir, 'images', 'recipes'), (f) => f.endsWith('.svg'));
  copyTree(join(ROOT, 'src', 'images'), join(outDir, 'images'));
  copyTree(join(ROOT, 'src', 'static'), outDir);
  copyTree(join(ROOT, 'src', 'photos'), join(outDir, 'images', 'photos'), (f) => f.endsWith('.jpg'));
  for (const [name, content] of Object.entries(dataFiles)) write(join(outDir, 'assets', assetHash, 'data', name), content);

  const collections = JSON.parse(readFileSync(join(ROOT, 'data', 'collections.json'), 'utf8'))
    .map((c) => ({ ...c, recipes: collectionRecipes(c, recipes) }))
    .filter((c) => c.recipes.length >= MIN_COLLECTION);

  const ctx = { site, vocab, recipes, assets, headScript: HEAD_SCRIPT, photos, collections };
  const pages = {
    'index.html': homePage(ctx),
    'search/index.html': searchPage(ctx),
    'what-can-i-make/index.html': discoverPage(ctx),
    'shopping-list/index.html': shoppingPage(ctx),
    'recipes/index.html': allRecipesPage(ctx),
    'about/index.html': aboutPage(ctx),
    '404.html': notFoundPage(ctx),
    'collections/index.html': collectionsIndexPage(ctx),
    'saved/index.html': savedPage(ctx),
    'meal-planner/index.html': plannerPage(ctx),
    'offline/index.html': offlinePage(ctx),
  };
  for (const c of collections) pages[`collections/${c.slug}/index.html`] = collectionPage(ctx, c);
  for (const r of recipes) pages[`recipes/${r.id}/index.html`] = recipePage(ctx, r);
  for (const [path, content] of Object.entries(pages)) write(join(outDir, path), String(content));

  // sitemap.xml: only real, complete pages.
  const latest = recipes.map((r) => r.added).sort().at(-1);
  const urls = [
    ['/', latest],
    ['/search/', latest],
    ['/what-can-i-make/', latest],
    ['/recipes/', latest],
    ['/about/', latest],
    ['/collections/', latest],
    ...collections.map((c) => [`/collections/${c.slug}/`, c.recipes.map((r) => r.added).sort().at(-1)]),
    ...recipes.map((r) => [`/recipes/${r.id}/`, r.added]),
  ];
  write(
    join(outDir, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, d]) => `  <url><loc>${site.url}${u}</loc><lastmod>${d}</lastmod></url>`).join('\n')}\n</urlset>\n`,
  );
  write(join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);

  const scriptHash = createHash('sha256').update(HEAD_SCRIPT).digest('base64');
  write(
    join(outDir, '_headers'),
    `# Security and caching headers, applied by Cloudflare Workers static assets.
# The one inline script (sets the js class and the saved unit choice) is allowed by its hash.
# Adding ads or any third-party script later means widening this policy (see ADS.md).
/*
  Content-Security-Policy: default-src 'none'; script-src 'self' 'sha256-${scriptHash}'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  X-Frame-Options: DENY

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/images/*
  Cache-Control: public, max-age=86400

/sw.js
  Cache-Control: no-cache
`,
  );

  write(
    join(outDir, 'manifest.webmanifest'),
    JSON.stringify(
      {
        name: site.name,
        short_name: site.name,
        description: site.description,
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#faf8f4',
        theme_color: '#1f6b4f',
        icons: [
          { src: '/images/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/images/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      null,
      2,
    ) + '\n',
  );

  // Service worker for offline use: core pages and this build's assets are
  // cached on install; recipe pages are cached as they are visited or saved.
  const core = ['/', '/offline/', '/search/', '/saved/', '/meal-planner/', '/shopping-list/', '/what-can-i-make/', '/collections/', '/favicon.svg', '/manifest.webmanifest'];
  const assetFiles = walk(join(outDir, 'assets', assetHash)).map((f) => '/' + relative(outDir, f).replace(/\\/g, '/')).filter((f) => !f.includes('/data/r/'));
  const sw = readFileSync(join(ROOT, 'src', 'sw-template.js'), 'utf8').replace('__VERSION__', assetHash).replace('__PRECACHE__', JSON.stringify([...core, ...assetFiles]));
  write(join(outDir, 'sw.js'), sw);

  return { recipes: recipes.length, pages: Object.keys(pages).length, assetHash, warnings: warnings.length };
}

function diffTrees(a, b) {
  const list = (d) => new Set(walk(d).map((f) => relative(d, f)));
  const la = list(a);
  const lb = list(b);
  const diffs = [];
  for (const f of la) if (!lb.has(f)) diffs.push(`missing from public/: ${f}`);
  for (const f of lb) if (!la.has(f)) diffs.push(`stale file in public/: ${f}`);
  for (const f of la) if (lb.has(f) && !readFileSync(join(a, f)).equals(readFileSync(join(b, f)))) diffs.push(`out of date: ${f}`);
  return diffs;
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (isMain) {
  try {
    if (process.argv.includes('--check')) {
      const tmp = mkdtempSync(join(tmpdir(), 'cooksimple-'));
      build(tmp);
      const diffs = diffTrees(tmp, join(ROOT, 'public'));
      rmSync(tmp, { recursive: true, force: true });
      if (diffs.length) {
        console.error(diffs.slice(0, 20).join('\n'));
        console.error(`public/ is out of date (${diffs.length} difference(s)). Run: npm run build`);
        process.exit(1);
      }
      console.log('public/ is up to date.');
    } else {
      const res = build(join(ROOT, 'public'));
      console.log(`Built ${res.pages} pages from ${res.recipes} recipes into public/ (assets ${res.assetHash}).`);
    }
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
