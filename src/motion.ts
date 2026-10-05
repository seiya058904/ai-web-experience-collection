import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { $, $$ } from "./dom";
import { createChoreography } from "./choreography";

gsap.registerPlugin(ScrollTrigger);
// Geometry belongs to the refresh queue below, including resize and visibility.
ScrollTrigger.config({ ignoreMobileResize: true, autoRefreshEvents: "none" });

export type MotionService = ReturnType<typeof createMotion>;
let disposePrevious: (() => void) | undefined;

export function createMotion() {
  disposePrevious?.();
  const lifetime = new AbortController();
  const { signal } = lifetime;
  const cleanup = new Set<() => void>();
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const desktop = matchMedia("(min-width: 761px)");
  let choice: string | null = null;
  try {
    choice = localStorage.getItem("f1-motion");
  } catch {
    /* Optional storage. */
  }
  let reduced = choice ? choice === "reduced" : preference.matches;
  let destroyed = false;
  let clock = 0;
  let resumed = true;
  let dirty = true;
  let rebuild = true;
  let lastGeometryEvent = performance.now();
  let lastInput = -1000;
  let wheelDirection = 0;
  let chromeDirty = true;
  let dimensions = "";
  let choreography: ReturnType<typeof createChoreography> | undefined;
  let pendingAnchor: { target: HTMLElement; history: boolean } | undefined;
  let reflowAnchor:
    | { target: HTMLElement; top: number; inputAt: number }
    | undefined;
  const listeners = new Set<(value: boolean) => void>();
  const animations = new Set<{
    element: HTMLElement;
    tick: (time: number, delta: number) => void;
    visible: boolean;
  }>();
  const stats = { frames: 0, refreshes: 0, lastRefreshY: 0, maxDelta: 0 };

  const lenis = new Lenis({
    lerp: 0.105,
    smoothWheel: !reduced,
    syncTouch: false,
    autoRaf: false,
    // The internal Dimensions observer measures without resetting inertia.
    autoResize: true,
    respectReducedMotion: false, // One owner for OS + visitor preferences.
    virtualScroll: ({ deltaY, event }) => {
      lastInput = performance.now();
      if (event.type === "wheel" && Math.abs(deltaY) > 1 && !event.ctrlKey) {
        const direction = Math.sign(deltaY);
        // A deliberate reversal cancels the old destination, not the new input.
        if (
          wheelDirection &&
          direction !== wheelDirection &&
          lenis.isScrolling === "smooth"
        )
          lenis.scrollTo(lenis.actualScroll, { immediate: true });
        wheelDirection = direction;
      }
      return true;
    },
  });

  const visibility = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        for (const animation of animations)
          if (animation.element === entry.target)
            animation.visible = entry.isIntersecting;
    },
    { rootMargin: "60px" },
  );

  const progress = $(".reading-progress");
  const header = $(".site-header");
  let pageHeight = 1;
  let lightRanges: { start: number; end: number }[] = [];
  let navRanges: { start: number; end: number; link: HTMLElement }[] = [];
  function measureChrome() {
    pageHeight = Math.max(
      1,
      document.documentElement.scrollHeight - innerHeight,
    );
    lightRanges = $$(".light-section").map((section) => {
      const r = (
        section.closest(".scene-shell") ?? section
      ).getBoundingClientRect();
      return {
        start: r.top + scrollY,
        end: r.bottom + scrollY,
      };
    });
    navRanges = $$(".desktop-nav a").map((link) => {
      const section = $(link.getAttribute("href")!);
      const r = (
        section.closest(".scene-shell") ?? section
      ).getBoundingClientRect();
      return {
        start: r.top + scrollY,
        end: r.bottom + scrollY,
        link,
      };
    });
    chromeDirty = true;
  }
  function renderChrome() {
    chromeDirty = false;
    const y = lenis.actualScroll;
    progress.style.transform = `scaleX(${Math.min(1, y / pageHeight)})`;
    header.classList.toggle("is-scrolled", y > 30);
    header.classList.toggle(
      "on-light",
      lightRanges.some((r) => y + 38 >= r.start && y + 38 < r.end),
    );
    for (const r of navRanges)
      r.link.classList.toggle(
        "is-current",
        y + 150 >= r.start && y + 150 < r.end,
      );
  }

  function refresh() {
    if (destroyed) return;
    dirty = true;
    lastGeometryEvent = performance.now();
  }
  function flushGeometry() {
    dirty = false;
    if (!rebuild) settleReflowAnchor();
    const anchor =
      rebuild && scrollY > 0
        ? $$("main section")
            .reverse()
            .find((section) => {
              const rect = section.getBoundingClientRect();
              return (
                rect.top <= innerHeight * 0.4 && rect.bottom > innerHeight * 0.4
              );
            })
        : undefined;
    const before = anchor?.getBoundingClientRect().top ?? 0;
    if (rebuild) {
      syncPreference();
      document.documentElement.classList.toggle("motion-active", !reduced);
      choreography?.destroy();
      choreography = undefined;
      if (!reduced) choreography = createChoreography(desktop.matches);
      rebuild = false;
    }
    if (anchor) {
      const after = anchor.getBoundingClientRect().top;
      if (Math.abs(after - before) > 1)
        lenis.scrollTo(lenis.actualScroll + after - before, {
          immediate: true,
        });
      // Offscreen descendants can finish style invalidation after this read.
      // Verify at the next settled geometry checkpoint, never over new input.
      reflowAnchor = { target: anchor, top: before, inputAt: lastInput };
      refresh();
    }
    choreography?.measure();
    const next = `${innerWidth}:${innerHeight}:${document.documentElement.scrollHeight}`;
    // Font/image/visibility notifications must never erase a live destination.
    // Real size changes only reach here after inertia ends.
    if (next !== dimensions) {
      lenis.resize();
      dimensions = next;
    }
    ScrollTrigger.refresh();
    measureChrome();
    stats.refreshes++;
    stats.lastRefreshY = scrollY;
  }

  function navigate(target: HTMLElement, updateHistory: boolean) {
    if (updateHistory && target.id)
      history.pushState(null, "", `#${target.id}`);
    // Numeric coordinates avoid subtracting scroll-padding twice (Lenis 1.3).
    const destination = target.closest(".scene-shell") ?? target;
    const y =
      target.id === "top"
        ? 0
        : destination.getBoundingClientRect().top +
          scrollY -
          header.offsetHeight -
          16;
    lenis.scrollTo(y, {
      immediate: reduced,
      duration: 1.05,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      onComplete: () => {
        if (!target.hasAttribute("tabindex"))
          target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      },
    });
  }
  function scrollTo(target: HTMLElement, updateHistory = true) {
    pendingAnchor = { target, history: updateHistory };
    if (target instanceof HTMLDetailsElement) {
      target.open = true;
      refresh();
    }
  }

  function settleReflowAnchor() {
    if (reflowAnchor) {
      const { target, top, inputAt } = reflowAnchor;
      reflowAnchor = undefined;
      if (inputAt === lastInput && !pendingAnchor && !lenis.isTouching) {
        const shell = target.closest<HTMLElement>(".scene-shell");
        let destination =
          lenis.actualScroll + target.getBoundingClientRect().top - top;
        if (shell) {
          // Invert the sticky hold when restoring an outgoing shot. A simple
          // delta cannot move a scene while it is on its fixed-position plateau.
          const hold = shell.offsetHeight - target.offsetHeight;
          const stickyTop = parseFloat(getComputedStyle(target).top) || 0;
          destination =
            shell.getBoundingClientRect().top + lenis.actualScroll - top;
          if (top < stickyTop - 1) destination += hold;
        }
        if (Math.abs(destination - lenis.actualScroll) > 1) {
          lenis.scrollTo(destination, { immediate: true });
        }
      }
    }
  }
  function tick(_time: number, rawDelta: number) {
    if (destroyed || document.hidden) return;
    // Visible time avoids interpreting a background gap as one giant frame.
    // GSAP is the only continuously scheduled application clock.
    const delta = Math.min(
      rawDelta,
      resumed || rawDelta > 250 ? 1000 / 60 : 50,
    );
    resumed = false;
    clock += delta;
    stats.frames++;
    stats.maxDelta = Math.max(stats.maxDelta, delta);
    lenis.raf(clock);
    const now = performance.now();
    // Lenis can retain the label "native" after a zero-distance browser scroll
    // event. That idle state must not starve resize/font/disclosure refreshes.
    const resting =
      !lenis.isScrolling ||
      (lenis.isScrolling === "native" && Math.abs(lenis.velocity) < 0.5);
    if (
      dirty &&
      resting &&
      !lenis.isTouching &&
      now - lastInput > 180 &&
      now - lastGeometryEvent > 120
    )
      flushGeometry();
    if (pendingAnchor) {
      // Navigation intentionally interrupts the previous destination.
      lenis.scrollTo(lenis.actualScroll, { immediate: true });
      if (dirty) flushGeometry();
      const { target, history } = pendingAnchor;
      pendingAnchor = undefined;
      reflowAnchor = undefined;
      navigate(target, history);
    }
    if (chromeDirty) renderChrome();
    if (reduced) return;
    choreography?.render(lenis.actualScroll);
    for (const animation of animations)
      if (animation.visible) animation.tick(clock / 1000, delta);
  }

  const onScroll = () => {
    chromeDirty = true;
    ScrollTrigger.update();
  };
  lenis.on("scroll", onScroll);
  addEventListener(
    "scroll",
    () => {
      chromeDirty = true;
    },
    { passive: true, signal },
  );
  addEventListener(
    "keydown",
    (event) => {
      if (
        ![
          "ArrowUp",
          "ArrowDown",
          "PageUp",
          "PageDown",
          "Home",
          "End",
          " ",
        ].includes(event.key)
      )
        return;
      if (
        event.target instanceof Element &&
        event.target.closest(
          "input, textarea, select, button, [contenteditable=true]",
        )
      )
        return;
      lastInput = performance.now();
      // Let native keyboard navigation take over cleanly from wheel inertia.
      if (lenis.isScrolling === "smooth")
        lenis.scrollTo(lenis.actualScroll, { immediate: true });
    },
    { signal },
  );
  addEventListener(
    "pointerdown",
    () => {
      reflowAnchor = undefined;
    },
    { passive: true, signal },
  );
  gsap.ticker.lagSmoothing(0);

  function syncPreference() {
    const button = $(".motion-toggle");
    button.setAttribute("aria-pressed", String(reduced));
    const label = reduced ? "开启动态效果" : "关闭动态效果";
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
    document.documentElement.classList.toggle("motion-reduced", reduced);
    lenis.options.smoothWheel = !reduced;
  }
  function changePreference(next: boolean) {
    if (next === reduced) return;
    reduced = next;
    lenis.scrollTo(lenis.actualScroll, { immediate: true });
    rebuild = true;
    flushGeometry();
    listeners.forEach((listener) => listener(reduced));
  }
  $(".motion-toggle").addEventListener(
    "click",
    () => {
      choice = reduced ? "full" : "reduced";
      try {
        localStorage.setItem("f1-motion", choice);
      } catch {
        /* Optional storage. */
      }
      changePreference(!reduced);
    },
    { signal },
  );
  preference.addEventListener(
    "change",
    () => {
      if (!choice) changePreference(preference.matches);
    },
    { signal },
  );
  desktop.addEventListener(
    "change",
    () => {
      rebuild = true;
      refresh();
    },
    { signal },
  );

  document.addEventListener(
    "click",
    (event) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>('a[href^="#"]');
      if (
        !link ||
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      )
        return;
      const target = document.getElementById(link.hash.slice(1));
      if (!target) return;
      event.preventDefault();
      scrollTo(target);
    },
    { signal },
  );
  function followHash() {
    let id = "top";
    try {
      id = decodeURIComponent(location.hash.slice(1)) || "top";
    } catch {
      return;
    }
    const target = document.getElementById(id);
    if (target) scrollTo(target, false);
  }
  addEventListener("popstate", followHash, { signal });
  addEventListener("hashchange", followHash, { signal });
  const restoration = history.scrollRestoration;
  history.scrollRestoration = "manual";

  // Observe layout sizes, never animated/transformed bounds on a scroll frame.
  const sizes = new WeakMap<Element, string>();
  const resizeObserver = new ResizeObserver((entries) => {
    let changed = false;
    for (const entry of entries) {
      const size = `${entry.contentRect.width}:${entry.contentRect.height}`;
      if (sizes.get(entry.target) !== size) {
        sizes.set(entry.target, size);
        changed = true;
      }
    }
    if (changed) refresh();
  });
  $$("main section, .site-footer").forEach((section) =>
    resizeObserver.observe(section),
  );
  addEventListener("resize", refresh, { passive: true, signal });
  addEventListener("orientationchange", refresh, { passive: true, signal });
  document.addEventListener(
    "visibilitychange",
    () => {
      resumed = true;
      if (!document.hidden) {
        chromeDirty = true;
        refresh();
        gsap.ticker.wake();
      }
    },
    { signal },
  );
  addEventListener(
    "pageshow",
    () => {
      resumed = true;
      refresh();
    },
    { signal },
  );
  document.fonts.addEventListener("loadingdone", refresh, { signal });

  flushGeometry();
  gsap.ticker.add(tick, false, true);

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    lifetime.abort();
    gsap.ticker.remove(tick);
    lenis.off("scroll", onScroll);
    lenis.destroy();
    choreography?.destroy();
    visibility.disconnect();
    resizeObserver.disconnect();
    cleanup.forEach((dispose) => dispose());
    cleanup.clear();
    animations.clear();
    listeners.clear();
    history.scrollRestoration = restoration;
    document.documentElement.classList.remove(
      "motion-active",
      "motion-reduced",
    );
    if (disposePrevious === destroy) disposePrevious = undefined;
  }
  disposePrevious = destroy;
  return {
    signal,
    get reduced() {
      return reduced;
    },
    scrollTo,
    refresh,
    destroy,
    own(dispose: () => void) {
      cleanup.add(dispose);
    },
    onChange(listener: (value: boolean) => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    loop(
      element: HTMLElement,
      animation: (time: number, delta: number) => void,
    ) {
      const entry = { element, tick: animation, visible: false };
      animations.add(entry);
      visibility.observe(element);
      return () => {
        visibility.unobserve(element);
        animations.delete(entry);
      };
    },
    inspect() {
      return {
        ...stats,
        destroyed,
        reduced,
        pendingRefresh: dirty,
        clock,
        actual: lenis.actualScroll,
        animated: lenis.animatedScroll,
        target: lenis.targetScroll,
        velocity: lenis.velocity,
        scrolling: lenis.isScrolling,
        stopped: lenis.isStopped,
        locked: lenis.isLocked,
        triggers: ScrollTrigger.getAll().length,
        handoffs: choreography?.inspect(),
        loops: animations.size,
        activeLoops: [...animations].filter((a) => a.visible).length,
      };
    },
  };
}
