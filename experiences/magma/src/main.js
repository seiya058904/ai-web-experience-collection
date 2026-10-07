import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { MaterialRenderer } from './material-renderer.js';
import { stateAt } from './material-state.js';
import { MagmaAudio } from './audio.js';

const root = document.documentElement;
const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
const smooth = (a, b, value) => { const t = clamp((value - a) / (b - a)); return t * t * (3 - 2 * t); };
const chapterIds = ['pressure', 'molten', 'flow', 'skin', 'crack', 'glass', 'fracture', 'stone', 'sealed'];
const chapterNames = ['PRESSURE', 'MOLTEN', 'FLOW', 'SKIN', 'CRACK', 'GLASS', 'FRACTURE', 'CRYSTAL · STONE', 'SEALED'];
const chapters = [...document.querySelectorAll('.chapter')];
const screens = chapters.map(chapter => chapter.querySelector('.chapter-screen'));
const canvas = document.getElementById('material-canvas');
const poster = document.getElementById('poster');
const posterImage = document.getElementById('poster-image');
const posterMobile = document.getElementById('poster-mobile');
const rail = document.querySelector('.chapter-rail');
const chapterNumber = document.getElementById('chapter-number');
const chapterName = document.getElementById('chapter-name');
const announcement = document.getElementById('chapter-announcement');
const status = document.getElementById('status-message');
const indexDialog = document.getElementById('study-index');
const aboutDialog = document.getElementById('about-study');
const motionButton = document.getElementById('motion-toggle');
const coolButton = document.getElementById('cool-control');
const soundButton = document.getElementById('sound-toggle');
const soundLabel = document.getElementById('sound-label');
const fractureButton = document.getElementById('fracture-control');
const mediaMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const mediaMobile = window.matchMedia('(max-width: 700px)');
const lifecycle = new AbortController();
const navigationType = performance.getEntriesByType('navigation')[0]?.type;
const restoringDocument = navigationType === 'reload' || navigationType === 'back_forward';
let disposed = false;

function listen(target, type, handler, options = {}) {
  target.addEventListener(type, handler, { ...options, signal: lifecycle.signal });
}

const focalPoints = [[.5,.5],[.59,.5],[.53,.5],[.55,.5],[.62,.5],[.54,.5],[.54,.5],[.58,.5],[.5,.5]];
const mobileFocalPoints = [[.5,.5],[.51,.55],[.5,.5],[.51,.5],[.61,.5],[.5,.5],[.44,.6],[.5,.5],[.5,.5]];
const mobileDimensions = [[853,1844],[960,540],[853,1844],[960,540],[960,540],[853,1844],[960,540],[830,1896],[853,1844]];
const assets = chapterIds.map((id, index) => ({
  src: `${import.meta.env.BASE_URL}magma/materials/${id}.webp`, mobileSrc: `${import.meta.env.BASE_URL}magma/materials/${id}-mobile.webp`,
  width: 1672, height: 941,
  mobileWidth: mobileDimensions[index][0],
  mobileHeight: mobileDimensions[index][1],
  focal: focalPoints[index], mobileFocal: mobileFocalPoints[index],
}));

function readPreference() { try { return localStorage.getItem('magma-motion'); } catch { return null; } }
let motionPreference = readPreference();
let motionEnabled = motionPreference ? motionPreference === 'full' : !mediaMotion.matches;
let lenis;
let renderer;
let position = 0;
let scene = -1;
let stops = [];
let endScroll = 1;
let liveTime = 0;
let frameId = 0;
let lastTime = 0;
let lastDraw = 0;
let lastPosition = -1;
let lastInteraction = -1;
let lastHistoryUpdate = 0;
let lastPoster = -1;
let forceRender = true;
let resizePending = false;
let visible = !document.hidden;
let ready = false;
let initialLanding = null;
let initialLandingFrame = 0;
const initialInputEvents = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
let holding = false;
let coolingLatched = false;
let coolAmount = 0;
let crackImpulse = 0;
let fractureLatched = false;
let fractureAmount = 0;
let restoreFocus = null;
let soundWanted = false;
let soundRequest = 0;
const pointer = { x: 0, y: 0 };
const pointerTarget = { x: 0, y: 0 };
const audio = new MagmaAudio();

function hasDialog() { return indexDialog.open || aboutDialog.open; }

function setupScroll() {
  if (lenis) {
    lenis.options.smoothWheel = motionEnabled && !mediaMotion.matches;
    lenis.scrollTo(window.scrollY, { immediate: true, force: true });
    return;
  }
  lenis = new Lenis({
    autoRaf: false,
    autoResize: false,
    smoothWheel: motionEnabled && !mediaMotion.matches,
    syncTouch: false,
    lerp: .105,
    wheelMultiplier: 1,
    touchMultiplier: 1,
    anchors: false,
    respectReducedMotion: false,
    prevent: node => Boolean(node.closest?.('dialog')),
    virtualScroll: ({ deltaY, event }) => {
      if (event.type === 'wheel' && !event.ctrlKey && lenis.options.smoothWheel
        && !hasDialog() && !lenis.isStopped
        && deltaY * (lenis.targetScroll - lenis.actualScroll) < 0) {
        lenis.stop();
        lenis.start();
      }
    },
  });
  if (hasDialog()) lenis.stop();
}

function readLayout() {
  stops = chapters.map(chapter => chapter.offsetTop);
  endScroll = Math.max(stops[8] + 1, document.documentElement.scrollHeight - window.innerHeight);
}

function positionAtScroll(scroll) {
  const y = clamp(scroll, 0, endScroll);
  if (y >= endScroll - 1) return 9;
  let index = 0;
  while (index < 8 && y >= stops[index + 1]) index += 1;
  const end = index === 8 ? endScroll : stops[index + 1];
  return index + clamp((y - stops[index]) / Math.max(1, end - stops[index]));
}

function scrollAtPosition(value) {
  const p = clamp(value, 0, 9);
  if (p === 9) return endScroll;
  const index = Math.min(8, Math.floor(p));
  const end = index === 8 ? endScroll : stops[index + 1];
  return stops[index] + (end - stops[index]) * (p - index);
}

function setMotion(enabled, persist = false) {
  motionEnabled = enabled;
  root.classList.toggle('motion-reduced', !enabled);
  motionButton.textContent = enabled ? 'Motion on' : 'Motion reduced';
  motionButton.setAttribute('aria-pressed', String(enabled));
  if (persist) {
    motionPreference = enabled ? 'full' : 'reduced';
    try { localStorage.setItem('magma-motion', motionPreference); } catch { /* Private browsing remains usable. */ }
  }
  setupScroll();
  forceRender = true;
}

function setPoster(index) {
  if (lastPoster === index) return;
  lastPoster = index;
  const asset = assets[index];
  posterMobile.srcset = asset.mobileSrc;
  posterImage.src = asset.src;
  const point = mediaMobile.matches ? asset.mobileFocal : asset.focal;
  poster.style.setProperty('--poster-x', `${point[0] * 100}%`);
  poster.style.setProperty('--poster-y', `${point[1] * 100}%`);
}

function showImageMode() {
  root.classList.remove('webgl-ready');
  root.dataset.renderer = 'image';
  lastPoster = -1;
  setPoster(Math.max(0, scene));
  forceRender = true;
}

function resetInteraction() {
  holding = false;
  coolingLatched = false;
  coolAmount = 0;
  crackImpulse = 0;
  fractureLatched = false;
  fractureAmount = 0;
  coolButton.setAttribute('aria-pressed', 'false');
  fractureButton.setAttribute('aria-pressed', 'false');
  document.getElementById('cool-label').textContent = 'Hold to cool';
  document.getElementById('fracture-label').textContent = 'Trace the fracture';
  root.style.setProperty('--cool-amount', '0');
}

function updateScene(index) {
  if (index === scene) return;
  scene = index;
  root.dataset.currentScene = String(index);
  screens.forEach((screen, i) => {
    screen.classList.toggle('is-active', i === index);
    screen.inert = i !== index;
    screen.setAttribute('aria-hidden', String(i !== index));
  });
  document.querySelectorAll('.chapter-rail a, .index-list a').forEach(link => {
    if (Number(link.dataset.go) === index) link.setAttribute('aria-current', 'step');
    else link.removeAttribute('aria-current');
  });
  chapterNumber.textContent = `${String(index + 1).padStart(2, '0')} / 09`;
  chapterName.textContent = chapterNames[index];
  if (ready) announcement.textContent = `${index + 1} of 9. ${chapterNames[index].toLowerCase()}.`;
  resetInteraction();
  setPoster(index);
  forceRender = true;
}

function closeDialogs(returnFocus = true) {
  if (indexDialog.open) indexDialog.close();
  if (aboutDialog.open) aboutDialog.close();
  document.body.classList.remove('modal-open');
  if (!disposed && visible) lenis.start();
  if (returnFocus && restoreFocus?.isConnected) restoreFocus.focus({ preventScroll: true });
}

function openDialog(dialog) {
  if (!hasDialog()) restoreFocus = document.activeElement;
  closeDialogs(false);
  resetInteraction();
  lenis.stop();
  document.body.classList.add('modal-open');
  dialog.showModal();
  dialog.querySelector('.close-dialog').focus({ preventScroll: true });
  forceRender = true;
}

function cancelInitialLanding() {
  initialLanding = null;
  if (initialLandingFrame) cancelAnimationFrame(initialLandingFrame);
  initialLandingFrame = 0;
  initialInputEvents.forEach(type => window.removeEventListener(type, cancelInitialLanding, true));
  window.removeEventListener('load', queueInitialLanding);
}

function queueInitialLanding() {
  if (disposed || !visible || !initialLanding || initialLandingFrame || document.readyState !== 'complete') return;
  // Native initial-fragment positioning can run after the module's first jump.
  // Converge once after load/pageshow and two frames; never follow later scroll.
  initialLandingFrame = requestAnimationFrame(() => {
    initialLandingFrame = requestAnimationFrame(() => {
      initialLandingFrame = 0;
      const landing = initialLanding;
      if (!landing) return;
      if (location.hash !== `#${chapterIds[landing.index]}` || hasDialog()) {
        cancelInitialLanding();
        return;
      }
      readLayout();
      lenis.resize();
      cancelInitialLanding();
      goTo(landing.index, {
        historyMode: 'replace', immediate: true, focus: false,
        exactPosition: landing.value,
      });
    });
  });
}

function goTo(index, { historyMode = 'push', immediate = false, focus = true, exactPosition } = {}) {
  if (disposed) return;
  const value = exactPosition ?? (index === 0 ? 0 : index + .2);
  closeDialogs(false);
  if (historyMode !== 'none') {
    const method = historyMode === 'replace' ? 'replaceState' : 'pushState';
    history[method]({ magmaPosition: value }, '', `#${chapterIds[index]}`);
  }
  lenis.scrollTo(scrollAtPosition(value), {
    duration: Math.min(2.1, 1.1 + Math.abs(value - position) * .1),
    immediate: immediate || !motionEnabled,
    force: true,
    onComplete: () => {
      forceRender = true;
      if (focus) chapters[index].querySelector('h1, h2').focus({ preventScroll: true });
    },
  });
  if (immediate || !motionEnabled) position = positionAtScroll(window.scrollY);
}

function updateFrame(timestamp) {
  frameId = 0;
  if (!visible || disposed) return;
  frameId = requestAnimationFrame(updateFrame);
  // Controls follow elapsed time even on a busy or slower device. Visibility
  // changes reset lastTime, so returning to the page cannot finish a hold.
  const dt = lastTime ? Math.min(.5, (timestamp - lastTime) / 1000) : 0;
  lastTime = timestamp;
  if (resizePending) {
    resizePending = false;
    const retained = position;
    readLayout();
    lenis.resize();
    lenis.scrollTo(scrollAtPosition(retained), { immediate: true, force: true });
    renderer?.resize();
    lastPoster = -1;
    setPoster(Math.max(0, scene));
    forceRender = true;
  }
  lenis.raf(timestamp);
  position = positionAtScroll(window.scrollY);
  const index = Math.min(8, Math.floor(position));
  const progress = position - index;
  updateScene(index);

  const coolTarget = (holding || coolingLatched) && index === 3 ? 1 : 0;
  coolAmount = coolTarget > coolAmount ? Math.min(coolTarget, coolAmount + dt * .55) : Math.max(coolTarget, coolAmount - dt * .38);
  crackImpulse = Math.max(0, crackImpulse - dt * .28);
  const fractureTarget = fractureLatched && index === 6 ? 1 : 0;
  fractureAmount += (fractureTarget - fractureAmount) * (1 - Math.exp(-dt * 2.6));
  const interaction = index === 3 ? coolAmount : index === 4 ? crackImpulse : index === 6 ? fractureAmount : 0;
  root.style.setProperty('--cool-amount', coolAmount.toFixed(3));
  poster.classList.toggle('is-cooling', !root.classList.contains('webgl-ready') && index === 3 && coolAmount > .001);

  const material = stateAt(position, interaction);
  const complete = Boolean(material.complete || position >= 8.86);
  root.classList.toggle('is-complete', complete);
  if (motionEnabled && !complete && !hasDialog()) liveTime += Math.min(dt, .1);
  const pointerMix = motionEnabled ? 1 - Math.exp(-dt * 4) : 1;
  pointer.x += (pointerTarget.x - pointer.x) * pointerMix;
  pointer.y += (pointerTarget.y - pointer.y) * pointerMix;

  let copyOpacity = 1;
  if (motionEnabled) {
    const entrance = index === 0 ? 1 : smooth(.015, .14, progress);
    const departure = index === 8 ? 1 : 1 - smooth(.75, .97, progress);
    copyOpacity = entrance * departure;
  }
  const copyY = motionEnabled ? (1 - smooth(0, .16, progress)) * (index === 0 ? 0 : 15) - smooth(.75, 1, progress) * (index === 8 ? 0 : 14) : 0;
  screens[index].style.setProperty('--copy-opacity', copyOpacity.toFixed(4));
  screens[index].style.setProperty('--copy-y', `${copyY.toFixed(2)}px`);
  if (index === 8) {
    const closingOpacity = motionEnabled ? 1 - smooth(.72, .96, progress) : complete ? 0 : 1;
    screens[index].style.setProperty('--closing-opacity', closingOpacity.toFixed(4));
  }
  const railOpacity = smooth(.3, .9, position);
  root.style.setProperty('--rail-opacity', railOpacity.toFixed(3));
  rail.classList.toggle('is-visible', position > .6);

  const changed = Math.abs(position - lastPosition) > .00001 || Math.abs(interaction - lastInteraction) > .0001;
  const living = motionEnabled && !complete && !hasDialog();
  const interval = mediaMobile.matches ? 1000 / 30 : 1000 / 60;
  if ((forceRender || changed || living) && (forceRender || timestamp - lastDraw >= interval - .7)) {
    renderer?.render({ position, time: liveTime, reducedMotion: !motionEnabled, pointer, interaction, velocity: lenis.velocity || 0 });
    lastDraw = timestamp;
    lastPosition = position;
    lastInteraction = interaction;
    forceRender = false;
  }
  audio.update({ heat: material.heat, flow: material.flow, split: material.split, glass: material.glass, complete });
  if (!initialLanding && !hasDialog() && timestamp - lastHistoryUpdate > 500) {
    lastHistoryUpdate = timestamp;
    history.replaceState({ magmaPosition: position }, '', `#${chapterIds[index]}`);
  }
}

root.classList.add('is-enhanced');
setMotion(motionEnabled);
readLayout();
updateScene(0);

try {
  renderer = new MaterialRenderer(canvas, {
    assets,
    suspended: !visible,
    onReady: () => { root.classList.add('webgl-ready'); root.dataset.renderer = 'webgl'; forceRender = true; },
    onError: () => { showImageMode(); },
    onContextLost: () => { showImageMode(); },
    onContextRestored: () => { root.classList.add('webgl-ready'); root.dataset.renderer = 'webgl'; forceRender = true; },
  });
  renderer.ready?.catch?.(() => showImageMode());
} catch { showImageMode(); }

document.querySelectorAll('[data-go]').forEach(link => listen(link, 'click', event => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  goTo(Number(link.dataset.go));
}));
listen(document.getElementById('index-toggle'), 'click', () => openDialog(indexDialog));
document.querySelectorAll('[data-open-index]').forEach(button => listen(button, 'click', event => { event.preventDefault(); openDialog(indexDialog); }));
document.querySelectorAll('[data-open-about]').forEach(button => listen(button, 'click', () => openDialog(aboutDialog)));
document.querySelectorAll('.close-dialog').forEach(button => listen(button, 'click', () => closeDialogs()));
[indexDialog, aboutDialog].forEach(dialog => listen(dialog, 'cancel', event => { event.preventDefault(); closeDialogs(); }));
listen(motionButton, 'click', () => { setMotion(!motionEnabled, true); status.textContent = motionEnabled ? 'Material motion enabled.' : 'Reduced motion enabled.'; });
listen(mediaMotion, 'change', event => {
  if (!motionPreference) setMotion(!event.matches);
  else setupScroll();
});

listen(soundButton, 'click', async () => {
  soundWanted = !soundWanted;
  const request = ++soundRequest;
  soundButton.setAttribute('aria-busy', 'true');
  const enabled = await audio.setEnabled(soundWanted);
  if (disposed || request !== soundRequest) return;
  soundWanted = Boolean(enabled && soundWanted);
  soundButton.setAttribute('aria-pressed', String(soundWanted));
  soundButton.removeAttribute('aria-busy');
  soundLabel.textContent = soundWanted ? 'Sound on' : 'Sound off';
  status.textContent = soundWanted ? 'Sound enabled.' : 'Sound off.';
});

function releaseCooling() { holding = false; if (!coolingLatched) coolButton.setAttribute('aria-pressed', 'false'); }
listen(coolButton, 'pointerdown', event => { if (event.button !== 0) return; holding = true; coolingLatched = false; coolButton.setAttribute('aria-pressed', 'true'); coolButton.setPointerCapture?.(event.pointerId); event.preventDefault(); });
listen(coolButton, 'pointerup', releaseCooling);
listen(coolButton, 'pointercancel', releaseCooling);
listen(coolButton, 'lostpointercapture', releaseCooling);
listen(coolButton, 'keydown', event => {
  if (event.code === 'Space') { event.preventDefault(); holding = true; coolButton.setAttribute('aria-pressed', 'true'); }
  if (event.code === 'Enter' && !event.repeat) { event.preventDefault(); coolingLatched = !coolingLatched; coolButton.setAttribute('aria-pressed', String(coolingLatched)); }
});
listen(coolButton, 'keyup', event => { if (event.code === 'Space') { event.preventDefault(); releaseCooling(); } });
listen(coolButton, 'blur', releaseCooling);
listen(document.getElementById('crack-control'), 'click', () => { crackImpulse = 1; forceRender = true; status.textContent = 'The seam opens.'; });
listen(fractureButton, 'click', () => {
  fractureLatched = !fractureLatched;
  fractureButton.setAttribute('aria-pressed', String(fractureLatched));
  document.getElementById('fracture-label').textContent = fractureLatched ? 'Let the curve settle' : 'Trace the fracture';
  forceRender = true;
});

listen(window, 'pointermove', event => {
  if (hasDialog()) return;
  pointerTarget.x = clamp(event.clientX / window.innerWidth * 2 - 1, -1, 1);
  pointerTarget.y = clamp(event.clientY / window.innerHeight * 2 - 1, -1, 1);
}, { passive: true });
listen(window, 'pointerdown', event => {
  if (event.pointerType === 'touch' && !hasDialog()) {
    pointerTarget.x = clamp(event.clientX / window.innerWidth * 2 - 1, -1, 1);
    pointerTarget.y = clamp(event.clientY / window.innerHeight * 2 - 1, -1, 1);
  }
}, { passive: true });
listen(window, 'blur', () => { releaseCooling(); pointerTarget.x = 0; pointerTarget.y = 0; });
listen(window, 'resize', () => { resizePending = true; }, { passive: true });
listen(document, 'visibilitychange', () => {
  setVisible(!document.hidden);
});
listen(window, 'popstate', () => {
  cancelInitialLanding();
  const index = chapterIds.indexOf(location.hash.slice(1));
  if (index >= 0) goTo(index, { historyMode: 'none', immediate: true, focus: false, exactPosition: history.state?.magmaPosition });
});
listen(window, 'hashchange', () => {
  const index = chapterIds.indexOf(location.hash.slice(1));
  if (initialLanding && index !== initialLanding.index) cancelInitialLanding();
  if (index >= 0 && index !== Math.min(8, Math.floor(position))) goTo(index, { historyMode: 'none', immediate: true, focus: false });
});
listen(window, 'pageshow', event => {
  if (event.persisted) {
    cancelInitialLanding();
    position = positionAtScroll(window.scrollY);
    setVisible(!document.hidden);
    resizePending = true; forceRender = true;
  } else queueInitialLanding();
});

function setVisible(value) {
  if (disposed) return;
  visible = value;
  audio.setVisible(value);
  if (renderer) renderer.suspended = !value;
  lastTime = 0;
  if (!value) {
    lenis.stop();
    cancelAnimationFrame(frameId);
    frameId = 0;
    releaseCooling();
  } else {
    if (!hasDialog()) lenis.start();
    position = positionAtScroll(window.scrollY);
    forceRender = true;
    if (!frameId) frameId = requestAnimationFrame(updateFrame);
    queueInitialLanding();
  }
}

function dispose() {
  if (disposed) return;
  disposed = true;
  ++soundRequest;
  cancelInitialLanding();
  cancelAnimationFrame(frameId);
  frameId = 0;
  lifecycle.abort();
  lenis.destroy();
  renderer?.destroy();
  audio.destroy();
}
listen(window, 'pagehide', event => {
  const retained = positionAtScroll(window.scrollY);
  const index = Math.min(8, Math.floor(retained));
  history.replaceState({ magmaPosition: retained }, '', `#${chapterIds[index]}`);
  cancelInitialLanding();
  setVisible(false);
  if (!event.persisted) dispose();
});
if (import.meta.hot) import.meta.hot.dispose(dispose);

const initialIndex = chapterIds.indexOf(location.hash.slice(1));
if (initialIndex >= 0 && !restoringDocument) {
  const saved = history.state?.magmaPosition;
  const retained = Number.isFinite(saved) && saved >= 0 && saved <= 9
    && Math.min(8, Math.floor(saved)) === initialIndex ? saved : undefined;
  initialLanding = { index: initialIndex, value: retained ?? (initialIndex === 0 ? 0 : initialIndex + .2) };
  // Input before the late correction means the visitor now owns the position.
  initialInputEvents.forEach(type => listen(window, type, cancelInitialLanding, { capture: true, passive: true }));
  listen(window, 'load', queueInitialLanding, { once: true });
  goTo(initialIndex, { historyMode: 'none', immediate: true, focus: false, exactPosition: initialLanding.value });
  queueInitialLanding();
}
ready = true;
root.dataset.ready = 'true';
frameId = requestAnimationFrame(updateFrame);
