import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import 'lenis/dist/lenis.css';
import './style.css';
import '../../shared/collection-return.css';
import { createWorld } from './world.js';
import { createFallback } from './fallback.js';
import { createUI, MOBILE_BREAKPOINT } from './ui.js';
import { CHAPTERS, clamp, sampleJourney, chapterProgress, scrollLength } from './journey.js';

gsap.registerPlugin(ScrollTrigger);
gsap.ticker.lagSmoothing(0);

const track = document.getElementById('scroll-track');
const status = document.getElementById('render-status');
const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
let canvas = document.getElementById('world');
let world;
let lenis;
let scrollTrigger;
let ui;
let maxScroll = 1;
let progress = 0;
let ambientTime = 0;
let dirty = true;
let ready = false;
let disposed = false;
let fallback = false;
let resizeTimer;
let previousProgress = -1;
let pendingNavigation = null;
let keyboardTarget = null;
let navigationSerial = 0;
let qualityFrames = 0;
let qualityTime = 0;
let qualityAfter = Infinity;
const state = {
  paused: false,
  reduced: reducedQuery.matches,
  mobile: innerWidth <= MOBILE_BREAKPOINT,
  menu: false,
  material: 'clear',
  lightAngle: 0,
  daylight: 0,
  pointer: { x: 0, y: 0 }
};
const pointerTarget = { x: 0, y: 0 };

try { state.paused = sessionStorage.getItem('glasshouse-motion-paused') === 'yes'; } catch { /* Storage is optional. */ }

function navigation(index, immediate = false) {
  const i = clamp(index, 0, CHAPTERS.length - 1);
  const nextProgress = chapterProgress(i);
  const targetY = nextProgress * maxScroll;
  const serial = ++navigationSerial;
  pendingNavigation = nextProgress;
  keyboardTarget = null;
  ui?.setMenuOpen(false);
  if (lenis) lenis.scrollTo(targetY, {
    immediate: immediate || state.reduced,
    duration: 1.65,
    force: true,
    easing: t => 1 - Math.pow(1 - t, 3),
    onComplete: () => { if (navigationSerial === serial) pendingNavigation = null; }
  });
  else window.scrollTo(0, targetY);
  history.replaceState(null, '', `#${CHAPTERS[i].id}`);
  dirty = true;
}

ui = createUI(document.getElementById('ui'), {
  onNavigate: index => navigation(index),
  onMotionChange: paused => {
    state.paused = paused;
    try { sessionStorage.setItem('glasshouse-motion-paused', paused ? 'yes' : 'no'); } catch { /* Optional preference. */ }
    dirty = true;
  },
  onMaterialChange: material => { state.material = material.toLowerCase(); dirty = true; },
  onLightAngle: angle => { state.lightAngle = Number(angle); dirty = true; },
  onDaylight: angle => { state.daylight = Number(angle); dirty = true; },
  onMenuChange: open => {
    state.menu = open;
    if (open) lenis?.stop();
    else if (!document.hidden) lenis?.start();
    dirty = true;
  }
});

function updateGeometry(preserve = true) {
  const oldProgress = preserve ? (pendingNavigation ?? clamp(window.scrollY / maxScroll)) : 0;
  keyboardTarget = null;
  state.mobile = innerWidth <= MOBILE_BREAKPOINT;
  const w = innerWidth, h = innerHeight;
  maxScroll = scrollLength(h, state);
  track.style.height = `${maxScroll + h}px`;
  document.documentElement.style.setProperty('--view-height', `${h}px`);
  document.documentElement.classList.toggle('reduced-motion', state.reduced);
  lenis?.resize();
  if (preserve) {
    if (lenis) lenis.scrollTo(oldProgress * maxScroll, { immediate: true, force: true });
    else window.scrollTo(0, oldProgress * maxScroll);
    pendingNavigation = null;
  }
  world?.resize(w, h, state.mobile);
  scrollTrigger?.refresh();
  progress = clamp(window.scrollY / maxScroll);
  ScrollTrigger.update();
  dirty = true;
}

updateGeometry(false);
lenis = new Lenis({
  autoRaf: false,
  autoResize: false,
  lerp: 0.12,
  smoothWheel: true,
  syncTouch: false,
  respectReducedMotion: true,
  overscroll: false,
  wheelMultiplier: 1
});
lenis.on('scroll', ScrollTrigger.update);
scrollTrigger = ScrollTrigger.create({
  trigger: track,
  start: 'top top',
  end: () => maxScroll,
  invalidateOnRefresh: true,
  onUpdate: self => { progress = self.progress; dirty = true; }
});

function enterFallback() {
  if (fallback || disposed) return;
  fallback = true;
  ready = false;
  world?.dispose();
  const replacement = canvas.cloneNode(false);
  canvas.replaceWith(replacement);
  canvas = replacement;
  world = createFallback(canvas);
  world.resize(innerWidth, innerHeight);
  document.documentElement.classList.add('quiet-renderer');
  status.textContent = 'A quieter view is active.';
  ready = true;
  dirty = true;
}

function onContextLost(event) {
  event.preventDefault();
  enterFallback();
}

function onPointer(event) {
  if (event.pointerType === 'touch' || state.reduced || state.paused || state.menu) return;
  pointerTarget.x = clamp(event.clientX / innerWidth * 2 - 1, -1, 1);
  pointerTarget.y = clamp(1 - event.clientY / innerHeight * 2, -1, 1);
}

function onPointerLeave() { pointerTarget.x = 0; pointerTarget.y = 0; }
function onDirectInput() { pendingNavigation = null; navigationSerial++; keyboardTarget = null; }
function onKeyboardScroll(event) {
  if (state.menu || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.target instanceof Element && event.target.closest('input, textarea, select, button, [contenteditable="true"]')) return;
  const page = innerHeight * .88;
  const movement = { ArrowDown: 64, ArrowUp: -64, PageDown: page, PageUp: -page, ' ': event.shiftKey ? -page : page };
  if (!(event.key in movement) && event.key !== 'Home' && event.key !== 'End') return;
  event.preventDefault();
  // Held keys auto-repeat every ~33ms. Chaining each repeat to the previous
  // destination keeps the real scroll moving at the key's own speed instead of
  // restarting a long tween from a lagging position on every repeat.
  const base = keyboardTarget ?? lenis?.targetScroll ?? window.scrollY;
  const destination = event.key === 'Home' ? 0 : event.key === 'End' ? maxScroll
    : clamp(base + movement[event.key], 0, maxScroll);
  pendingNavigation = null;
  navigationSerial++;
  keyboardTarget = destination;
  lenis?.scrollTo(destination, { immediate: state.reduced, duration: .38, easing: t => 1 - Math.pow(1 - t, 3) });
  dirty = true;
}
function onResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { updateGeometry(true); }, 120);
}
function onReducedChange() {
  state.reduced = reducedQuery.matches;
  pointerTarget.x = 0; pointerTarget.y = 0;
  updateGeometry(true);
}
function onVisibility() {
  qualityFrames = 0;
  qualityTime = 0;
  if (document.hidden) { lenis.stop(); pendingNavigation = null; }
  else {
    lenis.resize();
    if (!state.menu) lenis.start();
    progress = clamp(window.scrollY / maxScroll);
    ScrollTrigger.update();
    dirty = true;
  }
}
function onPageShow(event) {
  if (event.persisted) {
    updateGeometry(true);
    if (!state.menu && !document.hidden) lenis.start();
    dirty = true;
  }
}
function onHashChange() {
  const index = CHAPTERS.findIndex(c => `#${c.id}` === location.hash);
  if (index >= 0) navigation(index, state.reduced);
}

window.addEventListener('pointermove', onPointer, { passive: true });
window.addEventListener('wheel', onDirectInput, { passive: true });
window.addEventListener('touchstart', onDirectInput, { passive: true });
window.addEventListener('keydown', onKeyboardScroll);
document.addEventListener('pointerleave', onPointerLeave);
window.addEventListener('resize', onResize, { passive: true });
window.addEventListener('pageshow', onPageShow);
window.addEventListener('hashchange', onHashChange);
document.addEventListener('visibilitychange', onVisibility);
reducedQuery.addEventListener('change', onReducedChange);

function tick(time, deltaMs) {
  if (disposed) return;
  lenis.raf(time * 1000);
  if (document.hidden || state.menu) return;
  const dt = Math.min(deltaMs / 1000, 0.045);
  if (!state.paused && !state.reduced) ambientTime += dt;
  const pointerEase = 1 - Math.exp(-dt * 5);
  state.pointer.x += (pointerTarget.x - state.pointer.x) * pointerEase;
  state.pointer.y += (pointerTarget.y - state.pointer.y) * pointerEase;
  const view = sampleJourney(progress, state.reduced);
  ui.update({ ...view, paused: state.paused, reduced: state.reduced });
  const live = !state.paused && !state.reduced;
  if (ready && live && performance.now() > qualityAfter && deltaMs < 500) {
    qualityFrames++;
    qualityTime += deltaMs;
    if (qualityFrames >= 16 && qualityTime > 1400) {
      if (qualityTime / qualityFrames > 35) {
        world.lowerQuality?.();
        dirty = true;
        qualityAfter = performance.now() + 4500;
      }
      qualityFrames = 0;
      qualityTime = 0;
    }
  }
  if (ready && (live || dirty || previousProgress !== progress)) {
    // One render clock. Scrolling is smoothed once, by Lenis; geometry is a
    // pure function of its current progress and never chases a second tween.
    world.update(view, ambientTime, state);
    world.render();
    previousProgress = progress;
    dirty = false;
  }
}

async function initialize() {
  ui.update({ ...sampleJourney(progress, state.reduced), paused: state.paused, reduced: state.reduced });
  try {
    await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 1500))]);
    if (disposed) return;
    world = createWorld(canvas, state);
    world.resize(innerWidth, innerHeight, state.mobile);
    world.update(sampleJourney(progress, state.reduced), 0, state);
    world.render();
    canvas.addEventListener('webglcontextlost', onContextLost, false);
    await world.warmup();
    ready = true;
  } catch (error) {
    console.warn('GLASSHOUSE: using the Canvas interpretation.', error instanceof Error ? error.message : error);
    enterFallback();
  }
  if (disposed) return;
  const chapter = CHAPTERS.findIndex(c => `#${c.id}` === location.hash);
  if (chapter >= 0 && window.scrollY < 2) navigation(chapter, true);
  else progress = clamp(window.scrollY / maxScroll);
  document.documentElement.classList.add('is-ready');
  qualityAfter = performance.now() + 4500;
  // Keep Lenis on the already-running ticker time after asynchronous loading.
  // Rewinding its clock to zero here can briefly reverse an early wheel input.
  tick(gsap.ticker.time, 16);
  // Re-measure after fonts have their final metrics without reinitializing
  // the canvas, camera, scroll controller or any of the materials.
  document.fonts.ready.then(() => {
    if (!disposed) {
      lenis.resize();
      world.resize(innerWidth, innerHeight, state.mobile);
      ScrollTrigger.refresh(true);
      dirty = true;
    }
  });
}

// Input keeps responding while fonts, the projection texture and shader
// programs prepare; the first optical frame adopts that same live position.
gsap.ticker.add(tick);
initialize();

function dispose() {
  if (disposed) return;
  disposed = true;
  clearTimeout(resizeTimer);
  gsap.ticker.remove(tick);
  scrollTrigger?.kill();
  lenis?.destroy();
  ui?.dispose();
  world?.dispose();
  canvas.removeEventListener('webglcontextlost', onContextLost);
  window.removeEventListener('pointermove', onPointer);
  window.removeEventListener('wheel', onDirectInput);
  window.removeEventListener('touchstart', onDirectInput);
  window.removeEventListener('keydown', onKeyboardScroll);
  document.removeEventListener('pointerleave', onPointerLeave);
  window.removeEventListener('resize', onResize);
  window.removeEventListener('pageshow', onPageShow);
  window.removeEventListener('hashchange', onHashChange);
  document.removeEventListener('visibilitychange', onVisibility);
  reducedQuery.removeEventListener('change', onReducedChange);
  window.removeEventListener('pagehide', onPageHide);
}
function onPageHide(event) {
  if (!event.persisted) dispose();
}
window.addEventListener('pagehide', onPageHide);
if (import.meta.hot) import.meta.hot.dispose(dispose);
