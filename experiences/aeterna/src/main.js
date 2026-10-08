import './styles.css';
import 'lenis/dist/lenis.css';
import Lenis from 'lenis';
import { createScrollTimeline, chapterIds, chapterNames, clamp, smooth } from './scroll.js';
import { installNotes } from './notes.js';

document.documentElement.classList.add('js');
const root = document.documentElement;
try { history.scrollRestoration = 'manual'; } catch { /* Chapter progress remains the restoration source. */ }
const rooms = [...document.querySelectorAll('.room')];
const rail = [...document.querySelectorAll('.chapter-rail a')];
const indexLinks = [...document.querySelectorAll('.index-list a')];
const indexDialog = document.querySelector('#index-dialog');
const nextButton = document.querySelector('#next-room');
const motionButton = document.querySelector('#motion-toggle');
const assembly = document.querySelector('#assembly');
const relief = document.querySelector('#relief-depth');
const fracture = document.querySelector('#fracture');
const lightInput = document.querySelector('#museum-light');
const castButton = document.querySelector('#inspect-cast');
const notes = installNotes();
const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
const manual = { body: null, relief: null, fracture: null };
let motionOverride = null;
try {
  const stored = localStorage.getItem('aeterna-reduced-motion');
  if (stored === 'true' || stored === 'false') motionOverride = stored === 'true';
} catch { /* A restricted storage policy still permits the full exhibition. */ }
let reducedMotion = motionOverride ?? preference.matches;
let wheelDirection = 0;
const lenis = new Lenis({
  lerp: .105, smoothWheel: !reducedMotion, syncTouch: false,
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
const timeline = createScrollTimeline(lenis);
let scrollClock = 0;
let archiveInspect = false;
let portraitOverride = null;
let portraitSelected = -1;
let light = .5;
let currentIndex = -1;
let currentFrame = null;
let frameRequest = 0;
let saveTimeout = 0;
let entryTimeout = 0;
let resizePending = false;
let pointerX = 0, pointerY = 0, desiredPointerX = 0, desiredPointerY = 0;
let stage = null, stagePromise = null, canvas = null;
let geometryReady = { body: false, relief: false };
let geometryError = false;
let contextLost = false;
let previousFrameTime = 0;
let spatialLayoutKey = '';

function setMotionFlags() {
  lenis.options.smoothWheel = !reducedMotion;
  lenis.scrollTo(scrollY, { immediate: true, force: true });
  root.classList.toggle('reduce-motion', reducedMotion);
  root.classList.toggle('motion-overridden', motionOverride !== null);
  motionButton.setAttribute('aria-pressed', String(reducedMotion));
}
setMotionFlags();
timeline.measure(reducedMotion);

function savedState() {
  const frame = timeline.snapshot();
  return {
    index: frame.index, progress: frame.progress, archiveInspect, light,
    manual: { ...manual }, portraitOverride,
  };
}
function persistPosition() {
  const saved = savedState();
  try {
    history.replaceState({ ...history.state, aeterna: saved }, '', '#' + chapterIds[saved.index]);
  } catch { /* Browsing policies do not affect navigation. */ }
}
function scheduleSave() {
  clearTimeout(saveTimeout);
  saveTimeout = window.setTimeout(persistPosition, 170);
}
function requestRender() {
  if (!frameRequest && !document.hidden) frameRequest = requestAnimationFrame(render);
}
function updateGeometryUI() {
  const hasBody = geometryReady.body && !contextLost;
  rooms[3].classList.toggle('has-geometry', hasBody);
  rooms[5].classList.toggle('has-geometry', geometryReady.relief && !contextLost);
  rooms[6].classList.toggle('has-geometry', hasBody);
  rooms[7].classList.toggle('has-geometry', hasBody);
  assembly.disabled = !hasBody;
  fracture.disabled = !hasBody;
  relief.disabled = !geometryReady.relief || contextLost;
  castButton.disabled = !hasBody && !archiveInspect;
  lightInput.disabled = !hasBody;
  spatialLayoutKey = '';
  requestRender();
}
function handleGeometryError(error) {
  contextLost = error.type === 'context-lost';
  geometryError = error.type !== 'context-lost';
  document.querySelectorAll('[data-spatial-status]').forEach((element) => {
    element.textContent = contextLost
      ? 'Restoring the sculpture'
      : 'Still gallery view · interactive sculpture unavailable';
  });
  if (geometryError) {
    if (error.scene === 'body') geometryReady.body = false;
    else if (error.scene === 'relief') geometryReady.relief = false;
    else geometryReady = { body: false, relief: false };
  }
  updateGeometryUI();
}
async function startSpatial() {
  if (stagePromise) return stagePromise;
  stagePromise = (async () => {
    try {
      canvas = document.createElement('canvas');
      canvas.id = 'sculpture-canvas';
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', 'A museum sculpture, illuminated in three dimensions. Use the exhibit controls to change its state.');
      document.querySelector('[data-spatial="body"]').append(canvas);
      const { createSpatialStage } = await import('./spatial/index.js');
      stage = await createSpatialStage(canvas, {
        onError: handleGeometryError,
        onAssetReady(info) {
          if (info.scene === 'body') geometryReady.body = true;
          if (info.scene === 'relief') geometryReady.relief = true;
          updateGeometryUI();
        },
        onReady(info) {
          geometryReady = { body: Boolean(info.assets?.body), relief: Boolean(info.assets?.relief) };
          contextLost = Boolean(info.contextLost);
          canvas.dataset.ready = String(info.ready);
          updateGeometryUI();
        },
      });
      canvas.addEventListener('webglcontextrestored', () => {
        contextLost = false;
        updateGeometryUI();
      });
      updateGeometryUI();
      return stage;
    } catch (error) {
      handleGeometryError({ type: 'asset-load', message: error.message });
      return null;
    }
  })();
  return stagePromise;
}
function goTo(index, progress = .08, { push = true, smoothScroll = true } = {}) {
  if (indexDialog.open) indexDialog.close();
  if (document.querySelector('#notes-dialog').open) notes.close(document.querySelector('#notes-dialog'));
  lenis.start();
  if (resizePending) {
    timeline.measure(reducedMotion);
    resizePending = false;
    spatialLayoutKey = '';
  }
  const target = Math.round(clamp(index, 0, 8));
  if (push) {
    try {
      history.pushState({ aeterna: { ...savedState(), index: target, progress } }, '', '#' + chapterIds[target]);
    } catch { /* Native scrolling remains available. */ }
  }
  timeline.goTo(target, target === 0 ? 0 : progress, smoothScroll && !reducedMotion ? 'smooth' : 'auto');
  if ([3, 5, 6, 7].includes(target)) startSpatial();
  requestRender();
}
function openIndex() {
  lenis.stop();
  indexDialog.showModal();
  const active = indexLinks[currentFrame?.index ?? 0];
  active.focus({ preventScroll: true });
}
document.querySelector('#open-index').addEventListener('click', openIndex);
document.querySelector('#mobile-index').addEventListener('click', openIndex);
for (const dialog of document.querySelectorAll('dialog')) dialog.addEventListener('toggle', () => {
  if (document.querySelector('dialog[open]')) lenis.stop();
  else lenis.start();
  requestRender();
});
lenis.on('virtual-scroll', requestRender);
nextButton.addEventListener('click', () => {
  goTo(currentIndex >= 8 ? 0 : currentIndex + 1, .08);
});
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  const id = anchor.getAttribute('href').slice(1);
  const i = chapterIds.indexOf(id);
  if (i < 0) return;
  anchor.addEventListener('click', (event) => {
    event.preventDefault();
    goTo(i, i === 0 ? 0 : .08);
  });
});
motionButton.addEventListener('click', () => {
  const at = timeline.snapshot();
  motionOverride = !reducedMotion;
  reducedMotion = motionOverride;
  try { localStorage.setItem('aeterna-reduced-motion', String(reducedMotion)); } catch { /* Optional preference storage. */ }
  setMotionFlags();
  timeline.measure(reducedMotion);
  timeline.goTo(at.index, at.progress, 'auto');
  desiredPointerX = desiredPointerY = pointerX = pointerY = 0;
  requestRender();
  scheduleSave();
});
preference.addEventListener('change', () => {
  if (motionOverride !== null) return;
  const at = timeline.snapshot();
  reducedMotion = preference.matches;
  setMotionFlags();
  timeline.measure(reducedMotion);
  timeline.goTo(at.index, at.progress, 'auto');
  requestRender();
});

document.querySelector('#inspect-marble').addEventListener('click', (event) => {
  const button = event.currentTarget;
  const zoomed = button.getAttribute('aria-pressed') !== 'true';
  button.setAttribute('aria-pressed', String(zoomed));
  button.setAttribute('aria-label', zoomed ? 'Return to the full marble study' : 'Look closer at the marble');
  button.querySelector('span').textContent = zoomed ? 'Return to surface' : 'Look closer';
  rooms[1].style.setProperty('--macro-zoom', zoomed ? 1 : 0);
});
function selectPortrait(value) {
  const selected = value >= .5 ? 1 : 0;
  if (portraitSelected === selected) return;
  portraitSelected = selected;
  rooms[2].style.setProperty('--portrait-reveal', selected ? '100%' : '0%');
  document.querySelectorAll('[data-portrait]').forEach((button) => {
    button.setAttribute('aria-pressed', String(Number(button.dataset.portrait) === selected));
  });
  document.querySelector('#portrait-description').textContent = selected
    ? 'Youth could become a promise of permanence. Imperial portraits joined recognizable features to an image of ageless authority.'
    : 'A lined face could make experience visible. Wrinkles and age became an image of public character.';
  document.querySelector('#portrait-era').textContent = selected
    ? 'The language of permanence'
    : 'The language of experience';
}
document.querySelectorAll('[data-portrait]').forEach((button) => button.addEventListener('click', () => {
  portraitOverride = Number(button.dataset.portrait);
  selectPortrait(portraitOverride);
  requestRender();
  scheduleSave();
}));
const controls = { body: assembly, relief, fracture };
for (const [name, input] of Object.entries(controls)) {
  input.addEventListener('input', () => {
    manual[name] = Number(input.value) / 100;
    document.querySelector('[data-follow="' + name + '"]').hidden = false;
    requestRender();
    scheduleSave();
  });
}
document.querySelectorAll('[data-follow]').forEach((button) => button.addEventListener('click', () => {
  manual[button.dataset.follow] = null;
  button.hidden = true;
  requestRender();
  scheduleSave();
}));
lightInput.addEventListener('input', () => {
  light = Number(lightInput.value) / 100;
  document.querySelector('#light-value').textContent = Math.round(light * 100) + '%';
  requestRender();
  scheduleSave();
});
function setArchiveInspection(inspect) {
  archiveInspect = inspect;
  rooms[7].classList.toggle('is-inspecting', inspect);
  document.querySelector('.archive-record').hidden = !inspect;
  castButton.setAttribute('aria-pressed', String(inspect));
  castButton.firstChild.textContent = inspect ? 'Return to the gallery' : 'Inspect the cast';
  document.querySelector('.afterlife-caption').textContent = inspect
    ? 'SMK plaster cast · artistic lighting study'
    : 'An imagined conservation gallery';
  updateGeometryUI();
  requestRender();
}
castButton.addEventListener('click', () => {
  setArchiveInspection(!archiveInspect);
  scheduleSave();
});

function onPointerMove(event) {
  if (event.target instanceof Element && event.target.closest('button, input, dialog, a')) return;
  if (event.pointerType === 'touch' && event.buttons === 0) return;
  desiredPointerX = clamp(event.clientX / Math.max(1, window.innerWidth) * 2 - 1, -1, 1);
  desiredPointerY = clamp(event.clientY / Math.max(1, window.innerHeight) * 2 - 1, -1, 1);
  requestRender();
}
window.addEventListener('pointermove', onPointerMove, { passive: true });
window.addEventListener('pointerleave', () => {
  desiredPointerX = desiredPointerY = 0;
  requestRender();
}, { passive: true });

/** Rooms are visibility:hidden until they are current, so the browser is free
 *  to drop their decoded art. Re-decode on demand (and ahead of time for the
 *  neighbouring rooms) so a reveal never shows the room's black background. */
function warmRoomArt(index) {
  const room = rooms[index];
  if (!room) return;
  room.querySelectorAll('.room-art img').forEach((img) => {
    if (img.complete && img.naturalWidth) img.decode?.().catch(() => {});
  });
}
function changeChapter(index) {
  const former = currentIndex;
  clearTimeout(entryTimeout);
  rooms.forEach((room, i) => {
    const active = i === index;
    room.classList.toggle('is-active', active);
    room.classList.remove('is-previous', 'is-entering');
    room.setAttribute('aria-hidden', String(!active));
    room.inert = !active;
  });
  if (former >= 0 && !reducedMotion) {
    rooms[former].classList.add('is-previous');
    rooms[index].classList.add('is-entering');
    entryTimeout = window.setTimeout(() => {
      rooms[former].classList.remove('is-previous');
      rooms[index].classList.remove('is-entering');
    }, 1000);
  }
  // Keep the rooms either side decoded: an undecoded room-art image paints as
  // the room's black background for a frame or two on reveal.
  warmRoomArt(index - 1);
  warmRoomArt(index + 1);
  currentIndex = index;
  document.body.dataset.chapter = String(index);
  rail.forEach((a, i) => i === index ? a.setAttribute('aria-current', 'step') : a.removeAttribute('aria-current'));
  indexLinks.forEach((a, i) => i === index ? a.setAttribute('aria-current', 'step') : a.removeAttribute('aria-current'));
  document.querySelector('#room-number').textContent = String(index + 1).padStart(2, '0') + ' / 09';
  document.querySelector('#room-name').textContent = chapterNames[index];
  document.querySelector('#room-announcement').textContent = 'Room ' + (index + 1) + ' of 9. ' + chapterNames[index] + '.';
  nextButton.querySelector('span').textContent = index === 0 ? 'Scroll to enter' : index === 8 ? 'Begin again' : 'Next room';
  nextButton.setAttribute('aria-label', index === 8 ? 'Begin the exhibition again' : 'Continue to ' + chapterNames[index + 1]);
  const sceneName = { 3: 'body', 5: 'relief', 6: 'fracture', 7: 'afterlife' }[index];
  if (sceneName && canvas) {
    rooms[index].querySelector('.spatial-host').append(canvas);
    canvas.dataset.scene = sceneName;
  }
  if (sceneName) startSpatial();
}

/** On a phone, the canvas occupies the real gap between copy and controls. */
function layoutSpatialHost(host, index) {
  const compact = window.innerWidth <= 700 || (window.innerWidth <= 900 && window.innerHeight >= window.innerWidth);
  const key = [window.innerWidth, window.innerHeight, index, archiveInspect,
    manual.body !== null, manual.relief !== null, manual.fracture !== null, compact].join(':');
  if (spatialLayoutKey === key) return compact;
  spatialLayoutKey = key;
  if (!compact) {
    host.style.removeProperty('top');
    host.style.removeProperty('bottom');
    return false;
  }
  const room = rooms[index];
  let contentBottom = room.querySelector('h2').getBoundingClientRect().bottom;
  if (index === 5) {
    const description = room.querySelector('.body-copy');
    if (description.checkVisibility()) contentBottom = Math.max(contentBottom, description.getBoundingClientRect().bottom);
  }
  const lower = room.querySelector(index === 7 ? '.archive-record' : '.exhibit-control');
  const lowerTop = lower?.checkVisibility() ? lower.getBoundingClientRect().top : window.innerHeight * .73;
  const gap = window.innerHeight < 700 ? 12 : 16;
  host.style.top = Math.round(contentBottom + gap) + 'px';
  host.style.bottom = Math.max(0, Math.round(window.innerHeight - lowerTop + gap)) + 'px';
  return true;
}
function render(time) {
  frameRequest = 0;
  if (document.hidden) return;
  if (resizePending) {
    const observed = timeline.snapshot();
    // A scroll or jump arriving during resize takes precedence over the old frame.
    const before = currentFrame && Math.abs(observed.y - currentFrame.y) < 2 ? currentFrame : observed;
    timeline.measure(reducedMotion);
    timeline.goTo(before.index, before.progress, 'auto');
    spatialLayoutKey = '';
    resizePending = false;
  }
  const step = Math.min(64, time - (previousFrameTime || time - 16));
  previousFrameTime = time;
  scrollClock += Math.min(step, 50);
  lenis.raf(scrollClock);
  const frame = timeline.snapshot();
  currentFrame = frame;
  if (currentIndex !== frame.index) changeChapter(frame.index);
  const damping = 1 - Math.exp(-step / 135);
  pointerX += (desiredPointerX - pointerX) * damping;
  pointerY += (desiredPointerY - pointerY) * damping;
  const movingPointer = Math.abs(pointerX - desiredPointerX) + Math.abs(pointerY - desiredPointerY) > .001;
  const p = reducedMotion ? .45 : frame.progress;
  root.style.setProperty('--p', p.toFixed(5));
  root.style.setProperty('--px', (reducedMotion ? 0 : pointerX).toFixed(4));
  root.style.setProperty('--py', (reducedMotion ? 0 : pointerY).toFixed(4));
  root.style.setProperty('--overall', frame.overall.toFixed(5));

  const assembled = manual.body ?? (reducedMotion ? 1 : smooth(.04, .73, frame.progress));
  const reliefProgress = manual.relief ?? (reducedMotion ? .65 : frame.progress);
  const broken = manual.fracture ?? (reducedMotion ? .55 : smooth(.08, .85, frame.progress));
  if (frame.index === 2) selectPortrait(portraitOverride ?? (frame.progress > .47 ? 1 : 0));
  if (frame.index === 3) {
    assembly.value = Math.round(assembled * 100);
    document.querySelector('#assembly-value').textContent = assembly.value + '%';
  }
  let reliefReveal = 0;
  if (frame.index === 5) {
    reliefReveal = geometryReady.relief && !contextLost ? smooth(.08, .34, reliefProgress) : 0;
    rooms[5].style.setProperty('--relief-reveal', reliefReveal.toFixed(4));
    rooms[5].style.setProperty('--relief-text', reliefReveal > .55 ? '#242521' : '#ede7dc');
    rooms[5].style.setProperty('--relief-muted', reliefReveal > .55 ? '#57574c' : '#cec5b6');
    relief.value = Math.round(reliefProgress * 100);
    document.querySelector('#relief-value').textContent = reliefProgress < .3 ? 'Surface' : reliefProgress > .75 ? 'Space' : 'Depth';
  }
  if (frame.index === 6) {
    fracture.value = Math.round(broken * 100);
    document.querySelector('#fracture-value').textContent = fracture.value + '%';
    const plate = geometryReady.body && !contextLost ? smooth(.72, .98, broken) : 1;
    rooms[6].style.setProperty('--fracture-reveal', plate.toFixed(4));
  }
  document.body.dataset.theme = frame.index === 7 || (frame.index === 5 && reliefReveal > .55) ? 'light' : 'dark';

  if (stage && canvas) {
    let scene = { 3: 'body', 5: 'relief', 6: 'fracture', 7: 'afterlife' }[frame.index] || 'none';
    if (scene === 'afterlife' && !archiveInspect) scene = 'none';
    if (scene !== 'none') {
      const host = rooms[frame.index].querySelector('.spatial-host');
      if (canvas.parentElement !== host) host.append(canvas);
      const fitToViewport = layoutSpatialHost(host, frame.index);
      const bounds = host.getBoundingClientRect();
      let explosion;
      if (scene === 'body') explosion = 1 - assembled;
      if (scene === 'fracture') explosion = broken;
      if (scene === 'afterlife') explosion = 0;
      stage.update({
        scene, progress: scene === 'relief' ? reliefProgress : frame.progress,
        pointerX, pointerY, reducedMotion, light: scene === 'afterlife' ? light : .16,
        manualProgress: scene === 'relief' && manual.relief !== null,
        fitToViewport,
        explosion, width: bounds.width, height: bounds.height, visible: true,
      });
      canvas.dataset.scene = scene;
      canvas.dataset.explosion = explosion === undefined ? '' : explosion.toFixed(4);
    } else {
      stage.update({ scene: 'none', visible: false });
    }
  }
  if ((movingPointer && !reducedMotion) || lenis.isScrolling === 'smooth') requestRender();
  else previousFrameTime = 0;
}
window.addEventListener('scroll', () => { requestRender(); scheduleSave(); }, { passive: true });
window.addEventListener('resize', () => { resizePending = true; requestRender(); }, { passive: true });
window.addEventListener('orientationchange', () => { resizePending = true; requestRender(); }, { passive: true });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    lenis.scrollTo(scrollY, { immediate: true, force: true });
    cancelAnimationFrame(frameRequest);
    frameRequest = 0;
    persistPosition();
  } else {
    previousFrameTime = 0;
    requestRender();
  }
});
window.addEventListener('pagehide', persistPosition);
window.addEventListener('pagehide', event => {
  lenis.scrollTo(scrollY, { immediate: true, force: true });
  cancelAnimationFrame(frameRequest);
  frameRequest = 0;
  if (!event.persisted) lenis.destroy();
});
window.addEventListener('pageshow', requestRender);
window.addEventListener('popstate', (event) => {
  const state = event.state?.aeterna;
  const id = chapterIds.indexOf(location.hash.slice(1));
  if (state && state.index === id) timeline.goTo(id, clamp(state.progress), 'auto');
  else if (id >= 0) timeline.goTo(id, id === 0 ? 0 : .08, 'auto');
  requestRender();
});
window.addEventListener('hashchange', () => {
  const id = chapterIds.indexOf(location.hash.slice(1));
  if (id >= 0 && id !== timeline.snapshot().index) timeline.goTo(id, id === 0 ? 0 : .08, 'auto');
  requestRender();
});

const initial = history.state?.aeterna;
const hashIndex = chapterIds.indexOf(location.hash.slice(1));
if (initial && initial.index === hashIndex) {
  for (const key of Object.keys(manual)) {
    manual[key] = typeof initial.manual?.[key] === 'number' ? clamp(initial.manual[key]) : null;
    document.querySelector('[data-follow="' + key + '"]').hidden = manual[key] === null;
  }
  light = typeof initial.light === 'number' ? clamp(initial.light) : .5;
  lightInput.value = Math.round(light * 100);
  document.querySelector('#light-value').textContent = lightInput.value + '%';
  portraitOverride = initial.portraitOverride === 0 || initial.portraitOverride === 1 ? initial.portraitOverride : null;
  setArchiveInspection(Boolean(initial.archiveInspect));
  timeline.goTo(hashIndex, clamp(initial.progress), 'auto');
} else if (hashIndex >= 0) {
  timeline.goTo(hashIndex, hashIndex === 0 ? 0 : .08, 'auto');
}
requestRender();
if ('requestIdleCallback' in window) window.requestIdleCallback(startSpatial, { timeout: 1800 });
else window.setTimeout(startSpatial, 1000);
// Warm every room's art once the page is idle so the first visit to any room
// (including a jump from the index) reveals an already-decoded image.
const warmAllRoomArt = () => rooms.forEach((_, i) => warmRoomArt(i));
if ('requestIdleCallback' in window) window.requestIdleCallback(warmAllRoomArt, { timeout: 2400 });
else window.setTimeout(warmAllRoomArt, 1200);
document.fonts.ready.then(() => { spatialLayoutKey = ''; requestRender(); });
document.querySelectorAll('.room-art img').forEach((img) => {
  img.addEventListener('load', requestRender, { once: true });
  img.addEventListener('error', () => {
    img.style.visibility = 'hidden';
    const caption = img.closest('.room')?.querySelector('.art-caption');
    if (caption) caption.textContent = 'This image could not be loaded. The exhibition can still be explored.';
  }, { once: true });
});
