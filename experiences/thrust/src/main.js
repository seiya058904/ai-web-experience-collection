import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { CHAPTERS, chapterAt, sceneState, clamp } from './story.js';
import { createSound } from './sound.js';

const root = document.documentElement;
const body = document.body;
const sections = [...document.querySelectorAll('.chapter')];
const copies = sections.map(section => section.querySelector('.scene-copy'));
const rails = [...document.querySelectorAll('.chapter-rail a')];
const dialog = document.querySelector('#index-dialog');
const indexOpen = document.querySelector('#index-open');
const motionButton = document.querySelector('#motion-toggle');
const qualityButton = document.querySelector('#quality-toggle');
const soundButton = document.querySelector('#sound-toggle');
const cutButton = document.querySelector('#blade-cut');
const announcement = document.querySelector('#announcement');
const atmosphere = document.querySelector('.atmosphere');
const shade = document.querySelector('.editorial-shade');
const vignette = document.querySelector('.scene-vignette');
const worldElement = document.querySelector('#world');
const status = document.querySelector('#render-status');
const media = matchMedia('(prefers-reduced-motion: reduce)');
const events = new AbortController();
const on = (target, event, fn, extra = {}) => target.addEventListener(event, fn, { signal: events.signal, ...extra });
let world, sound, bounds = [], target = 0, progress = 0, time = 0, lastTime = 0, raf = 0;
let paused = media.matches, motionOverride = false, quality = false, soundEnabled = false;
let bladeCut = null, lastIndex = -1, inspectAngle = 0, dragStart = null, startingAngle = 0;
let restoreTimer = 0, resizeTimer = 0, disposed = false, staticMode = false;
let wheelDirection = 0;
const lenis = new Lenis({
  lerp: .105, smoothWheel: !paused, syncTouch: false,
  autoRaf: false, respectReducedMotion: false,
  prevent: node => Boolean(node.closest('dialog')),
  virtualScroll: ({ deltaY, event }) => {
    if (event.type !== 'wheel' || event.ctrlKey || !deltaY) return true;
    const direction = Math.sign(deltaY);
    if (wheelDirection && direction !== wheelDirection && lenis.isScrolling === 'smooth')
      lenis.scrollTo(lenis.animatedScroll, { immediate: true });
    wheelDirection = direction;
    return true;
  },
});
let scrollClock = 0;
lenis.on('virtual-scroll', requestFrame);
let pendingFocusIndex = null, layoutViewport = 0, layoutWidth = 0, layoutMobile = null;

function measure(preserveProgress = false) {
  const savedProgress = preserveProgress ? target : null;
  const mobile = innerWidth <= 700;
  // Stable height prevents mobile browser chrome from changing the scroll-to-scene mapping.
  if (!layoutViewport || !mobile || mobile !== layoutMobile || Math.abs(innerWidth - layoutWidth) > 12) layoutViewport = innerHeight;
  const viewport = layoutViewport;
  layoutWidth = innerWidth; layoutMobile = mobile;
  for (let i = 0; i < sections.length; i++) sections[i].style.setProperty('--chapter-height', `${Math.round((mobile ? CHAPTERS[i].mobile : CHAPTERS[i].length) * viewport)}px`);
  const pageEnd = document.documentElement.scrollHeight - innerHeight;
  bounds = sections.map((section, i) => ({ top: section.offsetTop, span: i < sections.length - 1 ? sections[i + 1].offsetTop - section.offsetTop : Math.max(1, pageEnd - section.offsetTop) }));
  if (savedProgress !== null && !staticMode) {
    const i = Math.floor(savedProgress);
    lenis.resize();
    lenis.scrollTo(bounds[i].top + bounds[i].span * (savedProgress-i), { immediate: true, force: true });
  }
  if (lenis.isScrolling !== 'smooth') lenis.resize();
  target = chapterAt(scrollY, bounds);
  world?.resize(quality);
}

function updateUI(state) {
  const { index, local } = state;
  if (index !== lastIndex) {
    bladeCut = null;
    inspectAngle = 0;
    for (let i = 0; i < sections.length; i++) {
      const active = i === index;
      sections[i].classList.toggle('is-active', active);
      if (!staticMode) { copies[i].inert = !active; copies[i].setAttribute('aria-hidden', String(!active)); }
      if (active) rails[i].setAttribute('aria-current', 'step'); else rails[i].removeAttribute('aria-current');
    }
    body.dataset.scene = CHAPTERS[index].id;
    body.classList.toggle('inspecting', index === 6 || index === 7);
    document.querySelector('#mobile-scene').textContent = `${String(index + 1).padStart(2, '0')} / ${CHAPTERS[index].name.toUpperCase()}`;
    announcement.textContent = `${index + 1} of 10. ${CHAPTERS[index].name}.`;
    lastIndex = index;
  }
  if (pendingFocusIndex === index) {
    const heading = sections[index].querySelector('h1,h2');
    heading.tabIndex = -1; heading.focus({preventScroll:true}); pendingFocusIndex = null;
  }
  for (let i = 0; i < rails.length; i++) rails[i].style.setProperty('--part', i < index ? '1' : i === index ? String(local) : '0');
  const entry = media.matches || paused ? 0 : Math.max(0, 1 - local / .12);
  copies[index].style.transform = `translate3d(${entry * -10}px,0,0)`;
  atmosphere.style.opacity = String(state.sky);
  const baseShade = index === 7 ? .45 : index === 6 ? .72 : 1;
  shade.style.opacity = String((1 - state.sky) * baseShade);
  vignette.style.opacity = String(1 - state.sky);
  body.classList.toggle('light-scene', state.sky > .64);
  root.style.setProperty('--accent', state.sky > .64 ? '#1b5e71' : index === 4 || index === 5 ? '#efa46d' : '#81dcec');
  document.querySelectorAll('[data-field]').forEach(field => { field.style.transform = `scaleX(${state[field.dataset.field]})`; });
  const cut = bladeCut ?? state.bladeCut;
  cutButton.setAttribute('aria-pressed', String(cut > .5));
  cutButton.querySelector('span').textContent = cut > .5 ? 'CLOSE THE SECTION' : 'REVEAL THE CHANNELS';
}

function frame(now) {
  raf = 0;
  if (disposed || document.hidden) return;
  const dt = lastTime ? Math.min((now - lastTime) / 1000, .045) : 0;
  lastTime = now;
  scrollClock += dt * 1000;
  lenis.raf(scrollClock);
  target = chapterAt(scrollY, bounds);
  const reduce = media.matches && !motionOverride;
  const moving = !paused && !dialog.open;
  if (moving) time += dt;
  // Lenis owns the input easing; the engine follows that position directly.
  progress = target;
  const state = sceneState(progress);
  updateUI(state);
  try { world?.render(time, state, { inspectAngle, bladeCut, staticShot: reduce }); }
  catch (error) { console.error('THRUST render failed:', error); enableStaticMode(); }
  sound?.update(progress, state.heat);
  if ((moving && !staticMode) || lenis.isScrolling === 'smooth') requestFrame();
}
function requestFrame() { if (!raf && !disposed && !document.hidden) raf = requestAnimationFrame(frame); }
function syncMotion() {
  lenis.options.smoothWheel = !paused && !(media.matches && !motionOverride);
  lenis.scrollTo(scrollY, { immediate: true, force: true });
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.setAttribute('aria-label', paused ? 'Resume motion' : 'Pause motion');
  syncSound(); lastTime = 0; requestFrame();
}
function syncSound() { sound?.setActive(soundEnabled && !paused && !document.hidden && !dialog.open).catch(() => { soundEnabled = false; soundButton.setAttribute('aria-pressed', 'false'); soundButton.querySelector('[data-state]').textContent = 'OFF'; }); }

function navigate(id, smooth = true, keyboard = false) {
  const index = CHAPTERS.findIndex(chapter => chapter.id === id);
  if (index < 0) return;
  if (dialog.open) dialog.close();
  lenis.start();
  pendingFocusIndex = keyboard ? index : null;
  const y = bounds[index]?.top + (index === 0 ? 0 : (bounds[index]?.span || 0) * .18);
  history.pushState(null, '', `#${id}`);
  lenis.resize();
  lenis.scrollTo(Number.isFinite(y) ? y : 0, { immediate: !smooth || !lenis.options.smoothWheel });
  requestFrame();
}
on(document, 'click', event => {
  const anchor = event.target.closest('a[href^="#"]');
  if (!anchor || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const id = anchor.getAttribute('href').slice(1);
  if (!CHAPTERS.some(chapter => chapter.id === id)) return;
  event.preventDefault(); navigate(id, true, event.detail === 0);
});
on(window, 'scroll', () => { target = chapterAt(scrollY, bounds); requestFrame(); }, { passive: true });
on(window, 'resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { measure(true); progress = target; requestFrame(); }, 100);
}, { passive: true });
on(window, 'pageshow', () => { measure(); progress = target; lastTime = 0; requestFrame(); });
on(window, 'hashchange', () => { target = chapterAt(scrollY, bounds); requestFrame(); });
on(media, 'change', () => { if (!motionOverride) paused = media.matches; syncMotion(); });
on(motionButton, 'click', () => { paused = !paused; motionOverride = true; syncMotion(); });
on(indexOpen, 'click', () => { lenis.stop(); dialog.showModal(); body.classList.add('menu-open'); syncSound(); requestFrame(); });
on(document.querySelector('#index-close'), 'click', () => dialog.close());
on(dialog, 'close', () => { lenis.start(); body.classList.remove('menu-open'); lastTime = 0; syncSound(); requestFrame(); });
on(qualityButton, 'click', () => { quality = !quality; qualityButton.setAttribute('aria-pressed', String(quality)); qualityButton.querySelector('[data-state]').textContent = quality ? 'DETAIL' : 'AUTO'; world?.resize(quality); requestFrame(); });
on(soundButton, 'click', async () => {
  try {
    if (!sound) sound = createSound();
    soundEnabled = !soundEnabled;
    soundButton.setAttribute('aria-pressed', String(soundEnabled));
    soundButton.querySelector('[data-state]').textContent = soundEnabled ? 'ON' : 'OFF';
    // The user gesture authorizes the context now; actual sound resumes after the index closes.
    await sound.setActive(soundEnabled); syncSound();
  } catch { soundEnabled = false; soundButton.disabled = true; soundButton.querySelector('[data-state]').textContent = 'UNAVAILABLE'; }
});
on(cutButton, 'click', () => { const current = bladeCut ?? sceneState(progress).bladeCut; bladeCut = current > .5 ? 0 : 1; requestFrame(); });
on(document, 'keydown', event => {
  if (dialog.open || /INPUT|TEXTAREA|SELECT|BUTTON/.test(event.target.tagName) || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); navigate(CHAPTERS[clamp(lastIndex + (event.key === 'ArrowRight' ? 1 : -1), 0, 9)].id, true, true); }
  if (event.key.toLowerCase() === 'm') { paused = !paused; motionOverride = true; syncMotion(); }
});
on(worldElement, 'pointerdown', event => {
  if (!body.classList.contains('inspecting') || event.button !== 0) return;
  dragStart = event.clientX; startingAngle = inspectAngle;
  worldElement.setPointerCapture(event.pointerId); body.classList.add('dragging');
});
on(worldElement, 'pointermove', event => { if (dragStart === null) return; inspectAngle = clamp(startingAngle + (event.clientX - dragStart) * .004, -.65, .65); requestFrame(); });
const endDrag = () => { dragStart = null; body.classList.remove('dragging'); };
on(worldElement, 'pointerup', endDrag); on(worldElement, 'pointercancel', endDrag); on(worldElement, 'lostpointercapture', endDrag);
on(document, 'visibilitychange', () => {
  if (document.hidden) { lenis.scrollTo(scrollY, { immediate: true, force: true }); cancelAnimationFrame(raf); raf = 0; } else { lastTime = 0; target = chapterAt(scrollY, bounds); requestFrame(); }
  syncSound();
});
// Browser-initiated freezing can suspend an outstanding animation callback
// independently of a user changing tabs. Restart from a clean clock/handle.
on(document, 'freeze', () => {
  cancelAnimationFrame(raf); raf = 0; lastTime = 0;
  sound?.setActive(false).catch(() => {});
});
on(document, 'resume', () => {
  cancelAnimationFrame(raf); raf = 0; lastTime = 0;
  target = chapterAt(scrollY, bounds); requestFrame(); syncSound();
});
on(document.querySelector('#restore-view'), 'click', () => location.reload());

function enableStaticMode() {
  staticMode = true; body.classList.add('static-mode');
  world?.dispose(); world = null;
  for (const copy of copies) { copy.inert = false; copy.removeAttribute('aria-hidden'); }
  motionButton.disabled = true; qualityButton.disabled = true;
  status.hidden = false;
  status.querySelector('p').textContent = 'Your browser could not start the 3D view. The complete story is available below.';
  measure();
}

measure(); progress = target; syncMotion(); updateUI(sceneState(progress));
try {
  const { createWorld } = await import('./scene.js');
  world = createWorld(worldElement, {
    mobile: innerWidth <= 700,
    onContextLost() { status.hidden = false; paused = true; syncMotion(); clearTimeout(restoreTimer); },
    onContextRestored() { status.hidden = true; requestFrame(); },
  });
  measure(); progress = target;
  root.dataset.engineReady = 'true';
  const navigation = performance.getEntriesByType('navigation')[0];
  if (location.hash && navigation?.type === 'navigate') {
    const index = CHAPTERS.findIndex(chapter => `#${chapter.id}` === location.hash);
    if (index >= 0) { lenis.scrollTo(bounds[index].top + bounds[index].span * .18, { immediate: true }); target = chapterAt(scrollY, bounds); progress = target; }
  }
  requestFrame();
} catch (error) { console.error('THRUST could not initialize WebGL:', error); enableStaticMode(); }

on(window, 'pagehide', event => {
  lenis.scrollTo(scrollY, { immediate: true, force: true });
  cancelAnimationFrame(raf); raf = 0;
  if (event.persisted) return;
  disposed = true; clearTimeout(resizeTimer); clearTimeout(restoreTimer);
  events.abort(); lenis.destroy(); world?.dispose(); sound?.dispose();
});
