import assert from 'node:assert/strict';
import test from 'node:test';
import { CHAPTERS, cameraProgress, chapterAt, copyState, plateState } from '../experiences/chronos/src/narrative.ts';

function snapshot(progress: number, reduced: boolean) {
  return {
    camera: cameraProgress(progress),
    chapter: chapterAt(progress),
    copy: CHAPTERS.map((_, index) => copyState(progress, index, reduced)),
    plates: plateState(progress, reduced),
  };
}

test('no scroll position displays two chapter copies with significant opacity', () => {
  for (const reduced of [false, true]) {
    for (let sample = 0; sample <= 10000; sample++) {
      const progress = sample / 10000;
      const visible = CHAPTERS.map((_, index) => copyState(progress, index, reduced).opacity)
        .filter(opacity => opacity > .01);
      assert.ok(visible.length <= 1, `overlapping copy at progress ${progress}, reduced=${reduced}`);
      if (reduced) assert.equal(visible.length, 1, 'reduced mode always shows its selected chapter');
    }
  }
});

test('every chapter has a sustained fully readable window while its camera composition is settled', () => {
  const step = .0001;
  for (const [index, chapter] of CHAPTERS.entries()) {
    let current = 0, longest = 0;
    for (let sample = 0; sample <= 10000; sample++) {
      const progress = sample / 10000;
      const copy = copyState(progress, index);
      const settled = Math.abs(cameraProgress(progress) - chapter.at) < 1e-10;
      const readable = copy.opacity >= .999999 && copy.reveal === 1 && Math.abs(copy.x) < .001;
      current = settled && readable ? current + step : 0;
      longest = Math.max(longest, current);
    }
    // These lower bounds preserve useful holds without tying the test to exact easing constants.
    const minimum = index === 0 ? .05 : index === CHAPTERS.length - 1 ? .028 : .078;
    assert.ok(longest >= minimum, `${chapter.name} only holds fully readable for ${longest} progress`);
    const anchor = copyState(chapter.at, index);
    assert.equal(anchor.opacity, 1, `${chapter.name} is fully visible at its chapter anchor`);
    assert.equal(anchor.reveal, 1);
    assert.equal(anchor.x, 0);
  }
});

test('the scroll camera moves continuously and monotonically through all stage and hold boundaries', () => {
  assert.equal(cameraProgress(0), 0);
  assert.equal(cameraProgress(1), 1);
  let previous = 0;
  for (let sample = 0; sample <= 10000; sample++) {
    const camera = cameraProgress(sample / 10000);
    assert.ok(Number.isFinite(camera) && camera >= 0 && camera <= 1);
    assert.ok(camera >= previous - 1e-12, 'forward scroll cannot reverse the camera path');
    assert.ok(camera - previous < .001, 'small scroll increments cannot jump the camera');
    previous = camera;
  }
  for (let stage = 0; stage < 5; stage++) {
    for (const local of [0, .28, .85, 1]) {
      const boundary = (stage + local) / 5;
      const exact = cameraProgress(boundary);
      assert.ok(Math.abs(cameraProgress(boundary - 1e-7) - exact) < 1e-8,
        `camera must approach ${boundary} continuously from below`);
      assert.ok(Math.abs(cameraProgress(boundary + 1e-7) - exact) < 1e-8,
        `camera must leave ${boundary} continuously from above`);
    }
  }
  for (const chapter of CHAPTERS) assert.equal(cameraProgress(chapter.at), chapter.at);
});

test('the entire narrative state is exactly reversible and independent of visit order', () => {
  const positions = Array.from({ length: 251 }, (_, index) => index / 250);
  for (const reduced of [false, true]) {
    const forward = positions.map(progress => snapshot(progress, reduced));
    const backward = positions.toReversed().map(progress => snapshot(progress, reduced)).toReversed();
    assert.deepEqual(backward, forward);
    for (const index of [250, 0, 149, 51, 200, 25, 125, 249, 1, 0]) {
      assert.deepEqual(snapshot(positions[index], reduced), forward[index]);
    }
  }
});

test('narrative values remain finite and bounded, clamp overscroll, and reach the intended endpoints', () => {
  for (const reduced of [false, true]) {
    for (let sample = -100; sample <= 1100; sample++) {
      const state = snapshot(sample / 1000, reduced);
      assert.ok(Number.isInteger(state.chapter) && state.chapter >= 0 && state.chapter < CHAPTERS.length);
      for (const copy of state.copy) {
        assert.ok(Object.values(copy).every(Number.isFinite));
        assert.ok(copy.opacity >= 0 && copy.opacity <= 1);
        assert.ok(copy.reveal >= 0 && copy.reveal <= 1);
        assert.ok(copy.x >= -24 && copy.x <= 22);
      }
      const { watch, craft, scale, zoom } = state.plates;
      assert.ok(Object.values(state.plates).every(Number.isFinite));
      assert.ok(watch >= 0 && watch <= 1 && craft >= 0 && craft <= 1);
      assert.ok(scale >= .59 - 1e-12 && scale <= 2.36 + 1e-12);
      assert.ok(zoom >= 1 && zoom <= 1.24);
    }
    for (const progress of [-100, -1, -Infinity]) assert.deepEqual(snapshot(progress, reduced), snapshot(0, reduced));
    for (const progress of [2, 100, Infinity]) assert.deepEqual(snapshot(progress, reduced), snapshot(1, reduced));
    const opening = snapshot(0, reduced), ending = snapshot(1, reduced);
    assert.equal(opening.chapter, 0);
    assert.equal(opening.copy[0].opacity, 1);
    assert.equal(opening.plates.watch, 1);
    assert.equal(opening.plates.craft, 0);
    assert.equal(opening.plates.scale, 1);
    assert.equal(ending.chapter, 5);
    assert.equal(ending.copy[5].opacity, 1);
    assert.equal(ending.plates.watch, 1);
    assert.equal(ending.plates.craft, 0);
    assert.equal(ending.plates.scale, .59);
    assert.equal(plateState(.8, reduced).craft, 1);
  }
});
