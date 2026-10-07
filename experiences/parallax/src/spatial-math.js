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

function pathTangent(stops, index, read) {
  const stop = stops[index];
  if (!stop.through || index === 0 || index === stops.length - 1) return 0;
  const before = stops[index - 1], after = stops[index + 1];
  const previousSpan = stop.at - before.at, nextSpan = after.at - stop.at;
  const previousSlope = (read(stop) - read(before)) / previousSpan;
  const nextSlope = (read(after) - read(stop)) / nextSpan;
  if (previousSlope * nextSlope <= 0) return 0;
  // Shape-preserving Hermite tangents carry the camera through a waypoint
  // without overshooting its corridor or stopping at every small interval.
  const a = 2 * nextSpan + previousSpan, b = nextSpan + 2 * previousSpan;
  return (a + b) / (a / previousSlope + b / nextSlope);
}

function pathComponent(stops, previousIndex, progress, read) {
  const previous = stops[previousIndex], next = stops[previousIndex + 1];
  const span = next.at - previous.at, t = clamp((progress - previous.at) / span);
  if (!previous.through && !next.through) return lerp(read(previous), read(next), smootherstep(0, 1, t));
  const t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * read(previous)
    + (t3 - 2 * t2 + t) * span * pathTangent(stops, previousIndex, read)
    + (-2 * t3 + 3 * t2) * read(next)
    + (t3 - t2) * span * pathTangent(stops, previousIndex + 1, read);
}

function viewDirection(stop) {
  const direction = stop.target.map((n, i) => n - stop.position[i]);
  const length = Math.hypot(...direction);
  return direction.map(n => n / length);
}

export function samplePath(stops, progress) {
  if (progress <= stops[0].at) return { ...stops[0], position: [...stops[0].position], target: [...stops[0].target] };
  for (let i = 1; i < stops.length; i++) {
    const next = stops[i];
    if (progress <= next.at) {
      const previous = stops[i - 1];
      if (!previous.through && !next.through) {
        const t = smootherstep(previous.at, next.at, progress);
        return {
          position: previous.position.map((n, j) => lerp(n, next.position[j], t)),
          target: previous.target.map((n, j) => lerp(n, next.target[j], t)),
          fov: lerp(previous.fov ?? 34, next.fov ?? 34, t),
        };
      }
      const position = previous.position.map((_, j) => pathComponent(stops, i - 1, progress, stop => stop.position[j]));
      // Interpolate the viewing direction separately from its reach. Moving
      // look-at points must not pass close to the camera and whip its view.
      const direction = previous.position.map((_, j) => pathComponent(stops, i - 1, progress, stop => viewDirection(stop)[j]));
      const directionLength = Math.hypot(...direction);
      const reach = pathComponent(stops, i - 1, progress, stop => Math.hypot(...stop.target.map((n, j) => n - stop.position[j])));
      return {
        position,
        target: position.map((n, j) => n + direction[j] / directionLength * reach),
        fov: pathComponent(stops, i - 1, progress, stop => stop.fov ?? 34),
      };
    }
  }
  return { ...stops.at(-1), position: [...stops.at(-1).position], target: [...stops.at(-1).target] };
}

export const ALIGNMENT_CAMERA = Object.freeze([2.2, 1.0, 11.8]);
export const ALIGNMENT_TARGET = Object.freeze([-2.0, 0.1, 0]);
export const MOBILE_ALIGNMENT_CAMERA = Object.freeze([1.35, 0.65, 22.2]);
export const MOBILE_ALIGNMENT_TARGET = Object.freeze([0, 0.25, 0]);

export const DESKTOP_CAMERA_PATH = [
  { at: 0, position: [2.6, 1.1, 10.8], target: [-1.95, 0.22, 0] },
  { at: 1, position: [3.7, 1.45, 14.7], target: [-2.15, -0.30, 0] },
  { at: 1.55, position: [5.2, 1.5, 12.1], target: [-2.0, 0.1, 0] },
  { at: 2, position: [...ALIGNMENT_CAMERA], target: [...ALIGNMENT_TARGET] },
  { at: 2.35, position: [0.7, 0.9, 12.2], target: [-2.0, 0.1, 0] },
  { at: 3, position: [5.0, 3.1, 14.0], target: [-1.65, -0.45, 0] },
  { at: 3.45, position: [2.25, 1.0, 10.0], target: [-0.65, -0.1, -1.5], through: true },
  { at: 3.7, position: [0.1, 0.15, 5.9], target: [0.05, 0.0, -7], fov: 36, through: true },
  { at: 3.88, position: [-0.20, 0.08, 5.85], target: [0.10, 0.02, -8], fov: 37, through: true },
  { at: 4, position: [-0.24, 0.04, 5.25], target: [0.10, 0.02, -9], fov: 38, through: true },
  { at: 4.1, position: [-0.10, 0.04, 1.8], target: [0.10, 0.02, -10], fov: 38, through: true },
  { at: 4.2, position: [0.03, 0.04, 0], target: [0.10, 0.02, -11], fov: 38, through: true },
  { at: 4.3, position: [0.04, 0.13, -2.3], target: [0.5, 0.04, -10], fov: 38, through: true },
  { at: 4.43, position: [-4.6, 0.5, -3.2], target: [-1.6, 0.05, -8.4], fov: 38, through: true },
  { at: 4.65, position: [-9.0, 1.0, 1.5], target: [-1.0, 0.08, -0.5], fov: 38, through: true },
  { at: 4.82, position: [-5.5, 1.2, 9.0], target: [-1.6, 0.10, 0], fov: 38, through: true },
  { at: 5, position: [2.7, 1.0, 12.6], target: [-2.0, 0.10, 0] },
  { at: 6, position: [3.4, 0.7, 11.8], target: [-1.95, 0.05, 0] },
  { at: 7, position: [2.7, 1.2, 12.5], target: [-1.85, 0.05, 0] },
  { at: 8, position: [2.6, 1.2, 12.8], target: [-1.65, -0.40, 0] },
  { at: 9, position: [2.4, 3.0, 30.0], target: [0, 1.15, 0] },
].map(stop => ({ ...stop, fov: stop.fov ?? 38 }));

export const MOBILE_CAMERA_PATH = DESKTOP_CAMERA_PATH.map(stop => {
  if (stop.at >= 3.7 && stop.at <= 4.3) return { ...stop, fov: 48 };
  const map = {
    0: { position: [1.8, 0.75, 22.4], target: [0, 0.30, 0] },
    1: { position: [3.6, 1.1, 24.2], target: [0, 0.2, 0] },
    1.55: { position: [5.3, 1.35, 22.7], target: [0, 0.25, 0] },
    2: { position: [...MOBILE_ALIGNMENT_CAMERA], target: [...MOBILE_ALIGNMENT_TARGET] },
    2.35: { position: [-0.8, 0.9, 22.6], target: [0, 0.25, 0] },
    3: { position: [2.2, 3.3, 34], target: [-3.0, -0.10, 0], fov: 44 },
    3.45: { position: [1.25, 1, 15], target: [0, 0, -1] },
    4.43: { position: [-8, 0.5, -2], target: [0, -0.55, -10], fov: 48 },
    4.65: { position: [-14, 1.0, 12], target: [0, -0.75, 0], fov: 48 },
    4.82: { position: [-4.0, 1.2, 20.5], target: [0, -0.35, 0], fov: 48 },
    5: { position: [1.5, 0.7, 23], target: [0, 0.25, 0] },
    6: { position: [2.5, 0.5, 22], target: [0, 0.22, 0] },
    7: { position: [1.6, 0.9, 23], target: [0, 0.25, 0] },
    8: { position: [1.7, 0.8, 22.6], target: [0, 0.22, 0] },
    9: { position: [1.5, 3.1, 34], target: [0, 1.65, 0] },
  };
  return { ...stop, ...(map[stop.at] || {}), fov: map[stop.at]?.fov ?? 38 };
}).flatMap(stop => stop.at === 4.65
  ? [{ at: 4.55, position: [-15, 1, 9], target: [0, -1, 0], fov: 48, through: true }, stop]
  : [stop]);

export function alignmentInfluence(progress) {
  return smoothstep(1.30, 1.55, progress) * (1 - smoothstep(2.35, 2.60, progress));
}
