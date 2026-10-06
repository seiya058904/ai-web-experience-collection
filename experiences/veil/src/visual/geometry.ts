import {
  BufferAttribute,
  BufferGeometry,
  Float32BufferAttribute,
  Vector3,
} from 'three';

const PI = Math.PI;
const TAU = PI * 2;
const ROOM_X = [4.70, -4.50, 2.72, -2.70, 0.0];
const ROOM_Z = [3.20, 2.95, -1.85, -2.35, -6.50];
const ROOM_WIDTH = [1.95, 1.94, 1.48, 1.47, 1.85];
const ROOM_HEIGHT = [3.80, 3.78, 3.28, 3.18, 2.93];
const ROOM_YAW = [-0.55, 0.55, -0.38, 0.38, 0.05];

/** All seven compositions are different states of the same uncut textile. */
export function clothPoint(u: number, v: number, stage: number, layer = 0): [number, number, number] {
  const s = u * 2 - 1;
  const t = v * 2 - 1;
  const l = layer;

  if (stage === 0) {
    // A broad, twisting satin ribbon: the lateral and longitudinal folds have
    // different wavelengths, so its silhouette never becomes a waving flag.
    const twist = 0.15 + 1.12 * Math.sin(t * PI * 1.15 + 0.10);
    const width = 2.20 + 0.28 * Math.cos(t * PI + 0.4);
    const fold = 0.36 * Math.sin(s * 8.7 + t * 3.7)
      + 0.17 * Math.sin(s * 17.0 - t * 2.9)
      + 0.31 * Math.sin(s * 3.4 + t * 4.1);
    const curl = Math.pow(Math.abs(s), 5) * 0.24 * Math.sin(t * 5.3 + s * 2.0);
    return [
      2.60 + 0.93 * Math.sin(t * PI * 1.11 + 0.35)
        + s * width * Math.cos(twist) + fold * Math.sin(twist),
      t * 3.78 + 0.29 * Math.sin(s * 2.9 + t * 3.6) + curl,
      0.35 + s * width * Math.sin(twist) + fold * Math.cos(twist)
        + 0.31 * Math.cos(t * PI * 1.6),
    ];
  }

  if (stage === 1) {
    // Fine threads arrive at the lower left edge of a slightly tensioned loom.
    const x = s * 2.35;
    const y = t * 2.12;
    const a = -0.21;
    return [
      2.90 + x * Math.cos(a) - y * Math.sin(a),
      0.10 + x * Math.sin(a) + y * Math.cos(a),
      0.10 + x * -0.19 + 0.14 * Math.sin(u * PI) * Math.sin(v * PI)
        + 0.038 * Math.sin(u * PI * 12) * Math.sin(v * PI),
    ];
  }

  if (stage === 2) {
    // A low middle pin between two high outer pins. The lower edge is a deep
    // U, while radial pleats converge on the three actual support locations.
    const split = 0.53;
    const r = u < split ? u / split : (u - split) / (1 - split);
    const top = u < split
      ? 3.12 * (1 - r) + 0.64 * r - 0.65 * Math.sin(r * PI)
      : 0.64 * (1 - r) + 3.43 * r - 0.77 * Math.sin(r * PI);
    const drop = 2.18 + 0.81 * Math.sin(u * PI) + 0.20 * Math.cos(u * PI * 4);
    const fanLeft = Math.atan2(u * 5.7, v * 3.1 + 0.025);
    const fanCenter = Math.atan2((u - split) * 5.7, v * 3.1 + 0.025);
    const fanRight = Math.atan2((u - 1) * 5.7, v * 3.1 + 0.025);
    const leftWeight = Math.exp(-u * u * 7.0);
    const middleWeight = Math.exp(-Math.pow(u - split, 2) * 10.0);
    const rightWeight = Math.exp(-Math.pow(u - 1, 2) * 7.0);
    const fold = (Math.sin(fanLeft * 13) * leftWeight
      + Math.sin(fanCenter * 15) * middleWeight
      + Math.sin(fanRight * 13) * rightWeight) * (0.13 + v * 0.15)
      + 0.11 * Math.sin(u * PI * 21 + v * 3.8) * Math.sin(v * PI * 0.8);
    return [
      -0.55 + u * 6.53 + 0.21 * Math.sin(v * PI) * Math.sin(u * TAU),
      top - v * drop + 0.12 * Math.sin(u * PI * 6 + v * 4) * v,
      0.20 + fold + 0.87 * Math.sin(v * PI * 0.92) * Math.sin(u * PI)
        - 0.20 * v * Math.cos(u * PI * 2),
    ];
  }

  if (stage === 3) {
    const arch = Math.sin(u * PI) * (1.0 + 0.34 * Math.cos(v * PI));
    const wave = 0.72 * Math.sin(s * 2.5 + v * 3.1 + l * 0.50)
      + 0.16 * Math.sin(u * PI * 8.5 + v * 3.4 + l * 0.40);
    const x = s * 3.58 + 0.50 * Math.sin(v * PI * 1.7 + l * 0.50);
    const y = t * (1.46 + 0.10 * l) + arch
      + 0.43 * Math.sin(s * 2.4 + l * 0.42) * Math.pow(Math.abs(t), 2);
    const a = 0.30 + l * 0.22;
    return [
      1.80 + x * Math.cos(a) - y * Math.sin(a) + l * 0.18,
      0.45 + x * Math.sin(a) + y * Math.cos(a) - l * 0.09,
      0.46 - l * 0.78 + wave + s * (l-1) * 0.25,
    ];
  }

  if (stage === 4) {
    // A single flat pattern curls into a couture shell. The base still opens
    // into a planar train, making the sheet-to-object construction legible.
    const angle = s * 2.20 + 0.60 + v * 2.50;
    const radius = 0.57 + 1.90 * Math.pow(v, 0.72);
    const flute = 0.12 * Math.sin(s * 14.0 + v * 2.4)
      + 0.07 * Math.sin(s * 25.0 - v * 3.1);
    const baseOpen = Math.pow(1 - v, 4.5);
    const r = radius + flute * Math.sin(v * PI * 0.8);
    return [
      2.64 + Math.sin(angle) * r * (1 - baseOpen * 0.48)
        + s * 3.65 * baseOpen - 1.90 * baseOpen,
      -2.86 + v * 5.45 + 0.48 * Math.sin(s * 2.3 + v * 4.3) * Math.sin(v * PI)
        + 0.32 * Math.cos(s * PI + 0.3) * Math.pow(v, 4),
      0.48 + Math.cos(angle) * r * 0.82 * (1 - baseOpen)
        - 0.65 * baseOpen + 0.21 * Math.sin(s * 5.0 + v * 4) * Math.sin(v * PI),
    ];
  }

  if (stage === 5) {
    const x = s * 4.10;
    const y = t * 3.22;
    const a = -0.23;
    return [
      2.70 + x * Math.cos(a) - y * Math.sin(a),
      x * Math.sin(a) + y * Math.cos(a),
      -0.60 + 0.08 * Math.sin(u * PI) * Math.sin(v * PI) - x * 0.105,
    ];
  }

  // The last composition is a room, not a stack: two foreground curtains,
  // two middle-distance curtains and a fifth veil at the end of the passage.
  const centerX = ROOM_X[l];
  const centerZ = ROOM_Z[l];
  const width = ROOM_WIDTH[l];
  const halfHeight = ROOM_HEIGHT[l];
  const yaw = ROOM_YAW[l];
  const lateral = s * width + 0.14 * Math.sin(v * PI * 1.8 + l * 0.65);
  const pleat = 0.22 * Math.sin(u * PI * 9.0 + v * 0.65 + l * 0.50)
    + 0.09 * Math.sin(u * PI * 17.0 + v * 2.0)
    + 0.33 * Math.sin(v * PI) * Math.sin(u * PI * 2.0 + l * 0.44);
  return [
    centerX + lateral * Math.cos(yaw) + pleat * Math.sin(yaw),
    0.12 + t * halfHeight + 0.18 * Math.sin(u * PI * 3.0 + l * 0.5) * Math.pow(Math.abs(t), 3),
    centerZ - lateral * Math.sin(yaw) + pleat * Math.cos(yaw),
  ];
}

export function makeClothGeometry(columns: number, rows: number, layer = 0): BufferGeometry {
  const geometry = new BufferGeometry();
  const count = (columns + 1) * (rows + 1);
  const uv = new Float32Array(count * 2);
  const indices: number[] = [];
  const shapes: Float32BufferAttribute[] = [];
  const normals: Float32BufferAttribute[] = [];
  const delta = 0.0006;
  const tangentU = new Vector3();
  const tangentV = new Vector3();
  const normal = new Vector3();

  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col <= columns; col++) {
      const id = row * (columns + 1) + col;
      uv[id * 2] = col / columns;
      uv[id * 2 + 1] = row / rows;
      if (col < columns && row < rows) {
        const a = id;
        const b = id + 1;
        const c = id + columns + 1;
        const d = c + 1;
        indices.push(a, b, c, b, d, c);
      }
    }
  }

  for (let stage = 0; stage <= 6; stage++) {
    const position = new Float32Array(count * 3);
    const normalArray = new Float32Array(count * 3);
    for (let row = 0; row <= rows; row++) {
      for (let col = 0; col <= columns; col++) {
        const id = (row * (columns + 1) + col) * 3;
        const u = col / columns;
        const v = row / rows;
        const p = clothPoint(u, v, stage, layer);
        const pu0 = clothPoint(Math.max(0, u - delta), v, stage, layer);
        const pu1 = clothPoint(Math.min(1, u + delta), v, stage, layer);
        const pv0 = clothPoint(u, Math.max(0, v - delta), stage, layer);
        const pv1 = clothPoint(u, Math.min(1, v + delta), stage, layer);
        tangentU.set(pu1[0] - pu0[0], pu1[1] - pu0[1], pu1[2] - pu0[2]);
        tangentV.set(pv1[0] - pv0[0], pv1[1] - pv0[1], pv1[2] - pv0[2]);
        normal.crossVectors(tangentU, tangentV).normalize();
        position.set(p, id);
        normalArray[id] = normal.x;
        normalArray[id + 1] = normal.y;
        normalArray[id + 2] = normal.z;
      }
    }
    shapes.push(new Float32BufferAttribute(position, 3));
    normals.push(new Float32BufferAttribute(normalArray, 3));
  }

  geometry.setIndex(indices);
  geometry.setAttribute('position', shapes[0]);
  geometry.setAttribute('normal', normals[0]);
  geometry.setAttribute('uv', new BufferAttribute(uv, 2));
  geometry.morphAttributes.position = shapes.slice(1);
  geometry.morphAttributes.normal = normals.slice(1);
  geometry.morphTargetsRelative = false;
  // The morph positions have wider extents than the opening composition.
  geometry.computeBoundingSphere();
  if (geometry.boundingSphere) geometry.boundingSphere.radius = 14;
  return geometry;
}

/** A complete, genuinely interlaced yarn surface for the microscope scene. */
export function makeYarnGeometry(): BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const colors: number[] = [];
  const spacing = 0.255;
  const radius = 0.079;
  const amplitude = 0.073;
  const across = 31;
  const steps = 230;
  const sides = 8;
  const half = (across - 1) * spacing / 2;

  for (let axis = 0; axis < 2; axis++) {
    for (let yarn = 0; yarn < across; yarn++) {
      const base = positions.length / 3;
      const fixed = (yarn - (across - 1) / 2) * spacing;
      const shade = axis === 0 ? 1.0 : 0.91;
      for (let i = 0; i <= steps; i++) {
        const along = -half - 0.11 + (2 * half + 0.22) * i / steps;
        const wave = Math.cos((along + half) / spacing * PI + yarn * PI);
        const z = amplitude * wave * (axis === 0 ? 1 : -1);
        const slope = -amplitude * Math.sin((along + half) / spacing * PI + yarn * PI)
          * PI / spacing * (axis === 0 ? 1 : -1);
        const norm = Math.sqrt(1 + slope * slope);
        for (let side = 0; side <= sides; side++) {
          const a = side / sides * TAU;
          // Broad and gently flattened yarn bundles are visibly soft, rather
          // than hard round wires or a checkerboard painted on a plane.
          const lateral = Math.cos(a) * radius;
          const nz = Math.sin(a) / norm;
          const nt = -Math.sin(a) * slope / norm;
          const x = axis === 0 ? fixed + lateral : along + nt * radius * 0.72;
          const y = axis === 0 ? along + nt * radius * 0.72 : fixed + lateral;
          positions.push(x, y, z + nz * radius * 0.72);
          normals.push(axis === 0 ? Math.cos(a) : nt, axis === 0 ? nt : Math.cos(a), nz);
          uvs.push(i / steps * 15.0, side / sides);
          const individual = shade * (0.97 + 0.03 * Math.sin(yarn * 6.43));
          colors.push(individual, individual * 0.982, individual * 0.944);
        }
      }
      for (let i = 0; i < steps; i++) {
        for (let side = 0; side < sides; side++) {
          const a = base + i * (sides + 1) + side;
          const b = a + sides + 1;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

/** Fanned-out warp threads, each of which ends on the actual morphing sheet. */
export function makeThreadGeometry(): BufferGeometry {
  const position: number[] = [];
  const phases: number[] = [];
  const lines = 73;
  const segments = 84;
  function sample(line: number, t: number): [number, number, number] {
    const v = 0.035 + line / (lines - 1) * 0.93;
    const end = clothPoint(0.009, v, 1);
    const startY = -2.5 + line / (lines - 1) * 5.4;
    const ease = t * t * (3 - 2 * t);
    return [
      -7.4 + (end[0] + 7.4) * t,
      startY * (1 - ease) + end[1] * ease
        + Math.sin(t * PI) * (0.24 * Math.sin(line * 0.17) + 0.28),
      -0.95 * (1 - ease) + end[2] * ease
        + 0.30 * Math.sin(t * PI) * Math.cos(line * 0.08),
    ];
  }
  for (let line = 0; line < lines; line++) {
    for (let i = 0; i < segments; i++) {
      position.push(...sample(line, i / segments), ...sample(line, (i + 1) / segments));
      phases.push(line * 0.19, i / segments, line * 0.19, (i + 1) / segments);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(position, 3));
  geometry.setAttribute('aPhase', new Float32BufferAttribute(phases, 2));
  geometry.computeBoundingSphere();
  return geometry;
}
