// Reusable illustration templates ("kinds"). Each kind draws one dish
// shape (a bowl, a pie, a sandwich...) from a small options object, so a
// recipe's illustration is one line in scripts/lib/illo-specs.mjs.
// Everything is drawn from the seeded rand, so output is deterministic.

import { r1, inCircle, shadow, plate, bowl, skillet, sheetPan, napkin, fork, leaf, sprig, lemonSlice, lemonWedge, garlicClove, thigh, pea, cube, grain, scatter, floret, beefStrip, bean, egg, chickpea, potato, noodle, stick } from './illo-shapes.mjs';

const rot = (x, y, r) => `transform="rotate(${Math.round(r)} ${x} ${y})"`;

// ---------- Toppings ("bits") ----------
// Each bit draws one small piece at (x, y) with rotation r and colour c.
const BITS = {
  leaf: (rand, x, y, r, c = '#3f8a3c') => leaf(x, y, 6, r, c),
  bigleaf: (rand, x, y, r, c = '#2f7a34') => leaf(x, y, 13, r, c),
  herb: (rand, x, y, r, c = '#3f8a3c') => leaf(x, y, 3.5, r, c),
  dot: (rand, x, y, r, c = '#c0392b') => `<circle cx="${x}" cy="${y}" r="2" fill="${c}"/>`,
  seed: (rand, x, y, r, c = '#fffaf0') => `<ellipse cx="${x}" cy="${y}" rx="2.2" ry="1.3" fill="${c}" ${rot(x, y, r)}/>`,
  crumb: (rand, x, y, r, c = '#e8b866') => `<circle cx="${x}" cy="${y}" r="${r1(3 + rand() * 4)}" fill="${c}"/>`,
  blob: (rand, x, y, r, c = '#d9573c') => `<circle cx="${x}" cy="${y}" r="${r1(5 + rand() * 6)}" fill="${c}"/>`,
  chunk: (rand, x, y, r, c = '#d9a35c') => cube(x, y, 14, c, r),
  dice: (rand, x, y, r, c = '#f08a33') => cube(x, y, 7, c, r),
  pea: (rand, x, y, r, c = '#7bbf4a') => pea(x, y, 4, c) .replace('#7bbf4a', c),
  grain: (rand, x, y, r, c = '#fffaf0') => grain(x, y, r, c),
  chickpea: (rand, x, y) => chickpea(x, y, 7),
  blackbean: (rand, x, y, r, c = '#2a2322') => `<ellipse cx="${x}" cy="${y}" rx="6" ry="4" fill="${c}" ${rot(x, y, r)}/>`,
  kidney: (rand, x, y, r, c = '#6d1f1f') => `<ellipse cx="${x}" cy="${y}" rx="8" ry="5" fill="${c}" ${rot(x, y, r)}/>`,
  greenbean: (rand, x, y, r, c = '#5e9c3a') => bean(x, y, r, c, 30),
  noodle: (rand, x, y, r, c = '#f1d388') => noodle(x, y, r1(30 + rand() * 20), r, c),
  floret: (rand, x, y) => floret(x, y, 0.75),
  cauli: (rand, x, y) => floret(x, y, 0.75).replace(/#3f8f3a/g, '#efe6cf').replace('#4aa043', '#f6efdc').replace('#6cc05a', '#fffaf0').replace('#8bbf5a', '#e2d6b8'),
  strip: (rand, x, y, r) => beefStrip(x, y, r),
  stick: (rand, x, y, r, c = '#f08a33') => stick(x, y, 18, r, c),
  ring: (rand, x, y, r, c = '#5aa54a') => `<circle cx="${x}" cy="${y}" r="4" fill="none" stroke="${c}" stroke-width="2.5"/>`,
  onionring: (rand, x, y, r, c = '#f3e6ef') => `<ellipse cx="${x}" cy="${y}" rx="12" ry="7" fill="none" stroke="${c}" stroke-width="3" ${rot(x, y, r)}/>`,
  slice: (rand, x, y, r, c = '#d9492f') => `<circle cx="${x}" cy="${y}" r="10" fill="${c}"/><circle cx="${x}" cy="${y}" r="7" fill="#fff" opacity=".25"/>`,
  coin: (rand, x, y, r, c = '#f08a33') => `<circle cx="${x}" cy="${y}" r="7" fill="${c}"/><circle cx="${x}" cy="${y}" r="4.5" fill="#fff" opacity=".2"/>`,
  cuke: (rand, x, y) => `<circle cx="${x}" cy="${y}" r="10" fill="#4f8f3a"/><circle cx="${x}" cy="${y}" r="8" fill="#cfe6a8"/><circle cx="${x}" cy="${y}" r="3" fill="#e9f3cf"/>`,
  tomato: (rand, x, y) => `<circle cx="${x}" cy="${y}" r="9" fill="#d9392b"/><circle cx="${x - 3}" cy="${y - 3}" r="2.5" fill="#f0776a"/>`,
  olive: (rand, x, y, r, c = '#3b2a3a') => `<ellipse cx="${x}" cy="${y}" rx="7" ry="5" fill="${c}" ${rot(x, y, r)}/><circle cx="${x}" cy="${y}" r="1.8" fill="#6b5a6a"/>`,
  shrimp: (rand, x, y, r) => `<g transform="translate(${x} ${y}) rotate(${Math.round(r)})"><path d="M-12 4A13 13 0 1 1 10 8" fill="none" stroke="#f08a5d" stroke-width="9" stroke-linecap="round"/><path d="M-8-6l4 4M0-10l1 5M8-6l-3 4" stroke="#fbc2a4" stroke-width="2" stroke-linecap="round"/><path d="M10 8l6 4-2-7Z" fill="#e0603a"/></g>`,
  ball: (rand, x, y, r, c = '#7a3f22') => `<circle cx="${x}" cy="${y}" r="13" fill="${c}"/><circle cx="${x - 4}" cy="${y - 4}" r="4" fill="#fff" opacity=".18"/>`,
  cheese: (rand, x, y, r, c = '#f6d35e') => stick(x, y, 12, r, c).replace('height="6"', 'height="3.5"'),
  berry: (rand, x, y, r, c = '#3b4f9a') => `<circle cx="${x}" cy="${y}" r="6" fill="${c}"/><circle cx="${x - 2}" cy="${y - 2}" r="1.8" fill="#fff" opacity=".35"/>`,
  straw: (rand, x, y, r) => `<g ${rot(x, y, r)}><path d="M${x - 9} ${y - 5}Q${x} ${y - 12} ${x + 9} ${y - 5}L${x} ${y + 11}Z" fill="#d8323f"/><path d="M${x - 6} ${y - 8}l3 3 3-4 3 4 3-3" fill="none" stroke="#4f9a45" stroke-width="3"/></g>`,
  wedge: (rand, x, y, r, c = '#f4cf3f') => lemonWedge(x, y, 12, r, c, c === '#6aa84f' ? '#b9df8a' : '#fbe68b'),
  egg: (rand, x, y) => egg(x, y, 17),
  mushroom: (rand, x, y, r, c = '#9b7654') => `<g ${rot(x, y, r)}><path d="M${x - 12} ${y}A12 10 0 0 1 ${x + 12} ${y}Z" fill="${c}"/><rect x="${x - 4}" y="${y - 1}" width="8" height="10" rx="2" fill="#e6d3b6"/></g>`,
  potato: (rand, x, y, r) => potato(x, y, r, 0.7),
  sweetpotato: (rand, x, y, r) => potato(x, y, r, 0.7).replace('#c98a2e', '#c8561f').replace('#e8b451', '#ee8a3a'),
  chicken: (rand, x, y, r) => `${cube(x, y, 15, '#c98a3e', r)}${cube(x, y, 10, '#e2ac5c', r)}`,
  tofu: (rand, x, y, r) => `${cube(x, y, 15, '#d9a54a', r)}${cube(x, y, 11, '#f3dfa8', r)}`,
  paneer: (rand, x, y, r) => `${cube(x, y, 14, '#e9c98a', r)}${cube(x, y, 10, '#fbf3df', r)}`,
  pepper: (rand, x, y, r, c = '#d8392b') => `<path d="M${x - 14} ${y}q14-10 28 0" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round" ${rot(x, y, r)}/>`,
  corn: (rand, x, y, r, c = '#f6c945') => `<rect x="${x - 3}" y="${y - 3}" width="6" height="6" rx="2" fill="${c}"/>`,
  swirl: (rand, x, y, r, c = '#fbe9dc') => `<path d="M${x - 25} ${y}c8-20 40-20 45 0s-26 20-32 6 8-14 18-8" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`,
  sausage: (rand, x, y, r) => `<rect x="${x - 22}" y="${y - 8}" width="44" height="16" rx="8" fill="#8a3f2a" ${rot(x, y, r)}/><path d="M${x - 14} ${y - 3}h28" stroke="#a9573a" stroke-width="3" stroke-linecap="round" ${rot(x, y, r)}/>`,
  puff: (rand, x, y, r, c = '#fbf3d8') => `<g><circle cx="${x}" cy="${y}" r="7" fill="${c}"/><circle cx="${x + 6}" cy="${y - 3}" r="6" fill="${c}"/><circle cx="${x + 2}" cy="${y + 5}" r="5.5" fill="#f3e2b0"/></g>`,
  garlic: (rand, x, y, r) => garlicClove(x, y, r),
  crouton: (rand, x, y, r) => `${cube(x, y, 12, '#c98a3e', r)}${cube(x, y, 8, '#e6b666', r)}`,
  chip: (rand, x, y, r, c = '#e8b34f') => `<path d="M${x} ${y - 12}L${x + 12} ${y + 8}L${x - 12} ${y + 8}Z" fill="${c}" ${rot(x, y, r)}/>`,
  sprout: (rand, x, y, r) => `<g ${rot(x, y, r)}><circle cx="${x}" cy="${y}" r="9" fill="#5e9c3a"/><path d="M${x - 6} ${y}q6-6 12 0M${x - 5} ${y + 4}q5-4 10 0" fill="none" stroke="#a6d27a" stroke-width="2"/></g>`,
  carrot: (rand, x, y, r) => `<rect x="${x - 16}" y="${y - 5}" width="32" height="10" rx="5" fill="#ee7f2d" ${rot(x, y, r)}/>`,
  apple: (rand, x, y, r) => `<path d="M${x - 11} ${y}A11 11 0 0 1 ${x + 11} ${y}Z" fill="#f1d9a0" stroke="#c63b2e" stroke-width="2.5" ${rot(x, y, r)}/>`,
  peach: (rand, x, y, r) => `<path d="M${x - 11} ${y}A11 11 0 0 1 ${x + 11} ${y}Z" fill="#f4a24a" ${rot(x, y, r)}/>`,
  raisin: (rand, x, y, r) => `<ellipse cx="${x}" cy="${y}" rx="3.5" ry="2.5" fill="#4a2a2a" ${rot(x, y, r)}/>`,
  chip2: (rand, x, y, r) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="3.2" fill="#4a2a1a"/>`,
  nut: (rand, x, y, r, c = '#b77b43') => `<ellipse cx="${x}" cy="${y}" rx="6" ry="3.8" fill="${c}" ${rot(x, y, r)}/>`,
  kale: (rand, x, y, r) => leaf(x, y, 12, r, '#2f6b3a') + leaf(x + 3, y + 2, 6, r, '#4a8a4a'),
  spinach: (rand, x, y, r) => leaf(x, y, 12, r, '#2f7a34'),
  lettuce: (rand, x, y, r) => leaf(x, y, 16, r, rand() > 0.5 ? '#7cc05a' : '#9fd46e'),
  cabbage: (rand, x, y, r) => stick(x, y, 22, r, rand() > 0.5 ? '#e9efcf' : '#c9dca0').replace('height="6"', 'height="4"'),
  pasta: (rand, x, y, r, c = '#e9a444') => `<g ${rot(x, y, r)}><rect x="${x - 13}" y="${y - 6}" width="26" height="12" rx="3" fill="${c}"/><rect x="${x - 13}" y="${y - 2}" width="26" height="3" fill="#d88a2e"/></g>`,
  shell: (rand, x, y, r) => `<g ${rot(x, y, r)}><ellipse cx="${x}" cy="${y}" rx="20" ry="13" fill="#eab65a"/><ellipse cx="${x}" cy="${y + 2}" rx="14" ry="8" fill="#fbf4e3"/></g>`,
  gnocchi: (rand, x, y, r) => `<g ${rot(x, y, r)}><ellipse cx="${x}" cy="${y}" rx="11" ry="8" fill="#e9b85a"/><path d="M${x - 6} ${y - 4}v8M${x} ${y - 5}v10M${x + 6} ${y - 4}v8" stroke="#d09a3c" stroke-width="1.5"/></g>`,
  dumpling: (rand, x, y, r) => `<circle cx="${x}" cy="${y}" r="15" fill="#f5e9cc"/><circle cx="${x - 4}" cy="${y - 4}" r="5" fill="#fffaf0"/>`,
  zucchini: (rand, x, y) => `<circle cx="${x}" cy="${y}" r="10" fill="#3f7a2e"/><circle cx="${x}" cy="${y}" r="8" fill="#e7efb8"/>`,
  eggplant: (rand, x, y) => `<circle cx="${x}" cy="${y}" r="11" fill="#4a2a55"/><circle cx="${x}" cy="${y}" r="9" fill="#efe2b8"/>`,
  sesame: (rand, x, y, r) => `<ellipse cx="${x}" cy="${y}" rx="2.2" ry="1.3" fill="#fffaf0" ${rot(x, y, r)}/>`,
  lentil: (rand, x, y, r, c = '#6b5a3a') => `<circle cx="${x}" cy="${y}" r="3" fill="${c}"/>`,
  thigh: (rand, x, y, r) => thigh(x, y, r, 0.55),
  drum: (rand, x, y, r, c = '#c98a3e') => `<g transform="translate(${x} ${y}) rotate(${Math.round(r)})"><path d="M-30-14C-10-24 14-18 22-6L36-4 38 6 24 8C14 20-10 24-30 14-40 8-40-8-30-14Z" fill="${c}"/><path d="M-24-8C-10-16 8-12 14-4 8 8-10 12-24 8-30 4-30-4-24-8Z" fill="#fff" opacity=".18"/><circle cx="38" cy="-4" r="5" fill="#f3ead6"/><circle cx="38" cy="6" r="5" fill="#f3ead6"/></g>`,
  bigfloret: (rand, x, y) => floret(x, y, 1.25),
  bigcauli: (rand, x, y) => BITS.cauli(rand, x, y).replace('scale(0.75)', 'scale(1.25)'),
  bigsprout: (rand, x, y, r) => `<g ${rot(x, y, r)}><circle cx="${x}" cy="${y}" r="17" fill="#4f8a2e"/><circle cx="${x}" cy="${y}" r="13" fill="#b6d98a"/><path d="M${x - 10} ${y - 2}q10-8 20 0M${x - 8} ${y + 5}q8-6 16 0" fill="none" stroke="#6fa84a" stroke-width="2.5"/><path d="M${x - 14} ${y + 6}a16 16 0 0 0 28 0" fill="none" stroke="#8a5a2a" stroke-width="3" opacity=".6"/></g>`,
  fry: (rand, x, y, r, c = '#ee8a3a') => `<rect x="${x - 32}" y="${y - 7}" width="64" height="14" rx="5" fill="${c}" ${rot(x, y, r)}/><rect x="${x - 28}" y="${y - 3}" width="56" height="4" rx="2" fill="#fff" opacity=".2" ${rot(x, y, r)}/>`,
  wholecarrot: (rand, x, y, r) => `<g transform="translate(${x} ${y}) rotate(${Math.round(r / 6 - 15)})"><path d="M-70-9Q0-14 70-1Q0 12-70 9Z" fill="#e8742a"/><path d="M-60-3Q0-6 55 0" stroke="#f5a05a" stroke-width="3" fill="none"/><path d="M-70 0l-18-10M-70 0l-20 0M-70 0l-18 10" stroke="#4f9a45" stroke-width="4" stroke-linecap="round"/></g>`,
  bigsweet: (rand, x, y, r) => potato(x, y, r, 1.05).replace('#c98a2e', '#c8561f').replace('#e8b451', '#ee8a3a'),
  nori: (rand, x, y, r) => `<rect x="${x - 8}" y="${y - 5}" width="16" height="10" rx="2" fill="#23342a" ${rot(x, y, r)}/>`,
};

function bits(rand, list, area) {
  let s = '';
  for (const [name, n, c] of list || []) {
    const fn = BITS[name];
    if (!fn) throw new Error(`unknown bit "${name}"`);
    for (let i = 0; i < n; i++) {
      const [x, y] = area();
      s += fn(rand, x, y, rand() * 180, c);
    }
  }
  return s;
}
const circleArea = (rand, cx, cy, r) => () => inCircle(rand, cx, cy, r);
const rectArea = (rand, x, y, w, h) => () => [r1(x + rand() * w), r1(y + rand() * h)];

// ---------- Side items placed around the main dish ----------
const SIDES = {
  rice: (rand, x, y) => bowl(x, y, 52, '#fbf7ee') + scatter(rand, 30, () => inCircle(rand, x, y, 36), (px, py, r) => grain(px, py, r, '#fff')),
  lime: (rand, x, y) => lemonWedge(x, y, 26, 150, '#6aa84f', '#b9df8a'),
  lemon: (rand, x, y) => lemonWedge(x, y, 26, 150),
  chopsticks: (rand, x, y) => `<rect x="${x}" y="${y - 100}" width="9" height="200" rx="4" fill="#2c2c30" transform="rotate(20 ${x + 4} ${y})"/><rect x="${x + 18}" y="${y - 100}" width="9" height="200" rx="4" fill="#3c3c42" transform="rotate(24 ${x + 22} ${y})"/>`,
  spoon: (rand, x, y) => `<rect x="${x - 42}" y="${y - 8}" width="84" height="16" rx="8" fill="#c9ccd1" transform="rotate(35 ${x} ${y})"/><ellipse cx="${x - 40}" cy="${y - 28}" rx="20" ry="14" fill="#c9ccd1" transform="rotate(35 ${x - 40} ${y - 28})"/>`,
  fork: (rand, x, y) => fork(x, y, 25),
  bread: (rand, x, y) => `<g transform="rotate(-12 ${x} ${y})"><rect x="${x - 38}" y="${y - 20}" width="76" height="40" rx="18" fill="#b8742e"/><rect x="${x - 32}" y="${y - 14}" width="64" height="28" rx="12" fill="#f1dcb0"/></g>`,
  salsa: (rand, x, y) => bowl(x, y, 46, '#c8412f') + scatter(rand, 12, () => inCircle(rand, x, y, 30), (px, py, r) => cube(px, py, 6, rand() > 0.5 ? '#e46a45' : '#f2e9d8', r)),
  sourcream: (rand, x, y) => bowl(x, y, 40, '#fbf7ee') + scatter(rand, 4, () => inCircle(rand, x, y, 18), (px, py, r) => leaf(px, py, 4, r)),
  chips: (rand, x, y) => scatter(rand, 9, () => inCircle(rand, x, y, 36), (px, py, r) => BITS.chip(rand, px, py, r)),
  pita: (rand, x, y) => scatter(rand, 5, () => inCircle(rand, x, y, 30), (px, py, r) => `<path d="M${px} ${py - 22}L${px + 20} ${py + 14}L${px - 20} ${py + 14}Z" fill="#e8c27e" stroke="#d09a4a" stroke-width="3" stroke-linejoin="round" ${rot(px, py, r)}/>`),
  celery: (rand, x, y) => [0, 1, 2].map((i) => stick(x - 30 + i * 12, y - 30 + i * 18, 70, 70, '#a8d27a').replace('height="6"', 'height="10"')).join(''),
  veg: (rand, x, y) => scatter(rand, 5, () => inCircle(rand, x, y, 30), (px, py, r) => stick(px, py, 50, r, rand() > 0.5 ? '#ee7f2d' : '#b6d98a').replace('height="6"', 'height="9"')),
  napkinRed: () => napkin(250, 195, 120, 80, '#c95b4a'),
  napkinBlue: () => napkin(250, 195, 120, 80, '#6d9bc3'),
  napkinGreen: () => napkin(20, 30, 110, 80, '#7fae6a'),
  napkinYellow: () => napkin(20, 30, 110, 80, '#e0b43c'),
  berries: (rand, x, y) => scatter(rand, 10, () => inCircle(rand, x, y, 28), (px, py, r) => BITS.berry(rand, px, py, r, rand() > 0.5 ? '#3b4f9a' : '#c2304a')),
  mint: (rand, x, y) => sprig(x - 30, y, 60, -20, '#3f8a3c', 6),
  basil: (rand, x, y) => leaf(x, y, 16, -30, '#3f8f3a') + leaf(x + 20, y + 8, 13, 20, '#4aa043'),
  rosemary: (rand, x, y) => sprig(x - 35, y, 70, -20, '#3c6e3a', 5),
  sauce: (rand, x, y) => bowl(x, y, 40, '#f3ead6'),
  hotsauce: (rand, x, y) => bowl(x, y, 40, '#d0442a'),
  soy: (rand, x, y) => bowl(x, y, 34, '#3a2418'),
  syrup: (rand, x, y) => `<rect x="${x - 18}" y="${y - 50}" width="36" height="80" rx="10" fill="#9a4f15" opacity=".9"/><rect x="${x - 8}" y="${y - 66}" width="16" height="20" rx="4" fill="#e9dcc3"/>`,
  banana: (rand, x, y) => `<path d="M${x - 60} ${y}c40 40 120 40 170 5" fill="none" stroke="#f3d24e" stroke-width="22" stroke-linecap="round"/>`,
  apple: (rand, x, y) => `<circle cx="${x}" cy="${y}" r="30" fill="#c63b2e"/><circle cx="${x - 8}" cy="${y - 9}" r="8" fill="#e0685b"/><rect x="${x - 2}" y="${y - 40}" width="5" height="16" rx="2" fill="#6b4a2a"/>${leaf(x + 12, y - 33, 10, -30, '#4f9a45')}`,
  egg: (rand, x, y) => egg(x, y, 26),
  cucumber: (rand, x, y) => scatter(rand, 5, () => inCircle(rand, x, y, 24), (px, py, r) => BITS.cuke(rand, px, py, r)),
  tortillas: (rand, x, y) => `<circle cx="${x}" cy="${y}" r="46" fill="#e8cf96"/><circle cx="${x + 4}" cy="${y - 4}" r="44" fill="#f1dcaa"/>${scatter(rand, 8, () => inCircle(rand, x, y, 36), (px, py) => `<circle cx="${px}" cy="${py}" r="3" fill="#d6a55c"/>`)}`,
  greens: (rand, x, y) => scatter(rand, 8, () => inCircle(rand, x, y, 28), (px, py, r) => BITS.lettuce(rand, px, py, r)),
  pickles: (rand, x, y) => scatter(rand, 5, () => inCircle(rand, x, y, 24), (px, py) => `<circle cx="${px}" cy="${py}" r="9" fill="#6f8f2e"/><circle cx="${px}" cy="${py}" r="6.5" fill="#b9c96a"/>`),
  ketchup: (rand, x, y) => bowl(x, y, 34, '#c2301f'),
  tartar: (rand, x, y) => bowl(x, y, 34, '#f3ecd4') + scatter(rand, 8, () => inCircle(rand, x, y, 18), (px, py) => `<circle cx="${px}" cy="${py}" r="2" fill="#6f8f2e"/>`),
  coffee: (rand, x, y) => `<circle cx="${x}" cy="${y}" r="40" fill="#f4f1ea"/><circle cx="${x}" cy="${y}" r="32" fill="#5a3a25"/><circle cx="${x}" cy="${y}" r="24" fill="#b88a5a" opacity=".5"/>`,
  cream: (rand, x, y) => bowl(x, y, 40, '#fffaf0') + `<path d="M${x - 15} ${y}c6-12 24-12 28 0s-14 10-18 2" fill="none" stroke="#efe6d2" stroke-width="4" stroke-linecap="round"/>`,
};

function sides(rand, list) {
  let s = '';
  for (const [name, x, y] of list || []) {
    const fn = SIDES[name];
    if (!fn) throw new Error(`unknown side "${name}"`);
    s += fn(rand, x, y);
  }
  return s;
}

// ---------- Main pieces placed on plates ----------
const MAINS = {
  breast: (x, y, r = 0, s = 1) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M-50-18C-30-40 30-38 52-12 62 6 40 30 4 30-34 30-60 10-50-18Z" fill="#c98a3e"/><path d="M-40-14C-24-32 24-30 42-10 50 4 32 22 4 22-28 22-48 8-40-14Z" fill="#e2ac5c"/><path d="M-20-8l12 16M0-12l12 16M20-10l10 14" stroke="#b56e2a" stroke-width="4" stroke-linecap="round" opacity=".7"/></g>`,
  cutlet: (x, y, r = 0, s = 1) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M-56-20C-34-44 34-42 58-14 66 8 42 34 4 34-38 34-66 12-56-20Z" fill="#c07a2c"/><path d="M-48-16C-28-36 28-34 50-12 56 6 36 26 4 26-32 26-56 8-48-16Z" fill="#dca052"/></g>`,
  parm: (x, y, r = 0, s = 1) => `${MAINS.cutlet(x, y, r, s)}<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M-36-10C-20-26 20-24 36-8 40 6 24 18 2 18-24 18-40 8-36-10Z" fill="#c8392b"/><path d="M-26-8C-14-20 14-18 26-6 28 4 16 12 2 12-18 12-28 4-26-8Z" fill="#f6e3a0"/><circle cx="-8" cy="-2" r="5" fill="#e9c060"/><circle cx="10" cy="2" r="4" fill="#e9c060"/></g>`,
  fillet: (x, y, r = 0, c = '#f39277', edge = '#e9775a') => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-48" y="-31" width="96" height="62" rx="18" fill="${edge}"/><rect x="-42" y="-25" width="84" height="50" rx="14" fill="${c}"/>${[0, 1, 2, 3].map((i) => `<path d="M${-26 + i * 18} -21q8 21 0 42" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="3"/>`).join('')}</g>`,
  whitefish: (x, y, r = 0) => MAINS.fillet(x, y, r, '#f8e6c0', '#d9ae62'),
  glazed: (x, y, r = 0) => MAINS.fillet(x, y, r, '#d9783f', '#a8502a'),
  steak: (x, y, r = 0) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-60-24C-40-44 40-44 62-18 70 10 44 36 0 36-44 36-70 10-60-24Z" fill="#4a2618"/><path d="M-52-20C-34-36 34-36 54-14 60 8 38 28 0 28-38 28-60 8-52-20Z" fill="#7a3a24"/>${[-30, -10, 10, 30].map((d) => `<path d="M${d - 10} -26l20 50" stroke="#3a1c12" stroke-width="4" opacity=".6"/>`).join('')}</g>`,
  sliced: (x, y, r = 0) => `<g transform="translate(${x} ${y}) rotate(${r})">${[-48, -26, -4, 18, 40].map((d, i) => `<g transform="rotate(${-6 + i * 3} ${d} 0)"><rect x="${d - 16}" y="-44" width="32" height="88" rx="12" fill="#4a2618"/><rect x="${d - 12}" y="-39" width="24" height="78" rx="9" fill="#b85a48"/><rect x="${d - 8}" y="-32" width="16" height="64" rx="7" fill="#dd8a7a"/></g>`).join('')}</g>`,
  chop: (x, y, r = 0) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-54-20C-30-44 44-40 58-10 64 12 40 32 0 32-44 32-66 6-54-20Z" fill="#a8652e"/><path d="M-46-16C-26-36 36-32 48-8 52 8 32 24 0 24-36 24-56 4-46-16Z" fill="#d49a58"/><rect x="40" y="-6" width="30" height="10" rx="5" fill="#f3ead6"/></g>`,
  loaf: (x, y, r = 0) => `<g transform="translate(${x} ${y}) rotate(${r})">${[-44, -14, 16, 46].map((d) => `<rect x="${d - 14}" y="-38" width="28" height="76" rx="6" fill="#6b3421"/><rect x="${d - 11}" y="-34" width="22" height="68" rx="5" fill="#9a5634"/>`).join('')}<path d="M-58-38h118" stroke="#c2301f" stroke-width="8" stroke-linecap="round"/></g>`,
  roast: (x, y, r = 0) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-62-28C-40-50 44-48 64-20 74 10 46 40 0 40-48 40-74 10-62-28Z" fill="#5a2e1a"/><path d="M-52-22C-34-40 36-38 54-16 60 6 38 30 0 30-40 30-60 6-52-22Z" fill="#8a4a2c"/><path d="M-30-10q20 10 50-4M-24 10q24 8 48-2" fill="none" stroke="#6b3421" stroke-width="5" stroke-linecap="round"/></g>`,
  patty: (x, y, r = 0, c = '#c98a3e', inner = '#e2ac5c') => `<circle cx="${x}" cy="${y}" r="30" fill="${c}"/><circle cx="${x}" cy="${y}" r="24" fill="${inner}"/>${[0, 1, 2].map(() => '').join('')}`,
  mound: (x, y, r = 0, c = '#fffaf0') => `<ellipse cx="${x}" cy="${y}" rx="52" ry="40" fill="#e6dcc6"/><ellipse cx="${x}" cy="${y - 3}" rx="48" ry="36" fill="${c}"/>`,
  mash: (x, y) => `<ellipse cx="${x}" cy="${y}" rx="56" ry="44" fill="#efdca6"/><ellipse cx="${x - 4}" cy="${y - 4}" rx="48" ry="36" fill="#f8ecc4"/><path d="M${x - 24} ${y - 6}c10-14 36-14 44 0s-22 16-28 6" fill="none" stroke="#e8d499" stroke-width="5" stroke-linecap="round"/><rect x="${x - 10}" y="${y - 20}" width="20" height="14" rx="3" fill="#fbe6a2"/>`,
  omelet: (x, y, r = 0) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-80 0A80 56 0 0 0 80 0Z" fill="#e9b64a"/><path d="M-72 4A72 48 0 0 0 72 4Z" fill="#f6d36a"/><path d="M-78 0h156" stroke="#dca33a" stroke-width="5" stroke-linecap="round"/></g>`,
  scramble: (x, y, c = '#f6d36a') => '',
  fishfry: (x, y, r = 0) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-60-20C-40-36 40-34 62-10 64 12 40 26 0 26-40 26-66 10-60-20Z" fill="#c07a2c"/><path d="M-50-14C-32-28 32-26 52-8 54 8 34 18 0 18-34 18-56 6-50-14Z" fill="#e3a94f"/>${[-30, -8, 16, 36].map((d) => `<circle cx="${d}" cy="${(d % 3) * 2}" r="4" fill="#f0c476"/>`).join('')}</g>`,
};

// ---------- Vessels and dish kinds ----------
export const KINDS = {
  // A bowl of something (soup, curry, salad, rice) with toppings.
  bowl(rand, o) {
    const cx = o.cx ?? 185, cy = o.cy ?? 150, R = o.r ?? 115;
    let s = sides(rand, o.under) + bowl(cx, cy, R, o.base || '#e2a032');
    if (o.swirl) s += BITS.swirl(rand, cx - 10, cy, 0, o.swirl);
    s += bits(rand, o.bits, circleArea(rand, cx, cy, R * 0.72));
    return s + sides(rand, o.sides);
  },
  // Bibimbap-style: bowl with toppings in wedges around a centre egg.
  sectors(rand, o) {
    const cx = 185, cy = 150, R = 115;
    let s = bowl(cx, cy, R, o.base || '#f7f1e3');
    const n = o.sectors.length;
    o.sectors.forEach(([name, count, c], i) => {
      const a = ((i + 0.5) / n) * Math.PI * 2;
      const px = cx + Math.cos(a) * 55, py = cy + Math.sin(a) * 55;
      s += bits(rand, [[name, count, c]], circleArea(rand, px, py, 26));
    });
    if (o.center) s += BITS[o.center](rand, cx, cy, 0);
    s += bits(rand, o.bits, circleArea(rand, cx, cy, R * 0.75));
    return s + sides(rand, o.sides);
  },
  // A dinner plate with main pieces, a pile of sides and scattered bits.
  plate(rand, o) {
    const cx = o.cx ?? 185, cy = o.cy ?? 150, R = o.r ?? 118;
    let s = sides(rand, o.under) + plate(cx, cy, R);
    if (o.pile) s += bits(rand, o.pile, circleArea(rand, cx + (o.pileDx ?? -40), cy + (o.pileDy ?? 30), o.pileR ?? 42));
    for (const [m, x, y, r, a, b] of o.mains || []) s += MAINS[m](cx + x, cy + y, r ?? 0, a, b);
    if (o.sauce) s += `<path d="M${cx - 40} ${cy - 10}c20-10 50-6 80 6" fill="none" stroke="${o.sauce}" stroke-width="7" stroke-linecap="round" opacity=".8"/>`;
    s += bits(rand, o.bits, circleArea(rand, cx, cy, R * 0.7));
    return s + sides(rand, o.sides);
  },
  // Food in a skillet; optional fried eggs or main pieces on top.
  skillet(rand, o) {
    const cx = 185, cy = 150, R = 115;
    let s = sides(rand, o.under) + skillet(cx, cy, R, o.base || '#c23f2c');
    if (o.rim) for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; s += `<circle cx="${r1(cx + Math.cos(a) * 88)}" cy="${r1(cy + Math.sin(a) * 88)}" r="${r1(14 + rand() * 6)}" fill="${o.rim}"/>`; }
    s += bits(rand, o.bits, circleArea(rand, cx, cy, 92));
    for (const [m, x, y, r, a, b] of o.mains || []) s += MAINS[m](cx + x, cy + y, r ?? 0, a, b);
    if (o.eggs) for (const [x, y] of o.eggs) s += egg(cx + x, cy + y, 22);
    s += bits(rand, o.top, circleArea(rand, cx, cy, 90));
    return s + sides(rand, o.sides);
  },
  // Pieces spread on a sheet pan in a loose grid.
  sheetpan(rand, o) {
    let s = sheetPan(35, 45, 330, 210);
    s += bits(rand, o.bits, rectArea(rand, 62, 72, 276, 156));
    if (o.grid) {
      const [name, cols, rows, c] = o.grid;
      for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) s += BITS[name](rand, r1(75 + (q + 0.5) * (250 / cols) + (rand() - 0.5) * 14), r1(85 + (r + 0.5) * (130 / rows) + (rand() - 0.5) * 12), rand() * 180, c);
    }
    for (const [m, x, y, r, a, b] of o.mains || []) s += MAINS[m](x, y, r ?? 0, a, b);
    if (o.wings) for (let i = 0; i < o.wings; i++) s += thigh(90 + (i % 4) * 72 + rand() * 10, 100 + Math.floor(i / 4) * 70 + rand() * 10, rand() * 360, 0.8).replace('#b8742e', o.wingEdge || '#b8742e').replace('#d99a45', o.wingColor || '#d99a45');
    s += bits(rand, o.top, rectArea(rand, 62, 72, 276, 156));
    return s + sides(rand, o.sides);
  },
  // Rectangular baking dish: casseroles, lasagna, crisps, dips.
  dish(rand, o) {
    const x = 45, y = 40, w = 300, h = 210;
    let s = sides(rand, o.under) + `<rect x="${x + 10}" y="${y + 10}" width="${w}" height="${h}" rx="28" fill="#000" opacity=".09"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="28" fill="${o.dish || '#f7f4ee'}"/><rect x="${x + 17}" y="${y + 17}" width="${w - 34}" height="${h - 34}" rx="18" fill="${o.base || '#c8412f'}"/>`;
    const area = rectArea(rand, x + 30, y + 28, w - 60, h - 56);
    if (o.rolls) for (let i = 0; i < o.rolls; i++) {
      const rx = x + 40 + (i % 4) * 62, ry = y + 50 + Math.floor(i / 4) * 55;
      s += `<rect x="${rx - 6}" y="${ry - 20}" width="56" height="44" rx="18" fill="${o.rollColor || '#e8cf96'}"/>`;
    }
    if (o.melt) s += bits(rand, [['blob', o.melt, '#f3d27a']], area) + bits(rand, [['blob', Math.round(o.melt / 2), '#e3b04f']], area);
    s += bits(rand, o.bits, area);
    if (o.lattice) {
      for (let i = 0; i < 6; i++) s += `<rect x="${x + 30 + i * 45}" y="${y + 20}" width="16" height="${h - 40}" rx="6" fill="${o.lattice}" opacity=".95"/>`;
    }
    if (o.crust) s += `<rect x="${x + 17}" y="${y + 17}" width="${w - 34}" height="${h - 34}" rx="18" fill="none" stroke="${o.crust}" stroke-width="14"/>`;
    s += bits(rand, o.top, area);
    return s + sides(rand, o.sides);
  },
  // A tangle of pasta on a plate or in a bowl.
  pasta(rand, o) {
    const cx = 185, cy = 150;
    let s = sides(rand, o.under) + (o.bowl ? bowl(cx, cy, 118, o.sauce || '#f3d98c') : plate(cx, cy, 118));
    if (o.short) s += bits(rand, [[o.short, 34, o.pastaColor]], circleArea(rand, cx, cy, 84));
    else for (let i = 0; i < 9; i++) s += `<circle cx="${cx}" cy="${cy}" r="${14 + i * 8}" fill="none" stroke="${i % 2 ? (o.pastaColor || '#edd07a') : (o.pastaColor2 || '#f3d98c')}" stroke-width="6" stroke-dasharray="${60 + i * 12} 14" transform="rotate(${i * 37} ${cx} ${cy})"/>`;
    if (o.sauceTop) s += `<circle cx="${cx}" cy="${cy}" r="${o.sauceR || 42}" fill="${o.sauceTop}"/>` + bits(rand, [['blob', 10, o.sauceTop]], circleArea(rand, cx, cy, o.sauceR || 42));
    s += bits(rand, o.bits, circleArea(rand, cx, cy, 80));
    return s + sides(rand, o.sides);
  },
  pizza(rand, o) {
    const cx = 200, cy = 150;
    let s = sides(rand, o.under) + `<circle cx="${cx + 5}" cy="${cy + 8}" r="128" fill="#000" opacity=".09"/><circle cx="${cx}" cy="${cy}" r="128" fill="#b98a55"/><circle cx="${cx}" cy="${cy}" r="120" fill="#d6a35e"/><circle cx="${cx}" cy="${cy}" r="102" fill="#c8392b"/>`;
    s += bits(rand, [['blob', 14, '#f8ecc4']], circleArea(rand, cx, cy, 80)).replace(/r="[\d.]+"/g, 'r="15"');
    s += bits(rand, o.bits, circleArea(rand, cx, cy, 88));
    for (let i = 0; i < 4; i++) s += `<line x1="${cx}" y1="${cy}" x2="${r1(cx + Math.cos(i * Math.PI / 4) * 120)}" y2="${r1(cy + Math.sin(i * Math.PI / 4) * 120)}" stroke="#b98a55" stroke-width="2" opacity=".5"/><line x1="${cx}" y1="${cy}" x2="${r1(cx - Math.cos(i * Math.PI / 4) * 120)}" y2="${r1(cy - Math.sin(i * Math.PI / 4) * 120)}" stroke="#b98a55" stroke-width="2" opacity=".5"/>`;
    return s;
  },
  // A round cake or cheesecake, seen from above, with a slice cut out.
  cake(rand, o) {
    const cx = 185, cy = 150;
    let s = sides(rand, o.under) + plate(cx, cy, 124) + `<circle cx="${cx}" cy="${cy}" r="100" fill="${o.side || '#6b3a24'}"/><circle cx="${cx}" cy="${cy}" r="94" fill="${o.top || '#8a4f30'}"/>`;
    if (o.rim) for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; s += `<circle cx="${r1(cx + Math.cos(a) * 84)}" cy="${r1(cy + Math.sin(a) * 84)}" r="7" fill="${o.rim}"/>`; }
    s += bits(rand, o.bits, circleArea(rand, cx, cy, 70));
    s += `<path d="M${cx} ${cy}L${cx + 100} ${cy - 18}A100 100 0 0 1 ${cx + 96} ${cy + 30}Z" fill="#fbfaf6"/>`;
    s += `<g transform="translate(${cx + 150} ${cy + 70}) rotate(-15)"><path d="M-40 0L40-14 40 22-40 22Z" fill="${o.inside || '#5a3021'}"/><path d="M-40 0L40-14 40-6-40 8Z" fill="${o.top || '#8a4f30'}"/>${o.layer ? `<path d="M-40 12L40 2 40 8-40 18Z" fill="${o.layer}"/>` : ''}${o.crumb ? `<rect x="-40" y="18" width="80" height="6" fill="${o.crumb}"/>` : ''}</g>`;
    return s + sides(rand, o.sides);
  },
  // A pie from above: crust ring, filling or lattice, one slice lifted out.
  pie(rand, o) {
    const cx = 180, cy = 150;
    let s = sides(rand, o.under) + `<circle cx="${cx + 5}" cy="${cy + 8}" r="122" fill="#000" opacity=".09"/><circle cx="${cx}" cy="${cy}" r="122" fill="#e9e3d6"/><circle cx="${cx}" cy="${cy}" r="110" fill="#c98a3e"/><circle cx="${cx}" cy="${cy}" r="96" fill="${o.fill || '#d87a2a'}"/>`;
    for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2; s += `<circle cx="${r1(cx + Math.cos(a) * 103)}" cy="${r1(cy + Math.sin(a) * 103)}" r="9" fill="#e1a95a"/>`; }
    s += bits(rand, o.bits, circleArea(rand, cx, cy, 80));
    if (o.lattice) for (let i = -3; i <= 3; i++) s += `<rect x="${cx + i * 26 - 7}" y="${cy - 90}" width="14" height="180" rx="6" fill="#e1a95a"/><rect x="${cx - 90}" y="${cy + i * 26 - 7}" width="180" height="14" rx="6" fill="#e8b466"/>`;
    s += bits(rand, o.top, circleArea(rand, cx, cy, 70));
    if (o.cut !== false) s += `<path d="M${cx} ${cy}L${cx + 110} ${cy - 30}A114 114 0 0 1 ${cx + 110} ${cy + 30}Z" fill="#e9e3d6"/>`;
    return `<g>${s}</g>` + sides(rand, o.sides);
  },
  // Round cookies on a plate.
  cookies(rand, o) {
    let s = sides(rand, o.under) + plate(200, 152, 120);
    const cookie = (x, y, r) => {
      let c = `<circle cx="${x + 2}" cy="${y + 4}" r="${r}" fill="#000" opacity=".08"/><circle cx="${x}" cy="${y}" r="${r}" fill="${o.edge || '#c98f4c'}"/><circle cx="${x}" cy="${y}" r="${r - 6}" fill="${o.color || '#dca864'}"/>`;
      if (o.crack) c += `<path d="M${x - 16} ${y - 6}l10 4 8-8 12 6M${x - 12} ${y + 12}l10-4 10 6" fill="none" stroke="${o.crack}" stroke-width="2.5" stroke-linecap="round"/>`;
      if (o.fork) c += `<path d="M${x - 18} ${y - 14}l36 28M${x - 18} ${y + 14}l36-28" stroke="${o.edge || '#b97a3c'}" stroke-width="3"/>`;
      c += bits(rand, o.bits, circleArea(rand, x, y, r - 10));
      return c;
    };
    s += cookie(150, 110, 42) + cookie(245, 110, 42) + cookie(125, 195, 40) + cookie(210, 200, 42) + cookie(282, 185, 36);
    return s + sides(rand, o.sides);
  },
  // Balls or patties on a plate (energy bites, falafel, salmon cakes).
  balls(rand, o) {
    let s = sides(rand, o.under) + plate(185, 150, 118);
    const pts = [[140, 110], [200, 100], [255, 125], [120, 170], [185, 160], [245, 190], [160, 215]];
    for (const [x, y] of pts.slice(0, o.n || 7)) {
      const r = o.size || 24;
      s += `<circle cx="${x + 2}" cy="${y + 4}" r="${r}" fill="#000" opacity=".1"/><circle cx="${x}" cy="${y}" r="${r}" fill="${o.edge || '#8a5a2e'}"/><circle cx="${x - 2}" cy="${y - 2}" r="${r - 5}" fill="${o.color || '#b27a42'}"/>`;
      s += bits(rand, o.bits, circleArea(rand, x - 2, y - 2, r - 8));
    }
    s += bits(rand, o.top, circleArea(rand, 185, 150, 90));
    return s + sides(rand, o.sides);
  },
  // Squares cut in a tray (bars, shortbread, cornbread, crispy treats).
  bars(rand, o) {
    const rows = o.rows || 3, cols = o.cols || 4;
    let s = sides(rand, o.under) + `<rect x="55" y="45" width="290" height="220" rx="12" fill="#000" opacity=".09"/><rect x="50" y="38" width="290" height="220" rx="12" fill="${o.tray || '#f4efe6'}"/>`;
    const cw = 272 / cols, ch = 202 / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const lift = r === 1 && c === cols - 2;
      const x = r1(59 + c * cw + (lift ? 8 : 0)), y = r1(47 + r * ch + (lift ? 14 : 0));
      s += `<rect x="${x}" y="${y}" width="${r1(cw - 6)}" height="${r1(ch - 6)}" rx="5" fill="${o.edge || '#c98a3e'}"/><rect x="${x + 4}" y="${y + 4}" width="${r1(cw - 14)}" height="${r1(ch - 14)}" rx="4" fill="${o.color || '#e6b666'}"/>`;
      s += bits(rand, o.bits, rectArea(rand, x + 8, y + 8, cw - 22, ch - 22));
    }
    s += bits(rand, o.top, rectArea(rand, 60, 50, 270, 200));
    return s + sides(rand, o.sides);
  },
  // A loaf with slices (banana bread, garlic bread).
  loaf(rand, o) {
    let s = sides(rand, o.under) + `<rect x="40" y="70" width="320" height="170" rx="16" fill="#000" opacity=".08"/><rect x="34" y="62" width="320" height="170" rx="16" fill="${o.board || '#c9965e'}"/>`;
    s += `<rect x="60" y="92" width="170" height="100" rx="30" fill="${o.crust || '#8a4f25'}"/><rect x="70" y="100" width="150" height="40" rx="18" fill="${o.top || '#a8622e'}"/>`;
    if (o.split) s += `<path d="M86 118q60-14 120 0" stroke="${o.split}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    for (let i = 0; i < (o.slices ?? 3); i++) {
      const x = 240 + i * 34, y = 100 + i * 8;
      s += `<rect x="${x}" y="${y}" width="30" height="100" rx="8" fill="${o.crust || '#8a4f25'}" transform="rotate(8 ${x} ${y})"/><rect x="${x + 4}" y="${y + 4}" width="22" height="92" rx="6" fill="${o.crumb || '#e1b56a'}" transform="rotate(8 ${x} ${y})"/>`;
    }
    s += bits(rand, o.bits, rectArea(rand, 80, 100, 130, 80));
    return s + sides(rand, o.sides);
  },
  // Muffins or cupcakes seen from the side.
  muffins(rand, o) {
    let s = sides(rand, o.under) + `<ellipse cx="200" cy="262" rx="160" ry="14" fill="#000" opacity=".09"/>`;
    const one = (x, y, sc) => {
      let m = `<g transform="translate(${x} ${y}) scale(${sc})"><path d="M-44 0L44 0 34 62-34 62Z" fill="${o.liner || '#e4d8c3'}"/>${[-30, -15, 0, 15, 30].map((d) => `<path d="M${d} 2L${d * 0.78} 60" stroke="#000" stroke-opacity=".1" stroke-width="3"/>`).join('')}`;
      if (o.frosting) m += `<path d="M-46 4C-50-20-30-30-20-32-18-50 18-50 20-32 30-30 50-20 46 4Z" fill="${o.frosting}"/><path d="M-30-6C-28-22 28-22 30-6" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="5" stroke-linecap="round"/>`;
      else m += `<path d="M-52 4C-58-40 58-40 52 4Z" fill="${o.edge || '#b87735'}"/><path d="M-44-2C-46-32 46-32 44-2Z" fill="${o.color || '#d49a4f'}"/>`;
      m += bits(rand, o.bits, rectArea(rand, -34, -26, 68, 22));
      return `${m}</g>`;
    };
    s += one(110, 185, 1) + one(290, 185, 1) + one(200, 170, 1.15);
    return s + sides(rand, o.sides);
  },
  // A stack of pancakes/waffles/French toast/crepes on a plate.
  stack(rand, o) {
    let s = sides(rand, o.under) + plate(200, 190, 110, '#fbfaf6', '#f1eee6');
    const n = o.n || 4;
    for (let i = 0; i < n; i++) {
      const y = 200 - i * (o.gap || 22);
      if (o.shape === 'square') s += `<rect x="${108 + (i % 2) * 8}" y="${y - 28}" width="170" height="56" rx="14" fill="${o.edge || '#c98a3a'}"/><rect x="${112 + (i % 2) * 8}" y="${y - 34}" width="162" height="52" rx="12" fill="${o.color || '#e7b25e'}"/>`;
      else s += `<ellipse cx="200" cy="${y + 8}" rx="92" ry="26" fill="${o.edge || '#c98a3a'}"/><ellipse cx="200" cy="${y}" rx="92" ry="26" fill="${o.color || '#e7b25e'}"/>`;
    }
    const topY = 200 - (n - 1) * (o.gap || 22);
    if (o.grid) for (let i = -3; i <= 3; i++) s += `<line x1="${200 + i * 22}" y1="${topY - 22}" x2="${200 + i * 22}" y2="${topY + 20}" stroke="${o.grid}" stroke-width="4"/>` + (Math.abs(i) < 2 ? `<line x1="120" y1="${topY + i * 12}" x2="280" y2="${topY + i * 12}" stroke="${o.grid}" stroke-width="4"/>` : '');
    s += bits(rand, o.bits, rectArea(rand, 140, topY - 20, 120, 30));
    if (o.butter) s += `<rect x="182" y="${topY - 22}" width="36" height="22" rx="4" fill="#fbe6a2"/>`;
    if (o.syrup) s += `<path d="M150 ${topY - 6}c20 14 80 14 100 0" fill="none" stroke="${o.syrup}" stroke-width="8" stroke-linecap="round" opacity=".85"/>`;
    if (o.dust) s += bits(rand, [['dot', 40, '#fffaf0']], rectArea(rand, 130, topY - 24, 140, 40));
    return s + sides(rand, o.sides);
  },
  // A glass or jar seen from the side with layers (smoothies, puddings).
  glass(rand, o) {
    let s = sides(rand, o.under) + `<ellipse cx="200" cy="268" rx="80" ry="12" fill="#000" opacity=".09"/>`;
    const n = o.count || 1;
    const xs = n === 1 ? [200] : n === 2 ? [140, 260] : [105, 200, 295];
    const w = n === 1 ? 140 : n === 2 ? 110 : 84;
    for (const x of xs) {
      const top = o.short ? 140 : 70;
      s += `<rect x="${x - w / 2}" y="${top}" width="${w}" height="${262 - top}" rx="${o.jar ? 18 : 10}" fill="#e6eef0" opacity=".9"/>`;
      let y = 254;
      for (const [c, h] of o.layers) { s += `<rect x="${x - w / 2 + 8}" y="${y - h}" width="${w - 16}" height="${h}" rx="6" fill="${c}"/>`; y -= h; }
      s += bits(rand, o.bits, rectArea(rand, x - w / 2 + 14, y - 10, w - 28, 12));
      if (o.straw) s += `<rect x="${x + 10}" y="${top - 50}" width="10" height="120" rx="5" fill="${o.straw}" transform="rotate(12 ${x} ${top})"/>`;
      s += `<rect x="${x - w / 2 + 6}" y="${top + 16}" width="8" height="${240 - top}" rx="4" fill="#fff" opacity=".4"/>`;
    }
    return s + sides(rand, o.sides);
  },
  // A turned-out dessert on a plate (flan, panna cotta).
  dome(rand, o) {
    let s = sides(rand, o.under) + plate(185, 160, 118) + `<ellipse cx="185" cy="185" rx="92" ry="34" fill="${o.pool || '#b5651d'}" opacity=".9"/>`;
    s += `<path d="M115 180C115 110 255 110 255 180Z" fill="${o.color || '#f2cf6b'}"/><ellipse cx="185" cy="126" rx="56" ry="14" fill="${o.cap || '#c77a28'}"/><ellipse cx="185" cy="180" rx="70" ry="10" fill="${o.color || '#f2cf6b'}"/>`;
    s += bits(rand, o.bits, rectArea(rand, 110, 170, 150, 30));
    return s + sides(rand, o.sides);
  },
  // Two sandwich halves on a plate, side view of the fillings.
  sandwich(rand, o) {
    let s = sides(rand, o.under) + plate(200, 152, 118);
    const half = (dx, r) => {
      let h = `<g transform="translate(${dx} 152) rotate(${r})"><path d="M-70 40L0-70 70 40Z" fill="${o.crust || '#c9974f'}"/><path d="M-58 33L0-58 58 33Z" fill="${o.bread || '#efd6a3'}"/>`;
      let y = 40;
      for (const [c, hgt] of o.layers) { h += `<path d="M-70 ${y}L70 ${y} 70 ${y + hgt}-70 ${y + hgt}Z" fill="${c}"/>`; y += hgt; }
      h += `<path d="M-70 ${y}L70 ${y} 70 ${y + 12}-70 ${y + 12}Z" fill="${o.crust || '#c9974f'}"/></g>`;
      return h;
    };
    s += half(140, -8) + half(262, 10);
    return s + sides(rand, o.sides);
  },
  // A burger in side view.
  burger(rand, o) {
    let s = sides(rand, o.under) + `<ellipse cx="190" cy="262" rx="130" ry="14" fill="#000" opacity=".1"/>`;
    s += `<path d="M85 245h210a12 12 0 0 0 0-8H85a12 12 0 0 0 0 8Z" fill="#c98a3e"/><rect x="85" y="222" width="210" height="26" rx="12" fill="${o.bun || '#d99a4a'}"/>`;
    let y = 222;
    for (const [c, h, wave] of o.layers) {
      y -= h;
      s += wave ? `<path d="M78 ${y + h}q12-${h} 24 0t24 0 24 0 24 0 24 0 24 0 24 0 24 0 24 0" fill="${c}"/>` : `<rect x="80" y="${y}" width="220" height="${h}" rx="${Math.min(10, h / 2)}" fill="${c}"/>`;
    }
    s += `<path d="M85 ${y}C85 ${y - 90} 295 ${y - 90} 295 ${y}Z" fill="${o.bun || '#d99a4a'}"/><path d="M110 ${y - 18}C130 ${y - 64} 250 ${y - 64} 270 ${y - 18}" fill="none" stroke="#e8b466" stroke-width="10" stroke-linecap="round"/>`;
    s += bits(rand, [['sesame', o.seeds ?? 16, '#fbf1d4']], rectArea(rand, 125, y - 60, 130, 36));
    return s + sides(rand, o.sides);
  },
  // A long roll, side view (banh mi, cheesesteak, sausage and peppers, pulled pork).
  sub(rand, o) {
    let s = sides(rand, o.under) + `<rect x="30" y="80" width="340" height="170" rx="18" fill="#000" opacity=".08"/><rect x="24" y="72" width="340" height="170" rx="18" fill="${o.board || '#c9965e'}"/>`;
    s += `<path d="M50 190C50 230 340 230 340 190Z" fill="${o.bread || '#d99a4a'}"/>`;
    s += bits(rand, o.bits, rectArea(rand, 70, 150, 250, 40));
    s += `<path d="M44 160C60 100 330 100 346 160Z" fill="${o.bread || '#d99a4a'}"/><path d="M90 128q20-10 40 0M170 120q20-10 40 0M250 124q20-10 40 0" stroke="#f0c070" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    return s + sides(rand, o.sides);
  },
  // Tacos in a row on a board.
  tacos(rand, o) {
    let s = sides(rand, o.under) + `<rect x="25" y="70" width="350" height="190" rx="22" fill="#000" opacity=".08"/><rect x="20" y="62" width="350" height="190" rx="22" fill="#c9965e"/><rect x="30" y="72" width="330" height="170" rx="16" fill="#d8a870"/>`;
    for (const x of [90, 195, 300]) {
      s += `<path d="M${x - 50} 200A50 50 0 0 1 ${x + 50} 200Z" fill="${o.shell || '#f1dcaa'}"/>`;
      s += bits(rand, o.bits, rectArea(rand, x - 36, 150, 72, 30));
      s += `<path d="M${x - 50} 200A50 50 0 0 1 ${x + 50} 200" fill="none" stroke="${o.shellEdge || '#e0c07e'}" stroke-width="10"/><rect x="${x - 55}" y="196" width="110" height="10" rx="5" fill="${o.shell || '#f1dcaa'}"/>`;
    }
    return s + sides(rand, o.sides);
  },
  // Burritos cut in half showing the filling.
  burrito(rand, o) {
    let s = sides(rand, o.under) + plate(190, 152, 120);
    const one = (x, y, r) => {
      let b = `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-80" y="-30" width="140" height="60" rx="30" fill="${o.wrap || '#f1dcaa'}"/><path d="M-60-24q30 14 60 0" stroke="#e0c07e" stroke-width="4" fill="none"/><ellipse cx="60" cy="0" rx="18" ry="30" fill="${o.wrap || '#f1dcaa'}"/><ellipse cx="60" cy="0" rx="13" ry="25" fill="${o.fill || '#8a4a2c'}"/></g>`;
      return b + bits(rand, o.bits, circleArea(rand, x + Math.cos(r * Math.PI / 180) * 60, y + Math.sin(r * Math.PI / 180) * 60, 14));
    };
    s += one(170, 110, -8) + one(190, 190, 6);
    return s + sides(rand, o.sides);
  },
  // Skewers across a plate.
  skewers(rand, o) {
    let s = sides(rand, o.under) + plate(190, 150, 120);
    for (const [y, r] of [[110, -10], [160, 4], [205, -4]].slice(0, o.n || 3)) {
      s += `<rect x="60" y="${y - 3}" width="260" height="6" rx="3" fill="#c9a27a" transform="rotate(${r} 190 ${y})"/>`;
      for (let i = 0; i < 5; i++) {
        const x = 100 + i * 44;
        const piece = o.pieces[i % o.pieces.length];
        s += `<g transform="rotate(${r} 190 ${y})">${piece === 'kofta' ? `<rect x="${x - 30}" y="${y - 13}" width="200" height="26" rx="13" fill="#7a3f22"/>` : BITS[piece](rand, x, y, rand() * 60)}</g>`;
        if (piece === 'kofta') break;
      }
    }
    s += bits(rand, o.bits, circleArea(rand, 190, 150, 90));
    return s + sides(rand, o.sides);
  },
  // Rolls on a plate: fresh spring rolls or rolled crepes.
  rolls(rand, o) {
    let s = sides(rand, o.under) + plate(185, 150, 118);
    for (const [x, y, r] of [[140, 110, -20], [230, 120, 15], [185, 190, -5]]) {
      s += `<g transform="rotate(${r} ${x} ${y})"><rect x="${x - 60}" y="${y - 24}" width="120" height="48" rx="24" fill="${o.wrap || '#f4efe6'}" opacity=".95"/>`;
      s += bits(rand, o.bits, rectArea(rand, x - 48, y - 14, 96, 28));
      s += `<rect x="${x - 60}" y="${y - 24}" width="120" height="48" rx="24" fill="#fff" opacity="${o.clear ? 0.35 : 0}"/></g>`;
    }
    return s + sides(rand, o.sides);
  },
  // Spiral buns (cinnamon rolls) or round buns (dinner rolls, biscuits) in a pan.
  buns(rand, o) {
    let s = sides(rand, o.under) + `<rect x="50" y="35" width="300" height="230" rx="20" fill="#000" opacity=".09"/><rect x="45" y="28" width="300" height="230" rx="20" fill="${o.pan || '#a9adb4'}"/>`;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
      const x = 85 + c * 73, y = 67 + r * 76;
      s += `<circle cx="${x}" cy="${y}" r="36" fill="${o.edge || '#c07a2c'}"/><circle cx="${x}" cy="${y}" r="31" fill="${o.color || '#e6b060'}"/>`;
      if (o.spiral) s += `<path d="M${x} ${y}m-3 0a3 3 0 1 1 6 0a8 8 0 1 1-16 0a14 14 0 1 1 28 0a20 20 0 1 1-40 0" fill="none" stroke="${o.spiral}" stroke-width="4"/>`;
      if (o.glaze) s += `<path d="M${x - 20} ${y - 6}q10 10 20 0t20 0" fill="none" stroke="${o.glaze}" stroke-width="6" stroke-linecap="round"/>`;
      if (o.shine) s += `<ellipse cx="${x - 8}" cy="${y - 10}" rx="12" ry="7" fill="#fff" opacity=".22"/>`;
      s += bits(rand, o.bits, circleArea(rand, x, y, 22));
    }
    return s + sides(rand, o.sides);
  },
  // Dip in a bowl with dippers around it.
  dip(rand, o) {
    let s = sides(rand, o.under) + `<circle cx="205" cy="158" r="136" fill="#000" opacity=".07"/><circle cx="200" cy="150" r="136" fill="${o.board || '#f4efe6'}"/>`;
    s += bits(rand, o.dippers, () => { const a = rand() * Math.PI * 2; const d = 100 + rand() * 25; return [r1(200 + Math.cos(a) * d), r1(150 + Math.sin(a) * d)]; });
    s += bowl(200, 150, 82, o.base || '#9ccf6a');
    if (o.swirl) s += `<path d="M160 150c10-30 70-30 80 0s-40 30-50 10 10-25 30-15" fill="none" stroke="${o.swirl}" stroke-width="6" stroke-linecap="round"/>`;
    if (o.oil) s += `<circle cx="200" cy="150" r="22" fill="${o.oil}" opacity=".7"/>`;
    s += bits(rand, o.bits, circleArea(rand, 200, 150, 58));
    return s + sides(rand, o.sides);
  },
  // Deviled eggs on a plate.
  deviled(rand, o) {
    let s = sides(rand, o.under) + plate(190, 150, 122);
    const pts = [[120, 100], [190, 90], [260, 100], [110, 160], [190, 150], [270, 160], [140, 215], [240, 215]];
    for (const [x, y] of pts) s += `<ellipse cx="${x}" cy="${y}" rx="30" ry="20" fill="#fffdf6" stroke="#ece5d3" stroke-width="2"/><ellipse cx="${x}" cy="${y}" rx="16" ry="11" fill="#f7d35a"/><circle cx="${x - 4}" cy="${y - 2}" r="2" fill="#d0542a"/><circle cx="${x + 5}" cy="${y + 2}" r="2" fill="#d0542a"/>${leaf(x + 2, y - 4, 4, 30, '#3f8a3c')}`;
    return s + sides(rand, o.sides);
  },
  // A whole roast chicken on a platter.
  chicken(rand, o) {
    let s = sides(rand, o.under) + `<ellipse cx="195" cy="160" rx="170" ry="120" fill="#000" opacity=".08"/><ellipse cx="190" cy="152" rx="170" ry="120" fill="#f4efe6"/>`;
    s += bits(rand, o.bits, () => { const a = rand() * Math.PI * 2; return [r1(190 + Math.cos(a) * 130), r1(152 + Math.sin(a) * 88)]; });
    s += `<ellipse cx="190" cy="150" rx="96" ry="72" fill="#b8742e"/><ellipse cx="185" cy="140" rx="82" ry="58" fill="#d99a45"/><ellipse cx="175" cy="125" rx="40" ry="22" fill="#e9b766"/>`;
    s += `<g transform="translate(270 120) rotate(-30)"><ellipse cx="0" cy="0" rx="32" ry="20" fill="#c98a3e"/><rect x="24" y="-6" width="20" height="12" rx="6" fill="#f3ead6"/></g><g transform="translate(270 185) rotate(30)"><ellipse cx="0" cy="0" rx="32" ry="20" fill="#c98a3e"/><rect x="24" y="-6" width="20" height="12" rx="6" fill="#f3ead6"/></g>`;
    s += bits(rand, o.top, circleArea(rand, 185, 145, 60));
    return s + sides(rand, o.sides);
  },
  // Corn cobs on a plate.
  corn(rand, o) {
    let s = sides(rand, o.under) + plate(190, 150, 122);
    for (const [y, r] of [[110, -12], [175, 8]]) {
      s += `<g transform="rotate(${r} 190 ${y})"><rect x="90" y="${y - 28}" width="200" height="56" rx="28" fill="#e9b53a"/>`;
      for (let i = 0; i < 12; i++) for (let j = 0; j < 4; j++) s += `<rect x="${100 + i * 15}" y="${y - 22 + j * 12}" width="12" height="10" rx="4" fill="${o.kernel || '#f6cf52'}"/>`;
      s += bits(rand, o.bits, rectArea(rand, 100, y - 22, 180, 44)) + `<rect x="280" y="${y - 6}" width="30" height="12" rx="6" fill="#c9a27a"/></g>`;
    }
    return s + sides(rand, o.sides);
  },
  // Cut wedges fanned on a plate (spanakopita triangles, scones).
  wedges(rand, o) {
    let s = sides(rand, o.under) + plate(185, 152, 120);
    for (let i = 0; i < (o.n || 6); i++) {
      s += `<g transform="translate(185 152) rotate(${i * (360 / (o.n || 6)) + 10})"><path d="M14 0L96 -32A100 100 0 0 1 96 32Z" fill="${o.edge || '#c98a3e'}"/><path d="M22 0L90 -24A92 92 0 0 1 90 24Z" fill="${o.color || '#e6b666'}"/>`;
      if (o.layers) s += `<path d="M30 -6L94 -14M30 6L94 14" stroke="${o.layers}" stroke-width="2"/>`;
      s += `</g>`;
    }
    s += bits(rand, o.bits, circleArea(rand, 185, 152, 95));
    return s + sides(rand, o.sides);
  },
  // Toasts on a board (avocado toast, bruschetta, garlic bread).
  toasts(rand, o) {
    let s = sides(rand, o.under) + `<rect x="30" y="60" width="340" height="190" rx="18" fill="#000" opacity=".08"/><rect x="24" y="52" width="340" height="190" rx="18" fill="${o.board || '#c9965e'}"/>`;
    const n = o.n || 3;
    for (let i = 0; i < n; i++) {
      const x = 70 + i * (260 / n) + (n > 3 ? 0 : 10), y = 90 + (i % 2) * 20;
      const w = o.w || (n > 3 ? 64 : 80);
      s += `<rect x="${x}" y="${y}" width="${w}" height="${o.h || 110}" rx="${o.round ?? 20}" fill="${o.crust || '#b8742e'}"/><rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${(o.h || 110) - 12}" rx="${Math.max(6, (o.round ?? 20) - 6)}" fill="${o.top || '#e6b666'}"/>`;
      s += bits(rand, o.bits, rectArea(rand, x + 10, y + 10, w - 20, (o.h || 110) - 20));
    }
    return s + sides(rand, o.sides);
  },
  // Fish and chips in a paper-lined basket.
  fishchips(rand, o) {
    let s = sides(rand, o.under) + `<rect x="50" y="40" width="300" height="220" rx="24" fill="#000" opacity=".08"/><rect x="45" y="32" width="300" height="220" rx="24" fill="#b53a2e"/><rect x="58" y="45" width="274" height="194" rx="16" fill="#f4efe6"/>`;
    for (let i = 0; i < 22; i++) s += `<rect x="${r1(80 + rand() * 110)}" y="${r1(120 + rand() * 100)}" width="14" height="60" rx="5" fill="${rand() > 0.5 ? '#e9b64a' : '#f3cb66'}" transform="rotate(${Math.round(rand() * 180)} ${r1(130)} ${r1(170)})"/>`;
    s += MAINS.fishfry(245, 110, -15) + MAINS.fishfry(250, 185, 10);
    return s + sides(rand, o.sides);
  },
  // Things fanned on a plate: crepes folded into triangles.
  folded(rand, o) {
    let s = sides(rand, o.under) + plate(185, 152, 120);
    for (const [x, y, r] of [[140, 120, -20], [230, 125, 25], [185, 195, 90]]) s += `<g transform="rotate(${r} ${x} ${y})"><path d="M${x - 50} ${y + 30}L${x + 50} ${y + 30}L${x} ${y - 45}Z" fill="${o.edge || '#e0a54a'}"/><path d="M${x - 40} ${y + 24}L${x + 40} ${y + 24}L${x} ${y - 34}Z" fill="${o.color || '#f3cf82'}"/></g>`;
    s += bits(rand, o.bits, circleArea(rand, 185, 152, 90));
    return s + sides(rand, o.sides);
  },
  // Shortcake: split biscuit with cream and berries, side view.
  shortcake(rand, o) {
    let s = sides(rand, o.under) + plate(200, 170, 118);
    s += `<rect x="120" y="190" width="160" height="42" rx="18" fill="#c98a3e"/><rect x="126" y="188" width="148" height="30" rx="14" fill="#f1dcb0"/>`;
    s += `<path d="M110 190C110 160 290 160 290 190Z" fill="#fffaf0"/>` + bits(rand, [['straw', 9]], rectArea(rand, 120, 165, 160, 22));
    s += `<path d="M125 150C125 90 275 90 275 150Z" fill="#d99a4a"/><rect x="125" y="140" width="150" height="18" rx="8" fill="#f1dcb0"/>` + bits(rand, [['dot', 20, '#fffaf0']], rectArea(rand, 140, 100, 120, 36));
    return s + sides(rand, o.sides);
  },
  // Slices of a layered dessert in a square dish seen from above, one slice lifted (tiramisu).
  layered(rand, o) {
    let s = sides(rand, o.under) + `<rect x="50" y="45" width="220" height="210" rx="18" fill="#000" opacity=".09"/><rect x="45" y="38" width="220" height="210" rx="18" fill="#f7f4ee"/><rect x="60" y="53" width="190" height="180" rx="12" fill="${o.top || '#7a4a30'}"/>`;
    s += bits(rand, [['dot', 80, o.dust || '#5a3021']], rectArea(rand, 64, 58, 180, 170));
    s += `<rect x="190" y="150" width="60" height="83" fill="#f7f4ee"/>`;
    s += plate(320, 190, 64) + `<g transform="translate(320 190)">`;
    let y = 30;
    for (const [c, h] of o.layers) { y -= h; s += `<rect x="-36" y="${y}" width="72" height="${h}" fill="${c}"/>`; }
    s += `</g>`;
    return s + sides(rand, o.sides);
  },
  // Popcorn heaped in a bowl.
  popcorn(rand, o) {
    let s = bowl(190, 155, 118, '#f3e2b0');
    s += bits(rand, [['puff', 70]], circleArea(rand, 190, 155, 92));
    s += bits(rand, [['puff', 5]], () => [r1(40 + rand() * 330), r1(20 + rand() * 270)]).replace(/<g>/g, '<g opacity=".95">');
    return s;
  },
};

// Scatter bits inside a circle; used by the hand-drawn extras.
export const bitsAt = (rand, list, cx, cy, r) => bits(rand, list, circleArea(rand, cx, cy, r));
