import assert from 'node:assert/strict';
import test from 'node:test';
import { MECHANISM_STILLS, presentation } from '../experiences/chronos/src/presentation.ts';

test('only a running live mechanism offers mechanical speed changes', () => {
  for (const fallback of [false, true]) for (const contextLost of [false, true])
    for (const reduced of [false, true]) for (const paused of [false, true]) for (const slow of [false, true]) {
      const state = { fallback, contextLost, reduced, paused, slow };
      const mode = presentation(state);
      const running = !fallback && !contextLost && !reduced && !paused;
      assert.equal(mode.speedAction, running ? 'speed' : 'read');
      assert.equal(mode.speedDetail.includes('speed'), running);
      assert.equal(mode.imageOnly, fallback || contextLost);
      if (!running) assert.match(mode.status, /Scroll|Scrolling/);
    }
});

test('recovering a slow live mechanism restores its selected speed without clearing pause intent', () => {
  const state = { fallback: false, contextLost: false, reduced: false, paused: false, slow: true };
  assert.match(presentation(state).speedDetail, /¹⁄₃₂ → ⅛/);
  assert.equal(presentation({ ...state, contextLost: true }).speedAction, 'read');
  assert.equal(presentation({ ...state, contextLost: false }).speedAction, 'speed');
  assert.equal(presentation({ ...state, paused: true }).speedAction, 'read');
  assert.equal(presentation({ ...state, paused: true, contextLost: true }).motionLabel, 'Image edition uses static artwork');
  assert.equal(presentation({ ...state, paused: true }).motionLabel, 'Resume ambient motion');
});

test('the three internal chapters use distinct model views with explicit static descriptions', () => {
  const stills = MECHANISM_STILLS.filter(Boolean);
  assert.equal(stills.length, 3);
  assert.deepEqual(stills.map(still => still!.file), ['energy', 'transmission', 'oscillation']);
  for (const still of stills) assert.match(still!.description, /Static/);
});
