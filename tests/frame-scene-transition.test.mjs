import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { FrameAssets, assetPath, assetURL, resolveLocalAsset } from '../experiences/frame/src/assets.ts';
import { getPose, normalizeFrame, pushPositions, DEFAULT_CONFIG } from '../experiences/frame/src/timeline.ts';

// The application uses Vite's extensionless imports. Transpile just the two
// browser classes and inject their real pure dependencies for focused state tests.
async function loadBrowserClass(name, dependencies) {
  const source = await readFile(new URL(`../experiences/frame/src/${name}.ts`, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText.replace(/^import[^\n]*\n/gm, '');
  const key = `__frame_test_${name}`;
  globalThis[key] = dependencies;
  const code = `const {${Object.keys(dependencies).join(',')}}=globalThis.${key};\n${compiled}`;
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}

const sceneModule = await loadBrowserClass('scene', { FrameAssets, assetPath, resolveLocalAsset, getPose, normalizeFrame });
const { Scene, shotAssetURL, cameraForWidth, fitImage } = sceneModule;
const { Handoff, switchWeights } = await loadBrowserClass('transitions', {
  FrameAssets, assetURL, getPose, pushPositions, cameraForWidth, fitImage, shotAssetURL,
});

function browser() {
  const viewport = { portrait: false };
  const loaded = [];
  globalThis.matchMedia = () => ({ matches: viewport.portrait });
  globalThis.devicePixelRatio = 1;
  globalThis.innerHeight = 900;
  globalThis.document = { body: { dataset: {} } };
  globalThis.Image = class {
    complete = false; naturalWidth = 1280; naturalHeight = 800;
    onload = null; onerror = null;
    set src(value) { this.url = value; loaded.push(value); queueMicrotask(() => { this.complete = true; this.onload?.(); }); }
    async decode() {}
  };
  return { viewport, loaded };
}
const classes = () => ({
  values: new Set(),
  add(value) { this.values.add(value); },
  remove(value) { this.values.delete(value); },
  contains(value) { return this.values.has(value); },
});
const image = key => ({ key, naturalWidth: 1280, naturalHeight: 800 });
function fixture({ frame = 9, shot, kind } = {}) {
  const context = { fills: 0, images: [],
    fillRect() { this.fills += 1; },
    drawImage(value) { assert.ok(value, 'every planned panel has a real decoded image'); this.images.push(value); },
    save() {}, restore() {}, translate() {}, rotate() {}, fillText() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, arc() {}, fill() {},
  };
  const canvas = { classList: classes(), width: 0, height: 0, getContext: () => context };
  const fallback = { src: '', alt: '', addEventListener() {}, getAttribute(name) { return this[name]; } };
  const source = { srcset: '' };
  const picture = { classList: classes(), getBoundingClientRect: () => ({ width: 800, height: 500 }), querySelector: () => fallback };
  const notice = { hidden: true, span: { textContent: '' }, querySelector() { return this.span; } };
  const nodes = { canvas, '.scene-picture': picture, '.handoff-media': picture, img: fallback, source, '.scene-notice': notice,
    '.frame-description': { textContent: '' }, '.frame-number': { textContent: '' } };
  const element = {
    dataset: { frame: String(frame), scene: 'test', ...(shot ? { shot } : {}), ...(kind ? { transition: String(kind) } : {}) },
    style: { setProperty() {} },
    querySelector: selector => nodes[selector],
    getBoundingClientRect: () => ({ top: 0, bottom: 900, height: 900 }),
  };
  return { element, canvas, picture, fallback, source, notice, context };
}
const settle = () => new Promise(resolve => setImmediate(resolve));

test('a successfully cached target clears the previous target failure notice', async () => {
  browser();
  const f = fixture();
  const cache = new Map();
  const assets = { getCached: (frame, preset, camera) => cache.get(assetURL(frame, preset, camera)), load: async () => { throw Error('missing'); } };
  const scene = new Scene(f.element, assets); scene.visible = true;
  await scene.prepare();
  assert.equal(f.notice.hidden, false);
  cache.set(assetURL(10, 'ease-in', 'landscape'), image('correct10'));
  scene.setTarget(10, 'ease-in');
  assert.equal(f.element.dataset.renderedFrame, '10');
  assert.equal(f.element.dataset.resourceState, 'ready');
  assert.equal(f.notice.hidden, true);
});

test('a camera change exposes the matching fallback and a late old camera cannot replace it', async () => {
  const { viewport } = browser();
  const f = fixture();
  const cache = new Map([[assetURL(9, 'even', 'landscape'), image('landscape9')]]);
  let resolvePortrait;
  const assets = { getCached: (frame, preset, camera) => cache.get(assetURL(frame, preset, camera)),
    load: () => new Promise(resolve => { resolvePortrait = resolve; }) };
  const scene = new Scene(f.element, assets); scene.visible = true; scene.setTarget(9);
  assert.equal(f.canvas.classList.contains('ready'), true);
  viewport.portrait = true; scene.resize();
  assert.equal(f.canvas.classList.contains('ready'), false);
  assert.equal(f.picture.classList.contains('canvas-ready'), false);
  assert.equal(f.source.srcset, '/frames/portrait/even-09.webp');
  assert.equal(f.element.dataset.resourceState, 'loading');
  viewport.portrait = false; scene.resize();
  resolvePortrait(image('late-portrait9')); await settle();
  assert.equal(f.element.dataset.renderedCamera, 'landscape');
  assert.equal(f.context.images.at(-1).key, 'landscape9');
});

test('static shots preload and display their own packaged sources, then return to real sequence frames', async () => {
  const { loaded, viewport } = browser();
  const f = fixture({ frame: 6, shot: 'preparation' });
  const scene = new Scene(f.element, new FrameAssets()); scene.visible = true;
  await scene.preload([2, 6], 'even');
  scene.setTarget(2);
  assert.equal(f.fallback.src, '/stills/glance-landscape.webp');
  assert.equal(f.source.srcset, '/stills/glance-portrait.webp');
  assert.ok(loaded.includes('/stills/preparation-landscape.webp'));
  assert.equal(f.element.dataset.renderedShot, 'preparation');
  scene.setShot(null); await settle();
  assert.equal(f.fallback.src, '/frames/landscape/even-02.webp');
  assert.equal(f.element.dataset.renderedShot, 'sequence');
  scene.setShot('hero'); await scene.preload([2]); scene.setTarget(2);
  assert.equal(f.fallback.src, '/frames/hero/even-02.webp');
  viewport.portrait = true; scene.resize(); await settle();
  assert.equal(f.element.dataset.renderedCamera, 'portrait');
  assert.equal(f.fallback.src, '/frames/hero/even-02.webp');
  assert.equal(f.source.srcset, '/frames/hero-portrait/even-02.webp');
  assert.ok(loaded.includes('/frames/hero-portrait/even-02.webp'));
  assert.equal(f.context.images.at(-1).url, '/frames/hero-portrait/even-02.webp');
  scene.setShot('ending');scene.setTarget(24);await settle();
  assert.equal(f.source.srcset, '/stills/resting-portrait.webp');
  assert.equal(f.fallback.alt, 'Boop sits quietly beside the aligned red block and yellow outline.');
});

test('a handoff cache miss never clears a completed canvas and exposes the exact current fallback', () => {
  const { viewport } = browser();
  const f = fixture({ kind: 8 });
  const cache = new Map();
  for (const frame of [1, 6, 9, 12, 24]) cache.set(assetURL(frame, 'even', 'landscape'), image(`even${frame}`));
  const assets = { getCached: (frame, preset, camera) => cache.get(assetURL(frame, preset, camera)), load: () => new Promise(() => {}) };
  let state = { config: DEFAULT_CONFIG, heroFrame: 1, selectedFrame: 9, reduced: false };
  const handoff = new Handoff(f.element, assets, () => state); handoff.visible = true; handoff.progress = 0.5; handoff.draw();
  const fills = f.context.fills;
  assert.equal(f.canvas.classList.contains('ready'), true);
  viewport.portrait = true;
  state = { ...state, config: { preset: 'ease-in', hold6: 3, hold18: 0 }, selectedFrame: 10 };
  handoff.draw();
  assert.equal(f.context.fills, fills, 'the old canvas is not resized or partially repainted');
  assert.equal(f.canvas.classList.contains('ready'), false);
  assert.equal(f.picture.classList.contains('canvas-ready'), false);
  assert.equal(f.fallback.src, '/frames/portrait/ease-in-10.webp');
  assert.equal(f.fallback.alt, getPose(10, 'ease-in').description);
  assert.equal(f.element.dataset.resourceState, 'loading');
});

test('handoff preparation covers every panel at the five review positions in allnine transitions', async () => {
  const { viewport } = browser();
  const assets = { getCached: (frame, preset, camera) => image(assetURL(frame, preset, camera)), load: async () => image('loaded') };
  for (let kind = 1; kind <= 9; kind += 1) {
    const f = fixture({ kind });
    const handoff = new Handoff(f.element, assets, () => ({ config: DEFAULT_CONFIG, heroFrame: 7, selectedFrame: 11, reduced: false }));
    handoff.visible = true;
    for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
      handoff.progress = progress; handoff.draw(); await settle();
      assert.equal(f.element.dataset.resourceState, 'ready', `transition ${kind} at ${progress}`);
      assert.ok(f.context.images.length > 0);
    }
    if (kind === 1) {
      viewport.portrait = true;
      handoff.progress = 0; handoff.draw(); await settle();
      assert.equal(f.element.dataset.resourceState, 'ready');
      assert.equal(f.fallback.src, '/frames/hero-portrait/even-07.webp');
      assert.equal(f.context.images.at(-1).url, '/frames/hero-portrait/even-07.webp');
      viewport.portrait = false;
    }
  }
});

test('shot mapping composes raw paths before resolving embedded images', () => {
  browser();
  const normal='data:image/webp;base64,UklGRgQAAABXRUJQAQIDBA==';
  const hero='data:image/webp;base64,UklGRgQAAABXRUJQBQYHCA==';
  const still='data:image/webp;base64,UklGRgQAAABXRUJQCQoLDA==';
  const script={textContent:JSON.stringify({
    'frames/landscape/even-06.webp':normal,
    'frames/portrait/even-06.webp':normal,
    'frames/hero/even-06.webp':hero,
    'frames/hero-portrait/even-06.webp':hero,
    'stills/preparation-landscape.webp':still,
    'stills/contact-portrait.webp':still,
  })};
  document.getElementById=id=>id==='frame-embedded-assets'?script:null;
  assert.equal(shotAssetURL(null,6,'even','landscape'),normal);
  assert.equal(shotAssetURL('hero',6,'even','landscape'),hero);
  assert.equal(shotAssetURL('hero',6,'even','portrait'),hero);
  assert.equal(shotAssetURL('preparation',6,'even','landscape'),still);
  assert.equal(shotAssetURL('contact',6,'even','portrait'),still);
});

test('frames that change inside a handoff cross-fade around each edge instead of cutting', () => {
  const twelveSixteenEighteen = { frames: [12, 16, 18], edges: [.35, .65] };
  assert.deepEqual(switchWeights(twelveSixteenEighteen, .1), [[12, 1], [16, 0], [18, 0]]);
  assert.deepEqual(switchWeights(twelveSixteenEighteen, .5), [[12, 0], [16, 1], [18, 0]]);
  assert.deepEqual(switchWeights(twelveSixteenEighteen, .9), [[12, 0], [16, 0], [18, 1]]);
  const middle = switchWeights(twelveSixteenEighteen, .35);
  assert.equal(middle[0][1], 1, 'the earlier frame stays opaque underneath');
  assert.ok(Math.abs(middle[1][1] - .5) < 1e-9, 'the arriving frame is half way at the edge');
  // Every step through the handoff changes a frame's opacity by a small amount.
  let previous = switchWeights(twelveSixteenEighteen, 0);
  for (let p = .005; p <= 1; p += .005) {
    const next = switchWeights(twelveSixteenEighteen, p);
    next.forEach(([, weight], i) => assert.ok(Math.abs(weight - previous[i][1]) < .06 || weight === 0 || previous[i][1] === 0));
    previous = next;
  }
});
