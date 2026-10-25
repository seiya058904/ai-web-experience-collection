import test from 'node:test';
import assert from 'node:assert/strict';
import { heightToY } from '../experiences/supercell/src/field.ts';
import { buildProjectedDensity, neighboringContours } from '../experiences/supercell/src/volume.ts';

test('projected density preserves empty sky/ground and exposes bounded structure channels', () => {
  const texture = buildProjectedDensity(0.5, 80, 56);
  assert.equal(texture.data.length, 80 * 56 * 4);
  let visiblePixels = 0;
  for (let y = 0; y < texture.height; y++) {
    for (let x = 0; x < texture.width; x++) {
      const i = (y * texture.width + x) * 4;
      assert.equal(texture.data[i + 3], 255);
      if (texture.data[i] > 0) visiblePixels++;
      if ((y + 0.5) / texture.height > heightToY(0.025) || y === 0) {
        assert.equal(texture.data[i], 0);
        assert.equal(texture.data[i + 1], 0);
        assert.equal(texture.data[i + 2], 128);
      }
    }
  }
  assert.ok(visiblePixels > 500 && visiblePixels < texture.width * texture.height);
  const neighbors = neighboringContours(0.42, 0.5);
  assert.deepEqual(neighbors.map((n) => Math.round(n.height * 100)), [36, 42, 48]);
  assert.ok(neighbors.every((n) => n.contours.some((c) => c.path.length > 0)));
  const edge = neighboringContours(0, 0.5);
  assert.deepEqual(edge.map((n) => n.height), [0, 0.06]);
  assert.ok(edge[0].contours.every((c) => c.path === ''));
});

test('changing shear moves the projected structure and retains deterministic sampling', () => {
  const reference = buildProjectedDensity(0, 80, 56);
  const changed = buildProjectedDensity(1, 80, 56);
  assert.notDeepEqual(reference.data, changed.data);
  assert.deepEqual(changed.data, buildProjectedDensity(1, 80, 56).data);
  // At the main tower's middle height, field mass moves right as shear increases.
  const row = Math.floor(heightToY(0.55) * reference.height);
  const centroid = (data: Uint8Array): number => {
    let mass = 0;
    let weighted = 0;
    for (let x = 0; x < reference.width; x++) {
      const opacity = data[(row * reference.width + x) * 4];
      mass += opacity;
      weighted += opacity * x;
    }
    return weighted / mass;
  };
  assert.ok(centroid(changed.data) - centroid(reference.data) > 2);
});
