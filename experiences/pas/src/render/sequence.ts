import type { DanceFrame, Vec3 } from '../motion-types';
import type { StageOptions } from './stage';
import { evaluateDance } from '../motion';
import { asset } from '../assets';

type View = 'wide' | 'narrow';
interface ViewSpec { projectionViewMatrix: number[]; width?: number; height?: number }
interface Manifest {
  version: number; density: number; count: number;
  width: number; height: number; mobileWidth: number; mobileHeight: number;
  views: Record<View, ViewSpec>;
}
interface CachedFrame { image: HTMLImageElement; promise: Promise<HTMLImageElement>; ready: boolean; cancel?: () => void }
const svgNS = 'http://www.w3.org/2000/svg';

/**
 * Exact authored poses, pre-rendered from the same original skinned rig.
 * Images are selected by narrative position; there is no independent video clock.
 * Decode completions may cache a result, but only the current request can display it.
 */
export class DanceSequence {
  private manifest!: Manifest;
  private element: HTMLDivElement;
  private image: HTMLImageElement;
  private overlay: SVGSVGElement;
  private detail: HTMLDivElement;
  private detailImage: HTMLImageElement;
  private detailFrames = new Map<string, HTMLImageElement>();
  private detailRequested = '';
  private loadingDetail?: HTMLImageElement;
  private cache = new Map<string, CachedFrame>();
  private posters = new Map<string, HTMLImageElement>();
  private token = 0;
  private requested = '';
  private current = '';
  private currentChapter = -1;
  private disposed = false;
  private mobile = innerWidth < 960 && innerWidth / innerHeight <= 1.25;
  private frame?: DanceFrame;
  private options?: StageOptions;
  private base = 'frames/';
  private errorNotice: HTMLParagraphElement;
  readonly rendererKind = 'authored-sequence';
  displayedT = 0;

  constructor(private canvas: HTMLCanvasElement, private onFailure: (reason: string) => void) {
    const query = new URLSearchParams(location.search);
    if (query.get('qa') === '1' && ['frames', 'all'].includes(query.get('fault') ?? '')) this.base = '__qa_missing_frames__/';
    this.element = document.createElement('div'); this.element.className = 'sequence-stage';
    this.image = new Image(); this.image.alt = ''; this.image.decoding = 'async'; this.image.className = 'sequence-image';
    this.overlay = document.createElementNS(svgNS, 'svg'); this.overlay.setAttribute('aria-hidden', 'true'); this.overlay.setAttribute('preserveAspectRatio', 'xMidYMid meet'); this.overlay.classList.add('sequence-overlay');
    this.errorNotice = document.createElement('p'); this.errorNotice.className = 'sequence-error'; this.errorNotice.hidden = true;
    this.errorNotice.textContent = 'This moment could not be loaded. Try another moment, or return when the connection is available.';
    this.element.append(this.image, this.overlay, this.errorNotice);
    this.detail = document.createElement('div'); this.detail.className = 'sequence-detail'; this.detail.hidden = true;
    this.detailImage = new Image(); this.detailImage.alt = ''; this.detailImage.decoding = 'async'; this.detail.append(this.detailImage);
    canvas.parentElement!.append(this.element, this.detail);
    document.documentElement.classList.add('native-render');
  }

  async load(t = 0, mode = 'unison') {
    const response = await fetch(asset(`${this.base}manifest.json`));
    if (!response.ok) throw new Error('The movement sequence could not be loaded.');
    this.manifest = await response.json() as Manifest;
    if (this.manifest.version !== 1 || !this.manifest.count || !this.manifest.density) throw new Error('The movement sequence has an unsupported format.');
    const key = this.key(t, mode);
    for (const view of ['wide', 'narrow'] as const) for (let chapter = 0; chapter < 10; chapter++) {
      const poster = new Image(); poster.decoding = 'async';
      poster.onload = () => { if (!this.disposed) this.posters.set(`${view}/${chapter}`, poster); };
      poster.src = asset(`${this.base}posters-${view}/ch-${String(chapter + 1).padStart(2, '0')}.webp`);
    }
    const image = await this.prepare(key);
    if (!this.disposed) { this.image.src = image.src; this.current = key; this.currentChapter = Math.min(9, Math.floor(t)); this.element.dataset.frame = `${t}`; this.displayedT = t; }
  }

  resize() { this.mobile = innerWidth < 960 && innerWidth / innerHeight <= 1.25; this.requested = ''; }

  private index(t: number) { return Math.min(this.manifest.count - 1, Math.max(0, Math.round(t * this.manifest.density))); }
  private key(t: number, mode: string, view: View = this.mobile ? 'narrow' : 'wide') {
    const index = this.index(t);
    const echo = mode === 'echo' && index >= 4 * this.manifest.density && index <= Math.round(4.76 * this.manifest.density);
    return `${echo ? 'echo-' : ''}${view}/${String(index).padStart(4, '0')}.webp`;
  }

  private prepare(key: string): Promise<HTMLImageElement> {
    const existing = this.cache.get(key);
    if (existing) { this.cache.delete(key); this.cache.set(key, existing); return existing.promise; }
    const image = new Image(); image.decoding = 'async';
    const entry: CachedFrame = { image, ready: false, promise: Promise.resolve(image) };
    let cancelled = false;
    entry.promise = new Promise<HTMLImageElement>((resolve, reject) => {
      entry.cancel = () => { cancelled = true; image.onload = null; image.onerror = null; image.removeAttribute('src'); reject(new Error('Superseded movement frame.')); };
      image.onload = () => {
        const finish = () => {
          if (cancelled) return;
          const query = new URLSearchParams(location.search);
          const delay = query.get('qa') === '1' && query.get('fault') === 'slow' ? [850, 300, 40][Number(key.match(/(\d+)\.webp/)?.[1] ?? 0) % 3] : 0;
          if (delay) setTimeout(() => { if (!cancelled) { entry.ready = true; resolve(image); } }, delay);
          else { entry.ready = true; resolve(image); }
        };
        void image.decode().then(finish).catch(finish);
      };
      image.onerror = () => { if (this.cache.get(key) === entry) this.cache.delete(key); reject(new Error(`The movement frame could not be loaded: ${key}`)); };
      image.src = asset(this.base + key);
    });
    this.cache.set(key, entry);
    const limit = this.mobile ? 8 : 12;
    while (this.cache.size > limit) {
      const oldest = this.cache.keys().next().value!;
      if (oldest === this.current || oldest === this.requested) { const item = this.cache.get(oldest)!; this.cache.delete(oldest); this.cache.set(oldest, item); }
      else { const removed = this.cache.get(oldest); if (!removed?.ready) removed?.cancel?.(); this.cache.delete(oldest); }
    }
    return entry.promise;
  }

  private commit(key: string, image: HTMLImageElement, frame: DanceFrame, options: StageOptions) {
    if (this.disposed || this.requested !== key) return;
    frame = this.frame ?? frame; options = this.options ?? options;
    this.image.src = image.src; this.image.style.visibility = 'visible'; this.errorNotice.hidden = true;
    this.current = key; this.currentChapter = frame.chapter; this.displayedT = this.index(frame.t) / this.manifest.density;
    this.element.dataset.frame = this.displayedT.toFixed(3);
    this.element.dataset.sequence = frame.timingMode;
    this.element.dataset.cache = `${this.cache.size}`;
    this.element.dataset.pending = 'false';
    this.drawOverlay(frame, options);
    this.showDetail(frame, options, image);
    window.dispatchEvent(new CustomEvent('pas-frame', { detail: { t: this.displayedT, key } }));
  }

  render(frame: DanceFrame, options: StageOptions) {
    if (this.disposed || !this.manifest) return;
    frame = evaluateDance(this.index(frame.t) / this.manifest.density, { mode: frame.timingMode, layout: 'wide' });
    this.frame = frame; this.options = options;
    const key = this.key(frame.t, frame.timingMode);
    if (key === this.requested) { if (key === this.current) { this.drawOverlay(frame, options); this.showDetail(frame, options, this.image); } return; }
    this.requested = key; const token = ++this.token;
    this.element.dataset.pending = 'true';
    const cached = this.cache.get(key);
    if (cached?.ready) this.commit(key, cached.image, frame, options);
    else {
      // Never leave another chapter's bodies underneath the target chapter's words.
      if (frame.chapter !== this.currentChapter || this.current.split('/')[0].replace('echo-', '') !== (this.mobile ? 'narrow' : 'wide')) {
        const poster = this.posters.get(`${this.mobile ? 'narrow' : 'wide'}/${frame.chapter}`);
        if (poster) { this.image.src = poster.src; this.image.style.visibility = 'visible'; }
        else this.image.style.visibility = 'hidden';
        this.overlay.innerHTML = ''; this.detail.hidden = true;
      }
      void this.prepare(key).then(image => { if (token === this.token) this.commit(key, image, frame, options); }).catch(() => {
        if (token !== this.token || this.disposed) return;
        const stableT = Math.min(9.7, frame.chapter + .5);
        const stableKey = this.key(stableT, frame.timingMode);
        void this.prepare(stableKey).then(image => {
          if (token !== this.token || this.disposed) return;
          this.image.src = image.src; this.image.style.visibility = 'visible'; this.current = stableKey; this.currentChapter = frame.chapter;
          this.displayedT = this.index(stableT) / this.manifest.density; this.element.dataset.frame = `${this.displayedT}`;
          this.element.dataset.pending = 'false'; this.errorNotice.hidden = true; this.overlay.innerHTML = ''; this.detail.hidden = true;
          window.dispatchEvent(new CustomEvent('pas-frame', { detail: { t: this.displayedT, key: stableKey, fallback: true } }));
          this.onFailure('frame');
        }).catch(() => { if (token === this.token) { this.element.dataset.pending = 'false'; this.errorNotice.hidden = false; this.onFailure('frame'); } });
      });
    }
    // Small, bounded neighbourhood. No full-performance eager downloads.
    const i = this.index(frame.t);
    for (const offset of [-2, -1, 1, 2, 3]) {
      const next = i + offset;
      if (next >= 0 && next < this.manifest.count) void this.prepare(this.key(next / this.manifest.density, frame.timingMode)).catch(() => {});
    }
  }

  setVisible(visible: boolean) { this.element.hidden = !visible; if (!visible) this.detail.hidden = true; }

  private dimensions() { return this.mobile ? [this.manifest.mobileWidth, this.manifest.mobileHeight] : [this.manifest.width, this.manifest.height]; }
  private project(p: Vec3, view: View = this.mobile ? 'narrow' : 'wide') {
    const m = this.manifest.views[view].projectionViewMatrix;
    const [x, y, z] = p;
    const w = m[3] * x + m[7] * y + m[11] * z + m[15];
    const nx = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
    const ny = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
    const width = view === 'wide' ? this.manifest.width : this.manifest.mobileWidth;
    const height = view === 'wide' ? this.manifest.height : this.manifest.mobileHeight;
    return [(nx * .5 + .5) * width, (-ny * .5 + .5) * height];
  }

  private drawOverlay(frame: DanceFrame, options: StageOptions) {
    const [w, h] = this.dimensions(); this.overlay.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const shapes: string[] = [];
    if (options.ground) for (const id of ['cen', 'cheng'] as const) for (const side of ['left', 'right'] as const) {
      const foot = frame.poses[id].feet[side]; if (!foot.planted) continue;
      const a = foot.ankle, b = foot.toe;
      const p: Vec3 = [(a[0] + b[0]) / 2, .005, (a[2] + b[2]) / 2];
      const [x, y] = this.project(p);
      shapes.push(`<ellipse cx="${x}" cy="${y}" rx="22" ry="5" fill="none" stroke="${id === 'cen' ? '#963f32' : '#514638'}" stroke-width="1.6"/>`);
    }
    if (options.paths) for (const id of ['cen', 'cheng'] as const) {
      const points = frame.travelled[id].map(p => this.project(p).join(',')).join(' ');
      shapes.push(`<polyline points="${points}" fill="none" stroke="${id === 'cen' ? '#963f32' : '#66584a'}" stroke-width="1.6" stroke-dasharray="5 5"/>`);
    }
    if (options.focus) {
      const p = frame.poses[options.focus].root; const [x, y] = this.project([p[0], .01, p[2]]);
      shapes.push(`<path d="M ${x - 12} ${y + 20} h 24" stroke="${options.focus === 'cen' ? '#963f32' : '#514638'}" stroke-width="2"/>`);
    }
    this.overlay.innerHTML = shapes.join('');
  }

  private showDetail(frame: DanceFrame, options: StageOptions, image: HTMLImageElement) {
    const auto = frame.camera.detail !== 'full' && frame.camera.detailMix > .72;
    const show = frame.chapter === 2 ? options.detail : options.detail || auto;
    this.detail.hidden = !show;
    document.documentElement.classList.toggle('has-detail', show);
    if (!show) { this.detailRequested = ''; if (this.loadingDetail) { this.loadingDetail.onload = null; this.loadingDetail.removeAttribute('src'); this.loadingDetail = undefined; } return; }
    const feet = !options.detail && frame.camera.detail === 'feet';
    const sample = Math.round(frame.t * this.manifest.density);
    const exactDetail = feet && sample >= 200 && sample <= 352 ? 'detail-feet' : !feet && ((sample >= 400 && sample <= 552) || (sample >= 1596 && sample <= 1660)) ? 'detail-hands' : null;
    if (exactDetail) {
      const source = asset(`${this.base}${exactDetail}/${String(sample).padStart(4, '0')}.webp`);
      const commitDetail = (detail: HTMLImageElement) => {
        if (this.disposed || this.detailRequested !== source || this.detail.hidden) return;
        this.detailImage.src = detail.src;
        this.detailImage.style.cssText = 'width:100%;height:100%;left:0;top:0;object-fit:contain';
      };
      if (this.detailRequested === source) return;
      if (this.loadingDetail) { this.loadingDetail.onload = null; this.loadingDetail.removeAttribute('src'); this.loadingDetail = undefined; }
      this.detailRequested = source;
      const cached = this.detailFrames.get(source);
      if (cached) { commitDetail(cached); return; }
      const closeup = new Image(); closeup.decoding = 'async';
      this.loadingDetail = closeup;
      closeup.onload = () => { if (this.loadingDetail === closeup) this.loadingDetail = undefined; if (this.disposed) return; this.detailFrames.set(source, closeup); if (this.detailFrames.size > 6) this.detailFrames.delete(this.detailFrames.keys().next().value!); commitDetail(closeup); };
      closeup.src = source;
    } else this.detailRequested = '';
    const target: Vec3 = feet ? [0, .15, .05] : frame.contact.point ?? frame.camera.detailTarget;
    const [x, y] = this.project(target, this.mobile ? 'narrow' : 'wide');
    const [width, height] = this.dimensions();
    const rect = this.detail.getBoundingClientRect();
    const scale = feet ? 1.6 : 2.75;
    const factor = rect.width / width * scale;
    this.detailImage.src = image.src;
    this.detailImage.style.width = `${width * factor}px`; this.detailImage.style.height = `${height * factor}px`;
    this.detailImage.style.left = `${rect.width / 2 - x * factor}px`; this.detailImage.style.top = `${rect.height / 2 - y * factor}px`;
  }

  dispose() { this.disposed = true; this.token++; if (this.loadingDetail) { this.loadingDetail.onload = null; this.loadingDetail.removeAttribute('src'); } for (const frame of this.cache.values()) if (!frame.ready) frame.cancel?.(); this.cache.clear(); this.posters.clear(); this.detailFrames.clear(); this.element.remove(); this.detail.remove(); }
}
