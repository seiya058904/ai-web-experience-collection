/**
 * ODDS application state. Rendering and scrolling only read this state.
 * New samples are committed by the explicit actions below, never by playback.
 * The optional seed factory makes transitions deterministic in tests; the UI
 * uses freshSeed when a visitor explicitly requests a new experiment.
 */
import {
  appendExperiment,
  createExperiment,
  freshSeed,
  validateExperiment,
  type Experiment,
} from './engine.ts';

export type LayerCount = 4 | 8 | 12;
export type RightProbability = 0.25 | 0.5 | 0.75;
export type SampleCount = 16 | 64 | 256;
export type ComparisonCount = 16 | 64 | 128;
export type MotionPreference = 'system' | 'reduced';
export type ExperimentPair = [Experiment, Experiment];

export interface AppState {
  version: 1;
  hero: Experiment | null;
  branch: Experiment;
  small: ExperimentPair;
  previousSmall: ExperimentPair | null;
  bias: Experiment;
  previousBias: Experiment | null;
  comparisonN: ComparisonCount;
  personal: Experiment | null;
  previousPersonal: Experiment | null;
  selectedBall: number;
  motion: MotionPreference;
  sound: boolean;
}

export type AppAction =
  | { type: 'hero-drop' }
  | { type: 'branch-draw' }
  | { type: 'small-new' }
  | { type: 'small-undo' }
  | { type: 'bias-run'; p: RightProbability }
  | { type: 'bias-undo' }
  | { type: 'comparison-size'; N: ComparisonCount }
  | { type: 'select-ball'; index: number }
  | { type: 'personal-run'; n: LayerCount; p: RightProbability; N: SampleCount }
  | { type: 'personal-new' }
  | { type: 'personal-undo' }
  | { type: 'personal-next' }
  | { type: 'motion'; value: MotionPreference }
  | { type: 'sound'; enabled: boolean };

/** Saved teaching data, prepared through 256 samples before any scrolling. */
export const teachingRounds: readonly [Experiment, Experiment, Experiment] = [
  createExperiment('odds-teaching-evening-01', 8, 0.5, 256),
  createExperiment('odds-teaching-evening-02', 8, 0.5, 256),
  createExperiment('odds-teaching-evening-03', 8, 0.5, 256),
];

/** This display is explicitly labelled as a demonstration in the interface. */
export const heroDemo = createExperiment('odds-entrance-demo', 8, 0.5, 6);
export const personalDemo = createExperiment('odds-workbench-demo', 8, 0.5, 64);

const MAX_SAMPLES = 10_000;
const MAX_SAVED_LENGTH = 16_000_000;
const validLayers = (value: unknown): value is LayerCount => value === 4 || value === 8 || value === 12;
const validProbability = (value: unknown): value is RightProbability => value === 0.25 || value === 0.5 || value === 0.75;
const validSamples = (value: unknown): value is SampleCount => value === 16 || value === 64 || value === 256;
const validComparison = (value: unknown): value is ComparisonCount => value === 16 || value === 64 || value === 128;
const validMotion = (value: unknown): value is MotionPreference => value === 'system' || value === 'reduced';

export function initialState(): AppState {
  return {
    version: 1,
    hero: null,
    branch: createExperiment('odds-branch-demo', 1, 0.5, 4),
    small: [
      createExperiment('odds-small-demo-01', 8, 0.5, 16),
      createExperiment('odds-small-demo-02', 8, 0.5, 16),
    ],
    previousSmall: null,
    bias: createExperiment('odds-bias-demo', 8, 0.5, 64),
    previousBias: null,
    comparisonN: 128,
    personal: null,
    previousPersonal: null,
    selectedBall: 0,
    motion: 'system',
    sound: false,
  };
}

function isHero(value: unknown): value is Experiment {
  return validateExperiment(value) && value.n === 8 && value.p === 0.5 && value.N >= 1;
}
function isBranch(value: unknown): value is Experiment {
  return validateExperiment(value) && value.n === 1 && value.p === 0.5 && value.N === 4;
}
function isSmallPair(value: unknown): value is ExperimentPair {
  return Array.isArray(value) && value.length === 2 && value.every(round =>
    validateExperiment(round) && round.n === 8 && round.p === 0.5 && round.N === 16,
  );
}
function isBias(value: unknown): value is Experiment {
  return validateExperiment(value) && value.n === 8 && validProbability(value.p) && value.N === 64;
}
function isPersonal(value: unknown): value is Experiment {
  return validateExperiment(value) && validLayers(value.n) && validProbability(value.p) && value.N >= 16;
}

/**
 * Restore only a complete, valid state. Corrupt saved data never gets repaired
 * into invented personal results. Unknown extra fields are discarded.
 */
export function restoreState(raw: string | null): AppState {
  if (typeof raw !== 'string' || raw.length > MAX_SAVED_LENGTH) return initialState();
  try {
    const value: unknown = JSON.parse(raw);
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return initialState();
    const candidate = value as Record<string, unknown>;
    if (
      candidate.version !== 1 ||
      !(candidate.hero === null || isHero(candidate.hero)) ||
      !isBranch(candidate.branch) ||
      !isSmallPair(candidate.small) ||
      !(candidate.previousSmall === null || isSmallPair(candidate.previousSmall)) ||
      !isBias(candidate.bias) ||
      !(candidate.previousBias === null || isBias(candidate.previousBias)) ||
      !validComparison(candidate.comparisonN) ||
      !(candidate.personal === null || isPersonal(candidate.personal)) ||
      !(candidate.previousPersonal === null || isPersonal(candidate.previousPersonal)) ||
      !Number.isInteger(candidate.selectedBall) ||
      (candidate.selectedBall as number) < 0 || (candidate.selectedBall as number) > 255 ||
      !validMotion(candidate.motion) || typeof candidate.sound !== 'boolean'
    ) return initialState();

    return {
      version: 1,
      hero: candidate.hero as Experiment | null,
      branch: candidate.branch,
      small: candidate.small,
      previousSmall: candidate.previousSmall as ExperimentPair | null,
      bias: candidate.bias,
      previousBias: candidate.previousBias as Experiment | null,
      comparisonN: candidate.comparisonN,
      personal: candidate.personal as Experiment | null,
      previousPersonal: candidate.previousPersonal as Experiment | null,
      selectedBall: candidate.selectedBall as number,
      motion: candidate.motion,
      sound: candidate.sound,
    };
  } catch {
    return initialState();
  }
}

export function serializeState(state: AppState): string {
  return JSON.stringify(state);
}

/** Reading a demonstration never turns it into a personal experiment. */
export function currentPersonal(state: AppState): Experiment {
  return state.personal ?? personalDemo;
}

export function reduceState(
  state: AppState,
  action: AppAction,
  seedFactory: () => string = freshSeed,
): AppState {
  switch (action.type) {
    case 'hero-drop':
      if (state.hero && state.hero.N >= MAX_SAMPLES) return state;
      return { ...state, hero: state.hero ? appendExperiment(state.hero) : createExperiment(seedFactory(), 8, 0.5, 1) };
    case 'branch-draw':
      return { ...state, branch: createExperiment(seedFactory(), 1, 0.5, 4) };
    case 'small-new':
      return {
        ...state,
        previousSmall: state.small,
        small: [createExperiment(seedFactory(), 8, 0.5, 16), createExperiment(seedFactory(), 8, 0.5, 16)],
      };
    case 'small-undo':
      return state.previousSmall ? { ...state, small: state.previousSmall, previousSmall: state.small } : state;
    case 'bias-run':
      if (!validProbability(action.p)) return state;
      return { ...state, previousBias: state.bias, bias: createExperiment(seedFactory(), 8, action.p, 64) };
    case 'bias-undo':
      return state.previousBias ? { ...state, bias: state.previousBias, previousBias: state.bias } : state;
    case 'comparison-size':
      return validComparison(action.N) && action.N !== state.comparisonN ? { ...state, comparisonN: action.N } : state;
    case 'select-ball':
      return Number.isInteger(action.index) && action.index >= 0 && action.index <= 255 && action.index !== state.selectedBall
        ? { ...state, selectedBall: action.index } : state;
    case 'personal-run':
      if (!validLayers(action.n) || !validProbability(action.p) || !validSamples(action.N)) return state;
      return {
        ...state,
        previousPersonal: state.personal,
        personal: createExperiment(seedFactory(), action.n, action.p, action.N),
      };
    case 'personal-new': {
      const current = currentPersonal(state);
      return {
        ...state,
        previousPersonal: state.personal,
        personal: createExperiment(seedFactory(), current.n, current.p, current.N),
      };
    }
    case 'personal-undo':
      return state.previousPersonal ? { ...state, personal: state.previousPersonal, previousPersonal: state.personal } : state;
    case 'personal-next': {
      const current = currentPersonal(state);
      if (current.N >= MAX_SAMPLES) return state;
      return { ...state, previousPersonal: state.personal, personal: appendExperiment(current) };
    }
    case 'motion':
      return validMotion(action.value) && action.value !== state.motion ? { ...state, motion: action.value } : state;
    case 'sound':
      return typeof action.enabled === 'boolean' && action.enabled !== state.sound ? { ...state, sound: action.enabled } : state;
    default:
      return state;
  }
}
