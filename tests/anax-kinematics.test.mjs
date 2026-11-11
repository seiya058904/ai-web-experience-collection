import test from 'node:test';
import assert from 'node:assert/strict';
import {
  rocker, leverRate, leverPeakRate, meshAngle, evalTrack, journeyProgress, journeyTime, crankSpeed,
} from '../experiences/anax/src/kinematics.js';
import {
  LINK, GEAR, PLANET, HEAD_RATIO, MOTOR, SPEED, STAGES, pitchRadius,
} from '../experiences/anax/src/spec.js';

const close = (a, b, tolerance = 1e-9) => assert.ok(Math.abs(a - b) <= tolerance, `${a} is not within ${tolerance} of ${b}`);
const turn = (i, n = 720) => (i / n) * Math.PI * 2;

test('the connecting rod and rocker lever keep their length at every crank angle', () => {
  for (let i = 0; i < 720; i += 1) {
    const { pz, py, qz, qy, beta } = rocker(turn(i));
    close(Math.hypot(qz - pz, qy - py), LINK.rod);
    close(Math.hypot(qz - LINK.hz, qy - LINK.hy), LINK.arm);
    assert.ok(Number.isFinite(beta), `beta is not finite at step ${i}`);
  }
});

test('the lever rate never exceeds the published peak', () => {
  const peak = leverPeakRate();
  assert.ok(peak > 0);
  for (let i = 0; i < 720; i += 1) assert.ok(Math.abs(leverRate(turn(i))) <= peak + 1e-6, `rate above peak at step ${i}`);
});

test('gear pairs sit at their true centre distance and the planetary stage assembles evenly', () => {
  close(pitchRadius(GEAR.driven) + pitchRadius(GEAR.out), Math.hypot(LINK.cz - MOTOR.z, LINK.cy - MOTOR.y), 1e-12);
  close(2 * pitchRadius(GEAR.sync), 2 * LINK.cz, 1e-12);
  assert.equal(PLANET.ring, PLANET.sun + 2 * PLANET.planet);
  assert.equal((PLANET.sun + PLANET.ring) % 3, 0);
  assert.equal(HEAD_RATIO, 1 + PLANET.ring / PLANET.sun);
});

test('meshAngle turns the driven gear by the tooth ratio, opposite to the driver', () => {
  const cases = [[GEAR.out, GEAR.driven, 0.7], [GEAR.sync, GEAR.sync, -2.1], [GEAR.driven, GEAR.out, 3.0]];
  for (const [a, b, alpha] of cases) {
    for (const phi of [-3.3, -0.4, 0, 0.9, 2.7, 6.1]) {
      for (const d of [-1.3, -0.01, 0.002, 0.5, 2.4]) {
        close(meshAngle(phi + d, a, b, alpha) - meshAngle(phi, a, b, alpha), -(a / b) * d, 1e-12);
      }
    }
  }
});

test('a disassembly track is exactly at rest at 0, sums at 1 and has no jumps between', () => {
  const steps = [
    { a: 0, b: 0.5, v: [1, 0.5, -2], r: [0, 0.25, 0] },
    { a: 0.4, b: 1, v: [0.5, 0, 1], r: [0.5, 0.25, 0], e: 'out' },
  ];
  const out = [9, 9, 9, 9, 9, 9];
  evalTrack(steps, 0, out);
  for (const value of out) assert.equal(value, 0);
  evalTrack(steps, 1, out);
  assert.deepEqual([...out], [1.5, 0.5, -1, 0.5, 0.5, 0]);
  const previous = [0, 0, 0, 0, 0, 0];
  const now = [0, 0, 0, 0, 0, 0];
  for (let i = 1; i <= 2000; i += 1) {
    evalTrack(steps, i / 2000, now);
    for (let k = 0; k < 6; k += 1) assert.ok(Math.abs(now[k] - previous[k]) < 0.01, `jump in component ${k} at step ${i}`);
    previous.splice(0, 6, ...now);
  }
});

test('the journey holds at each stage boundary and inverts cleanly', () => {
  assert.equal(journeyProgress(0), 0);
  assert.equal(journeyProgress(1), 1);
  let last = 0;
  for (let i = 0; i <= 1000; i += 1) {
    const p = journeyProgress(i / 1000);
    assert.ok(p >= last, `progress fell at sample ${i}`);
    last = p;
  }
  for (const t of [0.27, 0.29, 0.31, 0.33]) close(journeyProgress(t), 0.3, 1e-12);
  for (const t of [0.61, 0.63, 0.65, 0.67]) close(journeyProgress(t), 0.62, 1e-12);
  for (let i = 0; i <= 20; i += 1) {
    const p = i / 20;
    close(journeyProgress(journeyTime(p)), p, 1e-6);
  }
});

test('the stages tile the progress line', () => {
  assert.equal(STAGES[0].from, 0);
  assert.equal(STAGES[STAGES.length - 1].to, 1);
  for (let i = 1; i < STAGES.length; i += 1) assert.equal(STAGES[i].from, STAGES[i - 1].to);
});

test('the crank slows monotonically from hover to demonstration speed', () => {
  assert.equal(crankSpeed(0), SPEED.hover);
  assert.equal(crankSpeed(1), SPEED.demo);
  let last = Infinity;
  for (let i = 0; i <= 1000; i += 1) {
    const speed = crankSpeed(i / 1000);
    assert.ok(speed <= last, `speed rose at sample ${i}`);
    last = speed;
  }
});
