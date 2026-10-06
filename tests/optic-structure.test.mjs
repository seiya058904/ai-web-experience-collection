import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  chapters,
  makeTimeline,
  sampleTimeline,
  apertureFromProgress,
} from "../experiences/optic/src/story.js";
import { createOptics } from "../experiences/optic/src/optics-model.js";
import { createCameraBody } from "../experiences/optic/src/camera-model.js";
import {
  createShutter,
  createSensorMicro,
  createCaptureLight,
} from "../experiences/optic/src/sensor-mechanisms.js";

const near = (actual, expected, epsilon = 1e-9) => {
  assert.ok(
    Number.isFinite(actual) && Math.abs(actual - expected) <= epsilon,
    `${actual} differs from ${expected}`,
  );
};
const use = (t, factory) => {
  const value = factory();
  t.after(() => value.dispose());
  return value;
};
const pose = (object) => [
  object.position.toArray(),
  object.quaternion.toArray(),
  object.scale.toArray(),
];

test("nine scenes cover one contiguous desktop and mobile timeline with nonzero viewing holds", () => {
  const expectedIds = [
    "light",
    "optics",
    "focus",
    "aperture",
    "shutter",
    "sensor",
    "stability",
    "machine",
    "image",
  ];
  assert.deepEqual(
    chapters.map((chapter) => chapter.id),
    expectedIds,
  );
  for (const mobile of [false, true]) {
    const timeline = makeTimeline(mobile);
    assert.equal(timeline.scenes.length, 9);
    assert.equal(timeline.scenes[0].start, 0);
    timeline.scenes.forEach((scene, index) => {
      assert.ok(Number.isFinite(scene.length) && scene.length > 0);
      near(scene.end - scene.start, scene.length);
      assert.ok(
        scene.start < scene.holdStart &&
          scene.holdStart < scene.holdEnd &&
          scene.holdEnd < scene.end,
      );
      assert.ok(scene.holdEnd - scene.holdStart > scene.length * 0.4);
      if (index) near(timeline.scenes[index - 1].end, scene.start);
    });
    near(timeline.scenes.at(-1).end, timeline.total);
  }
});

test("sampling covers every point and boundary with finite normalized state and unit total visibility", () => {
  for (const mobile of [false, true]) {
    const timeline = makeTimeline(mobile);
    const positions = Array.from(
      { length: 513 },
      (_, index) => (index / 512) * timeline.total,
    );
    positions.push(-100, timeline.total + 100);
    for (const scene of timeline.scenes) {
      for (const boundary of [
        scene.start,
        scene.holdStart,
        scene.holdEnd,
        scene.end,
      ]) {
        positions.push(boundary - 1e-7, boundary, boundary + 1e-7);
      }
    }
    for (const position of positions) {
      const state = sampleTimeline(timeline, position);
      assert.ok(state.active >= 0 && state.active < 9);
      assert.ok(state.from >= 0 && state.to < 9 && state.to >= state.from);
      for (const value of [
        state.local,
        state.mix,
        state.normalized,
        ...state.locals,
        ...state.weights,
      ]) {
        assert.ok(
          Number.isFinite(value) && value >= 0 && value <= 1,
          `invalid scene value at ${position}`,
        );
      }
      near(
        state.weights.reduce((sum, weight) => sum + weight, 0),
        1,
        1e-12,
      );
    }
  }
});

test("visual handoffs are continuous and blend only neighboring scenes", () => {
  for (const mobile of [false, true]) {
    const timeline = makeTimeline(mobile);
    for (let index = 0; index < timeline.scenes.length - 1; index++) {
      const outgoing = timeline.scenes[index];
      const incoming = timeline.scenes[index + 1];
      const mid = sampleTimeline(
        timeline,
        (outgoing.holdEnd + incoming.holdStart) / 2,
      );
      assert.equal(mid.from, index);
      assert.equal(mid.to, index + 1);
      near(mid.weights[index], 0.5);
      near(mid.weights[index + 1], 0.5);
      assert.equal(mid.weights.filter((weight) => weight > 0).length, 2);
      for (const boundary of [
        outgoing.holdEnd,
        outgoing.end,
        incoming.holdStart,
      ]) {
        const before = sampleTimeline(timeline, boundary - 1e-7);
        const after = sampleTimeline(timeline, boundary + 1e-7);
        before.weights.forEach((weight, scene) => {
          assert.ok(
            Math.abs(weight - after.weights[scene]) < 1e-5,
            `visible discontinuity near ${boundary}`,
          );
        });
      }
    }
  }
});

test("stable compositions retain advancing local progress for living holds", () => {
  for (const mobile of [false, true]) {
    const timeline = makeTimeline(mobile);
    timeline.scenes.forEach((scene) => {
      const early = sampleTimeline(timeline, scene.start + scene.length * 0.3);
      const late = sampleTimeline(timeline, scene.start + scene.length * 0.7);
      for (const state of [early, late]) {
        assert.equal(state.from, scene.index);
        assert.equal(state.to, scene.index);
        near(state.weights[scene.index], 1);
      }
      assert.ok(late.local > early.local + 0.39);
    });
  }
});

test("mobile timing keeps the same story and scene-local anchors with a shorter overall traversal", () => {
  const desktop = makeTimeline(false);
  const mobile = makeTimeline(true);
  assert.ok(mobile.total < desktop.total);
  assert.deepEqual(
    mobile.scenes.map((scene) => scene.id),
    desktop.scenes.map((scene) => scene.id),
  );
  desktop.scenes.forEach((scene, index) => {
    const mobileScene = mobile.scenes[index];
    assert.ok(mobileScene.length <= scene.length);
    for (const local of [0.25, 0.5, 0.7]) {
      const wide = sampleTimeline(desktop, scene.start + local * scene.length);
      const narrow = sampleTimeline(
        mobile,
        mobileScene.start + local * mobileScene.length,
      );
      assert.equal(wide.active, narrow.active);
      near(wide.local, narrow.local);
      assert.deepEqual(wide.weights, narrow.weights);
    }
  });
});

test("fast forward/reverse sampling is stateless and aperture progression remains bounded", () => {
  for (const mobile of [false, true]) {
    const timeline = makeTimeline(mobile);
    const original = JSON.stringify(timeline);
    const fractions = [0, 0.97, 0.03, 0.72, 0.15, 0.91, 0.31, 1, 0.48, 0.01];
    const reference = fractions.map((fraction) =>
      sampleTimeline(timeline, fraction * timeline.total),
    );
    for (const index of [8, 0, 7, 2, 9, 1, 5, 3, 6, 4, 0, 9]) {
      assert.deepEqual(
        sampleTimeline(timeline, fractions[index] * timeline.total),
        reference[index],
      );
    }
    assert.equal(
      JSON.stringify(timeline),
      original,
      "sampling must not mutate the timeline",
    );
  }
  const values = Array.from({ length: 101 }, (_, index) =>
    apertureFromProgress(index / 100),
  );
  values.forEach((value, index) => {
    assert.ok(Number.isFinite(value) && value >= 1.4 && value <= 16);
    if (index) assert.ok(value >= values[index - 1]);
  });
  near(values[0], 1.4);
  near(values.at(-1), 16);
});

test("all authored meshes and instance transforms remain finite at extreme mechanism states", (t) => {
  const optic = use(t, createOptics);
  const camera = use(t, createCameraBody);
  const shutter = use(t, createShutter);
  const micro = use(t, createSensorMicro);
  const capture = use(t, createCaptureLight);
  optic.setExplode(1);
  optic.setAperture(16);
  optic.setFocus(0);
  camera.setExplode(1);
  camera.setIBIS({ x: -0.16, y: 0.12, roll: -0.09 });
  shutter.setExposure(1 / 2000);
  shutter.setPhase(0.46);
  micro.setProgress(1);
  micro.update(125.73);
  capture.update(125.73, shutter.getState());
  const seen = new Set();
  for (const model of [optic, camera, shutter, micro, capture]) {
    model.group.updateMatrixWorld(true);
    let meshes = 0;
    model.group.traverse((object) => {
      assert.ok(
        object.matrixWorld.elements.every(Number.isFinite),
        `invalid matrix: ${object.name}`,
      );
      if (object.isMesh) meshes++;
      if (object.isInstancedMesh) {
        assert.ok(
          object.instanceMatrix.array.every(Number.isFinite),
          `invalid instance: ${object.name}`,
        );
      }
      const geometry = object.geometry;
      if (!geometry || seen.has(geometry)) return;
      seen.add(geometry);
      const positions = geometry.getAttribute("position");
      assert.ok(positions?.count > 0, `empty geometry: ${object.name}`);
      for (const attribute of Object.values(geometry.attributes)) {
        assert.ok(
          attribute.array.every(Number.isFinite),
          `invalid geometry attribute: ${object.name}`,
        );
      }
      if (geometry.index) {
        assert.ok(
          geometry.index.array.every(
            (index) => index >= 0 && index < positions.count,
          ),
          `invalid index buffer: ${object.name}`,
        );
      }
    });
    assert.ok(meshes > 0);
  }
});

test("camera disassembly is staged, preserves the optical hierarchy and returns exact bounds", (t) => {
  const camera = use(t, createCameraBody);
  const { frontShell, rearShell, chassis, ibis, sensor, pcb } = camera.parts;
  camera.group.updateMatrixWorld(true);
  const originalBounds = new THREE.Box3().setFromObject(camera.group, true);
  const original = Object.fromEntries(
    Object.entries(camera.parts).map(([name, part]) => [name, pose(part)]),
  );
  camera.setExplode(0.1);
  assert.ok(frontShell.position.z > original.frontShell[0][2]);
  assert.ok(rearShell.position.z < original.rearShell[0][2]);
  near(chassis.position.z, original.chassis[0][2]);
  near(sensor.position.z, original.sensor[0][2]);
  camera.setExplode(0.32);
  assert.ok(chassis.position.z > original.chassis[0][2]);
  near(sensor.position.z, original.sensor[0][2]);
  camera.setExplode(0.75);
  assert.ok(sensor.position.z > original.sensor[0][2]);
  assert.equal(sensor.parent, ibis);
  assert.ok(chassis.position.z > ibis.position.z);
  assert.ok(ibis.position.z > pcb.position.z);
  for (const expansion of [1, 0.04, 0.93, 0.27, 0.7, 0])
    camera.setExplode(expansion);
  camera.setIBIS();
  camera.group.updateMatrixWorld(true);
  const returnedBounds = new THREE.Box3().setFromObject(camera.group, true);
  assert.deepEqual(returnedBounds.min.toArray(), originalBounds.min.toArray());
  assert.deepEqual(returnedBounds.max.toArray(), originalBounds.max.toArray());
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(camera.parts).map(([name, part]) => [name, pose(part)]),
    ),
    original,
  );
});

test("portrait inspection preserves depth order and restores exact desktop and assembled poses", (t) => {
  const camera = use(t, createCameraBody);
  const snapshot = () =>
    Object.fromEntries(
      Object.entries(camera.parts).map(([name, part]) => [name, pose(part)]),
    );
  const assembled = snapshot();
  const originalBounds = new THREE.Box3().setFromObject(camera.group, true);
  camera.setExplode(1);
  const desktop = snapshot();
  const { frontShell, chassis, shutterFrame, sensor, ibis, pcb, rearShell } =
    camera.parts;
  const position = new THREE.Vector3();
  for (const amount of [0.15, 1, 0.42, 0.86, 0.34, 1]) {
    camera.setExplode(amount, { portrait: true });
    camera.group.updateMatrixWorld(true);
    const layers = [frontShell, chassis, shutterFrame, sensor, pcb, rearShell];
    const depths = layers.map((layer) => layer.getWorldPosition(position).z);
    depths.forEach((depth, index) => {
      if (index) assert.ok(depths[index - 1] > depth);
    });
    assert.equal(
      sensor.parent,
      ibis,
      "portrait composition must retain the sensor carriage",
    );
  }
  assert.ok(
    Math.abs(ibis.position.x - shutterFrame.position.x) > 1,
    "the shutter and sensor need distinct inspection sightlines",
  );
  camera.setExplode(1);
  assert.deepEqual(
    snapshot(),
    desktop,
    "portrait offsets leaked into desktop disassembly",
  );
  camera.setExplode(0, { portrait: true });
  camera.group.updateMatrixWorld(true);
  const returnedBounds = new THREE.Box3().setFromObject(camera.group, true);
  assert.deepEqual(
    snapshot(),
    assembled,
    "portrait reassembly changed a part transform",
  );
  assert.deepEqual(returnedBounds.min.toArray(), originalBounds.min.toArray());
  assert.deepEqual(returnedBounds.max.toArray(), originalBounds.max.toArray());
});

test("every factory disposes geometry, material, texture and instance resources exactly once", () => {
  for (const factory of [
    createOptics,
    createCameraBody,
    createShutter,
    createSensorMicro,
    createCaptureLight,
  ]) {
    const model = factory();
    const resources = new Set();
    const disposals = new Map();
    const parent = new THREE.Group();
    parent.add(model.group);
    model.group.traverse((object) => {
      if (object.geometry) resources.add(object.geometry);
      if (object.isInstancedMesh) resources.add(object);
      const materials = object.material
        ? Array.isArray(object.material)
          ? object.material
          : [object.material]
        : [];
      for (const material of materials) {
        resources.add(material);
        Object.values(material).forEach((value) => {
          if (value?.isTexture) resources.add(value);
        });
      }
    });
    resources.forEach((resource) => {
      disposals.set(resource, 0);
      resource.addEventListener("dispose", () =>
        disposals.set(resource, disposals.get(resource) + 1),
      );
    });
    try {
      model.dispose();
      model.dispose();
      assert.equal(
        model.group.parent,
        null,
        `${factory.name}: scene parent retained`,
      );
      assert.equal(
        model.group.children.length,
        0,
        `${factory.name}: scene children retained`,
      );
      resources.forEach((resource) => {
        assert.equal(
          disposals.get(resource),
          1,
          `${factory.name}: ${resource.type || resource.constructor.name} disposal`,
        );
      });
    } finally {
      // Also clean up if a future implementation fails its disposal contract.
      resources.forEach((resource) => {
        if (!disposals.get(resource)) resource.dispose();
      });
      model.group.removeFromParent();
      model.group.clear();
    }
  }
});
