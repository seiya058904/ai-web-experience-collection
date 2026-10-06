import * as THREE from 'three';

const TAU = Math.PI * 2;
const clamp = THREE.MathUtils.clamp;

// Monotone cubic interpolation keeps long painted surfaces fair and prevents
// overshoot at the small, swept tips. The first value in each station is axial.
function sample(stations, x, field) {
  const end = stations.length - 1;
  if (x <= stations[0][0]) return stations[0][field];
  if (x >= stations[end][0]) return stations[end][field];
  let i = 0;
  while (stations[i + 1][0] < x) i++;
  const derivative = (j) => {
    if (j === 0) return (stations[1][field] - stations[0][field]) / (stations[1][0] - stations[0][0]);
    if (j === end) return (stations[end][field] - stations[end - 1][field]) / (stations[end][0] - stations[end - 1][0]);
    const a = stations[j][0] - stations[j - 1][0];
    const b = stations[j + 1][0] - stations[j][0];
    const d0 = (stations[j][field] - stations[j - 1][field]) / a;
    const d1 = (stations[j + 1][field] - stations[j][field]) / b;
    if (d0 * d1 <= 0) return 0;
    const w0 = 2 * b + a;
    const w1 = b + 2 * a;
    return (w0 + w1) / (w0 / d0 + w1 / d1);
  };
  const a = stations[i];
  const b = stations[i + 1];
  const h = b[0] - a[0];
  const t = (x - a[0]) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * a[field]
    + (t3 - 2 * t2 + t) * h * derivative(i)
    + (-2 * t3 + 3 * t2) * b[field]
    + (t3 - t2) * h * derivative(i + 1);
}

function geometryFrom(positions, indices) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function smoothRingSeam(geometry, rows, ringSegments) {
  const normals = geometry.getAttribute('normal');
  const average = new THREE.Vector3();
  for (let row = 0; row <= rows; row++) {
    const a = row * (ringSegments + 1);
    const b = a + ringSegments;
    average.set(normals.getX(a) + normals.getX(b), normals.getY(a) + normals.getY(b), normals.getZ(a) + normals.getZ(b)).normalize();
    normals.setXYZ(a, average.x, average.y, average.z);
    normals.setXYZ(b, average.x, average.y, average.z);
  }
  normals.needsUpdate = true;
  return geometry;
}

const BODY = [
  [-7, 0.006, -0.035], [-6.89, 0.093, -0.03], [-6.64, 0.238, -0.015],
  [-6.27, 0.377, 0], [-5.79, 0.482, 0], [-5.14, 0.55, 0],
  [3.53, 0.55, 0], [4.25, 0.50, 0.012], [4.99, 0.403, 0.044],
  [5.73, 0.274, 0.105], [6.29, 0.155, 0.164], [6.77, 0.062, 0.204],
  [7, 0.012, 0.222],
];

function bodyRadius(z) {
  if (z < -5.14) {
    // An ellipsoidal radome has a rounded tangent at the nose, unlike a cone.
    const t = clamp((z + 7) / 1.86, 0, 1);
    return 0.55 * Math.sqrt(Math.max(0, 1 - (1 - t) ** 2));
  }
  return sample(BODY, z, 1);
}
function bodyCenter(z) { return sample(BODY, z, 2); }

function fuselageGeometry() {
  const positions = [];
  const indices = [];
  const axial = 112;
  const radial = 56;
  for (let i = 0; i <= axial; i++) {
    const z = -7 * Math.cos(Math.PI * i / axial);
    const radius = bodyRadius(z);
    const center = bodyCenter(z);
    for (let j = 0; j <= radial; j++) {
      const angle = TAU * j / radial;
      positions.push(Math.sin(angle) * radius, center + Math.cos(angle) * radius, z);
      if (i < axial && j < radial) {
        const a = i * (radial + 1) + j;
        const b = a + radial + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  for (const [row, reverse] of [[0, false], [axial, true]]) {
    const z = row ? 7 : -7;
    const centerIndex = positions.length / 3;
    positions.push(0, bodyCenter(z), z);
    for (let j = 0; j < radial; j++) {
      const a = row * (radial + 1) + j;
      if (reverse) indices.push(centerIndex, a + 1, a);
      else indices.push(centerIndex, a, a + 1);
    }
  }
  return smoothRingSeam(geometryFrom(positions, indices), axial, radial);
}

// span, leading-edge Z, chord, height, thickness/chord, incidence (degrees).
const WING = [
  [0.36, -1.14, 3.54, -0.175, 0.118, 2.0],
  [0.94, -1.06, 3.23, -0.155, 0.111, 1.8],
  [2.2, -0.53, 2.46, -0.065, 0.105, 1.35],
  [3.3, 0.13, 1.94, 0.075, 0.096, 0.8],
  [4.8, 1.06, 1.39, 0.315, 0.086, 0.15],
  [6.2, 1.99, 0.92, 0.584, 0.077, -0.7],
  [7.26, 2.75, 0.49, 0.885, 0.071, -1.4],
  [7.78, 3.2, 0.255, 1.185, 0.061, -1.9],
  [8.04, 3.48, 0.037, 1.452, 0.051, -2.2],
];

const TAIL = [
  [0.25, 4.29, 1.80, 0.18, 0.105, 0],
  [0.72, 4.48, 1.54, 0.21, 0.095, -0.2],
  [1.66, 5.14, 0.98, 0.32, 0.084, -0.5],
  [2.61, 5.84, 0.42, 0.44, 0.076, -0.8],
  [3.05, 6.22, 0.055, 0.505, 0.067, -1],
];

const FIN = [
  [0, 4.08, 2.36, 0, 0.13, 0],
  [0.31, 4.24, 2.07, 0, 0.12, 0],
  [0.92, 4.75, 1.48, 0, 0.105, 0],
  [1.63, 5.33, 0.84, 0, 0.087, 0],
  [1.93, 5.61, 0.53, 0, 0.076, 0],
];

function airfoilPoint(stations, span, angle, side = 1, lift = 0) {
  const leading = sample(stations, span, 1);
  const chord = sample(stations, span, 2);
  const height = sample(stations, span, 3);
  const thickness = sample(stations, span, 4);
  const incidence = sample(stations, span, 5) * Math.PI / 180;
  const u = (1 - Math.cos(angle)) * 0.5;
  const yt = 5 * thickness * chord * (
    0.2969 * Math.sqrt(u) - 0.126 * u - 0.3516 * u ** 2
    + 0.2843 * u ** 3 - 0.1036 * u ** 4
  );
  const upper = Math.sin(angle) >= 0 ? 1 : -1;
  const camber = stations === FIN ? 0 : 0.014 * chord * 4 * u * (1 - u);
  const y = height + upper * (yt + lift) + camber + Math.tan(incidence) * chord * (0.25 - u);
  return [side * span, y, leading + u * chord];
}

function airfoilGeometry(stations, side = 1, leadingEdgeOnly = false) {
  const spanSteps = stations === WING ? 56 : 32;
  const roundSteps = leadingEdgeOnly ? 10 : 48;
  const positions = [];
  const indices = [];
  const begin = stations[0][0];
  const extent = stations.at(-1)[0] - begin;
  for (let i = 0; i <= spanSteps; i++) {
    const span = begin + extent * i / spanSteps;
    for (let j = 0; j <= roundSteps; j++) {
      const angle = leadingEdgeOnly ? -0.34 + 0.68 * j / roundSteps : TAU * j / roundSteps;
      positions.push(...airfoilPoint(stations, span, angle, side, leadingEdgeOnly ? 0.0013 : 0));
      if (i < spanSteps && j < roundSteps) {
        const a = i * (roundSteps + 1) + j;
        const b = a + roundSteps + 1;
        if (side === 1) indices.push(a, a + 1, b, a + 1, b + 1, b);
        else indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  if (!leadingEdgeOnly) {
    for (const row of [0, spanSteps]) {
      const span = row === 0 ? begin : begin + extent;
      const center = positions.length / 3;
      positions.push(side * span, sample(stations, span, 3), sample(stations, span, 1) + sample(stations, span, 2) * 0.5);
      const reverse = (row === 0) === (side === 1);
      for (let j = 0; j < roundSteps; j++) {
        const a = row * (roundSteps + 1) + j;
        if (reverse) indices.push(center, a, a + 1);
        else indices.push(center, a + 1, a);
      }
    }
  }
  const geometry = geometryFrom(positions, indices);
  return leadingEdgeOnly ? geometry : smoothRingSeam(geometry, spanSteps, roundSteps);
}

function roundedRectangle(width, height, radius) {
  const x = -width / 2;
  const y = -height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

function cockpitGeometry(side, z0, z1, angle0, angle1) {
  const positions = [];
  const indices = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    for (let j = 0; j <= 5; j++) {
      const v = j / 5;
      const z = THREE.MathUtils.lerp(z0 + 0.085 * v, z1 - 0.018 * v, t);
      const angle = THREE.MathUtils.lerp(angle0 + t * 0.10, angle1 + t * 0.065, v);
      const radius = bodyRadius(z) + 0.0024;
      positions.push(side * Math.sin(angle) * radius, bodyCenter(z) + Math.cos(angle) * radius, z);
      if (i < 8 && j < 5) {
        const a = i * 6 + j;
        if (side === 1) indices.push(a, a + 6, a + 1, a + 1, a + 6, a + 7);
        else indices.push(a, a + 1, a + 6, a + 1, a + 7, a + 6);
      }
    }
  }
  return geometryFrom(positions, indices);
}

function latheAlongZ(profile, segments = 48) {
  const geometry = new THREE.LatheGeometry(profile.map(([z, radius]) => new THREE.Vector2(radius, z)), segments);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

function fanBladeGeometry() {
  const positions = [];
  const indices = [];
  for (let i = 0; i <= 10; i++) {
    const u = i / 10;
    const radius = 0.49 + u * 1.57;
    const sweep = 0.13 + 0.34 * u ** 1.6;
    const chord = 0.54 - 0.10 * u;
    for (let j = 0; j <= 4; j++) {
      const v = j / 4;
      const angle = sweep + (v - 0.5) * chord / radius;
      positions.push(radius * Math.cos(angle), radius * Math.sin(angle), 0.18 * (v - 0.5) + 0.12 * u);
      if (i < 10 && j < 4) {
        const a = i * 5 + j;
        indices.push(a, a + 5, a + 1, a + 1, a + 5, a + 6);
      }
    }
  }
  return geometryFrom(positions, indices);
}

/**
 * Original passenger aircraft, metres-like art units: 14 long, nose -Z.
 * The +X nacelle is intentionally absent: attach the full engine at engineMount.
 * Parent transforms remain untouched so the engine-to-flight handoff is exact.
 */
export function createAircraft() {
  const group = new THREE.Group();
  group.name = 'THRUST / original airliner';
  const engineMount = new THREE.Vector3(3, -0.72, -1.5);
  const engineScale = 0.10;
  const geometries = new Set();
  const materials = new Map();
  const instancedMeshes = new Set();

  const ownMaterial = (material) => {
    materials.set(material, { opacity: material.opacity, depthWrite: material.depthWrite });
    material.transparent = true;
    return material;
  };
  const standard = (name, color, metalness, roughness, more = {}) => {
    const material = ownMaterial(new THREE.MeshStandardMaterial({ color, metalness, roughness, ...more }));
    material.name = name;
    return material;
  };
  const paint = ownMaterial(new THREE.MeshPhysicalMaterial({ color: 0xe0e5e5, metalness: 0.30, roughness: 0.30, clearcoat: 0.32, clearcoatRoughness: 0.26 }));
  paint.name = 'aircraft / cool white enamel';
  const wingPaint = standard('aircraft / wing enamel', 0xcdd6da, 0.30, 0.35);
  const titanium = standard('aircraft / satin titanium', 0xadb9c2, 0.83, 0.26);
  const nozzleMetal = standard('aircraft / exhaust titanium', 0x717f86, 0.82, 0.39);
  const liner = standard('aircraft / intake liner', 0x303b45, 0.42, 0.50, { side: THREE.DoubleSide });
  const fanMaterial = standard('aircraft / composite fan', 0x17232d, 0.53, 0.32, { side: THREE.DoubleSide });
  const nacelleCarbon = standard('aircraft / composite fan cowl', 0x263237, 0.55, 0.32);
  const nacelleAft = standard('aircraft / aft composite cowl', 0x202b30, 0.86, 0.44);
  const glass = standard('aircraft / cockpit glazing', 0x101f2a, 0.47, 0.16, { side: THREE.DoubleSide });
  const cabinGlass = standard('aircraft / cabin glazing', 0x22323d, 0.35, 0.22, { side: THREE.DoubleSide });
  const cavity = standard('aircraft / dark recess', 0x080e14, 0.08, 0.76, { side: THREE.DoubleSide });
  const seams = ownMaterial(new THREE.LineBasicMaterial({ color: 0x647780, transparent: true, opacity: 0.29, depthWrite: false }));

  function mesh(geometry, material, parent = group, name = '') {
    geometries.add(geometry);
    const object = new THREE.Mesh(geometry, material);
    object.name = name;
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }

  function line(points, closed = false) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    geometries.add(geometry);
    const object = closed ? new THREE.LineLoop(geometry, seams) : new THREE.Line(geometry, seams);
    group.add(object);
    return object;
  }

  mesh(fuselageGeometry(), paint, group, 'smooth pressure fuselage');
  const belly = mesh(new THREE.SphereGeometry(1, 36, 18), paint, group, 'wing-body fairing');
  belly.scale.set(0.72, 0.155, 1.78);
  belly.position.set(0, -0.482, 0.57);

  for (const side of [-1, 1]) {
    mesh(airfoilGeometry(WING, side), wingPaint, group, `${side > 0 ? 'right' : 'left'} swept wing`);
    mesh(airfoilGeometry(WING, side, true), titanium, group, 'wing leading-edge strip');
    mesh(airfoilGeometry(TAIL, side), wingPaint, group, 'horizontal stabilizer');
    mesh(airfoilGeometry(TAIL, side, true), titanium, group, 'stabilizer leading edge');

    // A restrained control-surface seam follows the actual cambered upper skin.
    const seam = [];
    const seamAngle = Math.acos(1 - 2 * 0.76);
    for (let i = 0; i <= 54; i++) {
      const span = 0.82 + i / 54 * 6.34;
      seam.push(new THREE.Vector3(...airfoilPoint(WING, span, seamAngle, side, 0.0018)));
    }
    line(seam);

    for (const span of [1.72, 3.6, 5.10]) {
      const chord = sample(WING, span, 2);
      const fairing = mesh(latheAlongZ([
        [-0.35, 0.005], [-0.23, 0.043], [0.05, 0.061], [0.30, 0.050], [0.55, 0.005],
      ], 16), wingPaint, group, 'flap-track fairing');
      fairing.position.set(side * span, sample(WING, span, 3) - 0.095, sample(WING, span, 1) + chord * 0.85);
      fairing.scale.set(1, 0.78, 0.73 + chord * 0.12);
    }

    mesh(cockpitGeometry(side, -6.53, -6.18, 0.07, 0.55), glass, group, 'inner windscreen');
    mesh(cockpitGeometry(side, -6.40, -6.08, 0.60, 1.02), glass, group, 'outer windscreen');
    mesh(cockpitGeometry(side, -6.055, -5.80, 1.06, 1.37), glass, group, 'cockpit side glazing');
  }

  const fin = mesh(airfoilGeometry(FIN), paint, group, 'vertical stabilizer');
  fin.rotation.z = Math.PI / 2;
  fin.position.y = 0.255;
  const finEdge = mesh(airfoilGeometry(FIN, 1, true), titanium, group, 'fin leading edge');
  finEdge.rotation.z = Math.PI / 2;
  finEdge.position.y = 0.255;

  const windowGeometry = new THREE.ShapeGeometry(roundedRectangle(0.048, 0.074, 0.017), 5);
  geometries.add(windowGeometry);
  const windowPositions = [];
  const doorPositions = [-4.68, -1.27, 3.68];
  for (let z = -5.24; z <= 4.37; z += 0.162) {
    if (doorPositions.some((door) => Math.abs(z - door) < 0.115)) continue;
    windowPositions.push(z);
  }
  const instance = new THREE.Object3D();
  const basis = new THREE.Matrix4();
  const alpha = 0.268;
  for (const side of [-1, 1]) {
    const windows = new THREE.InstancedMesh(windowGeometry, cabinGlass, windowPositions.length);
    instancedMeshes.add(windows);
    windows.name = 'fine cabin window row';
    basis.makeBasis(
      new THREE.Vector3(0, 0, -side),
      new THREE.Vector3(-side * Math.sin(alpha), Math.cos(alpha), 0),
      new THREE.Vector3(side * Math.cos(alpha), Math.sin(alpha), 0),
    );
    instance.quaternion.setFromRotationMatrix(basis);
    windowPositions.forEach((z, i) => {
      const radius = bodyRadius(z) + 0.0023;
      instance.position.set(side * Math.cos(alpha) * radius, bodyCenter(z) + Math.sin(alpha) * radius, z);
      instance.updateMatrix();
      windows.setMatrixAt(i, instance.matrix);
    });
    windows.instanceMatrix.needsUpdate = true;
    group.add(windows);

    const doorOutline = roundedRectangle(0.125, 0.425, 0.026).getPoints(7);
    for (const z0 of doorPositions) {
      line(doorOutline.map((p) => {
        const z = z0 + p.x;
        const y = p.y + 0.015;
        const radius = bodyRadius(z);
        const x = Math.sqrt(Math.max(0, radius * radius - y * y));
        return new THREE.Vector3(side * (x + 0.0028), bodyCenter(z) + y, z);
      }), true);
    }
  }

  // Both pylons belong to the airframe. The right engine itself is supplied by
  // the continuous full-size engine scene, using engineMount and engineScale.
  const pylonShape = new THREE.Shape();
  const pylonOutline = [
    [-0.13, 0.065], [0.69, 0.033], [0.74, -0.09], [0.10, -0.43],
    [-0.62, -0.486], [-1.055, -0.468], [-0.77, -0.35], [-0.33, -0.12],
  ];
  pylonOutline.forEach(([z, y], i) => {
    if (i === 0) pylonShape.moveTo(-z, y);
    else pylonShape.lineTo(-z, y);
  });
  pylonShape.closePath();
  const pylonGeometry = new THREE.ExtrudeGeometry(pylonShape, {
    depth: 0.106, bevelEnabled: true, bevelSegments: 3,
    bevelSize: 0.022, bevelThickness: 0.012, steps: 1,
  });
  pylonGeometry.translate(0, 0, -0.053);
  pylonGeometry.rotateY(Math.PI / 2);
  for (const side of [-1, 1]) {
    const pylon = mesh(pylonGeometry, paint, group, 'sculpted engine pylon');
    pylon.position.x = side * engineMount.x;
  }

  const pod = new THREE.Group();
  pod.name = 'left engine / matching silhouette';
  pod.position.set(-engineMount.x, engineMount.y, engineMount.z);
  pod.scale.setScalar(engineScale);
  group.add(pod);
  mesh(latheAlongZ([
    [-0.30, 2.174], [-0.30, 2.366], [0.22, 2.385], [1.66, 2.358],
    [1.66, 2.16], [-0.30, 2.174],
  ], 64), nacelleCarbon, pod, 'left composite fan cowl');
  mesh(latheAlongZ([
    [1.69, 2.11], [1.69, 2.354], [2.72, 2.296], [4.55, 2.205],
    [4.55, 2.06], [1.69, 2.11],
  ], 56), titanium, pod, 'left forward bypass sleeve');
  mesh(latheAlongZ([
    [4.59, 2.045], [4.59, 2.20], [6.62, 2.05], [7.23, 1.945],
    [7.23, 1.835], [4.59, 2.045],
  ], 56), nacelleAft, pod, 'left aft composite sleeve');
  mesh(latheAlongZ([
    [7.27, 1.825], [7.27, 1.94], [8.56, 1.82], [9.50, 1.72],
    [9.50, 1.665], [8.65, 1.72], [7.27, 1.825],
  ], 56), titanium, pod, 'left separate bypass nozzle');
  mesh(latheAlongZ([
    [-0.39, 2.165], [-0.67, 2.153], [-0.84, 2.165], [-0.938, 2.198],
    [-0.973, 2.247], [-0.934, 2.294], [-0.825, 2.342], [-0.65, 2.376],
    [-0.46, 2.382], [-0.30, 2.366], [-0.29, 2.315], [-0.39, 2.165],
  ], 64), titanium, pod, 'polished intake lip');
  mesh(latheAlongZ([[-0.34, 2.109], [0.50, 2.111], [2.2, 2.115]], 48), liner, pod, 'intake acoustic liner');
  const blackBack = mesh(new THREE.CircleGeometry(2.105, 48), cavity, pod, 'fan depth');
  blackBack.position.z = 0.28;
  const fan = new THREE.Group();
  fan.name = 'left fan / 22 blades';
  pod.add(fan);
  const bladeGeometry = fanBladeGeometry();
  geometries.add(bladeGeometry);
  const fanBlades = new THREE.InstancedMesh(bladeGeometry, fanMaterial, 22);
  instancedMeshes.add(fanBlades);
  const bladeMatrix = new THREE.Matrix4();
  for (let i = 0; i < 22; i++) {
    bladeMatrix.makeRotationZ(i * TAU / 22);
    fanBlades.setMatrixAt(i, bladeMatrix);
  }
  fanBlades.instanceMatrix.needsUpdate = true;
  fan.add(fanBlades);
  mesh(latheAlongZ([[-0.54, 0.01], [-0.40, 0.18], [-0.14, 0.44], [0.23, 0.61], [0.40, 0.61]], 40), titanium, fan, 'spinner');
  mesh(latheAlongZ([[5.7, 1.28], [7.7, 1.19], [10.35, 1.02], [11.4, 0.94], [11.4, 0.82], [10.2, 0.89]], 48), nozzleMetal, pod, 'core exhaust sleeve');
  const darkExhaust = mesh(new THREE.CircleGeometry(0.825, 40), cavity, pod, 'core exhaust interior');
  darkExhaust.position.z = 11.28;
  mesh(latheAlongZ([[10.35, 0.52], [11.45, 0.32], [12.15, 0.012]], 40), nozzleMetal, pod, 'exhaust center plug');

  const apu = mesh(new THREE.CircleGeometry(0.038, 20), cavity, group, 'tail exhaust');
  apu.position.set(0, bodyCenter(6.93), 6.987);
  const apuRim = mesh(new THREE.TorusGeometry(0.038, 0.004, 6, 24), titanium, group, 'tail exhaust rim');
  apuRim.position.copy(apu.position);

  // Tiny real navigation lights; no decorative light trails or emissive seams.
  for (const side of [-1, 1]) {
    const lightColor = side < 0 ? 0x8f2923 : 0x217b62;
    const nav = standard('aircraft / navigation light', lightColor, 0.1, 0.2, { emissive: lightColor, emissiveIntensity: 0.25 });
    const light = mesh(new THREE.SphereGeometry(0.010, 8, 6), nav, group, 'wingtip navigation light');
    light.position.set(side * 8.031, 1.445, 3.491);
  }

  let lastReveal = -1;
  let disposed = false;
  function update(time, { reveal = 1 } = {}) {
    if (disposed) return;
    const visibility = clamp(Number.isFinite(reveal) ? reveal : 1, 0, 1);
    group.visible = visibility > 0.001;
    if (visibility !== lastReveal) {
      for (const [material, original] of materials) {
        material.opacity = original.opacity * visibility;
        material.depthWrite = original.depthWrite && visibility > 0.985;
      }
      lastReveal = visibility;
    }
    fan.rotation.z = (Number.isFinite(time) ? time : 0) * 0.72;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    // Dispose only owned resources: an externally attached right engine keeps
    // its own lifecycle, even when the caller parents it beneath this group.
    for (const object of instancedMeshes) object.dispose();
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials.keys()) material.dispose();
    geometries.clear();
    materials.clear();
    instancedMeshes.clear();
  }

  update(0);
  return { group, engineMount, engineScale, update, dispose };
}
