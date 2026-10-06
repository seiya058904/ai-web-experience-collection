import * as THREE from 'three';
import { createGemMaterial } from './gemMaterial';

/**
 * Sculptures in their own local coordinates. The exhibition owns the group
 * transform, visibility, lights, camera and animation clock.
 *
 * Both stones face +Z. Jade is approximately 2 × 2.1 × 0.8 units. The closed
 * agate is approximately 2.2 × 2 × 0.65 units. `open` spreads its physical slices
 * along Z; update is absolute, and therefore reversible / safe to scrub.
 */
export interface OrganicStoneState {
  /** Elapsed seconds. Only used for extremely slow movement of transmitted light. */
  time?: number;
  /** Strength of the exhibition's backlight, from 0 to 1. */
  light?: number;
  /** Jade's apparent subsurface depth, from 0 to 1. */
  translucency?: number;
  /** Agate cross-section separation, from 0 to 1. */
  open?: number;
  reducedMotion?: boolean;
}

export interface OrganicStoneRig<MaterialType extends THREE.Material = THREE.MeshPhysicalMaterial> {
  group: THREE.Group;
  materials: MaterialType[];
  update(state: OrganicStoneState): void;
  dispose(): void;
}

export interface OrganicStoneOptions {
  quality?: 'high' | 'low';
}

type StoneUniforms = {
  uStoneTime: { value: number };
  uStoneLight: { value: number };
  uStoneTranslucency: { value: number };
  uStoneSlice: { value: number };
  uStoneSide: { value: number };
};

const saturate = (value: number) => THREE.MathUtils.clamp(value, 0, 1);

function makeUniforms(slice = 0, side = 0): StoneUniforms {
  return {
    uStoneTime: { value: 0 },
    uStoneLight: { value: 0.65 },
    uStoneTranslucency: { value: 0.65 },
    uStoneSlice: { value: slice },
    uStoneSide: { value: side },
  };
}

// Original procedural fields: deterministic material, no texture downloads,
// image canvas, noise package, shader dependency or per-frame allocation.
const stoneShaderHeader = /* glsl */ `
uniform float uStoneTime;
uniform float uStoneLight;
uniform float uStoneTranslucency;
uniform float uStoneSlice;
uniform float uStoneSide;
varying vec3 vStonePosition;
varying vec3 vStoneObjectNormal;

float stoneHash(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.x + p.y) * p.z);
}

float stoneNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(stoneHash(i), stoneHash(i + vec3(1.,0.,0.)), f.x),
        mix(stoneHash(i + vec3(0.,1.,0.)), stoneHash(i + vec3(1.,1.,0.)), f.x), f.y),
    mix(mix(stoneHash(i + vec3(0.,0.,1.)), stoneHash(i + vec3(1.,0.,1.)), f.x),
        mix(stoneHash(i + vec3(0.,1.,1.)), stoneHash(i + vec3(1.,1.,1.)), f.x), f.y), f.z);
}

float stoneFbm(vec3 p) {
  float result = 0.0;
  float amplitude = 0.53;
  mat3 turn = mat3(0.00, 0.80, 0.60, -0.80, 0.36, -0.48, -0.60, -0.48, 0.64);
  for (int octave = 0; octave < 4; octave++) {
    result += amplitude * stoneNoise(p);
    p = turn * p * 2.07 + vec3(1.9, 3.2, 0.7);
    amplitude *= 0.47;
  }
  return result;
}

// Small interlocking mineral domains. The returned values are nearest-grain
// distance, distance to a grain boundary, and a stable grain identity.
vec3 stoneMineral(vec2 p) {
  vec2 cell = floor(p);
  vec2 position = fract(p);
  float nearest = 8.0;
  float second = 8.0;
  float identity = 0.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbour = vec2(float(x), float(y));
      vec2 key = cell + neighbour;
      vec2 seed = vec2(stoneHash(vec3(key, 1.7)), stoneHash(vec3(key, 8.9)));
      vec2 offset = neighbour + 0.12 + 0.76 * seed - position;
      float distanceSquared = dot(offset, offset);
      if (distanceSquared < nearest) {
        second = nearest;
        nearest = distanceSquared;
        identity = stoneHash(vec3(key, 17.3));
      } else {
        second = min(second, distanceSquared);
      }
    }
  }
  return vec3(sqrt(nearest), sqrt(second) - sqrt(nearest), identity);
}

float stoneOutline(float angle) {
  return 1.0 + 0.065 * cos(3.0 * angle + 1.2)
             + 0.035 * sin(5.0 * angle + 0.5)
             + 0.014 * sin(9.0 * angle + 1.7);
}
`;

const jadeAlbedo = /* glsl */ `
  vec3 jadeP = vStonePosition;
  float jadeCloud = stoneFbm(jadeP * vec3(2.8, 2.5, 3.8) + vec3(2.2, 1.3, 0.8));
  float jadeFibres = stoneFbm(jadeP * vec3(12.0, 8.0, 19.0) + vec3(3.0, 8.2, 4.0));
  float jadeFragment = stoneFbm(jadeP * vec3(39.0, 31.0, 44.0) + vec3(4.3, 0.7, 2.0));
  float jadeFine = stoneNoise(jadeP * 143.0);
  vec2 jadeGrainPosition = jadeP.xy * 18.5 + jadeP.z * vec2(3.9, -2.7)
      + vec2(jadeFibres, jadeFragment) * 1.7;
  vec3 jadeMineral = stoneMineral(jadeGrainPosition);
  float jadeMilky = smoothstep(0.39, 0.58, jadeCloud + (jadeFragment - 0.45) * 0.20);
  // Broad green mineral rivers give the material a direction and a depth.
  // Sharper intermediate domains sit inside them; the polish remains smooth.
  float jadeFault = jadeP.y * 0.53 + jadeP.x * 0.62
       + (jadeCloud - 0.46) * 0.80 + (jadeFibres - 0.46) * 0.19;
  float jadeDarkRiver = 1.0 - smoothstep(0.13, 0.38, abs(jadeFault + 0.035));
  vec3 jadeBody = mix(vec3(0.043, 0.13, 0.074), vec3(0.29, 0.355, 0.285), jadeMilky);
  vec3 jadeDeepColor = mix(vec3(0.0025, 0.020, 0.011), vec3(0.015, 0.085, 0.044),
                          smoothstep(0.29, 0.67, jadeFibres));
  jadeBody = mix(jadeBody, jadeDeepColor, jadeDarkRiver * (0.77 + jadeMineral.z * 0.18));
  jadeBody *= 0.79 + jadeMineral.z * 0.25 + jadeFragment * 0.18;
  // Fine pale seams are internal mineral interfaces, not surface scratches.
  float jadeGrainEdge = 1.0 - smoothstep(0.007, 0.037, jadeMineral.y);
  jadeGrainEdge *= smoothstep(0.28, 0.60, jadeFragment) * 0.30;
  jadeBody = mix(jadeBody, vec3(0.29, 0.38, 0.29), jadeGrainEdge);
  float jadeHairline = 1.0 - smoothstep(0.0025, 0.009,
      abs(jadeFault + 0.09 + (jadeFragment - 0.5) * 0.035));
  jadeBody = mix(jadeBody, vec3(0.34, 0.40, 0.30), jadeHairline * 0.63);
  jadeBody += pow(jadeFine, 7.0) * 0.007;
  float jadeThinEdge = pow(1.0 - abs(normalize(vStoneObjectNormal).z), 2.2);
  // Thin, waxy edges receive more pale light than the deep body. This is a
  // thickness cue, deliberately subdued rather than a uniform green halo.
  jadeBody = mix(jadeBody, vec3(0.30, 0.375, 0.26), jadeThinEdge * 0.13);
  diffuseColor.rgb *= jadeBody;
`;

const jadeSubsurface = /* glsl */ `
  vec3 jadeBacklight = normalize(vec3(-0.72 + 0.05 * sin(uStoneTime * 0.09), 0.82, -0.62));
  float jadeWrap = pow(max(0.0, dot(-normalize(vStoneObjectNormal), jadeBacklight)), 1.6);
  float jadeDeep = smoothstep(0.16, 0.72, jadeCloud);
  vec3 jadeTransmission = mix(vec3(0.055, 0.15, 0.054), vec3(0.30, 0.36, 0.20), jadeThinEdge);
  outgoingLight += jadeTransmission * (0.016 + jadeWrap * 0.12 + jadeThinEdge * 0.065)
                   * (0.65 + jadeDeep * 0.35) * (1.0 - jadeDarkRiver * 0.45)
                   * uStoneLight * uStoneTranslucency;
`;

const agateAlbedo = /* glsl */ `
  vec2 agateUV = vStonePosition.xy / vec2(1.045, 0.945);
  float agateOuterAngle = atan(agateUV.y, agateUV.x);
  float agateOuter = length(agateUV) / stoneOutline(agateOuterAngle);
  vec2 agateP = agateUV - vec2(-0.115, 0.075);
  float agateAngle = atan(agateP.y, agateP.x);
  float agateRadius = length(agateP);
  float agateCloud = stoneFbm(vec3(agateP * 4.6, 2.1 + uStoneSlice * 0.21));
  // The off-centre growth field is warped at several scales. Bands follow
  // one geological contour without becoming concentric target circles.
  float agateWarpStrength = smoothstep(0.04, 0.34, agateRadius);
  float agateGrowth = agateRadius
       + 0.043 * sin(agateAngle * 3.0 + agateRadius * 2.3) * agateWarpStrength
       + 0.021 * cos(agateAngle * 7.0 + 1.7) * agateWarpStrength
       + 0.032 * (agateCloud - 0.5)
       + 0.008 * sin(agateAngle * 13.0 + agateRadius * 5.0) * agateWarpStrength
       + uStoneSlice * 0.013;
  float agatePhase = agateGrowth * 6.8
       + 0.41 * sin(agateGrowth * 8.7)
       + 0.12 * sin(agateGrowth * 29.0 + 0.3);
  float agateBand = fract(agatePhase);

  vec3 agateColor = mix(vec3(0.028, 0.038, 0.038), vec3(0.115, 0.13, 0.12),
                        smoothstep(0.015, 0.16, agateBand));
  agateColor = mix(agateColor, vec3(0.32, 0.32, 0.278), smoothstep(0.20, 0.28, agateBand));
  agateColor = mix(agateColor, vec3(0.125, 0.145, 0.139), smoothstep(0.34, 0.43, agateBand));
  agateColor = mix(agateColor, vec3(0.043, 0.047, 0.045), smoothstep(0.48, 0.57, agateBand));
  agateColor = mix(agateColor, vec3(0.23, 0.235, 0.209), smoothstep(0.62, 0.77, agateBand));
  agateColor = mix(agateColor, vec3(0.40, 0.385, 0.33), smoothstep(0.82, 0.89, agateBand));
  agateColor = mix(agateColor, vec3(0.028, 0.038, 0.038), smoothstep(0.96, 1.0, agateBand));
  // Warm iron-bearing layers occupy localized growth regions, leaving the
  // larger chalcedony bands smoky, cool and translucent in character.
  float agateWarmField = stoneFbm(vec3(agateP * 2.8 + vec2(0.7, 2.1), 5.0));
  float agateWarmth = smoothstep(0.35, 0.59, agateWarmField)
      * smoothstep(0.24, 0.39, agateGrowth) * (1.0 - smoothstep(0.72, 0.96, agateGrowth));
  float agateWarmBand = smoothstep(0.08, 0.20, agateBand) * (1.0 - smoothstep(0.43, 0.60, agateBand));
  agateColor = mix(agateColor, agateColor * vec3(1.6, 0.83, 0.46), agateWarmth * agateWarmBand * 0.76);

  float agateFilament = sin(agateGrowth * 440.0 + agateCloud * 2.5);
  float agateFilamentWidth = max(fwidth(agateGrowth) * 440.0, 0.055);
  float agateFineLine = smoothstep(0.80 - agateFilamentWidth, 0.94 + agateFilamentWidth, agateFilament);
  agateColor = mix(agateColor, vec3(0.37, 0.37, 0.325), agateFineLine * 0.14);
  float agateMicro = stoneNoise(vec3(agateP * 155.0, 1.4));
  agateColor *= 0.91 + agateCloud * 0.15 + agateMicro * 0.018;

  // A quiet, cloudy chalcedony eye anchors the narrow bands; it is not a
  // bright painted bullseye. The outer rind remains a little darker.
  float agateCore = 1.0 - smoothstep(0.13, 0.235, agateGrowth);
  vec3 agateQuartz = mix(vec3(0.075, 0.105, 0.10), vec3(0.25, 0.285, 0.255), agateCloud);
  agateQuartz += pow(agateMicro, 14.0) * 0.018;
  agateColor = mix(agateColor, agateQuartz, agateCore);
  float agateRind = smoothstep(0.965, 1.025, agateOuter);
  agateColor = mix(agateColor, vec3(0.075, 0.063, 0.039) * (0.75 + agateCloud * 0.4), agateRind * 0.76);
  // Pale chalcedony transmits more light than its denser, dark growth bands.
  // The backlight control changes absorption and the light within the slab;
  // it leaves the polished surface and the actual band geometry unchanged.
  float agateOpticalWindow = smoothstep(0.055, 0.31,
      dot(agateColor, vec3(0.2126, 0.7152, 0.0722)));
  agateColor *= mix(0.79, 1.04, uStoneLight) + agateOpticalWindow * uStoneLight * 0.035;
  agateColor *= mix(1.0, 0.47, uStoneSide);
  diffuseColor.rgb *= agateColor;
`;

const agateSubsurface = /* glsl */ `
  vec3 agateTransmission = mix(vec3(0.065, 0.078, 0.071), vec3(0.14, 0.118, 0.073), agateWarmth);
  float agateTransmissionDepth = (0.12 + agateOpticalWindow * 0.62 + agateCore * 0.16)
      * (1.0 - agateRind * 0.78) * (1.0 - uStoneSide * 0.90);
  outgoingLight += agateTransmission * agateTransmissionDepth * uStoneLight * 0.65;
`;

function applyProceduralMaterial(
  material: THREE.MeshPhysicalMaterial,
  uniforms: StoneUniforms,
  kind: 'jade' | 'agate',
): void {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vStonePosition;\nvarying vec3 vStoneObjectNormal;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\nvStonePosition = position;\nvStoneObjectNormal = normal;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${stoneShaderHeader}`)
      .replace('#include <map_fragment>', `#include <map_fragment>\n${kind === 'jade' ? jadeAlbedo : agateAlbedo}`);
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `${kind === 'jade' ? jadeSubsurface : agateSubsurface}\n#include <opaque_fragment>`,
    );
  };
  material.customProgramCacheKey = () => `facet-organic-${kind}-v3`;
}

function disposeRig(group: THREE.Group): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    const list = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of list) materials.add(material);
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  group.clear();
  group.removeFromParent();
}

/** A water-worn jade cabochon: soft shoulders, asymmetric body, smooth polish. */
export function createJadeStone(options: OrganicStoneOptions = {}): OrganicStoneRig {
  const group = new THREE.Group();
  group.name = 'Jade — light held in stone';
  const low = options.quality === 'low';
  const geometry = new THREE.SphereGeometry(1, low ? 64 : 112, low ? 40 : 72);
  const position = geometry.getAttribute('position') as THREE.BufferAttribute;

  for (let index = 0; index < position.count; index++) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const angle = Math.atan2(y, x);
    const shoulder = 1 + 0.035 * Math.sin(angle * 3 + 0.6) + 0.023 * Math.cos(angle * 5 - 0.8);
    const breadth = 0.95 + 0.062 * y - 0.025 * x * y;
    position.setXYZ(
      index,
      x * breadth * shoulder + 0.045 * y * y - 0.022,
      y * 1.055 * shoulder + 0.02 * x * y,
      z * (z > 0 ? 0.435 : 0.335) * (1 + 0.045 * x - 0.045 * y),
    );
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();

  const uniforms = makeUniforms();
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.135,
    metalness: 0,
    clearcoat: 0.44,
    clearcoatRoughness: 0.085,
    ior: 1.62,
    reflectivity: 0.46,
    specularIntensity: 0.58,
    envMapIntensity: 0.56,
  });
  applyProceduralMaterial(material, uniforms, 'jade');
  const stone = new THREE.Mesh(geometry, material);
  stone.name = 'Polished jade body';
  stone.castShadow = true;
  stone.receiveShadow = true;
  group.add(stone);

  return {
    group,
    materials: [material],
    update(state) {
      if (state.time !== undefined) uniforms.uStoneTime.value = state.reducedMotion ? 0 : state.time;
      if (state.light !== undefined) uniforms.uStoneLight.value = saturate(state.light);
      if (state.translucency !== undefined) uniforms.uStoneTranslucency.value = saturate(state.translucency);
    },
    dispose() { disposeRig(group); },
  };
}

function agateOutline(segments: number): THREE.Shape {
  const shape = new THREE.Shape();
  for (let index = 0; index <= segments; index++) {
    const angle = index / segments * Math.PI * 2;
    const radius = 1 + 0.065 * Math.cos(angle * 3 + 1.2)
      + 0.035 * Math.sin(angle * 5 + 0.5)
      + 0.014 * Math.sin(angle * 9 + 1.7);
    const x = Math.cos(angle) * radius * 1.045;
    const y = Math.sin(angle) * radius * 0.945;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

/**
 * Five real, bevelled slabs of banded chalcedony. The band field is sampled in
 * local coordinates through every slab. A single absolute `open` parameter
 * presents the polished face, then opens its depth into physical cross-sections.
 */
export function createAgateStone(options: OrganicStoneOptions = {}): OrganicStoneRig {
  const group = new THREE.Group();
  group.name = 'Agate — the patient layers';
  const low = options.quality === 'low';
  const shape = agateOutline(low ? 96 : 160);
  const slices: THREE.Mesh[] = [];
  const materials: THREE.MeshPhysicalMaterial[] = [];
  const uniformSets: StoneUniforms[] = [];
  const depth = 0.116;
  const scales = [0.86, 0.93, 0.975, 0.998, 1];

  for (let index = 0; index < 5; index++) {
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSegments: low ? 2 : 3,
      steps: 1,
      bevelSize: 0.012,
      bevelThickness: 0.012,
      curveSegments: 1,
    });
    geometry.translate(0, 0, -depth / 2);
    geometry.computeBoundingSphere();

    const faceUniforms = makeUniforms(index, 0);
    const sideUniforms = makeUniforms(index, 1);
    const faceMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.20,
      clearcoat: 0.52,
      clearcoatRoughness: 0.105,
      ior: 1.54,
      reflectivity: 0.32,
      specularIntensity: 0.65,
      envMapIntensity: 0.46,
    });
    const sideMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.49,
      clearcoat: 0.14,
      clearcoatRoughness: 0.28,
      ior: 1.54,
      reflectivity: 0.30,
      envMapIntensity: 0.45,
    });
    applyProceduralMaterial(faceMaterial, faceUniforms, 'agate');
    applyProceduralMaterial(sideMaterial, sideUniforms, 'agate');
    const slice = new THREE.Mesh(geometry, [faceMaterial, sideMaterial]);
    slice.name = `Agate cross-section ${index + 1}`;
    slice.scale.set(scales[index], scales[index], 1);
    slice.position.z = (index - 2) * (depth + 0.022);
    slice.castShadow = true;
    slice.receiveShadow = true;
    slices.push(slice);
    materials.push(faceMaterial, sideMaterial);
    uniformSets.push(faceUniforms, sideUniforms);
    group.add(slice);
  }

  return {
    group,
    materials,
    update(state) {
      if (state.open !== undefined) {
        const open = saturate(state.open);
        for (let index = 0; index < slices.length; index++) {
          const relative = index - 2;
          slices[index].position.set(
            relative * open * -0.17,
            relative * open * 0.025,
            relative * (depth + 0.022 + open * 0.32),
          );
          slices[index].rotation.y = relative * open * 0.024;
        }
      }
      for (const uniforms of uniformSets) {
        if (state.time !== undefined) uniforms.uStoneTime.value = state.reducedMotion ? 0 : state.time;
        if (state.light !== undefined) uniforms.uStoneLight.value = saturate(state.light);
      }
    },
    dispose() { disposeRig(group); },
  };
}

function quartzPrism(radius: number, length: number, phase: number): {
  geometry: THREE.BufferGeometry;
  planes: THREE.Vector4[];
} {
  const vertices: number[] = [];
  const shoulder = length * 0.77;
  const point = new THREE.Vector3(-radius * 0.075, length, radius * 0.025);
  const bottom = new THREE.Vector3(0, 0, 0);
  const triangle = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    vertices.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  };
  for (let side = 0; side < 6; side++) {
    const angleA = side / 6 * Math.PI * 2 + phase;
    const angleB = (side + 1) / 6 * Math.PI * 2 + phase;
    const lowerA = new THREE.Vector3(Math.cos(angleA) * radius, 0, Math.sin(angleA) * radius);
    const lowerB = new THREE.Vector3(Math.cos(angleB) * radius, 0, Math.sin(angleB) * radius);
    const upperA = new THREE.Vector3(lowerA.x, shoulder, lowerA.z);
    const upperB = new THREE.Vector3(lowerB.x, shoulder, lowerB.z);
    triangle(lowerA, upperA, upperB);
    triangle(lowerA, upperB, lowerB);
    triangle(upperA, point, upperB);
    triangle(bottom, lowerA, lowerB);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  const positions = geometry.getAttribute('position');
  const normals = geometry.getAttribute('normal');
  const planes: THREE.Vector4[] = [];
  for (let index = 0; index < positions.count; index += 3) {
    const normal = new THREE.Vector3(normals.getX(index), normals.getY(index), normals.getZ(index));
    const position = new THREE.Vector3(positions.getX(index), positions.getY(index), positions.getZ(index));
    const plane = new THREE.Vector4(normal.x, normal.y, normal.z, normal.dot(position));
    if (!planes.some((existing) => existing.clone().sub(plane).length() < 0.00001)) planes.push(plane);
  }
  return { geometry, planes };
}

/** Five closed, six-sided quartz prisms with individual pyramidal terminations. */
export function createQuartzCluster(): OrganicStoneRig<THREE.ShaderMaterial> {
  const group = new THREE.Group();
  group.name = 'Quartz — a gathering of light';
  const materials: THREE.ShaderMaterial[] = [];
  const crystals = [
    { radius: 0.31, length: 1.96, x: -0.06, y: -0.85, z: -0.06, rx: 0.02, rz: -0.04 },
    { radius: 0.25, length: 1.44, x: -0.40, y: -0.84, z: 0.10, rx: 0.09, rz: 0.22 },
    { radius: 0.23, length: 1.30, x: 0.35, y: -0.83, z: 0.10, rx: -0.13, rz: -0.28 },
    { radius: 0.20, length: 1.07, x: 0.02, y: -0.84, z: 0.36, rx: 0.24, rz: 0.15 },
    { radius: 0.19, length: 1.50, x: 0.27, y: -0.82, z: -0.32, rx: -0.14, rz: -0.08 },
  ];
  for (let index = 0; index < crystals.length; index++) {
    const crystal = crystals[index];
    const prism = quartzPrism(crystal.radius, crystal.length, index * 0.14);
    const material = createGemMaterial(prism.planes, { preset: 'diamond', bounces: 3, polish: 0.98, exposure: 1.25 });
    material.name = 'FACET / Optical quartz';
    material.uniforms.uIor.value = 1.54;
    material.uniforms.uDispersion.value = 0.003;
    material.uniforms.uAbsorption.value.set(0.055, 0.033, 0.029);
    material.uniforms.uColor.value.set(0xe6eee8);
    materials.push(material);
    const mesh = new THREE.Mesh(prism.geometry, material);
    mesh.name = `Quartz crystal ${index + 1}`;
    mesh.position.set(crystal.x, crystal.y, crystal.z);
    mesh.rotation.set(crystal.rx, index * 0.17, crystal.rz);
    mesh.castShadow = true;
    group.add(mesh);
  }
  return {
    group,
    materials,
    update(state) {
      for (const material of materials) {
        if (state.time !== undefined) material.uniforms.uTime.value = state.reducedMotion ? 0 : state.time;
        if (state.light !== undefined) material.uniforms.uLightRotation.value = (saturate(state.light) - 0.5) * 0.3;
      }
    },
    dispose() { disposeRig(group); },
  };
}
