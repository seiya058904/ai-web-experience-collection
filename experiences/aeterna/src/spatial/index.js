import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, Number.isFinite(n) ? n : a));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, n) => {
  const t = clamp((n - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const baseURL = import.meta.env.BASE_URL;
const modelURL = (name) => `${baseURL}aeterna/models/${name}`;
const activeScenes = new Set(['body', 'relief', 'fracture', 'afterlife']);

function report(callback, value) {
  if (typeof callback === 'function') callback(value);
}

function emptyStage(error, options) {
  const diagnostics = { supported: false, ready: false, contextLost: false, errors: [error], frames: 0 };
  report(options.onError, error);
  return {
    update() {}, resize() {}, dispose() {},
    ready: Promise.resolve(diagnostics),
    getDiagnostics: () => ({ ...diagnostics }),
  };
}

function disposeObject(root, resources = new Set()) {
  root.traverse((object) => {
    if (object.isLight && typeof object.dispose === 'function') object.dispose();
    if (object.geometry && !resources.has(object.geometry)) {
      resources.add(object.geometry);
      object.geometry.dispose();
    }
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material || resources.has(material)) continue;
      resources.add(material);
      for (const value of Object.values(material)) {
        if (!value?.isTexture || resources.has(value)) continue;
        resources.add(value);
        value.dispose();
        const data = value.source?.data;
        if (data && typeof data.close === 'function') data.close();
      }
      material.dispose();
    }
  });
}

/** A quiet plaster surface attached to the scan's assembled coordinates.
 * Continuous value noise replaces the old per-cell 1130 Hz albedo hash. Each
 * octave fades with its screen-space footprint before it becomes subpixel;
 * fragment motion therefore never exposes a fresh random pattern or sparkle.
 * This is an exhibition material, not a reconstruction of the cast's surface. */
function addCastSurface(material) {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = `attribute vec3 restPosition;\nvarying vec3 vAeternaRest;\n${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvAeternaRest = restPosition;',
    );
    shader.fragmentShader = `
      varying vec3 vAeternaRest;
      float aeternaHash(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }
      float aeternaNoise(vec3 p) {
        vec3 cell = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(aeternaHash(cell), aeternaHash(cell + vec3(1, 0, 0)), f.x),
              mix(aeternaHash(cell + vec3(0, 1, 0)), aeternaHash(cell + vec3(1, 1, 0)), f.x), f.y),
          mix(mix(aeternaHash(cell + vec3(0, 0, 1)), aeternaHash(cell + vec3(1, 0, 1)), f.x),
              mix(aeternaHash(cell + vec3(0, 1, 1)), aeternaHash(cell + vec3(1, 1, 1)), f.x), f.y), f.z);
      }
      float aeternaGrain(float frequency, float footprint) {
        float resolved = 1.0 - smoothstep(0.25, 0.8, footprint * frequency);
        return (aeternaNoise(vAeternaRest * frequency) - 0.5) * resolved;
      }
      ${shader.fragmentShader}`;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      float castFootprint = max(length(dFdx(vAeternaRest)), length(dFdy(vAeternaRest)));
      float castGrain = aeternaGrain(44.0, castFootprint) * 0.72
                      + aeternaGrain(150.0, castFootprint) * 0.28;
      diffuseColor.rgb *= 1.0 + castGrain * 0.016;`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `#include <roughnessmap_fragment>
      roughnessFactor = clamp(roughnessFactor + castGrain * 0.035, 0.72, 0.985);`,
    );
  };
  material.customProgramCacheKey = () => 'aeterna-filtered-cast-2';
}

/**
 * A single transparent museum stage. The host owns scrolling, focus, controls,
 * animation scheduling, and chapter backgrounds. All URLs remain local.
 *
 * update({scene, progress, pointerX, pointerY, reducedMotion, light, explosion,
 *         width, height, visible, manualProgress, fitToViewport})
 * scene: body | relief | fracture | afterlife | none
 * progress, light, explosion: normalized 0..1; pointer: -1..1.
 * An explicit explosion value always represents direct visitor control.
 * Without it, scroll assembles/disperses the sculpture. Reduced motion keeps
 * the sculpture assembled and suppresses camera drift, except direct controls.
 * manualProgress=true lets a directly operated relief slider change its orbit
 * and approach while reduced motion still suppresses pointer movement.
 * fitToViewport=true fits the visible sculpture and pedestal into the supplied
 * host rectangle. The host must reserve its own title and control areas.
 */
export async function createSpatialStage(canvas, options = {}) {
  if (!canvas?.getContext) {
    return emptyStage({ type: 'webgl-unavailable', message: 'A canvas is required.', recoverable: false }, options);
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (error) {
    return emptyStage({ type: 'webgl-unavailable', message: error.message, recoverable: false }, options);
  }

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.93;
  renderer.shadowMap.enabled = true;
  // PCFSoftShadowMap was removed from the bundled three.js build: assigning it
  // only logs a warning and silently falls back to PCFShadowMap. Name the
  // supported type directly so the shadows we ship are the shadows we ask for.
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const world = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(31, 1, 0.08, 60);
  camera.position.set(0, 0.18, 10.3);
  camera.lookAt(0, 0.05, 0);
  const subject = new THREE.Group();
  world.add(subject);

  const hemisphere = new THREE.HemisphereLight(0xefece5, 0x353b3c, 0.72);
  const key = new THREE.DirectionalLight(0xfff1df, 3.0);
  key.position.set(-3.6, 5.5, 4.8);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -5;
  key.shadow.camera.right = 5;
  key.shadow.camera.top = 5;
  key.shadow.camera.bottom = -5;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 20;
  key.shadow.normalBias = 0.025;
  key.shadow.bias = -0.00012;
  key.shadow.radius = 3.5;
  key.target.position.set(0.8, 0, 0);
  const fill = new THREE.DirectionalLight(0xbac8d6, 0.52);
  fill.position.set(4, 0.8, 2);
  const rim = new THREE.DirectionalLight(0xf4f0e6, 1.0);
  rim.position.set(2.5, 3.2, -3.5);
  world.add(hemisphere, key, key.target, fill, rim);

  const pedestal = new THREE.Mesh(
    new RoundedBoxGeometry(1.72, 0.12, 1.36, 2, 0.012),
    new THREE.MeshStandardMaterial({ color: 0x2b2925, roughness: 0.88, metalness: 0 }),
  );
  pedestal.position.y = -2.20;
  pedestal.castShadow = true;
  pedestal.receiveShadow = true;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ color: 0x282824, opacity: 0.10 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.27;
  floor.receiveShadow = true;
  world.add(pedestal, floor);

  let environmentTarget = null;
  function rebuildEnvironment() {
    const room = new RoomEnvironment();
    const generator = new THREE.PMREMGenerator(renderer);
    const next = generator.fromScene(room, 0.065);
    room.dispose();
    generator.dispose();
    environmentTarget?.dispose();
    environmentTarget = next;
    world.environment = next.texture;
    world.environmentIntensity = 0.30;
  }
  rebuildEnvironment();

  const draco = new DRACOLoader();
  draco.setDecoderPath(modelURL('draco/'));
  draco.setWorkerLimit(1);
  const loader = new GLTFLoader().setDRACOLoader(draco);
  const fragments = [];
  let bodyRoot = null;
  let reliefRoot = null;
  let geometryStudy = null;
  let disposed = false;
  let contextLost = false;
  let width = 0;
  let height = 0;
  let lastScene = 'none';
  let lastState = { scene: 'none', progress: 0, reducedMotion: false };
  let frames = 0;
  const errors = [];
  const readiness = { body: false, relief: false };
  const assetTriangles = { body: 0, relief: 0 };
  const cameraTarget = new THREE.Vector3();
  const baseQuaternion = new THREE.Quaternion();
  const spinQuaternion = new THREE.Quaternion();
  const tempEuler = new THREE.Euler();
  const fitBounds = new THREE.Box3();
  const geometryBounds = new THREE.Box3();
  const fitCenter = new THREE.Vector3();
  const fitDirection = new THREE.Vector3();
  const fitRight = new THREE.Vector3();
  const fitUp = new THREE.Vector3();
  const fitCorner = new THREE.Vector3();

  function includeGeometryInFit(object) {
    const geometry = object.geometry;
    if (!geometry) return;
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    if (!geometry.boundingBox || geometry.boundingBox.isEmpty()) return;
    geometryBounds.copy(geometry.boundingBox).applyMatrix4(object.matrixWorld);
    fitBounds.union(geometryBounds);
  }

  function fitCameraToSubject(isRelief, approach, px, py) {
    fitBounds.makeEmpty();
    subject.updateWorldMatrix(true, true);
    // traverseVisible excludes the inactive loaded exhibit. The floor is
    // deliberately absent: its shadow must never determine sculpture framing.
    subject.traverseVisible(includeGeometryInFit);
    if (pedestal.visible) {
      pedestal.updateWorldMatrix(true, false);
      includeGeometryInFit(pedestal);
    }
    if (fitBounds.isEmpty()) return false;

    fitBounds.getCenter(fitCenter);
    fitDirection.set(px * 0.008, (isRelief ? mix(0.10, 0.025, approach) : 0.025) + py * 0.008, 1).normalize();
    fitRight.crossVectors(camera.up, fitDirection).normalize();
    fitUp.crossVectors(fitDirection, fitRight).normalize();

    // The small change in fill preserves a visible approach during a relief
    // inspection instead of normalizing every progress value to the same size.
    const fill = isRelief ? mix(0.80, 0.91, approach) : 0.91;
    const verticalLimit = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * fill;
    const horizontalLimit = verticalLimit * camera.aspect;
    let distance = 0;
    for (let corner = 0; corner < 8; corner++) {
      fitCorner.set(
        corner & 1 ? fitBounds.max.x : fitBounds.min.x,
        corner & 2 ? fitBounds.max.y : fitBounds.min.y,
        corner & 4 ? fitBounds.max.z : fitBounds.min.z,
      ).sub(fitCenter);
      const towardCamera = fitCorner.dot(fitDirection);
      distance = Math.max(
        distance,
        towardCamera + Math.abs(fitCorner.dot(fitRight)) / horizontalLimit,
        towardCamera + Math.abs(fitCorner.dot(fitUp)) / verticalLimit,
        towardCamera + camera.near + 0.02,
      );
    }
    camera.position.copy(fitCenter).addScaledVector(fitDirection, distance);
    cameraTarget.copy(fitCenter);
    return true;
  }

  function fail(type, error, sceneName, recoverable = true) {
    const record = { type, message: error?.message || String(error), scene: sceneName, recoverable };
    errors.push(record);
    report(options.onError, record);
  }

  function resize(nextWidth, nextHeight) {
    if (disposed) return;
    const w = Math.max(1, Math.round(nextWidth || canvas.clientWidth || 1));
    const h = Math.max(1, Math.round(nextHeight || canvas.clientHeight || 1));
    if (width === w && height === h) return;
    width = w;
    height = h;
    const dpr = Math.min(window.devicePixelRatio || 1, w < 720 ? 1.5 : 1.65, Math.sqrt(7500000 / (w * h)));
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  const onContextLost = (event) => {
    event.preventDefault();
    contextLost = true;
    fail('context-lost', new Error('The 3D context was interrupted. The gallery will restore it when available.'), lastScene);
  };
  const onContextRestored = () => {
    if (disposed) return;
    contextLost = false;
    try {
      rebuildEnvironment();
      update(lastState);
      report(options.onReady, getDiagnostics());
    } catch (error) {
      fail('context-restore', error, lastScene);
    }
  };
  canvas.addEventListener('webglcontextlost', onContextLost, false);
  canvas.addEventListener('webglcontextrestored', onContextRestored, false);

  async function loadBody() {
    const gltf = await loader.loadAsync(options.bodyURL || modelURL('herakles-fragments.glb'));
    if (disposed) { disposeObject(gltf.scene); return; }
    bodyRoot = gltf.scene;
    geometryStudy = gltf.parser?.json?.extras?.study || null;
    bodyRoot.updateMatrixWorld(true);
    const sourceNodes = [];
    bodyRoot.traverse((node) => {
      if (Number.isInteger(node.userData.fragmentId)) sourceNodes.push(node);
    });
    if (!sourceNodes.length) {
      for (const child of bodyRoot.children) sourceNodes.push(child);
    }
    sourceNodes.forEach((node, index) => {
      const origin = node.position.clone();
      const direction = new THREE.Vector3(
        origin.x * 0.68 + Math.sin(index * 2.39996) * 0.16,
        origin.y * 0.58,
        origin.z * 0.74 + Math.cos(index * 2.39996) * 0.16,
      );
      if (direction.lengthSq() < 0.08) direction.set(Math.sin(index * 2.4) * 0.45, (index % 3 - 1) * 0.38, 0.42);
      const spin = new THREE.Vector3(Math.sin(index * 1.72) * 0.22, Math.cos(index * 2.29) * 0.25, Math.sin(index * 2.63) * 0.17);
      fragments.push({ node, origin, direction, spin, quaternion: node.quaternion.clone(), index });
    });
    const stoneMaterials = new Map();
    bodyRoot.traverse((mesh) => {
      if (mesh.isLineSegments) {
        mesh.material.color.set(0x575348);
        mesh.material.transparent = true;
        mesh.material.opacity = 0.13;
        mesh.material.depthWrite = false;
        return;
      }
      if (!mesh.isMesh) return;
      const positions = mesh.geometry.getAttribute('position');
      const rest = new Float32Array(positions.count * 3);
      const point = new THREE.Vector3();
      for (let i = 0; i < positions.count; i++) {
        point.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld);
        point.toArray(rest, i * 3);
      }
      mesh.geometry.setAttribute('restPosition', new THREE.BufferAttribute(rest, 3));
      const originalMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const materials = originalMaterials.map((original) => {
        if (stoneMaterials.has(original)) return stoneMaterials.get(original);
        const material = original.clone();
        const isCut = /cut|interior/i.test(material.name || '');
        material.color.set(isCut ? 0xc4bca9 : 0xe1ded5);
        material.metalness = 0;
        material.roughness = isCut ? 0.95 : 0.82;
        material.envMapIntensity = isCut ? 0.16 : 0.30;
        addCastSurface(material);
        stoneMaterials.set(original, material);
        return material;
      });
      mesh.material = Array.isArray(mesh.material) ? materials : materials[0];
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      assetTriangles.body += (mesh.geometry.index?.count || positions.count) / 3;
    });
    for (const original of stoneMaterials.keys()) original.dispose();
    bodyRoot.visible = false;
    subject.add(bodyRoot);
    readiness.body = true;
    report(options.onAssetReady, { ...getDiagnostics(), scene: 'body' });
    update(lastState);
  }

  async function loadRelief() {
    const gltf = await loader.loadAsync(options.reliefURL || modelURL('roman-wellhead.glb'));
    if (disposed) { disposeObject(gltf.scene); return; }
    const source = gltf.scene;
    source.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(source);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const scale = 3.62 / size.y;
    source.position.sub(center);
    reliefRoot = new THREE.Group();
    reliefRoot.add(source);
    reliefRoot.scale.setScalar(scale);
    reliefRoot.traverse((mesh) => {
      if (!mesh.isMesh) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of materials) {
        material.roughness = Math.max(0.73, material.roughness || 0.8);
        material.envMapIntensity = 0.28;
        material.metalness = 0;
        if (material.map) material.map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      }
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      assetTriangles.relief += (mesh.geometry.index?.count || mesh.geometry.getAttribute('position').count) / 3;
    });
    reliefRoot.visible = false;
    subject.add(reliefRoot);
    readiness.relief = true;
    report(options.onAssetReady, { ...getDiagnostics(), scene: 'relief' });
    update(lastState);
  }

  function update(state = {}) {
    if (disposed) return;
    if (state.scene && state.scene !== lastState.scene) {
      lastState.explosion = undefined;
      lastState.manualProgress = false;
    }
    lastState = { ...lastState, ...state };
    const s = lastState;
    resize(s.width, s.height);
    const sceneName = activeScenes.has(s.scene) ? s.scene : 'none';
    if (contextLost || document.hidden) return;
    if (sceneName === 'none' || s.visible === false) {
      // The host owns image readiness and chapter compositing. Leave the last
      // sculpture frame intact while it hides or captures this shared canvas;
      // an active scene is rendered synchronously below, without another clock.
      lastScene = 'none';
      return;
    }

    lastScene = sceneName;
    const p = clamp(s.progress);
    const reduce = Boolean(s.reducedMotion);
    const px = reduce ? 0 : clamp(s.pointerX || 0, -1, 1);
    const py = reduce ? 0 : clamp(s.pointerY || 0, -1, 1);
    const mobile = s.fitToViewport === true || width < 720 || width / height < 0.95;
    const ivory = sceneName === 'afterlife';
    const isRelief = sceneName === 'relief';
    let explosion;
    if (typeof s.explosion === 'number') explosion = clamp(s.explosion);
    else if (reduce) explosion = 0;
    else if (sceneName === 'body') explosion = 1 - smooth(0.04, 0.73, p);
    else if (sceneName === 'fracture') explosion = smooth(0.08, 0.85, p);
    else if (sceneName === 'afterlife') explosion = (1 - smooth(0.08, 0.72, p)) * 0.46;
    else explosion = 0;

    const framingScale = mobile ? 0.82 : 1;
    subject.position.set(mobile ? 0 : 1.06, mobile ? 0.05 : -0.03, 0);
    subject.scale.setScalar(framingScale * mix(1, 0.77, explosion));
    subject.rotation.set(0, 0, 0);
    if (bodyRoot) {
      bodyRoot.visible = !isRelief;
      bodyRoot.rotation.y = reduce ? -0.13 : -0.29 + p * 0.38 + px * 0.14;
      bodyRoot.rotation.x = reduce ? 0 : py * 0.035;
      if (ivory) bodyRoot.rotation.y = reduce ? -0.13 : 0.26 - p * 0.34 + px * 0.10;
      for (const fragment of fragments) {
        const localAmount = reduce ? explosion : smooth(0, 1, explosion);
        fragment.node.position.copy(fragment.origin).addScaledVector(fragment.direction, localAmount * 0.86);
        tempEuler.set(fragment.spin.x * localAmount, fragment.spin.y * localAmount, fragment.spin.z * localAmount);
        spinQuaternion.setFromEuler(tempEuler);
        baseQuaternion.copy(fragment.quaternion).multiply(spinQuaternion);
        fragment.node.quaternion.copy(baseQuaternion);
      }
    }
    if (reliefRoot) {
      reliefRoot.visible = isRelief;
      reliefRoot.rotation.y = reduce && !s.manualProgress ? -0.60 : -1.38 + p * 2.68 + px * 0.13;
      reliefRoot.rotation.x = reduce ? 0 : py * 0.025;
      reliefRoot.position.y = -0.27;
    }

    let light = typeof s.light === 'number' ? clamp(s.light) : s.light === 'right' ? 0.86 : s.light === 'left' ? 0.14 : 0.14;
    const azimuth = mix(-1.12, 1.12, light);
    key.position.set(Math.sin(azimuth) * 6.2 + subject.position.x, 5.1, Math.cos(azimuth) * 5.5);
    key.target.position.set(subject.position.x, -0.1, 0);
    key.color.set(ivory ? 0xfff4e7 : 0xfff1df);
    key.intensity = ivory ? 2.72 : isRelief ? 2.85 : 2.95;
    hemisphere.intensity = ivory ? 0.76 : isRelief ? 0.50 : 0.26;
    fill.intensity = ivory ? 0.43 : isRelief ? 0.29 : 0.20;
    rim.intensity = ivory ? 0.62 : isRelief ? 0.88 : 0.82;
    world.environmentIntensity = ivory ? 0.34 : 0.17;
    renderer.toneMappingExposure = ivory ? 0.94 : 0.90;

    pedestal.visible = explosion < 0.20 || ivory || isRelief;
    pedestal.position.set(subject.position.x, isRelief ? -2.20 * framingScale : -2.19 * framingScale, 0);
    pedestal.scale.set(isRelief ? 1.42 * framingScale : framingScale, framingScale, isRelief ? 1.7 * framingScale : framingScale);
    pedestal.material.color.set(ivory ? 0xbcb6aa : 0x292824);
    floor.position.y = pedestal.position.y - 0.069 * framingScale;
    floor.material.opacity = ivory ? 0.085 : isRelief ? 0.095 : 0.10;

    const reliefApproach = reduce && !s.manualProgress ? 0.35 : smooth(0.16, 0.9, p);
    const activeModel = isRelief ? reliefRoot : bodyRoot;
    const fitted = s.fitToViewport === true && activeModel && fitCameraToSubject(isRelief, reliefApproach, px, py);
    if (!fitted) {
      const cameraDistance = isRelief
        ? mix(mobile ? 10.8 : 10.6, mobile ? 8.7 : 7.65, reliefApproach)
        : mobile ? 11.0 : 10.3;
      camera.position.set(px * 0.055, isRelief ? mix(0.80, 0.13, reliefApproach) + py * 0.045 : 0.16 + py * 0.045, cameraDistance);
      cameraTarget.set(0, mobile ? 0.08 : 0.02, 0);
    }
    camera.lookAt(cameraTarget);
    renderer.render(world, camera);
    frames++;
  }

  function getDiagnostics() {
    return {
      supported: true,
      ready: readiness.body && readiness.relief,
      assets: { ...readiness },
      contextLost,
      disposed,
      scene: lastScene,
      fragmentCount: fragments.length,
      geometryStudy: geometryStudy ? { ...geometryStudy } : null,
      triangles: { ...assetTriangles },
      frames,
      width,
      height,
      pixelRatio: renderer.getPixelRatio(),
      fitToViewport: lastState.fitToViewport === true,
      drawCalls: renderer.info.render.calls,
      renderedTriangles: renderer.info.render.triangles,
      source: {
        body: 'Lansdowne Herakles: SMK plaster-cast scan, Public Domain Mark 1.0; digital fragment study.',
        relief: 'Roman marble wellhead, 2nd century CE: The Metropolitan Museum of Art, CC0.',
      },
      errors: errors.map((error) => ({ ...error })),
    };
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    canvas.removeEventListener('webglcontextlost', onContextLost);
    canvas.removeEventListener('webglcontextrestored', onContextRestored);
    draco.dispose();
    disposeObject(world);
    environmentTarget?.dispose();
    renderer.dispose();
  }

  resize(canvas.clientWidth || 1, canvas.clientHeight || 1);
  const ready = Promise.allSettled([loadBody(), loadRelief()]).then((results) => {
    results.forEach((result, index) => {
      if (result.status === 'rejected' && !disposed) fail('asset-load', result.reason, index === 0 ? 'body' : 'relief');
    });
    const diagnostics = getDiagnostics();
    if (!disposed) report(options.onReady, diagnostics);
    return diagnostics;
  });

  return { update, resize, dispose, getDiagnostics, ready };
}

export default createSpatialStage;
