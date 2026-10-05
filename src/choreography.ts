import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { $, $$ } from "./dom";

type Point = { x: number; y: number };
type Cue = { at: number; points: Point[] };
type Chapter = {
  selector: string;
  reading: string;
  tail: string;
  visual: string;
};
type Phase = {
  enterStart: number;
  enterEnd: number;
  fullAt: number;
  holdStart: number;
  holdEnd: number;
  exitStart: number;
  exitEnd: number;
  pinStart: number;
  pinEnd: number;
  readingTop: number;
  readingBottom: number;
  runway: number;
};
const SAMPLES = 72;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const chapters: Chapter[] = [
  {
    selector: ".intro",
    reading: ".statement, .intro-bottom",
    tail: ".intro-bottom",
    visual: ".statement",
  },
  {
    selector: ".aero",
    reading: ".aero-console, .chapter-end",
    tail: "#aero-model-note, .chapter-end",
    visual: ".wind-tunnel",
  },
  {
    selector: ".energy",
    reading: ".energy-content > h3, .energy-content > .body-muted, .energy-tabs, .battery-label, .battery, .energy-content > .fineprint, .power-spec",
    tail: ".energy-content > .fineprint, .power-spec",
    visual: ".energy-visual",
  },
  {
    selector: ".tyres",
    reading: ".human-bridge",
    tail: ".safety-note",
    visual: ".tyre-visual",
  },
  {
    selector: ".race",
    reading: ".strategy",
    tail: ".strategy-controls, .strategy > .quiet-details, .strategy > .fineprint",
    visual: ".pit-cinema",
  },
  {
    selector: ".circuits",
    reading: ".circuit-layout",
    tail: ".track-detail, .track-description, .track-tabs",
    visual: ".track-stage",
  },
];

/** One reversible visual score. No additional clock, delayed scrub or scene RAF. */
export function createChoreography(desktop: boolean) {
  const additions: Element[] = [];
  const shells: { shell: HTMLDivElement; scene: HTMLElement }[] = [];
  if (desktop) {
    // Reading distance stays in document flow. The next chapter cannot consume
    // this space while the outgoing composition is on its sticky plateau.
    for (const { selector } of chapters) {
      const scene = $(selector);
      const shell = document.createElement("div");
      shell.className = "scene-shell";
      shell.dataset.scene = scene.id;
      scene.before(shell);
      shell.append(scene);
      scene.classList.add("scene-frame");
      shells.push({ shell, scene });
    }
  }
  const anchor = (selector: string) =>
    $(selector).closest<HTMLElement>(".scene-shell") ?? $(selector);
  const svgNS = "http://www.w3.org/2000/svg";
  const ribbon = document.createElementNS(svgNS, "svg");
  ribbon.classList.add("journey-ribbon");
  ribbon.setAttribute("aria-hidden", "true");
  ribbon.setAttribute("focusable", "false");
  const line = document.createElementNS(svgNS, "path");
  line.setAttribute("pathLength", "1");
  line.setAttribute("stroke-dasharray", ".28 .72");
  ribbon.append(line);
  document.body.append(ribbon);
  additions.push(ribbon);
  let cues: Cue[] = [];
  let intervals: { start: number; end: number; from: string; to: string }[] = [];
  let previousY = NaN;
  const phases = new Map<string, Phase>();
  let openingHold = 0;
  let openingEnd = 1;

  function readingBounds(scene: HTMLElement, selector: string) {
    const origin = scene.getBoundingClientRect().top;
    const nodes = $$(selector, scene).filter((node) => node.offsetHeight > 0);
    const boxes = nodes.map((node) => node.getBoundingClientRect());
    return {
      nodes,
      top: Math.min(...boxes.map((r) => r.top - origin)),
      bottom: Math.max(...boxes.map((r) => r.bottom - origin)),
    };
  }
  function readingDistance(
    nodes: HTMLElement[],
    height: number,
    available: number,
  ) {
    const lines = nodes
      .flatMap((node) => [
        ...(node.matches("p, h3, h4") ? [node] : []),
        ...$$("p, h3, h4", node),
      ])
      .reduce((sum, node) => {
        const lineHeight = parseFloat(getComputedStyle(node).lineHeight);
        return (
          sum +
          (node.offsetHeight
            ? node.offsetHeight / (lineHeight || node.offsetHeight)
            : 0)
        );
      }, 0);
    const controls = nodes.reduce(
      (sum, node) => sum + $$("button, input, summary", node).length,
      0,
    );
    // A small visual bridge and a dense interactive lab earn different holds.
    // These are viewport/content ratios, recalculated after reflow and disclosure.
    return (
      available *
      (0.24 +
        0.42 * clamp(height / available) +
        0.22 * clamp(lines / 28) +
        0.12 * clamp(controls / 12))
    );
  }
  function measurePhases() {
    const header = $(".site-header").offsetHeight;
    const gutter = parseFloat(getComputedStyle($(".intro")).paddingLeft);
    const safeTop = header + gutter * 0.25;
    const available = Math.max(innerHeight - safeTop, innerHeight * 0.5);
    const stage = $(".hero-stage");
    const heroTop = Math.min(0, innerHeight - stage.offsetHeight);
    const heroCopy = $(".hero-copy");
    const heroHold = readingDistance([heroCopy], heroCopy.offsetHeight, available);
    openingHold = Math.max(0, -heroTop) + (desktop ? heroHold : 0);
    openingEnd = openingHold + innerHeight * (desktop ? 0.65 : 0.55);
    if (desktop) {
      $(".hero").style.setProperty(
        "--hero-runway",
        `${heroHold + innerHeight * 0.65}px`,
      );
      stage.style.setProperty("--hero-top", `${heroTop}px`);
    }
    // First establish physical holds. Only then sample document coordinates,
    // so a predecessor's runway is included in every following chapter.
    for (const chapter of chapters) {
      const scene = $(chapter.selector);
      let reading = readingBounds(scene, chapter.reading);
      if (reading.bottom - reading.top > available)
        reading = readingBounds(scene, chapter.tail);
      const lower = safeTop - reading.top;
      const upper = innerHeight - reading.bottom;
      const top =
        lower <= upper
          ? Math.min(
              upper,
              Math.max(lower, Math.min(0, innerHeight - scene.offsetHeight)),
            )
          : Math.min(0, innerHeight - scene.offsetHeight);
      const hold = desktop
        ? readingDistance(reading.nodes, reading.bottom - reading.top, available)
        : 0;
      // A scene shorter than the viewport also reserves its remaining ground.
      // Its background may meet B while its final content stays above the seam.
      const runway = desktop
        ? hold + Math.max(0, innerHeight - scene.offsetHeight - top)
        : 0;
      scene.style.setProperty("--scene-top", `${top}px`);
      scene
        .closest<HTMLElement>(".scene-shell")
        ?.style.setProperty("--scene-runway", `${runway}px`);
      phases.set(chapter.selector, {
        enterStart: 0,
        enterEnd: 1,
        fullAt: 0,
        holdStart: 0,
        holdEnd: 1,
        exitStart: 0,
        exitEnd: 1,
        pinStart: 0,
        pinEnd: 0,
        readingTop: reading.top,
        readingBottom: reading.bottom,
        runway,
      });
    }
    for (const chapter of chapters) {
      const scene = $(chapter.selector);
      const p = phases.get(chapter.selector)!;
      const base = anchor(chapter.selector).getBoundingClientRect().top + scrollY;
      const top = parseFloat(scene.style.getPropertyValue("--scene-top"));
      const visual = $(chapter.visual);
      const visualTop =
        visual.getBoundingClientRect().top - scene.getBoundingClientRect().top;
      p.fullAt = Math.max(0, base + p.readingBottom - innerHeight);
      p.pinStart = desktop ? base - top : 0;
      p.pinEnd = desktop ? p.pinStart + p.runway : 0;
      p.holdStart = desktop ? Math.max(p.fullAt, p.pinStart) : p.fullAt;
      const nextEnters = base + scene.offsetHeight + p.runway - innerHeight;
      // On touch layouts the reading window is natural flow: it ends when the
      // first protected line reaches the header, not when B's ground appears.
      p.holdEnd = desktop
        ? Math.min(p.pinEnd, nextEnters)
        : Math.max(p.fullAt, base + p.readingTop - safeTop);
      p.exitStart = p.holdEnd;
      p.exitEnd = p.exitStart + innerHeight * 0.8;
      p.enterStart = Math.max(0, base - innerHeight);
      p.enterEnd = Math.max(
        p.enterStart + 1,
        Math.min(
          p.fullAt,
          base +
            visualTop +
            Math.min(visual.offsetHeight, innerHeight * 0.7) -
            innerHeight * 0.85,
        ),
      );
    }
  }
  const contentTrigger = (selector: string, id: string) => ({
    id,
    trigger: anchor(selector),
    start: () => phases.get(selector)!.enterStart,
    end: () => phases.get(selector)!.enterEnd,
    scrub: true,
    invalidateOnRefresh: true,
  });
  const transitionTrigger = (selector: string, id: string) => ({
    id,
    trigger: anchor(selector),
    start: () => phases.get(selector)!.exitStart,
    end: () => phases.get(selector)!.exitEnd,
    scrub: true,
    invalidateOnRefresh: true,
  });
  measurePhases();

  const context = gsap.context(() => {
    // CSS sticky supplies the physical camera hold. No spacer insertion or
    // unpin/re-pin cycle can move the document during refresh or reversal.
    const opening = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        id: "opening-camera",
        trigger: ".hero",
        start: () => openingHold,
        end: () => openingEnd,
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
    opening
      .to(
        ".hero-media",
        {
          scale: desktop ? 1.23 : 1.09,
          xPercent: desktop ? 6 : 2,
          duration: 1,
        },
        0,
      )
      .to(
        ".hero-title > span:first-child",
        { xPercent: -14, opacity: 0, duration: 0.46 },
        0,
      )
      .to(
        ".hero-title > span:last-child",
        { xPercent: 12, opacity: 0, duration: 0.52 },
        0.03,
      )
      .to(".hero-copy", { opacity: 0, duration: 0.28 }, 0.02)
      .to(".hero-baseline", { opacity: 0, duration: 0.2 }, 0)
      .fromTo(
        ".hero-scroll-word",
        { xPercent: -8, opacity: 0 },
        { xPercent: 0, opacity: 1, duration: 0.28 },
        0.38,
      )
      .to(
        ".hero-scroll-word",
        { xPercent: 9, opacity: 0, duration: 0.28 },
        0.72,
      )
      .to(".hero-media", { opacity: 0.55, duration: 0.5 }, 0.5);

    const thought = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: contentTrigger(".intro", "intro-content"),
    });
    thought
      .fromTo(
        ".statement",
        { xPercent: desktop ? 5 : 2 },
        { xPercent: desktop ? -3 : 0, duration: 1 },
        0,
      )
      .to(
        ".statement > span",
        { color: "#f4f4f0", stagger: 0.12, duration: 0.24 },
        0.05,
      )
      .fromTo(
        ".intro-mark",
        { scaleX: 0.5, transformOrigin: "left" },
        { scaleX: 1, duration: 0.45 },
        0.28,
      );

    // Only the incoming ground folds. This surface is below its own content and
    // confined to its chapter; it cannot mask the outgoing reading window.
    const seams = [
      [".aero", "#08090b"],
      [".energy", "#eeeef0"],
      [".tyres", "#08090b"],
      [".race", "#eeeef0"],
      [".circuits", "#101113"],
    ];
    for (const [selector, ground] of seams) {
      const sheet = document.createElement("div");
      sheet.className = "scene-aperture";
      sheet.setAttribute("aria-hidden", "true");
      sheet.style.background = ground;
      $(selector).prepend(sheet);
      additions.push(sheet);
      gsap.fromTo(
        sheet,
        { scaleY: 1 },
        {
          scaleY: 0,
          ease: "none",
          scrollTrigger: contentTrigger(selector, `seam-${selector.slice(1)}`),
        },
      );
    }

    const machine = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: contentTrigger(".aero", "machine-content"),
    });
    machine
      .fromTo(
        ".aero-car",
        { xPercent: desktop ? 9 : 3, scale: 1.12 },
        { xPercent: 0, scale: 1, duration: 0.42 },
        0,
      )
      .fromTo(
        ".aero .section-heading",
        { clipPath: "inset(0 0 0 13%)", xPercent: -3 },
        { clipPath: "inset(0 0 0 0%)", xPercent: 0, duration: 0.3 },
        0,
      );
    gsap.fromTo(
      ".aero-car",
      { xPercent: 0, scale: 1 },
      {
        xPercent: -4,
        scale: 1.035,
        immediateRender: false,
        ease: "none",
        scrollTrigger: transitionTrigger(".aero", "machine-exit"),
      },
    );

    const energy = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: contentTrigger(".energy", "energy-content"),
    });
    energy
      .fromTo(
        ".energy-visual > img",
        { scale: 0.86, yPercent: 5 },
        { scale: 1, yPercent: 0, duration: 0.45 },
        0,
      )
      .fromTo(
        ".energy-title",
        { xPercent: -12, clipPath: "inset(0 13% 0 0)" },
        { xPercent: 0, clipPath: "inset(0 0% 0 0)", duration: 0.34 },
        0.04,
      );
    gsap.fromTo(
      ".energy-visual > img",
      { scale: 1, yPercent: 0 },
      {
        scale: 1.08,
        yPercent: -3,
        immediateRender: false,
        ease: "none",
        scrollTrigger: transitionTrigger(".energy", "energy-exit"),
      },
    );

    const contact = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: contentTrigger(".tyres", "contact-content"),
    });
    contact
      .fromTo(
        ".tyre-visual > img",
        { scale: 1.13, xPercent: 8 },
        { scale: 1, xPercent: 0, duration: 0.6 },
        0,
      )
      .fromTo(
        ".tyre-content > h2",
        { clipPath: "inset(0 0 0 18%)", xPercent: -4 },
        { clipPath: "inset(0 0 0 0%)", xPercent: 0, duration: 0.36 },
        0.05,
      );
    gsap.fromTo(
      ".tyre-visual > img",
      { scale: 1, xPercent: 0, yPercent: 0 },
      {
        scale: 1.025,
        yPercent: 3,
        immediateRender: false,
        ease: "none",
        scrollTrigger: transitionTrigger(".tyres", "contact-exit"),
      },
    );

    const decision = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: contentTrigger(".race", "decision-content"),
    });
    decision
      .fromTo(
        ".pit-cinema > img",
        { scale: 1.22, xPercent: -4, yPercent: -3 },
        { scale: 1.02, xPercent: 0, yPercent: 3, duration: 1 },
        0,
      )
      .fromTo(
        ".pit-heading h2",
        { xPercent: 9, clipPath: "inset(0 0 0 16%)" },
        { xPercent: 0, clipPath: "inset(0 0 0 0%)", duration: 0.43 },
        0.05,
      );

    const world = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: contentTrigger(".circuits", "world-content"),
    });
    world
      .fromTo(
        ".circuit-copy > h2",
        { xPercent: -8, clipPath: "inset(0 10% 0 0)" },
        { xPercent: 0, clipPath: "inset(0 0% 0 0)", duration: 0.8 },
        0,
      )
      .fromTo(
        ".track-stage",
        { opacity: 0.2 },
        { opacity: 1, duration: 0.4 },
        0.3,
      );

    gsap.fromTo(
      ".closing-line h2",
      { clipPath: "inset(0 100% 0 0)" },
      {
        clipPath: "inset(0 0% 0 0)",
        ease: "none",
        scrollTrigger: {
          id: "world-to-beyond",
          trigger: ".closing",
          start: "top 98%",
          end: "top 65%",
          scrub: true,
        },
      },
    );
  });

  function stickyShift(element: Element) {
    const frame = element.closest<HTMLElement>(".scene-frame");
    return frame
      ? frame.getBoundingClientRect().top -
          frame.parentElement!.getBoundingClientRect().top
      : 0;
  }
  function box(selector: string) {
    const r = $(selector).getBoundingClientRect();
    return {
      x: r.left,
      y: r.top + scrollY - stickyShift($(selector)),
      w: r.width,
      h: r.height,
    };
  }
  function shape(selector: string, point: (t: number) => Point): Cue {
    const b = box(selector);
    return {
      at: b.y + b.h / 2 - innerHeight * 0.56,
      points: Array.from({ length: SAMPLES }, (_, i) => {
        const p = point(i / (SAMPLES - 1));
        return { x: b.x + p.x * b.w, y: b.y + p.y * b.h };
      }),
    };
  }
  function pathShape(selector: string): Cue {
    const path = $<SVGPathElement>(selector);
    const svg = path.ownerSVGElement!;
    const r = svg.getBoundingClientRect();
    const matrix = path.getScreenCTM();
    const length = path.getTotalLength();
    const shift = stickyShift(path);
    return {
      at: r.top + scrollY - shift + r.height / 2 - innerHeight * 0.56,
      points: Array.from({ length: SAMPLES }, (_, i) => {
        // The semantic chart/track paths are populated by initInteractions
        // immediately after motion starts; the next checkpoint replaces this.
        if (!length)
          return {
            x: r.left + (r.width * i) / (SAMPLES - 1),
            y: r.top + scrollY - shift + r.height / 2,
          };
        const p = path.getPointAtLength((length * i) / (SAMPLES - 1));
        const q = matrix ? new DOMPoint(p.x, p.y).matrixTransform(matrix) : p;
        return { x: q.x, y: q.y + scrollY - shift };
      }),
    };
  }
  function measure() {
    measurePhases();
    ribbon.setAttribute("viewBox", `0 0 ${innerWidth} ${innerHeight}`);
    // SVG sampling and all layout reads happen only at geometry checkpoints.
    // The scroll frame interpolates cached points; it never queries a path/box.
    cues = [
      shape(".intro", (t) => ({
        x: 0.08 + t * 0.84,
        y: 0.83 - Math.sin(t * Math.PI) * 0.025,
      })),
      shape(".wind-tunnel", (t) => ({
        x: t,
        y: 0.49 - Math.sin(t * Math.PI) * 0.29,
      })),
      pathShape("#energy-path"),
      shape(".tyre-visual", (t) => ({
        x: 0.76 + Math.cos(t * Math.PI * 2 - Math.PI / 2) * 0.17,
        y: 0.46 + Math.sin(t * Math.PI * 2 - Math.PI / 2) * 0.37,
      })),
      shape(".pit-cinema", (t) => ({ x: 0.1 + t * 0.82, y: 0.98 - t * 0.39 })),
      // A pit-wall datum, not a second (and potentially misleading) data series.
      shape("#strategy-chart", (t) => ({ x: 0.06 + t * 0.88, y: 1.06 })),
      pathShape(".track-outline"),
    ];
    // Mobile composition can put two images close together; retain positive
    // progress intervals rather than letting a zero-sized path divide by zero.
    for (let i = 1; i < cues.length; i++)
      cues[i].at = Math.max(cues[i].at, cues[i - 1].at + 100);
    const owners = [
      ".intro", ".aero", ".energy", ".tyres", ".race", ".race", ".circuits",
    ];
    intervals = cues.slice(0, -1).map((cue, i) => ({
      from: owners[i],
      to: owners[i + 1],
      start:
        owners[i] === owners[i + 1]
          ? cue.at
          : phases.get(owners[i])!.exitStart,
      end:
        owners[i] === owners[i + 1]
          ? cues[i + 1].at
          : phases.get(owners[i + 1])!.enterEnd,
    }));
    previousY = NaN;
  }
  function render(y: number) {
    if (Math.abs(y - previousY) < 0.15 || cues.length < 2) return;
    previousY = y;
    const index = intervals.findIndex(
      (interval) => y >= interval.start && y <= interval.end,
    );
    if (index < 0) {
      ribbon.style.opacity = "0";
      return;
    }
    const a = cues[index],
      b = cues[index + 1];
    const interval = intervals[index];
    const t = clamp((y - interval.start) / (interval.end - interval.start));
    const blend = t * t * (3 - 2 * t);
    const shift = (selector: string) => {
      const p = phases.get(selector)!;
      return desktop ? clamp((y - p.pinStart) / p.runway) * p.runway : 0;
    };
    const fromShift = shift(interval.from);
    const toShift = shift(interval.to);
    const d = a.points
      .map((p, i) => {
        const q = b.points[i];
        return `${i ? "L" : "M"}${(p.x + (q.x - p.x) * blend).toFixed(1)},${(p.y + fromShift + (q.y + toShift - p.y - fromShift) * blend - y).toFixed(1)}`;
      })
      .join(" ");
    line.setAttribute("d", d);
    line.style.strokeDashoffset = String(-blend * 0.72);
    ribbon.style.opacity = String(
      Math.pow(Math.sin(t * Math.PI), 0.7) * (desktop ? 0.38 : 0.22),
    );
  }
  return {
    measure,
    render,
    inspect() {
      return { openingHold, openingEnd, chapters: Object.fromEntries(phases) };
    },
    destroy() {
      context.revert();
      additions.forEach((element) => element.remove());
      for (const { shell, scene } of shells) {
        shell.replaceWith(scene);
        scene.classList.remove("scene-frame");
        scene.style.removeProperty("--scene-top");
      }
      $(".hero").style.removeProperty("--hero-runway");
      $(".hero-stage").style.removeProperty("--hero-top");
      chapters.forEach(({ selector }) =>
        $(selector).style.removeProperty("--scene-top"),
      );
      cues = [];
      intervals = [];
    },
  };
}
