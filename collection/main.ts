import './styles.css';
const media = matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)');
const controller = new AbortController();
const worlds = document.querySelectorAll<HTMLElement>('.world');
const reveal = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add('is-visible');
    reveal.unobserve(entry.target);
  }
}, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
for (const [index, world] of [...worlds].entries()) {
  world.dataset.index = String(index + 1).padStart(2, '0');
  reveal.observe(world);
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
}
import.meta.hot?.dispose(() => { controller.abort(); reveal.disconnect(); });
