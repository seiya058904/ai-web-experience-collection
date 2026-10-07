import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createBook } from './book.js';
import { clamp, mix, smooth } from './timeline.js';

// Whole-object compositions. Materials and local assembly live in book.js.
const POSES = [
  [2.5, -0.15, 1.30, 0.04, -0.28, -0.09],
  [2.62, -0.62, 0.96, -1.02, -0.12, -0.12],
  [2.65, -0.58, 1.02, -1.04, -0.18, -0.12],
  [2.65, -0.15, 1.05, -0.43, -0.46, -0.11],
  [4.25, -0.70, 1.80, 1.20, 0.30, -1.20],
  [2.72, -0.10, 1.29, -0.24, 0.96, -0.17],
  [2.72, -0.10, 1.08, -0.17, -0.32, -0.07],
  [2.72, -0.08, 1.08, 0.23, 0.78, -0.05],
  [2.98, -0.10, 1.40, -0.48, -0.68, -0.22],
  [2.76, -0.12, 1.38, -0.55, -0.74, -0.25],
];

export async function createStage(canvas, { mobile = false, onContextLost } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 70);
  camera.position.set(0, 0, 13.25);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const env = pmrem.fromScene(room, 0.045);
  scene.environment = env.texture;
  scene.environmentIntensity = 0.6;
  room.dispose();
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xfff5df, 3.4);
  key.position.set(-3, 6, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  key.shadow.camera.left = -7; key.shadow.camera.right = 9;
  key.shadow.camera.top = 8; key.shadow.camera.bottom = -8;
  key.shadow.normalBias = 0.003; key.shadow.bias = -0.00002;
  key.shadow.radius = 4;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xe3e8dc, 0.8);
  fill.position.set(7, 0, 5); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xeac68a, 1.8);
  rim.position.set(3, 4, -4); scene.add(rim);
  const ambient = new THREE.HemisphereLight(0xf4eddc, 0x494233, 0.45);
  scene.add(ambient);

  const book = await createBook({ renderer, mobile });
  const object = new THREE.Group(); object.add(book.group); scene.add(object);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(35, 35), new THREE.ShadowMaterial({ opacity: 0.13 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(2.5, -3.55, 0); ground.receiveShadow = true;
  scene.add(ground);

  let w = 1, h = 1, isMobile = mobile, renderCount = 0, dpr = 1;
  const lost = (event) => { event.preventDefault(); onContextLost?.(); };
  canvas.addEventListener('webglcontextlost', lost);
  function resize(width, height, pixelRatio = window.devicePixelRatio || 1) {
    w = width; h = height; isMobile = width < 760;
    // Preserve native DOM type while bounding the spatial surface on large and
    // high-density displays. Flooring in WebGLRenderer keeps the buffer below 4 MP.
    dpr = Math.min(pixelRatio, isMobile ? 1.35 : 1.65, Math.sqrt(4_194_304 / (w * h)));
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = isMobile ? 16.5 : 13.25;
    camera.updateProjectionMatrix();
  }

  function update({ chapter, progress, time = 0, reducedMotion = false, pointer = { x: 0, y: 0 }, open = 0 }) {
    const visibleOpen = chapter === 9 ? open * smooth(0, 0.12, progress) : 0;
    const incoming = Math.min(chapter + 1, 9);
    const transition = smooth(0.81, 1, progress);
    const mobilePose = index => {
      const base = [...POSES[index]];
      base[0] = 0.25; base[1] = -1.28;
      base[2] = [1, 2].includes(index) ? 0.61 : index === 4 ? 1.12 : 0.88;
      if (index === 3) { base[3] = -0.28; base[4] = -0.3; base[5] = -0.03; }
      return base;
    };
    const from = isMobile ? mobilePose(chapter) : POSES[chapter];
    const to = isMobile ? mobilePose(incoming) : POSES[incoming];
    const p = from.map((v, i) => mix(v, to[i], transition));
    const aspectAdjustment = clamp((w / h) / 1.5, 0.75, 1.65);
    object.position.set(p[0] * aspectAdjustment, p[1], 0);
    object.scale.setScalar(p[2]);
    object.rotation.set(p[3], p[4], p[5]);
    if (isMobile) {
      object.position.set(p[0], p[1], 0);
      object.scale.setScalar(p[2] * (h < 620 ? 0.84 : 1));
      if (chapter === 9) {
        object.position.x += visibleOpen * 0.5;
        object.scale.multiplyScalar(mix(1, 0.81, visibleOpen));
        if (h < 700) {
          object.position.y -= visibleOpen * 0.48;
          object.scale.multiplyScalar(mix(1, 0.93, visibleOpen));
        }
      }
    } else if (chapter === 9) {
      object.position.x += visibleOpen * 0.8;
      object.scale.multiplyScalar(mix(1, 0.83, visibleOpen));
    }
    if (!isMobile && h < 650) {
      object.scale.multiplyScalar(0.78);
      object.position.y *= 0.78;
    }
    if (!reducedMotion) {
      object.rotation.y += pointer.x * 0.022;
      object.rotation.x += pointer.y * 0.011;
    }
    key.position.x = -3 + (reducedMotion ? 0 : pointer.x * 1.0 + Math.sin(time * 0.24) * 0.16);
    key.position.y = 6 + (reducedMotion ? 0 : pointer.y * 0.35);
    const dark = [0, 6, 8, 9].includes(chapter);
    scene.environmentIntensity = dark ? 0.65 : 0.34;
    key.intensity = dark ? 3.2 : 2.65;
    fill.intensity = dark ? 0.65 : 0.45;
    const floorY = index => [1, 2].includes(index) ? -2.2 : index === 4 ? -5.25 : -3.58;
    ground.position.y = isMobile ? -3.94 : mix(floorY(chapter), floorY(incoming), transition);
    ground.visible = chapter !== 6;
    const modelChapter = chapter === 6 && progress > 0.86 ? 7 : chapter;
    const modelProgress = modelChapter !== chapter ? 0 : progress;
    book.update({ chapter: modelChapter, progress: modelProgress, time, reducedMotion, mobile: isMobile, open: visibleOpen });
    object.visible = chapter > 0 && (chapter !== 6 || progress > 0.86);
    renderer.render(scene, camera); renderCount++;
  }

  return {
    resize, update, renderer, scene, camera, book,
    diagnostics: () => ({ drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures, dpr, renderCount, ...(typeof book.diagnostics === 'function' ? book.diagnostics() : {}) }),
    dispose() {
      canvas.removeEventListener('webglcontextlost', lost);
      book.dispose(); ground.geometry.dispose(); ground.material.dispose(); key.shadow.dispose(); env.dispose(); renderer.dispose();
    },
  };
}
