import { chapters, DEFAULT_OPENING, LIN_NOTE } from './story.ts';

/** Only CH-03 consumes this comparison preference. */
export type LampMode = 'reading' | 'soft' | 'off';

export interface UserState {
  opening: string;
  lamp: LampMode;
  motion: boolean;
}

export const MAX_OPENING_LENGTH = 120;
export const STORAGE_KEY = 'berth.user.v1';

export const defaultState: Readonly<UserState> = Object.freeze({
  opening: DEFAULT_OPENING,
  lamp: 'soft',
  motion: true,
});

/** The small interface makes denied/quota-limited storage testable. */
export interface StateStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * The limit counts code points, but its boundary must be a whole grapheme.
 * Segmenter keeps emoji families, modifiers, flags and combining marks intact.
 */
export function truncateOpening(input: string): string {
  if (Array.from(input).length <= MAX_OPENING_LENGTH) return input;
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  let count = 0;
  let boundary = 0;
  for (const part of segmenter.segment(input)) {
    const length = Array.from(part.segment).length;
    if (count + length > MAX_OPENING_LENGTH) break;
    count += length;
    boundary = part.index + part.segment.length;
  }
  return input.slice(0, boundary);
}

/** Keep text as text: escaping belongs at the DOM boundary, never in storage. */
export function sanitizeOpening(input: unknown): string {
  if (typeof input !== 'string' || input.trim().length === 0) return DEFAULT_OPENING;
  const bounded = truncateOpening(input);
  return bounded.trim().length === 0 ? DEFAULT_OPENING : bounded;
}

function isLamp(value: unknown): value is LampMode {
  return value === 'reading' || value === 'soft' || value === 'off';
}

function browserStorage(): StateStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function normaliseState(value: Partial<UserState>): UserState {
  return {
    opening: sanitizeOpening(value.opening),
    lamp: isLamp(value.lamp) ? value.lamp : defaultState.lamp,
    motion: typeof value.motion === 'boolean' ? value.motion : defaultState.motion,
  };
}

/**
 * `persisted` means a valid saved state was actually read, not that saving is
 * currently available. A fresh visit or a denied/corrupt store returns false.
 * Valid text is salvaged if another preference is malformed; no write occurs.
 */
export function loadState(storage?: StateStorage | null): { state: UserState; persisted: boolean } {
  const target = storage === undefined ? browserStorage() : storage;
  if (!target) return { state: { ...defaultState }, persisted: false };

  try {
    const raw = target.getItem(STORAGE_KEY);
    if (raw === null) return { state: { ...defaultState }, persisted: false };
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { state: { ...defaultState }, persisted: false };
    }
    const candidate = data as Record<string, unknown>;
    if (candidate.version !== 1) return { state: { ...defaultState }, persisted: false };

    const state = normaliseState(candidate as Partial<UserState>);
    const persisted = typeof candidate.opening === 'string'
      && isLamp(candidate.lamp)
      && typeof candidate.motion === 'boolean'
      && candidate.opening === state.opening;
    return { state, persisted };
  } catch {
    return { state: { ...defaultState }, persisted: false };
  }
}

/** No success is reported until the storage write has returned successfully. */
export function saveState(state: UserState, storage?: StateStorage | null): boolean {
  const target = storage === undefined ? browserStorage() : storage;
  if (!target) return false;
  try {
    target.setItem(STORAGE_KEY, JSON.stringify({ version: 1, ...normaliseState(state) }));
    return true;
  } catch {
    return false;
  }
}

export type PersonLocation = 'doorway' | 'table' | 'corridor' | 'ladder' | 'upper-berth' | 'lower-berth' | 'outside';
export type ObjectLocation = 'canvas-bag' | 'travel-bag' | 'table' | 'ning-hand' | 'lin-hand'
  | 'upper-berth' | 'upper-pillow' | 'lin-worn' | 'outside';

export interface StoryState {
  chapter: number;
  progress: number;
  time: string;
  stage: string;
  lamp: LampMode;
  /** Physical lamp output; zero never asks the UI to hide its reading layer. */
  lightLevel: number;
  lampSource: 'comparison' | 'story';
  lampAim: 'shared' | 'ning';
  daylight: number;
  people: { ning: PersonLocation; lin: PersonLocation };
  objects: {
    manuscript: ObjectLocation;
    ningCard: ObjectLocation;
    linCard: ObjectLocation;
    paperclip: ObjectLocation;
    glasses: ObjectLocation;
  };
  paperclipOn: 'manuscript' | 'none' | 'two-cards';
  linCardFace: 'hidden' | 'blank' | 'down' | 'up';
  /** Null is deliberate: a saved sentence cannot leak into the blank opening. */
  openingText: string | null;
  linNoteText: string | null;
}

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

function smoothstep(start: number, end: number, value: number): number {
  const t = clamp01((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}

/**
 * Deterministic scene evaluator. No onEnter history, storage access, timers,
 * previous frame, or user mutation: jump, reverse, and restore are equivalent.
 * Each distinct card has one physical location in every returned state.
 */
export function resolveStoryState(chapter: number, localProgress: number, userState: UserState): StoryState {
  const n = Number.isFinite(chapter) ? Math.min(10, Math.max(1, Math.floor(chapter))) : 1;
  const p = clamp01(localProgress);
  const state: StoryState = {
    chapter: n,
    progress: p,
    time: chapters[n - 1].time,
    stage: 'arriving',
    lamp: 'soft',
    lightLevel: 0.62,
    lampSource: 'story',
    lampAim: n === 1 || (n === 2 && p < 0.45) ? 'shared' : 'ning',
    daylight: 0,
    people: { ning: 'table', lin: 'lower-berth' },
    objects: {
      manuscript: 'table', ningCard: 'canvas-bag', linCard: 'canvas-bag',
      paperclip: 'table', glasses: 'lin-worn',
    },
    paperclipOn: 'manuscript',
    linCardFace: 'hidden',
    openingText: n >= 7 ? sanitizeOpening(userState.opening) : null,
    linNoteText: null,
  };

  if (n === 1) {
    state.stage = p < 0.45 ? 'arriving' : 'an-empty-opening';
    state.people.ning = p < 0.45 ? 'doorway' : 'table';
  } else if (n === 2) {
    state.stage = p < 0.45 ? 'meeting' : 'sharing-the-light';
  } else if (n === 3) {
    state.stage = p < 0.45 ? 'tomorrows-class' : 'trying-an-opening';
    state.lamp = isLamp(userState.lamp) ? userState.lamp : 'soft';
    state.lightLevel = { reading: 1, soft: 0.58, off: 0 }[state.lamp];
    state.lampSource = 'comparison';
  } else if (n === 4) {
    state.stage = p < 0.65 ? 'a-passing-station' : 'no-bell-tomorrow';
    state.people.ning = p < 0.65 ? 'corridor' : 'doorway';
  } else if (n === 5) {
    state.stage = p < 0.35 ? 'two-first-times' : 'two-blank-cards';
    if (p >= 0.35) {
      state.objects.ningCard = p < 0.55 ? 'ning-hand' : 'table';
      state.objects.linCard = p < 0.55 ? 'ning-hand' : 'lin-hand';
      state.linCardFace = 'blank';
    }
  } else if (n === 6) {
    state.stage = p < 0.35 ? 'putting-things-down' : p < 0.75 ? 'climbing-up' : 'settling-to-sleep';
    state.objects.ningCard = 'table';
    state.objects.linCard = p < 0.25 ? 'lin-hand' : 'table';
    state.objects.glasses = p < 0.25 ? 'lin-worn' : 'table';
    state.linCardFace = p < 0.25 ? 'hidden' : 'down';
    if (p >= 0.45) {
      state.people.ning = p < 0.75 ? 'ladder' : 'upper-berth';
      state.objects.manuscript = p < 0.75 ? 'ning-hand' : 'upper-berth';
      state.objects.ningCard = p < 0.75 ? 'ning-hand' : 'upper-pillow';
    }
    state.lightLevel = 0.62 * (1 - smoothstep(0.35, 0.85, p));
    state.lamp = p >= 0.85 ? 'off' : 'soft';
  } else if (n === 7 || n === 8) {
    state.stage = n === 7 ? (p < 0.4 ? 'a-waking-moment' : 'one-first-line') : 'first-light';
    state.people.ning = 'upper-berth';
    state.objects.manuscript = 'upper-berth';
    state.objects.ningCard = 'upper-pillow';
    state.objects.linCard = 'table';
    state.objects.glasses = 'table';
    state.linCardFace = 'down';
    state.lamp = 'off';
    state.lightLevel = 0;

    if (n === 8) {
      state.daylight = 0.35 + 0.65 * smoothstep(0, 0.6, p);
      if (p >= 0.3 && p < 0.5) {
        state.stage = 'bringing-the-pages-down';
        state.people.ning = 'ladder';
        state.objects.manuscript = 'ning-hand';
        state.objects.ningCard = 'ning-hand';
      } else if (p >= 0.5) {
        state.stage = p < 0.65 ? 'back-at-the-table' : 'a-note-for-morning';
        state.people.ning = 'table';
        state.objects.manuscript = 'table';
        state.objects.ningCard = 'table';
      }
      if (p >= 0.65) {
        state.objects.linCard = p < 0.8 ? 'lin-hand' : 'ning-hand';
        state.linCardFace = 'up';
        state.linNoteText = LIN_NOTE;
      }
    }
  } else if (n === 9) {
    state.stage = p < 0.5 ? 'joining-the-two-cards' : p < 0.75 ? 'clipped-together' : 'packing';
    state.lamp = 'off';
    state.lightLevel = 0;
    state.daylight = 1;
    state.objects.ningCard = p < 0.25 ? 'table' : 'ning-hand';
    state.objects.linCard = p < 0.25 ? 'table' : 'ning-hand';
    state.objects.glasses = 'table';
    state.linCardFace = 'up';
    state.linNoteText = LIN_NOTE;
    if (p >= 0.35 && p < 0.5) {
      state.paperclipOn = 'none';
      state.objects.paperclip = 'ning-hand';
    } else if (p >= 0.5) {
      state.paperclipOn = 'two-cards';
    }
    if (p >= 0.75) {
      state.objects.manuscript = 'canvas-bag';
      state.objects.ningCard = 'canvas-bag';
      state.objects.linCard = 'canvas-bag';
      state.objects.glasses = 'lin-worn';
      state.linCardFace = 'hidden';
    }
  } else {
    state.stage = p < 0.3 ? 'lin-leaves' : p < 0.65 ? 'ning-leaves' : 'an-empty-compartment';
    state.lamp = 'off';
    state.lightLevel = 0;
    state.daylight = 1;
    state.people.ning = p < 0.3 ? 'table' : p < 0.65 ? 'doorway' : 'outside';
    state.people.lin = p < 0.3 ? 'doorway' : 'outside';
    state.objects.manuscript = p < 0.65 ? 'canvas-bag' : 'outside';
    state.objects.ningCard = p < 0.65 ? 'canvas-bag' : 'outside';
    state.objects.linCard = p < 0.65 ? 'canvas-bag' : 'outside';
    state.objects.glasses = p < 0.3 ? 'lin-worn' : 'outside';
    state.paperclipOn = 'two-cards';
    state.linCardFace = 'hidden';
    // A separate keepsake view may recall the cards; the physical table is empty.
    state.linNoteText = LIN_NOTE;
  }

  // The only clip follows its attachment. It cannot remain on the manuscript
  // after being attached to the two cards, or be rendered in both locations.
  if (state.paperclipOn === 'manuscript') state.objects.paperclip = state.objects.manuscript;
  if (state.paperclipOn === 'two-cards') state.objects.paperclip = state.objects.ningCard;
  return state;
}
