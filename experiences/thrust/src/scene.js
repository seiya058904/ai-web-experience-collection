import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createEngine } from './engine.js';
import { createFlow } from './flow.js';
import { createBlade } from './blade.js';
import { createAircraft } from './flight.js';
import { sampleShot, smooth, lerp, mobileRoll } from './story.js';

export function createWorld(container, { mobile = false, onContextLost, onContextRestored } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x060b10, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .95;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, .025, 1300);
  function buildEnvironment() {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    try { return pmrem.fromScene(room, .025); }
    finally { room.dispose(); pmrem.dispose(); }
  }
  let environment = buildEnvironment();
  scene.environment = environment.texture;
  scene.environmentIntensity = .70;

  const hemi = new THREE.HemisphereLight('#d3e7f2', '#101820', .35);
  const key = new THREE.DirectionalLight('#f1f3f3', 2.0); key.position.set(-5, 7, -4);
  const fill = new THREE.DirectionalLight('#a9d8f0', .65); fill.position.set(5, 2, -3);
  const rim = new THREE.DirectionalLight('#d5eeff', 2.2); rim.position.set(-2, 5, 12);
  const side = new THREE.DirectionalLight('#f4ddc9', .6); side.position.set(-8, -1, 4);
  const combustionLight = new THREE.PointLight('#ffad62', 0, 5, 1.4); combustionLight.position.set(-.1, .8, 6.8);
  scene.add(hemi, key, fill, rim, side, combustionLight);

  const engine = createEngine({ quality: mobile ? 'medium' : 'high' });
  const flow = createFlow({ mobile });
  const blade = createBlade();
  const aircraft = createAircraft();
  const machine = new THREE.Group();
  machine.add(engine.group, flow.group);
  scene.add(machine, blade.group, aircraft.group);
  blade.group.position.set(1.4, 0, 8.2);
  blade.group.rotation.set(0, -.12, -.14);
  const aircraftScale = 1 / aircraft.engineScale;
  aircraft.group.scale.setScalar(aircraftScale);
  aircraft.group.position.copy(aircraft.engineMount).multiplyScalar(-aircraftScale);

  // A precision axis becomes the mechanical-energy handoff; it is distinct from the air path.
  const energyGeometry = new THREE.BufferGeometry();
  const energyPoints = new Float32Array(64 * 3);
  const energyColors = new Float32Array(64 * 3);
  for (let i = 0; i < 64; i++) {
    const hp = i % 2 === 1;
    energyPoints[i * 3] = hp ? .248 : .123; energyPoints[i * 3 + 1] = .014; energyPoints[i * 3 + 2] = .5 + i / 63 * 10.1;
    energyColors.set(hp ? [1,.59,.26] : [.39,.85,.99],i*3);
  }
  energyGeometry.setAttribute('position', new THREE.BufferAttribute(energyPoints, 3));
  energyGeometry.setAttribute('color',new THREE.BufferAttribute(energyColors,3));
  const energyMaterial = new THREE.PointsMaterial({ vertexColors:true, size:.045, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending });
  const energyTrace = new THREE.Points(energyGeometry, energyMaterial); machine.add(energyTrace);

  let width = 0, height = 0, highQuality = false, performanceScale = 1, lost = false;
  let frameCount = 0, renderTotal = 0;
  const look = new THREE.Vector3();
  function resize(detail = highQuality) {
    highQuality = detail;
    width = Math.max(1, container.clientWidth); height = Math.max(1, container.clientHeight);
    mobile = width <= 700;
    const budget = (highQuality ? 5.3e6 : 3.2e6) * performanceScale;
    const dpr = Math.min(window.devicePixelRatio || 1, highQuality ? 2 : mobile ? 1.5 : 1.35, Math.sqrt(budget / (width * height)));
    renderer.setPixelRatio(Math.max(.6, dpr)); renderer.setSize(width, height, false);
    camera.aspect = width / height; camera.updateProjectionMatrix();
  }
  resize();
  function render(time, state, { inspectAngle = 0, bladeCut = null, staticShot = false } = {}) {
    if (lost) return;
    const start = performance.now();
    const p = state.p;
    const shotP = staticShot ? Math.min(9.999, state.index + (state.index === 1 ? .28 : .53)) : p;
    const shot = sampleShot(shotP, mobile);
    camera.position.fromArray(shot.pos);
    look.fromArray(shot.target);
    camera.fov = shot.fov;
    camera.lookAt(look);
    if (mobile) camera.rotateZ(mobileRoll(shotP));
    camera.updateProjectionMatrix();
    engine.group.visible = state.blade < .98;
    flow.group.visible = state.blade < .84 && state.flow > .005;
    blade.group.visible = state.blade > .01;
    const bladeScale = lerp(.075, 1.55, state.blade);
    blade.group.scale.setScalar(bladeScale);
    // The macro grows out of, and returns to, the first high-pressure rotor.
    blade.group.position.set(lerp(.566,1.4,state.blade),lerp(.566,0,state.blade),lerp(7.9,8.2,state.blade));
    blade.group.rotation.y = -.12 + inspectAngle * .8 * (1-smooth(6.76,6.98,p));
    blade.group.rotation.z = lerp(-Math.PI/4,-.14,state.blade);
    engine.update(time, { ...state, focus: state.index });
    flow.update(time, { progress: p / 10, heat: state.heat, explode: state.explode, intensity: state.flow * (1 - state.blade), focus: state.index === 3 || state.index === 4 ? 'core' : '' });
    blade.update(time, { reveal: state.blade, cut: bladeCut ?? state.bladeCut });
    // Orbit around the axis of the entire assembly, not independently around each part.
    machine.rotation.y = state.index === 7 ? inspectAngle * .38 * (1-smooth(7.74,7.98,p)) : 0;
    machine.rotation.z = 0;
    aircraft.group.visible = state.aircraft > .001;
    aircraft.update(time, { reveal: state.aircraft });
    energyMaterial.opacity = state.energy * .8;
    for (let i = 0; i < 64; i++) {
      const hp = i % 2 === 1, span = hp ? 5.70 : 10.55, startZ = hp ? 2.50 : -.10;
      energyPoints[i * 3 + 2] = startZ + ((span+i/63*span-(time*1.45)%span)%span);
    }
    energyGeometry.attributes.position.needsUpdate = state.energy > 0;
    combustionLight.intensity = state.heat * (state.index === 4 ? 2.0 : .75);
    hemi.intensity = lerp(.35, .42, state.sky);
    key.intensity = lerp(2.0, 2.25, state.sky);
    side.intensity = lerp(.6, .25, state.sky);
    fill.intensity = lerp(.65, .17, state.sky);
    rim.intensity = lerp(2.2, .35, state.sky);
    scene.environmentIntensity = lerp(.70, .5, state.sky);
    renderer.toneMappingExposure = lerp(.95, .84, state.sky);
    renderer.render(scene, camera);
    frameCount++; renderTotal += performance.now() - start;
    // Bounded one-step adaptation, avoiding recurring resolution oscillation.
    if (frameCount === 100 && !highQuality && renderTotal / frameCount > 28) { performanceScale = .72; resize(); }
    container.dataset.ready = 'true';
  }
  const lossHandler = event => { event.preventDefault(); lost = true; onContextLost?.(); };
  const restoreHandler = () => {
    // Render-target textures have no CPU pixel backup after context loss.
    // Re-bake the studio so restored metal keeps its original reflections.
    const replacement = buildEnvironment();
    const previous = environment;
    environment = replacement; scene.environment = replacement.texture;
    previous.dispose(); resize(); lost = false; onContextRestored?.();
  };
  renderer.domElement.addEventListener('webglcontextlost', lossHandler);
  renderer.domElement.addEventListener('webglcontextrestored', restoreHandler);
  return {
    render, resize,
    get canvas() { return renderer.domElement; },
    get stats() { return { ...engine.stats, drawCalls: renderer.info.render.calls, renderedTriangles: renderer.info.render.triangles, width: renderer.domElement.width, height: renderer.domElement.height }; },
    dispose() {
      renderer.domElement.removeEventListener('webglcontextlost', lossHandler);
      renderer.domElement.removeEventListener('webglcontextrestored', restoreHandler);
      engine.dispose(); flow.dispose(); blade.dispose(); aircraft.dispose();
      energyGeometry.dispose(); energyMaterial.dispose(); environment.dispose();
      renderer.dispose(); renderer.domElement.remove();
    },
  };
}
