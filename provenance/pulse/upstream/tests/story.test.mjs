import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateStory, evaluateTransition, transitionSpecs, clamp01, smoothStep } from '../src/story.ts';

const chapterHeight = 1000;
const transitionHeight = 500;
const chapters = Array.from({ length: 11 }, (_, i) => ({
  id: `CH-${String(i + 1).padStart(2, '0')}`,
  top: i * (chapterHeight + transitionHeight),
  height: chapterHeight,
}));
const transitions = Array.from({ length: 10 }, (_, i) => ({
  id: transitionSpecs[i].id,
  top: chapters[i].top + chapterHeight,
  height: transitionHeight,
}));
const fixture = { viewport: { width: 1440, height: 900 }, chapters, transitions };
const atFocus = (y, overrides = {}) => evaluateStory({ ...fixture, scrollY: y - fixture.viewport.height / 2, ...overrides });

function finiteTree(value) {
  if (typeof value === 'number') assert.ok(Number.isFinite(value), `Non-finite result: ${value}`);
  if (Array.isArray(value)) value.forEach(finiteTree);
  else if (value && typeof value === 'object') Object.values(value).forEach(finiteTree);
}

test('all ten boundaries have distinct identifiers, variants, anchors and five authored stages', () => {
  assert.equal(transitionSpecs.length, 10);
  assert.equal(new Set(transitionSpecs.map(s => s.id)).size, 10);
  assert.equal(new Set(transitionSpecs.map(s => s.variant)).size, 10);
  for (const [index, spec] of transitionSpecs.entries()) {
    assert.equal(spec.source, chapters[index].id);
    assert.equal(spec.target, chapters[index + 1].id);
    assert.equal(spec.stages.length, 5);
    assert.ok(spec.stages.every(s => s.length > 12));
    assert.ok(spec.anchor.length > 12);
    assert.ok(spec.fallback.length > 12);
  }
});

test('quarter-point stages match their own authored contracts', () => {
  for (let index = 0; index < 10; index += 1) {
    for (let stage = 0; stage < 5; stage += 1) {
      const frame = evaluateTransition(index, stage / 4);
      assert.equal(frame.stage, stage);
      assert.equal(frame.stageLabel, transitionSpecs[index].stages[stage]);
    }
  }
});

test('every source and target endpoint is complete and exact', () => {
  for (let i = 0; i < 10; i += 1) {
    const first = evaluateTransition(i, 0);
    const last = evaluateTransition(i, 1);
    assert.equal(first.sourceOpacity, 1);
    assert.equal(first.targetOpacity, 0);
    assert.equal(first.sourceTextOpacity, 1);
    assert.equal(first.targetTextOpacity, 0);
    assert.equal(first.owner, 'source');
    assert.equal(last.sourceOpacity, 0);
    assert.equal(last.targetOpacity, 1);
    assert.equal(last.sourceTextOpacity, 0);
    assert.equal(last.targetTextOpacity, 1);
    assert.equal(last.owner, 'target');
    assert.equal(last.reveal, 1);
  }
});

test('reverse evaluation and arbitrary entry are exactly history independent', () => {
  const positions = [0, 0.001, 0.249, 0.25, 0.251, 0.499, 0.5, 0.501, 0.749, 0.75, 0.751, 0.999, 1];
  for (let i = 0; i < 10; i += 1) {
    const forward = positions.map(p => evaluateTransition(i, p));
    const reverse = [...positions].reverse().map(p => evaluateTransition(i, p)).reverse();
    assert.deepEqual(reverse, forward);
    assert.deepEqual(evaluateTransition(i, 0.5), forward[6]);
  }
});

test('source and target text never compete for the same reading slot', () => {
  for (let i = 0; i < 10; i += 1) {
    for (let step = 0; step <= 1000; step += 1) {
      const f = evaluateTransition(i, step / 1000);
      assert.equal(f.sourceTextOpacity * f.targetTextOpacity, 0);
      if (f.captionOwner === 'anchor') {
        assert.equal(f.sourceTextOpacity, 0);
        assert.equal(f.targetTextOpacity, 0);
        assert.ok(f.representationLabel.length > 0);
      }
    }
  }
});

test('signal-to-return cannot show electrical and blood overlays as one changing line', () => {
  for (let step = 0; step <= 200; step += 1) {
    const f = evaluateTransition(2, step / 200);
    assert.equal(f.electricalOpacity * f.bloodOpacity, 0);
  }
});

test('scale changes always retain their explicit representation cue', () => {
  for (const index of [5, 6, 8]) {
    for (const p of [0, 0.25, 0.5, 0.75, 1]) {
      assert.equal(evaluateTransition(index, p).scaleCueOpacity, 1);
    }
  }
});

test('reduced motion keeps identity and progress while presenting stable complete plates', () => {
  for (let index = 0; index < 10; index += 1) {
    for (const p of [0, 0.17, 0.499, 0.5, 0.73, 1]) {
      const frame = evaluateTransition(index, p, true);
      assert.equal(frame.id, transitionSpecs[index].id);
      assert.equal(frame.progress, p);
      assert.equal(frame.visualProgress, p < 0.5 ? 0 : 1);
      assert.equal(frame.sourceOpacity + frame.targetOpacity, 1);
      assert.ok([0, 1].includes(frame.sourceOpacity));
      assert.ok([0, 1].includes(frame.targetOpacity));
    }
  }
});

test('numeric input normalization never leaks NaN or infinity into rendering', () => {
  for (let i = 0; i < 10; i += 1) {
    for (const p of [NaN, -Infinity, Infinity, -1000, 1000]) {
      const frame = evaluateTransition(i, p);
      finiteTree(frame);
      assert.ok(!frame.sourceClip.includes('NaN'));
      assert.ok(!frame.targetClip.includes('Infinity'));
    }
  }
  finiteTree(evaluateStory({
    scrollY: NaN,
    viewport: { width: NaN, height: 0 },
    chapters: [{ id: 'CH-01', top: NaN, height: -2 }],
    transitions: [],
  }));
});

test('invalid transition indices fail clearly instead of rendering another chapter', () => {
  for (const index of [-1, 10, 0.5, NaN, Infinity]) {
    assert.throws(() => evaluateTransition(index, 0.5), RangeError);
  }
});

test('the initial native page position selects the first chapter without a loading state', () => {
  const state = evaluateStory({ ...fixture, scrollY: 0 });
  assert.equal(state.chapterId, 'CH-01');
  assert.equal(state.progress, 0);
  assert.equal(state.transition.active, false);
  assert.equal(state.transition.progress, 0);
});

test('large jumps select the correct late chapter without visiting earlier chapters', () => {
  const middle = atFocus(chapters[6].top + 400);
  assert.equal(middle.chapterId, 'CH-07');
  assert.equal(middle.chapterProgress, 0.4);
  const end = evaluateStory({ ...fixture, scrollY: 1e6 });
  assert.equal(end.chapterId, 'CH-11');
  assert.equal(end.progress, 1);
  assert.equal(end.transition.active, false);
  assert.equal(end.transition.progress, 1);
});

test('transition ownership changes at exactly the midpoint in every adjacent boundary', () => {
  for (const [index, bounds] of transitions.entries()) {
    const before = atFocus(bounds.top + bounds.height * 0.4999);
    const midpoint = atFocus(bounds.top + bounds.height * 0.5);
    const after = atFocus(bounds.top + bounds.height * 0.5001);
    assert.equal(before.chapterId, chapters[index].id);
    assert.equal(midpoint.chapterId, chapters[index + 1].id);
    assert.equal(after.chapterId, chapters[index + 1].id);
    assert.equal(midpoint.transition.id, bounds.id);
    assert.equal(midpoint.transition.progress, 0.5);
    assert.equal(midpoint.transition.active, true);
  }
});

test('threshold neighbors do not retain a transition outside its measured rectangle', () => {
  for (const bounds of transitions) {
    assert.equal(atFocus(bounds.top - 0.01).transition.active, false);
    assert.equal(atFocus(bounds.top).transition.active, true);
    assert.equal(atFocus(bounds.top + bounds.height).transition.active, true);
    assert.equal(atFocus(bounds.top + bounds.height + 0.01).transition.active, false);
  }
});

test('story evaluation is identical on reverse visits and after direct refresh', () => {
  const ys = [0, 600, 950, 1600, 4500, 8900, 10125, 15100];
  const forward = ys.map(scrollY => evaluateStory({ ...fixture, scrollY }));
  const reverse = [...ys].reverse().map(scrollY => evaluateStory({ ...fixture, scrollY })).reverse();
  assert.deepEqual(reverse, forward);
  assert.deepEqual(evaluateStory({ ...fixture, scrollY: 10125 }), forward[6]);
});

test('responsive remeasurement produces a correct focus instead of cached desktop geometry', () => {
  const resized = evaluateStory({ ...fixture, viewport: { width: 390, height: 844 }, scrollY: 828 });
  assert.equal(resized.focusY, 1250);
  assert.equal(resized.transition.progress, 0.5);
  assert.equal(resized.chapterId, 'CH-02');
});

test('a short page needs no scroll distance and still has a valid chapter', () => {
  const short = evaluateStory({ scrollY: 100, viewport: { width: 390, height: 844 }, chapters: [{ id: 'CH-01', top: 0, height: 500 }], transitions: [] });
  assert.equal(short.progress, 0);
  assert.equal(short.scrollY, 0);
  assert.equal(short.chapterId, 'CH-01');
  assert.equal(short.transition, null);
  finiteTree(short);
});

test('empty geometry is safe during the first measurement', () => {
  assert.deepEqual(evaluateStory({ scrollY: 0, viewport: { width: 1440, height: 900 }, chapters: [], transitions: [] }), {
    chapterIndex: -1, chapterId: null, progress: 0, chapterProgress: 0, focusY: 0, scrollY: 0, transition: null,
  });
});

test('evaluation never mutates DOM measurements or chapter arrays', () => {
  const input = structuredClone({ ...fixture, scrollY: 4020 });
  const before = structuredClone(input);
  input.chapters.forEach(Object.freeze);
  input.transitions.forEach(Object.freeze);
  Object.freeze(input.chapters);
  Object.freeze(input.transitions);
  Object.freeze(input);
  evaluateStory(input);
  assert.deepEqual(input, before);
});

test('all visual numeric fields remain bounded throughout every transition', () => {
  for (let i = 0; i < 10; i += 1) {
    for (let step = 0; step <= 500; step += 1) {
      const frame = evaluateTransition(i, step / 500);
      finiteTree(frame);
      for (const key of ['sourceOpacity', 'targetOpacity', 'sourceTextOpacity', 'targetTextOpacity', 'reveal', 'lineProgress', 'scaleCueOpacity', 'electricalOpacity', 'bloodOpacity']) {
        assert.ok(frame[key] >= 0 && frame[key] <= 1, `${key} left [0,1]`);
      }
      assert.ok(frame.anchor.x >= 0 && frame.anchor.x <= 100);
      assert.ok(frame.anchor.y >= 0 && frame.anchor.y <= 100);
    }
  }
});

test('smooth steps and clamping have exact endpoints', () => {
  assert.equal(clamp01(NaN), 0);
  assert.equal(clamp01(Infinity), 1);
  assert.equal(clamp01(-Infinity), 0);
  assert.equal(smoothStep(0.2, 0.8, 0), 0);
  assert.equal(smoothStep(0.2, 0.8, 1), 1);
  assert.equal(smoothStep(1, 1, 1), 1);
  assert.equal(smoothStep(1, 1, 0), 0);
});
