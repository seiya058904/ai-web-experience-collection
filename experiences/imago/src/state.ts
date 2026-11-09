export type MotionMode = 'auto' | 'reduced' | 'full';

export interface ObservationState {
  eggZoom: boolean;
  larvaStage: 'hatchling' | 'third';
  instar: number;
  pupationStage: 'j' | 'forming' | 'pupa';
  developmentView: 'surface' | 'schematic';
  observationStage: 'early' | 'middle' | 'late';
  comparison: boolean;
  reveal: number;
  emergenceStep: number;
  wingStage: 'folded' | 'expanding' | 'open';
  wingDetail: 'whole' | 'forewing' | 'hindwing' | 'body';
  departed: boolean;
  motion: MotionMode;
}

export const OBSERVATION_STORAGE_KEY = 'imago:observations:v1';

export const DEFAULT_OBSERVATION_STATE: Readonly<ObservationState> = Object.freeze({
  eggZoom: false,
  larvaStage: 'third',
  instar: 5,
  pupationStage: 'j',
  developmentView: 'surface',
  observationStage: 'middle',
  comparison: false,
  reveal: 50,
  emergenceStep: 0,
  wingStage: 'open',
  wingDetail: 'whole',
  departed: false,
  motion: 'auto',
});

function choice<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && allowed.includes(value as T) ? value as T : fallback;
}

function numberInRange(value: unknown, minimum: number, maximum: number, fallback: number, integer = false): number {
  return typeof value === 'number' && Number.isFinite(value)
    && value >= minimum && value <= maximum && (!integer || Number.isInteger(value))
    ? value : fallback;
}

/** Whitelist stored fields; invalid values retain the supplied valid baseline. */
export function sanitizeObservationState(
  input: unknown,
  fallback: Readonly<ObservationState> = DEFAULT_OBSERVATION_STATE,
): ObservationState {
  const value = input !== null && typeof input === 'object' && !Array.isArray(input)
    ? input as Record<string, unknown> : {};
  return {
    eggZoom: typeof value.eggZoom === 'boolean' ? value.eggZoom : fallback.eggZoom,
    larvaStage: choice(value.larvaStage, ['hatchling', 'third'], fallback.larvaStage),
    instar: numberInRange(value.instar, 1, 5, fallback.instar, true),
    pupationStage: choice(value.pupationStage, ['j', 'forming', 'pupa'], fallback.pupationStage),
    developmentView: choice(value.developmentView, ['surface', 'schematic'], fallback.developmentView),
    observationStage: choice(value.observationStage, ['early', 'middle', 'late'], fallback.observationStage),
    comparison: typeof value.comparison === 'boolean' ? value.comparison : fallback.comparison,
    reveal: numberInRange(value.reveal, 0, 100, fallback.reveal),
    emergenceStep: numberInRange(value.emergenceStep, 0, 3, fallback.emergenceStep, true),
    wingStage: choice(value.wingStage, ['folded', 'expanding', 'open'], fallback.wingStage),
    wingDetail: choice(value.wingDetail, ['whole', 'forewing', 'hindwing', 'body'], fallback.wingDetail),
    departed: typeof value.departed === 'boolean' ? value.departed : fallback.departed,
    motion: choice(value.motion, ['auto', 'reduced', 'full'], fallback.motion),
  };
}

let currentState: ObservationState | undefined;

/** Storage is optional: blocked storage still leaves controls usable for this visit. */
export function readObservationState(): ObservationState {
  if (!currentState) {
    currentState = { ...DEFAULT_OBSERVATION_STATE };
    try {
      if (typeof window !== 'undefined') {
        const raw = window.sessionStorage.getItem(OBSERVATION_STORAGE_KEY);
        if (raw) {
          const saved: unknown = JSON.parse(raw);
          if (saved !== null && typeof saved === 'object' && 'version' in saved && saved.version === 1 && 'state' in saved) {
            currentState = sanitizeObservationState(saved.state);
          }
        }
      }
    } catch {
      // Invalid JSON, unavailable storage, or quota restrictions use the valid in-memory state.
    }
  }
  return { ...currentState };
}

/** Call only for an explicit observation choice, never from a scroll listener. */
export function updateObservationState(patch: Partial<ObservationState>): ObservationState {
  currentState = sanitizeObservationState(patch, readObservationState());
  try {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(OBSERVATION_STORAGE_KEY, JSON.stringify({ version: 1, state: currentState }));
    }
  } catch {
    // The current visit continues with the same state even if persistence is unavailable.
  }
  return { ...currentState };
}

export function resetObservationState(): ObservationState {
  currentState = { ...DEFAULT_OBSERVATION_STATE };
  try {
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(OBSERVATION_STORAGE_KEY);
  } catch {
    // Reset still applies in memory.
  }
  return { ...currentState };
}
