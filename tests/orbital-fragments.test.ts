import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, initialChapterFromFragment } from '../experiences/orbital/lib/orbital/mission.ts';

test('fresh existing chapter fragments resolve even when React inserted their targets too late for the browser', () => {
  for (const [index, chapter] of CHAPTERS.entries()) {
    assert.equal(initialChapterFromFragment(`#chapter-${chapter.id}`, 0, false, 'navigate'), index);
  }
  assert.equal(initialChapterFromFragment('#chapter-mars', 0, false, 'reload'), 6);
  for (const hash of ['', '#unknown', '#mars', '#mission-reading']) assert.equal(initialChapterFromFragment(hash, 0, false, 'navigate'), null);
});

test('a fragment never overrides saved history, native Back/Forward, or document movement before controller readiness', () => {
  assert.equal(initialChapterFromFragment('#chapter-mars', 0, true, 'reload'), null);
  assert.equal(initialChapterFromFragment('#chapter-mars', 0, false, 'back_forward'), null);
  assert.equal(initialChapterFromFragment('#chapter-mars', 140, false, 'navigate'), null);
  assert.equal(initialChapterFromFragment('#chapter-mars', 8849, false, 'navigate'), null);
});
