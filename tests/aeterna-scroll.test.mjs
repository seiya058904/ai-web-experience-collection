import test from 'node:test';
import assert from 'node:assert/strict';
import { createScrollTimeline } from '../experiences/aeterna/src/scroll.js';

function fixture(run) {
  const previous = { document: globalThis.document, window: globalThis.window };
  const stops = [2.4, 2.2, 2.2, 2.6, 2.2, 2.4, 2.2, 2.2, 2].map((length, index) => ({
    dataset: { length: String(length) }, style: {},
    get offsetTop() { return stops.slice(0, index).reduce((sum, stop) => sum + parseFloat(stop.style.height), 0); },
  }));
  globalThis.document = {
    querySelectorAll: () => stops,
    documentElement: { get scrollHeight() { return stops.reduce((sum, stop) => sum + parseFloat(stop.style.height), 0); } },
  };
  globalThis.window = {
    innerWidth: 1440, innerHeight: 900, scrollY: 0,
    scrollTo({ top }) { this.scrollY = top; },
  };
  const lenis = {
    resize() {},
    scrollTo(top) { window.scrollTo({ top }); },
    isStopped: false,
    stop() {},
    start() {},
  };
  try { run(createScrollTimeline(lenis), stops); }
  finally {
    if (previous.document === undefined) delete globalThis.document;
    else globalThis.document = previous.document;
    if (previous.window === undefined) delete globalThis.window;
    else globalThis.window = previous.window;
  }
}

test('all nine measured rooms and the final document bottom remain reachable', () => fixture((timeline) => {
  timeline.measure();
  for (let index = 0; index < 9; index++) {
    timeline.goTo(index, .61);
    const state = timeline.snapshot();
    assert.equal(state.index, index);
    assert.ok(Math.abs(state.progress - .61) < 1e-12);
  }
  timeline.goTo(8, 1);
  assert.equal(timeline.snapshot().progress, 1);
  assert.equal(timeline.snapshot().overall, 1);
}));

test('arbitrary forward and reverse jumps produce the same room state', () => fixture((timeline) => {
  timeline.measure();
  const states = new Map();
  for (const index of [0, 5, 2, 8, 4, 7, 3, 1, 6]) {
    timeline.goTo(index, .37);
    states.set(index, timeline.snapshot());
  }
  for (const index of [6, 1, 3, 7, 4, 8, 2, 5, 0]) {
    timeline.goTo(index, .37);
    assert.deepEqual(timeline.snapshot(), states.get(index));
  }
  window.scrollY = -100;
  assert.equal(timeline.snapshot().y, 0);
  window.scrollY = 1e9;
  assert.equal(timeline.snapshot().overall, 1);
}));

test('remeasuring a phone or reduced edition preserves normalized reading position', () => fixture((timeline) => {
  timeline.measure();
  timeline.goTo(5, .73);
  const before = timeline.snapshot();
  window.innerWidth = 390;
  window.innerHeight = 844;
  for (const reduced of [false, true]) {
    timeline.measure(reduced);
    timeline.goTo(before.index, before.progress);
    const after = timeline.snapshot();
    assert.equal(after.index, before.index);
    assert.ok(Math.abs(after.progress - before.progress) < 1e-12);
    assert.equal(after.width, 390);
    assert.equal(after.height, 844);
  }
}));
