import test from 'node:test';
import assert from 'node:assert/strict';
import { appendExperiment, createExperiment, expectedCounts, prefixExperiment } from '../src/engine.ts';
import { dotLayout, histogramSVG, paintPortrait, traySVG } from '../src/charts.ts';

const box = { x: 100, y: 190, width: 800, height: 420 };
const full = createExperiment('portrait-middle', 8, 0.5, 256);
const scale = Math.max(...full.counts, ...expectedCounts(8, 0.5, 256));

test('portrait contains every real sample exactly once and preserves its endpoint', () => {
  const dots = dotLayout(full, box, scale);
  assert.equal(dots.length, 256);
  assert.equal(new Set(dots.map(dot => dot.id)).size, 256);
  for (const dot of dots) {
    assert.equal(dot.id, full.paths[dot.index].id);
    assert.equal(dot.k, full.paths[dot.index].k);
  }
});

test('all saved prefix samples keep exact coordinates across 16, 64, 128 and 256', () => {
  const all = dotLayout(full, box, scale);
  for (const N of [16, 64, 128, 256]) {
    assert.deepEqual(dotLayout(prefixExperiment(full, N), box, scale), all.slice(0, N));
  }
});

test('different comparison rounds use one shared radius and baseline scale', () => {
  const rounds = ['evening-a', 'evening-b', 'evening-c'].map(seed => createExperiment(seed, 8, 0.5, 128));
  const maxCount = Math.max(...rounds.flatMap(round => round.counts), ...expectedCounts(8, 0.5, 128));
  const layouts = rounds.map(round => dotLayout(round, box, maxCount));
  assert.equal(new Set(layouts.flat().map(dot => dot.r)).size, 1);
  const firstInSlot = layouts.map(dots => dots.find(dot => dot.k === 4));
  assert.ok(firstInSlot.every(dot => dot && dot.y === firstInSlot[0]!.y && dot.x === firstInSlot[0]!.x));
});

test('all circles remain finite, in bounds and non-overlapping at narrow and large sizes', () => {
  for (const n of [4, 8, 12]) for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    const round = createExperiment('geometry', n, p, 256);
    for (const dimensions of [{ x: 20, y: 40, width: 260, height: 180 }, { x: 100, y: 200, width: 2800, height: 1300 }]) {
      const dots = dotLayout(round, dimensions);
      for (const dot of dots) {
        assert.ok([dot.x, dot.y, dot.r].every(Number.isFinite));
        assert.ok(dot.r > 0);
        assert.ok(dot.x - dot.r >= dimensions.x - 1e-9);
        assert.ok(dot.x + dot.r <= dimensions.x + dimensions.width + 1e-9);
        assert.ok(dot.y - dot.r >= dimensions.y - 1e-9);
        assert.ok(dot.y + dot.r <= dimensions.y + dimensions.height + 1e-9);
      }
      for (let i = 0; i < dots.length; i++) for (let j = i + 1; j < dots.length; j++) {
        const a = dots[i], b = dots[j];
        assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= a.r + b.r - 1e-8);
      }
    }
  }
});

test('exactly three slots are used per row and a fourth ball starts the next row', () => {
  const round = createExperiment('all-left', 4, 0, 7);
  const dots = dotLayout(round, box, 9);
  assert.equal(new Set(dots.slice(0, 3).map(dot => dot.x)).size, 3);
  assert.equal(new Set(dots.slice(0, 3).map(dot => dot.y)).size, 1);
  assert.equal(dots[0].x, dots[3].x);
  assert.ok(dots[3].y < dots[0].y);
});

test('SVG-to-Canvas ownership omits only sphere pixels, never data or tray counts', () => {
  const withDots = traySVG(full, { ...box, maxCount: scale, label: 'Middle evening' });
  const withoutDots = traySVG(full, { ...box, maxCount: scale, label: 'Middle evening', omitDots: true });
  assert.equal((withDots.match(/data-sample-id=/g) || []).length, 256);
  assert.equal((withoutDots.match(/data-sample-id=/g) || []).length, 0);
  assert.equal((withoutDots.match(/data-tray-slot=/g) || []).length, 9);
  assert.ok(withoutDots.includes('data-N="256"'));
  full.counts.forEach((count, k) => assert.ok(withoutDots.includes(`data-tray-slot="${k}" data-observed="${count}"`)));
});

test('tray and workbench keep actual and expected quantities in number-of-balls units', () => {
  const round = appendExperiment(createExperiment('live-chart', 12, 0.75, 256));
  const expected = expectedCounts(12, 0.75, 257);
  const tray = traySVG(round, { ...box });
  const chart = histogramSVG(round, { ...box });
  for (const svg of [tray, chart]) {
    assert.ok(svg.includes('data-N="257"'));
    assert.ok(svg.includes('data-units="number of balls"'));
    assert.ok(svg.includes('Number of balls'));
    assert.ok(!svg.includes('NaN'));
    assert.ok(!svg.includes('Infinity'));
  }
  expected.forEach((value, k) => {
    assert.ok(tray.includes(`data-expected-slot="${k}" data-expected="${value}"`));
    assert.ok(chart.includes(`data-histogram-slot="${k}" data-observed="${round.counts[k]}" data-expected="${value}"`));
  });
});

test('histograms render observed bars by default exactly as with omitBars=false', () => {
  const normal = histogramSVG(full, { ...box, label: 'Your round' });
  const explicit = histogramSVG(full, { ...box, label: 'Your round', omitBars: false });
  assert.equal(normal, explicit);
  assert.equal((normal.match(/<rect /g) || []).length, 2 * (full.n + 1));
  const slots = [...normal.matchAll(/<g data-histogram-slot="(\d+)"[^>]*>([\s\S]*?)<\/g>/g)];
  assert.equal(slots.length, full.n + 1);
  for (const [, k, body] of slots) {
    const texts = [...body.matchAll(/<text[^>]*>(.*?)<\/text>/g)].map(match => match[1]);
    assert.deepEqual(texts, [String(full.counts[Number(k)]), k]);
  }
});

test('omitBars transfers all observed pixels and count labels while preserving theory and axes', () => {
  for (const n of [4, 8, 12]) {
    const round = appendExperiment(createExperiment('handoff-bars', n, 0.75, 256));
    const before = JSON.stringify(round);
    const normal = histogramSVG(round, { ...box, label: 'Your round' });
    const omitted = histogramSVG(round, { ...box, label: 'Your round', omitBars: true });
    assert.equal((omitted.match(/<rect /g) || []).length, 0);
    const slots = [...omitted.matchAll(/<g data-histogram-slot="(\d+)"[^>]*>([\s\S]*?)<\/g>/g)];
    assert.equal(slots.length, n + 1);
    for (const [, k, body] of slots) {
      const texts = [...body.matchAll(/<text[^>]*>(.*?)<\/text>/g)].map(match => match[1]);
      assert.deepEqual(texts, [k], 'Only the endpoint label remains; the observed count belongs to the transition layer.');
    }
    assert.equal(omitted.match(/<polyline[^>]*\/>/)?.[0], normal.match(/<polyline[^>]*\/>/)?.[0]);
    assert.deepEqual(omitted.match(/<circle[^>]*\/>/g), normal.match(/<circle[^>]*\/>/g));
    assert.deepEqual(omitted.match(/<line[^>]*\/>/g), normal.match(/<line[^>]*\/>/g));
    assert.equal(omitted.match(/data-scale-max="([^"]+)"/)?.[1], normal.match(/data-scale-max="([^"]+)"/)?.[1]);
    assert.ok(omitted.includes('data-N="257"'));
    assert.ok(omitted.includes('>Your round</text>'));
    assert.ok(omitted.includes('>Number of balls</text>'));
    assert.ok(omitted.includes('>257 observed · expected — dashed</text>'));
    assert.ok(!omitted.includes('Solid bars: observed counts.'));
    assert.equal(JSON.stringify(round), before);
  }
});

test('chart labels escape markup and empty experiments remain valid', () => {
  const empty = createExperiment('empty-chart', 4, 0.5, 0);
  assert.deepEqual(dotLayout(empty, box), []);
  for (const svg of [traySVG(empty, { ...box, label: '<script>bad</script>' }), histogramSVG(empty, { ...box, label: '<script>bad</script>' })]) {
    assert.ok(!svg.includes('<script>'));
    assert.ok(svg.includes('&lt;script&gt;'));
    assert.ok(!svg.includes('NaN'));
  }
});

test('invalid geometry and inadequate shared scales are rejected instead of silently rescaling', () => {
  assert.throws(() => dotLayout(full, { ...box, width: 0 }));
  assert.throws(() => dotLayout(full, { ...box, height: -1 }));
  assert.throws(() => dotLayout(full, { ...box, x: NaN }));
  assert.throws(() => dotLayout(full, box, 1));
  assert.throws(() => dotLayout(full, box, Infinity));
});

test('Canvas renderer consumes the identical geometry without sampling or changing its input', () => {
  const arcs: number[][] = [];
  const context = {
    setTransform() {}, clearRect() {}, save() {}, restore() {}, beginPath() {},
    ellipse() {}, fill() {}, stroke() {},
    arc(...values: number[]) { arcs.push(values); },
    createRadialGradient() { return { addColorStop() {} }; },
  };
  const canvas = { width: 0, height: 0, style: {}, getContext: () => context };
  const before = JSON.stringify(full);
  const result = paintPortrait(canvas as unknown as HTMLCanvasElement, full, { box, maxCount: scale, dpr: 2 });
  assert.deepEqual(result, dotLayout(full, box, scale));
  assert.equal(canvas.width, 2000);
  assert.equal(canvas.height, 1800);
  assert.equal(arcs.length, 256);
  arcs.forEach(([x, y, r], i) => assert.deepEqual([x, y, r], [result[i].x, result[i].y, result[i].r]));
  assert.equal(JSON.stringify(full), before);
});
