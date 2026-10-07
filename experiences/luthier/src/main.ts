import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ResonanceField, bowState, fieldGeometry } from './field';
import type { FieldFrame, Material, ResonanceMode } from './field';
import { ViolinAudio } from './audio';
import { CHAPTERS, clamp, smooth, distances, storyToUnits, unitsToStory, sceneWeight } from './story';
import type { ViolinStudy } from './violin-model';

gsap.registerPlugin(ScrollTrigger);
gsap.ticker.lagSmoothing(0);
ScrollTrigger.config({ ignoreMobileResize: true });

const $ = <T extends HTMLElement = HTMLElement>(selector: string): T => {
  const result = document.querySelector<T>(selector);
  if (!result) throw new Error(`Missing experience element: ${selector}`);
  return result;
};
const all = <T extends HTMLElement = HTMLElement>(selector: string) => [...document.querySelectorAll<T>(selector)];
const stage = $('#stage');
const score = $('#scroll-score');
const scenes = all<HTMLElement>('.scene');
const chapterDialog = $<HTMLDialogElement>('#chapter-dialog');
const creditsDialog = $<HTMLDialogElement>('#credits-dialog');
const body = document.body;
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const artHero = $('.hero-art');
const artReturn = $('.return-art');
const artWood = $('.wood-art');
const artInside = $('.inside-art');
const bridgePlate = $('.bridge-plate');
const bowImage = $<HTMLImageElement>('#bow-image');
const bowInput = $<HTMLInputElement>('#bow-progress');
const spaceInput = $<HTMLInputElement>('#space-open');
const canvas = $<HTMLCanvasElement>('#resonance-field');
const field = new ResonanceField(canvas);
const audio = new ViolinAudio();

let savedMotion: string | null = null;
try { savedMotion = localStorage.getItem('luthier-motion'); } catch { /* Storage is optional. */ }
let reduced = savedMotion ? savedMotion === 'reduced' : motionQuery.matches;
let width = window.innerWidth;
let height = window.innerHeight;
let pixelRatio = window.devicePixelRatio || 1;
let unitLengths = distances(width <= 760);
let lastStory = 0;
let story = 0;
let lastChapter = -1;
let ambientTime = 0;
let lastTick = 0;
let disposed = false;
let capturePaused = false;
let refreshPending = false;
let preserveOnRefresh = false;
let refreshTimer = 0;
let statusTimer = 0;
let bowOverrideScrollY = 0;
let model: ViolinStudy | undefined;
let modelLoading = false;
let modelFailed = false;
let scoreTween: gsap.core.Tween | undefined;
let readingTrigger: ScrollTrigger | undefined;
const master = { units: 0 };
const frame: FieldFrame = { story: 0, time: 0, reduced, material: 'maple', resonanceMode: 'air', spaceOpen: .55, bowOverride: null };
const sceneCopies = scenes.map(scene => all<HTMLElement>(`[data-scene="${scene.dataset.scene}"] .scene-copy`));
const activeWeights = new Float32Array(9);
const staticFields = new Map<number, HTMLImageElement>();

// The one Lenis instance and the one animation clock are never duplicated.
const lenis = new Lenis({
  autoRaf: false, autoResize: false, smoothWheel: !reduced, syncTouch: false,
  lerp: .105, wheelMultiplier: 1, touchMultiplier: 1, respectReducedMotion: true,
  virtualScroll: ({ deltaY, event }) => {
    if (event.ctrlKey) return false;
    if (!reduced && event.type === 'wheel' && deltaY * lenis.velocity < 0) stopScrollAnimation();
    return true;
  },
});
const updateTrigger = () => {
  if (frame.bowOverride !== null && Math.abs(window.scrollY - bowOverrideScrollY) > 3) frame.bowOverride = null;
  ScrollTrigger.update();
};
lenis.on('scroll', updateTrigger);

const portalSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
portalSvg.setAttribute('width', '0'); portalSvg.setAttribute('height', '0');
portalSvg.setAttribute('aria-hidden', 'true');
portalSvg.style.cssText = 'position:absolute;pointer-events:none;';
portalSvg.innerHTML = '<defs><clipPath id="f-portal" clipPathUnits="userSpaceOnUse"><path d="M .96 1.39 C 1.14 1.48 1.34 1.33 1.26 1.14 C 1.20 1 1.03 1 .99 1.12 C .89 1.03 .85 .73 .96 .35 L 1.06 .04 L .99 -.04 L 1.10 -.04 C 1.19 -.31 1.24 -.61 1.18 -.87 C 1.35 -.77 1.55 -.93 1.49 -1.12 C 1.43 -1.34 1.15 -1.39 1.03 -1.20 C .95 -1.08 1.03 -.96 1.12 -.98 C 1.13 -.78 1.03 -.51 .90 -.19 L .87 -.08 L .78 -.08 L .86 0 C .71 .48 .79 .95 .88 1.22 C .86 1.29 .90 1.36 .96 1.39 Z"/></clipPath></defs>';
stage.prepend(portalSvg);
const portalPath = portalSvg.querySelector('path')!;

function notify(message: string) {
  const el = $('#status-message');
  window.clearTimeout(statusTimer);
  el.textContent = message;
  el.classList.add('is-visible');
  statusTimer = window.setTimeout(() => el.classList.remove('is-visible'), 4400);
}

function updateMotionButton() {
  const button = $('#motion-toggle');
  button.setAttribute('aria-pressed', String(reduced));
  button.textContent = reduced ? 'Motion: reduced' : 'Motion: full';
}

function renderScore() {
  score.replaceChildren();
  for (let i = 0; i < CHAPTERS.length; i++) {
    const marker = document.createElement('div');
    // Empty score markers are not fragment targets. Chapter URLs are resolved
    // by scrollToStory, so the browser cannot override Lenis with a late anchor jump.
    marker.dataset.chapter = CHAPTERS[i][0];
    marker.style.height = `${unitLengths[i] * height}px`;
    score.append(marker);
  }
  const end = document.createElement('div');
  end.style.height = `${height}px`;
  score.append(end);
}

function stopScrollAnimation() {
  // Public Lenis controls stop its current Animate while preserving a dialog's stop state.
  const wasStopped = lenis.isStopped;
  lenis.stop();
  if (!wasStopped) lenis.start();
}

function setupScroll() {
  stopScrollAnimation();
  scoreTween?.scrollTrigger?.kill();
  scoreTween?.kill();
  readingTrigger?.kill();
  scoreTween = undefined;
  readingTrigger = undefined;
  body.classList.toggle('reduced', reduced);
  lenis.options.smoothWheel = !reduced;
  updateMotionButton();
  if (reduced) {
    artInside.style.clipPath = 'none';
    bridgePlate.style.opacity = '1';
    scenes.forEach((scene, i) => {
      scene.id = CHAPTERS[i][0];
      scene.inert = false;
      scene.removeAttribute('aria-hidden');
      scene.classList.add('is-current');
    });
    score.replaceChildren();
    renderReducedFields();
    readingTrigger = ScrollTrigger.create({
      trigger: '#experience', start: 'top top', end: 'bottom bottom',
      onUpdate: () => updateReadingPosition(),
    });
  } else {
    scenes.forEach(scene => scene.removeAttribute('id'));
    renderScore();
    const total = unitLengths.reduce((sum, value) => sum + value, 0);
    scoreTween = gsap.fromTo(master, { units: 0 }, {
      units: total, ease: 'none', duration: 1,
      scrollTrigger: { trigger: score, start: 'top top', end: () => `+=${total * height}`, scrub: true, invalidateOnRefresh: true },
    });
  }
  lenis.resize();
  ScrollTrigger.refresh();
  if (!reduced && model?.available) {
    const bounds = $('#violin-study').getBoundingClientRect();
    model.resize(bounds.width, bounds.height);
  }
}

function updateReadingPosition() {
  const target = window.scrollY + height * .4;
  let index = 0;
  for (let i = 0; i < scenes.length; i++) {
    if (scenes[i].offsetTop <= target) index = i;
  }
  story = index + .62;
}

function applyStoryScroll(normalized: number, immediate: boolean) {
  if (immediate) stopScrollAnimation();
  if (reduced) {
    const index = Math.min(8, Math.floor(normalized));
    lenis.scrollTo(scenes[index], { immediate: true, force: true });
    story = index + .62;
  } else {
    const destination = storyToUnits(normalized, unitLengths) * height;
    lenis.scrollTo(destination, { duration: 1.5, immediate, force: true, easing: t => 1 - Math.pow(1 - t, 4) });
    if (immediate) {
      // Navigation can happen between animation ticks. A following refresh
      // must see the new position, rather than restore the last painted scene.
      ScrollTrigger.update();
      story = unitsToStory(lenis.actualScroll / height, unitLengths);
    }
  }
}

function scrollToStory(target: number, immediate = false) {
  const normalized = clamp(Number.isFinite(target) ? target : 0, 0, 8.99);
  const pendingResize = refreshTimer !== 0;
  window.clearTimeout(refreshTimer);
  refreshTimer = 0;
  // Explicit navigation wins over preservation requested by an earlier resize.
  // Measure first so its destination uses the current viewport's scroll score.
  preserveOnRefresh = false;
  if (refreshPending || pendingResize || width !== window.innerWidth || Math.abs(height - window.innerHeight) > 2 || pixelRatio !== (window.devicePixelRatio || 1)) {
    performRefresh();
  }
  applyStoryScroll(normalized, immediate);
}

function requestRefresh(preserve = false) {
  refreshPending = true;
  preserveOnRefresh = preserveOnRefresh || preserve;
}

function performRefresh() {
  refreshPending = false;
  const preserve = preserveOnRefresh;
  preserveOnRefresh = false;
  const oldStory = story;
  // Resizing Lenis synchronizes its positions, but does not cancel its old
  // animation destination. Stop that destination before any refresh writeback.
  stopScrollAnimation();
  const oldWidth = width;
  const oldHeight = height;
  width = window.innerWidth;
  height = window.innerHeight;
  pixelRatio = window.devicePixelRatio || 1;
  document.documentElement.style.setProperty('--vh', `${height * .01}px`);
  field.resize(width, height);
  const breakpointChanged = (oldWidth <= 760) !== (width <= 760);
  const dimensionsChanged = oldWidth !== width || Math.abs(oldHeight - height) > 2;
  unitLengths = distances(width <= 760);
  if (breakpointChanged || dimensionsChanged) setupScroll();
  else {
    lenis.resize();
    ScrollTrigger.refresh();
    if (reduced) renderReducedFields();
  }
  if (!reduced && model?.available) {
    const r = $('#violin-study').getBoundingClientRect();
    model.resize(r.width, r.height);
  }
  if (preserve && dimensionsChanged) applyStoryScroll(oldStory, true);
  else lenis.scrollTo(window.scrollY, { immediate: true, force: true });
  lastChapter = -1;
}

async function ensureModel() {
  if (model || modelLoading || modelFailed) return;
  modelLoading = true;
  try {
    const { ViolinStudy: Study } = await import('./violin-model');
    if (disposed) return;
    model = new Study($('#violin-study'));
    if (model.available) {
      await model.ready;
      if (disposed) return;
      if (!reduced) {
        const bounds = $('#violin-study').getBoundingClientRect();
        model.resize(bounds.width, bounds.height);
        model.render(clamp(story - 2), ambientTime, false);
      }
      scenes[2].classList.add('has-model');
      body.dataset.model = 'ready';
    } else {
      modelFailed = true;
      body.dataset.model = 'fallback';
    }
  } catch {
    modelFailed = true;
    body.dataset.model = 'fallback';
  } finally { modelLoading = false; }
}

function positionBow(local: number, isReduced: boolean) {
  const compositionHeight = isReduced ? Math.max(height, width <= 760 ? 700 : 640) : height;
  const g = fieldGeometry(width, compositionHeight);
  const progress = frame.bowOverride === null ? clamp(local) : frame.bowOverride;
  const b = bowState(progress);
  const imageHeight = compositionHeight * 1.50;
  const imageWidth = width * (width <= 760 ? .28 : .18);
  // The left hair ribbon, not the wooden shaft, registers with the sampled string.
  // Before contact a clear gap separates its entering edge from the string.
  const approachGap = (1 - b.approach) * compositionHeight * .28 + (1 - b.contact) * 3;
  const lowerEdge = g.contactY - approachGap + b.contact * imageHeight * .12 + b.draw * imageHeight * .65;
  const top = lowerEdge - imageHeight;
  const contactFraction = clamp((g.contactY - top) / imageHeight);
  // Native cutout's hair moves from x=.28 at its top to x=.51 at its bottom.
  const hairX = imageWidth * (.28 + .23 * contactFraction);
  const x = g.contactX - hairX;
  bowImage.style.width = `${imageWidth}px`;
  bowImage.style.height = `${imageHeight}px`;
  bowImage.style.transform = `translate3d(${x}px,${top}px,0)`;
  bowImage.style.opacity = String(.72 + b.approach * .28);
  scenes[5].dataset.contact = b.contact.toFixed(3);
  scenes[5].dataset.amplitude = b.amplitude.toFixed(3);
  if (document.activeElement !== bowInput) bowInput.value = (progress * 100).toFixed(1);
  return b;
}

function renderReducedFields(only?: number) {
  if (!reduced) return;
  const drawing = document.createElement('canvas');
  const staticField = new ResonanceField(drawing);
  staticField.resize(width, Math.max(height, width <= 760 ? 700 : 640));
  const indices = only === undefined ? [0, 1, 2, 3, 4, 5, 6, 7, 8] : [only];
  for (const i of indices) {
    staticField.render({ ...frame, story: i + (i === 5 ? .79 : .58), time: .47, reduced: true });
    let plate = staticFields.get(i);
    if (!plate) {
      plate = new Image();
      plate.className = 'reduced-field';
      plate.alt = '';
      plate.setAttribute('aria-hidden', 'true');
      scenes[i].append(plate);
      staticFields.set(i, plate);
    }
    plate.src = drawing.toDataURL('image/webp', .9);
  }
  staticField.dispose();
  positionBow(.79, true);
}

function updateChapter(index: number) {
  if (index === lastChapter) return;
  lastChapter = index;
  body.dataset.chapter = CHAPTERS[index][0];
  $('.chapter-count').textContent = String(index + 1).padStart(2, '0');
  $('.chapter-name').textContent = CHAPTERS[index][1];
  all<HTMLAnchorElement>('.chapter-index a').forEach((a, i) => a.setAttribute('aria-current', String(i === index)));
  if (!reduced) {
    scenes.forEach((scene, i) => {
      scene.inert = i !== index;
      scene.setAttribute('aria-hidden', String(i !== index));
      scene.classList.toggle('is-current', i === index);
    });
  }
  if (index !== 5) frame.bowOverride = null;
}

function paint() {
  const index = Math.min(8, Math.floor(story));
  updateChapter(index);
  frame.story = story;
  frame.time = ambientTime;
  frame.reduced = reduced;
  body.classList.toggle('light-surface', index === 1);
  body.classList.toggle('ebony-surface', index === 1 && frame.material === 'ebony');
  body.dataset.story = story.toFixed(4);
  $('#score-progress').style.transform = `scaleX(${clamp(story / 9)})`;
  if (reduced) {
    updateAudio();
    return;
  }
  for (let i = 0; i < scenes.length; i++) {
    const weight = sceneWeight(i, story);
    activeWeights[i] = weight;
    const scene = scenes[i];
    scene.style.opacity = weight.toFixed(4);
    scene.style.visibility = weight > .0001 ? 'visible' : 'hidden';
    if (weight <= .0001) continue;
    const p = clamp(story - i);
    scene.style.setProperty('--local', p.toFixed(4));
    const out = smooth(.73, 1, p);
    // Each composition keeps an individual direction; no repeated fade-up choreography.
    const dx = i === 1 ? -out * width * .017 : i === 7 ? out * width * .024 : 0;
    const dy = i === 3 ? out * height * .025 : i === 0 || i === 8 ? -p * height * .012 : 0;
    for (const copy of sceneCopies[i]) copy.style.transform = `translate3d(${dx}px,${dy}px,0)`;
  }

  if (activeWeights[0] > 0) {
    const p = clamp(story);
    artHero.style.transform = `translate3d(${-p * width * .008}px,${p * height * .007}px,0) scale(${1 + p * .038})`;
    $('.hero-art .varnish-light').style.backgroundPosition = `${32 + Math.sin(ambientTime * .14) * 10 + p * 20}% 50%`;
  }
  if (activeWeights[1] > 0) {
    const p = clamp(story - 1);
    artWood.style.transform = `translate3d(${-p * width * .012}px,${p * height * .006}px,0) scale(${1.01 + p * .028})`;
  }
  if (story > 1.52 && story < 3.2) void ensureModel();
  if (activeWeights[2] > 0 && model?.available) model.render(clamp(story - 2), ambientTime, false);
  if (activeWeights[3] > 0) {
    const p = clamp(story - 3);
    artInside.style.transform = `translate3d(${-p * width * .018}px,${p * height * .006}px,0) scale(${1.015 + p * .045})`;
    $('.interior-light').style.backgroundPosition = `${45 + Math.sin(ambientTime * .13) * 4 + p * 20}% 50%`;
    const energy = $('.energy-path');
    energy.style.strokeDashoffset = String(-(ambientTime * .08 + p * .5) % 1);
    if (story < 3.14) {
      const portal = smooth(2.81, 3.14, story);
      const scale = height * (.025 + Math.pow(portal, 2.2) * 20);
      portalPath.setAttribute('transform', `translate(${width * .7} ${height * .45}) scale(${scale}) translate(-.90 -.25)`);
      artInside.style.clipPath = 'url(#f-portal)';
    } else artInside.style.clipPath = 'none';
  }
  if (activeWeights[4] > 0) bridgePlate.style.opacity = String(1 - smooth(.64, .87, clamp(story - 4)));
  if (activeWeights[5] > 0) positionBow(clamp(story - 5), false);
  if (activeWeights[8] > 0) {
    const p = clamp(story - 8);
    artReturn.style.transform = `scale(${1.018 - p * .018})`;
    $('.return-art .varnish-light').style.backgroundPosition = `${34 + Math.sin(ambientTime * .1) * 4}% 50%`;
  }
  field.render(frame);
  updateAudio();
  lastStory = story;
}

function updateAudio() {
  const index = Math.floor(story);
  const vibration = index === 5
    ? bowState(reduced ? .79 : story - 5, frame.bowOverride).amplitude
    : index > 5 && index < 9 ? 1 : 0;
  audio.update({ story, bowAmplitude: vibration, spaceOpen: frame.spaceOpen, hidden: document.hidden });
}

function tick(seconds: number) {
  if (disposed) return;
  if (import.meta.env.DEV && capturePaused) { lastTick = 0; return; }
  if (document.hidden) { lastTick = 0; return; }
  if (refreshPending) performRefresh();
  lenis.raf(seconds * 1000);
  const dt = lastTick === 0 ? 0 : clamp(seconds - lastTick, 0, .05);
  lastTick = seconds;
  if (!reduced) ambientTime += dt;
  if (reduced) updateReadingPosition();
  else story = unitsToStory(master.units, unitLengths);
  paint();
}

function showDialog(dialog: HTMLDialogElement) {
  if (dialog.open) return;
  dialog.showModal();
  lenis.stop();
}
function closeDialog(dialog: HTMLDialogElement) {
  if (dialog.open) dialog.close();
  lenis.start();
}
$('#anatomy-toggle').addEventListener('click', () => showDialog(chapterDialog));
$('#chapter-current').addEventListener('click', () => showDialog(chapterDialog));
$('#credits-toggle').addEventListener('click', () => showDialog(creditsDialog));
for (const dialog of [chapterDialog, creditsDialog]) {
  dialog.querySelector('.close-dialog')!.addEventListener('click', () => closeDialog(dialog));
  dialog.addEventListener('close', () => lenis.start());
}
document.addEventListener('click', event => {
  const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
  if (!target) return;
  const id = target.hash.slice(1);
  if (id === 'chapter-index') {
    event.preventDefault();
    showDialog(chapterDialog);
    return;
  }
  const index = CHAPTERS.findIndex(([chapter]) => chapter === id);
  if (index < 0) return;
  event.preventDefault();
  closeDialog(chapterDialog);
  closeDialog(creditsDialog);
  frame.bowOverride = null;
  history.pushState({ chapter: id }, '', `#${id}`);
  scrollToStory(index + (index === 0 ? 0 : .16));
});

$('#sound-toggle').addEventListener('click', async () => {
  const button = $('#sound-toggle');
  if (audio.enabled) {
    audio.disable();
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', 'Enable sound');
    $('#sound-label').textContent = 'Sound off';
  } else {
    const ok = await audio.enable();
    button.setAttribute('aria-pressed', String(ok));
    button.setAttribute('aria-label', ok ? 'Mute sound' : 'Enable sound');
    $('#sound-label').textContent = ok ? 'Sound on' : 'Sound off';
    if (ok && story < 5.56) notify('Sound is on. It begins with the bow.');
    if (!ok) notify('Sound could not start. Select Sound to try again.');
  }
});

const materialDescriptions: Record<Material, string> = {
  spruce: 'Fine longitudinal grain. The arched top.',
  maple: 'Figured grain. The back, ribs and neck.',
  ebony: 'Dense, close grain. The fingerboard.',
};
all<HTMLButtonElement>('[data-wood]').forEach(button => button.addEventListener('click', () => {
  const material = button.dataset.wood as Material;
  frame.material = material;
  all<HTMLButtonElement>('[data-wood]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  all<HTMLImageElement>('[data-material]').forEach(image => image.classList.toggle('is-selected', image.dataset.material === material));
  $('#material-description').textContent = materialDescriptions[material];
  if (reduced) renderReducedFields(1);
}));

all<HTMLButtonElement>('[data-inside]').forEach(button => button.addEventListener('click', () => {
  const part = button.dataset.inside!;
  scenes[3].dataset.part = part;
  all<HTMLButtonElement>('[data-inside]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  $('#inside-description').textContent = part === 'post' ? 'A slender connection between top and back.' : 'A carved support along the bass side of the top.';
}));

all<HTMLButtonElement>('[data-resonance]').forEach(button => button.addEventListener('click', () => {
  frame.resonanceMode = button.dataset.resonance as ResonanceMode;
  all<HTMLButtonElement>('[data-resonance]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  if (reduced) renderReducedFields(6);
}));

bowInput.addEventListener('input', () => {
  // Taking hold of the bow ends any chapter-navigation glide immediately.
  // A later user scroll still hands control back to the main story.
  stopScrollAnimation();
  frame.bowOverride = Number(bowInput.value) / 100;
  bowOverrideScrollY = window.scrollY;
  if (reduced) renderReducedFields(5);
});
spaceInput.addEventListener('input', () => {
  frame.spaceOpen = Number(spaceInput.value) / 100;
  if (reduced) renderReducedFields(7);
});
const releaseBow = () => { if (Math.floor(story) === 5) frame.bowOverride = null; };
window.addEventListener('wheel', releaseBow, { passive: true });
window.addEventListener('touchstart', event => {
  if (!(event.target instanceof HTMLInputElement)) releaseBow();
}, { passive: true });

function changeMotion(next: boolean) {
  const current = story;
  reduced = next;
  frame.reduced = reduced;
  lastChapter = -1;
  setupScroll();
  scrollToStory(current, true);
  paint();
}
$('#motion-toggle').addEventListener('click', () => {
  closeDialog(chapterDialog);
  savedMotion = reduced ? 'full' : 'reduced';
  try { localStorage.setItem('luthier-motion', savedMotion); } catch { /* Optional preference. */ }
  changeMotion(!reduced);
});
motionQuery.addEventListener('change', event => { if (!savedMotion) changeMotion(event.matches); });

window.addEventListener('resize', () => {
  window.clearTimeout(refreshTimer);
  refreshTimer = 0;
  // A navigation may have measured this viewport before its resize event was
  // delivered. Do not enqueue a second refresh that interrupts that navigation.
  if (width === window.innerWidth && Math.abs(height - window.innerHeight) <= 2 && pixelRatio === (window.devicePixelRatio || 1)) return;
  refreshTimer = window.setTimeout(() => {
    refreshTimer = 0;
    requestRefresh(true);
  }, 130);
}, { passive: true });
document.addEventListener('visibilitychange', () => {
  lastTick = 0;
  updateAudio();
  if (!document.hidden) requestRefresh(false);
});
window.addEventListener('pageshow', () => requestRefresh(false));
window.addEventListener('popstate', () => {
  const index = CHAPTERS.findIndex(([id]) => `#${id}` === location.hash);
  if (index >= 0) scrollToStory(index + .16, true);
});

field.resize(width, height);
setupScroll();
gsap.ticker.add(tick);
void document.fonts.ready.then(() => requestRefresh(false));
const assetsReady = all<HTMLImageElement>('.scene img').map(image => image.decode().catch(() => undefined));
void Promise.allSettled(assetsReady).then(() => {
  requestRefresh(false);
  body.dataset.assets = 'ready';
});
const initialChapter = CHAPTERS.findIndex(([id]) => `#${id}` === location.hash);
if (initialChapter >= 0 && window.scrollY < 4) scrollToStory(initialChapter + (initialChapter ? .16 : 0), true);
paint();

function dispose() {
  if (disposed) return;
  disposed = true;
  gsap.ticker.remove(tick);
  scoreTween?.scrollTrigger?.kill(); scoreTween?.kill(); readingTrigger?.kill();
  lenis.off('scroll', updateTrigger); lenis.destroy(); field.dispose(); audio.dispose(); model?.dispose();
  window.clearTimeout(refreshTimer); window.clearTimeout(statusTimer);
}
window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); });
if (import.meta.hot) import.meta.hot.dispose(dispose);

// Local QA can hold a rendered frame without adding controls to the artwork.
// Vite removes this diagnostic surface entirely from production builds.
if (import.meta.env.DEV) {
  Object.defineProperty(window, '__luthier', {
    configurable: true,
    get: () => ({ story, lastStory, reduced, debug: { master: master.units, units: unitLengths, height, capturePaused, refreshPending, lenisTarget: lenis.targetScroll, lenisAnimated: lenis.animatedScroll, lenisActual: lenis.actualScroll, isScrolling: lenis.isScrolling, trigger: scoreTween?.scrollTrigger?.progress }, activeChapter: lastChapter, field: { ...frame }, lenisCount: 1, tickerOwners: 1, model: model?.available ? 'ready' : modelFailed ? 'fallback' : 'idle', holdFrame: (hold: boolean) => { capturePaused = hold; }, seek: (target: number) => scrollToStory(target, true) }),
  });
}
