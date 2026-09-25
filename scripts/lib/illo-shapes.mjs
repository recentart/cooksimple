// Shared drawing primitives for the recipe illustrations (flat vector
// shapes as SVG strings). Used by scripts/illustrations.mjs and
// scripts/lib/illo-kinds.mjs.

export const W = 400;
export const H = 300;
export const r1 = (n) => Math.round(n * 10) / 10;

export function rng(seed) {
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
export const inCircle = (rand, cx, cy, r) => {
  const a = rand() * Math.PI * 2;
  const d = Math.sqrt(rand()) * r;
  return [r1(cx + Math.cos(a) * d), r1(cy + Math.sin(a) * d)];
};

// ---------- Vessels ----------
export const shadow = (cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000" opacity=".09"/>`;
export const plate = (cx, cy, r, rim = '#fbfaf6', well = '#efece4') => `${shadow(cx + 4, cy + 8, r, r)}<circle cx="${cx}" cy="${cy}" r="${r}" fill="${rim}"/><circle cx="${cx}" cy="${cy}" r="${r1(r * 0.8)}" fill="${well}"/>`;
export const bowl = (cx, cy, r, food, rim = '#fbfaf6') => `${shadow(cx + 4, cy + 8, r, r)}<circle cx="${cx}" cy="${cy}" r="${r}" fill="${rim}"/><circle cx="${cx}" cy="${cy}" r="${r1(r * 0.84)}" fill="#e6e1d6"/><circle cx="${cx}" cy="${cy}" r="${r1(r * 0.8)}" fill="${food}"/>`;
export const skillet = (cx, cy, r, inner = '#3a3a3f') => `${shadow(cx + 4, cy + 8, r, r)}<rect x="${cx + r - 6}" y="${cy - 9}" width="${r1(r * 0.75)}" height="18" rx="9" fill="#2a2a2e"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#2a2a2e"/><circle cx="${cx}" cy="${cy}" r="${r - 10}" fill="${inner}"/>`;
export const sheetPan = (x, y, w, h) => `<rect x="${x + 5}" y="${y + 9}" width="${w}" height="${h}" rx="14" fill="#000" opacity=".09"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="#a9adb4"/><rect x="${x + 9}" y="${y + 9}" width="${w - 18}" height="${h - 18}" rx="8" fill="#c7cbd1"/>`;
export const napkin = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${c}" transform="rotate(-8 ${x + w / 2} ${y + h / 2})"/>`;
export const fork = (x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})" fill="#c9ccd1"><rect x="-3.5" y="0" width="7" height="92" rx="3.5"/><rect x="-11" y="-30" width="22" height="34" rx="6"/><rect x="-10" y="-52" width="4" height="26" rx="2"/><rect x="-3" y="-52" width="4" height="26" rx="2"/><rect x="4" y="-52" width="4" height="26" rx="2"/></g>`;

// ---------- Food pieces ----------
export const leaf = (x, y, s, rot, c = '#4f9a45') => `<ellipse cx="${x}" cy="${y}" rx="${r1(s)}" ry="${r1(s * 0.45)}" fill="${c}" transform="rotate(${Math.round(rot)} ${x} ${y})"/>`;
export function sprig(x, y, len, rot, c = '#3f8a3c', leafS = 7) {
  let s = `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="0" y="-1.5" width="${len}" height="3" rx="1.5" fill="#5b7a3a"/>`;
  for (let i = 8; i < len; i += 10) s += leaf(i, -5, leafS, -35, c) + leaf(i + 4, 5, leafS, 35, c);
  return `${s}</g>`;
}
export const lemonSlice = (x, y, r) => {
  let s = `<circle cx="${x}" cy="${y}" r="${r}" fill="#f4cf3f"/><circle cx="${x}" cy="${y}" r="${r1(r * 0.82)}" fill="#fbe68b"/>`;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    s += `<line x1="${x}" y1="${y}" x2="${r1(x + Math.cos(a) * r * 0.8)}" y2="${r1(y + Math.sin(a) * r * 0.8)}" stroke="#fff6cf" stroke-width="2"/>`;
  }
  return s;
};
export const lemonWedge = (x, y, s, rot, c = '#f4cf3f', flesh = '#fbe68b') => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M${-s} 0A${s} ${s} 0 0 0 ${s} 0Z" fill="${c}"/><path d="M${r1(-s * 0.8)} 0A${r1(s * 0.8)} ${r1(s * 0.8)} 0 0 0 ${r1(s * 0.8)} 0Z" fill="${flesh}"/></g>`;
export const garlicClove = (x, y, rot) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="5.5" fill="#f3ead2" transform="rotate(${rot} ${x} ${y})"/>`;
export const thigh = (x, y, rot, s = 1) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M-34 -4C-34 -22 -10 -28 8 -24S36 -10 34 4 14 26-6 24-34 14-34-4Z" fill="#b8742e"/><path d="M-26 -6C-24 -18-6 -22 8 -18S28-6 26 4 10 18-6 16-26 8-26-6Z" fill="#d99a45"/><ellipse cx="-4" cy="-6" rx="10" ry="5" fill="#e9b766"/><circle cx="12" cy="6" r="3" fill="#9c5f23"/><circle cx="-14" cy="8" r="2.5" fill="#9c5f23"/></g>`;
export const pea = (x, y, r = 4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#7bbf4a"/>`;
export const cube = (x, y, s, c, rot) => `<rect x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" rx="2" fill="${c}" transform="rotate(${Math.round(rot)} ${x} ${y})"/>`;
export const grain = (x, y, rot, c = '#fffaf0') => `<ellipse cx="${x}" cy="${y}" rx="4.2" ry="2" fill="${c}" transform="rotate(${Math.round(rot)} ${x} ${y})"/>`;
export function scatter(rand, n, area, fn) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const [x, y] = area();
    s += fn(x, y, rand() * 180, i);
  }
  return s;
}
export const floret = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-4" y="2" width="8" height="16" rx="3" fill="#8bbf5a"/><circle cx="-8" cy="-2" r="9" fill="#3f8f3a"/><circle cx="8" cy="-2" r="9" fill="#3f8f3a"/><circle cx="0" cy="-9" r="10" fill="#4aa043"/><circle cx="-3" cy="-11" r="3" fill="#6cc05a"/></g>`;
export const beefStrip = (x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${Math.round(rot)})"><path d="M-22-8C-8-12 10-11 22-6 24 2 20 8 16 9 2 12-12 11-22 7-25 2-25-4-22-8Z" fill="#6b3421"/><path d="M-14-4C-4-7 6-6 14-3" fill="none" stroke="#9a5634" stroke-width="3" stroke-linecap="round"/></g>`;
export const bean = (x, y, rot, c = '#5e9c3a', len = 48) => `<g transform="translate(${x} ${y}) rotate(${Math.round(rot)})"><rect x="${-len / 2}" y="-4" width="${len}" height="8" rx="4" fill="${c}"/><rect x="${-len / 2 + 6}" y="-2" width="${len - 20}" height="2" rx="1" fill="#86c25a"/></g>`;
export const egg = (x, y, r = 22) => `<path d="M${x - r} ${y}C${x - r} ${y - r * 0.9} ${x + r * 0.2} ${y - r * 1.1} ${x + r} ${y - r * 0.3}S${x + r * 0.6} ${y + r} ${x - r * 0.1} ${y + r * 0.95} ${x - r} ${y + r * 0.6} ${x - r} ${y}Z" fill="#fffdf6"/><circle cx="${x + 1}" cy="${y}" r="${r1(r * 0.42)}" fill="#f5b12a"/><circle cx="${r1(x - r * 0.1)}" cy="${r1(y - r * 0.12)}" r="${r1(r * 0.12)}" fill="#fbd67a"/>`;
export const chickpea = (x, y, r = 6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#e3bb6f"/><circle cx="${x - 1.5}" cy="${y - 1.5}" r="${r1(r * 0.4)}" fill="#f0d496"/>`;
export const potato = (x, y, rot, s = 1) => `<g transform="translate(${x} ${y}) rotate(${Math.round(rot)}) scale(${s})"><path d="M-18-10 6-16 20-4 16 14-8 16-20 4Z" fill="#c98a2e"/><path d="M-13-7 5-11 15-2 12 10-6 11-15 3Z" fill="#e8b451"/></g>`;
export const noodle = (x, y, len, rot, c = '#f1d388') => `<path d="M${x} ${y}c${r1(len * 0.3)} -18 ${r1(len * 0.6)} 18 ${len} 0" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round" transform="rotate(${Math.round(rot)} ${x} ${y})"/>`;
export const stick = (x, y, len, rot, c) => `<rect x="${x}" y="${y - 3}" width="${len}" height="6" rx="3" fill="${c}" transform="rotate(${Math.round(rot)} ${x} ${y})"/>`;
