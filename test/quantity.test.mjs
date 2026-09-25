import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseNumber, parseAmount, formatFraction, formatDecimal, roundToFractions } from '../src/lib/quantity.js';

test('parseNumber: whole, decimal, fraction, mixed, unicode', () => {
  assert.equal(parseNumber('2'), 2);
  assert.equal(parseNumber('1.5'), 1.5);
  assert.equal(parseNumber('.5'), 0.5);
  assert.equal(parseNumber('1/2'), 0.5);
  assert.equal(parseNumber('1 1/2'), 1.5);
  assert.equal(parseNumber('2 3/4'), 2.75);
  assert.equal(parseNumber('½'), 0.5);
  assert.equal(parseNumber('1½'), 1.5);
  assert.equal(parseNumber('1 ½'), 1.5);
  assert.ok(Math.abs(parseNumber('⅓') - 1 / 3) < 1e-12);
  assert.equal(parseNumber(3), 3);
});

test('parseNumber: rejects junk', () => {
  for (const bad of ['', ' ', 'abc', '1/0', '-1', '1 3/2', '1..5', '2x', null, undefined, NaN, Infinity, {}, '1,5']) {
    assert.ok(Number.isNaN(parseNumber(bad)), `expected NaN for ${String(bad)}`);
  }
});

test('parseAmount: single values and ranges', () => {
  assert.deepEqual(parseAmount('2'), { min: 2, max: 2 });
  assert.deepEqual(parseAmount(1.25), { min: 1.25, max: 1.25 });
  assert.deepEqual(parseAmount('2-3'), { min: 2, max: 3 });
  assert.deepEqual(parseAmount('2 – 3'), { min: 2, max: 3 });
  assert.deepEqual(parseAmount('1 1/2 to 2'), { min: 1.5, max: 2 });
  assert.deepEqual(parseAmount(['1/4', '1/2']), { min: 0.25, max: 0.5 });
});

test('parseAmount: rejects zero, negative, reversed and malformed', () => {
  for (const bad of ['0', 0, '-2', '3-2', '1-2-3', 'a-b', [], ['1'], '1-1/2x', null, true]) {
    assert.equal(parseAmount(bad), null, `expected null for ${JSON.stringify(bad)}`);
  }
});

test('formatFraction uses cooking glyphs', () => {
  assert.equal(formatFraction(0.5), '½');
  assert.equal(formatFraction(1.5), '1½');
  assert.equal(formatFraction(0.25), '¼');
  assert.equal(formatFraction(2.75), '2¾');
  assert.equal(formatFraction(1 / 3), '⅓');
  assert.equal(formatFraction(2 / 3), '⅔');
  assert.equal(formatFraction(0.125), '⅛');
  assert.equal(formatFraction(3), '3');
});

test('roundToFractions snaps to allowed parts and carries', () => {
  const f = [0, 1 / 4, 1 / 2, 3 / 4];
  assert.equal(roundToFractions(1.2, f), 1.25);
  assert.equal(roundToFractions(1.9, f), 2);
  assert.equal(roundToFractions(0.1, f), 0);
});

test('formatDecimal trims zeros', () => {
  assert.equal(formatDecimal(1.0, 0.01), '1');
  assert.equal(formatDecimal(1.456, 0.01), '1.46');
  assert.equal(formatDecimal(2.5, 0.5), '2.5');
  assert.equal(formatDecimal(236.588, 1), '237');
});
