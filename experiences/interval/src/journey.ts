import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scenes } from "./scenes";
import {
  apertureClip,
  clamp,
  doorwayCamera,
  imageCover,
  mapRect,
  mix,
  range,
  smooth,
  transformedRect,
  type Camera,
} from "./geometry";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

interface View {
  section: HTMLElement;
  media: HTMLElement;
  camera: HTMLElement;
  breath: HTMLElement;
  light: HTMLElement;
  caption: HTMLElement;
  image: HTMLImageElement;
  drawing: SVGElement | null;
  paths: SVGPathElement[];
}

/** One playhead owns every scene. Rendering has no direction-dependent callbacks. */
export class SpatialJourney {
  readonly runway = document.querySelector<HTMLElement>(".journey")!;
  readonly stage = document.querySelector<HTMLElement>(".stage")!;
  readonly opening = document.querySelector<HTMLElement>(".opening")!;
  readonly intro = document.querySelector<HTMLElement>(".intro-caption")!;
  readonly navigation = document.querySelector<HTMLElement>(".journey-nav")!;
  readonly progressLine = document.querySelector<HTMLElement>(
    ".journey-progress>div",
  )!;
  readonly views: View[];
  readonly lenis: Lenis;
  readonly timeline: gsap.core.Timeline;
  readonly trigger: ScrollTrigger;
  readonly playhead = { position: 0 };
  currentScene = 0;
  private width = 0;
  private height = 0;
  private gutter = 0;
  private header = 0;
  private caption = 0;
  private titleBottom = 0;
  private mobile = false;
  private previousTime = 0;
  private ambientTime = 0;
  private paused = false;
  private destroyed = false;
  private pendingLabel: string | null = null;
  private resizeTimer: ReturnType<typeof setTimeout> | undefined;
  private announced = -1;
  private currentPair = "";
  private cached = new WeakMap<Element, Map<string, string>>();

  constructor(private readonly onScene: (index: number) => void) {
    this.views = [...document.querySelectorAll<HTMLElement>(".scene")].map(
      (section) => ({
        section,
        media: section.querySelector<HTMLElement>(".scene-media")!,
        camera: section.querySelector<HTMLElement>(".camera")!,
        breath: section.querySelector<HTMLElement>(".breath")!,
        light: section.querySelector<HTMLElement>(".ambient-light")!,
        caption: section.querySelector<HTMLElement>(".scene-caption")!,
        image: section.querySelector<HTMLImageElement>(".architecture-image")!,
        drawing: section.querySelector<SVGElement>(".structure-drawing"),
        paths: [
          ...section.querySelectorAll<SVGPathElement>(".trace-lines path"),
        ],
      }),
    );
    this.measure();
    this.lenis = new Lenis({
      autoRaf: false,
      smoothWheel: true,
      syncTouch: false,
      lerp: 0.14,
      wheelMultiplier: 1,
    });
    this.lenis.on("scroll", this.updateScroll);
    this.timeline = gsap.timeline({ paused: true });
    this.timeline.to(this.playhead, {
      position: scenes.length,
      duration: scenes.length,
      ease: "none",
    });
    this.timeline.addLabel("origin", 0);
    scenes.forEach((scene, i) =>
      this.timeline.addLabel(`${scene.id}:stable`, i === 0 ? 0.26 : i + 0.12),
    );
    this.trigger = ScrollTrigger.create({
      trigger: this.runway,
      start: "top top",
      end: "bottom bottom",
      animation: this.timeline,
      scrub: true,
      invalidateOnRefresh: true,
    });
    gsap.ticker.lagSmoothing(0);
    gsap.ticker.add(this.tick);
    window.addEventListener("resize", this.onResize, { passive: true });
    window.addEventListener("pageshow", this.onPageShow);
    window.addEventListener("wheel", this.cancelNavigation, { passive: true });
    window.addEventListener("touchstart", this.cancelNavigation, {
      passive: true,
    });
    window.addEventListener("pointerdown", this.cancelNavigation, {
      passive: true,
    });
    window.addEventListener("keydown", this.onNavigationKey);
    document.addEventListener("visibilitychange", this.onVisibility);
    this.render();
  }

  private write(
    element: HTMLElement | SVGElement,
    property: string,
    value: string,
  ) {
    let record = this.cached.get(element);
    if (!record) {
      record = new Map();
      this.cached.set(element, record);
    }
    if (record.get(property) === value) return;
    element.style.setProperty(property, value);
    record.set(property, value);
  }

  private measure() {
    this.width = this.stage.clientWidth;
    this.height = this.stage.clientHeight;
    this.mobile = this.width <= 700;
    this.gutter =
      parseFloat(getComputedStyle(this.views[0]!.media).left) ||
      (this.mobile ? 20 : this.width * 0.0265);
    this.header = document
      .querySelector<HTMLElement>(".site-header")!
      .getBoundingClientRect().height;
    this.titleBottom =
      this.opening.querySelector("h1")!.getBoundingClientRect().height +
      parseFloat(getComputedStyle(this.opening).paddingTop);
    // Measure the tallest real caption, after fonts and at the current breakpoint.
    this.caption = Math.max(
      ...this.views.map(
        (view) =>
          view.caption.getBoundingClientRect().height +
          (parseFloat(getComputedStyle(view.caption).bottom) || 0),
      ),
    );
    const distance = this.height * (this.mobile ? 8.25 : 10.6);
    this.runway.style.setProperty("--runway", `${distance.toFixed(2)}px`);
    this.views.forEach((view, i) => {
      view.section.style.setProperty("--focus", `${scenes[i]!.focus * 100}%`);
      view.image.style.objectPosition = `${this.mobile ? scenes[i]!.focus * 100 : 50}% 50%`;
    });
  }

  private updateScroll = () => ScrollTrigger.update();

  private tick = (seconds: number) => {
    if (this.destroyed || document.hidden) {
      this.previousTime = 0;
      return;
    }
    if (this.paused) {
      this.previousTime = seconds;
      return;
    }
    this.lenis.raf(seconds * 1000);
    if (this.previousTime)
      this.ambientTime += Math.min(
        0.04,
        Math.max(0, seconds - this.previousTime),
      );
    this.previousTime = seconds;
    this.render();
  };

  private transform(view: View, camera: Camera) {
    this.write(
      view.camera,
      "transform",
      `matrix(${camera.scale.toFixed(6)},0,0,${camera.scale.toFixed(6)},${camera.x.toFixed(3)},${camera.y.toFixed(3)})`,
    );
  }

  private render() {
    const position = clamp(this.playhead.position, 0, scenes.length - 0.000001);
    const index = Math.floor(position);
    const local = position - index;
    const hasNext = index < scenes.length - 1;
    const handoff = hasNext ? range(local, 0.65, 1) : 0;
    const entrance = smooth(range(position, 0, 0.205));
    const heroTop = this.mobile
      ? Math.max(this.header + 83, this.height * 0.222)
      : Math.max(this.titleBottom - 4, this.height * 0.3);
    const heroBottom = this.mobile
      ? 151
      : this.height <= 590
        ? 76
        : this.width >= 2000
          ? this.height * 0.113
          : 110;
    const imageTop = mix(
      heroTop,
      this.header + (this.mobile ? 2 : 3),
      entrance,
    );
    const imageBottom = mix(
      heroBottom,
      this.caption + (this.mobile ? 0 : 1),
      entrance,
    );
    const width = this.width - this.gutter * 2;
    const height = Math.max(130, this.height - imageTop - imageBottom);
    this.write(this.stage, "--image-top", `${imageTop.toFixed(3)}px`);
    this.write(this.stage, "--image-bottom", `${imageBottom.toFixed(3)}px`);
    this.write(
      this.opening,
      "opacity",
      (1 - smooth(range(position, 0.025, 0.16))).toFixed(4),
    );
    this.write(
      this.opening,
      "transform",
      `translate3d(0,${(-this.height * 0.17 * entrance).toFixed(2)}px,0)`,
    );
    this.write(
      this.intro,
      "opacity",
      (1 - smooth(range(position, 0.035, 0.15))).toFixed(4),
    );
    this.write(
      this.intro,
      "visibility",
      position < 0.15 ? "visible" : "hidden",
    );
    this.intro.inert = position >= 0.13;
    this.write(this.intro, "pointer-events", position < 0.13 ? "auto" : "none");
    this.write(
      this.navigation,
      "opacity",
      smooth(range(position, 0.135, 0.22)).toFixed(4),
    );
    this.write(
      this.navigation,
      "visibility",
      position > 0.135 ? "visible" : "hidden",
    );
    this.write(
      this.navigation,
      "pointer-events",
      position >= 0.22 ? "auto" : "none",
    );
    this.navigation.inert = position < 0.22;
    this.write(
      this.progressLine,
      "transform",
      `scaleX(${(this.playhead.position / scenes.length).toFixed(6)})`,
    );

    const nextIndex = hasNext && handoff > 0 ? index + 1 : -1;
    const pair = `${index}:${nextIndex}`;
    if (pair !== this.currentPair) {
      this.currentPair = pair;
      this.views.forEach((view, i) => {
        const active = i === index || i === nextIndex;
        view.section.style.visibility = active ? "visible" : "hidden";
        view.media.style.willChange = active ? "clip-path, opacity" : "auto";
        view.camera.style.willChange = active ? "transform" : "auto";
        view.breath.style.willChange = active ? "transform" : "auto";
        if (active) {
          view.image.loading = "eager";
        } else {
          this.write(view.caption, "opacity", "0");
          view.section.setAttribute("aria-hidden", "true");
          view.section.inert = true;
        }
      });
    }

    const view = this.views[index]!;
    const scene = scenes[index]!;
    const cover = imageCover(
      width,
      height,
      scene.ratio,
      this.mobile ? scene.focus : 0.5,
    );
    const portal = mapRect(scene.portal, cover);
    const cx = (portal[0] + portal[2]) / 2;
    const cy = (portal[1] + portal[3]) / 2;
    const hold = smooth(range(local, 0, 0.65));
    const baseScale = 1 + (this.mobile ? 0.027 : 0.038) * hold;
    let camera: Camera = {
      scale: baseScale,
      x: cx * (1 - baseScale),
      y: cy * (1 - baseScale),
    };
    let nextClip = "inset(0px)";
    let nextOpacity = 0;

    if (handoff > 0) {
      if (scene.transition === "door") {
        camera = doorwayCamera(
          portal,
          width,
          height,
          handoff,
          1 + (this.mobile ? 0.027 : 0.038),
        );
        nextClip = apertureClip(transformedRect(portal, camera), width, height);
        nextOpacity = smooth(range(handoff, 0, 0.13));
      } else {
        const move = smooth(handoff);
        const scale = mix(baseScale, 1.1, move);
        const initialX = cx * (1 - scale);
        const travel = portal[2] * scale + initialX + width * 0.045;
        camera = {
          scale,
          x: initialX - travel * move,
          y: cy * (1 - scale) - height * 0.012 * move,
        };
        const boundary = portal[2] * scale + camera.x;
        nextClip = `inset(0px 0px 0px ${clamp(boundary, 0, width).toFixed(3)}px)`;
        nextOpacity = smooth(range(handoff, 0, 0.2));
      }
    }

    this.transform(view, camera);
    this.write(view.media, "clip-path", "inset(0px)");
    this.write(view.media, "opacity", "1");
    const captionOpacity =
      (index === 0 ? smooth(range(position, 0.165, 0.245)) : 1) *
      (1 - smooth(range(handoff, 0, 0.22)));
    this.write(view.caption, "opacity", captionOpacity.toFixed(4));
    this.write(
      view.caption,
      "transform",
      `translate3d(0,${(-5 * smooth(handoff)).toFixed(2)}px,0)`,
    );
    this.ambient(view, index, local, handoff, cover);

    if (nextIndex >= 0) {
      const next = this.views[nextIndex]!;
      const nextScene = scenes[nextIndex]!;
      const nextCover = imageCover(
        width,
        height,
        nextScene.ratio,
        this.mobile ? nextScene.focus : 0.5,
      );
      const nextPortal = mapRect(nextScene.portal, nextCover);
      const scale = mix(1.05, 1, smooth(handoff));
      this.transform(next, {
        scale,
        x: ((nextPortal[0] + nextPortal[2]) / 2) * (1 - scale),
        y: ((nextPortal[1] + nextPortal[3]) / 2) * (1 - scale),
      });
      this.write(next.media, "clip-path", nextClip);
      this.write(next.media, "opacity", nextOpacity.toFixed(4));
      this.write(
        next.caption,
        "opacity",
        smooth(range(handoff, 0.86, 1)).toFixed(4),
      );
      this.write(next.caption, "transform", "translate3d(0,0,0)");
      this.ambient(next, nextIndex, 0, 0, nextCover);
    }

    this.currentScene = handoff > 0.88 ? index + 1 : index;
    if (this.currentScene !== this.announced) {
      this.announced = this.currentScene;
      this.onScene(this.currentScene);
      this.views.forEach((item, i) => {
        item.section.setAttribute(
          "aria-hidden",
          i === this.currentScene ? "false" : "true",
        );
        item.section.inert = i !== this.currentScene;
      });
    }
  }

  private ambient(
    view: View,
    index: number,
    local: number,
    handoff: number,
    cover: { width: number; height: number; left: number; top: number },
  ) {
    // Paint the complete cover-sized image. Cropping the img itself to the viewport
    // would discard the lateral overscan needed when a foreground column passes.
    this.write(view.image, "width", `${cover.width.toFixed(3)}px`);
    this.write(view.image, "height", `${cover.height.toFixed(3)}px`);
    this.write(view.image, "left", `${cover.left.toFixed(3)}px`);
    this.write(view.image, "top", `${cover.top.toFixed(3)}px`);
    const calm = 1 - smooth(range(handoff, 0, 0.2));
    const drift = Math.sin(this.ambientTime * 0.13 + index * 0.9);
    // The image breathes on a separate layer; scroll transforms never compete with it.
    this.write(
      view.breath,
      "transform",
      `translate3d(${(drift * 0.45 * calm).toFixed(3)}px,${(Math.sin(this.ambientTime * 0.09) * 0.25 * calm).toFixed(3)}px,0) scale(${(1.002 + 0.0005 * Math.sin(this.ambientTime * 0.12) * calm).toFixed(6)})`,
    );
    this.write(
      view.light,
      "opacity",
      (
        (0.04 + 0.018 * Math.sin(this.ambientTime * 0.16 + index)) *
        calm
      ).toFixed(4),
    );
    this.write(
      view.light,
      "transform",
      `translate3d(${(drift * 17 + local * 25).toFixed(2)}px,${(local * 11).toFixed(2)}px,0)`,
    );
    if (view.drawing) {
      const draw = smooth(range(local, 0.15, 0.56));
      this.write(view.drawing, "width", `${cover.width.toFixed(3)}px`);
      this.write(view.drawing, "height", `${cover.height.toFixed(3)}px`);
      this.write(view.drawing, "left", `${cover.left.toFixed(3)}px`);
      this.write(view.drawing, "top", `${cover.top.toFixed(3)}px`);
      this.write(
        view.drawing,
        "opacity",
        (draw * 0.75 * (1 - smooth(range(handoff, 0, 0.35)))).toFixed(4),
      );
      view.paths.forEach((path, i) =>
        this.write(
          path,
          "stroke-dashoffset",
          (1 - smooth(range(draw, i * 0.045, 0.68 + i * 0.045))).toFixed(4),
        ),
      );
    }
  }

  private navigateTo(label: string, immediate = false, duration = 1.35) {
    // Lenis updates targetScroll on every frame of a programmatic scroll. Keep
    // the semantic destination ourselves so a font/resize refresh can resume it.
    this.pendingLabel = immediate ? null : label;
    this.lenis.scrollTo(this.trigger.labelToScroll(label), {
      immediate,
      duration,
      force: true,
      lock: false,
      onComplete: () => {
        if (this.pendingLabel === label) this.pendingLabel = null;
      },
    });
    if (immediate) {
      this.trigger.update();
      this.render();
    }
  }

  goTo(index: number, immediate = false) {
    this.navigateTo(
      index === 0 ? "origin" : `${scenes[index]!.id}:stable`,
      immediate,
    );
  }

  enter() {
    this.navigateTo("threshold:stable");
  }

  refresh() {
    if (this.destroyed) return;
    const pendingLabel = this.pendingLabel;
    const position = this.playhead.position / scenes.length;
    const target = clamp(
      (this.lenis.targetScroll - this.trigger.start) /
        Math.max(1, this.trigger.end - this.trigger.start),
    );
    const stillMoving = Math.abs(target - position) > 0.0005;
    this.measure();
    this.lenis.resize();
    ScrollTrigger.refresh();
    this.lenis.scrollTo(
      this.trigger.start + position * (this.trigger.end - this.trigger.start),
      { immediate: true, force: true },
    );
    if (pendingLabel && !this.paused) {
      this.navigateTo(pendingLabel, false, 0.75);
    } else if (stillMoving && !this.paused) {
      this.lenis.scrollTo(
        this.trigger.start + target * (this.trigger.end - this.trigger.start),
        { duration: 0.75, force: true },
      );
    }
    this.trigger.update();
    this.render();
  }

  pause() {
    this.pendingLabel = null;
    this.paused = true;
    this.lenis.stop();
  }
  resume() {
    if (this.destroyed) return;
    this.paused = false;
    this.previousTime = 0;
    this.lenis.start();
    this.lenis.scrollTo(window.scrollY, { immediate: true, force: true });
  }

  private onResize = () => {
    clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => this.refresh(), 130);
  };
  private cancelNavigation = () => {
    this.pendingLabel = null;
  };
  private onNavigationKey = (event: KeyboardEvent) => {
    if (
      [
        "ArrowUp",
        "ArrowDown",
        "PageUp",
        "PageDown",
        "Home",
        "End",
        " ",
      ].includes(event.key)
    )
      this.cancelNavigation();
  };
  private onVisibility = () => {
    this.previousTime = 0;
    if (!document.hidden) {
      this.lenis.resize();
      this.lenis.scrollTo(window.scrollY, { immediate: true, force: true });
      if (this.pendingLabel && !this.paused)
        this.navigateTo(this.pendingLabel, false, 0.75);
      this.trigger.update();
      this.render();
    }
  };
  private onPageShow = () => {
    this.lenis.resize();
    ScrollTrigger.refresh();
    this.trigger.update();
    this.render();
  };

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    clearTimeout(this.resizeTimer);
    gsap.ticker.remove(this.tick);
    this.lenis.off("scroll", this.updateScroll);
    this.trigger.kill();
    this.timeline.kill();
    this.lenis.destroy();
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pageshow", this.onPageShow);
    window.removeEventListener("wheel", this.cancelNavigation);
    window.removeEventListener("touchstart", this.cancelNavigation);
    window.removeEventListener("pointerdown", this.cancelNavigation);
    window.removeEventListener("keydown", this.onNavigationKey);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.runway.style.removeProperty("--runway");
  }
}
