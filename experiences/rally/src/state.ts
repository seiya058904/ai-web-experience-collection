import { branches } from './physics.ts';
import type { ReturnChoice, SpinPreset } from './physics.ts';

export type View = 'A' | 'B';
export type MotionPreference = 'system' | 'reduced';
export const MAIN_RALLY_ID = 'a-to-b-topspin' as const;
/** A single resumed frame may advance at most this many model seconds. */
export const MAX_REPLAY_FRAME_DELTA = 0.1;

export type StoryState = Readonly<{
  comparisonSpinPreset: SpinPreset;
  mainRallyPreset: typeof MAIN_RALLY_ID;
  returnChoice: ReturnChoice;
  /** Overall story position, normalized to [0, 1]. */
  storyProgress: number;
  /** Elapsed model seconds within the selected return branch. */
  replayTime: number;
  playing: boolean;
  view: View;
  motion: MotionPreference;
  sound: boolean;
}>;

/** Durable choices and position only: playback and audio never auto-resume. */
export type StoredStoryState = Readonly<{
  version: 1;
  comparisonSpinPreset: SpinPreset;
  returnChoice: ReturnChoice;
  storyProgress: number;
  replayTime: number;
  view: View;
  motion: MotionPreference;
}>;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));
const validChoice = (value: unknown): value is ReturnChoice => value === 'crosscourt' || value === 'line';
const validSpin = (value: unknown): value is SpinPreset => value === 'topspin' || value === 'none';
const finiteOr = (value: unknown, fallback = 0): number => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const freeze = (state: StoryState): StoryState => Object.freeze(state);

function savedRecord(saved: unknown): Record<string, unknown> {
  if (typeof saved === 'string') {
    try { saved = JSON.parse(saved); } catch { return {}; }
  }
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
  const record = saved as Record<string, unknown>;
  // Unversioned partial records are accepted; unknown future schemas are not.
  if (record.version !== undefined && record.version !== 1) return {};
  return record;
}

/** Accept a parsed record or raw localStorage JSON. Invalid fields fall back independently. */
export function createState(saved?: unknown): StoryState {
  const record = savedRecord(saved);
  const returnChoice = validChoice(record.returnChoice) ? record.returnChoice : 'crosscourt';
  return freeze({
    comparisonSpinPreset: validSpin(record.comparisonSpinPreset) ? record.comparisonSpinPreset : 'topspin',
    mainRallyPreset: MAIN_RALLY_ID,
    returnChoice,
    storyProgress: clamp(finiteOr(record.storyProgress), 0, 1),
    replayTime: clamp(finiteOr(record.replayTime), 0, branches[returnChoice].duration),
    playing: false,
    view: record.view === 'B' ? 'B' : 'A',
    motion: record.motion === 'reduced' ? 'reduced' : 'system',
    sound: false,
  });
}

/** The old replay is invalid immediately when the branch actually changes. */
export function chooseReturn(state: StoryState, choice: ReturnChoice): StoryState {
  if (!validChoice(choice) || state.returnChoice === choice) return state;
  return freeze({ ...state, returnChoice: choice, replayTime: 0, playing: false });
}

/** CH-04 owns only its comparison preference; it never writes the main rally. */
export function setComparison(state: StoryState, spin: SpinPreset): StoryState {
  if (!validSpin(spin) || state.comparisonSpinPreset === spin) return state;
  return freeze({ ...state, comparisonSpinPreset: spin });
}

/** An explicit seek pauses playback and clamps to the selected branch's duration. */
export function seekReplay(state: StoryState, time: number): StoryState {
  const replayTime = clamp(Number.isNaN(time) ? 0 : time, 0, branches[state.returnChoice].duration);
  if (replayTime === state.replayTime && !state.playing) return state;
  return freeze({ ...state, replayTime, playing: false });
}

/**
 * Advance only active playback. The caller gates visibility/chapter ownership
 * and resets its RAF timestamp on resume; large gaps are never replayed here.
 * deltaSeconds is already in model time, after any intentional slow-play rate.
 */
export function advanceReplay(state: StoryState, deltaSeconds: number): StoryState {
  if (!state.playing) return state;
  const duration = branches[state.returnChoice].duration;
  if (state.replayTime >= duration) return freeze({ ...state, replayTime: duration, playing: false });
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return state;
  const delta = Math.min(deltaSeconds, MAX_REPLAY_FRAME_DELTA);
  const replayTime = Math.min(duration, state.replayTime + delta);
  return freeze({ ...state, replayTime, playing: replayTime < duration });
}

/** Strip transient/unsafe fields and normalize values before serialization. */
export function persistedState(state: StoryState): StoredStoryState {
  const valid = createState(state);
  return Object.freeze({
    version: 1,
    comparisonSpinPreset: valid.comparisonSpinPreset,
    returnChoice: valid.returnChoice,
    storyProgress: valid.storyProgress,
    replayTime: valid.replayTime,
    view: valid.view,
    motion: valid.motion,
  });
}
