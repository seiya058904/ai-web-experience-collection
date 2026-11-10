// The studio: renderer, a built light environment, key and rim lights, the floor and the finishing passes.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// A mirror-smooth surface under a point-like light can return values in the tens of thousands at one
// pixel, which bloom then spreads into a fog. Cap what any surface may return before it is written.
if (!THREE.ShaderChunk.opaque_fragment.includes('fireflies')) {
  THREE.ShaderChunk.opaque_fragment = `outgoingLight = min(outgoingLight, vec3(9.0)); // fireflies
${THREE.ShaderChunk.opaque_fragment}`;
}

const FinishShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uVignette: { value: 0.42 }, uGrain: { value: 0.022 }, uFade: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime; uniform float uVignette; uniform float uGrain; uniform float uFade;
    varying vec2 vUv;
    float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      vec2 q = (vUv - 0.5) * vec2(1.0, 0.86);
      float v = smoothstep(0.78, 0.18, length(q));
      c.rgb *= mix(1.0 - uVignette, 1.0, v);
      c.rgb += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) * uGrain;
      c.rgb *= uFade;
      gl_FragColor = vec4(c.rgb, 1.0);
    }`,
};

/** A photographer's set built from emitters, baked once into the reflection environment. */
function buildEnvironment(renderer) {
  const set = new THREE.Scene();
  const emitter = (w, h, intensity, color, position, lookAt = [0, 0, 0]) => {
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
    mesh.position.set(...position);
    mesh.lookAt(...lookAt);
    set.add(mesh);
  };
  set.add(new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16), new THREE.MeshBasicMaterial({ color: 0x0f1114, side: THREE.BackSide })));
  // Overhead softbox: the broad, even source every metal surface needs.
  emitter(16, 11, 1.55, 0xfff6ea, [0, 13, 1]);
  // Key strip on the camera's left, cool and long, for the drawn highlights along tubes and edges.
  emitter(3.2, 15, 5.2, 0xeaf2ff, [-13, 4, 7]);
  // Warm strip on the right to separate planes.
  emitter(2.2, 12, 3.6, 0xffd9ae, [14, 2.5, 4]);
  // Rim from behind, low and cool.
  emitter(20, 4, 3.0, 0xb9d6ff, [0, 3.5, -15]);
  // A tall panel behind and above. From the usual viewing height this is what the upper surfaces
  // reflect, so it draws the long highlight along the back of the machine.
  emitter(24, 9, 1.15, 0xf4f7ff, [0, 12, -12]);
  // Low front fill so undersides and the interior never go black.
  emitter(14, 4, 0.7, 0xdfe6f0, [0, -4, 14]);
  // A dim floor return.
  emitter(40, 40, 0.11, 0x8c8478, [0, -9, 0], [0, 0, 0]);
  // Small hard accents that give polished parts their sparkle.
  emitter(1.1, 1.1, 7, 0xffffff, [-6, 9, 9]);
  emitter(0.9, 0.9, 5, 0xfff0dc, [8, 8, -3]);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(set, 0.035);
  pmrem.dispose();
  set.traverse((node) => { node.geometry?.dispose(); node.material?.dispose(); });
  return target;
}

const BackdropShader = {
  uniforms: { uInner: { value: new THREE.Color(0x14171b) }, uOuter: { value: new THREE.Color(0x040506) }, uCentre: { value: new THREE.Vector2(0.5, 0.56) }, uAspect: { value: 1 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 1.0, 1.0); }',
  fragmentShader: `
    uniform vec3 uInner; uniform vec3 uOuter; uniform vec2 uCentre; uniform float uAspect; varying vec2 vUv;
    void main(){
      vec2 q = vUv - uCentre; q.x *= max(uAspect, 1.0); q.y *= max(1.0 / uAspect, 1.0);
      float g = smoothstep(0.95, 0.0, length(q));
      gl_FragColor = vec4(mix(uOuter, uInner, g * g), 1.0);
      #include <colorspace_fragment>
    }`,
};

export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false });
  renderer.setClearColor(0x050607, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.localClippingEnabled = true;

  const scene = new THREE.Scene();
  const envTarget = buildEnvironment(renderer);
  scene.environment = envTarget.texture;
  scene.environmentIntensity = 1.0;

  const camera = new THREE.PerspectiveCamera(26, 1, 0.5, 400);

  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ ...BackdropShader, uniforms: THREE.UniformsUtils.clone(BackdropShader.uniforms), depthTest: false, depthWrite: false, toneMapped: false }));
  backdrop.frustumCulled = false;
  backdrop.renderOrder = -1000;
  scene.add(backdrop);

  // Lights ride on a rig that follows the camera's heading: the set stays put while the subject turns.
  const rig = new THREE.Group();
  scene.add(rig);
  const key = new THREE.DirectionalLight(0xfff1df, 1.25);
  key.position.set(-7, 13, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.00035;
  key.shadow.normalBias = 0.012;
  key.shadow.radius = 3.2;
  rig.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x9fc6ff, 1.2);
  rim.position.set(5, 6, -12);
  rig.add(rim, rim.target);
  const kick = new THREE.DirectionalLight(0xffc998, 0.55);
  kick.position.set(10, -3, 5);
  rig.add(kick, kick.target);
  // Fill from beside the camera. It comes up as the machine opens, so separated parts keep their form.
  const fill = new THREE.DirectionalLight(0xe6edf7, 0.25);
  fill.position.set(3, 4, 12);
  rig.add(fill, fill.target);

  // Floor: a pool of light that only exists to catch the shadow.
  const pool = document.createElement('canvas');
  pool.width = pool.height = 256;
  const ctx = pool.getContext('2d');
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.45, '#8a8a8a');
  gradient.addColorStop(1, '#000000');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const poolTexture = new THREE.CanvasTexture(pool);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(19, 64).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x1f2226, roughness: 0.9, metalness: 0, transparent: true, alphaMap: poolTexture, depthWrite: false, envMapIntensity: 0.25 }),
  );
  floor.receiveShadow = true;
  floor.renderOrder = -10;
  scene.add(floor);

  const target = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  const renderPass = new RenderPass(scene, camera);
  const bloom = new UnrealBloomPass(new THREE.Vector2(4, 4), 0.11, 0.42, 1.2);
  const output = new OutputPass();
  const finish = new ShaderPass(FinishShader);
  composer.addPass(renderPass);
  composer.addPass(bloom);
  composer.addPass(output);
  composer.addPass(finish);

  const state = { width: 1, height: 1, dpr: 1, scale: 1, tier: 'high', shadowSpan: 0 };

  function pickTier() {
    const coarse = matchMedia('(pointer: coarse)').matches;
    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 4;
    if (coarse && (cores <= 4 || memory <= 3)) return 'low';
    if (coarse || cores <= 4) return 'mid';
    return 'high';
  }
  state.tier = pickTier();

  function applySize() {
    const cap = state.tier === 'high' ? 2 : state.tier === 'mid' ? 1.5 : 1.25;
    const budget = state.tier === 'high' ? 5.2e6 : state.tier === 'mid' ? 3.2e6 : 2e6;
    let dpr = Math.min(window.devicePixelRatio || 1, cap) * state.scale;
    const pixels = state.width * state.height * dpr * dpr;
    if (pixels > budget) dpr *= Math.sqrt(budget / pixels);
    state.dpr = dpr;
    renderer.setPixelRatio(dpr);
    renderer.setSize(state.width, state.height, false);
    composer.setPixelRatio(dpr);
    composer.setSize(state.width, state.height);
    bloom.enabled = state.tier !== 'low';
    backdrop.material.uniforms.uAspect.value = state.width / state.height;
  }

  function resize(width, height) {
    state.width = Math.max(1, width);
    state.height = Math.max(1, height);
    camera.aspect = state.width / state.height;
    applySize();
  }

  // Frame-time governor: shed resolution when frames run long, win it back when there is headroom.
  // Shedding is a trial. If frames do not get shorter, the pace is being set by the display or the
  // browser rather than by this page, so the resolution is restored and left alone.
  const governor = { samples: 0, total: 0, hold: 0, trial: null, locked: false };
  function govern(delta) {
    if (delta > 0.25) return;
    governor.total += delta; governor.samples += 1;
    if (governor.samples < 45) return;
    const average = governor.total / governor.samples;
    governor.total = 0; governor.samples = 0;
    if (governor.trial) {
      if (average > governor.trial.average * 0.9) {
        state.scale = governor.trial.scale;
        governor.locked = true;
        applySize();
      }
      governor.trial = null; governor.hold = 2;
      return;
    }
    if (governor.hold > 0) { governor.hold -= 1; return; }
    if (!governor.locked && average > 1 / 44 && state.scale > 0.55) {
      governor.trial = { average, scale: state.scale };
      state.scale = Math.max(0.55, state.scale - 0.15);
      applySize();
    } else if (average < 1 / 57 && state.scale < 1) {
      state.scale = Math.min(1, state.scale + 0.05);
      applySize(); governor.hold = 4;
    }
  }

  /** Keep the shadow map tight around the machine as it opens. */
  function setShadowSpan(span, centre) {
    if (Math.abs(span - state.shadowSpan) > 0.05) {
      state.shadowSpan = span;
      const c = key.shadow.camera;
      c.left = -span; c.right = span; c.top = span; c.bottom = -span;
      c.near = 1; c.far = 60;
      c.updateProjectionMatrix();
    }
    key.target.position.copy(centre);
    rim.target.position.copy(centre);
    kick.target.position.copy(centre);
    rig.worldToLocal(key.target.position);
    rig.worldToLocal(rim.target.position);
    rig.worldToLocal(kick.target.position);
    fill.target.position.copy(key.target.position);
    key.position.copy(key.target.position).add(_keyOffset);
  }
  const _keyOffset = new THREE.Vector3(-7, 13, 8).setLength(24);

  /** More fill and a little more environment as parts separate. */
  function setOpen(amount) {
    fill.intensity = 0.25 + 0.75 * amount;
    scene.environmentIntensity = 1 + 0.35 * amount;
  }

  /** Turn the set to follow the camera's heading. */
  function setHeading(azimuth) {
    rig.rotation.y = -azimuth + Math.PI / 2;
    scene.environmentRotation.y = -azimuth + Math.PI / 2;
  }

  renderer.info.autoReset = false;
  function render(time, delta) {
    renderer.info.reset();
    finish.uniforms.uTime.value = time;
    composer.render(delta);
  }

  function dispose() {
    composer.dispose();
    target.dispose();
    envTarget.dispose();
    poolTexture.dispose();
    renderer.dispose();
  }

  return { renderer, scene, camera, floor, backdrop, key, bloom, finish, state, resize, govern, setShadowSpan, setHeading, setOpen, render, dispose };
}
