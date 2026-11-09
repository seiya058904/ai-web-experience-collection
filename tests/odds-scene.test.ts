/**
 * Output-level tests, not browser or pixel verification. The only loader shim
 * supplies Vite's public asset base to native Node. The actual scene module,
 * data engine, geometry, and narrative helpers all execute unchanged.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { createExperiment, prefixExperiment } from '../experiences/odds/src/engine.ts';
import { initialState, reduceState, teachingRounds, type AppState } from '../experiences/odds/src/state.ts';
import { transitionSnapshot, type NarrativeFrame } from '../experiences/odds/src/narrative.ts';
import type { SceneOptions } from '../experiences/odds/src/scene.ts';

const sceneURL = new URL('../experiences/odds/src/scene.ts', import.meta.url).href;
const assetBase = registerHooks({
  load(url, context, nextLoad) {
    const loaded = nextLoad(url, context);
    if (url !== sceneURL) return loaded;
    if (loaded.source === undefined || loaded.source === null) throw new Error('The scene source was unavailable to the test loader.');
    const source = typeof loaded.source === 'string' ? loaded.source : Buffer.from(loaded.source).toString('utf8');
    return { ...loaded, source: source.replaceAll('import.meta.env.BASE_URL', JSON.stringify('/')) };
  },
});
let scene: typeof import('../experiences/odds/src/scene.ts');
try {
  scene = await import('../experiences/odds/src/scene.ts');
} finally {
  assetBase.deregister();
}

function fakeCanvas(available = true) {
  const filledCircles: number[][] = [];
  let currentCircle: number[] | null = null;
  const finite = (...values: number[]) => { assert.ok(values.every(Number.isFinite), 'Canvas geometry must stay finite.'); };
  const context = {
    setTransform: finite, clearRect: finite, save() {}, restore() {},
    beginPath() { currentCircle = null; },
    ellipse: finite,
    arc(...values: number[]) { finite(...values); currentCircle = values; },
    fill() { if (currentCircle) filledCircles.push(currentCircle); },
    stroke() {},
    createRadialGradient(...values: number[]) { finite(...values); return { addColorStop() {} }; },
  };
  const canvas = { width: 0, height: 0, style: {}, getContext: () => available ? context : null };
  return { canvas: canvas as unknown as HTMLCanvasElement, filledCircles };
}

const stable = (chapter: number): NarrativeFrame => ({ chapter, next: chapter, progress: 0, transition: null });
const boundary = (chapter: number, progress: number): NarrativeFrame => ({ chapter, next: chapter + 1, progress, transition: chapter });

function render(state: AppState, frame: NarrativeFrame, overrides: Partial<SceneOptions> = {}, availableCanvas = true) {
  const svg = { innerHTML: '', dataset: {} as Record<string, string> };
  const canvas = fakeCanvas(availableCanvas);
  const options: SceneOptions = {
    mobile: false, endpoint: null, prefix: '', route: null,
    playback: null, canvasAvailable: false, ...overrides,
  };
  const result = scene.renderScene(svg as unknown as SVGSVGElement, canvas.canvas, state, frame, options);
  return { markup: svg.innerHTML, dataset: svg.dataset, result, filledCircles: canvas.filledCircles };
}

function withWindow<T>(callback: () => T): T {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { value: { devicePixelRatio: 2 }, configurable: true });
  try { return callback(); }
  finally {
    if (original) Object.defineProperty(globalThis, 'window', original);
    else delete (globalThis as Record<string, unknown>).window;
  }
}

function sampleIds(markup: string, attribute = 'data-sample-id'): string[] {
  return [...markup.matchAll(new RegExp(`${attribute}="([^"]+)"`, 'g'))].map(match => match[1]);
}

/** Walk only output group tags to retain ownership and inherited opacity. */
function trays(markup: string) {
  const output: Array<{ N: number; opacity: number; ids: string[] }> = [];
  const stack: Array<{ opacity: number; tray: number | null }> = [];
  for (const match of markup.matchAll(/<\/?g\b[^>]*>/g)) {
    const tag = match[0];
    if (tag.startsWith('</')) { stack.pop(); continue; }
    const attributes = Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(attribute => [attribute[1], attribute[2]]));
    const opacity = (stack.at(-1)?.opacity ?? 1) * Number(attributes.opacity ?? 1);
    let tray = stack.at(-1)?.tray ?? null;
    if ((attributes.class ?? '').split(' ').includes('sample-tray')) {
      tray = output.length;
      output.push({ N: Number(attributes['data-N']), opacity, ids: [] });
    }
    if (attributes['data-sample-id'] && tray !== null) output[tray].ids.push(attributes['data-sample-id']);
    if (!tag.endsWith('/>')) stack.push({ opacity, tray });
  }
  return output;
}

test('ten scenes and all 45 boundary checkpoints produce finite output on desktop and mobile', () => {
  const state = initialState();
  const before = JSON.stringify(state);
  const frames = [...Array.from({ length: 10 }, (_, chapter) => stable(chapter)),
    ...Array.from({ length: 9 }, (_, chapter) => [0, 0.25, 0.5, 0.75, 1].map(t => boundary(chapter, t))).flat()];
  for (const mobile of [false, true]) for (const frame of frames) {
    const output = render(state, frame, { mobile });
    assert.ok(output.markup.length > 1000, 'The scene must contain real geometry.');
    assert.doesNotMatch(output.markup, /\b(?:NaN|Infinity|undefined)\b/);
    assert.ok(output.result.label.length > 0 && output.result.foot.length > 0);
    assert.equal(output.dataset.chapter, String(frame.chapter + 1));
    for (const match of output.markup.matchAll(/\b(?:x|y|x1|x2|y1|y2|cx|cy|r|rx|ry|width|height)="([^"]+)"/g)) {
      assert.ok(Number.isFinite(Number.parseFloat(match[1])), `Invalid geometry: ${match[0]}`);
    }
  }
  assert.equal(JSON.stringify(state), before, 'Rendering cannot change experiments or selections.');
});

test('TR03→04 semantic levels agree with the actual completed tree groups', () => {
  const state = initialState();
  for (const [progress, levels] of [[0, 4], [0.1875, 5], [0.375, 6], [0.5625, 7], [0.75, 8]]) {
    const output = render(state, boundary(2, progress));
    const nodes = [...output.markup.matchAll(/<g opacity="([^"]+)"><path[^>]*stroke="#A6B5CD"[^>]*\/><circle[^>]*r="6"[^>]*\/><\/g>/g)];
    assert.equal(nodes.filter(node => Number(node[1]) === 1).length, levels * (levels + 1) / 2);
    assert.equal(transitionSnapshot(2, progress).layers, levels);
  }
  for (const progress of [0.25, 0.5, 0.7]) {
    assert.equal(transitionSnapshot(2, progress).layers, null);
    const output = render(state, boundary(2, progress));
    const partialGroups = [...output.markup.matchAll(/<g opacity="([^"]+)"><path[^>]*stroke="#A6B5CD"/g)];
    assert.ok(partialGroups.some(group => Number(group[1]) > 0 && Number(group[1]) < 1));
  }
  const end = render(state, boundary(2, 1));
  const weights = [...end.markup.matchAll(/data-weight="(\d+)"/g)].map(match => Number(match[1]));
  assert.equal(weights.length, 9);
  assert.equal(weights.reduce((sum, weight) => sum + weight, 0), 256);
  assert.equal(transitionSnapshot(2, 1).unit, 'paths');
});

test('the portrait fallback owns exactly the 256 middle-round samples once', () => {
  const state = initialState();
  const output = render(state, stable(7));
  const ids = sampleIds(output.markup);
  assert.equal(output.result.canvasActive, false);
  assert.equal(ids.length, 256);
  assert.equal(new Set(ids).size, 256);
  assert.deepEqual(ids, teachingRounds[1].paths.map(path => path.id));
  for (const other of [teachingRounds[0], teachingRounds[2]]) assert.ok(other.paths.every(path => !ids.includes(path.id)));
});

test('Canvas and SVG never both own portrait spheres, and failed Canvas keeps the SVG fallback', () => {
  withWindow(() => {
    const state = initialState();
    const canvas = render(state, stable(7), { canvasAvailable: true });
    assert.equal(canvas.result.canvasActive, true);
    assert.equal(sampleIds(canvas.markup).length, 0);
    assert.equal(canvas.result.dots.length, 256);
    assert.equal(new Set(canvas.result.dots.map(dot => dot.id)).size, 256);
    assert.equal(canvas.filledCircles.length, 256);
    assert.deepEqual(canvas.result.dots.map(dot => dot.id), teachingRounds[1].paths.map(path => path.id));
    const fallback = render(state, stable(7), { canvasAvailable: true }, false);
    assert.equal(fallback.result.canvasActive, false);
    assert.deepEqual(sampleIds(fallback.markup), teachingRounds[1].paths.map(path => path.id));
  });
});

test('TR07→08 extends only the middle prefix while each side keeps its separate identity', () => {
  for (const N of [16, 64, 128] as const) for (const mobile of [false, true]) {
    const state = { ...initialState(), comparisonN: N };
    for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
      const groups = trays(render(state, boundary(6, progress), { mobile }).markup);
      assert.equal(groups.length, 3);
      const expectedN = transitionSnapshot(6, progress, N).revealedSamples!;
      assert.deepEqual(groups.map(group => group.N), [N, expectedN, N]);
      groups.forEach((group, index) => assert.deepEqual(group.ids, teachingRounds[index].paths.slice(0, group.N).map(path => path.id)));
      assert.equal(new Set(groups.flatMap(group => group.ids)).size, groups.reduce((sum, group) => sum + group.N, 0));
      if (progress === 1) {
        assert.equal(groups[0].opacity, 0);
        assert.equal(groups[2].opacity, 0);
        assert.equal(groups[1].opacity, 1);
        assert.equal(groups[1].ids.length, 256);
      }
    }
  }
});

test('an animated Hero sample has one moving owner and no duplicate resting owner', () => {
  for (const N of [1, 6, 16, 24]) {
    const round = createExperiment('scene-moving-ball', 8, 0.5, N);
    const state = { ...initialState(), hero: round };
    for (const progress of [0, 0.25, 0.5, 0.999]) {
      const output = render(state, stable(0), { playback: { section: 0, mode: 'path', progress, round } });
      const moving = sampleIds(output.markup, 'data-moving-sample');
      const resting = sampleIds(output.markup, 'data-resting-sample');
      assert.deepEqual(moving, [round.paths.at(-1)!.id]);
      assert.equal(resting.length, N - 1);
      assert.ok(!resting.includes(moving[0]));
      assert.deepEqual([...resting, ...moving].sort(), round.paths.map(path => path.id).sort());
    }
    const complete = render(state, stable(0), { playback: { section: 0, mode: 'path', progress: 1, round } });
    assert.equal(sampleIds(complete.markup, 'data-moving-sample').length, 0);
    assert.deepEqual(sampleIds(complete.markup, 'data-resting-sample').sort(), round.paths.map(path => path.id).sort());
  }
});

test('the ending keeps the current n+1 slots and actual counts after a twelve-layer append', () => {
  let state = reduceState(initialState(), { type: 'personal-run', n: 12, p: 0.75, N: 16 }, () => 'scene-twelve');
  state = reduceState(state, { type: 'personal-next' });
  const round = state.personal!;
  assert.equal(round.N, 17);
  const before = JSON.stringify(round);
  for (const mobile of [false, true]) {
    const output = render(state, stable(9), { mobile });
    const slots = [...output.markup.matchAll(/data-board-slot="(\d+)" data-count="(\d+)"/g)];
    assert.equal(slots.length, 13);
    slots.forEach((slot, index) => assert.deepEqual([Number(slot[1]), Number(slot[2])], [index, round.counts[index]]));
    assert.match(output.result.foot, /n = 12.*p = 0\.75.*N = 17/);
    assert.equal(sampleIds(output.markup, 'data-resting-sample').length, 0, 'The ending owns aggregate bars, not a second sphere layer.');
  }
  assert.equal(JSON.stringify(round), before);
});

test('TR09→10 gives observed results one interpolated owner at all five checkpoints', () => {
  for (const n of [4, 8, 12] as const) for (const mobile of [false, true]) {
    const state = reduceState(initialState(), { type: 'personal-run', n, p: 0.25, N: 64 }, () => `return-${n}`);
    const round = state.personal!;
    for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
      const output = render(state, boundary(8, progress), { mobile });
      const owners = [...output.markup.matchAll(/data-return-slot="(\d+)" data-observed="(\d+)"/g)];
      assert.equal(owners.length, n + 1);
      owners.forEach((owner, index) => assert.deepEqual([Number(owner[1]), Number(owner[2])], [index, round.counts[index]]));
      assert.equal(owners.reduce((sum, owner) => sum + Number(owner[2]), 0), round.N);
      assert.ok(!output.markup.includes('data-board-observed='));
      assert.equal(sampleIds(output.markup, 'data-resting-sample').length, 0);
      for (const match of output.markup.matchAll(/<g data-histogram-slot="\d+"[^>]*>([\s\S]*?)<\/g>/g)) {
        assert.ok(!match[1].includes('<rect'), 'The source histogram must not retain a duplicate observed bar.');
        assert.equal((match[1].match(/<text /g) ?? []).length, 1, 'Only the source endpoint label remains.');
      }
    }
  }
});

test('workbench replay displays a saved prefix and never changes the saved final answer', () => {
  const state = reduceState(initialState(), { type: 'personal-run', n: 12, p: 0.25, N: 256 }, () => 'scene-replay');
  const round = state.personal!;
  const before = JSON.stringify(state);
  for (const progress of [0, 0.25, 0.5, 1]) {
    const output = render(state, stable(8), { playback: { section: 8, mode: 'round', progress, round } });
    const prefix = prefixExperiment(round, Math.floor(round.N * progress));
    const bars = [...output.markup.matchAll(/data-histogram-slot="(\d+)" data-observed="(\d+)"/g)];
    assert.deepEqual(bars.map(bar => Number(bar[2])), prefix.counts);
    assert.match(output.markup, new RegExp(`Replay · ${prefix.N} of ${round.N} shown`));
    assert.equal(JSON.stringify(state), before);
  }
});
