/* FOSSIL · geological surfaces, contours, and preparation masks.
 * Interpretive material treatments; no measured specimen data is implied.
 * The host owns the clock, scroll authority, controls, and animation loop.
 */
(function (root) {
  'use strict';

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, Number.isFinite(v) ? v : a));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const TAU = Math.PI * 2;
  function seeded(seed) {
    let s = seed >>> 0;
    return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 4294967296; };
  }
  function surface(w, h) {
    const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }
  function imageReady(im) { return !!(im && (im.naturalWidth || im.width) > 0 && (im.complete === undefined || im.complete)); }
  function imageSize(im) { return { width: im.naturalWidth || im.width, height: im.naturalHeight || im.height }; }
  function coverImage(g, im, sx, sy, sw, sh, dx, dy, dw, dh) {
    const scale = Math.max(dw / sw, dh / sh), cw = dw / scale, ch = dh / scale;
    g.drawImage(im, sx + (sw - cw) * .5, sy + (sh - ch) * .5, cw, ch, dx, dy, dw, dh);
  }

  // Paths follow the visible outer shell in the commissioned plates. Coordinates
  // are normalized photograph coordinates, independent of viewport or DPR.
  const SHELL = {
    preservation: [
      [.537,.073],[.636,.043],[.729,.062],[.795,.123],[.823,.229],[.820,.360],
      [.834,.490],[.878,.652],[.852,.785],[.776,.876],[.662,.914],[.546,.900],
      [.441,.841],[.383,.732],[.363,.594],[.376,.434],[.416,.251],[.470,.128]
    ],
    exposure: [
      [.668,.043],[.743,.056],[.810,.115],[.853,.209],[.885,.326],[.897,.457],
      [.911,.592],[.869,.741],[.799,.841],[.687,.868],[.586,.812],[.507,.717],
      [.463,.593],[.443,.451],[.463,.322],[.522,.185],[.592,.086]
    ],
    specimen: [
      [.461,.120],[.583,.111],[.689,.170],[.755,.276],[.790,.397],[.781,.518],
      [.789,.630],[.737,.766],[.630,.862],[.514,.895],[.420,.839],[.348,.757],
      [.293,.619],[.297,.479],[.332,.325],[.390,.196]
    ]
  };
  const REGIONS = {
    preservation: { x: .34, y: 0, width: .66, height: .97 },
    exposure: { x: .31, y: 0, width: .69, height: 1 },
    specimen: { x: .10, y: 0, width: .84, height: 1 }
  };

  function contour(points, project, scale = 1) {
    const out = new Path2D();
    let cx = 0, cy = 0;
    points.forEach(p => { cx += p[0]; cy += p[1]; });
    cx /= points.length; cy /= points.length;
    const pts = points.map(p => project(cx + (p[0] - cx) * scale, cy + (p[1] - cy) * scale));
    const n = pts.length;
    out.moveTo((pts[n - 1].x + pts[0].x) / 2, (pts[n - 1].y + pts[0].y) / 2);
    for (let i = 0; i < n; i++) {
      const p = pts[i], next = pts[(i + 1) % n];
      out.quadraticCurveTo(p.x, p.y, (p.x + next.x) / 2, (p.y + next.y) / 2);
    }
    out.closePath();
    return out;
  }

  class FossilGeology {
    constructor({ canvas, specimenImage, strataImage, preservationImage, exposureImage } = {}) {
      if (!canvas || typeof canvas.getContext !== 'function') throw new TypeError('FossilGeology requires a canvas.');
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: true });
      if (!this.ctx) throw new Error('A 2D canvas context is unavailable.');
      this.specimenImage = specimenImage || null;
      this.strataImage = strataImage || null;
      this.preservationImage = preservationImage || null;
      this.exposureImage = exposureImage || null;
      this.width = 1; this.height = 1; this.dpr = 1;
      this.disposed = false;
      this.lastWarning = null;
      this._surface = null; this._dust = null; this._brushMask = null; this._modeMask = null;
      this._brushes = []; this._brushVersion = 0; this._paintedBrushVersion = -1;
      this._paintedBrushCount = 0;
      this._lastBrush = null; this._lastExposureRect = null;
      this._lastScene = -1;
      this._modeCache = null; this._modeImage = null;
      this._random = seeded(83217);
      this._grain = this._makeGrain();
      const rand = seeded(760319);
      this._dustPoints = Array.from({ length: 880 }, () => ({
        u: .44 + rand() * .48, v: .03 + rand() * .88,
        radius: .24 + rand() * 1.16, tone: rand(), opacity: .15 + rand() * .42
      }));
      const clusters = [[.525,.310],[.552,.681],[.772,.670],[.737,.195]];
      this._patches = Array.from({ length: 104 }, (_, i) => {
        const angle = rand() * TAU, distance = Math.sqrt(rand());
        const cluster = clusters[i % clusters.length];
        return {
          u: cluster[0] + Math.cos(angle) * .078 * distance,
          v: cluster[1] + Math.sin(angle) * .125 * distance,
          ru: .006 + rand() * .010, rv: .009 + rand() * .014,
          rank: clamp(.10 + distance * .66 + rand() * .22),
          seed: i * 931 + 3127, sx: .325 + rand() * .065, sy: .025 + rand() * .12
        };
      });
    }

    resize(width, height, dpr = 1) {
      if (this.disposed) return;
      this.width = Math.max(1, Math.round(width || 1));
      this.height = Math.max(1, Math.round(height || 1));
      this.dpr = clamp(dpr, .5, this.width < 700 ? 1.5 : 1.75);
      const w = Math.max(1, Math.round(this.width * this.dpr));
      const h = Math.max(1, Math.round(this.height * this.dpr));
      if (this.canvas.width !== w) this.canvas.width = w;
      if (this.canvas.height !== h) this.canvas.height = h;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this._paintedBrushVersion = -1;
    }

    clear() {
      if (this.disposed) return;
      this.ctx.save(); this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();
    }

    render({ scene, progress = .5, rect, alpha = 1, motion = true, time = 0, reveal = .5, mode = 0, pointer } = {}) {
      if (this.disposed || alpha <= 0) return;
      scene = Math.round(scene);
      if (scene < 1 || scene > 4) return;
      const p = clamp(progress), a = clamp(alpha);
      const r = this._rect(rect);
      this._lastScene = scene;
      this.ctx.save();
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.ctx.globalAlpha *= a;
      if (scene === 1) this._strata(p, motion);
      else if (scene === 2) this._burial(p, r, motion);
      else if (scene === 3) this._preservation(p, r, Math.round(clamp(mode, 0, 3)), motion);
      else {
        this._lastExposureRect = r;
        if (pointer && pointer.down && Number.isFinite(pointer.x) && Number.isFinite(pointer.y)) {
          const normalized = pointer.normalized === true || (pointer.x >= 0 && pointer.x <= 1 && pointer.y >= 0 && pointer.y <= 1);
          this.brush(normalized ? pointer.x * this.width : pointer.x, normalized ? pointer.y * this.height : pointer.y, pointer.radius || 30);
        }
        this._exposure(p, r, clamp(reveal), motion, time);
      }
      this.ctx.restore();
    }

    // Brushing affects the loose-grain coat only. Matrix patches respond to the
    // host's reveal control, so a brush does not dissolve intact supporting rock.
    // Coordinates and radius use canvas CSS pixels; stored marks survive resize.
    brush(x, y, radius = 30) {
      if (this.disposed || this._lastScene !== 4 || !this._lastExposureRect) return false;
      const r = this._lastExposureRect;
      if (!Number.isFinite(x) || !Number.isFinite(y) || x < r.x || y < r.y || x > r.x + r.width || y > r.y + r.height) return false;
      const rad = clamp(radius, 5, 100);
      if (this._lastBrush && Math.hypot(x - this._lastBrush.x, y - this._lastBrush.y) < Math.max(2, rad * .24)) return false;
      this._lastBrush = { x, y };
      const mark = { u: (x - r.x) / r.width, v: (y - r.y) / r.height, ru: rad / r.width, rv: rad / r.height };
      // Coalesce already covered samples. Keep old marks so previously cleared
      // dust does not reappear during a long preparation session.
      if (this._brushes.some(old => Math.hypot((old.u - mark.u) * r.width, (old.v - mark.v) * r.height) < rad * .22 && old.ru >= mark.ru * .9)) return false;
      this._brushes.push(mark);
      this._brushVersion++;
      return true;
    }

    resetBrush() {
      this._brushes.length = 0;
      this._lastBrush = null;
      this._brushVersion++;
      this._paintedBrushVersion = -1;
      this._paintedBrushCount = 0;
      if (this._brushMask) this._brushMask.getContext('2d').clearRect(0, 0, this._brushMask.width, this._brushMask.height);
    }

    getStatus() {
      return {
        ready: { specimen: imageReady(this.specimenImage), strata: imageReady(this.strataImage), preservation: imageReady(this.preservationImage), exposure: imageReady(this.exposureImage) },
        brushMarks: this._brushes.length,
        lastWarning: this.lastWarning
      };
    }

    dispose() {
      if (this.disposed) return;
      this.clear();
      this.disposed = true;
      this._brushes.length = 0;
      for (const key of ['_surface', '_dust', '_brushMask', '_modeMask', '_grain']) {
        if (this[key]) { this[key].width = 1; this[key].height = 1; }
        this[key] = null;
      }
      if (this._modeCache) this._modeCache.forEach(c => { if (c) { c.width = 1; c.height = 1; } });
      this._modeCache = null; this._modeImage = null;
      this.specimenImage = this.strataImage = this.preservationImage = this.exposureImage = null;
    }

    _rect(rect) {
      return {
        x: Number.isFinite(rect && rect.x) ? rect.x : this.width * .34,
        y: Number.isFinite(rect && rect.y) ? rect.y : this.height * .05,
        width: Math.max(1, Number.isFinite(rect && rect.width) ? rect.width : this.width * .70),
        height: Math.max(1, Number.isFinite(rect && rect.height) ? rect.height : this.height * .96)
      };
    }

    _makeGrain() {
      const c = surface(256, 256), g = c.getContext('2d');
      const data = g.createImageData(256, 256), rand = seeded(124590);
      for (let i = 0; i < data.data.length; i += 4) {
        const v = 156 + rand() * 72 + Math.sin(i * .00042) * 9;
        data.data[i] = v; data.data[i + 1] = v - 8; data.data[i + 2] = v - 22; data.data[i + 3] = 255;
      }
      g.putImageData(data, 0, 0);
      return c;
    }

    _fallback(g, r, dark = false) {
      g.save();
      g.fillStyle = g.createPattern(this._grain, 'repeat');
      g.fillRect(r.x, r.y, r.width, r.height);
      if (dark) { g.fillStyle = 'rgba(20,21,18,.70)'; g.fillRect(r.x, r.y, r.width, r.height); }
      g.restore();
    }

    _layout(im, kind, r) {
      const dims = imageReady(im) ? imageSize(im) : { width: 1586, height: 992 };
      const s = REGIONS[kind] || REGIONS.specimen;
      const scale = Math.max(r.width / (s.width * dims.width), r.height / (s.height * dims.height));
      const dw = s.width * dims.width * scale, dh = s.height * dims.height * scale;
      const dx = r.x + (r.width - dw) * .5, dy = r.y + (r.height - dh) * .5;
      return {
        source: s, dims, dx, dy, dw, dh,
        project: (u, v) => ({ x: dx + (u - s.x) / s.width * dw, y: dy + (v - s.y) / s.height * dh })
      };
    }

    _drawPlate(g, im, l, r) {
      if (!imageReady(im)) { this._fallback(g, r); this.lastWarning = 'A photographic plate is still loading; a native grain surface is shown temporarily.'; return; }
      const s = l.source, d = imageSize(im);
      g.drawImage(im, s.x * d.width, s.y * d.height, s.width * d.width, s.height * d.height, l.dx, l.dy, l.dw, l.dh);
    }

    _buffer(key, r) {
      const scale = Math.min(this.dpr, 1400 / Math.max(r.width, r.height), 1.6);
      const w = Math.max(1, Math.ceil(r.width * scale)), h = Math.max(1, Math.ceil(r.height * scale));
      let c = this[key];
      if (!c) c = this[key] = surface(w, h);
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; if (key === '_brushMask') this._paintedBrushVersion = -1; }
      const g = c.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h);
      g.setTransform(w / r.width, 0, 0, h / r.height, -r.x * w / r.width, -r.y * h / r.height);
      return { canvas: c, ctx: g };
    }

    _feather(g, r, left = .075) {
      g.save(); g.globalCompositeOperation = 'destination-in';
      const lr = g.createLinearGradient(r.x, 0, r.x + r.width, 0);
      lr.addColorStop(0, 'rgba(255,255,255,0)'); lr.addColorStop(left, '#fff'); lr.addColorStop(1, '#fff');
      g.fillStyle = lr; g.fillRect(r.x, r.y, r.width, r.height);
      const tb = g.createLinearGradient(0, r.y, 0, r.y + r.height);
      tb.addColorStop(0, 'rgba(255,255,255,0)'); tb.addColorStop(.025, '#fff'); tb.addColorStop(.975, '#fff'); tb.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = tb; g.fillRect(r.x, r.y, r.width, r.height);
      g.restore();
    }

    _composite(c, r) { this.ctx.drawImage(c, 0, 0, c.width, c.height, r.x, r.y, r.width, r.height); }

    _bedEdge(index, y, width, amplitude, phase) {
      const path = [];
      const steps = this.width < 700 ? 48 : 84;
      for (let j = 0; j <= steps; j++) {
        const x = width * j / steps;
        const v = Math.sin(j * .34 + index * 1.7) * .40 + Math.sin(j * 1.51 + index * .87) * .20 + Math.sin(j * 3.11 + index * .41) * .09;
        const slope = Math.sin(index * .93 + .3) * (j / steps - .5) * amplitude * 2.8;
        path.push({ x, y: y + v * amplitude + slope + phase });
      }
      return path;
    }

    _strata(p, motion) {
      const g = this.ctx, W = this.width, H = this.height;
      const handoff = smooth(.76, 1, p);
      const settle = motion ? smooth(.05, .50, p) : 1;
      const top = mix(H * .37, -H * .035, handoff);
      const total = H - top + H * .05;
      const fractions = [0, .245, .455, .680, 1];
      const sourceBands = [.075, .230, .405, .620, 1];
      const gap = (1 - settle) * (this.width < 700 ? 9 : 21);
      const ready = imageReady(this.strataImage);
      const d = ready ? imageSize(this.strataImage) : null;
      for (let i = 3; i >= 0; i--) {
        const parallax = motion ? (p - .45) * (i - 1.5) * 8 * (1 - handoff) * (1 - settle) : 0;
        const ya = top + total * fractions[i] + gap * (i - 1.5) + parallax;
        const yb = top + total * fractions[i + 1] + gap * (i - 1.5) + parallax;
        const upper = this._bedEdge(i, ya, W, H * .018, 0);
        const lower = this._bedEdge(i + 1, yb, W, H * .018, 0);
        const path = new Path2D(); path.moveTo(upper[0].x, upper[0].y);
        upper.slice(1).forEach(q => path.lineTo(q.x, q.y));
        lower.slice().reverse().forEach(q => path.lineTo(q.x, q.y)); path.closePath();
        g.save(); g.clip(path);
        if (ready) {
          // The approved texture has a small native-alpha crest at its top.
          const sy = d.height * sourceBands[i];
          const sh = d.height * (sourceBands[i + 1] - sourceBands[i]);
          coverImage(g, this.strataImage, 0, sy, d.width, sh, -14, ya - H * .045, W + 28, yb - ya + H * .09);
        } else this._fallback(g, { x: 0, y: ya - H * .05, width: W, height: yb - ya + H * .1 }, i % 2 === 1);
        const shade = g.createLinearGradient(0, ya, 0, yb);
        shade.addColorStop(0, 'rgba(20,21,18,.03)'); shade.addColorStop(.76, 'rgba(20,21,18,0)'); shade.addColorStop(1, 'rgba(20,21,18,.27)');
        g.fillStyle = shade; g.fillRect(0, ya - H * .05, W, yb - ya + H * .10);
        g.restore();
        const crest = new Path2D(); crest.moveTo(upper[0].x, upper[0].y);
        upper.slice(1).forEach(q => crest.lineTo(q.x, q.y));
        g.strokeStyle = i % 2 === 0 ? 'rgba(239,230,211,.47)' : 'rgba(181,165,138,.27)';
        g.lineWidth = .85; g.stroke(crest);
      }
    }

    _burial(p, r, motion) {
      const W = this.width, H = this.height;
      const whole = { x: 0, y: 0, width: W, height: H };
      const b = this._buffer('_surface', whole), g = b.ctx;
      if (imageReady(this.strataImage)) {
        const d = imageSize(this.strataImage);
        coverImage(g, this.strataImage, 0, d.height * .10, d.width, d.height * .90, -W * .03, -H * .10, W * 1.06, H * 1.2);
      } else this._fallback(g, whole, true);
      g.fillStyle = 'rgba(20,21,18,.60)'; g.fillRect(0, 0, W, H);
      const covered = smooth(.07, .87, p);
      const l = this._layout(this.specimenImage, 'specimen', r);
      const shape = contour(SHELL.specimen, l.project);
      g.save(); g.globalAlpha = mix(.60, .13, covered);
      this._drawPlate(g, this.specimenImage, l, r); g.restore();

      // The irregular depositional front advances over the actual photographic
      // form. It reverses exactly when scroll reverses, without accumulated state.
      const front = H * mix(.10, .93, covered);
      const edge = this._bedEdge(7, front, W, H * .045, 0);
      const cap = new Path2D(); cap.moveTo(0, -H); cap.lineTo(W, -H);
      edge.slice().reverse().forEach(q => cap.lineTo(q.x, q.y - (q.x / W) * H * .18)); cap.closePath();
      g.save(); g.clip(cap);
      if (imageReady(this.strataImage)) {
        const d = imageSize(this.strataImage);
        coverImage(g, this.strataImage, 0, d.height * .12, d.width, d.height * .88, -W * .025, -H * .15, W * 1.05, H * 1.18);
      } else this._fallback(g, whole, true);
      g.fillStyle = 'rgba(20,21,18,.55)'; g.fillRect(0, 0, W, H); g.restore();

      // A restrained boundary trace remains; the specimen never turns into a
      // clean floating diagram or loses the matrix that surrounds it.
      if (covered > .35) {
        g.save(); g.globalAlpha = smooth(.35, .8, covered) * .22;
        g.strokeStyle = '#d7c7a7'; g.lineWidth = .75;
        g.setLineDash([17, 11, 4, 27]); g.stroke(shape); g.restore();
      }
      const vignette = g.createLinearGradient(0, 0, W, 0);
      vignette.addColorStop(0, 'rgba(20,21,18,.95)'); vignette.addColorStop(.38, 'rgba(20,21,18,.30)'); vignette.addColorStop(.8, 'rgba(20,21,18,0)');
      g.fillStyle = vignette; g.fillRect(0, 0, W, H);
      this._composite(b.canvas, whole);
    }

    _prepareModes(im) {
      if (!imageReady(im) || this._modeImage === im) return;
      this._modeImage = im;
      const d = imageSize(im), scale = Math.min(1, 1250 / d.width);
      const w = Math.round(d.width * scale), h = Math.round(d.height * scale);
      const base = surface(w, h), g = base.getContext('2d', { willReadFrequently: true });
      g.drawImage(im, 0, 0, w, h);
      try {
        const pixels = g.getImageData(0, 0, w, h), luminance = new Float32Array(w * h);
        for (let i = 0; i < luminance.length; i++) luminance[i] = pixels.data[i * 4] * .2126 + pixels.data[i * 4 + 1] * .7152 + pixels.data[i * 4 + 2] * .0722;
        this._modeCache = [base];
        for (let mode = 1; mode <= 3; mode++) {
          const c = surface(w, h), cg = c.getContext('2d'), out = cg.createImageData(w, h);
          for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
            const k = y * w + x, i = k * 4, lum = luminance[k];
            const near = luminance[Math.max(0, y - 2) * w + Math.max(0, x - 2)];
            const far = luminance[Math.min(h - 1, y + 2) * w + Math.min(w - 1, x + 2)];
            const relief = (near - far) * .24;
            let rgb;
            if (mode === 1) {
              const v = (lum - 135) * .68;
              rgb = [148 + v, 133 + v * .94, 107 + v * .86];
            } else if (mode === 2) {
              const v = (lum - 151) * -.51 - relief;
              rgb = [172 + v, 161 + v, 141 + v * .95];
            } else {
              const v = (lum - 140) * .55 + relief * .8;
              rgb = [209 + v, 202 + v, 184 + v * .92];
            }
            out.data[i] = clamp(rgb[0], 38, 247); out.data[i + 1] = clamp(rgb[1], 35, 244); out.data[i + 2] = clamp(rgb[2], 31, 237); out.data[i + 3] = pixels.data[i + 3];
          }
          cg.putImageData(out, 0, 0); this._modeCache.push(c);
        }
      } catch (error) {
        // file:// images can make a canvas non-origin-clean. Native drawing and
        // compositing remain available, so all four controls still have a visible
        // material treatment without reading a single source pixel.
        this._modeCache = [base];
        const filters = [
          '',
          'grayscale(.8) sepia(.65) saturate(.75) brightness(.86) contrast(1.10)',
          'grayscale(1) invert(1) contrast(.68) brightness(1.65)',
          'grayscale(.92) sepia(.18) brightness(1.32) contrast(.84)'
        ];
        for (let mode = 1; mode <= 3; mode++) {
          const c = surface(w, h), cg = c.getContext('2d');
          cg.filter = filters[mode]; cg.drawImage(base, 0, 0); cg.filter = 'none';
          cg.globalCompositeOperation = 'color';
          cg.fillStyle = mode === 1 ? 'rgba(156,132,87,.42)' : 'rgba(214,203,179,.35)';
          cg.fillRect(0, 0, w, h); cg.globalCompositeOperation = 'source-over';
          this._modeCache.push(c);
        }
        this.lastWarning = 'Source pixel access is unavailable; preservation is using its native filter and contour fallback.';
      }
    }

    _preservation(p, r, mode, motion) {
      const im = imageReady(this.preservationImage) ? this.preservationImage : this.specimenImage;
      const kind = imageReady(this.preservationImage) ? 'preservation' : 'specimen';
      this._prepareModes(im);
      const l = this._layout(im, kind, r), shape = contour(SHELL[kind], l.project);
      const b = this._buffer('_surface', r), g = b.ctx;
      this._drawPlate(g, im, l, r);
      if (mode > 0 && this._modeCache) {
        const material = this._buffer('_dust', r), mg = material.ctx;
        const mask = this._buffer('_modeMask', r), maskg = mask.ctx;
        this._drawPlate(mg, this._modeCache[mode], l, r);
        maskg.fillStyle = '#fff'; maskg.filter = 'blur(5px)'; maskg.fill(shape); maskg.filter = 'none';
        mg.save(); mg.globalCompositeOperation = 'destination-in';
        mg.drawImage(mask.canvas, 0, 0, mask.canvas.width, mask.canvas.height, r.x, r.y, r.width, r.height); mg.restore();
        g.drawImage(material.canvas, 0, 0, material.canvas.width, material.canvas.height, r.x, r.y, r.width, r.height);
      }
      g.save(); g.clip(shape);

      // Fine pore infill and mineral seams remain at a material scale. They are
      // clipped to this specimen's contour, not displayed as floating particles.
      const rand = seeded(68112);
      const count = this.width < 700 ? 125 : 255;
      if (mode === 0 || mode === 1) {
        for (let i = 0; i < count; i++) {
          const u = .39 + rand() * .49, v = .07 + rand() * .82;
          const q = l.project(u, v), angle = rand() * TAU;
          const length = mode === 0 ? .7 + rand() * 3.6 : 2 + rand() * 10;
          g.strokeStyle = mode === 0 ? 'rgba(232,216,179,.66)' : 'rgba(232,216,179,.39)';
          g.lineWidth = mode === 0 ? .72 : .60;
          g.beginPath(); g.moveTo(q.x, q.y);
          g.lineTo(q.x + Math.cos(angle) * length, q.y + Math.sin(angle) * length);
          if (mode === 1) g.lineTo(q.x + Math.cos(angle + .7) * length * 1.9, q.y + Math.sin(angle + .7) * length * 1.9);
          g.stroke();
        }
      }
      if (mode === 2) {
        const q = l.project(.651, .444);
        const shade = g.createRadialGradient(q.x, q.y, r.width * .07, q.x, q.y, r.width * .48);
        shade.addColorStop(0, 'rgba(45,38,27,.15)'); shade.addColorStop(.62, 'rgba(68,55,37,.04)'); shade.addColorStop(1, 'rgba(243,235,217,.13)');
        g.fillStyle = shade; g.fillRect(r.x, r.y, r.width, r.height);
      }
      g.restore();
      if (mode === 2 || mode === 3) {
        g.save(); g.lineWidth = mode === 2 ? 1.3 : 1.1; g.globalAlpha = .24;
        g.setLineDash([18, 42, 5, 31]);
        g.translate(-1.6, -1.6); g.strokeStyle = mode === 2 ? 'rgba(52,45,32,.56)' : 'rgba(245,238,222,.65)'; g.stroke(shape);
        g.translate(3, 3); g.strokeStyle = mode === 2 ? 'rgba(244,234,211,.54)' : 'rgba(73,63,46,.29)'; g.stroke(shape); g.restore();
      }
      this._feather(g, r, .070);
      this._composite(b.canvas, r);
    }

    _patchPath(patch, project) {
      const path = new Path2D(), rand = seeded(patch.seed);
      const points = 10;
      for (let i = 0; i < points; i++) {
        const a = i / points * TAU, irregular = .78 + rand() * .38;
        const q = project(patch.u + Math.cos(a) * patch.ru * irregular, patch.v + Math.sin(a) * patch.rv * irregular);
        if (i === 0) path.moveTo(q.x, q.y); else path.lineTo(q.x, q.y);
      }
      path.closePath(); return path;
    }

    _paintBrushMask(r) {
      const w = Math.max(1, Math.min(1100, Math.round(r.width * this.dpr)));
      const h = Math.max(1, Math.round(w * r.height / r.width));
      if (!this._brushMask) this._brushMask = surface(w, h);
      const c = this._brushMask;
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; this._paintedBrushVersion = -1; }
      if (this._paintedBrushVersion === this._brushVersion) return c;
      const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0);
      if (this._paintedBrushVersion < 0 || this._paintedBrushCount > this._brushes.length) {
        g.clearRect(0, 0, w, h); this._paintedBrushCount = 0;
      }
      for (const mark of this._brushes.slice(this._paintedBrushCount)) {
        g.save(); g.translate(mark.u * w, mark.v * h); g.scale(mark.ru * w, mark.rv * h);
        const fade = g.createRadialGradient(0, 0, .04, 0, 0, 1);
        fade.addColorStop(0, 'rgba(255,255,255,.98)'); fade.addColorStop(.58, 'rgba(255,255,255,.90)'); fade.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = fade; g.fillRect(-1, -1, 2, 2); g.restore();
      }
      this._paintedBrushCount = this._brushes.length;
      this._paintedBrushVersion = this._brushVersion;
      return c;
    }

    _exposure(p, r, reveal, motion, time) {
      const im = imageReady(this.exposureImage) ? this.exposureImage : (this.preservationImage || this.specimenImage);
      const kind = imageReady(this.exposureImage) ? 'exposure' : (imageReady(this.preservationImage) ? 'preservation' : 'specimen');
      const l = this._layout(im, kind, r), shape = contour(SHELL[kind], l.project);
      const b = this._buffer('_surface', r), g = b.ctx;
      this._drawPlate(g, im, l, r);
      const matrixClear = smooth(.16, 1, reveal), dustClear = smooth(0, .78, reveal);
      g.save(); g.clip(shape);
      const d = imageReady(im) ? imageSize(im) : null;
      const stride = this.width < 700 ? 2 : 1;
      for (let i = 0; i < this._patches.length; i += stride) {
        const patch = this._patches[i];
        const opacity = 1 - smooth(patch.rank - .085, patch.rank + .07, matrixClear);
        if (opacity < .006) continue;
        const path = this._patchPath(patch, l.project);
        const a = l.project(patch.u - patch.ru * 1.3, patch.v - patch.rv * 1.3);
        const z = l.project(patch.u + patch.ru * 1.3, patch.v + patch.rv * 1.3);
        g.save(); g.clip(path); g.globalAlpha = opacity * .70;
        if (d) g.drawImage(im, patch.sx * d.width, patch.sy * d.height, .066 * d.width, .080 * d.height, a.x, a.y, z.x - a.x, z.y - a.y);
        else this._fallback(g, { x: a.x, y: a.y, width: z.x - a.x, height: z.y - a.y });
        g.fillStyle = 'rgba(146,125,91,.08)'; g.fillRect(a.x, a.y, z.x - a.x, z.y - a.y); g.restore();
      }
      g.restore();

      // The loose coat is a separate native surface. Brush marks erase this
      // coat with a feathered grain boundary while the hard matrix stays intact.
      if (dustClear < .999 || this._brushes.length) {
        const dust = this._buffer('_dust', r), dg = dust.ctx;
        dg.save(); dg.clip(shape);
        dg.fillStyle = `rgba(190,174,144,${.34 * (1 - dustClear)})`; dg.fillRect(r.x, r.y, r.width, r.height);
        const strideDust = this.width < 700 ? 2 : 1;
        for (let i = 0; i < this._dustPoints.length; i += strideDust) {
          const grain = this._dustPoints[i], q = l.project(grain.u, grain.v);
          dg.fillStyle = grain.tone > .58 ? `rgba(239,227,198,${grain.opacity * (1 - dustClear)})` : `rgba(91,77,51,${grain.opacity * (1 - dustClear)})`;
          dg.fillRect(q.x, q.y, grain.radius, grain.radius * .7);
        }
        dg.restore();
        if (this._brushes.length) {
          const mask = this._paintBrushMask(r);
          dg.save(); dg.globalCompositeOperation = 'destination-out'; dg.drawImage(mask, 0, 0, mask.width, mask.height, r.x, r.y, r.width, r.height); dg.restore();
        }
        g.save(); g.filter = 'blur(3px)';
        g.drawImage(dust.canvas, 0, 0, dust.canvas.width, dust.canvas.height, r.x, r.y, r.width, r.height);
        g.restore();
      }

      // The emerging contour is intermittent and extremely thin, acting as a
      // material edge rather than an instructional overlay around the entire rock.
      const trace = smooth(.24, .76, reveal) * (1 - smooth(.88, 1, reveal));
      if (trace > 0) {
        g.save(); g.globalAlpha = trace * .25; g.strokeStyle = '#ece3d1'; g.lineWidth = .75;
        g.setLineDash([26, 39, 8, 54]); g.stroke(shape); g.restore();
      }
      this._feather(g, r, .08);
      this._composite(b.canvas, r);
    }
  }

  root.FossilGeology = FossilGeology;
})(typeof window !== 'undefined' ? window : globalThis);
