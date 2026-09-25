// Kitchen timers. Each timer stores its end time, not a countdown, so it
// stays accurate when the tab is in the background or the phone sleeps, and
// it survives a page reload (session storage).

import { store, esc } from './core.js';
import { clock } from '../lib/tokens.js';

const KEY = 'cs:timers';
const MAX_TIMERS = 8;
const ALARM_MS = 90_000; // keep beeping for up to 90 s unless dismissed

let timers = load();
const listeners = new Set();
let ticker = 0;
let audio = null;
let alarmLoop = 0;
let baseTitle = document.title;

function load() {
  const raw = store.get('session', KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((t) => t && typeof t.id === 'string' && typeof t.duration === 'number' && t.duration > 0)
    .map((t) => ({ ...t, label: String(t.label || 'Timer').slice(0, 80) }))
    .slice(0, MAX_TIMERS);
}

function save() {
  store.set('session', KEY, timers);
}

export function remaining(t, now = Date.now()) {
  if (t.state === 'running') return Math.max(0, (t.endAt - now) / 1000);
  if (t.state === 'paused') return t.remaining;
  return 0;
}

export function list() {
  return timers.slice();
}

export function find(key) {
  return timers.find((t) => t.key === key) || null;
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  save();
  for (const fn of listeners) fn(timers);
  schedule();
}

function unlockAudio() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audio) audio = new Ctx();
    if (audio.state === 'suspended') audio.resume();
  } catch {
    audio = null;
  }
}

function beep() {
  if (!audio) return;
  try {
    const t0 = audio.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, t0 + i * 0.35);
      gain.gain.exponentialRampToValueAtTime(0.4, t0 + i * 0.35 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.35 + 0.25);
      osc.connect(gain).connect(audio.destination);
      osc.start(t0 + i * 0.35);
      osc.stop(t0 + i * 0.35 + 0.3);
    }
  } catch {
    /* audio not available */
  }
}

/**
 * Start a timer. `key` identifies the step timer so the same button does not
 * start duplicates; pressing it again on a finished timer restarts it.
 */
export function start({ key, label, seconds, href }) {
  unlockAudio();
  const secs = Math.round(Number(seconds));
  if (!(secs > 0) || secs > 48 * 3600) return null;
  const existing = key ? find(key) : null;
  if (existing && existing.state !== 'done') return existing;
  if (existing) timers = timers.filter((t) => t !== existing);
  if (timers.length >= MAX_TIMERS) timers = timers.filter((t) => t.state !== 'done').slice(-(MAX_TIMERS - 1));
  const t = { id: `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, key: key || null, label, href: href || null, duration: secs, endAt: Date.now() + secs * 1000, remaining: secs, state: 'running' };
  timers.push(t);
  emit();
  return t;
}

export function pause(id) {
  const t = timers.find((x) => x.id === id);
  if (!t || t.state !== 'running') return;
  t.remaining = remaining(t);
  t.state = 'paused';
  emit();
}

export function resume(id) {
  const t = timers.find((x) => x.id === id);
  if (!t || t.state !== 'paused') return;
  unlockAudio();
  t.endAt = Date.now() + t.remaining * 1000;
  t.state = 'running';
  emit();
}

export function addMinute(id) {
  const t = timers.find((x) => x.id === id);
  if (!t) return;
  unlockAudio();
  if (t.state === 'running') t.endAt += 60_000;
  else if (t.state === 'paused') t.remaining += 60;
  else {
    t.state = 'running';
    t.endAt = Date.now() + 60_000;
  }
  emit();
}

export function cancel(id) {
  timers = timers.filter((x) => x.id !== id);
  emit();
}

export function anyRunning() {
  return timers.some((t) => t.state === 'running' || t.state === 'paused');
}

function ringing() {
  return timers.filter((t) => t.state === 'done' && !t.dismissed && Date.now() - t.doneAt < ALARM_MS);
}

function check() {
  const now = Date.now();
  let changed = false;
  for (const t of timers) {
    if (t.state === 'running' && t.endAt <= now) {
      t.state = 'done';
      t.doneAt = now;
      changed = true;
      announce(`Time’s up: ${t.label}`);
    }
  }
  if (changed) emit();
  for (const fn of listeners) fn(timers, true);
}

function schedule() {
  const active = timers.some((t) => t.state === 'running') || ringing().length;
  if (active && !ticker) ticker = setInterval(check, 250);
  if (!active && ticker) {
    clearInterval(ticker);
    ticker = 0;
  }
  const ring = ringing().length > 0;
  if (ring && !alarmLoop) {
    const cycle = () => {
      if (!ringing().length) return stopAlarm();
      beep();
      if (navigator.vibrate) navigator.vibrate([250, 120, 250, 120, 400]);
      document.title = `⏰ Time’s up! · ${baseTitle}`;
    };
    cycle();
    alarmLoop = setInterval(cycle, 2500);
  } else if (!ring && alarmLoop) {
    stopAlarm();
  }
}

function stopAlarm() {
  clearInterval(alarmLoop);
  alarmLoop = 0;
  document.title = baseTitle;
}

export function dismiss(id) {
  const t = timers.find((x) => x.id === id);
  if (!t) return;
  timers = timers.filter((x) => x !== t);
  emit();
}

function announce(text) {
  let live = document.getElementById('timer-announcer');
  if (!live) {
    live = document.createElement('div');
    live.id = 'timer-announcer';
    live.className = 'vh';
    live.setAttribute('role', 'alert');
    document.body.append(live);
  }
  live.textContent = '';
  setTimeout(() => (live.textContent = text), 50);
}

// ---------- Rendering ----------

/** HTML for a list of timers (used by the page tray and by Cook Mode). */
export function timersHTML(items = timers) {
  return items
    .map((t) => {
      const secs = remaining(t);
      const done = t.state === 'done';
      const paused = t.state === 'paused';
      return `<li class="timer${done ? ' is-done' : ''}${paused ? ' is-paused' : ''}" data-id="${esc(t.id)}">
  <span class="timer-label">${esc(t.label)}</span>
  <span class="timer-clock" data-clock>${done ? 'Time’s up!' : clock(secs)}</span>
  <span class="timer-actions">
    ${done ? `<button type="button" class="tbtn tbtn-strong" data-timer-act="dismiss">Dismiss</button><button type="button" class="tbtn" data-timer-act="add">+1 min</button>` : `<button type="button" class="tbtn" data-timer-act="${paused ? 'resume' : 'pause'}">${paused ? 'Resume' : 'Pause'}</button><button type="button" class="tbtn" data-timer-act="add">+1 min</button><button type="button" class="tbtn" data-timer-act="cancel" aria-label="Cancel timer: ${esc(t.label)}">✕</button>`}
  </span>
</li>`;
    })
    .join('');
}

/** Handle clicks on timer controls inside `root`. */
export function bindTimerActions(root) {
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-timer-act]');
    if (!btn) return;
    const id = btn.closest('[data-id]')?.getAttribute('data-id');
    const act = btn.getAttribute('data-timer-act');
    ({ pause, resume, add: addMinute, cancel, dismiss })[act]?.(id);
  });
}

/** Update only the clocks (cheap, runs every tick). */
export function refreshClocks(root) {
  for (const li of root.querySelectorAll('.timer[data-id]')) {
    const t = timers.find((x) => x.id === li.getAttribute('data-id'));
    const c = li.querySelector('[data-clock]');
    if (t && c && t.state !== 'done') c.textContent = clock(remaining(t));
  }
}

/** The floating tray on normal pages. Hidden while Cook Mode is open. */
export function mountTray() {
  const tray = document.createElement('section');
  tray.className = 'timer-tray';
  tray.setAttribute('aria-label', 'Timers');
  tray.hidden = true;
  tray.innerHTML = '<ul class="timer-list"></ul>';
  document.body.append(tray);
  const ul = tray.querySelector('ul');
  bindTimerActions(tray);
  let lastSig = '';
  const render = (_, tickOnly) => {
    const sig = timers.map((t) => `${t.id}:${t.state}`).join('|');
    if (tickOnly && sig === lastSig) return refreshClocks(tray);
    lastSig = sig;
    ul.innerHTML = timersHTML();
    tray.hidden = timers.length === 0;
    document.body.classList.toggle('has-timers', timers.length > 0);
  };
  onChange(render);
  render();
  return tray;
}

export function setBaseTitle(t) {
  baseTitle = t;
}

// Timers restored after a reload keep running.
schedule();
window.addEventListener('pageshow', () => check());
