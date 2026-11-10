import './style.css';
import * as THREE from 'three';
import { createStage } from './stage.js';
import { createMaterials, litVariant, pulseLit, syncLit } from './materials.js';
import { buildAnax } from './model/index.js';
import { createRig } from './rig.js';
import { createLabels } from './labels.js';
import { COMPONENTS, COMPONENT_BY_ID } from './parts.js';
import { STAGES } from './spec.js';
import { clamp, lerp, smooth, crankSpeed, journeyProgress, journeyTime } from './kinematics.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const life = new AbortController();
const on = (target, type, handler, options = {}) => target.addEventListener(type, handler, { ...options, signal: life.signal });
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const canvas = $('#scene');

const JOURNEY_SECONDS = 10.5;

function start() {
  let stage;
  try {
    stage = createStage(canvas);
  } catch (error) {
    document.documentElement.classList.add('no-webgl');
    $('#veil').hidden = true;
    return;
  }
  const { scene, camera, renderer } = stage;
  const M = createMaterials();
  const model = buildAnax(M);
  model.measure();
  scene.add(model.root);

  const rig = createRig(camera, canvas, { reducedMotion: reduced.matches });
  const state = {
    target: 0, shown: 0, velocity: 0, journey: null,
    theta: 0.4, running: !reduced.matches, run: reduced.matches ? 0 : 1,
    shell: 'solid', ghost: 0, cut: 0, shellCast: true,
    labels: true, selected: null, hovered: null,
    time: 0, fade: 0, dirty: 90, disposed: false,
  };

  // ---- interface ---------------------------------------------------------------------------------
  const ui = {
    play: $('#play'), playLabel: $('#play span'), slider: $('#progress'), readout: $('#readout'), stageName: $('#stage-name'),
    stageMarks: $$('.stages li'), motion: $('#motion'), labels: $('#labels-toggle'), reset: $('#reset'),
    card: $('#card'), index: $('#index-list'), indexToggle: $('#index-toggle'), indexPanel: $('#index'),
    hint: $('#hint'), notes: $('#notes'), layer: $('#callouts'),
  };

  for (const component of COMPONENTS) {
    const item = document.createElement('li');
    item.innerHTML = `<button type="button" data-id="${component.id}"><b>${component.number}</b><span>${component.name}</span></button>`;
    ui.index.append(item);
  }
  const indexButtons = new Map($$('#index-list button').map((button) => [button.dataset.id, button]));

  // ---- selection and highlight -------------------------------------------------------------------
  const pickables = [];
  model.root.traverse((node) => { if (node.isMesh && node.userData.comp) pickables.push(node); });
  const sphere = new THREE.Sphere();
  // Parts that sit inside the closed shell cast no shadow until something can see them.
  const INSIDE = new Set(['frame', 'loom', 'crank', 'rod', 'motor', 'core', 'spine', 'cells']);
  const inside = pickables.filter((mesh) => INSIDE.has(mesh.userData.comp) && mesh.castShadow);
  let insideCast = true;
  function setInsideCast(cast) {
    if (cast === insideCast) return;
    insideCast = cast;
    for (const mesh of inside) mesh.castShadow = cast;
  }

  function paint(id) {
    if (!id) return;
    const kind = id === state.selected ? 'select' : id === state.hovered ? 'hover' : null;
    for (const mesh of model.comps.get(id).meshes) mesh.material = kind ? litVariant(mesh.userData.base, kind) : mesh.userData.base;
    state.dirty = Math.max(state.dirty, 20);
  }

  function setHover(id) {
    if (id === state.hovered) return;
    const previous = state.hovered;
    state.hovered = id;
    paint(previous); paint(id);
    canvas.style.cursor = id ? 'pointer' : '';
    for (const [key, button] of indexButtons) button.classList.toggle('is-hot', key === id);
  }

  function select(id, { focus = true } = {}) {
    if (id === state.selected) {
      if (id && focus) aimAt(id);
      return;
    }
    const previous = state.selected;
    state.selected = id;
    paint(previous); paint(id);
    for (const [key, button] of indexButtons) {
      if (key === id) button.setAttribute('aria-current', 'true'); else button.removeAttribute('aria-current');
    }
    showCard(id);
    if (id && focus) aimAt(id); else if (!id) rig.clearFocus();
    layout();
  }

  function aimAt(id) {
    const component = COMPONENT_BY_ID.get(id);
    if (!model.boundsOf(id, sphere)) return;
    // A part is shown in its setting: close enough to read, never so close that its neighbours are lost.
    const reach = rig.portrait ? Math.max(1.5, sphere.radius * 2.3) : Math.max(1.05, sphere.radius * 1.9);
    rig.focusOn(sphere.center, reach, rig.portrait ? { az: component.view.az * 0.6, pol: Math.min(component.view.pol, 1.05) } : component.view);
  }

  let cardTimer = 0;
  function showCard(id) {
    clearTimeout(cardTimer);
    const card = ui.card;
    if (!id) {
      card.classList.remove('is-open');
      cardTimer = setTimeout(() => { card.hidden = true; }, 420);
      return;
    }
    const component = COMPONENT_BY_ID.get(id);
    const fill = () => {
      card.querySelector('[data-card="number"]').textContent = component.number;
      card.querySelector('[data-card="role"]').textContent = component.role;
      card.querySelector('[data-card="name"]').textContent = component.name;
      card.querySelector('[data-card="text"]').textContent = component.text;
      card.querySelector('[data-card="specs"]').innerHTML = component.specs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
      card.classList.add('is-open');
    };
    if (card.hidden || !card.classList.contains('is-open')) {
      card.hidden = false;
      // Next frame, so the opening transition has a starting state.
      requestAnimationFrame(fill);
    } else {
      // Already open: let the words leave and return rather than change in place.
      card.classList.add('is-swapping');
      cardTimer = setTimeout(() => { fill(); card.classList.remove('is-swapping'); }, reduced.matches ? 0 : 200);
    }
  }

  // ---- picking -----------------------------------------------------------------------------------
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const clip = new THREE.Plane();
  const clipList = [clip];
  const seeThrough = (mesh, point) => {
    const base = mesh.userData.base;
    if (!base.userData.shell) return false;
    if (state.ghost > 0.5) return true;
    return state.cut > 0.02 && clip.distanceToPoint(point) < 0;
  };
  const clearToLight = (mesh, point) => seeThrough(mesh, point) || (mesh.userData.base.transparent && mesh.userData.base.opacity < 0.5);

  function pick(point) {
    ndc.set((point.x / stage.state.width) * 2 - 1, -(point.y / stage.state.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    for (const hit of raycaster.intersectObjects(pickables, false)) {
      if (!seeThrough(hit.object, hit.point)) return hit.object.userData.comp;
    }
    return null;
  }

  let hoverPoint = null;
  let hoverPending = false;
  rig.on('tap', (point) => select(pick(point)));
  rig.on('hover', (point) => { hoverPoint = point; hoverPending = true; });
  rig.on('input', () => {
    ui.hint.classList.add('is-gone');
    if (ui.indexPanel.classList.contains('is-open')) setIndexOpen(false);
    state.dirty = Math.max(state.dirty, 10);
  });

  on(ui.index, 'click', (event) => {
    const button = event.target.closest('button[data-id]');
    if (!button) return;
    select(button.dataset.id === state.selected ? null : button.dataset.id);
    if (matchMedia('(max-width: 900px)').matches) setIndexOpen(false);
  });
  on(ui.index, 'pointerover', (event) => {
    const button = event.target.closest('button[data-id]');
    if (button && event.pointerType === 'mouse') setHover(button.dataset.id);
  });
  on(ui.index, 'pointerleave', () => setHover(null));
  on($('#card-close'), 'click', () => select(null));

  function setIndexOpen(open) {
    ui.indexPanel.classList.toggle('is-open', open);
    ui.indexToggle.setAttribute('aria-expanded', String(open));
    layout();
  }
  on(ui.indexToggle, 'click', () => setIndexOpen(!ui.indexPanel.classList.contains('is-open')));

  // ---- disassembly -------------------------------------------------------------------------------
  function nextDirection() {
    if (state.journey) return -state.journey.dir;
    return state.target < 0.5 ? 1 : -1;
  }
  function syncPlay() {
    const dir = nextDirection();
    ui.playLabel.textContent = dir > 0 ? 'Disassemble' : 'Assemble';
    ui.play.classList.toggle('is-reverse', dir < 0);
  }
  function toggleJourney() {
    const dir = nextDirection();
    ui.hint.classList.add('is-gone');
    if (reduced.matches) {
      // No travel for those who asked for none: dip to black, change, return.
      state.journey = null;
      state.fadeDip = 1;
      state.pendingTarget = dir > 0 ? 1 : 0;
    } else {
      state.journey = { t: journeyTime(state.target), dir };
    }
    syncPlay();
  }
  on(ui.play, 'click', toggleJourney);
  on(ui.slider, 'input', () => {
    state.journey = null;
    state.target = Number(ui.slider.value) / 1000;
    syncPlay();
  });
  for (const mark of ui.stageMarks) {
    on(mark.querySelector('button'), 'click', () => {
      state.journey = null;
      state.target = Number(mark.dataset.to);
      ui.slider.value = String(Math.round(state.target * 1000));
      if (reduced.matches) { state.shown = state.target; state.velocity = 0; }
      syncPlay();
    });
  }

  let lastPercent = -1;
  let lastStage = '';
  function syncReadout() {
    const percent = Math.round(state.shown * 100);
    if (percent !== lastPercent) {
      lastPercent = percent;
      ui.readout.textContent = String(percent).padStart(3, '0');
    }
    const current = state.shown < 0.004 ? null : STAGES.find((s) => state.shown <= s.to + 1e-6) ?? STAGES[STAGES.length - 1];
    const name = current ? current.label : 'Assembled';
    if (name !== lastStage) {
      lastStage = name;
      ui.stageName.textContent = name;
      ui.stageMarks.forEach((mark) => mark.classList.toggle('is-current', mark.dataset.id === current?.id));
      ui.slider.setAttribute('aria-valuetext', `${percent} percent, ${name}`);
    }
    ui.slider.style.setProperty('--fill', `${(state.shown * 100).toFixed(2)}%`);
  }

  // ---- shell modes -------------------------------------------------------------------------------
  for (const input of $$('input[name="shell"]')) {
    on(input, 'change', () => { if (input.checked) { state.shell = input.value; state.dirty = 120; } });
  }
  let cutActive = false;
  let ghostActive = false;
  function applyShell(delta) {
    const ghostGoal = state.shell === 'glass' ? 1 : 0;
    const cutGoal = state.shell === 'section' ? 1 : 0;
    const k = reduced.matches ? 1 : 1 - Math.exp(-delta * 4.5);
    const before = state.ghost + state.cut;
    state.ghost += (ghostGoal - state.ghost) * k;
    state.cut += (cutGoal - state.cut) * k;
    if (Math.abs(ghostGoal - state.ghost) < 0.002) state.ghost = ghostGoal;
    if (Math.abs(cutGoal - state.cut) < 0.002) state.cut = cutGoal;
    const moving = Math.abs(state.ghost + state.cut - before) > 1e-5;

    // Section: a plane sweeps in from the right flank to the centre line and stops there.
    clip.set(new THREE.Vector3(0, 0, -1), lerp(1.25, 0.0, smooth(0, 1, state.cut)));
    clip.applyMatrix4(model.body.matrixWorld);
    const wantCut = state.cut > 0.001;
    const wantGhost = state.ghost > 0.001;
    const flip = wantCut !== cutActive || wantGhost !== ghostActive;
    cutActive = wantCut; ghostActive = wantGhost;
    if (!moving && !flip) return moving;
    for (const material of M.shellList) {
      material.opacity = lerp(1, 0.05, state.ghost);
      material.userData.uniforms.uSpecAlpha.value = state.ghost * 0.9;
      material.depthWrite = state.ghost < 0.5;
      if (flip) {
        material.transparent = wantGhost;
        material.clippingPlanes = wantCut ? clipList : null;
        material.clipShadows = true;
        material.needsUpdate = true;
      }
      syncLit(material);
    }
    const cast = state.ghost < 0.5;
    if (cast !== state.shellCast) {
      state.shellCast = cast;
      for (const mesh of pickables) if (mesh.userData.base.userData.shell) mesh.castShadow = cast;
    }
    return true;
  }

  // ---- small controls ----------------------------------------------------------------------------
  function setMotion(running) {
    state.running = running;
    ui.motion.setAttribute('aria-pressed', String(running));
  }
  on(ui.motion, 'click', () => setMotion(!state.running));
  on(ui.labels, 'click', () => {
    state.labels = !state.labels;
    ui.labels.setAttribute('aria-pressed', String(state.labels));
    state.dirty = 60;
  });
  on(ui.reset, 'click', () => { select(null); rig.reset(); });
  setMotion(state.running);

  on($('#notes-open'), 'click', () => ui.notes.showModal());
  on($('#notes-close'), 'click', () => ui.notes.close());
  on(ui.notes, 'click', (event) => { if (event.target === ui.notes) ui.notes.close(); });

  on(window, 'keydown', (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || ui.notes.open) return;
    const tag = event.target.tagName;
    const field = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    if (event.key === 'Escape') { if (state.selected) select(null); else if (ui.indexPanel.classList.contains('is-open')) setIndexOpen(false); return; }
    if (field) return;
    if (event.key === ' ') {
      // On a focused control, Space belongs to that control.
      if (tag === 'BUTTON' || tag === 'A') return;
      event.preventDefault(); toggleJourney();
    }
    else if (event.key === 'r' || event.key === 'R') { select(null); rig.reset(); }
    else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      state.journey = null;
      state.target = clamp(state.target + (event.key === 'ArrowRight' ? 0.02 : -0.02));
      ui.slider.value = String(Math.round(state.target * 1000));
      syncPlay();
    }
  });

  // ---- layout ------------------------------------------------------------------------------------
  const labels = createLabels(ui.layer, COMPONENTS, { onPick: (id) => select(id) });
  const safe = { left: 8, right: 8, top: 64, bottom: 150 };
  function layout() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const narrow = width <= 900;
    const deck = $('.deck').getBoundingClientRect();
    document.documentElement.style.setProperty('--deck', `${Math.round(height - deck.top)}px`);
    const cardOpen = Boolean(state.selected);
    const indexWide = !narrow && getComputedStyle(ui.indexPanel).display !== 'none';
    const cardRect = ui.card.getBoundingClientRect();
    safe.left = indexWide ? ui.indexPanel.getBoundingClientRect().right + 12 : 8;
    safe.right = !narrow && cardOpen ? Math.max(8, width - cardRect.left + 12) : 8;
    safe.top = 64;
    safe.bottom = height - deck.top + (narrow && cardOpen ? cardRect.height + 8 : 8);
    // Centre the machine in the space the panels leave.
    const shiftX = narrow ? 0 : ((indexWide ? 150 : 0) - (cardOpen ? 300 : 0)) * 0.5;
    const occupied = height - deck.top + (narrow && cardOpen ? Math.min(cardRect.height, height * 0.3) : 0);
    rig.setShift(shiftX, -(occupied - 56) * 0.5);
    state.dirty = Math.max(state.dirty, 60);
  }

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    stage.resize(width, height);
    rig.setViewport(width, height);
    labels.measure();
    layout();
  }
  on(window, 'resize', resize);
  on(window, 'orientationchange', resize);
  document.fonts?.ready.then(() => { if (!state.disposed) { labels.measure(); layout(); } });

  // ---- the frame ---------------------------------------------------------------------------------
  let last = 0;
  let raf = 0;
  const frameCentre = new THREE.Vector3();

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (document.hidden) { last = 0; return; }
    const delta = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    const began = import.meta.env.DEV ? performance.now() : 0;
    state.time += delta;

    // Progress. A press of the button runs the timed journey; the slider sets a target directly.
    // Either way the displayed progress follows through a critically damped spring, so every
    // change of mind (stop, drag, reverse) keeps its momentum and never steps.
    if (state.fadeDip) {
      state.fadeDip = Math.max(0, state.fadeDip - delta / 0.36);
      if (state.fadeDip < 0.5 && state.pendingTarget !== undefined) {
        state.target = state.shown = state.pendingTarget;
        state.velocity = 0; state.pendingTarget = undefined;
        ui.slider.value = String(Math.round(state.target * 1000));
        syncPlay();
      }
    }
    if (state.journey) {
      state.journey.t = clamp(state.journey.t + (state.journey.dir * delta) / JOURNEY_SECONDS);
      state.target = journeyProgress(state.journey.t);
      ui.slider.value = String(Math.round(state.target * 1000));
      if (state.journey.t <= 0 || state.journey.t >= 1) { state.journey = null; syncPlay(); }
    }
    const before = state.shown;
    if (reduced.matches) {
      state.shown = state.target;
    } else {
      const w = 9.5;
      state.velocity += (w * w * (state.target - state.shown) - 2 * w * state.velocity) * delta;
      state.shown += state.velocity * delta;
      if (Math.abs(state.target - state.shown) < 2e-5 && Math.abs(state.velocity) < 2e-4) { state.shown = state.target; state.velocity = 0; }
      if (state.shown <= 0) { state.shown = 0; if (state.velocity < 0) state.velocity = 0; }
      if (state.shown >= 1) { state.shown = 1; if (state.velocity > 0) state.velocity = 0; }
    }
    const p = state.shown;
    const progressing = p !== before;
    model.setProgress(p);

    // Mechanism.
    state.run += ((state.running ? 1 : 0) - state.run) * (1 - Math.exp(-delta * 3.2));
    if (state.run < 0.001 && !state.running) state.run = 0;
    const omega = crankSpeed(p) * state.run;
    state.theta += omega * delta;
    model.animate({ theta: state.theta, omega, time: state.time, delta, p, still: state.run === 0 });

    // Framing follows the size of the machine at this stage of opening.
    const view = model.frameAt(p);
    frameCentre.copy(view.centre);
    rig.setFrame(frameCentre, view.radius * (rig.portrait ? 0.96 : lerp(0.8, 0.9, smooth(0.1, 0.6, p))));
    stage.setOpen(smooth(0.05, 0.6, p));
    const cameraMoving = rig.update(delta, { idleTurn: state.running });
    stage.setHeading(rig.azimuth);
    stage.floor.position.set(frameCentre.x, view.low - 1.35, frameCentre.z);
    stage.setShadowSpan(view.radius * 1.12 + 0.8, frameCentre);

    model.root.updateMatrixWorld(true);
    model.updateGuides(p);
    const shellMoving = applyShell(delta);
    setInsideCast(p > 0.004 || state.ghost > 0.02 || state.cut > 0.02);

    if (hoverPending) {
      hoverPending = false;
      setHover(hoverPoint && !rig.introActive ? pick(hoverPoint) : null);
    }
    if (state.selected && model.boundsOf(state.selected, sphere)) rig.focus.centre.copy(sphere.center);
    pulseLit(state.time);

    labels.update({
      model, camera, width: stage.state.width, height: stage.state.height, progress: p, enabled: state.labels && state.fade > 0.9 && !rig.introActive,
      selected: state.selected, targets: pickables, ignore: clearToLight, delta, safe,
    });

    const fadeGoal = state.fadeDip ? 1 - Math.sin(state.fadeDip * Math.PI) : 1;
    state.fade += (fadeGoal - state.fade) * (state.fadeDip ? 1 : 1 - Math.exp(-delta * 1.6));
    if (state.fade > 0.999) state.fade = 1;
    stage.finish.uniforms.uFade.value = state.fade;

    syncReadout();
    const busy = state.run > 0 || progressing || cameraMoving || shellMoving || state.selected || state.fade < 1 || state.dirty > 0;
    if (state.dirty > 0) state.dirty -= 1;
    if (busy) {
      stage.render(state.time, delta);
      if (state.run > 0 || cameraMoving || progressing) stage.govern(delta);
    }
    if (import.meta.env.DEV) state.cpu = (state.cpu ?? 0) * 0.9 + (performance.now() - began) * 0.1;
  }

  // ---- go ----------------------------------------------------------------------------------------
  resize();
  rig.startIntro();
  syncPlay();
  syncReadout();
  model.setProgress(0);
  model.animate({ theta: state.theta, omega: 0, time: 0, delta: 0, p: 0, still: true });
  renderer.compile(scene, camera);
  requestAnimationFrame(() => {
    $('#veil').classList.add('is-gone');
    document.documentElement.classList.add('is-live');
    raf = requestAnimationFrame(frame);
  });

  on(document, 'visibilitychange', () => { last = 0; state.dirty = 30; });
  on(canvas, 'webglcontextlost', (event) => { event.preventDefault(); cancelAnimationFrame(raf); });
  on(canvas, 'webglcontextrestored', () => { last = 0; state.dirty = 120; raf = requestAnimationFrame(frame); });

  function dispose() {
    if (state.disposed) return;
    state.disposed = true;
    cancelAnimationFrame(raf);
    life.abort();
    rig.dispose();
    model.root.traverse((node) => { node.geometry?.dispose(); });
    stage.dispose();
  }
  if (import.meta.hot) import.meta.hot.dispose(dispose);
  if (import.meta.env.DEV) window.__anax = { state, rig, model, stage, select, M };
}

// Let the loading mark paint before the model is built.
requestAnimationFrame(() => requestAnimationFrame(() => {
  try {
    start();
  } catch (error) {
    if (import.meta.env.DEV) window.__err = String(error?.stack || error);
    throw error;
  }
}));
