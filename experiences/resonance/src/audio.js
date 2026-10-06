/** Local sound synthesis for RESONANCE; this is an illustration, not a physical experiment. */
const TAU = Math.PI * 2;
const SAMPLE_RATE = 44100;
const MASTER_LEVEL = 0.10;
const FADE = 0.035;
const MAX_HARMONICS = 8;
const DEFAULT_HARMONICS = [1, 0.5, 0.25, 0.125];
const SCENE_LEVELS = [0, 0.28, 0.34, 0.32, 0.34, 0.32, 0.26, 0];

function finite(value, fallback) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function clamp(value, low, high) {
  return Math.min(high, Math.max(low, value));
}

function coefficients(values, fallback = DEFAULT_HARMONICS) {
  const source = Array.isArray(values) || ArrayBuffer.isView(values) ? values : fallback;
  if (!source.length) return [...fallback];
  return Array.from(source).slice(0, MAX_HARMONICS).map(value => clamp(finite(value, 0), 0, 1));
}

function normalized(values) {
  const sum = values.reduce((total, value) => total + value, 0);
  return values.map(value => sum > 0 ? value / sum : 0);
}

function disconnect(node) {
  try { node?.disconnect(); } catch { /* A released node is already disconnected. */ }
}

export class ResonanceAudio {
  constructor() {
    this.enabled = false;
    this.context = null;
    this.capture = null;
    this.lastError = null;
    this._state = { scene: 0, frequency: 180, harmonics: [...DEFAULT_HARMONICS], phase: 0 };
    this._hidden = typeof document !== "undefined" && document.hidden;
    this._destroyed = false;
    this._transition = 0;
    this._playRequest = 0;
    this._suspendTimer = null;
    this._master = null;
    this._tone = null;
    this._voices = [];
    this._plucks = new Set();
    this._playbackSources = new Set();
    this._playback = null;
  }

  get playing() {
    return this._playback !== null;
  }

  _ramp(parameter, value, seconds = FADE) {
    const context = this.context;
    if (!parameter || !context || context.state === "closed") return;
    const now = context.currentTime;
    // Hold the actual current value when a slider reverses during an existing fade.
    if (typeof parameter.cancelAndHoldAtTime === "function") {
      parameter.cancelAndHoldAtTime(now);
    } else {
      const current = parameter.value;
      parameter.cancelScheduledValues(now);
      parameter.setValueAtTime(current, now);
    }
    parameter.linearRampToValueAtTime(value, now + seconds);
  }

  _clearSuspend() {
    if (this._suspendTimer !== null) clearTimeout(this._suspendTimer);
    this._suspendTimer = null;
  }

  _scheduleSuspend() {
    this._clearSuspend();
    const context = this.context;
    if (!context || context.state === "closed" || this._destroyed) return;
    const transition = this._transition;
    // One short, cancellable timeout lets the anti-click fade finish before suspension.
    this._suspendTimer = setTimeout(() => {
      this._suspendTimer = null;
      if (transition !== this._transition || this._destroyed || (this.enabled && !this._hidden)) return;
      context.suspend().catch(error => { this.lastError = error; });
    }, context.state === "running" ? Math.ceil(FADE * 1000) + 15 : 0);
  }

  _ensureContext() {
    if (this.context && this.context.state !== "closed") return this.context;
    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContextClass) throw new Error("This browser does not support Web Audio.");
    this._releaseNodes();
    const context = new AudioContextClass({ latencyHint: "interactive" });
    this.context = context;
    this._master = context.createGain();
    this._master.gain.value = 0;
    this._master.connect(context.destination);
    this._tone = context.createGain();
    this._tone.gain.value = 0;
    this._tone.connect(this._master);
    const cosine = context.createPeriodicWave(new Float32Array([0, 1]), new Float32Array([0, 0]), { disableNormalization: true });
    const start = context.currentTime + 0.005;
    for (let index = 0; index < MAX_HARMONICS; index++) {
      const sine = context.createOscillator();
      const quadrature = context.createOscillator();
      const sineGain = context.createGain();
      const cosineGain = context.createGain();
      sine.type = "sine";
      quadrature.setPeriodicWave(cosine);
      sine.frequency.value = quadrature.frequency.value = this._state.frequency * (index + 1);
      sineGain.gain.value = cosineGain.gain.value = 0;
      sine.connect(sineGain).connect(this._tone);
      quadrature.connect(cosineGain).connect(this._tone);
      sine.start(start);
      quadrature.start(start);
      this._voices.push({ sine, quadrature, sineGain, cosineGain });
    }
    this._applyState();
    return context;
  }

  /** Call directly from a user sound-toggle or play gesture. */
  async setEnabled(value) {
    if (this._destroyed) return false;
    this.enabled = Boolean(value);
    const transition = ++this._transition;
    this._clearSuspend();
    if (!this.enabled) {
      this.stopPlayback();
      for (const pluck of this._plucks) this._stopPluck(pluck);
      this._ramp(this._master?.gain, 0);
      this._scheduleSuspend();
      return false;
    }
    try {
      const context = this._ensureContext();
      if (!this._hidden) await context.resume();
      if (transition !== this._transition || this._destroyed) return this.enabled;
      this.lastError = null;
      this._ramp(this._master.gain, this._hidden ? 0 : MASTER_LEVEL);
      if (this._hidden) this._scheduleSuspend();
      return true;
    } catch (error) {
      if (transition !== this._transition || this._destroyed) return this.enabled;
      this.enabled = false;
      this.lastError = error;
      this._ramp(this._master?.gain, 0);
      this._scheduleSuspend();
      throw error;
    }
  }

  setState(next = {}) {
    if (this._destroyed) return;
    const previous = this._state;
    const updated = {
      scene: clamp(Math.round(finite(next.scene, previous.scene)), 0, 7),
      frequency: clamp(finite(next.frequency, previous.frequency), 110, 330),
      harmonics: coefficients(next.harmonics, previous.harmonics),
      phase: clamp(finite(next.phase, previous.phase), 0, Math.PI),
    };
    if (updated.scene === previous.scene && updated.frequency === previous.frequency && updated.phase === previous.phase &&
      updated.harmonics.length === previous.harmonics.length && updated.harmonics.every((value, index) => value === previous.harmonics[index])) return;
    this._state = updated;
    this._applyState();
  }

  _applyState() {
    if (!this.context || !this._tone || this.context.state === "closed") return;
    const weights = normalized(this._state.harmonics);
    this._ramp(this._tone.gain, this.playing ? 0 : SCENE_LEVELS[this._state.scene], 0.065);
    this._voices.forEach((voice, index) => {
      const frequency = this._state.frequency * (index + 1);
      const amplitude = weights[index] || 0;
      // In the interference scene: ½[sin(wt) + sin(wt + phase)], per harmonic.
      const phase = this._state.scene === 3 ? this._state.phase * (index + 1) : 0;
      this._ramp(voice.sine.frequency, frequency);
      this._ramp(voice.quadrature.frequency, frequency);
      this._ramp(voice.sineGain.gain, amplitude * (1 + Math.cos(phase)) * 0.5);
      this._ramp(voice.cosineGain.gain, amplitude * Math.sin(phase) * 0.5);
    });
  }

  excite(strength = 1) {
    const context = this.context;
    if (this._destroyed || !this.enabled || this._hidden || context?.state !== "running") return false;
    const amount = clamp(finite(strength, 1), 0, 1);
    const weights = normalized(this._state.harmonics);
    if (amount === 0 || !weights.some(Boolean)) return false;
    const active = [...this._plucks].filter(pluck => !pluck.retiring);
    if (active.length >= 4) this._stopPluck(active[0], 0.012);
    const imaginary = new Float32Array(weights.length + 1);
    weights.forEach((value, index) => { imaginary[index + 1] = value; });
    const oscillator = context.createOscillator();
    oscillator.setPeriodicWave(context.createPeriodicWave(new Float32Array(imaginary.length), imaginary, { disableNormalization: true }));
    oscillator.frequency.value = this._state.frequency;
    const gain = context.createGain();
    const now = context.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.30 * amount, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);
    gain.gain.linearRampToValueAtTime(0, now + 1.5);
    oscillator.connect(gain).connect(this._master);
    const pluck = { oscillator, gain, retiring: false };
    this._plucks.add(pluck);
    oscillator.onended = () => {
      this._plucks.delete(pluck);
      disconnect(oscillator);
      disconnect(gain);
      oscillator.onended = null;
    };
    oscillator.start(now);
    oscillator.stop(now + 1.51);
    return true;
  }

  _stopPluck(pluck, fade = FADE) {
    if (pluck.retiring) return;
    pluck.retiring = true;
    this._ramp(pluck.gain.gain, 0, fade);
    try { pluck.oscillator.stop(this.context.currentTime + fade + 0.005); } catch { /* Already ended. */ }
  }

  /** Deterministic mono synthesis in memory. No AudioContext or microphone is involved. */
  async captureTone({ frequency = this._state.frequency, harmonics = this._state.harmonics, duration = 3 } = {}) {
    if (this._destroyed) throw new Error("The sound engine has been released.");
    const effectiveFrequency = clamp(finite(frequency, 180), 110, 330);
    const effectiveHarmonics = coefficients(harmonics);
    const weights = normalized(effectiveHarmonics);
    const frames = Math.round(clamp(finite(duration, 3), 0.25, 10) * SAMPLE_RATE);
    const samples = new Float32Array(frames);
    const attackFrames = Math.round(SAMPLE_RATE * 0.012);
    const releaseFrames = Math.round(SAMPLE_RATE * 0.065);
    for (let frame = 0; frame < frames; frame++) {
      const angle = TAU * effectiveFrequency * frame / SAMPLE_RATE;
      let value = 0;
      for (let index = 0; index < weights.length; index++) value += weights[index] * Math.sin(angle * (index + 1));
      const attack = 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, frame / attackFrames));
      const release = 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, (frames - 1 - frame) / releaseFrames));
      samples[frame] = value * 0.68 * attack * release;
    }
    const metadata = {
      duration: frames / SAMPLE_RATE,
      sampleRate: SAMPLE_RATE,
      frames,
      frequency: effectiveFrequency,
      harmonics: [...effectiveHarmonics],
    };
    this.capture = Object.freeze({ ...metadata, harmonics: Object.freeze([...effectiveHarmonics]), samples });
    return metadata;
  }

  /** An explicit play gesture may opt in to sound when it was previously disabled. */
  async playCapture() {
    if (this._destroyed || !this.capture) return false;
    this.stopPlayback();
    const request = this._playRequest;
    if (!this.enabled || !this.context || this.context.state !== "running") await this.setEnabled(true);
    if (request !== this._playRequest || this._destroyed || !this.enabled || this._hidden || this.context?.state !== "running" || !this.capture) return false;
    const context = this.context;
    const capture = this.capture;
    const buffer = context.createBuffer(1, capture.frames, capture.sampleRate);
    buffer.copyToChannel(capture.samples, 0);
    const source = context.createBufferSource();
    source.buffer = buffer;
    const gain = context.createGain();
    const start = context.currentTime + 0.005;
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(0.9, start + 0.02);
    gain.gain.setValueAtTime(0.9, start + capture.duration - 0.03);
    gain.gain.linearRampToValueAtTime(0, start + capture.duration);
    source.connect(gain).connect(this._master);
    const playback = { source, gain };
    this._playback = playback;
    this._playbackSources.add(playback);
    source.onended = () => {
      this._playbackSources.delete(playback);
      disconnect(source);
      disconnect(gain);
      source.onended = null;
      if (this._playback === playback) {
        this._playback = null;
        this._applyState();
      }
    };
    this._applyState();
    source.start(start);
    return true;
  }

  stopPlayback() {
    ++this._playRequest;
    const playback = this._playback;
    this._playback = null;
    if (!playback) return;
    this._ramp(playback.gain.gain, 0);
    try { playback.source.stop(this.context.currentTime + FADE + 0.005); } catch { /* Already ended. */ }
    this._applyState();
  }

  exportWav() {
    if (!this.capture) throw new Error("Capture a signal before exporting audio.");
    const { samples, sampleRate, frames } = this.capture;
    const dataBytes = frames * 2;
    const bytes = new ArrayBuffer(44 + dataBytes);
    const view = new DataView(bytes);
    const text = (offset, value) => {
      for (let index = 0; index < value.length; index++) view.setUint8(offset + index, value.charCodeAt(index));
    };
    text(0, "RIFF");
    view.setUint32(4, 36 + dataBytes, true);
    text(8, "WAVE");
    text(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    text(36, "data");
    view.setUint32(40, dataBytes, true);
    for (let index = 0; index < frames; index++) {
      const sample = clamp(samples[index], -1, 1);
      view.setInt16(44 + index * 2, Math.round(sample * (sample < 0 ? 32768 : 32767)), true);
    }
    return new Blob([bytes], { type: "audio/wav" });
  }

  /** The UI binds visibilitychange and passes document.hidden here. User intent is retained. */
  async setVisibility(hidden) {
    if (this._destroyed) return false;
    this._hidden = Boolean(hidden);
    const transition = ++this._transition;
    this._clearSuspend();
    if (!this.context || this.context.state === "closed") return false;
    if (this._hidden || !this.enabled) {
      this._ramp(this._master?.gain, 0);
      this._scheduleSuspend();
      return false;
    }
    try {
      // Resume only an existing, previously user-authorized context.
      await this.context.resume();
      if (transition !== this._transition || this._destroyed || !this.enabled || this._hidden) return false;
      this.lastError = null;
      this._ramp(this._master.gain, MASTER_LEVEL);
      return this.context.state === "running";
    } catch (error) {
      this.lastError = error;
      return false;
    }
  }

  suspend() { return this.setVisibility(true); }
  resume() { return this.setVisibility(false); }

  _releaseNodes() {
    for (const voice of this._voices) {
      try { voice.sine.stop(); } catch { /* Already stopped. */ }
      try { voice.quadrature.stop(); } catch { /* Already stopped. */ }
      [voice.sine, voice.quadrature, voice.sineGain, voice.cosineGain].forEach(disconnect);
    }
    this._voices = [];
    for (const pluck of this._plucks) {
      pluck.oscillator.onended = null;
      try { pluck.oscillator.stop(); } catch { /* Already stopped. */ }
      disconnect(pluck.oscillator);
      disconnect(pluck.gain);
    }
    this._plucks.clear();
    for (const playback of this._playbackSources) {
      playback.source.onended = null;
      try { playback.source.stop(); } catch { /* Already stopped. */ }
      disconnect(playback.source);
      disconnect(playback.gain);
    }
    this._playbackSources.clear();
    this._playback = null;
    disconnect(this._tone);
    disconnect(this._master);
    this._tone = this._master = null;
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    this.enabled = false;
    ++this._transition;
    ++this._playRequest;
    this._clearSuspend();
    this._releaseNodes();
    const context = this.context;
    this.context = null;
    this.capture = null;
    if (context && context.state !== "closed") context.close().catch(() => {});
  }
}
