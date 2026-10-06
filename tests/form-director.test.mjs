import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, KEYFRAMES, chapterAt, chapterPosition, chapterProgress, samplePose } from '../experiences/form/src/director.js';

test('every route lands inside its chapter and invalid input stays bounded', () => {
  assert.equal(new Set(CHAPTERS.map(chapter => chapter.id)).size, CHAPTERS.length);
  for (const [index, chapter] of CHAPTERS.entries()) {
    const position = chapterPosition(chapter.id);
    assert.ok(Number.isFinite(position));
    assert.equal(chapterAt(position), index);
    assert.ok(chapterProgress(position) >= 0 && chapterProgress(position) <= 1);
  }
  assert.equal(chapterPosition('missing-chapter'), null);
  for (const progress of [-100, NaN, Infinity, -Infinity, 0, 8, 100]) {
    const pose = samplePose(progress);
    assert.ok(pose.progress >= 0 && pose.progress <= CHAPTERS.length);
    assert.ok(pose.chapter >= 0 && pose.chapter < CHAPTERS.length);
    assert.ok(pose.local >= 0 && pose.local <= 1);
  }
  assert.equal(chapterAt(8), CHAPTERS.length - 1);
});

test('the film remains finite and continuous at keyframes and chapter handoffs', () => {
  // Discrete chapter metadata is intentionally excluded. All geometry,
  // camera, lighting and drawing weights must survive a direct seek.
  const continuousKeys = Object.keys(samplePose(0)).filter(key => !['chapter', 'local'].includes(key));
  const boundaries = [...new Set([...KEYFRAMES.map(frame => frame.t), ...CHAPTERS.map((_, index) => index)])];
  for (const mobile of [false, true]) {
    for (let step = 0; step <= 1600; step++) {
      const pose = samplePose(step / 200, mobile);
      for (const [key, value] of Object.entries(pose)) assert.ok(Number.isFinite(value), `${key} at ${step / 200}`);
      assert.ok(pose.span > 0, 'camera cannot collapse');
      for (const key of ['cs', 'ls', 'ts']) assert.ok(pose[key] > 0, `${key} cannot invert or collapse`);
    }
    for (const boundary of boundaries) {
      const before = samplePose(boundary - 1e-7, mobile);
      const after = samplePose(boundary + 1e-7, mobile);
      for (const key of continuousKeys) {
        assert.ok(Math.abs(before[key] - after[key]) < 1e-4, `${mobile ? 'portrait' : 'wide'} ${key} discontinuity at ${boundary}`);
      }
    }
  }
});

test('reverse seeks are deterministic and reduced motion holds an unchanged composition', () => {
  const positions = [0, .21, .74, 1.24, 1.94, 2.44, 2.86, 3.31, 3.83, 4.42, 4.95, 5.35, 5.88, 6.32, 6.85, 7.32, 8];
  for (const mobile of [false, true]) {
    for (const reduced of [false, true]) {
      const forward = positions.map(position => samplePose(position, mobile, reduced));
      for (let index = positions.length - 1; index >= 0; index--) {
        assert.deepEqual(samplePose(positions[index], mobile, reduced), forward[index]);
      }
      forward[3].cx = 999;
      assert.notEqual(samplePose(positions[3], mobile, reduced).cx, 999, 'returned poses must not mutate the timeline');
    }
    for (let chapter = 0; chapter < CHAPTERS.length; chapter++) {
      const start = samplePose(chapter + .2, mobile, true);
      const end = samplePose(chapter + .7, mobile, true);
      for (const key of Object.keys(start).filter(key => !['progress', 'local'].includes(key))) {
        assert.equal(start[key], end[key], `reduced motion changed ${key} during chapter ${chapter + 1}`);
      }
    }
  }
});
