type MediaResult = { url: string; fallback: boolean; failed: boolean };
type Slot = HTMLDivElement & { _mediaToken?: number };
const base = import.meta.env.BASE_URL;

/** Each asynchronous result belongs to a key and a slot token, never to a global current image. */
export class SceneMedia {
  private cache = new Map<string, Promise<MediaResult>>();
  private active = new Set<string>();
  private failureKeys = new Set<string>();
  private sequence = 0;
  private destroyed = false;
  private ready = new Set<string>();

  constructor(private onStatus: (failed: boolean) => void) {}

  url(key: string, fallback = false) { return `${base}nightshift/media/${fallback ? 'fallback/' : ''}${key}.webp`; }
  get readyKeys() { return this.ready as ReadonlySet<string>; }

  private load(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { img.onload = null; img.onerror = null; resolve(true); };
      img.onerror = () => { img.onload = null; img.onerror = null; resolve(false); };
      img.src = url;
    });
  }

  private fetch(key: string): Promise<MediaResult> {
    const existing = this.cache.get(key);
    if (existing) return existing;
    const promise = this.load(this.url(key)).then(async (ok) => {
      if (ok) { this.ready.add(key); return { url: this.url(key), fallback: false, failed: false }; }
      const fallbackOk = await this.load(this.url(key, true));
      this.failureKeys.add(key);
      return { url: fallbackOk ? this.url(key, true) : '', fallback: true, failed: !fallbackOk };
    });
    this.cache.set(key, promise);
    return promise;
  }

  setActive(keys: string[]) {
    this.active = new Set(keys);
    this.onStatus(keys.some((key) => this.failureKeys.has(key)));
  }

  setSlot(slot: Slot, key: string, force = false) {
    if (!force && slot.dataset.key === key && slot.dataset.bound === 'true') return;
    const token = ++this.sequence;
    slot._mediaToken = token;
    slot.dataset.key = key;
    slot.dataset.bound = 'true';
    const img = document.createElement('img');
    img.alt = '';
    img.width = key === 'hero-mobile' ? 887 : 1586;
    img.height = key === 'hero-mobile' ? 1774 : 992;
    img.decoding = 'async';
    img.fetchPriority = this.active.has(key) ? 'high' : 'auto';
    img.src = this.ready.has(key) ? this.url(key) : this.url(key, true);
    slot.style.backgroundImage = `url("${this.url(key, true)}")`;
    slot.replaceChildren(img);
    this.fetch(key).then((result) => {
      if (this.destroyed || slot._mediaToken !== token || slot.dataset.key !== key) return;
      if (result.failed) { img.remove(); slot.dataset.failed = 'true'; }
      else { img.src = result.url; delete slot.dataset.failed; }
      if (result.fallback && this.active.has(key)) this.onStatus(true);
    });
  }

  prefetch(keys: string[]) { keys.forEach((key) => { if (key) void this.fetch(key); }); }
  prewarmStills(keys: string[]) { keys.forEach((key) => void this.load(this.url(key, true))); }
  retry() { for (const key of this.active) { this.cache.delete(key); this.failureKeys.delete(key); } this.onStatus(false); }
  destroy() { this.destroyed = true; this.cache.clear(); this.active.clear(); }
}

export function mountInlineImageFallbacks() {
  const cleanups: Array<() => void> = [];
  document.querySelectorAll<HTMLImageElement>('img[data-local-image]').forEach((img) => {
    let note: HTMLParagraphElement | null = null;
    const clearNotice = () => { note?.remove(); note = null; };
    const loaded = () => { if (img.naturalWidth) { img.hidden = false; clearNotice(); } };
    const error = () => {
      // Comparison variants own their request token, fallback and recovery.
      if (img.dataset.mediaManaged === 'true') return;
      const key = img.dataset.mediaKey;
      if (!key) return;
      if (img.dataset.fallbackKey !== key) {
        img.dataset.fallbackKey = key;
        img.src = `${base}media/fallback/${key}.webp`;
      } else {
        img.hidden = true;
        if (note) return;
        note = document.createElement('p');
        note.className = 'media-notice';
        note.setAttribute('role', 'status');
        note.textContent = 'This scene could not load. The story remains available in still view.';
        img.after(note);
      }
    };
    img.addEventListener('error', error);
    img.addEventListener('load', loaded);
    img.addEventListener('nightshift:mediaowner', clearNotice);
    if (img.complete && !img.naturalWidth) error();
    cleanups.push(() => { img.removeEventListener('error', error); img.removeEventListener('load', loaded); img.removeEventListener('nightshift:mediaowner', clearNotice); clearNotice(); });
  });
  return () => cleanups.forEach((fn) => fn());
}
