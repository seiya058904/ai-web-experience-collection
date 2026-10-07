import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  AXIS_LIMITS, CONTENT_KEYS, SCENES, interpolate, layout, refine, resolve, sanitizeAxes,
} from '../experiences/grid/src/scenes.ts';
import { colorMix, cssColor, personality } from '../experiences/grid/src/math.ts';

const EXPECTED_CONTENT = ['title', 'subtitle', 'number', 'image', 'body', 'meta', 'place', 'action', 'mark'];
const READABLE_PARTS = ['subtitle', 'body', 'meta', 'place', 'action'];
const FINAL_CONTENT = EXPECTED_CONTENT.filter((key) => key !== 'mark');
const VIEWPORTS = [
  { w: 390, h: 844, mobile: true },
  { w: 768, h: 1024, mobile: false },
  { w: 1024, h: 768, mobile: false },
  { w: 1440, h: 900, mobile: false },
  { w: 1920, h: 1080, mobile: false },
  { w: 2560, h: 1440, mobile: false },
  { w: 3840, h: 2160, mobile: false },
];
const makeStates = (view) => SCENES.map((_, index) => layout(index, view));
const label = (view) => `${view.w}×${view.h}`;

test('Raw timing preserves its prepared position when the fast movement begins', () => {
  assert.equal(personality(6, 0), 0);
  assert.equal(personality(6, 1), 1);
  const before = personality(6, .2 - 1e-7);
  const after = personality(6, .2 + 1e-7);
  assert.ok(after >= before && after - before < .00001, 'The preparation and cut join continuously');
  let previous = 0;
  for (let step = 0; step <= 1000; step++) {
    const value = personality(6, step / 1000);
    assert.ok(value >= previous && value <= 1, 'Forward scroll does not briefly reverse the Raw transition');
    previous = value;
  }
});

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

function assertRgb(value, context) {
  assert.equal(value.length, 3, `${context}: three channels`);
  for (const channel of value) {
    assert.ok(Number.isFinite(channel), `${context}: channel is finite`);
    assert.ok(channel >= 0 && channel <= 255, `${context}: ${channel} is within [0, 255]`);
  }
}

function renderedRgb(value) {
  const match = /^rgb\((\d+) (\d+) (\d+)\)$/.exec(cssColor(value));
  assert.ok(match, 'The renderer supplies an ordinary RGB color');
  return match.slice(1).map(Number);
}

// Independent normal-text contrast check on the rounded colors sent to CSS.
function textContrast(first, second) {
  const luminance = (color) => color.reduce((sum, value, index) => {
    const channel = value / 255;
    const linear = channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    return sum + linear * [0.2126, 0.7152, 0.0722][index];
  }, 0);
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function assertAxesWithinLimits(axes, context) {
  assert.deepEqual(Object.keys(axes).sort(), ['opsz', 'slnt', 'wdth', 'wght']);
  for (const [key, [minimum, maximum]] of Object.entries(AXIS_LIMITS)) {
    assert.ok(Number.isFinite(axes[key]), `${context}: ${key} is finite`);
    assert.ok(axes[key] >= minimum && axes[key] <= maximum, `${context}: ${key}=${axes[key]} is within the font's supported range`);
  }
}

function arbitraryCoordinates() {
  const points = [0, 0.36, 0.360001, 1, 3.82, 4.68, 7.68, 8, 8.72, 9, 9.18, 9.36, 10, 10.72, 11];
  let seed = 20261007;
  for (let index = 0; index < 32; index += 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    points.push((seed / 2 ** 32) * 11);
  }
  return points;
}

test('Twelve distinct systems retain the same nine content identities at every target size', () => {
  assert.equal(SCENES.length, 12);
  assert.equal(new Set(SCENES.map((scene) => scene.slug)).size, 12);
  assert.deepEqual([...CONTENT_KEYS].sort(), [...EXPECTED_CONTENT].sort());
  for (const view of VIEWPORTS) {
    const states = makeStates(view);
    for (const [index, state] of states.entries()) {
      assert.deepEqual(Object.keys(state.parts).sort(), [...EXPECTED_CONTENT].sort(), `${label(view)} / ${SCENES[index].slug}`);
      for (const [key, part] of Object.entries(state.parts)) {
        for (const [property, value] of Object.entries(part)) {
          assert.ok(Number.isFinite(value), `${label(view)} / ${index} / ${key}.${property} is finite`);
        }
        assert.ok(part.w > 0 && part.h > 0, `${label(view)} / ${index} / ${key} has positive geometry`);
      }
    }
  }
});

for (const view of VIEWPORTS) {
  test(`Reading copy and action stay within the canvas envelope at ${label(view)}`, () => {
    const states = makeStates(view);
    // A small envelope allows the existing action's touch area to extend past a
    // baseline. This is not a text-fit or screenshot test; browser QA covers both.
    const toleranceX = Math.max(1, view.w * 0.02);
    const toleranceY = Math.max(1, view.h * 0.02);
    for (const [index, state] of states.entries()) {
      for (const key of READABLE_PARTS) {
        const part = state.parts[key];
        const context = `${SCENES[index].slug} / ${key}`;
        for (const property of ['x', 'y', 'w', 'h', 'size', 'leading']) {
          assert.ok(Number.isFinite(part[property]), `${context}: ${property} is finite`);
        }
        assert.ok(part.w > 0 && part.h > 0 && part.size > 0 && part.leading > 0, `${context}: text has usable geometry`);
        assert.ok(part.x >= -toleranceX && part.y >= -toleranceY, `${context}: starts within canvas envelope`);
        assert.ok(part.x + part.w <= view.w + toleranceX, `${context}: right edge ${part.x + part.w} exceeds ${view.w + toleranceX}`);
        assert.ok(part.y + part.h <= view.h + toleranceY, `${context}: bottom edge ${part.y + part.h} exceeds ${view.h + toleranceY}`);
      }
    }
  });

  test(`Arbitrary jumps and reverse traversal return exact states at ${label(view)}`, () => {
    const states = makeStates(view);
    const coordinates = arbitraryCoordinates();
    const canonical = new Map(coordinates.map((point) => [point, resolve(point, states)]));
    const traversal = [
      ...coordinates,
      ...coordinates.toReversed(),
      ...coordinates.filter((_, index) => index % 2 === 0),
      ...coordinates.filter((_, index) => index % 2 === 1).toReversed(),
      ...coordinates,
    ];
    for (const point of traversal) {
      assert.deepEqual(resolve(point, states), canonical.get(point), `Returning to p=${point} is independent of travel history`);
    }
  });
}

test('Integer scene coordinates and bounded endpoints preserve the intended compositions', () => {
  assert.equal(SCENES[0].slug, 'zero');
  assert.equal(SCENES[11].slug, 'no-grid');
  for (const view of VIEWPORTS) {
    const states = makeStates(view);
    for (let index = 0; index < states.length; index += 1) {
      const atScene = resolve(index, states);
      assert.deepEqual(atScene.parts, states[index].parts, `${label(view)}: p=${index} has that scene's content composition`);
      assert.deepEqual(atScene.paper, states[index].paper);
      assert.deepEqual(atScene.axes, states[index].axes);
    }
    assert.deepEqual(resolve(-12, states), resolve(0, states));
    assert.deepEqual(resolve(42, states), resolve(11, states));
    assert.deepEqual(resolve(11, states), states[11]);
  }
});

test('Synthesis to No Grid removes guides without moving any of the eight core content boxes', () => {
  for (const view of VIEWPORTS) {
    const states = makeStates(view);
    const settled = resolve(10, states);
    let previousGuide = settled.guide;
    for (const point of [10, 10.18, 10.36, 10.50, 10.72, 10.90, 11]) {
      const state = resolve(point, states);
      for (const key of FINAL_CONTENT) {
        assert.deepEqual(state.parts[key], settled.parts[key], `${label(view)} / p=${point} / ${key}: guide removal has no positional side effect`);
      }
      assert.deepEqual(state.paper, settled.paper);
      assert.equal(state.cropX, settled.cropX);
      assert.equal(state.cropY, settled.cropY);
      assert.equal(state.zoom, settled.zoom);
      assert.ok(state.guide >= 0 && state.guide <= previousGuide, 'Guides only recede during the final handoff');
      previousGuide = state.guide;
    }
    assert.equal(resolve(11, states).guide, 0);
  }
});

test('Variable-axis ranges agree with the bundled font provenance, not CSS simulation', async () => {
  const provenance = JSON.parse(await readFile(new URL('../public/grid/licenses/ASSET-PROVENANCE.json', import.meta.url), 'utf8'));
  const font = provenance.assets.find((asset) => asset.file.endsWith('/RobotoFlex-Latin.woff2'));
  assert.ok(font?.axes?.length, 'The bundled variable font records its actual axes');
  const declaredRanges = Object.fromEntries(font.axes.map((axis) => [axis.tag, [axis.minimum, axis.maximum]]));
  assert.deepEqual(AXIS_LIMITS, declaredRanges);
  assert.deepEqual(Object.keys(declaredRanges).sort(), ['opsz', 'slnt', 'wdth', 'wght']);
});

test('Invalid user axis values are finite and clamped; missing overrides retain defaults', () => {
  const defaults = { wght: 500, wdth: 100, slnt: -2, opsz: 72 };
  assert.deepEqual(sanitizeAxes({}, defaults), defaults);
  for (const [key, [minimum, maximum]] of Object.entries(AXIS_LIMITS)) {
    assert.equal(sanitizeAxes({ [key]: minimum - 100 }, defaults)[key], minimum, `${key}: lower clamp`);
    assert.equal(sanitizeAxes({ [key]: maximum + 100 }, defaults)[key], maximum, `${key}: upper clamp`);
    const midpoint = (minimum + maximum) / 2;
    const result = sanitizeAxes({ [key]: midpoint }, defaults);
    assert.equal(result[key], midpoint, `${key}: an in-range input remains exact`);
    for (const other of Object.keys(defaults).filter((axis) => axis !== key)) {
      assert.equal(result[other], defaults[other], `${key}: omitted ${other} is retained`);
    }
    for (const invalid of [NaN, Infinity, -Infinity, null, 'not-a-number']) {
      assertAxesWithinLimits(sanitizeAxes({ [key]: invalid }, defaults), `${key}: ${String(invalid)}`);
    }
  }
});

test('Variable overrides stay within real axis limits through holds, handoffs and reduced motion', () => {
  const states = makeStates(VIEWPORTS[0]);
  const overrides = deepFreeze({ wght: 90000, wdth: -90000, slnt: NaN, opsz: Infinity });
  for (const reduced of [false, true]) {
    for (const point of [8, 8.9, 9, 9.12, 9.36, 9.54, 9.80, 10, 11]) {
      assertAxesWithinLimits(resolve(point, states, overrides, undefined, reduced).axes, `p=${point}, reduced=${reduced}`);
    }
  }
});

test('Body text retains at least 4.5:1 contrast in stable scenes and sampled handoffs', () => {
  const points = new Set([0, 11, 7.68]);
  for (let index = 0; index < 11; index += 1) {
    for (const local of [0, 0.12, 0.36, 0.38, 0.42, 0.48, 0.56, 0.60, 0.64, 0.68, 0.72, 0.80, 0.90, 0.98]) {
      points.add(index + local);
    }
  }
  for (const view of [VIEWPORTS[0], VIEWPORTS[3]]) {
    const states = makeStates(view);
    for (const point of points) {
      const state = resolve(point, states);
      const ink = renderedRgb(state.ink);
      const paper = renderedRgb(state.paper);
      const ratio = textContrast(ink, paper);
      assert.ok(ratio >= 4.5, `${label(view)} / p=${point}: body contrast ${ratio.toFixed(6)}:1; ink=${ink}; paper=${paper}`);
    }
  }
});

test('Color interpolation remains finite and in gamut even when positional easing overshoots', () => {
  for (const view of [VIEWPORTS[0], VIEWPORTS[3]]) {
    const states = makeStates(view);
    for (let index = 0; index < states.length - 1; index += 1) {
      const a = states[index];
      const b = states[index + 1];
      for (const point of [-0.25, 0, 0.1, 0.5, 0.65, 0.72, 0.8, 1, 1.25]) {
        const state = interpolate(a, b, point, index + 1);
        for (const property of ['paper', 'ink', 'accent']) {
          assertRgb(state[property], `${index}→${index + 1} / t=${point} / ${property}`);
          assertRgb(renderedRgb(state[property]), 'Serialized color');
        }
      }
      for (const point of [0, 0.1, 0.5, 0.9, 1]) {
        const value = colorMix(a.paper, b.paper, point);
        assertRgb(value, 'Paper color interpolation');
        value.forEach((channel, component) => {
          assert.ok(channel >= Math.min(a.paper[component], b.paper[component]) && channel <= Math.max(a.paper[component], b.paper[component]), 'A blended channel stays between its endpoints');
        });
      }
    }
  }
});

test('Refinement, interpolation and resolution never mutate or alias their source states', () => {
  const states = deepFreeze(makeStates(VIEWPORTS[3]));
  const snapshot = structuredClone(states);
  const overrides = deepFreeze({ wght: 730, wdth: 86, slnt: -4, opsz: 110 });
  const overrideSnapshot = structuredClone(overrides);
  for (let index = 0; index < states.length - 1; index += 1) {
    const output = interpolate(states[index], states[index + 1], 0.72, index + 1);
    assert.notStrictEqual(output.parts, states[index].parts);
    for (const key of EXPECTED_CONTENT) assert.notStrictEqual(output.parts[key], states[index].parts[key]);
    output.parts.body.x += 123;
    output.paper[0] = 0;
  }
  refine(states[9], 9, 0.2, overrides);
  for (const point of arbitraryCoordinates()) resolve(point, states, overrides, states[8]);
  assert.deepEqual(states, snapshot, 'Source scene definitions remain reusable in either scroll direction');
  assert.deepEqual(overrides, overrideSnapshot, 'Caller-owned overrides remain untouched');
});
