import { clamp } from './mission';

/** User-initiated, local synthesized ambience. No autoplay or external audio requests. */
export class MissionAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private rumble: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private sources: AudioScheduledSourceNode[] = [];
  private intent = 0;
  private destroyed = false;
  private hidden = false;
  enabled = false;
  async toggle() {
    if (this.destroyed) return false;
    const intent = ++this.intent;
    this.enabled = !this.enabled;
    if (!this.enabled) { this.master?.gain.setTargetAtTime(0, this.context!.currentTime, .2); return false; }
    try {
      if (!this.context) this.build();
      const context = this.context!;
      await context.resume();
      if (intent !== this.intent || context !== this.context || this.destroyed) return this.enabled;
      this.master!.gain.setTargetAtTime(this.hidden ? 0 : .16, context.currentTime, .5);
      if (this.hidden) await context.suspend();
      return this.enabled;
    } catch {
      if (intent === this.intent) {
        this.enabled = false;
        if (this.context) this.master?.gain.setTargetAtTime(0, this.context.currentTime, .2);
      }
      return this.enabled;
    }
  }
  private build() {
    const context = new AudioContext(); this.context = context;
    const master = context.createGain(); master.gain.value = 0; master.connect(context.destination); this.master = master;
    const compressor = context.createDynamicsCompressor(); compressor.threshold.value = -18; compressor.ratio.value = 4; compressor.connect(master);
    const low = context.createOscillator(); low.type = 'sine'; low.frequency.value = 55;
    const high = context.createOscillator(); high.type = 'sine'; high.frequency.value = 82.41;
    const pad = context.createGain(); pad.gain.value = .1; pad.connect(compressor); low.connect(pad); high.connect(pad);
    const noise = context.createBuffer(1, context.sampleRate * 3, context.sampleRate); const buffer = noise.getChannelData(0);
    let seed = 19; let last = 0; for (let i=0;i<buffer.length;i++) { seed=(seed*16807)%2147483647; last=(last+.022*((seed/2147483647)*2-1))/1.022; buffer[i]=last*3.5; }
    const source = context.createBufferSource(); source.buffer=noise; source.loop=true;
    const filter=context.createBiquadFilter(); filter.type='lowpass'; filter.frequency.value=140; this.filter=filter;
    const rumble=context.createGain(); rumble.gain.value=.15; this.rumble=rumble;
    source.connect(filter);filter.connect(rumble);rumble.connect(compressor);
    low.start();high.start();source.start();this.sources=[low,high,source];
  }
  update(progress: number) {
    if (!this.context || !this.enabled) return;
    const burn = clamp(1-Math.abs(progress-1.85)/1.5);
    this.rumble?.gain.setTargetAtTime(.15+burn*.8,this.context.currentTime,.3);
    this.filter?.frequency.setTargetAtTime(140+burn*800,this.context.currentTime,.4);
  }
  visibility(hidden: boolean) {
    this.hidden = hidden;
    const context = this.context;
    if (!context) return;
    this.master?.gain.setTargetAtTime(hidden || !this.enabled ? 0 : .16, context.currentTime, .2);
    if (hidden) void context.suspend().catch(() => {});
    else if (this.enabled) void context.resume().then(() => {
      if (context !== this.context || this.destroyed) return;
      this.master?.gain.setTargetAtTime(this.hidden || !this.enabled ? 0 : .16, context.currentTime, .2);
      if (this.hidden) void context.suspend().catch(() => {});
    }).catch(() => {});
  }
  destroy() {
    this.destroyed = true; this.intent++; this.enabled = false;
    this.sources.forEach(s=>{try{s.stop();}catch{}});
    void this.context?.close().catch(() => {});
    this.context = null; this.master = null; this.sources = [];
  }
}
