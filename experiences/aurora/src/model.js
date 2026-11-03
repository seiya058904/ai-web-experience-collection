// Pure relationships behind AURORA. No DOM, no clock: every value is a function of its inputs.
export const RE_KM = 6371;
export const FOCAL = 1 / Math.tan((15 * Math.PI) / 180);
export const RIBBONS = { width: 4096, count: 3, spanKm: 2400 };
export const PRESETS = {
  calm: { speed: 380, density: 4, bz: 1 },
  active: { speed: 520, density: 7, bz: -4 },
  storm: { speed: 780, density: 18, bz: -18 },
};
export const DEFAULT_STATE = { ...PRESETS.active, latitude: 54 };

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const rad = (deg) => (deg * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

// Solar wind ram pressure in nPa for density in protons/cm3 and speed in km/s (protons only).
export const dynamicPressure = (density, speed) => 1.6726e-6 * density * speed * speed;

// Shue et al. (1998): subsolar standoff in Earth radii, tail flaring and the boundary itself.
export const standoff = (bz, pressure) => (10.22 + 1.29 * Math.tanh(0.184 * (bz + 8.14))) * pressure ** (-1 / 6.6);
export const flaring = (bz, pressure) => (0.58 - 0.007 * bz) * (1 + 0.024 * Math.log(pressure));
export const magnetopause = (theta, r0, alpha) => r0 * (2 / (1 + Math.cos(theta))) ** alpha;

// Newell et al. (2007) form: the rate at which magnetic flux opens at the magnetopause.
// A small constant east-west field keeps the clock angle defined at Bz = 0.
export function coupling(speed, bz, by = 2) {
  const bt = Math.hypot(by, bz);
  const clock = Math.atan2(Math.abs(by), bz);
  return speed ** (4 / 3) * bt ** (2 / 3) * Math.abs(Math.sin(clock / 2)) ** (8 / 3);
}

// Illustrative, not a forecast: compresses coupling onto the familiar 0-9 scale.
export const activity = (speed, bz) => 9 * (1 - Math.exp(-coupling(speed, bz) / 13600));

// Equatorward edge of the visible oval by Kp, in geomagnetic degrees (SpaceWeatherLive table).
const OVAL_LATITUDE = [66, 64.5, 62.4, 60.4, 58.3, 56.3, 54.2, 52.2, 50.1, 48];
export function ovalLatitude(kp) {
  const k = clamp(kp, 0, 9);
  const i = Math.min(8, Math.floor(k));
  return lerp(OVAL_LATITUDE[i], OVAL_LATITUDE[i + 1], k - i);
}

// The oval sits further from the pole at midnight and thins toward noon. Shape is illustrative.
export function ovalBand(kp, mlt = 0) {
  const phase = 0.5 * (1 - Math.cos((2 * Math.PI * mlt) / 24));
  const equator = ovalLatitude(kp) + 10 * phase;
  const width = (4 + 0.7 * kp) * (1 - 0.55 * phase);
  return { equator, pole: equator + width };
}

// Elevation angle of a point at altitude h (km) and central angle delta (rad) from the observer.
export const elevationAt = (delta, h) => Math.atan2((RE_KM + h) * Math.cos(delta) - RE_KM, (RE_KM + h) * Math.sin(delta));

// What an observer at a geomagnetic latitude can actually see of the midnight oval.
export function skyState(latitude, kp) {
  const band = ovalBand(kp, 0);
  const north = latitude < band.equator;
  const south = latitude > band.pole;
  const delta = north ? band.equator - latitude : south ? latitude - band.pole : 0;
  const separation = rad(delta);
  const base = delta === 0 ? 90 : deg(elevationAt(separation, 105));
  const top = delta === 0 ? 90 : deg(elevationAt(separation, 300));
  const code = delta === 0 ? 'overhead' : base >= 30 ? 'high' : base > 0 ? 'low' : top > 0 ? 'edge' : 'hidden';
  return { code, delta, distanceKm: RE_KM * separation, base, top, direction: north ? 'north' : south ? 'south' : 'overhead', band };
}

export function describeSky(state) {
  const place = state.direction === 'overhead' ? '' : ` to the ${state.direction}`;
  switch (state.code) {
    case 'overhead': return 'The oval is directly above you. Rays converge overhead.';
    case 'high': return `A bright curtain stands high in the sky${place}, its base ${Math.round(state.base)}° up.`;
    case 'low': return `The curtain sits low${place}, its base ${Math.round(state.base)}° above the horizon.`;
    case 'edge': return `Only the highest red light clears your horizon${place}. The green is below it.`;
    default: return `The oval is ${Math.round(state.distanceKm).toLocaleString('en-US')} km away, below your horizon. Tonight this sky is dark.`;
  }
}

// One continuous film. Everything is a direct function of scroll progress, so it reverses exactly.
export function sceneAt(p, aspect = 16 / 9) {
  const sky = clamp(1 - smooth(0.145, 0.2, p) + smooth(0.625, 0.672, p));
  const fit = aspect < 1.25 ? 1.25 / aspect : 1;
  const wide = 15 * fit;
  const near = 1.62 * Math.max(1, 0.95 / aspect);
  const pull = smooth(0.4, 0.5, p);
  const halfHeight = Math.exp(lerp(Math.log(wide), Math.log(near), pull));
  const dive = smooth(0.585, 0.668, p);
  const distance = Math.exp(lerp(Math.log(halfHeight * FOCAL), Math.log(0.06), dive));
  const rising = lerp(14, 84, smooth(0.09, 0.2, p));
  const arrival = lerp(rising, aspect < 1 ? 46 : 58, smooth(0.3, 0.62, p));
  const pitch = lerp(lerp(arrival, aspect < 1 ? 8 : 44, smooth(0.655, 0.75, p)), aspect < 1 ? 8 : 18, smooth(0.8, 0.88, p));
  return {
    sky,
    pitch,
    halfHeight,
    distance,
    dive,
    tilt: smooth(0.405, 0.5, p) * (Math.PI / 2),
    focusX: lerp(aspect >= 1.25 ? -5.2 : -1.5, 0, smooth(0.4, 0.48, p)),
    diagram: 1 - smooth(0.405, 0.445, p),
    ring: smooth(0.46, 0.5, p) * (1 - smooth(0.62, 0.66, p)),
    // On tall screens the panel sits below, so the subject rides above centre.
    lift: (aspect < 1 ? lerp(0.58, 0.4, pull) : 0) * halfHeight * (1 - dive),
  };
}

const norm = (v) => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// Sun on screen left (+x), magnetic north up (+z). The dive ends above the night-side oval.
export function cameraAt(scene, targetLatitude = 60) {
  let dir = [0, Math.cos(scene.tilt), Math.sin(scene.tilt)];
  let up = [0, -Math.sin(scene.tilt), Math.cos(scene.tilt)];
  let focus = [scene.focusX, 0, 0];
  if (scene.dive > 0) {
    const colat = rad(90 - targetLatitude);
    const target = [-Math.sin(colat), 0, Math.cos(colat)];
    dir = norm(dir.map((v, i) => lerp(v, target[i], scene.dive)));
    const side = norm(cross(up, dir));
    up = norm(cross(dir, side));
    focus = focus.map((v, i) => lerp(v, target[i], scene.dive));
  }
  focus = focus.map((v, i) => v - up[i] * (scene.lift || 0));
  const pos = focus.map((v, i) => v + dir[i] * scene.distance);
  const fwd = dir.map((v) => -v);
  return { pos, fwd, up, right: norm(cross(fwd, up)), focal: FOCAL };
}

export function projectPoint(cam, point, width, height) {
  const v = point.map((value, i) => value - cam.pos[i]);
  const z = v[0] * cam.fwd[0] + v[1] * cam.fwd[1] + v[2] * cam.fwd[2];
  if (z <= 0) return null;
  const x = ((v[0] * cam.right[0] + v[1] * cam.right[1] + v[2] * cam.right[2]) * cam.focal) / z;
  const y = ((v[0] * cam.up[0] + v[1] * cam.up[1] + v[2] * cam.up[2]) * cam.focal) / z;
  return { x: width / 2 + (x * height) / 2, y: height / 2 - (y * height) / 2 };
}

// Screen height of an altitude on the curtain, for the ruler. Null when out of frame.
export function altitudeToScreen(altitude, distanceKm, pitchDeg, height, focal) {
  const elevation = elevationAt(distanceKm / RE_KM, altitude) - rad(pitchDeg);
  if (Math.abs(elevation) >= Math.PI / 2) return null;
  return height / 2 - (Math.tan(elevation) * focal * height) / 2;
}

// Fixed Earth orientation: geomagnetic pole near 80.7N 72.7W, turning under the Sun-fixed oval.
export function geoMatrix(angle) {
  const colat = rad(9.3);
  const lon = rad(-72.7);
  const [cc, sc, cl, sl, ca, sa] = [Math.cos(colat), Math.sin(colat), Math.cos(lon), Math.sin(lon), Math.cos(angle), Math.sin(angle)];
  // Rz(lon) * Ry(colat) * Rz(angle), column-major for WebGL.
  return new Float32Array([
    cl * cc * ca - sl * sa, sl * cc * ca + cl * sa, -sc * ca,
    -cl * cc * sa - sl * ca, -sl * cc * sa + cl * ca, sc * sa,
    cl * sc, sl * sc, cc,
  ]);
}

// Seeded value noise keeps the sky repeatable between visits and across renderers.
const NOISE = new Float32Array(2048);
{
  let seed = 0x5eed1e55;
  for (let i = 0; i < NOISE.length; i += 1) {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    NOISE[i] = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}
export function noise1(x) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return NOISE[i & 2047] + (NOISE[(i + 1) & 2047] - NOISE[i & 2047]) * u;
}

// Writes each ribbon as RGBA texels: fold offset, brightness, ray top and lower edge (km / 100).
export function writeRibbons(out, time, kp) {
  const { width, count, spanKm } = RIBBONS;
  const k = clamp(kp, 0, 9);
  const gains = [1, smooth(1.5, 4, k) * 0.62, smooth(3, 6, k) * 0.46];
  const bases = [0, 95 + 12 * k, 205 + 22 * k];
  const strength = 0.14 + 0.17 * k;
  let o = 0;
  for (let r = 0; r < count; r += 1) {
    const s = r * 37.1;
    const surgeAt = ((time * (40 + k * 25) + s * 90) % spanKm) - spanKm / 2;
    for (let i = 0; i < width; i += 1) {
      const u = i / (width - 1);
      const x = (u - 0.5) * spanKm;
      const fold = 170 * (noise1(x / 620 + time * 0.012 + s) - 0.5)
        + 120 * (noise1(x / 170 - time * 0.022 + s * 2) - 0.5)
        + (34 + k * 5) * (noise1(x / 52 + time * 0.06 + s * 3) - 0.5);
      const away = (x - surgeAt) / 260;
      const surge = k * 5 * Math.exp(-away * away) * Math.sin((x - surgeAt) / 26);
      const patches = smooth(0.2, 0.68, noise1(x / 700 + time * 0.012 + s * 5));
      const a = noise1(x / 4.2 + time * 0.2 + s * 7);
      const b = noise1(x / 1.8 - time * 0.42 + s * 11);
      const c = noise1(x / 24 + time * 0.08 + s * 19);
      const rays = (0.32 + 1.05 * a * a * a + 0.9 * b * b * b) * (0.55 + 0.75 * c);
      const edge = smooth(0, 0.12, u) * smooth(1, 0.88, u);
      out[o] = (bases[r] + fold + surge) / 100;
      out[o + 1] = edge * gains[r] * patches * rays * strength;
      out[o + 2] = (135 + (70 + 15 * k) * noise1(x / 7 + time * 0.13 + s * 13)) / 100;
      out[o + 3] = (106 - 0.9 * k + 7 * noise1(x / 140 + time * 0.03 + s * 17)) / 100;
      o += 4;
    }
  }
  return out;
}
