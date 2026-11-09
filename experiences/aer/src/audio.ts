/** A quiet, user-initiated air texture. No downloads or microphone access. */
export class AirSound {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private desired = false;

  async setEnabled(enabled: boolean): Promise<boolean> {
    this.desired = enabled;
    if (!enabled) {
      if (this.context && this.gain) {
        this.gain.gain.cancelScheduledValues(this.context.currentTime);
        this.gain.gain.setTargetAtTime(0, this.context.currentTime, 0.12);
      }
      return false;
    }
    if (!this.context) {
      this.context = new AudioContext();
      const buffer = this.context.createBuffer(1, this.context.sampleRate * 6, this.context.sampleRate);
      const data = buffer.getChannelData(0);
      let seed = 93713;
      let previous = 0;
      for (let i = 0; i < data.length; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        previous = (previous + 0.018 * (seed / 2147483648 - 1)) / 1.018;
        data[i] = previous * 3.2 * (0.76 + 0.24 * Math.cos(i / data.length * Math.PI * 2));
      }
      this.source = this.context.createBufferSource();
      this.source.buffer = buffer;
      this.source.loop = true;
      const filter = this.context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 650;
      this.gain = this.context.createGain();
      this.gain.gain.value = 0;
      this.source.connect(filter).connect(this.gain).connect(this.context.destination);
      this.source.start();
    }
    await this.context.resume();
    if (!this.desired) return false;
    this.gain!.gain.cancelScheduledValues(this.context.currentTime);
    this.gain!.gain.setTargetAtTime(0.12, this.context.currentTime, 0.45);
    return true;
  }

  async setHidden(hidden: boolean): Promise<void> {
    if (!this.context) return;
    if (hidden) await this.context.suspend();
    else if (this.desired) await this.context.resume();
  }

  dispose(): void {
    this.desired = false;
    this.source?.stop();
    this.source?.disconnect();
    this.gain?.disconnect();
    void this.context?.close();
  }
}
