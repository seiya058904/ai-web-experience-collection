import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Euler, Quaternion, Vector3, Vector4 } from 'three';
import { refractRay, traceConvexRay } from '../experiences/facet/src/scene/optics.ts';
import { createBrilliantCut, createStepCut, disposeGemGeometry } from '../experiences/facet/src/scene/gemGeometry.ts';

const cube = () => [
  new Vector4(1, 0, 0, 1), new Vector4(-1, 0, 0, 1),
  new Vector4(0, 1, 0, 1), new Vector4(0, -1, 0, 1),
  new Vector4(0, 0, 1, 1), new Vector4(0, 0, -1, 1),
];
const close = (actual: number, expected: number, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} ≈ ${expected}`);
const vectorClose = (actual: Vector3, expected: Vector3, tolerance = 1e-9) => assert.ok(actual.distanceTo(expected) < tolerance, `${actual.toArray()} ≈ ${expected.toArray()}`);

test('normal incidence remains straight and refraction does not mutate caller vectors', () => {
  const direction = new Vector3(0, -1, 0);
  const normal = new Vector3(0, 1, 0);
  const refracted = refractRay(direction, normal, 1 / 2.417);
  assert.ok(refracted);
  vectorClose(refracted, direction);
  vectorClose(direction, new Vector3(0, -1, 0));
  vectorClose(normal, new Vector3(0, 1, 0));
  assert.notEqual(refracted, direction);
});

test('oblique refraction obeys Snell’s law and is reversible', () => {
  const theta = 35 * Math.PI / 180;
  const ior = 1.76;
  const incident = new Vector3(Math.sin(theta), -Math.cos(theta), 0);
  const normal = new Vector3(0, 1, 0);
  const transmitted = refractRay(incident, normal, 1 / ior);
  assert.ok(transmitted);
  close(transmitted.length(), 1);
  close(ior * Math.abs(transmitted.x), Math.sin(theta));
  assert.ok(Math.abs(transmitted.x) < Math.abs(incident.x), 'entering the denser medium bends toward the normal');
  const reversed = refractRay(transmitted.clone().negate(), normal.clone().negate(), ior);
  assert.ok(reversed);
  vectorClose(reversed, incident.clone().negate());
});

test('the critical angle separates transmission from total internal reflection', () => {
  const ior = 2.417;
  const criticalAngle = Math.asin(1 / ior);
  const normal = new Vector3(0, -1, 0);
  const rayAt = (angle: number) => new Vector3(Math.sin(angle), Math.cos(angle), 0);
  const below = refractRay(rayAt(criticalAngle - 1e-5), normal, ior);
  assert.ok(below, 'a ray just below the critical angle escapes');
  close(below.length(), 1);
  assert.equal(refractRay(rayAt(criticalAngle + 1e-5), normal, ior), null, 'a ray above the critical angle undergoes TIR');
});

test('parallel entry and exit faces preserve the outgoing direction and create the correct lateral shift', () => {
  const origin = new Vector3(-0.7, 0, 3);
  const direction = new Vector3(0.3, 0, -1).normalize();
  const ior = 1.5;
  const planes = cube();
  const originalPlanes = planes.map((plane) => plane.toArray());
  const path = traceConvexRay(origin, direction, planes, ior);
  assert.equal(path.exited, true);
  assert.equal(path.internalReflections, 0);
  assert.equal(path.points.length, 3);
  vectorClose(path.direction, direction);
  close(path.points[1].z, 1);
  close(path.points[2].z, -1);
  const insideAngle = Math.asin(direction.x / ior);
  close(path.points[2].x - path.points[1].x, 2 * Math.tan(insideAngle));
  vectorClose(origin, new Vector3(-0.7, 0, 3));
  assert.deepEqual(planes.map((plane) => plane.toArray()), originalPlanes);
});

test('a side-wall TIR obeys specular reflection before a later exit', () => {
  const incident = new Vector3(0.35, 0, -1).normalize();
  const path = traceConvexRay(new Vector3(0.1, 0, 3), incident, cube(), 1.5, 8);
  assert.equal(path.exited, true);
  assert.equal(path.internalReflections, 1);
  assert.equal(path.points.length, 4);
  close(path.points[1].z, 1, 1e-8);
  close(path.points[2].x, 1, 1e-8);
  close(path.points[3].z, -1, 1e-8);
  const incoming = path.points[2].clone().sub(path.points[1]).normalize();
  const reflected = path.points[3].clone().sub(path.points[2]).normalize();
  close(reflected.x, -incoming.x);
  close(reflected.z, incoming.z);
  vectorClose(path.direction, new Vector3(-incident.x, incident.y, incident.z));
});

test('a finite bounce budget stops a trapped ray cleanly and an outside miss creates no false entry', () => {
  const limited = traceConvexRay(new Vector3(0.1, 0, 3), new Vector3(0.35, 0, -1), cube(), 1.5, 1);
  assert.equal(limited.exited, false);
  assert.equal(limited.internalReflections, 1);
  assert.equal(limited.points.length, 3);
  close(limited.direction.length(), 1);
  const missed = traceConvexRay(new Vector3(3, 3, 3), new Vector3(0, 0, -1), cube(), 1.5);
  assert.equal(missed.exited, false);
  assert.equal(missed.points.length, 1);
  assert.equal(missed.internalReflections, 0);
});

test('ray paths are independent of plane order and transform consistently with a rotated optical solid', () => {
  const origin = new Vector3(0.1, 0, 3);
  const direction = new Vector3(0.35, 0, -1);
  const planes = cube();
  const reference = traceConvexRay(origin, direction, planes, 1.5);
  const reordered = traceConvexRay(origin, direction, [...planes].reverse(), 1.5);
  assert.equal(reordered.points.length, reference.points.length);
  reordered.points.forEach((point, index) => vectorClose(point, reference.points[index]));
  vectorClose(reordered.direction, reference.direction);

  const rotation = new Quaternion().setFromEuler(new Euler(0.35, 0.6, -0.2));
  const rotatedPlanes = planes.map((plane) => {
    const normal = new Vector3(plane.x, plane.y, plane.z).applyQuaternion(rotation);
    return new Vector4(normal.x, normal.y, normal.z, plane.w);
  });
  const rotated = traceConvexRay(origin.clone().applyQuaternion(rotation), direction.clone().applyQuaternion(rotation), rotatedPlanes, 1.5);
  assert.equal(rotated.exited, reference.exited);
  assert.equal(rotated.internalReflections, reference.internalReflections);
  assert.equal(rotated.points.length, reference.points.length);
  rotated.points.forEach((point, index) => vectorClose(point, reference.points[index].clone().applyQuaternion(rotation)));
  vectorClose(rotated.direction, reference.direction.clone().applyQuaternion(rotation));
});

test('rays through the rendered brilliant stay within the optical hull between boundary contacts', () => {
  const cut = createBrilliantCut();
  let exits = 0;
  let reflections = 0;
  try {
    for (const x of [-0.35, 0.08, 0.37]) for (const z of [-0.31, 0.11, 0.34]) {
      const path = traceConvexRay(new Vector3(0, 3, 0), new Vector3(x, -3, z), cut.planes, 2.417, 12);
      exits += Number(path.exited);
      reflections += path.internalReflections;
      close(path.direction.length(), 1);
      assert.ok(path.points.every((point) => point.toArray().every(Number.isFinite)));
      for (let index = 1; index < path.points.length; index += 1) {
        const point = path.points[index];
        const distances = cut.planes.map((plane) => plane.x * point.x + plane.y * point.y + plane.z * point.z - plane.w);
        assert.ok(distances.every((distance) => distance <= 1e-7), 'boundary contact belongs to the convex hull');
        assert.ok(distances.some((distance) => Math.abs(distance) < 1e-7), 'contact is on an actual facet plane');
        if (index > 1) {
          const midpoint = point.clone().add(path.points[index - 1]).multiplyScalar(0.5);
          assert.ok(cut.planes.every((plane) => plane.x * midpoint.x + plane.y * midpoint.y + plane.z * midpoint.z <= plane.w + 1e-7), 'the interior segment does not escape between contacts');
        }
      }
    }
    assert.ok(exits > 0, 'the diamond returns light through a real exit');
    assert.ok(reflections > 0, 'the diamond also exercises total internal reflection');
  } finally { disposeGemGeometry(cut); }
});

test('the step-cut table and culet transmit a central normal-incidence ray', () => {
  const cut = createStepCut();
  try {
    const path = traceConvexRay(new Vector3(0, 2, 0), new Vector3(0, -1, 0), cut.planes, 1.768);
    assert.equal(path.exited, true);
    assert.equal(path.internalReflections, 0);
    assert.equal(path.points.length, 3);
    vectorClose(path.direction, new Vector3(0, -1, 0));
    close(path.points[1].y - path.points[2].y, cut.height);
  } finally { disposeGemGeometry(cut); }
});
