/**
 * Calm replacements for scroll-driven words and images.
 *
 * Narrative text never changes in a single frame: the old words fade out, the
 * new words are written while invisible, then fade in. The fade runs on
 * `filter: opacity()`, which multiplies with any opacity a work already sets,
 * so a work's own reveal choreography keeps working underneath. The element
 * itself is reused, so layout, focus and accessible names stay where they are.
 */

const OUT_MS = 300;
const IN_MS = 560;
const EASE = 'cubic-bezier(.22,1,.36,1)';

interface SwapState { target: string; html: boolean; animation: Animation | null; phase: 'out' | 'in' | 'idle' }
const states = new WeakMap<Element, SwapState>();

const prefersReduced = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function write(element: Element, value: string, html: boolean): void {
  if (html) { if (element.innerHTML !== value) element.innerHTML = value; }
  else if (element.textContent !== value) element.textContent = value;
}

function current(element: Element, html: boolean): string {
  return html ? element.innerHTML : element.textContent ?? '';
}

function fade(element: Element, from: number, to: number, duration: number): Animation | null {
  if (typeof (element as HTMLElement).animate !== 'function') return null;
  return (element as HTMLElement).animate(
    [{ filter: `opacity(${from})` }, { filter: `opacity(${to})` }],
    { duration, easing: EASE, fill: 'both' },
  );
}

function settle(element: Element, state: SwapState): void {
  state.animation?.cancel();
  state.animation = null;
  state.phase = 'idle';
  write(element, state.target, state.html);
}

/**
 * Replace an element's words with a fade out and a fade in.
 * `instant` (for reduced motion or a work's still mode) writes immediately.
 */
export function softText(element: Element | null | undefined, value: string, options: { instant?: boolean; html?: boolean } = {}): void {
  if (!element) return;
  const html = Boolean(options.html);
  let state = states.get(element);
  if (!state) {
    if (current(element, html) === value) return;
    state = { target: value, html, animation: null, phase: 'idle' };
    states.set(element, state);
  }
  state.html = html;
  if (state.target === value && (state.phase !== 'idle' || current(element, html) === value)) return;
  state.target = value;

  if (options.instant || prefersReduced() || !(element as HTMLElement).isConnected) { settle(element, state); return; }

  // Already fading out: the newest words are written when the fade ends.
  if (state.phase === 'out') return;

  // Fading in or resting: fade out from wherever the words are now.
  const start = state.phase === 'in' ? Number(getComputedStyle(element).filter.match(/opacity\(([\d.]+)\)/)?.[1] ?? 1) : 1;
  state.animation?.cancel();
  const out = fade(element, start, 0, OUT_MS * start);
  if (!out) { settle(element, state); return; }
  state.phase = 'out';
  state.animation = out;
  out.onfinish = () => {
    if (state!.animation !== out) return;
    write(element, state!.target, state!.html);
    const into = fade(element, 0, 1, IN_MS);
    out.cancel();
    state!.phase = 'in';
    state!.animation = into;
    if (!into) { state!.phase = 'idle'; return; }
    into.onfinish = () => {
      if (state!.animation !== into) return;
      into.cancel();
      state!.animation = null;
      state!.phase = 'idle';
    };
  };
}

/**
 * A stepped index with a dead band, so a reader resting on a boundary does
 * not see two states alternate. `position` is continuous (for example p * 4).
 */
export function steppedIndex(position: number, previous: number | undefined, band = .08): number {
  const next = Math.round(position);
  if (previous === undefined || !Number.isFinite(previous)) return next;
  return Math.abs(position - previous) > .5 + band ? next : previous;
}

const smooth = (value: number): number => { const t = Math.min(1, Math.max(0, value)); return t * t * (3 - 2 * t); };

/**
 * Opacity of stacked layer `index` when `position` moves continuously through
 * layers 0..n. Each later layer fades in above an opaque earlier one over
 * `width` of a step, centred on the half-way point, so every still holds
 * before the next arrives and no frame is ever half-transparent over paper.
 */
export function layerOpacity(position: number, index: number, width = .6): number {
  if (index === 0) return 1;
  const start = index - .5 - width / 2;
  return smooth((position - start) / width);
}
