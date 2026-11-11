/**
 * Pure, scroll-owned story state for NIGHTSHIFT.
 *
 * Coordinates are normalized editorial screen coordinates, not measured image
 * UVs or physical scene dimensions. The rendering layer owns asset calibration.
 * This module never starts playback, loads an asset, reads the DOM, or remembers
 * which chapter was visited previously.
 */

export type MotionMode = 'full' | 'reduced' | 'stills';

export interface ChapterMetric {
  id: string;
  top: number;
  bottom: number;
}

export interface TransitionMetric {
  id: string;
  from: number;
  to: number;
  start: number;
  end: number;
}

export interface StoryInput {
  scrollY: number;
  viewport: { width: number; height: number };
  chapters: ChapterMetric[];
  transitions: TransitionMetric[];
  mode: MotionMode;
  assetsReady?: ReadonlySet<string>;
  qualityTier?: 'low' | 'high';
}

export type OccluderKind =
  | 'window'
  | 'door'
  | 'glass'
  | 'threshold'
  | 'curb'
  | 'pipe'
  | 'corner'
  | 'canopy'
  | 'column'
  | 'panes';

export type TransitionPhase =
  | 'source-to-target'
  | 'source-to-midpoint'
  | 'midpoint-to-target'
  | 'static-source'
  | 'static-target';

export interface TransitionEvaluation {
  progress: number;
  sourceVisible: boolean;
  targetVisible: boolean;
  midpointVisible: boolean;
  sourceTextOpacity: number;
  targetTextOpacity: number;
  anchorX: number;
  anchorY: number;
  /** Overall incoming reveal progress, always monotonic from zero to one. */
  reveal: number;
  occluder: OccluderKind;
  phase: TransitionPhase;
  /** Progress within the current opaque reveal, including the two pipe phases. */
  phaseProgress: number;
  /** Visible spatial coverage. These values must never be used as image alpha. */
  sourceCoverage: number;
  targetCoverage: number;
  midpointCoverage: number;
}

export interface ActiveTransition extends TransitionEvaluation {
  id: string;
  from: number;
  to: number;
}

export interface StorySnapshot {
  chapterIndex: number;
  chapterId: string;
  transition: ActiveTransition | null;
  overallProgress: number;
}

type Point = readonly [number, number];
type Stages = readonly [Point, Point, Point, Point, Point];

interface TransitionDesign {
  occluder: OccluderKind;
  anchors: Stages;
  midpoint?: true;
}

/**
 * Stage positions describe the amber editorial guide at 0/25/50/75/100%.
 * They deliberately differ per boundary. Renderers may project a real image
 * landmark into this guide, but must not describe these as measured image UVs.
 */
const DESIGNS: readonly TransitionDesign[] = [
  { occluder: 'window', anchors: [[.30, .64], [.34, .61], [.44, .54], [.53, .50], [.58, .46]] },
  { occluder: 'door', anchors: [[.58, .46], [.62, .44], [.66, .40], [.68, .38], [.70, .35]] },
  { occluder: 'glass', anchors: [[.68, .62], [.62, .61], [.54, .60], [.46, .61], [.40, .64]] },
  { occluder: 'threshold', anchors: [[.38, .68], [.42, .71], [.50, .76], [.55, .78], [.58, .80]] },
  { occluder: 'curb', anchors: [[.52, .70], [.52, .64], [.52, .58], [.52, .54], [.52, .50]] },
  { occluder: 'pipe', anchors: [[.72, .50], [.64, .50], [.50, .50], [.40, .52], [.34, .55]], midpoint: true },
  { occluder: 'corner', anchors: [[.34, .74], [.40, .69], [.50, .62], [.61, .55], [.65, .51]] },
  { occluder: 'canopy', anchors: [[.65, .28], [.60, .26], [.50, .26], [.40, .28], [.35, .30]] },
  { occluder: 'column', anchors: [[.45, .78], [.48, .73], [.52, .69], [.56, .64], [.58, .60]] },
  { occluder: 'panes', anchors: [[.66, .46], [.60, .44], [.50, .42], [.40, .43], [.30, .45]] },
];

export function clamp(value: number, min = 0, max = 1): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** Bounded cubic interpolation; a collapsed interval is an immediate step. */
export function smoothstep(start: number, end: number, value: number): number {
  if (!Number.isFinite(value)) return value === Infinity ? 1 : 0;
  if (end <= start) return value < start ? 0 : 1;
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}

function finite(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

function stagePoint(stages: Stages, progress: number): Point {
  if (progress >= 1) return stages[4];
  const interval = Math.min(3, Math.floor(progress * 4));
  const t = smoothstep(0, 1, progress * 4 - interval);
  const from = stages[interval];
  const to = stages[interval + 1];
  return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t];
}

/**
 * Evaluate one zero-based boundary (0 = CH-01 to CH-02, 9 = CH-10 to CH-11).
 * The same arguments always return the same composition, in either direction.
 */
export function evaluateTransition(
  index: number,
  progress: number,
  mode: MotionMode = 'full',
): TransitionEvaluation {
  const safeIndex = clamp(Math.trunc(finite(index)), 0, DESIGNS.length - 1);
  const design = DESIGNS[safeIndex];
  const p = clamp(progress);
  const reduced = mode !== 'full';
  const visualProgress = reduced ? (p < .5 ? 0 : 1) : p;
  const [anchorX, anchorY] = stagePoint(design.anchors, visualProgress);

  let sourceCoverage = 1 - visualProgress;
  let targetCoverage = visualProgress;
  let midpointCoverage = 0;
  let phase: TransitionPhase = reduced
    ? (visualProgress === 0 ? 'static-source' : 'static-target')
    : 'source-to-target';
  let phaseProgress = visualProgress;

  if (design.midpoint && !reduced) {
    if (p <= .5) {
      phase = 'source-to-midpoint';
      phaseProgress = p * 2;
      sourceCoverage = 1 - phaseProgress;
      midpointCoverage = phaseProgress;
      targetCoverage = 0;
    } else {
      phase = 'midpoint-to-target';
      phaseProgress = (p - .5) * 2;
      sourceCoverage = 0;
      midpointCoverage = 1 - phaseProgress;
      targetCoverage = phaseProgress;
    }
  }

  return {
    progress: p,
    sourceVisible: sourceCoverage > 0,
    targetVisible: targetCoverage > 0,
    midpointVisible: midpointCoverage > 0,
    sourceTextOpacity: reduced ? 1 - visualProgress : 1 - smoothstep(.08, .25, p),
    targetTextOpacity: reduced ? visualProgress : smoothstep(.80, .96, p),
    anchorX,
    anchorY,
    reveal: visualProgress,
    occluder: design.occluder,
    phase,
    phaseProgress,
    sourceCoverage,
    targetCoverage,
    midpointCoverage,
  };
}

/**
 * Evaluate document geometry supplied by the renderer.
 *
 * A chapter is normally selected at a reading line 42% down the viewport.
 * During a transition, its explicit source/target indices override that line;
 * authority passes to the target at p >= 0.5. Asset readiness and quality never
 * change narrative identity. They are accepted as inputs so a rendering policy
 * can use the same input object without introducing a second state authority.
 */
export function evaluateStory(input: StoryInput): StorySnapshot {
  const scrollY = Math.max(0, finite(input.scrollY));
  const height = Math.max(0, finite(input.viewport.height));
  const validChapters = input.chapters
    .map((chapter, index) => ({ ...chapter, index }))
    .filter(chapter => Number.isFinite(chapter.top)
      && Number.isFinite(chapter.bottom)
      && chapter.bottom >= chapter.top);

  if (validChapters.length === 0) {
    return { chapterIndex: -1, chapterId: '', transition: null, overallProgress: 0 };
  }

  const firstChapter = validChapters.reduce((first, chapter) => chapter.top < first.top ? chapter : first);
  const readingLine = scrollY + height * .42;
  let chapter = firstChapter;
  for (const candidate of validChapters) {
    if (candidate.top <= readingLine && candidate.top >= chapter.top) chapter = candidate;
  }

  const documentBottom = Math.max(...validChapters.map(item => item.bottom));
  const maxScroll = Math.max(1, documentBottom - height);
  const overallProgress = clamp(scrollY / maxScroll);
  const validIndices = new Set(validChapters.map(item => item.index));

  // A new array is sorted: neither input metrics nor their ordering is mutated.
  // If measured intervals overlap, the later starting boundary owns that point.
  const active = input.transitions
    .filter(metric => Number.isFinite(metric.start)
      && Number.isFinite(metric.end)
      && metric.end > metric.start
      && Number.isInteger(metric.from)
      && Number.isInteger(metric.to)
      && validIndices.has(metric.from)
      && validIndices.has(metric.to)
      && scrollY >= metric.start
      && scrollY <= metric.end)
    .sort((a, b) => b.start - a.start || b.end - a.end || a.id.localeCompare(b.id))[0];

  if (!active) {
    return { chapterIndex: chapter.index, chapterId: chapter.id, transition: null, overallProgress };
  }

  const progress = clamp((scrollY - active.start) / (active.end - active.start));
  const evaluation = evaluateTransition(active.from, progress, input.mode);
  const chapterIndex = progress < .5 ? active.from : active.to;

  return {
    chapterIndex,
    chapterId: input.chapters[chapterIndex].id,
    transition: { id: active.id, from: active.from, to: active.to, ...evaluation },
    overallProgress,
  };
}
