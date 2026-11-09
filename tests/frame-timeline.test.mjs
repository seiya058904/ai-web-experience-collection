import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FRAMES, FPS, MAX_HOLD, BLOCK_HEIGHT, BLOCK_WIDTH, BLOCK_START_X, TARGET_X,
  PRESETS, DEFAULT_CONFIG, sanitizeConfig, pushPositions, getPose, makeTimeline,
  frameAtBeat, frameAtTime, beatForFrame, stepFrame,
  createHistory, editHistory, undoHistory, resetHistory,
} from '../experiences/frame/src/timeline.ts';

test('the default take is 24 distinct poses over 36 beats / exactly 3 seconds', () => {
  const result = makeTimeline();
  assert.equal(FRAMES, 24);
  assert.equal(FPS, 12);
  assert.equal(result.totalBeats, 36);
  assert.equal(result.duration, 3);
  assert.equal(result.durationMs, 3000);
  assert.deepEqual([...new Set(result.beats)], Array.from({ length: 24 }, (_, i) => i + 1));
  assert.equal(result.beats.filter(f => f === 1).length, 7);
  assert.equal(result.beats.filter(f => f === 24).length, 7);
  const authored = Array.from({ length: 24 }, (_, i) => {
    const { frame, description, ...pose } = getPose(i + 1);
    return JSON.stringify(pose);
  });
  assert.equal(new Set(authored).size, 24, 'metadata must not disguise duplicate poses');
});

test('all 169 supported hold combinations have exact display counts and durations', () => {
  for (let hold6 = 0; hold6 <= MAX_HOLD; hold6 += 1) {
    for (let hold18 = 0; hold18 <= MAX_HOLD; hold18 += 1) {
      const result = makeTimeline({ preset: 'even', hold6, hold18 });
      assert.equal(result.totalBeats, 36 + hold6 + hold18);
      assert.equal(result.duration, (36 + hold6 + hold18) / FPS);
      assert.equal(result.beats.filter(f => f === 6).length, 1 + hold6);
      assert.equal(result.beats.filter(f => f === 18).length, 1 + hold18);
      assert.equal(result.beats.filter(f => f === 12).length, 1);
      assert.equal(result.segments.length, 24);
      assert.equal(result.segments.reduce((sum, s) => sum + s.beats, 0), result.totalBeats);
      for (const segment of result.segments) {
        assert.equal(segment.endBeat - segment.startBeat, segment.beats);
        assert.ok(result.beats.slice(segment.startBeat, segment.endBeat).every(f => f === segment.frame));
      }
    }
  }
});

test('invalid persisted input cannot create NaN, out-of-range holds or unknown presets', () => {
  assert.deepEqual(sanitizeConfig({ preset: 'unknown', hold6: Infinity, hold18: NaN }), DEFAULT_CONFIG);
  assert.deepEqual(sanitizeConfig({ preset: 'ease-in', hold6: -9, hold18: 88 }), { preset: 'ease-in', hold6: 0, hold18: 12 });
  assert.deepEqual(sanitizeConfig({ preset: 'ease-out', hold6: 4.6, hold18: '8' }), { preset: 'ease-out', hold6: 5, hold18: 0 });
  for (const invalid of [null, undefined, false, 12, 'broken']) assert.deepEqual(sanitizeConfig(invalid), DEFAULT_CONFIG);
});

test('spacing takes share both endpoint poses and alter all four intermediate poses', () => {
  for (const preset of PRESETS) {
    const positions = pushPositions(preset);
    assert.equal(positions.length, 6);
    assert.equal(positions[0], BLOCK_START_X);
    assert.equal(positions[5], TARGET_X);
    assert.strictEqual(getPose(7, preset), getPose(7, 'even'));
    assert.strictEqual(getPose(12, preset), getPose(12, 'even'));
    for (let frame = 1; frame <= FRAMES; frame += 1) {
      if (frame < 8 || frame > 11) assert.strictEqual(getPose(frame, preset), getPose(frame, 'even'));
    }
  }
  for (let frame = 8; frame <= 11; frame += 1) {
    const variants = PRESETS.map(preset => getPose(frame, preset));
    assert.equal(new Set(variants.map(p => p.blockX)).size, 3);
    assert.equal(new Set(variants.map(p => p.boopX)).size, 3);
    assert.equal(new Set(variants.map(p => p.leftHand.x)).size, 3);
    assert.equal(new Set(variants.map(p => p.scaleY)).size, 3);
  }
});

test('intervals actually match their labels, while beat timing remains unchanged', () => {
  const differences = preset => pushPositions(preset).slice(1).map((value, index) => value - pushPositions(preset)[index]);
  const even = differences('even');
  assert.ok(even.every(value => Math.abs(value - even[0]) < 1e-12));
  const increasing = differences('ease-in');
  const decreasing = differences('ease-out');
  assert.ok(increasing.every((value, index) => !index || value > increasing[index - 1]));
  assert.ok(decreasing.every((value, index) => !index || value < decreasing[index - 1]));
  for (const preset of PRESETS) assert.deepEqual(makeTimeline({ ...DEFAULT_CONFIG, preset }).beats, makeTimeline().beats);
});

test('contact anchors, tabletop support and final alignment remain consistent', () => {
  for (const preset of PRESETS) {
    for (let frame = 1; frame <= FRAMES; frame += 1) {
      const pose = getPose(frame, preset);
      assert.equal(pose.blockY - BLOCK_HEIGHT / 2, 0);
      assert.ok(pose.boopX < pose.blockX - BLOCK_WIDTH / 2);
      assert.ok(pose.leftFoot.planted || pose.rightFoot.planted);
      for (const foot of [pose.leftFoot, pose.rightFoot]) {
        assert.ok(foot.y >= 0);
        assert.equal(foot.planted, foot.y === 0);
      }
      for (const hand of [pose.leftHand, pose.rightHand]) {
        assert.equal(hand.contact, pose.contact);
        if (!pose.contact) {
          assert.equal(hand.surface, null);
          assert.ok(hand.x <= pose.blockX - BLOCK_WIDTH / 2 + 1e-12);
        } else if (hand.surface === 'left') {
          assert.equal(hand.x, pose.blockX - BLOCK_WIDTH / 2);
          assert.ok(hand.y >= 0 && hand.y <= BLOCK_HEIGHT);
        } else if (hand.surface === 'front') {
          assert.equal(hand.z, BLOCK_WIDTH / 2);
          assert.ok(hand.x >= pose.blockX - BLOCK_WIDTH / 2 && hand.x <= pose.blockX + BLOCK_WIDTH / 2);
          assert.ok(hand.y >= 0 && hand.y <= BLOCK_HEIGHT);
        } else {
          assert.equal(hand.surface, 'top');
          assert.equal(hand.y, BLOCK_HEIGHT);
          assert.ok(hand.x >= pose.blockX - BLOCK_WIDTH / 2 && hand.x <= pose.blockX + BLOCK_WIDTH / 2);
        }
      }
    }
    assert.equal(getPose(24, preset).blockX, TARGET_X);
    assert.ok(getPose(24, preset).mouth > 0);
    assert.ok(getPose(13, preset).blockX > getPose(12, preset).blockX);
    assert.ok(getPose(13, preset).blockX - getPose(12, preset).blockX < 0.14);
    assert.ok(getPose(13, preset).contact);
    for (const frame of [19, 20, 21, 22]) assert.ok(getPose(frame, preset).contact);
  }
});

test('the supporting push foot stays at its previous pose coordinate', () => {
  for (const preset of PRESETS) {
    for (let frame = 8; frame <= 11; frame += 1) {
      const current = getPose(frame, preset);
      const previous = getPose(frame - 1, preset);
      if (current.leftFoot.planted) assert.equal(current.leftFoot.x, previous.leftFoot.x);
      if (current.rightFoot.planted) assert.equal(current.rightFoot.x, previous.rightFoot.x);
    }
  }
});

test('no foot teleports between adjacent poses while marked planted in both', () => {
  for (const preset of PRESETS) {
    for (let frame = 2; frame <= FRAMES; frame += 1) {
      const previous = getPose(frame - 1, preset);
      const current = getPose(frame, preset);
      for (const name of ['leftFoot', 'rightFoot']) {
        if (!previous[name].planted || !current[name].planted) continue;
        for (const axis of ['x', 'y', 'z']) {
          assert.ok(Math.abs(previous[name][axis] - current[name][axis]) < 1e-12,
            `${preset}: ${name}.${axis} slid while planted at ${frame - 1}→${frame}`);
        }
      }
    }
  }
  assert.equal(getPose(12).leftFoot.planted, false);
  assert.equal(getPose(12).rightFoot.planted, true);
  assert.equal(getPose(13).leftFoot.planted, true);
  assert.equal(getPose(13).rightFoot.planted, false);
});

test('all authored support and swing feet stay within the short-legged reach envelope', () => {
  let largestReach = 0;
  for (const preset of PRESETS) {
    for (let frame = 1; frame <= FRAMES; frame += 1) {
      const pose = getPose(frame, preset);
      for (const name of ['leftFoot', 'rightFoot']) {
        const reach = Math.abs(pose[name].x - pose.boopX);
        largestReach = Math.max(largestReach, reach);
        assert.ok(reach <= 0.67,
          `${preset}: ${name} extends ${reach.toFixed(3)} from the body at frame ${frame}`);
      }
    }
  }
  assert.ok(largestReach > 0.6, 'the test must retain the genuinely challenging spacing take');
  assert.ok(Math.abs(getPose(11, 'ease-in').leftFoot.x - getPose(11, 'ease-in').boopX) < 0.63);
});

test('beat seeking, time seeking and independent-frame stepping agree', () => {
  const timeline = makeTimeline({ preset: 'ease-out', hold6: 8, hold18: 12 });
  for (let beat = 0; beat < timeline.totalBeats; beat += 1) {
    assert.equal(frameAtBeat(timeline, beat), timeline.beats[beat]);
    assert.equal(frameAtTime(timeline, (beat + 0.5) * 1000 / FPS), timeline.beats[beat]);
  }
  for (let frame = 1; frame <= FRAMES; frame += 1) assert.equal(frameAtBeat(timeline, beatForFrame(timeline, frame)), frame);
  assert.equal(frameAtTime(timeline, timeline.durationMs), 24);
  assert.equal(frameAtTime(timeline, 1e9), 24);
  assert.equal(frameAtTime(timeline, -500), 1);
  assert.equal(frameAtBeat(timeline, -1), 1);
  assert.equal(frameAtBeat(timeline, 1e6), 24);
  assert.equal(stepFrame(1, -1), 1);
  assert.equal(stepFrame(24, 1), 24);
  assert.equal(stepFrame(6, 1), 7, 'frame stepping skips repeated holds intentionally');
});

test('export snapshots and nested poses cannot change after later edits', () => {
  const config = { preset: 'ease-in', hold6: 3, hold18: 4 };
  const snapshot = makeTimeline(config);
  config.hold6 = 12;
  assert.equal(snapshot.config.hold6, 3);
  assert.equal(snapshot.duration, 43 / 12);
  assert.ok(Object.isFrozen(snapshot));
  assert.ok(Object.isFrozen(snapshot.config));
  assert.ok(Object.isFrozen(snapshot.beats));
  assert.ok(Object.isFrozen(snapshot.segments));
  assert.ok(Object.isFrozen(getPose(9, 'ease-in').leftHand));
  assert.throws(() => { snapshot.beats[0] = 24; }, TypeError);
  assert.throws(() => { getPose(9, 'ease-in').eyes.x = 9; }, TypeError);
});

test('undo and reset restore the real take, holds and duration without phantom history', () => {
  let history = createHistory();
  assert.strictEqual(editHistory(history, DEFAULT_CONFIG), history);
  history = editHistory(history, { preset: 'ease-in' });
  history = editHistory(history, { hold18: 7 });
  assert.equal(makeTimeline(history.current).duration, 43 / 12);
  history = undoHistory(history);
  assert.deepEqual(history.current, { preset: 'ease-in', hold6: 0, hold18: 0 });
  history = resetHistory(history);
  assert.deepEqual(history.current, DEFAULT_CONFIG);
  history = undoHistory(history);
  assert.equal(history.current.preset, 'ease-in', 'reset itself remains undoable');
  let bounded = createHistory();
  for (let i = 0; i < 200; i += 1) bounded = editHistory(bounded, { hold6: i % 13 });
  assert.ok(bounded.undo.length <= 64);
});
