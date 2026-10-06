import './styles.css';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Reactor, type ReactorFrame } from './reactor';
import { FallbackReactor } from './fallback';
import { FusionAudio } from './audio';
import { chapters, chapterOpacity, clamp, deriveState } from './timeline';

gsap.registerPlugin(ScrollTrigger);
const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const $$ = <T extends HTMLElement = HTMLElement>(selector: string) => [...document.querySelectorAll<T>(selector)];
const journey = $('#journey');
const transcript = $('#transcript');
const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const audio = new FusionAudio();
const controls = { heatInput: 1, feedback: 1, pulse: 0, sectionOpen: false, sectionAmount: 0 };
let quality: ReactorFrame['quality'] = 'auto';
let fieldMode = 0;
let paused = reducedQuery.matches;
let motionOverride = false;
let soundEnabled = false;
let feedbackRequested = true;
let modalOpen = false;
let transcriptOpen = false;
let simulationTime = reducedQuery.matches ? 3.25 : 0;
let currentP = 0;
let lastP = -1;
let lastChapter = -1;
let lastTelemetry = -1;
let lastAudio = -1;
let resizeAnchor: number | null = null;
let pointerX = 0, pointerY = 0, targetX = 0, targetY = 0;
let disposed = false;
let needsRender = true;
let maxScroll = Math.max(1, journey.offsetHeight - window.innerHeight);
let viewport = { width: window.innerWidth, height: window.innerHeight };
const scenes = $$<HTMLElement>('[data-scene]');
const rail = $('.chapter-rail');
const markers = $('#scroll-markers');
const menu = $('#chapter-menu');
const formatIndex = (i: number) => String(i + 1).padStart(2, '0');

chapters.forEach((chapter, i) => {
  const a = document.createElement('a');
  a.className = 'chapter-link'; a.href = `#${chapter.id}`;
  a.innerHTML = `<span class="chapter-num">${formatIndex(i)}</span><span>${chapter.name}</span>`;
  a.setAttribute('aria-label', `Chapter ${i + 1}: ${chapter.name}`);
  rail.append(a);
  const marker = document.createElement('div');
  marker.id = chapter.id; marker.className = 'scroll-marker';
  markers.append(marker);
  const link = document.createElement('a');
  link.className = 'menu-chapter'; link.href = `#${chapter.id}`;
  link.innerHTML = `<span>${formatIndex(i)}</span>${chapter.name}<i aria-hidden="true">↗</i>`;
  menu.append(link);
});
const chapterLinks = $$<HTMLAnchorElement>('.chapter-link');
const menuLinks = $$<HTMLAnchorElement>('.menu-chapter');
function placeMarkers() {
  maxScroll = Math.max(1, journey.offsetHeight - window.innerHeight);
  $$('.scroll-marker').forEach((marker, i) => { marker.style.top = `${maxScroll * (i ? i + .45 : 0) / 8}px`; });
}
placeMarkers();

const lenis = new Lenis({
  autoRaf: false,
  lerp: .115,
  smoothWheel: !reducedQuery.matches,
  syncTouch: false,
  wheelMultiplier: 1,
  touchMultiplier: 1,
  anchors: false,
  prevent: (node: HTMLElement) => node.closest('dialog, [data-lenis-prevent]') !== null,
});
lenis.on('scroll', ScrollTrigger.update);
const scroll = ScrollTrigger.create({
  trigger: journey,
  start: 'top top',
  end: () => `+=${maxScroll}`,
  invalidateOnRefresh: true,
  onUpdate: self => { if (resizeAnchor === null) currentP = clamp(self.progress * 8, 0, 8); },
});

let canvas = $<HTMLCanvasElement>('#reactor');
let reactor: Reactor | FallbackReactor;
let renderingMode: 'webgl' | 'canvas' = 'webgl';
const params = new URLSearchParams(window.location.search);
try {
  if (params.get('renderer') === 'canvas') throw new Error('Canvas renderer requested');
  reactor = new Reactor(canvas);
} catch {
  const replacement = document.createElement('canvas'); replacement.id = 'reactor';
  canvas.replaceWith(replacement); canvas = replacement;
  reactor = new FallbackReactor(canvas); renderingMode = 'canvas';
  document.body.classList.add('no-webgl');
  $('#rendering-note').textContent = 'The procedural Canvas renderer is active on this device. All visuals and sound are generated locally.';
}
reactor.resize(viewport.width, viewport.height);

function useCanvasFallback() {
  if (renderingMode === 'canvas') return;
  reactor.dispose();
  const replacement = document.createElement('canvas'); replacement.id = 'reactor';
  canvas.replaceWith(replacement); canvas = replacement;
  reactor = new FallbackReactor(canvas); renderingMode = 'canvas';
  reactor.resize(viewport.width, viewport.height);
  document.body.classList.add('no-webgl');
  $('#rendering-note').textContent = 'The procedural Canvas renderer is active. The experience continues without WebGL.';
  needsRender = true;
}
canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); useCanvasFallback(); });

function chapterTarget(i: number) { return maxScroll * (i === 0 ? 0 : i + .45) / 8; }
function setTranscript(open: boolean) {
  transcriptOpen = open;
  transcript.classList.toggle('is-open', open);
  [journey, $('.header'), $('.controls-footer'), $('.skip-link')].forEach(element => { element.inert = open; });
  if (open) { lenis.stop(); transcript.focus({ preventScroll: true }); }
  else { if (!modalOpen) lenis.start(); $('.brand').focus({ preventScroll: true }); }
  needsRender = true;
}
function goToChapter(i: number, immediate = false) {
  for (const dialog of $$<HTMLDialogElement>('dialog[open]')) dialog.close();
  if (transcriptOpen || location.hash === '#transcript') setTranscript(false);
  lenis.start();
  lenis.scrollTo(chapterTarget(i), { immediate: immediate || reducedQuery.matches, duration: 1.35, force: true, lock: false });
  history.replaceState(null, '', `${location.pathname}${location.search}#${chapters[i].id}`);
  needsRender = true;
}

document.addEventListener('click', event => {
  const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
  if (!link) return;
  const id = link.hash.slice(1);
  const index = chapters.findIndex(ch => ch.id === id);
  if (index !== -1) { event.preventDefault(); goToChapter(index); }
  else if (id === 'transcript') {
    event.preventDefault();
    history.pushState(null, '', `${location.pathname}${location.search}#transcript`);
    setTranscript(true);
  }
});
window.addEventListener('hashchange', () => {
  if (location.hash === '#transcript') { setTranscript(true); return; }
  if (transcriptOpen) setTranscript(false);
  const index = chapters.findIndex(ch => ch.id === location.hash.slice(1));
  if (index >= 0) goToChapter(index, true);
});

let lastOpener: HTMLElement | null = null;
function openDialog(id: string, opener: HTMLElement) {
  lastOpener = opener; modalOpen = true; lenis.stop();
  $<HTMLDialogElement>(`#${id}`).showModal();
}
$('#notes-open').addEventListener('click', event => openDialog('notes-dialog', event.currentTarget as HTMLElement));
$('#chapters-open').addEventListener('click', event => openDialog('chapters-dialog', event.currentTarget as HTMLElement));
// On small screens the bottom chapter indicator also opens chapter navigation.
const mobileChapter = $('#mobile-chapter');
mobileChapter.setAttribute('role', 'button'); mobileChapter.setAttribute('tabindex', '0');
mobileChapter.setAttribute('aria-label', 'Choose a chapter');
mobileChapter.addEventListener('click', () => openDialog('chapters-dialog', mobileChapter));
mobileChapter.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openDialog('chapters-dialog', mobileChapter); } });
$$('[data-close]').forEach(button => button.addEventListener('click', () => $<HTMLDialogElement>(`#${button.dataset.close}`).close()));
$$<HTMLDialogElement>('dialog').forEach(dialog => {
  dialog.addEventListener('close', () => { modalOpen = false; lenis.start(); lastOpener?.focus({ preventScroll: true }); needsRender = true; });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
});

const sectionButton = $('#section-toggle');
sectionButton.addEventListener('click', () => {
  controls.sectionOpen = !controls.sectionOpen;
  gsap.to(controls, { sectionAmount: controls.sectionOpen ? 1 : 0, duration: reducedQuery.matches ? 0 : .9, ease: 'power2.inOut', overwrite: 'auto', onUpdate: () => { needsRender = true; } });
  sectionButton.setAttribute('aria-pressed', String(controls.sectionOpen));
  sectionButton.querySelector('span')!.textContent = controls.sectionOpen ? 'Restore the section' : 'Open the section';
  needsRender = true;
});
$$<HTMLButtonElement>('[data-field]').forEach(button => button.addEventListener('click', () => {
  fieldMode = Number(button.dataset.field);
  $$('[data-field]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  $('#field-description').textContent = ['The two directions, combined.', 'Around the long way. The toroidal direction.', 'Around the cross-section. The poloidal direction.'][fieldMode];
  needsRender = true;
}));
$<HTMLInputElement>('#heat-input').addEventListener('input', event => {
  controls.heatInput = Number((event.target as HTMLInputElement).value) / 100;
  $('#heat-output').textContent = `${Math.round(controls.heatInput * 100)}%`;
  needsRender = true;
});
$('#perturb').addEventListener('click', () => {
  controls.pulse = 1;
  $('#live-announcement').textContent = 'Perturbation introduced. Boundary deviation increases.';
  needsRender = true;
});
const feedbackButton = $('#feedback-toggle');
feedbackButton.addEventListener('click', () => {
  const engaged = !feedbackRequested;
  feedbackRequested = engaged;
  gsap.to(controls, { feedback: engaged ? 1 : 0, duration: reducedQuery.matches ? 0 : 1.1, ease: 'power2.inOut', overwrite: 'auto', onUpdate: () => { needsRender = true; } });
  feedbackButton.setAttribute('aria-pressed', String(engaged));
  feedbackButton.querySelector('span')!.textContent = engaged ? 'Release feedback' : 'Engage feedback';
  feedbackButton.querySelector('.action-end')!.textContent = engaged ? '−' : '+';
  $('#feedback-description').textContent = engaged ? 'Feedback engaged. Boundary settling.' : 'Feedback released. Boundary oscillating.';
  phaseStatus.textContent = engaged ? 'Feedback response active' : 'Feedback released';
  $('#live-announcement').textContent = engaged ? 'Feedback engaged. Plasma boundary settling.' : 'Feedback released. Plasma boundary oscillating.';
});

function syncMotionButton() {
  const button = $('#motion-toggle');
  button.setAttribute('aria-pressed', String(paused));
  button.setAttribute('aria-label', paused ? 'Resume ambient motion' : 'Pause ambient motion');
  button.querySelector('span')!.textContent = paused ? 'Resume' : 'Pause';
  button.querySelector('svg')!.innerHTML = paused ? '<path d="m6 4 9 6-9 6V4Z"/>' : '<path d="M7 4v12M13 4v12"/>';
}
syncMotionButton();
$('#motion-toggle').addEventListener('click', () => { paused = !paused; motionOverride = !paused; syncMotionButton(); needsRender = true; });
reducedQuery.addEventListener('change', () => {
  paused = reducedQuery.matches; motionOverride = false;
  lenis.options.smoothWheel = !reducedQuery.matches;
  syncMotionButton(); needsRender = true;
});
$('#sound-toggle').addEventListener('click', async () => {
  const button = $('#sound-toggle');
  const desired = !soundEnabled;
  (button as HTMLButtonElement).disabled = true;
  try {
    await audio.setEnabled(desired); soundEnabled = desired;
    button.setAttribute('aria-pressed', String(desired));
    button.setAttribute('aria-label', desired ? 'Turn off generative sound' : 'Turn on generative sound');
    button.querySelector('span')!.textContent = desired ? 'Sound on' : 'Sound off';
    button.querySelector('svg')!.innerHTML = desired ? '<path d="M3 8h3l4-4v12l-4-4H3V8Zm11-2a7 7 0 0 1 0 8m-2-6a3 3 0 0 1 0 4"/>' : '<path d="M3 8h3l4-4v12l-4-4H3V8Zm11-1 4 6m0-6-4 6"/>';
  } catch {
    soundEnabled = false;
    button.querySelector('span')!.textContent = 'Retry sound';
    $('#live-announcement').textContent = 'Sound could not start on this device. You can try again.';
  } finally { (button as HTMLButtonElement).disabled = false; }
});
$<HTMLSelectElement>('#quality-select').addEventListener('change', event => {
  quality = (event.target as HTMLSelectElement).value as ReactorFrame['quality']; needsRender = true;
});

window.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse' || paused || modalOpen) return;
  targetX = (event.clientX / viewport.width - .5) * 2;
  targetY = (event.clientY / viewport.height - .5) * 2;
}, { passive: true });
document.addEventListener('pointerleave', () => { targetX = 0; targetY = 0; });

const trace = $<HTMLCanvasElement>('#trace');
const traceContext = trace.getContext('2d')!;
const diagnostic = $('#diagnostic');
let traceWidth = 300, traceHeight = 80, traceDpr = 1;
function resizeTrace() {
  const wasHidden = diagnostic.hidden;
  diagnostic.hidden = false;
  traceWidth = Math.max(1, trace.clientWidth); traceHeight = Math.max(1, trace.clientHeight);
  traceDpr = Math.min(window.devicePixelRatio || 1, 1.5);
  trace.width = Math.round(traceWidth * traceDpr); trace.height = Math.round(traceHeight * traceDpr);
  diagnostic.hidden = wasHidden;
}
resizeTrace();

function drawDiagnostic(time: number, deviation: number, control: number) {
  const ctx = traceContext, w = traceWidth, h = traceHeight;
  ctx.setTransform(traceDpr, 0, 0, traceDpr, 0, 0); ctx.clearRect(0, 0, w, h);
  ctx.lineWidth = .7; ctx.strokeStyle = '#b1a5bd20';
  ctx.beginPath();
  for (let i = 0; i < 9; i++) { ctx.moveTo(w * i / 8, 0); ctx.lineTo(w * i / 8, h); }
  for (let i = 0; i < 3; i++) { ctx.moveTo(0, h * (i + 1) / 4); ctx.lineTo(w, h * (i + 1) / 4); }
  ctx.stroke();
  ctx.setLineDash([3, 5]); ctx.strokeStyle = '#a8c9f08a';
  ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke(); ctx.setLineDash([]);
  const amp = .02 + deviation * .027;
  ctx.beginPath();
  for (let i = 0; i <= 200; i++) {
    const x = i / 200, v = (Math.sin(x * 31 - time * 2.8) + Math.sin(x * 73 + time * 1.15) * .25) * amp;
    const y = h * (.5 + v * .65);
    if (!i) ctx.moveTo(x * w, y); else ctx.lineTo(x * w, y);
  }
  ctx.strokeStyle = control > .5 ? '#c3b5fb' : '#ffad79'; ctx.lineWidth = 1.15; ctx.stroke();
  const sweep = ((time * .18) % 1) * w;
  ctx.fillStyle = control > .5 ? '#c3b5fb0c' : '#ffad790c'; ctx.fillRect(sweep, 0, Math.min(w * .08, w - sweep), h);
}

const tempValue = $('#temperature-value'), fieldValue = $('#field-value'), fieldBar = $('#field-bar');
const bigTemperature = $('#big-temperature'), progressBar = $('#mobile-progress-bar');
const phaseStatus = $('#phase-status'), deviationNumber = $('#deviation-number');
const diagnosticState = $('#diagnostic-state');
const networkPulse = document.querySelector<SVGPathElement>('.network-pulse')!;
const solenoidLeader = document.querySelector<SVGPathElement>('#solenoid-leader')!;
const coilLeader = document.querySelector<SVGPathElement>('#coil-leader')!;
const solenoidAnchor = document.querySelector<SVGCircleElement>('#solenoid-anchor')!;
const coilAnchor = document.querySelector<SVGCircleElement>('#coil-anchor')!;
const feedbackDescription = $('#feedback-description');

function updateEngineeringLeaders() {
  if (!(reactor instanceof Reactor) || viewport.width < 760) return;
  const anchors = reactor.projectAnchors();
  const sx = (anchors.solenoid.x * 1440).toFixed(1), sy = (anchors.solenoid.y * 900).toFixed(1);
  const cx = (anchors.coil.x * 1440).toFixed(1), cy = (anchors.coil.y * 900).toFixed(1);
  solenoidLeader.setAttribute('d', `M1030 135H1100L${sx} ${sy}`);
  coilLeader.setAttribute('d', `M1080 690H1140L${cx} ${cy}`);
  solenoidAnchor.setAttribute('cx', sx); solenoidAnchor.setAttribute('cy', sy);
  coilAnchor.setAttribute('cx', cx); coilAnchor.setAttribute('cy', cy);
}

function updateScenes(p: number) {
  const active = Math.min(7, Math.max(0, Math.floor(p)));
  scenes.forEach((scene, i) => {
    const opacity = chapterOpacity(p, i);
    scene.style.opacity = String(opacity);
    scene.style.visibility = opacity > .005 ? 'visible' : 'hidden';
    // Only one chapter is focusable. The short overlapping handoff stays visual.
    const interactive = i === active && opacity > .25;
    scene.inert = !interactive;
    scene.classList.toggle('is-active', interactive);
    scene.setAttribute('aria-hidden', String(!interactive));
  });
  chapterLinks.forEach((link, i) => { link.style.setProperty('--chapter-progress', String(clamp(p - i))); });
  progressBar.style.transform = `scaleX(${p / 8})`;
  const traceVisible = p > 3.96 && p < 6;
  diagnostic.hidden = !traceVisible;
  diagnostic.style.opacity = String(Math.max(chapterOpacity(p, 4), chapterOpacity(p, 5)));
  if (active !== lastChapter) {
    document.body.dataset.chapter = String(active);
    document.body.dataset.renderer = renderingMode;
    chapterLinks.forEach((link, i) => { if (i === active) link.setAttribute('aria-current', 'step'); else link.removeAttribute('aria-current'); });
    menuLinks.forEach((link, i) => { if (i === active) link.setAttribute('aria-current', 'step'); else link.removeAttribute('aria-current'); });
    mobileChapter.textContent = `${formatIndex(active)} — ${chapters[active].name.toUpperCase()}`;
    phaseStatus.textContent = active === 5 && !feedbackRequested ? 'Feedback released' : chapters[active].status;
    if (lastChapter !== -1) $('#live-announcement').textContent = `Chapter ${active + 1}: ${chapters[active].name}`;
    lastChapter = active;
  }
}

function tick(_time: number, deltaMs: number) {
  if (disposed || document.hidden) return;
  lenis.raf(_time * 1000);
  const p = resizeAnchor ?? clamp(scroll.progress * 8, 0, 8);
  currentP = p;
  const moving = !paused && !modalOpen && !transcriptOpen;
  const dt = Math.min(Math.max(deltaMs / 1000, 0), .045);
  if (moving) {
    simulationTime += dt;
    pointerX += (targetX - pointerX) * .035;
    pointerY += (targetY - pointerY) * .035;
    controls.pulse = Math.max(0, controls.pulse - dt * .25);
  }
  const changed = Math.abs(p - lastP) > .00001 || needsRender;
  if (!moving && !changed) return;
  const state = deriveState(p, simulationTime, controls);
  if (changed) updateScenes(p);
  reactor.render({ ...state, time: simulationTime, pointerX, pointerY, fieldMode, quality, reducedMotion: reducedQuery.matches && !motionOverride });
  if (p > .85 && p < 2.1) updateEngineeringLeaders();
  if (!diagnostic.hidden) drawDiagnostic(simulationTime, state.deviation, state.control);
  if (p > 6.85) networkPulse.style.strokeDashoffset = String(-simulationTime * 58 - (p - 7) * 130);
  if (_time - lastTelemetry > .12 || changed) {
    tempValue.textContent = state.temperature.toFixed(1);
    bigTemperature.textContent = String(Math.round(state.temperature));
    fieldValue.textContent = `${state.excitation.toFixed(1)}%`;
    fieldBar.style.transform = `scaleX(${state.excitation / 100})`;
    deviationNumber.textContent = `Δ ${state.deviation.toFixed(1)}`;
    const stable = state.control > .85 && state.instability < .15;
    diagnosticState.textContent = stable ? 'STABLE' : state.control > .5 ? 'SETTLING' : state.control > .05 ? 'RESPONDING' : 'OSCILLATING';
    if (state.chapter === 5) {
      const response = !feedbackRequested ? 'Feedback released. Boundary oscillating.' : stable ? 'Feedback engaged. Boundary stable.' : state.control > .5 ? 'Feedback engaged. Boundary settling.' : 'Feedback engaged. Response building.';
      feedbackDescription.textContent = response;
      phaseStatus.textContent = !feedbackRequested ? 'Feedback released' : stable ? 'Plasma boundary stabilized' : state.control > .5 ? 'Boundary settling' : 'Feedback response building';
    }
    lastTelemetry = _time;
  }
  if (_time - lastAudio > .15) { audio.update(state.energy, state.instability, state.field); lastAudio = _time; }
  lastP = p; needsRender = false;
}

gsap.ticker.lagSmoothing(0);
gsap.ticker.add(tick);
document.addEventListener('visibilitychange', () => { void audio.visibility(!document.hidden).catch(() => {}); if (!document.hidden) { lenis.resize(); ScrollTrigger.update(); needsRender = true; } });
window.addEventListener('pageshow', () => { lenis.resize(); ScrollTrigger.refresh(); needsRender = true; });

let resizeTimer: ReturnType<typeof setTimeout>;
window.addEventListener('resize', () => {
  if (resizeAnchor === null) resizeAnchor = currentP;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const oldP = resizeAnchor ?? currentP;
    viewport = { width: window.innerWidth, height: window.innerHeight };
    reactor.resize(viewport.width, viewport.height);
    placeMarkers(); resizeTrace(); lenis.resize(); ScrollTrigger.refresh();
    lenis.scrollTo(maxScroll * oldP / 8, { immediate: true, force: true });
    currentP = oldP; resizeAnchor = null;
    ScrollTrigger.update();
    needsRender = true;
  }, 100);
}, { passive: true });

void document.fonts.ready.then(() => {
  placeMarkers(); lenis.resize(); ScrollTrigger.refresh(); needsRender = true;
});

function dispose() {
  if (disposed) return; disposed = true;
  clearTimeout(resizeTimer); gsap.ticker.remove(tick); scroll.kill(); lenis.destroy(); reactor.dispose(); audio.dispose();
}
window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); });
if (import.meta.hot) import.meta.hot.dispose(dispose);

// Read-only diagnostics for reproducible local acceptance, not a UI or network service.
Object.defineProperty(window, '__FUSION__', { configurable: true, get: () => ({
  chapter: Math.min(7, Math.floor(currentP)), progress: currentP / 8, p: currentP,
  time: simulationTime, paused, soundEnabled, renderingMode, fieldMode, quality,
  controls: { ...controls }, state: deriveState(currentP, simulationTime, controls),
  stats: reactor.stats(), viewport: { ...viewport },
}) });

updateScenes(0);
const initialChapter = chapters.findIndex(ch => ch.id === location.hash.slice(1));
if (initialChapter >= 0) goToChapter(initialChapter, true);
else if (location.hash === '#transcript') {
  setTranscript(true);
}
