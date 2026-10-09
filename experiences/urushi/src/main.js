import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { chapters, getStoryState, positionFromScroll, clamp, smooth } from './story.js';
import { ui } from './i18n.js';
import { createStillQueue, stillVariant, stillPath } from './still-frames.js';

const root = document.documentElement;
const byId = id => document.getElementById(id);
const journey = byId('journey');
const narrative = byId('narrative');
const chapterList = byId('chapter-list');
const readingCopy = byId('reading-copy');
const canvas = byId('surface-canvas');
let still = byId('still-surface');
const indexDialog = byId('index-dialog');
const aboutDialog = byId('about-dialog');
const dialogs = [indexDialog, aboutDialog];
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
const save = (key, value) => { try { localStorage.setItem(`urushi.${key}`, value); } catch { /* Preferences are optional. */ } };
const read = key => { try { return localStorage.getItem(`urushi.${key}`); } catch { return null; } };
let language = read('language') === 'zh' ? 'zh' : 'en';
let motionChoice = read('motion');
let reducedMotion = motionChoice ? motionChoice === 'reduced' : motionQuery.matches;
let engine = null;
let lenis = null;
let sections = [];
let phase = 0;
let currentChapter = -1;
let currentCopy = null;
let viewportHeight = window.innerHeight;
let frameRequest = 0;
let resizePending = false;
let disposed = false;
let hasRendered = false;
let dirty = true;
let renderAvailable = false;
let restorePending = false;
let light = 0.5;
const pointer = { x: 0, y: 0 };
const pointerTarget = { x: 0, y: 0 };
const copies = [];
const sceneElements = [];
const indexLinks = [];
const assetURL = name => new URL(`${import.meta.env.BASE_URL}urushi/assets/${name}`, document.baseURI).href;
const stillQueue = createStillQueue({
  initial: { chapter: 0, variant: stillVariant(window.innerWidth, window.innerHeight) },
  initialReady: false,
  prepare: ({ chapter, variant }) => prepareStillImage(assetURL(stillPath(chapter, variant))),
  onSettled: () => { dirty = true; },
});

function setLines(element, text) {
  element.replaceChildren();
  text.split('\n').forEach((line, i) => {
    if (i) element.append(document.createElement('br'));
    element.append(document.createTextNode(line));
  });
}

function createArrow(kind = 'right') {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 26 20');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', kind === 'return' ? 'M9 3 3 9l6 6M3 9h14a6 6 0 0 1 6 6v2' : 'M1 10h22M16 3l7 7-7 7');
  svg.append(path);
  return svg;
}

chapters.forEach((chapter, i) => {
  const section = document.createElement('section');
  section.id = chapter.id;
  section.className = 'scene';
  section.dataset.index = String(i);
  section.setAttribute('aria-label', chapter.name);
  journey.append(section);
  sceneElements.push(section);

  const copy = document.createElement('section');
  copy.className = `scene-copy${i === 4 || i === 9 ? ' scene-copy--compact' : ''}`;
  copy.dataset.index = String(i);
  copy.setAttribute('aria-labelledby', `scene-title-${i}`);
  copy.setAttribute('aria-hidden', i ? 'true' : 'false');
  copy.inert = i !== 0;
  const title = document.createElement(i === 0 ? 'h1' : 'h2');
  title.id = `scene-title-${i}`;
  setLines(title, chapter.title);
  const body = document.createElement('p');
  body.className = 'scene-body';
  body.textContent = chapter.body;
  copy.append(title, body);
  if (chapter.detail) {
    const detail = document.createElement('p');
    detail.className = 'scene-detail';
    detail.textContent = chapter.detail;
    copy.append(detail);
  }
  if (i === 10) {
    const controls = document.createElement('div');
    controls.className = 'depth-controls';
    const label = document.createElement('label');
    label.htmlFor = 'light-control';
    label.dataset.ui = 'light';
    label.textContent = 'Move the light';
    const input = document.createElement('input');
    input.type = 'range'; input.id = 'light-control'; input.min = '0'; input.max = '100'; input.value = '50';
    input.addEventListener('input', () => { light = Number(input.value) / 100; dirty = true; });
    const replay = document.createElement('button');
    replay.id = 'replay'; replay.className = 'text-button replay';
    const replayText = document.createElement('span');
    replayText.dataset.ui = 'replay'; replayText.textContent = 'Begin again';
    replay.append(replayText, createArrow('return'));
    replay.addEventListener('click', () => goToChapter(0));
    controls.append(label, input, replay);
    copy.append(controls);
  }
  narrative.append(copy);
  copies.push(copy);

  const item = document.createElement('li');
  const link = document.createElement('a');
  link.href = `#${chapter.id}`; link.dataset.index = String(i);
  const num = document.createElement('span'); num.className = 'index-number'; num.textContent = String(i).padStart(2, '0');
  const name = document.createElement('span'); name.className = 'index-name'; name.textContent = chapter.name;
  link.append(num, name, createArrow());
  link.addEventListener('click', event => {
    event.preventDefault();
    indexDialog.addEventListener('close', () => goToChapter(i), { once: true });
    indexDialog.close();
  });
  item.append(link); chapterList.append(item); indexLinks.push(link);

  const readSection = document.createElement('section');
  readSection.innerHTML = '<h4></h4><p></p>';
  readSection.dataset.index = String(i);
  readingCopy.append(readSection);
});

function applyLanguage() {
  const words = ui[language];
  root.lang = language === 'zh' ? 'zh-Hans' : 'en';
  root.dataset.language = language;
  for (const element of document.querySelectorAll('[data-ui]')) {
    const text = words[element.dataset.ui];
    if (text) setLines(element, text);
  }
  chapters.forEach((chapter, i) => {
    const title = language === 'zh' ? chapter.titleZh : chapter.title;
    const body = language === 'zh' ? chapter.bodyZh : chapter.body;
    const name = language === 'zh' ? chapter.zh : chapter.name;
    setLines(copies[i].querySelector('h1,h2'), title);
    copies[i].querySelector('.scene-body').textContent = body;
    const detail = copies[i].querySelector('.scene-detail');
    if (detail) detail.textContent = language === 'zh' ? chapter.detailZh : chapter.detail;
    indexLinks[i].querySelector('.index-name').textContent = name;
    sceneElements[i].setAttribute('aria-label', name);
    readingCopy.children[i].querySelector('h4').textContent = `${String(i).padStart(2, '0')} / ${name}`;
    const readingDetail = language === 'zh' ? chapter.detailZh : chapter.detail;
    readingCopy.children[i].querySelector('p').textContent = [title.replaceAll('\n', ' '), body, readingDetail].filter(Boolean).join(' ');
  });
  byId('language-toggle').textContent = language === 'zh' ? 'English' : '中文';
  byId('language-toggle').lang = language === 'zh' ? 'en' : 'zh-Hans';
  byId('motion-toggle').textContent = reducedMotion ? words.motionReduced : words.motionFull;
  byId('read-journey').textContent = readingCopy.hidden ? words.readJourney : words.hideJourney;
  byId('chapter-trigger').setAttribute('aria-label', language === 'zh' ? '打开章节目录' : 'Open chapter index');
  journey.setAttribute('aria-label', language === 'zh' ? '一个漆面的诞生' : 'The making of a lacquer surface');
  document.querySelector('.skip-link').textContent = language === 'zh' ? '跳至叙事' : 'Skip to the journey';
  currentChapter = -1;
  dirty = true;
  updateRenderStatus();
}

function configureMotion() {
  const scroll = window.scrollY;
  if (lenis) { lenis.destroy(); lenis = null; }
  lenis = new Lenis({ lerp: 0.105, smoothWheel: !reducedMotion, wheelMultiplier: 1, syncTouch: false, autoRaf: false });
  lenis.on('scroll', () => { dirty = true; });
  lenis.scrollTo(scroll, { immediate: true, force: true });
  if (dialogs.some(dialog => dialog.open)) lenis.stop();
  root.dataset.motion = reducedMotion ? 'reduced' : 'full';
  byId('motion-toggle').textContent = reducedMotion ? ui[language].motionReduced : ui[language].motionFull;
  byId('motion-toggle').setAttribute('aria-pressed', String(reducedMotion));
  pointer.x = pointer.y = pointerTarget.x = pointerTarget.y = 0;
  dirty = true;
}

function measure(preservePosition = false) {
  const savedPhase = sections.length ? positionFromScroll(window.scrollY, sections, viewportHeight) : phase;
  viewportHeight = window.innerHeight;
  sceneElements.forEach((section, i) => { section.style.height = `${Math.round(chapters[i].height * viewportHeight)}px`; });
  sections = sceneElements.map(section => ({ top: section.offsetTop, bottom: section.offsetTop + section.offsetHeight }));
  // Native fragments and authored navigation share the same stable composition.
  // This also covers later UA anchor passes without guessing font/load timing.
  sceneElements.forEach((section, i) => {
    const span = i === 10 ? sections[i].bottom - viewportHeight - sections[i].top : sections[i + 1].top - sections[i].top;
    section.style.scrollMarginTop = `${i === 0 ? 0 : -span * 0.16}px`;
  });
  engine?.resize(window.innerWidth, viewportHeight);
  lenis?.resize();
  if (preservePosition && sections.length) {
    const index = Math.min(10, Math.floor(savedPhase));
    const local = clamp(savedPhase - index);
    const start = sections[index].top;
    const end = index === 10 ? sections[index].bottom - viewportHeight : sections[index + 1].top;
    const y = start + (end - start) * local;
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo({ top: y, behavior: 'instant' });
  }
  dirty = true;
}

function goToChapter(index, { immediate = false, updateHash = true } = {}) {
  const section = sections[index];
  if (!section) return;
  // Land inside a stable composition. The opening itself always starts at 0.
  const span = index === 10 ? section.bottom - viewportHeight - section.top : sections[index + 1].top - section.top;
  const y = index === 0 ? 0 : section.top + span * 0.16;
  if (lenis) lenis.scrollTo(y, { immediate: immediate || reducedMotion, force: true });
  else window.scrollTo({ top: y, behavior: 'instant' });
  if (updateHash) history.replaceState(null, '', `#${chapters[index].id}`);
  dirty = true;
}

function openDialog(dialog, trigger) {
  if (dialog.open) return;
  dialogs.forEach(other => { if (other.open) other.close(); });
  lenis?.stop();
  root.classList.add('dialog-open');
  dialog.showModal();
  dialog.querySelector('.close-dialog').focus({ preventScroll: true });
  trigger?.setAttribute('aria-expanded', 'true');
  dialog.addEventListener('close', () => {
    if (!dialogs.some(other => other.open)) { root.classList.remove('dialog-open'); lenis?.start(); }
    trigger?.setAttribute('aria-expanded', 'false');
    trigger?.focus({ preventScroll: true });
    dirty = true;
  }, { once: true });
}

dialogs.forEach(dialog => {
  dialog.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
});

byId('menu-toggle').addEventListener('click', event => openDialog(indexDialog, event.currentTarget));
byId('chapter-trigger').addEventListener('click', event => openDialog(indexDialog, event.currentTarget));
byId('about-toggle').addEventListener('click', event => openDialog(aboutDialog, event.currentTarget));
byId('begin-scroll').addEventListener('click', () => goToChapter(1));
document.querySelector('a.wordmark').addEventListener('click', event => { event.preventDefault(); goToChapter(0); });
byId('language-toggle').addEventListener('click', () => { language = language === 'en' ? 'zh' : 'en'; save('language', language); applyLanguage(); });
byId('motion-toggle').addEventListener('click', () => { reducedMotion = !reducedMotion; motionChoice = reducedMotion ? 'reduced' : 'full'; save('motion', motionChoice); configureMotion(); });
motionQuery.addEventListener('change', event => { if (!motionChoice) { reducedMotion = event.matches; configureMotion(); } });
byId('read-journey').addEventListener('click', () => {
  readingCopy.hidden = !readingCopy.hidden;
  byId('read-journey').setAttribute('aria-expanded', String(!readingCopy.hidden));
  byId('read-journey').textContent = readingCopy.hidden ? ui[language].readJourney : ui[language].hideJourney;
});

function prepareStillImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'sync';
    image.loading = 'eager';
    image.onload = async () => {
      image.onload = image.onerror = null;
      try {
        if (image.decode) await image.decode();
        if (!image.naturalWidth) throw new Error('The still image has no pixels');
        resolve(image);
      } catch (error) { reject(error); }
    };
    image.onerror = () => {
      image.onload = image.onerror = null;
      reject(new Error('The still image is unavailable'));
    };
    image.src = url;
  });
}

function requestStillFrame(chapter) {
  stillQueue.request(chapter, stillVariant(window.innerWidth, viewportHeight));
}

function commitStillFrame() {
  const ready = stillQueue.commit();
  if (!ready) return;
  // Publish the decoded node into the ordinary stage. Inserting it into the
  // initial <picture> restarts responsive source selection in the browser,
  // invalidating the readiness just established by decode(). Replace that
  // whole container once; subsequent swaps keep a standalone image.
  const image = ready.image;
  for (const attribute of still.attributes) {
    if (!['src', 'srcset', 'sizes', 'decoding', 'loading'].includes(attribute.name)) image.setAttribute(attribute.name, attribute.value);
  }
  image.dataset.chapter = String(ready.chapter);
  image.dataset.variant = ready.variant;
  const previousSurface = still.parentElement?.tagName === 'PICTURE' ? still.parentElement : still;
  previousSurface.replaceWith(image);
  still = image;
  root.dataset.stillReady = 'true';
}

function displayedStillState() {
  // A still plate is a complete reading composition, independent of a live
  // chapter's enter/exit fade or a request that has not decoded yet.
  return getStoryState((stillQueue.state.displayed?.chapter ?? 0) + 0.16);
}

function updateRenderStatus() {
  const status = byId('render-status');
  if (root.dataset.renderer === 'webgl') { status.hidden = true; return; }
  const pending = stillQueue.state;
  const chapter = chapters[pending.requested.chapter];
  const name = language === 'zh' ? chapter.zh : chapter.name;
  const words = ui[language];
  const message = pending.status === 'failed' ? words.stillFailed
    : ['pending', 'prepared'].includes(pending.status) ? (pending.displayed ? words.stillLoading : words.firstStillLoading)
    : root.dataset.renderer === 'still' ? words.fallback : words.loading;
  status.textContent = message.replace('{chapter}', name);
  status.hidden = false;
}

function fallback() {
  if (disposed) return;
  renderAvailable = false;
  restorePending = false;
  root.dataset.renderer = 'still';
  requestStillFrame(Math.min(10, Math.floor(phase)));
  // Context loss invalidates the live drawing surface immediately. Restore
  // the already valid image/copy pair together; later arrivals use the RAF.
  updateNarrative(displayedStillState(), true);
  updateRenderStatus();
  dirty = true;
}

function updateNarrative(state, isStill = false) {
  const index = state.chapter;
  const local = state.local;
  if (index !== currentChapter) {
    copies.forEach((copy, i) => {
      const active = index === i;
      copy.classList.toggle('is-current', active);
      copy.setAttribute('aria-hidden', String(!active));
      copy.inert = !active;
      indexLinks[i].setAttribute('aria-current', active ? 'step' : 'false');
    });
    currentChapter = index;
    currentCopy = copies[index];
    root.dataset.chapter = String(index);
    byId('chapter-number').textContent = String(index).padStart(2, '0');
    byId('chapter-name').textContent = language === 'zh' ? chapters[index].zh : chapters[index].name;
    byId('chapter-note').textContent = language === 'zh' ? chapters[index].noteZh : chapters[index].note;
  }
  const enter = index === 0 || reducedMotion || isStill ? 1 : smooth(0, 0.13, local);
  const leave = index === 10 || reducedMotion || isStill ? 0 : smooth(0.78, 0.98, local);
  currentCopy.style.setProperty('--copy-opacity', String(enter * (1 - leave)));
  currentCopy.style.setProperty('--copy-offset', `${reducedMotion || isStill ? 0 : (1 - enter) * 12 - leave * 10}px`);
  const atOpening = index === 0;
  byId('begin-scroll').hidden = !atOpening;
  byId('chapter-trigger').hidden = atOpening;
  root.style.setProperty('--journey-progress', String(phase / 11));
  root.style.setProperty('--chamber', String(state.chamber));
}

function frame(time) {
  frameRequest = 0;
  if (disposed || document.hidden) return;
  if (resizePending) { resizePending = false; measure(true); }
  lenis?.raf(time);
  const nextPhase = positionFromScroll(window.scrollY, sections, viewportHeight);
  if (nextPhase !== phase) dirty = true;
  phase = nextPhase;
  const state = getStoryState(phase);
  const pointerMoving = Math.abs(pointer.x - pointerTarget.x) + Math.abs(pointer.y - pointerTarget.y) > 0.0001;
  if (!reducedMotion && !dialogs.some(dialog => dialog.open)) {
    pointer.x += (pointerTarget.x - pointer.x) * 0.12;
    pointer.y += (pointerTarget.y - pointer.y) * 0.12;
  }
  if (dirty || !hasRendered || restorePending || (!reducedMotion && !indexDialog.open && (renderAvailable || pointerMoving))) {
    // Prepare the current chapter while WebGL is healthy as well. The queue
    // ignores unchanged identities; a context loss can use this valid plate.
    requestStillFrame(state.chapter);
    commitStillFrame();
    if (renderAvailable) {
      try {
        const submitted = engine.render(state, reducedMotion ? 0 : time / 1000, pointer, light);
        if (submitted && restorePending) {
          restorePending = false;
          root.dataset.renderer = 'webgl';
        }
      }
      catch { fallback(); }
    }
    if (root.dataset.renderer === 'webgl') updateNarrative(state);
    else updateNarrative(displayedStillState(), true);
    updateRenderStatus();
    dirty = false; hasRendered = true;
  }
  if (!disposed && !document.hidden) frameRequest = requestAnimationFrame(frame);
}

window.addEventListener('scroll', () => { dirty = true; }, { passive: true });
window.addEventListener('pointermove', event => {
  if (reducedMotion || event.pointerType === 'touch' || dialogs.some(dialog => dialog.open)) return;
  pointerTarget.x = clamp(event.clientX / window.innerWidth * 2 - 1, -1, 1);
  pointerTarget.y = clamp(event.clientY / viewportHeight * 2 - 1, -1, 1);
}, { passive: true });
document.addEventListener('pointerleave', () => { pointerTarget.x = pointerTarget.y = 0; });
window.addEventListener('resize', () => {
  resizePending = true;
  dirty = true;
}, { passive: true });
window.addEventListener('wheel', event => {
  if (disposed || reducedMotion || !lenis || !event.deltaY || dialogs.some(dialog => dialog.open)) return;
  if (event.deltaY * lenis.velocity < 0 || event.deltaY * (lenis.targetScroll - lenis.actualScroll) < 0) {
    lenis.stop();
    lenis.start();
  }
}, { capture: true, passive: true });
document.addEventListener('visibilitychange', () => {
  if (disposed) return;
  if (document.hidden) { cancelAnimationFrame(frameRequest); frameRequest = 0; }
  else {
    lenis?.scrollTo(window.scrollY, { immediate: true, force: true });
    dirty = true;
    if (!frameRequest) frameRequest = requestAnimationFrame(frame);
  }
});
window.addEventListener('hashchange', () => {
  const index = chapters.findIndex(chapter => `#${chapter.id}` === location.hash);
  if (index >= 0) goToChapter(index, { immediate: true, updateHash: false });
});

async function loadSources() {
  try {
    const response = await fetch(assetURL('research-sources.json'));
    if (!response.ok) throw new Error('Sources unavailable');
    const sources = await response.json();
    if (disposed) return;
    sources.forEach(source => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      link.textContent = source.title;
      link.append(createArrow());
      li.append(link); byId('source-list').append(li);
    });
  } catch {
    if (disposed) return;
    const li = document.createElement('li');
    li.textContent = 'The complete source list is included in docs/research/RESEARCH.md.';
    byId('source-list').append(li);
  }
}

async function start() {
  root.dataset.renderer = 'loading';
  const stylesheet = byId('urushi-styles');
  if (stylesheet && !stylesheet.sheet) await new Promise(resolve => {
    stylesheet.addEventListener('load', resolve, { once: true });
    stylesheet.addEventListener('error', resolve, { once: true });
  });
  if (disposed) return;
  applyLanguage(); configureMotion(); measure();
  const hashIndex = chapters.findIndex(chapter => `#${chapter.id}` === location.hash);
  const navigation = performance.getEntriesByType('navigation')[0]?.type;
  // Fresh links and native fragment passes land in the same measured composition.
  // Reload/history entries retain the browser's actual arbitrary read position.
  if (hashIndex >= 0 && !['reload', 'back_forward'].includes(navigation)) {
    goToChapter(hashIndex, { immediate: true, updateHash: false });
  }
  frameRequest = requestAnimationFrame(frame);
  loadSources();
  try {
    const { LacquerRenderer } = await import('./renderer.js');
    if (disposed) return;
    engine = new LacquerRenderer(canvas, {
      onContextLost: fallback,
      // Three's own restored listener runs after ours. Defer the first draw to
      // the existing main clock, then expose WebGL only when it was submitted.
      onContextRestored: () => {
        if (!disposed) { renderAvailable = true; restorePending = true; dirty = true; }
      },
    });
    await engine.init();
    if (disposed) { engine.dispose(); return; }
    engine.resize(window.innerWidth, viewportHeight);
    renderAvailable = true;
    restorePending = true;
    dirty = true;
  } catch {
    engine?.dispose();
    engine = null;
    if (!disposed) fallback();
  }
  if (!disposed) root.dataset.ready = 'true';
}

window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  disposed = true;
  stillQueue.dispose();
  cancelAnimationFrame(frameRequest);
  frameRequest = 0;
  lenis?.destroy();
  lenis = null;
  engine?.dispose();
});
window.addEventListener('pageshow', event => {
  if (!event.persisted || disposed) return;
  lenis?.resize();
  lenis?.scrollTo(window.scrollY, { immediate: true, force: true });
  dirty = true;
  if (!document.hidden && !frameRequest) frameRequest = requestAnimationFrame(frame);
});

start();
