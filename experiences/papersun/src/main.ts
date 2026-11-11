import Lenis from 'lenis';
import { softText } from '../../shared/soft-swap.ts';
import { applyReveal } from '../../shared/soft-reveal.ts';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import 'lenis/dist/lenis.css';
import './style.css';
import { CHAPTERS, HERO, TOOLS, TRANSITIONS } from './story.ts';
import { FRAGMENTS, PIECE_IDS, sunSvg, fragmentSvg, type PieceId } from './fragments.ts';
import { evaluateStory, initialStoryMemory, sanitizeStoryMemory, smoothstep, clamp01, type StoryMemory, type ChapterMeasure } from './story-state.ts';
import { SceneRenderer, frameFor } from './scene-renderer.ts';
import { warmNeighbours, warmReadingCache } from './assets.ts';
import { createPaperAudio } from './audio.ts';
import { arrow, closeIcon, brandIcon } from './icons.ts';
import { renderTransitionProp, windowHandoff } from './transition-props.ts';

const $ = <T extends HTMLElement = HTMLElement>(selector: string, root: ParentNode = document) => root.querySelector<T>(selector)!;
const all = <T extends HTMLElement = HTMLElement>(selector: string, root: ParentNode = document) => [...root.querySelectorAll<T>(selector)];
const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const number = (n: number) => String(n).padStart(2, '0');
const STORE = 'papersun:story:v1';
let memory = initialStoryMemory();
try { memory = sanitizeStoryMemory(JSON.parse(localStorage.getItem(STORE) ?? 'null')); } catch { /* Storage is optional. */ }
const media = matchMedia('(prefers-reduced-motion: reduce)');
let motion = media.matches ? 'reduced' : 'on';
try { const value = localStorage.getItem('papersun:motion'); if (value === 'on' || value === 'reduced') motion = value; } catch { /* Keep the system preference. */ }
let revision = 0;
let dirty = true;
let measures: ChapterMeasure[] = [];
let measuredHeight = innerHeight;
let activeIndex = -1;
let lastFocus: HTMLElement | null = null;
let dialogKind = '';
let previewPiece: PieceId = 'A';
let heroClose = false;
let heroLightStart: number | undefined;
let heroHasLeft = false;
let userMovedBeforeFonts = false;
let stagedReading: HTMLElement | null = null;
let disposed = false;
const audio = createPaperAudio();
const action = (id: string, label: string, extra = '') => `<button class="text-action" data-action="${id}" ${extra}><span>${label}</span>${arrow}</button>`;
const smallButton = (id: string, label: string, extra = '') => `<button class="quiet-button" data-action="${id}" ${extra}>${label}</button>`;

function controls(index: number): string {
  switch (index) {
    case 0: return action('closer', heroClose ? 'Restore the stage' : 'Look closer');
    case 1: return action('desk', 'Inspect the desk');
    case 2: return action('preview', 'Preview the pieces');
    case 3: return action('trace', memory.tracedRoute ? 'Route traced' : 'Trace the route') + smallButton('reset-route', 'Reset scene');
    case 4: return action('repair', memory.marketRepaired ? 'Lantern repaired' : 'Repair the lantern') + smallButton('reset-market', 'Reset scene');
    case 5: return action('wheel', memory.wheelSteady ? 'Release the wheel' : 'Steady the wheel') + smallButton('reset-wheel', 'Reset scene');
    case 6: return action('shade', memory.shadeLifted ? 'Lower the paper shade' : 'Lift the paper shade') + smallButton('reset-shade', 'Reset scene');
    case 7: return action('inventory', 'Review pieces');
    case 8: return `<div class="assembly-controls">${PIECE_IDS.map(id => `<button class="piece-button ${memory.placed.includes(id) ? 'is-placed' : ''}" data-action="place" data-piece="${id}" aria-pressed="${memory.placed.includes(id)}">${fragmentSvg(id, { decorative: true, size: 42 })}<span>${memory.placed.includes(id) ? `Remove piece ${id}` : `Place piece ${id}`}</span></button>`).join('')}</div><div class="repair-options">${smallButton('seams', 'Show the seams', `aria-pressed="${memory.seamsVisible}"`)}${smallButton('reset-repair', 'Reset scene')}${action('lift', 'Lift the sun', memory.placed.length < 3 ? 'disabled' : '')}</div>`;
    case 9: return action('daylight', memory.daylight ? 'Night view' : 'Day view') + smallButton('return-table', 'Return to the worktable');
    case 10: return action('chapters', 'Explore the chapters again') + smallButton('again', 'Begin again');
    default: return '';
  }
}

function feedback(index: number): string {
  if (index === 3) return memory.tracedRoute ? 'From the attic sill, over three roof pins, to the market awning. A way out. A way home.' : 'The thread waits at the attic sill.';
  if (index === 4) return memory.marketRepaired ? 'Piece found: A. The lantern holds its light again.' : 'A torn wick is keeping one lantern dark.';
  if (index === 5) return memory.wheelSteady ? 'Piece found: B. For a moment, even the wind listens.' : memory.found.includes('B') ? 'The wheel is free again. Piece B stays safely with you.' : 'The second piece is caught behind the turning paper blades.';
  if (index === 6) return memory.shadeLifted ? 'Piece found: C. The dark was keeping it safe.' : memory.found.includes('C') ? 'The shade is lowered. Piece C stays safely with you.' : 'A small golden edge waits behind the blue paper shade.';
  if (index === 7) return memory.found.length === 3 ? 'Three distinct pieces, carried separately. The thread leads home.' : 'Read freely. Your own discoveries are kept in Review pieces.';
  if (index === 8) return memory.placed.length === 3 ? 'Three pieces. One exact circle. The seams belong to its story.' : `${memory.placed.length} of 3 pieces placed. You may try the repair even if you skipped the journey.`;
  if (index === 9) return memory.sunLifted ? 'Your repaired sun is home. Its red stitches are still visible.' : 'Mira has raised the sun. Visit the worktable to make your own repair.';
  return '';
}

function chapterMarkup(index: number): string {
  const ch = CHAPTERS[index];
  if (index === 0) return `<section class="chapter opening" id="${ch.id}" aria-labelledby="title-${ch.id}" data-chapter="${index}">
    <div class="hero-reading"><h1 id="title-${ch.id}" tabindex="-1">The sky has<br>lost its <em>sun.</em></h1><p class="hero-lead">${HERO.lead}</p><a class="text-action hero-cta" href="#ch-02"><span>${HERO.action}</span>${arrow}</a></div>
    <div class="opening-note reading-copy"><div class="chapter-mark"><span>01</span><span>${ch.title}</span></div><h2>${ch.heading}</h2><p class="lead">${ch.lead}</p><div class="beats"><p>${ch.beats[0]}</p><p>${ch.beats[1]}</p></div><div class="chapter-controls" data-controls="0">${controls(0)}</div></div>
    <div class="opening-credit"><span>A fable cut from light</span><span class="scroll-hint">Scroll to begin <span aria-hidden="true">↓</span></span></div></section>`;
  return `<section class="chapter chapter-${index}" id="${ch.id}" aria-labelledby="title-${ch.id}" data-chapter="${index}"><div class="reading-copy"><div class="chapter-mark"><span>${number(ch.number)}</span><span>${ch.title}</span></div><h2 id="title-${ch.id}" tabindex="-1">${ch.heading}</h2><p class="lead">${ch.lead}</p><div class="chapter-controls" data-controls="${index}">${controls(index)}</div><p class="scene-feedback" data-feedback="${index}">${feedback(index)}</p><div class="beats"><p>${ch.beats[0]}</p><p>${ch.beats[1]}</p></div>${index === 10 ? `<div class="memory-links"><span>Three places that kept the light</span><a href="#ch-05">Lantern Market ${arrow}</a><a href="#ch-06">Wind Hill ${arrow}</a><a href="#ch-07">Shadow Valley ${arrow}</a></div><p class="end-note">For everything that can be mended.<br>And everything that deserves a little light.</p>` : `<a class="next-chapter" href="#${CHAPTERS[index + 1].id}">Continue <span>${number(index + 2)}</span>${arrow}</a>`}</div></section>`;
}

$('#app').innerHTML = `<a class="skip-link" href="#ch-02">Skip to the story</a>
  <div id="theatre" aria-hidden="true"><div id="scene-from" class="scene"></div><div id="scene-to" class="scene"></div><div id="practical-light"></div><svg id="transition-edge" viewBox="0 0 1000 1000" preserveAspectRatio="none"><path id="edge-paper"/><path id="edge-thread"/></svg><div id="transition-props"></div><div id="journey-sun"></div><div class="reading-shade"></div><div class="stage-grain"></div></div>
  <header class="site-header"><a class="brand" href="#ch-01" aria-label="PAPERSUN — Back to beginning">${brandIcon}<span>PAPERSUN</span></a><nav aria-label="Main navigation"><a class="collection-return" href="${import.meta.env.BASE_URL}#world-papersun" aria-label="Return to Collection" title="Return to Collection"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7"/></svg><span>Collection</span></a><button data-action="chapters">Chapters <span class="menu-lines" aria-hidden="true"></span></button><button class="about-trigger" data-action="about">About this experience</button></nav></header>
  <main id="story">${CHAPTERS.map((_, i) => chapterMarkup(i)).join('')}</main>
  <nav class="chapter-rail" aria-label="Chapter shortcuts">${CHAPTERS.map((c, i) => `<a href="#${c.id}" aria-label="Chapter ${c.number}: ${c.title}" data-rail="${i}"><span>${number(c.number)}</span><i></i></a>`).join('')}</nav>
  <footer class="experience-toolbar"><div class="reading-position" aria-label="Current chapter"><span id="chapter-count">01 / 11</span><span id="chapter-name">The Missing Circle</span></div><div class="preferences"><button data-action="motion" id="motion-control">Motion: ${motion === 'on' ? 'On' : 'Reduced'}</button><button data-action="sound" id="sound-control">Sound: Off</button><button class="inventory-toggle" data-action="inventory" aria-label="Review pieces"><span class="inventory-minis" aria-hidden="true">${PIECE_IDS.map(id => `<i data-inventory="${id}"></i>`).join('')}</span><span id="piece-count">${memory.found.length} / 3</span></button></div></footer>
  <div class="story-progress" aria-hidden="true"><span id="progress-fill"></span></div>
  <div id="recovery" class="recovery" hidden><p>This scene could not load. The story remains available in still view.</p><div>${smallButton('retry', 'Retry')}${smallButton('stills', 'View as stills')}</div></div>
  <p class="sr-only" role="status" aria-live="polite" id="announcer"></p>
  <dialog id="story-dialog" aria-labelledby="dialog-title"><div class="dialog-top"><span class="dialog-brand">PAPERSUN</span><button class="close-dialog" data-action="close" aria-label="Close">${closeIcon}<span>Close</span></button></div><div id="dialog-body"></div></dialog>`;

const sections = all<HTMLElement>('.chapter');
const from = new SceneRenderer($('#scene-from'), () => { dirty = true; });
const to = new SceneRenderer($('#scene-to'), () => { dirty = true; });
const sun = $('#journey-sun');
const dialog = $<HTMLDialogElement>('#story-dialog');
const html = document.documentElement;
html.dataset.motion = motion;
gsap.registerPlugin(ScrollTrigger);
const lenis = new Lenis({ autoRaf: false, smoothWheel: motion === 'on', syncTouch: false, lerp: .13, anchors: false, prevent: node => node.closest('dialog') !== null });
lenis.on('scroll', () => { ScrollTrigger.update(); dirty = true; });
const coordinator = ScrollTrigger.create({ trigger: '#story', start: 'top top', end: 'bottom bottom', onUpdate: () => { dirty = true; } });
gsap.ticker.lagSmoothing(0);

function measure(preserveLocation = false): void {
  const before = preserveLocation && measures.length ? evaluateStory({ scrollY: window.scrollY, viewport: { width: innerWidth, height: measuredHeight }, chapters: measures, selectedMode: motion as 'on' | 'reduced' }) : null;
  const fraction = before ? clamp01((window.scrollY - measures[before.activeIndex].top) / measures[before.activeIndex].height) : 0;
  from.layout(innerWidth, innerHeight); to.layout(innerWidth, innerHeight);
  // Stage layout publishes portrait reading gaps. Measure after those gaps
  // settle so hashes, resize and transitions share the resulting DOM lengths.
  measures = sections.map(section => ({ top: section.offsetTop, height: section.offsetHeight }));
  measuredHeight = innerHeight;
  lenis.resize(); coordinator.refresh(); dirty = true;
  if (before) {
    const y = before.transition ? measures[before.transition.to].top - innerHeight + innerHeight * before.transition.progress : measures[before.activeIndex].top + measures[before.activeIndex].height * fraction;
    lenis.scrollTo(y, { immediate: true });
  }
}
function announce(message: string): void { $('#announcer').textContent = message; }
function save(): void {
  revision++; dirty = true;
  try { localStorage.setItem(STORE, JSON.stringify(memory)); } catch { /* The story works without persistent storage. */ }
  for (let i = 0; i < CHAPTERS.length; i++) {
    const container = $(`[data-controls="${i}"]`);
    const focused = document.activeElement as HTMLElement | null;
    const focusAction = focused && container.contains(focused) ? focused.dataset.action : undefined;
    const focusPiece = focused?.dataset.piece;
    container.innerHTML = controls(i);
    if (focusAction) container.querySelector<HTMLElement>(`[data-action="${focusAction}"]${focusPiece ? `[data-piece="${focusPiece}"]` : ''}`)?.focus({ preventScroll: true });
    const text = $(`[data-feedback="${i}"]`); if (text) text.textContent = feedback(i);
  }
  $('#piece-count').textContent = `${memory.found.length} / 3`;
  for (const id of PIECE_IDS) $(`[data-inventory="${id}"]`).classList.toggle('found', memory.found.includes(id));
  if (dialog.open && dialogKind === 'inventory') renderInventory();
  measure();
}
function findPiece(id: PieceId): void {
  if (!memory.found.includes(id)) { memory.found.push(id); memory.found.sort(); audio.chime('found'); }
}
function setMotion(value: string): void {
  motion = value === 'reduced' ? 'reduced' : 'on'; html.dataset.motion = motion;
  lenis.options.smoothWheel = motion === 'on';
  lenis.scrollTo(window.scrollY, { immediate: true });
  $('#motion-control').textContent = `Motion: ${motion === 'on' ? 'On' : 'Reduced'}`;
  try { localStorage.setItem('papersun:motion', motion); } catch { /* Optional. */ }
  dirty = true;
  announce(motion === 'reduced' ? 'Motion reduced. Every chapter and action remains available.' : 'Motion is on.');
}
function navigate(index: number, updateHistory = true, immediate = false): void {
  if (dialog.open) closeDialog(false);
  const chapter = sections[Math.max(0, Math.min(10, index))];
  if (!chapter) return;
  heroClose = false;
  $('[data-action="closer"] span').textContent = 'Look closer';
  const target = chapter.offsetTop;
  if (updateHistory && location.hash !== `#${chapter.id}`) history.pushState({ chapter: chapter.id }, '', `#${chapter.id}`);
  const heading = chapter.querySelector<HTMLElement>('[tabindex="-1"]')!;
  const focus = () => { heading.focus({ preventScroll: true }); dirty = true; };
  lenis.scrollTo(target, { immediate: immediate || motion === 'reduced', duration: .9, onComplete: focus });
  if (immediate || motion === 'reduced') focus();
  dirty = true;
}
function resolveHash(immediate = true): void {
  let hash: string;
  try { hash = decodeURIComponent(location.hash.slice(1)); }
  catch { return; /* A malformed URL fragment must not break navigation. */ }
  if (!hash) { navigate(0, false, immediate); return; }
  // Exact-position hashes are useful for revisiting a transition without replay.
  const transition = /^tr-(\d{2})-(\d{2})@(\d{1,3})$/.exec(hash);
  if (transition) {
    const index = Number(transition[1]) - 1;
    if (index >= 0 && index < 10 && Number(transition[2]) === index + 2) {
      const target = measures[index + 1].top - innerHeight + innerHeight * clamp01(Number(transition[3]) / 100);
      lenis.scrollTo(target, { immediate: true }); dirty = true; return;
    }
  }
  const index = CHAPTERS.findIndex(ch => ch.id === hash);
  if (index >= 0) navigate(index, false, immediate);
}

function openDialog(kind: string): void {
  dialogKind = kind;
  if (!dialog.open) lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  if (kind === 'chapters') $('#dialog-body').innerHTML = `<p class="dialog-kicker">A thread through the city</p><h2 id="dialog-title">The chapters</h2><ol class="chapter-list">${CHAPTERS.map((ch, i) => `<li><a href="#${ch.id}" ${i === activeIndex ? 'aria-current="location"' : ''}><span>${number(ch.number)}</span><span>${ch.title}</span>${arrow}</a></li>`).join('')}</ol>${action('about', 'About this experience')}`;
  if (kind === 'about') $('#dialog-body').innerHTML = `<p class="dialog-kicker">An original paper fable</p><h2 id="dialog-title">Small things.<br>Extraordinary light.</h2><p>PAPERSUN follows Mira, a lantern-repairer, through a city of cut paper. Its eleven chapters are a complete original fiction, made for reading, looking, and a little mending.</p><p>Follow the red thread at your own pace. Collect the three pieces at the market, wind hill, and shadow valley, then fit them together at the worktable. You can also read the chapters in any order.</p><div class="about-details"><h3>Made of light and paper</h3><p>The scenery uses original AI-generated paper-theatre artwork. The three interlocking shapes, stitched sun, pinned character, scene actions, and red thread are precisely authored browser graphics. This is layered 2.5D theatre.</p><h3>Make yourself comfortable</h3><p>Sound is off until you turn it on. The optional chimes are composed here from quiet tones. Reduced motion keeps the full story and all discoveries. Your progress stays on this device; Begin again clears it.</p><h3>A story for everyone</h3><p>Use Tab and Enter for controls, Escape to close a panel, and the chapter list to travel. No account, tracking, paid service, or connection is needed after loading.</p><a class="text-action" href="${import.meta.env.BASE_URL}papersun/story.html"><span>Read the complete story as text</span>${arrow}</a></div>`;
  if (kind === 'desk') $('#dialog-body').innerHTML = `<p class="dialog-kicker">The last warm room</p><h2 id="dialog-title">A repairer’s tools</h2><p>Nothing here was made for mending a sky. Mira brings it anyway.</p><dl class="tool-list">${TOOLS.map(tool => `<div><dt>${escape(tool.name)}</dt><dd>${escape(tool.purpose)}</dd></div>`).join('')}</dl><p class="small-note">Under the old shade: a pinned note, three outlines, and the beginning of a red thread.</p><a class="text-action" href="#ch-03"><span>Read the note</span>${arrow}</a>`;
  if (kind === 'preview') renderPreview();
  if (kind === 'inventory') renderInventory();
  if (!dialog.open) { dialog.showModal(); lenis.stop(); }
  dialog.querySelector<HTMLElement>('.close-dialog')!.focus();
}
function closeDialog(restore = true): void {
  dialog.close(); lenis.start();
  if (restore && lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
  dialogKind = '';
}
function renderPreview(): void {
  const piece = FRAGMENTS[previewPiece];
  $('#dialog-body').innerHTML = `<p class="dialog-kicker">The note beneath the lamp</p><h2 id="dialog-title">Three pieces.<br>One circle.</h2><p>Every edge has a place. Select a piece to recognize its shape and destination.</p><div class="preview-sun">${sunSvg({ placed: [previewPiece], seams: false, outline: true, title: `Piece ${previewPiece} previewed inside the three-piece outline; no pieces collected.` })}</div><div class="preview-tabs" role="group" aria-label="Preview a sun piece">${PIECE_IDS.map(id => `<button data-action="preview-piece" data-piece="${id}" aria-pressed="${id === previewPiece}">Piece ${id}</button>`).join('')}</div><h3 class="preview-destination">${piece.location}</h3><p class="small-note">Previewing does not collect a piece. Follow the thread to discover it.</p><a class="text-action" href="#ch-${number(PIECE_IDS.indexOf(previewPiece) + 5)}"><span>Visit ${piece.location.replace(/^The /, '')}</span>${arrow}</a>`;
}
function renderInventory(): void {
  $('#dialog-body').innerHTML = `<p class="dialog-kicker">Light, carefully kept</p><h2 id="dialog-title">Your three pieces</h2><p>Each piece keeps its own shape, and the place where you found it.</p><div class="inventory-list">${PIECE_IDS.map((id, i) => `<a href="#ch-${number(i + 5)}" class="inventory-row ${memory.found.includes(id) ? 'collected' : ''}">${fragmentSvg(id, { decorative: true, size: 94 })}<span><strong>${FRAGMENTS[id].label}</strong><small>${memory.found.includes(id) ? 'Found and safely carried' : 'Waiting to be discovered'}${memory.placed.includes(id) ? ' · Placed at the worktable' : ''}</small></span>${arrow}</a>`).join('')}</div><a class="text-action" href="#ch-09"><span>Return to the worktable</span>${arrow}</a>`;
}

document.addEventListener('click', async event => {
  const element = (event.target as Element).closest<HTMLElement>('[data-action], a[href^="#"]');
  if (!element) return;
  if (element instanceof HTMLAnchorElement) {
    const index = CHAPTERS.findIndex(ch => `#${ch.id}` === element.getAttribute('href'));
    if (index >= 0) { event.preventDefault(); navigate(index); }
    return;
  }
  const key = element.dataset.action;
  if (['chapters', 'about', 'desk', 'preview', 'inventory'].includes(key ?? '')) { openDialog(key!); return; }
  if (key === 'close') { closeDialog(); return; }
  if (key === 'motion') { setMotion(motion === 'on' ? 'reduced' : 'on'); return; }
  if (key === 'stills') { setMotion('reduced'); $('#recovery').hidden = true; return; }
  if (key === 'sound') {
    if (audio.enabled) audio.disable();
    else if (!await audio.enable()) announce('Audio is unavailable in this version.');
    $('#sound-control').textContent = `Sound: ${audio.enabled ? 'On' : 'Off'}`;
    if (audio.enabled) audio.chime('place');
    return;
  }
  if (key === 'preview-piece') { previewPiece = element.dataset.piece as PieceId; renderPreview(); dialog.querySelector<HTMLButtonElement>(`button[data-action="preview-piece"][data-piece="${previewPiece}"]`)!.focus(); return; }
  if (key === 'closer') { heroClose = !heroClose; element.querySelector('span')!.textContent = heroClose ? 'Restore the stage' : 'Look closer'; announce(heroClose ? CHAPTERS[0].detail : 'The whole paper city is in view again.'); dirty = true; return; }
  if (key === 'retry') { revision++; from.show(from.index, memory, innerWidth <= 700, revision, true); to.show(to.index, memory, innerWidth <= 700, revision, true); dirty = true; return; }
  if (key === 'trace') { memory.tracedRoute = true; announce(feedback(3)); }
  if (key === 'reset-route') { memory.tracedRoute = false; announce('The route is ready to trace again.'); }
  if (key === 'repair') { memory.marketRepaired = true; findPiece('A'); announce(feedback(4)); }
  if (key === 'reset-market') { memory.marketRepaired = false; announce('The lantern scene is reset. Your discoveries remain in Review pieces.'); }
  if (key === 'wheel') { memory.wheelSteady = !memory.wheelSteady; if (memory.wheelSteady) findPiece('B'); announce(feedback(5)); }
  if (key === 'reset-wheel') { memory.wheelSteady = false; announce('The wheel is free again. Your discoveries remain in Review pieces.'); }
  if (key === 'shade') { memory.shadeLifted = !memory.shadeLifted; if (memory.shadeLifted) findPiece('C'); announce(feedback(6)); }
  if (key === 'reset-shade') { memory.shadeLifted = false; announce('The shade is lowered again. Your discoveries remain in Review pieces.'); }
  if (key === 'place') {
    const id = element.dataset.piece as PieceId;
    if (!PIECE_IDS.includes(id)) return;
    memory.placed = memory.placed.includes(id) ? memory.placed.filter(p => p !== id) : [...memory.placed, id].sort();
    if (memory.placed.length < 3) memory.sunLifted = false;
    audio.chime('place'); announce(`Piece ${id} ${memory.placed.includes(id) ? 'placed' : 'removed'}. ${memory.placed.length} of 3 pieces placed.`);
  }
  if (key === 'seams') { memory.seamsVisible = !memory.seamsVisible; announce(memory.seamsVisible ? 'The repaired seams are visible.' : 'Seam detail hidden at the worktable. The final repaired sun keeps its stitches.'); }
  if (key === 'reset-repair') { memory.placed = []; memory.sunLifted = false; memory.seamsVisible = true; announce('The three pieces are ready to place again.'); }
  if (key === 'lift' && memory.placed.length === 3) { memory.sunLifted = true; memory.seamsVisible = true; memory.daylight = true; audio.chime('lift'); save(); navigate(9); announce('The sun rises on the red thread. Its seams remain.'); return; }
  if (key === 'daylight') { memory.daylight = !memory.daylight; announce(memory.daylight ? 'Morning light falls across the paper city.' : 'Blue night returns. The repaired sun and little lamp remain.'); }
  if (key === 'return-table') { navigate(8); return; }
  if (key === 'again') { memory = initialStoryMemory(); save(); navigate(0); announce('A new telling begins. The three discoveries and repair have been reset.'); return; }
  save();
});
dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(); });
dialog.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const stops = all<HTMLElement>('a[href],button:not(:disabled),[tabindex="0"]', dialog).filter(element => element.getClientRects().length > 0);
  const first = stops[0], last = stops.at(-1);
  if (!first || !last) { event.preventDefault(); return; }
  if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
});
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(); } });

function transitionMask(index: number, p: number): string {
  // Every authored mask shares exact source/target ownership at its endpoints.
  // A slanted intermediate edge must not leave a wedge of the old chapter.
  if (p <= .00001) return 'inset(100%)';
  if (p >= .99999) return 'inset(0)';
  const n = (1 - p) * 100;
  if (index === 0) {
    return `path('${windowHandoff(p, innerWidth, innerHeight, innerWidth <= 700).inner}')`;
  }
  if (index === 1) return `inset(${n}% 0 0 0)`;
  if (index === 2) return `inset(0 0 0 ${n}%)`;
  if (index === 3) return `inset(0 0 ${Math.max(0, 100 - p * 120)}% 0)`;
  if (index === 4) return `inset(0 0 0 ${n}%)`;
  if (index === 5) {
    const wheel = frameFor(5, innerWidth, innerHeight);
    return `circle(${p * 145}% at ${wheel.left + 1065 * wheel.scale}px ${wheel.top + 255 * wheel.scale}px)`;
  }
  if (index === 6 || index === 7) return `ellipse(${p * 155}% ${p * 125}% at 100% 78%)`;
  if (index === 8) return `inset(${(1 - p) * 100}% 0 0 0)`;
  return `inset(0 ${Math.max(0, 100 - p * 125)}% 0 0)`;
}
function setEdge(index: number, p: number): void {
  const edge = $('#transition-edge');
  edge.style.opacity = p > .005 && p < .995 ? '.4' : '0';
  const x = (1 - p) * 1000;
  const y = (1 - p) * 1000;
  const bend = Math.sin(p * Math.PI);
  const shape = index === 8
    ? `M 0 ${y} Q 250 ${y - 12} 500 ${y + 3} T 1000 ${y - 6}`
    : index === 3 ? `M 0 ${p * 1200} Q 250 ${p * 1200 - 28} 500 ${p * 1200} T 1000 ${p * 1200}`
    : index === 4 ? `M ${x - 180 * bend} 0 L ${x + 180 * bend} 1000`
    : index === 2 ? `M ${x} 0 L ${x - 50 * bend} 300 L ${x + 80 * bend} 620 L ${x - 160 * bend} 1000` : '';
  $('#edge-paper').setAttribute('d', shape);
  $('#edge-thread').setAttribute('d', index === 2 || index === 4 ? shape : '');
}

function updateSun(index: number, transition: ReturnType<typeof evaluateStory>['transition'], mobile: boolean): void {
  const inLift = transition?.index === 8;
  const tableEntry = transition?.index === 7 && motion === 'on';
  const tableReveal = tableEntry ? clamp01((transition.progress - .5) * 2) : 1;
  const inTableEntry = tableEntry && tableReveal > 0;
  // The solid bridge arch owns the foreground while the worktable is revealed.
  $('#transition-props').style.zIndex = tableEntry ? '6' : '2';
  // After the visitor completes the repair, the home stage remembers that same
  // disc. Begin again restores the original absence and all discovery states.
  const showOpening = index === 0 && memory.sunLifted;
  // The active chapter switches at halfway. The table prop shares the exact
  // target-scene mask, rather than dissolving over a fully exposed worktable.
  // Reduced motion uses the complete target still as soon as it takes over.
  const visible = tableEntry ? inTableEntry : index >= 8 || inLift || showOpening;
  sun.style.display = visible ? 'block' : 'none';
  if (!visible) return;
  const table = frameFor(8, innerWidth, innerHeight);
  const sky = frameFor(showOpening ? 0 : 9, innerWidth, innerHeight);
  const tablePoint = { x: table.left + 1095 * table.scale, y: table.top + 650 * table.scale, r: 140 * table.scale };
  const skyPoint = mobile ? { x: sky.left + 586 * sky.scale, y: sky.top + 578 * sky.scale, r: 213 * sky.scale } : { x: sky.left + 1226 * sky.scale, y: sky.top + 250 * sky.scale, r: 198 * sky.scale };
  let p = index >= 9 || showOpening ? 1 : 0;
  if (inLift) p = motion === 'reduced' ? (transition.progress < .5 ? 0 : 1) : smoothstep(transition.progress);
  const x = tablePoint.x + (skyPoint.x - tablePoint.x) * p;
  const y = tablePoint.y + (skyPoint.y - tablePoint.y) * p;
  const r = tablePoint.r + (skyPoint.r - tablePoint.r) * p;
  const size = r * 200 / 86;
  const narrativeRepair = index >= 9 || inLift;
  const placed = narrativeRepair ? PIECE_IDS : memory.placed;
  const key = `${placed.join('')}-${memory.seamsVisible || narrativeRepair}-${p > 0}`;
  if (sun.dataset.key !== key) {
    sun.innerHTML = sunSvg({ placed, seams: memory.seamsVisible || narrativeRepair, outline: true, rig: p > 0, decorative: true, size: 200 });
    sun.dataset.key = key;
  }
  const left = x - size / 2, top = y - size / 2;
  const clipPath = tableEntry
    ? `ellipse(${tableReveal * 1.55 * innerWidth}px ${tableReveal * 1.25 * innerHeight}px at ${innerWidth - left}px ${innerHeight * .78 - top}px)`
    : 'none';
  Object.assign(sun.style, { left: `${left}px`, top: `${top}px`, width: `${size}px`, height: `${size}px`, opacity: '1', clipPath });
  sun.dataset.placed = placed.join('');
  sun.dataset.lift = p.toFixed(4);
}

function frame(time: number): void {
  if (disposed || document.hidden) return;
  lenis.raf(time * 1000);
  if (!measures.length) return;
  const state = evaluateStory({ scrollY: window.scrollY, viewport: { width: innerWidth, height: innerHeight }, chapters: measures, selectedMode: motion as 'on' | 'reduced' });
  const mobile = innerWidth <= 700;
  const atCity = [0, 9, 10].includes(state.activeIndex) && !state.transition;
  const light = $('#practical-light');
  light.hidden = !atCity;
  if (atCity) {
    if (heroLightStart === undefined) heroLightStart = time;
    const f = frameFor(state.activeIndex, innerWidth, innerHeight);
    const cx = f.left + (mobile ? 674 : 1408) * f.scale;
    const cy = f.top + (mobile ? 1415 : 792) * f.scale;
    const radius = (mobile ? 120 : 105) * f.scale;
    const reveal = heroHasLeft || motion === 'reduced' ? 1 : clamp01((time - heroLightStart) / 1.8);
    const wick = motion === 'on' ? .018 * Math.sin(time * 1.6) + .006 * Math.sin(time * 3.1) : 0;
    Object.assign(light.style, { left: `${cx - radius}px`, top: `${cy - radius}px`, width: `${radius * 2}px`, height: `${radius * 2}px`, opacity: String((.13 + wick) * (.55 + .45 * reveal)) });
    html.dataset.heroState = state.activeIndex !== 0 ? 'later-city' : heroHasLeft ? 'return' : reveal < 1 ? 'reveal' : 'living-hold';
  } else if (state.transition?.index === 0) { heroHasLeft = true; html.dataset.heroState = 'first-scroll'; }
  else if (state.activeIndex > 0) heroHasLeft = true;
  if (dirty) {
    const tr = state.transition;
    let a = tr?.from ?? state.activeIndex;
    let b = tr?.to ?? state.activeIndex;
    let p = tr?.progress ?? 0;
    if (tr?.index === 7 && motion === 'on') {
      if (p <= .5) { b = 11; p *= 2; }
      else { a = 11; p = (p - .5) * 2; }
    }
    if (motion === 'reduced') { a = b = state.activeIndex; p = 0; }
    from.show(a, memory, mobile, revision);
    to.show(b, memory, mobile, revision);
    const roomMove = tr?.index === 0 && motion === 'on' ? windowHandoff(tr.progress, innerWidth, innerHeight, mobile) : null;
    const targetPlane = to.element.querySelector<HTMLElement>('.art-plane');
    if (targetPlane) {
      const f = frameFor(1, innerWidth, innerHeight);
      targetPlane.style.transformOrigin = roomMove ? `${1415 * f.scale}px ${600 * f.scale}px` : '';
      targetPlane.style.transform = roomMove && tr ? `translate(${roomMove.dx}px,${roomMove.dy}px) scale(${1 + .22 * Math.sin(tr.progress * Math.PI)})` : '';
    }
    const noteHandoff = tr?.index === 1 && motion === 'on' && from.status === 'ready' && to.status === 'ready' && tr.progress < .999;
    to.element.style.background = noteHandoff ? 'transparent' : '';
    const targetImage = to.element.querySelector<HTMLElement>('.scene-image');
    if (targetImage) targetImage.style.visibility = noteHandoff ? 'hidden' : '';
    const note = to.element.querySelector<HTMLElement>('.scene-props .quest-note');
    if (note) {
      const rest = note.dataset.restTransform ?? note.getAttribute('transform') ?? '';
      note.dataset.restTransform = rest;
      if (noteHandoff && tr) {
        const source = frameFor(1, innerWidth, innerHeight), target = frameFor(2, innerWidth, innerHeight);
        const t = smoothstep(tr.progress / .72);
        const startX = (source.left + 1125 * source.scale - target.left) / target.scale;
        const startY = (source.top + 722 * source.scale - target.top) / target.scale;
        const ratio = source.scale / target.scale, finalScale = mobile ? 400 / 650 : 1;
        const x = startX + ((mobile ? 855 : 850) - startX) * t;
        const y = startY + ((mobile ? 375 : 135) - startY) * t - 75 * Math.sin(t * Math.PI);
        const sx = .15 * ratio + (finalScale - .15 * ratio) * t;
        const sy = .075 * ratio + (finalScale - .075 * ratio) * t;
        note.setAttribute('transform', `translate(${x} ${y}) scale(${sx} ${sy})`);
        note.style.visibility = tr.progress <= .001 ? 'hidden' : '';
        for (const piece of all<HTMLElement>('.exact-piece', note)) piece.style.opacity = String(smoothstep(piece.dataset.piece === 'A' ? (tr.progress - .16) / .22 : (tr.progress - .5) / .25));
      } else {
        note.setAttribute('transform', rest); note.style.visibility = '';
        for (const piece of all<HTMLElement>('.exact-piece', note)) piece.style.opacity = '';
      }
    }
    for (const deskNote of all<HTMLElement>('.scene-props .desk-note-outline', from.element)) deskNote.style.visibility = noteHandoff && tr && tr.progress > .001 ? 'hidden' : '';
    for (const arm of all<HTMLElement>('.scene-props .mira-front-arm', from.element)) {
      const rest = arm.dataset.restTransform ?? arm.getAttribute('transform') ?? ''; arm.dataset.restTransform = rest;
      arm.setAttribute('transform', noteHandoff && tr ? `rotate(${-33 - 32 * smoothstep(tr.progress / .3)} 116 131)` : rest);
    }
    const sourceImage = from.element.querySelector<HTMLElement>('.scene-image');
    if (sourceImage) sourceImage.style.filter = noteHandoff ? `brightness(${1 - .12 * smoothstep(tr.progress)})` : '';
    $('#transition-props').innerHTML = tr && motion === 'on'
      ? renderTransitionProp(tr.index, tr.progress, mobile, innerWidth, innerHeight, memory) : '';
    // One actor owns each handoff. A physical occluder can hide her for a
    // moment, but two independent stage instances must never appear together.
    const moving = tr && motion === 'on' && tr.progress > .001 && tr.progress < .999;
    const journeyOwner = moving && tr.index >= 4 && tr.index <= 6;
    for (const actor of all<HTMLElement>('.mira-stage-position', from.element)) actor.style.visibility = journeyOwner || moving && tr.progress >= (tr.index === 7 ? .32 : tr.index === 1 ? .72 : .5) ? 'hidden' : '';
    for (const actor of all<HTMLElement>('.mira-stage-position', to.element)) actor.style.visibility = journeyOwner || moving && tr.progress < (tr.index === 7 ? .72 : .5) ? 'hidden' : '';
    for (const scene of [from.element, to.element]) {
      for (const fixture of all<HTMLElement>('.source-discovery-piece', scene)) fixture.style.visibility = journeyOwner ? 'hidden' : '';
      for (const holder of all<HTMLElement>('.carried-pieces', scene)) {
        const hiddenAtRoomEntry = moving && tr.index === 7 && (scene.dataset.scene === '11' || scene.dataset.scene === '7' && tr.progress >= .32 || scene.dataset.scene === '8' && tr.progress < .5);
        holder.style.visibility = journeyOwner || hiddenAtRoomEntry ? 'hidden' : '';
        // A skipped repair still resolves narratively into the single root
        // disc at lift entry. The loose table pieces must relinquish those IDs.
        for (const piece of all<HTMLElement>('.canonical-carrier-piece', holder)) piece.style.visibility = tr?.index === 8 ? 'hidden' : '';
      }
    }
    to.element.style.visibility = tr && motion === 'on' ? 'visible' : 'hidden';
    applyReveal(to.element, noteHandoff ? 'inset(0)' : tr ? transitionMask(tr.index, clamp01(p)) : 'inset(100%)');
    const nextReading = tr && motion === 'on' ? sections[tr.to].querySelector<HTMLElement>('.reading-copy') : null;
    if (stagedReading && stagedReading !== nextReading) {
      stagedReading.style.transform = ''; stagedReading.style.opacity = ''; stagedReading.style.pointerEvents = ''; stagedReading.inert = false;
    }
    if (nextReading && tr) {
      // In portrait, the lifted disc crosses the lower reading area. Hold the
      // incoming caption until the same disc has reached its clear sky slot.
      const textStart = mobile && tr.index === 8 ? .82 : .36;
      const visibility = smoothstep((tr.progress - textStart) / .14);
      nextReading.style.transform = `translateY(${-innerHeight * (1 - tr.progress)}px)`;
      nextReading.style.opacity = String(visibility);
      nextReading.style.pointerEvents = visibility < .95 ? 'none' : '';
      nextReading.inert = visibility < .95;
    }
    stagedReading = nextReading;
    if (tr && motion === 'on') setEdge(tr.index, p); else $('#transition-edge').style.opacity = '0';
    from.element.style.transform = heroClose && a === 0 ? 'scale(1.11)' : 'none';
    from.element.style.transformOrigin = '77% 26%';
    $('#theatre').dataset.daylight = String((state.activeIndex >= 9 || tr?.index === 8 && tr.progress > .6) && memory.daylight);
    $('#theatre').dataset.chapter = String(state.activeIndex);
    html.dataset.activeChapter = String(state.activeIndex + 1);
    html.dataset.transition = tr ? `${tr.index + 1}:${tr.progress.toFixed(4)}` : 'none';
    updateSun(state.activeIndex, tr, mobile);
    $('#progress-fill').style.transform = `scaleX(${state.storyProgress})`;
    const activeScene = tr && tr.progress > .5 ? to : from;
    $('#recovery').hidden = activeScene.status !== 'failed';
    if (activeIndex !== state.activeIndex) {
      activeIndex = state.activeIndex;
      softText($('#chapter-count'), `${number(activeIndex + 1)} / 11`, { instant: motion !== 'on' });
      softText($('#chapter-name'), CHAPTERS[activeIndex].title, { instant: motion !== 'on' });
      for (const link of all('[data-rail]')) { if (Number(link.dataset.rail) === activeIndex) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); }
      warmNeighbours(activeIndex, mobile);
    }
    dirty = false;
  }
  // The quiet swing is added to the authored 27-degree SVG pose. Its amplitude
  // reaches zero at both handoffs, so the foreground wheel inherits the same
  // six-blade silhouette without a time-dependent orientation snap.
  let wheelSwing = 0;
  if (motion === 'on' && !memory.wheelSteady && state.activeIndex === 5) {
    const entry = state.transition?.index === 4 ? smoothstep((state.transition.progress - .5) / .5) : 1;
    const exitStart = (measures[6]?.top ?? window.scrollY + innerHeight) - innerHeight;
    const exit = smoothstep((exitStart - window.scrollY) / (innerHeight * .4));
    wheelSwing = 12 * Math.sin(time * 1.2) * entry * exit;
  }
  for (const rotor of all<HTMLElement>('.wind-rotor')) rotor.style.rotate = `${wheelSwing}deg`;
}

// Page-navigation keys use the same scroll authority as wheel and hash input.
// A browser-native smooth key animation can otherwise continue after a chapter
// jump and pull the page away from that chapter or exact transition midpoint.
document.addEventListener('keydown', event => {
  if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Tab'].includes(event.key)) userMovedBeforeFonts = true;
  const target = event.target instanceof Element ? event.target : null;
  if (event.defaultPrevented || dialog.open || event.altKey || event.ctrlKey || event.metaKey || target?.closest('input,textarea,select,[contenteditable="true"],[role="slider"],[role="listbox"],[role="combobox"],[role="tree"],[role="menu"],[role="tablist"]')) return;
  if (event.key === ' ' && target?.closest('button,a,[role="button"]')) return;
  if (event.shiftKey && event.key !== ' ') return;
  let next: number | undefined;
  if (event.key === 'ArrowDown') next = window.scrollY + 40;
  else if (event.key === 'ArrowUp') next = window.scrollY - 40;
  else if (event.key === 'PageDown') next = window.scrollY + innerHeight * .9;
  else if (event.key === 'PageUp') next = window.scrollY - innerHeight * .9;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = document.documentElement.scrollHeight - innerHeight;
  else if (event.key === ' ') next = window.scrollY + innerHeight * .9 * (event.shiftKey ? -1 : 1);
  if (next !== undefined) { event.preventDefault(); lenis.scrollTo(next, { immediate: true }); dirty = true; }
});
document.addEventListener('pointerdown', event => {
  if (event.clientX >= document.documentElement.clientWidth) { userMovedBeforeFonts = true; lenis.scrollTo(window.scrollY, { immediate: true }); }
}, { passive: true });
window.addEventListener('wheel', () => { userMovedBeforeFonts = true; }, { passive: true });
window.addEventListener('touchstart', () => { userMovedBeforeFonts = true; }, { passive: true });
window.addEventListener('scroll', () => { dirty = true; }, { passive: true });
window.addEventListener('resize', () => measure(true), { passive: true });
window.addEventListener('hashchange', () => resolveHash());
window.addEventListener('popstate', () => resolveHash());
window.addEventListener('pageshow', () => { measure(true); dirty = true; });
media.addEventListener('change', event => setMotion(event.matches ? 'reduced' : 'on'));
document.addEventListener('visibilitychange', () => {
  html.dataset.paused = String(document.hidden);
  if (document.hidden) gsap.ticker.remove(frame);
  else { measure(true); gsap.ticker.add(frame); dirty = true; }
});
document.fonts.ready.then(() => {
  if (disposed) return;
  measure(true);
  // A cold hash still names the visitor's intended reading hold after the
  // first font reflow. Real input cancels this correction, so an early scroll
  // is never pulled back to the URL's original chapter.
  if (!userMovedBeforeFonts && location.hash) resolveHash(true);
});
measure();
save();
frame(0);
measure();
gsap.ticker.add(frame);
if (location.hash) requestAnimationFrame(() => resolveHash(true));
// Browser QA reads this DOM-backed state; no hidden navigation API is needed.
performance.mark('papersun-first-composition');
if ('requestIdleCallback' in window) window.requestIdleCallback(() => { if (!disposed) warmReadingCache(); }, { timeout: 2500 });
else setTimeout(() => { if (!disposed) warmReadingCache(); }, 1200);
if (import.meta.hot) import.meta.hot.dispose(() => { disposed = true; from.dispose(); to.dispose(); gsap.ticker.remove(frame); coordinator.kill(); lenis.destroy(); audio.dispose(); });
