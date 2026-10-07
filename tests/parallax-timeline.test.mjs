import test from 'node:test';
import assert from 'node:assert/strict';
import { SCENES, presentationAt, progressFromScroll } from '../experiences/parallax/src/timeline.js';

test('every chapter is reachable by native scroll and has a single readable resting caption', () => {
  assert.equal(SCENES.length, 10);
  assert.equal(new Set(SCENES.map((scene) => scene.id)).size, 10);
  for (let chapter = 0; chapter < SCENES.length; chapter++) {
    const progress = progressFromScroll(chapter * 713, 713);
    assert.equal(progress, chapter);
    const state = presentationAt(progress);
    assert.equal(state.active, chapter);
    assert.equal(state.captionWeights[chapter], 1);
    assert.equal(state.captionWeights.filter((weight) => weight > 0).length, 1);
  }
});

test('reverse traversal and revisiting a position return the same bounded presentation', () => {
  const positions = Array.from({ length: 181 }, (_, index) => index / 20);
  const forward = positions.map((progress) => presentationAt(progress));
  for (let index = positions.length - 1; index >= 0; index--) {
    const state = presentationAt(positions[index]);
    assert.deepEqual(state, forward[index]);
    for (const value of [state.darkness, state.ivory, state.museum, state.hero, ...state.captionWeights]) {
      assert.ok(Number.isFinite(value) && value >= 0 && value <= 1);
    }
  }
  assert.equal(presentationAt(0).hero, 1);
  assert.equal(presentationAt(9).museum, 1);
});

test('reduced motion uses complete chapter poses and keeps one caption available', () => {
  for (const progress of [0, 0.35, 1.1, 2.65, 4.49, 5.6, 7.8, 8.75, 9]) {
    const reduced = presentationAt(progress, true);
    const resting = presentationAt(Math.round(progress));
    assert.equal(reduced.progress, Math.round(progress));
    assert.equal(reduced.active, resting.active);
    for (const key of ['darkness', 'ivory', 'museum', 'hero']) assert.equal(reduced[key], resting[key]);
    assert.equal(reduced.captionWeights.filter((weight) => weight === 1).length, 1);
    assert.equal(reduced.captionWeights[reduced.active], 1);
  }
});

test('invalid and out-of-range scroll inputs remain at safe chapter boundaries', () => {
  assert.equal(progressFromScroll(-100, 713), 0);
  assert.equal(progressFromScroll(1e12, 713), 9);
  for (const span of [0, -1, NaN, Infinity]) assert.equal(progressFromScroll(100, span), 0);
  for (const value of [NaN, Infinity, undefined]) {
    assert.equal(presentationAt(value).active, 0);
    assert.equal(progressFromScroll(value, 713), 0);
  }
});
