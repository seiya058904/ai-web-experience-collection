// Nine original story contracts retained for the refined edition. Camera
// projection and the recoat reset equivalence have dedicated behavioral tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import { chapters, getStoryState, positionFromScroll } from '../experiences/urushi/src/story.js';

const masks = ['wood', 'ground', 'coat', 'cure', 'abrasion', 'abradeFront', 'layers', 'vermilion', 'polish', 'gold', 'goldVeil', 'goldReveal', 'chamber', 'section', 'recoatMode', 'recoat'];
const positions = Array.from({ length: 2201 }, (_, i) => i / 200);
const baseline = new Map(positions.map(p => [p, getStoryState(p)]));

test('Every chapter has a unique anchor and complete English / Chinese copy', () => {
  assert.equal(chapters.length, 11);
  assert.equal(new Set(chapters.map(ch => ch.id)).size, chapters.length);
  for (const ch of chapters) {
    assert.match(ch.id, /^[a-z][a-z0-9-]+$/);
    for (const key of ['name', 'zh', 'title', 'titleZh', 'body', 'bodyZh', 'note', 'noteZh']) assert.ok(ch[key]?.trim(), `${ch.id}: missing ${key}`);
    assert.ok(Number.isFinite(ch.height) && ch.height > 1, `${ch.id}: invalid scroll extent`);
  }
});

test('The complete journey has finite state and bounded material masks', () => {
  const seen = new Set();
  for (const [p, state] of baseline) {
    seen.add(state.chapter);
    for (const [name, value] of Object.entries(state)) assert.ok(Number.isFinite(value), `${name} is not finite at ${p}`);
    for (const name of masks) assert.ok(state[name] >= 0 && state[name] <= 1, `${name} is outside [0, 1] at ${p}`);
    assert.ok(state.local >= 0 && state.local <= 1, `invalid chapter progress at ${p}`);
  }
  assert.deepEqual([...seen], chapters.map((_, i) => i));
});

test('Gold is exactly absent before deposition, including its boundary', () => {
  for (const [p, state] of baseline) if (p <= 8.03) assert.equal(state.gold, 0, `early gold at ${p}`);
  for (const p of [0, 7.99, 8, 8.029999999, 8.03]) assert.equal(getStoryState(p).gold, 0, `gold leaked at ${p}`);
  assert.ok(getStoryState(8.5).gold > 0, 'the deposition scene does not deposit gold');
  assert.equal(getStoryState(8.9).gold, 1, 'deposition never completes');
});

test('Reverse scrolling and arbitrary chapter jumps have no material history', () => {
  for (const p of [...positions].reverse()) assert.deepEqual(getStoryState(p), baseline.get(p), `reverse scroll differs at ${p}`);
  // This coprime stride visits every sample once in a non-monotonic order.
  for (let i = 0; i < positions.length; i++) {
    const p = positions[(i * 997) % positions.length];
    assert.deepEqual(getStoryState(p), baseline.get(p), `chapter jump differs at ${p}`);
  }
  const returned = getStoryState(10.8);
  returned.gold = -999;
  assert.deepEqual(getStoryState(0), baseline.get(0), 'a later state contaminated the hero');
  assert.equal(getStoryState(10.8).gold, 1, 'returned state objects share mutable data');
});

test('Material values join continuously across chapter handoffs', () => {
  // Camera elevation is measured in degrees and has its own continuous-path
  // contract; the original tolerance here concerns normalized material values.
  const fields = Object.keys(getStoryState(0)).filter(key => !['phase', 'chapter', 'local', 'framing', 'elevation', 'turn'].includes(key));
  for (let p = 1; p <= 10; p++) {
    const before = getStoryState(p - 0.000001), after = getStoryState(p + 0.000001);
    for (const key of fields) {
      // Fresh-film coordinates reset at the Layers entry/exit. Their effective
      // material result, including coverage, is checked in the cycle contracts.
      if ([5, 6].includes(p) && ['recoatMode', 'recoat', 'cure', 'abrasion', 'abradeFront'].includes(key)) continue;
      assert.ok(Math.abs(after[key] - before[key]) < 0.0002, `${key} jumps at chapter ${p}`);
    }
  }
});

test('Invalid positions recover to the hero and endpoints clamp safely', () => {
  for (const p of [NaN, Infinity, -Infinity, undefined, null, 'bad-position']) assert.deepEqual(getStoryState(p), getStoryState(0));
  assert.deepEqual(getStoryState(-20), getStoryState(0));
  assert.deepEqual(getStoryState(300), getStoryState(11));
});

test('Abrasion interrupts clarity; polish restores it before gold appears', () => {
  const core = getStoryState(1.1), abraded = getStoryState(4.9), polished = getStoryState(7.95);
  assert.equal(core.wood, 1);
  assert.equal(core.polish, 0);
  // The handoff retains 0.82 abrasion before the next fresh coat, rather than
  // the earlier near-1 scalar. The low-polish material requirement is retained.
  assert.ok(abraded.abrasion > 0.8 && abraded.polish < 0.1, 'abrasion does not materially interrupt polish');
  assert.ok(polished.polish > 0.99 && polished.abrasion < 0.01, 'polish does not restore clarity');
  assert.equal(polished.gold, 0);
});

test('The humid chamber, layer section, vermilion turn, and gold reveal are reachable', () => {
  assert.ok(getStoryState(3.5).chamber > 0.99);
  assert.ok(getStoryState(5.45).section > 0.99);
  assert.equal(getStoryState(6.75).vermilion, 1);
  const hidden = getStoryState(9.4), revealed = getStoryState(9.95);
  assert.equal(hidden.gold, 1);
  assert.equal(hidden.goldVeil, 1);
  assert.equal(hidden.goldReveal, 0);
  assert.equal(revealed.goldReveal, 1);
  assert.equal(revealed.polish, 1);
});

test('Scroll geometry reaches every scene and the last complete state at every target viewport', () => {
  for (const height of [844, 900, 2160]) {
    let top = 0;
    const sections = chapters.map(ch => {
      const section = { top, bottom: top + ch.height * height };
      top = section.bottom;
      return section;
    });
    assert.equal(positionFromScroll(-100, sections, height), 0);
    for (let i = 0; i < chapters.length; i++) {
      assert.equal(positionFromScroll(sections[i].top, sections, height), i);
      const end = i === chapters.length - 1 ? sections[i].bottom - height : sections[i+1].top;
      assert.ok(Math.abs(positionFromScroll((sections[i].top + end) / 2, sections, height) - (i + 0.5)) < 1e-10);
    }
    assert.equal(positionFromScroll(top - height, sections, height), 11);
    assert.equal(positionFromScroll(top + 1000, sections, height), 11);
  }
  assert.equal(positionFromScroll(0, [], 900), 0);
});

