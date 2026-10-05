/// <reference types="vite/client" />

import Lenis from 'lenis';
import { Sculpture } from './sculpture.ts';
import { CHAPTERS, getChapterIndex } from './score.ts';
import './style.css';

function required<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing interface element: ${selector}`);
  return element;
}

const root = document.documentElement;
const canvas = required<HTMLCanvasElement>('#sculpture');
const track = required<HTMLElement>('#scroll-track');
const wordElements = Array.from(document.querySelectorAll<HTMLElement>('[data-word]'));
const wordSpans = wordElements.map((element) => required<HTMLSpanElement>(`[data-word="${element.dataset.word}"] > span`));
const caption = required<HTMLElement>('#caption-text');
const captionJapanese = required<HTMLElement>('#caption-jp');
const chapterNumber = required<HTMLElement>('#chapter-number');
const chapterName = required<HTMLElement>('#chapter-name');
const chapterReadout = required<HTMLButtonElement>('#chapter-readout');
const announcement = required<HTMLElement>('#chapter-announcement');
const progressBar = required<HTMLElement>('#progress');
const progressFill = required<HTMLElement>('#progress-fill');
const motionButton = required<HTMLButtonElement>('#motion-toggle');
const motionLabel = required<HTMLElement>('#motion-label');
const edgeButton = required<HTMLButtonElement>('#edge-action');
const edgeLabel = required<HTMLElement>('#edge-label');
const dialog = required<HTMLDialogElement>('#index');
const openIndex = required<HTMLButtonElement>('#open-index');
const closeIndex = required<HTMLButtonElement>('#close-index');
const chapterLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.chapter-link'));
const markers = CHAPTERS.map((chapter) => required<HTMLElement>(`#${chapter.id}`));
const fallbackField = required<HTMLElement>('.fallback-field');
const fallbackFace = required<HTMLElement>('.fallback-face');
const fallbackSide = required<HTMLElement>('.fallback-side');
const fallbackOpening = required<HTMLElement>('.fallback-aperture');
const abort = new AbortController();
const { signal } = abort;
const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const motionStorageKey = 'kage-void:motion';

function storedMotion(): string | null {
  try { return localStorage.getItem(motionStorageKey); } catch { return null; }
}

function saveMotion(enabled: boolean): void {
  try { localStorage.setItem(motionStorageKey, enabled ? 'on' : 'off'); } catch { /* Motion still works when storage is unavailable. */ }
}

// The system preference always determines the initial state. A deliberate press
// may opt into motion for this visit; a later system change is honored again.
let reducedMotion = mediaQuery.matches || storedMotion() === 'off';
const lenis = new Lenis({
  autoRaf: false,
  autoResize: false,
  smoothWheel: !reducedMotion,
  syncTouch: false,
  lerp: 0.095,
  wheelMultiplier: 1,
  touchMultiplier: 1,
  anchors: false,
  stopInertiaOnNavigate: true,
  respectReducedMotion: false,
});

let sculpture: Sculpture | null = null;
let prepared = false;
let contextLost = false;
let preparationGeneration = 0;
let preparationTimeout: ReturnType<typeof setTimeout> | undefined;
let disposed = false;
let frameRequest = 0;
let previousFrameTime = 0;
let clockMilliseconds = 0;
let elapsedSeconds = 0;
let progress = 0;
let previousProgress = -1;
let currentChapter = -1;
let previousPercent = -1;
let scrollRange = 1;
let viewportWidth = 0;
let viewportHeight = 0;
let travelHeight = 0;
let resizePending = true;
let dirty = true;
let menuOpen = false;
let previousFocus: HTMLElement | null = null;
let pendingChapter: number | null = null;
let edgeState = '';
const pointer = { x: 0, y: 0 };
const pointerTarget = { x: 0, y: 0 };

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smoothstep = (start: number, end: number, value: number) => {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};

function requestFrame(): void {
  if (!disposed && !document.hidden && !menuOpen && frameRequest === 0) {
    frameRequest = requestAnimationFrame(frame);
  }
}

function pauseClock(): void {
  if (frameRequest) cancelAnimationFrame(frameRequest);
  frameRequest = 0;
  previousFrameTime = 0;
}

function markDirty(): void {
  dirty = true;
  requestFrame();
}

function applyMotion(): void {
  root.dataset.motion = reducedMotion ? 'reduced' : 'on';
  motionLabel.textContent = reducedMotion ? 'OFF' : 'ON';
  motionButton.setAttribute('aria-pressed', String(!reducedMotion));
  motionButton.setAttribute('aria-label', reducedMotion ? 'Enable motion and smooth scrolling' : 'Reduce motion and use native scrolling');
  motionButton.title = reducedMotion ? 'Reduced motion · static chapters and native scrolling' : 'Motion on · continuous transformation';
  lenis.options.smoothWheel = !reducedMotion;
  // Cancel any unfinished easing when changing modes, without changing position.
  lenis.scrollTo(window.scrollY, { immediate: true, force: true });
  pointerTarget.x = pointerTarget.y = 0;
  pointer.x = pointer.y = 0;
  previousFrameTime = 0;
  previousProgress = -1;
  markDirty();
}

function measure(): void {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const mobile = width <= 760;
  const firstMeasure = viewportWidth === 0;
  const preservedProgress = firstMeasure ? clamp(window.scrollY / Math.max(1, track.offsetHeight - height)) : progress;

  // Mobile browser chrome can change height during a swipe. Keep its scroll
  // distance steady, while giving real resizes/orientation changes a new score.
  if (firstMeasure || !mobile || Math.abs(width - viewportWidth) > 24 || Math.abs(height - viewportHeight) > 160) {
    travelHeight = height;
  }
  viewportWidth = width;
  viewportHeight = height;
  scrollRange = Math.max(1, Math.round(travelHeight * (mobile ? 9.6 : 11.6)));
  track.style.height = `${scrollRange + height}px`;
  markers.forEach((marker, index) => { marker.style.top = `${CHAPTERS[index].at * scrollRange}px`; });
  lenis.resize();
  lenis.scrollTo(preservedProgress * scrollRange, { immediate: true, force: true });
  sculpture?.resize(width, height);
  progress = preservedProgress;
  previousProgress = -1;
  resizePending = false;
  dirty = true;
}

function updateTypography(value: number): void {
  wordElements.forEach((element, index) => {
    const chapter = CHAPTERS[index];
    const enterAt = index === 0 ? -1 : (CHAPTERS[index - 1].at + chapter.at) / 2;
    const exitAt = index === CHAPTERS.length - 1 ? 2 : (chapter.at + CHAPTERS[index + 1].at) / 2;
    const enter = index === 0 ? 1 : smoothstep(enterAt - 0.018, enterAt + 0.018, value);
    const exit = index === CHAPTERS.length - 1 ? 0 : smoothstep(exitAt - 0.018, exitAt + 0.018, value);
    const visible = enter > 0.001 && exit < 0.999;
    element.classList.toggle('is-visible', visible);
    if (!visible) return;

    if (reducedMotion) {
      element.style.clipPath = 'none';
      element.classList.toggle('is-visible', index === getChapterIndex(value));
      wordSpans[index].style.transform = 'none';
      return;
    }

    // The outgoing word is cut from one side as the next enters the same cut.
    // No timers: reversing the wheel restores exactly the same composition.
    element.style.clipPath = `inset(0 ${(1 - enter) * 100}% 0 ${exit * 100}%)`;
    const hold = clamp((value - chapter.at + 0.05) / 0.1);
    const displacement = (1 - enter) * 3.5 - exit * 4.5 - hold * 0.22;
    wordSpans[index].style.transform = `translate3d(${displacement}vw, 0, 0)`;
  });
}

function updateInterface(value: number): void {
  root.dataset.progress = value.toFixed(5);
  progressFill.style.transform = `scaleX(${value})`;
  const percent = Math.round(value * 100);
  if (percent !== previousPercent) {
    progressBar.setAttribute('aria-valuenow', String(percent));
    previousPercent = percent;
  }

  const index = getChapterIndex(value);
  if (index !== currentChapter) {
    const chapter = CHAPTERS[index];
    const number = String(index + 1).padStart(2, '0');
    root.dataset.chapter = chapter.id;
    root.dataset.chapterIndex = String(index);
    chapterNumber.textContent = number;
    chapterName.textContent = chapter.title;
    caption.textContent = chapter.caption;
    captionJapanese.textContent = chapter.jp;
    chapterReadout.setAttribute('aria-label', `Chapter ${index + 1} of ${CHAPTERS.length}: ${chapter.title}. Open chapter index`);
    if (currentChapter !== -1) announcement.textContent = `${number}. ${chapter.title}. ${chapter.caption}`;
    chapterLinks.forEach((link, linkIndex) => {
      if (linkIndex === index) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    currentChapter = index;
  }

  const nextEdgeState = value < 0.042 ? 'enter' : value > 0.967 ? 'replay' : 'hidden';
  if (nextEdgeState !== edgeState) {
    edgeButton.classList.toggle('is-hidden', nextEdgeState === 'hidden');
    edgeButton.classList.toggle('is-replay', nextEdgeState === 'replay');
    edgeButton.tabIndex = nextEdgeState === 'hidden' ? -1 : 0;
    edgeButton.setAttribute('aria-hidden', String(nextEdgeState === 'hidden'));
    edgeLabel.textContent = nextEdgeState === 'replay' ? 'REPLAY' : 'SCROLL TO ENTER';
    edgeButton.setAttribute('aria-label', nextEdgeState === 'replay' ? 'Replay the sculpture from the beginning' : 'Enter the sculpture');
    edgeState = nextEdgeState;
  }
  updateTypography(value);
}

function updateFallback(value: number): void {
  const black = currentChapter === 1 || currentChapter === 3 || currentChapter === 5;
  root.style.setProperty('--fallback-bg', black ? '#080808' : '#fff');
  root.style.setProperty('--fallback-ink', black ? '#f7f7f7' : '#080808');
  root.style.setProperty('--fallback-side', black ? '#747474' : '#454545');
  const rotation = reducedMotion ? 0 : Math.sin(value * Math.PI * 2) * 5;
  fallbackField.style.transform = `rotate(${rotation}deg)`;
  const line = currentChapter === 1;
  const open = currentChapter === 2 || currentChapter === 3 || currentChapter === 7;
  fallbackFace.style.transform = `skewY(-13deg) scaleX(${line ? 0.014 : 1})`;
  fallbackSide.style.opacity = line || open ? '0' : '1';
  fallbackOpening.style.background = open ? 'var(--fallback-bg)' : 'transparent';
  fallbackOpening.style.width = open ? '11%' : '';
}

function showFallback(): void {
  root.dataset.render = 'fallback';
  prepared = false;
  updateFallback(progress);
  markDirty();
}

function prepareSculpture(): void {
  if (!sculpture || disposed || contextLost) return;
  const activeSculpture = sculpture;
  const generation = ++preparationGeneration;
  if (preparationTimeout) clearTimeout(preparationTimeout);
  preparationTimeout = setTimeout(() => {
    if (!prepared && generation === preparationGeneration && !disposed) showFallback();
  }, 8000);
  Promise.resolve().then(() => activeSculpture.prepare()).then(() => {
    if (disposed || contextLost || generation !== preparationGeneration) return;
    if (preparationTimeout) clearTimeout(preparationTimeout);
    prepared = true;
    markDirty();
  }).catch(() => {
    if (disposed || generation !== preparationGeneration) return;
    if (preparationTimeout) clearTimeout(preparationTimeout);
    showFallback();
  });
}

function frame(now: number): void {
  frameRequest = 0;
  if (disposed || document.hidden || menuOpen) return;
  const delta = previousFrameTime ? Math.min((now - previousFrameTime) / 1000, 0.05) : 0;
  previousFrameTime = now;
  clockMilliseconds += delta * 1000;
  if (!reducedMotion) elapsedSeconds += delta;
  if (resizePending) measure();
  lenis.raf(clockMilliseconds);
  progress = clamp(window.scrollY / scrollRange);

  const pointerEase = 1 - Math.exp(-delta * 5.5);
  pointer.x += (pointerTarget.x - pointer.x) * pointerEase;
  pointer.y += (pointerTarget.y - pointer.y) * pointerEase;

  if (progress !== previousProgress || dirty) {
    updateInterface(progress);
    if (!prepared || contextLost) updateFallback(progress);
    previousProgress = progress;
  }

  if (sculpture && prepared && !contextLost) {
    try {
      sculpture.render(progress, elapsedSeconds, reducedMotion, pointer);
      root.dataset.render = 'webgl';
    } catch {
      showFallback();
    }
  }

  dirty = false;
  // Reduced motion and the static fallback render on demand. There is never
  // a second animation loop, an offscreen loop, or a catch-up after tab restore.
  if ((!reducedMotion && prepared) || lenis.isScrolling === 'smooth' || resizePending) requestFrame();
}

function navigateToChapter(index: number, updateHash = true): void {
  const chapter = CHAPTERS[Math.max(0, Math.min(CHAPTERS.length - 1, index))];
  if (updateHash) {
    try { history.replaceState(history.state, '', `#${chapter.id}`); } catch { /* Navigation still works in restricted documents. */ }
  }
  if (resizePending) measure();
  lenis.scrollTo(chapter.at * scrollRange, {
    immediate: reducedMotion,
    duration: 1.05,
    easing: (t) => 1 - Math.pow(1 - t, 4),
    force: true,
  });
  markDirty();
}

function showIndex(): void {
  if (menuOpen || disposed) return;
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : openIndex;
  lenis.stop();
  menuOpen = true;
  root.dataset.indexOpen = 'true';
  openIndex.setAttribute('aria-expanded', 'true');
  pauseClock();
  dialog.showModal();
}

function afterIndexClose(): void {
  if (!menuOpen) return;
  menuOpen = false;
  root.dataset.indexOpen = 'false';
  openIndex.setAttribute('aria-expanded', 'false');
  lenis.start();
  previousFocus?.focus({ preventScroll: true });
  previousFocus = null;
  if (pendingChapter !== null) {
    navigateToChapter(pendingChapter);
    pendingChapter = null;
  }
  markDirty();
}

openIndex.addEventListener('click', showIndex, { signal });
chapterReadout.addEventListener('click', showIndex, { signal });
document.querySelectorAll<HTMLAnchorElement>('[data-open-index]').forEach((link) => {
  link.addEventListener('click', (event) => { event.preventDefault(); showIndex(); }, { signal });
});
closeIndex.addEventListener('click', () => dialog.close(), { signal });
dialog.addEventListener('close', afterIndexClose, { signal });
chapterLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    pendingChapter = Number(link.dataset.chapter);
    dialog.close();
  }, { signal });
});
required<HTMLAnchorElement>('[data-home]').addEventListener('click', (event) => {
  event.preventDefault();
  navigateToChapter(0);
}, { signal });
edgeButton.addEventListener('click', () => navigateToChapter(edgeState === 'replay' ? 0 : 1), { signal });
motionButton.addEventListener('click', () => {
  reducedMotion = !reducedMotion;
  saveMotion(!reducedMotion);
  applyMotion();
}, { signal });
mediaQuery.addEventListener('change', () => {
  reducedMotion = mediaQuery.matches || storedMotion() === 'off';
  applyMotion();
}, { signal });

window.addEventListener('scroll', markDirty, { passive: true, signal });
window.addEventListener('resize', () => { resizePending = true; markDirty(); }, { passive: true, signal });
window.addEventListener('pointermove', (event) => {
  if (event.pointerType !== 'mouse' || reducedMotion || menuOpen) return;
  pointerTarget.x = (event.clientX / Math.max(1, viewportWidth) - 0.5) * 2;
  pointerTarget.y = (event.clientY / Math.max(1, viewportHeight) - 0.5) * 2;
}, { passive: true, signal });
document.addEventListener('pointerleave', () => { pointerTarget.x = pointerTarget.y = 0; }, { passive: true, signal });
window.addEventListener('blur', () => { pointerTarget.x = pointerTarget.y = 0; }, { signal });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseClock();
  else { previousFrameTime = 0; markDirty(); }
}, { signal });
window.addEventListener('pagehide', pauseClock, { signal });
window.addEventListener('pageshow', () => { resizePending = true; previousFrameTime = 0; markDirty(); }, { signal });
window.addEventListener('hashchange', () => {
  const index = CHAPTERS.findIndex((chapter) => `#${chapter.id}` === location.hash);
  if (index >= 0) navigateToChapter(index, false);
}, { signal });

canvas.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  contextLost = true;
  preparationGeneration += 1;
  showFallback();
}, { signal });
canvas.addEventListener('webglcontextrestored', () => {
  contextLost = false;
  sculpture?.resize(viewportWidth, viewportHeight);
  prepareSculpture();
}, { signal });

const stopVirtualScroll = lenis.on('virtual-scroll', markDirty);
applyMotion();
measure();

// Keep the semantic edition in sync with the single authored chapter score.
CHAPTERS.forEach((chapter, index) => {
  markers[index].querySelector('p')!.textContent = chapter.caption;
  const japanese = chapterLinks[index].querySelector<HTMLElement>('.index-jp');
  if (japanese) japanese.textContent = chapter.jp;
});

const initialChapter = CHAPTERS.findIndex((chapter) => `#${chapter.id}` === location.hash);
if (initialChapter >= 0) {
  lenis.scrollTo(CHAPTERS[initialChapter].at * scrollRange, { immediate: true, force: true });
  progress = CHAPTERS[initialChapter].at;
}
updateInterface(progress);

try {
  sculpture = new Sculpture(canvas);
  sculpture.resize(viewportWidth, viewportHeight);
  prepareSculpture();
} catch {
  showFallback();
}
markDirty();

function dispose(): void {
  disposed = true;
  preparationGeneration += 1;
  pauseClock();
  if (preparationTimeout) clearTimeout(preparationTimeout);
  abort.abort();
  stopVirtualScroll();
  if (dialog.open) dialog.close();
  lenis.destroy();
  sculpture?.dispose();
}

if (import.meta.hot) import.meta.hot.dispose(dispose);

import '../../shared/collection-return.css';
