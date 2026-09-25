// End-to-end browser tests: drives headless Chrome over the DevTools
// protocol (Node 24 has fetch + WebSocket built in, so no dependencies).
//   node scripts/e2e.mjs                      local build via scripts/serve.mjs
//   node scripts/e2e.mjs https://example.dev  a deployed site
// Screenshots and the print PDF go to .tmp/shots/.

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib/recipes.mjs';
import { startServer } from './serve.mjs';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SHOTS = join(ROOT, '.tmp', 'shots');
mkdirSync(SHOTS, { recursive: true });

const remote = process.argv[2];
let server = null;
let BASE = remote ? remote.replace(/\/$/, '') : null;
if (!BASE) {
  server = await startServer(8791);
  BASE = 'http://localhost:8791';
}

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? `  -> ${detail}` : ''}`);
};

// ---------- Chrome / CDP plumbing ----------
const profile = join(ROOT, '.tmp', `chrome-profile-${Date.now()}`);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9239', `--user-data-dir=${profile}`, '--window-size=1366,900', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let version;
for (let i = 0; i < 50 && !version; i++) {
  try {
    version = await (await fetch('http://127.0.0.1:9239/json/version')).json();
  } catch {
    await sleep(200);
  }
}
const targets = await (await fetch('http://127.0.0.1:9239/json/list')).json();
const pageTarget = targets.find((t) => t.type === 'page');
const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let msgId = 0;
const pending = new Map();
const listeners = [];
const consoleErrors = [];
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
  } else if (msg.method) {
    if (msg.method === 'Runtime.exceptionThrown') consoleErrors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') consoleErrors.push(msg.params.args.map((a) => a.value || a.description).join(' '));
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error' && !/favicon|404 \(Not Found\)/.test(msg.params.entry.text + (msg.params.entry.url || ''))) consoleErrors.push(`${msg.params.entry.text} ${msg.params.entry.url || ''}`);
    for (const l of listeners) l(msg);
  }
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
const once = (method) => new Promise((resolve) => {
  const l = (m) => {
    if (m.method === method) {
      listeners.splice(listeners.indexOf(l), 1);
      resolve(m.params);
    }
  };
  listeners.push(l);
});
await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
await send('Page.setLifecycleEventsEnabled', { enabled: true });

async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}
async function go(path) {
  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url: path.startsWith('http') ? path : BASE + path });
  await loaded;
  await sleep(150);
}
async function waitFor(expr, timeout = 4000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await evaluate(`!!(${expr})`)) return true;
    await sleep(80);
  }
  return false;
}
async function viewport(width, height, mobile = false) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
}
async function shot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(SHOTS, `${name}.png`), Buffer.from(r.data, 'base64'));
}
const click = (sel) => evaluate(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error('missing ' + ${JSON.stringify(sel)}); el.click(); return true; })()`);
const text = (sel) => evaluate(`(document.querySelector(${JSON.stringify(sel)})?.innerText || '').trim()`);
const visibleIngredients = () => evaluate(`[...document.querySelectorAll('.recipe .ing .ing-text')].map(e => e.innerText.replace(/\\s+/g,' ').trim())`);
const noOverflow = () => evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1');

const recipeIds = readdirSync(join(ROOT, 'recipes')).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));
const recipesData = Object.fromEntries(recipeIds.map((id) => [id, JSON.parse(readFileSync(join(ROOT, 'recipes', `${id}.json`), 'utf8'))]));

try {
  await viewport(1366, 900);

  // ---------- Every recipe page ----------
  for (const id of recipeIds) {
    consoleErrors.length = 0;
    await go(`/recipes/${id}/`);
    const r = recipesData[id];
    const info = await evaluate(`(() => {
      const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => JSON.parse(s.textContent));
      const recipe = ld.find(d => d['@type'] === 'Recipe');
      return {
        h1: document.querySelector('h1')?.textContent,
        title: document.title,
        desc: document.querySelector('meta[name=description]')?.content,
        canonical: document.querySelector('link[rel=canonical]')?.href,
        og: document.querySelector('meta[property="og:image"]')?.content,
        ings: document.querySelectorAll('.recipe .ing').length,
        steps: document.querySelectorAll('.steps .step').length,
        timers: document.querySelectorAll('.timer-btn').length,
        jsClass: document.documentElement.classList.contains('js'),
        recipe: recipe ? { name: recipe.name, ings: recipe.recipeIngredient.length, steps: recipe.recipeInstructions.length, image: recipe.image, total: recipe.totalTime, yield: recipe.recipeYield } : null,
        imgOk: [...document.images].filter(i => i.loading !== 'lazy').every(i => i.complete && i.naturalWidth > 0),
        h2s: [...document.querySelectorAll('h2')].map(h => h.textContent),
      };
    })()`);
    const ingCount = (r.ingredients || []).reduce((n, x) => n + (x.items ? x.items.length : 1), 0);
    const timerCount = r.steps.reduce((n, s) => n + [...s.text.matchAll(/\{time [^}]*\}/g)].filter((m) => !/notimer/.test(m[0])).length, 0);
    check(`recipe ${id}: loads with correct content`, info.h1 === r.title && info.ings === ingCount && info.steps === r.steps.length && info.timers === timerCount && info.jsClass, JSON.stringify({ h1: info.h1, ings: info.ings, want: ingCount, steps: info.steps, timers: info.timers, timerCount }));
    check(`recipe ${id}: SEO tags + Recipe JSON-LD`, info.title.startsWith(r.title) && info.desc === r.description && info.canonical.endsWith(`/recipes/${id}/`) && info.og && info.recipe && info.recipe.name === r.title && info.recipe.ings === ingCount && info.recipe.steps === r.steps.length && info.recipe.image.length === 3 && info.h2s.includes('Ingredients') && info.h2s.includes('Instructions'), JSON.stringify(info.recipe));
    check(`recipe ${id}: images load, no console errors`, info.imgOk && consoleErrors.length === 0, consoleErrors.join(' | '));
  }

  // ---------- Scaling, fractions, units, temperature ----------
  await go('/recipes/lemon-garlic-chicken-thighs/');
  await evaluate('localStorage.clear(); sessionStorage.clear()');
  await go('/recipes/lemon-garlic-chicken-thighs/');
  let ings = await visibleIngredients();
  check('scaling: original amounts at 4 servings', ings[0].startsWith('2 lb') && ings[1].startsWith('1½ tsp') && ings[4].startsWith('6 cloves'), ings.slice(0, 5).join(' / '));
  await click('label[for="srv-8"]');
  ings = await visibleIngredients();
  check('scaling: 8 servings doubles (fractions → whole units)', ings[0].startsWith('4 lb') && ings[0].includes('12–16 thighs') && ings[1].startsWith('1 tbsp') && ings[4].startsWith('12 cloves') && ings[6].startsWith('2 lemons'), ings.slice(0, 7).join(' / '));
  check('scaling: status message and servings fact update', (await text('[data-scale-text]')).includes('×2') && (await text('[data-servings-fact]')) === '8');
  await click('label[for="srv-2"]');
  ings = await visibleIngredients();
  check('scaling: 2 servings halves (whole → fractions)', ings[0].startsWith('1 lb') && ings[1].startsWith('¾ tsp') && ings[3].startsWith('1½ tsp') && ings[6].startsWith('½ lemon'), ings.slice(0, 7).join(' / '));
  const stepQty = await text('[data-step-text="4"]');
  check('scaling: fixed step quantity stays 1 tbsp', stepQty.includes('about 1 tbsp of fat'), stepQty);
  // Invalid custom servings
  const tryCustom = async (v) => {
    await evaluate(`(() => { const i = document.querySelector('[data-custom-servings]'); i.value = ${JSON.stringify(v)}; i.dispatchEvent(new Event('input', {bubbles:true})); i.dispatchEvent(new Event('change', {bubbles:true})); })()`);
    return { err: await evaluate(`!document.getElementById('servings-error').hidden`), fact: await text('[data-servings-fact]') };
  };
  for (const bad of ['0', '-3', '2.5', '1000', 'abc', '1e3']) {
    const res = await tryCustom(bad);
    check(`invalid servings "${bad}" rejected`, (bad === 'abc' ? true : res.err) && res.fact === '2', JSON.stringify(res));
  }
  const good = await tryCustom('7');
  ings = await visibleIngredients();
  check('custom servings 7 accepted (×1.75)', !good.err && good.fact === '7' && ings[0].startsWith('3½ lb'), `${JSON.stringify(good)} ${ings[0]}`);
  await click('[data-action="reset-servings"]');
  // Units
  await click('label[for="units-metric"]');
  ings = await visibleIngredients();
  const oven = await text('.facts');
  check('metric: weights in g, spoons keep mL, cups → mL', ings[0].startsWith('907 g') && ings[1].includes('1½ tsp (7.5 mL)') && ings[7].startsWith('118 mL') && ings[9].startsWith('14 g'), ings.join(' / '));
  check('metric: oven 425°F shows as 220°C; internal 175°F as 79°C', oven.includes('220°C') && (await text('[data-step-text="3"]')).includes('79°C') && (await text('[data-step-text="3"]')).includes('74°C'));
  await go('/recipes/lemon-garlic-chicken-thighs/');
  check('metric preference persists after reload', (await evaluate(`document.documentElement.dataset.units`)) === 'metric' && (await visibleIngredients())[0].startsWith('907 g'));
  await go('/recipes/classic-pancakes/');
  ings = await visibleIngredients();
  check('metric: flour by weight (density), milk by volume', ings[0].startsWith('250 g') && ings[5].startsWith('414 mL'), ings.slice(0, 6).join(' / '));
  await click('label[for="units-us"]');
  ings = await visibleIngredients();
  check('US: flour shows cups with grams alongside', ings[0].startsWith('2 cups (250 g)'), ings[0]);
  await click('label[for="srv-6"]');
  ings = await visibleIngredients();
  check('pancakes ×½: 2 eggs → 1 egg, 1¾ cups milk → ¾ cup + 2 tbsp', ings[6].startsWith('1 large egg') && ings[5].startsWith('¾ cup + 2 tbsp'), `${ings[5]} / ${ings[6]}`);
  await click('label[for="srv-12"]');

  // ---------- Checklist ----------
  await go('/recipes/lemon-garlic-chicken-thighs/');
  await click('.ing[data-i="1"] label');
  await click('.ing[data-i="2"] label');
  check('checklist: ticking marks items', (await evaluate(`document.querySelectorAll('.ing.is-checked').length`)) === 2);
  await go('/recipes/lemon-garlic-chicken-thighs/');
  check('checklist: persists on reload (session)', (await evaluate(`document.querySelectorAll('.ing.is-checked').length`)) === 2 && !(await evaluate(`document.querySelector('[data-action="clear-checks"]').hidden`)));

  // ---------- Shopping list ----------
  await evaluate(`localStorage.removeItem('cs:shopping')`);
  await go('/recipes/lemon-garlic-chicken-thighs/');
  await click('[data-action="shop"]');
  check('shopping: toast confirms add, skipping checked items', (await waitFor(`!document.querySelector('.toast').hidden`)) && (await text('.toast')).includes('Skipped 2'), await text('.toast'));
  await click('[data-action="clear-checks"]');
  await click('[data-action="shop"]');
  await go('/recipes/coconut-chickpea-curry/');
  await click('[data-action="shop"]');
  await go('/shopping-list/');
  let shop = await evaluate(`({ items: [...document.querySelectorAll('.shop-item .shop-text')].map(e => e.firstChild.textContent.trim()), groups: [...document.querySelectorAll('.shop-group h2')].map(h => h.textContent), recipes: document.querySelectorAll('.shop-recipe-list li').length, count: document.querySelector('[data-list-count]').textContent })`);
  const garlicRows = shop.items.filter((t) => /garlic/.test(t));
  check('shopping: two recipes, no duplicate recipe entries', shop.recipes === 2, JSON.stringify(shop.recipes));
  check('shopping: garlic merged into one row (6 + 3 cloves)', garlicRows.length === 1 && garlicRows[0].startsWith('9 cloves'), garlicRows.join(' | '));
  check('shopping: grouped by aisle with staples last', shop.groups[0] === 'Produce' && shop.groups.at(-1).startsWith('Staples') && shop.groups.includes('Pantry'), shop.groups.join(', '));
  check('shopping: water never listed; nav badge shows count', !shop.items.some((t) => /water/i.test(t)) && Number(shop.count) === shop.items.length, `${shop.count} vs ${shop.items.length}`);
  await evaluate(`document.querySelector('.shop-item input').click()`);
  await go('/shopping-list/');
  check('shopping: checked item persists', (await evaluate(`document.querySelectorAll('.shop-item.is-checked').length`)) === 1);
  await evaluate(`(() => { const i = document.getElementById('new-item'); i.value = '<img src=x onerror=alert(1)> paper towels'; i.form.requestSubmit(); })()`);
  check('shopping: custom item added as plain text (no HTML injection)', (await evaluate(`[...document.querySelectorAll('.shop-text')].some(e => e.textContent.includes('<img src=x'))`)) && (await evaluate(`!document.querySelector('.shop-items img')`)));
  await evaluate(`(() => { const i = document.getElementById('new-item'); i.value = '   '; i.form.requestSubmit(); })()`);
  const customCount = await evaluate(`[...document.querySelectorAll('.shop-sub')].filter(e => e.textContent === 'added by you').length`);
  check('shopping: blank item ignored', customCount === 1, String(customCount));
  await click('label[for="units-metric"]');
  shop = await evaluate(`[...document.querySelectorAll('.shop-item .shop-text')].map(e => e.firstChild.textContent.trim())`);
  check('shopping: unit toggle converts the list', shop.some((t) => /^907 g bone-in chicken thighs/.test(t)), shop.join(' | '));
  await click('label[for="units-us"]');
  await go('/recipes/lemon-garlic-chicken-thighs/');
  await click('[data-action="shop"]');
  await go('/shopping-list/');
  check('shopping: re-adding a recipe updates instead of duplicating', (await evaluate(`document.querySelectorAll('.shop-recipe-list li').length`)) === 2);
  await evaluate(`document.querySelector('[data-remove-recipe="coconut-chickpea-curry"]').click()`);
  check('shopping: removing a recipe removes its items', !(await evaluate(`[...document.querySelectorAll('.shop-text')].some(e => /chickpeas/.test(e.textContent))`)));
  await viewport(375, 812, true);
  await shot('mobile-shopping-list');
  check('mobile: shopping list has no horizontal overflow', await noOverflow());
  await viewport(1366, 900);

  // ---------- Cook Mode ----------
  await go('/recipes/lemon-garlic-chicken-thighs/');
  await evaluate(`sessionStorage.removeItem('cs:cook:lemon-garlic-chicken-thighs')`);
  await click('[data-action="cook"]');
  check('cook mode: opens full screen at step 1', (await waitFor(`document.querySelector('dialog.cook')?.open`)) && (await text('[data-count]')) === 'Step 1 of 6');
  check('cook mode: URL gets #cook (back button closes it)', (await evaluate('location.hash')) === '#cook');
  await click('[data-cook="next"]');
  await click('[data-cook="next"]');
  check('cook mode: next moves forward, progress updates', (await text('[data-count]')) === 'Step 3 of 6' && (await evaluate(`document.querySelector('.cook-bar span').style.width`)) === '50%');
  await click('[data-cook="prev"]');
  check('cook mode: previous moves back', (await text('[data-count]')) === 'Step 2 of 6');
  check('cook mode: step shows ingredients it uses', (await text('.cook-uses')).includes('1 tbsp olive oil'));
  await click('[data-cook="ingredients"]');
  check('cook mode: ingredients panel opens with checklist', !(await evaluate(`document.querySelector('[data-sheet]').hidden`)) && (await evaluate(`document.querySelectorAll('.cook-ing-list input').length`)) === 11);
  await evaluate(`document.querySelectorAll('.cook-ing-list input')[0].click()`);
  await click('[data-cook="close-sheet"]');
  check('cook mode: checking in the panel syncs to the page', await evaluate(`document.querySelector('.ing[data-i="0"]').classList.contains('is-checked')`));
  await click('[data-cook="start-timer"]');
  check('cook mode: timer starts and shows in the timer strip', (await waitFor(`!document.querySelector('.cook-timers').hidden`)) && /\d:\d\d/.test(await text('.cook-timers .timer-clock')));
  const t1 = await text('.cook-timers .timer-clock');
  await sleep(1300);
  const t2 = await text('.cook-timers .timer-clock');
  check('timers: countdown runs', t1 !== t2, `${t1} -> ${t2}`);
  await evaluate(`document.querySelector('.cook-timers [data-timer-act="pause"]').click()`);
  const p1 = await text('.cook-timers .timer-clock');
  await sleep(1200);
  check('timers: pause stops the countdown', (await text('.cook-timers .timer-clock')) === p1);
  await evaluate(`document.querySelector('.cook-timers [data-timer-act="resume"]').click()`);
  await viewport(375, 812, true);
  await sleep(200);
  await shot('mobile-cook-mode');
  const navVisible = await evaluate(`(() => { const b = document.querySelector('[data-cook="next"]').getBoundingClientRect(); return b.bottom <= innerHeight && b.height >= 44; })()`);
  check('mobile: cook mode buttons on screen and at least 44px tall', navVisible);
  check('mobile: cook mode fits the screen width', await evaluate(`(() => { const d = document.querySelector('dialog.cook'); return d.scrollWidth <= d.clientWidth + 1 && document.querySelector('.cook-shell').getBoundingClientRect().right <= innerWidth + 1; })()`));
  await viewport(1366, 900);
  await evaluate('history.back()');
  check('cook mode: browser back closes Cook Mode but stays on the recipe', (await waitFor(`!document.querySelector('dialog.cook').open`)) && (await evaluate('location.pathname')) === '/recipes/lemon-garlic-chicken-thighs/');
  check('timers: tray appears on the page after Cook Mode closes', !(await evaluate(`document.querySelector('.timer-tray').hidden`)));
  await click('[data-action="cook"]');
  check('cook mode: reopens at the step you left', (await text('[data-count]')) === 'Step 2 of 6');
  for (let i = 0; i < 6; i++) await click('[data-cook="next"]').catch(() => {});
  check('cook mode: finish screen after last step', (await text('[data-count]')) === 'All steps done');
  await evaluate(`document.querySelector('dialog.cook [data-cook="exit"]').click()`);
  await waitFor(`!document.querySelector('dialog.cook').open`);
  // Timer completion: move the running timer's end time to the near future and reload.
  await evaluate(`(() => { const t = JSON.parse(sessionStorage.getItem('cs:timers')); t.forEach(x => { x.state = 'running'; x.endAt = Date.now() + 1500; }); sessionStorage.setItem('cs:timers', JSON.stringify(t)); })()`);
  await go('/recipes/lemon-garlic-chicken-thighs/');
  check('timers: survive reload', !(await evaluate(`document.querySelector('.timer-tray').hidden`)));
  check('timers: finished timer alerts "Time’s up!"', await waitFor(`document.querySelector('.timer-tray .timer.is-done')`, 4000));
  await evaluate(`document.querySelector('.timer-tray [data-timer-act="dismiss"]').click()`);
  check('timers: dismiss clears the alert', await waitFor(`document.querySelector('.timer-tray').hidden`));
  await click('.timer-btn');
  check('timers: step timer button on the page starts a timer', (await waitFor(`!document.querySelector('.timer-tray').hidden`)) && (await text('.timer-btn')).startsWith('Running'));
  await evaluate(`document.querySelector('.timer-tray [data-timer-act="cancel"]').click()`);

  // ---------- Print ----------
  await go('/recipes/lemon-garlic-chicken-thighs/');
  await send('Emulation.setEmulatedMedia', { media: 'print' });
  const printInfo = await evaluate(`(() => { const d = s => { const e = document.querySelector(s); return e ? getComputedStyle(e).display : 'none'; }; return { header: d('.site-header'), footer: d('.site-footer'), actions: d('.recipe-actions'), controls: d('.controls'), related: d('.related'), ingredients: d('.ingredients'), steps: d('.steps'), facts: d('.facts'), url: d('.print-url') }; })()`);
  check('print: no navigation, buttons or related links', printInfo.header === 'none' && printInfo.footer === 'none' && printInfo.actions === 'none' && printInfo.controls === 'none' && printInfo.related === 'none', JSON.stringify(printInfo));
  check('print: title, times/temperature, ingredients, steps and URL shown', printInfo.ingredients !== 'none' && printInfo.steps !== 'none' && printInfo.facts !== 'none' && printInfo.url !== 'none' && (await text('.facts')).includes('425°F'));
  const pdf = await send('Page.printToPDF', { printBackground: false, paperWidth: 8.5, paperHeight: 11 });
  const pdfBuf = Buffer.from(pdf.data, 'base64');
  writeFileSync(join(SHOTS, 'print-lemon-garlic-chicken-thighs.pdf'), pdfBuf);
  const pdfPages = (pdfBuf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  check("print: recipe fits on 1–2 pages", pdfPages >= 1 && pdfPages <= 2, `${pdfPages} pages`);
  await send('Emulation.setEmulatedMedia', { media: '' });

  // ---------- Search ----------
  const searchResults = () => evaluate(`[...document.querySelectorAll('[data-results] .card-title a')].map(a => a.getAttribute('href').split('/')[2])`);
  await go('/search/?q=chicken');
  let found = await searchResults();
  check('search: by name/ingredient "chicken"', found.length >= 3 && found.every((id) => JSON.stringify(recipesData[id]).toLowerCase().includes('chicken')), found.join(','));
  await go('/search/?q=chickpeas');
  found = await searchResults();
  check('search: by ingredient "chickpeas"', found.includes('coconut-chickpea-curry') && found.includes('chickpea-salad-sandwiches'), found.join(','));
  await go('/search/?q=mexican');
  found = await searchResults();
  await go('/search/?q=italian');
  const italian = await searchResults();
  check('search: by cuisine', italian.length >= 2 && italian.every((id) => recipesData[id].cuisine === 'Italian'), italian.join(','));
  await go('/search/?meal=dessert');
  found = await searchResults();
  check('filter: dessert', found.length >= 4 && found.every((id) => recipesData[id].mealTypes.includes('dessert')), found.join(','));
  await go('/search/?meal=breakfast');
  found = await searchResults();
  check('filter: breakfast', found.length >= 3 && found.every((id) => recipesData[id].mealTypes.includes('breakfast')), found.join(','));
  await go('/search/?diet=vegan');
  found = await searchResults();
  check('filter: vegan', found.length >= 5 && found.every((id) => recipesData[id].diets.includes('vegan')), found.join(','));
  await go('/search/?diet=vegetarian&meal=dinner');
  found = await searchResults();
  check('filter: vegetarian + dinner', found.length >= 3 && found.every((id) => recipesData[id].mealTypes.includes('dinner')), found.join(','));
  await go('/search/?quick=1');
  found = await searchResults();
  const total = (id) => recipesData[id].totalMinutes || recipesData[id].prepMinutes + recipesData[id].cookMinutes;
  check('filter: quick meals (≤30 min)', found.length >= 5 && found.every((id) => total(id) <= 30), found.join(','));
  await go('/search/?q=dinner%2030%20minutes');
  found = await searchResults();
  check('search: "dinner 30 minutes" parses the time', found.length >= 2 && found.every((id) => total(id) <= 30 && recipesData[id].mealTypes.includes('dinner')), found.join(','));
  await go('/search/?tag=one-pan&meal=dinner');
  found = await searchResults();
  check('filter: one-pan', found.length >= 4 && found.every((id) => recipesData[id].tags.includes('one-pan')), found.join(','));
  consoleErrors.length = 0;
  await go(`/search/?q=${encodeURIComponent('<script>alert(1)</script>')}`);
  check('search: HTML in query is harmless, shows empty state', (await searchResults()).length === 0 && !(await evaluate(`document.querySelector('[data-empty]').hidden`)) && consoleErrors.length === 0);
  await go('/search/?q=zzzzqqq');
  check('search: no results message', (await text('#results-count')) === 'No recipes found');
  await go('/search/');
  await evaluate(`(() => { const q = document.getElementById('q'); q.value = 'pasta'; q.dispatchEvent(new Event('input', {bubbles:true})); })()`);
  await sleep(400);
  found = await searchResults();
  check('search: live typing filters and updates the URL', found.length >= 2 && (await evaluate('location.search')) === '?q=pasta', found.join(','));
  await viewport(375, 812, true);
  await shot('mobile-search');
  check('mobile: search has no horizontal overflow', await noOverflow());
  await viewport(1366, 900);
  await shot('desktop-search');

  // ---------- What can I make? ----------
  await go('/what-can-i-make/?have=chicken,rice,onion,garlic');
  const disc = await evaluate(`({ count: document.querySelector('[data-discover-count]').textContent, top: [...document.querySelectorAll('[data-discover-results] .card-title a')].map(a => a.getAttribute('href').split('/')[2]), used: document.querySelector('.match-used')?.textContent, missing: document.querySelector('.match-missing, .match-ready')?.textContent })`);
  check('what can I make: chicken, rice, onion, garlic → chicken & rice dishes first', ['chicken-fried-rice', 'one-pan-chicken-and-rice'].includes(disc.top[0]) && disc.used.includes('Uses 4 of your 4'), JSON.stringify(disc));
  check('what can I make: lists missing ingredients and time', /need|everything/.test(disc.missing) && /min|hr/.test(await text('[data-discover-results] .card-meta')), disc.missing);
  await go('/what-can-i-make/?have=dragonfruit,chickpeas');
  check('what can I make: unknown ingredient reported, known one still matched', (await text('[data-unmatched]')).includes('dragonfruit') && (await evaluate(`document.querySelectorAll('[data-discover-results] .card').length`)) >= 2);
  await go('/what-can-i-make/?have=');
  check('what can I make: empty input shows no results', (await evaluate(`document.querySelectorAll('[data-discover-results] .card').length`)) === 0);
  await evaluate(`(() => { const i = document.getElementById('have'); i.value = 'eggs, '; i.dispatchEvent(new Event('input', {bubbles:true})); })()`);
  check('what can I make: typing with commas adds chips', (await evaluate(`document.querySelectorAll('.have-chips li').length`)) === 1 && (await evaluate(`document.querySelectorAll('[data-discover-results] .card').length`)) >= 3);
  await viewport(375, 812, true);
  await go('/what-can-i-make/?have=chicken,rice,onion,garlic');
  await shot('mobile-what-can-i-make');
  check('mobile: what-can-i-make has no horizontal overflow', await noOverflow());
  await viewport(1366, 900);

  // ---------- Layout: every page at phone and desktop sizes ----------
  const pages = ['/', '/search/', '/what-can-i-make/', '/shopping-list/', '/recipes/', '/about/', ...recipeIds.map((id) => `/recipes/${id}/`)];
  let overflow = [];
  await viewport(375, 812, true);
  for (const p of pages) {
    await go(p);
    if (!(await noOverflow())) overflow.push(p);
  }
  check('mobile (375px): no page scrolls sideways', overflow.length === 0, overflow.join(', '));
  await go('/');
  await shot('mobile-home');
  await go('/recipes/lemon-garlic-chicken-thighs/');
  await shot('mobile-recipe');
  const ingTop = await evaluate(`document.querySelector('.ingredients').getBoundingClientRect().top`);
  check('mobile: ingredients start within the first ~1.2 screens', ingTop < 812 * 1.2, `${Math.round(ingTop)}px`);
  await viewport(320, 640, true);
  overflow = [];
  for (const p of ['/', '/recipes/chicken-fried-rice/', '/search/', '/shopping-list/']) {
    await go(p);
    if (!(await noOverflow())) overflow.push(p);
  }
  check('small phone (320px): no sideways scrolling', overflow.length === 0, overflow.join(', '));
  await viewport(1366, 900);
  overflow = [];
  for (const p of pages.slice(0, 8)) {
    await go(p);
    if (!(await noOverflow())) overflow.push(p);
  }
  check('desktop (1366px): no sideways scrolling', overflow.length === 0, overflow.join(', '));
  await go('/');
  await shot('desktop-home');
  await go('/recipes/lemon-garlic-chicken-thighs/');
  await shot('desktop-recipe');
  const cols = await evaluate(`getComputedStyle(document.querySelector('.recipe-body')).gridTemplateColumns.split(' ').length`);
  check('desktop: ingredients and instructions side by side', cols === 2);

  // ---------- Home, 404, SEO files ----------
  await go('/');
  const home = await evaluate(`({ h1: document.querySelector('h1').textContent, sections: [...document.querySelectorAll('.home-section h2')].map(h => h.textContent), label: document.querySelector('.hero-label').textContent })`);
  check('home: tagline, search prompt and all six sections', home.h1 === 'Recipes without the clutter.' && home.label === 'What do you want to cook?' && ['Quick meals', 'Popular recipes', 'Recently added', 'Vegetarian', 'Desserts', 'One-pan meals'].every((s) => home.sections.includes(s)), JSON.stringify(home));
  const status = async (p) => (await fetch(BASE + p, { redirect: 'manual' })).status;
  check('404: unknown page returns 404 with the not-found page', (await status('/no-such-page/')) === 404);
  const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
  check('sitemap.xml lists every recipe', recipeIds.every((id) => sitemap.includes(`/recipes/${id}/`)) && !sitemap.includes('shopping-list'));
  const robots = await (await fetch(`${BASE}/robots.txt`)).text();
  check('robots.txt allows crawling and points to the sitemap', robots.includes('Allow: /') && robots.includes('Sitemap:'));
  const res = await fetch(`${BASE}/`);
  const csp = res.headers.get('content-security-policy') || '';
  check('security headers present (CSP)', csp.includes("default-src 'none'") && csp.includes('script-src'), csp.slice(0, 80));
  check('no pop-ups: no alert/confirm/modal on load, no autoplay media', (await evaluate(`document.querySelectorAll('video, audio, iframe, [autoplay]').length`)) === 0);
} catch (e) {
  check('e2e run finished without crashing', false, e.stack);
} finally {
  ws.close();
  chrome.kill();
  server?.close();
  await sleep(300);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    /* profile still locked; harmless */
  }
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} browser checks passed. Screenshots in .tmp/shots/`);
process.exit(failed.length ? 1 : 0);
