import * as THREE from 'three';

// A sheet is a closed, thin solid. Its centre is an arc-length controlled bend,
// not two boxes or two intersecting rectangles. The crease is parallel to Y.
export function createPaperGeometry({ width = 3.4, height = 4.8, radius = 0.025,
  outerRadius = 0.025, thickness = 0.0048, macro = false } = {}) {
  const outer = macro ? 14 : 4;
  const middle = macro ? 20 : 10;
  const rows = macro ? 8 : 3;
  const samples = [];
  for (let i = 0; i <= outer; i++) samples.push(-1 + (0.976 * i) / outer);
  for (let i = 1; i <= middle; i++) samples.push(-0.024 + (0.048 * i) / middle);
  for (let i = 1; i <= outer; i++) samples.push(0.024 + (0.976 * i) / outer);
  const cols = samples.length - 1;
  const gridCount = (cols + 1) * (rows + 1);
  const perimeter = [];
  for (let c = 0; c <= cols; c++) perimeter.push(c);
  for (let r = 1; r <= rows; r++) perimeter.push(r * (cols + 1) + cols);
  for (let c = cols - 1; c >= 0; c--) perimeter.push(rows * (cols + 1) + c);
  for (let r = rows - 1; r > 0; r--) perimeter.push(r * (cols + 1));
  const vertices = gridCount * 2 + perimeter.length * 2;
  const positions = new Float32Array(vertices * 3);
  const normals = new Float32Array(vertices * 3);
  const uv = new Float32Array(vertices * 2);
  const indices = [];
  for (let face = 0; face < 2; face++) {
    for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) {
      const i = face * gridCount + r * (cols + 1) + c;
      uv[i * 2] = (samples[c] + 1) / 2;
      uv[i * 2 + 1] = r / rows;
    }
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const a = face * gridCount + r * (cols + 1) + c;
      const b = a + 1, d = a + cols + 1, e = d + 1;
      if (face === 0) indices.push(a, b, e, a, e, d);
      else indices.push(a, e, b, a, d, e);
    }
  }
  for (let i = 0; i < perimeter.length; i++) {
    const a = gridCount * 2 + i * 2;
    const b = gridCount * 2 + ((i + 1) % perimeter.length) * 2;
    indices.push(a, a + 1, b + 1, a, b + 1, b);
    const original = perimeter[i];
    uv[a * 2] = uv[(a + 1) * 2] = uv[original * 2];
    uv[a * 2 + 1] = uv[original * 2 + 1];
    uv[(a + 1) * 2 + 1] = uv[original * 2 + 1] + 0.003;
  }
  const geometry = new THREE.BufferGeometry();
  const positionAttribute = new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage);
  const normalAttribute = new THREE.BufferAttribute(normals, 3).setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', positionAttribute);
  geometry.setAttribute('normal', normalAttribute);
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  // A deliberately conservative static bound covers every possible fold pose.
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(-width / 2, 0, 0), width * 2);
  let previousAngle = NaN, previousFlex = NaN;

  function update(angle, flex = 0) {
    if (angle === previousAngle && flex === previousFlex) return;
    previousAngle = angle; previousFlex = flex;
    const bendHalf = radius * angle / 2;
    const halfLength = width - outerRadius + bendHalf;
    const cosAngle = Math.cos(angle), sinAngle = Math.sin(angle);
    for (let c = 0; c <= cols; c++) {
      const s = samples[c] * halfLength;
      let x, z, dx, dz;
      if (angle < 0.00001) {
        x = s; z = 0; dx = 1; dz = 0;
      } else if (s < -bendHalf) {
        x = -radius * sinAngle + (s + bendHalf) * cosAngle;
        z = radius * (1 - cosAngle) - (s + bendHalf) * sinAngle;
        dx = cosAngle; dz = -sinAngle;
      } else if (s > bendHalf) {
        x = s - bendHalf; z = 0; dx = 1; dz = 0;
      } else {
        const theta = -angle / 2 + s / radius;
        x = radius * Math.sin(theta);
        z = radius * (1 - Math.cos(theta));
        dx = Math.cos(theta); dz = Math.sin(theta);
      }
      const wave = Math.sin(samples[c] * Math.PI);
      const flexDerivative = flex * Math.PI / halfLength * Math.cos(samples[c] * Math.PI);
      for (let r = 0; r <= rows; r++) {
        const v = r / rows * 2 - 1;
        const edgeLift = 0.0025 * v * v * wave;
        const dzdy = 0.01 * v * wave / height;
        const ddz = dz + flexDerivative;
        let nx = -ddz, ny = -dzdy * dx, nz = dx;
        const inv = 1 / Math.hypot(nx, ny, nz);
        nx *= inv; ny *= inv; nz *= inv;
        const px = -width / 2 + outerRadius + x;
        const py = v * height / 2;
        const pz = z - radius + flex * wave + edgeLift;
        const original = r * (cols + 1) + c;
        for (let face = 0; face < 2; face++) {
          const sign = face === 0 ? 1 : -1;
          const i = (face * gridCount + original) * 3;
          const t = sign * thickness / 2;
          positions[i] = px + nx * t;
          positions[i + 1] = py + ny * t;
          positions[i + 2] = pz + nz * t;
          normals[i] = sign * nx; normals[i + 1] = sign * ny; normals[i + 2] = sign * nz;
        }
      }
    }
    for (let i = 0; i < perimeter.length; i++) {
      const source = perimeter[i];
      const r = Math.floor(source / (cols + 1)), c = source % (cols + 1);
      for (let face = 0; face < 2; face++) {
        const from = (face * gridCount + source) * 3;
        const to = (gridCount * 2 + i * 2 + face) * 3;
        positions[to] = positions[from]; positions[to + 1] = positions[from + 1]; positions[to + 2] = positions[from + 2];
        if (r === 0 || r === rows) {
          normals[to] = 0; normals[to + 1] = r === 0 ? -1 : 1; normals[to + 2] = 0;
        } else {
          const sign = c === 0 ? -1 : 1;
          normals[to] = normals[source * 3 + 2] * sign;
          normals[to + 1] = 0;
          normals[to + 2] = -normals[source * 3] * sign;
        }
      }
    }
    positionAttribute.needsUpdate = true;
    normalAttribute.needsUpdate = true;
  }
  update(Math.PI, 0);
  return { geometry, update, radius, triangles: indices.length / 3 };
}

export function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let n = value;
    n = Math.imul(n ^ n >>> 15, n | 1);
    n ^= n + Math.imul(n ^ n >>> 7, n | 61);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}
