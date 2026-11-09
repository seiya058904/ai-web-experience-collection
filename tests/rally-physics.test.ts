import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COURT, MODEL, acceleration, topspinAxis, netHeightAt, simulateFlight,
  mainRallyPreset, mainTrajectory, comparisonTrajectories, mainRebound,
  bContact, branches, handbacks, handbackReceiver, aReady, samplePath, sampleReplay, switchBranch, shadowAt,
} from '../experiences/rally/src/physics.ts';
import type { Vec3, PathSample, Trajectory, ReturnChoice } from '../experiences/rally/src/physics.ts';

const close = (actual: number, expected: number, tolerance = 1e-8) => {
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected} (tolerance ${tolerance})`);
};
const samePosition = (a: Vec3, b: Vec3, tolerance = 1e-8) => {
  for (const key of ['x', 'y', 'z'] as const) close(a[key], b[key], tolerance);
};
const end = (p: Trajectory): PathSample => p.samples[p.samples.length - 1]!;
const choices: ReturnChoice[] = ['crosscourt', 'line'];

test('the shared court uses ITF singles dimensions and net endpoints', () => {
  close(COURT.halfWidth * 2, 8.23);
  close(COURT.halfLength * 2, 23.77);
  close(COURT.serviceLine, 6.40);
  close(COURT.netHalfWidth - COURT.halfWidth, 0.914);
  close(netHeightAt(0), 0.914);
  close(netHeightAt(COURT.netHalfWidth), 1.07);
  close(netHeightAt(-COURT.netHalfWidth), 1.07);
});

test('drag opposes velocity; Magnus is perpendicular and downward for either direction', () => {
  for (const velocity of [{ x: 4, y: 22, z: 0 }, { x: -4, y: -22, z: 0 }]) {
    const axis = topspinAxis(velocity);
    const noSpin = acceleration(velocity, { x: 0, y: 0, z: 0 });
    const spin = acceleration(velocity, axis);
    assert.ok(noSpin.x * velocity.x + noSpin.y * velocity.y < 0);
    assert.ok(spin.z < noSpin.z);
    const magnus = { x: spin.x - noSpin.x, y: spin.y - noSpin.y, z: spin.z - noSpin.z };
    close(magnus.x * velocity.x + magnus.y * velocity.y + magnus.z * velocity.z, 0);
    close(magnus.x * axis.x + magnus.y * axis.y + magnus.z * axis.z, 0);
  }
  samePosition(acceleration({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }), { x: 0, y: 0, z: -MODEL.gravity });
});

test('spin comparison changes only spin, never the full launch vector or origin', () => {
  const { topspin, none } = comparisonTrajectories;
  assert.deepEqual(topspin.origin, none.origin);
  assert.deepEqual(topspin.initialVelocity, none.initialVelocity);
  assert.deepEqual(topspin.samples[0], none.samples[0]);
  assert.notDeepEqual(topspin.spinAxis, none.spinAxis);
  assert.ok(topspin.landing!.y < none.landing!.y - 3);
  assert.ok(topspin.metrics.apex < none.metrics.apex);
  assert.strictEqual(topspin, mainTrajectory);
});

test('the authored no-spin comparison is honestly long; the fixed main remains legal', () => {
  assert.equal(comparisonTrajectories.none.metrics.landingIn, false);
  assert.ok(comparisonTrajectories.none.landing!.y > COURT.halfLength);
  assert.equal(mainTrajectory.metrics.landingIn, true);
  assert.equal(mainTrajectory.metrics.landingHalf, 'B');
  assert.equal(mainTrajectory.ending, 'ground');
  assert.equal(mainTrajectory.metrics.clearsNet, true);
  assert.ok(mainTrajectory.metrics.netClearance! > 0.5);
});

test('main and comparison presets are reproducible and protected from mutation', () => {
  const repeat = simulateFlight(mainRallyPreset);
  assert.deepEqual(repeat.samples, mainTrajectory.samples);
  assert.ok(Object.isFrozen(mainTrajectory.samples));
  assert.ok(Object.isFrozen(mainTrajectory.origin));
  assert.throws(() => { (mainTrajectory.origin as { x: number }).x = 100; }, TypeError);
  assert.throws(() => { (mainTrajectory.samples as PathSample[]).pop(); }, TypeError);
  assert.deepEqual(simulateFlight({ ...mainRallyPreset, spin: 'none' }).samples, comparisonTrajectories.none.samples);
});

test('integration is stable when halving the fixed step', () => {
  const fine = simulateFlight({ ...mainRallyPreset, step: MODEL.step / 2 });
  samePosition(fine.landing!, mainTrajectory.landing!, 0.001);
  close(fine.duration, mainTrajectory.duration, 0.0001);
  close(fine.metrics.netClearance!, mainTrajectory.metrics.netClearance!, 0.001);
});

test('main bounce and B contact form one continuous ball path', () => {
  samePosition(mainRebound.origin, mainTrajectory.landing!);
  samePosition(mainRebound.samples[0]!, end(mainTrajectory));
  assert.ok(end(mainTrajectory).vz < 0);
  assert.ok(mainRebound.initialVelocity.z > 0);
  close(mainRebound.initialVelocity.z, -end(mainTrajectory).vz * MODEL.reboundVertical);
  close(mainRebound.initialVelocity.x, end(mainTrajectory).vx * MODEL.reboundHorizontal);
  assert.equal(mainRebound.ending, 'racket');
  samePosition(bContact, end(mainRebound));
  assert.ok(bContact.y > 0 && bContact.z > 0.7 && bContact.z < 1.4);
});

for (const choice of choices) {
  test(`${choice}: B return clears the whole ball over the net and lands in A's singles half`, () => {
    const b = branches[choice];
    samePosition(b.returnFlight.origin, bContact);
    assert.ok(b.returnFlight.metrics.clearsNet);
    assert.ok(b.returnFlight.metrics.netClearance! > 0.2);
    assert.ok(b.returnFlight.metrics.landingIn);
    assert.equal(b.returnFlight.metrics.landingHalf, 'A');
    assert.ok(Math.abs(b.returnFlight.landing!.x) + COURT.ballRadius < COURT.halfWidth);
    assert.ok(Math.abs(b.returnFlight.landing!.y) + COURT.ballRadius < COURT.halfLength);
  });

  test(`${choice}: four exact contact events connect B → ground → A → B without teleporting`, () => {
    const b = branches[choice];
    assert.deepEqual(b.events.map(e => e.id), ['b-strike', 'a-bounce', 'a-return', 'b-stop']);
    assert.deepEqual(b.events.map(e => e.actor), ['B', 'ground', 'A', 'B']);
    assert.equal(b.events[0]!.time, 0);
    close(b.events[1]!.time, b.returnFlight.duration);
    close(b.events[2]!.time, b.returnFlight.duration + b.rebound.duration);
    close(b.events[3]!.time, b.duration);
    samePosition(b.rebound.origin, b.returnFlight.landing!);
    samePosition(b.responseFlight.origin, end(b.rebound));
    assert.equal(b.responseFlight.ending, 'catch');
    assert.ok(b.responseFlight.metrics.clearsNet);
    assert.ok(b.bStop.y > 0 && b.bStop.z > 0.9 && b.bStop.z < 1.4);
    for (const [i, event] of b.events.entries()) {
      const frame = sampleReplay(choice, event.time);
      samePosition(frame.ball, event.position);
      assert.equal(frame.eventIndex, i);
      if (i > 0) {
        const before = sampleReplay(choice, event.time - 1e-7);
        samePosition(frame.ball, before.ball, 1e-5);
        samePosition(frame.a, before.a, 1e-5);
        samePosition(frame.b, before.b, 1e-5);
      }
    }
  });

  test(`${choice}: ball, court shadow, and trace share a deterministic sample, including reverse seek`, () => {
    const branch = branches[choice];
    for (let i = 0; i <= 200; i++) {
      const time = branch.duration * i / 200;
      const frame = sampleReplay(choice, time);
      assert.ok(frame.ball.z >= COURT.ballRadius - 1e-10);
      assert.ok(frame.a.y < 0 && frame.b.y > 0);
      assert.deepEqual(shadowAt(frame.ball), { x: frame.ball.x, y: frame.ball.y, z: 0 });
      assert.deepEqual(sampleReplay(choice, time), frame);
      if (time < branch.returnFlight.duration) samePosition(frame.ball, samplePath(branch.returnFlight, time));
    }
    const wanted = sampleReplay(choice, branch.duration * 0.4);
    sampleReplay(choice, branch.duration);
    sampleReplay(choice, 0);
    assert.deepEqual(sampleReplay(choice, branch.duration * 0.4), wanted);
  });

  test(`${choice}: the separate CH-10 handback continues from B and is caught beside A's ready anchor`, () => {
    const path = handbacks[choice];
    samePosition(path.origin, branches[choice].bStop);
    assert.equal(path.spin, 'none');
    assert.equal(path.ending, 'catch');
    assert.ok(path.metrics.clearsNet && path.metrics.netClearance! > 0.2);
    const caught = end(path);
    close(caught.x, handbackReceiver.x);
    close(caught.y, handbackReceiver.y);
    assert.ok(caught.z > 0.9 && caught.z < 1.3);
    samePosition({ x: caught.x + 0.25, y: caught.y - 0.4, z: 0 }, aReady);
    assert.ok(path.samples.every(p => p.z >= COURT.ballRadius));
    assert.equal(branches[choice].events.length, 4);
  });
}

test('both branches differ in A movement, open space, trace, and real duration', () => {
  const crosscourt = branches.crosscourt, line = branches.line;
  assert.ok(crosscourt.aContact.x < 0 && line.aContact.x > 0);
  assert.ok(crosscourt.openSpace.x > 0 && line.openSpace.x < 0);
  assert.notDeepEqual(crosscourt.returnFlight.samples, line.returnFlight.samples);
  assert.notDeepEqual(crosscourt.responseFlight.samples, line.responseFlight.samples);
  assert.ok(line.aTravelDistance > crosscourt.aTravelDistance + 1);
  assert.notEqual(crosscourt.duration, line.duration);
});

test('changing a return invalidates the running playhead and its revision token', () => {
  const before = { choice: 'crosscourt' as const, time: 1.8, playing: true, revision: 6 };
  const after = switchBranch(before, 'line');
  assert.deepEqual(after, { choice: 'line', time: 0, playing: false, revision: 7 });
  assert.deepEqual(before, { choice: 'crosscourt', time: 1.8, playing: true, revision: 6 });
  samePosition(sampleReplay(after.choice, after.time).ball, bContact);
});

test('sampling clamps pathological seek values and keeps the final ball held', () => {
  samePosition(samplePath(mainTrajectory, -100), mainTrajectory.origin);
  samePosition(samplePath(mainTrajectory, NaN), mainTrajectory.origin);
  samePosition(samplePath(mainTrajectory, Infinity), mainTrajectory.landing!);
  const final = sampleReplay('crosscourt', Infinity);
  assert.equal(final.phase, 'held');
  assert.equal(final.event.id, 'b-stop');
  assert.deepEqual([final.ball.vx, final.ball.vy, final.ball.vz], [0, 0, 0]);
});

test('failed low flight is intercepted at the net instead of passing through it', () => {
  const blocked = simulateFlight({ id: 'regression-net', origin: { x: 0, y: -2, z: 0.45 }, velocity: { x: 0, y: 18, z: 0 }, spin: 'none' });
  assert.equal(blocked.ending, 'net');
  assert.equal(end(blocked).y, 0);
  assert.equal(blocked.metrics.clearsNet, false);
  assert.equal(blocked.landing, null);
  assert.ok(blocked.samples.every(p => p.y <= 0));
});

test('no sampled path penetrates the floor and times remain strictly increasing', () => {
  const paths = [mainTrajectory, mainRebound, ...Object.values(comparisonTrajectories), ...Object.values(branches).flatMap(b => [b.returnFlight, b.rebound, b.responseFlight])];
  for (const path of paths) {
    for (let i = 0; i < path.samples.length; i++) {
      const sample = path.samples[i]!;
      assert.ok(sample.z >= COURT.ballRadius - 1e-10, path.id);
      assert.ok(Object.values(sample).every(Number.isFinite), path.id);
      if (i > 0) assert.ok(sample.t > path.samples[i - 1]!.t, path.id);
    }
  }
  assert.throws(() => simulateFlight({ id: 'invalid', origin: { x: 0, y: 0, z: -1 }, velocity: { x: 0, y: 0, z: 0 } }));
});
