/**
 * An original, quiet wheel-and-rail texture, synthesised locally. Nothing is
 * downloaded, recorded, or sent. The AudioContext is created only after an
 * explicit enable action, and no JavaScript timer runs for this sound.
 */
export interface AmbientState {
  supported: boolean;
  enabled: boolean;
  playing: boolean;
  error: string | null;
}

export interface AmbientAudio {
  getState(): AmbientState;
  setEnabled(enabled: boolean): Promise<boolean>;
  toggle(): Promise<boolean>;
  destroy(): void;
}

function audioConstructor(): typeof AudioContext | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.AudioContext
    ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
}

function makeRailBuffer(context: AudioContext): AudioBuffer {
  const duration = 4.48; // Eight wheel intervals; the loop joins on the same phase.
  const frames = Math.round(context.sampleRate * duration);
  const buffer = context.createBuffer(2, frames, context.sampleRate);
  let seed = 0x0b37;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296 * 2 - 1;
  };

  for (let channel = 0; channel < 2; channel++) {
    const samples = buffer.getChannelData(channel);
    let softNoise = 0;
    for (let i = 0; i < frames; i++) {
      const time = i / context.sampleRate;
      const wheelPhase = (time + channel * 0.006) % 0.56;
      softNoise = softNoise * 0.992 + random() * 0.008;
      const firstTap = Math.exp(-wheelPhase * 48);
      const secondPhase = (wheelPhase + 0.56 - 0.105) % 0.56;
      const secondTap = Math.exp(-secondPhase * 58) * 0.65;
      const wheel = (firstTap + secondTap)
        * (Math.sin(2 * Math.PI * 92 * time) * 0.11 + random() * 0.024);
      const rumble = softNoise * 0.4 + Math.sin(2 * Math.PI * 50 * time) * 0.014;
      // A tiny edge fade removes any discontinuity in the noise loop without
      // making the rolling texture audibly rise and fall over its full duration.
      const edge = Math.min(1, i / 512, (frames - 1 - i) / 512);
      samples[i] = (wheel + rumble) * Math.max(0, edge);
    }
  }
  return buffer;
}

export function createAmbientAudio(onStateChange: (state: AmbientState) => void = () => {}): AmbientAudio {
  const Constructor = audioConstructor();
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let buffer: AudioBuffer | null = null;
  let source: AudioBufferSourceNode | null = null;
  let enabled = false;
  let disposed = false;
  let revision = 0;
  let error: string | null = null;
  const events = new AbortController();

  const getState = (): AmbientState => ({
    supported: Boolean(Constructor),
    enabled,
    playing: Boolean(source && context?.state === 'running' && !document.hidden),
    error,
  });

  const notify = () => {
    if (!disposed) onStateChange(getState());
  };

  const stopSource = () => {
    if (!source) return;
    try { source.stop(); } catch { /* A stopped source is already silent. */ }
    source.disconnect();
    source = null;
  };

  const updatePlayback = async (): Promise<boolean> => {
    const request = ++revision;
    if (disposed) return false;

    if (!enabled || document.hidden) {
      stopSource();
      if (context && context.state === 'running') {
        try { await context.suspend(); } catch { /* The source is still stopped. */ }
      }
      if (request === revision) notify();
      return true;
    }

    if (!Constructor) {
      enabled = false;
      error = 'Sound is not available in this browser.';
      notify();
      return false;
    }

    try {
      if (!context) {
        context = new Constructor();
        master = context.createGain();
        master.gain.value = 0.18;
        master.connect(context.destination);
        buffer = makeRailBuffer(context);
        context.addEventListener('statechange', notify, { signal: events.signal });
      }
      await context.resume();
      if (disposed) return false;
      if (request !== revision || !enabled || document.hidden) {
        // A rapid mute can overtake resume(). Leave no running audio graph
        // behind when that earlier request eventually completes.
        if ((!enabled || document.hidden) && context.state === 'running') {
          try { await context.suspend(); } catch { /* There is no playing source. */ }
        }
        return false;
      }
      if (context.state !== 'running') throw new Error('Audio remained suspended');
      if (!source) {
        source = context.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(master!);
        source.start();
      }
      error = null;
      notify();
      return true;
    } catch {
      if (disposed || request !== revision) return false;
      stopSource();
      enabled = false;
      error = 'Sound could not start. Select Sound to try again.';
      notify();
      return false;
    }
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => { void updatePlayback(); }, { signal: events.signal });
  }

  const setEnabled = async (next: boolean): Promise<boolean> => {
    if (disposed) return false;
    enabled = next;
    error = null;
    return updatePlayback();
  };

  return {
    getState,
    setEnabled,
    toggle: () => setEnabled(!enabled),
    destroy() {
      if (disposed) return;
      disposed = true;
      revision++;
      enabled = false;
      events.abort();
      stopSource();
      master?.disconnect();
      buffer = null;
      if (context && context.state !== 'closed') void context.close().catch(() => {});
      context = null;
      master = null;
    },
  };
}
