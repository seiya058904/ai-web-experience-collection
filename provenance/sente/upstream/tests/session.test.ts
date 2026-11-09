import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { boardKey, indexOf } from '../src/engine.ts';
import { initialFor } from '../src/puzzles.ts';
import {
  advanceReply,
  attempt,
  createSession,
  entriesFor,
  puzzleView,
  resetPuzzle,
  restoreSession,
  selectAttempt,
  serializeSession,
  undoPuzzle,
} from '../src/session.ts';
import type { Session } from '../src/session.ts';

function manual(): Session {
  return { ...createSession(), autoReply: false };
}

function saved(): Record<string, any> {
  return JSON.parse(serializeSession(createSession()));
}

describe('A new observation session', () => {
  it('begins with independent puzzle views and all stated preferences', () => {
    const state = createSession();
    assert.equal(state.version, 1);
    assert.equal(state.hero, null);
    assert.equal(state.sound, false);
    assert.equal(state.autoReply, true);
    assert.equal(state.motion, 'system');
    assert.equal(state.libertyExample, 'hero');
    assert.deepEqual(state.branchSteps, { A: 1, B: 2 });
    assert.equal(state.koStage, 0);
    for (const id of ['P1', 'P2', 'P3'] as const) {
      const view = puzzleView(state, id);
      assert.deepEqual(view.position, initialFor(id));
      assert.equal(view.attempt, null);
      assert.equal(view.step, 0);
      assert.equal(view.complete, false);
      assert.deepEqual(entriesFor(state, id), []);
    }
  });

  it('freezes its nested records while allowing immutable preference spreads', () => {
    const original = createSession();
    const state: Session = { ...original, hero: 'G7', sound: true, motion: 'reduced' };
    assert.equal(original.hero, null);
    assert.equal(original.sound, false);
    assert.ok(Object.isFrozen(original.puzzles));
    assert.ok(Object.isFrozen(original.puzzles.P1.attempts));
    assert.deepEqual(restoreSession(serializeSession(state)), state);
  });
});

describe('First attempts, invalid inputs and undo', () => {
  it('retains a legal non-solution and requires an explicit undo before another first move', () => {
    const first = attempt(createSession(), 'P1', 'A1');
    const view = puzzleView(first, 'P1');
    assert.equal(view.step, 1);
    assert.equal(view.complete, false);
    assert.equal(view.position.board[indexOf('A1')], 'black');
    assert.equal(view.position.board[indexOf('D4')], 'white');
    assert.equal(attempt(first, 'P1', 'D5'), first);
    assert.equal(first.puzzles.P1.attempts.length, 1);
    const initial = undoPuzzle(first, 'P1');
    const second = attempt(initial, 'P1', 'D5');
    assert.equal(puzzleView(second, 'P1').complete, true);
    assert.deepEqual(second.puzzles.P1.attempts, [{ coord: 'A1', seen: 1 }, { coord: 'D5', seen: 1 }]);
    assert.equal(first.puzzles.P1.attempts.length, 1);
    assert.equal(puzzleView(second, 'P2').step, 0);
  });

  it('records occupied attempts with a real rejection and no changed board', () => {
    const state = attempt(createSession(), 'P1', 'D4');
    assert.deepEqual(state.puzzles.P1.attempts, [{ coord: 'D4', seen: 0 }]);
    assert.equal(state.puzzles.P1.active, 0);
    const view = puzzleView(state, 'P1');
    assert.deepEqual(view.position, initialFor('P1'));
    assert.equal(view.step, 0);
    assert.equal(view.complete, false);
    assert.equal(view.attempt?.ok, false);
    if (view.attempt && !view.attempt.ok) assert.equal(view.attempt.reason, 'occupied');
    assert.equal(entriesFor(state, 'P1')[0].legal, false);
    assert.match(entriesFor(state, 'P1')[0].explanation, /already occupied/);
  });

  it('keeps out-of-range text as data and canonicalizes valid coordinates', () => {
    let state = attempt(createSession(), 'P1', 'H8');
    state = attempt(state, 'P1', ' d5 ');
    assert.deepEqual(state.puzzles.P1.attempts, [{ coord: 'H8', seen: 0 }, { coord: 'D5', seen: 1 }]);
    assert.equal(entriesFor(state, 'P1')[0].legal, false);
    assert.equal(entriesFor(state, 'P1')[1].solved, true);
    assert.deepEqual(restoreSession(serializeSession(state)), state);
  });

  it('does not switch a retained successful active attempt on an invalid first move', () => {
    const solved = attempt(createSession(), 'P1', 'D5');
    const undone = undoPuzzle(solved, 'P1');
    const invalid = attempt(undone, 'P1', 'D4');
    assert.equal(invalid.puzzles.P1.active, 0);
    assert.equal(invalid.puzzles.P1.step, 0);
    assert.equal(puzzleView(invalid, 'P1').attempt?.ok, true);
    assert.deepEqual(puzzleView(invalid, 'P1').position, initialFor('P1'));
    assert.equal(entriesFor(invalid, 'P1').at(-1)!.legal, false);
    assert.deepEqual(invalid.puzzles.P1.attempts.map(item => item.seen), [1, 0]);
  });

  it('reset returns to the exact initial position and preserves all history', () => {
    const solved = attempt(createSession(), 'P2', 'D3');
    const reset = resetPuzzle(solved, 'P2');
    assert.equal(reset.puzzles.P2.active, null);
    assert.equal(reset.puzzles.P2.step, 0);
    assert.deepEqual(reset.puzzles.P2.attempts, solved.puzzles.P2.attempts);
    assert.deepEqual(puzzleView(reset, 'P2').position, initialFor('P2'));
    assert.equal(entriesFor(reset, 'P2')[0].solved, true);
    assert.equal(resetPuzzle(reset, 'P2'), reset);
    assert.equal(undoPuzzle(reset, 'P2'), reset);
  });
});

describe('P3 observes only the steps actually displayed', () => {
  it('automatic reply observes both real moves and records their exact consequences', () => {
    const state = attempt(createSession(), 'P3', 'F6');
    const view = puzzleView(state, 'P3');
    assert.equal(view.step, 2);
    assert.equal(view.complete, false);
    assert.deepEqual(state.puzzles.P3.attempts, [{ coord: 'F6', seen: 2 }]);
    assert.equal(view.position.board[indexOf('F5')], null);
    assert.equal(view.position.board[indexOf('C3')], null);
    assert.equal(view.position.board[indexOf('C4')], null);
    assert.equal(view.position.board[indexOf('C5')], 'white');
    const entry = entriesFor(state, 'P3')[0];
    assert.equal(entry.seen, 2);
    assert.equal(entry.solved, false);
    assert.deepEqual(entry.position, view.position);
    assert.match(entry.explanation, /then captures/);
  });

  it('manual C5 cannot be reported solved before White F6 is actually viewed', () => {
    const state = attempt(manual(), 'P3', 'C5');
    const view = puzzleView(state, 'P3');
    assert.equal(view.step, 1);
    assert.equal(view.complete, false);
    assert.equal(view.position.board[indexOf('C5')], 'black');
    assert.equal(view.position.board[indexOf('F6')], null);
    const entry = entriesFor(state, 'P3')[0];
    assert.equal(entry.seen, 1);
    assert.equal(entry.solved, false);
    assert.equal(entry.position.board[indexOf('F6')], null);
    assert.match(entry.explanation, /has not yet been viewed/);
    const advanced = advanceReply(state);
    assert.equal(puzzleView(advanced, 'P3').complete, true);
    assert.equal(puzzleView(advanced, 'P3').position.board[indexOf('F6')], 'white');
    assert.equal(entriesFor(advanced, 'P3')[0].seen, 2);
    assert.equal(entriesFor(advanced, 'P3')[0].solved, true);
    assert.equal(advanceReply(advanced), advanced);
  });

  it('manual F6 note shows the observed capture without inventing the later loss', () => {
    const state = attempt(manual(), 'P3', 'F6');
    const entry = entriesFor(state, 'P3')[0];
    assert.equal(entry.position.board[indexOf('F5')], null);
    assert.equal(entry.position.board[indexOf('C3')], 'black');
    assert.equal(entry.position.board[indexOf('C4')], 'black');
    assert.equal(entry.position.board[indexOf('C5')], null);
    assert.match(entry.explanation, /captures White at F5/);
    assert.match(entry.explanation, /not yet been viewed/);
    assert.doesNotMatch(entry.explanation, /then captures/);
  });

  it('undo goes 2 → 1 → 0 while retaining the furthest observed step', () => {
    const seenReply = attempt(createSession(), 'P3', 'F6');
    const firstOnly = undoPuzzle(seenReply, 'P3');
    assert.equal(puzzleView(firstOnly, 'P3').step, 1);
    assert.equal(puzzleView(firstOnly, 'P3').position.board[indexOf('C3')], 'black');
    assert.equal(firstOnly.puzzles.P3.attempts[0].seen, 2);
    const initial = undoPuzzle(firstOnly, 'P3');
    assert.equal(puzzleView(initial, 'P3').step, 0);
    assert.deepEqual(puzzleView(initial, 'P3').position, initialFor('P3'));
    assert.equal(entriesFor(initial, 'P3')[0].position.board[indexOf('C3')], null);
    assert.equal(entriesFor(initial, 'P3')[0].seen, 2);
    assert.equal(advanceReply(initial), initial);
    const selected = selectAttempt(initial, 'P3', 0);
    assert.equal(puzzleView(selected, 'P3').step, 2);
    assert.equal(puzzleView(selected, 'P3').position.board[indexOf('C3')], null);
  });

  it('selecting a manual history entry does not fabricate a white reply', () => {
    let state = attempt(manual(), 'P3', 'C5');
    state = resetPuzzle(state, 'P3');
    state = attempt(state, 'P3', 'F6');
    state = advanceReply(state);
    state = selectAttempt(state, 'P3', 0);
    assert.equal(puzzleView(state, 'P3').step, 1);
    assert.equal(puzzleView(state, 'P3').position.board[indexOf('F6')], null);
    assert.deepEqual(entriesFor(state, 'P3').map(entry => entry.seen), [1, 2]);
    assert.deepEqual(entriesFor(state, 'P3').map(entry => entry.solved), [false, false]);
  });
});

describe('History remains complete and isolated', () => {
  it('preserves chronological trial and error, including the last invalid record', () => {
    let state = attempt(createSession(), 'P1', 'D4');
    state = attempt(state, 'P1', 'A1');
    state = undoPuzzle(state, 'P1');
    state = attempt(state, 'P1', 'D5');
    state = resetPuzzle(state, 'P1');
    state = attempt(state, 'P1', 'C4');
    const entries = entriesFor(state, 'P1');
    assert.deepEqual(entries.map(entry => entry.coord), ['D4', 'A1', 'D5', 'C4']);
    assert.deepEqual(entries.map(entry => entry.legal), [false, true, true, false]);
    assert.deepEqual(entries.map(entry => entry.solved), [false, false, true, false]);
    assert.equal(entries.filter(entry => entry.legal).at(-1)!.coord, 'D5');
    state = selectAttempt(state, 'P1', 0);
    assert.equal(puzzleView(state, 'P1').attempt?.ok, false);
    assert.equal(puzzleView(state, 'P1').step, 0);
  });

  it('does not cap or silently remove earlier attempts', () => {
    let state = createSession();
    for (let i = 0; i < 260; i++) state = attempt(state, 'P1', i % 2 ? 'D4' : 'C4');
    assert.equal(state.puzzles.P1.attempts.length, 260);
    const restored = restoreSession(serializeSession(state));
    assert.equal(restored.puzzles.P1.attempts.length, 260);
    assert.deepEqual(restored.puzzles.P1.attempts, state.puzzles.P1.attempts);
    assert.equal(entriesFor(restored, 'P1').length, 260);
  });

  it('Hero and narrative preference changes never reset the three puzzles', () => {
    let state = attempt(createSession(), 'P1', 'D5');
    state = attempt(state, 'P2', 'D3');
    state = attempt(state, 'P3', 'C5');
    const changed: Session = { ...state, hero: null, libertyExample: 'A1', branch: 'B', koStage: 2 };
    for (const id of ['P1', 'P2', 'P3'] as const) {
      assert.equal(puzzleView(changed, id).complete, true);
      assert.equal(changed.puzzles[id], state.puzzles[id]);
    }
  });

  it('ignores invalid history-selection indices and an unavailable next reply', () => {
    const state = createSession();
    for (const index of [-1, 0, 1.5, Infinity, NaN]) assert.equal(selectAttempt(state, 'P1', index), state);
    assert.equal(advanceReply(state), state);
  });
});

describe('Persistence validates metadata and reconstructs trusted boards', () => {
  it('round-trips all preferences, a paused P3 reply and undo state', () => {
    let state: Session = {
      ...manual(), hero: 'A4', heroLiberties: true, libertyExample: 'A1',
      groupPoint: 'F5', groupLiberties: true, sound: true, motion: 'reduced',
      eyesPoint: 'E3', branch: 'B', branchSteps: { A: 0, B: 1 }, koStage: 2,
    };
    state = attempt(state, 'P1', 'D5');
    state = undoPuzzle(state, 'P1');
    state = attempt(state, 'P2', 'D3');
    state = resetPuzzle(state, 'P2');
    state = attempt(state, 'P3', 'F6');
    const restored = restoreSession(serializeSession(state));
    assert.deepEqual(restored, state);
    for (const id of ['P1', 'P2', 'P3'] as const) {
      assert.equal(boardKey(puzzleView(restored, id).position.board), boardKey(puzzleView(state, id).position.board));
      assert.deepEqual(entriesFor(restored, id), entriesFor(state, id));
    }
    assert.equal(entriesFor(restored, 'P3')[0].seen, 1);
    assert.equal(entriesFor(restored, 'P3')[0].solved, false);
  });

  it('never serializes rule boards, computed wins, timestamps or forged extra properties', () => {
    const state = attempt(createSession(), 'P1', 'D5');
    const forged = { ...state, board: ['white'], score: 999, completedAt: 'pretend' };
    const parsed = JSON.parse(serializeSession(forged));
    assert.equal('board' in parsed, false);
    assert.equal('score' in parsed, false);
    assert.equal('completedAt' in parsed, false);
    assert.deepEqual(Object.keys(parsed.puzzles.P1.attempts[0]).sort(), ['coord', 'seen']);
  });

  it('ignores injected boards and goal results when rebuilding an otherwise valid record', () => {
    const forged = JSON.parse(serializeSession(attempt(createSession(), 'P1', 'A1')));
    forged.puzzles.P1.board = Array(49).fill('black');
    forged.puzzles.P1.solved = true;
    forged.puzzles.P1.attempts[0].position = { board: Array(49).fill('black') };
    forged.puzzles.P1.attempts[0].solved = true;
    const restored = restoreSession(JSON.stringify(forged));
    assert.equal(puzzleView(restored, 'P1').complete, false);
    assert.equal(puzzleView(restored, 'P1').position.board[indexOf('D4')], 'white');
    assert.equal(puzzleView(restored, 'P1').position.board[indexOf('A7')], null);
    assert.equal(entriesFor(restored, 'P1')[0].solved, false);
  });

  it('rejects corrupt JSON, unknown versions and malformed root values safely', () => {
    for (const raw of [null, '', '{', 'null', '[]', 'true', '"text"', '{}', '{"version":2}']) {
      assert.deepEqual(restoreSession(raw), createSession());
    }
  });

  it('rejects invalid preferences and impossible view metadata instead of partially applying them', () => {
    const cases: ((data: Record<string, any>) => void)[] = [
      data => { data.hero = 'H8'; },
      data => { data.heroLiberties = 'true'; },
      data => { data.libertyExample = 'C5'; },
      data => { data.groupPoint = 'A1'; },
      data => { data.groupLiberties = 1; },
      data => { data.motion = 'unexpected'; },
      data => { data.sound = 'yes'; },
      data => { data.autoReply = null; },
      data => { data.eyesPoint = 'D3'; },
      data => { data.branch = 'C'; },
      data => { data.branchSteps.A = 2; },
      data => { data.branchSteps.B = -1; },
      data => { data.koStage = 3; },
      data => { data.puzzles.P1.active = 0; },
      data => { data.puzzles.P1.step = 1; },
      data => { data.puzzles.P1.attempts = {}; },
      data => { data.puzzles.P2.hint = 'yes'; },
      data => { delete data.puzzles.P3; },
    ];
    for (const corrupt of cases) {
      const data = saved();
      data.hero = 'G7';
      corrupt(data);
      assert.deepEqual(restoreSession(JSON.stringify(data)), createSession());
    }
  });

  it('rejects fabricated observed steps inconsistent with actual move legality', () => {
    const cases = [
      { id: 'P1', coord: 'D4', seen: 1, step: 1 },
      { id: 'P1', coord: 'D5', seen: 0, step: 0 },
      { id: 'P1', coord: 'D5', seen: 2, step: 1 },
      { id: 'P2', coord: 'D3', seen: 1, step: 2 },
      { id: 'P3', coord: 'C5', seen: 1, step: 2 },
      { id: 'P3', coord: 'F5', seen: 2, step: 2 },
    ];
    for (const example of cases) {
      const data = saved();
      data.puzzles[example.id] = { attempts: [{ coord: example.coord, seen: example.seen }], active: 0, step: example.step, hint: false };
      assert.deepEqual(restoreSession(JSON.stringify(data)), createSession());
    }
  });

  it('does not copy prototype keys or execute invalid coordinate strings', () => {
    const state = attempt(createSession(), 'P1', '<script>bad()</script>');
    const payload = JSON.parse(serializeSession(state));
    Object.defineProperty(payload, '__proto__', { value: { polluted: true }, enumerable: true });
    payload.constructor = { prototype: { polluted: true } };
    const restored = restoreSession(JSON.stringify(payload));
    assert.equal(({} as Record<string, unknown>).polluted, undefined);
    assert.equal(Object.hasOwn(restored, '__proto__'), false);
    assert.equal(Object.hasOwn(restored, 'constructor'), false);
    assert.equal(entriesFor(restored, 'P1')[0].legal, false);
    assert.deepEqual(entriesFor(restored, 'P1')[0].position, initialFor('P1'));
  });
});
