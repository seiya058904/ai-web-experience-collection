import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createState, chooseReturn, setComparison, seekReplay, advanceReplay,
  persistedState, MAIN_RALLY_ID, MAX_REPLAY_FRAME_DELTA,
} from '../experiences/rally/src/state.ts';
import type { StoryState } from '../experiences/rally/src/state.ts';
import { branches, bContact, sampleReplay, mainRallyPreset } from '../experiences/rally/src/physics.ts';

test('new state starts at the fixed main rally with default choices, paused and muted', () => {
  assert.deepEqual(createState(), {
    comparisonSpinPreset: 'topspin', mainRallyPreset: 'a-to-b-topspin',
    returnChoice: 'crosscourt', storyProgress: 0, replayTime: 0,
    playing: false, view: 'A', motion: 'system', sound: false,
  });
  assert.equal(MAIN_RALLY_ID, mainRallyPreset.id);
  assert.ok(Object.isFrozen(createState()));
});

test('saved choices restore independently, but playback, audio, and main override do not', () => {
  const state = createState({
    version: 1, comparisonSpinPreset: 'none', mainRallyPreset: 'failed-comparison',
    returnChoice: 'line', storyProgress: 0.84, replayTime: 0.91,
    playing: true, sound: true, view: 'B', motion: 'reduced',
  });
  assert.deepEqual(state, {
    comparisonSpinPreset: 'none', mainRallyPreset: MAIN_RALLY_ID,
    returnChoice: 'line', storyProgress: 0.84, replayTime: 0.91,
    playing: false, sound: false, view: 'B', motion: 'reduced',
  });
});

test('spin comparison changes exactly one field during an active return replay', () => {
  const state: StoryState = { ...createState({ returnChoice: 'line', storyProgress: 0.82, replayTime: 1 }), playing: true, sound: true };
  const after = setComparison(state, 'none');
  assert.deepEqual(after, { ...state, comparisonSpinPreset: 'none' });
  assert.equal(state.comparisonSpinPreset, 'topspin');
  assert.equal(after.mainRallyPreset, MAIN_RALLY_ID);
  assert.strictEqual(setComparison(after, 'none'), after);
});

test('a changed return immediately invalidates the old replay and restarts at the shared B contact', () => {
  const state: StoryState = { ...createState({ comparisonSpinPreset: 'none', storyProgress: 0.82, replayTime: 1.7, view: 'B', motion: 'reduced' }), playing: true, sound: true };
  const after = chooseReturn(state, 'line');
  assert.deepEqual(after, { ...state, returnChoice: 'line', replayTime: 0, playing: false });
  assert.equal(state.replayTime, 1.7);
  assert.equal(state.playing, true);
  const frame = sampleReplay(after.returnChoice, after.replayTime);
  assert.deepEqual({ x: frame.ball.x, y: frame.ball.y, z: frame.ball.z }, bContact);
  assert.equal(frame.event.id, 'b-strike');
});

test('re-selecting the current return preserves the existing replay', () => {
  const state: StoryState = { ...createState({ replayTime: 0.8 }), playing: true };
  assert.strictEqual(chooseReturn(state, 'crosscourt'), state);
  assert.equal(chooseReturn(state, 'crosscourt').replayTime, 0.8);
});

test('seeking pauses, clamps to the selected branch, and preserves other preferences', () => {
  const state: StoryState = { ...createState({ returnChoice: 'line', comparisonSpinPreset: 'none', view: 'B' }), playing: true };
  const mid = seekReplay(state, 0.75);
  assert.deepEqual(mid, { ...state, replayTime: 0.75, playing: false });
  assert.equal(seekReplay(state, Infinity).replayTime, branches.line.duration);
  assert.equal(seekReplay(state, -10).replayTime, 0);
  assert.equal(seekReplay(state, NaN).replayTime, 0);
  assert.equal(state.playing, true);
});

test('playback advances only when active and stops exactly at its own branch end', () => {
  const paused = createState({ returnChoice: 'line', replayTime: 0.5 });
  assert.strictEqual(advanceReplay(paused, 0.016), paused);
  const playing: StoryState = { ...paused, playing: true };
  assert.equal(advanceReplay(playing, 0.016).replayTime, 0.516);
  const nearEnd: StoryState = { ...playing, replayTime: branches.line.duration - 0.02 };
  assert.deepEqual(advanceReplay(nearEnd, 0.05), { ...nearEnd, replayTime: branches.line.duration, playing: false });
  assert.equal(nearEnd.playing, true);
});

test('large background gaps are bounded; invalid or reverse deltas do not move the playhead', () => {
  const state: StoryState = { ...createState({ replayTime: 0.5 }), playing: true };
  assert.equal(advanceReplay(state, 120).replayTime, 0.5 + MAX_REPLAY_FRAME_DELTA);
  for (const delta of [0, -1, NaN, Infinity, -Infinity]) assert.strictEqual(advanceReplay(state, delta), state);
  assert.equal(advanceReplay(state, 120).playing, true);
});

test('persisted records contain only allowed durable fields and round-trip safely through JSON', () => {
  const state: StoryState = { ...createState({ returnChoice: 'line', comparisonSpinPreset: 'none', storyProgress: 0.9, replayTime: 1.1, view: 'B', motion: 'reduced' }), playing: true, sound: true };
  const saved = persistedState(state);
  assert.deepEqual(Object.keys(saved).sort(), ['version', 'comparisonSpinPreset', 'returnChoice', 'storyProgress', 'replayTime', 'view', 'motion'].sort());
  assert.equal('sound' in saved, false);
  assert.equal('playing' in saved, false);
  assert.equal('mainRallyPreset' in saved, false);
  assert.deepEqual(createState(JSON.stringify(saved)), { ...state, playing: false, sound: false });
});

test('corrupt saved fields are rejected independently while finite positions are clamped', () => {
  const state = createState({ comparisonSpinPreset: 'none', returnChoice: 'missing', storyProgress: 800, replayTime: -4, view: 'b', motion: 'fast', playing: 'true', sound: true });
  assert.deepEqual(state, { ...createState(), comparisonSpinPreset: 'none', storyProgress: 1 });
  const invalidNumbers = createState({ returnChoice: 'line', storyProgress: Infinity, replayTime: { value: 1 }, view: 'B', motion: 'reduced' });
  assert.deepEqual(invalidNumbers, { ...createState(), returnChoice: 'line', view: 'B', motion: 'reduced' });
  assert.equal(createState({ returnChoice: 'line', replayTime: 100 }).replayTime, branches.line.duration);
  assert.equal(createState({ storyProgress: -2 }).storyProgress, 0);
});

test('malformed JSON, arrays, primitives, and unknown storage versions fall back to defaults', () => {
  for (const saved of ['{bad json', 'null', '[1,2,3]', 1, false, null, [], { version: 2, returnChoice: 'line' }]) {
    assert.deepEqual(createState(saved), createState());
  }
  assert.deepEqual(createState('{"__proto__":{"sound":true},"returnChoice":"line"}'), { ...createState(), returnChoice: 'line' });
});
