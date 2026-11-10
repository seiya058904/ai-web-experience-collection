// Pure motion maths: no rendering, no DOM. The tests exercise this file directly.
import { LINK, SPEED } from './spec.js';

export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export const EASE = {
  linear: (t) => t,
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  out: (t) => 1 - (1 - t) ** 3,
  in: (t) => t * t * t,
  // A little overshoot for parts that settle, kept small so nothing appears to bounce.
  settle: (t) => 1 + 1.9 * (t - 1) ** 3 + 0.9 * (t - 1) ** 2,
};

/**
 * Solve the crank-rocker for one wing. Angles are measured in the transverse plane from +z toward +y.
 * Returns the crank pin, the lever tip and the lever angle (positive when the tip rises, so the wing falls).
 */
export function rocker(theta, link = LINK) {
  const pz = link.cz + link.r * Math.cos(theta);
  const py = link.cy + link.r * Math.sin(theta);
  const dz = pz - link.hz;
  const dy = py - link.hy;
  const d = Math.hypot(dz, dy);
  const along = (d * d + link.arm * link.arm - link.rod * link.rod) / (2 * d);
  const across = Math.sqrt(Math.max(0, link.arm * link.arm - along * along));
  const uz = dz / d;
  const uy = dy / d;
  const qz = link.hz + along * uz + across * uy;
  const qy = link.hy + along * uy - across * uz;
  return { pz, py, qz, qy, beta: Math.atan2(qy - link.hy, link.hz - qz) };
}

/** Lever angle only. */
export const leverAngle = (theta, link = LINK) => rocker(theta, link).beta;

/** Rate of the lever angle with respect to the crank angle. */
export function leverRate(theta, link = LINK) {
  const e = 1e-3;
  return (rocker(theta + e, link).beta - rocker(theta - e, link).beta) / (2 * e);
}

let peakRate = 0;
/** Largest lever rate over one turn, used to normalise feathering. */
export function leverPeakRate() {
  if (peakRate) return peakRate;
  for (let i = 0; i < 720; i += 1) peakRate = Math.max(peakRate, Math.abs(leverRate((i / 720) * Math.PI * 2)));
  return peakRate;
}

/**
 * Angle of a driven gear so that its teeth sit in the gaps of the driver.
 * `alpha` is the direction from the driver's centre to the driven gear's centre.
 * Both gears are assumed to have a tooth centred on their own zero angle.
 */
export function meshAngle(phiA, teethA, teethB, alpha) {
  return alpha + Math.PI - Math.PI / teethB - (teethA / teethB) * (phiA - alpha);
}

/**
 * Evaluate a part's disassembly track at progress p.
 * A track is a list of steps { a, b, v: [x, y, z], r?: [rx, ry, rz], e?: easing name }.
 * Each step contributes its full vector once p passes b and nothing before a, so p = 0 is exactly the rest pose.
 */
export function evalTrack(steps, p, out) {
  out[0] = 0; out[1] = 0; out[2] = 0; out[3] = 0; out[4] = 0; out[5] = 0;
  for (let i = 0; i < steps.length; i += 1) {
    const s = steps[i];
    if (p <= s.a) continue;
    const w = p >= s.b ? 1 : (EASE[s.e] ?? EASE.inOut)((p - s.a) / (s.b - s.a));
    if (s.v) { out[0] += s.v[0] * w; out[1] += s.v[1] * w; out[2] += s.v[2] * w; }
    if (s.r) { out[3] += s.r[0] * w; out[4] += s.r[1] * w; out[5] += s.r[2] * w; }
  }
  return out;
}

/** Crank speed for a given disassembly progress: full speed assembled, a slow demonstration once parts move. */
export function crankSpeed(p) {
  return lerp(SPEED.hover, SPEED.demo, smooth(0.0, 0.12, p));
}

/**
 * The one-press disassembly is a timed journey with a held breath at each stage boundary.
 * Maps elapsed fraction 0..1 to progress 0..1 and back, so the journey can start from any progress.
 */
const BEATS = [
  [0, 0],
  [0.27, 0.3],
  [0.33, 0.3],
  [0.61, 0.62],
  [0.67, 0.62],
  [1, 1],
];
export function journeyProgress(time) {
  const t = clamp(time);
  for (let i = 1; i < BEATS.length; i += 1) {
    const [t0, p0] = BEATS[i - 1];
    const [t1, p1] = BEATS[i];
    if (t <= t1) return t1 === t0 ? p1 : lerp(p0, p1, EASE.inOut((t - t0) / (t1 - t0)));
  }
  return 1;
}
export function journeyTime(progress) {
  const p = clamp(progress);
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i += 1) {
    const mid = (lo + hi) / 2;
    if (journeyProgress(mid) < p) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
