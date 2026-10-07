import type { Box, ContentKey, Design } from './scenes.ts';
import { clamp, mix, range, smooth } from './math.ts';

type Waypoint = [number, Partial<Box>];

/**
 * The two desktop handoffs which exchange the header and footer registers.
 * Every route is a direct sample of immutable scene endpoints and explicit
 * waypoints. No frame history, layout reads, replacement content, or opacity
 * changes are needed when scrubbing, reversing, or resizing the composition.
 */
export function routeDesktopSupplement(d: Design, a: Design, b: Design, progress: number, next: number): Design {
  const t = clamp(progress);
  const { w: W, h: H, mobile } = d.viewport;
  if (mobile || (next !== 6 && next !== 10) || t === 0 || t === 1 || W <= 0 || H <= 0) return d;

  const xy = (x: number, y: number, w?: number, h?: number): Partial<Box> => ({
    x: x * W, y: y * H,
    ...(w === undefined ? {} : { w: w * W }),
    ...(h === undefined ? {} : { h: h * H })
  });
  const route = (key: ContentKey, stops: Waypoint[]) => {
    // Limit choreography to geometry. Typography personalities and all visual
    // treatments continue to be sampled by the existing interpolation engine.
    const props = ['x', 'y', 'w', 'h', 'size', 'rotate'] as const;
    for (const prop of props) {
      if (!stops.some(([, values]) => values[prop] !== undefined)) continue;
      let previous = a.parts[key][prop], previousTime = 0;
      for (const [at, values] of [...stops, [1, b.parts[key]] as Waypoint]) {
        const target = values[prop] ?? previous;
        if (t <= at) {
          d.parts[key][prop] = mix(previous, target, smooth(range(previousTime, at, t)));
          break;
        }
        previous = target;
        previousTime = at;
      }
    }
  };
  const keep = (key: ContentKey, at: number): Waypoint => [at, { ...a.parts[key] }];
  const land = (key: ContentKey, at: number): Waypoint => [at, { ...b.parts[key] }];
  const smallFolio = Math.min(W * .04, H * .047, b.parts.number.size);
  const footerMark = (clear: number, cross: number, settle: number) => route('mark', [
    [clear, { x: a.parts.mark.x, y: H - 7, w: 6, h: 6, rotate: 0 }],
    [cross, { x: b.parts.mark.x, y: H - 7, w: 6, h: 6, rotate: 0 }],
    land('mark', settle)
  ]);

  if (next === 6) {
    // The title's width is intrinsic (max-content). Its actual font size,
    // rather than its Box.w, opens a lane beside the reading column.
    const title = { ...xy(.03, .10), size: Math.min(W * .20, H * .36), rotate: 0 };
    route('title', [[.18, title], [.90, title]]);
    route('image', [
      [.18, { ...xy(.94, .025, .042, .49), rotate: 0 }],
      [.91, { ...xy(.94, .025, .042, .49), rotate: 0 }]
    ]);
    const subtitle = { ...xy(.03, .55, .50), size: Math.min(a.parts.subtitle.size, b.parts.subtitle.size, W * .037, H * .07) };
    route('subtitle', [[.18, subtitle], [.89, subtitle]]);
    route('body', [
      [.18, { x: a.parts.body.x, y: a.parts.body.y, w: a.parts.body.w }],
      [.30, { ...xy(.03, .79, .50) }],
      [.89, { ...xy(.03, .79, .50) }]
    ]);
    const number = { ...xy(.55, .72, .10), size: Math.min(W * .065, H * .105, b.parts.number.size), rotate: 0 };
    route('number', [
      keep('number', .13), [.26, number], [.84, number],
      [.90, { x: b.parts.number.x }],
      [.945, { y: b.parts.number.y }]
    ]);
    route('action', [keep('action', .27), land('action', .40)]);

    // Place goes first. Metadata follows through the same vertical lane;
    // their sideways journeys use a row above the final footer labels.
    route('place', [
      keep('place', .18), [.27, { ...xy(.67, .03, .23) }],
      [.43, { ...xy(.67, .89, .23) }],
      [.50, { x: b.parts.place.x, y: H * .89, w: b.parts.place.w }],
      land('place', .57)
    ]);
    route('meta', [
      keep('meta', .45), [.57, { ...xy(.67, .03, .23) }],
      [.74, { ...xy(.67, .89, .23) }],
      [.82, { x: b.parts.meta.x, y: H * .89, w: b.parts.meta.w }],
      land('meta', .88)
    ]);
    footerMark(.18, .88, .98);
    return d;
  }

  // Variable -> Synthesis: the folio travels first, then the action, then
  // the two labels. Body copy holds above their horizontal transit row.
  const title = { ...xy(.01, .12), size: Math.min(W * .18, H * .30), rotate: 0 };
  route('title', [[.13, title], [.94, title]]);
  route('image', [
    [.15, { ...xy(.94, .69, .06, .17), rotate: 0 }],
    [.82, { ...xy(.94, .015, .06, .84), rotate: 0 }],
    [.94, { ...xy(.94, .015, .06, .84), rotate: 0 }]
  ]);
  const subtitle = { ...xy(.012, .52, .34), size: Math.min(a.parts.subtitle.size, b.parts.subtitle.size, W * .032, H * .067) };
  route('subtitle', [
    [.13, { x: a.parts.subtitle.x, y: a.parts.subtitle.y, w: W * .34, size: subtitle.size }],
    [.28, subtitle], [.94, subtitle]
  ]);
  route('body', [
    [.15, { ...xy(.37, .73, .27) }],
    [.895, { ...xy(.37, .73, .27) }],
    land('body', .98)
  ]);
  route('number', [
    [.13, { x: a.parts.number.x, y: a.parts.number.y, w: W * .09, size: smallFolio, rotate: 0 }],
    [.18, { ...xy(.76, .23, .09), size: smallFolio }],
    [.30, { ...xy(.76, .87, .09), size: smallFolio }],
    [.40, { x: b.parts.number.x, y: H * .87, size: smallFolio }],
    [.47, { y: b.parts.number.y, size: smallFolio }],
    [.94, { size: smallFolio }]
  ]);
  route('action', [
    [.13, { ...xy(.74, .013, .17) }],
    [.31, { ...xy(.74, .013, .17) }],
    [.44, { x: W * .74, y: H - 48, w: W * .17 }],
    land('action', .49)
  ]);

  // Account for the action's real 40px minimum height. This line remains
  // above its hit area even on a shorter landscape stage.
  const labelHeight = Math.max(a.parts.meta.size, b.parts.meta.size, a.parts.place.size, b.parts.place.size) * 1.4;
  const footTransit = H - 48 - labelHeight - 10;
  route('place', [
    keep('place', .45), [.53, { ...xy(.67, .018, .23) }],
    [.65, { x: W * .67, y: footTransit, w: W * .23 }],
    [.70, { x: b.parts.place.x, y: footTransit, w: b.parts.place.w }],
    land('place', .76)
  ]);
  route('meta', [
    keep('meta', .66), [.74, { ...xy(.67, .018, .23) }],
    [.83, { x: W * .67, y: footTransit, w: W * .23 }],
    [.88, { x: b.parts.meta.x, y: footTransit, w: b.parts.meta.w }],
    land('meta', .925)
  ]);
  footerMark(.13, .66, .94);
  return d;
}
