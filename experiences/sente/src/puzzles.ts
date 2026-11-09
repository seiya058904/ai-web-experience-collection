import {
  boardFrom,
  boardKey,
  coordOf,
  createPosition,
  groupAt,
  indexOf,
  play,
} from './engine.ts';
import type { Board, PlayFailure, PlaySuccess, Point, Position } from './engine.ts';

export type PuzzleId = 'P1' | 'P2' | 'P3';
export type SetupId = PuzzleId | 'K1';

export interface PuzzleSpec {
  readonly id: PuzzleId;
  readonly title: string;
  readonly goal: string;
  readonly black: readonly string[];
  readonly white: readonly string[];
  readonly solution: string;
  readonly targets: readonly string[];
}

function puzzle(spec: PuzzleSpec): PuzzleSpec {
  return Object.freeze({
    ...spec,
    black: Object.freeze([...spec.black]),
    white: Object.freeze([...spec.white]),
    targets: Object.freeze([...spec.targets]),
  });
}

export const PUZZLES: Readonly<Record<PuzzleId, PuzzleSpec>> = Object.freeze({
  P1: puzzle({
    id: 'P1',
    title: 'The last liberty',
    goal: 'Play one black stone to capture White at D4.',
    black: ['C4', 'D3', 'E4'],
    white: ['D4'],
    solution: 'D5',
    targets: ['D4'],
  }),
  P2: puzzle({
    id: 'P2',
    title: 'A small bridge',
    goal: 'Connect the two marked black strings in one move, without a capture.',
    black: ['B3', 'C3', 'E3', 'F3'],
    white: ['C2', 'C4', 'E2', 'E4'],
    solution: 'D3',
    targets: ['B3', 'C3', 'E3', 'F3'],
  }),
  P3: puzzle({
    id: 'P3',
    title: 'Letting one go',
    goal: 'Keep the marked black stones at C3 and C4 on the board after the stated white reply.',
    black: ['C3', 'C4', 'E5', 'F4', 'G5'],
    white: ['B3', 'B4', 'C2', 'D3', 'D4', 'F5'],
    solution: 'C5',
    targets: ['C3', 'C4'],
  }),
});

export const K1 = Object.freeze({
  id: 'K1' as const,
  title: 'Not the same position again',
  black: Object.freeze(['C4', 'D3', 'E4']),
  white: Object.freeze(['D4', 'C5', 'E5', 'D6']),
  capture: 'D5',
  recapture: 'D4',
});

export const TWO_EYES_BOARD: Board = boardFrom([
  'B2', 'C2', 'D2', 'E2', 'F2',
  'B3', 'D3', 'F3',
  'B4', 'C4', 'D4', 'E4', 'F4',
]);

export const GROUP_BOARD: Board = boardFrom(['D3', 'D4', 'E4', 'F5']);

export function initialFor(id: SetupId): Position {
  const spec = id === 'K1' ? K1 : PUZZLES[id];
  if (!spec) throw new RangeError(`Unknown setup: ${String(id)}.`);
  return createPosition(boardFrom(spec.black, spec.white));
}

/** A published teaching script, not an AI search or a universal best reply. */
export function p3ReplyFor(firstMove: Point): string {
  const coordinate = typeof firstMove === 'number' ? coordOf(firstMove) : firstMove.trim().toUpperCase();
  return coordinate === 'C5' ? 'F6' : 'C5';
}

/** Finite lesson goals only. No scoring, ranks, or whole-game evaluation. */
export function evaluatePuzzle(id: PuzzleId, position: Position): boolean {
  const spec = PUZZLES[id];
  if (!spec) return false;
  if (position.history[0] !== boardKey(boardFrom(spec.black, spec.white))) return false;
  if (position.moves[0]?.color !== 'black') return false;

  if (id === 'P1') {
    return position.moveNumber === 1
      && position.board[indexOf('D4')] === null
      && position.captures.black === 1;
  }
  if (id === 'P2') {
    if (position.moveNumber !== 1 || position.captures.black !== 0 || position.captures.white !== 0) return false;
    const group = groupAt(position.board, 'B3');
    return group?.color === 'black'
      && group.stones.length === 5
      && spec.targets.every(coord => group.stones.includes(indexOf(coord)));
  }
  return position.moveNumber === 2
    && position.moves[1]?.color === 'white'
    && position.moves[1]?.coord === p3ReplyFor(position.moves[0].coord)
    && spec.targets.every(coord => position.board[indexOf(coord)] === 'black');
}

export interface PuzzleSuccess {
  readonly ok: true;
  readonly id: PuzzleId;
  readonly first: PlaySuccess;
  readonly reply: PlaySuccess | null;
  readonly position: Position;
  readonly solved: boolean;
  readonly explanation: string;
  /** The independent initial setup, then each actual legal move. */
  readonly steps: readonly Position[];
}

export type PuzzleFailure = PlayFailure & { readonly id: PuzzleId };
export type PuzzleAttempt = PuzzleSuccess | PuzzleFailure;

function explain(id: PuzzleId, first: PlaySuccess, reply: PlaySuccess | null, solved: boolean): string {
  const coord = first.move.coord;
  if (id === 'P1') {
    return solved
      ? `Black at ${coord} fills White's last liberty. The white stone at D4 is captured, leaving an empty intersection.`
      : `Black at ${coord} is legal, but White at D4 still has a liberty. The one-move capture goal is not met. You can undo and try again.`;
  }
  if (id === 'P2') {
    return solved
      ? `Black at ${coord} joins all five stones into one string with eight distinct liberties. No stone is captured.`
      : `Black at ${coord} is legal, but the two marked strings are still separate. Only an unbroken path of orthogonally adjacent black stones connects them.`;
  }
  if (solved) {
    return `Black at ${coord} extends the marked string. After the scripted White at ${reply!.move.coord}, C3 and C4 remain on the board. This meets this lesson's local goal.`;
  }
  return first.captured.includes(indexOf('F5'))
    ? `Black at ${coord} captures White at F5. The scripted White at C5 then captures the marked black stones at C3 and C4. The protection goal is not met.`
    : `Black at ${coord} leaves the marked string with its last liberty at C5. The scripted White at C5 captures C3 and C4. The protection goal is not met.`;
}

/** One independent first-move attempt. An unsuccessful legal move is retained. */
export function attemptPuzzle(id: PuzzleId, point: Point): PuzzleAttempt {
  const initial = initialFor(id);
  const first = play(initial, point);
  if (!first.ok) return Object.freeze({ ...first, id });

  let reply: PlaySuccess | null = null;
  if (id === 'P3') {
    const result = play(first.position, p3ReplyFor(first.move.coord));
    // The fixed P3 data are exhaustively tested; an illegal scripted reply is
    // an implementation/setup error, never a fabricated successful animation.
    if (!result.ok) throw new Error(`P3's scripted reply was unexpectedly illegal: ${result.message}`);
    reply = result;
  }
  const position = reply?.position ?? first.position;
  const solved = evaluatePuzzle(id, position);
  return Object.freeze({
    ok: true,
    id,
    first,
    reply,
    position,
    solved,
    explanation: explain(id, first, reply, solved),
    steps: Object.freeze(reply ? [initial, first.position, reply.position] : [initial, first.position]),
  });
}

/** Every call starts from P2's own setup, so replay branches cannot leak. */
export function p2Line(branch: 'A' | 'B'): readonly Position[] {
  const initial = initialFor('P2');
  const first = play(initial, branch === 'A' ? 'D3' : 'D4');
  if (!first.ok) throw new Error(first.message);
  if (branch === 'A') return Object.freeze([initial, first.position]);
  const reply = play(first.position, 'D3');
  if (!reply.ok) throw new Error(reply.message);
  return Object.freeze([initial, first.position, reply.position]);
}
