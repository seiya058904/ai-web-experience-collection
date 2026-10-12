import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { DoseFallback } from './fallback.js';
import { CHAPTERS, clamp, smoothstep, sampleJourney, scrollForState, colorsForState, depthLabel } from './timeline.js';

const root = document.documentElement;
const sections = [...document.querySelectorAll('.chapter')];
const panels = sections.map(section => section.querySelector('.chapter-content'));
const rail = [...document.querySelectorAll('.progress-rail a')];
const canvas = document.getElementById('scene-canvas');
const fallbackCanvas = document.getElementById('fallback-canvas');
const status = document.getElementById('art-status');
const renderMode = document.getElementById('render-mode');
const quietControl = document.getElementById('quiet-motion');
const lightControl = document.getElementById('light-rendering');
const depthControl = document.getElementById('observe-depth');
const depthOutput = document.getElementById('depth-description');
const dialogs = [...document.querySelectorAll('dialog')];
const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const query = new URLSearchParams(window.location.search);
const readPreference = key => { try { return sessionStorage.getItem(key); } catch { return null; } };
const savePreference = (key, value) => { try { sessionStorage.setItem(key, value); } catch { /* Preferences are optional. */ } };
const savedMotion = readPreference('dose.quiet');

let quiet = query.get('motion') === 'quiet' || (savedMotion === null ? reducedQuery.matches : savedMotion === 'true');
const requestedQuality = ['high', 'low'].includes(query.get('quality')) ? query.get('quality') : null;
const savedQuality = ['high', 'low'].includes(readPreference('dose.quality')) ? readPreference('dose.quality') : null;
let quality = requestedQuality || savedQuality || (navigator.deviceMemory && navigator.deviceMemory < 4 ? 'low' : 'high');
let qualityIsExplicit = requestedQuality !== null || savedQuality !== null;
let metrics = [];
let view = { width: window.innerWidth, height: window.innerHeight };
let scene3d = null;
let contextLost = false;
let rendererFailed = false;
let rendererReady = false;
let fallback = new DoseFallback(fallbackCanvas);
let lenis = null;
let frameId = null;
let lastTimestamp = null;
let lastRender = -Infinity;
let elapsed = 0;
let dirty = true;
let resizePending = false;
let resizeSnapshot = null;
let dialogOpener = null;
let openDialog = null;
let observeDepth = Number(depthControl.value) / 1000;
let pointer = { x: 0, y: 0 };
let pointerTarget = { x: 0, y: 0 };
let current = { scene: 0, local: 0, transition: 0, overall: 0 };
let lastUIKey = '';
let lastActive = -1;
let lastPageColor = '';
let lastProgress = -1;
let renderedFrames = 0;
let lastAdaptiveCheck = 0;
let frameDurations = [];
let lifetimeRafCallbacks = 0;
let firstSceneFrame = false;
let disposed = false;
let initialHashApplied = false;

root.classList.toggle('quiet', quiet);
root.classList.add('enhanced');
quietControl.checked = quiet;
lightControl.checked = quality === 'low';

function effectiveDpr() {
  const cap = quality === 'low' ? 1 : view.width < 700 ? 1.25 : 1.5;
  const pixelCap = Math.sqrt(2_600_000 / Math.max(1, view.width * view.height));
  return Math.min(window.devicePixelRatio || 1, cap, pixelCap);
}

function updateRenderMode() {
  renderMode.textContent = rendererReady && !contextLost && !rendererFailed
    ? `Interactive 3D · ${quality === 'low' ? 'light' : 'full'} rendering${quiet ? ' · quiet motion' : ''}.`
    : 'Illustrated edition · every chapter and the cutaway remain available.';
}

function configureScrolling() {
  if (lenis) { lenis.destroy(); lenis = null; }
  if (!quiet) {
    lenis = new Lenis({
      autoRaf: false, autoResize: false, smoothWheel: true, syncTouch: false,
      lerp: .105, wheelMultiplier: .95, anchors: false,
      prevent: node => node.closest?.('dialog, .depth-control') != null
    });
    if (openDialog) lenis.stop();
  }
}

function measure(preserve = false) {
  const snapshot = preserve ? resizeSnapshot || current : null;
  view = { width: window.innerWidth, height: window.innerHeight };
  metrics = sections.map(section => ({ top: section.offsetTop, height: section.offsetHeight }));
  fallback.resize(view.width, view.height, Math.min(effectiveDpr(), 1.25));
  if (scene3d && !contextLost && !rendererFailed) {
    try { scene3d.resize(view.width, view.height, effectiveDpr()); }
    catch (error) { useIllustratedEdition('resize', error); }
  }
  lenis?.resize();
  if (snapshot) {
    const y = scrollForState(snapshot.scene, snapshot.local, metrics, view.height);
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
  }
  resizeSnapshot = null;
  resizePending = false;
  dirty = true;
  lastUIKey = '';
}

function useIllustratedEdition(reason, error) {
  rendererFailed = true;
  rendererReady = false;
  root.classList.remove('webgl-ready');
  status.textContent = reason === 'context' ? 'The illustrated edition is keeping your place.' : '';
  updateRenderMode();
  dirty = true;
  // Errors are retained for diagnostics without an endless render/error loop.
  diagnostics.rendererIssue = { reason, message: String(error?.message || error || 'Graphics unavailable') };
}

function setQuality(next, explicit = false) {
  if (explicit) {
    qualityIsExplicit = true;
    savePreference('dose.quality', next);
  }
  quality = next;
  lightControl.checked = next === 'low';
  measure(false);
  updateRenderMode();
}

function setQuiet(value, explicit = false) {
  resizeSnapshot = { ...current };
  quiet = value;
  if (explicit) savePreference('dose.quiet', String(value));
  root.classList.toggle('quiet', value);
  quietControl.checked = value;
  pointerTarget = { x: 0, y: 0 };
  pointer = { x: 0, y: 0 };
  configureScrolling();
  measure(true);
  updateRenderMode();
}

function renderUI(state) {
  const uiKey = `${state.scene}:${state.transition.toFixed(4)}`;
  if (uiKey !== lastUIKey) {
    panels.forEach((panel, i) => {
      let alpha = 0;
      let offset = 0;
      if (i === state.scene) {
        alpha = 1 - smoothstep(.08, .48, state.transition);
        offset = quiet ? 0 : -12 * (1 - alpha);
      } else if (i === state.scene + 1) {
        alpha = smoothstep(.52, .92, state.transition);
        offset = quiet ? 0 : 16 * (1 - alpha);
      }
      panel.style.opacity = String(alpha);
      panel.style.transform = `translate3d(0,${offset}px,0)`;
      panel.classList.toggle('is-visible', alpha > .001);
    });
    lastUIKey = uiKey;
  }
  const active = state.transition > .7 ? Math.min(6, state.scene + 1) : state.scene;
  if (active !== lastActive) {
    panels.forEach((panel, i) => {
      panel.classList.toggle('is-current', i === active);
      panel.inert = i !== active;
      panel.setAttribute('aria-hidden', String(i !== active));
    });
    rail.forEach((anchor, i) => {
      if (i === active) anchor.setAttribute('aria-current', 'step');
      else anchor.removeAttribute('aria-current');
    });
    document.getElementById('chapter-number').textContent = String(active).padStart(2, '0');
    document.getElementById('chapter-name').textContent = CHAPTERS[active].name;
    root.dataset.chapter = CHAPTERS[active].id;
    lastActive = active;
  }
  const colors = colorsForState(state);
  if (colors.page !== lastPageColor) {
    root.style.setProperty('--page', colors.page);
    root.style.setProperty('--ink', colors.ink);
    root.style.setProperty('--muted', colors.muted);
    root.style.setProperty('--accent', colors.accent);
    root.dataset.theme = colors.dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]').content = colors.page;
    lastPageColor = colors.page;
  }
  const progress = state.scene + state.local;
  if (Math.abs(progress - lastProgress) > .0005) {
    rail.forEach((anchor, i) => anchor.firstElementChild.style.transform = `scaleX(${clamp(progress - i)})`);
    lastProgress = progress;
    const pressPhase = state.local < .42 ? 0 : state.local < .68 ? 1 : 2;
    document.querySelectorAll('[data-press-step]').forEach((el, i) => el.classList.toggle('is-active', state.scene === 3 && pressPhase === i));
    const finished = state.scene === 6 && state.local > .85;
    document.querySelector('.closing-thought').style.opacity = finished ? '1' : '0';
    document.querySelector('#scroll-cue span').textContent = finished ? 'A considered world' : 'Scroll to explore';
  }
}

function scheduleFrame() {
  if (frameId === null && !document.hidden && !disposed) frameId = window.requestAnimationFrame(frame);
}

function frame(timestamp) {
  frameId = null;
  if (disposed || document.hidden) return;
  lifetimeRafCallbacks++;
  const dt = lastTimestamp === null ? 0 : Math.min(timestamp - lastTimestamp, 50);
  lastTimestamp = timestamp;
  if (!openDialog && !quiet) elapsed += dt / 1000;
  if (resizePending) measure(true);
  lenis?.raf(timestamp);
  const nextState = sampleJourney(window.scrollY, metrics, view.height);
  const moving = Math.abs(nextState.scene + nextState.local - current.scene - current.local) > .00002;
  current = nextState;
  const pointerMoving = Math.abs(pointer.x - pointerTarget.x) + Math.abs(pointer.y - pointerTarget.y) > .0002;
  pointer.x += (pointerTarget.x - pointer.x) * .06;
  pointer.y += (pointerTarget.y - pointer.y) * .06;
  renderUI(current);
  const needsFrame = dirty || moving || pointerMoving || (!quiet && !openDialog);
  const interval = quality === 'low' && !moving ? 32 : 15;
  if (needsFrame && timestamp - lastRender >= interval) {
    const props = { ...current, time: elapsed, pointer, observeDepth, motion: !quiet && !openDialog, quality };
    const start = performance.now();
    if (scene3d && !contextLost && !rendererFailed) {
      try {
        scene3d.update(props);
        scene3d.render();
        if (!firstSceneFrame && !rendererFailed && !contextLost) {
          firstSceneFrame = true;
          rendererReady = true;
          root.classList.add('webgl-ready');
          status.textContent = '';
          updateRenderMode();
        }
      } catch (error) { useIllustratedEdition('render', error); }
    }
    if (!rendererReady || contextLost || rendererFailed) {
      fallback.update(props);
      fallback.render();
    }
    renderedFrames++;
    const cost = performance.now() - start;
    frameDurations.push(cost);
    if (frameDurations.length > 180) frameDurations.shift();
    // One-way automatic reduction prevents unstable switching on slow devices.
    if (!qualityIsExplicit && quality === 'high' && renderedFrames > 90 && timestamp - lastAdaptiveCheck > 3000) {
      lastAdaptiveCheck = timestamp;
      const recent = frameDurations.slice(-60);
      if (recent.reduce((a, b) => a + b, 0) / recent.length > 24) setQuality('low');
    }
    lastRender = timestamp;
    dirty = false;
  }
  scheduleFrame();
}

function closePanel(dialog, restoreFocus = true) {
  if (!dialog?.open) return;
  dialog.close();
  openDialog = null;
  document.body.classList.remove('dialog-open');
  lenis?.start();
  if (restoreFocus) dialogOpener?.focus({ preventScroll: true });
  dialogOpener = null;
  dirty = true;
}

function showPanel(id, opener) {
  const dialog = document.getElementById(id);
  if (openDialog) closePanel(openDialog, false);
  dialogOpener = opener;
  openDialog = dialog;
  lenis?.stop();
  document.body.classList.add('dialog-open');
  dialog.showModal();
  dialog.scrollTop = 0;
  dialog.querySelector('.close-dialog').focus({ preventScroll: true });
  pointerTarget = { x: 0, y: 0 };
  dirty = true;
}

function navigate(id, { immediate = false, push = true, focus = true } = {}) {
  let index = CHAPTERS.findIndex(chapter => chapter.id === id);
  if (index < 0) {
    const target = document.getElementById(id);
    index = target ? sections.indexOf(target.closest('.chapter')) : -1;
  }
  if (index < 0) return;
  if (openDialog) closePanel(openDialog, false);
  const y = scrollForState(index, index === 0 ? 0 : .14, metrics, view.height);
  const onComplete = () => {
    if (focus) sections[index].querySelector('h1, h2')?.focus({ preventScroll: true });
  };
  if (push && window.location.hash !== `#${CHAPTERS[index].id}`) history.pushState(null, '', `#${CHAPTERS[index].id}`);
  if (lenis && !immediate) lenis.scrollTo(y, { duration: 1.1, force: true, onComplete });
  else {
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
    current = sampleJourney(y, metrics, view.height);
    renderUI(current);
    onComplete();
  }
  dirty = true;
}

document.addEventListener('click', event => {
  const anchor = event.target.closest('a[href^="#"]');
  if (!anchor || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const id = anchor.getAttribute('href').slice(1);
  if (!document.getElementById(id)) return;
  event.preventDefault();
  navigate(id);
});
document.getElementById('open-index').addEventListener('click', event => showPanel('index-dialog', event.currentTarget));
document.getElementById('footer-index').addEventListener('click', event => showPanel('index-dialog', event.currentTarget));
document.getElementById('open-about').addEventListener('click', event => showPanel('about-dialog', event.currentTarget));
dialogs.forEach(dialog => {
  dialog.querySelector('.close-dialog').addEventListener('click', () => closePanel(dialog));
  dialog.addEventListener('cancel', event => { event.preventDefault(); closePanel(dialog); });
});
quietControl.addEventListener('change', () => setQuiet(quietControl.checked, true));
lightControl.addEventListener('change', () => setQuality(lightControl.checked ? 'low' : 'high', true));
reducedQuery.addEventListener('change', event => {
  if (readPreference('dose.quiet') === null && !query.has('motion')) setQuiet(event.matches);
});
depthControl.addEventListener('input', () => {
  observeDepth = clamp(Number(depthControl.value) / 1000);
  const description = depthLabel(observeDepth);
  depthOutput.textContent = description;
  depthControl.setAttribute('aria-valuetext', description);
  dirty = true;
});
window.addEventListener('pointermove', event => {
  if (quiet || openDialog || event.pointerType === 'touch' || view.width < 700) return;
  pointerTarget.x = (event.clientX / view.width - .5) * 2;
  pointerTarget.y = (event.clientY / view.height - .5) * 2;
}, { passive: true });
document.addEventListener('pointerleave', () => { pointerTarget = { x: 0, y: 0 }; });
window.addEventListener('scroll', () => { dirty = true; }, { passive: true });
window.addEventListener('resize', () => {
  if (!resizePending) resizeSnapshot = { ...current };
  resizePending = true;
  dirty = true;
}, { passive: true });
window.addEventListener('hashchange', () => navigate(window.location.hash.slice(1), { immediate: true, push: false, focus: false }));
window.addEventListener('popstate', () => navigate(window.location.hash.slice(1) || 'prologue', { immediate: true, push: false, focus: false }));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    lastTimestamp = null;
  } else {
    lastTimestamp = null;
    dirty = true;
    lenis?.resize();
    scheduleFrame();
  }
});
canvas.addEventListener('webglcontextlost', event => {
  event.preventDefault();
  contextLost = true;
  rendererReady = false;
  root.classList.remove('webgl-ready');
  status.textContent = 'The illustrated edition is keeping your place.';
  diagnostics.contextLosses++;
  updateRenderMode();
  dirty = true;
});
canvas.addEventListener('webglcontextrestored', () => {
  contextLost = false;
  rendererFailed = false;
  firstSceneFrame = false;
  diagnostics.contextRestores++;
  measure(false);
  dirty = true;
});
window.addEventListener('pageshow', event => {
  if (event.persisted) {
    disposed = false;
    lastTimestamp = null;
    measure(false);
    scheduleFrame();
  }
});
window.addEventListener('pagehide', event => {
  if (frameId !== null) cancelAnimationFrame(frameId);
  frameId = null;
  lastTimestamp = null;
  if (!event.persisted) {
    disposed = true;
    lenis?.destroy();
    scene3d?.dispose();
    fallback.dispose();
  }
});

const diagnostics = { rendererIssue: null, contextLosses: 0, contextRestores: 0 };
Object.defineProperty(window, '__DOSE__', {
  value: Object.freeze({
    getState: () => ({ ...current, quiet, quality, observeDepth, renderer: rendererReady && !contextLost && !rendererFailed ? 'webgl' : 'canvas2d', viewport: { ...view }, dialog: openDialog?.id || null }),
    getStats: () => ({ ...diagnostics, renderedFrames, lifetimeRafCallbacks, scheduledAppFrames: frameId === null ? 0 : 1, renderTimesMs: [...frameDurations], scene: scene3d?.getStats?.() || null, scroll: window.scrollY, metrics: metrics.map(m => ({ ...m })) })
  }), writable: false, configurable: false
});

configureScrolling();
measure(false);
current = sampleJourney(window.scrollY, metrics, view.height);
renderUI(current);
updateRenderMode();
scheduleFrame();

function applyInitialHash() {
  if (initialHashApplied) return;
  initialHashApplied = true;
  measure(false);
  if (window.location.hash) navigate(window.location.hash.slice(1), { immediate: true, push: false, focus: false });
}
document.fonts.ready.then(applyInitialHash, applyInitialHash);

if (query.get('renderer') !== '2d') {
  import('./scene.js').then(({ DoseScene }) => {
    if (disposed) return;
    try {
      scene3d = new DoseScene(canvas, {
        onError: error => useIllustratedEdition('renderer', error),
        onQualityChange: () => { dirty = true; }
      });
      scene3d.resize(view.width, view.height, effectiveDpr());
      dirty = true;
    } catch (error) { useIllustratedEdition('initialization', error); }
  }).catch(error => useIllustratedEdition('loading', error));
}
