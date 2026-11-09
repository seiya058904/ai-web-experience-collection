/**
 * Pip's durable choice and explicit interactions.
 *
 * Story position is deliberately not stored here: looking back in the story
 * must never undo a repair choice or automatically run a trial.
 */
export type RepairPlan = 'A' | 'B';
export type InspectionFocus = 'wheel' | 'ear' | 'paint';
export type TrialMode = 'before' | 'repaired';
export type TrialStatus = 'idle' | 'running' | 'paused' | 'blocked' | 'complete';

export interface AppState {
  repairPlan: RepairPlan;
  choiceExplicit: boolean;
  inspectionFocus: InspectionFocus;
  trialProgress: number;
  trialMode: TrialMode;
  trialStatus: TrialStatus;
  trialCompleted: boolean;
  compareState: 'before' | 'after';
}

export interface SavedState {
  version: 1;
  repairPlan: RepairPlan;
  choiceExplicit: boolean;
}

export interface RepairView {
  damaged: boolean;
  repaired: boolean;
  mountedWheel: 'original' | 'new';
  fittedSleeve: boolean;
  returnedOriginalWheel: boolean;
}

export const TRIAL_DURATION_MS = 2800;
export const BEFORE_BLOCK_PROGRESS = 0.22;
export const MAX_TRIAL_DELTA_MS = 100;

const isRepairPlan = (value: unknown): value is RepairPlan =>
  value === 'A' || value === 'B';

/** Read only own data properties; ignore inherited values and getters. */
function ownDataValue(record: unknown, key: string): unknown {
  if (record === null || typeof record !== 'object' || Array.isArray(record)) {
    return undefined;
  }

  try {
    const descriptor = Object.getOwnPropertyDescriptor(record, key);
    return descriptor && 'value' in descriptor ? descriptor.value : undefined;
  } catch {
    // A revoked or hostile Proxy is no more useful than invalid saved data.
    return undefined;
  }
}

export function createInitialState(saved?: unknown): AppState {
  const savedPlan = ownDataValue(saved, 'repairPlan');
  const validPlan = isRepairPlan(savedPlan);

  return {
    repairPlan: validPlan ? savedPlan : 'A',
    choiceExplicit: validPlan && ownDataValue(saved, 'choiceExplicit') === true,
    inspectionFocus: 'wheel',
    trialProgress: 0,
    trialMode: 'repaired',
    trialStatus: 'idle',
    trialCompleted: false,
    compareState: 'after',
  };
}

export function serializeSavedState(state: AppState): SavedState {
  return {
    version: 1,
    repairPlan: state.repairPlan,
    choiceExplicit: state.choiceExplicit,
  };
}

/** Reset the demonstration and its result, without touching the repair. */
export function resetTrial(state: AppState): AppState {
  return {
    ...state,
    trialProgress: 0,
    trialMode: 'repaired',
    trialStatus: 'idle',
    trialCompleted: false,
  };
}

export function selectPlan(state: AppState, plan: RepairPlan): AppState {
  if (!isRepairPlan(plan)) return state;

  if (plan === state.repairPlan) {
    return state.choiceExplicit ? state : { ...state, choiceExplicit: true };
  }

  return {
    ...resetTrial(state),
    repairPlan: plan,
    choiceExplicit: true,
  };
}

export function resetPlan(state: AppState): AppState {
  return {
    ...resetTrial(state),
    repairPlan: 'A',
    choiceExplicit: false,
  };
}

/** Start only in response to an explicit control, never a chapter change. */
export function startTrial(
  state: AppState,
  mode: TrialMode,
  reducedMotion = false,
): AppState {
  const repaired = mode === 'repaired';

  return {
    ...state,
    trialMode: mode,
    trialProgress: reducedMotion ? (repaired ? 1 : BEFORE_BLOCK_PROGRESS) : 0,
    trialStatus: reducedMotion ? (repaired ? 'complete' : 'blocked') : 'running',
    trialCompleted: reducedMotion && repaired,
  };
}

export function pauseTrial(state: AppState): AppState {
  return state.trialStatus === 'running'
    ? { ...state, trialStatus: 'paused' }
    : state;
}

/**
 * Advance the visible, active demonstration along a fixed normalized path.
 *
 * Paused playback does not silently resume. A new explicit start is required.
 * The renderer can use the frozen progress to hand off to the next chapter.
 * Large deltas are capped so a suspended frame cannot jump to the end.
 */
export function advanceTrial(
  state: AppState,
  deltaMs: number,
  active: boolean,
  visible: boolean,
): AppState {
  if (state.trialStatus !== 'running') return state;
  if (!active || !visible) return pauseTrial(state);

  const delta = Number.isFinite(deltaMs)
    ? Math.min(MAX_TRIAL_DELTA_MS, Math.max(0, deltaMs))
    : 0;
  if (delta === 0) return state;

  const repaired = state.trialMode === 'repaired';
  const limit = repaired ? 1 : BEFORE_BLOCK_PROGRESS;
  const current = Number.isFinite(state.trialProgress)
    ? Math.min(limit, Math.max(0, state.trialProgress))
    : 0;
  const next = Math.min(limit, current + delta / TRIAL_DURATION_MS);
  const finished = next >= limit - Number.EPSILON * 16;

  return {
    ...state,
    trialProgress: finished ? limit : next,
    trialStatus: finished ? (repaired ? 'complete' : 'blocked') : 'running',
    trialCompleted: finished && repaired,
  };
}

export function setFocus(state: AppState, focus: InspectionFocus): AppState {
  return state.inspectionFocus === focus
    ? state
    : { ...state, inspectionFocus: focus };
}

export function setComparison(
  state: AppState,
  comparison: 'before' | 'after',
): AppState {
  return state.compareState === comparison
    ? state
    : { ...state, compareState: comparison };
}

/**
 * Resolve the physical story state without modifying the saved choice.
 * Chapters 1–5 always depict the original fault, even after choosing B.
 */
export function getRepairView(state: AppState, chapter: number): RepairView {
  const repaired = Number.isFinite(chapter) && chapter >= 6;
  const replacement = repaired && state.repairPlan === 'B';

  return {
    damaged: !repaired,
    repaired,
    mountedWheel: replacement ? 'new' : 'original',
    fittedSleeve: repaired && state.repairPlan === 'A',
    returnedOriginalWheel: replacement,
  };
}
