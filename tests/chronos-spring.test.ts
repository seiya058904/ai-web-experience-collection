import assert from 'node:assert/strict';
import test from 'node:test';
import type { BufferAttribute } from 'three';
import { BALANCE_AMPLITUDE } from '../experiences/chronos/src/mechanics.ts';
import { SpringRibbon } from '../experiences/chronos/src/scene/geometry.ts';

function close(actual: number, expected: number, tolerance = 1e-7, message = '') {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance,
    `${message}: expected ${expected}, received ${actual}`);
}

function endpoint(spring: SpringRibbon, outer: boolean) {
  const positions = spring.geometry.getAttribute('position') as BufferAttribute;
  const first = (outer ? spring.segments : 0) * 8;
  // Average opposite ribbon edges, so a changing terminal tangent cannot masquerade as endpoint motion.
  return {
    x: (positions.getX(first) + positions.getX(first + 3)) / 2,
    y: (positions.getY(first) + positions.getY(first + 3)) / 2,
    z: (positions.getZ(first) + positions.getZ(first + 1)) / 2,
  };
}

test('the hairspring outer attachment stays fixed while its inner attachment follows the balance', () => {
  const spring = new SpringRibbon(.095, .525, 8.5, .025, .0065, 680);
  try {
    const inner = endpoint(spring, false), outer = endpoint(spring, true);
    for (const angle of [-BALANCE_AMPLITUDE, -BALANCE_AMPLITUDE / 2, 0, BALANCE_AMPLITUDE / 2, BALANCE_AMPLITUDE]) {
      spring.update(angle, 0, angle * .0023);
      const movedInner = endpoint(spring, false), fixedOuter = endpoint(spring, true);
      close(movedInner.x, inner.x * Math.cos(angle) - inner.y * Math.sin(angle), 1e-7, 'inner x');
      close(movedInner.y, inner.x * Math.sin(angle) + inner.y * Math.cos(angle), 1e-7, 'inner y');
      close(movedInner.z, inner.z);
      close(Math.hypot(movedInner.x, movedInner.y), spring.inner);
      close(fixedOuter.x, outer.x, 1e-7, 'fixed outer x');
      close(fixedOuter.y, outer.y, 1e-7, 'fixed outer y');
      close(fixedOuter.z, outer.z);
      close(Math.hypot(fixedOuter.x, fixedOuter.y), spring.outer);
    }
  } finally {
    spring.geometry.dispose();
  }
});

test('spring deformation is reversible and preserves finite strip geometry and unit normals across the full swing', () => {
  const spring = new SpringRibbon(.095, .525, 8.5, .025, .0065, 680);
  try {
    const positions = spring.geometry.getAttribute('position') as BufferAttribute;
    const normals = spring.geometry.getAttribute('normal') as BufferAttribute;
    spring.update(.731, 0, .731 * .0023);
    const originalPositions = Array.from(positions.array);
    const originalNormals = Array.from(normals.array);
    for (const angle of [-BALANCE_AMPLITUDE, 0, BALANCE_AMPLITUDE, -BALANCE_AMPLITUDE / 2]) {
      spring.update(angle, 0, angle * .0023);
      assert.ok(Array.from(positions.array).every(Number.isFinite));
      assert.ok(Array.from(normals.array).every(Number.isFinite));
      for (let section = 0; section <= spring.segments; section++) {
        const first = section * 8;
        close(Math.hypot(positions.getX(first) - positions.getX(first + 3),
          positions.getY(first) - positions.getY(first + 3)), spring.width);
        close(positions.getZ(first + 1) - positions.getZ(first), spring.height);
        for (let vertex = first; vertex < first + 8; vertex++) {
          close(Math.hypot(normals.getX(vertex), normals.getY(vertex), normals.getZ(vertex)), 1);
        }
      }
    }
    spring.update(.731, 0, .731 * .0023);
    assert.deepEqual(Array.from(positions.array), originalPositions, 'geometry has no accumulated deformation');
    assert.deepEqual(Array.from(normals.array), originalNormals, 'lighting normals reverse exactly with the shape');
  } finally {
    spring.geometry.dispose();
  }
});
