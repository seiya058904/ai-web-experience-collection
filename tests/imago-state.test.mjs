import test from 'node:test';
import assert from 'node:assert/strict';
import { loadState, plain } from './imago-source-loader.mjs';

const expectedDefaults = {
  eggZoom: false, larvaStage: 'third', instar: 5, pupationStage: 'j',
  developmentView: 'surface', observationStage: 'middle', comparison: false,
  reveal: 50, emergenceStep: 0, wingStage: 'open', wingDetail: 'whole',
  departed: false, motion: 'auto',
};

function storage(initial = null) {
  let raw = initial;
  const writes = [];
  let removals = 0;
  return {
    window: { sessionStorage: {
      getItem: () => raw,
      setItem: (key, value) => { writes.push({ key, value }); raw = value; },
      removeItem: () => { raw = null; removals += 1; },
    } },
    get raw() { return raw; }, writes,
    get removals() { return removals; },
  };
}

test('state: initial choices match the specified observation defaults', () => {
  const source = loadState();
  assert.deepEqual(plain(source.readObservationState()), expectedDefaults);
  assert.equal(Object.isFrozen(source.DEFAULT_OBSERVATION_STATE), true);
});

test('state: malformed or non-record input cannot introduce observation fields', () => {
  const { sanitizeObservationState } = loadState();
  for (const input of [undefined, null, false, 12, 'late', [], ['late']]) {
    assert.deepEqual(plain(sanitizeObservationState(input)), expectedDefaults);
  }
  const tainted = JSON.parse('{"__proto__":{"polluted":true},"scrollY":999,"chapterId":"chapter-10","observationStage":"late"}');
  const result = plain(sanitizeObservationState(tainted));
  assert.equal(result.observationStage, 'late');
  assert.equal(Object.hasOwn(result, '__proto__'), false);
  assert.equal(Object.hasOwn(result, 'scrollY'), false);
  assert.equal(Object.hasOwn(result, 'chapterId'), false);
});

test('state: all supported stages are retained and unknown enum values are rejected', () => {
  const { sanitizeObservationState } = loadState();
  const values = {
    larvaStage: ['hatchling', 'third'], pupationStage: ['j', 'forming', 'pupa'],
    developmentView: ['surface', 'schematic'], observationStage: ['early', 'middle', 'late'],
    wingStage: ['folded', 'expanding', 'open'], wingDetail: ['whole', 'forewing', 'hindwing', 'body'],
    motion: ['auto', 'reduced', 'full'],
  };
  for (const [key, choices] of Object.entries(values)) {
    for (const value of choices) assert.equal(sanitizeObservationState({ [key]: value })[key], value);
    for (const invalid of ['unknown', '', true, 1, null, {}]) {
      assert.equal(sanitizeObservationState({ [key]: invalid })[key], expectedDefaults[key]);
    }
  }
});

test('state: instars and emergence steps are bounded integers', () => {
  const { sanitizeObservationState } = loadState();
  for (const value of [1, 2, 3, 4, 5]) assert.equal(sanitizeObservationState({ instar: value }).instar, value);
  for (const value of [0, 1, 2, 3]) assert.equal(sanitizeObservationState({ emergenceStep: value }).emergenceStep, value);
  for (const value of [0, 6, 1.5, Number.NaN, Infinity, -Infinity, '2']) {
    assert.equal(sanitizeObservationState({ instar: value }).instar, 5);
  }
  for (const value of [-1, 4, 0.5, Number.NaN, Infinity, '1']) {
    assert.equal(sanitizeObservationState({ emergenceStep: value }).emergenceStep, 0);
  }
});

test('state: comparison reveal accepts finite endpoints and rejects corrupt values', () => {
  const { sanitizeObservationState } = loadState();
  for (const value of [0, 12.5, 50, 100]) assert.equal(sanitizeObservationState({ reveal: value }).reveal, value);
  for (const value of [-1, 101, Number.NaN, Infinity, -Infinity, '0', null]) {
    assert.equal(sanitizeObservationState({ reveal: value }).reveal, 50);
  }
});

test('state: boolean controls do not interpret truthy strings as checked', () => {
  const { sanitizeObservationState } = loadState();
  for (const key of ['eggZoom', 'comparison', 'departed']) {
    assert.equal(sanitizeObservationState({ [key]: true })[key], true);
    assert.equal(sanitizeObservationState({ [key]: false })[key], false);
    for (const invalid of ['true', 'false', 1, 0, {}, null]) {
      assert.equal(sanitizeObservationState({ [key]: invalid })[key], false);
    }
  }
});

test('state: invalid patches preserve prior choices while valid fields still update', () => {
  const source = loadState();
  source.updateObservationState({ instar: 2, observationStage: 'late', reveal: 25 });
  const result = source.updateObservationState({ instar: 99, observationStage: 'unknown', comparison: true });
  assert.equal(result.instar, 2);
  assert.equal(result.observationStage, 'late');
  assert.equal(result.reveal, 25);
  assert.equal(result.comparison, true);
});

test('state: returned objects cannot mutate the stored choice state', () => {
  const source = loadState();
  const first = source.updateObservationState({ instar: 2 });
  first.instar = 5;
  const second = source.readObservationState();
  assert.equal(second.instar, 2);
  second.departed = true;
  assert.equal(source.readObservationState().departed, false);
});

test('state: reads never write, and explicit updates persist only the validated schema', () => {
  const memory = storage();
  const source = loadState({ window: memory.window });
  source.readObservationState();
  source.readObservationState();
  assert.equal(memory.writes.length, 0);
  source.updateObservationState({ observationStage: 'early', reveal: 0, scrollY: 999 });
  assert.equal(memory.writes.length, 1);
  assert.equal(memory.writes[0].key, source.OBSERVATION_STORAGE_KEY);
  const saved = JSON.parse(memory.raw);
  assert.equal(saved.version, 1);
  assert.equal(saved.state.observationStage, 'early');
  assert.equal(saved.state.reveal, 0);
  assert.equal(Object.hasOwn(saved.state, 'scrollY'), false);
});

test('state: a fresh module restores valid saved choices with no write side effect', () => {
  const memory = storage(JSON.stringify({ version: 1, state: {
    observationStage: 'late', wingDetail: 'hindwing', reveal: 100, emergenceStep: 3,
  } }));
  const source = loadState({ window: memory.window });
  const result = source.readObservationState();
  assert.equal(result.observationStage, 'late');
  assert.equal(result.wingDetail, 'hindwing');
  assert.equal(result.reveal, 100);
  assert.equal(result.emergenceStep, 3);
  assert.equal(result.instar, 5);
  assert.equal(memory.writes.length, 0);
});

test('state: malformed JSON and unknown save versions recover to safe defaults', () => {
  for (const raw of ['{', 'null', '[]', 'false', '{"version":2,"state":{"departed":true}}', '{"state":{"departed":true}}']) {
    const memory = storage(raw);
    const source = loadState({ window: memory.window });
    assert.deepEqual(plain(source.readObservationState()), expectedDefaults);
    assert.equal(memory.writes.length, 0);
  }
});

test('state: unavailable sessionStorage keeps updates and reset usable in memory', () => {
  const deniedWindow = {};
  Object.defineProperty(deniedWindow, 'sessionStorage', { get() { throw new Error('Storage access denied'); } });
  const source = loadState({ window: deniedWindow });
  assert.equal(source.readObservationState().instar, 5);
  source.updateObservationState({ instar: 3, eggZoom: true });
  assert.equal(source.readObservationState().instar, 3);
  assert.equal(source.readObservationState().eggZoom, true);
  assert.deepEqual(plain(source.resetObservationState()), expectedDefaults);
});

test('state: write quota failure does not roll back the explicit user action', () => {
  const source = loadState({ window: { sessionStorage: {
    getItem: () => null,
    setItem: () => { throw new Error('Quota exceeded'); },
    removeItem: () => { throw new Error('Storage unavailable'); },
  } } });
  assert.equal(source.updateObservationState({ departed: true }).departed, true);
  assert.equal(source.readObservationState().departed, true);
  assert.equal(source.resetObservationState().departed, false);
});

test('state: reset removes the saved observation record and restores every default', () => {
  const memory = storage();
  const source = loadState({ window: memory.window });
  source.updateObservationState({ departed: true, motion: 'reduced', comparison: true, emergenceStep: 3 });
  assert.deepEqual(plain(source.resetObservationState()), expectedDefaults);
  assert.equal(memory.raw, null);
  assert.equal(memory.removals, 1);
  assert.deepEqual(plain(source.readObservationState()), expectedDefaults);
});
