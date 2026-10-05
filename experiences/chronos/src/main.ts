import './style.css';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MechanicalSound } from './audio';
import { CHAPTERS, cameraProgress, chapterAt, clamp, copyState, mix, plateState, portraitLayout, smooth } from './narrative';
import type { WatchScene } from './scene/WatchScene';

gsap.registerPlugin(ScrollTrigger);

const get = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const root = document.documentElement;
const journey = get('journey');
const stage = get('stage');
const canvas = get<HTMLCanvasElement>('mechanism');
const watch = get('watch-plate');
const watchFrame = get('watch-frame');
const craft = get('craft-plate');
const craftImage = craft.querySelector('img')!;
const aperture = get('aperture-line');
const copies = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]'));
const ticks = Array.from(document.querySelectorAll<HTMLElement>('.chapter-ticks i'));
const mechanicalCaption = get('mechanical-caption');
const partLabel = get('part-label');
const readout = get('precision-readout');
const digits = get('beat-readout');
const pulse = get('beat-pulse');
const craftLabel = get('craft-label');
const windProgress = get('wind-progress');
const number = get('chapter-number');
const name = get('chapter-name');
const bottomIndex = get<HTMLButtonElement>('bottom-index');
const motionButton = get<HTMLButtonElement>('motion-toggle');
const soundButton = get<HTMLButtonElement>('sound-toggle');
const slowButton = get<HTMLButtonElement>('slow-motion');
const status = get('render-status');
const dialogs = Array.from(document.querySelectorAll<HTMLDialogElement>('dialog'));
const media = window.matchMedia('(prefers-reduced-motion: reduce)');
const coarse = window.matchMedia('(pointer: coarse)');
const sound = new MechanicalSound();

let reduced = media.matches;
let paused = false;
let slow = false;
let width = window.innerWidth;
let height = window.innerHeight;
let mobile = portraitLayout(width, height);
let progress = 0;
let current = -1;
let range = 1;
let activeTime = 0;
let mechanicalTime = 0;
let scrollTime = 0;
let resetScrollClock = false;
let lifecycleSuspended = false;
let pointerX = 0;
let pointerY = 0;
let modalOpen = false;
let visible = true;
let disposed = false;
let fallback = false;
let contextLost = false;
let watchAvailable = true;
let craftAvailable = true;
let scene: WatchScene | null = null;
let lastNumberUpdate = 0;
let lastPaintProgress = -1;
let lastPaintTime = -1;
let lastRenderProgress = -1;
let lastRenderTime = -1;
let resizeTimer = 0;
let returnFocus: HTMLElement | null = null;
const abort = new AbortController();
const listener = { signal: abort.signal };

root.classList.add('is-enhanced');
root.classList.toggle('is-reduced', reduced);

const lenis = new Lenis({
  autoRaf: false,
  smoothWheel: !reduced,
  lerp: .115,
  wheelMultiplier: .92,
  syncTouch: false,
  prevent: node => !!node.closest('dialog'),
});
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.lagSmoothing(0);

const trigger = ScrollTrigger.create({
  trigger: journey,
  start: 'top top',
  end: () => `+=${range}`,
  invalidateOnRefresh: true,
  onUpdate: self => { progress = self.progress; },
});

function updateChapter(index: number) {
  if (current === index) return;
  current = index;
  const chapter = CHAPTERS[index];
  stage.dataset.chapter = chapter.id;
  number.textContent = String(index + 1).padStart(2, '0');
  name.textContent = chapter.name;
  bottomIndex.setAttribute('aria-label', `Current chapter: ${index + 1} ${chapter.name}. Open chapter index`);
  get('chapter-announcement').textContent = `Chapter ${index + 1}: ${chapter.name}`;
  get('wind-label').textContent = index === 5 ? 'Time, revealed' : 'Scroll to wind';
  copies.forEach((copy, i) => {
    copy.classList.toggle('is-active', i === index);
    copy.setAttribute('aria-hidden', String(i !== index));
    copy.inert = i !== index;
  });
  ticks.forEach((tick, i) => tick.classList.toggle('is-current', i === index));
  partLabel.textContent = index === 1 ? '01 — MAINSPRING BARREL' : '02 — THE GOING TRAIN';
  document.querySelectorAll('.index-list a').forEach((link, i) => {
    if (i === index) link.setAttribute('aria-current', 'step'); else link.removeAttribute('aria-current');
  });
}

function paint() {
  const index = chapterAt(progress);
  updateChapter(index);
  const isMoving = !reduced && !paused && !modalOpen;
  const changed = progress !== lastPaintProgress || (isMoving && activeTime !== lastPaintTime);
  if (!changed) return;
  lastPaintProgress = progress;
  lastPaintTime = activeTime;
  stage.dataset.progress = progress.toFixed(4);

  copies.forEach((copy, i) => {
    const state = copyState(progress, i, reduced);
    copy.style.opacity = String(state.opacity);
    copy.style.transform = `translate3d(${state.x}px,0,0)`;
    copy.style.clipPath = reduced || state.reveal === 1 ? 'none' : `inset(0 ${100 - state.reveal * 100}% 0 0)`;
    copy.style.visibility = state.opacity < .001 ? 'hidden' : 'visible';
  });

  const plates = plateState(progress, reduced);
  const finalMix = smooth(.90, 1, progress);
  const driftX = reduced ? 0 : Math.sin(activeTime * .17) * (mobile ? 1.5 : 3);
  const driftY = reduced ? 0 : Math.sin(activeTime * .13) * (mobile ? 1.5 : 4);
  const staticEdition = fallback || contextLost || reduced;
  const watchOpacity = !watchAvailable ? 0 : fallback || contextLost ? (index === 4 && craftAvailable ? 0 : 1) : reduced ? plates.watch : (plates.watch > 0 ? 1 : 0);
  let watchScale = plates.scale;
  if (fallback || contextLost) watchScale = index === 5 ? .59 : (index === 0 ? 1 : 1.14);
  if (width > 700 && height <= 550) watchScale *= mix(1, .75, finalMix);
  if (mobile && height <= 680) watchScale *= mix(1, .63, finalMix);
  watch.style.opacity = String(watchOpacity);
  watch.style.visibility = watchOpacity < .001 ? 'hidden' : 'visible';
  watch.style.left = `${mix(mobile ? 55 : (width <= 1100 ? 81 : 74), mobile ? 50 : 70, finalMix)}%`;
  watch.style.top = `${mix(mobile ? 76 : 53, mobile ? (height <= 680 ? 70.5 : 65) : 53, finalMix)}%`;
  watch.style.transform = `translate(-50%,-50%) translate3d(${driftX}px,${driftY}px,0) rotate(${mix(-9, -4, finalMix)}deg) scale(${watchScale})`;

  // One shared aperture clips the two opaque surfaces. There is never a
  // translucent second set of bridges or hands on top of the live movement.
  const enter = smooth(.028, .125, progress);
  const exit = 1 - smooth(.912, .982, progress);
  const irisPhase = progress < .5 ? enter : exit;
  const irisX = mix(mobile ? .55 : (width <= 1100 ? .81 : .74), mobile ? .50 : .70, finalMix) * width;
  const irisY = mix(mobile ? .67 : .45, mobile ? (height <= 680 ? .705 : .65) : .51, finalMix) * height;
  const irisRadius = (Math.hypot(Math.max(irisX, width - irisX), Math.max(irisY, height - irisY)) + 4) * irisPhase;
  const watchHandoff = !staticEdition && watchAvailable && (progress < .15 || progress > .90);
  if (watchHandoff) {
    watchFrame.style.maskImage = `radial-gradient(circle at ${irisX}px ${irisY}px, transparent ${Math.max(0, irisRadius - 1)}px, #000 ${irisRadius}px)`;
    canvas.style.clipPath = `circle(${Math.max(0, irisRadius - .5)}px at ${irisX}px ${irisY}px)`;
  } else { watchFrame.style.maskImage = 'none'; canvas.style.clipPath = 'none'; }

  const craftIris = Math.min(smooth(.717, .776, progress), 1 - smooth(.837, .904, progress));
  const craftOpacity = !craftAvailable ? 0 : (fallback || contextLost) && (index === 4 || !watchAvailable) ? 1 : reduced ? plates.craft : (craftIris > 0 ? 1 : 0);
  craft.style.opacity = String(craftOpacity);
  craft.style.visibility = craftOpacity < .001 ? 'hidden' : 'visible';
  const craftDrift = reduced ? 0 : Math.sin(activeTime * .09) * .5;
  const craftTop = mobile ? height * .27 : 0;
  const craftHeight = height - craftTop;
  const cover = Math.max(width / 1536, craftHeight / 1024);
  const imageWidth = 1536 * cover, imageHeight = 1024 * cover;
  // Keep the full photograph available outside the window rather than moving
  // an already cropped image. Its observed ruby centre is (1155, 460).
  const photoX = width * .73 + ((width - imageWidth) * (mobile ? .70 : .72) + 1155 * cover - width * .73) * plates.zoom + craftDrift * .01 * width * plates.zoom;
  const photoY = craftHeight * .45 + ((craftHeight - imageHeight) * .5 + 460 * cover - craftHeight * .45) * plates.zoom;
  const bearing = !staticEdition && craftIris > 0 && craftIris < 1 ? scene?.projectPart('ruby') : null;
  const takeover = staticEdition ? 1 : smooth(0, .72, craftIris);
  const craftX = mix(bearing?.x ?? photoX, photoX, takeover);
  const craftY = mix(bearing ? bearing.y - craftTop : photoY, photoY, takeover);
  const craftRadius = craftIris * (Math.hypot(Math.max(craftX, width - craftX), Math.max(craftY, craftHeight - craftY)) + 4);
  craftImage.style.width = `${imageWidth}px`;
  craftImage.style.height = `${imageHeight}px`;
  craftImage.style.transform = `translate3d(${craftX - 1155 * cover * plates.zoom}px,${craftY - 460 * cover * plates.zoom}px,0) scale(${plates.zoom})`;
  craft.style.clipPath = staticEdition ? 'none' : `circle(${craftRadius}px at ${craftX}px ${craftY}px)`;

  const liveOpacity = fallback || contextLost ? 0 : reduced ? (watchOpacity || craftOpacity ? 0 : 1) : 1;
  canvas.style.opacity = String(liveOpacity);
  const ringOpacity = watchHandoff ? smooth(0, .06, irisPhase) * (1 - smooth(.78, 1, irisPhase)) * .28 : 0;
  aperture.style.opacity = String(ringOpacity);
  aperture.style.left = `${irisX}px`; aperture.style.top = `${irisY}px`;
  aperture.style.width = `${irisRadius * 2}px`;
  aperture.style.transform = 'translate(-50%,-50%)';
  mechanicalCaption.style.opacity = String(Math.max(copyState(progress, 1, reduced).opacity, copyState(progress, 2, reduced).opacity) * .9);
  readout.style.opacity = String(copyState(progress, 3, reduced).opacity * .9);
  craftLabel.style.opacity = String(craftAvailable ? copyState(progress, 4, reduced).opacity * .9 : 0);
  windProgress.style.left = `${progress * 100}%`;

  if (activeTime - lastNumberUpdate > .075 || !isMoving || progress !== lastRenderProgress) {
    digits.textContent = (mechanicalTime + progress * 90).toFixed(3).padStart(7, '0');
    lastNumberUpdate = activeTime;
  }
  const beat = (mechanicalTime + progress * 90) * 8 % 1;
  pulse.style.transform = `scaleX(${.14 + .86 * (1 - beat)})`;
}

function tick(_time: number, delta: number) {
  if (disposed || document.hidden || lifecycleSuspended) return;
  const dt = Math.min(delta * .001, .05);
  // Keep scrolling on visible wall time even when a costly frame is dropped.
  // Only the first frame after a suspended tab discards its inactive gap.
  scrollTime += resetScrollClock ? Math.min(dt, 1 / 60) : Math.max(0, delta * .001);
  resetScrollClock = false;
  lenis.raf(scrollTime * 1000);
  const running = !paused && !reduced && !modalOpen && visible;
  if (running) {
    activeTime += dt;
    // Integrate changes in speed; never multiply accumulated time on toggle.
    mechanicalTime += dt * (slow ? 1 / 32 : 1 / 8);
  }
  const pose = reduced ? chapterAt(progress) / 5 : cameraProgress(progress);
  const filmTime = reduced ? 0 : mechanicalTime + progress * 90;
  const plates = plateState(progress, reduced);
  const craftIris = Math.min(smooth(.717, .776, progress), 1 - smooth(.837, .904, progress));
  const watchCovers = watchAvailable && (reduced ? plates.watch === 1 : progress <= .028 || progress >= .982);
  const craftCovers = craftAvailable && (reduced ? plates.craft === 1 : craftIris >= .999);
  const exposed = (!watchCovers && !craftCovers) || lastRenderProgress < 0;
  if (scene && !fallback && !contextLost && visible && !modalOpen && exposed && (pose !== lastRenderProgress || filmTime !== lastRenderTime)) {
    scene.render({ progress: pose, time: filmTime, slow, reduced, pointerX, pointerY,
      entranceReveal: watchAvailable && !reduced ? 1 - smooth(.125, .15, progress) : 0 });
    lastRenderProgress = pose;
    lastRenderTime = filmTime;
    if (craftIris > 0 && craftIris < 1) lastPaintProgress = -1;
  }
  // Project the just-rendered bearing into the photographic iris in this same frame.
  paint();
  sound.update(filmTime, running);
}
gsap.ticker.add(tick);

function resize(preserve = true) {
  const saved = progress;
  width = window.innerWidth;
  height = stage.clientHeight || window.innerHeight;
  mobile = portraitLayout(width, height);
  range = Math.max(1, journey.offsetHeight - stage.clientHeight);
  lenis.resize();
  scene?.resize(width, stage.clientHeight, Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(4_000_000 / (width * stage.clientHeight))));
  ScrollTrigger.refresh();
  if (preserve) lenis.scrollTo(saved * range, { immediate: true, force: true });
  progress = clamp(window.scrollY / range);
  lastPaintProgress = -1;
  lastRenderProgress = -1;
  paint();
}

function closeDialogs() {
  for (const dialog of dialogs) if (dialog.open) dialog.close();
  // Native `close` is queued. Resume synchronously before a chapter scroll,
  // otherwise the later Lenis.start() would reset an in-flight navigation.
  modalOpen = false;
  if (lenis.isStopped) lenis.start();
}

function openDialog(id: string, source?: HTMLElement) {
  closeDialogs();
  returnFocus = source || document.activeElement as HTMLElement;
  modalOpen = true;
  lenis.stop();
  get<HTMLDialogElement>(id).showModal();
  lastPaintProgress = -1;
  paint();
}

function navigate(index: number, immediate = false, focusAfter = false) {
  // Navigation supplies its own focus target. A queued native close event
  // must not move focus back to the index after an immediate chapter change.
  returnFocus = null;
  closeDialogs();
  const chapter = CHAPTERS[index];
  try { history.replaceState(null, '', `#${chapter.id}`); } catch { /* still usable in restricted embeds */ }
  lenis.scrollTo(chapter.at * range, {
    immediate: immediate || reduced,
    force: true,
    duration: mobile ? 1.2 : 1.65,
    onComplete: () => {
      if (!focusAfter) return;
      // Immediate navigation can finish before the next frame; expose its
      // article before focusing a heading that was previously inert.
      paint();
      const heading = copies[index].querySelector<HTMLElement>('h1,h2')!;
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    },
  });
}

document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', event => {
    const target = anchor.getAttribute('href')!.slice(1);
    if (target === 'transcript') { event.preventDefault(); openDialog('transcript-dialog', anchor); return; }
    const index = CHAPTERS.findIndex(chapter => chapter.id === target);
    if (index < 0) return;
    event.preventDefault();
    navigate(index, false, event.detail === 0);
  }, listener);
});

get('open-index').addEventListener('click', () => openDialog('chapter-dialog', get('open-index')), listener);
bottomIndex.addEventListener('click', () => openDialog('chapter-dialog', bottomIndex), listener);
get('open-credits').addEventListener('click', () => openDialog('credits-dialog', get('open-credits')), listener);
get('read-transcript').addEventListener('click', () => openDialog('transcript-dialog', get('open-index')), listener);

for (const dialog of dialogs) {
  dialog.querySelector('[data-close]')!.addEventListener('click', () => dialog.close(), listener);
  dialog.addEventListener('close', () => {
    modalOpen = dialogs.some(item => item.open);
    if (!modalOpen) {
      if (lenis.isStopped) lenis.start();
      returnFocus?.focus({ preventScroll: true });
      returnFocus = null;
      lastRenderProgress = -1;
      lastPaintProgress = -1;
    }
  }, listener);
}

function motionState() {
  const stopped = paused || reduced;
  motionButton.setAttribute('aria-pressed', String(stopped));
  motionButton.setAttribute('aria-label', reduced ? 'Ambient motion follows your reduced motion preference' : stopped ? 'Resume ambient motion' : 'Pause ambient motion');
  motionButton.disabled = reduced;
  lastPaintProgress = -1;
  lastRenderProgress = -1;
}
motionButton.addEventListener('click', () => { paused = !paused; motionState(); }, listener);
slowButton.addEventListener('click', () => {
  slow = !slow;
  slowButton.setAttribute('aria-pressed', String(slow));
  slowButton.firstChild!.textContent = slow ? 'Return to rhythm ' : 'Look closer ';
  slowButton.querySelector('.speed-label')!.textContent = slow ? '¹⁄₃₂ → ⅛ speed' : '⅛ → ¹⁄₃₂ speed';
  get('presentation-rate').textContent = slow ? 'STUDY AT ¹⁄₃₂ SPEED' : 'STUDY AT ⅛ SPEED';
}, listener);
soundButton.addEventListener('click', async () => {
  soundButton.disabled = true;
  try {
    const enabled = await sound.toggle();
    soundButton.setAttribute('aria-pressed', String(enabled));
    get('sound-label').textContent = enabled ? 'Sound on' : 'Sound off';
  } catch {
    get('sound-label').textContent = 'Sound unavailable';
    get('chapter-announcement').textContent = 'Audio is unavailable in this browser. You can continue the visual experience.';
  } finally { soundButton.disabled = false; }
}, listener);

media.addEventListener('change', event => {
  const wasStopped = lenis.isStopped;
  // Cancel the old animation before resize changes its target. An immediate
  // scroll to the same position does not cancel an active Lenis animation.
  lenis.stop();
  reduced = event.matches;
  root.classList.toggle('is-reduced', reduced);
  lenis.options.smoothWheel = !reduced;
  pointerX = pointerY = 0;
  motionState();
  resize();
  if (!wasStopped && !modalOpen) lenis.start();
}, listener);

window.addEventListener('keydown', event => {
  const endpoint = event.key === 'Home' || event.key === 'End';
  if (event.defaultPrevented || event.isComposing || event.altKey || (event.ctrlKey && !endpoint) || event.metaKey || modalOpen || lenis.isStopped || lenis.isScrolling !== 'smooth') return;
  if (!['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) return;
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (target?.isContentEditable || target?.closest('input, textarea, select, [role="textbox"]')) return;
  if (event.key === ' ' && target?.closest('button, summary, [role="button"], [role="checkbox"], [role="switch"]')) return;
  // Leave native keyboard scrolling intact, after releasing the position from
  // wheel inertia or an interrupted chapter navigation.
  lenis.stop();
  lenis.start();
  if (endpoint) {
    // A native endpoint animation can itself be cancelled by the scroll event
    // queued just before stop(). Commit this explicit destination immediately.
    event.preventDefault();
    lenis.scrollTo(event.key === 'Home' ? 0 : lenis.limit, { immediate: true, force: true });
  }
}, listener);

window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => resize(), 140);
}, listener);
window.addEventListener('pointermove', event => {
  if (reduced || coarse.matches) return;
  pointerX = (event.clientX / width - .5) * 2;
  pointerY = (event.clientY / height - .5) * 2;
}, { ...listener, passive: true });
window.addEventListener('pointerout', event => { if (!event.relatedTarget) pointerX = pointerY = 0; }, listener);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) void sound.suspend().catch(() => {});
  else { resetScrollClock = true; void sound.resume().catch(() => {}); lenis.resize(); ScrollTrigger.update(); lastRenderProgress = -1; }
}, listener);
document.addEventListener('freeze', () => { lifecycleSuspended = true; void sound.suspend().catch(() => {}); }, listener);
document.addEventListener('resume', () => {
  lifecycleSuspended = false; resetScrollClock = true;
  void sound.resume().catch(() => {}); lastRenderProgress = -1;
}, listener);
window.addEventListener('pageshow', event => { if (event.persisted) { lifecycleSuspended = false; resetScrollClock = true; resize(); } }, listener);

const intersection = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? true; }, { threshold: 0 });
intersection.observe(stage);

function showFallback(message: string) {
  fallback = true;
  root.classList.add('no-webgl');
  status.textContent = message;
  lastPaintProgress = -1;
  paint();
}

function contextWasLost(event: Event) {
  event.preventDefault();
  contextLost = true;
  status.textContent = 'The still view is active while the movement recovers.';
  lastPaintProgress = -1;
  paint();
}
function contextWasRestored() {
  contextLost = false;
  status.textContent = '';
  lastPaintProgress = -1;
  lastRenderProgress = -1;
}
canvas.addEventListener('webglcontextlost', contextWasLost, listener);
canvas.addEventListener('chronos:webgl-lost', contextWasLost, listener);
canvas.addEventListener('webglcontextrestored', contextWasRestored, listener);
canvas.addEventListener('chronos:webgl-restored', contextWasRestored, listener);

resize(false);
motionState();
const initialChapter = CHAPTERS.findIndex(chapter => `#${chapter.id}` === location.hash);
if (initialChapter >= 0) navigate(initialChapter, true);
paint();

async function loadMovement() {
  if (new URLSearchParams(location.search).get('render') === 'still') { showFallback('Still edition. Explore the six chapters at your own pace.'); return; }
  try {
    const { WatchScene: Renderer } = await import('./scene/WatchScene');
    if (disposed) return;
    scene = new Renderer(canvas);
    scene.resize(width, stage.clientHeight, Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(4_000_000 / (width * stage.clientHeight))));
    scene.render({ progress: cameraProgress(progress), time: mechanicalTime + progress * 90, slow, reduced, pointerX, pointerY,
      entranceReveal: watchAvailable && !reduced ? 1 - smooth(.125, .15, progress) : 0 });
    lastRenderProgress = -1;
  } catch (error) {
    console.info('CHRONOS: still edition selected because the live renderer is unavailable.', error instanceof Error ? error.message : '');
    showFallback('Live rendering is unavailable here. The still edition remains open.');
  }
}

const imageReady = Array.from(document.images).map(img => img.decode().catch(() => {
  if (disposed) return;
  if (img.id === 'watch-image') watchAvailable = false;
  else if (img === craftImage) craftAvailable = false;
  else return;
  status.textContent = fallback || contextLost
    ? 'Some artwork could not load. All six chapters remain available in Read the experience.'
    : 'Some artwork could not load. The live movement remains available.';
  lastPaintProgress = -1;
  lastRenderProgress = -1;
  paint();
}));
Promise.all([document.fonts.ready, ...imageReady, loadMovement()]).then(() => {
  if (disposed) return;
  // Resource completion refreshes measurements but never rewinds early input.
  resize(false);
  root.dataset.ready = 'true';
});

window.addEventListener('hashchange', () => {
  const index = CHAPTERS.findIndex(chapter => `#${chapter.id}` === location.hash);
  if (index >= 0) navigate(index, true);
}, listener);

function dispose() {
  if (disposed) return;
  disposed = true;
  abort.abort();
  clearTimeout(resizeTimer);
  intersection.disconnect();
  gsap.ticker.remove(tick);
  trigger.kill();
  lenis.off('scroll', ScrollTrigger.update);
  lenis.destroy();
  scene?.dispose();
  sound.dispose();
}
if (import.meta.hot) import.meta.hot.dispose(dispose);
window.addEventListener('pagehide', event => {
  if (!event.persisted) dispose();
  else { lifecycleSuspended = true; void sound.suspend().catch(() => {}); }
}, listener);

// Opt-in, read-only local diagnostics for reproducible acceptance checks.
if (import.meta.env.DEV || new URLSearchParams(location.search).has('inspect')) {
  Object.defineProperty(window, '__CHRONOS__', { configurable: true, value: Object.freeze({
    inspect: () => ({ progress, chapter: CHAPTERS[Math.max(0, current)].id, reduced, paused, slow, modalOpen, visible, hidden: document.hidden, lifecycleSuspended, disposed, mechanicalTime, scrolling: lenis.isScrolling, velocity: lenis.velocity, fallback, contextLost, width, height, scrollRange: range, triggers: ScrollTrigger.getAll().length, render: scene?.getDiagnostics?.() ?? null }),
  }) });
}

import '../../shared/collection-return.css';
