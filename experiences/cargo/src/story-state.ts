import { DEFAULT_CONTAINER_STATE, type ContainerState } from './container-fallback.ts';

export interface SegmentMetric { id: string; top: number; height: number; kind: 'chapter' | 'transition'; index: number }
export interface StoryInput { scrollY: number; viewport: { width: number; height: number }; segments: readonly SegmentMetric[]; reduced: boolean }
export interface TransitionFrame {
  progress: number; stage: number; container: ContainerState; occlusion: number;
  cameraScale: number; cameraX: number; cameraY: number; environment: string;
  support: 'floor' | 'road' | 'rail' | 'spreader' | 'deck';
}

export const clamp = (x: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, Number.isFinite(x) ? x : lo));
export const smooth = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Pure, random-access boundary state. No prior event or elapsed-time history. */
export function evaluateTransition(index: number, value: number, reduced = false): TransitionFrame {
  const p = clamp(value);
  const s = smooth(p);
  const frame: TransitionFrame = {
    progress: p, stage: Math.min(4, Math.floor(p * 4 + 0.0001)),
    container: { ...DEFAULT_CONTAINER_STATE, reduced, packed: true },
    occlusion: 0, cameraScale: 1, cameraX: 0, cameraY: 0,
    environment: 'warehouse', support: 'floor',
  };
  // Opaque mechanical obstruction fully covers a discrete support change.
  const bridge = smooth((p - .26) / .18) * (1 - smooth((p - .56) / .18));
  switch (index) {
    case 0:
      frame.container.mode = p < .42 ? 'identity' : 'interior';
      frame.container.packed = false;
      frame.container.doorsOpen = smooth((p - .18) / .58);
      frame.container.highlight = p < .3 ? 'corners' : 'none';
      frame.cameraScale = 1 + Math.sin(p * Math.PI) * .12;
      frame.environment = p < .5 ? 'gantry' : 'warehouse';
      frame.occlusion = smooth((p - .31) / .10) * (1 - smooth((p - .44) / .15));
      break;
    case 1:
      frame.container.mode = 'doors';
      frame.container.doorsOpen = 1 - smooth(p / .76);
      frame.container.highlight = p > .75 ? 'doors' : 'none';
      frame.cameraScale = lerp(1, 1.09, s);
      break;
    case 2:
      frame.container.mode = p < .5 ? 'identity' : 'road';
      frame.support = p < .5 ? 'floor' : 'road';
      frame.environment = p < .5 ? 'warehouse' : 'road';
      frame.occlusion = bridge;
      break;
    case 3:
      frame.container.mode = p < .5 ? 'road' : 'rail';
      frame.container.highlight = 'corners';
      frame.support = p < .5 ? 'road' : 'rail';
      frame.environment = 'terminal';
      frame.occlusion = bridge;
      break;
    case 4:
      frame.container.mode = 'rail';
      frame.support = 'rail';
      frame.environment = 'landscape';
      frame.cameraScale = lerp(1.12, .78, s);
      frame.cameraX = lerp(2, -5, s);
      break;
    case 5:
      frame.container.mode = p < .5 ? 'rail' : 'identity';
      frame.support = p < .5 ? 'rail' : 'floor';
      frame.environment = p < .5 ? 'terminal' : 'yard';
      frame.occlusion = bridge;
      break;
    case 6:
      frame.container.mode = 'lift';
      frame.container.progress = p;
      frame.container.highlight = p > .2 && p < .65 ? 'corners' : 'none';
      frame.support = p < .45 ? 'floor' : 'spreader';
      frame.environment = 'quayside';
      frame.occlusion = smooth((p - .38) / .09) * (1 - smooth((p - .54) / .12));
      break;
    case 7:
      frame.container.mode = p < .62 ? 'lift' : 'identity';
      frame.container.progress = 1 - smooth(p / .62) * .55;
      frame.support = p < .62 ? 'spreader' : 'deck';
      frame.environment = 'vessel';
      frame.occlusion = smooth((p - .42) / .14) * (1 - smooth((p - .68) / .15));
      frame.cameraScale = lerp(1, .8, s);
      break;
    case 8:
      frame.container.mode = p < .78 ? 'identity' : 'road';
      frame.support = p < .78 ? 'deck' : 'road';
      frame.environment = p < .5 ? 'sea' : 'shore';
      frame.cameraScale = lerp(.8, 1, s);
      // A berth-side structural frame makes the final illustrative transfer explicit.
      frame.occlusion = smooth((p - .64) / .10) * (1 - smooth((p - .81) / .12));
      break;
    case 9:
      frame.container.mode = p < .5 ? 'road' : 'destination';
      frame.support = p < .5 ? 'road' : 'floor';
      frame.container.doorsOpen = smooth((p - .52) / .4);
      frame.environment = 'warehouse';
      frame.occlusion = bridge;
      break;
    default: throw new RangeError('Unknown chapter boundary');
  }
  return frame;
}

export function evaluateStory(input: StoryInput) {
  const y = Math.max(0, input.scrollY);
  const height = Math.max(1, input.viewport.height);
  const point = y + height * .34;
  let active = input.segments[0];
  for (const segment of input.segments) if (point >= segment.top) active = segment;
  const transition = active?.kind === 'transition' ? active : undefined;
  const rawLocal = transition ? clamp((y - transition.top) / Math.max(1, transition.height - height)) : 0;
  // Layout arithmetic can straddle an exact checkpoint by a few floating bits.
  const nearestQuarter = Math.round(rawLocal * 4) / 4;
  const local = Math.abs(rawLocal - nearestQuarter) < 1e-9 ? nearestQuarter : rawLocal;
  const last = input.segments.at(-1);
  const total = last ? last.top + last.height - height : 1;
  return {
    activeId: active?.id ?? 'ch-01',
    chapterIndex: active?.kind === 'transition' ? active.index + (local >= .5 ? 1 : 0) : active?.index ?? 0,
    transitionIndex: transition?.index ?? -1,
    transitionProgress: local,
    frame: transition ? evaluateTransition(transition.index, local, input.reduced) : null,
    overall: clamp(y / Math.max(1, total)),
  };
}
