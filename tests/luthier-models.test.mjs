// Retained LUTHIER pure-model checks from the supplied verify.mjs (MIT source).
// Archive identity and original verification source are preserved in provenance/luthier/.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, distances, storyToUnits, unitsToStory, sceneWeight } from '../experiences/luthier/src/story.ts';
import { ResonanceField, bowState, fieldGeometry, bridgeGrooves } from '../experiences/luthier/src/field.ts';
const near=(actual,expected,tolerance=1e-9,message='Values must agree')=>{
  assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=tolerance,
    `${message}: received ${actual}, expected ${expected}`);
};
test('Story mapping stays bounded, monotonic and reversible through all endpoints', () => {
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

test('Scene handoffs have no blank state, extra chapter, or discontinuous boundary', () => {
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

test('The bow approaches, loads and vibrates in order; zero overrides remain silent', () => {
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

test('Tension lanes attach to the photographed grooves and release into one unobstructed bow path', () => {
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

    assert.ok(canvas.clipCount() > 0, 'The photographed ridge cannot occlude its strings');
    for (const groove of grooves) assert.ok(canvas.endpoints().some(([x, y]) => Math.hypot(x - groove.x, y - groove.y) < .02),
      'A live tension string is not attached to its photographed groove');
    assert.ok(canvas.endpoints().every(([x]) => x <= grooves[3].x + .02), 'A string continues through the opaque bridge');
    canvas.reset();
    field.render({ ...frame, story: 4.9 });

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

test('Renderer seeks reverse safely, respects reduced motion and stays within its pixel budget', () => {
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
