import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import 'lenis/dist/lenis.css';
import { MaterialEngine } from './material-engine.js';
import { PaperTheatre } from './paper-theatre.js';
import './paper-theatre.css';

gsap.registerPlugin(ScrollTrigger);

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const mix = (a, b, t) => a + (b - a) * t;
const ease = (a, b, value) => {
  const t = clamp((value - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const pad = (n) => String(n).padStart(2, '0');
const chapters = ['Water', 'Ink', 'Paper', 'Trace', 'Fiber', 'Space', 'Mark', 'Inkscape'];
const chapterIds = ['water', 'ink', 'paper', 'trace', 'fiber', 'space', 'mark', 'inkscape'];
const historyKey = '__inkscape';
const root = document.documentElement;
const journey = document.querySelector('#journey');
const stage = document.querySelector('#stage');
const scenes = [...document.querySelectorAll('.scene')];
const bloom = document.querySelector('#ink-presence');
const lens = document.querySelector('#fiber-lens');
const lensImage = lens.querySelector('.fiber-lens-image');
const progressLine = document.querySelector('.bottom-progress span');
const foldLight = document.querySelector('.fold-light');
const indexDialog = document.querySelector('#index-dialog');
const aboutDialog = document.querySelector('#about-dialog');
const motionButton = document.querySelector('#motion-toggle');
const previousButton = document.querySelector('#previous');
const nextButton = document.querySelector('#next');
const impressions = document.querySelector('#impressions');
const markStatus = document.querySelector('#mark-status');
const makeMarkButton = document.querySelector('#make-mark');
const clearMarksButton = document.querySelector('#clear-marks');
const mediaMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
// CSS custom properties resolve relative URLs at the consuming stylesheet.
// Absolute, document-based URLs keep these same-origin textures portable when
// the compiled stylesheet lives in assets/ or the work is opened in a subfolder.
const assetURL = (name) => new URL(`${import.meta.env.BASE_URL}inkscape/art/${name}`, document.baseURI).href;

const state = {
  position: 0,
  active: -1,
  width: window.innerWidth,
  height: window.innerHeight,
  range: 1,
  time: 0,
  wetness: 0.28,
  magnified: false,
  pointer: { x: 0.5, y: 0.5 },
  marks: 0,
  markSequence: 0,
  markEnabled: false,
  reduced: mediaMotion.matches,
  motionChoice: null,
  hidden: document.hidden,
  dirty: true,
};

let lenis;
let scrollTrigger;
let engine;
let theatre;
let resizeTimer;
let modalScroll = null;
let lastPaint = 0;
let dialogReturnFocus;
let historyReady = false;
let restoringHistory = false;
let historyRestoreFrame = 0;
let pendingHistoryPosition = null;
let lastHistoryCheck = 0;
let disposed = false;
let ticking = false;
let warmIdle = 0;
let warmTimer = 0;
const assets = {};

const tick = (_time, delta) => draw(delta);
function startTicker() {
  if (disposed || state.hidden || ticking) return;
  gsap.ticker.add(tick);
  ticking = true;
}
function stopTicker() {
  gsap.ticker.remove(tick);
  ticking = false;
}
function dispose() {
  if (disposed) return;
  disposed = true;
  stopTicker();
  clearTimeout(resizeTimer);
  clearTimeout(warmTimer);
  if (warmIdle) window.cancelIdleCallback(warmIdle);
  if (historyRestoreFrame) cancelAnimationFrame(historyRestoreFrame);
  gsap.killTweensOf('.impression');
  lenis?.destroy();
  scrollTrigger?.kill();
  engine?.destroy();
  theatre?.destroy();
}

function historyPath(url = window.location.href) {
  const parsed = new URL(url, window.location.href);
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

function savedHistoryPosition(entry = history.state) {
  const saved = entry && typeof entry === 'object' ? entry[historyKey] : null;
  if (!saved || saved.version !== 1 || saved.path !== historyPath() || !Number.isFinite(saved.position)) return null;
  return clamp(saved.position, 0, 8);
}

function historyPayload(position, url = window.location.href) {
  const existing = history.state && typeof history.state === 'object' && !Array.isArray(history.state) ? history.state : {};
  return {
    ...existing,
    [historyKey]: { version: 1, position: clamp(position, 0, 8), path: historyPath(url) },
  };
}

function currentPosition() {
  return clamp(window.scrollY / Math.max(1, state.range)) * 8;
}

function persistHistoryPosition(force = false) {
  // During traversal, history.state already belongs to the destination entry,
  // while the old viewport may still be visible. Never save that old position.
  if (!historyReady || restoringHistory) return;
  const now = performance.now();
  if (!force && now - lastHistoryCheck < 650) return;
  lastHistoryCheck = now;
  const position = currentPosition();
  const saved = savedHistoryPosition();
  if (saved !== null && Math.abs(saved - position) < 0.000001) return;
  history.replaceState(historyPayload(position), '', window.location.href);
}

function positionForHistoryEntry() {
  const saved = savedHistoryPosition();
  if (saved !== null) return saved;
  const index = chapterIds.indexOf(window.location.hash.slice(1));
  return index > 0 ? index + 0.25 : 0;
}

function restorePosition(position) {
  restoringHistory = true;
  closeDialog(indexDialog, false);
  closeDialog(aboutDialog, false);
  const destination = Math.round(state.range * clamp(position, 0, 8) / 8);
  // The immediate forced seek also cancels an unfinished chapter navigation.
  if (lenis) lenis.scrollTo(destination, { immediate: true, force: true });
  else window.scrollTo({ top: destination, behavior: 'instant' });
  ScrollTrigger.update();
  state.position = currentPosition();
  state.dirty = true;
  draw(0);
  historyReady = true;
  restoringHistory = false;
  persistHistoryPosition(true);
}

function queueHistoryRestore() {
  restoringHistory = true;
  pendingHistoryPosition = positionForHistoryEntry();
  // A traversal can deliver both popstate and hashchange. Coalesce their work;
  // both resolve from the same normalized entry instead of an anchor offset.
  if (historyRestoreFrame) return;
  historyRestoreFrame = requestAnimationFrame(() => {
    historyRestoreFrame = 0;
    const position = pendingHistoryPosition;
    pendingHistoryPosition = null;
    restorePosition(position);
  });
}

function materialWeight(t, index) {
  const enter = index === 0 ? 1 : ease(index - 0.04, index + 0.13, t);
  const exit = index === 7 ? 1 : 1 - ease(index + 0.73, index + 0.90, t);
  return enter * exit;
}

function setActive(index) {
  if (index === state.active) return;
  state.active = index;
  root.dataset.movement = chapterIds[index];
  document.querySelector('.chapter-number').textContent = pad(index + 1);
  document.querySelector('.chapter-name').textContent = chapters[index];
  document.querySelector('#page-count').textContent = `${pad(index + 1)} / 08`;
  document.querySelector('#chapter-label').setAttribute('aria-label', `${chapters[index]}, movement ${index + 1} of 8. Open the index`);
  previousButton.disabled = index === 0;
  nextButton.disabled = index === 7;
  document.querySelectorAll('.chapter-rail a, .index-list a').forEach((link) => {
    if (Number(link.dataset.jump) === index) link.setAttribute('aria-current', 'step');
    else link.removeAttribute('aria-current');
  });
  scenes.forEach((scene, i) => {
    scene.classList.toggle('is-active', i === index);
    scene.inert = i !== index;
    scene.setAttribute('aria-hidden', String(i !== index));
  });
  state.dirty = true;
}

function renderScenes(t) {
  const active = Math.min(7, Math.max(0, Math.floor(t + 0.08)));
  setActive(active);
  for (let i = 0; i < scenes.length; i += 1) {
    const strength = state.reduced ? Number(i === active) : materialWeight(t, i);
    const scene = scenes[i];
    scene.style.visibility = strength > 0.001 ? 'visible' : 'hidden';
    scene.style.opacity = strength.toFixed(4);
    if (strength < 0.001) continue;
    const enter = i === 0 ? 1 : ease(i - 0.04, i + 0.13, t);
    const exit = i === 7 ? 0 : ease(i + 0.73, i + 0.90, t);
    const direction = i % 2 ? -1 : 1;
    const shift = state.reduced ? 0 : ((1 - enter) * 16 + exit * -22) * direction;
    scene.style.transform = `translate3d(${shift.toFixed(2)}px,0,0)`;
  }
}

function renderMaterials(t) {
  const mobile = state.width < 700;
  const life = state.reduced ? 0 : state.time;
  const breathing = Math.sin(life * 0.13) * 0.002;
  // The exact same alpha-edged bloom begins as a water stain and is carried
  // onto the next paper surface; it is never replaced by a new section image.
  let opacity = 0;
  let scale = 1;
  let rotation = -11;
  let x = 0;
  let y = 0;
  if (t <= 2.5) {
    const inkEnter = ease(0.52, 1.22, t);
    const paperEnter = ease(1.72, 2.23, t);
    const waterGrowth = ease(0, 0.48, t);
    opacity = mix(mix(0.10, 0.30, waterGrowth), 0.96, inkEnter) * (1 - paperEnter);
    scale = mix(mix(0.8, 0.96, waterGrowth), mobile ? 1.2 : 1.32, inkEnter);
    scale = mix(scale, 0.66, paperEnter) + breathing;
    rotation = mix(-11, -4, inkEnter);
    rotation = mix(rotation, -15, paperEnter);
    x = mix(mobile ? 0 : inkEnter * 0.105 * state.width, mobile ? -0.2 * state.width : -0.35 * state.width, paperEnter);
    // Keep the growing mobile bloom below the Ink explanation, then retain
    // the supplied paper handoff and the original opening water placement.
    y = mix(mobile ? 0.085 * state.height * inkEnter : 0, mobile ? 0.05 * state.height : -0.09 * state.height, paperEnter);
  }
  if (t >= 6.72) {
    opacity = ease(6.72, 7.2, t) * 0.86;
    scale = mobile ? 0.82 : 0.92;
    rotation = -38;
    x = state.width * (mobile ? -0.40 : -0.62);
    y = state.height * (mobile ? 0.43 : 0.56);
  }
  bloom.style.visibility = opacity > 0.001 ? 'visible' : 'hidden';
  bloom.style.opacity = opacity.toFixed(4);
  bloom.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotate(${rotation.toFixed(2)}deg) scale(${scale.toFixed(4)})`;

  const fiberStrength = ease(3.72, 4.18, t) * (1 - ease(4.73, 5.08, t));
  lens.style.visibility = fiberStrength > 0.001 ? 'visible' : 'hidden';
  lens.style.opacity = fiberStrength.toFixed(4);
  if (fiberStrength > 0.001) {
    const entryScale = mix(0.77, 1, ease(3.72, 4.2, t));
    const exitScale = mix(1, 1.37, ease(4.74, 5.07, t));
    const py = mobile ? '-35%' : '-50%';
    lens.style.transform = `translateY(${py}) scale(${(entryScale * exitScale).toFixed(4)})`;
    const zoom = (state.magnified ? 1.8 : 1.12) + (state.reduced ? 0 : ease(4.2, 4.7, t) * 0.055);
    const px = state.reduced ? 0 : (state.pointer.x - 0.5) * -8;
    const yy = state.reduced ? 0 : (state.pointer.y - 0.5) * -8;
    lensImage.style.transform = `translate(${px.toFixed(2)}%,${yy.toFixed(2)}%) scale(${zoom.toFixed(3)})`;
  }
  const handoff = t % 1;
  const fold = state.reduced ? 0 : ease(0.73, 0.86, handoff) * (1 - ease(0.88, 1, handoff));
  foldLight.style.opacity = (fold * ((Math.floor(t) === 1 || Math.floor(t) === 4) ? 0.65 : 0)).toFixed(3);
  foldLight.style.transform = `translateX(${mix(-70, 90, ease(0.7, 1, handoff))}%)`;

  impressions.style.opacity = (ease(5.86, 6.16, t) * (state.marks ? 1 : 0)).toFixed(4);
  const gather = ease(6.68, 7.18, t);
  [...impressions.children].forEach((stamp, i) => {
    const destinationX = (mobile ? 0.70 : 0.80) + (i % 3) * (mobile ? 0.085 : 0.045);
    const destinationY = (mobile ? 0.74 : 0.71) + Math.floor(i / 3) * 0.07;
    stamp.style.left = `${mix(Number(stamp.dataset.x), destinationX, gather) * 100}%`;
    stamp.style.top = `${mix(Number(stamp.dataset.y), destinationY, gather) * 100}%`;
    const original = mobile ? 42 : clamp(state.width * 0.034, 36, 90);
    stamp.style.width = `${mix(original, mobile ? 26 : 38, gather)}px`;
  });
  theatre.render({
    scene: Math.min(7, Math.floor(t)),
    local: t >= 8 ? 1 : t % 1,
    time: life,
    pointer: { x: (state.pointer.x - 0.5) * 2, y: (state.pointer.y - 0.5) * 2 },
    reducedMotion: state.reduced,
    width: state.width,
    height: state.height,
  });
}

function draw(delta = 16.67) {
  if (state.hidden) return;
  lenis?.raf(performance.now());
  persistHistoryPosition();
  const dialogOpen = indexDialog.open || aboutDialog.open;
  if (dialogOpen) return;
  state.time += state.reduced ? 0 : Math.min(delta / 1000, 0.05);
  const t = clamp(state.position, 0, 8);
  if (state.reduced && !state.dirty && Math.abs(t - lastPaint) < 0.00001) return;
  const artT = state.reduced ? Math.min(7, Math.floor(t + 0.08)) + 0.42 : t;
  const now = performance.now();
  // DOM follows the scroll on every ticker frame. Only idle material motion is
  // budgeted to 30 Hz on small screens; scrolling and interaction render at once.
  renderScenes(t);
  renderMaterials(artT);
  progressLine.style.transform = `scaleX(${(t / 8).toFixed(6)})`;
  const progressing = Math.abs(t - lastPaint) > 0.00001;
  const interval = state.width < 700 ? 30 : 15;
  if (state.dirty || progressing || (!state.reduced && now - (draw.lastFrame || 0) >= interval)) {
    engine.render({
      scene: Math.min(7, Math.floor(artT)),
      local: artT >= 8 ? 1 : artT % 1,
      time: state.time,
      pointer: state.pointer,
      wetness: state.wetness,
    });
    draw.lastFrame = now;
    lastPaint = t;
    state.dirty = false;
  }
}

function measure(preserve = true) {
  const ratio = clamp(window.scrollY / Math.max(1, state.range));
  const width = window.innerWidth;
  const height = window.innerHeight;
  const toolbarResize = preserve && width < 700 && width === state.width && Math.abs(height - state.height) < state.height * 0.22;
  state.width = width;
  state.height = height;
  if (!toolbarResize) state.range = Math.round(height * (state.reduced ? 1.02 : width < 700 ? 1.65 : 2.1) * 8);
  root.style.setProperty('--vh', `${height / 100}px`);
  root.style.setProperty('--journey-height', `${state.range + height}px`);
  engine.resize(width, height, window.devicePixelRatio || 1);
  lenis?.resize();
  scrollTrigger?.refresh();
  if (preserve) {
    const destination = state.range * ratio;
    if (lenis) lenis.scrollTo(destination, { immediate: true, force: true });
    else window.scrollTo(0, destination);
  }
  state.position = clamp(window.scrollY / state.range) * 8;
  state.dirty = true;
  persistHistoryPosition(true);
}

function createLenis() {
  lenis?.destroy();
  lenis = null;
  if (!state.reduced) {
    lenis = new Lenis({
      autoRaf: false,
      lerp: 0.14,
      smoothWheel: true,
      syncTouch: true,
      syncTouchLerp: 0.15,
      wheelMultiplier: 0.88,
      touchMultiplier: 1,
      anchors: false,
      stopInertiaOnNavigate: true,
    });
    lenis.on('scroll', ScrollTrigger.update);
  }
}

function setMotion(reduced) {
  persistHistoryPosition(true);
  state.reduced = reduced;
  root.classList.toggle('reduced-motion', reduced);
  motionButton.setAttribute('aria-pressed', String(reduced));
  motionButton.setAttribute('aria-label', reduced ? 'Enable flowing motion' : 'Use still mode, reduce motion');
  motionButton.querySelector('span').textContent = reduced ? 'Motion on' : 'Still mode';
  engine.reducedMotion = reduced;
  createLenis();
  measure(true);
  state.dirty = true;
}

function unlockModalScroll() {
  if (indexDialog.open || aboutDialog.open || modalScroll === null) return;
  const offset = modalScroll;
  modalScroll = null;
  root.classList.remove('modal-open');
  if (lenis) lenis.scrollTo(offset, { immediate: true, force: true });
  else window.scrollTo(0, offset);
  state.dirty = true;
}

function closeDialog(dialog, restoreFocus = true) {
  if (!dialog.open) return;
  dialog.close();
  unlockModalScroll();
  lenis?.start();
  state.dirty = true;
  if (restoreFocus) dialogReturnFocus?.focus({ preventScroll: true });
}

function openDialog(dialog, source) {
  dialogReturnFocus = source || document.activeElement;
  if (modalScroll === null) modalScroll = window.scrollY;
  root.classList.add('modal-open');
  lenis?.stop();
  dialog.showModal();
  dialog.querySelector('.close-dialog').focus({ preventScroll: true });
}

function jumpTo(index, { immediate = false, pushHistory = true, focus = false } = {}) {
  index = Math.max(0, Math.min(7, index));
  // Flush the outgoing entry before pushState changes the active entry. This
  // records the exact reading position even just after a wheel gesture.
  persistHistoryPosition(true);
  if (historyRestoreFrame) cancelAnimationFrame(historyRestoreFrame);
  historyRestoreFrame = 0;
  pendingHistoryPosition = null;
  restoringHistory = false;
  closeDialog(indexDialog, false);
  closeDialog(aboutDialog, false);
  const position = index === 0 ? 0 : index + 0.25;
  const y = state.range * (position / 8);
  const targetHash = `#${chapterIds[index]}`;
  if (pushHistory && window.location.hash !== targetHash) history.pushState(historyPayload(position, targetHash), '', targetHash);
  const finished = () => {
    state.position = clamp(window.scrollY / state.range) * 8;
    state.dirty = true;
    renderScenes(state.position);
    persistHistoryPosition(true);
    if (focus) {
      // Keyboard users land in the selected movement, not in a closed dialog.
      const heading = scenes[index].querySelector('h1,h2');
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  };
  if (lenis) lenis.scrollTo(y, { immediate, duration: 1.1, force: true, onComplete: finished });
  else { window.scrollTo({ top: y, behavior: 'instant' }); finished(); }
}

function sealMarkup(sequence) {
  let seed = (sequence + 19) * 12347;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  let voids = '';
  for (let i = 0; i < 145; i += 1) {
    const x = 5 + random() * 70;
    const y = 5 + random() * 70;
    const r = 0.15 + random() * 0.64;
    voids += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r.toFixed(2)}" fill="black"/>`;
  }
  const id = `seal-pigment-${sequence}`;
  return `<svg class="seal-art" viewBox="0 0 80 80" aria-hidden="true"><defs><mask id="${id}"><rect width="80" height="80" fill="white"/>${voids}</mask></defs><path mask="url(#${id})" fill="currentColor" fill-rule="evenodd" d="M6 5L74 7L73 74L5 72ZM11 11L11 67L67 68L68 13Z M17 18H37V25H24V34H36V42H17Z M44 18H60V27H52V36H62V44H44Z M18 48H35V57H26V64H18Z M43 49H61V63H53V57H43Z"/></svg>`;
}

function addMark(x, y) {
  if (state.marks >= 6) {
    impressions.firstElementChild?.remove();
  } else state.marks += 1;
  const stamp = document.createElement('span');
  state.markSequence += 1;
  const turn = Math.sin(state.markSequence * 7.13 + x * 9) * 8;
  stamp.className = 'impression';
  stamp.dataset.x = String(clamp(x, 0.07, 0.93));
  stamp.dataset.y = String(clamp(y, 0.14, 0.85));
  stamp.style.left = `${clamp(x, 0.07, 0.93) * 100}%`;
  stamp.style.top = `${clamp(y, 0.14, 0.85) * 100}%`;
  stamp.style.setProperty('--turn', `${turn.toFixed(2)}deg`);
  stamp.innerHTML = sealMarkup(state.markSequence);
  impressions.append(stamp);
  if (!state.reduced) gsap.fromTo(stamp, { opacity: 0, scale: 1.2 }, { opacity: 0.88, scale: 1, duration: 0.65, ease: 'power2.out', clearProps: 'scale' });
  state.markEnabled = true;
  clearMarksButton.hidden = false;
  markStatus.textContent = 'Your trace remains.';
  makeMarkButton.firstChild.textContent = 'Leave another';
  document.querySelector('#finale-note').textContent = 'Paper, water, ink. And something of you.';
  state.dirty = true;
}

function resetMarks() {
  impressions.replaceChildren();
  state.marks = 0;
  state.markSequence = 0;
  state.markEnabled = false;
  clearMarksButton.hidden = true;
  markStatus.textContent = 'A fresh beginning.';
  makeMarkButton.firstChild.textContent = 'Make your mark';
  document.querySelector('#finale-note').textContent = 'Paper, water, ink. And the space between.';
  state.dirty = true;
}

function wireInteractions() {
  document.querySelectorAll('[data-jump]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      jumpTo(Number(link.dataset.jump), { focus: event.detail === 0 });
    });
  });
  document.querySelector('.skip-link').addEventListener('click', (event) => { event.preventDefault(); openDialog(indexDialog, event.currentTarget); });
  document.querySelector('.index-trigger').addEventListener('click', (event) => openDialog(indexDialog, event.currentTarget));
  document.querySelector('#chapter-label').addEventListener('click', (event) => openDialog(indexDialog, event.currentTarget));
  document.querySelector('#about-trigger').addEventListener('click', (event) => openDialog(aboutDialog, event.currentTarget));
  for (const dialog of [indexDialog, aboutDialog]) {
    dialog.querySelector('.close-dialog').addEventListener('click', () => closeDialog(dialog));
    dialog.addEventListener('cancel', (event) => { event.preventDefault(); closeDialog(dialog); });
    dialog.addEventListener('close', () => { unlockModalScroll(); lenis?.start(); state.dirty = true; });
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog || dialog === indexDialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeDialog(dialog);
    });
  }
  previousButton.addEventListener('click', () => jumpTo(state.active - 1));
  nextButton.addEventListener('click', () => jumpTo(state.active + 1));
  motionButton.addEventListener('click', () => { state.motionChoice = !state.reduced; setMotion(state.motionChoice); });
  mediaMotion.addEventListener('change', (event) => { if (state.motionChoice === null) setMotion(event.matches); });
  document.querySelector('#wetness').addEventListener('input', (event) => {
    state.wetness = Number(event.target.value) / 100;
    event.target.setAttribute('aria-valuetext', `${event.target.value} percent wet`);
    state.dirty = true;
  });
  document.querySelector('#lens-toggle').addEventListener('click', (event) => {
    state.magnified = !state.magnified;
    event.currentTarget.setAttribute('aria-pressed', String(state.magnified));
    event.currentTarget.querySelector('span').textContent = state.magnified ? 'Step back' : 'Look closer';
    event.currentTarget.setAttribute('aria-label', state.magnified ? 'Return to the wider fiber view' : 'Magnify the paper fibers');
    state.dirty = true;
  });
  document.querySelector('#add-drop').addEventListener('click', () => {
    const mobile = state.width < 700;
    engine.addDrop(mobile ? 0.57 : 0.64, mobile ? 0.63 : 0.51);
    state.dirty = true;
  });
  makeMarkButton.addEventListener('click', () => {
    const mobile = state.width < 700;
    const index = state.markSequence % 5;
    addMark(mobile ? 0.64 + index * 0.06 : 0.51 + index * 0.035, mobile ? 0.66 + (index % 2) * 0.07 : 0.58 + (index % 2) * 0.09);
  });
  document.querySelector('#seal-target').addEventListener('click', () => addMark(state.width < 700 ? 0.75 : 0.53, state.width < 700 ? 0.71 : 0.54));
  clearMarksButton.addEventListener('click', resetMarks);
  let down;
  stage.addEventListener('pointerdown', (event) => { down = { x: event.clientX, y: event.clientY, time: performance.now() }; }, { passive: true });
  stage.addEventListener('pointerup', (event) => {
    if (!down || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 8 || performance.now() - down.time > 600) return;
    if (event.target.closest('button,a,input,.scene-copy')) return;
    const x = event.clientX / state.width;
    const y = event.clientY / state.height;
    if (state.active <= 1) { engine.addDrop(x, y); state.dirty = true; }
    else if (state.active === 6 && state.markEnabled) addMark(x, y);
  }, { passive: true });
  stage.addEventListener('pointermove', (event) => {
    state.pointer.x = clamp(event.clientX / state.width);
    state.pointer.y = clamp(event.clientY / state.height);
    if (state.active === 4) state.dirty = true;
  }, { passive: true });
  document.addEventListener('keydown', (event) => {
    if (indexDialog.open || aboutDialog.open || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target.closest('input,textarea,button,a,[contenteditable=true]')) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); jumpTo(state.active + 1); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); jumpTo(state.active - 1); }
    else if (event.key === 'Home') { event.preventDefault(); jumpTo(0); }
    else if (event.key === 'End') { event.preventDefault(); jumpTo(7); }
  });
  window.addEventListener('popstate', queueHistoryRestore);
  window.addEventListener('hashchange', queueHistoryRestore);
  window.addEventListener('pagehide', (event) => {
    persistHistoryPosition(true);
    stopTicker();
    if (!event.persisted) dispose();
  });
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => measure(true), 150); }, { passive: true });
  window.addEventListener('pageshow', (event) => {
    if (disposed) return;
    state.hidden = document.hidden;
    if (event.persisted) {
      const position = positionForHistoryEntry();
      restoringHistory = true;
      measure(false);
      restorePosition(position);
    }
    startTicker();
  });
  document.addEventListener('visibilitychange', () => {
    if (disposed) return;
    if (document.hidden) persistHistoryPosition(true);
    state.hidden = document.hidden;
    if (state.hidden) stopTicker();
    else { lenis?.scrollTo(window.scrollY, { immediate: true, force: true }); ScrollTrigger.refresh(); state.dirty = true; startTicker(); }
  });
}

async function loadAssets() {
  const entries = [['bloom', 'ink-bloom.webp'], ['brush', 'brush-stroke.webp'], ['fibers', 'paper-fibers.webp'], ['wash', 'ink-wash.webp'], ['paper', 'paper-sheet.webp'], ['gesture', 'ink-gesture.webp']];
  const results = await Promise.allSettled(entries.map(async ([key, name]) => {
    const image = new Image();
    image.decoding = 'async';
    image.src = assetURL(name);
    await image.decode();
    if (disposed) return;
    assets[key] = image;
    state.dirty = true;
  }));
  if (disposed) return;
  root.dataset.assets = results.every(result => result.status === 'fulfilled') ? 'ready' : 'partial';
  state.dirty = true;
  const warmTextures = () => {
    if (disposed) return;
    if (assets.brush) engine.prepareBrushAsset(assets.brush);
    if (assets.gesture) engine.prepareGestureAsset(assets.gesture);
    state.dirty = true;
  };
  if ('requestIdleCallback' in window) warmIdle = window.requestIdleCallback(warmTextures, { timeout: 1600 });
  else warmTimer = window.setTimeout(warmTextures, 0);
  ScrollTrigger.refresh();
}

function initialize() {
  const initialPosition = positionForHistoryEntry();
  // A material journey changes length with viewport and motion preference.
  // Its own normalized history is the complete restoration source of truth.
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
    // ScrollTrigger retains its own restoration mode during refreshes. Update
    // that cached mode too so a later font/asset refresh cannot restore pixels.
    ScrollTrigger.clearScrollMemory('manual');
  }
  // No loading curtain: the first readable composition is HTML from the start.
  engine = new MaterialEngine(document.querySelector('#material-canvas'), { assets, reducedMotion: state.reduced });
  theatre = new PaperTheatre(document.querySelector('#paper-theatre'), {
    paperUrl: assetURL('paper-sheet.webp'),
    washUrl: assetURL('ink-wash.webp'),
    bloomUrl: assetURL('ink-bloom.webp'),
  });
  root.classList.add('is-enhanced');
  root.classList.toggle('reduced-motion', state.reduced);
  motionButton.setAttribute('aria-pressed', String(state.reduced));
  motionButton.setAttribute('aria-label', state.reduced ? 'Enable flowing motion' : 'Use still mode, reduce motion');
  motionButton.querySelector('span').textContent = state.reduced ? 'Motion on' : 'Still mode';
  measure(false);
  createLenis();
  ScrollTrigger.config({ ignoreMobileResize: true });
  scrollTrigger = ScrollTrigger.create({
    trigger: journey,
    start: 'top top',
    end: () => state.range,
    invalidateOnRefresh: true,
    onUpdate(self) { state.position = self.progress * 8; state.dirty = true; },
  });
  document.querySelector('#seal-target').innerHTML = sealMarkup(0);
  wireInteractions();
  gsap.ticker.lagSmoothing(0);
  startTicker();
  loadAssets();
  document.fonts.ready.then(() => { if (!disposed) { ScrollTrigger.refresh(); state.dirty = true; } });
  restorePosition(initialPosition);
}

try {
  initialize();
} catch (error) {
  dispose();
  root.classList.remove('is-enhanced', 'reduced-motion');
  root.style.removeProperty('--journey-height');
  for (const scene of scenes) {
    scene.style.cssText = '';
    scene.inert = false;
    scene.removeAttribute('aria-hidden');
  }
  console.error('The animated material layer could not start. The readable experience remains available.', error);
}

import.meta.hot?.dispose(dispose);
