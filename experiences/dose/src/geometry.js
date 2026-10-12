import * as THREE from 'three';

// Original procedural assets: no images, models, or external texture sources.
export function deterministic(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function tabletProfile(radius, halfHeight) {
  const upper = [];
  const curve = (a, b, c, d, steps, skipFirst = false) => {
    for (let i = skipFirst ? 1 : 0; i <= steps; i++) {
      const t = i / steps, s = 1 - t;
      upper.push(new THREE.Vector2(
        radius * (s ** 3 * a[0] + 3 * s * s * t * b[0] + 3 * s * t * t * c[0] + t ** 3 * d[0]),
        halfHeight * (s ** 3 * a[1] + 3 * s * s * t * b[1] + 3 * s * t * t * c[1] + t ** 3 * d[1]),
      ));
    }
  };
  // A shallow crown, tangential shoulder, and short cylindrical compression band.
  curve([0, 1], [.4, 1], [.8, .9], [.92, .7], 32);
  curve([.92, .7], [.974, .61], [1, .53], [1, .38], 16, true);
  return [
    ...upper.map(p => new THREE.Vector2(p.x, -p.y)),
    new THREE.Vector2(radius, 0),
    ...upper.slice().reverse(),
  ];
}

function applyTabletUVs(geometry, radius, halfHeight, start = 0, span = Math.PI * 2) {
  const source = geometry.attributes, positions = [], normals = [], uvs = [], indices = [], vertices = new Map();
  for (let i = 0; i < geometry.index.count; i += 3) {
    const triangle = [0, 1, 2].map(j => geometry.index.getX(i + j));
    const height = triangle.reduce((sum, index) => sum + source.position.getY(index), 0) / 3;
    const region = triangle.every(index => Math.abs(source.position.getY(index)) > halfHeight * .56) ? Math.sign(height) : 0;
    for (const index of triangle) {
      const key = `${index}:${region}`;
      if (!vertices.has(key)) {
        vertices.set(key, positions.length / 3);
        const x = source.position.getX(index), y = source.position.getY(index), z = source.position.getZ(index);
        positions.push(x, y, z); normals.push(source.normal.getX(index), source.normal.getY(index), source.normal.getZ(index));
        if (region) uvs.push(.5 + x / (2 * radius), .5 - region * z / (2 * radius));
        else uvs.push((start + source.uv.getX(index) * span) * 3 / (Math.PI * 2), .5 + y / (2 * radius));
      }
      indices.push(vertices.get(key));
    }
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices);
}

export function createTabletGeometry(radius = 1, halfHeight = .23, radialSegments = 128) {
  const geometry = new THREE.LatheGeometry(
    tabletProfile(Math.max(.001, radius), Math.max(.001, halfHeight)),
    Math.max(24, Math.floor(radialSegments)),
  );
  applyTabletUVs(geometry, Math.max(.001, radius), Math.max(.001, halfHeight));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

const unitProfile = tabletProfile(1, 1);
export function tabletHalfHeightAt(radiusFraction, halfHeight = .23) {
  const r = Math.abs(radiusFraction);
  if (r > 1) return 0;
  for (let i = 1; i < unitProfile.length; i++) {
    const a = unitProfile[i - 1], b = unitProfile[i];
    if (a.x <= r && b.x >= r && b.x > a.x) {
      return -halfHeight * THREE.MathUtils.lerp(a.y, b.y, (r - a.x) / (b.x - a.x));
    }
  }
  return .38 * halfHeight;
}

export function createTabletWedgeGeometry(startAngle, angleLength, radius = 1, halfHeight = .23) {
  const span = Math.min(Math.PI * 2, Math.abs(angleLength));
  if (span < 1e-7 || radius <= 0 || halfHeight <= 0) return new THREE.BufferGeometry();
  const start = angleLength < 0 ? startAngle - span : startAngle;
  const profile = tabletProfile(radius, halfHeight);
  const geometry = new THREE.LatheGeometry(profile, Math.max(2, Math.ceil(128 * span / (Math.PI * 2))), start, span);
  applyTabletUVs(geometry, radius, halfHeight, start, span);
  if (span < Math.PI * 2 - 1e-7) {
    const positions = Array.from(geometry.attributes.position.array), normals = Array.from(geometry.attributes.normal.array);
    const uvs = Array.from(geometry.attributes.uv.array), indices = Array.from(geometry.index.array), shellCount = indices.length;
    for (let side = 0; side < 2; side++) {
      const angle = start + span * side, sine = Math.sin(angle), cosine = Math.cos(angle), sign = side ? 1 : -1;
      const center = positions.length / 3;
      positions.push(radius * .45 * sine, 0, radius * .45 * cosine);
      normals.push(sign * cosine, 0, -sign * sine); uvs.push(.45, .5);
      profile.forEach((p, i) => {
        positions.push(p.x * sine, p.y, p.x * cosine);
        normals.push(sign * cosine, 0, -sign * sine); uvs.push(p.x / radius, .5 + p.y / (2 * halfHeight));
        const current = center + 1 + i, next = center + 1 + (i + 1) % profile.length;
        indices.push(center, side ? next : current, side ? current : next);
      });
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices);
    geometry.clearGroups(); geometry.addGroup(0, shellCount, 0); geometry.addGroup(shellCount, indices.length - shellCount, 1);
  }
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  return geometry;
}

export function createTabletFragments() {
  const seeds = [[-.68, -.4], [-.12, -.68], [.5, -.5], [.75, .02], [.49, .62],
    [-.12, .73], [-.65, .46], [-.78, 0], [-.25, -.08], [.24, .18]];
  const tau = Math.PI * 2, step = tau / 128, apothem = Math.cos(step / 2);
  const disk = Array.from({ length: 128 }, (_, i) => ({ x: Math.cos(i * step), z: Math.sin(i * step) }));
  const effectiveRadius = (x, z) => {
    const angle = ((Math.atan2(x, z) % step) + step) % step;
    return Math.hypot(x, z) * Math.cos(angle - step / 2) / apothem;
  };
  const crown = (x, z) => {
    const r = Math.min(1, effectiveRadius(x, z)), low = Math.max(0, r - .0001), high = Math.min(1, r + .0001);
    const h = tabletHalfHeightAt(r), slope = (tabletHalfHeightAt(high) - tabletHalfHeightAt(low)) / Math.max(.00001, high - low);
    const length = Math.hypot(x, z), nx = length > 1e-7 ? -slope * x / length : 0, nz = length > 1e-7 ? -slope * z / length : 0;
    const inverse = 1 / Math.hypot(nx, 1, nz);
    return { h, nx: nx * inverse, ny: inverse, nz: nz * inverse };
  };
  return seeds.map((seed, seedIndex) => {
    let polygon = disk.map(point => ({ ...point }));
    seeds.forEach((other, otherIndex) => {
      if (otherIndex === seedIndex) return;
      const nx = other[0] - seed[0], nz = other[1] - seed[1];
      const limit = (other[0] ** 2 + other[1] ** 2 - seed[0] ** 2 - seed[1] ** 2) / 2, next = [];
      for (let i = 0; i < polygon.length; i++) {
        const a = polygon[i], b = polygon[(i + 1) % polygon.length];
        const da = a.x * nx + a.z * nz - limit, db = b.x * nx + b.z * nz - limit;
        if (da <= 1e-10) next.push(a);
        if ((da <= 1e-10) !== (db <= 1e-10)) {
          const t = da / (da - db); next.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t });
        }
      }
      polygon = next.filter((point, i, points) => !i || Math.hypot(point.x - points[i - 1].x, point.z - points[i - 1].z) > 1e-8);
      if (polygon.length > 1 && Math.hypot(polygon[0].x - polygon.at(-1).x, polygon[0].z - polygon.at(-1).z) < 1e-8) polygon.pop();
    });
    let area = 0, cx = 0, cz = 0;
    polygon.forEach((a, i) => {
      const b = polygon[(i + 1) % polygon.length], cross = a.x * b.z - b.x * a.z;
      area += cross; cx += (a.x + b.x) * cross; cz += (a.z + b.z) * cross;
    });
    const center = { x: cx / (3 * area), z: cz / (3 * area) }, boundary = [];
    polygon.forEach((a, i) => {
      const b = polygon[(i + 1) % polygon.length], segments = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / .065 - 1e-8));
      for (let j = 0; j < segments; j++) boundary.push({ x: a.x + (b.x - a.x) * j / segments, z: a.z + (b.z - a.z) * j / segments });
    });
    const positions = [], normals = [], uvs = [], shell = [], fracture = [];
    const vertex = (x, y, z, nx, ny, nz, u, v) => {
      const index = positions.length / 3; positions.push(x, y, z); normals.push(nx, ny, nz); uvs.push(u, v); return index;
    };
    for (const sign of [1, -1]) {
      const make = point => { const c = crown(point.x, point.z); return vertex(point.x, c.h * sign, point.z, c.nx, c.ny * sign, c.nz, .5 + point.x / 2, .5 - sign * point.z / 2); };
      const triangle = (a, b, c) => shell.push(a, sign > 0 ? c : b, sign > 0 ? b : c);
      const origin = make(center); let previous = null;
      for (const t of [.25, .5, .72, .88, .965, 1]) {
        const ring = boundary.map(point => make({ x: center.x + (point.x - center.x) * t, z: center.z + (point.z - center.z) * t }));
        ring.forEach((index, i) => {
          const next = (i + 1) % ring.length;
          if (!previous) triangle(origin, index, ring[next]);
          else { triangle(previous[i], index, ring[next]); triangle(previous[i], ring[next], previous[next]); }
        });
        previous = ring;
      }
    }
    boundary.forEach((a, i) => {
      const b = boundary[(i + 1) % boundary.length], ah = crown(a.x, a.z).h, bh = crown(b.x, b.z).h;
      const dx = b.x - a.x, dz = b.z - a.z, length = Math.hypot(dx, dz);
      const outer = Math.abs(effectiveRadius((a.x + b.x) / 2, (a.z + b.z) / 2) - 1) < 1e-7;
      const normal = point => outer ? [point.x / Math.hypot(point.x, point.z), 0, point.z / Math.hypot(point.x, point.z)] : [dz / length, 0, -dx / length];
      let au = outer ? Math.atan2(a.x, a.z) * 3 / tau : .5 + (a.x * dx + a.z * dz) / (2 * length);
      let bu = outer ? Math.atan2(b.x, b.z) * 3 / tau : .5 + (b.x * dx + b.z * dz) / (2 * length);
      if (outer && Math.abs(bu - au) > 1.5) { if (bu < au) bu += 3; else au += 3; }
      const an = normal(a), bn = normal(b), indices = outer ? shell : fracture;
      const aa = vertex(a.x, ah, a.z, ...an, au, .5 + ah / 2), bb = vertex(b.x, bh, b.z, ...bn, bu, .5 + bh / 2);
      const bc = vertex(b.x, -bh, b.z, ...bn, bu, .5 - bh / 2), ad = vertex(a.x, -ah, a.z, ...an, au, .5 - ah / 2);
      indices.push(aa, bb, bc, aa, bc, ad);
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex([...shell, ...fracture]);
    geometry.addGroup(0, shell.length, 0); geometry.addGroup(shell.length, fracture.length, 1);
    geometry.translate(-center.x, 0, -center.z); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    return { geometry, center };
  });
}

export function createCutFaceGeometry(cutX = 0, radius = 1, halfHeight = .23) {
  const geometry = new THREE.BufferGeometry();
  const distance = Math.abs(cutX);
  if (radius <= 0 || halfHeight <= 0 || distance >= radius) return geometry;
  const profile = tabletProfile(radius, halfHeight), half = [];
  const add = (r, y) => {
    const point = { y, z: Math.sqrt(Math.max(0, r * r - distance * distance)) };
    const last = half[half.length - 1];
    if (!last || Math.abs(last.y - y) + Math.abs(last.z - point.z) > 1e-10) half.push(point);
  };
  for (let i = 0; i < profile.length; i++) {
    const current = profile[i], previous = profile[i - 1];
    if (previous && (previous.x - distance) * (current.x - distance) < 0) {
      const t = (distance - previous.x) / (current.x - previous.x);
      add(distance, THREE.MathUtils.lerp(previous.y, current.y, t));
    }
    if (current.x >= distance) add(current.x, current.y);
  }
  // Traverse counterclockwise in the YZ plane, so every face normal is +X.
  const ring = half.map(p => ({ y: p.y, z: -p.z }));
  ring.push(...half.slice(1, -1).reverse().map(p => ({ y: p.y, z: p.z })));
  const positions = [cutX, 0, 0], normals = [1, 0, 0], uvs = [.5, .5], indices = [];
  ring.forEach((point, index) => {
    positions.push(cutX, point.y, point.z);
    normals.push(1, 0, 0);
    uvs.push(.5 + point.z / (2 * radius), .5 + point.y / (2 * halfHeight));
    indices.push(0, index + 1, (index + 1) % ring.length + 1);
  });
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function weldGeometry(source) {
  const vertices = [], indices = [], unique = new Map();
  const attribute = source.getAttribute('position');
  for (let i = 0; i < attribute.count; i++) {
    const x = attribute.getX(i), y = attribute.getY(i), z = attribute.getZ(i);
    const key = `${Math.round(x * 1e6)},${Math.round(y * 1e6)},${Math.round(z * 1e6)}`;
    if (!unique.has(key)) { unique.set(key, vertices.length / 3); vertices.push(x, y, z); }
    indices.push(unique.get(key));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(source.index ? Array.from(source.index.array, index => indices[index]) : indices);
  source.dispose();
  return geometry;
}

function smoothNoise3(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
  const tx = fade(x - ix), ty = fade(y - iy), tz = fade(z - iz);
  const hash = (a, b, c) => {
    let value = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ Math.imul(c, 1442695041) ^ 57391;
    value = Math.imul(value ^ (value >>> 13), 1274126177);
    return ((value ^ (value >>> 16)) >>> 0) / 2147483647.5 - 1;
  };
  const mix = THREE.MathUtils.lerp;
  const plane = dz => mix(mix(hash(ix, iy, iz + dz), hash(ix + 1, iy, iz + dz), tx),
    mix(hash(ix, iy + 1, iz + dz), hash(ix + 1, iy + 1, iz + dz), tx), ty);
  return mix(plane(0), plane(1), tz);
}

function createMacroAggregateGeometry(detail) {
  const random = deterministic(23061), pores = [];
  for (let i = 0; i < 88; i++) {
    const y = random() * 2 - 1, angle = random() * Math.PI * 2, ring = Math.sqrt(1 - y * y);
    pores.push([ring * Math.sin(angle), y, ring * Math.cos(angle), .055 + random() * .065, .025 + random() * .025]);
  }
  const geometry = weldGeometry(new THREE.SphereGeometry(1, detail >= 5 ? 80 : 64, detail >= 5 ? 60 : 48));
  const positions = geometry.attributes.position;
  let maxRadius = 0;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    let radius = .88 + .3 * smoothNoise3(x * 2.2 + 7, y * 2.2 - 3, z * 2.2)
      + .14 * smoothNoise3(x * 6.5, y * 6.5 + 11, z * 6.5)
      + .035 * smoothNoise3(x * 16, y * 16, z * 16 + 4)
      + .007 * smoothNoise3(x * 34, y * 34, z * 34);
    for (const pore of pores) {
      const distance2 = Math.max(0, 2 * (1 - x * pore[0] - y * pore[1] - z * pore[2]));
      if (distance2 < pore[3] ** 2 * 5) radius -= pore[4] * Math.exp(-distance2 / (pore[3] ** 2));
    }
    const px = radius * (x * .95 - y * .08), py = radius * y, pz = radius * z * .9;
    positions.setXYZ(i, px, py, pz); maxRadius = Math.max(maxRadius, Math.hypot(px, py, pz));
  }
  geometry.scale(1 / maxRadius, 1 / maxRadius, 1 / maxRadius);
  geometry.computeVertexNormals(); applyGrainUVs(geometry); geometry.computeBoundingBox();
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1);
  return geometry;
}

function createMacroMineralGeometry(detail) {
  const outline = [[-.58, -.29], [-.13, -.64], [.52, -.49], [.67, .13], [.17, .56], [-.47, .49]];
  const shape = new THREE.Shape(); shape.moveTo(...outline[0]);
  for (const point of outline.slice(1)) shape.lineTo(...point);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 1.1, steps: 1, curveSegments: 1,
    bevelEnabled: true, bevelThickness: .024, bevelSize: .032, bevelSegments: Math.max(2, Math.min(4, detail - 1)) });
  geometry.translate(0, 0, -.55);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    positions.setXYZ(i, x + .075 * z, y - .035 * z, z + .13 * x - .07 * y);
  }
  geometry.rotateX(-Math.PI / 2); geometry.center();
  let radius = 0;
  for (let i = 0; i < positions.count; i++) radius = Math.max(radius, Math.hypot(positions.getX(i), positions.getY(i), positions.getZ(i)));
  geometry.scale(1 / radius, 1 / radius, 1 / radius); geometry.computeVertexNormals(); geometry.clearGroups();
  geometry.computeBoundingBox(); geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1);
  return geometry;
}

function applyGrainUVs(geometry) {
  const positions = Array.from(geometry.attributes.position.array), normals = Array.from(geometry.attributes.normal.array), uvs = [];
  const indices = geometry.index ? Array.from(geometry.index.array) : Array.from({ length: positions.length / 3 }, (_, i) => i);
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i], y = positions[i + 1], z = positions[i + 2], length = Math.hypot(x, y, z);
    uvs.push(.5 + Math.atan2(x, z) / (Math.PI * 2), .5 + Math.asin(THREE.MathUtils.clamp(y / length, -1, 1)) / Math.PI);
  }
  // Split only the longitude seam, copying welded normals without recalculation.
  const seamVertices = new Map();
  for (let i = 0; i < indices.length; i += 3) {
    const values = indices.slice(i, i + 3).map(index => uvs[index * 2]);
    if (Math.max(...values) - Math.min(...values) <= .5) continue;
    for (let j = 0; j < 3; j++) {
      const index = indices[i + j];
      if (uvs[index * 2] >= .5) continue;
      if (!seamVertices.has(index)) {
        seamVertices.set(index, positions.length / 3);
        positions.push(...positions.slice(index * 3, index * 3 + 3));
        normals.push(...normals.slice(index * 3, index * 3 + 3));
        uvs.push(uvs[index * 2] + 1, uvs[index * 2 + 1]);
      }
      indices[i + j] = seamVertices.get(index);
    }
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
}

export function createGrainGeometry(type, detail = 1) {
  const kind = type === 0 ? 0 : type === 1 ? 1 : 2;
  const resolution = Math.max(0, Math.min(5, Math.floor(detail)));
  if (kind === 1 && resolution >= 4) return createMacroAggregateGeometry(resolution);
  if (kind === 0 && resolution >= 3) return createMacroMineralGeometry(resolution);
  const random = deterministic(2189 + kind * 7907 + resolution);
  let geometry = weldGeometry(new THREE.IcosahedronGeometry(1, kind === 0 ? 0 : kind === 1 ? resolution + 1 : resolution));
  const positions = geometry.getAttribute('position');
  let maxRadius = 0;
  for (let i = 0; i < positions.count; i++) {
    let x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    const lobes = Math.sin(x * 5.8 + y * 3.7) * Math.sin(z * 6.1 - y * 4.2);
    const scale = kind === 0 ? .81 + random() * .25 : kind === 1
      ? .82 + lobes * .19 + (random() - .5) * .17 : .77 + random() * .34;
    const pore = kind === 1 && random() > .84 ? .79 : 1;
    x *= scale * pore * (kind === 0 ? 1 : kind === 1 ? .94 : 1);
    y *= scale * pore * (kind === 0 ? .68 : kind === 1 ? 1 : .51);
    z *= scale * pore * (kind === 0 ? .76 : kind === 1 ? .88 : .72);
    x += y * (kind === 0 ? .18 : -.09);
    positions.setXYZ(i, x, y, z);
    maxRadius = Math.max(maxRadius, Math.hypot(x, y, z));
  }
  geometry.scale(1 / maxRadius, 1 / maxRadius, 1 / maxRadius);
  if (kind === 0) {
    const indexed = geometry;
    geometry = indexed.toNonIndexed();
    indexed.dispose();
  }
  geometry.computeVertexNormals();
  applyGrainUVs(geometry);
  geometry.computeBoundingBox();
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1);
  return geometry;
}

function makeTexture(pixels, color = false) {
  const size = 512;
  const canvas = typeof document === 'undefined' ? new OffscreenCanvas(size, size) : document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  const image = context.createImageData(size, size);
  image.data.set(pixels);
  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.anisotropy = 4;
  texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  return texture;
}

export function createTabletTextures() {
  const size = 512, count = size * size, random = deterministic(934721);
  const heights = new Float32Array(count), grain = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    grain[i] = (random() + random() + random() - 1.5);
    heights[i] = 134 + grain[i] * 11 + (random() - .5) * 5;
  }
  // Dense micropowder plus sparse readable pores that survive mip reduction.
  for (let n = 0; n < 15300; n++) {
    const cx = random() * size, cy = random() * size;
    const fine = n < 13500;
    const radius = fine ? .42 + random() * 1.25 : 1.2 + random() ** 1.8 * 2.8;
    const depth = fine ? 7 + random() * 17 : 20 + random() * 35;
    for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
      for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
        const distance = Math.hypot(x + .5 - cx, y + .5 - cy) / radius;
        if (distance >= 1) continue;
        const index = ((y + size) % size) * size + ((x + size) % size);
        heights[index] -= depth * (1 - distance * distance) ** 2;
      }
    }
  }
  const bump = new Uint8ClampedArray(count * 4);
  const normal = new Uint8ClampedArray(count * 4);
  const roughness = new Uint8ClampedArray(count * 4), color = new Uint8ClampedArray(count * 4);
  for (let i = 0; i < count; i++) {
    const offset = i * 4, height = heights[i], shade = grain[i] * 2.1 + (height - 134) * .22;
    for (let channel = 0; channel < 3; channel++) {
      bump[offset + channel] = height;
      roughness[offset + channel] = 219 + grain[i] * 7 + (134 - height) * .19;
      color[offset + channel] = [246, 244, 238][channel] + shade;
    }
    const x = i % size, y = Math.floor(i / size);
    const dx = (heights[y * size + (x + 1) % size] - heights[y * size + (x + size - 1) % size]) * (5.5 / 255);
    const dy = (heights[((y + 1) % size) * size + x] - heights[((y + size - 1) % size) * size + x]) * (5.5 / 255);
    const inverseLength = 1 / Math.hypot(dx, dy, 1);
    normal[offset] = (1 - dx * inverseLength) * 127.5;
    normal[offset + 1] = (1 + dy * inverseLength) * 127.5;
    normal[offset + 2] = (1 + inverseLength) * 127.5; normal[offset + 3] = 255;
    bump[offset + 3] = roughness[offset + 3] = color[offset + 3] = 255;
  }
  const result = { bump: makeTexture(bump), normal: makeTexture(normal), roughness: makeTexture(roughness), color: makeTexture(color, true) };
  result.bump.name = 'DOSE original compressed-powder micropores';
  result.roughness.name = 'DOSE original powder roughness';
  result.normal.name = 'DOSE original compressed-powder tangent normals';
  result.color.name = 'DOSE original warm-white mineral color';
  return result;
}

export function createMetalTexture() {
  const size = 512, pixels = new Uint8ClampedArray(size * size * 4), random = deterministic(71739);
  const rows = Float32Array.from({ length: size }, () => (random() - .5) * 9);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const offset = (y * size + x) * 4;
      const tooling = Math.sin(y * Math.PI * 2 * 193 / size + .16 * Math.sin(x * Math.PI * 8 / size));
      const bands = Math.sin(y * Math.PI * 2 * 61 / size + .12 * Math.sin(x * Math.PI * 4 / size));
      const shade = 196 + rows[y] + tooling * 6 + bands * 3.5 + (random() - .5) * 8;
      pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = shade;
      pixels[offset + 3] = 255;
    }
  }
  const texture = makeTexture(pixels);
  texture.repeat.set(2, 2);
  texture.name = 'DOSE original fine machined-metal height and roughness';
  return texture;
}
