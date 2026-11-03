import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  PRESETS, RE_KM, RIBBONS, activity, altitudeToScreen, cameraAt, coupling, describeSky, dynamicPressure, elevationAt, flaring,
  geoMatrix, magnetopause, ovalBand, ovalLatitude, projectPoint, sceneAt, skyState, standoff, writeRibbons,
} from '../experiences/aurora/src/model.js';

const close = (a, b, tolerance = 1e-6) => assert.ok(Math.abs(a - b) <= tolerance, `${a} is not within ${tolerance} of ${b}`);

test('the magnetopause follows Shue et al. (1998)', () => {
  close(dynamicPressure(5, 400), 1.33808, 1e-4);
  close(standoff(0, 1), 10.22 + 1.29 * Math.tanh(0.184 * 8.14));
  close(flaring(0, 1), 0.58);
  assert.ok(standoff(-10, 2) < standoff(5, 2), 'A southward field erodes the boundary');
  assert.ok(standoff(0, 8) < standoff(0, 2), 'More pressure pushes the boundary in');
  close(magnetopause(0, 10, 0.6), 10);
  assert.ok(magnetopause(Math.PI / 2, 10, 0.6) > magnetopause(0.5, 10, 0.6), 'The boundary flares toward the tail');
});

test('coupling opens only when the wind field turns south', () => {
  assert.ok(coupling(500, -10) > coupling(500, 0));
  assert.ok(coupling(500, 0) > coupling(500, 10));
  assert.ok(coupling(800, -10) > coupling(400, -10));
  assert.ok(activity(PRESETS.calm.speed, PRESETS.calm.bz) < activity(PRESETS.active.speed, PRESETS.active.bz));
  assert.ok(activity(PRESETS.active.speed, PRESETS.active.bz) < activity(PRESETS.storm.speed, PRESETS.storm.bz));
  assert.ok(activity(5000, -500) <= 9);
  assert.ok(activity(280, 10) >= 0);
});

test('the oval follows the Kp latitude table and moves toward the equator with activity', () => {
  close(ovalLatitude(0), 66);
  close(ovalLatitude(5), 56.3);
  close(ovalLatitude(9), 48);
  close(ovalLatitude(4.5), (58.3 + 56.3) / 2);
  close(ovalLatitude(20), 48);
  for (let k = 0; k < 9; k += 0.25) assert.ok(ovalLatitude(k + 0.25) < ovalLatitude(k));
  const midnight = ovalBand(5, 0);
  const noon = ovalBand(5, 12);
  assert.ok(noon.equator > midnight.equator, 'The oval sits nearer the pole at noon');
  assert.ok(noon.pole - noon.equator < midnight.pole - midnight.equator, 'The oval thins toward noon');
});

test('sky geometry is honest about the horizon', () => {
  close(elevationAt(1e-9, 105), Math.PI / 2, 1e-5);
  close(elevationAt(Math.acos(RE_KM / (RE_KM + 105)), 105), 0, 1e-9);
  const kp = 5;
  const edge = ovalBand(kp, 0).equator;
  assert.equal(skyState(edge + 1, kp).code, 'overhead');
  assert.equal(skyState(edge - 1, kp).code, 'high');
  assert.equal(skyState(edge - 5, kp).code, 'low');
  const redOnly = skyState(edge - 13, kp);
  assert.equal(redOnly.code, 'edge');
  assert.ok(redOnly.base < 0 && redOnly.top > 0);
  const dark = skyState(edge - 25, kp);
  assert.equal(dark.code, 'hidden');
  assert.match(describeSky(dark), /below your horizon/);
  assert.equal(skyState(ovalBand(kp, 0).pole + 3, kp).direction, 'south');
  assert.match(describeSky(skyState(ovalBand(kp, 0).pole + 3, kp)), /to the south/);
});

test('the film is a continuous, reversible function of scroll', () => {
  const keys = ['sky', 'pitch', 'halfHeight', 'distance', 'dive', 'tilt', 'focusX', 'diagram', 'ring', 'lift'];
  for (const aspect of [16 / 9, 390 / 844]) {
    assert.equal(sceneAt(0, aspect).sky, 1);
    assert.equal(sceneAt(0.3, aspect).sky, 0);
    assert.equal(sceneAt(1, aspect).sky, 1);
    let last = sceneAt(0, aspect);
    for (let i = 1; i <= 2000; i += 1) {
      const scene = sceneAt(i / 2000, aspect);
      for (const key of keys) {
        const span = key === 'pitch' ? 2 : key === 'distance' ? Math.max(last.distance * 0.06, 0.01) : key === 'halfHeight' ? Math.max(last.halfHeight * 0.06, 0.01) : key === 'lift' ? Math.max(last.lift * 0.06, 0.01) : key === 'focusX' ? 0.15 : 0.05;
        assert.ok(Math.abs(scene[key] - last[key]) < span, `${key} jumps at ${i / 2000}`);
      }
      last = scene;
    }
    assert.deepEqual(sceneAt(0.456, aspect), sceneAt(0.456, aspect));
  }
});

test('the camera keeps the Sun on screen left and magnetic north up', () => {
  const scene = sceneAt(0.3, 16 / 9);
  const cam = cameraAt(scene);
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  close(dot(cam.right, cam.up), 0, 1e-9);
  close(dot(cam.fwd, cam.up), 0, 1e-9);
  const earth = projectPoint(cam, [0, 0, 0], 1600, 900);
  assert.ok(projectPoint(cam, [5, 0, 0], 1600, 900).x < earth.x);
  assert.ok(projectPoint(cam, [0, 0, 5], 1600, 900).y < earth.y);
  assert.equal(projectPoint(cam, cam.pos.map((v, i) => v - cam.fwd[i]), 1600, 900), null);
  const near = cameraAt(sceneAt(0.66, 16 / 9), 60);
  close(dot(near.right, near.up), 0, 1e-9);
});

test('the Earth rotation places the geomagnetic pole correctly', () => {
  const m = geoMatrix(1.2);
  const pole = [m[6], m[7], m[8]];
  close(Math.asin(pole[2]) * 180 / Math.PI, 80.7, 1e-4);
  close(Math.atan2(pole[1], pole[0]) * 180 / Math.PI, -72.7, 1e-4);
  const a = [m[0], m[1], m[2]];
  close(Math.hypot(...a), 1, 1e-6);
  close(a[0] * pole[0] + a[1] * pole[1] + a[2] * pole[2], 0, 1e-6);
});

test('the ruler rises with altitude', () => {
  const low = altitudeToScreen(100, 400, 30, 900, 1.8);
  const high = altitudeToScreen(300, 400, 30, 900, 1.8);
  assert.ok(high < low);
});

test('ribbons are deterministic, finite and brighter with activity', async () => {
  const size = RIBBONS.width * RIBBONS.count * 4;
  const a = writeRibbons(new Float32Array(size), 12.5, 4);
  const b = writeRibbons(new Float32Array(size), 12.5, 4);
  assert.deepEqual(a, b);
  assert.ok(a.every(Number.isFinite));
  const total = (data) => data.reduce((sum, value, i) => (i % 4 === 1 ? sum + value : sum), 0);
  assert.ok(total(writeRibbons(new Float32Array(size), 12.5, 8)) > total(writeRibbons(new Float32Array(size), 12.5, 1)));
  const shaders = await readFile(new URL('../experiences/aurora/src/shaders.js', import.meta.url), 'utf8');
  assert.ok(shaders.includes(`const float SPAN=${RIBBONS.spanKm}.;`), 'Shader and model must agree on the ribbon span');
});
