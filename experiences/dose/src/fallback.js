const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const finite = (v, fallback = 0) => Number.isFinite(v) ? v : fallback;
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
function seeded(seed) {
  let n = seed >>> 0;
  return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; };
}
function path(ctx, points) {
  ctx.beginPath();
  points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
  ctx.closePath();
}
function polygonClip(points, nx, ny, distance) {
  const out = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    const da = a[0] * nx + a[1] * ny - distance;
    const db = b[0] * nx + b[1] * ny - distance;
    if (da <= 0) out.push(a);
    if ((da <= 0) !== (db <= 0)) {
      const t = da / (da - db);
      out.push([mix(a[0], b[0], t), mix(a[1], b[1], t)]);
    }
  }
  return out;
}

/**
 * Deterministic Canvas 2D diagrams for initial loading and unavailable WebGL.
 * This renderer owns no RAF, clock, input handler or network request. Root DOM
 * owns all words and controls. Every scientific view is an illustrative model.
 */
export class DoseFallback {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext?.('2d', { alpha: true }) || null;
    this.failed = !this.ctx;
    this.disposed = false;
    this.width = this.height = 1;
    this.pixelRatio = 1;
    this.drawCount = 0;
    this.renderCount = 0;
    this._dirty = true;
    this._key = '';
    const rng = seeded(613917);
    this.grains = Array.from({ length: 620 }, (_, i) => {
      const angle = rng() * TAU, radius = Math.sqrt(rng());
      return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius,
        u: rng(), v: rng(), w: rng(), angle, radius,
        size: .006 + Math.pow(rng(), 1.65) * .025,
        type: i % 17 < 3 ? 0 : i % 17 < 14 ? 1 : 2 };
    });
    this.pores = Array.from({ length: 460 }, () => {
      const a = rng() * TAU, r = Math.sqrt(rng()) * .972;
      return { x: Math.cos(a) * r, y: Math.sin(a) * r, size: .002 + rng() * .006, shade: rng() };
    });
    // Voronoi fracture cells preserve one circular parent tablet before breakup.
    const sites = [[-.62, -.18], [-.26, .24], [.04, -.24], [.41, .06], [.76, -.08], [.13, .36], [-.68, .21]];
    const outline = Array.from({ length: 80 }, (_, i) => [Math.cos(i / 80 * TAU) * .94, Math.sin(i / 80 * TAU) * .45]);
    this.fragments = sites.map((site, i) => {
      let poly = outline.map(p => [...p]);
      sites.forEach((other, j) => {
        if (i === j || !poly.length) return;
        const nx = other[0] - site[0], ny = other[1] - site[1];
        const distance = (other[0] ** 2 + other[1] ** 2 - site[0] ** 2 - site[1] ** 2) / 2;
        poly = polygonClip(poly, nx, ny, distance);
      });
      return { poly, x: site[0], y: site[1], rotation: (rng() - .5) * .28 };
    });
    this.resize(canvas?.clientWidth || 1, canvas?.clientHeight || 1, 1);
    this.update();
  }

  resize(width, height, dpr = 1) {
    if (this.disposed) return;
    this.width = Math.max(1, finite(width, 1));
    this.height = Math.max(1, finite(height, 1));
    this.compact = this.width < 700 || this.height > this.width;
    this.pixelRatio = Math.min(Math.max(.1, finite(dpr, 1)), 1.5, Math.sqrt(2400000 / (this.width * this.height)));
    const w = Math.max(1, Math.round(this.width * this.pixelRatio));
    const h = Math.max(1, Math.round(this.height * this.pixelRatio));
    if (this.canvas && (this.canvas.width !== w || this.canvas.height !== h)) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this._dirty = true;
  }

  update({ scene = 0, local = 0, transition = 0, time = 0, pointer = {}, observeDepth = .35, motion = true, quality = 'high' } = {}) {
    if (this.disposed) return;
    const index = clamp(Math.floor(finite(scene)), 0, 6);
    const moving = Boolean(motion);
    // An idle fallback needs at most twelve small motion steps per second.
    // Scroll, input and resize changes invalidate the drawing immediately.
    const state = {
      scene: index, local: clamp(finite(local)), transition: index < 6 ? clamp(finite(transition)) : 0,
      time: moving ? Math.floor(finite(time) * 12) / 12 : 0,
      px: moving ? clamp(finite(pointer?.x), -1, 1) : 0,
      py: moving ? clamp(finite(pointer?.y), -1, 1) : 0,
      observeDepth: clamp(finite(observeDepth, .35)), motion: moving,
      quality: quality === 'low' ? 'low' : 'high',
    };
    const q = (v, steps) => Math.round(v * steps);
    const key = [index, q(state.local, 1000), q(state.transition, 1000), state.time,
      q(state.px, 150), q(state.py, 150), index === 5 || index === 4 ? q(state.observeDepth, 1000) : 0, state.quality].join('|');
    this.state = state;
    this.activeScene = index;
    this.currentQuality = state.quality;
    if (key !== this._key) { this._key = key; this._dirty = true; }
  }

  _layout(index) {
    if (this.compact) {
      const heightFraction = index === 5 ? .23 : .28;
      return { x: this.width * .5, y: this.height * (index === 5 ? .49 : .56),
        unit: Math.min(this.width * .82 / 2.25, this.height * heightFraction / 1.8) };
    }
    return { x: this.width * .70, y: this.height * .52,
      unit: Math.min(this.width * .44 / 2.2, this.height * .58 / 1.8) };
  }

  _ellipse(ctx, x, y, rx, ry, fill, stroke = null, lineWidth = .003) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
    this.drawCount++;
  }

  _gradient(ctx, x1, y1, x2, y2, stops) {
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    stops.forEach(([position, color]) => g.addColorStop(position, color));
    return g;
  }

  _shadow(ctx, x = .03, y = .66, rx = .82, ry = .085, dark = false) {
    ctx.save(); ctx.translate(x, y); ctx.scale(rx, ry);
    const g = ctx.createRadialGradient(0, 0, .02, 0, 0, 1);
    g.addColorStop(0, dark ? 'rgba(1,10,7,.30)' : 'rgba(39,48,40,.20)');
    g.addColorStop(.52, dark ? 'rgba(1,10,7,.11)' : 'rgba(39,48,40,.075)');
    g.addColorStop(1, 'rgba(39,48,40,0)');
    this._ellipse(ctx, 0, 0, 1, 1, g); ctx.restore();
  }

  _texture(ctx, rx, ry, y = 0, macro = false, opacity = 1) {
    const stride = this.currentQuality === 'low' ? 3 : 1;
    ctx.save();
    ctx.beginPath(); ctx.ellipse(0, y, rx, ry, 0, 0, TAU); ctx.clip();
    ctx.globalAlpha *= opacity;
    for (let i = 0; i < this.pores.length; i += stride) {
      const p = this.pores[i], size = p.size * (macro ? 2.35 : 1);
      const x = p.x * rx, py = p.y * ry + y;
      this._ellipse(ctx, x, py, size, size * .63,
        p.shade > .56 ? 'rgba(119,122,106,.26)' : 'rgba(151,151,130,.17)');
      if (p.shade > .63) this._ellipse(ctx, x - size * .22, py - size * .28, size * .67, size * .33, 'rgba(255,255,246,.58)');
    }
    ctx.restore();
  }

  _tablet(ctx, { rx = .95, ry = .46, thickness = .16, macro = false } = {}) {
    const y = -.075;
    ctx.beginPath(); ctx.moveTo(-rx, y); ctx.lineTo(-rx, y + thickness);
    ctx.ellipse(0, y + thickness, rx, ry, 0, Math.PI, 0, true);
    ctx.lineTo(rx, y); ctx.ellipse(0, y, rx, ry, 0, 0, Math.PI);
    ctx.closePath();
    ctx.fillStyle = this._gradient(ctx, -.55, -.15, .3, .65,
      [[0, '#e5e4d9'], [.42, '#d2d3c6'], [1, '#aeb7a8']]);
    ctx.fill(); this.drawCount++;
    ctx.save(); ctx.clip();
    for (let i = 0; i < this.grains.length; i += 8) {
      const p = this.grains[i];
      this._ellipse(ctx, p.x * rx, .25 + p.y * .32, .0025, .0035, 'rgba(88,109,91,.16)');
    }
    ctx.restore();
    const cap = this._gradient(ctx, -.55, -.45, .7, .55,
      [[0, '#fffef4'], [.37, '#f3f1e5'], [.8, '#e3e3d5'], [1, '#ccd2c1']]);
    this._ellipse(ctx, 0, y, rx, ry, cap, 'rgba(252,253,240,.74)', .004);
    this._texture(ctx, rx, ry, y, macro);
    // Subtle front rim is the compressed tablet edge, not a coating layer.
    ctx.beginPath(); ctx.ellipse(0, y, rx * .998, ry * .999, 0, .05, Math.PI - .05);
    ctx.strokeStyle = 'rgba(150,161,140,.20)'; ctx.lineWidth = .004; ctx.stroke(); this.drawCount++;
  }

  _grain(ctx, x, y, radius, type, variation = 0) {
    if (type === 0) {
      const pts = [[-.8, -.24], [-.31, -.95], [.48, -.74], [.89, .21], [.16, .89], [-.64, .56]];
      ctx.save(); ctx.translate(x, y); ctx.rotate(variation * 3);
      path(ctx, pts.map(p => [p[0] * radius, p[1] * radius]));
      ctx.fillStyle = '#96b7a9'; ctx.fill();
      path(ctx, [[-.8 * radius, -.24 * radius], [-.31 * radius, -.95 * radius], [.14 * radius, -.1 * radius], [.16 * radius, .89 * radius]]);
      ctx.fillStyle = '#bfd0c2'; ctx.fill();
      ctx.restore(); this.drawCount += 2;
    } else {
      this._ellipse(ctx, x, y, radius, radius * (.73 + variation * .32), type === 1 ? '#e8e8db' : '#acb5a7');
      if (radius > .016) this._ellipse(ctx, x - radius * .25, y - radius * .25, radius * .45, radius * .30,
        type === 1 ? 'rgba(255,255,247,.78)' : 'rgba(218,222,207,.45)');
    }
  }

  _hero(ctx, state) {
    this._shadow(ctx);
    ctx.save(); ctx.rotate(-.39 + state.px * .012);
    this._tablet(ctx); ctx.restore();
  }

  _materials(ctx, state) {
    this._shadow(ctx, 0, .66, .87, .08);
    // A porous excipient agglomerate, an angular ingredient crystal and fine aids.
    const blobs = [[-.36, .05, .42, 1], [.47, -.26, .28, 0], [.49, .37, .17, 2]];
    blobs.forEach(([x, y, radius, type], index) => {
      const drift = state.motion ? Math.sin(state.time * .32 + index) * .005 : 0;
      if (type === 0) {
        this._grain(ctx, x, y + drift, radius, 0, .14);
        this._grain(ctx, x + .18, y + .18 + drift, .13, 0, .74);
        this._grain(ctx, x - .17, y - .11 + drift, .095, 0, .51);
      } else {
        const g = this._gradient(ctx, x - radius, y - radius, x + radius, y + radius,
          [[0, type === 1 ? '#fffff3' : '#d4d8c8'], [1, type === 1 ? '#cbd2be' : '#9fab98']]);
        const pts = Array.from({ length: 22 }, (_, i) => {
          const a = i / 22 * TAU, r = radius * (1 + Math.sin(i * 3.7) * .08);
          return [x + Math.cos(a) * r, y + Math.sin(a) * r * .85 + drift];
        });
        path(ctx, pts); ctx.fillStyle = g; ctx.fill(); this.drawCount++;
        ctx.save(); ctx.clip();
        this.grains.slice(0, type === 1 ? 150 : 36).forEach(p => {
          this._grain(ctx, x + p.x * radius, y + p.y * radius * .83 + drift,
            radius * (.024 + p.u * .047), type, p.v);
        }); ctx.restore();
      }
    });
    for (let i = 0; i < 48; i++) {
      const p = this.grains[i];
      this._grain(ctx, p.x * .93, .34 + p.y * .22, .006 + p.u * .018, p.type, p.v);
    }
  }

  _powder(ctx, state) {
    this._shadow(ctx, .06, .67, .86, .07);
    const blend = smooth(.08, .68, state.local);
    ctx.save(); ctx.rotate(-.18);
    ctx.beginPath(); ctx.moveTo(-.68, -.37); ctx.lineTo(.68, -.37);
    ctx.ellipse(.68, 0, .24, .37, 0, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(-.68, .37); ctx.ellipse(-.68, 0, .24, .37, 0, Math.PI / 2, Math.PI * 1.5);
    ctx.closePath();
    ctx.fillStyle = 'rgba(216,222,204,.11)'; ctx.fill();
    ctx.strokeStyle = 'rgba(100,132,112,.20)'; ctx.lineWidth = .003; ctx.stroke();
    ctx.save(); ctx.clip();
    const stride = state.quality === 'low' ? 3 : 1;
    for (let i = 0; i < this.grains.length; i += stride) {
      const p = this.grains[i];
      const tx = (p.u - .5) * 1.37 + Math.cos(p.angle) * p.radius * .19;
      const ty = Math.sin(p.angle) * p.radius * .35;
      const sx = p.type === 0 ? -.70 + p.u * .47 : -.17 + p.u * .90;
      const x = mix(sx, tx, blend), y = mix(p.y * .29, ty, blend);
      this._grain(ctx, x, y, p.size * 1.25, p.type, p.v);
    }
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(.68, 0, .24, .37, 0, -Math.PI / 2, Math.PI / 2);
    ctx.strokeStyle = 'rgba(79,114,92,.24)'; ctx.lineWidth = .003; ctx.stroke();
    ctx.restore(); this.drawCount += 3;
  }

  _metal(ctx, x, y, width, height) {
    ctx.fillStyle = this._gradient(ctx, x, y, x + width, y,
      [[0, '#7f9990'], [.15, '#aebdb0'], [.45, '#d9ded2'], [.64, '#b4c0b3'], [1, '#748d83']]);
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = 'rgba(57,90,73,.40)'; ctx.lineWidth = .004; ctx.strokeRect(x, y, width, height);
    this.drawCount += 2;
  }

  _press(ctx, state) {
    const p = state.local;
    const approach = smooth(.12, .38, p), compressed = smooth(.42, .55, p);
    const retract = smooth(.60, .70, p), eject = smooth(.67, .81, p);
    const lowerTop = .34 - compressed * .055 - eject * .45;
    const upperBottom = mix(-.39, -.035, approach) + compressed * .19 - retract * .66;
    const formed = smooth(.43, .57, p);
    // The cavity walls remain fixed: pressure closes a powder bed, never a melt.
    this._metal(ctx, -.71, -.11, .28, .49);
    this._metal(ctx, .43, -.11, .28, .49);
    ctx.strokeStyle = 'rgba(81,112,90,.22)'; ctx.lineWidth = .003;
    for (let i = 0; i < 5; i++) {
      const y = -.085 + i * .095;
      ctx.beginPath(); ctx.moveTo(-.68, y); ctx.lineTo(-.47, y + .10);
      ctx.moveTo(.47, y); ctx.lineTo(.68, y + .10); ctx.stroke();
    }
    this._metal(ctx, -.405, lowerTop, .81, .76 - lowerTop);
    this._metal(ctx, -.405, upperBottom - .41, .81, .41);
    this._metal(ctx, -.53, upperBottom - .48, 1.06, .085);
    if (formed < .999) {
      ctx.save(); ctx.globalAlpha *= 1 - formed;
      const bedHeight = mix(.35, .13, compressed);
      ctx.beginPath(); ctx.rect(-.40, lowerTop - bedHeight, .80, bedHeight); ctx.clip();
      for (let i = 0; i < 250; i += state.quality === 'low' ? 2 : 1) {
        const g = this.grains[i];
        this._grain(ctx, (g.u - .5) * .80, lowerTop - g.v * bedHeight, .013 + g.w * .018, g.type, g.w);
      }
      ctx.restore();
    }
    if (formed > 0) {
      ctx.save(); ctx.globalAlpha *= formed;
      ctx.translate(0, lowerTop - .030);
      this._tablet(ctx, { rx: .402, ry: .025, thickness: .080 });
      ctx.restore();
    }
    ctx.strokeStyle = 'rgba(105,129,107,.32)'; ctx.lineWidth = .003;
    ctx.beginPath(); ctx.moveTo(-.81, .39); ctx.lineTo(.81, .39); ctx.stroke();
    this.drawCount += 6;
  }

  _surface(ctx, state) {
    this._shadow(ctx, .07, .70, .86, .055);
    ctx.save(); ctx.rotate(-.15 + state.px * .01); ctx.translate(.015, .01);
    this._tablet(ctx, { rx: 1.03, ry: .55, thickness: .125, macro: true });
    // Raking light is a translucent material sheen, not a scanner or glow.
    const g = this._gradient(ctx, -.85, -.5, .5, .45,
      [[0, 'rgba(255,255,247,.28)'], [.4, 'rgba(255,255,247,.02)'], [1, 'rgba(61,88,68,.045)']]);
    this._ellipse(ctx, 0, -.075, 1.03, .55, g);
    ctx.restore();
  }

  _evidence(ctx, state) {
    this._shadow(ctx, .06, .70, .85, .08, true);
    ctx.save(); ctx.rotate(-.13);
    const cut = mix(.84, -.48, state.observeDepth), radius = .96;
    const span = Math.sqrt(Math.max(0, radius * radius - cut * cut));
    const start = Math.acos(cut / radius);
    const project = (x, y, z) => [x + z * .34, z * .45 - y];
    const top = [], bottom = [], frontTop = [], frontBottom = [];
    for (let i = 0; i <= 84; i++) {
      const a = mix(start, TAU - start, i / 84);
      const x = Math.cos(a) * radius, z = Math.sin(a) * radius;
      top.push(project(x, .125, z)); bottom.push(project(x, -.125, z));
      if (z >= 0) { frontTop.push(project(x, .125, z)); frontBottom.push(project(x, -.125, z)); }
    }
    if (frontTop.length) {
      path(ctx, [...frontTop, ...frontBottom.reverse()]);
      ctx.fillStyle = '#bac7b2'; ctx.fill(); this.drawCount++;
    }
    path(ctx, top);
    ctx.fillStyle = this._gradient(ctx, -.7, -.4, .5, .5, [[0, '#fffef0'], [1, '#d5dec9']]);
    ctx.fill(); ctx.strokeStyle = 'rgba(235,241,218,.65)'; ctx.lineWidth = .004; ctx.stroke();
    ctx.save(); ctx.clip();
    for (let i = 0; i < this.pores.length; i += state.quality === 'low' ? 4 : 2) {
      const p = this.pores[i], xy = project(p.x * radius, .125, p.y * radius);
      this._ellipse(ctx, xy[0], xy[1], p.size, p.size * .6, 'rgba(102,128,93,.25)');
    }
    ctx.restore();
    // A real chord at x=cut creates a changing interior plane, not an opacity trick.
    const face = [project(cut, .125, -span), project(cut, .125, span),
      project(cut, -.125, span), project(cut, -.125, -span)];
    path(ctx, face);
    ctx.fillStyle = this._gradient(ctx, cut - .3, -.5, cut + .4, .6, [[0, '#d8dfcb'], [1, '#b5c7ad']]);
    ctx.fill(); ctx.strokeStyle = 'rgba(245,248,224,.68)'; ctx.lineWidth = .005; ctx.stroke();
    ctx.save(); ctx.clip();
    for (let i = 0; i < 180; i += state.quality === 'low' ? 2 : 1) {
      const p = this.grains[i], z = (p.u - .5) * 2 * span, height = (p.v - .5) * .25;
      const xy = project(cut, height, z);
      this._grain(ctx, xy[0], xy[1], .009 + p.w * .018, p.type, p.v);
    }
    ctx.restore(); ctx.restore(); this.drawCount += 4;
  }

  _release(ctx, state) {
    const broken = smooth(.10, .61, state.local), dispersed = smooth(.28, .86, state.local);
    for (let i = 0; i < 3; i++) {
      this._ellipse(ctx, .02, .40 + i * .047, .91 + i * .05, .145 + i * .03,
        null, `rgba(76,121,103,${.13 - i * .027})`, .003);
    }
    this._shadow(ctx, 0, .69, .84, .06);
    const reveal = smooth(.10, .24, state.local);
    ctx.save(); ctx.rotate(-.28);
    if (reveal < .999) {
      ctx.save(); ctx.globalAlpha *= 1 - reveal;
      this._tablet(ctx, { rx: .94, ry: .45, thickness: .13 }); ctx.restore();
    }
    if (reveal > .001) {
      this.fragments.forEach(fragment => {
        ctx.save(); ctx.globalAlpha *= reveal * (1 - dispersed * .16);
        const x = fragment.x * broken * .30, y = fragment.y * broken * .38 + dispersed * .035;
        ctx.translate(x, y - .075); ctx.rotate(fragment.rotation * broken);
        const scale = 1 - dispersed * .21; ctx.scale(scale, scale);
        path(ctx, fragment.poly.map(p => [p[0], p[1] + .105])); ctx.fillStyle = '#b8c4b0'; ctx.fill();
        path(ctx, fragment.poly);
        ctx.fillStyle = this._gradient(ctx, -.6, -.4, .8, .4, [[0, '#fffff2'], [1, '#dce3ce']]); ctx.fill();
        ctx.save(); ctx.clip();
        for (let i = 0; i < this.pores.length; i += state.quality === 'low' ? 7 : 3) {
          const p = this.pores[i]; this._ellipse(ctx, p.x * .94, p.y * .45, p.size, p.size * .6, 'rgba(113,139,98,.25)');
        }
        ctx.restore(); ctx.restore(); this.drawCount += 2;
      });
    }
    ctx.restore();
    const dust = smooth(.19, .48, state.local);
    if (dust > 0) {
      ctx.save(); ctx.globalAlpha *= dust * .88;
      for (let i = 0; i < 110; i += state.quality === 'low' ? 2 : 1) {
        const p = this.grains[i];
        const radius = .46 + p.u * .50 + dispersed * .035;
        const x = Math.cos(p.angle) * radius;
        const y = Math.sin(p.angle) * radius * .55 + .03 + dispersed * .07;
        this._grain(ctx, x, y, .007 + p.w * .014, p.type, p.v);
      }
      ctx.restore();
    }
  }

  _scene(index, local, alpha, handoff, incoming = false, frame = null) {
    if (alpha <= .001) return;
    const ctx = this.ctx, state = { ...this.state, local }, layout = frame || this._layout(index);
    const breathing = state.motion ? Math.sin(state.time * .36) * .002 : 0;
    const scale = 1;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.translate(layout.x + state.px * layout.unit * .012,
      layout.y + state.py * layout.unit * .008 + breathing * layout.unit);
    const pressFit = index === 3 && this.compact ? .90 : 1;
    ctx.scale(layout.unit * scale * pressFit, layout.unit * scale * pressFit);
    [this._hero, this._materials, this._powder, this._press, this._surface, this._evidence, this._release][index].call(this, ctx, state);
    ctx.restore();
  }

  render() {
    if (this.disposed || this.failed || !this._dirty || !this.ctx) return;
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    this.drawCount = 0;
    const { scene, local, transition } = this.state;
    const from = this._layout(scene), to = this._layout(Math.min(6, scene + 1));
    const frame = { x: mix(from.x, to.x, transition), y: mix(from.y, to.y, transition),
      unit: mix(from.unit, to.unit, transition) };
    this._scene(scene, local, 1 - transition, transition, false, frame);
    if (transition > 0 && scene < 6) this._scene(scene + 1, 0, transition, 0, true, frame);
    this.renderCount++;
    this._dirty = false;
  }

  getStats() {
    return { webgl: false, renderer: 'canvas2d', quality: this.currentQuality || 'high',
      activeScene: this.activeScene || 0, width: this.width, height: this.height,
      pixelRatio: this.pixelRatio, drawCalls: this.drawCount, renderCount: this.renderCount,
      renderWidth: this.canvas?.width || 0, renderHeight: this.canvas?.height || 0,
      particles: this.currentQuality === 'low' ? 207 : 620, cached: !this._dirty, failed: this.failed };
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.grains.length = 0; this.pores.length = 0; this.fragments.length = 0;
    this.ctx = null;
  }
}
