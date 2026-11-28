export type RGB = [number, number, number];

export const clamp = (n: number, low = 0, high = 1) => Math.min(high, Math.max(low, Number.isFinite(n) ? n : low));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const range = (a: number, b: number, t: number) => clamp((t - a) / (b - a));
export const cubic = (t: number) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const rgb = (hex: string): RGB => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)) as RGB;
export const colorMix = (a: RGB, b: RGB, t: number): RGB => a.map((v, i) => mix(v, b[i], t)) as RGB;
export const cssColor = (a: RGB) => `rgb(${a.map(v => Math.round(clamp(v, 0, 255))).join(' ')})`;
function linearChannel(value: number) {
  const v = value / 255;
  return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
}

export const luminance = ([r, g, b]: RGB) => linearChannel(r) * .2126 + linearChannel(g) * .7152 + linearChannel(b) * .0722;
export function contrast(a: RGB, b: RGB) {
  const lightA = luminance(a), lightB = luminance(b);
  return (Math.max(lightA, lightB) + .05) / (Math.min(lightA, lightB) + .05);
}
export function readable(ink: RGB, paper: RGB, ratio = 4.5): RGB {
  // Check the actual rounded CSS colours, including the middle of dark/light handoffs.
  const rounded = (c: RGB) => c.map(v => Math.round(clamp(v, 0, 255))) as RGB;
  const surface = rounded(paper);
  if (contrast(rounded(ink), surface) >= ratio) return ink;
  const black: RGB = [0, 0, 0], white: RGB = [255, 255, 255];
  return contrast(black, surface) >= contrast(white, surface) ? black : white;
}

export function personality(index: number, t: number) {
  t = clamp(t);
  // Every curve is monotonic and continuous; each re-voices the same handoff.
  // Hold-to-handoff pacing is deliberately even: a change of system should be
  // read as a movement, not as a cut. The curves are all ease-in-out now — the
  // two that used to lead with a hard ease-out read as a snap next to the
  // others, so the copy appeared to lurch into place.
  if (index === 1 || index === 2) return smooth(t);
  if (index === 3) return t < .72 ? cubic(t / .72) * 1.025 : mix(1.025, 1, smooth((t - .72) / .28));
  if (index === 6) return cubic(range(.06, .9, t));
  if (index === 7) return smooth(t);
  if (index === 5) return smooth(smooth(t));
  return cubic(t);
}
