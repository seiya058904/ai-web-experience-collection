import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateStory, deriveTransitionMetrics } from '../experiences/chrysalis/src/story.ts';
import { evaluateTransition, clampProgress, transitions } from '../experiences/chrysalis/src/transitions.ts';

const chapters = Array.from({ length: 11 }, (_, index) => ({
  id: `ch-${String(index + 1).padStart(2, '0')}`, top: index * 1400, height: 1000,
}));
const metrics = chapters.slice(0, -1).map((chapter, index) => ({
  from: chapter.id, to: chapters[index + 1]!.id,
  top: chapter.top + chapter.height, height: 400,
}));

test('every adjacent chapter pair has its own five-stage handoff and fallback', () => {
  assert.equal(transitions.length, 10);
  assert.equal(new Set(transitions.map((item) => item.id)).size, 10);
  assert.equal(new Set(transitions.map((item) => item.method)).size, 10);
  transitions.forEach((transition, index) => {
    assert.equal(transition.from, chapters[index]!.id);
    assert.equal(transition.to, chapters[index + 1]!.id);
    assert.equal(transition.stages.length, 5);
    assert.equal(new Set(transition.stages).size, 5);
    assert.ok(transition.mobileTreatment.length > 40);
    assert.ok(transition.fallback.length > 25);
    assert.ok(transition.rejection.length > 40);
  });
});

for (let index = 0; index < transitions.length; index += 1) {
  test(`${transitions[index]!.id}: direct, forward and reversed visits are identical`, () => {
    const positions = [0, 0.249999, 0.25, 0.250001, 0.499999, 0.5, 0.500001, 0.749999, 0.75, 0.750001, 1];
    const direct = new Map(positions.map((p) => [p, evaluateTransition(index, p)]));
    for (const p of positions) assert.deepEqual(evaluateTransition(index, p), direct.get(p));
    for (const p of positions.toReversed()) assert.deepEqual(evaluateTransition(index, p), direct.get(p));
    for (const p of [0.75, 0.25, 1, 0, 0.5]) assert.deepEqual(evaluateTransition(index, p), direct.get(p));
    assert.equal(evaluateTransition(index, 0.5).stage, 50);
  });

  test(`${transitions[index]!.id}: endpoints, image coverage and text handoff are safe`, () => {
    const start = evaluateTransition(index, 0);
    const end = evaluateTransition(index, 1);
    assert.equal(start.sourceVisible, true);
    assert.equal(start.targetVisible, false);
    assert.equal(start.srcScale, 1);
    assert.equal(end.sourceVisible, false);
    assert.equal(end.targetVisible, true);
    assert.equal(end.dstScale, 1);
    assert.equal(end.dstX, 0);
    assert.equal(end.dstY, 0);
    assert.equal(end.clip, 'inset(0 0 0 0)');
    assert.equal(end.fallbackChapter, chapters[index + 1]!.id);
    for (let step = 0; step <= 100; step += 1) {
      const state = evaluateTransition(index, step / 100);
      assert.ok(state.sourceVisible || state.targetVisible, 'at least one authored plate remains present');
      assert.ok(!(state.sourceTextOpacity > 0 && state.targetTextOpacity > 0), 'old and new captions do not compete');
      for (const value of [state.srcScale, state.dstScale, state.srcX, state.srcY, state.dstX, state.dstY, state.reveal]) assert.ok(Number.isFinite(value));
      assert.ok(!/NaN|Infinity/.test(state.clip));
    }
  });

  test(`${transitions[index]!.id}: reduced motion uses two stable plates without camera movement`, () => {
    for (const p of [0, 0.25, 0.49999, 0.5, 0.75, 1]) {
      const state = evaluateTransition(index, p, true);
      assert.equal(state.visualProgress, p < 0.5 ? 0 : 1);
      assert.equal(state.srcScale, 1);
      assert.equal(state.dstScale, 1);
      assert.equal(state.srcX + state.srcY + state.dstX + state.dstY, 0);
      assert.equal(state.sourceVisible, p < 0.5);
      assert.equal(state.targetVisible, p >= 0.5);
      assert.equal(state.sourceTextOpacity + state.targetTextOpacity, 1);
    }
  });
}

test('silk-supported handoffs use one immutable hanging reference', () => {
  const supported = [4, 5, 6, 7, 8];
  for (const index of supported) {
    for (const p of [0, 0.25, 0.5, 0.75, 1]) {
      assert.deepEqual(evaluateTransition(index, p).anchor, transitions[index]!.anchor);
      assert.equal(evaluateTransition(index, p).anchor.id, 'silk-pad');
      assert.equal(evaluateTransition(index, p).anchor.x, 68);
      assert.equal(evaluateTransition(index, p).anchor.y, 23);
    }
  }
  const snapshot = evaluateTransition(5, 0.5);
  snapshot.anchor.x = 0;
  assert.equal(evaluateTransition(5, 0.5).anchor.x, 68, 'a renderer cannot mutate the shared anchor by changing a snapshot');
});

test('progress and index inputs are clamped and nonfinite inputs cannot leak to CSS', () => {
  assert.equal(clampProgress(-1), 0);
  assert.equal(clampProgress(2), 1);
  assert.equal(clampProgress(NaN), 0);
  assert.equal(clampProgress(-Infinity), 0);
  assert.equal(clampProgress(Infinity), 1);
  for (const index of [NaN, Infinity, -Infinity, -5, 999, 4.9]) {
    for (const progress of [NaN, Infinity, -Infinity, -1, 1.2]) {
      const state = evaluateTransition(index, progress);
      assert.ok(state.index >= 0 && state.index <= 9);
      assert.ok(Number.isInteger(state.index));
      assert.ok(Number.isFinite(state.progress));
      assert.ok(!/NaN|Infinity/.test(state.clip));
    }
  }
});

test('explicit transition rectangles reproduce all five checkpoints from scroll position', () => {
  metrics.forEach((metric, index) => {
    for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
      const scrollY = metric.top + metric.height * progress - 450;
      const state = evaluateStory({ scrollY, viewportHeight: 900, chapters, transitions: metrics });
      assert.equal(state.transition?.index, index);
      assert.equal(state.transition?.progress, progress);
      assert.equal(state.activeChapter, progress < 0.5 ? index : index + 1);
      assert.equal(state.chapterId, chapters[state.activeChapter]!.id);
    }
  });
});

test('threshold neighbors enter and leave bridges without stale state', () => {
  for (const metric of metrics) {
    const at = (probeY: number) => evaluateStory({ scrollY: probeY - 450, viewportHeight: 900, chapters, transitions: metrics });
    assert.equal(at(metric.top - 0.01).transition, null);
    assert.equal(at(metric.top).transition?.progress, 0);
    assert.equal(at(metric.top + metric.height).transition?.progress, 1);
    assert.equal(at(metric.top + metric.height + 0.01).transition, null);
    assert.equal(at(metric.top + metric.height + 0.01).chapterId, metric.to, 'A completed bridge must keep its target owner through the final hold.');
  }
});

test('fast end jump, reverse to opening and direct midpoint need no previous visits', () => {
  const visit = (scrollY: number) => evaluateStory({ scrollY, viewportHeight: 900, chapters, transitions: metrics });
  const opening = visit(0);
  assert.equal(opening.chapterId, 'ch-01');
  assert.equal(opening.progress, 0);
  assert.equal(visit(999999).chapterId, 'ch-11');
  assert.equal(visit(999999).progress, 1);
  assert.deepEqual(visit(0), opening);
  const middle = visit(metrics[5]!.top + 200 - 450);
  visit(0);
  visit(999999);
  assert.deepEqual(visit(metrics[5]!.top + 200 - 450), middle);
});

test('scene ownership and asset tokens resist late completion from another chapter', () => {
  const state = evaluateStory({
    scrollY: chapters[9]!.top, viewportHeight: 900, chapters, transitions: metrics,
    selectedModes: { 'ch-05': 4, 'ch-10': 'wings-unfolding' },
    assetsReady: { 'ch-05': true, 'ch-10': false },
  });
  assert.equal(state.chapterId, 'ch-10');
  assert.equal(state.selection, 'wings-unfolding');
  assert.equal(state.assetToken, 'ch-10:wings-unfolding');
  assert.equal(state.needsFallback, true);
  const lateOlderAssetToken = 'ch-05:4';
  assert.notEqual(state.assetToken, lateOlderAssetToken);
  const readyState = evaluateStory({
    scrollY: chapters[9]!.top, viewportHeight: 900, chapters, transitions: metrics,
    selectedModes: { 'ch-10': 'wings-unfolding' }, assetsReady: { 'ch-10': true },
  });
  assert.equal(readyState.assetToken, state.assetToken);
  assert.equal(readyState.needsFallback, false);
});

test('resize recalculates from fresh measurements instead of replaying a transition', () => {
  const desktop = evaluateStory({ scrollY: 900, viewportHeight: 900, chapters, transitions: metrics });
  const mobile = evaluateStory({ scrollY: 900, viewportHeight: 640, chapters, transitions: metrics });
  assert.equal(desktop.probeY, 1350);
  assert.equal(mobile.probeY, 1220);
  assert.equal(desktop.transition?.progress, 0.875);
  assert.equal(mobile.transition?.progress, 0.55);
  assert.deepEqual(evaluateStory({ scrollY: 900, viewportHeight: 900, chapters, transitions: metrics }), desktop);
});

test('default windows remain bounded and derive one window per adjacent chapter', () => {
  const windows = deriveTransitionMetrics(chapters, 900);
  assert.equal(windows.length, 10);
  windows.forEach((window, index) => {
    assert.equal(window.from, chapters[index]!.id);
    assert.equal(window.to, chapters[index + 1]!.id);
    assert.ok(window.height > 0 && window.height <= 405);
  });
  assert.deepEqual(deriveTransitionMetrics([], 900), []);
});

test('empty documents and invalid metrics return finite stable snapshots', () => {
  const empty = evaluateStory({ scrollY: NaN, viewportHeight: NaN, chapters: [] });
  assert.equal(empty.activeChapter, -1);
  assert.equal(empty.chapterId, null);
  assert.equal(empty.assetToken, 'empty');
  assert.ok(Number.isFinite(empty.scrollY));
  assert.ok(Number.isFinite(empty.probeY));
  for (const scrollY of [NaN, Infinity, -Infinity, -100]) {
    const state = evaluateStory({ scrollY, viewportHeight: 0, chapters: [{ id: 'ch-01', top: NaN, height: -10 }] });
    assert.equal(state.chapterId, 'ch-01');
    for (const value of [state.progress, state.localProgress, state.scrollY, state.probeY]) assert.ok(Number.isFinite(value));
  }
});

test('invalid nonadjacent transition metadata cannot take over the story', () => {
  const state = evaluateStory({
    scrollY: 750, viewportHeight: 900, chapters,
    transitions: [{ from: 'ch-01', to: 'ch-11', top: 1000, height: 400 }],
  });
  assert.equal(state.transition, null);
  assert.equal(state.chapterId, 'ch-01');
});

test('an explicit empty bridge list keeps native reading ownership in still view', () => {
  const contiguous = chapters.map((chapter,index) => ({ ...chapter, top: index * 1000 }));
  for (const index of [0,4,7,10]) {
    const state = evaluateStory({ scrollY: contiguous[index]!.top + 100, viewportHeight: 640, chapters: contiguous, transitions: [], reducedMotion: true });
    assert.equal(state.chapterId, contiguous[index]!.id);
    assert.equal(state.transition, null, 'Removed bridges must not be replaced with derived or zero-size transitions.');
  }
});

test('desktop-to-portrait-to-desktop keeps the correct anchor and clip, including reduced motion', () => {
  const anchorSensitiveMethods = new Set(['vein-pullback', 'pigment-reveal', 'meadow-return']);
  for (const reducedMotion of [false, true]) {
    metrics.forEach((metric, index) => {
      for (const progress of [.25, .5, .75]) {
        const visit = (viewportWidth: number, viewportHeight: number) => evaluateStory({
          scrollY: metric.top + metric.height * progress - viewportHeight / 2,
          viewportHeight, viewportWidth, chapters, transitions: metrics, reducedMotion,
        });
        const desktop = visit(1440, 900);
        const portrait = visit(390, 844);
        const definition = transitions[index]!;
        assert.equal(desktop.mobile, false);
        assert.equal(portrait.mobile, true);
        assert.equal(portrait.transition!.anchor.x, definition.anchor.mobileX);
        assert.equal(portrait.transition!.anchor.y, definition.anchor.mobileY);
        assert.deepEqual(portrait.transition, evaluateTransition(index, progress, reducedMotion, true));
        assert.equal(desktop.transition!.anchor.x, definition.anchor.x);
        assert.equal(desktop.transition!.anchor.y, definition.anchor.y);
        if (!reducedMotion && anchorSensitiveMethods.has(definition.method)) {
          assert.notEqual(portrait.transition!.clip, desktop.transition!.clip, 'Portrait reveal must use the recomposed anchor.');
        }
        if (reducedMotion) {
          assert.equal(portrait.transition!.clip, progress < .5 ? 'inset(0 100% 0 0)' : 'inset(0 0 0 0)');
          assert.equal(portrait.transition!.srcScale, 1);
          assert.equal(portrait.transition!.dstScale, 1);
        }
        // A renderer may change a snapshot; neither the shared definition nor
        // the next width evaluation may retain that mutation.
        portrait.transition!.anchor.x = -100;
        assert.deepEqual(visit(1440, 900), desktop);
        assert.equal(visit(390, 844).transition!.anchor.x, definition.anchor.mobileX);
      }
    });
  }
  for (const [viewportWidth, expected] of [[700, true], [701, false], [0, false], [NaN, false], [Infinity, false]] as const) {
    assert.equal(evaluateStory({ scrollY: 0, viewportHeight: 900, viewportWidth, chapters }).mobile, expected);
  }
  assert.equal(evaluateStory({ scrollY: 0, viewportHeight: 900, chapters }).mobile, false);
});

test('quantized quarter labels and complete-pose comparison modes remain truthful on direct, reverse and reduced visits', () => {
  for (let index = 0; index < transitions.length; index += 1) {
    for (const checkpoint of [.25, .5, .75, 1]) {
      const slightlyBelow = checkpoint - .000435;
      const snapshot = evaluateTransition(index, slightlyBelow);
      assert.equal(snapshot.stage, checkpoint * 100, 'Native scroll rounding must not retain the previous quarter label.');
      assert.equal(snapshot.progress, slightlyBelow, 'Caption tolerance must not quantize actual geometry.');
      assert.equal(evaluateTransition(index, checkpoint - .006).stage, (checkpoint - .25) * 100, 'The label tolerance stays local to the checkpoint.');
    }
  }
  for (const index of [2, 5, 8]) {
    for (const mobile of [false, true]) {
      const visits = [0, .124, .125, .249565, .499565, .5, .749565, .875, .876, 1];
      const direct = visits.map(progress => evaluateTransition(index, progress, false, mobile));
      for (let i = visits.length - 1; i >= 0; i -= 1) {
        const snapshot = evaluateTransition(index, visits[i]!, false, mobile);
        assert.deepEqual(snapshot, direct[i]);
        assert.equal(snapshot.presentation, 'paired-study');
        assert.ok(['inset(0 100% 0 0)', 'inset(0 0 0 0)'].includes(snapshot.clip), 'No intermediate mask may splice the complete poses.');
        assert.equal(snapshot.poseMode, visits[i]! < .125 ? 'source' : visits[i]! > .875 ? 'target' : 'comparison');
        assert.equal(snapshot.sourceVisible, snapshot.poseMode !== 'target');
        assert.equal(snapshot.targetVisible, snapshot.poseMode !== 'source');
      }
      for (const progress of [.25, .5, .75]) {
        const paired = evaluateTransition(index, progress, false, mobile);
        assert.ok(paired.sourceVisible && paired.targetVisible);
        assert.equal(paired.poseMode, 'comparison');
        const reduced = evaluateTransition(index, progress, true, mobile);
        assert.equal(reduced.poseMode, progress < .5 ? 'source' : 'target');
        assert.equal(reduced.stageLabel, transitions[index]!.stages[progress < .5 ? 0 : 4], 'Reduced motion must describe the single displayed pose.');
      }
      assert.match(evaluateTransition(index, .499565, false, mobile).stageLabel, /^Compare /);
    }
    assert.match(transitions[index]!.comparison!.scope, /not shown/);
  }
  const hatch = transitions[2]!.comparison!;
  assert.equal(hatch.layout, 'landscape', 'The shell and horizontal larva must not inherit the hanging-stage portrait crop.');
  assert.equal(hatch.sourceTitle, 'Hatchling beside the shell');
  assert.equal(hatch.targetTitle, 'Feeding at the leaf margin');
  for (const progress of [0, .25, .5, .75, 1]) {
    const snapshot = evaluateTransition(2, progress);
    assert.equal(snapshot.srcX + snapshot.srcY + snapshot.dstX + snapshot.dstY, 0, 'Complete plates remain stationary inside their separate frames.');
  }
  assert.equal(evaluateTransition(7, .499565).stageLabel, 'The late pattern returns to the exterior view.');
  assert.equal(evaluateTransition(6, .499565).stageLabel, 'A separate reconstruction introduces developing wing regions.');
});
