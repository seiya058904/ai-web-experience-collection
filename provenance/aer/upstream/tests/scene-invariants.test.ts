/** CPU geometry checks only. These do not validate WebGL appearance or speed. */
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createBalloon, BALLOON_IDENTITY } from '../src/balloon.ts';
import { drawingBudget, SCENE_LIMITS, createMeadowPatch } from '../src/scene.ts';
import { getLanding, terrainHeight } from '../src/journey.ts';

function withCanvasShim<T>(run: () => T): T {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  // Textures are not rendered here; only their owning geometry is inspected.
  const context = {
    fillStyle: '',
    fillRect() {},
    putImageData() {},
    createImageData(width: number, height: number) {
      return { data: new Uint8ClampedArray(width * height * 4), width, height };
    },
  };
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { createElement: () => ({ width: 0, height: 0, getContext: () => context }) },
  });
  try { return run(); }
  finally {
    if (previous) Object.defineProperty(globalThis, 'document', previous);
    else Reflect.deleteProperty(globalThis, 'document');
  }
}

test('drawing budgets bound 4K and skinny buffers, including non-finite inputs', () => {
  const cases = [
    [1440, 900, 2, false, 8192],
    [3840, 2160, 2, false, 8192],
    [390, 844, 3, true, 8192],
    [16384, 1, 4, false, 2048],
    [1, 16384, 4, true, 2048],
    [NaN, Infinity, NaN, false, 8192],
    [0, -3, -2, true, 8192],
  ] as const;
  for (const [width, height, density, mobile, hardware] of cases) {
    const result = drawingBudget(width, height, density, mobile, hardware);
    for (const number of Object.values(result)) assert.ok(Number.isFinite(number));
    assert.ok(result.pixelWidth >= 1 && result.pixelHeight >= 1);
    assert.ok(result.pixelWidth <= hardware && result.pixelHeight <= hardware);
    assert.ok(result.pixels <= (mobile ? SCENE_LIMITS.mobilePixels : SCENE_LIMITS.desktopPixels));
    assert.ok(result.ratio <= (mobile ? SCENE_LIMITS.mobileDpr : SCENE_LIMITS.desktopDpr));
  }
  const desktop = drawingBudget(1440, 900, 2, false);
  assert.equal(desktop.ratio, 1.75);
  assert.equal(desktop.pixelWidth, 2520);
  assert.equal(desktop.pixelHeight, 1575);
  assert.ok(drawingBudget(3840, 2160, 2, false).ratio < 1);
});

test('resting and held geometry keep four suspension endpoints at the same mouth', () => {
  withCanvasShim(() => {
    const balloon = createBalloon();
    const ropes: THREE.Mesh<THREE.TubeGeometry>[] = [];
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    let mouth: THREE.Mesh<THREE.TorusGeometry> | undefined;
    balloon.group.traverse(object => {
      const mesh = object as THREE.Mesh;
      if (mesh.geometry) {
        geometries.add(mesh.geometry);
        for (const attribute of Object.values(mesh.geometry.attributes)) {
          for (const value of attribute.array) assert.ok(Number.isFinite(value), `${mesh.geometry.type}: non-finite vertex data`);
        }
      }
      if (mesh.material) for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) materials.add(material);
      if (mesh.geometry instanceof THREE.TubeGeometry && mesh.geometry.parameters.radius === 0.025) ropes.push(mesh as THREE.Mesh<THREE.TubeGeometry>);
      if (mesh.geometry instanceof THREE.TorusGeometry && mesh.geometry.parameters.radius === 1.42) mouth = mesh as THREE.Mesh<THREE.TorusGeometry>;
    });
    assert.equal(ropes.length, 4);
    assert.ok(mouth);
    balloon.group.updateMatrixWorld(true);
    const heldEnds = ropes.map(rope => rope.localToWorld(rope.geometry.parameters.path.getPoint(1)));
    const heldBounds = new THREE.Box3().setFromObject(balloon.group);
    const initialGeometryCount = geometries.size;
    for (const rest of [true, false, true, false]) {
      balloon.setResting(rest);
      balloon.group.updateMatrixWorld(true);
      const center = mouth.getWorldPosition(new THREE.Vector3());
      assert.ok(Math.abs(center.y - BALLOON_IDENTITY.mouthHeight) < 1e-10);
      ropes.forEach((rope, i) => {
        const end = rope.localToWorld(rope.geometry.parameters.path.getPoint(1));
        assert.ok(end.distanceTo(heldEnds[i]!) < 1e-10);
        assert.ok(Math.abs(end.y - center.y) < 1e-10);
        // The rope centerline intersects the physical torus cross-section.
        const radialDistance = Math.hypot(end.x - center.x, end.z - center.z);
        assert.ok(Math.abs(radialDistance - mouth!.geometry.parameters.radius) <= mouth!.geometry.parameters.tube + rope.geometry.parameters.radius);
      });
      balloon.group.traverse(object => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) assert.ok(geometries.has(mesh.geometry), 'Preset toggle allocated a replacement geometry');
      });
    }
    const returnedBounds = new THREE.Box3().setFromObject(balloon.group);
    assert.ok(returnedBounds.min.distanceTo(heldBounds.min) < 1e-10);
    assert.ok(returnedBounds.max.distanceTo(heldBounds.max) < 1e-10);
    assert.equal(geometries.size, initialGeometryCount);
    for (const material of materials) {
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
      material.dispose();
    }
    for (const geometry of geometries) geometry.dispose();
    for (const texture of textures) texture.dispose();
  });
});

test('all three landing meshes remain above the finer fields between vertices', () => {
  for (const layer of ['low', 'middle', 'high'] as const) {
    const landing = getLanding(layer);
    const material = new THREE.MeshBasicMaterial();
    const mesh = createMeadowPatch(landing.x, landing.z, layer === 'high' ? 25 : 17, layer === 'high' ? 20 : 13, material);
    const positions = mesh.geometry.attributes.position as THREE.BufferAttribute;
    const indices = mesh.geometry.index!;
    for (let i = 0; i < indices.count; i += 3) {
      const triangle = [indices.getX(i), indices.getX(i + 1), indices.getX(i + 2)];
      for (const weights of [[1 / 3, 1 / 3, 1 / 3], [0.6, 0.2, 0.2], [0.2, 0.6, 0.2], [0.2, 0.2, 0.6]]) {
        let x = 0; let y = 0; let z = 0;
        triangle.forEach((vertex, j) => {
          x += positions.getX(vertex) * weights[j]!;
          y += positions.getY(vertex) * weights[j]!;
          z += positions.getZ(vertex) * weights[j]!;
        });
        const clearance = y - terrainHeight(x, z);
        assert.ok(clearance > 0.028 && clearance < 0.042, `${layer} meadow interpolation clearance ${clearance}`);
      }
    }
    mesh.geometry.dispose();
    material.dispose();
  }
});
