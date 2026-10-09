import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleJourney } from '../experiences/glasshouse/src/journey.js';
import { sampleFallback } from '../experiences/glasshouse/src/fallback-scene.js';

const state = { material: 'clear', lightAngle: 0, daylight: 0 };
const frame = (p, controls = state, portrait = false) => sampleFallback(sampleJourney(p), 1.25, controls, portrait ? 390 : 1440, portrait ? 844 : 900, portrait);
const vertices = f => f.panes.flatMap(p => p.points.flat());

test('all five chapter boundaries interpolate the same eight pane identities without a geometric reset', () => {
  for (let chapter = 1; chapter < 6; chapter++) {
    const a = frame(chapter / 6 - 1e-8), b = frame(chapter / 6 + 1e-8);
    assert.equal(a.panes.length, 8); assert.deepEqual(a.panes.map(p => p.id), b.panes.map(p => p.id));
    const av = vertices(a), bv = vertices(b);
    assert.ok(Math.max(...av.map((v, i) => Math.abs(v - bv[i]))) < .001, `boundary${chapter} must not replace pose geometry`);
  }
});
test('reverse traversal reconstructs identical finite diagrams without frame history', () => {
  const positions = Array.from({ length: 121 }, (_, i) => i / 120);
  const forward = positions.map(p => frame(p, state, true));
  positions.reverse().forEach((p, i) => {
    const reverse = frame(p, state, true);
    assert.deepEqual(reverse, forward[120 - i]);
    assert.ok(vertices(reverse).every(Number.isFinite));
    assert.ok(reverse.panes.every(pane => pane.life >= 0 && pane.life <= 1));
  });
});
test('material and angle controls change their own optical diagram at fixed scroll', () => {
  const clear = frame(1.45 / 6), frosted = frame(1.45 / 6, { ...state, material: 'frosted' });
  assert.notEqual(clear.panes[1].alpha, frosted.panes[1].alpha);
  assert.deepEqual(vertices(clear), vertices(frosted));
  const beam = frame(2.45 / 6), turned = frame(2.45 / 6, { ...state, lightAngle: 45 });
  assert.notDeepEqual(beam.beam.incoming, turned.beam.incoming);
  assert.deepEqual(vertices(beam), vertices(turned));
  const house = frame(5.45 / 6), sun = frame(5.45 / 6, { ...state, daylight: 40 });
  assert.notEqual(house.ambient.fx, sun.ambient.fx);
  assert.deepEqual(vertices(house), vertices(sun));
});
