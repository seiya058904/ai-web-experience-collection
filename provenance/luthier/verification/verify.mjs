/**
 * Run with Node 24: npm run verify
 * No network, image libraries, browser, generated output, or test fixture copies.
 * The production TypeScript modules are imported through Node's type stripping.
 * Browser composition, real input and audio listening are separate QA gates.
 */
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHAPTERS, distances, storyToUnits, unitsToStory, sceneWeight } from '../src/story.ts';
import { ResonanceField, bowState, fieldGeometry, bridgeGrooves } from '../src/field.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestDirectory = resolve(root, 'assets-originals');
const failures = [];
let groups = 0;
let mediaCount = 0;
let mappingSamples = 0;
let drawingFrames = 0;
const mediaCache = new Map();
const productionFiles = new Set();
const originalFiles = new Map();
const near = (actual, expected, tolerance = 1e-9, message = 'Values must agree') => {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance,
    `${message}: received ${actual}, expected ${expected}`);
};

async function group(name, check) {
  try {
    await check();
    groups++;
    console.log(`PASS  ${name}`);
  } catch (error) {
    failures.push({ name, error: error instanceof Error ? error.message : String(error) });
    console.error(`FAIL  ${name}: ${failures.at(-1).error}`);
  }
}

function projectPath(base, name) {
  assert.equal(typeof name, 'string', 'A file reference must be a string');
  assert.ok(name.length > 0 && !name.includes('\0'), 'An empty or invalid file reference is not permitted');
  const path = resolve(base, name);
  const rel = relative(root, path);
  assert.ok(rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel),
    `File reference escapes the package: ${name}`);
  return path;
}

async function media(path) {
  if (mediaCache.has(path)) return mediaCache.get(path);
  const data = await readFile(path);
  assert.ok(data.length > 32, `Empty or truncated asset: ${relative(root, path)}`);
  let width;
  let height;
  let alpha = false;
  if (extname(path) === '.png') {
    assert.ok(data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `Invalid PNG: ${path}`);
    assert.equal(data.toString('ascii', 12, 16), 'IHDR', `Missing PNG dimensions: ${path}`);
    assert.equal(data.toString('ascii', data.length - 8, data.length - 4), 'IEND', `Incomplete PNG: ${path}`);
    width = data.readUInt32BE(16);
    height = data.readUInt32BE(20);
    alpha = data[25] === 6 || data[25] === 4;
  } else if (extname(path) === '.webp') {
    assert.equal(data.toString('ascii', 0, 4), 'RIFF', `Invalid WebP RIFF: ${path}`);
    assert.equal(data.toString('ascii', 8, 12), 'WEBP', `Invalid WebP format: ${path}`);
    assert.equal(data.readUInt32LE(4) + 8, data.length, `Truncated WebP: ${path}`);
    for (let cursor = 12; cursor + 8 <= data.length;) {
      const kind = data.toString('ascii', cursor, cursor + 4);
      const size = data.readUInt32LE(cursor + 4);
      const at = cursor + 8;
      assert.ok(at + size <= data.length, `Invalid WebP chunk size: ${path}`);
      if (kind === 'VP8X' && size >= 10) {
        width = data.readUIntLE(at + 4, 3) + 1;
        height = data.readUIntLE(at + 7, 3) + 1;
        alpha = Boolean(data[at] & 0x10);
        break;
      }
      if (kind === 'VP8 ' && size >= 10) {
        assert.equal(data.readUIntLE(at + 3, 3), 0x2a019d, `Invalid WebP frame: ${path}`);
        width = data.readUInt16LE(at + 6) & 0x3fff;
        height = data.readUInt16LE(at + 8) & 0x3fff;
        break;
      }
      if (kind === 'VP8L' && size >= 5) {
        assert.equal(data[at], 0x2f, `Invalid lossless WebP frame: ${path}`);
        const packed = data.readUInt32LE(at + 1);
        width = (packed & 0x3fff) + 1;
        height = ((packed >>> 14) & 0x3fff) + 1;
        alpha = Boolean((packed >>> 28) & 1);
        break;
      }
      cursor = at + size + (size % 2);
    }
  } else assert.fail(`Unsupported manifest image type: ${path}`);
  assert.ok(Number.isInteger(width) && width > 0 && Number.isInteger(height) && height > 0,
    `Missing or invalid image dimensions: ${path}`);
  const result = { width, height, alpha, bytes: data.length };
  mediaCache.set(path, result);
  mediaCount++;
  return result;
}

let manifest;
await group('Retained AI originals, production plates and concept provenance', async () => {
  manifest = JSON.parse(await readFile(resolve(manifestDirectory, 'manifest.json'), 'utf8'));
  assert.ok(manifest.generator && manifest.date && manifest.interpretation, 'Manifest provenance is incomplete');
  assert.ok(Array.isArray(manifest.assets) && Array.isArray(manifest.concepts), 'Manifest arrays are missing');
  const ids = manifest.assets.map(asset => asset.id);
  assert.equal(new Set(ids).size, ids.length, 'Duplicate production asset identifiers');
  for (const required of ['hero', 'wood', 'inside', 'tension', 'bow', 'craft', 'spruce', 'ebony']) {
    assert.ok(ids.includes(required), `Required production asset is missing: ${required}`);
  }
  for (const asset of manifest.assets) {
    assert.ok(typeof asset.prompt === 'string' && asset.prompt.trim().length > 40, `Missing exact prompt: ${asset.id}`);
    const sourcePath = projectPath(manifestDirectory, asset.original);
    const finalPath = projectPath(manifestDirectory, asset.production);
    const source = await media(sourcePath);
    const final = await media(finalPath);
    assert.ok(Math.abs(source.width / source.height - final.width / final.height) < 0.015,
      `Unrecorded aspect-ratio change: ${asset.id}`);
    if (asset.id === 'hero' || asset.id === 'bow') {
      assert.ok(source.alpha && final.alpha, `Required alpha channel is absent: ${asset.id}`);
    }
    if (asset.id === 'bow') assert.ok(final.height > final.width * 2, 'The bow cutout must retain its portrait composition');
    originalFiles.set(asset.original, source);
    productionFiles.add(finalPath);
  }
  assert.equal(manifest.concepts.length, CHAPTERS.length, 'Every chapter needs its curated concept');
  const conceptFiles = new Set();
  for (const concept of manifest.concepts) {
    const path = projectPath(manifestDirectory, concept.file);
    assert.ok(!conceptFiles.has(path), 'A section concept has been duplicated in the manifest');
    conceptFiles.add(path);
    assert.ok(concept.prompt?.trim().length > 40, `Missing concept prompt: ${concept.id}`);
    const dimensions = await media(path);
    assert.ok(dimensions.width > dimensions.height, `Desktop concept lost its composition: ${concept.file}`);
  }
});

await group('Runtime material derivatives retain valid crop provenance', async () => {
  assert.ok(manifest?.derivatives?.length >= 2, 'The model material derivatives are not documented');
  for (const derivative of manifest.derivatives) {
    const source = originalFiles.get(derivative.source);
    assert.ok(source, `Derivative source is not a retained original: ${derivative.source}`);
    assert.ok(derivative.operation?.trim(), `Derivative operation is missing: ${derivative.file}`);
    const crop = derivative.crop;
    assert.ok(crop && ['left', 'top', 'width', 'height'].every(key => Number.isInteger(crop[key])),
      `Derivative crop must use integer pixels: ${derivative.file}`);
    assert.ok(crop.left >= 0 && crop.top >= 0 && crop.width > 0 && crop.height > 0,
      `Invalid derivative crop: ${derivative.file}`);
    assert.ok(crop.left + crop.width <= source.width && crop.top + crop.height <= source.height,
      `Derivative crop exceeds the original: ${derivative.file}`);
    const path = projectPath(manifestDirectory, derivative.file);
    await media(path);
    productionFiles.add(path);
  }
});

await group('All shipped local images and font references resolve', async () => {
  const names = await readdir(resolve(root, 'public/assets'));
  for (const name of names) {
    const path = projectPath(resolve(root, 'public/assets'), name);
    if (!(await stat(path)).isFile()) continue;
    assert.ok(productionFiles.has(path), `Production asset has no provenance: public/assets/${name}`);
  }
  const files = ['index.html', 'src/style.css', 'src/main.ts', 'src/violin-model.ts'];
  const references = new Set();
  for (const file of files) {
    const source = await readFile(resolve(root, file), 'utf8');
    for (const match of source.matchAll(/['"](?:\.\/|\/)?((?:assets|fonts)\/[^'"\s)]+)['"]/g)) references.add(match[1]);
    for (const match of source.matchAll(/['"]([\w-]+-texture\.webp)['"]/g)) references.add(`assets/${match[1]}`);
  }
  assert.ok(references.size >= 14, 'Expected local image/font references were not found');
  for (const ref of references) {
    const path = projectPath(resolve(root, 'public'), ref);
    if (ref.endsWith('.woff2')) {
      const data = await readFile(path);
      assert.equal(data.toString('ascii', 0, 4), 'wOF2', `Invalid font: ${ref}`);
      assert.equal(data.readUInt32BE(8), data.length, `Incomplete font: ${ref}`);
      assert.ok(data.length > 1000, `Empty font: ${ref}`);
    } else {
      await media(path);
      assert.ok(productionFiles.has(path), `Referenced image has no provenance: ${ref}`);
    }
  }
  const favicon = await readFile(resolve(root, 'public/favicon.svg'), 'utf8');
  assert.ok(favicon.includes('<svg'), 'The local favicon is missing');
});

await group('Nine semantic chapters and their interactive controls are present', async () => {
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  const indices = [...html.matchAll(/<section\b[^>]*\bdata-scene="(\d+)"/g)].map(match => Number(match[1]));
  assert.deepEqual(indices, CHAPTERS.map((_, index) => index), 'Chapter document order is incomplete or duplicated');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'The document contains duplicate element IDs');
  for (const id of ['stage', 'scroll-score', 'resonance-field', 'chapter-dialog', 'credits-dialog',
    'anatomy-toggle', 'sound-toggle', 'motion-toggle', 'bow-progress', 'space-open', 'bow-image']) {
    assert.ok(ids.includes(id), `Required functional control or surface is absent: ${id}`);
  }
  for (const match of html.matchAll(/\baria-labelledby="([^"]+)"/g)) {
    for (const id of match[1].split(/\s+/)) assert.ok(ids.includes(id), `Broken accessible heading reference: ${id}`);
  }
});

await group('Story mapping stays bounded, monotonic and reversible through all endpoints', () => {
  for (const mobile of [false, true]) {
    const units = distances(mobile);
    assert.equal(units.length, CHAPTERS.length, 'Distances and chapters disagree');
    assert.ok(units.every(value => Number.isFinite(value) && value > 0), 'A chapter has no usable scroll distance');
    const total = units.reduce((sum, value) => sum + value, 0);
    near(storyToUnits(0, units), 0);
    near(storyToUnits(CHAPTERS.length, units), total);
    near(unitsToStory(0, units), 0);
    const end = unitsToStory(total, units);
    assert.ok(end >= 8.99 && end < 9, 'The final scroll position must resolve inside Return');
    assert.equal(Math.floor(unitsToStory(total * 2, units)), 8, 'Scroll overshoot leaves the last chapter');
    const samples = [];
    for (let i = 0; i <= 1800; i++) samples.push(i * 8.999 / 1800);
    for (let chapter = 1; chapter < 9; chapter++) samples.push(chapter - 1e-7, chapter, chapter + 1e-7);
    samples.sort((a, b) => a - b);
    let previous = -1;
    const forward = new Map();
    for (const score of samples) {
      const position = storyToUnits(score, units);
      assert.ok(Number.isFinite(position) && position >= previous && position >= 0 && position <= total,
        `Forward scroll became invalid at story ${score}`);
      near(unitsToStory(position, units), score, 1e-8, 'Story/scroll round trip changed chapter position');
      forward.set(score, position);
      previous = position;
      mappingSamples++;
    }
    previous = Infinity;
    for (const score of samples.reverse()) {
      const position = storyToUnits(score, units);
      assert.ok(position <= previous, 'Reverse scrolling moved forward');
      near(position, forward.get(score), 1e-10, 'Mapping depends on traversal history');
      previous = position;
    }
    for (const invalid of [NaN, Infinity, -Infinity, -100]) {
      const position = storyToUnits(invalid, units);
      const score = unitsToStory(invalid, units);
      assert.ok(Number.isFinite(position) && position >= 0 && position <= total, 'Invalid story input escaped its bounds');
      assert.ok(Number.isFinite(score) && score >= 0 && score < 9, 'Invalid scroll input escaped the story');
    }
  }
});

await group('Scene handoffs have no blank state, extra chapter, or discontinuous boundary', () => {
  const weights = score => CHAPTERS.map((_, i) => sceneWeight(i, score));
  for (let sample = 0; sample <= 3600; sample++) {
    const score = sample * 8.999999 / 3600;
    const values = weights(score);
    assert.ok(values.every(value => Number.isFinite(value) && value >= 0 && value <= 1), `Invalid scene opacity at ${score}`);
    near(values.reduce((sum, value) => sum + value, 0), 1, 1e-10, 'Handoff lost or duplicated total visibility');
    const active = values.map((value, i) => value > 1e-9 ? i : -1).filter(i => i >= 0);
    assert.ok(active.length <= 2 && active.length >= 1, 'Too many or no simultaneous scenes');
    if (active.length === 2) assert.equal(active[1], active[0] + 1, 'Nonadjacent chapters overlap');
  }
  for (let chapter = 1; chapter < 9; chapter++) {
    const left = weights(chapter - 1e-6);
    const right = weights(chapter + 1e-6);
    for (let i = 0; i < 9; i++) near(left[i], right[i], 1e-4, `Discontinuous scene ${chapter} boundary`);
  }
  near(sceneWeight(8, 8.999999), 1);
});

await group('The bow approaches, loads and vibrates in order; zero overrides remain silent', () => {
  const initial = bowState(0);
  const final = bowState(1);
  assert.equal(initial.contact, 0);
  assert.equal(initial.amplitude, 0);
  assert.equal(initial.load, 0);
  assert.ok(final.contact > .999 && final.amplitude > .999 && final.draw > .999, 'The bow cannot complete its stroke');
  assert.ok(final.load < .001, 'The string remains statically loaded after the draw');
  let firstContact = Infinity;
  let firstLoad = Infinity;
  let firstVibration = Infinity;
  let highestLoad = 0;
  let lastAmplitude = 0;
  const states = [];
  for (let i = 0; i <= 1000; i++) {
    const progress = i / 1000;
    const state = bowState(progress);
    states.push(state);
    assert.ok(Object.values(state).every(value => Number.isFinite(value) && value >= 0 && value <= 1), 'Unbounded bow state');
    if (state.contact > 1e-5) firstContact = Math.min(firstContact, progress);
    if (state.load > 1e-5) firstLoad = Math.min(firstLoad, progress);
    if (state.amplitude > 1e-5) firstVibration = Math.min(firstVibration, progress);
    if (state.contact < .999) assert.equal(state.amplitude, 0, 'Vibration began before the hair made full contact');
    assert.ok(state.amplitude >= lastAmplitude, 'Vibration decreases during a forward initial stroke');
    highestLoad = Math.max(highestLoad, state.load);
    lastAmplitude = state.amplitude;
  }
  assert.ok(firstContact >= .25 && firstVibration >= .50, 'The silent approach has been removed');
  assert.ok(firstContact < firstLoad && firstLoad < firstVibration, 'Bow energy appears out of causal order');
  assert.ok(firstVibration - firstContact > .10 && highestLoad > .70, 'The contact/loading hold is not perceptible');
  for (let i = 1000; i >= 0; i--) assert.deepEqual(bowState(i / 1000), states[i], 'Bow state depends on scrolling direction');
  for (const local of [.1, .5, .9]) {
    assert.deepEqual(bowState(local, null), bowState(local));
    for (const override of [0, .25, .5, .8, 1]) assert.deepEqual(bowState(local, override), bowState(override), 'An explicit bow override was ignored');
  }
  assert.deepEqual(bowState(-10), initial);
  assert.deepEqual(bowState(10), final);
});

// This records real renderer commands; it does not reimplement any geometry.
// It proves finite coordinates, deterministic reverse seeking and visible
// control effects, while actual pixel rendering remains a browser QA task.
function commandCanvas() {
  let hash = 2166136261;
  let commands = 0;
  let endpoint = null;
  let clips = 0;
  const pathEndpoints = [];
  const add = value => {
    const text = typeof value === 'number' ? String(Math.round(value * 1e5)) : String(value);
    for (let i = 0; i < text.length; i++) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  };
  const record = (name, args = []) => {
    commands++;
    add(name);
    if (name === 'beginPath') endpoint = null;
    if (name === 'moveTo' || name === 'lineTo') endpoint = [args[0], args[1]];
    if (name === 'quadraticCurveTo') endpoint = [args[2], args[3]];
    if (name === 'bezierCurveTo') endpoint = [args[4], args[5]];
    if (name === 'stroke' && !args.length && endpoint) pathEndpoints.push([...endpoint]);
    if (name === 'clip') clips++;
    for (const value of args) {
      if (typeof value === 'number') assert.ok(Number.isFinite(value), `Nonfinite Canvas coordinate in ${name}`);
      add(value);
    }
  };
  const target = {};
  for (const method of ['setTransform', 'clearRect', 'beginPath', 'moveTo', 'lineTo', 'quadraticCurveTo',
    'bezierCurveTo', 'closePath', 'stroke', 'fill', 'fillRect', 'rect', 'clip', 'ellipse', 'save', 'restore', 'translate', 'rotate', 'scale']) {
    target[method] = (...args) => record(method, args);
  }
  for (const method of ['createLinearGradient', 'createRadialGradient']) {
    target[method] = (...args) => {
      record(method, args);
      return { addColorStop: (...values) => record('addColorStop', values) };
    };
  }
  const context = new Proxy(target, {
    set(object, key, value) {
      if (typeof value === 'number') assert.ok(Number.isFinite(value), `Invalid Canvas state: ${String(key)}`);
      record(String(key), [value]);
      object[key] = value;
      return true;
    },
  });
  return {
    width: 1, height: 1, getContext: () => context,
    reset() { hash = 2166136261; commands = 0; endpoint = null; clips = 0; pathEndpoints.length = 0; },
    signature() { return `${hash >>> 0}:${commands}`; },
    commandCount() { return commands; },
    endpoints() { return pathEndpoints; },
    clipCount() { return clips; },
  };
}

await group('Tension lanes attach to the photographed grooves and release into one unobstructed bow path', () => {
  assert.deepEqual(bridgeGrooves(1672, 941), [
    { x: 1530, y: 334 }, { x: 1552, y: 347 }, { x: 1578, y: 372 }, { x: 1603, y: 382 },
  ], 'Native plate registration changed');
  const phone = bridgeGrooves(390, 844);
  assert.ok(phone.every(point => point.x > 270 && point.x < 340 && point.y > 420 && point.y < 465),
    'The phone crop moved its grooves outside the visible image');
  for (const [width, height] of [[390, 600], [390, 844], [760, 941], [1024, 768], [1672, 941], [3840, 2160]]) {
    const grooves = bridgeGrooves(width, height);
    assert.ok(grooves.every(point => Number.isFinite(point.x) && Number.isFinite(point.y)), 'Invalid registered groove');
    const canvas = commandCanvas();
    const field = new ResonanceField(canvas);
    field.resize(width, height);
    const frame = { story: 4.5, time: 1.3, reduced: false, material: 'maple', resonanceMode: 'air', spaceOpen: .55, bowOverride: null };
    canvas.reset();
    field.render(frame);
    drawingFrames++;
    assert.ok(canvas.clipCount() > 0, 'The photographed ridge cannot occlude its strings');
    for (const groove of grooves) assert.ok(canvas.endpoints().some(([x, y]) => Math.hypot(x - groove.x, y - groove.y) < .02),
      'A live tension string is not attached to its photographed groove');
    assert.ok(canvas.endpoints().every(([x]) => x <= grooves[3].x + .02), 'A string continues through the opaque bridge');
    canvas.reset();
    field.render({ ...frame, story: 4.9 });
    drawingFrames++;
    const geometry = fieldGeometry(width, height);
    assert.equal(canvas.clipCount(), 0, 'The withdrawn bridge still cuts holes in the First Bow path');
    assert.ok(canvas.endpoints().length >= 4, 'A lane disappeared before the four strings converged');
    for (const [x, y] of canvas.endpoints()) {
      near(x, geometry.stringEndX, .02, 'The released string did not reach the common bow endpoint');
      near(y, geometry.contactY, .02, 'A released lane failed to join the selected string');
    }
    field.dispose();
  }
});

await group('Renderer seeks reverse safely, respects reduced motion and stays within its pixel budget', () => {
  const base = { story: 0, time: 1.3, reduced: false, material: 'maple', resonanceMode: 'air', spaceOpen: .55, bowOverride: null };
  const scores = [0, .5, .82, .999999, 1, 1.82, 2, 2.82, 3, 3.82, 4, 4.82, 4.999999,
    5, 5.32, 5.43, 5.56, 5.78, 5.999999, 6, 6.4, 6.82, 7, 7.5, 7.999999, 8, 8.999999];
  for (const [width, height] of [[390, 600], [390, 844], [760, 941], [1920, 1080], [3840, 2160]]) {
    const canvas = commandCanvas();
    const field = new ResonanceField(canvas);
    field.resize(width, height);
    assert.ok(canvas.width * canvas.height <= 5_010_000, 'Canvas allocation exceeds the agreed pixel budget');
    const geometry = fieldGeometry(width, height);
    assert.ok(Object.values(geometry).every(value => typeof value === 'boolean' || Number.isFinite(value)), 'Invalid viewport geometry');
    assert.ok(geometry.stringStartX < geometry.contactX && geometry.contactX < geometry.bridgeX
      && geometry.bridgeX < geometry.stringEndX && geometry.contactY > 0 && geometry.contactY < height,
    'The bow/bridge contact order is invalid');
    const render = overrides => {
      canvas.reset();
      field.render({ ...base, ...overrides });
      drawingFrames++;
      assert.ok(canvas.commandCount() > 10, 'A valid story frame drew nothing');
      return canvas.signature();
    };
    const forward = new Map(scores.map(story => [story, render({ story })]));
    for (const story of [...scores].reverse()) assert.equal(render({ story }), forward.get(story), 'Renderer output depends on seek history');
    assert.equal(render({ story: 5.2, time: 0 }), render({ story: 5.2, time: 9 }), 'The string moved before contact');
    assert.notEqual(render({ story: 5.8, time: 0 }), render({ story: 5.8, time: 9 }), 'A held contacted string has no living vibration');
    assert.equal(render({ story: 7.4, time: 0, reduced: true }), render({ story: 7.4, time: 9, reduced: true }), 'Reduced motion still animates');
    assert.notEqual(render({ story: 7.4, spaceOpen: 0 }), render({ story: 7.4, spaceOpen: 1 }), 'Open the space does not change the sculpture');
    assert.notEqual(render({ story: 6.4, resonanceMode: 'string' }), render({ story: 6.4, resonanceMode: 'air' }), 'Resonance controls have no effect');
    assert.notEqual(render({ story: 1.4, material: 'spruce' }), render({ story: 1.4, material: 'maple' }), 'Wood controls have no effect');
    field.dispose();
    canvas.reset();
    field.render(base);
    assert.equal(canvas.commandCount(), 0, 'A disposed renderer is still drawing');
  }
});

if (failures.length) {
  console.error(`\nVerification failed: ${failures.length} group(s). ${groups} group(s) passed.`);
  process.exitCode = 1;
} else {
  console.log(`\nVerified ${groups} invariant groups; ${mediaCount} image files; ${mappingSamples} mapping samples; ${drawingFrames} drawing frames.`);
  console.log('Real-browser layout, input, restoration and audible output remain separate QA checks.');
}
