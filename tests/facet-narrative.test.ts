import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CHAPTERS, captionOpacity, chapterBlend, chapterTarget, sampleNarrative } from '../experiences/facet/src/narrative.ts';

const weightsAt = (position: number) => CHAPTERS.map((_, index) => chapterBlend(position, index));
const snapshot = (position: number) => ({
  state: sampleNarrative(position),
  weights: weightsAt(position),
  captions: CHAPTERS.map((_, index) => captionOpacity(position, index)),
});

test('the narrative always returns a finite, bounded state, including invalid or extreme positions', () => {
  for (const position of [-1e6, -0.1, 0, 1.5, 6.999, 7, 1e6, NaN, Infinity, -Infinity]) {
    const state = sampleNarrative(position);
    assert.ok(Number.isFinite(state.position));
    assert.ok(Number.isInteger(state.index) && state.index >= 0 && state.index < CHAPTERS.length);
    assert.ok(state.local >= 0 && state.local < 1);
    assert.ok(state.progress >= 0 && state.progress <= 1);
  }
  assert.equal(sampleNarrative(0).progress, 0);
  assert.equal(sampleNarrative(CHAPTERS.length).progress, 1);
});

test('every chapter contains enter, established composition, living hold, handoff and exit intervals', () => {
  const phases = [
    [0.04, 'enter'], [0.25, 'composition'], [0.55, 'hold'], [0.84, 'handoff'], [0.98, 'exit'],
  ] as const;
  for (let chapter = 0; chapter < CHAPTERS.length; chapter += 1) {
    for (const [local, phase] of phases) {
      const state = sampleNarrative(chapter + local);
      assert.equal(state.index, chapter);
      assert.equal(state.phase, phase);
    }
    assert.equal(chapterBlend(chapter + 0.4, chapter), 1, 'the established composition is fully present');
    assert.equal(chapterBlend(chapter + 0.7, chapter), 1, 'the scene stays present through the living hold');
  }
});

test('chapter handoffs never create a blank stage or multiply the total scene opacity', () => {
  const end = sampleNarrative(CHAPTERS.length).position;
  for (let sample = 0; sample <= 7000; sample += 1) {
    const position = sample / 7000 * end;
    const weights = weightsAt(position);
    assert.ok(weights.every((weight) => Number.isFinite(weight) && weight >= 0 && weight <= 1));
    assert.ok(Math.abs(weights.reduce((sum, weight) => sum + weight, 0) - 1) < 1e-12, `full scene coverage at ${position}`);
    assert.ok(Math.max(...weights) >= 0.5 - 1e-12, `at least one scene remains visible at ${position}`);
    assert.ok(weights.filter((weight) => weight > 1e-9).length <= 2, 'a handoff only overlaps neighboring scenes');
  }
});

test('blend values and first derivatives stay continuous across chapter and transition boundaries', () => {
  const h = 1e-4;
  for (let chapter = 1; chapter < CHAPTERS.length; chapter += 1) {
    for (const boundary of [chapter - 0.24, chapter, chapter + 0.16]) {
      for (let scene = 0; scene < CHAPTERS.length; scene += 1) {
        const before = chapterBlend(boundary - h, scene);
        const at = chapterBlend(boundary, scene);
        const after = chapterBlend(boundary + h, scene);
        assert.ok(Math.abs(after - before) < 0.001, 'no visible opacity jump');
        const derivativeBefore = (at - before) / h;
        const derivativeAfter = (after - at) / h;
        assert.ok(Math.abs(derivativeAfter - derivativeBefore) < 0.004, 'no velocity discontinuity at the handoff boundary');
      }
    }
  }
});

test('reverse scrolling and arbitrary jumps produce the same state as a direct visit', () => {
  const positions = [0, 0.15, 0.76, 0.99, 1.16, 1.55, 2.45, 3.01, 3.65, 4.78, 5.42, 6.3, 6.999];
  const direct = new Map(positions.map((position) => [position, snapshot(position)]));
  for (const position of [...positions].reverse()) {
    assert.deepEqual(snapshot(position), direct.get(position));
  }
  for (const position of [4.78, 0.15, 6.999, 1.55, 3.65, 0, 5.42, 2.45]) {
    assert.deepEqual(snapshot(position), direct.get(position));
  }
});

test('every index target lands on its selected chapter with readable text and a fully present scene', () => {
  assert.equal(new Set(CHAPTERS.map((chapter) => chapter.id)).size, CHAPTERS.length, 'chapter links have unique targets');
  for (let index = 0; index < CHAPTERS.length; index += 1) {
    const target = chapterTarget(index);
    assert.equal(sampleNarrative(target).index, index);
    assert.equal(chapterBlend(target, index), 1);
    assert.equal(captionOpacity(target, index), 1);
  }
});
