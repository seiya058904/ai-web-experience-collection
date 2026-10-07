import test from 'node:test';
import assert from 'node:assert/strict';
import { stateAt, SCENES } from '../experiences/magma/src/material-state.js';
import { createSplitSurface, seamAt, createSeamData } from '../experiences/magma/src/fracture-geometry.js';

test('nine material states remain finite and independent of travel direction', () => {
  assert.equal(SCENES.length, 9);
  const inputs = [undefined, NaN, Infinity, -2, 0, ...Array.from({ length: 901 }, (_, i) => i / 100), 12];
  const forward = inputs.map(progress => stateAt(progress, .4));
  for (const [index, state] of forward.entries()) {
    for (const [key, value] of Object.entries(state)) {
      if (typeof value === 'number') assert.ok(Number.isFinite(value), key);
    }
    assert.ok(state.mix >= 0 && state.mix <= 1);
    assert.ok(state.scene >= 0 && state.scene < 9);
    assert.deepEqual(state, stateAt(inputs[index], .4));
  }
  for (let index = inputs.length - 1; index >= 0; index--) {
    assert.deepEqual(stateAt(inputs[index], .4), forward[index]);
  }
});

test('material handoffs agree on either side of every integer boundary', () => {
  const keys = ['heat', 'crust', 'flow', 'split', 'glass', 'seal', 'front', 'retention', 'pulse', 'relief', 'camera', 'driftX', 'driftY', 'motion'];
  for (let boundary = 1; boundary <= 8; boundary++) {
    const before = stateAt(boundary - 1e-7), after = stateAt(boundary + 1e-7);
    for (const key of keys) {
      assert.ok(Math.abs(before[key] - after[key]) < 2e-5,
        `${boundary} ${key}: ${before[key]} vs ${after[key]}`);
    }
  }
});

test('sealed completion has exact zero heat, movement, geometry and reflection', () => {
  for (const progress of [8.86, 8.99, 9, 20]) {
    const state = stateAt(progress, 1);
    assert.equal(state.complete, true);
    for (const key of ['heat', 'flow', 'pulse', 'motion', 'split', 'glass', 'relief', 'camera', 'driftX', 'driftY']) {
      assert.equal(state[key], 0, key);
    }
    assert.equal(state.seal, 1);
    assert.equal(state.mix, 1);
  }
});

test('cooling reduces heat and increases crust; crack and fracture reveal geometry', () => {
  const warm = stateAt(3.3, 0), cool = stateAt(3.3, 1);
  assert.ok(cool.heat < warm.heat);
  assert.ok(cool.crust > warm.crust);
  assert.ok(stateAt(4.3, 1).split > stateAt(4.3, 0).split);
  assert.ok(stateAt(6.3, 1).relief > stateAt(6.3, 0).relief);
});

test('split surfaces retain separate seam vertices and no triangle bridges halves', () => {
  for (const type of ['crack', 'fracture']) {
    for (const dimensions of [[26, 36], [40, 56]]) {
      const geometry = createSplitSurface(type, ...dimensions);
      assert.equal(geometry.vertices.length, geometry.vertexCount * geometry.stride);
      assert.equal(geometry.indices.length, geometry.triangleCount * 3);
      assert.ok([...geometry.vertices].every(Number.isFinite));
      for (let i = 0; i < geometry.indices.length; i += 3) {
        const vertices = [...geometry.indices.slice(i, i + 3)];
        const sides = vertices.map(vertex => geometry.vertices[vertex * geometry.stride + 2]);
        assert.ok(sides.every(side => side === sides[0]));
        for (const vertex of vertices) assert.ok(vertex < geometry.vertexCount);
      }
      for (let row = 0; row <= geometry.rows; row++) {
        const left = row * (geometry.columns + 1) + geometry.columns;
        const right = geometry.verticesPerHalf + row * (geometry.columns + 1);
        for (const offset of [0, 1]) {
          assert.equal(geometry.vertices[left * geometry.stride + offset], geometry.vertices[right * geometry.stride + offset]);
        }
        assert.equal(geometry.vertices[left * geometry.stride + 2], -1);
        assert.equal(geometry.vertices[right * geometry.stride + 2], 1);
      }
    }
  }
});

test('packed seam texture follows actual geometry paths to 16-bit precision', () => {
  const seam = createSeamData();
  for (let i = 0; i < seam.width; i++) {
    const position = i / (seam.width - 1);
    for (const [type, offset] of [['crack', 0], ['fracture', 2]]) {
      const decoded = (seam.data[i * 4 + offset] * 256 + seam.data[i * 4 + offset + 1]) / 65535;
      assert.ok(Math.abs(decoded - seamAt(type, position)) <= .5 / 65535 + 1e-10);
    }
  }
});
