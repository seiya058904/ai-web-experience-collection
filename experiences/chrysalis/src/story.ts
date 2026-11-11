import { clampProgress, evaluateTransition, transitions as transitionDefinitions } from './transitions.ts';
import type { TransitionSnapshot } from './transitions.ts';

export interface ChapterMetric {
  id: string;
  top: number;
  height: number;
}

export interface TransitionMetric {
  id?: string;
  from: string;
  to: string;
  top: number;
  height: number;
}

export interface StoryInput {
  scrollY: number;
  viewportHeight: number;
  /** Optional for non-rendering callers; omitted/invalid widths use desktop framing. */
  viewportWidth?: number;
  chapters: readonly ChapterMetric[];
  transitions?: readonly TransitionMetric[];
  reducedMotion?: boolean;
  selectedModes?: Readonly<Record<string, string | number | boolean>>;
  assetsReady?: Readonly<Record<string, boolean>>;
}

export interface StorySnapshot {
  scrollY: number;
  probeY: number;
  progress: number;
  activeChapter: number;
  chapterId: string | null;
  localProgress: number;
  transition: TransitionSnapshot | null;
  reducedMotion: boolean;
  /** Matches the production portrait composition breakpoint, max-width: 700px. */
  mobile: boolean;
  selection: string | number | boolean | null;
  /** Stable scene-and-mode identity; compare before applying asynchronous results. */
  assetToken: string;
  needsFallback: boolean;
}

function finite(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

function normalizedMetric<T extends { top: number; height: number }>(metric: T): T {
  return { ...metric, top: finite(metric.top), height: Math.max(1, finite(metric.height, 1)) };
}

/**
 * Optional defaults for a continuous document. Explicit measured transition
 * rectangles are preferred when the renderer supplies dedicated bridge scenes.
 */
export function deriveTransitionMetrics(chapters: readonly ChapterMetric[], viewportHeight: number): TransitionMetric[] {
  const span = Math.max(1, finite(viewportHeight, 1) * 0.45);
  return chapters.slice(1).map((chapter, index) => {
    const previous = normalizedMetric(chapters[index]!);
    const next = normalizedMetric(chapter);
    const boundary = next.top;
    const height = Math.min(span, previous.height * 0.45, next.height * 0.45);
    return {
      id: transitionDefinitions[index]?.id,
      from: previous.id, to: next.id,
      top: boundary - height * 0.5, height,
    };
  });
}

/**
 * The viewport center is the reading probe. The caller measures rectangles
 * after layout and feeds the actual scroll position from the sole Lenis/RAF
 * clock. There are no clocks, event counters, pending promises, or DOM reads here.
 */
export function evaluateStory(input: StoryInput): StorySnapshot {
  const chapters = input.chapters.map(normalizedMetric);
  const viewportHeight = Math.max(1, finite(input.viewportHeight, 1));
  const last = chapters.at(-1);
  const documentEnd = last ? last.top + last.height : 0;
  const maximumScroll = Math.max(0, documentEnd - viewportHeight);
  const scrollY = input.scrollY === Infinity ? maximumScroll : Math.max(0, finite(input.scrollY));
  const probeY = scrollY + viewportHeight * 0.5;
  const reducedMotion = Boolean(input.reducedMotion);
  const mobile = typeof input.viewportWidth === 'number'
    && Number.isFinite(input.viewportWidth) && input.viewportWidth > 0 && input.viewportWidth <= 700;

  if (chapters.length === 0) {
    return {
      scrollY, probeY, progress: 0, activeChapter: -1, chapterId: null,
      localProgress: 0, transition: null, reducedMotion, mobile, selection: null,
      assetToken: 'empty', needsFallback: false,
    };
  }

  let activeChapter = 0;
  for (let index = 0; index < chapters.length; index += 1) {
    if (probeY >= chapters[index]!.top) activeChapter = index;
  }

  const transitionMetrics = input.transitions ?? deriveTransitionMetrics(chapters, viewportHeight);
  let transition: TransitionSnapshot | null = null;
  for (const rawMetric of transitionMetrics) {
    const metric = normalizedMetric(rawMetric);
    const definitionIndex = transitionDefinitions.findIndex((item) => item.from === metric.from && item.to === metric.to);
    if (definitionIndex < 0) continue;
    // The target keeps ownership through the bridge's final hold, including a
    // native rounded endpoint just beyond the marker. Falling back to section
    // tops here would incorrectly return ownership to the previous chapter.
    const targetIndex = chapters.findIndex(item => item.id === metric.to);
    if (probeY >= metric.top + metric.height / 2 && targetIndex >= 0) activeChapter = Math.max(activeChapter, targetIndex);
    if (probeY < metric.top || probeY > metric.top + metric.height) continue;
    transition = evaluateTransition(definitionIndex, (probeY - metric.top) / metric.height, reducedMotion, mobile);
    const owner = transition.progress < 0.5 ? metric.from : metric.to;
    const ownerIndex = chapters.findIndex((item) => item.id === owner);
    if (ownerIndex >= 0) activeChapter = ownerIndex;
    break;
  }

  const active = chapters[activeChapter]!;
  const selection = input.selectedModes?.[active.id] ?? null;
  return {
    scrollY, probeY,
    progress: maximumScroll > 0 ? clampProgress(scrollY / maximumScroll) : 0,
    activeChapter, chapterId: active.id,
    localProgress: clampProgress((probeY - active.top) / active.height),
    transition, reducedMotion, mobile, selection,
    assetToken: `${active.id}:${selection === null ? 'default' : String(selection)}`,
    needsFallback: input.assetsReady?.[active.id] === false,
  };
}
