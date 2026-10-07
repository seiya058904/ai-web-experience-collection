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
export function progressFromScroll(scrollY, span) {
  if (!Number.isFinite(span) || span <= 0) return 0;
  return clamp((Number.isFinite(scrollY) ? scrollY : 0) / span, 0, SCENES.length - 1);
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
