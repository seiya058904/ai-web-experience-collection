/** A single reversible coordinate drives the whole installation. */
export const CHAPTERS = Object.freeze([
  { id: 'light', name: 'Light' },
  { id: 'surface', name: 'Surface' },
  { id: 'refraction', name: 'Refraction' },
  { id: 'reflection', name: 'Reflection' },
  { id: 'layers', name: 'Layers' },
  { id: 'glasshouse', name: 'Glasshouse' }
]);

export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const mix = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, value) => {
  const t = clamp((value - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export function sampleJourney(progress, reduced = false) {
  const p = clamp(Number.isFinite(progress) ? progress : 0);
  const x = p * CHAPTERS.length;
  const chapter = Math.min(CHAPTERS.length - 1, Math.floor(x));
  const localProgress = Math.min(1, x - chapter);
  let from = chapter;
  let to = chapter;
  let blend = 0;

  // A pose holds from .24 through .68. The handoff occupies both sides of
  // a chapter boundary, so crossing it never resets an object or camera.
  if (!reduced && localProgress < 0.24 && chapter > 0) {
    from = chapter - 1;
    blend = smooth(0, 0.56, localProgress + 0.32);
  } else if (!reduced && localProgress > 0.68 && chapter < 5) {
    to = chapter + 1;
    blend = smooth(0, 0.56, localProgress - 0.68);
  }

  const darknessKeys = [0, 0, 1, 1, 0, 0];
  const darkness = mix(darknessKeys[from], darknessKeys[to], blend);
  const entering = chapter === 0 ? 1 : smooth(0.03, 0.23, localProgress);
  const exiting = chapter === 5 ? 1 : 1 - smooth(0.73, 0.96, localProgress);

  return {
    progress: p, chapter, localProgress, from, to, blend, darkness,
    hold: smooth(0.24, 0.68, localProgress),
    captionOpacity: reduced ? 1 : Math.min(entering, exiting),
    captionOffset: reduced ? 0 : (1 - entering) * 28 - (1 - exiting) * 28
  };
}

export function chapterProgress(index) {
  const i = clamp(Math.round(index), 0, CHAPTERS.length - 1);
  return i === 0 ? 0 : (i + 0.32) / CHAPTERS.length;
}

export function scrollLength(height, { mobile = false, reduced = false } = {}) {
  const viewport = Math.max(320, height);
  return Math.round(viewport * CHAPTERS.length * (reduced ? 1 : mobile ? 1.45 : 1.5));
}
