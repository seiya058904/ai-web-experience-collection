import './styles.css';
import 'lenis/dist/lenis.css';
import Lenis from 'lenis';
import { createScrollTimeline, chapterIds, chapterNames, clamp, smooth, settleScrollInput as settleLenis } from './scroll.js';
import { installNotes } from './notes.js';
import { roomComposition, roomReadingLight } from './handoff.js';

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
let resizePending = false;
let pointerX = 0, pointerY = 0, desiredPointerX = 0, desiredPointerY = 0;
let stage = null, stagePromise = null, canvas = null;
let geometryReady = { body: false, relief: false };
let geometryError = false;
let contextLost = false;
let previousFrameTime = 0;
let spatialLayoutKey = '';
const artReadiness = rooms.map(() => ({ ready: false, promise: null }));
const spatialStills = new Map();
const navigationSurfaces = [...document.querySelectorAll('.site-header,.exhibition-footer')];
const artPreparing = document.querySelector('#art-preparing');

function inkBetween(darkSurfaceInk, lightSurfaceInk, mix) {
  return `rgb(${darkSurfaceInk.map((value, i) => Math.round(value + (lightSurfaceInk[i] - value) * mix)).join(' ')})`;
}

function composeReadingLight(composition, content) {
  const compact = innerWidth <= 700 || (innerWidth <= 900 && innerHeight >= innerWidth);
  const from = roomReadingLight(composition.base, content.base.reliefReveal, compact);
  const to = composition.next === null ? from : roomReadingLight(composition.next, content.next.reliefReveal, compact);
  const blend = key => from[key] + (to[key] - from[key]) * composition.mix;
  root.style.setProperty('--header-scrim', blend('header').toFixed(5));
  root.style.setProperty('--footer-scrim', blend('footer').toFixed(5));
  const light = blend('light');
  // Persistent navigation must remain readable while dark and pale galleries
  // overlap. Interpolating white ink through grey to black made it disappear
  // against the intermediate grey wall. Select ink polarity from exposure;
  // only the tiny functional ink changes polarity, never a background plate.
  const onLight = light >= .48;
  const contrast = 4 * light * (1 - light);
  const foreground = onLight
    ? inkBetween([36, 37, 33], [8, 9, 7], contrast)
    : inkBetween([237, 231, 220], [255, 253, 246], contrast);
  const muted = onLight
    ? inkBetween([92, 91, 83], [24, 25, 21], contrast)
    : inkBetween([183, 176, 166], [243, 238, 224], contrast);
  for (const surface of navigationSurfaces) {
    surface.style.setProperty('--fg', foreground);
    surface.style.setProperty('--muted', muted);
    surface.style.setProperty('--rule', onLight ? 'rgba(36,37,33,.32)' : 'rgba(237,231,220,.30)');
  }
}

function markUnavailableImage(img, room, isMask = false) {
  if (isMask) {
    room.classList.add('mask-unavailable');
    return;
  }
  img.style.visibility = 'hidden';
  room.dataset.imageError = 'true';
  let status = room.querySelector('.image-status');
  if (!status) {
    status = document.createElement('p');
    status.className = 'image-status';
    status.setAttribute('role', 'status');
    room.append(status);
  }
  status.textContent = 'An image could not be loaded. The exhibition and its notes remain available.';
}

function settleScrollInput() {
  // scrollTo(current, { immediate:true }) can return early before cancelling a
  // not-yet-advanced programmatic jump in Lenis. Its public lifecycle resets
  // the pending animation, while an already open dialog stays stopped.
  settleLenis(lenis);
  previousFrameTime = 0;
}

function setMotionFlags() {
  lenis.options.smoothWheel = !reducedMotion;
  settleScrollInput();
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
  for (const index of [3, 5, 6, 7]) {
    rooms[index].classList.toggle('is-static-fallback', (geometryError || contextLost) && !rooms[index].classList.contains('has-geometry'));
  }
  assembly.disabled = !hasBody;
  fracture.disabled = !hasBody;
  relief.disabled = !geometryReady.relief || contextLost;
  castButton.disabled = !hasBody && !archiveInspect;
  lightInput.disabled = !hasBody;
  spatialLayoutKey = '';
  for (const still of spatialStills.values()) still.key = '';
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
  rooms[2].style.setProperty('--portrait-reveal', `${(clamp(value) * 100).toFixed(3)}%`);
  rooms[2].classList.toggle('portrait-manual', portraitOverride !== null);
  const selected = value >= .5 ? 1 : 0;
  if (portraitSelected === selected) return;
  portraitSelected = selected;
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

/** The promise covers loading as well as decode, including the hero mask.
 * Keep the current exhibit intact until a requested room can actually paint.
 * Failed assets settle into the existing labelled fallback, never a deadlock.
 */
function warmRoomArt(index) {
  const room = rooms[index];
  const readiness = artReadiness[index];
  if (!room || readiness.promise) return readiness?.promise;
  const images = [...room.querySelectorAll('.room-art img')];
  let mask = null;
  if (index === 0) {
    mask = new Image();
    mask.src = `${import.meta.env.BASE_URL}aeterna/assets/hero-cutout.webp`;
    images.push(mask);
  }
  readiness.promise = Promise.allSettled(images.map(img => {
    if (img.decode) return img.decode();
    if (img.complete) return Promise.resolve();
    return new Promise(resolve => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    });
  })).then(() => {
    // A cached failure can precede module execution, so an error listener alone
    // is insufficient. Inspect every settled image, including the CSS mask.
    for (const img of images) {
      if (!img.complete || img.naturalWidth === 0) markUnavailableImage(img, room, img === mask);
    }
    readiness.ready = true;
    room.dataset.artReady = 'true';
    requestRender();
  });
  return readiness.promise;
}
function changeChapter(index) {
  warmRoomArt(index);
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
  if (sceneName) startSpatial();
}

function composeRooms(frame) {
  const composition = roomComposition(frame.index, frame.progress, rooms.length, reducedMotion);
  if (composition.next !== null && !artReadiness[composition.next].ready) {
    warmRoomArt(composition.next);
    composition.next = null;
    composition.mix = 0;
    composition.baseText = 1;
  }
  rooms.forEach((room, index) => {
    const base = index === composition.base;
    const next = index === composition.next;
    room.classList.toggle('is-active', base);
    room.classList.toggle('is-previous', next);
    room.classList.toggle('is-entering', next);
    room.style.opacity = base ? '1' : next ? String(composition.mix) : '0';
    room.style.zIndex = next ? '2' : base ? '1' : '0';
    room.style.setProperty('--copy-alpha', String(base ? composition.baseText : next ? composition.nextText : 0));
    room.style.setProperty('--p', String(base ? composition.pose : 0));
    room.style.setProperty('--local-p', String(base ? frame.progress : 0));
    const copyAlpha = base ? composition.baseText : next ? composition.nextText : 0;
    const dominant = composition.mix > .55 ? next : base;
    const interactive = dominant && copyAlpha > .15;
    room.style.pointerEvents = interactive ? 'auto' : 'none';
    room.setAttribute('aria-hidden', String(!interactive));
    room.inert = !interactive;
  });
  return composition;
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

function updateRoomContent(index, p) {
  const assembled = manual.body ?? (reducedMotion ? 1 : smooth(.04, .73, p));
  const reliefProgress = manual.relief ?? (reducedMotion ? .65 : p);
  const broken = manual.fracture ?? (reducedMotion ? .55 : smooth(.08, .85, p));
  let reliefReveal = 0;
  if (index === 2) selectPortrait(portraitOverride ?? smooth(.32, .65, p));
  if (index === 3) {
    assembly.value = Math.round(assembled * 100);
    document.querySelector('#assembly-value').textContent = assembly.value + '%';
  }
  if (index === 5) {
    reliefReveal = geometryReady.relief && !contextLost ? smooth(.08, .34, reliefProgress) : 0;
    rooms[5].style.setProperty('--relief-reveal', reliefReveal.toFixed(4));
    const paleRelief = reliefReveal >= .48;
    const contrast = 4 * reliefReveal * (1 - reliefReveal);
    rooms[5].style.setProperty('--relief-text', paleRelief
      ? inkBetween([36, 37, 33], [8, 9, 7], contrast)
      : inkBetween([237, 231, 220], [255, 253, 246], contrast));
    rooms[5].style.setProperty('--relief-muted', paleRelief
      ? inkBetween([87, 87, 76], [24, 25, 21], contrast)
      : inkBetween([206, 197, 182], [243, 238, 224], contrast));
    relief.value = Math.round(reliefProgress * 100);
    document.querySelector('#relief-value').textContent = reliefProgress < .3 ? 'Surface' : reliefProgress > .75 ? 'Space' : 'Depth';
  }
  if (index === 6) {
    fracture.value = Math.round(broken * 100);
    document.querySelector('#fracture-value').textContent = fracture.value + '%';
    const plate = geometryReady.body && !contextLost ? smooth(.72, .98, broken) : 1;
    rooms[6].style.setProperty('--fracture-reveal', plate.toFixed(4));
  }
  return { assembled, reliefProgress, broken, reliefReveal };
}

function sculptureState(index, progress, content, pointerWeight) {
  let scene = { 3: 'body', 5: 'relief', 6: 'fracture', 7: 'afterlife' }[index];
  if (!scene || (scene === 'afterlife' && !archiveInspect)) return null;
  const host = rooms[index].querySelector('.spatial-host');
  const fitToViewport = layoutSpatialHost(host, index);
  const bounds = host.getBoundingClientRect();
  const explosion = scene === 'body' ? 1 - content.assembled
    : scene === 'fracture' ? content.broken : scene === 'afterlife' ? 0 : undefined;
  return { host, scene, progress: scene === 'relief' ? content.reliefProgress : progress,
    pointerX: pointerX * pointerWeight, pointerY: pointerY * pointerWeight,
    reducedMotion, light: scene === 'afterlife' ? light : .16,
    manualProgress: scene === 'relief' && manual.relief !== null,
    fitToViewport, explosion, width: bounds.width, height: bounds.height, visible: true };
}

/** Only one WebGL renderer exists. At the relief → fragment handoff a 2D plate
 * holds the outgoing, deterministic end pose while that renderer draws the
 * incoming exhibit. Capture immediately after render, never a cleared buffer.
 * Re-entering from either direction regenerates the same anchor when needed.
 */
function renderSculptures(composition, content) {
  if (!stage || !canvas) return;
  const pointerWeight = (1 - smooth(.62, .80, currentFrame.progress)) * smooth(0, .10, currentFrame.progress);
  const base = sculptureState(composition.base, composition.pose, content.base, pointerWeight);
  const next = composition.next === null ? null : sculptureState(composition.next, reducedMotion ? .45 : 0, content.next, 0);
  const live = next || base;
  for (const [index, still] of spatialStills) still.canvas.hidden = !(base && next && index === composition.base);
  if (!live) { stage.update({ scene: 'none', visible: false }); return; }
  if (base && next) {
    let still = spatialStills.get(composition.base);
    if (!still) {
      const plate = document.createElement('canvas');
      plate.className = 'spatial-still';
      plate.setAttribute('aria-hidden', 'true');
      base.host.append(plate);
      still = { canvas: plate, key: '' };
      spatialStills.set(composition.base, still);
    }
    const { host, ...anchor } = base;
    const key = JSON.stringify(anchor);
    if (still.key !== key) {
      stage.update(anchor);
      still.canvas.width = canvas.width;
      still.canvas.height = canvas.height;
      still.canvas.getContext('2d').drawImage(canvas, 0, 0);
      still.key = key;
    }
    still.canvas.hidden = false;
  }
  if (canvas.parentElement !== live.host) live.host.append(canvas);
  const { host, ...state } = live;
  stage.update(state);
  canvas.dataset.scene = state.scene;
  canvas.dataset.explosion = state.explosion === undefined ? '' : state.explosion.toFixed(4);
}

function render(time) {
  frameRequest = 0;
  if (document.hidden) return;
  if (resizePending) {
    const observed = timeline.snapshot();
    // A scroll or jump arriving during resize takes precedence over the old frame.
    const before = currentFrame && observed.index === currentFrame.index && Math.abs(observed.y - currentFrame.y) < 2 ? currentFrame : observed;
    timeline.measure(reducedMotion);
    timeline.goTo(before.index, before.progress, 'auto');
    spatialLayoutKey = '';
    resizePending = false;
  }
  // This is an on-demand clock: idle/background time does not belong to a new
  // gesture, but a long active frame must not slow Lenis's input response.
  const elapsed = Math.max(0, time - (previousFrameTime || time - 16));
  const step = Math.min(64, elapsed);
  previousFrameTime = time;
  scrollClock += elapsed;
  lenis.raf(scrollClock);
  const requested = timeline.snapshot();
  warmRoomArt(requested.index);
  const waitingForArt = !artReadiness[requested.index].ready;
  const frame = waitingForArt ? { ...requested, index: currentFrame?.index ?? 0, progress: currentFrame?.progress ?? 0 } : requested;
  root.dataset.preparingRoom = waitingForArt ? String(requested.index) : '';
  artPreparing.hidden = !waitingForArt;
  if (waitingForArt) {
    const label = !artReadiness[frame.index].ready ? 'Preparing the gallery'
      : requested.index < frame.index ? 'Preparing the previous room' : 'Preparing the next room';
    if (artPreparing.textContent !== label) artPreparing.textContent = label;
  }
  currentFrame = frame;
  if (currentIndex !== frame.index) changeChapter(frame.index);
  const composition = composeRooms(frame);
  const damping = 1 - Math.exp(-step / 135);
  pointerX += (desiredPointerX - pointerX) * damping;
  pointerY += (desiredPointerY - pointerY) * damping;
  const movingPointer = Math.abs(pointerX - desiredPointerX) + Math.abs(pointerY - desiredPointerY) > .001;
  const p = composition.pose;
  root.style.setProperty('--p', p.toFixed(5));
  root.style.setProperty('--px', (reducedMotion ? 0 : pointerX).toFixed(4));
  root.style.setProperty('--py', (reducedMotion ? 0 : pointerY).toFixed(4));
  root.style.setProperty('--overall', frame.overall.toFixed(5));

  const content = { base: updateRoomContent(frame.index, p), next: null };
  if (composition.next !== null) content.next = updateRoomContent(composition.next, reducedMotion ? .45 : 0);
  composeReadingLight(composition, content);
  const dominant = composition.mix > .55 ? composition.next : composition.base;
  const dominantContent = composition.mix > .55 ? content.next : content.base;
  document.body.dataset.theme = dominant === 7 || (dominant === 5 && dominantContent.reliefReveal > .55) ? 'light' : 'dark';
  renderSculptures(composition, content);
  if ((movingPointer && !reducedMotion) || lenis.isScrolling === 'smooth') requestRender();
  else previousFrameTime = 0;
}
window.addEventListener('scroll', () => { requestRender(); scheduleSave(); }, { passive: true });
window.addEventListener('resize', () => { resizePending = true; requestRender(); }, { passive: true });
window.addEventListener('orientationchange', () => { resizePending = true; requestRender(); }, { passive: true });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    settleScrollInput();
    cancelAnimationFrame(frameRequest);
    frameRequest = 0;
    previousFrameTime = 0;
    persistPosition();
  } else {
    previousFrameTime = 0;
    requestRender();
  }
});
window.addEventListener('pagehide', persistPosition);
window.addEventListener('pagehide', event => {
  settleScrollInput();
  cancelAnimationFrame(frameRequest);
  frameRequest = 0;
  previousFrameTime = 0;
  if (!event.persisted) lenis.destroy();
});
window.addEventListener('pageshow', () => {
  previousFrameTime = 0;
  requestRender();
});
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
// Start the lightweight image promises immediately; geometry still waits for
// idle. The first interaction must not race an idle-callback decode queue.
const warmAllRoomArt = () => rooms.forEach((_, i) => warmRoomArt(i));
warmAllRoomArt();
document.fonts.ready.then(() => { spatialLayoutKey = ''; requestRender(); });
document.querySelectorAll('.room-art img').forEach((img) => {
  img.addEventListener('load', requestRender, { once: true });
  img.addEventListener('error', () => {
    markUnavailableImage(img, img.closest('.room'));
  }, { once: true });
});
