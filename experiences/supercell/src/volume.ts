import { clamp, contourSegments, density, yToHeight } from './field.ts';
import type { Contour } from './field.ts';

export type ProjectedDensity = {
  width: number;
  height: number;
  data: Uint8Array;
};

export type NeighboringSection = {
  height: number;
  contours: Contour[];
};

/**
 * Projects the SAME dimensionless field used by the horizontal sections.
 * The generated photograph supplies artistic detail; this texture supplies
 * explanatory structure. Neither is a measured atmospheric reconstruction.
 *
 * Texture coordinates follow the photograph: x left→right, y top→bottom.
 * R: accumulated opacity, using a fixed artistic optical-depth mapping.
 * G: strongest density weighted gently toward the near side (z = −.5).
 * B: density-weighted mean depth, normalized to 0…1; .5 in empty space.
 * A: 255 (R carries density opacity; alpha is deliberately opaque data).
 *
 * The default evaluates at most 160 × 112 × 12 = 215,040 samples. Build on
 * condition changes, not every animation frame. Lower sizes may be used during
 * dragging without changing the field or its spatial coordinate mapping.
 */
export function buildProjectedDensity(shear: number, width = 160, height = 112): ProjectedDensity {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    throw new RangeError('Projected density dimensions must be positive finite numbers.');
  }
  width = Math.floor(width);
  height = Math.floor(height);
  const data = new Uint8Array(width * height * 4);
  const u = clamp(shear);
  const depthSamples = 12;

  for (let row = 0; row < height; row++) {
    const imageY = (row + 0.5) / height;
    const h = yToHeight(imageY);
    const hasCloud = h > 0.025 && h < 0.985;
    for (let column = 0; column < width; column++) {
      const index = (row * width + column) * 4;
      data[index + 2] = 128;
      data[index + 3] = 255;
      if (!hasCloud) continue;

      const x = (column + 0.5) / width;
      let integrated = 0;
      let nearStructure = 0;
      let depthMoment = 0;
      for (let sample = 0; sample < depthSamples; sample++) {
        // Midpoint quadrature avoids bias toward the domain's empty boundaries.
        const depth = (sample + 0.5) / depthSamples;
        const value = density(x, h, depth - 0.5, u);
        integrated += value;
        depthMoment += value * depth;
        nearStructure = Math.max(nearStructure, value * (1 - 0.35 * depth));
      }
      const opticalDepth = integrated / depthSamples;
      data[index] = Math.round(255 * (1 - Math.exp(-opticalDepth * 5)));
      data[index + 1] = Math.round(255 * clamp(nearStructure));
      if (integrated > 1e-10) data[index + 2] = Math.round(255 * clamp(depthMoment / integrated));
    }
  }
  return { width, height, data };
}

/**
 * Sparse neighboring planes provide depth context without replacing the exact
 * user-selected section. Out-of-range neighbors are omitted, never clamped into
 * a duplicate plane. All contours still call the original field sampler.
 */
export function neighboringContours(height: number, shear: number): NeighboringSection[] {
  const h = clamp(height);
  return [-0.06, 0, 0.06]
    .map((offset) => h + offset)
    .filter((neighbor) => neighbor >= 0 && neighbor <= 1)
    .map((neighbor) => ({ height: neighbor, contours: contourSegments(neighbor, shear, 72, 44) }));
}
