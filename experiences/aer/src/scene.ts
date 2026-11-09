import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BALLOON_IDENTITY, createBalloon, createPerson, envelopeRadius, tubeBetween, type BalloonModel } from './balloon.ts';
import { SUN_DIRECTION, WIND_LAYERS, getLanding, getRoute, reducedSceneState, terrainHeight, type SceneState, type WindLayer } from './journey.ts';

export interface SceneOptions {
  reduced: boolean;
  paused: boolean;
  shape: 'rest' | 'held';
  /** A deliberately narrow observation angle, from -1 to 1. */
  look: number;
  /** Milliseconds. The owner freezes this clock when decorative motion is paused. */
  time: number;
  mobile: boolean;
}

export const SCENE_LIMITS = Object.freeze({
  desktopDpr: 1.75,
  mobileDpr: 1.4,
  desktopPixels: 4_200_000,
  mobilePixels: 2_000_000,
  maximumDrawingDimension: 8192,
  maximumCssDimension: 16384,
});

/** CPU-only drawing-buffer budget; CSS composition retains its own dimensions. */
export function drawingBudget(width: number, height: number, deviceDpr: number, mobile: boolean, hardwareDimension: number = SCENE_LIMITS.maximumDrawingDimension) {
  const dimension = (value: number) => Number.isFinite(value) ? Math.max(1, Math.min(SCENE_LIMITS.maximumCssDimension, Math.floor(value))) : 1;
  const w = dimension(width);
  const h = dimension(height);
  const density = Number.isFinite(deviceDpr) && deviceDpr > 0 ? deviceDpr : 1;
  const maxDimension = Math.max(1, Math.min(SCENE_LIMITS.maximumDrawingDimension, Number.isFinite(hardwareDimension) ? Math.floor(hardwareDimension) : SCENE_LIMITS.maximumDrawingDimension));
  const ratio = Math.min(
    density,
    mobile ? SCENE_LIMITS.mobileDpr : SCENE_LIMITS.desktopDpr,
    Math.sqrt((mobile ? SCENE_LIMITS.mobilePixels : SCENE_LIMITS.desktopPixels) / (w * h)),
    maxDimension / w,
    maxDimension / h,
  );
  const pixelWidth = Math.max(1, Math.floor(w * ratio));
  const pixelHeight = Math.max(1, Math.floor(h * ratio));
  return { width: w, height: h, ratio, pixelWidth, pixelHeight, pixels: pixelWidth * pixelHeight };
}

const LAYERS: readonly WindLayer[] = ['low', 'middle', 'high'];
const TAU = Math.PI * 2;
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (v: number) => { const t = clamp(v); return t * t * (3 - 2 * t); };

function randomGenerator(seed: number): () => number {
  let state = seed >>> 0;
  return () => { state = (1664525 * state + 1013904223) >>> 0; return state / 4294967296; };
}

function skyTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 512;
  const context = canvas.getContext('2d')!;
  const gradient = context.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, '#A7B8D5');
  gradient.addColorStop(0.55, '#CAD2DC');
  gradient.addColorStop(0.83, '#E3DDD3');
  gradient.addColorStop(1, '#F6F1E8');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 16, 512);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function groundTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d')!;
  const data = context.createImageData(128, 128);
  const random = randomGenerator(5842);
  for (let y = 0; y < 128; y += 1) {
    for (let x = 0; x < 128; x += 1) {
      const value = 220 + (random() - 0.5) * 28 + (y % 9 === 0 ? -4 : 0);
      const i = (y * 128 + x) * 4;
      data.data[i] = data.data[i + 1] = data.data[i + 2] = value;
      data.data[i + 3] = 255;
    }
  }
  context.putImageData(data, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(60, 60);
  return texture;
}

function surfaceGeometry(x0: number, z0: number, width: number, depth: number, segments: number, warp = false): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let j = 0; j <= segments; j += 1) {
    for (let i = 0; i <= segments; i += 1) {
      let x = x0 + (i / segments) * width;
      let z = z0 + (j / segments) * depth;
      if (warp) {
        const originalX = x;
        x += 6.8 * Math.sin(z * 0.022);
        z += 5.6 * Math.sin(originalX * 0.021);
      }
      positions.push(x, terrainHeight(x, z) + (warp ? 0.018 : 0), z);
      uvs.push((x + 600) / 1200, (z + 600) / 1200);
      if (i < segments && j < segments) {
        const a = j * (segments + 1) + i;
        const b = a + segments + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function groundedRibbon(points: { x: number; z: number }[], width: number, material: THREE.Material): THREE.Mesh {
  const vertices: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i < points.length; i += 1) {
    const before = points[Math.max(0, i - 1)]!;
    const after = points[Math.min(points.length - 1, i + 1)]!;
    const dx = after.x - before.x;
    const dz = after.z - before.z;
    const length = Math.hypot(dx, dz) || 1;
    for (const sign of [-1, 1]) {
      const x = points[i]!.x + (dz / length) * width * 0.5 * sign;
      const z = points[i]!.z - (dx / length) * width * 0.5 * sign;
      vertices.push(x, terrainHeight(x, z) + 0.042, z);
    }
    if (i > 0) {
      const a = (i - 1) * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, material);
}

export function createMeadowPatch(x: number, z: number, rx: number, rz: number, material: THREE.Material): THREE.Mesh {
  const segments = 64;
  const rings = 8;
  const positions = [x, terrainHeight(x, z) + 0.035, z];
  const indices: number[] = [];
  // Radial subdivision prevents a large center-to-edge triangle from cutting
  // through the curved field beneath it, particularly at the high meadow.
  for (let ring = 1; ring <= rings; ring += 1) {
    for (let i = 0; i < segments; i += 1) {
      const a = (i / segments) * TAU;
      const xx = x + Math.sin(a) * rx * (ring / rings);
      const zz = z + Math.cos(a) * rz * (ring / rings);
      positions.push(xx, terrainHeight(xx, zz) + 0.035, zz);
      const next = (i + 1) % segments;
      const outer = 1 + (ring - 1) * segments + i;
      const outerNext = 1 + (ring - 1) * segments + next;
      if (ring === 1) indices.push(0, outer, outerNext);
      else {
        const inner = outer - segments;
        const innerNext = outerNext - segments;
        indices.push(inner, outer, outerNext, inner, outerNext, innerNext);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, material);
}

/** A ray-projected envelope silhouette. Its vertices sit on the actual terrain. */
class TerrainShadow {
  readonly mesh: THREE.Mesh;
  private source: { x: number; z: number }[];
  private restingSource: { x: number; z: number }[];
  private positions = new Float32Array((1 + 64 * 2) * 3);
  private material: THREE.ShaderMaterial;

  constructor() {
    const makeOutline = (resting: boolean): { x: number; z: number }[] => {
    const candidates: { x: number; z: number }[] = [];
    for (let j = 0; j <= 48; j += 1) {
      const t = j / 48;
      const r = envelopeRadius(t);
      const y = BALLOON_IDENTITY.mouthHeight + t * 24 * (resting ? 0.64 : 1);
      for (let i = 0; i < 48; i += 1) {
        const a = (i / 48) * TAU;
        candidates.push({ x: Math.sin(a) * r + y * 0.5, z: Math.cos(a) * r + y * 0.25 });
      }
    }
    candidates.sort((a, b) => a.x - b.x || a.z - b.z);
    const cross = (o: { x: number; z: number }, a: { x: number; z: number }, b: { x: number; z: number }) => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
    const lower: typeof candidates = [];
    const upper: typeof candidates = [];
    for (const p of candidates) {
      while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) lower.pop();
      lower.push(p);
    }
    for (let i = candidates.length - 1; i >= 0; i -= 1) {
      const p = candidates[i]!;
      while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) upper.pop();
      upper.push(p);
    }
    lower.pop(); upper.pop();
    const hull = [...lower, ...upper];
    const lengths = [0];
    for (let i = 0; i < hull.length; i += 1) {
      const a = hull[i]!;
      const b = hull[(i + 1) % hull.length]!;
      lengths.push(lengths[i]! + Math.hypot(b.x - a.x, b.z - a.z));
    }
    const total = lengths[lengths.length - 1]!;
    return Array.from({ length: 64 }, (_, index) => {
      const distance = (index / 64) * total;
      let i = 0;
      while (i < hull.length - 1 && lengths[i + 1]! < distance) i += 1;
      const a = hull[i]!;
      const b = hull[(i + 1) % hull.length]!;
      const f = (distance - lengths[i]!) / (lengths[i + 1]! - lengths[i]!);
      return { x: mix(a.x, b.x, f), z: mix(a.z, b.z, f) };
    });
    };
    this.source = makeOutline(false);
    this.restingSource = makeOutline(true);
    const alpha = [1, ...Array(64).fill(1), ...Array(64).fill(0)];
    const indices: number[] = [];
    for (let i = 0; i < 64; i += 1) {
      const next = (i + 1) % 64;
      indices.push(0, i + 1, next + 1);
      indices.push(i + 1, i + 65, next + 1, next + 1, i + 65, next + 65);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('alpha', new THREE.Float32BufferAttribute(alpha, 1));
    geometry.setIndex(indices);
    this.material = new THREE.ShaderMaterial({
      uniforms: { opacity: { value: 0.25 }, shadowColor: { value: new THREE.Color('#3D4A5C') } },
      vertexShader: 'attribute float alpha; varying float vAlpha; void main(){vAlpha=alpha;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: 'uniform vec3 shadowColor; uniform float opacity; varying float vAlpha; void main(){gl_FragColor=vec4(shadowColor,vAlpha*opacity);}',
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    });
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.name = 'Sun-projected envelope silhouette on the shared terrain';
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 2;
  }

  update(state: SceneState, resting = false): void {
    const p = state.position;
    const project = (sx: number, sz: number): [number, number, number] => {
      const ox = p.x + sx - 9;
      const oz = p.z + sz - 4.5;
      const oy = p.y + 18;
      let near = 0; let far = 100;
      for (let k = 0; k < 16; k += 1) {
        const t = (near + far) / 2;
        if (oy - 2 * t > terrainHeight(ox + t, oz + 0.5 * t)) near = t;
        else far = t;
      }
      const t = (near + far) / 2;
      const x = ox + t; const z = oz + 0.5 * t;
      return [x, terrainHeight(x, z) + 0.074, z];
    };
    const center = project(9, 4.5);
    this.positions.set(center, 0);
    const softness = 0.35 + state.agl * 0.008;
    for (let i = 0; i < 64; i += 1) {
      const source = (resting ? this.restingSource : this.source)[i]!;
      const dx = source.x - 9; const dz = source.z - 4.5;
      const length = Math.hypot(dx, dz) || 1;
      this.positions.set(project(source.x, source.z), (i + 1) * 3);
      this.positions.set(project(source.x + (dx / length) * softness, source.z + (dz / length) * softness), (i + 65) * 3);
    }
    this.mesh.geometry.attributes.position!.needsUpdate = true;
    this.material.uniforms.opacity!.value = state.shadow.opacity;
  }
}

interface CameraPose {
  at: number;
  eye: readonly [number, number, number];
  target: readonly [number, number, number];
  fov: number;
  shift: number;
  kind: 'balloon' | 'shadow' | 'panorama';
}

const CAMERA_POSES: readonly CameraPose[] = [
  { at: 0, eye: [30, 10, -57], target: [0, 14.5, 0], fov: 39, shift: 0.18, kind: 'balloon' },
  { at: 0.75, eye: [30, 10, -57], target: [0, 14.5, 0], fov: 39, shift: 0.18, kind: 'balloon' },
  { at: 1.4, eye: [34, 13, -63], target: [0, 14.1, 0], fov: 38, shift: 0.19, kind: 'balloon' },
  { at: 2.5, eye: [29, 12, -61], target: [0, 14.0, 0], fov: 38, shift: 0.21, kind: 'balloon' },
  { at: 3.25, eye: [40, 15, -77], target: [0, 12.8, 0], fov: 42, shift: 0.18, kind: 'balloon' },
  { at: 3.7, eye: [43, 19, -78], target: [0, 7.5, 2], fov: 44, shift: 0.16, kind: 'balloon' },
  { at: 4.35, eye: [39, 41, -47], target: [-1, 1, 13], fov: 49, shift: 0.10, kind: 'shadow' },
  { at: 4.72, eye: [34, 43, -41], target: [0, 0, 13], fov: 49, shift: 0.09, kind: 'shadow' },
  { at: 5.30, eye: [65, 21, -91], target: [0, 12, 11], fov: 43, shift: 0.17, kind: 'balloon' },
  { at: 5.90, eye: [54, 17, -79], target: [0, 12, 13], fov: 43, shift: 0.17, kind: 'balloon' },
  { at: 6.45, eye: [29, 6, -54], target: [0, 8, 15], fov: 47, shift: 0.16, kind: 'balloon' },
  { at: 6.80, eye: [13, 3, -25], target: [0, 6, 30], fov: 51, shift: 0.12, kind: 'balloon' },
  { at: 7.28, eye: [0, 1.85, -0.65], target: [0, 0.7, 80], fov: 61, shift: 0, kind: 'panorama' },
  { at: 7.83, eye: [0, 1.85, -0.65], target: [0, 0.7, 80], fov: 61, shift: 0, kind: 'panorama' },
  { at: 8.18, eye: [10, 8, -25], target: [0, 9, 4], fov: 48, shift: 0.10, kind: 'balloon' },
  { at: 8.64, eye: [29, 11, -54], target: [0, 13.4, 0], fov: 42, shift: 0.18, kind: 'balloon' },
  { at: 8.90, eye: [34, 9, -60], target: [0, 13.8, 0], fov: 40, shift: 0.18, kind: 'balloon' },
  { at: 9.60, eye: [39, 8, -67], target: [0, 13.0, 0], fov: 39, shift: 0.18, kind: 'balloon' },
  { at: 10, eye: [39, 8, -67], target: [0, 13.0, 0], fov: 39, shift: 0.18, kind: 'balloon' },
];

/**
 * A single scene owner; no RAF, scroll listeners, controls, timers or network.
 * Call render after Lenis / native scroll has produced the coordinated state.
 */
export class JourneyScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(39, 1, 0.08, 2200);
  private readonly balloon: BalloonModel;
  private readonly shadow = new TerrainShadow();
  private readonly basketShadow: THREE.Mesh;
  private readonly contactShadow: THREE.Mesh;
  private readonly routeLines: Record<WindLayer, THREE.Line>;
  private readonly rope: THREE.Mesh;
  private readonly ropeRestPositions: Float32Array;
  private readonly windGroups: THREE.Group[] = [];
  private readonly observer = new THREE.Vector3();
  private readonly target = new THREE.Vector3();
  private width = 1;
  private height = 1;
  private disposed = false;
  private lastShadowKey = '';
  private lastDpr = 0;
  private mobile = false;
  private maxRenderDimension: number = SCENE_LIMITS.maximumDrawingDimension;
  private drawingWidth = 0;
  private drawingHeight = 0;
  private lastRopeKey = '';

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
    const context = this.renderer.getContext();
    this.maxRenderDimension = Math.min(SCENE_LIMITS.maximumDrawingDimension, context.getParameter(context.MAX_RENDERBUFFER_SIZE) as number);
    // CSS size and drawing resolution are separate. This also keeps extreme
    // skinny viewports at a valid minimum of one physical pixel per dimension.
    this.renderer.setPixelRatio(1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.setClearColor('#C9D1DA', 1);
    this.scene.background = skyTexture();
    this.scene.fog = new THREE.Fog('#C4CDD4', 135, 720);
    const skyLight = new THREE.HemisphereLight('#E1E9F4', '#8E977E', 2.05);
    this.scene.add(skyLight);
    const sunlight = new THREE.DirectionalLight('#FFF2DB', 2.8);
    sunlight.position.set(SUN_DIRECTION.x * 100, SUN_DIRECTION.y * 100, SUN_DIRECTION.z * 100);
    this.scene.add(sunlight);
    this.scene.add(new THREE.AmbientLight('#D6DEE8', 0.15));

    this.createGround();
    this.createScenery();
    this.createHills();
    this.createWindLayers();
    this.balloon = createBalloon();
    this.scene.add(this.balloon.group);
    this.scene.add(this.shadow.mesh);

    const basketShadowMaterial = new THREE.MeshBasicMaterial({ color: '#48515B', transparent: true, opacity: 0.23, depthWrite: false, side: THREE.DoubleSide });
    this.basketShadow = new THREE.Mesh(new THREE.PlaneGeometry(2.22, 1.55), basketShadowMaterial);
    this.basketShadow.rotation.x = -Math.PI / 2;
    this.basketShadow.renderOrder = 3;
    this.scene.add(this.basketShadow);
    const contactMaterial = new THREE.MeshBasicMaterial({ color: '#3E464C', transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide });
    this.contactShadow = new THREE.Mesh(new THREE.CircleGeometry(1, 32), contactMaterial);
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.scale.set(1.16, 0.84, 1);
    this.contactShadow.renderOrder = 3;
    this.scene.add(this.contactShadow);

    this.routeLines = {} as Record<WindLayer, THREE.Line>;
    for (const layer of LAYERS) {
      const points = getRoute(layer).map(p => new THREE.Vector3(p.x, terrainHeight(p.x, p.z) + 0.105, p.z));
      const material = new THREE.LineBasicMaterial({ color: WIND_LAYERS[layer].color, transparent: true, opacity: 0.6, depthWrite: false });
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
      line.name = `${WIND_LAYERS[layer].destination} — integrated ground trace`;
      line.renderOrder = 4;
      this.routeLines[layer] = line;
      this.scene.add(line);
    }

    const ropeMaterial = new THREE.MeshStandardMaterial({ color: '#A1845B', roughness: 1 });
    const coil = Array.from({ length: 80 }, (_, i) => {
      const t = i / 79;
      const a = t * TAU * 2.4;
      const r = 0.45 + t * 1.1;
      return new THREE.Vector3(3.7 + Math.cos(a) * r, 0.08, 1.0 + Math.sin(a) * r * 0.72);
    });
    this.rope = tubeBetween([new THREE.Vector3(0.95, 0.3, 0.62), new THREE.Vector3(2, 0.08, 1.7), ...coil], 0.035, ropeMaterial, 96);
    this.ropeRestPositions = new Float32Array(this.rope.geometry.attributes.position!.array);
    this.scene.add(this.rope);
  }

  private createGround(): void {
    const texture = groundTexture();
    const base = new THREE.MeshStandardMaterial({ color: '#A6B5A0', roughness: 1, map: texture });
    const underlay = surfaceGeometry(-1200, -800, 2400, 2400, 100);
    // A 24-unit triangle can interpolate above the analytic, gently curved
    // surface. Keep this distant underlay below that interpolation envelope;
    // the fine fields, road, meadows and grounded objects retain one height field.
    underlay.translate(0, -0.16, 0);
    this.scene.add(new THREE.Mesh(underlay, base));
    const palettes = ['#ACB8A0', '#A6B09A', '#A1AF9F', '#B5BA9F', '#A7B7A5', '#BEC0A5', '#9FAE98'];
    const materials = palettes.map(color => new THREE.MeshStandardMaterial({ color, roughness: 1, map: texture }));
    const fieldGroups: THREE.BufferGeometry[][] = palettes.map(() => []);
    const random = randomGenerator(63921);
    for (let j = 0; j < 9; j += 1) {
      for (let i = 0; i < 10; i += 1) {
        const x = -300 + i * 60;
        const z = -150 + j * 60;
        fieldGroups[Math.floor(random() * materials.length)]!.push(surfaceGeometry(x + 0.6, z + 0.6, 58.8, 58.8, 8, true));
      }
    }
    fieldGroups.forEach((geometries, i) => {
      const field = new THREE.Mesh(mergeGeometries(geometries)!, materials[i]);
      field.name = 'Curved, shared field boundaries';
      this.scene.add(field);
      for (const geometry of geometries) geometry.dispose();
    });
    const roadMaterial = new THREE.MeshStandardMaterial({ color: '#E3D8BF', roughness: 1, side: THREE.DoubleSide });
    const road = Array.from({ length: 230 }, (_, i) => {
      const z = -180 + i * 2.2;
      return { x: -12 + 9 * Math.sin(z * 0.027) + 3 * Math.cos(z * 0.08), z };
    });
    const whitePath = groundedRibbon(road, 1.4, roadMaterial);
    whitePath.name = 'The same ivory road through the common prefix';
    this.scene.add(whitePath);
    const middle = getLanding('middle');
    const villagePath = Array.from({ length: 100 }, (_, i) => {
      const t = i / 99;
      return { x: mix(-10, middle.x - 25, t) + Math.sin(t * Math.PI) * 14, z: mix(110, middle.z - 15, t) };
    });
    this.scene.add(groundedRibbon(villagePath, 1.25, roadMaterial));
    for (const layer of LAYERS) {
      const landing = getLanding(layer);
      const color = { low: '#ADB99D', middle: '#BCC3A4', high: '#BEC2AA' }[layer];
      const meadow = createMeadowPatch(landing.x, landing.z, layer === 'high' ? 25 : 17, layer === 'high' ? 20 : 13, new THREE.MeshStandardMaterial({ color, roughness: 1, side: THREE.DoubleSide }));
      meadow.name = WIND_LAYERS[layer].destination;
      this.scene.add(meadow);
    }
  }

  private createScenery(): void {
    const random = randomGenerator(61922);
    const treeData: { x: number; z: number; size: number; willow?: boolean }[] = [];
    for (let i = 0; i < 150; i += 1) {
      const x = -240 + random() * 480;
      const z = -100 + random() * 480;
      if (Math.hypot(x, z) < 22) continue;
      if (LAYERS.some(l => Math.hypot(x - getLanding(l).x, z - getLanding(l).z) < 19)) continue;
      treeData.push({ x, z, size: 0.6 + random() * 1.3 });
    }
    const low = getLanding('low');
    // The low route's paired tree rows are an authored landmark, not random
    // scenery. Both remain outside the open landing pad around the basket.
    for (let row = 0; row < 2; row += 1) {
      for (let i = 0; i < 17; i += 1) {
        treeData.push({ x: low.x + 18 + row * 5 + Math.sin(i) * 0.6, z: low.z - 19 + i * 2.4, size: 0.65 + random() * 0.25 });
      }
    }
    const middle = getLanding('middle');
    for (let i = 0; i < 7; i += 1) treeData.push({ x: middle.x - 14 - i * 2.8, z: middle.z + 8 + Math.sin(i) * 3, size: 1.2 + random() * 0.3, willow: true });
    // Far Meadow's oval grove sits beside, rather than on, the clear meadow.
    // Its nearest trunks are 31 units east of the basket; the meadow radius is 25.
    const high = getLanding('high');
    for (let i = 0; i < 20; i += 1) {
      const angle = (i / 20) * TAU;
      treeData.push({ x: high.x + 42 + Math.cos(angle) * 11, z: high.z + 12 + Math.sin(angle) * 7, size: 0.85 + random() * 0.25 });
    }
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: '#867A61', roughness: 1 });
    const leavesMaterial = new THREE.MeshStandardMaterial({ color: '#85977B', roughness: 1 });
    const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.10, 0.15, 1.5, 5), trunkMaterial, treeData.length);
    const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), leavesMaterial, treeData.length * 3);
    const transform = new THREE.Object3D();
    const color = new THREE.Color();
    treeData.forEach((tree, i) => {
      const ground = terrainHeight(tree.x, tree.z);
      transform.position.set(tree.x, ground + tree.size * 0.7, tree.z);
      transform.scale.set(tree.size, tree.size, tree.size);
      transform.rotation.set(0, random() * TAU, 0);
      transform.updateMatrix();
      trunks.setMatrixAt(i, transform.matrix);
      for (let j = 0; j < 3; j += 1) {
        transform.position.set(tree.x + (j - 1) * tree.size * 0.5, ground + tree.size * (tree.willow ? 2.05 : 1.9) + (j === 1 ? 0.25 : 0), tree.z + (j === 1 ? 0.35 : 0));
        transform.scale.set(tree.size * (tree.willow ? 1.3 : 1.1), tree.size * (tree.willow ? 1.65 : 1.0), tree.size * 1.08);
        transform.rotation.set(random() * 0.3, random() * TAU, random() * 0.2);
        transform.updateMatrix();
        crowns.setMatrixAt(i * 3 + j, transform.matrix);
        color.set(tree.willow ? '#879C7F' : '#8E9E80').multiplyScalar(0.88 + random() * 0.22);
        crowns.setColorAt(i * 3 + j, color);
      }
    });
    this.scene.add(trunks, crowns);

    const houseMaterial = new THREE.MeshStandardMaterial({ color: '#CFC7AE', roughness: 1 });
    const roofMaterial = new THREE.MeshStandardMaterial({ color: '#9C8D80', roughness: 1 });
    const darkWindow = new THREE.MeshStandardMaterial({ color: '#6C706A', roughness: 1 });
    for (let i = 0; i < 8; i += 1) {
      const x = middle.x - 28 + (i % 4) * 5.4;
      const z = middle.z - 28 + Math.floor(i / 4) * 6.7;
      const ground = terrainHeight(x, z);
      const height = 2.4 + random() * 0.9;
      const house = new THREE.Group();
      const wall = new THREE.Mesh(new THREE.BoxGeometry(3.1, height, 3.8), houseMaterial);
      wall.position.y = height / 2;
      house.add(wall);
      const roofGeometry = new THREE.CylinderGeometry(2.5, 2.5, 4.15, 3, 1, false, Math.PI / 2);
      roofGeometry.rotateX(Math.PI / 2);
      const roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.scale.set(0.76, 0.44, 1);
      roof.position.y = height + 0.16;
      house.add(roof);
      for (const dx of [-0.8, 0.8]) {
        const window = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.62), darkWindow);
        window.position.set(dx, height * 0.56, -1.906);
        window.rotation.y = Math.PI;
        house.add(window);
      }
      house.position.set(x, ground, z);
      house.rotation.y = (random() - 0.5) * 0.25;
      this.scene.add(house);
    }
    const bellTower = new THREE.Group();
    const tower = new THREE.Mesh(new THREE.BoxGeometry(1.6, 6, 1.6), houseMaterial);
    tower.position.y = 3;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1.4, 4), roofMaterial);
    roof.position.y = 6.65;
    roof.rotation.y = Math.PI / 4;
    bellTower.add(tower, roof);
    bellTower.position.set(middle.x - 17, terrainHeight(middle.x - 17, middle.z - 30), middle.z - 30);
    this.scene.add(bellTower);

    const crewTemplates = [createPerson('#6D7264'), createPerson('#7A7162')];
    for (const location of [{ x: 0, z: 0 }, ...LAYERS.map(l => getLanding(l))]) {
      [-1, 1].forEach((side, i) => {
        const person = crewTemplates[i]!.clone(true);
        const x = location.x + side * 2.8;
        const z = location.z + 0.1 + i * 0.5;
        person.position.set(x, terrainHeight(x, z), z);
        person.rotation.y = side * 1.1;
        this.scene.add(person);
      });
    }
  }

  private createHills(): void {
    const random = randomGenerator(612);
    for (let band = 0; band < 3; band += 1) {
      const vertices: number[] = [];
      const indices: number[] = [];
      const z = 430 + band * 175;
      for (let i = 0; i <= 120; i += 1) {
        const x = -1500 + i * 25;
        const height = 18 + band * 7 + Math.sin(x * 0.008 + band * 2) * 9 + Math.sin(x * 0.022) * 4 + random() * 3;
        vertices.push(x, -6, z, x, height, z + Math.sin(x * 0.005) * 22);
        if (i > 0) { const a = (i - 1) * 2; indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      const material = new THREE.MeshBasicMaterial({ color: ['#8896AA', '#98A5B7', '#ACB7C7'][band], side: THREE.DoubleSide, fog: true });
      this.scene.add(new THREE.Mesh(geometry, material));
    }
  }

  private createWindLayers(): void {
    for (const layer of LAYERS) {
      const definition = WIND_LAYERS[layer];
      const group = new THREE.Group();
      const color = new THREE.Color(definition.color);
      const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.33, depthWrite: false });
      for (let row = 0; row < 4; row += 1) {
        const x = -40 + row * 24;
        const z = 49 + row * 7;
        const y = definition.altitude + 7;
        const length = 16;
        const norm = Math.hypot(definition.wind.x, definition.wind.z);
        const dx = definition.wind.x / norm;
        const dz = definition.wind.z / norm;
        const start = new THREE.Vector3(x, y, z);
        const end = new THREE.Vector3(x + dx * length, y, z + dz * length);
        const points = [start, end, new THREE.Vector3(end.x - dx * 2 + dz, y, end.z - dz * 2 - dx), end, new THREE.Vector3(end.x - dx * 2 - dz, y, end.z - dz * 2 + dx)];
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
      }
      group.name = `Authored ${layer} wind direction — no meteorological data`;
      this.windGroups.push(group);
      this.scene.add(group);
    }
  }

  resize(width: number, height: number): void {
    if (this.disposed) return;
    const budget = drawingBudget(width, height, window.devicePixelRatio, this.mobile, this.maxRenderDimension);
    this.width = budget.width;
    this.height = budget.height;
    this.resizeDrawingBuffer();
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  private resizeDrawingBuffer(): void {
    const budget = drawingBudget(this.width, this.height, window.devicePixelRatio, this.mobile, this.maxRenderDimension);
    this.lastDpr = budget.ratio;
    if (budget.pixelWidth !== this.drawingWidth || budget.pixelHeight !== this.drawingHeight) {
      this.drawingWidth = budget.pixelWidth;
      this.drawingHeight = budget.pixelHeight;
      this.renderer.setSize(this.drawingWidth, this.drawingHeight, false);
    }
  }

  private positionCamera(state: SceneState, options: SceneOptions): void {
    const p = state.progress;
    let index = 0;
    while (index < CAMERA_POSES.length - 2 && p > CAMERA_POSES[index + 1]!.at) index += 1;
    const a = CAMERA_POSES[index]!;
    const b = CAMERA_POSES[index + 1]!;
    const f = smooth((p - a.at) / (b.at - a.at));
    const pose = (key: 'eye' | 'target', axis: number) => mix(a[key][axis]!, b[key][axis]!, f);
    const nearPanorama = smooth((p - 6.9) / 0.36) * (1 - smooth((p - 7.86) / 0.3));
    const distanceScale = options.mobile ? mix(1.38, 1, nearPanorama) : 1;
    let ex = pose('eye', 0) * distanceScale;
    let ey = pose('eye', 1) * distanceScale;
    let ez = pose('eye', 2) * distanceScale;
    const tx = pose('target', 0);
    let ty = pose('target', 1);
    let tz = pose('target', 2);
    // Downward views keep the physical projected shadow as their anchor.
    const shadowWeight = smooth((p - 3.65) / 0.65) * (1 - smooth((p - 4.72) / 0.62));
    const groundTargetY = state.shadow.y - state.position.y;
    ty = mix(ty, groundTargetY + 1, shadowWeight);
    tz = mix(tz, state.shadow.z - state.position.z, shadowWeight);
    const look = clamp(options.look, -1, 1) * 0.11 * nearPanorama;
    const baseTargetX = tx + Math.sin(look) * 70;
    ez += (1 - Math.cos(look)) * 2;
    // At takeoff the camera partly holds the ground, so contact is visibly lost.
    const groundHold = smooth((p - 3) / 0.18) * (1 - smooth((p - 3.6) / 0.45));
    ey -= state.agl * 0.32 * groundHold;
    ty -= state.agl * 0.20 * groundHold;
    this.observer.set(state.position.x + ex, state.position.y + ey, state.position.z + ez);
    this.target.set(state.position.x + baseTargetX, state.position.y + ty, state.position.z + tz);
    this.camera.position.copy(this.observer);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(this.target);
    this.camera.fov = mix(a.fov, b.fov, f) * (options.mobile ? 1.03 : 1);
    const shift = options.mobile ? 0 : mix(a.shift, b.shift, f);
    const verticalShift = options.mobile ? mix(0.15, 0.065, nearPanorama) : 0;
    this.camera.setViewOffset(this.width, this.height, -this.width * shift, -this.height * verticalShift, this.width, this.height);
    this.camera.updateProjectionMatrix();
  }

  render(inputState: SceneState, options: SceneOptions): void {
    if (this.disposed) return;
    const state = options.reduced ? reducedSceneState(inputState) : inputState;
    this.mobile = options.mobile;
    this.resizeDrawingBuffer();
    this.balloon.group.position.set(state.position.x, state.position.y, state.position.z);
    // A restrained whole-assembly sway never alters the deterministic flight path.
    const sway = !options.reduced && !options.paused && state.agl > 3 && state.chapter < 8 ? Math.sin(options.time * 0.00031) * 0.003 : 0;
    this.balloon.group.rotation.set(0, 0.1, sway);
    const resting = state.chapter === 1 && options.shape === 'rest';
    this.balloon.setResting(resting);
    const shadowKey = `${state.position.x}:${state.position.y}:${state.position.z}:${resting}`;
    if (shadowKey !== this.lastShadowKey) { this.shadow.update(state, resting); this.lastShadowKey = shadowKey; }
    this.basketShadow.position.set(state.position.x + state.agl * 0.5, 0, state.position.z + state.agl * 0.25);
    this.basketShadow.position.y = terrainHeight(this.basketShadow.position.x, this.basketShadow.position.z) + 0.08;
    this.contactShadow.position.set(state.position.x, terrainHeight(state.position.x, state.position.z) + 0.085, state.position.z);
    (this.contactShadow.material as THREE.MeshBasicMaterial).opacity = 0.30 * (1 - clamp(state.agl / 4));
    this.basketShadow.visible = state.agl > 0.2;
    this.rope.visible = state.chapter === 9;
    this.rope.position.set(state.position.x, terrainHeight(state.position.x, state.position.z), state.position.z);
    const ropeKey = `${state.position.x}:${state.position.z}`;
    if (this.rope.visible && ropeKey !== this.lastRopeKey) {
      const positions = this.rope.geometry.attributes.position as THREE.BufferAttribute;
      const ground = terrainHeight(state.position.x, state.position.z);
      for (let i = 0; i < positions.count; i += 1) {
        const x = this.ropeRestPositions[i * 3]!;
        const y = this.ropeRestPositions[i * 3 + 1]!;
        const z = this.ropeRestPositions[i * 3 + 2]!;
        positions.setXYZ(i, x, y + terrainHeight(state.position.x + x, state.position.z + z) - ground, z);
      }
      positions.needsUpdate = true;
      this.rope.geometry.computeVertexNormals();
      this.rope.geometry.computeBoundingSphere();
      this.lastRopeKey = ropeKey;
    }
    for (let i = 0; i < 3; i += 1) {
      this.windGroups[i]!.visible = state.progress > 5.05 && state.progress < 6.25;
    }
    for (const layer of LAYERS) {
      const line = this.routeLines[layer];
      const active = layer === state.layer;
      line.visible = state.progress >= 5.22 && (active || state.progress < 6.12);
      const material = line.material as THREE.LineBasicMaterial;
      material.opacity = active ? 0.66 : 0.13;
      const route = getRoute(layer);
      if (state.chapter === 5) line.geometry.setDrawRange(0, route.length);
      else {
        let lo = 0; let hi = route.length;
        while (lo < hi) { const mid = (lo + hi) >>> 1; if (route[mid]!.progress <= state.progress) lo = mid + 1; else hi = mid; }
        line.geometry.setDrawRange(0, Math.max(2, lo));
      }
    }
    this.positionCamera(state, options);
    this.renderer.render(this.scene, this.camera);
  }

  stats(): Record<string, unknown> {
    return {
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures,
      programs: this.renderer.info.programs?.length ?? 0,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      dpr: this.lastDpr,
      drawingBuffer: { width: this.drawingWidth, height: this.drawingHeight, pixels: this.drawingWidth * this.drawingHeight },
      limits: SCENE_LIMITS,
      identity: BALLOON_IDENTITY,
      hasInternalAnimationLoop: false,
      disposed: this.disposed,
    };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    this.scene.traverse(object => {
      const mesh = object as THREE.Mesh;
      if (mesh.geometry) geometries.add(mesh.geometry);
      if (mesh.material) for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) materials.add(material);
    });
    if (this.scene.background instanceof THREE.Texture) textures.add(this.scene.background);
    for (const material of materials) {
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
      material.dispose();
    }
    for (const geometry of geometries) geometry.dispose();
    for (const texture of textures) texture.dispose();
    this.renderer.dispose();
    this.scene.clear();
  }
}
