/** Authored views of one vessel. Scroll selects the shot; no temporal following. */
const clamp = (value, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, value));
const mix = (a, b, t) => a + (b - a) * t;
const ease = value => {
  const t = clamp(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const shots = [
  { framing: .46, elevation: 19, turn: 0, focus: 0 },
  { framing: 0, elevation: 32, turn: -.055, focus: 0 },
  { framing: .84, elevation: 29, turn: -.03, focus: 0 },
  { framing: 0, elevation: 12, turn: -.008, focus: 0 },
  { framing: 1, elevation: 34, turn: .025, focus: 0 },
  { framing: .88, elevation: 9, turn: .05, focus: 1 },
  { framing: .30, elevation: 40, turn: .015, focus: 0 },
  { framing: .86, elevation: 22, turn: .04, focus: 0 },
  { framing: 1, elevation: 27, turn: .045, focus: 1 },
  { framing: 1, elevation: 27, turn: .045, focus: 1 },
  { framing: 0, elevation: 24, turn: -.025, focus: 0 },
];
const handoffs = [
  [.72, 1.14], [1.70, 2.14], [2.78, 3.14], [3.78, 4.14],
  [4.72, 5.14], [5.84, 6.14], [6.82, 7.14], [7.80, 8.14],
  [8.80, 9.14], [9.65, 10.18],
];

export function getCameraState(position) {
  const phase = Number.isFinite(position) ? clamp(position, 0, 11) : 0;
  for (let i = 0; i < handoffs.length; i++) {
    const [start, end] = handoffs[i];
    if (phase < start) return { ...shots[i] };
    if (phase <= end) {
      const t = ease((phase - start) / (end - start));
      return Object.fromEntries(Object.keys(shots[i]).map(field => [field, mix(shots[i][field], shots[i + 1][field], t)]));
    }
  }
  return { ...shots.at(-1) };
}

/** Compose in screen space, then solve the matching camera/object placement. */
export function getCameraFrame(state, width, height) {
  const aspect = Math.max(1, Number(width) || 1) / Math.max(1, Number(height) || 1);
  const portrait = width <= 1100 && aspect <= 1;
  const framing = clamp(Number(state.framing) || 0);
  const elevation = clamp(Number(state.elevation) || 19, 5, 50) * Math.PI / 180;
  const focus = clamp(Number(state.focus) || 0);
  const generalWidth = portrait
    ? (.90 + .10 * clamp((aspect - .5) / .25) + 1.22 * framing) * Math.min(1, .62 / aspect)
    : (.56 + .70 * framing) * Math.min(1, 1.72 / aspect);
  // Portrait close views need room for both the process and its reading area.
  const focusedWidth = portrait
    ? mix(1.55, 1.12, clamp((aspect - .46) / .29))
    : 1.03 * Math.min(1, 1.72 / aspect);
  const screenWidth = mix(generalWidth, focusedWidth, focus);
  const fov = 32, scale = 1.04;
  const distance = 3.48 * scale / (2 * Math.tan(fov * Math.PI / 360) * aspect * screenWidth);
  const viewHeight = 2 * distance * Math.tan(fov * Math.PI / 360);
  const viewWidth = viewHeight * aspect;
  let centerX = portrait ? .5 + framing * (.09 + screenWidth / 2 - .5) : .41 + screenWidth / 2;
  let centerY = portrait
    ? .66 + .05 * clamp((aspect - .5) / .25) + framing * (.17 + Math.max(0, aspect - .46) * .32)
    : aspect > 2 ? .49 : .52;
  let upShift = (.5 - centerY) * viewHeight;
  let sideShift = (centerX - .5) * viewWidth;
  if (focus > 0) {
    // Aim at the shoulder where the work occurs. Projecting this fixed local
    // anchor avoids pushing the material process outside a portrait viewport.
    // The vessel, motif and coating coordinates remain untouched.
    const turn = Number(state.turn) || 0, c = Math.cos(turn), s = Math.sin(turn);
    const anchor = [(-.74 * c + 1.25 * s) * scale, .06 * scale, (.74 * s + 1.25 * c) * scale];
    const sine = Math.sin(elevation), cosine = Math.cos(elevation);
    const depth = distance - anchor[1] * sine - anchor[2] * cosine;
    const planeHeight = 2 * depth * Math.tan(fov * Math.PI / 360);
    const focalX = portrait ? .58 : .80, focalY = portrait ? .80 : .68;
    const aimedSide = (focalX - .5) * planeHeight * aspect - anchor[0];
    const aimedUp = (.5 - focalY) * planeHeight - (anchor[1] * cosine - anchor[2] * sine);
    sideShift = mix(sideShift, aimedSide, focus);
    upShift = mix(upShift, aimedUp, focus);
    centerX = .5 + sideShift / viewWidth;
    centerY = .5 - upShift / viewHeight;
  }
  return {
    fov, scale, distance, elevation, screenWidth, centerX, centerY,
    position: [0, Math.sin(elevation) * distance, Math.cos(elevation) * distance],
    objectPosition: [sideShift, upShift * Math.cos(elevation), -upShift * Math.sin(elevation)],
  };
}
