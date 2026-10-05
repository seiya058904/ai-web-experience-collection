/** The score: one reversible parameter, one sculpture, eight movements. */
export const CHAPTERS = [
  { id: 'void', title: 'VOID', jp: '空', caption: 'A moving sculpture of space.', at: 0 },
  { id: 'line', title: 'LINE', jp: '線', caption: 'A boundary. A beginning.', at: 0.14 },
  { id: 'frame', title: 'FRAME', jp: '間', caption: 'There is always another side.', at: 0.28 },
  { id: 'light', title: 'LIGHT', jp: '光', caption: 'Light gives the void an edge.', at: 0.42 },
  { id: 'mass', title: 'MASS', jp: '塊', caption: 'The weight of nothing.', at: 0.56 },
  { id: 'shadow', title: 'SHADOW', jp: '影', caption: 'An absence becomes a presence.', at: 0.70 },
  { id: 'form', title: 'FORM', jp: '形', caption: 'Nothing holds its shape.', at: 0.84 },
  { id: 'silence', title: 'SILENCE', jp: '静', caption: 'The space between.', at: 1 },
] as const;

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => t * t * (3 - 2 * t);
export type Vec3 = [number, number, number];

export interface FramePose {
  position: Vec3;
  rotation: Vec3;
  width: number;
  height: number;
  depth: number;
  bar: number;
  scale: number;
  spread: number;
  fold: number;
}

export interface Pose {
  camera: Vec3;
  target: Vec3;
  light: Vec3;
  fov: number;
  roll: number;
  background: number;
  floor: number;
  ink: number;
  emission: number;
  lightPower: number;
  ambient: number;
  beam: number;
  trace: number;
  shadow: number;
  wipe: number;
  frames: FramePose[];
}

function frame(position: Vec3, rotation: Vec3, width: number, height: number,
  bar = 0.3, depth = 0.35, scale = 1, spread = 0, fold = 0): FramePose {
  return { position, rotation, width, height, bar, depth, scale, spread, fold };
}

const resting = (z: number) => frame([1, 0, z], [0, 0, 0], 3, 5, 0.16, 0.2, 0.002);
const SCORE: (Omit<Pose, 'wipe'> & { at: number })[] = [
  {
    at: 0, camera: [9.4, 4.2, 16.2], target: [0.15, -0.20, -0.3], light: [8, 12, -8],
    fov: 36, roll: 0, background: 0.97, floor: 0.83, ink: 0.018, emission: 0,
    lightPower: 7.5, ambient: 0.10, beam: 0, trace: 0, shadow: 1,
    frames: [
      frame([1.0, 1.0, 1.6], [0, -0.19, -0.035], 4.8, 8.7, 0.64, 0.90),
      frame([1.1, 0.65, -2.3], [0.035, 0.24, 0.055], 4.1, 7.55, 0.44, 0.55),
      frame([1.25, 0.35, -6.0], [0, -0.2, -0.035], 3.8, 6.6, 0.32, 0.45),
      frame([1.55, 0.35, -8.2], [0, 0.05, 0.03], 3.45, 6.3, 0.2, 0.32, 0.9),
      resting(-11.5),
    ],
  },
  {
    at: 0.14, camera: [0.4, 1.2, 14.8], target: [0.2, 0, 0], light: [-4, 8, 4],
    fov: 43, roll: -0.24, background: 0.004, floor: 0.005, ink: 0.86, emission: 0.85,
    lightPower: 0.12, ambient: 0.25, beam: 0.20, trace: 0.78, shadow: 0,
    frames: [
      frame([1.75, 0.3, 0.5], [0, 0.12, 0.06], 0.026, 13, 0.01, 0.06),
      frame([1.75, -0.6, -0.9], [0, -0.12, 1.49], 0.024, 15, 0.01, 0.035),
      frame([1.7, 0, -3.7], [0, 0.1, -0.04], 0.045, 11.5, 0.016, 0.035),
      frame([1.75, 0, -6.5], [0, 0, 0], 0.016, 10, 0.006, 0.028),
      resting(-10),
    ],
  },
  {
    at: 0.28, camera: [4.6, 1.5, 13.0], target: [0.35, -0.3, -4], light: [8, 12, -8],
    fov: 43, roll: 0.015, background: 0.97, floor: 0.83, ink: 0.018, emission: 0,
    lightPower: 7.0, ambient: 0.10, beam: 0.1, trace: 0.18, shadow: 1,
    frames: Array.from({ length: 5 }, (_, i) =>
      frame([0.3 + i * 0.12, 0.25, 3 - i * 4.8], [0, i % 2 ? -0.025 : 0.025, 0], 4.8, 7.25, 0.20, 0.42)),
  },
  {
    at: 0.42, camera: [0.2, 0.0, 2.4], target: [0.05, 0.2, -14], light: [0, 7, -14],
    fov: 56, roll: 0, background: 0.002, floor: 0.006, ink: 0.065, emission: 0.05,
    lightPower: 0.80, ambient: 0.15, beam: 0.92, trace: 0, shadow: 0.1,
    frames: Array.from({ length: 5 }, (_, i) =>
      frame([0, 0.2, 4 - i * 5.6], [0, 0, i % 2 ? 0.003 : -0.003], 5.0, 7.3, 0.44, 0.72)),
  },
  {
    at: 0.56, camera: [8.7, 4.4, 14.3], target: [0.8, 0.35, -0.5], light: [9, 11, -8],
    fov: 40, roll: -0.012, background: 0.92, floor: 0.72, ink: 0.025, emission: 0,
    lightPower: 7.5, ambient: 0.065, beam: 0, trace: 0.25, shadow: 1,
    frames: [
      frame([1.15, 0.7, 0], [0.04, -0.35, -0.085], 5.8, 8.2, 2.82, 1.05),
      frame([0.55, 0.85, -2.2], [-0.025, 0.42, 0.07], 4.7, 8.3, 2.29, 1.3),
      frame([2.15, 0.3, -5.2], [0, -0.08, 0.025], 5.0, 7.5, 0.14, 0.35),
      resting(-8),
      resting(-12),
    ],
  },
  {
    at: 0.70, camera: [4.0, 12, 15.5], target: [-0.2, -2, -1.0], light: [-11, 6.2, -5],
    fov: 43, roll: -0.075, background: 1, floor: 0.93, ink: 0.012, emission: 0,
    lightPower: 7.5, ambient: 0.065, beam: 0, trace: 0.15, shadow: 1,
    frames: [
      frame([-1.7, 0.85, -2.6], [0.03, -0.3, 0.2], 4.9, 8.4, 2.40, 0.6),
      frame([1.8, -2.7, -0.4], [1.42, 0.15, -0.14], 5.8, 7.8, 2.78, 0.24),
      frame([1.2, -2.7, -7], [1.48, 0, 0.10], 3.2, 6.4, 0.16, 0.15),
      resting(-10),
      resting(-12),
    ],
  },
  {
    at: 0.84, camera: [10, 6.2, 17.2], target: [0.5, 0.0, -0.5], light: [8, 12, -8],
    fov: 39, roll: 0.015, background: 0.985, floor: 0.87, ink: 0.02, emission: 0,
    lightPower: 7.5, ambient: 0.10, beam: 0, trace: 0.9, shadow: 0.98,
    frames: [
      frame([1.15, 1.4, 0.5], [-0.10, -0.45, -0.08], 5.6, 6.4, 0.68, 0.82, 1, 1.55, 0.56),
      frame([1.75, 0.8, -3.2], [0.10, 0.50, 0.22], 4.7, 6.1, 0.28, 0.45, 0.67, 0.9, -0.48),
      resting(-6),
      resting(-9),
      resting(-13),
    ],
  },
  {
    at: 0.965, camera: [1.3, 2.4, 20.4], target: [0, -0.45, 0], light: [-8, 15, 8],
    fov: 40, roll: 0, background: 1, floor: 0.95, ink: 0.004, emission: 0,
    lightPower: 6, ambient: 0.15, beam: 0, trace: 0.3, shadow: 0.7,
    frames: [
      frame([2.25, -0.5, 0.0], [0, -0.06, 0], 1.8, 4.7, 0.065, 0.12),
      frame([2.25, -0.5, -2], [0, 0, 0], 1.6, 4.1, 0.04, 0.08, 0.002),
      resting(-6), resting(-10), resting(-14),
    ],
  },
  {
    at: 1, camera: [1.3, 2.4, 20.4], target: [0, -0.45, 0], light: [-8, 15, 8],
    fov: 40, roll: 0, background: 1, floor: 0.95, ink: 0.004, emission: 0,
    lightPower: 6, ambient: 0.15, beam: 0, trace: 0, shadow: 0.6,
    frames: [
      frame([2.25, -0.5, 0], [0, 0, 0], 0.025, 4.7, 0.01, 0.12),
      frame([2.25, -0.5, -2], [0, 0, 0], 1.6, 4.1, 0.04, 0.08, 0.002),
      resting(-6), resting(-10), resting(-14),
    ],
  },
];

export function getChapterIndex(progress: number): number {
  const p = clamp(Number.isFinite(progress) ? progress : 0);
  let index = 0;
  for (let i = 1; i < CHAPTERS.length; i++) {
    if (p >= (CHAPTERS[i - 1].at + CHAPTERS[i].at) / 2) index = i;
  }
  return index;
}

function vector(a: Vec3, b: Vec3, t: number): Vec3 {
  return [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
}

/** No accumulated transforms: any position can be reached in either direction. */
export function samplePose(progress: number, mobile = false, reduced = false): Pose {
  let p = clamp(Number.isFinite(progress) ? progress : 0);
  if (reduced) p = CHAPTERS[getChapterIndex(p)].at;
  let lower = 0;
  while (lower < SCORE.length - 2 && p > SCORE[lower + 1].at) lower++;
  const a = SCORE[lower];
  const b = SCORE[lower + 1];
  const raw = clamp((p - a.at) / (b.at - a.at));
  // A little linear travel keeps the living hold responsive at either end.
  const t = mix(smooth(raw), raw, 0.12);
  const changesPolarity = Math.abs(a.background - b.background) > 0.6;
  // A foreground plane covers this short lighting inversion. The spatial
  // transformation continues underneath instead of dissolving through grey.
  const palette = changesPolarity ? smooth(clamp((raw - 0.485) / 0.03)) : t;
  const wipe = changesPolarity && raw > 0.28 && raw < 0.72 ? (raw - 0.28) / 0.44 : -1;
  const frames = a.frames.map((f, i): FramePose => {
    const g = b.frames[i];
    return {
      position: vector(f.position, g.position, t), rotation: vector(f.rotation, g.rotation, t),
      width: mix(f.width, g.width, t), height: mix(f.height, g.height, t),
      bar: mix(f.bar, g.bar, t), depth: mix(f.depth, g.depth, t),
      scale: mix(f.scale, g.scale, t), spread: mix(f.spread, g.spread, t), fold: mix(f.fold, g.fold, t),
    };
  });
  const pose: Pose = {
    camera: vector(a.camera, b.camera, t), target: vector(a.target, b.target, t),
    light: vector(a.light, b.light, t), fov: mix(a.fov, b.fov, t), roll: mix(a.roll, b.roll, t),
    background: mix(a.background, b.background, palette), floor: mix(a.floor, b.floor, palette),
    ink: mix(a.ink, b.ink, palette), emission: mix(a.emission, b.emission, palette),
    lightPower: mix(a.lightPower, b.lightPower, palette), ambient: mix(a.ambient, b.ambient, palette),
    beam: mix(a.beam, b.beam, t), trace: mix(a.trace, b.trace, t), shadow: mix(a.shadow, b.shadow, palette),
    wipe: reduced ? -1 : wipe, frames,
  };
  if (mobile) {
    // Portrait gets its own sightline: the work occupies the upper field,
    // with less lateral travel and a longer lens on the luminous corridor.
    pose.camera[0] *= 0.42;
    pose.camera[1] = mix(pose.camera[1], 4.0, 0.22);
    const passage = smooth(clamp(1 - Math.abs(p - 0.42) / 0.105));
    pose.camera[2] += 6.0 * (1 - passage);
    pose.target[0] = mix(0.85, 0, passage);
    pose.target[1] -= 1.55 * (1 - passage);
    pose.fov = mix(pose.fov, 42, 0.55);
    pose.roll *= 0.5;
    for (const f of pose.frames) f.spread *= 0.67;
  }
  return pose;
}
