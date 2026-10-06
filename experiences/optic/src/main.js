import "./style.css";
import { createScene } from "./scene.js";
import { createFallback } from "./fallback.js";
import {
  chapters,
  makeTimeline,
  sampleTimeline,
  clamp,
  lerp,
  smooth,
  apertureLight,
  apertureFromProgress,
  focusDistance,
  sensorMagnification,
} from "./story.js";

const root = document.documentElement;
const panels = [...document.querySelectorAll(".scene-panel")];
const sections = [...document.querySelectorAll(".scene-section")];
const rail = document.getElementById("chapter-rail");
const indexLinks = document.getElementById("index-links");
const dialog = document.getElementById("chapter-index");
const photo = document.querySelector("#final-photograph img");
const finalFigure = document.getElementById("final-photograph");
const blackout = document.querySelector(".capture-blackout");
const notice = document.getElementById("renderer-notice");
const focusInput = document.getElementById("focus-distance");
const motionButton = document.getElementById("motion-toggle");
const apertureButtons = [...document.querySelectorAll("[data-aperture]")];
const shutterButtons = [...document.querySelectorAll("[data-shutter]")];
const stabilizeButton = document.getElementById("stabilization-toggle");
const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const parameters = new URLSearchParams(location.search);
const pointer = { x: 0, y: 0 };
const override = { focus: null, aperture: null };
const outputCache = new Map();
let timeline = makeTimeline(innerWidth <= 900);
let width = 0,
  height = 0,
  mobile = false,
  renderPosition = 0,
  targetPosition = 0;
let lastTimestamp = 0,
  elapsed = 0,
  ambient = 0,
  raf = 0,
  resizePending = true,
  renderer = null,
  fallback = null;
let destroyed = false,
  ready = false,
  paused = false,
  reduced = reducedQuery.matches;
let lastActive = -1,
  manualExposure = null,
  shutterDenominator = 125,
  stabilized = true;
let lastRenderKey = "";
let frame = sampleTimeline(timeline, 0);

// An absolute, document-resolved URL also works when the compiled stylesheet
// lives inside assets/ or the whole experience is served from a subdirectory.
root.style.setProperty("--coast-image", `url("${photo.src}")`);
root.style.scrollbarGutter = "stable";
chapters.forEach((chapter, index) => {
  const link = document.createElement("a");
  link.href = `#${chapter.id}`;
  link.setAttribute(
    "aria-label",
    `${String(index + 1).padStart(2, "0")} — ${chapter.name}`,
  );
  link.innerHTML = `<span>${chapter.name}</span>`;
  link.dataset.go = String(index);
  rail.append(link);
  const menuLink = document.createElement("a");
  menuLink.href = `#${chapter.id}`;
  menuLink.dataset.go = String(index);
  menuLink.innerHTML = `<small>${String(index + 1).padStart(2, "0")}</small>${chapter.name}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>`;
  indexLinks.append(menuLink);
});
const railLinks = [...rail.children];
function writeText(id, value) {
  if (outputCache.get(id) !== value) {
    document.getElementById(id).textContent = value;
    outputCache.set(id, value);
  }
}
function closeIndex() {
  if (dialog.open) dialog.close();
  document.body.style.overflow = "";
}
function navigate(index, animated = true) {
  const chapter = timeline.scenes[clamp(index, 0, 8)];
  closeIndex();
  const position =
    index === 0
      ? 0
      : chapter.start + chapter.length * (index === 8 ? 0.55 : 0.42);
  if (!animated || reduced) renderPosition = position;
  window.scrollTo({
    top: position * height,
    behavior: animated && !reduced ? "smooth" : "auto",
  });
  schedule();
}
document.querySelectorAll("[data-go]").forEach((link) =>
  link.addEventListener("click", (event) => {
    event.preventDefault();
    navigate(Number(link.dataset.go));
  }),
);
document.querySelector(".wordmark").addEventListener("click", (event) => {
  event.preventDefault();
  navigate(0);
});
document.getElementById("index-open").addEventListener("click", () => {
  dialog.showModal();
  document.body.style.overflow = "hidden";
});
document.getElementById("index-close").addEventListener("click", closeIndex);
dialog.addEventListener("close", () => {
  document.body.style.overflow = "";
});
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeIndex();
});
focusInput.addEventListener("input", () => {
  override.focus = Number(focusInput.value);
  schedule();
});
apertureButtons.forEach((button) =>
  button.addEventListener("click", () => {
    override.aperture = Number(button.dataset.aperture);
    schedule();
  }),
);
shutterButtons.forEach((button) =>
  button.addEventListener("click", () => {
    shutterDenominator = Number(button.dataset.shutter);
    manualExposure = elapsed;
    schedule();
  }),
);
document.getElementById("release-shutter").addEventListener("click", () => {
  manualExposure = elapsed;
  schedule();
});
stabilizeButton.addEventListener("click", () => {
  stabilized = !stabilized;
  stabilizeButton.setAttribute("aria-checked", String(stabilized));
  stabilizeButton.querySelector("span").textContent = stabilized ? "ON" : "OFF";
  schedule();
});
motionButton.addEventListener("click", () => {
  paused = !paused;
  root.classList.toggle("is-paused", paused);
  motionButton.setAttribute("aria-pressed", String(paused));
  motionButton.setAttribute(
    "aria-label",
    paused ? "Resume ambient motion" : "Pause ambient motion",
  );
  schedule();
});
document.addEventListener("keydown", (event) => {
  const element = event.target;
  if (
    dialog.open ||
    element.closest("input,textarea,select,button,[contenteditable=true]")
  )
    return;
  if (event.key === "ArrowRight") {
    event.preventDefault();
    navigate(Math.min(8, frame.active + 1));
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    navigate(Math.max(0, frame.active - 1));
  }
});
document.addEventListener(
  "pointermove",
  (event) => {
    if (event.pointerType === "mouse") {
      pointer.x = (event.clientX / Math.max(1, width) - 0.5) * 2;
      pointer.y = (event.clientY / Math.max(1, height) - 0.5) * 2;
    }
  },
  { passive: true },
);
document.addEventListener("pointerleave", () => {
  pointer.x = pointer.y = 0;
});

function measure() {
  const previousTotal = timeline.total;
  const previousHeight = height;
  const previousNormalized = previousHeight
    ? clamp(window.scrollY / (previousHeight * previousTotal))
    : 0;
  width = document.documentElement.clientWidth;
  height = window.innerHeight;
  mobile = width <= 900;
  timeline = makeTimeline(mobile);
  root.style.setProperty("--vh", `${height / 100}px`);
  timeline.scenes.forEach((scene, index) => {
    sections[index].style.height = `${scene.length * height}px`;
  });
  if (
    previousHeight &&
    (previousHeight !== height || previousTotal !== timeline.total)
  ) {
    window.scrollTo({
      top: previousNormalized * timeline.total * height,
      behavior: "auto",
    });
    renderPosition = previousNormalized * timeline.total;
  }
  targetPosition = window.scrollY / height;
  if (!ready) renderPosition = targetPosition;
  renderer?.resize(width, height);
  fallback?.resize(width, height);
  lastRenderKey = "";
  resizePending = false;
}

function useFallback(
  reason = "3D is unavailable. The optical study is active.",
) {
  renderer?.dispose();
  renderer = null;
  lastRenderKey = "";
  root.classList.add("is-fallback");
  fallback ??= createFallback(document.getElementById("fallback-stage"), photo);
  fallback.resize(width || innerWidth, height || innerHeight);
  notice.textContent = reason;
  document.querySelectorAll(".optical-labels span").forEach((label) => {
    label.style.opacity = "0";
  });
  root.dataset.renderer = "2d";
  schedule();
}

function controlsFor(sample) {
  const focus = lerp(
    0.5,
    override.focus ?? smooth(0.48, 0.64, sample.locals[2]),
    sample.weights[2],
  );
  const aperture = lerp(
    1.4,
    override.aperture ?? apertureFromProgress(sample.locals[3]),
    sample.weights[3],
  );
  const shutterPhase =
    manualExposure === null
      ? clamp((sample.locals[4] - 0.18) / 0.57)
      : clamp((elapsed - manualExposure) / 3.4);
  return {
    focus,
    aperture,
    shutter: shutterDenominator,
    shutterPhase,
    stabilization: stabilized,
    reduced,
    paused,
  };
}

function updateInterface(sample, controls) {
  const active = sample.active;
  root.dataset.scene = chapters[active].id;
  if (lastActive !== active) {
    if (lastActive === 2 && active !== 2) override.focus = null;
    if (lastActive === 3 && active !== 3) override.aperture = null;
    if (lastActive === 4 && active !== 4) manualExposure = null;
    lastActive = active;
    writeText(
      "chapter-label",
      `${String(active + 1).padStart(2, "0")} — ${chapters[active].name.toUpperCase()}`,
    );
    railLinks.forEach((link, index) => {
      if (index === active) link.setAttribute("aria-current", "step");
      else link.removeAttribute("aria-current");
    });
  }
  panels.forEach((panel, index) => {
    const weight = sample.weights[index];
    // Typography clears before the next voice enters; the mechanism carries the handoff.
    const opacity = reduced
      ? index === active
        ? 1
        : 0
      : smooth(0.5, 0.86, weight);
    panel.style.opacity = String(opacity);
    panel.dataset.visible = String(opacity > 0.002);
    panel.dataset.interactive = String(index === active && opacity > 0.65);
    sections[index].setAttribute("aria-hidden", String(index !== active));
    panel.inert = index !== active || opacity < 0.65;
    railLinks[index].style.setProperty(
      "--chapter-progress",
      String(sample.locals[index]),
    );
  });
  const specs = [
    "50 MM / f1.4",
    "10 ELEMENTS / 8 GROUPS",
    "FOCUS IS GEOMETRY",
    "9 BLADES / f1.4–16",
    "TWO CURTAINS / ONE MOMENT",
    "BAYER CMOS / 36 × 24 MM",
    "SENSOR-SHIFT / FIVE AXES",
    "FORM FOLLOWS LIGHT",
    "50 MM / f8 / ISO 100",
  ];
  writeText("scene-spec", specs[active]);

  if (active === 2 || sample.weights[2] > 0.05) {
    const f = controls.focus;
    focusInput.value = String(f);
    focusInput.setAttribute(
      "aria-valuetext",
      `${focusDistance(f)}${f > 0.99 ? ", infinity" : ""}`,
    );
    writeText("focus-output", focusDistance(f));
    const preview = document.querySelector(".focus-preview");
    preview.style.setProperty("--near-blur", `${(f * 9).toFixed(2)}px`);
    preview.style.setProperty("--far-blur", `${((1 - f) * 12).toFixed(2)}px`);
    preview.style.setProperty("--focus-x", `${lerp(25, 73, f)}%`);
    preview.style.setProperty("--focus-y", `${lerp(75, 35, f)}%`);
  }
  if (active === 3 || sample.weights[3] > 0.05) {
    const f = controls.aperture;
    writeText("aperture-output", String(Number(f.toFixed(1))));
    const light = apertureLight(f) * 100;
    writeText(
      "light-output",
      `${light >= 10 ? Math.round(light) : light.toFixed(1)}%`,
    );
    apertureButtons.forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(Math.abs(Number(button.dataset.aperture) - f) < 0.025),
      ),
    );
    const shutter = 1000 * apertureLight(f);
    writeText("matched-shutter", `1/${Math.round(shutter)} s`);
    const study = document.querySelector(".aperture-study");
    study.style.setProperty("--far-blur", `${((14 * 1.4) / f).toFixed(2)}px`);
    study.style.setProperty("--near-blur", `${((0.7 * 1.4) / f).toFixed(2)}px`);
  }
  if (active === 4) {
    writeText("shutter-output", `1/${controls.shutter}`);
    shutterButtons.forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(Number(button.dataset.shutter) === controls.shutter),
      ),
    );
  }
  if (active === 5 || sample.weights[5] > 0.01) {
    const macro =
      (fallback ? 0 : sensorMagnification(sample.locals[5], reduced)) *
      sample.weights[5];
    const overview = document.querySelector(".sensor-data");
    const detail = document.querySelector(".sensor-macro-data");
    overview.style.opacity = String(1 - smooth(0.12, 0.65, macro));
    overview.setAttribute("aria-hidden", String(macro > 0.5));
    detail.style.opacity = String(smooth(0.35, 0.8, macro));
    detail.setAttribute("aria-hidden", String(macro <= 0.5));
    document.querySelector(".sensor-layer-labels").style.opacity = String(
      1 - smooth(0.15, 0.55, macro),
    );
  }
  if (active === 6) {
    const q = reduced ? 0 : 1;
    root.style.setProperty(
      "--shake-x",
      `${Math.sin(ambient * 2.15) * 4 * q}px`,
    );
    root.style.setProperty(
      "--shake-y",
      `${Math.cos(ambient * 1.79) * 3 * q}px`,
    );
    root.style.setProperty(
      "--shake-r",
      `${Math.sin(ambient * 1.6) * 0.7 * q}deg`,
    );
  }
  const imageWeight = sample.weights[8];
  const imageLocal = sample.locals[8];
  const reveal = reduced
    ? active === 8
      ? 1
      : 0
    : smooth(0.08, 0.4, imageLocal) * imageWeight;
  finalFigure.style.visibility = reveal > 0.001 ? "visible" : "hidden";
  finalFigure.style.opacity = String(smooth(0, 0.22, reveal));
  finalFigure.style.transform = `translate(-50%,-50%) scale(${lerp(0.18, 1, smooth(0, 1, reveal))})`;
  finalFigure.querySelector("figcaption").style.opacity = String(
    smooth(0.85, 1, reveal),
  );
  const darkPulse = reduced
    ? 0
    : smooth(0.02, 0.08, imageLocal) *
      (1 - smooth(0.1, 0.17, imageLocal)) *
      imageWeight;
  blackout.style.opacity = String(darkPulse);
}

function tick(timestamp) {
  raf = 0;
  if (destroyed || document.hidden) return;
  const dt = lastTimestamp
    ? Math.min((timestamp - lastTimestamp) / 1000, 0.05)
    : 0;
  lastTimestamp = timestamp;
  elapsed += dt;
  if (!paused && !reduced && !dialog.open) ambient += dt;
  if (resizePending) measure();
  targetPosition = clamp(window.scrollY / height, 0, timeline.total);
  // Native scroll remains authoritative; this one display clock only damps the camera.
  const gap = targetPosition - renderPosition;
  if (reduced || !ready || Math.abs(gap) > timeline.total * 0.5)
    renderPosition = targetPosition;
  else renderPosition += gap * (1 - Math.exp(-dt * 11));
  if (Math.abs(targetPosition - renderPosition) < 0.00002)
    renderPosition = targetPosition;
  frame = sampleTimeline(timeline, renderPosition);
  if (reduced) {
    frame.weights.fill(0);
    frame.weights[frame.active] = 1;
    frame.from = frame.to = frame.active;
    frame.mix = 0;
  }
  const controls = controlsFor(frame);
  updateInterface(frame, controls);
  // The photo is a stable final composition. Stop submitting WebGL frames once hidden.
  const photoSettled = frame.active === 8 && frame.local > 0.42;
  document.querySelector(".optical-labels").style.visibility = photoSettled
    ? "hidden"
    : "";
  const renderKey = [
    frame.u.toFixed(5),
    controls.focus.toFixed(4),
    controls.aperture.toFixed(3),
    controls.shutter,
    controls.shutterPhase.toFixed(4),
    controls.stabilization,
    width,
    height,
    pointer.x.toFixed(3),
    pointer.y.toFixed(3),
    paused,
    reduced,
  ].join("|");
  const livingMotion = !paused && !reduced && !dialog.open;
  if (!photoSettled && (livingMotion || renderKey !== lastRenderKey)) {
    renderer?.render(frame, controls, ambient, pointer);
    fallback?.render(frame, controls, ambient);
    lastRenderKey = renderKey;
  }
  document.getElementById("stage").style.visibility = photoSettled
    ? "hidden"
    : "";
  document.getElementById("fallback-stage").style.visibility = photoSettled
    ? "hidden"
    : "";
  if (import.meta.env.DEV && window.__OPTIC_DEBUG__) {
    window.__OPTIC_DEBUG__.frame = frame;
    window.__OPTIC_DEBUG__.controls = controls;
  }
  schedule();
}
function schedule() {
  if (!raf && !destroyed && !document.hidden) raf = requestAnimationFrame(tick);
}
function visibility() {
  if (document.hidden) {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    lastTimestamp = 0;
  } else {
    lastTimestamp = 0;
    targetPosition = window.scrollY / (height || innerHeight);
    renderPosition = targetPosition;
    resizePending = true;
    schedule();
  }
}
window.addEventListener("scroll", schedule, { passive: true });
window.addEventListener(
  "resize",
  () => {
    resizePending = true;
    schedule();
  },
  { passive: true },
);
document.addEventListener("visibilitychange", visibility);
reducedQuery.addEventListener("change", (event) => {
  reduced = event.matches;
  lastTimestamp = 0;
  schedule();
});
window.addEventListener("pageshow", () => {
  lastTimestamp = 0;
  resizePending = true;
  renderPosition = window.scrollY / (height || innerHeight);
  schedule();
});
window.addEventListener("pagehide", (event) => {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  if (!event.persisted) {
    destroyed = true;
    renderer?.dispose();
    fallback?.dispose();
  }
});

measure();
schedule();
async function initialize() {
  try {
    await photo.decode();
  } catch {
    notice.textContent = "The photograph could not load. Reload to retry.";
  }
  if (destroyed) return;
  try {
    if (parameters.get("view") === "2d") useFallback("Optical study · 2D mode");
    else {
      renderer = createScene(document.getElementById("stage"), photo, () =>
        useFallback("3D paused. The optical study remains available."),
      );
      renderer.resize(width, height);
      root.dataset.renderer = "webgl";
    }
  } catch (error) {
    console.warn(
      "OPTIC: WebGL unavailable; using the optical study.",
      error.message,
    );
    useFallback();
  }
  lastRenderKey = "";
  ready = true;
  root.classList.add("is-ready");
  const initialChapter = chapters.findIndex(
    (chapter) => `#${chapter.id}` === location.hash,
  );
  if (initialChapter > 0 && window.scrollY < 5) navigate(initialChapter, false);
  renderPosition = window.scrollY / height;
  if (import.meta.env.DEV) {
    window.__OPTIC_DEBUG__ = {
      get renderer() {
        return renderer;
      },
      get timeline() {
        return timeline;
      },
      frame,
      controls: controlsFor(frame),
      navigate,
      stats: () => renderer?.stats() || { webgl: false },
      forceContextLoss: () =>
        renderer?.renderer
          .getContext()
          .getExtension("WEBGL_lose_context")
          ?.loseContext(),
    };
  }
  schedule();
}
initialize();
