import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { readObservationState, updateObservationState, type MotionMode } from './state';

export type { MotionMode } from './state';

export interface NarrativeProgress {
  chapterId: string;
  progress: number;
  boundary?: string;
  boundaryProgress?: number;
  overall: number;
}

export interface MotionChange {
  mode: MotionMode;
  resolved: 'reduced' | 'full';
  reduced: boolean;
}

declare global {
  interface WindowEventMap {
    'imago:progress': CustomEvent<NarrativeProgress>;
    'imago:motion': CustomEvent<MotionChange>;
  }
}

export interface NarrativeEngine {
  destroy(): void;
  refresh(): void;
  scrollTo(id: string, immediate?: boolean): void;
  setMotion(mode: MotionMode): void;
  /** The requested preference; html[data-motion] contains its resolved value. */
  getMotion(): MotionMode;
}

export interface ChapterGeometry {
  id: string;
  top: number;
  height: number;
}

export interface BoundaryGeometry {
  id: string;
  fromId: string;
  toId: string;
  start: number;
  end: number;
}

export interface NarrativeFrame {
  detail: NarrativeProgress;
  chapters: Record<string, number>;
  boundaries: Record<string, number>;
}

const clamp = (value: number, minimum = 0, maximum = 1): number =>
  Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, value)) : minimum;

/** Pure, direction-independent evaluation; no previous frame or entry callback is needed. */
export function evaluateNarrativeFrame(
  scrollY: number,
  viewportHeight: number,
  documentHeight: number,
  chapters: readonly ChapterGeometry[],
  boundaries: readonly BoundaryGeometry[],
): NarrativeFrame {
  const maximumScroll = Math.max(0, documentHeight - viewportHeight);
  const y = clamp(scrollY, 0, maximumScroll);
  const chapterProgress: Record<string, number> = {};
  const boundaryProgress: Record<string, number> = {};
  let active = chapters[0];
  const readingLine = y + viewportHeight * 0.35;
  for (const chapter of chapters) {
    chapterProgress[chapter.id] = clamp((y - chapter.top) / Math.max(1, chapter.height));
    if (chapter.top <= readingLine) active = chapter;
  }
  let activeBoundary: BoundaryGeometry | undefined;
  for (const boundary of boundaries) {
    boundaryProgress[boundary.id] = clamp((y - boundary.start) / Math.max(1, boundary.end - boundary.start));
    if (y >= boundary.start && y <= boundary.end) activeBoundary = boundary;
    else if (y > boundary.end) {
      // Sticky travel finishes before the next chapter reaches the reading line.
      // Keep the incoming chapter instead of briefly reverting to the old one.
      const incoming = chapters.find(chapter => chapter.id === boundary.toId);
      if (incoming && (!active || incoming.top > active.top)) active = incoming;
    }
  }
  if (activeBoundary) {
    const id = boundaryProgress[activeBoundary.id] < 0.5 ? activeBoundary.fromId : activeBoundary.toId;
    active = chapters.find(chapter => chapter.id === id) ?? active;
  }
  const detail: NarrativeProgress = {
    chapterId: active?.id ?? '',
    progress: active ? chapterProgress[active.id] : 0,
    overall: maximumScroll > 0 ? y / maximumScroll : 0,
  };
  if (activeBoundary) {
    detail.boundary = activeBoundary.id;
    detail.boundaryProgress = boundaryProgress[activeBoundary.id];
  }
  return { detail, chapters: chapterProgress, boundaries: boundaryProgress };
}

interface ChapterMeasurement extends ChapterGeometry {
  element: HTMLElement;
  scrollMargin: number;
}

interface BoundaryMeasurement extends BoundaryGeometry {
  element: HTMLElement;
  stage: HTMLElement;
}

interface ScrollSnapshot { version: 1; url: string; y: number }

export function createNarrativeEngine(): NarrativeEngine {
  const html = document.documentElement;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let preference = readObservationState().motion;
  let reduced = preference === 'reduced' || (preference === 'auto' && media.matches);
  let lenis: Lenis | null = null;
  let destroyed = false;
  let frameId = 0;
  let needsMeasurement = true;
  let needsRender = true;
  let lastScrollY = Number.NaN;
  let viewportHeight = window.innerHeight;
  let documentHeight = 0;
  let chapters: ChapterMeasurement[] = [];
  let boundaries: BoundaryMeasurement[] = [];
  let navLinks: HTMLAnchorElement[] = [];
  let progressBars: HTMLElement[] = [];
  let pendingRestore: { y?: number; id?: string; source: 'pop' | 'hash' | 'initial' } | null = null;
  let initialRestore: { y?: number; id?: string } | null = null;
  const originalScrollRestoration = window.history.scrollRestoration;
  const observed = new Set<Element>();
  const pausedAnimations = new Set<Animation>();
  const originalStyles = new Map<HTMLElement, Map<string, string>>();
  const originalAria = new Map<HTMLElement, string | null>();
  const originalTabindex = new Map<HTMLElement, string | null>();
  const rootAttributes = new Map(['data-motion', 'data-motion-preference', 'data-page-visible', 'data-active-chapter']
    .map(name => [name, html.getAttribute(name)]));
  const rootClasses = new Map(['is-reduced-motion', 'is-page-hidden'].map(name => [name, html.classList.contains(name)]));

  const rememberStyle = (element: HTMLElement, property: string): void => {
    let saved = originalStyles.get(element);
    if (!saved) originalStyles.set(element, saved = new Map());
    if (!saved.has(property)) saved.set(property, element.style.getPropertyValue(property));
  };
  const setStyle = (element: HTMLElement, property: string, value: string): void => {
    rememberStyle(element, property);
    if (element.style.getPropertyValue(property) !== value) element.style.setProperty(property, value);
  };
  const currentUrl = (): string => `${location.pathname}${location.search}${location.hash}`;
  const historyObject = (): Record<string, unknown> =>
    history.state !== null && typeof history.state === 'object' && !Array.isArray(history.state)
      ? { ...history.state } : {};
  const savedPosition = (state: unknown): number | undefined => {
    if (!state || typeof state !== 'object' || !('__imagoScroll' in state)) return undefined;
    const item = state.__imagoScroll as Partial<ScrollSnapshot> | null;
    return item && item.version === 1 && item.url === currentUrl()
      && typeof item.y === 'number' && Number.isFinite(item.y) && item.y >= 0 ? item.y : undefined;
  };
  const rememberPosition = (): void => {
    try {
      history.replaceState({ ...historyObject(), __imagoScroll: { version: 1, url: currentUrl(), y: window.scrollY } }, '');
    } catch { /* Sandboxed history does not prevent local navigation. */ }
  };
  const hashId = (): string | undefined => {
    const id = location.hash.slice(1);
    return chapters.some(chapter => chapter.id === id) ? id : undefined;
  };
  const targetY = (id: string): number | undefined => {
    const chapter = chapters.find(item => item.id === id);
    return chapter ? clamp(chapter.top - chapter.scrollMargin, 0, Math.max(0, documentHeight - viewportHeight)) : undefined;
  };
  const jump = (y: number): void => {
    const target = clamp(y, 0, Math.max(0, documentHeight - viewportHeight));
    if (lenis) lenis.scrollTo(target, { immediate: true, force: true });
    else window.scrollTo({ top: target, left: window.scrollX, behavior: 'instant' });
    needsRender = true;
  };

  const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => refresh());

  function measure(): void {
    needsMeasurement = false;
    viewportHeight = Math.max(1, window.innerHeight);
    const y = window.scrollY;
    chapters = Array.from(document.querySelectorAll<HTMLElement>('.chapter[id]')).map(element => {
      const rect = element.getBoundingClientRect();
      return {
        element, id: element.id, top: rect.top + y, height: Math.max(1, rect.height),
        scrollMargin: Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 0,
      };
    }).sort((a, b) => a.top - b.top);
    boundaries = Array.from(document.querySelectorAll<HTMLElement>('.handoff')).flatMap(element => {
      const stage = element.querySelector<HTMLElement>('.handoff__stage');
      const id = element.dataset.boundary;
      if (!stage || !id || !/^\d{2}-\d{2}$/.test(id)) return [];
      const [from, to] = id.split('-');
      const rect = element.getBoundingClientRect();
      const top = rect.top + y;
      const stageHeight = stage.getBoundingClientRect().height;
      const computed = getComputedStyle(stage);
      const stickyTop = Number.parseFloat(computed.top) || 0;
      const sticky = computed.position === 'sticky' && rect.height > stageHeight + 1;
      const start = sticky ? top - stickyTop : top - viewportHeight * 0.85;
      const end = sticky ? start + rect.height - stageHeight : top + rect.height - viewportHeight * 0.15;
      return [{ element, stage, id, fromId: `chapter-${from}`, toId: `chapter-${to}`, start, end }];
    });
    documentHeight = Math.max(html.scrollHeight, document.body?.scrollHeight ?? 0, viewportHeight);
    navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-chapter-link]'));
    progressBars = Array.from(document.querySelectorAll<HTMLElement>('[data-reading-progress]'));
    const nextObserved = new Set<Element>([
      html, ...(document.body ? [document.body] : []),
      ...chapters.map(item => item.element),
      ...boundaries.flatMap(item => [item.element, item.stage]),
    ]);
    for (const element of observed) if (!nextObserved.has(element)) resizeObserver?.unobserve(element);
    for (const element of nextObserved) if (!observed.has(element)) resizeObserver?.observe(element);
    observed.clear();
    for (const element of nextObserved) observed.add(element);
    lenis?.resize();
    needsRender = true;
  }

  function render(): void {
    const y = window.scrollY;
    if (!needsRender && y === lastScrollY) return;
    needsRender = false;
    lastScrollY = y;
    const frame = evaluateNarrativeFrame(y, viewportHeight, documentHeight, chapters, boundaries);
    for (const chapter of chapters) setStyle(chapter.element, '--chapter-progress', frame.chapters[chapter.id].toFixed(5));
    for (const boundary of boundaries) setStyle(boundary.element, '--progress', frame.boundaries[boundary.id].toFixed(5));
    for (const bar of progressBars) setStyle(bar, 'width', `${(frame.detail.overall * 100).toFixed(3)}%`);
    for (const link of navLinks) {
      if (!originalAria.has(link)) originalAria.set(link, link.getAttribute('aria-current'));
      if (link.getAttribute('href') === `#${frame.detail.chapterId}`) {
        if (link.getAttribute('aria-current') !== 'true') link.setAttribute('aria-current', 'true');
      } else if (link.hasAttribute('aria-current')) link.removeAttribute('aria-current');
    }
    html.dataset.activeChapter = frame.detail.chapterId;
    window.dispatchEvent(new CustomEvent<NarrativeProgress>('imago:progress', { detail: frame.detail }));
  }

  function tick(time: number): void {
    frameId = 0;
    if (destroyed || document.hidden) return;
    if (needsMeasurement) measure();
    if (pendingRestore) {
      const restore = pendingRestore;
      pendingRestore = null;
      const y = restore.y ?? (restore.id ? targetY(restore.id) : undefined);
      if (y !== undefined) jump(y);
    }
    lenis?.raf(time);
    render();
    if (lenis) requestFrame();
  }

  function requestFrame(): void {
    if (!frameId && !destroyed && !document.hidden) frameId = requestAnimationFrame(tick);
  }

  function refresh(): void {
    if (destroyed) return;
    needsMeasurement = true;
    needsRender = true;
    requestFrame();
  }

  function applyMotion(): void {
    reduced = preference === 'reduced' || (preference === 'auto' && media.matches);
    const y = window.scrollY;
    lenis?.destroy();
    lenis = null;
    if (!reduced) {
      lenis = new Lenis({
        autoRaf: false, autoResize: false, anchors: false,
        lerp: 0.16, smoothWheel: true, syncTouch: false,
        respectReducedMotion: false, // The preference is already resolved above, including an explicit full-motion choice.
        prevent: element => Boolean(element.closest('[data-native-scroll], [data-lenis-prevent], dialog[open]')),
      });
      lenis.scrollTo(y, { immediate: true, force: true });
    }
    html.dataset.motion = reduced ? 'reduced' : 'full';
    html.dataset.motionPreference = preference;
    html.classList.toggle('is-reduced-motion', reduced);
    refresh();
    window.dispatchEvent(new CustomEvent<MotionChange>('imago:motion', {
      detail: { mode: preference, resolved: reduced ? 'reduced' : 'full', reduced },
    }));
  }

  function focusChapter(id: string): void {
    const chapter = chapters.find(item => item.id === id)?.element;
    const target = chapter?.querySelector<HTMLElement>('h1, h2') ?? chapter;
    if (!target) return;
    if (!originalTabindex.has(target)) originalTabindex.set(target, target.getAttribute('tabindex'));
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }

  function scrollTo(id: string, immediate = false): void {
    if (destroyed) return;
    if (needsMeasurement) measure();
    const cleanId = id.startsWith('#') ? id.slice(1) : id;
    const y = targetY(cleanId);
    if (y === undefined) return;
    initialRestore = null;
    pendingRestore = null;
    if (location.hash !== `#${cleanId}` || Math.abs(window.scrollY - y) > 1) {
      rememberPosition();
      try {
        const url = `${location.pathname}${location.search}#${cleanId}`;
        history.pushState({ ...historyObject(), __imagoScroll: { version: 1, url, y } }, '', url);
      } catch { /* Scrolling still works when a host restricts History API writes. */ }
    }
    focusChapter(cleanId);
    if (lenis && !immediate && !reduced) lenis.scrollTo(y, { force: true });
    else jump(y);
    needsRender = true;
    requestFrame();
  }

  const onClick = (event: MouseEvent): void => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const element = event.target instanceof Element ? event.target : null;
    const link = element?.closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const id = link.getAttribute('href')?.slice(1);
    if (!id) return;
    if (!chapters.some(chapter => chapter.id === id)) {
      // Keep the browser's default behavior for real non-chapter anchors, such
      // as Field notes, while retaining their preceding history position.
      if (document.getElementById(id)) {
        rememberPosition();
        lenis?.scrollTo(window.scrollY, { immediate: true, force: true });
      }
      return;
    }
    event.preventDefault();
    scrollTo(id);
  };
  const onScroll = (): void => {
    // A scrollbar drag or native keyboard scroll must supersede a smooth target.
    // Lenis-authored DOM positions differ from its float value by at most rounding.
    if (lenis?.isScrolling === 'smooth' && Math.abs(window.scrollY - lenis.animatedScroll) > 2) {
      lenis.scrollTo(window.scrollY, { immediate: true, force: true });
    }
    needsRender = true;
    requestFrame();
  };
  const onPopState = (event: PopStateEvent): void => {
    initialRestore = null;
    const id = hashId();
    pendingRestore = { source: 'pop', y: savedPosition(event.state) ?? (id ? undefined : 0), id };
    refresh();
  };
  const onHashChange = (): void => {
    if (pendingRestore?.source === 'pop') return;
    initialRestore = null;
    const id = hashId();
    if (id) { pendingRestore = { source: 'hash', id }; refresh(); }
    else if (document.getElementById(location.hash.slice(1))) {
      lenis?.scrollTo(window.scrollY, { immediate: true, force: true });
      rememberPosition();
      refresh();
    }
  };
  const resumeAnimations = (): void => {
    for (const animation of pausedAnimations) {
      if (animation.playState === 'paused' && animation.currentTime !== null) {
        try { animation.play(); } catch { /* An effect removed while hidden is no longer resumable. */ }
      }
    }
    pausedAnimations.clear();
  };
  const onVisibility = (): void => {
    html.dataset.pageVisible = String(!document.hidden);
    html.classList.toggle('is-page-hidden', document.hidden);
    if (document.hidden) {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      for (const animation of document.getAnimations?.() ?? []) {
        if (animation.playState === 'running') {
          pausedAnimations.add(animation);
          animation.pause();
        }
      }
    } else {
      resumeAnimations();
      lenis?.scrollTo(window.scrollY, { immediate: true, force: true });
      refresh();
    }
  };
  const onPageShow = (): void => { onVisibility(); refresh(); };
  const onMediaChange = (): void => { if (preference === 'auto') applyMotion(); };
  const onUserInput = (event: Event): void => {
    initialRestore = null;
    if (pendingRestore?.source === 'initial') pendingRestore = null;
    if (event.type !== 'wheel') lenis?.scrollTo(window.scrollY, { immediate: true, force: true });
  };
  const userInputEvents = ['pointerdown', 'touchstart', 'wheel', 'keydown'] as const;

  document.addEventListener('click', onClick);
  document.addEventListener('visibilitychange', onVisibility);
  for (const name of userInputEvents) document.addEventListener(name, onUserInput, { passive: true, capture: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', refresh, { passive: true });
  window.visualViewport?.addEventListener('resize', refresh, { passive: true });
  window.addEventListener('popstate', onPopState);
  window.addEventListener('hashchange', onHashChange);
  window.addEventListener('pagehide', rememberPosition);
  window.addEventListener('pageshow', onPageShow);
  media.addEventListener('change', onMediaChange);
  document.fonts?.addEventListener('loadingdone', refresh);
  document.fonts?.ready.then(() => {
    if (destroyed) return;
    // Correct a deep link after the initial font swap, unless the reader has taken control.
    if (initialRestore) pendingRestore = { ...initialRestore, source: 'initial' };
    initialRestore = null;
    refresh();
  });
  try { history.scrollRestoration = 'manual'; } catch { /* Native restoration remains available. */ }
  applyMotion();
  measure();
  const rememberedY = savedPosition(history.state);
  const initialId = hashId();
  initialRestore = rememberedY !== undefined ? { y: rememberedY } : initialId ? { id: initialId } : null;
  const initialY = rememberedY ?? (initialId ? targetY(initialId) : undefined);
  if (initialY !== undefined) jump(initialY);
  onVisibility();
  render();

  return {
    refresh,
    scrollTo,
    getMotion: () => preference,
    setMotion(mode): void {
      if (destroyed || !(['auto', 'reduced', 'full'] as const).includes(mode)) return;
      preference = mode;
      updateObservationState({ motion: mode });
      applyMotion();
    },
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      lenis?.destroy();
      lenis = null;
      resizeObserver?.disconnect();
      observed.clear();
      document.removeEventListener('click', onClick);
      document.removeEventListener('visibilitychange', onVisibility);
      for (const name of userInputEvents) document.removeEventListener(name, onUserInput, true);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', refresh);
      window.visualViewport?.removeEventListener('resize', refresh);
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('pagehide', rememberPosition);
      window.removeEventListener('pageshow', onPageShow);
      media.removeEventListener('change', onMediaChange);
      document.fonts?.removeEventListener('loadingdone', refresh);
      resumeAnimations();
      for (const [element, values] of originalStyles) for (const [property, value] of values) {
        if (value) element.style.setProperty(property, value);
        else element.style.removeProperty(property);
      }
      for (const [element, value] of originalAria) {
        if (value === null) element.removeAttribute('aria-current');
        else element.setAttribute('aria-current', value);
      }
      for (const [element, value] of originalTabindex) {
        if (value === null) element.removeAttribute('tabindex');
        else element.setAttribute('tabindex', value);
      }
      for (const [name, value] of rootAttributes) {
        if (value === null) html.removeAttribute(name);
        else html.setAttribute(name, value);
      }
      for (const [name, present] of rootClasses) html.classList.toggle(name, present);
      try { history.scrollRestoration = originalScrollRestoration; } catch { /* No restoration override was possible. */ }
    },
  };
}
