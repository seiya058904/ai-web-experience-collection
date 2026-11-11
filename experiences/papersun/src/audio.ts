/**
 * Original, procedural action sounds. No samples, network requests, autoplay,
 * recurring timers, or animation clock. Call enable() inside a user gesture.
 */
export interface PaperAudio {
  enable(): Promise<boolean>;
  disable(): void;
  chime(kind?: 'found' | 'place' | 'lift'): void;
  dispose(): void;
  readonly enabled: boolean;
}

type Voice = { source: AudioScheduledSourceNode; nodes: AudioNode[] };
type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

export function createPaperAudio(): PaperAudio {
  let context: AudioContext | undefined;
  let output: GainNode | undefined;
  let paperNoise: AudioBuffer | undefined;
  let wanted = false;
  let disposed = false;
  let version = 0;
  const voices = new Set<Voice>();
  const maxVoices = 8;

  function release(voice: Voice, stop = false): void {
    if (!voices.delete(voice)) return;
    voice.source.onended = null;
    if (stop) {
      try { voice.source.stop(); } catch { /* Already ended or never started. */ }
    }
    for (const node of voice.nodes) node.disconnect();
  }

  function silence(): void {
    if (context && output && context.state !== 'closed') {
      output.gain.cancelScheduledValues(context.currentTime);
      output.gain.setValueAtTime(0, context.currentTime);
    }
    for (const voice of [...voices]) release(voice, true);
  }

  function openOutput(): void {
    if (!context || !output || !wanted || disposed || document.hidden) return;
    output.gain.cancelScheduledValues(context.currentTime);
    output.gain.setValueAtTime(0, context.currentTime);
    output.gain.linearRampToValueAtTime(0.14, context.currentTime + 0.02);
  }

  function retain(source: AudioScheduledSourceNode, nodes: AudioNode[]): void {
    while (voices.size >= maxVoices) {
      const oldest = voices.values().next().value as Voice | undefined;
      if (oldest) release(oldest, true);
    }
    const voice = { source, nodes };
    voices.add(voice);
    source.onended = () => release(voice);
  }

  function onVisibility(): void {
    if (!context || disposed || context.state === 'closed') return;
    const current = context;
    const token = version;
    if (document.hidden) {
      silence();
      void current.suspend().then(() => {
        // A rapid hide/show can finish its suspension after the show event.
        if (wanted && !disposed && !document.hidden && token === version) {
          return current.resume().then(openOutput);
        }
      }).catch(() => { /* The page remains silent if suspension is unavailable. */ });
    } else if (wanted) {
      void current.resume().then(() => {
        if (token === version && wanted && !disposed && !document.hidden) openOutput();
      }).catch(() => {
        if (token === version) { wanted = false; silence(); }
      });
    }
  }

  document.addEventListener('visibilitychange', onVisibility);

  return {
    async enable(): Promise<boolean> {
      if (disposed) return false;
      const token = ++version;
      wanted = true;
      try {
        if (!context || context.state === 'closed') {
          const Context = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
          if (!Context) { wanted = false; return false; }
          context = new Context();
          output = context.createGain();
          output.gain.value = 0;
          output.connect(context.destination);
          paperNoise = undefined;
        }
        await context.resume();
        if (disposed || !wanted || token !== version) return false;
        if (context.state !== 'running') { wanted = false; silence(); return false; }
        if (document.hidden) onVisibility();
        else openOutput();
        return true;
      } catch {
        if (token === version) { wanted = false; silence(); }
        return false;
      }
    },

    disable(): void {
      ++version;
      wanted = false;
      silence();
    },

    chime(kind = 'found'): void {
      const ctx = context;
      if (!wanted || disposed || !ctx || !output || ctx.state !== 'running' || document.hidden) return;
      const notes = kind === 'lift' ? [392, 523.25, 659.25, 783.99]
        : kind === 'place' ? [587.33, 739.99] : [523.25, 659.25, 783.99];
      const base = ctx.currentTime + 0.005;
      for (const [index, frequency] of notes.entries()) {
        const start = base + index * (kind === 'lift' ? 0.13 : 0.075);
        const oscillator = ctx.createOscillator();
        const envelope = ctx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, start);
        envelope.gain.setValueAtTime(0, start);
        envelope.gain.linearRampToValueAtTime(0.13 / notes.length, start + 0.012);
        envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.65);
        envelope.gain.setValueAtTime(0, start + 0.69);
        oscillator.connect(envelope);
        envelope.connect(output);
        retain(oscillator, [oscillator, envelope]);
        oscillator.start(start);
        oscillator.stop(start + 0.7);
      }

      // A short, seeded noise grain suggests paper; it is generated locally.
      if (!paperNoise) {
        paperNoise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.13), ctx.sampleRate);
        const samples = paperNoise.getChannelData(0);
        let seed = 130729;
        for (let i = 0; i < samples.length; i++) {
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
          samples[i] = seed / 2147483648 - 1;
        }
      }
      const rustle = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const envelope = ctx.createGain();
      rustle.buffer = paperNoise;
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      filter.Q.value = 0.65;
      envelope.gain.setValueAtTime(0, base);
      envelope.gain.linearRampToValueAtTime(0.035, base + 0.018);
      envelope.gain.exponentialRampToValueAtTime(0.0001, base + 0.12);
      rustle.connect(filter);
      filter.connect(envelope);
      envelope.connect(output);
      retain(rustle, [rustle, filter, envelope]);
      rustle.start(base);
      rustle.stop(base + 0.13);
    },

    dispose(): void {
      if (disposed) return;
      ++version;
      wanted = false;
      disposed = true;
      silence();
      document.removeEventListener('visibilitychange', onVisibility);
      output?.disconnect();
      if (context && context.state !== 'closed') void context.close().catch(() => undefined);
      paperNoise = undefined;
      output = undefined;
    },

    get enabled(): boolean { return wanted && !disposed; },
  };
}
