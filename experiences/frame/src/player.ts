import { FPS, FRAMES, makeTimeline, normalizeFrame, type Timeline } from './timeline.ts';

export interface PlaybackSnapshot {
  readonly frame: number;
  /** Zero-based index within the active playback table (which can be a clip). */
  readonly beat: number;
  readonly playing: boolean;
  readonly elapsedMs: number;
  readonly totalBeats: number;
  readonly duration: number;
  readonly complete: boolean;
}

export interface PlayOptions {
  restart?: boolean;
  from?: number;
  to?: number;
  omitLookback?: boolean;
}

interface Selection {
  from: number;
  to: number;
  omitLookback: boolean;
}

const fullSelection = (): Selection => ({ from: 1, to: FRAMES, omitLookback: false });
const beatMs = 1000 / FPS;

/**
 * A deterministic clock consumed by the application's one shared RAF loop.
 * It never starts a RAF, reads wall-clock time, or decides chapter visibility.
 */
export class FilmPlayer {
  private timeline: Readonly<Timeline> = makeTimeline();
  private beats: readonly number[] = this.timeline.beats;
  private selection: Selection = fullSelection();
  private elapsed = 0;
  private beatIndex = 0;
  private running = false;
  private ended = false;
  private lastTick: number | null = null;
  private readonly onChange: (snapshot: PlaybackSnapshot) => void;

  /** Read `.state` for the initial value; the constructor does not call back. */
  constructor(onChange: (snapshot: PlaybackSnapshot) => void = () => {}) {
    this.onChange = onChange;
  }

  get state(): Readonly<PlaybackSnapshot> {
    return Object.freeze({
      frame: this.beats[this.beatIndex],
      beat: this.beatIndex,
      playing: this.running,
      elapsedMs: this.elapsed,
      totalBeats: this.beats.length,
      duration: this.beats.length / FPS,
      complete: this.ended,
    });
  }

  private publish(): void { this.onChange(this.state); }

  private stopClock(): void {
    this.running = false;
    this.lastTick = null;
  }

  private restoreFullTable(): void {
    this.selection = fullSelection();
    this.beats = this.timeline.beats;
  }

  /** Edits pause immediately and keep a valid selected pose in the new full take. */
  configure(config: unknown): void {
    const frame = this.state.frame;
    this.stopClock();
    this.timeline = makeTimeline(config);
    this.restoreFullTable();
    this.beatIndex = this.beats.indexOf(frame);
    this.elapsed = this.beatIndex * beatMs;
    this.ended = false;
    this.publish();
  }

  /** Manual stepping visits independent poses, not their repeated hold beats. */
  setFrame(frame: number): void {
    this.stopClock();
    this.restoreFullTable();
    this.beatIndex = this.beats.indexOf(normalizeFrame(frame));
    this.elapsed = this.beatIndex * beatMs;
    this.ended = false;
    this.publish();
  }

  play(options: PlayOptions = {}): void {
    const hasSelection = options.from !== undefined || options.to !== undefined || options.omitLookback !== undefined;
    let selection = this.selection;
    if (hasSelection) {
      const from = normalizeFrame(options.from ?? 1);
      const to = normalizeFrame(options.to ?? FRAMES);
      selection = { from: Math.min(from, to), to: Math.max(from, to), omitLookback: options.omitLookback === true };
    } else if (options.restart) {
      selection = fullSelection();
    }
    const selectionChanged = selection.from !== this.selection.from || selection.to !== this.selection.to
      || selection.omitLookback !== this.selection.omitLookback;
    const proposed = selectionChanged
      ? Object.freeze(this.timeline.beats.filter(frame => frame >= selection.from && frame <= selection.to
        && !(selection.omitLookback && (frame === 17 || frame === 18))))
      : this.beats;
    if (!proposed.length) throw new RangeError('The selected playback range contains no frames.');
    if (this.running && !selectionChanged && !options.restart) return;
    this.selection = selection;
    this.beats = proposed;
    if (selectionChanged || options.restart || this.ended) {
      this.elapsed = 0;
      this.beatIndex = 0;
    }
    this.ended = false;
    this.running = true;
    // The first tick establishes a fresh clock. Hidden/paused wall time is excluded.
    this.lastTick = null;
    this.publish();
  }

  pause(): void {
    const changed = this.running;
    this.stopClock();
    if (changed) this.publish();
  }

  tick(nowMs: number): void {
    if (!this.running) return;
    if (!Number.isFinite(nowMs)) { this.pause(); return; }
    if (this.lastTick === null) { this.lastTick = nowMs; return; }
    const delta = nowMs - this.lastTick;
    if (delta < 0) {
      this.pause();
      return;
    }
    // A delayed visible frame still advances the film's clock. Visibility,
    // offscreen and page lifecycle handlers explicitly pause and reset lastTick.
    this.lastTick = nowMs;
    if (!delta) return;
    const previousBeat = this.beatIndex;
    const durationMs = this.beats.length * beatMs;
    this.elapsed = Math.min(durationMs, this.elapsed + delta);
    this.beatIndex = Math.min(this.beats.length - 1, Math.floor((this.elapsed + 1e-7) / beatMs));
    if (this.elapsed >= durationMs - 1e-7) {
      this.elapsed = durationMs;
      this.ended = true;
      this.stopClock();
      this.publish();
    } else if (this.beatIndex !== previousBeat) {
      this.publish();
    }
  }
}
