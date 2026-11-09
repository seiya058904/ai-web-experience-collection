/**
 * SILLAGE's state is a visual composition, never a fragrance formula.
 *
 * Personal choices are independent from temporary chapter demonstrations.
 * This module has no side effects and never reads browser globals.
 */
export type Shares = [number, number, number];
export type ComponentIndex = 0 | 1 | 2;
export type Phase = 'arrival' | 'unfolding' | 'afterglow';
export type Distance = 'near' | 'middle' | 'far';
export type MemoryChoice = 'window' | 'note' | null;

export interface PersonalState {
  shares: Shares;
  title: string;
  memory: MemoryChoice;
  /** A memory choice must never overwrite a title the visitor has written. */
  titleEdited: boolean;
}

export interface DemoState {
  missing: ComponentIndex | null;
  phase: Phase;
  distance: Distance;
  together: boolean;
}

/** Inject window.localStorage when available; private/blocked storage is safe. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const STATE_VERSION = 1;
export const STORAGE_KEY = 'sillage:personal:v1';
export const TITLE_LIMIT = 64;
export const DEFAULT_TITLE = 'After the Open Window';
export const DEFAULT_SHARES: Readonly<Shares> = Object.freeze([45, 20, 35]);

export const PRESETS: ReadonlyArray<{
  id: string;
  name: string;
  shares: Readonly<Shares>;
}> = Object.freeze([
  Object.freeze({ id: 'daybreak', name: 'Daybreak', shares: Object.freeze([65, 15, 20]) as Readonly<Shares> }),
  Object.freeze({ id: 'undertone', name: 'Undertone', shares: Object.freeze([25, 45, 30]) as Readonly<Shares> }),
  Object.freeze({ id: 'last-light', name: 'Last light', shares: Object.freeze([20, 15, 65]) as Readonly<Shares> }),
]);

export const PHASES: ReadonlyArray<{ id: Phase; label: string }> = Object.freeze([
  { id: 'arrival', label: 'Arrival' },
  { id: 'unfolding', label: 'Unfolding' },
  { id: 'afterglow', label: 'Trace' },
]);

export const MEMORY_TITLES = Object.freeze({
  window: 'The New Window',
  note: 'The Unsent Note',
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const copyShares = (shares: Readonly<Shares>): Shares => [shares[0], shares[1], shares[2]];

/** Repair external data into integer shares totaling exactly 100. */
export function normalizeShares(input: unknown): Shares {
  if (!Array.isArray(input) || input.length !== 3 ||
      !input.every(value => typeof value === 'number' && Number.isFinite(value))) {
    return copyShares(DEFAULT_SHARES);
  }

  const weights = input.map(value => Math.max(0, Math.min(100, value))) as Shares;
  const sum = weights[0] + weights[1] + weights[2];
  if (sum === 0) return copyShares(DEFAULT_SHARES);
  // Already-valid integers must be an identity operation. Dividing first can
  // otherwise turn 29 into 28.999999999999996 and silently move a whole unit.
  if (sum === 100 && weights.every(Number.isInteger)) return copyShares(weights);
  const result = weights.map(value => Math.floor(value * 100 / sum)) as Shares;
  let remainder = 100 - result[0] - result[1] - result[2];
  const priority: ComponentIndex[] = [0, 1, 2];
  priority.sort((a, b) => weights[b] - weights[a] || a - b);
  for (let i = 0; remainder > 0; i++, remainder--) result[priority[i % 3]]++;
  return result;
}

/**
 * Set one integer share. Allocate the remainder in the other two shares'
 * previous ratio, assigning the rounding unit to the larger previous share.
 * Equal shares break ties by lower component index. Zero/zero splits equally.
 */
export function redistribute(shares: Readonly<Shares>, index: ComponentIndex, next: number): Shares {
  if (index !== 0 && index !== 1 && index !== 2) throw new RangeError('Invalid component index');
  const source = normalizeShares(shares);
  if (!Number.isFinite(next)) return source;

  const selected = Math.max(0, Math.min(100, Math.round(next)));
  const remaining = 100 - selected;
  const others = ([0, 1, 2] as ComponentIndex[]).filter(item => item !== index);
  const [a, b] = others;
  const sum = source[a] + source[b];
  const aWeight = sum === 0 ? 1 : source[a];
  const bWeight = sum === 0 ? 1 : source[b];
  const total = aWeight + bWeight;
  const result: Shares = [0, 0, 0];
  result[index] = selected;
  result[a] = Math.floor(remaining * aWeight / total);
  result[b] = Math.floor(remaining * bWeight / total);
  result[aWeight >= bWeight ? a : b] += remaining - result[a] - result[b];
  return result;
}

/** Art direction multipliers only; no physical or chemical interpretation. */
export function phaseWeights(phase: Phase): Readonly<Shares> {
  switch (phase) {
    case 'arrival': return [1.28, 0.96, 0.72];
    case 'afterglow': return [0.60, 0.84, 1.36];
    default: return [1, 1, 1];
  }
}

/**
 * Continuous visual weights, not the editor's integer percentages.
 * Every nonzero component survives every phase; an absent one stays absent.
 */
export function phaseShares(shares: Readonly<Shares>, phase: Phase): Shares {
  const source = normalizeShares(shares);
  const multipliers = phaseWeights(phase);
  const result = source.map((share, index) => share * multipliers[index]) as Shares;
  const total = result[0] + result[1] + result[2];
  return result.map(value => value / total * 100) as Shares;
}

/**
 * A subtraction demonstration preserves the other components' scale.
 * Do not normalize this result: its deliberate empty area is the comparison.
 */
export function withoutComponent(shares: Readonly<Shares>, missing: ComponentIndex | null): Shares {
  const result = copyShares(shares);
  if (missing !== null) result[missing] = 0;
  return result;
}

export function createDemoState(): DemoState {
  return { missing: null, phase: 'unfolding', distance: 'near', together: true };
}

export function createPersonalState(): PersonalState {
  return { shares: copyShares(DEFAULT_SHARES), title: DEFAULT_TITLE, memory: null, titleEdited: false };
}

/** Preserve user language and markup literally; render through textContent. */
export function sanitizeTitle(value: unknown): string {
  if (typeof value !== 'string') return DEFAULT_TITLE;
  const oneLine = value.replace(/[\r\n\t]+/g, ' ').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  return Array.from(oneLine).slice(0, TITLE_LIMIT).join('');
}

export function suggestedTitle(memory: MemoryChoice): string {
  return memory === null ? DEFAULT_TITLE : MEMORY_TITLES[memory];
}

/** An empty editable title remains empty in storage but has a display fallback. */
export function displayTitle(state: PersonalState): string {
  return state.title.trim() ? state.title : suggestedTitle(state.memory);
}

export function chooseMemory(state: PersonalState, memory: MemoryChoice): PersonalState {
  return {
    ...state,
    shares: copyShares(state.shares),
    memory,
    title: state.titleEdited ? state.title : suggestedTitle(memory),
  };
}

export function editTitle(state: PersonalState, title: string): PersonalState {
  return { ...state, shares: copyShares(state.shares), title: sanitizeTitle(title), titleEdited: true };
}

export function sanitizePersonalState(input: unknown): PersonalState {
  if (!isRecord(input)) return createPersonalState();
  const memory = input.memory === 'window' || input.memory === 'note' ? input.memory : null;
  return {
    shares: normalizeShares(input.shares),
    title: typeof input.title === 'string' ? sanitizeTitle(input.title) : suggestedTitle(memory),
    memory,
    titleEdited: input.titleEdited === true,
  };
}

export function serializeState(state: PersonalState): string {
  return JSON.stringify({ version: STATE_VERSION, personal: sanitizePersonalState(state) });
}

export function restoreState(serialized: string | null | undefined): PersonalState {
  if (!serialized) return createPersonalState();
  try {
    const parsed: unknown = JSON.parse(serialized);
    if (!isRecord(parsed) || parsed.version !== STATE_VERSION) return createPersonalState();
    return sanitizePersonalState(parsed.personal);
  } catch {
    return createPersonalState();
  }
}

export function loadState(storage: Pick<StorageLike, 'getItem'> | null | undefined): PersonalState {
  try {
    return restoreState(storage?.getItem(STORAGE_KEY));
  } catch {
    return createPersonalState();
  }
}

/** Return false for unavailable/full storage while keeping the live work usable. */
export function saveState(storage: Pick<StorageLike, 'setItem'> | null | undefined, state: PersonalState): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, serializeState(state));
    return true;
  } catch {
    return false;
  }
}

/** For SVG export string assembly. DOM consumers should use textContent. */
export function escapeXml(value: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  };
  return value.replace(/[&<>"']/g, character => entities[character]);
}

export function clamp01(value: number): number {
  return Number.isNaN(value) ? 0 : Math.max(0, Math.min(1, value));
}

/** Reversible, directly evaluable transition easing. */
export function smoothstep(progress: number): number {
  const value = clamp01(progress);
  return value * value * (3 - 2 * value);
}

export function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * clamp01(progress);
}
