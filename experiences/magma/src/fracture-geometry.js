/**
 * Authored, shallow conchoidal surfaces. This is visual geometry, not a stress
 * solver. Each side owns its seam vertices: no triangle bridges the opening.
 * Coordinates are in the original image, x right / y down, before cover-crop.
 */
const CRACK = [
  [0, 0.619], [0.1, 0.632], [0.21, 0.641], [0.32, 0.642],
  [0.46, 0.631], [0.58, 0.64], [0.73, 0.646], [0.83, 0.652],
  [0.93, 0.657], [1, 0.657],
];
const FRACTURE = [
  [0, 0.145], [0.13, 0.21], [0.26, 0.31], [0.36, 0.435],
  [0.46, 0.57], [0.56, 0.67], [0.64, 0.731], [0.7, 0.718],
  [0.78, 0.635], [0.86, 0.52], [0.95, 0.49], [1, 0.56],
];

export function seamAt(type, value) {
  const points = type === 'fracture' ? FRACTURE : CRACK;
  const t = Math.max(0, Math.min(1, value));
  let i = 0;
  while (i < points.length - 2 && t > points[i + 1][0]) i += 1;
  const p0 = points[Math.max(0, i - 1)];
  const p1 = points[i];
  const p2 = points[i + 1];
  const p3 = points[Math.min(points.length - 1, i + 2)];
  const u = (t - p1[0]) / (p2[0] - p1[0]);
  const m1 = (p2[1] - p0[1]) / (p2[0] - p0[0]) * (p2[0] - p1[0]);
  const m2 = (p3[1] - p1[1]) / (p3[0] - p1[0]) * (p2[0] - p1[0]);
  const u2 = u * u;
  const u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p1[1]
    + (u3 - 2 * u2 + u) * m1
    + (-2 * u3 + 3 * u2) * p2[1]
    + (u3 - u2) * m2;
}

function shapeAt(x, y) {
  const dx = (x - 0.63) / 0.53;
  const dy = (y - 0.21) / 0.62;
  const r = Math.hypot(dx, dy);
  const bowl = Math.max(0, 1 - r * r);
  const rings = Math.sin(r * 38) * Math.exp(-r * 2) * 0.018;
  const edge = Math.min(1, Math.max(0, x * 8))
    * Math.min(1, Math.max(0, (1 - x) * 8))
    * Math.min(1, Math.max(0, y * 8))
    * Math.min(1, Math.max(0, (1 - y) * 8));
  return (bowl * 0.26 + rings) * edge;
}

export function createSplitSurface(type = 'crack', columns = 40, rows = 56) {
  const cols = Math.max(2, Math.floor(columns));
  const nRows = Math.max(2, Math.floor(rows));
  const vertices = [];
  const indices = [];
  // UV(2), side, distance-to-seam, seam-normal(2), height, normal.xy(2).
  const stride = 9;
  for (let half = 0; half < 2; half += 1) {
    const base = vertices.length / stride;
    const side = half === 0 ? -1 : 1;
    for (let row = 0; row <= nRows; row += 1) {
      const t = row / nRows;
      const seam = seamAt(type, t);
      const derivative = (seamAt(type, t + 0.001) - seamAt(type, t - 0.001)) / 0.002;
      const normalLength = Math.hypot(1, derivative);
      for (let col = 0; col <= cols; col += 1) {
        const across = col / cols;
        const coordinate = half === 0 ? across * seam : seam + across * (1 - seam);
        const x = type === 'fracture' ? t : coordinate;
        const y = type === 'fracture' ? coordinate : t;
        const distance = Math.abs(coordinate - seam);
        const nx = type === 'fracture' ? -derivative / normalLength : 1 / normalLength;
        const ny = type === 'fracture' ? 1 / normalLength : -derivative / normalLength;
        const height = shapeAt(x, y);
        const dx = (shapeAt(x + 0.001, y) - shapeAt(x - 0.001, y)) / 0.002;
        const dy = (shapeAt(x, y + 0.001) - shapeAt(x, y - 0.001)) / 0.002;
        vertices.push(x, y, side, distance, nx, ny, height, -dx, -dy);
      }
    }
    for (let row = 0; row < nRows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const a = base + row * (cols + 1) + col;
        const b = a + 1;
        const c = a + cols + 1;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }
  }
  return {
    vertices: new Float32Array(vertices), indices: new Uint16Array(indices),
    stride, columns: cols, rows: nRows,
    vertexCount: vertices.length / stride,
    triangleCount: indices.length / 3,
    verticesPerHalf: (cols + 1) * (nRows + 1),
  };
}

/** Two smooth paths packed to 16-bit values in one 512 × 1 RGBA data texture. */
export function createSeamData(size = 512) {
  const data = new Uint8Array(size * 4);
  for (let i = 0; i < size; i += 1) {
    const t = i / (size - 1);
    const crack = Math.round(seamAt('crack', t) * 65535);
    const fracture = Math.round(seamAt('fracture', t) * 65535);
    data[i * 4] = crack >> 8;
    data[i * 4 + 1] = crack & 255;
    data[i * 4 + 2] = fracture >> 8;
    data[i * 4 + 3] = fracture & 255;
  }
  return { data, width: size, height: 1 };
}
