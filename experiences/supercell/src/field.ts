/**
 * A deliberately authored, dimensionless storm structure.
 *
 * This is an explanatory density field, not a fluid solver or a reconstruction
 * of the generated photograph. The photo is its artistic projected skin.
 * Whole-cloud observation planes and detached sections must sample this module.
 * x spans the photograph; h is normalized height; z is horizontal depth.
 */
export const DEFAULT_SHEAR = 0.5;
export const DEFAULT_HEIGHT = 0.42;
export const SECTION_WIDTH = 400;
export const SECTION_HEIGHT = 220;

export type Center = { x: number; z: number };
export type FlowPoint = Center & { h: number };
export type SectionFlow = Center & { dx: number; dz: number; t: number };
export type Contour = { level: number; path: string };
export type SliceGrid = {
  values: Float32Array;
  columns: number;
  rows: number;
  height: number;
  shear: number;
};

export const clamp = (value: number, low = 0, high = 1): number =>
  Math.max(low, Math.min(high, value));
export const mix = (a: number, b: number, t: number): number => a + (b - a) * t;
export function smoothstep(low: number, high: number, value: number): number {
  if (low === high) return value < low ? 0 : 1;
  const t = clamp((value - low) / (high - low));
  return t * t * (3 - 2 * t);
}

/** Top-down image coordinate; matching image horizon is approximately y=.865. */
export const heightToY = (h: number): number => 0.79 - 0.74 * h;
export const yToHeight = (y: number): number => (0.79 - y) / 0.74;

const coreShift = (h: number, u: number): number =>
  (clamp(u) - DEFAULT_SHEAR) * (0.025 + 0.14 * h * h);
const rainShift = (h: number, u: number): number =>
  (clamp(u) - DEFAULT_SHEAR) * (0.07 + 0.055 * h);

export function cloudCenter(height: number, shear: number): Center {
  const h = clamp(height);
  return {
    x: 0.61 + 0.05 * smoothstep(0.08, 0.8, h) + coreShift(h, shear),
    z: 0.016 * Math.sin(h * Math.PI * 1.5) + 0.08 * (clamp(shear) - 0.5) * h,
  };
}

export function rainCenter(height: number, shear: number): Center {
  const h = clamp(height);
  return {
    x: 0.83 + 0.012 * h + rainShift(h, shear),
    z: 0.07 - 0.055 * (clamp(shear) - 0.5) * (1 - 0.3 * h),
  };
}

export const updraftExists = (h: number): boolean => h > 0.12 && h < 0.88;

const bell = (value: number, center: number, radius: number): number =>
  Math.exp(-(((value - center) / radius) ** 2) * 1.8);

/** D(x,h,z,u). The same scalar is used for every displayed section. */
export function density(x: number, h: number, z: number, u: number): number {
  if (h <= 0.025 || h >= 0.985 || x < 0 || x > 1 || z < -0.5 || z > 0.5) return 0;
  const core = cloudCenter(h, u);
  const rain = rainCenter(h, u);
  const bodyRadius = 0.069 + 0.022 * Math.sin(h * Math.PI) ** 2;
  const tower = 0.94 * bell(x, core.x, bodyRadius) * bell(z, core.z, 0.14)
    * smoothstep(0.065, 0.16, h) * (1 - smoothstep(0.8, 0.98, h));
  const base = 0.66 * bell(x, core.x - 0.035, 0.22) * bell(z, core.z, 0.22)
    * bell(h, 0.19, 0.17);
  const shoulder = 0.34 * bell(x, core.x - 0.07, 0.145) * bell(z, -0.055, 0.16)
    * bell(h, 0.54, 0.24);
  const anvilX = 0.455 + coreShift(h, u);
  const anvil = 0.85 * bell(x, anvilX, 0.36) * bell(z, core.z, 0.29)
    * bell(h, 0.865, 0.115);
  // A distinct, broad precipitation region. Its strength is not a risk score.
  const precipitation = 0.59 * bell(x, rain.x, 0.12) * bell(z, rain.z, 0.17)
    * bell(h, 0.3, 0.35);
  const edge = smoothstep(0.025, 0.085, h) * (1 - smoothstep(0.95, 0.985, h));
  // Fixed small lobes make contours organic without introducing temporal drift.
  const texture = 0.94 + 0.035 * Math.sin(x * 47 + h * 11) * Math.cos(z * 31 - h * 5)
    + 0.025 * Math.sin(x * 83 - z * 17 + h * 7);
  return clamp((1 - Math.exp(-(tower + base + shoulder + anvil + precipitation) * 1.55))
    * edge * texture);
}

/**
 * Horizontal displacement of the reference photograph. The centerline and rain
 * shifts are exactly those used above; far sky and the horizon remain anchored.
 * Shader consumers should use DEFORMATION_GLSL, rather than a second formula.
 */
export function deformation(x: number, imageY: number, shear: number): number {
  const h = clamp(yToHeight(imageY));
  const region = smoothstep(0.2, 0.42, x) * (1 - smoothstep(0.94, 1, x));
  const vertical = smoothstep(0.0, 0.085, h);
  const precipitationWeight = smoothstep(0.69, 0.8, x);
  return mix(coreShift(h, shear), rainShift(h, shear), precipitationWeight) * region * vertical;
}

/** All inputs are normalized; imageUV.y is top-down, not GL bottom-up. */
export const DEFORMATION_GLSL = `
float stormDeformation(vec2 imageUV, float shear) {
  float h = clamp((0.79 - imageUV.y) / 0.74, 0.0, 1.0);
  float delta = clamp(shear, 0.0, 1.0) - 0.5;
  float coreShift = delta * (0.025 + 0.14 * h * h);
  float rainShift = delta * (0.07 + 0.055 * h);
  float region = smoothstep(0.2, 0.42, imageUV.x) * (1.0 - smoothstep(0.94, 1.0, imageUV.x));
  return mix(coreShift, rainShift, smoothstep(0.69, 0.8, imageUV.x)) * region * smoothstep(0.0, 0.085, h);
}
`;

function catmull(a: number, b: number, c: number, d: number, t: number): number {
  return 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t
    + (-a + 3 * b - 3 * c + d) * t * t * t);
}

/** One continuous, trackable path: low inflow, rotating rise, lateral outflow. */
export function flowPoint(progress: number, shear: number): FlowPoint {
  const u = clamp(shear);
  const at = (h: number): FlowPoint => ({ ...cloudCenter(h, u), h });
  const points: FlowPoint[] = [
    { x: 0.35, h: -0.08, z: -0.02 },
    { x: 0.52 + coreShift(0.05, u), h: 0.025, z: -0.01 },
    at(0.15), at(0.4), at(0.68), at(0.875),
    { x: 0.42 + coreShift(0.92, u), h: 0.86, z: 0.025 },
    { x: 0.17 + coreShift(0.93, u), h: 0.86, z: 0.035 },
  ];
  const total = clamp(progress) * (points.length - 1);
  const index = Math.min(points.length - 2, Math.floor(total));
  const local = total - index;
  const a = points[Math.max(0, index - 1)];
  const b = points[index];
  const c = points[index + 1];
  const d = points[Math.min(points.length - 1, index + 2)];
  const result = {
    x: catmull(a.x, b.x, c.x, d.x, local),
    h: catmull(a.h, b.h, c.h, d.h, local),
    z: catmull(a.z, b.z, c.z, d.z, local),
  };
  const rotation = clamp((total - 2) / 3);
  const envelope = Math.sin(rotation * Math.PI) ** 2;
  result.x += 0.013 * envelope * Math.sin(rotation * Math.PI * 3);
  result.z += 0.055 * envelope * Math.cos(rotation * Math.PI * 3);
  return result;
}

/**
 * The first ascending crossing of h on the SAME illustrative parcel path.
 * dx/dz form a unit horizontal tangent in canonical model coordinates. Apply
 * the section's x/z display scales before choosing an arrow's visual length.
 * Direction is authored model flow, not a universal meteorological rotation
 * rule, measured wind vector or speed. A missing updraft has no such arrow.
 */
export function sectionFlow(height: number, shear: number): SectionFlow | null {
  if (!Number.isFinite(height) || !Number.isFinite(shear) || !updraftExists(height)) return null;
  const u = clamp(shear);
  const steps = 96;
  let previous = flowPoint(0, u);
  let low = 0;
  let high = 0;
  for (let i = 1; i <= steps; i++) {
    const current = flowPoint(i / steps, u);
    if (previous.h <= height && current.h >= height && current.h > previous.h) {
      low = (i - 1) / steps;
      high = i / steps;
      break;
    }
    previous = current;
  }
  if (high === 0) return null;
  for (let i = 0; i < 25; i++) {
    const middle = (low + high) / 2;
    if (flowPoint(middle, u).h < height) low = middle;
    else high = middle;
  }
  const t = (low + high) / 2;
  const point = flowPoint(t, u);
  const before = flowPoint(t - 0.0001, u);
  const after = flowPoint(t + 0.0001, u);
  const dx = after.x - before.x;
  const dz = after.z - before.z;
  const length = Math.hypot(dx, dz);
  if (length < 1e-10) return null;
  return { x: point.x, z: point.z, dx: dx / length, dz: dz / length, t };
}

/** Points map identically in both copies of the horizontal section. */
export function sectionPoint(point: Center): { x: number; y: number } {
  return { x: point.x * SECTION_WIDTH, y: (point.z + 0.5) * SECTION_HEIGHT };
}

export function sampleSlice(height: number, shear: number, resolutionX = 100, resolutionZ = 64): SliceGrid {
  const columns = Math.max(2, Math.floor(resolutionX)) + 1;
  const rows = Math.max(2, Math.floor(resolutionZ)) + 1;
  const values = new Float32Array(columns * rows);
  const h = clamp(height);
  const u = clamp(shear);
  for (let row = 0; row < rows; row++) {
    const z = row / (rows - 1) - 0.5;
    for (let col = 0; col < columns; col++) {
      values[row * columns + col] = density(col / (columns - 1), h, z, u);
    }
  }
  return { values, columns, rows, height: h, shear: u };
}

/**
 * Marching-square isolines in a 400 × 220 viewBox. Each independent segment is
 * intentionally an SVG M/L pair, to remain robust when an empty slice splits.
 */
export function contourSegments(height: number, shear: number, resolutionX = 100, resolutionZ = 64): Contour[] {
  const grid = sampleSlice(height, shear, resolutionX, resolutionZ);
  const { columns, rows, values } = grid;
  const dx = SECTION_WIDTH / (columns - 1);
  const dy = SECTION_HEIGHT / (rows - 1);
  const levels = [0.08, 0.16, 0.26, 0.38, 0.5, 0.62, 0.72, 0.8];
  return levels.map((level) => {
    const segments: string[] = [];
    for (let y = 0; y < rows - 1; y++) {
      for (let x = 0; x < columns - 1; x++) {
        const v = [values[y * columns + x], values[y * columns + x + 1],
          values[(y + 1) * columns + x + 1], values[(y + 1) * columns + x]];
        const corners = [[x * dx, y * dy], [(x + 1) * dx, y * dy],
          [(x + 1) * dx, (y + 1) * dy], [x * dx, (y + 1) * dy]];
        const cuts: number[][] = [];
        for (let edge = 0; edge < 4; edge++) {
          const next = (edge + 1) % 4;
          if ((v[edge] >= level) !== (v[next] >= level)) {
            const t = (level - v[edge]) / (v[next] - v[edge]);
            cuts.push([mix(corners[edge][0], corners[next][0], t),
              mix(corners[edge][1], corners[next][1], t)]);
          }
        }
        const line = (a: number[], b: number[]) => segments.push(
          `M${a[0].toFixed(2)},${a[1].toFixed(2)}L${b[0].toFixed(2)},${b[1].toFixed(2)}`,
        );
        if (cuts.length === 2) line(cuts[0], cuts[1]);
        else if (cuts.length === 4) {
          // Resolve saddle ambiguity from the cell's bilinear center.
          const centerAbove = (v[0] + v[1] + v[2] + v[3]) / 4 >= level;
          if (centerAbove === (v[0] >= level)) {
            line(cuts[0], cuts[1]); line(cuts[2], cuts[3]);
          } else {
            line(cuts[0], cuts[3]); line(cuts[1], cuts[2]);
          }
        }
      }
    }
    return { level, path: segments.join('') };
  });
}
