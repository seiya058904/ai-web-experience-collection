import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clamp,
  smoothstep,
  evaluateTransition,
  evaluateStory,
  type StoryInput,
  type MotionMode,
} from '../experiences/nightshift/src/story-state.ts';

function fixture(scrollY = 0): StoryInput {
  return {
    scrollY,
    viewport: { width: 1440, height: 900 },
    chapters: Array.from({ length: 11 }, (_, index) => ({
      id: `ch-${String(index + 1).padStart(2, '0')}`,
      top: index * 1400,
      bottom: index * 1400 + 1000,
    })),
    transitions: Array.from({ length: 10 }, (_, index) => ({
      id: `tr-${String(index + 1).padStart(2, '0')}-${String(index + 2).padStart(2, '0')}`,
      from: index,
      to: index + 1,
      start: index * 1400 + 900,
      end: index * 1400 + 1300,
    })),
    mode: 'full',
  };
}

function near(actual: number, expected: number, epsilon = 1e-12): void {
  assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} is not near ${expected}`);
}

test('all ten boundaries have distinct authored occluder identities', () => {
  const identities = Array.from({ length: 10 }, (_, index) => evaluateTransition(index, .5).occluder);
  assert.deepEqual(identities, ['window', 'door', 'glass', 'threshold', 'curb', 'pipe', 'corner', 'canopy', 'column', 'panes']);
});

test('every boundary has complete exact source and target end states', () => {
  for (let index = 0; index < 10; index++) {
    const source = evaluateTransition(index, 0);
    const target = evaluateTransition(index, 1);
    assert.equal(source.sourceVisible, true);
    assert.equal(source.targetVisible, false);
    assert.equal(source.midpointVisible, false);
    assert.equal(source.sourceTextOpacity, 1);
    assert.equal(source.targetTextOpacity, 0);
    assert.equal(target.sourceVisible, false);
    assert.equal(target.targetVisible, true);
    assert.equal(target.midpointVisible, false);
    assert.equal(target.sourceTextOpacity, 0);
    assert.equal(target.targetTextOpacity, 1);
  }
});

test('opaque spatial coverage never leaves a blank frame or duplicates coverage', () => {
  for (let index = 0; index < 10; index++) {
    for (let step = 0; step <= 1000; step++) {
      const state = evaluateTransition(index, step / 1000);
      near(state.sourceCoverage + state.targetCoverage + state.midpointCoverage, 1);
      assert.ok(state.sourceVisible || state.targetVisible || state.midpointVisible);
      for (const value of [state.sourceCoverage, state.targetCoverage, state.midpointCoverage]) {
        assert.ok(value >= 0 && value <= 1);
      }
    }
  }
});

test('source and target chapter captions never occupy the reading zone together', () => {
  for (let index = 0; index < 10; index++) {
    for (let step = 0; step <= 1000; step++) {
      const state = evaluateTransition(index, step / 1000);
      assert.equal(state.sourceTextOpacity > 0 && state.targetTextOpacity > 0, false);
      if (step >= 250) assert.equal(state.sourceTextOpacity, 0);
      if (step <= 800) assert.equal(state.targetTextOpacity, 0);
    }
  }
});

test('rail-to-water owns an exact opaque midpoint and two coherent reveal phases', () => {
  const before = evaluateTransition(5, .25);
  const middle = evaluateTransition(5, .5);
  const after = evaluateTransition(5, .75);
  assert.equal(before.phase, 'source-to-midpoint');
  assert.equal(before.sourceCoverage, .5);
  assert.equal(before.midpointCoverage, .5);
  assert.equal(before.targetVisible, false);
  assert.equal(middle.sourceVisible, false);
  assert.equal(middle.targetVisible, false);
  assert.equal(middle.midpointVisible, true);
  assert.equal(middle.midpointCoverage, 1);
  assert.equal(after.phase, 'midpoint-to-target');
  assert.equal(after.sourceVisible, false);
  assert.equal(after.midpointCoverage, .5);
  assert.equal(after.targetCoverage, .5);
  for (const progress of [.499999, .5, .500001]) {
    const state = evaluateTransition(5, progress);
    assert.ok(state.midpointCoverage > .99999);
  }
});

test('direct random seeks equal forward and reverse evaluations without prior playback', () => {
  const progressValues = [0, .25, .49, .5, .51, .75, 1];
  for (let index = 0; index < 10; index++) {
    const forward = progressValues.map(progress => evaluateTransition(index, progress));
    const reverse = [...progressValues].reverse().map(progress => evaluateTransition(index, progress)).reverse();
    assert.deepEqual(reverse, forward);
    for (const progress of [.75, .25, .5, 0, 1, .49, .51]) {
      assert.deepEqual(evaluateTransition(index, progress), forward[progressValues.indexOf(progress)]);
    }
  }
});

test('reduced and still modes switch to complete matched scenes without transitional movement', () => {
  for (const mode of ['reduced', 'stills'] as MotionMode[]) {
    for (let index = 0; index < 10; index++) {
      const before = evaluateTransition(index, .4999, mode);
      const after = evaluateTransition(index, .5, mode);
      assert.equal(before.reveal, 0);
      assert.equal(after.reveal, 1);
      assert.equal(before.midpointVisible, false);
      assert.equal(after.midpointVisible, false);
      assert.equal(before.sourceCoverage, 1);
      assert.equal(after.targetCoverage, 1);
      assert.equal(before.sourceTextOpacity, 1);
      assert.equal(after.targetTextOpacity, 1);
      assert.deepEqual([before.anchorX, before.anchorY], [evaluateTransition(index, 0).anchorX, evaluateTransition(index, 0).anchorY]);
      assert.deepEqual([after.anchorX, after.anchorY], [evaluateTransition(index, 1).anchorX, evaluateTransition(index, 1).anchorY]);
    }
  }
});

test('anchor motion stays finite, bounded, and continuous around all stage thresholds', () => {
  for (let index = 0; index < 10; index++) {
    for (let step = 0; step <= 100; step++) {
      const state = evaluateTransition(index, step / 100);
      assert.ok(Number.isFinite(state.anchorX) && state.anchorX >= 0 && state.anchorX <= 1);
      assert.ok(Number.isFinite(state.anchorY) && state.anchorY >= 0 && state.anchorY <= 1);
    }
    for (const threshold of [.25, .5, .75]) {
      const before = evaluateTransition(index, threshold - .000001);
      const after = evaluateTransition(index, threshold + .000001);
      near(before.anchorX, after.anchorX, .00001);
      near(before.anchorY, after.anchorY, .00001);
    }
  }
});

test('chapter authority changes at the midpoint and does not depend on image readiness', () => {
  for (let index = 0; index < 10; index++) {
    const start = index * 1400 + 900;
    const before = evaluateStory(fixture(start + 199));
    const middleInput = fixture(start + 200);
    const middle = evaluateStory(middleInput);
    const lateAssets = evaluateStory({ ...middleInput, assetsReady: new Set(['ch-01']), qualityTier: 'low' });
    const allAssets = evaluateStory({ ...middleInput, assetsReady: new Set(middleInput.chapters.map(chapter => chapter.id)), qualityTier: 'high' });
    assert.equal(before.chapterIndex, index);
    assert.equal(middle.chapterIndex, index + 1);
    assert.equal(middle.chapterId, middleInput.chapters[index + 1].id);
    assert.deepEqual(lateAssets, middle);
    assert.deepEqual(allAssets, middle);
  }
});

test('actual scroll intervals define exact endpoints, midpoints, and overall progress', () => {
  const start = evaluateStory(fixture(900));
  const midpoint = evaluateStory(fixture(1100));
  const end = evaluateStory(fixture(1300));
  assert.equal(start.transition?.progress, 0);
  assert.equal(start.chapterIndex, 0);
  assert.equal(midpoint.transition?.progress, .5);
  assert.equal(midpoint.chapterIndex, 1);
  assert.equal(end.transition?.progress, 1);
  assert.equal(end.chapterIndex, 1);
  assert.equal(evaluateStory(fixture(0)).overallProgress, 0);
  assert.equal(evaluateStory(fixture(14100)).overallProgress, 1);
  assert.equal(evaluateStory(fixture(100000)).overallProgress, 1);
  assert.equal(evaluateStory(fixture(100000)).chapterId, 'ch-11');
});

test('native chapter holds stay addressable in first, middle, and last chapters', () => {
  for (const index of [0, 5, 10]) {
    const state = evaluateStory(fixture(index * 1400 + 50));
    assert.equal(state.chapterIndex, index);
    assert.equal(state.chapterId, `ch-${String(index + 1).padStart(2, '0')}`);
    assert.equal(state.transition, null);
  }
});

test('resizing recalculates reading position without changing a boundary midpoint identity', () => {
  const input = fixture(8100);
  const desktop = evaluateStory(input);
  const phone = evaluateStory({ ...input, viewport: { width: 390, height: 844 } });
  assert.equal(desktop.transition?.progress, .5);
  assert.equal(phone.transition?.progress, .5);
  assert.equal(phone.chapterId, desktop.chapterId);
  assert.deepEqual(phone.transition, desktop.transition);
});

test('invalid numbers and out-of-range seeks do not produce NaN state', () => {
  assert.equal(clamp(NaN), 0);
  assert.equal(clamp(Infinity), 1);
  assert.equal(clamp(-Infinity), 0);
  assert.equal(smoothstep(.5, .5, .49), 0);
  assert.equal(smoothstep(.5, .5, .5), 1);
  for (const progress of [NaN, -100, 100, Infinity, -Infinity]) {
    const state = evaluateTransition(NaN, progress);
    for (const value of Object.values(state)) {
      if (typeof value === 'number') assert.ok(Number.isFinite(value));
    }
  }
  const invalidScroll = evaluateStory({ ...fixture(NaN), viewport: { width: NaN, height: NaN } });
  assert.equal(invalidScroll.chapterId, 'ch-01');
  assert.equal(invalidScroll.overallProgress, 0);
  assert.equal(evaluateStory(fixture(-100)).chapterId, 'ch-01');
});

test('empty and invalid metric sets have safe results and never invent a target chapter', () => {
  const input = fixture();
  assert.deepEqual(evaluateStory({ ...input, chapters: [] }), {
    chapterIndex: -1, chapterId: '', transition: null, overallProgress: 0,
  });
  const degenerate = evaluateStory({
    ...fixture(1100),
    transitions: [
      { id: 'collapsed', from: 0, to: 1, start: 1100, end: 1100 },
      { id: 'missing-target', from: 0, to: 99, start: 900, end: 1300 },
      { id: 'invalid', from: 0, to: 1, start: NaN, end: 1300 },
    ],
  });
  assert.equal(degenerate.transition, null);
  assert.ok(degenerate.chapterIndex >= 0 && degenerate.chapterIndex < 11);
});

test('overlapping measured intervals select the later boundary independently of input order', () => {
  const input = fixture(1150);
  input.transitions = [
    { id: 'older', from: 0, to: 1, start: 900, end: 1300 },
    { id: 'newer', from: 1, to: 2, start: 1000, end: 1400 },
  ];
  const forward = evaluateStory(input);
  const reversed = evaluateStory({ ...input, transitions: [...input.transitions].reverse() });
  assert.equal(forward.transition?.id, 'newer');
  assert.deepEqual(reversed, forward);
});

test('evaluation leaves caller metrics, modes, and readiness sets unchanged', () => {
  const input = fixture(8100);
  const serialized = JSON.stringify(input);
  input.chapters.forEach(Object.freeze);
  input.transitions.forEach(Object.freeze);
  Object.freeze(input.chapters);
  Object.freeze(input.transitions);
  Object.freeze(input.viewport);
  Object.freeze(input);
  evaluateStory(input);
  assert.equal(JSON.stringify(input), serialized);
});
