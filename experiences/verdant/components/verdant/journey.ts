import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CHAPTERS, STORY_DURATION, chapterAt } from "./chapters";
import { LivingSurface } from "./living-surface";

export interface JourneyController { goTo: (chapter: number) => void; setMenuOpen: (open: boolean) => void; refresh: () => void; destroy: () => void }
interface Options { reduced: boolean; onChapter: (chapter: number) => void; restoreChapter: number | null }

export function createJourney(root: HTMLElement, options: Options): JourneyController {
  gsap.registerPlugin(ScrollTrigger);
  gsap.ticker.lagSmoothing(0);
  // Resize is owned below so the logical camera position survives a new viewport.
  ScrollTrigger.config({ ignoreMobileResize: true, autoRefreshEvents: "visibilitychange,DOMContentLoaded,load" });
  const story = root.querySelector<HTMLElement>(".story")!;
  const stage = root.querySelector<HTMLElement>(".stage")!;
  const scenes = [...root.querySelectorAll<HTMLElement>(".scene")];
  const query = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  let disposed = false;
  let menuOpen = false;
  let current = -1;
  let mobile = window.innerWidth <= 700;
  let cinematic = !options.reduced && window.innerHeight > 520;
  let lenis: Lenis | null = null;
  let trigger: ScrollTrigger | null = null;
  let timeline: gsap.core.Timeline | null = null;
  let context: gsap.Context | null = null;
  let observer: IntersectionObserver | null = null;
  let surfaces: LivingSurface[] = [];
  let tick: ((seconds: number, delta: number) => void) | null = null;
  let resizeTimer = 0;
  let resizeProgress: number | null = null;
  let elapsed = 0;
  let lastTime = 0;
  let trackedTime = 0;
  let pendingRefresh = false;
  const inspect = new URL(window.location.href).searchParams.has("inspect");

  const setChapter = (index: number) => {
    if (disposed || current === index) return;
    current = index;
    root.dataset.scene = String(index);
    if (cinematic) scenes.forEach((scene, i) => { scene.inert = i !== index; scene.setAttribute("aria-hidden", String(i !== index)); });
    options.onChapter(index);
  };

  const focusChapter = (index: number) => {
    if (disposed) return;
    scenes[index]?.querySelector<HTMLElement>("h1,h2")?.focus({ preventScroll: true });
  };

  const chapterY = (index: number) => {
    if (cinematic && trigger) return trigger.start + (CHAPTERS[index].hold / STORY_DURATION) * (trigger.end - trigger.start);
    return scenes[index].getBoundingClientRect().top + window.scrollY;
  };

  const jump = (index: number, immediate = false, focus = true) => {
    if (disposed || index < 0 || index >= scenes.length) return;
    const y = chapterY(index);
    if (!immediate) window.history.replaceState(null, "", `#${CHAPTERS[index].id}`);
    if (lenis) {
      lenis.scrollTo(y, { immediate, force: immediate, duration: Math.min(2.15, .65 + Math.abs(window.scrollY - y) / 7500), lerp: 0,
        easing: (t: number) => 1 - Math.pow(1 - t, 4), onComplete: () => { if (focus) focusChapter(index); } });
    } else {
      window.scrollTo({ top: y, behavior: "instant" });
      if (focus) focusChapter(index);
    }
    if (immediate) { ScrollTrigger.update(); setChapter(index); }
  };

  const buildStatic = () => {
    root.dataset.mode = "static";
    scenes.forEach((scene) => { scene.inert = false; scene.removeAttribute("aria-hidden"); });
    const visibility = new Map<Element, number>();
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => visibility.set(entry.target, entry.intersectionRatio));
      let best = 0; let bestRatio = -1;
      scenes.forEach((scene, index) => { const ratio = visibility.get(scene) || 0; if (ratio > bestRatio) { bestRatio = ratio; best = index; } });
      setChapter(best);
    }, { threshold: [0,.15,.35,.55,.75,1] });
    scenes.forEach((scene) => observer!.observe(scene));
  };

  const buildCinematic = () => {
    root.dataset.mode = "cinematic";
    const pavilion = query(".world-pavilion"), water = query(".world-water"), fern = query(".world-fern"), meadow = query(".world-meadow");
    const pavilionCamera = query(".camera-pavilion"), waterCamera = query(".camera-water"), fernCamera = query(".camera-fern"), meadowCamera = query(".camera-meadow");
    const shade = query(".water-shade");
    const archMask = mobile ? "inset(54% 0% 0% 0%)" : "inset(0% 0% 8% 42%)";
    const initialMask = mobile ? "inset(54% 0% 0% 0%)" : "inset(40% 0% 0% 0%)";
    const endMask = mobile ? "inset(63% 0% 0% 0%)" : "inset(66% 0% 0% 0%)";
    const full = "inset(0% 0% 0% 0%)";
    lenis = new Lenis({ autoRaf: false, lerp: .115, smoothWheel: true, syncTouch: false, respectReducedMotion: true });
    lenis.on("scroll", ScrollTrigger.update);
    context = gsap.context(() => {
      gsap.set(scenes, { autoAlpha: 0 }); gsap.set(scenes[0], { autoAlpha: 1 });
      gsap.set(pavilion, { visibility: "visible", clipPath: initialMask });
      gsap.set(pavilionCamera, { top: mobile ? "54%" : "40%", height: mobile ? "46%" : "60%", yPercent: 0, scale: 1.02, xPercent: 0, transformOrigin: "50% 100%" });
      gsap.set(query('[data-surface="water"]'), { opacity: 0 });
      gsap.set(water, { autoAlpha: 0 });
      gsap.set(waterCamera, { scale: 1.03 });
      gsap.set(fern, { visibility: "hidden", clipPath: "inset(0% 0% 0% 100%)" });
      gsap.set(fernCamera, { scale: 1.12, xPercent: 3, yPercent: 0, transformOrigin: "75% 45%" });
      gsap.set(meadow, { visibility: "hidden", clipPath: "inset(100% 0% 0% 0%)" });
      gsap.set(meadowCamera, { yPercent: 12, scale: 1.04, transformOrigin: "50% 70%" });
      gsap.set(shade, { opacity: 0 });
      gsap.set(root, { "--header-ink": "#20372a", "--footer-ink": "#f2f1e9" });
      const tl = gsap.timeline({ defaults: { ease: "sine.inOut" }, onUpdate: () => {
        trackedTime = tl.time();
        setChapter(chapterAt(trackedTime));
        if (inspect) root.dataset.storyTime = trackedTime.toFixed(3);
      }});
      timeline = tl;
      CHAPTERS.forEach((chapter) => tl.addLabel(`${chapter.id}-hold`, chapter.hold));
      // Arrival holds as a complete poster. Only then does the picture become a space.
      tl.to(scenes[0], { autoAlpha: 0, duration: .5 }, .85)
        .to(pavilion, { clipPath: full, duration: 1.0 }, .85)
        .to(pavilionCamera, { top: "0%", height: "100%", yPercent: 0, scale: 1.065, duration: 1.0 }, .85)
        .to(query('[data-surface="water"]'), { opacity: 1, duration: .18 }, 1.85)
        .set(fern, { visibility: "visible" }, 1.78)
        .to(fern, { clipPath: full, duration: .85 }, 1.78)
        .to(fernCamera, { scale: 1.025, xPercent: 0, duration: .85 }, 1.78)
        .to(root, { "--header-ink": "#f2f1e9", duration: .35 }, 2.02)
        .to(scenes[1], { autoAlpha: 1, duration: .34 }, 2.31)
        .set(pavilion, { visibility: "hidden" }, 2.66);
      // The fern's crop becomes the edge of the architecture, with the same pavilion beneath.
      tl.to(scenes[1], { autoAlpha: 0, duration: .38 }, 3.72)
        .set(pavilion, { visibility: "visible", clipPath: archMask }, 3.72)
        .set(pavilionCamera, { top: mobile ? "54%" : "0%", height: mobile ? "46%" : "100%", yPercent: 0, scale: mobile ? 1.02 : 1.12 }, 3.72)
        .set(query('[data-surface="water"]'), { opacity: mobile ? 0 : 1 }, 3.72)
        .to(fern, { clipPath: archMask, duration: .5 }, 3.78)
        .to(fernCamera, { scale: 1.075, xPercent: -2, duration: .8 }, 3.78)
        .to(fern, { clipPath: mobile ? "inset(100% 0% 0% 0%)" : "inset(0% 0% 8% 100%)", duration: .42 }, 4.24)
        .to(root, { "--header-ink": "#20372a", "--footer-ink": mobile ? "#f2f1e9" : "#20372a", duration: .32 }, 4.2)
        .to(scenes[2], { autoAlpha: 1, duration: .35 }, 4.31)
        .set(fern, { visibility: "hidden" }, 4.67);
      // Enter the same pool, then resolve its reflection into a dedicated, detailed close-up.
      tl.to(scenes[2], { autoAlpha: 0, duration: .4 }, 5.83)
        .to(pavilion, { clipPath: full, duration: .6 }, 5.83)
        .to(pavilionCamera, { top: "0%", height: "100%", scale: 3.8, yPercent: 0, duration: .98, ease: "power1.inOut" }, 5.83)
        .to(water, { autoAlpha: 1, duration: .58 }, 6.25)
        .to(waterCamera, { scale: 1.06, duration: .72 }, 6.15)
        .to(shade, { opacity: .26, duration: .66 }, 6.10)
        .to(root, { "--header-ink": "#f2f1e9", "--footer-ink": "#f2f1e9", duration: .3 }, 6.37)
        .to(scenes[3], { autoAlpha: 1, duration: .36 }, 6.47);
      // The horizontal waterline opens into a real horizon.
      tl.to(scenes[3], { autoAlpha: 0, duration: .42 }, 8.02)
        .set(meadow, { visibility: "visible" }, 8.10)
        .to(meadow, { clipPath: full, duration: .9 }, 8.10)
        .to(meadowCamera, { yPercent: 0, scale: 1.015, duration: .9 }, 8.10)
        .to(shade, { opacity: 0, duration: .4 }, 8.55)
        .to(root, { "--header-ink": "#20372a", duration: .3 }, 8.70)
        .to(scenes[4], { autoAlpha: 1, duration: .35 }, 8.68)
        .set(pavilion, { visibility: "hidden" }, 9.02)
        .set(water, { visibility: "hidden" }, 9.02);
      // The landscape remains: it settles into the last frame instead of disappearing.
      tl.to(scenes[4], { autoAlpha: 0, duration: .4 }, 10.40)
        .to(meadow, { clipPath: endMask, duration: 1.05 }, 10.48)
        .to(meadowCamera, { yPercent: 20, scale: 1.015, duration: 1.05 }, 10.48)
        .to(scenes[5], { autoAlpha: 1, duration: .48 }, 11.14)
        .to({}, { duration: .98 }, 11.62);
      trigger = ScrollTrigger.create({ trigger: story, start: "top top", end: () => `+=${Math.max(1, story.offsetHeight - stage.offsetHeight)}`, animation: tl, scrub: true });
    }, root);

    surfaces = [
      new LivingSurface(query<HTMLCanvasElement>('[data-surface="water"]'), query<HTMLImageElement>(".camera-pavilion img"), "water"),
      new LivingSurface(query<HTMLCanvasElement>('[data-surface="wind"]'), query<HTMLImageElement>(".camera-meadow img"), "wind"),
      new LivingSurface(query<HTMLCanvasElement>('[data-surface="reflection"]'), query<HTMLImageElement>(".camera-water img"), "reflection"),
    ];
    const width = stage.clientWidth, height = stage.clientHeight;
    surfaces.forEach((surface) => surface.resize(width, height));
    const leafLight = query(".leaf-light");
    const pavilionPicture = query(".camera-pavilion .photograph");
    const meadowPicture = query(".camera-meadow .photograph");
    const waterPicture = query(".camera-water .photograph");
    let metricsAge = 0;
    const frameTimes: number[] = [];
    tick = (seconds, delta) => {
      if (disposed || document.hidden) { lastTime = seconds; return; }
      lenis?.raf(seconds * 1000);
      // Font/image readiness must not erase a wheel destination during entry.
      if (pendingRefresh && lenis && Math.abs(lenis.velocity) < .1 && Math.abs(lenis.targetScroll - lenis.animatedScroll) < 1) {
        pendingRefresh = false;
        trigger?.refresh(); lenis.resize(); ScrollTrigger.update();
      }
      const dt = Math.max(0, Math.min(.05, seconds - (lastTime || seconds)));
      lastTime = seconds;
      if (menuOpen) return;
      elapsed += dt;
      if (trackedTime < 2.66 || (trackedTime >= 3.72 && trackedTime < 6.84)) surfaces[0]?.render(elapsed);
      if (trackedTime >= 8.1) surfaces[1]?.render(elapsed);
      if (trackedTime >= 6.25 && trackedTime < 9.02) surfaces[2]?.render(elapsed);
      if (trackedTime >= 1.78 && trackedTime < 4.67) leafLight.style.opacity = String(.38 + Math.sin(elapsed * .32) * .14);
      // Gentle compositor-only drift also keeps unsupported WebGL devices alive.
      if (trackedTime >= 6.1 && trackedTime < 9.02) pavilionPicture.style.transform = `translate3d(${Math.sin(elapsed * .32) * .11}%,0,0) scale(1.006)`;
      else pavilionPicture.style.transform = "";
      if (trackedTime >= 6.25 && trackedTime < 9.02) waterPicture.style.transform = `translate3d(${Math.sin(elapsed * .32) * .11}%,0,0) scale(1.006)`;
      if (trackedTime >= 8.1) meadowPicture.style.transform = `translate3d(${Math.sin(elapsed * .29) * .1}%,0,0) scale(1.006)`;
      if (inspect && delta > 0 && delta < 200) {
        frameTimes.push(delta); if (frameTimes.length > 240) frameTimes.shift();
        metricsAge += dt;
        if (metricsAge > 2) {
          const sorted = [...frameTimes].sort((a,b) => a-b);
          root.dataset.frameMedian = (sorted[Math.floor(sorted.length / 2)] || 0).toFixed(2);
          root.dataset.frameP95 = (sorted[Math.floor(sorted.length * .95)] || 0).toFixed(2);
          root.dataset.frameSamples = String(frameTimes.length);
          metricsAge = 0;
        }
      }
    };
    gsap.ticker.add(tick, false, true);
    trigger?.refresh(); ScrollTrigger.update();
    if (menuOpen) lenis.stop();
  };

  const clearMode = () => {
    if (tick) gsap.ticker.remove(tick);
    tick = null;
    observer?.disconnect(); observer = null;
    context?.revert(); context = null;
    trigger = null; timeline = null;
    lenis?.off("scroll", ScrollTrigger.update); lenis?.destroy(); lenis = null;
    surfaces.forEach((surface) => surface.destroy()); surfaces = [];
    root.querySelectorAll<HTMLElement>(".camera .photograph").forEach((photo) => { photo.style.transform = ""; });
    scenes.forEach((scene) => { scene.inert = false; scene.removeAttribute("aria-hidden"); });
  };

  const rebuild = () => {
    if (disposed) return;
    const preservedProgress = resizeProgress ?? trigger?.progress;
    resizeProgress = null;
    const nextMobile = window.innerWidth <= 700;
    const nextCinematic = !options.reduced && window.innerHeight > 520;
    if (nextMobile !== mobile || nextCinematic !== cinematic) {
      const oldProgress = preservedProgress;
      const oldChapter = Math.max(0, current);
      const wasCinematic = cinematic;
      clearMode();
      mobile = nextMobile; cinematic = nextCinematic; current = -1;
      if (cinematic) buildCinematic(); else buildStatic();
      if (wasCinematic && cinematic && oldProgress !== undefined && trigger && lenis) {
        lenis.scrollTo(trigger.start + oldProgress * (trigger.end - trigger.start), { immediate: true, force: true });
        ScrollTrigger.update();
      } else jump(oldChapter, true, false);
    } else {
      const width = stage.clientWidth, height = stage.clientHeight;
      surfaces.forEach((surface) => surface.resize(width, height));
      trigger?.refresh(); lenis?.resize();
      if (preservedProgress !== undefined && trigger && lenis) {
        lenis.scrollTo(trigger.start + preservedProgress * (trigger.end - trigger.start), { immediate: true, force: true });
      }
      ScrollTrigger.update();
    }
  };
  const resize = () => {
    if (resizeProgress === null && cinematic) resizeProgress = trackedTime / STORY_DURATION;
    window.clearTimeout(resizeTimer); resizeTimer = window.setTimeout(rebuild, 180);
  };
  const visibility = () => {
    if (document.hidden) lenis?.stop();
    else { lastTime = 0; if (!menuOpen) lenis?.start(); ScrollTrigger.update(); }
  };
  const pageshow = () => { trigger?.refresh(); lenis?.resize(); ScrollTrigger.update(); };
  const hashchange = () => { const index = CHAPTERS.findIndex((chapter) => window.location.hash === `#${chapter.id}`); if (index >= 0) jump(index, true); };

  if (cinematic) buildCinematic(); else buildStatic();
  const hashChapter = CHAPTERS.findIndex((chapter) => window.location.hash === `#${chapter.id}`);
  if (options.restoreChapter !== null) jump(options.restoreChapter, true, false);
  else if (hashChapter >= 0) jump(hashChapter, true, false);
  else if (current < 0) setChapter(0);
  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", visibility);
  window.addEventListener("pageshow", pageshow);
  window.addEventListener("hashchange", hashchange);

  return {
    goTo: (index) => jump(index),
    setMenuOpen: (open) => { menuOpen = open; story.inert = open; if (open) lenis?.stop(); else if (!document.hidden) lenis?.start(); },
    refresh: () => { if (!disposed) pendingRefresh = true; },
    destroy: () => {
      disposed = true;
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pageshow", pageshow);
      window.removeEventListener("hashchange", hashchange);
      clearMode(); story.inert = false; root.dataset.mode = "static";
    },
  };
}
