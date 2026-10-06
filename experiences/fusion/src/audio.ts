/** Locally synthesized ambient score. Created only after a deliberate user gesture. */
export class FusionAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private fundamental: OscillatorNode | null = null;
  private harmonic: OscillatorNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private noiseGain: GainNode | null = null;
  private enabled = false;

  async setEnabled(enabled: boolean) {
    if (enabled && !this.context) this.create();
    this.enabled = enabled;
    if (!this.context || !this.master) return;
    if (enabled) await this.context.resume();
    this.master.gain.setTargetAtTime(enabled ? .115 : 0, this.context.currentTime, .25);
  }

  private create() {
    const ctx = new AudioContext();
    this.context = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -16;
    limiter.ratio.value = 8;
    this.master.connect(limiter).connect(ctx.destination);

    this.fundamental = ctx.createOscillator();
    this.fundamental.type = 'sine';
    this.fundamental.frequency.value = 44;
    const low = ctx.createGain(); low.gain.value = .48;
    this.fundamental.connect(low).connect(this.master);
    this.fundamental.start();

    this.harmonic = ctx.createOscillator();
    this.harmonic.type = 'sine';
    this.harmonic.frequency.value = 110;
    const upper = ctx.createGain(); upper.gain.value = .12;
    this.harmonic.connect(upper).connect(this.master);
    this.harmonic.start();

    const length = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let seed = 4281, previous = 0;
    for (let i = 0; i < length; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const white = seed / 4294967296 * 2 - 1;
      previous = (previous + .035 * white) / 1.035;
      data[i] = previous * 4.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer; noise.loop = true;
    this.noiseFilter = ctx.createBiquadFilter();
    this.noiseFilter.type = 'bandpass';
    this.noiseFilter.frequency.value = 420;
    this.noiseFilter.Q.value = .7;
    this.noiseGain = ctx.createGain(); this.noiseGain.gain.value = .1;
    noise.connect(this.noiseFilter).connect(this.noiseGain).connect(this.master);
    noise.start();
  }

  update(energy: number, instability: number, field: number) {
    const ctx = this.context;
    if (!ctx || !this.enabled) return;
    this.fundamental?.frequency.setTargetAtTime(42 + energy * 19, ctx.currentTime, .35);
    this.harmonic?.frequency.setTargetAtTime(84 + field * 42, ctx.currentTime, .4);
    this.noiseFilter?.frequency.setTargetAtTime(260 + energy * 900 + instability * 1300, ctx.currentTime, .35);
    this.noiseGain?.gain.setTargetAtTime(.07 + instability * .15, ctx.currentTime, .3);
  }

  async visibility(visible: boolean) {
    if (!this.context) return;
    if (visible && this.enabled) await this.context.resume();
    else await this.context.suspend();
  }

  dispose() { if (this.context) void this.context.close(); this.context = null; }
}
