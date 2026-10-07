import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import './style.css';
import '../../shared/collection-return.css';
import { createStage } from './stage.js';
import { createMarbling } from './marbling.js';
import { CHAPTERS, clamp, mix, smooth, sampleTimeline, copyOpacity } from './timeline.js';

const root = document.documentElement;
const copies = [...document.querySelectorAll('.scene-copy')];
const hero = document.querySelector('#volume-still');
const bookCanvas = document.querySelector('#book-canvas');
const marbleCanvas = document.querySelector('#marble-canvas');
const stageShade = document.querySelector('.stage-shade');
const contents = document.querySelector('#contents');
const colophon = document.querySelector('#colophon');
const contentsToggle = document.querySelector('#contents-toggle');
const motionToggle = document.querySelector('#motion-toggle');
const openButton = document.querySelector('#open-cover');
const links = [...document.querySelectorAll('[data-chapter]')];
const media = matchMedia('(prefers-reduced-motion: reduce)');
const lifetime = new AbortController();
const listen = (target, type, handler, options = {}) => target.addEventListener(type, handler, { ...options, signal: lifetime.signal });
const sections = [...document.querySelectorAll('.chapter')];
const chapterIds = sections.map(section => section.id);
const previousRestoration = history.scrollRestoration;
history.scrollRestoration = 'manual';
const pointer = { x: 0, y: 0 };
const targetPointer = { x: 0, y: 0 };
let motionOverride = null;
try { const saved = localStorage.getItem('codex-motion'); if (saved !== null) motionOverride = saved === 'off'; } catch { /* Private browsing can disallow storage. */ }
let reducedMotion = motionOverride ?? media.matches;
let lenis, stage, marble, unit = 1, viewport = { width: innerWidth, height: innerHeight };
let currentChapter = -1, openTarget = 0, openValue = 0, frame = 0, lastTime = 0;
let dirty = true, lastPosition = -1, lastDraw = 0, disposed = false;
let position = 0, hasWebGL = true;
let pendingFocus = null;
let resizeTimer, checkpointTimer, suspended = false;

function savePosition() {
  clearTimeout(checkpointTimer);
  if (unit <= 1 || disposed) return;
  history.replaceState({ ...history.state, codexPosition: { hash: location.hash, position: clamp(window.scrollY / unit, 0, 9.9999) } }, '');
}

function suspend() {
  suspended = true;
  cancelAnimationFrame(frame); frame = 0;
  lenis?.stop(); lastTime = 0;
}

function resume() {
  if (disposed || document.hidden) return;
  suspended = false; lastTime = 0; dirty = true;
  lenis?.scrollTo(window.scrollY, { immediate: true, force: true });
  if (!contents.open && !colophon.open) lenis?.start();
  if (!frame) frame = requestAnimationFrame(animate);
}

function dispose() {
  savePosition();
  disposed = true; suspend(); lifetime.abort();
  clearTimeout(resizeTimer); clearTimeout(checkpointTimer);
  lenis?.destroy(); stage?.dispose(); marble?.dispose();
  sections.forEach((section, i) => { section.id = chapterIds[i]; });
  history.scrollRestoration = previousRestoration;
}

function createScrollAuthority() {
  lenis?.destroy();
  lenis = new Lenis({
    autoRaf: false,
    lerp: 0.105,
    smoothWheel: !reducedMotion,
    respectReducedMotion: motionOverride === null,
    syncTouch: false,
    wheelMultiplier: 0.92,
    touchMultiplier: 1,
    anchors: false,
    prevent: node => Boolean(node.closest('dialog')),
  });
  lenis.on('scroll', () => { dirty = true; });
  if (contents.open || colophon.open || suspended || document.hidden) lenis.stop();
}

function setMotionState() {
  motionToggle.setAttribute('aria-pressed', String(!reducedMotion));
  document.querySelector('#motion-state').textContent = reducedMotion ? 'off' : 'on';
  root.classList.toggle('motion-reduced', reducedMotion);
}

function updateSize(preservePosition = false) {
  const oldUnit = unit;
  const oldPosition = oldUnit > 1 ? window.scrollY / oldUnit : 0;
  viewport = { width: innerWidth, height: innerHeight };
  unit = viewport.height * (viewport.width < 760 ? 1.48 : 1.4);
  root.style.setProperty('--chapter-length', `${unit}px`);
  root.style.setProperty('--viewport-height', `${viewport.height}px`);
  stage?.resize(viewport.width, viewport.height);
  marble?.resize(viewport.width, viewport.height, devicePixelRatio || 1);
  lenis?.resize();
  if (preservePosition && oldUnit > 1) lenis?.scrollTo(oldPosition * unit, { immediate: true, force: true });
  dirty = true;
}

function closeContents() {
  if (contents.open) contents.close();
  contentsToggle.setAttribute('aria-expanded', 'false');
  if (!colophon.open && !suspended && !document.hidden) lenis?.start();
  dirty = true;
}
function closeColophon() { if (colophon.open) colophon.close(); if (!contents.open && !suspended && !document.hidden) lenis?.start(); dirty = true; }

function navigate(index, { immediate = false, focus = false, changeHash = true } = {}) {
  const n = clamp(Number(index), 0, 9);
  closeContents(); closeColophon();
  if (n === 0) { openTarget = 0; openValue = 0; openButton.setAttribute('aria-pressed', 'false'); openButton.firstChild.textContent = 'Open the cover'; }
  const target = (n + (n === 0 ? 0 : 0.12)) * unit;
  lenis.scrollTo(target, { immediate: immediate || reducedMotion, duration: 1.5, force: true, onComplete: () => {
    if (focus) { pendingFocus = n; dirty = true; }
  } });
  if (changeHash) history.replaceState({ ...history.state }, '', n === 0 ? `${location.pathname}${location.search}` : `#${CHAPTERS[n][0]}`);
  dirty = true;
}

function setCurrentChapter(index) {
  if (index === currentChapter) return;
  currentChapter = index;
  const [id, title, roman] = CHAPTERS[index];
  const label = document.querySelector('#chapter-label');
  label.children[0].textContent = roman; label.children[2].textContent = title;
  document.querySelector('#mobile-count').textContent = `${String(index + 1).padStart(2, '0')} / 10`;
  document.querySelector('#previous-chapter').disabled = index === 0;
  document.querySelector('#next-chapter').disabled = index === 9;
  links.forEach(a => { if (Number(a.dataset.chapter) === index) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); });
  root.dataset.chapter = id;
}

function updateUI(state) {
  root.style.setProperty('--ground', state.background);
  root.style.setProperty('--ink', state.ink);
  root.style.setProperty('--muted', state.muted);
  root.style.setProperty('--ui-ink', state.uiInk);
  document.querySelector('meta[name="theme-color"]').setAttribute('content', state.background);
  setCurrentChapter(state.chapter);
  copies.forEach((copy, index) => {
    let opacity = copyOpacity(state.position, index);
    if (index === 0 && state.position < 0.05) opacity = 1;
    copy.style.opacity = opacity.toFixed(4);
    copy.style.visibility = opacity > 0.001 ? 'visible' : 'hidden';
    const isCurrent = state.chapter === index && opacity > 0.08;
    copy.inert = !isCurrent;
    copy.setAttribute('aria-hidden', String(!isCurrent));
    copy.classList.toggle('is-current', isCurrent);
  });
  if (pendingFocus !== null && state.chapter === pendingFocus) {
    const heading = copies[pendingFocus].querySelector('h1,h2');
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    pendingFocus = null;
  }
  document.querySelector('#rail-progress').style.transform = `scaleX(${state.total})`;
  const heroExit = smooth(0.5, 0.98, state.position);
  hero.style.opacity = String(1 - smooth(0.68, 1.0, state.position));
  hero.style.visibility = state.position < 1.01 || !hasWebGL ? 'visible' : 'hidden';
  hero.style.transform = reducedMotion ? 'none' : `translate3d(${heroExit * -7}%,${heroExit * -8}%,0) scale(${1 + heroExit * 1.55})`;
  let spatialOpacity = smooth(0.81, 1.06, state.position);
  if (state.chapter === 5) spatialOpacity *= 1 - smooth(0.82, 1, state.progress);
  if (state.chapter === 6) spatialOpacity = smooth(0.89, 1, state.progress);
  bookCanvas.style.opacity = String(spatialOpacity);
  const marblePhase = state.position - 6;
  const marbleAlpha = smooth(-0.18, 0.01, marblePhase) * (1 - smooth(0.87, 1.03, marblePhase));
  marbleCanvas.style.opacity = String(marbleAlpha);
  marbleCanvas.style.visibility = marbleAlpha > 0.001 ? 'visible' : 'hidden';
  stageShade.style.opacity = String(marbleAlpha);
}

function animate(ms) {
  frame = 0;
  if (disposed || suspended || document.hidden) return;
  frame = requestAnimationFrame(animate);
  const dt = Math.min((ms - (lastTime || ms)) / 1000, 0.1); lastTime = ms;
  lenis.raf(ms);
  position = clamp(window.scrollY / unit, 0, 9.9999);
  const changed = Math.abs(position - lastPosition) > 0.000008;
  const pointerMoving = !reducedMotion && Math.abs(pointer.x - targetPointer.x) + Math.abs(pointer.y - targetPointer.y) > 0.001;
  const opening = Math.abs(openTarget - openValue) > 0.0005;
  pointer.x = reducedMotion ? 0 : mix(pointer.x, targetPointer.x, 1 - Math.exp(-dt * 6));
  pointer.y = reducedMotion ? 0 : mix(pointer.y, targetPointer.y, 1 - Math.exp(-dt * 6));
  openValue = reducedMotion ? openTarget : mix(openValue, openTarget, 1 - Math.exp(-dt * 4.5));
  if (document.hidden || contents.open || colophon.open) return;
  const living = !reducedMotion && position > 0.9 && position < 9.99 && ms - lastDraw > 1000 / 30;
  if (!(dirty || changed || pointerMoving || opening || living)) return;
  const state = sampleTimeline(position);
  if (dirty || changed) updateUI(state);
  if (stage && (state.chapter > 0 || position > 0.8) && (state.chapter !== 6 || state.progress > 0.86)) {
    const actual = state.chapter === 0 ? { ...state, chapter: 1, progress: 0 } : state;
    stage.update({ ...actual, time: ms / 1000, reducedMotion, pointer, open: openValue });
  }
  if (marble && position > 5.8 && position < 7.04) {
    marble.update({ progress: clamp(position - 6), time: ms / 1000, reducedMotion, pointer, ...viewport, mobile: viewport.width < 760 });
  }
  lastDraw = ms; lastPosition = position; dirty = false;
}

function markFallback() { hasWebGL = false; document.body.classList.add('no-webgl'); dirty = true; }

root.classList.add('enhanced');
// Virtual chapter URLs retain their authored names without browser fragment
// scrolling moving fixed copy or competing with the document scroll authority.
sections.forEach(section => { section.id += '-view'; });
setMotionState(); createScrollAuthority(); updateSize();
const savedPosition = history.state?.codexPosition;
const navigationType = performance.getEntriesByType('navigation')[0]?.type;
const canRestore = ['reload', 'back_forward'].includes(navigationType) && savedPosition?.hash === location.hash && Number.isFinite(savedPosition?.position) && savedPosition.position >= 0 && savedPosition.position <= 9.9999;
const initialChapter = CHAPTERS.findIndex(c => `#${c[0]}` === location.hash);
if (canRestore) lenis.scrollTo(savedPosition.position * unit, { immediate: true, force: true });
else if (initialChapter > 0) navigate(initialChapter, { immediate: true, changeHash: false });
updateUI(sampleTimeline(clamp(window.scrollY / unit, 0, 9.9999)));
resume();

listen(contentsToggle, 'click', () => {
  contents.showModal(); contentsToggle.setAttribute('aria-expanded', 'true'); lenis.stop();
});
listen(document.querySelector('#contents-close'), 'click', closeContents);
listen(contents, 'close', () => { contentsToggle.setAttribute('aria-expanded', 'false'); if (!colophon.open && !suspended && !document.hidden) lenis.start(); dirty = true; });
listen(document.querySelector('#colophon-toggle'), 'click', () => { closeContents(); colophon.showModal(); lenis.stop(); });
listen(document.querySelector('#colophon-close'), 'click', closeColophon);
listen(colophon, 'close', () => { if (!contents.open && !suspended && !document.hidden) lenis.start(); dirty = true; });
links.forEach(link => listen(link, 'click', event => { event.preventDefault(); navigate(link.dataset.chapter, { focus: event.detail === 0 }); }));
listen(document.querySelector('#previous-chapter'), 'click', () => navigate(currentChapter - 1));
listen(document.querySelector('#next-chapter'), 'click', () => navigate(currentChapter + 1));
listen(document.querySelector('.skip-link'), 'click', event => { event.preventDefault(); navigate(currentChapter < 0 ? 0 : currentChapter, { focus: true, immediate: true }); });

listen(openButton, 'click', () => {
  openTarget = openTarget > 0.5 ? 0 : 1;
  openButton.setAttribute('aria-pressed', String(openTarget === 1));
  openButton.firstChild.textContent = openTarget ? 'Close the cover' : 'Open the cover';
  dirty = true;
});
listen(motionToggle, 'click', () => {
  reducedMotion = !reducedMotion;
  motionOverride = reducedMotion;
  try { localStorage.setItem('codex-motion', reducedMotion ? 'off' : 'on'); } catch { /* preference remains effective for this visit */ }
  setMotionState(); createScrollAuthority(); dirty = true;
});
listen(media, 'change', event => { if (motionOverride !== null) return; reducedMotion = event.matches; setMotionState(); createScrollAuthority(); dirty = true; });
listen(window, 'pointermove', event => {
  if (event.pointerType === 'touch') return;
  targetPointer.x = (event.clientX / viewport.width) * 2 - 1;
  targetPointer.y = (event.clientY / viewport.height) * 2 - 1;
}, { passive: true });
listen(document, 'pointerleave', () => { targetPointer.x = 0; targetPointer.y = 0; });
listen(window, 'resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => updateSize(true), 120); });
listen(window, 'hashchange', () => { const i = CHAPTERS.findIndex(c => `#${c[0]}` === location.hash); if (i >= 0) navigate(i, { immediate: true, changeHash: false }); });
listen(window, 'scroll', () => { clearTimeout(checkpointTimer); checkpointTimer = setTimeout(savePosition, 120); }, { passive: true });
listen(document, 'visibilitychange', () => { if (document.hidden) { savePosition(); suspend(); } else resume(); });
listen(window, 'pagehide', event => { if (event.persisted) { savePosition(); suspend(); } else dispose(); });
listen(window, 'pageshow', event => { if (event.persisted) resume(); });

await document.fonts.ready;
const results = await Promise.allSettled([
  createStage(bookCanvas, { mobile: viewport.width < 760, onContextLost: markFallback }),
  createMarbling(marbleCanvas),
]);
if (disposed) {
  results.forEach(result => { if (result.status === 'fulfilled') result.value.dispose(); });
} else {
  if (results[0].status === 'fulfilled') stage = results[0].value;
  else { console.warn('CODEX spatial edition unavailable.', results[0].reason); markFallback(); }
  if (results[1].status === 'fulfilled') marble = results[1].value;
  else console.warn('CODEX marbling plate unavailable.', results[1].reason);
  // Resource readiness cannot replay an initial hash over input made meanwhile.
  updateSize(true); root.classList.add('is-ready'); dirty = true;
}
