import "./styles.css";
import "../experiences/shared/collection-return.css";
import { createMotion } from "./motion";
import { initInteractions } from "./interactions";

const motion = createMotion();
initInteractions(motion);
const { signal } = motion;
if (import.meta.env.DEV) {
  Object.assign(window, { __f1Motion: motion });
}
import.meta.hot?.dispose(() => {
  motion.destroy();
  if (import.meta.env.DEV) Reflect.deleteProperty(window, "__f1Motion");
});

const hero = document.querySelector<HTMLImageElement>(".hero-media img")!;
let ready = false;
let loadingTimeout: ReturnType<typeof setTimeout>;
const finishLoading = () => {
  if (ready || signal.aborted) return;
  ready = true;
  clearTimeout(loadingTimeout);
  document.documentElement.classList.add("is-ready");
  motion.refresh();
};
if (hero.complete) finishLoading();
else {
  hero.addEventListener("load", finishLoading, { once: true, signal });
  hero.addEventListener("error", finishLoading, { once: true, signal });
}
// The indicator never blocks the page, even on a stalled connection.
if (!ready) loadingTimeout = setTimeout(finishLoading, 3500);
motion.own(() => clearTimeout(loadingTimeout));
document.fonts.ready.then(() => {
  if (!signal.aborted) motion.refresh();
});
document.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
  const markUnavailable = () => {
    image.classList.add("media-failed");
    image.title = "图像暂时无法载入，科普内容与交互仍可使用。";
  };
  image.addEventListener("error", markUnavailable, { once: true, signal });
  image.addEventListener("load", () => motion.refresh(), {
    once: true,
    signal,
  });
  // A cached failure can finish before the module attaches its event listener.
  if (image.complete && image.naturalWidth === 0) markUnavailable();
});
addEventListener(
  "load",
  () => {
    motion.refresh();
    if (location.hash) {
      let id = "";
      try {
        id = decodeURIComponent(location.hash.slice(1));
      } catch {
        return;
      }
      const target = document.getElementById(id);
      if (target) {
        if (target instanceof HTMLDetailsElement) target.open = true;
        motion.scrollTo(target, false);
      }
    }
  },
  { once: true, signal },
);
