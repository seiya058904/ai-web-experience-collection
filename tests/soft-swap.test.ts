import test from 'node:test';
import assert from 'node:assert/strict';
import { layerOpacity, softText, steppedIndex } from '../experiences/shared/soft-swap.ts';

function textFixture() {
  const animations: { onfinish: (() => void) | null; cancelled: boolean; cancel(): void }[] = [];
  const element = {
    textContent: 'Before', isConnected: true,
    animate() {
      const animation = { onfinish: null as (() => void) | null, cancelled: false, cancel() { this.cancelled = true; } };
      animations.push(animation);
      return animation;
    },
  };
  return { element: element as unknown as HTMLElement, animations };
}

for (const phase of ['out', 'in']) {
  test(`instant text settles the same pending value during fade ${phase}`, () => {
    const { element, animations } = textFixture();
    softText(element, 'After');
    if (phase === 'in') animations[0].onfinish!();
    const pending = animations.at(-1)!;
    softText(element, 'After', { instant: true });
    assert.equal(element.textContent, 'After');
    assert.equal(pending.cancelled, true, 'a motion preference change cancels the active fade');
    softText(element, 'Latest', { instant: true });
    pending.onfinish!();
    assert.equal(element.textContent, 'Latest', 'a stale completion cannot restore old words');
    assert.equal(animations.length, phase === 'out' ? 1 : 2, 'settling creates no animation');
  });
}

test('rapid text changes coalesce into the latest words at the invisible handoff', () => {
  const { element, animations } = textFixture();
  softText(element, 'Middle');
  softText(element, 'Latest');
  assert.equal(element.textContent, 'Before');
  assert.equal(animations.length, 1);
  animations[0].onfinish!();
  assert.equal(element.textContent, 'Latest');
  animations[1].onfinish!();
  softText(element, 'Latest');
  assert.equal(animations.length, 2, 'unchanged settled text does not fade again');
});

test('a stepped index holds its step inside the dead band and follows outside it', () => {
  assert.equal(steppedIndex(1.2, undefined), 1);
  assert.equal(steppedIndex(1.55, 1), 1, 'just past the half-way point stays');
  assert.equal(steppedIndex(1.45, 2), 2, 'just before it on the way back stays');
  assert.equal(steppedIndex(1.6, 1), 2);
  assert.equal(steppedIndex(1.4, 2), 1);
  assert.equal(steppedIndex(3.9, 0), 4, 'a jump resolves directly');
  // Oscillating around a boundary never alternates.
  let step = steppedIndex(1.5, undefined);
  const seen = new Set<number>();
  for (const p of [1.47, 1.53, 1.48, 1.52, 1.5]) { step = steppedIndex(p, step); seen.add(step); }
  assert.equal(seen.size, 1);
});

test('stacked layers hold, then the next one fades in above an opaque one', () => {
  assert.equal(layerOpacity(0, 0), 1);
  assert.equal(layerOpacity(3.7, 0), 1, 'the base layer never fades');
  assert.equal(layerOpacity(0, 1), 0);
  assert.equal(layerOpacity(.2, 1), 0, 'each still holds before the next starts');
  assert.equal(layerOpacity(.5, 1), .5);
  assert.equal(layerOpacity(.8, 1), 1);
  for (let p = 0; p <= 4; p += .01) {
    const values = [0, 1, 2, 3, 4].map(i => layerOpacity(p, i));
    values.forEach(v => assert.ok(v >= 0 && v <= 1));
    for (let i = 1; i < 5; i++) assert.ok(values[i] <= values[i - 1] + 1e-9, 'a later layer is never ahead of an earlier one');
  }
});
