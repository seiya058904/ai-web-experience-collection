/**
 * Offline-only deterministic kernel, re-extracted after workspace loss.
 * Exact original geographic/raster math from frozen upstream globe.ts.
 * Upstream commit 186381f8da01aa8cf23771eb1514834d32b4d95c; SHA256 bcfb713f56fddf2fa32fd8f50799ce3e66d9ed3ce94337d82b6d4c5a8d4b9d6e.
 * Legacy texture descriptor “50m” means map scale 1:50,000,000, not metres.
 * This module is never imported by the browser runtime.
 *
 * MIT License
 * 
 * Copyright (c) 2026 ATLAS contributors
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import * as THREE from "three";

/** Kilometres, in the same east / up / south tangent frame as the local terrain. */
export const EARTH_RADIUS_KM = 6371;
const ANCHOR_LONGITUDE = 138.8079;
const ANCHOR_LATITUDE = 35.4875;
const DEG = Math.PI / 180;
const ANCHOR_SIN = Math.sin(ANCHOR_LATITUDE * DEG);
const ANCHOR_COS = Math.cos(ANCHOR_LATITUDE * DEG);
const MASK_WIDTH = 4096;
const MASK_HEIGHT = 2048;
const DETAIL_SIZE = 2048;
const DETAIL_BAND = 8;
const DETAIL_BOUNDS = { west: 120, south: 24, east: 148, north: 49 };

/**
 * Geographic coordinates → anchor-relative spherical coordinates.
 * The anchor at sea level is (0, 0, 0); Earth's centre is (0, -6371, 0).
 * Increasing longitude points east (+x), increasing latitude points north (-z).
 */
export function geoToSphere(
  lon: number,
  lat: number,
  altKm = 0,
): THREE.Vector3 {
  const latitude = lat * DEG;
  const deltaLongitude = (lon - ANCHOR_LONGITUDE) * DEG;
  const radius = EARTH_RADIUS_KM + altKm;
  const cosLatitude = Math.cos(latitude);
  const sinLatitude = Math.sin(latitude);
  const cosDelta = Math.cos(deltaLongitude);
  return new THREE.Vector3(
    radius * cosLatitude * Math.sin(deltaLongitude),
    radius * (ANCHOR_SIN * sinLatitude + ANCHOR_COS * cosLatitude * cosDelta) -
      EARTH_RADIUS_KM,
    radius * (ANCHOR_SIN * cosLatitude * cosDelta - ANCHOR_COS * sinLatitude),
  );
}

type Position = [number, number];
type Ring = Position[];
type Polygon = Ring[];
type LandGeometry =
  | { type: "Polygon"; coordinates: Polygon }
  | { type: "MultiPolygon"; coordinates: Polygon[] };
type LandCollection = {
  type: "FeatureCollection";
  features: Array<{ geometry: LandGeometry | null }>;
};

export function readPolygons(data: LandCollection): Polygon[] {
  if (data?.type !== "FeatureCollection" || !Array.isArray(data.features)) {
    throw new Error(
      "ATLAS globe: the Natural Earth file is not a GeoJSON FeatureCollection.",
    );
  }
  const polygons: Polygon[] = [];
  for (const feature of data.features) {
    const geometry = feature.geometry;
    if (geometry?.type === "Polygon") polygons.push(geometry.coordinates);
    else if (geometry?.type === "MultiPolygon")
      polygons.push(...geometry.coordinates);
  }
  if (!polygons.length)
    throw new Error(
      "ATLAS globe: the Natural Earth file contains no land polygons.",
    );
  return polygons;
}

/**
 * Rasterise the actual NE polygon rings without Canvas or DOM access.
 * The texture's first row is the south pole, matching UV v=0 and flipY=false.
 * Even/odd scan conversion preserves holes. Wrapped copies handle seam-crossing rings.
 */
export function makeLandMask(polygons: Polygon[]): THREE.DataTexture {
  const pixels = new Uint8Array(MASK_WIDTH * MASK_HEIGHT);

  for (const polygon of polygons) {
    let outerMeanX = 0;
    const rings = polygon.map((ring, ringIndex) => {
      // Natural Earth's polar boundary intentionally spans -180..180 at the pole.
      const polar = ring.some((point) => Math.abs(point[1]) > 89.9);
      let previousLongitude = ring[0]?.[0] ?? 0;
      const projected = ring.map((point, index) => {
        let longitude = point[0];
        if (!polar && index > 0) {
          while (longitude - previousLongitude > 180) longitude -= 360;
          while (longitude - previousLongitude < -180) longitude += 360;
        }
        previousLongitude = longitude;
        return [
          ((longitude + 180) / 360) * MASK_WIDTH,
          ((point[1] + 90) / 180) * MASK_HEIGHT,
        ] as Position;
      });
      const meanX =
        projected.reduce((sum, point) => sum + point[0], 0) /
        Math.max(projected.length, 1);
      if (ringIndex === 0) outerMeanX = meanX;
      else {
        const shift =
          Math.round((outerMeanX - meanX) / MASK_WIDTH) * MASK_WIDTH;
        if (shift)
          projected.forEach((point) => {
            point[0] += shift;
          });
      }
      return projected;
    });

    let minY = MASK_HEIGHT;
    let maxY = 0;
    for (const ring of rings) {
      for (const point of ring) {
        minY = Math.min(minY, point[1]);
        maxY = Math.max(maxY, point[1]);
      }
    }
    const firstRow = Math.max(0, Math.floor(minY));
    const lastRow = Math.min(MASK_HEIGHT - 1, Math.ceil(maxY));
    for (let row = firstRow; row <= lastRow; row++) {
      const scanY = row + 0.5;
      const intersections: number[] = [];
      for (const ring of rings) {
        for (let index = 0; index < ring.length; index++) {
          const a = ring[index];
          const b = ring[(index + 1) % ring.length];
          if (
            (a[1] <= scanY && b[1] > scanY) ||
            (b[1] <= scanY && a[1] > scanY)
          ) {
            intersections.push(
              a[0] + ((scanY - a[1]) / (b[1] - a[1])) * (b[0] - a[0]),
            );
          }
        }
      }
      intersections.sort((a, b) => a - b);
      for (let index = 0; index + 1 < intersections.length; index += 2) {
        const start = Math.ceil(intersections[index] - 0.5);
        const end = Math.ceil(intersections[index + 1] - 0.5);
        if (end <= start) continue;
        const firstCopy = Math.floor(start / MASK_WIDTH);
        const lastCopy = Math.floor((end - 1) / MASK_WIDTH);
        for (let copy = firstCopy; copy <= lastCopy; copy++) {
          const left = Math.max(0, start - copy * MASK_WIDTH);
          const right = Math.min(MASK_WIDTH, end - copy * MASK_WIDTH);
          if (right > left)
            pixels.fill(255, row * MASK_WIDTH + left, row * MASK_WIDTH + right);
        }
      }
    }
  }

  const texture = new THREE.DataTexture(
    pixels,
    MASK_WIDTH,
    MASK_HEIGHT,
    THREE.RedFormat,
    THREE.UnsignedByteType,
  );
  texture.name = "Natural Earth 50m land — real polygon raster";
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.unpackAlignment = 1;
  texture.flipY = false;
  texture.needsUpdate = true;
  return texture;
}

/**
 * A 4 MiB regional detail field. Distances are sampled from the original
 * polygon segments, not from raster pixel edges; interpolation therefore
 * preserves sub-texel coast position instead of enlarging binary stair steps.
 * The fixed window does not cross the antimeridian; NE input is already cut.
 */
export function makeRegionalCoast(polygons: Polygon[]): THREE.DataTexture {
  const side = DETAIL_SIZE;
  const pixels = new Uint8Array(side * side);
  const nearest = new Float32Array(side * side);
  nearest.fill(DETAIL_BAND * DETAIL_BAND);
  const longitudeScale = side / (DETAIL_BOUNDS.east - DETAIL_BOUNDS.west);
  const latitudeScale = side / (DETAIL_BOUNDS.north - DETAIL_BOUNDS.south);

  for (const polygon of polygons) {
    const rings = polygon.map((ring) =>
      ring.map(
        ([longitude, latitude]) =>
          [
            (longitude - DETAIL_BOUNDS.west) * longitudeScale,
            (latitude - DETAIL_BOUNDS.south) * latitudeScale,
          ] as Position,
      ),
    );
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const ring of rings) {
      for (const [x, y] of ring) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
    if (
      maxX < -DETAIL_BAND ||
      minX > side + DETAIL_BAND ||
      maxY < -DETAIL_BAND ||
      minY > side + DETAIL_BAND
    )
      continue;

    // Exact even/odd membership at sample centres, including real polygon holes.
    for (
      let row = Math.max(0, Math.floor(minY));
      row <= Math.min(side - 1, Math.ceil(maxY));
      row++
    ) {
      const scanY = row + 0.5;
      const intersections: number[] = [];
      for (const ring of rings) {
        for (let i = 0; i < ring.length; i++) {
          const a = ring[i],
            b = ring[(i + 1) % ring.length];
          if (
            (a[1] <= scanY && b[1] > scanY) ||
            (b[1] <= scanY && a[1] > scanY)
          ) {
            intersections.push(
              a[0] + ((scanY - a[1]) * (b[0] - a[0])) / (b[1] - a[1]),
            );
          }
        }
      }
      intersections.sort((a, b) => a - b);
      for (let i = 0; i + 1 < intersections.length; i += 2) {
        const left = Math.max(0, Math.ceil(intersections[i] - 0.5));
        const right = Math.min(side, Math.ceil(intersections[i + 1] - 0.5));
        if (right > left)
          pixels.fill(255, row * side + left, row * side + right);
      }
    }

    // Only visit an eight-texel band around each real edge. Far inland/water
    // values stay saturated; no global expensive distance transform is needed.
    for (const ring of rings) {
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i],
          b = ring[(i + 1) % ring.length];
        const dx = b[0] - a[0],
          dy = b[1] - a[1];
        const lengthSquared = dx * dx + dy * dy;
        if (lengthSquared < 1e-12) continue;
        const left = Math.max(
          0,
          Math.floor(Math.min(a[0], b[0]) - DETAIL_BAND),
        );
        const right = Math.min(
          side - 1,
          Math.ceil(Math.max(a[0], b[0]) + DETAIL_BAND),
        );
        const bottom = Math.max(
          0,
          Math.floor(Math.min(a[1], b[1]) - DETAIL_BAND),
        );
        const top = Math.min(
          side - 1,
          Math.ceil(Math.max(a[1], b[1]) + DETAIL_BAND),
        );
        for (let row = bottom; row <= top; row++) {
          const py = row + 0.5 - a[1];
          for (let column = left; column <= right; column++) {
            const px = column + 0.5 - a[0];
            const t = Math.max(
              0,
              Math.min(1, (px * dx + py * dy) / lengthSquared),
            );
            const ex = px - t * dx,
              ey = py - t * dy;
            const index = row * side + column;
            nearest[index] = Math.min(nearest[index], ex * ex + ey * ey);
          }
        }
      }
    }
  }

  for (let i = 0; i < pixels.length; i++) {
    const signedDistance = Math.sqrt(nearest[i]) * (pixels[i] > 127 ? 1 : -1);
    pixels[i] = Math.round(127.5 + signedDistance * (127.5 / DETAIL_BAND));
  }
  const texture = new THREE.DataTexture(
    pixels,
    side,
    side,
    THREE.RedFormat,
    THREE.UnsignedByteType,
  );
  texture.name = "Natural Earth — Japan true-edge distance detail";
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.unpackAlignment = 1;
  texture.flipY = false;
  texture.needsUpdate = true;
  return texture;
}

function appendSurfaceSegment(
  target: number[],
  a: Position,
  b: Position,
  altitude: number,
): void {
  let deltaLongitude = b[0] - a[0];
  while (deltaLongitude > 180) deltaLongitude -= 360;
  while (deltaLongitude < -180) deltaLongitude += 360;
  const deltaLatitude = b[1] - a[1];
  // Subdivision keeps each chord above the sphere at this small surface offset.
  const parts = Math.max(
    1,
    Math.ceil(
      Math.max(Math.abs(deltaLongitude), Math.abs(deltaLatitude)) / 0.6,
    ),
  );
  let previous = geoToSphere(a[0], a[1], altitude);
  for (let part = 1; part <= parts; part++) {
    const t = part / parts;
    const next = geoToSphere(
      a[0] + deltaLongitude * t,
      a[1] + deltaLatitude * t,
      altitude,
    );
    target.push(previous.x, previous.y, previous.z, next.x, next.y, next.z);
    previous = next;
  }
}

export function makeCoastlines(polygons: Polygon[]): THREE.BufferGeometry {
  const positions: number[] = [];
  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (let index = 1; index < ring.length; index++) {
        const a = ring[index - 1];
        const b = ring[index];
        // GeoJSON's artificial pole / antimeridian cut edges are not coastlines.
        if (Math.abs(a[1]) > 89.9 && Math.abs(b[1]) > 89.9) continue;
        if (
          Math.abs(Math.abs(a[0]) - 180) < 0.00001 &&
          Math.abs(Math.abs(b[0]) - 180) < 0.00001
        )
          continue;
        appendSurfaceSegment(positions, a, b, 1.5);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.computeBoundingSphere();
  return geometry;
}

