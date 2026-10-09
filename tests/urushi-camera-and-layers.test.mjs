import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { getStoryState } from '../experiences/urushi/src/story.js';
import { getCameraState, getCameraFrame } from '../experiences/urushi/src/camera.js';
import { createVesselData, pointOnFront } from '../experiences/urushi/src/geometry.js';

test('Every repeated pass coats, cures and abrades while retaining its added layer', () => {
  for (let cycle = 0; cycle < 3; cycle++) {
    const at = t => getStoryState(5 + (cycle + t) / 3);
    const before = at(.02), coated = at(.37), cured = at(.67), abraded = at(.99);
    assert.equal(before.recoat, 0); assert.equal(coated.recoat, 1);
    assert.equal(coated.cure, 0); assert.equal(cured.cure, 1); assert.equal(cured.abrasion, 0);
    assert.ok(Math.abs(abraded.abrasion - .82) < 1e-12);
    assert.equal(abraded.abradeFront, 1);
    assert.ok(coated.layers > before.layers, `pass ${cycle + 1} leaves no layer`);
    assert.equal(abraded.layers, coated.layers, 'abrasion must not reset retained depth');
  }
  let previous = getStoryState(4.85).layers;
  for (let i = 0; i <= 1250; i++) {
    const layers = getStoryState(4.85 + i / 1000).layers;
    assert.ok(layers >= previous - 1e-12, 'retained layers moved backwards'); previous = layers;
  }
  assert.equal(getStoryState(6).layers, 1);
});

test('Front resets resolve to the same cured, abraded material in both directions', () => {
  // Endpoint requirements are independent of interior mask implementation.
  // A sweep at 0/1 must have zero/full coverage.
  const endpoint = s => {
    assert.ok(s.recoat < 1e-8 || s.recoat > 1 - 1e-8);
    const film = Math.round(s.recoat), front = Math.round(s.abradeFront);
    return {
      abrasion: s.recoatMode ? .82 * (1 - film) + s.abrasion * front * film : s.abrasion * front,
      wet: (1 - s.cure) * s.coat * (s.recoatMode ? film : 1),
      layers: s.layers, polish: s.polish, section: s.section,
    };
  };
  for (const phase of [5, 5 + 1 / 3, 5 + 2 / 3, 6]) {
    const a = endpoint(getStoryState(phase - 1e-8)), b = endpoint(getStoryState(phase + 1e-8));
    for (const field of Object.keys(a)) assert.ok(Math.abs(a[field] - b[field]) < 1e-6, `${field} jumps at ${phase}`);
  }
});

test('Camera holds resolve the object and join without position-history dependence', () => {
  const phases = Array.from({ length: 2201 }, (_, i) => i / 200), forward = phases.map(getCameraState);
  for (let i = phases.length - 1; i >= 0; i--) assert.deepEqual(getCameraState(phases[i]), forward[i]);
  for (const phase of [1.25, 3.55, 10.5]) assert.equal(getCameraState(phase).framing, 0);
  assert.deepEqual(getCameraState(8.45), getCameraState(9.55), 'gold burial must retain the same view');
  for (let phase = .01; phase < 11; phase += .01) {
    const before = getCameraState(phase - 1e-7), after = getCameraState(phase + 1e-7);
    for (const field of ['framing', 'elevation', 'turn', 'focus']) {
      assert.ok(Number.isFinite(before[field]));
      assert.ok(Math.abs(before[field] - after[field]) < .0001, `${field} is discontinuous at ${phase}`);
    }
  }
});

test('The worked shoulder remains visible in layer and gold close views at every acceptance size', () => {
  const profile = JSON.parse(readFileSync(new URL('../public/urushi/models/vessel-profile.json', import.meta.url)));
  const { positions } = createVesselData(profile), section = [], gold = [];
  for (let i = 0; i < positions.length; i += 3) {
    const p = Array.from(positions.slice(i, i + 3));
    if (p[0] > -1 && p[0] < -.72 && p[1] > -.09 && p[1] < .016 && p[2] > .8) section.push(p);
  }
  for (let branch = 0; branch < 3; branch++) {
    for (let i = 0; i <= 24; i++) {
      const x = -1.18 + i / 24 * .48, t = Math.max(0, Math.min(1, (x + 1) / 1.56));
      const y = [.075,.097,.120][branch] + [.300,.315,.330][branch] * t * t * (3 - 2 * t);
      gold.push(pointOnFront(profile, x, y).position);
    }
  }
  assert.ok(section.length > 10 && gold.length > 50, 'real material features are required');
  for (const [width, height] of [[390,844],[768,1024],[1440,900],[1920,1080],[2560,1440],[3840,2160],[1440,650],[844,390]]) {
    for (const [phase, points] of [[5.5,section],[8.45,gold],[9.55,gold]]) {
      const state = getStoryState(phase), frame = getCameraFrame(state, width, height);
      const camera = new THREE.PerspectiveCamera(frame.fov, width / height, .05, 40);
      camera.position.fromArray(frame.position); camera.lookAt(0,0,0); camera.updateMatrixWorld();
      const object = new THREE.Matrix4().compose(new THREE.Vector3().fromArray(frame.objectPosition), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), state.turn), new THREE.Vector3().setScalar(frame.scale));
      for (const point of points) {
        const p = new THREE.Vector3().fromArray(point).applyMatrix4(object).project(camera);
        const x = (p.x + 1) / 2, y = (1 - p.y) / 2;
        assert.ok(x > .04 && x < .97 && y > .15 && y < .90, `${width}x${height} phase ${phase}: worked surface outside safe view (${x},${y})`);
      }
    }
  }
});

test('Actual vessel vertices fit the three complete-form views at all eight acceptance sizes', () => {
  const profile = JSON.parse(readFileSync(new URL('../public/urushi/models/vessel-profile.json', import.meta.url)));
  const { positions } = createVesselData(profile), vertex = new THREE.Vector3();
  for (const [width, height] of [[390,844],[768,1024],[1440,900],[1920,1080],[2560,1440],[3840,2160],[1440,650],[844,390]]) {
    for (const phase of [1.25, 3.55, 10.5]) {
      const state = getStoryState(phase), frame = getCameraFrame(state, width, height);
      const camera = new THREE.PerspectiveCamera(frame.fov, width / height, .05, 40);
      camera.position.fromArray(frame.position); camera.lookAt(0,0,0); camera.updateMatrixWorld();
      const object = new THREE.Matrix4().compose(new THREE.Vector3().fromArray(frame.objectPosition), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), state.turn), new THREE.Vector3().setScalar(frame.scale));
      const bounds = { left: 1, right: 0, top: 1, bottom: 0 };
      for (let i = 0; i < positions.length; i += 3) {
        vertex.fromArray(positions, i).applyMatrix4(object).project(camera);
        const x = (vertex.x + 1) / 2, y = (1 - vertex.y) / 2;
        bounds.left = Math.min(bounds.left, x); bounds.right = Math.max(bounds.right, x);
        bounds.top = Math.min(bounds.top, y); bounds.bottom = Math.max(bounds.bottom, y);
        assert.ok(vertex.z > -1 && vertex.z < 1, 'vessel intersects camera clipping planes');
      }
      assert.ok(bounds.left > .025 && bounds.right < .99 && bounds.top > .18 && bounds.bottom < .94, `${width}x${height} phase ${phase}: ${JSON.stringify(bounds)}`);
    }
  }
});
