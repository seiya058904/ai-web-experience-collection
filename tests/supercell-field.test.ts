import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cloudCenter, rainCenter, density, deformation, flowPoint, contourSegments,
  sampleSlice, heightToY, yToHeight, sectionPoint, updraftExists, sectionFlow,
  DEFAULT_HEIGHT, DEFAULT_SHEAR,
} from '../experiences/supercell/src/field.ts';

test('density is bounded, finite, and empty beyond the modeled cloud', () => {
  for (const u of [0, 0.5, 1]) {
    for (const h of [0.01, 0.12, 0.42, 0.75, 0.9, 0.995]) {
      const slice = sampleSlice(h, u, 35, 20);
      for (const value of slice.values) assert.ok(Number.isFinite(value) && value >= 0 && value <= 1);
      if (h < 0.025 || h > 0.985) assert.equal(Math.max(...slice.values), 0);
    }
  }
  const core = cloudCenter(DEFAULT_HEIGHT, DEFAULT_SHEAR);
  assert.ok(density(core.x, DEFAULT_HEIGHT, core.z, DEFAULT_SHEAR) > 0.65);
});

test('one normalized height has one plane coordinate and matching section core', () => {
  for (const h of [0, 0.17, 0.42, 0.76, 1]) {
    assert.ok(Math.abs(yToHeight(heightToY(h)) - h) < 1e-12);
    for (const u of [0, 0.5, 1]) {
      const center = cloudCenter(h, u);
      const section = sectionPoint(center);
      assert.ok(Math.abs(section.x / 400 - center.x) < 1e-12);
      assert.ok(Math.abs(section.y / 220 - 0.5 - center.z) < 1e-12);
    }
  }
});

test('shear changes tower tilt and precipitation separation rather than only color', () => {
  const low = cloudCenter(0.15, 0);
  const high = cloudCenter(0.85, 0);
  const lowChanged = cloudCenter(0.15, 1);
  const highChanged = cloudCenter(0.85, 1);
  assert.ok(highChanged.x - lowChanged.x > high.x - low.x);
  const separation = (u: number) => rainCenter(0.42, u).x - cloudCenter(0.42, u).x;
  assert.ok(separation(1) > separation(0));
  assert.notEqual(cloudCenter(0.42, 0).z, cloudCenter(0.42, 1).z);
});

test('photographic reference deformation is zero and the horizon stays fixed', () => {
  for (let x = 0; x <= 1; x += 0.05) {
    for (const y of [0.1, 0.3, 0.6, 0.865]) assert.equal(deformation(x, y, DEFAULT_SHEAR), 0);
    for (const u of [0, 0.5, 1]) assert.ok(Math.abs(deformation(x, 0.865, u)) < 1e-12);
  }
  assert.ok(deformation(0.65, heightToY(0.8), 1) > deformation(0.65, heightToY(0.2), 1));
});

test('single parcel path remains continuous through spline joins and conditions', () => {
  for (const u of [0, 0.5, 1]) {
    assert.equal(flowPoint(0, u).x, 0.35);
    assert.equal(flowPoint(0, u).h, -0.08);
    assert.ok(Math.abs(flowPoint(1, u).h - 0.86) < 1e-12);
    for (let i = 1; i <= 6; i++) {
      const a = flowPoint(i / 7 - 1e-6, u);
      const b = flowPoint(i / 7 + 1e-6, u);
      assert.ok(Math.hypot(a.x - b.x, a.h - b.h, a.z - b.z) < 0.00001);
    }
  }
});

test('contours are deterministic, respond to height/shear, and clear on empty sections', () => {
  const reference = contourSegments(0.42, 0.5, 40, 24);
  assert.deepEqual(reference, contourSegments(0.42, 0.5, 40, 24));
  assert.ok(reference.some((contour) => contour.path.length > 0));
  assert.notDeepEqual(reference, contourSegments(0.8, 0.5, 40, 24));
  assert.notDeepEqual(reference, contourSegments(0.42, 1, 40, 24));
  assert.ok(contourSegments(0, 0.5).every((contour) => contour.path === ''));
  assert.ok(contourSegments(1, 0.5).every((contour) => contour.path === ''));
  assert.equal(updraftExists(0.42), true);
  assert.equal(updraftExists(0.96), false);
});

test('section flow is a deterministic finite crossing of the existing parcel path', () => {
  for (const h of [0.13, 0.2, 0.42, 0.7, 0.879]) {
    for (const u of [0, 0.5, 1]) {
      const flow = sectionFlow(h, u);
      assert.ok(flow);
      assert.deepEqual(flow, sectionFlow(h, u));
      assert.ok(Object.values(flow).every(Number.isFinite));
      const parcel = flowPoint(flow.t, u);
      assert.ok(Math.abs(parcel.h - h) < 1e-8);
      assert.equal(parcel.x, flow.x);
      assert.equal(parcel.z, flow.z);
      assert.ok(Math.abs(Math.hypot(flow.dx, flow.dz) - 1) < 1e-12);
    }
  }
  for (const h of [0, 0.12, 0.88, 0.98, 1, Number.NaN]) assert.equal(sectionFlow(h, 0.5), null);
});

test('section flow exposes both the position and direction response to shear', () => {
  const a = sectionFlow(0.42, 0);
  const b = sectionFlow(0.42, 1);
  assert.ok(a && b);
  assert.ok(Math.hypot(b.x - a.x, b.z - a.z) > 0.02);
  assert.ok(a.dx * b.dx + a.dz * b.dz < 0.98);
});
