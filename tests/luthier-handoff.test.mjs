import test from 'node:test';
import assert from 'node:assert/strict';
import { soundHole } from '../experiences/luthier/src/model-geometry.ts';
import { portalContour, craftInsideCopy } from '../experiences/luthier/src/handoff.ts';

const contains = (polygon, p) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
};

test('The real f-hole starts registered and covers the viewport before Craft is released', () => {
  const original = soundHole(1).getPoints(12);
  assert.ok(contains(original, {x: .69, y: -.13}), 'Expansion origin must remain inside the actual cut aperture');
  for (const [width, height, scale] of [[1440, 900, 110], [390, 844, 42]]) {
    const project = p => ({x: width * .61 + (p.x - .69) * scale, y: height * .61 - (p.y + .13) * scale});
    const hole = {outline: original.map(project), anchor: project({x: .69, y: -.13})};
    for (const story of [2.5, 2.7, 2.8]) {
      const contour = portalContour(hole, width, height, story);
      contour.forEach((p, i) => assert.ok(Math.hypot(p.x - hole.outline[i].x, p.y - hole.outline[i].y) < 1e-10));
    }
    const complete = portalContour(hole, width, height, 3.14);
    for (let x = 0; x <= width; x += width / 16) for (let y = 0; y <= height; y += height / 16) {
      assert.ok(contains(complete, {x, y}), `Uncovered stage pixel at ${width} x ${height}: ${x}, ${y}`);
    }
    const samples = Array.from({length: 33}, (_, i) => 2.5 + i * .02);
    const forward = samples.map(story => portalContour(hole, width, height, story));
    for (let i = samples.length - 1; i >= 0; i--) assert.deepEqual(portalContour(hole, width, height, samples[i]), forward[i]);
  }
});

test('Craft and Inside retain separate reading priority around a deliberate visual pause', () => {
  assert.equal(craftInsideCopy(2.8).craft, 1);
  assert.equal(craftInsideCopy(2.8295).inside, 0);
  assert.equal(craftInsideCopy(3.1).inside, 1);
  for (let story = 2.5; story <= 3.14; story += .001) {
    const {craft, inside} = craftInsideCopy(story);
    assert.ok(craft >= 0 && craft <= 1 && inside >= 0 && inside <= 1);
    assert.equal(craft * inside, 0, `Two paragraphs compete at ${story}`);
  }
});
