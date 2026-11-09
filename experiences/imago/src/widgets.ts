import {
  readObservationState,
  updateObservationState,
  type ObservationState,
} from './state';

type ChoiceKey = Exclude<keyof ObservationState, 'motion' | 'reveal'>;
type MediaName = 'larva' | 'pupation' | 'observer' | 'emergence' | 'wing';

const choiceKeys: ReadonlySet<string> = new Set<ChoiceKey>([
  'eggZoom', 'larvaStage', 'instar', 'pupationStage', 'developmentView',
  'observationStage', 'comparison', 'emergenceStep', 'wingStage', 'wingDetail', 'departed',
]);

const captions = {
  larva: {
    hatchling: 'Just hatched. A pale body, before the familiar bands become clear.',
    third: 'Later · third instar. The striped caterpillar feeds along the leaf’s edge.',
  },
  pupation: {
    j: 'Hanging in a J. The rear end holds the silk pad; the head curls upward below.',
    forming: 'Forming a chrysalis. The last larval skin gathers near the attachment as the green pupa is revealed.',
    pupa: 'The settled chrysalis. Its cremaster secures it to the small silk pad.',
  },
  observer: {
    early: 'Early chrysalis. A newly formed, pale green surface settles into shape.',
    middle: 'Middle chrysalis. The familiar green covering offers little outward change to see.',
    late: 'Late chrysalis. Orange and black patterns become recognizable as pigment develops in the wing scales.',
  },
  emergence: [
    'The covering opens. The adult is still mostly within the pupal covering.',
    'The body emerges. One continuous body passes through the opening.',
    'Finding a grip. Supporting feet establish contact with the empty shell.',
    'Resting beneath the shell. The butterfly is out, but its wings are still soft and folded.',
  ],
  wing: {
    folded: 'Folded wings. The newly emerged butterfly remains supported beneath the empty shell.',
    expanding: 'Expanding wings. Hemolymph helps the wings unfold; they are not inflated with air.',
    open: 'Open, then ready. The wings gain their shape and still need time to dry and stiffen.',
  },
} as const;

const instarDetails = [
  'First instar. The newly hatched larva is pale; markings can appear later in this instar.',
  'Second instar. The familiar black, white, and yellow bands become clearer after the first molt.',
  'Third instar. A larger striped larva feeds along the leaf’s edge.',
  'Fourth instar. Another molt makes room for continued growth.',
  'Fifth instar. The last larval instar leads toward the search for support and the hanging J posture.',
] as const;

const wingDetails = {
  whole: 'Two forewings and two hindwings meet at the thorax. The close views come from this same image.',
  forewing: 'Forewing. The longer, more angular upper wing carries orange fields divided by black veins.',
  hindwing: 'Hindwing. The rounder lower wing overlaps the forewing. Its outline is a different shape.',
  body: 'Body. The wings and legs meet at the thorax. The small front pair of legs is held close to the body.',
} as const;

interface MediaSlot {
  element: HTMLElement;
  name: MediaName;
  target: HTMLImageElement | null;
  generation: number;
  release: () => void;
}

/**
 * Observation choices are independent from narrative scroll progress.
 * Each prepared frame owns its own image element: an old request cannot replace
 * a newly selected frame, and no alpha crossfade invents an intermediate body.
 */
export function initObservationTools(): { destroy: () => void } {
  let state = readObservationState();
  let destroyed = false;
  let departureTimer: number | undefined;
  let departureRun = 0;
  let departing = false;
  const cleanups: Array<() => void> = [];
  const root = document;
  const all = <T extends Element = HTMLElement>(selector: string): T[] =>
    Array.from(root.querySelectorAll<T>(selector));
  const mediaSlots: MediaSlot[] = all<HTMLElement>('[data-media]').flatMap((element) => {
    const name = element.dataset.media;
    return name && ['larva', 'pupation', 'observer', 'emergence', 'wing'].includes(name)
      ? [{ element, name: name as MediaName, target: null, generation: 0, release: () => {} }]
      : [];
  });

  function listen<T extends EventTarget>(target: T, type: string, handler: EventListener): void {
    target.addEventListener(type, handler);
    cleanups.push(() => target.removeEventListener(type, handler));
  }

  function text(selector: string, content: string): void {
    for (const element of all(selector)) {
      if (element.textContent !== content) element.textContent = content;
    }
  }

  function announce(content: string): void {
    if (!destroyed) text('[data-observation-status]', content);
  }

  function selectedFrame(name: MediaName): string {
    switch (name) {
      case 'larva': return state.larvaStage;
      case 'pupation': return state.pupationStage;
      case 'observer': return state.observationStage;
      case 'emergence': return String(state.emergenceStep);
      case 'wing': return state.wingStage;
    }
  }

  function mediaCaption(name: MediaName): string {
    switch (name) {
      case 'larva': return captions.larva[state.larvaStage];
      case 'pupation': return captions.pupation[state.pupationStage];
      case 'observer': return captions.observer[state.observationStage];
      case 'emergence': return captions.emergence[state.emergenceStep];
      case 'wing': return captions.wing[state.wingStage];
    }
  }

  function mediaStatus(slot: MediaSlot, value: string): void {
    const element = slot.element.querySelector<HTMLElement>('[data-media-status]');
    if (element && element.textContent !== value) element.textContent = value;
  }

  function observeImage(slot: MediaSlot, image: HTMLImageElement, loadNow: boolean): void {
    slot.release();
    const generation = ++slot.generation;
    slot.target = image;
    const stillCurrent = (): boolean => !destroyed && slot.generation === generation && slot.target === image;
    const settled = (loaded: boolean): void => {
      if (!stillCurrent()) return;
      slot.element.setAttribute('aria-busy', 'false');
      slot.element.dataset.resourceState = loaded ? 'ready' : 'error';
      image.dataset.resourceState = loaded ? 'ready' : 'error';
      mediaStatus(slot, loaded ? '' : 'This image could not load. The chapter and its observations remain available.');
    };
    const loaded = (): void => settled(image.naturalWidth > 0);
    const failed = (): void => settled(false);
    image.addEventListener('load', loaded);
    image.addEventListener('error', failed);
    slot.release = () => {
      image.removeEventListener('load', loaded);
      image.removeEventListener('error', failed);
    };

    // Initial rendering keeps the page's lazy-loading policy intact. Only an
    // explicit observation action requests its target immediately.
    if (loadNow) {
      image.loading = 'eager';
      if (image.dataset.srcset && !image.getAttribute('srcset')) image.srcset = image.dataset.srcset;
      if (image.dataset.src && image.getAttribute('src') !== image.dataset.src) image.src = image.dataset.src;
    }
    const hasSource = Boolean(image.currentSrc || image.getAttribute('src') || image.getAttribute('srcset'));
    if (hasSource && image.complete && image.naturalWidth > 0) {
      settled(true);
    } else if (hasSource && image.complete && image.naturalWidth === 0) {
      settled(false);
    } else {
      slot.element.setAttribute('aria-busy', hasSource || loadNow ? 'true' : 'false');
      slot.element.dataset.resourceState = hasSource || loadNow ? 'loading' : 'deferred';
      mediaStatus(slot, hasSource || loadNow ? 'Loading this observation…' : '');
    }
  }

  function renderMedia(loadKey?: keyof ObservationState): void {
    const keyForMedia: Record<MediaName, keyof ObservationState> = {
      larva: 'larvaStage', pupation: 'pupationStage', observer: 'observationStage',
      emergence: 'emergenceStep', wing: 'wingStage',
    };
    for (const slot of mediaSlots) {
      const value = selectedFrame(slot.name);
      const images = Array.from(slot.element.querySelectorAll<HTMLImageElement>('img[data-frame]'));
      const target = images.find((image) => image.dataset.frame === value) ?? null;
      slot.element.dataset.activeFrame = value;
      for (const image of images) image.hidden = image !== target;
      if (target && (slot.target !== target || loadKey === keyForMedia[slot.name])) {
        observeImage(slot, target, loadKey === keyForMedia[slot.name]);
      } else if (!target) {
        slot.release();
        slot.generation += 1;
        slot.target = null;
        slot.element.setAttribute('aria-busy', 'false');
        slot.element.dataset.resourceState = 'error';
        mediaStatus(slot, 'This observation is unavailable. Its description remains below.');
      }
      text(`[data-caption="${slot.name}"]`, mediaCaption(slot.name));
    }
  }

  function renderChoices(): void {
    for (const button of all<HTMLButtonElement>('button[data-state-key]')) {
      const key = button.dataset.stateKey;
      if (!key || !choiceKeys.has(key)) continue;
      const value = button.dataset.stateValue;
      const selected = value === 'toggle'
        ? state[key as ChoiceKey] === true
        : String(state[key as ChoiceKey]) === value;
      button.setAttribute('aria-pressed', String(selected));
    }
    for (const group of all<HTMLElement>('[data-choice-group]')) {
      const buttons = Array.from(group.querySelectorAll<HTMLButtonElement>('button[data-state-key]'))
        .filter((button) => button.closest('[data-choice-group]') === group && !button.disabled && !button.hidden);
      const keys = new Set(buttons.map((button) => button.dataset.stateKey));
      for (const key of keys) {
        const choices = buttons.filter((button) => button.dataset.stateKey === key);
        if (choices.length < 2) continue;
        const selected = choices.find((button) => button.getAttribute('aria-pressed') === 'true') ?? choices[0];
        for (const button of choices) button.tabIndex = button === selected ? 0 : -1;
      }
    }
  }

  function renderReveal(): void {
    for (const input of all<HTMLInputElement>('[data-reveal]')) input.value = String(state.reveal);
    for (const element of all<HTMLElement>('[data-reveal-view]')) {
      element.style.setProperty('--reveal', `${state.reveal}%`);
    }
    text('[data-reveal-value]', `${Math.round(state.reveal)}%`);
  }

  function renderDeparture(): void {
    for (const scene of all<HTMLElement>('[data-departure-scene]')) {
      // One synchronous state change swaps the supported photograph for the
      // empty scene and flight layer; the alpha is never a resting animal.
      scene.dataset.departureState = departing ? 'leaving' : state.departed ? 'departed' : 'resting';
      scene.classList.toggle('has-departed', state.departed);
      scene.classList.toggle('is-departing', departing);
      scene.dataset.departed = String(state.departed);
      const resting = scene.querySelector<HTMLImageElement>('.ending-resting');
      const empty = scene.querySelector<HTMLImageElement>('.ending-empty');
      const flight = scene.querySelector<HTMLImageElement>('.departure-butterfly');
      if (resting) resting.hidden = departing || state.departed;
      if (empty) empty.hidden = !departing && !state.departed;
      if (flight) flight.hidden = !departing;
    }
    for (const button of all<HTMLButtonElement>('[data-watch-departure]')) button.disabled = departing || state.departed;
    for (const button of all<HTMLButtonElement>('[data-show-final]')) button.disabled = state.departed;
    for (const button of all<HTMLButtonElement>('[data-reset-departure]')) button.disabled = !departing && !state.departed;
    text('[data-departure-status]', departing
      ? 'Leaving the branch.'
      : state.departed
        ? 'The butterfly has gone. The empty shell remains at its old attachment.'
        : 'A last moment on the branch. You may watch the departure or go straight to the final view.');
  }

  function render(loadKey?: keyof ObservationState): void {
    renderChoices();
    renderMedia(loadKey);
    for (const element of all<HTMLElement>('[data-egg-view]')) element.classList.toggle('is-zoomed', state.eggZoom);
    text('[data-caption="egg"]', state.eggZoom
      ? 'A closer view of the same egg. Raised ribs run along the pale shell.'
      : 'One egg beneath a milkweed leaf. The veins hold its place in view.');
    for (const element of all<HTMLElement>('[data-development-schematic]')) element.hidden = state.developmentView !== 'schematic';
    for (const element of all<HTMLElement>('[data-development-surface]')) element.hidden = state.developmentView !== 'surface';
    for (const element of all<HTMLElement>('[data-comparison-panel]')) element.hidden = !state.comparison;
    for (const element of all<HTMLElement>('[data-observer-single]')) element.hidden = state.comparison;
    text('[data-observation-stage]', `${state.observationStage[0].toUpperCase()}${state.observationStage.slice(1)}`);
    renderReveal();
    for (const button of all<HTMLButtonElement>('[data-emergence-prev]')) button.disabled = state.emergenceStep === 0;
    for (const button of all<HTMLButtonElement>('[data-emergence-next]')) button.disabled = state.emergenceStep === 3;
    text('[data-emergence-count]', `${state.emergenceStep + 1} / 4`);
    text('[data-instar-detail]', instarDetails[state.instar - 1]);
    for (const element of all<HTMLElement>('[data-instar-scale]')) element.dataset.instar = String(state.instar);
    for (const element of all<HTMLElement>('[data-wing-window]')) {
      element.dataset.detail = state.wingDetail;
      element.hidden = state.wingDetail === 'whole' || state.wingStage !== 'open';
    }
    text('[data-wing-detail-copy]', wingDetails[state.wingDetail]);
    renderDeparture();
  }

  function statusFor(key: keyof ObservationState): string {
    switch (key) {
      case 'eggZoom': return state.eggZoom ? 'Closer view of the same egg.' : 'The whole leaf view is restored.';
      case 'larvaStage': return captions.larva[state.larvaStage];
      case 'instar': return instarDetails[state.instar - 1];
      case 'pupationStage': return captions.pupation[state.pupationStage];
      case 'developmentView': return state.developmentView === 'schematic'
        ? 'Developmental schematic — not measured internal imagery.' : 'The surface view is restored.';
      case 'observationStage': return captions.observer[state.observationStage];
      case 'comparison': return state.comparison ? 'Comparison view is open.' : 'Single observation view is restored.';
      case 'reveal': return `Comparison reveal: ${Math.round(state.reveal)} percent.`;
      case 'emergenceStep': return captions.emergence[state.emergenceStep];
      case 'wingStage': return captions.wing[state.wingStage];
      case 'wingDetail': return wingDetails[state.wingDetail];
      case 'departed': return state.departed ? 'The final view is ready. The empty shell remains.' : 'The last moment on the branch is restored.';
      case 'motion': return '';
    }
  }

  function commit(patch: Partial<ObservationState>, key: keyof ObservationState, shouldAnnounce = true): void {
    if (destroyed) return;
    state = updateObservationState(patch);
    render(key === 'wingDetail' ? 'wingStage' : key);
    if (shouldAnnounce) announce(statusFor(key));
    window.dispatchEvent(new CustomEvent('imago:observations', { detail: { state: { ...state }, key } }));
  }

  function cancelDeparture(): void {
    departureRun += 1;
    if (departureTimer !== undefined) window.clearTimeout(departureTimer);
    departureTimer = undefined;
    departing = false;
  }

  function finishDeparture(shouldAnnounce = true): void {
    cancelDeparture();
    commit({ departed: true }, 'departed', shouldAnnounce);
  }

  function startDeparture(): void {
    state = readObservationState();
    if (destroyed || departing || state.departed) return;
    const prefersReduced = document.documentElement.dataset.motion === 'reduced';
    if (prefersReduced) {
      finishDeparture();
      return;
    }
    cancelDeparture();
    const run = departureRun;
    departing = true;
    renderDeparture();
    announce('The butterfly leaves the branch.');
    const configuredDuration = Number(root.querySelector<HTMLElement>('[data-departure-scene]')?.dataset.departureDuration);
    const duration = Number.isFinite(configuredDuration) && configuredDuration >= 800 && configuredDuration <= 5000
      ? configuredDuration : 2200;
    departureTimer = window.setTimeout(() => {
      if (!destroyed && departing && departureRun === run) finishDeparture();
    }, duration);
  }

  function choose(button: HTMLButtonElement): void {
    const key = button.dataset.stateKey;
    const raw = button.dataset.stateValue;
    if (!key || !choiceKeys.has(key) || raw === undefined || button.disabled) return;
    state = readObservationState();
    const current = state[key as ChoiceKey];
    if (typeof current === 'boolean' && !['true', 'false', 'toggle'].includes(raw)) return;
    const value = typeof current === 'boolean'
      ? raw === 'toggle' ? !current : raw === 'true'
      : typeof current === 'number' ? Number(raw) : raw;
    const patch = { [key]: value } as Partial<ObservationState>;
    if (key === 'wingDetail' && value !== 'whole') patch.wingStage = 'open';
    if (key === 'wingStage' && value !== 'open') patch.wingDetail = 'whole';
    if (key === 'departed') cancelDeparture();
    commit(patch, key as ChoiceKey);
  }

  listen(root, 'click', ((event: MouseEvent) => {
    const element = event.target instanceof Element ? event.target : null;
    const button = element?.closest<HTMLButtonElement>('button');
    if (!button || button.disabled) return;
    if (button.matches('[data-state-key]')) choose(button);
    else if (button.matches('[data-reset-observation]')) {
      commit({ observationStage: 'middle', comparison: false, reveal: 50 }, 'observationStage', false);
      announce('Observation reset. Middle chrysalis, single view, comparison at 50 percent.');
    } else if (button.matches('[data-emergence-prev]')) {
      state = readObservationState();
      commit({ emergenceStep: Math.max(0, state.emergenceStep - 1) }, 'emergenceStep');
    } else if (button.matches('[data-emergence-next]')) {
      state = readObservationState();
      commit({ emergenceStep: Math.min(3, state.emergenceStep + 1) }, 'emergenceStep');
    } else if (button.matches('[data-watch-departure]')) startDeparture();
    else if (button.matches('[data-show-final]')) finishDeparture();
    else if (button.matches('[data-reset-departure]')) {
      cancelDeparture();
      commit({ departed: false }, 'departed');
    }
  }) as EventListener);

  listen(root, 'keydown', ((event: KeyboardEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest<HTMLButtonElement>('button[data-state-key]');
    const group = button?.closest<HTMLElement>('[data-choice-group]');
    if (!button || !group || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    const buttons = Array.from(group.querySelectorAll<HTMLButtonElement>('button[data-state-key]'))
      .filter((candidate) => candidate.dataset.stateKey === button.dataset.stateKey
        && candidate.closest('[data-choice-group]') === group && !candidate.disabled && !candidate.hidden);
    if (buttons.length < 2) return;
    const index = buttons.indexOf(button);
    let next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
      : (index + (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1) + buttons.length) % buttons.length;
    if (next < 0) next = 0;
    event.preventDefault();
    buttons[next].focus({ preventScroll: true });
    buttons[next].click();
  }) as EventListener);

  listen(root, 'input', ((event: Event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.matches('[data-reveal]')) return;
    const value = Math.min(100, Math.max(0, Number(input.value)));
    if (!Number.isFinite(value)) return;
    state = updateObservationState({ reveal: value });
    renderReveal();
  }) as EventListener);

  listen(root, 'change', ((event: Event) => {
    const input = event.target;
    if (input instanceof HTMLInputElement && input.matches('[data-reveal]')) {
      announce(statusFor('reveal'));
      window.dispatchEvent(new CustomEvent('imago:observations', { detail: { state: { ...state }, key: 'reveal' } }));
    }
  }) as EventListener);

  listen(root, 'visibilitychange', (() => {
    // A started departure resolves once when the tab is hidden; returning never
    // replays a large suspended time delta or leaves the scene halfway out.
    if (document.hidden && departing) finishDeparture(false);
  }) as EventListener);

  listen(window, 'imago:motion', ((event: Event) => {
    const detail = (event as CustomEvent<{ reduced?: boolean }>).detail;
    if (departing && (detail?.reduced || document.documentElement.dataset.motion === 'reduced')) finishDeparture();
  }) as EventListener);

  render();

  return {
    destroy(): void {
      if (destroyed) return;
      if (departing) state = updateObservationState({ departed: true });
      cancelDeparture();
      renderDeparture();
      destroyed = true;
      for (const cleanup of cleanups) cleanup();
      for (const slot of mediaSlots) {
        slot.generation += 1;
        slot.release();
      }
    },
  };
}
