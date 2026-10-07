/**
 * NIB — the material changes; the line does not.
 *
 * Contact, absorption, writing and drying all read the same reversible world
 * geometry. The owner supplies its GSAP clock and the root Canvas transform.
 * This module never clears that Canvas, schedules work or listens for events.
 */

const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const mix = (a, b, t) => a + (b - a) * t;
const mixColor = (a, b, t) => `rgb(${a.map((value, i) => Math.round(mix(value, b[i], t))).join(',')})`;
const smooth = (a, b, n) => {
  const t = clamp((n - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function randomSequence(seed) {
  let n = seed >>> 0;
  return () => {
    n += 0x6d2b79f5;
    let t = n;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

function drawCurve(ctx, p0, p1, p2, p3) {
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
}

export class PaperScenes {
  constructor() {
    this.w = 0;
    this.h = 0;
    this.mobile = false;
    this.dpr = 1;
    this.fiberLayer = null;
    this.branches = [];
    this.tooth = [];
    this.glints = [];
    this.facets = [];
    this._points = [];
    this.nibSource = null;
    this.nibPlate = null;
    this.fiberSource = null;
    this.fiberPhoto = null;
    this.fiberInk = null;
    this.fiberStain = null;
    this.fiberMap = null;
    this.fiberRidges = null;
  }

  /** Call after image decode, before releasing the host's readiness state. */
  prepare(images = {}) {
    const nib = images.nibProfile;
    if (nib && (nib.naturalWidth || nib.width)) this._prepareNib(nib);
    if (images.fiber && (images.fiber.naturalWidth || images.fiber.width) && images.fiber !== this.fiberSource) {
      this.fiberSource = images.fiber;
      if (this.w && this.h) this._makeFiberMaterial();
    }
    return this;
  }

  dispose() {
    for (const name of ['fiberLayer', 'nibPlate', 'fiberPhoto', 'fiberInk', 'fiberStain', 'fiberRidges']) {
      const layer = this[name];
      if (typeof layer?.close === 'function') layer.close();
      else if (layer) layer.width = layer.height = 0;
      this[name] = null;
    }
    this.nibSource = this.fiberSource = this.fiberMap = null;
    this.branches.length = this.tooth.length = this.glints.length = this.facets.length = this._points.length = 0;
  }

  resize(w, h, mobile = false, dpr = 1) {
    w = Math.max(1, w);
    h = Math.max(1, h);
    const ratio = clamp(dpr || 1, 1, 1.75);
    if (this.w === w && this.h === h && this.mobile === mobile && this.dpr === ratio) return;
    this.w = w;
    this.h = h;
    this.mobile = mobile;
    this.dpr = ratio;
    this.unit = Math.max(0.7, Math.min(w / 1672, h / 941));
    this.baseWidth = mobile ? Math.max(1.55, w * 0.004) : Math.max(2.15, Math.min(w, h) * 0.0034);

    const random = randomSequence(0x4e494231);
    this.branches = Array.from({ length: mobile ? 210 : 470 }, (_, i) => ({
      t: (i + random() * 0.7) / (mobile ? 210 : 470),
      side: random() < 0.5 ? -1 : 1,
      length: 0.12 + random() ** 1.65 * 0.97,
      lean: (random() - 0.5) * 1.18,
      curl: (random() - 0.5) * 0.95,
      width: 0.17 + random() * 0.34,
      fork: random() > 0.62,
      delay: random(),
      alpha: 0.21 + random() * 0.43,
    }));
    this.tooth = Array.from({ length: mobile ? 125 : 320 }, () => ({
      t: random(),
      across: (random() - 0.5) * 1.52,
      length: 0.16 + random() * 0.66,
      slant: random() - 0.5,
      alpha: 0.07 + random() * 0.14,
    }));
    this.glints = Array.from({ length: mobile ? 32 : 77 }, () => ({
      t: random(),
      length: 0.0018 + random() ** 2 * 0.015,
      side: -0.16 - random() * 0.5,
      alpha: 0.22 + random() * 0.62,
      phase: random() * 6.28318,
    }));
    this.facets = Array.from({ length: mobile ? 230 : 540 }, () => ({
      t: random(),
      length: 0.00022 + random() ** 2 * 0.0020,
      across: -0.4 + random() * 0.68,
      width: 0.03 + random() ** 2 * 0.071,
      alpha: 0.12 + random() ** 2 * 0.7,
    }));
    this._makeFiberLayer();
    if (this.fiberSource) this._makeFiberMaterial();
  }

  _ensure(s) {
    if (this.w !== s.w || this.h !== s.h || this.mobile !== Boolean(s.mobile)) {
      this.resize(s.w, s.h, Boolean(s.mobile), this.dpr);
    }
  }

  _q(s, chapter) {
    return Number.isFinite(s.q) ? s.q : chapter + (Number.isFinite(s.local) ? s.local : 0.5);
  }

  /** A single slight curve in paper coordinates, shared by all four scenes. */
  _point(t) {
    const { w, h, mobile } = this;
    const y = mobile ? 0.656 : 0.650;
    const p0 = { x: w * 0.16, y: h * (y + 0.014) };
    const p1 = { x: w * 0.335, y: h * (y - 0.052) };
    const p2 = { x: w * 0.592, y: h * (y + 0.036) };
    const p3 = { x: w * 0.82, y: h * (y - 0.048) };
    const a = 1 - t;
    const dx = 3 * a * a * (p1.x - p0.x) + 6 * a * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
    const dy = 3 * a * a * (p1.y - p0.y) + 6 * a * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);
    const length = Math.hypot(dx, dy) || 1;
    return {
      x: a ** 3 * p0.x + 3 * a * a * t * p1.x + 3 * a * t * t * p2.x + t ** 3 * p3.x,
      y: a ** 3 * p0.y + 3 * a * a * t * p1.y + 3 * a * t * t * p2.y + t ** 3 * p3.y,
      tx: dx / length,
      ty: dy / length,
      nx: -dy / length,
      ny: dx / length,
    };
  }

  _camera(q) {
    const enter = smooth(6.65, 7.17, q);
    const leave = smooth(7.65, 8.15, q);
    const closeScale = this.mobile ? 7.1 : 7.2;
    const scale = mix(mix(1.55, closeScale, enter), 1, leave);
    const anchor = this._point(0.135);
    const targetX = mix(this.w * (this.mobile ? 0.55 : 0.595), this.w * 0.48, enter);
    const targetY = this.h * (this.mobile ? 0.658 : 0.658);
    return {
      scale,
      x: mix(targetX - anchor.x * scale, 0, leave),
      y: mix(targetY - anchor.y * scale, 0, leave),
      macro: enter * (1 - leave),
    };
  }

  _mappedPoint(t, camera) {
    const p = this._point(t);
    p.x = p.x * camera.scale + camera.x;
    p.y = p.y * camera.scale + camera.y;
    return p;
  }

  _drawn(q) {
    const firstMark = 0.285 * smooth(6.315, 6.84, q);
    return mix(firstMark, 1, smooth(8.07, 8.94, q));
  }

  _width(t, camera, end = 1) {
    const pressure = 0.72 + Math.sin(Math.PI * t) * 0.28 + Math.sin(t * 8.8) * 0.06;
    const start = 0.11 + 0.89 * smooth(0, 0.034, t);
    const finish = 1 - smooth(0.951, 1, t) * 0.90;
    const irregularity = 1 + Math.sin(t * 121.4) * 0.034 + Math.sin(t * 327.8) * 0.017
      + camera.macro * (Math.sin(t * 1893) * 0.045 + Math.sin(t * 2719) * 0.026);
    const head = end < 0.995 ? 1 + 0.21 * smooth(end - 0.013, end, t) : 1;
    return this.baseWidth * camera.scale * pressure * start * finish * irregularity * head;
  }

  /** Geometry can also be inspected by the host's visual acceptance harness. */
  geometry(s, chapter = 8) {
    this._ensure(s);
    const q = this._q(s, chapter);
    const camera = this._camera(q);
    const end = this._drawn(q);
    const point = this._mappedPoint(end, camera);
    const lift = (1 - smooth(5.94, 6.315, q)) * this.h * 0.13 + smooth(9.02, 9.42, q) * this.h * 0.19;
    return { q, camera, end, point, tip: { x: point.x, y: point.y - lift }, lift };
  }

  _makeFiberLayer() {
    const { w, h, mobile, unit } = this;
    // One cached relief plate. Its device ratio is bounded independently of
    // monitor resolution; there is no per-frame regeneration of cellulose.
    const ratio = Math.min(this.dpr, 1.35, 2350 / w);
    const canvas = makeCanvas(Math.max(1, Math.ceil(w * ratio)), Math.max(1, Math.ceil(h * ratio)));
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    const random = randomSequence(0x494e4b31);
    const count = mobile ? 350 : Math.min(1400, Math.round(w * h / 1750));
    const lengthUnit = mobile ? 0.75 : Math.max(0.83, unit);
    ctx.lineCap = 'round';

    // Very small depressions establish the gaps before any raised fiber is
    // drawn. The field never becomes a procedural cloud or a noise vignette.
    for (let i = 0; i < count * 0.38; i += 1) {
      const x = random() * w;
      const y = h * (0.37 + random() * 0.66);
      const size = (0.25 + random() * 1.1) * lengthUnit;
      ctx.fillStyle = `rgba(98,87,66,${0.018 + random() * 0.056})`;
      ctx.beginPath();
      ctx.ellipse(x, y, size * 1.8, size * 0.58, random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < count; i += 1) {
      const x = random() * (w + 100) - 50;
      const y = h * (0.35 + random() * 0.69);
      const angle = -0.8 + (random() - 0.5) * 2.2;
      const length = (12 + random() ** 1.5 * 76) * lengthUnit;
      const bend = (random() - 0.5) * length * 0.32;
      const width = (0.27 + random() ** 2.2 * 1.25) * lengthUnit;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      const nx = -dy;
      const ny = dx;
      const p0 = { x, y };
      const p1 = { x: x + dx * length * 0.33 + nx * bend, y: y + dy * length * 0.33 + ny * bend };
      const p2 = { x: x + dx * length * 0.72 - nx * bend * 0.6, y: y + dy * length * 0.72 - ny * bend * 0.6 };
      const p3 = { x: x + dx * length, y: y + dy * length };
      const relief = 0.18 + random() * 0.27;

      ctx.save();
      ctx.translate(width * 0.25, width * 0.88);
      drawCurve(ctx, p0, p1, p2, p3);
      ctx.lineWidth = width * 1.95;
      ctx.strokeStyle = `rgba(104,91,67,${relief * 0.28})`;
      ctx.stroke();
      ctx.restore();

      drawCurve(ctx, p0, p1, p2, p3);
      ctx.lineWidth = width;
      ctx.strokeStyle = `rgba(255,251,238,${relief})`;
      ctx.stroke();

      if (width > 0.86 * lengthUnit) {
        ctx.save();
        ctx.translate(-width * 0.19, -width * 0.22);
        drawCurve(ctx, p0, p1, p2, p3);
        ctx.lineWidth = Math.max(0.18, width * 0.21);
        ctx.strokeStyle = `rgba(255,254,247,${relief * 0.95})`;
        ctx.stroke();
        ctx.restore();
      }
    }

    // Macro detail has a depth-of-field falloff, leaving the upper typography
    // quiet while preserving a stationary paper plane through the handoff.
    ctx.globalCompositeOperation = 'destination-in';
    const mask = ctx.createLinearGradient(0, h * 0.32, 0, h);
    mask.addColorStop(0, 'rgba(0,0,0,0)');
    mask.addColorStop(0.22, 'rgba(0,0,0,0.22)');
    mask.addColorStop(0.43, 'rgba(0,0,0,1)');
    mask.addColorStop(0.72, 'rgba(0,0,0,0.94)');
    mask.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = mask;
    ctx.fillRect(0, 0, w, h);
    if (typeof this.fiberLayer?.close === 'function') this.fiberLayer.close();
    // Resolve the cached drawing now, at resize/readiness time. Otherwise a
    // browser may defer thousands of fiber paths until the first scroll frame
    // that draws this plate, creating an avoidable scene-entry hitch.
    this.fiberLayer = typeof canvas.transferToImageBitmap === 'function' ? canvas.transferToImageBitmap() : canvas;
  }

  _paperDetail(ctx, s, amount) {
    this.prepare(s.images);
    if (amount < 0.002) return;
    ctx.save();
    ctx.globalAlpha *= amount;
    if (this.fiberPhoto) ctx.drawImage(this.fiberPhoto, 0, 0, this.w, this.h);
    if (this.fiberLayer) {
      ctx.globalAlpha *= this.fiberPhoto ? 0.22 : 1;
      ctx.drawImage(this.fiberLayer, 0, 0, this.w, this.h);
    }
    ctx.restore();
  }

  _makeFiberMaterial() {
    const { w, h, fiberSource: image } = this;
    if (!image || !w || !h) return;
    const ratio = Math.min(this.dpr, 1.35, 2350 / w);
    const pw = Math.max(1, Math.ceil(w * ratio));
    const ph = Math.max(1, Math.ceil(h * ratio));
    const photo = makeCanvas(pw, ph);
    const photoCtx = photo.getContext('2d');
    photoCtx.scale(ratio, ratio);
    const iw = image.naturalWidth || image.width;
    const ih = image.naturalHeight || image.height;
    const cover = Math.max(w / iw, h / ih);
    const dw = iw * cover;
    const dh = ih * cover;
    // The mobile crop keeps the physical relief, without squeezing cellulose
    // into vertical stripes. Both the substrate and ink read this same crop.
    const dx = (w - dw) * (this.mobile ? 0.59 : 0.5);
    const dy = (h - dh) * 0.5;
    photoCtx.drawImage(image, dx, dy, dw, dh);

    // The measured brightness of this exact photographic crop gives the
    // narrow stain an interstitial mask. Dye can show in the darker spaces
    // between fibers without turning the entire boundary into a uniform halo.
    const pixels = photoCtx.getImageData(0, 0, pw, ph).data;
    const stain = makeCanvas(pw, ph);
    const stainCtx = stain.getContext('2d');
    const stainPixels = stainCtx.createImageData(pw, ph);
    const luminance = new Uint8Array(pw * ph);
    for (let pixel = 0, index = 0; pixel < pw * ph; pixel += 1, index += 4) {
      const light = (pixels[index] * 54 + pixels[index + 1] * 183 + pixels[index + 2] * 19) / 256;
      luminance[pixel] = light;
      const space = clamp((0.78 - light / 255) * 5.4);
      stainPixels.data[index] = 20;
      stainPixels.data[index + 1] = 53;
      stainPixels.data[index + 2] = 76;
      stainPixels.data[index + 3] = Math.round(space ** 1.9 * 210);
    }
    stainCtx.putImageData(stainPixels, 0, 0);

    // Preserve the actual raised crests as an occluding layer. Brightness
    // alone would reveal broad pale patches; paired, opposite samples isolate
    // narrow fibers that are locally brighter than the spaces on BOTH sides.
    const ridges = makeCanvas(pw, ph);
    const ridgeCtx = ridges.getContext('2d');
    const ridgePixels = ridgeCtx.createImageData(pw, ph);
    const ridgeStrength = new Uint8Array(pw * ph);
    const fine = Math.max(1, Math.round(ratio * 1.3));
    const middle = Math.max(fine + 1, Math.round(ratio * 3.1));
    const broad = Math.max(middle + 1, Math.round(ratio * 5.5));
    const crestAt = (index, radius, light) => Math.max(
      Math.min(light - luminance[index - radius], light - luminance[index + radius]),
      Math.min(light - luminance[index - radius * pw], light - luminance[index + radius * pw]),
      Math.min(light - luminance[index - radius * (pw + 1)], light - luminance[index + radius * (pw + 1)]),
      Math.min(light - luminance[index - radius * (pw - 1)], light - luminance[index + radius * (pw - 1)]),
    );
    for (let py = broad; py < ph - broad; py += 1) {
      for (let px = broad; px < pw - broad; px += 1) {
        const pixel = py * pw + px;
        const index = pixel * 4;
        const light = luminance[pixel];
        const crest = Math.max(
          crestAt(pixel, fine, light),
          crestAt(pixel, middle, light) * 0.88,
          crestAt(pixel, broad, light) * 0.55,
        );
        const height = smooth(5, 29, crest) * smooth(160, 226, light);
        const opacity = Math.round(height ** 1.15 * 246);
        ridgeStrength[pixel] = opacity;
        ridgePixels.data[index] = pixels[index];
        ridgePixels.data[index + 1] = pixels[index + 1];
        ridgePixels.data[index + 2] = pixels[index + 2];
        ridgePixels.data[index + 3] = opacity;
      }
    }
    ridgeCtx.putImageData(ridgePixels, 0, 0);
    this.fiberMap = { data: luminance, ridges: ridgeStrength, width: pw, height: ph, sx: pw / w, sy: ph / h };

    const ink = makeCanvas(pw, ph);
    const inkCtx = ink.getContext('2d');
    inkCtx.drawImage(photo, 0, 0);
    // Dissolved dye leaves the shape of the substrate visible. This is a
    // material tint of the same fiber plate, never a pre-rendered ink stroke.
    inkCtx.globalCompositeOperation = 'multiply';
    inkCtx.fillStyle = '#0a273c';
    inkCtx.fillRect(0, 0, pw, ph);

    photoCtx.globalCompositeOperation = 'destination-in';
    const fade = photoCtx.createLinearGradient(0, 0, 0, h);
    fade.addColorStop(0, 'rgba(0,0,0,0)');
    fade.addColorStop(0.19, 'rgba(0,0,0,0.08)');
    fade.addColorStop(0.36, 'rgba(0,0,0,0.75)');
    fade.addColorStop(0.52, 'rgba(0,0,0,1)');
    fade.addColorStop(0.90, 'rgba(0,0,0,1)');
    fade.addColorStop(1, 'rgba(0,0,0,0.84)');
    photoCtx.fillStyle = fade;
    photoCtx.fillRect(0, 0, w, h);

    if (typeof this.fiberPhoto?.close === 'function') this.fiberPhoto.close();
    if (typeof this.fiberInk?.close === 'function') this.fiberInk.close();
    if (typeof this.fiberStain?.close === 'function') this.fiberStain.close();
    if (typeof this.fiberRidges?.close === 'function') this.fiberRidges.close();
    this.fiberPhoto = typeof photo.transferToImageBitmap === 'function' ? photo.transferToImageBitmap() : photo;
    this.fiberInk = typeof ink.transferToImageBitmap === 'function' ? ink.transferToImageBitmap() : ink;
    this.fiberStain = typeof stain.transferToImageBitmap === 'function' ? stain.transferToImageBitmap() : stain;
    this.fiberRidges = typeof ridges.transferToImageBitmap === 'function' ? ridges.transferToImageBitmap() : ridges;
  }

  _fiberDirection(x, y, tangentX, tangentY) {
    const map = this.fiberMap;
    if (!map || map.width < 5 || map.height < 5) return { x: tangentX, y: tangentY };
    const px = clamp(Math.round(x * map.sx), 2, map.width - 3);
    const py = clamp(Math.round(y * map.sy), 2, map.height - 3);
    const index = py * map.width + px;
    const gx = map.data[index + 2] - map.data[index - 2];
    const gy = map.data[index + map.width * 2] - map.data[index - map.width * 2];
    const length = Math.hypot(gx, gy);
    if (length < 7) return { x: tangentX, y: tangentY };
    let dx = gy / length;
    let dy = -gx / length;
    if (dx * tangentX + dy * tangentY < 0) { dx *= -1; dy *= -1; }
    dx = tangentX * 0.68 + dx * 0.32;
    dy = tangentY * 0.68 + dy * 0.32;
    const combined = Math.hypot(dx, dy) || 1;
    return { x: dx / combined, y: dy / combined };
  }

  _interstitialPath(x, y, normalX, normalY, length, lean) {
    const map = this.fiberMap;
    const points = [{ x, y }];
    if (!map || length < 0.5) return points;
    const steps = clamp(Math.ceil(length / Math.max(0.85, this.unit * 1.45)), 2, 20);
    const distance = length / steps;
    const headingLength = Math.hypot(normalX - normalY * lean, normalY + normalX * lean);
    let headingX = (normalX - normalY * lean) / headingLength;
    let headingY = (normalY + normalX * lean) / headingLength;
    for (let step = 0; step < steps; step += 1) {
      let bestScore = -Infinity;
      let best = null;
      for (const angle of [-0.88, -0.46, 0, 0.46, 0.88]) {
        const cosine = Math.cos(angle);
        const sine = Math.sin(angle);
        const dx = headingX * cosine - headingY * sine;
        const dy = headingX * sine + headingY * cosine;
        const outward = dx * normalX + dy * normalY;
        if (outward < 0.16) continue;
        const nextX = x + dx * distance;
        const nextY = y + dy * distance;
        const px = clamp(Math.round(nextX * map.sx), 0, map.width - 1);
        const py = clamp(Math.round(nextY * map.sy), 0, map.height - 1);
        const index = py * map.width + px;
        const dark = 1 - map.data[index] / 255;
        const raised = map.ridges ? map.ridges[index] / 255 : 0;
        const score = dark * 0.87 - raised * 0.31 + (dx * headingX + dy * headingY) * 0.095 + outward * 0.045;
        if (score > bestScore) {
          bestScore = score;
          best = { x: nextX, y: nextY, dx, dy };
        }
      }
      if (!best) break;
      x = best.x;
      y = best.y;
      headingX = best.dx;
      headingY = best.dy;
      points.push({ x, y });
    }
    return points;
  }

  _paintInterstitialPath(ctx, points) {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length - 1; i += 1) {
      const p = points[i];
      const next = points[i + 1];
      ctx.quadraticCurveTo(p.x, p.y, (p.x + next.x) * 0.5, (p.y + next.y) * 0.5);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }

  _branches(ctx, g) {
    const { q, camera, end } = g;
    if (camera.macro < 0.015 || end < 0.005) return;
    ctx.save();
    ctx.globalAlpha *= camera.macro;
    ctx.lineCap = 'round';
    for (const branch of this.branches) {
      if (branch.t >= end || branch.t < 0.007) continue;
      const growth = smooth(6.94 + branch.delay * 0.37, 7.33 + branch.delay * 0.34, q);
      if (growth < 0.01) continue;
      const p = this._mappedPoint(branch.t, camera);
      const width = this._width(branch.t, camera, end);
      const length = width * branch.length * growth;
      const nx = p.nx * branch.side;
      const ny = p.ny * branch.side;
      const x = p.x + nx * width * 0.35;
      const y = p.y + ny * width * 0.35;
      if (this.fiberMap) {
        // Each small path chooses the next nearby darker interstice, while
        // staying within a short outward cone. The photographed fibers guide
        // the dye route; seeded coefficients only select its starting point.
        const path = this._interstitialPath(x, y, nx, ny, length, branch.lean * 0.52);
        ctx.strokeStyle = `rgba(10,39,60,${Math.min(0.91, branch.alpha * 1.26)})`;
        ctx.lineWidth = Math.max(0.36, this.unit * camera.scale * branch.width * 0.65);
        this._paintInterstitialPath(ctx, path);
        if (branch.fork && path.length > 4) {
          const start = path[Math.floor(path.length * 0.52)];
          const fork = this._interstitialPath(start.x, start.y, nx, ny, length * 0.41, -branch.lean * 0.72 - 0.42);
          ctx.lineWidth *= 0.66;
          this._paintInterstitialPath(ctx, fork);
        }
        continue;
      }
      const ex = x + nx * length + p.tx * length * branch.lean;
      const ey = y + ny * length + p.ty * length * branch.lean;
      const cx = x + nx * length * 0.52 + p.tx * length * branch.curl;
      const cy = y + ny * length * 0.52 + p.ty * length * branch.curl;
      ctx.strokeStyle = `rgba(19,46,69,${branch.alpha})`;
      ctx.lineWidth = Math.max(0.3, this.unit * camera.scale * branch.width * 0.60);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(cx, cy, ex, ey);
      ctx.stroke();

      if (branch.fork && length > 3) {
        const bx = (x + cx * 2 + ex) * 0.25;
        const by = (y + cy * 2 + ey) * 0.25;
        ctx.lineWidth *= 0.68;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(
          bx + nx * length * 0.13 - p.tx * length * 0.27,
          by + ny * length * 0.13 - p.ty * length * 0.27,
          bx + nx * length * 0.36 - p.tx * length * 0.42,
          by + ny * length * 0.36 - p.ty * length * 0.42,
        );
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  _stroke(ctx, s, g) {
    const { q, camera, end } = g;
    if (end < 0.00025) return;
    const wetness = 1 - smooth(8.94, 9.66, q);
    const steps = Math.max(8, Math.ceil(end * mix(this.mobile ? 140 : 240, this.mobile ? 650 : 1350, camera.macro)));
    const points = this._points;
    points.length = steps + 1;
    for (let i = 0; i <= steps; i += 1) {
      const t = (i / steps) * end;
      const p = this._mappedPoint(t, camera);
      p.width = this._width(t, camera, end);
      p.t = t;
      points[i] = p;
    }

    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    // A minute absorbed boundary beneath the dense center. It is never a blur
    // large enough to read as watercolor, even in the microscope composition.
    ctx.beginPath();
    points.forEach((p, i) => {
      const edge = 0.63 + camera.macro * (0.44 + Math.sin(p.t * 827) * 0.13);
      const x = p.x - p.nx * p.width * edge;
      const y = p.y - p.ny * p.width * edge;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    for (let i = points.length - 1; i >= 0; i -= 1) {
      const p = points[i];
      const edge = 0.63 + camera.macro * (0.44 + Math.sin(p.t * 953 + 2.1) * 0.13);
      ctx.lineTo(p.x + p.nx * p.width * edge, p.y + p.ny * p.width * edge);
    }
    ctx.closePath();
    ctx.fillStyle = `rgba(29,58,79,${0.16 * (1 - camera.macro)})`;
    ctx.fill();
    if (this.fiberStain && camera.macro > 0.02) {
      ctx.save();
      ctx.clip();
      ctx.globalAlpha *= camera.macro * 0.86;
      ctx.drawImage(this.fiberStain, 0, 0, this.w, this.h);
      ctx.restore();
    }

    ctx.beginPath();
    points.forEach((p, i) => {
      const x = p.x - p.nx * p.width * 0.5;
      const y = p.y - p.ny * p.width * 0.5;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    for (let i = points.length - 1; i >= 0; i -= 1) {
      const p = points[i];
      ctx.lineTo(p.x + p.nx * p.width * 0.5, p.y + p.ny * p.width * 0.5);
    }
    ctx.closePath();
    const first = points[0];
    const last = points[points.length - 1];
    const gradient = ctx.createLinearGradient(first.x, first.y, last.x + 0.1, last.y);
    gradient.addColorStop(0, mixColor([32, 48, 68], [23, 46, 69], wetness));
    gradient.addColorStop(0.48, mixColor([28, 44, 62], [11, 32, 55], wetness));
    gradient.addColorStop(0.88, mixColor([25, 42, 61], [8, 23, 36], wetness));
    gradient.addColorStop(1, mixColor([25, 42, 61], [6, 19, 31], wetness));
    ctx.fillStyle = gradient;
    ctx.fill();
    if (this.fiberInk && camera.macro > 0.02) {
      ctx.save();
      ctx.clip();
      ctx.globalAlpha *= camera.macro * 0.94;
      ctx.drawImage(this.fiberInk, 0, 0, this.w, this.h);
      ctx.restore();
    }

    // Short microscopic facets provide wet reflection. Continuous parallel
    // highlights would make the deposited ink resemble a raised glossy tube.
    if (camera.macro > 0.02 && wetness > 0.02) {
      for (const facet of this.facets) {
        if (facet.t >= end || facet.t < 0.006) continue;
        const p = this._mappedPoint(facet.t, camera);
        const p2 = this._mappedPoint(Math.min(end, facet.t + facet.length), camera);
        const width = this._width(facet.t, camera, end);
        const length = Math.min(Math.hypot(p2.x - p.x, p2.y - p.y), width * 0.34);
        const direction = this._fiberDirection(p.x, p.y, p.tx, p.ty);
        ctx.lineWidth = Math.max(0.25, width * facet.width);
        ctx.strokeStyle = `rgba(224,232,229,${facet.alpha * camera.macro * wetness})`;
        ctx.beginPath();
        ctx.moveTo(p.x + p.nx * width * facet.across, p.y + p.ny * width * facet.across);
        ctx.lineTo(p.x + direction.x * length + p.nx * width * (facet.across + 0.03), p.y + direction.y * length + p.ny * width * (facet.across + 0.03));
        ctx.stroke();
      }
    }

    // Cellulose tooth stays inside the stroke. Its small interruptions become
    // more visible as surface sheen gives way to a matte deposited mark.
    for (const tooth of this.tooth) {
      if (tooth.t >= end) continue;
      const p = this._mappedPoint(tooth.t, camera);
      const width = this._width(tooth.t, camera, end);
      const x = p.x + p.nx * width * tooth.across * 0.44;
      const y = p.y + p.ny * width * tooth.across * 0.44;
      const size = Math.max(0.35, width * tooth.length * 0.26);
      ctx.strokeStyle = `rgba(223,225,217,${tooth.alpha * (1.05 - wetness * 0.37)})`;
      ctx.lineWidth = Math.max(0.24, this.unit * camera.scale * 0.14);
      ctx.beginPath();
      ctx.moveTo(x - p.tx * size * 0.5, y - p.ty * size * 0.5);
      ctx.lineTo(x + p.tx * size * 0.5 + p.nx * size * tooth.slant, y + p.ty * size * 0.5 + p.ny * size * tooth.slant);
      ctx.stroke();
    }

    if (wetness > 0.003) {
      for (const glint of this.glints) {
        if (glint.t >= end || glint.t < 0.009) continue;
        const to = Math.min(end, glint.t + glint.length * mix(1, 0.36, camera.macro));
        const p = this._mappedPoint(glint.t, camera);
        const p2 = this._mappedPoint(to, camera);
        const width = this._width(glint.t, camera, end);
        const age = clamp((end - glint.t) / Math.max(end, 0.02));
        const livingReflection = s.reduced ? 0.9 : 0.84 + Math.sin((s.time || 0) * 0.57 + glint.phase) * 0.16;
        const strength = wetness * glint.alpha * (0.30 + (1 - age) ** 2 * 0.66) * livingReflection;
        ctx.strokeStyle = `rgba(211,228,234,${strength})`;
        ctx.lineWidth = Math.max(0.35, width * (0.048 + (1 - age) * 0.04));
        ctx.beginPath();
        ctx.moveTo(p.x + p.nx * width * glint.side, p.y + p.ny * width * glint.side);
        ctx.quadraticCurveTo(
          (p.x + p2.x) * 0.5 + p.nx * width * (glint.side - 0.05),
          (p.y + p2.y) * 0.5 + p.ny * width * (glint.side - 0.05),
          p2.x + p2.nx * width * glint.side,
          p2.y + p2.ny * width * glint.side,
        );
        ctx.stroke();
      }
    }

    if (this.fiberRidges && camera.macro > 0.02) {
      // The strongest ivory ridges pass IN FRONT OF portions of the wet mark.
      // The colors, shape and location are lifted from the same material crop
      // underneath, so these crossings continue naturally beyond the edge.
      ctx.save();
      ctx.beginPath();
      points.forEach((p, i) => {
        const x = p.x - p.nx * p.width * 1.03;
        const y = p.y - p.ny * p.width * 1.03;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      for (let i = points.length - 1; i >= 0; i -= 1) {
        const p = points[i];
        ctx.lineTo(p.x + p.nx * p.width * 1.03, p.y + p.ny * p.width * 1.03);
      }
      ctx.closePath();
      ctx.clip();
      ctx.globalAlpha *= camera.macro * 0.86;
      ctx.drawImage(this.fiberRidges, 0, 0, this.w, this.h);
      ctx.restore();
    }
    ctx.restore();
  }

  _shadow(ctx, x, y, height, lift, amount = 1) {
    if (amount <= 0.002) return;
    const spread = height * 0.33;
    const gap = clamp(lift / (this.h * 0.15));
    ctx.save();
    ctx.globalAlpha *= amount;
    ctx.translate(x + spread * 0.57, y + height * 0.012 + lift * 0.27);
    ctx.rotate(-0.19);
    ctx.scale(1, 0.17 + gap * 0.10);
    const gradient = ctx.createRadialGradient(0, 0, spread * 0.02, 0, 0, spread);
    gradient.addColorStop(0, `rgba(47,39,28,${0.19 - gap * 0.055})`);
    gradient.addColorStop(0.44, `rgba(57,45,29,${0.11 - gap * 0.025})`);
    gradient.addColorStop(1, 'rgba(60,47,30,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, spread, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (lift < 7 * this.unit) {
      ctx.save();
      ctx.globalAlpha *= amount * (1 - lift / Math.max(1, 7 * this.unit));
      ctx.fillStyle = 'rgba(28,26,23,0.19)';
      ctx.beginPath();
      ctx.ellipse(x + this.unit * 1.9, y + this.unit * 1.1, this.unit * 7, this.unit * 2, -0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  _bridge(ctx, g, amount = 1) {
    const width = Math.max(this.unit * 2.45, this.baseWidth * g.camera.scale * 0.60);
    if (amount < 0.001 || g.lift > width * 2.4) return;
    const x = g.point.x;
    const y = g.point.y;
    const gap = Math.max(0, g.lift);
    ctx.save();
    ctx.globalAlpha *= amount * (1 - smooth(width * 1.5, width * 2.4, gap));
    const gradient = ctx.createLinearGradient(x - width, y - gap, x + width, y + width * 0.3);
    gradient.addColorStop(0, '#203d56');
    gradient.addColorStop(0.48, '#071a2d');
    gradient.addColorStop(1, '#03111d');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(x - width * 0.35, y - gap - width * 0.72);
    ctx.bezierCurveTo(x - width * 0.74, y - gap * 0.35, x - width * 0.30, y - width * 0.16, x - width, y + width * 0.13);
    ctx.bezierCurveTo(x - width * 0.48, y + width * 0.52, x + width * 0.69, y + width * 0.44, x + width, y + width * 0.12);
    ctx.bezierCurveTo(x + width * 0.26, y - width * 0.12, x + width * 0.43, y - gap * 0.65, x + width * 0.33, y - gap - width * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(214,232,237,0.68)';
    ctx.lineWidth = Math.max(0.45, this.unit * 0.62);
    ctx.beginPath();
    ctx.moveTo(x - width * 0.31, y - gap - width * 0.28);
    ctx.quadraticCurveTo(x - width * 0.27, y - width * 0.26, x - width * 0.62, y + width * 0.1);
    ctx.stroke();
    ctx.restore();
  }

  _nib(ctx, s, g, visibility = 1) {
    const img = s.images?.nibProfile;
    if (!img || visibility < 0.001 || !(img.naturalWidth || img.width)) return;
    const writingScale = smooth(7.65, 8.15, g.q);
    const baseHeight = this.h * (this.mobile ? mix(0.259, 0.276, writingScale) : mix(0.567, 0.432, writingScale));
    const height = baseHeight * g.camera.scale * .90;
    const width = height * (img.naturalWidth || img.width) / (img.naturalHeight || img.height);
    this._prepareNib(img);
    const departure = smooth(9.08, 9.55, g.q);
    const x = g.tip.x + departure * this.w * 0.13;
    const y = g.tip.y - departure * this.h * 0.13;
    this._shadow(ctx, g.point.x, g.point.y, height, g.lift + departure * this.h * 0.13, visibility * (1 - departure));
    ctx.save();
    ctx.globalAlpha *= visibility;
    ctx.translate(x, y); ctx.rotate(-.21);
    this._lacquerExtension(ctx, 0, 0, width, height);
    // This real oblique pose preserves the metal arch and feed thickness.
    // Its attached ink ends at approximately645,831 in the1672×941 alpha.
    ctx.drawImage(this.nibPlate || img, -width * 0.386, -height * 0.883, width, height);
    ctx.restore();
    this._bridge(ctx, g, visibility * (1 - departure));
  }

  _prepareNib(img) {
    if (this.nibSource === img) return;
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const canvas = makeCanvas(w, h);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    // Only the two photographic crop boundaries receive a soft material
    // overlap. The nib's alpha contour and its real contact tip stay intact.
    ctx.globalCompositeOperation = 'destination-out';
    const top = ctx.createLinearGradient(0, 0, 0, h * 0.050);
    top.addColorStop(0, 'rgba(0,0,0,1)');
    top.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, w, h * 0.050);
    const right = ctx.createLinearGradient(w, 0, w - w * 0.032, 0);
    right.addColorStop(0, 'rgba(0,0,0,1)');
    right.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = right;
    ctx.fillRect(w * 0.968, 0, w * 0.032, h);
    if (typeof this.nibPlate?.close === 'function') this.nibPlate.close();
    this.nibPlate = typeof canvas.transferToImageBitmap === 'function' ? canvas.transferToImageBitmap() : canvas;
    this.nibSource = img;
  }

  _lacquerExtension(ctx, x, y, width, height) {
    // Extend the actual two photographic boundary strips along their measured
    // barrel edges. Sampling those pixels preserves lacquer reflections and
    // silhouette without introducing a flat polygon or an extra metal ring.
    const img = this.nibSource;
    if (!img) return;
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    const originX = x - width * 0.386, originY = y - height * 0.883;
    const reach = Math.max(this.w, this.h) * 4;
    const ax = originX + width * .8158, ay = originY;
    const bx = originX + width, by = originY + height * .452;
    ctx.save();
    ctx.fillStyle = '#070708';
    ctx.beginPath();
    ctx.moveTo(ax - height * .045 * 1.33, ay + height * .045);
    ctx.lineTo(bx - height * .045 * 1.98, by + height * .045);
    ctx.lineTo(bx + reach * 1.98, by - reach);
    ctx.lineTo(ax + reach * 1.33, ay - reach);
    ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.rect(-reach, -reach, reach * 3, Math.max(0, originY + height * .055 + reach)); ctx.clip();
    ctx.translate(originX, originY); ctx.transform(1, 0, -1.33, 1, 0, 0);
    ctx.drawImage(img, 0, 0, iw, 2, 0, -reach, width, reach + height * .055);
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.rect(originX + width * .965, -reach, reach * 3, reach * 3); ctx.clip();
    ctx.translate(originX + width, originY); ctx.transform(1, -1 / 1.98, 0, 1, 0, 0);
    ctx.drawImage(img, iw - 2, 0, 2, ih, -width * .035, 0, reach + width * .035, height);
    ctx.restore();
  }

  contact(ctx, s) {
    const g = this.geometry(s, 6);
    this._paperDetail(ctx, s, g.camera.macro * 0.80);
    this._branches(ctx, g);
    this._stroke(ctx, s, g);
    const visibility = 1 - smooth(6.91, 7.11, g.q);
    this._nib(ctx, s, g, visibility);
    return g;
  }

  absorb(ctx, s) {
    const g = this.geometry(s, 7);
    this._paperDetail(ctx, s, g.camera.macro);
    this._branches(ctx, g);
    this._stroke(ctx, s, g);
    // The very beginning and end share the same registered object as the
    // adjoining scenes, so a root crossfade cannot produce two separate tips.
    const before = 1 - smooth(6.91, 7.11, g.q);
    const after = smooth(7.81, 8.12, g.q);
    this._nib(ctx, s, g, Math.max(before, after));
    return g;
  }

  write(ctx, s) {
    const g = this.geometry(s, 8);
    this._paperDetail(ctx, s, g.camera.macro);
    this._branches(ctx, g);
    this._stroke(ctx, s, g);
    this._nib(ctx, s, g, smooth(7.81, 8.12, g.q));
    return g;
  }

  trace(ctx, s) {
    const g = this.geometry(s, 9);
    this._stroke(ctx, s, g);
    this._nib(ctx, s, g, 1 - smooth(9.08, 9.55, g.q));
    return g;
  }
}
