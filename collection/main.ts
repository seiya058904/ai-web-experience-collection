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

// Strips start from a light candidate. Pointing at one asks for the size it opens to.
const hoverable = matchMedia('(hover: hover)');
document.querySelector('.spectrum')?.addEventListener('pointerover', (event) => {
  const image = event.target instanceof Element ? event.target.closest('.slit')?.querySelector('img') : null;
  if (image && hoverable.matches) image.sizes = '60svh';
}, { signal: controller.signal });

// The catalogue previews each work from its gallery image; without this it stays a plain list.
const catalogue = document.querySelector<HTMLDetailsElement>('.collection-index');
const catalogueNav = catalogue?.querySelector('nav');
if (catalogue && catalogueNav) {
  const wide = matchMedia('(hover: hover) and (min-width: 1001px)');
  const pane = document.createElement('div');
  pane.className = 'index-preview';
  pane.setAttribute('aria-hidden', 'true');
  const layers = [new Image(), new Image()];
  for (const layer of layers) {
    layer.alt = '';
    layer.decoding = 'async';
    pane.append(layer);
  }
  let front = 0;
  let current: HTMLAnchorElement | null = null;
  const preview = (link: HTMLAnchorElement | null) => {
    if (!link || link === current) return;
    current?.classList.remove('is-current');
    current = link;
    link.classList.add('is-current');
    const source = document.querySelector<HTMLImageElement>(`${link.hash} .world-image img`);
    if (!source) return;
    const next = layers[1 - front];
    next.sizes = '34vw';
    next.srcset = source.srcset;
    next.src = source.src;
    next.style.objectPosition = getComputedStyle(source).objectPosition;
    const shown = () => {
      if (current !== link) return;
      next.classList.add('is-on');
      layers[front].classList.remove('is-on');
      front = 1 - front;
    };
    next.decode().then(shown, shown);
  };
  const syncPreview = () => {
    const active = catalogue.open && wide.matches;
    catalogueNav.classList.toggle('has-preview', active);
    if (active && !pane.isConnected) catalogueNav.append(pane);
    if (!active) pane.remove();
    if (active && !current) preview(catalogueNav.querySelector('a'));
  };
  const linkFrom = (event: Event) => event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a') : null;
  catalogue.addEventListener('toggle', syncPreview, { signal: controller.signal });
  wide.addEventListener('change', syncPreview, { signal: controller.signal });
  catalogueNav.addEventListener('pointerover', (event) => preview(linkFrom(event)), { signal: controller.signal });
  catalogueNav.addEventListener('focusin', (event) => preview(linkFrom(event)), { signal: controller.signal });
}

for (const world of worlds) {
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
