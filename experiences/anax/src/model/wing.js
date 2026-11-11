// A wing blade: iridescent film stretched over a drawn network of veins, on a machined root.
// Local frame: origin where the spar leaves the rocker, +Z along the span, +X toward the leading edge, +Y up.
import * as THREE from 'three';
import { Kit, vein, plate, cyl, gearZ, screw, at, V, seeded, circlePath, slotPath } from '../geo.js';
import { PITCH } from '../spec.js';

const OUTLINES = {
  fore: {
    lead: [[0.26, 0.05], [0.7, 0.13], [1.6, 0.2], [2.9, 0.25], [4.3, 0.25], [5.4, 0.17], [6.0, 0.02], [6.3, -0.2]],
    trail: [[6.12, -0.5], [5.4, -0.78], [4.2, -0.9], [2.8, -0.9], [1.6, -0.74], [0.8, -0.46], [0.4, -0.2], [0.26, -0.06]],
    nodus: 0.46,
  },
  hind: {
    lead: [[0.26, 0.05], [0.7, 0.13], [1.6, 0.2], [2.75, 0.25], [4.2, 0.24], [5.2, 0.16], [5.78, 0.02], [6.05, -0.2]],
    trail: [[5.86, -0.56], [5.1, -0.9], [3.9, -1.12], [2.6, -1.3], [1.5, -1.4], [0.85, -1.28], [0.5, -0.8], [0.34, -0.3], [0.26, -0.06]],
    nodus: 0.44,
  },
};

/** Turn an outline into leading and trailing edge positions at any span station. */
function edges(outline) {
  const pts = [...outline.lead, ...outline.trail].map(([s, x]) => new THREE.Vector3(s, x, 0));
  const loop = new THREE.CatmullRomCurve3(pts, true, 'centripetal').getPoints(900);
  const s0 = outline.lead[0][0];
  const s1 = Math.max(...outline.lead.map((p) => p[0]));
  const N = 240;
  const lead = new Float32Array(N + 1);
  const trail = new Float32Array(N + 1);
  for (let k = 0; k <= N; k += 1) {
    const s = s0 + (s1 - s0) * Math.min(0.9995, Math.max(0.0005, k / N));
    let hi = -Infinity; let lo = Infinity;
    for (let i = 0; i < loop.length - 1; i += 1) {
      const a = loop[i]; const b = loop[i + 1];
      if ((a.x - s) * (b.x - s) > 0 || a.x === b.x) continue;
      const x = a.y + ((b.y - a.y) * (s - a.x)) / (b.x - a.x);
      if (x > hi) hi = x;
      if (x < lo) lo = x;
    }
    lead[k] = hi; trail[k] = lo;
  }
  const sample = (table, u) => {
    const f = Math.min(1, Math.max(0, u)) * N;
    const i = Math.min(N - 1, Math.floor(f));
    return table[i] + (table[i + 1] - table[i]) * (f - i);
  };
  return { s0, s1, lead: (u) => sample(lead, u), trail: (u) => sample(trail, u) };
}

export function buildWingBlade(ctx, kind, comp, seed) {
  const { M } = ctx;
  const set = M.wingSet();
  const outline = OUTLINES[kind];
  const edge = edges(outline);
  const random = seeded(seed);
  const span = edge.s1 - edge.s0;

  // Height of the film: a shallow camber with fine pleats that fade toward the tip, as on a real wing.
  const height = (u, v) => 0.05 * Math.sin(Math.PI * v) * (1 - 0.55 * u) * Math.min(1, u * 6) + 0.007 * Math.sin(v * 21) * (1 - u) * Math.min(1, u * 8);
  const point = (u, v, out = V()) => {
    const le = edge.lead(u); const te = edge.trail(u);
    return out.set(te + (le - te) * v, height(u, v), edge.s0 + span * u);
  };
  const chord = (u) => Math.max(1e-3, edge.lead(u) - edge.trail(u));
  // v for a line that runs a fixed distance behind the leading edge.
  const behind = (u, distance) => Math.max(0, 1 - distance / chord(u));

  // ---- film ----------------------------------------------------------------------------------
  const NS = 84; const NC = 12;
  const positions = []; const uvs = []; const index = [];
  const p = V();
  for (let k = 0; k <= NS; k += 1) {
    const u = 0.5 - 0.5 * Math.cos((Math.PI * k) / NS);
    for (let j = 0; j <= NC; j += 1) {
      const v = j / NC;
      point(u, v, p);
      positions.push(p.x, p.y, p.z);
      uvs.push(u, v);
    }
  }
  for (let k = 0; k < NS; k += 1) {
    for (let j = 0; j < NC; j += 1) {
      const a = k * (NC + 1) + j; const b = a + NC + 1;
      index.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const filmGeometry = new THREE.BufferGeometry();
  filmGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  filmGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  filmGeometry.setIndex(index);
  filmGeometry.computeVertexNormals();
  const film = new THREE.Mesh(filmGeometry, set.film);
  film.userData.comp = comp;
  film.renderOrder = 4;

  // ---- veins ---------------------------------------------------------------------------------
  const veins = new Kit();
  const trace = (fn, u0, u1, steps, r0, r1, seg = 5) => {
    const pts = [];
    for (let i = 0; i <= steps; i += 1) {
      const u = u0 + ((u1 - u0) * i) / steps;
      pts.push(point(u, fn(u)));
    }
    veins.add(vein(pts, r0, r1, seg), set.vein);
  };
  const N = outline.nodus;
  // Costa (leading edge), the trailing margin, subcosta to the nodus, and the radius behind them.
  trace(() => 1, 0, 1, 90, 0.03, 0.008, 7);
  trace(() => 0, 0, 1, 90, 0.011, 0.006);
  const subcosta = (u) => (u < N ? behind(u, 0.062 * Math.min(1, u * 12)) : 1);
  trace(subcosta, 0, N, 40, 0.014, 0.01);
  const radius = (u) => behind(u, (u < 0.86 ? 0.135 : 0.135 - ((u - 0.86) / 0.14) * 0.1) * Math.min(1, u * 9));
  trace(radius, 0, 1, 80, 0.017, 0.007, 6);
  // The nodus: a braced joint where the leading edge is allowed to flex.
  veins.add(vein([point(N, 1), point(N + 0.004, radius(N))], 0.016, 0.012, 6), set.vein);
  veins.add(new THREE.SphereGeometry(0.03, 12, 8), M.polished, at(...point(N, 1).toArray()));

  // Long veins fan from the root and sweep back to the trailing edge.
  const count = kind === 'fore' ? 8 : 9;
  const ends = kind === 'fore' ? [0.99, 0.97, 0.9, 0.79, 0.66, 0.52, 0.38, 0.24] : [0.99, 0.97, 0.9, 0.8, 0.68, 0.56, 0.44, 0.32, 0.2];
  const lines = [{ id: 0, end: 1, at: radius }];
  for (let k = 0; k < count; k += 1) {
    const start = 0.8 - (0.7 * k) / (count - 1);
    const end = ends[k];
    const land = k === 0 ? 0.62 : k === 1 ? 0.26 : 0;
    const power = 2.1 + k * 0.12;
    const fn = (u) => start + (land - start) * Math.min(1, u / end) ** power;
    lines.push({ id: k + 1, end, at: fn });
    trace(fn, 0, end, 54, 0.013, 0.005);
  }
  lines.push({ id: 99, end: 1, at: () => 0 });

  // Cross veins. Marching along the span, each neighbouring pair of veins is bridged at intervals
  // that follow the gap between them, which is what gives the cells their even grain.
  const next = new Map();
  const a = V(); const b = V();
  for (let u = 0.035; u < 0.985; u += 0.003) {
    const alive = lines.filter((line) => u <= line.end).sort((p1, p2) => p2.at(u) - p1.at(u));
    for (let i = 0; i < alive.length - 1; i += 1) {
      const key = alive[i].id * 100 + alive[i + 1].id;
      const due = next.get(key) ?? u + random() * 0.02;
      if (u < due) { next.set(key, due); continue; }
      const skew = (random() - 0.5) * 0.01;
      point(u, alive[i].at(u), a);
      point(Math.min(0.999, u + skew), alive[i + 1].at(Math.min(0.999, u + skew)), b);
      const gap = a.distanceTo(b);
      if (gap > 0.012) veins.add(vein([a.clone(), b.clone()], 0.0065, 0.0055, 4), set.vein);
      next.set(key, u + (Math.max(0.05, Math.min(0.22, gap * 0.95)) * (0.75 + random() * 0.5)) / span);
    }
    // The ladder of short braces between costa, subcosta and radius.
    const key = -1;
    const due = next.get(key) ?? 0.05;
    if (u >= due) {
      const top = point(u, 1); const mid = point(u, subcosta(u)); const low = point(u, radius(u));
      veins.add(vein(u < N ? [top, mid, low] : [top, low], 0.008, 0.007, 4), set.vein);
      next.set(key, u + (u < N ? 0.024 : 0.034) * (0.85 + random() * 0.3));
    }
  }

  // Pterostigma: the dense cell near the tip that tunes the wing against flutter.
  {
    const u0 = 0.868; const u1 = 0.93;
    const pos = []; const idx = [];
    const steps = 6;
    for (let i = 0; i <= steps; i += 1) {
      const u = u0 + ((u1 - u0) * i) / steps;
      for (const [v, y] of [[1, 0.012], [radius(u), 0.012], [1, -0.012], [radius(u), -0.012]]) {
        point(u, v, p);
        pos.push(p.x, p.y + y, p.z);
      }
    }
    for (let i = 0; i < steps; i += 1) {
      const o = i * 4;
      idx.push(o, o + 4, o + 1, o + 1, o + 4, o + 5, o + 2, o + 3, o + 6, o + 3, o + 7, o + 6);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    veins.add(g, set.stigma);
  }

  // ---- root fitting --------------------------------------------------------------------------
  // The spar turns in the rocker; the clamp gathers the veins and carries the feathering gear.
  const root = new Kit();
  const clamp = new THREE.Shape();
  clamp.moveTo(0.12, -0.062);
  clamp.lineTo(0.3, -0.085);
  clamp.lineTo(0.66, edge.trail(0.07) * 0.82);
  clamp.lineTo(0.74, edge.trail(0.08) * 0.3);
  clamp.lineTo(0.6, 0.02);
  clamp.lineTo(0.78, edge.lead(0.085) - 0.01);
  clamp.lineTo(0.66, edge.lead(0.065) + 0.012);
  clamp.lineTo(0.3, 0.085);
  clamp.lineTo(0.12, 0.062);
  clamp.closePath();
  clamp.holes.push(slotPath(0.3, 0, 0.46, 0, 0.026));
  clamp.holes.push(circlePath(0.56, -0.12, 0.022));
  const flat = new THREE.Matrix4().makeBasis(V(0, 0, 1), V(1, 0, 0), V(0, 1, 0));
  root.add(plate(clamp, 0.034, 0.006).applyMatrix4(flat), M.titanium);
  root.add(cyl(0.042, 0.5, 'z', 20), M.polished, at(0, 0, 0.11));
  root.add(cyl(0.05, 0.03, 'z', 20), M.steel, at(0, 0, 0.1));
  const bolt = screw(0.018, 0.012, 0.008, 0.03);
  for (const [z, x] of [[0.22, 0.05], [0.22, -0.05], [0.52, 0.06], [0.5, -0.13]]) root.add(bolt.clone(), M.steel, at(x, 0.017, z));
  root.add(gearZ(PITCH.spar, PITCH.module, 0.03, { bore: 0.042 }), M.brass, at(0, 0, 0.045));

  const blade = new THREE.Group();
  blade.add(film);
  const veinGroup = veins.build(comp);
  const rootGroup = root.build(comp);
  blade.add(veinGroup, rootGroup);
  return { blade, uniforms: set.uniforms, length: edge.s1 };
}
