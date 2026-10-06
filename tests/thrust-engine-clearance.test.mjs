import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createEngine } from '../experiences/thrust/src/engine.js';

/**
 * Test the actual working components, not a second copy of the animation math.
 * Rotor and stator envelopes share the working annulus, so separated axial
 * envelopes provide a conservative clearance check. Withdrawn casing panels
 * and external service lines occupy different radial spaces and are excluded.
 */
function workingComponents(engine) {
  const components = [];
  for (const key of ['booster', 'hpc', 'hpt', 'lpt']) {
    for (const stage of engine.parts[key].children) {
      if (!stage.isGroup || !/stage \d+$/.test(stage.name)) continue;
      for (const row of stage.children) {
        if (!row.isGroup) continue;
        components.push({ name: `${stage.name} / ${row.name}`, objects: [row] });
      }
    }
  }
  assert.equal(components.length, 38, 'The 19 rotors and 19 fixed guide rows must all be checked');

  const chamber = engine.parts.combustor.children.filter((object) =>
    object.name === 'Inner annular liner' || object.name === 'Fixed air-blast fuel swirler');
  assert.equal(chamber.length, 19, 'The annular liner and all 18 fuel heads define the chamber envelope');
  components.push({ name: 'Annular combustor / liner and fuel heads', objects: chamber });

  const nozzle = engine.parts.nozzle.children.filter((object) =>
    object.name === 'Exhaust centrebody / LP bearing fairing' ||
    (object.isGroup && object.children.some((child) =>
      child.isInstancedMesh && child.name.includes('cambered aerofoil'))));
  assert.equal(nozzle.length, 2, 'Both the exhaust frame and the centrebody must be checked');
  components.push({ name: 'Exhaust / rear frame and centrebody', objects: nozzle });
  return components;
}

function capturePose(group) {
  const pose = [];
  group.traverse((object) => {
    pose.push({
      id: object.uuid,
      position: object.position.toArray(),
      rotation: object.quaternion.toArray(),
      scale: object.scale.toArray(),
      visible: object.visible,
    });
  });
  return pose;
}

test('working engine geometry stays axially separated through 5001 exploded poses and reassembles exactly', { timeout: 20000 }, (t) => {
  const engine = createEngine({ quality: 'high' });
  const assemblyTime = 1.2345;
  const scratch = new THREE.Box3();
  const box = new THREE.Box3();
  const updateBounds = (component) => {
    box.makeEmpty();
    for (const object of component.objects) box.union(scratch.setFromObject(object));
    assert.ok(Number.isFinite(box.min.z) && Number.isFinite(box.max.z), `${component.name}: finite world bounds`);
    component.front = box.min.z;
    component.back = box.max.z;
  };

  try {
    engine.update(assemblyTime);
    const assembledPose = capturePose(engine.group);
    engine.group.updateMatrixWorld(true);
    const components = workingComponents(engine);
    components.forEach(updateBounds);
    // Establish the physical order once, before anything moves. Re-sorting at
    // each sample would conceal one component overtaking another.
    components.sort((a, b) => a.front - b.front);
    assert.equal(components.length - 1, 39);

    let minimumGap = Infinity;
    let closestPair = '';
    let closestPose = 0;
    for (let sample = 0; sample <= 5000; sample++) {
      const explode = sample / 5000;
      engine.update(assemblyTime + explode, { cutaway: 1, explode, energy: 1, heat: 1 });
      engine.group.updateMatrixWorld(true);
      components.forEach(updateBounds);
      for (let i = 1; i < components.length; i++) {
        const before = components[i - 1];
        const after = components[i];
        const gap = after.front - before.back;
        assert.ok(gap > 1e-5,
          `At explode=${explode.toFixed(4)}, ${before.name} intersects ${after.name}: axial clearance ${gap}`);
        if (gap < minimumGap) {
          minimumGap = gap;
          closestPair = `${before.name} -> ${after.name}`;
          closestPose = explode;
        }
      }
    }

    engine.update(assemblyTime);
    assert.deepEqual(capturePose(engine.group), assembledPose,
      'Positions, rotations, scales and visibility must return exactly to the assembled pose');
    t.diagnostic(`5001 poses, 39 adjacent boundaries; minimum clearance ${minimumGap.toFixed(6)} at explode=${closestPose.toFixed(4)} (${closestPair}).`);
  } finally {
    engine.dispose();
  }
});
