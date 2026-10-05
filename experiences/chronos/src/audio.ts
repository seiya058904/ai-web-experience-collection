/** Quiet original mechanical ticks, synthesized locally; never autoplay. */
export class MechanicalSound {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private buffer: AudioBuffer | null = null;
  private lastBeat = -1;
  enabled = false;

  async toggle() {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = .11;
      this.master.connect(this.context.destination);
      this.buffer = this.context.createBuffer(1, Math.ceil(this.context.sampleRate * .035), this.context.sampleRate);
      const data = this.buffer.getChannelData(0);
      let seed = 173;
      for (let i = 0; i < data.length; i++) {
        seed = (seed * 16807) % 2147483647;
        data[i] = ((seed / 2147483647) * 2 - 1) * Math.exp(-i / (this.context.sampleRate * .006));
      }
    }
    if (this.context.state === 'suspended') await this.context.resume();
    this.enabled = !this.enabled;
    this.lastBeat = -1;
    return this.enabled;
  }

  update(mechanicalTime: number, running: boolean) {
    const beat = Math.floor(mechanicalTime * 8);
    if (!this.enabled || !running || !this.context || this.context.state !== 'running') { this.lastBeat = beat; return; }
    if (beat === this.lastBeat) return;
    const previous = this.lastBeat;
    this.lastBeat = beat;
    if (previous < 0) return;
    const source = this.context.createBufferSource();
    source.buffer = this.buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = beat % 2 ? 2100 : 1450;
    filter.Q.value = 1.4;
    source.connect(filter).connect(this.master!);
    source.onended = () => { source.disconnect(); filter.disconnect(); };
    source.start();
  }

  async suspend() { if (this.context?.state === 'running') await this.context.suspend(); }
  async resume() { if (this.enabled && this.context?.state === 'suspended') await this.context.resume(); }
  dispose() { void this.context?.close(); this.context = null; }
}
