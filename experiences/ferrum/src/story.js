/**
 * FERRUM's single, reversible narrative coordinate.
 * No wall clock, DOM, random state, or chapter-entry side effects belong here.
 * Travel is measured in stable viewport heights by the controller.
 */
export const TOTAL_TRAVEL = 12.05;

const definitions = [
  ['before-form', 'Before form', '00', 1.55, .18, .64],
  ['furnace', 'The furnace', 'I', 1.95, .20, .61],
  ['strike', 'The strike', 'II', 2.50, .15, .72],
  ['temperature', 'Between temperatures', 'III', 2.20, .18, .69],
  ['edge', 'Reveal the edge', 'IV', 2.30, .21, .76],
  ['relic', 'The relic', 'V', 1.55, .23, 1],
];

let travelled = 0;
export const ACTS = Object.freeze(definitions.map(([id, name, roman, travel, stable, handoff], index) => {
  const start = travelled / TOTAL_TRAVEL;
  travelled += travel;
  const end = index === 5 ? 1 : travelled / TOTAL_TRAVEL;
  return Object.freeze({
    id, name, roman, index, travel, start, end,
    hold: start + (end - start) * (index === 2 ? .24 : .43),
    holdRange: Object.freeze([start + (end - start) * stable, start + (end - start) * handoff]),
    stable, handoff,
  });
}));

export function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

const mix = (a, b, t) => a + (b - a) * t;
const at = (act, local) => (ACTS[act].start + (ACTS[act].end - ACTS[act].start) * local) * TOTAL_TRAVEL;

function track(q, keys) {
  if (q <= keys[0][0]) return Array.isArray(keys[0][1]) ? [...keys[0][1]] : keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (q <= keys[i][0]) {
      const t = smoothstep(keys[i - 1][0], keys[i][0], q);
      const a = keys[i - 1][1], b = keys[i][1];
      return Array.isArray(a) ? a.map((v, j) => mix(v, b[j], t)) : mix(a, b, t);
    }
  }
  const value = keys[keys.length - 1][1];
  return Array.isArray(value) ? [...value] : value;
}

function windowWeight(q, start, full, fade, end) {
  return smoothstep(start, full, q) * (1 - smoothstep(fade, end, q));
}

export function progressForAct(idOrIndex, local = null) {
  const act = typeof idOrIndex === 'number' ? ACTS[clamp(idOrIndex, 0, 5)] : ACTS.find(a => a.id === idOrIndex);
  if (!act) return 0;
  return local == null ? act.hold : mix(act.start, act.end, clamp(local));
}

export function phaseForState(state) {
  if (state.local < state.act.stable) return 'enter';
  if (state.local <= state.act.handoff || state.index === 5) return 'hold';
  return state.local < .94 ? 'handoff' : 'exit';
}

const cameraKeys = [
  [0, [.40, 1.30, 11.8]], [at(0, .20), [.40, 1.30, 11.8]], [at(0, .64), [.40, 1.30, 11.8]],
  [at(1, .20), [.25, 2.05, 10.8]], [at(1, .61), [.25, 2.05, 10.8]],
  [at(1, .87), [.20, 1.8, 9.3]],
  [at(2, .16), [1.25, 2.45, 11.9]], [at(2, .40), [1.25, 2.45, 11.9]],
  [at(2, .52), [-.8, 2.05, 11.4]], [at(2, .71), [-.8, 2.05, 11.4]],
  [at(3, .18), [.75, 2.8, 15.4]], [at(3, .66), [.75, 2.8, 15.4]],
  [at(4, .21), [.4, 2.0, 7.9]], [at(4, .76), [.4, 2.0, 7.9]],
  [at(5, .23), [.4, 2.8, 17.1]], [TOTAL_TRAVEL, [.4, 2.8, 17.1]],
];

const targetKeys = [
  [0, [.40, .45, 0]], [at(0, .64), [.40, .45, 0]],
  [at(1, .20), [.35, -.20, 0]], [at(1, .61), [.35, -.20, 0]],
  [at(2, .16), [.40, .27, 0]], [at(2, .40), [.40, .27, 0]],
  [at(2, .52), [.4, .13, 0]], [at(2, .71), [.4, .13, 0]],
  [at(3, .18), [.55, .40, 0]], [at(3, .66), [.55, .40, 0]],
  [at(4, .21), [.55, .26, 0]], [at(4, .76), [.55, .26, 0]],
  [at(5, .23), [.30, .50, 0]], [TOTAL_TRAVEL, [.30, .50, 0]],
];

const positionKeys = [
  [0, [.95, -.52, 0]], [at(0, .64), [.95, -.52, 0]],
  [at(1, .20), [1.15, -.10, 0]], [at(1, .61), [1.15, -.10, 0]],
  [at(2, .15), [1.30, -.2, 0]], [at(2, .72), [1.30, -.2, 0]],
  [at(3, .18), [1.65, .57, 0]], [at(3, .43), [1.65, .05, 0]],
  [at(3, .69), [1.65, .40, 0]],
  [at(4, .21), [1.85, -.35, 0]], [at(4, .76), [1.85, -.35, 0]],
  [at(5, .23), [.70, -.55, 0]], [TOTAL_TRAVEL, [.70, -.55, 0]],
];

const rotationKeys = [
  [0, [.035, -1.02, -.11]], [at(0, .64), [.035, -1.02, -.11]],
  [at(1, .20), [.04, -.51, .16]], [at(1, .61), [.04, -.51, .16]],
  [at(2, .15), [0, 0, 0]], [at(2, .72), [0, 0, 0]],
  [at(3, .18), [.36, -.18, .80]], [at(3, .58), [.36, -.18, .80]],
  [at(4, .21), [.66, -.10, .64]], [at(4, .76), [.66, -.10, .64]],
  [at(5, .23), [.58, -.35, .17]], [TOTAL_TRAVEL, [.58, -.35, .17]],
];

// Portrait uses the same metal and story, but a deliberately composed camera.
// Its scale and rotation handoffs are continuous; resizing never resets time.
const portraitKeys = [
  [0, [.08, -.63, -.90, .58, .20]], [at(0, .64), [.08, -.63, -.90, .58, .20]],
  [at(1, .20), [.18, -.45, .84, .69, -.15]], [at(1, .61), [.18, -.45, .84, .69, -.15]],
  [at(2, .15), [0, 0, 0, .64, -.15]], [at(2, .72), [0, 0, 0, .64, -.15]],
  [at(3, .18), [.45, -.06, 1.01, .50, -.15]], [at(3, .69), [.45, -.06, 1.01, .50, -.15]],
  [at(4, .21), [.67, -.07, .80, .78, .15]], [at(4, .76), [.67, -.07, .80, .78, .15]],
  [at(5, .23), [.68, -.13, .95, .53, -.15]], [TOTAL_TRAVEL, [.68, -.13, .95, .53, -.15]],
];

/** Return a fresh state so renderer changes cannot poison subsequent samples. */
export function sampleStory(input, { reducedMotion = false } = {}) {
  const progress = clamp(Number.isFinite(input) ? input : 0);
  const index = progress >= 1 ? 5 : ACTS.findIndex(act => progress < act.end);
  const act = ACTS[index];
  const local = clamp((progress - act.start) / (act.end - act.start));
  const q = progress * TOTAL_TRAVEL;
  const strikeLocal = (q - at(2, 0)) / ACTS[2].travel;

  const shape = track(q, [
    [0, 0], [at(1, .20), .025], [at(2, .24), .085],
    [at(2, .37), .43], [at(2, .53), .43], [at(2, .67), .86],
    [at(2, .90), .94], [at(4, .21), 1],
  ]);
  const heat = track(q, [
    [0, .015], [at(0, .64), .04], [at(1, .20), .84],
    [at(1, .61), .94], [at(2, .12), .84], [at(2, .35), .88],
    [at(2, .69), .80], [at(3, .18), .73], [at(3, .51), .12],
    [at(3, .78), .02], [at(4, .1), 0],
  ]);
  const polish = track(q, [[0, 0], [at(3, .76), .05], [at(4, .21), .42], [at(4, .76), .92], [at(5, .23), 1]]);
  const oxide = track(q, [[0, 1], [at(2, .40), .87], [at(3, .69), .77], [at(4, .65), .22], [at(5, .23), .12]]);
  const furnace = windowWeight(q, at(0, .66), at(1, .20), at(1, .67), at(2, .14));
  const strike = windowWeight(q, at(1, .76), at(2, .15), at(2, .76), at(3, .15));
  const cooling = windowWeight(q, at(2, .78), at(3, .18), at(3, .72), at(4, .17));
  const reveal = windowWeight(q, at(3, .72), at(4, .21), at(4, .78), at(5, .23));
  const relic = smoothstep(at(4, .78), at(5, .23), q);
  const mist = reducedMotion ? 0 : windowWeight(q, at(3, .20), at(3, .38), at(3, .55), at(3, .87));

  const strikePulses = [.28, .56].map((contact, i) => {
    const age = (strikeLocal - contact) * 8.7;
    return { age, seed: i ? 6179 : 1277, weight: reducedMotion || age < 0 ? 0 : Math.exp(-age * 9) * (age < 1.3 ? 1 : 0) };
  });
  const recoil = reducedMotion ? 0 : strikePulses.reduce((sum, pulse) => sum + (pulse.age >= 0 && pulse.age < 1 ? Math.sin(pulse.age * 26) * Math.exp(-pulse.age * 9) : 0), 0);
  const compression = reducedMotion ? 0 : strikePulses.reduce((sum, pulse) => sum + pulse.weight * .065, 0);
  const hammerHeight = track(strikeLocal, [
    [-1, 3.9], [.12, 3.9], [.20, 2.80], [.256, 2.7], [.28, 0],
    [.32, .36], [.39, 1.05], [.46, 1.08], [.51, 2.1], [.542, 2.05],
    [.56, 0], [.602, .32], [.70, 1.20], [.86, 4.1], [2, 4.1],
  ]);
  const hammerTilt = track(strikeLocal, [[0, -.10], [.25, -.10], [.28, 0], [.4, .025], [.54, .075], [.56, 0], [.7, -.03], [1, -.12]]);

  const objectPosition = track(q, positionKeys);
  // The billet's underside stays on the same anvil as its thickness changes.
  const contactSupport = windowWeight(q, at(1, .82), at(2, .15), at(2, .72), at(3, .12));
  const halfThickness = mix(.60, .145, shape);
  objectPosition[1] = mix(objectPosition[1], -.55 + halfThickness - compression * .3, contactSupport);
  const cameraPosition = track(q, cameraKeys);
  const cameraTarget = track(q, targetKeys);
  const portraitComposition = track(q, portraitKeys);
  cameraPosition[1] += recoil * .035;
  cameraPosition[2] += recoil * .055;

  if (reducedMotion) {
    cameraPosition.splice(0, 3, .4, 2.25, 14.0);
    cameraTarget.splice(0, 3, .4, .05, 0);
  }

  const state = {
    progress, index, act, local, reducedMotion,
    shape, heat, polish, oxide,
    camera: {
      position: cameraPosition, target: cameraTarget,
      fov: reducedMotion ? 33 : track(q, [[0, 30], [at(0, .64), 30], [at(1, .2), 32], [at(3, .69), 32], [at(4, .21), 28], [at(4, .76), 28], [at(5, .23), 31]]),
    },
    object: { position: objectPosition, rotation: track(q, rotationKeys), scale: [1, 1 - compression, 1] },
    portrait: {
      rotation: portraitComposition.slice(0, 3), scale: portraitComposition[3],
      worldY: portraitComposition[4],
      camera: [0, 2.4, 15.4], target: [0, .55, 0], fov: 36,
    },
    lights: { furnace, strike, cooling, reveal, relic },
    hammer: { height: reducedMotion ? 1.35 : hammerHeight, tilt: reducedMotion ? 0 : hammerTilt, compression, contactX: mix(.4, 1.45, smoothstep(.40, .51, strikeLocal)), contactY: objectPosition[1] + halfThickness },
    strikePulses,
    reflection: track(q, [[0, -.38], [at(0, .64), -.31], [at(1, .61), -.12], [at(3, .66), .1], [at(4, .21), -.55], [at(4, .76), .55], [at(5, .23), .35]]),
    mist, water: cooling,
    quench: smoothstep(at(3, .20), at(3, .72), q),
    captions: { current: index, next: Math.min(5, index + 1), nextWeight: index === 5 ? 0 : smoothstep(.82, .99, local) },
  };
  state.phase = phaseForState(state);
  return state;
}

function hash(seed) {
  let n = seed | 0;
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

/** Analytic spark paths: sampling backward never spawns or accumulates anything. */
export function sampleStrikeParticles(state, count = 34) {
  if (state.reducedMotion || state.lights.strike < .001) return [];
  const result = [];
  for (let event = 0; event < state.strikePulses.length; event++) {
    const pulse = state.strikePulses[event];
    for (let i = 0; i < Math.min(64, Math.max(0, count)); i++) {
      const seed = pulse.seed + i * 31;
      const birth = hash(seed + 1) * .043;
      const age = pulse.age - birth;
      const life = .30 + hash(seed + 2) * .56;
      if (age < 0 || age > life) continue;
      const direction = hash(seed + 3) > .33 ? 1 : -1;
      const vx = direction * (1.45 + hash(seed + 4) * 5.4);
      const vy = .52 + hash(seed + 5) * 2.70;
      const vz = .65 + hash(seed + 6) * 1.65;
      const originX = state.object.position[0] + (event ? 1.45 : .4);
      const originY = state.hammer.contactY + .03;
      // Sparks leave the front lip of the contact patch, clearing the hammer
      // face instead of spending the useful visible lifetime inside the head.
      const originZ = .90 + hash(seed + 8) * .10;
      const point = t => [originX + vx * t, originY + vy * t - 4.55 * t * t, originZ + vz * t];
      const tail = Math.max(0, age - (.012 + hash(seed + 7) * .021));
      result.push({ id: event * 64 + i, age, life, position: point(age), previous: point(tail), brightness: Math.pow(1 - age / life, 1.5) });
    }
  }
  return result;
}
