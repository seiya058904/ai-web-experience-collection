/** Pure, reversible timeline. The viewport is an exhibition stage, never seven pins. */
export const CHAPTERS = [
  { id: 'light', name: 'Light', zh: '光起' },
  { id: 'facet', name: 'Facet', zh: '切面' },
  { id: 'polish', name: 'Polish', zh: '抛光' },
  { id: 'depth', name: 'Depth', zh: '深处' },
  { id: 'color', name: 'Color', zh: '色泽' },
  { id: 'brilliance', name: 'Brilliance', zh: '火彩' },
  { id: 'exhibit', name: 'Exhibit', zh: '展境' },
] as const;
export type ChapterId = typeof CHAPTERS[number]['id'];
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, Number.isFinite(x) ? x : a));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export function smooth(a: number, b: number, x: number): number {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}
export function ease(t: number): number { return smooth(0, 1, t); }
export interface NarrativeState {
  position: number;
  index: number;
  local: number;
  progress: number;
  phase: 'enter' | 'composition' | 'hold' | 'handoff' | 'exit';
}
export function sampleNarrative(position: number): NarrativeState {
  const p = clamp(position, 0, CHAPTERS.length - 0.001);
  const index = Math.floor(p);
  const local = p - index;
  return {
    position: p, index, local, progress: p / (CHAPTERS.length - 0.001),
    phase: local < 0.15 ? 'enter' : local < 0.36 ? 'composition' : local < 0.76 ? 'hold' : local < 0.94 ? 'handoff' : 'exit',
  };
}
/** A shared transition interval spans the boundary; positions and derivatives are continuous. */
export function chapterBlend(position: number, index: number): number {
  if (index === 0) return 1 - smooth(0.76, 1.16, position);
  if (index === CHAPTERS.length - 1) return smooth(index - 0.24, index + 0.16, position);
  return smooth(index - 0.24, index + 0.16, position) * (1 - smooth(index + 0.76, index + 1.16, position));
}
export function captionOpacity(position: number, index: number): number {
  const p = position - index;
  const enter = index === 0 ? 1 : smooth(-0.04, 0.15, p);
  return enter * (index === CHAPTERS.length - 1 ? 1 : 1 - smooth(0.75, 0.97, p));
}
export function chapterTarget(index: number): number { return clamp(index, 0, CHAPTERS.length - 1) + (index === 0 ? 0 : 0.30); }
