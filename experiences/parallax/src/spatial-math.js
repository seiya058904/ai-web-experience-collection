/** Pure, deterministic spatial math. No DOM, animation clock or GPU dependency. */
export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export function smoothstep(a, b, value) {
  const t = clamp((value - a) / (b - a));
  return t * t * (3 - 2 * t);
}
export function smootherstep(a, b, value) {
  const t = clamp((value - a) / (b - a));
  return t * t * t * (t * (t * 6 - 15) + 10);
}
export function envelope(value, start, peak, end) {
  return value <= peak ? smoothstep(start, peak, value) : 1 - smoothstep(peak, end, value);
}

/** Similarity about the viewing centre: perspective projection is unchanged. */
export function scaleAboutCamera(point, camera, scale) {
  return point.map((component, i) => camera[i] + scale * (component - camera[i]));
}

export function samplePath(stops, progress) {
  if (progress <= stops[0].at) return { ...stops[0], position: [...stops[0].position], target: [...stops[0].target] };
  for (let i = 1; i < stops.length; i++) {
    const next = stops[i];
    if (progress <= next.at) {
      const previous = stops[i - 1];
      const t = smootherstep(previous.at, next.at, progress);
      return {
        position: previous.position.map((n, j) => lerp(n, next.position[j], t)),
        target: previous.target.map((n, j) => lerp(n, next.target[j], t)),
        fov: lerp(previous.fov ?? 34, next.fov ?? 34, t),
      };
    }
  }
  return { ...stops.at(-1), position: [...stops.at(-1).position], target: [...stops.at(-1).target] };
}

export const ALIGNMENT_CAMERA = Object.freeze([2.2, 1.0, 11.8]);
export const ALIGNMENT_TARGET = Object.freeze([-2.0, 0.1, 0]);
export const MOBILE_ALIGNMENT_CAMERA = Object.freeze([1.35, 0.65, 22.2]);
export const MOBILE_ALIGNMENT_TARGET = Object.freeze([0, 0.25, 0]);
