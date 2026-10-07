import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

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

function addStoneGrain(material) {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = `attribute vec3 restPosition;\nvarying vec3 vAeternaRest;\n${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvAeternaRest = restPosition;',
    );
    shader.fragmentShader = `varying vec3 vAeternaRest;\n${shader.fragmentShader}`;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      float stoneGrain = fract(sin(dot(floor(vAeternaRest * 1130.0), vec3(12.9898, 78.233, 41.317))) * 43758.5453);
      float stoneVein = pow(0.5 + 0.5 * sin(vAeternaRest.y * 12.0 + sin(vAeternaRest.x * 7.0) * 1.6 + vAeternaRest.z * 8.0), 18.0);
      diffuseColor.rgb *= 1.0 - stoneVein * 0.025 + (stoneGrain - 0.5) * 0.028;`,
    );
  };
  material.customProgramCacheKey = () => 'aeterna-stone-grain-1';
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
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const world = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(31, 1, 0.08, 60);
  camera.position.set(0, 0.18, 10.3);
  camera.lookAt(0, 0.05, 0);
  const subject = new THREE.Group();
  world.add(subject);

  const hemisphere = new THREE.HemisphereLight(0xf6eee1, 0x403a32, 0.72);
  const key = new THREE.DirectionalLight(0xffebcd, 3.45);
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
  key.shadow.radius = 3;
  key.target.position.set(0.8, 0, 0);
  const fill = new THREE.DirectionalLight(0xb5c0cb, 0.52);
  fill.position.set(4, 0.8, 2);
  const rim = new THREE.DirectionalLight(0xffefd6, 1.55);
  rim.position.set(2.5, 3.2, -3.5);
  world.add(hemisphere, key, key.target, fill, rim);

  const pedestal = new THREE.Mesh(
    new THREE.BoxGeometry(1.72, 0.12, 1.36),
    new THREE.MeshStandardMaterial({ color: 0x2b2823, roughness: 0.92, metalness: 0 }),
  );
  pedestal.position.y = -2.20;
  pedestal.castShadow = true;
  pedestal.receiveShadow = true;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.24 }));
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
        mesh.material.color.set(0x51432f);
        mesh.material.transparent = true;
        mesh.material.opacity = 0.17;
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
        material.color.set(isCut ? 0xc9b994 : 0xe0d3bc);
        material.metalness = 0;
        material.roughness = isCut ? 0.96 : 0.81;
        material.envMapIntensity = isCut ? 0.18 : 0.32;
        addStoneGrain(material);
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
      if (lastScene !== 'none') renderer.clear();
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
    key.position.set(Math.sin(azimuth) * 6.2 + subject.position.x, 4.6, Math.cos(azimuth) * 5.5);
    key.target.position.set(subject.position.x, -0.1, 0);
    key.color.set(ivory ? 0xfff0d9 : 0xffe8c4);
    key.intensity = ivory ? 2.8 : isRelief ? 2.9 : 2.75;
    hemisphere.intensity = ivory ? 0.78 : isRelief ? 0.44 : 0.20;
    fill.intensity = ivory ? 0.49 : isRelief ? 0.26 : 0.14;
    rim.intensity = ivory ? 0.70 : 1.08;
    world.environmentIntensity = ivory ? 0.36 : 0.15;
    renderer.toneMappingExposure = ivory ? 0.94 : 0.88;

    pedestal.visible = explosion < 0.20 || ivory || isRelief;
    pedestal.position.set(subject.position.x, isRelief ? -2.20 * framingScale : -2.19 * framingScale, 0);
    pedestal.scale.set(isRelief ? 1.42 * framingScale : framingScale, framingScale, isRelief ? 1.7 * framingScale : framingScale);
    pedestal.material.color.set(ivory ? 0xbab09a : 0x29261f);
    floor.position.y = pedestal.position.y - 0.069 * framingScale;
    floor.material.opacity = ivory ? 0.13 : 0.14;

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
