import './collection.css';
const media = matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)');
const controller = new AbortController();
for (const world of document.querySelectorAll<HTMLElement>('.world')) {
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
import.meta.hot?.dispose(() => controller.abort());
