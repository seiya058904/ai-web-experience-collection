import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import 'lenis/dist/lenis.css';
import './style.css';
import {
  MIURA_DEFAULT, clamp, cornerPoint, creasePatternSVG, filmAt, lerp, lineCreases, lineFold, miuraCreases, miuraFold, miuraMetrics,
  smooth, vertexCreases, vertexFold, vertexInfo,
} from './model.js';
import { SheetRenderer } from './renderer.js';
import { FlatRenderer } from './fallback.js';

gsap.registerPlugin(ScrollTrigger);

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const original = $('#scene');
let renderer;
try {
  renderer = new SheetRenderer(original);
} catch {
  // A canvas that failed to give a WebGL context is replaced by the SVG edition.
  renderer = new FlatRenderer(original);
}
const stage = renderer.canvas;
stage.dataset.renderer = renderer.kind;

const motion = matchMedia('(prefers-reduced-motion: reduce)');
const life = new AbortController();
const on = (el, type, fn, opts = {}) => el.addEventListener(type, fn, { ...opts, signal: life.signal });

const state = { shift: 0, fold: 62, pull: 0, columns: MIURA_DEFAULT.columns, rows: MIURA_DEFAULT.rows, gamma: MIURA_DEFAULT.gamma, foldYours: 55 };
const shown = { shift: 0, fold: 62, pull: 0, gamma: MIURA_DEFAULT.gamma, foldYours: 55 };
let progress = 0;
let dirty = true;
let lastTime = 0;
let pointerX = 0;
let pointerY = 0;
let lookX = 0;
let lookY = 0;
let disposed = false;
let lastSeen = -1;
let creaseKey = '';

const lenis = new Lenis({ autoRaf: false, lerp: 0.105, syncTouch: false, smoothWheel: !motion.matches, prevent: (node) => Boolean(node.closest?.('dialog,[data-lenis-prevent]')) });
lenis.on('scroll', ScrollTrigger.update);
const track = ScrollTrigger.create({ trigger: '#scroll-track', start: 'top top', end: 'bottom bottom', onUpdate: (self) => { progress = self.progress; dirty = true; } });
gsap.ticker.lagSmoothing(0);

const resize = () => {
  renderer.resize(innerWidth, innerHeight);
  lenis.resize();
  ScrollTrigger.refresh();
  dirty = true;
};
on(window, 'resize', resize);
on(window, 'orientationchange', resize);
resize();
document.fonts?.ready.then(() => { if (!disposed) ScrollTrigger.refresh(); });

const anchors = { opening: 0, line: 0.12, vertex: 0.36, miura: 0.61, pull: 0.74, yours: 0.96 };
function go(value, { instant = false, history = true } = {}) {
  if (history) {
    const name = Object.entries(anchors).reduce((a, b) => (Math.abs(b[1] - value) < Math.abs(a[1] - value) ? b : a))[0];
    if (location.hash !== `#${name}`) window.history.pushState({ chapter: name }, '', `#${name}`);
  }
  lenis.scrollTo(clamp(value) * (document.documentElement.scrollHeight - innerHeight), { immediate: instant || motion.matches, duration: 1.2, force: true });
}
$$('[data-go]').forEach((button) => on(button, 'click', () => go(Number(button.dataset.go))));
on(window, 'popstate', () => go(anchors[location.hash.slice(1)] ?? 0, { instant: true, history: false }));
on($('.skip-link'), 'click', (event) => {
  event.preventDefault();
  go(anchors.vertex);
  setTimeout(() => $('#shift').focus({ preventScroll: true }), motion.matches ? 0 : 1300);
});

const params = () => ({ gamma: state.gamma, columns: state.columns, rows: state.rows });
const percent = (v) => `${Math.round(v * 100)}%`;
const pullFold = (pull) => 0.985 * (1 - pull / 100);
function syncInterface() {
  const info = vertexInfo(state.shift);
  const third = miuraMetrics(state.fold / 100);
  const pulled = miuraMetrics(pullFold(state.pull));
  const outputs = {
    shift: `${state.shift > 0 ? '+' : ''}${state.shift}°`,
    fold: `${state.fold}%`,
    pull: `${state.pull}%`,
    columns: String(state.columns),
    rows: String(state.rows),
    gamma: `${state.gamma}°`,
    foldYours: `${state.foldYours}%`,
  };
  $$('[data-out]').forEach((node) => { node.textContent = outputs[node.dataset.out]; });
  const reads = {
    sum: `${info.angles[0]}° + ${info.angles[2]}° = ${info.a}°`,
    open: info.flat ? 'Fully closed' : `${Math.round(info.open)}° still open`,
    types: `${info.valleys} valley, ${info.mountains} mountain`,
    verdict: info.flat ? 'They add to 180°. The sheet closes flat.' : `They add to ${info.a}°, not 180°. The sheet cannot close.`,
    width: percent(third.width),
    length: percent(third.length),
    area: percent(third.area),
    'pull-area': `${percent(pulled.area)} of the open sheet`,
  };
  $$('[data-read]').forEach((node) => { node.textContent = reads[node.dataset.read]; });
  $('#vertex .answer').classList.toggle('is-broken', !info.flat);
  stage.dataset.open = info.open.toFixed(1);
  dirty = true;
}
const inputs = { shift: '#shift', fold: '#fold', pull: '#pull-amount', columns: '#columns', rows: '#rows', gamma: '#gamma', foldYours: '#fold-yours' };
for (const [name, selector] of Object.entries(inputs)) {
  on($(selector), 'input', (event) => {
    state[name] = Number(event.currentTarget.value);
    syncInterface();
  });
}

const dialog = $('#notes');
let returnFocus = $('#notes-open');
const openNotes = (button) => {
  returnFocus = button;
  lenis.stop();
  dialog.showModal();
};
on($('#notes-open'), 'click', (event) => openNotes(event.currentTarget));
on($('#notes-end'), 'click', (event) => openNotes(event.currentTarget));
on($('#notes-close'), 'click', () => dialog.close());
on(dialog, 'close', () => {
  lenis.start();
  returnFocus.focus({ preventScroll: true });
});
on(dialog, 'click', (event) => { if (event.target === dialog) dialog.close(); });

on($('#download'), 'click', () => {
  const p = params();
  const blob = new Blob([creasePatternSVG(miuraCreases(p), p)], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `crease-miura-${p.columns}x${p.rows}-${p.gamma}deg.svg`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
  $('#download-status').textContent = 'Downloaded. Print it at 100% on thin paper.';
});

// Dragging the corner mirrors the slider, which stays the keyboard and assistive route.
const handle = $('.handle');
let dragging = null;
on(handle, 'pointerdown', (event) => {
  dragging = { x: event.clientX, y: event.clientY, pull: state.pull };
  handle.setPointerCapture(event.pointerId);
  handle.classList.add('is-held');
  event.preventDefault();
});
on(handle, 'pointermove', (event) => {
  if (!dragging) return;
  const moved = Math.hypot(event.clientX - dragging.x, event.clientY - dragging.y) * Math.sign((event.clientX - dragging.x) + (dragging.y - event.clientY) || 1);
  state.pull = Math.round(clamp(dragging.pull + (moved / Math.min(innerWidth, innerHeight)) * 170, 0, 100));
  $('#pull-amount').value = state.pull;
  syncInterface();
});
const release = () => {
  dragging = null;
  handle.classList.remove('is-held');
};
on(handle, 'pointerup', release);
on(handle, 'pointercancel', release);
on(window, 'pointermove', (event) => {
  if (event.pointerType === 'touch') return;
  pointerX = (event.clientX / innerWidth - 0.5) * 2;
  pointerY = (event.clientY / innerHeight - 0.5) * 2;
  dirty = true;
}, { passive: true });

const chapters = $$('.chapter');
const navButtons = $$('.chapters button');
const panelState = [];
function panel(index, opacity, y = 0) {
  const key = `${opacity.toFixed(3)},${y.toFixed(1)}`;
  if (panelState[index] === key) return;
  panelState[index] = key;
  const el = chapters[index];
  const visible = opacity > 0.02;
  el.classList.toggle('is-visible', visible);
  el.style.opacity = opacity;
  el.style.transform = y ? `translateY(${y}px)` : '';
  el.setAttribute('aria-hidden', String(!visible));
  el.inert = !visible;
}

function setCreases(key, creases) {
  if (key === creaseKey) return;
  creaseKey = key;
  renderer.setCreases(creases());
}

function compose(film) {
  if (film.stage === 'line') {
    setCreases('line', lineCreases);
    return lineFold(film.lineFold);
  }
  if (film.stage === 'vertex') {
    const shift = Math.round(shown.shift * 4) / 4;
    setCreases(`vertex:${shift}`, () => vertexCreases(shift));
    return vertexFold(film.vertexFold, shown.shift);
  }
  if (film.stage === 'miura') {
    setCreases('miura', () => miuraCreases(MIURA_DEFAULT));
    const held = (shown.fold / 100) * film.miuraEnter;
    return miuraFold(lerp(held, pullFold(shown.pull), film.pullZone) * film.miuraExit, MIURA_DEFAULT);
  }
  const p = { ...params(), gamma: Math.round(shown.gamma * 2) / 2 };
  setCreases(`yours:${p.columns}:${p.rows}:${p.gamma}`, () => miuraCreases(p));
  return miuraFold((shown.foldYours / 100) * film.yoursEnter, p);
}

function draw() {
  const film = filmAt(progress, innerWidth / innerHeight);
  const result = compose(film);
  renderer.setFacets(result);
  const lines = film.stage === 'vertex' ? film.vertexFold : film.stage === 'line' ? film.lineFold : film.stage === 'miura' ? (shown.fold / 100) * film.miuraEnter : (shown.foldYours / 100) * film.yoursEnter;
  renderer.setView({
    elevation: film.elevation + lookY * 2.2,
    azimuth: film.azimuth + lookX * 3.2,
    // As the sheet opens under a pull, the camera backs away so the corner stays in reach.
    distance: film.distance * (1 + (film.stage === 'miura' ? film.pullZone * film.miuraExit * (shown.pull / 100) * 0.3 : 0)),
    shiftX: film.shiftX,
    shiftY: film.shiftY,
    targetZ: result.bounds.height * 0.46,
    reveal: film.reveal,
    lineAlpha: lerp(0.95, 0.34, smooth(0, 0.7, lines)),
  });
  renderer.render();
  document.documentElement.style.setProperty('--title-fold', film.titleFold.toFixed(4));
  const corner = film.stage === 'miura' ? film.pullZone * film.miuraExit * smooth(0.69, 0.715, progress) * (1 - smooth(0.775, 0.8, progress)) : 0;
  handle.style.opacity = corner;
  handle.style.pointerEvents = corner > 0.5 ? 'auto' : 'none';
  if (corner > 0.01) {
    const point = renderer.project(cornerPoint(result));
    handle.style.transform = `translate3d(${point.x.toFixed(1)}px,${point.y.toFixed(1)}px,0)`;
  }
}

function frame(time) {
  if (disposed) return;
  lenis.raf(time * 1000);
  const delta = lastTime ? Math.min(time - lastTime, 0.1) : 0;
  lastTime = time;
  const p = progress;
  panel(0, 1 - smooth(0.03, 0.055, p));
  panel(1, smooth(0.06, 0.085, p) * (1 - smooth(0.16, 0.19, p)), (1 - smooth(0.06, 0.085, p)) * 18);
  panel(2, smooth(0.25, 0.29, p) * (1 - smooth(0.4, 0.435, p)), (1 - smooth(0.25, 0.29, p)) * 18);
  panel(3, smooth(0.52, 0.555, p) * (1 - smooth(0.65, 0.675, p)), (1 - smooth(0.52, 0.555, p)) * 18);
  panel(4, smooth(0.69, 0.715, p) * (1 - smooth(0.775, 0.8, p)), (1 - smooth(0.69, 0.715, p)) * 18);
  panel(5, smooth(0.875, 0.905, p), (1 - smooth(0.875, 0.905, p)) * 18);
  const seen = p < 0.2 ? 0 : p < 0.46 ? 1 : p < 0.68 ? 2 : p < 0.83 ? 3 : 4;
  if (seen !== lastSeen) {
    navButtons.forEach((button, i) => (i === seen ? button.setAttribute('aria-current', 'step') : button.removeAttribute('aria-current')));
    lastSeen = seen;
    stage.dataset.chapter = String(seen);
  }
  if (document.hidden || dialog.open) return;
  // Controls respond like paper rather than a switch. Scroll itself takes no easing here.
  const rate = motion.matches ? 1 : 1 - Math.exp(-delta * 7);
  for (const key of Object.keys(shown)) {
    if (shown[key] === state[key]) continue;
    const next = shown[key] + (state[key] - shown[key]) * rate;
    shown[key] = Math.abs(state[key] - next) < 0.02 ? state[key] : next;
    dirty = true;
  }
  const targetX = motion.matches ? 0 : pointerX;
  const targetY = motion.matches ? 0 : pointerY;
  if (Math.abs(targetX - lookX) > 1e-3 || Math.abs(targetY - lookY) > 1e-3) {
    lookX += (targetX - lookX) * Math.min(1, delta * 2.6);
    lookY += (targetY - lookY) * Math.min(1, delta * 2.6);
    dirty = true;
  }
  if (!dirty) return;
  draw();
  stage.dataset.progress = p.toFixed(4);
  stage.classList.add('ready');
  dirty = false;
}

syncInterface();
gsap.ticker.add(frame);
on(document, 'visibilitychange', () => { lastTime = 0; dirty = true; });
on(window, 'pageshow', () => { lastTime = 0; ScrollTrigger.refresh(); dirty = true; });
if (anchors[location.hash.slice(1)] !== undefined) go(anchors[location.hash.slice(1)], { instant: true, history: false });

function dispose() {
  if (disposed) return;
  disposed = true;
  gsap.ticker.remove(frame);
  track.kill();
  lenis.destroy();
  renderer.dispose();
  life.abort();
}
if (import.meta.hot) import.meta.hot.dispose(dispose);
