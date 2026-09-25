import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokenize, tokenErrors, renderStep, stepTimers, formatTemp, formatTimeRange, clock, formatLen, parseTime } from '../src/lib/tokens.js';

test('temperatures: oven rounds to 5°C, internal to 1°C', () => {
  const t = (v, unit, kind, sys) => formatTemp({ value: v, unit, kind }, sys);
  assert.equal(t(425, 'F', 'oven', 'metric'), '220°C');
  assert.equal(t(350, 'F', 'oven', 'metric'), '175°C');
  assert.equal(t(375, 'F', 'oven', 'metric'), '190°C');
  assert.equal(t(400, 'F', 'oven', 'metric'), '205°C');
  assert.equal(t(450, 'F', 'oven', 'metric'), '230°C');
  assert.equal(t(165, 'F', 'internal', 'metric'), '74°C');
  assert.equal(t(145, 'F', 'internal', 'metric'), '63°C');
  assert.equal(t(160, 'F', 'internal', 'metric'), '71°C');
  assert.equal(t(425, 'F', 'oven', 'us'), '425°F');
  assert.equal(t(200, 'C', 'oven', 'us'), '390°F');
  assert.equal(t(200, 'C', 'oven', 'metric'), '200°C');
  assert.equal(t(74, 'C', 'internal', 'us'), '165°F');
  assert.equal(t(350, 'F', 'oil', 'metric'), '175°C');
});

test('times and timers', () => {
  assert.deepEqual(parseTime('5 min'), { min: 300, max: 300, notimer: false });
  assert.deepEqual(parseTime('20-25 min'), { min: 1200, max: 1500, notimer: false });
  assert.deepEqual(parseTime('1 hr 30 min'), { min: 5400, max: 5400, notimer: false });
  assert.deepEqual(parseTime('30 sec'), { min: 30, max: 30, notimer: false });
  assert.deepEqual(parseTime('8 hr notimer'), { min: 28800, max: 28800, notimer: true });
  assert.ok(parseTime('soon').error);
  assert.ok(parseTime('5 fortnights').error);
  assert.ok(parseTime('25-20 min').error);
  assert.equal(formatTimeRange({ min: 300, max: 300 }), '5 minutes');
  assert.equal(formatTimeRange({ min: 60, max: 60 }), '1 minute');
  assert.equal(formatTimeRange({ min: 1200, max: 1500 }), '20–25 minutes');
  assert.equal(formatTimeRange({ min: 3600, max: 7200 }), '1–2 hours');
  assert.equal(formatTimeRange({ min: 5400, max: 5400 }), '1½ hours');
  assert.equal(formatTimeRange({ min: 4500, max: 4500 }), '1 hour 15 minutes');
  assert.equal(clock(300), '5:00');
  assert.equal(clock(65), '1:05');
  assert.equal(clock(5400), '1:30:00');
  assert.equal(clock(-3), '0:00');
  const timers = stepTimers('Sear {time 8-10 min}, rest {time 5 min}, chill {time 8 hr notimer}.');
  assert.deepEqual(timers.map((t) => t.seconds), [480, 300]);
  assert.equal(timers[0].label, '8–10 minutes');
});

test('lengths', () => {
  assert.equal(formatLen({ dims: [1], unit: 'in' }, 'us'), '1-inch');
  assert.equal(formatLen({ dims: [1], unit: 'in' }, 'metric'), '2.5 cm');
  assert.equal(formatLen({ dims: [0.25], unit: 'in' }, 'metric'), '6 mm');
  assert.equal(formatLen({ dims: [9, 13], unit: 'in' }, 'us'), '9×13-inch');
  assert.equal(formatLen({ dims: [9, 13], unit: 'in' }, 'metric'), '23×33 cm');
  assert.equal(formatLen({ dims: [8, 8], unit: 'in' }, 'metric'), '20×20 cm');
});

test('renderStep: html escapes text and wraps tokens', () => {
  const html = renderStep('Heat to {temp 425F oven} & roast <b>{time 20 min}</b>.', { system: 'us' });
  assert.equal(html, 'Heat to <span class="t-temp">425°F</span> &amp; roast &lt;b&gt;<span class="t-time">20 minutes</span>&lt;/b&gt;.');
  assert.equal(renderStep('Add {qty 1 cup} broth.', { factor: 2, system: 'us', mode: 'text' }), 'Add 2 cups broth.');
  assert.equal(renderStep('Add {qty 1 cup} broth.', { factor: 2, system: 'metric', mode: 'text' }), 'Add 473 mL broth.');
  assert.equal(renderStep('Keep {qty 1 tbsp fixed} fat.', { factor: 3, mode: 'text' }), 'Keep 1 tbsp fat.');
  assert.equal(renderStep('Shape {count 12} balls.', { factor: 1.5, mode: 'text' }), 'Shape 18 balls.');
  assert.equal(renderStep('Bake at {temp 350F oven}.', { system: 'us', mode: 'text', both: true }), 'Bake at 350°F (175°C).');
});

test('token errors are reported', () => {
  assert.deepEqual(tokenErrors('Plain text is fine.'), []);
  assert.equal(tokenErrors('Bake at {temp hot}.').length, 1);
  assert.equal(tokenErrors('Wait {time}.').length, 1);
  assert.equal(tokenErrors('Use {weird 3}.').length, 1);
  assert.equal(tokenErrors('Add {qty 2 smidgens}.').length, 1);
  assert.equal(tokenErrors('Stray } brace').length, 1);
  assert.equal(tokenize('a {time 5 min} b').length, 3);
});
