/**
 * A coherent teaching model of a watch train, not an engineering simulator.
 *
 * Pitch-circle distances and tooth-count ratios are exact. The train folds in
 * the XY plane and consecutive wheels occupy shallow, separate Z planes.
 * The escape wheel is deliberately enlarged visually so its release is legible.
 */

export type TrainId = 'barrel' | 'centre' | 'third' | 'fourth' | 'escape';

export interface TrainWheel {
  readonly id: TrainId;
  readonly label: string;
  readonly teeth: number;
  /** The coaxial receiving pinion; the barrel has no receiving pinion. */
  readonly pinion: number;
  readonly x: number;
  readonly y: number;
  /** The main wheel's mid-plane. */
  readonly z: number;
  readonly pitchRadius: number;
  readonly pinionRadius: number;
  /** Equals the preceding driving wheel's Z plane. */
  readonly pinionZ: number;
  /** Radius used for the illustrative shape; enlarged only for the escape. */
  readonly visualRadius: number;
  /** Fixed geometry offsets, assuming a tooth is centred on the local +X axis. */
  readonly wheelPhase: number;
  readonly pinionPhase: number;
  /** Angular velocity relative to the escape-wheel shaft. */
  readonly escapeRatio: number;
}

export const MODULE = 0.022;
export const WHEEL_PLANE_GAP = 0.07;
export const BALANCE_HZ = 4;
export const BEATS_PER_SECOND = BALANCE_HZ * 2;
export const ESCAPE_TEETH = 15;
export const ESCAPE_STEP = Math.PI / ESCAPE_TEETH;
export const RELEASE_FRACTION = 0.12;
export const BALANCE_AMPLITUDE = (250 * Math.PI) / 180;
export const FORK_AMPLITUDE = (5.5 * Math.PI) / 180;
export const REDUCED_MOTION_TIME = 0.0375;

const TAU = Math.PI * 2;
const radians = (degrees: number): number => (degrees * Math.PI) / 180;
const positiveMod = (value: number, modulus: number): number =>
  ((value % modulus) + modulus) % modulus;

function nextWheel(
  id: TrainId,
  label: string,
  teeth: number,
  pinion: number,
  driver: TrainWheel,
  directionDegrees: number,
  escapeRatio: number,
): TrainWheel {
  const direction = radians(directionDegrees);
  const pitchRadius = (MODULE * teeth) / 2;
  const pinionRadius = (MODULE * pinion) / 2;
  const meshDistance = driver.pitchRadius + pinionRadius;

  // External gears have opposite rotation. This phase puts a receiving gap
  // opposite the driving tooth at the common pitch-circle contact point.
  const pinionPhase = positiveMod(
    direction + Math.PI -
      (Math.PI - driver.teeth * (direction - driver.wheelPhase)) / pinion,
    TAU / pinion,
  );

  return Object.freeze({
    id,
    label,
    teeth,
    pinion,
    x: driver.x + Math.cos(direction) * meshDistance,
    y: driver.y + Math.sin(direction) * meshDistance,
    z: driver.z + WHEEL_PLANE_GAP,
    pitchRadius,
    pinionRadius,
    pinionZ: driver.z,
    visualRadius: id === 'escape' ? 0.3 : pitchRadius,
    wheelPhase: 0,
    pinionPhase,
    escapeRatio,
  });
}

const barrel: TrainWheel = Object.freeze({
  id: 'barrel',
  label: 'Mainspring barrel',
  teeth: 72,
  pinion: 0,
  x: -0.86,
  y: 0.92,
  z: 0.04,
  pitchRadius: (MODULE * 72) / 2,
  pinionRadius: 0,
  pinionZ: 0.04,
  visualRadius: (MODULE * 72) / 2,
  wheelPhase: 0,
  pinionPhase: 0,
  escapeRatio: 1 / 5760,
});

const centre = nextWheel('centre', 'Centre wheel', 80, 12, barrel, -4, -1 / 960);
const third = nextWheel('third', 'Third wheel', 75, 10, centre, -44, 1 / 120);
const fourth = nextWheel('fourth', 'Fourth wheel', 96, 10, third, -113, -1 / 16);
const escape = nextWheel('escape', 'Escape wheel', 15, 6, fourth, -190, 1);

/** Ordered from the mainspring barrel to the escapement. */
export const TRAIN: readonly TrainWheel[] = Object.freeze([
  barrel,
  centre,
  third,
  fourth,
  escape,
]);

export const TRAIN_BY_ID = Object.freeze({ barrel, centre, third, fourth, escape });

export const BALANCE_RADIUS = 0.69;
export const BALANCE_CENTER = Object.freeze({ x: -1.04, y: -1.15, z: 0.42 });

const escapeToBalanceAngle = Math.atan2(
  BALANCE_CENTER.y - escape.y,
  BALANCE_CENTER.x - escape.x,
);

/** Angle from local +X, pointing from the escape wheel toward the balance. */
export const FORK_AXIS_ANGLE = escapeToBalanceAngle;

export const FORK_CENTER = Object.freeze({
  x: escape.x + Math.cos(escapeToBalanceAngle) * 0.34,
  y: escape.y + Math.sin(escapeToBalanceAngle) * 0.34,
  z: 0.365,
});

/** All shaft angles are in radians. Geometry phases remain in TRAIN. */
export interface MechanicalPose {
  barrel: number;
  centre: number;
  third: number;
  fourth: number;
  escape: number;
  balance: number;
  /** Deflection about FORK_AXIS_ANGLE, not the absolute fork heading. */
  fork: number;
  /** Active mechanical seconds used for this pose. */
  tau: number;
  beat: number;
  beatProgress: number;
  release: number;
}

/** Allocate once per scene, then update it through writeMechanicalPose. */
export function createMechanicalPose(): MechanicalPose {
  const pose: MechanicalPose = {
    barrel: 0,
    centre: 0,
    third: 0,
    fourth: 0,
    escape: 0,
    balance: 0,
    fork: -FORK_AMPLITUDE,
    tau: 0,
    beat: 0,
    beatProgress: 0,
    release: 0,
  };
  return pose;
}

/**
 * Fill an existing object without allocating or retaining mutable state.
 *
 * IMPORTANT TIME CONTRACT: `time` is already integrated active mechanical
 * seconds. The renderer advances it by delta * (slow ? 1/32 : 1/8). `slow` is
 * informational here: applying it again to total elapsed time would create a
 * phase jump when the user toggles speed. Paused scenes simply stop advancing
 * `time`. Reduced motion uses a fixed illustrative pose.
 *
 * A 4 Hz balance supplies eight beats per mechanical second. The 15-tooth
 * escape wheel advances half a tooth per beat, easing through the first 12%
 * and resting for the rest. Its exact shaft ratios propagate that motion back
 * through the train: -1/16, +1/120, -1/960, +1/5760.
 */
export function writeMechanicalPose(
  time: number,
  _slow: boolean,
  reduced: boolean,
  out: MechanicalPose,
): MechanicalPose {
  const tau = reduced
    ? REDUCED_MOTION_TIME
    : Number.isFinite(time) ? Math.max(0, time) : 0;
  const beats = tau * BEATS_PER_SECOND;
  const beat = Math.floor(beats);
  const beatProgress = beats - beat;
  const releaseProgress = Math.min(1, beatProgress / RELEASE_FRACTION);
  const release = releaseProgress * releaseProgress * (3 - 2 * releaseProgress);
  const escapeAngle = (beat + release) * ESCAPE_STEP;

  out.escape = escapeAngle;
  out.fourth = -escapeAngle / 16;
  out.third = escapeAngle / 120;
  out.centre = -escapeAngle / 960;
  out.barrel = escapeAngle / 5760;
  out.balance = BALANCE_AMPLITUDE * Math.sin(Math.PI * beats);
  // The end of one beat and the beginning of the next have the same heading.
  const forkDirection = beat % 2 === 0 ? -1 : 1;
  out.fork = FORK_AMPLITUDE * forkDirection * (1 - 2 * release);
  out.tau = tau;
  out.beat = beat;
  out.beatProgress = beatProgress;
  out.release = release;
  return out;
}

/** Convenient pure allocating form for inspection or non-frame callers. */
export function mechanicalPose(
  time: number,
  slow = false,
  reduced = false,
): MechanicalPose {
  return writeMechanicalPose(time, slow, reduced, createMechanicalPose());
}
