import type { ChapterMetric, TransitionMetric } from './story.ts';

export interface ReadingAnchor {
  kind: 'chapter' | 'transition';
  id: string;
  from?: string;
  to?: string;
  fraction: number;
  top: number;
  height: number;
}

export interface ReadingPosition {
  y: number;
  viewportHeight: number;
  anchor: ReadingAnchor | null;
}

interface ReadingMetrics {
  viewportHeight: number;
  chapters: readonly ChapterMetric[];
  transitions: readonly TransitionMetric[];
}

const validMetric = (metric: { top: number; height: number }) =>
  Number.isFinite(metric.top) && Number.isFinite(metric.height) && metric.height > 0;

/** Capture fresh layout, never a possibly older rendered chapter label. */
export function captureReadingPosition(input: ReadingMetrics & { scrollY: number }): ReadingPosition {
  const y = Number.isFinite(input.scrollY) ? Math.max(0, input.scrollY) : 0;
  const viewportHeight = Number.isFinite(input.viewportHeight) ? Math.max(1, input.viewportHeight) : 1;
  const probe = y + viewportHeight / 2;
  const contains = (metric: { top: number; height: number }) => validMetric(metric) && probe >= metric.top && probe <= metric.top + metric.height;
  const transition = input.transitions.find(metric => {
    if (!validMetric(metric)) return false;
    const index = input.chapters.findIndex(chapter => chapter.id === metric.from);
    const source = input.chapters[index], target = input.chapters[index + 1];
    if (!source || !target || target.id !== metric.to) return false;
    // Include the sticky scene's before/after holds between reading sections.
    // A native rounded endpoint may be a fraction of a pixel past the marker.
    return contains(metric) || (probe >= source.top + source.height && probe <= target.top);
  });
  if (transition) return {
    y, viewportHeight,
    anchor: { kind: 'transition', id: transition.id ?? `${transition.from}:${transition.to}`, from: transition.from, to: transition.to,
      fraction: (probe - transition.top) / transition.height, top: transition.top, height: transition.height },
  };
  const chapter = input.chapters.find(contains);
  return { y, viewportHeight, anchor: chapter
    ? { kind: 'chapter', id: chapter.id, fraction: (probe - chapter.top) / chapter.height, top: chapter.top, height: chapter.height }
    : null };
}

/** Validate serialized history state, including the earlier raw-Y-only format. */
export function readReadingPosition(value: unknown): ReadingPosition | null {
  if (!value || typeof value !== 'object' || !('y' in value) || typeof value.y !== 'number' || !Number.isFinite(value.y) || value.y < 0) return null;
  const viewportHeight = 'viewportHeight' in value && typeof value.viewportHeight === 'number' && Number.isFinite(value.viewportHeight) && value.viewportHeight > 0 ? value.viewportHeight : 0;
  let anchor: ReadingAnchor | null = null;
  const candidate = 'anchor' in value ? value.anchor : null;
  if (candidate && typeof candidate === 'object' && 'kind' in candidate && (candidate.kind === 'chapter' || candidate.kind === 'transition') &&
      'id' in candidate && typeof candidate.id === 'string' && 'fraction' in candidate && typeof candidate.fraction === 'number' && Number.isFinite(candidate.fraction) && Math.abs(candidate.fraction) <= 100 &&
      'top' in candidate && typeof candidate.top === 'number' && Number.isFinite(candidate.top) &&
      'height' in candidate && typeof candidate.height === 'number' && Number.isFinite(candidate.height) && candidate.height > 0) {
    if (candidate.kind === 'chapter' && candidate.fraction >= 0 && candidate.fraction <= 1) anchor = { kind: 'chapter', id: candidate.id, fraction: candidate.fraction, top: candidate.top, height: candidate.height };
    else if (candidate.kind === 'transition' && 'from' in candidate && typeof candidate.from === 'string' && 'to' in candidate && typeof candidate.to === 'string') {
      anchor = { kind: 'transition', id: candidate.id, from: candidate.from, to: candidate.to, fraction: candidate.fraction, top: candidate.top, height: candidate.height };
    }
  }
  return { y: value.y, viewportHeight, anchor };
}

/** Resolve the same reading fraction against the current measured layout. */
export function restoreReadingPosition(saved: ReadingPosition, metrics: ReadingMetrics): number {
  const anchor = saved.anchor;
  if (!anchor || saved.y === 0) return saved.y;
  const metric = anchor.kind === 'transition'
    ? metrics.transitions.find(item => item.from === anchor.from && item.to === anchor.to && (item.id ?? `${item.from}:${item.to}`) === anchor.id)
    : metrics.chapters.find(item => item.id === anchor.id);
  if (!metric || !validMetric(metric)) return saved.y;
  const viewportHeight = Number.isFinite(metrics.viewportHeight) ? Math.max(1, metrics.viewportHeight) : 1;
  // Preserve the exact native offset when the reading geometry did not change.
  if (Math.abs(metric.top - anchor.top) < .01 && Math.abs(metric.height - anchor.height) < .01 && Math.abs(viewportHeight - saved.viewportHeight) < .01) return saved.y;
  const desired = metric.top + metric.height * anchor.fraction - viewportHeight / 2;
  if (anchor.kind !== 'transition' || anchor.fraction < 0 || anchor.fraction > 1) return Math.max(0, desired);
  // Whole CSS pixel scroll quantization must not flip ownership at a midpoint
  // or place an endpoint just outside its measured transition window.
  let lower = Math.ceil(metric.top - viewportHeight / 2);
  let upper = Math.floor(metric.top + metric.height - viewportHeight / 2);
  const midpoint = metric.top + metric.height / 2 - viewportHeight / 2;
  if (anchor.fraction < .5) upper = Math.min(upper, Math.ceil(midpoint) - 1);
  else lower = Math.max(lower, Math.ceil(midpoint));
  return Math.max(0, lower <= upper ? Math.min(upper, Math.max(lower, Math.round(desired))) : desired);
}
