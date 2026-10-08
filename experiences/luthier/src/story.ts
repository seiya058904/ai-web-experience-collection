/** A reversible, piecewise-linear score. Distances are viewport heights. */
export const CHAPTERS = [
  ['presence', 'Presence'], ['wood', 'Wood'], ['craft', 'Craft'],
  ['inside', 'Inside'], ['tension', 'Tension'], ['first-bow', 'First bow'],
  ['resonance', 'Resonance'], ['sound-as-space', 'Sound as space'], ['return', 'Return'],
] as const;

export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const smooth = (a: number, b: number, x: number) => {
  const p = clamp((x - a) / (b - a));
  return p * p * (3 - 2 * p);
};

export function distances(mobile: boolean): number[] {
  return mobile ? [1.35, 1.5, 1.5, 1.6, 1.35, 2.35, 1.8, 1.9, 1.3]
    : [1.65, 1.7, 1.8, 1.9, 1.55, 2.7, 2.1, 2.2, 1.65];
}

export function storyToUnits(story: number, units: readonly number[]): number {
  const bounded = clamp(Number.isFinite(story) ? story : 0, 0, units.length);
  let total = 0;
  for (let i = 0; i < units.length; i++) {
    if (bounded < i + 1) return total + (bounded - i) * units[i];
    total += units[i];
  }
  return total;
}

export function unitsToStory(position: number, units: readonly number[]): number {
  let rest = Math.max(0, Number.isFinite(position) ? position : 0);
  for (let i = 0; i < units.length; i++) {
    if (rest < units[i]) return i + rest / units[i];
    rest -= units[i];
  }
  return units.length - .000001;
}

export function sceneWeight(scene: number, story: number): number {
  const index = Math.min(8, Math.max(0, Math.floor(story)));
  // Half of each chapter carries the handoff, so one composition yields to the
  // next across a long measured movement instead of a quick exchange.
  const blend = index < 8 ? smooth(.50, 1, story - index) : 0;
  return scene === index ? 1 - blend : scene === index + 1 ? blend : 0;
}
