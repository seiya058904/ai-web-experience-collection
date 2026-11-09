import test from 'node:test';
import assert from 'node:assert/strict';
import { HOLLOW_PATH, geometryMetrics, imprintMarkup, imprintSVG } from '../experiences/sillage/src/artwork.ts';
import { DEFAULT_SHARES, PHASES, redistribute } from '../experiences/sillage/src/state.ts';
import type { ComponentIndex, Shares } from '../experiences/sillage/src/state.ts';

test('same parameters reproduce exactly the same contour and SVG', () => {
  const first = imprintSVG(DEFAULT_SHARES, { id: 'same', textureHref: './art/material-atlas.webp' });
  assert.equal(first, imprintSVG(DEFAULT_SHARES, { id: 'same', textureHref: './art/material-atlas.webp' }));
  assert.deepEqual(geometryMetrics(DEFAULT_SHARES), geometryMetrics(DEFAULT_SHARES));
  assert.ok(first.includes('viewBox="0 0 1000 780"'));
  assert.equal(first.includes('feTurbulence'), false);
  assert.equal(first.includes('<circle'), false);
  assert.equal(first.includes('data-sillage-imprint>'), false);
  assert.equal(first.includes('data-imprint-root transform'), false);
});

test('each share changes real contour area, crease rhythm and relief depth', () => {
  for (const index of [0, 1, 2] as ComponentIndex[]) {
    const less = geometryMetrics(redistribute(DEFAULT_SHARES, index, 10)).components[index];
    const more = geometryMetrics(redistribute(DEFAULT_SHARES, index, 70)).components[index];
    assert.ok(more.area > less.area, `${more.name}: area must increase`);
    assert.ok(more.depth > less.depth, `${more.name}: relief must increase`);
    assert.ok(more.edgeRhythm > less.edgeRhythm, `${more.name}: crease must change`);
    assert.notEqual(more.path, less.path);
  }
});

test('all extreme compositions omit every absent component and preserve the neutral hollow', () => {
  const names = ['brightness', 'spice', 'warmth'];
  for (const index of [0, 1, 2] as ComponentIndex[]) {
    const shares: Shares = [0, 0, 0];
    shares[index] = 100;
    const svg = imprintSVG(shares);
    const metrics = geometryMetrics(shares);
    names.forEach((name, component) => {
      assert.equal(svg.includes(`data-component="${name}"`), component === index);
      assert.equal(svg.includes(`data-edge="${name}"`), component === index);
      assert.equal(metrics.components[component].present, component === index);
      assert.equal(metrics.components[component].area > 0, component === index);
    });
    assert.equal(metrics.hollowPath, HOLLOW_PATH);
    assert.ok(svg.includes(`data-neutral-hollow="${metrics.hollowId}"`));
    if (index !== 0) assert.equal(svg.includes('#E7B353'), false);
  }
});

test('temporary subtraction removes exactly one component without changing the others', () => {
  const complete = geometryMetrics(DEFAULT_SHARES);
  for (const missing of [0, 1, 2] as ComponentIndex[]) {
    const reduced = geometryMetrics(DEFAULT_SHARES, { missing });
    reduced.components.forEach((component, index) => {
      if (index === missing) {
        assert.equal(component.area, 0);
        assert.equal(component.path, '');
      } else {
        assert.equal(component.path, complete.components[index].path);
        assert.equal(component.area, complete.components[index].area);
      }
    });
  }
});

test('a single percent remains visible in all phases and zero remains absent', () => {
  for (const phase of PHASES) {
    const metrics = geometryMetrics([1, 0, 99], { phase: phase.id });
    assert.ok(metrics.components[0].area > 0);
    assert.equal(metrics.components[1].area, 0);
    assert.ok(metrics.components[2].area > 0);
    assert.equal(metrics.hollowPath, HOLLOW_PATH);
  }
});

test('every whole-percent setting has finite, positive geometry for present components', () => {
  for (const index of [0, 1, 2] as ComponentIndex[]) {
    for (let value = 0; value <= 100; value++) {
      const metrics = geometryMetrics(redistribute(DEFAULT_SHARES, index, value));
      for (const component of metrics.components) {
        assert.ok(Number.isFinite(component.area));
        assert.ok(Number.isFinite(component.depth));
        assert.equal(component.area > 0, component.share > 0);
        assert.equal(component.path.includes('NaN'), false);
        assert.equal(component.path.includes('Infinity'), false);
      }
    }
  }
});

test('separation is reversible and never changes a component contour', () => {
  const together = imprintMarkup(DEFAULT_SHARES, { id: 'chord', separation: 0 });
  const apart = imprintMarkup(DEFAULT_SHARES, { id: 'chord', separation: 1 });
  assert.deepEqual(together.metrics, apart.metrics);
  assert.notEqual(together.body, apart.body);
  assert.equal(together.body, imprintMarkup(DEFAULT_SHARES, { id: 'chord', separation: 0 }).body);
});

test('texture rows remain isolated and export markup escapes all external strings', () => {
  const svg = imprintSVG(DEFAULT_SHARES, { id: '"unsafe<id>', textureHref: './atlas.png?x="&y=<', label: '<&> "my work"' });
  assert.equal((svg.match(/<pattern /g) ?? []).length, 3);
  assert.ok(svg.includes('viewBox="0 0 1000 333.333"'));
  assert.ok(svg.includes('viewBox="0 333.333 1000 333.333"'));
  assert.ok(svg.includes('viewBox="0 666.667 1000 333.333"'));
  assert.ok(svg.includes('&lt;&amp;&gt; &quot;my work&quot;'));
  assert.ok(svg.includes('./atlas.png?x=&quot;&amp;y=&lt;'));
  assert.equal(svg.includes('id=""unsafe'), false);
});

test('flat fallback remains the same artwork and needs no external texture or filter', () => {
  const rich = imprintMarkup(DEFAULT_SHARES, { mode: 'detail', textureHref: './atlas.webp' });
  const fallback = imprintMarkup(DEFAULT_SHARES, { mode: 'flat', textureHref: './atlas.webp' });
  assert.deepEqual(rich.metrics, fallback.metrics);
  assert.equal(fallback.defs.includes('<filter'), false);
  assert.equal(fallback.defs.includes('<image'), false);
  assert.ok(fallback.body.includes('data-component="brightness"'));
});
