import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clamp,
  evaluateNarrative,
  smoothstep,
  transitionSnapshot,
} from '../experiences/odds/src/narrative.ts';

const anchors = Array.from({ length: 10 }, (_, index) => index * 1000);
const stable = (chapter: number) => ({ chapter, next: chapter, progress: 0, transition: null });

test('chapter anchors, out-of-range positions, and non-finite scroll values choose valid stable frames', () => {
  anchors.forEach((anchor, index) => assert.deepEqual(evaluateNarrative(anchor, anchors, false), stable(index)));
  assert.deepEqual(evaluateNarrative(-100, anchors, false), stable(0));
  assert.deepEqual(evaluateNarrative(50_000, anchors, false), stable(9));
  for (const value of [NaN, Infinity, -Infinity]) assert.deepEqual(evaluateNarrative(value, anchors, false), stable(0));
});

test('every measured span has a stable 58% followed by a local reversible 42% transition', () => {
  for (let index = 0; index < 9; index++) {
    assert.deepEqual(evaluateNarrative(anchors[index] + 580, anchors, false), stable(index));
    const midway = evaluateNarrative(anchors[index] + 790, anchors, false);
    assert.equal(midway.chapter, index);
    assert.equal(midway.next, index + 1);
    assert.equal(midway.transition, index);
    assert.ok(Math.abs(midway.progress - 0.5) < 1e-12);
    const nearEnd = evaluateNarrative(anchors[index] + 999, anchors, false);
    assert.ok(nearEnd.progress > 0.99 && nearEnd.progress < 1);
  }
});

test('unequal DOM-measured chapter spans determine progress without requiring sequential entry', () => {
  const uneven = [80, 1480, 2300, 3900, 4700, 6500, 7600, 9200, 10_300, 11_500];
  const first = [...uneven];
  for (let index = 8; index >= 0; index--) {
    const y = uneven[index] + (uneven[index + 1] - uneven[index]) * 0.79;
    const result = evaluateNarrative(y, uneven, false);
    assert.equal(result.transition, index);
    assert.ok(Math.abs(result.progress - 0.5) < 1e-12);
  }
  assert.deepEqual(uneven, first);
});

test('reverse scrolling and direct jumps evaluate identical frames without historical state', () => {
  const positions = [0, 580, 790, 2300, 6790, 8590, 8999, 9000];
  const forward = positions.map(y => evaluateNarrative(y, anchors, false));
  const reverse = positions.toReversed().map(y => evaluateNarrative(y, anchors, false)).toReversed();
  assert.deepEqual(reverse, forward);
  assert.deepEqual(evaluateNarrative(6790, anchors, false), forward[4]);
});

test('reduced motion selects complete neighboring frames and never a partial transition', () => {
  for (let index = 0; index < 9; index++) {
    assert.deepEqual(evaluateNarrative(index * 1000 + 700, anchors, true), stable(index));
    assert.deepEqual(evaluateNarrative(index * 1000 + 791, anchors, true), stable(index + 1));
    assert.deepEqual(evaluateNarrative((index + 1) * 1000, anchors, true), stable(index + 1));
  }
});

test('invalid layout anchors are rejected instead of silently changing chapter order', () => {
  const invalid = [[], anchors.slice(0, 9), [...anchors, 10_000], [...anchors.slice(0, 9), 8000], [...anchors.slice(0, 9), NaN], anchors.toReversed()];
  for (const candidate of invalid) assert.throws(() => evaluateNarrative(100, candidate, false), RangeError);
});

test('the four-to-eight-level expansion completes at 75% and partial levels stay unlabelled', () => {
  const checkpoints = [0, 0.25, 0.5, 0.75, 1].map(t => transitionSnapshot(2, t));
  assert.deepEqual(checkpoints.map(point => point.layers), [4, null, null, 8, 8]);
  assert.deepEqual(checkpoints.map(point => point.unit), ['structure', 'structure', 'structure', 'structure', 'paths']);
  assert.ok(checkpoints.every(point => point.revealedSamples === null));
  assert.deepEqual([0, 0.1875, 0.375, 0.5625, 0.75].map(t => transitionSnapshot(2, t).layers), [4, 5, 6, 7, 8]);
  assert.equal(transitionSnapshot(2, 0.749).layers, null);
  assert.equal(transitionSnapshot(2, 0.4).layers, null);
  assert.equal(transitionSnapshot(2, 0.875).unit, 'paths');
  assert.equal(transitionSnapshot(2, 0.875).layers, 8);
  assert.match(transitionSnapshot(2, 0.875).note, /changing representation/);
  assert.match(transitionSnapshot(2, 1).note, /not observed ball counts/);
});

test('theory-to-observation transition explicitly converts paths to probability to expected balls', () => {
  assert.equal(transitionSnapshot(3, 0).unit, 'paths');
  assert.equal(transitionSnapshot(3, 0.24999).unit, 'paths');
  assert.equal(transitionSnapshot(3, 0.25).unit, 'probability');
  assert.equal(transitionSnapshot(3, 0.49999).unit, 'probability');
  assert.equal(transitionSnapshot(3, 0.5).unit, 'balls');
  assert.match(transitionSnapshot(3, 0.5).note, /4\.375/);
  assert.match(transitionSnapshot(3, 1).note, /separate rounds/);
});

test('middle-round portrait extends only the fixed chosen prefix after the midpoint', () => {
  for (const N of [16, 64, 128] as const) {
    assert.equal(transitionSnapshot(6, 0, N).revealedSamples, N);
    assert.equal(transitionSnapshot(6, 0.5, N).revealedSamples, N);
    assert.equal(transitionSnapshot(6, 0.75, N).revealedSamples, N + (256 - N) / 2);
    assert.equal(transitionSnapshot(6, 1, N).revealedSamples, 256);
    const samples = Array.from({ length: 101 }, (_, i) => transitionSnapshot(6, i / 100, N).revealedSamples!);
    assert.ok(samples.every((count, index) => Number.isInteger(count) && count >= N && count <= 256 && (!index || count >= samples[index - 1])));
    assert.deepEqual(samples.toReversed(), Array.from({ length: 101 }, (_, i) => transitionSnapshot(6, (100 - i) / 100, N).revealedSamples));
  }
});

test('all forty-five report checkpoints have stable identities and honest semantic metadata', () => {
  const snapshots = Array.from({ length: 9 }, (_, index) => [0, 0.25, 0.5, 0.75, 1].map(t => transitionSnapshot(index, t))).flat();
  assert.equal(snapshots.length, 45);
  assert.equal(new Set(snapshots.map(point => point.id)).size, 9);
  assert.ok(snapshots.every(point => point.note.length > 40 && !/[\u3400-\u9fff]/u.test(point.note)));
  assert.equal(snapshots[0].id, 'TR-01-02');
  assert.equal(snapshots.at(-1)?.id, 'TR-09-10');
  assert.equal(transitionSnapshot(8, 1).layers, null);
  assert.match(transitionSnapshot(8, 1).note, /n\+1 slots/);
});

test('transition input validation and utility bounds keep rendering values finite', () => {
  for (const index of [-1, 9, 0.5, NaN]) assert.throws(() => transitionSnapshot(index, 0.5), RangeError);
  assert.throws(() => transitionSnapshot(0, 0.5, 256 as 128), RangeError);
  assert.deepEqual(transitionSnapshot(0, NaN), transitionSnapshot(0, 0));
  assert.deepEqual(transitionSnapshot(6, -10), transitionSnapshot(6, 0));
  assert.deepEqual(transitionSnapshot(6, 10), transitionSnapshot(6, 1));
  assert.equal(clamp(-1), 0);
  assert.equal(clamp(2), 1);
  assert.equal(clamp(NaN), 0);
  assert.equal(clamp(Infinity), 1);
  assert.equal(clamp(-Infinity), 0);
  assert.equal(clamp(3, 2, 4), 3);
  assert.equal(smoothstep(0), 0);
  assert.equal(smoothstep(1), 1);
  assert.equal(smoothstep(0.5), 0.5);
  assert.throws(() => clamp(0, 2, 1), RangeError);
});
