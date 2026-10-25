import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, chooseLight, restoreAuthored, authoredLight, advance, updateProgress, replayEncounter, scrubEncounter, fishPosition, panelOpacity, transitionState } from '../experiences/pelagic/src/state.ts';

test('manual light survives all chapter jumps and reversals', () => {
  const state = createState(); chooseLight(state, 0.63);
  for (const p of [1, 2, 3, 4, 0, 3.79, 1.2, 2.8]) {
    updateProgress(state, p); advance(state, 1 / 60);
    assert.equal(state.manualLight, 0.63); assert.equal(state.light, 0.63);
  }
});
test('authored illumination is identical at the same progress in either direction', () => {
  const s = createState();
  updateProgress(s, .79); advance(s, 1 / 60); const first = s.light;
  updateProgress(s, 3.8); advance(s, 1 / 60);
  updateProgress(s, .79); advance(s, 1 / 60);
  assert.equal(s.light, first);
});
test('restoring authored view keeps narrative and encounter, then eases locally', () => {
  const s = createState(); updateProgress(s, 1.2); chooseLight(s, 1);
  scrubEncounter(s, 0.44); restoreAuthored(s); advance(s, 1 / 60);
  assert.equal(s.progress, 1.2); assert.equal(s.encounter.position, 0.44);
  assert.ok(s.light < 1 && s.light > authoredLight(1.2));
});
test('scroll cannot restart or duplicate an encounter after an explicit scrub', () => {
  const s = createState(); scrubEncounter(s, 0.53);
  for (const p of [2, 4, 0, 2, 1, 2]) updateProgress(s, p);
  assert.equal(s.encounter.position, 0.53); assert.equal(s.encounter.playing, false);
});
test('a background return never catches up minutes of local behavior', () => {
  const s = createState(); updateProgress(s, 2); advance(s, 600);
  assert.ok(s.encounter.position <= 0.05 / 9 + 1e-9);
  s.hidden = true; const t = s.time; const p = s.encounter.position;
  advance(s, 20); assert.equal(s.time, t); assert.equal(s.encounter.position, p);
});
test('global motion pause freezes drift and playback while controls remain live', () => {
  const s = createState(); updateProgress(s, 2); s.motionPaused = true;
  advance(s, 1); assert.equal(s.time, 0); assert.equal(s.encounter.position, 0);
  chooseLight(s, 0.11); advance(s, 1); assert.equal(s.light, 0.11);
  scrubEncounter(s, 0.7); assert.equal(s.encounter.position, 0.7);
});
test('reduced motion has no autoplay and still permits deterministic scrubbing', () => {
  const s = createState(true); updateProgress(s, 2); replayEncounter(s);
  assert.equal(s.encounter.playing, false); scrubEncounter(s, 0.8);
  assert.equal(s.encounter.position, 0.8);
});
test('outgoing and incoming required copy do not overlap on any transition sample', () => {
  for (let p = 0; p <= 4; p += 0.002) {
    assert.ok([0, 1, 2, 3, 4].filter(i => panelOpacity(i, p) > 0.01).length <= 1);
  }
});
test('scene parameters are reversible and fish path is continuous and curved', () => {
  const values = [0, .685, .79, .895, 1, 1.79, 2.79, 3.79, 4];
  const forward = values.map(transitionState);
  const reverse = [...values].reverse().map(transitionState).reverse();
  assert.deepEqual(forward, reverse);
  assert.ok(Math.hypot(fishPosition(.64).x - fishPosition(.64001).x, fishPosition(.64).y - fishPosition(.64001).y) < .001);
  assert.notEqual(fishPosition(.3).angle, fishPosition(.9).angle);
});
