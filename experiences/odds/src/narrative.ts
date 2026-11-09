/**
 * Stateless scroll evaluation for the ten-chapter ODDS installation.
 * These functions never generate samples, mutate rounds, or read the DOM.
 * All indices are zero-based. A transition value is a boundary index; progress
 * is that boundary's local 0…1 progress, independent of scroll direction.
 */

export interface NarrativeFrame {
  chapter: number;
  next: number;
  progress: number;
  transition: number | null;
}

export interface TransitionSnapshot {
  id: string;
  unit: 'paths' | 'probability' | 'balls' | 'structure';
  /** Complete levels in the represented model, or null during a partial/unknown structure. */
  layers: number | null;
  /** Only used for the middle round's preserved prefix in TR-07-08. */
  revealedSamples: number | null;
  note: string;
}

export const CHAPTER_COUNT = 10;
export const STABLE_FRACTION = 0.58;

/** Clamp to a finite interval; an invalid value safely selects the lower end. */
export function clamp(value: number, minimum = 0, maximum = 1): number {
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || maximum < minimum) {
    throw new RangeError('Clamp bounds must be finite and in increasing order.');
  }
  if (Number.isNaN(value)) return minimum;
  return Math.max(minimum, Math.min(maximum, value));
}

/** Cubic easing with flat end tangents; input is normalized to 0…1. */
export function smoothstep(value: number): number {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}

function stable(chapter: number): NarrativeFrame {
  return { chapter, next: chapter, progress: 0, transition: null };
}

function assertAnchors(anchors: number[]): void {
  if (!Array.isArray(anchors) || anchors.length !== CHAPTER_COUNT ||
      anchors.some((anchor, index) => !Number.isFinite(anchor) || (index > 0 && anchor <= anchors[index - 1]))) {
    throw new RangeError('ODDS requires ten finite, strictly increasing chapter anchors.');
  }
}

/**
 * Each chapter is stable through 58% of its measured span. The remaining 42%
 * is a reversible local transition. At an exact next anchor, the target chapter
 * is already its complete stable scene. Reduced motion chooses either adjacent
 * stable frame while all article content remains in normal document order.
 */
export function evaluateNarrative(scrollY: number, anchors: number[], reduced: boolean): NarrativeFrame {
  assertAnchors(anchors);
  const position = Number.isFinite(scrollY) ? scrollY : anchors[0];
  if (position <= anchors[0]) return stable(0);
  if (position >= anchors[CHAPTER_COUNT - 1]) return stable(CHAPTER_COUNT - 1);

  let chapter = 0;
  while (chapter < CHAPTER_COUNT - 2 && position >= anchors[chapter + 1]) chapter++;
  const fraction = (position - anchors[chapter]) / (anchors[chapter + 1] - anchors[chapter]);
  if (fraction <= STABLE_FRACTION) return stable(chapter);
  const progress = clamp((fraction - STABLE_FRACTION) / (1 - STABLE_FRACTION));
  if (reduced) return stable(progress >= 0.5 ? chapter + 1 : chapter);
  return { chapter, next: chapter + 1, progress, transition: chapter };
}

function completeLevel(value: number): number | null {
  const rounded = Math.round(value);
  return Math.abs(value - rounded) < 1e-9 ? rounded : null;
}

/**
 * Semantic evidence for the nine boundaries. `layers` describes fully revealed
 * structure, never a statistical parameter inferred from a half-drawn scene.
 * Unknown personal rules stay unknown here and must be read from AppState.
 */
export function transitionSnapshot(
  index: number,
  progress: number,
  comparisonN: 16 | 64 | 128 = 128,
): TransitionSnapshot {
  if (!Number.isInteger(index) || index < 0 || index >= CHAPTER_COUNT - 1) {
    throw new RangeError('The transition index must be an integer from 0 to 8.');
  }
  if (comparisonN !== 16 && comparisonN !== 64 && comparisonN !== 128) {
    throw new RangeError('The comparison prefix must contain 16, 64, or 128 samples.');
  }
  const t = Number.isFinite(progress) ? clamp(progress) : 0;
  const id = `TR-${String(index + 1).padStart(2, '0')}-${String(index + 2).padStart(2, '0')}`;
  const base = { id, revealedSamples: null };

  switch (index) {
    case 0:
      return {
        ...base, unit: 'structure', layers: t === 0 ? 8 : t === 1 ? 1 : null,
        note: t === 1
          ? 'One-fork teaching detail. The earlier eight-layer experiment remains separately saved.'
          : 'Approaching the first fork of the eight-layer board. A camera crop is not a change to the saved experiment.',
      };
    case 1:
      return {
        ...base, unit: 'structure', layers: t === 0 ? 1 : t === 1 ? 4 : null,
        note: t === 1
          ? 'The four-layer teaching fan is complete: sixteen direction sequences and five endpoints.'
          : 'Connections are unfolding into a four-layer teaching fan. Partial geometry is not labelled as a complete enumeration.',
      };
    case 2: {
      // The scene completes the extension at 75%, then changes its visual
      // representation from the full tree to exact endpoint path weights.
      // A fractional entering level must never be reported as complete.
      const layers = completeLevel(4 + 4 * Math.min(1, t / 0.75));
      if (t >= 0.75) return {
        ...base, unit: t === 0.75 ? 'structure' : 'paths', layers: 8,
        note: t === 0.75
          ? 'The eight-level structural extension is complete, with nine final endpoints. The final quarter now transfers this complete model into exact endpoint path weights; no balls have been sampled.'
          : t === 1
            ? 'The complete eight-level model is now represented by exact endpoint path weights, totalling 256 direction sequences. The weights are not observed ball counts.'
            : 'The complete eight-level model is changing representation from its tree to exact endpoint path weights. No additional levels or sampled balls are being introduced.',
      };
      return {
        ...base, unit: 'structure', layers,
        note: `${layers === null ? 'A new structural level is partially entering' : `${layers} complete structural levels are visible`}. The four-to-eight-level extension occupies the first three quarters of this transition; old endpoints become intermediate nodes. No sampled counts are asserted.`,
      };
    }
    case 3:
      if (t < 0.25) return {
        ...base, unit: 'paths', layers: 8,
        note: 'Exact path weights sum to 256 direction sequences. These are path counts, not 256 observed balls.',
      };
      if (t < 0.5) return {
        ...base, unit: 'probability', layers: 8,
        note: 'Each path weight is divided by 256. The axis now represents probability; all nine values sum to one.',
      };
      return {
        ...base, unit: 'balls', layers: 8,
        note: 'Theory is now 16 × P(K=k), in expected balls. The central expectation is 4.375. The two independent 16-ball observations share this count scale and remain separate rounds.',
      };
    case 4:
      return {
        ...base, unit: 'balls', layers: 8,
        note: 'The two earlier 16-ball rounds remain separate saved results. Repositioning the probability marker does not run a new experiment or alter the saved bias round.',
      };
    case 5:
      return {
        ...base, unit: 'balls', layers: 8,
        note: `Entering a separate teaching comparison: n=8, p=0.5, N=${comparisonN} per round, with one shared count scale. The previous bias round retains its own rules and results.`,
      };
    case 6: {
      const revealedSamples = t <= 0.5
        ? comparisonN
        : Math.floor(comparisonN + (256 - comparisonN) * ((t - 0.5) / 0.5));
      return {
        id, unit: 'balls', layers: 8, revealedSamples,
        note: `Only the middle teaching round supplies this ${revealedSamples}-sample prefix. Its existing sample IDs and paths remain fixed. Side rounds remain independent and are never added to the portrait. Scroll reveals saved samples; it does not draw new ones.`,
      };
    }
    case 7:
      return {
        ...base, unit: 'structure', layers: t === 0 ? 8 : null,
        note: 'The selected teaching ball retains its ID, eight directions, and endpoint while its path becomes a result label. The workbench has its own saved parameters; selection changes neither counts nor rules.',
      };
    default:
      return {
        ...base, unit: 'balls', layers: null,
        note: 'Returning to the entrance viewpoint preserves the current personal round: n, p, N, seed, paths, and counts. The visible board must have n+1 slots, and export still uses this same round. Only an explicit next-ball action appends a result.',
      };
  }
}
