import test from 'node:test';
import assert from 'node:assert/strict';
import { boardFrom, emptyBoard } from '../src/engine.ts';
import { createObservationNote, type NotePanel } from '../src/note.ts';

function panels(): NotePanel[] {
  return [
    { id: 'P1', title: 'The last liberty', board: boardFrom(['C4', 'D3', 'E4', 'D5']), example: false, caption: 'White D4 has been captured.', attempts: [
      { coord: 'A1', legal: true, seen: 1, solved: false, explanation: 'D4 still has one liberty. You can undo and try again.' },
      { coord: 'D5', legal: true, seen: 1, solved: true, explanation: 'White D4 has no liberties and leaves the board.' },
    ] },
    { id: 'P2', title: 'A small bridge', board: boardFrom(['B3', 'C3', 'D3', 'E3', 'F3'], ['C2', 'C4', 'E2', 'E4']), example: true, caption: 'Five black stones share eight liberties.', attempts: [] },
    { id: 'P3', title: 'Letting one go', board: boardFrom(['E5', 'F4', 'G5', 'F6'], ['B3', 'B4', 'C2', 'D3', 'D4', 'C5']), example: false, caption: 'The marked pair has been captured.', attempts: [
      { coord: 'F6', legal: true, seen: 2, solved: false, explanation: 'Black captured F5. White C5 then captured C3 and C4.' },
    ] },
  ];
}

test('exports all three panels and clearly identifies real observations and unplayed examples', () => {
  const svg = createObservationNote(panels());
  assert.match(svg, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
  assert.match(svg, /<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  assert.equal((svg.match(/data-panel=/g) ?? []).length, 3);
  assert.equal((svg.match(/>Your observation</g) ?? []).length, 2);
  assert.equal((svg.match(/>Example — not played</g) ?? []).length, 1);
  assert.match(svg, /xml:lang="en"/);
  assert.match(svg, /Local goals; no whole-game score/);
  assert.doesNotMatch(svg, /<image|<script|<foreignObject|href=|@font-face|https:\/\//);
});

test('49 intersections per board, with A1 bottom-left and G7 top-right', () => {
  const svg = createObservationNote(panels());
  const boards = [...svg.matchAll(/<g id="board-(P[123])"[\s\S]*?(?=<text x="510")/g)].map(match => match[0]);
  assert.equal(boards.length, 3);
  for (const board of boards) {
    const points = [...board.matchAll(/data-coord="([A-G][1-7])" data-cell="(empty|black|white)" transform="translate\((\d+) (\d+)\)"/g)];
    assert.equal(points.length, 49);
    assert.equal(new Set(points.map(point => point[1])).size, 49);
    const a1 = points.find(point => point[1] === 'A1')!;
    const g7 = points.find(point => point[1] === 'G7')!;
    assert.ok(Number(a1[3]) < Number(g7[3]));
    assert.ok(Number(a1[4]) > Number(g7[4]));
    for (const point of points) {
      const col = 'ABCDEFG'.indexOf(point[1][0]);
      const row = Number(point[1][1]) - 1;
      assert.equal(Number(point[3]), Number(a1[3]) + col * 45);
      assert.equal(Number(point[4]), Number(a1[4]) - row * 45);
    }
  }
});

test('each exported stone matches the passed board, and captured stones stay empty', () => {
  const input = panels();
  const svg = createObservationNote(input);
  for (const panel of input) {
    const section = svg.split(`<g id="observation-${panel.id}"`)[1].split('<g id="observation-')[0];
    const points = [...section.matchAll(/data-coord="([A-G][1-7])" data-cell="(empty|black|white)"/g)];
    assert.equal(points.length, 49);
    for (const [index, cell] of panel.board.entries()) {
      const coord = `${'ABCDEFG'[index % 7]}${Math.floor(index / 7) + 1}`;
      assert.equal(points.find(point => point[1] === coord)![2], cell ?? 'empty');
    }
    assert.equal((section.match(/data-stone=/g) ?? []).length, panel.board.filter(Boolean).length);
  }
  const first = svg.split('id="board-P1"')[1].split('id="board-P2"')[0];
  assert.match(first, /data-coord="D4" data-cell="empty"/);
});

test('keeps mistakes, rejections, later solutions and their chronological order', () => {
  const input = panels();
  input[0].attempts.splice(1, 0, { coord: 'D3', legal: false, seen: 0, solved: false, explanation: 'D3 is occupied. The board does not change.' });
  const svg = createObservationNote(input);
  const start = svg.indexOf('Black A1');
  const invalid = svg.indexOf('Black D3');
  const solved = svg.indexOf('Black D5');
  assert.ok(start < invalid && invalid < solved);
  assert.match(svg, /Rejected — board unchanged/);
  assert.match(svg, /D3 is occupied/);
  assert.equal((svg.match(/data-attempt=/g) ?? []).length, 4);
  assert.equal((svg.match(/Goal reached/g) ?? []).length, 1);
  assert.doesNotMatch(svg, /first try|100%|points earned|completed in/i);
});

test('a not-yet-viewed white response is never invented by the exporter', () => {
  const input = panels();
  input[2].board = boardFrom(['C3', 'C4', 'E5', 'F4', 'G5', 'C5'], ['B3', 'B4', 'C2', 'D3', 'D4', 'F5']);
  input[2].caption = 'Your first move is on the board. White reply not yet viewed.';
  input[2].attempts = [{ coord: 'C5', legal: true, seen: 1, solved: false, explanation: 'White reply not yet viewed.' }];
  const svg = createObservationNote(input);
  const section = svg.split('id="observation-P3"')[1];
  assert.match(section, /White reply not yet viewed/);
  assert.match(section, /data-coord="F5" data-cell="white"/);
  assert.match(section, /data-coord="F6" data-cell="empty"/);
  assert.doesNotMatch(section, /Goal reached|White F6|White C5 then/);
});

test('escapes XML metacharacters and removes invalid XML control characters', () => {
  const input = panels();
  input[0].title = 'Stone <&> "test"';
  input[0].caption = "Keep O'Brien & <stones>";
  input[0].attempts = [{ coord: '<script>', legal: false, seen: 0, solved: false, explanation: 'A&B <danger> "quoted" \'apostrophe\'\u0000\u0001' }];
  const svg = createObservationNote(input);
  assert.match(svg, /Stone &lt;&amp;&gt; &quot;test&quot;/);
  assert.match(svg, /O&apos;Brien &amp; &lt;stones&gt;/);
  assert.match(svg, /Black &lt;script&gt;/);
  assert.match(svg, /A&amp;B &lt;danger&gt; &quot;quoted&quot; &apos;apostrophe&apos;/);
  assert.doesNotMatch(svg, /\u0000|\u0001|<script>/);
});

test('long explanations and arbitrary record counts expand the viewBox without clipping', () => {
  const input = panels();
  const small = createObservationNote(input);
  input[0].title = 'A very long title with enough words to need several readable lines';
  input[0].caption = Array.from({ length: 40 }, (_, index) => `caption${index}`).join(' ');
  input[0].attempts = Array.from({ length: 80 }, (_, index) => ({
    coord: 'A1', legal: true, seen: 1, solved: false,
    explanation: `Record${index} ` + 'An explanatory sentence with room to wrap safely. '.repeat(8) + `EndRecord${index}`,
  }));
  const svg = createObservationNote(input);
  const height = Number(svg.match(/<svg[^>]* height="(\d+)"/)![1]);
  const smallHeight = Number(small.match(/<svg[^>]* height="(\d+)"/)![1]);
  assert.ok(height > smallHeight * 3);
  for (let index = 0; index < 80; index++) {
    assert.match(svg, new RegExp(`Record${index}(?: |<)`));
    assert.match(svg, new RegExp(`EndRecord${index}(?: |<)`));
  }
  const ys = [...svg.matchAll(/\by="(\d+)"/g)].map(match => Number(match[1]));
  assert.ok(Math.max(...ys) < height - 20);
  const bounds = [...svg.matchAll(/data-top="(\d+)" data-bottom="(\d+)"/g)];
  assert.equal(bounds.length, 3);
  for (let index = 1; index < bounds.length; index++) {
    assert.ok(Number(bounds[index][1]) >= Number(bounds[index - 1][2]));
  }
});

test('does not mutate input and produces deterministic bytes', () => {
  const input = panels();
  const before = JSON.stringify(input);
  const first = createObservationNote(input);
  assert.equal(createObservationNote(input), first);
  assert.equal(JSON.stringify(input), before);
});

test('unbroken wide characters wrap without losing text or producing an over-wide line', () => {
  const input = panels();
  input[0].attempts = [{ coord: 'A1', legal: true, seen: 1, solved: false, explanation: 'W'.repeat(243) }];
  const svg = createObservationNote(input);
  const wrapped = [...svg.matchAll(/<tspan[^>]*>(W+)<\/tspan>/g)].map(match => match[1]);
  assert.equal(wrapped.join(''), 'W'.repeat(243));
  assert.ok(wrapped.every(line => line.length <= 41));
});

test('rejects invalid board lengths and duplicated/missing puzzle identities', () => {
  const input = panels();
  input[0].board = emptyBoard().slice(0, 48);
  assert.throws(() => createObservationNote(input), /49/);
  assert.throws(() => createObservationNote(panels().slice(0, 2)), /exactly once/);
  const duplicates = panels();
  duplicates[1].id = 'P1';
  assert.throws(() => createObservationNote(duplicates), /exactly once/);
});
