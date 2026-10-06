/** Deterministic geometry helpers shared by the renderer and its verification. */
export const TAU = Math.PI * 2;
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function hash01(index) {
  let x = (index + 0x9e3779b9) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x21f0aaad);
  x = Math.imul(x ^ (x >>> 15), 0x735a2d97);
  return ((x ^ (x >>> 15)) >>> 0) / 4294967296;
}

/** Qualitative square-plate standing mode, on the unit square. */
export function chladni(x, y, n, m) {
  return Math.cos(n * Math.PI * x) * Math.cos(m * Math.PI * y)
    - Math.cos(m * Math.PI * x) * Math.cos(n * Math.PI * y);
}

export function chladniGradient(x, y, n, m) {
  const nx = n * Math.PI * x, mx = m * Math.PI * x;
  const ny = n * Math.PI * y, my = m * Math.PI * y;
  return [
    -n * Math.PI * Math.sin(nx) * Math.cos(my) + m * Math.PI * Math.sin(mx) * Math.cos(ny),
    -m * Math.PI * Math.cos(nx) * Math.sin(my) + n * Math.PI * Math.cos(mx) * Math.sin(ny),
  ];
}

/** Project a seeded grain toward the nearest displacement node. */
export function projectToNode(x, y, n, m) {
  for (let iteration = 0; iteration < 16; iteration++) {
    const value = chladni(x, y, n, m);
    if (Math.abs(value) < 0.00001) break;
    const [gx, gy] = chladniGradient(x, y, n, m);
    const gradient2 = gx * gx + gy * gy;
    if (gradient2 < 1e-9) {
      x = clamp(x + 0.00073, 0.001, 0.999);
      y = clamp(y - 0.00041, 0.001, 0.999);
      continue;
    }
    const amount = clamp(value / gradient2, -0.04, 0.04);
    x = clamp(x - amount * gx * 0.82, 0.001, 0.999);
    y = clamp(y - amount * gy * 0.82, 0.001, 0.999);
  }
  return [x, y];
}

export function plateGrain(index, mode) {
  const x = hash01(index * 7 + 151), y = hash01(index * 11 + 831);
  // The plate's physical coordinates are -1..1. Doubling the indices while
  // storing samples on 0..1 is exactly equivalent, up to a common parity sign.
  const [nx, ny] = projectToNode(x, y, (mode + 2) * 2, (mode + 3) * 2);
  // A small number of loose grains keep the plate material visible.
  const settle = hash01(index * 3 + 819) < 0.91 ? 1 : 0.38;
  const scatter = 0.005 + Math.pow(hash01(index * 13 + 191), 4) * 0.024;
  return [
    clamp(x + (nx - x) * settle + (hash01(index * 17 + 411) - 0.5) * scatter, 0.001, 0.999),
    clamp(y + (ny - y) * settle + (hash01(index * 19 + 717) - 0.5) * scatter, 0.001, 0.999),
  ];
}

/** Fixed-end damped modal string. Time is deliberately slowed for the eye. */
export function dampedPluck(position, age, frequency = 110, amplitude = 1, pluckAt = 0.43) {
  if (position <= 0 || position >= 1 || age < 0 || !Number.isFinite(age)) return 0;
  let displacement = 0;
  const omega = TAU * (frequency / 110) * 0.37;
  for (let n = 1; n <= 7; n++) {
    displacement += Math.sin(n * Math.PI * position) * Math.sin(n * Math.PI * pluckAt)
      * Math.cos(n * omega * age) * Math.exp(-age * (0.38 + n * n * 0.032)) / (n * n);
  }
  return displacement * amplitude;
}
