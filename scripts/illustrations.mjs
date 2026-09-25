// Generates the recipe illustrations in src/illustrations/ (original flat
// vector art composed from simple shapes). Deterministic: the same code
// always produces the same files.
//   node scripts/illustrations.mjs

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib/recipes.mjs';

const W = 400;
const H = 300;
const r1 = (n) => Math.round(n * 10) / 10;

function rng(seed) {
  let a = 0;
  for (const ch of seed) a = (a * 31 + ch.charCodeAt(0)) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Random points inside a circle / rectangle.
const inCircle = (rand, cx, cy, r) => {
  const a = rand() * Math.PI * 2;
  const d = Math.sqrt(rand()) * r;
  return [r1(cx + Math.cos(a) * d), r1(cy + Math.sin(a) * d)];
};

// ---------- Vessels ----------
const shadow = (cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000" opacity=".09"/>`;
const plate = (cx, cy, r, rim = '#fbfaf6', well = '#efece4') => `${shadow(cx + 4, cy + 8, r, r)}<circle cx="${cx}" cy="${cy}" r="${r}" fill="${rim}"/><circle cx="${cx}" cy="${cy}" r="${r1(r * 0.8)}" fill="${well}"/>`;
const bowl = (cx, cy, r, food, rim = '#fbfaf6') => `${shadow(cx + 4, cy + 8, r, r)}<circle cx="${cx}" cy="${cy}" r="${r}" fill="${rim}"/><circle cx="${cx}" cy="${cy}" r="${r1(r * 0.84)}" fill="#e6e1d6"/><circle cx="${cx}" cy="${cy}" r="${r1(r * 0.8)}" fill="${food}"/>`;
const skillet = (cx, cy, r, inner = '#3a3a3f') => `${shadow(cx + 4, cy + 8, r, r)}<rect x="${cx + r - 6}" y="${cy - 9}" width="${r1(r * 0.75)}" height="18" rx="9" fill="#2a2a2e"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#2a2a2e"/><circle cx="${cx}" cy="${cy}" r="${r - 10}" fill="${inner}"/>`;
const sheetPan = (x, y, w, h) => `<rect x="${x + 5}" y="${y + 9}" width="${w}" height="${h}" rx="14" fill="#000" opacity=".09"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="#a9adb4"/><rect x="${x + 9}" y="${y + 9}" width="${w - 18}" height="${h - 18}" rx="8" fill="#c7cbd1"/>`;
const napkin = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${c}" transform="rotate(-8 ${x + w / 2} ${y + h / 2})"/>`;
const fork = (x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})" fill="#c9ccd1"><rect x="-3.5" y="0" width="7" height="92" rx="3.5"/><rect x="-11" y="-30" width="22" height="34" rx="6"/><rect x="-10" y="-52" width="4" height="26" rx="2"/><rect x="-3" y="-52" width="4" height="26" rx="2"/><rect x="4" y="-52" width="4" height="26" rx="2"/></g>`;

// ---------- Food pieces ----------
const leaf = (x, y, s, rot, c = '#4f9a45') => `<ellipse cx="${x}" cy="${y}" rx="${r1(s)}" ry="${r1(s * 0.45)}" fill="${c}" transform="rotate(${Math.round(rot)} ${x} ${y})"/>`;
function sprig(x, y, len, rot, c = '#3f8a3c', leafS = 7) {
  let s = `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="0" y="-1.5" width="${len}" height="3" rx="1.5" fill="#5b7a3a"/>`;
  for (let i = 8; i < len; i += 10) s += leaf(i, -5, leafS, -35, c) + leaf(i + 4, 5, leafS, 35, c);
  return `${s}</g>`;
}
const lemonSlice = (x, y, r) => {
  let s = `<circle cx="${x}" cy="${y}" r="${r}" fill="#f4cf3f"/><circle cx="${x}" cy="${y}" r="${r1(r * 0.82)}" fill="#fbe68b"/>`;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    s += `<line x1="${x}" y1="${y}" x2="${r1(x + Math.cos(a) * r * 0.8)}" y2="${r1(y + Math.sin(a) * r * 0.8)}" stroke="#fff6cf" stroke-width="2"/>`;
  }
  return s;
};
const lemonWedge = (x, y, s, rot, c = '#f4cf3f', flesh = '#fbe68b') => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M${-s} 0A${s} ${s} 0 0 0 ${s} 0Z" fill="${c}"/><path d="M${r1(-s * 0.8)} 0A${r1(s * 0.8)} ${r1(s * 0.8)} 0 0 0 ${r1(s * 0.8)} 0Z" fill="${flesh}"/></g>`;
const garlicClove = (x, y, rot) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="5.5" fill="#f3ead2" transform="rotate(${rot} ${x} ${y})"/>`;
const thigh = (x, y, rot, s = 1) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M-34 -4C-34 -22 -10 -28 8 -24S36 -10 34 4 14 26-6 24-34 14-34-4Z" fill="#b8742e"/><path d="M-26 -6C-24 -18-6 -22 8 -18S28-6 26 4 10 18-6 16-26 8-26-6Z" fill="#d99a45"/><ellipse cx="-4" cy="-6" rx="10" ry="5" fill="#e9b766"/><circle cx="12" cy="6" r="3" fill="#9c5f23"/><circle cx="-14" cy="8" r="2.5" fill="#9c5f23"/></g>`;
const pea = (x, y, r = 4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#7bbf4a"/>`;
const cube = (x, y, s, c, rot) => `<rect x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" rx="2" fill="${c}" transform="rotate(${Math.round(rot)} ${x} ${y})"/>`;
const grain = (x, y, rot, c = '#fffaf0') => `<ellipse cx="${x}" cy="${y}" rx="4.2" ry="2" fill="${c}" transform="rotate(${Math.round(rot)} ${x} ${y})"/>`;
function scatter(rand, n, area, fn) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const [x, y] = area();
    s += fn(x, y, rand() * 180, i);
  }
  return s;
}
const floret = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-4" y="2" width="8" height="16" rx="3" fill="#8bbf5a"/><circle cx="-8" cy="-2" r="9" fill="#3f8f3a"/><circle cx="8" cy="-2" r="9" fill="#3f8f3a"/><circle cx="0" cy="-9" r="10" fill="#4aa043"/><circle cx="-3" cy="-11" r="3" fill="#6cc05a"/></g>`;
const beefStrip = (x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${Math.round(rot)})"><path d="M-22-8C-8-12 10-11 22-6 24 2 20 8 16 9 2 12-12 11-22 7-25 2-25-4-22-8Z" fill="#6b3421"/><path d="M-14-4C-4-7 6-6 14-3" fill="none" stroke="#9a5634" stroke-width="3" stroke-linecap="round"/></g>`;
const bean = (x, y, rot, c = '#5e9c3a', len = 48) => `<g transform="translate(${x} ${y}) rotate(${Math.round(rot)})"><rect x="${-len / 2}" y="-4" width="${len}" height="8" rx="4" fill="${c}"/><rect x="${-len / 2 + 6}" y="-2" width="${len - 20}" height="2" rx="1" fill="#86c25a"/></g>`;
const egg = (x, y, r = 22) => `<path d="M${x - r} ${y}C${x - r} ${y - r * 0.9} ${x + r * 0.2} ${y - r * 1.1} ${x + r} ${y - r * 0.3}S${x + r * 0.6} ${y + r} ${x - r * 0.1} ${y + r * 0.95} ${x - r} ${y + r * 0.6} ${x - r} ${y}Z" fill="#fffdf6"/><circle cx="${x + 1}" cy="${y}" r="${r1(r * 0.42)}" fill="#f5b12a"/><circle cx="${r1(x - r * 0.1)}" cy="${r1(y - r * 0.12)}" r="${r1(r * 0.12)}" fill="#fbd67a"/>`;
const chickpea = (x, y, r = 6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#e3bb6f"/><circle cx="${x - 1.5}" cy="${y - 1.5}" r="${r1(r * 0.4)}" fill="#f0d496"/>`;
const potato = (x, y, rot, s = 1) => `<g transform="translate(${x} ${y}) rotate(${Math.round(rot)}) scale(${s})"><path d="M-18-10 6-16 20-4 16 14-8 16-20 4Z" fill="#c98a2e"/><path d="M-13-7 5-11 15-2 12 10-6 11-15 3Z" fill="#e8b451"/></g>`;
const noodle = (x, y, len, rot, c = '#f1d388') => `<path d="M${x} ${y}c${r1(len * 0.3)} -18 ${r1(len * 0.6)} 18 ${len} 0" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round" transform="rotate(${Math.round(rot)} ${x} ${y})"/>`;
const stick = (x, y, len, rot, c) => `<rect x="${x}" y="${y - 3}" width="${len}" height="6" rx="3" fill="${c}" transform="rotate(${Math.round(rot)} ${x} ${y})"/>`;

// ---------- Compositions ----------
const COMPOSE = {
  'lemon-garlic-chicken-thighs'(rand) {
    let s = skillet(185, 150, 112);
    s += thigh(145, 118, -15) + thigh(222, 112, 20) + thigh(140, 188, 10) + thigh(222, 185, -25);
    s += lemonSlice(185, 150, 17) + lemonSlice(262, 150, 13) + lemonSlice(108, 152, 13);
    s += garlicClove(182, 95, 30) + garlicClove(185, 207, -20) + garlicClove(255, 222, 10);
    s += sprig(160, 150, 42, -70) + sprig(232, 146, 40, 110);
    return s;
  },
  'chicken-fried-rice'(rand) {
    let s = bowl(200, 150, 118, '#f0d28a');
    s += scatter(rand, 90, () => inCircle(rand, 200, 150, 88), (x, y, r) => grain(x, y, r, '#fff3cf'));
    s += scatter(rand, 16, () => inCircle(rand, 200, 150, 80), (x, y, r) => cube(x, y, 13, '#d9a35c', r));
    s += scatter(rand, 12, () => inCircle(rand, 200, 150, 82), (x, y) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="6" fill="#f7d65a"/>`);
    s += scatter(rand, 18, () => inCircle(rand, 200, 150, 84), (x, y) => pea(x, y));
    s += scatter(rand, 12, () => inCircle(rand, 200, 150, 84), (x, y, r) => cube(x, y, 7, '#f08a33', r));
    s += scatter(rand, 10, () => inCircle(rand, 200, 150, 84), (x, y) => `<circle cx="${x}" cy="${y}" r="4.5" fill="none" stroke="#5aa54a" stroke-width="2.5"/>`);
    s += `<rect x="318" y="60" width="9" height="190" rx="4" fill="#b98a55" transform="rotate(14 322 155)"/><rect x="336" y="60" width="9" height="190" rx="4" fill="#a87a47" transform="rotate(18 340 155)"/>`;
    return s;
  },
  'one-pan-chicken-and-rice'(rand) {
    let s = skillet(185, 150, 115, '#e7b84a');
    s += scatter(rand, 90, () => inCircle(rand, 185, 150, 98), (x, y, r) => grain(x, y, r, '#f6d77a'));
    s += thigh(145, 120, 10, 0.9) + thigh(225, 120, -20, 0.9) + thigh(185, 190, 5, 0.9);
    s += scatter(rand, 16, () => inCircle(rand, 185, 150, 95), (x, y) => pea(x, y, 4.5));
    s += lemonWedge(115, 195, 20, 30) + scatter(rand, 8, () => inCircle(rand, 185, 150, 90), (x, y, r) => leaf(x, y, 5, r, '#3f8a3c'));
    return s;
  },
  'beef-and-broccoli'(rand) {
    let s = napkin(20, 190, 110, 80, '#c95b4a') + plate(185, 148, 116);
    s += scatter(rand, 16, () => inCircle(rand, 180, 150, 66), (x, y, r) => beefStrip(x, y, r));
    s += floret(125, 112) + floret(205, 95, 0.95) + floret(248, 150) + floret(150, 205, 0.95) + floret(210, 205) + floret(118, 165, 0.85) + floret(180, 150, 0.8);
    s += scatter(rand, 12, () => inCircle(rand, 185, 150, 70), (x, y) => `<circle cx="${x}" cy="${y}" r="2" fill="#f4eee0"/>`);
    s += bowl(330, 225, 52, '#fbf7ee') + scatter(rand, 30, () => inCircle(rand, 330, 225, 36), (x, y, r) => grain(x, y, r, '#fff'));
    return s;
  },
  'sheet-pan-salmon-and-green-beans'(rand) {
    let s = sheetPan(35, 45, 330, 210);
    for (let i = 0; i < 22; i++) s += bean(70 + (i % 11) * 26, i < 11 ? 85 : 220, 70 + rand() * 40);
    const fillet = (x, y) => `<rect x="${x}" y="${y}" width="96" height="62" rx="18" fill="#e9775a"/><rect x="${x + 6}" y="${y + 6}" width="84" height="50" rx="14" fill="#f39277"/>${[0, 1, 2, 3].map((i) => `<path d="M${x + 22 + i * 18} ${y + 10}q8 21 0 42" fill="none" stroke="#fbc3ae" stroke-width="3"/>`).join('')}<rect x="${x + 10}" y="${y + 8}" width="76" height="18" rx="9" fill="#e5b64a" opacity=".55"/>`;
    s += fillet(92, 118) + fillet(210, 118);
    s += lemonSlice(80, 150, 14) + lemonSlice(328, 150, 14) + scatter(rand, 12, () => [r1(100 + rand() * 200), r1(122 + rand() * 50)], (x, y, r) => leaf(x, y, 4, r, '#3f8a3c'));
    return s;
  },
  'weeknight-beef-tacos'(rand) {
    let s = `<rect x="25" y="70" width="350" height="190" rx="22" fill="#000" opacity=".08"/><rect x="20" y="62" width="350" height="190" rx="22" fill="#c9965e"/><rect x="30" y="72" width="330" height="170" rx="16" fill="#d8a870"/>`;
    const taco = (x) => {
      let t = `<path d="M${x - 50} 200A50 50 0 0 1 ${x + 50} 200Z" fill="#e8b34f"/>`;
      t += scatter(rand, 8, () => [r1(x - 36 + rand() * 72), r1(160 + rand() * 18)], (px, py) => `<circle cx="${px}" cy="${py}" r="9" fill="#7a3f22"/>`);
      t += scatter(rand, 7, () => [r1(x - 38 + rand() * 76), r1(150 + rand() * 12)], (px, py, r) => leaf(px, py, 9, r, '#7cc05a'));
      t += scatter(rand, 8, () => [r1(x - 32 + rand() * 64), r1(148 + rand() * 12)], (px, py, r) => stick(px, py, 12, r, '#f6c945'));
      t += `<path d="M${x - 50} 200A50 50 0 0 1 ${x + 50} 200" fill="none" stroke="#d99c35" stroke-width="10"/><rect x="${x - 55}" y="196" width="110" height="10" rx="5" fill="#e8b34f"/>`;
      return t;
    };
    s += taco(90) + taco(195) + taco(300);
    s += lemonWedge(330, 110, 22, 200, '#6aa84f', '#b9df8a') + scatter(rand, 5, () => [r1(60 + rand() * 60), r1(95 + rand() * 20)], (x, y, r) => leaf(x, y, 6, r, '#3f8a3c'));
    return s;
  },
  shakshuka(rand) {
    let s = skillet(185, 150, 115, '#c23f2c');
    s += scatter(rand, 24, () => inCircle(rand, 185, 150, 95), (x, y) => `<circle cx="${x}" cy="${y}" r="${r1(4 + rand() * 6)}" fill="#d9573c"/>`);
    s += scatter(rand, 10, () => inCircle(rand, 185, 150, 95), (x, y, r) => stick(x, y, 14, r, '#a8322a'));
    s += egg(150, 115, 24) + egg(225, 118, 24) + egg(145, 190, 24) + egg(225, 190, 24) + egg(186, 152, 20);
    s += scatter(rand, 14, () => inCircle(rand, 185, 150, 95), (x, y, r) => leaf(x, y, 5, r, '#3e8a3a'));
    s += scatter(rand, 8, () => inCircle(rand, 185, 150, 90), (x, y, r) => cube(x, y, 7, '#fbf8f1', r));
    return s;
  },
  'crispy-roasted-potatoes'(rand) {
    let s = sheetPan(40, 50, 320, 200);
    for (let i = 0; i < 18; i++) s += potato(88 + (i % 6) * 45 + rand() * 8, 95 + Math.floor(i / 6) * 55 + rand() * 8, rand() * 360, 1.05);
    s += sprig(100, 245, 70, -30, '#3c6e3a', 5) + sprig(250, 70, 70, 20, '#3c6e3a', 5);
    s += scatter(rand, 20, () => [r1(70 + rand() * 260), r1(80 + rand() * 150)], (x, y) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#6b4a1f"/>`);
    return s;
  },
  'tomato-basil-soup'(rand) {
    let s = napkin(250, 190, 120, 80, '#6d9bc3') + bowl(185, 145, 115, '#d9492f');
    s += `<path d="M150 145c10-30 60-30 70 0s-40 30-50 10 10-25 30-15" fill="none" stroke="#fbe9dc" stroke-width="7" stroke-linecap="round"/>`;
    s += leaf(210, 110, 14, -30, '#3f8f3a') + leaf(228, 118, 12, 20, '#4aa043') + leaf(140, 185, 10, 40, '#3f8f3a');
    s += scatter(rand, 16, () => inCircle(rand, 185, 145, 85), (x, y) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#8a2a1c"/>`);
    return s;
  },
  'red-lentil-soup'(rand) {
    let s = bowl(180, 150, 115, '#df8f35');
    s += scatter(rand, 40, () => inCircle(rand, 180, 150, 85), (x, y) => `<circle cx="${x}" cy="${y}" r="${r1(2 + rand() * 2)}" fill="#e9a54f"/>`);
    s += `<path d="M130 160c20-10 50-10 80 5" fill="none" stroke="#c9a23a" stroke-width="5" stroke-linecap="round" opacity=".7"/>`;
    s += scatter(rand, 16, () => inCircle(rand, 180, 150, 70), (x, y, r) => leaf(x, y, 5, r, '#3f8a3c'));
    s += scatter(rand, 10, () => inCircle(rand, 180, 150, 70), (x, y) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#9b2f1d"/>`);
    s += lemonWedge(320, 230, 30, 160);
    return s;
  },
  'chickpea-salad-sandwiches'(rand) {
    let s = plate(200, 152, 118);
    const half = (dx, rot) => {
      let h = `<g transform="translate(${dx} 152) rotate(${rot})"><path d="M-70 40L0-70 70 40Z" fill="#c9974f"/><path d="M-58 33L0-58 58 33Z" fill="#efd6a3"/>`;
      h += `<path d="M-70 40L70 40 70 52-70 52Z" fill="#7cc05a"/>`;
      h += `<path d="M-66 52L66 52 66 70-66 70Z" fill="#e8c98a"/>`;
      for (let i = 0; i < 9; i++) h += chickpea(-54 + i * 13, 60, 5.5);
      h += `<path d="M-70 70L70 70 70 82-70 82Z" fill="#c9974f"/></g>`;
      return h;
    };
    s += half(140, -8) + half(262, 10);
    return s;
  },
  'black-bean-quesadillas'(rand) {
    let s = napkin(20, 30, 110, 80, '#e0b43c') + plate(175, 155, 118);
    const wedge = (rot) => {
      let w = `<g transform="translate(175 155) rotate(${rot})"><path d="M8 0L100 -38A100 100 0 0 1 100 38Z" fill="#e6b865"/><path d="M14 0L96 -30A92 92 0 0 1 96 30Z" fill="#efcb85"/>`;
      w += `<path d="M20 0L100 -8 100 8Z" fill="#f6d35e"/><circle cx="60" cy="-3" r="4" fill="#2b2320"/><circle cx="78" cy="3" r="4" fill="#2b2320"/><circle cx="46" cy="2" r="3.5" fill="#f5c542"/></g>`;
      return w;
    };
    for (let i = 0; i < 6; i++) s += wedge(i * 60 + 10);
    s += bowl(335, 215, 50, '#c8412f') + scatter(rand, 14, () => inCircle(rand, 335, 215, 34), (x, y, r) => cube(x, y, 6, rand() > 0.5 ? '#e46a45' : '#f2e9d8', r));
    return s;
  },
  'peanut-sesame-noodles'(rand) {
    let s = bowl(185, 152, 118, '#d9a45a');
    s += scatter(rand, 30, () => inCircle(rand, 185, 152, 80), (x, y, r) => noodle(x, y, 30 + rand() * 20, r, rand() > 0.5 ? '#e7b865' : '#f0c877'));
    s += scatter(rand, 9, () => inCircle(rand, 185, 152, 70), (x, y, r) => stick(x, y, 30, r, '#6fb04d'));
    s += scatter(rand, 9, () => inCircle(rand, 185, 152, 70), (x, y, r) => stick(x, y, 28, r, '#f08a33'));
    s += scatter(rand, 30, () => inCircle(rand, 185, 152, 88), (x, y, r) => `<ellipse cx="${x}" cy="${y}" rx="2.2" ry="1.3" fill="#fffaf0" transform="rotate(${Math.round(r)} ${x} ${y})"/>`);
    s += scatter(rand, 10, () => inCircle(rand, 185, 152, 80), (x, y) => `<circle cx="${x}" cy="${y}" r="4" fill="none" stroke="#5aa54a" stroke-width="2.5"/>`);
    s += `<rect x="300" y="40" width="9" height="200" rx="4" fill="#2c2c30" transform="rotate(20 304 140)"/><rect x="318" y="40" width="9" height="200" rx="4" fill="#3c3c42" transform="rotate(24 322 140)"/>`;
    return s;
  },
  'spaghetti-aglio-e-olio'(rand) {
    let s = fork(340, 150, 25) + plate(185, 150, 118);
    for (let i = 0; i < 9; i++) s += `<circle cx="185" cy="150" r="${14 + i * 8}" fill="none" stroke="${i % 2 ? '#edd07a' : '#f3d98c'}" stroke-width="6" stroke-dasharray="${60 + i * 12} 14" transform="rotate(${i * 37} 185 150)"/>`;
    s += scatter(rand, 12, () => inCircle(rand, 185, 150, 75), (x, y, r) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="4" fill="#fbf1d4" stroke="#e1c27b" stroke-width="1.5" transform="rotate(${Math.round(r)} ${x} ${y})"/>`);
    s += scatter(rand, 26, () => inCircle(rand, 185, 150, 80), (x, y, r) => leaf(x, y, 3.5, r, '#3f8a3c'));
    s += scatter(rand, 18, () => inCircle(rand, 185, 150, 80), (x, y) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#c0392b"/>`);
    return s;
  },
  'one-pot-tomato-spinach-pasta'(rand) {
    let s = `${shadow(190, 160, 128, 118)}<rect x="44" y="140" width="40" height="18" rx="9" fill="#34495e"/><rect x="296" y="140" width="40" height="18" rx="9" fill="#34495e"/><circle cx="190" cy="150" r="120" fill="#34495e"/><circle cx="190" cy="150" r="106" fill="#c2412e"/>`;
    s += scatter(rand, 26, () => inCircle(rand, 190, 150, 90), (x, y, r) => `<g transform="rotate(${Math.round(r)} ${x} ${y})"><rect x="${x - 13}" y="${y - 6}" width="26" height="12" rx="3" fill="#e9a444"/><rect x="${x - 13}" y="${y - 2}" width="26" height="3" fill="#d88a2e"/></g>`);
    s += scatter(rand, 12, () => inCircle(rand, 190, 150, 85), (x, y, r) => leaf(x, y, 12, r, '#2f7a34'));
    s += scatter(rand, 20, () => inCircle(rand, 190, 150, 85), (x, y) => `<circle cx="${x}" cy="${y}" r="2" fill="#fbf4e3"/>`);
    return s;
  },
  'three-bean-chili'(rand) {
    let s = bowl(185, 150, 118, '#9a3b22');
    const colors = ['#6d1f1f', '#2a2322', '#caa27a'];
    s += scatter(rand, 40, () => inCircle(rand, 185, 150, 88), (x, y, r, i) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="5" fill="${colors[i % 3]}" transform="rotate(${Math.round(r)} ${x} ${y})"/>`);
    s += scatter(rand, 9, () => inCircle(rand, 185, 150, 50), (x, y, r) => cube(x, y, 13, '#9ccf6a', r));
    s += scatter(rand, 14, () => inCircle(rand, 185, 150, 80), (x, y, r) => leaf(x, y, 5, r, '#3f8a3c'));
    s += lemonWedge(335, 235, 28, 150, '#6aa84f', '#b9df8a');
    return s;
  },
  'classic-pancakes'(rand) {
    let s = plate(200, 190, 110, '#fbfaf6', '#f1eee6');
    for (let i = 0; i < 5; i++) {
      const y = 205 - i * 22;
      s += `<ellipse cx="200" cy="${y + 8}" rx="92" ry="26" fill="#c98a3a"/><ellipse cx="200" cy="${y}" rx="92" ry="26" fill="#e7b25e"/>`;
    }
    s += `<ellipse cx="200" cy="117" rx="88" ry="23" fill="#f0c476"/><rect x="182" y="96" width="36" height="22" rx="4" fill="#fbe6a2"/><rect x="182" y="96" width="36" height="8" rx="4" fill="#fff3c9"/>`;
    s += `<path d="M140 118c-8 30-4 50-2 70m122-72c6 20 4 40 0 58" fill="none" stroke="#9a4f15" stroke-width="7" stroke-linecap="round" opacity=".85"/><path d="M150 112c20 14 80 14 100 0" fill="none" stroke="#9a4f15" stroke-width="8" stroke-linecap="round" opacity=".85"/>`;
    return s;
  },
  'overnight-oats'(rand) {
    let s = `<ellipse cx="205" cy="268" rx="80" ry="12" fill="#000" opacity=".09"/>`;
    s += `<rect x="130" y="80" width="150" height="185" rx="22" fill="#e6eef0" opacity=".9"/><rect x="140" y="140" width="130" height="115" rx="14" fill="#e3d2b0"/>`;
    s += scatter(rand, 40, () => [r1(146 + rand() * 118), r1(150 + rand() * 98)], (x, y, r) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="2.5" fill="#cdb488" transform="rotate(${Math.round(r)} ${x} ${y})"/>`);
    s += `<rect x="140" y="126" width="130" height="18" rx="6" fill="#f3ead6"/>`;
    s += scatter(rand, 9, () => [r1(152 + rand() * 106), r1(116 + rand() * 12)], (x, y) => `<circle cx="${x}" cy="${y}" r="9" fill="#3b4f9a"/><circle cx="${x - 2}" cy="${y - 3}" r="2.5" fill="#6d80c6"/>`);
    s += scatter(rand, 5, () => [r1(155 + rand() * 100), r1(112 + rand() * 12)], (x, y) => `<circle cx="${x}" cy="${y}" r="10" fill="#d33c4a"/>`);
    s += `<rect x="124" y="72" width="162" height="16" rx="8" fill="#c9d3d6"/><rect x="138" y="96" width="10" height="150" rx="5" fill="#fff" opacity=".45"/>`;
    s += `<path d="M300 250c20-40 60-50 80-30" fill="none" stroke="#f3d64e" stroke-width="18" stroke-linecap="round"/>`;
    return s;
  },
  'banana-oat-muffins'(rand) {
    let s = `<ellipse cx="200" cy="262" rx="160" ry="14" fill="#000" opacity=".09"/>`;
    const muffin = (x, y, sc) => {
      let m = `<g transform="translate(${x} ${y}) scale(${sc})"><path d="M-44 0L44 0 34 62-34 62Z" fill="#e4d8c3"/>${[-30, -15, 0, 15, 30].map((d) => `<path d="M${d} 2L${d * 0.78} 60" stroke="#cdbfa6" stroke-width="3"/>`).join('')}`;
      m += `<path d="M-52 4C-58-40 58-40 52 4Z" fill="#b87735"/><path d="M-44-2C-46-32 46-32 44-2Z" fill="#d49a4f"/>`;
      for (let i = 0; i < 10; i++) m += `<ellipse cx="${r1(-34 + rand() * 68)}" cy="${r1(-22 + rand() * 18)}" rx="4" ry="2.4" fill="#f1dfb6" transform="rotate(${Math.round(rand() * 180)})"/>`;
      return `${m}</g>`;
    };
    s += muffin(110, 185, 1) + muffin(290, 185, 1) + muffin(200, 170, 1.15);
    s += `<path d="M60 90c40 40 120 40 170 5" fill="none" stroke="#f3d24e" stroke-width="22" stroke-linecap="round"/><path d="M60 90c-6-6-10-12-12-18" stroke="#6b5a2e" stroke-width="6" stroke-linecap="round"/>`;
    return s;
  },
  'chocolate-chip-cookies'(rand) {
    let s = plate(200, 152, 120);
    const cookie = (x, y, r) => {
      let c = `<circle cx="${x + 2}" cy="${y + 4}" r="${r}" fill="#000" opacity=".08"/><circle cx="${x}" cy="${y}" r="${r}" fill="#c98f4c"/><circle cx="${x}" cy="${y}" r="${r - 6}" fill="#dca864"/>`;
      c += scatter(rand, 8, () => inCircle(rand, x, y, r - 10), (px, py) => `<ellipse cx="${px}" cy="${py}" rx="5" ry="4" fill="#4a2a1a"/>`);
      return c;
    };
    s += cookie(150, 110, 42) + cookie(245, 110, 42) + cookie(125, 195, 40) + cookie(210, 200, 42) + cookie(282, 185, 36);
    return s;
  },
  'fudgy-brownies'(rand) {
    let s = `<rect x="55" y="45" width="290" height="220" rx="12" fill="#000" opacity=".09"/><rect x="50" y="38" width="290" height="220" rx="12" fill="#f4efe6"/>`;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        const x = 64 + c * 68 + (r === 1 && c === 2 ? 8 : 0);
        const y = 52 + r * 66 + (r === 1 && c === 2 ? 14 : 0);
        s += `<rect x="${x}" y="${y}" width="62" height="60" rx="5" fill="#3d2418"/><rect x="${x + 4}" y="${y + 4}" width="54" height="52" rx="4" fill="#5a3726"/>`;
        s += `<path d="M${x + 10} ${y + 20}l12-6 10 8 14-5M${x + 12} ${y + 40}l10 4 12-7 12 5" fill="none" stroke="#7a4f37" stroke-width="2.5" stroke-linecap="round"/>`;
      }
    }
    return s;
  },
  'apple-crisp'(rand) {
    let s = `<rect x="55" y="50" width="300" height="210" rx="28" fill="#000" opacity=".09"/><rect x="45" y="40" width="300" height="210" rx="28" fill="#f7f4ee"/><rect x="62" y="57" width="266" height="176" rx="18" fill="#b8742e"/>`;
    s += scatter(rand, 60, () => [r1(76 + rand() * 238), r1(70 + rand() * 150)], (x, y) => `<circle cx="${x}" cy="${y}" r="${r1(7 + rand() * 7)}" fill="${rand() > 0.5 ? '#d9a04f' : '#e8b866'}"/>`);
    s += scatter(rand, 30, () => [r1(76 + rand() * 238), r1(70 + rand() * 150)], (x, y, r) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="2.4" fill="#f5e3bb" transform="rotate(${Math.round(r)} ${x} ${y})"/>`);
    s += `<path d="M90 225c20-12 40-12 60 0" fill="none" stroke="#f2e2a6" stroke-width="10" stroke-linecap="round"/><path d="M250 80c20 8 40 8 55 0" fill="none" stroke="#f2e2a6" stroke-width="10" stroke-linecap="round"/>`;
    s += `<circle cx="360" cy="245" r="30" fill="#c63b2e"/><circle cx="352" cy="236" r="8" fill="#e0685b"/><rect x="358" y="205" width="5" height="16" rx="2" fill="#6b4a2a"/>${leaf(372, 212, 10, -30, '#4f9a45')}`;
    return s;
  },
  'stovetop-rice-pudding'(rand) {
    let s = napkin(240, 30, 130, 90, '#8fb6d6') + bowl(185, 155, 115, '#f5ead0');
    s += scatter(rand, 70, () => inCircle(rand, 185, 155, 86), (x, y, r) => grain(x, y, r, '#fffaf0'));
    s += scatter(rand, 40, () => inCircle(rand, 185, 155, 40), (x, y) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#9a5a2a"/>`);
    s += `<rect x="298" y="160" width="84" height="16" rx="8" fill="#c9ccd1" transform="rotate(35 340 168)"/><ellipse cx="300" cy="140" rx="20" ry="14" fill="#c9ccd1" transform="rotate(35 300 140)"/>`;
    s += scatter(rand, 6, () => inCircle(rand, 185, 155, 70), (x, y, r) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="3.5" fill="#6b3a24" transform="rotate(${Math.round(r)} ${x} ${y})"/>`);
    return s;
  },
  'coconut-chickpea-curry'(rand) {
    let s = bowl(165, 150, 118, '#e2a032');
    s += `<path d="M110 120c30-20 80-10 100 15" fill="none" stroke="#f3cf7a" stroke-width="8" stroke-linecap="round" opacity=".8"/>`;
    s += scatter(rand, 30, () => inCircle(rand, 165, 150, 86), (x, y) => chickpea(x, y, 7));
    s += scatter(rand, 10, () => inCircle(rand, 165, 150, 80), (x, y, r) => leaf(x, y, 13, r, '#2f7a34'));
    s += scatter(rand, 12, () => inCircle(rand, 165, 150, 80), (x, y, r) => leaf(x, y, 4, r, '#5aa84a'));
    s += bowl(330, 220, 55, '#fbf7ee') + scatter(rand, 34, () => inCircle(rand, 330, 220, 40), (x, y, r) => grain(x, y, r, '#fff'));
    s += lemonWedge(330, 80, 26, 30, '#6aa84f', '#b9df8a');
    return s;
  },
};

// Backgrounds: gentle hues by meal type, varied per dish.
const BACKGROUNDS = {
  'lemon-garlic-chicken-thighs': '#f3dccb', 'chicken-fried-rice': '#f5e2c4', 'one-pan-chicken-and-rice': '#dfe9d4', 'beef-and-broccoli': '#e8e1d2',
  'sheet-pan-salmon-and-green-beans': '#dbe7ef', 'weeknight-beef-tacos': '#f4e3c0', shakshuka: '#e9dccb', 'crispy-roasted-potatoes': '#e3e8d6',
  'tomato-basil-soup': '#f1e0cf', 'red-lentil-soup': '#dde8e0', 'chickpea-salad-sandwiches': '#e2ecd5', 'black-bean-quesadillas': '#f2d9cc',
  'peanut-sesame-noodles': '#f0e6cc', 'spaghetti-aglio-e-olio': '#e5e0ee', 'one-pot-tomato-spinach-pasta': '#f3e6d3', 'three-bean-chili': '#efdcc9',
  'classic-pancakes': '#f6e7c8', 'overnight-oats': '#e8e2f0', 'banana-oat-muffins': '#dfe8ef', 'chocolate-chip-cookies': '#f2dfd0',
  'fudgy-brownies': '#e6dcef', 'apple-crisp': '#f2e4c9', 'stovetop-rice-pudding': '#efe3d6', 'coconut-chickpea-curry': '#dfeadd',
};

const TITLES = {
  'lemon-garlic-chicken-thighs': 'Chicken thighs in a skillet with lemon, garlic and thyme',
  'chicken-fried-rice': 'A bowl of chicken fried rice with peas, carrot, egg and green onion',
  'one-pan-chicken-and-rice': 'A pan of golden rice topped with chicken thighs, peas and a lemon wedge',
  'beef-and-broccoli': 'Beef strips and broccoli on a plate beside a bowl of rice',
  'sheet-pan-salmon-and-green-beans': 'Two salmon fillets with green beans and lemon on a sheet pan',
  'weeknight-beef-tacos': 'Three beef tacos with lettuce and cheese and a lime wedge on a board',
  shakshuka: 'Eggs baked in a red tomato and pepper sauce in a skillet, with herbs',
  'crispy-roasted-potatoes': 'Golden roasted potato chunks with rosemary on a sheet pan',
  'tomato-basil-soup': 'A bowl of tomato soup with a cream swirl and basil leaves',
  'red-lentil-soup': 'A bowl of golden lentil soup with parsley and a lemon wedge',
  'chickpea-salad-sandwiches': 'A chickpea salad sandwich cut in half on a plate',
  'black-bean-quesadillas': 'Quesadilla wedges with melted cheese and black beans, with a bowl of salsa',
  'peanut-sesame-noodles': 'A bowl of peanut noodles with cucumber, carrot, sesame seeds and chopsticks',
  'spaghetti-aglio-e-olio': 'A plate of spaghetti with sliced garlic, parsley and chili flakes',
  'one-pot-tomato-spinach-pasta': 'A pot of short pasta in tomato sauce with spinach',
  'three-bean-chili': 'A bowl of bean chili with avocado and cilantro and a lime wedge',
  'classic-pancakes': 'A stack of pancakes with butter and maple syrup',
  'overnight-oats': 'A jar of overnight oats topped with berries, beside a banana',
  'banana-oat-muffins': 'Three banana oat muffins with a banana',
  'chocolate-chip-cookies': 'Chocolate chip cookies on a plate',
  'fudgy-brownies': 'A tray of brownies cut into squares',
  'apple-crisp': 'A baking dish of apple crisp with a crumbly golden topping, beside an apple',
  'stovetop-rice-pudding': 'A bowl of creamy rice pudding dusted with cinnamon, with a spoon',
  'coconut-chickpea-curry': 'A bowl of chickpea and spinach curry beside a bowl of rice',
};

export function renderIllustration(id) {
  const body = COMPOSE[id](rng(id));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><title>${TITLES[id]}</title><rect width="${W}" height="${H}" fill="${BACKGROUNDS[id]}"/>${body}</svg>\n`;
}

export const ILLUSTRATION_IDS = Object.keys(COMPOSE);
export { TITLES, BACKGROUNDS };

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('scripts/illustrations.mjs')) {
  const dir = join(ROOT, 'src', 'illustrations');
  mkdirSync(dir, { recursive: true });
  for (const id of ILLUSTRATION_IDS) writeFileSync(join(dir, `${id}.svg`), renderIllustration(id));
  console.log(`Wrote ${ILLUSTRATION_IDS.length} illustrations to src/illustrations/`);
}
