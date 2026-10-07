/**
 * MAGMA's directed material score. Values describe visual states, not measured
 * temperatures or a physical cooling simulation. Nothing accumulates with time:
 * arbitrary scroll jumps, reverse scrolling and reloads reproduce the same state.
 */
export const SCENES = Object.freeze([
  'pressure', 'molten', 'flow', 'skin', 'crack',
  'glass', 'fracture', 'stone', 'sealed',
]);

export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export function smoothstep(a, b, value) {
  const t = clamp((value - a) / (b - a));
  return t * t * (3 - 2 * t);
}

function sampleScene(scene, progress, interaction) {
  const p = clamp(progress);
  const hand = Number.isFinite(Number(interaction)) ? clamp(Number(interaction)) : 0;
  const common = {
    heat: 0, crust: 1, flow: 0, split: 0, glass: 0, seal: 0,
    front: -0.25, retention: 1, pulse: 0, relief: 0,
    camera: 0, driftX: 0, driftY: 0, motion: 0,
  };
  switch (scene) {
    case 0: return {
      ...common, heat: lerp(0.33, 0.39, p), crust: 0.9,
      pulse: 0.055, camera: p * 0.025,
      motion: 0.12,
    };
    case 1: return {
      ...common, heat: lerp(0.98, 0.85, p), crust: lerp(0.09, 0.22, p),
      flow: lerp(0.74, 0.95, p), front: lerp(-0.18, 0.055, p),
      retention: lerp(1, 0.93, p), pulse: 0.07, motion: 1,
      camera: lerp(0.012, 0.035, p), driftY: p * 0.003,
    };
    case 2: return {
      ...common, heat: lerp(0.83, 0.57, p), crust: lerp(0.2, 0.52, p),
      flow: lerp(0.9, 0.37, p), front: lerp(0.035, 0.38, p),
      retention: lerp(1, 0.82, p), pulse: 0.055, motion: 0.82,
      camera: lerp(0.015, 0.03, p), driftX: -p * 0.004,
    };
    case 3: {
      const cool = clamp(p * 0.78 + hand * 0.38);
      return {
        ...common, heat: lerp(0.58, 0.11, cool), crust: lerp(0.43, 0.98, cool),
        flow: 0.19 * (1 - cool), front: lerp(0.06, 0.98, cool),
        retention: lerp(1, 0.25, cool), pulse: 0.04 * (1 - cool),
        motion: 0.35 * (1 - cool), camera: 0.014 + p * 0.014,
      };
    }
    case 4: {
      const open = smoothstep(0.05, 0.48, p);
      const settle = smoothstep(0.65, 1, p);
      return {
        ...common, heat: 0.27 + open * 0.22 - settle * 0.17 + hand * 0.045,
        crust: 0.87, split: clamp(open * 0.77 + hand * 0.6, 0, 1.15) * (1 - settle * 0.2),
        retention: 0.88 + open * 0.12 - settle * 0.2,
        pulse: 0.045, relief: open * 0.2 + hand * 0.18, motion: 0.1,
        camera: 0.012 + p * 0.016,
      };
    }
    case 5: return {
      ...common, glass: lerp(0.35, 1, smoothstep(0, 0.55, p)),
      camera: p * 0.018, motion: 0.22,
    };
    case 6: return {
      ...common, glass: 0.72, relief: lerp(0.16, 1, smoothstep(0, 0.7, p)) + hand * 0.72,
      split: clamp(smoothstep(0.12, 0.7, p) * 0.48 + hand * 0.7, 0, 1.1),
      camera: lerp(0.008, 0.03, p), motion: 0.12,
    };
    case 7: return {
      ...common, glass: lerp(0.1, 0, p), relief: 0,
      camera: lerp(0.02, 0, p), motion: 0,
    };
    default: {
      const seal = smoothstep(0.04, 0.86, p);
      return {
        ...common, heat: 0.022 * (1 - seal), seal,
        retention: 0.043 * (1 - seal), motion: 0,
      };
    }
  }
}

/** Pure public timeline: position 0..9, including the final settled hold. */
export function stateAt(position, interaction = 0) {
  const input = Number(position);
  const pos = Number.isFinite(input) ? clamp(input, 0, 9) : 0;
  const scene = Math.min(8, Math.floor(pos));
  const progress = pos >= 9 ? 1 : pos - scene;
  const complete = pos >= 8.86;
  let from = scene;
  let to = Math.min(8, scene + 1);
  let mix = smoothstep(0.76, 1, progress);
  let source = sampleScene(scene, clamp(progress / 0.76), interaction);
  let destination = sampleScene(scene + 1, 0, 0);

  if (scene === 7) {
    // Return to the original body with only a trace of light, then seal it.
    to = 0;
    destination = sampleScene(8, 0, 0);
  } else if (scene === 8) {
    from = 0;
    to = 8;
    mix = complete ? 1 : smoothstep(0.04, 0.86, progress);
    source = sampleScene(8, progress, 0);
    destination = { ...sampleScene(8, 1, 0), retention: 0, seal: 1 };
  }

  const blended = {};
  for (const key of Object.keys(source)) {
    blended[key] = lerp(source[key], destination[key], mix);
  }
  if (complete) {
    Object.assign(blended, {
      heat: 0, flow: 0, pulse: 0, motion: 0, split: 0, glass: 0,
      relief: 0, camera: 0, driftX: 0, driftY: 0, seal: 1,
    });
  }
  return {
    position: pos, scene, name: SCENES[scene], progress, from, to, mix,
    ...blended, complete, source, destination,
    phase: progress < 0.14 ? 'enter'
      : progress < 0.36 ? 'stable'
        : progress < 0.72 ? 'hold'
          : progress < 0.94 ? 'handoff' : 'exit',
  };
}
