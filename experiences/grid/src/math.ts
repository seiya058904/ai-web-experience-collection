export type RGB = [number, number, number];

export const clamp = (n: number, low = 0, high = 1) => Math.min(high, Math.max(low, Number.isFinite(n) ? n : low));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const range = (a: number, b: number, t: number) => clamp((t - a) / (b - a));
export const cubic = (t: number) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const rgb = (hex: string): RGB => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)) as RGB;
export const colorMix = (a: RGB, b: RGB, t: number): RGB => a.map((v, i) => mix(v, b[i], t)) as RGB;
export const cssColor = (a: RGB) => `rgb(${a.map(v => Math.round(clamp(v, 0, 255))).join(' ')})`;
export const luminance = (a: RGB) => a.map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
export const contrast = (a: RGB, b: RGB) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
export function readable(ink: RGB, paper: RGB, ratio = 4.5): RGB {
  // Check the actual rounded CSS colours, including the middle of dark/light handoffs.
  const rounded = (c: RGB) => c.map(v => Math.round(clamp(v, 0, 255))) as RGB;
  if (contrast(rounded(ink), rounded(paper)) >= ratio) return ink;
  const black: RGB = [0, 0, 0], white: RGB = [255, 255, 255];
  return contrast(black, rounded(paper)) >= contrast(white, rounded(paper)) ? black : white;
}

export function personality(index: number, t: number) {
  t = clamp(t);
  if (index === 1 || index === 2) return 1 - (1 - t) ** 4;
  if (index === 3) return t < .72 ? cubic(t / .72) * 1.025 : mix(1.025, 1, smooth((t - .72) / .28));
  if (index === 6) return t < .2 ? t * .1 : .02 + .98 * (1 - (1 - range(.2, 1, t)) ** 6);
  if (index === 7) return t === 1 ? 1 : Math.floor(smooth(t) * 28) / 28;
  if (index === 5) return smooth(smooth(t));
  return cubic(t);
}
