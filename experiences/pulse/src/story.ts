/**
 * PULSE's scroll-derived story state.
 *
 * All geometry is measured by the DOM adapter; this module has no clock, browser
 * state, asset loader, or playback history. Seeking and reversing evaluate the
 * same function. SVG scene coordinates use a 1000 x 700 authoring rectangle.
 */

export type TransitionVariant =
  | 'section-reveal'
  | 'node-trace'
  | 'route-switch'
  | 'valve-focus'
  | 'outflow-trace'
  | 'magnify'
  | 'scale-return'
  | 'wall-reveal'
  | 'body-map'
  | 'home-return';

export interface TransitionSpec {
  id: string;
  title: string;
  source: string;
  target: string;
  anchor: string;
  variant: TransitionVariant;
  stages: readonly [string, string, string, string, string];
  fallback: string;
  mobile: string;
  rejection: string;
  /** Percent coordinates in the shared 1000 x 700 scene. */
  anchorStart: readonly [number, number];
  anchorEnd: readonly [number, number];
  representationLabel: string;
}

export const transitionSpecs: readonly TransitionSpec[] = [
  {
    id: 'TR-01-02', title: 'The Living Form to Four Chambers',
    source: 'CH-01', target: 'CH-02',
    anchor: 'Real wall edge and fixed anterior axis', variant: 'section-reveal',
    stages: [
      'Complete anatomical heart hold.',
      'View settles toward the designated sectional plane.',
      'Interior chambers are visible behind the illustrated cut surface.',
      'Registered labels take focus; the external contour stays.',
      'Four chambers hold in a stable anterior view.',
    ],
    fallback: 'Heart section with all four chambers and orientation labels.',
    mobile: 'Two atlas plates retain the same anterior orientation.',
    rejection: 'The wall pops out or anatomical left and right swap.',
    anchorStart: [58, 51], anchorEnd: [58, 51],
    representationLabel: 'Exterior to illustrated section',
  },
  {
    id: 'TR-02-03', title: 'Four Chambers to The Signal',
    source: 'CH-02', target: 'CH-03',
    anchor: 'Right atrium and sinoatrial-node region', variant: 'node-trace',
    stages: [
      'The chamber diagram holds.',
      'The right atrial label remains prominent as other labels recede.',
      'The electrical overlay aligns without hiding tissue boundaries.',
      'The SA and AV route becomes clear; chamber labels are secondary.',
      'The signal explanation holds.',
    ],
    fallback: 'Conduction diagram registered over the same heart section.',
    mobile: 'Separate labeled stages explain the electrical sequence.',
    rejection: 'Conduction lines are mistaken for blood-flow arrows.',
    anchorStart: [40, 30], anchorEnd: [40, 30],
    representationLabel: 'Electrical sequence, separate from blood flow',
  },
  {
    id: 'TR-03-04', title: 'The Signal to The Return',
    source: 'CH-03', target: 'CH-04',
    anchor: 'Right atrial contour', variant: 'route-switch',
    stages: [
      'The electrical overlay is visible.',
      'The SA-node mark becomes a secondary callout.',
      'The vena cava route enters beside the fixed right atrial contour.',
      'Blood flow takes focus with its own legend.',
      'Right-sided venous return is clear.',
    ],
    fallback: 'Right atrium and venae cavae with direction arrows.',
    mobile: 'Two distinct labeled modes retain a stable atrial landmark.',
    rejection: 'Electrical wiring appears to transform into a blood vessel.',
    anchorStart: [40, 35], anchorEnd: [40, 35],
    representationLabel: 'Changing explanatory layer',
  },
  {
    id: 'TR-04-05', title: 'The Return to One-Way Gates',
    source: 'CH-04', target: 'CH-05',
    anchor: 'Tricuspid opening between right atrium and right ventricle',
    variant: 'valve-focus',
    stages: [
      'The right-heart return composition holds.',
      'The tricuspid valve gains emphasis.',
      'Valve leaflets remain registered with the neighboring wall.',
      'Other valves enter in an explicitly comparative plate.',
      'The valve atlas is readable.',
    ],
    fallback: 'Tricuspid detail with a separate valve comparison plate.',
    mobile: 'Atrioventricular and outflow valve plates are paired.',
    rejection: 'Leaflet orientation or opening direction silently flips.',
    anchorStart: [42, 48], anchorEnd: [46, 48],
    representationLabel: 'Tricuspid landmark to valve comparison',
  },
  {
    id: 'TR-05-06', title: 'One-Way Gates to Toward the Lungs',
    source: 'CH-05', target: 'CH-06',
    anchor: 'Pulmonary valve root', variant: 'outflow-trace',
    stages: [
      'The pulmonary valve root anchors the outflow route.',
      'The valve root stays fixed as the outflow path is traced.',
      'The pulmonary trunk stays joined to the valve root.',
      'The trace continues into the pulmonary arterial branches.',
      'The right-heart-to-lung route holds.',
    ],
    fallback: 'Right ventricle, pulmonary valve, and pulmonary trunk route.',
    mobile: 'A labeled anatomical route is shown in simple steps.',
    rejection: 'The aortic valve is used as the pulmonary outlet.',
    anchorStart: [47, 58], anchorEnd: [47, 58],
    representationLabel: 'Right ventricle to pulmonary arteries',
  },
  {
    id: 'TR-06-07', title: 'Toward the Lungs to Exchange',
    source: 'CH-06', target: 'CH-07',
    anchor: 'Pulmonary arterial branch and explicit magnification boundary',
    variant: 'magnify',
    stages: [
      'The pulmonary artery branch is legible.',
      'An explicit magnification cue identifies the tissue being examined.',
      'Capillary and alveolus coexist behind an explicit diagram boundary.',
      'Gas-exchange structures become the principal subject.',
      'The alveolar barrier and gas directions hold.',
    ],
    fallback: 'Complete alveolar-capillary diagram labeled Schematic scale.',
    mobile: 'A stable magnified plate keeps air and blood compartments separate.',
    rejection: 'Blood enters the airspace or a zoom implies a literal pipe-to-sac conversion.',
    anchorStart: [68, 37], anchorEnd: [68, 37],
    representationLabel: 'Schematic magnification — different scale',
  },
  {
    id: 'TR-07-08', title: 'Exchange to The Way Back',
    source: 'CH-07', target: 'CH-08',
    anchor: 'Capillary outlet and oxygen-rich notation', variant: 'scale-return',
    stages: [
      'The alveolar diagram keeps air and blood spaces distinct.',
      'The outgoing capillary is highlighted.',
      'A scale label explains the conceptual change in view.',
      'Pulmonary veins appear as a separate, larger route.',
      'Return to the left atrium is visible.',
    ],
    fallback: 'Pulmonary veins leading into the left atrium.',
    mobile: 'Two labeled venous-path plates explain the scale change.',
    rejection: 'Blood is shown returning through a pulmonary artery.',
    anchorStart: [67, 57], anchorEnd: [65, 32],
    representationLabel: 'From microcirculation to pulmonary veins',
  },
  {
    id: 'TR-08-09', title: 'The Way Back to The Stronger Wall',
    source: 'CH-08', target: 'CH-09',
    anchor: 'Mitral opening and left ventricular chamber rim', variant: 'wall-reveal',
    stages: [
      'Pulmonary veins and the left atrium are readable.',
      'The route passes through the correct mitral position.',
      'The thicker left ventricular wall enters the section.',
      'The left ventricular section dominates.',
      'The wall comparison holds.',
    ],
    fallback: 'Left ventricular wall section with the mitral relation visible.',
    mobile: 'Left atrial and left ventricular plates share the mitral landmark.',
    rejection: 'Wall orientation or the direction of flow is inverted.',
    anchorStart: [64, 44], anchorEnd: [64, 51],
    representationLabel: 'Mitral inflow to the left ventricle',
  },
  {
    id: 'TR-09-10', title: 'The Stronger Wall to Around the Body',
    source: 'CH-09', target: 'CH-10',
    anchor: 'Aortic root and aorta', variant: 'body-map',
    stages: [
      'The thick left ventricular wall and outlet valve hold.',
      'The aortic root trace extends upward.',
      'The anatomical section meets an explicitly schematic body map.',
      'Systemic arterial branches become clear with their legend.',
      'The body-circulation diagram holds.',
    ],
    fallback: 'Complete schematic map from the aorta through tissues to veins.',
    mobile: 'Labeled anatomical and body-map plates form a still sequence.',
    rejection: 'An invented shortcut joins the aorta directly to venous return.',
    anchorStart: [58, 27], anchorEnd: [53, 30],
    representationLabel: 'Anatomical section to schematic body map',
  },
  {
    id: 'TR-10-11', title: 'Around the Body to Beat Again',
    source: 'CH-10', target: 'CH-11',
    anchor: 'Venous return entering the right atrium', variant: 'home-return',
    stages: [
      'The body map and returning route are readable.',
      'The venous trace approaches the heart.',
      'The original heart appears as the map recedes behind its outline.',
      'Electrical and blood overlays settle into separate layers.',
      'The final heartbeat atlas holds.',
    ],
    fallback: 'Original hero heart with separate circulation and electrical diagrams.',
    mobile: 'The original heart and selectable explanatory plates close the loop.',
    rejection: 'The ending claims that one blood cell completes the body circuit in one beat.',
    anchorStart: [44, 37], anchorEnd: [40, 35],
    representationLabel: 'Two circuits; a separate electrical sequence',
  },
];

export interface SectionBounds {
  id: string;
  top: number;
  height: number;
}

export interface StoryInput {
  scrollY: number;
  viewport: { width: number; height: number };
  chapters: readonly SectionBounds[];
  transitions: readonly SectionBounds[];
  reducedMotion?: boolean;
}

export interface TransitionFrame {
  id: string;
  index: number;
  progress: number;
  /** Visual progress becomes a stable endpoint in reduced-motion mode. */
  visualProgress: number;
  stage: number;
  stageLabel: string;
  variant: TransitionVariant;
  sourceChapter: string;
  targetChapter: string;
  owner: 'source' | 'target';
  captionOwner: 'source' | 'anchor' | 'target';
  sourceOpacity: number;
  targetOpacity: number;
  sourceTextOpacity: number;
  targetTextOpacity: number;
  sourceScale: number;
  targetScale: number;
  sourceClip: string;
  targetClip: string;
  reveal: number;
  lineProgress: number;
  anchor: { x: number; y: number; scale: number };
  representationLabel: string;
  scaleCueOpacity: number;
  electricalOpacity: number;
  bloodOpacity: number;
  active?: boolean;
}

export interface StorySnapshot {
  chapterIndex: number;
  chapterId: string | null;
  /** Normalized native document scroll distance, not a physiological clock. */
  progress: number;
  chapterProgress: number;
  focusY: number;
  scrollY: number;
  transition: (TransitionFrame & { active: boolean }) | null;
}

export const clamp01 = (value: number): number =>
  Number.isNaN(value) ? 0 : Math.min(1, Math.max(0, value));

const finite = (value: number, fallback = 0): number =>
  Number.isFinite(value) ? value : fallback;

/** Cubic step has exact endpoints and zero endpoint derivatives. */
export function smoothStep(start: number, end: number, value: number): number {
  if (end <= start) return value >= end ? 1 : 0;
  const t = clamp01((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}

const lerp = (a: number, b: number, p: number): number => a + (b - a) * p;
const percent = (n: number): string => `${Math.round(n * 10000) / 100}%`;

function clips(variant: TransitionVariant, reveal: number): [string, string] {
  const shown = percent(reveal);
  const hidden = percent(1 - reveal);
  switch (variant) {
    case 'section-reveal':
      return [`inset(0 0 0 ${shown})`, `inset(0 ${hidden} 0 0)`];
    case 'node-trace':
      return ['inset(0)', `circle(${percent(reveal * 1.1)} at 40% 30%)`];
    case 'route-switch':
      return ['inset(0)', `inset(${hidden} 0 0 0)`];
    case 'valve-focus':
      return ['inset(0)', `circle(${percent(reveal * 0.9)} at 46% 48%)`];
    case 'outflow-trace':
      // A fixed continuous outlet provides context. The path trace advances
      // from the registered valve root; vessel geometry is never sliced.
      return ['inset(0)', 'inset(0)'];
    case 'magnify':
      return ['inset(0)', `circle(${percent(reveal * 1.2)} at 68% 37%)`];
    case 'scale-return':
      return [`inset(0 ${shown} 0 0)`, `inset(0 0 0 ${hidden})`];
    case 'wall-reveal':
      return ['inset(0)', `ellipse(${percent(reveal * 0.9)} ${percent(reveal * 1.2)} at 64% 51%)`];
    case 'body-map':
      return [`inset(${shown} 0 0 0)`, `inset(${hidden} 0 0 0)`];
    case 'home-return':
      return ['inset(0)', `circle(${percent(reveal)} at 50% 50%)`];
  }
}

/** The index is zero based: 0 identifies TR-01-02, 9 identifies TR-10-11. */
export function evaluateTransition(
  index: number,
  progress: number,
  reducedMotion = false,
): TransitionFrame {
  if (!Number.isInteger(index) || index < 0 || index >= transitionSpecs.length) {
    throw new RangeError(`Transition index must be an integer from 0 to ${transitionSpecs.length - 1}.`);
  }
  const spec = transitionSpecs[index];
  const p = clamp01(progress);
  const v = reducedMotion ? (p < 0.5 ? 0 : 1) : p;
  const stage = Math.min(4, Math.floor(p * 4));
  const reveal = smoothStep(0.12, 0.88, v);
  const movement = smoothStep(0.15, 0.85, v);
  const sourceTextOpacity = 1 - smoothStep(0.14, 0.38, v);
  const targetTextOpacity = smoothStep(0.62, 0.85, v);
  const [sourceClip, targetClip] = clips(spec.variant, reveal);
  const isOverlay = spec.variant === 'node-trace' || spec.variant === 'route-switch';
  const isScaleChange = ['magnify', 'scale-return', 'body-map'].includes(spec.variant);
  const sourceScale = spec.variant === 'home-return'
    ? lerp(1, 0.86, movement)
    : spec.variant === 'valve-focus'
      ? lerp(1, 1.12, movement)
      : 1;
  const targetScale = spec.variant === 'magnify'
    ? lerp(0.96, 1, movement)
    : spec.variant === 'wall-reveal'
      ? lerp(1.05, 1, movement)
      : 1;

  return {
    id: spec.id,
    index,
    progress: p,
    visualProgress: v,
    stage,
    stageLabel: spec.stages[stage],
    variant: spec.variant,
    sourceChapter: spec.source,
    targetChapter: spec.target,
    owner: p < 0.5 ? 'source' : 'target',
    captionOwner: v < 0.38 ? 'source' : v > 0.62 ? 'target' : 'anchor',
    // The shared anatomical silhouette and anchor are outside these layers.
    // Opaque reveal masks carry the handoff; opacity only clears unused layers.
    sourceOpacity: reducedMotion ? 1 - v : 1 - smoothStep(0.84, 1, v),
    targetOpacity: reducedMotion ? v : smoothStep(0, 0.12, v),
    sourceTextOpacity,
    targetTextOpacity,
    sourceScale,
    targetScale,
    sourceClip,
    targetClip,
    reveal,
    lineProgress: smoothStep(isOverlay ? 0.3 : 0.12, 0.82, v),
    anchor: {
      x: lerp(spec.anchorStart[0], spec.anchorEnd[0], movement),
      y: lerp(spec.anchorStart[1], spec.anchorEnd[1], movement),
      scale: spec.variant === 'valve-focus' ? lerp(1, 1.18, movement) : 1,
    },
    representationLabel: spec.representationLabel,
    // The scale/representation label remains present even at either endpoint.
    scaleCueOpacity: isScaleChange ? 1 : smoothStep(0.1, 0.25, v),
    electricalOpacity: spec.variant === 'route-switch'
      ? 1 - smoothStep(0.1, 0.35, v)
      : spec.variant === 'node-trace' || spec.variant === 'home-return'
        ? smoothStep(0.4, 0.8, v)
        : 0,
    bloodOpacity: spec.variant === 'route-switch'
      ? smoothStep(0.45, 0.8, v)
      : spec.variant === 'node-trace'
        ? 0
        : smoothStep(0.2, 0.75, v),
  };
}

function normalizedBounds(section: SectionBounds): SectionBounds {
  return {
    id: section.id,
    top: Math.max(0, finite(section.top)),
    height: Math.max(1, finite(section.height, 1)),
  };
}

/**
 * The viewport center is the reading focus. A dedicated boundary is active
 * only while that center passes through its measured rectangle. Neighboring
 * chapters retain native document flow; this function never pins or scrolls.
 */
export function evaluateStory(input: StoryInput): StorySnapshot {
  const viewportHeight = Math.max(1, finite(input.viewport.height, 1));
  const chapters = input.chapters.map(normalizedBounds);
  const transitions = input.transitions.map(normalizedBounds);
  const documentEnd = Math.max(0, ...chapters.map(s => s.top + s.height), ...transitions.map(s => s.top + s.height));
  const maxScroll = Math.max(0, documentEnd - viewportHeight);
  const scrollY = Math.min(maxScroll, Math.max(0, finite(input.scrollY)));
  const focusY = Math.min(documentEnd, scrollY + viewportHeight / 2);

  if (chapters.length === 0) {
    return { chapterIndex: -1, chapterId: null, progress: 0, chapterProgress: 0, focusY, scrollY, transition: null };
  }

  let chapterIndex = 0;
  for (let index = 0; index < chapters.length; index += 1) {
    if (chapters[index].top <= focusY) chapterIndex = index;
  }

  let nearestIndex = -1;
  let nearestDistance = Infinity;
  for (let index = 0; index < transitions.length && index < transitionSpecs.length; index += 1) {
    const bounds = transitions[index];
    const distance = focusY < bounds.top
      ? bounds.top - focusY
      : Math.max(0, focusY - (bounds.top + bounds.height));
    if (distance < nearestDistance) {
      nearestIndex = index;
      nearestDistance = distance;
    }
  }

  let transition: StorySnapshot['transition'] = null;
  if (nearestIndex >= 0) {
    const bounds = transitions[nearestIndex];
    const p = clamp01((focusY - bounds.top) / bounds.height);
    const active = focusY >= bounds.top && focusY <= bounds.top + bounds.height;
    transition = { ...evaluateTransition(nearestIndex, p, input.reducedMotion), id: bounds.id, active };
    if (active) {
      chapterIndex = Math.min(chapters.length - 1, nearestIndex + (p >= 0.5 ? 1 : 0));
    }
  }

  const chapter = chapters[chapterIndex];
  return {
    chapterIndex,
    chapterId: chapter.id,
    progress: maxScroll === 0 ? 0 : clamp01(scrollY / maxScroll),
    chapterProgress: clamp01((focusY - chapter.top) / chapter.height),
    focusY,
    scrollY,
    transition,
  };
}
