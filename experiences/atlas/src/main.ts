import "./style.css";
import "lenis/dist/lenis.css";
import Lenis from "lenis";
import * as THREE from "three";
import {
  Geography,
  RasterMeta,
  clamp,
  mix,
  readGrid,
  readJSON,
  registeredDetail,
  smooth,
} from "./geo";
import { CHAPTERS, evaluateStory, type StoryState } from "./story";
import { TerrainLayer } from "./world/terrain";
import { MapLayer } from "./world/map";
import type { CityLayer } from "./world/city";
import type { GlobeLayer } from "./world/globe";

const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const base = import.meta.env.BASE_URL,
  dataBase = base + "atlas/data/";
const root = $("experience"),
  dialog = $<HTMLDialogElement>("index");
const opening = $("opening"),
  anchor = $("anchor"),
  sceneCopy = $("scene-copy"),
  title = $("scene-title"),
  italic = $("scene-italic"),
  note = $("scene-note"),
  status = $("load-status");
const prefersQuiet = matchMedia("(prefers-reduced-motion: reduce)");
let quiet = prefersQuiet.matches;
try {
  const saved = localStorage.getItem("atlas:quiet");
  if (saved !== null) quiet = saved === "true";
} catch {}
let wheelDirection = 0;
const lenis = new Lenis({
  lerp: 0.105,
  smoothWheel: !quiet,
  syncTouch: false,
  autoRaf: false,
  respectReducedMotion: false,
  prevent: (node) => Boolean(node.closest("dialog")),
  virtualScroll: ({ deltaY, event }) => {
    if (event.type !== "wheel" || event.ctrlKey || !deltaY) return true;
    const direction = Math.sign(deltaY);
    if (wheelDirection && direction !== wheelDirection && lenis.isScrolling === "smooth") {
      lenis.scrollTo(lenis.animatedScroll, { immediate: true });
    }
    wheelDirection = direction;
    return true;
  },
});
let scrollClock = 0;
let renderer: THREE.WebGLRenderer | undefined,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera;
let terrain: TerrainLayer | undefined,
  map: MapLayer | undefined,
  city: CityLayer | undefined,
  globe: GlobeLayer | undefined,
  geo: Geography;
let width = innerWidth,
  height = innerHeight,
  mobile = width <= 760;
const compactData = mobile;
let raf = 0,
  time = 0,
  lastTime = 0,
  lastP = 0,
  lastChapter = -1,
  lastStore = 0,
  ready = false,
  disposed = false;
let renderDirty = true,
  lastRenderedProgress = -1;
let dialogOpener: HTMLElement | undefined;
const pending = new Map<string, Promise<void>>();
const loaded = new Set<string>();
const failed = new Map<string, string>();
const reusableColour = new THREE.Color(),
  paper = new THREE.Color("#eeede6"),
  nightPaper = new THREE.Color("#111d1e");
const target = new THREE.Vector3(),
  projected = new THREE.Vector3(),
  anchorWorld = new THREE.Vector3();
const currentPose = { x: 0, y: 0, z: 0, span: 42, pitch: 0, yaw: 0 };
const cameraRoute: THREE.Vector3[] = [],
  cameraRouteDistances: number[] = [];
const routeCameraPoint = new THREE.Vector3();

function getProgress() {
  return clamp(
    scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight),
  );
}
function jump(p: number, smoothScroll = false) {
  lenis.resize();
  lenis.scrollTo(
    clamp(p) * Math.max(1, document.documentElement.scrollHeight - innerHeight),
    { immediate: !smoothScroll || quiet, force: true },
  );
  lastP = getProgress();
}
function remember() {
  try {
    sessionStorage.setItem("atlas:progress", String(getProgress()));
  } catch {}
}
function safeError(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The local data file could not be read.";
}
function showFailure(message: string) {
  $("failure").hidden = false;
  $("failure-message").textContent = message;
  root.style.setProperty("--ink", "#29312d");
  root.style.setProperty("--muted", "#66716a");
  status.textContent = "";
}

const icon =
  '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 10h13M11 5l5 5-5 5"/></svg>';
$("chapter-list").innerHTML = CHAPTERS.map(
  (c, i) =>
    `<a href="#${c.id}" data-chapter="${i}"><span>${String(i + 1).padStart(2, "0")}</span><span>${c.name}</span>${icon}</a>`,
).join("");
function setDialogView(view: "index" | "credits") {
  $("index-view").hidden = view !== "index";
  $("credits-view").hidden = view !== "credits";
  dialog.dataset.view = view;
  dialog.setAttribute(
    "aria-label",
    view === "credits" ? "Sources and field notes" : "Choose an observation",
  );
  dialog.scrollTop = 0;
}
function openDialog(view: "index" | "credits", opener: HTMLElement) {
  dialogOpener = opener;
  setDialogView(view);
  if (!dialog.open) {
    lenis.stop();
    dialog.showModal();
    document.body.style.overflow = "hidden";
  }
}
function closeDialog() {
  dialog.close();
  lenis.start();
  document.body.style.overflow = "";
  dialogOpener?.focus({ preventScroll: true });
}
dialog.addEventListener("cancel", () => {
  lenis.start();
  document.body.style.overflow = "";
});
dialog.addEventListener("close", () => {
  lenis.start();
  document.body.style.overflow = "";
});
$("open-index").addEventListener("click", (e) =>
  openDialog("index", e.currentTarget as HTMLElement),
);
$("open-sources").addEventListener("click", (e) =>
  openDialog("credits", e.currentTarget as HTMLElement),
);
$("dialog-sources").addEventListener("click", () => setDialogView("credits"));
$("back-index").addEventListener("click", () => setDialogView("index"));
$("close-dialog").addEventListener("click", closeDialog);
$("skip-link").addEventListener("click", (e) => {
  e.preventDefault();
  openDialog("index", e.currentTarget as HTMLElement);
});
$("fallback-index").addEventListener("click", (e) => {
  e.preventDefault();
  openDialog("credits", e.currentTarget as HTMLElement);
});
$("retry-load").addEventListener("click", () => location.reload());
function setQuiet(value: boolean) {
  quiet = value;
  lenis.options.smoothWheel = !quiet;
  lenis.scrollTo(scrollY, { immediate: true, force: true });
  renderDirty = true;
  $("motion-toggle").setAttribute("aria-pressed", String(quiet));
  $("motion-label").textContent = quiet ? "QUIET MOTION ON" : "QUIET MOTION";
  try {
    localStorage.setItem("atlas:quiet", String(quiet));
  } catch {}
}
setQuiet(quiet);
$("motion-toggle").addEventListener("click", () => setQuiet(!quiet));
prefersQuiet.addEventListener("change", (e) => setQuiet(e.matches));
function returnStart() {
  if (dialog.open) closeDialog();
  history.replaceState(null, "", "#coordinate");
  jump(0, true);
}
$("return-start").addEventListener("click", returnStart);
document
  .querySelectorAll<HTMLAnchorElement>(".brand,.dialog-brand")
  .forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      returnStart();
    }),
  );
$("chapter-list").addEventListener("click", (e) => {
  const link = (e.target as Element).closest<HTMLAnchorElement>(
    "[data-chapter]",
  );
  if (!link) return;
  e.preventDefault();
  const chapter = CHAPTERS[Number(link.dataset.chapter)];
  closeDialog();
  history.replaceState(null, "", "#" + chapter.id);
  jump(chapter.position, true);
});
addEventListener("keydown", (e) => {
  if (dialog.open || e.ctrlKey || e.metaKey || e.altKey) return;
  if ((e.target as Element)?.matches("input,textarea,select,button,a")) return;
  if (e.key === "i" || e.key === "I") {
    e.preventDefault();
    openDialog("index", $("open-index"));
  }
  if (e.key === "Home") {
    e.preventDefault();
    jump(0);
  }
  if (e.key === "End") {
    e.preventDefault();
    jump(1);
  }
});

type Label = {
  element: HTMLElement;
  lon: number;
  lat: number;
  begin: number;
  end: number;
  minimum: number;
  peak?: boolean;
  offset?: [number, number];
  world?: THREE.Vector3;
};
const labels: Label[] = [];
function addLabel(
  lon: number,
  lat: number,
  name: string,
  description: string,
  begin: number,
  end: number,
  minimum = 760,
  kind = "",
  offset?: [number, number],
) {
  const element = document.createElement("div");
  element.className = "map-label " + kind;
  const strong = document.createElement("strong");
  strong.textContent = name;
  element.append(strong);
  if (description) {
    const sub = document.createElement("span");
    sub.textContent = description;
    element.append(sub);
  }
  $("map-labels").append(element);
  labels.push({
    element,
    lon,
    lat,
    begin,
    end,
    minimum,
    peak: kind === "peak",
    offset,
  });
  return labels.at(-1)!;
}
addLabel(
  138.7274,
  35.3606,
  "FUJI SAN",
  "3,776 M · REFERENCE",
  0.145,
  0.6,
  0,
  "peak",
  [17, -20],
);
addLabel(138.7506, 35.513, "LAKE KAWAGUCHI", "", 0.175, 0.58, 0, "", [0, -8]);
addLabel(138.8733, 35.4144, "LAKE YAMANAKA", "", 0.175, 0.58, 850);
addLabel(138.755, 35.48, "FUJI FIVE LAKES", "", 0.2, 0.6, 1300, "minor");
addLabel(138.829, 35.456, "KATSURA RIVER", "", 0.44, 0.59, 700, "minor");

async function prepareCameraRoute() {
  const size = compactData ? 129 : 257;
  const [meta, heights, route] = await Promise.all([
    readJSON<RasterMeta>(dataBase + "city-raster.json"),
    readGrid(dataBase + `city-elevation-${size}.bin`, size),
    readJSON<{ features: { geometry: { coordinates: [number, number][] } }[] }>(
      dataBase + "vectors/route.geojson",
    ),
  ]);
  const detail = registeredDetail(geo, new Geography(meta, heights, size));
  for (const [lon, lat] of route.features[0].geometry.coordinates) {
    cameraRoute.push(geo.project(lon, lat, detail.height(lon, lat)));
  }
  cameraRouteDistances.push(0);
  for (let i = 1; i < cameraRoute.length; i++)
    cameraRouteDistances.push(
      cameraRouteDistances[i - 1] +
        cameraRoute[i].distanceTo(cameraRoute[i - 1]),
    );
}
function cameraRouteAt(t: number) {
  const d = clamp(t) * cameraRouteDistances.at(-1)!;
  let i = 1;
  while (i < cameraRoute.length - 1 && cameraRouteDistances[i] < d) i++;
  return routeCameraPoint
    .copy(cameraRoute[i - 1])
    .lerp(
      cameraRoute[i],
      (d - cameraRouteDistances[i - 1]) /
        Math.max(1e-9, cameraRouteDistances[i] - cameraRouteDistances[i - 1]),
    );
}
async function prepareContourLabels() {
  const data = await readJSON<{
    lines: { elevation: number; points: [number, number][] }[];
  }>(dataBase + (compactData ? "contours-mobile.json" : "contours-100m.json"));
  for (const [elevation, fraction] of [
    [1500, 0.16],
    [2000, 0.5],
    [3000, 0.8],
  ]) {
    const line = data.lines
      .filter((l) => l.elevation === elevation)
      .sort((a, b) => b.points.length - a.points.length)[0];
    if (!line) continue;
    const [u, v] = line.points[Math.floor((line.points.length - 1) * fraction)];
    const label = addLabel(
      0,
      0,
      `${elevation.toLocaleString("fr-FR")} M`,
      "",
      0.145,
      0.245,
      1000,
      "minor",
    );
    label.world = geo.pointUV(u, v, elevation);
  }
}

function load(name: string, task: () => Promise<void>) {
  if (disposed || loaded.has(name) || pending.has(name) || failed.has(name)) return;
  const promise = task()
    .then(() => {
      if (disposed) return;
      loaded.add(name);
      failed.delete(name);
      renderDirty = true;
    })
    .catch((error) => {
      if (disposed) return;
      failed.set(name, safeError(error));
      console.error("ATLAS layer:", name, error);
    })
    .finally(() => pending.delete(name));
  pending.set(name, promise);
}
function requestAssets(p: number) {
  if (!terrain) return;
  if (p > 0.3 && p < 0.967)
    load("imagery", () => terrain!.loadImagery(dataBase, compactData));
  if (p > 0.48 && p < 0.967)
    load("detail", () => terrain!.loadDetail(dataBase, compactData));
  if (p > 0.51 && p < 0.967)
    load("city", async () => {
      const module = await import("./world/city");
      const instance = new module.CityLayer();
      await instance.load(dataBase, geo, compactData);
      if (disposed) {
        instance.dispose();
        return;
      }
      city = instance;
      scene.add(city.group);
    });
  if (p > 0.81)
    load("globe", async () => {
      const module = await import("./world/globe");
      const instance = new module.GlobeLayer();
      await instance.load(base + "atlas/");
      if (disposed) {
        instance.dispose();
        return;
      }
      globe = instance;
      scene.add(globe.group);
    });
  if (
    p > 0.977 &&
    loaded.has("globe") &&
    ["imagery", "detail", "city"].some((n) => loaded.has(n))
  ) {
    if (city) {
      scene.remove(city.group);
      city.dispose();
      city = undefined;
    }
    terrain.releaseFineAssets();
    for (const name of ["imagery", "detail", "city"]) loaded.delete(name);
    renderDirty = true;
  }
  const required = [
    ...(p > 0.53 && p < 0.94 ? ["imagery"] : []),
    ...(p > 0.62 && p < 0.91 ? ["detail"] : []),
    ...(p > 0.66 && p < 0.91 ? ["city"] : []),
    ...(p > 0.924 ? ["globe"] : []),
  ];
  const failure = required.find((n) => failed.has(n));
  if (failure) {
    status.textContent = failed.get(failure)! + " Reload to retry.";
  } else if (required.some((n) => !loaded.has(n))) {
    status.textContent = "Preparing this scale…";
  } else status.textContent = "";
}

function configureRenderer() {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(paper, 1);
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.domElement.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
    showFailure(
      "The graphics context was interrupted. Reload to restore the same observation.",
    );
  });
  $("world").append(renderer.domElement);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(36, width / height, 0.01, 1000);
  resizeRenderer();
}
function resizeRenderer() {
  width = innerWidth;
  height = innerHeight;
  mobile = width <= 760;
  renderDirty = true;
  const dpr = Math.min(
    devicePixelRatio,
    mobile ? 1.6 : 1.5,
    3200 / width,
    1900 / height,
  );
  renderer?.setPixelRatio(Math.max(0.6, dpr));
  renderer?.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  map?.resize(width, height);
}

function updateCamera(s: StoryState) {
  const pose = { ...s.pose };
  if (cameraRoute.length > 1 && s.p > 0.737 && s.p < 0.877) {
    const follow = smooth(0.737, 0.764, s.p) * (1 - smooth(0.85, 0.877, s.p));
    const routePoint = cameraRouteAt(
      mix(0.24, 0.72, smooth(0.749, 0.825, s.p)),
    );
    if (routePoint) {
      pose.x = mix(
        pose.x,
        routePoint.x - (mobile ? 0.04 : 0.19) * Math.min(1, pose.span / 0.83),
        follow,
      );
      pose.z = mix(pose.z, routePoint.z, follow);
      pose.y = mix(pose.y, routePoint.y, follow);
    }
  }
  Object.assign(currentPose, pose);
  target.set(pose.x, pose.y, pose.z);
  const distance =
    pose.span / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5));
  const pitch = pose.pitch,
    yaw = pose.yaw;
  camera.position.set(
    target.x + Math.sin(yaw) * Math.sin(pitch) * distance,
    target.y + Math.cos(pitch) * distance,
    target.z + Math.cos(yaw) * Math.sin(pitch) * distance,
  );
  camera.up.set(0, 1, 0);
  camera.lookAt(target);
  camera.near = Math.max(0.004, distance * 0.000025);
  camera.far = Math.max(350, distance * 8 + 20000 * s.globe);
  const offsetY =
    height *
    (0.1 * (1 - smooth(0.005, 0.12, s.p)) -
      (mobile ? 0.12 : 0) * smooth(0.95, 0.98, s.p));
  camera.setViewOffset(width, height, 0, offsetY, width, height);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
}

const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
  ray = new THREE.Raycaster(),
  pa = new THREE.Vector3(),
  pb = new THREE.Vector3();
function updateScale(s: StoryState) {
  const intro = 1 - smooth(0.035, 0.075, s.p);
  $("measurement").style.opacity = String(1 - intro);
  $("scroll-cue").style.opacity = String(intro);
  if (s.p > 0.96) {
    $("scale").style.display = "none";
    $("altitude").textContent = "EARTH / 6,371 KM";
    return;
  }
  $("scale").style.display = "";
  plane.constant = -currentPose.y;
  ray.setFromCamera(new THREE.Vector2(0, 0), camera);
  const ok1 = ray.ray.intersectPlane(plane, pa);
  ray.setFromCamera(new THREE.Vector2(200 / width, 0), camera);
  const ok2 = ray.ray.intersectPlane(plane, pb);
  if (ok1 && ok2) {
    const metresPerPixel = pa.distanceTo(pb) * 10;
    const maxLength = mobile ? 80 : 120,
      goal = metresPerPixel * maxLength;
    const pow = 10 ** Math.floor(Math.log10(Math.max(goal, 1)));
    let metres = pow;
    for (const n of [1, 2, 5, 10]) if (n * pow <= goal) metres = n * pow;
    $("scale-rule").style.width =
      Math.max(25, Math.min(maxLength, metres / metresPerPixel)) + "px";
    $("scale-label").textContent =
      metres >= 1000
        ? `${Number((metres / 1000).toPrecision(2))} KM`
        : `${Math.round(metres)} M`;
  }
  const altitude = Math.max(0, camera.position.y - currentPose.y);
  $("altitude").textContent =
    (altitude < 1
      ? `${Math.round(altitude * 1000).toLocaleString("en-US")} M`
      : `${altitude.toLocaleString("en-US", { maximumFractionDigits: altitude < 100 ? 1 : 0 })} KM`) +
    " ABOVE THE FRAME";
}

function updateLabels(s: StoryState) {
  anchorWorld.set(
    0,
    (geo.meta.anchor.elevationM / 1000) *
      s.lift *
      (1 - smooth(0.92, 0.97, s.p)),
    0,
  );
  projected.copy(anchorWorld).project(camera);
  let ax = (projected.x * 0.5 + 0.5) * width,
    ay = (-projected.y * 0.5 + 0.5) * height;
  const outside =
    projected.z > 1 ||
    ax < 24 ||
    ax > width - 24 ||
    ay < 90 ||
    ay > height - 105;
  if (outside) {
    const direction = projected.z > 1 ? -1 : 1;
    const dx = projected.x * direction,
      dy = -projected.y * direction;
    ax = clamp(width * 0.5 + dx * width * 0.5, 24, width - 24);
    ay = clamp(height * 0.5 + dy * height * 0.5, height * 0.47, height - 195);
    anchor.style.setProperty("--bearing", Math.atan2(dy, dx) + "rad");
  }
  anchor.style.transform = `translate3d(${ax}px,${ay}px,0)`;
  anchor.style.left = "0";
  anchor.style.top = "0";
  anchor.style.opacity = "1";
  anchor.classList.toggle("outside", outside);
  anchor.classList.toggle("compact", s.p > 0.07);
  const coordinate = anchor.querySelector<HTMLElement>(".anchor-coordinate")!;
  coordinate.style.left = ax > width - 145 ? "-145px" : "22px";
  if (mobile) coordinate.style.left = ax > width - 116 ? "-116px" : "16px";
  const placed: [number, number][] = [];
  for (const label of labels) {
    const opacity =
      smooth(label.begin, label.begin + 0.026, s.p) *
      (1 - smooth(label.end - 0.025, label.end, s.p));
    if (width < label.minimum || opacity < 0.001) {
      label.element.style.opacity = "0";
      continue;
    }
    const pos = label.world?.clone() || geo.project(label.lon, label.lat);
    pos.y = pos.y * s.lift + 0.04;
    projected.copy(pos).project(camera);
    let x = (projected.x * 0.5 + 0.5) * width + (label.offset?.[0] || 0),
      y = (-projected.y * 0.5 + 0.5) * height + (label.offset?.[1] || 0);
    const inText =
      x < width * (mobile ? 0.8 : 0.41) && y < height * (mobile ? 0.4 : 0.56);
    const collision = placed.some(
      ([px, py]) => Math.abs(px - x) < 140 && Math.abs(py - y) < 42,
    );
    const halfLabel = label.element.offsetWidth * 0.5;
    const valid =
      x > halfLabel + 18 &&
      x < width - halfLabel - 18 &&
      y > 100 &&
      y < height - 95 &&
      projected.z < 1 &&
      !inText &&
      !collision;
    if (valid) placed.push([x, y]);
    label.element.style.opacity = String(valid ? opacity : 0);
    label.element.style.left = x + "px";
    label.element.style.top = y + "px";
  }
}
function updateChrome(s: StoryState) {
  const intro = 1 - smooth(0.032, 0.073, s.p);
  opening.style.opacity = String(intro);
  opening.style.transform = `translate(-50%,${-smooth(0.02, 0.07, s.p) * 12}px)`;
  const chapter = CHAPTERS[s.chapter];
  if (s.chapter !== lastChapter) {
    lastChapter = s.chapter;
    title.textContent = chapter.title;
    italic.textContent = chapter.italic;
    note.textContent = chapter.note;
    $("observation-number").textContent = String(s.chapter + 1).padStart(
      2,
      "0",
    );
    $("observation-name").textContent = chapter.name.toUpperCase();
    $("chapter-announcement").textContent =
      `${s.chapter + 1} of 11. ${chapter.name}. ${chapter.title} ${chapter.italic}`;
    $("chapter-list")
      .querySelectorAll("a")
      .forEach((a, i) => {
        if (i === s.chapter) a.setAttribute("aria-current", "step");
        else a.removeAttribute("aria-current");
      });
  }
  sceneCopy.classList.toggle("final", s.chapter === 10);
  sceneCopy.style.opacity = String(s.chapter === 0 ? 0 : 1 - intro);
  $("closing-action").hidden = s.p < 0.977;
  const dark = Math.max(s.night, smooth(0.91, 0.945, s.p));
  const background = reusableColour.copy(paper).lerp(nightPaper, dark);
  root.style.setProperty("--paper", "#" + background.getHexString());
  const luminance =
    background.r * 0.2126 + background.g * 0.7152 + background.b * 0.0722;
  const ink =
    dark < 0.25
      ? "#29312d"
      : dark > 0.94
        ? "#eeede6"
        : luminance > 0.18
          ? "#080e0b"
          : "#ffffff";
  root.style.setProperty("--ink", ink);
  root.style.setProperty("--muted", dark < 0.25 ? "#66716a" : ink);
  root.classList.toggle(
    "photographic",
    s.drape > 0.45 && s.city < 0.55 && s.p < 0.91,
  );
  $("reading-field").style.opacity = String(smooth(0.27, 0.39, s.p) * 0.78);
  $("progress-line").style.transform = `scaleX(${s.p})`;
  $("north").style.opacity = String(
    smooth(0.1, 0.16, s.p) * (1 - smooth(0.59, 0.64, s.p)),
  );
  $("north").querySelector("svg")!.style.transform =
    `rotate(${(-s.pose.yaw * 180) / Math.PI}deg)`;
  const layerNote =
    s.p > 0.632 && s.p < 0.865
      ? "REAL FOOTPRINTS · SCHEMATIC 8 M HEIGHTS"
      : s.p > 0.583 && s.p < 0.632
        ? "GSI AERIAL ORTHOPHOTOGRAPHY"
        : s.p > 0.511 && s.p < 0.583
          ? "LANDSAT 8 / GSI · REGISTERED TO REAL ELEVATION"
          : s.p > 0.422 && s.p < 0.511
            ? "MAPPED WATERWAYS · A CHANGE OF LAYER"
            : s.p > 0.235 && s.p < 0.422
              ? "GSI DEM10B · ELEVATION SHOWN AT 1×"
              : s.p > 0.118 && s.p < 0.235
                ? "GSI ELEVATION · 100 M INTERVAL"
                : "";
  $("layer-note").textContent = layerNote;
  $("layer-note").style.opacity = layerNote ? "1" : "0";
  updateScale(s);
  updateLabels(s);
}

function tick(now: number) {
  if (disposed || document.hidden) return;
  const dt = Math.min(0.05, (now - (lastTime || now)) / 1000);
  lastTime = now;
  scrollClock += dt * 1000;
  lenis.raf(scrollClock);
  if (!ready) { raf = requestAnimationFrame(tick); return; }
  if (!quiet && !dialog.open) time += dt;
  const p = getProgress();
  lastP = p;
  const s = evaluateStory(p, mobile);
  requestAssets(p);
  updateCamera(s);
  terrain!.update(s, time);
  map?.update(s);
  city?.update(s, time);
  globe?.update({ visibility: s.globe, night: 0, time: quiet ? 0 : time });
  const dark = Math.max(s.night, smooth(0.92, 0.973, p));
  renderer!.setClearColor(reusableColour.copy(paper).lerp(nightPaper, dark));
  updateChrome(s);
  if (!quiet || renderDirty || Math.abs(p - lastRenderedProgress) > 0.000001) {
    renderer!.render(scene, camera);
    lastRenderedProgress = p;
    renderDirty = false;
  }
  if (now - lastStore > 500) {
    remember();
    lastStore = now;
  }
  raf = requestAnimationFrame(tick);
}
function resume() {
  if (disposed) return;
  cancelAnimationFrame(raf);
  lastTime = 0;
  raf = requestAnimationFrame(tick);
}
addEventListener(
  "resize",
  () => {
    if (!renderer) return;
    const oldWidth = width,
      oldHeight = height,
      previousP = lastP;
    resizeRenderer();
    if (
      Math.abs(innerWidth - oldWidth) > 40 ||
      Math.abs(innerHeight - oldHeight) > oldHeight * 0.22
    )
      jump(previousP);
    resume();
  },
  { passive: true },
);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    cancelAnimationFrame(raf);
    lenis.scrollTo(scrollY, { immediate: true, force: true });
    remember();
  } else resume();
});
addEventListener("pageshow", resume);
addEventListener("pagehide", (event) => {
  lenis.scrollTo(scrollY, { immediate: true, force: true });
  cancelAnimationFrame(raf);
  remember();
});
addEventListener("beforeunload", remember);
addEventListener("pagehide", (event) => { if (!event.persisted) dispose(); });

async function init() {
  try {
    history.scrollRestoration = "manual";
    const navigation = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    let restored = 0;
    if (navigation?.type === "reload" || navigation?.type === "back_forward") {
      try {
        restored = Number(sessionStorage.getItem("atlas:progress") || 0);
      } catch {}
    } else {
      const chapter = CHAPTERS.find((c) => "#" + c.id === location.hash);
      restored = chapter?.position || 0;
    }
    if (Number.isFinite(restored) && restored > 0) jump(restored);
    configureRenderer();
    const size = compactData ? 257 : 513;
    const [meta, heights] = await Promise.all([
      readJSON<RasterMeta>(dataBase + "terrain.json"),
      readGrid(dataBase + `elevation-${size}.bin`, size),
    ]);
    geo = new Geography(meta, heights, size);
    if (disposed) return;
    terrain = new TerrainLayer(geo);
    map = new MapLayer(geo);
    scene.add(terrain.group, map.group);
    await Promise.all([
      terrain.loadContours(dataBase, compactData),
      map.load(dataBase, compactData),
      prepareCameraRoute(),
      prepareContourLabels(),
    ]);
    if (disposed) return;
    map.resize(width, height);
    loaded.add("terrain");
    ready = true;
    status.textContent = "";
    resume();
  } catch (error) {
    if (disposed) return;
    console.error(error);
    showFailure(
      import.meta.env.DEV
        ? safeError(error) + " Use a local HTTP server, with WebGL 2 enabled."
        : "The map could not load. Try again, or read the field notes. If the problem continues, check your connection and browser graphics support.",
    );
  }
}
init();
resume();

function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    lenis.destroy();
    terrain?.dispose();
    map?.dispose();
    city?.dispose();
    globe?.dispose();
    renderer?.dispose();
    renderer?.domElement.remove();
}
if (import.meta.hot) import.meta.hot.dispose(dispose);
