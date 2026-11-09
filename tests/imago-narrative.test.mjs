import test from 'node:test';
import assert from 'node:assert/strict';
import { loadNarrativeEvaluator, plain } from './imago-source-loader.mjs';

// These are pure geometry/state checks. They do not claim browser, visual,
// image-anatomy, frame-rate, or actual scrolling validation.
const evaluate = loadNarrativeEvaluator();
const viewport = 900;
const chapterHeight = 1000;
const handoffHeight = 1035;
const stickyHeight = 666;
const stickyTop = 76;
const chapterSpan = chapterHeight + handoffHeight;
const chapters = Object.freeze(Array.from({ length: 10 }, (_, index) => Object.freeze({
  id: `chapter-${String(index + 1).padStart(2, '0')}`,
  top: index * chapterSpan,
  height: chapterHeight,
})));
const boundaries = Object.freeze(chapters.slice(0, -1).map((chapter, index) => {
  const start = chapter.top + chapterHeight - stickyTop;
  return Object.freeze({
    id: `${String(index + 1).padStart(2, '0')}-${String(index + 2).padStart(2, '0')}`,
    fromId: chapter.id, toId: chapters[index + 1].id,
    start, end: start + handoffHeight - stickyHeight,
  });
}));
const documentHeight = chapters.at(-1).top + chapterHeight + 700;

for (const boundary of boundaries) {
  test(`pure narrative logic: ${boundary.id} has correct 0/25/50/75/100 percent checkpoints`, () => {
    for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
      const y = boundary.start + (boundary.end - boundary.start) * progress;
      const frame = evaluate(y, viewport, documentHeight, chapters, boundaries);
      assert.equal(frame.boundaries[boundary.id], progress);
      assert.equal(frame.detail.boundary, boundary.id);
      assert.equal(frame.detail.boundaryProgress, progress);
      assert.equal(frame.detail.chapterId, progress < 0.5 ? boundary.fromId : boundary.toId);
    }
  });
}

test('pure narrative logic: forward and reverse visits produce identical frames', () => {
  const positions = [0, 220, 924, 1100, 1293, 1400, 4600, 9500, 17000, documentHeight - viewport];
  const forward = positions.map(y => plain(evaluate(y, viewport, documentHeight, chapters, boundaries)));
  const reverse = positions.slice().reverse().map(y => plain(evaluate(y, viewport, documentHeight, chapters, boundaries))).reverse();
  assert.deepEqual(forward, reverse);
});

test('pure narrative logic: direct late-chapter evaluation does not require earlier visits', () => {
  const y = chapters[8].top + 220;
  const direct = plain(loadNarrativeEvaluator()(y, viewport, documentHeight, chapters, boundaries));
  evaluate(0, viewport, documentHeight, chapters, boundaries);
  evaluate(5000, viewport, documentHeight, chapters, boundaries);
  assert.deepEqual(plain(evaluate(y, viewport, documentHeight, chapters, boundaries)), direct);
  assert.equal(direct.detail.chapterId, 'chapter-09');
});

test('pure narrative logic: chapter ownership never moves backward during forward travel', () => {
  let previous = 1;
  for (let y = 0; y <= documentHeight - viewport; y += 7) {
    const frame = evaluate(y, viewport, documentHeight, chapters, boundaries);
    const current = Number(frame.detail.chapterId.slice(-2));
    assert.ok(current >= previous, `Chapter ownership regressed from ${previous} to ${current} at scrollY=${y}`);
    previous = current;
  }
  assert.equal(previous, 10);
});

test('pure narrative logic: the incoming chapter remains active after the sticky boundary releases', () => {
  for (const boundary of boundaries) {
    const frame = evaluate(boundary.end + 1, viewport, documentHeight, chapters, boundaries);
    assert.equal(frame.detail.chapterId, boundary.toId);
    assert.equal(frame.boundaries[boundary.id], 1);
  }
});

test('pure narrative logic: overscroll cannot produce negative or excessive reading progress', () => {
  const first = evaluate(-400, viewport, documentHeight, chapters, boundaries);
  const last = evaluate(documentHeight + 400, viewport, documentHeight, chapters, boundaries);
  assert.equal(first.detail.overall, 0);
  assert.equal(last.detail.overall, 1);
  assert.equal(first.detail.chapterId, 'chapter-01');
  assert.equal(last.detail.chapterId, 'chapter-10');
  for (const frame of [first, last]) {
    for (const progress of [...Object.values(frame.chapters), ...Object.values(frame.boundaries)]) {
      assert.ok(Number.isFinite(progress) && progress >= 0 && progress <= 1);
    }
  }
});

test('pure narrative logic: empty and shorter-than-viewport documents have finite progress', () => {
  const empty = evaluate(0, viewport, 500, [], []);
  assert.equal(empty.detail.chapterId, '');
  assert.equal(empty.detail.progress, 0);
  assert.equal(empty.detail.overall, 0);
  const short = evaluate(100, viewport, 500, [{ id: 'chapter-01', top: 0, height: 500 }], []);
  assert.equal(short.detail.overall, 0);
  assert.equal(short.detail.progress, 0);
});

test('pure narrative logic: a collapsed travel interval never divides by zero', () => {
  const frame = evaluate(50, 100, 1000, [{ id: 'chapter-01', top: 0, height: 0 }], [
    { id: '01-02', fromId: 'chapter-01', toId: 'chapter-02', start: 50, end: 50 },
  ]);
  assert.ok(Number.isFinite(frame.chapters['chapter-01']));
  assert.ok(Number.isFinite(frame.boundaries['01-02']));
});

test('pure narrative logic: evaluation does not mutate geometry or return shared frame state', () => {
  const first = evaluate(1000, viewport, documentHeight, chapters, boundaries);
  first.chapters['chapter-01'] = -100;
  first.detail.chapterId = 'corrupted';
  const second = evaluate(1000, viewport, documentHeight, chapters, boundaries);
  assert.notEqual(second.detail.chapterId, 'corrupted');
  assert.ok(second.chapters['chapter-01'] >= 0);
  assert.equal(Object.isFrozen(chapters[0]), true);
});
