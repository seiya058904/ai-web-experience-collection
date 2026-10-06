import { Vector3 } from "three";

export const ANCHOR = { lon: 138.8079, lat: 35.4875 };
export const MERCATOR_RADIUS = 6378137;
export const DEG = Math.PI / 180;
export const clamp = (v: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, v));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const mercator = (lon: number, lat: number) => [
  MERCATOR_RADIUS * lon * DEG,
  MERCATOR_RADIUS * Math.log(Math.tan(Math.PI / 4 + (lat * DEG) / 2)),
];

export interface RasterMeta {
  west: number;
  east: number;
  south: number;
  north: number;
  boundsWGS84: [number, number, number, number];
  mercatorBounds: { west: number; east: number; south: number; north: number };
  widthMeters: number;
  depthMeters: number;
  groundScaleCosLatitude: number;
  anchor: {
    longitude: number;
    latitude: number;
    u: number;
    v: number;
    elevationM: number;
  };
}

export class Geography {
  readonly anchorMercator = mercator(ANCHOR.lon, ANCHOR.lat);
  width = 0;
  depth = 0;
  constructor(
    public meta: RasterMeta,
    public heights: Float32Array,
    public size: number,
  ) {
    this.width = meta.widthMeters / 1000;
    this.depth = meta.depthMeters / 1000;
  }
  uv(lon: number, lat: number): [number, number] {
    const [mx, my] = mercator(lon, lat),
      b = this.meta.mercatorBounds;
    return [
      (mx - b.west) / (b.east - b.west),
      (b.north - my) / (b.north - b.south),
    ];
  }
  sampleUV(u: number, v: number): number {
    const x = clamp(u) * (this.size - 1),
      z = clamp(v) * (this.size - 1);
    const i = Math.min(this.size - 2, Math.floor(x)),
      j = Math.min(this.size - 2, Math.floor(z));
    const tx = x - i,
      tz = z - j,
      k = j * this.size + i;
    return mix(
      mix(this.heights[k], this.heights[k + 1], tx),
      mix(this.heights[k + this.size], this.heights[k + this.size + 1], tx),
      tz,
    );
  }
  /** The actual rendered [a,c,b] / [b,c,d] triangle surface, in metres. */
  sampleMeshUV(u: number, v: number): number {
    const x = clamp(u) * (this.size - 1),
      z = clamp(v) * (this.size - 1);
    const i = Math.min(this.size - 2, Math.floor(x)),
      j = Math.min(this.size - 2, Math.floor(z));
    const tx = x - i,
      tz = z - j,
      k = j * this.size + i;
    const a = this.heights[k],
      b = this.heights[k + 1],
      c = this.heights[k + this.size],
      d = this.heights[k + this.size + 1];
    return tx + tz <= 1
      ? a + (b - a) * tx + (c - a) * tz
      : d + (c - d) * (1 - tx) + (b - d) * (1 - tz);
  }
  height(lon: number, lat: number) {
    const uv = this.uv(lon, lat);
    return this.sampleMeshUV(...uv);
  }
  pointUV(u: number, v: number, heightM = this.sampleUV(u, v)): Vector3 {
    return new Vector3(
      (u - this.meta.anchor.u) * this.width,
      heightM / 1000,
      (v - this.meta.anchor.v) * this.depth,
    );
  }
  project(lon: number, lat: number, heightM = this.height(lon, lat)): Vector3 {
    const [mx, my] = mercator(lon, lat),
      c = this.meta.groundScaleCosLatitude / 1000;
    return new Vector3(
      (mx - this.anchorMercator[0]) * c,
      heightM / 1000,
      (this.anchorMercator[1] - my) * c,
    );
  }
  heightAtWorld(x: number, z: number): number {
    return (
      this.sampleMeshUV(
        x / this.width + this.meta.anchor.u,
        z / this.depth + this.meta.anchor.v,
      ) / 1000
    );
  }
}

/** The detailed floor and all city geometry share this registered edge collar. */
export function registeredDetail(
  reference: Geography,
  detail: Geography,
): Geography {
  const heights = new Float32Array(detail.heights);
  const bounds = detail.meta.mercatorBounds,
    scale = reference.meta.groundScaleCosLatitude / 1000;
  for (let row = 0; row < detail.size; row++)
    for (let col = 0; col < detail.size; col++) {
      const u = col / (detail.size - 1),
        v = row / (detail.size - 1);
      const x =
        (bounds.west +
          u * (bounds.east - bounds.west) -
          reference.anchorMercator[0]) *
        scale;
      const z =
        (reference.anchorMercator[1] -
          bounds.north +
          v * (bounds.north - bounds.south)) *
        scale;
      heights[row * detail.size + col] = mix(
        reference.heightAtWorld(x, z) * 1000,
        detail.heights[row * detail.size + col],
        smooth(0, 0.05, Math.min(u, v, 1 - u, 1 - v)),
      );
    }
  return new Geography(detail.meta, heights, detail.size);
}

const jsonCache = new Map<string, Promise<unknown>>();
const gridCache = new Map<string, Promise<Float32Array>>();
export function readJSON<T>(path: string): Promise<T> {
  let promise = jsonCache.get(path);
  if (!promise) {
    promise = fetchJSON(path).catch((error) => {
      jsonCache.delete(path);
      throw error;
    });
    jsonCache.set(path, promise);
  }
  return promise as Promise<T>;
}
async function fetchJSON(path: string): Promise<unknown> {
  const res = await fetch(path);
  if (!res.ok)
    throw new Error(`Could not load ${path.split("/").pop()} (${res.status}).`);
  return res.json();
}
export function readGrid(path: string, size: number): Promise<Float32Array> {
  const key = `${path}:${size}`;
  let promise = gridCache.get(key);
  if (!promise) {
    promise = fetchGrid(path, size).catch((error) => {
      gridCache.delete(key);
      throw error;
    });
    gridCache.set(key, promise);
  }
  return promise;
}
async function fetchGrid(path: string, size: number): Promise<Float32Array> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Could not load elevation (${res.status}).`);
  const buffer = await res.arrayBuffer();
  if (buffer.byteLength !== size * size * 4)
    throw new Error("Elevation data is incomplete.");
  const view = new DataView(buffer),
    array = new Float32Array(size * size);
  for (let i = 0; i < array.length; i++) {
    array[i] = view.getFloat32(i * 4, true);
    if (!Number.isFinite(array[i]))
      throw new Error("Elevation data contains an invalid height.");
  }
  return array;
}
