import 'lenis/dist/lenis.css';
import './styles.css';
import './diagrams.css';
import Lenis from 'lenis';
import { softText } from '../../shared/soft-swap.ts';
import { applyReveal } from '../../shared/soft-reveal.ts';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { chapters } from './content.ts';
import { evaluateStory, evaluateTransition, clamp01, type SectionBounds } from './story.ts';
import { mediaRetryUrl, retrySrcset, sameMediaUrl } from './media.ts';

gsap.registerPlugin(ScrollTrigger);
const root = document.documentElement;
const chapterElements = [...document.querySelectorAll<HTMLElement>('[data-chapter]')];
const transitionElements = [...document.querySelectorAll<HTMLElement>('[data-transition]')];
const reducedPreference = matchMedia('(prefers-reduced-motion: reduce)');
const status = document.querySelector<HTMLElement>('.global-status')!;
let storedMotion: string | null = null;
try { storedMotion = localStorage.getItem('pulse-motion'); } catch { /* Storage is optional. */ }
let reducedMotion = storedMotion ? storedMotion === 'reduced' : reducedPreference.matches;
let chapterBounds: SectionBounds[] = [];
let transitionBounds: SectionBounds[] = [];
let lastY = -1;
let needsRender = true;
let lenis: Lenis;
let activeChapter = -1;
let focusReturn: HTMLElement | null = null;
let skipFocusReturn = false;
let disposed = false;

// The hero is a fixed authored composition. Only a separate light layer moves;
// the heart image, anatomical pose, heading, and reading contrast never animate.
type HeroState = 'first-frame' | 'reveal' | 'full-composition' | 'living-hold' | 'first-scroll' | 'return';
const heroElement = document.querySelector<HTMLElement>('.hero')!;
const heroImage = heroElement.querySelector<HTMLImageElement>('.hero-art img')!;
let heroClock = 0;
let heroLastTick: number | null = null;
let heroRevealAt: number | null = null;
let heroCompleteAt: number | null = null;
let heroIntroComplete = false;
let heroHasScrolled = false;
let heroLastVisual = '';
const HERO_REVEAL_SECONDS = 1.4;
const HERO_STILL_HOLD_SECONDS = 0.3;
const HERO_LIVING_LIGHT_SECONDS = 3.2;

function writeHeroFrame(state: HeroState, progress: number, light: number, position: number): void {
  if (heroElement.dataset.heroState !== state) heroElement.dataset.heroState = state;
  const signature = `${progress.toFixed(3)}:${light.toFixed(4)}:${position.toFixed(3)}`;
  if (signature === heroLastVisual) return;
  heroLastVisual = signature;
  heroElement.dataset.heroProgress = progress.toFixed(3);
  heroElement.style.setProperty('--hero-graze-opacity', light.toFixed(4));
  heroElement.style.setProperty('--hero-graze-position', `${position.toFixed(3)}%`);
}

function completeHeroIntro(): void {
  if (!heroIntroComplete) {
    heroIntroComplete = true;
    heroCompleteAt = heroClock;
  }
}

function renderHero(time: number): void {
  // Use actual visible time. Clamping each frame would stretch a short reveal
  // into many seconds in a throttled browser; visibilitychange resets the clock
  // anchor so time spent in the background is still excluded.
  if (heroLastTick !== null) heroClock += Math.max(0, time - heroLastTick);
  heroLastTick = time;
  const ready = heroImage.complete && heroImage.naturalWidth > 0;
  const assetState = ready ? 'ready' : 'fallback';
  if (heroElement.dataset.heroAsset !== assetState) heroElement.dataset.heroAsset = assetState;

  // Any deliberate departure cancels the introduction. Returning never replays
  // it, even when the visitor scrolls before the requested image has arrived.
  if (window.scrollY > 40) {
    heroHasScrolled = true;
    heroElement.dataset.entered = 'true';
    completeHeroIntro();
    writeHeroFrame('first-scroll', 1, 0, 50);
    return;
  }
  if (heroHasScrolled) {
    writeHeroFrame('return', 1, 0, 50);
    return;
  }
  if (reducedMotion) {
    completeHeroIntro();
    writeHeroFrame('full-composition', 1, 0, 50);
    return;
  }

  if (!heroIntroComplete) {
    if (!ready) {
      // The complete inline atlas fallback and all words are already visible.
      // Do not keep an introduction pending indefinitely on a failed network.
      if (heroClock < 2) {
        writeHeroFrame('first-frame', 0, 0, 50);
        return;
      }
      completeHeroIntro();
    } else {
      heroRevealAt ??= heroClock + 0.16;
      const elapsed = heroClock - heroRevealAt;
      if (elapsed < 0) {
        writeHeroFrame('first-frame', 0, 0, 50);
        return;
      }
      if (elapsed < HERO_REVEAL_SECONDS) {
        const p = clamp01(elapsed / HERO_REVEAL_SECONDS);
        const eased = p * p * (3 - 2 * p);
        writeHeroFrame('reveal', p, Math.sin(Math.PI * p) * 0.22, 24 + eased * 52);
        return;
      }
      completeHeroIntro();
    }
  }

  const settledFor = heroClock - (heroCompleteAt ?? heroClock);
  if (settledFor < HERO_STILL_HOLD_SECONDS) {
    writeHeroFrame('full-composition', 1, 0, 50);
    return;
  }
  const living = clamp01((settledFor - HERO_STILL_HOLD_SECONDS) / HERO_LIVING_LIGHT_SECONDS);
  // One restrained light breath, then a completely still reading hold. This is
  // lighting, not a simulated heartbeat. No ongoing timer or extra rAF exists.
  const light = ready && living < 1 ? Math.sin(Math.PI * living) * 0.055 : 0;
  writeHeroFrame('living-hold', 1, light, light > 0 ? 50 + living * 7 : 50);
}

const measure = () => {
  const scrollY = window.scrollY;
  const bounds = (element: HTMLElement) => ({ id: element.id, top: element.getBoundingClientRect().top + scrollY, height: element.offsetHeight });
  chapterBounds = chapterElements.map(bounds);
  transitionBounds = transitionElements.map(bounds);
  lenis?.resize();
  ScrollTrigger.refresh();
  needsRender = true;
};

function createLenis(): void {
  lenis?.destroy();
  lenis = new Lenis({
    autoRaf: false,
    smoothWheel: !reducedMotion,
    syncTouch: false,
    lerp: 0.14,
    anchors: false,
    prevent: node => !!node.closest('dialog[open]'),
  });
  lenis.on('scroll', () => { ScrollTrigger.update(); needsRender = true; });
}

function setMotion(reduced: boolean, remember = true): void {
  reducedMotion = reduced;
  root.dataset.motion = reduced ? 'reduced' : 'on';
  document.querySelectorAll<HTMLElement>('button[data-motion] span').forEach(label => { label.textContent = reduced ? 'Motion: Reduced' : 'Motion: On'; });
  if (remember) { storedMotion = reduced ? 'reduced' : 'on'; try { localStorage.setItem('pulse-motion', reduced ? 'reduced' : 'on'); } catch { /* No persistent storage is required. */ } }
  createLenis();
  needsRender = true;
  if (reduced) {
    completeHeroIntro();
    writeHeroFrame(heroHasScrolled ? (window.scrollY > 40 ? 'first-scroll' : 'return') : 'full-composition', 1, 0, 50);
  }
  status.textContent = reduced ? 'Reduced motion. All chapters and interactions remain available.' : 'Motion is on. Scroll at your own pace.';
}

const transitionParts = transitionElements.map(element => ({
  element,
  source: element.querySelector<SVGElement>('.anchor-source'),
  target: element.querySelector<SVGElement>('.anchor-target'),
  trace: [...element.querySelectorAll<SVGElement>('.anchor-trace')],
  stageLabel: element.querySelector<HTMLElement>('.transition-stage-label')!,
  sourceText: element.querySelector<HTMLElement>('.transition-source')!,
  targetText: element.querySelector<HTMLElement>('.transition-target')!,
  lastStage: -1,
  lastProgress: -1,
}));

function render(): void {
  if (disposed || document.hidden || chapterBounds.length === 0) return;
  const y = window.scrollY;
  if (!needsRender && Math.abs(lastY - y) < 0.05) return;
  needsRender = false;
  lastY = y;
  const snapshot = evaluateStory({ scrollY: y, viewport: { width: innerWidth, height: innerHeight }, chapters: chapterBounds, transitions: transitionBounds, reducedMotion });
  root.style.setProperty('--story-progress', String(snapshot.progress));
  root.dataset.chapter = String(snapshot.chapterIndex + 1);
  if (snapshot.chapterIndex !== activeChapter) {
    activeChapter = snapshot.chapterIndex;
    const chapter = chapters[activeChapter];
    softText(document.querySelector('[data-current-number]'), String(chapter.number).padStart(2, '0'), { instant: reducedMotion });
    softText(document.querySelector('[data-current-title]'), chapter.shortTitle, { instant: reducedMotion });
    document.querySelectorAll<HTMLElement>('[data-dot]').forEach(dot => {
      if (Number(dot.dataset.dot) === chapter.number) dot.setAttribute('aria-current', 'location');
      else dot.removeAttribute('aria-current');
    });
  }
  transitionParts.forEach((parts, index) => {
    const bounds = transitionBounds[index];
    if (!bounds) return;
    const p = clamp01((snapshot.focusY - bounds.top) / bounds.height);
    if (parts.lastProgress === p && parts.element.dataset.motion === root.dataset.motion) return;
    parts.lastProgress = p;
    const frame = evaluateTransition(index, p, reducedMotion);
    const style = parts.element.style;
    style.setProperty('--transition-progress', String(frame.visualProgress));
    style.setProperty('--source-opacity', String(frame.sourceOpacity));
    style.setProperty('--target-opacity', String(frame.targetOpacity));
    style.setProperty('--line-progress', String(frame.lineProgress));
    style.setProperty('--electrical-opacity', String(frame.electricalOpacity));
    style.setProperty('--blood-opacity', String(frame.bloodOpacity));
    parts.element.dataset.motion = root.dataset.motion;
    parts.element.dataset.progress = p.toFixed(4);
    parts.element.dataset.stage = String(frame.stage);
    if (parts.source) {
      parts.source.style.opacity = String(frame.sourceOpacity);
      applyReveal(parts.source, frame.sourceClip);
      parts.source.style.transform = `scale(${frame.sourceScale})`;
    }
    if (parts.target) {
      parts.target.style.opacity = String(frame.targetOpacity);
      applyReveal(parts.target, frame.targetClip);
      parts.target.style.transform = `scale(${frame.targetScale})`;
    }
    parts.trace.forEach(trace => { trace.setAttribute('pathLength', '100'); trace.style.strokeDashoffset = String((1 - frame.lineProgress) * 100); });
    parts.sourceText.style.opacity = String(frame.sourceTextOpacity);
    parts.targetText.style.opacity = String(frame.targetTextOpacity);
    if (frame.stage !== parts.lastStage) { softText(parts.stageLabel, frame.stageLabel, { instant: reducedMotion }); parts.lastStage = frame.stage; }
  });
}

function closeDialogs(restore = true): void {
  skipFocusReturn = !restore;
  document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(dialog => dialog.close());
}

function navigateTo(hash: string, push = true, immediate = false): void {
  let id: string;
  try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
  const target = document.getElementById(id);
  if (!target) return;
  closeDialogs(false);
  // Resolve from this document, not an inherited <base> in an about:srcdoc QA
  // frame. HTTP/file documents retain their own scheme, path, and normal hashes.
  if (push && location.hash !== hash) history.pushState(null, '', location.href.split('#')[0] + hash);
  const y = Math.max(0, target.getBoundingClientRect().top + window.scrollY - (id === 'beginning' ? 0 : 105));
  lenis.scrollTo(y, { immediate: immediate || reducedMotion || Math.abs(y - window.scrollY) > innerHeight * 3, duration: 0.85, force: true });
  const focusTarget = target.matches('h1,h2,h3') ? target : target.querySelector<HTMLElement>('h1,h2,h3') || target;
  if (!focusTarget.hasAttribute('tabindex')) focusTarget.setAttribute('tabindex', '-1');
  focusTarget.focus({ preventScroll: true });
  needsRender = true;
}

document.addEventListener('click', event => {
  const element = event.target as Element;
  const anchor = element.closest<HTMLAnchorElement>('a[href^="#"]');
  if (anchor && anchor.hash && !(event as MouseEvent).metaKey && !(event as MouseEvent).ctrlKey) {
    if (document.getElementById(decodeURIComponent(anchor.hash.slice(1)))) { event.preventDefault(); navigateTo(anchor.hash); }
    return;
  }
  const open = element.closest<HTMLButtonElement>('[data-open]');
  if (open) {
    const dialog = document.getElementById(open.dataset.open!) as HTMLDialogElement;
    focusReturn = open.closest('dialog') ? document.querySelector<HTMLElement>('.chapters-button') : open;
    closeDialogs(false);
    skipFocusReturn = false;
    dialog.showModal();
    return;
  }
  if (element.closest('[data-close]')) { closeDialogs(); return; }
  if (element.closest('button[data-motion]')) { setMotion(!reducedMotion); return; }
  if (element.closest('[data-stills]')) { setMotion(true); closeDialogs(); return; }
  if (element.closest('[data-sound]')) { void toggleSound(); return; }
  const option = element.closest<HTMLButtonElement>('[data-select], [data-reset]');
  const interaction = option?.closest<HTMLElement>('[data-interaction]');
  if (option && interaction) {
    const chapter = chapters[Number(interaction.dataset.interaction) - 1];
    const value = option.hasAttribute('data-reset') ? chapter.interaction.initialValue : option.dataset.select!;
    interaction.querySelectorAll<HTMLElement>('[data-select]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.select === value)));
    const figure = document.getElementById(`diagram-${chapter.number}`)!;
    figure.dataset.mode = value;
    figure.querySelectorAll<SVGElement>('.anatomy-svg').forEach(svg => { svg.dataset.mode = value; });
    const result = chapter.interaction.options.find(op => op.value === value)?.result || chapter.interaction.description;
    document.getElementById(`result-${chapter.number}`)!.textContent = result;
    interaction.dataset.selected = value;
    measure();
  }
});

document.querySelectorAll<HTMLDialogElement>('dialog').forEach(dialog => {
  dialog.addEventListener('close', () => { if (!skipFocusReturn) focusReturn?.focus({ preventScroll: true }); });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const b = dialog.getBoundingClientRect(); if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) dialog.close(); } });
});

// Every image owns its own readiness state. A late image can never replace
// another chapter's plate; retry tokens also invalidate stale completions.
document.querySelectorAll<HTMLImageElement>('picture img').forEach((img, imageIndex) => {
  const picture = img.closest<HTMLElement>('picture')!;
  const container = picture.parentElement!;
  let token = 0;
  const settle = () => {
    if (!img.complete || !img.naturalWidth) return;
    picture.dataset.assetState = 'ready';
    picture.classList.remove('asset-failed');
    container.querySelector<HTMLElement>(`[data-error-for="${picture.dataset.assetId}"]`)?.remove();
    needsRender = true;
  };
  picture.dataset.assetId = `art-${imageIndex}`;
  picture.dataset.requestToken = String(token);
  const fail = () => {
    picture.dataset.assetState = 'failed';
    picture.classList.add('asset-failed');
    const existingNote = container.querySelector<HTMLElement>(`[data-error-for="${picture.dataset.assetId}"]`);
    if (existingNote) {
      existingNote.querySelector<HTMLButtonElement>('button')!.disabled = false;
      existingNote.querySelector('p')!.textContent = 'This scene could not load. The story remains available in still view.';
      return;
    }
    const note = document.createElement('div');
    note.className = 'media-error';
    note.dataset.errorFor = picture.dataset.assetId;
    const copy = document.createElement('p');
    copy.textContent = 'This scene could not load. The story remains available in still view.';
    const retry = document.createElement('button');
    retry.type = 'button'; retry.textContent = 'Retry';
    retry.addEventListener('click', () => {
      const current = ++token;
      picture.dataset.requestToken = String(current);
      picture.dataset.assetState = 'loading';
      retry.disabled = true; copy.textContent = 'Preparing the next scene…';
      const selected = img.currentSrc || img.src;
      const probe = new Image();
      probe.onload = () => {
        if (current !== token) return;
        // Preserve the picture's portrait/desktop choices, media conditions,
        // sizes, and width descriptors. Re-setting an unchanged embedded URL
        // also requests a fresh decode without corrupting its data bytes.
        picture.querySelectorAll<HTMLSourceElement | HTMLImageElement>('[srcset]').forEach(source => {
          const next = retrySrcset(source.getAttribute('srcset')!, selected, current, document.baseURI);
          if (next.matches) source.setAttribute('srcset', next.value);
        });
        const original = img.getAttribute('src');
        if (original && sameMediaUrl(original, selected, document.baseURI)) {
          img.setAttribute('src', mediaRetryUrl(original, current, document.baseURI));
        }
        // Only this picture's actual load event may remove the failure state.
      };
      probe.onerror = () => { if (current === token) fail(); };
      probe.src = mediaRetryUrl(selected, current, document.baseURI);
    });
    note.append(copy, retry); container.append(note);
  };
  img.addEventListener('load', settle);
  img.addEventListener('error', fail);
  if (img.complete) { if (img.naturalWidth) settle(); else fail(); }
});

let audioContext: AudioContext | null = null;
let master: GainNode | null = null;
let soundTimer: ReturnType<typeof setInterval> | undefined;
let soundOn = false;
let soundToken = 0;

function updateSoundUi(): void {
  const button = document.querySelector<HTMLButtonElement>('[data-sound]')!;
  button.setAttribute('aria-pressed', String(soundOn));
  button.querySelector('span')!.textContent = soundOn ? 'Sound: On' : 'Sound: Off';
}
function stopSound(): void {
  clearInterval(soundTimer);
  soundTimer = undefined;
  if (audioContext && master) master.gain.setTargetAtTime(0, audioContext.currentTime, 0.012);
}
function thud(at: number, pitch: number, level: number): void {
  if (!audioContext || !master) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(pitch, at);
  oscillator.frequency.exponentialRampToValueAtTime(pitch * 0.56, at + 0.14);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(level, at + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.2);
  oscillator.connect(gain); gain.connect(master); oscillator.start(at); oscillator.stop(at + 0.23);
  oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
}
function beginSound(): void {
  if (!audioContext || !master || !soundOn || document.hidden) return;
  stopSound(); master.gain.setTargetAtTime(0.28, audioContext.currentTime, 0.03);
  const pair = () => { if (!audioContext || !soundOn || document.hidden) return; const now = audioContext.currentTime + 0.01; thud(now, 72, 0.14); thud(now + 0.28, 91, 0.08); };
  pair(); soundTimer = setInterval(pair, 1700);
}
async function toggleSound(): Promise<void> {
  const current = ++soundToken;
  soundOn = !soundOn;
  updateSoundUi();
  if (!soundOn) { stopSound(); return; }
  try {
    if (!('AudioContext' in window)) throw new Error('Unavailable');
    audioContext ||= new AudioContext();
    if (!master) { master = audioContext.createGain(); master.gain.value = 0; master.connect(audioContext.destination); }
    await audioContext.resume();
    if (current !== soundToken || !soundOn) return;
    beginSound(); status.textContent = 'Illustrative sound is on. This is not a heart recording or measurement.';
  } catch {
    soundOn = false; updateSoundUi(); status.textContent = 'Audio is unavailable in this version.';
  }
}

window.addEventListener('popstate', () => { if (location.hash) navigateTo(location.hash, false, true); else lenis.scrollTo(0, { immediate: true }); });
window.addEventListener('hashchange', () => { if (location.hash) navigateTo(location.hash, false, true); });
window.addEventListener('resize', measure, { passive: true });
window.addEventListener('scroll', () => { needsRender = true; }, { passive: true });
document.addEventListener('visibilitychange', () => {
  heroLastTick = null;
  if (document.hidden) { stopSound(); void audioContext?.suspend(); }
  else { measure(); if (soundOn) void audioContext?.resume().then(beginSound); }
});
reducedPreference.addEventListener('change', event => { if (!storedMotion) setMotion(event.matches, false); });

root.classList.add('js');
setMotion(reducedMotion, false);
const storyTrigger = ScrollTrigger.create({ start: 0, end: () => ScrollTrigger.maxScroll(window), onUpdate: () => { needsRender = true; } });
const tick = (time: number) => { if (document.hidden || disposed) return; lenis.raf(time * 1000); renderHero(time); render(); };
gsap.ticker.add(tick);
gsap.ticker.lagSmoothing(0);
measure();
render();
if (location.hash) navigateTo(location.hash, false, true);
document.fonts.ready.then(measure).catch(() => { /* System fonts preserve the layout. */ });
document.addEventListener('toggle', () => setTimeout(measure, 0), true);
window.addEventListener('pageshow', event => { if (event.persisted) { disposed = false; measure(); } });
window.addEventListener('pagehide', event => {
  stopSound();
  if (!event.persisted) { disposed = true; gsap.ticker.remove(tick); lenis.destroy(); storyTrigger.kill(); }
});
