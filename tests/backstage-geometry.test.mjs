import test from 'node:test';
import assert from 'node:assert/strict';
import { createTheatre } from '../experiences/backstage/src/theatre.js';
import { mechanism } from '../experiences/backstage/src/state.js';

// This imports the geometry plan used to construct the real deck meshes.
// It does not initialize WebGL and makes no claim about rendered appearance.
const layout = createTheatre.geometryLayout();
const d = layout.dimensions;
const area = polygon => Math.abs(polygon.reduce((sum, a, i) => {
  const b = polygon[(i + 1) % polygon.length];
  return sum + a[0] * b[1] - b[0] * a[1];
}, 0) / 2);

function within(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a[1] > point[1]) !== (b[1] > point[1]) &&
      point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
const rotate = ([x, z], angle) => [
  x * Math.cos(angle) + z * Math.sin(angle),
  -x * Math.sin(angle) + z * Math.cos(angle),
];
const floorOccupied = point => layout.floor.some(part => within(point, part.polygon));
const deckOccupied = point => layout.deck.some(polygon => within(point, polygon));

test('deck and floor use nondegenerate polygons, with four real deck segments', () => {
  assert.equal(layout.deck.length, 4);
  assert.ok(layout.floor.length > 25, 'each affected plank is cut into real pieces');
  for (const polygon of [...layout.deck, ...layout.floor.map(p => p.polygon)]) {
    assert.ok(area(polygon) > 1e-10);
    assert.ok(polygon.flat().every(Number.isFinite));
  }
  for (const cut of layout.cuts) for (const point of cut) {
    assert.ok(Math.hypot(...point) < d.radius, 'fixed swept cuts stay under the revolve');
  }
});

test('full board width, thickness and sway clear the actual rotating deck slots', () => {
  for (const row of d.rows) for (let i = 0; i <= 40; i++) {
    const x = -row.width / 2 + row.width * i / 40;
    for (const sway of [-d.horizontalTravel, 0, d.horizontalTravel]) {
      for (const z of [-d.boardDepth / 2, 0, d.boardDepth / 2 + .014]) {
        const p = [x + sway, row.z + z];
        assert.ok(!deckOccupied(p), `solid deck intersects wave at ${p}`);
        assert.ok(Math.hypot(...p) < d.radius - .04, 'board/crest clears the continuous rim');
      }
    }
  }
});

test('the static plank openings clear every sampled yaw, not just the endpoint', () => {
  for (const row of d.rows) for (let a = 0; a <= 32; a++) {
    const angle = d.maximumTurn * a / 32;
    for (let i = 0; i <= 24; i++) {
      const x = -row.width / 2 + row.width * i / 24;
      for (const sway of [-d.horizontalTravel, d.horizontalTravel]) {
        for (const z of [-d.boardDepth / 2, d.boardDepth / 2 + .014]) {
          const p = rotate([x + sway, row.z + z], angle);
          assert.ok(!floorOccupied(p), `fixed plank intersects wave at yaw ${angle}: ${p}`);
        }
      }
    }
  }
});

test('guide sliders clear both decks and remain captured throughout lift and sway', () => {
  const sideHalf = d.sliderOuterWidth / 2;
  const back = d.guideZ - d.sliderOuterDepth / 2;
  const front = d.guideZ + d.sliderOuterDepth / 2;
  assert.ok(d.horizontalTravel + d.guideWidth / 2 < d.sliderInnerWidth / 2);
  assert.ok(d.guideWidth < d.sliderInnerDepth);
  for (const row of d.rows) for (const sign of [-1, 1]) {
    const anchor = sign * (row.width / 2 - .3);
    for (const sway of [-d.horizontalTravel, 0, d.horizontalTravel]) {
      for (const x of [anchor + sway - sideHalf, anchor + sway + sideHalf]) {
        for (const z of [back, front]) {
          const p = [x, row.z + z];
          assert.ok(!deckOccupied(p));
          for (let a = 0; a <= 20; a++) assert.ok(!floorOccupied(rotate(p, d.maximumTurn * a / 20)));
        }
      }
    }
  }
  for (let world = 0; world <= 2; world += .005) {
    const m = mechanism(world);
    for (const entry of m.waves) {
      const y = d.parkedY + (d.raisedY - d.parkedY) * entry;
      assert.ok(y + d.boardBottom >= d.baseTop + .075);
      assert.ok(y + d.sliderY - d.sliderHeight / 2 > d.guideBottom);
      assert.ok(y + d.sliderY + d.sliderHeight / 2 < d.guideTop);
    }
  }
});

test('the openings preserve ordinary floor away from the mechanisms', () => {
  for (const p of [[0, -3.2], [0, 3.1], [-4.5, 1.5], [4.5, 1.5]]) assert.ok(floorOccupied(p));
  for (const p of [[0, -2.5], [0, .15], [0, 1.5], [0, 3.0]]) assert.ok(deckOccupied(p));
});
