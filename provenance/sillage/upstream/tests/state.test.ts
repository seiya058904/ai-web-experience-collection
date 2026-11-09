import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SHARES, DEFAULT_TITLE, PHASES, PRESETS, STORAGE_KEY, TITLE_LIMIT,
  chooseMemory, clamp01, createDemoState, createPersonalState, displayTitle,
  editTitle, escapeXml, lerp, loadState, normalizeShares, phaseShares,
  redistribute, restoreState, sanitizePersonalState, sanitizeTitle, saveState,
  serializeState, smoothstep, withoutComponent,
} from '../src/state.ts';
import type { ComponentIndex, Shares } from '../src/state.ts';

test('the three complete presets are distinct and total 100', () => {
  assert.equal(PRESETS.length, 3);
  assert.equal(new Set(PRESETS.map(preset => preset.shares.join(','))).size, 3);
  for (const preset of PRESETS) {
    assert.equal(preset.shares.reduce((sum, value) => sum + value, 0), 100);
    assert.ok(preset.shares.every(Number.isInteger));
  }
});

test('all 5,151 integer compositions retain exact edited share and total through 92,718 edits', () => {
  let compositions = 0;
  let edits = 0;
  for (let a = 0; a <= 100; a++) {
    for (let b = 0; b <= 100 - a; b++) {
      const original: Shares = [a, b, 100 - a - b];
      compositions++;
      for (const index of [0, 1, 2] as ComponentIndex[]) {
        assert.deepEqual(redistribute(original, index, original[index]), original);
        for (const next of [0, 1, 33, 50, 99, 100]) {
          const result = redistribute(original, index, next);
          assert.equal(result[index], next);
          assert.equal(result[0] + result[1] + result[2], 100);
          assert.ok(result.every(value => Number.isInteger(value) && value >= 0 && value <= 100));
          assert.deepEqual(original, [a, b, 100 - a - b]);
          edits++;
        }
      }
    }
  }
  assert.equal(compositions, 5151);
  assert.equal(edits, 92718);
});

test('rounding unit belongs to the previously larger component; ties are stable', () => {
  assert.deepEqual(redistribute(DEFAULT_SHARES, 0, 70), [70, 10, 20]);
  assert.deepEqual(redistribute(DEFAULT_SHARES, 0, 20), [20, 29, 51]);
  assert.deepEqual(redistribute([0, 50, 50], 0, 99), [99, 1, 0]);
  assert.deepEqual(redistribute([50, 0, 50], 1, 99), [1, 99, 0]);
  assert.deepEqual(redistribute([50, 50, 0], 2, 99), [1, 0, 99]);
});

test('single-component extremes can return to a balanced remainder', () => {
  assert.deepEqual(redistribute([100, 0, 0], 0, 0), [0, 50, 50]);
  assert.deepEqual(redistribute([0, 100, 0], 1, 99), [1, 99, 0]);
  assert.deepEqual(redistribute([0, 0, 100], 2, 45), [28, 27, 45]);
  assert.deepEqual(redistribute(DEFAULT_SHARES, 1, 100), [0, 100, 0]);
});

test('numeric input is bounded; invalid or transient input cannot corrupt composition', () => {
  assert.deepEqual(redistribute(DEFAULT_SHARES, 0, 102.2), [100, 0, 0]);
  assert.equal(redistribute(DEFAULT_SHARES, 0, 49.6)[0], 50);
  assert.equal(redistribute(DEFAULT_SHARES, 0, -10)[0], 0);
  for (const invalid of [NaN, Infinity, -Infinity]) {
    assert.deepEqual(redistribute(DEFAULT_SHARES, 1, invalid), DEFAULT_SHARES);
  }
  assert.throws(() => redistribute(DEFAULT_SHARES, 8 as ComponentIndex, 50), RangeError);
});

test('external shares are repaired deterministically, without zero-total states', () => {
  for (const invalid of [null, {}, [0, 0, 0], [NaN, 2, 3], [1, 2], ['1', 2, 3]]) {
    assert.deepEqual(normalizeShares(invalid), DEFAULT_SHARES);
  }
  assert.deepEqual(normalizeShares([1, 1, 1]), [34, 33, 33]);
  assert.deepEqual(normalizeShares([-4, 20, 200]), [0, 16, 84]);
  assert.deepEqual(normalizeShares([0, 0.001, 0]), [0, 100, 0]);
});

test('every phase preserves the presence and absence of each component in all compositions', () => {
  for (let a = 0; a <= 100; a++) {
    for (let b = 0; b <= 100 - a; b++) {
      const shares: Shares = [a, b, 100 - a - b];
      for (const phase of PHASES) {
        const visual = phaseShares(shares, phase.id);
        assert.ok(Math.abs(visual.reduce((sum, value) => sum + value, 0) - 100) < 1e-10);
        shares.forEach((value, index) => {
          if (value === 0) assert.equal(visual[index], 0);
          else assert.ok(visual[index] > 0);
        });
      }
    }
  }
  assert.ok(phaseShares(DEFAULT_SHARES, 'arrival')[0] > phaseShares(DEFAULT_SHARES, 'afterglow')[0]);
  assert.ok(phaseShares(DEFAULT_SHARES, 'arrival')[2] < phaseShares(DEFAULT_SHARES, 'afterglow')[2]);
});

test('subtraction is temporary and retains the other components at the same scale', () => {
  const personal = createPersonalState();
  const demo = createDemoState();
  demo.missing = 0;
  assert.deepEqual(withoutComponent(personal.shares, demo.missing), [0, 20, 35]);
  assert.deepEqual(personal.shares, DEFAULT_SHARES);
  assert.deepEqual(withoutComponent(personal.shares, null), DEFAULT_SHARES);
  assert.equal(serializeState(personal).includes('missing'), false);
  const another = createPersonalState();
  another.shares[0] = 0;
  assert.deepEqual(personal.shares, DEFAULT_SHARES);
});

test('memory preference suggests a title but never rewrites a deliberate title or shares', () => {
  const initial = createPersonalState();
  const window = chooseMemory(initial, 'window');
  assert.equal(window.title, 'The New Window');
  assert.equal(initial.memory, null);
  const written = editTitle(window, '我自己的余韵 🌿');
  const note = chooseMemory(written, 'note');
  assert.equal(note.title, '我自己的余韵 🌿');
  assert.equal(note.memory, 'note');
  assert.deepEqual(note.shares, DEFAULT_SHARES);
  assert.equal(displayTitle(editTitle(note, '')), 'The Unsent Note');
});

test('titles preserve user language and stay within 64 Unicode code points', () => {
  assert.equal(Array.from(sanitizeTitle('🌿'.repeat(80))).length, TITLE_LIMIT);
  assert.equal(sanitizeTitle('  我的印迹 🌿  '), '  我的印迹 🌿  ');
  assert.equal(sanitizeTitle('a\nb\u0000c'), 'a bc');
  assert.equal(sanitizeTitle(undefined), DEFAULT_TITLE);
  assert.equal(sanitizeTitle('<script>alert(1)</script>'), '<script>alert(1)</script>');
  assert.equal(escapeXml('<svg onload="run()"> & \'title\''), '&lt;svg onload=&quot;run()&quot;&gt; &amp; &apos;title&apos;');
});

test('versioned storage restores exact personal state and rejects malformed envelopes', () => {
  const original = editTitle(chooseMemory(createPersonalState(), 'note'), 'A title <&> 🌿');
  original.shares = [100, 0, 0];
  const json = serializeState(original);
  assert.deepEqual(restoreState(json), original);
  assert.equal(serializeState(restoreState(json)), json);
  for (const invalid of [null, '', '{broken', 'null', '[]', '{"version":2}', '{"version":"1"}']) {
    assert.deepEqual(restoreState(invalid), createPersonalState());
  }
  const repaired = sanitizePersonalState({ shares: [0, 0, 0], memory: 'arbitrary', title: {}, titleEdited: 'true' });
  assert.deepEqual(repaired, createPersonalState());
});

test('blocked, full, or absent storage never interrupts the live experience', () => {
  const state = editTitle(createPersonalState(), 'Kept here');
  assert.equal(saveState(null, state), false);
  assert.deepEqual(loadState(undefined), createPersonalState());
  const blocked = {
    getItem() { throw new Error('Storage blocked'); },
    setItem() { throw new Error('Quota exceeded'); },
  };
  assert.deepEqual(loadState(blocked), createPersonalState());
  assert.equal(saveState(blocked, state), false);
  const memory = new Map<string, string>();
  const storage = {
    getItem(key: string) { return memory.get(key) ?? null; },
    setItem(key: string, value: string) { memory.set(key, value); },
  };
  assert.equal(saveState(storage, state), true);
  assert.equal(memory.has(STORAGE_KEY), true);
  assert.deepEqual(loadState(storage), state);
  assert.equal(state.title, 'Kept here');
});

test('transition evaluation is bounded, reversible and independent from evaluation order', () => {
  const forward = Array.from({ length: 101 }, (_, index) => smoothstep(index / 100));
  const reverse = Array.from({ length: 101 }, (_, index) => smoothstep(1 - index / 100));
  forward.forEach((value, index) => {
    assert.ok(value >= 0 && value <= 1);
    if (index > 0) assert.ok(value >= forward[index - 1]);
    assert.ok(Math.abs(value - reverse[100 - index]) < 1e-12);
  });
  assert.equal(smoothstep(0.5), 0.5);
  assert.equal(smoothstep(-10), 0);
  assert.equal(smoothstep(10), 1);
  assert.equal(clamp01(NaN), 0);
  assert.equal(clamp01(Infinity), 1);
  assert.equal(lerp(40, 80, 0.5), 60);
});
