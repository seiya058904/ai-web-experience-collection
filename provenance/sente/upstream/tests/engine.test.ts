import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BOARD_AREA,
  boardFrom,
  boardKey,
  coordOf,
  createPosition,
  emptyBoard,
  groupAt,
  indexOf,
  legalMoves,
  neighbors,
  play,
} from '../src/engine.ts';
import type { Board, PlayResult, PlaySuccess, Position } from '../src/engine.ts';
import {
  GROUP_BOARD,
  K1,
  PUZZLES,
  TWO_EYES_BOARD,
  attemptPuzzle,
  evaluatePuzzle,
  initialFor,
  p2Line,
  p3ReplyFor,
} from '../src/puzzles.ts';
import type { PuzzleId, PuzzleSuccess } from '../src/puzzles.ts';

const coordinates = (indices: readonly number[]): string[] => indices.map(coordOf).sort();
const success = (result: PlayResult): PlaySuccess => {
  assert.equal(result.ok, true, result.ok ? undefined : result.message);
  return result as PlaySuccess;
};
const count = (board: Board, color: 'black' | 'white'): number => board.filter(cell => cell === color).length;

describe('The real 7 × 7 boundary and coordinate convention', () => {
  it('round-trips all 49 intersections with row 1 at the bottom', () => {
    assert.equal(indexOf('A1'), 0);
    assert.equal(indexOf('G1'), 6);
    assert.equal(indexOf('A7'), 42);
    assert.equal(indexOf('G7'), 48);
    assert.equal(indexOf('D4'), 24);
    for (let i = 0; i < BOARD_AREA; i++) assert.equal(indexOf(coordOf(i)), i);
    assert.equal(indexOf(' d4 '), 24);
  });

  it('rejects coordinates beyond the actual edges and non-integer indices', () => {
    for (const coord of ['A0', 'A8', 'H1', 'D44', '', '4D', 'D 4', 'Ａ１']) assert.equal(indexOf(coord), -1);
    for (const index of [-1, 49, 1.5, NaN, Infinity]) {
      assert.throws(() => coordOf(index), RangeError);
      assert.deepEqual(neighbors(index), []);
      const result = play(createPosition(), index);
      assert.equal(result.ok, false);
      if (!result.ok) assert.equal(result.reason, 'out-of-range');
    }
  });

  it('has four, three and two exact liberties at center, edge and corner', () => {
    const cases: [string, string[]][] = [
      ['D4', ['C4', 'D3', 'D5', 'E4']],
      ['A4', ['A3', 'A5', 'B4']],
      ['A1', ['A2', 'B1']],
    ];
    for (const [coord, expected] of cases) {
      assert.deepEqual(coordinates(groupAt(boardFrom([coord]), coord)!.liberties), expected);
    }
  });

  it('never wraps a row or introduces diagonal adjacency at any point', () => {
    for (let index = 0; index < BOARD_AREA; index++) {
      const x = index % 7;
      const y = Math.floor(index / 7);
      const adjacent = neighbors(index);
      assert.equal(adjacent.length, 4 - Number(x === 0 || x === 6) - Number(y === 0 || y === 6));
      assert.equal(new Set(adjacent).size, adjacent.length);
      for (const n of adjacent) {
        assert.equal(Math.abs(n % 7 - x) + Math.abs(Math.floor(n / 7) - y), 1);
        assert.ok(neighbors(n).includes(index));
      }
    }
  });

  it('rejects malformed independent setups and overlapping stones', () => {
    assert.throws(() => boardFrom(['D4'], ['D4']), RangeError);
    assert.throws(() => boardFrom(['D4', 'D4']), RangeError);
    assert.throws(() => boardFrom(['H1']), RangeError);
    assert.throws(() => createPosition([null]), TypeError);
    assert.throws(() => createPosition(Array(49).fill('red')), TypeError);
  });
});

describe('Connection and shared liberties', () => {
  it('connects D3, D4 and E4, counting the shared E3 liberty once', () => {
    const expectedLiberties = ['C3', 'C4', 'D2', 'D5', 'E3', 'E5', 'F4'];
    for (const start of ['D3', 'D4', 'E4']) {
      const group = groupAt(GROUP_BOARD, start)!;
      assert.deepEqual(coordinates(group.stones), ['D3', 'D4', 'E4']);
      assert.deepEqual(coordinates(group.liberties), expectedLiberties);
      assert.equal(group.liberties.length, 7);
      assert.equal(new Set(group.liberties).size, 7);
    }
  });

  it('does not join diagonal F5 even though it shares nearby empty points', () => {
    const separate = groupAt(GROUP_BOARD, 'F5')!;
    assert.deepEqual(coordinates(separate.stones), ['F5']);
    assert.deepEqual(coordinates(separate.liberties), ['E5', 'F4', 'F6', 'G5']);
    assert.equal(groupAt(GROUP_BOARD, 'A1'), null);
    assert.equal(groupAt(GROUP_BOARD, 'H1'), null);
  });

  it('distinguishes an empty board from a stone on each of its 49 points', () => {
    const keys = new Set([boardKey(emptyBoard())]);
    for (let i = 0; i < 49; i++) keys.add(boardKey(boardFrom([coordOf(i)])));
    assert.equal(keys.size, 50);
  });
});

describe('Capture, suicide and immutable snapshots', () => {
  it('removes all stones of a captured chain, leaving actual null cells', () => {
    const before = createPosition(boardFrom(['B3', 'C2', 'D3', 'B4', 'D4'], ['C3', 'C4']));
    const after = success(play(before, 'C5'));
    assert.deepEqual(coordinates(after.captured), ['C3', 'C4']);
    assert.equal(after.position.board[indexOf('C3')], null);
    assert.equal(after.position.board[indexOf('C4')], null);
    assert.equal(after.position.captures.black, 2);
    assert.equal(before.board[indexOf('C3')], 'white');
    assert.equal(before.captures.black, 0);
  });

  it('captures distinct adjacent opponent groups in the same move', () => {
    const before = createPosition(boardFrom(['B3', 'C2', 'C4', 'F3', 'E2', 'E4'], ['C3', 'E3']));
    const after = success(play(before, 'D3'));
    assert.deepEqual(coordinates(after.captured), ['C3', 'E3']);
    assert.equal(count(after.position.board, 'white'), 0);
  });

  it('captures before checking the new stone for suicide', () => {
    const before = initialFor('K1');
    assert.ok(neighbors(indexOf('D5')).every(index => before.board[index] === 'white'));
    const after = success(play(before, 'D5'));
    assert.deepEqual(coordinates(after.captured), ['D4']);
    assert.deepEqual(coordinates(groupAt(after.position.board, 'D5')!.liberties), ['D4']);
  });

  for (const eye of ['C3', 'E3']) {
    it(`rejects White at the ${eye} eye without changing a single cell or history entry`, () => {
      const before = createPosition(TWO_EYES_BOARD, 'white');
      const saved = JSON.stringify(before);
      const result = play(before, eye);
      assert.equal(result.ok, false);
      if (!result.ok) assert.equal(result.reason, 'suicide');
      assert.equal(JSON.stringify(before), saved);
      assert.equal(before.board[indexOf(eye)], null);
      assert.equal(before.moveNumber, 0);
    });
  }

  it('the two-eye example is one 13-stone string with two distinct eye points', () => {
    const group = groupAt(TWO_EYES_BOARD, 'D3')!;
    assert.equal(group.stones.length, 13);
    assert.ok(group.liberties.includes(indexOf('C3')));
    assert.ok(group.liberties.includes(indexOf('E3')));
    for (const eye of ['C3', 'E3']) {
      assert.ok(neighbors(indexOf(eye)).every(index => TWO_EYES_BOARD[index] === 'black'));
    }
  });

  it('does not alternate the player or append history on an occupied point', () => {
    const before = createPosition(boardFrom(['D4']));
    const key = JSON.stringify(before);
    const result = play(before, 'D4');
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, 'occupied');
    assert.equal(JSON.stringify(before), key);
    assert.equal(before.toPlay, 'black');
    assert.equal(before.history.length, 1);
  });

  it('freezes all retained state and reuses snapshots for an exact undo', () => {
    const initial = initialFor('P1');
    const first = success(play(initial, 'A1')).position;
    const stack: Position[] = [initial, first];
    assert.ok(Object.isFrozen(first));
    assert.ok(Object.isFrozen(first.board));
    assert.ok(Object.isFrozen(first.history));
    assert.ok(Object.isFrozen(first.captures));
    assert.ok(Object.isFrozen(first.moves));
    assert.throws(() => { (first.board as ('black' | null)[])[0] = null; }, TypeError);
    stack.pop();
    assert.equal(stack[0], initial);
    assert.equal(stack[0].board[indexOf('A1')], null);
    const alternative = success(play(stack[0], 'D5')).position;
    assert.equal(evaluatePuzzle('P1', alternative), true);
    assert.equal(alternative.board[indexOf('A1')], null);
    assert.equal(first.board[indexOf('A1')], 'black');
  });
});

describe('Simple ko compares the entire preceding position', () => {
  it('rejects the immediate D4 recapture with exact matching-board evidence', () => {
    const initial = initialFor('K1');
    const captured = success(play(initial, K1.capture));
    const beforeRejected = JSON.stringify(captured.position);
    const rejected = play(captured.position, K1.recapture);
    assert.equal(rejected.ok, false);
    if (!rejected.ok) {
      assert.equal(rejected.reason, 'ko');
      assert.deepEqual(rejected.hypotheticalBoard, initial.board);
      assert.equal(boardKey(rejected.hypotheticalBoard!), initial.history[0]);
    }
    assert.equal(JSON.stringify(captured.position), beforeRejected);
    assert.equal(captured.position.board[indexOf('D5')], 'black');
    assert.equal(captured.position.board[indexOf('D4')], null);
    assert.equal(captured.position.history.length, 2);
  });

  it('does not ban a coordinate forever after intervening legal moves', () => {
    const first = success(play(initialFor('K1'), 'D5')).position;
    const threat = success(play(first, 'A1')).position;
    const response = success(play(threat, 'G1')).position;
    const recapture = success(play(response, 'D4'));
    assert.deepEqual(coordinates(recapture.captured), ['D5']);
    assert.equal(recapture.position.board[indexOf('D4')], 'white');
    assert.equal(recapture.position.board[indexOf('D5')], null);
    assert.equal(recapture.position.board[indexOf('A1')], 'white');
    assert.equal(recapture.position.board[indexOf('G1')], 'black');
  });
});

describe('Exact puzzle setups and exhaustive first-move outcomes', () => {
  const expected = {
    P1: { legal: 45, solution: 'D5', black: 3, white: 1 },
    P2: { legal: 41, solution: 'D3', black: 4, white: 4 },
    P3: { legal: 38, solution: 'C5', black: 5, white: 6 },
  };

  for (const id of ['P1', 'P2', 'P3'] as PuzzleId[]) {
    it(`${id} has its exact setup, ${expected[id].legal} legal first moves and one goal solution`, () => {
      const initial = initialFor(id);
      assert.equal(count(initial.board, 'black'), expected[id].black);
      assert.equal(count(initial.board, 'white'), expected[id].white);
      assert.equal(legalMoves(initial).length, expected[id].legal);
      const found: string[] = [];
      for (let i = 0; i < 49; i++) {
        const before = JSON.stringify(initial);
        const attempt = attemptPuzzle(id, i);
        assert.equal(JSON.stringify(initial), before);
        if (initial.board[i] !== null) {
          assert.equal(attempt.ok, false);
          if (!attempt.ok) assert.equal(attempt.reason, 'occupied');
          continue;
        }
        assert.equal(attempt.ok, true, `${id}: ${coordOf(i)} must be legal.`);
        if (!attempt.ok) continue;
        assert.equal(attempt.first.position.board[i], 'black');
        assert.equal(attempt.first.move.coord, coordOf(i));
        assert.equal(attempt.first.position.toPlay, 'white');
        assert.equal(attempt.first.position.moveNumber, 1);
        assert.equal(attempt.first.position.history.length, 2);
        assert.equal(attempt.solved, coordOf(i) === expected[id].solution);
        if (attempt.solved) found.push(coordOf(i));

        if (id === 'P1') {
          const capture = coordOf(i) === 'D5';
          assert.deepEqual(coordinates(attempt.first.captured), capture ? ['D4'] : []);
          assert.equal(attempt.position.board[indexOf('D4')], capture ? null : 'white');
          assert.equal(attempt.reply, null);
          assert.equal(attempt.steps.length, 2);
        } else if (id === 'P2') {
          assert.equal(attempt.first.captured.length, 0);
          assert.equal(count(attempt.position.board, 'black'), 5);
          assert.equal(count(attempt.position.board, 'white'), 4);
          const left = groupAt(attempt.position.board, 'B3')!;
          assert.equal(left.stones.includes(indexOf('F3')), coordOf(i) === 'D3');
        } else {
          assert.ok(attempt.reply);
          assert.equal(attempt.reply.move.coord, coordOf(i) === 'C5' ? 'F6' : 'C5');
          assert.equal(attempt.reply.move.color, 'white');
          assert.equal(attempt.position.toPlay, 'black');
          assert.equal(attempt.position.moveNumber, 2);
          assert.equal(attempt.steps.length, 3);
          assert.deepEqual(coordinates(attempt.first.captured), coordOf(i) === 'F6' ? ['F5'] : []);
          assert.deepEqual(coordinates(attempt.reply.captured), coordOf(i) === 'C5' ? [] : ['C3', 'C4']);
          for (const target of ['C3', 'C4']) assert.equal(attempt.position.board[indexOf(target)], coordOf(i) === 'C5' ? 'black' : null);
        }
      }
      assert.deepEqual(found, [expected[id].solution]);
    });
  }

  it('P2 D3 has exactly the eight stated liberties and all five connected stones', () => {
    const attempt = attemptPuzzle('P2', 'D3') as PuzzleSuccess;
    assert.equal(attempt.solved, true);
    const group = groupAt(attempt.position.board, 'D3')!;
    assert.deepEqual(coordinates(group.stones), ['B3', 'C3', 'D3', 'E3', 'F3']);
    assert.deepEqual(coordinates(group.liberties), ['A3', 'B2', 'B4', 'D2', 'D4', 'F2', 'F4', 'G3']);
  });

  it('P3 is not marked complete before its published white reply', () => {
    const attempt = attemptPuzzle('P3', 'C5') as PuzzleSuccess;
    assert.equal(evaluatePuzzle('P3', attempt.first.position), false);
    assert.equal(evaluatePuzzle('P3', attempt.position), true);
    assert.equal(attempt.position.board[indexOf('F5')], 'white');
    assert.equal(attempt.position.board[indexOf('F6')], 'white');
    assert.equal(p3ReplyFor('c5'), 'F6');
    assert.equal(p3ReplyFor(indexOf('F6')), 'C5');
  });

  it('P3 rejects an arbitrary white reply as evidence of the lesson goal', () => {
    const black = success(play(initialFor('P3'), 'C5')).position;
    const notTheScript = success(play(black, 'A1')).position;
    assert.equal(evaluatePuzzle('P3', notTheScript), false);
  });

  it('goal evaluation never mistakes an unrelated setup for a solved puzzle', () => {
    const unrelated = success(play(createPosition(), 'D5')).position;
    for (const id of ['P1', 'P2', 'P3'] as PuzzleId[]) assert.equal(evaluatePuzzle(id, unrelated), false);
    for (const id of ['P1', 'P2', 'P3'] as PuzzleId[]) assert.equal(evaluatePuzzle(id, initialFor(id)), false);
  });

  it('all published data and attempts are immutable independent snapshots', () => {
    assert.ok(Object.isFrozen(PUZZLES));
    assert.ok(Object.isFrozen(PUZZLES.P1.black));
    const first = attemptPuzzle('P3', 'F6') as PuzzleSuccess;
    const second = attemptPuzzle('P3', 'C5') as PuzzleSuccess;
    assert.ok(Object.isFrozen(first.steps));
    assert.equal(first.position.board[indexOf('C3')], null);
    assert.equal(second.position.board[indexOf('C3')], 'black');
    assert.equal(first.steps[0].board[indexOf('C3')], 'black');
    assert.equal(first.steps[1].board[indexOf('F5')], null);
    assert.equal(second.steps[0].board[indexOf('F5')], 'white');
  });
});

describe('Replay starts from the shared P2 setup', () => {
  it('A connects at D3 while B D4, White D3 leaves the strings separate', () => {
    const a = p2Line('A');
    const b = p2Line('B');
    assert.equal(a.length, 2);
    assert.equal(b.length, 3);
    assert.deepEqual(a[0], b[0]);
    assert.equal(a[1].board[indexOf('D3')], 'black');
    assert.equal(a[1].board[indexOf('D4')], null);
    assert.equal(b[1].board[indexOf('D3')], null);
    assert.equal(b[1].board[indexOf('D4')], 'black');
    assert.equal(b[2].board[indexOf('D3')], 'white');
    assert.equal(b[2].board[indexOf('D4')], 'black');
    assert.equal(b[2].captures.black + b[2].captures.white, 0);
    assert.equal(groupAt(a[1].board, 'B3')!.stones.includes(indexOf('F3')), true);
    assert.equal(groupAt(b[2].board, 'B3')!.stones.includes(indexOf('F3')), false);
  });

  it('B → initial → A does not retain any stones from the abandoned branch', () => {
    const b = p2Line('B');
    const baseline = b[0];
    const a = p2Line('A');
    assert.deepEqual(baseline.board, initialFor('P2').board);
    assert.equal(baseline.board[indexOf('D3')], null);
    assert.equal(baseline.board[indexOf('D4')], null);
    assert.equal(a[1].board[indexOf('D3')], 'black');
    assert.equal(a[1].board[indexOf('D4')], null);
    assert.equal(b[2].board[indexOf('D3')], 'white');
  });
});
