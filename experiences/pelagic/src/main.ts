import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createState, chooseLight, restoreAuthored, updateProgress, advance, replayEncounter, scrubEncounter, panelOpacity, transitionState, clamp } from './state';
import type { Pattern } from './state';
import { SceneRenderer, stillMarkup, combMarkup } from './renderer';

gsap.registerPlugin(ScrollTrigger);
const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const $$ = <T extends HTMLElement>(selector: string) => Array.from(document.querySelectorAll<T>(selector));
const media = matchMedia('(prefers-reduced-motion: reduce)');
const state = createState(media.matches);
const stage = $('#stage');
const story = $('#exhibition');
const chapters = $$('.chapter');
const lightInputs = $$<HTMLInputElement>('.survey-light');
const encounterInput = $<HTMLInputElement>('#encounter-progress');
const motionButton = $<HTMLButtonElement>('#motion-toggle');
const localPause = $<HTMLButtonElement>('#pause-encounter');
const svgUse = (id: string) => '<svg class="icon" aria-hidden="true"><use href="#' + id + '"/></svg>';
const cleanups: Array<() => void> = [];
const ids = ['encounter', 'less-light', 'purpose', 'patterns', 'look-again'];
let lastActive = -1;
let pendingChapterFocus = -1;
let lastTick = 0;
let needsRender = true;
let lastControls = '';
let refreshTimer: ReturnType<typeof setTimeout> | undefined;
let dialogOpener: HTMLElement | null = null;
let activeDialog: HTMLDialogElement | null = null;
let disposed = false;
let layoutWidth = innerWidth, layoutHeight = innerHeight;
let refreshingGeometry = false;

function listen<K extends keyof WindowEventMap>(target: Window, name: K, fn: (event: WindowEventMap[K]) => void): void;
function listen(target: EventTarget, name: string, fn: EventListener): void;
function listen(target: EventTarget, name: string, fn: EventListener) {
  target.addEventListener(name, fn);
  cleanups.push(() => target.removeEventListener(name, fn));
}

try {
  const stored = JSON.parse(sessionStorage.getItem('pelagic-observation-v1') || 'null');
  if (stored && typeof stored === 'object') {
    if (typeof stored.manualLight === 'number' && Number.isFinite(stored.manualLight)) chooseLight(state, clamp(stored.manualLight));
    if (stored.pattern === 'A' || stored.pattern === 'B') state.pattern = stored.pattern;
    if (typeof stored.backlight === 'boolean') state.backlight = stored.backlight;
    if (typeof stored.motionPaused === 'boolean') state.motionPaused = state.reducedMotion || stored.motionPaused;
    if (typeof stored.encounter === 'number' && Number.isFinite(stored.encounter)) scrubEncounter(state, clamp(stored.encounter));
  }
} catch { /* Storage is optional; blocked or invalid storage cannot block the exhibition. */ }

function persist() {
  try {
    sessionStorage.setItem('pelagic-observation-v1', JSON.stringify({
      manualLight: state.manualLight, pattern: state.pattern, backlight: state.backlight,
      motionPaused: state.motionPaused, encounter: state.encounter.visited ? state.encounter.position : undefined,
    }));
  } catch { /* Private-mode and full-storage fallbacks deliberately remain usable. */ }
}

const lenis = new Lenis({
  autoRaf: false,
  smoothWheel: !state.reducedMotion,
  lerp: .105,
  syncTouch: false,
  prevent: node => !!node.closest('dialog, input, .chapter-stack.is-scrollable'),
});
const onLenis = () => ScrollTrigger.update();
lenis.on('scroll', onLenis);
gsap.ticker.lagSmoothing(0);
gsap.ticker.fps(60);

const renderer = new SceneRenderer($<HTMLCanvasElement>('#scene'), stage);
const trigger = ScrollTrigger.create({
  trigger: story,
  start: 'top top',
  end: 'bottom bottom',
  invalidateOnRefresh: true,
  onUpdate: self => {
    if (!refreshingGeometry && innerWidth === layoutWidth && innerHeight === layoutHeight) updateProgress(state, self.progress * 4);
    needsRender = true;
  },
  onRefresh: self => {
    if (!refreshingGeometry && innerWidth === layoutWidth && innerHeight === layoutHeight) updateProgress(state, self.progress * 4);
    needsRender = true;
  },
});

function refreshGeometry() {
  if (disposed) return;
  const retained = state.progress;
  const resized = innerWidth !== layoutWidth || innerHeight !== layoutHeight;
  refreshingGeometry = true;
  lenis.resize();
  ScrollTrigger.refresh();
  if (resized) lenis.scrollTo(retained / 4 * (story.offsetHeight - innerHeight), { immediate: true });
  layoutWidth = innerWidth; layoutHeight = innerHeight;
  refreshingGeometry = false;
  updateProgress(state, resized ? retained : trigger.progress * 4);
  renderer.resize();
  const content = $('#observation-controls');
  content.classList.toggle('is-scrollable', innerHeight < 521);
  needsRender = true;
}
function scheduleRefresh() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(refreshGeometry, 120);
}

function go(index: number, historyMode: 'push' | 'none' = 'push') {
  const next = clamp(index, 0, 4);
  if (activeDialog) {
    // The native close event arrives later. Resume before asking Lenis to move,
    // otherwise navigation from the index is ignored while Lenis is stopped.
    activeDialog.close(); activeDialog = null; state.modalOpen = false;
    dialogOpener = null; lenis.start();
  }
  if (historyMode === 'push') history.pushState({ chapter: next }, '', '#' + ids[next]);
  pendingChapterFocus = next;
  const content = $('#observation-controls');
  content.scrollTop = 0;
  lenis.scrollTo(next / 4 * (story.offsetHeight - innerHeight), {
    immediate: state.reducedMotion,
    duration: .95,
    easing: t => 1 - Math.pow(1 - t, 3),
    onComplete: () => { needsRender = true; },
  });
}
$$('[data-go]').forEach(el => listen(el, 'click', event => {
  event.preventDefault();
  go(Number(el.dataset.go));
}));
listen(window, 'popstate', () => {
  const next = ids.indexOf(location.hash.slice(1));
  if (next >= 0) go(next, 'none'); else go(0, 'none');
});

lightInputs.forEach(input => listen(input, 'input', () => {
  chooseLight(state, Number(input.value) / 100);
  persist(); needsRender = true;
}));
$$('.restore-light').forEach(button => listen(button, 'click', () => {
  restoreAuthored(state); persist(); needsRender = true;
  $('#announcement').textContent = 'Returning smoothly to the authored light at this observation.';
}));
listen(motionButton, 'click', () => {
  state.motionPaused = !state.motionPaused;
  persist(); needsRender = true;
});
listen($('#replay-encounter'), 'click', () => {
  replayEncounter(state); persist(); needsRender = true;
  $('#announcement').textContent = state.motionPaused ? 'Encounter reset. Use the progress control or resume motion.' : 'Replaying the illustrative encounter.';
});
listen(localPause, 'click', () => {
  if (state.motionPaused) {
    $('#announcement').textContent = 'Motion is paused globally. The encounter progress control still works.';
    return;
  }
  if (state.encounter.position >= 1) state.encounter.position = 0;
  state.encounter.playing = !state.encounter.playing;
  state.encounter.visited = true; needsRender = true; persist();
});
listen(encounterInput, 'input', () => {
  scrubEncounter(state, Number(encounterInput.value) / 100); persist(); needsRender = true;
});
listen($('#step-encounter'), 'click', () => {
  scrubEncounter(state, state.encounter.position >= 1 ? 0 : state.encounter.position + .1);
  persist(); needsRender = true;
});
$$<HTMLButtonElement>('.pattern-row button').forEach(button => listen(button, 'click', () => {
  state.pattern = button.dataset.pattern as Pattern;
  persist(); needsRender = true;
}));
listen($('#backlight'), 'change', event => {
  state.backlight = (event.target as HTMLInputElement).checked;
  persist(); needsRender = true;
});

function updateComparison() {
  $('#still-a').innerHTML = stillMarkup('A', state.light, state.backlight, renderer.squidUnavailable);
  $('#still-b').innerHTML = stillMarkup('B', state.light, state.backlight, renderer.squidUnavailable);
  $('#comparison-setting').textContent = 'Survey light ' + Math.round(state.light * 100) + '% · Conceptual backlight ' + (state.backlight ? 'on' : 'off') + '. These are relative display settings.';
}
function openDialog(dialog: HTMLDialogElement) {
  if (activeDialog) activeDialog.close();
  dialogOpener = document.activeElement as HTMLElement;
  activeDialog = dialog; state.modalOpen = true; lenis.stop();
  if (dialog.id === 'compare-dialog') updateComparison();
  if (dialog.id === 'comb-dialog') $('#comb-art').innerHTML = combMarkup(Number($<HTMLInputElement>('#comb-light').value) / 100);
  dialog.showModal();
  dialog.scrollTop = 0;
}
$$('[data-dialog]').forEach(button => listen(button, 'click', () => {
  openDialog($<HTMLDialogElement>('#' + button.dataset.dialog));
}));
$$<HTMLDialogElement>('dialog').forEach(dialog => {
  const close = dialog.querySelector<HTMLButtonElement>('.close-dialog')!;
  listen(close, 'click', () => dialog.close());
  listen(dialog, 'click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    const mouse = event as MouseEvent;
    if (mouse.clientX < rect.left || mouse.clientX > rect.right || mouse.clientY < rect.top || mouse.clientY > rect.bottom) dialog.close();
  });
  listen(dialog, 'close', () => {
    state.modalOpen = false; activeDialog = null; lenis.start();
    dialogOpener?.focus({ preventScroll: true }); dialogOpener = null;
    lastTick = 0; needsRender = true;
  });
});
listen($('#renderer-toggle'), 'click', () => {
  const svg = renderer.toggleMode(); needsRender = true;
  $('#renderer-toggle').innerHTML = (svg ? 'Use living view ' : 'Use illustrated view ') + svgUse('i-arrow');
  $('#renderer-status').textContent = svg ? 'Illustrated view is active. Light, encounter and pigmentation remain independently controlled.' : 'Living view is active. Rendering uses Canvas 2D with no WebGL requirement.';
});
listen($('#comb-light'), 'input', event => {
  const input = event.target as HTMLInputElement;
  const value = Number(input.value);
  $('#comb-art').innerHTML = combMarkup(value / 100);
  $('#comb-output').textContent = value + '%';
  input.style.setProperty('--fill', value + '%');
});

function syncControls() {
  const light = Math.round(state.light * 100), encounter = Math.round(state.encounter.position * 100);
  const signature = [light, encounter, state.manualLight, state.pattern, state.backlight, state.motionPaused, state.encounter.playing, state.progress.toFixed(3)].join('|');
  if (signature === lastControls) return;
  lastControls = signature;
  lightInputs.forEach(input => {
    if (document.activeElement !== input || state.manualLight === null) input.value = String(light);
    input.style.setProperty('--fill', light + '%');
  });
  $$('.light-output').forEach(output => output.textContent = String(light).padStart(2, '0'));
  $$('.mode-label').forEach(label => label.textContent = state.manualLight === null ? 'Authored light' : 'Your light · held');
  $$<HTMLButtonElement>('.restore-light').forEach(button => button.hidden = state.manualLight === null);
  if (document.activeElement !== encounterInput || state.encounter.playing) encounterInput.value = String(encounter);
  encounterInput.style.setProperty('--fill', encounter + '%');
  $('#encounter-output').textContent = encounter + '%';
  const playing = state.encounter.playing && !state.motionPaused;
  localPause.innerHTML = svgUse(playing ? 'i-pause' : 'i-play');
  localPause.setAttribute('aria-label', playing ? 'Pause encounter' : 'Play encounter');
  motionButton.innerHTML = svgUse(state.motionPaused ? 'i-play' : 'i-pause');
  motionButton.setAttribute('aria-label', state.motionPaused ? 'Resume motion' : 'Pause motion');
  motionButton.title = state.motionPaused ? 'Resume motion' : 'Pause motion';
  motionButton.setAttribute('aria-pressed', String(state.motionPaused));
  document.documentElement.dataset.motion = state.motionPaused ? 'quiet' : 'living';
  $$('.pattern-row button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.pattern === state.pattern)));
  $<HTMLInputElement>('#backlight').checked = state.backlight;
  stage.dataset.lightMode = state.manualLight === null ? 'authored' : 'manual';
  stage.dataset.light = String(light);
  stage.dataset.encounter = String(encounter);
  stage.dataset.pattern = state.pattern;
  stage.dataset.backlight = String(state.backlight);
  stage.dataset.progress = state.progress.toFixed(4);
  stage.dataset.motion = state.motionPaused ? 'paused' : 'living';
  stage.dataset.fishCount = state.progress > 1.58 && state.progress < 2.83 ? '1' : '0';
  $('#manual-hint').hidden = !(state.manualLight !== null && state.manualLight > .5 && state.progress > .9 && state.progress < 2.5);
}

function syncNarrative() {
  const t = transitionState(state.progress);
  chapters.forEach((chapter, i) => {
    const opacity = panelOpacity(i, state.progress);
    const visible = opacity > .001;
    chapter.style.opacity = String(opacity);
    chapter.style.visibility = visible ? 'visible' : 'hidden';
    chapter.style.pointerEvents = opacity > .5 ? 'auto' : 'none';
    chapter.inert = opacity <= .5;
    chapter.setAttribute('aria-hidden', String(opacity <= .5));
    chapter.classList.toggle('active', visible);
    const prose = chapter.querySelector<HTMLElement>('.prose')!;
    // Very small safe displacement; the body never builds from particles.
    prose.style.transform = state.reducedMotion ? 'none' : 'translateY(' + ((1 - opacity) * (state.progress > i ? -10 : 10)) + 'px)';
  });
  if (lastActive !== t.active) {
    lastActive = t.active;
    $$('.chapter-nav [data-go]').forEach(link => {
      if (Number(link.dataset.go) === t.active) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });
    $('#chapter-current').textContent = String(t.active + 1).padStart(2, '0');
    $('#scroll-cue-text').textContent = t.active === 4 ? 'Stay a little longer' : 'Scroll to observe';
    if (t.active > 0) $('#announcement').textContent = 'Chapter ' + (t.active + 1) + ': ' + chapters[t.active].querySelector<HTMLElement>('h1,h2')?.innerText.replace(/\s+/g, ' ');
  }
  if (pendingChapterFocus >= 0 && panelOpacity(pendingChapterFocus, state.progress) > .96) {
    const heading = chapters[pendingChapterFocus].querySelector<HTMLElement>('h1,h2')!;
    heading.tabIndex = -1; heading.focus({ preventScroll: true }); pendingChapterFocus = -1;
  }
  const squidView = state.progress > 2.8 && state.progress < 3.8;
  $('#species-name').textContent = squidView ? 'Dosidicus gigas' : 'Erenna sirena';
  $('#species-description').textContent = squidView ? (state.pattern === 'A' ? 'Pattern A · Bilaterally pale and dark' : 'Pattern B · Countershaded') : 'A colony. Many lives, one body.';
  $('#specimen-caption').style.opacity = String(squidView ? smoothCaption(state.progress) : 1 - smoothCaption(Math.max(2.3, state.progress)));
  if (state.progress > 3.88 || state.progress < 2.55) $('#specimen-caption').style.opacity = '1';
  $('#edit-label').style.opacity = t.returnEdit > .12 && t.returnEdit < .88 ? '1' : '0';
  const scene = $<HTMLCanvasElement>('#scene');
  scene.setAttribute('aria-label', squidView ? 'A Humboldt-squid-inspired specimen with ' + (state.pattern === 'A' ? 'bilaterally pale and dark' : 'countershaded') + ' pigmentation. Conceptual backlighting is ' + (state.backlight ? 'on.' : 'off.') : 'A delicate Erenna-inspired siphonophore colony. Its connected terminal lure produces light independently of the survey illumination.');
}
function smoothCaption(progress: number) { return clamp((progress - 2.64) / .22) * clamp((3.82 - progress) / .22); }

function tick(time: number) {
  if (disposed || state.hidden) return;
  lenis.raf(time * 1000);
  const dt = lastTick ? Math.min(time - lastTick, .05) : 0;
  lastTick = time;
  const wasLight = state.light;
  advance(state, dt);
  const shouldDraw = needsRender || !state.motionPaused || Math.abs(wasLight - state.light) > .0001;
  if (shouldDraw && !state.modalOpen) {
    syncNarrative(); syncControls(); renderer.render(state);
    needsRender = false;
  } else if (needsRender) { syncControls(); }
}
gsap.ticker.add(tick);

listen(window, 'resize', scheduleRefresh);
listen(window, 'orientationchange', scheduleRefresh);
listen(document, 'visibilitychange', () => {
  state.hidden = document.hidden; lastTick = 0;
  if (state.hidden) { persist(); gsap.ticker.sleep(); }
  else { gsap.ticker.wake(); scheduleRefresh(); needsRender = true; }
});
listen(window, 'pageshow', () => { state.hidden = false; gsap.ticker.wake(); lastTick = 0; scheduleRefresh(); });
listen(window, 'pagehide', event => {
  persist(); gsap.ticker.sleep();
  if (!(event as PageTransitionEvent).persisted) dispose();
});
const onMotionPreference = () => {
  state.reducedMotion = media.matches;
  if (state.reducedMotion) { state.motionPaused = true; state.encounter.playing = false; }
  lenis.options.smoothWheel = !state.reducedMotion;
  needsRender = true; scheduleRefresh();
};
media.addEventListener('change', onMotionPreference);
cleanups.push(() => media.removeEventListener('change', onMotionPreference));

function dispose() {
  if (disposed) return; disposed = true;
  clearTimeout(refreshTimer);
  cleanups.forEach(cleanup => cleanup());
  gsap.ticker.remove(tick); trigger.kill();
  lenis.off('scroll', onLenis); lenis.destroy(); renderer.dispose();
}
import.meta.hot?.dispose(dispose);

void renderer.load().then(() => { renderer.resize(); needsRender = true; });
void document.fonts.ready.then(refreshGeometry);
refreshGeometry();
syncNarrative(); syncControls(); renderer.render(state);
const initialChapter = ids.indexOf(location.hash.slice(1));
if (initialChapter > 0) {
  let initialNavigationAllowed = true;
  const restoreInitialChapter = () => {
    if (!initialNavigationAllowed) return;
    refreshGeometry();
    lenis.scrollTo(initialChapter / 4 * (story.offsetHeight - innerHeight), { immediate: true });
    updateProgress(state, initialChapter); needsRender = true;
  };
  // Native fragment positioning can run after module evaluation. Reapply the
  // chapter once load has settled, unless the visitor has already taken control.
  listen(window, 'pointerdown', () => { initialNavigationAllowed = false; });
  listen(window, 'wheel', () => { initialNavigationAllowed = false; });
  listen(window, 'keydown', () => { initialNavigationAllowed = false; });
  restoreInitialChapter();
  if (document.readyState !== 'complete') listen(window, 'load', restoreInitialChapter);
}
