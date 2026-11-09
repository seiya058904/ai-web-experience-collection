import manifest from './media-manifest.json';

type ArtName = keyof typeof manifest;
const base = `${import.meta.env.BASE_URL}imago/`;
export function art(name: string, small = false): string {
  return `${base}art/${name}${small ? '-768' : ''}.webp`;
}
export function imageMarkup(name: string, alt: string, attrs = ''): string {
  const meta = manifest[name as ArtName];
  return `<img src="${art(name, true)}" srcset="${art(name, true)} 768w, ${art(name)} 1536w" sizes="(max-width: 700px) 100vw, 80vw" width="${meta.width}" height="${meta.height}" alt="${alt}" loading="lazy" decoding="async" data-art="${name}" ${attrs}>`;
}

interface SourceSnapshot {
  element: HTMLSourceElement;
  srcset: string | null;
  media: string | null;
}

interface MediaRecord {
  image: HTMLImageElement;
  src: string | null;
  srcset: string | null;
  sources: SourceSnapshot[];
  fallbackName: ArtName;
  failed: boolean;
  mode: 'network' | 'fallback' | 'retrying';
  group?: RecoveryGroup;
  background: { image: string; size: string; position: string; repeat: string };
}

interface RecoveryGroup {
  owner: Element;
  records: MediaRecord[];
  notice: HTMLDivElement | null;
  message: HTMLSpanElement | null;
  button: HTMLButtonElement | null;
}

function assetName(url: string | null): ArtName | undefined {
  if (!url || url.startsWith('data:')) return undefined;
  try {
    const file = new URL(url, document.baseURI).pathname.split('/').pop() ?? '';
    const name = decodeURIComponent(file).replace(/(?:-768)?\.webp$/, '');
    return Object.hasOwn(manifest, name) ? name as ArtName : undefined;
  } catch {
    return undefined;
  }
}

function firstAsset(srcset: string | null): ArtName | undefined {
  return assetName(srcset?.split(',')[0]?.trim().split(/\s+/)[0] ?? null);
}

function setAttribute(element: Element, name: string, value: string | null): void {
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

/**
 * Keep a ready, target-specific still behind pending network images. Recovery
 * preserves <picture> art direction, and each figure retries its current failed
 * targets rather than retaining a callback to whichever hidden frame failed first.
 */
export function initMediaRecovery(): () => void {
  const cleanups: Array<() => void> = [];
  const records: MediaRecord[] = [];
  const groups = new Map<Element, RecoveryGroup>();
  const queries = new Map<string, MediaQueryList>();
  let disposed = false;
  let queued = false;

  function expectedAsset(record: MediaRecord): ArtName {
    // currentSrc may still refer to the preceding breakpoint or to the embedded
    // fallback. Resolve the original picture sources in their author order.
    for (const source of record.sources) {
      if (source.media && !window.matchMedia(source.media).matches) continue;
      const name = firstAsset(source.srcset);
      if (name) return name;
    }
    return firstAsset(record.srcset) ?? assetName(record.src) ?? record.fallbackName;
  }

  function placeholder(record: MediaRecord): void {
    const image = record.image;
    const style = window.getComputedStyle(image);
    image.style.backgroundImage = `url("${manifest[expectedAsset(record)].fallback}")`;
    image.style.backgroundSize = style.objectFit === 'contain' ? 'contain'
      : style.objectFit === 'fill' ? '100% 100%' : 'cover';
    image.style.backgroundPosition = style.objectPosition || 'center';
    image.style.backgroundRepeat = 'no-repeat';
  }

  function clearPlaceholder(record: MediaRecord): void {
    record.image.style.backgroundImage = record.background.image;
    record.image.style.backgroundSize = record.background.size;
    record.image.style.backgroundPosition = record.background.position;
    record.image.style.backgroundRepeat = record.background.repeat;
  }

  function isCurrent(record: MediaRecord): boolean {
    const image = record.image;
    if (!image.isConnected || image.closest('[hidden]')) return false;
    const media = image.closest<HTMLElement>('[data-media]');
    if (image.dataset.frame && media?.dataset.activeFrame
      && image.dataset.frame !== media.dataset.activeFrame) return false;
    // Handoff frames use visibility; the enhanced desktop Hero uses opacity.
    for (let element: Element | null = image; element; element = element.parentElement) {
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
      if (element === record.group?.owner) break;
    }
    return true;
  }

  function currentFailures(group: RecoveryGroup): MediaRecord[] {
    return group.records.filter(record => record.failed && isCurrent(record));
  }

  function removeNotice(group: RecoveryGroup): void {
    group.notice?.remove();
    group.notice = null;
    group.message = null;
    group.button = null;
  }

  function retry(record: MediaRecord): void {
    record.mode = 'retrying';
    placeholder(record);
    delete record.image.dataset.recovered;
    delete record.image.dataset.fallbackArt;
    setAttribute(record.image, 'src', record.src);
    setAttribute(record.image, 'srcset', record.srcset);
    for (const source of record.sources) {
      setAttribute(source.element, 'media', source.media);
      setAttribute(source.element, 'srcset', source.srcset);
    }
  }

  function syncGroup(group: RecoveryGroup): void {
    const targets = currentFailures(group);
    if (!targets.length) {
      removeNotice(group);
      return;
    }
    if (!group.notice) {
      const notice = document.createElement('div');
      notice.className = 'image-recovery';
      const message = document.createElement('span');
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.imageRetry = '';
      const onRetry = (): void => {
        // Resolve at click time: a different observation may now own the figure.
        for (const record of currentFailures(group)) {
          if (record.mode !== 'retrying') retry(record);
        }
        syncGroup(group);
      };
      button.addEventListener('click', onRetry);
      notice.append(message, button);
      group.owner.append(notice);
      group.notice = notice;
      group.message = message;
      group.button = button;
    }
    const pending = targets.every(record => record.mode === 'retrying');
    group.message!.textContent = pending
      ? 'Loading the full image. A smaller view remains available.'
      : 'A smaller view is shown while the full image is unavailable.';
    group.button!.textContent = targets.length > 1 ? 'Load full images' : 'Load full image';
    group.button!.disabled = pending;
  }

  function queueSync(): void {
    if (disposed || queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      if (!disposed) groups.forEach(syncGroup);
    });
  }

  function useFallback(record: MediaRecord): void {
    record.failed = true;
    record.mode = 'fallback';
    record.fallbackName = expectedAsset(record);
    placeholder(record);
    // A matching <source> overrides img.src. Disable all sources before using
    // the embedded still, while retaining their original responsive attributes.
    for (const source of record.sources) source.element.removeAttribute('srcset');
    record.image.removeAttribute('srcset');
    record.image.dataset.recovered = 'true';
    record.image.dataset.fallbackArt = record.fallbackName;
    record.image.src = manifest[record.fallbackName].fallback;
    queueSync();
  }

  document.querySelectorAll<HTMLImageElement>('img[data-art]').forEach(image => {
    const name = image.dataset.art as ArtName;
    if (!Object.hasOwn(manifest, name)) return;
    const picture = image.parentElement?.tagName === 'PICTURE' ? image.parentElement : null;
    const sources = Array.from(picture?.querySelectorAll<HTMLSourceElement>('source') ?? [])
      .map(element => ({ element, srcset: element.getAttribute('srcset'), media: element.getAttribute('media') }));
    const record: MediaRecord = {
      image, src: image.getAttribute('src'), srcset: image.getAttribute('srcset'), sources,
      fallbackName: name, failed: false, mode: 'network',
      background: {
        image: image.style.backgroundImage, size: image.style.backgroundSize,
        position: image.style.backgroundPosition, repeat: image.style.backgroundRepeat,
      },
    };
    // Contact-sheet buttons and revisit links receive the same still fallback,
    // but must never acquire a nested interactive retry button.
    const owner = image.closest('figure, .hero-art, .handoff__stage');
    if (owner && !image.closest('button, a') && !owner.closest('button, a')) {
      const group = groups.get(owner) ?? { owner, records: [], notice: null, message: null, button: null };
      group.records.push(record);
      groups.set(owner, group);
      record.group = group;
    }
    for (const source of sources) {
      if (source.media && !queries.has(source.media)) queries.set(source.media, window.matchMedia(source.media));
    }
    const fail = (): void => {
      if (!disposed && record.mode !== 'fallback') useFallback(record);
    };
    const loaded = (): void => {
      if (disposed || record.mode === 'fallback') return;
      const current = image.currentSrc || image.src;
      if (current.startsWith('data:') || (assetName(current) && assetName(current) !== expectedAsset(record))) return;
      record.mode = 'network';
      record.failed = false;
      delete image.dataset.recovered;
      delete image.dataset.fallbackArt;
      clearPlaceholder(record);
      queueSync();
    };
    image.addEventListener('error', fail);
    image.addEventListener('load', loaded);
    cleanups.push(() => {
      image.removeEventListener('error', fail);
      image.removeEventListener('load', loaded);
    });
    records.push(record);
    if (image.complete && image.naturalWidth > 0) loaded();
    else if (image.complete && image.naturalWidth === 0 && (record.src || record.srcset)) fail();
    else placeholder(record);
  });

  const breakpointChanged = (): void => {
    for (const record of records) {
      if (!record.sources.length) continue;
      if (record.mode === 'fallback') useFallback(record);
      else placeholder(record);
    }
    queueSync();
  };
  for (const query of queries.values()) {
    query.addEventListener('change', breakpointChanged);
    cleanups.push(() => query.removeEventListener('change', breakpointChanged));
  }
  const observer = new MutationObserver(queueSync);
  observer.observe(document.querySelector('#app') ?? document.body, {
    subtree: true, attributes: true, attributeFilter: ['hidden', 'class', 'data-active-frame', 'data-step'],
  });
  window.addEventListener('imago:observations', queueSync);
  cleanups.push(() => observer.disconnect(), () => window.removeEventListener('imago:observations', queueSync));
  queueSync();

  return () => {
    disposed = true;
    cleanups.forEach(fn => fn());
    groups.forEach(removeNotice);
  };
}
