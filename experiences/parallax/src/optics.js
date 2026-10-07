import {
  BoxGeometry,
  Color,
  DoubleSide,
  Group,
  HalfFloatType,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  UnsignedByteType,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderTarget,
} from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

// Both optical passes sample the live scene. There is no independent animation
// clock: every material and geometric change is derived from the caller's state.
const clamp01 = (value) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
const MIN_STRENGTH = 0.002;

const MIRROR_SHADER = {
  name: 'ParallaxPlanarMirror',
  uniforms: {
    color: { value: new Color(0xe6e8e5) },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    uStrength: { value: 0 },
    uFloor: { value: 0 },
    uFloorExtent: { value: new Vector2(18, 13) },
    uTexel: { value: new Vector2(1 / 512, 1 / 512) },
  },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    varying vec4 vMirrorUv;
    varying vec2 vSurfaceUv;
    #include <common>
    #include <logdepthbuf_pars_vertex>
    void main() {
      vSurfaceUv = uv;
      vMirrorUv = textureMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec3 color;
    uniform float uStrength;
    uniform float uFloor;
    uniform vec2 uFloorExtent;
    uniform vec2 uTexel;
    varying vec4 vMirrorUv;
    varying vec2 vSurfaceUv;
    #include <logdepthbuf_pars_fragment>
    void main() {
      #include <logdepthbuf_fragment>
      vec4 reflected = texture2DProj(tDiffuse, vMirrorUv);
      if (uFloor > 0.5) {
        vec2 coordinate = vMirrorUv.xy / vMirrorUv.w;
        vec2 blur = uTexel * 1.8;
        reflected = reflected * 0.48
          + texture2D(tDiffuse, coordinate + vec2(blur.x, 0.0)) * 0.13
          + texture2D(tDiffuse, coordinate - vec2(blur.x, 0.0)) * 0.13
          + texture2D(tDiffuse, coordinate + vec2(0.0, blur.y)) * 0.13
          + texture2D(tDiffuse, coordinate - vec2(0.0, blur.y)) * 0.13;
      }
      float edge = min(min(vSurfaceUv.x, 1.0 - vSurfaceUv.x),
                       min(vSurfaceUv.y, 1.0 - vSurfaceUv.y));
      float boundary = smoothstep(0.0, 0.004, edge);
      // The neutral silver substrate remains quiet when the scene is transparent.
      vec3 silver = mix(color * 0.62, reflected.rgb * 0.96,
                        clamp(reflected.a, 0.0, 1.0));
      float opacity = uStrength * boundary;
      if (uFloor > 0.5) {
        float reach = length((vSurfaceUv - 0.5) * uFloorExtent);
        opacity *= reflected.a * exp(-reach * 0.055);
        silver = reflected.rgb / max(reflected.a, 0.001);
      }
      gl_FragColor = vec4(silver, opacity);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
};

const MEMBRANE_VERTEX = /* glsl */ `
  uniform float uPhase;
  uniform float uAmplitude;
  varying vec2 vUv;
  varying vec3 vViewNormal;
  varying vec3 vViewPosition;
  varying vec4 vScreenPosition;
  #include <common>
  #include <logdepthbuf_pars_vertex>
  void main() {
    vUv = uv;
    vec3 displaced = position;
    // An authored, shallow optical sheet. The analytic derivatives keep its
    // refracted view and specular boundary consistent with the actual geometry.
    float a = position.y * 0.62 + position.x * 0.19 + uPhase;
    float foldAxis = position.y + position.x * 0.52 - 0.48 + sin(uPhase) * 0.09;
    float fold = exp(-foldAxis * foldAxis / 0.24);
    displaced.z += uAmplitude * (0.23 * sin(a) + 0.77 * fold);
    float slope = -2.0 * foldAxis / 0.24 * fold;
    float dx = uAmplitude * (0.23 * 0.19 * cos(a) + 0.77 * slope * 0.52);
    float dy = uAmplitude * (0.23 * 0.62 * cos(a) + 0.77 * slope);
    vViewNormal = normalize(normalMatrix * normalize(vec3(-dx, -dy, 1.0)));
    vec4 viewPosition = modelViewMatrix * vec4(displaced, 1.0);
    vViewPosition = -viewPosition.xyz;
    vScreenPosition = projectionMatrix * viewPosition;
    gl_Position = vScreenPosition;
    #include <logdepthbuf_vertex>
  }
`;

const MEMBRANE_FRAGMENT = /* glsl */ `
  uniform sampler2D uScene;
  uniform sampler2D uBackdrop;
  uniform vec4 uBackdropUv;
  uniform vec3 uBackdropBase;
  uniform float uBackdropReady;
  uniform float uBackdropOpacity;
  uniform vec2 uTexel;
  uniform float uStrength;
  uniform float uDispersion;
  uniform float uThickness;
  varying vec2 vUv;
  varying vec3 vViewNormal;
  varying vec3 vViewPosition;
  varying vec4 vScreenPosition;
  #include <logdepthbuf_pars_fragment>
  #include <tonemapping_pars_fragment>

  vec3 backdropAt(vec2 position) {
    vec2 imageUv = (position - 0.5) / 1.03 + 0.5;
    imageUv = imageUv * uBackdropUv.xy + uBackdropUv.zw;
    vec3 plate = texture2D(uBackdrop, clamp(imageUv, vec2(0.0), vec2(1.0))).rgb;
    return mix(uBackdropBase, plate, uBackdropOpacity * uBackdropReady);
  }

  vec2 safeUv(vec2 position) {
    return clamp(position, uTexel * 1.5, vec2(1.0) - uTexel * 1.5);
  }

  vec2 opticalOffset(vec3 incident, vec3 normal, float ior) {
    vec3 transmitted = refract(incident, normal, 1.0 / ior);
    vec2 before = incident.xy / max(abs(incident.z), 0.32);
    vec2 after = transmitted.xy / max(abs(transmitted.z), 0.32);
    return clamp((after - before) * uThickness, vec2(-0.032), vec2(0.032));
  }

  void main() {
    #include <logdepthbuf_fragment>
    vec3 view = normalize(vViewPosition);
    vec3 normal = normalize(vViewNormal);
    if (!gl_FrontFacing) normal = -normal;
    // Face the optical interface toward the incident ray on either side.
    if (dot(normal, view) < 0.0) normal = -normal;
    vec3 incident = -view;
    vec2 screenUv = vScreenPosition.xy / vScreenPosition.w * 0.5 + 0.5;
    float baseIor = 1.19;
    vec2 redOffset = opticalOffset(incident, normal, baseIor - uDispersion);
    vec2 greenOffset = opticalOffset(incident, normal, baseIor);
    vec2 blueOffset = opticalOffset(incident, normal, baseIor + uDispersion);
    vec4 redSample = texture2D(uScene, safeUv(screenUv + redOffset));
    vec4 greenSample = texture2D(uScene, safeUv(screenUv + greenOffset));
    vec4 blueSample = texture2D(uScene, safeUv(screenUv + blueOffset));
    float sourceAlpha = max(max(redSample.a, greenSample.a), blueSample.a);
    vec3 transmitted = vec3(redSample.r, greenSample.g, blueSample.b);
    // The architecture plate participates in the same ray offsets as the live
    // object. Tone-map scene radiance once, then composite display-linear art.
    vec3 architectural = vec3(backdropAt(screenUv + redOffset).r,
                              backdropAt(screenUv + greenOffset).g,
                              backdropAt(screenUv + blueOffset).b);
    vec3 liveColour = ACESFilmicToneMapping(transmitted / max(sourceAlpha, 0.001));
    transmitted = mix(architectural, liveColour, clamp(sourceAlpha, 0.0, 1.0));
    transmitted *= vec3(0.975, 0.986, 0.996);
    float facing = clamp(dot(normal, view), 0.0, 1.0);
    float fresnel = 0.008 + 0.992 * pow(1.0 - facing, 5.0);
    float edge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
    float boundary = smoothstep(0.0, 0.006, edge);
    vec3 halfLight = normalize(view + normalize(vec3(0.52, 0.84, 1.8)));
    float highlight = pow(max(0.0, dot(normal, halfLight)), 92.0);
    float rim = exp(-edge * 185.0) * 0.46 + fresnel * 0.29 + highlight * 0.14;
    vec3 opticalColour = transmitted + vec3(0.97, 0.96, 0.91) * rim;
    float opacity = 0.96;
    gl_FragColor = vec4(opticalColour, opacity * uStrength * boundary);
    #include <colorspace_fragment>
  }
`;

function opticalArchitecture(backdropTexture) {
  const group = new Group();
  group.name = 'Architecture inside the live mirror';
  group.visible = false;
  const plaster = new MeshStandardMaterial({ color: 0xcfc5b5, roughness: 0.88, envMapIntensity: 0.32 });
  const wallTexture = backdropTexture.clone();
  wallTexture.repeat.set(1, 0.74);
  wallTexture.offset.set(0, 0.26);
  const floorTexture = backdropTexture.clone();
  floorTexture.repeat.set(1, 0.225);
  floorTexture.offset.set(0, 0.01);
  const floorMaterial = new MeshStandardMaterial({ map: floorTexture, color: 0xc2b7a4, roughness: 0.62, envMapIntensity: 0.25 });
  const plateMaterial = new MeshBasicMaterial({ map: wallTexture, side: DoubleSide, toneMapped: false });
  const addBox = (size, position) => {
    const mesh = new Mesh(new BoxGeometry(...size), plaster);
    mesh.position.fromArray(position);
    group.add(mesh);
  };
  const floor = new Mesh(new PlaneGeometry(54, 58), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -3.27, 1);
  floor.receiveShadow = true;
  group.add(floor);
  for (const z of [-22, 22]) {
    const plate = new Mesh(new PlaneGeometry(46, 19.3), plateMaterial);
    plate.position.set(0, 6.38, z);
    group.add(plate);
  }
  addBox([0.35, 19, 52], [-18.5, 6.1, 1]);
  addBox([0.35, 19, 52], [18.5, 6.1, 1]);
  addBox([37, 0.28, 52], [0, 15.6, 1]);
  return {
    group,
    refreshTexture() {
      wallTexture.needsUpdate = true;
      floorTexture.needsUpdate = true;
    },
    dispose() {
      group.removeFromParent();
      group.traverse(object => object.geometry?.dispose());
      plaster.dispose(); floorMaterial.dispose(); plateMaterial.dispose();
      wallTexture.dispose(); floorTexture.dispose();
    },
  };
}

/**
 * A caller-owned live mirror and optical film.
 *
 * State: { progress, reflection, floorReflection, membrane, chroma, reducedMotion,
 *          width, height, pixelRatio }. Strength values lie in [0, 1].
 * Call beforeRender once, after scene/camera transforms and before the main draw.
 * The groups may be positioned/scaled by the stage. The mirror's child plane is
 * already horizontal; rotate the group only to add a deliberate installation tilt.
 */
export function createOptics(renderer) {
  const supportsFloat = renderer.extensions.has('EXT_color_buffer_float');
  const targetType = supportsFloat ? HalfFloatType : UnsignedByteType;
  const gl = renderer.getContext();
  // Color and depth attachments must agree on an actually supported sample
  // count. MAX_SAMPLES alone can overstate support for half-float captures.
  const colourSamples = Array.from(gl.getInternalformatParameter(gl.RENDERBUFFER,
    supportsFloat ? gl.RGBA16F : gl.RGBA8, gl.SAMPLES) || []);
  const depthSamples = Array.from(gl.getInternalformatParameter(gl.RENDERBUFFER,
    gl.DEPTH_COMPONENT24, gl.SAMPLES) || []);
  const supportedSamples = colourSamples.filter(samples => samples > 1 &&
    samples <= 4 && samples <= renderer.capabilities.maxSamples &&
    depthSamples.includes(samples)).sort((a, b) => b - a);
  const samplesForWidth = (width) => supportedSamples.find(samples =>
    samples <= (width < 700 ? 2 : 4)) ?? supportedSamples.at(-1) ?? 0;
  const initialSamples = samplesForWidth(document.documentElement.clientWidth);
  const placeholder = document.createElement('canvas');
  placeholder.width = placeholder.height = 1;
  const placeholderContext = placeholder.getContext('2d');
  placeholderContext.fillStyle = '#e9e2d6';
  placeholderContext.fillRect(0, 0, 1, 1);
  const backdropTexture = new Texture(placeholder);
  backdropTexture.colorSpace = SRGBColorSpace;
  backdropTexture.minFilter = backdropTexture.magFilter = LinearFilter;
  backdropTexture.generateMipmaps = false;
  backdropTexture.needsUpdate = true;
  backdropTexture.name = 'Shared ivory architecture plate for optical rays';
  const backdropImage = document.querySelector('.world-plate--ivory');
  let backdropReady = false;
  const architecture = opticalArchitecture(backdropTexture);
  const architectureBackground = new Color(0xe7dfd1);
  const mirror = new Group();
  mirror.name = 'Parallax mirror installation';
  mirror.position.y = -3.2;
  mirror.visible = false;

  const mirrorGeometry = new PlaneGeometry(18, 13);
  const reflector = new Reflector(mirrorGeometry, {
    color: 0xd8dcd8,
    textureWidth: 512,
    textureHeight: 512,
    clipBias: 0.003,
    multisample: initialSamples,
    shader: MIRROR_SHADER,
  });
  reflector.name = 'Live planar reflection';
  reflector.rotation.x = -Math.PI / 2;
  reflector.material.transparent = true;
  reflector.material.depthWrite = false;
  reflector.renderOrder = 1;
  reflector.getRenderTarget().texture.type = targetType;
  reflector.getRenderTarget().texture.name = 'Parallax mirrored camera capture';
  mirror.add(reflector);

  const floorMirror = new Group();
  floorMirror.name = 'Parallax polished gallery floor';
  floorMirror.position.y = -3.235;
  floorMirror.visible = false;
  const floorMirrorGeometry = new PlaneGeometry(18, 42);
  const floorReflector = new Reflector(floorMirrorGeometry, {
    color: 0xe8e1d6, textureWidth: 512, textureHeight: 512,
    clipBias: 0.003, multisample: initialSamples, shader: MIRROR_SHADER,
  });
  floorReflector.name = 'Subtle live floor reflection';
  floorReflector.rotation.x = -Math.PI / 2;
  floorReflector.material.transparent = true;
  floorReflector.material.depthWrite = false;
  floorReflector.material.uniforms.uFloor.value = 1;
  floorReflector.material.uniforms.uFloorExtent.value.set(18, 42);
  floorReflector.renderOrder = 0;
  floorReflector.getRenderTarget().texture.type = targetType;
  floorMirror.add(floorReflector);

  const capture = new WebGLRenderTarget(512, 512, {
    type: targetType,
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    depthBuffer: true,
    stencilBuffer: false,
    generateMipmaps: false,
    samples: initialSamples,
  });
  capture.texture.name = 'Parallax membrane live scene capture';
  const membraneMaterial = new ShaderMaterial({
    name: 'Parallax thin optical film',
    vertexShader: MEMBRANE_VERTEX,
    fragmentShader: MEMBRANE_FRAGMENT,
    uniforms: {
      uScene: { value: capture.texture },
      uBackdrop: { value: backdropTexture },
      uBackdropUv: { value: new Vector4(1, 1, 0, 0) },
      uBackdropBase: { value: new Color(0xe9e2d6) },
      uBackdropReady: { value: 0 },
      uBackdropOpacity: { value: 1 },
      toneMappingExposure: { value: renderer.toneMappingExposure },
      uTexel: { value: new Vector2(1 / 512, 1 / 512) },
      uPhase: { value: 0 },
      uAmplitude: { value: 0.31 },
      uStrength: { value: 0 },
      uDispersion: { value: 0.005 },
      uThickness: { value: 0.16 },
    },
    side: DoubleSide,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
  });
  membraneMaterial.forceSinglePass = true;
  const membraneGeometry = new PlaneGeometry(6.6, 7.6, 48, 56);
  const filmVertices = membraneGeometry.attributes.position;
  for (let i = 0; i < filmVertices.count; i++) {
    const x = filmVertices.getX(i) * 1.76;
    const y = filmVertices.getY(i) * 0.46 - x * 0.52 + 0.48;
    filmVertices.setXYZ(i, x, y, 0);
  }
  filmVertices.needsUpdate = true;
  membraneGeometry.computeBoundingSphere();
  const film = new Mesh(membraneGeometry, membraneMaterial);
  film.name = 'Live refracting subdivided membrane';
  film.frustumCulled = false;
  film.renderOrder = 20;
  const membrane = new Group();
  membrane.name = 'Parallax membrane installation';
  membrane.position.z = 2;
  membrane.visible = false;
  membrane.add(film);

  let disposed = false;
  let capturing = false;
  let reflectionRenders = 0;
  let floorReflectionRenders = 0;
  let membraneRenders = 0;
  let lastWidth = 0;
  let lastHeight = 0;
  let lastRatio = 0;
  let lastState = { progress: 0, reflection: 0, membrane: 0, chroma: 0 };
  const lastCameraPosition = new Vector3();
  const lastReflectedCameraPosition = new Vector3();
  const mirrorWorldPosition = new Vector3();
  const mirrorWorldNormal = new Vector3();
  const cameraWorldPosition = new Vector3();
  const cameraToMirror = new Vector3();

  function installMirrorCapture(surface, owner, isFloor) {
    const nativeMirrorRender = surface.onBeforeRender;
    surface.onBeforeRender = function (...args) {
    if (disposed || capturing || !owner.visible) return;
    const [activeRenderer, scene, camera] = args;
    mirrorWorldPosition.setFromMatrixPosition(surface.matrixWorld);
    mirrorWorldNormal.set(0, 0, 1).transformDirection(surface.matrixWorld);
    cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);
    cameraToMirror.subVectors(mirrorWorldPosition, cameraWorldPosition);
    if (cameraToMirror.dot(mirrorWorldNormal) > 0 && !surface.forceUpdate) return;

    const previousMembrane = membrane.visible;
    const previousMirror = mirror.visible;
    const previousFloorMirror = floorMirror.visible;
    const previousArchitecture = architecture.group.visible;
    const previousBackground = scene.background;
    const previousTarget = activeRenderer.getRenderTarget();
    const previousFace = activeRenderer.getActiveCubeFace();
    const previousMip = activeRenderer.getActiveMipmapLevel();
    const previousXr = activeRenderer.xr.enabled;
    const previousShadows = activeRenderer.shadowMap.autoUpdate;
    membrane.visible = false;
    if (isFloor) mirror.visible = false;
    else floorMirror.visible = false;
    architecture.group.visible = !isFloor;
    if (!isFloor) scene.background = architectureBackground;
    try {
      nativeMirrorRender.apply(surface, args);
      if (isFloor) floorReflectionRenders += 1;
      else {
        reflectionRenders += 1;
        const reflectedCamera = surface.getReflectionCamera(camera);
        lastReflectedCameraPosition.setFromMatrixPosition(reflectedCamera.matrixWorld);
      }
    } finally {
      membrane.visible = previousMembrane;
      mirror.visible = previousMirror;
      floorMirror.visible = previousFloorMirror;
      architecture.group.visible = previousArchitecture;
      scene.background = previousBackground;
      surface.visible = true;
      activeRenderer.xr.enabled = previousXr;
      activeRenderer.shadowMap.autoUpdate = previousShadows;
      activeRenderer.setRenderTarget(previousTarget, previousFace, previousMip);
    }
    };
  }
  installMirrorCapture(reflector, mirror, false);
  installMirrorCapture(floorReflector, floorMirror, true);

  function syncArchitecturePlate(width, height) {
    if (backdropImage?.complete && backdropImage.naturalWidth > 0) {
      if (!backdropReady) {
        backdropTexture.image = backdropImage;
        backdropTexture.needsUpdate = true;
        architecture.refreshTexture();
        backdropReady = true;
      }
      const imageAspect = backdropImage.naturalWidth / backdropImage.naturalHeight;
      const aspect = width / height;
      const sx = Math.min(1, aspect / imageAspect);
      const sy = Math.min(1, imageAspect / aspect);
      membraneMaterial.uniforms.uBackdropUv.value.set(sx, sy,
        (1 - sx) * (width < 700 ? 0.44 : 0.5), (1 - sy) * 0.5);
      membraneMaterial.uniforms.uBackdropOpacity.value = Number.parseFloat(backdropImage.style.opacity || '1');
      const rgb = document.documentElement.style.getPropertyValue('--base').match(/[\d.]+/g);
      if (rgb?.length >= 3) {
        membraneMaterial.uniforms.uBackdropBase.value.setRGB(
          Number(rgb[0]) / 255, Number(rgb[1]) / 255, Number(rgb[2]) / 255, SRGBColorSpace);
      }
    }
    membraneMaterial.uniforms.uBackdropReady.value = Number(backdropReady);
  }

  function targetDimensions(width, height, ratio, kind) {
    const isNarrow = width < 700;
    const maxEdge = Math.min(renderer.capabilities.maxTextureSize,
      isNarrow ? 1280 : 2304);
    const pixelBudget = isNarrow ? 1100000 : (kind === 'mirror' ? 2100000 : 2500000);
    let scale = Math.min(ratio, 1.5) * (kind === 'mirror' ? (isNarrow ? 0.76 : 1) : 0.88);
    scale = Math.min(scale, maxEdge / Math.max(width, height),
      Math.sqrt(pixelBudget / (width * height)));
    return [Math.max(16, Math.round(width * scale)),
      Math.max(16, Math.round(height * scale))];
  }

  function resize(width, height, pixelRatio = 1) {
    if (disposed || !Number.isFinite(width) || !Number.isFinite(height) ||
        width <= 0 || height <= 0) return;
    const ratio = Math.max(0.5, Number.isFinite(pixelRatio) ? pixelRatio : 1);
    if (width === lastWidth && height === lastHeight && ratio === lastRatio) return;
    lastWidth = width;
    lastHeight = height;
    lastRatio = ratio;
    const [mirrorWidth, mirrorHeight] = targetDimensions(width, height, ratio, 'mirror');
    const [captureWidth, captureHeight] = targetDimensions(width, height, ratio, 'membrane');
    const samples = samplesForWidth(width);
    for (const target of [reflector.getRenderTarget(), floorReflector.getRenderTarget(), capture]) {
      if (target.samples !== samples) {
        target.dispose();
        target.samples = samples;
      }
    }
    reflector.getRenderTarget().setSize(mirrorWidth, mirrorHeight);
    reflector.material.uniforms.uTexel.value.set(1 / mirrorWidth, 1 / mirrorHeight);
    const floorWidth = Math.max(16, Math.round(mirrorWidth * 0.72));
    const floorHeight = Math.max(16, Math.round(mirrorHeight * 0.72));
    floorReflector.getRenderTarget().setSize(floorWidth, floorHeight);
    floorReflector.material.uniforms.uTexel.value.set(1 / floorWidth, 1 / floorHeight);
    capture.setSize(captureWidth, captureHeight);
    membraneMaterial.uniforms.uTexel.value.set(1 / captureWidth, 1 / captureHeight);
  }

  // setRenderTarget owns the render target's physical-pixel viewport/scissor.
  // Avoid setViewport here: it applies the canvas DPR even to an offscreen pass.
  function beforeRender(scene, camera, state = {}) {
    if (disposed) return;
    const reflectionStrength = clamp01(state.reflection);
    const floorStrength = reflectionStrength > MIN_STRENGTH ? 0 : clamp01(state.floorReflection);
    const membraneStrength = clamp01(state.membrane);
    const chromaStrength = clamp01(state.chroma);
    const progress = Number.isFinite(state.progress) ? state.progress : 0;
    lastState = {
      progress,
      reflection: reflectionStrength,
      floorReflection: floorStrength,
      membrane: membraneStrength,
      chroma: chromaStrength,
      reducedMotion: Boolean(state.reducedMotion),
    };
    if (state.width > 0 && state.height > 0) {
      resize(state.width, state.height, state.pixelRatio || 1);
    }
    if (architecture.group.parent !== scene) scene.add(architecture.group);
    syncArchitecturePlate(lastWidth || 1920, lastHeight || 1080);
    mirror.visible = reflectionStrength > MIN_STRENGTH;
    floorMirror.visible = floorStrength > MIN_STRENGTH;
    membrane.visible = membraneStrength > MIN_STRENGTH;
    reflector.material.uniforms.uStrength.value = reflectionStrength;
    floorReflector.material.uniforms.uStrength.value = floorStrength;
    membraneMaterial.uniforms.uStrength.value = membraneStrength;
    membraneMaterial.uniforms.uPhase.value = state.reducedMotion ? 0.7 : progress * 1.6;
    membraneMaterial.uniforms.uAmplitude.value = 0.31;
    membraneMaterial.uniforms.uDispersion.value = 0.006 + chromaStrength * 0.013;
    membraneMaterial.uniforms.uThickness.value = 0.16 + chromaStrength * 0.015;
    membraneMaterial.uniforms.toneMappingExposure.value = renderer.toneMappingExposure;
    camera.updateMatrixWorld();
    camera.getWorldPosition(lastCameraPosition);
    if (!membrane.visible) return;

    const previousTarget = renderer.getRenderTarget();
    const previousFace = renderer.getActiveCubeFace();
    const previousMip = renderer.getActiveMipmapLevel();
    const previousXr = renderer.xr.enabled;
    const previousShadows = renderer.shadowMap.autoUpdate;
    const previousAutoClear = renderer.autoClear;
    const previousMirror = mirror.visible;
    const previousFloorMirror = floorMirror.visible;
    const previousMembrane = membrane.visible;
    capturing = true;
    mirror.visible = false;
    floorMirror.visible = false;
    membrane.visible = false;
    try {
      renderer.xr.enabled = false;
      renderer.shadowMap.autoUpdate = false;
      renderer.autoClear = true;
      renderer.setRenderTarget(capture);
      renderer.state.buffers.depth.setMask(true);
      renderer.clear(true, true, true);
      renderer.render(scene, camera);
      membraneRenders += 1;
    } finally {
      renderer.xr.enabled = previousXr;
      renderer.shadowMap.autoUpdate = previousShadows;
      renderer.autoClear = previousAutoClear;
      renderer.setRenderTarget(previousTarget, previousFace, previousMip);
      mirror.visible = previousMirror;
      floorMirror.visible = previousFloorMirror;
      membrane.visible = previousMembrane;
      capturing = false;
    }
  }

  function diagnostics() {
    const mirrorTarget = reflector.getRenderTarget();
    return {
      reflectionRenders,
      floorReflectionRenders,
      membraneRenders,
      mirrorVisible: mirror.visible,
      floorMirrorVisible: floorMirror.visible,
      membraneVisible: membrane.visible,
      mirrorTarget: [mirrorTarget.width, mirrorTarget.height],
      membraneTarget: [capture.width, capture.height],
      captureSamples: {
        mirror: mirrorTarget.samples,
        floor: floorReflector.getRenderTarget().samples,
        membrane: capture.samples,
        supported: [...supportedSamples],
      },
      targetType: supportsFloat ? 'half-float' : 'unsigned-byte',
      membraneVertices: membraneGeometry.attributes.position.count,
      architecturePlateReady: backdropReady,
      cameraPosition: lastCameraPosition.toArray(),
      reflectedCameraPosition: lastReflectedCameraPosition.toArray(),
      state: { ...lastState },
      disposed,
    };
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    mirror.visible = false;
    floorMirror.visible = false;
    membrane.visible = false;
    mirror.removeFromParent();
    floorMirror.removeFromParent();
    membrane.removeFromParent();
    reflector.onBeforeRender = () => {};
    floorReflector.onBeforeRender = () => {};
    reflector.dispose();
    floorReflector.dispose();
    mirrorGeometry.dispose();
    floorMirrorGeometry.dispose();
    membraneGeometry.dispose();
    membraneMaterial.uniforms.uScene.value = null;
    membraneMaterial.dispose();
    capture.dispose();
    backdropTexture.dispose();
    architecture.dispose();
  }

  return { mirror, floorMirror, membrane, beforeRender, resize, diagnostics, dispose };
}
