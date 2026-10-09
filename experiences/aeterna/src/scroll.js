export const chapterNames = [
  'The Colossus', 'Stone Becomes Flesh', 'The Face of Power', 'Body / Authority',
  'Monument', 'History Carved in Stone', 'Fracture', 'Afterlife', 'Aeterna',
];
export const chapterIds = [
  'colossus', 'stone', 'power', 'body', 'monument', 'relief', 'fracture-room', 'afterlife', 'aeterna',
];
export const clamp = (x, min = 0, max = 1) => Math.min(max, Math.max(min, Number.isFinite(x) ? x : min));
export const smooth = (start, end, x) => {
  const p = clamp((x - start) / (end - start));
  return p * p * (3 - 2 * p);
};

/** Cancel pending input without releasing a modal's stopped state. */
export function settleScrollInput(lenis) {
  const stopped = lenis.isStopped;
  if (stopped) lenis.start();
  lenis.stop();
  if (!stopped) lenis.start();
}

/** Document position is the only narrative timeline; Lenis owns input easing. */
export function createScrollTimeline(lenis) {
  const stops = [...document.querySelectorAll('.scroll-stop')];
  let positions = [];
  let maxScroll = 1;
  let height = window.innerHeight;
  let width = window.innerWidth;

  function measure(reducedMotion = false) {
    height = Math.max(1, window.innerHeight);
    width = Math.max(1, window.innerWidth);
    stops.forEach((stop) => {
      stop.style.height = Math.round(height * (reducedMotion ? 1.2 : Number(stop.dataset.length))) + 'px';
    });
    positions = stops.map((stop) => stop.offsetTop);
    maxScroll = Math.max(1, document.documentElement.scrollHeight - height);
    lenis.resize();
  }
  function snapshot() {
    const y = clamp(window.scrollY, 0, maxScroll);
    let index = 0;
    for (let i = positions.length - 1; i >= 0; i--) {
      if (y >= positions[i] - 1) { index = i; break; }
    }
    const start = positions[index] || 0;
    const end = index === positions.length - 1 ? maxScroll : positions[index + 1];
    return { index, progress: clamp((y - start) / Math.max(1, end - start)), y, width, height, overall: y / maxScroll };
  }
  function goTo(index, progress = .06, behavior = 'auto') {
    const target = Math.round(clamp(index, 0, stops.length - 1));
    const start = positions[target] || 0;
    const end = target === stops.length - 1 ? maxScroll : positions[target + 1];
    if (behavior !== 'smooth') settleScrollInput(lenis);
    lenis.scrollTo(start + Math.max(0, end - start) * clamp(progress), { immediate: behavior !== 'smooth', force: true });
  }
  return { measure, snapshot, goTo };
}
