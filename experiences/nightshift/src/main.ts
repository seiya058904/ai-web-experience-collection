import 'lenis/dist/lenis.css';
import './styles.css';
import { renderApp } from './markup';
import { createStoryController } from './story-controller';
import { initInteractions } from './interactions';
import { mountInlineImageFallbacks } from './media';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = renderApp();
const controller = createStoryController();
const cleanupInteractions = initInteractions(controller);
const cleanupImages = mountInlineImageFallbacks();
document.documentElement.dataset.ready = 'true';
performance.mark('nightshift-interactive');

if (import.meta.hot) {
  import.meta.hot.dispose(() => { cleanupInteractions(); cleanupImages(); controller.destroy(); });
}
