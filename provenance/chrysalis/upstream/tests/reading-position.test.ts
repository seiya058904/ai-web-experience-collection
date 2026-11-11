import test from 'node:test';
import assert from 'node:assert/strict';
import { captureReadingPosition, readReadingPosition, restoreReadingPosition } from '../src/reading-position.ts';

const chapters = [{ id: 'ch-09', top: 22000, height: 1500 }, { id: 'ch-10', top: 25000, height: 1800 }];
const transition = { id: 'tr-09-10', from: 'ch-09', to: 'ch-10', top: 24100.765625, height: 360 };
const metrics = { viewportHeight: 900, chapters, transitions: [transition] };

test('reload retains transition reading fraction when earlier selected content changes document height', () => {
  const saved = captureReadingPosition({ ...metrics, scrollY: 24011 });
  assert.equal(saved.anchor?.kind, 'transition');
  assert.ok(saved.anchor!.fraction > 1, 'The recorded native endpoint lies 0.234375px into the final hold.');
  const observedShift = { ...metrics, transitions: [{ ...transition, top: transition.top + 164 }] };
  assert.equal(restoreReadingPosition(saved, observedShift), 24175, 'The same bridge endpoint follows the measured 164px layout shift.');
  // Use an interior source-owned point; the same Y would become target-owned
  // after an upstream layout shift of the size observed in the browser report.
  const atSource = captureReadingPosition({ ...metrics, scrollY: transition.top + .499565 * transition.height - 450 });
  const shifted = { ...metrics, transitions: [{ ...transition, top: transition.top - 164 }] };
  const restoredY = restoreReadingPosition(atSource, shifted);
  const after = captureReadingPosition({ ...shifted, scrollY: restoredY });
  assert.equal(after.anchor?.id, atSource.anchor?.id);
  assert.ok(after.anchor!.fraction < .5, 'Native pixel rounding must preserve source ownership.');
  assert.ok(Math.abs(after.anchor!.fraction - atSource.anchor!.fraction) <= 1 / transition.height);
  assert.ok(Math.abs(restoredY - atSource.y) > 160, 'A changed layout requires a changed absolute offset.');
});

test('unchanged layout preserves exact native Y; changed chapter dimensions preserve the reading fraction', () => {
  const saved = captureReadingPosition({ ...metrics, scrollY: 22431.25 });
  assert.equal(restoreReadingPosition(saved, metrics), 22431.25);
  assert.equal(saved.anchor?.kind, 'chapter');
  const changed = { ...metrics, viewportHeight: 844, chapters: [{ ...chapters[0]!, top: 21000, height: 1800 }, chapters[1]!] };
  const after = captureReadingPosition({ ...changed, scrollY: restoreReadingPosition(saved, changed) });
  assert.equal(after.anchor?.id, 'ch-09');
  assert.ok(Math.abs(after.anchor!.fraction - saved.anchor!.fraction) < 1e-12);
});

test('changed transition geometry keeps both midpoint owners and endpoints inside their marker', () => {
  for (const fraction of [0, .499565, .5, .500435, 1]) {
    const saved = captureReadingPosition({ ...metrics, scrollY: transition.top + transition.height * fraction - 450 });
    const changed = { ...metrics, viewportHeight: 844, transitions: [{ ...transition, top: 23936.3, height: 253.2 }] };
    const after = captureReadingPosition({ ...changed, scrollY: restoreReadingPosition(saved, changed) });
    assert.equal(after.anchor?.kind, 'transition');
    assert.equal(after.anchor!.fraction < .5, fraction < .5);
    assert.ok(Math.abs(after.anchor!.fraction - fraction) < 1 / 253.2);
  }
});

test('missing semantic anchors and earlier history format keep the native fallback', () => {
  const legacy = readReadingPosition({ y: 1400 });
  assert.ok(legacy);
  assert.equal(restoreReadingPosition(legacy, metrics), 1400);
  const saved = captureReadingPosition({ ...metrics, scrollY: 22400 });
  assert.equal(restoreReadingPosition(saved, { ...metrics, chapters: [] }), saved.y);
  assert.equal(readReadingPosition({ y: Infinity }), null);
  assert.equal(readReadingPosition({ y: 1400, anchor: { fraction: NaN } })?.anchor, null);
});
