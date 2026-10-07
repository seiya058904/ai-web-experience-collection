/**
 * MAGMA's optional material sound field. No browser API is touched until a
 * user gesture calls setEnabled(true); importing this file also works in Node.
 *
 * update() accepts normalized heat / flow / split / glass and a boolean
 * complete. The latter fades to an exact zero and suspends the audio clock.
 * No recorded audio, fetches, one-shot queues, or background timers are used
 * other than the cancellable 260 ms fade-out / suspension timer.
 */

const FADE_SECONDS = 0.25;
const FADE_MS = 260;
const MASTER_LEVEL = 0.055;
const PARAM_SMOOTHING = 0.075;

const normalized = (value, fallback) =>
  Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback;

export class MagmaAudio {
  constructor() {
    this._enabled = false;
    this._visible = true;
    this._destroyed = false;
    this._intentVersion = 0;
    this._context = null;
    this._graph = null;
    this._transition = null;
    this._pauseTimer = null;
    this._targets = new WeakMap();
    this._material = { heat: 1, flow: 0, split: 0, glass: 0, complete: false };
  }

  get enabled() {
    return this._enabled;
  }

  /** Call directly from the user's Sound button handler, before any await. */
  async setEnabled(value) {
    if (this._destroyed) return false;
    const version = ++this._intentVersion;
    this._enabled = Boolean(value);

    if (!this._enabled) {
      this._fadeAndPause();
      return false;
    }

    if (!this._createGraph()) {
      if (version === this._intentVersion) this._enabled = false;
      return false;
    }

    this._cancelPause();
    await this._resume(version, true);
    return !this._destroyed && this._enabled;
  }

  update(material = {}) {
    if (this._destroyed) return;
    const previouslyComplete = this._material.complete;
    for (const name of ['heat', 'flow', 'split', 'glass']) {
      this._material[name] = normalized(material[name], this._material[name]);
    }
    if (Object.prototype.hasOwnProperty.call(material, 'complete')) {
      this._material.complete = Boolean(material.complete);
    }
    if (!this._graph) return;

    if (previouslyComplete !== this._material.complete) {
      if (this._canSound()) {
        this._cancelPause();
        void this._resume(this._intentVersion, false);
      } else {
        this._fadeAndPause();
      }
    }
    this._mix();
  }

  /** Hiding pauses the actual AudioContext clock, so nothing catches up later. */
  setVisible(value) {
    if (this._destroyed || this._visible === Boolean(value)) return;
    this._visible = Boolean(value);
    if (!this._graph) return;
    if (this._canSound()) {
      this._cancelPause();
      void this._resume(this._intentVersion, false);
    } else {
      this._fadeAndPause();
    }
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    this._enabled = false;
    ++this._intentVersion;
    this._cancelPause();
    this._silenceExactly();
    const context = this._context;
    const graph = this._graph;
    this._context = null;
    this._graph = null;

    for (const source of graph?.sources ?? []) {
      try { source.stop(); } catch { /* Already stopped or a closed context. */ }
    }
    for (const node of graph?.nodes ?? []) {
      try { node.disconnect(); } catch { /* Disposal remains idempotent. */ }
    }
    if (context && context.state !== 'closed') {
      try { Promise.resolve(context.close()).catch(() => {}); } catch { /* Safe disposal. */ }
    }
  }

  _canSound() {
    return this._enabled && this._visible && !this._material.complete && !this._destroyed;
  }

  _createGraph() {
    if (this._context && this._context.state !== 'closed') return true;
    const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (typeof Context !== 'function') return false;
    let context;
    try {
      context = new Context({ latencyHint: 'playback' });
      const master = context.createGain();
      master.gain.value = 0;

      // The final high-pass removes sub-bass / DC; all sound remains quiet.
      const rumbleCut = context.createBiquadFilter();
      rumbleCut.type = 'highpass';
      rumbleCut.frequency.value = 58;
      rumbleCut.Q.value = 0.55;
      master.connect(rumbleCut);
      rumbleCut.connect(context.destination);

      // A small, local white-noise loop; filters create the low material band.
      const noiseBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * 6), context.sampleRate);
      const channel = noiseBuffer.getChannelData(0);
      let seed = 0x4d41474d;
      for (let i = 0; i < channel.length; i += 1) {
        seed ^= seed << 13;
        seed ^= seed >>> 17;
        seed ^= seed << 5;
        channel[i] = ((seed >>> 0) / 4294967295) * 2 - 1;
      }
      const noise = context.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;
      const bodyFilter = context.createBiquadFilter();
      bodyFilter.type = 'lowpass';
      bodyFilter.frequency.value = 310;
      bodyFilter.Q.value = 0.45;
      const bodyGain = context.createGain();
      bodyGain.gain.value = 0;
      noise.connect(bodyFilter);
      bodyFilter.connect(bodyGain);
      bodyGain.connect(master);

      // Glass contributes only a faint, bounded band of reflected air.
      const airFilter = context.createBiquadFilter();
      airFilter.type = 'bandpass';
      airFilter.frequency.value = 2300;
      airFilter.Q.value = 0.9;
      const airCut = context.createBiquadFilter();
      airCut.type = 'lowpass';
      airCut.frequency.value = 3400;
      airCut.Q.value = 0.5;
      const airGain = context.createGain();
      airGain.gain.value = 0;
      noise.connect(airFilter);
      airFilter.connect(airCut);
      airCut.connect(airGain);
      airGain.connect(master);

      const firstTone = context.createOscillator();
      const secondTone = context.createOscillator();
      firstTone.type = secondTone.type = 'sine';
      firstTone.frequency.value = 80.2;
      secondTone.frequency.value = 112.7;
      const firstGain = context.createGain();
      const secondGain = context.createGain();
      firstGain.gain.value = secondGain.gain.value = 0;
      firstTone.connect(firstGain);
      secondTone.connect(secondGain);
      firstGain.connect(master);
      secondGain.connect(master);

      this._context = context;
      this._graph = {
        master, bodyFilter, bodyGain, airFilter, airGain,
        firstTone, secondTone, firstGain, secondGain,
        sources: [noise, firstTone, secondTone],
        nodes: [noise, bodyFilter, bodyGain, airFilter, airCut, airGain,
          firstTone, secondTone, firstGain, secondGain, master, rumbleCut],
      };
      for (const source of this._graph.sources) source.start();
      return true;
    } catch {
      this._graph = null;
      this._context = null;
      if (context) {
        try { Promise.resolve(context.close()).catch(() => {}); } catch { /* Unsupported implementation. */ }
      }
      return false;
    }
  }

  // Serialize context operations. The first job starts synchronously, retaining
  // the user gesture; later resume/suspend operations never overtake each other.
  _serialize(job) {
    let task;
    if (this._transition) {
      task = this._transition.then(job, job);
    } else {
      try { task = Promise.resolve(job()); } catch { task = Promise.resolve(false); }
    }
    const tail = task.catch(() => false);
    this._transition = tail;
    void tail.then(() => {
      if (this._transition === tail) this._transition = null;
    });
    return tail;
  }

  _resume(version, fromGesture) {
    return this._serialize(async () => {
      const context = this._context;
      if (!context || this._destroyed || !this._enabled) return false;
      if (!fromGesture && !this._canSound()) return this._enabled;
      try {
        if (context.state !== 'running') await context.resume();
        if (context.state !== 'running') throw new Error('Audio context did not resume.');
      } catch {
        // A stale failed activation must not overwrite a newer Sound choice.
        if (fromGesture && version === this._intentVersion) this._enabled = false;
        this._silenceExactly();
        return false;
      }
      if (this._destroyed || context !== this._context) return false;
      if (this._canSound()) {
        this._cancelPause();
        this._mix();
      } else {
        this._fadeAndPause();
      }
      return this._enabled;
    });
  }

  _mix() {
    if (!this._graph || !this._context || this._destroyed) return;
    const { heat, flow, split, glass } = this._material;
    const graph = this._graph;
    this._target(graph.bodyFilter.frequency, 170 + heat * 160 + flow * 100 + split * 35);
    this._target(graph.bodyGain.gain, heat * (0.16 + flow * 0.11 + split * 0.025));
    this._target(graph.firstTone.frequency, 74.2 + heat * 6 + flow * 2);
    this._target(graph.secondTone.frequency, 108.7 + heat * 4 + flow * 1.3);
    this._target(graph.firstGain.gain, 0.15 * heat);
    this._target(graph.secondGain.gain, 0.045 * heat);
    this._target(graph.airFilter.frequency, 2100 + glass * 450);
    this._target(graph.airGain.gain, 0.12 * glass * (1 - heat * 0.7));
    const presence = Math.max(Math.sqrt(heat), glass * 0.24);
    this._target(graph.master.gain, this._canSound() ? MASTER_LEVEL * presence : 0);
  }

  _target(parameter, value) {
    if (!this._context || this._context.state === 'closed') return;
    if (Math.abs((this._targets.get(parameter) ?? Infinity) - value) < 0.00001) return;
    const now = this._context.currentTime;
    try {
      if (typeof parameter.cancelAndHoldAtTime === 'function') {
        parameter.cancelAndHoldAtTime(now);
      } else {
        const held = parameter.value;
        parameter.cancelScheduledValues(now);
        parameter.setValueAtTime(held, now);
      }
      parameter.setTargetAtTime(value, now, PARAM_SMOOTHING);
      this._targets.set(parameter, value);
    } catch { /* A context may close between a scroll update and audio work. */ }
  }

  _fadeAndPause() {
    this._cancelPause();
    if (!this._context || !this._graph) return;
    this._target(this._graph.master.gain, 0);
    // setTarget approaches zero asymptotically; explicitly finish at zero.
    try {
      this._graph.master.gain.setValueAtTime(0, this._context.currentTime + FADE_SECONDS);
    } catch { /* Safe if a browser has already closed the context. */ }
    this._pauseTimer = setTimeout(() => {
      this._pauseTimer = null;
      if (this._canSound() || this._destroyed) return;
      this._silenceExactly();
      void this._serialize(async () => {
        const context = this._context;
        if (!context || this._canSound() || this._destroyed) return;
        try {
          if (context.state === 'running') await context.suspend();
        } catch { /* The master remains exactly zero if suspend is unsupported. */ }
      });
    }, FADE_MS);
  }

  _silenceExactly() {
    if (!this._graph || !this._context) return;
    const parameter = this._graph.master.gain;
    try {
      parameter.cancelScheduledValues(this._context.currentTime);
      parameter.setValueAtTime(0, this._context.currentTime);
      this._targets.set(parameter, 0);
    } catch { /* No action is needed for a context that is already closed. */ }
  }

  _cancelPause() {
    if (this._pauseTimer !== null) clearTimeout(this._pauseTimer);
    this._pauseTimer = null;
  }
}

export default MagmaAudio;
