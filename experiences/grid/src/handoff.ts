import type { Box, ContentKey, Design } from './scenes.ts';
import { clamp, mix, range, smooth } from './math.ts';

type Stop = [number, Partial<Box>];
type Route = (key: ContentKey, stops: Stop[]) => void;

/**
 * Geometric choreography for handoffs that exchange reading order.
 *
 * These are paths through compositions, not a collision solver tied to frame
 * history. A route samples the original endpoints and explicit intermediate
 * anchors. Calling it backwards, after a resize, or in any arbitrary order
 * therefore produces exactly the same geometry. Neither endpoint is mutated.
 * Colours, font-family changes and each scene's easing remain with the engine.
 */
export function routeHandoff(d: Design, a: Design, b: Design, progress: number, next: number): Design {
  const t = clamp(progress);
  if (t === 0 || t === 1) return d;
  const { w: W, h: H, mobile } = d.viewport;
  if (!(W > 0 && H > 0)) return d;

  const xy = (x: number, y: number, w?: number, h?: number): Partial<Box> => ({
    x: x * W, y: y * H, ...(w === undefined ? {} : { w: w * W }), ...(h === undefined ? {} : { h: h * H })
  });
  const route: Route = (key, stops) => {
    const from = a.parts[key], to = b.parts[key];
    const props = new Set<keyof Box>();
    for (const [, values] of stops) for (const prop of Object.keys(values) as (keyof Box)[]) props.add(prop);
    for (const prop of props) {
      // A property absent at a waypoint keeps its last explicit value. Every
      // property still lands on the real, measured destination at t = 1.
      let last = from[prop], lastT = 0;
      let value = last;
      for (const [at, values] of [...stops, [1, to] as Stop]) {
        const target = values[prop] ?? last;
        if (t <= at) {
          value = mix(last, target, smooth(range(lastT, at, t)));
          break;
        }
        last = target; lastT = at; value = target;
      }
      // Routes never change discrete font families or visibility.
      if (prop !== 'family' && prop !== 'opacity') d.parts[key][prop] = value;
    }
  };
  const keep = (key: ContentKey, at: number): Stop => [at, { ...a.parts[key] }];
  const land = (key: ContentKey, at: number): Stop => [at, { ...b.parts[key] }];
  const compactTitle = (begin: number, end: number, size = W * .28, x = 0, y = .10) => {
    route('title', [[begin, { ...xy(x, y), size, rotate: 0 }], [end, { ...xy(x, y), size, rotate: 0 }]]);
  };
  const footerMark = (begin: number, end: number) => {
    route('mark', [
      [begin, { x: a.parts.mark.x, y: H - 7, w: 6, h: 6, rotate: 0 }],
      [end, { x: b.parts.mark.x, y: H - 7, w: 6, h: 6, rotate: 0 }],
      land('mark', Math.min(.97, end + .13))
    ]);
  };

  if (mobile && next === 1) {
    // Lift the opening evidence beside the copy before it gains the full row.
    // The same photograph and both original endpoint boxes stay intact.
    route('image', [
      [.18, { ...xy(.82, .465, .18, .22) }],
      [.62, { ...xy(.82, .465, .18, .22) }],
      land('image', .90)
    ]);
    return d;
  }

  if (mobile && next === 3) {
    // A full-width photograph yields the left reading column before the copy
    // crosses its old vertical position. The Basel rotation arrives last.
    route('image', [
      [.12, { ...xy(.80, .43, .20, .265), rotate: 0 }],
      [.48, { ...xy(.80, .60, .20, .40), rotate: 0 }],
      [.72, { ...xy(.46, .60, .54, .40), rotate: 0 }],
      [.88, { ...xy(.46, .60, .54, .40), rotate: -3 }]
    ]);
    route('body', [
      [.12, { x: 0, y: a.parts.body.y, w: W * .72, size: b.parts.body.size }],
      [.40, { ...xy(0, .56, .40), size: b.parts.body.size }]
    ]);
    compactTitle(.12, .50, W * .40, 0, .03);
    route('subtitle', [keep('subtitle', .20), land('subtitle', .72)]);
    route('number', [
      [.18, { ...xy(.82, .28, .18), size: W * .18, rotate: 0 }],
      [.72, { ...xy(.82, .08, .18), size: W * .18, rotate: -4 }]
    ]);
    route('action', [land('action', .34)]);
    route('mark', [
      [.13, { x: a.parts.mark.x, y: H - 7, w: 6, h: 6 }],
      [.32, { x: W - 6, y: H - 7, w: 6, h: 6 }],
      [.63, { x: W - 6, y: H * .01, w: 6, h: 6 }],
      [.82, { x: b.parts.mark.x, y: H * .01, w: 6, h: 6 }],
      land('mark', .96)
    ]);
    return d;
  }

  if (mobile && next === 5) {
    // Type-as-image -> Editorial: the small evidence image becomes a bleed
    // only after the bottom label has reached the new top margin.
    compactTitle(.14, .81, W * .26, .035, .10);
    route('number', [
      [.12, { ...xy(.75, .855, .20), size: 28 }],
      [.31, { ...xy(.75, .93, .20), size: 28 }],
      [.77, { ...xy(.75, .93, .20), size: 28 }], land('number', .94)
    ]);
    route('image', [
      [.12, { ...xy(.93, .926, .07, .074) }],
      [.31, { ...xy(.93, .412, .07, .285) }],
      [.81, { ...xy(.93, .412, .07, .285) }]
    ]);
    route('body', [
      [.12, { ...xy(0, .744, .60), size: 13 }],
      [.81, { ...xy(.04, .744, .56), size: 13 }]
    ]);
    route('subtitle', [
      [.14, { ...xy(0, .60, .56), size: 24 }],
      [.35, { ...xy(.04, .275, .56), size: 24 }],
      [.81, { ...xy(.04, .275, .56), size: 24 }]
    ]);
    route('meta', [
      keep('meta', .32), [.42, { ...xy(.64, .87, .25) }],
      [.65, { ...xy(.64, .018, .25) }], land('meta', .77)
    ]);
    route('place', [keep('place', .44), land('place', .82)]);
    route('action', [keep('action', .45), land('action', .86)]);
    footerMark(.16, .82);
    return d;
  }

  if (mobile && next === 6) {
    // Editorial -> Raw: swap the image and subtitle in separate columns.
    // The top label travels only after the left column has become narrower.
    compactTitle(.17, .81, W * .27, .035, .065);
    route('image', [
      [.17, { ...xy(.90, .412, .07, .25), rotate: 0 }],
      [.60, { ...xy(.90, .27, .07, .24), rotate: 0 }],
      [.80, { ...xy(.90, .27, .07, .24), rotate: 0 }]
    ]);
    route('subtitle', [
      [.17, { ...xy(.04, .275, .51), size: 24 }],
      [.60, { ...xy(.04, .548, .51), size: 24 }],
      [.80, { ...xy(.04, .548, .51), size: 24 }]
    ]);
    route('body', [
      [.17, { ...xy(.04, .70, .56), size: 13 }],
      [.59, { ...xy(.04, .665, .56), size: 13 }],
      [.80, { ...xy(.04, .665, .56), size: 13 }],
      [.90, { x: b.parts.body.x, y: H * .665, w: b.parts.body.w, size: b.parts.body.size }],
      land('body', .98)
    ]);
    route('meta', [
      keep('meta', .17), [.26, { ...xy(.62, .018, .25) }],
      [.59, { ...xy(.62, .845, .25) }],
      [.71, { ...xy(.04, .845, .92) }], land('meta', .80)
    ]);
    route('number', [
      [.17, { ...xy(.77, .915, .20), size: 40 }],
      [.71, { ...xy(.77, .915, .20), size: 40 }],
      [.85, { ...xy(.78, .56, .20), size: 40 }]
    ]);
    route('place', [keep('place', .71), land('place', .86)]);
    route('action', [keep('action', .20), land('action', .70)]);
    footerMark(.15, .81);
    return d;
  }

  if (mobile && next === 7) {
    // Raw -> Electronic reverses the image/subtitle ordering. Folio first,
    // metadata second: they never occupy the vertical transit lane together.
    compactTitle(.17, .84, W * .24, 0, .105);
    route('image', [
      [.17, { ...xy(.90, .27, .07, .24), rotate: 0 }],
      [.60, { ...xy(.90, .464, .07, .29), rotate: 0 }],
      [.87, { ...xy(.90, .464, .07, .29), rotate: 0 }]
    ]);
    route('subtitle', [
      [.17, { ...xy(.04, .548, .51), size: 22 }],
      [.58, { ...xy(0, .298, .55), size: 22 }],
      [.84, { ...xy(0, .298, .55), size: 22 }]
    ]);
    route('body', [
      [.17, { ...xy(.04, .705, .56), size: 13 }], [.56, { ...xy(0, .705, .56), size: 13 }],
      [.84, { ...xy(0, .79, .56), size: 13 }],
      [.93, { x: b.parts.body.x, y: H * .79, w: b.parts.body.w, size: b.parts.body.size }],
      land('body', .99)
    ]);
    route('number', [
      [.17, { ...xy(.67, .56, .18), size: 28, rotate: 0 }],
      [.43, { ...xy(.67, .035, .18), size: 28, rotate: 0 }],
      land('number', .51)
    ]);
    route('meta', [
      [.17, { ...xy(.04, .84, .92) }], [.44, { ...xy(.04, .84, .92) }],
      [.54, { ...xy(.62, .84, .25) }], [.76, { ...xy(.62, .019, .25) }],
      land('meta', .86)
    ]);
    route('place', [keep('place', .78), land('place', .94)]);
    route('action', [keep('action', .72), land('action', .92)]);
    route('mark', [
      [.17, { x: b.parts.mark.x, y: a.parts.mark.y, w: 6, h: 6 }],
      [.56, { x: b.parts.mark.x, y: b.parts.mark.y, w: 6, h: 6 }],
      land('mark', .68)
    ]);
    return d;
  }

  if (mobile && next === 8) {
    // Measured CSS-Grid destination: copy moves above the photograph, then
    // the photograph expands into its real container-measured media area.
    compactTitle(.15, .78, W * .25, .035, .105);
    route('image', [
      [.16, { ...xy(.91, .464, .06, .29) }],
      [.86, { x: W * .91, y: b.parts.image.y, w: W * .06, h: b.parts.image.h }]
    ]);
    route('subtitle', [
      [.16, { x: a.parts.subtitle.x, y: a.parts.subtitle.y, w: W * .56, size: Math.min(22, b.parts.subtitle.size) }],
      [.42, { x: b.parts.subtitle.x, y: b.parts.subtitle.y, w: W * .56, size: Math.min(22, b.parts.subtitle.size) }],
      [.78, { x: b.parts.subtitle.x, y: b.parts.subtitle.y, w: W * .56, size: Math.min(22, b.parts.subtitle.size) }]
    ]);
    route('number', [
      [.16, { ...xy(.67, .035, .16), size: 28 }],
      [.36, { x: W * .67, y: b.parts.number.y, w: W * .16, size: 28 }],
      [.53, { x: W * .67, y: b.parts.number.y, w: W * .16, size: 28 }],
      land('number', .63)
    ]);
    route('body', [
      [.16, { x: a.parts.body.x, y: a.parts.body.y, w: W * .55 }],
      [.44, { x: b.parts.body.x, y: a.parts.body.y, w: Math.min(b.parts.body.w, W * .56) }],
      [.77, { x: b.parts.body.x, y: b.parts.body.y, w: Math.min(b.parts.body.w, W * .56) }],
      land('body', .86)
    ]);
    route('mark', [
      [.17, { x: W - 6, y: a.parts.mark.y, w: 6, h: 6 }],
      [.60, { x: W - 6, y: b.parts.mark.y, w: 6, h: 6 }],
      land('mark', .80)
    ]);
    route('action', [
      keep('action', .30), [.40, { x: W * .59, y: a.parts.action.y, w: W * .38 }],
      [.78, { x: W * .59, y: a.parts.action.y, w: W * .38 }],
      [.84, { ...xy(.59, .84, .38) }], land('action', .90)
    ]);
    route('place', [
      keep('place', .82), [.90, { x: b.parts.place.x, y: a.parts.place.y, w: b.parts.place.w }],
      [.92, { x: b.parts.place.x, y: a.parts.place.y, w: b.parts.place.w }], land('place', .99)
    ]);
    return d;
  }

  if (mobile && next === 9) {
    // Interface -> Variable. The source may be any measured frame width.
    // The folio descends beside the copy, moves across below it, then rises
    // through the empty right column. The place label follows afterwards.
    compactTitle(.12, .88, W * .265, 0, .10);
    route('image', [
      [.12, { ...xy(.90, .48, .075, .23) }],
      [.86, { ...xy(.90, .535, .075, .17) }]
    ]);
    route('subtitle', [
      [.12, { x: a.parts.subtitle.x, y: a.parts.subtitle.y, w: W * .55, size: 24 }],
      [.54, { x: a.parts.subtitle.x, y: a.parts.subtitle.y, w: W * .55, size: 24 }],
      [.70, { ...xy(0, .38, .56), size: 24 }],
      [.88, { ...xy(0, .38, .56), size: 24 }]
    ]);
    route('number', [
      keep('number', .12), [.24, { x: a.parts.number.x, y: H * .48, w: W * .18, size: 28 }],
      [.36, { ...xy(.67, .48, .18), size: 28 }],
      [.49, { ...xy(.67, .005, .18), size: 28 }],
      [.57, { ...xy(.80, .005, .18), size: 28 }],
      [.88, { ...xy(.80, .005, .18), size: 28 }]
    ]);
    route('body', [
      keep('body', .24), [.34, { x: 0, y: a.parts.body.y, w: W * .56 }],
      [.49, { x: 0, y: a.parts.body.y, w: W * .56 }],
      [.62, { ...xy(0, .545, .56) }], [.88, { ...xy(0, .545, .56) }]
    ]);
    route('place', [
      keep('place', .52), [.61, { x: W * .64, y: a.parts.place.y, w: W * .23 }],
      [.77, { ...xy(.64, .06, .23) }],
      [.87, { ...xy(0, .06, .69) }]
    ]);
    route('meta', [land('meta', .18)]);
    route('action', [
      keep('action', .16), [.36, { ...xy(.09, .733, .43) }],
      [.77, { ...xy(.09, .733, .43) }], land('action', .90)
    ]);
    route('mark', [
      [.13, { x: W - 6, y: a.parts.mark.y, w: 6, h: 6 }],
      [.56, { x: W - 6, y: H - 7, w: 6, h: 6 }],
      [.77, { x: 0, y: H - 7, w: 6, h: 6 }], land('mark', .94)
    ]);
    return d;
  }

  if (mobile && next === 10) {
    // Variable -> Synthesis is an intentional ordering exchange. Keep one
    // narrow media strip, transport the folio, then labels, then body copy.
    compactTitle(.15, .91, W * .26, 0, .10);
    route('subtitle', [
      [.15, { ...xy(.01, .32, .57), size: 24 }],
      [.91, { ...xy(.01, .32, .57), size: 24 }]
    ]);
    route('image', [
      [.15, { ...xy(.90, .50, .10, .20) }],
      [.945, { ...xy(.90, .488, .10, .20) }]
    ]);
    route('number', [
      [.15, { ...xy(.66, .012, .18), size: 36 }],
      [.31, { ...xy(.66, .799, .18), size: 36 }],
      [.42, { ...xy(.01, .799, .24), size: 36 }],
      land('number', .49)
    ]);
    route('meta', [
      keep('meta', .43), [.51, { ...xy(.63, .012, .24) }],
      [.65, { ...xy(.63, .87, .24) }],
      land('meta', .73),
      land('meta', .78)
    ]);
    route('place', [
      keep('place', .43), [.51, { ...xy(.63, .067, .24) }],
      [.65, { ...xy(.63, .925, .24) }],
      land('place', .73),
      land('place', .78)
    ]);
    route('body', [
      [.15, { ...xy(0, .545, .56) }], [.82, { ...xy(0, .545, .56) }],
      [.88, { ...xy(.32, .545, .53) }],
      [.925, { ...xy(.32, .745, .53) }], land('body', .948)
    ]);
    route('action', [
      [.15, { ...xy(.12, .715, .40) }], [.74, { ...xy(.12, .715, .40) }],
      [.755, { ...xy(.62, .715, .38) }], land('action', .775)
    ]);
    route('mark', [
      [.15, { ...xy(0, .731), w: 6, h: 6 }],
      [.75, { ...xy(0, .731), w: 6, h: 6 }],
      [.78, { ...xy(.66, .715), w: 6, h: 6 }],
      [.825, { ...xy(.66, .034), w: 6, h: 6 }], land('mark', .87)
    ]);
    return d;
  }

  if (!mobile && next === 5) {
    // Bottom-to-top folios travel through a temporary seventh column.
    // The photograph opens to a bleed only after both folios have landed.
    compactTitle(.15, .82, Math.min(W * .23, H * .42), .03, .10);
    route('image', [
      [.15, { ...xy(.92, .74, .08, .26) }],
      [.82, { ...xy(.92, 0, .08, 1) }]
    ]);
    route('subtitle', [
      [.15, { ...xy(.032, .60, .48), size: Math.min(a.parts.subtitle.size, b.parts.subtitle.size) }],
      [.82, { ...xy(.032, .60, .48), size: b.parts.subtitle.size }]
    ]);
    route('body', [keep('body', .15), land('body', .29)]);
    route('number', [
      [.15, { ...xy(.79, .755, .12), size: H * .105 }],
      [.82, { ...xy(.79, .755, .12), size: H * .105 }], land('number', .96)
    ]);
    route('action', [
      [.15, { ...xy(.76, .935, .15) }], [.69, { ...xy(.76, .935, .15) }],
      land('action', .80)
    ]);
    route('place', [
      keep('place', .15), [.25, { ...xy(.60, .946, .15) }],
      [.43, { ...xy(.60, .03, .15) }], [.49, { ...xy(.78, .03, .14) }],
      [.78, { ...xy(.78, .03, .14) }], land('place', .89)
    ]);
    route('meta', [
      keep('meta', .45), [.54, { ...xy(.60, .946, .15) }],
      [.71, { ...xy(.60, .03, .15) }], land('meta', .79)
    ]);
    route('mark', [
      [.16, { x: 0, y: H * .48, w: 6, h: 6 }],
      [.73, { x: 0, y: b.parts.mark.y, w: 6, h: 6 }], land('mark', .91)
    ]);
    return d;
  }

  if (!mobile && next === 7) {
    // The large Raw number becomes a folio before traversing the foot strip.
    // It rises at the left of the body column, rather than through the copy.
    compactTitle(.16, .84, Math.min(W * .205, H * .39), .012, .16);
    route('image', [
      [.16, { ...xy(.79, .025, .21, .49) }],
      [.84, { ...xy(.79, .15, .21, .67) }]
    ]);
    route('subtitle', [[.16, { w: W * .48, size: b.parts.subtitle.size, y: b.parts.subtitle.y }], [.84, { w: W * .48 }]]);
    route('body', [land('body', .23)]);
    route('number', [
      [.16, { x: a.parts.number.x, y: a.parts.number.y, w: W * .10, size: b.parts.number.size }],
      [.29, { ...xy(.72, .865, .10), size: b.parts.number.size }],
      [.43, { ...xy(.018, .865, .10), size: b.parts.number.size }], land('number', .53)
    ]);
    route('place', [
      keep('place', .17), [.28, { ...xy(.55, .935, .20) }],
      [.48, { ...xy(.55, .034, .20) }], land('place', .57)
    ]);
    route('meta', [
      keep('meta', .51), [.61, { ...xy(.55, .935, .20) }],
      [.77, { ...xy(.55, .034, .20) }], land('meta', .86)
    ]);
    route('action', [keep('action', .64), land('action', .92)]);
    footerMark(.17, .84);
    return d;
  }

  if (!mobile && next === 9) {
    // Leaving the responsive frame: reserve two real lanes for the labels
    // and action. The display word expands only after that header is clear.
    compactTitle(.15, .87, Math.min(W * .14, H * .21), .03, .06);
    route('image', [
      [.15, { ...xy(.93, .55, .07, .23) }],
      [.86, { ...xy(.93, .69, .07, .17) }]
    ]);
    route('subtitle', [
      [.14, { x: W * .03, y: a.parts.subtitle.y, w: W * .34, size: a.parts.subtitle.size }],
      [.53, { ...xy(0, .69, .38), size: b.parts.subtitle.size }],
      [.87, { ...xy(0, .69, .38), size: b.parts.subtitle.size }]
    ]);
    route('body', [
      [.15, { x: a.parts.body.x, y: a.parts.body.y, w: Math.min(a.parts.body.w, W * .27) }],
      [.35, { ...xy(.43, .53, .20) }], [.79, { ...xy(.43, .53, .20) }],
      [.88, { ...xy(.43, .53, .30) }], land('body', .97)
    ]);
    route('action', [
      keep('action', .15), [.26, { x: a.parts.action.x, y: H - 48, w: a.parts.action.w }],
      [.36, { x: W * .75, y: H - 48, w: W * .17 }],
      [.54, { ...xy(.75, .013, .17) }], land('action', .62)
    ]);
    route('place', [
      keep('place', .56), [.66, { x: W * .65, y: a.parts.place.y, w: W * .17 }],
      [.84, { ...xy(.65, .018, .17) }], land('place', .92)
    ]);
    route('number', [
      [.15, { x: a.parts.number.x, y: a.parts.number.y, w: W * .12, size: 36 }],
      [.32, { x: a.parts.number.x, y: H * .86, w: W * .12, size: 36 }],
      [.58, { ...xy(.84, .86, .12), size: 36 }],
      [.74, { ...xy(.84, .23, .12), size: 36 }], land('number', .94)
    ]);
    route('meta', [land('meta', .17)]);
    route('mark', [
      [.15, { x: W - 6, y: a.parts.mark.y, w: 6, h: 6 }],
      [.70, { x: W - 6, y: H - 7, w: 6, h: 6 }],
      [.82, { x: W * .765, y: H - 7, w: 6, h: 6 }],
      [.94, { x: W * .765, y: b.parts.mark.y, w: 6, h: 6 }], land('mark', .995)
    ]);
    return d;
  }

  return d;
}
