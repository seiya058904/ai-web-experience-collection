import * as THREE from "three";
import { Geography, smooth } from "../geo.ts";

/** The original coarse triangles; do not infer cell order from a reordered index. */
export function canonicalTerrainIndices(size: number): Uint32Array {
  const indices = new Uint32Array((size - 1) * (size - 1) * 6);
  let cursor = 0;
  for (let j = 0; j < size - 1; j++)
    for (let i = 0; i < size - 1; i++) {
      const a = j * size + i, b = a + 1, c = a + size, d = c + 1;
      indices.set([a, c, b, b, c, d], cursor);
      cursor += 6;
    }
  return indices;
}

export function createTerrainGeometry(geo: Geography): THREE.BufferGeometry {
  const size = geo.size;
  const positions = new Float32Array(size * size * 3);
  const coarse = new Float32Array(size * size);
  const uv = new Float32Array(size * size * 2);
  for (let j = 0; j < size; j++)
    for (let i = 0; i < size; i++) {
      const u = i / (size - 1), v = j / (size - 1), id = j * size + i;
      const p = geo.pointUV(u, v);
      positions.set([p.x, p.y, p.z], id * 3);
      coarse[id] = p.y;
      uv.set([u, 1 - v], id * 2);
    }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aCoarseHeight", new THREE.BufferAttribute(coarse, 1));
  geometry.setAttribute("aDisplayOffset", new THREE.BufferAttribute(new Float32Array(size * size), 1));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geometry.setIndex(new THREE.BufferAttribute(canonicalTerrainIndices(size), 1));
  geometry.setDrawRange(0, geometry.index!.count);
  return geometry;
}

export interface DetailJoin {
  geometry: THREE.BufferGeometry;
  fullIndexCount: number;
  exteriorIndexCount: number;
  fineVertexCount: number;
  opening: { west: number; east: number; north: number; south: number };
  /** [coarse vertex id, joined-detail vertex id], shared exact Float32 positions. */
  outerVertexPairs: [number, number][];
}

/**
 * Replace whole coarse cells with the factual fine grid plus a connected ring.
 * Both sides of the outer edge share exact Float32 vertices, so MSAA samples
 * receive complementary triangle coverage; no fragment hole, skirt or overlay.
 * Fine x/z and image UV remain registered to their original bounds.
 */
export function createJoinedDetail(
  reference: Geography,
  detail: Geography,
  regionalGeometry: THREE.BufferGeometry,
): DetailJoin {
  const n = reference.size, m = detail.size;
  const bounds = detail.meta.mercatorBounds;
  const groundScale = reference.meta.groundScaleCosLatitude / 1000;
  const west = (bounds.west - reference.anchorMercator[0]) * groundScale;
  const east = (bounds.east - reference.anchorMercator[0]) * groundScale;
  const north = (reference.anchorMercator[1] - bounds.north) * groundScale;
  const south = (reference.anchorMercator[1] - bounds.south) * groundScale;
  const original = regionalGeometry.getAttribute("position") as THREE.BufferAttribute;
  if (original.count !== n * n) throw new Error("The regional node grid is inconsistent.");

  // Choose actual, existing coarse edges enclosing the fine footprint. Float32
  // comparisons keep the rectangle strictly outside the true inner boundary.
  let i0 = 0, i1 = n - 1, j0 = 0, j1 = n - 1;
  while (i0 + 1 < n && original.getX(i0 + 1) < west) i0++;
  while (i1 > 0 && original.getX(i1 - 1) > east) i1--;
  while (j0 + 1 < n && original.getZ((j0 + 1) * n) < north) j0++;
  while (j1 > 0 && original.getZ((j1 - 1) * n) > south) j1--;
  if (i0 <= 0 || j0 <= 0 || i1 >= n - 1 || j1 >= n - 1 || i0 >= i1 || j0 >= j1)
    throw new Error("The fine footprint must be strictly inside the regional dataset.");

  const fullIndexCount = (n - 1) * (n - 1) * 6;
  const interiorCount = (i1 - i0) * (j1 - j0) * 6;
  const exteriorIndexCount = fullIndexCount - interiorCount;
  const reordered = new Uint32Array(fullIndexCount);
  let exterior = 0, interior = exteriorIndexCount;
  for (let j = 0; j < n - 1; j++)
    for (let i = 0; i < n - 1; i++) {
      const a = j * n + i, b = a + 1, c = a + n, d = c + 1;
      const inside = i >= i0 && i < i1 && j >= j0 && j < j1;
      const offset = inside ? interior : exterior;
      reordered.set([a, c, b, b, c, d], offset);
      if (inside) interior += 6;
      else exterior += 6;
    }
  const regionalIndex = regionalGeometry.index;
  if (!regionalIndex || regionalIndex.count !== fullIndexCount)
    throw new Error("The regional index capacity must remain unchanged.");
  (regionalIndex.array as Uint32Array).set(reordered);
  regionalIndex.needsUpdate = true;
  regionalGeometry.setDrawRange(0, fullIndexCount);

  const positions: number[] = [], coarse: number[] = [], uv: number[] = [], offsets: number[] = [];
  for (let j = 0; j < m; j++)
    for (let i = 0; i < m; i++) {
      const u = i / (m - 1), v = j / (m - 1);
      const mx = bounds.west + (bounds.east - bounds.west) * u;
      const my = bounds.north - (bounds.north - bounds.south) * v;
      const x = (mx - reference.anchorMercator[0]) * groundScale;
      const z = (reference.anchorMercator[1] - my) * groundScale;
      const collar = smooth(0, 0.05, Math.min(u, v, 1 - u, 1 - v));
      const offset = 0.0004 * collar;
      positions.push(x, detail.heights[j * m + i] / 1000 + offset, z);
      coarse.push(reference.heightAtWorld(x, z));
      offsets.push(offset);
      uv.push(u, 1 - v);
    }
  const fineVertexCount = m * m;
  const outerVertexPairs: [number, number][] = [];
  const outerIds = new Map<number, number>();
  const outerVertex = (id: number): number => {
    const existing = outerIds.get(id);
    if (existing !== undefined) return existing;
    const index = positions.length / 3;
    const x = original.getX(id), y = original.getY(id), z = original.getZ(id);
    positions.push(x, y, z);
    coarse.push(y);
    offsets.push(0);
    uv.push((x - west) / (east - west), 1 - (z - north) / (south - north));
    outerIds.set(id, index);
    outerVertexPairs.push([id, index]);
    return index;
  };
  const indices = Array.from(canonicalTerrainIndices(m));
  const addTriangle = (a: number, b: number, c: number) => {
    const area = (positions[b * 3] - positions[a * 3]) * (positions[c * 3 + 2] - positions[a * 3 + 2])
      - (positions[b * 3 + 2] - positions[a * 3 + 2]) * (positions[c * 3] - positions[a * 3]);
    if (Math.abs(area) < 1e-14) throw new Error("A degenerate terrain join triangle was produced.");
    // Negative XZ winding gives the positive Y normal of the original grid.
    indices.push(a, area < 0 ? b : c, area < 0 ? c : b);
  };
  const sequence = (start: number, end: number, mapper: (v: number) => number) => {
    const out: number[] = [];
    const step = start <= end ? 1 : -1;
    for (let v = start; v !== end + step; v += step) out.push(mapper(v));
    return out;
  };
  const zipper = (outer: number[], inner: number[]) => {
    let a = 0, b = 0;
    while (a < outer.length - 1 || b < inner.length - 1) {
      const nextOuter = a < outer.length - 1 ? (a + 1) / (outer.length - 1) : Infinity;
      const nextInner = b < inner.length - 1 ? (b + 1) / (inner.length - 1) : Infinity;
      if (nextOuter <= nextInner) {
        addTriangle(outer[a], outer[a + 1], inner[b]);
        a++;
      } else {
        addTriangle(outer[a], inner[b + 1], inner[b]);
        b++;
      }
    }
  };
  zipper(sequence(i0, i1, (i) => outerVertex(j0 * n + i)), sequence(0, m - 1, (i) => i));
  zipper(sequence(j0, j1, (j) => outerVertex(j * n + i1)), sequence(0, m - 1, (j) => j * m + m - 1));
  zipper(sequence(i1, i0, (i) => outerVertex(j1 * n + i)), sequence(m - 1, 0, (i) => (m - 1) * m + i));
  zipper(sequence(j1, j0, (j) => outerVertex(j * n + i0)), sequence(m - 1, 0, (j) => j * m));

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aCoarseHeight", new THREE.Float32BufferAttribute(coarse, 1));
  geometry.setAttribute("aDisplayOffset", new THREE.Float32BufferAttribute(offsets, 1));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(new THREE.Uint32BufferAttribute(indices, 1));
  return { geometry, fullIndexCount, exteriorIndexCount, fineVertexCount,
    opening: { west: i0, east: i1, north: j0, south: j1 }, outerVertexPairs };
}
