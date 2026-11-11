import { PIECE_IDS, type PieceId } from './fragments.ts';

export type MotionMode = 'on' | 'reduced';
export interface ChapterMeasure { top: number; height: number }
export interface StorySnapshot {
  scrollY: number;
  viewport: { width: number; height: number };
  chapters: readonly ChapterMeasure[];
  selectedMode?: MotionMode;
  assetsReady?: readonly boolean[];
}
export interface StoryEvaluation {
  activeIndex: number;
  chapterProgress: number;
  transition: { index: number; from: number; to: number; progress: number; stage: number } | null;
  storyProgress: number;
  reduced: boolean;
  assetReady: boolean;
}
export const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
export const smoothstep = (value: number) => { const p = clamp01(value); return p * p * (3 - 2 * p); };

/** Pure position evaluation: reverse, history and direct midpoint entry are identical. */
export function evaluateStory(snapshot: StorySnapshot): StoryEvaluation {
  const { chapters } = snapshot;
  const scrollY = Math.max(0, Number.isFinite(snapshot.scrollY) ? snapshot.scrollY : 0);
  const vh = Math.max(1, snapshot.viewport.height);
  const last = chapters.at(-1);
  const total = last ? Math.max(1, last.top + last.height - vh) : 1;
  let activeIndex = 0;
  for (let index = 1; index < chapters.length; index++) {
    if (scrollY + vh * .5 >= chapters[index].top) activeIndex = index;
  }
  const current = chapters[activeIndex] ?? { top: 0, height: vh };
  let transition: StoryEvaluation['transition'] = null;
  for (let index = 0; index < chapters.length - 1; index++) {
    const end = chapters[index + 1].top;
    const start = end - vh;
    if (scrollY >= start && scrollY <= end) {
      const progress = clamp01((scrollY - start) / vh);
      transition = { index, from: index, to: index + 1, progress, stage: Math.min(4, Math.floor(progress * 4)) };
      break;
    }
  }
  return {
    activeIndex,
    chapterProgress: clamp01((scrollY - current.top) / Math.max(1, current.height - vh)),
    transition,
    storyProgress: clamp01(scrollY / total),
    reduced: snapshot.selectedMode === 'reduced',
    // Readiness affects rendering quality, never narrative identity.
    assetReady: snapshot.assetsReady?.[activeIndex] ?? false,
  };
}

export interface StoryMemory {
  version: 1;
  found: PieceId[];
  placed: PieceId[];
  wheelSteady: boolean;
  shadeLifted: boolean;
  marketRepaired: boolean;
  tracedRoute: boolean;
  seamsVisible: boolean;
  sunLifted: boolean;
  daylight: boolean;
}
export const initialStoryMemory = (): StoryMemory => ({
  version: 1, found: [], placed: [], wheelSteady: false, shadeLifted: false,
  marketRepaired: false, tracedRoute: false, seamsVisible: true, sunLifted: false, daylight: true,
});

/** Local state is untrusted and optional; a broken/old save never blocks the tale. */
export function sanitizeStoryMemory(value: unknown): StoryMemory {
  const fresh = initialStoryMemory();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fresh;
  const object = value as Record<string, unknown>;
  if (object.version !== 1) return fresh;
  const pieceList = (candidate: unknown): PieceId[] => Array.isArray(candidate)
    ? PIECE_IDS.filter(id => candidate.includes(id)) : [];
  fresh.found = pieceList(object.found);
  fresh.placed = pieceList(object.placed);
  for (const key of ['wheelSteady', 'shadeLifted', 'marketRepaired', 'tracedRoute', 'seamsVisible', 'sunLifted', 'daylight'] as const) {
    if (typeof object[key] === 'boolean') fresh[key] = object[key];
  }
  // A recovered completed discovery must agree with the visible inventory.
  // Resetting a scene may keep a discovery, and trying the repair after a
  // chapter skip may place pieces independently of discovery progress.
  const discovered = new Set(fresh.found);
  if (fresh.marketRepaired) discovered.add('A');
  if (fresh.wheelSteady) discovered.add('B');
  if (fresh.shadeLifted) discovered.add('C');
  fresh.found = PIECE_IDS.filter(id => discovered.has(id));
  if (fresh.placed.length !== 3) fresh.sunLifted = false;
  return fresh;
}
