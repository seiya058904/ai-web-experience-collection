/** Optional, original, very quiet tones. No recording or external audio service. */
export function createSound(onChange: (enabled: boolean, unavailable?: boolean) => void) {
  let context: AudioContext | null = null;
  let enabled = false;
  let timer = 0;
  let master: GainNode | null = null;
  const voices = new Set<OscillatorNode>();
  function phrase() {
    if (!context || !master || !enabled || document.hidden) return;
    const now = context.currentTime;
    [174.614, 220, 261.626].forEach((frequency, i) => {
      const tone = context!.createOscillator();
      const envelope = context!.createGain();
      tone.type = 'sine';
      tone.frequency.value = frequency;
      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(0.012, now + 2.6 + i * .4);
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + 8 + i);
      tone.connect(envelope).connect(master!);
      tone.start(now + i * .15);
      tone.stop(now + 10.5);
      voices.add(tone);
      tone.onended = () => { voices.delete(tone); tone.disconnect(); envelope.disconnect(); };
    });
    timer = window.setTimeout(phrase, 16000);
  }
  async function toggle() {
    try {
      enabled = !enabled;
      window.clearTimeout(timer);
      if (enabled) {
        context ??= new AudioContext();
        if (!master) { master = context.createGain(); master.gain.value = .55; master.connect(context.destination); }
        await context.resume();
        master.gain.cancelScheduledValues(context.currentTime);
        master.gain.setTargetAtTime(.55, context.currentTime, .3);
        phrase();
      } else if (context && master) {
        master.gain.cancelScheduledValues(context.currentTime);
        master.gain.setTargetAtTime(0, context.currentTime, .15);
      }
      onChange(enabled);
    } catch {
      enabled = false;
      onChange(false, true);
    }
  }
  async function visibility() {
    window.clearTimeout(timer);
    if (!context) return;
    if (document.hidden) await context.suspend();
    else if (enabled) { await context.resume(); phrase(); }
  }
  document.addEventListener('visibilitychange', visibility);
  return {
    toggle,
    destroy() {
      enabled = false; window.clearTimeout(timer);
      voices.forEach(voice => { try { voice.stop(); } catch { /* already ended */ } });
      document.removeEventListener('visibilitychange', visibility);
      void context?.close();
    },
  };
}
