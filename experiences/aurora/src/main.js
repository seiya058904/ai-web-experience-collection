import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import 'lenis/dist/lenis.css';
import './style.css';
import {
  DEFAULT_STATE, PRESETS, activity, altitudeToScreen, cameraAt, clamp, describeSky, dynamicPressure, flaring,
  magnetopause, ovalBand, projectPoint, sceneAt, skyState, smooth, standoff,
} from './model.js';
import { AuroraRenderer } from './renderer.js';
import { CanvasRenderer } from './fallback.js';

gsap.registerPlugin(ScrollTrigger);

let canvas = document.querySelector('#scene');
let renderer;
try {
  renderer = new AuroraRenderer(canvas);
} catch {
  // A canvas that already gave out a WebGL context cannot give a 2D one.
  const replacement = canvas.cloneNode();
  canvas.replaceWith(replacement);
  canvas = replacement;
  renderer = new CanvasRenderer(canvas);
}
canvas.dataset.renderer = renderer.kind;

const motion = matchMedia('(prefers-reduced-motion: reduce)');
const life = new AbortController();
const on = (el, type, fn, opts = {}) => el.addEventListener(type, fn, { ...opts, signal: life.signal });
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const state = { ...DEFAULT_STATE, iso: 'all' };
const ISO = { all: [1, 1, 1], green: [1, 0, 0], red: [0, 1, 0], violet: [0, 0, 1] };
const view = { kp: 0, r0: 10, alpha: 0.6, open: 0, equator: 60, distanceKm: 300, latitude: state.latitude, speed: state.speed, iso: [...ISO.all] };
let still = motion.matches;
let progress = 0;
let clock = 8;
let dirty = true;
let lastTime = 0;
let lastDraw = 0;
let pointerX = 0;
let yaw = 0;
let disposed = false;
let lastSeen = -1;

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
renderer.onChange = () => { dirty = true; };

const anchors = { sky: 0, wind: 0.3, oval: 0.545, curtain: 0.735, yours: 0.96 };
function go(value, { instant = false, history = true } = {}) {
  if (history) {
    const name = Object.entries(anchors).reduce((a, b) => (Math.abs(b[1] - value) < Math.abs(a[1] - value) ? b : a))[0];
    if (location.hash !== `#${name}`) window.history.pushState({ chapter: name }, '', `#${name}`);
  }
  const range = document.documentElement.scrollHeight - innerHeight;
  lenis.scrollTo(clamp(value) * range, { immediate: instant || motion.matches, duration: 1.2, force: true });
}
$$('[data-go]').forEach((button) => on(button, 'click', () => go(Number(button.dataset.go))));
on(window, 'popstate', () => go(anchors[location.hash.slice(1)] ?? 0, { instant: true, history: false }));
on($('.skip-link'), 'click', (event) => {
  event.preventDefault();
  go(anchors.wind);
  setTimeout(() => $('#speed').focus({ preventScroll: true }), motion.matches ? 0 : 1300);
});

const derive = () => {
  const pressure = dynamicPressure(state.density, state.speed);
  const kp = activity(state.speed, state.bz);
  return { pressure, kp, r0: standoff(state.bz, pressure), alpha: flaring(state.bz, pressure), sky: skyState(state.latitude, kp), open: smooth(0.5, -5, state.bz) };
};

const fieldWords = (bz) => (bz === 0 ? 'Neutral' : `${bz < 0 ? 'South' : 'North'} ${Math.abs(bz)} nT`);
function syncInterface() {
  const d = derive();
  $('#speed').value = state.speed;
  $('#density').value = state.density;
  $('#bz').value = state.bz;
  $$('[data-latitude]').forEach((input) => { input.value = state.latitude; });
  const outputs = { speed: `${state.speed} km/s`, density: `${state.density} /cm³`, bz: fieldWords(state.bz), latitude: `${state.latitude}°` };
  $$('[data-out]').forEach((node) => { node.textContent = outputs[node.dataset.out]; });
  const answer = describeSky(d.sky);
  const reads = {
    pressure: `${d.pressure.toFixed(1)} nPa`,
    standoff: `${d.r0.toFixed(1)} Earth radii`,
    door: d.open > 0.66 ? 'Joined' : d.open > 0.15 ? 'Starting to join' : 'Apart',
    kp: `${d.kp.toFixed(1)} (illustrative)`,
    edge: `${ovalBand(d.kp, 0).equator.toFixed(1)}°`,
    answer,
  };
  $$('[data-read]').forEach((node) => { node.textContent = reads[node.dataset.read]; });
  $$('[data-preset]').forEach((button) => {
    const preset = PRESETS[button.dataset.preset];
    const match = Object.entries(preset).every(([key, value]) => state[key] === value);
    button.setAttribute('aria-pressed', String(match));
  });
  $$('[data-iso]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.iso === state.iso)));
  canvas.dataset.kp = d.kp.toFixed(2);
  canvas.dataset.sky = d.sky.code;
  canvas.setAttribute('aria-label', `A rendered sky. ${answer}`);
  dirty = true;
}

for (const name of ['speed', 'density', 'bz']) {
  on($(`#${name}`), 'input', (event) => {
    state[name] = Number(event.currentTarget.value);
    syncInterface();
  });
}
$$('[data-latitude]').forEach((input) => on(input, 'input', () => {
  state.latitude = Number(input.value);
  syncInterface();
}));
$$('[data-preset]').forEach((button) => on(button, 'click', () => {
  Object.assign(state, PRESETS[button.dataset.preset]);
  syncInterface();
}));
$$('[data-iso]').forEach((button) => on(button, 'click', () => {
  state.iso = button.dataset.iso;
  syncInterface();
}));

const stillButton = $('#still');
const syncStill = () => {
  stillButton.textContent = still ? 'Let it move' : 'Hold still';
  stillButton.setAttribute('aria-pressed', String(still));
  dirty = true;
};
on(stillButton, 'click', () => { still = !still; syncStill(); });
on(motion, 'change', (event) => {
  still = event.matches;
  lenis.options.smoothWheel = !event.matches;
  syncStill();
});
syncStill();
on(window, 'pointermove', (event) => {
  if (event.pointerType === 'touch') return;
  pointerX = (event.clientX / innerWidth - 0.5) * 2;
}, { passive: true });

const dialog = $('#sources');
let returnFocus = $('#sources-open');
const openSources = (button) => {
  returnFocus = button;
  lenis.stop();
  dialog.showModal();
};
on($('#sources-open'), 'click', (event) => openSources(event.currentTarget));
on($('#sources-end'), 'click', (event) => openSources(event.currentTarget));
on($('#sources-close'), 'click', () => dialog.close());
on(dialog, 'close', () => {
  lenis.start();
  returnFocus.focus({ preventScroll: true });
});
on(dialog, 'click', (event) => { if (event.target === dialog) dialog.close(); });

// Copies the frame into a captioned image: the current sky, its inputs and the plain caveat.
on($('#save'), 'click', async () => {
  const feedback = $('#save-status');
  drawNow();
  const unit = Math.max(11, canvas.width / 80);
  const output = document.createElement('canvas');
  output.width = canvas.width;
  output.height = canvas.height + Math.round(unit * 5);
  const c = output.getContext('2d');
  c.drawImage(canvas, 0, 0);
  c.fillStyle = '#050a14';
  c.fillRect(0, canvas.height, output.width, output.height - canvas.height);
  c.fillStyle = '#e9f1ee';
  c.font = `300 ${unit * 1.5}px "Aurora Flex", sans-serif`;
  const d = derive();
  c.fillText(`AURORA, Kp ${d.kp.toFixed(1)}, magnetic latitude ${state.latitude}°`, unit * 1.5, canvas.height + unit * 2.2);
  c.fillStyle = '#9fb1b6';
  c.font = `400 ${unit}px "Aurora Flex", sans-serif`;
  c.fillText('A rendered illustration, not a photograph or a forecast.', unit * 1.5, canvas.height + unit * 3.9);
  try {
    const blob = await new Promise((resolve) => output.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('No image');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aurora-kp${d.kp.toFixed(1)}-lat${state.latitude}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 15000);
    feedback.textContent = 'Saved. Your sky is in your downloads.';
  } catch {
    feedback.textContent = 'The image could not be saved. Try again.';
  }
});

const chapters = $$('.chapter');
const navButtons = $$('.chapters button');
const shown = [];
function panel(index, opacity, y = 0) {
  const key = `${opacity.toFixed(3)},${y.toFixed(1)}`;
  if (shown[index] === key) return;
  shown[index] = key;
  const el = chapters[index];
  const visible = opacity > 0.02;
  el.classList.toggle('is-visible', visible);
  el.style.opacity = opacity;
  el.style.transform = y ? `translateY(${y}px)` : '';
  el.setAttribute('aria-hidden', String(!visible));
  el.inert = !visible;
}

const ruler = $('.ruler');
ruler.innerHTML = [100, 200, 300].map((km) => `<span data-km="${km}">${km} km</span>`).join('');
const rulerMarks = [...ruler.children];
const labels = $('.labels');
labels.innerHTML = '<span data-label="wind">Solar wind</span><span data-label="boundary"></span><span data-label="earth">Earth, to scale</span><span data-label="sun">Toward the Sun</span><span data-label="you">You</span><span data-label="edge">Oval edge</span>';
const label = Object.fromEntries([...labels.children].map((node) => [node.dataset.label, node]));
const place = (node, point, opacity) => {
  if (!point || opacity <= 0.01) {
    node.style.opacity = 0;
    return;
  }
  node.style.opacity = opacity;
  node.style.transform = `translate3d(${point.x.toFixed(1)}px,${point.y.toFixed(1)}px,0)`;
};

function placeOverlays(scene, aspect) {
  const w = innerWidth;
  const h = innerHeight;
  const wide = aspect >= 1.25;
  const cam = cameraAt(scene, view.equator + 3);
  const side = scene.diagram * smooth(0.205, 0.235, progress) * (1 - scene.sky);
  const theta = 1.05;
  const r = magnetopause(theta, view.r0, view.alpha);
  label.boundary.textContent = `Magnetopause, ${view.r0.toFixed(1)} Earth radii at the nose`;
  place(label.wind, wide ? { x: w * 0.02, y: h * 0.3 } : null, side);
  place(label.boundary, wide ? projectPoint(cam, [Math.cos(theta) * r, 0, Math.sin(theta) * r], w, h) : null, side);
  place(label.earth, wide ? projectPoint(cam, [0, 0, -2], w, h) : null, side);
  const pole = scene.ring;
  place(label.sun, wide ? projectPoint(cam, [1.25, 0, 0.35], w, h) : null, pole);
  const toRing = (latitude) => {
    const c = ((90 - latitude) * Math.PI) / 180;
    return projectPoint(cam, [-Math.sin(c), 0, Math.cos(c)], w, h);
  };
  place(label.you, toRing(view.latitude), pole);
  place(label.edge, wide ? toRing(view.equator) : null, pole * smooth(4, 7, Math.abs(view.equator - view.latitude)));
  const showRuler = smooth(0.68, 0.71, progress) * (1 - smooth(0.775, 0.8, progress)) * (view.distanceKm > 60 ? 1 : 0);
  ruler.style.opacity = showRuler;
  if (showRuler > 0.01) {
    const focal = 1 / Math.tan(((aspect < 1 ? 74 : 58) * Math.PI) / 360);
    for (const mark of rulerMarks) {
      const y = altitudeToScreen(Number(mark.dataset.km), view.distanceKm, scene.pitch, h, focal);
      mark.style.opacity = y === null || y < 40 || y > h - 40 ? 0 : 1;
      if (y !== null) mark.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
    }
  }
}

function updateView(delta) {
  const d = derive();
  const rate = still ? 1 : 1 - Math.exp(-delta * 3.2);
  const approach = (key, target) => {
    const next = view[key] + (target - view[key]) * rate;
    if (Math.abs(next - view[key]) > 1e-4) dirty = true;
    view[key] = Math.abs(target - next) < 1e-4 ? target : next;
  };
  approach('kp', d.kp);
  approach('r0', d.r0);
  approach('alpha', d.alpha);
  approach('open', d.open);
  approach('equator', d.sky.band.equator);
  approach('latitude', state.latitude);
  approach('speed', state.speed);
  const local = skyState(view.latitude, view.kp);
  approach('distanceKm', local.distanceKm);
  const target = ISO[state.iso];
  for (let i = 0; i < 3; i += 1) {
    const next = view.iso[i] + (target[i] - view.iso[i]) * rate;
    if (Math.abs(next - view.iso[i]) > 1e-3) dirty = true;
    view.iso[i] = Math.abs(target[i] - next) < 1e-3 ? target[i] : next;
  }
}

function drawNow() {
  const scene = sceneAt(progress, innerWidth / innerHeight);
  renderer.draw({ scene, view, time: clock, yaw, preload: progress > 0.06 });
  return scene;
}

function frame(time) {
  if (disposed) return;
  lenis.raf(time * 1000);
  const delta = lastTime ? Math.min(time - lastTime, 0.1) : 0;
  lastTime = time;
  const p = progress;
  panel(0, 1 - smooth(0.085, 0.125, p), -smooth(0.085, 0.125, p) * 28);
  panel(1, smooth(0.205, 0.235, p) * (1 - smooth(0.375, 0.405, p)), (1 - smooth(0.205, 0.235, p)) * 20);
  panel(2, smooth(0.475, 0.505, p) * (1 - smooth(0.585, 0.61, p)), (1 - smooth(0.475, 0.505, p)) * 20);
  panel(3, smooth(0.68, 0.71, p) * (1 - smooth(0.775, 0.8, p)), (1 - smooth(0.68, 0.71, p)) * 20);
  panel(4, smooth(0.84, 0.875, p), (1 - smooth(0.84, 0.875, p)) * 20);
  const seen = p < 0.17 ? 0 : p < 0.44 ? 1 : p < 0.645 ? 2 : p < 0.82 ? 3 : 4;
  if (seen !== lastSeen) {
    navButtons.forEach((button, i) => (i === seen ? button.setAttribute('aria-current', 'step') : button.removeAttribute('aria-current')));
    lastSeen = seen;
    canvas.dataset.chapter = String(seen);
  }
  if (document.hidden || dialog.open) return;
  updateView(delta);
  const targetYaw = still ? 0 : pointerX * 0.045;
  if (Math.abs(targetYaw - yaw) > 1e-4) {
    yaw += (targetYaw - yaw) * Math.min(1, delta * 2.4);
    dirty = true;
  }
  if (!still) {
    clock += delta;
    dirty = true;
  }
  if (!dirty || time - lastDraw < 1 / 62) return;
  const started = performance.now();
  const scene = drawNow();
  placeOverlays(scene, innerWidth / innerHeight);
  if (!canvas.classList.contains('ready')) {
    canvas.classList.add('ready');
    canvas.dataset.progress = '0';
  }
  canvas.dataset.progress = p.toFixed(4);
  if (lastDraw) renderer.adapt((time - lastDraw) * 1000);
  canvas.dataset.frameMs = (performance.now() - started).toFixed(1);
  lastDraw = time;
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
