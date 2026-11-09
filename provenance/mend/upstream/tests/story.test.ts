import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateStory } from '../src/story.ts';

// Deliberately unequal chapter lengths stand in for real, flowing content.
const anchors = [0, 1350, 2600, 4010, 5300, 6920, 8200, 9780, 11100, 13000];
const at = (y: number) => evaluateStory(y, anchors, 1750, 900);

test('all nine handovers are continuous at both anchors, and reversible', () => {
  for (let i = 0; i < 9; i++) {
    const end = anchors[i + 1];
    assert.ok(Math.abs(at(end - .001).pose - at(end).pose) < .00001);
    const samples = [0, .25, .5, .75, 1].map(t => anchors[i] + (end - anchors[i]) * (.36 + t * .64));
    const forward = samples.map(y => at(y).pose);
    const reverse = [...samples].reverse().map(y => at(y).pose).reverse();
    assert.deepEqual(reverse, forward);
    assert.ok(forward.every((n, j) => j === 0 || n >= forward[j - 1]));
    assert.ok(Math.abs(forward[0] - i) < 1e-9);
    assert.ok(Math.abs(forward[4] - (i + 1)) < 1e-9);
  }
});

test('the road does not move in chapter eight or jump at chapter nine entry', () => {
  assert.equal(at(anchors[8] - .001).roadProgress, 0);
  assert.equal(at(anchors[8]).roadProgress, 0);
  const distance = anchors[9] - anchors[8];
  assert.ok(Math.abs(at(anchors[8] + distance * .18).roadProgress - .5) < 1e-9);
  assert.equal(at(anchors[8] + distance * .36).roadProgress, 1);
  assert.equal(at(anchors[9]).roadProgress, 1);
});

test('direct entry, overscroll and ending stay within the authored story', () => {
  assert.equal(at(-90).pose, 0);
  assert.equal(at(anchors[5]).pose, 5);
  assert.equal(at(anchors[9] + 9000).pose, 9);
  assert.equal(at(anchors[9] + 9000).chapter, 9);
});
