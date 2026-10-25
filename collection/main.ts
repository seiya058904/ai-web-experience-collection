import 'lenis/dist/lenis.css';
import Lenis from 'lenis';

const media = matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const controller = new AbortController();
const worlds = document.querySelectorAll<HTMLAnchorElement>('.world');

// The gallery stays a native document: one Lenis instance only smooths wheel and
// trackpad input, on its own clock. Reduced motion starts no instance at all.
let lenis: Lenis | null = null;
const syncSmoothing = () => {
  if (reduced.matches) {
    lenis?.destroy();
    lenis = null;
    return;
  }
  lenis ??= new Lenis({ lerp: .105, smoothWheel: true, syncTouch: false, anchors: false, autoRaf: true });
};
syncSmoothing();
reduced.addEventListener('change', syncSmoothing, { signal: controller.signal });
// Native input outside the wheel (fragment link, scroll key) wins immediately.
// End the wheel's momentum first so its old destination cannot drag the page back.
// The version is pinned; Lenis keeps this runtime method off its type surface.
const settle = () => (lenis as unknown as { reset(): void } | null)?.reset();
const scrollKeys = new Set([' ', 'Spacebar', 'PageDown', 'PageUp', 'Home', 'End', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight']);
document.addEventListener('click', (event) => {
  if (event.target instanceof Element && event.target.closest('a[href^="#"]')) settle();
}, { capture: true, signal: controller.signal });
document.addEventListener('keydown', (event) => {
  if (scrollKeys.has(event.key)) settle();
}, { signal: controller.signal });

for (const [index, world] of [...worlds].entries()) {
  world.dataset.index = String(index + 1).padStart(2, '0');
  world.addEventListener('pointermove', (event) => {
    if (!media.matches) return;
    const rect = world.getBoundingClientRect();
    world.style.setProperty('--pointer-x', `${(event.clientX - rect.left - rect.width / 2) * -.012}px`);
    world.style.setProperty('--pointer-y', `${(event.clientY - rect.top - rect.height / 2) * -.008}px`);
  }, { passive: true, signal: controller.signal });
  world.addEventListener('pointerleave', () => {
    world.style.removeProperty('--pointer-x');
    world.style.removeProperty('--pointer-y');
  }, { signal: controller.signal });
  world.addEventListener('click', (event) => {
    // New tabs are independent visits, even when sessionStorage is copied by an opener.
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
      || world.target || !world.id.startsWith('world-')) return;
    const token = crypto.randomUUID();
    try {
      const record = { route: world.id.slice(6), offset: world.getBoundingClientRect().top, created: Date.now() };
      sessionStorage.setItem(`collection-journey:${token}`, JSON.stringify(record));
      history.replaceState({ ...history.state, collectionSource: world.id }, '');
      const url = new URL(world.href);
      url.searchParams.set('collection-journey', token);
      // Do not mutate href: a later modified click must not inherit this journey.
      event.preventDefault();
      location.assign(url);
    } catch { /* Storage can be unavailable; the ordinary native link remains usable. */ }
  }, { signal: controller.signal });
}
// Native fragment navigation performs the initial scroll. Only restore focus;
// waiting for fonts must never cause a second programmatic scroll.
const returning = new URL(location.href).searchParams.has('collection-return');
const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
const restoredSource = navigation?.type === 'back_forward' ? history.state?.collectionSource : null;
if (returning || typeof restoredSource === 'string') {
  const source = document.getElementById(typeof restoredSource === 'string' ? restoredSource : location.hash.slice(1));
  if (source instanceof HTMLAnchorElement && source.classList.contains('world')) source.focus({ preventScroll: true });
}
import.meta.hot?.dispose(() => {
  controller.abort();
  lenis?.destroy();
});
