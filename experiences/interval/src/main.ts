import "./style.css";
import { asset, scenes } from "./scenes";
import { SpatialJourney } from "./journey";

const monogram = `<svg viewBox="0 0 30 44" fill="none" aria-hidden="true"><path d="M2 3h8M6 3v25M2 28h8M18 16h8M22 16v25M18 41h8" stroke="currentColor" stroke-width="1.5"/></svg>`;
const arrow = `<svg viewBox="0 0 32 42" fill="none" aria-hidden="true"><path d="M16 2v34M7 27l9 10 9-10" stroke="currentColor" stroke-width="1.1"/></svg>`;
const cross = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4v16M4 12h16" stroke="currentColor" stroke-width="1.2"/></svg>`;

const structure = `<svg class="structure-drawing" viewBox="0 0 1586 992" fill="none" aria-hidden="true">
  <g class="trace-lines" stroke="currentColor" stroke-width="1.3">
    <path pathLength="1" d="M841 0V850L0 992"/><path pathLength="1" d="M874 0V847L975 848L1071 819V0"/>
    <path pathLength="1" d="M1098 0V785L1586 847"/><path pathLength="1" d="M0 367L841 418"/>
    <path pathLength="1" d="M0 501L841 499"/><path pathLength="1" d="M0 765L841 660"/>
    <path pathLength="1" d="M304 260H761L841 330"/><path pathLength="1" d="M1185 224H1125L1098 375"/>
  </g>
  <g class="trace-text" fill="currentColor"><text x="306" y="245">BOARD-MARKED CONCRETE</text><text x="1185" y="208">GLASS EDGE</text></g>
</svg>`;

const sceneMarkup = scenes
  .map(
    (
      scene,
      index,
    ) => `<section class="scene" id="${scene.id}" aria-labelledby="${scene.id}-title" data-scene="${index}">
  <figure class="scene-media">
    <div class="camera">
      <div class="breath">
        <picture>
          <source media="(max-width: 700px)" srcset="${asset(scene.id, true)}" />
          <img class="architecture-image" src="${asset(scene.id)}" alt="${scene.alt}" width="${index === 0 ? 1672 : 1586}" height="${index === 0 ? 941 : 992}" loading="${index < 2 ? "eager" : "lazy"}" decoding="async" fetchpriority="${index === 0 ? "high" : index === 1 ? "auto" : "low"}" draggable="false" />
        </picture>
        <div class="ambient-light ambient-${scene.ambient}" aria-hidden="true"></div>
        ${scene.id === "matter" ? structure : ""}
      </div>
    </div>
    <div class="image-failure" hidden><p>This image could not be loaded.</p><button type="button" data-reload-image="${index}">Try again</button></div>
  </figure>
  <div class="scene-caption">
    <div class="chapter-copy"><p class="chapter-label">${String(index + 1).padStart(2, "0")} / ${scene.name}</p><h2 id="${scene.id}-title">${scene.title}</h2></div>
    <div class="chapter-aside"><p>${scene.text}</p><p>${scene.invitation}</p>${index === 5 ? `<a class="return-link" href="#threshold" data-go="0">Return to the threshold <span aria-hidden="true">↗</span></a>` : ""}</div>
  </div>
</section>`,
  )
  .join("");

const navMarkup = scenes
  .map(
    (scene, index) =>
      `<a href="#${scene.id}" data-go="${index}" aria-label="Go to ${scene.name}"><span class="nav-dot" aria-hidden="true"></span><span class="nav-name">${scene.name}</span></a>`,
  )
  .join("");

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <a class="skip-link" href="#journey">Skip to the spaces</a>
  <header class="site-header">
    <a class="brand" href="#threshold" data-go="0" aria-label="INTERVAL, return to the threshold">${monogram}<span>INTERVAL</span></a>
    <p class="header-note">An exploration of space</p>
    <div class="interval-header-actions"><a class="collection-return" href="${import.meta.env.BASE_URL}" aria-label="Return to Collection" title="Return to Collection"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7"/></svg><span>Collection</span></a><button class="index-button" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="index-dialog">Index ${cross}</button></div>
  </header>
  <main class="journey" id="journey" tabindex="-1" aria-label="An architectural passage in six movements">
    <div class="stage">
      <div class="opening"><h1 aria-label="INTERVAL">${"INTERVAL"
        .split("")
        .map((letter) => `<span aria-hidden="true">${letter}</span>`)
        .join("")}</h1></div>
      ${sceneMarkup}
      <div class="intro-caption"><div><p class="intro-title">Architecture between light &amp; space.</p><p class="intro-description">A passage through the spaces that shape us.</p></div><a class="enter-link" href="#threshold" aria-label="Scroll to enter" data-enter>${arrow}<span>Scroll to enter</span></a></div>
      <nav class="journey-nav" aria-label="The six spaces"><div class="chapter-links">${navMarkup}</div><button class="about-button" type="button">About</button></nav>
      <div class="journey-progress" aria-hidden="true"><div></div></div>
    </div>
  </main>
  <dialog class="index-dialog" id="index-dialog" data-lenis-prevent aria-labelledby="index-title">
    <div class="dialog-top"><span class="brand">${monogram}<span>INTERVAL</span></span><button class="close-index" type="button" aria-label="Close index">Close ${cross}</button></div>
    <div class="index-layout">
      <div class="index-main"><h2 id="index-title">Find your way.</h2><nav class="index-spaces" aria-label="Choose a space">${scenes.map((scene, i) => `<a href="#${scene.id}" data-go="${i}"><span class="index-number">${String(i + 1).padStart(2, "0")}</span><span>${scene.name}</span><svg viewBox="0 0 30 24" fill="none" aria-hidden="true"><path d="M2 12h23M17 4l8 8-8 8" stroke="currentColor" stroke-width="1.1"/></svg></a>`).join("")}</nav></div>
      <aside class="index-aside">
        <div class="passage-diagram" aria-hidden="true"><svg viewBox="0 0 420 230" fill="none"><g stroke="currentColor" stroke-width="1"><path d="M25 203V133H126V203H25ZM126 168V66H225V168H126ZM225 66V23H391V115H225M273 115V203H391V115M225 168H273M126 133H99M126 66H181"/><path class="plan-route" d="M0 178H75V152H175V103H267V69H344V151H305V203H419" stroke-dasharray="3 5"/></g><g fill="currentColor" class="plan-labels"><text x="63" y="189">01</text><text x="166" y="132">02</text><text x="253" y="60">03</text><text x="337" y="91">04</text><text x="335" y="182">05</text><text x="394" y="225">06</text></g></svg><p>A diagram of the journey</p></div>
        <div class="about-experience" tabindex="-1"><h3>Six spaces.<br>One continuous passage.</h3><p>INTERVAL is a study of what happens between a wall and the light, an inside and an outside, a moment and the next.</p><p>Move at your own pace. Every threshold leads somewhere. Every space offers a little room to stay.</p><p class="imagery-note">The architecture is fictional. These original, AI-generated architectural visualisations were created for this experience.</p></div>
        <label class="motion-setting"><span><strong>Reduced motion</strong><small>A still, scrollable sequence of spaces.</small></span><input id="motion-setting" type="checkbox" aria-label="Reduced motion" /><span class="toggle-track" aria-hidden="true"></span></label>
        <details class="reference-notes"><summary>References &amp; credits</summary><p>Spatial studies inspired by <a href="https://benesse-artsite.jp/en/art/chichu.html" target="_blank" rel="noopener noreferrer">Chichu Art Museum</a>, <a href="https://kkaa.co.jp/en/project/gc-prostho-museum-research-center/" target="_blank" rel="noopener noreferrer">Kengo Kuma’s timber structures</a>, and <a href="https://www.louvrelens.fr/en/architecture-et-parc/" target="_blank" rel="noopener noreferrer">SANAA’s Louvre-Lens</a>. No photographs from those projects are used.</p><p>Bodoni Moda and Manrope are self-hosted under the SIL Open Font License. Complete image and dependency credits accompany the source.</p></details>
      </aside>
    </div>
    <footer class="index-foot"><span>Architecture between light &amp; space.</span><span>Take your time.</span></footer>
  </dialog>
`;

const app = document.querySelector<HTMLElement>("#app")!;
const dialog = document.querySelector<HTMLDialogElement>("#index-dialog")!;
const indexButton = document.querySelector<HTMLButtonElement>(".index-button")!;
const motionSetting =
  document.querySelector<HTMLInputElement>("#motion-setting")!;
const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
let engine: SpatialJourney | undefined;
let motionOverride: string | null = null;
try {
  motionOverride = localStorage.getItem("interval-motion");
} catch {
  /* Browser storage is optional. */
}
let returnFocus: HTMLElement | null = null;
let stillObserver: IntersectionObserver | undefined;
let activeScene = 0;

function setCurrent(index: number) {
  activeScene = index;
  document.querySelectorAll<HTMLElement>("[data-go]").forEach((link) => {
    const current = Number(link.dataset.go) === index;
    if (current) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}

function setupMotion(preserveScene = 0) {
  engine?.destroy();
  engine = undefined;
  stillObserver?.disconnect();
  const reduced =
    motionOverride === "still" ||
    (motionOverride !== "spatial" && preference.matches);
  motionSetting.checked = reduced;
  document.body.classList.toggle("is-still", reduced);
  document.body.classList.toggle("is-spatial", !reduced);
  if (!reduced) {
    engine = new SpatialJourney(setCurrent);
    if (preserveScene > 0) engine.goTo(preserveScene, true);
    if (dialog.open) engine.pause();
  } else {
    document
      .querySelectorAll<HTMLElement>(
        ".scene, .scene-media, .camera, .breath, .architecture-image, .scene-caption, .opening, .intro-caption, .journey-nav, .structure-drawing, .ambient-light, .stage",
      )
      .forEach((el) => el.removeAttribute("style"));
    document.querySelectorAll<HTMLElement>(".scene").forEach((el, i) => {
      el.removeAttribute("aria-hidden");
      el.inert = false;
      el.style.setProperty("--focus", `${scenes[i]!.focus * 100}%`);
    });
    document.querySelector<HTMLElement>(".journey-nav")!.inert = false;
    stillObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible)
          setCurrent(Number((visible.target as HTMLElement).dataset.scene));
      },
      { threshold: [0.15, 0.35, 0.65] },
    );
    document
      .querySelectorAll(".scene")
      .forEach((el) => stillObserver!.observe(el));
    if (preserveScene > 0)
      document
        .getElementById(scenes[preserveScene]!.id)
        ?.scrollIntoView({ behavior: "instant", block: "start" });
  }
  setCurrent(preserveScene);
}

function openIndex(about = false) {
  returnFocus = document.activeElement as HTMLElement;
  engine?.pause();
  document.body.classList.add("index-is-open");
  dialog.showModal();
  indexButton.setAttribute("aria-expanded", "true");
  if (!about) dialog.scrollTop = 0;
  if (about)
    document
      .querySelector<HTMLElement>(".about-experience")!
      .focus({ preventScroll: false });
}

function closeIndex(restoreFocus = true) {
  if (!dialog.open) return;
  dialog.close();
  document.body.classList.remove("index-is-open");
  indexButton.setAttribute("aria-expanded", "false");
  engine?.resume();
  if (restoreFocus && returnFocus?.isConnected)
    returnFocus.focus({ preventScroll: true });
}

function navigate(index: number, immediate = false, updateHistory = true) {
  closeIndex(false);
  if (engine) engine.goTo(index, immediate);
  else
    document
      .getElementById(scenes[index]!.id)
      ?.scrollIntoView({ behavior: "instant", block: "start" });
  if (updateHistory)
    history.pushState({ space: index }, "", `#${scenes[index]!.id}`);
  setCurrent(index);
}

app.addEventListener("click", (event) => {
  const target = event.target as Element;
  if (target.closest(".skip-link")) {
    event.preventDefault();
    document
      .querySelector<HTMLElement>("#journey")!
      .focus({ preventScroll: true });
    return;
  }
  const link = target.closest<HTMLElement>("[data-go]");
  if (
    link &&
    !(event as MouseEvent).ctrlKey &&
    !(event as MouseEvent).metaKey
  ) {
    event.preventDefault();
    navigate(Number(link.dataset.go));
    return;
  }
  if (target.closest("[data-enter]")) {
    event.preventDefault();
    if (engine) engine.enter();
    else document.getElementById("threshold")!.scrollIntoView();
  }
  const reload = target.closest<HTMLElement>("[data-reload-image]");
  if (reload) {
    const figure = reload.closest<HTMLElement>("figure")!;
    const image = figure.querySelector<HTMLImageElement>("img")!;
    figure.querySelector<HTMLElement>(".image-failure")!.hidden = true;
    image.src =
      asset(scenes[Number(reload.dataset.reloadImage)]!.id) +
      `?retry=${Date.now()}`;
  }
});

indexButton.addEventListener("click", () => openIndex());
document
  .querySelector(".about-button")!
  .addEventListener("click", () => openIndex(true));
document
  .querySelector(".close-index")!
  .addEventListener("click", () => closeIndex());
dialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeIndex();
});
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeIndex();
});
dialog.addEventListener("close", () => {
  document.body.classList.remove("index-is-open");
  indexButton.setAttribute("aria-expanded", "false");
  engine?.resume();
});

motionSetting.addEventListener("change", () => {
  const active =
    engine?.currentScene ??
    Number(
      document.querySelector<HTMLElement>(".journey-nav [aria-current]")
        ?.dataset.go ?? 0,
    );
  motionOverride = motionSetting.checked ? "still" : "spatial";
  try {
    localStorage.setItem("interval-motion", motionOverride);
  } catch {
    /* No persistence is needed to use the setting. */
  }
  setupMotion(active);
});
preference.addEventListener("change", () => {
  if (motionOverride === null) setupMotion(engine?.currentScene ?? activeScene);
});

document
  .querySelectorAll<HTMLImageElement>(".architecture-image")
  .forEach((img) => {
    img.addEventListener("error", () => {
      img
        .closest("figure")!
        .querySelector<HTMLElement>(".image-failure")!.hidden = false;
    });
  });

function syncHash() {
  const index = scenes.findIndex(
    (scene) => `#${scene.id}` === window.location.hash,
  );
  if (index >= 0) navigate(index, true, false);
}
window.addEventListener("popstate", syncHash);
window.addEventListener("hashchange", syncHash);

setupMotion();
if (window.location.hash) syncHash();
document.fonts.ready.then(() => engine?.refresh());
Promise.allSettled(
  Array.from(document.querySelectorAll<HTMLImageElement>(".architecture-image"))
    .slice(0, 2)
    .map((img) => img.decode()),
).then(() => engine?.refresh());
window.setTimeout(
  () =>
    document
      .querySelectorAll<HTMLImageElement>(".architecture-image")
      .forEach((img) => {
        img.loading = "eager";
        img.decode().catch(() => {});
      }),
  700,
);

if (import.meta.hot)
  import.meta.hot.dispose(() => {
    engine?.destroy();
    stillObserver?.disconnect();
  });

import "../../shared/collection-return.css";
