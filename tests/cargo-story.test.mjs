import test from 'node:test';
import assert from 'node:assert/strict';

import { chapters, transitions, BOX_SPEC } from '../experiences/cargo/src/story-data.ts';
import { clamp, smooth, evaluateTransition, evaluateStory } from '../experiences/cargo/src/story-state.ts';
import {
  CONTAINER_DIMENSIONS, DEFAULT_CONTAINER_STATE, CARGO_BLOCKS,
  normalizeContainerState, getContainerPose, describeContainerState,
  renderContainerFallback,
} from '../experiences/cargo/src/container-fallback.ts';

const EPSILON = 1e-9;
const MODES = ['identity', 'interior', 'doors', 'road', 'rail', 'lift', 'destination'];
const HIGHLIGHTS = ['none', 'corners', 'doors', 'identity'];
const STOPS = [0, 0.25, 0.5, 0.75, 1];
const wordCount = value => value.trim().split(/\s+/u).length;
const approximately = (actual, expected, message) => assert.ok(Math.abs(actual - expected) <= EPSILON, `${message}: ${actual} != ${expected}`);

function assertFiniteTree(value, path = 'state') {
  if (typeof value === 'number') assert.ok(Number.isFinite(value), `${path} must be finite`);
  else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) assertFiniteTree(child, `${path}.${key}`);
  }
}

function makeSegments(height = 900) {
  let top = 0;
  const segments = [];
  chapters.forEach((chapter, index) => {
    segments.push(Object.freeze({ id: chapter.id, index, top, height: height * 1.5, kind: 'chapter' }));
    top += height * 1.5;
    if (transitions[index]) {
      segments.push(Object.freeze({ id: transitions[index].id, index, top, height: height * 2.4, kind: 'transition' }));
      top += height * 2.4;
    }
  });
  return Object.freeze(segments);
}

/** Check the simple SVG subset emitted by the fallback, without a browser or XML dependency. */
function inspectSvg(svg) {
  assert.match(svg, /^<svg\s[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/u);
  assert.match(svg, /<\/svg>$/u);
  assert.doesNotMatch(svg, /NaN|Infinity|undefined|\[object Object\]/u);
  assert.doesNotMatch(svg, /<script|<foreignObject|\son\w+=/iu);
  const stack = [];
  const tags = [...svg.matchAll(/<(\/?)([A-Za-z][\w:-]*)\b([^<>]*?)(\/?)>/gu)];
  assert.equal(tags.length, (svg.match(/</gu) ?? []).length, 'Every markup delimiter belongs to a recognized tag');
  const allowed = new Set(['svg', 'title', 'g', 'polygon', 'line', 'ellipse', 'rect', 'text', 'path', 'circle']);
  for (const [, close, tag, attributes, selfClose] of tags) {
    assert.ok(allowed.has(tag), `Unexpected SVG element ${tag}`);
    if (close) {
      assert.equal(stack.pop(), tag, `Balanced SVG closing element ${tag}`);
      continue;
    }
    const found = [...attributes.matchAll(/([:\w-]+)="([^"]*)"/gu)];
    assert.equal(new Set(found.map(match => match[1])).size, found.length, `No duplicate attributes on ${tag}`);
    for (const [, name, value] of found) {
      assert.doesNotMatch(value, /[<>]/u, `${name} is a valid quoted attribute`);
      if (['x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'rx', 'ry', 'r', 'stroke-width', 'opacity'].includes(name)) {
        assert.ok(Number.isFinite(Number(value)), `${tag}.${name} is finite`);
      }
      if (name === 'points' || name === 'viewBox') {
        const numbers = value.trim().split(/[\s,]+/u).map(Number);
        assert.ok(numbers.length >= 4 && numbers.every(Number.isFinite), `${tag}.${name} contains finite geometry`);
        assert.equal(numbers.length % 2, 0, `${tag}.${name} contains complete coordinate pairs`);
      }
    }
    if (!selfClose) stack.push(tag);
  }
  assert.deepEqual(stack, [], 'Every nonempty SVG element is closed');
  assert.equal(tags.filter(([, close, tag]) => !close && tag === 'svg').length, 1);
  assert.match(svg, /role="img"/u);
  assert.match(svg, /aria-label="CARGO \/ BOX-001\. Fictional exhibit ID\./u);
  assert.match(svg, /<title>CARGO \/ BOX-001/u);
  return tags;
}

function shapeDelta(withCargo, withoutCargo) {
  const shapes = svg => svg.match(/<(?:polygon|line|ellipse|rect)\b[^>]*\/>/gu) ?? [];
  const remaining = new Map();
  for (const shape of shapes(withoutCargo)) remaining.set(shape, (remaining.get(shape) ?? 0) + 1);
  const added = [];
  for (const shape of shapes(withCargo)) {
    const count = remaining.get(shape) ?? 0;
    if (count) remaining.set(shape, count - 1);
    else added.push(shape);
  }
  assert.ok([...remaining.values()].every(count => count === 0), 'Packing must not remove the original container geometry');
  return added.sort();
}

test('All eleven authored chapters provide distinct content and two substantive English beats', () => {
  const required = [
    ['One Box', /corrugations|corner fittings/u, /scratch/u],
    ['Within the Walls', /empty/u, /packed|cargo/u],
    ['Closed and Recorded', /hinges|doors/u, /seal|custody/u],
    ['Overland', /chassis/u, /support|corners/u],
    ['Intermodal', /road/u, /rail/u],
    ['Across the Land', /wagons|rails/iu, /BOX-001|scratch/u],
    ['The Yard', /lane|stacks/u, /lifting|corners/u],
    ['The Lift', /spreader/iu, /rises|suspended/u],
    ['Open Water', /shipboard|deck/u, /vessel|water/u],
    ['Another Shore', /berth|ports/u, /warehouse|receiving/u],
    ['Open Again', /scratch/u, /cargo|arrangement/u],
  ];
  assert.equal(chapters.length, required.length, 'The complete story must be available without prior viewing');
  assert.equal(new Set(chapters.map(chapter => chapter.id)).size, required.length);
  assert.equal(new Set(chapters.map(chapter => chapter.beatBody)).size, required.length, 'Later chapters cannot repeat earlier body content');
  required.forEach(([name, first, second], index) => {
    const chapter = chapters[index];
    assert.equal(chapter.id, `ch-${String(index + 1).padStart(2, '0')}`);
    assert.equal(chapter.name, name);
    assert.ok(wordCount(chapter.lead) >= 6, `${chapter.id} establishes a readable first beat`);
    assert.ok(wordCount(chapter.beatBody) >= 20, `${chapter.id} develops an independent second beat`);
    assert.notEqual(chapter.lead, chapter.beatBody);
    assert.notEqual(chapter.heading, chapter.beatTitle);
    assert.match(chapter.beatBody, first, `${chapter.id} explains its first subject-specific observation`);
    assert.match(chapter.beatBody, second, `${chapter.id} explains its developed observation`);
    assert.ok(wordCount(chapter.alt) >= 10, `${chapter.id} has meaningful image alternative text`);
    assert.ok(chapter.actionLabel.trim() && chapter.detail.trim());
    assert.doesNotMatch(Object.values(chapter).join(' '), /lorem ipsum|coming soon|TODO|\p{Script=Han}/iu);
  });
});

test('The ten boundary contracts form one unbroken, individually authored route', () => {
  assert.equal(transitions.length, chapters.length - 1);
  const seenStages = new Set();
  transitions.forEach((transition, index) => {
    assert.equal(transition.from, chapters[index].id);
    assert.equal(transition.to, chapters[index + 1].id);
    assert.equal(transition.id, `tr-${String(index + 1).padStart(2, '0')}-${String(index + 2).padStart(2, '0')}`);
    assert.ok(wordCount(transition.anchor) >= 3, `${transition.id} exposes a concrete physical anchor`);
    assert.equal(transition.stages.length, 5);
    assert.equal(new Set(transition.stages).size, 5, `${transition.id} has five distinct observations`);
    transition.stages.forEach((stage, stageIndex) => {
      assert.ok(wordCount(stage) >= 4, `${transition.id}, stage ${stageIndex} is an authored composition`);
      assert.ok(!seenStages.has(stage), 'Repeated generic transition copy cannot stand in for a boundary');
      seenStages.add(stage);
      assert.equal(evaluateTransition(index, STOPS[stageIndex]).stage, stageIndex);
    });
  });
});

test('One nominal exterior envelope and six nonoverlapping cargo blocks serve departure and arrival', () => {
  assert.deepEqual(CONTAINER_DIMENSIONS, { length: BOX_SPEC.length, width: BOX_SPEC.width, height: BOX_SPEC.height });
  assert.deepEqual(CONTAINER_DIMENSIONS, { length: 6.058, width: 2.438, height: 2.591 });
  assert.equal(BOX_SPEC.id, 'BOX-001');
  assert.equal(BOX_SPEC.fictional, true);
  assert.equal(BOX_SPEC.scratch.id, 'upper-right-door-scratch');
  assert.equal(CARGO_BLOCKS.length, 6);
  assert.equal(BOX_SPEC.cargo.blockCount, CARGO_BLOCKS.length);
  const specified = BOX_SPEC.cargo.zCenters.flatMap(z => BOX_SPEC.cargo.xCenters.map(x => ({
    x, z, width: BOX_SPEC.cargo.blockDimensions.length,
    depth: BOX_SPEC.cargo.blockDimensions.width, height: BOX_SPEC.cargo.blockDimensions.height,
  })));
  assert.deepEqual(CARGO_BLOCKS, specified, 'Editorial dimensions and rendered cargo must agree');
  for (const [index, block] of CARGO_BLOCKS.entries()) {
    assert.ok(block.width > 0 && block.depth > 0 && block.height > 0);
    assert.ok(Math.abs(block.x) + block.width / 2 < CONTAINER_DIMENSIONS.length / 2 - 0.09, `Block ${index} fits between end walls`);
    assert.ok(Math.abs(block.z) + block.depth / 2 < CONTAINER_DIMENSIONS.width / 2 - 0.07, `Block ${index} fits between side walls`);
    assert.ok(BOX_SPEC.cargo.floorTop + block.height < CONTAINER_DIMENSIONS.height - 0.07, `Block ${index} fits below the roof`);
    for (const other of CARGO_BLOCKS.slice(index + 1)) {
      const separateX = Math.abs(block.x - other.x) >= (block.width + other.width) / 2;
      const separateZ = Math.abs(block.z - other.z) >= (block.depth + other.depth) / 2;
      assert.ok(separateX || separateZ, 'Authored cargo blocks must not intersect');
    }
  }
});

test('Normalization bounds input, preserves independent partial state and permits an exact model reset', () => {
  const baseline = { ...DEFAULT_CONTAINER_STATE };
  let current = normalizeContainerState({ mode: 'destination', packed: true, doorsOpen: 1, progress: 0.8, highlight: 'identity', reduced: true });
  const saved = { ...current };
  current = normalizeContainerState({ doorsOpen: 0.25 }, current);
  assert.equal(current.mode, 'destination');
  assert.equal(current.packed, true);
  assert.equal(current.doorsOpen, 0.25);
  assert.deepEqual(saved, { mode: 'destination', packed: true, doorsOpen: 1, progress: 0.8, highlight: 'identity', reduced: true });
  for (const invalid of [-100, 100, Number.NaN, Infinity, -Infinity]) {
    const normalized = normalizeContainerState({ progress: invalid, doorsOpen: invalid }, current);
    assertFiniteTree(normalized);
    assert.ok(normalized.progress >= 0 && normalized.progress <= 1);
    assert.ok(normalized.doorsOpen >= 0 && normalized.doorsOpen <= 1);
  }
  const reset = normalizeContainerState(DEFAULT_CONTAINER_STATE, current);
  assert.deepEqual(reset, baseline);
  assert.equal(renderContainerFallback(reset), renderContainerFallback(), 'Reset reconstructs the original rendered model');
  reset.packed = true;
  assert.deepEqual(DEFAULT_CONTAINER_STATE, baseline, 'An instance must not mutate shared defaults');
});

test('Every transition is finite, bounded and history-independent during forward, reverse and direct access', async t => {
  const immutableBefore = JSON.stringify({ CONTAINER_DIMENSIONS, CARGO_BLOCKS, DEFAULT_CONTAINER_STATE, BOX_SPEC });
  for (let index = 0; index < transitions.length; index++) {
    await t.test(transitions[index].id, () => {
      const positions = Array.from({ length: 201 }, (_, step) => step / 200);
      const snapshots = positions.map(p => evaluateTransition(index, p));
      snapshots.forEach(frame => {
        assertFiniteTree(frame);
        assert.ok(frame.occlusion >= 0 && frame.occlusion <= 1);
        assert.ok(frame.container.doorsOpen >= 0 && frame.container.doorsOpen <= 1);
        assert.ok(frame.container.progress >= 0 && frame.container.progress <= 1);
        assert.ok(frame.cameraScale > 0);
        assert.ok(frame.stage >= 0 && frame.stage <= 4);
      });
      positions.toReversed().forEach((p, reverseIndex) => assert.deepEqual(evaluateTransition(index, p), snapshots[positions.length - 1 - reverseIndex]));
      for (const step of [100, 173, 3, 199, 0, 51, 200, 99, 101, 25]) {
        assert.deepEqual(evaluateTransition(index, positions[step]), snapshots[step], 'Direct access cannot require earlier events');
      }
      const mutableFrame = evaluateTransition(index, 0.5);
      mutableFrame.container.doorsOpen = 0.123;
      assert.deepEqual(evaluateTransition(index, 0.5), snapshots[100], 'Returned frames must not alias shared mutable state');
    });
  }
  assert.equal(JSON.stringify({ CONTAINER_DIMENSIONS, CARGO_BLOCKS, DEFAULT_CONTAINER_STATE, BOX_SPEC }), immutableBefore);
});

test('Discrete support replacements are completely hidden by an opaque structural handoff', () => {
  const replacements = [
    { boundary: 2, at: 0.5, from: 'floor', to: 'road' },
    { boundary: 3, at: 0.5, from: 'road', to: 'rail' },
    { boundary: 5, at: 0.5, from: 'rail', to: 'floor' },
    { boundary: 7, at: 0.62, from: 'spreader', to: 'deck' },
    { boundary: 8, at: 0.78, from: 'deck', to: 'road' },
    { boundary: 9, at: 0.5, from: 'road', to: 'floor' },
  ];
  for (const { boundary, at, from, to } of replacements) {
    const before = evaluateTransition(boundary, at - 1e-7);
    const after = evaluateTransition(boundary, at + 1e-7);
    assert.equal(before.support, from);
    assert.equal(after.support, to);
    for (const p of [at - 1e-7, at, at + 1e-7]) {
      approximately(evaluateTransition(boundary, p).occlusion, 1, `${transitions[boundary].id}: support replacement must be fully hidden`);
    }
  }
});

test('Ground-to-spreader transfer is continuous contact, and no lift begins while a gap remains', () => {
  let previousLift = 0;
  for (let step = 0; step <= 1000; step++) {
    const progress = step / 1000;
    const frame = evaluateTransition(6, progress);
    const pose = getContainerPose(frame.container);
    assertFiniteTree(pose);
    assert.ok(pose.gap >= 0 && pose.lift >= 0 && pose.lift <= 1.55);
    approximately(pose.spreaderY, CONTAINER_DIMENSIONS.height + pose.base + pose.gap, 'Spreader position follows the actual container top');
    if (!pose.contact) {
      assert.equal(pose.lift, 0);
      assert.equal(pose.base, 0);
      assert.equal(frame.support, 'floor');
      assert.ok(pose.gap > 0);
    } else {
      assert.equal(frame.support, 'spreader');
      approximately(pose.gap, 0, 'Attached lifting hardware cannot drift away from the corners');
    }
    if (pose.lift > 0) assert.equal(pose.contact, true);
    assert.ok(pose.lift >= previousLift, 'Forward lift progression cannot suddenly drop the load');
    previousLift = pose.lift;
  }
  const contactFrame = evaluateTransition(6, 0.45);
  assert.deepEqual(getContainerPose(contactFrame.container), {
    base: 0, lift: 0, gap: 0, contact: true, spreaderY: CONTAINER_DIMENSIONS.height,
  });
});

test('Carrier/deck travel retains closed doors and packed cargo throughout its visible states', () => {
  for (let boundary = 2; boundary < transitions.length; boundary++) {
    for (let step = 0; step <= 500; step++) {
      const frame = evaluateTransition(boundary, step / 500);
      if (['road', 'rail', 'deck'].includes(frame.support)) {
        assert.equal(frame.container.doorsOpen, 0, `${transitions[boundary].id}: no transit door opening`);
        assert.equal(frame.container.packed, true);
      }
      if (boundary < 9) assert.equal(frame.container.doorsOpen, 0, 'The sealed journey must not accidentally reopen the box');
    }
  }
});

test('Interior, closure and arrival have physically ordered, reversible door states', () => {
  for (const index of [0, 1, 9]) {
    const values = Array.from({ length: 101 }, (_, step) => evaluateTransition(index, step / 100).container.doorsOpen);
    assert.equal(values[0], index === 1 ? 1 : 0);
    assert.equal(values.at(-1), index === 1 ? 0 : 1);
    for (let step = 1; step < values.length; step++) {
      assert.ok(index === 1 ? values[step] <= values[step - 1] : values[step] >= values[step - 1]);
    }
  }
  assert.equal(evaluateTransition(0, 1).container.packed, false, 'The first interior establishes empty capacity');
  assert.equal(evaluateTransition(1, 0).container.packed, true, 'Closure retains the authored departure cargo');
  assert.equal(evaluateTransition(9, 1).container.packed, true, 'Arrival retains the original cargo');
});

test('Reduced motion preserves each meaningful transition result and support state', () => {
  for (let index = 0; index < transitions.length; index++) {
    for (const progress of [...STOPS, 0.4499, 0.4501, 0.6199, 0.6201, 0.7799, 0.7801]) {
      const full = evaluateTransition(index, progress, false);
      const reduced = evaluateTransition(index, progress, true);
      assert.equal(reduced.container.reduced, true);
      assert.deepEqual({ ...reduced, container: { ...reduced.container, reduced: false } }, full);
      assert.equal(describeContainerState(reduced.container), describeContainerState(full.container));
    }
  }
});

test('Story snapshots reconstruct chapter jumps, transition midpoints and end-to-top returns', async t => {
  for (const viewport of [{ width: 320, height: 700 }, { width: 390, height: 844 }, { width: 1440, height: 900 }, { width: 3840, height: 2160 }]) {
    await t.test(`${viewport.width}x${viewport.height}`, () => {
      const segments = makeSegments(viewport.height);
      const input = { viewport, segments, reduced: false };
      const at = scrollY => evaluateStory({ ...input, scrollY });
      const beginning = at(0);
      assert.equal(beginning.activeId, 'ch-01');
      assert.equal(beginning.chapterIndex, 0);
      for (const index of [1, 6, 8, 10, 0, 4, 2, 9, 3, 5, 7]) {
        const target = segments.find(segment => segment.kind === 'chapter' && segment.index === index);
        const snapshot = at(target.top);
        assertFiniteTree(snapshot);
        assert.equal(snapshot.activeId, chapters[index].id);
        assert.equal(snapshot.chapterIndex, index);
        assert.equal(snapshot.frame, null);
      }
      for (const segment of segments.filter(segment => segment.kind === 'transition')) {
        const midpointY = segment.top + (segment.height - viewport.height) / 2;
        const direct = at(midpointY);
        assert.equal(direct.transitionIndex, segment.index);
        approximately(direct.transitionProgress, 0.5, 'Direct midpoint progress');
        assert.equal(direct.chapterIndex, segment.index + 1);
        at(0);
        at(segments.at(-1).top);
        assert.deepEqual(at(midpointY), direct, 'Midpoint restoration cannot depend on prior navigation');
      }
      const last = segments.at(-1);
      assert.equal(at(last.top + last.height - viewport.height).overall, 1);
      assert.deepEqual(at(0), beginning);
      const steps = Array.from({ length: 121 }, (_, step) => step / 120 * (last.top + last.height - viewport.height));
      const forward = steps.map(at);
      steps.toReversed().forEach((y, index) => assert.deepEqual(at(y), forward[steps.length - 1 - index]));
    });
  }
});

test('Progress boundaries and missing metrics fail safely rather than emitting invalid geometry', () => {
  for (const input of [-100, 0, 0.5, 1, 100, NaN, Infinity, -Infinity]) {
    assert.ok(Number.isFinite(clamp(input)));
    assert.ok(Number.isFinite(smooth(input)));
    for (let boundary = 0; boundary < transitions.length; boundary++) assertFiniteTree(evaluateTransition(boundary, input));
  }
  assert.throws(() => evaluateTransition(-1, 0.5), RangeError);
  assert.throws(() => evaluateTransition(10, 0.5), RangeError);
  const empty = evaluateStory({ scrollY: 0, viewport: { width: 0, height: 0 }, segments: [], reduced: true });
  assertFiniteTree(empty);
  assert.equal(empty.activeId, 'ch-01');
  assert.equal(empty.frame, null);
});

test('Every chapter model and every transition checkpoint emits structured, finite, accessible SVG', () => {
  let inspected = 0;
  for (const mode of MODES) {
    for (const packed of [false, true]) {
      for (const doorsOpen of [0, 0.5, 1]) {
        for (const progress of [0, 0.4499, 0.45, 0.4501, 0.75, 1]) {
          const state = { mode, packed, doorsOpen, progress, highlight: HIGHLIGHTS[inspected % HIGHLIGHTS.length] };
          const svg = renderContainerFallback(state);
          inspectSvg(svg);
          assert.match(svg, new RegExp(`data-mode="${mode}"`, 'u'));
          assert.match(svg, /data-container-id="BOX-001"/u);
          assert.equal(svg, renderContainerFallback(state), 'Returning to a model state recreates the same geometry');
          inspected++;
        }
      }
    }
  }
  for (let index = 0; index < transitions.length; index++) {
    for (const progress of STOPS) inspectSvg(renderContainerFallback(evaluateTransition(index, progress).container));
  }
  assert.equal(inspected, 252, 'All mode, cargo, door and lift-state combinations were exercised');
});

test('Departure and destination render the exact same six packing blocks, with no added or missing cargo', () => {
  const expectedBlocks = [
    { id: 'BOX-001-CARGO-01', center: [-2.12, 0.69, -0.56], size: [1.13, 0.96, 0.91], units: 'm' },
    { id: 'BOX-001-CARGO-02', center: [-0.80, 0.69, -0.56], size: [1.13, 0.96, 0.91], units: 'm' },
    { id: 'BOX-001-CARGO-03', center: [0.52, 0.69, -0.56], size: [1.13, 0.96, 0.91], units: 'm' },
    { id: 'BOX-001-CARGO-04', center: [-2.12, 0.69, 0.55], size: [1.13, 0.96, 0.91], units: 'm' },
    { id: 'BOX-001-CARGO-05', center: [-0.80, 0.69, 0.55], size: [1.13, 0.96, 0.91], units: 'm' },
    { id: 'BOX-001-CARGO-06', center: [0.52, 0.69, 0.55], size: [1.13, 0.96, 0.91], units: 'm' },
  ];
  const cargoFor = mode => {
    const packed = renderContainerFallback({ mode, packed: true, doorsOpen: 1 });
    const empty = renderContainerFallback({ mode, packed: false, doorsOpen: 1 });
    const groups = [...packed.matchAll(/<g\b([^>]*\bdata-cargo-id="[^"]+"[^>]*)>([\s\S]*?)<\/g>/gu)];
    assert.equal(groups.length, 6, `${mode}: every packing block has its own rendered group`);
    const renderedShapes = [];
    const blocks = groups.map(([, attributes, content]) => {
      const data = Object.fromEntries([...attributes.matchAll(/([\w-]+)="([^"]*)"/gu)].map(([, name, value]) => [name, value]));
      const shapes = content.match(/<(?:polygon|line)\b[^>]*\/>/gu) ?? [];
      assert.equal(shapes.filter(shape => shape.startsWith('<polygon')).length, 3, `${mode}: ${data['data-cargo-id']} has three rendered faces`);
      assert.equal(shapes.filter(shape => shape.startsWith('<line')).length, 2, `${mode}: ${data['data-cargo-id']} retains both timber bands`);
      renderedShapes.push(...shapes);
      return {
        id: data['data-cargo-id'],
        center: data['data-cargo-center'].split(',').map(Number),
        size: data['data-cargo-size'].split(',').map(Number),
        units: data['data-cargo-units'],
      };
    });
    assert.equal(new Set(blocks.map(block => block.id)).size, 6, `${mode}: all six cargo identities are unique`);
    assert.deepEqual(blocks, expectedBlocks, `${mode}: exact world identities, centers and sizes retain the authored arrangement`);
    assert.equal(renderedShapes.filter(shape => shape.startsWith('<polygon')).length, 18, 'Six solid blocks each contribute their three visible faces');
    assert.equal(renderedShapes.filter(shape => shape.startsWith('<line')).length, 12, 'The same two timber-band details remain on each block');
    assert.deepEqual(shapeDelta(packed, empty), renderedShapes.sort(), `${mode}: packing adds only the six identified blocks and their markings`);
    assert.doesNotMatch(empty, /data-cargo-id=/u, `${mode}: the empty view contains no rendered cargo groups`);
    assert.match(packed, /Six illustrative timber packing blocks are present\./u);
    assert.match(empty, /The interior is empty\./u);
    assert.doesNotMatch(empty, /Six illustrative timber packing blocks are present\./u);
    return blocks;
  };
  assert.deepEqual(cargoFor('destination'), cargoFor('interior'), 'Changing the camera preserves every rendered cargo identity and world-space dimension');
});
