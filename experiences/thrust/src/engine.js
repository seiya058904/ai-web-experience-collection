import * as THREE from 'three';

// THRUST / original, illustrative, direct-drive, two-spool turbofan.
// +Z is downstream. Dimensions describe one consistent machine, not a CAD model.
const TAU = Math.PI * 2;
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const clamp01 = (v) => Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0));
const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Revolve a closed radius/Z profile, including physical caps on cut sectors. */
function revolved(profile, segments = 80, start = 0, arc = TAU) {
  const points = profile.map(([r, z]) => new THREE.Vector2(r, z));
  const base = new THREE.LatheGeometry(points, segments, start, arc);
  base.rotateX(Math.PI / 2);
  base.rotateZ(Math.PI / 2);
  if (arc > TAU - 0.001) return base;

  const positions = Array.from(base.attributes.position.array);
  const normals = Array.from(base.attributes.normal.array);
  const uv = Array.from(base.attributes.uv.array);
  const indices = Array.from(base.index.array);
  const contour = points.slice();
  if (contour[0].distanceToSquared(contour.at(-1)) < 1e-10) contour.pop();
  const triangles = THREE.ShapeUtils.triangulateShape(contour, []);
  const pa = new THREE.Vector3();
  const pb = new THREE.Vector3();
  const pc = new THREE.Vector3();
  for (const [angle, direction] of [[start, -1], [start + arc, 1]]) {
    const first = positions.length / 3;
    const expected = new THREE.Vector3(-Math.sin(angle) * direction, Math.cos(angle) * direction, 0);
    for (const p of contour) {
      positions.push(p.x * Math.cos(angle), p.x * Math.sin(angle), p.y);
      normals.push(expected.x, expected.y, 0);
      uv.push(p.x, p.y);
    }
    for (const triangle of triangles) {
      const [a, b, c] = triangle.map((i) => first + i);
      pa.fromArray(positions, a * 3);
      pb.fromArray(positions, b * 3).sub(pa);
      pc.fromArray(positions, c * 3).sub(pa);
      if (pb.cross(pc).dot(expected) >= 0) indices.push(a, b, c);
      else indices.push(a, c, b);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  base.dispose();
  return geometry;
}

/** A span-twisted, cambered, finite-thickness airfoil, never a flat triangle. */
function airfoil({
  root, tip, chord = 0.22, chordTip = 0.15, pitchRoot = 0.88, pitchTip = 0.5,
  sweep = 0.09, lean = 0.025, thickness = 0.075, camber = 0.06,
  spanSteps = 9, chordSteps = 10, fan = false,
}) {
  const positions = [];
  const uv = [];
  const bodyIndices = [];
  const edgeIndices = [];
  const row = chordSteps + 1;
  const surfaceSize = (spanSteps + 1) * row;
  const index = (side, s, c) => side * surfaceSize + s * row + c;
  for (let side = 0; side < 2; side++) {
    const sign = side === 0 ? 1 : -1;
    for (let si = 0; si <= spanSteps; si++) {
      const s = si / spanSteps;
      const r = THREE.MathUtils.lerp(root, tip, s);
      const bladeChord = fan ? 0.25 + 0.47 * Math.sin(Math.PI * 0.82 * s) : THREE.MathUtils.lerp(chord, chordTip, s);
      const angle = sweep * s * s - (fan ? 0.055 * s : 0);
      const pitch = THREE.MathUtils.lerp(pitchRoot, pitchTip, s);
      const cr = Math.cos(angle), sr = Math.sin(angle);
      const cp = Math.cos(pitch), sp = Math.sin(pitch);
      for (let ci = 0; ci <= chordSteps; ci++) {
        // Cosine spacing resolves the rounded leading edge at close range.
        const u = 0.5 - 0.5 * Math.cos(Math.PI * ci / chordSteps);
        const naca = 5 * thickness * bladeChord * (
          0.2969 * Math.sqrt(u) - 0.126 * u - 0.3516 * u * u +
          0.2843 * u * u * u - 0.1036 * u * u * u * u
        );
        const normalOffset = camber * bladeChord * Math.sin(Math.PI * u) + sign * naca;
        const chordOffset = (u - 0.5) * bladeChord;
        const tangential = cp * chordOffset - sp * normalOffset;
        positions.push(
          cr * r - sr * tangential,
          sr * r + cr * tangential,
          lean * s * s + sp * chordOffset + cp * normalOffset,
        );
        uv.push(u * 2, s * (fan ? 7 : 3));
      }
    }
  }
  for (let side = 0; side < 2; side++) {
    for (let s = 0; s < spanSteps; s++) {
      for (let c = 0; c < chordSteps; c++) {
        const a = index(side, s, c), b = index(side, s + 1, c);
        const d = index(side, s, c + 1), e = index(side, s + 1, c + 1);
        const u = 0.5 - 0.5 * Math.cos(Math.PI * (c + 0.5) / chordSteps);
        const target = u < (fan ? 0.018 : 0.06) ? edgeIndices : bodyIndices;
        if (side === 0) target.push(a, b, d, b, e, d);
        else target.push(a, d, b, b, d, e);
      }
    }
  }
  // Root and tip closures give the blade a real edge silhouette.
  for (const s of [0, spanSteps]) {
    for (let c = 0; c < chordSteps; c++) {
      const a = index(0, s, c), b = index(0, s, c + 1);
      const d = index(1, s, c), e = index(1, s, c + 1);
      if (s === 0) bodyIndices.push(a, b, d, b, e, d);
      else bodyIndices.push(a, d, b, b, d, e);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex([...bodyIndices, ...edgeIndices]);
  geometry.addGroup(0, bodyIndices.length, 0);
  geometry.addGroup(bodyIndices.length, edgeIndices.length, 1);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/** Perforated liner with actual open holes, mapped around a cylinder. */
function perforatedLiner(radius, z0, z1, start, arc, columns, rows) {
  const positions = [], indices = [], uv = [];
  const holePoints = 12;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const a0 = start + arc * col / columns;
      const da = arc / columns;
      const az = z0 + (z1 - z0) * row / rows;
      const dz = (z1 - z0) / rows;
      const first = positions.length / 3;
      for (let ring = 0; ring < 2; ring++) {
        for (let p = 0; p < holePoints; p++) {
          const angle = p / holePoints * TAU;
          const ca = Math.cos(angle), sa = Math.sin(angle);
          const square = 1 / Math.max(Math.abs(ca), Math.abs(sa));
          const x = ring === 0 ? ca * square * 0.5 : ca * 0.18;
          const y = ring === 0 ? sa * square * 0.5 : sa * 0.155;
          const theta = a0 + da * (0.5 + x);
          const z = az + dz * (0.5 + y);
          positions.push(radius * Math.cos(theta), radius * Math.sin(theta), z);
          uv.push(theta / TAU * 5, z * 2);
        }
      }
      for (let p = 0; p < holePoints; p++) {
        const q = (p + 1) % holePoints;
        indices.push(first + p, first + q, first + holePoints + p);
        indices.push(first + q, first + holePoints + q, first + holePoints + p);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function detailTexture(kind, size = 128) {
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const hash = ((x * 15731 + y * 789221) ^ (x * y * 1376312589)) >>> 0;
      const noise = (hash % 23) - 11;
      let value;
      if (kind === 'carbon') {
        const alternate = (Math.floor(x / 8) + Math.floor(y / 8)) % 2;
        value = 218 + 17 * Math.cos((alternate ? x : y) * Math.PI / 4) + noise * 0.3;
      } else if (kind === 'ablated') {
        // Subtle cool oxide / warm heat-stain mottling, baked into the metal.
        // The working flame supplies illumination rather than a flat orange fill.
        const u = x / size * TAU, v = y / size * TAU;
        const stain = clamp01(0.48 + 0.27 * Math.sin(u * 3 + Math.sin(v * 2)) + 0.18 * Math.cos(v * 5 + Math.sin(u * 2)));
        const patina = 0.76 + 0.19 * Math.sin(u * 7 + 0.7 * Math.cos(v * 4)) * Math.sin(v * 3 + 0.5 * Math.sin(u * 5));
        const cool = [149, 163, 170], warm = [158, 148, 136];
        for (let channel = 0; channel < 3; channel++) {
          pixels[i + channel] = Math.round((cool[channel] + (warm[channel] - cool[channel]) * stain) * patina + noise * 0.28);
        }
        pixels[i + 3] = 255;
        continue;
      } else {
        value = 159 + 34 * Math.sin(y * 6.37) + 14 * Math.cos(y * 2.97) + noise * 0.5;
      }
      pixels[i] = pixels[i + 1] = pixels[i + 2] = Math.round(value);
      pixels[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

export function createEngine({ quality = 'high' } = {}) {
  const high = quality === 'high';
  const low = quality === 'low';
  const radial = high ? 96 : low ? 48 : 72;
  const group = new THREE.Group();
  group.name = 'THRUST — original twin-spool turbofan';
  const parts = {};
  const rotors = [];
  const shells = [];
  const stages = [];
  const textures = [detailTexture('carbon'), detailTexture('machined'), detailTexture('ablated')];
  const [carbonTexture, machinedTexture, linerTexture] = textures;
  linerTexture.colorSpace = THREE.SRGBColorSpace;
  linerTexture.repeat.set(2, 3);
  const materials = {
    titanium: new THREE.MeshStandardMaterial({ color: 0x818e96, metalness: 0.94, roughness: 0.36, bumpMap: machinedTexture, bumpScale: 0.004 }),
    polished: new THREE.MeshStandardMaterial({ color: 0xbbc6c9, metalness: 1, roughness: 0.25 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x485962, metalness: 0.94, roughness: 0.41, bumpMap: machinedTexture, bumpScale: 0.003 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x101a20, metalness: 0.80, roughness: 0.44 }),
    spinner: new THREE.MeshPhysicalMaterial({ color: 0x0f171c, metalness: 0.68, roughness: 0.30, clearcoat: 0.12, clearcoatRoughness: 0.36 }),
    carbon: new THREE.MeshPhysicalMaterial({ color: 0x0e1519, metalness: 0.32, roughness: 0.43, map: carbonTexture, bumpMap: carbonTexture, bumpScale: 0.0015, clearcoat: 0.16, clearcoatRoughness: 0.48 }),
    acoustic: new THREE.MeshStandardMaterial({ color: 0x080d10, metalness: 0.18, roughness: 0.78, bumpMap: carbonTexture, bumpScale: 0.006 }),
    nickel: new THREE.MeshStandardMaterial({ color: 0x82715e, metalness: 0.94, roughness: 0.42, bumpMap: machinedTexture, bumpScale: 0.003 }),
    ceramic: new THREE.MeshStandardMaterial({ color: 0xb2a48c, metalness: 0.35, roughness: 0.51 }),
    liner: new THREE.MeshStandardMaterial({ color: 0x454d53, metalness: 0.82, roughness: 0.63, map: linerTexture, bumpMap: linerTexture, bumpScale: 0.003, side: THREE.DoubleSide, emissive: 0x2a0d03, emissiveMap: linerTexture, emissiveIntensity: 0 }),
    lp: new THREE.MeshStandardMaterial({ color: 0x93aeb3, metalness: 0.97, roughness: 0.23, emissive: 0x3f9cae, emissiveIntensity: 0 }),
    hp: new THREE.MeshStandardMaterial({ color: 0xb89c68, metalness: 0.94, roughness: 0.28, emissive: 0xc68230, emissiveIntensity: 0 }),
    marking: new THREE.MeshStandardMaterial({ color: 0xd5ddd9, metalness: 0.66, roughness: 0.34 }),
  };

  function part(name) {
    const g = new THREE.Group();
    g.name = name;
    group.add(g);
    parts[name] = g;
    return g;
  }
  function mesh(parent, geometry, material, name) {
    const object = new THREE.Mesh(geometry, material);
    object.name = name || 'Machined component';
    parent.add(object);
    return object;
  }
  function solid(parent, profile, material, name, start = 0, arc = TAU) {
    const maxRadius = Math.max(...profile.map((p) => p[0]));
    const detail = maxRadius > 1.5 ? radial : maxRadius > 0.70 ? radial * 2 / 3 : maxRadius > 0.20 ? radial / 2 : radial / 4;
    return mesh(parent, revolved(profile, Math.max(12, Math.round(detail * arc / TAU)), start, arc), material, name);
  }
  function ring(parent, radius, tube, z, material = materials.polished, start = 0, arc = TAU) {
    const detail = radius > 1.5 ? radial : radius > 0.70 ? radial * 2 / 3 : radius > 0.25 ? radial / 2 : radial / 4;
    const torus = mesh(parent, new THREE.TorusGeometry(radius, tube, tube < 0.019 ? 5 : high ? 7 : 6, Math.max(12, Math.round(detail * arc / TAU)), arc), material, 'Turned retaining ring');
    torus.rotation.z = start;
    torus.position.z = z;
    return torus;
  }
  function boltRing(parent, count, radius, z, size = 0.02, start = 0, arc = TAU, radialHeads = false) {
    const geometry = new THREE.CylinderGeometry(size, size, size * 0.8, 6);
    geometry.rotateX(Math.PI / 2);
    const bolts = new THREE.InstancedMesh(geometry, materials.polished, count);
    bolts.name = 'Captive titanium fasteners';
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < count; i++) {
      const angle = start + (i + 0.5) / count * arc;
      position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
      if (radialHeads) quaternion.setFromUnitVectors(Z_AXIS, new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0));
      else quaternion.setFromAxisAngle(Z_AXIS, angle);
      matrix.compose(position, quaternion, scale);
      bolts.setMatrixAt(i, matrix);
    }
    bolts.instanceMatrix.needsUpdate = true;
    parent.add(bolts);
    return bolts;
  }
  function bladeRow(parent, options, count, material, edgeMaterial, phase = 0) {
    const geometry = airfoil(options);
    const blades = new THREE.InstancedMesh(geometry, [material, edgeMaterial || material], count);
    blades.name = `${count} ${options.fan ? 'swept composite fan' : 'cambered aerofoil'} blades`;
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      matrix.makeRotationZ(TAU * i / count + phase);
      blades.setMatrixAt(i, matrix);
    }
    blades.instanceMatrix.needsUpdate = true;
    parent.add(blades);
    return blades;
  }

  // Every removable shell is a solid sector with thickness and machined cut edges.
  const sectorStarts = [-Math.PI / 6, Math.PI / 2, 7 * Math.PI / 6];
  const sectorArc = TAU / 3 - 0.007;
  function sectorShell(parent, profile, material, { outer = false, sequence = 0, flange = true, name = 'Segmented casing' } = {}) {
    const z0 = Math.min(...profile.map((p) => p[1]));
    const z1 = Math.max(...profile.map((p) => p[1]));
    for (let i = 0; i < 3; i++) {
      const start = sectorStarts[i] + 0.0035;
      const shell = new THREE.Group();
      shell.name = `${name} / ${i === 2 ? 'retained lower sector' : 'retracting upper sector'}`;
      parent.add(shell);
      solid(shell, profile, material, name, start, sectorArc);
      if (flange) {
        const r0 = Math.max(...profile.filter((p) => Math.abs(p[1] - z0) < 0.001).map((p) => p[0]));
        const r1 = Math.max(...profile.filter((p) => Math.abs(p[1] - z1) < 0.001).map((p) => p[0]));
        ring(shell, r0, outer ? 0.022 : 0.015, z0 + 0.016, materials.polished, start, sectorArc);
        ring(shell, r1, outer ? 0.018 : 0.013, z1 - 0.016, materials.steel, start, sectorArc);
        boltRing(shell, outer ? 16 : 9, r0 + 0.005, z0 + 0.075, outer ? 0.015 : 0.012, start, sectorArc, true);
        if (outer) boltRing(shell, 16, r1 + 0.005, z1 - 0.065, 0.015, start, sectorArc, true);
      }
      const axial = ({ booster: -0.50, hpc: 0.76, hpt: 2.085, lpt: 2.93 })[parent.name] || 0;
      shells.push({ object: shell, angle: start + sectorArc / 2, lower: i === 2, outer, sequence, axial, family: parent.name, base: shell.position.clone() });
    }
  }

  const inlet = part('inlet');
  solid(inlet, [
    [2.165, -0.39], [2.153, -0.67], [2.165, -0.84], [2.198, -0.938],
    [2.247, -0.973], [2.294, -0.934], [2.342, -0.825], [2.376, -0.65],
    [2.382, -0.46], [2.366, -0.30], [2.315, -0.29], [2.165, -0.39],
  ], materials.polished, 'Anti-icing titanium inlet lip');
  ring(inlet, 2.364, 0.012, -0.322, materials.dark);
  boltRing(inlet, high ? 72 : 48, 2.36, -0.31, 0.012, 0, TAU, true);
  sectorShell(inlet, [[2.158, -0.56], [2.179, -0.56], [2.179, 0.35], [2.158, 0.35], [2.158, -0.56]], materials.acoustic, { outer: true, flange: false, name: 'Acoustic inlet liner' });

  const fan = part('fan');
  const fanRotor = new THREE.Group();
  fanRotor.name = 'LP spool / 22 blade fan rotor';
  fan.add(fanRotor);
  rotors.push({ object: fanRotor, spool: 'lp', phase: 0 });
  bladeRow(fanRotor, {
    root: 0.48, tip: 2.10, fan: true, pitchRoot: 1.16, pitchTip: 0.46,
    sweep: 0.29, lean: 0.105, thickness: 0.063, camber: 0.055,
    spanSteps: high ? 24 : low ? 14 : 18, chordSteps: high ? 20 : 14,
  }, 22, materials.carbon, materials.polished);
  solid(fanRotor, [[0.128, -0.13], [0.48, -0.13], [0.535, -0.025], [0.535, 0.17], [0.48, 0.23], [0.128, 0.23], [0.128, -0.13]], materials.titanium, 'Forged fan disk');
  solid(fanRotor, [
    [0.01, -0.90], [0.064, -0.883], [0.146, -0.81], [0.26, -0.645],
    [0.355, -0.462], [0.425, -0.27], [0.478, -0.075], [0.48, 0.04],
    [0.12, 0.04], [0.01, -0.90],
  ], materials.spinner, 'Original ogive spinner');
  ring(fanRotor, 0.477, 0.012, -0.02, materials.steel);
  boltRing(fanRotor, 22, 0.50, 0.185, 0.014);
  // A restrained one-and-a-half-turn inspection mark, drawn on this spinner's surface.
  const spiralPoints = [];
  for (let i = 0; i <= 96; i++) {
    const s = i / 96;
    const z = -0.87 + s * 0.80;
    const spinnerStations = [[-0.90, 0.01], [-0.883, 0.064], [-0.81, 0.146], [-0.645, 0.26], [-0.462, 0.355], [-0.27, 0.425], [-0.075, 0.478], [0.04, 0.48]];
    let radius = 0.48;
    for (let j = 0; j < spinnerStations.length - 1; j++) {
      const a = spinnerStations[j], b = spinnerStations[j + 1];
      if (z >= a[0] && z <= b[0]) {
        radius = THREE.MathUtils.lerp(a[1], b[1], (z - a[0]) / (b[0] - a[0])) + 0.006;
        break;
      }
    }
    const angle = s * TAU * 1.40;
    spiralPoints.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, z));
  }
  mesh(fanRotor, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spiralPoints), high ? 100 : 64, 0.009, 5, false), materials.marking, 'Spinner rotation witness spiral');

  const bypass = part('bypass');
  const outletGuide = new THREE.Group();
  outletGuide.position.z = 0.79;
  bypass.add(outletGuide);
  bladeRow(outletGuide, { root: 1.075, tip: 2.116, chord: 0.31, chordTip: 0.25, pitchRoot: -0.82, pitchTip: -0.54, sweep: -0.08, lean: 0.06, camber: -0.065, spanSteps: high ? 13 : 8, chordSteps: 9 }, 38, materials.steel, materials.titanium, 0.016);
  ring(bypass, 2.14, 0.032, 0.80, materials.titanium);
  ring(bypass, 1.084, 0.027, 0.78, materials.polished);
  solid(bypass, [[0.99, 0.60], [1.035, 0.61], [1.104, 0.79], [1.118, 1.02], [1.083, 1.29], [1.045, 1.29], [1.055, 0.98], [1.027, 0.77], [0.99, 0.60]], materials.titanium, 'Rounded core / bypass splitter');
  const fanFrame = new THREE.Group();
  fanFrame.position.z = 1.21;
  bypass.add(fanFrame);
  bladeRow(fanFrame, { root: 1.09, tip: 2.12, chord: 0.39, chordTip: 0.33, pitchRoot: 1.45, pitchTip: 1.45, sweep: 0.018, lean: 0, thickness: 0.12, camber: 0.01, spanSteps: 6, chordSteps: 8 }, 7, materials.titanium, materials.polished, 0.20);

  const lpShaft = part('lpShaft');
  solid(lpShaft, [[0.06, -0.16], [0.119, -0.16], [0.119, 10.90], [0.06, 10.90], [0.06, -0.16]], materials.lp, 'Continuous inner LP shaft / fan + booster + LPT');
  for (const z of [0.24, 1.30, 2.10, 8.81, 10.81]) ring(lpShaft, 0.124, 0.010, z, materials.polished);
  const hpShaft = part('hpShaft');
  solid(hpShaft, [[0.155, 2.46], [0.229, 2.46], [0.245, 2.52], [0.245, 8.39], [0.23, 8.48], [0.155, 8.48], [0.155, 2.46]], materials.hp, 'Hollow outer HP shaft / HPC + HPT');
  ring(hpShaft, 0.246, 0.012, 2.54, materials.polished);
  ring(hpShaft, 0.246, 0.012, 8.38, materials.polished);

  function compressorStage(parent, index, z, radius, hub, spool, offset) {
    const stage = new THREE.Group();
    stage.position.z = z;
    stage.name = `${spool === 'lp' ? 'LP booster' : 'HP compressor'} / stage ${index + 1}`;
    parent.add(stage);
    stages.push({ object: stage, z, sequence: spool === 'lp' ? 0.28 : 0.36 + index * 0.014, distance: offset });
    const rotor = new THREE.Group();
    rotor.name = `${spool.toUpperCase()} rotating disk + blade row`;
    stage.add(rotor);
    rotors.push({ object: rotor, spool, phase: index * 0.041 });
    const shaftRadius = spool === 'lp' ? 0.12 : 0.245;
    solid(rotor, [[shaftRadius, -0.075], [hub * 0.82, -0.075], [hub, -0.035], [hub, 0.047], [hub * 0.83, 0.09], [shaftRadius, 0.09], [shaftRadius, -0.075]], spool === 'lp' ? materials.titanium : materials.steel, 'Balanced forged compressor disk');
    ring(rotor, hub - 0.017, 0.016, -0.034, materials.polished);
    boltRing(rotor, spool === 'lp' ? 14 : 12, hub * 0.76, -0.077, 0.011);
    const count = spool === 'lp' ? 28 + index * 3 : 34 + index * 2;
    bladeRow(rotor, {
      root: hub - 0.005, tip: radius - 0.012, chord: spool === 'lp' ? 0.23 : 0.177,
      chordTip: spool === 'lp' ? 0.18 : 0.14, pitchRoot: 0.93, pitchTip: 0.54,
      sweep: 0.065, lean: 0.017, thickness: 0.074, camber: 0.074,
      spanSteps: high ? 7 : 5, chordSteps: high ? 8 : 6,
    }, count, index % 3 === 1 ? materials.titanium : materials.steel, materials.polished);
    const stator = new THREE.Group();
    stator.position.z = spool === 'lp' ? 0.23 : 0.18;
    stator.name = 'Fixed diffusion stator / does not rotate';
    stage.add(stator);
    bladeRow(stator, {
      root: hub + 0.015, tip: radius - 0.001, chord: spool === 'lp' ? 0.17 : 0.13,
      chordTip: spool === 'lp' ? 0.15 : 0.112, pitchRoot: -0.7, pitchTip: -0.43,
      sweep: -0.028, lean: -0.004, thickness: 0.07, camber: -0.07,
      spanSteps: high ? 6 : 4, chordSteps: high ? 7 : 5,
    }, count + 3, materials.titanium, materials.polished, 0.023);
    ring(stage, radius + 0.014, 0.019, 0.17, materials.steel);
    ring(stage, radius + 0.014, 0.014, -0.08, materials.titanium);
    return stage;
  }

  const booster = part('booster');
  for (let i = 0; i < 3; i++) compressorStage(booster, i, 1.15 + i * 0.45, 1.05 - i * 0.045, 0.50 + i * 0.017, 'lp', -0.72 + i * 0.11);
  sectorShell(booster, [[1.08, 1.02], [1.12, 1.02], [1.027, 2.42], [0.985, 2.42], [1.08, 1.02]], materials.dark, { sequence: 0.22, name: 'Booster casing' });
  const hpc = part('hpc');
  for (let i = 0; i < 9; i++) compressorStage(hpc, i, 2.65 + i * 0.37, 0.94 - i * 0.01375, 0.56 + i * 0.015, 'hp', 0.08 + i * 0.17);
  sectorShell(hpc, [[0.966, 2.49], [1.008, 2.49], [0.902, 5.96], [0.852, 5.96], [0.966, 2.49]], materials.steel, { sequence: 0.31, name: 'Tapered high-pressure casing' });
  for (let z = 2.72; z < 5.85; z += 0.37) {
    // Discrete split case ribs reveal how the long casing is assembled.
    const r = 1.0 - (z - 2.49) / 3.47 * 0.106;
    sectorShell(hpc, [[r, z], [r + 0.025, z], [r + 0.024, z + 0.037], [r, z + 0.037], [r, z]], materials.titanium, { sequence: 0.31, flange: false, name: 'Compressor case rib' });
  }

  const combustor = part('combustor');
  sectorShell(combustor, [[0.53, 5.96], [0.99, 5.96], [1.024, 6.07], [0.98, 6.14], [0.55, 6.14], [0.53, 5.96]], materials.nickel, { sequence: 0.51, flange: false, name: 'Annular combustor dome' });
  // The centre remains an annulus; fuel heads never occupy the shaft volume.
  for (let i = 0; i < 18; i++) {
    const theta = i / 18 * TAU;
    const injector = new THREE.Group();
    injector.name = 'Fixed air-blast fuel swirler';
    injector.position.set(Math.cos(theta) * 0.80, Math.sin(theta) * 0.80, 6.17);
    combustor.add(injector);
    solid(injector, [[0.021, -0.057], [0.058, -0.057], [0.064, -0.014], [0.05, 0.044], [0.021, 0.052], [0.021, -0.057]], materials.polished, 'Fuel swirler head');
    ring(injector, 0.043, 0.007, 0.036, materials.dark);
  }
  for (let i = 0; i < 3; i++) {
    const start = sectorStarts[i] + 0.0035;
    const liner = new THREE.Group();
    liner.name = 'Perforated annular combustor liner';
    combustor.add(liner);
    mesh(liner, perforatedLiner(0.984, 6.17, 7.43, start, sectorArc, high ? 16 : 11, high ? 9 : 6), materials.liner, 'Real dilution / cooling apertures');
    ring(liner, 0.985, 0.017, 6.17, materials.nickel, start, sectorArc);
    ring(liner, 0.985, 0.017, 7.43, materials.nickel, start, sectorArc);
    for (const z of [6.46, 6.77, 7.10]) ring(liner, 0.990, 0.008, z, materials.steel, start, sectorArc);
    shells.push({ object: liner, angle: start + sectorArc / 2, lower: i === 2, outer: false, sequence: 0.53, base: liner.position.clone() });
  }
  solid(combustor, [[0.52, 6.12], [0.547, 6.12], [0.573, 7.43], [0.548, 7.43], [0.52, 6.12]], materials.liner, 'Inner annular liner');
  sectorShell(combustor, [[1.029, 6.02], [1.078, 6.02], [1.087, 6.31], [1.079, 7.33], [1.034, 7.53], [0.995, 7.53], [1.025, 7.32], [1.029, 6.02]], materials.nickel, { sequence: 0.51, name: 'Combustor pressure casing' });
  ring(combustor, 1.087, 0.021, 6.30, materials.steel);
  ring(combustor, 1.055, 0.027, 7.48, materials.polished);

  function turbineStage(parent, index, z, radius, hub, spool, distance) {
    const stage = new THREE.Group();
    stage.position.z = z;
    stage.name = `${spool.toUpperCase()} turbine stage ${index + 1}`;
    parent.add(stage);
    stages.push({ object: stage, z, sequence: spool === 'hp' ? 0.61 + index * 0.018 : 0.68 + index * 0.022, distance });
    // Nozzle guide vanes precede, rather than follow, each work-extracting rotor.
    const guide = new THREE.Group();
    guide.position.z = -0.205;
    guide.name = 'Stationary nozzle guide vanes';
    stage.add(guide);
    bladeRow(guide, {
      root: hub + 0.014, tip: radius, chord: 0.18, chordTip: 0.16,
      pitchRoot: -0.91, pitchTip: -0.69, sweep: -0.045, lean: -0.006,
      thickness: 0.095, camber: -0.104, spanSteps: high ? 7 : 5, chordSteps: high ? 8 : 6,
    }, spool === 'hp' ? 41 : 39 + index * 2, materials.ceramic, materials.nickel, 0.016);
    ring(guide, radius + 0.012, 0.021, 0, materials.nickel);
    const rotor = new THREE.Group();
    rotor.name = `${spool.toUpperCase()} power turbine rotor`;
    stage.add(rotor);
    rotors.push({ object: rotor, spool, phase: 0.03 + index * 0.033 });
    const shaftRadius = spool === 'hp' ? 0.245 : 0.119;
    solid(rotor, [[shaftRadius, -0.076], [hub * 0.76, -0.076], [hub, -0.028], [hub, 0.048], [hub * 0.83, 0.098], [shaftRadius, 0.098], [shaftRadius, -0.076]], materials.nickel, 'Nickel superalloy turbine disk');
    ring(rotor, hub - 0.018, 0.019, -0.03, materials.polished);
    bladeRow(rotor, {
      root: hub - 0.006, tip: radius - 0.016, chord: spool === 'hp' ? 0.22 : 0.24,
      chordTip: spool === 'hp' ? 0.185 : 0.205, pitchRoot: 1.05, pitchTip: 0.73,
      sweep: 0.072, lean: 0.01, thickness: 0.097, camber: 0.12,
      spanSteps: high ? 9 : 6, chordSteps: high ? 9 : 7,
    }, spool === 'hp' ? 40 + index * 4 : 42 + index * 2, materials.nickel, materials.ceramic);
    boltRing(rotor, 12, hub * 0.72, -0.08, 0.012);
    ring(stage, radius + 0.016, 0.018, 0.085, materials.titanium);
    return stage;
  }

  const hpt = part('hpt');
  for (let i = 0; i < 2; i++) turbineStage(hpt, i, 7.90 + i * 0.45, 0.96 + i * 0.025, 0.65 - i * 0.015, 'hp', 1.97 + i * 0.23);
  sectorShell(hpt, [[0.988, 7.60], [1.037, 7.60], [1.062, 8.59], [1.015, 8.59], [0.988, 7.60]], materials.nickel, { sequence: 0.60, name: 'High-pressure turbine casing' });
  const lpt = part('lpt');
  for (let i = 0; i < 5; i++) turbineStage(lpt, i, 8.95 + i * 0.44, 1.00 + i * 0.035, 0.61 - i * 0.022, 'lp', 2.51 + i * 0.21);
  sectorShell(lpt, [[1.022, 8.66], [1.075, 8.66], [1.231, 10.92], [1.18, 10.92], [1.022, 8.66]], materials.steel, { sequence: 0.67, name: 'Low-pressure turbine casing' });

  const nozzle = part('nozzle');
  const rearFrame = new THREE.Group();
  rearFrame.position.z = 11.00;
  nozzle.add(rearFrame);
  bladeRow(rearFrame, { root: 0.31, tip: 1.10, chord: 0.25, chordTip: 0.20, pitchRoot: 1.43, pitchTip: 1.43, sweep: 0.02, lean: 0, thickness: 0.12, camber: 0.01, spanSteps: 6, chordSteps: 8 }, 8, materials.steel, materials.titanium, 0.19);
  ring(nozzle, 1.12, 0.037, 11.0, materials.polished);
  sectorShell(nozzle, [[1.13, 11.05], [1.19, 11.05], [1.08, 11.21], [0.708, 12.16], [0.66, 12.16], [1.05, 11.2], [1.13, 11.05]], materials.nickel, { sequence: 0.83, name: 'Convergent core nozzle' });
  solid(nozzle, [[0.118, 10.86], [0.405, 10.86], [0.407, 11.15], [0.348, 11.63], [0.206, 12.10], [0.025, 12.46], [0.008, 12.46], [0.118, 10.86]], materials.dark, 'Exhaust centrebody / LP bearing fairing');
  ring(nozzle, 0.406, 0.009, 11.14, materials.steel);

  const nacelle = part('nacelle');
  sectorShell(nacelle, [[2.174, -0.30], [2.366, -0.30], [2.385, 0.22], [2.358, 1.66], [2.16, 1.66], [2.174, -0.30]], materials.carbon, { outer: true, sequence: 0.0, name: 'Composite fan cowl' });
  sectorShell(nacelle, [[2.11, 1.69], [2.354, 1.69], [2.296, 2.72], [2.205, 4.55], [2.06, 4.55], [2.11, 1.69]], materials.carbon, { outer: true, sequence: 0.035, name: 'Forward bypass sleeve' });
  sectorShell(nacelle, [[2.045, 4.59], [2.20, 4.59], [2.05, 6.62], [1.945, 7.23], [1.835, 7.23], [2.045, 4.59]], materials.dark, { outer: true, sequence: 0.065, name: 'Aft composite bypass sleeve' });
  sectorShell(nacelle, [[1.825, 7.27], [1.94, 7.27], [1.82, 8.56], [1.72, 9.50], [1.665, 9.50], [1.72, 8.65], [1.825, 7.27]], materials.steel, { outer: true, sequence: 0.10, name: 'Separate cold bypass nozzle' });

  // Fine fixed pipes on the visible lower core create a functional external scale.
  const plumbing = new THREE.Group();
  plumbing.name = 'Fixed lower-core service lines';
  group.add(plumbing);
  parts.frames = plumbing;
  for (let i = 0; i < 4; i++) {
    const angle = Math.PI * 1.28 + i * 0.15;
    const points = [
      [1.045, 2.47], [1.07, 2.80], [1.016, 4.20], [1.01, 5.60], [1.145, 6.03], [1.15, 7.08],
    ].map(([r, z]) => new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r, z));
    mesh(plumbing, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), high ? 60 : 36, i === 0 ? 0.019 : 0.011, 6, false), i === 0 ? materials.nickel : materials.titanium, 'Routed service pipe');
  }

  // Named pose metadata is shared with airflow and camera choreography.
  group.userData = {
    architecture: 'Original direct-drive twin-spool high-bypass turbofan',
    axis: '+Z downstream',
    fanBlades: 22,
    stageCounts: { booster: 3, hpc: 9, hpt: 2, lpt: 5 },
    assembledBounds: { min: [-2.40, -2.40, -0.98], max: [2.40, 2.40, 12.47] },
    explodedBounds: { min: [-5.60, -3.50, -2.63], max: [5.60, 4.26, 16.48] },
    stations: { inlet: -0.95, fan: 0, bypass: 0.79, booster: 1.60, hpc: 4.13, combustor: 6.76, hpt: 8.125, lpt: 9.83, nozzle: 11.65 },
  };

  function update(time = 0, { cutaway = 0, explode = 0, energy = 0, heat = 0, focus = 0 } = {}) {
    const t = Number.isFinite(time) ? time : 0;
    const c = clamp01(cutaway), e = clamp01(explode);
    const power = clamp01(energy), thermal = clamp01(heat);
    // Downstream blocks first travel together; each row then opens its own gap.
    // Independent delayed absolute offsets would push the combustor through the
    // still-closed turbine. These shared carries keep the entire passage ordered.
    // flow.js uses this exact mapping so light and air follow the actual parts.
    const burnerTravel = 1.63 * smooth(0.49, 0.70, e);
    const hpCarry = 0.34 * smooth(0.61, 0.89, e);
    const lpCarry = 0.88 * smooth(0.68, 0.96, e);
    const stageTravel = (sequence, distance) => {
      const opened = smooth(sequence, Math.min(1, sequence + 0.28), e);
      if (sequence >= 0.68) return burnerTravel + lpCarry + (distance - 2.51) * opened;
      if (sequence >= 0.60) return burnerTravel + hpCarry + (distance - 1.97) * opened;
      return distance * opened;
    };
    const hpMeanTravel = (stageTravel(0.61, 1.97) + stageTravel(0.628, 2.20)) / 2;
    let lpMeanTravel = 0;
    for (let i = 0; i < 5; i++) lpMeanTravel += stageTravel(0.68 + i * 0.022, 2.51 + i * 0.21) / 5;
    // A slower optical sample of two mechanically linked shafts: no stator motion.
    for (const rotor of rotors) rotor.object.rotation.z = t * (rotor.spool === 'lp' ? 0.72 : 1.49) + rotor.phase;
    lpShaft.rotation.z = t * 0.72;
    hpShaft.rotation.z = t * 1.49;
    fan.position.z = -1.72 * smooth(0.12, 0.39, e);
    inlet.position.z = -1.20 * smooth(0.08, 0.30, e);
    bypass.position.z = -0.57 * smooth(0.22, 0.43, e);
    combustor.position.z = burnerTravel;
    nozzle.position.z = burnerTravel + lpCarry + 1.48 * smooth(0.768, 1.0, e);
    plumbing.position.y = -0.64 * smooth(0.75, 0.95, e);
    plumbing.position.z = 0.52 * smooth(0.66, 0.95, e);
    for (const stage of stages) {
      stage.object.position.z = stage.z + stageTravel(stage.sequence, stage.distance);
    }
    const reveal = smooth(0.025, 0.93, c);
    for (const shell of shells) {
      const opened = smooth(shell.sequence, Math.min(1, shell.sequence + 0.29), e);
      const travel = shell.outer ? 3.35 : 1.80;
      const d = shell.lower ? opened * (shell.outer ? 1.08 : 0.34) : Math.max(reveal * travel, opened * travel * 1.10);
      const nearUpper = !shell.lower && Math.cos(shell.angle) < 0;
      const axialTravel = shell.family === 'hpt' ? hpMeanTravel + 0.18 * opened
        : shell.family === 'lpt' ? lpMeanTravel + 0.18 * opened
        : ((shell.outer ? 0.30 : 0.18) + (shell.axial || 0)) * opened;
      shell.object.position.set(
        shell.base.x + Math.cos(shell.angle) * d * (nearUpper ? 0.18 : 1),
        shell.base.y + (nearUpper ? d * 2.8 : Math.sin(shell.angle) * d),
        shell.base.z + axialTravel,
      );
      // The near-side upper shell lifts clear rather than moving toward the lens.
      // Keep it withdrawn for the exploded hold: the far arch and lower cradle
      // frame the mechanism without placing a large opaque lid in front of it.
      const nearWithdrawn = nearUpper && (c >= 0.94 || opened > 0.25);
      shell.object.visible = !nearWithdrawn && (shell.lower || c < 0.94 || e > 0.045);
    }
    materials.liner.emissiveIntensity = thermal * 0.05;
    materials.nickel.emissive.setRGB(thermal * 0.08, thermal * 0.014, thermal * 0.0015);
    materials.lp.emissiveIntensity = power * 0.52;
    materials.hp.emissiveIntensity = power * 0.60;
    group.userData.focus = focus;
  }

  update(0);
  const geometrySet = new Set();
  let triangles = 0, meshes = 0, instances = 0;
  group.traverse((object) => {
    if (!object.isMesh) return;
    meshes++;
    geometrySet.add(object.geometry);
    const count = object.isInstancedMesh ? object.count : 1;
    instances += count;
    triangles += (object.geometry.index ? object.geometry.index.count : object.geometry.attributes.position.count) / 3 * count;
  });
  const stats = {
    meshes, instances, triangles: Math.round(triangles), geometries: geometrySet.size,
    fanBlades: 22, compressorRotors: 12, turbineRotors: 7,
    ...group.userData,
  };
  function dispose() {
    group.traverse((object) => { if (object.isInstancedMesh) object.dispose(); });
    for (const geometry of geometrySet) geometry.dispose();
    for (const material of Object.values(materials)) material.dispose();
    for (const texture of textures) texture.dispose();
  }
  return { group, update, parts, dispose, stats };
}
