/**
 * BACKSTAGE's only structural state coordinator.
 *
 * Scroll owns the authored performance. A finite local clock owns director
 * cues only inside Act IV. The exit handoff reads an immutable snapshot, so
 * a stopped or reversed scroll cannot continue a second competing animation.
 * No DOM, Three.js, timer, or browser dependency is used in this module.
 */

const SCENES = Object.freeze(['room', 'sea', 'night']);
const SCENE_WORLD = Object.freeze({ room: 0, sea: 1, night: 2 });
const DEFAULT_LIGHT = 0.55;
const EPSILON = 1e-7;
const ENTER_DIRECTOR = 0.68;
const EXIT_DIRECTOR = 0.82;
const END_HANDOFF = 0.94;

const finite = (value, fallback) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const isScene = (value) => typeof value === 'string' && SCENES.includes(value);

export const clamp = (value, min = 0, max = 1) =>
  Math.min(max, Math.max(min, finite(value, min)));
export const lerp = (a, b, amount) => a + (b - a) * amount;
export function smooth(a, b, value) {
  if (a === b) return value < a ? 0 : 1;
  const t = clamp((value - a) / (b - a));
  return t * t * (3 - 2 * t);
}

const sceneAt = (world) => SCENES[Math.round(clamp(world, 0, 2))];
const durationFor = (from, to) =>
  Math.abs(to - from) < EPSILON ? 0 : 0.5 + Math.abs(to - from) * 1.1;

/**
 * One reversible mechanism path. World 0/1/2 are stable ROOM/SEA/NIGHT.
 * The renderer places each assembly in its own physically separated lane.
 * Left and right assemblies rotate outward; rear braces belong to the same
 * pivots. A renderer must apply these values, not start separate tweens.
 */
export function mechanism(input) {
  const world = clamp(input, 0, 2);
  const sea = clamp(world);
  const lamp = world <= 1
    ? 0.7 * smooth(0.56, 1, world)
    : lerp(0.7, 1, smooth(1, 2, world));
  return {
    world,
    // Left outer, left inner, right inner, right outer.
    flatAngles: [
      Math.PI * smooth(0.48, 0.78, sea),
      Math.PI * smooth(0.53, 0.83, sea),
      -Math.PI * smooth(0.24, 0.57, sea),
      -Math.PI * smooth(0.06, 0.34, sea),
    ],
    // Front wave enters while the left room survives; the back wave waits
    // until the wider inner flat has cleared its lift lane.
    waves: [
      smooth(0.83, 1, sea),
      smooth(0.70, 0.94, sea),
      smooth(0.32, 0.64, sea),
    ],
    moon: smooth(1.12, 1.9, world),
    stars: smooth(1.02, 1.65, world),
    turn: 0.05 * smooth(0.2, 0.68, sea),
    lamp,
  };
}

function freezeSnapshot(data) {
  const mechanicalPose = mechanism(data.world);
  Object.freeze(mechanicalPose.flatAngles);
  Object.freeze(mechanicalPose.waves);
  Object.freeze(mechanicalPose);
  return Object.freeze({
    id: data.id,
    revision: data.revision,
    world: data.world,
    lamp: data.lamp,
    view: data.view,
    light: data.light,
    target: data.target,
    targetWorld: SCENE_WORLD[data.target],
    mechanism: mechanicalPose,
    remaining: Object.freeze({
      from: data.world,
      to: SCENE_WORLD[data.target],
      duration: data.remainingDuration,
    }),
  });
}

function parseSaved(input) {
  try {
    // Accept the JSON stored by this module or its already-parsed object.
    if (typeof input === 'string') {
      if (input.length > 20_000) return null;
      input = JSON.parse(input);
    }
    if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
    if (input.version !== 1 || !isScene(input.scene)) return null;
    const target = input.scene;
    const world = clamp(finite(input.world, SCENE_WORLD[target]), 0, 2);
    const view = clamp(finite(input.view, 0));
    const light = clamp(finite(input.light, DEFAULT_LIGHT));
    const revision = Math.trunc(clamp(finite(input.revision, 0), 0, 1_000_000));
    const defaultDuration = durationFor(world, SCENE_WORLD[target]);
    const remainingDuration = clamp(finite(input.remainingDuration, defaultDuration), 0, 5);
    let snapshot = null;
    const s = input.exitSnapshot;
    if (s && typeof s === 'object' && isScene(s.target) && s.target === target) {
      const snapshotWorld = finite(s.world, NaN);
      const snapshotView = finite(s.view, NaN);
      const snapshotLight = finite(s.light, NaN);
      if ([snapshotWorld, snapshotView, snapshotLight].every(Number.isFinite)) {
        const sw = clamp(snapshotWorld, 0, 2);
        snapshot = freezeSnapshot({
          id: Math.trunc(clamp(finite(s.id, 1), 1, 1_000_000)),
          revision,
          world: sw,
          // Lamp position is a path parameter, never a free world coordinate.
          lamp: clamp(finite(s.lamp, mechanism(sw).lamp)),
          view: clamp(snapshotView),
          light: clamp(snapshotLight),
          target,
          remainingDuration: clamp(finite(s.remaining?.duration, durationFor(sw, SCENE_WORLD[target])), 0, 5),
        });
      }
    }
    return { target, world, view, light, revision, remainingDuration, snapshot };
  } catch {
    // Malformed JSON, unexpected getters, or an unsupported save never break
    // first paint. They simply start the canonical default production.
    return null;
  }
}

function authoredPose(p, reducedMotion) {
  if (reducedMotion) {
    const world = p < 0.43 ? 0 : p < 0.64 ? 1 : 2;
    return {
      world,
      view: p >= 0.19 && p < 0.43 ? 1 : 0,
      light: DEFAULT_LIGHT,
      lamp: mechanism(world).lamp,
    };
  }
  let world = 0;
  let view = smooth(0.12, 0.26, p);
  if (p >= 0.34) {
    world = smooth(0.34, 0.52, p);
    view = lerp(1, 0.12, smooth(0.34, 0.47, p));
  }
  if (p >= 0.6) {
    world = 1 + smooth(0.6, 0.68, p);
    view = lerp(0.12, 0, smooth(0.6, 0.68, p));
  }
  return { world, view, light: DEFAULT_LIGHT, lamp: mechanism(world).lamp };
}

const actAt = (p) => p < 0.19 ? 1 : p < 0.43 ? 2 : p < 0.64 ? 3 : p < 0.88 ? 4 : 5;
const regionAt = (p) => p < ENTER_DIRECTOR ? 'author' : p < EXIT_DIRECTOR ? 'director' : 'exit';

/**
 * @param {object|string|null} initial A version-1 serialize() result.
 * @returns A small state machine. tick() delta is in SECONDS.
 */
export function createDirector(initial = null) {
  const saved = parseSaved(initial);
  let target = saved?.target ?? 'night';
  let world = saved?.snapshot?.world ?? saved?.world ?? 2;
  let lamp = saved?.snapshot?.lamp ?? mechanism(world).lamp;
  let view = saved?.snapshot?.view ?? saved?.view ?? 0;
  let light = saved?.snapshot?.light ?? saved?.light ?? DEFAULT_LIGHT;
  let revision = saved?.revision ?? 0;
  let hasProduction = Boolean(saved);
  let hasVisitedDirector = false;
  let previousRegion = null;
  let progress = 0;
  let exitSnapshot = saved?.snapshot ?? null;
  let snapshotNeedsCapture = !exitSnapshot;
  let snapshotId = exitSnapshot?.id ?? 0;
  let lastPose = null;
  let cue = {
    from: world,
    to: SCENE_WORLD[target],
    elapsed: 0,
    duration: saved?.snapshot?.remaining.duration ?? saved?.remainingDuration ?? durationFor(world, SCENE_WORLD[target]),
  };

  const busy = () => Math.abs(world - SCENE_WORLD[target]) > EPSILON;
  const remainingTime = () => busy() ? Math.max(0, cue.duration - cue.elapsed) : 0;

  function invalidateSnapshot() {
    hasProduction = true;
    revision += 1;
    snapshotNeedsCapture = true;
  }

  function startCue(nextTarget, duration) {
    target = nextTarget;
    cue = {
      from: world,
      to: SCENE_WORLD[target],
      elapsed: 0,
      duration: duration ?? durationFor(world, SCENE_WORLD[target]),
    };
  }

  function setScene(scene) {
    if (!isScene(scene) || scene === target) return false;
    startCue(scene);
    invalidateSnapshot();
    return true;
  }

  function setView(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return false;
    const next = clamp(value);
    if (next === view) return false;
    view = next;
    invalidateSnapshot();
    return true;
  }

  function setLight(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return false;
    const next = clamp(value);
    if (next === light) return false;
    light = next;
    invalidateSnapshot();
    return true;
  }

  function reset() {
    startCue('night');
    view = 0;
    light = DEFAULT_LIGHT;
    invalidateSnapshot();
  }

  function captureExit() {
    snapshotId += 1;
    exitSnapshot = freezeSnapshot({
      id: snapshotId,
      revision,
      world,
      lamp,
      view,
      light,
      target,
      remainingDuration: remainingTime(),
    });
    snapshotNeedsCapture = false;
  }

  function restoreExit() {
    if (!exitSnapshot) return;
    world = exitSnapshot.world;
    lamp = exitSnapshot.lamp;
    view = exitSnapshot.view;
    light = exitSnapshot.light;
    target = exitSnapshot.target;
    startCue(target, exitSnapshot.remaining.duration);
    // A reverse traversal itself never recaptures. Once the visitor really
    // reenters IV, local time resumes. A later exit needs its current pose to
    // remain continuous, even if the same production revision is still used.
    snapshotNeedsCapture = true;
  }

  function advance(delta, reducedMotion, visible) {
    if (!visible || !busy()) return;
    if (reducedMotion || cue.duration <= EPSILON) {
      world = cue.to;
    } else {
      cue.elapsed = Math.min(cue.duration, cue.elapsed + delta);
      world = lerp(cue.from, cue.to, smooth(0, cue.duration, cue.elapsed));
      if (cue.elapsed >= cue.duration) world = cue.to;
    }
    lamp = mechanism(world).lamp;
    if (!busy()) cue = { from: world, to: world, elapsed: 0, duration: 0 };
  }

  function tick(inputProgress, inputDelta = 0, options = {}) {
    const p = clamp(finite(inputProgress, progress));
    const delta = clamp(finite(inputDelta, 0), 0, 0.05);
    const reducedMotion = options.reducedMotion === true;
    const visible = options.visible !== false;
    const region = regionAt(p);
    let result;

    if (region === 'exit') {
      if (!exitSnapshot || snapshotNeedsCapture) captureExit();
      const q = clamp((p - EXIT_DIRECTOR) / (END_HANDOFF - EXIT_DIRECTOR));
      const finish = reducedMotion && q > 0;
      const nextWorld = lerp(exitSnapshot.world, exitSnapshot.targetWorld, finish ? 1 : smooth(0, 0.72, q));
      result = {
        world: nextWorld,
        view: lerp(exitSnapshot.view, 0, finish ? 1 : smooth(0, 0.8, q)),
        light: exitSnapshot.light,
        lamp: lerp(exitSnapshot.lamp, 0, finish ? 1 : smooth(0.12, 0.85, q)),
        doorGlow: finish ? 1 : smooth(0.45, 0.95, q),
        act: actAt(p),
        mode: q >= 1 ? 'ending' : 'handoff',
        scene: sceneAt(nextWorld),
        target: exitSnapshot.target,
        busy: Math.abs(nextWorld - exitSnapshot.targetWorld) > EPSILON,
        exitQ: q,
      };
    } else if (region === 'director') {
      if (previousRegion === 'exit') restoreExit();
      if (previousRegion !== 'director') snapshotNeedsCapture = true;
      hasVisitedDirector = true;
      advance(delta, reducedMotion, visible);
      result = {
        world, view, light, lamp,
        doorGlow: 0,
        act: 4,
        mode: 'director',
        scene: sceneAt(world),
        target,
        busy: busy(),
        exitQ: 0,
      };
    } else {
      const author = authoredPose(p, reducedMotion);
      // Initialized defaults are already a valid production. Apply the same
      // entry bridge on the first approach and every replay; visiting IV alone
      // must not change the authored path. Only this output is blended, leaving
      // the remembered director parameters and its paused cue untouched.
      const entry = reducedMotion ? (p >= 0.64 ? 1 : 0) : smooth(0.64, ENTER_DIRECTOR, p);
      author.world = lerp(author.world, world, entry);
      author.view = lerp(author.view, view, entry);
      author.light = lerp(author.light, light, entry);
      author.lamp = lerp(author.lamp, lamp, entry);
      result = {
        ...author,
        doorGlow: 0,
        act: actAt(p),
        mode: 'author',
        scene: sceneAt(author.world),
        target,
        busy: false,
        exitQ: 0,
      };
    }

    previousRegion = region;
    progress = p;
    lastPose = result;
    return result;
  }

  function serialize() {
    return {
      version: 1,
      scene: target,
      world,
      view,
      light,
      revision,
      remainingDuration: remainingTime(),
      // An earlier exit snapshot is deliberately not saved after a new cue
      // or resumed local work has made it stale.
      exitSnapshot: previousRegion === 'exit' && !snapshotNeedsCapture ? exitSnapshot : null,
    };
  }

  function inspect() {
    return {
      progress,
      region: previousRegion,
      world, lamp, view, light, target,
      busy: busy(),
      revision,
      cue: { ...cue },
      hasProduction,
      hasVisitedDirector,
      exitSnapshot,
      snapshotNeedsCapture,
      pose: lastPose ? { ...lastPose } : null,
    };
  }

  return { setScene, setView, setLight, reset, tick, serialize, inspect };
}
