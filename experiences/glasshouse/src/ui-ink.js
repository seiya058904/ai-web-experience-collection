/** Display-calibrated regions, not a claim that journey darkness is luminance.
 * The sky's left flag and right aperture cross the white/dark ink contrast
 * point at different times after ACES. Values follow atmosphere.js + Three's
 * ACES fit, checked against native transition frames. The floor is darker
 * than the unobstructed sky; the caption anchor changes in portrait framing.
 * This remains an absolute progress function, identical on reverse travel.
 */
const clamp = value => Math.min(1, Math.max(0, value));
const smooth = (a, b, value) => { const t = clamp((value - a) / (b - a)); return t * t * (3 - 2 * t); };
const linear = value => { const v = value / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
const rgb = values => values.map(linear);
const luminance = ([r, g, b]) => .2126 * r + .7152 * g + .0722 * b;
const multiply = (matrix, vector) => matrix.map(row => row.reduce((sum, value, i) => sum + value * vector[i], 0));
const pale = rgb([230, 233, 237]), night = rgb([17, 22, 26]);
const silver = rgb([130, 151, 167]), dayWhite = rgb([246, 247, 247]);
const crossover = Math.sqrt((luminance(rgb([242, 242, 237])) + .05) * (luminance(rgb([23, 26, 27])) + .05)) - .05;

function skyInkThreshold(x, y, textSpan = 0) {
  const heightMix = smooth(.36, 1, y) * .82;
  const daylight = Array.from({ length: textSpan > 0 ? 9 : 1 }, (_, sample) => {
    const aperture = x + textSpan * sample / 8 - y * .49 - .31;
    const windowLight = smooth(-.03, .04, aperture);
    const flag = 1 - Math.exp(-Math.abs(aperture + .035) * 24) * .18;
    return pale.map((p, i) => p * (1 - heightMix) + (silver[i] * (1 - windowLight) + dayWhite[i] * windowLight) * flag * heightMix);
  });
  let low = 0, high = 1;
  for (let i = 0; i < 14; i++) {
    const d = (low + high) / 2;
    const levels = daylight.map(day => {
      const color = day.map((value, j) => (value * (1 - d) + night[j] * (.8 + .35 * y) * d) * (1.04 - .04 * d) / .6);
      const input = multiply([[.59719, .35458, .04823], [.076, .90834, .01566], [.0284, .13383, .83777]], color);
      const fit = input.map(v => (v * (v + .0245786) - .000090537) / (v * (.983729 * v + .432951) + .238081));
      return luminance(multiply([[1.60475, -.53108, -.07367], [-.10208, 1.10813, -.00605], [-.00327, -.07276, 1.07602]], fit).map(clamp));
    });
    // White ink is limited by the brightest part of the word; dark ink by
    // its darkest part. Equalize these worst sampled contrast ratios.
    const contrastLevel = levels.length === 1 ? levels[0] : Math.sqrt((Math.min(...levels) + .05) * (Math.max(...levels) + .05)) - .05;
    if (contrastLevel > crossover) low = d; else high = d;
  }
  return (low + high) / 2;
}

/** Recomputed only on viewport changes. The CSS-sized controls place Motion
 * across the sky's dark flag on a phone, but near its bright aperture on a
 * portrait tablet. Estimate each text's left edge from the fixed header
 * gaps/icons and conservative Manrope advances; never read DOM geometry.
 * Tablet Motion crosses the aperture, so its entire word is sampled. The
 * already calibrated phone and Index paths retain their single-point rule.
 * The atmosphere/ACES calculation is a calibration, not framebuffer sensing.
 */
export function portraitButtonThresholds(width, height) {
  const size = width <= 360 ? 10 : width <= 760 ? 11 : 13;
  const right = 1 - (width <= 760 ? .06 : .052);
  const w = Math.max(280, width), y = clamp(1 - 39 / Math.max(1, height));
  return {
    motion: skyInkThreshold(right - (6.1 * size + 48) / w, y, width > 760 ? 3.4 * size / w : 0),
    index: skyInkThreshold(right - (2.7 * size + 21) / w, y),
  };
}

export function interfacePalette(darkness, region, renderMode = 'webgl', portrait = false, buttons = { motion: .83, index: .83 }) {
  const d = Math.min(1, Math.max(0, Number.isFinite(darkness) ? darkness : 0));
  const threshold = renderMode === 'webgl'
    ? ({ brand: .61, actions: .83, motion: buttons.motion, index: buttons.index, caption: portrait ? .80 : .77, footer: .78 }[region] ?? .77)
    : .5; // Canvas/SVG use their own sRGB background, without ACES.
  const dark = d > threshold;
  const ink = dark ? '#f2f2ed' : '#171a1b';
  return {
    dark,
    ink,
    // Mid-tone backgrounds need full ink for small supporting labels too.
    muted: Math.abs(d - threshold) < .12 ? ink : dark ? '#c2c6c6' : '#41484b',
    line: dark ? 'rgba(235, 241, 241, 0.30)' : 'rgba(23, 31, 35, 0.28)',
  };
}
