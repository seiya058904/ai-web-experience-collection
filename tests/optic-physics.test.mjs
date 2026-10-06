import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createOptics } from "../experiences/optic/src/optics-model.js";
import { createCameraBody } from "../experiences/optic/src/camera-model.js";
import {
  createShutter,
  createSensorMicro,
  createCaptureLight,
  shutterState,
} from "../experiences/optic/src/sensor-mechanisms.js";
import { apertureLight, bayerColor } from "../experiences/optic/src/story.js";
import { refract, traceOpticalRay } from "../experiences/optic/src/light-path.js";

const near = (actual, expected, epsilon = 1e-8, message = "") => {
  assert.ok(
    Number.isFinite(actual) && Math.abs(actual - expected) <= epsilon,
    `${message}: ${actual} differs from ${expected}`,
  );
};
const use = (t, factory) => {
  const value = factory();
  t.after(() => value.dispose());
  return value;
};
const pose = (object) => ({
  position: object.position.toArray(),
  quaternion: object.quaternion.toArray(),
  scale: object.scale.toArray(),
});

test("ten glass elements form eight groups and retain surface/iris order through focus and explosion", (t) => {
  const optic = use(t, createOptics);
  assert.equal(optic.elements.length, 10);
  assert.equal(optic.opticalGroups.length, 8);
  assert.equal(
    new Set(optic.elements.map((element) => element.userData.group)).size,
    8,
  );
  assert.deepEqual(
    optic.opticalGroups.map((group) => group.elements.length),
    [1, 1, 2, 1, 1, 2, 1, 1],
  );

  for (const expansion of [0, 0.25, 0.75, 1]) {
    optic.setExplode(expansion);
    for (const focus of [0, 1]) {
      optic.setFocus(focus);
      for (let i = 0; i < optic.elements.length - 1; i++) {
        assert.ok(
          optic.elements[i].position.z > optic.elements[i + 1].position.z,
          `group ordering at expansion ${expansion}, focus ${focus}, element ${i}`,
        );
        const commonRadius = Math.min(
          optic.elementSpecs[i].radius,
          optic.elementSpecs[i + 1].radius,
        );
        for (const fraction of [0, 0.5, 1]) {
          const rear = optic.sampleSurface(i, commonRadius * fraction, "back");
          const nextFront = optic.sampleSurface(
            i + 1,
            commonRadius * fraction,
            "front",
          );
          assert.ok(
            rear + 1e-8 >= nextFront,
            `intersecting optical surfaces ${i}/${i + 1}`,
          );
        }
      }
      assert.ok(optic.sampleSurface(4, 0, "back") > optic.iris.position.z);
      assert.ok(optic.iris.position.z > optic.sampleSurface(5, 0, "front"));
    }
  }
});

test("curved glass has positive thickness and analytical surfaces agree with actual mesh raycasts", (t) => {
  const optic = use(t, createOptics);
  optic.group.updateMatrixWorld(true);
  const ray = new THREE.Raycaster();
  for (let index = 0; index < optic.elements.length; index++) {
    const spec = optic.elementSpecs[index];
    const glass = optic.elements[index].userData.glass;
    assert.ok(
      spec.frontSag !== 0 || spec.backSag !== 0,
      "element is not a flat disc",
    );
    for (const ratio of [0, 0.35, 0.75]) {
      const x = spec.radius * ratio;
      const front = optic.sampleSurface(index, x, "front");
      const back = optic.sampleSurface(index, x, "back");
      assert.ok(front > back, `nonpositive thickness in element ${index}`);
      ray.set(
        new THREE.Vector3(x, 0, spec.baseZ + 1),
        new THREE.Vector3(0, 0, -1),
      );
      const hit = ray.intersectObject(glass, false)[0];
      assert.ok(hit, `front surface missing in element ${index}`);
      near(hit.point.z, front, 0.0006, `curved surface ${index}`);
      const normal = optic.surfaceNormal(index, x, 0, "front");
      near(normal.length(), 1, 1e-12, "surface unit normal");
      assert.ok(normal.z > 0, "outward front normal faces the arriving light");
    }
  }
});

test("refraction obeys Snell’s law, preserves axial rays and reports total internal reflection", () => {
  const normal = new THREE.Vector3(0, 0, 1);
  const axial = new THREE.Vector3(0, 0, -1);
  assert.deepEqual(refract(axial, normal, 1, 1.5).toArray(), axial.toArray());
  const incident = new THREE.Vector3(0.5, 0, -Math.sqrt(3) / 2);
  const transmitted = refract(incident, normal, 1, 1.5);
  near(transmitted.x, 1 / 3, 1e-12, "air/glass sine ratio");
  near(transmitted.z, -Math.sqrt(8 / 9), 1e-12);
  near(transmitted.length(), 1, 1e-12);
  assert.deepEqual(
    incident.toArray(),
    [0.5, 0, -Math.sqrt(3) / 2],
    "input direction must remain reusable",
  );
  const aboveCritical = new THREE.Vector3(Math.sqrt(3) / 2, 0, -0.5);
  assert.equal(refract(aboveCritical, normal, 1.5, 1), null);
});

test("all three shared rays cross actual glass surfaces and reach the active sensor in assembled and exploded views", (t) => {
  const optic = use(t, createOptics);
  for (const expansion of [0, 0.25, 0.75, 1]) {
    optic.setExplode(expansion);
    for (const focus of [0, 1]) {
      optic.setFocus(focus);
      for (const fNumber of [1.4, 16]) {
        optic.setAperture(fNumber);
        const height = Math.min(0.35, optic.apertureRadius * 0.66);
        for (const entrance of [-height, 0, height]) {
          const points = traceOpticalRay(optic, entrance);
          assert.equal(
            points.length,
            22,
            "source + 20 glass surfaces + sensor",
          );
          points.forEach((point, index) => {
            assert.ok(point.toArray().every(Number.isFinite));
            if (index)
              assert.ok(
                point.z <= points[index - 1].z + 5e-6,
                "ray must keep traveling toward sensor",
              );
          });
          optic.elements.forEach((element, index) => {
            for (const [offset, side] of [
              [1, "front"],
              [2, "back"],
            ]) {
              const point = points[index * 2 + offset];
              const radius = Math.hypot(point.x, point.y);
              assert.ok(radius <= element.userData.radius);
              near(
                point.z,
                optic.sampleSurface(index, radius, side),
                2e-6,
                `surface intersection ${index}/${side}`,
              );
            }
          });
          const sensor = points.at(-1);
          near(sensor.z, 0, 1e-12);
          assert.ok(
            Math.abs(sensor.x) <= 0.72 && Math.abs(sensor.y) <= 0.48,
            "ray missed active sensor",
          );
        }
      }
    }
  }
});

test("rear focusing and lens disassembly return to their exact original transforms", (t) => {
  const optic = use(t, createOptics);
  const original = optic.elements.map(pose);
  const irisPose = pose(optic.iris);
  optic.setFocus(0);
  const nearPositions = optic.elements.map((element) => element.position.z);
  optic.setFocus(1);
  optic.elements.forEach((element, index) => {
    near(
      nearPositions[index] - element.position.z,
      index >= 8 ? 0.25 : 0,
      1e-12,
      `only focus subgroup should move: ${index}`,
    );
  });
  for (const amount of [0.93, 0.12, 1, 0.31, 0.75, 0]) {
    optic.setExplode(amount);
    optic.setFocus(amount);
  }
  optic.setExplode(0);
  optic.setFocus(0.5);
  assert.deepEqual(optic.elements.map(pose), original);
  assert.deepEqual(pose(optic.iris), irisPose);
  assert.ok(
    optic.barrel.userData.housingSegments.every((segment) => segment.visible),
  );
});

test("nine rigid blades keep fixed pivots and form a clear real opening at four aperture stops", (t) => {
  const optic = use(t, createOptics);
  assert.equal(optic.bladeMeshes.length, 9);
  assert.equal(optic.bladePivots.length, 9);
  const fixedPivots = optic.bladePivots.map((pivot) =>
    pivot.position.toArray(),
  );
  const bladeGeometry = optic.bladeMeshes[0].geometry;
  const originalVertices = bladeGeometry.attributes.position.array.slice();
  const ray = new THREE.Raycaster();

  for (const fNumber of [1.4, 2.8, 8, 16]) {
    optic.setAperture(fNumber);
    optic.group.updateMatrixWorld(true);
    assert.deepEqual(
      optic.bladePivots.map((pivot) => pivot.position.toArray()),
      fixedPivots,
    );
    assert.deepEqual(bladeGeometry.attributes.position.array, originalVertices);
    optic.bladeMeshes.forEach((blade) => {
      assert.equal(blade.geometry, bladeGeometry);
      assert.deepEqual(blade.scale.toArray(), [1, 1, 1]);
    });
    near(optic.apertureRadius * fNumber, 1, 1e-12, "calibrated clear radius");
    for (let index = 0; index < 72; index++) {
      const angle = (index * Math.PI * 2) / 72;
      // A nonagon extends slightly beyond its incircle. 1.08 lies beyond
      // every corner; 0.975 lies safely inside the physical opening.
      for (const [factor, shouldHit] of [
        [0.975, false],
        [1.08, true],
      ]) {
        const radius = optic.apertureRadius * factor;
        ray.set(
          new THREE.Vector3(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            optic.iris.position.z + 0.4,
          ),
          new THREE.Vector3(0, 0, -1),
        );
        const intersects = ray.intersectObject(optic.iris, true).length > 0;
        assert.equal(
          intersects,
          shouldHit,
          `f/${fNumber}, bearing ${index}, radius ${factor}`,
        );
      }
    }
  }
});

test("photometric light falls with the square of f-number and matches the authored opening", (t) => {
  const optic = use(t, createOptics);
  optic.setAperture(1.4);
  const maximumRadius = optic.apertureRadius;
  let previous = Infinity;
  for (const fNumber of [1.4, 2.8, 4, 8, 16]) {
    optic.setAperture(fNumber);
    const light = apertureLight(fNumber);
    near(
      light,
      (optic.apertureRadius / maximumRadius) ** 2,
      1e-12,
      "relative aperture area",
    );
    assert.ok(light < previous);
    previous = light;
  }
  near(apertureLight(2.8) / apertureLight(1.4), 0.25);
  near(apertureLight(8) / apertureLight(4), 0.25);
});

test("the actual active sensor is 1.44 × 0.96 at the optical image plane", (t) => {
  const camera = use(t, createCameraBody);
  const micro = use(t, createSensorMicro);
  camera.group.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(camera.sensorSurface, true);
  const size = bounds.getSize(new THREE.Vector3());
  near(size.x, 1.44, 1e-6);
  near(size.y, 0.96, 1e-6);
  near(size.x / size.y, 3 / 2, 1e-6);
  near(bounds.getCenter(new THREE.Vector3()).z, 0, 1e-12);
  near(micro.group.userData.activeWidth, size.x, 1e-6);
  near(micro.group.userData.activeHeight, size.y, 1e-6);
});

test("IBIS moves one nested sensor in its plane while the outer cradle remains fixed", (t) => {
  const camera = use(t, createCameraBody);
  const { sensor, ibis } = camera.parts;
  assert.equal(sensor.parent, ibis);
  const fixedObjects = [];
  ibis.traverse((object) => {
    let cursor = object;
    while (cursor && cursor !== sensor && cursor !== ibis)
      cursor = cursor.parent;
    if (cursor !== sensor) fixedObjects.push(object);
  });
  const fixedPoses = fixedObjects.map(pose);
  const z = sensor.position.z;
  for (const displacement of [
    { x: 0.1, y: -0.06, roll: 0.04 },
    { x: -0.11, y: 0.08, roll: -0.035 },
    { x: 100, y: -100, roll: 100 },
    {},
  ]) {
    camera.setIBIS(displacement);
    assert.deepEqual(fixedObjects.map(pose), fixedPoses);
    near(sensor.position.z, z);
    near(sensor.rotation.x, 0);
    near(sensor.rotation.y, 0);
    assert.ok(
      Math.abs(sensor.position.x) <= 0.16 &&
        Math.abs(sensor.position.y) <= 0.12,
    );
    assert.ok(Math.abs(sensor.rotation.z) <= 0.09);
    camera.group.updateMatrixWorld(true);
    const normal = new THREE.Vector3(0, 0, 1).transformDirection(
      camera.sensorSurface.matrixWorld,
    );
    near(normal.x, 0);
    near(normal.y, 0);
    near(normal.z, 1);
  }
});

test("both actual shutter edges sweep downward and their six slats stay rigid", (t) => {
  const shutter = use(t, createShutter);
  shutter.setExposure(1 / 2000);
  const firstEdge = shutter.firstCurtain.getObjectByName(
    "firstCurtain-leading-edge",
  );
  const secondEdge = shutter.secondCurtain.getObjectByName(
    "secondCurtain-leading-edge",
  );
  const bladeSets = [
    shutter.firstCurtain.getObjectByName("firstCurtain-rigid-blades"),
    shutter.secondCurtain.getObjectByName("secondCurtain-rigid-blades"),
  ];
  const matrix = new THREE.Matrix4();
  const scale = new THREE.Vector3();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  let firstPrevious = Infinity;
  let secondPrevious = Infinity;
  for (let index = 0; index <= 24; index++) {
    const state = shutter.setPhase(0.12 + (index / 24) * 0.68);
    assert.ok(firstEdge.position.y <= firstPrevious + 1e-12);
    assert.ok(secondEdge.position.y <= secondPrevious + 1e-12);
    near(firstEdge.position.y, state.firstEdgeY);
    near(secondEdge.position.y, state.secondEdgeY);
    firstPrevious = firstEdge.position.y;
    secondPrevious = secondEdge.position.y;
    for (const blades of bladeSets) {
      assert.equal(blades.count, 6);
      for (let blade = 0; blade < blades.count; blade++) {
        blades.getMatrixAt(blade, matrix);
        matrix.decompose(position, quaternion, scale);
        assert.deepEqual(scale.toArray(), [1, 1, 1]);
      }
    }
  }
});

test("1/2000 s exposure is a traveling 0.125-height slit and never uncovers the full sensor", (t) => {
  const shutter = use(t, createShutter);
  shutter.setExposure(1 / 2000);
  let maximum = 0;
  for (let index = 0; index <= 256; index++) {
    const state = shutter.setPhase(0.12 + (index / 256) * 0.68);
    assert.equal(state.fullyOpen, false);
    maximum = Math.max(maximum, state.openHeight);
  }
  near(maximum, 0.125, 1e-12, "short-exposure slit height");
  const middle = shutter.setPhase(0.46);
  assert.ok(middle.firstTravel > 0 && middle.firstTravel < 1);
  assert.ok(middle.secondTravel > 0 && middle.secondTravel < 1);
  const actualGap =
    shutter.secondCurtain.getObjectByName("secondCurtain-leading-edge").position
      .y -
    shutter.firstCurtain.getObjectByName("firstCurtain-leading-edge").position
      .y;
  near(actualGap, 0.125, 1e-12, "actual mesh edge separation");
});

test("1/125 s exposure provides a genuinely fully uncovered frame between curtain sweeps", (t) => {
  const shutter = use(t, createShutter);
  shutter.setExposure(1 / 125);
  const state = shutter.setPhase(0.46);
  assert.equal(state.fullyOpen, true);
  near(state.openFraction, 1);
  near(shutter.firstCurtain.userData.travel, 1);
  near(shutter.secondCurtain.userData.travel, 0);
  near(shutter.setPhase(0.8).openFraction, 0);
});

test("every sampled sensor row receives the selected exposure at fast and slow shutter settings", () => {
  function crossingTime(exposure, rowFraction, edgeName) {
    let low = 0.12;
    let high = 0.8;
    for (let iteration = 0; iteration < 55; iteration++) {
      const middle = (low + high) / 2;
      if (shutterState(middle, exposure)[edgeName] >= rowFraction)
        high = middle;
      else low = middle;
    }
    return shutterState((low + high) / 2, exposure).physicalTime;
  }
  for (const exposure of [1 / 2000, 1 / 125]) {
    for (const row of [0.001, 0.125, 0.25, 0.5, 0.75, 0.875, 0.999]) {
      const opens = crossingTime(exposure, row, "firstTravel");
      const closes = crossingTime(exposure, row, "secondTravel");
      near(closes - opens, exposure, 1e-10, `row ${row} exposure`);
    }
  }
});

test("a closed first or second curtain stops every capture ray and prevents sensor charge", (t) => {
  const shutter = use(t, createShutter);
  const capture = use(t, createCaptureLight);
  const positions = capture.group.getObjectByName("curtain-gated-short-rays")
    .geometry.attributes.position;
  const charges = capture.group.getObjectByName("charge-endpoints");
  const matrix = new THREE.Matrix4();
  const scale = new THREE.Vector3();
  for (const [phase, expectedBlocker] of [
    [0.08, "firstCurtain"],
    [0.8, "secondCurtain"],
  ]) {
    const state = shutter.setPhase(phase);
    near(state.openFraction, 0);
    // Cover a complete packet cycle: a closed gate must never leave an
    // independently pulsing electrical endpoint visible behind the curtains.
    for (let step = 0; step <= 30; step++) {
      const rays = capture.update(step / 10, state);
      rays.forEach((ray, index) => {
        assert.equal(ray.blocked, true);
        assert.equal(ray.blocker, expectedBlocker);
        assert.ok(ray.endZ > 0.02, "blocked light must stop before the sensor");
        near(positions.getZ(index * 2 + 1), ray.endZ, 1e-7);
        charges.getMatrixAt(index, matrix);
        scale.setFromMatrixScale(matrix);
        assert.deepEqual(
          scale.toArray(),
          [0, 0, 0],
          "closed gate produced sensor charge",
        );
      });
    }
  }
});

test("the 1/2000 s middle slit passes only the central capture beam through the actual curtains", (t) => {
  const shutter = use(t, createShutter);
  const capture = use(t, createCaptureLight);
  shutter.setExposure(1 / 2000);
  const state = shutter.setPhase(0.46);
  const rays = capture.update(1, state);
  assert.deepEqual(
    rays.map((ray) => ray.blocker),
    ["firstCurtain", null, "secondCurtain"],
  );
  assert.deepEqual(
    rays.map((ray) => ray.blocked),
    [true, false, true],
  );
  const positions = capture.group.getObjectByName("curtain-gated-short-rays")
    .geometry.attributes.position;
  const rows = [-0.21, 0.03, 0.21];
  const source = new THREE.Vector3();
  const diode = new THREE.Vector3();
  const caster = new THREE.Raycaster();
  shutter.group.updateMatrixWorld(true);
  rays.forEach((ray, index) => {
    source.fromBufferAttribute(positions, index * 2);
    diode.set(0.03, rows[index], 0.02);
    caster.set(source, diode.clone().sub(source).normalize());
    caster.far = source.distanceTo(diode);
    const hit = caster.intersectObjects(
      [shutter.firstCurtain, shutter.secondCurtain],
      true,
    )[0];
    assert.equal(
      Boolean(hit),
      ray.blocked,
      `rendered curtain disagrees with beam ${index}`,
    );
    if (hit) {
      assert.equal(hit.object.parent.name, ray.blocker);
      // The optical endpoint sits just in front of the thin overlapping slats.
      assert.ok(Math.abs(ray.endZ - hit.point.z) < 0.015);
    } else {
      near(positions.getX(index * 2 + 1), diode.x, 1e-7);
      near(positions.getY(index * 2 + 1), diode.y, 1e-7);
      near(positions.getZ(index * 2 + 1), diode.z, 1e-7);
    }
  });
});

test("capture charge appears at the sensor endpoint only after its optical packet has arrived", (t) => {
  const capture = use(t, createCaptureLight);
  const state = shutterState(1);
  const packets = capture.group.getObjectByName("short-optical-packets");
  const charges = capture.group.getObjectByName("charge-endpoints");
  const positions = capture.group.getObjectByName("curtain-gated-short-rays")
    .geometry.attributes.position;
  const matrix = new THREE.Matrix4();
  const scale = new THREE.Vector3();
  const point = new THREE.Vector3();
  const endpoint = new THREE.Vector3();
  const arrivalCounts = [0, 0, 0];
  for (let step = 0; step <= 720; step++) {
    const rays = capture.update(step / 240, state);
    rays.forEach((ray, index) => {
      assert.equal(ray.blocked, false);
      charges.getMatrixAt(index, matrix);
      scale.setFromMatrixScale(matrix);
      if (scale.lengthSq() < 1e-16) return;
      arrivalCounts[index]++;
      endpoint.fromBufferAttribute(positions, index * 2 + 1);
      point.setFromMatrixPosition(matrix);
      near(
        point.distanceTo(endpoint),
        0,
        1e-7,
        "charge must lie at the optical endpoint",
      );
      near(point.z, 0.02, 1e-7, "charge must remain on the sensitive plane");
      assert.ok(Math.abs(point.x) < 0.72 && Math.abs(point.y) < 0.48);
      packets.getMatrixAt(index, matrix);
      point.setFromMatrixPosition(matrix);
      near(
        point.distanceTo(endpoint),
        0,
        1e-7,
        "charge appeared before the photon reached the sensor",
      );
      scale.setFromMatrixScale(matrix);
      near(
        scale.lengthSq(),
        0,
        1e-16,
        "light must end when it becomes sensor charge",
      );
    });
  }
  assert.ok(
    arrivalCounts.every((count) => count > 0),
    "each unobstructed beam must produce a charge arrival",
  );
});

test("the instanced sensor implements RGGB with twice as many green filters and one lens per cell", (t) => {
  const micro = use(t, createSensorMicro);
  const { columns, rows, activeWidth, activeHeight } = micro.group.userData;
  const count = columns * rows;
  const pitch = activeWidth / columns;
  const filterNames = [
    ["red-filters", "R", count / 4],
    ["green-filters", "G", count / 2],
    ["blue-filters", "B", count / 4],
  ];
  const cells = new Map();
  const matrix = new THREE.Matrix4();
  const center = new THREE.Vector3();
  for (const [name, color, expectedCount] of filterNames) {
    const filters = micro.layers.filters.getObjectByName(name);
    assert.ok(filters?.isInstancedMesh);
    assert.equal(filters.count, expectedCount);
    for (let index = 0; index < filters.count; index++) {
      filters.getMatrixAt(index, matrix);
      center.setFromMatrixPosition(matrix);
      const col = Math.round((center.x + activeWidth / 2) / pitch - 0.5);
      const row = Math.round((activeHeight / 2 - center.y) / pitch - 0.5);
      assert.ok(col >= 0 && col < columns && row >= 0 && row < rows);
      const key = `${col},${row}`;
      assert.ok(!cells.has(key), `duplicate filter at ${key}`);
      assert.equal(color, bayerColor(col, row));
      cells.set(key, color);
    }
  }
  assert.equal(cells.size, count);
  assert.deepEqual(
    ["0,0", "1,0", "0,1", "1,1"].map((key) => cells.get(key)),
    ["R", "G", "G", "B"],
  );
  assert.equal(
    micro.layers.microlenses.getObjectByName("individual-glass-microlenses")
      .count,
    count,
  );
  assert.equal(
    micro.layers.photodiodes.getObjectByName("photodiode-wells").count,
    count,
  );
});

test("microlenses, filters, photodiodes and readout retain their physical layer order when separated", (t) => {
  const micro = use(t, createSensorMicro);
  const original = Object.values(micro.layers).map(pose);
  for (const amount of [0, 0.3, 1, 0.62, 0.15, 0]) {
    micro.setProgress(amount);
    micro.update(4.2);
    const { microlenses, filters, photodiodes, substrate, readout } =
      micro.layers;
    assert.ok(microlenses.position.z > filters.position.z);
    assert.ok(filters.position.z > photodiodes.position.z);
    assert.ok(photodiodes.position.z > readout.position.z);
    assert.ok(readout.position.z > substrate.position.z);
  }
  assert.deepEqual(Object.values(micro.layers).map(pose), original);
});
