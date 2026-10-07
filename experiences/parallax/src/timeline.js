export const SCENES = Object.freeze([
  { id: 'object', name: 'Object' },
  { id: 'fragment', name: 'Fragment' },
  { id: 'alignment', name: 'Alignment' },
  { id: 'reflection', name: 'Reflection' },
  { id: 'rift', name: 'Rift' },
  { id: 'membrane', name: 'Membrane' },
  { id: 'chroma', name: 'Chroma' },
  { id: 'halo', name: 'Halo' },
  { id: 'reassembly', name: 'Reassembly' },
  { id: 'museum', name: 'The museum' },
]);

export const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
export const mix = (a, b, t) => a + (b - a) * t;
export function smoothstep(a, b, x) {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}
export function sampleKeys(keys, progress) {
  const p = clamp(Number.isFinite(progress) ? progress : 0, 0, keys.length - 1);
  const a = Math.floor(p), b = Math.min(keys.length - 1, a + 1);
  return mix(keys[a], keys[b], smoothstep(.14, .86, p - a));
}

// Distance, not elapsed time: the long approach, passage and optical handoff
// receive more document travel while all ten authored perspective poses stay put.
const travelWeights = Object.freeze([1, 1, 1, 1.8, 1.9, 1.35, 1, 1, 1]);
const travelStops = Object.freeze(travelWeights.reduce((stops, weight) => [...stops, stops.at(-1) + weight], [0]));
const travelSlopes = Object.freeze(travelStops.map((_, i) => i > 3 && i < 6
  ? 2 * travelWeights[i - 1] * travelWeights[i] / (travelWeights[i - 1] + travelWeights[i])
  : 1));

function travelAt(progress) {
  const p = clamp(Number.isFinite(progress) ? progress : 0, 0, SCENES.length - 1);
  const i = Math.min(Math.floor(p), travelWeights.length - 1), t = p - i;
  const distance = travelWeights[i], from = travelSlopes[i], to = travelSlopes[i + 1];
  // Shared endpoint derivatives keep the scroll-to-perspective rate continuous.
  return travelStops[i] + from * t + (3 * distance - 2 * from - to) * t * t
    + (-2 * distance + from + to) * t * t * t;
}

export function scrollFromProgress(progress, span) {
  if (!Number.isFinite(span) || span <= 0) return 0;
  return travelAt(progress) * span;
}

export function progressFromScroll(scrollY, span) {
  if (!Number.isFinite(span) || span <= 0) return 0;
  const distance = clamp((Number.isFinite(scrollY) ? scrollY : 0) / span, 0, travelStops.at(-1));
  for (let i = 0; i < travelWeights.length; i++) {
    if (distance > travelStops[i + 1]) continue;
    // Chapter anchors remain exact despite pixel/floating-point roundoff.
    if (Math.abs(distance - travelStops[i]) < 1e-12) return i;
    if (Math.abs(distance - travelStops[i + 1]) < 1e-12) return i + 1;
    if (travelWeights[i] === 1 && travelSlopes[i] === 1 && travelSlopes[i + 1] === 1)
      return i + distance - travelStops[i];
    let low = i, high = i + 1;
    for (let step = 0; step < 36; step++) {
      const middle = (low + high) / 2;
      if (travelAt(middle) < distance) low = middle;
      else high = middle;
    }
    return (low + high) / 2;
  }
  return SCENES.length - 1;
}
export function presentationAt(raw, reduced = false) {
  const p = clamp(Number.isFinite(raw) ? raw : 0, 0, 9);
  const active = Math.round(p);
  const rendered = reduced ? active : p;
  const darkness = sampleKeys([0, 0, 0, 0, 1, 0, 1, 1, 0, 0], rendered);
  const ivory = sampleKeys([1, 1, 1, 1, 0, .7, 0, 0, 1, 0], rendered);
  const museum = smoothstep(8.28, 9, rendered);
  const hero = 1 - smoothstep(.33, .49, rendered);
  const captionWeights = SCENES.map((_, i) => reduced ? Number(i === active) : 1 - smoothstep(.15, .55, Math.abs(p - i)));
  return { progress: rendered, raw: p, active, darkness, ivory, museum, hero, captionWeights };
}
