import test from 'node:test';
import assert from 'node:assert/strict';
import { SCENES, presentationAt, progressFromScroll, scrollFromProgress } from '../experiences/parallax/src/timeline.js';

test('every chapter is reachable by native scroll and has a single readable resting caption', () => {
  assert.equal(SCENES.length, 10);
  assert.equal(new Set(SCENES.map((scene) => scene.id)).size, 10);
  for (let chapter = 0; chapter < SCENES.length; chapter++) {
    const progress = progressFromScroll(scrollFromProgress(chapter, 713), 713);
    assert.equal(progress, chapter);
    const state = presentationAt(progress);
    assert.equal(state.active, chapter);
    assert.equal(state.captionWeights[chapter], 1);
    assert.equal(state.captionWeights.filter((weight) => weight > 0).length, 1);
  }
});

test('weighted travel round-trips fractional poses in both directions and through a resized span', () => {
  const poses = Array.from({ length: 1801 }, (_, index) => index / 200);
  for (const span of [713, 1165, 1440, 3456]) {
    let previous = -1;
    for (const pose of poses) {
      const y = scrollFromProgress(pose, span);
      assert.ok(y > previous);
      assert.ok(Math.abs(progressFromScroll(y, span) - pose) < 1e-9);
      previous = y;
    }
    for (const pose of poses.toReversed()) {
      const restored = progressFromScroll(scrollFromProgress(pose, span), span);
      assert.ok(Math.abs(progressFromScroll(scrollFromProgress(restored, span / 2), span / 2) - pose) < 1e-9);
    }
  }
});

test('middle chapters gain travel while outer journeys retain their original density', () => {
  const distance = (from, to) => scrollFromProgress(to, 1) - scrollFromProgress(from, 1);
  assert.ok(Math.abs(distance(3, 4) - 1.8) < 1e-12);
  assert.ok(Math.abs(distance(4, 5) - 1.9) < 1e-12);
  assert.ok(Math.abs(distance(5, 6) - 1.35) < 1e-12);
  for (const pose of [0, .31, 1.52, 2.99]) assert.equal(scrollFromProgress(pose, 1), pose);
  for (const pose of [6.01, 6.7, 7.8, 9]) assert.ok(Math.abs(distance(6, pose) - (pose - 6)) < 1e-12);
});

test('chapter joins have a positive continuous distance rate with no scroll speed corners', () => {
  const step = 1e-5;
  for (let chapter = 1; chapter < SCENES.length - 1; chapter++) {
    const y = scrollFromProgress(chapter, 1);
    const left = (y - scrollFromProgress(chapter - step, 1)) / step;
    const right = (scrollFromProgress(chapter + step, 1) - y) / step;
    assert.ok(left > .9 && right > .9);
    assert.ok(Math.abs(left - right) < 1e-4, `distance-rate corner at chapter ${chapter}`);
  }
  for (let i = 1; i < 9000; i++) {
    const p = i / 1000;
    assert.ok(scrollFromProgress(p + step, 1) > scrollFromProgress(p - step, 1));
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
  for (const span of [0, -1, NaN, Infinity]) {
    assert.equal(progressFromScroll(100, span), 0);
    assert.equal(scrollFromProgress(4.2, span), 0);
  }
  assert.equal(scrollFromProgress(-100, 713), 0);
  assert.equal(progressFromScroll(scrollFromProgress(1e12, 713), 713), 9);
  for (const value of [NaN, Infinity, undefined]) {
    assert.equal(presentationAt(value).active, 0);
    assert.equal(progressFromScroll(value, 713), 0);
    assert.equal(scrollFromProgress(value, 713), 0);
  }
});
