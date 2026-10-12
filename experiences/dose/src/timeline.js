/** Pure scroll-to-composition mapping. Animation time never advances the process. */
export const CHAPTERS = Object.freeze([
  { id: 'prologue', name: 'Prologue', background: [238, 237, 232] },
  { id: 'material', name: 'Material', background: [235, 234, 228] },
  { id: 'distribution', name: 'Distribution', background: [229, 232, 226] },
  { id: 'press', name: 'The press', background: [230, 232, 228] },
  { id: 'surface', name: 'Surface', background: [238, 237, 232] },
  { id: 'evidence', name: 'Evidence', background: [22, 44, 41] },
  { id: 'release', name: 'Release', background: [236, 238, 233] }
]);

export const clamp = (x, min = 0, max = 1) => Math.min(max, Math.max(min, Number.isFinite(x) ? x : min));
export const mix = (a, b, t) => a + (b - a) * t;
export function smoothstep(a, b, value) {
  const t = clamp((value - a) / (b - a));
  return t * t * (3 - 2 * t);
}

export function sampleJourney(scroll, metrics, viewportHeight) {
  if (!metrics.length) return { scene: 0, local: 0, transition: 0, overall: 0 };
  const last = metrics.length - 1;
  const maxScroll = Math.max(1, metrics[last].top + metrics[last].height - viewportHeight);
  const y = clamp(scroll, 0, maxScroll);
  let scene = 0;
  for (let i = 1; i <= last; i++) {
    if (y >= metrics[i].top - 0.01) scene = i;
    else break;
  }
  const travel = Math.max(1, metrics[scene].height - (scene === last ? viewportHeight : 0));
  const local = clamp((y - metrics[scene].top) / travel);
  return { scene, local, transition: scene < last ? smoothstep(.78, 1, local) : 0, overall: y / maxScroll };
}

export function scrollForState(scene, local, metrics, viewportHeight) {
  const i = clamp(Math.round(scene), 0, metrics.length - 1);
  const travel = Math.max(1, metrics[i].height - (i === metrics.length - 1 ? viewportHeight : 0));
  return metrics[i].top + travel * clamp(local);
}

export function colorsForState(state) {
  const current = CHAPTERS[state.scene];
  const next = CHAPTERS[Math.min(state.scene + 1, CHAPTERS.length - 1)];
  const t = state.transition;
  const rgb = current.background.map((v, i) => Math.round(mix(v, next.background[i], t)));
  // A reader can stop at any intermediate background. Keep every UI color
  // legible there, including the gray midpoint of the Evidence transition.
  const relativeLuminance = values => values.map(value => {
    const channel = value / 255;
    return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
  }).reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i], 0);
  const luminance = relativeLuminance(rgb);
  const dark = 1.05 / (luminance + .05) > (luminance + .05) / .05;
  const legible = hex => {
    const foreground = relativeLuminance(hex.slice(1).match(/../g).map(value => parseInt(value, 16)));
    const contrast = (Math.max(foreground, luminance) + .05) / (Math.min(foreground, luminance) + .05);
    return contrast >= 4.5 ? hex : dark ? '#ffffff' : '#000000';
  };
  return {
    page: `rgb(${rgb.join(',')})`,
    ink: legible(dark ? '#f0f0e8' : '#252c2a'),
    muted: legible(dark ? '#c5d3cd' : '#59615d'),
    accent: legible(dark ? '#a9d3c1' : '#39756b'),
    dark
  };
}

export function depthLabel(value) {
  return value < .12 ? 'Surface' : value > .84 ? 'Interior' : 'Within the form';
}
