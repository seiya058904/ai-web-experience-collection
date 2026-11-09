import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendExperiment, binomialCoefficients, createExperiment, enumeratePaths,
  expectedCounts, experimentSVG, freshSeed, prefixExperiment, probabilities,
  validateExperiment,
} from '../experiences/odds/src/engine.ts';

test('four branches enumerate all 16 routes once, with exactly six central routes', () => {
  const paths = enumeratePaths(4);
  assert.equal(paths.length, 16);
  assert.equal(new Set(paths.map(path => path.directions.join(''))).size, 16);
  assert.equal(new Set(paths.map(path => path.id)).size, 16);
  assert.deepEqual(paths.filter(path => path.k === 2).map(path => path.directions.join('')), ['LLRR', 'LRLR', 'LRRL', 'RLLR', 'RLRL', 'RRLL']);
  assert.deepEqual(Array.from({ length: 5 }, (_, k) => paths.filter(path => path.k === k).length), [1, 4, 6, 4, 1]);
});

test('eight branches give the exact 256-sequence combination weights', () => {
  const coefficients = binomialCoefficients(8);
  assert.deepEqual(coefficients, [1, 8, 28, 56, 70, 56, 28, 8, 1]);
  assert.equal(coefficients.reduce((sum, count) => sum + count, 0), 256);
  assert.deepEqual(probabilities(8, 0.5), coefficients.map(count => count / 256));
  assert.equal(expectedCounts(8, 0.5, 16)[4], 4.375);
});

test('all supported UI conditions conserve sample identity, path length and endpoint counts', () => {
  for (const n of [4, 8, 12]) for (const p of [0.25, 0.5, 0.75]) for (const N of [16, 64, 256]) {
    const round = createExperiment('conditions-2026', n, p, N);
    assert.equal(round.counts.length, n + 1);
    assert.equal(round.counts.reduce((a, b) => a + b, 0), N);
    assert.equal(new Set(round.paths.map(path => path.id)).size, N);
    const actual = Array<number>(n + 1).fill(0);
    for (const path of round.paths) {
      assert.equal(path.directions.length, n);
      assert.equal(path.k, path.directions.filter(direction => direction === 'R').length);
      actual[path.k]++;
    }
    assert.deepEqual(actual, round.counts);
    assert.ok(validateExperiment(round));
  }
});

test('same seed and parameters replay identically, including serialization', () => {
  const first = createExperiment('one particular evening', 8, 0.5, 256);
  assert.deepEqual(first, createExperiment('one particular evening', 8, 0.5, 256));
  assert.ok(validateExperiment(JSON.parse(JSON.stringify(first))));
  assert.notDeepEqual(first.paths, createExperiment('another evening', 8, 0.5, 256).paths);
});

test('resizing and appending preserve the exact old prefix without mutating it', () => {
  const first = createExperiment('same journey', 12, 0.75, 16);
  const saved = JSON.stringify(first);
  const grown = prefixExperiment(first, 256);
  assert.deepEqual(grown.paths.slice(0, 16), first.paths);
  assert.deepEqual(prefixExperiment(grown, 16), first);
  const appended = appendExperiment(grown);
  assert.equal(appended.N, 257);
  assert.deepEqual(appended.paths.slice(0, 256), grown.paths);
  assert.equal(appended.counts.reduce((a, b) => a + b, 0), 257);
  assert.equal(JSON.stringify(first), saved);
  assert.deepEqual(appendExperiment(first, 0), first);
});

test('p=0 and p=1 are exact boundary cases, including the theoretical model', () => {
  for (const p of [0, 1]) {
    const round = createExperiment('boundary', 8, p, 64);
    assert.equal(round.counts[p * 8], 64);
    assert.ok(round.paths.every(path => path.directions.every(direction => direction === (p ? 'R' : 'L'))));
    assert.deepEqual(probabilities(8, p), Array.from({ length: 9 }, (_, k) => k === p * 8 ? 1 : 0));
    assert.ok(probabilities(8, p).every(Number.isFinite));
  }
});

test('theoretical probabilities and expected counts preserve their units and totals', () => {
  for (const n of [1, 4, 8, 12, 32]) for (const p of [0, 0.001, 0.25, 0.5, 0.75, 0.999, 1]) {
    const probs = probabilities(n, p);
    assert.ok(Math.abs(probs.reduce((a, b) => a + b, 0) - 1) < 1e-12);
    const mean = probs.reduce((sum, probability, k) => sum + k * probability, 0);
    assert.ok(Math.abs(mean - n * p) < 1e-10);
    assert.ok(Math.abs(expectedCounts(n, p, 256).reduce((a, b) => a + b, 0) - 256) < 1e-9);
  }
});

test('an empty round is valid and can receive its first sample', () => {
  const empty = createExperiment('empty', 8, 0.5, 0);
  assert.ok(validateExperiment(empty));
  assert.deepEqual(empty.counts, Array(9).fill(0));
  assert.equal(appendExperiment(empty).N, 1);
  assert.ok(!experimentSVG(empty).includes('NaN'));
});

test('bounds reject malformed or unreasonably large requests', () => {
  for (const n of [0, -1, 4.5, 33, NaN, Infinity]) assert.throws(() => createExperiment('seed', n, 0.5, 16));
  for (const p of [-0.1, 1.1, NaN, Infinity]) assert.throws(() => createExperiment('seed', 8, p, 16));
  for (const N of [-1, 1.5, 10001, NaN, Infinity]) assert.throws(() => createExperiment('seed', 8, 0.5, N));
  assert.throws(() => createExperiment('', 8, 0.5, 16));
  assert.throws(() => createExperiment('x'.repeat(257), 8, 0.5, 16));
  assert.throws(() => createExperiment('bad\nseed', 8, 0.5, 16));
  assert.throws(() => enumeratePaths(17));
  assert.throws(() => appendExperiment(createExperiment('s', 8, 0.5, 16), -1));
});

test('saved data rejects corrupt counts, duplicate IDs, invalid paths and seed tampering', () => {
  const round = createExperiment('validated', 8, 0.5, 64);
  const corrupt = (change: (value: any) => void) => {
    const value = structuredClone(round);
    change(value);
    assert.equal(validateExperiment(value), false);
  };
  corrupt(value => value.counts[0]++);
  corrupt(value => value.counts.pop());
  corrupt(value => value.paths[1].id = value.paths[0].id);
  corrupt(value => value.paths[0].k++);
  corrupt(value => value.paths[0].directions[0] = 'Q');
  corrupt(value => value.paths[0].directions.pop());
  corrupt(value => delete value.paths[0]);
  corrupt(value => delete value.paths[0].directions[0]);
  corrupt(value => delete value.counts[0]);
  corrupt(value => value.paths.splice(2, 1));
  corrupt(value => value.seed = 'edited');
  corrupt(value => value.p = 0.25);
  corrupt(value => value.N = -1);
  for (const invalid of [null, undefined, [], {}, 'round', 7]) assert.equal(validateExperiment(invalid), false);
});

test('editing both path and counts still fails replay validation', () => {
  const round = createExperiment('attack', 8, 0.5, 16);
  const path = round.paths[0];
  round.counts[path.k]--;
  const direction = path.directions[0];
  path.directions[0] = direction === 'R' ? 'L' : 'R';
  path.k += direction === 'R' ? -1 : 1;
  round.counts[path.k]++;
  assert.equal(validateExperiment(round), false);
  assert.throws(() => experimentSVG(round));
  assert.throws(() => appendExperiment(round));
});

test('SVG contains the current rules, counts, exact data and an honest shared count axis', () => {
  const first = createExperiment('export-current', 12, 0.75, 256);
  const current = appendExperiment(first);
  const svg = experimentSVG(current);
  assert.match(svg, /12 layers · 0.75 chance of a right turn · 257 balls/);
  assert.match(svg, /Number of balls/);
  assert.match(svg, /replayable pseudorandom/);
  assert.match(svg, /not measured collisions/);
  assert.equal((svg.match(/data-slot=/g) || []).length, 13);
  current.counts.forEach((count, k) => assert.ok(svg.includes(`data-slot="${k}" data-observed="${count}" data-expected="${expectedCounts(12, 0.75, 257)[k]}"`)));
  assert.ok(svg.includes('N=257'));
  assert.ok(!svg.includes('NaN'));
  assert.ok(!svg.includes('Infinity'));
});

test('SVG safely escapes seed text and metadata', () => {
  const round = createExperiment('</text><script>alert("x")</script>&', 4, 0.5, 16);
  const svg = experimentSVG(round);
  assert.ok(!svg.includes('<script>'));
  assert.ok(svg.includes('&lt;script&gt;'));
  assert.ok(svg.includes('&amp;'));
});

test('fresh seeds are printable and valid for the model', () => {
  const first = freshSeed();
  const second = freshSeed();
  assert.notEqual(first, second);
  assert.ok(validateExperiment(createExperiment(first, 8, 0.5, 16)));
});
