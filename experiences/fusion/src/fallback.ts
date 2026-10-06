import type { ReactorFrame } from './reactor';

const TAU = Math.PI * 2;
const MAX_SAMPLES = 208;
const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, value: number) => {
  const t = clamp((value - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// Stable poses occupy most of each chapter; the last third hands the object over.
const POSES = [
  [0.99, 0.78, -0.24, 0.17],
  [1.04, 0.62, -0.38, 0.91],
  [1.03, 0.73, -0.10, 0.24],
  [1.18, 0.47, 0.24, 0.06],
  [1.10, 0.64, 0.34, 0.12],
  [1.02, 0.70, 0.04, 0.43],
  [1.12, 0.72, -0.32, 0.09],
  [0.94, 0.62, -0.42, 0.70],
  [0.88, 0.58, -0.42, 0.76],
] as const;

/**
 * A self-contained, image-free renderer for devices without WebGL.
 * Time and scroll are supplied by the application. This class owns no timer,
 * animation frame, event listener, or separate animation clock.
 */
export class FallbackReactor {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly points = new Float32Array((MAX_SAMPLES + 2) * 3);
  private width = 1;
  private height = 1;
  private ratio = 1;
  private centerX = 0;
  private centerY = 0;
  private scale = 1;
  private cosYaw = 1;
  private sinYaw = 0;
  private cosPitch = 1;
  private sinPitch = 0;
  private yaw = 0;
  private time = 0;
  private energy = 0;
  private heat = 0;
  private disturbance = 0;
  private drawCalls = 0;
  private disposed = false;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) throw new Error('Canvas 2D is unavailable.');
    this.ctx = context;
    this.resize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight);
  }

  resize(width: number, height: number): void {
    if (this.disposed) return;
    this.width = Math.max(1, Math.round(width));
    this.height = Math.max(1, Math.round(height));
    this.ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.round(this.width * this.ratio);
    this.canvas.height = Math.round(this.height * this.ratio);
    this.ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  render(frame: ReactorFrame): void {
    if (this.disposed) return;
    const ctx = this.ctx;
    const mobile = this.width < 760 && this.height > this.width;
    const low = frame.quality === 'low' || (frame.quality === 'auto' && mobile);
    const p = clamp(frame.p, 0, 8);
    const chapter = Math.min(7, Math.floor(p));
    const handoff = smooth(0.64, 1, p - chapter);
    const current = POSES[chapter];
    const next = POSES[chapter + 1];
    const drift = frame.reducedMotion ? 0 : Math.sin(frame.time * 0.13) * 0.016;
    const pointerX = frame.reducedMotion ? 0 : clamp(frame.pointerX, -1, 1);
    const pointerY = frame.reducedMotion ? 0 : clamp(frame.pointerY, -1, 1);

    this.time = Math.max(0, frame.time);
    this.energy = clamp(frame.energy);
    this.heat = clamp(frame.heat);
    this.disturbance = clamp(frame.instability) * (1 - clamp(frame.control) * 0.86);
    this.centerX = this.width * (mobile ? 0.5 : 0.69);
    this.centerY = this.height * (mobile ? 0.47 : 0.50);
    const radius = mobile
      ? Math.min(this.width * 0.40, this.height * 0.28)
      : Math.min(this.width * 0.29, this.height * 0.38);
    const shortScreenFit = mobile ? mix(.76, 1, smooth(640, 780, this.height)) : 1;
    this.scale = radius * 0.80 * mix(current[0], next[0], handoff) * shortScreenFit;
    this.yaw = mix(current[2], next[2], handoff) + pointerX * 0.035 + drift;
    const pitch = mix(current[1], next[1], handoff) + pointerY * 0.025;
    this.cosYaw = Math.cos(this.yaw);
    this.sinYaw = Math.sin(this.yaw);
    this.cosPitch = Math.cos(pitch);
    this.sinPitch = Math.sin(pitch);
    const structure = mix(current[3], next[3], handoff);

    this.drawCalls = 0;
    ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);

    this.drawAtmosphere();
    this.drawEngineeringRings(structure, low);
    this.drawMachine(frame, structure, false);
    this.drawFields(frame, low, false);
    this.drawPlasma(low);
    this.drawFields(frame, low, true);
    this.drawParticles(low ? 64 : frame.quality === 'high' ? 140 : 104);
    this.drawMachine(frame, structure, true);
    this.drawPulses(frame);

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.setLineDash([]);
  }

  stats(): { drawCalls: number; triangles: number; pixelRatio: number } {
    // Canvas path/fill operations are the equivalent budget, not GPU draws.
    return { drawCalls: this.drawCalls, triangles: 0, pixelRatio: this.ratio };
  }

  dispose(): void {
    if (this.disposed) return;
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.disposed = true;
  }

  private project(index: number, x: number, y: number, z: number): void {
    const rotatedX = x * this.cosYaw + z * this.sinYaw;
    const rotatedZ = -x * this.sinYaw + z * this.cosYaw;
    const screenY = y * this.cosPitch - rotatedZ * this.sinPitch;
    const depth = y * this.sinPitch + rotatedZ * this.cosPitch;
    const perspective = 4.9 / (4.9 + depth);
    this.points[index * 3] = this.centerX + rotatedX * this.scale * perspective;
    this.points[index * 3 + 1] = this.centerY - screenY * this.scale * perspective;
    this.points[index * 3 + 2] = depth;
  }

  private torusPoint(index: number, u: number, v: number, minor: number, major = 1): void {
    // An organized m=2 displacement keeps instability on the toroidal surface.
    const mode = Math.sin(u * 2 - this.time * 1.35);
    const tube = minor * (1 + this.disturbance * 0.18 * Math.cos(u * 2 - this.time * 1.9));
    const radial = major + tube * Math.cos(v) + this.disturbance * 0.038 * mode;
    const y = tube * Math.sin(v) + this.disturbance * 0.033 * Math.cos(u * 2 - this.time * 1.35);
    this.project(index, radial * Math.cos(u), y, radial * Math.sin(u));
  }

  private torusPath(samples: number, minor: number, phase: number, turns: number, major = 1): void {
    for (let i = 0; i <= samples; i++) {
      const u = (i / samples) * TAU;
      this.torusPoint(i, u, phase + u * turns, minor, major);
    }
  }

  private trace(count: number, front?: boolean): void {
    const ctx = this.ctx;
    ctx.beginPath();
    let drawing = false;
    for (let i = 0; i <= count; i++) {
      const j = i * 3;
      const visible = front === undefined || (front ? this.points[j + 2] <= 0 : this.points[j + 2] >= 0);
      if (!visible) {
        drawing = false;
        continue;
      }
      if (drawing) ctx.lineTo(this.points[j], this.points[j + 1]);
      else ctx.moveTo(this.points[j], this.points[j + 1]);
      drawing = true;
    }
  }

  private stroke(width: number, color: string | CanvasGradient, alpha: number): void {
    if (alpha < 0.002) return;
    this.ctx.lineWidth = width;
    this.ctx.strokeStyle = color;
    this.ctx.globalAlpha = clamp(alpha);
    this.ctx.stroke();
    this.drawCalls++;
  }

  private fill(color: string | CanvasGradient, alpha: number): void {
    if (alpha < 0.002) return;
    this.ctx.fillStyle = color;
    this.ctx.globalAlpha = clamp(alpha);
    this.ctx.fill();
    this.drawCalls++;
  }

  private drawAtmosphere(): void {
    const ctx = this.ctx;
    const extent = this.scale * 2.6;
    const glow = ctx.createRadialGradient(this.centerX, this.centerY, 0, this.centerX, this.centerY, extent);
    glow.addColorStop(0, `rgba(34, 20, 72, ${0.12 + this.energy * 0.14})`);
    glow.addColorStop(0.40, `rgba(24, 36, 85, ${0.07 + this.energy * 0.07})`);
    glow.addColorStop(1, 'rgba(2, 5, 10, 0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = glow;
    ctx.fillRect(this.centerX - extent, this.centerY - extent, extent * 2, extent * 2);
    this.drawCalls++;
  }

  private drawEngineeringRings(structure: number, low: boolean): void {
    const ctx = this.ctx;
    const samples = low ? 80 : 112;
    ctx.globalCompositeOperation = 'source-over';
    for (let ring = 0; ring < 3; ring++) {
      const major = 1.39 + ring * 0.14;
      for (let i = 0; i <= samples; i++) {
        const u = (i / samples) * TAU;
        this.project(i, major * Math.cos(u), -0.48 - ring * 0.06, major * Math.sin(u));
      }
      this.trace(samples);
      ctx.setLineDash(ring === 1 ? [2, 9] : []);
      this.stroke(ring === 0 ? 0.8 : 0.5, '#6b96be', 0.045 + structure * (ring === 0 ? 0.16 : 0.07));
    }
    ctx.setLineDash([]);

    const ticks = low ? 48 : 72;
    ctx.beginPath();
    for (let i = 0; i < ticks; i++) {
      const u = (i / ticks) * TAU;
      const major = i % 6 === 0 ? 1.61 : 1.64;
      this.project(0, major * Math.cos(u), -0.54, major * Math.sin(u));
      this.project(1, 1.67 * Math.cos(u), -0.54, 1.67 * Math.sin(u));
      ctx.moveTo(this.points[0], this.points[1]);
      ctx.lineTo(this.points[3], this.points[4]);
    }
    this.stroke(0.65, '#8cb5d3', 0.10 + structure * 0.15);
  }

  private drawMachine(frame: ReactorFrame, opacity: number, front: boolean): void {
    opacity *= 0.08 + clamp(frame.assembly) * 0.92;
    if (opacity < 0.01) return;
    const ctx = this.ctx;
    ctx.globalCompositeOperation = 'source-over';
    const cutaway = clamp(frame.cutaway);
    const machineChapter = smooth(0.8, 1.15, frame.p) * (1 - smooth(1.72, 2.15, frame.p));
    const explosion = cutaway * machineChapter * 0.32;
    const samples = 34;
    const steel = ctx.createLinearGradient(this.centerX, this.centerY - this.scale, this.centerX + this.scale * 0.6, this.centerY + this.scale);
    steel.addColorStop(0, '#bad0de');
    steel.addColorStop(0.25, '#394e61');
    steel.addColorStop(0.46, '#8194a7');
    steel.addColorStop(0.72, '#182536');
    steel.addColorStop(1, '#4b6579');

    // Eighteen D-shaped toroidal-field coils share the same radial section.
    for (let coil = 0; coil < 18; coil++) {
      const u = (coil / 18) * TAU;
      const depth = Math.sin(u - this.yaw);
      if (front !== (depth < 0)) continue;
      const sector = Math.atan2(Math.sin(u - this.yaw + Math.PI / 4), Math.cos(u - this.yaw + Math.PI / 4));
      const opening = smooth(cutaway * 0.94 - 0.14, cutaway * 0.94 + 0.12, Math.abs(sector));
      const visibility = cutaway < 0.03 ? 1 : mix(0.055, 1, opening);
      const alpha = opacity * visibility * (front ? 0.90 : 0.55);
      if (alpha < 0.015) continue;
      for (let i = 0; i <= samples; i++) {
        const v = -Math.PI / 2 + (i / samples) * Math.PI;
        const rho = 0.56 + 0.88 * Math.cos(v) + explosion;
        const y = Math.sin(v) * (0.51 + explosion * 0.48);
        this.project(i, rho * Math.cos(u), y, rho * Math.sin(u));
      }
      this.trace(samples);
      ctx.closePath();
      this.stroke(Math.max(2.6, this.scale * 0.028), '#080f18', alpha);
      this.stroke(Math.max(1.4, this.scale * 0.015), steel, alpha);
      this.stroke(0.50, '#c5ddea', alpha * 0.72);

      // Small, cold winding contacts give each coil a tangible attachment.
      this.project(0, (1.45 + explosion) * Math.cos(u), 0, (1.45 + explosion) * Math.sin(u));
      ctx.beginPath();
      ctx.arc(this.points[0], this.points[1], Math.max(0.8, this.scale * 0.0055), 0, TAU);
      this.fill('#8cc5e8', alpha * 0.9);
    }

    for (const y of [-0.50, 0.50]) {
      for (let i = 0; i <= 96; i++) {
        const u = (i / 96) * TAU;
        this.project(i, (1.12 + explosion * 0.5) * Math.cos(u), y * (1 + explosion), (1.12 + explosion * 0.5) * Math.sin(u));
      }
      this.trace(96, front);
      this.stroke(Math.max(1.5, this.scale * 0.014), '#152330', opacity * 0.65);
      this.stroke(0.7, '#8ca8ba', opacity * (front ? 0.63 : 0.26));
    }
  }

  private drawFields(frame: ReactorFrame, low: boolean, front: boolean): void {
    const strength = clamp(frame.field);
    if (strength < 0.01) return;
    const mode = Math.round(clamp(frame.fieldMode, 0, 2));
    const samples = low ? 88 : 144;
    const paths = mode === 2 ? (low ? 12 : 18) : low ? 8 : 12;
    const speed = this.time * (0.045 + this.energy * 0.05);
    this.ctx.globalCompositeOperation = 'lighter';

    for (let line = 0; line < paths; line++) {
      const phase = (line / paths) * TAU;
      const minor = 0.29 + (line % 3) * 0.040;
      if (mode === 2) {
        const u = phase + speed * 0.17;
        for (let i = 0; i <= samples; i++) {
          this.torusPoint(i, u, (i / samples) * TAU, minor);
        }
      } else {
        this.torusPath(samples, minor, phase + (mode === 0 ? speed : 0), mode === 0 ? 3 : 0);
      }
      this.trace(samples, front);
      const alpha = strength * (front ? 0.22 : 0.095) * (0.65 + (line % 3) * 0.17);
      this.stroke(2.5, '#286fea', alpha * 0.19);
      this.stroke(0.65, line % 3 === 0 ? '#87c6ff' : '#6e87fa', alpha);

      // A small moving bead expresses the direction of each magnetic path.
      const travel = ((this.time * (0.055 + this.energy * 0.060) + line * 0.137) % 1) * TAU;
      const u = mode === 2 ? phase + speed * 0.17 : travel;
      const v = mode === 2 ? travel : phase + (mode === 0 ? speed + travel * 3 : 0);
      this.torusPoint(0, u, v, minor);
      if (front === (this.points[2] <= 0)) {
        this.ctx.beginPath();
        this.ctx.arc(this.points[0], this.points[1], front ? 1.25 : 0.8, 0, TAU);
        this.fill('#b6e5ff', strength * (front ? 0.62 : 0.24));
      }
    }
  }

  private drawPlasma(low: boolean): void {
    const ctx = this.ctx;
    const samples = low ? 104 : 176;
    const lanes = low ? 13 : 23;
    const power = 0.14 + this.energy * 0.86;
    const breath = 0.96 + Math.sin(this.time * 1.45) * 0.04;
    ctx.globalCompositeOperation = 'lighter';

    // A layered tube gives depth without a per-pixel blur or expensive shadow.
    this.torusPath(samples, 0, 0, 0);
    this.trace(samples);
    this.stroke(this.scale * 0.29, '#5826c1', power * 0.035);
    this.stroke(this.scale * 0.19, '#7844e7', power * 0.055);
    this.stroke(this.scale * 0.095, '#7746fc', power * 0.11);
    this.stroke(this.scale * 0.035, '#ec7eea', power * 0.16);

    for (let lane = 0; lane < lanes; lane++) {
      const phase = (lane / lanes) * TAU + this.time * 0.12;
      const minor = 0.055 + ((lane * 7) % lanes) / lanes * 0.165;
      this.torusPath(samples, minor, phase, lane % 3 === 0 ? 3 : 2);
      this.trace(samples);
      const warm = (Math.sin(phase) * 0.5 + 0.5) * this.heat;
      const red = Math.round(mix(117 + (lane % 3) * 42, 255, warm));
      const green = Math.round(mix(84 + (lane % 2) * 31, 179, warm));
      const blue = Math.round(mix(255, 103, warm));
      const color = `rgb(${red}, ${green}, ${blue})`;
      const alpha = power * breath * (0.25 + (lane % 4) * 0.035);
      this.stroke(5.2, color, alpha * 0.085);
      this.stroke(1.15 + (lane % 3) * 0.16, color, alpha);
      this.trace(samples, true);
      this.stroke(0.50, '#ffe8fa', alpha * (0.30 + this.heat * 0.37));
    }

    // The confined, hot inner edge stays continuous throughout every chapter.
    this.torusPath(samples, 0.11, -Math.PI * 0.38, 0);
    this.trace(samples, true);
    this.stroke(4, '#ff986c', power * this.heat * 0.19);
    this.stroke(0.85, '#ffebd7', power * this.heat * 0.57);
  }

  private drawParticles(count: number): void {
    const ctx = this.ctx;
    ctx.globalCompositeOperation = 'lighter';
    const speed = 0.20 + this.energy * 0.47;
    for (let particle = 0; particle < count; particle++) {
      const seed = particle * 2.39996323;
      const u = seed + this.time * speed * (0.80 + (particle % 7) * 0.037);
      const phase = particle * 0.713;
      const minor = 0.055 + ((particle * 17) % 67) / 67 * 0.15;
      const v = phase + u * 2;
      this.torusPoint(0, u, v, minor);
      this.torusPoint(1, u - 0.016 - this.energy * 0.014, v - 0.032, minor);
      const front = this.points[2] < 0;
      ctx.beginPath();
      ctx.moveTo(this.points[3], this.points[4]);
      ctx.lineTo(this.points[0], this.points[1]);
      this.stroke(front ? 1.05 : 0.7, particle % 4 === 0 ? '#ffc9a4' : '#e4d6ff', (0.14 + this.energy * 0.57) * (front ? 1 : 0.42));
    }
  }

  private drawPulses(frame: ReactorFrame): void {
    const ctx = this.ctx;
    ctx.globalCompositeOperation = 'lighter';
    const count = this.width < 760 ? 2 : 3;
    for (let pulse = 0; pulse < count; pulse++) {
      const u = this.time * (0.37 + this.energy * 0.52) + (pulse / count) * TAU;
      this.torusPoint(0, u, u * 2 + pulse, 0.14);
      const x = this.points[0];
      const y = this.points[1];
      const front = this.points[2] < 0;
      const size = this.scale * (0.06 + this.energy * 0.035);
      const glow = ctx.createRadialGradient(x, y, 0, x, y, size);
      glow.addColorStop(0, '#ffeef4');
      glow.addColorStop(0.07, '#edc0ff');
      glow.addColorStop(0.29, 'rgba(180, 88, 255, 0.43)');
      glow.addColorStop(1, 'rgba(114, 41, 228, 0)');
      ctx.beginPath();
      ctx.arc(x, y, size, 0, TAU);
      this.fill(glow, (0.06 + this.energy * 0.30) * (front ? 1 : 0.46));
    }

    // Outward disturbances remain coherent wave surfaces, then damp under control.
    if (this.disturbance > 0.03) {
      const samples = this.width < 760 ? 88 : 128;
      for (let wave = 0; wave < 3; wave++) {
        const travel = (this.time * 0.21 + wave / 3) % 1;
        this.torusPath(samples, 0.22 + travel * 0.28, travel * 0.9, 2);
        this.trace(samples);
        this.stroke(0.8, '#ff785c', this.disturbance * (1 - travel) * 0.23);
      }
    }

    // Feedback is visible as four evenly phased blue correction arcs.
    const control = clamp(frame.control);
    if (control > 0.05) {
      for (let arc = 0; arc < 4; arc++) {
        for (let i = 0; i <= 28; i++) {
          const u = (arc / 4) * TAU + (i / 28) * 0.62 + this.time * 0.05;
          this.torusPoint(i, u, u * 3, 0.43);
        }
        this.trace(28);
        this.stroke(3.5, '#367ae2', control * 0.07);
        this.stroke(0.85, '#95d3ff', control * 0.47);
      }
    }
  }
}
