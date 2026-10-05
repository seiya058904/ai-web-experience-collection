import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, chapterVisibility, sceneBlend } from '../experiences/orbital/lib/orbital/mission.ts';
import { POSES, MOBILE, COMPACT } from '../experiences/orbital/lib/orbital/poses.ts';

test('Orbital keeps one readable chapter and bounded opacity through forward and reverse traversal', () => {
  for (let n = 0; n <= 8000; n++) {
    const visibility = CHAPTERS.map((_, i) => chapterVisibility(n / 1000, i));
    assert(visibility.every(v => Number.isFinite(v) && v >= 0 && v <= 1));
    assert(visibility.filter(v => v > .5).length <= 1);
  }
  CHAPTERS.forEach((_, i) => assert.equal(chapterVisibility(i + .36, i), 1));
  assert.equal(chapterVisibility(0, 0), 1);
  assert.equal(chapterVisibility(8, 7), 1);
});

test('Orbital shared-object poses remain continuous across every chapter seam', () => {
  const sample = (p, variants) => {
    const { from, to, mix } = sceneBlend(p);
    const a = { ...POSES[from], ...variants[from] }, b = { ...POSES[to], ...variants[to] };
    return Object.fromEntries(Object.keys(a).map(key => [key, a[key] + (b[key] - a[key]) * mix]));
  };
  for (const variants of [[], MOBILE, COMPACT]) {
    for (let i = 1; i < 8; i++) {
      const before = sample(i - .000001, variants), after = sample(i + .000001, variants);
      for (const key in before) assert(Math.abs(before[key] - after[key]) < .001, `${i} / ${key}`);
    }
  }
});
