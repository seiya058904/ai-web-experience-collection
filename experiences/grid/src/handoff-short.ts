import type { Box, ContentKey, Design } from './scenes.ts';
import { mix, range, smooth } from './math.ts';

type Stop = [number, Partial<Box>];

/** Directly sampled routes for the shallow field's own reading registers. */
export function routeShortHandoff(d: Design, a: Design, b: Design, t: number, next: number): Design {
  if (t <= 0 || t >= 1 || next === 11) return d;
  const { w: W, h: H } = d.viewport;
  const route = (key: ContentKey, stops: Stop[]) => {
    for (const prop of ['x', 'y', 'w', 'h', 'size', 'rotate'] as const) {
      if (!stops.some(([, values]) => values[prop] !== undefined)) continue;
      let prior = a.parts[key][prop], previous = 0;
      for (const [at, values] of [...stops, [1, b.parts[key]] as Stop]) {
        const value = values[prop] ?? prior;
        if (t <= at) { d.parts[key][prop] = mix(prior, value, smooth(range(previous, at, t))); break; }
        prior = value; previous = at;
      }
    }
  };
  const keep = (key: ContentKey, at: number): Stop => [at, { ...a.parts[key] }];
  const land = (key: ContentKey, at: number): Stop => [at, { ...b.parts[key] }];
  const strip = (key: 'image', y: number, h: number): Partial<Box> => ({ x: W * .94, y, w: W * .06, h, rotate: 0 });

  if (next === 1) {
    route('title', [[.30, { x: b.parts.title.x, y: b.parts.title.y, size: a.parts.title.size }], land('title', .86)]);
    route('subtitle', [keep('subtitle', .22), land('subtitle', .76)]);
    route('meta', [[.30, { x: a.parts.meta.x, y: b.parts.meta.y, w: a.parts.meta.w }], land('meta', .51)]);
    route('place', [keep('place', .10), [.43, { x: a.parts.place.x, y: b.parts.place.y, w: a.parts.place.w }], land('place', .66)]);
    route('number', [keep('number', .48), land('number', .80)]);
    route('image', [[.22, strip('image', b.parts.image.y, b.parts.image.h)], [.79, strip('image', b.parts.image.y, b.parts.image.h)], land('image', .97)]);
    return d;
  }
  if (next === 4) {
    // Clear the numbered specimen before the word becomes a cropped image.
    route('title', [keep('title', .52), land('title', .96)]);
    route('number', [[.24, { x: b.parts.number.x, y: a.parts.number.y, size: b.parts.number.size }], land('number', .51)]);
    route('image', [[.20, strip('image', a.parts.image.y, a.parts.image.h)], [.76, strip('image', b.parts.image.y, b.parts.image.h)], land('image', .97)]);
    route('mark', [[.18, { x: W - 6, y: a.parts.mark.y, w: 6, h: 6 }], [.48, { x: W - 6, y: 2, w: 6, h: 6 }], land('mark', .75)]);
    return d;
  }
  if (next === 5) {
    route('title', [[.22, { x: b.parts.title.x, y: b.parts.title.y, h: b.parts.title.h, size: b.parts.title.size * .83 }], [.75, { size: b.parts.title.size * .83 }]]);
    route('number', [[.24, { x: W * .65, y: a.parts.number.y, size: Math.min(a.parts.number.size, b.parts.number.size) }], [.57, { x: W * .65, y: b.parts.number.y }], land('number', .76)]);
    route('image', [[.23, strip('image', a.parts.image.y, a.parts.image.h)], [.80, strip('image', b.parts.image.y, b.parts.image.h)], land('image', .97)]);
    route('action', [land('action', .45)]);
    route('mark', [[.20, { x: W - 6, y: 2, w: 6, h: 6 }], [.45, { x: 2, y: 2, w: 6, h: 6 }], [.72, { x: 2, y: b.parts.mark.y, w: 6, h: 6 }], land('mark', .95)]);
    return d;
  }
  if (next === 6) {
    route('image', [[.24, strip('image', a.parts.image.y, a.parts.image.h)], [.75, strip('image', b.parts.image.y, b.parts.image.h)], land('image', .96)]);
    // Let the photograph become a right-hand strip before changing columns.
    // Descend only in Raw's final folio column, beyond the body reading lane.
    route('number', [
      [.24, { x: a.parts.number.x, y: a.parts.number.y, size: b.parts.number.size }],
      [.45, { x: b.parts.number.x, y: a.parts.number.y, size: b.parts.number.size }],
      land('number', .72)
    ]);
    route('action', [keep('action', .65), land('action', .90)]);
    route('mark', [[.20, { x: a.parts.mark.x, y: H - 7, w: 6, h: 6 }], [.70, { x: b.parts.mark.x, y: H - 7, w: 6, h: 6 }], land('mark', .94)]);
    return d;
  }
  if (next === 7) {
    // Cross below the photograph and above the body, then rise at its left.
    // This shallow band needs a small but proportional transit folio; its
    // original Electronic size returns only after the vertical crossing.
    const clearance = Math.max(2, H * .008);
    const bandTop = Math.max(a.parts.image.y + a.parts.image.h, b.parts.image.y + b.parts.image.h) + clearance;
    const bandBottom = Math.min(a.parts.body.y, b.parts.body.y) - clearance;
    // .9em is a conservative line-height budget for the unchanged digit fonts.
    const transitSize = Math.max(1, Math.min(a.parts.number.size, b.parts.number.size, 32, (bandBottom - bandTop) / .9));
    route('number', [
      [.16, { x: a.parts.number.x, y: a.parts.number.y, size: transitSize }],
      [.32, { x: a.parts.number.x, y: bandTop, size: transitSize }],
      [.56, { x: b.parts.number.x, y: bandTop, size: transitSize }],
      [.78, { x: b.parts.number.x, y: b.parts.number.y, size: transitSize }],
      land('number', .94)
    ]);
    return d;
  }
  if (next === 8 || next === 9) {
    // The Interface endpoints are measured from the live four-row container.
    // First make room, then move the original reading nodes into those slots.
    const title = { x: W * .015, y: H * .16, size: Math.min(W * .15, H * .25), rotate: 0 };
    route('title', [[.18, title], [.80, title]]);
    route('image', [[.20, strip('image', a.parts.image.y, a.parts.image.h)], [.85, strip('image', b.parts.image.y, b.parts.image.h)], land('image', .98)]);
    route('subtitle', [[.23, { x: W * .015, y: H * .48, w: W * .30, size: Math.min(a.parts.subtitle.size, b.parts.subtitle.size, 22) }], [.67, { x: b.parts.subtitle.x, y: b.parts.subtitle.y, w: b.parts.subtitle.w, size: Math.min(b.parts.subtitle.size, 22) }], land('subtitle', .86)]);
    route('body', [[.23, { x: W * .36, y: H * .59, w: W * .39, size: 13 }], [.77, { x: b.parts.body.x, y: b.parts.body.y, w: b.parts.body.w, size: b.parts.body.size }]]);
    route('number', [[.22, { x: W * .79, y: H * .15, w: W * .10, size: 28 }], [.57, { x: W * .79, y: b.parts.number.y, size: 28 }], land('number', .80)]);
    route('meta', [land('meta', .32)]);
    route('place', [keep('place', .25), land('place', .60)]);
    route('action', [keep('action', .32), land('action', .80)]);
    route('mark', [[.18, { x: W - 6, y: a.parts.mark.y, w: 6, h: 6 }], [.57, { x: W - 6, y: b.parts.mark.y, w: 6, h: 6 }], land('mark', .84)]);
    return d;
  }
  if (next === 10) {
    // Release the axis dock before the lower reading register expands.
    route('body', [keep('body', .30), land('body', .82)]);
    route('subtitle', [keep('subtitle', .30), land('subtitle', .82)]);
    route('image', [[.23, strip('image', a.parts.image.y, a.parts.image.h)], [.83, strip('image', b.parts.image.y, b.parts.image.h)], land('image', .98)]);
    route('number', [[.22, { x: W * .62, y: a.parts.number.y, size: Math.min(a.parts.number.size, b.parts.number.size) }], land('number', .73)]);
    route('action', [keep('action', .35), [.62, { x: W * .78, y: H - 44 }], land('action', .82)]);
  }
  return d;
}
