import './styles.css';
import 'lenis/dist/lenis.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { ObjectWorld } from './world/world.js';
import { createUI } from './ui.js';
import { CHAPTERS, samplePose, chapterPosition, clamp, smooth } from './director.js';

gsap.registerPlugin(ScrollTrigger);
gsap.ticker.lagSmoothing(0);
ScrollTrigger.config({ ignoreMobileResize: true, autoRefreshEvents: 'none' });

const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
const controls = {
  reduced: preference.matches,
  finish: 0,
  light: 50,
  section: null,
  structureOpen: true,
  structureFactor: 1,
  assemblyOpen: null,
  assemblyTarget: null,
  orbit: 0
};
let world, lenis, trigger, lastTime = 0, lastRenderTime = 0, activeTime = 0, progress = 0;
let state = samplePose(0), mobile = window.innerWidth <= 700;
let suspended = false, destroyed = false, ready = false, lastSignature = '';
let resizeTimer, resizeProgress = null, previousChapter = -1, navigating = false;
let navigationToken = 0, pendingFocus = null, historyDirty = false;
const canvas = document.querySelector('#world');

function extent() { return Math.max(1, document.documentElement.scrollHeight - window.innerHeight); }

function settleScroll() {
  if (!lenis) return;
  const wasStopped = lenis.isStopped;
  lenis.stop();
  if (!wasStopped) lenis.start();
}

function cancelNavigation(stop = false) {
  const interrupted = navigating || pendingFocus !== null;
  navigationToken++;
  navigating = false;
  pendingFocus = null;
  if (interrupted) { historyDirty = true; lastSignature = ''; }
  if (stop && interrupted) settleScroll();
}

function createScroll() {
  lenis?.destroy();
  lenis = new Lenis({
    autoRaf: false,
    smoothWheel: !controls.reduced,
    syncTouch: false,
    lerp: .18,
    wheelMultiplier: 1,
    anchors: false,
    prevent: node => node.closest?.('#index-dialog')
  });
  lenis.on('scroll', ScrollTrigger.update);
}

function navigate(id, push = false, immediate = false) {
  const position = chapterPosition(id);
  if (position === null || suspended || destroyed) return;
  if (resizeProgress !== null) { clearTimeout(resizeTimer); resize(true); }
  cancelNavigation();
  settleScroll();
  const token = navigationToken;
  historyDirty = false;
  const target = extent() * position / 8;
  if (push) history.pushState({ chapter: id }, '', `#${id}`);
  navigating = true;
  const complete = () => {
    if (token !== navigationToken || suspended || destroyed) return;
    navigating = false;
    pendingFocus = id;
    lastSignature = '';
  };
  if (lenis) lenis.scrollTo(target, { immediate: immediate || controls.reduced, duration: .8, easing: t => 1 - Math.pow(1 - t, 3), force: true, onComplete: complete });
  else { window.scrollTo({ top: target, behavior: 'instant' }); complete(); }
  ScrollTrigger.update();
}

function setMotion(reduced) {
  if (suspended || destroyed) return;
  cancelNavigation();
  controls.reduced = reduced;
  createScroll();
  if (ui.dialog.open) lenis.stop();
  lastSignature = '';
  activeTime = Math.max(activeTime, 2);
  ScrollTrigger.refresh();
}

const ui = createUI({
  controls,
  navigate,
  onMotionChange: setMotion,
  onIndexChange: open => {
    if (open) cancelNavigation();
    if (!lenis) return;
    open ? lenis.stop() : lenis.start();
  },
  onStructureChange: open => {
    gsap.to(controls, { structureFactor: +open, duration: controls.reduced ? 0 : .65, ease: 'power2.inOut', overwrite: 'auto' });
  },
  onAssemblyChange: () => {
    if (controls.assemblyOpen === null) controls.assemblyOpen = state.te;
    controls.assemblyTarget = !(controls.assemblyTarget ?? (state.te > .45));
    gsap.to(controls, { assemblyOpen: +controls.assemblyTarget, duration: controls.reduced ? 0 : .85, ease: 'power2.inOut', overwrite: 'auto' });
  }
});

function tick(time) {
  if (destroyed || suspended || document.hidden || !world) { lastTime = time; return; }
  const dt = lastTime ? Math.min(.25, Math.max(.001, time - lastTime)) : 1 / 60;
  lastTime = time;
  lenis?.raf(time * 1000);
  progress = resizeProgress ?? clamp((lenis?.scroll ?? window.scrollY) / extent() * 8, 0, 8);
  const signature = `${progress.toFixed(5)}|${controls.finish}|${controls.light}|${controls.section}|${controls.orbit}|${controls.structureFactor}|${controls.assemblyOpen}|${controls.assemblyTarget}|${mobile}`;
  activeTime += dt;
  if (controls.reduced && ready && signature === lastSignature) return;
  if (!world.canRender()) return;
  lastSignature = signature;
  const renderDt = lastRenderTime ? Math.min(.5, Math.max(.001, time - lastRenderTime)) : 1 / 60;
  lastRenderTime = time;
  state = samplePose(progress, mobile, controls.reduced);
  const intro = controls.reduced || progress > .35 ? 1 : smooth(.12, 1.25, activeTime);
  const annotations = world.update(state, controls, renderDt, activeTime, intro);
  ui.update(state, world, annotations, mobile);
  if (pendingFocus === CHAPTERS[state.chapter].id && !ui.dialog.open) {
    document.querySelector(`#title-${pendingFocus}`)?.focus({ preventScroll: true });
    pendingFocus = null;
  }
  if (!ready) { ready = true; ui.ready(); }
  const chapterChanged = previousChapter !== state.chapter;
  if (!navigating && ((chapterChanged && activeTime > 1) || historyDirty)) {
    history.replaceState({ chapter: CHAPTERS[state.chapter].id }, '', `#${CHAPTERS[state.chapter].id}`);
    historyDirty = false;
  }
  if (chapterChanged) {
    previousChapter = state.chapter;
    if (state.chapter !== 6 && controls.assemblyOpen !== null) {
      gsap.killTweensOf(controls, 'assemblyOpen');
      controls.assemblyOpen = null;
      controls.assemblyTarget = null;
    }
  }
}

function resize(preserve = true) {
  if (!world || destroyed || suspended) return;
  const saved = resizeProgress ?? progress;
  cancelNavigation();
  settleScroll();
  mobile = window.innerWidth <= 700;
  world.resize();
  ui.resize(world.width, world.height);
  lenis?.resize();
  ScrollTrigger.refresh();
  if (preserve && ready) {
    lenis?.scrollTo(extent() * saved / 8, { immediate: true, force: true });
    progress = saved;
  }
  resizeProgress = null;
  lastSignature = '';
}

window.addEventListener('resize', () => {
  if (!world || destroyed || suspended) return;
  if (resizeProgress === null) { resizeProgress = progress; cancelNavigation(true); }
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => resize(true), 130);
});
window.addEventListener('wheel', e => { if (!e.ctrlKey && e.deltaY) cancelNavigation(true); }, { passive: true });
window.addEventListener('touchstart', () => cancelNavigation(true), { passive: true });
window.addEventListener('keydown', e => {
  if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Tab', 'Escape'].includes(e.key)) cancelNavigation(true);
});
preference.addEventListener('change', e => setMotion(e.matches));
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && !destroyed && !suspended) {
    cancelNavigation(); settleScroll();
    lastTime = 0; lenis?.resize(); ScrollTrigger.refresh(); lastSignature = '';
  }
});
window.addEventListener('pageshow', e => { if (e.persisted) { suspended = false; lastTime = 0; resize(false); } });
window.addEventListener('pagehide', e => { suspended = true; if (!e.persisted) cleanup(); });
function route() { const id = window.location.hash.slice(1); if (chapterPosition(id) !== null) navigate(id, false, true); }
window.addEventListener('popstate', route);
window.addEventListener('hashchange', route);

let pointer = null;
canvas.addEventListener('pointerdown', e => {
  if (state.chapter !== 7 || e.button !== 0) return;
  pointer = { x: e.clientX, start: controls.orbit, id: e.pointerId };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e => {
  if (!pointer || pointer.id !== e.pointerId) return;
  controls.orbit = clamp(pointer.start + (e.clientX - pointer.x) * .0035, -.8, .8);
});
function release(e) {
  if (pointer && canvas.hasPointerCapture(pointer.id)) canvas.releasePointerCapture(pointer.id);
  pointer = null;
}
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', release);
canvas.addEventListener('lostpointercapture', () => { pointer = null; });

canvas.addEventListener('webglcontextlost', e => {
  e.preventDefault();
  fallback();
});
canvas.addEventListener('webglcontextrestored', () => window.location.reload());

function fallback() {
  suspended = true;
  cancelNavigation();
  clearTimeout(resizeTimer);
  resizeProgress = null;
  gsap.ticker.remove(tick);
  gsap.killTweensOf(controls);
  trigger?.kill(); trigger = null;
  lenis?.destroy(); lenis = null;
  ui.closeIndex();
  document.documentElement.classList.remove('index-open');
  document.documentElement.style.setProperty('--surface', '#eeeae3');
  ui.fallback();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function cleanup() {
  if (destroyed) return;
  destroyed = true;
  clearTimeout(resizeTimer);
  gsap.ticker.remove(tick);
  trigger?.kill(); lenis?.destroy(); world?.dispose();
}

async function start() {
  try {
    await document.fonts.ready;
    world = new ObjectWorld(canvas);
    ui.prepareMaterials(world.materials);
    createScroll();
    trigger = ScrollTrigger.create({ trigger: '#experience', start: 'top top', end: 'bottom bottom', invalidateOnRefresh: true });
    resize(false);
    route();
    gsap.ticker.add(tick);
    if (import.meta.hot) import.meta.hot.dispose(cleanup);
  } catch (error) {
    console.error('FORM could not initialize the object world.', error);
    fallback();
    world?.dispose();
  }
}
start();
