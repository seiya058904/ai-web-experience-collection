import gsap from 'gsap';
import 'lenis/dist/lenis.css';
import './style.css';
import { createMotion } from './motion';

const $ = <T extends HTMLElement>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing exhibition element: ${selector}`);
  return element;
};

const stage = $('#stage');
const scenes = Array.from(document.querySelectorAll<HTMLElement>('.scene'));
const dialog = $<HTMLDialogElement>('#study-index');
const openIndexButton = $<HTMLButtonElement>('#open-index');
const closeIndexButton = $<HTMLButtonElement>('#close-index');
const continueButton = $<HTMLButtonElement>('#continue');
const motionToggle = $<HTMLButtonElement>('#motion-toggle');
const previewImage = $<HTMLImageElement>('#index-preview-image');
const previewContainer = $('.index-preview');
const systemMotion = matchMedia('(prefers-reduced-motion: reduce)');
const root = document.documentElement;
const events = new AbortController();
const listenOptions = { signal: events.signal };
const names = ['Celadon', 'Crackle', 'Cobalt', 'Oxblood', 'Ivory', 'Amber', 'Iron'];
const backgrounds = ['#e4e8df', '#a6b5a1', '#263f56', '#290a05', '#ddd5c7', '#a66f36', '#100f0e'];
const studyControls = Array.from(document.querySelectorAll<HTMLElement>('[data-study]'));

type MotionPreference = 'auto' | 'reduced' | 'full';
let preference: MotionPreference = 'auto';
try {
  const saved = localStorage.getItem('glaze-motion');
  if (saved === 'full' || saved === 'reduced') preference = saved;
} catch { /* The exhibition remains usable with storage disabled. */ }

let controller: ReturnType<typeof createMotion> | undefined;
let activeIndex = 0;
let reduced = preference === 'reduced' || (preference === 'auto' && systemMotion.matches);
let dialogClosing = false;
let pendingNavigation: number | null = null;
let disposed = false;

function updateCurrent(index: number) {
  activeIndex = index;
  root.dataset.study = String(index);
  for (const control of studyControls) {
    if (control.matches('.brand, .replay')) continue;
    if (Number(control.dataset.study) === index) control.setAttribute('aria-current', 'step');
    else control.removeAttribute('aria-current');
  }
  scenes.forEach((scene, position) => {
    scene.inert = !reduced && position !== index;
    if (reduced) scene.removeAttribute('aria-hidden');
    else scene.setAttribute('aria-hidden', String(position !== index));
  });
  continueButton.classList.toggle('is-last', index === scenes.length - 1);
  continueButton.setAttribute('aria-label', `Continue to ${names[Math.min(index + 1, 6)]}`);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', backgrounds[index]);
}

function mountMotion(restoreIndex = 0) {
  controller?.destroy();
  root.classList.toggle('is-reduced', reduced);
  root.classList.toggle('is-animated', !reduced);
  motionToggle.setAttribute('aria-pressed', String(reduced));
  controller = createMotion({ stage, scenes, reduced, onSceneChange: updateCurrent });
  controller.goTo(restoreIndex, true);
  updateCurrent(controller.getActiveIndex());
  if (dialog.open) controller.pause();
}

function showPreview(index: number) {
  previewContainer.classList.toggle('is-celadon', index === 0);
  previewContainer.style.backgroundColor = backgrounds[index];
  const src = scenes[index].querySelector<HTMLImageElement>('img')?.src;
  if (src && previewImage.src !== src) previewImage.src = src;
}

function openIndex() {
  if (dialog.open || !controller) return;
  showPreview(activeIndex);
  controller.pause();
  root.classList.add('has-index');
  dialog.showModal();
  dialog.scrollTop = 0;
  openIndexButton.setAttribute('aria-expanded', 'true');
  if (!reduced) {
    gsap.fromTo(dialog, { clipPath: 'inset(0 0 100% 0)' }, {
      clipPath: 'inset(0 0 0% 0)', duration: .58, ease: 'power3.inOut',
      clearProps: 'clipPath', overwrite: true,
    });
  }
}

function closeIndex(target: number | null = null) {
  if (!dialog.open || dialogClosing) return;
  dialogClosing = true;
  pendingNavigation = target;
  const close = () => { dialog.close(); };
  if (reduced) close();
  else gsap.to(dialog, { clipPath: 'inset(0 0 100% 0)', duration: .42, ease: 'power3.inOut', onComplete: close, overwrite: true });
}

function handleDialogClosed() {
  dialogClosing = false;
  gsap.set(dialog, { clearProps: 'clipPath' });
  root.classList.remove('has-index');
  openIndexButton.setAttribute('aria-expanded', 'false');
  controller?.resume();
  if (pendingNavigation !== null) {
    const target = pendingNavigation;
    pendingNavigation = null;
    controller?.goTo(target);
    $('#exhibition').focus({ preventScroll: true });
  } else openIndexButton.focus({ preventScroll: true });
}

function goTo(index: number) {
  if (!controller || !Number.isInteger(index) || index < 0 || index >= scenes.length) return;
  const image = scenes[index].querySelector<HTMLImageElement>('img');
  if (image) image.loading = 'eager';
  if (dialog.open) closeIndex(index);
  else controller.goTo(index);
}

function onStudyClick(event: Event) {
  const target = event.currentTarget as HTMLElement;
  event.preventDefault();
  goTo(Number(target.dataset.study));
}

for (const control of studyControls) {
  control.addEventListener('click', onStudyClick, listenOptions);
  if (control.closest('.index-list')) {
    control.addEventListener('pointerenter', () => showPreview(Number(control.dataset.study)), listenOptions);
    control.addEventListener('focus', () => showPreview(Number(control.dataset.study)), listenOptions);
  }
}
openIndexButton.addEventListener('click', openIndex, listenOptions);
closeIndexButton.addEventListener('click', () => closeIndex(), listenOptions);
dialog.addEventListener('cancel', event => { event.preventDefault(); closeIndex(); }, listenOptions);
dialog.addEventListener('close', handleDialogClosed, listenOptions);
continueButton.addEventListener('click', () => goTo(Math.min(activeIndex + 1, scenes.length - 1)), listenOptions);

motionToggle.addEventListener('click', () => {
  reduced = !reduced;
  preference = reduced ? 'reduced' : 'full';
  try { localStorage.setItem('glaze-motion', preference); } catch { /* Optional preference storage. */ }
  mountMotion(activeIndex);
}, listenOptions);

function onSystemMotionChange() {
  if (preference !== 'auto') return;
  reduced = systemMotion.matches;
  mountMotion(activeIndex);
}
systemMotion.addEventListener('change', onSystemMotionChange, listenOptions);

function handleHash() {
  const id = location.hash.slice(1);
  const index = scenes.findIndex(scene => scene.id === id);
  if (index >= 0) goTo(index);
}
window.addEventListener('hashchange', handleHash, listenOptions);

async function boot() {
  const hero = scenes[0].querySelector<HTMLImageElement>('img')!;
  const ready = Promise.allSettled([document.fonts.ready, hero.decode()]);
  let timeout: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([ready, new Promise(resolve => { timeout = setTimeout(resolve, 1600); })]);
  clearTimeout(timeout);
  if (disposed) return;
  mountMotion();
  root.classList.add('is-ready');
  showPreview(0);
  handleHash();
}

void boot();

function teardown() {
  disposed = true;
  events.abort();
  controller?.destroy();
  systemMotion.removeEventListener('change', onSystemMotionChange);
  window.removeEventListener('hashchange', handleHash);
  gsap.killTweensOf(dialog);
}

if (import.meta.hot) import.meta.hot.dispose(teardown);
window.addEventListener('pagehide', event => { if (!event.persisted) teardown(); });

import '../../shared/collection-return.css';
