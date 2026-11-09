/** An original, optional room tone. No recordings, samples or network requests. */
export class Soundscape {
  private context?: AudioContext;
  private master?: GainNode;
  private voices: OscillatorNode[] = [];
  private active = false;
  async toggle(): Promise<boolean> {
    if (!this.context) {
      this.context = new AudioContext();
      const ctx = this.context;
      this.master = ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(ctx.destination);
      [130.8128, 196.0, 261.6256].forEach((frequency, i) => {
        const voice = ctx.createOscillator();
        const level = ctx.createGain();
        const pan = ctx.createStereoPanner();
        voice.type = 'sine'; voice.frequency.value = frequency;
        voice.detune.value = [-3, 2, 0][i];
        level.gain.value = [0.15, 0.08, 0.04][i];
        pan.pan.value = [-0.4, 0.35, 0][i];
        voice.connect(level).connect(pan).connect(this.master!);
        voice.start(); this.voices.push(voice);
      });
    }
    await this.context.resume();
    this.active = !this.active;
    this.master!.gain.setTargetAtTime(this.active ? 0.14 : 0, this.context.currentTime, 0.6);
    return this.active;
  }
  setPosition(t: number) {
    if (!this.context || !this.active) return;
    const room = 0.10 + Math.sin(t * 0.7) * 0.025;
    this.master!.gain.setTargetAtTime(room, this.context.currentTime, 1.2);
  }
  background(hidden: boolean) {
    if (!this.context) return;
    if (hidden) void this.context.suspend();
    else if (this.active) void this.context.resume();
  }
  dispose() { this.voices.forEach(v => v.stop()); void this.context?.close(); }
}
