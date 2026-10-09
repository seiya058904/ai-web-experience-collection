import test from 'node:test';
import assert from 'node:assert/strict';
import { placeCoordinateAnnotation } from '../experiences/atlas/src/annotation.ts';
const base = () => ({ point: { x: 200, y: 300 }, size: { width: 90, height: 42 },
  viewport: { width: 390, height: 844 }, gap: 16, preferredY: 305,
  headerBottom: 56, footerInset: 124, textRects: [] });
function validPlacement(input, result) {
  assert.equal(result.constrained, false);
  assert.ok(result.left >= 18 && result.left + input.size.width <= input.viewport.width - 18);
  assert.ok(result.top >= Math.max(18, input.headerBottom + 12));
  assert.ok(result.top + input.size.height <= input.viewport.height - input.footerInset);
  for (const r of input.textRects) {
    const separated = result.left >= r.right + 14 || result.left + input.size.width <= r.left - 14 ||
      result.top >= r.bottom + 14 || result.top + input.size.height <= r.top - 14;
    assert.ok(separated, `Label intersects a protected text line: ${JSON.stringify({ result, r })}`);
  }
}

test('ordinary placements keep R7 right/left defaults without mutating the projected point', () => {
  for (const [x, expectedLeft] of [[200, 216], [340, 234]]) {
    const input = base(); input.point.x = x;
    const before = structuredClone(input); Object.freeze(input.point);
    assert.deepEqual(placeCoordinateAnnotation(input), { left: expectedLeft, top: 305, constrained: false });
    assert.deepEqual(input, before);
  }
});

test('approximate retained frame228 geometry reserves the band below the italic line', () => {
  // Original 390x844 image estimates, explicitly not new DOM measurements.
  const input = { ...base(), point: { x: 343, y: 174 }, size: { width: 89, height: 42 }, preferredY: 179,
    textRects: [{ left: 22, top: 137, right: 258, bottom: 174 },
      { left: 22, top: 179, right: 329, bottom: 225 },
      { left: 22, top: 248, right: 195, bottom: 260 }] };
  const result = placeCoordinateAnnotation(input);
  assert.equal(result.left, 238); assert.equal(result.top, 239);
  validPlacement(input, result);
});

test('short-screen footer and text are solved together without clamping back into the title', () => {
  const input = { ...base(), viewport: { width: 844, height: 390 }, point: { x: 350, y: 229 },
    size: { width: 100, height: 58 }, preferredY: 234, headerBottom: 60, footerInset: 105,
    textRects: [{ left: 280, top: 150, right: 650, bottom: 190 },
      { left: 280, top: 245, right: 650, bottom: 267 }] };
  const result = placeCoordinateAnnotation(input);
  assert.equal(result.top, 78); validPlacement(input, result);
});

test('an obstructed column tries the opposite side and impossible space is explicitly reported', () => {
  const input = { ...base(), point: { x: 270, y: 300 },
    textRects: [{ left: 100, top: 0, right: 260, bottom: 844 }] };
  const result = placeCoordinateAnnotation(input);
  assert.equal(result.left, 282); validPlacement(input, result);
  assert.equal(placeCoordinateAnnotation({ ...input,
    textRects: [{ left: 0, top: 0, right: 390, bottom: 844 }] }).constrained, true);
  const fallback = placeCoordinateAnnotation({ ...base(), size: { width: 500, height: 900 } });
  assert.equal(fallback.constrained, true);
  assert.ok(Number.isFinite(fallback.left) && Number.isFinite(fallback.top));
});

test('feasible viewport/crossing cases remain clear and reconstruct identically in reverse', () => {
  const inputs = [];
  for (const [width, height] of [[390, 844], [768, 1024], [844, 390], [1440, 650]])
    for (const x of [24, 110, width * .5, width - 24])
      for (const y of [90, height * .35, height * .7, height - 105])
        inputs.push({ ...base(), point: { x, y }, viewport: { width, height }, preferredY: y + 5,
          textRects: [{ left: 22, top: 100, right: Math.min(width - 22, 360), bottom: 143 },
            { left: 22, top: 148, right: Math.min(width - 22, 420), bottom: 191 }] });
  const forward = inputs.map(input => placeCoordinateAnnotation(input));
  forward.forEach((result, i) => validPlacement(inputs[i], result));
  for (let i = inputs.length - 1; i >= 0; i--)
    assert.deepEqual(placeCoordinateAnnotation(inputs[i]), forward[i]);
});
