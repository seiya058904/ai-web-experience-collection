/**
 * INKSCAPE's procedural material layer.
 *
 * All geometry is seeded. Scroll controls deposition; time is used only for
 * small, bounded changes inside an already established composition. No frame
 * history is needed to seek, reverse, restore, or resize the experience.
 */

const TAU = Math.PI * 2;
const INK = '29, 30, 26';
const WATER = '91, 82, 63';
const clamp = (n, low = 0, high = 1) => Math.max(low, Math.min(high, n));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, n) => {
  const t = clamp((n - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function random(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = Math.imul(value ^ (value >>> 15), 1 | value);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function surface(width, height) {
  const element = document.createElement('canvas');
  element.width = Math.max(1, Math.round(width));
  element.height = Math.max(1, Math.round(height));
  return element;
}

function cubic(a, b, c, d, t) {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  };
}

function curvePoint(points, t) {
  if (points.length > 4) {
    const amount = clamp(t) * (points.length - 1);
    const segment = Math.min(points.length - 2, Math.floor(amount));
    const local = amount - segment;
    const before = points[Math.max(0, segment - 1)];
    const start = points[segment];
    const end = points[segment + 1];
    const after = points[Math.min(points.length - 1, segment + 2)];
    const coordinate = (key) => 0.5 * (
      2 * start[key]
      + (-before[key] + end[key]) * local
      + (2 * before[key] - 5 * start[key] + 4 * end[key] - after[key]) * local * local
      + (-before[key] + 3 * start[key] - 3 * end[key] + after[key]) * local * local * local
    );
    return { x: coordinate('x'), y: coordinate('y') };
  }
  return cubic(points[0], points[1], points[2], points[3], t);
}

function sampleCurve(points, count = 168) {
  const output = [];
  for (let i = 0; i <= count; i += 1) {
    const t = i / count;
    const point = curvePoint(points, t);
    const before = curvePoint(points, Math.max(0, t - 0.001));
    const after = curvePoint(points, Math.min(1, t + 0.001));
    const length = Math.hypot(after.x - before.x, after.y - before.y) || 1;
    output.push({
      x: point.x,
      y: point.y,
      nx: -(after.y - before.y) / length,
      ny: (after.x - before.x) / length,
      tx: (after.x - before.x) / length,
      ty: (after.y - before.y) / length,
      t,
    });
  }
  return output;
}

function tracePath(ctx, points, count = points.length) {
  const end = Math.min(points.length, Math.max(0, Math.floor(count)));
  if (end < 2) return false;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < end; i += 1) ctx.lineTo(points[i].x, points[i].y);
  return true;
}

// A water margin is deliberately asymmetrical: broad lobes, a displaced centre,
// and short wavering edges. It is not a set of concentric circles.
function makeWaterEdge(seed, count = 260) {
  const rng = random(seed);
  const phases = Array.from({ length: 7 }, () => rng() * TAU);
  const edge = [];
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * TAU;
    const radius = 0.89
      + 0.115 * Math.sin(angle * 2 + phases[0])
      + 0.096 * Math.sin(angle * 3 + phases[1])
      + 0.062 * Math.sin(angle * 5 + phases[2])
      + 0.029 * Math.sin(angle * 11 + phases[3])
      + 0.014 * Math.sin(angle * 27 + phases[4])
      + 0.006 * Math.sin(angle * 63 + phases[5]);
    edge.push({
      x: Math.cos(angle) * radius + 0.09 * Math.sin(angle * 2 + phases[6]),
      y: Math.sin(angle) * radius,
      phase: phases[0] + angle * 5,
    });
  }
  return edge;
}

function makeCapillaries(seed) {
  const rng = random(seed);
  const branches = [];
  const grow = (x, y, heading, length, depth, birth) => {
    const points = [{ x, y }];
    const count = 12 + depth * 3;
    let direction = heading;
    for (let i = 1; i <= count; i += 1) {
      direction += (rng() - 0.5) * 0.48;
      const step = (length / count) * (0.8 + rng() * 0.4);
      x += Math.cos(direction) * step;
      y += Math.sin(direction) * step;
      points.push({ x, y });
    }
    branches.push({ points, depth, birth, width: 0.6 + depth * 0.4, tone: 0.25 + rng() * 0.3 });
    if (depth <= 0) return;
    for (let j = 0; j < 2; j += 1) {
      const split = points[Math.floor(lerp(0.46, 0.89, rng()) * count)];
      grow(split.x, split.y, direction + (j ? 1 : -1) * (0.35 + rng() * 0.7), length * (0.33 + rng() * 0.19), depth - 1, birth + 0.07);
    }
  };
  // Sparse, differing directions around the left and lower edge of the ink mass.
  for (let i = 0; i < 12; i += 1) {
    const angle = lerp(1.24, 4.99, i / 11) + (rng() - 0.5) * 0.22;
    const radial = 0.29 + rng() * 0.055;
    grow(Math.cos(angle) * radial, Math.sin(angle) * radial, angle, 0.04 + rng() * 0.073, i % 3 === 0 ? 3 : 2, rng() * 0.22);
  }
  return branches;
}

function makeFibers(seed) {
  const rng = random(seed);
  return Array.from({ length: 132 }, (_, index) => {
    const start = { x: lerp(-0.58, 0.58, rng()), y: lerp(-0.59, 0.59, rng()) };
    const angle = rng() * TAU;
    const length = lerp(0.17, 0.79, rng());
    const direction = { x: Math.cos(angle), y: Math.sin(angle) };
    const sideways = { x: -direction.y, y: direction.x };
    const bend = (rng() - 0.5) * 0.36;
    const phase = rng() * TAU;
    const points = [];
    for (let i = 0; i <= 24; i += 1) {
      const t = i / 24;
      const drift = Math.sin(t * Math.PI) * bend
        + Math.sin(t * 8.4 + phase) * 0.014
        + Math.sin(t * 17.3 + phase) * 0.003;
      points.push({
        x: start.x + direction.x * length * (t - 0.5) + sideways.x * drift,
        y: start.y + direction.y * length * (t - 0.5) + sideways.y * drift,
      });
    }
    return {
      points,
      width: lerp(0.65, 2.6, rng()),
      tone: lerp(0.1, 0.33, rng()),
      phase,
      birth: (index % 13) / 13,
      dark: index % 9 === 0,
    };
  });
}

const TRACE_CURVE = [
  { x: 0.085, y: 0.78 },
  { x: 0.31, y: 0.84 },
  { x: 0.65, y: 0.31 },
  { x: 0.89, y: 0.25 },
];

const MARK_CURVE = [
  { x: 0.21, y: 0.96 },
  { x: 0.42, y: 0.83 },
  { x: 0.66, y: 0.74 },
  { x: 0.73, y: 0.62 },
  { x: 0.55, y: 0.47 },
  { x: 0.39, y: 0.36 },
  { x: 0.46, y: 0.245 },
  { x: 0.67, y: 0.155 },
  { x: 0.79, y: 0.06 },
];

/** Build a pressure-shaped brush deposit once, including actual bristle gaps. */
function makeBrushTexture({ width, height, wet, mark = false }) {
  const canvas = surface(width, height);
  const ctx = canvas.getContext('2d');
  const rng = random(mark ? 79127 : 12489);
  const normalized = mark ? MARK_CURVE : TRACE_CURVE;
  const route = sampleCurve(normalized.map((point) => ({ x: point.x * width, y: point.y * height })), 184);
  const broadness = mark ? width * 0.115 : height * 0.112;
  const pressure = (t) => 0.65 + Math.sin(t * Math.PI) * 0.30 + Math.sin(t * 8.3) * 0.075;

  // The body is an irregular polygon, not a stroked vector with rounded caps.
  const boundary = [];
  for (let side = -1; side <= 1; side += 2) {
    const samples = side === -1 ? route : [...route].reverse();
    for (const p of samples) {
      const amount = broadness * pressure(p.t) * (0.70 + 0.065 * Math.sin(p.t * 103) + 0.036 * Math.sin(p.t * 281));
      boundary.push({ x: p.x + p.nx * amount * side, y: p.y + p.ny * amount * side });
    }
  }
  tracePath(ctx, boundary);
  ctx.closePath();
  ctx.fillStyle = `rgba(${INK}, ${wet ? 0.98 : 0.94})`;
  ctx.fill();

  // The 136 strands have individual contact lengths, ink load, width and grain.
  // Their little interruptions remain anchored when scroll direction changes.
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'round';
  for (let bristle = 0; bristle < 136; bristle += 1) {
    const across = (bristle / 135 - 0.5) * 2;
    const phase = rng() * TAU;
    const start = Math.floor(rng() * (Math.abs(across) > 0.74 ? 16 : 6));
    const end = route.length - 1 - Math.floor(rng() * 13);
    const inkLoad = lerp(wet ? 0.61 : 0.65, wet ? 0.93 : 0.99, rng());
    ctx.strokeStyle = `rgba(${INK}, ${inkLoad})`;
    ctx.lineWidth = lerp(0.8, wet ? 3.0 : 2.7, rng()) * (width / 1500);
    let drawing = false;
    ctx.beginPath();
    for (let j = start; j <= end; j += 1) {
      const p = route[j];
      const tremor = Math.sin(p.t * 71 + phase) * 0.55 + Math.sin(p.t * 173 + phase) * 0.28;
      const offset = across * broadness * pressure(p.t) + tremor * (1.2 + Math.abs(across) * 2.3);
      const x = p.x + p.nx * offset;
      const y = p.y + p.ny * offset;
      const skipped = !wet && rng() < (0.015 + Math.abs(across) * 0.075);
      if (!drawing || skipped) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      drawing = !skipped;
    }
    ctx.stroke();
  }

  // Dry paper interrupts the deposit in long, ragged channels, aligned with
  // the brush's actual changing tangent rather than a flat noise overlay.
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < (wet ? 39 : 118); i += 1) {
    const across = lerp(-0.99, 0.99, rng());
    const start = Math.floor(rng() * (route.length - 12));
    const duration = 2 + Math.floor(rng() * (wet ? 17 : 42));
    ctx.strokeStyle = `rgba(0, 0, 0, ${lerp(wet ? 0.035 : 0.15, wet ? 0.23 : 0.88, rng())})`;
    ctx.lineWidth = lerp(0.35, wet ? 1.0 : 2.0, rng()) * width / 1500;
    ctx.beginPath();
    for (let j = start; j < Math.min(route.length, start + duration); j += 1) {
      const p = route[j];
      const offset = across * broadness * pressure(p.t) + Math.sin(j * 0.45 + i) * 1.05;
      const x = p.x + p.nx * offset;
      const y = p.y + p.ny * offset;
      if (j === start) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';

  // Uneven deposits interrupt the long hair channels. These are little dragged
  // pieces of pigment, kept inside the pressure field rather than sprayed out.
  for (let i = 0; i < 280; i += 1) {
    const p = route[Math.floor(rng() * (route.length - 1))];
    const offset = (rng() - 0.5) * broadness * pressure(p.t) * 1.6;
    const x = p.x + p.nx * offset;
    const y = p.y + p.ny * offset;
    const length = lerp(1, 13, rng());
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + p.tx * length, y + p.ty * length);
    ctx.lineWidth = lerp(0.6, 3.1, rng());
    ctx.strokeStyle = `rgba(${INK}, ${lerp(0.35, 0.91, rng())})`;
    ctx.stroke();
  }

  // Pigment granulation is baked into the alpha channel. Short clusters of
  // missing pigment prevent the brush from reading as parallel smooth cords.
  const pixels = ctx.getImageData(0, 0, width, height);
  const data = pixels.data;
  const first = route[0];
  const last = route[route.length - 1];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const grain = rng();
    if (grain < (wet ? 0.010 : 0.036)) data[i + 3] *= wet ? 0.64 : 0.13;
    else data[i + 3] *= lerp(wet ? 0.95 : 0.87, 1, grain);
    const x = (i / 4) % width;
    const y = Math.floor(i / 4 / width);
    const startDistance = (x - first.x) * first.tx + (y - first.y) * first.ty;
    const endDistance = (last.x - x) * last.tx + (last.y - y) * last.ty;
    if (startDistance < 38) {
      const across = (x - first.x) * first.nx + (y - first.y) * first.ny;
      const dryMargin = 9 + Math.sin(across * 0.087) * 9 + Math.sin(across * 0.67) * 11 + Math.sin(across * 2.17) * 5;
      data[i + 3] *= clamp((startDistance - dryMargin + 4) / 4);
    }
    if (endDistance < 34) {
      const across = (x - last.x) * last.nx + (y - last.y) * last.ny;
      const dryMargin = 8 + Math.sin(across * 0.15) * 8 + Math.sin(across * 0.83) * 10 + Math.sin(across * 2.03) * 4;
      data[i + 3] *= clamp((endDistance - dryMargin + 4) / 4);
    }
  }
  ctx.putImageData(pixels, 0, 0);

  // Short broken outriders soften the perimeter without adding particle noise.
  ctx.lineCap = 'butt';
  for (let i = 0; i < 95; i += 1) {
    const t = rng();
    const p = route[Math.floor(t * (route.length - 1))];
    const side = rng() < 0.5 ? -1 : 1;
    const offset = broadness * pressure(t) * lerp(0.95, 1.14, rng()) * side;
    const length = lerp(1.5, 12, rng());
    const x = p.x + p.nx * offset;
    const y = p.y + p.ny * offset;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + p.tx * length, y + p.ty * length);
    ctx.strokeStyle = `rgba(${INK}, ${lerp(0.12, 0.52, rng())})`;
    ctx.lineWidth = lerp(0.4, 1.7, rng());
    ctx.stroke();
  }
  return canvas;
}

export class MaterialEngine {
  constructor(canvas, { assets = {}, reducedMotion = false } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!this.ctx) throw new Error('INKSCAPE requires a Canvas 2D context.');
    this.assets = assets;
    this.reducedMotion = Boolean(reducedMotion);
    this.width = 1;
    this.height = 1;
    this.dpr = 1;
    this.mobile = false;
    this.time = 0;
    this.drops = [];
    this.destroyed = false;
    this.waterEdges = [makeWaterEdge(32891), makeWaterEdge(45119), makeWaterEdge(61003)];
    this.capillaries = makeCapillaries(87301);
    this.fibers = makeFibers(71938);
    this.brushDry = makeBrushTexture({ width: 1500, height: 940, wet: false });
    this.brushWet = makeBrushTexture({ width: 1500, height: 940, wet: true });
    this.mark = makeBrushTexture({ width: 640, height: 920, wet: false, mark: true });
    this.photoBrushSource = null;
    this.photoBrushDry = null;
    this.photoBrushWet = null;
    this.photoGestureSource = null;
    this.photoGesture = null;
    this.stainSeed = random(90871);
    this.river = sampleCurve([
      { x: -0.025, y: 0.69 },
      { x: 0.20, y: 1.02 },
      { x: 0.26, y: 0.67 },
      { x: 0.55, y: 0.66 },
    ], 136);
    this.resize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight, window.devicePixelRatio || 1);
  }

  resize(width, height, dpr = window.devicePixelRatio || 1) {
    if (this.destroyed) return;
    this.width = Math.max(1, Number(width) || this.canvas.clientWidth || 1);
    this.height = Math.max(1, Number(height) || this.canvas.clientHeight || 1);
    // Maximum 3.8 MP: 4K still has detailed material without an 8–32 MP fill.
    this.dpr = Math.min(1.6, Math.max(1, Number(dpr) || 1), Math.sqrt(3_800_000 / (this.width * this.height)));
    this.canvas.width = Math.max(1, Math.round(this.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(this.height * this.dpr));
    this.mobile = this.width < 700 || this.width / this.height < 0.86;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  /** x and y use the same normalized viewport coordinates as pointer. */
  addDrop(x, y) {
    if (this.destroyed || !Number.isFinite(x) || !Number.isFinite(y)) return;
    this.drops.push({ x: clamp(x), y: clamp(y), start: this.time, seed: this.stainSeed(), edge: this.drops.length % this.waterEdges.length });
    if (this.drops.length > 5) this.drops.shift();
  }

  render({ scene = 0, local, time = 0, pointer = null, wetness = 0.42 } = {}) {
    if (this.destroyed) return;
    const position = clamp(Number(scene) || 0, 0, 7.999999);
    const index = Math.min(7, Math.floor(position));
    const progress = clamp(Number.isFinite(local) ? local : position - index);
    this.time = Number.isFinite(time) ? time : 0;
    const life = this.reducedMotion ? 0 : this.time;
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, this.width, this.height);
    const handoff = index < 7 ? smooth(0.72, 1, progress) : 0;
    const state = { time: life, pointer, wetness: clamp(wetness) };
    this.drawScene(index, progress, 1 - handoff, state);
    if (handoff > 0) this.drawScene(index + 1, 0, handoff, state);
    this.drawDrops(life);
  }

  drawScene(scene, progress, alpha, state) {
    if (alpha < 0.001) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    switch (scene) {
      case 0: this.drawWater(progress, state); break;
      case 1: this.drawInk(progress, state); break;
      case 2: this.drawPaper(progress, state); break;
      case 3: this.drawTrace(progress, state); break;
      case 4: this.drawFibers(progress, state); break;
      case 5: this.drawSpace(progress, state); break;
      case 6: this.drawMark(progress, state); break;
      default: this.drawFinale(progress, state); break;
    }
    ctx.restore();
  }

  waterPath(cx, cy, rx, ry, edge, breathing = 0, rotation = -0.16) {
    const ctx = this.ctx;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    ctx.beginPath();
    for (let i = 0; i < edge.length; i += 1) {
      const point = edge[i];
      const drift = 1 + Math.sin(point.phase + breathing) * 0.002;
      const x = point.x * rx * drift;
      const y = point.y * ry * drift;
      const px = cx + x * cos - y * sin;
      const py = cy + x * sin + y * cos;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  drawWater(progress, { time, pointer }) {
    const { ctx, width: w, height: h, mobile } = this;
    const growth = 0.76 + smooth(0, 0.22, progress) * 0.24 + smooth(0.22, 0.72, progress) * 0.018;
    const size = Math.min(w * (mobile ? 0.52 : 0.31), h * (mobile ? 0.31 : 0.53));
    const cx = w * (mobile ? 0.69 : 0.74);
    const cy = h * (mobile ? 0.66 : 0.52);
    const px = pointer && Number.isFinite(pointer.x) ? (pointer.x - 0.5) * 2 : 0;
    const py = pointer && Number.isFinite(pointer.y) ? (pointer.y - 0.5) * 2 : 0;
    for (let i = 0; i < 3; i += 1) {
      const scale = growth * (1 + i * 0.105);
      this.waterPath(cx + i * 2 + px, cy + i * 4 + py, size * scale, size * 0.82 * scale, this.waterEdges[i], time * 0.12);
      ctx.fillStyle = `rgba(${WATER}, ${i === 0 ? 0.009 : 0.004})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${WATER}, ${i === 0 ? 0.15 : 0.075})`;
      ctx.lineWidth = i === 0 ? 0.72 : 0.45;
      ctx.stroke();
    }
    // A small imperfect wet seam travels towards the margin, connecting water
    // to the first capillary river without turning the hero into a diagram.
    ctx.strokeStyle = `rgba(${WATER}, 0.095)`;
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    const seam = smooth(0.17, 0.77, progress);
    const count = Math.floor(48 + seam * 45);
    for (let i = 0; i < count; i += 1) {
      const t = i / 92;
      const x = cx - size * (0.78 + t * 0.76);
      const y = cy + size * (0.60 + Math.sin(t * 6) * 0.10 + t * 0.23);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  drawInk(progress, { time }) {
    const { ctx, width: w, height: h, mobile } = this;
    const reveal = 0.57 + smooth(0, 0.22, progress) * 0.38 + smooth(0.22, 0.72, progress) * 0.05;
    const cx = w * (mobile ? 0.72 : 0.73);
    const cy = h * (mobile ? 0.69 : 0.53);
    const size = Math.min(w * (mobile ? 1.18 : 0.85), h * (mobile ? 0.83 : 1.50));
    for (const branch of this.capillaries) {
      const length = clamp((reveal - branch.birth) / 0.52);
      if (length < 0.02) continue;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(size, size * 0.94);
      const settling = 1 + Math.sin(time * 0.1 + branch.birth * 16) * 0.035;
      ctx.strokeStyle = `rgba(${INK}, ${branch.tone * settling * (mobile ? 0.7 : 0.92)})`;
      ctx.lineWidth = branch.width / size;
      ctx.lineCap = 'round';
      if (tracePath(ctx, branch.points, branch.points.length * length)) ctx.stroke();
      ctx.restore();
    }
    this.drawRiver(reveal, mobile ? 0.57 : 0.82, mobile ? 0.12 : 0, 1);
  }

  drawRiver(reveal, alpha, verticalOffset = 0, size = 1) {
    const { ctx, width: w, height: h } = this;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'butt';
    for (let strand = 0; strand < 19; strand += 1) {
      const across = (strand - 9) / 9;
      const tone = strand % 4 === 0 ? 0.63 : 0.23;
      ctx.strokeStyle = `rgba(${INK}, ${tone})`;
      ctx.lineWidth = (strand % 4 === 0 ? 1.2 : 0.64) * size;
      ctx.beginPath();
      const count = Math.floor(this.river.length * reveal);
      for (let i = 0; i < count; i += 1) {
        const point = this.river[i];
        const pressure = (0.30 + Math.sin(point.t * 10) ** 2 * 0.78) * 9.5 * size;
        const jagged = Math.sin(point.t * 103 + strand * 0.22) * 1.5 + Math.sin(point.t * 227) * 0.7;
        const x = point.x * w + point.nx * (across * pressure + jagged);
        const y = (point.y + verticalOffset) * h + point.ny * (across * pressure + jagged);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  drawPaper(progress, { time }) {
    const { ctx, width: w, height: h, mobile } = this;
    const emerge = 0.55 + smooth(0, 0.2, progress) * 0.45;
    const cx = w * (mobile ? 0.38 : 0.68);
    const cy = h * (mobile ? 0.77 : 0.67);
    const size = Math.min(w * 0.35, h * 0.36);
    this.waterPath(cx, cy, size * emerge, size * 0.28, this.waterEdges[1], time * 0.08, 0.10);
    ctx.strokeStyle = `rgba(${WATER}, 0.075)`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    // Fibrous contact marks collect beside the paper's lower edge. The actual
    // planes, fold light and imagery stay in the DOM above this quiet ground.
    ctx.strokeStyle = `rgba(${INK}, 0.08)`;
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 22; i += 1) {
      const p = i / 21;
      const x = w * (0.42 + p * 0.44);
      const y = h * (0.83 - p * 0.06) + Math.sin(i * 3.7) * 6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 5, y + 1, x + 16, y - 4, x + 20 + Math.sin(i) * 8, y - 2);
      ctx.stroke();
    }
  }

  brushClip(progress, x, y, width, height, normalizedCurve = TRACE_CURVE) {
    const ctx = this.ctx;
    if (progress >= 0.999) return;
    const route = sampleCurve(normalizedCurve.map((point) => ({ x: x + point.x * width, y: y + point.y * height })), 80);
    // Interpolate the sampled path: slow scroll must not jump between the
    // eighty reference points. The brush front is a shallow, fibrous nib,
    // rather than a straight wipe across the photographed pigment.
    const cursor = clamp(progress) * 80;
    const before = route[Math.floor(cursor)];
    const after = route[Math.min(80, Math.floor(cursor) + 1)];
    const fraction = cursor % 1;
    const point = {
      x: lerp(before.x, after.x, fraction), y: lerp(before.y, after.y, fraction),
      tx: lerp(before.tx, after.tx, fraction), ty: lerp(before.ty, after.ty, fraction),
      nx: lerp(before.nx, after.nx, fraction), ny: lerp(before.ny, after.ny, fraction),
    };
    const reach = Math.max(width, height) * 2;
    const breadth = Math.min(width, height);
    const nibRadius = breadth * 0.32;
    const nibDepth = breadth * 0.085 * (1 - smooth(0.90, 1, progress));
    const samples = Math.min(4096, Math.ceil(reach * 2 / 2));
    ctx.beginPath();
    ctx.moveTo(point.x - point.tx * reach - point.nx * reach, point.y - point.ty * reach - point.ny * reach);
    for (let i = 0; i <= samples; i += 1) {
      const across = lerp(-reach, reach, i / samples);
      const shoulder = Math.min(3, Math.abs(across) / nibRadius);
      const fibers = Math.sin(across * 0.43) + Math.sin(across * 1.19) * 0.52 + Math.sin(across * 2.73) * 0.22;
      const ragged = fibers * breadth * 0.002 - shoulder * shoulder * nibDepth;
      ctx.lineTo(point.x + point.nx * across + point.tx * ragged, point.y + point.ny * across + point.ty * ragged);
    }
    ctx.lineTo(point.x - point.tx * reach + point.nx * reach, point.y - point.ty * reach + point.ny * reach);
    ctx.closePath();
    ctx.clip();
  }

  prepareBrushAsset(photo) {
    if (photo === this.photoBrushSource) return;
    const width = 1500;
    const height = 940;
    const dry = surface(width, height);
    const dryContext = dry.getContext('2d');
    dryContext.drawImage(photo, 0, 0, width, height);
    // The photographed pressure silhouette remains intact. Generated strands
    // are clipped into its pigment instead of making a second ghost gesture.
    dryContext.globalCompositeOperation = 'source-atop';
    dryContext.globalAlpha = 0.14;
    dryContext.drawImage(this.brushDry, 0, 0, width, height);
    const wet = surface(width, height);
    const wetContext = wet.getContext('2d');
    wetContext.drawImage(photo, 0, 0, width, height);
    const pixels = wetContext.getImageData(0, 0, width, height);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const alpha = pixels.data[i + 3] / 255;
      if (alpha === 0) continue;
      pixels.data[i] = 23;
      pixels.data[i + 1] = 24;
      pixels.data[i + 2] = 21;
      pixels.data[i + 3] = Math.round(Math.pow(alpha, 0.63) * 255);
    }
    wetContext.putImageData(pixels, 0, 0);
    wetContext.globalCompositeOperation = 'source-atop';
    wetContext.globalAlpha = 0.22;
    wetContext.drawImage(this.brushWet, 0, 0, width, height);
    this.photoBrushSource = photo;
    this.photoBrushDry = dry;
    this.photoBrushWet = wet;
  }

  prepareGestureAsset(photo) {
    if (photo === this.photoGestureSource) return;
    const height = 1200;
    const width = Math.round(height * photo.naturalWidth / photo.naturalHeight);
    const gesture = surface(width, height);
    const context = gesture.getContext('2d');
    context.drawImage(photo, 0, 0, width, height);
    context.globalCompositeOperation = 'source-atop';
    context.globalAlpha = 0.10;
    context.drawImage(this.mark, 0, 0, width, height);
    this.photoGestureSource = photo;
    this.photoGesture = gesture;
  }

  drawTrace(progress, { time, wetness }) {
    const { ctx, width: w, height: h, mobile } = this;
    const reveal = 0.23 + smooth(0, 0.22, progress) * 0.77;
    // Portrait composition is redrawn into a lower, taller field rather than
    // scaling desktop text and art together.
    const area = mobile
      ? { x: -w * 0.23, y: h * 0.26, width: w * 1.40, height: h * 0.63 }
      : { x: 0, y: 0, width: w, height: h };
    ctx.save();
    this.brushClip(reveal, area.x, area.y, area.width, area.height);
    const inheritedAlpha = ctx.globalAlpha;
    const photo = this.assets.brush;
    const hasPhoto = photo && photo.complete && photo.naturalWidth > 0;
    // The original gives the mark its exceptional microscopic detail; custom
    // pressure strands, deposition, wet saturation and reveal remain authored.
    if (hasPhoto) {
      this.prepareBrushAsset(photo);
      ctx.globalAlpha = inheritedAlpha;
      ctx.drawImage(this.photoBrushDry, area.x, area.y, area.width, area.height);
      ctx.globalAlpha = inheritedAlpha * wetness * 0.78;
      ctx.drawImage(this.photoBrushWet, area.x, area.y, area.width, area.height);
    } else {
      ctx.globalAlpha = inheritedAlpha * (1 - wetness);
      ctx.drawImage(this.brushDry, area.x, area.y, area.width, area.height);
      ctx.globalAlpha = inheritedAlpha * wetness;
      ctx.drawImage(this.brushWet, area.x, area.y, area.width, area.height);
    }
    ctx.globalAlpha = inheritedAlpha;
    // Wet margins collect gently without displacing the finished gesture.
    if (wetness > 0.03) {
      const samples = sampleCurve(TRACE_CURVE.map((point) => ({ x: area.x + point.x * area.width, y: area.y + point.y * area.height })), 94);
      for (let edge = -1; edge <= 1; edge += 2) {
        ctx.beginPath();
        for (let i = 0; i < samples.length; i += 1) {
          const point = samples[i];
          const pressure = 0.65 + Math.sin(point.t * Math.PI) * 0.30 + Math.sin(point.t * 8.3) * 0.075;
          const offset = area.height * 0.112 * pressure * edge;
          const breathing = Math.sin(time * 0.12 + i * 0.51) * 0.38;
          const x = point.x + point.nx * (offset + breathing);
          const y = point.y + point.ny * (offset + breathing);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${INK}, ${wetness * (hasPhoto ? 0.033 : 0.11)})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawFibers(progress, { time, pointer }) {
    const { ctx, width: w, height: h, mobile } = this;
    const cx = w * (mobile ? 0.49 : 0.30);
    const cy = h * (mobile ? 0.67 : 0.52);
    const base = Math.min(w * (mobile ? 0.9 : 0.60), h * (mobile ? 0.57 : 0.91));
    const scale = base * (1 + smooth(0.20, 0.72, progress) * 0.055);
    const pointerX = pointer && Number.isFinite(pointer.x) ? pointer.x * w : -10000;
    const pointerY = pointer && Number.isFinite(pointer.y) ? pointer.y * h : -10000;
    const lensRadius = Math.min(w * 0.14, h * 0.21);
    const reveal = 0.62 + smooth(0, 0.20, progress) * 0.38;
    const count = mobile ? 91 : this.fibers.length;
    ctx.save();
    // Keep the network inside the material lens. Its fine curved strands must
    // never cross the right-hand typography or read as a cracked glass overlay.
    const lensDiameter = mobile ? w * 1.15 : Math.min(w * 0.61, h * 1.35);
    const lensX = mobile ? w * 0.345 : -w * 0.01 + lensDiameter / 2;
    const lensY = mobile ? h * 0.63 + lensDiameter * 0.15 : h * 0.5;
    ctx.beginPath();
    ctx.arc(lensX, lensY, lensDiameter * 0.43, 0, TAU);
    ctx.clip();
    if (mobile) {
      ctx.beginPath();
      ctx.rect(0, h * 0.40, w, h * 0.60);
      ctx.clip();
    }
    for (let index = 0; index < count; index += 1) {
      const fiber = this.fibers[index];
      if (fiber.birth > reveal) continue;
      const alpha = smooth(fiber.birth - 0.12, fiber.birth + 0.03, reveal);
      const points = [];
      let near = 0;
      for (let j = 0; j < fiber.points.length; j += 1) {
        const source = fiber.points[j];
        let x = cx + source.x * scale;
        let y = cy + source.y * scale;
        const drift = Math.sin(time * 0.10 + fiber.phase + j * 0.18) * 0.36;
        y += drift;
        const dx = x - pointerX;
        const dy = y - pointerY;
        const amount = (1 - smooth(lensRadius * 0.16, lensRadius, Math.hypot(dx, dy))) * 0.23;
        x += dx * amount;
        y += dy * amount;
        near = Math.max(near, amount);
        points.push({ x, y });
      }
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = fiber.width * (mobile ? 0.8 : 1) * (1 + near * 1.9);
      ctx.strokeStyle = fiber.dark
        ? `rgba(${INK}, ${fiber.tone * 0.16 * alpha})`
        : `rgba(113, 103, 77, ${fiber.tone * 0.22 * alpha})`;
      if (tracePath(ctx, points)) ctx.stroke();
      // The narrow light side of each cellulose fiber gives it relief.
      if (!fiber.dark && index % 2 === 0) {
        ctx.translate(-0.45, -0.45);
        ctx.lineWidth = fiber.width * 0.38;
        ctx.strokeStyle = `rgba(255, 254, 239, ${alpha * 0.35})`;
        if (tracePath(ctx, points)) ctx.stroke();
        ctx.translate(0.45, 0.45);
      }
    }
    ctx.restore();
  }

  drawSpace(progress, { time }) {
    const { ctx, width: w, height: h, mobile } = this;
    const lift = smooth(0, 0.2, progress);
    const breathe = Math.sin(time * 0.12) * 0.7;
    ctx.lineCap = 'round';
    // Few horizon-like wash deposits give the hovering planes somewhere to
    // cast their attention. They intentionally leave most of the surface bare.
    for (let i = 0; i < 8; i += 1) {
      ctx.beginPath();
      const span = mobile ? w * 0.73 : w * 0.38;
      for (let j = 0; j <= 90; j += 1) {
        const t = j / 90;
        const x = w * (mobile ? 0.07 : 0.46) + span * t;
        const y = h * (mobile ? 0.85 : 0.82) + Math.sin(t * 4.5) * h * 0.024
          - t * h * 0.027 + Math.sin(t * 53 + i * 0.5) * 0.64 + i * 0.53 + breathe;
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${INK}, ${(i % 3 === 0 ? 0.15 : 0.047) * (0.7 + lift * 0.3)})`;
      ctx.lineWidth = i % 3 === 0 ? 0.7 : 0.45;
      ctx.stroke();
    }
    const cx = w * (mobile ? 0.49 : 0.65);
    this.waterPath(cx, h * 0.81, w * (mobile ? 0.28 : 0.21), h * 0.04, this.waterEdges[2], time * 0.07, -0.025);
    ctx.strokeStyle = `rgba(${WATER}, 0.053)`;
    ctx.lineWidth = 0.44;
    ctx.stroke();
  }

  drawMark(progress, { time }) {
    const { ctx, width: w, height: h, mobile } = this;
    const photo = this.assets.gesture;
    const hasPhoto = photo && photo.complete && photo.naturalWidth > 0;
    if (hasPhoto) this.prepareGestureAsset(photo);
    const texture = hasPhoto ? this.photoGesture : this.mark;
    const reveal = 0.29 + smooth(0, 0.22, progress) * 0.71;
    ctx.save();
    ctx.globalAlpha *= hasPhoto ? 0.98 : 0.95;
    const artHeight = h * (mobile ? 0.43 : 0.84);
    const artWidth = artHeight * texture.width / texture.height;
    const x = mobile ? w * 0.30 - artWidth * 0.5 : w * 0.30 - artWidth * 0.5;
    const y = h * (mobile ? 0.46 : 0.075);
    this.brushClip(reveal, x, y, artWidth, artHeight, MARK_CURVE);
    ctx.drawImage(texture, x, y, artWidth, artHeight);
    ctx.restore();
    // The seal's pigment edge is compact. The DOM owns the actual impression.
    const sx = w * (mobile ? 0.72 : 0.67);
    const sy = h * (mobile ? 0.76 : 0.69);
    const amount = smooth(0.02, 0.24, progress);
    if (amount > 0) {
      ctx.save();
      ctx.globalAlpha *= amount;
      ctx.strokeStyle = 'rgba(145, 48, 34, 0.24)';
      ctx.lineWidth = 0.65;
      for (let i = 0; i < 13; i += 1) {
        const angle = i * 2.399;
        const distance = 22 + (i % 4) * 3;
        const x = sx + Math.cos(angle) * distance;
        const y = sy + Math.sin(angle) * distance;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * (0.9 + i % 3), y + Math.sin(angle) * (0.9 + i % 3));
        ctx.stroke();
      }
      ctx.restore();
    }
    void time;
  }

  drawFinale(progress, { time }) {
    const { ctx, width: w, height: h, mobile } = this;
    const settle = 0.69 + smooth(0, 0.2, progress) * 0.31;
    const photo = this.assets.brush;
    const hasPhoto = photo && photo.complete && photo.naturalWidth > 0;
    if (hasPhoto) this.prepareBrushAsset(photo);
    const texture = hasPhoto ? this.photoBrushDry : this.brushDry;
    const area = mobile
      ? { x: -w * 0.27, y: h * 0.73, width: w * 1.39, height: h * 0.33 }
      : { x: -w * 0.12, y: h * 0.65, width: w * 1.02, height: h * 0.43 };
    const pivotX = area.x + area.width * 0.5;
    const pivotY = area.y + area.height * 0.5;
    ctx.save();
    ctx.globalAlpha *= 0.94 * settle;
    ctx.translate(pivotX, pivotY);
    ctx.rotate(0.045);
    ctx.translate(-pivotX, -pivotY);
    this.brushClip(0.42 + smooth(0, 0.22, progress) * 0.58, area.x, area.y, area.width, area.height);
    ctx.drawImage(texture, area.x, area.y, area.width, area.height);
    ctx.restore();
    // Retained edges sit below the central leave-taking, joining the parent's
    // lower-left ink bloom to the final diagonal gesture.
    const cx = w * (mobile ? 0.52 : 0.68);
    const cy = h * (mobile ? 0.85 : 0.80);
    const spread = Math.min(w * 0.22, h * 0.23);
    this.waterPath(cx, cy, spread * (1 + progress * 0.04), spread * 0.22, this.waterEdges[0], time * 0.08, -0.11);
    ctx.strokeStyle = `rgba(${WATER}, 0.075)`;
    ctx.lineWidth = 0.55;
    ctx.stroke();
    this.drawRiver(0.72, 0.14, mobile ? 0.14 : 0.16, 0.56);
  }

  drawDrops(time) {
    if (!this.drops.length) return;
    const { ctx, width: w, height: h } = this;
    // Interaction marks expire; there is no accumulating particle simulation.
    this.drops = this.drops.filter((drop) => this.time - drop.start < 5.0);
    for (const drop of this.drops) {
      const age = Math.max(0, this.time - drop.start);
      const growth = this.reducedMotion ? 1 : smooth(0, 2.5, age);
      const fade = 1 - smooth(2.7, 5.0, age);
      const radius = lerp(9, 28 + drop.seed * 25, growth);
      const x = drop.x * w;
      const y = drop.y * h;
      ctx.save();
      ctx.globalAlpha = fade;
      this.waterPath(x, y, radius * 1.14, radius * 0.74, this.waterEdges[drop.edge], time * 0.08, drop.seed - 0.5);
      ctx.fillStyle = `rgba(${WATER}, 0.018)`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${WATER}, 0.20)`;
      ctx.lineWidth = 0.56;
      ctx.stroke();
      ctx.restore();
    }
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.drops.length = 0;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const texture of [this.brushDry, this.brushWet, this.mark, this.photoBrushDry, this.photoBrushWet, this.photoGesture]) {
      if (!texture) continue;
      texture.width = 1;
      texture.height = 1;
    }
    this.assets = {};
  }
}

export default MaterialEngine;
