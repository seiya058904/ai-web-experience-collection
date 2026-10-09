import type { Box, ContentKey, Design, View } from './scenes.ts';
import { clamp } from './math.ts';

/** A shallow field needs its own reading order, not a scaled portrait page. */
export const isWideShort = (view: View): boolean => !view.mobile && view.w / view.h > 2.35;

export function layoutShort(index: number, d: Design): Design {
  if (!isWideShort(d.viewport)) return d;
  const { w: W, h: H } = d.viewport;
  const p = d.parts;
  const put = (key: ContentKey, x: number, y: number, w: number, h: number, extra: Partial<Box> = {}) => {
    Object.assign(p[key], { x: x * W, y: y * H, w: w * W, h: h * H, rotate: 0 }, extra);
  };
  const copy = clamp(W * .01, 13, 19);
  const label = clamp(W * .0076, 11, 15);
  const subtitle = clamp(Math.min(W * .03, H * .095), 22, 38);

  // A real lower reading register leaves the top field to type and image.
  put('title', .012, .14, .60, .45, { size: Math.min(W * .29, H * .57) });
  put('subtitle', .015, .64, .325, .25, { size: subtitle, leading: 1.05 });
  put('body', .38, .655, .34, .27, { size: copy, leading: 1.34 });
  put('meta', .015, 4 / H, .42, .06, { size: label, leading: 1.3 });
  put('place', .55, 4 / H, .25, .06, { size: label, leading: 1.3 });
  put('action', .78, (H - 44) / H, .22, 44 / H, { size: label, leading: 1.1 });
  put('number', .56, .15, .13, .30, { size: Math.min(H * .25, W * .095) });
  put('image', .73, .16, .27, .41);
  put('mark', (W - 24) / W, .65, 20 / W, 20 / H);

  if (index === 0) {
    // Keep the opening point and a compact specimen register.
    put('title', 0, .76, .145, .20, { size: clamp(W * .052, 38, 78), leading: .82 });
    put('subtitle', .155, .66, .17, .29, { size: clamp(W * .018, 15, 23), leading: 1.1 });
    put('body', .35, .66, .23, .30, { size: clamp(W * .011, 12, 17), leading: 1.32 });
    put('meta', .61, .63, .205, .07, { size: label });
    put('place', .61, .75, .205, .07, { size: label });
    put('action', .61, (H - 44) / H, .19, 44 / H, { size: label });
    put('number', .815, .73, .075, .20, { size: Math.min(W * .043, H * .21) });
    put('image', .90, .68, .10, .32);
    put('mark', 2 / 3, .26, 6 / W, 6 / H);
  } else if (index === 1) {
    put('image', .70, .28, .225, .29);
    p.number.size *= .78;
  } else if (index === 3) {
    put('title', .012, .13, .64, .45, { size: Math.min(W * .38, H * .59), rotate: -7 });
    put('number', .57, .15, .13, .27, { size: Math.min(H * .25, W * .095), rotate: -7 });
    put('image', .745, .25, .24, .32, { rotate: -6 });
  } else if (index === 4) {
    // The oversized word remains a deliberate crop, above complete reading copy.
    put('title', -.055, .105, 1.12, .435, { size: W * .59, leading: .8 });
    put('subtitle', .015, .64, .325, .27, { size: subtitle });
    put('number', .765, .65, .105, .22, { size: Math.min(H * .20, W * .085) });
    put('image', .90, .64, .10, .22);
    put('mark', (W - 22) / W, 2 / H, 20 / W, 20 / H);
  } else if (index === 5) {
    // A full-height editorial bleed, with a quiet page beside it.
    put('title', .015, .12, .66, .46, { size: Math.min(W * .32, H * .58) });
    put('subtitle', .015, .61, .325, .26, { size: subtitle });
    put('body', .38, .60, .34, .29, { size: copy });
    put('place', .48, 4 / H, .235, .06, { size: label });
    put('image', .755, 0, .245, 1);
    put('number', .58, .18, .13, .28, { size: Math.min(H * .26, W * .10) });
    put('action', .43, (H - 44) / H, .27, 44 / H, { size: label });
    put('mark', .02, (H - 25) / H, 20 / W, 20 / H);
  } else if (index === 6) {
    put('title', .018, .14, .62, .43, { size: Math.min(W * .32, H * .57) });
    put('image', .685, .06, .295, .50);
    put('number', .775, .62, .17, .20, { size: Math.min(H * .19, W * .12) });
    put('place', .50, 4 / H, .175, .06, { size: label });
    put('mark', (W - 25) / W, (H - 25) / H, 20 / W, 20 / H);
  } else if (index === 7) {
    put('title', .012, .15, .60, .42, { size: Math.min(W * .27, H * .53) });
    put('number', .60, .19, .105, .22, { size: Math.min(H * .17, W * .07) });
    put('image', .73, .14, .27, .43);
    p.subtitle.size = Math.min(subtitle, 28);
  } else if (index === 9) {
    // The four live axes own a measured-height dock; copy remains above it.
    const A = Math.max(100, H - 80);
    put('title', .012, A * .15 / H, .77, A * .48 / H, { size: Math.min(W * .37, A * .48) });
    put('subtitle', .015, A * .67 / H, .31, A * .29 / H, { size: clamp(A * .105, 19, 31) });
    put('body', .38, A * .66 / H, .37, A * .31 / H, { size: copy });
    put('number', .86, A * .28 / H, .13, A * .30 / H, { size: Math.min(A * .26, W * .08) });
    put('image', .815, A * .66 / H, .185, A * .30 / H);
    put('action', .82, 0, .18, 44 / H, { size: label });
    put('mark', .76, 3 / H, 18 / W, 18 / H);
  } else if (index >= 10) {
    put('title', .012, .13, .64, .43, { size: Math.min(W * .32, H * .56) });
    put('image', .735, .015, .265, .81);
    put('number', .57, .20, .13, .27, { size: Math.min(H * .24, W * .095) });
    put('mark', .66, .54, 20 / W, 20 / H);
    if (index === 11) put('mark', 2 / 3, .26, 6 / W, 6 / H);
  }
  return d;
}
