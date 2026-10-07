/**
 * Small, authored sensory accents. The application owns the only animation clock.
 * `time` and `dt` are seconds; positions and progress are deterministic where a
 * scroll reversal must reconstruct the same frame. These are visual suggestions,
 * not a simulation of cooking or fluid dynamics.
 */

const clamp = (value, low = 0, high = 1) => Math.min(high, Math.max(low, value));
const fract = (value) => value - Math.floor(value);
const smooth = (low, high, value) => {
  const t = clamp((value - low) / (high - low));
  return t * t * (3 - 2 * t);
};
const hash = (n) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453123);
const noise = (n) => {
  const cell = Math.floor(n);
  const t = smooth(0, 1, fract(n));
  return hash(cell) * (1 - t) + hash(cell + 1) * t;
};
const isHidden = () => typeof document !== 'undefined' && document.hidden;
const envelope = (p, enter = 0.06, settle = 0.21, leave = 0.86) =>
  smooth(enter, settle, p) * (1 - smooth(leave, 1, p));

const FLAKES = Object.freeze(Array.from({ length: 8 }, (_, i) => Object.freeze({
  x: hash(i + 6) - 0.5,
  y: hash(i + 24) - 0.5,
  drift: hash(i + 47) - 0.5,
  size: 1.7 + hash(i + 92) * 3.3,
  turn: (hash(i + 130) - 0.5) * 2.4,
  delay: hash(i + 182) * 0.055,
  shade: Math.floor(173 + hash(i + 242) * 53),
})));

export class Atmosphere {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext?.('2d', { alpha: true, desynchronized: true }) ?? null;
    this.width = 1;
    this.height = 1;
    this.scale = 1;
    this.painted = false;
    this.destroyed = false;
    this.vapor = this.makeVapor();
  }

  makeVapor() {
    // One feathered sprite, baked once. No per-frame filters or shadow blurs.
    let sprite;
    if (typeof OffscreenCanvas !== 'undefined') sprite = new OffscreenCanvas(64, 64);
    else if (typeof document !== 'undefined') sprite = document.createElement('canvas');
    if (!sprite) return null;
    sprite.width = 64;
    sprite.height = 64;
    const ctx = sprite.getContext('2d');
    if (!ctx) return null;
    const soft = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    // A broad, low-density body rather than a dark pin at the center. The
    // overlapping samples below make a continuous wisp, not a particle trail.
    soft.addColorStop(0, 'rgba(180,175,163,0.18)');
    soft.addColorStop(0.28, 'rgba(184,179,167,0.18)');
    soft.addColorStop(0.62, 'rgba(196,190,177,0.08)');
    soft.addColorStop(0.9, 'rgba(218,211,196,0.01)');
    soft.addColorStop(1, 'rgba(231,224,208,0)');
    ctx.fillStyle = soft;
    ctx.fillRect(0, 0, 64, 64);
    return sprite;
  }

  resize(w, h) {
    if (this.destroyed || !this.canvas) return;
    this.width = Math.max(1, Number.isFinite(w) ? w : 1);
    this.height = Math.max(1, Number.isFinite(h) ? h : 1);
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    this.scale = Math.min(dpr, 1.2, 1500 / Math.max(this.width, this.height));
    this.canvas.width = Math.max(1, Math.floor(this.width * this.scale));
    this.canvas.height = Math.max(1, Math.floor(this.height * this.scale));
    this.ctx?.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    this.painted = false;
  }

  clear() {
    if (!this.painted || !this.ctx || !this.canvas) return;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    this.painted = false;
  }

  render({ scene = 0, progress = 0, time = 0, motion = true, visible = true, mobile = false } = {}) {
    if (this.destroyed || !this.ctx) return;
    const p = clamp(Number.isFinite(progress) ? progress : 0);
    const t = Number.isFinite(time) ? time : 0;
    const steam = (scene === 7 || scene === 10) && envelope(p) > 0;
    const bubbles = scene === 1 && !mobile && envelope(p, 0.08, 0.2, 0.83) > 0;
    const crumbs = (scene === 3 && p > 0.46 && p < 0.65)
      || (scene === 9 && p > 0.4 && p < 0.7);

    if (!visible || !motion || isHidden() || !(steam || bubbles || crumbs)) {
      this.clear();
      return;
    }

    this.clear();
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    if (steam) this.drawSteam(t, envelope(p) * (scene === 10 ? 0.38 : 1), mobile, scene);
    if (bubbles) this.drawBubbles(t, envelope(p, 0.08, 0.2, 0.83), mobile);
    if (crumbs) this.drawCrumbs(p, scene, mobile);
    ctx.restore();
    this.painted = true;
  }

  drawSteam(time, strength, mobile, scene) {
    if (!this.vapor) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const sourceX = w * (mobile ? 0.61 : scene === 10 ? 0.59 : 0.69);
    const sourceY = h * (mobile ? scene === 10 ? 0.65 : 0.585 : scene === 10 ? 0.56 : 0.49);
    const rise = h * (mobile ? 0.27 : 0.29);
    const strands = 2;

    // Closely overlapping, unequal wisps form a translucent body. Value noise
    // bends the air gently; the upper end widens as its density falls away.
    const samples = 32;
    for (let strand = 0; strand < strands; strand++) {
      const seed = strand * 17 + 5;
      const origin = (hash(seed) - 0.5) * w * 0.036;
      const speed = 0.071 + hash(seed + 1) * 0.018;
      for (let i = 0; i < samples; i++) {
        const age = fract(time * speed + i / samples + hash(seed + 3) * 0.2);
        const life = smooth(0, 0.12, age) * (1 - smooth(0.48, 1, age));
        if (life < 0.001) continue;
        const curl = noise(seed + age * 3.7 - time * 0.105) - 0.5;
        const drift = (noise(seed + 23 + time * 0.09) - 0.5) * w * 0.025;
        const x = sourceX + origin + curl * w * (0.008 + age * 0.033) + drift * age;
        const y = sourceY - rise * age;
        const width = w * (mobile ? 0.012 : 0.0065) * (0.7 + age * 3.4);
        const height = h * (0.043 + age * 0.075);
        const density = 0.115 + noise(seed + age * 5.3 - time * 0.13) * 0.035;
        ctx.globalAlpha = strength * life * density;
        ctx.drawImage(this.vapor, x - width, y - height * 0.5, width * 2, height);
      }
    }
    ctx.globalAlpha = 1;
  }

  drawBubbles(time, strength, mobile) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const unit = clamp(Math.min(w, h) / 850, 0.72, 1.5);
    const sourceX = w * 0.33;
    const sourceY = h * 0.92;
    ctx.lineWidth = 0.55 * unit;
    for (let i = 0; i < 7; i++) {
      const life = fract(time * (0.3 + hash(i + 80) * 0.23) + hash(i + 15));
      const alpha = strength * 4 * life * (1 - life);
      const x = sourceX + (hash(i + 60) - 0.5) * w * (mobile ? 0.14 : 0.09);
      const y = sourceY + (hash(i + 110) - 0.5) * h * 0.022;
      const radius = unit * (0.8 + life * (1 + hash(i + 6)));
      ctx.strokeStyle = `rgba(251,220,162,${alpha * 0.2})`;
      ctx.beginPath();
      ctx.ellipse(x, y, radius * 1.18, radius * 0.68, -0.14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,240,206,${alpha * 0.29})`;
      ctx.beginPath();
      ctx.ellipse(x - radius * 0.08, y - radius * 0.12, radius * 0.8, radius * 0.4, -0.14, 3.5, 4.6);
      ctx.stroke();
    }
  }

  drawCrumbs(progress, scene, mobile) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cut = scene === 9;
    const duration = cut ? 0.3 : 0.19;
    const sourceX = w * (mobile ? (cut ? 0.59 : 0.55) : (cut ? 0.695 : 0.645));
    const sourceY = h * (mobile ? 0.63 : (cut ? 0.6 : 0.58));
    const unit = clamp(Math.min(w, h) / 850, 0.72, 1.5);
    const count = mobile ? 6 : 8;
    for (let i = 0; i < count; i++) {
      const flake = FLAKES[i];
      const age = (progress - (cut ? 0.4 : 0.46) - flake.delay) / (duration - flake.delay);
      // A flake does not exist before the crack. Its path is a pure function of
      // scroll, so a fast reversal reconstructs the exact earlier composition.
      if (age <= 0 || age >= 1) continue;
      const alpha = smooth(0, 0.065, age) * (1 - smooth(0.57, 1, age));
      const x = sourceX + flake.x * w * 0.032 + flake.drift * w * 0.07 * age;
      const y = sourceY + flake.y * h * 0.013 + h * (0.008 * age + 0.155 * age * age);
      const size = flake.size * unit * (cut ? 0.76 : 1);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(flake.turn * (0.3 + age));
      ctx.globalAlpha = alpha * 0.8;
      ctx.fillStyle = `rgb(${flake.shade + 23},${Math.floor(flake.shade * 0.67)},${Math.floor(flake.shade * 0.3)})`;
      ctx.beginPath();
      ctx.moveTo(-size, -size * 0.31);
      ctx.lineTo(size * 0.45, -size * 0.56);
      ctx.lineTo(size, size * 0.08);
      ctx.lineTo(-size * 0.34, size * 0.46);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  destroy() {
    if (this.destroyed) return;
    this.clear();
    if (this.canvas) {
      this.canvas.width = 1;
      this.canvas.height = 1;
    }
    this.vapor = null;
    this.ctx = null;
    this.canvas = null;
    this.destroyed = true;
  }
}

/**
 * Optional, quiet synthesized texture, never a recording or musical soundtrack.
 * Creating this class is silent; the AudioContext is created only by toggle().
 * suspend() is temporary: an already authorized session may resume in tick()
 * after the document is visible and motion is enabled again.
 */
export class SensoryAudio {
  constructor() {
    this.context = null;
    this.master = null;
    this.buffer = null;
    this.voices = new Set();
    this._enabled = false;
    this.destroyed = false;
    this.scene = 0;
    this.lastScene = -1;
    this.lastProgress = null;
    this.snapArmed = true;
    this.heatElapsed = 0;
    this.serial = 0;
    this.epoch = 0;
    this.resuming = null;
    this.volume = 0.16;
    this.visibilityHandler = () => { if (isHidden()) this.suspend(); };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  get enabled() { return this._enabled; }

  createContext() {
    if (this.context) return true;
    const Audio = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
    if (!Audio) return false;
    this.context = new Audio({ latencyHint: 'interactive' });
    this.master = this.context.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.context.destination);
    this.buffer = this.context.createBuffer(1, Math.ceil(this.context.sampleRate * 1.2), this.context.sampleRate);
    const samples = this.buffer.getChannelData(0);
    let seed = 0x63a5c9d;
    let low = 0;
    for (let i = 0; i < samples.length; i++) {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      const white = ((seed >>> 0) / 4294967295) * 2 - 1;
      low = low * 0.91 + white * 0.09;
      samples[i] = white * 0.64 + low * 0.2;
    }
    return true;
  }

  async toggle() {
    if (this.destroyed) return false;
    const token = ++this.epoch;
    this._enabled = !this._enabled;
    if (!this._enabled) {
      this.suspend();
      return false;
    }
    try {
      if (!this.createContext()) {
        this._enabled = false;
        return false;
      }
      if (isHidden()) return this._enabled;
      await this.context.resume();
      if (token !== this.epoch || !this._enabled || this.destroyed || isHidden()) {
        if (!this._enabled || isHidden()) this.suspend();
        return this._enabled;
      }
      this.master.gain.cancelScheduledValues(this.context.currentTime);
      this.master.gain.setValueAtTime(this.volume, this.context.currentTime);
      this.heatElapsed = 0;
      // A tiny, non-tonal preview makes the explicit sound toggle meaningful,
      // even when enabled during a quiet scene. No snap is played retroactively.
      this.burst({ duration: 0.13, peak: 0.07, frequency: 1800, q: 0.55 });
      return true;
    } catch {
      if (token === this.epoch) this._enabled = false;
      this.suspend();
      return false;
    }
  }

  setScene(index) {
    const scene = Number.isFinite(index) ? Math.trunc(index) : 0;
    if (scene === this.scene) return;
    this.scene = scene;
    this.lastScene = -1;
    this.lastProgress = null;
    this.snapArmed = true;
    this.heatElapsed = 0;
    this.stopVoices();
  }

  resumeIfAllowed() {
    const context = this.context;
    if (!context || context.state === 'running' || this.resuming || !this._enabled || isHidden()) return;
    this.resuming = context.resume().then(() => {
      if (this.destroyed || !this._enabled || isHidden()) {
        this.suspend();
        return;
      }
      this.master.gain.cancelScheduledValues(context.currentTime);
      this.master.gain.setValueAtTime(this.volume, context.currentTime);
    }).catch(() => {
      // An interrupted browser audio session may require another user toggle.
    }).finally(() => { this.resuming = null; });
  }

  tick({ scene = this.scene, progress = 0, dt = 0, motion = true } = {}) {
    if (this.destroyed) return;
    this.setScene(scene);
    const p = clamp(Number.isFinite(progress) ? progress : 0);
    const previous = this.lastScene === this.scene ? this.lastProgress : null;
    this.lastScene = this.scene;
    this.lastProgress = p;
    const threshold = this.scene === 3 ? 0.471 : this.scene === 9 ? 0.46 : null;
    if (threshold !== null && p < threshold - 0.06) this.snapArmed = true;

    if (!this._enabled || !motion || isHidden()) {
      if (this.context?.state === 'running' || this.voices.size) this.suspend();
      return;
    }
    this.resumeIfAllowed();
    if (this.context?.state !== 'running') return;

    if (threshold !== null && previous !== null && this.snapArmed
      && previous < threshold && p >= threshold && p > previous) {
      this.snapArmed = false;
      this.crack(this.scene === 9 ? 0.7 : 1);
    }

    if (this.scene === 1 && p > 0.16 && p < 0.83) {
      // No catch-up burst after a stalled frame or restored tab.
      this.heatElapsed += clamp(Number.isFinite(dt) ? dt : 0, 0, 0.1);
      if (this.heatElapsed > 1.5 + hash(this.serial + 11) * 0.5) {
        this.heatElapsed = 0;
        this.burst({ duration: 0.18 + hash(this.serial + 3) * 0.09, peak: 0.11, frequency: 3900, q: 0.48 });
      }
    } else this.heatElapsed = 0;
  }

  burst({ duration, peak, frequency, q = 0.7, delay = 0 }) {
    const context = this.context;
    if (!this._enabled || this.destroyed || isHidden() || context?.state !== 'running'
      || !this.buffer || this.voices.size >= 6) return;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = this.buffer;
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    filter.Q.value = q;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    const start = context.currentTime + delay;
    const attack = Math.min(0.012, duration * 0.2);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, Math.min(peak, 0.19)), start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    const voice = { source, filter, gain };
    this.voices.add(voice);
    source.onended = () => {
      this.voices.delete(voice);
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
    const offset = hash(++this.serial + 41) * Math.max(0, this.buffer.duration - duration - 0.1);
    source.start(start, offset, duration + 0.02);
    source.stop(start + duration + 0.025);
  }

  crack(strength) {
    this.burst({ duration: 0.066, peak: 0.16 * strength, frequency: 2400, q: 0.65 });
    this.burst({ duration: 0.051, peak: 0.09 * strength, frequency: 4100, q: 0.5, delay: 0.022 });
    this.burst({ duration: 0.045, peak: 0.05 * strength, frequency: 3200, q: 0.6, delay: 0.059 });
  }

  stopVoices() {
    for (const { source, filter, gain } of this.voices) {
      source.onended = null;
      try { source.stop(); } catch { /* The short voice may have ended already. */ }
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    }
    this.voices.clear();
  }

  suspend() {
    this.heatElapsed = 0;
    this.stopVoices();
    if (!this.context || this.context.state === 'closed') return;
    this.master?.gain.cancelScheduledValues(this.context.currentTime);
    this.master?.gain.setValueAtTime(0, this.context.currentTime);
    if (this.context.state !== 'suspended') this.context.suspend().catch(() => {});
  }

  destroy() {
    if (this.destroyed) return;
    this._enabled = false;
    this.destroyed = true;
    this.epoch++;
    this.stopVoices();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
    this.master?.disconnect();
    if (this.context && this.context.state !== 'closed') this.context.close().catch(() => {});
    this.master = null;
    this.buffer = null;
  }
}
