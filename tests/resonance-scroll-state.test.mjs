import test from "node:test";
import assert from "node:assert/strict";
import { locateScene, panelOpacity, scrollPositionFor } from "../experiences/resonance/src/scroll-state.js";

// Deliberately unequal chapter sizes exercise mappings independently of one CSS layout.
const layouts = [
  { name: "desktop", offsets: [0, 1180, 2750, 4280, 6020, 7450, 9020, 10490], viewport: 900, height: 12680 },
  { name: "mobile", offsets: [0, 1050, 2430, 3610, 4950, 6420, 7810, 9230], viewport: 844, height: 11164 },
  { name: "4K", offsets: [0, 2430, 5340, 7950, 10800, 13480, 16400, 19410], viewport: 2160, height: 24460 },
];
const at = (y, layout = layouts[0]) => locateScene(y, layout.offsets, layout.viewport, layout.height);
const position = (raw, layout = layouts[0]) => scrollPositionFor(raw, layout.offsets, layout.viewport, layout.height);
const near = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance, `Expected ${actual} to be within ${tolerance} of ${expected}.`);

function assertBounded(state) {
  for (const [key, value] of Object.entries(state)) assert.ok(Number.isFinite(value), `${key} must stay finite.`);
  assert.ok(state.raw >= 0 && state.raw <= 8);
  assert.ok(state.scene >= 0 && state.scene <= 7);
  assert.ok(Number.isInteger(state.act) && state.act >= 0 && state.act <= 7);
  assert.ok(state.blend >= 0 && state.blend <= 1);
  assert.ok(state.ending >= 0 && state.ending <= 1);
}

test("all eight chapter starts map to their own scene at every supported layout", () => {
  for (const layout of layouts) {
    layout.offsets.forEach((offset, index) => {
      const state = at(offset, layout);
      assert.equal(state.raw, index, `${layout.name}: logical position at chapter ${index}.`);
      assert.equal(state.scene, index);
      assert.equal(state.act, index);
      assert.equal(state.blend, 0);
      assert.equal(state.ending, 0);
    });
  }
});

test("a full scroll sweep stays bounded, monotonic, and visits all eight acts", () => {
  for (const layout of layouts) {
    const seen = new Set();
    const maxScroll = layout.height - layout.viewport;
    let previous = at(-layout.viewport, layout);
    for (let step = 0; step <= 4000; step++) {
      const y = -layout.viewport + step / 4000 * (maxScroll + 2 * layout.viewport);
      const state = at(y, layout);
      assertBounded(state);
      assert.ok(state.raw >= previous.raw, "Forward scrolling must not rewind logical position.");
      assert.ok(state.scene >= previous.scene, "Forward scrolling must not reverse the scene handoff.");
      assert.ok(state.act >= previous.act, "Active chapters must not move backward during a forward sweep.");
      assert.ok(state.ending >= previous.ending, "The final release must not rewind during a forward sweep.");
      if (state.scene < 7) assert.equal(state.ending, 0);
      seen.add(state.act);
      previous = state;
    }
    assert.deepEqual([...seen], [0, 1, 2, 3, 4, 5, 6, 7]);
  }
});

test("chapter boundaries and intermediate handoffs are continuous", () => {
  for (const layout of layouts) {
    for (let step = 0; step <= 128; step++) {
      const raw = step / 16;
      const y = position(raw, layout);
      const before = at(y - 0.001, layout);
      const after = at(y + 0.001, layout);
      assert.ok(Math.abs(after.scene - before.scene) < 0.0001, `A scene jump occurred near logical position ${raw}.`);
      assert.ok(Math.abs(after.raw - before.raw) < 0.0001);
      assert.ok(Math.abs(after.ending - before.ending) < 0.0001);
    }
  }
});

test("reversing or randomly scrubbing restores the same complete narrative state", () => {
  const layout = layouts[0];
  const positions = Array.from({ length: 257 }, (_, index) => position(index / 32, layout));
  const forward = positions.map(y => at(y, layout));
  for (let index = positions.length - 1; index >= 0; index--) assert.deepEqual(at(positions[index], layout), forward[index]);
  // A fixed permutation visits every sample once, without relying on a random seed.
  for (let index = 0; index < positions.length; index++) {
    const scrambled = (index * 101) % positions.length;
    assert.deepEqual(at(positions[scrambled], layout), forward[scrambled]);
  }
});

test("each readable hold remains on its chapter while native scroll continues", () => {
  for (const layout of layouts) {
    for (let index = 0; index < 7; index++) {
      let previousRaw = index;
      for (const fraction of [0.1, 0.25, 0.4]) {
        const state = at(position(index + fraction, layout), layout);
        assert.equal(state.scene, index);
        assert.equal(state.act, index);
        assert.equal(state.blend, 0);
        assert.equal(panelOpacity(state.scene, index), 1);
        assert.ok(state.raw > previousRaw, "Reading holds must not freeze logical scroll progress.");
        previousRaw = state.raw;
      }
    }
  }
});

test("every nonfinal stage has a real fractional handoff before the next chapter", () => {
  for (const layout of layouts) {
    for (let index = 0; index < 7; index++) {
      const transition = at(position(index + 0.8, layout), layout);
      assert.ok(transition.scene > index && transition.scene < index + 1);
      assert.ok(transition.blend > 0 && transition.blend < 1);
      assert.equal(at(layout.offsets[index + 1], layout).scene, index + 1);
    }
  }
});

test("the final scene completes its ending at the document bottom and remains stable beyond it", () => {
  for (const layout of layouts) {
    const finalStart = at(position(7, layout), layout);
    const finalMiddle = at(position(7.65, layout), layout);
    const bottom = at(layout.height - layout.viewport, layout);
    const overscroll = at(layout.height + 10000, layout);
    assert.equal(finalStart.ending, 0);
    assert.ok(finalMiddle.ending > 0 && finalMiddle.ending < 1);
    assert.equal(finalMiddle.scene, 7);
    assert.equal(bottom.raw, 8);
    assert.equal(bottom.scene, 7);
    assert.equal(bottom.act, 7);
    assert.equal(bottom.ending, 1);
    assert.deepEqual(overscroll, bottom);
  }
});

test("negative, overscrolled, and nonfinite scroll inputs cannot escape the narrative bounds", () => {
  for (const layout of layouts) {
    const beginning = at(0, layout);
    const ending = at(layout.height - layout.viewport, layout);
    for (const y of [-1, -10000, -Infinity, Infinity, NaN]) {
      const state = at(y, layout);
      assertBounded(state);
      assert.deepEqual(state, beginning);
    }
    assert.deepEqual(at(Number.MAX_SAFE_INTEGER, layout), ending);
    assert.equal(position(-100, layout), layout.offsets[0]);
    assert.equal(position(100, layout), layout.height - layout.viewport);
  }
});

test("resize roundtrips preserve logical position, scene, and ending across different geometries", () => {
  const rawPositions = [0, 0.01, 0.3, 0.54, 0.95, 1, 1.125, 2.49, 3.8, 4, 4.99, 5.7, 6.99, 7, 7.15, 7.5, 7.99, 8];
  for (const raw of rawPositions) {
    const reference = at(position(raw, layouts[0]), layouts[0]);
    near(reference.raw, raw);
    for (const layout of layouts.slice(1)) {
      const resizedScrollY = position(reference.raw, layout);
      const resized = at(resizedScrollY, layout);
      near(resized.raw, raw);
      near(resized.scene, reference.scene);
      near(resized.ending, reference.ending);
      assert.equal(resized.act, reference.act);
      const restored = at(position(resized.raw, layouts[0]), layouts[0]);
      near(restored.raw, reference.raw);
      near(restored.scene, reference.scene);
    }
  }
});

test("panel opacity is bounded, symmetric, and fades away without leaking unrelated chapters", () => {
  for (let index = 0; index < 8; index++) {
    assert.equal(panelOpacity(index, index), 1);
    assert.equal(panelOpacity(index + 1, index), 0);
    assert.equal(panelOpacity(index - 1, index), 0);
    let previous = 1;
    for (let step = 0; step <= 100; step++) {
      const distance = step / 100;
      const positive = panelOpacity(index + distance, index);
      const negative = panelOpacity(index - distance, index);
      assert.ok(positive >= 0 && positive <= 1);
      assert.ok(positive <= previous + 1e-12, "A departing chapter must not reappear during its fade.");
      near(positive, negative);
      previous = positive;
    }
  }
});

test("an unmeasured or single-section document yields a safe initial state", () => {
  const expected = { raw: 0, scene: 0, act: 0, blend: 0, ending: 0 };
  assert.deepEqual(locateScene(500, [], 900, 900), expected);
  assert.deepEqual(locateScene(500, [0], 900, 2000), expected);
});
