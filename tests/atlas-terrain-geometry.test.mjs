import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { Geography, registeredDetail } from "../experiences/atlas/src/geo.ts";
import { canonicalTerrainIndices, createTerrainGeometry, createJoinedDetail } from "../experiences/atlas/src/world/terrain-geometry.ts";

const root = new URL("../public/atlas/data/", import.meta.url);
const readJSON = (file) => JSON.parse(readFileSync(new URL(file, root), "utf8"));
const readGrid = (file) => {
  const bytes = readFileSync(new URL(file, root));
  const values = new Float32Array(bytes.length / 4);
  for (let i = 0; i < values.length; i++) values[i] = bytes.readFloatLE(i * 4);
  return values;
};
const regionMeta = readJSON("terrain.json"), fineMeta = readJSON("city-raster.json");
const scenarios = [
  { label: "desktop", regionSize: 513, detailSize: 257, removed: 3696, ring: 1196,
    opening: { west: 285, east: 327, north: 145, south: 189 } },
  { label: "mobile", regionSize: 257, detailSize: 129, removed: 1012, ring: 602,
    opening: { west: 142, east: 164, north: 72, south: 95 } },
];
const make = ({ regionSize, detailSize }) => {
  const reference = new Geography(regionMeta, readGrid(`elevation-${regionSize}.bin`), regionSize);
  const source = new Geography(fineMeta, readGrid(`city-elevation-${detailSize}.bin`), detailSize);
  const detail = registeredDetail(reference, source);
  const region = createTerrainGeometry(reference);
  const originalPositions = new Float32Array(region.getAttribute("position").array);
  const originalIndices = canonicalTerrainIndices(regionSize);
  const joined = createJoinedDetail(reference, detail, region);
  return { reference, source, detail, region, originalPositions, originalIndices, joined };
};
const edgeKey = (a, b) => a < b ? `${a}:${b}` : `${b}:${a}`;

for (const scenario of scenarios) {
  test(`${scenario.label}: coarse cells partition without loss, duplication or changed node positions`, () => {
    const { reference, detail, region, originalPositions, originalIndices, joined } = make(scenario);
    assert.deepEqual(region.getAttribute("position").array, originalPositions);
    assert.equal(region.index.count, originalIndices.length);
    assert.equal(joined.fullIndexCount, originalIndices.length);
    assert.equal((joined.fullIndexCount - joined.exteriorIndexCount) / 3, scenario.removed);
    assert.deepEqual(joined.opening, scenario.opening);
    const remaining = new Set();
    for (let k = 0; k < originalIndices.length; k += 3)
      remaining.add(`${originalIndices[k]},${originalIndices[k + 1]},${originalIndices[k + 2]}`);
    const reordered = region.index.array;
    for (let k = 0; k < reordered.length; k += 3) {
      assert.ok(remaining.delete(`${reordered[k]},${reordered[k + 1]},${reordered[k + 2]}`), "Original coarse triangle used exactly once");
      const vertices = [reordered[k], reordered[k + 1], reordered[k + 2]];
      const i = Math.min(...vertices.map((id) => id % scenario.regionSize));
      const j = Math.min(...vertices.map((id) => Math.floor(id / scenario.regionSize)));
      const inside = i >= joined.opening.west && i < joined.opening.east && j >= joined.opening.north && j < joined.opening.south;
      assert.equal(inside, k >= joined.exteriorIndexCount, "Only whole enclosed cells leave the draw range");
    }
    assert.equal(remaining.size, 0);
    const once = new Uint32Array(reordered);
    const second = createJoinedDetail(reference, detail, region);
    assert.deepEqual(region.index.array, once, "Release/reload cannot accumulate index reordering");
    second.geometry.dispose();
  });

  test(`${scenario.label}: joined fine surface has upward winding, exact area, closed interior edges and one outer loop`, () => {
    const { region, joined } = make(scenario);
    const p = joined.geometry.getAttribute("position"), index = joined.geometry.index.array;
    const edges = new Map();
    let area = 0;
    for (let k = 0; k < index.length; k += 3) {
      const a = index[k], b = index[k + 1], c = index[k + 2];
      const twiceArea = (p.getX(b) - p.getX(a)) * (p.getZ(c) - p.getZ(a))
        - (p.getZ(b) - p.getZ(a)) * (p.getX(c) - p.getX(a));
      assert.ok(twiceArea < 0, "No degenerate or down-facing triangle");
      area -= twiceArea / 2;
      for (const [u, v] of [[a, b], [b, c], [c, a]]) {
        const key = edgeKey(u, v), value = edges.get(key) || { count: 0, direction: 0 };
        value.count++; value.direction += u < v ? 1 : -1; edges.set(key, value);
      }
    }
    const regional = region.getAttribute("position");
    const { west, east, north, south } = joined.opening;
    const width = regional.getX(east) - regional.getX(west);
    const depth = regional.getZ(south * scenario.regionSize) - regional.getZ(north * scenario.regionSize);
    assert.ok(Math.abs(area - width * depth) < 1e-7, "Joined mesh exactly covers the removed rectangle");
    assert.equal(index.length / 3 - 2 * (scenario.detailSize - 1) ** 2, scenario.ring);
    const outer = new Set(joined.outerVertexPairs.map(([, id]) => id));
    const boundaryDegree = new Map();
    for (const [key, value] of edges) {
      assert.ok(value.count === 1 || value.count === 2, "Manifold edge count");
      if (value.count === 2) assert.equal(value.direction, 0, "Opposite interior edge directions");
      else {
        const [u, v] = key.split(":").map(Number);
        assert.ok(outer.has(u) && outer.has(v), "No gap along fine inner boundary");
        boundaryDegree.set(u, (boundaryDegree.get(u) || 0) + 1);
        boundaryDegree.set(v, (boundaryDegree.get(v) || 0) + 1);
      }
    }
    assert.equal(boundaryDegree.size, outer.size);
    for (const degree of boundaryDegree.values()) assert.equal(degree, 2);
  });

  test(`${scenario.label}: shared outer positions remain exact through refinement; fine data, UV and offset collar retain registration`, () => {
    const { reference, detail, region, joined } = make(scenario);
    const p = joined.geometry.getAttribute("position"), coarse = joined.geometry.getAttribute("aCoarseHeight");
    const offsets = joined.geometry.getAttribute("aDisplayOffset"), uv = joined.geometry.getAttribute("uv");
    const original = region.getAttribute("position");
    for (const [coarseId, id] of joined.outerVertexPairs) {
      assert.deepEqual([p.getX(id), p.getY(id), p.getZ(id)], [original.getX(coarseId), original.getY(coarseId), original.getZ(coarseId)]);
      assert.equal(coarse.getX(id), original.getY(coarseId));
      assert.equal(offsets.getX(id), 0);
      for (const refine of [0, 0.001, 0.13, 0.5, 0.999, 1])
        assert.equal(Math.fround(coarse.getX(id) + Math.fround(p.getY(id) - coarse.getX(id)) * refine), original.getY(coarseId));
    }
    const m = scenario.detailSize, b = fineMeta.mercatorBounds, scale = regionMeta.groundScaleCosLatitude / 1000;
    for (let j = 0; j < m; j++) for (let i = 0; i < m; i++) {
      const id = j * m + i, u = i / (m - 1), v = j / (m - 1);
      const x = (b.west + u * (b.east - b.west) - reference.anchorMercator[0]) * scale;
      const z = (reference.anchorMercator[1] - (b.north - v * (b.north - b.south))) * scale;
      assert.equal(p.getX(id), Math.fround(x)); assert.equal(p.getZ(id), Math.fround(z));
      assert.equal(uv.getX(id), Math.fround(u)); assert.equal(uv.getY(id), Math.fround(1 - v));
      assert.equal(coarse.getX(id), Math.fround(reference.heightAtWorld(x, z)));
      assert.ok(Math.abs(p.getY(id) - (detail.heights[id] / 1000 + offsets.getX(id))) < 1.3e-7);
      assert.ok(offsets.getX(id) >= 0 && offsets.getX(id) <= Math.fround(0.0004));
      if (!i || !j || i === m - 1 || j === m - 1) assert.equal(offsets.getX(id), 0);
      if (Math.min(u, v, 1 - u, 1 - v) >= 0.05) assert.equal(offsets.getX(id), Math.fround(0.0004));
    }
  });
}
