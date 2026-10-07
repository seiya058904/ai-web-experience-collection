import * as THREE from 'three';

/** Original, dimensionless violin outline with classic upper/lower bouts and projecting corners. */
export function violinOutline(scale = 1): THREE.Shape {
  const s = new THREE.Shape();
  const m = (x: number, y: number) => s.moveTo(x * scale, y * scale);
  const b = (a: number, b: number, c: number, d: number, e: number, f: number) =>
    s.bezierCurveTo(a * scale, b * scale, c * scale, d * scale, e * scale, f * scale);
  m(0, 3.50);
  b(.71, 3.50, 1.46, 3.27, 1.64, 2.64);
  b(1.82, 2.02, 1.61, 1.59, 1.39, 1.27);
  b(1.36, 1.22, 1.49, 1.16, 1.70, 1.12);
  b(1.87, 1.08, 1.84, .96, 1.70, .92);
  b(1.31, .90, 1.02, .63, .99, .18);
  b(.97, -.30, 1.28, -.67, 1.77, -.82);
  b(1.94, -.87, 1.91, -.99, 1.76, -1.02);
  b(1.53, -1.08, 1.61, -1.15, 1.76, -1.40);
  b(2.17, -2.01, 2.09, -2.80, 1.53, -3.18);
  b(1.14, -3.48, .48, -3.54, 0, -3.54);
  b(-.48, -3.54, -1.14, -3.48, -1.53, -3.18);
  b(-2.09, -2.80, -2.17, -2.01, -1.76, -1.40);
  b(-1.61, -1.15, -1.53, -1.08, -1.76, -1.02);
  b(-1.91, -.99, -1.94, -.87, -1.77, -.82);
  b(-1.28, -.67, -.97, -.30, -.99, .18);
  b(-1.02, .63, -1.31, .90, -1.70, .92);
  b(-1.84, .96, -1.87, 1.08, -1.70, 1.12);
  b(-1.49, 1.16, -1.36, 1.22, -1.39, 1.27);
  b(-1.61, 1.59, -1.82, 2.02, -1.64, 2.64);
  b(-1.46, 3.27, -.71, 3.50, 0, 3.50);
  s.closePath();
  return s;
}

/** An authored f-hole, including the two eyes and a small central nick. */
export function soundHole(side: -1 | 1): THREE.Path {
  const p = new THREE.Path();
  // Keep both apertures well inside the C-bout boundary; the bridge sits between their nicks.
  const fx = (x: number) => (.75 + (x - 1.12) * .48) * side;
  const fy = (y: number) => y * .64 - .13;
  const m = (x: number, y: number) => p.moveTo(fx(x), fy(y));
  const b = (a: number, b: number, c: number, d: number, e: number, f: number) =>
    p.bezierCurveTo(fx(a), fy(b), fx(c), fy(d), fx(e), fy(f));
  const l = (x: number, y: number) => p.lineTo(fx(x), fy(y));
  m(.96, 1.39);
  b(1.14, 1.48, 1.34, 1.33, 1.26, 1.14);
  b(1.20, 1.00, 1.03, 1.01, .99, 1.12);
  b(.89, 1.03, .85, .73, .96, .35);
  l(1.06, .04);
  l(.99, -.04);
  l(1.10, -.04);
  b(1.19, -.31, 1.24, -.61, 1.18, -.87);
  b(1.35, -.77, 1.55, -.93, 1.49, -1.12);
  b(1.43, -1.34, 1.15, -1.39, 1.03, -1.20);
  b(.95, -1.08, 1.03, -.96, 1.12, -.98);
  b(1.13, -.78, 1.03, -.51, .90, -.19);
  l(.87, -.08);
  l(.78, -.08);
  l(.86, .00);
  b(.71, .48, .79, .95, .88, 1.22);
  b(.86, 1.29, .90, 1.36, .96, 1.39);
  p.closePath();
  return p;
}

// Smooth width field follows the bouts. It is used only to shape the arch, not the silhouette.
function bodyWidth(y: number): number {
  const keys = [[-3.55, .05], [-3.2, 1.50], [-2.3, 2.04], [-1.5, 1.82], [-1, 1.78],
    [-.4, 1.13], [.2, 1.00], [.8, 1.36], [1.2, 1.49], [2.1, 1.73], [2.8, 1.55], [3.5, .05]];
  for (let i = 0; i < keys.length - 1; i++) {
    if (y <= keys[i + 1][0]) {
      const t = THREE.MathUtils.clamp((y - keys[i][0]) / (keys[i + 1][0] - keys[i][0]), 0, 1);
      const sm = t * t * (3 - 2 * t);
      return THREE.MathUtils.lerp(keys[i][1], keys[i + 1][1], sm);
    }
  }
  return .05;
}

export function archHeight(x: number, y: number, back = false): number {
  const across = Math.max(0, 1 - (x / bodyWidth(y)) ** 2);
  const along = Math.max(0, 1 - (y / 3.55) ** 4);
  const crown = (back ? .235 : .26) * Math.pow(across, 1.35) * along;
  return back ? -.43 - crown : .43 + crown;
}

/** Refines planar triangles before arching: f-holes stay real holes and the crown remains smooth. */
export function archedSurface(shape: THREE.Shape, back = false, underside = false): THREE.BufferGeometry {
  const planar = new THREE.ShapeGeometry(shape, 12);
  const p = planar.getAttribute('position');
  const vertices: number[][] = [];
  for (let i = 0; i < p.count; i++) vertices.push([p.getX(i), p.getY(i)]);
  let indices: number[] = Array.from(planar.index!.array);
  for (let level = 0; level < 3; level++) {
    const midpoints = new Map<string, number>();
    const mid = (a: number, b: number) => {
      const key = a < b ? `${a}/${b}` : `${b}/${a}`;
      let id = midpoints.get(key);
      if (id === undefined) {
        id = vertices.length;
        vertices.push([(vertices[a][0] + vertices[b][0]) * .5, (vertices[a][1] + vertices[b][1]) * .5]);
        midpoints.set(key, id);
      }
      return id;
    };
    const next: number[] = [];
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i], b = indices[i + 1], c = indices[i + 2];
      const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
      next.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
    }
    indices = next;
  }
  const positions: number[] = [], uvs: number[] = [], colors: number[] = [], normals: number[] = [];
  const reverse = back !== underside;
  const thickness = underside ? (back ? .064 : -.064) : 0;
  for (const [x, y] of vertices) {
    positions.push(x, y, archHeight(x, y, back) + thickness);
    uvs.push((x + 2.18) / 4.36, (y + 3.55) / 7.1);
    const edge = THREE.MathUtils.clamp(1 - Math.abs(x) / Math.max(bodyWidth(y), .01), 0, 1);
    const shade = .78 + .22 * Math.pow(edge, .32);
    colors.push(shade, shade, shade);
    // Analytic surface gradients avoid specular seams from the nonuniform aperture triangulation.
    const epsilon = .002;
    const dx = (archHeight(x + epsilon, y, back) - archHeight(x - epsilon, y, back)) / (epsilon * 2);
    const dy = (archHeight(x, y + epsilon, back) - archHeight(x, y - epsilon, back)) / (epsilon * 2);
    const n = new THREE.Vector3(-dx, -dy, 1).normalize().multiplyScalar(reverse ? -1 : 1);
    normals.push(n.x, n.y, n.z);
  }
  if (reverse) for (let i = 0; i < indices.length; i += 3) [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  g.setIndex(indices);
  planar.dispose();
  return g;
}

export function plateEdge(shape: THREE.Shape, back = false): THREE.BufferGeometry {
  const contours = shape.extractPoints(16);
  const all = [contours.shape, ...contours.holes];
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  for (const ring of all) {
    const offset = positions.length / 3;
    for (let i = 0; i < ring.length; i++) {
      const {x, y} = ring[i];
      const z = archHeight(x, y, back);
      positions.push(x, y, z, x, y, z + (back ? .064 : -.064));
      uvs.push(i / ring.length, 0, i / ring.length, 1);
      if (i < ring.length - 1) {
        const n = offset + i * 2;
        indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

/** Thin bent ribs: two independent surfaces make a hollow wall, not a solid extrusion. */
export function ribSurface(inner = false): THREE.BufferGeometry {
  const ring = violinOutline(inner ? .951 : .975).getSpacedPoints(256);
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  for (let i = 0; i < ring.length; i++) {
    const {x, y} = ring[i];
    positions.push(x, y, -.415, x, y, .410);
    uv.push(i / (ring.length - 1) * 6, 0, i / (ring.length - 1) * 6, 1);
    if (i < ring.length - 1) {
      const n = i * 2;
      if (inner) indices.push(n, n + 2, n + 1, n + 1, n + 2, n + 3);
      else indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

export function rimCurve(scale: number, z: number | 'top' | 'back'): THREE.CatmullRomCurve3 {
  const p = violinOutline(scale).getSpacedPoints(224).slice(0, -1);
  return new THREE.CatmullRomCurve3(p.map(({x, y}) => new THREE.Vector3(x, y,
    typeof z === 'number' ? z : archHeight(x, y, z === 'back') + (z === 'back' ? -.01 : .01))), true, 'centripetal');
}

export function fingerboardGeometry(): THREE.BufferGeometry {
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  const rows = 28, columns = 12;
  for (let r = 0; r <= rows; r++) {
    const t = r / rows, y = .76 + t * 4.92;
    const half = THREE.MathUtils.lerp(.43, .245, t);
    for (let c = 0; c <= columns; c++) {
      const u = c / columns, x = (u * 2 - 1) * half;
      const crown = .065 * (1 - (x / half) ** 2);
      positions.push(x, y, .91 + t * .115 + crown);
      uv.push(u, t * 3);
      if (r < rows && c < columns) {
        const a = r * (columns + 1) + c;
        indices.push(a, a + 1, a + columns + 1, a + 1, a + columns + 2, a + columns + 1);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

export function bridgeGeometry(): THREE.ExtrudeGeometry {
  const s = new THREE.Shape();
  s.moveTo(-.66, 0);
  s.lineTo(-.64, .11);
  s.bezierCurveTo(-.46, .12, -.47, .30, -.48, .35);
  s.bezierCurveTo(-.64, .34, -.72, .46, -.61, .51);
  s.bezierCurveTo(-.48, .45, -.43, .54, -.48, .60);
  s.lineTo(-.59, .66);
  s.bezierCurveTo(-.38, .83, .38, .83, .59, .66);
  s.lineTo(.48, .60);
  s.bezierCurveTo(.43, .54, .48, .45, .61, .51);
  s.bezierCurveTo(.72, .46, .64, .34, .48, .35);
  s.bezierCurveTo(.47, .30, .46, .12, .64, .11);
  s.lineTo(.66, 0);
  s.lineTo(.35, 0);
  s.bezierCurveTo(.37, .10, .24, .17, 0, .18);
  s.bezierCurveTo(-.24, .17, -.37, .10, -.35, 0);
  s.closePath();
  const heart = new THREE.Path();
  heart.moveTo(0, .42);
  heart.bezierCurveTo(-.26, .57, -.13, .70, 0, .60);
  heart.bezierCurveTo(.13, .70, .26, .57, 0, .42);
  heart.closePath();
  s.holes.push(heart);
  for (const side of [-1, 1]) {
    const kidney = new THREE.Path();
    kidney.absellipse(side * .30, .38, .085, .125, -.4, Math.PI * 2 - .4, false, side * .28);
    s.holes.push(kidney);
  }
  const g = new THREE.ExtrudeGeometry(s, {depth: .065, bevelEnabled: true, bevelSize: .012, bevelThickness: .010, bevelSegments: 2, curveSegments: 10, steps: 1});
  g.rotateX(Math.PI / 2);
  return g;
}

export function taperedBarGeometry(): THREE.BufferGeometry {
  const path = new THREE.CatmullRomCurve3(Array.from({length: 25}, (_, i) => {
    const y = -2.47 + i / 24 * 4.98;
    return new THREE.Vector3(-.62, y, archHeight(-.62, y) - .064);
  }));
  // A shaped rectangular bass bar; the end heights taper into the underside of the plate.
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40, p = path.getPoint(t);
    const height = .045 + Math.sin(Math.PI * t) * .21;
    for (const [dx, dz] of [[-.065, 0], [.065, 0], [.065, -height], [-.065, -height]]) {
      positions.push(p.x + dx, p.y, p.z + dz);
      uv.push(t, dx < 0 ? 0 : 1);
    }
    if (i < 40) for (let k = 0; k < 4; k++) {
      const a = i * 4 + k, b = i * 4 + (k + 1) % 4;
      indices.push(a, b, a + 4, b, b + 4, a + 4);
    }
  }
  indices.push(0, 3, 1, 1, 3, 2, 160, 161, 163, 161, 162, 163);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
