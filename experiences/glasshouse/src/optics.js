import {
  AdditiveBlending,
  BackSide,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  FrontSide,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  NormalBlending,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShaderMaterial,
  Vector3,
} from 'three';
import { atmosphereGLSL } from './atmosphere.js';

const clamp01 = (value) => MathUtils.clamp(value, 0, 1);

/**
 * An original, deterministic photographic studio, baked once into a linear HDR
 * environment. Bright rectangles are deliberately separated by dark flags: the
 * alternation gives a glass edge something legible to reflect. It is not a
 * downloaded HDRI and does not introduce a second render loop.
 */
export function createEnvironment(renderer) {
  const studio = new Scene();
  studio.name = 'GLASSHOUSE / procedural reflection studio';
  studio.background = new Color(0x7a858c);

  const roomMaterials = [0x151e24, 0xaab5bc, 0xd2d9de, 0x79868e, 0x202b32, 0x8a979f]
    .map((color) => new MeshBasicMaterial({ color, side: BackSide, toneMapped: false }));
  const room = new Mesh(new BoxGeometry(42, 36, 42), roomMaterials);
  room.position.y = 3;
  studio.add(room);

  function rectangle(width, height, color, brightness = 1) {
    return new Mesh(
      new PlaneGeometry(width, height),
      new MeshBasicMaterial({
        color: new Color(color).multiplyScalar(brightness),
        side: DoubleSide,
        toneMapped: false,
      }),
    );
  }

  function flag(position, width, height, color = 0x151b1d, brightness = 1) {
    const panel = rectangle(width, height, color, brightness);
    panel.position.fromArray(position);
    panel.lookAt(0, 0, 0);
    studio.add(panel);
    return panel;
  }

  function window(position, width, height, color, brightness, divisions = 0) {
    const assembly = new Group();
    assembly.position.fromArray(position);
    assembly.lookAt(0, 0, 0);

    // A broad, feathered diffusion panel gives generous light, not pin lights.
    const material = new ShaderMaterial({
      uniforms: { uColor: { value: new Color(color).multiplyScalar(brightness) } },
      side: DoubleSide,
      toneMapped: false,
      vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        uniform vec3 uColor;
        varying vec2 vUv;
        void main() {
          vec2 edge = min(vUv, 1.0 - vUv);
          float feather = smoothstep(0.0, 0.010, min(edge.x, edge.y));
          float diffusion = mix(0.76, 1.0, smoothstep(0.0, 0.72, vUv.y));
          gl_FragColor = vec4(uColor * mix(0.15, diffusion, feather), 1.0);
          #include <colorspace_fragment>
        }
      `,
    });
    assembly.add(new Mesh(new PlaneGeometry(width, height), material));

    for (let i = 1; i <= divisions; i += 1) {
      const mullion = rectangle(0.26, height, 0x090f13);
      mullion.position.set(-width / 2 + width * i / (divisions + 1), 0, 0.025);
      assembly.add(mullion);
    }
    if (divisions > 0) {
      const crossBar = rectangle(width, 0.20, 0x0b141a);
      crossBar.position.set(0, height * 0.16, 0.030);
      assembly.add(crossBar);
    }
    studio.add(assembly);
  }

  // The principal window and its opposed dark flag shape the hero's bevels.
  flag([-7.0, 2.5, 15.0], 13.5, 20.0, 0x080e12);
  window([-11.5, 3.8, 11.5], 3.0, 16.0, 0xf5f8fa, 6.4, 1);
  window([-7.6, 1.6, 12.8], 1.15, 12.5, 0xffffff, 8.2);
  window([-4.8, 3.0, 13.9], 2.2, 16.0, 0xf3f7fa, 4.5);
  flag([5.5, 2.0, 13.5], 9.5, 18.0, 0x0b151d);
  window([3.5, 3, -16.5], 7.5, 13, 0xfffaf0, 4.0, 2);
  window([-13.5, 3.0, -3], 5.6, 13.5, 0xe8f2f8, 4.4, 2);
  window([1, 15.5, -2], 12.0, 8.0, 0xf5f6f6, 1.65);

  // Narrow reflections are line-shaped area sources, not blue emissive glass.
  flag([13.5, 1.5, 5], 0.52, 14, 0xf2fbff, 7.1);
  flag([5.5, 2, -13], 0.14, 13.5, 0xffffff, 9.0);
  flag([-8.2, 1, -12.5], 0.11, 11.5, 0xf9f6ed, 6.8);
  flag([11.5, 1, -9], 7.5, 16, 0x071017);
  flag([-2, 8, 12.0], 12.5, 0.13, 0xffffff, 6.3);
  flag([-5.0, -3.4, 13.1], 10.5, 0.11, 0xeaf5fb, 5.2);

  const generator = new PMREMGenerator(renderer);
  let target;
  try {
    // The environment is built before the first resize, so renderer size can
    // still be 1×1 here. A fixed 512 face keeps the narrow sources resolved.
    target = generator.fromScene(studio, 0.003, 0.1, 80, { size: 512 });
    target.texture.name = 'GLASSHOUSE / original studio PMREM';
  } finally {
    generator.dispose();
    studio.traverse((object) => {
      object.geometry?.dispose();
      if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
      else object.material?.dispose();
    });
  }

  let disposed = false;
  return {
    texture: target.texture,
    dispose() {
      if (disposed) return;
      disposed = true;
      target.dispose();
    },
  };
}

/**
 * A solid dielectric. Use closed, preferably bevelled geometry, and assign the
 * environment to scene.environment. Optical transparency is transmission;
 * alpha remains one, avoiding transparent-pass sorting between glass faces.
 */
export function createGlassMaterial({
  roughness = 0.05,
  transmission = 1,
  thickness = 0.65,
  color = 0xe3f1f2,
  metalness = 0,
  ior = 1.46,
} = {}) {
  return new MeshPhysicalMaterial({
    name: 'GLASSHOUSE / clear optical glass',
    color,
    roughness: MathUtils.clamp(roughness, 0, 1),
    metalness: MathUtils.clamp(metalness, 0, 1),
    transmission: clamp01(transmission),
    thickness: Math.max(0, thickness),
    ior: MathUtils.clamp(ior, 1, 2.333),
    attenuationColor: new Color(0xd6e8e7),
    attenuationDistance: 12.0,
    dispersion: 0.024,
    specularIntensity: 1,
    specularColor: new Color(0xffffff),
    envMapIntensity: 1.08,
    clearcoat: 0,
    opacity: 1,
    transparent: false,
    side: FrontSide,
    depthWrite: true,
  });
}

/**
 * Art-directed projected light, not ray-traced caustics. Sparse, directionally
 * stretched folds resemble a slightly imperfect optical surface. There is no
 * cellular water texture. Analytic glass shadows establish a shared ground.
 * The distant floor converges to the scene's LINEAR background before the
 * standard output chunks, so a final HDR composite can tone map both equally.
 */
export function createAtmosphereFloor({ lightTexture = null } = {}) {
  const uniforms = {
    uTime: { value: 0 },
    tProjectedLight: { value: lightTexture },
    uDarkness: { value: 0 },
    uLightAngle: { value: 0 },
    uEnergy: { value: 0.8 },
    uChapter: { value: 0 },
    uPale: { value: new Color(0xc7d0d6) },
    uDark: { value: new Color(0x11161a) },
    uBackgroundBright: { value: new Color('#e6e9ed') },
    uBackgroundDark: { value: new Color('#11161a') },
    uSkySilver: { value: new Color('#8297a7') },
    uSkyWhite: { value: new Color('#f6f7f7') },
    uCool: { value: new Color(0xeff7fa) },
    uWarm: { value: new Color(0xfff0d3) },
  };

  const material = new ShaderMaterial({
    name: 'GLASSHOUSE / directional light folds and atmosphere',
    uniforms,
    transparent: false,
    depthWrite: true,
    vertexShader: /* glsl */`
      varying vec3 vWorldPosition;
      varying vec4 vClipPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
        vClipPosition = gl_Position;
      }
    `,
    fragmentShader: /* glsl */`
      uniform float uTime;
      uniform sampler2D tProjectedLight;
      uniform float uDarkness;
      uniform float uLightAngle;
      uniform float uEnergy;
      uniform float uChapter;
      uniform vec3 uPale;
      uniform vec3 uDark;
      uniform vec3 uBackgroundBright;
      uniform vec3 uBackgroundDark;
      uniform vec3 uSkySilver;
      uniform vec3 uSkyWhite;
      uniform vec3 uCool;
      uniform vec3 uWarm;
      varying vec3 vWorldPosition;
      varying vec4 vClipPosition;

      ${atmosphereGLSL}

      vec2 hash22(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.xx + p3.yz) * p3.zy);
      }

      float noise2(vec2 p) {
        vec2 cell = floor(p);
        vec2 f = fract(p);
        vec2 s = f * f * (3.0 - 2.0 * f);
        float a = hash22(cell).x;
        float b = hash22(cell + vec2(1.0, 0.0)).x;
        float c = hash22(cell + vec2(0.0, 1.0)).x;
        float d = hash22(cell + vec2(1.0, 1.0)).x;
        return mix(mix(a, b, s.x), mix(c, d, s.x), s.y);
      }

      float square(float v) { return v * v; }

      float glassShadow(float side, float along, float centre, float width, float extent) {
        float widening = width + max(0.0, along) * 0.024;
        float across = exp(-square((side - centre) / widening));
        return across * smoothstep(-0.45, 0.6, along)
          * (1.0 - smoothstep(extent * 0.55, extent, along));
      }

      float crease(vec2 p, float anchor, float seed, float width) {
        // Independent low-frequency curvature, finer imperfections, and gaps
        // produce open, tapered light folds instead of a closed regular mesh.
        float drift = uTime * 0.011;
        float broad = noise2(vec2(p.y * 0.28 + seed + drift, seed * 1.91)) - 0.5;
        float fine = noise2(vec2(p.y * 0.87 - seed * 1.3, seed + 10.0 - drift)) - 0.5;
        float centre = anchor + broad * 1.25 + fine * 0.23;
        float distanceToFold = abs(p.x - centre);
        float focus = noise2(vec2(p.y * 0.45 + seed * 0.73, seed + 2.7));
        float coreWidth = width * mix(0.38, 1.0, focus);
        float pixel = min(0.055, fwidth(distanceToFold)) * 0.70;
        float core = 1.0 - smoothstep(coreWidth + pixel, coreWidth * 1.85 + pixel, distanceToFold);
        float aura = exp(-square(distanceToFold / (coreWidth * 5.5 + pixel)));
        float broken = smoothstep(0.27, 0.66,
          noise2(vec2(p.y * 0.39 + seed * 0.61 + drift * 0.5, seed + 8.3)));
        float start = -2.5 + fract(seed * 0.713) * 3.0;
        float end = 4.5 + fract(seed * 0.421) * 5.5;
        float segment = smoothstep(start, start + 1.7, p.y)
          * (1.0 - smoothstep(end - 2.5, end, p.y));
        return (core * 0.90 + aura * 0.10) * broken * segment;
      }

      void main() {
        vec2 point = vWorldPosition.xz - vec2(1.5, 0.0);
        float angle = uLightAngle * 0.62 + 0.89;
        vec2 direction = vec2(cos(angle), sin(angle));
        vec2 tangent = vec2(-direction.y, direction.x);
        float along = dot(point, direction);
        float side = dot(point, tangent);
        float distanceFromWork = length(point);
        vec2 skyUv = vClipPosition.xy / vClipPosition.w * .5 + .5;
        vec3 background = sampleAtmosphere(skyUv, uDarkness, uBackgroundBright,
          uBackgroundDark, uSkySilver, uSkyWhite);
        vec3 base = mix(uPale, uDark, uDarkness);

        // The subdued, broad room light does more compositional work than the
        // high-frequency detail. A gentle field keeps the floor photographic.
        float daylight = exp(-dot(point - vec2(-3.2, -2.5), point - vec2(-3.2, -2.5)) * 0.018);
        base += vec3(0.095, 0.092, 0.086) * daylight * (1.0 - uDarkness);
        float contact = exp(-(point.x * point.x * 0.14 + point.y * point.y * 0.92));
        float shadow = 0.23 * contact;
        shadow += glassShadow(side, along, -1.8, 0.15, 9.5) * 0.16;
        shadow += glassShadow(side, along, -0.25, 0.38, 11.5) * 0.105;
        shadow += glassShadow(side, along, 1.65, 0.12, 9.0) * 0.18;
        shadow += glassShadow(side, along, 2.25, 0.65, 6.0) * 0.07;
        base *= 1.0 - min(0.40, shadow) * mix(1.0, 0.36, uDarkness);

        vec2 poolPosition = point - direction * 1.35 - vec2(0.0, 0.65);
        vec2 ellipse = poolPosition * vec2(0.205, 0.175);
        float pool = exp(-dot(ellipse, ellipse) * 1.60);
        pool *= 1.0 - smoothstep(7.5, 12.0, distanceFromWork);
        float caustic = 0.0;
        float warmth = 0.0;
        if (pool > 0.007) {
          vec2 p = vec2(side * 0.93, along * 0.78);
          caustic += crease(p, -2.65, 1.23, 0.025) * 0.75;
          caustic += crease(p, -1.36, 4.67, 0.016) * 0.95;
          caustic += crease(p, -0.40, 8.91, 0.027) * 1.00;
          caustic += crease(p,  0.32, 3.47, 0.019) * 0.70;
          caustic += crease(p,  1.58, 6.19, 0.021) * 0.90;
          caustic += crease(p,  2.87, 9.71, 0.016) * 0.60;
          // Two weaker, oblique branches intersect selected folds without
          // turning the entire ground into a uniformly connected pattern.
          vec2 oblique = mat2(0.94, -0.34, 0.34, 0.94) * p;
          caustic += crease(oblique, -0.81, 2.89, 0.011) * 0.37;
          caustic += crease(oblique,  1.88, 7.39, 0.014) * 0.30;
          warmth = smoothstep(0.52, 0.81, noise2(p * 0.28 + 12.3)) * 0.48;
        }

        // A long window edge has a much softer transmitted neighbour. Its
        // strength is limited, preserving areas of quiet material between folds.
        float edgeFocus = glassShadow(side, along, 0.08, 0.022, 9.8) * 0.13;
        edgeFocus += glassShadow(side, along, -1.57, 0.045, 8.0) * 0.07;
        vec3 lightColour = mix(uCool, uWarm, warmth);
        float chapterBreath = 0.97 + 0.03 * cos(uChapter * 0.80);
        float energy = (min(caustic, 1.65) * pool + edgeFocus) * uEnergy * chapterBreath;
        base += lightColour * energy * mix(0.35, 0.10, uDarkness);
        vec2 projectedUv=vec2(side*.095+.51,along*.095+.43);
        projectedUv+=vec2(sin(uTime*.045),cos(uTime*.037))*.005;
        vec3 projectedLight=texture2D(tProjectedLight,projectedUv).rgb;
        base+=projectedLight*pool*uEnergy*mix(.92,.23,uDarkness);
        base += lightColour * pool * uEnergy * 0.015 * (1.0 - uDarkness * 0.86);

        float aggregate = noise2(vWorldPosition.xz * 18.0) - 0.5;
        base += aggregate * 0.0020 * (1.0 - uDarkness);
        // The horizon meets the sky at this exact screen coordinate, including
        // its window field, so a camera change cannot expose a flat-color seam.
        float atmosphere = smoothstep(7.0, 28.0, distanceFromWork);
        base = mix(base, background, atmosphere);
        gl_FragColor = vec4(max(base, vec3(0.0)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });

  const mesh = new Mesh(new PlaneGeometry(200, 200), material);
  mesh.name = 'GLASSHOUSE / continuous atmosphere floor';
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -2.3;
  mesh.frustumCulled = false;

  return {
    mesh,
    update({ time = 0, darkness = 0, lightAngle = 0, energy = 0.8, chapter = 0 } = {}) {
      uniforms.uTime.value = Number.isFinite(time) ? time : 0;
      uniforms.uDarkness.value = clamp01(darkness);
      uniforms.uLightAngle.value = MathUtils.degToRad(MathUtils.clamp(lightAngle, -50, 50));
      uniforms.uEnergy.value = MathUtils.clamp(energy, 0, 1.6);
      uniforms.uChapter.value = Number.isFinite(chapter) ? chapter : 0;
    },
    dispose() {
      mesh.geometry.dispose();
      material.dispose();
    },
  };
}

function ribbonGeometry() {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(12), 3).setUsage(DynamicDrawUsage));
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array([0, 0, 0, 1, 1, 0, 1, 1]), 2));
  geometry.setIndex([0, 1, 2, 2, 1, 3]);
  return geometry;
}

function setRibbon(geometry, start, end, startWidth, endWidth, zShift = 0) {
  const delta = new Vector3().subVectors(end, start).normalize();
  const side = new Vector3(-delta.y, delta.x, 0).normalize();
  const positions = geometry.attributes.position;
  positions.setXYZ(0, start.x - side.x * startWidth, start.y - side.y * startWidth, start.z + zShift);
  positions.setXYZ(1, start.x + side.x * startWidth, start.y + side.y * startWidth, start.z + zShift);
  positions.setXYZ(2, end.x - side.x * endWidth, end.y - side.y * endWidth, end.z + zShift);
  positions.setXYZ(3, end.x + side.x * endWidth, end.y + side.y * endWidth, end.z + zShift);
  positions.needsUpdate = true;
  geometry.computeBoundingSphere();
}

function beamMaterial({ core = false, spectral = false } = {}) {
  return new ShaderMaterial({
    name: spectral ? 'GLASSHOUSE / dispersed light ribbon' : 'GLASSHOUSE / white light ribbon',
    uniforms: {
      uOpacity: { value: 0 },
      uTime: { value: 0 },
      uDarkness: { value: 0 },
    },
    defines: { IS_CORE: core ? 1 : 0, IS_SPECTRAL: spectral ? 1 : 0 },
    vertexColors: spectral,
    transparent: true,
    side: DoubleSide,
    depthWrite: false,
    depthTest: true,
    blending: core ? NormalBlending : AdditiveBlending,
    vertexShader: /* glsl */`
      varying vec2 vUv;
      #if IS_SPECTRAL == 1
        varying vec3 vSpectrum;
      #endif
      void main() {
        vUv = uv;
        #if IS_SPECTRAL == 1
          vSpectrum = color;
        #endif
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform float uOpacity;
      uniform float uTime;
      uniform float uDarkness;
      varying vec2 vUv;
      #if IS_SPECTRAL == 1
        varying vec3 vSpectrum;
      #endif
      void main() {
        float crossSection = abs(vUv.y * 2.0 - 1.0);
        float edge = 1.0 - smoothstep(0.18, 1.0, crossSection);
        float endFalloff = smoothstep(0.0, 0.055, vUv.x)
          * (1.0 - smoothstep(0.69, 1.0, vUv.x));
        float breath = 0.985 + 0.015 * sin(uTime * 0.30 + vUv.x * 0.7);
        vec3 light = vec3(0.94, 0.975, 1.0);
        #if IS_SPECTRAL == 1
          light = vSpectrum;
          edge = pow(max(0.0, sin(vUv.y * 3.14159265)), 0.40);
          endFalloff = smoothstep(0.0, 0.045, vUv.x)
            * (1.0 - smoothstep(0.54, 1.0, vUv.x));
        #endif
        #if IS_CORE == 1
          edge = 1.0 - smoothstep(0.40, 1.0, crossSection);
        #endif
        float alpha = min(0.76, uOpacity * edge * endFalloff * breath);
        gl_FragColor = vec4(light, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}

/**
 * Visible beams are an artistic participating-air approximation. The fan uses
 * explicit wavelength-coloured geometry; its central bend follows Snell's law
 * with a small material dispersion. No unsupported WebGL line widths are used.
 * `angle` is the interactive incidence control in degrees, from -50 to +50.
 */
export function createLightBeam() {
  const group = new Group();
  group.name = 'GLASSHOUSE / light through material';
  group.position.set(1.5, 0.22, 0.50);

  const incomingCore = new Mesh(ribbonGeometry(), beamMaterial({ core: true }));
  const incomingAir = new Mesh(ribbonGeometry(), beamMaterial());
  const outgoingCore = new Mesh(ribbonGeometry(), beamMaterial({ core: true }));
  const outgoingAir = new Mesh(ribbonGeometry(), beamMaterial());
  const divisions = 30;
  const fanGeometry = new BufferGeometry();
  const positions = new Float32Array((divisions + 1) * 2 * 3);
  const colours = new Float32Array((divisions + 1) * 2 * 3);
  const uvs = new Float32Array((divisions + 1) * 2 * 2);
  const indices = [];
  const palette = [0xaca8e7, 0x98b9ed, 0xb8e1e7, 0xdde7c8, 0xf1dfb1, 0xe7b9ab]
    .map((color) => new Color(color));
  const colour = new Color();

  for (let i = 0; i <= divisions; i += 1) {
    const t = i / divisions;
    const ramp = t * (palette.length - 1);
    const lower = Math.min(palette.length - 2, Math.floor(ramp));
    colour.copy(palette[lower]).lerp(palette[lower + 1], ramp - lower);
    for (let j = 0; j < 2; j += 1) {
      const index = i * 2 + j;
      colours.set([colour.r, colour.g, colour.b], index * 3);
      uvs.set([j, t], index * 2);
    }
    if (i < divisions) {
      const k = i * 2;
      indices.push(k, k + 1, k + 2, k + 2, k + 1, k + 3);
    }
  }
  fanGeometry.setAttribute('position', new BufferAttribute(positions, 3).setUsage(DynamicDrawUsage));
  fanGeometry.setAttribute('color', new BufferAttribute(colours, 3));
  fanGeometry.setAttribute('uv', new BufferAttribute(uvs, 2));
  fanGeometry.setIndex(indices);
  const fan = new Mesh(fanGeometry, beamMaterial({ spectral: true }));
  for (const mesh of [incomingAir, outgoingAir, fan, incomingCore, outgoingCore]) {
    mesh.renderOrder = 3;
    mesh.frustumCulled = false;
    group.add(mesh);
  }

  const origin = new Vector3();
  const start = new Vector3();
  const end = new Vector3();
  let previousAngle = Number.NaN;
  let previousSpectrum = Number.NaN;

  function rebuild(angle, spectrum) {
    const incidence = MathUtils.degToRad(angle);
    // The mounting angle keeps the source above-left across the whole control.
    const incomingAngle = -Math.PI / 5 + incidence * 0.45;
    start.set(-Math.cos(incomingAngle) * 10.0, -Math.sin(incomingAngle) * 10.0, -0.03);
    setRibbon(incomingCore.geometry, start, origin, 0.009, 0.012, 0.024);
    setRibbon(incomingAir.geometry, start, origin, 0.040, 0.120);

    const refracted = Math.asin(Math.sin(incidence) / 1.46);
    const middleAngle = -0.105 + refracted * 0.26;
    end.set(Math.cos(middleAngle) * 8.1, Math.sin(middleAngle) * 8.1, 0.015);
    setRibbon(outgoingCore.geometry, origin, end, 0.010, 0.025, 0.028);
    setRibbon(outgoingAir.geometry, origin, end, 0.055, 0.30, 0.01);

    const fanPositions = fanGeometry.attributes.position;
    for (let i = 0; i <= divisions; i += 1) {
      const t = i / divisions;
      const refractiveIndex = MathUtils.lerp(1.478, 1.452, t);
      const wavelengthAngle = Math.asin(Math.sin(incidence) / refractiveIndex);
      // A thin prismatic wedge makes the spectral split readable at room scale.
      const spread = (t - 0.5) * (0.030 + spectrum * 0.225);
      const direction = middleAngle + spread + (wavelengthAngle - refracted) * 1.6;
      fanPositions.setXYZ(i * 2, 0, (t - 0.5) * 0.035, 0);
      fanPositions.setXYZ(i * 2 + 1, Math.cos(direction) * 8.3, Math.sin(direction) * 8.3, 0.018);
    }
    fanPositions.needsUpdate = true;
    fanGeometry.computeBoundingSphere();
  }

  return {
    group,
    update({ time = 0, opacity = 1, angle = 0, spectrum = 0, darkness = 0 } = {}) {
      const amount = clamp01(opacity);
      const spectralAmount = clamp01(spectrum);
      const degrees = MathUtils.clamp(angle, -50, 50);
      group.visible = amount > 0.002;

      if (Math.abs(degrees - previousAngle) > 0.005
        || Math.abs(spectralAmount - previousSpectrum) > 0.002
        || !Number.isFinite(previousAngle)) {
        rebuild(degrees, spectralAmount);
        previousAngle = degrees;
        previousSpectrum = spectralAmount;
      }

      const intensities = [
        [incomingCore, 0.67],
        [incomingAir, 0.105],
        [outgoingCore, 0.44 * (1.0 - spectralAmount * 0.80)],
        [outgoingAir, 0.078 * (1.0 - spectralAmount * 0.65)],
        [fan, 0.36 * spectralAmount],
      ];
      for (const [mesh, strength] of intensities) {
        mesh.material.uniforms.uTime.value = Number.isFinite(time) ? time : 0;
        mesh.material.uniforms.uOpacity.value = amount * strength;
        mesh.material.uniforms.uDarkness.value = clamp01(darkness);
      }
    },
    dispose() {
      group.children.forEach((mesh) => {
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
    },
  };
}
