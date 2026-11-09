// Fonts: the supplied @fontsource 5.3.0 latin files are declared in style.css from byte-identical Collection URLs.

import 'lenis/dist/lenis.css';
import './style.css';
import Lenis from 'lenis';
import { CHAPTERS, WORK, UI } from './content';
import { evaluateDance } from './motion';
import type { DanceFrame, DancerId, TimingMode } from './motion-types';
import type { StageOptions } from './render/stage';
interface StageDriver { load(t?: number, mode?: TimingMode): Promise<void>; render(frame: DanceFrame, options: StageOptions): void; resize(): void; dispose(): void; setVisible?(visible: boolean): void; rendererKind?: string }
import { Soundscape } from './sound';
import { icon } from './icons';
import { asset, prepareAssets } from './assets';

const art = (id: number) => asset(`art/img-${String(id).padStart(2, '0')}.webp`);
const isNarrow = () => innerWidth < 960 && innerWidth / innerHeight <= 1.25;
const root = document.querySelector<HTMLDivElement>('#app')!;
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const readSaved = <T>(key: string, fallback: T): T => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; } };
const save = (key: string, value: unknown) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage is optional. */ } };
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smooth = (a: number, b: number, t: number) => { const x = clamp((t - a) / (b - a)); return x * x * (3 - 2 * x); };
const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');
const initialMode = readSaved<TimingMode>('pas-timing', 'unison');
const initialMotion = readSaved<'system' | 'full' | 'reduced'>('pas-motion', 'system');
let hasUserInput = false;
const state = {
  t: 0, mode: (initialMode === 'echo' ? 'echo' : 'unison') as TimingMode,
  motion: (['system', 'full', 'reduced'].includes(initialMotion) ? initialMotion : 'system') as 'system' | 'full' | 'reduced',
  reduced: false, gentle: true, ground: false, paths: false, contact: false,
  focus: null as DancerId | null, compare: 'ending' as 'opening' | 'ending', weightCompare: null as 'before' | 'during' | null,
  entered: false, ready: false, failed: false, playing: false, observedChapter: -1,
  playback: null as null | { from: number; to: number; duration: number; cursor: number; last: number; paused: boolean },
};
const specialControls = (id: number) => {
  switch (id) {
    case 2: return `<button class="text-button" data-action="ground" aria-pressed="false">${icon('eye')}<span>${UI.floorContact}</span></button>`;
    case 3: return `<button class="text-button" data-action="contact" aria-pressed="false">${icon('eye')}<span>${UI.contact}</span></button>`;
    case 4: return `<div class="choice-pair" aria-label="Compare counterweight"><button data-weight="before" aria-pressed="false">Own weight</button><button data-weight="during" aria-pressed="false">Shared weight</button></div>`;
    case 5: return `<div class="choice-pair timing" role="group" aria-label="Timing mode"><button data-mode="unison" aria-pressed="${state.mode === 'unison'}">Unison</button><button data-mode="echo" aria-pressed="${state.mode === 'echo'}">Echo</button></div><p class="mode-description">${state.mode === 'echo' ? UI.echoDescription : UI.unisonDescription}</p><div class="play-row"><button class="text-button" data-action="play-experiment">${icon('play')}<span>Play the phrase</span></button><button class="icon-button" data-action="reset-experiment" aria-label="Reset to Unison">${icon('reset')}</button></div>`;
    case 6: return `<button class="text-button" data-action="paths" aria-pressed="false">${icon('eye')}<span>${UI.path}</span></button>`;
    case 7: return `<div class="choice-pair triple" aria-label="Observe the descent"><button data-time="6.07">Meet</button><button data-time="6.50">Lower</button><button data-time="6.94">Rise</button></div>`;
    case 8: return `<button class="text-button phrase-button" data-action="play-complete">${icon('play')}<span>Watch the whole phrase</span></button>`;
    case 9: return `<div class="choice-pair" aria-label="Choose whom to observe"><button data-focus="cen" aria-pressed="false">Watch Cen</button><button data-focus="cheng" aria-pressed="false">Watch Cheng</button></div><p class="focus-description"></p>`;
    case 10: return `<div class="choice-pair" aria-label="Compare opening and ending"><button data-compare="opening" aria-pressed="false">The opening</button><button data-compare="ending" aria-pressed="true">The ending</button></div><p class="compare-note">The same space. A different waiting.</p><div class="revisit"><span>Return to a moment</span><a href="#one-palm">One Palm ${icon('arrow')}</a><a href="#counterweight">Counterweight ${icon('arrow')}</a><a href="#unison-echo">Unison / Echo ${icon('arrow')}</a></div>`;
    default: return '';
  }
};

root.innerHTML = `
  <a class="skip-link" href="#between">Skip to the duet</a>
  <div class="scene" role="img" aria-label="${escapeHtml(CHAPTERS[0].alt)}">
    <canvas id="dance-canvas" aria-hidden="true"></canvas>
    <picture class="opening-art"><source media="(max-width:959px) and (max-aspect-ratio:5/4)" srcset="${art(5)}"><img src="${art(4)}" alt="" fetchpriority="high" width="1536" height="1024"></picture>
    <img class="fallback-frame" alt="" hidden>
    <div class="reading-shade"></div>
  </div>
  <div class="detail-caption" aria-hidden="true">A closer look</div>
  <header class="site-header">
    <a class="wordmark" href="#between" aria-label="PAS — return to the beginning">pas<span class="wordmark-dot">.</span></a>
    <div class="header-actions"><a class="collection-return" href="${import.meta.env.BASE_URL}#world-pas" aria-label="Return to Collection" title="Return to Collection"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7"/></svg><span>Collection</span></a><button class="sound-toggle quiet-button" data-action="sound" aria-label="Sound off" aria-pressed="false">${icon('mute')}<span>Sound off</span></button><button class="menu-toggle quiet-button" data-dialog="chapters-dialog">Chapters ${icon('menu')}</button></div>
  </header>
  <main id="duet" aria-label="The duet in ten movements">
    ${CHAPTERS.map((chapter, index) => `
      <section class="chapter ${index === 0 ? 'chapter--hero' : ''} ${index === 9 ? 'chapter--ending' : ''}" id="${chapter.slug}" aria-labelledby="title-${chapter.id}" data-chapter="${chapter.id}">
        <div class="chapter-content" data-lenis-prevent ${index ? 'inert' : ''}>
          ${index === 0 ? `<h1 id="title-1" tabindex="-1">PAS</h1><p class="hero-subtitle">The distance<br>between two people.</p><p class="hero-poem">One body makes a movement.<br>Another gives it an answer.</p><button class="text-button enter-button" data-action="enter">Enter the duet ${icon('arrow')}</button>` : `<span class="chapter-number" aria-label="Movement ${chapter.id}">${String(chapter.id).padStart(2, '0')} <span>/ 10</span></span><h2 id="title-${chapter.id}" tabindex="-1">${chapter.title}</h2><p class="chapter-lead">${chapter.lead}</p>`}
          <div class="beat-note" ${index === 0 ? 'hidden' : ''}><span class="beat-count">A</span><p>${chapter.beats[0].text}</p></div>
          <div class="chapter-actions">${specialControls(chapter.id)}</div>
          ${index === 0 ? '' : `<details class="observing-notes" data-lenis-prevent><summary>Look a little closer ${icon('down')}</summary><div class="notes-content"><p class="mobile-lead">${chapter.lead}</p><p>${chapter.detail}</p><div class="moment-buttons" role="group" aria-label="Choose a moment in ${escapeHtml(chapter.title)}">${chapter.steps.map(step => `<button data-time="${step.t}" title="${escapeHtml(step.description)}">${step.label}</button>`).join('')}</div></div></details>`}
        </div>
      </section>`).join('')}
  </main>
  <aside class="stage-note" aria-live="off"><span class="stage-note-line"></span><p>${CHAPTERS[0].caption}</p></aside>
  <div class="fallback-notice" hidden><span>${UI.renderFallback}</span><button data-action="retry">Try again</button></div>
  <div class="playback-bar" hidden><span class="playback-title">A complete phrase</span><button class="icon-button" data-action="pause-playback" aria-label="Pause playback">${icon('pause')}</button><button class="icon-button" data-action="replay-playback" aria-label="Replay the phrase">${icon('reset')}</button><button class="text-button" data-action="exit-playback">Return to scrolling ${icon('close')}</button></div>
  <footer class="viewing-bar">
    <div class="chapter-current"><span class="current-number">01</span><span class="current-name">Between</span></div>
    <nav class="chapter-rail" aria-label="Choose a movement">${CHAPTERS.map(ch => `<a href="#${ch.slug}" aria-label="Movement ${ch.id}: ${ch.title}" ${ch.id === 1 ? 'aria-current="step"' : ''}><span class="rail-fill"></span><span class="rail-title">${String(ch.id).padStart(2, '0')} · ${ch.title}</span></a>`).join('')}</nav>
    <div class="viewing-options"><button class="icon-button gentle-toggle" data-action="gentle" aria-label="Pause gentle motion" aria-pressed="false">${icon('pause')}</button><button class="quiet-button motion-toggle" data-dialog="settings-dialog">Motion</button><button class="icon-button" data-dialog="about-dialog" aria-label="About this duet">${icon('info')}</button></div>
  </footer>
  <dialog id="chapters-dialog" class="chapter-index" aria-labelledby="index-title" data-lenis-prevent><div class="dialog-top"><span>pas.</span><button class="icon-button" data-close aria-label="Close chapters">${icon('close')}</button></div><h2 id="index-title">Ten movements.<br><em>One conversation.</em></h2><nav aria-label="All movements">${CHAPTERS.map(ch => `<a href="#${ch.slug}"><span>${String(ch.id).padStart(2, '0')}</span>${ch.title}${icon('arrow')}</a>`).join('')}</nav><p>Enter anywhere. Move in either direction.<br>The duet will meet you there.</p></dialog>
  <dialog id="settings-dialog" class="settings-dialog" aria-labelledby="settings-title" data-lenis-prevent><div class="dialog-top"><span>Viewing</span><button class="icon-button" data-close aria-label="Close viewing settings">${icon('close')}</button></div><h2 id="settings-title">At your pace.</h2><p>The same ten movements, with as much motion as you want.</p><fieldset><legend>How would you like to watch?</legend><label><input type="radio" name="motion" value="system">Follow my device preference</label><label><input type="radio" name="motion" value="full">Continuous movement</label><label><input type="radio" name="motion" value="reduced">Still moments, step by step</label></fieldset><p class="settings-small">Change between continuous movement and still moments at any time. Sound starts only when you choose it.</p><button class="solid-button" data-close>Return to the duet</button></dialog>
  <dialog id="about-dialog" class="about-dialog" aria-labelledby="about-title" data-lenis-prevent><div class="dialog-top"><span>About the work</span><button class="icon-button" data-close aria-label="Close notes">${icon('close')}</button></div><h2 id="about-title">A movement.<br><em>An answer.</em></h2><p>PAS is an imagined duet between Cen and Cheng. Its subject is the small work of attending: where a foot settles, how a shoulder makes room, when a hand lets go.</p><p>No relationship is prescribed. Unison and delay, contact and distance are different ways to look.</p><div class="dancer-key"><span><i class="cen-dot"></i>Cen · rust red</span><span><i class="cheng-dot"></i>Cheng · sand</span></div><p class="settings-small">Original authored choreography and generated visual studies. The animated bodies interpret the studies; they are not recordings of dancers or professionally validated biomechanics.</p><details><summary>Read all ten movements ${icon('down')}</summary>${CHAPTERS.map(ch => `<article><h3>${ch.id}. ${ch.title}</h3><p>${ch.lead}</p><p>${ch.beats.map(b => b.text).join(' ')}</p></article>`).join('')}</details><p class="credits">A work for observation, not a movement lesson.</p></dialog>
  <div class="announcements sr-only" aria-live="polite" aria-atomic="true"></div>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#dance-canvas')!;
const scene = document.querySelector<HTMLDivElement>('.scene')!;
const picture = document.querySelector<HTMLElement>('.opening-art')!;
const fallback = document.querySelector<HTMLImageElement>('.fallback-frame')!;
const chapters = [...document.querySelectorAll<HTMLElement>('.chapter')];
const railLinks = [...document.querySelectorAll<HTMLAnchorElement>('.chapter-rail a')];
const stageNote = document.querySelector<HTMLElement>('.stage-note p')!;
const announcements = document.querySelector<HTMLElement>('.announcements')!;
const playbackBar = document.querySelector<HTMLElement>('.playback-bar')!;
const sound = new Soundscape();
let stage: StageDriver | null = null;
let lenis: Lenis | null = null;
let unit = 1;
let lastChapter = -1;
let lastBeat = -1;
let rafId = 0;
let lastRenderKey = '';
let lastUiT = -1;
let sceneLoadToken = 0;
let lastFallbackSrc = '';
let destroyed = false;
let modalOpener: HTMLElement | null = null;
let frame: DanceFrame;
const announce = (text: string) => { announcements.textContent = text; };
const chapterAt = (t: number) => Math.min(9, Math.floor(t));

function layout(preserve = true) {
  const t = state.t;
  const entered = state.entered;
  const observed = state.observedChapter === chapterAt(t);
  unit = Math.max(480, window.innerHeight * (isNarrow() ? 1.65 : 1.55));
  document.documentElement.style.setProperty('--chapter-length', `${unit}px`);
  document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
  lenis?.resize(); stage?.resize();
  if (preserve) { jump(t, false, false, observed); state.entered = entered; }
  lastRenderKey = '';
}

function configureMotion() {
  state.reduced = state.motion === 'reduced' || (state.motion === 'system' && reduceQuery.matches);
  document.documentElement.classList.toggle('reduced-motion', state.reduced);
  lenis?.destroy();
  lenis = state.reduced ? null : new Lenis({ autoRaf: false, smoothWheel: true, lerp: .14, syncTouch: false, autoResize: true, anchors: false, prevent: node => Boolean(node.closest('dialog, [data-lenis-prevent]')) });
  document.querySelectorAll<HTMLInputElement>('input[name="motion"]').forEach(radio => { radio.checked = radio.value === state.motion; });
  document.querySelector('.motion-toggle')!.textContent = state.reduced ? 'Still moments' : 'Motion';
  document.querySelector('.phrase-button span')!.textContent = state.reduced ? 'Step through the phrase' : 'Watch the whole phrase';
  stopPlayback(); lastRenderKey = '';
}

function syncUrl(t: number, push: boolean) {
  const hash = `#${CHAPTERS[chapterAt(t)].slug}`;
  if (push && location.hash !== hash) history.pushState({ pas: true, t }, '', hash);
  else history.replaceState({ pas: true, t }, '', hash);
}

function jump(t: number, push = true, focus = false, observe = false) {
  const target = clamp(t, 0, 9.96);
  state.observedChapter = observe || focus ? chapterAt(target) : -1;
  state.entered = true; state.t = target;
  if (lenis) lenis.scrollTo(target * unit, { immediate: true, force: true }); else window.scrollTo({ top: target * unit, behavior: 'instant' });
  syncUrl(target, push);
  renderUi(target);
  if (focus) document.querySelector<HTMLElement>(`#title-${chapterAt(target) + 1}`)?.focus({ preventScroll: true });
  lastRenderKey = '';
}

function stopPlayback(restoreFocus = false) {
  const hadFocus = playbackBar.contains(document.activeElement);
  state.playback = null; state.playing = false; playbackBar.hidden = true;
  document.documentElement.classList.remove('is-playing');
  if (restoreFocus || hadFocus) {
    state.observedChapter = chapterAt(state.t); renderUi(state.t);
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`#title-${chapterAt(state.t) + 1}`)?.focus({ preventScroll: true }));
  }
}

function play(from: number, to: number, duration: number, title: string) {
  if (state.reduced || state.failed) {
    const target = to > 7 ? 7.06 : 4.04;
    jump(target); document.querySelector<HTMLDetailsElement>(`#${CHAPTERS[chapterAt(target)].slug} .observing-notes`)!.open = true;
    announce('Choose a moment to explore the phrase.'); return;
  }
  state.playback = { from, to, duration, cursor: from, last: 0, paused: false };
  state.playing = true; playbackBar.hidden = false; document.documentElement.classList.add('is-playing');
  document.querySelector('.playback-title')!.textContent = title;
  document.querySelector('[data-action="pause-playback"]')!.innerHTML = icon('pause');
  document.querySelector('[data-action="pause-playback"]')!.setAttribute('aria-label', 'Pause playback');
  jump(from); (document.querySelector('[data-action="pause-playback"]') as HTMLButtonElement).focus({ preventScroll: true }); announce(`${title}. Playing.`);
}

function openDialog(id: string, opener: HTMLElement) {
  stopPlayback(); modalOpener = opener;
  const dialog = document.getElementById(id) as HTMLDialogElement;
  dialog.showModal();
}
function closeDialog(dialog: HTMLDialogElement) { dialog.close(); modalOpener?.focus({ preventScroll: true }); }
document.querySelectorAll<HTMLDialogElement>('dialog').forEach(dialog => {
  dialog.addEventListener('close', () => { modalOpener?.focus({ preventScroll: true }); });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeDialog(dialog); } });
});

root.addEventListener('click', async event => {
  hasUserInput = true;
  const target = (event.target as HTMLElement).closest<HTMLElement>('button, a'); if (!target) return;
  if (target.hasAttribute('data-close')) { closeDialog(target.closest('dialog')!); return; }
  if (target.dataset.dialog) { openDialog(target.dataset.dialog, target); return; }
  if (target instanceof HTMLAnchorElement && target.hash) {
    const index = CHAPTERS.findIndex(ch => `#${ch.slug}` === target.hash);
    if (index >= 0) { event.preventDefault(); stopPlayback(); const dialog = target.closest('dialog'); if (dialog) { modalOpener = null; dialog.close(); } jump(index + (index ? .08 : .03), true, true); }
    return;
  }
  if (target.dataset.time) { stopPlayback(); state.weightCompare = null; jump(Number(target.dataset.time), true, false, true); return; }
  if (target.dataset.mode) {
    state.mode = target.dataset.mode as TimingMode; save('pas-timing', state.mode);
    document.querySelectorAll<HTMLElement>('[data-mode]').forEach(b => b.setAttribute('aria-pressed', `${b.dataset.mode === state.mode}`));
    document.querySelector('.mode-description')!.textContent = state.mode === 'echo' ? UI.echoDescription : UI.unisonDescription;
    stopPlayback(); jump(4.28); announce(state.mode === 'echo' ? UI.echoDescription : UI.unisonDescription); return;
  }
  if (target.dataset.focus) {
    state.focus = target.dataset.focus as DancerId;
    document.querySelectorAll<HTMLElement>('[data-focus]').forEach(b => b.setAttribute('aria-pressed', `${b.dataset.focus === state.focus}`));
    document.querySelector('.focus-description')!.textContent = state.focus === 'cen' ? UI.cenFocus : UI.chengFocus;
    lastRenderKey = ''; return;
  }
  if (target.dataset.weight) {
    stopPlayback(); state.weightCompare = target.dataset.weight as 'before' | 'during';
    document.querySelectorAll<HTMLElement>('[data-weight]').forEach(b => b.setAttribute('aria-pressed', `${b.dataset.weight === state.weightCompare}`));
    announce(state.weightCompare === 'before' ? 'The grip is formed; each dancer still carries their own weight.' : 'Both dancers lean gently through the grip.');
    lastRenderKey = ''; return;
  }
  if (target.dataset.compare) {
    state.compare = target.dataset.compare as 'opening' | 'ending';
    document.querySelectorAll<HTMLElement>('[data-compare]').forEach(b => b.setAttribute('aria-pressed', `${b.dataset.compare === state.compare}`));
    document.querySelector('.compare-note')!.textContent = state.compare === 'opening' ? 'The opening: a hand offered into an unfamiliar gap.' : 'The ending: the same space, a different waiting.';
    lastRenderKey = ''; return;
  }
  switch (target.dataset.action) {
    case 'enter': jump(.36); break;
    case 'ground': state.ground = !state.ground; target.setAttribute('aria-pressed', `${state.ground}`); target.querySelector('span')!.textContent = state.ground ? UI.hideFloorContact : UI.floorContact; lastRenderKey = ''; break;
    case 'contact': state.contact = !state.contact; target.setAttribute('aria-pressed', `${state.contact}`); target.querySelector('span')!.textContent = state.contact ? 'Return to the full view' : UI.contact; lastRenderKey = ''; break;
    case 'paths': state.paths = !state.paths; target.setAttribute('aria-pressed', `${state.paths}`); target.querySelector('span')!.textContent = state.paths ? UI.hidePath : UI.path; lastRenderKey = ''; break;
    case 'play-experiment': play(4.0, 4.76, 6, state.mode === 'echo' ? 'Echo' : 'Unison'); break;
    case 'reset-experiment': {
      stopPlayback(); state.mode = 'unison'; save('pas-timing', state.mode); jump(4.0);
      document.querySelectorAll<HTMLElement>('[data-mode]').forEach(b => b.setAttribute('aria-pressed', `${b.dataset.mode === 'unison'}`));
      document.querySelector('.mode-description')!.textContent = UI.unisonDescription; announce('The experiment is reset to Unison.'); break;
    }
    case 'play-complete': play(6.76, 7.99, 10.2, 'A complete phrase'); break;
    case 'pause-playback': if (state.playback) { state.playback.paused = !state.playback.paused; state.playback.last = 0; target.innerHTML = icon(state.playback.paused ? 'play' : 'pause'); target.setAttribute('aria-label', state.playback.paused ? 'Resume playback' : 'Pause playback'); announce(state.playback.paused ? 'Paused.' : 'Playing.'); } break;
    case 'replay-playback': if (state.playback) { state.playback.cursor = state.playback.from; state.playback.last = 0; state.playback.paused = false; jump(state.playback.from); document.querySelector('[data-action="pause-playback"]')!.innerHTML = icon('pause'); document.querySelector('[data-action="pause-playback"]')!.setAttribute('aria-label', 'Pause playback'); } break;
    case 'exit-playback': stopPlayback(true); announce('Continue by scrolling.'); break;
    case 'gentle': state.gentle = !state.gentle; target.setAttribute('aria-pressed', `${!state.gentle}`); target.setAttribute('aria-label', state.gentle ? 'Pause gentle motion' : 'Resume gentle motion'); target.innerHTML = icon(state.gentle ? 'pause' : 'play'); lastRenderKey = ''; break;
    case 'sound': try { const on = await sound.toggle(); target.setAttribute('aria-pressed', `${on}`); target.setAttribute('aria-label', on ? UI.soundOn : UI.soundOff); target.innerHTML = `${icon(on ? 'sound' : 'mute')}<span>${on ? UI.soundOn : UI.soundOff}</span>`; } catch { target.setAttribute('aria-label', 'Sound unavailable'); target.innerHTML = `${icon('mute')}<span>Sound unavailable</span>`; announce('Audio could not start. The duet remains complete in silence.'); } break;
    case 'retry': void initScene(); break;
  }
});

root.addEventListener('change', event => {
  const target = event.target as HTMLInputElement;
  if (target.name === 'motion') { state.motion = target.value as typeof state.motion; save('pas-motion', state.motion); configureMotion(); announce(state.reduced ? UI.reduceMotionDescription : UI.fullMotionDescription); }
});

function inputTakesOver(event: Event) {
  hasUserInput = true;
  const target = event.target as HTMLElement | null;
  if (target?.closest?.('dialog')) return;
  if (event instanceof KeyboardEvent) {
    if (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) return;
    if (target?.closest?.('input, select, textarea, [contenteditable="true"]')) return;
    if (event.key === ' ' && target?.closest?.('button, summary')) return;
  }
  if (event.type === 'pointerdown' && target?.closest?.('button, input, select, summary, a')) return;
  state.entered = true; state.weightCompare = null; state.observedChapter = -1;
  document.querySelectorAll<HTMLElement>('[data-weight]').forEach(b => b.setAttribute('aria-pressed', 'false'));
  if (state.playback) { stopPlayback(); announce('Scrolling has resumed.'); }
}
window.addEventListener('wheel', inputTakesOver, { passive: true });
window.addEventListener('touchmove', inputTakesOver, { passive: true });
window.addEventListener('pointerdown', inputTakesOver, { passive: true });
window.addEventListener('keydown', inputTakesOver);
window.addEventListener('scroll', () => { if (window.scrollY > 3) state.entered = true; }, { passive: true });
window.addEventListener('popstate', event => {
  hasUserInput = true;
  stopPlayback(); const i = CHAPTERS.findIndex(ch => `#${ch.slug}` === location.hash);
  const t = event.state?.pas ? Number(event.state.t) : Math.max(0, i) + .08; jump(t, false, true);
});
window.addEventListener('resize', () => layout(true));
reduceQuery.addEventListener('change', () => { if (state.motion === 'system') configureMotion(); });
document.addEventListener('visibilitychange', () => { sound.background(document.hidden); if (state.playback) { state.playback.paused = true; state.playback.last = 0; document.querySelector('[data-action="pause-playback"]')!.innerHTML = icon('play'); document.querySelector('[data-action="pause-playback"]')!.setAttribute('aria-label', 'Resume playback'); } if (!document.hidden) { lastRenderKey = ''; cancelAnimationFrame(rafId); rafId = requestAnimationFrame(tick); } });
canvas.addEventListener('pas-restored', () => { state.failed = false; state.ready = true; document.querySelector<HTMLElement>('.fallback-notice')!.hidden = true; lastRenderKey = ''; });

async function initScene() {
  const token = ++sceneLoadToken;
  state.failed = false;
  try {
    await prepareAssets();
    let driver: StageDriver;
    const fail = (reason: string) => {
      if (reason === 'frame') { announce('This moment is temporarily unavailable. Try another moment.'); document.querySelector<HTMLElement>('.fallback-notice')!.hidden = false; document.querySelector('.fallback-notice span')!.textContent = 'This moment could not load. A nearby still or the chapter description remains available.'; return; }
      state.failed = true; state.ready = false;
      document.querySelector<HTMLElement>('.fallback-notice')!.hidden = false; lastRenderKey = '';
    };
    if (new URLSearchParams(location.search).get('renderer') === 'webgl') {
      const { DanceStage } = await import('./render/stage'); driver = new DanceStage(canvas, fail);
    } else {
      const { DanceSequence } = await import('./render/sequence'); driver = new DanceSequence(canvas, fail);
    }
    if (token !== sceneLoadToken || destroyed) { driver.dispose(); return; }
    stage?.dispose(); stage = driver;
    await driver.load(state.t, state.mode);
    if (token !== sceneLoadToken || destroyed) { driver.dispose(); return; }
    state.ready = true; state.failed = false; document.querySelector<HTMLElement>('.fallback-notice')!.hidden = true;
    performance.mark('pas-scene-ready'); lastRenderKey = '';
  } catch (error) {
    if (token !== sceneLoadToken) return;
    state.failed = true; state.ready = false; document.querySelector<HTMLElement>('.fallback-notice')!.hidden = false;
    console.warn('PAS: this movement could not load; the reading view remains available.', error);
  }
}

function setFallback(t: number, chapter: number) {
  const stepList = CHAPTERS[chapter].steps;
  const nearest = stepList.reduce((best, s) => Math.abs(s.t - t) < Math.abs(best.t - t) ? s : best, stepList[0]);
  const index = stepList.indexOf(nearest);
  let name = `ch-${String(chapter + 1).padStart(2, '0')}-${index + 1}`;
  if (chapter === 4) name += `-${state.mode}`;
  if (chapter === 9 && state.compare === 'opening') name = 'ch-01-1';
  if (chapter === 3 && state.weightCompare) name = state.weightCompare === 'before' ? 'compare-own-weight' : 'ch-04-2';
  const faultAll = new URLSearchParams(location.search).get('qa') === '1' && new URLSearchParams(location.search).get('fault') === 'all';
  const source = asset(`${faultAll ? '__qa_missing_stills__' : 'stills'}/${isNarrow() ? 'narrow/' : ''}${name}.webp`);
  if (lastFallbackSrc !== source) {
    lastFallbackSrc = source; fallback.removeAttribute('src');
    const request = new Image(); request.onload = () => { if (lastFallbackSrc === source && (state.failed || !state.ready)) { fallback.src = source; fallback.alt = nearest.description; } };
    request.onerror = () => {
      if (lastFallbackSrc !== source) return;
      fallback.removeAttribute('src'); fallback.alt = `Image unavailable. ${nearest.description}`;
      announce('This image could not be loaded. The chapter description and moment controls remain available.');
    };
    request.src = source;
  }
}

function renderUi(t: number) {
  const chapter = chapterAt(t); const local = t - chapter;
  const current = CHAPTERS[chapter]; const beat = local < .38 ? 0 : 1;
  stageNote.textContent = current.caption;
  chapters.forEach((section, index) => {
    const content = section.querySelector<HTMLElement>('.chapter-content')!;
    const opacity = index === chapter ? (index === 9 || state.reduced || state.observedChapter === chapter ? 1 : 1 - smooth(.77, .96, local)) : 0;
    content.inert = index !== chapter || opacity < .05;
    content.style.opacity = `${opacity}`;
    section.classList.toggle('is-current', index === chapter);
  });
  railLinks.forEach((link, i) => {
    if (i === chapter) link.setAttribute('aria-current', 'step'); else link.removeAttribute('aria-current');
    link.style.setProperty('--fill', `${i < chapter ? 100 : i === chapter ? local * 100 : 0}%`);
  });
  if (chapter !== lastChapter || beat !== lastBeat) {
    document.querySelector('.current-number')!.textContent = String(chapter + 1).padStart(2, '0');
    document.querySelector('.current-name')!.textContent = current.title;
    const beatNote = chapters[chapter].querySelector('.beat-note')!;
    beatNote.querySelector('p')!.textContent = current.beats[beat].text;
    beatNote.querySelector('.beat-count')!.textContent = beat === 0 ? 'A' : 'B';
    scene.setAttribute('aria-label', current.alt); stageNote.textContent = current.caption;
    if (chapter !== 9) state.compare = 'ending';
    if (chapter !== 3) state.weightCompare = null;
    if (lastChapter !== chapter) syncUrl(t, false);
    lastChapter = chapter; lastBeat = beat;
  }
  if (chapter === 9) {
    document.querySelectorAll<HTMLElement>('[data-compare]').forEach(b => b.setAttribute('aria-pressed', `${b.dataset.compare === state.compare}`));
    document.querySelector('.compare-note')!.textContent = state.compare === 'opening' ? 'The opening: a hand offered into an unfamiliar gap.' : 'The ending: the same space, a different waiting.';
    stageNote.textContent = state.compare === 'opening' ? 'The opening — a hand offered, an answer still to come.' : current.caption;
  }
  document.querySelectorAll<HTMLElement>('[data-weight]').forEach(b => b.setAttribute('aria-pressed', `${b.dataset.weight === state.weightCompare}`));
  let sceneDescription = current.alt;
  if (chapter === 9 && state.compare === 'opening') sceneDescription = 'The opening: Cen offers a hand while Cheng remains still. Their hands are apart and both dancers stand on their own feet.';
  if (chapter === 3 && state.weightCompare === 'before') { sceneDescription = 'Cen and Cheng have formed a one-hand grip. Each dancer is upright in their own weight; the outward lean has not begun.'; stageNote.textContent = 'A grip is formed. Each still carries their own weight.'; }
  scene.setAttribute('aria-label', sceneDescription);
  if (chapter === 8 && state.focus) stageNote.textContent = state.focus === 'cen' ? UI.cenFocus : UI.chengFocus;
  if (chapter === 9 && state.compare === 'opening') stageNote.textContent = 'The opening — a hand offered, an answer still to come.';
  document.documentElement.classList.toggle('is-hero', chapter === 0);
  document.documentElement.classList.toggle('is-ending', chapter === 9);
  document.documentElement.dataset.chapter = String(chapter + 1);
  document.documentElement.dataset.progress = t.toFixed(5);
  document.documentElement.dataset.mode = state.mode;
  document.documentElement.dataset.render = state.failed ? 'still' : state.ready ? 'ready' : 'loading';
  document.documentElement.dataset.motion = state.reduced ? 'reduced' : 'full';
  const notice = document.querySelector<HTMLElement>('.fallback-notice')!;
  const noticeHost = state.failed ? chapters[chapter].querySelector<HTMLElement>('.chapter-content')! : root;
  if (notice.parentElement !== noticeHost) noticeHost.append(notice);
  notice.classList.toggle('in-reading', state.failed);
  const showPhoto = chapter === 0 && !state.entered;
  picture.hidden = !showPhoto;
  const visible = state.ready && !state.failed && !showPhoto;
  canvas.style.visibility = visible && stage?.rendererKind !== 'authored-sequence' ? 'visible' : 'hidden';
  stage?.setVisible?.(visible);
  fallback.hidden = (state.ready && !state.failed) || showPhoto;
  if (!fallback.hidden) setFallback(t, chapter);
}

function tick(now: number) {
  if (destroyed || document.hidden) return;
  if (state.playback && !state.playback.paused) {
    const p = state.playback;
    if (p.last) p.cursor += Math.min((now - p.last) / 1000, .1) * (p.to - p.from) / p.duration;
    p.last = now;
    if (p.cursor >= p.to) { p.cursor = p.to; p.paused = true; document.querySelector('[data-action="pause-playback"]')!.innerHTML = icon('play'); document.querySelector('[data-action="pause-playback"]')!.setAttribute('aria-label', 'Resume playback'); announce('The phrase is complete.'); }
    if (lenis) lenis.scrollTo(p.cursor * unit, { immediate: true, force: true }); else window.scrollTo({ top: p.cursor * unit, behavior: 'instant' });
  }
  lenis?.raf(now);
  state.t = clamp(window.scrollY / unit, 0, 9.999);
  let poseT = state.t;
  const chapter = chapterAt(poseT);
  if (state.reduced) { const steps = CHAPTERS[chapter].steps; poseT = steps.reduce((best, step) => Math.abs(step.t - state.t) < Math.abs(best.t - state.t) ? step : best, steps[0]).t; }
  if (chapter === 9 && state.compare === 'opening') poseT = .08;
  if (chapter === 3 && state.weightCompare) poseT = state.weightCompare === 'before' ? 2.89 : 3.42;
  const breath = stage?.rendererKind !== 'authored-sequence' && state.gentle && !state.reduced && !state.playback ? Math.sin(now / 2100) : 0;
  const renderKey = `${poseT.toFixed(5)}|${breath.toFixed(5)}|${state.mode}|${state.ground}|${state.paths}|${state.contact}|${state.focus}`;
  if (state.ready && !state.failed && renderKey !== lastRenderKey) {
    frame = evaluateDance(poseT, { mode: state.mode, layout: stage?.rendererKind === 'authored-sequence' ? 'wide' : isNarrow() ? 'narrow' : 'wide', breath });
    stage!.render(frame, { ground: state.ground && chapter === 1, paths: state.paths && chapter === 5, contact: state.contact && chapter === 2, focus: chapter === 8 ? state.focus : null, reduced: state.reduced, detail: state.contact && chapter === 2 });
    document.documentElement.dataset.contact = frame.contact.kind;
    lastRenderKey = renderKey;
  }
  if (Math.abs(state.t - lastUiT) > .0001) sound.setPosition(state.t);
  renderUi(state.t); lastUiT = state.t;
  rafId = requestAnimationFrame(tick);
}

function restore() {
  history.scrollRestoration = 'manual';
  const hashIndex = CHAPTERS.findIndex(ch => `#${ch.slug}` === location.hash);
  let restoreT = hashIndex > 0 ? hashIndex + .08 : 0;
  try { const saved = JSON.parse(sessionStorage.getItem('pas-position') ?? 'null'); if (saved && location.hash === saved.hash && Number.isFinite(saved.t)) restoreT = saved.t; } catch { /* Native entry remains usable. */ }
  if (restoreT) jump(restoreT, false); else window.scrollTo(0, 0);
  return restoreT;
}

configureMotion(); layout(false);
const initialEntryT = restore();
// A cold fragment navigation can run its native anchor scroll after module setup.
// Restore the captured narrative position once loading settles, unless input took over.
const settleInitialEntry = () => requestAnimationFrame(() => {
  if (!hasUserInput && initialEntryT > 0) jump(initialEntryT, false, false, true);
});
if (document.readyState === 'complete') settleInitialEntry();
else window.addEventListener('load', settleInitialEntry, { once: true });
performance.mark('pas-interactive');
const openingImage = document.querySelector<HTMLImageElement>('.opening-art img')!;
if (openingImage.complete) performance.mark('pas-first-visual'); else openingImage.addEventListener('load', () => performance.mark('pas-first-visual'), { once: true });
void initScene(); rafId = requestAnimationFrame(tick);
window.addEventListener('pagehide', () => {
  try { sessionStorage.setItem('pas-position', JSON.stringify({ t: state.t, hash: location.hash })); } catch { /* Optional. */ }
  sound.background(true);
});
window.addEventListener('pageshow', () => { if (!destroyed) { lastRenderKey = ''; cancelAnimationFrame(rafId); rafId = requestAnimationFrame(tick); } });
if (import.meta.hot) import.meta.hot.dispose(() => { destroyed = true; cancelAnimationFrame(rafId); sceneLoadToken++; stage?.dispose(); lenis?.destroy(); sound.dispose(); });

// Local review controls are opt-in and accept only the same-origin parent.
// They position transition samples; normal navigation tests use the real UI.
if (new URLSearchParams(location.search).get('qa') === '1') {
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== parent || event.data?.type !== 'pas-qa-seek' || !Number.isFinite(event.data.t)) return;
    hasUserInput = true;
    stopPlayback(); state.weightCompare = null; state.compare = 'ending'; jump(event.data.t, false, false);
  });
  const sendReviewStatus = () => {
    const sequence = document.querySelector<HTMLElement>('.sequence-stage');
    parent.postMessage({ type: 'pas-qa-status', text: `CH ${document.documentElement.dataset.chapter} · t ${state.t.toFixed(3)} · frame ${sequence?.dataset.frame ?? '—'} · ${state.mode} · ${document.documentElement.dataset.render} · ${state.reduced ? 'still' : 'continuous'} · ${innerWidth}×${innerHeight} · cache ${sequence?.dataset.cache ?? '—'}` }, location.origin);
  };
  window.addEventListener('pas-frame', sendReviewStatus);
  window.addEventListener('scroll', sendReviewStatus, { passive: true });
}

window.addEventListener('pas-frame', event => { if (!(event as CustomEvent).detail?.fallback && state.ready && !state.failed) document.querySelector<HTMLElement>('.fallback-notice')!.hidden = true; });
