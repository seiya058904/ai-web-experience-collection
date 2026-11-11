import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { evaluateStory } from './story.ts';
import type { ChapterMetric, StorySnapshot, TransitionMetric } from './story.ts';
import { captureReadingPosition, restoreReadingPosition } from './reading-position.ts';
import type { ReadingPosition } from './reading-position.ts';
import { createReadingCheckpointStore, READING_SESSION_KEY } from './reading-checkpoint.ts';

export interface ScrollControllerOptions {
  onUpdate: (snapshot: StorySnapshot) => void;
  onChapterChange?: (id: string, index: number) => void;
}

export interface NavigateOptions {
  updateHistory?: boolean;
  focus?: boolean;
  immediate?: boolean;
}

export interface ScrollController {
  refresh: () => void;
  navigate: (id: string, options?: NavigateOptions) => boolean;
  setReduced: (reduced: boolean) => void;
  destroy: () => void;
  readonly reduced: boolean;
}

function fragmentId(hash: string): string {
  try { return decodeURIComponent(hash.replace(/^#/, '')); }
  catch { return ''; }
}

function routeKey(): string {
  return `${location.pathname}${location.search}${location.hash}`;
}

/**
 * Lenis 1.3.27, custom RAF integration. One persistent visible-page animation
 * clock owns both smoothing and the DOM story snapshot. Native browser scroll
 * is always the measured truth. No GSAP or second scrubbed playhead is used.
 */
export function createScrollController(options: ScrollControllerOptions): ScrollController {
  const root = document.documentElement;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let requestedReduced = false;
  let reduced = motionQuery.matches;
  let destroyed = false;
  let rafId = 0;
  let dirty = true;
  let measurementPending = true;
  let chapters: ChapterMetric[] = [];
  let transitionMetrics: TransitionMetric[] = [];
  let chapterElements: HTMLElement[] = [];
  let previousChapter = '';
  let previousScroll = NaN;
  let navigationSerial = 0;
  let navigationPending = false;
  let historyPending = false;
  const observed = new Set<Element>();
  const initialHash = fragmentId(window.location.hash);
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  // A hash describes the last explicit chapter link, not necessarily the last
  // reading position. Never replay that link during reload or history restore.
  let initialHashPending = Boolean(initialHash) && navigation?.type !== 'reload' && navigation?.type !== 'back_forward';
  let fontsSettled = !('fonts' in document);
  let loadSettled = document.readyState === 'complete';
  let reloadPosition: ReadingPosition | null = null;
  let reloadReadyFrames = 0;
  let checkpointPending = false;
  let lastCheckpointTime = -Infinity;
  let lastHistoryTime = -Infinity;
  let lastCheckpointSignature = '';
  const checkpointStore = createReadingCheckpointStore({
    route: routeKey, now: Date.now,
    getHistory: () => history.state,
    replaceHistory: state => history.replaceState(state, ''),
    getSession: () => sessionStorage.getItem(READING_SESSION_KEY),
    setSession: value => sessionStorage.setItem(READING_SESSION_KEY, value),
  });
  root.dataset.reloadRestoration = 'not-requested';
  if (navigation?.type === 'reload') {
    const saved = checkpointStore.read();
    reloadPosition = saved?.position ?? null;
    root.dataset.reloadRestoration = saved ? `pending-${saved.source}` : 'native-no-checkpoint';
  }

  function saveReadingPosition(departure = false): void {
    // Never replace a pending reload target with the browser's provisional Y.
    if (reloadPosition || !Number.isFinite(window.scrollY)) return;
    const now = performance.now();
    if (!departure && (!fontsSettled || !loadSettled || now - lastCheckpointTime < 500)) return;
    // Reuse the current frame's metrics while active; measure freshly only when
    // leaving. No extra layout read, RAF, timeout or scroll lock is introduced.
    if (departure) measure();
    const position = captureReadingPosition({ scrollY: window.scrollY, viewportHeight: window.innerHeight, chapters, transitions: transitionMetrics });
    const signature = JSON.stringify({ route: routeKey(), ...position });
    checkpointPending = false;
    if (!departure && signature === lastCheckpointSignature) return;
    const writeHistory = departure || now - lastHistoryTime >= 1000;
    const written = checkpointStore.save(position, writeHistory);
    lastCheckpointTime = now;
    if (written.history) lastHistoryTime = now;
    if (written.history || written.session) lastCheckpointSignature = signature;
  }

  function cancelReloadRestoration(reason = 'cancelled-navigation'): void {
    if (reloadPosition) root.dataset.reloadRestoration = reason;
    reloadPosition = null;
    reloadReadyFrames = 0;
  }

  function settleReloadPosition(): void {
    if (reloadPosition === null || !fontsSettled || !loadSettled) return;
    // Use the existing RAF clock and two measured frames after the last layout
    // refresh. Native load/hash restoration has then run and font geometry is
    // settled. This runs once, never as an ongoing lock on the user's position.
    if (++reloadReadyFrames < 2) return;
    const y = restoreReadingPosition(reloadPosition, { viewportHeight: window.innerHeight, chapters, transitions: transitionMetrics });
    cancelReloadRestoration('applied');
    lenis.scrollTo(y, { immediate: true });
    dirty = true;
  }

  function markDirty(): void { dirty = true; }

  function makeLenis(): Lenis {
    const instance = new Lenis({
      autoRaf: false,
      autoResize: false,
      anchors: false,
      smoothWheel: !reduced,
      syncTouch: false,
      lerp: 0.12,
      respectReducedMotion: true,
      // Dialog content keeps native scrolling; the document remains unlocked.
      prevent: (node) => Boolean(node.closest('dialog[open], [data-lenis-prevent]')),
    });
    instance.on('scroll', markDirty);
    return instance;
  }

  let lenis = makeLenis();

  const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => refresh());

  function measure(): void {
    if (destroyed) return;
    measurementPending = false;
    const scrollY = window.scrollY;
    chapterElements = [...document.querySelectorAll<HTMLElement>('.chapter[id]')];
    chapters = chapterElements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { id: element.id, top: rect.top + scrollY, height: Math.max(1, rect.height) };
    });
    const markers = [...document.querySelectorAll<HTMLElement>('.chapter-transition[data-from][data-to]')];
    transitionMetrics = markers.flatMap((element) => {
      const rect = element.getBoundingClientRect();
      // Still view removes bridge layout. Do not turn a hidden zero-size marker
      // into a synthetic transition at the current scroll offset.
      if (rect.height <= 0 || rect.width <= 0) return [];
      return [{
        id: element.id || undefined,
        from: element.dataset.from!, to: element.dataset.to!,
        top: rect.top + scrollY, height: rect.height,
      }];
    });
    const current = new Set<Element>([document.body, ...chapterElements, ...markers]);
    for (const element of observed) {
      if (!current.has(element)) { resizeObserver?.unobserve(element); observed.delete(element); }
    }
    for (const element of current) {
      if (!observed.has(element)) { resizeObserver?.observe(element); observed.add(element); }
    }
    lenis.resize();
    dirty = true;
  }

  function render(): void {
    const snapshot = evaluateStory({
      scrollY: lenis.actualScroll,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
      chapters,
      transitions: transitionMetrics,
      reducedMotion: reduced,
    });
    previousScroll = snapshot.scrollY;
    dirty = false;
    root.dataset.activeChapter = snapshot.chapterId ?? '';
    root.dataset.storyProgress = snapshot.progress.toFixed(6);
    root.style.setProperty('--story-progress', String(snapshot.progress));
    root.dataset.motion = reduced ? 'reduced' : 'full';
    if (snapshot.transition) {
      root.dataset.transition = snapshot.transition.id;
      root.dataset.transitionProgress = snapshot.transition.progress.toFixed(6);
    } else {
      delete root.dataset.transition;
      delete root.dataset.transitionProgress;
    }
    checkpointPending = true;
    options.onUpdate(snapshot);
    if (snapshot.chapterId && snapshot.chapterId !== previousChapter) {
      previousChapter = snapshot.chapterId;
      options.onChapterChange?.(snapshot.chapterId, snapshot.activeChapter);
    }
  }

  function frame(time: number): void {
    rafId = 0;
    if (destroyed || document.hidden) return;
    // Schedule the next tick before callbacks; a rendering error cannot lock
    // native input or silently terminate Lenis's only active clock.
    rafId = requestAnimationFrame(frame);
    if (measurementPending) measure();
    lenis.raf(time);
    settleReloadPosition();
    if (dirty || lenis.actualScroll !== previousScroll) render();
    if (checkpointPending) saveReadingPosition();
  }

  function startClock(): void {
    if (!destroyed && !document.hidden && !rafId) rafId = requestAnimationFrame(frame);
  }

  function refresh(): void {
    if (destroyed) return;
    measurementPending = true;
    reloadReadyFrames = 0;
    dirty = true;
    startClock();
  }

  function focusChapter(element: HTMLElement): void {
    const heading = element.querySelector<HTMLElement>('h1, h2') ?? element;
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }

  function goTo(id: string, settings: NavigateOptions = {}, initial = false): boolean {
    if (destroyed) return false;
    const targetId = fragmentId(id);
    const element = document.getElementById(targetId);
    if (!(element instanceof HTMLElement) || !element.matches('.chapter')) return false;
    if (!initial) {
      initialHashPending = false;
      cancelReloadRestoration();
    }
    measure();
    const serial = ++navigationSerial;
    navigationPending = true;
    if (settings.updateHistory !== false && fragmentId(location.hash) !== targetId) {
      history.pushState(history.state, '', `#${encodeURIComponent(targetId)}`);
    }
    // Lenis 1.3.27 incorporates the element's scroll-margin-top and the root's
    // scroll-padding-top itself. Applying another header offset would double it.
    lenis.scrollTo(element, {
      immediate: settings.immediate ?? reduced,
      lock: false,
      onComplete: () => {
        if (destroyed || serial !== navigationSerial) return;
        navigationPending = false;
        if (settings.focus !== false) focusChapter(element);
        dirty = true;
      },
    });
    dirty = true;
    startClock();
    return true;
  }

  function settleInitialHash(): void {
    if (destroyed || !initialHashPending) return;
    if (fragmentId(location.hash) === initialHash) goTo(initialHash, { updateHistory: false, focus: false, immediate: true }, true);
    if (fontsSettled && loadSettled) initialHashPending = false;
  }

  function cancelProgrammaticNavigation(): void {
    initialHashPending = false;
    navigationSerial += 1;
    if (navigationPending) {
      navigationPending = false;
      lenis.scrollTo(lenis.actualScroll, { immediate: true });
    }
  }

  function onManualIntent(event: Event): void {
    // Tab, Enter and other real keyboard interactions also make a deferred
    // reload jump inappropriate, even when they do not scroll the document.
    if (event.isTrusted) cancelReloadRestoration('cancelled-input');
    if (event instanceof KeyboardEvent) {
      if (!['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) return;
      // Stop an existing wheel tween before the browser performs its native
      // keyboard scroll; never prevent the key's default action.
      if (lenis.isScrolling === 'smooth') lenis.scrollTo(lenis.actualScroll, { immediate: true });
    }
    if (event.type === 'pointerdown' && lenis.isScrolling === 'smooth') {
      lenis.scrollTo(lenis.actualScroll, { immediate: true });
    }
    cancelProgrammaticNavigation();
    dirty = true;
  }

  function onAnchor(event: MouseEvent): void {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const target = event.target;
    const link = target instanceof Element ? target.closest<HTMLAnchorElement>('a[href]') : null;
    if (link?.hasAttribute('data-chapter-link')) return;
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash) return;
    const element = document.getElementById(fragmentId(url.hash));
    if (!element?.matches('.chapter')) return;
    event.preventDefault();
    goTo(element.id);
  }

  function onHistory(): void {
    if (historyPending || destroyed) return;
    cancelReloadRestoration();
    historyPending = true;
    queueMicrotask(() => {
      historyPending = false;
      if (destroyed) return;
      cancelProgrammaticNavigation();
      const id = fragmentId(location.hash);
      if (id) goTo(id, { updateHistory: false, immediate: true });
      else {
        lenis.scrollTo(0, { immediate: true });
        if (chapterElements[0]) focusChapter(chapterElements[0]);
      }
      refresh();
    });
  }

  function onVisibility(): void {
    if (document.hidden) {
      saveReadingPosition(true);
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    } else {
      // Background restoration has one state: the actual restored position.
      navigationSerial += 1;
      navigationPending = false;
      lenis.scrollTo(window.scrollY, { immediate: true });
      refresh();
    }
  }

  function applyMotionPreference(): void {
    const next = requestedReduced || motionQuery.matches;
    if (destroyed || next === reduced) return;
    reduced = next;
    cancelProgrammaticNavigation();
    const position = window.scrollY;
    lenis.destroy();
    lenis = makeLenis();
    lenis.resize();
    lenis.scrollTo(position, { immediate: true });
    dirty = true;
    startClock();
  }

  function onFonts(): void {
    fontsSettled = true;
    refresh();
    settleInitialHash();
  }

  function onLoad(): void {
    loadSettled = true;
    refresh();
    settleInitialHash();
  }

  function onPageHide(event: PageTransitionEvent): void {
    if (!event.persisted) destroy();
    else {
      saveReadingPosition(true);
      cancelReloadRestoration();
      initialHashPending = false;
      navigationSerial += 1;
      navigationPending = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  function onPageShow(event: PageTransitionEvent): void {
    if (event.persisted) {
      cancelReloadRestoration();
      lenis.scrollTo(window.scrollY, { immediate: true });
      refresh();
    }
  }

  function destroy(): void {
    if (destroyed) return;
    saveReadingPosition(true);
    cancelReloadRestoration();
    destroyed = true;
    navigationSerial += 1;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    resizeObserver?.disconnect();
    observed.clear();
    lenis.destroy();
    window.removeEventListener('scroll', markDirty);
    window.removeEventListener('resize', refresh);
    window.removeEventListener('wheel', onManualIntent, true);
    window.removeEventListener('touchstart', onManualIntent, true);
    window.removeEventListener('pointerdown', onManualIntent, true);
    window.removeEventListener('keydown', onManualIntent, true);
    window.removeEventListener('hashchange', onHistory);
    window.removeEventListener('popstate', onHistory);
    window.removeEventListener('load', onLoad);
    window.removeEventListener('pagehide', onPageHide);
    window.removeEventListener('pageshow', onPageShow);
    document.removeEventListener('click', onAnchor);
    document.removeEventListener('visibilitychange', onVisibility);
    motionQuery.removeEventListener('change', applyMotionPreference);
    document.fonts?.removeEventListener('loadingdone', onFonts);
  }

  window.addEventListener('scroll', markDirty, { passive: true });
  window.addEventListener('resize', refresh, { passive: true });
  window.addEventListener('wheel', onManualIntent, { passive: true, capture: true });
  window.addEventListener('touchstart', onManualIntent, { passive: true, capture: true });
  window.addEventListener('pointerdown', onManualIntent, { passive: true, capture: true });
  window.addEventListener('keydown', onManualIntent, { capture: true });
  window.addEventListener('hashchange', onHistory);
  window.addEventListener('popstate', onHistory);
  window.addEventListener('load', onLoad, { once: true });
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('pageshow', onPageShow);
  document.addEventListener('click', onAnchor);
  document.addEventListener('visibilitychange', onVisibility);
  motionQuery.addEventListener('change', applyMotionPreference);
  document.fonts?.addEventListener('loadingdone', onFonts);
  document.fonts?.ready.then(onFonts, onFonts);

  measure();
  render();
  settleInitialHash();
  startClock();

  return {
    refresh,
    navigate: (id, settings) => goTo(id, settings),
    setReduced: (value) => { requestedReduced = Boolean(value); applyMotionPreference(); },
    destroy,
    get reduced() { return reduced; },
  };
}
