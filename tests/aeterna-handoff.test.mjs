import test from 'node:test';
import assert from 'node:assert/strict';
import { roomComposition, roomReadingLight } from '../experiences/aeterna/src/handoff.js';

test('all room boundaries have a complete end pose and bounded exposure', () => {
  for (let room = 0; room < 9; room++) {
    let previous = 0;
    for (let step = 0; step <= 2000; step++) {
      const p = step / 2000;
      const frame = roomComposition(room, p, 9);
      assert.ok(frame.mix >= previous && frame.mix <= 1);
      assert.ok(frame.baseText >= 0 && frame.baseText <= 1);
      assert.ok(frame.nextText >= 0 && frame.nextText <= 1);
      assert.ok(frame.pose >= 0 && frame.pose <= 1);
      assert.ok(frame.next === null || frame.next < 9);
      if (frame.mix > 0) assert.equal(frame.pose, 1, 'outgoing pose must be held, never reset during exposure');
      previous = frame.mix;
    }
  }
});

test('the handoff meets the hold and the next room without a velocity step', () => {
  const epsilon = .00001;
  const start = roomComposition(0, .8, 9);
  const entering = roomComposition(0, .8 + epsilon, 9);
  const leaving = roomComposition(0, 1 - epsilon, 9);
  const end = roomComposition(0, 1, 9);
  assert.equal(start.mix, 0);
  assert.equal(end.mix, 1);
  assert.ok((entering.mix - start.mix) / epsilon < .002);
  assert.ok((end.mix - leaving.mix) / epsilon < .002);
  assert.equal(end.nextText, roomComposition(1, 0, 9).baseText);
});

test('reverse, skip and repeated evaluations do not introduce history', () => {
  const path = [.13, .85, .997, .2, .99, .87, .13];
  const before = roomComposition(2, .87, 9);
  for (const p of path) roomComposition(2, p, 9);
  assert.deepEqual(roomComposition(2, .87, 9), before);
  for (const p of [0, .85, 1, NaN, Infinity]) {
    const still = roomComposition(4, p, 9, true);
    assert.equal(still.next, null);
    assert.equal(still.mix, 0);
    assert.equal(still.pose, .45);
  }
  assert.equal(roomComposition(8, 1, 9).next, null);
});

test('fixed navigation reading plates meet every room boundary continuously', () => {
  for (const compact of [false, true]) {
    for (let room = 0; room < 8; room++) {
      const from = roomReadingLight(room, room === 5 ? 1 : 0, compact);
      const to = roomReadingLight(room + 1, 0, compact);
      const end = roomComposition(room, 1 - .00001, 9);
      for (const key of ['header', 'footer', 'light']) {
        const approaching = from[key] + (to[key] - from[key]) * end.mix;
        assert.ok(Math.abs(approaching - to[key]) < 1e-7, `${room}: ${key} must not cut when the chapter number changes`);
      }
    }
  }
});
