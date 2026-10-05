import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, samplePose, getChapterIndex } from '../experiences/kage/src/score.ts';

const flatten = (value: unknown): number[] => {
  if (typeof value === 'number') return [value];
  if (Array.isArray(value)) return value.flatMap(flatten);
  return Object.values(value as Record<string, unknown>).flatMap(flatten);
};

test('every desktop and mobile scroll position has finite, positive geometry', () => {
  for (const mobile of [false, true]) {
    for (let i = 0; i <= 2500; i++) {
      const pose = samplePose(i / 2500, mobile);
      assert.ok(flatten(pose).every(Number.isFinite));
      for (const f of pose.frames) {
        assert.ok(f.width > 0 && f.height > 0 && f.depth > 0 && f.scale > 0);
        assert.ok(f.bar > 0 && f.bar < f.width / 2);
      }
    }
  }
});

test('returning backwards yields exactly the same geometric state', () => {
  const forward = Array.from({ length: 101 }, (_, i) => samplePose(i / 100));
  for (let i = 100; i >= 0; i--) assert.deepEqual(samplePose(i / 100), forward[i]);
});

test('every score handoff remains continuous from both sides', () => {
  for (const p of [...CHAPTERS.map(c => c.at).slice(1, -1), 0.965]) {
    const a = flatten(samplePose(p - 1e-7));
    const b = flatten(samplePose(p + 1e-7));
    assert.ok(a.every((v, i) => Math.abs(v - b[i]) < 0.0002), `discontinuity at ${p}`);
  }
});

test('reduced motion presents a stable composition inside each movement', () => {
  for (const chapter of CHAPTERS.slice(1, -1)) {
    assert.deepEqual(samplePose(chapter.at - 0.025, false, true), samplePose(chapter.at + 0.025, false, true));
  }
});

test('invalid or overshooting browser positions clamp safely', () => {
  assert.deepEqual(samplePose(-10), samplePose(0));
  assert.deepEqual(samplePose(12), samplePose(1));
  assert.deepEqual(samplePose(Number.NaN), samplePose(0));
  assert.equal(getChapterIndex(0), 0);
  assert.equal(getChapterIndex(1), 7);
});
