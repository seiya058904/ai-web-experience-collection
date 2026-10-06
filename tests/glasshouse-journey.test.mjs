import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, sampleJourney, chapterProgress, scrollLength } from '../experiences/glasshouse/src/journey.js';

const pose = (sample) => sample.from + (sample.to - sample.from) * sample.blend;
const near = (actual, expected, tolerance = 1e-10) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should be within ${tolerance} of ${expected}`);
};

test('the journey begins and finishes in complete, readable endpoint compositions', () => {
  const start = sampleJourney(0);
  const finish = sampleJourney(1);
  assert.equal(CHAPTERS.length, 6);
  assert.equal(CHAPTERS[start.chapter].id, 'light');
  assert.equal(CHAPTERS[finish.chapter].id, 'glasshouse');
  near(pose(start), 0);
  near(pose(finish), CHAPTERS.length - 1);
  assert.equal(start.captionOpacity, 1);
  assert.equal(finish.captionOpacity, 1);
  assert.equal(start.captionOffset, 0);
  assert.equal(finish.captionOffset, 0);
});

test('every handoff is continuous at its entrance, chapter boundary and exit', () => {
  const epsilon = 1e-8;
  for (let chapter = 0; chapter < CHAPTERS.length - 1; chapter += 1) {
    for (const progress of [
      (chapter + 0.68) / CHAPTERS.length,
      (chapter + 1) / CHAPTERS.length,
      (chapter + 1.24) / CHAPTERS.length,
    ]) {
      const before = sampleJourney(progress - epsilon);
      const after = sampleJourney(progress + epsilon);
      near(pose(before), pose(after), 1e-6);
      near(before.darkness, after.darkness, 1e-6);
    }
  }
});

test('stable holds keep an established pose while captions remain fully visible', () => {
  for (let chapter = 0; chapter < CHAPTERS.length; chapter += 1) {
    for (const local of [0.26, 0.45, 0.66]) {
      const state = sampleJourney((chapter + local) / CHAPTERS.length);
      assert.equal(state.chapter, chapter);
      near(pose(state), chapter);
      assert.equal(state.captionOpacity, 1);
      assert.equal(state.captionOffset, 0);
    }
  }
});

test('forward, fast-seeking and reverse traversal produce the same pose at the same coordinate', () => {
  const positions = Array.from({ length: 2401 }, (_, index) => index / 2400);
  const forward = positions.map((progress) => sampleJourney(progress));
  let previousPose = -Infinity;
  for (const state of forward) {
    assert.ok(pose(state) >= previousPose - 1e-10, 'the camera coordinate must never move backward during forward scrolling');
    previousPose = pose(state);
  }
  for (let index = positions.length - 1; index >= 0; index -= 1) {
    assert.deepEqual(sampleJourney(positions[index]), forward[index]);
  }
  for (const index of [2400, 1, 1900, 700, 2399, 0, 1200]) {
    assert.deepEqual(sampleJourney(positions[index]), forward[index]);
  }
});

test('restored or invalid progress cannot escape the valid finite scene domain', () => {
  const inputs = [NaN, Infinity, -Infinity, undefined, null, 'invalid', -100, 100];
  for (const progress of inputs) {
    const state = sampleJourney(progress);
    for (const [key, value] of Object.entries(state)) {
      assert.ok(Number.isFinite(value), `${key} must remain finite for ${String(progress)}`);
    }
    assert.ok(state.progress >= 0 && state.progress <= 1);
    assert.ok(state.chapter >= 0 && state.chapter < CHAPTERS.length);
    assert.ok(state.from >= 0 && state.to < CHAPTERS.length);
    assert.ok(state.blend >= 0 && state.blend <= 1);
    assert.ok(state.captionOpacity >= 0 && state.captionOpacity <= 1);
  }
  assert.deepEqual(sampleJourney(-100), sampleJourney(0));
  assert.deepEqual(sampleJourney(100), sampleJourney(1));
});

test('chapter navigation lands in the requested readable composition, including both ends', () => {
  for (let chapter = 0; chapter < CHAPTERS.length; chapter += 1) {
    const progress = chapterProgress(chapter);
    const state = sampleJourney(progress);
    assert.equal(state.chapter, chapter);
    near(pose(state), chapter);
    assert.equal(state.captionOpacity, 1);
  }
  assert.equal(chapterProgress(-3), chapterProgress(0));
  assert.equal(chapterProgress(99), chapterProgress(CHAPTERS.length - 1));
});

test('reduced motion keeps every chapter accessible without spatial interpolation or caption travel', () => {
  for (let chapter = 0; chapter < CHAPTERS.length; chapter += 1) {
    for (const local of [0.05, 0.5, 0.95]) {
      const state = sampleJourney((chapter + local) / CHAPTERS.length, true);
      assert.equal(state.chapter, chapter);
      assert.equal(state.from, chapter);
      assert.equal(state.to, chapter);
      assert.equal(state.blend, 0);
      assert.equal(state.captionOpacity, 1);
      assert.equal(state.captionOffset, 0);
    }
  }
  assert.equal(sampleJourney(1, true).chapter, CHAPTERS.length - 1);
});

test('mobile and reduced-motion journeys shorten travel while preserving a usable scroll extent', () => {
  for (const height of [320, 667, 844, 1080, 1440, 2160]) {
    const desktop = scrollLength(height);
    const mobile = scrollLength(height, { mobile: true });
    const reduced = scrollLength(height, { reduced: true });
    assert.ok(Number.isInteger(desktop) && Number.isInteger(mobile) && Number.isInteger(reduced));
    assert.ok(desktop > mobile && mobile > reduced && reduced > 0);
    assert.equal(scrollLength(height, { reduced: true, mobile: true }), reduced);
  }
  assert.equal(scrollLength(0), scrollLength(320));
});
