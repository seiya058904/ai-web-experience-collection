/**
 * The installation has one scroll coordinate and no accumulated animation state.
 * A frame sampled after a jump, resize or reverse scroll is therefore identical
 * to a frame reached by scrolling forward to the same coordinate.
 */
export const CHAPTER_COUNT = 7;
export const END_RAW = 6.85;

export type ScenePhase = 'enter' | 'stable' | 'hold' | 'handoff' | 'exit';

export interface TimelineSample {
  /** Continuous material coordinate consumed by the cloth renderer, from 0 to 6. */
  progress: number;
  /** The chapter with the dominant title; suitable for aria-current. */
  active: number;
  /** Position within the outgoing chapter, independent of the dominant title. */
  local: number;
  phase: ScenePhase;
  /** Only adjacent titles overlap. Their weights always add up to one. */
  weights: number[];
  /** The dark light-study environment, including its arrival and departure. */
  dark: number;
  /** Overall scroll completion, from 0 to 1. */
  completed: number;
}

/** Finite bounds, ordered bounds and a safe lower-end fallback for NaN. */
export function clamp(value: number, min = 0, max = 1): number {
  const a = Number.isFinite(min) ? min : 0;
  const b = Number.isFinite(max) ? max : 1;
  const lower = Math.min(a, b);
  const upper = Math.max(a, b);
  if (!Number.isFinite(value)) return value === Infinity ? upper : lower;
  return Math.min(upper, Math.max(lower, value));
}

/** Hermite interpolation with zero velocity at both ends. */
export function smoothstep(edge0: number, edge1: number, value: number): number {
  const start = Number.isFinite(edge0) ? edge0 : 0;
  const end = Number.isFinite(edge1) ? edge1 : 1;
  if (start === end) return value >= end ? 1 : 0;
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}

/** Chapter navigation lands inside the settled composition; the opening starts at zero. */
export function chapterTarget(index: number): number {
  const chapter = Math.floor(clamp(index, 0, CHAPTER_COUNT - 1));
  return chapter === 0 ? 0 : chapter + 0.24;
}

export function sampleTimeline(raw: number): TimelineSample {
  const position = clamp(raw, 0, END_RAW);
  const chapter = Math.floor(position);
  const local = position - chapter;
  const finalChapter = chapter === CHAPTER_COUNT - 1;

  // Compare against absolute thresholds so, for example, 6.14 is classified at
  // its intended boundary even when subtracting 6 would round local below .14.
  let phase: ScenePhase;
  if (position < chapter + 0.14) phase = 'enter';
  else if (position < chapter + 0.36) phase = 'stable';
  else if (finalChapter || position < chapter + 0.6) phase = 'hold';
  else if (position < chapter + 0.92) phase = 'handoff';
  else phase = 'exit';

  // The settled and living compositions use just 3.5% of the material change.
  // Almost all construction takes place during the handoff, with zero velocity
  // at the chapter boundary. Time-based breathing belongs to the renderer and
  // cannot make the scroll timeline drift or chase its destination.
  const refinement = 0.035 * smoothstep(0.14, 0.6, local);
  const handoff = 0.965 * smoothstep(0.6, 1, local);
  const progress = finalChapter ? CHAPTER_COUNT - 1 : chapter + refinement + handoff;

  // The cloth begins changing before the incoming words arrive. A partition of
  // unity keeps a legible title present at every intermediate scroll position.
  const titleBlend = finalChapter ? 0 : smoothstep(0.64, 0.96, local);
  const weights = new Array<number>(CHAPTER_COUNT).fill(0);
  weights[chapter] = 1 - titleBlend;
  if (!finalChapter) weights[chapter + 1] = titleBlend;
  const active = !finalChapter && position >= chapter + 0.8 ? chapter + 1 : chapter;

  // LIGHT is fully dark throughout its stable composition and living hold.
  // Both changes of atmosphere follow the material morph, rather than a
  // chapter-index switch that could flash during rapid or reverse scrolling.
  const dark = smoothstep(2.1, 2.9, progress) * (1 - smoothstep(3.1, 3.9, progress));

  return {
    progress,
    active,
    local,
    phase,
    weights,
    dark,
    completed: position / END_RAW,
  };
}
