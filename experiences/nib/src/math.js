export const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export function smoothstep(a, b, value) { const t = clamp((value - a) / (b - a)); return t * t * (3 - 2 * t); }
export function cover(ctx, image, w, h, anchorX = .5, anchorY = .5) {
  if (!image?.width) return;
  const k = Math.max(w / image.width, h / image.height);
  const dw = image.width * k, dh = image.height * k;
  ctx.drawImage(image, (w - dw) * anchorX, (h - dh) * anchorY, dw, dh);
}
export function seededRandom(seed = 17319) {
  return () => { seed |= 0; seed = seed + 0x6d2b79f5 | 0; let n = Math.imul(seed ^ seed >>> 15, 1 | seed); n = n + Math.imul(n ^ n >>> 7, 61 | n) ^ n; return ((n ^ n >>> 14) >>> 0) / 4294967296; };
}
export const CHAPTERS = Object.freeze([
  { id: 'metal', name: 'Metal' }, { id: 'reservoir', name: 'Reservoir' },
  { id: 'feed', name: 'Feed' }, { id: 'balance', name: 'Balance' },
  { id: 'slit', name: 'Slit' }, { id: 'meniscus', name: 'Meniscus' },
  { id: 'contact', name: 'Contact' }, { id: 'absorb', name: 'Absorb' },
  { id: 'write', name: 'Write' }, { id: 'trace', name: 'Trace' }
]);
