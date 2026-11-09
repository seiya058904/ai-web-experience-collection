import { imprintSVG } from './artwork.ts';
import { softText, steppedIndex } from '../../shared/soft-swap.ts';
import { DEFAULT_SHARES, DEFAULT_TITLE, clamp01, lerp, smoothstep } from './state.ts';
import type { ComponentIndex, DemoState, PersonalState, Phase, Shares } from './state.ts';

export type TransitionIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type Triple<T> = [T, T, T];
type Source = 'original' | 'personal';

export interface PrintPose {
  x: number;
  y: number;
  scale: number;
  opacity: number;
  rotation: number;
  separation: number;
  parts: Triple<number>;
  phase: Phase;
  source: Source;
  label: string;
}

export interface TransitionFrame {
  progress: number;
  prints: Triple<PrintPose>;
  pathOpacity: number;
  pathReveal: number;
  baseline: number;
  leftMemory: number;
  rightMemory: number;
  memoryRetreat: number;
  labels: number;
  controlsReveal: number;
  controlsInteractive: boolean;
  caption: string;
}

export const TRANSITION_COPY = [
  ['One impression. Three edges.', 'The opening moves into view.', 'Look closely at the fine ridge.', 'Each quality finds its own space.', 'An edge for every word.'],
  ['Three different ways to describe a feeling.', 'Find the line they have in common.', 'The same vocabulary continues.', 'Three moments, already related.', 'Arrival. Unfolding. Trace.'],
  ['Three moments of one impression.', 'Stay with the unfolding.', 'The edges begin to make room.', 'A shared opening takes shape.', 'The parts become a chord.'],
  ['Keep the complete impression in mind.', 'Give it room for a comparison.', 'The same work, at the same scale.', 'One edge can leave its place.', 'Read the shape of what is absent.'],
  ['A whole, and a space within it.', 'Follow the complete edge onward.', 'An outline becomes the start of a path.', 'The path carries a quieter impression.', 'Near, middle and far remain connected.'],
  ['Follow the trace to its last opening.', 'Keep that opening in view.', 'A fragment gathers around it.', 'Another story enters the frame.', 'One impression can hold two memories.'],
  ['Two memories surround one impression.', 'Let their words fall quiet.', 'The opening stays; the path is already there.', 'The fragments make room for the whole.', 'Three stages. One unbroken path.'],
  ['Take in the whole path.', 'Bring the unfolding closer.', 'Keep the other stages in view.', 'Make room for your own choices.', 'The next shape belongs to you.'],
  ['Keep the impression you have chosen.', 'Let the controls fall away.', 'Set it beside the one we began with.', 'Your version opens into a complete path.', 'A title, a balance, a trace to keep.'],
] as const;

const VOICES = ['brightness', 'spice', 'warmth'] as const;
const VOICE_LABELS = ['Brightness', 'Spice', 'Warmth'] as const;
const PHASES: Triple<Phase> = ['arrival', 'unfolding', 'afterglow'];
const PHASE_LABELS = ['Arrival', 'Unfolding', 'Trace'] as const;
const ALL: Triple<number> = [1, 1, 1];
const NS = 'http://www.w3.org/2000/svg';

// x/y are fractions of the available gallery span, not CSS viewport units.
// All five poses are authored independently of entry/exit callbacks.
type PoseKey = readonly [x: number, y: number, scale: number, opacity: number, separation?: number];
type SceneKey = readonly [PoseKey, PoseKey, PoseKey];
const HIDDEN: PoseKey = [0, 0, .3, 0];
const KEYS: readonly (readonly SceneKey[])[] = [
  [
    [[0, 0, .96, 1], [0, 0, .96, 1], [0, 0, .96, 1]],
    [[-.12, -.04, .98, 1], [.03, .03, .96, 1], [.05, .06, .96, 1]],
    [[-.48, -.10, 1.12, 1], [.20, .08, .82, 1], [.39, .17, .72, 1]],
    [[-.78, -.04, .76, 1], [0, .02, .76, 1], [.78, .06, .76, 1]],
    [[-.90, 0, .62, 1], [0, 0, .62, 1], [.90, 0, .62, 1]],
  ],
  [
    [[-.90, -.17, .62, 1], [0, .12, .62, 1], [.90, -.04, .62, 1]],
    [[-.85, -.08, .60, 1], [0, .06, .60, 1], [.85, -.02, .60, 1]],
    [[-.80, 0, .58, 1], [0, 0, .58, 1], [.80, 0, .58, 1]],
    [[-.80, 0, .58, 1], [0, 0, .58, 1], [.80, 0, .58, 1]],
    [[-.80, 0, .58, 1], [0, 0, .58, 1], [.80, 0, .58, 1]],
  ],
  [
    [[-.80, 0, .58, 1], [0, 0, .58, 1], [.80, 0, .58, 1]],
    [[-.86, -.04, .48, .80], [0, 0, .76, 1], [.86, .04, .48, .80]],
    [[-.98, -.08, .35, .20], [0, 0, .96, 1, .8], [.98, .08, .35, .20]],
    [[-1.05, -.12, .25, 0], [0, 0, 1.02, 1, .35], [1.05, .12, .25, 0]],
    [HIDDEN, [0, 0, 1.02, 1, 0], HIDDEN],
  ],
  [
    [[0, 0, 1.02, 1], HIDDEN, HIDDEN],
    [[-.58, 0, .78, 1], [.58, 0, .78, 0], HIDDEN],
    [[-.64, 0, .78, 1], [.64, 0, .78, 1], HIDDEN],
    [[-.64, 0, .78, 1], [.64, 0, .78, 1], HIDDEN],
    [[-.64, 0, .78, 1], [.64, 0, .78, 1], HIDDEN],
  ],
  [
    [[-.64, 0, .78, 1], [.64, 0, .78, 1], HIDDEN],
    [[-.60, .08, .76, 1], [.73, -.08, .62, .3], HIDDEN],
    [[-.68, .24, .76, 1], [0, 0, .56, 0], [.72, -.24, .36, 0]],
    [[-.68, .24, .76, 1], [0, 0, .56, 1], [.72, -.24, .36, .6]],
    [[-.68, .24, .76, 1], [0, 0, .56, 1], [.72, -.24, .36, 1]],
  ],
  [
    [[-.68, .24, .76, 1], [0, 0, .56, 1], [.72, -.24, .36, 1]],
    [[-.88, .26, .56, .6], [-.16, .08, .43, .6], [.35, -.10, .42, 1]],
    [[-1, .30, .35, 0], [-.35, .15, .3, 0], [0, 0, .48, 1]],
    [HIDDEN, HIDDEN, [0, 0, .48, 1]],
    [HIDDEN, HIDDEN, [0, 0, .48, 1]],
  ],
  [
    [[-.73, .22, .60, 0], [0, 0, .48, 1], [.73, -.22, .60, 0]],
    [[-.73, .22, .60, 0], [0, 0, .58, 1], [.73, -.22, .60, 0]],
    [[-.73, .22, .60, .55], [0, 0, .76, 1], [.73, -.22, .60, .55]],
    [[-.73, .22, .60, 1], [0, 0, .70, 1], [.73, -.22, .60, 1]],
    [[-.73, .22, .60, 1], [0, 0, .70, 1], [.73, -.22, .60, 1]],
  ],
  [
    [[-.73, .22, .60, 1], [0, 0, .70, 1], [.73, -.22, .60, 1]],
    [[-.79, .08, .48, 1], [0, 0, .86, 1], [.79, -.08, .48, 1]],
    [[-.87, -.55, .31, .85], [0, .08, 1.02, 1], [.87, -.55, .31, .85]],
    [[-1.20, 0, .25, .85], [-.50, 0, .72, 1], [.20, 0, .25, .85]],
    [[-1.20, 0, .25, .85], [-.50, 0, .72, 1], [.20, 0, .25, .85]],
  ],
  [
    [[0, 0, 1.02, 1], HIDDEN, HIDDEN],
    [[-.30, 0, .86, 1], [.55, 0, .78, 0], HIDDEN],
    [[-.64, 0, .78, 1], [.64, 0, .78, 1], HIDDEN],
    [[0, 0, .70, 1], [-.73, .22, .60, 0], [.73, -.22, .60, .70]],
    [[0, 0, .70, 1], [-.73, .22, .60, 1], [.73, -.22, .60, 1]],
  ],
];

const ramp = (p: number, start: number, end: number): number => smoothstep((p - start) / (end - start));

function validateIndex(index: number): asserts index is TransitionIndex {
  if (!Number.isInteger(index) || index < 0 || index > 8) throw new RangeError('Unknown SILLAGE transition');
}

/** Pure scene evaluation: arbitrary entry and reverse travel produce identical states. */
export function evaluateTransition(
  index: TransitionIndex,
  progress: number,
  compact = false,
  missing: ComponentIndex | null = 0,
): TransitionFrame {
  validateIndex(index);
  const p = clamp01(progress);
  const step = Math.min(3, Math.floor(p * 4));
  const blend = smoothstep(p * 4 - step);
  const prints = [0, 1, 2].map(i => {
    const from = KEYS[index][step][i];
    const to = KEYS[index][step + 1][i];
    const pose: PrintPose = {
      x: lerp(from[0], to[0], blend), y: lerp(from[1], to[1], blend),
      scale: lerp(from[2], to[2], blend), opacity: lerp(from[3], to[3], blend),
      rotation: 0, separation: lerp(from[4] ?? 0, to[4] ?? 0, blend),
      parts: [...ALL], phase: 'unfolding', source: index >= 7 ? 'personal' : 'original', label: '',
    };
    if (compact) {
      // A vertical editorial sequence, not a horizontally clipped desktop row.
      const oldX = pose.x;
      pose.x = pose.y * .32;
      pose.y = oldX;
      if (Math.abs(oldX) > .3 || [1, 4, 6].includes(index)) pose.scale *= .83;
    }
    if (index === 0) {
      pose.parts = ALL.map((_, part) => part === i ? 1 : 0) as Triple<number>;
      pose.label = VOICE_LABELS[i];
    } else if (index === 1) {
      const reveal = ramp(p, .5, 1);
      pose.parts = ALL.map((_, part) => part === i ? 1 : reveal) as Triple<number>;
      pose.phase = PHASES[i];
      pose.label = p < .65 ? VOICE_LABELS[i] : PHASE_LABELS[i];
    } else if (index === 2 || index === 6 || index === 7) {
      pose.phase = PHASES[i];
      pose.label = PHASE_LABELS[i];
      if (index === 7 && compact) {
        // The two smaller references sit above the current impression, leaving
        // a separate, real row for its controls on a narrow screen.
        const destination = [[-.70, -.86, .23], [0, .40, .70], [.70, -.86, .23]][i];
        const settle = ramp(p, .50, .75);
        pose.x = lerp(pose.x, destination[0], settle);
        pose.y = lerp(pose.y, destination[1], settle);
        pose.scale = lerp(pose.scale, destination[2], settle);
      }
    } else if (index === 3) {
      if (i === 1 && missing !== null) pose.parts[missing] = 1 - ramp(p, .5, 1);
      pose.label = i === 0 ? 'Complete' : missing === null ? 'Comparison' : `Without ${VOICE_LABELS[missing].toLowerCase()}`;
    } else if (index === 4) {
      // The comparison is replaced only inside a fully invisible interval.
      if (i === 1) {
        pose.opacity *= 1 - ramp(p, .25, .40) + ramp(p, .52, .75);
        if (p < .46 && missing !== null) pose.parts[missing] = 0;
      }
      pose.label = ['Near', 'Middle', 'Far'][i];
    } else if (index === 5) {
      pose.label = i === 2 && p > .5 ? 'The same impression' : ['Near', 'Middle', 'Far'][i];
    } else if (index === 8) {
      pose.phase = i === 2 ? 'afterglow' : 'unfolding';
      if (i === 1) {
        // Between comparison and the final path, this slot is replaced while
        // hidden. The personal state is never changed by crossing the boundary.
        const hiddenBefore = 1 - ramp(p, .50, .68);
        const shownAfter = ramp(p, .80, 1);
        pose.opacity = hiddenBefore * (p >= .5 ? 1 : pose.opacity) + shownAfter;
        pose.source = p < .74 ? 'original' : 'personal';
        pose.phase = p < .74 ? 'unfolding' : 'arrival';
        pose.label = p < .74 ? 'Where we began' : 'Arrival';
      } else pose.label = p < .65 ? 'Your impression' : i === 0 ? 'Unfolding' : 'Trace';
    }
    pose.opacity = clamp01(pose.opacity);
    return pose;
  }) as Triple<PrintPose>;

  return {
    progress: p, prints,
    pathOpacity: index === 4 ? ramp(p, .15, .65)
      : index === 5 ? 1 - ramp(p, .1, .65)
      : index === 6 ? ramp(p, .15, .65)
      : index === 7 ? 1 - ramp(p, .05, .6)
      : index === 8 ? ramp(p, .64, 1) : 0,
    pathReveal: index === 4 ? ramp(p, .18, .85) : 1,
    baseline: index === 1 ? ramp(p, .12, .68) : 0,
    leftMemory: index === 5 ? ramp(p, .34, .72) : index === 6 ? 1 - ramp(p, .12, .88) : 0,
    rightMemory: index === 5 ? ramp(p, .55, .95) : index === 6 ? 1 - ramp(p, .18, .94) : 0,
    memoryRetreat: index === 6 ? ramp(p, .15, .95) : 0,
    labels: index === 0 ? ramp(p, .65, 1) : index === 2 ? 1 - ramp(p, .1, .65)
      : index === 5 ? 1 - ramp(p, .1, .6) : ramp(p, .5, 1),
    controlsReveal: index >= 7 ? ramp(p, .62, .72) : 0,
    controlsInteractive: index >= 7 && p >= .72,
    caption: TRANSITION_COPY[index][Math.min(4, Math.floor(p * 4 + 1e-8))],
  };
}

export function transitionMarkup(index: number): string {
  validateIndex(index);
  const number = String(index + 1).padStart(2, '0');
  const next = String(index + 2).padStart(2, '0');
  const frame = evaluateTransition(index, 0);
  const prints = frame.prints.map((pose, slot) =>
    `<div class="transition-print" data-transition-slot="${slot}" style="transform:translate(-50%,-50%);opacity:${pose.opacity}">${imprintSVG(DEFAULT_SHARES, { id: `tr-${number}-${slot}`, phase: pose.phase, textureHref: './art/material-atlas.webp' })}</div>`,
  ).join('');
  const memories = index === 5 || index === 6
    ? '<img class="transition-memory transition-memory-left" src="./art/memory-window.webp" alt="" width="1000" height="800" loading="lazy" decoding="async"><img class="transition-memory transition-memory-right" src="./art/memory-note.webp" alt="" width="1000" height="800" loading="lazy" decoding="async">'
    : '';
  const controls = index === 7 ? `<div class="bridge-controls bridge-controls--compose" data-bridge-controls inert aria-hidden="true">
        <fieldset class="bridge-share-fields"><legend>Make it yours</legend><div class="bridge-share-row">${VOICE_LABELS.map((label, i) => `<div class="bridge-share"><label for="bridge-number-${i}">${label}</label><div class="bridge-number-wrap"><input id="bridge-number-${i}" data-number="${i}" data-bridge-number type="number" min="0" max="100" step="1" inputmode="numeric" value="${DEFAULT_SHARES[i]}" aria-describedby="bridge-share-help"><span aria-hidden="true">%</span></div></div>`).join('')}</div></fieldset>
        <p id="bridge-share-help" class="bridge-helper">Visual shares · always 100 in total.</p>
        <a class="bridge-action" href="#ch-09">Continue composing<span aria-hidden="true">→</span></a>
      </div>` : index === 8 ? `<div class="bridge-controls bridge-controls--keep" data-bridge-controls inert aria-hidden="true">
        <p class="bridge-kicker">Your impression</p><h3 data-bridge-title dir="auto">${DEFAULT_TITLE}</h3>
        <p class="bridge-shares" data-bridge-shares>Brightness 45 · Spice 20 · Warmth 35</p>
        <a class="bridge-action" href="#ch-10">Keep this impression<span aria-hidden="true">→</span></a>
      </div>` : '';
  const interactiveClass = index >= 7 ? ` handoff--interactive handoff--${index === 7 ? 'compose' : 'keep'}` : '';
  return `<div class="handoff${interactiveClass}" id="tr-${number}-${next}" data-transition-index="${index}" data-progress="0">
    <div class="handoff-stage">
      <div class="transition-gallery" aria-hidden="true">
        <svg class="transition-path" viewBox="0 0 1000 600" preserveAspectRatio="none"><path data-bridge-path pathLength="1" d="M 70 445 C 245 430 290 220 485 300 S 760 340 930 155" fill="none" stroke="#FAF6EE" stroke-width="64" stroke-linecap="round"/><path data-bridge-baseline pathLength="1" d="M 95 455 H 905" fill="none" stroke="#8A6750" stroke-opacity=".24" stroke-width="1"/></svg>
        ${prints}${memories}
        <div class="transition-labels" style="inset:0;display:block;pointer-events:none"><span></span><span></span><span></span></div>
      </div>
      ${controls}
      <p class="transition-caption"${index >= 7 ? ' tabindex="-1"' : ''}>${frame.caption}</p>
    </div>
  </div>`;
}

interface MountedPrint {
  element: HTMLElement;
  key: string;
  parts: Triple<{ wrapper: SVGGElement; rect: SVGRectElement } | null>;
}
interface MountedBridge {
  element: HTMLElement;
  stage: HTMLElement;
  gallery: HTMLElement;
  index: TransitionIndex;
  prints: Triple<MountedPrint>;
  caption: HTMLElement;
  controls: HTMLElement | null;
  labels: HTMLElement[];
  path: SVGPathElement;
  baseline: SVGPathElement;
  memories: [HTMLImageElement | null, HTMLImageElement | null];
  top: number;
  bottom: number;
  travel: number;
  captionStep?: number;
  stickyTop: number;
  width: number;
  height: number;
  printWidth: number;
  wasVisible: boolean;
  lastStamp: string;
}

function decoratePrint(print: MountedPrint, index: TransitionIndex, slot: number): void {
  const svg = print.element.querySelector('svg')!;
  const defs = svg.querySelector('defs')!;
  print.parts = VOICES.map((name, partIndex) => {
    const part = svg.querySelector<SVGGElement>(`[data-component="${name}"]`);
    if (!part) return null;
    const id = `bridge-clip-${index}-${slot}-${partIndex}`;
    const clip = document.createElementNS(NS, 'clipPath');
    clip.id = id;
    clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', '-150'); rect.setAttribute('y', '-150');
    rect.setAttribute('width', '1400'); rect.setAttribute('height', '1100');
    clip.append(rect); defs.append(clip);
    const wrapper = document.createElementNS(NS, 'g');
    wrapper.setAttribute('clip-path', `url(#${id})`);
    part.replaceWith(wrapper); wrapper.append(part);
    return { wrapper, rect };
  }) as MountedPrint['parts'];
}

export function mountTransitions(options: {
  getPersonal: () => PersonalState;
  getDemo?: () => DemoState;
  isReduced: () => boolean;
}): { update(): void; resize(): void; destroy(): void } {
  let destroyed = false;
  let compact = window.innerWidth <= 760;
  let reduced = options.isReduced();
  const bridges = Array.from(document.querySelectorAll<HTMLElement>('.handoff[data-transition-index]')).map(element => {
    const index = Number(element.dataset.transitionIndex);
    validateIndex(index);
    const prints = Array.from(element.querySelectorAll<HTMLElement>('.transition-print')).map((print, slot) => {
      const phase = evaluateTransition(index, 0).prints[slot].phase;
      const mounted: MountedPrint = { element: print, key: `${DEFAULT_SHARES.join(',')}:${phase}`, parts: [null, null, null] };
      decoratePrint(mounted, index, slot);
      return mounted;
    }) as Triple<MountedPrint>;
    return {
      element, index, prints,
      stage: element.querySelector<HTMLElement>('.handoff-stage')!,
      gallery: element.querySelector<HTMLElement>('.transition-gallery')!,
      caption: element.querySelector<HTMLElement>('.transition-caption')!,
      controls: element.querySelector<HTMLElement>('[data-bridge-controls]'),
      labels: Array.from(element.querySelectorAll<HTMLElement>('.transition-labels span')),
      path: element.querySelector<SVGPathElement>('[data-bridge-path]')!,
      baseline: element.querySelector<SVGPathElement>('[data-bridge-baseline]')!,
      memories: [element.querySelector('.transition-memory-left'), element.querySelector('.transition-memory-right')],
      top: 0, bottom: 0, travel: 1, stickyTop: 0, width: 0, height: 0, printWidth: 0,
      wasVisible: false, lastStamp: '',
    } as MountedBridge;
  });

  function resize(): void {
    if (destroyed) return;
    compact = window.innerWidth <= 760;
    reduced = options.isReduced();
    for (const bridge of bridges) {
      const rect = bridge.element.getBoundingClientRect();
      bridge.top = rect.top + window.scrollY;
      bridge.bottom = bridge.top + rect.height;
      bridge.stickyTop = Number.parseFloat(getComputedStyle(bridge.stage).top) || 0;
      bridge.travel = Math.max(1, rect.height - bridge.stage.getBoundingClientRect().height);
      bridge.width = bridge.gallery.clientWidth;
      bridge.height = bridge.gallery.clientHeight;
      bridge.printWidth = bridge.prints[0].element.getBoundingClientRect().width;
      // The untransformed width is required; previous frame scale must not
      // affect geometry after a resize or a motion-preference change.
      bridge.printWidth = bridge.prints[0].element.offsetWidth;
      bridge.path.setAttribute('d', compact
        ? 'M 525 35 C 320 170 670 220 490 310 S 370 465 520 565'
        : 'M 70 445 C 245 430 290 220 485 300 S 760 340 930 155');
      bridge.path.setAttribute('stroke-width', compact ? '92' : '64');
      bridge.baseline.setAttribute('d', compact ? 'M 500 55 V 545' : 'M 95 455 H 905');
      bridge.lastStamp = '';
    }
    update();
  }

  function render(bridge: MountedBridge, frame: TransitionFrame, personal: PersonalState): void {
    const horizontal = bridge.width * .36;
    const vertical = bridge.height * (compact ? .34 : .32);
    bridge.element.dataset.progress = frame.progress.toFixed(4);
    bridge.element.dataset.reduced = String(reduced);
    if (bridge.controls) {
      const controls = bridge.controls;
      // Reversing a focused bridge cannot strand focus inside hidden controls.
      if (!frame.controlsInteractive && controls.contains(document.activeElement)) {
        bridge.caption.focus({ preventScroll: true });
      }
      controls.inert = !frame.controlsInteractive;
      controls.setAttribute('aria-hidden', String(!frame.controlsInteractive));
      controls.style.opacity = frame.controlsReveal.toFixed(4);
      controls.style.visibility = frame.controlsReveal > 0 ? 'visible' : 'hidden';
      controls.style.pointerEvents = frame.controlsInteractive ? 'auto' : 'none';
      bridge.element.dataset.controlsState = frame.controlsInteractive ? 'interactive' : frame.controlsReveal > 0 ? 'appearing' : 'hidden';
    }
    bridge.path.style.opacity = String(frame.pathOpacity);
    bridge.path.style.strokeDasharray = '1';
    bridge.path.style.strokeDashoffset = String(1 - frame.pathReveal);
    bridge.baseline.style.opacity = String(frame.baseline);
    bridge.baseline.style.strokeDasharray = '1';
    bridge.baseline.style.strokeDashoffset = String(1 - frame.baseline);
    frame.prints.forEach((pose, slot) => {
      const print = bridge.prints[slot];
      const shares: Readonly<Shares> = pose.source === 'personal' ? personal.shares : DEFAULT_SHARES;
      const key = `${shares.join(',')}:${pose.phase}`;
      if (print.key !== key) {
        print.element.innerHTML = imprintSVG(shares, { id: `tr-${bridge.index + 1}-${slot}`, phase: pose.phase, textureHref: './art/material-atlas.webp' });
        print.key = key;
        decoratePrint(print, bridge.index, slot);
      }
      const x = pose.x * horizontal;
      const y = pose.y * vertical;
      print.element.style.transform = `translate(-50%,-50%) translate(${x.toFixed(2)}px,${y.toFixed(2)}px) rotate(${pose.rotation}deg) scale(${pose.scale.toFixed(4)})`;
      print.element.style.opacity = pose.opacity.toFixed(4);
      print.element.style.zIndex = String(bridge.index === 0 ? 3 - slot : slot === 1 ? 3 : slot === 0 ? 2 : 1);
      print.parts.forEach((part, partIndex) => {
        if (!part) return;
        const offsets = [[-70, -48], [55, -15], [-40, 45]];
        part.wrapper.setAttribute('transform', `translate(${offsets[partIndex][0] * pose.separation} ${offsets[partIndex][1] * pose.separation})`);
        part.rect.setAttribute('width', String(1400 * pose.parts[partIndex]));
      });
      const label = bridge.labels[slot];
      softText(label, pose.label, { instant: reduced });
      label.style.position = 'absolute';
      label.style.whiteSpace = 'nowrap';
      label.style.left = `calc(50% + ${x.toFixed(2)}px)`;
      label.style.top = `calc(50% + ${(y + bridge.printWidth * .39 * pose.scale + 8).toFixed(2)}px)`;
      label.style.transform = 'translate(-50%,0)';
      label.style.opacity = String(frame.labels * pose.opacity);
    });
    bridge.memories.forEach((memory, side) => {
      if (!memory) return;
      const reveal = side === 0 ? frame.leftMemory : frame.rightMemory;
      memory.style.clipPath = side === 0 ? `inset(0 ${100 * (1 - reveal)}% 0 0)` : `inset(0 0 0 ${100 * (1 - reveal)}%)`;
      memory.style.transform = `translate(${(side === 0 ? -1 : 1) * frame.memoryRetreat * 28}%,${(side === 0 ? -1 : 1) * frame.memoryRetreat * 12}%) scale(${1 - frame.memoryRetreat * .12})`;
      memory.style.zIndex = '5';
      memory.style.visibility = reveal > 0 ? 'visible' : 'hidden';
    });
    // A dead band keeps a resting reader on one caption; captions fade out and in.
    const step = Math.min(4, Math.max(0, steppedIndex(frame.progress * 4 - .5 + 1e-8, bridge.captionStep)));
    bridge.captionStep = step;
    softText(bridge.caption, TRANSITION_COPY[bridge.index][step], { instant: reduced });
  }

  function update(): void {
    if (destroyed) return;
    if (options.isReduced() !== reduced) { resize(); return; }
    const y = window.scrollY;
    const personal = options.getPersonal();
    const missing = options.getDemo ? options.getDemo().missing : 0;
    for (const bridge of bridges) {
      const visible = y + window.innerHeight >= bridge.top - 24 && y <= bridge.bottom + 24;
      if (!visible && !bridge.wasVisible && bridge.lastStamp) continue;
      const p = reduced ? 1 : clamp01((y - bridge.top + bridge.stickyTop) / bridge.travel);
      const stamp = `${p.toFixed(5)}:${compact}:${reduced}:${missing}:${bridge.index >= 7 ? personal.shares.join(',') : ''}`;
      if (stamp !== bridge.lastStamp) {
        render(bridge, evaluateTransition(bridge.index, p, compact, missing), personal);
        bridge.lastStamp = stamp;
      }
      bridge.wasVisible = visible;
    }
  }

  resize();
  return {
    update, resize,
    destroy() {
      destroyed = true;
      // No RAF, observer or event listener is owned here. The sole narrative
      // driver owns lifecycle and can discard these references immediately.
      bridges.length = 0;
    },
  };
}
