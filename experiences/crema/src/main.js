import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import PorousWorld from './visuals/PorousWorld.js';
import LiquidWorld from './visuals/LiquidWorld.js';
import Soundscape from './Soundscape.js';

gsap.registerPlugin(ScrollTrigger);

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const $ = (selector) => document.querySelector(selector);
const chapters = [...document.querySelectorAll('.chapter')];
const panels = chapters.map((chapter) => chapter.querySelector('.chapter-content'));
const ids = chapters.map((chapter) => chapter.id);
const names = ['MACHINE', 'PARTICLE', 'BED', 'PRE-INFUSION', 'PRESSURE', 'PERCOLATION', 'EXTRACTION', 'FIRST DROP', 'STREAM', 'CREMA', 'CUP'];
const assets = Object.fromEntries(['machine', 'bed', 'granule', 'crema', 'cup'].map((key) => [key, new URL(`${import.meta.env.BASE_URL}crema/assets/${key}.webp`, location.href).href]));
const state = { stage: 0, width: innerWidth, height: innerHeight, unit: 1, time: 0, active: -1, pointer: { x: 0, y: 0 }, pointerTarget: { x: 0, y: 0 }, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches, gpu: true, contextLost: false, frames: 0, draws: 0 };
const media = matchMedia('(prefers-reduced-motion: reduce)');
let manualMotion = null;
let renderer, porous, liquid;
let visibilityFrame = !document.hidden;
let disposed = false;
let pageSuspended = false;
let tickerActive = false;
let resizePending = false;
const lifecycle = new AbortController();
const listen = (target, type, handler, options = {}) => target.addEventListener(type, handler, { ...options, signal: lifecycle.signal });
let lastTick = null;
let sceneTrigger;
let resizeTimer;
let dialogOpener;
let compositionKey = '';
let renderRevision = 0;
let lastRenderKey = '';
const previousAssetLoad = THREE.DefaultLoadingManager.onLoad;
const assetLoadComplete = () => { if (!disposed) renderRevision++; };
THREE.DefaultLoadingManager.onLoad = assetLoadComplete;

// Lenis is the only scroll authority. ScrollTrigger reads it; the same GSAP
// ticker drives Lenis, scene state, the WebGL render and the optional sound.
let wheelDirection = 0;
const lenis = new Lenis({
  autoRaf: false, lerp: .105, smoothWheel: true, syncTouch: false,
  wheelMultiplier: 1, anchors: false, respectReducedMotion: false,
  prevent: (node) => Boolean(node.closest?.('dialog')),
  virtualScroll: ({ deltaY, event }) => {
    if (state.reducedMotion || event.type !== 'wheel' || event.ctrlKey || event.lenisStopPropagation || lenis.isStopped || lenis.isLocked || !deltaY) return true;
    const direction = Math.sign(deltaY);
    // The new gesture starts at the displayed position, without the old target.
    if (wheelDirection && direction !== wheelDirection) { lenis.stop(); lenis.start(); }
    wheelDirection = direction;
    return true;
  },
});
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.lagSmoothing(0);

const machineImage = $('#machine-image');
const machineFrame = $('.machine-frame');
const cupFrame = $('.cup-frame');
const fallbackFrame = $('.fallback-frame');
const readingShade = $('.reading-shade');
const footerFill = $('.journey-fill');
const journeyHint = $('.journey-hint');
const indexDialog = $('#chapter-index');
const soundscape = new Soundscape();

try {
  renderer = new THREE.WebGLRenderer({ canvas: $('#world'), alpha: true, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  renderer.autoClear = false;
  renderer.setClearColor(0x090b0a, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  porous = new PorousWorld({ renderer, assets });
  liquid = new LiquidWorld({ renderer, assets });
} catch (error) {
  porous?.dispose(); liquid?.dispose(); renderer?.dispose();
  porous = null; liquid = null; renderer = null;
  state.gpu = false;
  document.documentElement.classList.add('render-fallback');
  $('#world').style.display = 'none';
  console.info('CREMA: photographic reading mode is active.', error.message);
}

function resize({ keepPosition = false } = {}) {
  if (disposed) return;
  renderRevision++;
  const oldStage = clamp(window.scrollY / state.unit, 0, 10.35);
  state.width = innerWidth;
  state.height = innerHeight;
  const mobile = state.width < 700;
  state.unit = Math.round(state.height * (mobile ? 1.3 : 1.34));
  for (let i = 0; i < chapters.length; i++) chapters[i].style.height = `${i < 10 ? state.unit : state.height + state.unit * .35}px`;
  const imageHeight = mobile ? state.height * .98 : Math.max(state.height, state.width / (1672 / 941));
  const imageWidth = imageHeight * 1672 / 941;
  machineImage.style.width = `${imageWidth}px`;
  machineImage.style.height = `${imageHeight}px`;
  machineImage.style.top = `${mobile ? 0 : (state.height - imageHeight) / 2}px`;
  state.machineHeight = imageHeight;
  state.machineTop = mobile ? 0 : (state.height - imageHeight) / 2;

  if (renderer && state.gpu && porous && liquid) {
    // Cap both DPR and total shaded pixels; at 4K the photographs and DOM
    // remain native-resolution while expensive material work stays bounded.
    const pixelBudget = mobile ? 1_350_000 : 2_600_000;
    const dpr = Math.min(devicePixelRatio || 1, mobile ? 1.6 : 1.65, Math.sqrt(pixelBudget / (state.width * state.height)));
    renderer.setPixelRatio(dpr);
    renderer.setSize(state.width, state.height, false);
    porous.resize(state.width, state.height);
    liquid.resize(state.width, state.height);
  }
  lenis.resize();
  if (sceneTrigger) ScrollTrigger.refresh();
  if (keepPosition) lenis.scrollTo(oldStage * state.unit, { immediate: true, force: true });
  drawComposition();
}

function panelVisibility(index, stage) {
  if (index === 0) return 1 - smooth(.37, .76, stage);
  const enter = smooth(index - .32, index - .035, stage);
  if (index === 10) return enter;
  return enter * (1 - smooth(index + .43, index + .76, stage));
}

function updateChapter() {
  const active = clamp(Math.floor(state.stage + .34), 0, 10);
  if (active === state.active) return;
  state.active = active;
  $('#chapter-number').textContent = String(active + 1).padStart(2, '0');
  $('#chapter-name').textContent = names[active];
  const allNavigation = document.querySelectorAll('.journey-track a,.index-chapters a');
  allNavigation.forEach((link) => {
    if (link.hash === `#${ids[active]}`) link.setAttribute('aria-current', 'step');
    else link.removeAttribute('aria-current');
  });
  document.documentElement.dataset.chapter = ids[active];
}

function drawComposition() {
  const s = state.stage;
  const key = `${s}|${state.width}|${state.height}|${state.reducedMotion}|${state.gpu}|${state.contextLost}`;
  // Ambient material motion continues in WebGL during a hold. Avoid touching
  // fixed DOM panels or accessibility attributes until the composition changes.
  if (key === compositionKey) return;
  compositionKey = key;
  const mobile = state.width < 700;
  updateChapter();
  for (let i = 0; i < panels.length; i++) {
    const visibility = panelVisibility(i, s);
    const panel = panels[i];
    panel.style.opacity = visibility.toFixed(4);
    panel.classList.toggle('is-active', visibility > .004);
    const enterOffset = (1 - smooth(i - .32, i - .035, s)) * 26;
    const exitOffset = i === 0 ? -smooth(.37, .76, s) * 36 : -smooth(i + .43, i + .76, s) * 24;
    panel.style.transform = state.reducedMotion ? 'none' : `translate3d(0,${i === 0 ? exitOffset : enterOffset + exitOffset}px,0)`;
    const canInteract = visibility > .3;
    if (panel.inert === canInteract) panel.inert = !canInteract;
    panel.setAttribute('aria-hidden', visibility <= .004 ? 'true' : 'false');
  }

  // The opening is a held flash-forward. Zoom through the radial filter,
  // enter the material, then meet precisely the same steel object again.
  const opening = 1 - smooth(.57, .94, s);
  const returning = smooth(6.57, 6.98, s) * (1 - smooth(8.27, 8.82, s));
  const machineOpacity = Math.max(opening, returning);
  const isReturn = s > 6;
  const zoom = state.reducedMotion ? 1 : isReturn ? mix(1.2, 1.05, smooth(7.45, 8.6, s)) : 1 + smooth(.25, .9, s) * 1.3;
  const offsetX = isReturn && !mobile ? state.width * .18 : 0;
  const offsetY = isReturn ? state.height * (mobile ? -.17 : -.085) : 0;
  machineFrame.style.opacity = machineOpacity.toFixed(4);
  machineImage.style.transform = `translateX(-50%) translate3d(${offsetX}px,${offsetY}px,0) scale(${zoom})`;
  state.anchor = { x: .5 + offsetX / state.width, y: (state.machineTop + state.machineHeight * .412 + offsetY) / state.height };
  state.machineScale = zoom;

  const cupIn = smooth(9.43, 9.95, s);
  cupFrame.style.opacity = cupIn.toFixed(4);
  const cupScale = state.reducedMotion ? 1 : mix(2.25, 1, smooth(9.45, 10.05, s));
  cupFrame.style.transform = `scale(${cupScale})`;
  if (mobile) {
    // Shift the final object into the lower half, retaining generous space
    // for the final thought. This is a crop, not a scaled-down desktop page.
    cupFrame.style.top = `${state.height * .2}px`;
    cupFrame.style.bottom = `${-state.height * .1}px`;
  } else { cupFrame.style.top = '0'; cupFrame.style.bottom = '0'; }

  let shade = smooth(.65, 1.05, s) * (1 - smooth(6.45, 6.9, s)) * .55;
  shade = Math.max(shade, smooth(8.7, 9.05, s) * (1 - smooth(9.6, 9.97, s)) * (mobile ? .75 : .18));
  readingShade.style.opacity = shade.toFixed(4);
  footerFill.style.transform = `scaleX(${clamp(s / 10)})`;
  journeyHint.style.opacity = (1 - smooth(.18, .6, s)).toFixed(3);

  if (!state.gpu || state.contextLost) {
    const isCrema = s > 8.6 && s < 9.95;
    const image = $('#fallback-image');
    const src = isCrema ? assets.crema : assets.bed;
    if (image.src !== src) image.src = src;
    fallbackFrame.style.opacity = isCrema ? (smooth(8.6, 9, s) * (1 - cupIn)).toFixed(3) : (smooth(.65, 1, s) * (1 - smooth(6.5, 7, s))).toFixed(3);
  } else fallbackFrame.style.opacity = '0';
}

function tick(seconds) {
  if (disposed || !visibilityFrame || pageSuspended) return;
  if (resizePending) { resizePending = false; resize({ keepPosition: true }); }
  lenis.raf(seconds * 1000);
  const delta = lastTick === null ? 0 : Math.min(.05, seconds - lastTick);
  lastTick = seconds;
  if (!state.reducedMotion) state.time += delta;
  const pointerEase = 1 - Math.exp(-delta * 7);
  state.pointer.x = mix(state.pointer.x, state.pointerTarget.x, pointerEase);
  state.pointer.y = mix(state.pointer.y, state.pointerTarget.y, pointerEase);
  drawComposition();
  const renderKey = `${state.stage}|${state.width}|${state.height}|${state.reducedMotion}|${renderRevision}`;
  if (state.gpu && !state.contextLost && (!state.reducedMotion || renderKey !== lastRenderKey)) {
    // Both worlds share one displayed frame. Count their work together,
    // including the brief overlap when micro flow meets the real-scale drop.
    renderer.info.autoReset = false;
    renderer.info.reset();
    renderer.clear(true, true, true);
    const renderState = { stage: state.stage, time: state.reducedMotion ? 0 : state.time, pointer: state.reducedMotion ? { x: 0, y: 0 } : state.pointer, reducedMotion: state.reducedMotion, anchor: state.anchor, machineScale: state.machineScale };
    porous.render(renderState);
    renderer.clearDepth();
    liquid.render(renderState);
    state.draws = renderer.info.render.calls;
    lastRenderKey = renderKey;
  }
  state.frames++;
  soundscape.update(state.stage, seconds);
}

function closeIndex({ instant = false, restoreFocus = true } = {}) {
  if (disposed) return;
  const finish = () => {
    indexDialog.close();
    indexDialog.style.opacity = '';
    document.documentElement.classList.remove('dialog-open');
    document.querySelectorAll('.index-toggle').forEach((button) => button.setAttribute('aria-expanded', 'false'));
    if (visibilityFrame && !pageSuspended) lenis.start();
    if (restoreFocus) dialogOpener?.focus({ preventScroll: true });
  };
  gsap.killTweensOf(indexDialog);
  if (instant || state.reducedMotion) finish();
  else gsap.to(indexDialog, { opacity: 0, duration: .18, ease: 'power2.out', onComplete: finish });
}

function openIndex(event) {
  if (disposed || indexDialog.open) return;
  dialogOpener = event.currentTarget;
  lenis.stop();
  document.documentElement.classList.add('dialog-open');
  indexDialog.showModal();
  document.querySelectorAll('.index-toggle').forEach((button) => button.setAttribute('aria-expanded', 'true'));
  gsap.fromTo(indexDialog, { opacity: state.reducedMotion ? 1 : 0 }, { opacity: 1, duration: state.reducedMotion ? 0 : .3, ease: 'power3.out' });
}

function navigate(id, { immediate = false, focus = true } = {}) {
  const index = ids.indexOf(id);
  if (disposed || index === -1) return;
  if (indexDialog.open) closeIndex({ instant: true, restoreFocus: false });
  const target = index * state.unit;
  lenis.scrollTo(target, {
    immediate: immediate || state.reducedMotion,
    force: true,
    duration: 1.35,
    lerp: .105,
    onComplete: () => {
      if (disposed) return;
      history.replaceState(null, '', `#${id}`);
      if (focus) chapters[index].focus({ preventScroll: true });
      $('.accessibility-status').textContent = `${String(index + 1).padStart(2, '0')}. ${names[index].toLowerCase()}`;
    }
  });
}

for (const chapter of chapters) chapter.tabIndex = -1;
document.querySelectorAll('a[href^="#"]').forEach((link) => listen(link, 'click', (event) => {
  const id = link.getAttribute('href').slice(1);
  if (!ids.includes(id)) return;
  event.preventDefault();
  navigate(id);
}));
document.querySelectorAll('.index-toggle').forEach((button) => listen(button, 'click', openIndex));
listen($('.close-index'), 'click', () => closeIndex());
listen(indexDialog, 'cancel', (event) => { event.preventDefault(); closeIndex(); });

listen($('.sound-toggle'), 'click', async () => {
  const button = $('.sound-toggle');
  button.disabled = true;
  try {
    const enabled = await soundscape.toggle();
    if (disposed) return;
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', enabled ? 'Mute sound' : 'Enable sound');
    $('.sound-label').textContent = enabled ? 'Sound on' : 'Sound off';
    $('.accessibility-status').textContent = enabled ? 'Sound enabled' : 'Sound muted';
  } catch {
    if (disposed) return;
    $('.sound-label').textContent = 'Sound unavailable';
    button.setAttribute('aria-label', 'Sound is unavailable in this browser');
  } finally { if (!disposed) button.disabled = false; }
});

function applyMotionPreference() {
  if (disposed) return;
  state.reducedMotion = manualMotion ?? media.matches;
  document.documentElement.dataset.motion = state.reducedMotion ? 'reduced' : 'full';
  $('.motion-toggle').setAttribute('aria-pressed', String(state.reducedMotion));
  $('.motion-state').textContent = state.reducedMotion ? 'On' : 'Off';
  // Resolve the OS preference and the explicit override here, so both
  // navigation and rendering follow exactly the same effective preference.
  lenis.options.smoothWheel = !state.reducedMotion;
  lenis.options.lerp = state.reducedMotion ? 1 : .105;
  lenis.scrollTo(window.scrollY, { immediate: true, force: true });
}
listen($('.motion-toggle'), 'click', () => { manualMotion = !state.reducedMotion; applyMotionPreference(); });
listen(media, 'change', applyMotionPreference);
listen(window, 'pointermove', (event) => {
  if (event.pointerType === 'touch') return;
  state.pointerTarget.x = (event.clientX / state.width - .5) * 2;
  state.pointerTarget.y = (event.clientY / state.height - .5) * 2;
}, { passive: true });
listen(window, 'pointerleave', () => { state.pointerTarget.x = 0; state.pointerTarget.y = 0; });
listen(window, 'resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { if (!disposed) resizePending = true; }, 100);
}, { passive: true });
listen(window, 'hashchange', () => navigate(location.hash.slice(1), { immediate: true, focus: false }));
listen(document, 'visibilitychange', () => {
  visibilityFrame = !document.hidden;
  if (document.hidden) suspend();
  else if (!pageSuspended) resume();
});
listen(window, 'pagehide', (event) => {
  if (event.persisted) { pageSuspended = true; suspend(); }
  else dispose();
});
listen(window, 'pageshow', (event) => {
  if (!event.persisted || disposed) return;
  pageSuspended = false; visibilityFrame = !document.hidden;
  if (visibilityFrame) resume();
});
listen($('#world'), 'webglcontextlost', (event) => {
  if (disposed) return;
  event.preventDefault(); state.contextLost = true;
  // Release old handles while the context is lost. Deleting them after Three
  // has restored its internal context would address objects from an old GPU.
  porous?.dispose();
  liquid?.dispose();
  porous = null;
  liquid = null;
  document.documentElement.classList.add('render-fallback');
});
listen($('#world'), 'webglcontextrestored', () => {
  if (disposed) return;
  try {
    // PMREM environment targets contain rendered GPU data. Recreate them,
    // together with the scene resources, after Three restores its context.
    porous = new PorousWorld({ renderer, assets });
    liquid = new LiquidWorld({ renderer, assets });
    resize();
    state.contextLost = false;
    document.documentElement.classList.remove('render-fallback');
  } catch (error) {
    porous?.dispose(); liquid?.dispose(); porous = null; liquid = null;
    console.info('CREMA: photographic reading mode remains active.', error.message);
  }
});

document.documentElement.classList.add('experience-ready');
resize();
sceneTrigger = ScrollTrigger.create({
  start: 0,
  end: () => document.documentElement.scrollHeight - innerHeight,
  onUpdate: (self) => { state.stage = clamp(self.scroll() / state.unit, 0, 10.35); },
  onRefresh: (self) => { state.stage = clamp(self.scroll() / state.unit, 0, 10.35); }
});
applyMotionPreference();
if (visibilityFrame) { gsap.ticker.add(tick); tickerActive = true; }
else lenis.stop();
document.fonts.ready.then(() => { if (!disposed) { ScrollTrigger.refresh(); renderRevision++; } });
const navigationType = performance.getEntriesByType('navigation')[0]?.type;
if (navigationType !== 'reload' && navigationType !== 'back_forward' && location.hash && ids.includes(location.hash.slice(1))) navigate(location.hash.slice(1), { immediate: true, focus: false });

// Read-only production diagnostics for local QA; no hidden state mutation.
Object.defineProperty(window, '__CREMA__', {
  value: Object.freeze({
    snapshot: () => ({
      stage: state.stage,
      chapter: ids[state.active],
      viewport: [state.width, state.height],
      unit: state.unit,
      gpu: state.gpu,
      contextLost: state.contextLost,
      reducedMotion: state.reducedMotion,
      frames: state.frames,
      drawCalls: state.draws,
      pixelRatio: renderer?.getPixelRatio() ?? 0,
      sound: soundscape.enabled,
      // Copies expose the registration evidence without giving QA a way to
      // steer the experience or modify either visual world's live state.
      liquidAnchor: state.anchor ? { ...state.anchor } : null,
      porousHandoff: porous?.handoff ? { ...porous.handoff } : null,
      renderer: renderer ? {
        geometries: renderer.info.memory.geometries,
        textures: renderer.info.memory.textures,
      } : null,
    }),
  }),
  writable: false,
});

function suspend() {
  if (disposed) return;
  if (tickerActive) { gsap.ticker.remove(tick); tickerActive = false; }
  lenis.scrollTo(window.scrollY, { immediate: true, force: true });
  lenis.stop(); lastTick = null;
  soundscape.suspend().catch(() => {});
}

function resume() {
  if (disposed || document.hidden || pageSuspended) return;
  if (state.width !== innerWidth || state.height !== innerHeight) resize({ keepPosition: true });
  lenis.resize();
  lenis.scrollTo(window.scrollY, { immediate: true, force: true });
  if (!indexDialog.open) lenis.start();
  ScrollTrigger.update();
  state.stage = clamp(window.scrollY / state.unit, 0, 10.35);
  lastTick = null; renderRevision++;
  if (!tickerActive) { gsap.ticker.add(tick); tickerActive = true; }
  soundscape.resume().catch(() => {});
}

function dispose() {
  if (disposed) return;
  disposed = true; lifecycle.abort(); clearTimeout(resizeTimer);
  if (tickerActive) gsap.ticker.remove(tick);
  tickerActive = false; gsap.killTweensOf(indexDialog);
  sceneTrigger?.kill(); lenis.destroy();
  if (THREE.DefaultLoadingManager.onLoad === assetLoadComplete) THREE.DefaultLoadingManager.onLoad = previousAssetLoad;
  porous?.dispose(); liquid?.dispose(); renderer?.dispose(); soundscape.dispose();
}
if (import.meta.hot) import.meta.hot.dispose(dispose);
