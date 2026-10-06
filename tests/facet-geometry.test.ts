import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Vector3 } from 'three';
import {
  createBrilliantCut,
  createStepCut,
  disposeGemGeometry,
  validateGemGeometry,
  type GemGeometryData,
} from '../experiences/facet/src/scene/gemGeometry.ts';

const tolerance = 2e-6;

/** Check the actual triangle buffer, independently of the polygon validator. */
function assertClosedDrawMesh(cut: GemGeometryData): void {
  const position = cut.geometry.getAttribute('position');
  const normal = cut.geometry.getAttribute('normal');
  const edges = new Map<string, { count: number; orientation: number }>();
  const vertices = new Set<string>();
  let volume = 0;
  const read = (index: number) => new Vector3().fromBufferAttribute(position, index);
  const key = (point: Vector3) => point.toArray().join(',');
  assert.equal(position.count % 3, 0, 'complete triangles');

  for (let start = 0; start < position.count; start += 3) {
    const triangle = [read(start), read(start + 1), read(start + 2)];
    const geometricNormal = triangle[1].clone().sub(triangle[0]).cross(triangle[2].clone().sub(triangle[0]));
    assert.ok(geometricNormal.lengthSq() > 1e-15, 'no zero-area draw triangles');
    const storedNormal = new Vector3().fromBufferAttribute(normal, start);
    assert.ok(Math.abs(storedNormal.length() - 1) < tolerance, 'unit surface normal');
    assert.ok(geometricNormal.normalize().dot(storedNormal) > 1 - tolerance, 'front-face winding agrees with the outward normal');
    volume += triangle[0].dot(triangle[1].clone().cross(triangle[2])) / 6;

    for (let edge = 0; edge < 3; edge += 1) {
      const a = triangle[edge];
      const b = triangle[(edge + 1) % 3];
      const aKey = key(a);
      const bKey = key(b);
      vertices.add(aKey);
      const edgeKey = [aKey, bKey].sort().join('|');
      const record = edges.get(edgeKey) ?? { count: 0, orientation: 0 };
      record.count += 1;
      record.orientation += aKey < bKey ? 1 : -1;
      edges.set(edgeKey, record);
      assert.ok(a.toArray().every(Number.isFinite), 'all coordinates are finite');
      for (const plane of cut.planes) {
        assert.ok(plane.x * a.x + plane.y * a.y + plane.z * a.z <= plane.w + tolerance, 'draw vertex lies inside every optical half-space');
      }
    }
  }
  for (const { count, orientation } of edges.values()) {
    assert.equal(count, 2, 'every draw edge has exactly two neighboring triangles');
    assert.equal(orientation, 0, 'neighbors traverse their common edge in opposite directions');
  }
  assert.equal(vertices.size - edges.size + position.count / 3, 2, 'a closed genus-zero surface');
  assert.ok(volume > 0.01 * cut.radius ** 3, 'outward winding encloses positive volume');
}

test('brilliant draw mesh is a closed convex solid with 57 optical faces', () => {
  const cut = createBrilliantCut();
  try {
    assertClosedDrawMesh(cut);
    assert.equal(cut.facets.filter((facet) => facet.kind !== 'girdle').length, 57);
    assert.equal(cut.facets.filter((facet) => facet.kind === 'girdle').length, 16);
    assert.equal(cut.planes.length, cut.facets.length);
    assert.equal(validateGemGeometry(cut).valid, true);
  } finally { disposeGemGeometry(cut); }
});

test('step cut remains closed and convex at different supported proportions', () => {
  for (const options of [{}, { aspect: 1.5, corner: 0.18, radius: 0.65 }, { aspect: 0.8, corner: 0.4, radius: 1.4 }]) {
    const cut = createStepCut(options);
    try {
      assertClosedDrawMesh(cut);
      assert.equal(cut.facets.filter((facet) => facet.kind === 'table').length, 1);
      assert.equal(validateGemGeometry(cut).valid, true);
    } finally { disposeGemGeometry(cut); }
  }
});

test('brilliant proportions and scale preserve the optical hull', () => {
  for (const options of [
    { radius: 0.45, tableRatio: 0.52, crownHeight: 0.24, pavilionDepth: 0.75 },
    { radius: 1.8, tableRatio: 0.65, crownHeight: 0.34, pavilionDepth: 0.95, girdleThickness: 0.06 },
  ]) {
    const cut = createBrilliantCut(options);
    try { assertClosedDrawMesh(cut); } finally { disposeGemGeometry(cut); }
  }
});

test('independent facet pieces reconstruct their original planes without triangulation seams in the wire', () => {
  const cut = createBrilliantCut();
  try {
    for (const facet of cut.facets) {
      const position = facet.geometry.getAttribute('position');
      for (let index = 0; index < position.count; index += 1) {
        const point = new Vector3().fromBufferAttribute(position, index).add(facet.center);
        assert.ok(Math.abs(facet.normal.dot(point) - facet.plane.w) < tolerance, 'centered piece returns to its original plane');
        assert.ok(facet.vertices.some((vertex) => vertex.distanceTo(point) < tolerance), 'reconstructed vertex belongs to its facet polygon');
      }
    }
    const edgeCount = validateGemGeometry(cut).edges;
    assert.equal(cut.wireGeometry.getAttribute('position').count, edgeCount * 2, 'wire contains one segment per polygon edge, without triangle diagonals');
  } finally { disposeGemGeometry(cut); }
});

test('geometry validation detects a missing face instead of accepting an open optical shell', () => {
  const cut = createStepCut();
  try {
    const openShell = { ...cut, facets: cut.facets.slice(1) };
    const result = validateGemGeometry(openShell);
    assert.equal(result.valid, false);
    assert.ok(result.openEdges > 0);
  } finally { disposeGemGeometry(cut); }
});

test('impossible cut proportions are rejected', () => {
  assert.throws(() => createBrilliantCut({ radius: 0 }), RangeError);
  assert.throws(() => createBrilliantCut({ tableRatio: 0.95 }), RangeError);
  assert.throws(() => createStepCut({ aspect: 0.2 }), RangeError);
  assert.throws(() => createStepCut({ corner: 0.8 }), RangeError);
});
