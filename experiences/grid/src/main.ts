import 'lenis/dist/lenis.css';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { clamp, mix, range, smooth } from './math.ts';
import { CONTENT_KEYS, SCENES, layout, resolve } from './scenes.ts';
import type { Axes, Design, Frame, View } from './scenes.ts';
import { Renderer } from './renderer.ts';

const $ = <T extends Element = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const root = document.documentElement;
const media = matchMedia('(prefers-reduced-motion: reduce)');
const readStore = (key: string, session = false) => {try {return (session ? sessionStorage : localStorage).getItem(key);} catch {return null;}};
const writeStore = (key: string, value: string, session = false) => {try {(session ? sessionStorage : localStorage).setItem(key, value);} catch {/* Private browsing still works. */}};
let reduced = media.matches || readStore('grid:reduce-motion') === '1';
const lifecycle = new AbortController();
const cleanups: (() => void)[] = [];
let destroyed = false;
let suspended = document.hidden;
let suspendRuntime = () => {};
let resumeRuntime = () => {};
function listen<T extends Event>(target: EventTarget, type: string, handler: (event: T) => void, options: AddEventListenerOptions = {}) {
  target.addEventListener(type, handler as EventListener, {...options, signal: lifecycle.signal});
}
function dispose() {
  if (destroyed) return;
  destroyed = true;
  lifecycle.abort();
  for (const cleanup of [...cleanups].reverse()) cleanup();
  cleanups.length = 0;
}
listen(window, 'pagehide', (event: PageTransitionEvent) => {
  suspended = true;
  suspendRuntime();
  if (!event.persisted) dispose();
});
listen(window, 'pageshow', (event: PageTransitionEvent) => {
  if (!event.persisted || destroyed) return;
  suspended = document.hidden;
  if (!suspended) resumeRuntime();
});
listen(document, 'visibilitychange', () => {
  suspended = document.hidden;
  if (suspended) suspendRuntime(); else resumeRuntime();
});

async function start() {
  // The initial registration point is the loading state. Measure only real, local fonts.
  await Promise.all([
    document.fonts.load('850 100px "Roboto Flex"', 'GRID'),
    document.fonts.load('400 100px "Instrument Serif"', 'GRID'),
    document.fonts.load('400 16px "IBM Plex Mono"', 'Visual study'),
    $('#source-photo') instanceof HTMLImageElement ? ($('#source-photo') as HTMLImageElement).decode().catch(() => undefined) : Promise.resolve()
  ]);
  if (destroyed) return;
  await document.fonts.ready;
  if (destroyed) return;
  root.className = 'js-ready';
  gsap.registerPlugin(ScrollTrigger);
  gsap.ticker.lagSmoothing(0);
  ScrollTrigger.config({autoRefreshEvents: 'none', ignoreMobileResize: true});
  const renderer = new Renderer();
  cleanups.push(() => renderer.dispose());
  const stage = $('#stage');
  const track = $('#scroll-track');
  const frameTools = $('#frame-tools');
  const frameInput = $<HTMLInputElement>('#frame-width');
  const axisTools = $('#axis-tools');
  const axisInputs = Array.from(document.querySelectorAll<HTMLInputElement>('[data-axis]'));
  const preference = $<HTMLInputElement>('#reduce-motion');
  const dialogs = Array.from(document.querySelectorAll<HTMLDialogElement>('dialog'));
  let view: View = {w: 1, h: 1, mobile: false};
  let states: Design[] = [];
  let interfaceExit: Design;
  let wideInterface: Design;
  let narrowInterface: Design;
  let extent = 1;
  let coordinate = 0;
  let sceneIndex = -1;
  let dirty = true;
  let rebuilding = false;
  let nativeWidth: number | null = null;
  let axisOverrides: Partial<Axes> = {};
  let frameMin = 280;
  let frameMax = 1000;
  let lastViewport = '';
  let lastDesign: Design;

  const lenis = new Lenis({
    autoRaf: false, autoResize: false, smoothWheel: !reduced,
    syncTouch: false, lerp: .105, wheelMultiplier: .9,
    respectReducedMotion: true, anchors: false,
    prevent: node => Boolean(node.closest('dialog, .experiment-tools')),
    virtualScroll: ({event, deltaY}) => {
      if (event instanceof WheelEvent && !event.ctrlKey && !reduced && !destroyed && !suspended &&
          !document.hidden && !lenis.isStopped && !dialogs.some(dialog => dialog.open) &&
          deltaY * (lenis.targetScroll - lenis.actualScroll) < 0) {
        lenis.stop();
        lenis.start();
      }
      return true;
    }
  });
  cleanups.push(() => lenis.destroy());
  lenis.on('scroll', ScrollTrigger.update);

  const railButtons = SCENES.map((scene, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = String(i).padStart(2, '0');
    button.setAttribute('aria-label', `${String(i).padStart(2, '0')} — ${scene.name}`);
    button.title = scene.name;
    listen(button, 'click', () => go(i));
    $('#chapter-rail').append(button);
    return button;
  });
  const indexButtons = SCENES.map((scene, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    const number = document.createElement('span');
    number.textContent = String(i).padStart(2, '0');
    const name = document.createElement('span');
    name.textContent = scene.name;
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    arrow.setAttribute('viewBox', '0 0 20 20');
    arrow.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M4 16 16 4M4 4h12v12');
    arrow.append(path);
    button.append(number, name, arrow);
    listen(button, 'click', () => {closeDialogs(); go(i);});
    $('#index-list').append(button);
    return button;
  });

  function frameFor(percent: number): Frame {
    const width = mix(frameMin, frameMax, clamp(percent / 100));
    const availableHeight = Math.max(230, view.h - (view.mobile ? 78 : 86));
    const height = Math.min(availableHeight, width * 1.9);
    return {x: (view.w - width) / 2, y: view.h * .016 + (availableHeight - height) / 2, w: width, h: height, opacity: 1, border: 1};
  }

  function measureInterface(percent: number): Design {
    const state = layout(8, view), frame = frameFor(percent);
    renderer.article.classList.add('native-layout');
    renderer.nativeFrame(frame);
    const bounds = stage.getBoundingClientRect();
    for (const key of CONTENT_KEYS) {
      const node = renderer.parts[key];
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      const part = state.parts[key];
      const size = parseFloat(style.fontSize) || 12;
      Object.assign(part, {
        x: rect.left - bounds.left, y: rect.top - bounds.top,
        w: rect.width, h: rect.height, size,
        rotate: 0, sx: 1, sy: 1, opacity: 1, tracking: (parseFloat(style.letterSpacing) || 0) / size,
        leading: (parseFloat(style.lineHeight) || size * 1.3) / size,
        family: style.fontFamily.includes('Instrument') ? 1 : style.fontFamily.includes('Mono') ? 2 : 0,
        weight: parseFloat(style.fontWeight) || 400,
        accent: key === 'action' ? 1 : 0
      });
    }
    state.axes = {wght: 750, wdth: 100, slnt: 0, opsz: 90};
    state.frame = frame;
    state.cropX = 50; state.cropY = 50; state.zoom = 1;
    renderer.article.classList.remove('native-layout');
    return state;
  }

  const documentCoordinate = () => {
    const p = clamp(window.scrollY / extent * 11, 0, 11);
    // Preserve the supplied endpoint tolerance for integer-pixel scrollY.
    return Math.abs(p - Math.round(p)) < .001 ? Math.round(p) : p;
  };
  function reconstruct(preserve = documentCoordinate()) {
    if (rebuilding || destroyed) return;
    rebuilding = true;
    const bounds = stage.getBoundingClientRect();
    view = {w: bounds.width, h: bounds.height, mobile: innerWidth <= 600};
    renderer.resize(view);
    // 1.95 viewports of travel per system: the handoff owns roughly a third of
    // that, so each change of system takes appreciably longer to read through.
    extent = Math.round(innerHeight * 1.95 * 11);
    track.style.height = `${extent + innerHeight}px`;
    frameMax = view.w * .92;
    frameMin = Math.min(280, frameMax * .88);
    states = SCENES.map((_, i) => layout(i, view));
    wideInterface = measureInterface(100);
    narrowInterface = measureInterface(0);
    states[8] = nativeWidth === null ? wideInterface : measureInterface(nativeWidth);
    interfaceExit = nativeWidth === null ? narrowInterface : states[8];
    lastViewport = `${innerWidth}:${innerHeight}`;
    lenis.resize();
    ScrollTrigger.refresh();
    coordinate = clamp(preserve, 0, 11);
    lenis.scrollTo(coordinate / 11 * extent, {immediate: true, force: true});
    rebuilding = false;
    dirty = true;
    draw();
  }

  function updateScene(index: number) {
    if (index === sceneIndex) return;
    sceneIndex = index;
    const scene = SCENES[index];
    $('#scene-number').textContent = String(index).padStart(2, '0');
    $('#scene-name').textContent = scene.name;
    $('#scene-verb').textContent = scene.verb;
    railButtons.forEach((button, i) => {if (i === index) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');});
    indexButtons.forEach((button, i) => {if (i === index) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');});
    $<HTMLButtonElement>('#previous-scene').disabled = index === 0;
    $<HTMLButtonElement>('#next-scene').disabled = index === 11;
    $('#scene-announcer').textContent = `${String(index).padStart(2, '0')}. ${scene.name}. ${scene.statement}`;
    renderer.parts.action.setAttribute('aria-label', index === 11 ? 'Look again — return to the first point' : `Look again — next system: ${SCENES[index + 1].name}`);
    if ($<HTMLDialogElement>('#rules-dialog').open) updateRules();
  }

  function draw() {
    if (!dirty || !states.length || document.hidden || suspended || destroyed) return;
    dirty = false;
    const p = reduced ? Math.round(coordinate) : coordinate;
    const current = Math.floor(p), local = p - current;
    const inInterface = current === 8 && local <= .36;
    const inVariable = current === 9 && local <= .36;
    let native: Frame | undefined;
    if (inInterface) {
      const percent = nativeWidth ?? 100 * (1 - smooth(range(0, .36, local)));
      native = frameFor(percent);
      frameInput.value = String(Math.round(percent));
      $('#frame-readout').textContent = `${Math.round(native.w)} px`;
    }
    const d = resolve(p, states, axisOverrides, interfaceExit, reduced);
    renderer.render(d, p, native);
    lastDesign = d;
    frameTools.hidden = !inInterface;
    axisTools.hidden = !inVariable;
    if (inVariable) axisInputs.forEach(input => {
      const axis = input.dataset.axis as keyof Axes;
      const value = axis === 'slnt' ? d.axes[axis].toFixed(1) : String(Math.round(d.axes[axis]));
      input.value = value;
      $(`#value-${axis}`).textContent = value;
    });
    const dominant = reduced ? Math.round(p) : Math.min(11, current + (local >= .69 ? 1 : 0));
    updateScene(dominant);
    $('#total-progress').style.transform = `scaleX(${clamp(coordinate / 11)})`;
    if ($<HTMLDialogElement>('#rules-dialog').open) updateMeasurements();
  }

  function go(index: number, immediate = false) {
    if (destroyed || suspended || document.hidden) return;
    const target = Math.round(clamp(index, 0, 11));
    closeDialogs();
    // Navigation uses the same scroll authority and therefore the same state function.
    lenis.scrollTo(target / 11 * extent, {
      immediate: reduced || immediate, force: true,
      duration: reduced ? 0 : Math.min(1.8, .7 + Math.abs(target - coordinate) * .12),
      onComplete: () => {if (!destroyed) {coordinate = documentCoordinate(); dirty = true; draw();}}
    });
    history.replaceState(history.state, '', `#${SCENES[target].slug}`);
    if (reduced || immediate) {coordinate = documentCoordinate(); dirty = true; draw();}
  }

  function updateMeasurements() {
    $('#field-measure').textContent = `${Math.round(view.w)} × ${Math.round(view.h)} px`;
    $('#column-measure').textContent = String(Math.round(lastDesign?.cols ?? 12));
  }

  function updateRules() {
    const index = Math.max(0, sceneIndex), scene = SCENES[index];
    $('#rules-number').textContent = `${String(index).padStart(2, '0')} / Rules`;
    $('#rules-title').textContent = scene.name;
    $('#rules-statement').textContent = scene.statement;
    const list = $('#rules-list');
    list.replaceChildren();
    ['Grid', 'Type', 'Image', 'Space', 'Colour', 'Interaction', 'Motion'].forEach((label, i) => {
      const row = document.createElement('div'), term = document.createElement('dt'), definition = document.createElement('dd');
      term.textContent = label; definition.textContent = scene.rules[i];
      row.append(term, definition); list.append(row);
    });
    updateMeasurements();
  }

  function closeDialogs() {dialogs.forEach(dialog => {if (dialog.open) dialog.close();}); if (!document.hidden && !suspended && !destroyed) lenis.start();}
  document.querySelectorAll<HTMLButtonElement>('[data-open]').forEach(button => listen(button, 'click', () => {
    if (button.dataset.open === 'rules-dialog') updateRules();
    closeDialogs();
    lenis.stop();
    $<HTMLDialogElement>(`#${button.dataset.open}`).showModal();
  }));
  dialogs.forEach(dialog => {
    listen(dialog.querySelector('.close-dialog')!, 'click', () => dialog.close());
    listen(dialog, 'close', () => {if (!document.hidden && !suspended && !destroyed && !dialogs.some(item => item.open)) lenis.start();});
    listen(dialog, 'click', event => {if (event.target === dialog) dialog.close();});
  });
  listen($('#previous-scene'), 'click', () => go(sceneIndex - 1));
  listen($('#next-scene'), 'click', () => go(sceneIndex + 1));
  listen(renderer.parts.action, 'click', event => {event.preventDefault(); go(sceneIndex >= 11 ? 0 : sceneIndex + 1);});
  listen($('.wordmark'), 'click', event => {event.preventDefault(); go(0);});
  listen(document, 'keydown', (event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, select, [contenteditable], dialog') || event.altKey || event.metaKey || event.ctrlKey) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft' || event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      go(event.key === 'Home' ? 0 : event.key === 'End' ? 11 : sceneIndex + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });

  listen(frameInput, 'input', () => {
    nativeWidth = Number(frameInput.value);
    // User input is an explicit layout event. Cache the actual endpoint once here.
    states[8] = measureInterface(nativeWidth);
    interfaceExit = states[8];
    dirty = true; draw();
  });
  listen($('#frame-reset'), 'click', () => {
    nativeWidth = null; states[8] = wideInterface; interfaceExit = narrowInterface;
    dirty = true; draw();
  });
  axisInputs.forEach(input => listen(input, 'input', () => {
    axisOverrides[input.dataset.axis as keyof Axes] = Number(input.value);
    dirty = true; draw();
  }));
  listen($('#axis-reset'), 'click', () => {axisOverrides = {}; dirty = true; draw();});

  function syncMotion() {
    reduced = media.matches || readStore('grid:reduce-motion') === '1';
    preference.checked = reduced;
    preference.disabled = media.matches;
    $('#motion-note').textContent = media.matches ? 'Your operating system requests reduced motion. This preference is respected.' : '';
    root.classList.toggle('reduced-motion', reduced);
    lenis.options.smoothWheel = !reduced;
    if (reduced) lenis.scrollTo(window.scrollY, {immediate: true, force: true});
    coordinate = documentCoordinate();
    dirty = true; draw();
  }
  listen(preference, 'change', () => {writeStore('grid:reduce-motion', preference.checked ? '1' : '0'); syncMotion();});
  listen(media, 'change', syncMotion);

  const trigger = ScrollTrigger.create({
    trigger: track, start: 0, end: () => extent,
    onUpdate: self => {if (!rebuilding) {
      const p = clamp(self.progress * 11, 0, 11);
      coordinate = Math.abs(p - Math.round(p)) < .001 ? Math.round(p) : p;
      dirty = true;
    }},
    invalidateOnRefresh: true
  });
  cleanups.push(() => trigger.kill());
  const saved = Number(readStore('grid:position', true));
  const hashIndex = SCENES.findIndex(scene => `#${scene.slug}` === location.hash);
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  const restoring = navigation?.type === 'reload' || navigation?.type === 'back_forward';
  const historyPosition = Number(history.state?.gridPosition);
  const retained = Number.isFinite(historyPosition) ? historyPosition : saved;
  const initial = restoring && Number.isFinite(retained) ? clamp(retained, 0, 11)
    : hashIndex >= 0 ? hashIndex : Number.isFinite(saved) ? clamp(saved, 0, 11) : 0;
  reconstruct(initial);
  syncMotion();

  // The only application animation clock: GSAP owns the ticker, Lenis receives it.
  const tick = (seconds: number) => {
    if (document.hidden || suspended || destroyed) return;
    lenis.raf(seconds * 1000);
    const p = documentCoordinate();
    if (p !== coordinate) {coordinate = p; dirty = true;}
    draw();
  };
  let clockAttached = false;
  function stopClock() {if (clockAttached) {gsap.ticker.remove(tick); clockAttached = false;}}
  function startClock() {if (!clockAttached && !document.hidden && !suspended && !destroyed) {gsap.ticker.add(tick); clockAttached = true;}}
  cleanups.push(stopClock);
  let resizeTimer = 0;
  cleanups.push(() => clearTimeout(resizeTimer));
  listen(window, 'resize', () => {
    clearTimeout(resizeTimer);
    if (document.hidden || suspended || destroyed) return;
    resizeTimer = window.setTimeout(() => {if (!destroyed && !suspended && !document.hidden && `${innerWidth}:${innerHeight}` !== lastViewport) reconstruct();}, 120);
  }, {passive: true});
  listen(window, 'hashchange', () => {const i = SCENES.findIndex(scene => `#${scene.slug}` === location.hash); if (i >= 0) go(i);});
  suspendRuntime = () => {
    coordinate = documentCoordinate();
    writeStore('grid:position', String(coordinate), true);
    history.replaceState({...history.state, gridPosition: coordinate}, '', location.href);
    clearTimeout(resizeTimer);
    lenis.stop();
    stopClock();
  };
  resumeRuntime = () => {
    if (destroyed || document.hidden || suspended) return;
    reconstruct(coordinate);
    if (dialogs.some(dialog => dialog.open)) lenis.stop(); else lenis.start();
    startClock();
  };
  listen(document.fonts, 'loadingdone', () => {if (states.length && !destroyed && !suspended && !document.hidden) reconstruct();});
  if (document.hidden || suspended) lenis.stop(); else startClock();
  // Test code uses standard DOM and real scrolling; there is deliberately no production debug API.
  root.dataset.ready = 'true';
  void trigger;
}

start().catch(error => {
  if (destroyed) return;
  dispose();
  document.documentElement.className = 'no-js';
  const notice = document.createElement('p');
  notice.className = 'fallback-note';
  notice.textContent = 'The interactive system could not start. The complete static composition remains available. Reload to try again.';
  document.querySelector('main')?.append(notice);
  console.error('GRID could not initialize:', error);
});
