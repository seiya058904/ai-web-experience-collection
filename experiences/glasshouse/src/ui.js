/** The interface stays still while the optical world moves through it. */
import { isPortraitComposition } from './framing.js';
import { interfacePalette, portraitButtonThresholds } from './ui-ink.js';
// Scroll length keeps the original phone boundary; portrait composition also uses framing.js.
export const MOBILE_BREAKPOINT = 760;

export const CHAPTERS = Object.freeze([
  { id: 'light', label: 'Light', description: 'The first encounter.' },
  { id: 'surface', label: 'Surface', description: 'One material, many realities.' },
  { id: 'refraction', label: 'Refraction', description: 'A change of direction.' },
  { id: 'reflection', label: 'Reflection', description: 'Another space within the space.' },
  { id: 'layers', label: 'Layers', description: 'The distance between surfaces.' },
  { id: 'glasshouse', label: 'Glasshouse', description: 'A house made of light.' },
]);

const logo = `<svg class="brand-mark" viewBox="0 0 56 24" fill="none" aria-hidden="true"><path d="M1 1h54v22H1z" stroke="currentColor" stroke-width=".85" vector-effect="non-scaling-stroke"/><path d="M1 23 55 1" stroke="currentColor" stroke-width="1.05" vector-effect="non-scaling-stroke"/></svg>`;
const arrow = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const northeast = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 18 12-12M7 6h11v11" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const plus = `<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.1"/></svg>`;
const close = `<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="1.1"/></svg>`;
const pause = `<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M5.5 3.5v9m5-9v9" stroke="currentColor" stroke-width="1.2"/></svg>`;
const play = `<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m5 3 7 5-7 5V3Z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/></svg>`;

const clamp01 = value => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
const number = value => String(value + 1).padStart(2, '0');

function rangeControl(id, label, min, max) {
  return `<div class="range-control"><label class="range-label" for="${id}"><span>${label}</span><output for="${id}" aria-hidden="true">0°</output></label><input id="${id}" type="range" min="${min}" max="${max}" step="1" value="0" aria-valuetext="0 degrees" /></div>`;
}

/**
 * No animation clock lives here. update() receives the shared world timeline.
 * All controls work with a keyboard and native dialog manages protected focus.
 */
export function createUI(root, callbacks = {}) {
  if (!(root instanceof HTMLElement)) throw new TypeError('createUI requires a root element.');

  const events = new AbortController();
  const eventOptions = { signal: events.signal };
  const state = {
    chapter: -1,
    opacity: '',
    offset: '',
    clipDirection: '',
    captionInteractive: undefined,
    palettes: new Map(),
    inkViewport: '',
    buttonThresholds: { motion: .83, index: .83 },
    paused: undefined,
    reduced: undefined,
    material: 'clear',
    menuOpen: false,
    previousFocus: null,
    disposed: false,
    bars: Array(CHAPTERS.length).fill(''),
  };

  root.classList.add('ui');
  root.innerHTML = `
    <a class="skip-link" href="#scene-light">Skip to scene title</a>
    <header class="site-header">
      <a class="brand" href="#light" data-navigate="0" aria-label="Glasshouse — return to the beginning">${logo}<span>Glasshouse</span></a>
      <nav class="header-actions" aria-label="Experience controls">
        <a class="collection-return" href="${import.meta.env.BASE_URL}" aria-label="Return to Collection" title="Return to Collection"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7"/></svg><span>Collection</span></a>
        <button class="text-button motion-toggle" type="button" aria-label="Pause motion" aria-pressed="false"><span>Motion</span><span class="motion-icon">${pause}</span></button>
        <button class="text-button index-toggle" type="button" aria-label="Open chapter index" aria-haspopup="dialog" aria-controls="chapter-index" aria-expanded="false"><span>Index</span>${plus}</button>
      </nav>
    </header>

    <div class="scene-captions" aria-label="Light through matter">
      <article class="scene scene--light" id="scene-light" aria-labelledby="title-light" aria-hidden="false">
        <div class="scene-copy">
          <h1 class="scene-title" id="title-light" tabindex="-1">Light,<br>through<br>matter.</h1>
          <p class="scene-description">A spatial study of glass, light<br>and everything in between.</p>
          <a class="scene-action enter-link" href="#surface" data-navigate="1"><span class="action-orbit">${arrow}</span><span>Scroll to enter</span></a>
        </div>
      </article>
      <article class="scene scene--surface" id="scene-surface" aria-labelledby="title-surface" aria-hidden="true" inert>
        <div class="scene-copy">
          <h2 class="scene-title" id="title-surface" tabindex="-1">One material.<br>Many realities.</h2>
          <p class="scene-description">The same light. A different world.</p>
        </div>
        <div class="scene-controls">
          <fieldset class="material-controls"><legend class="sr-only">Glass surface</legend>
            <button type="button" data-material="clear" aria-pressed="true">Clear</button>
            <button type="button" data-material="frosted" aria-pressed="false">Frosted</button>
            <button type="button" data-material="mirror" aria-pressed="false">Mirror</button>
          </fieldset>
        </div>
      </article>
      <article class="scene scene--refraction" id="scene-refraction" aria-labelledby="title-refraction" aria-hidden="true" inert>
        <div class="scene-copy">
          <h2 class="scene-title" id="title-refraction" tabindex="-1">A change<br>of direction.</h2>
          <p class="scene-description">What passes through is never<br>quite the same.</p>
        </div>
        <div class="scene-controls">${rangeControl('light-angle', 'Light angle', -45, 45)}</div>
      </article>
      <article class="scene scene--reflection" id="scene-reflection" aria-labelledby="title-reflection" aria-hidden="true" inert>
        <div class="scene-copy">
          <h2 class="scene-title" id="title-reflection" tabindex="-1">Nothing exists<br>alone.</h2>
          <p class="scene-description">Every surface holds another space.</p>
        </div>
      </article>
      <article class="scene scene--layers" id="scene-layers" aria-labelledby="title-layers" aria-hidden="true" inert>
        <div class="scene-copy">
          <h2 class="scene-title" id="title-layers" tabindex="-1">The space<br>between.</h2>
          <p class="scene-description">Depth is a conversation<br>between surfaces.</p>
        </div>
      </article>
      <article class="scene scene--glasshouse" id="scene-glasshouse" aria-labelledby="title-glasshouse" aria-hidden="true" inert>
        <div class="scene-copy">
          <h2 class="scene-title" id="title-glasshouse" tabindex="-1">A house<br>made of light.</h2>
          <p class="scene-description">Six studies. One continuous space.</p>
          <a class="scene-action repeat-link" href="#light" data-navigate="0"><span>Begin again</span>${northeast}</a>
        </div>
        <div class="scene-controls">${rangeControl('daylight-angle', 'Sun position', -40, 40)}</div>
      </article>
    </div>

    <footer class="journey-footer">
      <div class="mobile-chapter-status" aria-hidden="true"><span class="mobile-chapter-number">01</span><span class="mobile-chapter-name">Light</span></div>
      <nav class="journey-nav" aria-label="Journey chapters">
        <ol class="timeline-list">${CHAPTERS.map((chapter, i) => `<li><a class="timeline-link" href="#${chapter.id}" data-navigate="${i}" aria-label="${number(i)} — ${chapter.label}"><span class="timeline-label"><span class="chapter-number">${number(i)}</span><span class="chapter-name">${chapter.label}</span></span><span class="timeline-track" aria-hidden="true"><span class="timeline-progress"></span></span></a></li>`).join('')}</ol>
      </nav>
    </footer>

    <dialog class="chapter-index" id="chapter-index" aria-labelledby="index-title" data-lenis-prevent>
      <div class="index-shell">
        <div class="index-header"><span class="brand">${logo}<span>Glasshouse</span></span><button class="text-button index-close" type="button" aria-label="Close chapter index"><span>Close</span>${close}</button></div>
        <div class="index-layout">
          <h2 class="index-title" id="index-title">Follow <br>the light.</h2>
          <nav class="index-navigation" aria-label="Choose a chapter"><ol>${CHAPTERS.map((chapter, i) => `<li><a class="index-chapter" href="#${chapter.id}" data-navigate="${i}"><span class="index-number">${number(i)}</span><span class="index-chapter-copy"><span class="index-chapter-name">${chapter.label}</span><span class="index-chapter-description">${chapter.description}</span></span>${northeast}</a></li>`).join('')}</ol></nav>
        </div>
        <div class="index-footer"><p>Light through matter.</p><p>Six studies. One continuous space.</p></div>
      </div>
    </dialog>
  `;

  const scenes = Array.from(root.querySelectorAll('.scene'));
  const timelineLinks = Array.from(root.querySelectorAll('.timeline-link'));
  const indexLinks = Array.from(root.querySelectorAll('.index-chapter'));
  const bars = Array.from(root.querySelectorAll('.timeline-progress'));
  const materialButtons = Array.from(root.querySelectorAll('[data-material]'));
  const motionButton = root.querySelector('.motion-toggle');
  const motionIcon = root.querySelector('.motion-icon');
  const indexButton = root.querySelector('.index-toggle');
  const indexCloseButton = root.querySelector('.index-close');
  const dialog = root.querySelector('.chapter-index');
  const mobileNumber = root.querySelector('.mobile-chapter-number');
  const mobileName = root.querySelector('.mobile-chapter-name');
  const inkRegions = [
    [root, 'caption'],
    [root.querySelector('.site-header .brand'), 'brand'],
    [root.querySelector('.header-actions'), 'actions'],
    // The collection exit shares the header-actions ink so the animated sky
    // never washes it out at either viewport.
    [root.querySelector('.header-actions .collection-return'), 'actions'],
    [motionButton, 'motion'],
    [indexButton, 'index'],
    [root.querySelector('.journey-footer'), 'footer'],
    ...Array.from(root.querySelectorAll('.scene-controls'), element => [element, 'footer']),
  ];

  function updateInk(darkness, renderMode) {
    const portrait = isPortraitComposition(innerWidth, innerHeight);
    const viewport = `${innerWidth}/${innerHeight}`;
    if (state.inkViewport !== viewport) {
      state.buttonThresholds = portrait ? portraitButtonThresholds(innerWidth, innerHeight) : { motion: .83, index: .83 };
      state.inkViewport = viewport;
    }
    for (const [element, region] of inkRegions) {
      const palette = interfacePalette(darkness, region, renderMode, portrait, state.buttonThresholds);
      const signature = `${palette.dark}/${palette.muted}`;
      if (state.palettes.get(element) === signature) continue;
      element.dataset.theme = palette.dark ? 'dark' : 'light';
      element.style.setProperty('--ink', palette.ink);
      element.style.setProperty('--muted', palette.muted);
      element.style.setProperty('--line', palette.line);
      element.style.color = 'var(--ink)';
      state.palettes.set(element, signature);
    }
  }

  function syncMenuState(open) {
    if (state.menuOpen === open) return;
    state.menuOpen = open;
    indexButton.setAttribute('aria-expanded', String(open));
    callbacks.onMenuChange?.(open);
  }

  function setMenuOpen(open) {
    if (state.disposed) return;
    if (open && !dialog.open) {
      state.previousFocus = document.activeElement;
      dialog.showModal();
      syncMenuState(true);
    } else if (!open && dialog.open) {
      dialog.close();
      finishMenuClose();
    }
  }

  function finishMenuClose() {
    if (!state.menuOpen && !state.previousFocus) return;
    syncMenuState(false);
    const previous = state.previousFocus;
    state.previousFocus = null;
    if (previous instanceof HTMLElement && previous.isConnected && !previous.closest('[inert]')) previous.focus({ preventScroll: true });
  }

  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    setMenuOpen(false);
  }, eventOptions);
  dialog.addEventListener('close', () => {
    // A close event is queued. Ignore it if a new opening already followed it.
    if (!dialog.open) finishMenuClose();
  }, eventOptions);
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    // Native dialog protects background focus. Explicit boundary wrapping
    // also keeps Chromium from taking the final Tab into browser chrome.
    const first = indexCloseButton;
    const last = indexLinks[indexLinks.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  }, eventOptions);
  indexButton.addEventListener('click', () => setMenuOpen(true), eventOptions);
  indexCloseButton.addEventListener('click', () => setMenuOpen(false), eventOptions);

  root.querySelectorAll('[data-navigate]').forEach(link => {
    link.addEventListener('click', event => {
      // Keep modified link activation available to the browser.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      const index = Number(link.dataset.navigate);
      if (dialog.open) setMenuOpen(false);
      callbacks.onNavigate?.(index);
    }, eventOptions);
  });

  root.querySelector('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    const index = Math.max(0, state.chapter);
    const target = scenes[index].inert ? timelineLinks[index] : scenes[index].querySelector('.scene-title');
    target.focus({ preventScroll: true });
  }, eventOptions);

  function setMotionState(paused, reduced) {
    if (state.paused === paused && state.reduced === reduced) return;
    state.paused = paused;
    state.reduced = reduced;
    const stopped = paused || reduced;
    motionButton.disabled = reduced;
    motionButton.setAttribute('aria-pressed', String(stopped));
    motionButton.setAttribute('aria-label', reduced ? 'Ambient motion is off because reduced motion is enabled in your system' : paused ? 'Resume motion' : 'Pause motion');
    motionButton.title = reduced ? 'Your system preference keeps ambient motion stopped' : paused ? 'Resume ambient motion' : 'Pause ambient motion';
    motionIcon.innerHTML = stopped ? play : pause;
    root.classList.toggle('is-reduced-motion', reduced);
  }

  motionButton.addEventListener('click', () => {
    if (state.reduced) return;
    const paused = !state.paused;
    setMotionState(paused, Boolean(state.reduced));
    callbacks.onMotionChange?.(paused);
  }, eventOptions);

  materialButtons.forEach(button => {
    button.addEventListener('click', () => {
      const material = button.dataset.material;
      if (state.material === material) return;
      state.material = material;
      materialButtons.forEach(option => option.setAttribute('aria-pressed', String(option.dataset.material === material)));
      callbacks.onMaterialChange?.(material);
    }, eventOptions);
  });

  function bindRange(id, callbackName) {
    const input = root.querySelector(`#${id}`);
    const output = root.querySelector(`output[for="${id}"]`);
    input.addEventListener('input', () => {
      const value = Number(input.value);
      output.textContent = `${value > 0 ? '+' : ''}${value}°`;
      input.setAttribute('aria-valuetext', `${value} degrees`);
      callbacks[callbackName]?.(value);
    }, eventOptions);
  }
  bindRange('light-angle', 'onLightAngle');
  bindRange('daylight-angle', 'onDaylight');

  function update({ chapter = 0, localProgress = 0, progress = 0, darkness = 0, captionOpacity = 1, captionOffset = 0, paused = false, reduced = false, renderMode = 'webgl' } = {}) {
    if (state.disposed) return;
    const requested = typeof chapter === 'string' ? CHAPTERS.findIndex(item => item.id === chapter.toLowerCase()) : chapter;
    const index = Math.max(0, Math.min(CHAPTERS.length - 1, Math.round(Number.isFinite(requested) ? requested : 0)));
    const opacity = clamp01(captionOpacity).toFixed(3);
    const offset = `${(Number.isFinite(captionOffset) ? captionOffset : 0).toFixed(2)}px`;
    // A clipped or departing control must not become a keyboard focus stop.
    const captionInteractive = Boolean(reduced) || Number(opacity) >= 0.98;

    if (state.chapter !== index) {
      const previousScene = scenes[state.chapter];
      const moveFocus = previousScene?.contains(document.activeElement);
      if (moveFocus && !dialog.open) timelineLinks[index].focus({ preventScroll: true });
      scenes.forEach((scene, i) => {
        const active = i === index;
        scene.classList.toggle('is-active', active);
        scene.setAttribute('aria-hidden', String(!active));
        scene.inert = !active || !captionInteractive;
        for (const link of [timelineLinks[i], indexLinks[i]]) {
          if (active) link.setAttribute('aria-current', 'step');
          else link.removeAttribute('aria-current');
        }
      });
      state.chapter = index;
      root.dataset.chapter = CHAPTERS[index].id;
      mobileNumber.textContent = number(index);
      mobileName.textContent = CHAPTERS[index].label;
    }

    if (state.captionInteractive !== captionInteractive) {
      if (!captionInteractive && scenes[index].contains(document.activeElement) && !dialog.open) timelineLinks[index].focus({ preventScroll: true });
      scenes[index].inert = !captionInteractive;
      state.captionInteractive = captionInteractive;
    }

    const clipDirection = captionOffset < 0 ? 'leaving' : 'entering';
    if (state.opacity !== opacity || state.clipDirection !== clipDirection) {
      const cut = Number(opacity) >= 0.999 ? '-16px' : `${((1 - Number(opacity)) * 100).toFixed(2)}%`;
      root.style.setProperty('--caption-opacity', opacity);
      root.style.setProperty('--caption-clip-start', clipDirection === 'leaving' ? cut : '-16px');
      root.style.setProperty('--caption-clip-end', clipDirection === 'entering' ? cut : '-16px');
      root.classList.toggle('is-caption-transition', Number(opacity) < 0.999);
      state.opacity = opacity;
      state.clipDirection = clipDirection;
    }
    if (state.offset !== offset) {
      root.style.setProperty('--caption-offset', offset);
      state.offset = offset;
    }

    // One sky contains both a dark flag and a bright aperture. Keep each
    // reading region legible without a second clock, DOM measurement or tint.
    updateInk(darkness, renderMode);

    // Earlier segments remain complete; only the current segment advances.
    const segmentProgress = Number.isFinite(localProgress) ? clamp01(localProgress) : clamp01(progress * CHAPTERS.length - index);
    bars.forEach((bar, i) => {
      const amount = (i < index ? 1 : i === index ? segmentProgress : 0).toFixed(3);
      if (state.bars[i] !== amount) {
        bar.style.transform = `scaleX(${amount})`;
        state.bars[i] = amount;
      }
    });

    setMotionState(Boolean(paused), Boolean(reduced));
  }

  update();

  return {
    update,
    setMenuOpen,
    dispose() {
      if (state.disposed) return;
      setMenuOpen(false);
      events.abort();
      state.disposed = true;
      root.replaceChildren();
    },
  };
}
