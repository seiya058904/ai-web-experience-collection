import test from 'node:test';
import assert from 'node:assert/strict';
import { engineeringStudy, mobileMoon, studyAmount } from '../experiences/orbital/lib/orbital/study.ts';

test('propellant/exhaust path stays registered to the moving engine group', () => {
  for (const split of [0, .4, 1.25, 1.55]) {
    const paths = engineeringStudy('propulsion', split);
    const engineFeed = paths[0].points.at(-1)!;
    assert.equal(engineFeed[0], -.25 * split);
    assert.equal(engineFeed[1], -5.6 - 1.6 * split);
    assert.ok(paths[1].points.at(-1)![1] < engineFeed[1], 'exhaust leaves below the engine');
  }
});

test('four system explanations have distinct, finite shapes and Whole vehicle restores an unmarked object', () => {
  const signatures = new Set<string>();
  for (const system of ['propulsion', 'structure', 'guidance', 'payload'] as const) {
    for (const split of [0, .8, 1.55]) for (const path of engineeringStudy(system, split)) {
      assert.ok(path.points.length >= 2);
      for (const point of path.points) assert.ok(point.every(Number.isFinite));
    }
    signatures.add(JSON.stringify(engineeringStudy(system, 1.55)));
  }
  assert.equal(signatures.size, 4);
  assert.deepEqual(engineeringStudy('overview', 1.55), []);
  assert.equal(studyAmount(4.36, 'overview'), 0);
  for (const progress of [0, 3.95, 5, 8]) assert.equal(studyAmount(progress, 'guidance'), 0);
  assert.equal(studyAmount(4.36, 'guidance'), 1);
});

test('payload envelope follows the fairing and surrounds its original local height', () => {
  for (const split of [0, 1.55]) {
    const envelope = engineeringStudy('payload', split)[0].points;
    const ys = envelope.map(point => point[1]);
    assert.equal(Math.min(...ys), 3.45 + 1.55 * split);
    assert.ok(Math.max(...ys) > 5.3 + 1.55 * split);
  }
});

test('phone Moon stays in the measured free space between text and progress controls', () => {
  for (const [width, height, copyBottom, footerTop] of [[320, 568, 417, 502], [390, 844, 504, 778], [430, 932, 518, 866], [390, 667, 433, 601]]) {
    const moon = mobileMoon(width, height, { copyBottom, footerTop, machineBottom: 0 });
    assert.ok(moon.radius > 0);
    assert.ok(moon.y - moon.radius >= copyBottom + 11.9);
    assert.ok(moon.y + moon.radius <= footerTop - 11.9);
  }
});
