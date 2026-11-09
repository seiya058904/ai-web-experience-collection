import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { sceneAt, reducedSceneState, buoyancy, readPreference, WIND_LAYERS, MAX_PROGRESS } from './journey.ts';
import type { GroundLoad, WindLayer } from './journey.ts';
import { createKeepsakeSVG, createRouteDiagramSVG, keepsakeFilename } from './keepsake.ts';
import { balloonMark, fallbackScene, stillFrame } from './illustration.ts';
import { AirSound } from './audio.ts';
import { softText } from '../../shared/soft-swap.ts';
import type { JourneyScene } from './scene.ts';

type MotionMode = 'system' | 'full' | 'reduced';
type Preferences = { wind: WindLayer; motion: MotionMode; paused: boolean };
const STORAGE_KEY = 'aer.preferences.v1';
const q = <T extends HTMLElement>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing interface element: ${selector}`);
  return element;
};
const all = <T extends HTMLElement>(selector: string): T[] => Array.from(document.querySelectorAll<T>(selector));
const clamp = (n: number, a = 0, b = 1) => Math.max(a, Math.min(b, n));

function loadPreferences(): Preferences {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return { wind: readPreference(raw?.wind), motion: ['full', 'reduced'].includes(raw?.motion) ? raw.motion : 'system', paused: raw?.paused === true };
  } catch { return { wind: 'middle', motion: 'system', paused: false }; }
}
const preferences = loadPreferences();
function savePreferences(): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)); } catch { /* The journey still works without storage. */ }
}

const chapterNames = ['Look up', 'A shape for air', 'Between light and heavy', 'The ground lets go', 'The shadow goes first', 'The floors of the wind', 'A choice takes shape', 'In the same light', 'Back to the earth', 'Keep the sky'];
const sections = all<HTMLElement>('.chapter');
const canvas = q<HTMLCanvasElement>('#world-canvas');
const media = matchMedia('(prefers-reduced-motion: reduce)');
const motionSelect = q<HTMLSelectElement>('#motion-mode');
const menu = q<HTMLDialogElement>('#chapter-menu');
const about = q<HTMLDialogElement>('#about-dialog');
const sound = new AirSound();
let soundOn = false;
let soundRequest = 0;
let preview: WindLayer | undefined;
let shape: 'rest' | 'held' = 'rest';
let reduced = false;
let lenis: Lenis | null = null;
let scene: JourneyScene | null = null;
let sceneClass: (new (canvas: HTMLCanvasElement) => JourneyScene) | null = null;
let sceneFailure = false;
let sceneLoading = false;
let manualIllustration = new URLSearchParams(location.search).get('view') === 'illustrated';
let progress = 0;
let lastProgress = -1;
let lastChapter = -1;
let lastFallback = '';
let lastStats = 0;
let positions: number[] = [];
let lastTime = 0;
let ambientTime = 0;
let dirty = true;
let raf = 0;
let resizeRaf = 0;
let noticeTimer = 0;
let panoramaRequest = 0;
let panoramaNear = false;
let exportedUrl: string | null = null;
let userInteracted = false;
let beforeResizeProgress: number | null = null;
for (const eventName of ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const) {
  window.addEventListener(eventName, () => { userInteracted = true; }, { passive: true, capture: true, once: true });
}

function notify(message: string): void {
  const box = q('#notice');
  box.textContent = message;
  box.classList.add('visible');
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => box.classList.remove('visible'), 3500);
}

function measure(): void {
  const offset = innerWidth <= 680 ? 65 : 80;
  positions = sections.map((section, index) => index === 0 ? 0 : Math.max(0, section.offsetTop - offset));
  lenis?.resize();
  scene?.resize(innerWidth, innerHeight);
  document.body.dataset.viewport = `${innerWidth}x${innerHeight}`;
  dirty = true;
}

function progressAtScroll(): number {
  const y = Math.max(0, scrollY);
  let index = 0;
  while (index + 1 < positions.length && y >= positions[index + 1]) index++;
  const start = positions[index] ?? 0;
  const end = positions[index + 1] ?? Math.max(start + 1, document.documentElement.scrollHeight - innerHeight + 1);
  return Math.min(MAX_PROGRESS, index + clamp((y - start) / Math.max(1, end - start)));
}

function updateMotion(): void {
  reduced = preferences.motion === 'reduced' || (preferences.motion === 'system' && media.matches);
  document.body.classList.toggle('reduced', reduced);
  document.body.classList.toggle('motion-paused', preferences.paused);
  document.body.dataset.motion = reduced ? 'reduced' : 'full';
  motionSelect.value = preferences.motion;
  lenis?.destroy();
  lenis = null;
  if (!reduced) {
    lenis = new Lenis({ autoRaf: false, lerp: .18, smoothWheel: true, syncTouch: false, anchors: false, stopInertiaOnNavigate: true, prevent: node => node.hasAttribute('data-lenis-prevent') });
  }
  q('#pause-motion').setAttribute('aria-pressed', String(preferences.paused));
  q('#pause-motion').setAttribute('aria-label', preferences.paused ? 'Resume ambient motion' : 'Pause ambient motion');
  q('#pause-icon').setAttribute('d', preferences.paused ? 'm8 5 11 7-11 7Z' : 'M8 5v14M16 5v14');
  dirty = true;
  measure();
}

function closeDialog(dialog: HTMLDialogElement, trigger: HTMLElement): void {
  dialog.close();
  trigger.focus({ preventScroll: true });
}
q('#menu-open').addEventListener('click', () => menu.showModal());
q('#menu-close').addEventListener('click', () => closeDialog(menu, q('#menu-open')));
q('#about-open').addEventListener('click', () => about.showModal());
q('#about-close').addEventListener('click', () => closeDialog(about, q('#about-open')));
menu.addEventListener('close', () => q('#menu-open').focus({ preventScroll: true }));
about.addEventListener('close', () => q('#about-open').focus({ preventScroll: true }));
for (const dialog of [menu, about]) {
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
}

function jumpTo(index: number, push = true): void {
  if (!sections[index]) return;
  userInteracted = true;
  if (menu.open) menu.close();
  const id = sections[index].id;
  if (push && location.hash !== `#${id}`) history.pushState({ aerChapter: index }, '', `#${id}`);
  const target = positions[index];
  if (lenis) lenis.scrollTo(target, { duration: .65, lerp: undefined, onComplete: () => sections[index].querySelector<HTMLElement>('h1,h2')?.focus({ preventScroll: true }) });
  else {
    window.scrollTo({ top: target, behavior: 'instant' });
    sections[index].querySelector<HTMLElement>('h1,h2')?.focus({ preventScroll: true });
  }
  dirty = true;
}
document.addEventListener('click', event => {
  const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#ch-"]');
  if (!link || event.defaultPrevented || (event as MouseEvent).ctrlKey || (event as MouseEvent).metaKey) return;
  const index = sections.findIndex(section => `#${section.id}` === link.getAttribute('href'));
  if (index >= 0) { event.preventDefault(); jumpTo(index); }
});
window.addEventListener('popstate', () => {
  const index = sections.findIndex(section => `#${section.id}` === location.hash);
  lenis?.stop();
  lenis?.start();
  if (index >= 0) {
    if (lenis) lenis.scrollTo(positions[index], { immediate: true });
    else window.scrollTo({ top: positions[index], behavior: 'instant' });
  }
  dirty = true;
});
motionSelect.addEventListener('change', () => {
  preferences.motion = motionSelect.value as MotionMode;
  const oldProgress = progress;
  updateMotion();
  restoreProgress(oldProgress);
  savePreferences();
});
q('#pause-motion').addEventListener('click', () => {
  preferences.paused = !preferences.paused;
  updateMotion();
  savePreferences();
});
media.addEventListener('change', () => {
  const oldProgress = progress;
  updateMotion();
  restoreProgress(oldProgress);
});
q('#sound-toggle').addEventListener('click', async () => {
  const request = ++soundRequest;
  const next = !soundOn;
  soundOn = next;
  const button = q('#sound-toggle');
  button.setAttribute('aria-pressed', String(next));
  button.setAttribute('aria-label', next ? 'Turn ambient sound off' : 'Turn ambient sound on');
  button.querySelector('span')!.textContent = next ? 'Sound on' : 'Sound off';
  try {
    const playing = await sound.setEnabled(next);
    if (request !== soundRequest) return;
    soundOn = playing;
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-label', playing ? 'Turn ambient sound off' : 'Turn ambient sound on');
    button.querySelector('span')!.textContent = playing ? 'Sound on' : 'Sound off';
  } catch {
    soundOn = false;
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', 'Turn ambient sound on');
    button.querySelector('span')!.textContent = 'Sound off';
    notify('Sound is unavailable here. The whole journey is still yours.');
  }
});

for (const button of all<HTMLButtonElement>('[data-shape]')) {
  button.addEventListener('click', () => {
    shape = button.dataset.shape === 'held' ? 'held' : 'rest';
    for (const other of all('[data-shape]')) other.setAttribute('aria-pressed', String(other.dataset.shape === shape));
    q('#shape-rest').hidden = shape !== 'rest';
    q('#shape-held').hidden = shape !== 'held';
    q('#shape-caption').textContent = shape === 'rest' ? 'At rest, the fabric lies low. Its colors and connections still belong to the same balloon.' : 'Held open, the same light envelope contains a great volume. The basket is still on the ground.';
    dirty = true;
  });
}

q('#lab-balloon').innerHTML = balloonMark();
const warmth = q<HTMLInputElement>('#warmth');
function updateLab(): void {
  const selected = document.querySelector<HTMLInputElement>('input[name="ground-load"]:checked');
  const result = buoyancy(Number(warmth.value), (selected?.value ?? 'standard') as GroundLoad);
  q('#warmth-value').textContent = `${warmth.value} / 100`;
  q('#balance-result').textContent = result.label;
  q('#balance-description').textContent = result.state === 'heavy' ? 'The total weight is greater than the surrounding air can support.' : result.state === 'rising' ? 'The support is greater than the total weight: an upward tendency.' : 'The support and the total weight nearly meet.';
  q('#support-bar').style.height = `${100 / 1.25}%`;
  q('#weight-bar').style.height = `${clamp(result.totalWeight / 1.25) * 100}%`;
  q('#balance-marker').style.background = result.state === 'heavy' ? '#b38070' : result.state === 'rising' ? '#75836e' : '#707d9a';
  q('.lab-panel').dataset.result = result.state;
  q('.lab-panel').dataset.forces = JSON.stringify({ support: result.grossBuoyancy, weight: result.totalWeight, insideAir: result.internalAirWeight, structure: result.structureWeight, load: result.payloadWeight });
}
warmth.addEventListener('input', updateLab);
for (const radio of all<HTMLInputElement>('input[name="ground-load"]')) radio.addEventListener('change', updateLab);
for (const button of all<HTMLButtonElement>('[data-lab-preset]')) {
  button.addEventListener('click', () => {
    warmth.value = button.dataset.labPreset!;
    q<HTMLInputElement>('input[name="ground-load"][value="standard"]').checked = true;
    updateLab();
  });
}
q('#lab-reset').addEventListener('click', () => {
  warmth.value = '64';
  q<HTMLInputElement>('input[name="ground-load"][value="standard"]').checked = true;
  updateLab();
});

const branchCopy: Record<WindLayer, { lead: string; story: string; panorama: string; caption: string; alt: string }> = {
  low: { lead: 'The hedgerows keep us close to the texture of the earth.', story: 'The lower air carries us east along the field edges. Two rows of trees frame Hedgerow Meadow, a quiet opening near the pale path.', panorama: 'k-08-low.webp', caption: 'Beside the paired rows of trees.', alt: 'A basket-height view of Hedgerow Meadow, framed by two rows of trees, with sage fields and a curved pale path.' },
  middle: { lead: 'Beyond the village bend, a softer green opens.', story: 'The middle air carries us north. The roofs stay to one side as Willow Bend becomes a place we could touch.', panorama: 'k-08.webp', caption: 'Past the village, by the willows.', alt: 'Basket-height morning view toward Willow Bend, with village roofs, gray-green fields and distant indigo hills.' },
  high: { lead: 'The upper air opens a little more of the world.', story: 'The higher wind carries us northwest, past the close fields. Far Meadow opens beside a distant oval grove, with room for the morning all around.', panorama: 'k-08-high.webp', caption: 'The open field beside a distant grove.', alt: 'A high, wide morning view toward Far Meadow, with broad pale fields, a distant oval grove and indigo ridges.' },
};

function windProfile(layer: WindLayer): string {
  const rows: WindLayer[] = ['high', 'middle', 'low'];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 400" aria-hidden="true"><defs><marker id="wind-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M1 1 6 4 1 7" fill="none" stroke="#707d9a" stroke-width="1"/></marker></defs>${rows.map((row, i) => {
    const y = 53 + i * 100;
    const active = row === layer;
    const arrow = row === 'high' ? `M440 ${y + 35}l-90-22` : row === 'middle' ? `M350 ${y + 35}l90-22` : `M345 ${y + 20}h100`;
    return `<g opacity="${active ? 1 : .48}"><path d="M20 ${y + 60}H540" stroke="#a3acb6" stroke-width=".7"/><text x="28" y="${y + 17}" font-family="Arial,sans-serif" font-size="13" fill="#334253">${WIND_LAYERS[row].label}</text><text x="28" y="${y + 37}" font-family="Arial,sans-serif" font-size="9" fill="#68767c">${row === 'high' ? 'NORTHWEST' : row === 'middle' ? 'NORTH' : 'EAST'}</text><path d="${arrow}" stroke="#707d9a" fill="none" stroke-width="1.6" marker-end="url(#wind-arrow)"/>${active ? `<circle cx="270" cy="${y + 16}" r="19" fill="#eab7a1"/><path d="M253 ${y + 12}Q270 ${y - 17} 287 ${y + 12}Q283 ${y + 27} 274 ${y + 36}H266Q257 ${y + 27} 253 ${y + 12}Z" fill="#eab7a1" stroke="#ad8c81" stroke-width=".8"/><path d="M270 ${y - 3}Q259 ${y + 16} 268 ${y + 36}H272Q281 ${y + 16} 270 ${y - 3}Z" fill="#f6f1e8"/><path d="M265 ${y + 38}l1 6h8l1-6" stroke="#4c5559" fill="#ad8455" stroke-width=".8"/>` : ''}</g>`;
  }).join('')}<path d="M15 365Q110 348 185 360T350 355T545 362" fill="none" stroke="#a6b5a0" stroke-width="16"/><text x="280" y="395" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="#68767c">Different air, a shared starting point.</text></svg>`;
}

async function loadPanorama(): Promise<void> {
  const target = preferences.wind;
  const request = ++panoramaRequest;
  const image = q<HTMLImageElement>('#panorama-image');
  const plate = q('#panorama-plate');
  image.hidden = false;
  image.style.visibility = 'hidden';
  image.alt = branchCopy[target].alt;
  q('#panorama-fallback').innerHTML = fallbackScene(sceneAt(7.55, target), { plate: true, mobile: innerWidth <= 680, instance: 'panorama' });
  plate.dataset.branch = target;
  plate.setAttribute('aria-busy', 'true');
  if (!panoramaNear) return;
  const source = `${import.meta.env.BASE_URL}aer/art/${branchCopy[target].panorama}`;
  const candidate = new Image();
  candidate.src = source;
  try {
    await candidate.decode();
    if (request !== panoramaRequest || preferences.wind !== target) return;
    image.src = source;
    image.alt = branchCopy[target].alt;
    image.style.visibility = 'visible';
    plate.dataset.resource = 'ready';
  } catch {
    if (request !== panoramaRequest || preferences.wind !== target) return;
    image.style.visibility = 'hidden';
    plate.dataset.resource = 'illustrated';
  } finally {
    if (request === panoramaRequest) plate.setAttribute('aria-busy', 'false');
  }
}

function updatePreview(): void {
  for (const button of all('[data-preview]')) button.setAttribute('aria-pressed', String(button.dataset.preview === preview));
  q('#preview-route').innerHTML = createRouteDiagramSVG(preferences.wind, { compact: true, preview });
  q('#preview-caption').textContent = preview ? `Preview: ${WIND_LAYERS[preview].label} to ${WIND_LAYERS[preview].destination}. Your journey stays with the ${WIND_LAYERS[preferences.wind].label.toLowerCase()}.` : 'Your selected route is shown. Previewing never changes your journey.';
}

function renderSelection(): void {
  const layer = preferences.wind;
  const definition = WIND_LAYERS[layer];
  const copy = branchCopy[layer];
  for (const button of all('[data-wind]')) button.setAttribute('aria-pressed', String(button.dataset.wind === layer));
  for (const element of all('[data-current-layer]')) element.textContent = definition.label;
  for (const element of all('[data-current-destination]')) element.textContent = definition.destination;
  q('#wind-choice').textContent = `${definition.label} chosen. Your journey will reach ${definition.destination}.`;
  q('#wind-default-note').textContent = layer === 'middle' ? 'No choice needed to continue: the middle layer is already waiting for you.' : 'Your chosen layer stays with you as you continue.';
  q('#route-lead').textContent = copy.lead;
  q('#route-story').textContent = copy.story;
  q('#landing-lead').textContent = `The grass at ${definition.destination} rises to meet us.`;
  q('#landing-caption').innerHTML = `${definition.destination}.<br/>The route you chose has brought you here.`;
  q('#panorama-caption').textContent = copy.caption;
  q('#wind-profile').innerHTML = windProfile(layer);
  q('#decision-route').innerHTML = createRouteDiagramSVG(layer, { compact: true });
  q('#look-back-route').innerHTML = createRouteDiagramSVG(layer, { compact: true });
  q('#keepsake-preview').innerHTML = createKeepsakeSVG(layer);
  q('#keepsake-preview').dataset.layer = layer;
  q('#keepsake-preview').dataset.destination = definition.destination;
  q('#ending-scene').innerHTML = fallbackScene(sceneAt(9.5, layer), { instance: 'ending' });
  q('#shadow-stills').innerHTML = [4.15, 4.8].map((p, i) => `<figure>${stillFrame(p, 'middle', i ? 'Across the next slope' : 'Beside the pale path')}<figcaption>${i ? 'The same sun, another part of the terrain' : 'Our shared beginning, before the wind choice'}</figcaption></figure>`).join('');
  q('#lift-stills').innerHTML = [3, 3.8].map((p, i) => `<figure>${stillFrame(p, 'middle', i ? 'Clear of the ground' : 'In contact')}<figcaption>${i ? 'The ground lets go' : 'Before the rise'}</figcaption></figure>`).join('');
  q('#landing-stills').innerHTML = [8.15, 8.72, 8.9].map((p, i) => `<figure>${stillFrame(p, layer, ['Approach', 'Almost touching', 'Settled'][i])}<figcaption>${['Approach', 'Contact approaches', 'Settled'][i]}</figcaption></figure>`).join('');
  document.body.dataset.selection = layer;
  updatePreview();
  void loadPanorama();
  dirty = true;
}
for (const button of all<HTMLButtonElement>('[data-wind]')) {
  button.addEventListener('click', () => {
    preferences.wind = readPreference(button.dataset.wind);
    preview = undefined;
    savePreferences();
    renderSelection();
  });
}
for (const button of all<HTMLButtonElement>('[data-preview]')) {
  button.addEventListener('click', () => { preview = readPreference(button.dataset.preview); updatePreview(); });
}
q('#clear-preview').addEventListener('click', () => { preview = undefined; updatePreview(); });
q('#compare-toggle').addEventListener('click', () => {
  const open = q('#compare-content').hidden;
  q('#compare-content').hidden = !open;
  q('#compare-toggle').setAttribute('aria-expanded', String(open));
  measure();
});
q('#look-back').addEventListener('click', () => {
  const open = q('#look-back-route').hidden;
  q('#look-back-route').hidden = !open;
  q('#look-back').setAttribute('aria-expanded', String(open));
  measure();
});

function download(blob: Blob, filename: string): void {
  if (exportedUrl) URL.revokeObjectURL(exportedUrl);
  exportedUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = exportedUrl;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  const url = exportedUrl;
  window.setTimeout(() => { URL.revokeObjectURL(url); if (exportedUrl === url) exportedUrl = null; }, 60000);
}
q('#save-svg').addEventListener('click', () => {
  const selected = preferences.wind;
  const filename = keepsakeFilename(selected, 'svg');
  download(new Blob([createKeepsakeSVG(selected)], { type: 'image/svg+xml;charset=utf-8' }), filename);
  q('#export-status').textContent = `Saved ${filename} — ${WIND_LAYERS[selected].destination}, just as you chose it.`;
});
q('#save-png').addEventListener('click', async () => {
  const selected = preferences.wind;
  const button = q<HTMLButtonElement>('#save-png');
  button.disabled = true;
  q('#export-status').textContent = 'Preparing your keepsake…';
  const vector = new Blob([createKeepsakeSVG(selected)], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(vector);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const drawing = document.createElement('canvas');
    drawing.width = 1440;
    drawing.height = 1800;
    const context = drawing.getContext('2d');
    if (!context) throw new Error('Image export is unavailable.');
    context.drawImage(image, 0, 0, drawing.width, drawing.height);
    const blob = await new Promise<Blob>((resolve, reject) => drawing.toBlob(value => value ? resolve(value) : reject(new Error('Export failed.')), 'image/png'));
    const filename = keepsakeFilename(selected, 'png');
    download(blob, filename);
    q('#export-status').textContent = `Saved ${filename} — ${WIND_LAYERS[selected].destination}, in a 1440 × 1800 image.`;
  } catch {
    q('#export-status').textContent = 'PNG export is unavailable in this browser. Save the SVG instead; it contains the same journey.';
  } finally { URL.revokeObjectURL(url); button.disabled = false; }
});

const panoramaObserver = new IntersectionObserver(entries => {
  if (entries.some(entry => entry.isIntersecting)) {
    panoramaNear = true;
    void loadPanorama();
    panoramaObserver.disconnect();
  }
}, { rootMargin: '900px' });
panoramaObserver.observe(q('#ch-08'));

for (const image of all<HTMLImageElement>('img:not(#panorama-image)')) {
  image.addEventListener('error', () => {
    if (image.id === 'hero-image') {
      q('.hero').classList.add('image-failed');
      q('.hero-fallback').innerHTML = fallbackScene(sceneAt(0, 'middle'), { mobile: innerWidth <= 680, instance: 'hero' });
    } else {
      const frame = image.parentElement;
      frame?.classList.add('image-unavailable');
      image.style.visibility = 'hidden';
    }
  });
}

const layoutObserver = new ResizeObserver(() => {
  if (resizeRaf) return;
  resizeRaf = requestAnimationFrame(() => { measure(); resizeRaf = 0; });
});
for (const section of sections) layoutObserver.observe(section);

async function initializeScene(): Promise<void> {
  if (sceneLoading || scene || sceneFailure || manualIllustration) return;
  sceneLoading = true;
  try {
    // Detect a genuinely unavailable GPU before downloading the larger renderer.
    const context = canvas.getContext('webgl2', { antialias: true, alpha: false, powerPreference: 'low-power' });
    if (!context) {
      sceneFailure = true;
      document.body.dataset.renderer = 'illustrated';
      canvas.dataset.ready = 'false';
      return;
    }
    const module = await import('./scene.ts');
    sceneClass = module.JourneyScene;
    scene = new sceneClass(canvas);
    scene.resize(innerWidth, innerHeight);
    document.body.dataset.renderer = 'webgl';
    canvas.dataset.ready = 'true';
    performance.mark('aer-world-ready');
  } catch {
    sceneFailure = true;
    document.body.dataset.renderer = 'illustrated';
    canvas.dataset.ready = 'false';
  } finally { sceneLoading = false; dirty = true; }
}
canvas.addEventListener('webglcontextlost', event => {
  event.preventDefault();
  document.body.dataset.renderer = 'illustrated';
  canvas.dataset.ready = 'false';
  sceneFailure = true;
  lastFallback = '';
  dirty = true;
});
canvas.addEventListener('webglcontextrestored', () => {
  if (manualIllustration) return;
  try {
    scene?.dispose();
    scene = sceneClass ? new sceneClass(canvas) : null;
    scene?.resize(innerWidth, innerHeight);
    sceneFailure = !scene;
    document.body.dataset.renderer = scene ? 'webgl' : 'illustrated';
    canvas.dataset.ready = String(Boolean(scene));
    dirty = true;
  } catch { sceneFailure = true; scene = null; }
});

function restoreProgress(value: number): void {
  const p = clamp(value, 0, MAX_PROGRESS);
  const index = Math.floor(p);
  const start = positions[index] || 0;
  const end = positions[index + 1] ?? Math.max(start + 1, document.documentElement.scrollHeight - innerHeight);
  const target = start + (end - start) * (p - index);
  if (lenis) lenis.scrollTo(target, { immediate: true });
  else window.scrollTo({ top: target, behavior: 'instant' });
  dirty = true;
}

function tick(time: number): void {
  if (document.hidden) { raf = 0; return; }
  const dt = lastTime ? Math.min((time - lastTime) / 1000, .05) : 0;
  lastTime = time;
  if (!preferences.paused && !reduced) ambientTime += dt;
  lenis?.raf(time);
  progress = progressAtScroll();
  const state = sceneAt(progress, preferences.wind);
  const index = Math.floor(progress);
  const changed = Math.abs(progress - lastProgress) > .000015;
  if (changed || dirty) {
    canvas.dataset.state = JSON.stringify(state);
    q('#journey-progress').style.width = `${Math.min(100, progress / 9.8 * 100)}%`;
    q('.site-header').classList.toggle('scrolled', scrollY > 60);
    if (index !== lastChapter) {
      softText(q('#current-number'), String(index + 1).padStart(2, '0'), { instant: reduced });
      softText(q('#current-label'), chapterNames[index], { instant: reduced });
      document.body.dataset.chapter = String(index + 1);
      for (const link of all<HTMLAnchorElement>('#chapter-links a')) {
        if (link.hash === `#${sections[index].id}`) link.setAttribute('aria-current', 'step');
        else link.removeAttribute('aria-current');
      }
      lastChapter = index;
    }
  }
  const liveVisible = [3, 6, 8].includes(index) || ([2, 5, 7].includes(index) && state.local > .7);
  if (scene && !sceneFailure && !manualIllustration) {
    if (dirty || changed || (liveVisible && !preferences.paused && !reduced)) {
      try { scene.render(state, { reduced, paused: preferences.paused, shape, look: 0, time: ambientTime * 1000, mobile: innerWidth <= 680 }); }
      catch { sceneFailure = true; document.body.dataset.renderer = 'illustrated'; lastFallback = ''; }
    }
    if (time - lastStats > 2000) { canvas.dataset.resources = JSON.stringify(scene.stats()); lastStats = time; }
  }
  if (sceneFailure || manualIllustration || !scene) {
    const visualState = reduced ? reducedSceneState(state) : state;
    const key = `${reduced ? visualState.progress : Math.floor(progress * 25)}:${visualState.layer}:${innerWidth <= 680}:${reduced}`;
    if (key !== lastFallback || dirty) {
      q('#world-fallback').innerHTML = fallbackScene(visualState, { mobile: innerWidth <= 680, instance: 'world' });
      q('#world-fallback').dataset.visualProgress = String(visualState.progress);
      lastFallback = key;
    }
  }
  lastProgress = progress;
  dirty = false;
  raf = requestAnimationFrame(tick);
}

window.addEventListener('resize', () => {
  beforeResizeProgress ??= progress;
  cancelAnimationFrame(resizeRaf);
  resizeRaf = requestAnimationFrame(() => {
    measure();
    if (beforeResizeProgress !== null) restoreProgress(beforeResizeProgress);
    beforeResizeProgress = null;
    resizeRaf = 0;
    if (panoramaNear) q('#panorama-fallback').innerHTML = fallbackScene(sceneAt(7.55, preferences.wind), { plate: true, mobile: innerWidth <= 680, instance: 'panorama' });
    lastFallback = '';
  });
});
window.addEventListener('orientationchange', () => { dirty = true; });
document.addEventListener('visibilitychange', () => {
  void sound.setHidden(document.hidden).catch(() => {});
  if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
  else { lastTime = 0; dirty = true; lenis?.resize(); if (!raf) raf = requestAnimationFrame(tick); }
});
window.addEventListener('pagehide', () => {
  try { sessionStorage.setItem('aer-position', JSON.stringify({ progress, hash: location.hash })); } catch { /* Optional restoration. */ }
  cancelAnimationFrame(raf);
  raf = 0;
  void sound.setHidden(true).catch(() => {});
});
window.addEventListener('pageshow', event => {
  if (event.persisted) { measure(); lastTime = 0; dirty = true; if (!raf) raf = requestAnimationFrame(tick); }
});

// The first real scene and its interactions do not wait for WebGL or large artwork.
document.body.dataset.renderer = 'illustrated';
canvas.dataset.ready = 'false';
updateLab();
updateMotion();
renderSelection();
measure();
raf = requestAnimationFrame(tick);
performance.mark('aer-interactive');

const hero = q<HTMLImageElement>('#hero-image');
void hero.decode().then(() => {
  performance.mark('aer-hero-visual');
  document.body.dataset.heroReady = 'true';
}).catch(() => {});

void document.fonts.ready.then(() => {
  const currentProgress = progress;
  measure();
  if (userInteracted) { restoreProgress(currentProgress); return; }
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (navigation?.type === 'reload') {
    try {
      const previous = JSON.parse(sessionStorage.getItem('aer-position') || 'null');
      if (previous && previous.hash === location.hash && typeof previous.progress === 'number') restoreProgress(previous.progress);
    } catch { /* Let native restoration stand. */ }
  } else if (location.hash) {
    const index = sections.findIndex(section => `#${section.id}` === location.hash);
    if (index >= 0) {
      if (lenis) lenis.scrollTo(positions[index], { immediate: true });
      else window.scrollTo({ top: positions[index], behavior: 'instant' });
    }
  }
});

if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(() => void initializeScene(), { timeout: 1400 });
else setTimeout(() => void initializeScene(), 300);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cancelAnimationFrame(raf);
    cancelAnimationFrame(resizeRaf);
    lenis?.destroy();
    scene?.dispose();
    sound.dispose();
    panoramaObserver.disconnect();
    layoutObserver.disconnect();
  });
}
