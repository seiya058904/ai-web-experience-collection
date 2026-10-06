import test from 'node:test';
import assert from 'node:assert/strict';
import { chapters, chapterOpacity, deriveState } from '../experiences/fusion/src/timeline.ts';

const baseline = { heatInput: 1, feedback: 1, pulse: 0, sectionOpen: false };

test('every chapter has a substantial readable stable composition', () => {
  assert.equal(chapters.length, 8);
  for (let chapter = 0; chapter < 8; chapter++) {
    for (const offset of [.25, .35, .5, .65, .72]) assert.ok(chapterOpacity(chapter + offset, chapter) > .99);
  }
});

test('handoffs retain narration and involve only neighboring chapters', () => {
  for (let p = 0; p <= 8; p += .005) {
    const visible = chapters.map((_, i) => chapterOpacity(p, i));
    assert.ok(Math.max(...visible) > .1, `Narration missing at ${p}`);
    const indices = visible.map((value, i) => value > .001 ? i : -1).filter(i => i >= 0);
    assert.ok(indices.length <= 2);
    if (indices.length === 2) assert.equal(indices[1] - indices[0], 1);
  }
});

test('all scroll states stay finite and normalized, including endpoints', () => {
  for (let p = -.1; p <= 8.1; p += .02) {
    const state = deriveState(p, 13.4, baseline);
    for (const [key, value] of Object.entries(state)) assert.ok(Number.isFinite(value), key);
    for (const key of ['energy','field','heat','assembly','cutaway','instability','control'] as const) {
      assert.ok(state[key] >= 0 && state[key] <= 1, `${key} at ${p}`);
    }
  }
});

test('reverse navigation is history-independent', () => {
  const samples = [.2, 1.4, 2.5, 3.6, 4.7, 5.5, 6.4, 7.8];
  const forward = samples.map(p => deriveState(p, 5, baseline));
  const backward = [...samples].reverse().map(p => deriveState(p, 5, baseline)).reverse();
  assert.deepEqual(forward, backward);
});

test('heating input changes temperature and luminosity together', () => {
  const high = deriveState(3.5, 2, baseline);
  const low = deriveState(3.5, 2, { ...baseline, heatInput: 0 });
  assert.ok(high.temperature > low.temperature + 50);
  assert.ok(high.energy > low.energy);
});

test('feedback suppresses boundary deviation with a shared cause', () => {
  const on = deriveState(5.65, 2, baseline);
  const off = deriveState(5.65, 2, { ...baseline, feedback: 0 });
  assert.ok(on.control > off.control);
  assert.ok(on.deviation < off.deviation / 4);
  assert.ok(on.instability < off.instability);
});

test('manual section opening remains effective through the machine hold', () => {
  for (const p of [1.2, 1.4, 1.73, 1.8, 1.9]) {
    const closed = deriveState(p, 0, baseline);
    const open = deriveState(p, 0, { ...baseline, sectionOpen: true });
    assert.ok(open.cutaway - closed.cutaway > .65, `Opening ineffective at ${p}`);
  }
});

test('state is continuous across chapter boundaries', () => {
  for (let p = 1; p < 8; p++) {
    const left = deriveState(p - 1e-6, 3, baseline);
    const right = deriveState(p + 1e-6, 3, baseline);
    for (const key of ['energy','field','heat','assembly','cutaway','instability','control'] as const) assert.ok(Math.abs(left[key] - right[key]) < .0001);
  }
});
