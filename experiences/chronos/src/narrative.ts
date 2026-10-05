/** The whole film is evaluated from scroll position: no accumulating tweens. */
export const CHAPTERS = [
  { id: 'time', name: 'Time', at: 0 },
  { id: 'energy', name: 'Energy', at: .2 },
  { id: 'transmission', name: 'Transmission', at: .4 },
  { id: 'oscillation', name: 'Oscillation', at: .6 },
  { id: 'craft', name: 'Craft', at: .8 },
  { id: 'chronos', name: 'Chronos', at: 1 },
] as const;

export const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
/** Keep the page's portrait composition and the live camera on the same breakpoint. */
export const portraitLayout = (width: number, height: number) => width <= 700 || (width <= 1100 && width / height <= 43 / 50);
export function smooth(a: number, b: number, v: number) {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
}

export function chapterAt(progress: number) {
  return Math.min(5, Math.floor(clamp(progress) * 5 + .5));
}

/** Stable composition occupies the first 28% of each interval. The following
 * camera move hands the *same* parts to the next scene, which settles at 85%.
 * The mechanical clock and reflection drift remain live during every hold. */
export function cameraProgress(progress: number) {
  const scaled = clamp(progress) * 5;
  const chapter = Math.min(4, Math.floor(scaled));
  const t = smooth(.28, .85, scaled - chapter);
  return (chapter + t) / 5;
}

export function copyState(progress: number, index: number, reduced = false) {
  if (reduced) return { opacity: chapterAt(progress) === index ? 1 : 0, reveal: 1, x: 0 };
  const relative = clamp(progress) - index * .2;
  const enter = index === 0 ? 1 : smooth(-.082, -.040, relative);
  const exit = index === 5 ? 0 : smooth(.052, .090, relative);
  return { opacity: enter * (1 - exit), reveal: enter, x: (1 - enter) * 22 - exit * 24 };
}

export function plateState(progress: number, reduced = false) {
  const p = clamp(progress);
  if (reduced) {
    const chapter = chapterAt(p);
    return { watch: chapter === 0 || chapter === 5 ? 1 : 0, craft: chapter === 4 ? 1 : 0, scale: chapter === 5 ? .59 : 1, zoom: 1 };
  }
  const entry = 1 - smooth(.045, .125, p);
  const ending = smooth(.912, .982, p);
  const craft = smooth(.717, .766, p) * (1 - smooth(.837, .904, p));
  return {
    watch: Math.max(entry, ending),
    craft,
    scale: p < .5 ? 1 + smooth(0, .135, p) * .70 : mix(.69, .59, smooth(.90, 1, p)),
    zoom: mix(1.08, 1.24, smooth(.71, .91, p)),
  };
}
