import { createAmbientAudio } from './ambient.ts';
import type { AmbientState } from './ambient.ts';
import { DEFAULT_OPENING, OPENING_OPTIONS } from './story.ts';
import { MAX_OPENING_LENGTH, sanitizeOpening, saveState, truncateOpening } from './state.ts';
import type { LampMode, UserState } from './state.ts';

/**
 * Bind progressive-enhancement controls once. Draft editing never commits a
 * sentence. Rendering uses textContent/value exclusively for visitor input.
 */
export function setupInteractions(
  state: UserState,
  onChange: (state: UserState) => void,
): { destroy(): void } {
  let current: UserState = { ...state, opening: sanitizeOpening(state.opening) };
  let disposed = false;
  let composing = false;
  let copyRevision = 0;
  const undoHistory: string[] = [];
  const listeners = new AbortController();
  const signal = listeners.signal;
  const query = <T extends Element>(selector: string) => document.querySelector<T>(selector);
  const all = <T extends Element>(selector: string) => [...document.querySelectorAll<T>(selector)];
  const input = query<HTMLTextAreaElement>('#opening-input');
  const form = query<HTMLFormElement>('#opening-form');
  const count = query<HTMLElement>('#opening-count');
  const saveStatus = query<HTMLElement>('#save-status');
  const undo = query<HTMLButtonElement>('#undo-line');
  const motionButton = query<HTMLButtonElement>('#motion-toggle');
  const soundButton = query<HTMLButtonElement>('#sound-toggle');
  const menu = query<HTMLDetailsElement>('#chapter-menu');
  const menuButton = query<HTMLElement>('#chapter-menu-button');
  const media = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  const setStatus = (message: string) => {
    if (saveStatus) saveStatus.textContent = message;
  };

  const copyFeedbackFor = (button: HTMLElement) => {
    const actions = button.closest<HTMLElement>('.note-actions');
    // Feedback belongs to this exact control group. It may be inside the group
    // or the adjacent sibling produced by cards(); never search another chapter.
    const sibling = actions?.nextElementSibling?.matches('.copy-feedback')
      ? actions.nextElementSibling
      : actions?.previousElementSibling?.matches('.copy-feedback')
        ? actions.previousElementSibling : null;
    const local = actions?.querySelector<HTMLElement>('.copy-feedback') ?? sibling ?? actions;
    return {
      actions,
      status: local?.querySelector<HTMLElement>('[data-copy-status]')
        ?? query<HTMLElement>('#copy-status'),
      fallback: local?.querySelector<HTMLTextAreaElement>('[data-copy-fallback]')
        ?? query<HTMLTextAreaElement>('#copy-fallback'),
    };
  };

  const setButtonLabel = (button: HTMLButtonElement | null, label: string) => {
    if (!button) return;
    const span = button.querySelector<HTMLElement>('[data-control-label]');
    if (span) span.textContent = label;
    else button.textContent = label;
  };

  const notify = () => {
    if (!disposed) onChange({ ...current });
  };

  const updateCount = () => {
    const length = Array.from(input?.value ?? current.opening).length;
    if (count) count.textContent = `${length} / ${MAX_OPENING_LENGTH}`;
    input?.setAttribute('aria-invalid', String(length > MAX_OPENING_LENGTH));
  };

  const capDraft = (): boolean => {
    if (!input) return false;
    const bounded = truncateOpening(input.value);
    if (bounded === input.value) return false;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.value = bounded;
    input.setSelectionRange(Math.min(start, input.value.length), Math.min(end, input.value.length));
    return true;
  };

  const updateLineControls = (replaceDraft: boolean) => {
    if (input && replaceDraft) input.value = current.opening;
    for (const element of all<HTMLElement>('[data-user-line]')) {
      element.textContent = current.opening;
      element.setAttribute('dir', 'auto');
      // The language of a visitor's own words is unknown, even on an English page.
      element.setAttribute('lang', '');
    }
    for (const button of all<HTMLButtonElement>('[data-preset]')) {
      const index = Number(button.dataset.preset);
      button.setAttribute('aria-pressed', String(OPENING_OPTIONS[index as 0 | 1 | 2] === current.opening));
    }
    if (undo) undo.disabled = undoHistory.length === 0;
    updateCount();
  };

  const updateLamp = () => {
    for (const button of all<HTMLButtonElement>('[data-lamp]')) {
      button.setAttribute('aria-pressed', String(button.dataset.lamp === current.lamp));
    }
    for (const view of all<HTMLElement>('[data-lamp-view]')) view.dataset.mode = current.lamp;
  };

  const updateMotion = () => {
    const reduced = media?.matches ?? false;
    const active = current.motion && !reduced;
    document.documentElement.dataset.motion = active ? 'on' : 'off';
    if (!motionButton) return;
    motionButton.setAttribute('aria-pressed', String(active));
    motionButton.disabled = reduced;
    motionButton.dataset.state = reduced ? 'reduced' : active ? 'on' : 'off';
    motionButton.title = reduced
      ? 'Reduced motion is active in your system settings.'
      : active ? 'Pause ambient motion and use native scrolling.' : 'Enable gentle ambient motion and smooth scrolling.';
    motionButton.setAttribute('aria-label', reduced
      ? 'Reduced motion is active in your system settings'
      : active ? 'Pause motion' : 'Resume motion');
    setButtonLabel(motionButton, reduced ? 'Reduced motion' : active ? 'Pause motion' : 'Resume motion');
  };

  const persistPreference = () => {
    if (!saveState(current)) setStatus('Preferences apply for this visit. This browser could not save them for later.');
    notify();
  };

  const commit = (value: string, message: string, remember = true) => {
    const opening = sanitizeOpening(value);
    if (remember && opening !== current.opening) {
      undoHistory.push(current.opening);
      if (undoHistory.length > 20) undoHistory.shift();
    }
    current = { ...current, opening };
    copyRevision++;
    for (const status of all<HTMLElement>('[data-copy-status], #copy-status')) status.textContent = '';
    for (const fallback of all<HTMLTextAreaElement>('[data-copy-fallback], #copy-fallback')) {
      fallback.hidden = true;
      fallback.value = opening;
    }
    updateLineControls(true);
    const persisted = saveState(current);
    setStatus(`${message} ${persisted ? 'Saved in this browser.' : 'Kept for this visit; this browser could not save it for later.'}`);
    notify();
  };

  if (input) {
    // HTML maxlength counts UTF-16 units and can split a user-visible emoji.
    // The input handler enforces the documented Unicode-code-point limit.
    input.removeAttribute('maxlength');
    input.setAttribute('dir', 'auto');
    input.setAttribute('lang', '');
    input.addEventListener('compositionstart', () => { composing = true; }, { signal });
    input.addEventListener('compositionend', () => {
      composing = false;
      const capped = capDraft();
      updateCount();
      setStatus(capped ? 'Limited to 120 characters. Save when ready.' : 'Unsaved changes. Save when ready.');
    }, { signal });
    input.addEventListener('input', (event) => {
      const activeComposition = composing || (event instanceof InputEvent && event.isComposing);
      const capped = !activeComposition && capDraft();
      updateCount();
      if (!activeComposition) setStatus(capped ? 'Limited to 120 characters. Save when ready.' : 'Unsaved changes. Save when ready.');
    }, { signal });
  }

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!input || composing) return;
    capDraft();
    commit(input.value, input.value.trim() ? 'Your opening is ready.' : 'The empty line was replaced with the default.');
  }, { signal });

  for (const button of all<HTMLButtonElement>('[data-preset]')) {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const index = Number(button.dataset.preset);
      const opening = OPENING_OPTIONS[index as 0 | 1 | 2];
      if (typeof opening === 'string') commit(opening, 'Opening selected.');
    }, { signal });
  }

  undo?.addEventListener('click', (event) => {
    event.preventDefault();
    const previous = undoHistory.pop();
    if (previous !== undefined) commit(previous, 'Previous line restored.', false);
  }, { signal });

  for (const button of all<HTMLButtonElement>('[data-reset-line]')) {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      commit(DEFAULT_OPENING, 'Default line restored.');
    }, { signal });
  }

  for (const button of all<HTMLButtonElement>('[data-lamp]')) {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const lamp = button.dataset.lamp as LampMode;
      if (!['reading', 'soft', 'off'].includes(lamp)) return;
      current = { ...current, lamp };
      updateLamp();
      persistPreference();
    }, { signal });
  }

  for (const button of all<HTMLButtonElement>('[data-copy-line]')) {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const request = ++copyRevision;
      const opening = current.opening;
      const { actions, status, fallback } = copyFeedbackFor(button);
      const focusAtRequest = document.activeElement;
      if (status) status.textContent = 'Copying your opening…';
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(opening);
        if (disposed || request !== copyRevision) return;
        if (status) status.textContent = 'Your opening was copied.';
        if (fallback) fallback.hidden = true;
      } catch {
        if (disposed || request !== copyRevision) return;
        if (fallback) {
          fallback.value = opening;
          fallback.hidden = false;
          fallback.readOnly = true;
          fallback.setAttribute('dir', 'auto');
          fallback.setAttribute('lang', '');
          if (!fallback.hasAttribute('aria-label')) fallback.setAttribute('aria-label', 'Your opening, ready to select and copy');
          // A permission prompt can resolve after the reader has moved on.
          // Reveal the local fallback, but do not take focus back from another
          // chapter or another control they selected while copying was pending.
          const active = document.activeElement;
          const focusStillHere = active === focusAtRequest || active === button
            || Boolean(active && actions?.contains(active));
          const bounds = button.getBoundingClientRect();
          const controlStillVisible = bounds.bottom > 0 && bounds.top < window.innerHeight
            && bounds.right > 0 && bounds.left < window.innerWidth;
          const sameChapter = fallback.closest('section') === button.closest('section');
          if (focusStillHere && controlStillVisible && sameChapter) {
            fallback.focus({ preventScroll: true });
            fallback.select();
            fallback.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
          }
        }
        if (status) status.textContent = fallback
          ? 'Copy is unavailable here. Select the text below and copy it.'
          : 'Copy is unavailable here. Select your opening and copy it.';
      }
    }, { signal });
  }

  motionButton?.addEventListener('click', () => {
    if (media?.matches) { updateMotion(); return; }
    current = { ...current, motion: !current.motion };
    updateMotion();
    persistPreference();
  }, { signal });

  media?.addEventListener('change', () => {
    updateMotion();
    notify();
  }, { signal });

  const updateSound = (sound: AmbientState) => {
    if (!soundButton || disposed) return;
    soundButton.setAttribute('aria-pressed', String(sound.enabled));
    soundButton.disabled = !sound.supported;
    soundButton.dataset.state = sound.enabled ? sound.playing ? 'on' : 'paused' : 'off';
    const label = !sound.supported ? 'Sound unavailable' : sound.enabled ? 'Sound on' : 'Sound off';
    setButtonLabel(soundButton, label);
    soundButton.title = sound.error ?? (sound.enabled ? 'Mute the wheel-and-rail ambience.' : 'Enable quiet wheel-and-rail ambience.');
    soundButton.setAttribute('aria-label', sound.error ?? (sound.enabled ? 'Turn sound off' : 'Turn sound on'));
  };
  const ambient = createAmbientAudio(updateSound);
  soundButton?.addEventListener('click', () => { void ambient.toggle(); }, { signal });
  updateSound(ambient.getState());

  const closeMenu = (restoreFocus: boolean) => {
    if (!menu?.open) return;
    menu.open = false;
    menuButton?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) menuButton?.focus({ preventScroll: true });
  };
  menu?.addEventListener('toggle', () => {
    menuButton?.setAttribute('aria-expanded', String(menu.open));
  }, { signal });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu?.open) {
      event.preventDefault();
      closeMenu(true);
    }
  }, { signal });
  document.addEventListener('click', (event) => {
    if (!menu?.open || !(event.target instanceof Node)) return;
    if (!menu.contains(event.target)) {
      const interactiveTarget = event.target instanceof Element && event.target.closest(
        'a[href], button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), summary, label, [contenteditable]:not([contenteditable="false"]), [tabindex]:not([tabindex="-1"])',
      );
      // A click on a real control dismisses the menu and continues that action.
      // Returning focus to summary here would undo the user's click on an input.
      closeMenu(!interactiveTarget);
    }
    else if (event.target instanceof Element && event.target.closest('a[href]')) closeMenu(false);
  }, { signal });

  updateLineControls(true);
  updateLamp();
  updateMotion();
  menuButton?.setAttribute('aria-expanded', String(Boolean(menu?.open)));
  notify();

  return {
    destroy() {
      if (disposed) return;
      disposed = true;
      copyRevision++;
      listeners.abort();
      ambient.destroy();
    },
  };
}
