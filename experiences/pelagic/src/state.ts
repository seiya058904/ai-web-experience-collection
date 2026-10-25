export const clamp = (n: number, low = 0, high = 1) => Math.min(high, Math.max(low, n));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export type Pattern = 'A' | 'B';
export type ObservationState = {
  progress: number;
  manualLight: number | null;
  light: number;
  restoringLight: boolean;
  motionPaused: boolean;
  reducedMotion: boolean;
  modalOpen: boolean;
  hidden: boolean;
  time: number;
  encounter: { position: number; playing: boolean; visited: boolean };
  pattern: Pattern;
  backlight: boolean;
};

export const createState = (reducedMotion = false): ObservationState => ({
  progress: 0, manualLight: null, light: 0.82, restoringLight: false,
  motionPaused: reducedMotion, reducedMotion, modalOpen: false, hidden: false,
  time: 0, encounter: { position: 0, playing: false, visited: false },
  pattern: 'A', backlight: true,
});

export function authoredLight(progress: number) {
  if (progress < 1) return lerp(0.82, 0.07, smooth(0.58, 1, progress));
  if (progress < 2.58) return 0.07;
  if (progress < 3) return lerp(0.07, 0.24, smooth(2.58, 3, progress));
  return lerp(0.24, 0.82, smooth(3.58, 4, progress));
}

export function chooseLight(state: ObservationState, value: number) {
  state.manualLight = clamp(value);
  state.light = state.manualLight;
  state.restoringLight = false;
}

export function restoreAuthored(state: ObservationState) {
  state.manualLight = null;
  state.restoringLight = true;
}

export function updateProgress(state: ObservationState, value: number) {
  state.progress = clamp(value, 0, 4);
  if (state.progress >= 1.98 && state.progress < 2.45 && !state.encounter.visited) {
    state.encounter.visited = true;
    state.encounter.playing = !state.reducedMotion && !state.motionPaused;
  }
}

export function advance(state: ObservationState, elapsed: number) {
  const dt = clamp(elapsed, 0, 0.05);
  if (state.hidden || state.modalOpen) return;
  const desiredLight = state.manualLight ?? authoredLight(state.progress);
  // Story light is a pure function of scroll. Only an explicit restoration
  // eases from the visitor's chosen value; fast reverse scrolling cannot lag.
  state.light = state.restoringLight && !state.reducedMotion
    ? lerp(state.light, desiredLight, 1 - Math.exp(-dt * 9)) : desiredLight;
  if (Math.abs(state.light - desiredLight) < .001) state.restoringLight = false;
  if (!state.motionPaused) state.time += dt;
  if (state.encounter.playing && !state.motionPaused && state.progress >= 1.6 && state.progress <= 2.62) {
    state.encounter.position = clamp(state.encounter.position + dt / 9);
    if (state.encounter.position >= 1) state.encounter.playing = false;
  }
}

export function replayEncounter(state: ObservationState) {
  state.encounter.position = 0;
  state.encounter.visited = true;
  state.encounter.playing = !state.motionPaused && !state.reducedMotion;
}

export function scrubEncounter(state: ObservationState, value: number) {
  state.encounter.position = clamp(value);
  state.encounter.playing = false;
  state.encounter.visited = true;
}

export function panelOpacity(index: number, progress: number) {
  const entry = index === 0 ? 1 : smooth(index - 0.14, index, progress);
  const exit = index === 4 ? 1 : 1 - smooth(index + 0.58, index + 0.675, progress);
  return entry * exit;
}

export function fishPosition(position: number) {
  // Piecewise smooth authored reconstruction: approach, inspect, curve away.
  // Normalized to the local observation area, not a measured animal track.
  const p = clamp(position);
  if (p <= 0.64) {
    const t = smooth(0, 0.64, p);
    return { x: lerp(-0.42, -0.06, t), y: lerp(0.32, 0.16, t) + Math.sin(t * Math.PI) * 0.045, angle: -0.18 + t * 0.08 };
  }
  const t = smooth(0.64, 1, p);
  return { x: lerp(-0.06, 0.08, t), y: lerp(0.16, 0.31, t) - Math.sin(t * Math.PI) * 0.025, angle: lerp(-0.1, 0.85, t) };
}

export function transitionState(progress: number) {
  const p = clamp(progress, 0, 4);
  return {
    pullback: smooth(1.58, 2, p),
    species: smooth(2.58, 3, p),
    returnEdit: smooth(3.58, 4, p),
    fishAlpha: smooth(1.58, 1.93, p) * (1 - smooth(2.55, 2.83, p)),
    active: Math.min(4, Math.floor(p + 0.15)),
  };
}
