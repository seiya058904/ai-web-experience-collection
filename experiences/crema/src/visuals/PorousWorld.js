import * as THREE from 'three';

/**
 * CREMA's authored porous medium.
 *
 * This is a visual interpretation, not a CFD or particle-dynamics solver.
 * A fixed, seeded microstructure and connected paths are built once. Scroll
 * alone determines packing, wetness, pressure and extraction. The clock only
 * moves tracer parcels and very small surface reflections, so a reverse scroll
 * restores the same material state without resetting a simulation.
 */

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const fract = (x) => x - Math.floor(x);

function randomGenerator(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash3(x, y, z) {
  return fract(Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123);
}

function noise3(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  let fx = x - ix, fy = y - iy, fz = z - iz;
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  fz = fz * fz * (3 - 2 * fz);
  const low = mix(mix(hash3(ix, iy, iz), hash3(ix + 1, iy, iz), fx),
    mix(hash3(ix, iy + 1, iz), hash3(ix + 1, iy + 1, iz), fx), fy);
  const high = mix(mix(hash3(ix, iy, iz + 1), hash3(ix + 1, iy, iz + 1), fx),
    mix(hash3(ix, iy + 1, iz + 1), hash3(ix + 1, iy + 1, iz + 1), fx), fy);
  return mix(low, high, fz);
}

// Pitted, ruptured cellular material. No borrowed images or research geometry.
function coffeeTextures() {
  const size = 512;
  const color = new Uint8Array(size * size * 4);
  const bump = new Uint8Array(size * size * 4);
  const rng = randomGenerator(33019);
  const cells = 32;
  const points = Array.from({ length: cells * cells }, () => ({
    x: rng(), y: rng(), radius: .22 + rng() * .29,
  }));

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = x / size * cells, py = y / size * cells;
      const ix = Math.floor(px), iy = Math.floor(py);
      let pore = 0;
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const gx = ix + ox, gy = iy + oy;
          const c = points[((gy + cells) % cells) * cells + (gx + cells) % cells];
          const d = Math.hypot(px - gx - c.x, (py - gy - c.y) * 1.13) / c.radius;
          pore = Math.max(pore, 1 - smooth(.27, 1.05, d));
        }
      }
      const broad = noise3(x * .025, y * .025, 2.71);
      const fine = noise3(x * .34, y * .34, 7.1);
      const ridge = noise3(x * .105, y * .105, 18.2);
      const height = clamp(.36 + broad * .22 + ridge * .2 + fine * .18 - pore * .5);
      const value = clamp(.36 + broad * .32 + fine * .17 + ridge * .19 - pore * .53);
      const i = (y * size + x) * 4;
      color[i] = Math.round(value * 245);
      color[i + 1] = Math.round(value * 232);
      color[i + 2] = Math.round(value * 218);
      color[i + 3] = 255;
      bump[i] = bump[i + 1] = bump[i + 2] = Math.round(height * 255);
      bump[i + 3] = 255;
    }
  }
  const create = (data, isColor) => {
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.repeat.set(1.8, 1.8);
    texture.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.needsUpdate = true;
    return texture;
  };
  return { color: create(color, true), bump: create(bump, false) };
}

function fracturedGeometry(seed, detail = 2) {
  const geometry = new THREE.IcosahedronGeometry(1, detail);
  const p = geometry.attributes.position;
  const rng = randomGenerator(seed);
  const stretch = [.76 + rng() * .35, .57 + rng() * .39, .69 + rng() * .4];
  const cutX = .48 + rng() * .27;
  const cutY = .46 + rng() * .28;
  const phase = rng() * 38;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const length = Math.hypot(x, y, z);
    x /= length; y /= length; z /= length;
    const broad = noise3(x * 2.8 + phase, y * 2.8, z * 2.8) - .5;
    const fractured = noise3(x * 7.2, y * 7.2 + phase, z * 7.2) - .5;
    const radius = .94 + broad * .38 + fractured * .17;
    x *= radius; y *= radius; z *= radius;
    // Fracture faces, not polished round pebbles.
    if (x > cutX) x = cutX + (x - cutX) * .18;
    if (y < -cutY) y = -cutY + (y + cutY) * .14;
    if (z > .65) z = .65 + (z - .65) * .32;
    p.setXYZ(i, x * stretch[0], y * stretch[1], z * stretch[2]);
  }
  // IcosahedronGeometry keeps separate triangle vertices for its UV seams.
  // Keep broad broken faces without giving every little triangle its own
  // mirror facet. Smooth coincident normals only across angles below 45 deg;
  // real fracture-plane creases survive, as do all UV seams and vertices.
  const averaged = new Map();
  const vertexKeys = [];
  const faceNormals = [];
  const ab = new THREE.Vector3(), ac = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    const key = `${Math.round(p.getX(i) * 1e6)},${Math.round(p.getY(i) * 1e6)},${Math.round(p.getZ(i) * 1e6)}`;
    vertexKeys.push(key);
    if (!averaged.has(key)) averaged.set(key, []);
  }
  for (let i = 0; i < p.count; i += 3) {
    ab.set(p.getX(i + 1) - p.getX(i), p.getY(i + 1) - p.getY(i), p.getZ(i + 1) - p.getZ(i));
    ac.set(p.getX(i + 2) - p.getX(i), p.getY(i + 2) - p.getY(i), p.getZ(i + 2) - p.getZ(i));
    ab.cross(ac);
    const face = ab.clone();
    faceNormals.push(face.clone().normalize());
    averaged.get(vertexKeys[i]).push(face);
    averaged.get(vertexKeys[i + 1]).push(face);
    averaged.get(vertexKeys[i + 2]).push(face);
  }
  const normals = geometry.attributes.normal;
  const normal = new THREE.Vector3();
  const neighborDirection = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    const face = faceNormals[Math.floor(i / 3)];
    normal.set(0, 0, 0);
    for (const neighbor of averaged.get(vertexKeys[i])) {
      neighborDirection.copy(neighbor).normalize();
      if (neighborDirection.dot(face) >= Math.SQRT1_2) normal.add(neighbor);
    }
    normal.normalize();
    normals.setXYZ(i, normal.x, normal.y, normal.z);
  }
  normals.needsUpdate = true;
  geometry.computeBoundingSphere();
  return geometry;
}

function makeEnvironment(renderer) {
  const w = 512, h = 256;
  const data = new Float32Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w, v = y / h;
      const card = (cx, cy, sx, sy) => Math.exp(-Math.pow((u - cx) / sx, 10) - Math.pow((v - cy) / sy, 8));
      const cold = card(.23, .36, .024, .19) * 8.5;
      const top = card(.52, .19, .15, .015) * 5.0;
      const warm = card(.78, .49, .022, .17) * 4.2;
      const broad = card(.04, .45, .07, .18) * .22;
      const i = (y * w + x) * 4;
      data[i] = .008 + cold * .84 + top + warm + broad;
      data[i + 1] = .01 + cold * .93 + top * .95 + warm * .53 + broad;
      data[i + 2] = .014 + cold + top * .84 + warm * .26 + broad;
      data[i + 3] = 1;
    }
  }
  const texture = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.FloatType);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromEquirectangular(texture);
  texture.dispose();
  pmrem.dispose();
  return target;
}

const coffeeShader = /* glsl */ `
  varying vec3 vCoffeePosition;
  varying vec3 vCoffeeLocal;
  varying vec3 vCoffeeLocalNormal;
  varying float vCoffeeReliefScale;
  varying float vCoffeeSeed;
  uniform float uFront;
  uniform float uWet;
  uniform float uPressure;
  uniform float uExtraction;
  uniform float uClock;
  vec4 coffeeTriplanar(sampler2D sourceMap, vec3 p, vec3 weights) {
    return texture2D(sourceMap,p.yz)*weights.x
      +texture2D(sourceMap,p.zx)*weights.y
      +texture2D(sourceMap,p.xy)*weights.z;
  }
  float cHash(vec3 p) {
    p = fract(p * .3183099 + vec3(.11,.37,.71));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float cNoise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(mix(mix(cHash(i), cHash(i+vec3(1,0,0)),f.x),
      mix(cHash(i+vec3(0,1,0)),cHash(i+vec3(1,1,0)),f.x),f.y),
      mix(mix(cHash(i+vec3(0,0,1)),cHash(i+vec3(1,0,1)),f.x),
      mix(cHash(i+vec3(0,1,1)),cHash(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
  float wetAt(vec3 p) {
    float irregular = sin(p.x*2.4+p.z*1.6)*.11
      + sin(p.x*6.8-p.z*3.1)*.055
      + (cNoise(p*3.6)-.5)*.22;
    return smoothstep(uFront-.09, uFront+.10, p.y+irregular) * uWet;
  }
`;

function applyCoffeeShader(material, uniforms) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader.replace('#include <common>', /* glsl */ `
      #include <common>
      attribute float aCoffeeSeed;
      varying vec3 vCoffeePosition;
      varying vec3 vCoffeeLocal;
      varying vec3 vCoffeeLocalNormal;
      varying float vCoffeeReliefScale;
      varying float vCoffeeSeed;
    `).replace('#include <begin_vertex>', /* glsl */ `
      #include <begin_vertex>
      vCoffeeLocal = position;
      vCoffeeLocalNormal = normal;
      vCoffeeSeed = aCoffeeSeed;
      #ifdef USE_INSTANCING
        vCoffeePosition = (instanceMatrix * vec4(position, 1.0)).xyz;
        vCoffeeReliefScale = length(instanceMatrix[0].xyz)*length(modelMatrix[0].xyz);
      #else
        vCoffeePosition = position;
        vCoffeeReliefScale = length(modelMatrix[0].xyz);
      #endif
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>\n${coffeeShader}`)
      .replace('#include <map_fragment>', /* glsl */ `
        // Object-space triplanar sampling keeps the cell structure intact on
        // fracture faces and at the former spherical-UV poles. Source texture
        // repeat/offset/UV transforms deliberately do not affect this mapping.
        vec3 coffeeWeights = pow(abs(normalize(vCoffeeLocalNormal)),vec3(8.0));
        coffeeWeights /= max(dot(coffeeWeights,vec3(1.0)),.0001);
        vec3 coffeeTexturePosition = vCoffeeLocal*.83
          +vec3(vCoffeeSeed*3.13,vCoffeeSeed*1.79,vCoffeeSeed*.67);
        float coffeePhotoHeight = .5;
        #ifdef USE_MAP
          vec4 coffeeSample = coffeeTriplanar(map,coffeeTexturePosition,coffeeWeights);
          diffuseColor *= coffeeSample;
          coffeePhotoHeight = pow(max(dot(coffeeSample.rgb,vec3(.2126,.7152,.0722)),.0001),.60);
        #endif
        float coffeeHeight = coffeePhotoHeight;
        #ifdef USE_BUMPMAP
          float coffeeMicroHeight = coffeeTriplanar(bumpMap,coffeeTexturePosition*2.60,coffeeWeights).r;
          coffeeHeight = mix(coffeePhotoHeight,coffeeMicroHeight,.12);
        #endif
      `)
      .replace('#include <color_fragment>', /* glsl */ `
        #include <color_fragment>
        float coffeeWet = wetAt(vCoffeePosition);
        float coffeeMottle = cNoise(vCoffeeLocal*11.0+vCoffeeSeed*13.7);
        float coffeeCell = clamp(coffeeHeight*1.60-.10,0.0,1.0);
        float coffeeDeep = mix(.56,1.0,smoothstep(-1.25,1.2,vCoffeePosition.z));
        float coffeeCavity = mix(.78,1.0,smoothstep(.17,.59,coffeeCell));
        float coffeeFilm = coffeeWet * mix(.10,.98,smoothstep(.31,.78,coffeeCell));
        diffuseColor.rgb *= mix(vec3(1.08,1.04,.98), vec3(.52,.50,.46), coffeeWet);
        diffuseColor.rgb *= coffeeDeep * coffeeCavity * mix(.80,1.15,coffeeMottle);
        diffuseColor.rgb *= mix(vec3(1.0),vec3(1.12,.93,.75),uExtraction*coffeeWet*.27);
      `)
      .replace('#include <roughnessmap_fragment>', /* glsl */ `
        #include <roughnessmap_fragment>
        // Saturation darkens a ruptured solid; it does not polish it. The same
        // cellular height field controls both relief and local film roughness.
        roughnessFactor = mix(.91+coffeeMottle*.08,
          .60+(1.0-coffeeCell)*.22+coffeeMottle*.025,coffeeWet);
      `)
      .replace('#include <normal_fragment_maps>', /* glsl */ `
        #ifdef USE_BUMPMAP
          // Derivatives of the same triplanar colour/height field supply the
          // relief. Scale it with the instance: fines must not inherit a
          // macroscopic absolute bump height. No spherical UV bump is added.
          normal = perturbNormalArb(-vViewPosition,normal,
            vec2(dFdx(coffeeHeight),dFdy(coffeeHeight))*bumpScale*vCoffeeReliefScale,faceDirection);
        #endif
      `)
      .replace('#include <clearcoat_normal_fragment_maps>', /* glsl */ `
        #include <clearcoat_normal_fragment_maps>
        #ifdef USE_CLEARCOAT
          // Water follows the ruptured cellular surface. Three's default
          // unperturbed clearcoat normal would add a smooth polished shell.
          clearcoatNormal = normal;
        #endif
      `)
      .replace('#include <lights_physical_fragment>', /* glsl */ `
        #include <lights_physical_fragment>
        // Packed material receives less light in its depth. Diffuse-only
        // attenuation would leave a white specular outline on buried grains.
        float coffeeSpecDepth = mix(.45,1.0,coffeeDeep) * coffeeCavity;
        material.specularColor *= coffeeSpecDepth * mix(.64,1.0,coffeeFilm);
        material.specularColorBlended *= coffeeSpecDepth * mix(.64,1.0,coffeeFilm);
        material.specularF90 *= coffeeSpecDepth;
        #ifdef USE_CLEARCOAT
          material.clearcoat *= coffeeFilm * coffeeSpecDepth;
          material.clearcoatRoughness = .30+(1.0-coffeeCell)*.35;
        #endif
      `);
  };
  material.customProgramCacheKey = () => 'crema-coffee-triplanar-v7';
}

function networkGeometry() {
  const rng = randomGenerator(930223);
  const rows = 9, cols = 9;
  const nodes = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push(new THREE.Vector3(
        -3.02 + c * .755 + (rng() - .5) * .32,
        2.07 - r * .505 + (rng() - .5) * .13,
        // The voids weave into and out of the section. A front-only network
        // would read as transparent pipes laid on top of the coffee.
        .43 + Math.sin(r*1.35+c*.91)*.29 + (rng()-.5)*.18,
      ));
    }
    nodes.push(row);
  }

  const paths = [];
  // Shared nodes produce real branch/rejoin topology; cross connections are
  // deliberately not an evenly spaced, straight set of downward pipes.
  for (let n = 0; n < 15; n++) {
    let column = n < cols ? n : 1 + Math.floor(rng() * 7);
    const points = [];
    const firstRow = n < cols ? 0 : 1 + Math.floor(rng() * 3);
    for (let r = firstRow; r < rows; r++) {
      if (r > firstRow && rng() > .59) {
        column = clamp(column + (rng() > .52 ? 1 : -1), 0, cols - 1);
      }
      // Two intentional confluences make flow competition readable.
      if (r === 5 && (column === 3 || column === 4)) column = 4;
      if (r === 7 && (column === 6 || column === 7)) column = 6;
      points.push(nodes[r][column].clone());
    }
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
    const samples = curve.getSpacedPoints(192);
    paths.push({ curve, samples, firstRow, seed: rng(), width: .014 + rng() * .021, speed: .028 + rng() * .052 });
  }
  return paths;
}

function pathSpatialHash(paths) {
  const grid = new Map();
  const cell = .3;
  for (const path of paths) {
    for (let i = 0; i < path.samples.length; i += 2) {
      const p = path.samples[i];
      const key = `${Math.floor(p.x / cell)},${Math.floor(p.y / cell)},${Math.floor(p.z / cell)}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(p);
    }
  }
  return (x, y, z, radius) => {
    const ix = Math.floor(x / cell), iy = Math.floor(y / cell), iz = Math.floor(z / cell);
    const span = Math.ceil((radius + .07) / cell);
    const safe = radius * .69 + .048;
    for (let ox = -span; ox <= span; ox++) {
      for (let oy = -span; oy <= span; oy++) {
        for (let oz = -span; oz <= span; oz++) {
          const samples = grid.get(`${ix + ox},${iy + oy},${iz + oz}`);
          if (!samples) continue;
          for (const p of samples) {
            if ((p.x - x) ** 2 + (p.y - y) ** 2 + (p.z - z) ** 2 < safe * safe) return true;
          }
        }
      }
    }
    return false;
  };
}

export default class PorousWorld {
  constructor({ renderer, assets = {} }) {
    this.renderer = renderer;
    this.assets = assets;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(36, 1, .05, 80);
    this.camera.position.set(0, .25, 11.2);
    this.camera.lookAt(0, 0, 0);
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.resources = new Set();
    this.disposed = false;
    this.width = 1280;
    this.height = 800;
    this.mobile = false;
    this.lastStage = -100;
    this.dummy = new THREE.Object3D();
    this.outlet = new THREE.Vector3(0, -2.82, .08);
    this.routeStart = new THREE.Vector3();
    this.routePoint = new THREE.Vector3();
    this.routeDelta = new THREE.Vector3();
    this.outletWorld = new THREE.Vector3();
    this.outletProjected = new THREE.Vector3();
    this.outletTarget = new THREE.Vector3();
    this.handoff = { progress: 0, outletX: 0, outletY: 0, targetX: 0, targetY: 0, errorPx: 0 };

    this.uniforms = {
      uFront: { value: 2.7 },
      uWet: { value: 0 },
      uPressure: { value: 0 },
      uExtraction: { value: 0 },
      uClock: { value: 0 },
      uConverge: { value: 0 },
      uHandoff: { value: 0 },
      uOutlet: { value: this.outlet },
    };
    if (assets.environment?.isTexture) {
      this.scene.environment = assets.environment;
    } else {
      this.environmentTarget = makeEnvironment(renderer);
      this.scene.environment = this.environmentTarget.texture;
    }
    this.textures = coffeeTextures();
    this.resources.add(this.textures.color);
    this.resources.add(this.textures.bump);
    this.textures.color.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    this.textures.bump.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

    this.keyLight = new THREE.DirectionalLight(0xdde9f1, 3.8);
    this.keyLight.position.set(-3, 6, 5);
    this.scene.add(this.keyLight);
    this.rimLight = new THREE.DirectionalLight(0xe4a068, 1.25);
    this.rimLight.position.set(5, 2, -3);
    this.scene.add(this.rimLight);
    this.fillLight = new THREE.HemisphereLight(0xb5c1c6, 0x1c1008, .64);
    this.scene.add(this.fillLight);
    const edgeLight = new THREE.DirectionalLight(0xf3efe4, .28);
    edgeLight.position.set(0, -2, 3);
    this.scene.add(edgeLight);

    this.paths = networkGeometry();
    this.paths[2].curve.getPointAt(.31, this.routeStart);
    this.makeBed();
    this.makeHeroFragments();
    this.makeBasketBoundary();
    this.makeFlow();
    this.makePressureField();
    if (assets.granule) this.loadGranuleAsset(assets.granule);
  }

  own(resource) {
    this.resources.add(resource);
    return resource;
  }

  loadGranuleAsset(url) {
    // A curated AI material crop adds ruptured-cell detail to the authored
    // meshes. Geometry, packing, wetness, liquid and lighting remain realtime.
    const texture = new THREE.TextureLoader().load(url, (loaded) => {
      if (this.disposed) {
        loaded.dispose();
        return;
      }
      loaded.colorSpace = THREE.SRGBColorSpace;
      loaded.wrapS = loaded.wrapT = THREE.RepeatWrapping;
      loaded.repeat.set(1.25, 1.25);
      loaded.anisotropy = Math.min(this.renderer.capabilities.getMaxAnisotropy(), 8);
      for (const batch of this.batches) {
        batch.mesh.material.map = loaded;
        batch.mesh.material.color.set(0xfaf5ee);
        batch.mesh.material.needsUpdate = true;
      }
      for (const mesh of this.heroes) {
        mesh.material.map = loaded;
        mesh.material.color.set(0xfaf5ee);
        mesh.material.needsUpdate = true;
      }
    }, undefined, () => {
      // The complete original procedural material is the resilient fallback.
    });
    this.own(texture);
  }

  coffeeMaterial({ bumpScale = .055, hero = false } = {}) {
    const material = this.own(new THREE.MeshPhysicalMaterial({
      color: hero ? 0x76503a : 0x6a4630,
      map: this.textures.color,
      bumpMap: this.textures.bump,
      bumpScale,
      metalness: 0,
      roughness: .96,
      ior: 1.4,
      specularIntensity: .55,
      clearcoat: .14,
      clearcoatRoughness: .65,
      envMapIntensity: .32,
      transparent: true,
      opacity: 1,
      depthWrite: true,
      dithering: true,
    }));
    applyCoffeeShader(material, this.uniforms);
    return material;
  }

  makeBed() {
    const rng = randomGenerator(761922);
    const occupied = new Map();
    const cellSize = .37;
    const pathIntersects = pathSpatialHash(this.paths);
    const specs = [
      { count: 212, min: .245, max: .40, detail: 2 },
      { count: 220, min: .17, max: .285, detail: 2 },
      { count: 320, min: .105, max: .19, detail: 1 },
      { count: 330, min: .060, max: .126, detail: 1 },
      { count: 430, min: .025, max: .075, detail: 0 },
    ];
    this.batches = [];

    const intersects = (x, y, z, radius) => {
      const ix = Math.floor(x / cellSize), iy = Math.floor(y / cellSize), iz = Math.floor(z / cellSize);
      for (let ox = -2; ox <= 2; ox++) {
        for (let oy = -2; oy <= 2; oy++) {
          for (let oz = -2; oz <= 2; oz++) {
            const near = occupied.get(`${ix + ox},${iy + oy},${iz + oz}`);
            if (!near) continue;
            for (const p of near) {
              const limit = (radius + p.radius) * .67;
              if ((x - p.x) ** 2 + (y - p.y) ** 2 + (z - p.z) ** 2 < limit * limit) return true;
            }
          }
        }
      }
      return false;
    };

    for (let b = 0; b < specs.length; b++) {
      const spec = specs[b];
      const geometry = this.own(fracturedGeometry(23 + b * 912, spec.detail));
      const seeds = new Float32Array(spec.count);
      geometry.setAttribute('aCoffeeSeed', new THREE.InstancedBufferAttribute(seeds, 1));
      const material = this.coffeeMaterial({ bumpScale: b < 2 ? .068 : .037 });
      const mesh = new THREE.InstancedMesh(geometry, material, spec.count);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      this.group.add(mesh);
      const particles = [];
      for (let i = 0; i < spec.count; i++) {
        const radius = mix(spec.min, spec.max, Math.pow(rng(), 1.35));
        let x = 0, y = 0, z = 0;
        for (let attempt = 0; attempt < 190; attempt++) {
          x = (rng() - .5) * 6.32;
          y = (rng() - .5) * 3.82;
          z = (rng() - .5) * 2.22;
          const edge = Math.pow(Math.abs(x) / 3.37, 8) + Math.pow(Math.abs(z) / 1.37, 6);
          if (edge > .99) continue;
          if (pathIntersects(x, y, z, radius)) continue;
          if (attempt < 135 && intersects(x, y, z, radius)) continue;
          break;
        }
        const particle = {
          x, y, z, radius,
          rotation: [rng() * 6.28, rng() * 6.28, rng() * 6.28],
          scale: [.83 + rng() * .36, .81 + rng() * .35, .85 + rng() * .3],
          settle: rng(),
          // The photographed albedo already contains coffee's colour. A
          // second brown tint crushed its cells into orange-black scratches.
          color: new THREE.Color().setHSL(.065 + rng() * .024, .025 + rng() * .035, .82 + rng() * .15),
        };
        particles.push(particle);
        const key = `${Math.floor(x / cellSize)},${Math.floor(y / cellSize)},${Math.floor(z / cellSize)}`;
        if (!occupied.has(key)) occupied.set(key, []);
        occupied.get(key).push(particle);
        seeds[i] = rng();
        mesh.setColorAt(i, particle.color);
      }
      mesh.instanceColor.needsUpdate = true;
      // Mobile is a crop of the same packed material, not a random thinning of
      // it. Keep central particles first and spend the lower instance budget
      // on the visible section; discard the far side columns before its pores.
      const mobileOrder = particles.map((_, index) => index).sort((a, b) =>
        Math.abs(particles[a].x + .4) - Math.abs(particles[b].x + .4) || a - b);
      this.batches.push({
        mesh, particles, spec, mobileOrder,
        sourceSeeds: seeds.slice(),
        activeOrder: null,
      });
    }
  }

  makeHeroFragments() {
    const rng = randomGenerator(31422);
    this.heroGroup = new THREE.Group();
    this.group.add(this.heroGroup);
    this.heroes = [];
    const positions = [
      [.05, -.10, .38, 1.35],
      [1.87, .98, -.67, .63],
      [-1.34, -1.24, -.72, .52],
      [-.92, 1.23, -.83, .27],
      [1.66, -1.13, -.51, .19],
      [.7, 1.75, -.6, .10],
    ];
    for (let i = 0; i < positions.length; i++) {
      const [x, y, z, size] = positions[i];
      const geometry = this.own(fracturedGeometry(876 + i * 761, i < 2 ? 4 : 2));
      geometry.setAttribute('aCoffeeSeed', new THREE.InstancedBufferAttribute(new Float32Array([rng()]), 1));
      const material = this.coffeeMaterial({ bumpScale: i < 2 ? .09 : .045, hero: true });
      const mesh = new THREE.InstancedMesh(geometry, material, 1);
      mesh.frustumCulled = false;
      this.dummy.position.set(x, y, z);
      this.dummy.scale.set(size, size * 1.05, size);
      this.dummy.rotation.set(.28 + rng(), .15 + rng(), -.45 + rng() * .45);
      this.dummy.updateMatrix();
      mesh.setMatrixAt(0, this.dummy.matrix);
      this.heroGroup.add(mesh);
      this.heroes.push(mesh);
    }
  }

  makeBasketBoundary() {
    this.boundary = new THREE.Group();
    this.group.add(this.boundary);
    const steel = this.own(new THREE.MeshStandardMaterial({
      color: 0xb8bdc1, metalness: 1, roughness: .28,
      envMapIntensity: .6, transparent: true, opacity: 1,
    }));
    const rim = new THREE.Mesh(this.own(new THREE.TorusGeometry(3.33, .033, 8, 160)), steel);
    rim.rotation.x = Math.PI / 2;
    rim.scale.y = .405;
    rim.position.y = -2.02;
    this.boundary.add(rim);
    const band = new THREE.Mesh(this.own(new THREE.CylinderGeometry(3.33, 3.32, .105, 144, 1, true)), steel);
    band.scale.z = .405;
    band.position.y = -2.09;
    this.boundary.add(band);
    this.boundaryMaterial = steel;
  }

  makeFlow() {
    this.flowGroup = new THREE.Group();
    this.group.add(this.flowGroup);
    this.flowMaterials = [];
    this.flowMeshes = [];
    this.paths.forEach((path, pathIndex) => {
      const primary = pathIndex === 2 || pathIndex === 4 || pathIndex === 6 || pathIndex === 10;
      // The tube is only a support surface for intermittent liquid films.
      // It has no glass/PBR wall. Its radius varies between pore constrictions,
      // and depth testing lets the fractured material conceal the water.
      const geometry = this.own(new THREE.TubeGeometry(path.curve, 112, path.width, primary ? 12 : 7, false));
      const centers = new Float32Array(geometry.attributes.position.count * 3);
      const center = new THREE.Vector3();
      for (let i = 0; i < geometry.attributes.position.count; i++) {
        path.curve.getPointAt(geometry.attributes.uv.getX(i), center);
        centers[i * 3] = center.x;
        centers[i * 3 + 1] = center.y;
        centers[i * 3 + 2] = center.z;
      }
      geometry.setAttribute('aFlowCenter', new THREE.BufferAttribute(centers, 3));
      geometry.computeBoundingBox();
      const material = this.own(new THREE.ShaderMaterial({
        uniforms: {
          ...this.uniforms,
          uPathSeed: { value: path.seed },
          uPrimary: { value: primary ? 1 : 0 },
          uAlpha: { value: 0 },
        },
        vertexShader: /* glsl */ `
          attribute vec3 aFlowCenter;
          uniform float uConverge;
          uniform float uPathSeed;
          uniform float uPrimary;
          uniform vec3 uOutlet;
          varying vec3 vFlowPosition;
          varying vec3 vFlowNormal;
          varying vec3 vFlowView;
          varying float vPathT;
          void main() {
            vPathT = uv.x;
            vec3 radial = position-aFlowCenter;
            float chamber = pow(.5+.5*sin(uv.x*24.0+uPathSeed*37.0),3.0);
            float poreWidth = .44 + .25*(.5+.5*sin(uv.x*57.0+uPathSeed*19.0))
              + uPrimary*(.30+1.30*chamber);
            float gather = smoothstep(.32,1.0,uv.x)*uConverge;
            // A single below-bed endpoint, shared by every branch. The CPU
            // tracer deformation below uses this exact same interpolation.
            vec3 center = mix(aFlowCenter,uOutlet,gather);
            // Alternating thin films and fuller menisci, rather than a rigid
            // circular bore. Their cross-section is fixed in material space.
            float sheetness = uPrimary*(.5+.5*sin(uv.x*17.0+uPathSeed*7.0));
            vec3 sheet = vec3(
              radial.x*mix(.65,1.75,sheetness),
              radial.y,
              radial.z*mix(.90,.24,sheetness)
            );
            vec3 p = center + sheet*poreWidth*(1.0-gather*.97);
            vFlowPosition = p;
            vec4 mv = modelViewMatrix*vec4(p,1.0);
            vFlowView = -mv.xyz;
            vFlowNormal = normalize(normalMatrix*normal);
            gl_Position = projectionMatrix*mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uAlpha;
          uniform float uFront;
          uniform float uWet;
          uniform float uClock;
          uniform float uExtraction;
          uniform float uConverge;
          uniform float uHandoff;
          uniform float uPathSeed;
          uniform float uPrimary;
          varying vec3 vFlowPosition;
          varying vec3 vFlowNormal;
          varying vec3 vFlowView;
          varying float vPathT;
          float fHash(vec3 p) {
            p=fract(p*.3183099+vec3(.11,.37,.71));
            p*=17.0;
            return fract(p.x*p.y*p.z*(p.x+p.y+p.z));
          }
          float fNoise(vec3 p) {
            vec3 i=floor(p),f=fract(p);
            f=f*f*(3.0-2.0*f);
            return mix(mix(mix(fHash(i),fHash(i+vec3(1,0,0)),f.x),
              mix(fHash(i+vec3(0,1,0)),fHash(i+vec3(1,1,0)),f.x),f.y),
              mix(mix(fHash(i+vec3(0,0,1)),fHash(i+vec3(1,0,1)),f.x),
              mix(fHash(i+vec3(0,1,1)),fHash(i+vec3(1,1,1)),f.x),f.y),f.z);
          }
          void main() {
            vec3 p=vFlowPosition;
            // The same irregular saturation boundary as the coffee material.
            float boundary=sin(p.x*2.4+p.z*1.6)*.11
              +sin(p.x*6.8-p.z*3.1)*.055+(fNoise(p*3.6)-.5)*.22;
            float reveal=smoothstep(uFront-.09,uFront+.10,p.y+boundary)*uWet;
            // The converged outlet is outside the bed's original wetting
            // bounds, so its liquid remains visible during the handoff.
            reveal=mix(reveal,1.0,uConverge*smoothstep(.58,.93,vPathT));
            float extracted=clamp(uExtraction*(.10+vPathT*.96),0.0,1.0);
            vec3 clearWater=vec3(.16,.25,.28);
            vec3 paleAmber=vec3(.70,.275,.044);
            vec3 chestnut=vec3(.17,.035,.005);
            vec3 liquid=mix(clearWater,paleAmber,smoothstep(0.0,.50,extracted));
            liquid=mix(liquid,chestnut,smoothstep(.48,1.0,extracted));

            float phase=fract(vPathT*(8.0+uPathSeed*9.0)
              -uClock*(.65+uPathSeed*.34)+uPathSeed*13.0);
            float parcel=smoothstep(.04,.28,phase)*(1.0-smoothstep(.50,.92,phase));
            parcel*=.35+.65*pow(.5+.5*sin(vPathT*27.0+uPathSeed*8.0),.8);
            float joined=uConverge*smoothstep(.75,1.0,vPathT);
            parcel=mix(parcel,1.0,joined);

            vec3 N=normalize(vFlowNormal);
            vec3 V=normalize(vFlowView);
            float facing=max(dot(N,V),0.0);
            float glint=pow(max(dot(N,normalize(vec3(-.45,.18,1.0))),0.0),29.0);
            float smallGlint=pow(max(dot(N,normalize(vec3(.64,-.10,.76))),0.0),40.0);
            vec3 highlight=mix(vec3(.65,.88,1.03),vec3(1.50,.64,.105),extracted);
            vec3 col=liquid*(.62+facing*.52);
            col+=highlight*(glint*.68+smallGlint*.19)*(.15+parcel*.85)*(1.0+uPrimary*.75);
            col+=liquid*pow(1.0-facing,4.5)*uPrimary*.22;
            col+=vec3(.14,.035,.003)*extracted*joined;
            float film=mix(.045,.18,uPrimary)+uConverge*.30
              +parcel*mix(.60,.85,uPrimary);
            float alpha=uAlpha*reveal*film*(.16+.84*pow(facing,.48));
            // As the real machine returns, retain only the terminal liquid
            // near its registered attachment. No long paths cross the steel.
            float trimStart=mix(-.045,.915,uHandoff);
            alpha*=smoothstep(trimStart,trimStart+.035,vPathT);
            alpha=min(alpha,.94);
            if(alpha<.003) discard;
            gl_FragColor=vec4(col,alpha);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        side: THREE.FrontSide,
      }));
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData.maxFlowY = geometry.boundingBox.max.y;
      mesh.frustumCulled = false;
      mesh.renderOrder = 2;
      this.flowGroup.add(mesh);
      this.flowMaterials.push(material);
      this.flowMeshes.push(mesh);
    });

    const count = 220;
    const rng = randomGenerator(991014);
    this.tracers = Array.from({ length: count }, (_, i) => ({
      path: i % this.paths.length,
      offset: rng(),
      speed: .76 + rng() * .62,
      size: .018 + rng() * .038,
    }));
    const geometry = this.own(new THREE.BufferGeometry());
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('aProgress', new THREE.BufferAttribute(new Float32Array(count), 1).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(this.tracers.map((p) => p.size)), 1));
    const material = this.own(new THREE.ShaderMaterial({
      uniforms: {
        ...this.uniforms,
        uAlpha: { value: 0 },
        uScale: { value: 720 },
      },
      vertexShader: /* glsl */ `
        attribute float aProgress;
        attribute float aSize;
        uniform float uScale;
        varying float vProgress;
        varying float vHeight;
        void main() {
          vProgress=aProgress;
          vHeight=position.y;
          vec4 mvPosition=modelViewMatrix*vec4(position,1.0);
          gl_Position=projectionMatrix*mvPosition;
          gl_PointSize=clamp(aSize*uScale/-mvPosition.z,1.1,6.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uAlpha;
        uniform float uFront;
        uniform float uExtraction;
        uniform float uConverge;
        uniform float uHandoff;
        varying float vProgress;
        varying float vHeight;
        void main() {
          float d=length(gl_PointCoord-.5)*2.0;
          if(d>1.0) discard;
          float extracted=clamp(uExtraction*(.1+vProgress),0.0,1.0);
          vec3 color=mix(vec3(.65,.80,.85),vec3(1.0,.64,.25),smoothstep(0.0,.6,extracted));
          color=mix(color,vec3(.58,.19,.04),smoothstep(.65,1.0,extracted));
          float reveal=smoothstep(uFront-.12,uFront+.10,vHeight);
          reveal=mix(reveal,1.0,uConverge*smoothstep(.58,.93,vProgress));
          float trimStart=mix(-.045,.915,uHandoff);
          float trim=smoothstep(trimStart,trimStart+.035,vProgress);
          gl_FragColor=vec4(color,pow(1.0-d,1.4)*uAlpha*reveal*trim);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    }));
    this.tracerGeometry = geometry;
    this.tracerMaterial = material;
    this.tracerMesh = new THREE.Points(geometry, material);
    this.tracerMesh.frustumCulled = false;
    this.tracerMesh.renderOrder = 3;
    this.flowGroup.add(this.tracerMesh);

    // A thin liquid film at the inlet. Its changing normal is restrained: this
    // is hot liquid water at a porous surface, not boiling/steam in the bed.
    const filmGeometry = this.own(new THREE.PlaneGeometry(6.45, 2.35, 34, 12));
    filmGeometry.rotateX(-Math.PI / 2);
    const filmMaterial = this.own(new THREE.MeshPhysicalMaterial({
      color: 0x9faeaf, metalness: 0, roughness: .34,
      clearcoat: .24, clearcoatRoughness: .34, envMapIntensity: .35,
      transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide,
    }));
    filmMaterial.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.uniforms);
      shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>\nuniform float uClock;\nvarying vec2 vInletUv;`)
        .replace('#include <begin_vertex>', /* glsl */ `
          #include <begin_vertex>
          vInletUv = uv;
          transformed.y += sin(position.x*8.0+uClock*.35)*sin(position.z*6.0-uClock*.28)*.018;
        `);
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>\nvarying vec2 vInletUv;`)
        .replace('#include <color_fragment>', /* glsl */ `
          #include <color_fragment>
          vec2 inletP = vInletUv * 2.0 - 1.0;
          float inletEdgeX = smoothstep(0.0,.11,vInletUv.x) * (1.0-smoothstep(.89,1.0,vInletUv.x));
          float inletEdgeZ = smoothstep(0.0,.16,vInletUv.y) * (1.0-smoothstep(.84,1.0,vInletUv.y));
          float inletFootprint = 1.0-smoothstep(.63,1.0,pow(abs(inletP.x),8.0)+pow(abs(inletP.y),4.0));
          diffuseColor.a *= inletEdgeX * inletEdgeZ * inletFootprint;
          if (diffuseColor.a < .001) discard;
        `);
    };
    filmMaterial.customProgramCacheKey = () => 'crema-inlet-film-v2';
    this.inletFilm = new THREE.Mesh(filmGeometry, filmMaterial);
    this.inletFilm.position.y = 1.98;
    this.group.add(this.inletFilm);
  }

  makePressureField() {
    const material = this.own(new THREE.ShaderMaterial({
      uniforms: { ...this.uniforms, uAlpha: { value: 0 } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
      `,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;
        uniform float uClock;
        uniform float uPressure;
        uniform float uAlpha;
        void main(){
          vec2 p=vUv*2.0-1.0;
          float boundary=smoothstep(1.0,.80,abs(p.x))*smoothstep(1.0,.81,abs(p.y));
          float bend=sin(p.x*3.7)*.34+sin(p.x*11.0)*.075;
          float contour=pow(.5+.5*sin(p.y*43.0+bend-uClock*.11),22.0);
          float gradient=mix(.12,1.0,vUv.y);
          gl_FragColor=vec4(.68,.76,.77,boundary*gradient*contour*uPressure*uAlpha*.075);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      transparent: true, depthWrite: false, depthTest: true,
    }));
    this.pressureField = new THREE.Mesh(this.own(new THREE.PlaneGeometry(6.65, 4.25)), material);
    this.pressureField.position.z = -.83;
    this.group.add(this.pressureField);
    this.pressureMaterial = material;
  }

  resize(width, height) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    const wasMobile = this.mobile;
    this.mobile = width < 700;
    this.camera.aspect = this.width / this.height;
    this.camera.fov = this.mobile ? 44 : 36;
    this.camera.updateProjectionMatrix();
    this.tracerMaterial.uniforms.uScale.value = this.height * .87;
    this.tracerGeometry.setDrawRange(0, this.mobile ? 112 : this.tracers.length);
    if (wasMobile !== this.mobile) this.lastStage = -100;
    for (const batch of this.batches) {
      batch.mesh.count = this.mobile ? Math.ceil(batch.particles.length * .59) : batch.particles.length;
      if (wasMobile !== this.mobile) {
        batch.activeOrder = this.mobile ? batch.mobileOrder : null;
        const seedAttribute = batch.mesh.geometry.attributes.aCoffeeSeed;
        for (let slot = 0; slot < batch.mesh.count; slot++) {
          const sourceIndex = batch.activeOrder ? batch.activeOrder[slot] : slot;
          seedAttribute.setX(slot, batch.sourceSeeds[sourceIndex]);
          batch.mesh.setColorAt(slot, batch.particles[sourceIndex].color);
        }
        seedAttribute.needsUpdate = true;
        batch.mesh.instanceColor.needsUpdate = true;
      }
    }
  }

  updatePacking(stage) {
    const appear = smooth(1.34, 1.94, stage);
    const compressed = smooth(1.63, 2.62, stage);
    const stretch = mix(1.34, 1, compressed);
    const pressure = smooth(3.64, 4.38, stage);
    const swell = .011 * smooth(3.1, 4.35, stage);
    for (const batch of this.batches) {
      for (let i = 0; i < batch.mesh.count; i++) {
        const p = batch.particles[batch.activeOrder ? batch.activeOrder[i] : i];
        const settle = (1 - compressed) * p.settle;
        const scale = p.radius * Math.max(.00001, appear) * (1 + swell);
        this.dummy.position.set(
          p.x + Math.sin(p.settle * 15.3) * settle * .105,
          p.y * stretch * (1 - pressure * .009) + (1 - appear) * (1.2 + p.settle * .65),
          p.z + Math.sin(p.settle * 8.1) * settle * .075,
        );
        this.dummy.rotation.set(
          p.rotation[0] + settle * .19,
          p.rotation[1] - settle * .14,
          p.rotation[2] + settle * .09,
        );
        this.dummy.scale.set(scale * p.scale[0], scale * p.scale[1], scale * p.scale[2]);
        this.dummy.updateMatrix();
        batch.mesh.setMatrixAt(i, this.dummy.matrix);
      }
      batch.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  updateTracers(time, reducedMotion) {
    const positions = this.tracerGeometry.attributes.position;
    const progress = this.tracerGeometry.attributes.aProgress;
    const converge = this.uniforms.uConverge.value;
    const clock = reducedMotion ? 0 : time;
    const count = this.mobile ? 112 : this.tracers.length;
    for (let i = 0; i < count; i++) {
      const tracer = this.tracers[i];
      const path = this.paths[tracer.path];
      const t = fract(tracer.offset + clock * path.speed * tracer.speed);
      const idx = t * (path.samples.length - 1);
      const lower = Math.floor(idx);
      const a = path.samples[lower], b = path.samples[Math.min(lower + 1, path.samples.length - 1)];
      let x = mix(a.x, b.x, idx - lower);
      let y = mix(a.y, b.y, idx - lower);
      let z = mix(a.z, b.z, idx - lower);
      const gather = smooth(.32, 1, t) * converge;
      x = mix(x, this.outlet.x, gather);
      y = mix(y, this.outlet.y, gather);
      z = mix(z, this.outlet.z, gather);
      positions.setXYZ(i, x, y, z);
      progress.setX(i, t);
    }
    positions.needsUpdate = true;
    progress.needsUpdate = true;
  }

  render({ stage, time = 0, pointer = { x: 0, y: 0 }, reducedMotion = false, anchor = null }) {
    if (this.disposed || stage < .58 || stage > 6.98) return;
    const opacity = smooth(.58, .94, stage);
    const coffeeExit = 1 - smooth(6.27, 6.68, stage);
    const liquidExit = 1 - smooth(6.73, 6.98, stage);
    const hero = 1 - smooth(1.40, 1.91, stage);
    const close = smooth(2.56, 3.25, stage);
    const interior = smooth(4.38, 5.12, stage);
    const leave = smooth(6.08, 6.85, stage);
    const traverse = smooth(4.50, 5.10, stage) * (1 - smooth(6.12, 6.68, stage));
    const pressure = smooth(3.6, 4.25, stage) * (1 - smooth(4.38, 4.87, stage));
    const front = mix(2.40, -2.45, smooth(2.77, 3.85, stage));
    const extraction = smooth(4.87, 6.43, stage);

    this.uniforms.uFront.value = front;
    this.uniforms.uWet.value = smooth(2.72, 2.94, stage);
    this.uniforms.uPressure.value = smooth(3.42, 4.27, stage);
    this.uniforms.uExtraction.value = extraction;
    this.uniforms.uClock.value = reducedMotion ? 0 : time;
    this.uniforms.uConverge.value = smooth(6.14, 6.78, stage);
    this.uniforms.uHandoff.value = smooth(6.35, 6.78, stage);

    if (Math.abs(this.lastStage - stage) > .00004) {
      this.updatePacking(stage);
      this.lastStage = stage;
    }

    const px = reducedMotion ? 0 : clamp(pointer.x || 0, -1, 1);
    const py = reducedMotion ? 0 : clamp(pointer.y || 0, -1, 1);
    const subtleClock = reducedMotion ? 0 : Math.sin(time * .18) * .014;
    // Follow a real, seeded pore route. Translation through perspective space
    // changes near/far relationships; less group scaling compensates for the
    // approach, keeping the left text field and the close mobile section.
    this.group.rotation.set(-.075 + close * .016 + py * .006, -.105 + interior * .055 + px * .009, .006);
    this.paths[2].curve.getPointAt(.31 + traverse * .24, this.routePoint);
    this.routeDelta.subVectors(this.routePoint, this.routeStart).applyEuler(this.group.rotation);
    if (this.mobile) {
      const scale = 1.06 + close * .22 + interior * .065 - leave * .30;
      this.group.scale.setScalar(scale);
      this.group.position.set(.40 + interior * .35, -2.15 + hero * .15 + leave * 1.1, 0);
      this.camera.position.set(px * .045 + this.routeDelta.x*.21,
        .40 + py * .035 + this.routeDelta.y*.24,
        11.8-traverse*3.30+this.routeDelta.z*.18);
      this.camera.lookAt(this.routeDelta.x*.06, -.12+this.routeDelta.y*.06, 0);
    } else {
      const scale = 1.06 + close * .31 + interior * .10 - leave * .34;
      this.group.scale.setScalar(scale);
      this.group.position.set(2.60 + close * .65 + interior * .57 - leave * .61, .10 + leave * .95, 0);
      this.camera.position.set(px * .11 + this.routeDelta.x*.28,
        .42 + py * .08 + this.routeDelta.y*.30,
        11.2-close*.24-traverse*3.65+this.routeDelta.z*.20);
      this.camera.lookAt(this.routeDelta.x*.075, this.routeDelta.y*.065, 0);
    }
    this.camera.updateMatrixWorld();
    this.group.updateMatrixWorld(true);

    // Register the *below-bed* outlet to the returning basket/drop attachment.
    // Unproject at the outlet's own depth, so this works with either camera
    // crop, viewport shape and pointer offset. No screen-coordinate shortcut
    // can move the liquid upward in its local material space.
    const registration = anchor ? smooth(6.35, 6.78, stage) : 0;
    this.outletWorld.copy(this.outlet).applyMatrix4(this.group.matrixWorld);
    this.outletProjected.copy(this.outletWorld).project(this.camera);
    if (anchor && registration > 0) {
      this.outletTarget.set(anchor.x*2-1, 1-anchor.y*2, this.outletProjected.z).unproject(this.camera);
      this.outletTarget.sub(this.outletWorld).multiplyScalar(registration);
      this.group.position.add(this.outletTarget);
      this.group.updateMatrixWorld(true);
      this.outletWorld.copy(this.outlet).applyMatrix4(this.group.matrixWorld);
      this.outletProjected.copy(this.outletWorld).project(this.camera);
    }
    const outletX = (this.outletProjected.x+1)*.5;
    const outletY = (1-this.outletProjected.y)*.5;
    this.handoff.progress = registration;
    this.handoff.outletX = outletX;
    this.handoff.outletY = outletY;
    this.handoff.targetX = anchor ? anchor.x : outletX;
    this.handoff.targetY = anchor ? anchor.y : outletY;
    this.handoff.errorPx = anchor ? Math.hypot((outletX-anchor.x)*this.width, (outletY-anchor.y)*this.height) : 0;
    this.heroGroup.position.y = subtleClock;
    this.heroGroup.rotation.y = -.18 + px * .019;
    this.heroGroup.scale.setScalar(1.27 - smooth(1.45, 1.90, stage) * .24);
    this.heroGroup.visible = hero > .001;
    for (const mesh of this.heroes) mesh.material.opacity = hero * opacity;

    const bedOpacity = opacity * coffeeExit * (1 - hero * .35) * (1 - pressure * .69);
    for (const batch of this.batches) {
      batch.mesh.visible = stage > 1.33 && bedOpacity > .002;
      batch.mesh.material.opacity = bedOpacity;
    }
    const boundaryOpacity = smooth(1.73, 2.21, stage) * (1 - smooth(4.37, 5.05, stage)) * opacity;
    this.boundary.visible = boundaryOpacity > .001;
    this.boundaryMaterial.opacity = boundaryOpacity * (1 - pressure * .69);
    this.keyLight.intensity = (3.8-close*.22+interior*.30) * (1-pressure*.64);
    this.rimLight.intensity = (1.25+extraction*.18) * (1-pressure*.63);
    this.fillLight.intensity = .64 * (1-pressure*.67);

    const flow = smooth(2.82, 3.50, stage) * opacity * liquidExit;
    this.flowGroup.visible = flow > .001;
    for (let i = 0; i < this.flowMaterials.length; i++) {
      const path = this.paths[i];
      const competition = .66 + .34 * Math.sin(path.seed * 37 + stage * .51) ** 2;
      const alpha = flow * (.62 + interior * .28) * competition * (1 - pressure * .39);
      this.flowMaterials[i].uniforms.uAlpha.value = alpha;
      // A path wholly below the wetting front has zero fragment alpha. The
      // Full three-scale boundary variation is below .275; .365 includes its
      // transition. No otherwise-visible wet branch is skipped.
      this.flowMeshes[i].visible = alpha > .001
        && this.flowMeshes[i].userData.maxFlowY > front - .365;
    }
    this.tracerMaterial.uniforms.uAlpha.value = flow * (.29 + interior * .25) * (1 - pressure * .45);
    if (flow > .001) this.updateTracers(time, reducedMotion);

    const inlet = smooth(2.80, 3.16, stage) * (1 - smooth(4.25, 4.95, stage));
    this.inletFilm.material.opacity = inlet * opacity * .085 * (1 - pressure * .61);
    this.inletFilm.visible = inlet > .001;
    this.pressureMaterial.uniforms.uAlpha.value = opacity * smooth(3.34, 4.0, stage) * (1 - smooth(4.49, 5.0, stage));
    this.pressureField.visible = this.pressureMaterial.uniforms.uAlpha.value > .001;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.scene.clear();
    for (const resource of this.resources) resource.dispose();
    this.resources.clear();
    this.environmentTarget?.dispose();
  }
}
