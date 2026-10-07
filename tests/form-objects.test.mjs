import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createChair } from '../experiences/form/src/world/chair.js';
import { createLamp, createTable } from '../experiences/form/src/world/objects.js';
import { samplePose, cameraSpan, mix } from '../experiences/form/src/director.js';

const factories = [createChair, createLamp, createTable];

function sourceMaterials() {
  const map = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  const materials = Object.fromEntries(['wood', 'woodEdge', 'metal', 'darkMetal', 'stone', 'diffuser', 'rubber']
    .map(name => [name, new THREE.MeshStandardMaterial({ color: 0x888888, roughness: .5, map })]));
  return { materials, map, dispose() { for (const material of Object.values(materials)) material.dispose(); map.dispose(); } };
}

function setup(t, factory) {
  const sources = sourceMaterials();
  const object = factory(sources.materials);
  t.after(() => { object.dispose(); sources.dispose(); });
  return object;
}

function transformState(group) {
  const result = [];
  group.traverse(object => {
    const materials = object.material ? [object.material].flat() : [];
    result.push({
      position: object.position.toArray(), quaternion: object.quaternion.toArray(), scale: object.scale.toArray(),
      visible: object.visible,
      drawRange: object.geometry ? { ...object.geometry.drawRange } : null,
      materials: materials.map(material => ({ opacity: material.opacity, transparent: material.transparent, depthWrite: material.depthWrite })),
    });
  });
  return result;
}

test('Light retains the complete lamp body in narrow desktop and portrait cameras', t => {
  const lamp = setup(t, createLamp);
  const point = new THREE.Vector3();
  for (const [width, height, mobile] of [[751, 1024, false], [768, 1024, false], [1425, 900, false], [390, 844, true]]) {
    const aspect = width / height;
    for (const progress of [4.18, 4.25, 4.4, 4.68]) {
      const pose = samplePose(progress, mobile);
      lamp.group.position.set(pose.lx, pose.ly, pose.lz);
      lamp.group.rotation.set(0, pose.lr, 0);
      lamp.group.scale.setScalar(pose.ls);
      lamp.setExplode(pose.le);
      lamp.group.updateMatrixWorld(true);
      const camera = new THREE.PerspectiveCamera(mix(32, 6, pose.dimensions), aspect, .01, 100);
      const distance = cameraSpan(pose, aspect, mobile) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
      camera.position.set(0, pose.lookY + Math.sin(pose.pitch) * distance, Math.cos(pose.pitch) * distance);
      camera.lookAt(0, pose.lookY, 0);
      camera.updateMatrixWorld();
      lamp.group.traverse(mesh => {
        // The trailing floor cable is allowed to leave the composed picture;
        // the shade, stem and weighted base are the complete study subject.
        if (!mesh.isMesh || !mesh.visible || lamp.cable.getObjectById(mesh.id)) return;
        const positions = mesh.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          point.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld).project(camera);
          assert.ok(Math.abs(point.x) < .96 && Math.abs(point.y) < .96,
            `${width}×${height}, Light ${progress}: ${mesh.name} left the stable frame`);
        }
      });
    }
  }
  for (const progress of [0, 1.4, 2.4, 3.4, 5.4, 6.4, 7.4]) {
    const pose = samplePose(progress);
    assert.equal(cameraSpan(pose, .75), pose.span, 'other studies must retain their camera scale');
  }
  const portrait = samplePose(4.4, true);
  assert.equal(cameraSpan(portrait, 390 / 844, true), portrait.span);
  const wide = samplePose(4.4);
  assert.equal(cameraSpan(wide, 1.6), wide.span);
});

test('original meshes have finite vertices, valid indices and unit surface normals', t => {
  for (const factory of factories) {
    const object = setup(t, factory);
    object.setSection?.(.65);
    let meshCount = 0;
    object.group.traverse(mesh => {
      if (!mesh.isMesh) return;
      meshCount++;
      const geometry = mesh.geometry;
      const position = geometry.getAttribute('position');
      const normal = geometry.getAttribute('normal');
      assert.ok(position && normal && position.count === normal.count, `${mesh.name}: complete surface attributes`);
      for (const attribute of Object.values(geometry.attributes)) {
        for (const value of attribute.array) assert.ok(Number.isFinite(value), `${mesh.name}: non-finite geometry`);
      }
      for (let index = 0; index < normal.count; index++) {
        const length = Math.hypot(normal.getX(index), normal.getY(index), normal.getZ(index));
        assert.ok(Math.abs(length - 1) < 5e-5, `${mesh.name}: normal ${index} has length ${length}`);
      }
      if (geometry.index) {
        for (const index of geometry.index.array) assert.ok(index >= 0 && index < position.count, `${mesh.name}: index outside vertex buffer`);
      }
    });
    assert.ok(meshCount > 0, `${factory.name}: no object geometry`);
  }
});

test('repeated explode and reveal seeks restore exact part transforms without drift', t => {
  for (const factory of factories) {
    const object = setup(t, factory);
    object.setExplode(0);
    object.setReveal(1);
    const assembled = transformState(object.group);
    object.setExplode(.37);
    object.setReveal(.61);
    const expected = transformState(object.group);
    for (const value of [1, 0, .82, .12, 1, 0, .42, .07]) {
      object.setExplode(value);
      object.setReveal(1 - value);
    }
    object.setExplode(.37);
    object.setReveal(.61);
    assert.deepEqual(transformState(object.group), expected, `${factory.name}: state depends on scroll history`);
    object.setExplode(0);
    object.setReveal(1);
    assert.deepEqual(transformState(object.group), assembled, `${factory.name}: did not return to the complete assembly`);
    object.group.traverse(mesh => {
      if (!mesh.isMesh) return;
      if (mesh.geometry.drawRange.count !== Infinity) {
        assert.equal(mesh.geometry.drawRange.count, mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count);
      }
    });
  }
});

test('lamp cutaway stays registered after parent transforms, explosion and reverse slicing', t => {
  const lamp = setup(t, createLamp);
  const parent = new THREE.Group();
  parent.position.set(-.43, .17, .81);
  parent.rotation.set(.19, -.61, .11);
  parent.scale.set(1.14, .87, 1.36);
  parent.add(lamp.group);
  lamp.group.position.set(.31, -.24, .18);
  lamp.group.rotation.set(.12, .48, -.08);
  lamp.group.scale.setScalar(2.2);
  const edge = lamp.parts.shade.children.find(child => child.geometry?.attributes.position.usage === THREE.DynamicDrawUsage);
  assert.ok(edge, 'cutaway must expose physical material thickness');
  lamp.setSection(.64);
  const reference = Array.from(edge.geometry.attributes.position.array);
  for (const amount of [.16, .5, 1, .83, .24, .64]) {
    lamp.setExplode(amount * .4);
    lamp.setSection(amount);
    parent.rotation.y += .1;
    lamp.updateSectionPlane();
    parent.updateMatrixWorld(true);
    assert.ok(edge.visible, 'cut edge disappeared inside the object');
    const positions = edge.geometry.attributes.position;
    for (let index = 0; index < positions.count; index++) {
      const worldPoint = new THREE.Vector3().fromBufferAttribute(positions, index).applyMatrix4(edge.matrixWorld);
      assert.ok(Math.abs(lamp.sectionPlane.distanceToPoint(worldPoint)) < 1e-6, `cut edge detached from section plane at ${amount}`);
    }
    assert.ok(Math.abs(lamp.sectionPlane.normal.length() - 1) < 1e-10);
  }
  assert.deepEqual(Array.from(edge.geometry.attributes.position.array), reference, 'section mesh drifted during reverse seek');
  lamp.setSection(0);
  assert.equal(edge.visible, false, 'closed object must hide its section ribbon');
});

test('object disposal releases owned resources and preserves shared materials and textures', () => {
  for (const factory of factories) {
    const source = sourceMaterials();
    const object = factory(source.materials);
    const geometries = new Set();
    const materials = new Set();
    object.group.traverse(child => {
      if (child.geometry) geometries.add(child.geometry);
      if (child.material) for (const material of [child.material].flat()) materials.add(material);
    });
    const shared = new Set(Object.values(source.materials));
    const counts = new Map();
    for (const resource of [...geometries, ...materials, source.map, ...shared]) {
      if (counts.has(resource)) continue;
      counts.set(resource, 0);
      resource.addEventListener('dispose', () => counts.set(resource, counts.get(resource) + 1));
    }
    try {
      object.dispose();
      for (const geometry of geometries) assert.equal(counts.get(geometry), 1, `${factory.name}: geometry disposal missing or repeated`);
      for (const material of materials) assert.equal(counts.get(material), shared.has(material) ? 0 : 1, `${factory.name}: material ownership violated`);
      for (const material of shared) assert.equal(counts.get(material), 0, `${factory.name}: disposed another object's source material`);
      assert.equal(counts.get(source.map), 0, 'shared texture must outlive each object');
    } finally { source.dispose(); }
  }
});
