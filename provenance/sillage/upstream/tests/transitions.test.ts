import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateTransition, transitionMarkup, TRANSITION_COPY } from '../src/transitions.ts';
import type { TransitionIndex, TransitionFrame } from '../src/transitions.ts';

const states = [0, .25, .5, .75, 1];
const indices = Array.from({ length: 9 }, (_, i) => i as TransitionIndex);

function assertFrame(frame: TransitionFrame): void {
  assert.equal(frame.prints.length, 3);
  for (const print of frame.prints) {
    for (const number of [print.x, print.y, print.scale, print.opacity, print.rotation, print.separation, ...print.parts]) {
      assert.ok(Number.isFinite(number));
    }
    assert.ok(print.scale > 0 && print.scale <= 1.2);
    assert.ok(print.opacity >= 0 && print.opacity <= 1);
    assert.ok(print.parts.every(part => part >= 0 && part <= 1));
    assert.ok(['arrival', 'unfolding', 'afterglow'].includes(print.phase));
    assert.ok(['personal', 'original'].includes(print.source));
  }
  for (const number of [frame.pathOpacity, frame.pathReveal, frame.baseline, frame.leftMemory, frame.rightMemory, frame.memoryRetreat, frame.labels]) {
    assert.ok(Number.isFinite(number) && number >= 0 && number <= 1);
  }
  assert.ok(frame.prints.some(print => print.opacity > .1), 'No transition is allowed to erase the entire impression');
  assert.ok(frame.caption.length > 0);
}

for (const index of indices) {
  for (const progress of states) {
    test(`transition ${index + 1}: directly evaluate ${(progress * 100).toFixed(0)}% on both layouts`, () => {
      assertFrame(evaluateTransition(index, progress));
      assertFrame(evaluateTransition(index, progress, true));
    });
  }
}

test('all nine transitions reproduce the same scene after arbitrary forward and reverse visits', () => {
  const order = [.9, .05, .75, 0, .5, 1, .23, .23, .62, .01, .99, .5];
  for (const index of indices) {
    const baseline = evaluateTransition(index, .5, true, 2);
    for (const p of order) assertFrame(evaluateTransition(index, p, true, 2));
    assert.deepEqual(evaluateTransition(index, .5, true, 2), baseline);
    for (const p of order.toReversed()) assertFrame(evaluateTransition(index, p, true, 2));
    assert.deepEqual(evaluateTransition(index, .5, true, 2), baseline);
  }
});

test('out-of-range progress clamps to complete boundary states', () => {
  for (const index of indices) {
    assert.deepEqual(evaluateTransition(index, -10), evaluateTransition(index, 0));
    assert.deepEqual(evaluateTransition(index, 10), evaluateTransition(index, 1));
    assert.deepEqual(evaluateTransition(index, Number.NaN), evaluateTransition(index, 0));
  }
});

test('Hero handoff separates exactly one real component per slot', () => {
  for (const p of states) {
    const frame = evaluateTransition(0, p);
    assert.deepEqual(frame.prints.map(print => print.parts), [[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
  }
  const start = evaluateTransition(0, 0);
  const end = evaluateTransition(0, 1);
  assert.equal(start.prints[0].x, start.prints[1].x);
  assert.equal(start.prints[1].x, start.prints[2].x);
  assert.ok(end.prints[0].x < end.prints[1].x && end.prints[1].x < end.prints[2].x);
  const mobile = evaluateTransition(0, 1, true);
  assert.ok(mobile.prints[0].y < mobile.prints[1].y && mobile.prints[1].y < mobile.prints[2].y);
});

test('three qualities remain present in every final stage and the chord reunites at one centre', () => {
  const phases = evaluateTransition(1, 1);
  assert.deepEqual(phases.prints.map(print => print.phase), ['arrival', 'unfolding', 'afterglow']);
  assert.ok(phases.prints.every(print => print.parts.every(part => part === 1)));
  const chord = evaluateTransition(2, 1);
  assert.equal(chord.prints[1].opacity, 1);
  assert.equal(chord.prints[1].separation, 0);
  assert.equal(chord.prints[0].opacity + chord.prints[2].opacity, 0);
});

test('subtraction preserves the reference and removes only the requested component', () => {
  for (const missing of [0, 1, 2] as const) {
    const frame = evaluateTransition(3, 1, false, missing);
    assert.deepEqual(frame.prints[0].parts, [1, 1, 1]);
    assert.equal(frame.prints[0].scale, frame.prints[1].scale);
    frame.prints[1].parts.forEach((value, i) => assert.equal(value, i === missing ? 0 : 1));
    assert.deepEqual(evaluateTransition(4, 0, false, missing).prints[1].parts, frame.prints[1].parts);
  }
  assert.deepEqual(evaluateTransition(3, 1, false, null).prints[1].parts, [1, 1, 1]);
});

test('the comparison-to-path slot is invisible while its component presence changes', () => {
  const before = evaluateTransition(4, .45999, false, 1).prints[1];
  const after = evaluateTransition(4, .46001, false, 1).prints[1];
  assert.equal(before.opacity, 0);
  assert.equal(after.opacity, 0);
  assert.equal(before.parts[1], 0);
  assert.equal(after.parts[1], 1);
  const complete = evaluateTransition(4, 1);
  assert.equal(complete.pathOpacity, 1);
  assert.equal(complete.pathReveal, 1);
  assert.ok(complete.prints[0].scale > complete.prints[1].scale && complete.prints[1].scale > complete.prints[2].scale);
});

test('memory entrance and exit keep one stable full impression and an actual path at the midpoint', () => {
  const entrance = evaluateTransition(5, 1);
  assert.equal(entrance.leftMemory, 1);
  assert.equal(entrance.rightMemory, 1);
  assert.equal(entrance.prints[2].opacity, 1);
  const midpoint = evaluateTransition(6, .5);
  assert.ok(midpoint.pathOpacity > 0);
  assert.ok(midpoint.leftMemory > 0 && midpoint.rightMemory > 0);
  assert.equal(midpoint.prints[1].opacity, 1);
  const exit = evaluateTransition(6, 1);
  assert.equal(exit.leftMemory + exit.rightMemory, 0);
  assert.ok(exit.prints.every(print => print.opacity === 1));
});

test('only the final two handoffs consume personal composition and original/current compare at the same scale', () => {
  for (const index of indices.slice(0, 7)) {
    for (const p of states) assert.ok(evaluateTransition(index, p).prints.every(print => print.source === 'original'));
  }
  assert.ok(evaluateTransition(7, 1).prints.every(print => print.source === 'personal'));
  const compare = evaluateTransition(8, .5);
  assert.equal(compare.prints[0].source, 'personal');
  assert.equal(compare.prints[1].source, 'original');
  assert.equal(compare.prints[0].scale, compare.prints[1].scale);
  assert.equal(compare.prints[0].phase, compare.prints[1].phase);
  assert.ok(evaluateTransition(8, 1).prints.every(print => print.source === 'personal'));
  assert.deepEqual(evaluateTransition(8, 1).prints.map(print => print.phase).sort(), ['afterglow', 'arrival', 'unfolding']);
});

test('original-to-personal slot ownership changes only while hidden', () => {
  const before = evaluateTransition(8, .73999).prints[1];
  const after = evaluateTransition(8, .74001).prints[1];
  assert.equal(before.opacity, 0);
  assert.equal(after.opacity, 0);
  assert.equal(before.source, 'original');
  assert.equal(after.source, 'personal');
});

test('progress evaluation does not mutate the authored keyframes or returned sibling frames', () => {
  const saved = evaluateTransition(3, .5);
  const changed = evaluateTransition(3, .5);
  changed.prints[0].parts[0] = 0;
  changed.prints[0].x = 99;
  assert.deepEqual(evaluateTransition(3, .5), saved);
});

test('all nine markup boundaries have unique IDs and text equivalents', () => {
  const ids = new Set<string>();
  for (const index of indices) {
    const markup = transitionMarkup(index);
    const id = `tr-${String(index + 1).padStart(2, '0')}-${String(index + 2).padStart(2, '0')}`;
    assert.ok(markup.includes(`id="${id}"`));
    assert.ok(markup.includes(TRANSITION_COPY[index][0]));
    assert.equal((markup.match(/data-transition-slot=/g) ?? []).length, 3);
    for (const match of markup.matchAll(/\bid="([^"]+)"/g)) {
      assert.ok(!ids.has(match[1]), `Duplicate document ID ${match[1]}`);
      ids.add(match[1]);
    }
  }
});
