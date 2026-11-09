import { CHARACTER_METRICS } from './character-metrics.ts';
import type {
  BodyPose, CharacterMetrics, DanceContact, DanceFrame, DanceOptions, DancerId,
  FootPose, HandPose, JointName, Side, Vec3,
} from './motion-types.ts';

export type * from './motion-types.ts';
export { CHARACTER_METRICS } from './character-metrics.ts';

// A pose is a query, never the result of a sequence of enter/leave events.
// The complete score is 0..10. Each outgoing transition occupies local .76..1.
export const TRANSITION_START = 0.76;
export const CONTACT_HANDS = ['right', 'left'] as const;
const PI = Math.PI;
const HALF_PI = PI / 2;
const EPS = 1e-8;
type Key = readonly [number, number];
type PositionKey = readonly [number, number, number];
type FootAnchor = { x: number; z: number; yaw: number };
type Step = { start: number; end: number; to: FootAnchor; lift?: number };
type HandTarget = Omit<HandPose, 'position'> & { position: Vec3 };

export const clamp = (v: number, lo = 0, hi = 1): number => Math.min(hi, Math.max(lo, v));
export const smooth = (u: number): number => { const x = clamp(u); return x * x * (3 - 2 * x); };
const ramp = (t: number, a: number, b: number): number => smooth((t - a) / (b - a));
const mix = (a: number, b: number, u: number): number => a + (b - a) * u;
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Vec3, n: number): Vec3 => [a[0] * n, a[1] * n, a[2] * n];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const length = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
const norm = (a: Vec3, fallback: Vec3 = [0, 1, 0]): Vec3 => {
  const l = length(a); return l > EPS ? mul(a, 1 / l) : [...fallback];
};
const lerp = (a: Vec3, b: Vec3, u: number): Vec3 => [mix(a[0], b[0], u), mix(a[1], b[1], u), mix(a[2], b[2], u)];
const rotateY = (p: Vec3, a: number): Vec3 => [p[0] * Math.cos(a) + p[2] * Math.sin(a), p[1], -p[0] * Math.sin(a) + p[2] * Math.cos(a)];
const rotateX = (p: Vec3, a: number): Vec3 => [p[0], p[1] * Math.cos(a) - p[2] * Math.sin(a), p[1] * Math.sin(a) + p[2] * Math.cos(a)];
const sideSign = (side: Side): number => side === 'left' ? 1 : -1;
const joint = (side: Side, suffix: string): JointName => `${side}${suffix}` as JointName;
type Quat = [number, number, number, number];

function handQuaternion(f: Vec3, n: Vec3): Quat {
  const r = norm(cross(f, n));
  const m00 = r[0], m01 = f[0], m02 = n[0];
  const m10 = r[1], m11 = f[1], m12 = n[1];
  const m20 = r[2], m21 = f[2], m22 = n[2];
  const trace = m00 + m11 + m22;
  if (trace > 0) { const s = Math.sqrt(trace + 1) * 2; return [(m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s, .25 * s]; }
  if (m00 > m11 && m00 > m22) { const s = Math.sqrt(1 + m00 - m11 - m22) * 2; return [.25 * s, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s]; }
  if (m11 > m22) { const s = Math.sqrt(1 + m11 - m00 - m22) * 2; return [(m01 + m10) / s, .25 * s, (m12 + m21) / s, (m02 - m20) / s]; }
  const s = Math.sqrt(1 + m22 - m00 - m11) * 2; return [(m02 + m20) / s, (m12 + m21) / s, .25 * s, (m10 - m01) / s];
}

function slerpQuaternion(a: Quat, b: Quat, u: number): Quat {
  let cos = a.reduce((sum, v, i) => sum + v * b[i], 0);
  let target = b;
  if (cos < 0) { target = b.map(v => -v) as Quat; cos = -cos; }
  if (cos > .9995) {
    const q = a.map((v, i) => mix(v, target[i], u)) as Quat;
    const l = Math.hypot(...q); return q.map(v => v / l) as Quat;
  }
  const theta = Math.acos(clamp(cos, -1, 1));
  const divisor = Math.sin(theta);
  return a.map((v, i) => (v * Math.sin((1 - u) * theta) + target[i] * Math.sin(u * theta)) / divisor) as Quat;
}

function rotateQuaternion(v: Vec3, q: Quat): Vec3 {
  const axis: Vec3 = [q[0], q[1], q[2]], uv = cross(axis, v), uuv = cross(axis, uv);
  return add(v, add(mul(uv, 2 * q[3]), mul(uuv, 2)));
}

function track(t: number, keys: readonly Key[]): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const a = keys[i - 1], b = keys[i];
      return mix(a[1], b[1], smooth((t - a[0]) / (b[0] - a[0])));
    }
  }
  return keys[keys.length - 1][1];
}

function positionTrack(t: number, keys: readonly PositionKey[]): [number, number] {
  if (t <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const a = keys[i - 1], b = keys[i];
      const u = smooth((t - a[0]) / (b[0] - a[0]));
      return [mix(a[1], b[1], u), mix(a[2], b[2], u)];
    }
  }
  const k = keys[keys.length - 1]; return [k[1], k[2]];
}

const ROOT_PATHS: Record<DancerId, readonly PositionKey[]> = {
  cen: [
    [0, -.46, 0], [4.76, -.46, 0], [5.06, -.30, .07], [5.33, .015, .13],
    [5.59, .30, .13], [5.76, .43, .13], [6, .085, 0], [7, .085, 0],
    [7.24, .25, -.02], [8.76, .25, -.02], [9, .52, 0], [10, .52, 0],
  ],
  cheng: [
    [0, .46, 0], [4.76, .46, 0], [5.16, .39, -.35], [5.40, .08, -.55],
    [5.62, -.26, -.43], [5.76, -.43, -.13], [6, -.105, 0], [7, -.105, 0],
    [7.24, -.22, .06], [7.46, -.27, .20], [7.68, -.34, .18],
    [8.76, -.34, .18], [9, -.52, 0], [10, -.52, 0],
  ],
};

const ROOT_YAW: Record<DancerId, readonly Key[]> = {
  cen: [[0, HALF_PI], [7, HALF_PI], [7.24, 0], [8.76, 0], [9, -HALF_PI], [10, -HALF_PI]],
  cheng: [[0, -HALF_PI], [7, -HALF_PI], [7.24, 0], [7.68, .8], [8.76, .8], [9, HALF_PI], [10, HALF_PI]],
};

const FOOT_INITIAL: Record<DancerId, Record<Side, FootAnchor>> = {
  cen: { left: { x: -.46, z: -.13, yaw: HALF_PI }, right: { x: -.46, z: .13, yaw: HALF_PI } },
  cheng: { left: { x: .46, z: .14, yaw: -HALF_PI }, right: { x: .46, z: -.14, yaw: -HALF_PI } },
};

const STEPS: Record<DancerId, Record<Side, readonly Step[]>> = {
  cen: {
    right: [
      { start: 4.83, end: 5.06, to: { x: -.14, z: .26, yaw: HALF_PI } },
      { start: 5.34, end: 5.59, to: { x: .43, z: .26, yaw: HALF_PI } },
      { start: 5.90, end: 6, to: { x: .30, z: .13, yaw: HALF_PI }, lift: .035 },
      { start: 7.00, end: 7.10, to: { x: .12, z: .03, yaw: 0 }, lift: .038 },
      { start: 8.89, end: 9.00, to: { x: .52, z: -.13, yaw: -HALF_PI }, lift: .045 },
    ],
    left: [
      { start: 5.07, end: 5.33, to: { x: .17, z: -.02, yaw: HALF_PI } },
      { start: 5.60, end: 5.75, to: { x: .43, z: 0, yaw: HALF_PI } },
      { start: 5.78, end: 5.90, to: { x: .30, z: -.13, yaw: HALF_PI }, lift: .035 },
      { start: 7.11, end: 7.24, to: { x: .38, z: -.06, yaw: 0 }, lift: .038 },
      { start: 8.77, end: 8.88, to: { x: .52, z: .13, yaw: -HALF_PI }, lift: .045 },
    ],
  },
  cheng: {
    left: [
      { start: 4.90, end: 5.16, to: { x: .31, z: -.16, yaw: -HALF_PI }, lift: .045 },
      { start: 5.41, end: 5.62, to: { x: -.25, z: -.16, yaw: -HALF_PI } },
      { start: 5.90, end: 6.00, to: { x: -.33, z: .14, yaw: -HALF_PI }, lift: .035 },
      { start: 7.00, end: 7.12, to: { x: -.08, z: .10, yaw: 0 }, lift: .038 },
      { start: 7.27, end: 7.46, to: { x: -.18, z: .37, yaw: .8 }, lift: .05 },
      { start: 8.77, end: 8.90, to: { x: -.52, z: -.14, yaw: HALF_PI }, lift: .05 },
    ],
    right: [
      { start: 5.17, end: 5.40, to: { x: .05, z: -.56, yaw: -HALF_PI } },
      { start: 5.63, end: 5.76, to: { x: -.43, z: -.27, yaw: -HALF_PI } },
      { start: 5.78, end: 5.90, to: { x: -.33, z: -.14, yaw: -HALF_PI }, lift: .035 },
      { start: 7.13, end: 7.24, to: { x: -.36, z: .02, yaw: 0 }, lift: .038 },
      { start: 7.47, end: 7.68, to: { x: -.48, z: .10, yaw: .8 }, lift: .05 },
      { start: 8.91, end: 9.00, to: { x: -.52, z: .14, yaw: HALF_PI }, lift: .035 },
    ],
  },
};

/** A support foot stays exactly at an authored anchor until its own swing begins. */
function sampleFoot(id: DancerId, side: Side, t: number, m: CharacterMetrics): FootPose {
  let anchor = FOOT_INITIAL[id][side];
  let x = anchor.x, z = anchor.z, yaw = anchor.yaw, lift = 0, swing = 0;
  let planted = true;
  for (const step of STEPS[id][side]) {
    if (t <= step.start) break;
    if (t >= step.end) {
      anchor = step.to; x = anchor.x; z = anchor.z; yaw = anchor.yaw;
      continue;
    }
    swing = (t - step.start) / (step.end - step.start);
    const u = smooth(swing);
    x = mix(anchor.x, step.to.x, u);
    z = mix(anchor.z, step.to.z, u);
    yaw = mix(anchor.yaw, step.to.yaw, u);
    // The sin-squared arc has zero vertical speed at lift-off and touchdown.
    lift = (step.lift ?? .065) * Math.sin(PI * swing) ** 2;
    planted = false;
    break;
  }
  const ankle: Vec3 = [x, m.ankleHeight + lift, z];
  const localToe = sub(m.joints[joint(side, 'Toe')], m.joints[joint(side, 'Ankle')]);
  const toe = add(ankle, rotateY(localToe, yaw));
  return { ankle, toe, yaw, planted, swing };
}

export interface IKResult { middle: Vec3; end: Vec3; clamped: boolean }

/** Geometric two-bone IK: segment lengths are preserved, including at full reach. */
export function solveTwoBone(start: Vec3, wantedEnd: Vec3, l1: number, l2: number, pole: Vec3): IKResult {
  const raw = sub(wantedEnd, start);
  const distance = length(raw);
  const d = clamp(distance, Math.abs(l1 - l2) + .00005, l1 + l2 - .00005);
  const direction = norm(raw, [0, -1, 0]);
  const end = add(start, mul(direction, d));
  const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const height = Math.sqrt(Math.max(0, l1 * l1 - along * along));
  let p = sub(pole, start);
  p = sub(p, mul(direction, dot(p, direction)));
  if (length(p) < .00001) {
    const backup: Vec3 = Math.abs(direction[2]) < .8 ? [0, 0, 1] : [1, 0, 0];
    p = sub(backup, mul(direction, dot(backup, direction)));
  }
  return { middle: add(add(start, mul(direction, along)), mul(norm(p), height)), end, clamped: Math.abs(d - distance) > .000001 };
}

function counterweight(t: number): number {
  return track(t, [[0, 0], [2.89, 0], [3, .22], [3.15, .22], [3.45, 1], [3.76, 1], [3.90, 0], [10, 0]]);
}

function lowering(t: number): number {
  return track(t, [[0, 0], [6.08, 0], [6.45, 1], [6.76, 1], [7, 0], [10, 0]]);
}

function phrasePhase(t: number, id: DancerId, mode: 'unison' | 'echo'): number {
  if (t < 4 || t > 4.76) return 0;
  if (t <= 4 + EPS) return 0;
  if (t >= 4.76 - EPS) return 1;
  const u = clamp((t - 4) / .76);
  return mode === 'unison' ? u : clamp((u - (id === 'cheng' ? .23 : 0)) / .77);
}

function gesture(q: number): { rise: number; turn: number } {
  return {
    rise: ramp(q, 0, .34) * (1 - ramp(q, .62, 1)),
    turn: ramp(q, .24, .53) * (1 - ramp(q, .62, .98)),
  };
}

function rootAt(id: DancerId, t: number): [number, number] {
  return positionTrack(t, ROOT_PATHS[id]);
}

function makeBody(id: DancerId, t: number, options: DanceOptions): BodyPose {
  const m = CHARACTER_METRICS[id];
  const [pathX, pathZ] = rootAt(id, t);
  const rootYaw = track(t, ROOT_YAW[id]);
  const q = phrasePhase(t, id, options.mode ?? 'unison');
  const phrase = gesture(q);
  const load = counterweight(t);
  const low = lowering(t);
  const groundShift = id === 'cen' ? track(t, [[0, 0], [1.17, 0], [1.38, .034], [1.67, 0], [10, 0]]) : 0;
  const echoAnswer = id === 'cen'
    ? track(t, [[0, 0], [8.43, 0], [8.52, 1], [8.61, 0], [10, 0]])
    : track(t, [[0, 0], [8.52, 0], [8.61, 1], [8.72, 0], [10, 0]]);
  const response = id === 'cen'
    ? track(t, [[0, 0], [2.16, 0], [2.36, 1], [2.60, 1], [2.76, 0], [10, 0]])
    : track(t, [[0, 0], [2.22, 0], [2.43, 1], [2.60, 1], [2.76, 0], [10, 0]]);
  const phraseLook = track(t, [[0, 0], [7.27, 0], [7.64, 1], [8.30, 1], [8.60, 0], [10, 0]]);
  const chestYaw = rootYaw + phrase.turn * .25 + response * (id === 'cen' ? -.075 : .075)
    + phraseLook * (id === 'cen' ? -.36 : .20) + echoAnswer * .035;
  const headYaw = chestYaw + phraseLook * (id === 'cen' ? -.25 : .12);
  const headPitch = id === 'cheng' ? .10 * (1 - ramp(t, .12, .28)) : -.015;
  const feet = { left: sampleFoot(id, 'left', t, m), right: sampleFoot(id, 'right', t, m) };
  const root: Vec3 = [pathX + groundShift + load * (id === 'cen' ? -.015 : .018), m.joints.pelvis[1] - low * (id === 'cen' ? .22 : .30), pathZ];
  // Pelvis height is bounded by both measured leg chains. This preserves foot
  // contact while a planted pair accepts a modest lean or a changing stride.
  for (const side of ['left', 'right'] as const) {
    const hipOffset = rotateY(sub(m.joints[joint(side, 'Hip')], m.joints.pelvis), rootYaw);
    const ankle = feet[side].ankle;
    const dx = root[0] + hipOffset[0] - ankle[0];
    const dz = root[2] + hipOffset[2] - ankle[2];
    // Keep a visible, small knee bend even at the longest stride. An almost
    // perfectly straight chain creates a square-root velocity spike on return.
    const reach = m.lengths.thigh + m.lengths.shin - .006;
    const maxY = ankle[1] + Math.sqrt(Math.max(.01, reach * reach - dx * dx - dz * dz)) - hipOffset[1];
    root[1] = Math.min(root[1], maxY);
  }
  const breath = clamp(options.breath ?? 0, -1, 1) * .0016;
  const lean: Vec3 = [load * (id === 'cen' ? -.065 : .075), -load * .009 + breath, response * .008];
  const joints = {} as Record<JointName, Vec3>;
  joints.pelvis = [...root];
  const neutralSpan = m.joints.neck[1] - m.joints.pelvis[1];
  for (const name of ['spine', 'chest', 'neck'] as const) {
    const offset = sub(m.joints[name], m.joints.pelvis);
    const f = clamp(offset[1] / neutralSpan);
    joints[name] = add(add(root, rotateY(offset, mix(rootYaw, chestYaw, f))), mul(lean, f));
  }
  for (const name of ['head', 'headTop', 'nose'] as const) {
    joints[name] = add(joints.neck, rotateY(rotateX(sub(m.joints[name], m.joints.neck), headPitch), headYaw));
  }
  for (const side of ['left', 'right'] as const) {
    const sign = sideSign(side);
    joints[joint(side, 'Shoulder')] = add(joints.chest, rotateY(sub(m.joints[joint(side, 'Shoulder')], m.joints.chest), chestYaw));
    joints[joint(side, 'Shoulder')][1] += (response * .009 + echoAnswer * .012) * (sign > 0 ? 1 : -.35);
    const hip = add(root, rotateY(sub(m.joints[joint(side, 'Hip')], m.joints.pelvis), rootYaw));
    joints[joint(side, 'Hip')] = hip;
    const pole = add(hip, rotateY([sign * .025, -.12, .7], rootYaw));
    const leg = solveTwoBone(hip, feet[side].ankle, m.lengths.thigh, m.lengths.shin, pole);
    joints[joint(side, 'Knee')] = leg.middle;
    joints[joint(side, 'Ankle')] = feet[side].ankle;
    joints[joint(side, 'Toe')] = feet[side].toe;
  }
  return { id, root, rootYaw, chestYaw, headYaw, joints, hands: {} as Record<Side, HandPose>, feet, lean, phrasePhase: q };
}

function handTarget(position: Vec3, forward: Vec3, normal: Vec3, curl = .12, contact = false): HandTarget {
  const f = norm(forward, [0, -1, 0]);
  const n = norm(sub(normal, mul(f, dot(normal, f))), [0, 0, 1]);
  return { position, forward: f, normal: n, curl, fingers: [curl * .6, curl, curl, curl * 1.04, curl * 1.1], spread: .16, contact };
}

function mixHand(a: HandTarget, b: HandTarget, u: number): HandTarget {
  // Spherical orientation interpolation avoids a palm flipping when two
  // projected normals pass through opposite directions during release.
  const orientation = slerpQuaternion(handQuaternion(a.forward, a.normal), handQuaternion(b.forward, b.normal), u);
  const f = rotateQuaternion([0, 1, 0], orientation);
  const n = rotateQuaternion([0, 0, 1], orientation);
  return {
    position: lerp(a.position, b.position, u), forward: f, normal: n,
    curl: mix(a.curl, b.curl, u),
    fingers: a.fingers.map((v, i) => mix(v, b.fingers[i], u)) as HandPose['fingers'],
    spread: mix(a.spread, b.spread, u), contact: b.contact && u > .995,
  };
}

function restingHand(body: BodyPose, side: Side, t: number): HandTarget {
  const m = CHARACTER_METRICS[body.id], sign = sideSign(side);
  const low = lowering(t);
  const walk = t > 4.76 && t < 6 ? Math.sin((t - 4.76) / 1.24 * PI * 4) * Math.sin((t - 4.76) / 1.24 * PI) : 0;
  const wristLocal: Vec3 = [sign * (m.shoulderHalfWidth + .025 + low * .035), .025, .065 + walk * sign * .035];
  const forward = rotateY(norm([sign * .05, -1, .08]), body.chestYaw);
  const wrist = add(body.root, rotateY(wristLocal, body.chestYaw));
  return handTarget(add(wrist, mul(forward, m.lengths.palm)), forward, rotateY([-sign, 0, .16], body.chestYaw), .13);
}

function offeredHand(body: BodyPose): HandTarget {
  return body.id === 'cen'
    ? handTarget([-.14, 1.14, .18], [.75, .65, .03], [-.4, .45, 1], .08)
    : handTarget([.14, 1.15, .18], [-.75, .65, .03], [.4, .45, 1], .08);
}

function palmContact(body: BodyPose, t: number): HandTarget {
  const direction = track(t, [[0, 0], [2.16, 0], [2.42, 1], [2.58, 1], [2.76, 0], [10, 0]]);
  const sign = body.id === 'cen' ? -1 : 1;
  // The surrounding interpolation has zero/full weight at these endpoints.
  // Retain its original arithmetic there so already-rendered frames outside
  // the isolated correction window remain bit-for-bit reproducible.
  if (t <= 1.76 || t >= 2.89) return handTarget([sign * .018 + direction * .024, 1.18 + direction * .024, .18 - direction * .02], [0, 1, .03], [-sign, 0, 0], .035, true);
  // A relaxed open palm exchange, with the fingers along the forearms.
  // Upright palms at this reach forced >110 degrees of wrist extension.
  // The real mesh's curved palm pads project 28/31 mm beyond their centres;
  // preserve their thickness instead of intersecting the two hand surfaces.
  // Facing ±Z also retains the forearm's twist branch into the later grasp.
  return handTarget([-.035 + direction * .024, 1.18 + direction * .024, .18 + sign * .030 - direction * .02], [-sign, 0, 0], [0, 0, -sign], .035, true);
}

function grippingHand(body: BodyPose): HandTarget {
  const cen = body.id === 'cen';
  // A slightly off-centre clasp accommodates Cen's shorter measured reach.
  // Moderate finger bends keep one readable hold instead of two closed fists.
  const h = handTarget([cen ? -.053 : -.017, 1.18, cen ? .163 : .197], [cen ? 1 : -1, 0, 0], [0, 0, cen ? 1 : -1], cen ? .60 : .54, true);
  h.fingers = cen ? [.35, .50, .56, .60, .62] : [.32, .44, .48, .52, .56]; h.spread = .02;
  return h;
}

function phraseHand(body: BodyPose, side: Side, rest: HandTarget): HandTarget {
  const m = CHARACTER_METRICS[body.id], sign = sideSign(side), g = gesture(body.phrasePhase);
  const wrist = add(body.root, rotateY([sign * (m.shoulderHalfWidth + .08 + .14 * g.rise), .025 + .67 * g.rise, .065 + .12 * g.rise], body.chestYaw));
  const f = rotateY(norm([sign * .16 * g.rise, mix(-1, .8, g.rise), .08]), body.chestYaw);
  const raised = handTarget(add(wrist, mul(f, m.lengths.palm)), f, rotateY([-sign * .6, 0, .7], body.chestYaw), .06);
  return mixHand(rest, raised, g.rise);
}

function finalContact(body: BodyPose): HandTarget {
  const forward: Vec3 = body.id === 'cen' ? [-1, .04, .02] : [1, .04, -.02];
  const point: Vec3 = [-.04, 1.185, .17];
  const h = handTarget([0, 0, 0], forward, [0, 0, body.id === 'cen' ? 1 : -1], .06, true);
  // Measured from the shipped middle-finger distal bone, expressed in the
  // palm's (forward, outward normal, across) basis. The original mesh has a
  // natural finger curve already; inventing a straight 4 cm finger overlaps
  // the pair. Keep the last touching digit at its measured neutral shape.
  const measured: Vec3 = body.id === 'cen'
    ? [.12080295, .03733340, -.00843560]
    : [.14398674, .04289339, .01019853];
  const across = cross(h.forward, h.normal);
  const tipOffset = add(add(mul(h.forward, measured[0]), mul(h.normal, measured[1])), mul(across, measured[2]));
  // Start with an 8 mm bone-end separation, then account for the measured
  // finger-pad direction of the actual skinned geometry. The small opposite
  // correction leaves approximately 1 mm of skin clearance, not a visible gap.
  h.position = sub(sub(point, mul(h.forward, .004)), tipOffset);
  h.position = add(h.position, body.id === 'cen' ? [-.00352, -.00048, .00285] : [.00352, .00048, -.00285]);
  h.fingers = [.08, .04, 0, .10, .14]; h.spread = 0;
  return h;
}

function danceHand(body: BodyPose, side: Side, t: number): HandTarget {
  const m = CHARACTER_METRICS[body.id], sign = sideSign(side);
  const dominant = side === (body.id === 'cen' ? 'right' : 'left');
  const rest = restingHand(body, side, t);
  let result = rest;
  if (dominant && t < 4) {
    const offer = offeredHand(body);
    result = body.id === 'cen' ? offer : mixHand(rest, offer, ramp(t, .28, .66));
    if (t >= 1.76) result = mixHand(offer, palmContact(body, t), ramp(t, 1.76, 2));
    if (t >= 2.76) result = mixHand(palmContact(body, t), grippingHand(body), ramp(t, 2.76, 2.89));
    if (t >= 3.91) {
      const release = ramp(t, 3.91, 3.98);
      const grip = grippingHand(body);
      grip.fingers = grip.fingers.map((v, i) => v * (1 - ramp(t, 3.91 + i * .006, 3.955 + i * .006))) as HandPose['fingers'];
      grip.curl *= 1 - release;
      result = mixHand(grip, rest, ramp(t, 3.935, 4));
    }
  } else if (t >= 4 && t <= 4.76) {
    result = phraseHand(body, side, rest);
  }

  // The non-connecting arms remain part of the dance and balance the lean.
  if (!dominant && t >= 2.89 && t < 4) {
    const load = counterweight(t);
    const wrist = add(body.root, rotateY([sign * (m.shoulderHalfWidth + .10), .12, -.08], body.chestYaw));
    const balance = handTarget(add(wrist, rotateY([0, -m.lengths.palm, 0], body.chestYaw)), rotateY([0, -1, .12], body.chestYaw), rotateY([0, 0, 1], body.chestYaw), .09);
    result = mixHand(rest, balance, load);
  }

  if (t >= 7.24) {
    const opening = ramp(t, 7.27, 7.68) * (1 - ramp(t, 8.10, 8.43));
    if (!dominant) {
      const shoulder = body.joints[joint(side, 'Shoulder')];
      const local: Vec3 = [sign * .32, body.id === 'cen' ? .16 : -.015, .06];
      const wrist = add(shoulder, rotateY(local, body.chestYaw));
      const f = rotateY(norm([sign, .18, .05]), body.chestYaw);
      const expanded = handTarget(add(wrist, mul(f, m.lengths.palm)), f, [0, 0, 1], .045);
      result = mixHand(rest, expanded, opening);
    } else {
      const contact = finalContact(body);
      if (t > 8.10) {
        contact.fingers = contact.fingers.map((v, i) => v * (1 - ramp(t, 8.10 + i * .018, 8.18 + i * .018))) as HandPose['fingers'];
        contact.curl *= 1 - ramp(t, 8.10, 8.26);
        contact.contact = t < 8.26;
      }
      result = mixHand(rest, contact, ramp(t, 7.52, 7.76) * (1 - ramp(t, 8.26, 8.42)));
      const answer = body.id === 'cen'
        ? track(t, [[0, 0], [8.43, 0], [8.52, 1], [8.61, 0], [10, 0]])
        : track(t, [[0, 0], [8.52, 0], [8.61, 1], [8.72, 0], [10, 0]]);
      if (answer > 0) {
        const answerHand = handTarget(add(rest.position, rotateY([0, .095, .085], body.chestYaw)), rotateY([0, -.7, .7], body.chestYaw), rotateY([-sign, 0, .3], body.chestYaw), .08);
        result = mixHand(result, answerHand, answer);
      }
    }
    const ending = ramp(t, 8.76, 9);
    if (ending > 0) {
      const wrist = add(body.root, rotateY([sign * (m.shoulderHalfWidth + .025), .10, .09], body.chestYaw));
      const f = rotateY(norm([0, -.8, .4]), body.chestYaw);
      const endHand = handTarget(add(wrist, mul(f, m.lengths.palm)), f, rotateY([-sign, 0, .2], body.chestYaw), .07);
      result = mixHand(result, endHand, ending);
    }
  }
  return result;
}

function applyHands(body: BodyPose, t: number): void {
  const m = CHARACTER_METRICS[body.id];
  for (const side of ['left', 'right'] as const) {
    const target = danceHand(body, side, t);
    const wristTarget = sub(target.position, mul(target.forward, m.lengths.palm));
    const shoulder = body.joints[joint(side, 'Shoulder')];
    const dominant = side === (body.id === 'cen' ? 'right' : 'left');
    // Keep the connecting arm's bend plane stable for the whole score. Moving
    // the pole through the forearm axis during release can invert the elbow.
    const connecting = dominant ? 1 : counterweight(t);
    const poleDirection = lerp([sideSign(side) * .12, -.22, 1], [sideSign(side) * .32, -.85, .08], connecting);
    const pole = add(shoulder, rotateY(poleDirection, body.chestYaw));
    const arm = solveTwoBone(shoulder, wristTarget, m.lengths.upperArm, m.lengths.forearm, pole);
    // For independent gestures, the measured arm limits define a safe envelope.
    // Contact targets are authored inside that envelope and verified separately.
    const hand = { ...target, position: add(arm.end, mul(target.forward, m.lengths.palm)) };
    body.joints[joint(side, 'Elbow')] = arm.middle;
    body.joints[joint(side, 'Wrist')] = arm.end;
    body.joints[joint(side, 'Hand')] = hand.position;
    body.hands[side] = hand;
  }
}

function contactAt(t: number): DanceContact {
  if (t >= 1.98 && t < 2.82) return { kind: 'palm', strength: ramp(t, 1.98, 2), point: [0, 1.18, .18], hands: CONTACT_HANDS };
  if (t >= 2.82 && t <= 3.97) return { kind: 'grip', strength: ramp(t, 2.82, 2.89) * (1 - ramp(t, 3.91, 3.97)), point: [-.035 * ramp(t, 2.76, 2.89), 1.18, .18], hands: CONTACT_HANDS };
  if (t >= 5.96 && t <= 7.08) return { kind: 'back', strength: ramp(t, 5.96, 6) * (1 - ramp(t, 7, 7.08)), point: [0, 1.17 - lowering(t) * .22, 0], hands: null };
  if (t >= 7.74 && t < 8.28) return { kind: 'fingertips', strength: ramp(t, 7.74, 7.76) * (1 - ramp(t, 8.10, 8.26)), point: [-.04, 1.185, .17], hands: CONTACT_HANDS };
  return { kind: 'none', strength: 0, point: null, hands: null };
}

function travelledPath(id: DancerId, t: number): Vec3[] {
  if (t <= 4.76) return [];
  const end = clamp(t, 4.76, 6);
  const count = Math.max(2, Math.ceil((end - 4.76) / .035));
  return Array.from({ length: count + 1 }, (_, i) => {
    const [x, z] = rootAt(id, mix(4.76, end, i / count));
    return [x, .006, z] as Vec3;
  });
}

export function evaluateDance(input: number, options: DanceOptions = {}): DanceFrame {
  const t = Number.isFinite(input) ? clamp(input, 0, 10) : 0;
  const chapter = Math.min(9, Math.floor(t));
  const local = t === 10 ? 1 : t - chapter;
  const isTransition = chapter < 9 && local >= TRANSITION_START - EPS;
  const cen = makeBody('cen', t, options), cheng = makeBody('cheng', t, options);
  applyHands(cen, t); applyHands(cheng, t);
  const footFocus = ramp(t, .76, 1) * (1 - ramp(t, 1.76, 2.05));
  const handFocus = Math.max(
    ramp(t, 1.90, 2.12) * (1 - ramp(t, 2.76, 3.02)),
    ramp(t, 7.76, 8.02) * (1 - ramp(t, 8.30, 8.60)),
  );
  const detail = footFocus > handFocus && footFocus > .05 ? 'feet' : handFocus > .05 ? 'hands' : 'full';
  const contact = contactAt(t);
  if (contact.kind === 'palm' || (contact.kind === 'grip' && t < 2.89)) contact.point = mul(add(cen.hands.right.position, cheng.hands.left.position), .5);
  const detailTarget: Vec3 = detail === 'feet' ? [0, .10, .08] : (contact.point ?? [-.04, 1.185, .17]);
  const narrow = options.layout === 'narrow';
  return {
    t, chapter, local,
    segment: isTransition ? 'transition' : 'chapter',
    transition: isTransition ? chapter : null,
    transitionProgress: isTransition ? clamp((local - TRANSITION_START) / (1 - TRANSITION_START)) : 0,
    poses: { cen, cheng }, contact,
    camera: {
      target: [0, .92 - footFocus * (narrow ? .025 : .09), .015],
      position: [narrow ? .20 : 0, 1.16 + (t > 4.76 && t < 6 ? .12 * Math.sin((t - 4.76) / 1.24 * PI) ** 2 : 0), narrow ? 4.8 : 4.4],
      detail, detailTarget, detailMix: Math.max(footFocus, handFocus),
    },
    timingMode: options.mode ?? 'unison', timingEnabled: t >= 4 && t <= 4.76,
    travelled: { cen: travelledPath('cen', t), cheng: travelledPath('cheng', t) },
  };
}

/** Legacy numerical review samples. UI observation steps live in content.ts. */
export const CHAPTER_POSES = [
  [.05, .22, .62], [1.04, 1.38, 1.69], [2.04, 2.42], [3.02, 3.56, 3.90],
  [4.05, 4.27, 4.52, 4.74], [5.10, 5.36, 5.72], [6.04, 6.48, 6.96],
  [7.02, 7.24, 7.51, 7.73], [8.04, 8.22, 8.54, 8.70], [9.03, 9.60],
] as const;

/** Independent stills for CH-10. Final composition intentionally mirrors the opening. */
export function comparePose(which: 'opening' | 'ending', options: DanceOptions = {}): DanceFrame {
  return evaluateDance(which === 'opening' ? .05 : 9.60, { ...options, breath: 0 });
}
