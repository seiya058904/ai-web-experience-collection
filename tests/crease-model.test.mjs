import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MIURA_DEFAULT, SHEET, clipToSheet, cornerPoint, creasePatternSVG, filmAt, lineCreases, lineFold, miuraCell, miuraCreases, miuraFold,
  miuraMetrics, vertexAngles, vertexCreases, vertexFold, vertexFolds, vertexInfo, vertexLimit,
} from '../experiences/crease/src/model.js';

const close = (a, b, tolerance = 1e-6) => assert.ok(Math.abs(a - b) <= tolerance, `${a} is not within ${tolerance} of ${b}`);
const dist3 = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
const dist2 = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);

// A rigid facet keeps every distance between its points, and stays one plane.
function assertRigid(result, label) {
  for (const facet of result.facets) {
    const { flat, points } = facet;
    assert.equal(flat.length, points.length);
    for (let i = 0; i < flat.length; i += 1) {
      for (let j = i + 1; j < flat.length; j += 1) close(dist3(points[i], points[j]), dist2(flat[i], flat[j]), 1e-7);
    }
    if (points.length > 3) {
      const [a, b, c] = points;
      const n = [
        (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]),
        (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]),
        (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]),
      ];
      const size = Math.hypot(...n) || 1;
      for (const p of points) close(((p[0] - a[0]) * n[0] + (p[1] - a[1]) * n[1] + (p[2] - a[2]) * n[2]) / size, 0, 1e-7);
    }
  }
  assert.ok(result.facets.length > 0, label);
}

// Two facets that share a flat edge must still share it when folded: the paper does not tear.
function assertConnected(result) {
  const key = (p) => `${p[0].toFixed(6)},${p[1].toFixed(6)}`;
  const seen = new Map();
  let shared = 0;
  for (const facet of result.facets) {
    facet.flat.forEach((p, i) => {
      const k = key(p);
      if (seen.has(k)) {
        close(dist3(seen.get(k), facet.points[i]), 0, 1e-7);
        shared += 1;
      } else seen.set(k, facet.points[i]);
    });
  }
  assert.ok(shared > 0);
}
const area = (polygon) => Math.abs(polygon.reduce((sum, p, i) => {
  const q = polygon[(i + 1) % polygon.length];
  return sum + p[0] * q[1] - q[0] * p[1];
}, 0)) / 2;

test('every fold keeps the facets rigid and the sheet in one piece', () => {
  for (const t of [0, 0.2, 0.5, 0.8, 1]) {
    assertRigid(lineFold(t), 'line');
    assertConnected(lineFold(t));
    assertRigid(vertexFold(t), 'vertex');
    assertConnected(vertexFold(t));
    assertRigid(vertexFold(t, 14), 'bent vertex');
    assertConnected(vertexFold(t, 14));
    assertRigid(miuraFold(t), 'miura');
    assertConnected(miuraFold(t));
  }
});

test('every pattern covers exactly one rectangular sheet', () => {
  const full = SHEET.width * SHEET.height;
  for (const result of [lineFold(0), vertexFold(0), vertexFold(0, -18), miuraFold(0), miuraFold(0, { gamma: 55, columns: 7, rows: 5 }), miuraFold(0, { gamma: 82, columns: 14, rows: 11 })]) {
    close(result.facets.reduce((sum, facet) => sum + area(facet.flat), 0), full, 1e-9);
    close(result.bounds.width, SHEET.width, 1e-9);
    close(result.bounds.length, SHEET.height, 1e-9);
  }
});

test('flat at zero, and stage changes cannot be seen', () => {
  for (const result of [lineFold(0), vertexFold(0), miuraFold(0)]) {
    for (const facet of result.facets) for (const p of facet.points) close(p[2], 0, 1e-9);
  }
  // Each stage's own fold value is zero wherever the film hands over to the next stage.
  close(filmAt(0.2).lineFold, 0);
  close(filmAt(0.46).vertexFold, 0);
  close(filmAt(0.83).miuraExit, 0);
  close(filmAt(0.83).yoursEnter, 0);
  close(filmAt(0.2).reveal, 0);
});

test('Kawasaki: the vertex folds flat only when alternating angles add to 180 degrees', () => {
  const good = vertexInfo(0);
  close(good.a, 180);
  close(good.b, 180);
  assert.ok(good.flat);
  assert.ok(good.open < 4, `A flat-foldable vertex closes completely, ${good.open} degrees left`);
  for (const shift of [-20, -8, 8, 20]) {
    const bent = vertexInfo(shift);
    assert.ok(!bent.flat);
    assert.ok(bent.open > 10, `shift ${shift} should stay open, ${bent.open} degrees left`);
    assert.ok(bent.drive > 20, `shift ${shift} should still fold, reached ${bent.drive}`);
    close(bent.angles.reduce((sum, x) => sum + x, 0), 360);
  }
  assert.ok(vertexLimit(vertexAngles(20)).open > vertexLimit(vertexAngles(6)).open, 'A larger violation leaves more open');
});

test('Maekawa: a flat-foldable vertex has one more pair of one crease type', () => {
  const info = vertexInfo(0);
  assert.equal(Math.abs(info.mountains - info.valleys), 2);
  const creases = vertexCreases(0);
  const valleys = creases.filter((c) => c.type === 'V').length;
  assert.equal(creases.length, 4);
  assert.equal(Math.abs(4 - 2 * valleys), 2);
});

test('the Miura cell matches the closed form and collapses in both directions', () => {
  const a = 0.3;
  const b = 0.4;
  const flat = miuraCell(70, a, b, 0);
  close(flat.H, 0);
  close(flat.L, a);
  close(flat.S, b * Math.sin(70 * Math.PI / 180));
  close(flat.V, b * Math.cos(70 * Math.PI / 180));
  for (const theta of [0.3, 0.8, 1.2]) {
    const c = miuraCell(70, a, b, theta);
    close(c.S * c.S + c.V * c.V, b * b, 1e-9);
    close(c.L * c.L + c.H * c.H, a * a, 1e-9);
    close(c.V * c.L, a * b * Math.cos(70 * Math.PI / 180), 1e-9);
  }
  let last = miuraMetrics(0);
  close(last.width, 1, 1e-9);
  close(last.length, 1, 1e-9);
  for (const t of [0.25, 0.5, 0.75, 1]) {
    const m = miuraMetrics(t);
    assert.ok(m.width < last.width, 'Narrower as it folds');
    assert.ok(m.area < last.area, 'A smaller footprint as it folds');
    last = m;
  }
  assert.ok(last.area < 0.3, `Full fold footprint ${last.area}`);
});

test('every interior Miura vertex is flat-foldable', () => {
  const creases = miuraCreases(MIURA_DEFAULT);
  const key = (p) => `${p[0].toFixed(6)},${p[1].toFixed(6)}`;
  const at = new Map();
  for (const crease of creases) {
    for (const [p, q] of [[crease.a, crease.b], [crease.b, crease.a]]) {
      if (!at.has(key(p))) at.set(key(p), { point: p, rays: [] });
      at.get(key(p)).rays.push({ angle: Math.atan2(q[1] - p[1], q[0] - p[0]), type: crease.type });
    }
  }
  let checked = 0;
  const x = SHEET.width / 2 - 1e-6;
  const y = SHEET.height / 2 - 1e-6;
  for (const { point, rays } of at.values()) {
    if (Math.abs(point[0]) >= x || Math.abs(point[1]) >= y || rays.length !== 4) continue;
    rays.sort((p, q) => p.angle - q.angle);
    const sectors = rays.map((ray, i) => {
      const next = rays[(i + 1) % 4].angle + (i === 3 ? 2 * Math.PI : 0);
      return next - ray.angle;
    });
    close(sectors[0] + sectors[2], Math.PI, 1e-6);
    const valleys = rays.filter((ray) => ray.type === 'V').length;
    assert.equal(Math.abs(4 - 2 * valleys), 2, 'Maekawa at every vertex');
    checked += 1;
  }
  assert.ok(checked > 30, `Checked ${checked} interior vertices`);
});

test('the fold-angle signs read from geometry agree with the crease labels', () => {
  const creases = vertexCreases(0);
  assert.ok(creases.every((c) => c.type === 'M' || c.type === 'V'));
  assert.equal(lineCreases().length, 1);
  assert.equal(vertexFolds([[1, 0, 0], [0, 1, 0], [-1, 0, 0], [0, -1, 0]]).length, 4);
});

test('the pulled corner is found at every fold', () => {
  for (const t of [0, 0.5, 0.97]) assert.ok(cornerPoint(miuraFold(t)).every(Number.isFinite));
  close(cornerPoint(miuraFold(0))[2], 0, 1e-9);
});

test('clipping keeps polygons inside the sheet', () => {
  const clipped = clipToSheet([[-9, -9], [9, -9], [9, 9], [-9, 9]]);
  close(area(clipped), SHEET.width * SHEET.height, 1e-9);
  assert.equal(clipToSheet([[5, 5], [6, 5], [6, 6]]).length, 0);
});

test('the printable pattern is complete and well formed', () => {
  const creases = miuraCreases(MIURA_DEFAULT);
  const svg = creasePatternSVG(creases, MIURA_DEFAULT);
  assert.equal((svg.match(/<line /g) ?? []).length, creases.length);
  assert.ok(creases.some((c) => c.type === 'M') && creases.some((c) => c.type === 'V'));
  assert.match(svg, /width="297mm" height="210mm"/);
  assert.match(svg, /10 columns, 8 rows, 68 degrees/);
  assert.equal((svg.match(/<svg/g) ?? []).length, (svg.match(/<\/svg>/g) ?? []).length);
  assert.ok(!/NaN|undefined/.test(svg));
  const note = svg.match(/<text x="([\d.]+)" y="([\d.]+)"/);
  assert.ok(Number(note[2]) < 208, `The note must stay on the page, y=${note[2]}`);
  const top = [...svg.matchAll(/ (?:y1|y2)="([\d.]+)"/g)].map((m) => Number(m[1]));
  assert.ok(Math.max(...top) < Number(note[2]), 'Lines end above the note');
  assert.ok(Math.min(...top) >= 7 - 1e-6, 'Lines stay inside the frame');
});

test('the film is continuous and exactly reversible', () => {
  const keys = ['reveal', 'lineFold', 'vertexFold', 'miuraEnter', 'pullZone', 'miuraExit', 'yoursEnter', 'titleFold', 'elevation', 'azimuth', 'distance', 'shiftX', 'shiftY'];
  for (const aspect of [16 / 9, 390 / 844]) {
    let last = filmAt(0, aspect);
    for (let i = 1; i <= 2000; i += 1) {
      const frame = filmAt(i / 2000, aspect);
      for (const key of keys) {
        const span = key === 'elevation' || key === 'azimuth' ? 0.8 : 0.07;
        assert.ok(Math.abs(frame[key] - last[key]) < span, `${key} jumps at ${i / 2000}`);
      }
      last = frame;
    }
    assert.deepEqual(filmAt(0.613, aspect), filmAt(0.613, aspect));
  }
});
