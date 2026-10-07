import * as THREE from 'three';

/**
 * CREMA / liquid material studies.
 *
 * All large-scale transformations are functions of `stage`. Time only animates
 * reflected light, very small stream striations and local crema films. This is
 * an authored material interpretation, not CFD, a pressure measurement or a
 * measured reconstruction of crema.
 *
 * Coordinates: `anchor` is the basket's liquid attachment point, in viewport
 * fractions with a top-left origin. The renderer belongs to the application.
 * This class never clears it, resizes it, starts a clock or changes scrolling.
 */

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const liquidVertex = /* glsl */ `
  uniform float uTime;
  uniform float uFlow;
  uniform float uLength;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vLocalPosition;
  varying vec2 vUv;

  void main() {
    vec3 p = position;
    float down = clamp(-p.y / max(uLength, 1.0), 0.0, 1.0);
    float free = smoothstep(0.035, 0.27, down);
    // The stream is a slender moving liquid, never a slowly wobbling gel tube.
    p.x += uFlow * free * (sin(down * 28.0 - uTime * 12.0) * 0.14
      + sin(down * 53.0 - uTime * 19.0) * 0.055);
    p.z += uFlow * free * sin(down * 37.0 - uTime * 15.0) * 0.075;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewPosition = -mv.xyz;
    vLocalPosition = p;
    vUv = uv;
    gl_Position = projectionMatrix * mv;
  }
`;

const liquidFragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uFlow;
  uniform float uWarmth;
  uniform float uLength;
  uniform float uLightShift;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vLocalPosition;
  varying vec2 vUv;

  float strip(float x, float center, float width) {
    float d = (x - center) / width;
    return exp(-d * d);
  }

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewPosition);
    float facing = max(dot(N, V), 0.0);
    vec3 R = reflect(-V, N);
    float down = clamp(-vLocalPosition.y / max(uLength, 1.0), 0.0, 1.0);
    float movement = sin(uTime * 0.38 + down * 1.8) * 0.006;

    // A simple analytic studio environment: tall cold strips, a dim warm
    // reflector below. Highlights are environment reflections, not outlines.
    float visibleBox = smoothstep(-0.23, 0.5, R.z);
    float cardHeight = smoothstep(-0.69, -0.41, R.y)
      * (1.0 - smoothstep(0.28, 0.63, R.y));
    float key = strip(R.x, -0.65 + uLightShift + movement, 0.087)
      * visibleBox * cardHeight;
    float keyEdge = strip(R.x, -0.71 + uLightShift, 0.014) * visibleBox;
    float fill = strip(R.x, 0.77 + movement * 0.4, 0.033)
      * smoothstep(-0.35, 0.55, R.z)
      * strip(R.y, -0.30, 0.24) * 0.54;
    float upper = strip(R.y, 0.76, 0.11) * smoothstep(0.30, 0.75, R.z);
    float lower = strip(R.y, -0.91, 0.07) * smoothstep(0.05, 0.6, R.z);
    float fresnel = pow(1.0 - facing, 3.1);

    // Dark centre / warm thin edge. The directional, coloured transmission is
    // a photographic material model, without an expensive screen-space pass.
    vec3 core = mix(vec3(0.009, 0.0028, 0.0014),
      vec3(0.030, 0.009, 0.0030), uWarmth);
    vec3 amber = mix(vec3(0.73, 0.145, 0.012),
      vec3(0.94, 0.29, 0.027), uWarmth);
    float thin = pow(1.0 - facing, 4.65);
    float bottomTransmission = pow(max(-N.y, 0.0), 7.0)
      * (0.3 + 0.7 * smoothstep(0.5, 0.97, down));
    vec3 col = core + amber * (thin * 0.98 + bottomTransmission * 0.63);
    col += vec3(0.040, 0.007, 0.001) * pow(1.0 - facing, 1.4);
    col += vec3(1.35, 1.39, 1.41) * (key * 0.96 + keyEdge * 0.18);
    col += vec3(1.17, 0.97, 0.71) * fill;
    col += vec3(0.69, 0.62, 0.53) * upper * 0.34;
    col += amber * lower * 0.38;
    col += vec3(0.75, 0.51, 0.24) * fresnel * 0.17;

    float striation = sin(down * 205.0 - uTime * 35.0
      + sin(down * 41.0 - uTime * 12.0) * 0.32);
    col *= 1.0 + uFlow * striation * 0.034;
    gl_FragColor = vec4(col, uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const planeVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const filmFragment = /* glsl */ `
  precision highp float;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uFlow;
  varying vec2 vUv;

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    p.y *= 2.0;
    float r = length(p);
    float a = atan(p.y, p.x);
    float boundary = 1.0 - smoothstep(0.70, 1.0, r);
    float ray = abs(sin(a * 11.0 + sin(a * 3.0) * 0.72 + r * 2.9));
    ray = pow(1.0 - smoothstep(0.0, 0.092, ray), 1.5);
    float broken = 0.56 + 0.44 * sin(a * 7.0 + r * 35.0);
    float shine = ray * broken * boundary * smoothstep(0.14, 0.35, r);
    float puddle = 1.0 - smoothstep(0.11, 0.51, r);
    vec3 col = vec3(0.10, 0.020, 0.003) + shine * vec3(0.8, 0.23, 0.024);
    col += puddle * vec3(0.025, 0.007, 0.001);
    float alpha = (puddle * 0.66 + shine * mix(0.20, 0.83, uFlow)) * uOpacity;
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(col, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const cremaFragment = /* glsl */ `
  precision highp float;
  uniform sampler2D uMap;
  uniform float uHasMap;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uAspect;
  uniform float uMapAspect;
  uniform float uMobile;
  uniform float uProgress;
  uniform float uReveal;
  uniform float uFormation;
  uniform float uPhotograph;
  uniform float uExit;
  uniform vec2 uOrigin;
  uniform vec2 uPointer;
  varying vec2 vUv;

  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453123);
  }

  float hash1(vec2 p) {
    return fract(sin(dot(p, vec2(41.83, 289.31))) * 43758.5453123);
  }

  float filmNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash1(i), hash1(i + vec2(1.0, 0.0)), f.x),
      mix(hash1(i + vec2(0.0, 1.0)), hash1(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  // F1, F2 and stable seed. Unequal packed cells stay within one liquid field.
  // Seed movement is below a fraction of a cell: there are no free soap balls.
  vec3 cells(vec2 p, out vec2 nearest) {
    vec2 base = floor(p);
    vec2 f = fract(p);
    float f1 = 10.0;
    float f2 = 10.0;
    float seed = 0.0;
    nearest = vec2(0.0);
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 g = vec2(float(x), float(y));
        vec2 h = hash2(base + g);
        vec2 site = 0.18 + 0.64 * h;
        site += 0.026 * sin(uTime * vec2(0.17, 0.13) + h * 6.2831);
        vec2 q = g + site - f;
        float d = dot(q, q) * mix(0.74, 1.28, h.x);
        if (d < f1) { f2 = f1; f1 = d; seed = h.y; nearest = q; }
        else { f2 = min(f2, d); }
      }
    }
    return vec3(sqrt(f1), sqrt(f2), seed);
  }

  vec2 coverUv(vec2 uv) {
    if (uMapAspect > uAspect) {
      float crop = uAspect / uMapAspect;
      // Portrait devices inspect the same material at a closer sectional crop.
      float center = mix(0.5, 0.55, uMobile);
      uv.x = (uv.x - 0.5) * crop + center;
    } else {
      uv.y = (uv.y - 0.5) * (uMapAspect / uAspect) + 0.5;
    }
    return uv;
  }

  void main() {
    vec2 screen = vUv;
    vec2 uv = coverUv(screen);
    vec2 focus = vec2(0.72, 0.44);
    float zoom = mix(1.0, 1.075, uProgress) - uExit * 0.035;
    uv = focus + (uv - focus) / zoom;
    uv += uPointer * vec2(0.0017, 0.0010);

    // Local film rearrangement, not whole-image jelly displacement. Amplitudes
    // are kept smaller than the large photographic cells in the source image.
    vec2 drift = vec2(
      sin(uv.y * 58.0 + sin(uv.x * 31.0) + uTime * 0.21),
      cos(uv.x * 51.0 + sin(uv.y * 39.0) - uTime * 0.16)
    );
    drift *= 0.00034;
    vec3 photo = texture2D(uMap, clamp(uv + drift, 0.001, 0.999)).rgb;

    vec2 p = vec2(screen.x * uAspect, screen.y) * mix(64.0, 53.0, uMobile);
    p += vec2(sin(screen.y * 13.0), cos(screen.x * 9.0)) * 0.42;
    vec2 nearest;
    vec3 c = cells(p, nearest);
    float gap = c.y - c.x;
    float wall = 1.0 - smoothstep(0.010, 0.060, gap);
    float interior = smoothstep(0.025, 0.26, gap);
    float speckle = hash1(floor(p * 12.0));
    float surface = smoothstep(-0.035, 0.035,
      screen.x - 0.25 - 0.35 * screen.y + sin(screen.y * 3.8) * 0.022);
    float gentleLight = 0.74 + 0.26 * sin(screen.y * 3.9 + screen.x * 1.7);
    vec3 procedural = mix(vec3(0.025, 0.005, 0.0015),
      vec3(0.37, 0.105, 0.016), (1.0 - interior) * gentleLight);
    procedural += wall * vec3(0.25, 0.092, 0.016) * mix(0.25, 1.0, c.z);
    procedural *= 0.86 + speckle * 0.19;
    procedural = mix(vec3(0.0026, 0.0030, 0.0026), procedural, surface);

    float luminance = dot(photo, vec3(0.2126, 0.7152, 0.0722));
    float materialMask = smoothstep(0.015, 0.15, luminance);
    // The photograph carries optical realism. The authored field adds a small
    // moving film response without drawing an unrelated lattice over the foam.
    float filmLife = sin(uTime * 0.36 + c.z * 12.0 + c.x * 2.0);
    vec3 photographic = photo * (1.0 + filmLife * 0.019 * materialMask);
    photographic += wall * materialMask * vec3(0.018, 0.007, 0.0012)
      * (0.45 + 0.55 * sin(uTime * 0.29 + c.z * 9.0));
    vec3 finishedSurface = mix(procedural, photographic, uHasMap);

    // A compact shallow surface forms directly beneath the real stream. Its
    // size stays bounded: the gas study never becomes a page-wide dot field.
    // The photographic macro has a separate source-bound reveal, composed
    // over this local surface so its dark negative space stays truly dark.
    vec2 fromSource = (screen - uOrigin) * vec2(uAspect, 1.0);
    vec2 poolSpace = fromSource * vec2(1.0, 2.85);
    float angle = atan(poolSpace.y, poolSpace.x);
    float poolDistance = length(poolSpace);
    float poolRadius = mix(0.018, mix(0.18, 0.115, uMobile),
      smoothstep(0.0, 0.86, uFormation));
    float boundaryVariation = (sin(angle * 7.0 + 0.6) * 0.003
      + sin(angle * 13.0 - 1.2) * 0.0015) * uFormation;
    float poolMask = 1.0 - smoothstep(poolRadius - 0.008,
      poolRadius + 0.013, poolDistance + boundaryVariation);
    float formationPresence = 1.0 - smoothstep(0.18, 0.74, uPhotograph);
    float poolAlpha = poolMask * formationPresence;

    // Continuous liquid shading is independent of individual cell births.
    // This avoids the polygon-shaped colour patches of a cellwise base coat.
    float broadFilm = filmNoise(poolSpace * 22.0 + vec2(3.0, 7.0));
    vec3 liquidBase = vec3(0.025, 0.0068, 0.0020) * (0.93 + broadFilm * 0.14);
    float poolReflection = exp(-pow((poolSpace.y + 0.012 + poolSpace.x * 0.055) / 0.018, 2.0))
      * exp(-pow(poolSpace.x / max(0.055, poolRadius * 0.77), 2.0));
    liquidBase += vec3(0.065, 0.039, 0.018) * poolReflection * mix(1.0, 0.28, uFormation);
    vec3 formingSurface = liquidBase;

    // The visible gas patch is small, dense and irregular. Warped sampling,
    // varied radii and seed-dependent births break regular rows. Brown cap
    // bodies and partial glints remain within one connected liquid film.
    if (poolAlpha > 0.001 && uFormation > 0.001) {
      vec2 field = poolSpace * mix(110.0, 125.0, uMobile);
      field += (vec2(filmNoise(field * 0.29 + 2.1),
        filmNoise(field * 0.23 + 17.9)) - 0.5) * 1.65;
      vec2 gasNearest;
      vec3 gas = cells(field, gasNearest);
      float localAge = clamp((poolRadius - poolDistance) / max(0.025, poolRadius * 0.65), 0.0, 1.0);
      float born = smoothstep(gas.z * 0.35 + 0.035,
        gas.z * 0.35 + 0.45, uFormation * mix(0.30, 1.0, localAge));
      float capRadius = mix(0.13, 0.49, pow(gas.z, 1.6)) * mix(0.32, 1.0, born);
      float cap = (1.0 - smoothstep(capRadius * 0.71, capRadius, gas.x)) * born;
      float capHeight = sqrt(max(0.0001, capRadius * capRadius - dot(gasNearest, gasNearest)));
      vec3 capNormal = normalize(vec3(gasNearest * 0.91, capHeight));
      float glint = pow(max(dot(capNormal, normalize(vec3(-0.48, 0.57, 0.67))), 0.0), 24.0);
      vec3 gasCap = liquidBase * mix(0.39, 0.72, gas.z);
      gasCap += glint * vec3(0.20, 0.135, 0.065) * mix(0.35, 1.0, gas.z);
      formingSurface = mix(liquidBase, gasCap, cap);
    }

    float photoRadius = mix(0.012, max(1.65, uAspect * 1.08), pow(uReveal, 1.08));
    float photoEdge = mix(0.012, 0.12, uReveal);
    float photoMask = 1.0 - smoothstep(photoRadius - photoEdge,
      photoRadius + photoEdge, length(fromSource));
    float photoAlpha = photoMask * uPhotograph;
    float surfaceAlpha = photoAlpha + poolAlpha * (1.0 - photoAlpha);
    // At the established crema hold the curated photograph owns all large
    // structure. Premultiplied-over composition prevents the earlier pool
    // from tinting black photographic regions or overlaying the mature foam.
    vec3 col = (finishedSurface * photoAlpha
      + formingSurface * poolAlpha * (1.0 - photoAlpha)) / max(surfaceAlpha, 0.0001);

    float leftShade = mix(0.74, 1.0, smoothstep(0.12, 0.55, screen.x));
    float portraitShade = mix(1.0, 0.58, smoothstep(0.50, 0.93, screen.y));
    col *= mix(leftShade, portraitShade, uMobile);
    col *= 0.96 + 0.04 * smoothstep(0.0, 0.5, min(screen.x, 1.0 - screen.x));

    gl_FragColor = vec4(col, uOpacity * surfaceAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function liquidMaterial(flow = 0) {
  return new THREE.ShaderMaterial({
    vertexShader: liquidVertex,
    fragmentShader: liquidFragment,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uFlow: { value: flow },
      uWarmth: { value: 0 },
      uLength: { value: 100 },
      uLightShift: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.FrontSide,
  });
}

/** Dynamic surface of revolution. Normals are derived from its real silhouette. */
function createSurface(rings = 96, sides = 56) {
  const geometry = new THREE.BufferGeometry();
  const count = (rings + 1) * (sides + 1);
  const position = new Float32Array(count * 3);
  const normal = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  const index = [];
  for (let row = 0; row <= rings; row++) {
    for (let side = 0; side <= sides; side++) {
      const vertex = row * (sides + 1) + side;
      uv[vertex * 2] = side / sides;
      uv[vertex * 2 + 1] = row / rings;
      if (row < rings && side < sides) {
        const next = vertex + sides + 1;
        index.push(vertex, vertex + 1, next, vertex + 1, next + 1, next);
      }
    }
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normal, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geometry.setIndex(index);
  geometry.userData.profile = new Float32Array((rings + 1) * 2);
  geometry.userData.rings = rings;
  geometry.userData.sides = sides;
  return geometry;
}

function updateSurface(geometry, profile) {
  const { rings, sides } = geometry.userData;
  const points = geometry.userData.profile;
  const pos = geometry.attributes.position.array;
  const normals = geometry.attributes.normal.array;
  for (let row = 0; row <= rings; row++) {
    const p = profile(row / rings);
    points[row * 2] = Math.max(0.00001, p[0]);
    points[row * 2 + 1] = p[1];
  }
  for (let row = 0; row <= rings; row++) {
    const before = Math.max(0, row - 1) * 2;
    const after = Math.min(rings, row + 1) * 2;
    const dr = points[after] - points[before];
    const dy = points[after + 1] - points[before + 1];
    const normalLength = Math.sqrt(dr * dr + dy * dy) || 1;
    const r = points[row * 2];
    const y = points[row * 2 + 1];
    for (let side = 0; side <= sides; side++) {
      const angle = (side / sides) * Math.PI * 2;
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      const i = (row * (sides + 1) + side) * 3;
      pos[i] = r * c;
      pos[i + 1] = -y;
      pos[i + 2] = r * s;
      normals[i] = (dy * c) / normalLength;
      normals[i + 1] = dr / normalLength;
      normals[i + 2] = (dy * s) / normalLength;
    }
  }
  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.normal.needsUpdate = true;
  geometry.computeBoundingSphere();
}

function cubic(a, b, c, d, t) {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
}

/** Three Bezier sections make one continuous meniscus, neck and rounded mass. */
function attachedProfile(length, topRadius, neckRadius, dropRadius) {
  return (v) => {
    if (v < 0.38) {
      const t = v / 0.38;
      return [
        cubic(topRadius, topRadius * 0.28, neckRadius, neckRadius, t),
        cubic(0, length * 0.065, length * 0.255, length * 0.425, t),
      ];
    }
    if (v < 0.75) {
      const t = (v - 0.38) / 0.37;
      return [
        cubic(neckRadius, neckRadius * 0.92, dropRadius * 1.02, dropRadius, t),
        cubic(length * 0.425, length * 0.59, length * 0.675, length * 0.81, t),
      ];
    }
    const t = (v - 0.75) / 0.25;
    return [
      cubic(dropRadius, dropRadius, dropRadius * 0.65, 0, t),
      cubic(length * 0.81, length * 0.925, length, length, t),
    ];
  };
}

function fallingProfile(radius, elongation = 1.10, tear = 0.0) {
  return (v) => {
    const angle = Math.PI * v;
    return [
      radius * Math.sin(angle) * (1 - tear * (1 - v) ** 2),
      radius * elongation * (1 - Math.cos(angle)),
    ];
  };
}

export default class LiquidWorld {
  constructor({ renderer, assets = {} }) {
    if (!renderer) throw new Error('LiquidWorld requires the application renderer.');
    this.renderer = renderer;
    this.assets = assets;
    this.width = 1;
    this.height = 1;
    this.disposed = false;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 20000);
    this.camera.position.z = 5000;
    this.camera.lookAt(0, 0, 0);
    this.lastShapeKey = '';
    this.ownedTextures = new Set();
    this.assetReference = null;
    this.cremaReady = false;

    const makeLiquid = (flow, order) => {
      const mesh = new THREE.Mesh(createSurface(), liquidMaterial(flow));
      mesh.frustumCulled = false;
      mesh.renderOrder = order;
      this.scene.add(mesh);
      return mesh;
    };
    this.attached = makeLiquid(0, 3);
    this.falling = makeLiquid(0, 4);
    this.secondFalling = makeLiquid(0, 4);
    this.stream = makeLiquid(1, 5);
    this.liquidMeshes = [this.attached, this.falling, this.secondFalling, this.stream];

    this.film = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.ShaderMaterial({
        vertexShader: planeVertex,
        fragmentShader: filmFragment,
        uniforms: {
          uOpacity: { value: 0 },
          uTime: { value: 0 },
          uFlow: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        depthTest: false,
      }),
    );
    this.film.renderOrder = 2;
    this.scene.add(this.film);

    this.fallbackTexture = new THREE.DataTexture(new Uint8Array([2, 2, 2, 255]), 1, 1);
    this.fallbackTexture.needsUpdate = true;
    this.ownedTextures.add(this.fallbackTexture);
    this.crema = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.ShaderMaterial({
        vertexShader: planeVertex,
        fragmentShader: cremaFragment,
        toneMapped: false,
        uniforms: {
          uMap: { value: this.fallbackTexture },
          uHasMap: { value: 0 },
          uOpacity: { value: 0 },
          uTime: { value: 0 },
          uAspect: { value: 1 },
          uMapAspect: { value: 16 / 9 },
          uMobile: { value: 0 },
          uProgress: { value: 0 },
          uReveal: { value: 0 },
          uFormation: { value: 0 },
          uPhotograph: { value: 0 },
          uExit: { value: 0 },
          uOrigin: { value: new THREE.Vector2(0.5, 0.085) },
          uPointer: { value: new THREE.Vector2() },
        },
        transparent: true,
        depthWrite: false,
        depthTest: false,
      }),
    );
    this.crema.renderOrder = 8;
    this.crema.frustumCulled = false;
    this.scene.add(this.crema);
    this._syncAsset();

    const size = renderer.getSize(new THREE.Vector2());
    this.resize(size.x || 1, size.y || 1);
  }

  _syncAsset() {
    const asset = this.assets.crema;
    if (!asset || asset === this.assetReference) return;
    this.assetReference = asset;
    const use = (texture, owns = false) => {
      if (this.disposed || this.assetReference !== asset) {
        if (owns) texture.dispose();
        return;
      }
      if (owns) this.ownedTextures.add(texture);
      this.crema.material.uniforms.uMap.value = texture;
      this.crema.material.uniforms.uHasMap.value = 1;
      this.cremaReady = true;
      this._updateMapAspect();
    };
    if (asset.isTexture) {
      use(asset);
    } else if (typeof asset === 'string') {
      const loader = new THREE.TextureLoader();
      loader.load(asset, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        use(texture, true);
      }, undefined, () => {
        // A failed optional photographic asset leaves the authored field alive.
        this.cremaReady = false;
      });
    } else if (asset.width || asset.videoWidth || asset.naturalWidth) {
      const texture = new THREE.Texture(asset);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      use(texture, true);
    }
  }

  _updateMapAspect() {
    const image = this.crema.material.uniforms.uMap.value?.image;
    const width = image?.naturalWidth || image?.videoWidth || image?.width;
    const height = image?.naturalHeight || image?.videoHeight || image?.height;
    if (width && height) this.crema.material.uniforms.uMapAspect.value = width / height;
  }

  resize(width, height) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.camera.left = -this.width / 2;
    this.camera.right = this.width / 2;
    this.camera.top = this.height / 2;
    this.camera.bottom = -this.height / 2;
    this.camera.updateProjectionMatrix();
    this.crema.scale.set(this.width, this.height, 1);
    this.crema.material.uniforms.uAspect.value = this.width / this.height;
    this.crema.material.uniforms.uMobile.value = this.width < 760 ? 1 : 0;
    this.lastShapeKey = '';
  }

  _setSurface(mesh, profile, length) {
    updateSurface(mesh.geometry, profile);
    mesh.material.uniforms.uLength.value = length;
  }

  _shape(stage, unit, scale) {
    // machineScale is intentionally bounded: camera enlargement must never turn
    // the source into a honey column or push the hero drop into the wordmark.
    const machine = clamp(scale, 0.55, 1.6);
    const hero = stage < 1;
    const reference = unit * mix(0.86, 1.0, clamp((machine - 0.55) / 1.05));
    let length;
    let top;
    let neck;
    let radius;
    let attachedOpacity = 1;
    let firstOpacity = 0;
    let secondOpacity = 0;

    if (hero) {
      const tension = smooth(0.03, 0.49, stage);
      length = reference * mix(0.093, 0.112, tension);
      top = reference * 0.031;
      neck = reference * mix(0.0080, 0.0069, tension);
      radius = reference * mix(0.023, 0.026, tension);
      this._setSurface(this.attached, attachedProfile(length, top, neck, radius), length);
    } else {
      const growth = smooth(6.76, 7.37, stage);
      const pinch = smooth(7.31, 7.455, stage);
      length = reference * mix(0.064, 0.326, growth);
      top = reference * mix(0.029, 0.044, growth);
      neck = reference * mix(0.010, 0.00042, pinch);
      radius = reference * mix(0.017, 0.053, growth);

      if (stage < 7.455) {
        this._setSurface(this.attached, attachedProfile(length, top, neck, radius), length);
      } else if (stage < 7.64) {
        // The upper remnant retracts after the neck has pinched. Its timing is
        // independent of frame history and reverses through the same shape.
        const retract = smooth(7.455, 7.61, stage);
        length = reference * mix(0.176, 0.046, retract);
        radius = reference * mix(0.0024, 0.012, retract);
        this._setSurface(this.attached,
          attachedProfile(length, reference * 0.044, reference * 0.003, radius), length);
      } else {
        const regrowth = smooth(7.64, 7.785, stage);
        const repinch = smooth(7.745, 7.795, stage);
        length = reference * mix(0.047, 0.215, regrowth);
        radius = reference * mix(0.011, 0.031, regrowth);
        neck = reference * mix(0.007, 0.0006, repinch);
        if (stage < 7.795) {
          this._setSurface(this.attached,
            attachedProfile(length, reference * 0.038, neck, radius), length);
        } else {
          const retract = smooth(7.795, 7.9, stage);
          length = reference * mix(0.105, 0.041, retract);
          this._setSurface(this.attached,
            attachedProfile(length, reference * 0.038, reference * 0.004,
              reference * mix(0.002, 0.009, retract)), length);
        }
      }

      firstOpacity = smooth(7.451, 7.460, stage) * (1 - smooth(7.655, 7.705, stage));
      if (firstOpacity > 0) {
        const fall = clamp((stage - 7.455) / 0.24);
        const r = reference * 0.053;
        const elongation = mix(1.09, 1.015, smooth(0, 0.48, fall));
        this._setSurface(this.falling,
          fallingProfile(r, elongation, 0.36 * (1 - smooth(0, 0.40, fall))), r * 2 * elongation);
        this.falling.userData.fallOffset = reference * 0.224 + unit * (fall * 0.07 + fall * fall * 1.02);
        this.falling.userData.driftOffset = Math.sin(fall * 2.5) * unit * 0.0009;
      }
      secondOpacity = smooth(7.791, 7.800, stage) * (1 - smooth(8.00, 8.07, stage));
      if (secondOpacity > 0) {
        const fall = clamp((stage - 7.795) / 0.27);
        const r = reference * 0.031;
        const elongation = mix(1.16, 1.03, smooth(0, 0.45, fall));
        this._setSurface(this.secondFalling,
          fallingProfile(r, elongation, 0.29 * (1 - smooth(0, 0.42, fall))), r * 2 * elongation);
        this.secondFalling.userData.fallOffset = reference * 0.147 + unit * (fall * 0.10 + fall * fall * 1.09);
        this.secondFalling.userData.driftOffset = -Math.sin(fall * 2.3) * unit * 0.0007;
      }
      attachedOpacity = 1 - smooth(7.91, 8.04, stage);
    }

    const streamGrowth = smooth(7.88, 8.14, stage);
    const streamLength = unit * mix(0.035, 1.12, streamGrowth);
    if (streamGrowth > 0) {
      const streamRadius = reference * mix(0.0095, 0.0078, smooth(8.04, 8.58, stage));
      const topRadius = reference * 0.042;
      const endCap = mix(0.016, 0, smooth(7.96, 8.13, stage));
      this._setSurface(this.stream, (v) => {
        const funnel = Math.exp(-v * streamLength / (reference * 0.018));
        const jet = streamRadius * (1 - v * 0.075)
          * (1 + Math.sin(v * 51) * 0.014 + Math.sin(v * 117) * 0.006);
        const tip = endCap * reference * Math.exp(-(((v - 0.97) / 0.045) ** 2));
        const cap = 1 - smooth(0.986, 1, v);
        return [(mix(jet, topRadius, funnel) + tip) * cap, v * streamLength];
      }, streamLength);
    }

    this.shapeState = {
      attachedOpacity,
      firstOpacity,
      secondOpacity,
      streamOpacity: smooth(7.89, 8.03, stage),
      reference,
    };
  }

  render({ stage = 0, time = 0, pointer = { x: 0, y: 0 }, reducedMotion = false,
    anchor = { x: 0.5, y: 0.42 }, machineScale = 1 } = {}) {
    if (this.disposed) return;
    this._syncAsset();
    this._updateMapAspect();
    const s = clamp(Number.isFinite(stage) ? stage : 0, 0, 10);
    const clock = reducedMotion ? 0 : time;
    const heroOpacity = 1 - smooth(0.56, 0.91, s);
    const returnOpacity = smooth(6.67, 6.99, s) * (1 - smooth(8.60, 8.95, s));
    const liquidOpacity = Math.max(heroOpacity, returnOpacity);
    const cremaOpacity = smooth(8.56, 8.68, s) * (1 - smooth(9.65, 10.0, s));
    if (liquidOpacity < 0.001 && cremaOpacity < 0.001) return;

    // On portrait screens the closer source crop retains a substantial droplet.
    // The width cap prevents the macro sphere from overwhelming a narrow view.
    const unit = Math.min(this.height, this.width * 1.88);
    const shapeKey = `${s.toFixed(6)}:${unit.toFixed(2)}:${machineScale.toFixed(4)}`;
    if (liquidOpacity > 0.001 && shapeKey !== this.lastShapeKey) {
      this._shape(s, unit, machineScale);
      this.lastShapeKey = shapeKey;
    }
    const x = (anchor.x - 0.5) * this.width;
    const y = (0.5 - anchor.y) * this.height;
    const state = this.shapeState || {
      attachedOpacity: 0, firstOpacity: 0, secondOpacity: 0,
      streamOpacity: 0, reference: unit,
    };
    const alphas = [state.attachedOpacity, state.firstOpacity, state.secondOpacity, state.streamOpacity];
    for (let i = 0; i < this.liquidMeshes.length; i++) {
      const mesh = this.liquidMeshes[i];
      const alpha = liquidOpacity * alphas[i];
      mesh.visible = alpha > 0.001;
      mesh.position.set(x + (mesh.userData.driftOffset || 0), y - (mesh.userData.fallOffset || 0), 0);
      const u = mesh.material.uniforms;
      u.uTime.value = clock;
      u.uOpacity.value = alpha;
      u.uWarmth.value = smooth(7.84, 8.62, s);
      u.uLightShift.value = clamp(pointer.x || 0, -1, 1) * 0.018;
    }
    this.film.visible = liquidOpacity > 0.001;
    this.film.position.set(x, y + unit * 0.014, -1);
    this.film.scale.set(state.reference * 0.40, state.reference * 0.16, 1);
    this.film.material.uniforms.uOpacity.value = liquidOpacity * (s < 1 ? 0.61 : 1);
    this.film.material.uniforms.uTime.value = clock;
    this.film.material.uniforms.uFlow.value = s < 1 ? 0.20 : smooth(6.8, 7.30, s);

    this.crema.visible = cremaOpacity > 0.001;
    const cu = this.crema.material.uniforms;
    cu.uOpacity.value = cremaOpacity;
    cu.uTime.value = clock;
    cu.uProgress.value = smooth(8.65, 9.67, s);
    cu.uReveal.value = smooth(8.70, 8.97, s);
    cu.uFormation.value = smooth(8.64, 8.79, s);
    cu.uPhotograph.value = smooth(8.72, 8.86, s);
    cu.uExit.value = smooth(9.65, 10, s);
    // Shader UVs have their origin at the bottom left. Follow the stream's
    // actual x attachment on both portrait and landscape compositions.
    cu.uOrigin.value.set(clamp(anchor.x, 0, 1), 0.085);
    cu.uPointer.value.set(clamp(pointer.x || 0, -1, 1), clamp(pointer.y || 0, -1, 1));
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.scene.traverse((object) => {
      object.geometry?.dispose();
      if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
      else object.material?.dispose();
    });
    for (const texture of this.ownedTextures) texture.dispose();
    this.ownedTextures.clear();
    this.scene.clear();
  }
}
