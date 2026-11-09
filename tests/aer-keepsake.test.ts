import test from 'node:test';
import assert from 'node:assert/strict';
import { createKeepsakeSVG, createRouteDiagramSVG, keepsakeFilename } from '../experiences/aer/src/keepsake.ts';
import { DECISION_PROGRESS, WIND_LAYERS, getBranchRoute, getLanding, getRoute } from '../experiences/aer/src/journey.ts';
import type { WindLayer } from '../experiences/aer/src/journey.ts';

const layers: WindLayer[] = ['low', 'middle', 'high'];

function attr(tag: string, name: string): string {
  const match = new RegExp(`\\b${name}="([^"]*)"`).exec(tag);
  assert.ok(match, `Missing ${name} in ${tag}`);
  return match[1]!;
}

function routeTag(svg: string, role: string, layer?: WindLayer): string {
  const result = [...svg.matchAll(/<polyline\b[^>]*\/>/g)].map((match) => match[0])
    .find((tag) => tag.includes(`data-route-role="${role}"`) && (!layer || tag.includes(`data-route-layer="${layer}"`)));
  assert.ok(result, `Missing ${role} route ${layer ?? ''}`);
  return result;
}

function routePoints(tag: string): { x: number; z: number }[] {
  return attr(tag, 'points').split(' ').map((point) => {
    const [x, z] = point.split(',').map(Number);
    assert.ok(Number.isFinite(x) && Number.isFinite(z));
    return { x: x!, z: z! };
  });
}

function distanceToSegment(point: { x: number; z: number }, start: { x: number; z: number }, end: { x: number; z: number }): number {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const lengthSquared = dx * dx + dz * dz;
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1,
    ((point.x - start.x) * dx + (point.z - start.z) * dz) / lengthSquared,
  ));
  return Math.hypot(point.x - start.x - t * dx, point.z - start.z - t * dz);
}

function assertXMLBalanced(svg: string): void {
  const stack: string[] = [];
  for (const match of svg.matchAll(/<(\/?)([A-Za-z][\w:-]*)\b[^>]*?(\/?)>/g)) {
    const [raw, closing, name, selfClosing] = match;
    if (closing) assert.equal(stack.pop(), name, `Unexpected closing tag ${raw}`);
    else if (!selfClosing) stack.push(name!);
  }
  assert.deepEqual(stack, []);
  assert.match(svg, /^<svg\b/);
  assert.match(svg, /<\/svg>$/);
  // Every entity emitted by the module must be a valid named XML entity.
  assert.equal((svg.match(/&(?!amp;|lt;|gt;|quot;|apos;)/g) ?? []).length, 0);
}

test('each portrait is a deterministic, accessible and self-contained 720×900 keepsake', () => {
  for (const layer of layers) {
    const svg = createKeepsakeSVG(layer);
    assert.equal(svg, createKeepsakeSVG(layer));
    assert.match(svg, /viewBox="0 0 720 900"/);
    assert.match(svg, /role="img"/);
    assert.match(svg, /aria-label="[^"]+"/);
    assert.match(svg, /<title>[^<]+<\/title>/);
    assert.match(svg, /<desc>[^<]+<\/desc>/);
    assert.ok(svg.includes(WIND_LAYERS[layer].destination));
    assert.ok(svg.includes(WIND_LAYERS[layer].label));
    assert.ok(svg.includes('Carried by air'));
    assert.ok(svg.includes('An imagined journey. A real moment of pause.'));
    assert.ok(svg.includes('Fictional landscape · Not a flight record.'));
    assertXMLBalanced(svg);
  }
});

test('balloon artwork consistently encodes sixteen gores, a navy crown and one basket', () => {
  for (const layer of layers) {
    const svg = createKeepsakeSVG(layer);
    assert.match(svg, /data-balloon-gores="16"/);
    const indices = [...svg.matchAll(/data-gore="(\d+)"/g)].map((match) => Number(match[1])).sort((a, b) => a - b);
    assert.deepEqual(indices, Array.from({ length: 16 }, (_, i) => i + 1));
    assert.equal((svg.match(/data-balloon-part="navy-crown"/g) ?? []).length, 1);
    assert.equal((svg.match(/data-balloon-part="basket"/g) ?? []).length, 1);
  }
});

test('the common path and its screen projection never move when the choice changes', () => {
  for (const create of [createKeepsakeSVG, createRouteDiagramSVG]) {
    const portraits = layers.map((layer) => create(layer));
    const shared = portraits.map((svg) => routeTag(svg, 'common'));
    assert.equal(shared[0], shared[1]);
    assert.equal(shared[1], shared[2]);
    assert.deepEqual(routePoints(shared[0]!), [{ x: 0, z: 0 }, { x: 0, z: 60 }]);
    const transforms = portraits.map((svg) =>
      /<g data-coordinate-system="fictional-x-z" transform="([^"]+)"/.exec(svg)![1],
    );
    assert.equal(transforms[0], transforms[1]);
    assert.equal(transforms[1], transforms[2]);
    for (const marker of ['takeoff', 'decision']) {
      const locations = portraits.map((svg) => [...svg.matchAll(/<circle\b[^>]*\/>/g)]
        .map((match) => match[0]).find((tag) => tag.includes(`data-route-mark="${marker}"`)));
      assert.equal(locations[0], locations[1]);
      assert.equal(locations[1], locations[2]);
    }
  }
  assert.equal(getRoute('middle').filter((point) => point.progress === DECISION_PROGRESS).length, 1);
});

test('route drawing follows engine geometry rather than substituting decorative endpoints', () => {
  const selectedPaths: string[] = [];
  for (const layer of layers) {
    for (const svg of [createKeepsakeSVG(layer), createRouteDiagramSVG(layer), createRouteDiagramSVG(layer, { compact: true })]) {
      const drawn = routePoints(routeTag(svg, 'selected', layer));
      const actual = getBranchRoute(layer);
      const endpoint = getLanding(layer);
      assert.deepEqual(drawn[0], { x: 0, z: 60 });
      assert.ok(Math.hypot(drawn.at(-1)!.x - endpoint.x, drawn.at(-1)!.z - endpoint.z) < 0.00008);
      const scaleMatch = /data-coordinate-system="fictional-x-z" transform="[^\"]*scale\(([\d.]+) /.exec(svg);
      assert.ok(scaleMatch);
      const scale = Number(scaleMatch[1]);
      for (const point of actual) {
        let minimum = Infinity;
        for (let i = 1; i < drawn.length; i += 1) minimum = Math.min(minimum, distanceToSegment(point, drawn[i - 1]!, drawn[i]!));
        assert.ok(minimum * scale <= 0.041, `Route deviates by ${minimum * scale} SVG pixels`);
      }
      assert.ok(drawn.length < actual.length / 5, 'Export retains too many redundant integration samples');
    }
    selectedPaths.push(attr(routeTag(createKeepsakeSVG(layer), 'selected', layer), 'points'));
  }
  assert.equal(new Set(selectedPaths).size, 3);
});

test('diagram always contains all three true alternatives and a separate selected route', () => {
  for (const layer of layers) {
    const svg = createRouteDiagramSVG(layer);
    assert.match(svg, /viewBox="0 0 720 420"/);
    assert.match(createRouteDiagramSVG(layer, { compact: true }), /viewBox="0 0 500 300"/);
    for (const route of layers) {
      const role = route === layer ? 'selected' : 'alternative';
      const tag = routeTag(svg, role, route);
      const endpoint = routePoints(tag).at(-1)!;
      const actual = getLanding(route);
      assert.ok(Math.hypot(endpoint.x - actual.x, endpoint.z - actual.z) < 0.00008);
      assert.ok(svg.includes(WIND_LAYERS[route].destination));
    }
    assert.equal((svg.match(/data-route-role="selected"/g) ?? []).length, 1);
    assert.equal((svg.match(/data-route-role="alternative"/g) ?? []).length, 2);
  }
});

test('dotted previews do not commit a different route or mutate export state', () => {
  for (const selected of layers) {
    const originalKeepsake = createKeepsakeSVG(selected);
    const originalDiagram = createRouteDiagramSVG(selected);
    for (const preview of layers) {
      const svg = createRouteDiagramSVG(selected, { preview });
      assert.match(svg, new RegExp(`data-selected-layer="${selected}"`));
      assert.equal(routeTag(svg, 'selected', selected), routeTag(originalDiagram, 'selected', selected));
      if (preview !== selected) {
        assert.match(routeTag(svg, 'preview', preview), /stroke-dasharray="3 7"/);
        assert.ok(svg.includes(`Your choice stays ${WIND_LAYERS[selected].label.toLowerCase()}`));
        assert.match(svg, new RegExp(`data-preview-layer="${preview}"`));
      } else {
        assert.equal((svg.match(/data-route-role="preview"/g) ?? []).length, 0);
      }
      assert.equal(createKeepsakeSVG(selected), originalKeepsake);
      assert.equal(createRouteDiagramSVG(selected), originalDiagram);
      assertXMLBalanced(svg);
    }
  }
});

test('SVGs contain only English authored text and no network or active-content dependencies', () => {
  const samples = layers.flatMap((layer) => [createKeepsakeSVG(layer), createRouteDiagramSVG(layer, { preview: 'high' })]);
  for (const svg of samples) {
    assert.doesNotMatch(svg, /[\u3400-\u9fff\u3040-\u30ff]/u);
    assert.doesNotMatch(svg, /<(script|image|foreignObject|iframe|use|animate|set)\b/i);
    assert.doesNotMatch(svg, /\b(?:href|src|on\w+)\s*=/i);
    assert.doesNotMatch(svg, /url\s*\(|@font-face|javascript:/i);
    assert.doesNotMatch(svg, /\bid="/); // No duplicate document-global IDs on repeated inline diagrams.
    assert.match(svg, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.ok(svg.length < 22000, 'Vector output unexpectedly large');
  }
});

test('filenames are stable, portable and bound to the selected destination', () => {
  assert.equal(keepsakeFilename('low', 'svg'), 'aer-low-hedgerow-meadow.svg');
  assert.equal(keepsakeFilename('middle', 'png'), 'aer-middle-willow-bend.png');
  assert.equal(keepsakeFilename('high', 'svg'), 'aer-high-far-meadow.svg');
  for (const layer of layers) {
    for (const extension of ['svg', 'png'] as const) {
      assert.match(keepsakeFilename(layer, extension), /^[a-z0-9-]+\.(svg|png)$/);
    }
  }
});
