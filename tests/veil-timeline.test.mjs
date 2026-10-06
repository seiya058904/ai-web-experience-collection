import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHAPTER_COUNT,
  END_RAW,
  chapterTarget,
  clamp,
  sampleTimeline,
  smoothstep,
} from '../experiences/veil/src/timeline.ts';

function close(actual, expected, tolerance = 1e-10) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `Expected ${actual} to be within ${tolerance} of ${expected}`,
  );
}

function assertHealthy(sample) {
  for (const key of ['progress', 'active', 'local', 'dark', 'completed']) {
    assert.ok(Number.isFinite(sample[key]), `${key} must be finite`);
  }
  assert.ok(sample.progress >= 0 && sample.progress <= CHAPTER_COUNT - 1);
  assert.ok(Number.isInteger(sample.active) && sample.active >= 0 && sample.active < CHAPTER_COUNT);
  assert.ok(sample.local >= 0 && sample.local < 1);
  assert.ok(sample.dark >= 0 && sample.dark <= 1);
  assert.ok(sample.completed >= 0 && sample.completed <= 1);
  assert.equal(sample.weights.length, CHAPTER_COUNT);
  assert.ok(sample.weights.every((weight) => Number.isFinite(weight) && weight >= 0 && weight <= 1));
  close(sample.weights.reduce((sum, weight) => sum + weight, 0), 1);
  assert.ok(Math.max(...sample.weights) >= 0.5, 'A dominant title must always remain visible');
  close(sample.weights[sample.active], Math.max(...sample.weights));
  const visible = sample.weights.flatMap((weight, index) => weight > 0 ? [index] : []);
  assert.ok(visible.length <= 2, 'Unrelated chapters must never overlap');
  if (visible.length === 2) assert.equal(visible[1] - visible[0], 1);
}

test('invalid and out-of-range scroll samples have safe, bounded destinations', () => {
  for (const raw of [NaN, -Infinity, Infinity, -1e12, 1e12, -0, 0, END_RAW]) {
    assertHealthy(sampleTimeline(raw));
  }
  assert.deepEqual(sampleTimeline(NaN), sampleTimeline(0));
  assert.deepEqual(sampleTimeline(-Infinity), sampleTimeline(0));
  assert.deepEqual(sampleTimeline(Infinity), sampleTimeline(END_RAW));
});

test('every chapter provides all five lifecycle phases, with a living final hold', () => {
  for (let chapter = 0; chapter < CHAPTER_COUNT - 1; chapter += 1) {
    assert.equal(sampleTimeline(chapter).phase, 'enter');
    assert.equal(sampleTimeline(chapter + 0.14).phase, 'stable');
    assert.equal(sampleTimeline(chapter + 0.36).phase, 'hold');
    assert.equal(sampleTimeline(chapter + 0.6).phase, 'handoff');
    assert.equal(sampleTimeline(chapter + 0.92).phase, 'exit');
  }
  assert.equal(sampleTimeline(6).phase, 'enter');
  assert.equal(sampleTimeline(6.14).phase, 'stable');
  assert.equal(sampleTimeline(6.36).phase, 'hold');
  assert.equal(sampleTimeline(6.6).phase, 'hold');
  assert.equal(sampleTimeline(END_RAW).phase, 'hold');
});

test('settled compositions retain their identity before the material handoff', () => {
  for (let chapter = 0; chapter < CHAPTER_COUNT - 1; chapter += 1) {
    const stable = sampleTimeline(chapter + 0.24);
    const held = sampleTimeline(chapter + 0.6);
    assert.ok(stable.progress - chapter < 0.01, 'Navigation must reveal an established composition');
    close(held.progress - chapter, 0.035);
    assert.equal(held.weights[chapter], 1);
    assert.equal(held.active, chapter);
    assert.ok(sampleTimeline(chapter + 0.92).progress - chapter > 0.89);
  }
});

test('material, title and atmosphere remain continuous across every timing boundary', () => {
  const epsilon = 1e-7;
  for (let chapter = 0; chapter < CHAPTER_COUNT; chapter += 1) {
    for (const local of [0, 0.14, 0.36, 0.6, 0.64, 0.8, 0.92, 0.96]) {
      const raw = chapter + local;
      if (raw > END_RAW) continue;
      const before = sampleTimeline(raw - epsilon);
      const after = sampleTimeline(raw + epsilon);
      close(before.progress, after.progress, 2e-6);
      close(before.dark, after.dark, 3e-6);
      close(before.completed, after.completed, 1e-6);
      for (let title = 0; title < CHAPTER_COUNT; title += 1) {
        close(before.weights[title], after.weights[title], 2e-6);
      }
    }
  }
});

test('a full sweep is monotonic, never blank and exactly reversible after arbitrary jumps', () => {
  const forward = [];
  let previousProgress = -Infinity;
  let previousCompletion = -Infinity;
  for (let step = 0; step <= 6850; step += 1) {
    const raw = step / 1000;
    const sample = sampleTimeline(raw);
    assertHealthy(sample);
    assert.ok(sample.progress >= previousProgress);
    assert.ok(sample.completed >= previousCompletion);
    forward.push({ raw, sample });
    previousProgress = sample.progress;
    previousCompletion = sample.completed;
  }
  for (let index = forward.length - 1; index >= 0; index -= 1) {
    // A jump in the other direction cannot influence the requested sample.
    sampleTimeline((index * 53 % 6851) / 1000);
    assert.deepEqual(sampleTimeline(forward[index].raw), forward[index].sample);
  }
});

test('the dark environment surrounds LIGHT and returns smoothly to ivory', () => {
  close(sampleTimeline(chapterTarget(2)).dark, 0);
  close(sampleTimeline(chapterTarget(3)).dark, 1);
  close(sampleTimeline(3.6).dark, 1);
  close(sampleTimeline(chapterTarget(4)).dark, 0);
  const entering = sampleTimeline(2.8).dark;
  const leaving = sampleTimeline(3.8).dark;
  assert.ok(entering > 0 && entering < 1);
  assert.ok(leaving > 0 && leaving < 1);
  for (let step = 2000; step < 3000; step += 1) {
    assert.ok(sampleTimeline((step + 1) / 1000).dark >= sampleTimeline(step / 1000).dark);
  }
  for (let step = 3000; step < 4000; step += 1) {
    assert.ok(sampleTimeline((step + 1) / 1000).dark <= sampleTimeline(step / 1000).dark);
  }
});

test('navigation targets settle on the requested title and preserve the final scene', () => {
  for (let chapter = 0; chapter < CHAPTER_COUNT; chapter += 1) {
    const target = chapterTarget(chapter);
    close(target, chapter === 0 ? 0 : chapter + 0.24);
    const sample = sampleTimeline(target);
    assert.equal(sample.active, chapter);
    assert.equal(sample.weights[chapter], 1);
  }
  const end = sampleTimeline(END_RAW);
  assert.equal(end.progress, 6);
  assert.equal(end.active, 6);
  assert.equal(end.weights[6], 1);
  assert.equal(end.completed, 1);
  assert.equal(end.dark, 0);
  assert.deepEqual(sampleTimeline(END_RAW + 100), end);
});

test('sampling returns independent weight arrays that consumers cannot corrupt', () => {
  const untouched = sampleTimeline(2.8);
  const changed = sampleTimeline(2.8);
  changed.weights.fill(0);
  assert.deepEqual(sampleTimeline(2.8), untouched);
  assert.notDeepEqual(changed, untouched);
});

test('interpolation helpers handle clamping, reversed edges and degenerate inputs', () => {
  assert.equal(clamp(-1), 0);
  assert.equal(clamp(2), 1);
  assert.equal(clamp(NaN, 2, 4), 2);
  assert.equal(clamp(Infinity, 2, 4), 4);
  assert.equal(clamp(-Infinity, 2, 4), 2);
  assert.equal(clamp(3, 4, 2), 3);
  assert.equal(smoothstep(0, 1, -1), 0);
  assert.equal(smoothstep(0, 1, 2), 1);
  assert.equal(smoothstep(0, 1, 0.5), 0.5);
  assert.equal(smoothstep(1, 0, 0.25), 0.84375);
  assert.equal(smoothstep(1, 1, 0), 0);
  assert.equal(smoothstep(1, 1, 1), 1);
  assert.equal(smoothstep(0, 1, NaN), 0);
  for (const value of [NaN, -Infinity, Infinity]) {
    assert.ok(Number.isFinite(smoothstep(value, value, value)));
    assert.ok(Number.isFinite(clamp(value, value, value)));
    assert.ok(Number.isFinite(chapterTarget(value)));
  }
});
