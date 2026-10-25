import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, captionOpacity } from '../experiences/kage/src/score.ts';

test('caption side and content changes have a fully invisible interval in both directions', () => {
  for (let i = 1; i < CHAPTERS.length; i++) {
    const boundary = (CHAPTERS[i - 1].at + CHAPTERS[i].at) / 2;
    for (const offset of [-.003, 0, .003]) assert.equal(captionOpacity(boundary + offset), 0);
    assert.equal(captionOpacity(boundary - .02), 1);
    assert.equal(captionOpacity(boundary + .02), 1);
    for (const offset of [.005, .01, .015]) {
      assert.ok(Math.abs(captionOpacity(boundary - offset) - captionOpacity(boundary + offset)) < 1e-12);
    }
  }
});

test('chapter holds and reduced motion always expose a stable readable caption', () => {
  for (const chapter of CHAPTERS) assert.equal(captionOpacity(chapter.at), 1);
  for (let i = 0; i <= 1000; i++) assert.equal(captionOpacity(i / 1000, true), 1);
});
