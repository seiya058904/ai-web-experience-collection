import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

/** One state, one renderer, one externally supplied clock. Values are normalized. */
export type ReactorFrame = {
  p: number;
  time: number;
  energy: number;
  field: number;
  instability: number;
  control: number;
  assembly: number;
  cutaway: number;
  heat: number;
  pointerX: number;
  pointerY: number;
  fieldMode: number;
  quality: 'auto' | 'high' | 'low';
  reducedMotion: boolean;
};

const TAU = Math.PI * 2;
const MAJOR = 2.84;
const KAPPA = 1.40;
const DELTA = 0.29;
const MECHANICAL_SECTION = .91;
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const clamp = THREE.MathUtils.clamp;
const mix = THREE.MathUtils.lerp;
const smooth = (a: number, b: number, n: number) => {
  const t = clamp((n - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

type Physical = THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
type StationPart = { mesh: THREE.InstancedMesh; local: THREE.Matrix4[]; stations: number[] };
type VesselPart = { mesh: THREE.Mesh; angle: number; top: boolean; front: number; material: Physical };
type Pose = { camera: [number, number, number]; x: number; y: number; metal: number; glow: number; flux: number; envelope: number; explode: number };

const POSES: Pose[] = [
  { camera: [7.40, 11.0, 8.50], x: .685, y: .460, metal: 1, glow: 1.05, flux: .30, envelope: .10, explode: 0 },
  { camera: [8.20, 12.0, 9.20], x: .675, y: .462, metal: 1, glow: .92, flux: .35, envelope: .22, explode: 1 },
  { camera: [6.20, 10.7, 9.40], x: .665, y: .463, metal: .13, glow: .36, flux: 1, envelope: .66, explode: .3 },
  { camera: [5.20, 8.80, 7.60], x: .675, y: .463, metal: .045, glow: 1.28, flux: .32, envelope: .08, explode: 0 },
  { camera: [4.80, 11.0, 7.60], x: .670, y: .455, metal: .075, glow: 1.09, flux: .58, envelope: .40, explode: 0 },
  { camera: [7.20, 11.8, 9.30], x: .665, y: .458, metal: .19, glow: .88, flux: .88, envelope: 1, explode: .06 },
  { camera: [5.70, 10.6, 8.40], x: .645, y: .460, metal: .065, glow: 1.50, flux: .24, envelope: .17, explode: 0 },
  { camera: [9.80, 15.0, 13.0], x: .690, y: .465, metal: .72, glow: .83, flux: .25, envelope: .16, explode: 0 },
];

function scenePose(p: number): Pose {
  const bounded = clamp(p, 0, 7.99);
  const n = Math.floor(bounded);
  const phase = bounded - n;
  let a = n;
  let b = n;
  let t = 0;
  if (phase < .22 && n > 0) {
    a = n - 1;
    b = n;
    t = smooth(-.28, .22, phase);
  } else if (phase > .72 && n < 7) {
    b = n + 1;
    t = smooth(.72, 1.22, phase);
  }
  const from = POSES[a];
  const to = POSES[b];
  return {
    camera: [mix(from.camera[0], to.camera[0], t), mix(from.camera[1], to.camera[1], t), mix(from.camera[2], to.camera[2], t)],
    x: mix(from.x, to.x, t), y: mix(from.y, to.y, t),
    metal: mix(from.metal, to.metal, t), glow: mix(from.glow, to.glow, t),
    flux: mix(from.flux, to.flux, t), envelope: mix(from.envelope, to.envelope, t), explode: mix(from.explode, to.explode, t),
  };
}

function profile(phi: number, minor: number, z = 0): THREE.Vector3 {
  minor *= MECHANICAL_SECTION;
  return new THREE.Vector3(MAJOR + minor * Math.cos(phi + DELTA * Math.sin(phi)), minor * KAPPA * Math.sin(phi), z);
}

class DLoop extends THREE.Curve<THREE.Vector3> {
  constructor(private minor: number, private z: number) { super(); }
  getPoint(t: number, out = new THREE.Vector3()): THREE.Vector3 {
    const phi = t * TAU;
    const minor = this.minor * MECHANICAL_SECTION;
    return out.set(MAJOR + minor * Math.cos(phi + DELTA * Math.sin(phi)), minor * KAPPA * Math.sin(phi), this.z);
  }
}

/** Beveled annular D-section; never approximated by a row of boxes. */
function dBand(outer: number, inner: number, depth: number, bevel = .015): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const hole = new THREE.Path();
  const segments = 72;
  for (let i = 0; i <= segments; i++) {
    const a = profile(i / segments * TAU, outer);
    const b = profile((segments - i) / segments * TAU, inner);
    if (i === 0) { shape.moveTo(a.x, a.y); hole.moveTo(b.x, b.y); }
    else { shape.lineTo(a.x, a.y); hole.lineTo(b.x, b.y); }
  }
  shape.closePath();
  hole.closePath();
  shape.holes.push(hole);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelSegments: 2, steps: 1, bevelSize: bevel, bevelThickness: bevel, curveSegments: 72 });
  geometry.translate(0, 0, -depth / 2);
  // ExtrudeGeometry duplicates normals at each line segment. Welding before
  // recomputing them gives continuous machined-metal highlights, not facets.
  geometry.deleteAttribute('normal');
  const welded = mergeVertices(geometry, .0001);
  welded.computeVertexNormals();
  geometry.dispose();
  return welded;
}

function latheRing(radius: number, halfWidth: number, height: number, bevel = .015): THREE.LatheGeometry {
  const lo = radius - halfWidth;
  const hi = radius + halfWidth;
  const h = height / 2;
  const points = [
    [lo + bevel, -h], [hi - bevel, -h], [hi, -h + bevel], [hi, h - bevel],
    [hi - bevel, h], [lo + bevel, h], [lo, h - bevel], [lo, -h + bevel], [lo + bevel, -h],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(points, 96);
}

function vesselPatch(thetaStart: number, thetaEnd: number, phiStart: number, phiEnd: number, minor: number): THREE.BufferGeometry {
  const n = 12;
  const m = 20;
  minor *= MECHANICAL_SECTION;
  const positions: number[] = [];
  const uv: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= n; i++) {
    const theta = mix(thetaStart, thetaEnd, i / n);
    for (let j = 0; j <= m; j++) {
      const phi = mix(phiStart, phiEnd, j / m);
      const r = MAJOR + minor * Math.cos(phi + DELTA * Math.sin(phi));
      positions.push(r * Math.cos(theta), minor * KAPPA * Math.sin(phi), r * Math.sin(theta));
      uv.push(i / n, j / m);
      if (i < n && j < m) {
        const a = i * (m + 1) + j;
        const b = a + m + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
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

function parametricSurface(around = 192, section = 32): THREE.BufferGeometry {
  const positions: number[] = [];
  const uv: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= around; i++) for (let j = 0; j <= section; j++) {
    const theta = i / around * TAU;
    const phi = j / section * TAU;
    positions.push(theta, phi, 0);
    uv.push(i / around, j / section);
    if (i < around && j < section) {
      const a = i * (section + 1) + j;
      const b = a + section + 1;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  return geometry;
}

const PARAMETRIC_GLSL = /* glsl */`
  const float PI = 3.14159265359;
  const float TAU = 6.28318530718;
  uniform float uTime;
  uniform float uEnergy;
  uniform float uInstability;
  uniform float uControl;
  uniform float uHeat;
  vec3 torusPoint(float theta, float phi, float rho) {
    float disturbance = uInstability * (1.0 - uControl * .74);
    // A schematic m = 2, n = 1 helical perturbation: phi is poloidal,
    // theta is toroidal. The displacement stays on an organized flux surface.
    float mode = sin(2.0 * phi - theta - uTime * .74);
    float radial = rho * (1.0 + disturbance * .17 * mode);
    float r = 2.84 + radial * cos(phi + .29 * sin(phi));
    r += disturbance * .115 * sin(theta - uTime * .74);
    float y = radial * 1.40 * sin(phi);
    y += disturbance * .115 * cos(theta - uTime * .74);
    return vec3(r * cos(theta), y, r * sin(theta));
  }
`;

const plasmaVertex = /* glsl */`
  ${PARAMETRIC_GLSL}
  uniform float uRadius;
  uniform float uLayer;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vEye;
  varying float vTheta;
  varying float vPhi;
  void main() {
    float theta = position.x;
    float phi = position.y;
    float ripple = .009 * sin(theta * 17.0 - phi * 3.0 - uTime * .85);
    ripple += .006 * sin(theta * 29.0 + phi * 7.0 + uTime * .63);
    float rho = uRadius + ripple * (.4 + uEnergy * .6);
    vec3 p = torusPoint(theta, phi, rho);
    vec3 dt = torusPoint(theta + .003, phi, rho) - p;
    vec3 dp = torusPoint(theta, phi + .003, rho) - p;
    vec3 n = normalize(cross(dp, dt));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vNormal = normalize(normalMatrix * n);
    vEye = normalize(-mv.xyz);
    vUv = uv;
    vTheta = theta;
    vPhi = phi;
    gl_Position = projectionMatrix * mv;
  }
`;

const plasmaFragment = /* glsl */`
  ${PARAMETRIC_GLSL}
  uniform float uOpacity;
  uniform float uLayer;
  uniform float uField;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vEye;
  varying float vTheta;
  varying float vPhi;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
  }
  void main() {
    float flow = vTheta * 2.0 - uTime * (.32 + uEnergy * .55);
    // Periodic coordinates keep the closed torus free of a texture seam.
    float turbulence = noise(vec2(cos(vTheta) * 8.0 + sin(vPhi) * 2.0 - uTime * .21, sin(vTheta) * 8.0 + cos(vPhi) * 2.0));
    float thread = vPhi * 14.0 - vTheta * 4.0 + turbulence * 1.0 + sin(flow * 3.0) * .2;
    float thin = pow(max(0.0, sin(thread)), 24.0);
    float fine = pow(max(0.0, sin(vPhi * 37.0 - vTheta * 11.0 + turbulence * 1.4)), 40.0);
    float pulse = pow(max(0.0, sin(flow + vPhi * 2.0)), 14.0);
    float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vEye))), 2.15);
    float bands = .5 + .5 * sin(vPhi * 8.0 - vTheta * 3.0 + turbulence);
    float core = (thin * .38 + fine * .09) * (.35 + pulse * .85);
    float warm = smoothstep(.12, .9, uHeat);
    vec3 cold = vec3(.35, .10, 1.0);
    vec3 hot = vec3(1.0, .20, .035);
    vec3 ivory = vec3(1.0, .77, .47);
    vec3 color = mix(cold, hot, warm);
    color = mix(color, ivory, clamp(core * .36 + pulse * .085, 0.0, .48));
    color = mix(color, vec3(1.0, .16, .06), uInstability * (1.0 - uControl) * .46);
    float emission = .023 + rim * .24 + core * .28 + bands * .026;
    if (uLayer > 1.5) {
      color = mix(vec3(.30, .08, .83), color, .22);
      emission = rim * .115 + thin * .015 + fine * .004;
    } else if (uLayer < .5) {
      emission *= 1.30;
      color = mix(color, ivory, .19);
    }
    float breathe = .96 + .04 * sin(uTime * .71 + vTheta * 3.0);
    float alpha = emission * uOpacity * (.36 + uEnergy * .72) * breathe;
    gl_FragColor = vec4(color * (1.13 + core * .50), min(.68, alpha));
  }
`;

const fieldVertex = /* glsl */`
  ${PARAMETRIC_GLSL}
  uniform float uFamily;
  varying float vTravel;
  varying float vSeed;
  void main() {
    float travel = position.x;
    float seed = position.y;
    float rho = position.z;
    float theta = travel;
    float phi = seed + travel * .5;
    if (uFamily > .5 && uFamily < 1.5) phi = seed;
    if (uFamily > 1.5) { theta = seed; phi = travel; }
    vec3 p = torusPoint(theta, phi, rho);
    vTravel = travel;
    vSeed = seed;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fieldFragment = /* glsl */`
  ${PARAMETRIC_GLSL}
  uniform float uOpacity;
  uniform float uFamily;
  varying float vTravel;
  varying float vSeed;
  void main() {
    float signal = pow(max(0.0, sin(vTravel * 1.5 - uTime * (1.05 + uEnergy * 1.3) + vSeed * 2.0)), 28.0);
    float longSignal = pow(max(0.0, sin(vTravel * .5 - uTime * .23 + vSeed)), 8.0);
    vec3 color = mix(vec3(.41, .24, 1.0), vec3(.83, .68, 1.0), signal);
    if (uFamily > .5 && uFamily < 1.5) color = mix(vec3(.23, .48, 1.0), vec3(.65, .84, 1.0), signal);
    if (uFamily > 1.5) color = mix(vec3(1.0, .39, .16), vec3(1.0, .76, .42), signal);
    color = mix(color, vec3(1.0, .28, .09), uInstability * (1.0 - uControl) * .6);
    float alpha = uOpacity * (.17 + signal * .74 + longSignal * .08);
    gl_FragColor = vec4(color * (1.0 + signal * .54), alpha);
  }
`;

const particleVertex = /* glsl */`
  ${PARAMETRIC_GLSL}
  attribute float aSize;
  uniform float uDpr;
  uniform float uOpacity;
  varying float vBrightness;
  varying float vRadius;
  void main() {
    float speed = .13 + uEnergy * .61;
    float theta = position.x + uTime * speed * (1.1 - position.z * .27);
    float phi = position.y + theta * .5;
    vec3 p = torusPoint(theta, phi, position.z);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vRadius = position.z;
    vBrightness = (.58 + .42 * sin(position.y * 17.0 + uTime * .9)) * uOpacity;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(aSize * uDpr * 17.0 / max(2.0, -mv.z), 1.0, 6.7 * uDpr);
  }
`;

const particleFragment = /* glsl */`
  ${PARAMETRIC_GLSL}
  varying float vBrightness;
  varying float vRadius;
  void main() {
    vec2 q = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(q, q);
    if (r2 > 1.0) discard;
    float core = exp(-r2 * 7.5);
    float halo = exp(-r2 * 3.5) * .25;
    vec3 inner = mix(vec3(.85, .57, 1.), vec3(1., .76, .47), uHeat);
    vec3 color = mix(inner, vec3(.60, .37, 1.), smoothstep(.56, .96, vRadius));
    color = mix(color, vec3(1., .25, .12), uInstability * (1.0 - uControl) * .55);
    gl_FragColor = vec4(color * (1.15 + core), (core + halo) * vBrightness);
  }
`;

const pulseVertex = /* glsl */`
  ${PARAMETRIC_GLSL}
  attribute float aSide;
  varying float vTheta;
  varying float vSide;
  varying float vSeed;
  void main() {
    float theta = position.x;
    float seed = position.y;
    float phi = seed + theta * .5 + aSide * .023;
    vec3 p = torusPoint(theta, phi, position.z);
    vTheta = theta;
    vSeed = seed;
    vSide = aSide;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
  }
`;

const pulseFragment = /* glsl */`
  ${PARAMETRIC_GLSL}
  uniform float uOpacity;
  varying float vTheta;
  varying float vSeed;
  varying float vSide;
  void main() {
    float wave = .5 + .5 * sin(vTheta * 2.0 - uTime * (.9 + uEnergy * 1.3) + vSeed);
    float pulse = pow(wave, 20.0);
    float edge = exp(-vSide * vSide * 3.1);
    vec3 color = mix(vec3(.72, .40, 1.0), vec3(1.0, .67, .34), uHeat);
    color = mix(color, vec3(1.0, .93, .79), pulse * .7);
    float alpha = (.045 + pulse * .76) * edge * uOpacity;
    gl_FragColor = vec4(color * (1.18 + pulse * .72), alpha);
  }
`;

// A view-facing optical ribbon follows the torus centerline. Its analytic
// falloff gives light a soft spatial presence without a full-screen blur pass.
const radianceVertex = /* glsl */`
  ${PARAMETRIC_GLSL}
  attribute float aSide;
  uniform float uStar;
  varying float vSide;
  varying float vTheta;
  void main() {
    float theta = position.x;
    vec3 p = torusPoint(theta, 0.0, 0.0);
    vec3 next = torusPoint(theta + .004, 0.0, 0.0);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec4 mt = modelViewMatrix * vec4(next, 1.0);
    vec2 tangent = normalize(mt.xy - mv.xy);
    vec2 normal = vec2(-tangent.y, tangent.x);
    float spread = 1.17 + uEnergy * .14 + uStar * .06;
    mv.xy += normal * aSide * spread;
    vSide = aSide;
    vTheta = theta;
    gl_Position = projectionMatrix * mv;
  }
`;

const radianceFragment = /* glsl */`
  ${PARAMETRIC_GLSL}
  uniform float uOpacity;
  uniform float uStar;
  varying float vSide;
  varying float vTheta;
  void main() {
    float side = vSide + .017 * sin(vTheta * 9.0 - uTime * .53);
    float core = exp(-side * side * 148.0);
    float nearGlow = exp(-side * side * 22.0);
    float halo = exp(-side * side * 4.3);
    float packet = pow(.5 + .5 * sin(vTheta * 2.0 - uTime * (.58 + uEnergy * .38)), 6.0);
    float detail = .88 + .12 * sin(vTheta * 13.0 + uTime * .7);
    float concentration = (.36 + packet * .64) * detail;
    vec3 violet = vec3(.39, .16, 1.0);
    vec3 orange = vec3(1.0, .30, .07);
    vec3 hot = vec3(1.0, .88, .66);
    vec3 color = mix(violet, orange, smoothstep(.14, .90, uHeat));
    color = mix(color, hot, clamp(core * (.61 + uStar * .27) + nearGlow * .13, 0.0, .95));
    float alpha = core * (.40 + uStar * .22) * concentration;
    alpha += nearGlow * (.15 + packet * .07) + halo * .058;
    alpha *= 1.0 - smoothstep(.76, 1.0, abs(vSide));
    alpha *= uOpacity;
    gl_FragColor = vec4(color * (1.25 + core * (.85 + uStar * .25)), min(.95, alpha));
  }
`;

const envelopeVertex = /* glsl */`
  varying float vDash;
  void main() {
    vDash = uv.x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const envelopeFragment = /* glsl */`
  uniform float uOpacity;
  uniform float uTime;
  uniform float uControl;
  varying float vDash;
  void main() {
    float dash = step(.33, fract(vDash * 80.));
    float sync = pow(max(0., sin(vDash * 6.2831853 - uTime * .22)), 8.);
    vec3 color = mix(vec3(.49, .47, .63), vec3(.47, .72, .93), uControl);
    gl_FragColor = vec4(color, uOpacity * (.17 + .32 * dash + .16 * sync));
  }
`;

/** Procedural optical / mechanical model, intentionally distinct from a simulation. */
export class Reactor {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
  private world = new THREE.Group();
  private hardware = new THREE.Group();
  private materials: Physical[] = [];
  private vessel: VesselPart[] = [];
  private stationParts: StationPart[] = [];
  private pf: { mesh: THREE.Mesh; y: number; radius: number }[] = [];
  private shaderMaterials: THREE.ShaderMaterial[] = [];
  private plasmaMaterials: THREE.ShaderMaterial[] = [];
  private fieldMaterials: THREE.ShaderMaterial[] = [];
  private particleMaterial!: THREE.ShaderMaterial;
  private pulseMaterial!: THREE.ShaderMaterial;
  private radianceMaterial!: THREE.ShaderMaterial;
  private envelopeMaterial!: THREE.ShaderMaterial;
  private particles!: THREE.Points;
  private innerLight!: THREE.PointLight;
  private violetLight!: THREE.PointLight;
  private environmentTarget?: THREE.WebGLRenderTarget;
  private width = 1;
  private height = 1;
  private pixelRatio = 1;
  private quality: ReactorFrame['quality'] = 'auto';
  private mobile = false;
  private previousAssembly = -1;
  private previousCutaway = -1;
  private previousMetal = -1;
  private stopped = false;
  private matrix = new THREE.Matrix4();
  private rotation = new THREE.Matrix4();
  private shift = new THREE.Matrix4();
  private temp = new THREE.Vector3();
  private camRight = new THREE.Vector3();
  private camUp = new THREE.Vector3();
  private target = new THREE.Vector3();
  private clockTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance', precision: 'highp', stencil: false, depth: true });
    this.renderer.setClearColor(0x030405, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;
    this.renderer.sortObjects = true;
    this.scene.add(this.world);
    this.world.add(this.hardware);
    this.createEnvironment();
    this.createLighting();
    this.createMachine();
    this.createPlasma();
    this.createFields();
    this.createParticles();
    this.createPulses();
    this.createRadiance();
    this.createEnvelope();
    this.resize(canvas.clientWidth || innerWidth, canvas.clientHeight || innerHeight);
  }

  private createEnvironment() {
    // An original light stage generated in memory. No photographs, downloads,
    // or hidden image dependency: these strips are reflected by real metal BRDFs.
    const surface = document.createElement('canvas');
    surface.width = 1024;
    surface.height = 512;
    const ctx = surface.getContext('2d');
    if (!ctx) return;
    const ambient = ctx.createLinearGradient(0, 0, 0, 512);
    ambient.addColorStop(0, '#23262c');
    ambient.addColorStop(.36, '#171a20');
    ambient.addColorStop(.65, '#090a0d');
    ambient.addColorStop(1, '#14131a');
    ctx.fillStyle = ambient;
    ctx.fillRect(0, 0, 1024, 512);
    const panel = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
    };
    panel(74, 80, 33, 286, '#c2bbb0');
    panel(118, 74, 10, 296, '#9da6b7');
    panel(288, 70, 275, 42, '#b5bbc1');
    panel(622, 130, 43, 238, '#6f7a94');
    panel(750, 226, 167, 23, '#b18462');
    panel(807, 128, 13, 200, '#c6c0b1');
    panel(941, 88, 21, 216, '#7e8eaa');
    panel(337, 361, 190, 9, '#7e4c32');
    const texture = new THREE.CanvasTexture(surface);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.environmentTarget = pmrem.fromEquirectangular(texture);
    this.scene.environment = this.environmentTarget.texture;
    pmrem.dispose();
    texture.dispose();
  }

  private createLighting() {
    const fill = new THREE.HemisphereLight(0xe7edf4, 0x1e0e08, 1.12);
    this.scene.add(fill);
    const key = new THREE.DirectionalLight(0xffe8d0, 3.3);
    key.position.set(2.5, 6.7, 7.8);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xb8c8ff, 2.35);
    rim.position.set(-6, 4, -5);
    this.scene.add(rim);
    const edge = new THREE.DirectionalLight(0xffae68, 1.9);
    edge.position.set(5, -1, -4);
    this.scene.add(edge);
    this.innerLight = new THREE.PointLight(0xff8c42, 24, 10, 2);
    this.innerLight.position.set(1.7, .25, 1.6);
    this.world.add(this.innerLight);
    this.violetLight = new THREE.PointLight(0x9066ff, 16, 8, 2);
    this.violetLight.position.set(-1.8, .6, -.4);
    this.world.add(this.violetLight);
  }

  private metal(color: number, metalness: number, roughness: number, extra: Partial<THREE.MeshPhysicalMaterialParameters> = {}): THREE.MeshPhysicalMaterial {
    const material = new THREE.MeshPhysicalMaterial({ color, metalness, roughness, envMapIntensity: .83, transparent: true, opacity: 1, ...extra });
    this.materials.push(material);
    return material;
  }

  private addMesh(geometry: THREE.BufferGeometry, material: THREE.Material, position?: [number, number, number], group = this.hardware): THREE.Mesh {
    const mesh = new THREE.Mesh(geometry, material);
    if (position) mesh.position.set(...position);
    group.add(mesh);
    return mesh;
  }

  private addStationPart(geometry: THREE.BufferGeometry, material: THREE.Material, transforms: THREE.Matrix4[]) {
    const count = 18 * transforms.length;
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    const local: THREE.Matrix4[] = [];
    const stations: number[] = [];
    for (let station = 0; station < 18; station++) for (const transform of transforms) {
      local.push(transform);
      stations.push(station);
    }
    this.hardware.add(mesh);
    this.stationParts.push({ mesh, local, stations });
  }

  private createMachine() {
    const graphite = this.metal(0x272c30, .86, .39);
    const titanium = this.metal(0x6c7275, .93, .36);
    const paleTitanium = this.metal(0x9ca2a3, .95, .29);
    const copper = this.metal(0xa75f30, .97, .28, { clearcoat: .12, clearcoatRoughness: .32 });
    const darkCopper = this.metal(0x744222, .96, .32);
    const black = this.metal(0x15191d, .79, .41);
    const tungsten = this.metal(0x555356, .89, .39, { side: THREE.DoubleSide });
    const identity = new THREE.Matrix4();

    // Eighteen toroidal-field stations. Copper laminations follow the complete
    // D path; housings, fastening plates, and bolts share station transforms.
    this.addStationPart(dBand(1.385, 1.235, .31, .020), graphite, [identity]);
    this.addStationPart(dBand(1.253, 1.106, .33, .013), copper, [identity]);
    this.addStationPart(dBand(1.399, 1.355, .35, .009), titanium, [identity]);
    this.addStationPart(dBand(1.127, 1.085, .35, .009), paleTitanium, [identity]);
    const faceTransforms = [new THREE.Matrix4().makeTranslation(0, 0, .185), new THREE.Matrix4().makeTranslation(0, 0, -.185)];
    this.addStationPart(dBand(1.285, 1.235, .018, .004), darkCopper, faceTransforms);

    const windingParts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 8; i++) {
      windingParts.push(new THREE.TubeGeometry(new DLoop(1.122 + i * .0164, .177), 80, .0054, 4, true));
      windingParts.push(new THREE.TubeGeometry(new DLoop(1.122 + i * .0164, -.177), 80, .0054, 4, true));
    }
    const windings = mergeGeometries(windingParts);
    windingParts.forEach(geometry => geometry.dispose());
    if (windings) this.addStationPart(windings, copper, [identity]);

    const clamps: THREE.Matrix4[] = [];
    const bolts: THREE.Matrix4[] = [];
    const inserts: THREE.Matrix4[] = [];
    const object = new THREE.Object3D();
    for (let i = 0; i < 12; i++) {
      const phi = i / 12 * TAU;
      const point = profile(phi, 1.393);
      const tangent = profile(phi + .001, 1.393).sub(point).normalize();
      object.position.copy(point);
      object.rotation.set(0, 0, Math.atan2(tangent.y, tangent.x) - Math.PI / 2);
      object.updateMatrix();
      clamps.push(object.matrix.clone());
      for (const side of [-1, 1]) {
        const localBolt = new THREE.Matrix4().makeRotationX(Math.PI / 2);
        localBolt.setPosition(point.x, point.y, side * .252);
        bolts.push(localBolt);
      }
      const lamp = profile(phi, 1.318, .222);
      object.position.copy(lamp);
      object.scale.set(1, 1, 1);
      object.updateMatrix();
      inserts.push(object.matrix.clone());
    }
    this.addStationPart(new THREE.BoxGeometry(.105, .185, .476, 1, 1, 1), titanium, clamps);
    this.addStationPart(new THREE.CylinderGeometry(.028, .028, .026, 6), black, bolts);
    this.addStationPart(new THREE.BoxGeometry(.026, .054, .014), darkCopper, inserts);

    // The vacuum vessel is genuinely segmented. The upper front sector is
    // omitted in the cutaway; bottom panels preserve the continuous chamber.
    for (let i = 0; i < 18; i++) {
      const theta = i / 18 * TAU;
      const thetaEnd = (i + 1) / 18 * TAU;
      const middle = (theta + thetaEnd) / 2;
      const front = smooth(.12, .8, Math.cos(middle - .93));
      const bottomMaterial = tungsten.clone();
      this.materials.push(bottomMaterial);
      const bottom = this.addMesh(vesselPatch(theta + .010, thetaEnd - .010, Math.PI * .985, TAU + .018, 1.004), bottomMaterial);
      this.vessel.push({ mesh: bottom, angle: middle, top: false, front, material: bottomMaterial });
      const topMaterial = graphite.clone();
      topMaterial.side = THREE.DoubleSide;
      this.materials.push(topMaterial);
      const top = this.addMesh(vesselPatch(theta + .012, thetaEnd - .012, .012, Math.PI - .012, 1.006), topMaterial);
      this.vessel.push({ mesh: top, angle: middle, top: true, front, material: topMaterial });
    }

    // Repeating inner-wall tile seams supply a credible scale cue.
    const seams: number[] = [];
    for (let i = 0; i < 108; i++) {
      const theta = i / 108 * TAU;
      for (let j = 0; j < 18; j++) {
        for (const phi of [Math.PI + j / 18 * Math.PI, Math.PI + (j + 1) / 18 * Math.PI]) {
          const section = 1.014 * MECHANICAL_SECTION;
          const r = MAJOR + section * Math.cos(phi + DELTA * Math.sin(phi));
          seams.push(r * Math.cos(theta), section * KAPPA * Math.sin(phi), r * Math.sin(theta));
        }
      }
    }
    const seamGeometry = new THREE.BufferGeometry();
    seamGeometry.setAttribute('position', new THREE.Float32BufferAttribute(seams, 3));
    const seamMaterial = new THREE.LineBasicMaterial({ color: 0x8f785f, transparent: true, opacity: .23, depthWrite: false });
    const seamLines = new THREE.LineSegments(seamGeometry, seamMaterial);
    seamLines.userData.hardwareLine = true;
    this.hardware.add(seamLines);

    // Six separate poloidal-field coils and their mechanical retainers.
    const pfRings: [number, number][] = [[3.99, -.56], [3.88, .74], [2.91, 1.62], [2.87, -1.65], [1.57, 1.47], [1.58, -1.46]];
    for (const [radius, y] of pfRings) {
      const mesh = this.addMesh(latheRing(radius, .057, .11, .012), copper, [0, y, 0]);
      this.pf.push({ mesh, y, radius });
      const trim = this.addMesh(latheRing(radius, .065, .016, .003), titanium, [0, y + .061, 0]);
      this.pf.push({ mesh: trim, y: y + .061, radius });
      const darkTrim = this.addMesh(latheRing(radius, .064, .019, .003), graphite, [0, y - .06, 0]);
      this.pf.push({ mesh: darkTrim, y: y - .06, radius });
    }
    this.addMesh(latheRing(3.14, .26, .14, .025), graphite, [0, -1.645, 0]);
    this.addMesh(latheRing(3.365, .026, .035, .006), paleTitanium, [0, -1.71, 0]);
    this.addMesh(latheRing(3.10, .205, .055, .010), black, [0, -1.754, 0]);
    this.addMesh(latheRing(1.445, .17, .14, .015), titanium, [0, -1.645, 0]);

    // A short central solenoid, with broad pole pieces and close copper winding.
    this.addMesh(new THREE.CylinderGeometry(.614, .614, 2.23, 96, 1), darkCopper, [0, -.045, 0]);
    this.addMesh(new THREE.CylinderGeometry(.648, .648, .116, 96, 1), graphite, [0, 1.115, 0]);
    this.addMesh(new THREE.CylinderGeometry(.68, .68, .095, 96, 1), titanium, [0, -1.175, 0]);
    this.addMesh(latheRing(.57, .065, .035, .006), paleTitanium, [0, 1.18, 0]);
    this.addMesh(new THREE.CylinderGeometry(.515, .515, .027, 96, 1), black, [0, 1.198, 0]);
    const solenoidWireGeo = new THREE.TorusGeometry(.620, .006, 4, 72);
    solenoidWireGeo.rotateX(Math.PI / 2);
    const solenoidWires = new THREE.InstancedMesh(solenoidWireGeo, copper, 64);
    for (let i = 0; i < 64; i++) solenoidWires.setMatrixAt(i, new THREE.Matrix4().makeTranslation(0, -1.104 + i * .0341, 0));
    this.hardware.add(solenoidWires);
    for (let i = 0; i < 7; i++) {
      const y = -1.08 + i * .35;
      this.addMesh(latheRing(.625, .032, .043, .004), i % 2 ? graphite : titanium, [0, y, 0]);
    }
    const pillarGeo = new THREE.BoxGeometry(.095, 2.35, .085);
    const pillars = new THREE.InstancedMesh(pillarGeo, titanium, 8);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      object.position.set(.713 * Math.cos(a), -.07, .713 * Math.sin(a));
      object.rotation.set(0, -a, 0);
      object.updateMatrix();
      pillars.setMatrixAt(i, object.matrix);
    }
    this.hardware.add(pillars);

    // Low radial supports and six diagnostic ports.
    const supportGeo = new THREE.BoxGeometry(1.97, .10, .105);
    const supports = new THREE.InstancedMesh(supportGeo, graphite, 18);
    for (let i = 0; i < 18; i++) {
      const a = i / 18 * TAU;
      object.position.set(2.48 * Math.cos(a), -1.55, 2.48 * Math.sin(a));
      object.rotation.set(0, -a, 0);
      object.updateMatrix();
      supports.setMatrixAt(i, object.matrix);
    }
    this.hardware.add(supports);
    const portGeo = new THREE.CylinderGeometry(.134, .134, .56, 20, 1);
    portGeo.rotateZ(Math.PI / 2);
    const portFlangeGeo = latheRing(.164, .031, .08, .008);
    portFlangeGeo.rotateZ(Math.PI / 2);
    const portCaps = new THREE.InstancedMesh(new THREE.CylinderGeometry(.117, .117, .013, 20).rotateZ(Math.PI / 2), black, 6);
    const ports = new THREE.InstancedMesh(portGeo, graphite, 6);
    const flanges = new THREE.InstancedMesh(portFlangeGeo, titanium, 6);
    for (let i = 0; i < 6; i++) {
      const a = (i + .5) / 6 * TAU;
      object.rotation.set(0, -a, 0);
      object.position.set(3.76 * Math.cos(a), -.46, 3.76 * Math.sin(a));
      object.updateMatrix();
      ports.setMatrixAt(i, object.matrix);
      object.position.set(4.04 * Math.cos(a), -.46, 4.04 * Math.sin(a));
      object.updateMatrix();
      flanges.setMatrixAt(i, object.matrix);
      object.position.set(4.086 * Math.cos(a), -.46, 4.086 * Math.sin(a));
      object.updateMatrix();
      portCaps.setMatrixAt(i, object.matrix);
    }
    this.hardware.add(ports, flanges, portCaps);
    this.updateStations(0, 0);
  }

  private uniforms(extra: Record<string, THREE.IUniform> = {}): Record<string, THREE.IUniform> {
    return {
      uTime: { value: 0 }, uEnergy: { value: .6 }, uInstability: { value: 0 },
      uControl: { value: 0 }, uHeat: { value: .8 }, uField: { value: .7 },
      uOpacity: { value: 1 }, ...extra,
    };
  }

  private shader(vertexShader: string, fragmentShader: string, extra: Record<string, THREE.IUniform> = {}): THREE.ShaderMaterial {
    const material = new THREE.ShaderMaterial({
      vertexShader, fragmentShader, uniforms: this.uniforms(extra),
      transparent: true, depthWrite: false, depthTest: true,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, forceSinglePass: true,
    });
    this.shaderMaterials.push(material);
    return material;
  }

  private createPlasma() {
    const geometry = parametricSurface();
    const layers = [{ radius: .31, layer: 0 }, { radius: .55, layer: 1 }, { radius: .66, layer: 1 }, { radius: .81, layer: 2 }, { radius: .95, layer: 2 }];
    layers.forEach(({ radius, layer }, index) => {
      const material = this.shader(plasmaVertex, plasmaFragment, { uRadius: { value: radius }, uLayer: { value: layer } });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = false;
      mesh.renderOrder = 12 + index;
      this.world.add(mesh);
      this.plasmaMaterials.push(material);
    });
  }

  private createFields() {
    for (let family = 0; family < 3; family++) {
      const positions: number[] = [];
      const lineCount = family === 0 ? 18 : 12;
      const segments = family === 0 ? 320 : 192;
      const turns = family === 0 ? 2 : 1;
      for (let line = 0; line < lineCount; line++) {
        const seed = line / lineCount * TAU;
        const rho = family === 0 ? .85 + (line % 4) * .074 : 1.07 + (line % 3) * .035;
        for (let segment = 0; segment < segments; segment++) {
          positions.push(segment / segments * TAU * turns, seed, rho);
          positions.push((segment + 1) / segments * TAU * turns, seed, rho);
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const material = this.shader(fieldVertex, fieldFragment, { uFamily: { value: family } });
      const lines = new THREE.LineSegments(geometry, material);
      lines.frustumCulled = false;
      lines.renderOrder = 20 + family;
      this.world.add(lines);
      this.fieldMaterials.push(material);
    }
  }

  private createParticles() {
    let seed = 197304;
    const random = () => { seed = Math.imul(seed ^ seed >>> 15, 1 | seed); seed ^= seed + Math.imul(seed ^ seed >>> 7, 61 | seed); return ((seed ^ seed >>> 14) >>> 0) / 4294967296; };
    const count = 3400;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = random() * TAU;
      positions[i * 3 + 1] = random() * TAU;
      positions[i * 3 + 2] = .075 + Math.pow(random(), .57) * .835;
      sizes[i] = .75 + Math.pow(random(), 3) * 2.6;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    this.particleMaterial = this.shader(particleVertex, particleFragment, { uDpr: { value: 1 } });
    this.particles = new THREE.Points(geometry, this.particleMaterial);
    this.particles.frustumCulled = false;
    this.particles.renderOrder = 24;
    this.world.add(this.particles);
  }

  private createPulses() {
    const positions: number[] = [];
    const sides: number[] = [];
    const indices: number[] = [];
    const strands = 7;
    const segments = 224;
    for (let strand = 0; strand < strands; strand++) {
      const seed = strand / strands * TAU;
      const rho = .20 + (strand % 4) * .105;
      const base = positions.length / 3;
      for (let i = 0; i <= segments; i++) {
        const theta = i / segments * TAU * 2;
        positions.push(theta, seed, rho, theta, seed, rho);
        sides.push(-1, 1);
        if (i < segments) {
          const n = base + i * 2;
          indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('aSide', new THREE.Float32BufferAttribute(sides, 1));
    geometry.setIndex(indices);
    this.pulseMaterial = this.shader(pulseVertex, pulseFragment);
    const pulse = new THREE.Mesh(geometry, this.pulseMaterial);
    pulse.frustumCulled = false;
    pulse.renderOrder = 23;
    this.world.add(pulse);
  }

  private createRadiance() {
    const positions: number[] = [];
    const sides: number[] = [];
    const indices: number[] = [];
    const segments = 240;
    for (let i = 0; i <= segments; i++) {
      const theta = i / segments * TAU;
      positions.push(theta, 0, 0, theta, 0, 0);
      sides.push(-1, 1);
      if (i < segments) {
        const n = i * 2;
        indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('aSide', new THREE.Float32BufferAttribute(sides, 1));
    geometry.setIndex(indices);
    this.radianceMaterial = this.shader(radianceVertex, radianceFragment, { uStar: { value: 0 } });
    const radiance = new THREE.Mesh(geometry, this.radianceMaterial);
    radiance.frustumCulled = false;
    radiance.renderOrder = 9;
    this.world.add(radiance);
  }

  private createEnvelope() {
    const positions: number[] = [];
    const uv: number[] = [];
    const addRing = (radius: number, y: number) => {
      for (let i = 0; i < 240; i++) for (const j of [i, i + 1]) {
        const a = j / 240 * TAU;
        positions.push(Math.cos(a) * radius, y, Math.sin(a) * radius);
        uv.push(j / 240, 0);
      }
    };
    addRing(4.35, -1.87);
    addRing(4.29, -1.87);
    addRing(1.455, 0);
    addRing(3.8, 0);
    for (let i = 0; i < 144; i++) {
      const a = i / 144 * TAU;
      const r = i % 6 === 0 ? 4.13 : 4.26;
      positions.push(Math.cos(a) * r, -1.87, Math.sin(a) * r, Math.cos(a) * 4.34, -1.87, Math.sin(a) * 4.34);
      uv.push(1, 0, 1, 0);
    }
    // A quiet target envelope; true D-section contours, fixed in the laboratory.
    for (let section = 0; section < 6; section++) {
      const theta = section / 6 * TAU;
      for (let i = 0; i < 180; i++) for (const j of [i, i + 1]) {
        const phi = j / 180 * TAU;
        const r = MAJOR + 1.155 * Math.cos(phi + DELTA * Math.sin(phi));
        positions.push(r * Math.cos(theta), 1.155 * KAPPA * Math.sin(phi), r * Math.sin(theta));
        uv.push(j / 180, 0);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    this.envelopeMaterial = this.shader(envelopeVertex, envelopeFragment);
    const envelope = new THREE.LineSegments(geometry, this.envelopeMaterial);
    envelope.renderOrder = 27;
    this.world.add(envelope);
  }

  private updateStations(assembly: number, cutaway: number) {
    if (Math.abs(assembly - this.previousAssembly) < .0005 && Math.abs(cutaway - this.previousCutaway) < .0005) return;
    this.previousAssembly = assembly;
    this.previousCutaway = cutaway;
    const transforms: THREE.Matrix4[] = [];
    for (let station = 0; station < 18; station++) {
      const angle = station / 18 * TAU;
      const facing = smooth(.56, .95, Math.cos(angle - .93));
      const out = assembly * (.055 + facing * .275) * (.5 + cutaway * .5);
      this.rotation.makeRotationY(-angle);
      this.shift.makeTranslation(Math.cos(angle) * out, 0, Math.sin(angle) * out);
      transforms.push(new THREE.Matrix4().multiplyMatrices(this.shift, this.rotation));
    }
    for (const part of this.stationParts) {
      for (let i = 0; i < part.local.length; i++) {
        this.matrix.multiplyMatrices(transforms[part.stations[i]], part.local[i]);
        part.mesh.setMatrixAt(i, this.matrix);
      }
      part.mesh.instanceMatrix.needsUpdate = true;
    }
    for (const { mesh, y, radius } of this.pf) {
      mesh.position.y = y + Math.sign(y) * assembly * (Math.abs(y) > 1.3 ? .35 : .12);
      const expansion = 1 + assembly * .014 * (radius > 2 ? 1 : .4);
      mesh.scale.set(expansion, 1, expansion);
    }
  }

  private applyQuality(quality: ReactorFrame['quality']) {
    this.quality = quality;
    const device = window.devicePixelRatio || 1;
    const large = this.width * this.height > 3500000;
    const limit = quality === 'low' ? 1 : quality === 'high' ? 1.65 : this.mobile ? 1.45 : large ? 1 : 1.5;
    this.pixelRatio = Math.min(device, limit);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(this.width, this.height, false);
    this.particleMaterial.uniforms.uDpr.value = this.pixelRatio;
    this.particles.geometry.setDrawRange(0, quality === 'low' ? 1600 : this.mobile ? 2400 : 3400);
  }

  resize(width: number, height: number): void {
    if (this.stopped) return;
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.mobile = this.width < 760 && this.height > this.width;
    this.camera.aspect = this.width / this.height;
    this.camera.fov = this.mobile ? 42 : 34;
    this.camera.updateProjectionMatrix();
    this.applyQuality(this.quality);
  }

  render(frame: ReactorFrame): void {
    if (this.stopped) return;
    if (frame.quality !== this.quality) this.applyQuality(frame.quality);
    const pose = scenePose(frame.p);
    const energy = clamp(frame.energy, 0, 1);
    const field = clamp(frame.field, 0, 1);
    const control = clamp(frame.control, 0, 1);
    const instability = clamp(frame.instability, 0, 1);
    const stellar = smooth(5.83, 6.22, frame.p) * (1 - smooth(6.73, 7.18, frame.p));
    const confinement = smooth(1.82, 2.20, frame.p) * (1 - smooth(2.72, 3.14, frame.p));
    // The shared clock freezes for reduced motion or pause, without a phase reset.
    this.clockTime = frame.time;
    const time = this.clockTime;
    for (const material of this.shaderMaterials) {
      material.uniforms.uTime.value = time;
      material.uniforms.uEnergy.value = energy;
      material.uniforms.uInstability.value = instability;
      material.uniforms.uControl.value = control;
      material.uniforms.uHeat.value = clamp(frame.heat, 0, 1);
      material.uniforms.uField.value = field;
    }
    this.plasmaMaterials.forEach((material, index) => {
      const layerOpacity = [.78, .95, .57, .34, .17][index];
      material.uniforms.uOpacity.value = pose.glow * layerOpacity;
    });
    const selected = clamp(Math.round(frame.fieldMode), 0, 2);
    this.fieldMaterials.forEach((material, family) => {
      const focused = selected === 0 ? (family === 0 ? .70 : .12) : (family === selected ? 1.02 : .05);
      const legibility = family === selected || (selected === 0 && family === 0) ? 1 + confinement * .52 : 1;
      material.uniforms.uOpacity.value = pose.flux * focused * (.24 + field * .86) * legibility;
    });
    this.particleMaterial.uniforms.uOpacity.value = (.30 + energy * .70) * pose.glow;
    this.pulseMaterial.uniforms.uOpacity.value = (.40 + energy * .46) * pose.glow;
    this.radianceMaterial.uniforms.uOpacity.value = pose.glow * (.25 + energy * .75) * (1 + stellar * .30);
    this.radianceMaterial.uniforms.uStar.value = stellar;
    this.envelopeMaterial.uniforms.uOpacity.value = pose.envelope;

    const assembly = clamp(pose.explode * (.72 + clamp(frame.assembly, 0, 1) * .28), 0, 1);
    const cutaway = clamp(frame.cutaway, 0, 1);
    const machineFocus = smooth(.86, 1.14, frame.p) * (1 - smooth(1.92, 2.23, frame.p));
    this.updateStations(assembly, cutaway);
    const metalOpacity = smooth(.07, 1, pose.metal);
    this.hardware.visible = metalOpacity > .005;
    if (Math.abs(metalOpacity - this.previousMetal) > .0001) {
      this.previousMetal = metalOpacity;
      this.materials.forEach(material => {
        material.opacity = metalOpacity;
        material.depthWrite = metalOpacity > .92;
      });
      this.hardware.traverse(object => {
        if (object.userData.hardwareLine && object instanceof THREE.LineSegments) {
          (object.material as THREE.LineBasicMaterial).opacity = .23 * metalOpacity;
        }
      });
    }
    for (const panel of this.vessel) {
      if (panel.top) {
        // The cut opens only the relevant physical sector. Rear casing retains
        // its silhouette; removed panels spread out in the machine chapter.
        const reveal = mix(Math.max(.86, cutaway), cutaway, machineFocus);
        const opening = panel.front * reveal;
        const panelOpacity = metalOpacity * (1 - opening) * .89;
        panel.material.opacity = panelOpacity;
        panel.material.depthWrite = panelOpacity > .92;
        panel.mesh.visible = panelOpacity > .055;
        const spread = mix(1, .10 + cutaway * .90, machineFocus);
        const out = assembly * panel.front * .52 * spread;
        panel.mesh.position.set(Math.cos(panel.angle) * out, assembly * (.17 + panel.front * .44) * spread, Math.sin(panel.angle) * out);
      } else {
        panel.material.opacity = metalOpacity * .76;
        panel.material.depthWrite = metalOpacity > .96;
      }
    }

    this.innerLight.intensity = (14 + energy * 27) * (.92 + Math.sin(time * .62) * .045);
    this.innerLight.color.setRGB(1, mix(.25, .50, control), mix(.10, .80, control));
    this.violetLight.intensity = 13 + field * 20;
    this.violetLight.position.x = -1.7 + Math.sin(time * .14) * .20;

    this.camera.position.set(...pose.camera);
    // A deliberate wheel movement still changes depth during every living hold.
    // The sinusoid is continuous at chapter boundaries and reversible in p.
    const wheelPhase = frame.p * TAU;
    this.camera.position.multiplyScalar(1 + Math.sin(wheelPhase) * .012);
    this.camera.position.applyAxisAngle(Y_AXIS, Math.sin(wheelPhase + .2) * .006);
    if (this.mobile) {
      // Compose for portrait: object fills the width, copy owns the lower area.
      const portraitFit = Math.max(1.18, .78 / Math.max(.32, this.camera.aspect));
      const shortScreenFit = mix(1.32, 1, smooth(640, 780, this.height));
      this.camera.position.multiplyScalar(portraitFit * shortScreenFit);
    } else if (this.camera.aspect < 1.42) {
      this.camera.position.multiplyScalar(1.42 / this.camera.aspect);
    }
    const cameraDistance = this.camera.position.length();
    const drift = frame.reducedMotion ? 0 : .012;
    this.camera.position.x += Math.sin(time * .097) * drift + clamp(frame.pointerX, -1, 1) * .065;
    this.camera.position.y += Math.cos(time * .113) * drift + clamp(frame.pointerY, -1, 1) * .045;
    this.camera.lookAt(0, 0, 0);
    this.camRight.set(1, 0, 0).applyQuaternion(this.camera.quaternion);
    this.camUp.set(0, 1, 0).applyQuaternion(this.camera.quaternion);
    const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * cameraDistance;
    const visibleWidth = visibleHeight * this.camera.aspect;
    const centerX = this.mobile ? .51 : pose.x;
    const centerY = this.mobile ? .475 : pose.y;
    this.target.copy(this.camRight).multiplyScalar(-(centerX - .5) * visibleWidth);
    this.temp.copy(this.camUp).multiplyScalar((centerY - .5) * visibleHeight);
    this.target.add(this.temp);
    this.camera.position.add(this.target);
    this.camera.lookAt(this.target);
    this.renderer.render(this.scene, this.camera);
  }

  stats(): { drawCalls: number; triangles: number; pixelRatio: number } {
    return { drawCalls: this.renderer.info.render.calls, triangles: this.renderer.info.render.triangles, pixelRatio: this.pixelRatio };
  }

  /** Screen-space leaders follow actual visible parts, including section spread. */
  projectAnchors(): { solenoid: { x: number; y: number }; coil: { x: number; y: number } } {
    const solenoid = new THREE.Vector3(this.camera.position.x, 0, this.camera.position.z).normalize().multiplyScalar(.635);
    solenoid.y = .63;
    solenoid.project(this.camera);
    const angle = TAU / 18;
    const facing = smooth(.56, .95, Math.cos(angle - .93));
    const assembly = Math.max(0, this.previousAssembly);
    const cutaway = Math.max(0, this.previousCutaway);
    const out = assembly * (.055 + facing * .275) * (.5 + cutaway * .5);
    const coil = profile(.45, 1.335).applyAxisAngle(Y_AXIS, -angle);
    coil.x += Math.cos(angle) * out;
    coil.z += Math.sin(angle) * out;
    coil.project(this.camera);
    return {
      solenoid: { x: solenoid.x * .5 + .5, y: .5 - solenoid.y * .5 },
      coil: { x: coil.x * .5 + .5, y: .5 - coil.y * .5 },
    };
  }

  dispose(): void {
    if (this.stopped) return;
    this.stopped = true;
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    this.scene.traverse(object => {
      const drawable = object as THREE.Mesh;
      if (drawable.geometry) geometries.add(drawable.geometry);
      if (drawable.material) {
        const values = Array.isArray(drawable.material) ? drawable.material : [drawable.material];
        values.forEach(material => materials.add(material));
      }
    });
    this.materials.forEach(material => materials.add(material));
    this.shaderMaterials.forEach(material => materials.add(material));
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    this.environmentTarget?.dispose();
    this.renderer.dispose();
  }
}
