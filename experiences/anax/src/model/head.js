// Head: two compound eyes built from hundreds of small lenses, a face shield, jaws, ocelli, antennae,
// all carried on a ball joint so the head can make the quick, exact turns a dragonfly makes.
import * as THREE from 'three';
import { Kit, panel, onSurface, turned, sleeve, cyl, rod, ball, aim, at, V, seeded } from '../geo.js';
import { smooth, EASE } from '../kinematics.js';
import { THORAX } from './thorax.js';
import { mirrored } from './context.js';

const CENTRE = V(0.5, 0, 0);
const RADII = V(0.46, 0.44, 0.4);
// Face shell surface: u is elevation, t is azimuth from straight ahead.
function faceSurf(u, t, out, scale = 1) {
  const c = Math.cos(u);
  return out.set(CENTRE.x + RADII.x * scale * c * Math.cos(t), CENTRE.y + RADII.y * scale * Math.sin(u), CENTRE.z + RADII.z * scale * c * Math.sin(t));
}

export function buildHead(ctx, thorax) {
  const { M } = ctx;
  const head = new THREE.Group();
  head.position.set(THORAX.x1 + 0.16, 0.04, 0);
  thorax.add(head);
  ctx.part(head, [{ a: 0.3, b: 0.58, v: [2.5, 0, 0] }], { guide: true });
  const pose = new THREE.Group();
  head.add(pose);
  const late = (v, a = 0.66, b = 0.92) => [{ a, b, v }];

  // Neck: ball joint and the two push rods that steer it.
  let kit = new Kit();
  kit.add(ball(0.13, 24), M.steel);
  kit.add(cyl(0.07, 0.24, 'x', 18), M.gunmetal, at(-0.14, 0, 0));
  kit.add(sleeve(0.1, 0.07, 0.05, 20), M.polished, at(-0.24, 0, 0));
  for (const z of [-1, 1]) {
    const a = V(-0.2, 0.02, z * 0.2); const b = V(0.2, 0.05, z * 0.27);
    kit.add(rod(a, b, 0.014, 8), M.steel);
    kit.add(ball(0.026, 10), M.brass, at(a.x, a.y, a.z));
    kit.add(ball(0.026, 10), M.brass, at(b.x, b.y, b.z));
  }
  ctx.make(head, kit, 'head', late([-0.62, 0, 0]));

  // Cranium: the cup the eyes and face mount to.
  kit = new Kit();
  kit.add(turned([[0.07, 0.1], [0.3, 0.14], [0.42, 0.3], [0.44, 0.47], [0.4, 0.47], [0.385, 0.31], [0.28, 0.17], [0.07, 0.13]], 48), M.gunmetal);
  kit.add(sleeve(0.165, 0.13, 0.08, 28), M.polished, at(0.09, 0, 0));
  kit.add(sleeve(0.445, 0.4, 0.03, 48, 0.006), M.polished, at(0.47, 0, 0));
  ctx.make(pose, kit, 'head', late([-0.3, 0, 0]));

  // Eyes.
  const axis = V(0.36, 0.24, 0.9).normalize();
  const eyeCentre = V(0.56, 0.1, 0.35);
  const random = seeded(5);
  for (const side of [new THREE.Group(), mirrored()]) {
    pose.add(side);
    const place = aim(eyeCentre, axis);
    const step = (k) => late([axis.x * k, axis.y * k, axis.z * k]);
    const cap = 1.88; // how far the eye wraps round from its pole, radians

    kit = new Kit();
    kit.add(new THREE.SphereGeometry(0.352, 40, 24, 0, Math.PI * 2, 0, cap + 0.06), M.eyeBed);
    kit.add(cyl(0.2, 0.1, 'y', 24), M.gunmetal, at(0, -0.16, 0));
    kit.add(cyl(0.11, 0.05, 'y', 20), M.gold, at(0, -0.225, 0));
    const bed = kit.build('eye');
    bed.applyMatrix4(place);
    side.add(bed);
    ctx.part(bed, step(0.1));

    // Lens field: evenly spread points on the cap, one small lens at each.
    kit = new Kit();
    const count = 330;
    const lens = new THREE.SphereGeometry(0.034, 7, 3, 0, Math.PI * 2, 0, Math.PI * 0.42);
    const up = V(0, 1, 0);
    const span = 1 - Math.cos(cap);
    for (let i = 0; i < count; i += 1) {
      const y = 1 - ((i + 0.5) / count) * span;
      const r = Math.sqrt(1 - y * y);
      const phi = i * 2.399963;
      const normal = V(Math.cos(phi) * r, y, Math.sin(phi) * r);
      const m = new THREE.Matrix4().compose(normal.clone().multiplyScalar(0.342), new THREE.Quaternion().setFromUnitVectors(up, normal), V(1, 0.8 + random() * 0.25, 1));
      kit.add(lens.clone(), M.lens, m);
    }
    lens.dispose();
    const field = kit.build('eye');
    field.applyMatrix4(place);
    side.add(field);
    ctx.part(field, step(0.46));

    kit = new Kit();
    kit.add(new THREE.SphereGeometry(0.398, 56, 32, 0, Math.PI * 2, 0, cap), M.dome);
    const dome = kit.build('eye', { cast: false });
    dome.applyMatrix4(place);
    dome.children[0].renderOrder = 3;
    side.add(dome);
    ctx.part(dome, step(1.0));

    kit = new Kit();
    kit.add(new THREE.TorusGeometry(0.398 * Math.sin(cap), 0.02, 10, 56).rotateX(Math.PI / 2), M.polished, at(0, 0.398 * Math.cos(cap), 0));
    const rim = kit.build('eye');
    rim.applyMatrix4(place);
    side.add(rim);
    ctx.part(rim, step(0.72));

    // Jaw.
    kit = new Kit();
    const jaw = (u, t, out) => faceSurf(u, t, out, 0.94);
    kit.add(panel({ surf: jaw, u0: -1.42, u1: -1.02, nu: 10, t0: 0.5, t1: 0.98, nt: 10, thick: 0.05, bevel: 0.01, flip: true }), M.gunmetal);
    const tip = onSurface(jaw, -1.4, 0.62, true);
    kit.add(new THREE.ConeGeometry(0.03, 0.12, 8), M.steel, aim(tip.point, V(0.3, -1, -0.3)));
    ctx.make(side, kit, 'head', late([0.2, -0.5, 0.16]));
  }

  // Face shield with its brow line, and the lip below it.
  kit = new Kit();
  kit.add(panel({ surf: faceSurf, u0: -1.0, u1: 0.5, nu: 30, t0: -0.5, t1: 0.5, nt: 22, thick: 0.04, bevel: 0.01, flip: true, uvU: 1, uvV: 1 }), M.titanium);
  kit.add(panel({ surf: faceSurf, u0: -0.08, u1: 0.0, nu: 4, t0: -0.44, t1: 0.44, nt: 16, thick: 0.03, bevel: 0.006, lift: 0.014, flip: true }), M.dark);
  for (const t of [-0.36, 0.36]) {
    const s = onSurface(faceSurf, -0.82, t, true);
    kit.add(cyl(0.026, 0.02, 'y', 6), M.steel, aim(s.point, s.normal));
  }
  ctx.make(pose, kit, 'head', late([0.7, 0, 0]));

  kit = new Kit();
  kit.add(panel({ surf: (u, t, out) => faceSurf(u, t, out, 0.97), u0: -1.36, u1: -1.04, nu: 8, t0: -0.44, t1: 0.44, nt: 16, thick: 0.045, bevel: 0.01, flip: true }), M.dark);
  ctx.make(pose, kit, 'head', late([0.42, -0.4, 0]));

  // Crown: three ocelli and the antennae.
  kit = new Kit();
  kit.add(panel({ surf: faceSurf, u0: 0.54, u1: 1.3, nu: 14, t0: -0.34, t1: 0.34, nt: 10, thick: 0.04, bevel: 0.01, flip: true }), M.gunmetal);
  for (const [u, t] of [[0.74, 0], [0.98, -0.2], [0.98, 0.2]]) {
    const s = onSurface(faceSurf, u, t, true);
    kit.add(new THREE.SphereGeometry(0.034, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.lens, aim(s.point, s.normal));
    kit.add(new THREE.TorusGeometry(0.036, 0.008, 6, 18).rotateX(Math.PI / 2), M.polished, aim(s.point, s.normal));
  }
  for (const z of [-1, 1]) {
    const s = onSurface(faceSurf, 0.6, z * 0.22, true);
    const end = s.point.clone().add(V(0.26, 0.2, z * 0.12));
    kit.add(rod(s.point, end, 0.012, 6, 0.003), M.dark);
    kit.add(ball(0.022, 10), M.brass, at(s.point.x, s.point.y, s.point.z));
  }
  ctx.make(pose, kit, 'head', late([0.18, 0.6, 0]));

  // Saccades: hold still, then snap to a new heading.
  const gaze = { yaw: 0, pitch: 0, roll: 0, fromYaw: 0, fromPitch: 0, fromRoll: 0, toYaw: 0, toPitch: 0, toRoll: 0, t: 1, wait: 1.4 };
  function update(delta, p, still) {
    const live = still ? 0 : 1 - smooth(0.02, 0.2, p);
    gaze.wait -= delta;
    if (gaze.wait <= 0) {
      gaze.fromYaw = gaze.yaw; gaze.fromPitch = gaze.pitch; gaze.fromRoll = gaze.roll;
      gaze.toYaw = (random() - 0.5) * 0.24; gaze.toPitch = (random() - 0.5) * 0.12; gaze.toRoll = (random() - 0.5) * 0.14;
      gaze.t = 0; gaze.wait = 1.3 + random() * 2.6;
    }
    if (gaze.t < 1) {
      gaze.t = Math.min(1, gaze.t + delta / 0.16);
      const k = EASE.out(gaze.t);
      gaze.yaw = gaze.fromYaw + (gaze.toYaw - gaze.fromYaw) * k;
      gaze.pitch = gaze.fromPitch + (gaze.toPitch - gaze.fromPitch) * k;
      gaze.roll = gaze.fromRoll + (gaze.toRoll - gaze.fromRoll) * k;
    }
    pose.rotation.set(gaze.roll * live, gaze.yaw * live, gaze.pitch * live);
  }

  return { head, pose, update };
}
