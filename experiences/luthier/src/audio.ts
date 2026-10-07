/**
 * Original procedural sound design for LUTHIER.
 *
 * This is a synthesized, bowed-string-like texture, not a violin recording or an
 * acoustic measurement. All noise and reverberation are generated locally.
 * Construction is silent and creates no AudioContext. Call enable() directly
 * from a user gesture; the owner supplies frames, visibility, and disposal.
 *
 * Web Audio cannot detect the operating system's mute state, a muted browser
 * tab, disconnected output, or every device silent-mode policy. enabled reports
 * the user's successful opt-in, not a guarantee that a speaker is audible.
 */

export interface ViolinAudioFrame {
  /** Scene coordinate: 0 = Presence, 5 = First Bow, 8 = Return; end = 9. */
  story: number;
  /** Normalized contact/excitation amount, between 0 and 1. */
  bowAmplitude: number;
  /** Normalized opening of the surrounding acoustic space. */
  spaceOpen: number;
  hidden: boolean;
}

type ContextConstructor = new (options?: AudioContextOptions) => AudioContext;

interface VoiceGraph {
  master: GainNode;
  brightness: BiquadFilterNode;
  bowNoise: GainNode;
  room: GainNode;
  vibratoDepth: GainNode;
}

const clamp = (value: number, low = 0, high = 1): number =>
  Math.min(high, Math.max(low, Number.isFinite(value) ? value : low));

const smoothstep = (low: number, high: number, value: number): number => {
  const t = clamp((value - low) / (high - low));
  return t * t * (3 - 2 * t);
};

/** Small seeded generator: reproducible texture, with no external audio assets. */
function randomStream(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export class ViolinAudio {
  private context: AudioContext | null = null;
  private graph: VoiceGraph | null = null;
  private nodes: AudioNode[] = [];
  private sources: AudioScheduledSourceNode[] = [];
  private targets = new Map<AudioParam, number>();
  private optedIn = false;
  private requested = false;
  private disposed = false;
  private intent = 0;
  private enableTask: Promise<boolean> | null = null;
  private suspendTask: Promise<void> | null = null;
  private resumeTask: Promise<void> | null = null;
  private suspendAt = Number.POSITIVE_INFINITY;
  private hadContact = false;
  private contactAt = 0;
  private frame: ViolinAudioFrame = {
    story: 0,
    bowAmplitude: 0,
    spaceOpen: 0,
    hidden: false,
  };

  /** Remains true while an opted-in listener's hidden tab is suspended. */
  get enabled(): boolean {
    return this.optedIn;
  }

  async enable(): Promise<boolean> {
    if (this.disposed || this.frame.hidden) return false;
    if (this.enableTask && this.requested) return this.enableTask;
    if (this.optedIn && this.context?.state === 'running') return true;

    this.requested = true;
    const token = ++this.intent;
    const task = this.activate(token);
    this.enableTask = task;
    try {
      return await task;
    } finally {
      if (this.enableTask === task) this.enableTask = null;
    }
  }

  disable(): void {
    this.requested = false;
    this.optedIn = false;
    this.intent += 1;
    this.hadContact = false;
    if (!this.context || !this.graph) return;
    this.target(this.graph.master.gain, 0, 0.09);
    // The owning ticker can suspend after the short release; no private timer.
    this.suspendAt = this.context.currentTime + 0.12;
  }

  update(frame: ViolinAudioFrame): void {
    if (this.disposed) return;
    this.frame = {
      story: clamp(frame.story, 0, 9),
      bowAmplitude: clamp(frame.bowAmplitude),
      spaceOpen: clamp(frame.spaceOpen),
      hidden: Boolean(frame.hidden),
    };
    const context = this.context;
    if (!context || !this.graph) return;
    if (context.state === 'closed') {
      this.optedIn = false;
      this.requested = false;
      return;
    }
    if (this.frame.hidden) {
      // Freeze only after replacing any audible value: restore cannot replay
      // a stale pre-suspension level before the current story frame is applied.
      this.silenceImmediately();
      this.hadContact = false;
      this.suspend();
      return;
    }
    if (!this.optedIn) {
      if (!this.requested && context.currentTime >= this.suspendAt) this.suspend();
      return;
    }
    if (context.state !== 'running') {
      this.restore();
      return;
    }
    this.applyFrame();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.requested = false;
    this.optedIn = false;
    this.intent += 1;
    this.releaseGraph();
  }

  private async activate(token: number): Promise<boolean> {
    try {
      const context = this.ensureGraph();
      this.silenceImmediately();
      if (this.suspendTask) await this.suspendTask;
      if (!this.wants(token)) return false;
      // On first activation this call is reached during the original gesture.
      await context.resume();
      if (!this.wants(token)) {
        if (!this.requested || this.frame.hidden) this.suspend();
        return false;
      }
      if (context.state !== 'running') throw new Error('Audio output is unavailable.');
      this.optedIn = true;
      this.suspendAt = Number.POSITIVE_INFINITY;
      if (this.frame.hidden) {
        this.silenceImmediately();
        this.suspend();
      } else {
        this.applyFrame();
      }
      return true;
    } catch {
      if (token === this.intent) {
        this.optedIn = false;
        this.requested = false;
        this.silenceImmediately();
        this.suspend();
      }
      return false;
    }
  }

  private wants(token: number): boolean {
    return !this.disposed && this.requested && token === this.intent;
  }

  private ensureGraph(): AudioContext {
    if (this.context && this.context.state !== 'closed') return this.context;
    this.releaseGraph();
    const runtime = globalThis as typeof globalThis & {
      webkitAudioContext?: ContextConstructor;
    };
    const Constructor: ContextConstructor | undefined =
      runtime.AudioContext ?? runtime.webkitAudioContext;
    if (!Constructor) throw new Error('Web Audio is not supported.');

    const context = new Constructor({ latencyHint: 'interactive' });
    this.context = context;
    const keep = <T extends AudioNode>(node: T): T => {
      this.nodes.push(node);
      return node;
    };

    try {
      const master = keep(context.createGain());
      master.gain.value = 0;
      const limiter = keep(context.createDynamicsCompressor());
      limiter.threshold.value = -9;
      limiter.knee.value = 9;
      limiter.ratio.value = 2.8;
      limiter.attack.value = 0.006;
      limiter.release.value = 0.16;
      limiter.connect(master).connect(context.destination);

      const mix = keep(context.createGain());
      const dry = keep(context.createGain());
      dry.gain.value = 0.82;
      mix.connect(dry).connect(limiter);
      const reverb = keep(context.createConvolver());
      reverb.buffer = this.roomImpulse(context);
      const room = keep(context.createGain());
      room.gain.value = 0.1;
      mix.connect(reverb).connect(room).connect(limiter);

      const highpass = keep(context.createBiquadFilter());
      highpass.type = 'highpass';
      highpass.frequency.value = 115;
      highpass.Q.value = 0.65;
      const warmth = keep(context.createBiquadFilter());
      warmth.type = 'lowshelf';
      warmth.frequency.value = 380;
      warmth.gain.value = 2.3;
      const body = keep(context.createBiquadFilter());
      body.type = 'peaking';
      body.frequency.value = 950;
      body.Q.value = 0.85;
      body.gain.value = -2;
      const presence = keep(context.createBiquadFilter());
      presence.type = 'peaking';
      presence.frequency.value = 2400;
      presence.Q.value = 0.75;
      presence.gain.value = 1.8;
      const brightness = keep(context.createBiquadFilter());
      brightness.type = 'lowpass';
      brightness.frequency.value = 2400;
      brightness.Q.value = 0.62;
      highpass.connect(warmth).connect(body).connect(presence).connect(brightness).connect(mix);

      const real = new Float32Array(41);
      const imaginary = new Float32Array(41);
      for (let partial = 1; partial < imaginary.length; partial += 1) {
        imaginary[partial] =
          (0.83 + 0.17 * Math.cos(partial * 0.61)) *
          Math.exp(-partial / 30) / Math.pow(partial, 1.06);
      }
      const wave = context.createPeriodicWave(real, imaginary);
      const carrier = keep(context.createOscillator());
      const companion = keep(context.createOscillator());
      carrier.setPeriodicWave(wave);
      companion.setPeriodicWave(wave);
      // D4 is an artistic pitch choice, not an assertion about the displayed
      // string's measured frequency or a reconstructed historical instrument.
      carrier.frequency.value = 293.6648;
      companion.frequency.value = 293.6648;
      companion.detune.value = -2.4;
      const carrierLevel = keep(context.createGain());
      const companionLevel = keep(context.createGain());
      carrierLevel.gain.value = 0.52;
      companionLevel.gain.value = 0.065;
      carrier.connect(carrierLevel).connect(highpass);
      companion.connect(companionLevel).connect(highpass);

      const vibrato = keep(context.createOscillator());
      vibrato.frequency.value = 5.15;
      const vibratoDepth = keep(context.createGain());
      vibratoDepth.gain.value = 2.2;
      vibrato.connect(vibratoDepth);
      vibratoDepth.connect(carrier.detune);
      vibratoDepth.connect(companion.detune);

      const noise = keep(context.createBufferSource());
      noise.buffer = this.bowTexture(context);
      noise.loop = true;
      const noiseHighpass = keep(context.createBiquadFilter());
      noiseHighpass.type = 'highpass';
      noiseHighpass.frequency.value = 780;
      noiseHighpass.Q.value = 0.6;
      const noiseLowpass = keep(context.createBiquadFilter());
      noiseLowpass.type = 'lowpass';
      noiseLowpass.frequency.value = 4100;
      noiseLowpass.Q.value = 0.55;
      const bowNoise = keep(context.createGain());
      bowNoise.gain.value = 0.01;
      noise.connect(noiseHighpass).connect(noiseLowpass).connect(bowNoise).connect(mix);

      this.graph = { master, brightness, bowNoise, room, vibratoDepth };
      this.sources = [carrier, companion, vibrato, noise];
      for (const source of this.sources) source.start();
      return context;
    } catch (error) {
      this.releaseGraph();
      throw error;
    }
  }

  private applyFrame(): void {
    const context = this.context;
    const graph = this.graph;
    if (!context || !graph || !this.optedIn) return;
    const { story, bowAmplitude, spaceOpen } = this.frame;
    const bloom = smoothstep(5.65, 7.15, story);
    const returning = 1 - smoothstep(8, 8.82, story);
    const contact = story >= 5 && bowAmplitude > 0 && returning > 0;
    if (contact && !this.hadContact) this.contactAt = context.currentTime;
    this.hadContact = contact;
    const attack = contact ? Math.exp(-(context.currentTime - this.contactAt) / 0.12) : 0;
    const energy = contact ? Math.pow(bowAmplitude, 0.68) * returning : 0;

    // Conservative headroom: one low-gain master contains both dry and wet
    // paths. Silent scenes also suppress the reverb tail on reverse scrolling.
    this.target(graph.master.gain, 0.185 * energy * (0.72 + 0.28 * bloom), energy ? 0.05 : 0.035);
    this.target(graph.brightness.frequency, 1850 + 1250 * bowAmplitude + 450 * bloom + 500 * spaceOpen, 0.12);
    this.target(graph.bowNoise.gain, 0.007 + 0.014 * bowAmplitude + 0.007 * attack, 0.045);
    this.target(graph.room.gain, 0.08 + 0.25 * spaceOpen + 0.08 * bloom, 0.18);
    this.target(graph.vibratoDepth.gain, 2.2 + 3.8 * bloom + 0.8 * spaceOpen, 0.16);
  }

  private target(parameter: AudioParam, value: number, smoothing: number): void {
    const context = this.context;
    if (!context || context.state === 'closed') return;
    const previous = this.targets.get(parameter);
    if (previous === value) return;
    if (value !== 0 && previous !== undefined &&
      Math.abs(previous - value) < Math.max(0.00001, Math.abs(value) * 0.0005)) return;
    const now = context.currentTime;
    // Hold the computed current value before replacing future automation.
    // The fallback supports engines without cancelAndHoldAtTime.
    if (typeof parameter.cancelAndHoldAtTime === 'function') {
      parameter.cancelAndHoldAtTime(now);
    } else {
      const current = parameter.value;
      parameter.cancelScheduledValues(now);
      parameter.setValueAtTime(current, now);
    }
    if (value === 0) parameter.linearRampToValueAtTime(0, now + smoothing);
    else parameter.setTargetAtTime(value, now, smoothing);
    this.targets.set(parameter, value);
  }

  private silenceImmediately(): void {
    if (!this.context || !this.graph || this.context.state === 'closed') return;
    const gain = this.graph.master.gain;
    if (this.targets.get(gain) === 0 && gain.value === 0) return;
    gain.cancelScheduledValues(this.context.currentTime);
    gain.setValueAtTime(0, this.context.currentTime);
    this.targets.set(gain, 0);
  }

  private suspend(): void {
    const context = this.context;
    if (!context || context.state === 'closed' || context.state === 'suspended' || this.suspendTask) return;
    const task = context.suspend().catch(() => { /* A device may disappear mid-frame. */ });
    this.suspendTask = task;
    void task.finally(() => {
      if (this.suspendTask === task) this.suspendTask = null;
    });
  }

  private restore(): void {
    if (this.resumeTask || !this.optedIn || this.frame.hidden || !this.context) return;
    const context = this.context;
    const token = this.intent;
    this.silenceImmediately();
    const task = (async () => {
      try {
        if (this.suspendTask) await this.suspendTask;
        if (!this.wants(token) || this.frame.hidden || this.context !== context) return;
        await context.resume();
        if (!this.wants(token) || this.frame.hidden) {
          if (!this.requested || this.frame.hidden) this.suspend();
          return;
        }
        if (context.state !== 'running') throw new Error('Audio restoration was blocked.');
        this.applyFrame();
      } catch {
        if (token === this.intent) {
          this.optedIn = false;
          this.requested = false;
          this.silenceImmediately();
          this.suspend();
        }
      }
    })();
    this.resumeTask = task;
    void task.finally(() => {
      if (this.resumeTask === task) this.resumeTask = null;
    });
  }

  private bowTexture(context: AudioContext): AudioBuffer {
    const count = Math.ceil(context.sampleRate * 1.83);
    const buffer = context.createBuffer(1, count, context.sampleRate);
    const data = buffer.getChannelData(0);
    const random = randomStream(0x4c555448);
    const taper = Math.ceil(context.sampleRate * 0.012);
    for (let i = 0; i < count; i += 1) {
      const edge = Math.min(1, i / taper, (count - 1 - i) / taper);
      data[i] = (random() * 2 - 1) * edge;
    }
    return buffer;
  }

  private roomImpulse(context: AudioContext): AudioBuffer {
    const count = Math.ceil(context.sampleRate * 2.05);
    const buffer = context.createBuffer(2, count, context.sampleRate);
    for (let channel = 0; channel < 2; channel += 1) {
      const data = buffer.getChannelData(channel);
      const random = randomStream(0x56494f4c + channel * 197);
      let softened = 0;
      for (let i = 0; i < count; i += 1) {
        softened = 0.55 * softened + 0.45 * (random() * 2 - 1);
        const predelay = smoothstep(context.sampleRate * 0.01, context.sampleRate * 0.022, i);
        data[i] = softened * Math.pow(1 - i / count, 3.4) * predelay;
      }
    }
    return buffer;
  }

  private releaseGraph(): void {
    const context = this.context;
    this.context = null;
    this.graph = null;
    this.targets.clear();
    for (const source of this.sources) {
      try { source.stop(); } catch { /* A partial setup may not have started. */ }
    }
    for (const node of this.nodes) {
      try { node.disconnect(); } catch { /* Already disconnected. */ }
    }
    this.sources = [];
    this.nodes = [];
    this.hadContact = false;
    this.suspendAt = Number.POSITIVE_INFINITY;
    if (context && context.state !== 'closed') void context.close().catch(() => {});
  }
}
