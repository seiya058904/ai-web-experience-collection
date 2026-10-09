import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { PRISM, PANE_PLANES, prismHullPlanes, prismBeamPorts } from '../experiences/glasshouse/src/optical-volume.js';
import { isPortraitComposition } from '../experiences/glasshouse/src/framing.js';

const tolerance = 2e-5;
const dot = (plane, p) => plane[0] * p[0] + plane[1] * p[1] + plane[2] * p[2];
function prismGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-PRISM.halfWidth, PRISM.bottom);
  shape.lineTo(PRISM.halfWidth, PRISM.bottom);
  shape.lineTo(0, PRISM.top);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: PRISM.halfDepth * 2, bevelEnabled: true, bevelSegments: 3,
    steps: 1, bevelSize: .052, bevelThickness: .045, curveSegments: 1
  });
  return geometry.translate(0, 0, -PRISM.halfDepth);
}

test('finite prism envelope contains every actual bevel vertex and touches each supporting side', () => {
  const geometry = prismGeometry();
  const positions = geometry.attributes.position;
  const planes = prismHullPlanes(positions.array);
  for (const plane of planes) {
    let closest = Infinity;
    for (let i = 0; i < positions.count; i++) {
      const gap = plane[3] - dot(plane, [positions.getX(i), positions.getY(i), positions.getZ(i)]);
      assert.ok(gap >= -tolerance, `bevel vertex ${i} outside hull: ${gap}`);
      closest = Math.min(closest, gap);
    }
    assert.ok(closest <= tolerance, 'support must come from the actual solid');
  }
  geometry.dispose();
});

test('beam ports remain on opposite real facets over the entire slider range', () => {
  const geometry = prismGeometry();
  const planes = prismHullPlanes(geometry.attributes.position.array);
  let previous;
  for (let angle = -50; angle <= 50; angle++) {
    const ports = prismBeamPorts(angle, planes[0][3]);
    assert.ok(Math.abs(dot(planes[1], ports.entry) - planes[1][3]) < tolerance);
    assert.ok(Math.abs(dot(planes[0], ports.exit) - planes[0][3]) < tolerance);
    assert.ok(ports.exit[0] > ports.entry[0], 'light crosses a nonzero thickness');
    for (const p of [ports.entry, ports.exit]) {
      for (const plane of planes) assert.ok(dot(plane, p) <= plane[3] + tolerance);
    }
    if (previous) {
      for (const side of ['entry', 'exit']) {
        assert.ok(new THREE.Vector3(...ports[side]).distanceTo(new THREE.Vector3(...previous[side])) < .01,
          'one slider degree must not jump across a facet');
      }
    }
    previous = ports;
  }
  assert.deepEqual(prismBeamPorts(-100, planes[0][3]), prismBeamPorts(-50, planes[0][3]));
  assert.deepEqual(prismBeamPorts(100, planes[0][3]), prismBeamPorts(50, planes[0][3]));
  assert.deepEqual(prismBeamPorts(NaN, planes[0][3]), prismBeamPorts(0, planes[0][3]));
  geometry.dispose();
});

test('the morphed pane top envelope contains all rounded vertices at enter, hold and handoff states', () => {
  const geometry = new RoundedBoxGeometry(3, 5, .26, 4, .052);
  const positions = geometry.attributes.position;
  for (const blend of [0, .13, .35, .5, .77, 1]) {
    const planes = PANE_PLANES.map(plane => [...plane]);
    planes[2] = [1.3 * blend, 1, 0, 2.5 - 1.95 * blend];
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
      const originalWedge = -2.5 + (y + 2.5) * (.22 + .78 * (1.5 - x) / 3);
      const p = [x, THREE.MathUtils.lerp(y, originalWedge, blend), z];
      for (const plane of planes) assert.ok(dot(plane, p) <= plane[3] + tolerance);
    }
  }
  geometry.dispose();
});

test('view rays and boundary normals respect the same nonuniform transformed solid', () => {
  const camera = new THREE.PerspectiveCamera(38, 1.6, .15, 150);
  camera.position.set(8.8, .4, 13.8);
  camera.lookAt(.5, .75, -.1);
  camera.updateMatrixWorld();
  for (const scale of [[1, 1, 1], [1.63, 1.02, .5], [.007, 1.16, .46]]) {
    const model = new THREE.Matrix4().compose(new THREE.Vector3(2.9, .45, .1),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(.1, -.52, .43)), new THREE.Vector3(...scale));
    const modelView = new THREE.Matrix4().multiplyMatrices(camera.matrixWorldInverse, model);
    const viewToLocal = modelView.clone().invert();
    const localOrigin = new THREE.Vector3(.15, .3, .13);
    const viewOrigin = localOrigin.clone().applyMatrix4(modelView);
    const viewDirection = new THREE.Vector3(.17, -.11, -.97).normalize();
    const localDirection = viewDirection.clone().applyMatrix3(new THREE.Matrix3().setFromMatrix4(viewToLocal));
    for (const distance of [.08, .26, 1.6, 4]) {
      const fromView = viewOrigin.clone().addScaledVector(viewDirection, distance).applyMatrix4(viewToLocal);
      const fromLocal = localOrigin.clone().addScaledVector(localDirection, distance);
      assert.ok(fromView.distanceTo(fromLocal) < 1e-9);
    }
    // A boundary normal must remain perpendicular to both transformed tangent
    // directions; applying the ray transform to normals would fail on thin cuts.
    const localToView = new THREE.Matrix3().setFromMatrix4(modelView);
    const localNormalToView = new THREE.Matrix3().setFromMatrix4(viewToLocal).transpose();
    for (const normal of [[1, 0, 0], [0, 0, 1], [1.3, 1, 0]]) {
      const n = new THREE.Vector3(...normal).normalize();
      const axis = Math.abs(n.x) < .8 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      const tangent = new THREE.Vector3().crossVectors(n, axis).normalize();
      const bitangent = new THREE.Vector3().crossVectors(n, tangent).normalize();
      const viewNormal = n.clone().applyMatrix3(localNormalToView).normalize();
      assert.ok(Math.abs(viewNormal.dot(tangent.applyMatrix3(localToView))) < 1e-9);
      assert.ok(Math.abs(viewNormal.dot(bitangent.applyMatrix3(localToView))) < 1e-9);
      assert.ok(viewNormal.toArray().every(Number.isFinite));
    }
  }
});

test('portrait framing uses aspect without applying the phone budget to desktop landscapes', () => {
  const cases = [[390, 844, true], [768, 1024, true], [844, 390, false],
    [1024, 768, false], [1100, 1100, true], [1101, 1101, false],
    [1440, 650, false], [3840, 2160, false]];
  for (const [w, h, expected] of cases) assert.equal(isPortraitComposition(w, h), expected, `${w}×${h}`);
});
