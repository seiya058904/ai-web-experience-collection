/**
 * AER's small, deterministic story world.
 *
 * Distances, altitude, wind and path time are authored relative quantities, not
 * metres, seconds, weather, navigation or usable balloon operating parameters.
 * The balloon's position is the bottom of its basket. +Y is up, +X is east and
 * +Z is north. Its pear-shaped envelope is a separate fixed-size visual object.
 *
 * A saved wind preference is deliberately NOT part of the common prefix.
 * Seeking, scrolling backwards and reloading all evaluate the same pure model.
 */

export type WindLayer = 'low' | 'middle' | 'high';
export type GroundLoad = 'light' | 'standard' | 'heavy';
export type BuoyancyState = 'heavy' | 'balanced' | 'rising';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface WindVector {
  x: number;
  z: number;
}

export interface WindLayerDefinition {
  label: string;
  direction: string;
  destination: string;
  description: string;
  color: string;
  altitude: number;
  wind: Readonly<WindVector>;
}

export const WIND_LAYERS: Readonly<Record<WindLayer, WindLayerDefinition>> =
  Object.freeze({
    low: Object.freeze({
      label: 'Low layer',
      direction: 'East, along the field edge',
      destination: 'Hedgerow Meadow',
      description:
        'Follow the near field boundaries to a quiet meadow beside the hedgerow.',
      color: '#75836E',
      altitude: 22,
      wind: Object.freeze({ x: 0.85, z: 0.12 }),
    }),
    middle: Object.freeze({
      label: 'Middle layer',
      direction: 'North, past the village bend',
      destination: 'Willow Bend',
      description:
        'Pass the bend outside the village and settle in the grass by the willows.',
      color: '#707D9A',
      altitude: 38,
      wind: Object.freeze({ x: 0.12, z: 0.85 }),
    }),
    high: Object.freeze({
      label: 'High layer',
      direction: 'Northwest, toward open country',
      destination: 'Far Meadow',
      description:
        'Let the upper air carry you toward the broad, open meadow in the distance.',
      color: '#B38070',
      altitude: 66,
      wind: Object.freeze({ x: -0.64, z: 0.67 }),
    }),
  });

export const DECISION_PROGRESS = 5.45;
export const DESCENT_PROGRESS = 8;
export const LANDING_PROGRESS = 8.85;
export const MAX_PROGRESS = 9.99;

/** A fictional path clock; it is intentionally not shown as flight time. */
export const PATH_DURATION = 160;

/** Direction from the scene toward the sun; the shadow ray uses its negative. */
export const SUN_DIRECTION = Object.freeze({ x: -1, y: 2, z: -0.5 });

/** Basket bottom to the centre of the fixed 24-high envelope above its rigging. */
export const ENVELOPE_SHADOW_HEIGHT = 18;

const SUFFIX_INTERVALS = 2048;
const COMMON_INTERVALS = 272;
const VERTICAL_TRANSITION_END = 6.25;
const BALANCE_TOLERANCE = 0.012;

function clamp(value: number, minimum: number, maximum: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return minimum;
  return Math.max(minimum, Math.min(maximum, value));
}

function mix(a: number, b: number, amount: number): number {
  return a + (b - a) * amount;
}

/** C2-smooth, bounded and reversible without maintaining animation state. */
function smooth(amount: number): number {
  const t = clamp(amount, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function readPreference(value: unknown): WindLayer {
  return value === 'low' || value === 'middle' || value === 'high'
    ? value
    : 'middle';
}

/** Low undulations in one shared world, including all three landing fields. */
export function terrainHeight(x: number, z: number): number {
  return (
    0.8 * Math.sin(x * 0.018) * Math.cos(z * 0.016) +
    0.55 * Math.sin((z + x * 0.35) * 0.027) +
    0.22 * Math.sin(x * 0.052 + z * 0.011)
  );
}

/**
 * The authored wind field is continuous between three relative altitude bands.
 * There is no left/right control and no destination-specific horizontal force.
 */
export function windAtHeight(agl: number): WindVector {
  const h = clamp(agl, 0, WIND_LAYERS.high.altitude);
  if (h <= WIND_LAYERS.low.altitude) return { ...WIND_LAYERS.low.wind };
  const lower = h <= WIND_LAYERS.middle.altitude ? WIND_LAYERS.low : WIND_LAYERS.middle;
  const upper = h <= WIND_LAYERS.middle.altitude ? WIND_LAYERS.middle : WIND_LAYERS.high;
  const fraction = (h - lower.altitude) / (upper.altitude - lower.altitude);
  return {
    x: mix(lower.wind.x, upper.wind.x, fraction),
    z: mix(lower.wind.z, upper.wind.z, fraction),
  };
}

/** A single clock drives height changes and the wind integral for the suffix. */
export function pathTimeAt(progress: number): number {
  const p = clamp(progress, 0, MAX_PROGRESS);
  return PATH_DURATION * smooth((p - DECISION_PROGRESS) / (LANDING_PROGRESS - DECISION_PROGRESS));
}

/** Height above the actual ground, not above an unrelated flat plane. */
export function altitudeAt(progress: number, layer: WindLayer): number {
  const p = clamp(progress, 0, MAX_PROGRESS);
  if (p <= 3) return 0;
  if (p < 4) return 26 * smooth(p - 3);
  if (p < 5) return mix(26, 38, smooth(p - 4));
  if (p <= DECISION_PROGRESS) return 38;
  if (p >= LANDING_PROGRESS) return 0;

  const target = WIND_LAYERS[readPreference(layer)].altitude;
  if (p < VERTICAL_TRANSITION_END) {
    return mix(38, target, smooth((p - DECISION_PROGRESS) / (VERTICAL_TRANSITION_END - DECISION_PROGRESS)));
  }
  if (p <= DESCENT_PROGRESS) return target;
  return target * (1 - smooth((p - DESCENT_PROGRESS) / (LANDING_PROGRESS - DESCENT_PROGRESS)));
}

export interface RoutePoint extends Vector3 {
  progress: number;
  agl: number;
  /** Elapsed fictional suffix path time, zero in the common prefix. */
  time: number;
}

function commonPoint(progress: number): RoutePoint {
  const p = clamp(progress, 0, DECISION_PROGRESS);
  let z = 0;
  if (p >= 4 && p < 5) z = 50 * smooth(p - 4);
  else if (p >= 5) z = mix(50, 60, smooth((p - 5) / (DECISION_PROGRESS - 5)));
  const agl = altitudeAt(p, 'middle');
  return { progress: p, x: 0, y: terrainHeight(0, z) + agl, z, agl, time: 0 };
}

const COMMON_ROUTE: readonly Readonly<RoutePoint>[] = Object.freeze(
  Array.from({ length: COMMON_INTERVALS + 1 }, (_, index) =>
    Object.freeze(commonPoint((index / COMMON_INTERVALS) * DECISION_PROGRESS)),
  ),
);

/**
 * Deterministic midpoint integration. Every horizontal increment is wind at the
 * midpoint altitude multiplied by elapsed path time. There is no endpoint warp,
 * bezier-to-destination blend, or correction that pulls a route onto a meadow.
 * The named meadows are placed at the resulting endpoints instead.
 */
function integrateBranch(layer: WindLayer): readonly Readonly<RoutePoint>[] {
  const start = commonPoint(DECISION_PROGRESS);
  const points: Readonly<RoutePoint>[] = [Object.freeze(start)];
  let x = start.x;
  let z = start.z;

  for (let index = 1; index <= SUFFIX_INTERVALS; index += 1) {
    const previousProgress = DECISION_PROGRESS + ((index - 1) / SUFFIX_INTERVALS) * (LANDING_PROGRESS - DECISION_PROGRESS);
    const progress = index === SUFFIX_INTERVALS
      ? LANDING_PROGRESS
      : DECISION_PROGRESS + (index / SUFFIX_INTERVALS) * (LANDING_PROGRESS - DECISION_PROGRESS);
    const middleProgress = (previousProgress + progress) / 2;
    const wind = windAtHeight(altitudeAt(middleProgress, layer));
    const time = pathTimeAt(progress);
    const deltaTime = time - pathTimeAt(previousProgress);
    x += wind.x * deltaTime;
    z += wind.z * deltaTime;
    const agl = altitudeAt(progress, layer);
    points.push(Object.freeze({
      progress, x, y: terrainHeight(x, z) + agl, z, agl, time,
    }));
  }
  return Object.freeze(points);
}

const BRANCH_ROUTES = Object.freeze({
  low: integrateBranch('low'),
  middle: integrateBranch('middle'),
  high: integrateBranch('high'),
});

const FULL_ROUTES = Object.freeze({
  low: Object.freeze([...COMMON_ROUTE, ...BRANCH_ROUTES.low.slice(1)]),
  middle: Object.freeze([...COMMON_ROUTE, ...BRANCH_ROUTES.middle.slice(1)]),
  high: Object.freeze([...COMMON_ROUTE, ...BRANCH_ROUTES.high.slice(1)]),
});

/** Frozen points: consumers can simplify for drawing, but cannot alter history. */
export function getBranchRoute(layer: WindLayer): readonly Readonly<RoutePoint>[] {
  return BRANCH_ROUTES[readPreference(layer)];
}

/** Includes one identical, shared common prefix and exactly one decision point. */
export function getRoute(layer: WindLayer): readonly Readonly<RoutePoint>[] {
  return FULL_ROUTES[readPreference(layer)];
}

export function getLanding(layer: WindLayer): Readonly<RoutePoint> {
  const route = getBranchRoute(layer);
  return route[route.length - 1]!;
}

function pointOnBranch(progress: number, layer: WindLayer): RoutePoint {
  const route = getBranchRoute(layer);
  const p = clamp(progress, DECISION_PROGRESS, LANDING_PROGRESS);
  if (p === LANDING_PROGRESS) return { ...route[route.length - 1]! };
  const fractionalIndex = ((p - DECISION_PROGRESS) / (LANDING_PROGRESS - DECISION_PROGRESS)) * SUFFIX_INTERVALS;
  const index = Math.min(SUFFIX_INTERVALS - 1, Math.floor(fractionalIndex));
  const fraction = fractionalIndex - index;
  const lower = route[index]!;
  const upper = route[index + 1]!;
  const x = mix(lower.x, upper.x, fraction);
  const z = mix(lower.z, upper.z, fraction);
  const agl = altitudeAt(p, layer);
  return { progress: p, x, y: terrainHeight(x, z) + agl, z, agl, time: pathTimeAt(p) };
}

export interface ShadowState extends Vector3 {
  scale: number;
  opacity: number;
}

/**
 * Cast from the fixed envelope centre along -SUN_DIRECTION onto the terrain.
 * The terrain's small bounded slope makes the ray's crossing unique. Bisection
 * gives a stable projection during arbitrary seeks and contact/reverse motion.
 * This is the envelope shadow; the renderer may add a basket contact shadow.
 */
function shadowAt(position: Vector3, agl: number): ShadowState {
  const originY = position.y + ENVELOPE_SHADOW_HEIGHT;
  let near = 0;
  let far = Math.max(32, originY + 32);
  for (let iteration = 0; iteration < 36; iteration += 1) {
    const t = (near + far) / 2;
    const rayX = position.x - SUN_DIRECTION.x * t;
    const rayY = originY - SUN_DIRECTION.y * t;
    const rayZ = position.z - SUN_DIRECTION.z * t;
    if (rayY > terrainHeight(rayX, rayZ)) near = t;
    else far = t;
  }
  const t = (near + far) / 2;
  const x = position.x - SUN_DIRECTION.x * t;
  const z = position.z - SUN_DIRECTION.z * t;
  const slopeX = terrainHeight(x + 0.5, z) - terrainHeight(x - 0.5, z);
  const slopeZ = terrainHeight(x, z + 0.5) - terrainHeight(x, z - 0.5);
  return {
    x,
    y: terrainHeight(x, z) + 0.018,
    z,
    scale: Math.sqrt(2 / (2 + slopeX + 0.5 * slopeZ)),
    opacity: 0.3 - Math.min(0.13, agl * 0.0018),
  };
}

export interface SceneState {
  progress: number;
  /** Zero-based chapter, from 0 to 9. */
  chapter: number;
  local: number;
  branchActive: boolean;
  /** Middle before the decision, regardless of a saved preference. */
  layer: WindLayer;
  position: Vector3;
  agl: number;
  /** Radians, measured from +Z toward +X. */
  heading: number;
  shadow: ShadowState;
  groundContact: boolean;
  routeProgress: number;
  destination: string;
}

export function sceneAt(progress: number, layer: WindLayer = 'middle'): SceneState {
  const p = clamp(progress, 0, MAX_PROGRESS);
  const branchActive = p > DECISION_PROGRESS;
  const activeLayer = branchActive ? readPreference(layer) : 'middle';
  const point = branchActive ? pointOnBranch(p, activeLayer) : commonPoint(p);
  const position = { x: point.x, y: point.y, z: point.z };
  const wind = branchActive ? windAtHeight(point.agl) : WIND_LAYERS.middle.wind;
  const chapter = Math.floor(p);
  return {
    progress: p,
    chapter,
    local: p - chapter,
    branchActive,
    layer: activeLayer,
    position,
    agl: point.agl,
    heading: Math.atan2(wind.x, wind.z),
    shadow: shadowAt(position, point.agl),
    groundContact: point.agl === 0,
    routeProgress: clamp((p - DECISION_PROGRESS) / (LANDING_PROGRESS - DECISION_PROGRESS), 0, 1),
    destination: WIND_LAYERS[activeLayer].destination,
  };
}

/**
 * The shared still-frame selection for every reduced-motion renderer.
 * It never advances the common prefix past the decision boundary. Arrival has
 * three authored stills so approach, descent and contact remain distinguishable.
 */
export function reducedSceneState(state: SceneState): SceneState {
  let still = Math.floor(state.progress) + 0.5;
  if (state.progress <= DECISION_PROGRESS) still = Math.min(still, DECISION_PROGRESS);
  if (state.chapter === 8) still = state.local < 0.33 ? 8.12 : state.local < 0.66 ? 8.52 : 8.92;
  return sceneAt(still, state.layer);
}

/** All branches start with this exact visual state. */
export const DECISION_SNAPSHOT: Readonly<SceneState> = Object.freeze({
  ...sceneAt(DECISION_PROGRESS, 'middle'),
  position: Object.freeze(sceneAt(DECISION_PROGRESS, 'middle').position),
  shadow: Object.freeze(sceneAt(DECISION_PROGRESS, 'middle').shadow),
});

export interface BuoyancyResult {
  warmth: number;
  load: GroundLoad;
  grossBuoyancy: number;
  internalAirWeight: number;
  structureWeight: number;
  payloadWeight: number;
  totalWeight: number;
  net: number;
  state: BuoyancyState;
  label: string;
}

/**
 * A ground-only qualitative comparison at fixed volume, ambient density and g.
 * All three are normalized to 1. "Warmth" is a relative explanatory control,
 * not temperature. It lowers inside-air density; it does not raise gross lift.
 * Structure combines envelope, basket and equipment. Nothing here is used by
 * the route model, and no passenger/payload can be discarded during the flight.
 */
export function buoyancy(warmth: number = 64, load: GroundLoad = 'standard'): BuoyancyResult {
  const w = clamp(warmth, 0, 100);
  const validLoad: GroundLoad = load === 'light' || load === 'heavy' ? load : 'standard';
  const grossBuoyancy = 1;
  const internalAirWeight = 1 - 0.4 * (w / 100);
  const structureWeight = 0.16;
  const payloadWeight = { light: 0.04, standard: 0.096, heavy: 0.152 }[validLoad];
  const totalWeight = internalAirWeight + structureWeight + payloadWeight;
  const net = grossBuoyancy - totalWeight;
  const state: BuoyancyState = net > BALANCE_TOLERANCE
    ? 'rising'
    : net < -BALANCE_TOLERANCE ? 'heavy' : 'balanced';
  const label = {
    heavy: 'Still heavier',
    balanced: 'Near balance',
    rising: 'A rising tendency',
  }[state];
  return {
    warmth: w,
    load: validLoad,
    grossBuoyancy,
    internalAirWeight,
    structureWeight,
    payloadWeight,
    totalWeight,
    net,
    state,
    label,
  };
}
