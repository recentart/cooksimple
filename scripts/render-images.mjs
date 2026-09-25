// Renders the raster images search engines and social sites need (they don't
// accept SVG): three aspect ratios per recipe for Recipe structured data, the
// site's social card and the app icons. Uses headless Chrome over the
// DevTools protocol. Run after changing illustrations:
//   node scripts/render-images.mjs

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib/recipes.mjs';
import { ILLUSTRATION_IDS, BACKGROUNDS } from './illustrations.mjs';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = join(ROOT, 'src', 'images');
const profile = join(ROOT, '.tmp', `chrome-render-${Date.now()}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=9241', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
let targets;
for (let i = 0; i < 50 && !targets; i++) {
  try {
    targets = await (await fetch('http://127.0.0.1:9241/json/list')).json();
  } catch {
    await sleep(200);
  }
}
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
  }
});
const send = (method, params = {}) => new Promise((resolve) => {
  pending.set(++id, resolve);
  ws.send(JSON.stringify({ id, method, params }));
});

async function render(html, width, height, file) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  const { frameTree } = await send('Page.getFrameTree');
  await send('Page.setDocumentContent', { frameId: frameTree.frame.id, html });
  await sleep(120);
  const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width, height, scale: 1 } });
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(file, Buffer.from(shot.data, 'base64'));
}

const page = (w, h, bg, inner) => `<!doctype html><html><head><style>html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden;background:${bg}}body{display:flex;align-items:center;justify-content:center;font-family:Georgia,'Palatino Linotype',serif}</style></head><body>${inner}</body></html>`;

await send('Page.enable');
for (const rid of ILLUSTRATION_IDS) {
  const svg = readFileSync(join(ROOT, 'src', 'illustrations', `${rid}.svg`), 'utf8');
  const bg = BACKGROUNDS[rid];
  const sized = (w, h) => svg.replace(/width="400" height="300"/, `width="${w}" height="${h}"`);
  await render(page(1200, 900, bg, sized(1200, 900)), 1200, 900, join(OUT, 'recipes', `${rid}-4x3.png`));
  await render(page(1200, 675, bg, sized(900, 675)), 1200, 675, join(OUT, 'recipes', `${rid}-16x9.png`));
  await render(page(1080, 1080, bg, sized(1080, 810)), 1080, 1080, join(OUT, 'recipes', `${rid}-1x1.png`));
}

// Social card for non-recipe pages.
const logo = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#1f6b4f"/><path d="M9 17.5h14a7 7 0 0 1-14 0Z" fill="#fff"/><path d="M12.5 13c0-1.6 1.4-1.9 1.4-3.4M16 13c0-1.6 1.4-1.9 1.4-3.4M19.5 13c0-1.6 1.4-1.9 1.4-3.4" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>`;
const thumbs = ['classic-pancakes', 'spaghetti-aglio-e-olio', 'chicken-fried-rice'].map((r) => readFileSync(join(ROOT, 'src', 'illustrations', `${r}.svg`), 'utf8').replace(/width="400" height="300"/, 'width="300" height="225"')).join('');
await render(
  page(1200, 630, '#faf8f4', `<div style="width:1080px"><div style="display:flex;align-items:center;gap:22px">${logo(96)}<span style="font-size:84px;font-weight:700;color:#1c1a17">CookSimple</span></div><p style="font-size:46px;color:#1f6b4f;margin:18px 0 34px">Recipes without the clutter.</p><div style="display:flex;gap:24px;border-radius:18px;overflow:hidden">${thumbs}</div></div>`),
  1200, 630, join(OUT, 'social', 'cooksimple.png'),
);

// App icons.
for (const [size, name] of [[180, 'apple-touch-icon'], [192, 'icon-192'], [512, 'icon-512']]) {
  await render(page(size, size, '#1f6b4f', `<svg width="${Math.round(size * 0.78)}" height="${Math.round(size * 0.78)}" viewBox="4 4 24 24"><path d="M9 17.5h14a7 7 0 0 1-14 0Z" fill="#fff"/><path d="M12.5 13c0-1.6 1.4-1.9 1.4-3.4M16 13c0-1.6 1.4-1.9 1.4-3.4M19.5 13c0-1.6 1.4-1.9 1.4-3.4" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>`), size, size, join(OUT, 'icons', `${name}.png`));
}

ws.close();
chrome.kill();
await sleep(300);
try {
  rmSync(profile, { recursive: true, force: true });
} catch {
  /* locked profile; harmless */
}
console.log(`Rendered ${ILLUSTRATION_IDS.length * 3} recipe images, 1 social card and 3 icons into src/images/.`);
