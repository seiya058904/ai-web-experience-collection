import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

/**
 * One exhibition, one Lenis instance, one GSAP-driven animation clock.
 * The photographs keep their own light; motion changes the point of view.
 *
 * Integration reference: https://github.com/darkroomengineering/lenis#gsap-scrolltrigger
 * Pinning / lifecycle reference: https://gsap.com/docs/v3/Plugins/ScrollTrigger/
 * All scene choreography below is original to GLAZE.
 */
gsap.registerPlugin(ScrollTrigger);

export interface MotionOptions {
  stage: HTMLElement;
  scenes: HTMLElement[];
  onSceneChange: (index: number) => void;
  onProgress?: (progress: number) => void;
  reduced: boolean;
}

export interface MotionController {
  goTo: (index: number, immediate?: boolean) => void;
  getActiveIndex: () => number;
  destroy: () => void;
  pause: () => void;
  resume: () => void;
}

type Navigation = { index: number; immediate: boolean };
type Pose = { scale: number; x: number; y: number; rotation?: number };
type Phase = 'enter' | 'compose' | 'hold' | 'exit';

const FIRST_TRANSITION = 0.8;
const SCENE_INTERVAL = 1.4;
const TRANSITION_DURATION = 0.7;
const FINAL_HOLD = 0.8;
const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const narrow = () => window.innerWidth < 768;
const entry = (index: number) => FIRST_TRANSITION + (index - 1) * SCENE_INTERVAL;
const arrival = (index: number) => index === 0 ? 0 : entry(index) + TRANSITION_DURATION;
const departure = (index: number) => FIRST_TRANSITION + index * SCENE_INTERVAL;

let liveController: MotionController | null = null;

/** Recreating the experience cannot leave a second smoother or pin behind. */
export function createMotion(options: MotionOptions): MotionController {
  liveController?.destroy();
  if (!options.scenes.length) throw new Error('The exhibition needs at least one scene.');

  const inner = options.reduced ? createReducedMotion(options) : createImmersiveMotion(options);
  let destroyed = false;
  const controller: MotionController = {
    ...inner,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      inner.destroy();
      if (liveController === controller) liveController = null;
    },
  };
  liveController = controller;
  return controller;
}

/**
 * Pose values are percentages of each photographic frame, not viewport pixels.
 * Mobile gets its own travel distance; CSS supplies its own image composition.
 */
function photoPose(index: number, phase: Phase): Pose {
  const poses: Record<Phase, Pose>[] = [
    { enter: { scale: 1, x: 0, y: 0 }, compose: { scale: 1, x: 0, y: 0 }, hold: { scale: 1.035, x: 0, y: -1.2 }, exit: { scale: 3.15, x: -17, y: -18, rotation: -1.8 } },
    { enter: { scale: 1.18, x: -2, y: 0.7 }, compose: { scale: 1.015, x: 0, y: 0 }, hold: { scale: 1.065, x: -1.2, y: 0.6 }, exit: { scale: 1.19, x: 3, y: -1 } },
    { enter: { scale: 1.16, x: 6, y: 1 }, compose: { scale: 1.01, x: 0, y: 0 }, hold: { scale: 1.045, x: -0.3, y: -0.7 }, exit: { scale: 2.45, x: 0, y: 0 } },
    { enter: { scale: 1.095, x: 0, y: 1.8 }, compose: { scale: 1.005, x: 0, y: 0 }, hold: { scale: 1.045, x: 0.6, y: -0.7 }, exit: { scale: 1.26, x: -2.5, y: 1.5 } },
    { enter: { scale: 1.07, x: -2, y: 0 }, compose: { scale: 1, x: 0, y: 0 }, hold: { scale: 1.025, x: 0.3, y: -0.6 }, exit: { scale: 1.14, x: -1, y: 1 } },
    { enter: { scale: 1.13, x: 3, y: 2 }, compose: { scale: 1.005, x: 0, y: 0 }, hold: { scale: 1.045, x: -0.5, y: -0.5 }, exit: { scale: 1.22, x: -3, y: 0 } },
    { enter: { scale: 1.145, x: -4, y: 0 }, compose: { scale: 1.01, x: 0, y: 0 }, hold: { scale: 1.055, x: 0.5, y: -0.7 }, exit: { scale: 1.055, x: 0.5, y: -0.7 } },
  ];
  const pose = { ...(poses[index] ?? poses[poses.length - 1])[phase] };
  if (narrow()) {
    pose.x *= 0.6;
    pose.y *= 0.75;
    if (index === 0 && phase === 'exit') pose.scale = 3.0;
    if (index === 2 && phase === 'exit') pose.scale = 2.15;
  }
  return pose;
}

function poseVars(index: number, phase: Phase): gsap.TweenVars {
  return {
    scale: () => photoPose(index, phase).scale,
    xPercent: () => photoPose(index, phase).x,
    yPercent: () => photoPose(index, phase).y,
    rotation: () => photoPose(index, phase).rotation ?? 0,
  };
}

function aperture(index: number): { from: string; to: string } {
  switch (index) {
    case 1: {
      const center = narrow() ? '57% 40%' : '68% 40%';
      return { from: `circle(0% at ${center})`, to: `circle(150% at ${center})` };
    }
    case 2:
      return {
        from: 'polygon(0% 0%, 0% 0%, -35% 100%, -35% 100%)',
        to: 'polygon(0% 0%, 135% 0%, 100% 100%, 0% 100%)',
      };
    case 3:
      return { from: 'circle(0% at 69% 63%)', to: 'circle(150% at 69% 63%)' };
    case 4:
      return { from: 'ellipse(0% 0% at 18% 21%)', to: 'ellipse(155% 155% at 18% 21%)' };
    case 5:
      return { from: 'ellipse(0% 0% at -15% 105%)', to: 'ellipse(170% 155% at -15% 105%)' };
    default:
      return {
        from: 'polygon(135% 0%, 135% 0%, 100% 100%, 100% 100%)',
        to: 'polygon(-35% 0%, 100% 0%, 100% 100%, 0% 100%)',
      };
  }
}

function createImmersiveMotion(options: MotionOptions): MotionController {
  const { stage, scenes, onSceneChange, onProgress } = options;
  const duration = scenes.length === 1 ? 1 : arrival(scenes.length - 1) + FINAL_HOLD;
  const visuals = scenes.map(scene => scene.querySelector<HTMLElement>('.scene-visual'));
  const titles = scenes.map(scene => scene.querySelector<HTMLElement>('.scene-title'));
  const captions = scenes.map(scene => scene.querySelector<HTMLElement>('.scene-caption'));
  const asides = scenes.map(scene => scene.querySelector<HTMLElement>('.scene-aside'));
  const heroObject = scenes[0].querySelector<HTMLElement>('.hero-object');
  const heroShadow = scenes[0].querySelector<HTMLElement>('.hero-shadow');
  const heroWord = scenes[0].querySelector<HTMLElement>('.hero-word');
  const shadowOpacity = heroShadow ? Number.parseFloat(getComputedStyle(heroShadow).opacity) : 1;
  const hints = new Map<HTMLElement, { value: string; priority: string }>();
  let activeIndex = -1;
  let lastHintIndex = -1;
  let destroyed = false;
  let paused = false;
  let suspended = document.hidden;
  let pendingNavigation: Navigation | null = null;
  let timeline: gsap.core.Timeline;
  let trigger!: ScrollTrigger;
  let ready = false;
  let savedRefreshProgress: number | null = null;
  let stableProgress = 0;
  let restoringRefresh = false;
  let refreshInProgress = false;

  const lenis = new Lenis({
    autoRaf: false,
    autoResize: true,
    smoothWheel: true,
    syncTouch: false,
    lerp: 0.095,
    respectReducedMotion: true,
    anchors: false,
    prevent: node => node.hasAttribute('data-lenis-prevent') || node.tagName === 'DIALOG',
  });

  function setHint(element: HTMLElement | null, value: string) {
    if (!element) return;
    if (!hints.has(element)) hints.set(element, {
      value: element.style.getPropertyValue('will-change'),
      priority: element.style.getPropertyPriority('will-change'),
    });
    if (element.style.willChange !== value) element.style.willChange = value;
  }

  function updateStatus() {
    // A refresh temporarily rewinds scrubbed timelines to measure their pins.
    // That measuring pose must never become a scene change or a saved position.
    if (destroyed || refreshInProgress || restoringRefresh) return;
    const time = timeline.time();
    stableProgress = clamp(time / duration);
    let index = 0;
    for (let i = 1; i < scenes.length; i++) {
      if (time >= entry(i) + TRANSITION_DURATION * 0.52) index = i;
    }
    if (index !== lastHintIndex) {
      lastHintIndex = index;
      scenes.forEach((scene, i) => {
        const nearby = Math.abs(i - index) <= 1;
        setHint(scene, nearby ? 'clip-path' : 'auto');
        setHint(visuals[i], nearby ? 'transform' : 'auto');
        setHint(titles[i], nearby ? 'transform, opacity' : 'auto');
      });
      setHint(heroObject, index <= 1 ? 'transform' : 'auto');
      setHint(heroShadow, index <= 1 ? 'transform, opacity' : 'auto');
      setHint(heroWord, index <= 1 ? 'transform, opacity' : 'auto');
    }
    if (activeIndex !== index) {
      activeIndex = index;
      onSceneChange(index);
    }
    onProgress?.(stableProgress);
  }

  const context = gsap.context(() => {
    scenes.forEach((scene, i) => {
      gsap.set(scene, {
        visibility: i === 0 ? 'visible' : 'hidden',
        opacity: 1,
        clipPath: i === 0 ? 'inset(0% 0% 0% 0%)' : aperture(i).from,
      });
      if (visuals[i]) gsap.set(visuals[i], {
        scale: 1,
        xPercent: 0,
        yPercent: 0,
        rotation: 0,
        transformOrigin: i === 2 ? '69% 63%' : i === 3 ? '18% 21%' : '50% 50%',
      });
      [titles[i], captions[i], asides[i]].forEach(element => {
        if (element) gsap.set(element, { autoAlpha: i === 0 ? 1 : 0, x: 0, y: 0, yPercent: 0 });
      });
    });

    timeline = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
    // An explicit clock fixes the final living hold and makes navigation exact.
    timeline.to({ time: 0 }, { time: duration, duration, ease: 'none' }, 0);

    scenes.forEach((scene, index) => {
      const start = index === 0 ? 0 : entry(index);
      const composed = arrival(index);
      const exit = index === scenes.length - 1 ? duration : departure(index);
      const visual = index === 0 && heroObject ? heroObject : visuals[index];

      if (index > 0) {
        // Explicit start states also remain correct after a refresh or reverse seek.
        timeline.fromTo(scene, { visibility: 'hidden' }, {
          visibility: 'visible', duration: 0, immediateRender: false,
        }, start);
        timeline.fromTo(scene, { clipPath: () => aperture(index).from }, {
          clipPath: () => aperture(index).to,
          duration: TRANSITION_DURATION,
          ease: index === 2 || index === 6 ? 'power1.inOut' : 'power2.inOut',
          immediateRender: false,
        }, start);
      }

      if (visual) {
        if (index === 0 && heroObject) gsap.set(heroObject, {
          scale: 1, xPercent: 0, yPercent: 0, rotation: 0, transformOrigin: '62% 34%',
        });
        if (index > 0) timeline.fromTo(visual, poseVars(index, 'enter'), {
          ...poseVars(index, 'compose'), duration: TRANSITION_DURATION,
          ease: 'power1.out', immediateRender: false,
        }, start);
        timeline.fromTo(visual, poseVars(index, 'compose'), {
          ...poseVars(index, 'hold'), duration: Math.max(0.01, exit - composed),
          immediateRender: false,
        }, composed);
        if (index < scenes.length - 1) timeline.fromTo(visual, poseVars(index, 'hold'), {
          ...poseVars(index, 'exit'), duration: TRANSITION_DURATION,
          ease: index === 0 || index === 2 ? 'power2.in' : 'power1.inOut',
          immediateRender: false,
        }, exit);
      }

      const editorial = [titles[index], captions[index], asides[index]];
      editorial.forEach((element, order) => {
        if (!element || element === heroWord) return;
        if (index > 0) timeline.fromTo(element, { autoAlpha: 0, y: order === 0 ? 20 : 9 }, {
          autoAlpha: 1, y: 0, duration: 0.33, ease: 'power2.out', immediateRender: false,
        }, start + 0.3 + order * 0.045);
        if (index < scenes.length - 1) timeline.fromTo(element, { autoAlpha: 1, y: 0 }, {
          autoAlpha: 0, y: order === 0 ? -20 : -8, duration: 0.24,
          ease: 'power1.in', immediateRender: false,
        }, exit + order * 0.035);
      });

      if (index < scenes.length - 1) timeline.fromTo(scene, { visibility: 'visible' }, {
        visibility: 'hidden', duration: 0, immediateRender: false,
      }, exit + TRANSITION_DURATION + 0.001);
    });

    if (heroWord) {
      gsap.set(heroWord, { autoAlpha: 1, scale: 1, xPercent: 0, yPercent: 0 });
      timeline.fromTo(heroWord, { scale: 1, xPercent: 0 }, {
        scale: 1.018, xPercent: -0.5, duration: FIRST_TRANSITION, immediateRender: false,
      }, 0);
      timeline.fromTo(heroWord, { autoAlpha: 1, scale: 1.018, xPercent: -0.5 }, {
        autoAlpha: 0, scale: 1.09, xPercent: -11, duration: 0.56,
        ease: 'power1.in', immediateRender: false,
      }, FIRST_TRANSITION);
    }
    if (heroShadow) {
      gsap.set(heroShadow, { scale: 1, xPercent: 0, yPercent: 0 });
      timeline.fromTo(heroShadow, { scale: 1, opacity: shadowOpacity }, {
        scale: 0.98, opacity: shadowOpacity * 0.95,
        duration: FIRST_TRANSITION, immediateRender: false,
      }, 0);
      timeline.fromTo(heroShadow, { scale: 0.98, opacity: shadowOpacity * 0.95, yPercent: 0 }, {
        scale: 1.3, opacity: 0, yPercent: 8, duration: 0.54, immediateRender: false,
      }, FIRST_TRANSITION);
    }

    timeline.eventCallback('onUpdate', updateStatus);
    trigger = ScrollTrigger.create({
      id: 'glaze-exhibition',
      trigger: stage,
      pin: stage,
      animation: timeline,
      start: 'top top',
      end: () => `+=${Math.round((stage.clientHeight || window.innerHeight) * (narrow() ? 9.5 : 12))}`,
      scrub: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    });
  }, stage);

  const onLenisScroll = () => ScrollTrigger.update();
  const tick = (seconds: number) => {
    if (!destroyed && !suspended) lenis.raf(seconds * 1000);
  };
  lenis.on('scroll', onLenisScroll);
  gsap.ticker.lagSmoothing(0);
  // Run the one application clock before GSAP renders its timelines.
  gsap.ticker.add(tick, false, true);

  const onRefreshInit = () => {
    if (destroyed) return;
    refreshInProgress = true;
    if (!ready) return;
    const y = lenis.actualScroll;
    savedRefreshProgress = y >= trigger.start && y <= trigger.end
      ? stableProgress
      : null;
  };
  const onRefresh = () => {
    if (destroyed) return;
    refreshInProgress = false;
    restoringRefresh = true;
    lenis.resize();
    if (savedRefreshProgress !== null) {
      const target = trigger.start + savedRefreshProgress * (trigger.end - trigger.start);
      savedRefreshProgress = null;
      lenis.scrollTo(target, { immediate: true, force: true });
    }
    ScrollTrigger.update();
    restoringRefresh = false;
    updateStatus();
  };
  ScrollTrigger.addEventListener('refreshInit', onRefreshInit);
  ScrollTrigger.addEventListener('refresh', onRefresh);

  function navigate(index: number, immediate: boolean) {
    const time = index === 0 ? 0 : Math.min(duration, arrival(index) + 0.26);
    const target = trigger.start + (time / duration) * (trigger.end - trigger.start);
    lenis.scrollTo(target, { immediate, force: true });
    if (immediate) ScrollTrigger.update();
  }

  function flushNavigation() {
    if (!pendingNavigation || paused || suspended) return;
    const next = pendingNavigation;
    pendingNavigation = null;
    navigate(next.index, next.immediate);
  }

  const onVisibility = () => {
    if (destroyed) return;
    suspended = document.hidden;
    if (suspended) {
      lenis.stop();
    } else {
      if (!paused) lenis.start();
      lenis.resize();
      // Discard hidden-tab inertia instead of integrating a very large delta.
      lenis.scrollTo(lenis.actualScroll, { immediate: true, force: true });
      ScrollTrigger.update();
      flushNavigation();
    }
  };
  document.addEventListener('visibilitychange', onVisibility, true);

  // ScrollTrigger defers the first refresh of a timeline by one tick. Finish it
  // now so a caller can immediately goTo() after a full/reduced mode remount;
  // otherwise Lenis can still see a zero-height scroll range and clamp to zero.
  trigger.refresh();
  lenis.resize();
  if (suspended) lenis.stop();
  ready = true;
  updateStatus();

  return {
    goTo(index, immediate = false) {
      if (destroyed) return;
      const target = Math.round(clamp(index, 0, scenes.length - 1));
      if (paused || suspended) pendingNavigation = { index: target, immediate };
      else navigate(target, immediate);
    },
    getActiveIndex: () => Math.max(activeIndex, 0),
    pause() {
      if (destroyed || paused) return;
      paused = true;
      lenis.stop();
    },
    resume() {
      if (destroyed) return;
      paused = false;
      if (!suspended) {
        lenis.start();
        lenis.resize();
        ScrollTrigger.update();
        flushNavigation();
      }
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      pendingNavigation = null;
      document.removeEventListener('visibilitychange', onVisibility, true);
      ScrollTrigger.removeEventListener('refreshInit', onRefreshInit);
      ScrollTrigger.removeEventListener('refresh', onRefresh);
      gsap.ticker.remove(tick);
      lenis.off('scroll', onLenisScroll);
      lenis.destroy();
      context.revert();
      hints.forEach((previous, element) => {
        if (previous.value) element.style.setProperty('will-change', previous.value, previous.priority);
        else element.style.removeProperty('will-change');
      });
      hints.clear();
    },
  };
}

/** Full compositions in ordinary document flow, with no artificial scroll track. */
function createReducedMotion(options: MotionOptions): MotionController {
  const { stage, scenes, onSceneChange, onProgress } = options;
  let destroyed = false;
  let paused = false;
  let activeIndex = -1;
  let pendingNavigation: Navigation | null = null;
  let centers: number[] = [];
  let firstTop = 0;
  let travel = 1;
  let viewportHeight = window.innerHeight;
  let previousOverflow: { value: string; priority: string } | null = null;

  const context = gsap.context(() => {
    const elements: HTMLElement[] = [
      ...scenes,
      ...Array.from(stage.querySelectorAll<HTMLElement>('.scene-visual, .scene-title, .scene-caption, .scene-aside, .hero-object, .hero-shadow, .hero-word')),
    ];
    gsap.set(elements, { clearProps: 'transform,opacity,visibility,clipPath,willChange' });
  }, stage);

  function report() {
    if (destroyed || paused) return;
    const center = window.scrollY + viewportHeight * 0.5;
    let index = 0;
    let distance = Infinity;
    centers.forEach((value, i) => {
      const current = Math.abs(value - center);
      if (current < distance) { distance = current; index = i; }
    });
    if (activeIndex !== index) { activeIndex = index; onSceneChange(index); }
    onProgress?.(clamp((window.scrollY - firstTop) / travel));
  }

  function measure() {
    if (destroyed) return;
    viewportHeight = window.innerHeight;
    const y = window.scrollY;
    const rectangles = scenes.map(scene => scene.getBoundingClientRect());
    centers = rectangles.map(rect => rect.top + y + rect.height * 0.5);
    firstTop = rectangles[0].top + y;
    const last = rectangles[rectangles.length - 1];
    travel = Math.max(1, last.top + y - firstTop);
    report();
  }

  const onScroll = () => report();
  const observer = new IntersectionObserver(() => report(), {
    rootMargin: '-30% 0px -30% 0px', threshold: [0, 0.5, 1],
  });
  scenes.forEach(scene => observer.observe(scene));
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', measure, { passive: true });

  const restoreOverflow = () => {
    if (!previousOverflow) return;
    if (previousOverflow.value) document.documentElement.style.setProperty('overflow', previousOverflow.value, previousOverflow.priority);
    else document.documentElement.style.removeProperty('overflow');
    previousOverflow = null;
  };
  measure();

  return {
    goTo(index, immediate = true) {
      if (destroyed) return;
      const target = Math.round(clamp(index, 0, scenes.length - 1));
      if (paused) pendingNavigation = { index: target, immediate };
      else {
        scenes[target].scrollIntoView({ block: 'start', behavior: 'auto' });
        report();
      }
    },
    getActiveIndex: () => Math.max(activeIndex, 0),
    pause() {
      if (destroyed || paused) return;
      paused = true;
      previousOverflow = {
        value: document.documentElement.style.getPropertyValue('overflow'),
        priority: document.documentElement.style.getPropertyPriority('overflow'),
      };
      document.documentElement.style.overflow = 'hidden';
    },
    resume() {
      if (destroyed) return;
      paused = false;
      restoreOverflow();
      measure();
      if (pendingNavigation) {
        const target = pendingNavigation.index;
        pendingNavigation = null;
        scenes[target].scrollIntoView({ block: 'start', behavior: 'auto' });
        report();
      }
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      pendingNavigation = null;
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      restoreOverflow();
      context.revert();
    },
  };
}
