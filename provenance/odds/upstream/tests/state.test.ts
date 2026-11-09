import test from 'node:test';
import assert from 'node:assert/strict';
import { createExperiment, experimentSVG, prefixExperiment, validateExperiment } from '../src/engine.ts';
import {
  currentPersonal,
  heroDemo,
  initialState,
  personalDemo,
  reduceState,
  restoreState,
  serializeState,
  teachingRounds,
  type AppAction,
} from '../src/state.ts';

function seeds(): () => string {
  let index = 0;
  return () => `state-test-${++index}`;
}

test('initial state separates labelled demonstrations from personal experiments', () => {
  const state = initialState();
  assert.equal(state.hero, null);
  assert.equal(state.personal, null);
  assert.equal(state.sound, false);
  assert.equal(state.motion, 'system');
  assert.equal(heroDemo.N, 6);
  assert.equal(state.branch.N, 4);
  assert.equal(state.branch.n, 1);
  assert.equal(currentPersonal(state), personalDemo);
  assert.deepEqual(initialState(), state);
  assert.equal(currentPersonal(state).N, 64);
  assert.equal(state.personal, null);
});

test('hero click creates one personal sample without counting demonstration balls', () => {
  const first = reduceState(initialState(), { type: 'hero-drop' }, seeds());
  assert.equal(first.hero?.N, 1);
  const second = reduceState(first, { type: 'hero-drop' });
  assert.equal(second.hero?.N, 2);
  assert.deepEqual(second.hero?.paths.slice(0, 1), first.hero?.paths);
  assert.equal(second.hero?.seed, first.hero?.seed);
  assert.equal(first.hero?.N, 1);
  assert.equal(second.personal, null);
});

test('branch drawing remains independent of all experiment counts', () => {
  const original = initialState();
  const changed = reduceState(original, { type: 'branch-draw' }, seeds());
  assert.equal(changed.branch.seed, 'state-test-1');
  assert.equal(changed.branch.N, 4);
  assert.ok(validateExperiment(changed.branch));
  assert.equal(changed.hero, original.hero);
  assert.equal(changed.bias, original.bias);
  assert.equal(changed.small, original.small);
  assert.equal(changed.personal, original.personal);
});

test('new small rounds retain exactly one previous pair and undo swaps it intact', () => {
  const original = initialState();
  const changed = reduceState(original, { type: 'small-new' }, seeds());
  assert.equal(changed.previousSmall, original.small);
  assert.equal(changed.small[0].N, 16);
  assert.equal(changed.small[1].N, 16);
  assert.notEqual(changed.small[0].seed, changed.small[1].seed);
  const restored = reduceState(changed, { type: 'small-undo' });
  assert.deepEqual(restored.small, original.small);
  assert.equal(restored.previousSmall, changed.small);
  assert.deepEqual(reduceState(restored, { type: 'small-undo' }).small, changed.small);
  assert.equal(reduceState(original, { type: 'small-undo' }), original);
});

test('bias changes create a fresh 64-ball round without mixing old data', () => {
  const nextSeed = seeds();
  const original = initialState();
  const left = reduceState(original, { type: 'bias-run', p: 0.25 }, nextSeed);
  assert.equal(left.bias.p, 0.25);
  assert.equal(left.bias.N, 64);
  assert.equal(left.bias.counts.reduce((sum, value) => sum + value, 0), 64);
  assert.equal(left.previousBias, original.bias);
  const repeated = reduceState(left, { type: 'bias-run', p: 0.25 }, nextSeed);
  assert.notEqual(repeated.bias.seed, left.bias.seed);
  assert.deepEqual(reduceState(repeated, { type: 'bias-undo' }).bias, left.bias);
  assert.equal(repeated.hero, original.hero);
  assert.equal(repeated.personal, original.personal);
});

test('comparison size preserves all teaching prefixes and the separate bias round', () => {
  const original = reduceState(initialState(), { type: 'bias-run', p: 0.75 }, seeds());
  const before = JSON.stringify(teachingRounds);
  let state = original;
  for (const N of [16, 64, 128, 16] as const) {
    state = reduceState(state, { type: 'comparison-size', N });
    assert.equal(state.comparisonN, N);
    assert.equal(state.bias, original.bias);
    for (const round of teachingRounds) {
      const prefix = prefixExperiment(round, N);
      assert.deepEqual(prefix.paths, round.paths.slice(0, N));
      assert.equal(prefix.counts.reduce((sum, value) => sum + value, 0), N);
    }
  }
  assert.equal(JSON.stringify(teachingRounds), before);
  assert.equal(teachingRounds[1].N, 256);
  assert.equal(new Set(teachingRounds.map(round => round.seed)).size, 3);
});

test('selection and display preferences cannot generate or alter experimental results', () => {
  const original = initialState();
  let state = reduceState(original, { type: 'select-ball', index: 255 });
  state = reduceState(state, { type: 'motion', value: 'reduced' });
  state = reduceState(state, { type: 'sound', enabled: true });
  assert.equal(state.selectedBall, 255);
  assert.equal(state.motion, 'reduced');
  assert.equal(state.sound, true);
  for (const field of ['hero', 'branch', 'small', 'bias', 'personal'] as const) assert.equal(state[field], original[field]);
  for (const index of [-1, 256, 0.5, NaN]) assert.equal(reduceState(state, { type: 'select-ball', index }), state);
});

test('workbench rules have n+1 slots, exact totals, and restore prior rules and seed', () => {
  const nextSeed = seeds();
  const first = reduceState(initialState(), { type: 'personal-run', n: 4, p: 0.25, N: 16 }, nextSeed);
  const second = reduceState(first, { type: 'personal-run', n: 12, p: 0.75, N: 256 }, nextSeed);
  assert.equal(second.personal?.counts.length, 13);
  assert.equal(second.personal?.counts.reduce((sum, value) => sum + value, 0), 256);
  assert.equal(second.previousPersonal, first.personal);
  const restored = reduceState(second, { type: 'personal-undo' });
  assert.equal(restored.personal, first.personal);
  assert.equal(restored.personal?.n, 4);
  assert.equal(restored.personal?.p, 0.25);
  const fresh = reduceState(second, { type: 'personal-new' }, nextSeed);
  assert.equal(fresh.personal?.n, 12);
  assert.equal(fresh.personal?.p, 0.75);
  assert.equal(fresh.personal?.N, 256);
  assert.notEqual(fresh.personal?.seed, second.personal?.seed);
});

test('ending appends exactly one ball and export uses the updated live parameters', () => {
  const original = reduceState(initialState(), { type: 'personal-run', n: 12, p: 0.25, N: 64 }, seeds());
  const next = reduceState(original, { type: 'personal-next' });
  assert.equal(next.personal?.N, 65);
  assert.equal(next.personal?.counts.reduce((sum, value) => sum + value, 0), 65);
  assert.equal(next.personal?.counts.length, 13);
  assert.deepEqual(next.personal?.paths.slice(0, 64), original.personal?.paths);
  assert.equal(next.personal?.seed, original.personal?.seed);
  const svg = experimentSVG(currentPersonal(next));
  assert.match(svg, /n=12; p=0\.25; N=65;/);
  assert.ok(svg.includes(`Observed counts, by number of right turns: ${next.personal!.counts.join(', ')}`));
  assert.deepEqual(reduceState(next, { type: 'personal-undo' }).personal, original.personal);
});

test('the next ball after no participation extends the stable demonstration prefix explicitly', () => {
  const original = initialState();
  const next = reduceState(original, { type: 'personal-next' });
  assert.equal(original.personal, null);
  assert.equal(next.personal?.N, 65);
  assert.equal(next.personal?.seed, personalDemo.seed);
  assert.deepEqual(next.personal?.paths.slice(0, 64), personalDemo.paths);
  assert.equal(next.previousPersonal, null);
  assert.equal(personalDemo.N, 64);
});

test('serialized state round-trips complete experiments and preferences without resampling', () => {
  const nextSeed = seeds();
  let state = reduceState(initialState(), { type: 'hero-drop' }, nextSeed);
  state = reduceState(state, { type: 'small-new' }, nextSeed);
  state = reduceState(state, { type: 'bias-run', p: 0.75 }, nextSeed);
  state = reduceState(state, { type: 'personal-run', n: 12, p: 0.25, N: 256 }, nextSeed);
  state = reduceState(state, { type: 'personal-next' });
  state = reduceState(state, { type: 'motion', value: 'reduced' });
  state = reduceState(state, { type: 'sound', enabled: true });
  state = reduceState(state, { type: 'select-ball', index: 217 });
  const raw = serializeState(state);
  assert.deepEqual(restoreState(raw), state);
  assert.equal(serializeState(restoreState(raw)), raw);
});

test('invalid saved data fails closed, including mathematically valid but disallowed UI rules', () => {
  const valid = initialState();
  for (const raw of [null, '', '{', 'null', '[]', '0', '{}', JSON.stringify({ ...valid, version: 2 })]) {
    assert.deepEqual(restoreState(raw), initialState());
  }
  const mutations: Array<(copy: any) => void> = [
    copy => { copy.small[0].counts[0] += 1; },
    copy => { copy.small[0].paths[0].id = 'invented'; },
    copy => { copy.branch = createExperiment('bad-n', 2, 0.5, 4); },
    copy => { copy.bias = createExperiment('bad-p', 8, 0.1, 64); },
    copy => { copy.personal = createExperiment('bad-layers', 6, 0.5, 64); },
    copy => { copy.hero = createExperiment('empty-hero', 8, 0.5, 0); },
    copy => { copy.comparisonN = 256; },
    copy => { copy.selectedBall = 256; },
    copy => { copy.selectedBall = -1; },
    copy => { copy.motion = 'full'; },
    copy => { copy.sound = 'yes'; },
    copy => { delete copy.previousPersonal; },
  ];
  for (const mutate of mutations) {
    const copy = JSON.parse(serializeState(valid));
    mutate(copy);
    assert.deepEqual(restoreState(JSON.stringify(copy)), initialState());
  }
});

test('runtime invalid actions and exhausted append capacity preserve state', () => {
  const state = initialState();
  const invalid = [
    { type: 'bias-run', p: 0.6 },
    { type: 'comparison-size', N: 256 },
    { type: 'personal-run', n: 7, p: 0.5, N: 16 },
    { type: 'personal-run', n: 8, p: 0.5, N: 65 },
    { type: 'motion', value: 'unknown' },
    { type: 'sound', enabled: 1 },
    { type: 'scroll' },
  ];
  for (const action of invalid) assert.equal(reduceState(state, action as AppAction), state);
  const full = { ...state, personal: createExperiment('full', 4, 0.5, 10_000) };
  assert.equal(reduceState(full, { type: 'personal-next' }), full);
  const fullHero = { ...state, hero: createExperiment('full-hero', 8, 0.5, 10_000) };
  assert.equal(reduceState(fullHero, { type: 'hero-drop' }), fullHero);
});

test('identical explicit actions and injected seeds give identical immutable transitions', () => {
  const state = initialState();
  const before = serializeState(state);
  const action: AppAction = { type: 'personal-run', n: 8, p: 0.5, N: 256 };
  assert.deepEqual(reduceState(state, action, () => 'repeatable'), reduceState(state, action, () => 'repeatable'));
  assert.equal(serializeState(state), before);
});
