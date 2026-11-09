import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DECISION_PROGRESS,
  DECISION_SNAPSHOT,
  ENVELOPE_SHADOW_HEIGHT,
  LANDING_PROGRESS,
  MAX_PROGRESS,
  PATH_DURATION,
  SUN_DIRECTION,
  WIND_LAYERS,
  altitudeAt,
  buoyancy,
  getBranchRoute,
  getLanding,
  getRoute,
  pathTimeAt,
  readPreference,
  reducedSceneState,
  sceneAt,
  terrainHeight,
  windAtHeight,
} from '../src/journey.ts';
import type { SceneState, WindLayer } from '../src/journey.ts';

const layers: WindLayer[] = ['low', 'middle', 'high'];

function near(actual: number, expected: number, tolerance = 1e-9): void {
  assert.ok(Math.abs(actual - expected) <= tolerance,
    `Expected ${actual} to be within ${tolerance} of ${expected}`);
}

function visualState(scene: SceneState) {
  return {
    position: scene.position,
    agl: scene.agl,
    heading: scene.heading,
    shadow: scene.shadow,
    groundContact: scene.groundContact,
    routeProgress: scene.routeProgress,
    destination: scene.destination,
    layer: scene.layer,
  };
}

test('all future preferences leave the entire common-prefix state unchanged', () => {
  const stops = [0, 0.4, 1.5, 2.8, 3, 3.1, 3.65, 4, 4.25, 4.9, 5, 5.449999, DECISION_PROGRESS];
  for (const progress of stops) {
    const expected = sceneAt(progress, 'middle');
    for (const layer of layers) {
      assert.deepEqual(sceneAt(progress, layer), expected);
      assert.equal(sceneAt(progress, layer).branchActive, false);
    }
  }
  assert.deepEqual(sceneAt(DECISION_PROGRESS, 'high'), DECISION_SNAPSHOT);
  assert.equal(DECISION_SNAPSHOT.position.x, 0);
  assert.equal(DECISION_SNAPSHOT.position.z, 60);
  assert.equal(DECISION_SNAPSHOT.agl, 38);
});

test('reduced views share fixed chapter states, three arrival stages and a causal decision boundary', () => {
  for (const layer of layers) {
    for (const chapter of [0, 1, 2, 3, 4, 6, 7, 9]) {
      const expected = reducedSceneState(sceneAt(chapter + 0.2, layer));
      for (const local of [0.01, 0.3, 0.8, 0.99]) {
        assert.deepEqual(reducedSceneState(sceneAt(chapter + local, layer)), expected);
      }
      assert.deepEqual(reducedSceneState(expected), expected);
    }
    for (const progress of [0.1, 1.8, 3.7, 4.99, 5.01, 5.44, DECISION_PROGRESS]) {
      const still = reducedSceneState(sceneAt(progress, layer));
      assert.deepEqual(still, reducedSceneState(sceneAt(progress, 'middle')));
      assert.equal(still.branchActive, false);
      assert.equal(still.layer, 'middle');
      assert.ok(still.progress <= DECISION_PROGRESS);
    }
    for (const progress of [5.46, 5.7, 5.99]) {
      const still = reducedSceneState(sceneAt(progress, layer));
      assert.deepEqual(still, sceneAt(5.5, layer));
      assert.equal(still.layer, layer);
      assert.equal(still.branchActive, true);
    }
    const approach = reducedSceneState(sceneAt(8.01, layer));
    const descent = reducedSceneState(sceneAt(8.34, layer));
    const contact = reducedSceneState(sceneAt(8.67, layer));
    assert.equal(approach.progress, 8.12);
    assert.equal(descent.progress, 8.52);
    assert.equal(contact.progress, 8.92);
    assert.ok(approach.agl > descent.agl && descent.agl > 0);
    assert.equal(contact.groundContact, true);
    const landing = getLanding(layer);
    assert.deepEqual(contact.position, { x: landing.x, y: landing.y, z: landing.z });
    for (const progress of [8.12, 8.32]) assert.deepEqual(reducedSceneState(sceneAt(progress, layer)), approach);
    for (const progress of [8.5, 8.65]) assert.deepEqual(reducedSceneState(sceneAt(progress, layer)), descent);
    for (const progress of [8.9, 8.99]) assert.deepEqual(reducedSceneState(sceneAt(progress, layer)), contact);
  }
});

test('each suffix begins at the exact same immutable decision point', () => {
  const starts = layers.map((layer) => getBranchRoute(layer)[0]);
  assert.deepEqual(starts[0], starts[1]);
  assert.deepEqual(starts[1], starts[2]);
  for (const layer of layers) {
    const route = getRoute(layer);
    const common = route.filter((point) => point.progress <= DECISION_PROGRESS);
    assert.deepEqual(common, getRoute('middle').filter((point) => point.progress <= DECISION_PROGRESS));
    assert.equal(route.filter((point) => point.progress === DECISION_PROGRESS).length, 1);
    assert.ok(Object.isFrozen(route));
    assert.ok(Object.isFrozen(route[0]));
    assert.ok(Object.isFrozen(getLanding(layer)));
  }
});

test('chapter boundaries, decision and landing remain spatially continuous in both directions', () => {
  const boundaries = [3, 4, 5, DECISION_PROGRESS, 6, 6.25, 7, 8, LANDING_PROGRESS, 9];
  const epsilon = 1e-6;
  for (const layer of layers) {
    for (const boundary of boundaries) {
      const before = sceneAt(boundary - epsilon, layer);
      const at = sceneAt(boundary, layer);
      const after = sceneAt(boundary + epsilon, layer);
      for (const sample of [before, after]) {
        for (const axis of ['x', 'y', 'z'] as const) near(sample.position[axis], at.position[axis], 0.0003);
        near(sample.heading, at.heading, 0.00002);
        for (const axis of ['x', 'y', 'z'] as const) near(sample.shadow[axis], at.shadow[axis], 0.0004);
      }
    }
  }
});

test('three choices produce spatially distinct suffixes and named landing fields', () => {
  assert.deepEqual(layers.map((layer) => sceneAt(9.5, layer).destination),
    ['Hedgerow Meadow', 'Willow Bend', 'Far Meadow']);
  for (const layer of layers) {
    assert.equal(sceneAt(6.5, layer).layer, layer);
    assert.equal(sceneAt(6.5, layer).branchActive, true);
    near(sceneAt(7, layer).agl, WIND_LAYERS[layer].altitude);
  }
  for (let i = 0; i < layers.length; i += 1) {
    for (let j = i + 1; j < layers.length; j += 1) {
      const a = getLanding(layers[i]!);
      const b = getLanding(layers[j]!);
      assert.ok(Math.hypot(a.x - b.x, a.z - b.z) > 50);
    }
  }
  assert.ok(getLanding('low').x > getLanding('middle').x);
  assert.ok(getLanding('high').x < 0);
});

test('every horizontal suffix increment comes from the current-height wind integral', () => {
  for (const layer of layers) {
    const route = getBranchRoute(layer);
    for (let index = 1; index < route.length; index += 1) {
      const a = route[index - 1]!;
      const b = route[index]!;
      const midpoint = (a.progress + b.progress) / 2;
      const wind = windAtHeight(altitudeAt(midpoint, layer));
      const elapsed = pathTimeAt(b.progress) - pathTimeAt(a.progress);
      near(b.x - a.x, wind.x * elapsed, 3e-14);
      near(b.z - a.z, wind.z * elapsed, 3e-14);
      assert.ok(elapsed >= 0);
      near(b.y, terrainHeight(b.x, b.z) + b.agl);
    }
  }
  near(pathTimeAt(DECISION_PROGRESS), 0);
  near(pathTimeAt(LANDING_PROGRESS), PATH_DURATION);
});

test('an independent fine integral agrees with endpoint and arbitrary-seek positions', () => {
  // A different sample count and independent integration catches an endpoint
  // override, a route lookup tied to frames, or a hidden destination blend.
  for (const layer of layers) {
    for (const stop of [6.1, 7.3, 8.4, LANDING_PROGRESS]) {
      const steps = 10007;
      let x = 0;
      let z = 60;
      let previousTime = 0;
      for (let i = 1; i <= steps; i += 1) {
        const end = DECISION_PROGRESS + (i / steps) * (stop - DECISION_PROGRESS);
        const middle = DECISION_PROGRESS + ((i - 0.5) / steps) * (stop - DECISION_PROGRESS);
        const wind = windAtHeight(altitudeAt(middle, layer));
        const time = pathTimeAt(end);
        x += wind.x * (time - previousTime);
        z += wind.z * (time - previousTime);
        previousTime = time;
      }
      const actual = sceneAt(stop, layer).position;
      near(actual.x, x, 0.0002);
      near(actual.z, z, 0.0002);
    }
  }
});

test('the authored wind field is continuous and exact at the three named layers', () => {
  for (const layer of layers) {
    const definition = WIND_LAYERS[layer];
    assert.deepEqual(windAtHeight(definition.altitude), definition.wind);
    for (const delta of [-1e-7, 1e-7]) {
      const adjacent = windAtHeight(definition.altitude + delta);
      near(adjacent.x, definition.wind.x, 1e-8);
      near(adjacent.z, definition.wind.z, 1e-8);
    }
  }
  assert.deepEqual(windAtHeight(-100), WIND_LAYERS.low.wind);
  assert.deepEqual(windAtHeight(10000), WIND_LAYERS.high.wind);
});

test('landing contacts actual terrain, then the world stops for the entire ending', () => {
  for (const layer of layers) {
    assert.equal(sceneAt(LANDING_PROGRESS - 0.01, layer).groundContact, false);
    const landed = sceneAt(LANDING_PROGRESS, layer);
    assert.equal(landed.groundContact, true);
    assert.equal(landed.agl, 0);
    assert.equal(landed.routeProgress, 1);
    near(landed.position.y, terrainHeight(landed.position.x, landed.position.z));
    for (const progress of [8.9, 9, 9.5, 9.99]) {
      assert.deepEqual(visualState(sceneAt(progress, layer)), visualState(landed));
    }
  }
});

test('the envelope shadow lies on terrain along the fixed sun ray', () => {
  for (const layer of layers) {
    for (const progress of [0, 3.5, 4.6, 5.45, 6.4, 7.5, 8.6, 9.5]) {
      const scene = sceneAt(progress, layer);
      const t = (scene.shadow.x - scene.position.x) / -SUN_DIRECTION.x;
      assert.ok(t > 0);
      near(scene.shadow.z, scene.position.z - SUN_DIRECTION.z * t, 1e-9);
      near(scene.shadow.y - 0.018, terrainHeight(scene.shadow.x, scene.shadow.z));
      near(scene.position.y + ENVELOPE_SHADOW_HEIGHT - SUN_DIRECTION.y * t,
        terrainHeight(scene.shadow.x, scene.shadow.z), 1e-8);
      assert.ok(scene.shadow.opacity > 0 && scene.shadow.opacity <= 0.3);
      assert.ok(scene.shadow.scale > 0.9 && scene.shadow.scale < 1.1);
    }
  }
});

test('random seek order, branch previews and lab operations never mutate story history', () => {
  // Fixed seed makes the adversarial order reproducible.
  let seed = 0x4a6572;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const reference = layers.flatMap((layer) =>
    Array.from({ length: 51 }, (_, index) => ({ layer, progress: index * MAX_PROGRESS / 50, scene: sceneAt(index * MAX_PROGRESS / 50, layer) })),
  );
  for (let operation = 0; operation < 1000; operation += 1) {
    const sample = reference[Math.floor(random() * reference.length)]!;
    sceneAt(random() * MAX_PROGRESS, layers[Math.floor(random() * layers.length)]!);
    getRoute(layers[Math.floor(random() * layers.length)]!);
    buoyancy(random() * 100, ['light', 'standard', 'heavy'][Math.floor(random() * 3)] as 'light' | 'standard' | 'heavy');
    assert.deepEqual(sceneAt(sample.progress, sample.layer), sample.scene);
  }
});

test('buoyancy keeps gross support and volume assumptions fixed while inside air gets lighter', () => {
  let previousInside = Infinity;
  let previousNet = -Infinity;
  for (let warmth = 0; warmth <= 100; warmth += 1) {
    const result = buoyancy(warmth, 'standard');
    assert.equal(result.grossBuoyancy, 1);
    assert.equal(result.structureWeight, 0.16);
    assert.ok(result.internalAirWeight <= previousInside);
    assert.ok(result.net >= previousNet);
    near(result.totalWeight, result.internalAirWeight + result.structureWeight + result.payloadWeight);
    near(result.net, result.grossBuoyancy - result.totalWeight);
    previousInside = result.internalAirWeight;
    previousNet = result.net;
  }
  assert.equal(buoyancy(64, 'standard').state, 'balanced');
  near(buoyancy(64, 'standard').net, 0);
});

test('more payload only adds weight; every load can demonstrate all three states', () => {
  for (let warmth = 0; warmth <= 100; warmth += 5) {
    const values = (['light', 'standard', 'heavy'] as const).map((load) => buoyancy(warmth, load));
    assert.equal(values[0]!.grossBuoyancy, values[2]!.grossBuoyancy);
    assert.equal(values[0]!.internalAirWeight, values[2]!.internalAirWeight);
    assert.ok(values[0]!.totalWeight < values[1]!.totalWeight);
    assert.ok(values[1]!.totalWeight < values[2]!.totalWeight);
    assert.ok(values[0]!.net > values[1]!.net);
    assert.ok(values[1]!.net > values[2]!.net);
  }
  for (const load of ['light', 'standard', 'heavy'] as const) {
    const states = new Set(Array.from({ length: 101 }, (_, warmth) => buoyancy(warmth, load).state));
    assert.deepEqual(states, new Set(['heavy', 'balanced', 'rising']));
  }
});

test('invalid preferences and out-of-range inputs have finite, repeatable fallbacks', () => {
  for (const value of [null, undefined, 'HIGH', ' high ', '{}', {}, ['low'], 1, '', '__proto__']) {
    assert.equal(readPreference(value), 'middle');
  }
  for (const layer of layers) assert.equal(readPreference(layer), layer);
  assert.deepEqual(sceneAt(-1, 'high'), sceneAt(0, 'high'));
  assert.deepEqual(sceneAt(Number.NaN, 'low'), sceneAt(0, 'low'));
  assert.deepEqual(sceneAt(Infinity, 'low'), sceneAt(MAX_PROGRESS, 'low'));
  assert.deepEqual(sceneAt(-Infinity, 'high'), sceneAt(0, 'high'));
  assert.equal(sceneAt(10, 'middle').chapter, 9);
  near(sceneAt(10, 'middle').local, 0.99);
  assert.deepEqual(buoyancy(-10, 'standard'), buoyancy(0, 'standard'));
  assert.deepEqual(buoyancy(Infinity, 'heavy'), buoyancy(100, 'heavy'));
  assert.deepEqual(buoyancy(Number.NaN, 'light'), buoyancy(0, 'light'));
  assert.deepEqual(buoyancy(), buoyancy(64, 'standard'));
});
