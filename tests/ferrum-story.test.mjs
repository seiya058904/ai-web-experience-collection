import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTS, TOTAL_TRAVEL, sampleStory, sampleStrikeParticles, progressForAct } from '../experiences/ferrum/src/story.js';

const near = (a, b, epsilon = 1e-8) => assert.ok(Math.abs(a - b) <= epsilon, `${a} is not within ${epsilon} of ${b}`);
function finiteTree(value, path = 'state') {
  if (typeof value === 'number') assert.ok(Number.isFinite(value), `${path} must be finite`);
  if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) finiteTree(child, `${path}.${key}`);
}

test('six acts cover the complete scroll journey without gaps or overlap', () => {
  assert.equal(ACTS.length, 6);
  near(ACTS.reduce((sum, act) => sum + act.travel, 0), TOTAL_TRAVEL);
  assert.equal(ACTS[0].start, 0);
  assert.equal(ACTS[5].end, 1);
  for (const [index, act] of ACTS.entries()) {
    if (index) assert.equal(act.start, ACTS[index - 1].end);
    assert.ok(act.hold > act.start && act.hold < act.end);
    assert.ok(act.hold >= act.holdRange[0] && act.hold <= act.holdRange[1]);
    assert.equal(sampleStory(act.hold).act.id, act.id);
  }
});

test('overscroll and malformed positions have safe, finite endpoint states', () => {
  assert.deepEqual(sampleStory(-10), sampleStory(0));
  assert.deepEqual(sampleStory(10), sampleStory(1));
  for (const value of [NaN, undefined, null, Infinity, -Infinity]) assert.deepEqual(sampleStory(value), sampleStory(0));
  assert.equal(sampleStory(1).index, 5);
  assert.equal(sampleStory(1).local, 1);
});

test('all reachable states stay finite and within material and light bounds', () => {
  for (let i = 0; i <= 1200; i++) {
    const state = sampleStory(i / 1200);
    finiteTree(state);
    for (const key of ['shape', 'heat', 'polish', 'oxide', 'mist', 'water', 'quench']) {
      assert.ok(state[key] >= 0 && state[key] <= 1, `${key} escaped its range at ${state.progress}`);
    }
    for (const weight of Object.values(state.lights)) assert.ok(weight >= 0 && weight <= 1);
    assert.ok(state.object.scale.every(value => value > .8));
    assert.ok(state.camera.fov > 15 && state.camera.fov < 60);
    assert.ok(state.portrait.scale > .3 && state.portrait.scale <= 1);
    assert.ok(state.portrait.fov > 20 && state.portrait.fov < 60);
  }
});

test('material development is monotonic and ends as cold refined metal', () => {
  let previousShape = 0, previousPolish = 0;
  for (let i = 0; i <= 1000; i++) {
    const state = sampleStory(i / 1000);
    assert.ok(state.shape >= previousShape - 1e-12);
    assert.ok(state.polish >= previousPolish - 1e-12);
    previousShape = state.shape; previousPolish = state.polish;
  }
  const final = sampleStory(1);
  assert.equal(final.shape, 1);
  assert.equal(final.polish, 1);
  assert.equal(final.heat, 0);
  assert.equal(final.mist, 0);
  assert.equal(final.lights.furnace, 0);
  assert.equal(final.lights.strike, 0);
  assert.equal(final.lights.cooling, 0);
});

test('direct, reverse and arbitrary-history samples yield identical narrative state', () => {
  const probes = [.013, .127, .274, .387, .439, .619, .787, .931];
  const direct = probes.map(value => sampleStory(value));
  for (let i = 1000; i >= 0; i--) sampleStory(i / 1000);
  for (let i = 0; i < probes.length; i++) assert.deepEqual(sampleStory(probes[i]), direct[i]);
  for (const value of [.95, .1, .8, .37, .0, 1, .55]) sampleStory(value);
  for (let i = 0; i < probes.length; i++) assert.deepEqual(sampleStory(probes[i]), direct[i]);
});

test('returned mutable transforms cannot corrupt future samples', () => {
  const reference = sampleStory(.42);
  const changed = sampleStory(.42);
  changed.camera.position[0] = 999;
  changed.camera.target.push(100);
  changed.object.rotation[0] = 100;
  changed.object.scale[1] = 0;
  changed.portrait.rotation[0] = 99;
  changed.portrait.camera[0] = 99;
  changed.lights.furnace = 5;
  changed.strikePulses[0].age = 999;
  assert.deepEqual(sampleStory(.42), reference);
});

test('every chapter handoff preserves continuous camera, geometry and illumination', () => {
  const vectors = state => [
    ...state.camera.position, ...state.camera.target, state.camera.fov,
    ...state.object.position, ...state.object.rotation, ...state.object.scale,
    ...state.portrait.rotation, state.portrait.scale, state.portrait.worldY,
    state.shape, state.heat, state.polish, state.oxide, state.reflection,
    ...Object.values(state.lights), state.mist, state.water,
  ];
  for (const act of ACTS.slice(1)) {
    const before = vectors(sampleStory(act.start - 1e-7));
    const after = vectors(sampleStory(act.start + 1e-7));
    before.forEach((value, index) => near(value, after[index], .0001));
  }
});

test('ordinary living holds retain a stable photographic composition', () => {
  for (const index of [0, 1, 3, 4, 5]) {
    const first = sampleStory(progressForAct(index, .30));
    const second = sampleStory(progressForAct(index, .55));
    assert.deepEqual(first.camera, second.camera, ACTS[index].name);
  }
  const finalA = sampleStory(progressForAct('relic', .3));
  const finalB = sampleStory(1);
  assert.deepEqual(finalA.object, finalB.object);
});

test('both hammer contacts reach the material and then rebound', () => {
  for (const contact of [.28, .56]) {
    const before = sampleStory(progressForAct('strike', contact - .018));
    const impact = sampleStory(progressForAct('strike', contact));
    const after = sampleStory(progressForAct('strike', contact + .04));
    assert.ok(before.hammer.height > .3);
    near(impact.hammer.height, 0, 1e-10);
    assert.ok(after.hammer.height > .15);
    assert.ok(impact.hammer.compression >= 0);
  }
});

test('spark trails are deterministic, bounded, directional and never accumulate', () => {
  for (const contact of [.28, .56]) {
    const state = sampleStory(progressForAct('strike', contact + .025));
    const expected = sampleStrikeParticles(state, 34);
    assert.ok(expected.length > 0 && expected.length <= 34);
    assert.equal(new Set(expected.map(p => p.id)).size, expected.length);
    for (const p of expected) {
      finiteTree(p);
      assert.ok(p.age >= 0 && p.age <= p.life);
      assert.ok(p.brightness >= 0 && p.brightness <= 1);
      assert.notDeepEqual(p.position, p.previous);
    }
    for (let i = 0; i < 50; i++) {
      sampleStrikeParticles(sampleStory(progressForAct('strike', .8 - i * .01)));
      assert.deepEqual(sampleStrikeParticles(state, 34), expected);
    }
  }
  assert.deepEqual(sampleStrikeParticles(sampleStory(0)), []);
  assert.deepEqual(sampleStrikeParticles(sampleStory(1)), []);
  assert.deepEqual(sampleStrikeParticles(sampleStory(progressForAct('strike', .20))), []);
  assert.deepEqual(sampleStrikeParticles(sampleStory(progressForAct('strike', .77))), []);
});

test('reduced motion keeps six chapters while removing shake, particles and steam', () => {
  const fixedCamera = sampleStory(0, { reducedMotion: true }).camera;
  for (let i = 0; i <= 200; i++) {
    const state = sampleStory(i / 200, { reducedMotion: true });
    finiteTree(state);
    assert.deepEqual(state.camera, fixedCamera);
    assert.equal(state.hammer.compression, 0);
    assert.equal(state.mist, 0);
    assert.deepEqual(sampleStrikeParticles(state), []);
    assert.equal(state.index, sampleStory(i / 200).index);
  }
});

test('chapter links target stable compositions including final deep links', () => {
  for (const act of ACTS) {
    assert.equal(progressForAct(act.id), act.hold);
    assert.equal(sampleStory(progressForAct(act.id)).phase, 'hold');
    near(progressForAct(act.id, 0), act.start);
    near(progressForAct(act.id, 1), act.end);
  }
  assert.equal(progressForAct('missing'), 0);
});
