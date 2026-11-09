/**
 * RALLY's deterministic demonstration model. Metres and model seconds.
 * x: across court; y: A (negative) to B (positive); z: up.
 * The coefficients below are authored assumptions, not measured player data.
 */
export type Vec3 = Readonly<{ x: number; y: number; z: number }>;
export type SpinPreset = 'topspin' | 'none';
export type ReturnChoice = 'crosscourt' | 'line';
export type PathSample = Readonly<Vec3 & { t: number; vx: number; vy: number; vz: number }>;
export type PathEnding = 'ground' | 'net' | 'racket' | 'catch';

export const COURT = Object.freeze({
  length: 23.77,
  width: 8.23,
  halfLength: 11.885,
  halfWidth: 4.115,
  serviceLine: 6.40,
  netHeight: 0.914,
  netPostHeight: 1.07,
  netHalfWidth: 5.029,
  lineWidth: 0.05,
  ballRadius: 0.0335,
});

export const MODEL = Object.freeze({
  gravity: 9.81,
  drag: 0.018,
  magnus: 0.0075,
  step: 1 / 240,
  reboundVertical: 0.72,
  reboundHorizontal: 0.74,
});

export type TrajectoryMetrics = Readonly<{
  crossedNet: boolean;
  netClearance: number | null;
  clearsNet: boolean;
  landingIn: boolean;
  landingHalf: 'A' | 'B' | null;
  landing: Vec3 | null;
  apex: number;
  duration: number;
}>;

export type Trajectory = Readonly<{
  id: string;
  origin: Vec3;
  initialVelocity: Vec3;
  spin: SpinPreset;
  spinAxis: Vec3;
  samples: readonly PathSample[];
  duration: number;
  ending: PathEnding;
  landing: Vec3 | null;
  netCrossing: PathSample | null;
  metrics: TrajectoryMetrics;
}>;

type FlightOptions = {
  id: string;
  origin: Vec3;
  velocity: Vec3;
  spin?: SpinPreset;
  duration?: number;
  endY?: number;
  ending?: 'racket' | 'catch';
  step?: number;
};

const zero: Vec3 = Object.freeze({ x: 0, y: 0, z: 0 });
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const position = (s: Vec3): Vec3 => ({ x: s.x, y: s.y, z: s.z });
const mix = (a: Vec3, b: Vec3, u: number): Vec3 => ({
  x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u),
});
const ease = (u: number) => { const v = clamp(u, 0, 1); return v * v * (3 - 2 * v); };

function freezeDeep<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) freezeDeep(nested);
  }
  return value;
}

/** A parabolic cable sag joins the official centre/post heights. */
export function netHeightAt(x: number): number {
  const u = clamp(Math.abs(x) / COURT.netHalfWidth, 0, 1);
  return COURT.netHeight + (COURT.netPostHeight - COURT.netHeight) * u * u;
}

/** Unit angular-velocity axis. Its cross product with forward velocity points down. */
export function topspinAxis(v: Vec3): Vec3 {
  const horizontalSpeed = Math.hypot(v.x, v.y);
  return horizontalSpeed > 0 ? { x: -v.y / horizontalSpeed, y: v.x / horizontalSpeed, z: 0 } : zero;
}

/** a = gravity - kD |v| v + kM |v| (axis × v); axis is zero for no spin. */
export function acceleration(v: Vec3, axis: Vec3): Vec3 {
  const speed = Math.hypot(v.x, v.y, v.z);
  return {
    x: -MODEL.drag * speed * v.x + MODEL.magnus * speed * (axis.y * v.z - axis.z * v.y),
    y: -MODEL.drag * speed * v.y + MODEL.magnus * speed * (axis.z * v.x - axis.x * v.z),
    z: -MODEL.gravity - MODEL.drag * speed * v.z + MODEL.magnus * speed * (axis.x * v.y - axis.y * v.x),
  };
}

type DynamicState = { p: Vec3; v: Vec3 };
function advance(state: DynamicState, axis: Vec3, dt: number): DynamicState {
  const a1 = acceleration(state.v, axis);
  const v2 = mixVelocity(state.v, a1, dt / 2);
  const a2 = acceleration(v2, axis);
  const v3 = mixVelocity(state.v, a2, dt / 2);
  const a3 = acceleration(v3, axis);
  const v4 = mixVelocity(state.v, a3, dt);
  const a4 = acceleration(v4, axis);
  return {
    p: {
      x: state.p.x + dt / 6 * (state.v.x + 2 * v2.x + 2 * v3.x + v4.x),
      y: state.p.y + dt / 6 * (state.v.y + 2 * v2.y + 2 * v3.y + v4.y),
      z: state.p.z + dt / 6 * (state.v.z + 2 * v2.z + 2 * v3.z + v4.z),
    },
    v: {
      x: state.v.x + dt / 6 * (a1.x + 2 * a2.x + 2 * a3.x + a4.x),
      y: state.v.y + dt / 6 * (a1.y + 2 * a2.y + 2 * a3.y + a4.y),
      z: state.v.z + dt / 6 * (a1.z + 2 * a2.z + 2 * a3.z + a4.z),
    },
  };
}
const mixVelocity = (v: Vec3, a: Vec3, dt: number): Vec3 => ({ x: v.x + a.x * dt, y: v.y + a.y * dt, z: v.z + a.z * dt });
const makeSample = (state: DynamicState, t: number): PathSample => ({ ...state.p, t, vx: state.v.x, vy: state.v.y, vz: state.v.z });
function interpolateSample(a: PathSample, b: PathSample, u: number): PathSample {
  return { ...mix(a, b, u), t: lerp(a.t, b.t, u), vx: lerp(a.vx, b.vx, u), vy: lerp(a.vy, b.vy, u), vz: lerp(a.vz, b.vz, u) };
}

/**
 * Fixed-step RK4 plus substep contact interpolation. Stops at first net/floor
 * contact, so a failed comparison cannot visually travel through the net.
 * UI controls select the named presets; this is not a training simulator.
 */
export function simulateFlight(options: FlightOptions): Trajectory {
  const { id, origin, velocity: initialVelocity, spin = 'topspin' } = options;
  if (![...Object.values(origin), ...Object.values(initialVelocity)].every(Number.isFinite)) throw new Error('Flight inputs must be finite.');
  if (origin.z < COURT.ballRadius - 1e-10) throw new Error('The ball must start above the surface.');
  const dt = options.step ?? MODEL.step;
  if (!(dt > 0 && dt <= 0.1)) throw new Error('Invalid integration step.');
  const limit = options.duration ?? 6;
  if (!(limit > 0 && limit <= 12)) throw new Error('Invalid flight duration.');
  const axis = spin === 'topspin' ? topspinAxis(initialVelocity) : zero;
  let state: DynamicState = { p: position(origin), v: position(initialVelocity) };
  const samples: PathSample[] = [makeSample(state, 0)];
  let netCrossing: PathSample | null = null;
  let ending: PathEnding = options.ending ?? 'racket';
  let t = 0;
  while (t < limit - 1e-12) {
    const step = Math.min(dt, limit - t);
    const previous = samples[samples.length - 1]!;
    const nextState = advance(state, axis, step);
    const next = makeSample(nextState, t + step);
    let endFraction = 1;
    let endKind: PathEnding | null = null;
    if (next.z <= COURT.ballRadius && next.vz < 0) {
      endFraction = clamp((previous.z - COURT.ballRadius) / (previous.z - next.z), 0, 1);
      endKind = 'ground';
    }
    if (options.endY !== undefined && (previous.y - options.endY) * (next.y - options.endY) <= 0 && previous.y !== next.y) {
      const u = (options.endY - previous.y) / (next.y - previous.y);
      if (u >= 0 && u <= endFraction) { endFraction = u; endKind = options.ending ?? 'catch'; }
    }
    if (!netCrossing && previous.y * next.y <= 0 && previous.y !== next.y) {
      const u = -previous.y / (next.y - previous.y);
      if (u >= 0 && u <= endFraction) {
        netCrossing = { ...interpolateSample(previous, next, u), y: 0 };
        if (Math.abs(netCrossing.x) <= COURT.netHalfWidth && netCrossing.z - COURT.ballRadius <= netHeightAt(netCrossing.x)) {
          endFraction = u; endKind = 'net';
        } else if (u > 1e-10 && u < endFraction - 1e-10) samples.push(netCrossing);
      }
    }
    if (endKind) {
      let terminal = interpolateSample(previous, next, endFraction);
      if (endKind === 'ground') terminal = { ...terminal, z: COURT.ballRadius };
      if (endKind === 'net') terminal = { ...terminal, y: 0 };
      if (options.endY !== undefined && endKind === (options.ending ?? 'catch')) terminal = { ...terminal, y: options.endY };
      samples.push(terminal);
      ending = endKind;
      break;
    }
    samples.push(next);
    state = nextState;
    t += step;
  }
  const last = samples[samples.length - 1]!;
  const landing = ending === 'ground' ? position(last) : null;
  const base = { id, origin: position(origin), initialVelocity: position(initialVelocity), spin, spinAxis: position(axis), samples, duration: last.t, ending, landing, netCrossing };
  return freezeDeep({ ...base, metrics: getMetrics(base) });
}

export function getMetrics(path: Omit<Trajectory, 'metrics'> | Trajectory): TrajectoryMetrics {
  const landing = path.landing;
  const clearance = path.netCrossing ? path.netCrossing.z - COURT.ballRadius - netHeightAt(path.netCrossing.x) : null;
  return {
    crossedNet: path.netCrossing !== null,
    netClearance: clearance,
    clearsNet: clearance !== null && clearance > 0,
    landingIn: landing !== null && Math.abs(landing.x) <= COURT.halfWidth && Math.abs(landing.y) <= COURT.halfLength,
    landingHalf: !landing || landing.y === 0 ? null : landing.y < 0 ? 'A' : 'B',
    landing,
    apex: Math.max(...path.samples.map(p => p.z)),
    duration: path.duration,
  };
}

/** t is elapsed model seconds, NOT a 0–1 progress. Values clamp at endpoints. */
export function samplePath(path: Pick<Trajectory, 'samples' | 'duration'>, t: number): PathSample {
  if (Number.isNaN(t)) t = 0;
  const target = clamp(t, 0, path.duration);
  const samples = path.samples;
  let lo = 0, hi = samples.length - 1;
  if (target <= 0) return samples[0]!;
  if (target >= path.duration) return samples[hi]!;
  while (hi - lo > 1) {
    const mid = (lo + hi) >>> 1;
    if (samples[mid]!.t > target) hi = mid; else lo = mid;
  }
  const a = samples[lo]!, b = samples[hi]!;
  return interpolateSample(a, b, (target - a.t) / (b.t - a.t));
}

export const mainRallyPreset = freezeDeep({
  id: 'a-to-b-topspin',
  origin: { x: -2.3, y: -10.7, z: 1.05 },
  velocity: { x: 5.5, y: 22, z: 6 },
  spin: 'topspin' as const,
});
export const mainTrajectory = simulateFlight(mainRallyPreset);
export const comparisonTrajectories = freezeDeep({
  topspin: mainTrajectory,
  none: simulateFlight({ ...mainRallyPreset, id: 'comparison-no-spin', spin: 'none' }),
});

function reboundPath(flight: Trajectory, id: string, duration: number): Trajectory {
  if (flight.ending !== 'ground' || !flight.landing) throw new Error('A rebound must begin at a ground contact.');
  const impact = flight.samples[flight.samples.length - 1]!;
  return simulateFlight({
    id, origin: flight.landing,
    velocity: { x: impact.vx * MODEL.reboundHorizontal, y: impact.vy * MODEL.reboundHorizontal, z: -impact.vz * MODEL.reboundVertical },
    spin: flight.spin, duration, ending: 'racket',
  });
}
export const mainRebound = reboundPath(mainTrajectory, 'b-side-rebound', 0.27);
export const bContact: Vec3 = freezeDeep(position(mainRebound.samples[mainRebound.samples.length - 1]!));
export const aReady: Vec3 = freezeDeep({ x: -0.45, y: -11.55, z: 0 });
export const bReady: Vec3 = freezeDeep({ x: 0.35, y: 11.4, z: 0 });

export type ReplayEvent = Readonly<{
  id: 'b-strike' | 'a-bounce' | 'a-return' | 'b-stop';
  actor: 'A' | 'B' | 'ground';
  label: string;
  description: string;
  time: number;
  position: Vec3;
}>;
export type RallyBranch = Readonly<{
  choice: ReturnChoice;
  label: string;
  returnFlight: Trajectory;
  rebound: Trajectory;
  responseFlight: Trajectory;
  events: readonly ReplayEvent[];
  duration: number;
  aStart: Vec3;
  aContact: Vec3;
  aContactFoot: Vec3;
  aRecovery: Vec3;
  bContact: Vec3;
  bStop: Vec3;
  openSpace: Vec3;
  spaceDescription: string;
  aTravelDistance: number;
}>;

const feetAt = (contact: Vec3, player: 'A' | 'B'): Vec3 => ({ x: contact.x + (player === 'A' ? 0.25 : -0.25), y: contact.y + (player === 'A' ? -0.4 : 0.4), z: 0 });
function makeBranch(choice: ReturnChoice): RallyBranch {
  const crosscourt = choice === 'crosscourt';
  const returnFlight = simulateFlight({
    id: `b-return-${choice}`, origin: bContact,
    velocity: { x: crosscourt ? -6.6 : 0, y: -23, z: crosscourt ? 6.0 : 5.8 }, spin: 'topspin',
  });
  const rebound = reboundPath(returnFlight, `a-rebound-${choice}`, crosscourt ? 0.27 : 0.29);
  const aContact = position(rebound.samples[rebound.samples.length - 1]!);
  const responseFlight = simulateFlight({
    id: `a-response-${choice}`, origin: aContact,
    velocity: { x: crosscourt ? 3.2 : -2.8, y: 22, z: crosscourt ? 7.46 : 7.68 },
    spin: 'topspin', endY: crosscourt ? 8.5 : 8.8, ending: 'catch',
  });
  const stop = position(responseFlight.samples[responseFlight.samples.length - 1]!);
  const contactTime = returnFlight.duration + rebound.duration;
  const duration = contactTime + responseFlight.duration;
  const aContactFoot = feetAt(aContact, 'A');
  const events: ReplayEvent[] = [
    { id: 'b-strike', actor: 'B', label: 'B sends it back', description: crosscourt ? 'B keeps the conversation crosscourt.' : 'B changes the direction down the line.', time: 0, position: bContact },
    { id: 'a-bounce', actor: 'ground', label: 'The ball finds A’s half', description: crosscourt ? 'The bounce draws A towards the left sideline.' : 'The bounce asks A to cover the opposite side.', time: returnFlight.duration, position: returnFlight.landing! },
    { id: 'a-return', actor: 'A', label: 'A answers', description: crosscourt ? 'A meets the diagonal ball and begins to recover.' : 'A reaches to the right, leaving more room on the left.', time: contactTime, position: aContact },
    { id: 'b-stop', actor: 'B', label: 'B brings it to rest', description: 'B receives the last ball. The practice pauses here.', time: duration, position: stop },
  ];
  return freezeDeep({
    choice, label: crosscourt ? 'Crosscourt' : 'Down the line', returnFlight, rebound, responseFlight, events, duration,
    aStart: aReady, aContact, aContactFoot,
    aRecovery: { x: crosscourt ? -0.7 : 0.65, y: -11.4, z: 0 },
    bContact, bStop: stop,
    openSpace: { x: crosscourt ? 2.45 : -2.45, y: -7.25, z: 0 },
    spaceDescription: crosscourt ? 'A moves left. The right side opens while A recovers.' : 'A moves right. The left side opens while A recovers.',
    aTravelDistance: Math.hypot(aContactFoot.x - aReady.x, aContactFoot.y - aReady.y),
  });
}
export const branches: Readonly<Record<ReturnChoice, RallyBranch>> = freezeDeep({
  crosscourt: makeBranch('crosscourt'),
  line: makeBranch('line'),
});

/** CH-10's gentle return follows, rather than adds to, the four CH-09 contacts. */
export const handbackReceiver: Vec3 = freezeDeep({ x: aReady.x - 0.25, y: aReady.y + 0.4, z: 1.10 });
function makeHandback(choice: ReturnChoice): Trajectory {
  const origin = branches[choice].bStop;
  const vy = -13.5;
  // Horizontal drag preserves vx/vy. This ratio reaches A's exact receiving plane.
  const vx = (handbackReceiver.x - origin.x) / (handbackReceiver.y - origin.y) * vy;
  return simulateFlight({
    id: `b-to-a-handback-${choice}`, origin,
    velocity: { x: vx, y: vy, z: choice === 'crosscourt' ? 9.3931 : 9.595 },
    spin: 'none', endY: handbackReceiver.y, ending: 'catch',
  });
}
export const handbacks: Readonly<Record<ReturnChoice, Trajectory>> = freezeDeep({
  crosscourt: makeHandback('crosscourt'),
  line: makeHandback('line'),
});

export type ReplayFrame = Readonly<{
  ball: PathSample;
  a: Vec3;
  b: Vec3;
  time: number;
  progress: number;
  phase: 'return-flight' | 'rebound' | 'a-response' | 'held';
  eventIndex: number;
  event: ReplayEvent;
}>;
export function sampleReplay(choice: ReturnChoice, seconds: number): ReplayFrame {
  const branch = branches[choice];
  const time = clamp(Number.isNaN(seconds) ? 0 : seconds, 0, branch.duration);
  const contactTime = branch.events[2]!.time;
  let ball: PathSample;
  let phase: ReplayFrame['phase'];
  if (time < branch.returnFlight.duration) {
    ball = samplePath(branch.returnFlight, time); phase = 'return-flight';
  } else if (time < contactTime) {
    ball = samplePath(branch.rebound, time - branch.returnFlight.duration); phase = 'rebound';
  } else if (time < branch.duration) {
    ball = samplePath(branch.responseFlight, time - contactTime); phase = 'a-response';
  } else {
    ball = { ...samplePath(branch.responseFlight, branch.responseFlight.duration), vx: 0, vy: 0, vz: 0 }; phase = 'held';
  }
  const a = time <= contactTime
    ? mix(branch.aStart, branch.aContactFoot, ease(time / contactTime))
    : mix(branch.aContactFoot, branch.aRecovery, ease((time - contactTime) / (branch.duration - contactTime)));
  const b = mix(feetAt(branch.bContact, 'B'), feetAt(branch.bStop, 'B'), ease(time / branch.duration));
  let eventIndex = 0;
  for (let i = 1; i < branch.events.length; i++) if (time >= branch.events[i]!.time) eventIndex = i;
  return { ball: { ...ball, t: time }, a, b, time, progress: time / branch.duration, phase, eventIndex, event: branch.events[eventIndex]! };
}

export type ReplayState = Readonly<{ choice: ReturnChoice; time: number; playing: boolean; revision: number }>;
/** A new branch invalidates the old playhead and any asynchronous playback token. */
export function switchBranch(state: ReplayState, choice: ReturnChoice): ReplayState {
  return { choice, time: 0, playing: false, revision: state.revision + 1 };
}

/** Ground shadow uses the same world position; no separate screen-space animation. */
export function shadowAt(ball: Vec3): Vec3 { return { x: ball.x, y: ball.y, z: 0 }; }
