import { artUrl, loadArt } from './assets.ts';
import { renderFallback, renderProps } from './stage-props.ts';
import type { StoryMemory } from './story-state.ts';

export interface ArtFrame { left: number; top: number; scale: number; width: number; height: number }
export function frameFor(index: number, width: number, height: number): ArtFrame {
  const mobile = width <= 700;
  const portrait = mobile && [0, 3, 9, 10].includes(index);
  const nativeW = portrait ? 853 : 1586;
  const nativeH = portrait ? 1844 : 992;
  const desktopTop = height <= 600 ? 65 : width >= 2800 ? 122 : width >= 1900 ? 110 : 96;
  const desktopBottom = height <= 600 ? 65 : width >= 2800 ? 100 : width >= 1900 ? 86 : 80;
  const top = mobile ? (portrait ? (index >= 9 ? 146 : 66) : Math.min(220, height * .29)) : desktopTop;
  const viewHeight = height - top - (mobile ? 0 : desktopBottom);
  // Non-phone viewports contain the whole physical stage between the fixed
  // control bands. Navy wings absorb aspect-ratio differences without letting
  // navigation cover the opening, restored disc or lower paper foreground.
  let scale = mobile ? Math.max(width / nativeW, viewHeight / nativeH) : Math.min(width / nativeW, viewHeight / nativeH);
  const mobilePosition: Record<number, number> = { 1: .90, 2: .76, 4: .77, 5: .80, 6: .84, 7: .90, 8: .90 };
  const position = mobile && !portrait ? (mobilePosition[index] ?? .72) : .5;
  let stageTop = top + (viewHeight - nativeH * scale) * .5;
  if (mobile && index === 8) {
    // Reserve a visible strip for feedback and the fixed toolbar. The clean
    // plate, repair target, puppet and root sun share this camera adjustment.
    const discBottom = stageTop + (650 + 140) * scale;
    stageTop -= Math.max(0, discBottom - (height - 138));
  }
  if (mobile && portrait && index >= 9 && height <= 700) {
    // A short phone cannot show the complete sky opening and attic resident
    // with a width-cover crop. An inset theatre preserves both physical ends.
    const skyTop = 172;
    const residentBottom = 1478;
    scale = Math.min(scale, Math.max(.2, (height - 82 - skyTop) / (residentBottom - 365)));
    stageTop = skyTop - 365 * scale;
  }
  if (mobile && portrait && width > 500) {
    // Near the phone/tablet boundary, width-cover would enlarge this portrait
    // plate until both the upper aperture and lower attic leave the viewport.
    // Keep its authored subjects inside one inset, undistorted paper stage.
    const skyTop = 172;
    const portraitFit = Math.max(.2, (height - 82 - skyTop) / (1478 - 365));
    scale = Math.min(scale, portraitFit);
    stageTop = skyTop - 365 * scale;
  }
  return { left: (width - nativeW * scale) * position, top: stageTop, scale, width: nativeW * scale, height: nativeH * scale };
}

export class SceneRenderer {
  private serial = 0;
  private key = '';
  index = -1;
  status: 'loading' | 'ready' | 'failed' = 'loading';
  constructor(readonly element: HTMLElement, private onStatus: () => void) {}
  show(index: number, memory: StoryMemory, mobile: boolean, revision: number, retry = false): void {
    const key = `${index}-${mobile}-${revision}`;
    if (key === this.key && !retry) return;
    const changedScene = index !== this.index || !this.key.includes(`-${mobile}-`);
    this.key = key;
    this.index = index;
    this.element.dataset.scene = String(index);
    this.element.className = `scene scene-${index}`;
    const currentImage = this.element.querySelector<HTMLImageElement>('.scene-image');
    if (changedScene || !currentImage || retry) {
      const token = ++this.serial;
      this.status = 'loading';
      const safeIndex = index === 11 ? 8 : index;
      this.element.innerHTML = `<div class="art-plane"><div class="scene-fallback">${renderFallback(safeIndex, memory, mobile)}</div><img class="scene-image" alt="" aria-hidden="true" decoding="async"/><div class="scene-props">${index === 11 ? '' : renderProps(index, memory, mobile)}</div></div><div class="scene-light"></div>`;
      const img = this.element.querySelector<HTMLImageElement>('.scene-image')!;
      this.element.dataset.ready = 'false';
      void loadArt(artUrl(index, mobile), retry).then(art => {
        if (token !== this.serial) return;
        img.src = art.src;
        img.onload = () => {
          if (token !== this.serial) return;
          this.status = 'ready'; this.element.dataset.ready = 'true'; this.onStatus();
        };
        if (img.complete && img.naturalWidth) { this.status = 'ready'; this.element.dataset.ready = 'true'; this.onStatus(); }
      }).catch(() => {
        if (token !== this.serial) return;
        this.status = 'failed'; this.element.dataset.ready = 'false'; this.onStatus();
      });
    } else {
      this.element.querySelector('.scene-props')!.innerHTML = index === 11 ? '' : renderProps(index, memory, mobile);
      if (this.status !== 'ready') this.element.querySelector('.scene-fallback')!.innerHTML = renderFallback(index === 11 ? 8 : index, memory, mobile);
    }
    this.layout(window.innerWidth, window.innerHeight);
  }
  layout(width: number, height: number): void {
    const f = frameFor(this.index, width, height);
    const plane = this.element.querySelector<HTMLElement>('.art-plane');
    if (!plane) return;
    Object.assign(plane.style, { width: `${f.width}px`, height: `${f.height}px`, left: `${f.left}px`, top: `${f.top}px` });
    if (width <= 700) {
      // Reading gaps follow the same native geometry as the art. offsetTop
      // remains in chapter coordinates while the document scrolls, so a
      // transition does not make these gaps chase the fixed stage.
      const repair = frameFor(8, width, height);
      const repairChapter = document.querySelector<HTMLElement>('#ch-09');
      const controls = repairChapter?.querySelector<HTMLElement>('.chapter-controls');
      if (repairChapter && controls) {
        const feedbackTop = repair.top + 790 * repair.scale + 14;
        repairChapter.style.setProperty('--repair-feedback-gap', `${Math.max(14, feedbackTop - controls.offsetTop - controls.offsetHeight)}px`);
      }
      const city = frameFor(9, width, height);
      const copyTop = city.top + 791 * city.scale + 18;
      for (const id of ['#ch-10', '#ch-11']) {
        const chapter = document.querySelector<HTMLElement>(id);
        const heading = chapter?.querySelector<HTMLElement>('h2');
        if (chapter && heading) chapter.style.setProperty('--city-lead-gap', `${Math.max(16, copyTop - heading.offsetTop - heading.offsetHeight)}px`);
      }
    }
  }
  dispose(): void { this.serial++; }
}
