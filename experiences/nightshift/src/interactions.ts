import { chapters, morningTraces, routes } from './content';
import type { MotionMode } from './story-state';

export interface InteractionOptions {
  navigate: (id: string) => void;
  setMotion: (mode: MotionMode) => void;
  getMotion: () => MotionMode;
  setVariant: (chapterId: string, key: string) => void;
}

const SCENE_ERROR = 'This scene could not load. The story remains available in still view.';
const SOUND_ERROR = 'Audio is unavailable in this version.';

/**
 * Wire the actual editorial controls. Native buttons, ranges, anchors and
 * dialogs retain their keyboard behavior. No interaction owns page scrolling.
 */
export function initInteractions(options: InteractionOptions): () => void {
  const controller = new AbortController();
  const signal = controller.signal;
  const openers = new WeakMap<HTMLDialogElement, HTMLElement>();
  const suppressRestore = new WeakSet<HTMLDialogElement>();
  const imageLoads = new Map<HTMLImageElement, () => void>();
  const imageTokens = new WeakMap<HTMLImageElement, number>();
  const imageNotices = new Map<HTMLImageElement, HTMLParagraphElement>();
  const chapterIds = new Set<string>(chapters.map(chapter => chapter.id));
  let disposed = false;
  let imageSequence = 0;

  const one = <T extends Element = HTMLElement>(selector: string): T | null => document.querySelector<T>(selector);
  const all = <T extends Element = HTMLElement>(selector: string): T[] => Array.from(document.querySelectorAll<T>(selector));

  function listen(target: EventTarget | null, event: string, handler: EventListener): void {
    target?.addEventListener(event, handler, { signal });
  }

  function text(selector: string, value: string): void {
    const element = one(selector);
    if (element) element.textContent = value;
  }

  function buttonLabel(button: HTMLElement, value: string): void {
    const label = button.querySelector<HTMLElement>('[data-label]');
    (label ?? button).textContent = value;
    button.setAttribute('aria-label', value);
  }

  function syncDialogState(): void {
    document.body.dataset.dialogOpen = one('dialog[open]') ? 'true' : 'false';
    document.dispatchEvent(new Event('nightshift:dialogchange'));
  }

  function closeDialogs(restoreFocus: boolean): void {
    for (const dialog of all<HTMLDialogElement>('dialog[open]')) {
      if (!restoreFocus) suppressRestore.add(dialog);
      dialog.close();
    }
    syncDialogState();
  }

  function openDialog(name: string, opener: HTMLElement): void {
    const dialog = document.getElementById(`dialog-${name}`);
    if (!(dialog instanceof HTMLDialogElement)) return;
    if (dialog.open) return;
    closeDialogs(false);
    suppressRestore.delete(dialog);
    openers.set(dialog, opener);
    dialog.showModal();
    syncDialogState();
    const initialFocus = dialog.querySelector<HTMLElement>('[autofocus], .dialog-close, button, a[href], [tabindex="0"]');
    initialFocus?.focus({ preventScroll: true });
  }

  for (const dialog of all<HTMLDialogElement>('dialog')) {
    listen(dialog, 'close', () => {
      syncDialogState();
      if (suppressRestore.has(dialog)) {
        suppressRestore.delete(dialog);
        return;
      }
      const opener = openers.get(dialog);
      if (!disposed && !one('dialog[open]') && opener?.isConnected) opener.focus({ preventScroll: true });
    });
    // Native Escape behavior remains intact. A backdrop click also closes.
    listen(dialog, 'click', event => {
      if (event.target !== dialog) return;
      const pointer = event as MouseEvent;
      const bounds = dialog.getBoundingClientRect();
      if (pointer.clientX < bounds.left || pointer.clientX > bounds.right
        || pointer.clientY < bounds.top || pointer.clientY > bounds.bottom) dialog.close();
    });
  }

  function mediaNotice(image: HTMLImageElement, message: string): void {
    let notice = imageNotices.get(image);
    if (!notice && message) {
      notice = document.createElement('p');
      notice.className = 'media-notice';
      notice.setAttribute('role', 'status');
      (image.closest('figure') ?? image.parentElement)?.append(notice);
      imageNotices.set(image, notice);
    }
    if (notice) {
      notice.textContent = message;
      notice.hidden = !message;
    }
  }

  /**
   * A new variant immediately owns a matching small local still. A late image
   * from an older request can warm the cache but cannot change this image.
   * If both versions fail, show the text notice rather than an obsolete image.
   */
  function setImage(image: HTMLImageElement | null, key: string, alt: string): void {
    if (!image) return;
    imageLoads.get(image)?.();
    const token = ++imageSequence;
    imageTokens.set(image, token);
    const request = new AbortController();
    const large = new Image();
    const fallbackUrl = new URL(`${import.meta.env.BASE_URL}nightshift/media/fallback/${key}.webp`, document.baseURI).href;
    const largeUrl = new URL(`${import.meta.env.BASE_URL}nightshift/media/${key}.webp`, document.baseURI).href;
    let fallbackFailed = false;
    let largeFailed = false;
    let fallbackReady = false;
    const current = (): boolean => !disposed && imageTokens.get(image) === token;

    imageLoads.set(image, () => {
      request.abort();
      large.onload = null;
      large.onerror = null;
    });

    image.dataset.mediaKey = key;
    image.dataset.mediaManaged = 'true';
    image.dispatchEvent(new Event('nightshift:mediaowner'));
    image.dataset.mediaPending = 'true';
    image.alt = alt;
    image.removeAttribute('srcset');
    image.hidden = false;
    mediaNotice(image, '');

    image.addEventListener('load', () => {
      if (!current()) return;
      if (image.src === fallbackUrl) fallbackReady = true;
      image.hidden = false;
      if (image.src === largeUrl) {
        image.dataset.mediaPending = 'false';
        mediaNotice(image, '');
      } else if (largeFailed) {
        image.dataset.mediaPending = 'false';
        mediaNotice(image, SCENE_ERROR);
      }
    }, { signal: request.signal });

    image.addEventListener('error', () => {
      if (!current()) return;
      if (image.src === fallbackUrl) {
        fallbackFailed = true;
        image.hidden = true;
        mediaNotice(image, largeFailed ? SCENE_ERROR : 'Preparing the next scene…');
      } else if (image.src === largeUrl) {
        largeFailed = true;
        if (fallbackFailed) image.hidden = true;
        else image.src = fallbackUrl;
        image.dataset.mediaPending = 'false';
        mediaNotice(image, SCENE_ERROR);
      }
    }, { signal: request.signal });

    // The current caption never sits above the previous variant while loading.
    image.src = fallbackUrl;
    large.onload = () => {
      if (!current()) return;
      image.hidden = false;
      image.src = largeUrl;
      image.dataset.mediaPending = 'false';
      mediaNotice(image, '');
    };
    large.onerror = () => {
      if (!current()) return;
      largeFailed = true;
      image.dataset.mediaPending = 'false';
      image.hidden = fallbackFailed;
      if (!fallbackReady && !fallbackFailed && image.src !== fallbackUrl) image.src = fallbackUrl;
      mediaNotice(image, SCENE_ERROR);
    };
    large.src = largeUrl;
  }

  function selectRoute(id: string): void {
    const route = routes.find(item => item.id === id) ?? routes[0];
    for (const button of all<HTMLButtonElement>('[data-route-filter]')) {
      const selected = button.dataset.routeFilter === route.id;
      button.setAttribute('aria-pressed', String(selected));
      button.dataset.selected = String(selected);
    }
    for (const layer of all<SVGElement>('.route-layer[data-route]')) {
      const selected = route.id === 'all' || layer.dataset.route === route.id;
      layer.dataset.active = String(selected);
      layer.style.opacity = route.id === 'all' ? '.8' : selected ? '1' : '.22';
    }
    text('#route-description', route.sentence);
    const link = one<HTMLAnchorElement>('#route-link');
    if (link) {
      // The overview continues to the next story chapter instead of linking to itself.
      const target = route.id === 'all' ? 'ch-03' : route.chapterId;
      const chapter = chapters.find(item => item.id === target);
      link.href = `#${target}`;
      link.dataset.chapterLink = '';
      link.textContent = route.id === 'all' ? 'Continue to the bakery' : `Continue to ${chapter?.name ?? route.label}`;
    }
  }

  const range = one<HTMLInputElement>('#curb-range');
  function compare(value: number): void {
    const amount = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 50));
    const rounded = Math.round(amount * 100) / 100;
    const comparison = range?.closest<HTMLElement>('.comparison') ?? one<HTMLElement>('.comparison');
    comparison?.style.setProperty('--reveal', `${rounded}%`);
    if (comparison) comparison.dataset.value = String(rounded);
    if (range) {
      range.value = String(rounded);
      range.setAttribute('aria-valuetext', `${rounded}% After, ${100 - rounded}% Before`);
    }
    const output = one<HTMLOutputElement>('#comparison-value');
    if (output) {
      output.value = `${rounded}% After`;
      output.textContent = `${rounded}% After`;
    }
    for (const button of all<HTMLButtonElement>('[data-compare]')) {
      const action = button.dataset.compare;
      if (action === 'before' || action === 'after') {
        button.setAttribute('aria-pressed', String(action === 'before' ? rounded === 0 : rounded === 100));
      }
    }
  }
  listen(range, 'input', () => compare(Number(range?.value)));
  listen(range, 'change', () => compare(Number(range?.value)));

  function bakery(value: string, changeImage = true): void {
    const after = value === 'after';
    const key = after ? 'bakery-after' : 'bakery-before';
    for (const button of all<HTMLButtonElement>('[data-bakery]')) {
      button.setAttribute('aria-pressed', String(button.dataset.bakery === (after ? 'after' : 'before')));
    }
    text('[data-bakery-caption]', after
      ? 'After preparation: dough and tools are arranged for the first bake.'
      : 'Before preparation: flour and dough wait on the workbench.');
    if (changeImage) {
      options.setVariant('ch-03', key);
      setImage(one<HTMLImageElement>('#bakery-detail-image'), key, after
        ? 'The same bakery workbench after preparation, with dough and tools arranged for the first bake.'
        : 'The bakery workbench before preparation, with flour and dough waiting beneath a warm lamp.');
    }
  }

  function rail(value: string): void {
    const section = value === 'section';
    const sectionPanel = one<HTMLElement>('#rail-section');
    const surfacePanel = one<HTMLElement>('#rail-surface');
    if (sectionPanel) sectionPanel.hidden = !section;
    if (surfacePanel) surfacePanel.hidden = section;
    for (const button of all<HTMLButtonElement>('[data-rail]')) {
      button.setAttribute('aria-pressed', String(button.dataset.rail === (section ? 'section' : 'surface')));
    }
  }

  function toggleDiagram(button: HTMLElement, selector: string): void {
    const diagram = one<HTMLElement>(selector);
    if (!diagram) return;
    diagram.hidden = !diagram.hidden;
    button.setAttribute('aria-expanded', String(!diagram.hidden));
    button.setAttribute('aria-controls', diagram.id);
  }

  function market(value: string, changeImage = true): void {
    const morning = value === 'first-light';
    const key = morning ? 'market-after' : 'market';
    for (const button of all<HTMLButtonElement>('[data-market]')) {
      button.setAttribute('aria-pressed', String(button.dataset.market === (morning ? 'first-light' : 'night')));
    }
    const caption = morning
      ? 'First light: sorted stems and arranged crates wait for the opening of the market.'
      : 'Night: hands sort stems and crates beneath the canopy work lamps.';
    text('[data-market-caption], #market-caption', caption);
    if (changeImage) {
      options.setVariant('ch-09', key);
      setImage(one<HTMLImageElement>('#market-detail-image'), key, morning
        ? 'The same market work area at first light, with sorted stems and arranged crates ready before opening.'
        : 'Hands sort stems and crates under market canopy lamps in the last hours of the night.');
    }
  }

  function note(kind: string, opener: HTMLElement): void {
    const fiction = kind === 'fiction';
    text('#note-title', fiction ? 'An imagined city' : 'Care after dark');
    text('#note-body', fiction
      ? 'Meridian City is an original fictional composite. Its people, streets and times are invented. The images are original generated scenes, and the amber line is an editorial guide between separate places.'
      : 'This fictional vignette observes preparation without showing patients, personal records or clinical procedures. Water and folded linen stand for small acts of attention. The scene is an imagined moment, not a testimony or an account of a particular institution.');
    openDialog('note', opener);
  }

  function trace(id: string, opener: HTMLElement): void {
    const item = morningTraces.find(candidate => candidate.id === id);
    if (!item) return;
    text('#trace-title', item.label);
    text('#trace-before', item.before);
    text('#trace-after', item.after);
    const chapter = chapters.find(candidate => candidate.id === item.chapterId);
    setImage(one<HTMLImageElement>('#trace-image'), item.image, chapter?.alt ?? item.before);
    const link = one<HTMLAnchorElement>('#trace-return');
    if (link) {
      link.href = `#${item.chapterId}`;
      link.dataset.chapterLink = '';
      link.textContent = 'Return to chapter';
    }
    openDialog('trace', opener);
  }

  function syncMotion(): void {
    const mode = options.getMotion();
    for (const button of all<HTMLElement>('[data-motion-toggle]')) {
      buttonLabel(button, mode === 'full' ? 'Motion: On' : 'Motion: Reduced');
      button.setAttribute('aria-pressed', String(mode !== 'full'));
    }
    for (const button of all<HTMLElement>('[data-stills]')) {
      button.setAttribute('aria-pressed', String(mode === 'stills'));
    }
  }
  listen(document, 'nightshift:motionchange', syncMotion);

  // Original procedural ambience: no recordings, external samples, or requests.
  // Two quiet signals suggest air movement and distant rolling machinery.
  type AudioConstructor = typeof AudioContext;
  const AudioClass: AudioConstructor | undefined = window.AudioContext
    ?? (window as unknown as { webkitAudioContext?: AudioConstructor }).webkitAudioContext;
  let audio: AudioContext | null = null;
  let master: GainNode | null = null;
  let soundOn = false;
  let soundVersion = 0;

  function syncSound(): void {
    for (const button of all<HTMLButtonElement>('[data-sound]')) {
      buttonLabel(button, soundOn ? 'Sound: On' : 'Sound: Off');
      button.setAttribute('aria-pressed', String(soundOn));
    }
  }

  function unavailableSound(): void {
    soundOn = false;
    if (master && audio) master.gain.setValueAtTime(0, audio.currentTime);
    text('#sound-status', SOUND_ERROR);
    syncSound();
  }

  function ensureAudio(): AudioContext | null {
    if (audio) return audio;
    if (!AudioClass) return null;
    try {
      audio = new AudioClass({ latencyHint: 'playback' });
      master = audio.createGain();
      master.gain.value = 0;
      master.connect(audio.destination);

      const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate * 2), audio.sampleRate);
      const channel = buffer.getChannelData(0);
      let randomState = 0x4e534854;
      let previous = 0;
      for (let i = 0; i < channel.length; i++) {
        randomState ^= randomState << 13;
        randomState ^= randomState >>> 17;
        randomState ^= randomState << 5;
        const noise = (randomState >>> 0) / 0xffffffff * 2 - 1;
        previous = previous * .92 + noise * .08;
        channel[i] = previous;
      }
      const air = audio.createBufferSource();
      air.buffer = buffer;
      air.loop = true;
      const filter = audio.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 650;
      const airGain = audio.createGain();
      airGain.gain.value = .045;
      air.connect(filter).connect(airGain).connect(master);
      air.start();

      const rolling = audio.createOscillator();
      rolling.type = 'sine';
      rolling.frequency.value = 52;
      const rollingGain = audio.createGain();
      rollingGain.gain.value = .004;
      rolling.connect(rollingGain).connect(master);
      rolling.start();
      return audio;
    } catch {
      if (audio) void audio.close().catch(() => undefined);
      audio = null;
      master = null;
      return null;
    }
  }

  async function setSound(enabled: boolean): Promise<void> {
    const version = ++soundVersion;
    soundOn = enabled;
    syncSound();
    if (!enabled) {
      if (audio && master) {
        master.gain.cancelScheduledValues(audio.currentTime);
        master.gain.setValueAtTime(0, audio.currentTime);
        await audio.suspend().catch(() => undefined);
      }
      return;
    }
    const context = ensureAudio();
    if (!context || !master) {
      unavailableSound();
      return;
    }
    try {
      if (document.hidden) {
        master.gain.setValueAtTime(0, context.currentTime);
        await context.suspend();
        return;
      }
      await context.resume();
      if (disposed || version !== soundVersion || !soundOn || document.hidden) return;
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setTargetAtTime(1, context.currentTime, .12);
      text('#sound-status', '');
    } catch {
      if (!disposed && version === soundVersion) unavailableSound();
    }
  }

  listen(document, 'visibilitychange', () => {
    if (!audio || !master) return;
    if (document.hidden) {
      ++soundVersion;
      master.gain.cancelScheduledValues(audio.currentTime);
      master.gain.setValueAtTime(0, audio.currentTime);
      void audio.suspend().catch(() => undefined);
    } else if (soundOn) {
      void setSound(true);
    }
  });

  listen(document, 'click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const chapterLink = target.closest<HTMLAnchorElement>('a[data-chapter-link]');
    if (chapterLink) {
      const click = event as MouseEvent;
      if (click.button !== 0 || click.metaKey || click.ctrlKey || click.shiftKey || click.altKey) return;
      const href = chapterLink.getAttribute('href') ?? '';
      const id = href.startsWith('#') ? href.slice(1) : '';
      if (!chapterIds.has(id)) return;
      event.preventDefault();
      closeDialogs(false);
      options.navigate(id);
      return;
    }

    const close = target.closest<HTMLElement>('.dialog-close');
    if (close) {
      close.closest<HTMLDialogElement>('dialog')?.close();
      return;
    }
    const dialogButton = target.closest<HTMLElement>('[data-open-dialog]');
    if (dialogButton) {
      openDialog(dialogButton.dataset.openDialog ?? '', dialogButton);
      return;
    }
    const motionButton = target.closest<HTMLElement>('[data-motion-toggle]');
    if (motionButton) {
      options.setMotion(options.getMotion() === 'full' ? 'reduced' : 'full');
      syncMotion();
      return;
    }
    if (target.closest('[data-stills]')) {
      options.setMotion('stills');
      syncMotion();
      return;
    }
    if (target.closest('[data-sound]')) {
      void setSound(!soundOn);
      return;
    }
    const filter = target.closest<HTMLElement>('[data-route-filter]');
    if (filter) {
      selectRoute(filter.dataset.routeFilter ?? 'all');
      return;
    }
    const comparison = target.closest<HTMLElement>('[data-compare]');
    if (comparison) {
      compare(comparison.dataset.compare === 'before' ? 0 : comparison.dataset.compare === 'after' ? 100 : 50);
      return;
    }
    const preparation = target.closest<HTMLElement>('[data-bakery]');
    if (preparation) {
      bakery(preparation.dataset.bakery ?? 'before');
      return;
    }
    const section = target.closest<HTMLElement>('[data-rail]');
    if (section) {
      rail(section.dataset.rail ?? 'surface');
      return;
    }
    const water = target.closest<HTMLElement>('[data-water]');
    if (water) {
      toggleDiagram(water, '#water-diagram');
      return;
    }
    const utility = target.closest<HTMLElement>('[data-utility]');
    if (utility) {
      toggleDiagram(utility, '#utility-diagram');
      return;
    }
    const editorialNote = target.closest<HTMLElement>('[data-note]');
    if (editorialNote) {
      note(editorialNote.dataset.note ?? 'fiction', editorialNote);
      return;
    }
    const marketButton = target.closest<HTMLElement>('[data-market]');
    if (marketButton) {
      market(marketButton.dataset.market ?? 'night');
      return;
    }
    const traceButton = target.closest<HTMLElement>('[data-trace]');
    if (traceButton) trace(traceButton.dataset.trace ?? '', traceButton);
  });

  listen(document, 'keydown', event => {
    const keyboard = event as KeyboardEvent;
    const target = keyboard.target instanceof Element
      ? keyboard.target.closest<HTMLButtonElement>('[data-route-filter]')
      : null;
    if (!target || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(keyboard.key)) return;
    const filters = all<HTMLButtonElement>('[data-route-filter]').filter(button => !button.disabled);
    const current = filters.indexOf(target);
    if (current < 0 || filters.length === 0) return;
    keyboard.preventDefault();
    const next = keyboard.key === 'Home' ? 0
      : keyboard.key === 'End' ? filters.length - 1
      : (current + (keyboard.key === 'ArrowRight' ? 1 : -1) + filters.length) % filters.length;
    filters[next].focus({ preventScroll: true });
    selectRoute(filters[next].dataset.routeFilter ?? 'all');
  });

  selectRoute(one<HTMLButtonElement>('[data-route-filter][aria-pressed="true"]')?.dataset.routeFilter ?? 'all');
  compare(range ? Number(range.value) : 50);
  bakery(one<HTMLButtonElement>('[data-bakery][aria-pressed="true"]')?.dataset.bakery ?? 'before', false);
  market(one<HTMLButtonElement>('[data-market][aria-pressed="true"]')?.dataset.market ?? 'night', false);
  rail(one<HTMLButtonElement>('[data-rail][aria-pressed="true"]')?.dataset.rail ?? 'surface');
  for (const [selector, panelId] of [['[data-water]', 'water-diagram'], ['[data-utility]', 'utility-diagram']]) {
    const button = one<HTMLElement>(selector);
    const panel = document.getElementById(panelId);
    if (button && panel) {
      button.setAttribute('aria-controls', panelId);
      button.setAttribute('aria-expanded', String(!panel.hidden));
    }
  }
  syncMotion();
  syncSound();
  syncDialogState();
  if (!AudioClass) {
    text('#sound-status', SOUND_ERROR);
    for (const button of all<HTMLButtonElement>('[data-sound]')) button.disabled = true;
  }

  return () => {
    disposed = true;
    ++soundVersion;
    controller.abort();
    closeDialogs(false);
    for (const cancel of imageLoads.values()) cancel();
    imageLoads.clear();
    for (const notice of imageNotices.values()) notice.remove();
    imageNotices.clear();
    if (master && audio) master.gain.setValueAtTime(0, audio.currentTime);
    if (audio) void audio.close().catch(() => undefined);
    audio = null;
    master = null;
  };
}
