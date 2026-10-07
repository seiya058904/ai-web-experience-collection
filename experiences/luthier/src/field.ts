/**
 * LUTHIER's continuous drawing. Geometry is a function of the score; time only
 * carries light and phase. This is an authored acoustic interpretation, not a
 * numerical model of a particular instrument. The application owns the clock.
 */

export type Material = 'spruce' | 'maple' | 'ebony';
export type ResonanceMode = 'string' | 'body' | 'air';

export interface FieldFrame {
  story: number;
  time: number;
  reduced: boolean;
  material: Material;
  resonanceMode: ResonanceMode;
  spaceOpen: number;
  bowOverride: number | null;
}

export interface BowState {
  contact: number;
  approach: number;
  load: number;
  amplitude: number;
  draw: number;
}

export interface FieldGeometry {
  mobile: boolean;
  contactX: number;
  contactY: number;
  bridgeX: number;
  stringStartX: number;
  stringEndX: number;
  stringGap: number;
  heroStringX: number;
}

export interface BridgeGroove {
  x: number;
  y: number;
}

const PI = Math.PI;
const TAU = PI * 2;
const POINTS = 225;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, v: number) => {
  const x = clamp((v - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const finite = (v: number, fallback: number) => Number.isFinite(v) ? v : fallback;

/** Shared by the native bow plate and the Canvas contact, including overrides. */
export function bowState(local: number, override: number | null = null): BowState {
  const p = clamp(finite(override === null ? local : override, 0));
  const contact = smooth(0.32, 0.43, p);
  return {
    approach: smooth(0, 0.32, p),
    contact,
    load: smooth(0.40, 0.56, p) * (1 - smooth(0.56, 0.74, p)),
    amplitude: contact * smooth(0.56, 0.78, p),
    draw: smooth(0.48, 0.94, p),
  };
}

/** CSS pixel coordinates; do not multiply these values by Canvas DPR. */
export function fieldGeometry(width: number, height: number): FieldGeometry {
  const w = Math.max(1, finite(width, 1));
  const h = Math.max(1, finite(height, 1));
  const mobile = w <= 760;
  return {
    mobile,
    contactX: w * (mobile ? 0.75 : 0.58),
    contactY: h * (mobile ? 0.62 : 0.52),
    bridgeX: w * (mobile ? 0.88 : 0.84),
    stringStartX: -w * 0.055,
    stringEndX: w * 1.055,
    stringGap: h * (mobile ? 0.045 : 0.065),
    heroStringX: w * (mobile ? 0.76 : 0.75),
  };
}

/**
 * Registered to the retained 1672 × 941 tension plate. These are CSS pixels
 * after the image's object-fit: cover crop, not percentages of the viewport.
 * The mobile image box must match .bridge-plate: 153% × 88%, left −53%,
 * top 19%, object-position 100% 50%. Its right edge reaches the viewport.
 */
function bridgePlateProjection(width: number, height: number) {
  const w = Math.max(1, finite(width, 1));
  const h = Math.max(1, finite(height, 1));
  const mobile = w <= 760;
  const boxWidth = w * (mobile ? 1.53 : 1);
  const boxHeight = h * (mobile ? 0.88 : 1);
  const scale = Math.max(boxWidth / 1672, boxHeight / 941);
  const left = (mobile ? -0.53 * w : 0) + (boxWidth - 1672 * scale) * (mobile ? 1 : 0.5);
  const top = (mobile ? 0.19 * h : 0) + (boxHeight - 941 * scale) * 0.5;
  return { scale, left, top };
}

export function bridgeGrooves(width: number, height: number): BridgeGroove[] {
  const { scale, left, top } = bridgePlateProjection(width, height);
  return [[1530, 334], [1552, 347], [1578, 372], [1603, 382]].map(([x, y]) => ({
    x: left + x * scale,
    y: top + y * scale,
  }));
}

// Half of one authored violin outline, running from upper to lower block.
// Broad bouts, a pinched waist, and short corners are shared by every field.
const PROFILE_X = [0, 0.065, 0.17, 0.27, 0.34, 0.395, 0.45, 0.50, 0.57, 0.69, 0.81, 0.93, 1];
const PROFILE_Y = [0, 0.27, 0.47, 0.48, 0.37, 0.29, 0.255, 0.29, 0.46, 0.59, 0.61, 0.44, 0];

// Same original outline as the structural model's soundHole(1), kept here as
// a lightweight path so the drawing does not need to import the 3D renderer.
const F_HOLE = 'M .96 1.39 C 1.14 1.48 1.34 1.33 1.26 1.14 C 1.20 1 1.03 1 .99 1.12 C .89 1.03 .85 .73 .96 .35 L 1.06 .04 L .99 -.04 L 1.10 -.04 C 1.19 -.31 1.24 -.61 1.18 -.87 C 1.35 -.77 1.55 -.93 1.49 -1.12 C 1.43 -1.34 1.15 -1.39 1.03 -1.20 C .95 -1.08 1.03 -.96 1.12 -.98 C 1.13 -.78 1.03 -.51 .90 -.19 L .87 -.08 L .78 -.08 L .86 0 C .71 .48 .79 .95 .88 1.22 C .86 1.29 .90 1.36 .96 1.39 Z';

function bodyProfile(u: number): number {
  if (u <= 0 || u >= 1) return 0;
  let i = 0;
  while (i < PROFILE_X.length - 2 && u > PROFILE_X[i + 1]) i++;
  const x0 = PROFILE_X[i];
  const x1 = PROFILE_X[i + 1];
  const t = (u - x0) / (x1 - x0);
  const y0 = PROFILE_Y[i];
  const y1 = PROFILE_Y[i + 1];
  const slope0 = i === 0 ? 6.4 : (y1 - PROFILE_Y[i - 1]) / (x1 - PROFILE_X[i - 1]);
  const slope1 = i + 2 >= PROFILE_X.length ? -7.2 : (PROFILE_Y[i + 2] - y0) / (PROFILE_X[i + 2] - x0);
  const t2 = t * t;
  const t3 = t2 * t;
  return Math.max(0, (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * slope0 * (x1 - x0)
    + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * slope1 * (x1 - x0));
}

function cubic(t: number, a: number, b: number, c: number, d: number): number {
  const q = 1 - t;
  return q * q * q * a + 3 * q * q * t * b + 3 * q * t * t * c + t * t * t * d;
}

export class ResonanceField {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private w = 1;
  private h = 1;
  private dpr = 1;
  private geometry = fieldGeometry(1, 1);
  private grooves = bridgeGrooves(1, 1);
  private bridgePlate = bridgePlateProjection(1, 1);
  private disposed = false;
  private line = new Float32Array(POINTS * 2);
  private nextLine = new Float32Array(POINTS * 2);
  private work = new Float32Array(POINTS * 2);
  private warm: CanvasGradient | string = '#c8894d';
  private pale: CanvasGradient | string = '#f2ebdd';
  private hole = typeof Path2D === 'undefined' ? null : new Path2D(F_HOLE);

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  }

  resize(width: number, height: number): void {
    if (this.disposed) return;
    this.w = Math.max(1, finite(width, 1));
    this.h = Math.max(1, finite(height, 1));
    this.geometry = fieldGeometry(this.w, this.h);
    this.grooves = bridgeGrooves(this.w, this.h);
    this.bridgePlate = bridgePlateProjection(this.w, this.h);
    const device = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
    this.dpr = Math.min(device, this.geometry.mobile ? 1.5 : 1.6, Math.sqrt(5_000_000 / (this.w * this.h)));
    const pw = Math.max(1, Math.round(this.w * this.dpr));
    const ph = Math.max(1, Math.round(this.h * this.dpr));
    if (this.canvas.width !== pw) this.canvas.width = pw;
    if (this.canvas.height !== ph) this.canvas.height = ph;
    if (!this.ctx) return;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.warm = this.ctx.createLinearGradient(this.w * 0.08, this.h * 0.56, this.w, this.h * 0.35);
    this.warm.addColorStop(0, '#9f754b');
    this.warm.addColorStop(0.34, '#edc895');
    this.warm.addColorStop(0.66, '#e7b67c');
    this.warm.addColorStop(1, '#b88248');
    this.pale = this.ctx.createLinearGradient(0, 0, this.w, this.h);
    this.pale.addColorStop(0, '#c1b7a5');
    this.pale.addColorStop(0.46, '#fcf3dc');
    this.pale.addColorStop(0.78, '#ead8b6');
    this.pale.addColorStop(1, '#ceaa79');
  }

  render(frame: FieldFrame): void {
    const ctx = this.ctx;
    if (this.disposed || !ctx) return;
    const score = clamp(finite(frame.story, 0), 0, 8.999999);
    const scene = Math.min(8, Math.floor(score));
    const local = score - scene;
    const handoff = scene < 8 ? smooth(0.82, 1, local) : 0;
    const time = frame.reduced ? 0.47 : finite(frame.time, 0);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'source-over';
    this.scene(scene, local, time, 1 - handoff, frame);
    if (handoff > 0) this.scene(scene + 1, 0, time, handoff, frame);

    this.sharedPath(scene, local, time, frame, this.line);
    if (handoff > 0) {
      this.sharedPath(scene + 1, 0, time, frame, this.nextLine);
      for (let i = 0; i < this.line.length; i++) this.line[i] = mix(this.line[i], this.nextLine[i], handoff);
    }
    const opacity = mix(this.stringOpacity(scene), this.stringOpacity(Math.min(8, scene + 1)), handoff);
    const wood = scene === 1 ? 1 - handoff : scene === 0 ? handoff : 0;
    if (scene === 4) {
      this.withBridgeOcclusion(local, visibility => {
        ctx.globalAlpha = opacity * visibility;
        this.stroke(this.line, this.pale, this.geometry.mobile ? 0.85 : 1.05);
        if (handoff < 0.85) {
          ctx.globalAlpha = opacity * visibility * 0.15;
          this.stroke(this.line, '#fff8e8', 3.25);
        }
      });
    } else {
      ctx.globalAlpha = opacity;
      this.stroke(this.line, wood > 0.66 ? '#705139' : this.pale, this.geometry.mobile ? 0.85 : 1.05);
      if (scene === 5 && handoff < 0.85) {
        ctx.globalAlpha = opacity * 0.15;
        this.stroke(this.line, '#fff8e8', 3.25);
      }
    }
    // Small reading and input zones retain quiet space within the mobile ribbon.
    // The same attenuated field is used by the reduced-motion plate.
    if (this.geometry.mobile) {
      const spaceWeight = scene === 7 ? 1 - handoff : scene === 6 ? handoff : 0;
      if (spaceWeight > 0) this.quietSpaceLabels(spaceWeight);
    }
    ctx.globalAlpha = 1;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.ctx?.clearRect(0, 0, this.w, this.h);
    this.canvas.width = 1;
    this.canvas.height = 1;
    this.ctx = null;
  }

  private stringOpacity(scene: number): number {
    if (scene === 0 || scene === 8) return this.geometry.mobile ? 0.10 : 0.30;
    if (scene === 1) return 0.44;
    if (scene === 2 || scene === 3) return 0.27;
    return scene === 7 ? 0.68 : 0.92;
  }

  private scene(scene: number, local: number, time: number, alpha: number, frame: FieldFrame): void {
    if (alpha < 0.002) return;
    switch (scene) {
      case 0: this.rim(local, time, alpha, false); break;
      case 1: this.grain(local, time, alpha, frame.material); break;
      case 2: this.craftTrace(local, time, alpha); break;
      case 3: this.insideTrace(local, time, alpha); break;
      case 4: this.tension(local, time, alpha); break;
      case 5: this.contact(local, time, alpha, frame); break;
      case 6: this.resonance(local, time, alpha, frame.resonanceMode); break;
      case 7: this.space(local, time, alpha, clamp(frame.spaceOpen)); break;
      case 8: this.rim(local, time, alpha, true); break;
    }
  }

  private stroke(points: Float32Array, color: string | CanvasGradient, width: number, count = POINTS): void {
    const ctx = this.ctx!;
    ctx.beginPath();
    ctx.moveTo(points[0], points[1]);
    for (let i = 1; i < count - 1; i++) {
      const x = points[i * 2];
      const y = points[i * 2 + 1];
      ctx.quadraticCurveTo(x, y, (x + points[i * 2 + 2]) * 0.5, (y + points[i * 2 + 3]) * 0.5);
    }
    ctx.lineTo(points[(count - 1) * 2], points[(count - 1) * 2 + 1]);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  private sharedPath(scene: number, local: number, time: number, frame: FieldFrame, out: Float32Array): void {
    const w = this.w;
    const h = this.h;
    const g = this.geometry;
    const bow = bowState(local, frame.bowOverride);
    for (let i = 0; i < POINTS; i++) {
      const t = i / (POINTS - 1);
      let x = 0;
      let y = 0;
      if (scene === 0 || scene === 8) {
        x = g.heroStringX + (t - 0.50) * w * 0.012;
        y = (-0.12 + t * 1.24) * h;
      } else if (scene === 1) {
        x = w * (g.mobile ? 0.62 : 0.65) + Math.sin(t * PI * 1.35 + local * 0.18) * w * 0.072;
        y = (-0.10 + t * 1.20) * h;
      } else if (scene === 2) {
        x = w * (g.mobile ? 0.55 : 0.72) + Math.sin(t * PI * 1.1) * w * 0.05;
        y = h * (g.mobile ? 0.39 + t * 0.52 : 0.12 + t * 0.77);
      } else if (scene === 3) {
        x = cubic(t, w * 0.36, w * 0.58, w * 0.81, w * 1.03);
        y = cubic(t, h * 0.74, h * 0.39, h * 0.40, g.contactY);
      } else if (scene === 4) {
        const point = this.tensionPoint(t, 0, local);
        x = point[0]; y = point[1];
      } else if (scene === 5) {
        x = mix(g.stringStartX, g.stringEndX, t);
        y = g.contactY + this.stringDisplacement(x, time, bow);
      } else if (scene === 6) {
        const point = this.resonancePoint(t, frame.resonanceMode === 'string' ? 0.025 : 0.82, 1, time, 0.8);
        x = point[0]; y = point[1];
      } else {
        const point = this.spacePoint(t, 0.46, time, clamp(frame.spaceOpen), local);
        x = point[0]; y = point[1];
      }
      out[i * 2] = x;
      out[i * 2 + 1] = y;
    }
  }

  private rim(local: number, time: number, alpha: number, quiet: boolean): void {
    const ctx = this.ctx!;
    const mobile = this.geometry.mobile;
    const cx = this.w * (mobile ? 1.06 : 0.98);
    const cy = this.h * (mobile ? 0.73 : 0.59);
    const sx = this.w * (mobile ? 0.41 : 0.27);
    const sy = this.h * (mobile ? 0.51 : 0.74);
    const travel = quiet ? 0.15 : 0.10 + local * 0.18 + Math.sin(time * 0.12) * 0.018;
    for (let i = 0; i < POINTS; i++) {
      const t = i / (POINTS - 1);
      const angle = PI * (0.78 + t * 0.86);
      const width = 0.86 + 0.11 * Math.cos(angle * 3);
      this.work[i * 2] = cx + Math.cos(angle) * sx * width;
      this.work[i * 2 + 1] = cy + Math.sin(angle) * sy;
    }
    ctx.globalAlpha = alpha * (quiet ? 0.05 : 0.095);
    this.stroke(this.work, this.warm, 0.7);
    const start = Math.floor(clamp(travel) * (POINTS - 1));
    const end = Math.min(POINTS, start + Math.floor(POINTS * 0.16));
    ctx.beginPath();
    ctx.moveTo(this.work[start * 2], this.work[start * 2 + 1]);
    for (let i = start + 1; i < end; i++) ctx.lineTo(this.work[i * 2], this.work[i * 2 + 1]);
    ctx.strokeStyle = this.pale;
    ctx.lineWidth = 0.8;
    ctx.globalAlpha = alpha * (quiet ? 0.10 : 0.25);
    ctx.stroke();
  }

  private grain(local: number, time: number, alpha: number, material: Material): void {
    const ctx = this.ctx!;
    const count = this.geometry.mobile ? 16 : 26;
    const maple = material === 'maple';
    const ebony = material === 'ebony';
    const converge = smooth(0.53, 0.96, local);
    for (let n = 0; n < count; n++) {
      const layer = n / (count - 1);
      for (let i = 0; i < POINTS; i++) {
        const t = i / (POINTS - 1);
        const base = this.w * ((this.geometry.mobile ? 0.12 : 0.32) + layer * (this.geometry.mobile ? 0.93 : 0.70));
        const flame = maple ? Math.sin(t * 24 + layer * 8) * this.w * (0.013 + layer * 0.004) : 0;
        const longCurve = Math.sin(t * 3.7 + layer * 1.4) * this.w * (ebony ? 0.008 : 0.023);
        const carve = Math.sin(t * PI) * Math.sin(layer * PI) * this.w * 0.09 * converge;
        this.work[i * 2] = base + longCurve + flame + carve;
        this.work[i * 2 + 1] = (-0.10 + t * 1.22) * this.h;
      }
      const light = 0.7 + 0.3 * Math.sin(layer * 9 - time * 0.18 + local);
      ctx.globalAlpha = alpha * light * (ebony ? 0.11 : 0.11 + (n % 5 === 0 ? 0.09 : 0));
      this.stroke(this.work, ebony ? '#e8caa2' : '#8e6540', n % 5 === 0 ? 0.8 : 0.45);
    }
  }

  private craftTrace(local: number, time: number, alpha: number): void {
    const ctx = this.ctx!;
    // Short edge-following illumination; the actual open instrument is Three.js.
    const length = 0.11 + local * 0.05;
    const start = 0.15 + local * 0.17 + Math.sin(time * 0.10) * 0.008;
    for (let i = 0; i < POINTS; i++) {
      const t = start + i / (POINTS - 1) * length;
      this.work[i * 2] = this.w * (this.geometry.mobile ? 0.69 : 0.78) + bodyProfile(t) * this.w * 0.13;
      this.work[i * 2 + 1] = this.h * (this.geometry.mobile ? 0.42 + t * 0.57 : 0.17 + t * 0.68);
    }
    ctx.globalAlpha = alpha * 0.24;
    this.stroke(this.work, this.pale, 0.8);
  }

  private insideTrace(local: number, time: number, alpha: number): void {
    const ctx = this.ctx!;
    const start = 0.13 + local * 0.39;
    const len = 0.18 + local * 0.08;
    for (let i = 0; i < POINTS; i++) {
      const t = start + i / (POINTS - 1) * len;
      this.work[i * 2] = cubic(t, this.w * 0.38, this.w * 0.59, this.w * 0.83, this.w * 1.10);
      this.work[i * 2 + 1] = cubic(t, this.h * 0.74, this.h * 0.44, this.h * 0.44, this.h * 0.67);
    }
    ctx.globalAlpha = alpha * (0.21 + Math.sin(time * 0.17) * 0.02);
    this.stroke(this.work, this.warm, 1);
  }

  private tensionPoint(t: number, lane: number, local: number): [number, number] {
    const g = this.geometry;
    const release = smooth(0.64, 0.90, local);
    const groove = this.grooves[lane + 1];
    const startY = g.contactY + lane * g.stringGap * (1 - release);
    const endX = mix(groove.x, g.stringEndX, release);
    const endY = mix(groove.y, g.contactY, release);
    // The endpoints stay attached while the small initial slack is drawn out.
    const slack = Math.sin(PI * t) * this.h * 0.020 * (1 - smooth(0, 0.68, local));
    return [mix(g.stringStartX, endX, t), mix(startY, endY, t) + slack];
  }

  private clipBridge(outside: boolean): void {
    const ctx = this.ctx!;
    const p = this.bridgePlate;
    const x = (u: number) => p.left + u * p.scale;
    const y = (v: number) => p.top + v * p.scale;
    ctx.beginPath();
    if (outside) ctx.rect(-this.w, -this.h, this.w * 3, this.h * 3);
    // The camera sees the front ridge before the far grooves. That ridge must
    // occlude the approaching strings, just as the photographed wood does.
    ctx.moveTo(x(1375), y(671));
    ctx.bezierCurveTo(x(1383), y(565), x(1401), y(446), x(1433), y(395));
    ctx.bezierCurveTo(x(1450), y(368), x(1476), y(341), x(1493), y(333));
    ctx.bezierCurveTo(x(1511), y(325), x(1542), y(329), x(1566), y(334));
    ctx.bezierCurveTo(x(1571), y(337), x(1576), y(354), x(1579), y(371));
    ctx.lineTo(x(1586), y(374));
    ctx.lineTo(x(1589), y(383));
    ctx.lineTo(x(1596), y(386));
    ctx.bezierCurveTo(x(1605), y(417), x(1634), y(636), x(1649), y(731));
    ctx.lineTo(x(1672), y(941));
    ctx.lineTo(x(1360), y(941));
    ctx.lineTo(x(1363), y(747));
    ctx.closePath();
    ctx.clip(outside ? 'evenodd' : 'nonzero');
  }

  private withBridgeOcclusion(local: number, paint: (visibility: number) => void): void {
    const ctx = this.ctx!;
    // Exact complement of the DOM plate's .64–.87 withdrawal. Reveal only
    // the hidden pieces as the wood recedes; visible strings keep one opacity.
    const reveal = smooth(0.64, 0.87, local);
    if (reveal >= 1) { paint(1); return; }
    ctx.save();
    this.clipBridge(true);
    paint(1);
    ctx.restore();
    if (reveal > 0) {
      ctx.save();
      this.clipBridge(false);
      paint(reveal);
      ctx.restore();
    }
  }

  private tension(local: number, time: number, alpha: number): void {
    const ctx = this.ctx!;
    const secondaryAlpha = 1 - smooth(0.76, 1, local);
    for (const lane of [-1, 1, 2]) {
      for (let i = 0; i < POINTS; i++) {
        const point = this.tensionPoint(i / (POINTS - 1), lane, local);
        this.work[i * 2] = point[0];
        this.work[i * 2 + 1] = point[1];
      }
      this.withBridgeOcclusion(local, visibility => {
        ctx.globalAlpha = alpha * secondaryAlpha * visibility * (lane === 2 ? 0.47 : 0.66);
        this.stroke(this.work, this.pale, lane < 0 ? 0.85 : 1.05);
        ctx.globalAlpha = alpha * secondaryAlpha * visibility * 0.07;
        this.stroke(this.work, '#fbf1dd', lane === 2 ? 3.0 : 2.2);
      });
    }
    // The specular trace follows the selected physical lane all the way into
    // the horizontal First Bow path; it cannot drift beyond the live string.
    const t = 0.22 + local * 0.47 + Math.sin(time * 0.14) * 0.018;
    const point = this.tensionPoint(t, 0, local);
    const ahead = this.tensionPoint(Math.min(1, t + 0.01), 0, local);
    this.withBridgeOcclusion(local, visibility => {
      ctx.save();
      ctx.translate(point[0], point[1]);
      ctx.rotate(Math.atan2(ahead[1] - point[1], ahead[0] - point[0]));
      this.glint(0, 0, Math.min(62, this.w * 0.04), 1.6, alpha * visibility * 0.42);
      ctx.restore();
    });
  }

  private stringDisplacement(x: number, time: number, bow: BowState): number {
    const g = this.geometry;
    const u = (x - g.stringStartX) / (g.bridgeX - g.stringStartX);
    if (u <= 0 || u >= 1) return 0;
    const b = (g.contactX - g.stringStartX) / (g.bridgeX - g.stringStartX);
    const kink = u <= b ? u / b : (1 - u) / (1 - b);
    let harmonic = 0;
    for (let n = 1; n <= 4; n++) {
      harmonic += Math.sin(n * PI * u) * Math.sin(n * PI * b) / (n * n)
        * Math.sin(time * 9.5 * n + n * 0.37);
    }
    const scale = Math.min(this.h * (g.mobile ? 0.012 : 0.014), g.mobile ? 10 : 16);
    return bow.load * kink * scale * 0.75 + bow.amplitude * harmonic * scale;
  }

  private contact(local: number, time: number, alpha: number, frame: FieldFrame): void {
    const g = this.geometry;
    const ctx = this.ctx!;
    const bow = bowState(local, frame.bowOverride);
    const y = g.contactY + this.stringDisplacement(g.contactX, time, bow);
    if (bow.contact > 0) {
      const strength = bow.contact * (0.44 + bow.load * 0.30 + bow.amplitude * 0.26);
      this.glint(g.contactX, y, g.mobile ? 34 : 54, g.mobile ? 6 : 9, alpha * strength);
      ctx.globalAlpha = alpha * strength * 0.82;
      ctx.fillStyle = '#fff1d3';
      ctx.beginPath();
      ctx.ellipse(g.contactX, y, 1.9, 1.15, 0, 0, TAU);
      ctx.fill();
    }
    if (bow.amplitude > 0) {
      // Two translucent phase traces convey the width of the vibrating string.
      // They remain anchored at the same nut and bridge, never free-floating.
      for (const phase of [-0.028, 0.028]) {
        for (let i = 0; i < POINTS; i++) {
          const x = mix(g.stringStartX, g.stringEndX, i / (POINTS - 1));
          this.work[i * 2] = x;
          this.work[i * 2 + 1] = g.contactY + this.stringDisplacement(x, time + phase, bow);
        }
        ctx.globalAlpha = alpha * bow.amplitude * 0.15;
        this.stroke(this.work, this.warm, 0.75);
      }
      // The response reaches the bridge, represented by a very small light.
      this.glint(g.bridgeX, g.contactY, 22, 5, alpha * bow.amplitude * 0.23);
    }
  }

  private resonancePoint(t: number, layer: number, side: number, time: number, energy: number): [number, number] {
    const mobile = this.geometry.mobile;
    const x = mix(-this.w * 0.10, this.w * 1.13, t);
    const origin = this.w * (mobile ? 0.025 : 0.385);
    const length = this.w * (mobile ? 1.10 : 0.73);
    const u = (x - origin) / length;
    const profile = bodyProfile(u);
    const centre = this.h * (mobile ? 0.66 : 0.515);
    const height = this.h * (mobile ? 0.28 : 0.64);
    const bulk = Math.pow(layer, 0.67);
    const plate = profile * height * bulk;
    const materialMode = Math.sin(clamp(u) * PI * 3.0 + layer * 1.8);
    const displacement = profile * (1 - bulk * 0.42) * Math.sin(time * 1.85 + u * 7.0 + layer * 8.4)
      * Math.min(this.h * 0.027, 23) * energy * materialMode;
    const approach = x < origin ? Math.exp(-Math.pow((x - origin) / (this.w * 0.13), 2)) : 0;
    const incoming = Math.sin(t * 34 - time * 2.5) * approach * (1 - layer) * this.h * 0.009 * energy;
    return [x, centre + side * plate + displacement + incoming];
  }

  private resonance(local: number, time: number, alpha: number, mode: ResonanceMode): void {
    const ctx = this.ctx!;
    const mobile = this.geometry.mobile;
    const count = mobile ? 18 : 31;
    const energy = mode === 'string' ? 0.32 : mode === 'body' ? 0.70 : 1;
    const densityAlpha = mode === 'string' ? 0.22 : mode === 'body' ? 0.86 : 1;
    const drift = 0.025 * local;
    for (const side of [-1, 1]) {
      for (let n = 1; n <= count; n++) {
        const layer = n / count;
        for (let i = 0; i < POINTS; i++) {
          const point = this.resonancePoint(i / (POINTS - 1), Math.min(1.06, layer + drift), side, time, energy);
          this.work[i * 2] = point[0];
          this.work[i * 2 + 1] = point[1];
        }
        const selected = n === count || n === count - 4 || n === 9;
        ctx.globalAlpha = alpha * densityAlpha * (selected ? 0.92 : 0.22 + layer * 0.37);
        this.stroke(this.work, selected ? this.pale : this.warm, selected ? 1.05 : 0.70);
      }
    }
    const origin = this.w * (mobile ? 0.025 : 0.385);
    const cy = this.h * (mobile ? 0.66 : 0.515);
    this.resonanceBridge(origin, cy, alpha, time, energy);
    if (!mobile || mode !== 'string') {
      const centreX = this.w * (mobile ? 0.68 : 0.745);
      const dy = this.h * (mobile ? 0.117 : 0.19);
      this.fHole(centreX, cy - dy, mobile ? this.w * 0.17 : this.w * 0.095, -1, alpha * densityAlpha * 0.75);
      this.fHole(centreX, cy + dy, mobile ? this.w * 0.17 : this.w * 0.095, 1, alpha * densityAlpha * 0.75);
    }
    if (mode === 'air') {
      // These outgoing lines are continuations of the outer body contour.
      const airCount = mobile ? 3 : 6;
      for (let n = 0; n < airCount; n++) {
        const layer = 1.055 + n * 0.036 + Math.sin(time * 0.22 + n * 0.4) * 0.009;
        for (const side of [-1, 1]) {
          for (let i = 0; i < POINTS; i++) {
            const point = this.resonancePoint(i / (POINTS - 1), layer, side, time, 1);
            this.work[i * 2] = point[0]; this.work[i * 2 + 1] = point[1];
          }
          ctx.globalAlpha = alpha * (0.19 - n * 0.022);
          this.stroke(this.work, this.warm, 0.6);
        }
      }
    }
  }

  private resonanceBridge(x: number, y: number, alpha: number, time: number, energy: number): void {
    const ctx = this.ctx!;
    const height = this.h * (this.geometry.mobile ? 0.056 : 0.069);
    const width = Math.max(6, this.w * 0.010);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(time * 2.25) * energy * 0.008);
    ctx.beginPath();
    ctx.moveTo(-width * 0.48, -height);
    ctx.bezierCurveTo(width * 0.1, -height * 1.04, width * 0.45, -height * 0.9, width * 0.3, -height * 0.62);
    ctx.bezierCurveTo(width * 0.27, -height * 0.30, width * 0.68, -height * 0.15, width * 0.69, 0);
    ctx.bezierCurveTo(width * 0.70, height * 0.15, width * 0.25, height * 0.30, width * 0.31, height * 0.62);
    ctx.bezierCurveTo(width * 0.44, height * 0.93, width * 0.06, height * 1.04, -width * 0.48, height);
    ctx.closePath();
    ctx.globalAlpha = alpha * 0.13;
    ctx.fillStyle = '#ecc38f';
    ctx.fill();
    ctx.globalAlpha = alpha * 0.8;
    ctx.lineWidth = 0.85;
    ctx.strokeStyle = '#edd4ae';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-width * 0.11, -height * 0.88);
    ctx.quadraticCurveTo(width * 0.32, 0, -width * 0.11, height * 0.88);
    ctx.globalAlpha = alpha * 0.37;
    ctx.stroke();
    ctx.restore();
    this.glint(x, y, width * 2.5, height * 0.8, alpha * 0.15);
  }

  private fHole(x: number, y: number, scale: number, side: number, alpha: number): void {
    if (!this.hole) return;
    const ctx = this.ctx!;
    const k = scale * 0.56;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(k, k * side);
    ctx.rotate(-PI / 2);
    ctx.translate(-1.1, 0);
    ctx.strokeStyle = '#d3ad72';
    ctx.lineWidth = 0.9 / k;
    ctx.globalAlpha = alpha;
    ctx.stroke(this.hole);
    ctx.restore();
  }

  private spacePoint(t: number, layer: number, time: number, open: number, local: number): [number, number] {
    // The same violin perimeter, lofted through slightly different planes.
    // Perspective turns its waist into the crossing of an open acoustic ribbon.
    const mobile = this.geometry.mobile;
    const angle = t * TAU + 0.20;
    const x = Math.cos(angle);
    const u = (x + 1) * 0.5;
    const sign = Math.sin(angle) < 0 ? -1 : 1;
    const arch = Math.abs(Math.sin(angle));
    const ribbon = (layer - 0.5);
    const breathing = Math.sin(time * 0.24 + layer * 2.2) * 0.015 * arch;
    // The upper bout draws back toward the source while the lower bout opens
    // into the room, preserving a quiet area above the origin for the title.
    const release = 0.14 + smooth(0.12, 0.58, u) * 0.86;
    const y = sign * bodyProfile(u) * 1.58 * (1 + ribbon * 0.48 + breathing) * release;
    const turn = -0.28 + ribbon * (1.45 + open * 0.55);
    const z = Math.sin(angle * 2) * (0.50 + open * 0.16) + ribbon * Math.sin(angle) * 0.72;
    const ry = y * Math.cos(turn) - z * Math.sin(turn);
    const rz = y * Math.sin(turn) + z * Math.cos(turn);
    const twist = -0.48 + open * 0.06 + local * 0.025;
    const rx = x * Math.cos(twist) - ry * Math.sin(twist);
    const yy = x * Math.sin(twist) + ry * Math.cos(twist);
    const perspective = 1 / (1.20 + rz * 0.34);
    const scale = 1.03 + open * 0.12;
    return [
      this.w * 0.52 + rx * this.w * (mobile ? 0.76 : 0.43) * perspective * scale,
      this.h * (mobile ? 0.68 : 0.425) + yy * this.h * (mobile ? 0.37 : 0.53) * perspective * scale,
    ];
  }

  private space(local: number, time: number, alpha: number, open: number): void {
    const ctx = this.ctx!;
    const count = this.geometry.mobile ? 26 : 48;
    for (let n = 0; n < count; n++) {
      const layer = n / (count - 1);
      for (let i = 0; i < POINTS; i++) {
        const point = this.spacePoint(i / (POINTS - 1), layer, time, open, local);
        this.work[i * 2] = point[0];
        this.work[i * 2 + 1] = point[1];
      }
      const edge = n % 9 === 0 || n === count - 1;
      const silk = 0.27 + 0.42 * Math.pow(Math.sin(layer * PI), 2);
      ctx.globalAlpha = alpha * (edge ? 0.82 : silk);
      this.stroke(this.work, edge || n % 3 === 0 ? this.pale : this.warm, edge ? 1.0 : 0.65);
    }
    // Local caustics follow the instrument-derived curve, never arbitrary stars.
    for (const t of [0.19, 0.55, 0.83]) {
      const point = this.spacePoint(t, 0.49, time, open, local);
      this.glint(point[0], point[1], this.geometry.mobile ? 19 : 34, 4, alpha * 0.19);
    }
  }

  private quietSpaceLabels(alpha: number): void {
    const ctx = this.ctx!;
    const clear = (x: number, y: number, rx: number, ry: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(rx, ry);
      const mask = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      mask.addColorStop(0, 'rgba(0,0,0,.97)');
      mask.addColorStop(.64, 'rgba(0,0,0,.97)');
      mask.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = mask;
      ctx.fillRect(-1, -1, 2, 2);
      ctx.restore();
    };
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = alpha;
    clear(this.w * .06 + 108, this.h * .795 - 24, 174, 43);
    clear(this.w * .5, this.h * .885 - 16, this.w * .59, 31);
    ctx.restore();
  }

  private glint(x: number, y: number, width: number, height: number, alpha: number): void {
    if (alpha <= 0.002) return;
    const ctx = this.ctx!;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(width, height);
    const light = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    light.addColorStop(0, 'rgba(255,230,185,.8)');
    light.addColorStop(0.17, 'rgba(234,181,111,.36)');
    light.addColorStop(1, 'rgba(206,134,63,0)');
    ctx.globalAlpha = alpha;
    ctx.fillStyle = light;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }
}
