import './style.css';
import '../../shared/collection-return.css';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextileWorld } from './visual';
import { CHAPTER_COUNT, END_RAW, chapterTarget, clamp, sampleTimeline } from './timeline';

gsap.registerPlugin(ScrollTrigger);
gsap.ticker.lagSmoothing(0);
ScrollTrigger.config({ ignoreMobileResize: true });

const html = document.documentElement;
const stage = document.querySelector<HTMLElement>('#stage')!;
const canvas = document.querySelector<HTMLCanvasElement>('#fabric-canvas')!;
const scenes = [...document.querySelectorAll<HTMLElement>('.scene')];
const heroLetters = document.querySelector<HTMLElement>('.hero-lettering')!;
const finaleLetters = document.querySelector<HTMLElement>('.finale-lettering')!;
const chapterLinks = [...document.querySelectorAll<HTMLAnchorElement>('.chapter-nav a')];
const progressLine = document.querySelector<HTMLElement>('.journey-rule span')!;
const currentChapter = document.querySelector<HTMLElement>('.current-chapter')!;
const previousButton = document.querySelector<HTMLButtonElement>('.previous-chapter')!;
const nextButton = document.querySelector<HTMLButtonElement>('.next-chapter')!;
const motionButton = document.querySelector<HTMLButtonElement>('.motion-toggle')!;
const indexMotion = document.querySelector<HTMLButtonElement>('.index-motion')!;
const indexDialog = document.querySelector<HTMLDialogElement>('#index-dialog')!;
const notesDialog = document.querySelector<HTMLDialogElement>('#notes-dialog')!;
const fallbackCloth = document.querySelector<HTMLImageElement>('.fallback-cloth')!;
const fallbackLight = document.querySelector<HTMLImageElement>('.fallback-light')!;
const threadMark = document.querySelector<HTMLElement>('.material-lines')!;
const chapterIds = ['opening', 'thread', 'drape', 'light', 'form', 'detail', 'veil'];
const chapterNames = ['Opening', 'Thread', 'Drape', 'Light', 'Form', 'Detail', 'Veil'];
const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(pointer: fine)');

let userPaused = false;
try { userPaused = localStorage.getItem('veil-motion') === 'paused'; } catch { /* Private browsing can disable storage. */ }
let reduced = reducedQuery.matches;
let lenis: Lenis | null = null;
let world: TextileWorld | null = null;
let chapterSpan = 1;
let measuredWidth = innerWidth;
let measuredHeight = innerHeight;
let active = -1;
let dirty = true;
let frameTime = 0;
let lastRaw = -1;
let lastDark = -1;
let currentRaw = 0;
let modalWasOpen = false;
let restoringDocument = true;
let resizeTimer: ReturnType<typeof setTimeout>;
type Navigation = { index: number; focusTarget: boolean };
let navigation: Navigation | null = null;
const pointer = { x: 0, y: 0 };
const targetPointer = { x: 0, y: 0 };
const material = { tension: 0.45, light: 0.66, weave: 0.55 };
let foldedTension = material.tension;
let formTween: gsap.core.Tween | null = null;
const forceStill = new URLSearchParams(location.search).get('render') === 'still';

function setupScroll(): void {
  navigation = null;
  lenis?.destroy();
  lenis = null;
  if (!reduced) {
    lenis = new Lenis({
      autoRaf: false,
      autoResize: true,
      smoothWheel: true,
      syncTouch: false,
      lerp: 0.13,
      wheelMultiplier: 1,
      anchors: false,
    });
    lenis.on('scroll', ScrollTrigger.update);
    if (indexDialog.open || notesDialog.open) lenis.stop();
  }
}

function measure(preserve = true): void {
  const previousRaw = chapterSpan > 1 ? window.scrollY / chapterSpan : 0;
  measuredWidth = innerWidth;
  measuredHeight = innerHeight;
  html.style.setProperty('--viewport-height', `${measuredHeight}px`);
  chapterSpan = measuredHeight * (reduced ? 1.15 : measuredWidth <= 700 ? 1.8 : 2.25);
  html.style.setProperty('--chapter-span', `${chapterSpan}px`);
  world?.resize(measuredWidth, measuredHeight);
  lenis?.resize();
  ScrollTrigger.refresh();
  if (preserve) {
    const top = clamp(previousRaw, 0, END_RAW) * chapterSpan;
    if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
    else window.scrollTo({ top, behavior: 'instant' });
    // A resize changes distances, not the destination chosen by the visitor.
    // Continue an in-flight chapter journey in the newly measured coordinate.
    if (navigation) dispatchNavigation(navigation, false);
  }
  dirty = true;
}

function needsMeasure(): boolean {
  return Math.abs(innerWidth - measuredWidth) > 1 ||
    Math.abs(innerHeight - measuredHeight) > (innerWidth <= 700 ? 150 : 1);
}

function flushMeasurements(): void {
  clearTimeout(resizeTimer);
  if (needsMeasure()) measure();
}

function updateMotionState(): void {
  const paused = userPaused || reduced;
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.disabled = reduced;
  const label = reduced ? 'Reduced motion follows your device setting' : paused ? 'Resume ambient motion' : 'Pause ambient motion';
  motionButton.setAttribute('aria-label', label);
  motionButton.title = label;
  indexMotion.textContent = reduced ? 'Reduced motion enabled' : label;
  indexMotion.disabled = reduced;
  html.dataset.motion = paused ? 'paused' : 'playing';
  dirty = true;
}

function toggleMotion(): void {
  if (reduced) return;
  userPaused = !userPaused;
  try { localStorage.setItem('veil-motion', userPaused ? 'paused' : 'playing'); } catch { /* Optional preference only. */ }
  updateMotionState();
}
motionButton.addEventListener('click', toggleMotion);
indexMotion.addEventListener('click', toggleMotion);

function openDialog(dialog: HTMLDialogElement): void {
  navigation = null;
  modalWasOpen = true;
  lenis?.stop();
  document.body.classList.add('dialog-open');
  dialog.showModal();
  dialog.dataset.lenisPrevent = '';
  dirty = true;
}

function closeDialog(dialog: HTMLDialogElement): void {
  if (dialog.open) dialog.close();
}

for (const dialog of [indexDialog, notesDialog]) {
  dialog.querySelector<HTMLButtonElement>('.close-dialog')!.addEventListener('click', () => closeDialog(dialog));
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    lenis?.start();
    modalWasOpen = false;
    dirty = true;
  });
}
document.querySelector('.index-toggle')!.addEventListener('click', () => openDialog(indexDialog));
document.querySelector('.notes-toggle')!.addEventListener('click', () => openDialog(notesDialog));
document.querySelector('.close-notes')!.addEventListener('click', () => closeDialog(notesDialog));

function dispatchNavigation(intent: Navigation, immediate: boolean): void {
  const top = chapterTarget(intent.index) * chapterSpan;
  const complete = () => {
    if (navigation !== intent) return;
    navigation = null;
    if (!intent.focusTarget) return;
    setActive(intent.index);
    const heading = scenes[intent.index].querySelector<HTMLElement>('h1, h2')!;
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  };
  if (lenis && !immediate) {
    const duration = clamp(Math.abs(top - window.scrollY) / chapterSpan * 1.15, .28, 1.45);
    lenis.scrollTo(top, { duration, easing: (t) => 1 - Math.pow(1 - t, 3), force: true, onComplete: complete });
  } else if (lenis) {
    lenis.scrollTo(top, { immediate: true, force: true });
    complete();
  } else {
    window.scrollTo({ top, behavior: 'instant' });
    complete();
  }
  dirty = true;
}

function goToChapter(index: number, immediate = false, changeHistory = true, focusTarget = false): void {
  const next = Math.floor(clamp(index, 0, CHAPTER_COUNT - 1));
  navigation = null;
  // A resize event can still be queued when a click is received. Compare the
  // actual viewport, rather than trusting the debounce timer to have fired.
  flushMeasurements();
  closeDialog(indexDialog);
  closeDialog(notesDialog);
  document.body.classList.remove('dialog-open');
  lenis?.start();
  if (changeHistory) history.pushState(null, '', `#${chapterIds[next]}`);
  navigation = { index: next, focusTarget };
  dispatchNavigation(navigation, immediate);
}

// Direct manipulation takes precedence over a previous navigation intent.
for (const event of ['wheel', 'touchstart', 'pointerdown'] as const) {
  window.addEventListener(event, () => {
    const interrupted = navigation !== null;
    navigation = null;
    if (interrupted && event !== 'wheel' && lenis && !lenis.isStopped && !document.hidden && !indexDialog.open && !notesDialog.open) {
      lenis.stop();
      lenis.start();
    }
  }, { passive: true, capture: true });
}

document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) => {
  const next = chapterIds.indexOf(link.getAttribute('href')!.slice(1));
  if (next < 0) return;
  link.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    goToChapter(next, false, true, link.classList.contains('skip-link') || event.detail === 0);
  });
});
previousButton.addEventListener('click', () => goToChapter(active - 1));
nextButton.addEventListener('click', () => goToChapter(active + 1));
document.addEventListener('keydown', (event) => {
  if (!lenis || indexDialog.open || notesDialog.open || event.altKey || event.ctrlKey || event.metaKey) return;
  const target = event.target as HTMLElement | null;
  if (target?.closest('input, textarea, select, button, a, [contenteditable="true"]')) return;
  if (!['Home', 'End', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', ' '].includes(event.key)) return;
  navigation = null;
  flushMeasurements();
  const base = lenis.targetScroll;
  let destination: number;
  switch (event.key) {
    case 'Home': destination = 0; break;
    case 'End': destination = chapterSpan * END_RAW; break;
    case 'PageDown': destination = base + innerHeight * .88; break;
    case 'PageUp': destination = base - innerHeight * .88; break;
    case 'ArrowDown': destination = base + 88; break;
    case 'ArrowUp': destination = base - 88; break;
    case ' ': destination = base + innerHeight * (event.shiftKey ? -.88 : .88); break;
    default: return;
  }
  event.preventDefault();
  lenis.scrollTo(clamp(destination, 0, chapterSpan * END_RAW), { duration: .58, force: true });
});
window.addEventListener('popstate', () => {
  // The initial document traversal restores the visitor's exact scroll position.
  // Later, same-document chapter history still uses the authored navigation.
  if (restoringDocument) return;
  const next = chapterIds.indexOf(location.hash.slice(1));
  if (next >= 0) goToChapter(next, true, false);
});

function connectControl(name: 'weave' | 'tension' | 'light', words: [string, string, string]): void {
  const input = document.querySelector<HTMLInputElement>(`#${name}-control`)!;
  const output = document.querySelector<HTMLElement>(`#${name}-value`)!;
  input.addEventListener('input', () => {
    gsap.killTweensOf(material, name);
    material[name] = Number(input.value) / 100;
    output.textContent = words[material[name] < 0.33 ? 0 : material[name] > 0.72 ? 2 : 1];
    if (name === 'tension') {
      formTween = null;
      foldedTension = material.tension;
      formAction.setAttribute('aria-pressed', 'false');
      formAction.querySelector('span')!.textContent = 'Release the fold';
    }
    dirty = true;
  });
}
connectControl('weave', ['Open', 'Balanced', 'Close']);
connectControl('tension', ['Released', 'Soft', 'Drawn']);
connectControl('light', ['Diffuse', 'Filtered', 'Direct']);

const formAction = document.querySelector<HTMLButtonElement>('.form-action')!;
formAction.addEventListener('click', () => {
  const released = formAction.getAttribute('aria-pressed') !== 'true';
  formAction.setAttribute('aria-pressed', String(released));
  formAction.querySelector('span')!.textContent = released ? 'Restore the fold' : 'Release the fold';
  const destination = released ? 0.05 : foldedTension;
  const tensionInput = document.querySelector<HTMLInputElement>('#tension-control')!;
  formTween = gsap.to(material, {
    tension: destination,
    duration: reduced ? 0 : 1.35,
    ease: 'sine.inOut',
    overwrite: 'auto',
    onUpdate: () => {
      tensionInput.value = String(Math.round(material.tension * 100));
      document.querySelector('#tension-value')!.textContent = material.tension < .33 ? 'Released' : material.tension > .72 ? 'Drawn' : 'Soft';
      dirty = true;
    },
    onComplete: () => { formTween = null; },
  });
  dirty = true;
});

window.addEventListener('pointermove', (event) => {
  if (!finePointer.matches || event.pointerType !== 'mouse' || reduced) return;
  targetPointer.x = clamp((event.clientX / innerWidth) * 2 - 1, -1, 1);
  targetPointer.y = clamp(1 - (event.clientY / innerHeight) * 2, -1, 1);
  dirty = true;
}, { passive: true });
document.addEventListener('pointerleave', () => { targetPointer.x = 0; targetPointer.y = 0; dirty = true; });

function setActive(index: number): void {
  active = index;
  scenes.forEach((scene, i) => {
    scene.classList.toggle('is-active', i === index);
    scene.setAttribute('aria-hidden', String(i !== index));
    scene.inert = i !== index;
  });
  chapterLinks.forEach((link) => {
    if (Number(link.dataset.chapter) === index) link.setAttribute('aria-current', 'step');
    else link.removeAttribute('aria-current');
  });
  currentChapter.textContent = index ? `${String(index).padStart(2, '0')} / ${chapterNames[index]}` : 'VEIL / Opening';
  previousButton.disabled = index <= 0;
  nextButton.disabled = index >= CHAPTER_COUNT - 1;
  stage.dataset.scene = chapterIds[index];
}

function mixColor(a: readonly number[], b: readonly number[], amount: number): string {
  return `rgb(${a.map((n, i) => Math.round(n + (b[i] - n) * amount)).join(' ')})`;
}

function render(time: number, delta: number): void {
  if (document.hidden) return;
  lenis?.raf(time * 1000);
  currentRaw = clamp(window.scrollY / chapterSpan, 0, END_RAW);
  const sample = sampleTimeline(currentRaw);
  if (sample.active !== active) setActive(sample.active);
  if (reduced) {
    sample.progress = sample.active;
    sample.dark = sample.active === 3 ? 1 : 0;
    sample.weights = sample.weights.map((_, i) => Number(i === sample.active));
  }
  const ambient = !reduced && !userPaused && !modalWasOpen;
  if (ambient) frameTime += Math.min(delta || 16.667, 64) / 1000;
  if (reduced) { pointer.x = 0; pointer.y = 0; }
  else {
    pointer.x += (targetPointer.x - pointer.x) * 0.075;
    pointer.y += (targetPointer.y - pointer.y) * 0.075;
  }
  const scrolling = Math.abs(currentRaw - lastRaw) > 0.000001;
  const pointerMoving = !reduced && Math.abs(targetPointer.x - pointer.x) + Math.abs(targetPointer.y - pointer.y) > 0.0002;
  if (!ambient && !dirty && !scrolling && !pointerMoving) return;

  if (scrolling || dirty) {
    scenes.forEach((scene, i) => {
      const weight = sample.weights[i];
      const opacity = reduced ? weight : Math.pow(weight, 0.7);
      scene.style.opacity = opacity.toFixed(4);
      scene.classList.toggle('is-visible', weight > 0.001);
      // Text is cut along the moving material edge. It never travels up a page.
      const seam = reduced ? 0 : (1 - weight) * 105;
      const copy = scene.querySelector<HTMLElement>('.scene-copy');
      if (copy) copy.style.clipPath = `polygon(0 0, ${100 - seam * 0.15}% 0, ${100 - seam * 0.15}% ${Math.max(0,100 - seam)}%, 0 100%)`;
    });
    heroLetters.style.opacity = sample.weights[0].toFixed(4);
    heroLetters.style.transform = `translate3d(${-sample.progress * 3}%,0,0) scale(${1 - Math.min(1, sample.progress) * 0.08})`;
    finaleLetters.style.opacity = sample.weights[6].toFixed(4);
    progressLine.style.transform = `scaleX(${sample.completed})`;
    stage.dataset.phase = sample.phase;
    stage.dataset.progress = sample.progress.toFixed(4);
    threadMark.style.opacity = (sample.weights[1] * 0.23).toFixed(3);
  }
  if (Math.abs(sample.dark - lastDark) > 0.0001 || dirty) {
    html.style.setProperty('--paper', mixColor([233,230,223], [22,25,24], sample.dark));
    // A linear foreground inversion would pass through the background colour
    // and erase the interface halfway into LIGHT. Preserve contrast instead.
    const background = [233,230,223].map((n,i) => (n + ([22,25,24][i] - n) * sample.dark) / 255);
    const linear = background.map(n => n <= .04045 ? n / 12.92 : Math.pow((n + .055) / 1.055, 2.4));
    const luminance = linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722;
    const useLight = luminance < .179;
    const transition = Math.pow(Math.sin(sample.dark * Math.PI), .6);
    html.style.setProperty('--ink', useLight
      ? mixColor([233,230,223], [255,255,255], transition)
      : mixColor([41,42,40], [0,0,0], transition));
    html.style.setProperty('--muted', useLight
      ? mixColor([178,179,170], [255,255,255], transition)
      : mixColor([100,99,94], [0,0,0], transition));
    html.style.setProperty('--line', sample.dark > 0.5 ? 'rgba(233,230,223,.25)' : 'rgba(41,42,40,.25)');
    lastDark = sample.dark;
  }

  if (world) {
    world.render({ progress: sample.progress, time: frameTime, pointer, reducedMotion: reduced, ...material });
  } else {
    fallbackLight.style.opacity = String(sample.dark);
    fallbackCloth.style.opacity = String(1 - sample.dark);
    const drift = reduced ? 0 : Math.sin(frameTime * .2) * .7;
    fallbackCloth.style.transform = `translate3d(${drift}%,0,0) scale(${1.025 + sample.progress * .003})`;
  }
  lastRaw = currentRaw;
  dirty = false;
}

function activateWorld(): void {
  if (forceStill) { html.dataset.renderer = 'still'; return; }
  try {
    world?.dispose();
    world = new TextileWorld(canvas, () => { dirty = true; });
    world.resize(innerWidth, innerHeight);
    world.render({ progress: sampleTimeline(window.scrollY / chapterSpan).progress, time: 0, pointer, reducedMotion: reduced, ...material });
    html.dataset.renderer = 'webgl';
  } catch {
    world?.dispose();
    world = null;
    html.dataset.renderer = 'still';
  }
  dirty = true;
}

canvas.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  world?.dispose();
  world = null;
  html.dataset.renderer = 'still';
  dirty = true;
});
canvas.addEventListener('webglcontextrestored', activateWorld);

window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  html.style.setProperty('--viewport-height', `${innerHeight}px`);
  world?.resize(innerWidth, innerHeight);
  dirty = true;
  resizeTimer = setTimeout(() => {
    if (needsMeasure()) measure();
  }, 160);
}, { passive: true });
reducedQuery.addEventListener('change', () => {
  reduced = reducedQuery.matches;
  if (reduced && formTween) {
    const tween = formTween;
    tween.progress(1).kill();
    formTween = null;
  }
  setupScroll();
  measure();
  updateMotionState();
});
window.addEventListener('pageshow', (event) => {
  if (event.persisted) { lenis?.resize(); ScrollTrigger.refresh(); dirty = true; }
  restoringDocument = true;
  setTimeout(() => { restoringDocument = false; }, 0);
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    navigation = null;
    lenis?.stop();
    formTween?.pause();
  } else {
    if (!indexDialog.open && !notesDialog.open) lenis?.start();
    lenis?.resize();
    ScrollTrigger.refresh();
    formTween?.resume();
    dirty = true;
  }
});

setupScroll();
measure(false);
ScrollTrigger.create({ trigger: '.scroll-track', start: 'top top', end: 'bottom bottom', onUpdate: () => { dirty = true; } });
updateMotionState();
setActive(0);
gsap.ticker.add(render);

// Let the self-hosted type and the first photographic study establish a frame
// before shader compilation. The exact same scene remains behind the renderer.
requestAnimationFrame(() => {
  activateWorld();
  const initialChapter = chapterIds.indexOf(location.hash.slice(1));
  const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  const restoresScroll = entry?.type === 'back_forward' || entry?.type === 'reload';
  if (initialChapter >= 0 && !restoresScroll) goToChapter(initialChapter, true, false);
  dirty = true;
});
document.fonts.ready.then(() => { lenis?.resize(); ScrollTrigger.refresh(); dirty = true; });

window.addEventListener('pagehide', (event) => {
  if (!event.persisted) {
    gsap.ticker.remove(render);
    gsap.killTweensOf(material);
    lenis?.destroy();
    world?.dispose();
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    clearTimeout(resizeTimer);
  }
});
