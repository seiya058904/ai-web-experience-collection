/**
 * The liquid chapters are deterministic views of one supplied scene state.
 * Coordinates are CSS pixels; the root owns DPR, compositing and the clock.
 * Photographic plates provide surface detail, never a baked interface.
 */

const TAU = Math.PI * 2;
const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const mix = (a, b, t) => a + (b - a) * t;
const fract = n => n - Math.floor(n);
const smooth = (a, b, n) => {
  const t = clamp((n - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function surfaceCanvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

function makeGrain() {
  const canvas = surfaceCanvas(256, 256);
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  const pixels = ctx.createImageData(256, 256);
  let seed = 197703;
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const noise = seed / 4294967296;
      const striation = Math.sin(x * .37 + Math.sin(y * .025) * 2.3) * 11;
      const value = clamp(68 + noise * 119 + striation, 0, 255);
      const i = (y * 256 + x) * 4;
      pixels.data[i] = value;
      pixels.data[i + 1] = value + 2;
      pixels.data[i + 2] = value + 4;
      pixels.data[i + 3] = 88;
    }
  }
  ctx.putImageData(pixels, 0, 0);
  return canvas;
}

function imageSize(image) {
  return {
    w: image?.naturalWidth || image?.width || 1672,
    h: image?.naturalHeight || image?.height || 941,
  };
}

function ready(image) {
  return image && image.complete !== false
    && (image.naturalWidth || image.width || 0) > 0
    && (image.naturalHeight || image.height || 0) > 0;
}

function photoFrame(s, kind) {
  const w = Math.max(1, s.w);
  const h = Math.max(1, s.h);
  const p = clamp(s.local || 0);
  const mobile = !!s.mobile;
  const size = imageSize(s.images?.[kind]);
  const regionY = kind === 'feed' && mobile ? h * .235 : 0;
  const regionH = kind === 'feed' && mobile ? h * .86 : h;
  const focus = kind === 'reservoir' ? (mobile ? .765 : .5) : (mobile ? .575 : .5);
  const zoom = 1.012 + smooth(.38, 1, p) * (kind === 'feed' ? .047 : .025);
  const scale = Math.max(w / size.w, regionH / size.h) * zoom;
  const pointer = s.reduced ? 0 : clamp(s.pointer?.x || 0, -1, 1);
  return {
    x: (w - size.w * scale) * focus + pointer * (mobile ? 0 : 2.4),
    y: regionY + (regionH - size.h * scale) * .5,
    scale, iw: size.w, ih: size.h,
  };
}

function photoPoint(frame, x, y) {
  return { x: frame.x + x * frame.scale, y: frame.y + y * frame.scale };
}

function feedPoint(u, iw = 1672, ih = 941) {
  const v = 1 - u;
  const p0 = { x: .102 * iw, y: 1.012 * ih };
  const p1 = { x: .417 * iw, y: .667 * ih };
  const p2 = { x: .732 * iw, y: .322 * ih };
  const p3 = { x: 1.047 * iw, y: -.023 * ih };
  return {
    x: v * v * v * p0.x + 3 * v * v * u * p1.x + 3 * v * u * u * p2.x + u * u * u * p3.x,
    y: v * v * v * p0.y + 3 * v * v * u * p1.y + 3 * v * u * u * p2.y + u * u * u * p3.y,
  };
}

function feedNormal(u, iw, ih) {
  const a = feedPoint(clamp(u - .001), iw, ih);
  const b = feedPoint(clamp(u + .001), iw, ih);
  const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { x: (b.y - a.y) / d, y: -(b.x - a.x) / d };
}

function traceFeed(ctx, a, b, iw, ih, offset = 0) {
  const count = Math.max(8, Math.ceil(Math.abs(b - a) * 80));
  ctx.beginPath();
  for (let i = 0; i <= count; i++) {
    const u = mix(a, b, i / count);
    const pt = feedPoint(u, iw, ih);
    const normal = feedNormal(u, iw, ih);
    const x = pt.x + normal.x * offset;
    const y = pt.y + normal.y * offset;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
}

function reservoirY(u, ih, time, reduced) {
  const bow = Math.sin(Math.PI * u);
  const ripple = reduced ? 0 : Math.sin(u * TAU * 1.65 - time * .43) * 1.35
    + Math.sin(u * TAU * 3.4 + time * .21) * .45;
  return ih * (.552 - .011 * bow + .0017 * Math.sin(u * TAU)) + ripple * bow;
}

function traceReservoir(ctx, iw, ih, time, reduced, offset = 0, reverse = false) {
  const count = 76;
  for (let i = 0; i <= count; i++) {
    const u = reverse ? 1 - i / count : i / count;
    const x = mix(iw * .051, iw * .967, u);
    const y = reservoirY(u, ih, time, reduced) + offset;
    if (i === 0 && !reverse) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
}

function opticalPocket(ctx, x, y, rx, ry, strength = 1, rotation = 0) {
  if (rx < .1 || ry < .1 || strength <= 0) return;
  ctx.save();
  ctx.globalAlpha *= strength;
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.save();
  ctx.scale(1, ry / rx);
  const glass = ctx.createRadialGradient(-rx * .23, -rx * .32, rx * .045, 0, 0, rx * 1.045);
  glass.addColorStop(0, 'rgba(212,227,237,.16)');
  glass.addColorStop(.48, 'rgba(8,16,25,.40)');
  glass.addColorStop(.71, 'rgba(3,10,18,.69)');
  glass.addColorStop(.85, 'rgba(127,155,179,.31)');
  glass.addColorStop(.94, 'rgba(197,213,225,.63)');
  glass.addColorStop(1, 'rgba(2,6,11,.86)');
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, TAU);
  ctx.fillStyle = glass;
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.moveTo(-rx * .90, -ry * .39);
  ctx.bezierCurveTo(-rx * .48, -ry * 1.04, rx * .18, -ry * .91, rx * .64, -ry * .54);
  ctx.bezierCurveTo(rx * .08, -ry * .70, -rx * .46, -ry * .78, -rx * .90, -ry * .39);
  ctx.fillStyle = 'rgba(227,236,240,.54)';
  ctx.fill();

  const rim = ctx.createLinearGradient(-rx, -ry, rx, ry);
  rim.addColorStop(0, 'rgba(110,141,170,.3)');
  rim.addColorStop(.26, 'rgba(232,238,238,.94)');
  rim.addColorStop(.43, 'rgba(90,116,142,.17)');
  rim.addColorStop(.67, 'rgba(5,10,16,.82)');
  rim.addColorStop(1, 'rgba(178,197,211,.73)');
  ctx.strokeStyle = rim;
  ctx.lineWidth = Math.max(.6, rx * .045);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(-rx * .014, -ry * .028, rx * .87, ry * .79, 0, Math.PI * 1.12, Math.PI * 1.79);
  ctx.strokeStyle = 'rgba(236,240,239,.83)';
  ctx.lineWidth = Math.max(.55, rx * .025);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-rx * .96, -ry * .05);
  ctx.bezierCurveTo(-rx * .50, -ry * .50, rx * .39, ry * .50, rx * .98, ry * .11);
  ctx.bezierCurveTo(rx * .60, ry * .74, -rx * .35, -ry * .08, -rx * .96, -ry * .05);
  ctx.fillStyle = 'rgba(4,9,15,.72)';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-rx * .93, -ry * .11);
  ctx.bezierCurveTo(-rx * .39, -ry * .32, rx * .55, ry * .38, rx * .93, ry * .12);
  ctx.strokeStyle = 'rgba(207,216,224,.56)';
  ctx.lineWidth = Math.max(.6, rx * .024);
  ctx.stroke();
  ctx.restore();
}

function balanceGeometry(s) {
  const w = s.w;
  const h = s.h;
  const mobile = !!s.mobile;
  const top = mobile ? h * .34 : -h * .18;
  const bottom = h * 1.18;
  const left = w * (mobile ? .057 : .429);
  const width = w * (mobile ? .98 : .487);
  const bend = w * (mobile ? .084 : .073);
  return {
    top, bottom, left, width,
    x(u, y) {
      const v = clamp((y - top) / (bottom - top));
      return left + width * u * (.94 + .145 * v)
        - bend * Math.pow(v, 1.65) + Math.sin(v * Math.PI) * width * .018;
    },
  };
}

function stripPath(g, u0, u1, y0 = g.top, y1 = g.bottom, count = 52) {
  const path = new Path2D();
  for (let i = 0; i <= count; i++) {
    const y = mix(y0, y1, i / count);
    if (!i) path.moveTo(g.x(u0, y), y);
    else path.lineTo(g.x(u0, y), y);
  }
  for (let i = count; i >= 0; i--) {
    const y = mix(y0, y1, i / count);
    path.lineTo(g.x(u1, y), y);
  }
  path.closePath();
  return path;
}

function traceChannelEdge(ctx, g, u, a = g.top, b = g.bottom, time = 0, ripple = 0) {
  ctx.beginPath();
  for (let i = 0; i <= 64; i++) {
    const t = i / 64;
    const y = mix(a, b, t);
    const x = g.x(u + Math.sin(t * TAU * 1.8 - time) * ripple, y);
    if (!i) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
}

export class FluidScenes {
  constructor() {
    this.w = 1;
    this.h = 1;
    this.mobile = false;
    this.dpr = 1;
    this.grain = makeGrain();
    this.patterns = new WeakMap();
    this.materialImage = null;
    this.materialTexture = null;
    this.materialPatterns = new WeakMap();
  }

  resize(w, h, mobile = false, dpr = 1) {
    this.w = Math.max(1, w);
    this.h = Math.max(1, h);
    this.mobile = !!mobile;
    this.dpr = clamp(dpr, 1, 3);
  }

  dispose() {
    for (const name of ['grain', 'materialTexture']) {
      if (this[name]) this[name].width = this[name].height = 0;
      this[name] = null;
    }
    this.materialImage = null;
    this.patterns = new WeakMap(); this.materialPatterns = new WeakMap();
  }

  state(s) {
    return {
      ...s,
      w: Math.max(1, s.w || this.w),
      h: Math.max(1, s.h || this.h),
      mobile: s.mobile ?? this.mobile,
      time: s.reduced ? 0 : (s.time || 0),
      local: clamp(s.local || 0),
    };
  }

  grainFill(ctx, path, amount = .4) {
    if (!this.grain) return;
    let pattern = this.patterns.get(ctx);
    if (!pattern) {
      pattern = ctx.createPattern(this.grain, 'repeat');
      if (!pattern) return;
      this.patterns.set(ctx, pattern);
    }
    ctx.save();
    ctx.globalAlpha *= amount;
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = pattern;
    ctx.fill(path);
    ctx.restore();
  }

  prepareMaterial(image) {
    if (!ready(image) || this.materialImage === image) return;
    const canvas = surfaceCanvas(192, 192);
    if (!canvas) return;
    const { w, h } = imageSize(image);
    // One dry, uninterrupted ebonite patch supplies grain, not scene geometry.
    canvas.getContext('2d').drawImage(image, w * .622, h * .485, w * .038, h * .038, 0, 0, 192, 192);
    this.materialImage = image;
    this.materialTexture = canvas;
    this.materialPatterns = new WeakMap();
  }

  materialFill(ctx, path, amount = .48) {
    if (!this.materialTexture) return;
    let pattern = this.materialPatterns.get(ctx);
    if (!pattern) {
      pattern = ctx.createPattern(this.materialTexture, 'repeat');
      if (!pattern) return;
      this.materialPatterns.set(ctx, pattern);
    }
    ctx.save();
    ctx.globalAlpha *= amount;
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = pattern;
    ctx.fill(path);
    ctx.restore();
  }

  reservoir(ctx, input) {
    const s = this.state(input);
    const frame = photoFrame(s, 'reservoir');
    const { iw, ih } = frame;
    ctx.save();
    if (ready(s.images?.reservoir)) {
      ctx.drawImage(s.images.reservoir, frame.x, frame.y, iw * frame.scale, ih * frame.scale);
    }
    ctx.translate(frame.x, frame.y);
    ctx.scale(frame.scale, frame.scale);

    // The existing photographic meniscus and the live interface share coordinates.
    const pool = ctx.createLinearGradient(0, ih * .525, 0, ih * .585);
    pool.addColorStop(0, 'rgba(3,10,20,0)');
    pool.addColorStop(.34, 'rgba(12,29,46,.11)');
    pool.addColorStop(.61, 'rgba(2,15,33,.38)');
    pool.addColorStop(1, 'rgba(2,6,13,0)');
    ctx.beginPath();
    traceReservoir(ctx, iw, ih, s.time, s.reduced, -12);
    traceReservoir(ctx, iw, ih, s.time, s.reduced, 29, true);
    ctx.closePath();
    ctx.fillStyle = pool;
    ctx.fill();

    const surfaceLight = ctx.createLinearGradient(iw * .05, 0, iw * .967, 0);
    surfaceLight.addColorStop(0, 'rgba(70,93,110,0)');
    surfaceLight.addColorStop(.13, 'rgba(133,166,188,.28)');
    surfaceLight.addColorStop(.33, 'rgba(213,230,238,.64)');
    surfaceLight.addColorStop(.50, 'rgba(166,190,208,.30)');
    surfaceLight.addColorStop(.76, 'rgba(202,220,232,.60)');
    surfaceLight.addColorStop(1, 'rgba(130,151,173,0)');
    ctx.beginPath();
    traceReservoir(ctx, iw, ih, s.time, s.reduced, -1.8);
    ctx.strokeStyle = surfaceLight;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    traceReservoir(ctx, iw, ih, s.time * .7 + .8, s.reduced, 6.2);
    ctx.strokeStyle = 'rgba(41,79,117,.32)';
    ctx.lineWidth = 2.7;
    ctx.stroke();

    // Only an attached packet of replacement air travels through the liquid.
    // It is removed at the free surface, never rendered floating in the air space.
    const cycle = s.reduced ? .45 : fract(s.time / 11.8 + .23);
    const active = cycle < .74;
    const rise = cycle / .74;
    const sourceU = s.mobile ? .802 : .842;
    const airX = iw * sourceU;
    const surfaceU = clamp((sourceU - .051) / .916);
    const boundaryY = reservoirY(surfaceU, ih, s.time, s.reduced);
    if (active) {
      const envelope = s.reduced ? .82 : smooth(0, .12, rise) * (1 - smooth(.86, 1, rise));
      const y = mix(ih * .949, boundaryY + 7, rise);
      const drift = s.reduced ? 0 : Math.sin(rise * Math.PI) * 6.5;
      opticalPocket(ctx, airX + drift, y, 11.8 * envelope, 13.4 * envelope, .72);
    }
    const release = s.reduced ? 0 : smooth(.63, .74, cycle) * (1 - smooth(.74, .89, cycle));
    if (release > .001) {
      ctx.save();
      ctx.globalAlpha *= release * .44;
      ctx.beginPath();
      ctx.ellipse(airX, boundaryY + 1, mix(16, 55, clamp((cycle - .63) / .26)), 2.2, 0, 0, TAU);
      ctx.strokeStyle = 'rgba(197,214,226,.63)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    if (s.mobile) this.topVeil(ctx, s, .39, .61, .9);
  }

  feed(ctx, input) {
    const s = this.state(input);
    const frame = photoFrame(s, 'feed');
    const { iw, ih } = frame;
    ctx.save();
    if (ready(s.images?.feed)) {
      ctx.drawImage(s.images.feed, frame.x, frame.y, iw * frame.scale, ih * frame.scale);
    }
    ctx.translate(frame.x, frame.y);
    ctx.scale(frame.scale, frame.scale);

    // The direction parameter runs from the downstream tip toward the reservoir.
    // Moving highlights therefore travel toward decreasing u, not through the fins.
    traceFeed(ctx, 0, 1, iw, ih);
    ctx.strokeStyle = 'rgba(4,21,40,.38)';
    ctx.lineWidth = 8.5;
    ctx.lineCap = 'round';
    ctx.stroke();
    traceFeed(ctx, .02, .97, iw, ih, 3.8);
    ctx.strokeStyle = 'rgba(91,134,169,.24)';
    ctx.lineWidth = 1.1;
    ctx.stroke();

    const streakCount = s.mobile ? 2 : 3;
    for (let i = 0; i < streakCount; i++) {
      const u = s.reduced ? .3 + i * .25 : 1 - fract(s.time * .036 + i / streakCount + .16);
      const a = clamp(u - .059);
      const b = clamp(u + .049);
      if (b - a < .005) continue;
      const start = feedPoint(a, iw, ih);
      const end = feedPoint(b, iw, ih);
      const light = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
      light.addColorStop(0, 'rgba(138,169,198,0)');
      light.addColorStop(.2, 'rgba(91,127,160,.14)');
      light.addColorStop(.57, 'rgba(202,222,232,.60)');
      light.addColorStop(.83, 'rgba(87,139,181,.29)');
      light.addColorStop(1, 'rgba(70,116,159,0)');
      traceFeed(ctx, a, b, iw, ih, 1.8);
      ctx.strokeStyle = light;
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }

    // Small lateral wetting pockets stay attached to the main route.
    const pockets = s.mobile ? [.40, .54, .69] : [.235, .36, .49, .62, .75];
    for (let i = 0; i < pockets.length; i++) {
      const u = pockets[i];
      const a = feedPoint(u - .012, iw, ih);
      const b = feedPoint(u + .012, iw, ih);
      const pt = feedPoint(u, iw, ih);
      const n = feedNormal(u, iw, ih);
      const held = 18 + 8 * Math.sin(u * 7.2 + 1.1);
      const breath = s.reduced ? 0 : Math.sin(s.time * .31 + i * 1.7) * 1.1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(pt.x + n.x * (held + breath), pt.y + n.y * (held + breath), b.x, b.y);
      ctx.quadraticCurveTo(pt.x + n.x * 1.8, pt.y + n.y * 1.8, a.x, a.y);
      ctx.fillStyle = 'rgba(4,17,34,.33)';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(pt.x + n.x * (held + breath), pt.y + n.y * (held + breath), b.x, b.y);
      ctx.strokeStyle = 'rgba(143,176,201,.21)';
      ctx.lineWidth = .95;
      ctx.stroke();
    }
    ctx.restore();
    if (s.mobile) this.topVeil(ctx, s, .38, .57, .99);
  }

  balance(ctx, input) {
    const s = this.state(input);
    const g = balanceGeometry(s);
    this.prepareMaterial(s.images?.feed);
    const midY = (g.top + g.bottom) * .5;
    const pointerX = s.reduced || s.mobile ? 0 : clamp(s.pointer?.x || 0, -1, 1) * 2;
    ctx.save();
    ctx.translate(pointerX, 0);

    const shadow = ctx.createLinearGradient(g.left - g.width * .24, 0, g.left + g.width * .16, 0);
    shadow.addColorStop(0, 'rgba(1,4,8,0)');
    shadow.addColorStop(.60, 'rgba(0,2,5,.64)');
    shadow.addColorStop(1, 'rgba(0,2,5,0)');
    ctx.fillStyle = shadow;
    ctx.fillRect(g.left - g.width * .24, Math.max(0, g.top), g.width * .48, g.bottom - Math.max(0, g.top));

    const body = stripPath(g, 0, 1.055);
    const material = ctx.createLinearGradient(g.x(0, midY), 0, g.x(1, midY), 0);
    material.addColorStop(0, '#04080c');
    material.addColorStop(.17, '#1b2228');
    material.addColorStop(.47, '#080d13');
    material.addColorStop(.68, '#242a2d');
    material.addColorStop(1, '#05080c');
    ctx.fillStyle = material;
    ctx.fill(body);
    this.materialFill(ctx, body, .72);
    this.grainFill(ctx, body, .67);

    this.finBank(ctx, g, s, false);
    this.finBank(ctx, g, s, true);

    this.liquidPassage(ctx, g, s, .201, .435);
    this.airPassage(ctx, g, s, .588, .82);

    this.rail(ctx, g, .108, .204, 'left');
    this.rail(ctx, g, .432, .59, 'middle');
    this.rail(ctx, g, .818, .91, 'right');

    // A very thin reflected cut edge supplies scale without diagram outlines.
    for (const u of [.2025, .433, .589, .819]) {
      traceChannelEdge(ctx, g, u);
      ctx.strokeStyle = 'rgba(156,175,193,.24)';
      ctx.lineWidth = s.mobile ? .6 : .9;
      ctx.stroke();
    }
    ctx.restore();

    if (s.mobile) this.topVeil(ctx, s, .395, .535, 1);
  }

  finBank(ctx, g, s, right) {
    const count = s.mobile ? 6 : 10;
    const pitch = (g.bottom - g.top) / count;
    const outer = right ? 1.054 : 0;
    const inner = right ? .891 : .124;
    for (let i = -1; i <= count; i++) {
      const y = g.top + i * pitch + pitch * .18;
      const skew = pitch * (right ? .30 : -.31);
      const depth = pitch * .46;
      const path = new Path2D();
      path.moveTo(g.x(outer, y), y);
      path.bezierCurveTo(g.x(mix(outer, inner, .43), y + skew * .35), y + skew * .35,
        g.x(inner, y + skew), y + skew, g.x(inner, y + skew + depth * .19), y + skew + depth * .19);
      path.lineTo(g.x(inner, y + skew + depth * .69), y + skew + depth * .69);
      path.bezierCurveTo(g.x(inner, y + skew + depth), y + skew + depth,
        g.x(mix(outer, inner, .34), y + depth), y + depth,
        g.x(outer, y + depth * 1.42), y + depth * 1.42);
      path.closePath();
      const shade = ctx.createLinearGradient(0, y, 0, y + pitch * .8);
      shade.addColorStop(0, 'rgba(87,100,111,.22)');
      shade.addColorStop(.08, '#020509');
      shade.addColorStop(.68, '#010305');
      shade.addColorStop(1, '#131b22');
      ctx.fillStyle = shade;
      ctx.fill(path);
      ctx.beginPath();
      ctx.moveTo(g.x(outer, y), y);
      ctx.bezierCurveTo(g.x(mix(outer, inner, .43), y + skew * .35), y + skew * .35,
        g.x(inner, y + skew), y + skew, g.x(inner, y + skew + depth * .19), y + skew + depth * .19);
      ctx.strokeStyle = 'rgba(175,186,191,.16)';
      ctx.lineWidth = s.mobile ? .85 : 1.2;
      ctx.stroke();
    }
  }

  rail(ctx, g, u0, u1, kind) {
    const path = stripPath(g, u0, u1);
    const y = (g.top + g.bottom) * .52;
    const gradient = ctx.createLinearGradient(g.x(u0, y), 0, g.x(u1, y), 0);
    gradient.addColorStop(0, '#010509');
    gradient.addColorStop(.065, '#28333c');
    gradient.addColorStop(.14, '#151b20');
    gradient.addColorStop(.34, kind === 'middle' ? '#2b3032' : '#262e33');
    gradient.addColorStop(.64, '#141b20');
    gradient.addColorStop(.82, '#080e14');
    gradient.addColorStop(.945, '#52606a');
    gradient.addColorStop(.973, '#76808a');
    gradient.addColorStop(1, '#05090e');
    ctx.fillStyle = gradient;
    ctx.fill(path);
    this.materialFill(ctx, path, .73);
    this.grainFill(ctx, path, kind === 'middle' ? .93 : .72);

    ctx.save();
    ctx.clip(path);
    for (let i = 0; i < 13; i++) {
      const u = mix(u0, u1, fract(i * .61803398875 + .12));
      traceChannelEdge(ctx, g, u, g.top, g.bottom, i * .7, .0008);
      ctx.strokeStyle = i % 3 ? 'rgba(209,213,212,.025)' : 'rgba(2,7,12,.28)';
      ctx.lineWidth = i % 3 ? .7 : 1.2;
      ctx.stroke();
    }
    ctx.restore();
  }

  liquidPassage(ctx, g, s, u0, u1) {
    const path = stripPath(g, u0, u1);
    const y = (g.top + g.bottom) * .5;
    const a = g.x(u0, y);
    const b = g.x(u1, y);
    const liquid = ctx.createLinearGradient(a, 0, b, 0);
    liquid.addColorStop(0, '#061c33');
    liquid.addColorStop(.08, '#12314d');
    liquid.addColorStop(.18, '#010912');
    liquid.addColorStop(.53, '#020812');
    liquid.addColorStop(.79, '#071d34');
    liquid.addColorStop(.925, '#1f3c59');
    liquid.addColorStop(1, '#02060c');
    ctx.fillStyle = liquid;
    ctx.fill(path);
    ctx.save();
    ctx.clip(path);

    // The broad bands are reflected light on a continuous liquid surface.
    // They travel downstream but do not divide the ink into detached droplets.
    const ribbon = new Path2D();
    const span = g.bottom - g.top;
    const phase = s.time * .25;
    for (let i = 0; i <= 84; i++) {
      const v = i / 84;
      const yy = g.top + v * span;
      const u = u0 + .030 + Math.sin(v * TAU * 1.35 - phase) * .019
        + Math.sin(v * TAU * 2.55 - phase * .76) * .007;
      if (!i) ribbon.moveTo(g.x(u, yy), yy);
      else ribbon.lineTo(g.x(u, yy), yy);
    }
    for (let i = 84; i >= 0; i--) {
      const v = i / 84;
      const yy = g.top + v * span;
      const u = u0 + .075 + Math.sin(v * TAU * 1.35 - phase + .27) * .036
        + Math.sin(v * TAU * 2.55 - phase * .76) * .009;
      ribbon.lineTo(g.x(u, yy), yy);
    }
    ribbon.closePath();
    const reflection = ctx.createLinearGradient(a, 0, a + (b - a) * .58, 0);
    reflection.addColorStop(0, 'rgba(77,123,169,0)');
    reflection.addColorStop(.36, 'rgba(175,201,220,.48)');
    reflection.addColorStop(.57, 'rgba(79,121,158,.37)');
    reflection.addColorStop(1, 'rgba(4,14,28,0)');
    ctx.fillStyle = reflection;
    ctx.fill(ribbon);

    // Curved reflection folds cross the continuous ink film. Their ends remain
    // attached to the channel walls, unlike isolated floating droplets.
    for (let i = 0; i < 2; i++) {
      const v = s.reduced ? .34 + i * .44 : fract(s.time * .039 + i * .5 + .16);
      const yy = mix(g.top - span * .05, g.bottom + span * .05, v);
      const depth = (b - a) * .78;
      const leftU = u0 + .006;
      const rightU = u1 - .008;
      ctx.beginPath();
      ctx.moveTo(g.x(leftU, yy - depth * .96), yy - depth * .96);
      ctx.bezierCurveTo(g.x(u0 + .035, yy + depth * .84), yy + depth * .84,
        g.x(u1 - .026, yy + depth * .68), yy + depth * .68,
        g.x(rightU, yy - depth * .50), yy - depth * .50);
      ctx.lineTo(g.x(rightU, yy - depth * 1.48), yy - depth * 1.48);
      ctx.lineTo(g.x(leftU, yy - depth * 1.48), yy - depth * 1.48);
      ctx.closePath();
      const foldShade = ctx.createLinearGradient(0, yy - depth * 1.48, 0, yy + depth * .84);
      foldShade.addColorStop(0, 'rgba(0,5,13,0)');
      foldShade.addColorStop(.34, 'rgba(0,5,13,.23)');
      foldShade.addColorStop(.79, 'rgba(0,5,13,.68)');
      foldShade.addColorStop(1, 'rgba(0,5,13,.34)');
      ctx.fillStyle = foldShade;
      ctx.fill();
      const foldLight = ctx.createLinearGradient(a, yy - depth, b, yy + depth * .55);
      foldLight.addColorStop(0, 'rgba(150,189,217,0)');
      foldLight.addColorStop(.15, 'rgba(147,187,218,.64)');
      foldLight.addColorStop(.32, 'rgba(219,232,238,.90)');
      foldLight.addColorStop(.55, 'rgba(58,98,137,.22)');
      foldLight.addColorStop(.79, 'rgba(206,223,233,.74)');
      foldLight.addColorStop(1, 'rgba(145,181,206,.08)');
      for (let j = 0; j < 2; j++) {
        const offset = j * depth * .10;
        ctx.beginPath();
        ctx.moveTo(g.x(leftU, yy - depth * .96 + offset), yy - depth * .96 + offset);
        ctx.bezierCurveTo(g.x(u0 + .035, yy + depth * .84 + offset), yy + depth * .84 + offset,
          g.x(u1 - .026, yy + depth * .68 + offset), yy + depth * .68 + offset,
          g.x(rightU, yy - depth * .50 + offset), yy - depth * .50 + offset);
        ctx.strokeStyle = foldLight;
        ctx.lineWidth = Math.max(.9, (b - a) * (j ? .009 : .020));
        ctx.stroke();
      }
    }

    for (let i = 0; i < 3; i++) {
      const v = s.reduced ? .22 + i * .31 : fract(s.time * .039 + i / 3 + .16);
      const yy = mix(g.top - span * .12, g.bottom + span * .12, v);
      const length = span * .23;
      const light = ctx.createLinearGradient(0, yy - length * .5, 0, yy + length * .5);
      light.addColorStop(0, 'rgba(182,213,236,0)');
      light.addColorStop(.22, 'rgba(129,171,204,.04)');
      light.addColorStop(.65, 'rgba(161,192,213,.47)');
      light.addColorStop(.78, 'rgba(195,219,231,.71)');
      light.addColorStop(1, 'rgba(76,127,169,0)');
      traceChannelEdge(ctx, g, u1 - .032, yy - length * .5, yy + length * .5, phase + i, .017);
      ctx.strokeStyle = light;
      ctx.lineWidth = Math.max(1.1, (b - a) * .018);
      ctx.stroke();
    }
    traceChannelEdge(ctx, g, u1 - .008, g.top, g.bottom, phase, .0031);
    ctx.strokeStyle = 'rgba(165,194,215,.56)';
    ctx.lineWidth = s.mobile ? .85 : 1.3;
    ctx.stroke();
    traceChannelEdge(ctx, g, u0 + .009, g.top, g.bottom, phase * .7, .002);
    ctx.strokeStyle = 'rgba(114,154,190,.46)';
    ctx.lineWidth = s.mobile ? .75 : 1;
    ctx.stroke();
    ctx.restore();
  }

  airPassage(ctx, g, s, u0, u1) {
    const path = stripPath(g, u0, u1);
    const midY = (g.top + g.bottom) * .5;
    const a = g.x(u0, midY);
    const b = g.x(u1, midY);
    const cavity = ctx.createLinearGradient(a, 0, b, 0);
    cavity.addColorStop(0, '#040a11');
    cavity.addColorStop(.105, '#49545d');
    cavity.addColorStop(.24, '#252e36');
    cavity.addColorStop(.45, '#1b242d');
    cavity.addColorStop(.72, '#3b444b');
    cavity.addColorStop(.89, '#121b23');
    cavity.addColorStop(1, '#04090e');
    ctx.fillStyle = cavity;
    ctx.fill(path);
    ctx.save();
    ctx.clip(path);

    const verticalLight = ctx.createLinearGradient(0, g.top, 0, g.bottom);
    verticalLight.addColorStop(0, 'rgba(167,186,203,.08)');
    verticalLight.addColorStop(.32, 'rgba(4,8,12,.19)');
    verticalLight.addColorStop(.71, 'rgba(111,132,151,.10)');
    verticalLight.addColorStop(1, 'rgba(3,7,12,.35)');
    ctx.fillStyle = verticalLight;
    ctx.fill(path);
    traceChannelEdge(ctx, g, u0 + .024, g.top, g.bottom, .8, .009);
    ctx.strokeStyle = 'rgba(178,193,206,.23)';
    ctx.lineWidth = Math.max(1.3, g.width * .009);
    ctx.stroke();
    traceChannelEdge(ctx, g, u1 - .019, g.top, g.bottom, 1.7, .004);
    ctx.strokeStyle = 'rgba(167,188,207,.35)';
    ctx.lineWidth = Math.max(.7, g.width * .0018);
    ctx.stroke();

    // One lenticular interface, with a quiet admission interval between packets.
    const cycle = s.reduced ? .39 : fract(s.time / 12.4 + .15);
    if (cycle < .88) {
      const v = cycle / .88;
      const y = mix(s.h * 1.10, s.h * (s.mobile ? .41 : -.09), v);
      const x = g.x((u0 + u1) * .5, y);
      const width = g.x(u1, y) - g.x(u0, y);
      const envelope = s.reduced ? 1 : smooth(0, .065, v) * (1 - smooth(.94, 1, v));
      const slope = (g.x((u0 + u1) * .5, y + 1) - x) * -.5;
      opticalPocket(ctx, x, y, width * .443, width * .257, envelope * .92, slope);
    }
    ctx.restore();
  }

  topVeil(ctx, s, solidUntil, clearAt, strength) {
    ctx.save();
    const veil = ctx.createLinearGradient(0, s.h * .16, 0, s.h * clearAt);
    veil.addColorStop(0, `rgba(8,10,13,${strength})`);
    veil.addColorStop(clamp((solidUntil - .16) / (clearAt - .16)), `rgba(8,10,13,${strength})`);
    veil.addColorStop(1, 'rgba(8,10,13,0)');
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, s.w, s.h * clearAt);
    ctx.restore();
  }

  /** CSS-pixel anchors for the root's shared-line handoffs, if required. */
  getEndpoints(kind, input) {
    const s = this.state(input);
    if (kind === 'reservoir') {
      const frame = photoFrame(s, 'reservoir');
      const start = photoPoint(frame, frame.iw * .051, reservoirY(0, frame.ih, s.time, s.reduced));
      const end = photoPoint(frame, frame.iw * .967, reservoirY(1, frame.ih, s.time, s.reduced));
      return { ink: { start, end } };
    }
    if (kind === 'feed') {
      const frame = photoFrame(s, 'feed');
      const upstream = feedPoint(.98, frame.iw, frame.ih);
      const downstream = feedPoint(.04, frame.iw, frame.ih);
      return { ink: {
        start: photoPoint(frame, upstream.x, upstream.y),
        end: photoPoint(frame, downstream.x, downstream.y),
      } };
    }
    if (kind === 'balance') {
      const g = balanceGeometry(s);
      return {
        ink: { start: { x: g.x(.318, g.top), y: g.top }, end: { x: g.x(.318, g.bottom), y: g.bottom } },
        air: { start: { x: g.x(.704, g.bottom), y: g.bottom }, end: { x: g.x(.704, g.top), y: g.top } },
      };
    }
    return null;
  }
}
