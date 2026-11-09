/**
 * SENTE's deliberately small rules engine.
 *
 * Seven real board edges; orthogonal connection; capture before suicide;
 * immediate board repetition (simple ko). There is no scoring, passing,
 * territory adjudication, superko, or claim to implement full tournament rules.
 * Every committed Position is a frozen snapshot. Rendering never changes it.
 */

export const BOARD_SIZE = 7;
export const BOARD_AREA = BOARD_SIZE * BOARD_SIZE;
export const COLUMNS = 'ABCDEFG';

export type Color = 'black' | 'white';
export type Cell = Color | null;
export type Board = readonly Cell[];
export type Point = string | number;

export interface Group {
  readonly color: Color;
  /** Board indices, sorted in ascending order. */
  readonly stones: readonly number[];
  /** A set of empty orthogonal neighbours, sorted and without duplicates. */
  readonly liberties: readonly number[];
}

export interface Move {
  readonly color: Color;
  readonly coord: string;
  readonly index: number;
}

export interface Position {
  readonly board: Board;
  readonly toPlay: Color;
  /** Exact board keys, including the initial and current positions. */
  readonly history: readonly string[];
  readonly moves: readonly Move[];
  readonly lastMove: Move | null;
  readonly captures: Readonly<Record<Color, number>>;
  readonly moveNumber: number;
}

export type MoveError = 'out-of-range' | 'occupied' | 'suicide' | 'ko';

export interface PlaySuccess {
  readonly ok: true;
  readonly position: Position;
  readonly captured: readonly number[];
  readonly move: Move;
}

export interface PlayFailure {
  readonly ok: false;
  readonly reason: MoveError;
  readonly message: string;
  /** Only a rejected ko supplies this evidence. Never commit this board. */
  readonly hypotheticalBoard?: Board;
}

export type PlayResult = PlaySuccess | PlayFailure;

function isIndex(index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < BOARD_AREA;
}

/** A1 is 0 (bottom left), B1 is 1, and G7 is 48. Invalid input gives -1. */
export function indexOf(coord: string): number {
  if (typeof coord !== 'string') return -1;
  const normalized = coord.trim().toUpperCase();
  if (!/^[A-G][1-7]$/.test(normalized)) return -1;
  return (Number(normalized[1]) - 1) * BOARD_SIZE + COLUMNS.indexOf(normalized[0]);
}

export function coordOf(index: number): string {
  if (!isIndex(index)) throw new RangeError('A board index must be an integer from 0 to 48.');
  return `${COLUMNS[index % BOARD_SIZE]}${Math.floor(index / BOARD_SIZE) + 1}`;
}

function pointIndex(point: Point): number {
  return typeof point === 'string' ? indexOf(point) : isIndex(point) ? point : -1;
}

/** There is no wraparound at an edge and no diagonal neighbour. */
export function neighbors(index: number): number[] {
  if (!isIndex(index)) return [];
  const x = index % BOARD_SIZE;
  const y = Math.floor(index / BOARD_SIZE);
  const result: number[] = [];
  if (y > 0) result.push(index - BOARD_SIZE);
  if (x > 0) result.push(index - 1);
  if (x < BOARD_SIZE - 1) result.push(index + 1);
  if (y < BOARD_SIZE - 1) result.push(index + BOARD_SIZE);
  return result;
}

export function opponent(color: Color): Color {
  return color === 'black' ? 'white' : 'black';
}

function assertBoard(board: Board): void {
  if (board.length !== BOARD_AREA || board.some(cell => cell !== null && cell !== 'black' && cell !== 'white')) {
    throw new TypeError('A board must contain exactly 49 black, white, or null cells.');
  }
}

export function emptyBoard(): Board {
  return Object.freeze(Array<Cell>(BOARD_AREA).fill(null));
}

/** Constructs an independent setup, not a sequence of legal moves. */
export function boardFrom(black: readonly string[] = [], white: readonly string[] = []): Board {
  const board: Cell[] = Array<Cell>(BOARD_AREA).fill(null);
  const place = (coordinates: readonly string[], color: Color): void => {
    for (const coord of coordinates) {
      const index = indexOf(coord);
      if (index < 0) throw new RangeError(`Invalid setup coordinate: ${String(coord)}.`);
      if (board[index] !== null) throw new RangeError(`The setup lists ${coordOf(index)} more than once.`);
      board[index] = color;
    }
  };
  place(black, 'black');
  place(white, 'white');
  return Object.freeze(board);
}

export function boardKey(board: Board): string {
  return board.map(cell => cell === 'black' ? 'b' : cell === 'white' ? 'w' : '.').join('');
}

export function groupAt(board: Board, point: Point): Group | null {
  const start = pointIndex(point);
  if (start < 0 || board[start] == null) return null;
  const color = board[start] as Color;
  const stones = new Set<number>([start]);
  const liberties = new Set<number>();
  const pending = [start];
  while (pending.length > 0) {
    const current = pending.pop()!;
    for (const adjacent of neighbors(current)) {
      if (board[adjacent] === null) {
        liberties.add(adjacent);
      } else if (board[adjacent] === color && !stones.has(adjacent)) {
        stones.add(adjacent);
        pending.push(adjacent);
      }
    }
  }
  return Object.freeze({
    color,
    stones: Object.freeze([...stones].sort((a, b) => a - b)),
    liberties: Object.freeze([...liberties].sort((a, b) => a - b)),
  });
}

export function createPosition(board: Board = emptyBoard(), toPlay: Color = 'black'): Position {
  assertBoard(board);
  if (toPlay !== 'black' && toPlay !== 'white') throw new TypeError('The next player must be black or white.');
  const snapshot = Object.freeze([...board]);
  return Object.freeze({
    board: snapshot,
    toPlay,
    history: Object.freeze([boardKey(snapshot)]),
    moves: Object.freeze([]),
    lastMove: null,
    captures: Object.freeze({ black: 0, white: 0 }),
    moveNumber: 0,
  });
}

function failure(reason: MoveError, message: string, hypotheticalBoard?: Board): PlayFailure {
  return Object.freeze({ ok: false, reason, message, ...(hypotheticalBoard ? { hypotheticalBoard } : {}) });
}

/**
 * Attempts one move. An invalid move changes neither the board nor its history.
 * The order is intentional: occupy, capture opponents, check own liberties,
 * check immediate repetition, then commit a new immutable snapshot.
 */
export function play(position: Position, point: Point): PlayResult {
  const index = pointIndex(point);
  if (index < 0) return failure('out-of-range', 'Choose an intersection from A1 to G7.');
  const coord = coordOf(index);
  if (position.board[index] !== null) {
    return failure('occupied', `${coord} is already occupied. Choose an empty intersection.`);
  }

  const color = position.toPlay;
  const enemy = opponent(color);
  const next: Cell[] = [...position.board];
  next[index] = color;
  const examined = new Set<number>();
  const captured: number[] = [];

  for (const adjacent of neighbors(index)) {
    if (next[adjacent] !== enemy || examined.has(adjacent)) continue;
    const group = groupAt(next, adjacent)!;
    for (const stone of group.stones) examined.add(stone);
    if (group.liberties.length === 0) {
      for (const stone of group.stones) {
        next[stone] = null;
        captured.push(stone);
      }
    }
  }

  if (groupAt(next, index)!.liberties.length === 0) {
    return failure('suicide', `${coord} would leave the new ${color} string with no liberties and captures nothing. The board stays unchanged.`);
  }

  const nextKey = boardKey(next);
  if (position.history.length >= 2 && nextKey === position.history[position.history.length - 2]) {
    return failure('ko', `Playing at ${coord} would recreate the position before the last move. Immediate repetition is not allowed (ko).`, Object.freeze(next));
  }

  captured.sort((a, b) => a - b);
  const move: Move = Object.freeze({ color, coord, index });
  const committed: Position = Object.freeze({
    board: Object.freeze(next),
    toPlay: enemy,
    history: Object.freeze([...position.history, nextKey]),
    moves: Object.freeze([...position.moves, move]),
    lastMove: move,
    captures: Object.freeze({ ...position.captures, [color]: position.captures[color] + captured.length }),
    moveNumber: position.moveNumber + 1,
  });

  return Object.freeze({ ok: true, position: committed, captured: Object.freeze(captured), move });
}

export function legalMoves(position: Position): readonly number[] {
  return Object.freeze(Array.from({ length: BOARD_AREA }, (_, i) => i).filter(index => play(position, index).ok));
}
