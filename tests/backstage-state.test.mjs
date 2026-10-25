import test from 'node:test';
import assert from 'node:assert/strict';
import { clamp, lerp, smooth, mechanism, createDirector } from '../experiences/backstage/src/state.js';

const near = (actual, expected, tolerance = 1e-8) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should be near ${expected}`);
const fields = (pose) => ({ world: pose.world, view: pose.view, light: pose.light, lamp: pose.lamp, doorGlow: pose.doorGlow });
const step = (director, seconds, p = 0.73) => {
  let pose;
  for (let time = 0; time < seconds; time += 1 / 60) pose = director.tick(p, 1 / 60);
  return pose;
};

test('helpers clamp invalid progress and implement bounded smoothstep', () => {
  assert.equal(clamp(-1), 0);
  assert.equal(clamp(4, 0, 2), 2);
  assert.equal(clamp(NaN), 0);
  assert.equal(lerp(1, 3, 0.25), 1.5);
  assert.equal(smooth(0.2, 0.8, -2), 0);
  assert.equal(smooth(0.2, 0.8, 2), 1);
  near(smooth(0.2, 0.8, 0.5), 0.5);
});

test('mechanical endpoints retain exactly one continuous authored path', () => {
  const room = mechanism(0), sea = mechanism(1), night = mechanism(2);
  assert.deepEqual(room.flatAngles.map(Math.abs), [0, 0, 0, 0]);
  assert.deepEqual(room.waves, [0, 0, 0]);
  assert.deepEqual(sea.flatAngles.map(Math.abs), [Math.PI, Math.PI, Math.PI, Math.PI]);
  assert.deepEqual(sea.waves, [1, 1, 1]);
  assert.deepEqual(night.flatAngles, sea.flatAngles);
  assert.deepEqual(night.waves, sea.waves);
  assert.equal(room.lamp, 0);
  assert.equal(sea.lamp, 0.7);
  assert.equal(night.lamp, 1);
  assert.equal(night.moon, 1);
  assert.equal(night.stars, 1);
  // At the first reveal, outer flats have moved but the inner faces still
  // give the camera a coherent room; all sea boards remain parked.
  const early = mechanism(0.2);
  assert.ok(Math.abs(early.flatAngles[3]) > 1.5);
  assert.equal(early.flatAngles[1], 0);
  assert.equal(Math.abs(early.flatAngles[2]), 0);
  assert.deepEqual(early.waves, [0, 0, 0]);
  // Waves enter in an ordered relay, not at once.
  const middle = mechanism(0.5);
  assert.equal(middle.flatAngles[1], 0, 'the left room remains at the handoff midpoint');
  assert.ok(Math.abs(middle.flatAngles[2]) > Math.PI * .8, 'the right coast has arrived');
  assert.ok(middle.waves[2] > .5, 'the first safe front wave is entering');
  assert.equal(middle.waves[0], 0, 'the rear lift waits for its flat to clear');
});

test('authored scroll is reconstructible at every sample and reversible', () => {
  const director = createDirector();
  const samples = [0, 0.12, 0.155, 0.19, 0.225, 0.26, 0.29, 0.34, 0.385, 0.43, 0.475, 0.52, 0.55, 0.6, 0.62, 0.64, 0.66];
  const forwards = samples.map((p) => fields(director.tick(p, 0.016)));
  for (let i = samples.length - 1; i >= 0; i--) {
    assert.deepEqual(fields(director.tick(samples[i], 5)), forwards[i]);
    assert.deepEqual(fields(createDirector().tick(samples[i], 0)), forwards[i]);
  }
});

test('neutral III to IV entry is identical at every quarter before and after visiting IV', () => {
  const director = createDirector();
  const savedBefore = director.serialize();
  const samples = [0.60, 0.62, 0.64, 0.66, 0.68];
  const forward = samples.map(p => director.tick(p, 0.016));
  director.tick(0.735, 4);
  for (let i = samples.length - 1; i >= 0; i--) {
    assert.deepEqual(director.tick(samples[i], 4), forward[i], `III to IV at ${i * 25}% changed after a neutral visit`);
    assert.deepEqual(createDirector().tick(samples[i], 0), forward[i], `fresh entry at ${i * 25}% differs from replay`);
  }
  const browserSample = 0.66006;
  assert.deepEqual(fields(director.tick(browserSample, 0)), fields(createDirector().tick(browserSample, 0)));
  assert.deepEqual(director.serialize(), savedBefore, 'author traversal must not mutate initialized director choices');
});

test('III to IV bridge retains a remembered production and its first/reverse path', () => {
  const director = createDirector({ version: 1, scene: 'room', world: 0, view: 0.8, light: 0.2 });
  const savedBefore = director.serialize();
  const samples = [0.60, 0.62, 0.64, 0.66, 0.68];
  const forward = samples.map(p => director.tick(p, 0));
  assert.equal(forward[0].world, 1, 'entry begins in authored SEA');
  assert.ok(forward[3].world > 0 && forward[3].world < forward[2].world, 'the last quarter bridges toward remembered ROOM');
  assert.ok(forward[3].view > forward[2].view && forward[3].view < 0.8, 'the camera blends toward the remembered view');
  assert.deepEqual(fields(forward[4]), { world: 0, view: 0.8, light: 0.2, lamp: 0, doorGlow: 0 });
  director.tick(0.735, 2);
  for (let i = samples.length - 1; i >= 0; i--) assert.deepEqual(director.tick(samples[i], 0), forward[i]);
  assert.deepEqual(director.serialize(), savedBefore, 'bridge and author replay preserve stored scene, view and light');
});

for (const from of ['room', 'sea', 'night']) {
  for (const to of ['room', 'sea', 'night']) {
    if (from === to) continue;
    test(`finite cue reaches ${to} from ${from} without leaving its safe scalar interval`, () => {
      const names = ['room', 'sea', 'night'];
      const director = createDirector({ version: 1, scene: from });
      director.tick(0.73, 0);
      director.setScene(to);
      const a = names.indexOf(from), b = names.indexOf(to);
      let previous = a;
      for (let i = 0; i < 220; i++) {
        const pose = director.tick(0.73, 1 / 60);
        assert.ok(pose.world >= Math.min(a, b) - 1e-9 && pose.world <= Math.max(a, b) + 1e-9);
        assert.ok(b > a ? pose.world >= previous : pose.world <= previous);
        previous = pose.world;
      }
      assert.equal(previous, b);
      assert.equal(director.inspect().busy, false);
      assert.equal(director.inspect().target, to);
    });
  }
}

test('rapid retargeting takes over the present pose and only the last target survives', () => {
  const director = createDirector();
  director.tick(0.73, 0);
  director.setScene('room');
  step(director, 0.6);
  const before = director.tick(0.73, 0);
  director.setScene('sea');
  const retarget = director.tick(0.73, 0);
  assert.deepEqual(fields(retarget), fields(before));
  director.setScene('night');
  director.setScene('room');
  director.setScene('sea');
  const after = step(director, 4);
  assert.equal(after.world, 1);
  assert.equal(after.target, 'sea');
  assert.equal(after.busy, false);
});

test('exit captures the current cue and pauses it while q alone controls the handoff', () => {
  const director = createDirector();
  director.tick(0.73, 0);
  director.setView(0.8);
  director.setLight(0.24);
  director.setScene('room');
  step(director, 0.7);
  const before = director.tick(0.819999, 0);
  const boundary = director.tick(0.82, 1);
  assert.deepEqual(fields(boundary), fields(before));
  const snapshot = director.inspect().exitSnapshot;
  assert.ok(Object.isFrozen(snapshot));
  assert.ok(Object.isFrozen(snapshot.remaining));
  assert.ok(Object.isFrozen(snapshot.mechanism.flatAngles));
  const atHalf = director.tick(0.88, 0.016);
  for (let i = 0; i < 80; i++) assert.deepEqual(director.tick(0.88, 4), atHalf);
  assert.equal(director.inspect().exitSnapshot, snapshot);
  assert.equal(director.inspect().world, snapshot.world);
  const final = director.tick(0.94, 10);
  assert.equal(final.world, 0);
  assert.equal(final.lamp, 0);
  assert.equal(final.view, 0);
  assert.equal(final.light, 0.24);
  assert.equal(final.doorGlow, 1);
  assert.equal(final.target, 'room');
});

test('reverse handoff reuses its snapshot at 0/25/50/75/100 percent', () => {
  const director = createDirector();
  director.tick(0.73, 0);
  director.setScene('sea');
  director.setView(1);
  step(director, 0.3);
  const samples = [0.82, 0.85, 0.88, 0.91, 0.94];
  const forward = samples.map((p) => director.tick(p, 0));
  const snapshot = director.inspect().exitSnapshot;
  for (let i = samples.length - 1; i >= 0; i--) {
    assert.deepEqual(director.tick(samples[i], 0.04), forward[i]);
    assert.equal(director.inspect().exitSnapshot, snapshot);
  }
  const reentry = director.tick(0.819999, 0);
  assert.deepEqual(fields(reentry), fields(forward[0]));
  const resumed = step(director, 0.3);
  assert.ok(resumed.world < reentry.world);
  const nextExit = director.tick(0.82, 0);
  assert.deepEqual(fields(nextExit), fields(resumed));
  assert.notEqual(director.inspect().exitSnapshot.id, snapshot.id);
  assert.equal(director.inspect().exitSnapshot.revision, snapshot.revision);
});

test('direct end access is canonical NIGHT and never depends on unseen scroll history', () => {
  const director = createDirector();
  const end = director.tick(1, 5);
  assert.equal(end.world, 2);
  assert.equal(end.target, 'night');
  assert.equal(end.view, 0);
  assert.equal(end.lamp, 0);
  assert.equal(end.doorGlow, 1);
  const snapshot = director.inspect().exitSnapshot;
  director.tick(0.1, 0);
  assert.deepEqual(director.tick(1, 0), end);
  assert.equal(director.inspect().exitSnapshot, snapshot);
});

test('skipping IV uses saved choices and resolves an unfinished saved path', () => {
  const director = createDirector({ version: 1, scene: 'room', world: 1.4, view: 0.9, light: 0.2, remainingDuration: 1.2 });
  director.tick(0.25, 0);
  const start = director.tick(0.82, 0);
  assert.equal(start.world, 1.4);
  assert.equal(start.view, 0.9);
  const end = director.tick(0.98, 0);
  assert.equal(end.world, 0);
  assert.equal(end.target, 'room');
  assert.equal(end.light, 0.2);
});

test('author replay does not overwrite a production and the IV entry meets its stored pose', () => {
  const director = createDirector();
  director.tick(0.73, 0);
  director.setScene('sea');
  director.setView(0.74);
  director.setLight(0.1);
  const local = step(director, 3);
  const saved = director.serialize();
  for (const p of [0.5, 0.2, 0, 0.3, 0.6, 0.64, 0.66]) director.tick(p, 0.05);
  assert.deepEqual(director.serialize(), saved);
  const nearEntry = director.tick(0.679999, 0);
  const entry = director.tick(0.68, 0);
  assert.deepEqual(fields(entry), fields(local));
  for (const key of ['world', 'view', 'light', 'lamp']) near(nearEntry[key], entry[key], 1e-6);
});

test('a serialized in-progress ending reconstructs the same pose after reload', () => {
  const director = createDirector();
  director.tick(0.73, 0);
  director.setScene('room');
  director.setView(0.42);
  director.setLight(0.88);
  step(director, 0.45);
  const original = director.tick(0.87, 0);
  const saved = JSON.stringify(director.serialize());
  const restored = createDirector(saved);
  assert.deepEqual(restored.tick(0.87, 0), original);
  assert.deepEqual(restored.tick(0.82, 0), director.tick(0.82, 0));
  assert.deepEqual(fields(restored.tick(0.8199, 0)), fields(director.tick(0.8199, 0)));
});

test('invalid saves are harmless and supported saved numbers are bounded', () => {
  for (const value of ['{broken', 'null', '[]', '{}', { version: 9, scene: 'room' }, { version: 1, scene: '__proto__' }, { version: 1, scene: 'toString' }]) {
    const d = createDirector(value);
    const pose = d.tick(0.73, 0);
    assert.equal(pose.world, 2);
    assert.equal(pose.light, 0.55);
  }
  const d = createDirector({ version: 1, scene: 'sea', world: 5, view: -1, light: 9, revision: -5 });
  const pose = d.tick(0.73, 0);
  assert.equal(pose.world, 2);
  assert.equal(pose.view, 0);
  assert.equal(pose.light, 1);
  assert.equal(d.inspect().revision, 0);
  assert.equal(d.setScene('constructor'), false);
  assert.equal(d.setView(NaN), false);
  assert.equal(d.setLight(Infinity), false);
  assert.equal(d.setView('1'), false);
});

test('reduced motion retains scene, view, light, reset and the final choice', () => {
  const d = createDirector();
  d.tick(0.73, 0);
  d.setScene('room');
  d.setView(1);
  d.setLight(0);
  const pose = d.tick(0.73, 0, { reducedMotion: true });
  assert.equal(pose.world, 0);
  assert.equal(pose.view, 1);
  assert.equal(pose.light, 0);
  assert.equal(pose.busy, false);
  const end = d.tick(0.88, 0, { reducedMotion: true });
  assert.equal(end.world, 0);
  assert.equal(end.view, 0);
  assert.equal(end.light, 0);
  d.tick(0.73, 0, { reducedMotion: true });
  d.reset();
  const reset = d.tick(0.73, 0, { reducedMotion: true });
  assert.equal(reset.world, 2);
  assert.equal(reset.view, 0);
  assert.equal(reset.light, 0.55);
  assert.equal(d.inspect().progress, 0.73);
});

test('hidden tabs freeze local cues and long resume deltas cannot catch up', () => {
  const d = createDirector();
  d.tick(0.73, 0);
  d.setScene('room');
  const before = step(d, 0.4);
  for (let i = 0; i < 30; i++) assert.deepEqual(d.tick(0.73, 60, { visible: false }), before);
  const beforeElapsed = d.inspect().cue.elapsed;
  const resumed = d.tick(0.73, 60, { visible: true });
  near(d.inspect().cue.elapsed - beforeElapsed, 0.05);
  assert.ok(resumed.world > 0);
  assert.ok(resumed.busy);
});

test('reset restores only production parameters and never changes scroll progress', () => {
  const d = createDirector();
  d.tick(0.75, 0);
  d.setScene('room');
  d.setView(1);
  d.setLight(0);
  step(d, 3, 0.75);
  d.reset();
  assert.equal(d.inspect().progress, 0.75);
  assert.equal(d.inspect().target, 'night');
  assert.equal(d.inspect().view, 0);
  assert.equal(d.inspect().light, 0.55);
  const done = step(d, 3, 0.75);
  assert.equal(done.world, 2);
  assert.equal(done.busy, false);
});
