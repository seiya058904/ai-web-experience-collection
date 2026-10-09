import type { Axes } from './scenes.ts';

/** Exact advance of the four existing GRID spans. Source WOFF2 SHA 5107a806ba9bb123c5ff2d9465905d04b767c694d125fd58103b88048a38a613.
 * Derived metrics: original Roboto Flex SIL OFL, retained beside the font.
 * This calculates the advance of four separate spans, not glyph-ink bounds,
 * kerning across spans, tracking caused by transforms, or another font/text.
 */
const AXES: Record<keyof Axes, readonly [number, number, number]> = {"opsz":[8.0,14.0,144.0],"wght":[100.0,400.0,1000.0],"wdth":[25.0,100.0,151.0],"slnt":[-10.0,0.0,0.0]};
const OPSZ_MAP = [[-1.0,-1.0],[0.0,0.0],[0.16925048828125,0.49200439453125],[0.5384521484375,0.94598388671875],[1.0,1.0]];
// [summed font-unit delta, opsz support sign, wght sign, wdth sign].
const TERMS = [[170,-1,0,0],[-1004,1,0,0],[-350,0,-1,0],[439,0,1,0],[-525,0,0,-1],[449,0,0,1],[82,-1,-1,0],[131,-1,1,0],[310,1,-1,0],[824,1,1,0],[49,-1,0,-1],[305,-1,0,1],[-1733,1,0,-1],[1517,1,0,1],[102,0,-1,-1],[103,0,-1,1],[23,0,1,-1],[102,0,1,1],[-102,-1,-1,-1],[-28,-1,-1,1],[-200,-1,1,-1],[-245,-1,1,1],[-534,1,-1,-1],[-71,1,-1,1],[1057,1,1,-1],[-60,1,1,1]];
function normalized(value: number | undefined, [min, normal, max]: readonly [number, number, number]) {
  const v = Math.max(min, Math.min(max, Number.isFinite(value) ? value! : normal));
  return v === normal ? 0 : v < normal ? (v - normal) / (normal - min) : (v - normal) / (max - normal);
}
function opticalCoordinate(v: number) {
  for (let i = 1; i < OPSZ_MAP.length; i++) {
    const [x1, y1] = OPSZ_MAP[i], [x0, y0] = OPSZ_MAP[i - 1];
    if (v <= x1) return y0 + (y1 - y0) * (v - x0) / (x1 - x0);
  }
  return 1;
}
/** trackingEm is CSS letter-spacing in em, including all four individual spans. */
export function gridAdvanceEm(axes: Partial<Axes> = {}, trackingEm = 0): number {
  const coords = [opticalCoordinate(normalized(axes.opsz, AXES.opsz)), normalized(axes.wght, AXES.wght), normalized(axes.wdth, AXES.wdth)];
  let units = 4569;
  for (const [delta, ...signs] of TERMS) {
    let influence = 1;
    for (let i = 0; i < 3; i++) if (signs[i]) influence *= Math.max(0, signs[i] * coords[i]);
    units += delta * influence;
  }
  return units / 2048 + 4 * (Number.isFinite(trackingEm) ? trackingEm : 0);
}
/** Composition fit: only reduce overflowing authored size, uniformly.
 * The caller owns composition-specific available width and optical clearance.
 */
export function fitGridFontSize(authoredPx: number, availablePx: number, axes: Partial<Axes> = {}, trackingEm = 0): number {
  if (!Number.isFinite(authoredPx) || !Number.isFinite(availablePx)) throw new TypeError('Finite authored size and width required');
  const advance = gridAdvanceEm(axes, trackingEm);
  if (!(advance > 0)) throw new RangeError('Positive GRID advance required');
  return Math.max(0, Math.min(authoredPx, availablePx / advance));
}
