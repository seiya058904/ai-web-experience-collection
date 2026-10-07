import * as THREE from 'three';
import { createMasterModel, MASTER_SPEC } from './model.js';
import { createOptics } from './optics.js';
import {
  clamp, lerp, smoothstep, smootherstep, envelope, samplePath, scaleAboutCamera,
  ALIGNMENT_CAMERA, ALIGNMENT_TARGET, MOBILE_ALIGNMENT_CAMERA, MOBILE_ALIGNMENT_TARGET,
} from './spatial-math.js';

const DESKTOP_CAMERA_PATH = [
  { at: 0, position: [2.6, 1.1, 10.8], target: [-1.95, 0.22, 0] },
  { at: 1, position: [3.7, 1.45, 14.7], target: [-2.15, -0.30, 0] },
  { at: 1.55, position: [5.2, 1.5, 12.1], target: [-2.0, 0.1, 0] },
  { at: 2, position: [...ALIGNMENT_CAMERA], target: [...ALIGNMENT_TARGET] },
  { at: 2.35, position: [0.7, 0.9, 12.2], target: [-2.0, 0.1, 0] },
  { at: 3, position: [5.0, 3.1, 14.0], target: [-1.65, -0.45, 0] },
  { at: 3.45, position: [2.25, 1.0, 10.0], target: [-0.65, -0.1, -1.5] },
  { at: 3.7, position: [0.1, 0.15, 5.9], target: [0.05, 0.0, -7], fov: 36 },
  { at: 3.88, position: [-0.20, 0.08, 5.85], target: [0.10, 0.02, -8], fov: 37 },
  { at: 4, position: [-0.24, 0.04, 5.25], target: [0.10, 0.02, -9], fov: 38 },
  { at: 4.1, position: [-0.10, 0.04, 1.8], target: [0.10, 0.02, -10], fov: 38 },
  { at: 4.2, position: [0.03, 0.04, 0], target: [0.10, 0.02, -11], fov: 38 },
  { at: 4.35, position: [0.05, 0.15, -3.3], target: [0.10, 0.05, -12], fov: 38 },
  { at: 4.5, position: [-6.0, 1.0, -5.2], target: [0, 0.05, -0.4], fov: 36 },
  { at: 4.73, position: [-10.0, 1.5, 4.0], target: [-0.6, 0.08, 0], fov: 35 },
  { at: 5, position: [2.7, 1.0, 12.6], target: [-2.0, 0.10, 0] },
  { at: 6, position: [3.4, 0.7, 11.8], target: [-1.95, 0.05, 0] },
  { at: 7, position: [2.7, 1.2, 12.5], target: [-1.85, 0.05, 0] },
  { at: 8, position: [2.6, 1.2, 12.8], target: [-1.65, -0.40, 0] },
  { at: 9, position: [2.4, 3.0, 30.0], target: [0, 1.15, 0] },
].map(stop => ({ ...stop, fov: stop.fov ?? 38 }));

const MOBILE_CAMERA_PATH = DESKTOP_CAMERA_PATH.map(stop => {
  if (stop.at >= 3.7 && stop.at <= 4.73) return { ...stop, fov: 48 };
  const map = {
    0: { position: [1.8, 0.75, 22.4], target: [0, 0.30, 0] },
    1: { position: [3.6, 1.1, 24.2], target: [0, 0.2, 0] },
    1.55: { position: [5.3, 1.35, 22.7], target: [0, 0.25, 0] },
    2: { position: [...MOBILE_ALIGNMENT_CAMERA], target: [...MOBILE_ALIGNMENT_TARGET] },
    2.35: { position: [-0.8, 0.9, 22.6], target: [0, 0.25, 0] },
    3: { position: [2.2, 3.3, 34], target: [-3.0, -0.10, 0], fov: 44 },
    3.45: { position: [1.25, 1, 15], target: [0, 0, -1] },
    5: { position: [1.5, 0.7, 23], target: [0, 0.25, 0] },
    6: { position: [2.5, 0.5, 22], target: [0, 0.22, 0] },
    7: { position: [1.6, 0.9, 23], target: [0, 0.25, 0] },
    8: { position: [1.7, 0.8, 22.6], target: [0, 0.22, 0] },
    9: { position: [1.5, 3.1, 34], target: [0, 1.65, 0] },
  };
  return { ...stop, ...(map[stop.at] || {}), fov: map[stop.at]?.fov ?? 38 };
});

function studioEnvironment(renderer, architectural = false) {
  // A high-dynamic-range spherical studio: wide silver windows, black flags,
  // and a neutral horizon. The PBR material samples it from the true reflection
  // vector, so the bands move with each real facet and viewing angle.
  const envWidth = 1024, envHeight = 512;
  const data = new Float32Array(envWidth * envHeight * 4);
  const windows = [[-2.70, 0.27, 3.7], [-1.53, 0.24, 5.8], [-0.88, 0.20, 5.0], [-0.37, 0.18, 3.3], [0.67, 0.31, 5.3], [1.75, 0.26, 4.4], [2.67, 0.17, 6.2]];
  const architecturalWindows = [[-2.70, 0.12, 3.2], [-1.52, 0.09, 2.7], [-0.90, 0.14, 3.7], [0.63, 0.17, 3.5], [1.78, 0.11, 3.0], [2.71, 0.09, 2.8]];
  for (let y = 0; y < envHeight; y++) {
    const v = (y + 0.5) / envHeight;
    const elevation = Math.cos(v * Math.PI);
    const vertical = Math.exp(-Math.pow((v - 0.47) / 0.30, 2));
    for (let x = 0; x < envWidth; x++) {
      const phi = ((x + 0.5) / envWidth - 0.5) * Math.PI * 2;
      if (architectural) {
        // Chrome sees limestone walls and framed skylights. The broad dark
        // flags interrupt the bright panels before tone mapping, preserving
        // directional charcoal/silver gradients within each physical facet.
        let reflectionLight = 0.014 + 0.035 * Math.max(0, elevation);
        let frameShade = 0;
        for (const [centre, spread, strength] of architecturalWindows) {
          const delta = Math.atan2(Math.sin(phi - centre), Math.cos(phi - centre)) + (v - 0.5) * 0.7;
          const window = Math.exp(-Math.pow(delta / spread, 4));
          const mullion = Math.exp(-Math.pow(delta / 0.050, 4));
          const crossbar = Math.exp(-Math.pow((v - 0.47 - Math.sin(phi) * 0.035) / 0.008, 4));
          reflectionLight += window * (1 - 0.97 * mullion) * (1 - 0.95 * crossbar) * strength * 0.58 * vertical;
          frameShade = Math.max(frameShade, window * Math.max(mullion, crossbar * 0.92));
        }
        reflectionLight += 0.85 * Math.exp(-Math.pow((v - 0.14) / 0.037, 4));
        // Clerestory ribbons span the room, not just the narrow side windows.
        // A cut face covers only a small angular range: slender transverse
        // frames keep a reflected dark/light boundary visible within a facet.
        const upperClerestory = 0.455 + Math.sin(phi + 0.4) * 0.017;
        const lowerClerestory = 0.535 + Math.sin(phi - 0.7) * 0.016;
        reflectionLight += 1.20 * Math.exp(-Math.pow((v - upperClerestory) / 0.020, 4));
        reflectionLight += 1.55 * Math.exp(-Math.pow((v - lowerClerestory) / 0.024, 4));
        const transverseFrame = Math.max(
          Math.exp(-Math.pow((v - upperClerestory - 0.003) / 0.006, 4)),
          Math.exp(-Math.pow((v - lowerClerestory + 0.006) / 0.008, 4)),
        );
        reflectionLight *= 1 - 0.98 * transverseFrame;
        frameShade = Math.max(frameShade, transverseFrame);
        const wallFill = (0.035 + 0.18 * Math.exp(-Math.pow((v - 0.56) / 0.30, 2))) * (1 - 0.78 * frameShade);
        const floorFill = 0.12 * Math.max(0, -elevation) * (1 - 0.60 * frameShade);
        const i = (y * envWidth + x) * 4;
        data[i] = reflectionLight * 0.98 + wallFill * 1.02 + floorFill * 0.95;
        data[i + 1] = reflectionLight + wallFill * 0.87 + floorFill * 0.78;
        data[i + 2] = reflectionLight * 1.025 + wallFill * 0.70 + floorFill * 0.59;
        data[i + 3] = 1;
        continue;
      }
      let illumination = 0.055 + 0.065 * Math.max(0, elevation);
      for (const [centre, spread, strength] of windows) {
        const delta = Math.atan2(Math.sin(phi - centre), Math.cos(phi - centre)) + (v - 0.5) * 0.7;
        const window = Math.exp(-Math.pow(delta / spread, 4));
        const mullion = 1 - 0.985 * Math.exp(-Math.pow(delta / 0.065, 4));
        illumination += window * mullion * strength * 0.58 * vertical;
      }
      illumination += 1.4 * Math.exp(-Math.pow((v - 0.14) / 0.075, 4));
      const floorWarmth = Math.max(0, -elevation) * 0.065;
      const i = (y * envWidth + x) * 4;
      data[i] = illumination * 0.98 + floorWarmth;
      data[i + 1] = illumination * 1.015 + floorWarmth * 0.82;
      data[i + 2] = illumination * 1.055 + floorWarmth * 0.60;
      data[i + 3] = 1;
    }
  }
  const equirectangular = new THREE.DataTexture(data, envWidth, envHeight, THREE.RGBAFormat, THREE.FloatType);
  equirectangular.mapping = THREE.EquirectangularReflectionMapping;
  equirectangular.colorSpace = THREE.LinearSRGBColorSpace;
  equirectangular.needsUpdate = true;
  const generator = new THREE.PMREMGenerator(renderer);
  const target = generator.fromEquirectangular(equirectangular);
  generator.dispose();
  equirectangular.dispose();
  return target;
}

function createRiftGallery(galleryTexture) {
  const group = new THREE.Group();
  group.name = 'Depth beyond the incision';
  // Reuse a quiet, evenly shaded limestone patch from the authored gallery.
  // This clone has independent UV transforms while sharing the decoded image.
  const limestoneMap = galleryTexture.clone();
  limestoneMap.offset.set(0.390, 0.570);
  limestoneMap.repeat.set(0.105, 0.145);
  limestoneMap.anisotropy = 4;
  limestoneMap.needsUpdate = true;
  const material = new THREE.MeshStandardMaterial({
    name: 'Rift honed limestone', color: 0xffffff, roughness: 0.82,
    map: limestoneMap, bumpMap: limestoneMap, bumpScale: 0.016,
    envMapIntensity: 0.25, emissive: 0xfff6e8, emissiveMap: limestoneMap,
    emissiveIntensity: 0.22,
  });
  material.onBeforeCompile = shader => {
    shader.vertexShader = `varying vec3 vRiftWorldPosition;\n${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
      #include <project_vertex>
      vRiftWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
    `);
    shader.fragmentShader = `varying vec3 vRiftWorldPosition;\n${shader.fragmentShader}`;
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      #include <map_fragment>
      // A restrained near-floor occlusion makes the actual pier feet meet
      // the polished room rather than ending as uniformly lit cut-outs.
      float footOcclusion = mix(0.69, 1.0, smoothstep(-3.5, -1.7, vRiftWorldPosition.y));
      diffuseColor.rgb *= footOcclusion;
    `);
  };
  material.customProgramCacheKey = () => 'parallax-rift-limestone-v2';
  const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xffedcf, toneMapped: false });
  const contactMaterial = new THREE.ShaderMaterial({
    uniforms: { opacity: { value: 0.24 } },
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'varying vec2 vUv; uniform float opacity; void main(){vec2 p=(vUv-.5)*2.0;float core=exp(-dot(p,p)*4.6);gl_FragColor=vec4(.11,.077,.042,core*opacity);}',
    transparent: true, depthWrite: false, toneMapped: false,
  });
  const addBox = (size, position, chosenMaterial = material) => {
    const geometry = new THREE.BoxGeometry(...size);
    if (chosenMaterial === material) {
      // Keep photographic grain isotropic on tall, narrow piers and deep walls.
      const normals = geometry.attributes.normal, uv = geometry.attributes.uv;
      const cropAspect = galleryTexture.image.width * 0.105 / (galleryTexture.image.height * 0.145);
      for (let i = 0; i < uv.count; i++) {
        const nx = Math.abs(normals.getX(i)), ny = Math.abs(normals.getY(i));
        const faceWidth = nx > 0.5 ? size[2] : size[0];
        const faceHeight = ny > 0.5 ? size[2] : size[1];
        const ratio = faceWidth / faceHeight / cropAspect;
        const su = Math.min(1, ratio), sv = Math.min(1, 1 / ratio);
        uv.setXY(i, (uv.getX(i) - 0.5) * su + 0.5, (uv.getY(i) - 0.5) * sv + 0.5);
      }
    }
    const mesh = new THREE.Mesh(geometry, chosenMaterial);
    mesh.position.fromArray(position);
    mesh.receiveShadow = true;
    group.add(mesh);
    if (chosenMaterial === material && position[1] - size[1] / 2 < -3.4) {
      const contact = new THREE.Mesh(new THREE.PlaneGeometry(size[0] + 2.5, size[2] + 2.5), contactMaterial);
      contact.rotation.x = -Math.PI / 2;
      contact.position.set(position[0], -3.49, position[2]);
      contact.name = 'Limestone foot contact';
      group.add(contact);
    }
    return mesh;
  };
  addBox([0.28, 12, 29], [-8.8, 2.5, -18]);
  addBox([0.28, 12, 29], [8.8, 2.5, -18]);
  for (let i = 0; i < 3; i++) {
    const z = -8 - i * 7.5;
    addBox([0.8, 12, 1.5], [-6.9, 2.5, z]);
    addBox([0.6, 12, 1.8], [7.2, 2.5, z - 3.7]);
    // Asymmetric overhead slabs leave a continuous high skylight, not a tunnel.
    addBox([9, 0.6, 5.5], [-4.0, 8.2, z + 0.7]);
    addBox([0.07, 11.5, 0.05], [7.51, 2.1, z - 4.4], lightMaterial);
  }
  const farMaterial = new THREE.MeshBasicMaterial({ map: galleryTexture, color: 0xffffff, toneMapped: false });
  const farArchitecture = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), farMaterial);
  farArchitecture.name = 'Distant authored gallery beyond real piers';
  group.add(farArchitecture);
  group.visible = false;
  return {
    group,
    update(camera) {
      // An effectively distant architectural plate has no finite rectangle in
      // the passage. Real piers in front still occlude it with camera parallax.
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      farArchitecture.position.copy(camera.position).addScaledVector(direction, 58);
      farArchitecture.quaternion.copy(camera.quaternion);
      const imageAspect = galleryTexture.image.width / galleryTexture.image.height;
      const viewHeight = 2 * 58 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const coverHeight = Math.max(viewHeight, viewHeight * camera.aspect / imageAspect) * 1.06;
      farArchitecture.scale.set(coverHeight * imageAspect, coverHeight, 1);
    },
    dispose() {
      group.traverse(object => object.geometry?.dispose());
      material.dispose(); lightMaterial.dispose(); farMaterial.dispose();
      contactMaterial.dispose(); limestoneMap.dispose();
    },
  };
}

function projectionDistance(model, camera, referenceCamera, width, height) {
  let anchorMax = 0, viewMax = 0;
  const current = new THREE.Vector3(), baseline = new THREE.Vector3();
  const pA = new THREE.Vector3(), pB = new THREE.Vector3();
  for (const mesh of model.fragments) {
    const spec = mesh.userData.spec;
    const positions = mesh.geometry.attributes.position;
    for (let i = 0; i < positions.count; i += 6) {
      baseline.fromBufferAttribute(positions, i).add(new THREE.Vector3(...spec.center));
      current.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld);
      pA.copy(baseline).project(referenceCamera);
      pB.copy(current).project(referenceCamera);
      anchorMax = Math.max(anchorMax, Math.hypot((pA.x - pB.x) * width / 2, (pA.y - pB.y) * height / 2));
      pA.copy(baseline).project(camera);
      pB.copy(current).project(camera);
      viewMax = Math.max(viewMax, Math.hypot((pA.x - pB.x) * width / 2, (pA.y - pB.y) * height / 2));
    }
  }
  return { anchorMaxErrorPx: anchorMax, viewMaxErrorPx: viewMax };
}

/** All motion is sampled from the caller's one timeline; this module owns no clock. */
export async function createSpatialStage(canvas, { onError } = {}) {
  // Resolve CPU image data before owning any GPU handles. A context can be
  // lost and restored while images load; all render targets must be created
  // together afterwards, in the same uninterrupted initialization task.
  const loadedTextures = await Promise.allSettled([
    new THREE.TextureLoader().loadAsync(import.meta.env.BASE_URL + 'parallax/assets/basalt.png'),
    new THREE.TextureLoader().loadAsync(import.meta.env.BASE_URL + 'parallax/assets/gallery-museum.png'),
  ]);
  const failedTexture = loadedTextures.find(result => result.status === 'rejected');
  if (failedTexture) {
    loadedTextures.forEach(result => { if (result.status === 'fulfilled') result.value.dispose(); });
    throw failedTexture.reason;
  }
  const [texture, galleryTexture] = loadedTextures.map(result => result.value);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  galleryTexture.colorSpace = THREE.SRGBColorSpace;

  let renderer, environmentTarget, architecturalEnvironmentTarget;
  let fatalRenderError = null;
  try {
    const contextOptions = { alpha: true, antialias: true, powerPreference: 'high-performance', premultipliedAlpha: true };
    const context = canvas.getContext('webgl2', contextOptions);
    // Three queries shader precision during construction. A context that is
    // still lost cannot answer those queries; wait in the labelled fallback.
    if (!context || context.isContextLost()) throw new Error('The artwork graphics context is unavailable.');
    renderer = new THREE.WebGLRenderer({ canvas, context, ...contextOptions });
    renderer.debug.onShaderError = (gl, program, vertexShader, fragmentShader) => {
      fatalRenderError = new Error(`The artwork shader could not be compiled: ${gl.getProgramInfoLog(program) || gl.getShaderInfoLog(fragmentShader) || gl.getShaderInfoLog(vertexShader) || 'unknown graphics error'}`);
      fatalRenderError.name = 'ArtworkShaderError';
      onError?.(fatalRenderError);
    };
    if (renderer.getContext().isContextLost()) throw new Error('The artwork graphics context is unavailable.');
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.14;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    environmentTarget = studioEnvironment(renderer);
    if (fatalRenderError) throw fatalRenderError;
    // Equal PMREM dimensions support a continuous chrome environment blend.
    architecturalEnvironmentTarget = studioEnvironment(renderer, true);
    if (fatalRenderError) throw fatalRenderError;
    if (renderer.getContext().isContextLost()) throw new Error('The artwork graphics context was interrupted during initialization.');
  } catch (error) {
    architecturalEnvironmentTarget?.dispose(); environmentTarget?.dispose(); renderer?.dispose();
    texture.dispose(); galleryTexture.dispose();
    throw error;
  }
  const scene = new THREE.Scene();
  scene.name = 'PARALLAX — one persistent spatial world';
  const camera = new THREE.PerspectiveCamera(34, 1, 0.06, 130);
  const referenceCamera = camera.clone();
  scene.environment = environmentTarget.texture;
  scene.environmentIntensity = 0.45;
  const model = createMasterModel({ stoneMap: texture });
  // r186 uses scene.environmentIntensity for inherited environment maps. Bind
  // explicitly so each authored stone/chrome intensity really controls its light.
  model.materials.stone.envMap = environmentTarget.texture;
  model.materials.chrome.envMap = environmentTarget.texture;
  const chromaCoating = { value: 0 };
  const architecturalChromeBlend = { value: 1 };
  model.materials.chrome.onBeforeCompile = shader => {
    shader.uniforms.uParallaxChroma = chromaCoating;
    shader.uniforms.uParallaxArchitectureMap = { value: architecturalEnvironmentTarget.texture };
    shader.uniforms.uParallaxArchitectureBlend = architecturalChromeBlend;
    let chromeEnvironmentChunk = THREE.ShaderChunk.envmap_physical_pars_fragment;
    for (const sample of [
      'textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 )',
      'textureCubeUV( envMap, envMapRotation * reflectVec, roughness )',
      'textureCubeUV( envMap, envMapRotation * retroVec, roughness )',
    ]) {
      const architecturalSample = sample.replace('envMap,', 'uParallaxArchitectureMap,');
      chromeEnvironmentChunk = chromeEnvironmentChunk.replaceAll(sample, `mix(${sample}, ${architecturalSample}, uParallaxArchitectureBlend)`);
    }
    shader.fragmentShader = shader.fragmentShader.replace('#include <envmap_physical_pars_fragment>', chromeEnvironmentChunk);
    shader.fragmentShader = `
      uniform float uParallaxChroma;
      uniform sampler2D uParallaxArchitectureMap;
      uniform float uParallaxArchitectureBlend;
      vec3 parallaxSpectrum(float phase) {
        vec3 cobaltBand = vec3(0.008, 0.055, 0.95);
        vec3 violetBand = vec3(0.09, 0.007, 0.65);
        vec3 rubyBand = vec3(0.78, 0.018, 0.055);
        vec3 amberBand = vec3(1.00, 0.25, 0.025);
        if (phase < 0.30) return mix(cobaltBand, violetBand, smoothstep(0.03, 0.30, phase));
        if (phase < 0.51) return mix(violetBand, rubyBand, smoothstep(0.32, 0.51, phase));
        if (phase < 0.70) return mix(rubyBand, amberBand, smoothstep(0.53, 0.70, phase));
        return mix(amberBand, cobaltBand, smoothstep(0.72, 0.97, phase));
      }
      ${shader.fragmentShader}
    `;
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
      if (uParallaxChroma > 0.00001) {
        // The optical coordinate follows the real reflected viewing ray. Each
        // facet responds to camera position; no screen-space colour overlay.
        vec3 reflectedView = inverseTransformDirection(reflect(-geometryViewDir, normal), viewMatrix);
        float opticalCoordinate = reflectedView.y * 4.20 + reflectedView.x * 1.15
          + reflectedView.z * 0.65 + atan(reflectedView.z, reflectedView.x) * 0.45;
        float spectralPhase = fract(opticalCoordinate);
        vec3 spectralColour = parallaxSpectrum(spectralPhase);
        float reflectedEnergy = max(0.18, dot(outgoingLight, vec3(0.2126, 0.7152, 0.0722)));
        float silverStreak = clamp(
          pow(max(0.0, cos(6.2831853 * (spectralPhase - 0.06))), 30.0)
          + pow(max(0.0, cos(6.2831853 * (spectralPhase - 0.61))), 40.0), 0.0, 1.0);
        vec3 coatedChrome = spectralColour * (reflectedEnergy * 0.82 + 0.055);
        coatedChrome = mix(coatedChrome, outgoingLight * 1.06, silverStreak);
        vec2 bandDistance = abs(fract(vec2(spectralPhase - 0.19, spectralPhase - 0.64) + 0.5) - 0.5);
        float opticalBand = max(1.0 - smoothstep(0.12, 0.23, bandDistance.x),
          0.85 * (1.0 - smoothstep(0.045, 0.095, bandDistance.y)));
        outgoingLight = mix(outgoingLight, coatedChrome, uParallaxChroma * opticalBand);
      }
      #include <opaque_fragment>
    `);
  };
  model.materials.chrome.customProgramCacheKey = () => 'parallax-reflection-chroma-v2-architectural-chrome-v1';
  scene.add(model.group);
  const optics = createOptics(renderer);
  // The child's plane is horizontal. This group rotation stands it upright,
  // then turns its real reflective normal toward the object and camera.
  optics.mirror.position.set(-3.45, 0.99, 0);
  optics.mirror.rotation.set(Math.PI / 2, 1.50, 0, 'YXZ');
  optics.mirror.scale.set(0.72, 1, 0.65);
  optics.membrane.position.set(0.25, 0.1, 2.0);
  scene.add(optics.mirror, optics.membrane);
  if (optics.floorMirror) scene.add(optics.floorMirror);

  const hemisphere = new THREE.HemisphereLight(0xf3eee5, 0x504737, 0.38);
  scene.add(hemisphere);
  const key = new THREE.DirectionalLight(0xfff6e8, 2.7);
  key.position.set(-4.8, 8, 7);
  key.castShadow = false;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = key.shadow.camera.bottom = -8;
  key.shadow.camera.right = key.shadow.camera.top = 8;
  key.shadow.camera.near = 0.5; key.shadow.camera.far = 35;
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.012;
  key.shadow.radius = 3;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xe7efff, 1.1);
  fill.position.set(6, 2, 5); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xfff4df, 2.6);
  rim.position.set(-4, 4, -6); scene.add(rim);
  const cobalt = new THREE.PointLight(0x1645ff, 0, 20, 2);
  cobalt.position.set(-3.7, 1.2, 2.2); scene.add(cobalt);
  const violet = new THREE.PointLight(0x9b40f0, 0, 20, 2);
  violet.position.set(4.0, 1.5, -0.1); scene.add(violet);
  const amber = new THREE.PointLight(0xff7632, 0, 12, 2);
  amber.position.set(2.0, -2.0, 1.2); scene.add(amber);
  const contactMaterial = new THREE.ShaderMaterial({
    uniforms: { opacity: { value: 0.20 } },
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'varying vec2 vUv; uniform float opacity; void main(){vec2 p=(vUv-.5)*2.0;float core=exp(-dot(p*vec2(1.0,1.8),p*vec2(1.0,1.8))*4.5);gl_FragColor=vec4(.055,.05,.045,core*opacity);}',
    transparent: true, depthWrite: false, toneMapped: false,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8.0, 3.8), contactMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0.1, -3.225, 0);
  floor.receiveShadow = true;
  floor.name = 'Soft contact occlusion';
  scene.add(floor);
  const riftGallery = createRiftGallery(galleryTexture);
  scene.add(riftGallery.group);

  let width = 1, height = 1, pixelRatio = 1, disposed = false, contextLost = false;
  let lastProgress = 0, lastMobile = false, lastCameraPose = null, lastRiftOpen = 0;
  let projection = { anchorMaxErrorPx: 0, viewMaxErrorPx: 0 };
  let renderCount = 0;
  const originalIds = model.fragments.map(mesh => mesh.uuid);
  const currentQuaternion = new THREE.Quaternion();
  const targetQuaternion = new THREE.Quaternion();
  const identityQuaternion = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const explosion = new THREE.Vector3();
  const rayPosition = new THREE.Vector3();
  const cameraTarget = new THREE.Vector3();
  const onContextLost = event => {
    event.preventDefault();
    contextLost = true;
    fatalRenderError = new Error('The artwork graphics context was interrupted.');
    onError?.(fatalRenderError);
  };
  canvas.addEventListener('webglcontextlost', onContextLost, false);

  function resize(nextWidth, nextHeight, dpr = 1) {
    if (disposed) return;
    width = Math.max(1, Math.round(nextWidth));
    height = Math.max(1, Math.round(nextHeight));
    pixelRatio = Math.min(Math.max(1, dpr), 2, Math.sqrt(9_000_000 / (width * height)));
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    referenceCamera.aspect = camera.aspect;
    referenceCamera.updateProjectionMatrix();
    optics.resize(width, height, pixelRatio);
  }

  function render({ progress = 0, reducedMotion = false, pointer = { x: 0, y: 0 }, alignLocked = false, width: nextWidth, height: nextHeight } = {}) {
    if (disposed) throw new Error('The artwork renderer has been disposed.');
    if (contextLost || renderer.getContext().isContextLost()) throw fatalRenderError || new Error('The artwork graphics context is unavailable.');
    if (fatalRenderError) throw fatalRenderError;
    if (nextWidth && nextHeight && (Math.round(nextWidth) !== width || Math.round(nextHeight) !== height)) resize(nextWidth, nextHeight, pixelRatio);
    const p = clamp(progress, 0, 9);
    // Composition follows the available aspect ratio. Portrait tablets need
    // the same centred ray camera and full mirror as a portrait phone.
    const mobile = height >= width;
    const referencePosition = mobile ? MOBILE_ALIGNMENT_CAMERA : ALIGNMENT_CAMERA;
    const referenceTarget = mobile ? MOBILE_ALIGNMENT_TARGET : ALIGNMENT_TARGET;
    const rayIn = smoothstep(1.0, 1.55, p);
    const rayOut = 1 - smoothstep(2.35, 2.88, p);
    const rayAmount = rayIn * rayOut;
    const fragmentAmount = envelope(p, 0.05, 1, 1.55);
    const riftAmount = envelope(p, 3.38, 4.03, 4.80);
    const riftOpen = smoothstep(3.70, 4.09, p);
    const lateSeparation = 0.35 * envelope(p, 6.8, 7.34, 8.0);
    const reflection = envelope(p, 2.48, 3, 3.60);
    const membrane = envelope(p, 4.71, 5, 5.85);
    const chroma = envelope(p, 5.3, 6, 6.86);
    const halo = envelope(p, 6.25, 7, 7.92);
    const dark = smoothstep(5.25, 5.88, p) * (1 - smoothstep(7.35, 7.98, p));
    const museum = smoothstep(8.05, 9, p);
    const opticalSeparation = 0.10 * envelope(p, 4.80, 5.2, 5.90);

    for (const mesh of model.fragments) {
      const spec = mesh.userData.spec;
      position.fromArray(spec.center);
      explosion.fromArray(spec.explode).multiplyScalar(fragmentAmount + lateSeparation + opticalSeparation);
      position.add(explosion);
      const angle = spec.rotation.map(n => n * (fragmentAmount + lateSeparation));
      targetQuaternion.setFromEuler(new THREE.Euler(...angle));
      currentQuaternion.copy(identityQuaternion).slerp(targetQuaternion, 1 - rayAmount);
      rayPosition.fromArray(scaleAboutCamera(spec.center, referencePosition, spec.rayScale));
      position.lerp(rayPosition, rayAmount);
      let pieceScale = lerp(1, spec.rayScale, rayAmount);

      if (riftAmount > 0) {
        const enlarged = 1 + 0.88 * riftAmount;
        const side = spec.sideName;
        const sideSign = side === 'left' ? -1 : side === 'right' ? 1 : 0;
        const incision = sideSign * (-0.74 * (1 - riftOpen) + 0.10 * riftOpen) * riftAmount;
        position.multiplyScalar(enlarged);
        position.x += incision;
        if (side === 'crown') position.y += 0.18 * riftOpen * riftAmount;
        if (side === 'base') position.y -= 0.08 * riftOpen * riftAmount;
        pieceScale *= enlarged;
      }
      mesh.position.copy(position);
      mesh.quaternion.copy(currentQuaternion);
      mesh.scale.setScalar(pieceScale);
    }

    const cameraPose = samplePath(mobile ? MOBILE_CAMERA_PATH : DESKTOP_CAMERA_PATH, p);
    camera.position.fromArray(cameraPose.position);
    cameraTarget.fromArray(cameraPose.target);
    const alignmentPhase = p >= 1.55 && p <= 2.35;
    const pointerInfluence = reducedMotion || (alignmentPhase && alignLocked) ? 0 : (alignmentPhase ? 1 : 0.17);
    const riftPointerFade = 1 - envelope(p, 3.4, 4.12, 4.88);
    camera.position.x += clamp(pointer.x ?? 0, -1, 1) * (mobile ? 1.3 : 1.8) * pointerInfluence * riftPointerFade;
    camera.position.y += clamp(pointer.y ?? 0, -1, 1) * 0.45 * pointerInfluence * riftPointerFade;
    if (alignmentPhase && alignLocked) {
      camera.position.fromArray(referencePosition);
      cameraTarget.fromArray(referenceTarget);
    }
    // Narrow landscape frames need a little more breathing room around the
    // full form and footer. The Rift keeps its authored close passage.
    const landscapeFraming = mobile ? 0 : 3.6 * (1 - smoothstep(1.25, 1.65, width / height))
      * (1 - envelope(p, 3.4, 4.12, 4.88));
    camera.fov = (cameraPose.fov ?? 38) + landscapeFraming;
    camera.lookAt(cameraTarget);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    referenceCamera.fov = 38 + landscapeFraming;
    referenceCamera.position.fromArray(referencePosition);
    referenceCamera.lookAt(...referenceTarget);
    referenceCamera.updateProjectionMatrix();
    referenceCamera.updateMatrixWorld();

    key.intensity = 2.7 * (1 - dark * 0.74) * (1 - halo * 0.98);
    fill.intensity = 1.10 * (1 - dark * 0.90) * (1 - halo * 0.80);
    hemisphere.intensity = 0.38 * (1 - halo * 0.92) * (1 - dark * 0.45);
    rim.intensity = 2.6 + halo * 3.3;
    cobalt.intensity = 23 * chroma;
    violet.intensity = 30 * chroma;
    // Amber belongs to the chrome coating; a front point light creates a
    // distracting orange hotspot on the black stone instead of optical bands.
    amber.intensity = 0;
    model.materials.stone.color.setHex(0x929aa2).multiplyScalar(1 - halo * 0.988);
    model.materials.chrome.color.setHex(0xe0e6ed).multiplyScalar(1 - halo * 0.975);
    model.materials.stone.envMapIntensity = 0.18 * (1 - halo * 0.999) * (1 - dark * 0.32);
    model.materials.chrome.envMapIntensity = 1.1 * (1 - halo * 0.997);
    model.materials.chrome.iridescence = 0.20 * chroma;
    model.materials.chrome.roughness = lerp(0.065, 0.08, chroma);
    chromaCoating.value = chroma;
    architecturalChromeBlend.value = (1 - chroma) * (1 - halo);
    model.materials.edge.opacity = halo * 0.50;
    model.materials.glow.opacity = 0.10 + halo * 0.14;
    renderer.toneMappingExposure = 1.14 - dark * 0.16 - halo * 0.08;
    floor.visible = reflection < 0.03 && halo < 0.5 && riftAmount < 0.2;
    floor.material.uniforms.opacity.value = 0.25 * (1 - fragmentAmount * 0.45);
    riftGallery.group.visible = p > 3.62 && p < 4.62;
    if (riftGallery.group.visible) riftGallery.update(camera);
    optics.membrane.position.set(mobile ? 0 : 0.25, 0.1, 2.0);
    optics.membrane.rotation.set(0.035 * membrane, -0.045 * membrane, -0.035 * membrane);
    // A near-X mirror extends in world depth. Mobile's distant camera needs
    // more physical mirror width for the full reflected ray bundle to hit it.
    optics.mirror.scale.x = mobile ? 1.60 : 0.72;

    scene.updateMatrixWorld(true);
    const floorReflection = (0.19 + museum * 0.15) * (1 - dark) * (1 - riftAmount) * (1 - rayAmount) * (1 - reflection);
    const state = { progress: p, reducedMotion, reflection, floorReflection, membrane, chroma, width, height, pixelRatio };
    optics.beforeRender(scene, camera, state);
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
    if (fatalRenderError) throw fatalRenderError;
    if (alignmentPhase) projection = projectionDistance(model, camera, referenceCamera, width, height);
    lastProgress = p; lastMobile = mobile; lastCameraPose = { position: camera.position.toArray(), target: cameraTarget.toArray(), fov: camera.fov };
    lastRiftOpen = riftOpen;
    renderCount++;
  }

  function diagnostics() {
    const opticalDiagnostics = optics.diagnostics();
    return {
      renderer: 'Three.js WebGLRenderer', revision: THREE.REVISION,
      progress: lastProgress, viewport: { width, height, pixelRatio, mobile: lastMobile },
      renderCount, fragmentCount: model.fragments.length,
      fragmentUUIDs: model.fragments.map(mesh => mesh.uuid),
      originalFragmentUUIDs: [...originalIds],
      persistentIdentity: originalIds.every((id, i) => id === model.fragments[i].uuid),
      geometryUUIDs: model.fragments.map(mesh => mesh.geometry.uuid),
      alignment: {
        active: lastProgress >= 1.55 && lastProgress <= 2.35,
        method: 'Exact uniform ray scaling about a real perspective camera',
        ...projection,
        referenceCamera: [...(lastMobile ? MOBILE_ALIGNMENT_CAMERA : ALIGNMENT_CAMERA)],
        depthScales: model.specs.map(spec => spec.rayScale),
      },
      rift: { cameraZ: camera.position.z, modelFrontZ: MASTER_SPEC.depth / 2 * (1 + 0.88 * envelope(lastProgress, 3.38, 4.03, 4.80)), opening: lastRiftOpen, passageAt: 4.2, cameraPassedPlane: lastProgress >= 4.2 && lastProgress < 4.55 },
      camera: lastCameraPose,
      optics: opticalDiagnostics,
      reflectionRenderCount: opticalDiagnostics.reflectionRenders ?? 0,
      membraneCaptureCount: opticalDiagnostics.membraneRenders ?? 0,
      contextLost,
      sceneObjects: renderer.info.render.calls,
      geometryTriangles: renderer.info.render.triangles,
    };
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    canvas.removeEventListener('webglcontextlost', onContextLost, false);
    optics.dispose(); model.dispose(); riftGallery.dispose();
    floor.geometry.dispose(); floor.material.dispose();
    key.shadow.map?.dispose();
    texture.dispose(); galleryTexture.dispose(); architecturalEnvironmentTarget.dispose(); environmentTarget.dispose(); renderer.dispose();
  }

  resize(canvas.clientWidth || 1920, canvas.clientHeight || 1080, typeof devicePixelRatio === 'number' ? devicePixelRatio : 1);
  return { render, resize, diagnostics, dispose };
}
