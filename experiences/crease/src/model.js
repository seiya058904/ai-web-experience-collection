// Exact rigid-origami geometry behind CREASE. No DOM and no clock.
// Every facet stays a rigid plane: folding changes where it is, never its shape.
export const SHEET = { width: 2, height: Math.SQRT2 };
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => mul(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));
const rotate = (v, axis, angle) => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return add(add(mul(v, c), mul(cross(axis, v), s)), mul(axis, dot(axis, v) * (1 - c)));
};

const rect = () => {
  const x = SHEET.width / 2;
  const y = SHEET.height / 2;
  return [[-x, -y], [x, -y], [x, y], [-x, y]];
};

// Sutherland-Hodgman against one half plane: keeps points where n.p <= d.
function clipHalf(polygon, nx, ny, d) {
  const out = [];
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const da = nx * a[0] + ny * a[1] - d;
    const db = nx * b[0] + ny * b[1] - d;
    if (da <= 0) out.push(a);
    if (da * db < 0) {
      const t = da / (da - db);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
}
export function clipToSheet(polygon) {
  const x = SHEET.width / 2;
  const y = SHEET.height / 2;
  let p = polygon;
  for (const [nx, ny, d] of [[1, 0, x], [-1, 0, x], [0, 1, y], [0, -1, y]]) {
    if (p.length) p = clipHalf(p, nx, ny, d);
  }
  return p;
}
export function clipSegment(a, b) {
  const x = SHEET.width / 2;
  const y = SHEET.height / 2;
  let t0 = 0;
  let t1 = 1;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  for (const [p, q] of [[-dx, a[0] + x], [dx, x - a[0]], [-dy, a[1] + y], [dy, y - a[1]]]) {
    if (Math.abs(p) < 1e-12) {
      if (q < 0) return null;
    } else {
      const r = q / p;
      if (p < 0) t0 = Math.max(t0, r);
      else t1 = Math.min(t1, r);
    }
  }
  if (t1 - t0 < 1e-6) return null;
  return [[a[0] + dx * t0, a[1] + dy * t0], [a[0] + dx * t1, a[1] + dy * t1]];
}

// Maps a flat polygon through the rigid motion defined by three flat and three folded points.
function mapFacet(polygon, A, B, C, a, b, c) {
  const u = [B[0] - A[0], B[1] - A[1]];
  const v = [C[0] - A[0], C[1] - A[1]];
  const det = u[0] * v[1] - u[1] * v[0];
  const eu = sub(b, a);
  const ev = sub(c, a);
  return polygon.map((p) => {
    const x = p[0] - A[0];
    const y = p[1] - A[1];
    const s = (x * v[1] - y * v[0]) / det;
    const t = (u[0] * y - u[1] * x) / det;
    return add(a, add(mul(eu, s), mul(ev, t)));
  });
}

// Places the result on the table: centred in plan, lowest point at zero.
function settle(facets) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  for (const facet of facets) {
    for (const p of facet.points) {
      minX = Math.min(minX, p[0]);
      maxX = Math.max(maxX, p[0]);
      minY = Math.min(minY, p[1]);
      maxY = Math.max(maxY, p[1]);
      minZ = Math.min(minZ, p[2]);
    }
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  let maxZ = -Infinity;
  for (const facet of facets) {
    facet.points = facet.points.map((p) => [p[0] - cx, p[1] - cy, p[2] - minZ]);
    for (const p of facet.points) maxZ = Math.max(maxZ, p[2]);
  }
  return { facets, bounds: { width: maxX - minX, length: maxY - minY, height: maxZ } };
}

// I. One straight crease. One half stays down, the other turns over it.
export function lineFold(fold) {
  const angle = rad(62);
  const d = [Math.cos(angle), Math.sin(angle), 0];
  const n = [-d[1], d[0]];
  const down = clipHalf(rect(), n[0], n[1], 0);
  const over = clipHalf(rect(), -n[0], -n[1], 0);
  const turn = clamp(fold) * rad(177);
  const facets = [
    { flat: down, points: down.map((p) => [p[0], p[1], 0]) },
    { flat: over, points: over.map((p) => rotate([p[0], p[1], 0], d, turn)) },
  ];
  return settle(facets);
}
export function lineCreases() {
  const a = [Math.cos(rad(62)) * 3, Math.sin(rad(62)) * 3];
  return [{ a: clipSegment([-a[0], -a[1]], a)[0], b: clipSegment([-a[0], -a[1]], a)[1], type: 'V' }];
}

// II. Four creases at one vertex: a spherical four-bar linkage with one degree of freedom.
export const VERTEX_ANGLES = [65, 100, 115, 80];
export function vertexAngles(shift = 0) {
  const [a, b, c, d] = VERTEX_ANGLES;
  return [a, b + shift, c - shift, d];
}
const flatRay = (angle) => [Math.cos(angle), Math.sin(angle), 0];
function vertexRays(angles) {
  const start = rad(18);
  const out = [];
  let at = start;
  for (let i = 0; i < 4; i += 1) {
    out.push(at);
    at += rad(angles[i]);
  }
  return out;
}
// Solves crease 3 from creases 2 and 4, which it must meet at fixed sector angles.
function solveVertex(angles, drive, branch) {
  const rays = vertexRays(angles).map(flatRay);
  const [c1, c2, , c4Flat] = rays;
  const c4 = rotate(c4Flat, c1, drive);
  const g = dot(c2, c4);
  const denom = 1 - g * g;
  if (denom < 1e-9) return null;
  const ca = Math.cos(rad(angles[1]));
  const cb = Math.cos(rad(angles[2]));
  const x = (ca - g * cb) / denom;
  const y = (cb - g * ca) / denom;
  const remainder = (1 - x * x - y * y - 2 * x * y * g) / denom;
  if (remainder < -1e-7) return null;
  const z = branch * Math.sqrt(Math.max(remainder, 0));
  const c3 = add(add(mul(c2, x), mul(c4, y)), mul(cross(c2, c4), z));
  return [c1, c2, c3, c4];
}
const signedFold = (na, nb, axis) => {
  const c = clamp(dot(na, nb), -1, 1);
  return Math.atan2(dot(cross(na, nb), axis), c);
};
// Valley folds count positive: the two facets' front sides turn toward each other.
export function vertexFolds(c) {
  const normals = c.map((ray, i) => norm(cross(ray, c[(i + 1) % 4])));
  return c.map((ray, i) => signedFold(normals[(i + 3) % 4], normals[i], ray));
}
const BRANCH = -1;
// Where the motion ends: the linkage binds, or one crease closes completely.
// With Kawasaki's condition all four creases close together. Otherwise some stay open.
export function vertexLimit(angles) {
  let last = 0;
  let open = 180;
  for (let d = 0.5; d <= 179.5; d += 0.5) {
    const solved = solveVertex(angles, rad(d), BRANCH);
    if (!solved) break;
    const folds = vertexFolds(solved).map((f) => Math.abs(deg(f)));
    if (folds.some((f) => f > 179.75)) break;
    last = d;
    open = 180 - Math.min(...folds);
  }
  return { drive: last, open };
}
export function vertexInfo(shift = 0) {
  const angles = vertexAngles(shift);
  const { drive, open } = vertexLimit(angles);
  const a = angles[0] + angles[2];
  const b = angles[1] + angles[3];
  const flat = Math.abs(a - 180) < 0.01;
  const solved = solveVertex(angles, rad(Math.min(drive, 40)), BRANCH);
  const folds = solved ? vertexFolds(solved) : [0, 0, 0, 0];
  const valleys = folds.filter((f) => f > 0).length;
  return { angles, a, b, flat, drive, open, valleys, mountains: 4 - valleys };
}
export function vertexFold(fold, shift = 0) {
  const angles = vertexAngles(shift);
  const limit = Math.min(vertexLimit(angles).drive, 171);
  const solved = solveVertex(angles, rad(limit) * clamp(fold), BRANCH);
  const rays = vertexRays(angles).map(flatRay);
  const far = 6;
  const facets = [];
  for (let i = 0; i < 4; i += 1) {
    const j = (i + 1) % 4;
    const A = [0, 0];
    const B = [rays[i][0] * far, rays[i][1] * far];
    const C = [rays[j][0] * far, rays[j][1] * far];
    const flat = clipToSheet([A, B, C]);
    if (flat.length < 3) continue;
    facets.push({ flat, points: mapFacet(flat, A, B, C, [0, 0, 0], mul(solved[i], far), mul(solved[j], far)) });
  }
  // Keep the whole sheet facing up as it moves, rather than pinning one sector to the table.
  let up = [0, 0, 0];
  for (const facet of facets) {
    const p = facet.points;
    for (let i = 1; i < p.length - 1; i += 1) up = add(up, cross(sub(p[i], p[0]), sub(p[i + 1], p[0])));
  }
  up = norm(up);
  const axis = cross(up, [0, 0, 1]);
  const size = Math.hypot(axis[0], axis[1], axis[2]);
  if (size > 1e-6) {
    const unit = mul(axis, 1 / size);
    const angle = Math.atan2(size, up[2]);
    for (const facet of facets) facet.points = facet.points.map((p) => rotate(p, unit, angle));
  }
  return settle(facets);
}
export function vertexCreases(shift = 0) {
  const angles = vertexAngles(shift);
  const rays = vertexRays(angles).map(flatRay);
  const solved = solveVertex(angles, rad(Math.min(vertexLimit(angles).drive, 40)), BRANCH);
  const folds = vertexFolds(solved);
  return rays.map((ray, i) => {
    const segment = clipSegment([0, 0], [ray[0] * 6, ray[1] * 6]);
    return { a: segment[0], b: segment[1], type: folds[i] > 0 ? 'V' : 'M' };
  });
}

// III. The Miura pattern. Closed-form kinematics from one fold angle (Schenk & Guest, 2013).
export const MIURA_LIMIT = rad(85);
export function miuraCell(gamma, a, b, theta) {
  const g = rad(gamma);
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const root = Math.sqrt(1 + cosT * cosT * Math.tan(g) ** 2);
  return {
    H: a * sinT * Math.sin(g),
    S: (b * cosT * Math.tan(g)) / root,
    L: a * Math.sqrt(1 - sinT * sinT * Math.sin(g) ** 2),
    V: b / root,
  };
}
export const MIURA_DEFAULT = { gamma: 68, columns: 10, rows: 8 };
function miuraPlan({ gamma, columns, rows }) {
  const g = rad(gamma);
  const b = SHEET.width / (columns * Math.sin(g));
  const a = SHEET.height / rows;
  const shift = b * Math.cos(g);
  const extra = Math.ceil(shift / a) + 1;
  return { a, b, shift, extra, columns, rows, gamma };
}
const flatVertex = (plan, i, j) => [
  -SHEET.width / 2 + i * (SHEET.width / plan.columns),
  -SHEET.height / 2 + j * plan.a + (i % 2 ? plan.shift : 0) - plan.shift / 2,
];
const foldedVertex = (plan, cell, i, j) => {
  const odd = ((j % 2) + 2) % 2;
  return [i * cell.S, j * cell.L + (i % 2 ? cell.V : 0), odd ? cell.H : 0];
};
export function miuraFold(fold, params = MIURA_DEFAULT) {
  const plan = miuraPlan(params);
  const theta = clamp(fold) * MIURA_LIMIT;
  const cell = miuraCell(plan.gamma, plan.a, plan.b, theta);
  const facets = [];
  for (let i = 0; i < plan.columns; i += 1) {
    for (let j = -plan.extra; j < plan.rows + plan.extra; j += 1) {
      const A = flatVertex(plan, i, j);
      const B = flatVertex(plan, i + 1, j);
      const C = flatVertex(plan, i, j + 1);
      const D = flatVertex(plan, i + 1, j + 1);
      const flat = clipToSheet([A, B, D, C]);
      if (flat.length < 3) continue;
      facets.push({
        flat,
        points: mapFacet(flat, A, B, C, foldedVertex(plan, cell, i, j), foldedVertex(plan, cell, i + 1, j), foldedVertex(plan, cell, i, j + 1)),
      });
    }
  }
  return settle(facets);
}
// Mountain or valley from the fold itself, read at a mid-fold state.
export function miuraCreases(params = MIURA_DEFAULT) {
  const plan = miuraPlan(params);
  const cell = miuraCell(plan.gamma, plan.a, plan.b, rad(35));
  const unit = (i, j) => {
    const a = foldedVertex(plan, cell, i, j);
    return norm(cross(sub(foldedVertex(plan, cell, i + 1, j), a), sub(foldedVertex(plan, cell, i, j + 1), a)));
  };
  const creases = [];
  const push = (a, b, type) => {
    const clipped = clipSegment(a, b);
    if (clipped) creases.push({ a: clipped[0], b: clipped[1], type });
  };
  for (let i = 0; i < plan.columns; i += 1) {
    for (let j = -plan.extra; j <= plan.rows + plan.extra; j += 1) {
      const a = foldedVertex(plan, cell, i, j);
      const b = foldedVertex(plan, cell, i + 1, j);
      push(flatVertex(plan, i, j), flatVertex(plan, i + 1, j), dot(cross(unit(i, j - 1), unit(i, j)), norm(sub(b, a))) > 0 ? 'V' : 'M');
    }
  }
  for (let i = 1; i < plan.columns; i += 1) {
    for (let j = -plan.extra; j < plan.rows + plan.extra; j += 1) {
      const a = foldedVertex(plan, cell, i, j);
      const b = foldedVertex(plan, cell, i, j + 1);
      push(flatVertex(plan, i, j), flatVertex(plan, i, j + 1), dot(cross(unit(i, j), unit(i - 1, j)), norm(sub(b, a))) > 0 ? 'V' : 'M');
    }
  }
  return creases;
}
export function miuraMetrics(fold, params = MIURA_DEFAULT) {
  const { bounds } = miuraFold(fold, params);
  const width = bounds.width / SHEET.width;
  const length = bounds.length / SHEET.height;
  const plan = miuraPlan(params);
  const cell = miuraCell(plan.gamma, plan.a, plan.b, clamp(fold) * MIURA_LIMIT);
  return { width, length, area: width * length, angle: deg(clamp(fold) * MIURA_LIMIT), height: cell.H / SHEET.width };
}

// The sheet's far corner as folded: the one a visitor pulls.
export function cornerPoint(result) {
  const x = SHEET.width / 2;
  const y = SHEET.height / 2;
  for (const facet of result.facets) {
    const i = facet.flat.findIndex((p) => Math.abs(p[0] - x) < 1e-6 && Math.abs(p[1] - y) < 1e-6);
    if (i >= 0) return facet.points[i];
  }
  return null;
}

// V. A printable A4 crease pattern with standard mountain and valley line styles.
export function creasePatternSVG(creases, { gamma, columns, rows } = MIURA_DEFAULT) {
  const w = 268;
  const h = w / (SHEET.width / SHEET.height);
  const left = (297 - w) / 2;
  const top = 7;
  const scale = w / SHEET.width;
  const x = (px) => (left + (px + SHEET.width / 2) * scale).toFixed(2);
  const y = (py) => (top + (SHEET.height / 2 - py) * scale).toFixed(2);
  const line = (crease) => `<line x1="${x(crease.a[0])}" y1="${y(crease.a[1])}" x2="${x(crease.b[0])}" y2="${y(crease.b[1])}" class="${crease.type === 'M' ? 'm' : 'v'}"/>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="297mm" height="210mm" viewBox="0 0 297 210">
<title>CREASE: Miura pattern, ${columns} columns, ${rows} rows, ${gamma} degrees</title>
<style>.m{stroke:#1c39c9;stroke-width:.3;stroke-dasharray:4 1.2 .6 1.2}.v{stroke:#d8321f;stroke-width:.3;stroke-dasharray:2 1.4}line{fill:none}text{font:3px Arial,sans-serif;fill:#333}</style>
<rect x="${left}" y="${top}" width="${w}" height="${h.toFixed(2)}" fill="none" stroke="#999" stroke-width=".2"/>
${creases.map(line).join('\n')}
<text x="${left}" y="${(top + h + 5).toFixed(2)}">Print at 100%. Score every line against a ruler. Blue dash-dot folds away from you (mountain). Red dashed folds toward you (valley).</text>
</svg>
`;
}

// One continuous film. Stage changes happen only while the sheet is flat, so they cannot be seen.
export function filmAt(p, aspect = 16 / 9) {
  const stage = p < 0.2 ? 'line' : p < 0.46 ? 'vertex' : p < 0.83 ? 'miura' : 'yours';
  const reveal = stage === 'line' ? smooth(0.012, 0.05, p) * (1 - smooth(0.168, 0.198, p))
    : stage === 'vertex' ? smooth(0.205, 0.245, p) * (1 - smooth(0.425, 0.455, p))
      : stage === 'miura' ? smooth(0.465, 0.5, p) * (1 - smooth(0.795, 0.825, p))
        : smooth(0.84, 0.875, p);
  const keys = [
    [0, 64, -18, 4.3], [0.05, 58, -24, 3.9], [0.2, 66, 8, 3.7], [0.3, 44, 30, 3.4], [0.46, 62, 0, 3.7],
    [0.56, 36, -32, 3.75], [0.68, 28, -52, 3.5], [0.78, 34, 28, 3.1], [0.84, 60, 8, 3.7], [1, 42, -24, 3.95],
  ];
  let i = 0;
  while (i < keys.length - 2 && p > keys[i + 1][0]) i += 1;
  const [p0, e0, a0, d0] = keys[i];
  const [p1, e1, a1, d1] = keys[i + 1];
  const t = smooth(p0, p1, p);
  const tall = aspect < 1;
  return {
    stage,
    reveal,
    lineFold: smooth(0.055, 0.15, p) * (1 - smooth(0.165, 0.2, p)),
    vertexFold: smooth(0.245, 0.325, p) * (1 - smooth(0.395, 0.445, p)),
    miuraEnter: smooth(0.5, 0.575, p),
    pullZone: smooth(0.665, 0.7, p),
    miuraExit: 1 - smooth(0.785, 0.825, p),
    yoursEnter: smooth(0.875, 0.93, p),
    titleFold: smooth(0.004, 0.05, p),
    elevation: lerp(e0, e1, t),
    azimuth: lerp(a0, a1, t) + (tall ? 90 : 0),
    distance: lerp(d0, d1, t) * (tall ? 1.86 : 1),
    shiftX: tall ? 0 : lerp(0.11, 0.2, smooth(0.03, 0.1, p)),
    // The name stands above the sheet at first; on tall screens the sheet then rides above the text.
    shiftY: lerp(tall ? 0.03 : 0.2, tall ? -0.2 : 0, smooth(0.03, 0.1, p)),
  };
}
