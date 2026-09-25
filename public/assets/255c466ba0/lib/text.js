// Text normalisation for search and ingredient matching.
// "Tomatoes", "tomato" and "TOMATO " all normalise to "tomato".

const SINGULAR_EXCEPTIONS = {
  cookies: 'cookie', chilies: 'chili', chillies: 'chilli', pies: 'pie', leaves: 'leaf', halves: 'half',
  loaves: 'loaf', olives: 'olive', chives: 'chive', cloves: 'clove', knives: 'knife', potatoes: 'potato',
  tomatoes: 'tomato', mangoes: 'mango', molasses: 'molasses', hummus: 'hummus', asparagus: 'asparagus',
  couscous: 'couscous', swiss: 'swiss', grits: 'grits', lentils: 'lentil', brownies: 'brownie',
  anchovies: 'anchovy', berries: 'berry', cherries: 'cherry', noodles: 'noodle', dishes: 'dish',
  glasses: 'glass', bus: 'bus', citrus: 'citrus', greens: 'green', oats: 'oat', series: 'series',
};

export function singularize(word) {
  if (SINGULAR_EXCEPTIONS[word]) return SINGULAR_EXCEPTIONS[word];
  if (word.length <= 3) return word;
  if (/ies$/.test(word)) return word.slice(0, -3) + 'y';
  if (/(ch|sh|x|z|ss)es$/.test(word)) return word.slice(0, -2);
  if (/oes$/.test(word)) return word.slice(0, -2);
  if (/(ss|us|is)$/.test(word)) return word;
  if (/s$/.test(word)) return word.slice(0, -1);
  return word;
}

/** Lowercase, strip accents and punctuation, singularise each word. */
export function normalize(text) {
  return String(text)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(singularize)
    .join(' ');
}

export function words(text) {
  const n = normalize(text);
  return n ? n.split(' ') : [];
}

/** Split user input like "chicken, rice; onion\ngarlic" into distinct terms. */
export function splitTerms(input, max = 20) {
  const seen = new Set();
  const out = [];
  for (const raw of String(input || '').split(/[,;\n]+/)) {
    const t = raw.trim().replace(/\s+/g, ' ').slice(0, 40);
    const n = normalize(t);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}
