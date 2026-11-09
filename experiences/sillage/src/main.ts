import './style.css';
import './bridge-controls.css';
import Lenis from 'lenis';
import { renderLayout, arrow } from './layout.ts';
import { CHAPTERS, LEXICON, PHASES, MEMORIES, UI, shareSummary } from './content.ts';
import { imprintSVG } from './artwork.ts';
import { mountTransitions } from './transitions.ts';
import { createPrint } from './export.ts';
import { createSound } from './audio.ts';
import { DEFAULT_SHARES, PRESETS, createDemoState, createPersonalState, loadState, saveState, redistribute, chooseMemory, editTitle, displayTitle } from './state.ts';
import type { ComponentIndex, Phase, PersonalState, StorageLike } from './state.ts';

const app = document.querySelector<HTMLDivElement>('#app')!;
let storage: StorageLike | null = null;
try { storage = window.localStorage; } catch { /* private browsing still works */ }
let personal = loadState(storage);
const demo = createDemoState();
demo.missing = 0;
let personalDirty = false;
let scrollDirty = true;
let resizeDirty = true;
let hasUserMoved = false;
let reduced = false;
let forcedStill = false;
let lenis: Lenis | null = null;
let raf = 0;
let lastScroll = -1;
let activeChapter = -1;
let downloadUrl = '';
let exportedIdentity = '';
let indexNavigating = false;
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
try { forcedStill = localStorage.getItem('sillage:still') === 'true'; } catch { /* optional preference */ }
const texture = './art/material-atlas.webp';
const copies = new Map<string, string>();
app.innerHTML = renderLayout();
const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const announce = (message: string) => { el('live-region').textContent = message; };
const text = (id: string, value: string) => { el(id).textContent = value; };
const all = <T extends Element = HTMLElement>(selector: string) => Array.from(document.querySelectorAll<T>(selector));
const press = (selector: string, key: string, value: string | number | null) => all(selector).forEach(element => {
  element.setAttribute('aria-pressed', String(value !== null && element.getAttribute(key) === String(value)));
});

function draw(id: string, shares: readonly [number,number,number] = DEFAULT_SHARES, options: Parameters<typeof imprintSVG>[1] = {}) {
  const target = el(id);
  if (!target) return;
  const key = JSON.stringify([shares, options]);
  if (copies.get(id) === key) return;
  copies.set(id, key);
  target.innerHTML = imprintSVG(shares, {id, textureHref:texture, ...options});
}

function initialArt() {
  draw('vocabulary-art');
  PHASES.forEach(p => {
    draw('phase-' + p.id, DEFAULT_SHARES, {phase:p.id});
    draw('panorama-' + p.id, DEFAULT_SHARES, {phase:p.id});
  });
  draw('chord-art', DEFAULT_SHARES, {separation:1});
  draw('absence-full');
  draw('absence-part', DEFAULT_SHARES, {missing:0});
  draw('distance-near');
  draw('distance-middle', DEFAULT_SHARES, {phase:'unfolding'});
  draw('distance-far', DEFAULT_SHARES, {phase:'afterglow',mode:'flat'});
  draw('memory-imprint');
  draw('ending-original');
}

function renderPersonal(persist = true) {
  press('[data-hero-note]', 'data-hero-note', null);
  text('hero-note-status', 'Three edges. One quiet opening.');
  if (exportedIdentity && exportedIdentity !== JSON.stringify(personal)) {
    el('export-preview')?.remove();
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = '';
    exportedIdentity = '';
    text('export-status', 'Your composition has changed. Keep this version when you are ready.');
  }
  draw('personal-art', personal.shares);
  draw('ending-current', personal.shares);
  PHASES.forEach(p => {
    draw('personal-' + p.id, personal.shares, {phase:p.id});
    draw('ending-' + p.id, personal.shares, {phase:p.id});
  });
  const changed = personal.shares.some((value, i) => value !== DEFAULT_SHARES[i]);
  el('hero-personal').hidden = !changed;
  document.querySelector('.hero-art')?.classList.toggle('is-personal', changed);
  if (changed) draw('hero-personal', personal.shares);
  const summary = 'Brightness ' + personal.shares[0] + ' · Spice ' + personal.shares[1] + ' · Warmth ' + personal.shares[2];
  const title = displayTitle(personal);
  // A longer bridge title can change the gallery height inside its fixed stage.
  if (el('ending-title').textContent !== title) resizeDirty = true;
  text('composition-summary', summary);
  text('ending-shares', summary.replaceAll(' · ', ' / '));
  text('ending-title', title);
  all<HTMLElement>('[data-bridge-title]').forEach(element => { element.textContent = title; });
  all<HTMLElement>('[data-bridge-shares]').forEach(element => { element.textContent = summary; });
  text('title-count', Array.from(personal.title).length + ' / 64');
  LEXICON.forEach(n => {
    const range = el<HTMLInputElement>('share-' + n.index);
    range.value = String(personal.shares[n.index]);
    range.setAttribute('aria-valuetext', n.name + ' ' + personal.shares[n.index] + ' percent');
    // Do not interrupt a partially typed number or its caret.
    all<HTMLInputElement>('[data-number="' + n.index + '"]').forEach(number => {
      if (document.activeElement !== number) number.value = range.value;
    });
  });
  const titleInput = el<HTMLInputElement>('personal-title');
  if (document.activeElement !== titleInput) titleInput.value = personal.title;
  all('[data-preset]').forEach(button => {
    const preset = PRESETS.find(item => item.id === button.getAttribute('data-preset'));
    button.setAttribute('aria-pressed', String(preset?.shares.every((value, i) => value === personal.shares[i]) ?? false));
  });
  press('[data-memory]', 'data-memory', personal.memory);
  if (personal.memory) {
    const memory = MEMORIES.find(m => m.id === personal.memory)!;
    text('memory-status', memory.selected);
  }
  if (persist) {
    const saved = saveState(storage, personal);
    text('save-status', saved ? 'Kept on this device' : 'Kept for this visit');
    if (!saved) el('save-status').title = UI.resources.storageUnavailable;
  }
  personalDirty = false;
  scrollDirty = true;
}

initialArt();
renderPersonal(false);
const transitions = mountTransitions({ getPersonal: () => personal, getDemo: () => demo, isReduced: () => reduced });
let chapterBounds: { element: HTMLElement; top: number; bottom: number }[] = [];
function measure() {
  lenis?.resize();
  chapterBounds = CHAPTERS.map(chapter => {
    const element = el(chapter.id);
    const rect = element.getBoundingClientRect();
    return {element, top:rect.top + window.scrollY, bottom:rect.bottom + window.scrollY};
  });
  transitions.resize();
  resizeDirty = false;
  scrollDirty = true;
}
function updatePosition() {
  const y = window.scrollY + innerHeight * .35;
  let index = 0;
  chapterBounds.forEach((bounds, i) => { if (y >= bounds.top) index = i; });
  if (index !== activeChapter) {
    activeChapter = index;
    text('current-chapter', CHAPTERS[index].number);
    el('story-position').setAttribute('href', '#' + CHAPTERS[index].id);
    el('story-position').setAttribute('aria-label', 'Current chapter: ' + CHAPTERS[index].navLabel + '. Return to its beginning.');
  }
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  el('position-fill').style.width = Math.min(100, window.scrollY / max * 100) + '%';
  document.querySelector('.site-header')?.classList.toggle('is-scrolled', window.scrollY > 40);
}
function frame(time: number) {
  if (document.hidden) { raf = 0; return; }
  lenis?.raf(time);
  if (resizeDirty) measure();
  if (personalDirty) renderPersonal();
  if (window.scrollY !== lastScroll) { scrollDirty = true; lastScroll = window.scrollY; }
  if (scrollDirty) { transitions.update(); updatePosition(); scrollDirty = false; }
  raf = requestAnimationFrame(frame);
}
function configureMotion() {
  reduced = motionQuery.matches || forcedStill;
  document.documentElement.classList.toggle('reduced-motion', reduced);
  document.documentElement.dataset.motion = reduced ? 'still' : 'full';
  const button = el<HTMLButtonElement>('motion-toggle');
  button.textContent = reduced ? 'Motion: still' : 'Motion: full';
  button.setAttribute('aria-pressed', String(reduced));
  button.disabled = motionQuery.matches;
  button.title = motionQuery.matches ? 'Your system requests reduced motion.' : 'Switch between gentle motion and still mode.';
  lenis?.destroy(); lenis = null;
  if (!reduced) {
    lenis = new Lenis({
      autoRaf:false, lerp:.16, smoothWheel:true, syncTouch:false,
      anchors:false, respectReducedMotion:true, stopInertiaOnNavigate:true,
      prevent: node => !!node.closest('dialog, input[type="range"]'),
    });
    lenis.on('scroll', () => { scrollDirty = true; });
  }
  resizeDirty = true;
}
configureMotion();
raf = requestAnimationFrame(frame);

el('motion-toggle').addEventListener('click', () => {
  forcedStill = !reduced;
  try { localStorage.setItem('sillage:still', String(forcedStill)); } catch { /* optional */ }
  configureMotion();
  announce(reduced ? UI.motion.paused : UI.motion.resumed);
});
motionQuery.addEventListener('change', configureMotion);
window.addEventListener('resize', () => { resizeDirty = true; }, {passive:true});
window.addEventListener('scroll', () => { scrollDirty = true; }, {passive:true});
['wheel','touchstart','keydown','pointerdown'].forEach(event => window.addEventListener(event, () => { hasUserMoved = true; }, {passive:true}));
const resizeObserver = new ResizeObserver(() => { resizeDirty = true; });
resizeObserver.observe(document.body);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
  else {
    lenis?.scrollTo(window.scrollY, {immediate:true});
    resizeDirty = true;
    if (!raf) raf = requestAnimationFrame(frame);
  }
});
window.addEventListener('pageshow', () => { resizeDirty = true; });
document.fonts.ready.then(() => {
  resizeDirty = true;
  if (!hasUserMoved && location.hash) navigate(location.hash, true, false);
});

const indexDialog = el<HTMLDialogElement>('chapter-index');
const indexToggle = el<HTMLButtonElement>('index-toggle');
indexToggle.addEventListener('click', () => { indexDialog.showModal(); lenis?.stop(); });
el('index-close').addEventListener('click', () => indexDialog.close());
indexDialog.addEventListener('close', () => {
  lenis?.start();
  if (!indexNavigating) indexToggle.focus({preventScroll:true});
  indexNavigating = false;
});
indexDialog.addEventListener('click', event => { if (event.target === indexDialog) {
  const box = indexDialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) indexDialog.close();
}});
function navigate(hash: string, immediate = false, focus = true) {
  let target: HTMLElement | null;
  try { target = document.querySelector<HTMLElement>(hash); } catch { return; }
  if (!target) return;
  if (Math.abs(target.getBoundingClientRect().top) > innerHeight * 2) immediate = true;
  const finish = () => {
    if (!focus) return;
    const heading = target!.querySelector<HTMLElement>('h1,h2') || target!;
    heading.setAttribute('tabindex','-1');
    heading.focus({preventScroll:true});
  };
  if (lenis && !reduced) lenis.scrollTo(target, {offset:-80, immediate, duration:.85, onComplete:finish});
  else { window.scrollTo({top:target.getBoundingClientRect().top + window.scrollY - 80, behavior:'instant'}); finish(); }
  scrollDirty = true;
}
document.addEventListener('click', event => {
  const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
  if (!anchor) return;
  const hash = anchor.getAttribute('href')!;
  if (hash.length < 2) return;
  event.preventDefault();
  if (indexDialog.open) { indexNavigating = true; indexDialog.close(); lenis?.start(); }
  history.pushState(null, '', hash);
  navigate(hash);
});
window.addEventListener('popstate', () => { if (location.hash) navigate(location.hash,true,false); });
requestAnimationFrame(() => { if (location.hash) navigate(location.hash,true,false); });

all<HTMLButtonElement>('[data-hero-note]').forEach(button => button.addEventListener('click', () => {
  const index = Number(button.dataset.heroNote) as ComponentIndex;
  const wasPressed = button.getAttribute('aria-pressed') === 'true';
  press('[data-hero-note]', 'data-hero-note', wasPressed ? null : index);
  text('hero-note-status', wasPressed ? 'Three edges. One quiet opening.' : LEXICON[index].selected);
  // A precise inset gives the selected edge a real, accessible visual result.
  const target = el('hero-personal');
  if (!wasPressed) {
    target.hidden = false;
    draw('hero-personal', personal.shares, {label:LEXICON[index].selected});
    target.querySelectorAll<SVGGElement>('[data-component]').forEach(part => {
      part.style.display = part.dataset.component === LEXICON[index].id ? '' : 'none';
    });
    if (personal.shares[index] === 0) text('hero-note-status', LEXICON[index].name + ' is absent from your current composition.');
    document.querySelector('.hero-art')?.classList.add('is-personal');
  } else renderPersonal(false);
}));

all<HTMLButtonElement>('[data-vocabulary]').forEach(button => button.addEventListener('click', () => {
  const index = Number(button.dataset.vocabulary) as ComponentIndex;
  draw('vocabulary-art', DEFAULT_SHARES, {label:LEXICON[index].selected});
  el('vocabulary-art').querySelectorAll<SVGGElement>('[data-component]').forEach(part => {
    part.style.display = part.dataset.component === LEXICON[index].id ? '' : 'none';
  });
  press('[data-vocabulary]', 'data-vocabulary', index);
  text('vocabulary-description', LEXICON[index].description);
}));
el('vocabulary-all').addEventListener('click', () => {
  draw('vocabulary-art'); press('[data-vocabulary]','data-vocabulary',null);
  text('vocabulary-description','A fine ridge. A close fold. A place to rest.');
});
all<HTMLButtonElement>('[data-phase]').forEach(button => button.addEventListener('click', () => {
  demo.phase = button.dataset.phase as Phase;
  press('[data-phase]', 'data-phase', demo.phase);
  text('phase-status', PHASES.find(phase => phase.id === demo.phase)!.announcement);
  scrollDirty = true;
}));
all<HTMLButtonElement>('[data-chord]').forEach(button => button.addEventListener('click', () => {
  demo.together = button.dataset.chord === 'together';
  press('[data-chord]', 'data-chord', button.dataset.chord!);
  document.querySelector('.chord-plate')?.classList.toggle('is-apart', !demo.together);
  document.querySelector('.chord-plate > img')?.setAttribute('aria-hidden', String(!demo.together));
  document.querySelector('.chord-live')?.setAttribute('aria-hidden', String(demo.together));
  text('chord-status', demo.together ? UI.chord.togetherResult : UI.chord.apartResult);
  scrollDirty = true;
}));
all<HTMLButtonElement>('[data-remove]').forEach(button => button.addEventListener('click', () => {
  demo.missing = button.dataset.remove === 'none' ? null : Number(button.dataset.remove) as ComponentIndex;
  draw('absence-part', DEFAULT_SHARES, {missing:demo.missing});
  press('[data-remove]', 'data-remove', demo.missing === null ? 'none' : demo.missing);
  el('absence-caption').innerHTML = (demo.missing === null ? 'The whole' : 'Without ' + LEXICON[demo.missing].name) + '<span>' +
    (demo.missing === null ? 'All three returned' : 'A place left open') + '</span>';
  text('absence-status', demo.missing === null ? UI.subtraction.restored : LEXICON[demo.missing].absent);
  scrollDirty = true;
}));
all<HTMLButtonElement>('[data-distance]').forEach(button => button.addEventListener('click', () => {
  demo.distance = button.dataset.distance as typeof demo.distance;
  press('[data-distance]','data-distance',demo.distance);
  (document.querySelector('.distance-trail') as HTMLElement).dataset.focus = demo.distance;
  text('distance-status', UI.distance[(demo.distance + 'Result') as 'nearResult'|'middleResult'|'farResult']);
  scrollDirty = true;
}));
all<HTMLButtonElement>('[data-memory]').forEach(button => button.addEventListener('click', () => {
  const memory = button.dataset.memory as 'window'|'note';
  personal = chooseMemory(personal, memory);
  personalDirty = true;
}));
el('memory-clear').addEventListener('click', () => {
  personal = chooseMemory(personal, null); personalDirty = true;
  text('memory-status', 'Neither memory needs to be yours. You can simply keep going.');
});
all<HTMLButtonElement>('[data-panorama]').forEach(button => button.addEventListener('click', () => {
  const phase = button.dataset.panorama as Phase;
  press('[data-panorama]','data-panorama',phase);
  all<HTMLElement>('.panorama-static-phases figure').forEach((figure, i) => figure.classList.toggle('is-selected', PHASES[i].id === phase));
  text('panorama-status', PHASES.find(p => p.id === phase)!.description);
  const scene = document.querySelector<HTMLElement>('.panorama-scene')!;
  scene.dataset.stage = phase;
  let localResult = el('panorama-local-result');
  if (!localResult) {
    localResult = document.createElement('p');
    localResult.id = 'panorama-local-result';
    localResult.className = 'panorama-local-result';
    localResult.setAttribute('aria-live','polite');
    scene.append(localResult);
  }
  localResult.textContent = PHASES.find(p => p.id === phase)!.name + '. ' + PHASES.find(p => p.id === phase)!.description;
}));
el('panorama-reset').addEventListener('click', () => {
  press('[data-panorama]','data-panorama',null);
  all('.panorama-static-phases figure').forEach(figure => figure.classList.remove('is-selected'));
  text('panorama-status', UI.panorama.restored);
  delete document.querySelector<HTMLElement>('.panorama-scene')!.dataset.stage;
  el('panorama-local-result')?.remove();
});

function changeShare(index: ComponentIndex, value: number) {
  personal = { ...personal, shares:redistribute(personal.shares, index, value) };
  personalDirty = true;
}
el('composition-form').addEventListener('submit', event => event.preventDefault());
all<HTMLInputElement>('[data-share]').forEach(input => {
  input.addEventListener('input', () => changeShare(Number(input.dataset.share) as ComponentIndex, Number(input.value)));
  input.addEventListener('change', () => announce(shareSummary(personal.shares)));
});
all<HTMLInputElement>('[data-number]').forEach(input => {
  const index = Number(input.dataset.number) as ComponentIndex;
  input.addEventListener('input', () => { if (input.value !== '' && Number.isFinite(input.valueAsNumber)) changeShare(index, input.valueAsNumber); });
  input.addEventListener('change', () => { input.value = String(personal.shares[index]); announce(shareSummary(personal.shares)); });
  input.addEventListener('blur', () => { input.value = String(personal.shares[index]); });
});
all<HTMLButtonElement>('[data-preset]').forEach(button => button.addEventListener('click', () => {
  const preset = PRESETS.find(p => p.id === button.dataset.preset)!;
  personal = {...personal, shares:[...preset.shares]};
  personalDirty = true; announce(preset.name + '. ' + shareSummary(personal.shares));
}));
el<HTMLInputElement>('personal-title').addEventListener('input', event => {
  const input = event.target as HTMLInputElement;
  personal = editTitle(personal, input.value);
  if (input.value !== personal.title) input.value = personal.title;
  text('title-count', Array.from(personal.title).length + ' / 64');
  personalDirty = true;
});
function reset() {
  personal = createPersonalState();
  personalDirty = true;
  text('memory-status','Neither memory needs to be yours. You can simply keep going.');
  announce(UI.editor.resetResult);
}
el('composition-reset').addEventListener('click', reset);
el('ending-reset').addEventListener('click', reset);

const exportButton = el<HTMLButtonElement>('export-png');
const previewButton = document.createElement('button');
previewButton.id = 'preview-png';
previewButton.type = 'button';
previewButton.className = 'quiet-button preview-print';
previewButton.textContent = 'Preview the print';
exportButton.before(previewButton);
let preparingExport = false;
async function prepareExport(shouldDownload = true): Promise<void> {
  if (preparingExport) return;
  preparingExport = true;
  exportButton.disabled = true;
  previewButton.disabled = true;
  text('export-status','Preparing your image…');
  try {
    const result = await createPrint(() => personal);
    exportedIdentity = JSON.stringify(personal);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = downloadUrl; link.download = result.filename;
    if (shouldDownload) link.click();
    text('export-status', shouldDownload
      ? 'Your 2400 × 1600 PNG is ready. This is your current composition.'
      : 'Your 2400 × 1600 preview is ready below. Choose Keep your impression when you are ready to download.');
    let preview = el<HTMLElement>('export-preview');
    if (!preview) {
      preview = document.createElement('figure'); preview.id = 'export-preview'; preview.className = 'export-preview';
      el('export-status').after(preview);
    }
    preview.replaceChildren();
    const image = document.createElement('img');
    image.src = result.dataUrl; image.alt = 'Your exported impression: ' + displayTitle(personal); image.width = 2400; image.height = 1600;
    const again = document.createElement('a');
    again.href = downloadUrl; again.download = result.filename; again.className = 'quiet-button'; again.textContent = shouldDownload ? 'Download again' : 'Download this PNG';
    preview.append(image, again);
  } catch (error) {
    text('export-status', error instanceof Error ? error.message : UI.export.failed);
  } finally {
    preparingExport = false;
    exportButton.disabled = false;
    previewButton.disabled = false;
    resizeDirty = true;
  }
}
previewButton.addEventListener('click', () => { void prepareExport(false); });
exportButton.addEventListener('click', () => { void prepareExport(true); });

const sound = createSound((enabled, unavailable) => {
  text('sound-toggle', unavailable ? 'Sound: unavailable' : enabled ? 'Sound: on' : 'Sound: off');
  el('sound-toggle').setAttribute('aria-pressed', String(enabled));
  if (unavailable) announce('Sound could not start. The complete story is available in silence.');
});
el('sound-toggle').addEventListener('click', sound.toggle);

function imageFailed(image: HTMLImageElement) {
  if (image.dataset.fallback === 'true' || image.dataset.retrying === 'true' || !image.isConnected) return;
  const original = image.closest('picture') ?? image;
  const template = original.cloneNode(true) as HTMLElement;
  const panoramaScene = image.closest<HTMLElement>('.panorama-scene');
  image.dataset.fallback = 'true';
  const fallback = document.createElement('div'); fallback.className = 'asset-fallback';
  const fallbackId = 'fallback-' + image.src.split('/').pop()?.replace(/\W/g,'');
  if (panoramaScene) {
    fallback.classList.add('panorama-fallback');
    panoramaScene.classList.add('has-image-fallback');
    const artwork = document.createElement('div');
    artwork.className = 'panorama-fallback-art';
    artwork.setAttribute('role','img');
    artwork.setAttribute('aria-label', 'Arrival, Unfolding and Trace remain connected by one continuous path. Simplified visual interpretation.');
    artwork.innerHTML = '<svg class="panorama-fallback-path panorama-fallback-path-desktop" viewBox="0 0 1500 1000" preserveAspectRatio="none" fill="none" aria-hidden="true"><path d="M115 870C330 935 330 560 645 595S1050 310 1210 215S1340 145 1390 75" stroke="#C5B49B" stroke-width="2"/></svg>' +
      '<svg class="panorama-fallback-path panorama-fallback-path-mobile" viewBox="0 0 400 600" preserveAspectRatio="none" fill="none" aria-hidden="true"><path d="M285 35C360 130 145 150 195 295S275 410 175 485S120 535 145 575" stroke="#C5B49B" stroke-width="1.3"/></svg>' +
      PHASES.map(phase => '<div class="panorama-fallback-print panorama-fallback-' + phase.id + '" data-fallback-phase="' + phase.id + '">' +
        imprintSVG(DEFAULT_SHARES, { id:fallbackId + '-' + phase.id, phase:phase.id, label:phase.name }) + '</div>').join('');
    fallback.append(artwork);
  } else {
    const artwork = document.createElement('div'); artwork.className = 'artwork';
    artwork.setAttribute('role','img');
    artwork.setAttribute('aria-label', image.alt + ' Simplified visual form.');
    artwork.innerHTML = imprintSVG(DEFAULT_SHARES, {id:fallbackId,label:image.alt});
    fallback.append(artwork);
  }
  const retry = document.createElement('button');
  retry.type = 'button'; retry.className = 'asset-retry'; retry.textContent = 'Try image again';
  retry.addEventListener('click', () => {
    if (retry.disabled) return;
    retry.disabled = true; retry.textContent = 'Trying image…'; retry.setAttribute('aria-busy','true');
    const resource = template.cloneNode(true) as HTMLElement;
    const candidate = resource instanceof HTMLImageElement ? resource : resource.querySelector<HTMLImageElement>('img')!;
    delete candidate.dataset.fallback;
    candidate.dataset.retrying = 'true';
    candidate.loading = 'eager';
    resource.classList.add('asset-retry-probe');
    let settled = false;
    const clean = () => {
      window.clearTimeout(timer);
      candidate.removeEventListener('load', loaded);
      candidate.removeEventListener('error', failed);
    };
    const failed = () => {
      if (settled) return;
      settled = true; clean(); resource.remove();
      retry.disabled = false; retry.textContent = 'Try image again'; retry.removeAttribute('aria-busy');
      announce('The image is still unavailable. The visual alternative remains available.');
    };
    const loaded = () => {
      if (settled) return;
      if (candidate.naturalWidth === 0) { failed(); return; }
      settled = true; clean();
      const restoreFocus = document.activeElement === retry;
      delete candidate.dataset.retrying;
      resource.classList.remove('asset-retry-probe');
      candidate.addEventListener('error', () => imageFailed(candidate));
      // Preserve the fallback until the same original URL has actually loaded.
      fallback.replaceWith(resource);
      panoramaScene?.classList.remove('has-image-fallback');
      resizeDirty = true; scrollDirty = true;
      announce('The image is available again.');
      if (restoreFocus) {
        const target = panoramaScene?.querySelector<HTMLElement>('[data-panorama]') ?? resource.closest('section')?.querySelector<HTMLElement>('button, a') ?? el('main');
        target?.focus({preventScroll:true});
      }
    };
    const timer = window.setTimeout(failed, 8000);
    candidate.addEventListener('load', loaded, {once:true});
    candidate.addEventListener('error', failed, {once:true});
    fallback.append(resource);
    if (candidate.complete) {
      if (candidate.naturalWidth > 0) loaded();
      else failed();
    }
  });
  fallback.append(retry);
  original.replaceWith(fallback);
  resizeDirty = true;
}
document.addEventListener('error', event => { if (event.target instanceof HTMLImageElement) imageFailed(event.target); }, true);
all<HTMLImageElement>('img').forEach(image => { if (image.complete && image.naturalWidth === 0) imageFailed(image); });
window.addEventListener('beforeunload', () => {
  saveState(storage, personal);
  if (downloadUrl) URL.revokeObjectURL(downloadUrl);
});
// Vite hot reload cleanup; shipped page retains the same single owner.
if (import.meta.hot) import.meta.hot.dispose(() => {
  cancelAnimationFrame(raf); lenis?.destroy(); transitions.destroy(); resizeObserver.disconnect(); sound.destroy();
});
