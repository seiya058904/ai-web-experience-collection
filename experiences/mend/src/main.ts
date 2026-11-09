import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import './style.css';
import { createInitialState, serializeSavedState, selectPlan, resetPlan, startTrial, advanceTrial, pauseTrial, resetTrial, setFocus, setComparison } from './state';
import type { AppState, InspectionFocus } from './state';
import type { PipScene, SceneFrame } from './scene';
import { fallbackArt } from './fallbacks';
import { evaluateStory } from './story';
import { mountDiagrams } from './diagrams';
import { softText } from '../../shared/soft-swap.ts';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));
const STORAGE_KEY = 'mend.choice.v1';
const base = `${import.meta.env.BASE_URL}mend/`;
const asset = (name: string) => base + 'art/' + name + '.webp';
const chapters = Array.from(document.querySelectorAll<HTMLElement>('.chapter'));
const stage = $('stage');
const canvas = $<HTMLCanvasElement>('pip-canvas');
const photo = $<HTMLImageElement>('stage-photo');
const opening = $<HTMLImageElement>('opening-image');
const hotspotLayer = $('hotspots');
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
const mobileQuery = matchMedia('(max-width: 760px)');
const chapterNames = ['Arrival', 'Familiar marks', 'The little sun', 'The catch', 'The choice', 'The repair', 'First steps', 'Still Pip', 'Into the light', 'Going home'];
const chapterCaptions = ['Pip, on arrival.', 'One fault. Three familiar things.', 'A sun. Three homes.', 'Room for one wheel to turn.', 'Two possible kinds of care.', 'New, beside familiar.', 'A short path, taken once.', 'The same small companion.', 'Into the afternoon.', 'The string is yours now.'];
const inspectionCopy: Record<InspectionFocus, [string, string]> = {
  wheel: ['The right rear wheel leans inward. Here, it catches against the body.', 'A small thing to put right.'],
  ear: ['A small corner is missing. Nothing here stops Pip from walking.', 'A familiar thing to leave alone.'],
  paint: ['The pale places are where hands have held on. They can stay.', 'A record of being loved, not a fault.'],
};
const params = new URLSearchParams(location.search);
const initialHash = location.hash.slice(1);
let userNavigated = false;
let state: AppState;
try { state = createInitialState(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')); }
catch { state = createInitialState(); }
let manualMotion: 'full' | 'reduced' | null = null;
try { const saved = localStorage.getItem('mend.motion'); if (saved === 'full' || saved === 'reduced') manualMotion = saved; } catch { /* The session remains fully functional. */ }
let reduced = manualMotion ? manualMotion === 'reduced' : motionQuery.matches;
let stillMode = params.get('view') === 'stills';
let graphicsFailed = false;
let scene: PipScene | null = null;
let sceneLoading = false;
let lenis: Lenis;
let story = 0;
let chapterProgress = 0;
let roadProgress = 0;
let currentChapter = 0;
let faultSmooth = false;
let anchors: number[] = [];
let mobile = mobileQuery.matches;
let dirty = true;
let measurePending = true;
let lastTime = 0;
let rafId = 0;
let heroStarted = -1;
let assemblyStarted = -1;
let lastStageWidth = 0;
let lastStageHeight = 0;
let requestedArt = '';
let photoRequestToken = 0;
let hashTimer: ReturnType<typeof setTimeout> | undefined;
let lastTrialStatus = state.trialStatus;
let activeDialog: HTMLDialogElement | null = null;
let dialogOpener: HTMLElement | null = null;
let disposed = false;
const imageCache = new Map<string, HTMLImageElement>();
const failedArt = new Set<string>();
const renderedAssets = new Set<string>();
const diagrams = mountDiagrams();

function announce(message: string) { $('global-status').textContent = message; }
function saveChoice() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeSavedState(state))); }
  catch { announce('Your choice will stay for this visit.'); }
}
function makeLenis() {
  lenis?.destroy();
  lenis = new Lenis({ autoRaf: false, smoothWheel: !reduced, lerp: .13, anchors: false, respectReducedMotion: true });
  lenis.on('scroll', () => { dirty = true; });
}
function setMotion() {
  document.documentElement.dataset.reduced = String(reduced);
  $('motion-toggle').setAttribute('aria-pressed', String(reduced));
  $('motion-toggle').setAttribute('aria-label', reduced ? 'Turn on motion' : 'Reduce motion');
  $('motion-label').textContent = reduced ? 'off' : 'on';
  $('reduced-steps').hidden = !reduced;
  state = pauseTrial(state);
  heroStarted = -1;
  assemblyStarted = -1;
  makeLenis();
  dirty = true;
  syncState();
}
function trialMessage(): string {
  if (state.trialStatus === 'complete') return 'Pip reached the end of the path.';
  if (state.trialStatus === 'blocked') return 'The wheel catches before the end.';
  if (state.trialStatus === 'paused') return 'Paused here. Try another walk whenever you like.';
  if (state.trialStatus === 'running') return state.trialMode === 'before' ? 'A gentle pull. The wheel begins to catch.' : 'One small wheel-turn after another.';
  return 'Ready for a trial walk.';
}
function syncState() {
  document.querySelectorAll<HTMLInputElement>('input[name="repair-plan"]').forEach(input => { input.checked = input.value === state.repairPlan; });
  document.querySelectorAll<HTMLElement>('[data-focus]').forEach(button => {
    const selected = button.dataset.focus === state.inspectionFocus;
    button.setAttribute('aria-pressed', String(selected));
    button.classList.toggle('active', selected);
  });
  $('inspection-copy').textContent = inspectionCopy[state.inspectionFocus][0];
  $('inspection-kind').textContent = inspectionCopy[state.inspectionFocus][1];
  $('choice-status').textContent = state.choiceExplicit
    ? (state.repairPlan === 'A' ? 'Your choice: the original wheel stays.' : 'Your choice: a new wheel, and the original comes home.')
    : 'Example choice — you can change it.';
  const a = state.repairPlan === 'A';
  $('repair-copy').textContent = a ? 'A small new sleeve settles around the axle. The old wheel stays.' : 'A new wooden wheel settles onto the axle. The old one is kept beside it.';
  $('part-label').textContent = a ? 'Pale new sleeve. Original wooden wheel.' : 'Pale new wheel. Original wheel in the return bag.';
  $('comparison-copy').textContent = state.compareState === 'before'
    ? 'Before: the original rear wheel leans inward.'
    : a ? 'The original wheel, with a little new help.' : 'The rear wheel is new. The familiar marks remain.';
  $('record-plan').textContent = a ? 'Original wheel retained. New sleeve fitted.' : 'New wheel fitted. Original wheel returned.';
  $('record-return').textContent = a ? 'Pip and this record. The original wheel is still on Pip.' : 'Pip, this record, and the original wheel in its own bag.';
  $('record-trial').textContent = state.trialCompleted ? 'Completed in the digital model.' : 'Not run to completion with this repair.';
  if (state.trialStatus === 'idle') $('record-trial').textContent = 'Not run.';
  $('recap-choice').textContent = a ? 'The original wheel stayed on Pip, with a new sleeve to give it room.' : 'A new wheel was fitted. The original is being returned in its own bag.';
  $('recap-trial').textContent = state.trialCompleted ? 'You tried the repair. Pip reached the end of the short path.' : 'You can visit the short path to try the repair yourself.';
  const repairStill = $<HTMLImageElement>('repair-still');
  const repairKey = a ? 'repair-A' : 'repair-B';
  if (repairStill.dataset.art !== repairKey) {
    repairStill.dataset.art = repairKey;
    repairStill.src = asset(repairKey);
  }
  repairStill.alt = a ? 'Pip with the original right rear wheel retained and a new pale sleeve visible at the axle.' : 'Pip with a new pale right rear wheel. The original wheel is visible in a translucent paper bag beside the toy.';
  $('repair-still-caption').textContent = a ? 'The original wheel stays with Pip.' : 'The original wheel comes home too, in its own bag.';
  for (const name of ['before', 'after'] as const) {
    const button = $('compare-' + name);
    const selected = state.compareState === name;
    button.setAttribute('aria-pressed', String(selected));
    button.classList.toggle('selected', selected);
  }
  $('trial-result').textContent = trialMessage();
  $('trial-progress').style.width = state.trialProgress * 100 + '%';
  $('trial-marker').style.left = state.trialProgress * 100 + '%';
  $('trial-start').setAttribute('aria-label', state.trialStatus === 'running' ? 'Restart the repaired trial walk' : 'Try one repaired walk');
  $('view-toggle').textContent = sceneLoading ? 'Preparing views…' : stillMode || graphicsFailed ? 'Object views' : 'Still views';
  $<HTMLButtonElement>('view-toggle').disabled = sceneLoading;
  $('view-toggle').setAttribute('aria-pressed', String(stillMode || graphicsFailed));
  dirty = true;
}

function artForChapter(chapter: number): string {
  if (chapter === 0) return mobile ? 'hero-mobile' : 'hero-desktop';
  if (chapter === 1 || chapter === 3 || chapter === 4) return 'inspection';
  if (chapter === 2) return 'underside';
  if (chapter === 6 && state.trialMode === 'before') return 'inspection';
  if (chapter === 8) return state.repairPlan === 'A' ? 'long-road' : 'long-road-B';
  return state.repairPlan === 'A' ? 'repair-A' : 'repair-B';
}
function loadArt(key: string) {
  if (imageCache.has(key) || failedArt.has(key)) return;
  const image = new Image();
  image.decoding = 'async';
  imageCache.set(key, image);
  image.onload = () => {
    renderedAssets.add(key);
    if (requestedArt === key) { photo.src = image.src; dirty = true; }
  };
  image.onerror = () => { failedArt.add(key); imageCache.delete(key); if (requestedArt === key) photo.src = fallbackArt[key]; };
  image.src = asset(key);
}
function setPhoto(key: string) {
  if (requestedArt === key) return;
  requestedArt = key;
  const token = ++photoRequestToken;
  // The target chapter is visible immediately; no previous-chapter image is held.
  photo.src = fallbackArt[key];
  photo.dataset.art = key;
  const cached = imageCache.get(key);
  if (cached?.complete && cached.naturalWidth && token === photoRequestToken) photo.src = cached.src;
  else loadArt(key);
}
function measure() {
  measurePending = false;
  anchors = chapters.map(chapter => chapter.offsetTop);
  mobile = mobileQuery.matches;
  const rect = stage.getBoundingClientRect();
  if (rect.width !== lastStageWidth || rect.height !== lastStageHeight) {
    scene?.resize(rect.width, rect.height, mobile);
    lastStageWidth = rect.width;
    lastStageHeight = rect.height;
  }
  lenis?.resize();
  dirty = true;
}
function sampleStory(y: number) {
  const sample = evaluateStory(y, anchors, chapters[9].offsetHeight, innerHeight);
  chapterProgress = sample.holdProgress;
  roadProgress = sample.roadProgress;
  story = sample.pose;
  currentChapter = sample.chapter;
  document.body.dataset.chapter = String(currentChapter + 1);
  document.body.dataset.story = story.toFixed(4);
  document.body.dataset.plan = state.repairPlan;
  softText($('chapter-count'), String(currentChapter + 1).padStart(2, '0'), { instant: reduced });
  softText($('chapter-name'), chapterNames[currentChapter], { instant: reduced });
  $('story-progress').style.width = (story / 9 * 100) + '%';
  const showBefore = currentChapter < 5 || (currentChapter === 6 && state.trialMode === 'before') || (currentChapter === 7 && state.compareState === 'before');
  $('scene-description').textContent = chapterCaptions[currentChapter] + ' ' + (showBefore ? 'Pip still has the original tilted right rear wheel.' : state.repairPlan === 'A' ? 'The original wheel is retained with a new sleeve. No wheel was removed.' : 'A new wheel is fitted. The original is kept in its return bag.');
  document.querySelectorAll<HTMLAnchorElement>('.chapter-rail a').forEach((link, i) => {
    if (i === currentChapter) link.setAttribute('aria-current', 'step'); else link.removeAttribute('aria-current');
  });
}
function render(time: number) {
  if (disposed || document.hidden) return;
  lenis.raf(time);
  if (measurePending) measure();
  if (dirty) sampleStory(window.scrollY);
  const delta = lastTime ? time - lastTime : 0;
  lastTime = time;
  const next = advanceTrial(state, delta, currentChapter === 6, true);
  if (next !== state) {
    state = next;
    $('trial-progress').style.width = state.trialProgress * 100 + '%';
    $('trial-marker').style.left = state.trialProgress * 100 + '%';
    dirty = true;
    if (lastTrialStatus !== state.trialStatus) {
      lastTrialStatus = state.trialStatus;
      syncState();
    }
  }
  let tug = 0;
  if (heroStarted >= 0) {
    const p = clamp((time - heroStarted) / 1200);
    tug = p < .45 ? Math.sin(p / .45 * Math.PI / 2) : 1 - (p - .45) / .55;
    if (p >= 1 || currentChapter !== 0) { heroStarted = -1; tug = 0; }
    dirty = true;
  }
  let fitting = 1;
  if (assemblyStarted >= 0) {
    const p = clamp((time - assemblyStarted) / 1500);
    fitting = 1 - Math.pow(1 - p, 3);
    if (p === 1 || currentChapter !== 5) {
      assemblyStarted = -1;
      $('seat-result').textContent = 'In place, with room to turn.';
    }
    dirty = true;
  }
  if (dirty) {
    dirty = false;
    sampleStory(window.scrollY);
    diagrams.update({faultSmooth,repairPlan:state.repairPlan,assemblyProgress:fitting,trialProgress:state.trialProgress,trialMode:state.trialMode,reducedMotion:reduced,compareState:state.compareState});
    const targetKey = artForChapter(currentChapter);
    const useStills = stillMode || graphicsFailed || !scene;
    const medium = useStills ? (currentChapter === 0 ? 'photo' : 'still') : 'live';
    if (stage.dataset.medium !== medium) stage.dataset.medium = medium;
    document.body.dataset.medium = medium;
    softText($('scene-label'), useStills && currentChapter === 7 ? 'Repaired details. Compare the axle below.' : chapterCaptions[currentChapter], { instant: reduced });
    if (useStills && currentChapter === 7) {
      $('scene-description').textContent += ' The photograph holds the repaired details; the drawing compares the selected state in one fixed pose.';
    }
    if (useStills) {
      setPhoto(targetKey);
      photo.style.transform = '';
      if (currentChapter === 0) {
        $('opening-picture').style.transform = tug ? 'translateX(' + (-tug * 5) + 'px)' : '';
      }
    } else {
      const frame: SceneFrame = {
        story, repairPlan: state.repairPlan, inspectionFocus: state.inspectionFocus,
        trialProgress: state.trialProgress, trialMode: state.trialMode,
        compareState: state.compareState, reducedMotion: reduced, heroTug: tug,
        chapterProgress, roadProgress, faultSmooth, assemblyProgress: assemblyStarted >= 0 ? fitting : undefined,
      };
      scene?.render(frame);
    }
    // The numbered points fade with the chapter instead of appearing in one frame.
    const hotspotsOff = currentChapter !== 1 || useStills || mobile || Math.abs(story - 1) > .22;
    hotspotLayer.classList.toggle('is-off', hotspotsOff);
    hotspotLayer.inert = hotspotsOff;
    if (!hotspotsOff && scene) {
      document.querySelectorAll<HTMLElement>('.hotspot').forEach(button => {
        const point = scene!.projectPoint(button.dataset.focus as InspectionFocus);
        button.style.left = point.x + 'px'; button.style.top = point.y + 'px';
      });
    }
    loadArt(artForChapter(Math.min(9, currentChapter + 1)));
  }
  rafId = requestAnimationFrame(render);
}
function requestMeasure() { measurePending = true; dirty = true; }
function closeDialog(restoreFocus = true) {
  if (!activeDialog) return;
  if (!restoreFocus) dialogOpener = null;
  activeDialog.close();
}
function openDialog(id: string, opener: HTMLElement) {
  dialogOpener = opener;
  activeDialog = $<HTMLDialogElement>(id);
  activeDialog.showModal();
}
function scrollToChapter(id: string, push = true, instant = false) {
  const target = document.getElementById(id);
  if (!target || !target.classList.contains('chapter')) return;
  closeDialog(false);
  if (push) history.pushState({chapter:id}, '', '#' + id);
  state = pauseTrial(state);
  syncState();
  lenis.scrollTo(target, {
    immediate: reduced || instant,
    duration: .85,
    onComplete: () => {
      target.querySelector<HTMLElement>('h1,h2')?.focus({preventScroll:true});
      dirty = true;
    },
  });
  dirty = true;
}

document.addEventListener('click', event => {
  const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#chapter-"]');
  if (!anchor || event.defaultPrevented || (event as MouseEvent).metaKey || (event as MouseEvent).ctrlKey) return;
  event.preventDefault();
  userNavigated = true;
  scrollToChapter(anchor.hash.slice(1));
});
document.querySelectorAll<HTMLElement>('[data-focus]').forEach(button => button.addEventListener('click', () => {
  state = setFocus(state, button.dataset.focus as InspectionFocus); syncState();
}));
function commitChoice(plan: 'A' | 'B') {
  state = selectPlan(state, plan);
  assemblyStarted = -1;
  saveChoice(); syncState();
}
document.querySelectorAll<HTMLInputElement>('input[name="repair-plan"]').forEach(input => {
  input.addEventListener('click', () => commitChoice(input.value as 'A' | 'B'));
  input.addEventListener('change', () => commitChoice(input.value as 'A' | 'B'));
});
$('confirm-plan').addEventListener('click', () => commitChoice(state.repairPlan));
$('plan-reset').addEventListener('click', () => { state = resetPlan(state); assemblyStarted = -1; saveChoice(); syncState(); announce('The example choice is restored.'); });
$('hero-pull').addEventListener('click', () => {
  heroStarted = reduced ? -1 : performance.now();
  $('hero-result').textContent = 'The rear wheel catches. Pip needs a little help.';
  dirty = true;
});
$('seat-part').addEventListener('click', () => {
  assemblyStarted = reduced ? -1 : performance.now();
  $('seat-result').textContent = reduced ? 'In place, with room to turn.' : 'A small part finds its place.';
  dirty = true;
});
for (const kind of ['catch', 'clear']) $('fault-' + kind).addEventListener('click', () => {
  faultSmooth = kind === 'clear';
  $('fault-catch').setAttribute('aria-pressed', String(!faultSmooth));
  $('fault-clear').setAttribute('aria-pressed', String(faultSmooth));
  $('fault-catch').classList.toggle('selected', !faultSmooth);
  $('fault-clear').classList.toggle('selected', faultSmooth);
  $('fault-result').textContent = faultSmooth ? 'A small gap lets the wheel turn without touching.' : 'The tilted wheel touches the body.';
  dirty = true;
});
$('trial-start').addEventListener('click', () => { state = startTrial(state, 'repaired', reduced); lastTrialStatus = state.trialStatus; syncState(); });
$('trial-before').addEventListener('click', () => { state = startTrial(state, 'before', reduced); lastTrialStatus = state.trialStatus; syncState(); });
$('trial-reset').addEventListener('click', () => { state = resetTrial(state); lastTrialStatus = state.trialStatus; syncState(); $('trial-result').textContent = 'Trial reset. Ready whenever you are.'; });
for (const value of ['before', 'after'] as const) $('compare-' + value).addEventListener('click', () => { state = setComparison(state, value); syncState(); });
$('motion-toggle').addEventListener('click', () => {
  reduced = !reduced; manualMotion = reduced ? 'reduced' : 'full';
  try { localStorage.setItem('mend.motion', manualMotion); } catch { /* Optional preference storage. */ }
  setMotion();
  announce(reduced ? 'Motion reduced. The whole story remains available.' : 'Motion is on.');
});
$('view-toggle').addEventListener('click', () => {
  if (graphicsFailed && scene) {
    announce('Object views will return when graphics are available. The illustrated chapter remains complete.');
    return;
  }
  if (graphicsFailed || stillMode) {
    stillMode = false;
    graphicsFailed = false;
    if (!scene) void initializeScene();
  } else {
    stillMode = true;
  }
  syncState();
});
$('chapters-open').addEventListener('click', () => openDialog('chapters-dialog', $('chapters-open')));
$('about-open').addEventListener('click', () => openDialog('about-dialog', $('about-open')));
document.querySelectorAll<HTMLDialogElement>('dialog').forEach(dialog => {
  dialog.querySelector('button.dialog-close')!.addEventListener('click', () => closeDialog());
  dialog.addEventListener('close', () => { activeDialog = null; dialogOpener?.focus({preventScroll:true}); });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
});
$('download-record').addEventListener('click', () => {
  const text = [
    'MEND — Still Yours', 'A record of care', '', 'Companion: Pip',
    'Care given: ' + $('record-plan').textContent,
    'Kept: Chipped right ear, worn paint, little sun underneath.',
    'Move marks: All three retained.',
    'Coming home: ' + $('record-return').textContent,
    'Trial walk: ' + $('record-trial').textContent,
    '', '“I painted the sun when I was little. Now He would like to take Pip for a walk.” — Lan',
    '', 'An original fictional story. The trial describes a digital model, not the safety of a real toy.',
  ].join('\n');
  const url = URL.createObjectURL(new Blob([text], {type:'text/plain;charset=utf-8'}));
  const link = document.createElement('a'); link.href = url; link.download = 'Pip-Repair-Card.txt';
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  announce('Your repair card is ready to keep.');
});
document.querySelectorAll<HTMLImageElement>('.story-detail img').forEach(image => image.addEventListener('error', () => {
  const key = image.id === 'repair-still' ? (state.repairPlan === 'A' ? 'repair-A' : 'repair-B') : 'underside';
  if (!image.src.startsWith('data:')) image.src = fallbackArt[key];
}));
document.querySelectorAll<HTMLImageElement>('.inspect-thumb img').forEach(image => image.addEventListener('error', () => {
  if (!image.src.startsWith('data:')) image.src = fallbackArt.inspection;
}));
opening.addEventListener('error', () => {
  const source = document.querySelector<HTMLSourceElement>('#opening-picture source');
  if (source) source.srcset = '';
  opening.src = fallbackArt[mobile ? 'hero-mobile' : 'hero-desktop'];
});
document.querySelectorAll<HTMLDetailsElement>('details').forEach(details => details.addEventListener('toggle', requestMeasure));
window.addEventListener('scroll', () => {
  dirty = true;
  clearTimeout(hashTimer);
  hashTimer = setTimeout(() => {
    if (!activeDialog) history.replaceState({chapter:chapters[currentChapter].id}, '', '#' + chapters[currentChapter].id);
  }, 260);
}, {passive:true});
window.addEventListener('resize', requestMeasure, {passive:true});
for (const eventName of ['wheel', 'touchstart', 'pointerdown', 'keydown']) {
  window.addEventListener(eventName, () => { userNavigated = true; }, {once:true,passive:true});
}
window.addEventListener('popstate', () => scrollToChapter(location.hash.slice(1) || 'chapter-01', false, true));
window.addEventListener('hashchange', () => scrollToChapter(location.hash.slice(1) || 'chapter-01', false, true));
motionQuery.addEventListener('change', () => { if (!manualMotion) { reduced = motionQuery.matches; setMotion(); } });
mobileQuery.addEventListener('change', requestMeasure);
document.addEventListener('visibilitychange', () => {
  state = pauseTrial(state); syncState();
  cancelAnimationFrame(rafId);
  lastTime = 0;
  if (!document.hidden) { requestMeasure(); rafId = requestAnimationFrame(render); }
});
window.addEventListener('online', () => { failedArt.clear(); requestedArt = ''; dirty = true; });
canvas.addEventListener('webglcontextrestored', () => { graphicsFailed = false; $('resource-notice').hidden = true; requestMeasure(); syncState(); });
const observer = new ResizeObserver(requestMeasure);
observer.observe(stage);
chapters.forEach(chapter => observer.observe(chapter));

async function initializeScene() {
  if (sceneLoading || disposed || scene) return;
  if (params.get('graphics') === 'off') { stillMode = true; syncState(); return; }
  sceneLoading = true;
  syncState();
  try {
    const { createPipScene } = await import('./scene');
    if (disposed || scene) return;
    scene = createPipScene(canvas, message => {
      graphicsFailed = true;
      $('resource-notice').textContent = message;
      $('resource-notice').hidden = false;
      syncState();
    });
    graphicsFailed = false;
    $('resource-notice').hidden = true;
    lastStageWidth = 0; lastStageHeight = 0;
    requestMeasure();
    performance.mark('mend-object-ready');
  } catch {
    graphicsFailed = true;
  } finally {
    sceneLoading = false;
    syncState();
  }
}
window.addEventListener('pagehide', event => {
  state = pauseTrial(state);
  if (!event.persisted) {
    disposed = true;
    clearTimeout(hashTimer); cancelAnimationFrame(rafId);
    scene?.dispose(); observer.disconnect(); lenis.destroy();
  }
});
window.addEventListener('pageshow', event => {
  if (event.persisted) { lastTime = 0; requestMeasure(); cancelAnimationFrame(rafId); rafId = requestAnimationFrame(render); }
});

document.body.dataset.chapter = '1';
setMotion();
measure();
syncState();
performance.mark('mend-controls-ready');
rafId = requestAnimationFrame(render);
void initializeScene();
void document.fonts.ready.then(() => {
  requestMeasure();
  if (!userNavigated && /^chapter-(0[1-9]|10)$/.test(initialHash)) {
    requestAnimationFrame(() => { if (!userNavigated) scrollToChapter(initialHash, false, true); });
  }
});
