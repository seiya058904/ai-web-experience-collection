/**
 * Local, replayable observation state. Only actions and preferences are saved;
 * a saved file never supplies a board, a goal result, or a capture count.
 */
import { coordOf, indexOf } from './engine.ts';
import type { Position } from './engine.ts';
import { attemptPuzzle, initialFor } from './puzzles.ts';
import type { PuzzleAttempt, PuzzleId } from './puzzles.ts';

export type SeenStep = 0 | 1 | 2;

export interface AttemptRecord {
  readonly coord: string;
  /** Furthest actually displayed step; undo never rewrites this observation. */
  readonly seen: SeenStep;
}

export interface PuzzleSession {
  readonly attempts: readonly AttemptRecord[];
  readonly active: number | null;
  readonly step: number;
  readonly hint: boolean;
}

export interface Session {
  readonly version: 1;
  readonly hero: string | null;
  readonly heroLiberties: boolean;
  readonly libertyExample: 'hero' | 'D4' | 'A4' | 'A1';
  readonly groupPoint: 'D3' | 'D4' | 'E4' | 'F5';
  readonly groupLiberties: boolean;
  readonly puzzles: Readonly<Record<PuzzleId, PuzzleSession>>;
  readonly autoReply: boolean;
  readonly motion: 'system' | 'reduced' | 'full';
  readonly sound: boolean;
  readonly eyesPoint: 'C3' | 'E3' | null;
  readonly branch: 'A' | 'B';
  readonly branchSteps: Readonly<{ A: number; B: number }>;
  readonly koStage: 0 | 1 | 2;
}

export interface PuzzleView {
  readonly position: Position;
  readonly attempt: PuzzleAttempt | null;
  readonly step: number;
  readonly complete: boolean;
}

export interface ObservationEntry {
  readonly coord: string;
  readonly legal: boolean;
  readonly seen: SeenStep;
  readonly position: Position;
  readonly solved: boolean;
  readonly explanation: string;
}

const IDS: readonly PuzzleId[] = ['P1', 'P2', 'P3'];

function freezePuzzle(puzzle: PuzzleSession): PuzzleSession {
  return Object.freeze({
    attempts: Object.freeze(puzzle.attempts.map(record => Object.freeze({ coord: record.coord, seen: record.seen }))),
    active: puzzle.active,
    step: puzzle.step,
    hint: puzzle.hint,
  });
}

function freezeSession(state: Session): Session {
  return Object.freeze({
    version: 1 as const,
    hero: state.hero,
    heroLiberties: state.heroLiberties,
    libertyExample: state.libertyExample,
    groupPoint: state.groupPoint,
    groupLiberties: state.groupLiberties,
    puzzles: Object.freeze({
      P1: freezePuzzle(state.puzzles.P1),
      P2: freezePuzzle(state.puzzles.P2),
      P3: freezePuzzle(state.puzzles.P3),
    }),
    autoReply: state.autoReply,
    motion: state.motion,
    sound: state.sound,
    eyesPoint: state.eyesPoint,
    branch: state.branch,
    branchSteps: Object.freeze({ A: state.branchSteps.A, B: state.branchSteps.B }),
    koStage: state.koStage,
  });
}

export function createSession(): Session {
  const blank = (): PuzzleSession => ({ attempts: [], active: null, step: 0, hint: false });
  return freezeSession({
    version: 1,
    hero: null,
    heroLiberties: false,
    libertyExample: 'hero',
    groupPoint: 'D3',
    groupLiberties: false,
    puzzles: { P1: blank(), P2: blank(), P3: blank() },
    autoReply: true,
    motion: 'system',
    sound: false,
    eyesPoint: null,
    branch: 'A',
    branchSteps: { A: 1, B: 2 },
    koStage: 0,
  });
}

function normalizedCoord(coord: string): string {
  const index = indexOf(coord);
  // Invalid coordinate text is still an actual attempted input. Keep it as
  // data; UI/export consumers must use textContent or their normal XML escape.
  return index < 0 ? coord : coordOf(index);
}

function replacePuzzle(state: Session, id: PuzzleId, puzzle: PuzzleSession): Session {
  return Object.freeze({
    ...state,
    puzzles: Object.freeze({ ...state.puzzles, [id]: freezePuzzle(puzzle) }),
  });
}

export function puzzleView(state: Session, id: PuzzleId): PuzzleView {
  const puzzle = state.puzzles[id];
  const record = puzzle.active === null ? undefined : puzzle.attempts[puzzle.active];
  if (!record) return Object.freeze({ position: initialFor(id), attempt: null, step: 0, complete: false });
  const result = attemptPuzzle(id, record.coord);
  if (!result.ok) {
    return Object.freeze({ position: initialFor(id), attempt: result, step: 0, complete: false });
  }
  const step = Math.max(0, Math.min(puzzle.step, record.seen, result.steps.length - 1));
  return Object.freeze({
    position: result.steps[step],
    attempt: result,
    step,
    complete: step === result.steps.length - 1 && result.solved,
  });
}

/**
 * Submit one first move from the initial view. A legal trial remains visible
 * until explicitly undone/reset. Illegal attempts are also kept chronologically.
 */
export function attempt(state: Session, id: PuzzleId, coord: string): Session {
  if (typeof coord !== 'string' || puzzleView(state, id).step !== 0) return state;
  const puzzle = state.puzzles[id];
  const normalized = normalizedCoord(coord);
  const result = attemptPuzzle(id, normalized);
  const seen: SeenStep = result.ok ? id === 'P3' && state.autoReply ? 2 : 1 : 0;
  const attempts = [...puzzle.attempts, { coord: normalized, seen }];

  let active: number | null = attempts.length - 1;
  if (!result.ok && puzzle.active !== null) {
    const current = puzzle.attempts[puzzle.active];
    if (current && attemptPuzzle(id, current.coord).ok) active = puzzle.active;
  }
  return replacePuzzle(state, id, { ...puzzle, attempts, active, step: seen });
}

/** Undo the displayed step, retaining the complete observation record. */
export function undoPuzzle(state: Session, id: PuzzleId): Session {
  const puzzle = state.puzzles[id];
  const view = puzzleView(state, id);
  if (view.step === 0) return state;
  return replacePuzzle(state, id, { ...puzzle, step: view.step - 1 });
}

/** Return to the exact setup without erasing any attempts or max-seen steps. */
export function resetPuzzle(state: Session, id: PuzzleId): Session {
  const puzzle = state.puzzles[id];
  if (puzzle.active === null && puzzle.step === 0) return state;
  return replacePuzzle(state, id, { ...puzzle, active: null, step: 0 });
}

/** Explicitly view P3's published white response. */
export function advanceReply(state: Session): Session {
  const puzzle = state.puzzles.P3;
  const view = puzzleView(state, 'P3');
  if (puzzle.active === null || view.step !== 1 || !view.attempt?.ok) return state;
  const active = puzzle.active;
  const attempts = puzzle.attempts.map((record, i) => i === active ? { ...record, seen: 2 as const } : record);
  return replacePuzzle(state, 'P3', { ...puzzle, attempts, step: 2 });
}

/** Revisit what was actually seen; selecting history does not invent a reply. */
export function selectAttempt(state: Session, id: PuzzleId, index: number): Session {
  const puzzle = state.puzzles[id];
  if (!Number.isInteger(index) || index < 0 || index >= puzzle.attempts.length) return state;
  const record = puzzle.attempts[index];
  return replacePuzzle(state, id, { ...puzzle, active: index, step: record.seen });
}

export function entriesFor(state: Session, id: PuzzleId): readonly ObservationEntry[] {
  return Object.freeze(state.puzzles[id].attempts.map(record => {
    const result = attemptPuzzle(id, record.coord);
    if (!result.ok) {
      return Object.freeze({
        coord: record.coord,
        legal: false,
        seen: 0 as const,
        position: initialFor(id),
        solved: false,
        explanation: result.message,
      });
    }

    const pendingReply = id === 'P3' && record.seen === 1;
    const firstCapture = result.first.captured.length > 0
      ? `Black at ${result.first.move.coord} captures White at ${result.first.captured.map(coordOf).join(', ')}.`
      : `Black at ${result.first.move.coord} is on the board.`;
    return Object.freeze({
      coord: result.first.move.coord,
      legal: true,
      seen: record.seen,
      position: result.steps[record.seen],
      solved: !pendingReply && result.solved,
      explanation: pendingReply
        ? `${firstCapture} The stated reply is White at ${result.reply!.move.coord}; it has not yet been viewed. The protection goal has not yet been evaluated.`
        : result.explanation,
    });
  }));
}

type JsonObject = Record<string, unknown>;

function object(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function integer(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

function oneOf<T extends string>(value: unknown, choices: readonly T[]): value is T {
  return typeof value === 'string' && choices.includes(value as T);
}

function validCoordinate(value: unknown): value is string {
  return typeof value === 'string' && indexOf(value) >= 0;
}

/** Validate metadata and replay every action from fixed, trusted lesson data. */
function rebuild(value: unknown): Session | null {
  if (!object(value)
    || value.version !== 1
    || !(value.hero === null || validCoordinate(value.hero))
    || typeof value.heroLiberties !== 'boolean'
    || !oneOf(value.libertyExample, ['hero', 'D4', 'A4', 'A1'])
    || !oneOf(value.groupPoint, ['D3', 'D4', 'E4', 'F5'])
    || typeof value.groupLiberties !== 'boolean'
    || typeof value.autoReply !== 'boolean'
    || !oneOf(value.motion, ['system', 'reduced', 'full'])
    || typeof value.sound !== 'boolean'
    || !(value.eyesPoint === null || oneOf(value.eyesPoint, ['C3', 'E3']))
    || !oneOf(value.branch, ['A', 'B'])
    || !object(value.branchSteps)
    || !integer(value.branchSteps.A, 0, 1)
    || !integer(value.branchSteps.B, 0, 2)
    || !integer(value.koStage, 0, 2)
    || !object(value.puzzles)) return null;

  const puzzles = {} as Record<PuzzleId, PuzzleSession>;
  for (const id of IDS) {
    const source = value.puzzles[id];
    if (!object(source) || !Array.isArray(source.attempts) || typeof source.hint !== 'boolean') return null;
    const attempts: AttemptRecord[] = [];
    const replayed: PuzzleAttempt[] = [];
    for (const item of source.attempts) {
      if (!object(item) || typeof item.coord !== 'string' || !integer(item.seen, 0, 2)) return null;
      const coord = normalizedCoord(item.coord);
      const result = attemptPuzzle(id, coord);
      if (result.ok) {
        if (item.seen < 1 || item.seen > (id === 'P3' ? 2 : 1)) return null;
      } else if (item.seen !== 0) return null;
      attempts.push({ coord, seen: item.seen as SeenStep });
      replayed.push(result);
    }
    if (!(source.active === null || integer(source.active, 0, attempts.length - 1))) return null;
    if (!integer(source.step, 0, id === 'P3' ? 2 : 1)) return null;
    if (source.active === null) {
      if (source.step !== 0) return null;
    } else {
      const record = attempts[source.active];
      if (source.step > record.seen) return null;
      if (!replayed[source.active].ok && source.step !== 0) return null;
    }
    puzzles[id] = { attempts, active: source.active, step: source.step, hint: source.hint };
  }

  return freezeSession({
    version: 1,
    hero: value.hero === null ? null : normalizedCoord(value.hero),
    heroLiberties: value.heroLiberties,
    libertyExample: value.libertyExample,
    groupPoint: value.groupPoint,
    groupLiberties: value.groupLiberties,
    puzzles,
    autoReply: value.autoReply,
    motion: value.motion,
    sound: value.sound,
    eyesPoint: value.eyesPoint,
    branch: value.branch,
    branchSteps: { A: value.branchSteps.A, B: value.branchSteps.B },
    koStage: value.koStage as 0 | 1 | 2,
  });
}

/** Missing/corrupt/unsupported storage yields a clean session, never partial data. */
export function restoreSession(raw: string | null): Session {
  if (typeof raw !== 'string') return createSession();
  try {
    return rebuild(JSON.parse(raw)) ?? createSession();
  } catch {
    return createSession();
  }
}

/** The saved schema explicitly excludes boards, computed results and timestamps. */
export function serializeSession(state: Session): string {
  return JSON.stringify(freezeSession(state));
}
