import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MaterialStage } from './material-stage.js';
import { Atmosphere, SensoryAudio } from './atmosphere.js';
import { scenes, smooth, frameFor, renderState } from './scenes.js';

gsap.registerPlugin(ScrollTrigger);

const $ = (selector) => document.querySelector(selector);
const root = document.documentElement;
const body = document.body;
const main = $('#experience');
const indexDialog = $('#chapter-index');
const indexButton = $('#chapter-toggle');
const status = $('#live-status');
const arrow = '<svg viewBox="0 0 40 20" aria-hidden="true"><path d="M1 10h35M28 3l8 7-8 7" /></svg>';

function controlsFor(scene, index) {
  if (index === 2) return '<div class="scene__control"><label class="sr-only" for="browning">Browning progression</label><div class="range-ends" aria-hidden="true"><span>Gold</span><span>Chestnut</span></div><input id="browning" type="range" min="0" max="100" step="1" value="0" aria-valuetext="Pale gold" /></div>';
  if (index === 3) return `<button class="scene__action" data-advance="crack"><span>Break the crust</span>${arrow}</button>`;
  if (index === 5) return '<div class="scene__control"><label class="sr-only" for="viscosity">Chocolate flow</label><div class="range-ends" aria-hidden="true"><span>Thick</span><span>Flow</span></div><input id="viscosity" type="range" min="0" max="100" step="1" value="40" aria-valuetext="A slow, thick ribbon" /></div>';
  if (index === 9) return `<button class="scene__action" data-advance="cut"><span>Make the cut</span>${arrow}</button>`;
  return '';
}

main.innerHTML = scenes.map((scene, index) => `
  <section class="scene${index === 0 ? ' is-visible' : ''}" id="${scene.id}" data-scene-index="${index}" data-tone="${scene.tone}" style="--duration:${scene.duration}" aria-label="${String(index + 1).padStart(2, '0')} — ${scene.name}">
    ${index === 0 ? '<h1 class="sr-only">CRAVE — Before the First Bite</h1>' : ''}
    <div class="scene__copy" ${index > 0 ? 'aria-hidden="true" inert' : ''}>
      ${index === 0 ? '<p class="hero-tagline">Before the first bite.</p>' : `<h2>${scene.title ? `<span>${scene.title}</span> ` : ''}<em>${scene.italic}</em></h2>`}
      ${controlsFor(scene, index)}
    </div>
    <p class="sr-only">${scene.description}</p>
  </section>`).join('') + '<div class="story-tail" aria-hidden="true"></div>';

$('#chapter-links').innerHTML = scenes.map((scene, index) => `<a href="#${scene.id}" data-chapter="${index}"${index === 0 ? ' aria-current="step"' : ''}><span>${String(index + 1).padStart(2, '0')}</span><strong>${scene.name}</strong></a>`).join('');

const sections = [...main.querySelectorAll('.scene')];
const copies = sections.map((section) => section.querySelector('.scene__copy'));
const chapterLinks = [...$('#chapter-links').querySelectorAll('a')];
const heroWord = $('#hero-word');
const progressBar = $('.journey-progress');
const progressFill = progressBar.firstElementChild;
const caption = $('#scene-caption');
const counter = $('#current-number');
const nextButton = $('#next-scene');
const still = $('#still-media');
const cutEdge = $('.cut-edge');
const visualStage = $('.visual-stage');
const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
const mobileQuery = matchMedia('(max-width: 700px)');
const controls = { flow: 0.4, browning: null };
let manualPause = false;
try { manualPause = localStorage.getItem('crave-motion') === 'off'; } catch { /* Storage is optional. */ }
let motion = !reducedQuery.matches && !manualPause;
let mobile = mobileQuery.matches;
let dirty = true;
let distance = 0;
let totalScroll = 1;
let bounds = [];
let activeIndex = 0;
let activeProgress = 0;
let displayIndex = -1;
let livingTime = 0;
let lastDrawTime = -1;
let lastDistance = -1;
let lastPercent = -1;
let previousMotion = motion;
let fallbackKey = '';
let fallbackRequest = 0;
let fallbackFrame = null;
const failedImages = new Set();
let resizeTask;
let destroyed = false;
let pointer = [0.5, 0.5];
let pointerTarget = [0.5, 0.5];
let opacityCache = Array(scenes.length).fill(-1);
const lifecycle = new AbortController();
const pendingFallbackImages = new Set();
let lenis, atmosphere, audio, stage, story;
let clockAttached = false;
let suspended = false;
let suspendedPosition = null;
let measuredWidth = 0;
let measuredHeight = 0;

function listen(target, type, handler, options = {}) {
  target.addEventListener(type, handler, { ...options, signal: lifecycle.signal });
}

function startClock() {
  if (clockAttached || destroyed || suspended || document.hidden) return;
  gsap.ticker.add(tick);
  clockAttached = true;
  gsap.ticker.wake();
}

function stopClock() {
  if (!clockAttached) return;
  gsap.ticker.remove(tick);
  clockAttached = false;
}

function dispose() {
  if (destroyed) return;
  destroyed = true;
  lifecycle.abort();
  resizeTask?.kill();
  stopClock();
  ++fallbackRequest;
  for (const image of pendingFallbackImages) image.removeAttribute('src');
  pendingFallbackImages.clear();
  story?.kill();
  lenis?.destroy();
  stage?.destroy();
  atmosphere?.destroy();
  audio?.destroy();
}

function suspend() {
  if (destroyed || suspended) return;
  suspendedPosition = locate(window.scrollY);
  suspended = true;
  resizeTask?.kill();
  audio?.suspend();
  lenis?.stop();
  atmosphere?.render({ scene: activeIndex, progress: activeProgress, time: livingTime, dt: 0, motion: false, visible: false, mobile });
  stopClock();
  gsap.ticker.sleep();
}

function resume() {
  if (destroyed || document.hidden) return;
  suspended = false;
  const changedSize = innerWidth !== measuredWidth || innerHeight !== measuredHeight;
  measure(changedSize && Boolean(suspendedPosition), suspendedPosition);
  suspendedPosition = null;
  lenis.scrollTo(window.scrollY, { immediate: true, force: true });
  if (!indexDialog.open) lenis.start();
  dirty = true;
  startClock();
}

// Own terminal navigation before any resource is initialized. BFCache keeps the
// existing document and its resources suspended until pageshow/visibility.
listen(window, 'pagehide', event => event.persisted ? suspend() : dispose());
if (import.meta.hot) import.meta.hot.dispose(dispose);

// Lenis is the sole scroll authority. It never starts a RAF of its own.
try {
  lenis = new Lenis({
    autoRaf: false, autoResize: false, lerp: 0.105,
    smoothWheel: motion, syncTouch: false, overscroll: false,
    anchors: false, respectReducedMotion: true,
    virtualScroll: ({ deltaY, event }) => {
      if (event.type === 'wheel' && !event.ctrlKey && motion &&
          !document.hidden && !suspended && !indexDialog.open && !lenis.isStopped &&
          deltaY * (lenis.targetScroll - lenis.actualScroll) < 0) {
        lenis.stop();
        lenis.start();
      }
    },
  });
  lenis.on('scroll', ScrollTrigger.update);

  atmosphere = new Atmosphere($('#atmosphere-canvas'));
  audio = new SensoryAudio();
  stage = new MaterialStage($('#material-canvas'), {
    baseUrl: `${import.meta.env.BASE_URL}crave/media/`,
    onReady: () => {
      if (destroyed) return;
      dirty = true;
    },
    onError: (error) => {
      if (destroyed) return;
      dirty = true;
      if (error.image) failedImages.add(error.image);
    },
  });

  story = ScrollTrigger.create({
    trigger: main,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => { distance = self.progress * totalScroll; dirty = true; },
  });
} catch (error) {
  dispose();
  throw error;
}

function locate(y) {
  let index = 0;
  for (let i = bounds.length - 1; i >= 0; i--) {
    if (y >= bounds[i].top) { index = i; break; }
  }
  const bound = bounds[index];
  return { index, progress: bound ? Math.min(1, Math.max(0, (y - bound.top) / bound.height)) : 0 };
}

function measure(preserve = false, prior = null) {
  if (destroyed) return;
  const before = prior || locate(distance);
  mobile = mobileQuery.matches;
  const height = innerHeight;
  measuredWidth = innerWidth;
  measuredHeight = height;
  sections.forEach((section, i) => { section.style.height = `${Math.round(scenes[i].duration * height)}px`; });
  $('.story-tail').style.height = `${height}px`;
  bounds = sections.map((section) => ({ top: section.offsetTop, height: section.offsetHeight }));
  totalScroll = bounds.at(-1).top + bounds.at(-1).height;
  const rect = visualStage.getBoundingClientRect();
  stage.resize(rect.width, rect.height);
  atmosphere.resize(innerWidth, innerHeight);
  lenis.resize();
  ScrollTrigger.refresh();
  if (preserve) {
    const y = bounds[before.index].top + before.progress * bounds[before.index].height;
    lenis.scrollTo(y, { immediate: true, force: true });
  }
  distance = Math.max(0, Math.min(totalScroll, window.scrollY));
  dirty = true;
}

function goTo(index, phase = 0.12, immediate = false) {
  // A native dialog closes synchronously, but its close event arrives later.
  // Resume before establishing a destination so that event cannot reset it.
  if (!document.hidden && !suspended && !indexDialog.open) lenis.start();
  const target = Math.max(0, Math.min(scenes.length - 1, index));
  const p = target === 0 ? 0 : phase;
  lenis.scrollTo(bounds[target].top + bounds[target].height * p, {
    immediate: immediate || !motion,
    duration: target === 0 ? 1.3 : 0.92,
    easing: (t) => 1 - Math.pow(1 - t, 4),
    force: true,
    onComplete: () => { dirty = true; },
  });
  history.replaceState(null, '', `#${scenes[target].id}`);
  status.textContent = `${target + 1} of 11. ${scenes[target].name}.`;
}

function setCopy(index, opacity, translate = 0) {
  const value = Math.round(Math.max(0, Math.min(1, opacity)) * 1000) / 1000;
  if (opacityCache[index] === value && value === 0) return;
  const copy = copies[index];
  const visible = value > 0.01;
  copy.style.opacity = value;
  copy.style.transform = `translate3d(0, ${motion ? translate.toFixed(2) : 0}px, 0)`;
  if ((opacityCache[index] > 0.01) !== visible || opacityCache[index] < 0) {
    sections[index].classList.toggle('is-visible', visible);
    copy.setAttribute('aria-hidden', String(!visible));
    copy.inert = !visible;
  }
  opacityCache[index] = value;
}

function showUI(index, p) {
  let a = 1 - smooth(0.66, 0.84, p);
  let b = index < 10 ? smooth(0.86, 1, p) : 0;
  if (index === 10) a = 1;
  if (index === 3) { a = 1 - smooth(0.27, 0.4, p); b = smooth(0.59, 0.77, p); }
  if (index === 9) { a = 1 - smooth(0.31, 0.47, p); b = smooth(0.9, 1, p); }
  if (!motion) {
    const departure = index === 3 || index === 9 ? 0.48 : 0.92;
    const arrival = index === 3 ? 0.48 : 0.92;
    a = p < departure || index === 10 ? 1 : 0;
    b = index < 10 && p >= arrival ? 1 : 0;
  }
  for (let i = 0; i < copies.length; i++) {
    const opacity = i === index ? a : i === index + 1 ? b : 0;
    setCopy(i, opacity, i === index ? -smooth(0.6, 0.86, p) * 12 : (1 - b) * 15);
  }
  const shown = b > 0.42 ? Math.min(10, index + 1) : index;
  if (displayIndex !== shown) {
    displayIndex = shown;
    body.dataset.scene = scenes[shown].id;
    counter.textContent = String(shown + 1).padStart(2, '0');
    nextButton.setAttribute('aria-label', shown === 10 ? 'Replay from the beginning' : `Continue to ${scenes[shown + 1].name}`);
    chapterLinks.forEach((link, i) => i === shown ? link.setAttribute('aria-current', 'step') : link.removeAttribute('aria-current'));
  }
  caption.textContent = scenes[shown].caption;
  // Header contrast follows the actual material handoff, independently of copy.
  let tone = scenes[index].tone;
  if (index === 3 && p >= (motion ? 0.5 : 0.48)) tone = 'light';
  else if (index < 10 && p > 0.89) tone = scenes[index + 1].tone;
  if (body.dataset.tone !== tone) body.dataset.tone = tone;
  heroWord.style.opacity = index === 0 ? motion ? (1 - smooth(0.4, 0.82, p)).toFixed(3) : p < 0.92 ? '1' : '0' : '0';
  if (index === 3 && p > 0.52 && p < 0.87) caption.textContent = 'Crisp gives way.';
  if (index === 9 && p > 0.59 && p < 0.91) caption.textContent = 'Freshly cut.';

  // One brief metal edge: approach, pressure, then release. No hand enters.
  const knife = index === 9 && motion ? smooth(0.18, 0.29, p) * (1 - smooth(0.51, 0.6, p)) : 0;
  cutEdge.style.opacity = knife.toFixed(3);
  if (knife > 0) {
    const pressure = smooth(0.24, 0.49, p);
    cutEdge.style.transform = `translate3d(${(1 - pressure) * (mobile ? 24 : 78)}px, ${pressure * (mobile ? 16 : 32)}px, 0) rotate(-40deg)`;
  }
  if (index === 2 && controls.browning === null) {
    const val = Math.round(smooth(0.05, 0.68, p) * 100);
    $('#browning').value = String(val);
    $('#browning').setAttribute('aria-valuetext', val < 33 ? 'Gold' : val < 68 ? 'Amber' : 'Chestnut');
  }
  const percent = Math.round(Math.min(1, distance / totalScroll) * 100);
  progressFill.style.transform = `scaleX(${Math.min(1, distance / totalScroll)})`;
  if (lastPercent !== percent) { progressBar.setAttribute('aria-valuenow', String(percent)); lastPercent = percent; }
}

function positionFallback() {
  if (!fallbackFrame) return;
  const rect = visualStage.getBoundingClientRect();
  const zoom = motion ? fallbackFrame.zoom : 1;
  const scale = Math.max(rect.width / 1536, rect.height / 1024) * zoom;
  const width = 1536 * scale;
  const height = 1024 * scale;
  const x = Math.min(0, Math.max(rect.width - width, rect.width / 2 - fallbackFrame.focus[0] * width));
  const y = Math.min(0, Math.max(rect.height - height, rect.height / 2 - fallbackFrame.focus[1] * height));
  still.style.width = `${width}px`;
  still.style.height = `${height}px`;
  still.style.transform = `translate3d(${x}px, ${y}px, 0)`;
}

async function showFallback(frame) {
  if (destroyed) return;
  fallbackFrame = frame;
  positionFallback();
  const key = `${frame.image}-${mobile ? 768 : 1536}`;
  if (fallbackKey === key) return;
  fallbackKey = key;
  const serial = ++fallbackRequest;
  for (const width of mobile ? [768, 1536] : [1536, 768]) {
    if (destroyed || serial !== fallbackRequest) return;
    const img = new Image();
    pendingFallbackImages.add(img);
    img.src = `${import.meta.env.BASE_URL}crave/media/${frame.image}-${width}.webp`;
    try { await img.decode(); } catch { continue; }
    finally { pendingFallbackImages.delete(img); }
    if (destroyed || serial !== fallbackRequest) return;
    still.removeAttribute('srcset');
    still.src = img.src;
    positionFallback();
    body.classList.remove('stage-ready');
    body.classList.add('stage-fallback');
    return;
  }
  // Both local variants failed: preserve the last complete photograph.
}

function tick(time, deltaMs) {
  if (destroyed || suspended || document.hidden) return;
  lenis.raf(time * 1000);
  distance = Math.max(0, Math.min(totalScroll, window.scrollY));
  const dt = Math.min(0.05, Math.max(0, deltaMs / 1000));
  if (motion && !indexDialog.open) livingTime += dt;
  const found = locate(distance);
  if (found.index !== activeIndex) { controls.browning = null; audio.setScene(found.index); }
  activeIndex = found.index;
  activeProgress = found.progress;
  const moving = Math.abs(distance - lastDistance) > 0.05;
  if (moving || dirty || previousMotion !== motion) showUI(activeIndex, activeProgress);
  const follow = 1 - Math.exp(-dt * 9);
  pointer = pointer.map((value, i) => value + (pointerTarget[i] - value) * follow);
  if (indexDialog.open) {
    atmosphere.render({ scene: activeIndex, progress: activeProgress, time: livingTime, dt, motion: false, visible: false, mobile });
    return;
  }
  const state = renderState(activeIndex, activeProgress, mobile, controls, !motion);
  if (!motion) {
    state.current.zoom = frameFor(activeIndex, 0.28, mobile, controls).zoom;
    state.next.zoom = frameFor(Math.min(10, activeIndex + 1), 0.28, mobile, controls).zoom;
  }
  const draw = dirty || stage.needsRender || moving || previousMotion !== motion || (motion && time - lastDrawTime >= (mobile ? 1 / 40 : 1 / 50));
  if (draw) {
    const rendered = stage.available && stage.render({ ...state, time: livingTime, dt, motion, pointer, flow: controls.flow, mobile });
    if (rendered) {
      if (fallbackKey || body.classList.contains('stage-fallback')) {
        ++fallbackRequest;
        fallbackKey = '';
      }
      if (!body.classList.contains('stage-ready')) {
        body.classList.add('stage-ready');
        body.classList.remove('stage-fallback');
        still.removeAttribute('src');
        still.removeAttribute('srcset');
      }
    } else {
      const required = !motion ? [state.blend >= 0.5 ? state.next : state.current]
        : state.blend < 0.00001 ? [state.current]
        : state.blend > 0.99999 ? [state.next] : [state.current, state.next];
      if (!stage.available || required.some(frame => failedImages.has(frame.image))) {
        showFallback(state.blend >= 0.5 ? state.next : state.current);
      }
    }
    atmosphere.render({ scene: activeIndex, progress: activeProgress, time: livingTime, dt, motion, visible: true, mobile });
    lastDrawTime = time;
    dirty = false;
  }
  audio.tick({ scene: activeIndex, progress: activeProgress, dt, motion });
  previousMotion = motion;
  lastDistance = distance;
}

function syncMotion() {
  const y = window.scrollY;
  lenis.stop();
  motion = !reducedQuery.matches && !manualPause;
  lenis.options.smoothWheel = motion;
  lenis.scrollTo(y, { immediate: true, force: true });
  if (!document.hidden && !suspended && !indexDialog.open) lenis.start();
  $('#motion-toggle span').textContent = reducedQuery.matches ? 'reduced' : motion ? 'on' : 'off';
  $('#motion-toggle').setAttribute('aria-pressed', String(!motion));
  $('#motion-toggle').setAttribute('aria-label', reducedQuery.matches ? 'Reduced motion follows your device preference' : motion ? 'Pause decorative motion' : 'Resume decorative motion');
  $('#viscosity').disabled = !motion;
  $('#viscosity').setAttribute('aria-label', motion ? 'Chocolate flow' : 'Chocolate flow is still while motion is paused');
  if (!motion) audio.suspend();
  dirty = true;
}

listen(indexButton, 'click', () => {
  indexDialog.showModal();
  indexButton.setAttribute('aria-expanded', 'true');
  lenis.stop();
  audio.suspend();
  $('#close-index').focus();
});
listen($('#close-index'), 'click', () => indexDialog.close());
listen(indexDialog, 'close', () => {
  indexButton.setAttribute('aria-expanded', 'false');
  if (!document.hidden) lenis.start();
  dirty = true;
  indexButton.focus({ preventScroll: true });
});
chapterLinks.forEach((link, index) => listen(link, 'click', (event) => {
  event.preventDefault();
  indexDialog.close();
  if (!document.hidden) lenis.start();
  goTo(index);
}));
listen($('.site-header .wordmark'), 'click', (event) => { event.preventDefault(); goTo(0); });
listen(nextButton, 'click', () => goTo(displayIndex === 10 ? 0 : displayIndex + 1));
main.querySelectorAll('[data-advance]').forEach((button) => listen(button, 'click', () => {
  const target = button.dataset.advance === 'crack' ? 3 : 9;
  goTo(target, target === 3 ? 0.8 : 0.66);
}));
listen($('#browning'), 'input', (event) => {
  controls.browning = Number(event.target.value) / 100;
  event.target.setAttribute('aria-valuetext', controls.browning < 0.33 ? 'Gold' : controls.browning < 0.68 ? 'Amber' : 'Chestnut');
  dirty = true;
});
listen($('#viscosity'), 'input', (event) => {
  controls.flow = Number(event.target.value) / 100;
  event.target.setAttribute('aria-valuetext', controls.flow < 0.34 ? 'Very thick and slow' : controls.flow < 0.7 ? 'A slow, thick ribbon' : 'A softer flowing ribbon');
  dirty = true;
});
listen($('#sound-toggle'), 'click', async () => {
  try {
    const enabled = await audio.toggle();
    if (destroyed) return;
    $('#sound-toggle span').textContent = enabled ? 'on' : 'off';
    $('#sound-toggle').setAttribute('aria-pressed', String(enabled));
    $('#sound-toggle').setAttribute('aria-label', enabled ? 'Turn sensory sound off' : 'Turn sensory sound on');
    status.textContent = enabled ? 'Subtle sensory sound is on.' : 'Sound is off.';
  } catch {
    if (destroyed) return;
    status.textContent = 'Sound is unavailable in this browser. The visual experience remains available.';
  }
});
listen($('#motion-toggle'), 'click', () => {
  if (reducedQuery.matches) { status.textContent = 'Reduced motion follows your device preference.'; return; }
  manualPause = !manualPause;
  try { localStorage.setItem('crave-motion', manualPause ? 'off' : 'on'); } catch { /* Nonessential preference. */ }
  syncMotion();
});
listen(reducedQuery, 'change', syncMotion);
listen(window, 'pointermove', (event) => {
  if (event.pointerType !== 'mouse' || !motion || indexDialog.open) return;
  pointerTarget = [event.clientX / innerWidth, event.clientY / innerHeight];
}, { passive: true });
listen(document, 'pointerleave', () => { pointerTarget = [0.5, 0.5]; });
listen(window, 'keydown', (event) => {
  if (indexDialog.open || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input, textarea, select, [contenteditable]')) return;
  if (event.key === 'ArrowRight') { event.preventDefault(); goTo(Math.min(10, displayIndex + 1)); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(Math.max(0, displayIndex - 1)); }
});
listen(window, 'resize', () => {
  if (document.hidden || suspended) return;
  const prior = locate(distance);
  resizeTask?.kill();
  resizeTask = gsap.delayedCall(0.16, () => measure(true, prior));
});
listen(document, 'visibilitychange', () => document.hidden ? suspend() : resume());
listen(window, 'pageshow', event => { if (event.persisted) resume(); });

syncMotion();
measure();
const initialPosition = locate(distance);
showUI(initialPosition.index, initialPosition.progress);
document.fonts.ready.then(() => { if (!destroyed && !document.hidden && !suspended) measure(true); });
const requested = scenes.findIndex((scene) => `#${scene.id}` === location.hash);
if (requested >= 0 && window.scrollY < 2) goTo(requested, 0.12, true);
gsap.ticker.lagSmoothing(0);
if (document.hidden) suspend();
else startClock();
body.classList.add('is-enhanced');
