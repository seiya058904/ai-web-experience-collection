import * as THREE from 'three';

const TAU = Math.PI * 2;

/** Axes throughout the calibre are x/y in the plate and z through the assembly. */
export function cylinderGeometry(radius: number, depth: number, segments = 72): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(radius, radius, depth, segments, 1)
    .rotateX(Math.PI / 2)
    .translate(0, 0, depth / 2);
}

export function annulusGeometry(inner: number, outer: number, depth: number, bevel = 0.008, segments = 160): THREE.BufferGeometry {
  const b = Math.min(bevel, (outer - inner) * .22, Math.max(.001, depth * .4));
  const profile: THREE.Vector2[] = [];
  const bevelSteps = outer > .4 ? 4 : 2;
  const arc = (cx: number, cy: number, start: number, end: number) => {
    for (let i = 0; i <= bevelSteps; i++) {
      const a = start + (end - start) * i / bevelSteps;
      profile.push(new THREE.Vector2(cx + b * Math.cos(a), cy + b * Math.sin(a)));
    }
  };
  profile.push(new THREE.Vector2(inner + b, -b));
  profile.push(new THREE.Vector2(outer - b, -b));
  arc(outer - b, 0, -Math.PI / 2, 0);
  profile.push(new THREE.Vector2(outer, depth));
  arc(outer - b, depth, 0, Math.PI / 2);
  profile.push(new THREE.Vector2(inner + b, depth + b));
  arc(inner + b, depth, Math.PI / 2, Math.PI);
  profile.push(new THREE.Vector2(inner, 0));
  arc(inner + b, 0, Math.PI, Math.PI * 1.5);
  const radialSegments = Math.max(40, Math.ceil(segments * (outer > 1.2 ? 2 : outer > .4 ? 1.35 : 1)));
  const geometry = new THREE.LatheGeometry(profile, radialSegments).rotateX(Math.PI / 2);
  // Lathe Y becomes assembly Z. Reorder indices into face and edge materials.
  const faces: number[] = [], edges: number[] = [];
  const source = geometry.index!;
  const row = profile.length - 1;
  for (let i = 0; i < radialSegments; i++) for (let j = 0; j < row; j++) {
    const array = Math.abs(profile[j + 1].y - profile[j].y) < .000001 ? faces : edges;
    const start = (i * row + j) * 6;
    for (let k = 0; k < 6; k++) array.push(source.getX(start + k));
  }
  geometry.setIndex(faces.concat(edges));
  geometry.clearGroups();
  geometry.addGroup(0, faces.length, 0);
  geometry.addGroup(faces.length, edges.length, 1);
  // Keep the two annular faces perfectly flat. Only the rolled edge normals
  // interpolate through the fillet; no radial fan of false normal gradients.
  const result = geometry.toNonIndexed();
  const positions = result.getAttribute('position');
  const normals = result.getAttribute('normal');
  for (let i = 0; i < faces.length; i++) normals.setXYZ(i, 0, 0, positions.getZ(i) > depth / 2 ? 1 : -1);
  geometry.dispose();
  return result;
}

export function roundedRectGeometry(width: number, height: number, depth: number, radius = 0.04, bevel = 0.008): THREE.ExtrudeGeometry {
  const x = -width / 2, y = -height / 2;
  const r = Math.min(radius, width / 2, height / 2);
  const shape = new THREE.Shape();
  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel,
    bevelSize: bevel, bevelSegments: 3, curveSegments: 8, steps: 1 });
}

export type GearOptions = {
  teeth: number; radius: number; depth?: number; spokes?: number;
  module?: number; hubRadius?: number; holeRadius?: number; annular?: boolean;
};

/** Fine involute flanks, a continuous tooth root, rounded spoke windows and bevelled rims. */
export function gearGeometry(options: GearOptions): THREE.ExtrudeGeometry {
  const { teeth, radius, depth = 0.052, spokes = 5 } = options;
  const module = options.module ?? (2 * radius / teeth);
  const root = radius - 1.15 * module;
  const tip = radius + 0.90 * module;
  const base = radius * Math.cos(Math.PI / 9);
  const pitch = TAU / teeth;
  const involute = (r: number) => {
    const t = Math.sqrt(Math.max(0, (r * r) / (base * base) - 1));
    return t - Math.atan(t);
  };
  const atPitch = involute(radius);
  const half = Math.PI / (2 * teeth);
  const shape = new THREE.Shape();
  for (let tooth = 0; tooth < teeth; tooth++) {
    const a = tooth * pitch;
    const valley = a - pitch / 2;
    const rootHalf = Math.min(pitch * 0.43, half + atPitch);
    if (tooth === 0) shape.moveTo(root * Math.cos(valley), root * Math.sin(valley));
    else shape.lineTo(root * Math.cos(valley), root * Math.sin(valley));
    shape.lineTo(root * Math.cos(a - rootHalf), root * Math.sin(a - rootHalf));
    for (let step = 0; step <= 4; step++) {
      const r = Math.max(root, base) + (tip - Math.max(root, base)) * step / 4;
      const flank = half + atPitch - involute(r);
      shape.lineTo(r * Math.cos(a - flank), r * Math.sin(a - flank));
    }
    for (let step = 4; step >= 0; step--) {
      const r = Math.max(root, base) + (tip - Math.max(root, base)) * step / 4;
      const flank = half + atPitch - involute(r);
      shape.lineTo(r * Math.cos(a + flank), r * Math.sin(a + flank));
    }
    shape.lineTo(root * Math.cos(a + rootHalf), root * Math.sin(a + rootHalf));
    shape.lineTo(root * Math.cos(a + pitch / 2), root * Math.sin(a + pitch / 2));
  }
  shape.closePath();
  const hole = new THREE.Path();
  const hub = options.hubRadius ?? Math.max(0.115, radius * 0.21);
  const centerHole = options.holeRadius ?? Math.max(0.026, radius * 0.06);
  hole.absarc(0, 0, options.annular ? radius * 0.80 : centerHole, 0, TAU, true);
  shape.holes.push(hole);
  if (!options.annular && spokes > 0 && radius > 0.2) {
    const outerWindow = root - Math.max(module * 2.15, radius * 0.11);
    for (let i = 0; i < spokes; i++) {
      const a = i * TAU / spokes;
      const spokeHalf = Math.min(0.105, 0.075 / radius);
      const a0 = a + spokeHalf, a1 = a + TAU / spokes - spokeHalf;
      const window = new THREE.Path();
      window.moveTo(hub * Math.cos(a0), hub * Math.sin(a0));
      window.absarc(0, 0, hub, a0, a1, false);
      window.lineTo(outerWindow * Math.cos(a1), outerWindow * Math.sin(a1));
      window.absarc(0, 0, outerWindow, a1, a0, true);
      window.closePath();
      shape.holes.push(window);
    }
  }
  const bevel = Math.min(module * 0.19, depth * 0.13, 0.006);
  return new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel,
    bevelSegments: 2, curveSegments: 16, steps: 1,
  });
}

/** Fifteen asymmetric locking teeth; the escapement has its own wheel module. */
export function escapeGeometry(radius = 0.30, depth = 0.045): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const teeth = 15, pitch = TAU / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * pitch;
    const points = [
      [radius * .76, a - pitch * .49],
      [radius * .86, a - pitch * .24],
      [radius * 1.05, a + pitch * .15],
      [radius * 1.04, a + pitch * .25],
      [radius * .76, a + pitch * .02],
    ];
    for (let j = 0; j < points.length; j++) {
      const r = points[j][0], angle = points[j][1];
      if (i === 0 && j === 0) shape.moveTo(r * Math.cos(angle), r * Math.sin(angle));
      else shape.lineTo(r * Math.cos(angle), r * Math.sin(angle));
    }
  }
  shape.closePath();
  const centre = new THREE.Path();
  centre.absarc(0, 0, .038, 0, TAU, true);
  shape.holes.push(centre);
  for (let i = 0; i < 5; i++) {
    const a0 = i * TAU / 5 + .15, a1 = (i + 1) * TAU / 5 - .15;
    const hole = new THREE.Path();
    hole.moveTo(.105 * Math.cos(a0), .105 * Math.sin(a0));
    hole.absarc(0, 0, .105, a0, a1, false);
    hole.lineTo(.215 * Math.cos(a1), .215 * Math.sin(a1));
    hole.absarc(0, 0, .215, a1, a0, true);
    hole.closePath();
    shape.holes.push(hole);
  }
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: .004,
    bevelThickness: .004, bevelSegments: 2, curveSegments: 12, steps: 1 });
}

export function bridgeGeometry(points: readonly [number, number][], width: number, depth: number): THREE.ExtrudeGeometry {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0], p[1], 0)), false, 'catmullrom', .25);
  const shape = new THREE.Shape();
  const pts = curve.getPoints(Math.max(20, points.length * 8));
  const tangent = new THREE.Vector3();
  const right: THREE.Vector2[] = [];
  pts.forEach((p, i) => {
    curve.getTangent(i / (pts.length - 1), tangent);
    const nx = -tangent.y * width / 2, ny = tangent.x * width / 2;
    if (i === 0) shape.moveTo(p.x + nx, p.y + ny);
    else shape.lineTo(p.x + nx, p.y + ny);
    right.push(new THREE.Vector2(p.x - nx, p.y - ny));
  });
  for (let i = right.length - 1; i >= 0; i--) shape.lineTo(right[i].x, right[i].y);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: .018,
    bevelThickness: .015, bevelSegments: 3, curveSegments: 16, steps: 1 });
}

/** A rectangular spring strip, with fixed endpoints and a deforming centre line. */
export class SpringRibbon {
  readonly geometry: THREE.BufferGeometry;
  private readonly positions: Float32Array;
  private readonly normals: Float32Array;
  private readonly attribute: THREE.BufferAttribute;
  private readonly normalAttribute: THREE.BufferAttribute;
  constructor(readonly inner: number, readonly outer: number, readonly turns: number,
    readonly height: number, readonly width: number, readonly segments = 768) {
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array((segments + 1) * 8 * 3);
    this.normals = new Float32Array((segments + 1) * 8 * 3);
    this.attribute = new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage);
    this.normalAttribute = new THREE.BufferAttribute(this.normals, 3).setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('position', this.attribute);
    this.geometry.setAttribute('normal', this.normalAttribute);
    const uv = new Float32Array((segments + 1) * 8 * 2);
    for (let i = 0; i <= segments; i++) for (let face = 0; face < 4; face++) {
      const offset = i * 16 + face * 4;
      uv[offset] = uv[offset + 2] = i / segments * turns * .7;
      uv[offset + 1] = 0; uv[offset + 3] = .075;
    }
    this.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const indices: number[] = [];
    for (let i = 0; i < segments; i++) {
      for (let f = 0; f < 4; f++) {
        const a = i * 8 + f * 2, b = (i + 1) * 8 + f * 2;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    this.geometry.setIndex(indices);
    this.update(0, 0, 0);
    this.geometry.computeBoundingSphere();
  }
  update(innerAngle: number, outerAngle = 0, breathing = 0): void {
    const { segments, inner, outer, turns, height, width } = this;
    for (let i = 0; i <= segments; i++) {
      const u = i / segments, v = 1 - u;
      const a = -Math.PI * .45 + TAU * turns * u + innerAngle * v * v + outerAngle * u * u;
      const r = inner + (outer - inner) * u + breathing * Math.sin(Math.PI * u);
      const da = TAU * turns - 2 * innerAngle * v + 2 * outerAngle * u;
      const dr = outer - inner + breathing * Math.PI * Math.cos(Math.PI * u);
      const ca = Math.cos(a), sa = Math.sin(a);
      const dx = dr * ca - r * sa * da, dy = dr * sa + r * ca * da;
      const inv = 1 / Math.sqrt(dx * dx + dy * dy);
      const nx = dy * inv, ny = -dx * inv;
      const x = r * ca, y = r * sa, hw = width / 2;
      const xo = x + nx * hw, yo = y + ny * hw, xi = x - nx * hw, yi = y - ny * hw;
      const p = i * 24, aPos = this.positions, aNorm = this.normals;
      aPos[p] = xo; aPos[p+1] = yo; aPos[p+2] = 0;
      aPos[p+3] = xo; aPos[p+4] = yo; aPos[p+5] = height;
      aPos[p+6] = xi; aPos[p+7] = yi; aPos[p+8] = height;
      aPos[p+9] = xi; aPos[p+10] = yi; aPos[p+11] = 0;
      aPos[p+12] = xo; aPos[p+13] = yo; aPos[p+14] = height;
      aPos[p+15] = xi; aPos[p+16] = yi; aPos[p+17] = height;
      aPos[p+18] = xi; aPos[p+19] = yi; aPos[p+20] = 0;
      aPos[p+21] = xo; aPos[p+22] = yo; aPos[p+23] = 0;
      for (let j = 0; j < 2; j++) {
        aNorm[p+j*3] = nx; aNorm[p+j*3+1] = ny; aNorm[p+j*3+2] = 0;
        aNorm[p+6+j*3] = -nx; aNorm[p+7+j*3] = -ny; aNorm[p+8+j*3] = 0;
        aNorm[p+12+j*3] = 0; aNorm[p+13+j*3] = 0; aNorm[p+14+j*3] = 1;
        aNorm[p+18+j*3] = 0; aNorm[p+19+j*3] = 0; aNorm[p+20+j*3] = -1;
      }
    }
    this.attribute.needsUpdate = true;
    this.normalAttribute.needsUpdate = true;
  }
}

export function handGeometry(length: number, width: number, tail: number, skeleton = true): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-width * .35, -tail);
  shape.lineTo(-width / 2, length * .30);
  shape.lineTo(-width * .24, length * .84);
  shape.lineTo(0, length);
  shape.lineTo(width * .24, length * .84);
  shape.lineTo(width / 2, length * .30);
  shape.lineTo(width * .35, -tail);
  shape.closePath();
  if (skeleton && length > .8) {
    const hole = new THREE.Path();
    hole.moveTo(-width * .15, length * .20);
    hole.lineTo(0, length * .79);
    hole.lineTo(width * .15, length * .20);
    hole.closePath();
    shape.holes.push(hole);
  }
  return new THREE.ExtrudeGeometry(shape, { depth: .018, bevelEnabled: true, bevelSize: .009,
    bevelThickness: .005, bevelSegments: 2, curveSegments: 8, steps: 1 });
}
