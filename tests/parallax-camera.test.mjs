import test from 'node:test';
import assert from 'node:assert/strict';
import {
  samplePath, DESKTOP_CAMERA_PATH, MOBILE_CAMERA_PATH, alignmentInfluence,
  ALIGNMENT_CAMERA, ALIGNMENT_TARGET, MOBILE_ALIGNMENT_CAMERA, MOBILE_ALIGNMENT_TARGET,
} from '../experiences/parallax/src/spatial-math.js';
import { scrollFromProgress } from '../experiences/parallax/src/timeline.js';

const subtract = (a, b) => a.map((value, i) => value - b[i]);
const length = vector => Math.hypot(...vector);
function direction(pose) {
  const vector = subtract(pose.target, pose.position), reach = length(vector);
  return vector.map(value => value / reach);
}
const derivative = (a, b, step) => subtract(b, a).map(value => value / step);
const angle = (a, b) => Math.acos(Math.min(1, Math.max(-1, a.reduce((sum, value, i) => sum + value * b[i], 0)))) * 180 / Math.PI;
function boundaryVelocity(read, progress, side, step = 1e-5) {
  const at = read(progress), full = read(progress + side * step), half = read(progress + side * step / 2);
  // A one-sided first difference includes O(step) curvature. Extrapolate its
  // limit so C1 is tested independently of the permitted change in curvature.
  return full.map((value, i) => 2 * (half[i] - at[i]) / (side * step / 2) - (value - at[i]) / (side * step));
}

for (const [name, path, camera, target] of [
  ['desktop', DESKTOP_CAMERA_PATH, ALIGNMENT_CAMERA, ALIGNMENT_TARGET],
  ['portrait', MOBILE_CAMERA_PATH, MOBILE_ALIGNMENT_CAMERA, MOBILE_ALIGNMENT_TARGET],
]) {
  test(`${name} camera keeps the exact alignment and complete membrane destination`, () => {
    assert.deepEqual(samplePath(path, 2).position, [...camera]);
    assert.deepEqual(samplePath(path, 2).target, [...target]);
    const membrane = path.find(stop => stop.at === 5);
    assert.deepEqual(samplePath(path, 5).position, membrane.position);
    for (let i = 0; i < 3; i++) assert.ok(Math.abs(samplePath(path, 5).target[i] - membrane.target[i]) < 1e-12);
    assert.equal(membrane.through, undefined, 'the chapter destination is a resting pose');
  });

  test(`${name} passage crosses the sculpture plane before leaving its narrow aperture`, () => {
    assert.ok(samplePath(path, 4.19).position[2] > 0);
    assert.equal(samplePath(path, 4.2).position[2], 0);
    assert.ok(samplePath(path, 4.21).position[2] < 0);
    for (let p = 4.12; p <= 4.30; p += 0.001) {
      const [x, y, z] = samplePath(path, p).position;
      if (z > -1.5) {
        assert.ok(Math.abs(x) < 0.25, `camera starts its side exit before clearing the frame at ${p}`);
        assert.ok(Math.abs(y) < 0.15);
      }
    }
    assert.ok(samplePath(path, 4.30).position[2] < -2.2);
  });

  test(`${name} camera passes through intermediate waypoints with continuous velocity`, () => {
    for (const stop of path.filter(stop => stop.through)) {
      const readPosition = p => samplePath(path, p).position;
      const left = boundaryVelocity(readPosition, stop.at, -1), right = boundaryVelocity(readPosition, stop.at, 1);
      assert.ok(length(subtract(left, right)) < 1e-5, `position velocity changes abruptly at ${stop.at}`);
      const readDirection = p => direction(samplePath(path, p));
      const leftDirection = boundaryVelocity(readDirection, stop.at, -1), rightDirection = boundaryVelocity(readDirection, stop.at, 1);
      assert.ok(length(subtract(leftDirection, rightDirection)) < 1e-5, `view velocity changes abruptly at ${stop.at}`);
      const readFov = p => [samplePath(path, p).fov];
      const leftFov = boundaryVelocity(readFov, stop.at, -1), rightFov = boundaryVelocity(readFov, stop.at, 1);
      assert.ok(length(subtract(leftFov, rightFov)) < 1e-5, `field of view changes abruptly at ${stop.at}`);
    }
    const step = 1e-6;
    assert.ok(length(derivative(samplePath(path, 4.2).position, samplePath(path, 4.2 + step).position, step)) > 10,
      'crossing the plane must not brake to a stop');
  });

  test(`${name} middle path stays within its corridor and avoids the old whip-pan`, () => {
    const step = 0.0005;
    let peakAngularSpeed = 0, peakPositionSpeed = 0;
    for (let i = 1; i < path.length; i++) {
      const previous = path[i - 1], next = path[i];
      if (next.at < 3 || previous.at >= 5) continue;
      for (let p = previous.at; p <= next.at; p += step) {
        const pose = samplePath(path, p);
        assert.ok([...pose.position, ...pose.target, pose.fov].every(Number.isFinite));
        for (let axis = 0; axis < 3; axis++) {
          const low = Math.min(previous.position[axis], next.position[axis]) - 1e-10;
          const high = Math.max(previous.position[axis], next.position[axis]) + 1e-10;
          assert.ok(pose.position[axis] >= low && pose.position[axis] <= high, 'a spline overshoot can enter the sculpture');
        }
        assert.ok(length(subtract(pose.target, pose.position)) >= 6, 'look-at point approaches the camera');
        if (p >= 3 && p < 5) {
          const after = samplePath(path, p + step);
          peakAngularSpeed = Math.max(peakAngularSpeed, angle(direction(pose), direction(after)) / step);
          peakPositionSpeed = Math.max(peakPositionSpeed, length(subtract(after.position, pose.position)) / step);
        }
      }
    }
    // The delivered exit peaked at 2934 degrees/progress, and position speed
    // at 106.6 desktop / 154.3 portrait, before any scroll travel weighting.
    assert.ok(peakAngularSpeed < 550, `rift turn remains too abrupt: ${peakAngularSpeed}`);
    // Portrait uses a wider return arc so the sculpture enters as a complete
    // object above its caption. Keep the raw travel below the supplied peak;
    // the following test also bounds its actual document-distance rate.
    assert.ok(peakPositionSpeed < (name === 'desktop' ? 75 : 150), `exit travel remains too fast: ${peakPositionSpeed}`);
  });

  test(`${name} middle camera speed is bounded by actual viewport scroll travel`, () => {
    const height = name === 'desktop' ? 900 : 844;
    const span = Math.round(height * (name === 'desktop' ? 1.60 : 1.38));
    const step = 0.0005;
    let peakPositionPerViewport = 0, peakDegreesPerViewport = 0;
    for (let p = 3; p < 5; p += step) {
      const before = samplePath(path, p), after = samplePath(path, p + step);
      const travel = (scrollFromProgress(p + step, span) - scrollFromProgress(p, span)) / height;
      peakPositionPerViewport = Math.max(peakPositionPerViewport, length(subtract(after.position, before.position)) / travel);
      peakDegreesPerViewport = Math.max(peakDegreesPerViewport, angle(direction(before), direction(after)) / travel);
    }
    // Baseline peaks were 66.6 / 111.8 units and 1833.8 / 2126.1 degrees per
    // viewport. These bounds retain room for the larger portrait framing arc.
    assert.ok(peakPositionPerViewport < (name === 'desktop' ? 30 : 55));
    assert.ok(peakDegreesPerViewport < 170);
  });

  test(`${name} poses are reversible and independent of previous visits`, () => {
    const snapshot = JSON.stringify(path);
    const positions = Array.from({ length: 301 }, (_, i) => i * 9 / 300);
    const forward = positions.map(p => samplePath(path, p));
    const backward = [...positions].reverse().map(p => samplePath(path, p)).reverse();
    assert.deepEqual(backward, forward);
    samplePath(path, 9); samplePath(path, 0);
    assert.deepEqual(samplePath(path, positions[148]), forward[148]);
    assert.equal(JSON.stringify(path), snapshot, 'sampling mutates the authored camera path');
  });
}

test('alignment pointer and lock influence enter smoothly while retaining an exact plateau', () => {
  for (const p of [1.55, 1.75, 2, 2.35]) assert.equal(alignmentInfluence(p), 1);
  assert.equal(alignmentInfluence(1.30), 0);
  assert.equal(alignmentInfluence(2.60), 0);
  for (const p of [1.30, 1.55, 2.35, 2.60]) {
    const step = 1e-6;
    const left = (alignmentInfluence(p) - alignmentInfluence(p - step)) / step;
    const right = (alignmentInfluence(p + step) - alignmentInfluence(p)) / step;
    assert.ok(Math.abs(left - right) < 0.0001);
  }
});
