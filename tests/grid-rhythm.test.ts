import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTER_RHYTHM, TOTAL_TRAVEL, coordinateToTravel, travelToCoordinate } from '../experiences/grid/src/rhythm.ts';
import { toolbarPresentation } from '../experiences/grid/src/toolbar.ts';

test('all twelve chapter anchors and fractional positions survive the physical scroll mapping', () => {
  assert.equal(CHAPTER_RHYTHM.length, 12);
  assert.ok(TOTAL_TRAVEL < 3.9 * 11);
  for (let i = 0; i <= 11000; i++) {
    const coordinate = i / 1000;
    assert.ok(Math.abs(travelToCoordinate(coordinateToTravel(coordinate)) - coordinate) < 1e-10);
    if (i) assert.ok(coordinateToTravel(coordinate) > coordinateToTravel(coordinate - .001));
  }
  assert.equal(travelToCoordinate(-1), 0);
  assert.equal(travelToCoordinate(TOTAL_TRAVEL + 1), 11);
});

test('shorter reading holds preserve the original authored handoff travel and experiment room', () => {
  for (let i = 0; i < 11; i++) {
    assert.ok(Math.abs(coordinateToTravel(i + 1) - coordinateToTravel(i + .36) - 3.9 * .64) < 1e-10);
  }
  for (const index of [8, 9]) {
    assert.ok(Math.abs(coordinateToTravel(index + .36) - coordinateToTravel(index) - 3.9 * .36) < 1e-10);
  }
  assert.ok(CHAPTER_RHYTHM[2].reading < CHAPTER_RHYTHM[5].reading);
});

test('experiment exits have continuous, reversible intermediate visibility at the audited boundaries', () => {
  for (const chapter of [8, 9] as const) {
    const states = [.34, .35, .36, .37, .38].map(local => toolbarPresentation(chapter + local, chapter, false));
    assert.ok(states.every(state => !state.hidden && state.opacity > 0 && state.opacity < 1));
    for (let i = 1; i < states.length; i++) assert.ok(states[i].opacity < states[i - 1].opacity);
    assert.deepEqual([...states].reverse(), [.38, .37, .36, .35, .34].map(local => toolbarPresentation(chapter + local, chapter, false)));
    assert.equal(toolbarPresentation(chapter + .47, chapter, false).hidden, true);
  }
});

test('control ownership grants bounded grace and gives up interaction before disappearing', () => {
  const grace = toolbarPresentation(8.38, 8, true);
  assert.equal(grace.opacity, 1);
  assert.equal(grace.interactive, true);
  const leaving = toolbarPresentation(8.54, 8, true);
  assert.ok(leaving.opacity > 0);
  assert.equal(leaving.interactive, false);
  assert.equal(leaving.hidden, false);
  assert.equal(toolbarPresentation(8.57, 8, true).hidden, true);
  assert.equal(toolbarPresentation(9, 8, true).interactive, false);
  assert.equal(toolbarPresentation(8, 8, false, true).opacity, 1);
});
