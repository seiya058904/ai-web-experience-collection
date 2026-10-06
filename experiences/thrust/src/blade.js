import * as THREE from 'three';

// Original tapered, cambered and twisted turbine airfoil. The removable +Z skin
// exposes a simplified serpentine cooling circuit. Geometry is generated here;
// the feature is an explanatory macro model, not a manufacturing specification.
const SPAN = 2.43;
const BASE_Y = -0.75;
const Q_SEGMENTS = 64;
const H_SEGMENTS = 50;
const WINDOW = { q0: 33 / 64, q1: 56 / 64, h0: 5 / 50, h1: 45 / 50 };
const HOLE_COLUMNS = [0.049, 0.089, 0.132];
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const Y_AXIS = new THREE.Vector3(0, 1, 0);

function foilPoint(q, h, side = 1, inset = 0) {
  const chord = 1.36 - h * 0.34;
  const thickness = 5 * (0.245 - 0.030 * h) * (
    0.2969 * Math.sqrt(q) - 0.126 * q - 0.3516 * q * q
    + 0.2843 * q * q * q - 0.1036 * q * q * q * q
  );
  const camber = (0.20 + h * 0.035) * Math.sin(Math.PI * q) * (1 - q * 0.20);
  const x = (q - 0.47) * chord;
  const z = (camber + thickness * side) * chord - inset;
  const twist = 0.18 - h * 0.43;
  const sweep = 0.23 * h * h - 0.055 * h;
  return new THREE.Vector3(
    x * Math.cos(twist) + z * Math.sin(twist) + sweep,
    BASE_Y + h * SPAN,
    -x * Math.sin(twist) + z * Math.cos(twist) + 0.045 * Math.sin(h * Math.PI),
  );
}

function surfaceFrame(q, h) {
  const x = foilPoint(q + 0.001, h).sub(foilPoint(q - 0.001, h)).normalize();
  const vertical = foilPoint(q, h + 0.001).sub(foilPoint(q, h - 0.001)).normalize();
  const normal = new THREE.Vector3().crossVectors(x, vertical).normalize();
  const y = new THREE.Vector3().crossVectors(normal, x).normalize();
  return { x, y, normal };
}

function brushedTexture() {
  const size = 256;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = Math.sin((x + 1) * 127.1 + (y + 1) * 311.7) * 43758.5453123;
      const grain = n - Math.floor(n);
      const striation = Math.sin(y * 2.7 + Math.sin(x * 0.065));
      const value = Math.round(128 + (grain - 0.5) * 70 + striation * 24);
      const i = (y * size + x) * 4;
      pixels[i] = pixels[i + 1] = pixels[i + 2] = value;
      pixels[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.repeat.set(2.5, 5);
  texture.needsUpdate = true;
  return texture;
}

function meshGeometry(positions, indices, uvs = [], colors = []) {
  // Compact the cutout surfaces: unused panel vertices and the collapsed
  // leading/trailing cap triangles must not leave zero normals in the mesh.
  const packedPositions = [], packedUvs = [], packedColors = [], packedIndices = [];
  const remap = new Map();
  const pa = new THREE.Vector3(), pb = new THREE.Vector3(), pc = new THREE.Vector3();
  for (let i = 0; i < indices.length; i += 3) {
    pa.fromArray(positions, indices[i] * 3);
    pb.fromArray(positions, indices[i + 1] * 3).sub(pa);
    pc.fromArray(positions, indices[i + 2] * 3).sub(pa);
    if (pb.cross(pc).lengthSq() < 1e-16) continue;
    for (let j = 0; j < 3; j++) {
      const old = indices[i + j];
      if (!remap.has(old)) {
        remap.set(old, packedPositions.length / 3);
        packedPositions.push(positions[old * 3], positions[old * 3 + 1], positions[old * 3 + 2]);
        if (uvs.length) packedUvs.push(uvs[old * 2], uvs[old * 2 + 1]);
        if (colors.length) packedColors.push(colors[old * 3], colors[old * 3 + 1], colors[old * 3 + 2]);
      }
      packedIndices.push(remap.get(old));
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(packedPositions, 3));
  if (uvs.length) geometry.setAttribute('uv', new THREE.Float32BufferAttribute(packedUvs, 2));
  if (colors.length) geometry.setAttribute('color', new THREE.Float32BufferAttribute(packedColors, 3));
  geometry.setIndex(packedIndices);
  geometry.computeVertexNormals();
  return geometry;
}

function skinGeometry(side, panelOnly = false) {
  const positions = [], uvs = [], colors = [], indices = [];
  const silver = new THREE.Color('#aab5b8');
  const warm = new THREE.Color('#bd9b72');
  for (let j = 0; j <= H_SEGMENTS; j++) {
    const h = j / H_SEGMENTS;
    for (let i = 0; i <= Q_SEGMENTS; i++) {
      const q = i / Q_SEGMENTS;
      const point = foilPoint(q, h, side);
      positions.push(point.x, point.y, point.z);
      uvs.push(q, h);
      const hotEdge = THREE.MathUtils.smoothstep(q, 0.47, 1) * (0.23 + 0.77 * h);
      const color = silver.clone().lerp(warm, hotEdge * 0.58);
      colors.push(color.r, color.g, color.b);
      if (j < H_SEGMENTS && i < Q_SEGMENTS) {
        const windowCell = side > 0 && i >= 33 && i < 56 && j >= 5 && j < 45;
        if (side > 0 && windowCell !== panelOnly) continue;
        if (side < 0 && panelOnly) continue;
        const a = j * (Q_SEGMENTS + 1) + i;
        const b = a + Q_SEGMENTS + 1;
        if (side > 0) indices.push(a, a + 1, b, a + 1, b + 1, b);
        else indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  return meshGeometry(positions, indices, uvs, colors);
}

function endCapGeometry(h) {
  const positions = [], indices = [], uvs = [];
  for (let i = 0; i <= Q_SEGMENTS; i++) {
    const q = i / Q_SEGMENTS;
    for (const side of [-1, 1]) {
      const point = foilPoint(q, h, side);
      positions.push(point.x, point.y, point.z);
      uvs.push(q, side > 0 ? 1 : 0);
    }
    if (i < Q_SEGMENTS) {
      const a = i * 2;
      if (h > 0.5) indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      else indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  return meshGeometry(positions, indices, uvs);
}

function sectionRimGeometry() {
  const positions = [], indices = [], uvs = [];
  const addSide = (q0, h0, q1, h1, count) => {
    const start = positions.length / 3;
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const q = THREE.MathUtils.lerp(q0, q1, t);
      const h = THREE.MathUtils.lerp(h0, h1, t);
      for (const inset of [0.0005, 0.030]) {
        const p = foilPoint(q, h, 1, inset);
        positions.push(p.x, p.y, p.z);
        uvs.push(t, inset * 30);
      }
      if (i < count) {
        const a = start + i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
  };
  const { q0, q1, h0, h1 } = WINDOW;
  addSide(q0, h0, q0, h1, 40);
  addSide(q1, h1, q1, h0, 40);
  addSide(q0, h1, q1, h1, 23);
  addSide(q1, h0, q0, h0, 23);
  return meshGeometry(positions, indices, uvs);
}

function addFilmPerforation(material) {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vBladeUv;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvBladeUv = uv;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vBladeUv;')
      .replace('#include <clipping_planes_fragment>', /* glsl */`
        #include <clipping_planes_fragment>
        float qDist = min(abs(vBladeUv.x - 0.049), min(abs(vBladeUv.x - 0.089), abs(vBladeUv.x - 0.132)));
        float rowDist = abs(fract((vBladeUv.y - 0.075) / 0.038 + 0.5) - 0.5) * 0.038;
        vec2 ellipse = vec2(qDist / 0.0105, rowDist / 0.0044);
        if (vBladeUv.y > 0.065 && vBladeUv.y < 0.920 && dot(ellipse, ellipse) < 1.0) discard;
      `);
  };
  material.customProgramCacheKey = () => 'THRUST-original-perforated-airfoil-v1';
}

function roundedRect(width, height, radius) {
  const shape = new THREE.Shape();
  const x = -width / 2, y = -height / 2;
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

function firTreeGeometry() {
  const profile = [
    [-0.915, 0.29], [-0.970, 0.465], [-1.010, 0.445], [-1.048, 0.315],
    [-1.105, 0.430], [-1.148, 0.405], [-1.187, 0.280],
    [-1.250, 0.380], [-1.292, 0.350], [-1.333, 0.235],
    [-1.393, 0.300], [-1.450, 0.230],
  ];
  const shape = new THREE.Shape();
  shape.moveTo(-profile[0][1], profile[0][0]);
  for (let i = 1; i < profile.length; i++) shape.lineTo(-profile[i][1], profile[i][0]);
  for (let i = profile.length - 1; i >= 0; i--) shape.lineTo(profile[i][1], profile[i][0]);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.51, bevelEnabled: true, bevelSize: 0.009, bevelThickness: 0.008,
    bevelSegments: 2, curveSegments: 3, steps: 1,
  });
  geometry.translate(0.01, 0, -0.25);
  return geometry;
}

function circuitCurve() {
  const points = [];
  const add = (q, h) => points.push(foilPoint(q, h, 0, -0.007));
  const bottom = foilPoint(0.552, 0, 0, -0.007);
  points.push(bottom.clone().add(new THREE.Vector3(0, -0.32, 0)));
  points.push(bottom.clone().add(new THREE.Vector3(0, -0.13, 0)));
  for (let i = 0; i <= 14; i++) add(0.552, (i / 14) * 0.825);
  for (let i = 1; i <= 10; i++) {
    const t = i / 10;
    add(0.552 + t * 0.123, 0.825 + Math.sin(t * Math.PI) * 0.044);
  }
  for (let i = 1; i <= 14; i++) add(0.675, 0.825 - (i / 14) * 0.682);
  for (let i = 1; i <= 10; i++) {
    const t = i / 10;
    add(0.675 + t * 0.129, 0.143 - Math.sin(t * Math.PI) * 0.047);
  }
  for (let i = 1; i <= 16; i++) add(0.804, 0.143 + (i / 16) * 0.825);
  return new THREE.CatmullRomCurve3(points, false, 'centripetal');
}

function troughGeometry(curve) {
  const positions = [], indices = [], uvs = [];
  const rings = 180, sides = 12;
  for (let i = 0; i <= rings; i++) {
    const t = i / rings;
    const p = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();
    const front = Z_AXIS.clone().addScaledVector(tangent, -Z_AXIS.dot(tangent)).normalize();
    const across = new THREE.Vector3().crossVectors(tangent, front).normalize();
    for (let j = 0; j <= sides; j++) {
      const angle = Math.PI + (j / sides) * Math.PI;
      const point = p.clone()
        .addScaledVector(across, Math.cos(angle) * 0.049)
        .addScaledVector(front, Math.sin(angle) * 0.049);
      positions.push(point.x, point.y, point.z);
      uvs.push(t * 8, j / sides);
      if (i < rings && j < sides) {
        const a = i * (sides + 1) + j;
        indices.push(a, a + sides + 1, a + 1, a + 1, a + sides + 1, a + sides + 2);
      }
    }
  }
  return meshGeometry(positions, indices, uvs);
}

function filmLineGeometry() {
  const positions = [], phases = [];
  for (let row = 0; row < 23; row++) {
    const h = 0.075 + row * 0.038;
    for (let column = 0; column < 3; column++) {
      const startQ = HOLE_COLUMNS[column];
      const length = 0.15 + column * 0.035 + (row % 4) * 0.009;
      for (let segment = 0; segment < 15; segment++) {
        for (const index of [segment, segment + 1]) {
          const t = index / 15;
          const point = foilPoint(startQ + t * length, h + t * 0.006, 1, -0.003 - t * 0.002);
          positions.push(point.x, point.y, point.z);
          phases.push(t, (row * 0.414 + column * 0.237) % 1);
        }
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aFlow', new THREE.Float32BufferAttribute(phases, 2));
  return geometry;
}

export function createBlade() {
  const group = new THREE.Group();
  group.name = 'BLADE / original cooled superalloy airfoil';
  const grain = brushedTexture();
  const metalOptions = {
    color: '#aab5b8', metalness: 0.97, roughness: 0.29,
    bumpMap: grain, bumpScale: 0.0023, envMapIntensity: 1.25,
  };
  const frontMaterial = new THREE.MeshStandardMaterial({ ...metalOptions, color: '#ffffff', vertexColors: true });
  addFilmPerforation(frontMaterial);
  const panelMaterial = new THREE.MeshStandardMaterial({ ...metalOptions, color: '#ffffff', vertexColors: true, transparent: true });
  const backMaterial = new THREE.MeshStandardMaterial({ ...metalOptions, color: '#ffffff', vertexColors: true });
  const rimMaterial = new THREE.MeshStandardMaterial({ ...metalOptions, color: '#c6b294', roughness: 0.23, side: THREE.DoubleSide });
  const rootMaterial = new THREE.MeshStandardMaterial({ ...metalOptions, color: '#737c83', roughness: 0.33 });
  const edgeMaterial = new THREE.MeshStandardMaterial({ ...metalOptions, color: '#d1d7d8', roughness: 0.18 });
  const channelMaterial = new THREE.MeshStandardMaterial({ ...metalOptions, color: '#64737a', roughness: 0.38, side: THREE.DoubleSide });
  const holeMaterial = new THREE.MeshStandardMaterial({ color: '#070b0f', metalness: 0.30, roughness: 0.87 });

  const front = new THREE.Mesh(skinGeometry(1), frontMaterial);
  front.name = 'curved perforated pressure surface';
  const panel = new THREE.Mesh(skinGeometry(1, true), panelMaterial);
  panel.name = 'removable partial section skin';
  const back = new THREE.Mesh(skinGeometry(-1), backMaterial);
  back.name = 'continuous suction surface';
  const rim = new THREE.Mesh(sectionRimGeometry(), rimMaterial);
  rim.name = 'machined section wall';
  group.add(front, panel, back, rim);
  for (const h of [0, 1]) group.add(new THREE.Mesh(endCapGeometry(h), rimMaterial));

  const platformGeometry = new THREE.ExtrudeGeometry(roundedRect(1.52, 0.72, 0.068), {
    depth: 0.090, bevelEnabled: true, bevelSize: 0.018, bevelThickness: 0.016,
    bevelSegments: 3, steps: 1, curveSegments: 6,
  });
  platformGeometry.rotateX(-Math.PI / 2);
  platformGeometry.translate(0.015, -0.855, 0.09);
  const platform = new THREE.Mesh(platformGeometry, rimMaterial);
  platform.name = 'beveled root platform';
  const root = new THREE.Mesh(firTreeGeometry(), rootMaterial);
  root.name = 'four-lobe fir-tree attachment';
  root.position.y = 0.043;
  group.add(platform, root);

  const leadingPoints = [], trailingPoints = [];
  for (let i = 0; i <= 50; i++) {
    leadingPoints.push(foilPoint(0.002, i / 50));
    trailingPoints.push(foilPoint(0.992, i / 50));
  }
  group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(leadingPoints), 64, 0.007, 6, false), edgeMaterial));
  group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(trailingPoints), 64, 0.006, 6, false), rimMaterial));

  // Elliptical film exits are actual openings in the surface shader, with
  // recessed dark walls and independently modeled metallic lips beneath them.
  const holeCount = 23 * 3;
  const lips = new THREE.InstancedMesh(new THREE.TorusGeometry(0.0128, 0.0017, 5, 14), edgeMaterial, holeCount);
  const walls = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0124, 0.0124, 0.036, 12, 1, true), holeMaterial, holeCount);
  const recesses = new THREE.InstancedMesh(new THREE.CircleGeometry(0.0123, 14), holeMaterial, holeCount);
  lips.name = '69 elliptical film-cooling lips';
  walls.name = 'film-hole recess walls';
  recesses.name = 'dark metering-hole depths';
  const transform = new THREE.Matrix4();
  let holeIndex = 0;
  for (let row = 0; row < 23; row++) {
    for (const q of HOLE_COLUMNS) {
      const h = 0.075 + row * 0.038;
      const p = foilPoint(q, h);
      const frame = surfaceFrame(q, h);
      const basis = new THREE.Matrix4().makeBasis(frame.x, frame.y, frame.normal);
      const orientation = new THREE.Quaternion().setFromRotationMatrix(basis);
      transform.compose(p.clone().addScaledVector(frame.normal, 0.0004), orientation, new THREE.Vector3(1.12, 0.79, 1));
      lips.setMatrixAt(holeIndex, transform);
      transform.compose(p.clone().addScaledVector(frame.normal, -0.020), orientation, new THREE.Vector3(1.12, 0.79, 1));
      recesses.setMatrixAt(holeIndex, transform);
      const boreOrientation = new THREE.Quaternion().setFromUnitVectors(Y_AXIS, frame.normal);
      transform.compose(p.clone().addScaledVector(frame.normal, -0.016), boreOrientation, new THREE.Vector3(1.05, 1, 0.78));
      walls.setMatrixAt(holeIndex, transform);
      holeIndex++;
    }
  }
  for (const object of [lips, walls, recesses]) {
    object.instanceMatrix.needsUpdate = true;
    group.add(object);
  }

  const coolingUniforms = { uTime: { value: 0 }, uReveal: { value: 0 }, uCut: { value: 0 } };
  const coolingMaterial = new THREE.ShaderMaterial({
    uniforms: coolingUniforms, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, toneMapped: false,
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform float uReveal; uniform float uCut; varying vec2 vUv;
      void main() {
        float phase = fract(vUv.x * 8.0 - uTime * 0.57);
        float pulse = smoothstep(0.36, 0.78, phase) * (1.0 - smoothstep(0.79, 0.94, phase));
        float opacity = (0.32 + pulse * 0.62) * uReveal;
        gl_FragColor = vec4(vec3(0.36, 0.84, 1.0) * (1.0 + pulse * 0.65), opacity);
        #include <colorspace_fragment>
      }
    `,
  });
  const curve = circuitCurve();
  const passage = new THREE.Mesh(troughGeometry(curve), channelMaterial);
  passage.name = 'open serpentine cooling passage';
  const coolLine = new THREE.Mesh(new THREE.TubeGeometry(curve, 220, 0.010, 7, false), coolingMaterial);
  coolLine.name = 'flow within the three-leg cooling circuit';
  const haloMaterial = new THREE.MeshBasicMaterial({ color: '#4ba0bb', transparent: true, opacity: 0.11, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const halo = new THREE.Mesh(new THREE.TubeGeometry(curve, 160, 0.024, 7, false), haloMaterial);
  group.add(passage, coolLine, halo);

  // Small heat-transfer ribs stay within the open channel walls.
  const ribs = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0039, 0.0039, 0.070, 5), channelMaterial, 63);
  ribs.name = 'internal trip strips';
  let ribIndex = 0;
  for (const q of [0.552, 0.675, 0.804]) {
    for (let i = 0; i < 21; i++) {
      const h = 0.175 + (i / 20) * 0.58;
      const p = foilPoint(q, h, 0, 0.025);
      const direction = foilPoint(q + 0.015, h + 0.004, 0).sub(foilPoint(q - 0.015, h - 0.004, 0)).normalize();
      transform.compose(p, new THREE.Quaternion().setFromUnitVectors(Y_AXIS, direction), new THREE.Vector3(1, 1, 1));
      ribs.setMatrixAt(ribIndex++, transform);
    }
  }
  ribs.instanceMatrix.needsUpdate = true;
  group.add(ribs);

  const filmMaterial = new THREE.ShaderMaterial({
    uniforms: coolingUniforms, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, toneMapped: false,
    vertexShader: /* glsl */`
      attribute vec2 aFlow; varying vec2 vFlow;
      void main() { vFlow = aFlow; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform float uReveal; varying vec2 vFlow;
      void main() {
        float phase = fract(vFlow.x * 1.6 - uTime * 0.44 + vFlow.y);
        float pulse = smoothstep(0.42, 0.75, phase) * (1.0 - smoothstep(0.77, 0.92, phase));
        float alpha = pow(1.0 - vFlow.x, 1.25) * (0.10 + 0.42 * pulse) * uReveal;
        gl_FragColor = vec4(0.43, 0.83, 1.0, alpha);
        #include <colorspace_fragment>
      }
    `,
  });
  const films = new THREE.LineSegments(filmLineGeometry(), filmMaterial);
  films.name = 'cooling film attached to the leading surface';
  group.add(films);

  const warmRim = new THREE.DirectionalLight('#ffa458', 2.5);
  warmRim.position.set(2.8, 2.2, -1.5);
  warmRim.target.position.set(0, 0.35, 0);
  const silverKey = new THREE.DirectionalLight('#bfdef0', 1.4);
  silverKey.position.set(-2.8, 2.3, 4.0);
  silverKey.target.position.set(0, 0.35, 0);
  group.add(warmRim, silverKey, warmRim.target, silverKey.target);
  for (const object of [front, back, platform, root]) { object.castShadow = true; object.receiveShadow = true; }
  group.userData.blade = { original: true, axis: '+Y', rootY: -1.416, tipY: 1.68, filmHoleCount: 69, serpentineLegs: 3 };

  return {
    group,
    update(time, { reveal = 0, cut = 0 } = {}) {
      const amount = THREE.MathUtils.clamp(cut, 0, 1);
      const activity = THREE.MathUtils.clamp(reveal, 0, 1);
      coolingUniforms.uTime.value = Number.isFinite(time) ? time : 0;
      coolingUniforms.uReveal.value = activity;
      coolingUniforms.uCut.value = amount;
      panel.position.set(amount * 0.55, amount * 0.016, amount * 0.38);
      panel.rotation.y = amount * -0.10;
      panelMaterial.opacity = 1 - THREE.MathUtils.smoothstep(amount, 0.06, 0.82);
      panelMaterial.depthWrite = panelMaterial.opacity > 0.96;
      panel.visible = panelMaterial.opacity > 0.003;
      haloMaterial.opacity = activity * 0.10;
      warmRim.intensity = 2.4 + activity * 0.4;
    },
    dispose() {
      const geometries = new Set(), materials = new Set();
      group.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) {
          for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      grain.dispose();
      group.clear();
    },
  };
}
