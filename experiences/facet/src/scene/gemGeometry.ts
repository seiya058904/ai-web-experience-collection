import { BufferGeometry, Float32BufferAttribute, Vector3, Vector4 } from 'three';

/** The structural names are deliberately separate from the triangulated draw mesh. */
export type GemFacetKind =
  | 'table'
  | 'star'
  | 'bezel'
  | 'upper-girdle'
  | 'girdle'
  | 'pavilion-main'
  | 'lower-girdle'
  | 'crown-step'
  | 'pavilion-step'
  | 'culet';

export interface GemFacet {
  index: number;
  kind: GemFacetKind;
  center: Vector3;
  normal: Vector3;
  /** The solid is inside dot(plane.xyz, point) <= plane.w. */
  plane: Vector4;
  /** Ordered, outward-facing polygon in the coordinates of the complete gem. */
  vertices: Vector3[];
  /** Independent face, centered on `center`, suitable for the exploded structure. */
  geometry: BufferGeometry;
}

export interface GemGeometryData {
  geometry: BufferGeometry;
  wireGeometry: BufferGeometry;
  planes: Vector4[];
  facets: GemFacet[];
  vertices: Vector3[];
  radius: number;
  height: number;
}

export interface BrilliantCutOptions {
  /** Radius of the girdle. The optical material works in the same local units. */
  radius?: number;
  /** Table radius / girdle radius. */
  tableRatio?: number;
  /** Crown height / girdle radius, measured from the upper girdle. */
  crownHeight?: number;
  /** Pavilion depth / girdle radius, measured from the lower girdle. */
  pavilionDepth?: number;
  /** Full girdle thickness / radius. */
  girdleThickness?: number;
}

const TAU = Math.PI * 2;
const EPS = 1e-7;

function ring(count: number, radius: number, y: number, phase = 0): Vector3[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * TAU + phase;
    return new Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
  });
}

function vertexKey(point: Vector3): string {
  return `${Math.round(point.x * 1e7)},${Math.round(point.y * 1e7)},${Math.round(point.z * 1e7)}`;
}

function createFaceGeometry(points: Vector3[], normal: Vector3, center: Vector3, index: number): BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const ids: number[] = [];
  const pivots: number[] = [];
  const uv: number[] = [];

  for (let triangle = 1; triangle < points.length - 1; triangle += 1) {
    for (const point of [points[0], points[triangle], points[triangle + 1]]) {
      positions.push(point.x - center.x, point.y - center.y, point.z - center.z);
      normals.push(normal.x, normal.y, normal.z);
      ids.push(index);
      pivots.push(center.x, center.y, center.z);
      uv.push(point.x * 0.5 + 0.5, point.z * 0.5 + 0.5);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geometry.setAttribute('facetIndex', new Float32BufferAttribute(ids, 1));
  geometry.setAttribute('facetCenter', new Float32BufferAttribute(pivots, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function appendFacet(facets: GemFacet[], kind: GemFacetKind, input: Vector3[], interior: Vector3): void {
  const points = input.map((point) => point.clone());
  const center = points.reduce((sum, point) => sum.add(point), new Vector3()).multiplyScalar(1 / points.length);
  const normal = points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0])).normalize();
  if (normal.dot(center.clone().sub(interior)) < 0) {
    points.reverse();
    normal.negate();
  }
  const plane = new Vector4(normal.x, normal.y, normal.z, normal.dot(points[0]));
  const index = facets.length;
  const geometry = createFaceGeometry(points, normal, center, index);
  geometry.name = `FACET / ${kind} / ${index}`;
  facets.push({ index, kind, center, normal, plane, vertices: points, geometry });
}

/**
 * A closed round-brilliant construction with 57 optical faces and 16 thin girdle
 * faces. The star and lower-girdle rings are solved on the main planes, rather
 * than guessed, so the bezel and pavilion kites are genuinely coplanar.
 *
 * This is an authored exhibition cut, not a grading or manufacturing model.
 * Y is the table axis. Use a uniformly scaled Object3D for consistent refraction.
 */
export function createBrilliantCut(options: BrilliantCutOptions = {}): GemGeometryData {
  const radius = options.radius ?? 1;
  const tableRatio = options.tableRatio ?? 0.57;
  const crownHeight = options.crownHeight ?? 0.288;
  const pavilionDepth = options.pavilionDepth ?? 0.848;
  const girdleThickness = options.girdleThickness ?? 0.044;
  if (!(radius > 0) || tableRatio < 0.4 || tableRatio > 0.7 || crownHeight < 0.1 ||
      crownHeight > 0.5 || pavilionDepth < 0.5 || pavilionDepth > 1.2 ||
      girdleThickness <= 0 || girdleThickness > 0.15) {
    throw new RangeError('The brilliant-cut proportions must form a finite, convex gem.');
  }

  const halfGirdle = girdleThickness * radius * 0.5;
  const tableY = halfGirdle + crownHeight * radius;
  const culetY = -halfGirdle - pavilionDepth * radius;
  const starRatio = 0.79;
  const lowerRatio = 0.72;
  const halfSectorCos = Math.cos(Math.PI / 8);
  const starY = halfGirdle + crownHeight * radius *
    (1 - starRatio * halfSectorCos) / (1 - tableRatio);
  const lowerY = culetY + pavilionDepth * radius * lowerRatio * halfSectorCos;
  const table = ring(8, radius * tableRatio, tableY);
  const star = ring(8, radius * starRatio, starY, Math.PI / 8);
  const upperGirdle = ring(16, radius, halfGirdle);
  const lowerGirdle = ring(16, radius, -halfGirdle);
  const pavilion = ring(8, radius * lowerRatio, lowerY, Math.PI / 8);
  const culet = new Vector3(0, culetY, 0);
  const interior = new Vector3(0, (tableY + culetY) * 0.2, 0);
  const facets: GemFacet[] = [];

  function addFace(kind: GemFacetKind, input: Vector3[]): void {
    appendFacet(facets, kind, input, interior);
  }

  addFace('table', table);
  for (let index = 0; index < 8; index += 1) {
    const next = (index + 1) % 8;
    const previous = (index + 7) % 8;
    const even = index * 2;
    const odd = even + 1;
    const nextEven = (even + 2) % 16;
    addFace('star', [table[index], table[next], star[index]]);
    addFace('bezel', [table[index], star[index], upperGirdle[even], star[previous]]);
    addFace('upper-girdle', [star[index], upperGirdle[even], upperGirdle[odd]]);
    addFace('upper-girdle', [star[index], upperGirdle[odd], upperGirdle[nextEven]]);
  }
  for (let index = 0; index < 16; index += 1) {
    const next = (index + 1) % 16;
    addFace('girdle', [upperGirdle[index], upperGirdle[next], lowerGirdle[next], lowerGirdle[index]]);
  }
  for (let index = 0; index < 8; index += 1) {
    const previous = (index + 7) % 8;
    const even = index * 2;
    const odd = even + 1;
    const nextEven = (even + 2) % 16;
    addFace('pavilion-main', [culet, pavilion[index], lowerGirdle[even], pavilion[previous]]);
    addFace('lower-girdle', [pavilion[index], lowerGirdle[even], lowerGirdle[odd]]);
    addFace('lower-girdle', [pavilion[index], lowerGirdle[odd], lowerGirdle[nextEven]]);
  }

  return assembleGem(facets, radius, tableY - culetY, 'Round brilliant / 57 optical faces');
}

function assembleGem(facets: GemFacet[], radius: number, height: number, label: string): GemGeometryData {
  const positions: number[] = [];
  const normals: number[] = [];
  const ids: number[] = [];
  const centers: number[] = [];
  const uv: number[] = [];
  const wire: number[] = [];
  const edges = new Set<string>();
  const uniqueVertices = new Map<string, Vector3>();
  const geometry = new BufferGeometry();

  for (const facet of facets) {
    const start = positions.length / 3;
    for (let triangle = 1; triangle < facet.vertices.length - 1; triangle += 1) {
      for (const point of [facet.vertices[0], facet.vertices[triangle], facet.vertices[triangle + 1]]) {
        positions.push(point.x, point.y, point.z);
        normals.push(facet.normal.x, facet.normal.y, facet.normal.z);
        ids.push(facet.index);
        centers.push(facet.center.x, facet.center.y, facet.center.z);
        uv.push(point.x / radius * 0.5 + 0.5, point.z / radius * 0.5 + 0.5);
      }
    }
    geometry.addGroup(start, positions.length / 3 - start, 0);
    for (let index = 0; index < facet.vertices.length; index += 1) {
      const a = facet.vertices[index];
      const b = facet.vertices[(index + 1) % facet.vertices.length];
      const aKey = vertexKey(a);
      const bKey = vertexKey(b);
      uniqueVertices.set(aKey, a);
      const key = [aKey, bKey].sort().join('|');
      if (!edges.has(key)) {
        wire.push(a.x, a.y, a.z, b.x, b.y, b.z);
        edges.add(key);
      }
    }
  }
  geometry.name = `FACET / ${label}`;
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geometry.setAttribute('facetIndex', new Float32BufferAttribute(ids, 1));
  geometry.setAttribute('facetCenter', new Float32BufferAttribute(centers, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  const wireGeometry = new BufferGeometry();
  wireGeometry.name = 'FACET / True facet edges, without triangulation diagonals';
  wireGeometry.setAttribute('position', new Float32BufferAttribute(wire, 3));
  wireGeometry.computeBoundingBox();
  wireGeometry.computeBoundingSphere();
  return {
    geometry,
    wireGeometry,
    planes: facets.map((facet) => facet.plane.clone()),
    facets,
    vertices: [...uniqueVertices.values()].map((point) => point.clone()),
    radius,
    height,
  };
}

export interface StepCutOptions {
  radius?: number;
  /** Length along Z / width along X. This is built into the actual solid. */
  aspect?: number;
  /** Chamfer as a fraction of the shorter half-width. */
  corner?: number;
}

/**
 * Broad octagonal table, two crown terraces, two pavilion terraces and a tiny
 * culet: 34 optical faces + 8 girdle faces. The parent can push through the table
 * as a depth portal while keeping the material's real convex boundaries.
 */
export function createStepCut(options: StepCutOptions = {}): GemGeometryData {
  const radius = options.radius ?? 1;
  const aspect = options.aspect ?? 1.1;
  const corner = options.corner ?? 0.27;
  if (!(radius > 0) || aspect < 0.6 || aspect > 1.8 || corner < 0.12 || corner > 0.5) {
    throw new RangeError('The step-cut proportions must form a finite, convex gem.');
  }
  const width = radius / Math.max(1, aspect);
  const length = width * aspect;
  const chamfer = Math.min(width, length) * corner;
  const footprint = [
    [width - chamfer, length], [-width + chamfer, length],
    [-width, length - chamfer], [-width, -length + chamfer],
    [-width + chamfer, -length], [width - chamfer, -length],
    [width, -length + chamfer], [width, length - chamfer],
  ];
  const stepRing = (scale: number, y: number) => footprint.map(([x, z]) => new Vector3(x * scale, y * radius, z * scale));
  const rings = [
    stepRing(0.65, 0.29),
    stepRing(0.88, 0.145),
    stepRing(1, 0.022),
    stepRing(1, -0.022),
    stepRing(0.43, -0.49),
    stepRing(0.075, -0.72),
  ];
  const facets: GemFacet[] = [];
  const interior = new Vector3(0, -0.16 * radius, 0);
  appendFacet(facets, 'table', rings[0], interior);
  for (let tier = 0; tier < rings.length - 1; tier += 1) {
    const kind: GemFacetKind = tier < 2 ? 'crown-step' : tier === 2 ? 'girdle' : 'pavilion-step';
    for (let index = 0; index < 8; index += 1) {
      const next = (index + 1) % 8;
      appendFacet(facets, kind, [rings[tier][index], rings[tier][next], rings[tier + 1][next], rings[tier + 1][index]], interior);
    }
  }
  appendFacet(facets, 'culet', rings[rings.length - 1], interior);
  return assembleGem(facets, radius, 1.01 * radius, 'Emerald step cut / 34 optical faces');
}

export interface GemValidation {
  valid: boolean;
  vertices: number;
  edges: number;
  faces: number;
  opticalFaces: number;
  eulerCharacteristic: number;
  maxPlaneError: number;
  maxConvexityError: number;
  openEdges: number;
}

/** A deterministic geometry check used by the build's bounded verification. */
export function validateGemGeometry(data: GemGeometryData): GemValidation {
  const edges = new Map<string, number>();
  let maxPlaneError = 0;
  let maxConvexityError = 0;
  for (const facet of data.facets) {
    for (let index = 0; index < facet.vertices.length; index += 1) {
      const a = facet.vertices[index];
      const b = facet.vertices[(index + 1) % facet.vertices.length];
      const edge = [vertexKey(a), vertexKey(b)].sort().join('|');
      edges.set(edge, (edges.get(edge) ?? 0) + 1);
      maxPlaneError = Math.max(maxPlaneError, Math.abs(facet.normal.dot(a) - facet.plane.w));
    }
    for (const vertex of data.vertices) {
      maxConvexityError = Math.max(maxConvexityError, facet.normal.dot(vertex) - facet.plane.w);
    }
  }
  const openEdges = [...edges.values()].filter((count) => count !== 2).length;
  const eulerCharacteristic = data.vertices.length - edges.size + data.facets.length;
  return {
    valid: openEdges === 0 && eulerCharacteristic === 2 && maxPlaneError < EPS && maxConvexityError < EPS,
    vertices: data.vertices.length,
    edges: edges.size,
    faces: data.facets.length,
    opticalFaces: data.facets.filter((facet) => facet.kind !== 'girdle').length,
    eulerCharacteristic,
    maxPlaneError,
    maxConvexityError,
    openEdges,
  };
}

export function disposeGemGeometry(data: GemGeometryData): void {
  data.geometry.dispose();
  data.wireGeometry.dispose();
  data.facets.forEach((facet) => facet.geometry.dispose());
}
