import Lenis from 'lenis';
import { softText } from '../../shared/soft-swap.ts';
import { applyReveal } from '../../shared/soft-reveal.ts';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { chapters } from './content';
import { evaluateStory, type ChapterMetric, type TransitionMetric, type MotionMode, type StorySnapshot } from './story-state';
import { SceneMedia } from './media';

gsap.registerPlugin(ScrollTrigger);
type HistoryEntry = { chapter: string; y: number; fraction: number; width: number; transition?: { id: string; progress: number } };

export function createStoryController() {
  const stage = document.querySelector<HTMLElement>('#stage')!;
  const base = stage.querySelector<HTMLDivElement>('.stage-layer--base')!;
  const next = stage.querySelector<HTMLDivElement>('.stage-layer--next')!;
  const occluder = stage.querySelector<HTMLDivElement>('.stage-occluder')!;
  const guide = stage.querySelector<SVGSVGElement>('.stage-guide')!;
  const guidePath = guide.querySelector<SVGPathElement>('path')!;
  const atmosphere = stage.querySelector<HTMLElement>('.hero-atmosphere')!;
  const exposure = atmosphere.querySelector<HTMLElement>('.hero-exposure')!;
  const traffic = [...atmosphere.querySelectorAll<HTMLElement>('.hero-traffic')];
  const status = document.querySelector<HTMLElement>('#scene-status')!;
  const chapterEls = [...document.querySelectorAll<HTMLElement>('.chapter')];
  const transitionEls = [...document.querySelectorAll<HTMLElement>('[data-transition]')];
  const progressEl = document.querySelector<HTMLElement>('.story-progress span')!;
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const variants = new Map<string, string>();
  let mode: MotionMode = motionQuery.matches ? 'reduced' : 'full';
  try { const saved = sessionStorage.getItem('nightshift-motion'); if (saved === 'reduced' || saved === 'stills') mode = saved; } catch { /* Storage is optional. */ }
  document.body.dataset.motion = mode;
  let metrics: ChapterMetric[] = [];
  let boundaries: TransitionMetric[] = [];
  let snapshot: StorySnapshot = { chapterIndex: 0, chapterId: 'ch-01', transition: null, overallProgress: 0 };
  let dirty = true;
  let lastY = -1;
  let lastChapter = -1;
  let disposed = false;
  let historyTimer = 0;
  let resizeTimer = 0;
  let navToken = 0;
  let navigating = false;
  let initialRestored = false;
  let lastWidth = innerWidth;
  let resizeAnchor: HistoryEntry | null = null;
  let handledPopHash: string | null = null;
  let layoutDirty = false;
  let userInteracted = false;
  let initialRestoration: { y: number; target?: string } | null = null;
  let heroStarted = -1;
  let heroLeft = Boolean(location.hash && location.hash !== '#ch-01');
  const textLayers = new Set<HTMLElement>();
  const media = new SceneMedia((failed) => { status.hidden = !failed; });
  const lenis = new Lenis({
    autoRaf: false,
    smoothWheel: mode === 'full',
    lerp: 0.115,
    syncTouch: false,
    anchors: false,
    prevent: (node) => Boolean(node.closest('dialog, [data-lenis-prevent]')),
  });

  function keyFor(index: number) {
    const chapter = chapters[Math.max(0, Math.min(chapters.length - 1, index))];
    if (index === 0 && innerWidth < 640) return 'hero-mobile';
    return variants.get(chapter.id) || chapter.image;
  }

  function measure() {
    const y = window.scrollY;
    metrics = chapterEls.map((el) => { const rect = el.getBoundingClientRect(); return { id: el.id, top: rect.top + y, bottom: rect.bottom + y }; });
    boundaries = transitionEls.map((el, i) => {
      const rect = el.getBoundingClientRect();
      return { id: el.id, from: i, to: i + 1, start: rect.top + y - innerHeight * .70, end: rect.bottom + y - innerHeight * .12 };
    });
    lenis.resize();
    dirty = true;
  }

  function readingPosition(): HistoryEntry | null {
    const m = metrics[snapshot.chapterIndex];
    if (!m) return null;
    return { chapter: snapshot.chapterId, y: window.scrollY, fraction: (window.scrollY - m.top) / Math.max(1, m.bottom - m.top), width: lastWidth,
      ...(snapshot.transition ? { transition: { id: snapshot.transition.id, progress: snapshot.transition.progress } } : {}) };
  }

  function positionFor(entry: HistoryEntry, exact = false): number {
    if (exact) return entry.y;
    const boundary = entry.transition && boundaries.find((item) => item.id === entry.transition?.id);
    if (boundary && entry.transition) return boundary.start + entry.transition.progress * (boundary.end - boundary.start);
    const metric = metrics.find((item) => item.id === entry.chapter);
    return metric ? metric.top + entry.fraction * (metric.bottom - metric.top) : 0;
  }

  function savePosition() {
    if (!initialRestored || navigating || disposed) return;
    const entry = readingPosition();
    if (!entry) return;
    try { history.replaceState({ ...history.state, nightshift: entry }, '', `#${snapshot.chapterId}`); } catch { /* Restricted history never blocks reading. */ }
  }

  function scheduleHistory() {
    window.clearTimeout(historyTimer);
    historyTimer = window.setTimeout(savePosition, 260);
  }

  function render() {
    if (disposed || document.hidden) return;
    const y = window.scrollY;
    if (!dirty && y === lastY) return;
    lastY = y;
    dirty = false;
    snapshot = evaluateStory({ scrollY: y, viewport: { width: innerWidth, height: innerHeight }, chapters: metrics, transitions: boundaries, mode, assetsReady: media.readyKeys, qualityTier: innerWidth < 640 ? 'low' : 'high' });
    const tr = snapshot.transition;
    for (const el of textLayers) { el.style.opacity = ''; el.style.visibility = ''; }
    textLayers.clear();
    if (tr && mode === 'full') {
      for (const [index, opacity] of [[tr.from, tr.sourceTextOpacity], [tr.to, tr.targetTextOpacity]]) {
        const el = chapterEls[index];
        el.style.opacity = String(opacity); el.style.visibility = opacity === 0 ? 'hidden' : '';
        textLayers.add(el);
      }
    }
    const chapter = chapters[snapshot.chapterIndex] || chapters[0];
    document.body.dataset.chapter = chapter.id;
    document.body.dataset.transition = tr?.id || '';
    document.body.dataset.transitionProgress = tr ? tr.progress.toFixed(4) : '';
    if (lastChapter !== snapshot.chapterIndex) {
      lastChapter = snapshot.chapterIndex;
      softText(document.querySelector('#current-time'), chapter.time, { instant: mode !== 'full' });
      softText(document.querySelector('#current-chapter'), chapter.name, { instant: mode !== 'full' });
      softText(document.querySelector('#chapter-count'), `${chapter.number} / 11`, { instant: mode !== 'full' });
      document.querySelectorAll('.chapter-rail a').forEach((a, i) => i === snapshot.chapterIndex ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current'));
      media.prefetch([keyFor(snapshot.chapterIndex), keyFor(snapshot.chapterIndex + 1)]);
    }
    progressEl.style.transform = `scaleX(${snapshot.overallProgress})`;

    if (!tr && snapshot.chapterIndex === 9 && mode === 'full') {
      const metric = metrics[9];
      const outgoing = boundaries.find((boundary) => boundary.from === 9);
      const available = Math.max(1, (outgoing?.start ?? metric.bottom) - metric.top);
      const arrivalStart = Math.min(innerHeight * .10, available * .15);
      const arrivalDuration = Math.max(1, Math.min(innerHeight * .55, available * .70));
      const p = Math.min(1, Math.max(0, (y - metric.top - arrivalStart) / arrivalDuration));
      media.setActive(['platform-before', 'platform']);
      media.setSlot(base, 'platform-before'); media.setSlot(next, 'platform');
      base.style.clipPath = ''; next.hidden = p <= 0;
      applyReveal(next, `inset(0 0 0 ${(1 - p) * 100}%)`);
      occluder.hidden = true; // the soft reveal carries the handoff; a sliding slab only added a hard edge
      occluder.dataset.kind = 'column'; occluder.classList.remove('is-horizontal');
      occluder.style.top = '0'; occluder.style.left = `${(1 - p) * 100}%`;
      guide.style.opacity = '0';
      stage.dataset.source = 'platform-before'; stage.dataset.target = 'platform';
      stage.dataset.phase = 'platform-arrival'; stage.dataset.platformProgress = p.toFixed(4);
    } else if (!tr || mode !== 'full') {
      const index = tr ? (tr.progress < .5 ? tr.from : tr.to) : snapshot.chapterIndex;
      const key = keyFor(index);
      media.setActive([key]);
      media.setSlot(base, key);
      base.style.clipPath = '';
      next.hidden = true;
      occluder.hidden = true;
      guide.style.opacity = '0';
      stage.dataset.source = key;
      stage.dataset.target = key;
      delete stage.dataset.phase;
    } else {
      let source = keyFor(tr.from);
      let target = keyFor(tr.to);
      if (tr.to === 9) target = 'platform-before';
      const p = tr.phaseProgress;
      if (tr.phase === 'source-to-midpoint') target = 'rail-water-midpoint';
      if (tr.phase === 'midpoint-to-target') source = 'rail-water-midpoint';
      media.setActive([source, target]);
      media.setSlot(base, source);
      media.setSlot(next, target);
      next.hidden = p <= 0;
      const horizontal = tr.from === 3 || tr.from === 4;
      const fromLeft = tr.from === 1;
      if (horizontal) applyReveal(next, `inset(${(1 - p) * 100}% 0 0 0)`);
      else if (fromLeft) applyReveal(next, `inset(0 ${(1 - p) * 100}% 0 0)`);
      else applyReveal(next, `inset(0 0 0 ${(1 - p) * 100}%)`);
      occluder.hidden = true; // the soft reveal carries the handoff; a sliding slab only added a hard edge
      occluder.dataset.kind = tr.occluder;
      occluder.classList.toggle('is-horizontal', horizontal);
      if (horizontal) { occluder.style.top = `${(1 - p) * 100}%`; occluder.style.left = '0'; }
      else { occluder.style.top = '0'; occluder.style.left = `${(fromLeft ? p : 1 - p) * 100}%`; }
      const ax = tr.anchorX * 1000, ay = tr.anchorY * 1000;
      // A one-pixel editorial trace connects projected composition, not physical utilities.
      const d = tr.from === 4 ? `M${ax - 190} 1000L${ax} ${ay}L${ax + 25} ${ay}L${ax + 390} 1000` : horizontal ? `M0 ${ay}H${ax}L1000 ${Math.min(950, ay + 120)}` : `M${ax} 1000V${ay}H${Math.min(960, ax + 180)}`;
      guidePath.setAttribute('d', d);
      guide.style.opacity = String(Math.sin(tr.progress * Math.PI) * .75);
      stage.dataset.source = source;
      stage.dataset.target = target;
      stage.dataset.phase = tr.phase;
    }
    scheduleHistory();
  }

  /** One optional exposure reveal; distant light positions are projected from
   * the selected desktop photo. They never move the worker, lamp or skyline. */
  function renderHero(time: number) {
    const atOpening = snapshot.chapterIndex === 0 && !snapshot.transition;
    if (!atOpening || window.scrollY > innerHeight * .2) heroLeft = true;
    if (!atOpening || mode !== 'full') {
      atmosphere.hidden = true;
      document.body.dataset.heroState = snapshot.transition?.from === 0 ? 'first-scroll' : atOpening ? (heroLeft ? 'return' : 'complete-composition') : 'away';
      return;
    }
    const img = base.querySelector('img');
    if (!img?.complete || !img.naturalWidth) return;
    if (heroStarted < 0) heroStarted = time;
    const elapsed = time - heroStarted;
    const reveal = heroLeft ? 1 : Math.min(1, Math.max(0, (elapsed - .10) / 1.15));
    atmosphere.hidden = false;
    exposure.style.opacity = String((1 - reveal) * .20);
    document.body.dataset.heroState = heroLeft ? 'return' : elapsed < .10 ? 'first-meaningful' : reveal < 1 ? 'reveal' : elapsed < 2.25 ? 'complete-composition' : 'living-hold';
    const desktop = innerWidth >= 640;
    const scale = Math.max(innerWidth / 1585, innerHeight / 992);
    const offsetX = (innerWidth - 1585 * scale) * .5;
    const offsetY = (innerHeight - 992 * scale) * .52;
    traffic.forEach((light, index) => {
      light.hidden = !desktop;
      const phase = ((time + index * 9) % 22) / 22;
      const x = 1335 - phase * 23;
      const y = 677 + phase * 45;
      light.style.transform = `translate3d(${offsetX + x * scale}px,${offsetY + y * scale}px,0)`;
      light.style.opacity = String(Math.sin(phase * Math.PI) * .55 * reveal);
    });
  }

  const onLenis = () => { ScrollTrigger.update(); dirty = true; };
  lenis.on('scroll', onLenis);
  const trigger = ScrollTrigger.create({ trigger: document.documentElement, start: 0, end: () => Math.max(1, document.documentElement.scrollHeight - innerHeight), onRefresh: measure, onUpdate: () => { dirty = true; } });
  const tick = (time: number) => {
    if (document.hidden) return;
    if (layoutDirty && !resizeTimer) { layoutDirty = false; measure(); ScrollTrigger.refresh(); }
    lenis.raf(time * 1000);
    render();
    renderHero(time);
  };
  gsap.ticker.lagSmoothing(0);
  gsap.ticker.add(tick);

  function destination(id: string) {
    const boundary = boundaries.find((b) => b.id === id);
    if (boundary) return (boundary.start + boundary.end) / 2;
    return metrics.find((m) => m.id === id)?.top;
  }

  function navigate(id: string, push = true, immediate = false) {
    measure();
    const targetY = destination(id);
    if (targetY === undefined) return;
    const token = ++navToken;
    if (push) {
      savePosition();
      try { history.pushState({ nightshift: { chapter: id, y: targetY, fraction: 0, width: innerWidth } }, '', `#${id}`); } catch { /* Native reading remains. */ }
    }
    navigating = true;
    handledPopHash = null;
    const index = chapters.findIndex((c) => c.id === id);
    if (index >= 0) media.prefetch([keyFor(index), keyFor(index + 1)]);
    lenis.scrollTo(Math.max(0, targetY), {
      immediate: immediate || mode !== 'full', duration: .9, lock: false, force: true,
      onComplete: () => {
        if (token !== navToken) return;
        navigating = false;
        dirty = true;
        render();
        if (Math.abs(window.scrollY - targetY) < 12) {
          const heading = document.querySelector<HTMLElement>(id === 'ch-01' ? '#hero-title' : `#title-${id}`);
          heading?.focus({ preventScroll: true });
        }
        scheduleHistory();
      },
    });
    dirty = true;
    render();
  }

  function setMotion(newMode: MotionMode) {
    if (newMode === mode) return;
    const oldMetric = metrics[snapshot.chapterIndex];
    const fraction = oldMetric ? (window.scrollY - oldMetric.top) / Math.max(1, oldMetric.bottom - oldMetric.top) : 0;
    mode = newMode;
    document.body.dataset.motion = mode;
    lenis.options.smoothWheel = mode === 'full';
    lenis.scrollTo(window.scrollY, { immediate: true, force: true });
    try { sessionStorage.setItem('nightshift-motion', mode); } catch { /* Optional preference. */ }
    measure();
    const metric = metrics[snapshot.chapterIndex];
    if (metric) lenis.scrollTo(Math.max(0, metric.top + fraction * (metric.bottom - metric.top)), { immediate: true, force: true });
    ScrollTrigger.refresh();
    dirty = true;
    render();
    document.dispatchEvent(new Event('nightshift:motionchange'));
  }

  function setVariant(chapterId: string, key: string) { variants.set(chapterId, key); media.prefetch([key]); dirty = true; render(); }
  const onScroll = () => {
    // A scrollbar drag or native seek interrupts pending wheel interpolation.
    if (Math.abs(window.scrollY - lenis.animatedScroll) > 3) {
      ++navToken; navigating = false;
      lenis.scrollTo(window.scrollY, { immediate: true, force: true });
    }
    dirty = true;
  };
  const onResize = () => {
    if (!resizeAnchor && innerWidth !== lastWidth) resizeAnchor = readingPosition();
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      resizeTimer = 0;
      measure(); ScrollTrigger.refresh();
      if (resizeAnchor) { ++navToken; navigating = false; lenis.scrollTo(positionFor(resizeAnchor), { immediate: true, force: true }); }
      resizeAnchor = null; lastWidth = innerWidth; layoutDirty = false; dirty = true; render();
    }, 120);
  };
  const onVisibility = () => { if (!document.hidden) { lenis.resize(); dirty = true; render(); } };
  const onMotion = () => setMotion(motionQuery.matches ? 'reduced' : 'full');
  const onPop = (event: PopStateEvent) => {
    userInteracted = true;
    handledPopHash = location.hash;
    measure();
    const saved = event.state?.nightshift as HistoryEntry | undefined;
    if (saved) {
      ++navToken; navigating = false;
      lenis.scrollTo(positionFor(saved, saved.width === innerWidth), { immediate: true, force: true }); dirty = true; render();
    } else navigate(location.hash.slice(1) || 'ch-01', false, true);
  };
  const onHash = () => {
    if (handledPopHash === location.hash) { handledPopHash = null; return; }
    handledPopHash = null;
    userInteracted = true;
    if (!navigating) navigate(location.hash.slice(1) || 'ch-01', false, true);
  };
  const onUserScroll = () => { userInteracted = true; if (navigating) { ++navToken; navigating = false; scheduleHistory(); } };
  const onDialogChange = () => {
    if (document.body.dataset.dialogOpen === 'true') {
      ++navToken; navigating = false; lenis.stop(); savePosition();
    } else lenis.start();
  };
  const onInitialLoad = () => {
    // Fragment scrolling can run after load listeners. Restore after its two
    // layout frames, unless an actual visitor input has already taken control.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (disposed) return;
      if (initialRestoration && !userInteracted) {
        measure();
        const y = initialRestoration.target ? destination(initialRestoration.target) ?? initialRestoration.y : initialRestoration.y;
        lenis.scrollTo(y, { immediate: true, force: true }); dirty = true; render();
      }
      initialRestoration = null;
    }));
  };
  const onRetry = () => {
    media.retry();
    delete base.dataset.bound;
    delete next.dataset.bound;
    dirty = true; render();
  };
  const retry = document.querySelector<HTMLButtonElement>('[data-retry]')!;
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('popstate', onPop);
  window.addEventListener('hashchange', onHash);
  window.addEventListener('wheel', onUserScroll, { passive: true });
  window.addEventListener('touchstart', onUserScroll, { passive: true });
  window.addEventListener('keydown', onUserScroll, { passive: true });
  window.addEventListener('pointerdown', onUserScroll, { passive: true });
  window.addEventListener('load', onInitialLoad, { once: true });
  document.addEventListener('visibilitychange', onVisibility);
  document.addEventListener('nightshift:dialogchange', onDialogChange);
  motionQuery.addEventListener('change', onMotion);
  retry.addEventListener('click', onRetry);
  window.addEventListener('pagehide', savePosition);

  function restoreInitial() {
    if (initialRestored) return;
    measure();
    const type = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type;
    const saved = history.state?.nightshift as HistoryEntry | undefined;
    initialRestored = true;
    history.scrollRestoration = 'manual';
    let restoreTarget: string | undefined;
    if (saved && (type === 'reload' || type === 'back_forward') && saved.width === innerWidth) {
      lenis.scrollTo(saved.y, { immediate: true });
    } else if (location.hash && destination(location.hash.slice(1)) !== undefined) {
      restoreTarget = location.hash.slice(1);
      navigate(restoreTarget, false, true);
    }
    dirty = true;
    render();
    initialRestoration = { y: window.scrollY, target: restoreTarget };
    requestAnimationFrame(() => { measure(); ScrollTrigger.refresh(); dirty = true; render(); });
  }
  measure();
  render();
  restoreInitial();
  const layoutObserver = new ResizeObserver(() => { layoutDirty = true; });
  chapterEls.forEach((el) => layoutObserver.observe(el));
  void document.fonts.ready.then(() => { if (!disposed) { measure(); ScrollTrigger.refresh(); dirty = true; render(); } });
  const stillWarmup = window.setTimeout(() => media.prewarmStills([...chapters.map((c) => c.image), 'rail-water-midpoint', 'hero-mobile']), 1800);

  return {
    navigate: (id: string) => navigate(id), setMotion, getMotion: () => mode, setVariant,
    getSnapshot: () => snapshot,
    destroy() {
      disposed = true;
      window.clearTimeout(historyTimer); window.clearTimeout(resizeTimer); window.clearTimeout(stillWarmup);
      gsap.ticker.remove(tick); trigger.kill(); lenis.off('scroll', onLenis); lenis.destroy(); media.destroy();
      layoutObserver.disconnect();
      window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize); window.removeEventListener('popstate', onPop); window.removeEventListener('hashchange', onHash); window.removeEventListener('wheel', onUserScroll); window.removeEventListener('touchstart', onUserScroll); window.removeEventListener('pagehide', savePosition);
      document.removeEventListener('visibilitychange', onVisibility); motionQuery.removeEventListener('change', onMotion); retry.removeEventListener('click', onRetry);
      window.removeEventListener('keydown', onUserScroll); window.removeEventListener('pointerdown', onUserScroll); window.removeEventListener('load', onInitialLoad);
      document.removeEventListener('nightshift:dialogchange', onDialogChange);
    },
  };
}
