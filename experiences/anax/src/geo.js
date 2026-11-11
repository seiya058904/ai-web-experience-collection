// Procedural geometry helpers. Every solid the dragonfly is made of comes through here.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

/** Deterministic random numbers so the model is identical on every load. */
export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Placement matrix: translation, XYZ Euler rotation, uniform or per-axis scale. */
export function at(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) {
  const scale = typeof s === 'number' ? V(s, s, s) : V(s[0], s[1], s[2]);
  return new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), scale);
}

/** Matrix that carries the local +Y axis onto `dir` and moves the origin to `pos`. */
export function aim(pos, dir, roll = 0) {
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir.clone().normalize());
  if (roll) q.multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), roll));
  return new THREE.Matrix4().compose(pos, q, V(1, 1, 1));
}

// Flat shapes are drawn as (u, v). This basis lays them in the transverse plane as (z, y), extruding along -X,
// so an angle in a drawing is the same angle the kinematics uses.
const TRANSVERSE = new THREE.Matrix4().makeBasis(V(0, 0, 1), V(0, 1, 0), V(-1, 0, 0));

/**
 * Collects geometry by material, then merges each material's pieces into a single mesh.
 * One part of the machine becomes a handful of draw calls regardless of how many solids it has.
 */
export class Kit {
  constructor() {
    this.buckets = new Map();
  }

  add(geometry, material, matrix) {
    let g = geometry.index ? geometry.toNonIndexed() : geometry;
    for (const key of Object.keys(g.attributes)) {
      if (key !== 'position' && key !== 'normal' && key !== 'uv') g.deleteAttribute(key);
    }
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.clearGroups();
    if (matrix) g.applyMatrix4(matrix);
    if (!this.buckets.has(material)) this.buckets.set(material, []);
    this.buckets.get(material).push(g);
    if (g !== geometry) geometry.dispose();
    return this;
  }

  /** Emit the merged meshes as a group tagged with the component they belong to. */
  build(comp, { cast = true } = {}) {
    const group = new THREE.Group();
    for (const [material, list] of this.buckets) {
      const geometry = list.length > 1 ? mergeGeometries(list, false) : list[0];
      if (list.length > 1) list.forEach((g) => g.dispose());
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = cast && material.userData.cast !== false;
      mesh.receiveShadow = material.userData.receive !== false;
      mesh.userData.comp = comp;
      group.add(mesh);
    }
    this.buckets.clear();
    return group;
  }
}

/** Cylinder along a named axis, centred on the origin. `r1` tapers the far end. */
export function cyl(r, len, axis = 'x', seg = 28, r1 = r, open = false) {
  const g = new THREE.CylinderGeometry(r1, r, len, seg, 1, open);
  if (axis === 'x') g.rotateZ(-Math.PI / 2);
  else if (axis === 'z') g.rotateX(Math.PI / 2);
  return g;
}

/** Hollow sleeve along X: outer and inner wall with flat chamfered ends. */
export function sleeve(ro, ri, len, seg = 32, chamfer = 0.006) {
  const c = Math.min(chamfer, (ro - ri) * 0.4, len * 0.3);
  const h = len / 2;
  const pts = [
    [ri, -h], [ro - c, -h], [ro, -h + c], [ro, h - c], [ro - c, h], [ri, h], [ri, -h],
  ].map(([r, x]) => new THREE.Vector2(r, x));
  return turned(pts, seg);
}

/** Lathe a profile of (radius, axial) points around the X axis. Corners stay crisp. */
export function turned(points, seg = 32) {
  const pts = points.map((p) => (p.isVector2 ? p : new THREE.Vector2(p[0], p[1])));
  const g = new THREE.LatheGeometry(pts, seg);
  // Split the profile's corners so each face of the turning shades flat along its length but smooth around it.
  const flat = g.toNonIndexed();
  g.dispose();
  crease(flat, 0.6);
  flat.rotateZ(-Math.PI / 2);
  return flat;
}

/**
 * Recompute normals so edges sharper than `angle` radians stay hard and everything else is smooth.
 * Expects non-indexed geometry.
 */
export function crease(geometry, angle = 0.5) {
  const pos = geometry.attributes.position;
  const count = pos.count;
  const faceNormals = new Float32Array(count);
  const a = V(); const b = V(); const c = V(); const n = V();
  const buckets = new Map();
  const key = (i) => `${Math.round(pos.getX(i) * 4096)},${Math.round(pos.getY(i) * 4096)},${Math.round(pos.getZ(i) * 4096)}`;
  for (let i = 0; i < count; i += 3) {
    a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
    n.subVectors(c, b).cross(a.sub(b));
    // Area-weighted, so slivers do not skew the result.
    for (let k = 0; k < 3; k += 1) {
      faceNormals[i + k] = 0;
      const id = key(i + k);
      if (!buckets.has(id)) buckets.set(id, []);
      buckets.get(id).push([n.x, n.y, n.z]);
      faceNormals[i + k] = buckets.get(id).length - 1;
    }
  }
  const normals = new Float32Array(count * 3);
  const cosLimit = Math.cos(angle);
  const own = V(); const other = V(); const sum = V();
  for (let i = 0; i < count; i += 1) {
    const list = buckets.get(key(i));
    const mine = list[faceNormals[i]];
    own.set(mine[0], mine[1], mine[2]);
    const ownLength = own.length() || 1;
    sum.set(0, 0, 0);
    for (const item of list) {
      other.set(item[0], item[1], item[2]);
      const len = other.length();
      if (!len) continue;
      if (own.dot(other) / (ownLength * len) >= cosLimit) sum.add(other);
    }
    sum.normalize();
    normals[i * 3] = sum.x; normals[i * 3 + 1] = sum.y; normals[i * 3 + 2] = sum.z;
  }
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  return geometry;
}

/** Rod between two points with optional taper. */
export function rod(a, b, r, seg = 12, r1 = r) {
  const dir = V().subVectors(b, a);
  const g = new THREE.CylinderGeometry(r1, r, dir.length(), seg, 1);
  g.translate(0, dir.length() / 2, 0);
  g.applyMatrix4(aim(a, dir));
  return g;
}

/** Smooth tube through points, for cables and veins of constant thickness. */
export function tube(points, r, seg = 6, steps = 0, tension = 0.5) {
  const pts = points.map((p) => (p.isVector3 ? p : V(p[0], p[1], p[2])));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', tension);
  return new THREE.TubeGeometry(curve, steps || Math.max(8, pts.length * 6), r, seg, false);
}

export function ball(r, seg = 16) {
  return new THREE.SphereGeometry(r, seg, Math.max(8, Math.round(seg * 0.7)));
}

/** Box with softened edges. */
export function block(x, y, z, bevel = 0.008) {
  const b = Math.min(bevel, x * 0.3, y * 0.3, z * 0.3);
  const shape = roundRect(x - b * 2, y - b * 2, Math.min(b * 0.5, 0.004) + 1e-4);
  const g = new THREE.ExtrudeGeometry(shape, { depth: z - b * 2, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 3 });
  g.translate(0, 0, -(z - b * 2) / 2);
  return g;
}

export function roundRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2; const y = -h / 2;
  const k = Math.min(r, w / 2, h / 2);
  s.moveTo(x + k, y);
  s.lineTo(x + w - k, y);
  s.absarc(x + w - k, y + k, k, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - k);
  s.absarc(x + w - k, y + h - k, k, 0, Math.PI / 2, false);
  s.lineTo(x + k, y + h);
  s.absarc(x + k, y + h - k, k, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + k);
  s.absarc(x + k, y + k, k, Math.PI, Math.PI * 1.5, false);
  return s;
}

export function circlePath(cx, cy, r, clockwise = true) {
  const p = new THREE.Path();
  p.absarc(cx, cy, r, 0, Math.PI * 2, clockwise);
  return p;
}

/** Slot with round ends between two points. */
export function slotPath(x0, y0, x1, y1, r) {
  const ang = Math.atan2(y1 - y0, x1 - x0);
  const p = new THREE.Path();
  p.absarc(x0, y0, r, ang + Math.PI / 2, ang + Math.PI * 1.5, false);
  p.absarc(x1, y1, r, ang - Math.PI / 2, ang + Math.PI / 2, false);
  p.closePath();
  return p;
}

/** Annular window between two radii and two angles, for spoked gears and discs. */
export function windowPath(r0, r1, a0, a1) {
  const p = new THREE.Path();
  p.absarc(0, 0, r1, a0, a1, false);
  p.absarc(0, 0, r0, a1, a0, true);
  p.closePath();
  return p;
}

/** Outline of a link: two round ends joined by their outer tangents. */
export function linkShape(x0, y0, r0, x1, y1, r1) {
  const ang = Math.atan2(y1 - y0, x1 - x0);
  const d = Math.hypot(x1 - x0, y1 - y0);
  const half = Math.PI / 2 - Math.asin((r0 - r1) / d);
  const s = new THREE.Shape();
  s.absarc(x0, y0, r0, ang + half, ang - half + Math.PI * 2, false);
  s.absarc(x1, y1, r1, ang - half, ang + half, false);
  s.closePath();
  return s;
}

/** Extrude a flat shape to a plate centred on its thickness, with a fine chamfer. */
export function plate(shape, thick, bevel = 0.005, curveSegments = 10) {
  const b = Math.min(bevel, thick * 0.3);
  const g = new THREE.ExtrudeGeometry(shape, { depth: thick - b * 2, bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelOffset: -b, bevelSegments: 1, curveSegments });
  g.translate(0, 0, -(thick - b * 2) / 2);
  return g;
}

/** A plate drawn as (z, y) and laid across the body, its thickness along X. */
export function crossPlate(shape, thick, bevel, curveSegments) {
  return plate(shape, thick, bevel, curveSegments).applyMatrix4(TRANSVERSE);
}

/** Outline of a spur gear with a tooth centred on angle zero. */
export function gearShape(teeth, module, { bore = 0, windows = 0, hub = 0, rim = 0 } = {}) {
  const rp = (teeth * module) / 2;
  const ra = rp + module * 0.92;
  const rf = rp - module * 1.12;
  const tau = (Math.PI * 2) / teeth;
  const shape = new THREE.Shape();
  const flank = [[rf, -0.3], [rp, -0.235], [ra, -0.105], [ra, 0.105], [rp, 0.235], [rf, 0.3]];
  for (let i = 0; i < teeth; i += 1) {
    for (let k = 0; k < flank.length; k += 1) {
      const ang = (i + flank[k][1]) * tau;
      const x = Math.cos(ang) * flank[k][0];
      const y = Math.sin(ang) * flank[k][0];
      if (i === 0 && k === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    }
  }
  shape.closePath();
  if (bore) shape.holes.push(circlePath(0, 0, bore));
  if (windows) {
    const inner = hub || bore * 2.2;
    const outer = rf - (rim || module * 1.6);
    const web = 0.26;
    for (let i = 0; i < windows; i += 1) {
      const a0 = (i / windows) * Math.PI * 2 + web / 2;
      const a1 = ((i + 1) / windows) * Math.PI * 2 - web / 2;
      shape.holes.push(windowPath(inner, outer, a0, a1));
    }
  }
  return shape;
}

/** Spur gear across the body, axis along X. */
export function gear(teeth, module, thick, options) {
  return crossPlate(gearShape(teeth, module, options), thick, Math.min(0.004, module * 0.2), 12);
}

/** Spur gear with its axis along Z, for the feathering drive at the wing root. */
export function gearZ(teeth, module, thick, options) {
  return plate(gearShape(teeth, module, options), thick, Math.min(0.003, module * 0.2), 10);
}

/** Socket-head cap screw. The head sits above y = 0 and the shank below. */
export function screw(headR = 0.03, headH = 0.022, shankR = 0.014, shankLen = 0.05) {
  const c = headR * 0.2;
  const profile = [
    [0, -shankLen], [shankR, -shankLen], [shankR, 0], [headR, 0], [headR, headH - c], [headR - c, headH],
    [headR * 0.56, headH], [headR * 0.5, headH * 0.45], [0, headH * 0.45],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  // Six sides in the recess read as a hex socket; the head itself stays round.
  const body = new THREE.LatheGeometry(profile, 12).toNonIndexed();
  crease(body, 0.5);
  return body;
}

/**
 * A thick panel cut from any smooth surface, with rounded-over edges.
 * `surf(u, t, out)` gives a point; the panel spans u0..u1 and, at each u, t0(u)..t1(u).
 * This is what every piece of outer shell is made from.
 */
export function panel({ surf, u0, u1, nu = 48, t0, t1, nt = 24, thick = 0.03, bevel = 0.008, lift = 0, flip = false, uvU = 1, uvV = 1 }) {
  const lo = typeof t0 === 'function' ? t0 : () => t0;
  const hi = typeof t1 === 'function' ? t1 : () => t1;
  const a = V(); const b = V(); const du = V(); const dt = V(); const n = V(); const p = V();
  const eu = (u1 - u0) * 1e-3;

  const frame = (u, w) => {
    const ta = lo(u); const tb = hi(u);
    const t = ta + (tb - ta) * w;
    const et = Math.max(Math.abs(tb - ta), 1e-3) * 1e-3;
    surf(u + eu, lo(u + eu) + (hi(u + eu) - lo(u + eu)) * w, a);
    surf(u - eu, lo(u - eu) + (hi(u - eu) - lo(u - eu)) * w, b);
    du.subVectors(a, b);
    surf(u, t + et, a); surf(u, t - et, b);
    dt.subVectors(a, b);
    n.crossVectors(dt, du).normalize();
    if (flip) n.negate();
    surf(u, t, p);
  };

  // Parameter widths that correspond to the edge rounding, measured at the middle of the panel.
  const um = (u0 + u1) / 2;
  surf(um + eu, (lo(um) + hi(um)) / 2, a); surf(um - eu, (lo(um) + hi(um)) / 2, b);
  const perU = a.distanceTo(b) / (2 * eu);
  surf(um, lo(um), a); surf(um, hi(um), b);
  const perW = Math.max(a.distanceTo(b), 1e-4);
  const edgeU = Math.min(bevel / Math.max(perU, 1e-4), (u1 - u0) * 0.2);
  const edgeW = Math.min(bevel / perW, 0.2);

  const us = [];
  const ws = [];
  for (let i = 0; i <= nu; i += 1) {
    if (i === 0) us.push(u0);
    else if (i === nu) us.push(u1);
    else us.push(u0 + edgeU + ((u1 - u0 - edgeU * 2) * (i - 1)) / (nu - 2));
  }
  for (let j = 0; j <= nt; j += 1) {
    if (j === 0) ws.push(0);
    else if (j === nt) ws.push(1);
    else ws.push(edgeW + ((1 - edgeW * 2) * (j - 1)) / (nt - 2));
  }

  const cols = nu + 1;
  const rows = nt + 1;
  const layer = cols * rows;
  const positions = [];
  const uvs = [];
  const index = [];
  const outer = [];
  const inner = [];
  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      frame(us[i], ws[j]);
      const edge = i === 0 || j === 0 || i === nu || j === nt;
      const o = V().copy(p).addScaledVector(n, lift - (edge ? bevel : 0));
      const q = V().copy(p).addScaledVector(n, lift - thick);
      outer.push(o); inner.push(q);
      positions.push(o.x, o.y, o.z);
      uvs.push(((us[i] - u0) / (u1 - u0)) * uvU, ws[j] * uvV);
    }
  }
  for (const q of inner) positions.push(q.x, q.y, q.z);
  for (let k = 0; k < layer; k += 1) uvs.push(uvs[k * 2], uvs[k * 2 + 1]);

  const id = (i, j) => j * cols + i;
  for (let j = 0; j < nt; j += 1) {
    for (let i = 0; i < nu; i += 1) {
      const A = id(i, j); const B = id(i + 1, j); const C = id(i + 1, j + 1); const D = id(i, j + 1);
      index.push(A, D, B, B, D, C);
      index.push(layer + A, layer + B, layer + D, layer + B, layer + C, layer + D);
    }
  }
  // Edge wall, walked once around the outline.
  const loop = [];
  for (let i = 0; i < nu; i += 1) loop.push(id(i, 0));
  for (let j = 0; j < nt; j += 1) loop.push(id(nu, j));
  for (let i = nu; i > 0; i -= 1) loop.push(id(i, nt));
  for (let j = nt; j > 0; j -= 1) loop.push(id(0, j));
  let next = layer * 2;
  for (let k = 0; k < loop.length; k += 1) {
    const s = loop[k]; const e = loop[(k + 1) % loop.length];
    for (const v of [outer[s], outer[e], inner[e], inner[s]]) positions.push(v.x, v.y, v.z);
    uvs.push(uvs[s * 2], uvs[s * 2 + 1], uvs[e * 2], uvs[e * 2 + 1], uvs[e * 2], uvs[e * 2 + 1], uvs[s * 2], uvs[s * 2 + 1]);
    index.push(next, next + 1, next + 2, next, next + 2, next + 3);
    next += 4;
  }
  if (flip) for (let k = 0; k < index.length; k += 3) { const t = index[k + 1]; index[k + 1] = index[k + 2]; index[k + 2] = t; }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

/** Point and outward normal on a surface, for placing fasteners and trim on a shell. */
export function onSurface(surf, u, t, flip = false) {
  const a = V(); const b = V();
  const e = 1e-3;
  surf(u + e, t, a); surf(u - e, t, b);
  const du = V().subVectors(a, b);
  surf(u, t + e, a); surf(u, t - e, b);
  const dt = V().subVectors(a, b);
  const normal = V().crossVectors(dt, du).normalize();
  if (flip) normal.negate();
  const point = V();
  surf(u, t, point);
  return { point, normal };
}

/** Tapered, slightly flattened tube lying near a plane, used for wing veins. `up` is the plane normal. */
export function vein(points, r0, r1, seg = 5, flat = 0.7) {
  const count = points.length;
  const positions = [];
  const index = [];
  const tangent = V(); const side = V(); const up = V(0, 1, 0);
  for (let i = 0; i < count; i += 1) {
    const prev = points[Math.max(0, i - 1)];
    const nextPoint = points[Math.min(count - 1, i + 1)];
    tangent.subVectors(nextPoint, prev).normalize();
    side.crossVectors(tangent, up).normalize();
    const r = r0 + ((r1 - r0) * i) / Math.max(1, count - 1);
    for (let k = 0; k < seg; k += 1) {
      const ang = (k / seg) * Math.PI * 2;
      const cx = Math.cos(ang) * r;
      const cy = Math.sin(ang) * r * flat;
      positions.push(points[i].x + side.x * cx + up.x * cy, points[i].y + side.y * cx + up.y * cy, points[i].z + side.z * cx + up.z * cy);
    }
  }
  for (let i = 0; i < count - 1; i += 1) {
    for (let k = 0; k < seg; k += 1) {
      const a = i * seg + k; const b = i * seg + ((k + 1) % seg);
      const c = a + seg; const d = b + seg;
      index.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

/** Coil spring along X. */
export function coil(radius, wire, len, turns, seg = 8) {
  const pts = [];
  const steps = Math.round(turns * 14);
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const ang = t * turns * Math.PI * 2;
    pts.push(V((t - 0.5) * len, Math.cos(ang) * radius, Math.sin(ang) * radius));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), steps, wire, seg, false);
}

export { V };
