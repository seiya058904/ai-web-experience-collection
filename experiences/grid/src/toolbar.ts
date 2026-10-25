import { clamp, smooth } from './math.ts';

/** Same scene coordinate, with a small ownership margin for an active control. */
export function toolbarPresentation(coordinate: number, chapter: 8 | 9, engaged: boolean, reduced = false) {
  const local = coordinate - chapter;
  const start = engaged ? .42 : .32, end = start + .14;
  const opacity = local < 0 || local > end ? 0 : reduced && local < .5 ? 1
    : 1 - smooth(clamp((local - start) / .14));
  return { opacity, hidden: opacity <= .001, interactive: opacity > .35 };
}
