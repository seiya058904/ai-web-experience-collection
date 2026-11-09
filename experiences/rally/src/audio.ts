/** Small, deterministic authored impact sounds. No network/audio autoplay. */
export class RallyAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private enabled = false;
  async setEnabled(enabled: boolean) {
    if (!enabled) { this.enabled = false; if (this.master && this.context) this.master.gain.setTargetAtTime(0, this.context.currentTime, .02); return true; }
    try {
      this.context ??= new AudioContext();
      this.master ??= this.context.createGain();
      this.master.connect(this.context.destination);
      await this.context.resume();
      this.enabled = this.context.state === 'running';
      this.master.gain.setValueAtTime(.16, this.context.currentTime);
      return this.enabled;
    } catch { this.enabled = false; return false; }
  }
  impact(kind: 'racket' | 'ground' | 'catch') {
    if (!this.enabled || !this.context || !this.master || document.hidden) return;
    const context = this.context, at = context.currentTime;
    const oscillator = context.createOscillator(), envelope = context.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(kind === 'ground' ? 110 : kind === 'catch' ? 135 : 230, at);
    oscillator.frequency.exponentialRampToValueAtTime(65, at + .09);
    envelope.gain.setValueAtTime(.0001, at);
    envelope.gain.exponentialRampToValueAtTime(kind === 'catch' ? .22 : .6, at + .003);
    envelope.gain.exponentialRampToValueAtTime(.0001, at + .13);
    oscillator.connect(envelope); envelope.connect(this.master);
    oscillator.start(at); oscillator.stop(at + .15);
    const length = Math.ceil(context.sampleRate * .045), buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0); let seed = 281;
    for (let i = 0; i < length; i++) { seed = (seed * 16807) % 2147483647; data[i] = ((seed / 2147483647) * 2 - 1) * (1 - i / length) ** 3; }
    const noise = context.createBufferSource(), filter = context.createBiquadFilter(), noiseGain = context.createGain();
    filter.type = 'lowpass'; filter.frequency.value = kind === 'ground' ? 1800 : 3400;
    noiseGain.gain.value = kind === 'catch' ? .08 : .2;
    noise.buffer = buffer; noise.connect(filter); filter.connect(noiseGain); noiseGain.connect(this.master);
    noise.start(at);
    noise.onended = () => { noise.disconnect(); filter.disconnect(); noiseGain.disconnect(); };
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
  }
  suspend() { void this.context?.suspend().catch(() => {}); }
  resume() { if (this.enabled) void this.context?.resume().catch(() => {}); }
  dispose() { this.enabled = false; void this.context?.close().catch(() => {}); }
}
