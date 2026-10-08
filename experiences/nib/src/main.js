import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap } from 'gsap';
import { CHAPTERS, clamp, lerp, smoothstep } from './math.js';
import { MaterialRenderer } from './renderer.js';

const html = document.documentElement;
const body = document.body;
const canvas = document.querySelector('#material-stage');
const copies = [...document.querySelectorAll('.chapter-copy')];
const chapters = [...document.querySelectorAll('.chapter')];
const menu = document.querySelector('#journey-dialog');
const colophon = document.querySelector('#colophon-dialog');
const menuButton = document.querySelector('.journey-toggle');
const readingButton = document.querySelector('#reading-toggle');
const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const targetPointer = { x: 0, y: 0 }, pointer = { x: 0, y: 0 };
const tickLinks = [...document.querySelectorAll('.chapter-ticks a')];
const menuLinks = [...document.querySelectorAll('.index-chapters a')];
const positionNumber = document.querySelector('.position-number');
const positionName = document.querySelector('.position-name');
const position = document.querySelector('.chapter-position');
const statement = document.querySelector('.opening-statement');
const enterCue = document.querySelector('.enter-cue');
const ticks = document.querySelector('.chapter-ticks');
const themeMeta = document.querySelector('meta[name="theme-color"]');
const historyKey = '__nibJourney';
const positionStoragePrefix = '__nibJourney:';
const originalScrollRestoration = history.scrollRestoration;
const lifecycle = new AbortController();
const events = { signal: lifecycle.signal };
let disposed = false, clockAttached = false;

let lenis, renderer, ready = false, reading = false;
let reduced = reducedQuery.matches;
let width = innerWidth, height = innerHeight, step = height * 1.5;
let resizePending = false, lastWorld = '', lastIndex = -1;
let liveTime = 0, previousTime = 0, lastDraw = -1, lastQ = 0;
let returnFocus = null, pendingHeadingFocus = null;
let suspendedPosition = null, lastReaderPosition = null;
let positionEntryId = '', lastPersistedPosition = null, lastPersistenceCheck = 0;

const assetURLs = {
  hero: `${import.meta.env.BASE_URL}nib/assets/hero.webp`,
  heroMobile: `${import.meta.env.BASE_URL}nib/assets/hero-mobile.webp`,
  nibProfile: `${import.meta.env.BASE_URL}nib/assets/nib-profile.webp`,
  contact: `${import.meta.env.BASE_URL}nib/assets/contact.webp`,
  reservoir: `${import.meta.env.BASE_URL}nib/assets/reservoir.webp`,
  feed: `${import.meta.env.BASE_URL}nib/assets/feed.webp`,
  slit: `${import.meta.env.BASE_URL}nib/assets/slit.webp`,
  meniscus: `${import.meta.env.BASE_URL}nib/assets/meniscus.webp`,
  paper: `${import.meta.env.BASE_URL}nib/assets/paper.webp`,
  fiber: `${import.meta.env.BASE_URL}nib/assets/fiber.webp`,
  meniscusFluid: `${import.meta.env.BASE_URL}nib/assets/meniscus-fluid.webp`
};

async function loadImages() {
  const pairs = await Promise.all(Object.entries(assetURLs).map(async ([key, url]) => {
    const image = new Image(); image.decoding = 'async'; image.src = url;
    await image.decode(); return [key, image];
  }));
  return Object.fromEntries(pairs);
}

function chapterQ() { return clamp(scrollY / step, 0, 9.999); }

function readerPosition() {
  const y = scrollY;
  let index = 0;
  for (let i = 1; i < chapters.length; i++) {
    if (chapters[i].offsetTop > y + 1) break;
    index = i;
  }
  return { index, offset: clamp((y - chapters[index].offsetTop) / Math.max(1, chapters[index].offsetHeight), 0, .999) };
}

function capturePosition(url = location.href) {
  const reader = reading ? readerPosition() : null;
  return {
    version: 1,
    entryId: positionEntryId,
    href: new URL(url, location.href).href,
    savedAt: Date.now(),
    route: `${location.pathname}${location.search}`,
    // Native scrolling can precede Lenis's next frame, including an immediate reload.
    q: reader ? reader.index + reader.offset : clamp(scrollY / step, 0, 9.999),
    reading,
    reader
  };
}

function normalizePosition(saved) {
  if (saved?.version !== 1 || !Number.isFinite(saved.q) || saved.route !== `${location.pathname}${location.search}`) return null;
  return {
    ...saved,
    q: clamp(saved.q, 0, 9.999),
    reading: saved.reading === true,
    reader: saved.reader && Number.isInteger(saved.reader.index) && Number.isFinite(saved.reader.offset)
      ? { index: clamp(saved.reader.index, 0, 9), offset: clamp(saved.reader.offset, 0, .999) }
      : { index: Math.floor(clamp(saved.q, 0, 9.999)), offset: clamp(saved.q % 1, 0, .999) }
  };
}

function savedPosition(reloading = false) {
  const saved = normalizePosition(history.state?.[historyKey]);
  if (!saved || !reloading || typeof saved.entryId !== 'string') return saved;
  // Reload may snapshot history before pagehide. Its synchronous session handoff
  // holds the final native position, scoped to this history entry and exact URL.
  try {
    const latest = normalizePosition(JSON.parse(sessionStorage.getItem(positionStoragePrefix + saved.entryId)));
    if (latest?.entryId === saved.entryId && latest.href === location.href && latest.savedAt >= (saved.savedAt || 0)) return latest;
  } catch { /* History remains available if session storage is restricted. */ }
  return saved;
}

function persistPosition(url = location.href) {
  const snapshot = capturePosition(url);
  // This page owns one namespaced field, leaving host/router fields and the URL intact.
  try { history.replaceState({ ...(history.state || {}), [historyKey]: snapshot }, '', url); }
  catch { /* A restricted history API must not interrupt reading or scrolling. */ }
  try { sessionStorage.setItem(positionStoragePrefix + positionEntryId, JSON.stringify(snapshot)); }
  catch { /* History alone still provides periodic restoration without storage. */ }
  lastPersistedPosition = snapshot;
  return snapshot;
}

function persistOnClock(seconds) {
  if (seconds - lastPersistenceCheck < .5) return;
  lastPersistenceCheck = seconds;
  const position = capturePosition();
  if (!lastPersistedPosition || position.reading !== lastPersistedPosition.reading ||
      Math.abs(position.q - lastPersistedPosition.q) > .00001 || position.href !== lastPersistedPosition.href) persistPosition();
}

function readerTarget(reader) {
  return chapters[reader.index].offsetTop + reader.offset * chapters[reader.index].offsetHeight;
}

function setReadingMode(value) {
  reading = value;
  html.classList.toggle('reading', reading);
  readingButton.textContent = reading ? 'Return to the film' : 'Read the narrative';
  if (reading) {
    for (const copy of copies) { copy.inert = false; copy.removeAttribute('aria-hidden'); }
  }
  if (lenis) lenis.options.smoothWheel = !reading && !reduced;
  lastDraw = -1;
}

function restorePosition(snapshot, resizeLayout = true) {
  setReadingMode(snapshot.reading);
  if (resizeLayout) resize(true);
  lenis.resize();
  lenis.scrollTo(reading ? readerTarget(snapshot.reader) : snapshot.q * step, { immediate: true, force: true });
  if (reading) lastReaderPosition = readerPosition();
  lastDraw = -1;
}

function resize(initial = false) {
  const oldQ = initial ? clamp(scrollY / step, 0, 9.999) : chapterQ();
  const oldReader = reading ? lastReaderPosition : null;
  const nw = innerWidth, nh = innerHeight;
  const meaningfulChange = initial || Math.abs(width - nw) > 2 || Math.abs(height - nh) > 125;
  width = nw; height = nh;
  // A phone browser's collapsing address bar must not continuously rewrite scroll distances.
  if (meaningfulChange) step = Math.max(510, height) * (width <= 800 ? 1.3 : 1.5);
  html.style.setProperty('--vh', `${height}px`);
  html.style.setProperty('--chapter-height', `${step}px`);
  const dpr = Math.min(devicePixelRatio || 1, width <= 800 ? 1.55 : 1.75, Math.sqrt(4400000 / (width * height)));
  renderer?.resize(width, height, width <= 800, dpr);
  lenis?.resize();
  if (!initial && meaningfulChange) {
    const target = reading ? oldReader && readerTarget(oldReader) : oldQ * step;
    if (target !== null) lenis?.scrollTo(target, { immediate: true, force: true });
  }
  resizePending = false; lastDraw = -1;
}

function setCopyState(node, amount, offset) {
  const visible = amount > .005;
  node.classList.toggle('is-visible', visible);
  node.classList.toggle('is-interactive', amount > .7);
  node.style.opacity = `${amount}`;
  node.style.transform = reduced || node.classList.contains('trace-copy') ? 'none' : `translate3d(0,${offset}px,0)`;
  node.setAttribute('aria-hidden', visible ? 'false' : 'true');
  node.inert = !visible;
}

function updateChapterIdentity(index, world) {
  if (index !== lastIndex) {
    lastIndex = index;
    positionNumber.textContent = String(index + 1).padStart(2, '0');
    positionName.textContent = CHAPTERS[index].name;
    for (let i = 0; i < CHAPTERS.length; i++) {
      for (const link of [tickLinks[i], menuLinks[i]]) {
        if (i === index) link.setAttribute('aria-current', 'step'); else link.removeAttribute('aria-current');
      }
    }
  }
  if (world !== lastWorld) {
    lastWorld = world; body.dataset.world = world;
    themeMeta.content = world === 'paper' ? '#f1ebdf' : '#080a0d';
  }
}

function updateReaderUI() {
  lastReaderPosition = readerPosition();
  const index = lastReaderPosition.index;
  updateChapterIdentity(index, chapters[index].classList.contains('chapter--paper') ? 'paper' : 'metal');
}

function updateUI(q) {
  const current = Math.min(9, Math.floor(q));
  const local = q - current;
  const index = reduced ? current : Math.min(9, current + (local > .84 ? 1 : 0));
  const world = (reduced ? current >= 6 : q >= 5.82) ? 'paper' : 'metal';
  updateChapterIdentity(index, world);
  const inJourney = smoothstep(.20, .72, q);
  statement.style.opacity = `${1 - inJourney}`;
  position.style.opacity = `${inJourney}`;
  const ticksVisible = width <= 800 ? 1 : inJourney;
  ticks.style.opacity = `${ticksVisible}`;
  ticks.style.visibility = ticksVisible > .01 ? 'visible' : 'hidden';
  enterCue.style.opacity = `${1 - inJourney}`;
  enterCue.style.visibility = inJourney < .99 ? 'visible' : 'hidden';
  enterCue.style.pointerEvents = inJourney < .5 ? 'auto' : 'none';
  for (let i = 0; i < copies.length; i++) {
    let alpha = 0, offset = 0;
    if (reduced) {
      alpha = i === current ? 1 : 0;
    } else if (i === current) {
      alpha = current === 9 ? 1 : current === 5 ? 1 - smoothstep(.52, .63, local) : 1 - smoothstep(.56, .79, local);
      offset = -smoothstep(.38, .82, local) * Math.min(36, height * .04);
    } else if (i === current + 1) {
      alpha = smoothstep(.78, 1, local);
      offset = (1 - alpha) * Math.min(36, height * .04);
    }
    setCopyState(copies[i], alpha, offset);
  }
}

function flushHeadingFocus() {
  if (!pendingHeadingFocus || menu.open || colophon.open || pendingHeadingFocus.closest('.chapter-copy')?.inert) return;
  pendingHeadingFocus.tabIndex = -1;
  pendingHeadingFocus.focus({ preventScroll: true });
  pendingHeadingFocus = null;
}

function frame(seconds) {
  if (!ready || disposed || document.hidden) return;
  const elapsed = previousTime ? Math.min(.05, Math.max(0, seconds - previousTime)) : 0;
  previousTime = seconds;
  if (resizePending) resize();
  // The only animation clock: Lenis first, then geometry and HTML for the same scroll position.
  lenis.raf(seconds * 1000);
  persistOnClock(seconds);
  if (reading) { updateReaderUI(); flushHeadingFocus(); return; }
  // Both dialogs are opaque. Their background is already composed and need not redraw.
  if (menu.open || colophon.open) { lastDraw = -1; return; }
  if (!reduced) liveTime += elapsed;
  pointer.x = lerp(pointer.x, targetPointer.x, .055);
  pointer.y = lerp(pointer.y, targetPointer.y, .055);
  const q = chapterQ();
  const changed = Math.abs(q - lastQ) > .00001;
  if ((reduced || q >= 9.72) && !changed && lastDraw >= 0) return;
  if (width <= 800 && seconds - lastDraw < 1 / 60 && !changed) return;
  renderer.render({ q, time: liveTime, pointer, reduced });
  updateUI(q); lastQ = q; lastDraw = seconds;
  flushHeadingFocus();
}

function jumpTo(id, { immediate = false, focus = false } = {}) {
  const index = CHAPTERS.findIndex(c => c.id === id);
  if (index < 0) return;
  pendingHeadingFocus = null;
  closeDialogs(false);
  const target = reading ? chapters[index].offsetTop : step * (index + (index === 0 ? 0 : index === 9 ? .78 : .22));
  persistPosition(`#${id}`);
  lenis.scrollTo(target, {
    immediate: immediate || reduced || reading,
    duration: .92,
    lerp: undefined,
    force: true,
    onComplete: () => {
      if (focus) pendingHeadingFocus = chapters[index].querySelector('h1,h2');
      lastDraw = -1;
      persistPosition();
    }
  });
}

function openDialog(dialog, source) {
  if (!ready || disposed || document.hidden) return;
  pendingHeadingFocus = null;
  const existing = menu.open ? menu : colophon.open ? colophon : null;
  if (existing) existing.close(); else returnFocus = source || document.activeElement;
  lenis.stop(); dialog.showModal(); dialog.scrollTop = 0;
  lastDraw = -1;
  dialog.querySelector('.close-dialog').focus({ preventScroll: true });
  menuButton.setAttribute('aria-expanded', menu.open ? 'true' : 'false');
}

function closeDialogs(restoreFocus = true) {
  if (menu.open) menu.close(); if (colophon.open) colophon.close();
  if (!disposed && !document.hidden) lenis?.start();
  menuButton.setAttribute('aria-expanded', 'false');
  if (restoreFocus && returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  returnFocus = null;
  lastDraw = -1;
}

function toggleReading() {
  const priorIndex = reading ? readerPosition().index : Math.max(0, lastIndex);
  closeDialogs(false);
  setReadingMode(!reading);
  if (!reading) resize(true);
  lenis.resize();
  lenis.scrollTo(reading ? chapters[priorIndex].offsetTop : priorIndex * step + step * (priorIndex === 9 ? .78 : .24), { immediate: true, force: true });
  if (reading) updateReaderUI();
  persistPosition();
  lastDraw = -1;
}

function attachEvents() {
  window.addEventListener('resize', () => { resizePending = true; }, { ...events, passive: true });
  window.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { targetPointer.x = e.clientX / innerWidth * 2 - 1; targetPointer.y = e.clientY / innerHeight * 2 - 1; } }, { ...events, passive: true });
  document.addEventListener('pointerleave', () => { targetPointer.x = targetPointer.y = 0; }, events);
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const id = link.getAttribute('href').slice(1);
    if (!CHAPTERS.some(chapter => chapter.id === id)) return;
    e.preventDefault(); jumpTo(id, { focus: e.detail === 0 });
  }, events);
  menuButton.addEventListener('click', () => openDialog(menu, menuButton), events);
  for (const button of document.querySelectorAll('.colophon-toggle')) button.addEventListener('click', () => openDialog(colophon, button), events);
  for (const dialog of [menu, colophon]) {
    dialog.querySelector('.close-dialog').addEventListener('click', () => closeDialogs(), events);
    dialog.addEventListener('cancel', e => { e.preventDefault(); closeDialogs(); }, events);
  }
  readingButton.addEventListener('click', toggleReading, events);
  reducedQuery.addEventListener('change', e => {
    reduced = e.matches;
    lenis.options.smoothWheel = !reading && !reduced;
    lenis.stop();
    if (!document.hidden && !menu.open && !colophon.open) lenis.start();
    targetPointer.x = targetPointer.y = pointer.x = pointer.y = 0;
    lastDraw = -1;
  }, events);
  document.addEventListener('visibilitychange', () => {
    previousTime = 0;
    if (document.hidden) {
      suspendedPosition = persistPosition();
      lenis.stop(); stopClock();
    }
    else {
      if (suspendedPosition) restorePosition(suspendedPosition);
      else if (resizePending) resize();
      suspendedPosition = null;
      if (!menu.open && !colophon.open) lenis.start();
      startClock(); lastDraw = -1;
    }
  }, events);
  window.addEventListener('pageshow', e => {
    if (!e.persisted) return;
    const snapshot = suspendedPosition || savedPosition();
    if (snapshot) restorePosition(snapshot);
    previousTime = 0; suspendedPosition = null;
    if (!menu.open && !colophon.open && !document.hidden) lenis.start();
    startClock(); lastDraw = -1;
  }, events);
  window.addEventListener('hashchange', () => { jumpTo(location.hash.slice(1), { immediate: true }); }, events);
}

function startClock() {
  if (clockAttached || !ready || disposed || document.hidden) return;
  gsap.ticker.add(frame); clockAttached = true;
}

function stopClock() {
  if (!clockAttached) return;
  gsap.ticker.remove(frame); clockAttached = false;
}

function dispose() {
  if (disposed) return;
  disposed = true; ready = false;
  stopClock(); lifecycle.abort();
  lenis?.destroy(); renderer?.dispose();
  if ('scrollRestoration' in history) history.scrollRestoration = originalScrollRestoration;
}

// Attach before asynchronous readiness so terminal navigation also cancels a late boot.
window.addEventListener('pagehide', event => {
  suspendedPosition = persistPosition();
  if (!event.persisted) { dispose(); return; }
  lenis?.stop(); stopClock(); previousTime = 0;
}, events);
if (import.meta.hot) import.meta.hot.dispose(dispose);

async function boot() {
  if (location.protocol === 'file:') return;
  const navigation = performance.getEntriesByType('navigation')[0];
  const restore = navigation?.type === 'reload' || navigation?.type === 'back_forward' ? savedPosition(navigation.type === 'reload') : null;
  positionEntryId = restore?.entryId || window.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  // Native pixel restoration runs against the temporary fallback layout. Restore
  // our semantic position only after the final chapter dimensions are established.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const images = await loadImages();
  await document.fonts.ready;
  if (disposed) return;
  renderer = new MaterialRenderer(canvas, images);
  if (restore?.reading) setReadingMode(true);
  html.classList.add('enhanced');
  resize(true);
  lenis = new Lenis({
    autoRaf: false, autoResize: false, lerp: .105,
    smoothWheel: !reading && !reduced, syncTouch: false, overscroll: false,
    respectReducedMotion: true, anchors: false,
    prevent: node => Boolean(node.closest?.('dialog')),
    virtualScroll: ({ deltaY, event }) => {
      if (event.type === 'wheel' && !event.ctrlKey && !reduced && !reading &&
          !document.hidden && !menu.open && !colophon.open && !lenis.isStopped &&
          deltaY * (lenis.targetScroll - lenis.actualScroll) < 0) {
        lenis.stop(); lenis.start();
      }
    }
  });
  lenis.resize();
  attachEvents();
  ready = true;
  if (restore) restorePosition(restore, false);
  else if (location.hash) jumpTo(location.hash.slice(1), { immediate: true });
  gsap.ticker.lagSmoothing(0);
  if (reading) updateReaderUI();
  else if (!document.hidden) { renderer.render({ q: chapterQ(), time: 0, pointer, reduced }); updateUI(chapterQ()); }
  if (document.hidden) lenis.stop();
  startClock();
  persistPosition();
  html.dataset.ready = 'true';
}

boot().catch(error => {
  if (disposed) return;
  // Progressive fallback is complete content, never an empty loading screen.
  ready = false;
  stopClock();
  lenis?.destroy();
  renderer?.dispose();
  if ('scrollRestoration' in history) history.scrollRestoration = originalScrollRestoration;
  html.classList.remove('enhanced');
  for (const copy of copies) {
    copy.inert = false; copy.removeAttribute('aria-hidden');
    copy.style.removeProperty('opacity'); copy.style.removeProperty('transform');
  }
  console.error('NIB could not initialize its material film.', error);
});
