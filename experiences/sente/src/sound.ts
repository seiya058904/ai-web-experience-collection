/** A short, locally synthesized wooden contact. Never required for feedback. */
export class StoneSound {
  private context: AudioContext | null = null;
  private enabled = false;
  setEnabled(value: boolean): void {
    this.enabled = value;
    if (value) {
      try { this.context ??= new AudioContext(); void this.context.resume().catch(() => {}); }
      catch { this.enabled = false; }
    }
  }
  play(): void {
    if (!this.enabled || !this.context) return;
    try {
      const context = this.context;
      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(640, now);
      oscillator.frequency.exponentialRampToValueAtTime(180, now + 0.035);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.09, now + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(now); oscillator.stop(now + 0.07);
    } catch { /* Board commits and visible feedback are independent from sound. */ }
  }
  destroy(): void { void this.context?.close(); this.context = null; }
}
