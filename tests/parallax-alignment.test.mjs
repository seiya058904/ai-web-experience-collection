import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createFragmentSpecs } from '../experiences/parallax/src/model.js';
import {
  scaleAboutCamera, ALIGNMENT_CAMERA, ALIGNMENT_TARGET,
  MOBILE_ALIGNMENT_CAMERA, MOBILE_ALIGNMENT_TARGET,
} from '../experiences/parallax/src/spatial-math.js';

function cameraAt(position, target, aspect = 16 / 9) {
  const camera = new THREE.PerspectiveCamera(34, aspect, 0.06, 130);
  camera.position.fromArray(position);
  camera.lookAt(...target);
  camera.updateMatrixWorld(true);
  return camera;
}

function vertices() {
  return createFragmentSpecs().flatMap((spec) => spec.polygon.flatMap(([x, y]) =>
    [-spec.depth / 2, spec.depth / 2].map((z) => ({ point: [x, y, z], scale: spec.rayScale }))));
}

for (const [name, position, target] of [
  ['desktop', ALIGNMENT_CAMERA, ALIGNMENT_TARGET],
  ['mobile', MOBILE_ALIGNMENT_CAMERA, MOBILE_ALIGNMENT_TARGET],
]) {
  test(`ray-separated fragments preserve their perspective silhouette at the ${name} alignment camera`, () => {
    const camera = cameraAt(position, target, name === 'mobile' ? 390 / 844 : 16 / 9);
    let changedDepth = 0;
    for (const { point, scale } of vertices()) {
      const original = new THREE.Vector3(...point).project(camera);
      const transformedPoint = scaleAboutCamera(point, position, scale);
      const separated = new THREE.Vector3(...transformedPoint).project(camera);
      assert.ok(Math.abs(original.x - separated.x) < 1e-11);
      assert.ok(Math.abs(original.y - separated.y) < 1e-11);
      if (Math.abs(original.z - separated.z) > 1e-7) changedDepth++;
    }
    assert.ok(changedDepth > 100, 'fragments really occupy different projected depths');
  });
}

test('a moved viewpoint reveals separation instead of preserving a flat overlay', () => {
  const moved = [...ALIGNMENT_CAMERA];
  moved[0] += 0.8;
  const camera = cameraAt(moved, ALIGNMENT_TARGET);
  let greatestDifference = 0;
  for (const { point, scale } of vertices()) {
    const original = new THREE.Vector3(...point).project(camera);
    const separated = new THREE.Vector3(...scaleAboutCamera(point, ALIGNMENT_CAMERA, scale)).project(camera);
    greatestDifference = Math.max(greatestDifference, Math.hypot(original.x - separated.x, original.y - separated.y));
  }
  assert.ok(greatestDifference > 0.005, 'a new viewpoint must visibly change the alignment');
});
