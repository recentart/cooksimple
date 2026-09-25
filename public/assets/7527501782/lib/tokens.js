// Inline tokens in recipe step text:
//   {temp 425F oven}   {temp 165F internal}   {temp 350F oil}   {temp 180F}
//   {time 5 min}       {time 20-25 min}       {time 1 hr 30 min}  {time 8 hr notimer}
//   {qty 1 cup}        {qty 1/2 cup fixed}    {qty 2-3 tbsp}
//   {len 1 in}         {len 9x13 in}
//   {count 6-8}        (a plain number that follows the serving scaler)
// Temperatures and lengths follow the unit toggle, quantities also follow the
// serving scaler, and every {time} token (unless marked notimer) gets a timer.

import { parseAmount, parseNumber, formatFraction, formatDecimal } from './quantity.js';
import { unitId, fToC, cToF, CM_PER_INCH } from './units.js';
import { formatQuantity, formatCount, scaleRange } from './format.js';

const TOKEN_RE = /\{(temp|time|qty|len|count)\s+([^{}]+)\}/g;
const TEMP_KINDS = ['oven', 'internal', 'oil', 'water'];

export function parseTemp(body) {
  const m = body.trim().match(/^(\d+(?:\.\d+)?)\s*°?\s*([FC])(?:\s+([a-z]+))?$/i);
  if (!m) return { error: `bad temperature "${body}" (use e.g. {temp 425F oven})` };
  const kind = m[3] ? m[3].toLowerCase() : null;
  if (kind && !TEMP_KINDS.includes(kind)) return { error: `unknown temperature kind "${kind}" (use ${TEMP_KINDS.join(', ')})` };
  return { value: Number(m[1]), unit: m[2].toUpperCase(), kind };
}

const TIME_UNITS = { sec: 1, second: 1, seconds: 1, s: 1, min: 60, mins: 60, minute: 60, minutes: 60, m: 60, hr: 3600, hrs: 3600, hour: 3600, hours: 3600, h: 3600 };

export function parseTime(body) {
  let s = body.trim().toLowerCase();
  let notimer = false;
  if (/\bnotimer$/.test(s)) {
    notimer = true;
    s = s.replace(/\s*notimer$/, '');
  }
  let m = s.match(/^([\d./\s½¼¾]+?)\s*(?:-|–|to)\s*([\d./\s½¼¾]+?)\s*([a-z]+)$/);
  if (m) {
    const mult = TIME_UNITS[m[3]];
    const lo = parseNumber(m[1]);
    const hi = parseNumber(m[2]);
    if (!mult || !(lo > 0) || !(hi > lo)) return { error: `bad time range "${body}"` };
    return { min: Math.round(lo * mult), max: Math.round(hi * mult), notimer };
  }
  const parts = [...s.matchAll(/([\d./½¼¾]+)\s*([a-z]+)/g)];
  const rebuilt = parts.map((p) => p[0]).join(' ');
  if (!parts.length || rebuilt.replace(/\s+/g, '') !== s.replace(/\s+/g, '')) return { error: `bad time "${body}" (use e.g. {time 5 min})` };
  let total = 0;
  for (const p of parts) {
    const mult = TIME_UNITS[p[2]];
    const n = parseNumber(p[1]);
    if (!mult || !(n > 0)) return { error: `bad time "${body}"` };
    total += n * mult;
  }
  return { min: Math.round(total), max: Math.round(total), notimer };
}

export function parseQty(body) {
  let s = body.trim();
  let fixed = false;
  if (/\sfixed$/.test(s)) {
    fixed = true;
    s = s.replace(/\s+fixed$/, '');
  }
  const m = s.match(/^(.+?)\s+([a-zA-Z][a-zA-Z .]*)$/);
  if (!m) return { error: `bad quantity "${body}" (use e.g. {qty 1 cup})` };
  const amount = parseAmount(m[1]);
  const unit = unitId(m[2]);
  if (!amount) return { error: `bad amount in "${body}"` };
  if (!unit) return { error: `unknown unit "${m[2]}" in "${body}"` };
  return { amount, unit, fixed };
}

export function parseLen(body) {
  const m = body.trim().match(/^([\d./ ]+(?:\s*x\s*[\d./ ]+)*)\s*(in|inch|inches|cm)$/i);
  if (!m) return { error: `bad length "${body}" (use e.g. {len 1 in} or {len 9x13 in})` };
  const dims = m[1].split(/\s*x\s*/i).map((d) => parseNumber(d.trim()));
  if (dims.some((d) => !(d > 0))) return { error: `bad length "${body}"` };
  return { dims, unit: /^cm$/i.test(m[2]) ? 'cm' : 'in' };
}

export function parseCount(body) {
  let s = body.trim();
  let fixed = false;
  if (/\sfixed$/.test(s)) {
    fixed = true;
    s = s.replace(/\s+fixed$/, '');
  }
  const amount = parseAmount(s);
  if (!amount) return { error: `bad count "${body}" (use e.g. {count 12} or {count 6-8})` };
  return { amount, fixed };
}

const PARSERS = { temp: parseTemp, time: parseTime, qty: parseQty, len: parseLen, count: parseCount };

/** Split text into segments. Each token segment has {type, ...parsed} or {type, error}. */
export function tokenize(text) {
  const out = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN_RE)) {
    if (m.index > last) out.push({ type: 'text', value: text.slice(last, m.index) });
    out.push({ type: m[1], raw: m[0], ...PARSERS[m[1]](m[2]) });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ type: 'text', value: text.slice(last) });
  return out;
}

/** Problems in a step's text: bad tokens and stray braces. */
export function tokenErrors(text) {
  const errors = tokenize(text).filter((s) => s.error).map((s) => s.error);
  const stripped = text.replace(TOKEN_RE, '');
  if (/[{}]/.test(stripped)) errors.push(`stray or unknown {…} token in "${text.slice(0, 60)}…"`);
  return errors;
}

// ---------- Rendering ----------

/** Temperature in the requested system. Oven and oil temps round to 5°, others to 1°. */
export function formatTemp(t, system) {
  const target = system === 'metric' ? 'C' : 'F';
  let v = t.value;
  if (t.unit !== target) v = target === 'C' ? fToC(v) : cToF(v);
  const coarse = t.kind === 'oven' || t.kind === 'oil' || (t.kind !== 'internal' && (target === 'F' ? v >= 250 : v >= 120));
  const rounded = t.unit === target ? v : coarse ? Math.round(v / 5) * 5 : Math.round(v);
  return `${formatDecimal(rounded, 1)}°${target}`;
}

export function formatDuration(seconds) {
  if (seconds % 3600 === 0) {
    const h = seconds / 3600;
    return `${h} ${h === 1 ? 'hour' : 'hours'}`;
  }
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const rest = seconds - h * 3600;
    if (rest === 1800) return `${h}½ hours`;
    return `${h} ${h === 1 ? 'hour' : 'hours'} ${formatDuration(rest)}`;
  }
  if (seconds % 60 === 0) {
    const m = seconds / 60;
    return `${m} ${m === 1 ? 'minute' : 'minutes'}`;
  }
  if (seconds > 60) return `${Math.floor(seconds / 60)} min ${seconds % 60} sec`;
  return `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
}

export function formatTimeRange(t) {
  if (t.min === t.max) return formatDuration(t.min);
  // "20–25 minutes" / "1–2 hours" when both ends share a unit
  for (const [unit, one, many] of [[3600, 'hour', 'hours'], [60, 'minute', 'minutes'], [1, 'second', 'seconds']]) {
    if (t.min % unit === 0 && t.max % unit === 0) {
      return `${t.min / unit}–${t.max / unit} ${t.max / unit === 1 ? one : many}`;
    }
  }
  return `${formatDuration(t.min)} to ${formatDuration(t.max)}`;
}

/** Clock-style label for a timer: 5:00, 1:30:00. */
export function clock(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return h ? `${h}:${mm}:${String(sec).padStart(2, '0')}` : `${mm}:${String(sec).padStart(2, '0')}`;
}

export function formatLen(l, system) {
  const toCm = l.unit === 'in' && system === 'metric';
  const toIn = l.unit === 'cm' && system !== 'metric';
  if (toCm) {
    const cm = l.dims.map((d) => d * CM_PER_INCH);
    if (cm.length === 1 && cm[0] < 1) return `${formatDecimal(cm[0] * 10, 1)} mm`;
    return `${cm.map((c) => formatDecimal(c, c < 5 ? 0.1 : 1)).join('×')} cm`;
  }
  if (toIn) {
    const inches = l.dims.map((d) => d / CM_PER_INCH);
    return `${inches.map((i) => formatFraction(Math.round(i * 4) / 4)).join('×')}-inch`;
  }
  if (l.unit === 'in') return `${l.dims.map((d) => formatFraction(d)).join('×')}-inch`;
  return `${l.dims.map((d) => formatDecimal(d, 0.1)).join('×')} cm`;
}

const escapeHTML = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Render step text. mode 'html' wraps tokens in spans and escapes text;
 * mode 'text' gives plain text (temperatures in both systems when `both`).
 */
export function renderStep(text, { factor = 1, system = 'us', mode = 'html', both = false } = {}) {
  const segs = tokenize(text);
  let out = '';
  for (const s of segs) {
    let piece;
    let cls;
    if (s.type === 'text') {
      out += mode === 'html' ? escapeHTML(s.value) : s.value;
      continue;
    }
    if (s.error) {
      piece = s.raw;
      cls = 't-error';
    } else if (s.type === 'temp') {
      piece = formatTemp(s, system);
      if (both) piece += ` (${formatTemp(s, system === 'metric' ? 'us' : 'metric')})`;
      cls = 't-temp';
    } else if (s.type === 'time') {
      piece = formatTimeRange(s);
      cls = 't-time';
    } else if (s.type === 'qty') {
      const amt = scaleRange(s.amount, factor, s.fixed ? 'fixed' : 'linear');
      const q = formatQuantity(amt, s.unit, system, null);
      piece = q.alt ? `${q.text} (${q.alt})` : q.text;
      cls = 't-qty';
    } else if (s.type === 'count') {
      piece = formatCount(scaleRange(s.amount, factor, s.fixed ? 'fixed' : 'linear'), false);
      cls = 't-qty';
    } else if (s.type === 'len') {
      piece = formatLen(s, system);
      if (both) piece += ` (${formatLen(s, system === 'metric' ? 'us' : 'metric')})`;
      cls = 't-len';
    }
    out += mode === 'html' ? `<span class="${cls}">${escapeHTML(piece)}</span>` : piece;
  }
  return out;
}

/** Does this text change with the unit system or the scale? */
export function stepVaries(text) {
  return tokenize(text).some((s) => s.type === 'temp' || s.type === 'qty' || s.type === 'len');
}

/** Does the text contain any token at all? */
export function hasTokens(text) {
  return tokenize(text).some((s) => s.type !== 'text');
}

export function stepScales(text) {
  return tokenize(text).some((s) => (s.type === 'qty' || s.type === 'count') && !s.fixed);
}

/** Timers for a step: one per {time} token not marked notimer. Uses the low end of a range. */
export function stepTimers(text) {
  return tokenize(text)
    .filter((s) => s.type === 'time' && !s.error && !s.notimer)
    .map((s) => ({ seconds: s.min, maxSeconds: s.max, label: formatTimeRange(s) }));
}

/** All temperature tokens in a text. */
export function stepTemps(text) {
  return tokenize(text).filter((s) => s.type === 'temp' && !s.error);
}

