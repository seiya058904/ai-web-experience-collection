import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BALANCE_AMPLITUDE, BALANCE_HZ, BEATS_PER_SECOND, ESCAPE_STEP, ESCAPE_TEETH,
  FORK_AMPLITUDE, MODULE, REDUCED_MOTION_TIME, RELEASE_FRACTION, TRAIN,
  createMechanicalPose, mechanicalPose, writeMechanicalPose,
} from '../experiences/chronos/src/mechanics.ts';

const TAU = 2 * Math.PI;
const shaftIds = TRAIN.map(wheel => wheel.id);

function close(actual: number, expected: number, tolerance = 1e-10, message = '') {
  assert.ok(Number.isFinite(actual), `${message}: value must be finite`);
  assert.ok(Math.abs(actual - expected) <= tolerance,
    `${message}: expected ${expected}, received ${actual}`);
}

test('each driving pitch circle contacts the next receiving pinion in its own mesh plane', () => {
  assert.equal(TRAIN.length, 5);
  for (let i = 1; i < TRAIN.length; i++) {
    const driver = TRAIN[i - 1], receiver = TRAIN[i];
    const dx = receiver.x - driver.x, dy = receiver.y - driver.y;
    const distance = Math.hypot(dx, dy);
    const nx = dx / distance, ny = dy / distance;
    // The two independently constructed contact points must be the same point.
    close(driver.x + nx * driver.pitchRadius,
      receiver.x - nx * receiver.pinionRadius, 1e-12, `${receiver.id} contact x`);
    close(driver.y + ny * driver.pitchRadius,
      receiver.y - ny * receiver.pinionRadius, 1e-12, `${receiver.id} contact y`);
    close(2 * driver.pitchRadius / driver.teeth, MODULE);
    close(2 * receiver.pinionRadius / receiver.pinion, MODULE);
    close(receiver.pinionZ, driver.z, 1e-12, `${receiver.id} pinion mesh plane`);
    assert.ok(receiver.z > receiver.pinionZ, 'coaxial wheel clears the preceding mesh');
  }
});

test('contacting tooth phases remain complementary through releases and many revolutions', () => {
  for (const time of [0, .001, .0075, .014, .04, .12499, .125, .13, 1.771, 13.127, 3600.011]) {
    const pose = mechanicalPose(time);
    for (let i = 1; i < TRAIN.length; i++) {
      const driver = TRAIN[i - 1], receiver = TRAIN[i];
      const contact = Math.atan2(receiver.y - driver.y, receiver.x - driver.x);
      const drivingPhase = driver.teeth * (contact - driver.wheelPhase - pose[driver.id]);
      const receivingPhase = receiver.pinion *
        (contact + Math.PI - receiver.pinionPhase - pose[receiver.id]);
      // A tooth peak on one pitch circle must face a valley on the other.
      // Testing phase modulo a full tooth catches both alignment and ratio errors.
      const error = drivingPhase + receivingPhase - Math.PI;
      close(Math.atan2(Math.sin(error), Math.cos(error)), 0, 1e-8,
        `${driver.id}/${receiver.id} phase at ${time}s`);
    }
  }
});

test('external meshes counter-rotate without slip and the full train keeps the intended hour ratios', () => {
  for (const time of [.00025, .001, .0075, .013, .126, .251, 1.381]) {
    const before = mechanicalPose(time), after = mechanicalPose(time + .00001);
    for (let i = 1; i < TRAIN.length; i++) {
      const driver = TRAIN[i - 1], receiver = TRAIN[i];
      const drivingTurn = after[driver.id] - before[driver.id];
      const receivingTurn = after[receiver.id] - before[receiver.id];
      assert.ok(drivingTurn * receivingTurn < 0, `${receiver.id} must counter-rotate`);
      close(driver.pitchRadius * drivingTurn + receiver.pinionRadius * receivingTurn,
        0, 1e-12, `${receiver.id} tangential motion`);
    }
    for (const wheel of TRAIN) {
      close((after[wheel.id] - before[wheel.id]) / (after.escape - before.escape),
        wheel.escapeRatio, 1e-9, `${wheel.id} published shaft ratio`);
    }
  }
  const hour = mechanicalPose(3600);
  const turnsPerHour = { barrel: 1 / 6, centre: -1, third: 8, fourth: -60, escape: 960 };
  for (const id of shaftIds) close(hour[id] / TAU, turnsPerHour[id], 1e-10, `${id} revolutions/hour`);
});

test('a 4 Hz balance supplies eight 12-degree half-tooth escape advances each second', () => {
  assert.equal(BALANCE_HZ, 4);
  assert.equal(BEATS_PER_SECOND, 8);
  assert.equal(ESCAPE_TEETH, 15);
  close(ESCAPE_STEP * 180 / Math.PI, 12);
  close(ESCAPE_STEP * 2, TAU / ESCAPE_TEETH);

  for (let cycle = 0; cycle < 4; cycle++) {
    const start = cycle / 4;
    close(mechanicalPose(start).balance, 0);
    close(mechanicalPose(start + 1 / 16).balance, BALANCE_AMPLITUDE);
    close(mechanicalPose(start + 1 / 8).balance, 0);
    close(mechanicalPose(start + 3 / 16).balance, -BALANCE_AMPLITUDE);
    close(mechanicalPose(start + 1 / 4).balance, 0);
  }
  for (let beat = 0; beat < 30; beat++) {
    const current = mechanicalPose(beat / 8), next = mechanicalPose((beat + 1) / 8);
    assert.equal(next.beat - current.beat, 1);
    close(next.escape - current.escape, 12 * Math.PI / 180);
  }
  close(mechanicalPose(30 / 8).escape, TAU);
});

test('each release advances monotonically, then locks the whole train and fork for the rest of the beat', () => {
  assert.ok(RELEASE_FRACTION > 0 && RELEASE_FRACTION < .2,
    'the impulse occupies only a short portion of each half-cycle');
  for (let beat = 0; beat < 16; beat++) {
    const beginning = mechanicalPose(beat / 8);
    let previous = beginning.escape;
    for (let sample = 1; sample <= 12; sample++) {
      const during = mechanicalPose((beat + RELEASE_FRACTION * sample / 12) / 8);
      assert.ok(during.escape > previous, `release ${beat} must move forward`);
      previous = during.escape;
    }
    const locked = mechanicalPose((beat + .2) / 8);
    close(locked.escape - beginning.escape, ESCAPE_STEP);
    close(Math.abs(locked.fork), FORK_AMPLITUDE);
    close(locked.fork, beat % 2 === 0 ? FORK_AMPLITUDE : -FORK_AMPLITUDE);
    for (const progress of [.3, .5, .75, .99]) {
      const later = mechanicalPose((beat + progress) / 8);
      for (const id of shaftIds) assert.equal(later[id], locked[id], `${id} remains locked`);
      assert.equal(later.fork, locked.fork, 'fork rests against its stop');
      assert.equal(later.release, 1);
    }
    assert.notEqual(mechanicalPose((beat + .3) / 8).balance,
      mechanicalPose((beat + .5) / 8).balance, 'the balance still swings while the train is locked');
  }
});

test('shaft, balance, and fork positions stay continuous at every half-cycle and lock boundary', () => {
  const epsilon = 1e-7;
  for (let beat = 1; beat <= 128; beat++) {
    for (const boundary of [beat / 8, (beat + RELEASE_FRACTION) / 8]) {
      const left = mechanicalPose(boundary - epsilon);
      const exact = mechanicalPose(boundary);
      const right = mechanicalPose(boundary + epsilon);
      for (const key of [...shaftIds, 'fork'] as const) {
        // Smooth release endpoints should approach a resting position from either side.
        close(left[key], exact[key], 1e-8, `${key} before ${boundary}`);
        close(right[key], exact[key], 1e-8, `${key} after ${boundary}`);
      }
      close(left.balance, right.balance, 3e-5, `balance at ${boundary}`);
    }
  }
});

test('reversing evaluation and toggling slow mode cannot rephase already integrated mechanical time', () => {
  const times = [0, .001, .013, .12499, .125, .126, .25, .571, 1, 14.151, 3600];
  const expected = new Map(times.map(time => [time, mechanicalPose(time)]));
  const reused = createMechanicalPose();
  // One scratch object is deliberately revisited out of order: no state may leak between poses.
  const visits = [...times, ...times.toReversed(), .126, 3600, 0, .571];
  visits.forEach((time, index) => {
    assert.equal(writeMechanicalPose(time, index % 2 === 0, false, reused), reused);
    assert.deepEqual(reused, expected.get(time));
    assert.deepEqual(mechanicalPose(time, true), mechanicalPose(time, false));
  });

  // A speed toggle changes future clock increments, not the phase at the toggle instant.
  let integratedTime = .127;
  const atToggle = mechanicalPose(integratedTime, false);
  assert.deepEqual(mechanicalPose(integratedTime, true), atToggle);
  integratedTime += .016 / 32;
  assert.deepEqual(mechanicalPose(integratedTime, true), mechanicalPose(integratedTime, false));
  assert.ok(mechanicalPose(integratedTime, true).escape > atToggle.escape);
});

test('invalid clocks yield a finite origin pose and reduced motion always uses the same illustrative pose', () => {
  const origin = mechanicalPose(0);
  for (const time of [-1, -Infinity, Infinity, NaN]) assert.deepEqual(mechanicalPose(time), origin);
  const fixed = mechanicalPose(REDUCED_MOTION_TIME);
  for (const time of [-Infinity, -10, 0, .1, 30, 3600, Infinity, NaN]) {
    for (const slow of [false, true]) assert.deepEqual(mechanicalPose(time, slow, true), fixed);
  }
  for (let sample = 0; sample <= 2000; sample++) {
    const pose = mechanicalPose(sample / 137);
    assert.ok(Object.values(pose).every(Number.isFinite));
    assert.ok(Math.abs(pose.balance) <= BALANCE_AMPLITUDE + 1e-12);
    assert.ok(Math.abs(pose.fork) <= FORK_AMPLITUDE + 1e-12);
    assert.ok(pose.beatProgress >= 0 && pose.beatProgress < 1);
    assert.ok(pose.release >= 0 && pose.release <= 1);
  }
});
