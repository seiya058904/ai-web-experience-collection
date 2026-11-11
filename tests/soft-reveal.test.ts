import test from 'node:test';
import assert from 'node:assert/strict';
import { revealMask } from '../experiences/shared/soft-reveal.ts';

test('a fully shown or fully hidden clip maps to no mask or an empty mask', () => {
  assert.equal(revealMask('inset(0)', 800, 600), 'none');
  assert.equal(revealMask('none', 800, 600), 'none');
  assert.equal(revealMask('inset(0 100% 0 0)', 800, 600), 'linear-gradient(#0000,#0000)');
  assert.equal(revealMask('inset(100%)', 800, 600), 'linear-gradient(#0000,#0000)');
});

test('an inset edge becomes a feathered gradient that is empty at the start and opaque at the end', () => {
  const start = revealMask('inset(0 0 0 99%)', 800, 600, { feather: 20 })!;
  const end = revealMask('inset(0 0 0 0.5%)', 800, 600, { feather: 20 })!;
  assert.match(start, /^linear-gradient\(90deg,/);
  // 99% hidden: the opaque stop is still beyond the right edge
  const stop = (value: string) => Number(value.match(/#000 ([-\d.]+)%/)![1]);
  assert.ok(stop(start) > 100 - 1);
  assert.ok(stop(end) <= 20);
});

test('two hidden edges intersect and each side points away from its edge', () => {
  const mask = revealMask('inset(10% 0 0 30%)', 800, 600)!;
  assert.match(mask, /linear-gradient\(90deg,.*\),linear-gradient\(180deg,/);
});

test('circles and ellipses become radial masks with a band that vanishes once they leave the box', () => {
  const small = revealMask('circle(20% at 40% 30%)', 800, 600)!;
  const large = revealMask('circle(150% at 40% 30%)', 800, 600)!;
  assert.match(small, /^radial-gradient\(/);
  const inner = (value: string) => Number(value.match(/#000 ([\d.]+)%,#0000 100%/)![1]);
  assert.ok(inner(small) < inner(large));
  assert.equal(inner(large), 100);
  assert.match(revealMask('ellipse(60% 80% at 100% 78%)', 800, 600)!, /at 100% 78%/);
  assert.match(revealMask('circle(30% at 120px 340.5px)', 800, 600)!, /at 120px 340.5px/);
});

test('shapes that cannot be feathered are left for a hard clip', () => {
  assert.equal(revealMask("path('M0 0L10 10Z')", 800, 600), null);
  assert.equal(revealMask('polygon(0 0,100% 0,100% 100%)', 800, 600), null);
});
