import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_OPENING, LIN_NOTE } from '../experiences/berth/src/story.ts';
import {
  defaultState, loadState, MAX_OPENING_LENGTH, resolveStoryState,
  sanitizeOpening, saveState, STORAGE_KEY, truncateOpening,
} from '../experiences/berth/src/state.ts';
import type { LampMode, StateStorage, UserState } from '../experiences/berth/src/state.ts';

class MemoryStorage implements StateStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const custom: UserState = { opening: '早上好 — <hello> & café 🌙', lamp: 'reading', motion: false };

test('empty or whitespace-only input always has a complete default story', () => {
  for (const value of ['', ' \n\t ', null, undefined, 42]) assert.equal(sanitizeOpening(value), DEFAULT_OPENING);
});

test('nonblank input retains user language, outer and internal whitespace, punctuation and literal markup', () => {
  const input = '  你好\n世界 — café & <b>hello</b> 🌙  ';
  assert.equal(sanitizeOpening(input), input);
  assert.equal(sanitizeOpening('\n  Hello.  \n'), '\n  Hello.  \n');
});

test('the 120-character cap counts Unicode code points without splitting surrogate pairs', () => {
  const input = '🌙'.repeat(MAX_OPENING_LENGTH + 1);
  const result = sanitizeOpening(input);
  assert.equal(Array.from(result).length, MAX_OPENING_LENGTH);
  assert.equal(result, '🌙'.repeat(MAX_OPENING_LENGTH));
  assert.equal(sanitizeOpening('a'.repeat(119) + '🌙z'), 'a'.repeat(119) + '🌙');
});

test('the code-point cap stops before a grapheme that would not fit', () => {
  const family = '👩‍👩‍👧‍👦';
  assert.equal(truncateOpening('a'.repeat(116) + family), 'a'.repeat(116));
  assert.equal(truncateOpening('a'.repeat(113) + family + 'z'), 'a'.repeat(113) + family);
  assert.equal(truncateOpening('a'.repeat(119) + 'e\u0301'), 'a'.repeat(119));
  assert.equal(truncateOpening('a'.repeat(118) + 'e\u0301z'), 'a'.repeat(118) + 'e\u0301');
  assert.equal(truncateOpening('a'.repeat(119) + '🇯🇵'), 'a'.repeat(119));
});

test('a new visit returns independent defaults and does not claim to have read a save', () => {
  const first = loadState(new MemoryStorage());
  assert.deepEqual(first, { state: defaultState, persisted: false });
  first.state.opening = 'Changed only in this result.';
  assert.equal(loadState(new MemoryStorage()).state.opening, DEFAULT_OPENING);
  assert.equal(defaultState.opening, DEFAULT_OPENING);
});

test('a saved line and both preferences survive a round trip exactly', () => {
  const storage = new MemoryStorage();
  assert.equal(saveState(custom, storage), true);
  assert.deepEqual(loadState(storage), { state: custom, persisted: true });
  const raw = JSON.parse(storage.getItem(STORAGE_KEY)!);
  assert.equal(raw.version, 1);
  assert.deepEqual(Object.keys(raw).sort(), ['lamp', 'motion', 'opening', 'version']);
});

test('corrupt JSON, unrelated values, and unknown schema versions recover without a write', () => {
  for (const raw of ['{', 'null', '[]', 'false', '123', '"hello"', '{"version":99}']) {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, raw);
    assert.deepEqual(loadState(storage), { state: defaultState, persisted: false });
    assert.equal(storage.getItem(STORAGE_KEY), raw);
  }
});

test('a malformed preference does not discard a valid saved user sentence', () => {
  const storage = new MemoryStorage();
  storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, opening: custom.opening, lamp: 'purple', motion: 'yes' }));
  assert.deepEqual(loadState(storage), {
    state: { opening: custom.opening, lamp: 'soft', motion: true }, persisted: false,
  });
});

test('blocked storage and quota failures cannot produce a false save success', () => {
  const denied: StateStorage = {
    getItem() { throw new Error('Access denied'); },
    setItem() { throw new Error('Quota exceeded'); },
  };
  assert.deepEqual(loadState(denied), { state: defaultState, persisted: false });
  assert.equal(saveState(custom, denied), false);
  assert.deepEqual(loadState(null), { state: defaultState, persisted: false });
  assert.equal(saveState(custom, null), false);
});

test('the comparison lamp preference applies in CH03 and nowhere else', () => {
  const modes: LampMode[] = ['reading', 'soft', 'off'];
  for (const mode of modes) {
    const user = { ...custom, lamp: mode };
    assert.equal(resolveStoryState(3, 0.6, user).lamp, mode);
    assert.equal(resolveStoryState(3, 0.6, user).lampSource, 'comparison');
  }
  for (const chapter of [1, 2, 4, 5, 6, 7, 8, 9, 10]) {
    for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
      const reading = resolveStoryState(chapter, progress, { ...custom, lamp: 'reading' });
      const off = resolveStoryState(chapter, progress, { ...custom, lamp: 'off' });
      assert.deepEqual(reading, off, `CH${chapter} at ${progress} must ignore the comparison lamp`);
      assert.equal(reading.lampSource, 'story');
    }
  }
});

test('a saved ending does not fill the blank manuscript or expose Lin’s note on a reread', () => {
  for (let chapter = 1; chapter <= 6; chapter++) {
    for (const progress of [0, 0.5, 1]) {
      const state = resolveStoryState(chapter, progress, custom);
      assert.equal(state.openingText, null);
      assert.equal(state.linNoteText, null);
      assert.ok(!JSON.stringify(state).includes(custom.opening));
    }
  }
  assert.equal(resolveStoryState(7, 0.5, custom).openingText, custom.opening);
  assert.equal(resolveStoryState(7, 1, custom).linNoteText, null);
});

test('the two cards are only taken from Ning’s bag and separated during the night talk', () => {
  assert.equal(resolveStoryState(4, 1, custom).objects.ningCard, 'canvas-bag');
  assert.equal(resolveStoryState(4, 1, custom).objects.linCard, 'canvas-bag');
  const before = resolveStoryState(5, 0.2, custom);
  assert.equal(before.objects.ningCard, 'canvas-bag');
  assert.equal(before.objects.linCard, 'canvas-bag');
  const after = resolveStoryState(5, 0.8, custom);
  assert.equal(after.objects.ningCard, 'table');
  assert.equal(after.objects.linCard, 'lin-hand');
  assert.equal(after.linCardFace, 'blank');
});

test('settling to sleep leaves Lin’s card/glasses below and Ning’s manuscript/card above', () => {
  const before = resolveStoryState(6, 0, custom);
  assert.equal(before.objects.linCard, 'lin-hand');
  const climbing = resolveStoryState(6, 0.6, custom);
  assert.equal(climbing.people.ning, 'ladder');
  assert.equal(climbing.objects.manuscript, 'ning-hand');
  assert.equal(climbing.objects.ningCard, 'ning-hand');
  const asleep = resolveStoryState(6, 1, custom);
  assert.equal(asleep.objects.manuscript, 'upper-berth');
  assert.equal(asleep.objects.ningCard, 'upper-pillow');
  assert.equal(asleep.objects.linCard, 'table');
  assert.equal(asleep.objects.glasses, 'table');
  assert.equal(asleep.linCardFace, 'down');
  assert.equal(asleep.lamp, 'off');
  assert.equal(asleep.lightLevel, 0);
});

test('night-to-dawn keeps every physical object in place before Ning descends', () => {
  const night = resolveStoryState(7, 1, custom);
  const dawn = resolveStoryState(8, 0, custom);
  assert.deepEqual(dawn.objects, night.objects);
  assert.deepEqual(dawn.people, night.people);
  assert.ok(dawn.daylight > night.daylight);
  assert.equal(dawn.linNoteText, null);
});

test('Ning carries paper down before Lin turns and hands over her own card', () => {
  const descending = resolveStoryState(8, 0.4, custom);
  assert.equal(descending.people.ning, 'ladder');
  assert.equal(descending.objects.manuscript, 'ning-hand');
  assert.equal(descending.objects.ningCard, 'ning-hand');
  assert.equal(descending.objects.linCard, 'table');
  assert.equal(descending.linNoteText, null);
  const returned = resolveStoryState(8, 0.55, custom);
  assert.equal(returned.objects.manuscript, 'table');
  assert.equal(returned.objects.ningCard, 'table');
  assert.equal(returned.linCardFace, 'down');
  assert.equal(returned.linNoteText, null);
  const offered = resolveStoryState(8, 0.7, custom);
  assert.equal(offered.objects.linCard, 'lin-hand');
  assert.equal(offered.linCardFace, 'up');
  assert.equal(offered.linNoteText, LIN_NOTE);
  const received = resolveStoryState(8, 0.9, custom);
  assert.equal(received.objects.linCard, 'ning-hand');
  assert.equal(received.objects.glasses, 'table');
});

test('the single clip is removed from the manuscript before it joins the two cards', () => {
  const before = resolveStoryState(9, 0, custom);
  assert.equal(before.paperclipOn, 'manuscript');
  assert.equal(before.objects.paperclip, 'table');
  const detached = resolveStoryState(9, 0.4, custom);
  assert.equal(detached.paperclipOn, 'none');
  assert.equal(detached.objects.paperclip, 'ning-hand');
  const joined = resolveStoryState(9, 0.6, custom);
  assert.equal(joined.paperclipOn, 'two-cards');
  assert.equal(joined.objects.paperclip, joined.objects.ningCard);
  assert.equal(joined.objects.linCard, joined.objects.ningCard);
  assert.equal(joined.objects.manuscript, 'table');
});

test('the ending recalls both lines while the physical table remains empty', () => {
  const ending = resolveStoryState(10, 1, custom);
  assert.deepEqual(ending.people, { ning: 'outside', lin: 'outside' });
  assert.ok(Object.values(ending.objects).every(location => location === 'outside'));
  assert.equal(ending.openingText, custom.opening);
  assert.equal(ending.linNoteText, LIN_NOTE);
  assert.equal(ending.paperclipOn, 'two-cards');
});

test('two departures are sequential, rather than both characters disappearing together', () => {
  const first = resolveStoryState(10, 0.1, custom);
  assert.deepEqual(first.people, { ning: 'table', lin: 'doorway' });
  assert.equal(first.objects.glasses, 'lin-worn');
  const second = resolveStoryState(10, 0.45, custom);
  assert.deepEqual(second.people, { ning: 'doorway', lin: 'outside' });
  assert.equal(second.objects.manuscript, 'canvas-bag');
  assert.equal(second.objects.ningCard, 'canvas-bag');
  assert.equal(second.objects.linCard, 'canvas-bag');
  assert.equal(second.objects.glasses, 'outside');
});

test('Ms. Lin puts her glasses on while packing and wears them until she leaves', () => {
  assert.equal(resolveStoryState(9, 0.74, custom).objects.glasses, 'table');
  assert.equal(resolveStoryState(9, 0.75, custom).objects.glasses, 'lin-worn');
  assert.equal(resolveStoryState(9, 1, custom).objects.glasses, 'lin-worn');
  assert.equal(resolveStoryState(10, 0, custom).objects.glasses, 'lin-worn');
  assert.equal(resolveStoryState(10, 0.3, custom).objects.glasses, 'outside');
});

test('jumping, fast reversing, and restoring produce exactly the same current state', () => {
  const frozenUser = Object.freeze({ ...custom });
  const target = resolveStoryState(8, 0.7, frozenUser);
  for (const chapter of [10, 1, 9, 3, 7, 2, 10, 8]) resolveStoryState(chapter, 0.9, frozenUser);
  assert.deepEqual(resolveStoryState(8, 0.7, frozenUser), target);
  assert.deepEqual(frozenUser, custom);
  assert.equal(resolveStoryState(3, 0.5, frozenUser).lamp, 'reading');
});

test('every visible clip remains colocated with its current attachment across all chapter samples', () => {
  for (let chapter = 1; chapter <= 10; chapter++) {
    for (let step = 0; step <= 100; step++) {
      const state = resolveStoryState(chapter, step / 100, custom);
      if (state.paperclipOn === 'manuscript') assert.equal(state.objects.paperclip, state.objects.manuscript);
      if (state.paperclipOn === 'two-cards') {
        assert.equal(state.objects.paperclip, state.objects.ningCard);
        assert.equal(state.objects.linCard, state.objects.ningCard);
      }
      assert.ok(state.lightLevel >= 0 && state.lightLevel <= 1);
      assert.ok(state.daylight >= 0 && state.daylight <= 1);
    }
  }
});

test('invalid progress cannot make a negative light level or an undefined chapter', () => {
  assert.equal(resolveStoryState(-2, -1, custom).chapter, 1);
  assert.equal(resolveStoryState(99, 2, custom).chapter, 10);
  assert.equal(resolveStoryState(5.9, 0, custom).chapter, 5);
  assert.equal(resolveStoryState(Number.NaN, Number.NaN, custom).chapter, 1);
  assert.equal(resolveStoryState(1, Number.NaN, custom).progress, 0);
  assert.equal(resolveStoryState(1, -1, custom).progress, 0);
  assert.equal(resolveStoryState(1, 2, custom).progress, 1);
});
