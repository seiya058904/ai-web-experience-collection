import { clamp, smooth } from './scroll.js';

/** A room reaches its final pose before its exposure gives way to the next.
 * No elapsed time, remembered direction, or second camera filter participates.
 * The lower plate stays opaque: complementary alpha fades would expose black.
 */
export function roomComposition(index, progress, count, reduced = false) {
  const local = clamp(progress);
  const mix = !reduced && index < count - 1 ? smooth(.80, 1, local) : 0;
  return {
    base: index,
    next: mix > 0 ? index + 1 : null,
    mix,
    pose: reduced ? .45 : smooth(0, .80, local),
    baseText: 1 - smooth(.08, .48, mix),
    nextText: smooth(.46, .92, mix),
  };
}

/** Reading light belongs to the same exposure as its exhibit. Changing the
 * chapter number must never switch a fixed, black header/footer plate on. */
export function roomReadingLight(index, reliefReveal = 0, compact = false) {
  const relief = clamp(reliefReveal);
  // The relief's top/bottom reading masks still darken the intermediate
  // exposure. Keep light ink longer there, until those masks have receded.
  const light = index === 7 ? 1 : index === 5 ? relief * relief : 0;
  return {
    light,
    header: index === 5 ? 1 - relief : [1, 2].includes(index) || compact && [0, 4].includes(index) ? 1 : 0,
    footer: index === 5 ? 1 - relief : [1, 2, 4].includes(index) ? 1 : 0,
  };
}
