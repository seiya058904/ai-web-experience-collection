import './style.css';
import '../../shared/collection-return.css';
import 'lenis/dist/lenis.css';
import Lenis from 'lenis';
import { SCENES, clamp, mix, smoothstep, presentationAt, progressFromScroll } from './timeline.js';

const root = document.documentElement;
const body = document.body;
const canvas = document.querySelector('#spatial-stage');
const copies = [...document.querySelectorAll('.scene-copy')];
const chapterLinks = [...document.querySelectorAll('[data-index]')];
const dialog = document.querySelector('#exhibition-index');
const indexButton = document.querySelector('#open-index');
const motionButton = document.querySelector('#motion-toggle');
const focusReturn = document.querySelector('#return-labels');
const alignButton = document.querySelector('#align-view');
const viewAngle = document.querySelector('#view-angle');
const notice = document.querySelector('#render-notice');
const plateIvory = document.querySelector('.world-plate--ivory');
const plateMuseum = document.querySelector('.world-plate--museum');
const heroLayer = document.querySelector('.hero-sculpture');
const heroTitle = document.querySelector('.hero-lettering');
const counter = document.querySelector('#scene-number');
const sceneName = document.querySelector('#scene-name');
const hint = document.querySelector('#view-hint');
const journey = document.querySelector('#journey-progress');
const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
const finePointerQuery = matchMedia('(pointer: fine)');
const motionKey = 'parallax.motion.v1';

let preference = null;
try {
  const saved = localStorage.getItem(motionKey);
  if (saved === 'reduced' || saved === 'full') preference = saved;
} catch { /* A blocked preference store must not block the exhibition. */ }

let reducedMotion = preference ? preference === 'reduced' : reducedQuery.matches;
let wheelDirection = 0;
const lenis = new Lenis({
  lerp: .105, smoothWheel: !reducedMotion, syncTouch: false,
  autoRaf: false, autoResize: false, respectReducedMotion: false,
  prevent: node => Boolean(node.closest('dialog')),
  virtualScroll: ({ deltaY, event }) => {
    if (event.type !== 'wheel' || event.ctrlKey || !deltaY) return true;
    const direction = Math.sign(deltaY);
    if (wheelDirection && direction !== wheelDirection && lenis.isScrolling === 'smooth')
      lenis.scrollTo(lenis.animatedScroll, { immediate: true });
    wheelDirection = direction;
    return true;
  },
});
let previousFrameTime = 0;
let scrollClock = 0;
let stage = null;
let stageReady = false;
let stageFailed = false;
let initializing = false;
let initGeneration = 0;
let disposed = false;
let span = 1;
let width = innerWidth;
let height = innerHeight;
let pixelRatio = 1;
let frame = 0;
let activeScene = 0;
let focusArtwork = false;
let alignLocked = false;
let pendingNavigation = null;
let dialogReturnFocus = indexButton;
const pointer = { x: 0, y: 0 };
const targetPointer = { x: 0, y: 0 };
const listeners = [];

function on(target, name, callback, options) {
  target.addEventListener(name, callback, options);
  listeners.push(() => target.removeEventListener(name, callback, options));
}

function invalidate() {
  if (!frame && !disposed && !document.hidden) frame = requestAnimationFrame(draw);
}

function setMotion(next, persist = false) {
  reducedMotion = next;
  lenis.options.smoothWheel = !next;
  lenis.scrollTo(scrollY, { immediate: true, force: true });
  if (persist) {
    preference = next ? 'reduced' : 'full';
    try { localStorage.setItem(motionKey, preference); } catch { /* Optional persistence. */ }
  }
  root.dataset.motion = next ? 'reduced' : 'full';
  motionButton.setAttribute('aria-pressed', String(next));
  document.querySelector('#motion-state').textContent = next ? 'On' : 'Off';
  targetPointer.x = targetPointer.y = 0;
  pointer.x = pointer.y = 0;
  alignLocked = false;
  viewAngle.value = '0';
  viewAngle.setAttribute('aria-valuetext', 'Aligned viewpoint');
  if (next && pendingNavigation !== null) {
    const destination = pendingNavigation;
    pendingNavigation = null;
    lenis.scrollTo(destination * span, { immediate: true, force: true });
  }
  updateAccessibleControls();
  invalidate();
}

function stopPendingNavigation() {
  if (pendingNavigation === null) return;
  pendingNavigation = null;
  // Cancel the chapter destination before Lenis consumes fresh wheel input.
  lenis.scrollTo(window.scrollY, { immediate: true, force: true });
  invalidate();
}

function measure(preserve = true) {
  const previous = progressFromScroll(window.scrollY, span);
  const previousWidth = width, previousHeight = height;
  width = window.innerWidth;
  height = window.innerHeight;
  // Keep 4K native detail without over-rendering very dense phone screens.
  pixelRatio = Math.min(devicePixelRatio || 1, width < 700 ? 1.75 : 2, Math.sqrt(9_000_000 / (width * height)));
  span = Math.round(height * (width < 700 ? 1.38 : 1.60));
  root.style.setProperty('--scene-span', `${span}px`);
  stage?.resize(width, height, pixelRatio);
  lenis.resize();
  // A changed viewport preserves the authored perspective rather than the old pixel offset.
  if (preserve && (width !== previousWidth || height !== previousHeight)) {
    lenis.scrollTo(previous * span, { immediate: true, force: true });
    // Keep the destination as an index; its pixel position changes with the span.
    if (pendingNavigation !== null) {
      lenis.scrollTo(pendingNavigation * span, { immediate: reducedMotion });
    }
  }
  invalidate();
}

function navigateTo(index, { historyEntry = true, replaceHistory = false, immediate = false, lockAlignment = false } = {}) {
  const i = clamp(Math.round(index), 0, SCENES.length - 1);
  const hash = `#${SCENES[i].id}`;
  if (location.hash !== hash) {
    if (replaceHistory) history.replaceState(history.state, '', hash);
    else if (historyEntry) history.pushState(null, '', hash);
  }
  alignLocked = lockAlignment;
  targetPointer.x = targetPointer.y = 0;
  viewAngle.value = '0';
  viewAngle.setAttribute('aria-valuetext', 'Aligned viewpoint');
  const instant = immediate || reducedMotion;
  pendingNavigation = instant ? null : i;
  lenis.scrollTo(i * span, { immediate: instant });
  invalidate();
}

function updateAccessibleControls() {
  alignButton.disabled = activeScene !== 2 || !stageReady;
  viewAngle.disabled = activeScene !== 2 || !stageReady || reducedMotion;
  alignButton.tabIndex = activeScene === 2 && !focusArtwork ? 0 : -1;
  viewAngle.tabIndex = activeScene === 2 && !focusArtwork ? 0 : -1;
  document.querySelector('.scroll-invitation').tabIndex = activeScene === 0 && !focusArtwork ? 0 : -1;
  document.querySelector('.begin-again').tabIndex = activeScene === 9 && !focusArtwork ? 0 : -1;
  for (const link of chapterLinks) {
    if (Number(link.dataset.index) === activeScene) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}

function draw(time) {
  frame = 0;
  if (disposed || document.hidden) { previousFrameTime = 0; return; }
  scrollClock += previousFrameTime ? Math.min(50, Math.max(0, time - previousFrameTime)) : 1000 / 60;
  previousFrameTime = time;
  lenis.raf(scrollClock);
  const raw = progressFromScroll(scrollY, span);
  const state = presentationAt(raw, reducedMotion);
  if (pendingNavigation !== null && Math.abs(scrollY - pendingNavigation * span) <= 1) pendingNavigation = null;
  if (Math.abs(raw - 2) > .04) alignLocked = false;
  const prev = activeScene;
  activeScene = state.active;
  body.dataset.scene = String(activeScene);
  const damping = reducedMotion ? 1 : .135;
  pointer.x = mix(pointer.x, targetPointer.x, damping);
  pointer.y = mix(pointer.y, targetPointer.y, damping);
  if (Math.abs(pointer.x - targetPointer.x) < .0002) pointer.x = targetPointer.x;
  if (Math.abs(pointer.y - targetPointer.y) < .0002) pointer.y = targetPointer.y;
  const portrait = height >= width;
  const px = reducedMotion ? 0 : pointer.x * (portrait ? 0 : 9);
  const py = reducedMotion ? 0 : pointer.y * (portrait ? 0 : 5);
  root.style.setProperty('--pointer-x', `${px.toFixed(3)}px`);
  root.style.setProperty('--pointer-y', `${py.toFixed(3)}px`);
  root.style.setProperty('--darkness', state.darkness.toFixed(4));
  // Keep navigation legible when a visitor pauses halfway between light and dark rooms.
  const ink = state.darkness > .48 ? [241, 235, 224] : [23, 22, 17];
  const ground = [233, 226, 214].map((v, i) => Math.round(mix(v, [8, 8, 9][i], state.darkness)));
  root.style.setProperty('--ink', `rgb(${ink.join(' ')})`);
  root.style.setProperty('--base', `rgb(${ground.join(' ')})`);
  plateIvory.style.opacity = state.ivory.toFixed(4);
  plateMuseum.style.opacity = state.museum.toFixed(4);
  const hero = stageReady ? state.hero : 1;
  root.style.setProperty('--hero-opacity', hero.toFixed(4));
  heroTitle.style.opacity = (reducedMotion ? Number(activeScene === 0) : 1 - smoothstep(.08, .30, raw)).toFixed(4);
  canvas.style.opacity = stageReady ? (1 - state.hero).toFixed(4) : '0';
  if (!stageReady && raw > .7) {
    // A clearly labelled still exhibition stays composed if live rendering cannot start.
    const far = activeScene === 9;
    heroLayer.style.transform = `translate(${px}px,${py}px) scale(${far ? .43 : .78})`;
    heroLayer.style.filter = state.darkness > .5 ? `brightness(${activeScene === 7 ? .24 : .62})` : '';
  } else {
    // Match the photographic opening's scale and centre to the spatial form
    // before their short handoff. The title leaves before the next caption enters.
    const pull = stageReady && !reducedMotion ? smoothstep(.06, .31, raw) : 0;
    heroLayer.style.transform = raw < .7 && pull > 0
      ? `translate(${px}px,${py + pull * height * (portrait ? .055 : .24)}px) scale(${1 - pull * (portrait ? .28 : .32)})`
      : '';
    heroLayer.style.filter = '';
  }
  copies.forEach((copy, i) => {
    const opacity = state.captionWeights[i];
    copy.style.opacity = opacity.toFixed(4);
    copy.style.transform = reducedMotion ? 'none' : `translateY(${((1 - opacity) * 16).toFixed(2)}px)`;
    copy.style.pointerEvents = i === activeScene && opacity > .2 && !focusArtwork ? 'auto' : 'none';
  });
  counter.textContent = String(activeScene + 1).padStart(2, '0');
  sceneName.textContent = SCENES[activeScene].name;
  journey.style.transform = `scaleX(${(raw / 9).toFixed(5)})`;
  hint.textContent = !reducedMotion && finePointerQuery.matches && [1, 2, 3, 5, 6].includes(activeScene)
    ? activeScene === 2 ? 'Move gently to shift the view' : 'Move to observe'
    : '';
  if (prev !== activeScene) {
    updateAccessibleControls();
    if (activeScene !== 2) {
      viewAngle.value = '0';
      viewAngle.setAttribute('aria-valuetext', 'Aligned viewpoint');
    }
  }
  if (stageReady) {
    try {
      stage.render({ progress: state.progress, reducedMotion, pointer: reducedMotion ? { x: 0, y: 0 } : pointer, alignLocked, width, height });
    } catch (error) { rendererFailed(error); }
  }
  if (lenis.isScrolling === 'smooth' || Math.abs(pointer.x - targetPointer.x) > .0002 || Math.abs(pointer.y - targetPointer.y) > .0002) invalidate();
  else previousFrameTime = 0;
}

function rendererFailed(error) {
  if (disposed) return;
  stageReady = false;
  stageFailed = true;
  canvas.dataset.ready = 'false';
  canvas.dataset.state = 'still';
  body.classList.add('still-view');
  notice.hidden = false;
  notice.dataset.reason = error?.name || 'WebGLUnavailable';
  updateAccessibleControls();
  invalidate();
}

async function initializeStage() {
  if (initializing || disposed) return;
  initializing = true;
  const generation = ++initGeneration;
  try {
    stage?.dispose();
    stage = null;
    const { createSpatialStage } = await import('./spatial.js');
    const next = await createSpatialStage(canvas, { onError: rendererFailed });
    if (disposed || generation !== initGeneration) { next.dispose(); return; }
    stage = next;
    stage.resize(width, height, pixelRatio);
    const state = presentationAt(progressFromScroll(scrollY, span), reducedMotion);
    stage.render({ progress: state.progress, reducedMotion, pointer: { x: 0, y: 0 }, alignLocked, width, height });
    stageReady = true;
    stageFailed = false;
    canvas.dataset.ready = 'true';
    canvas.dataset.state = 'live';
    body.classList.remove('still-view');
    notice.hidden = true;
    updateAccessibleControls();
    invalidate();
  } catch (error) { rendererFailed(error); }
  finally { initializing = false; }
}

function openIndex() {
  stopPendingNavigation();
  lenis.stop();
  dialogReturnFocus = document.activeElement;
  dialog.showModal();
  body.classList.add('index-open');
  indexButton.setAttribute('aria-expanded', 'true');
}

function closeIndex() {
  if (dialog.open) dialog.close();
  // Resume synchronously: a chapter link starts its destination in this event.
  if (lenis.isStopped) lenis.start();
}

function setFocusArtwork(next) {
  focusArtwork = next;
  body.classList.toggle('focus-artwork', next);
  focusReturn.hidden = !next;
  updateAccessibleControls();
  if (next) focusReturn.focus({ preventScroll: true });
  else indexButton.focus({ preventScroll: true });
  invalidate();
}

on(indexButton, 'click', openIndex);
on(document.querySelector('#close-index'), 'click', closeIndex);
on(dialog, 'close', () => {
  if (lenis.isStopped) lenis.start();
  body.classList.remove('index-open');
  indexButton.setAttribute('aria-expanded', 'false');
  if (!focusArtwork) (dialogReturnFocus?.isConnected ? dialogReturnFocus : indexButton).focus({ preventScroll: true });
  invalidate();
});
on(motionButton, 'click', () => setMotion(!reducedMotion, true));
on(document.querySelector('#focus-artwork'), 'click', () => { closeIndex(); setFocusArtwork(true); });
on(focusReturn, 'click', () => setFocusArtwork(false));
on(reducedQuery, 'change', () => { if (!preference) setMotion(reducedQuery.matches); });
on(finePointerQuery, 'change', invalidate);
on(document.querySelector('#retry-renderer'), 'click', initializeStage);
on(alignButton, 'click', () => {
  alignLocked = true;
  targetPointer.x = targetPointer.y = pointer.x = pointer.y = 0;
  viewAngle.value = '0';
  viewAngle.setAttribute('aria-valuetext', 'Aligned viewpoint');
  navigateTo(2, { historyEntry: false, replaceHistory: true, immediate: true, lockAlignment: true });
  invalidate();
});
on(viewAngle, 'input', () => {
  alignLocked = false;
  targetPointer.x = Number(viewAngle.value);
  targetPointer.y = 0;
  viewAngle.setAttribute('aria-valuetext', Math.abs(targetPointer.x) < .02 ? 'Aligned viewpoint' : `${Math.round(Math.abs(targetPointer.x) * 100)} percent ${targetPointer.x < 0 ? 'left' : 'right'}`);
  invalidate();
});
on(document, 'click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  const id = link.getAttribute('href').slice(1);
  const index = SCENES.findIndex(scene => scene.id === id);
  if (index < 0) return;
  event.preventDefault();
  closeIndex();
  navigateTo(index);
});
on(window, 'scroll', invalidate, { passive: true });
lenis.on('virtual-scroll', invalidate);
on(window, 'resize', () => measure(true), { passive: true });
on(window, 'wheel', stopPendingNavigation, { passive: true, capture: true });
on(window, 'pointerdown', stopPendingNavigation, { passive: true });
on(window, 'touchstart', stopPendingNavigation, { passive: true });
on(window, 'keydown', event => {
  if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) stopPendingNavigation();
});
on(window, 'pointermove', event => {
  if (reducedMotion || !finePointerQuery.matches || dialog.open || event.pointerType === 'touch') return;
  if (event.target.closest('button,a,input,dialog')) return;
  alignLocked = false;
  targetPointer.x = clamp(event.clientX / width * 2 - 1, -1, 1);
  targetPointer.y = clamp(event.clientY / height * 2 - 1, -1, 1);
  if (activeScene === 2) {
    viewAngle.value = String(targetPointer.x);
    viewAngle.setAttribute('aria-valuetext', Math.abs(targetPointer.x) < .02 ? 'Aligned viewpoint' : `${Math.round(Math.abs(targetPointer.x) * 100)} percent ${targetPointer.x < 0 ? 'left' : 'right'}`);
  }
  invalidate();
}, { passive: true });
on(document.documentElement, 'pointerleave', event => {
  // Touch pointers leave the document after every lift. Keep the explicit
  // range selection; only a departing mouse should reset hover parallax.
  if (event.pointerType === 'touch' || !finePointerQuery.matches) return;
  targetPointer.x = targetPointer.y = 0;
  if (activeScene === 2) {
    viewAngle.value = '0';
    viewAngle.setAttribute('aria-valuetext', 'Aligned viewpoint');
  }
  invalidate();
});
on(window, 'popstate', () => {
  const index = SCENES.findIndex(scene => `#${scene.id}` === location.hash);
  if (index >= 0) navigateTo(index, { historyEntry: false, immediate: true });
  else invalidate();
});
on(document, 'visibilitychange', () => {
  if (document.hidden) {
    pendingNavigation = null;
    lenis.scrollTo(scrollY, { immediate: true, force: true });
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    previousFrameTime = 0;
  } else { measure(true); invalidate(); }
});
on(window, 'pagehide', event => {
  pendingNavigation = null;
  lenis.scrollTo(scrollY, { immediate: true, force: true });
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
  previousFrameTime = 0;
  if (!event.persisted) disposeExhibition();
});
on(window, 'pageshow', event => {
  previousFrameTime = 0;
  measure(event.persisted);
  lenis.scrollTo(scrollY, { immediate: true, force: true });
  invalidate();
});
on(canvas, 'webglcontextlost', event => {
  event.preventDefault();
  rendererFailed(new Error('WebGL context lost'));
  // Retire handles while their context is lost. Disposing them after restore
  // would send stale GPU objects to the replacement context.
  const lostStage = stage;
  stage = null;
  lostStage?.dispose();
});
on(canvas, 'webglcontextrestored', initializeStage);
for (const img of document.querySelectorAll('img')) on(img, 'load', invalidate, { once: true });

root.classList.add('enhanced');
measure(false);
setMotion(reducedMotion);
updateAccessibleControls();
const initialChapter = SCENES.findIndex(scene => `#${scene.id}` === location.hash);
if (initialChapter >= 0) navigateTo(initialChapter, { historyEntry: false, immediate: true });
invalidate();
initializeStage();
document.fonts.ready.then(invalidate);

/** Read-only inspection of the exhibition state, used by the local acceptance checks. */
export function exhibitionState() {
  return {
    progress: progressFromScroll(scrollY, span), activeScene, scene: SCENES[activeScene].id,
    reducedMotion, focusArtwork, indexOpen: dialog.open, width, height, pixelRatio,
    ready: stageReady, stillView: stageFailed, pointer: { ...pointer }, alignLocked,
    pendingNavigation: pendingNavigation === null ? null : { index: pendingNavigation, scene: SCENES[pendingNavigation].id },
    spatial: stage?.diagnostics() ?? null,
  };
}

/** Release local resources when embedding or replacing the exhibition. */
export function disposeExhibition() {
  disposed = true;
  initGeneration++;
  if (frame) cancelAnimationFrame(frame);
  listeners.splice(0).forEach(remove => remove());
  stage?.dispose();
  lenis.destroy();
  if (dialog.open) dialog.close();
  body.classList.remove('index-open');
}

import.meta.hot?.dispose(disposeExhibition);
