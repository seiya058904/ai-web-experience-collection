/**
 * Authored, reversible editorial handoffs. All units are percentages of the
 * transition image plane; transforms are a framing device, not anatomy morphs.
 * Most plates use an opaque reveal. Anatomically different poses use
 * separate complete-pose frames; a reveal edge must never splice their bodies.
 */
export type TransitionMethod =
  | 'vein-pullback'
  | 'vein-magnifier'
  | 'leaf-margin'
  | 'specimen-register'
  | 'stem-descent'
  | 'skin-release'
  | 'illustrated-section'
  | 'pigment-reveal'
  | 'shell-seam'
  | 'meadow-return';

export interface TransitionAnchor {
  id: string;
  label: string;
  x: number;
  y: number;
  mobileX: number;
  mobileY: number;
}

type FiveNumbers = readonly [number, number, number, number, number];

export interface TransitionDefinition {
  id: string;
  from: string;
  to: string;
  method: TransitionMethod;
  anchor: TransitionAnchor;
  stages: readonly [string, string, string, string, string];
  sourceScale: FiveNumbers;
  targetScale: FiveNumbers;
  sourceX: FiveNumbers;
  sourceY: FiveNumbers;
  targetX: FiveNumbers;
  targetY: FiveNumbers;
  mobileTreatment: string;
  fallback: string;
  rejection: string;
  comparison?: {
    layout?: 'landscape';
    sourceTitle: string;
    sourceDetail: string;
    targetTitle: string;
    targetDetail: string;
    scope: string;
  };
}

const fixed: FiveNumbers = [1, 1, 1, 1, 1];
const zero: FiveNumbers = [0, 0, 0, 0, 0];
const base = {
  sourceScale: fixed, targetScale: fixed,
  sourceX: zero, sourceY: zero, targetX: zero, targetY: zero,
};

export const transitions: readonly TransitionDefinition[] = [
  {
    ...base,
    id: 'tr-01-02', from: 'ch-01', to: 'ch-02', method: 'vein-pullback',
    anchor: { id: 'egg-vein', label: 'The egg-bearing leaf vein', x: 69, y: 63, mobileX: 57, mobileY: 62 },
    stages: ['Egg and shell ridges hold.', 'The view backs away along the vein.', 'The egg remains visible within the leaf.', 'The neighboring stem comes into view.', 'The milkweed habitat is established.'],
    sourceScale: [1, 0.99, 0.97, 0.94, 0.92],
    targetScale: [1.12, 1.09, 1.05, 1.02, 1],
    sourceX: [0, 0.2, 0.5, 0.8, 1],
    targetX: [-1.2, -0.9, -0.5, -0.2, 0],
    mobileTreatment: 'Separate close and whole-leaf portrait plates share the vein landmark.',
    fallback: 'The host-plant plate, including the egg-bearing leaf.',
    rejection: 'The egg or vein changes identity, or the image goes dark during the pullback.',
  },
  {
    ...base,
    id: 'tr-02-03', from: 'ch-02', to: 'ch-03', method: 'vein-magnifier',
    anchor: { id: 'egg-vein', label: 'The vein junction beneath the egg', x: 69, y: 63, mobileX: 57, mobileY: 62 },
    stages: ['The milkweed leaf holds.', 'The view follows the vein.', 'The egg becomes the point of focus.', 'Shell ridges take priority.', 'The hatching observation is ready.'],
    sourceScale: [1, 1.02, 1.05, 1.08, 1.1],
    targetScale: [0.92, 0.94, 0.97, 0.99, 1],
    sourceX: [0, -0.3, -0.6, -0.9, -1.2],
    mobileTreatment: 'A restrained magnifier framing change leads into discrete hatching stills.',
    fallback: 'The egg and shell plate at the same leaf junction.',
    rejection: 'The ridged egg becomes a smooth pearl or its base leaves the leaf.',
  },
  {
    ...base,
    id: 'tr-03-04', from: 'ch-03', to: 'ch-04', method: 'leaf-margin',
    anchor: { id: 'shell-margin', label: 'The shell edge and adjacent leaf margin', x: 67, y: 67, mobileX: 54, mobileY: 65 },
    stages: ['The shell and hatchling hold.', 'Two complete observations, shown separately.', 'Compare the hatchling and feeding observations.', 'The feeding head and leaf edge remain visible.', 'The first feeding observation holds.'],
    comparison: {
      layout: 'landscape',
      sourceTitle: 'Hatchling beside the shell', sourceDetail: 'Shell, hatchling and leaf contact',
      targetTitle: 'Feeding at the leaf margin', targetDetail: 'Head, body and feeding edge visible',
      scope: 'Separate illustrated observations. Movement between them is not shown.',
    },
    mobileTreatment: 'Two stacked, labeled landscape plates retain the full shell, each complete larva, and its leaf contact.',
    fallback: 'The complete feeding plate, with its head, body and leaf margin visible.',
    rejection: 'A reveal edge joins the shell to a larva, crops either body or its leaf contact, or implies recorded movement between the observations.',
  },
  {
    ...base,
    id: 'tr-04-05', from: 'ch-04', to: 'ch-05', method: 'specimen-register',
    anchor: { id: 'bite-crescent', label: 'The crescent-shaped feeding edge', x: 65, y: 70, mobileX: 51, mobileY: 65 },
    stages: ['The feeding margin holds.', 'The bite remains a point of reference.', 'An indexed comparison introduces separate stages.', 'The later larval stages take focus.', 'The five-instar comparison is ready.'],
    sourceScale: [1, 0.99, 0.98, 0.97, 0.97],
    targetY: [2, 1.5, 1, 0.5, 0],
    mobileTreatment: 'Five separately selectable plates preserve stage detail and captions.',
    fallback: 'The five-instar comparison plate with its stage descriptions.',
    rejection: 'One caterpillar is simply scaled five times or the sequence implies instant growth.',
  },
  {
    ...base,
    id: 'tr-05-06', from: 'ch-05', to: 'ch-06', method: 'stem-descent',
    anchor: { id: 'silk-pad', label: 'The stem line and future attachment point', x: 68, y: 23, mobileX: 56, mobileY: 24 },
    stages: ['The fifth instar holds.', 'A nearby support enters the composition.', 'The mature larva is framed beneath the support.', 'A distinct J-hanging pose is introduced.', 'The silk pad and hanging larva hold.'],
    sourceY: [0, -0.4, -0.8, -1.2, -1.6],
    targetY: [-1.6, -1.2, -0.8, -0.4, 0],
    mobileTreatment: 'A full-height hanging plate keeps the support and entire J pose visible.',
    fallback: 'The attached J-hanging larva plate.',
    rejection: 'The silk support disappears or the larva floats beneath an unrelated branch.',
  },
  {
    ...base,
    id: 'tr-06-07', from: 'ch-06', to: 'ch-07', method: 'skin-release',
    anchor: { id: 'silk-pad', label: 'The silk pad and hanging pivot', x: 68, y: 23, mobileX: 56, mobileY: 24 },
    stages: ['The J form holds beneath the pad.', 'Two complete stages, shown separately.', 'Compare the hanging larva and attached pupa.', 'The jade pupa remains attached to its silk pad.', 'The attached chrysalis holds.'],
    comparison: {
      sourceTitle: 'J-hanging larva', sourceDetail: 'Rear attachment to a silk pad',
      targetTitle: 'Attached chrysalis', targetDetail: 'Pupal stage; cremaster anchored to silk',
      scope: 'Separate illustrated observations. The skin-shedding process is not shown.',
    },
    mobileTreatment: 'Two labeled complete poses retain the entire body and silk attachment within separate portrait frames.',
    fallback: 'The jade chrysalis at the established hanging pivot.',
    rejection: 'A reveal edge splices larva and pupa, either complete body or its support is cropped, or the comparison claims to show skin shedding.',
  },
  {
    ...base,
    id: 'tr-07-08', from: 'ch-07', to: 'ch-08', method: 'illustrated-section',
    anchor: { id: 'silk-pad', label: 'The outer shell and silk support', x: 68, y: 23, mobileX: 56, mobileY: 24 },
    stages: ['The opaque exterior holds.', 'The boundary of the explanatory layer appears.', 'A separate reconstruction introduces developing wing regions.', 'The reconstruction label and annotations settle.', 'The exterior and illustrative study are ready.'],
    mobileTreatment: 'Exterior and reconstruction remain separately labeled selectable plates.',
    fallback: 'The exterior shell with an accessible static explanatory diagram.',
    rejection: 'The illustration is presented as microscopy or the exterior becomes transparent glass.',
  },
  {
    ...base,
    id: 'tr-08-09', from: 'ch-08', to: 'ch-09', method: 'pigment-reveal',
    anchor: { id: 'silk-pad', label: 'The shell outline and gold details', x: 68, y: 23, mobileX: 56, mobileY: 24 },
    stages: ['The explanatory study holds.', 'The natural exterior returns.', 'The late pattern returns to the exterior view.', 'The developing wing pigmentation takes focus.', 'The late pupa holds before emergence.'],
    mobileTreatment: 'Early and late plates allow direct comparison without a transparency effect.',
    fallback: 'The late patterned chrysalis with the support intact.',
    rejection: 'Two shells overlap as ghosts or the color change is described as glass-like transparency.',
  },
  {
    ...base,
    id: 'tr-09-10', from: 'ch-09', to: 'ch-10', method: 'shell-seam',
    anchor: { id: 'silk-pad', label: 'The shell seam beneath the same silk pad', x: 68, y: 23, mobileX: 56, mobileY: 24 },
    stages: ['The late pupa holds.', 'Two complete stages, before and after emergence.', 'Compare the late pupa and newly emerged adult.', 'The adult hangs beneath its empty shell.', 'The wing-expansion sequence is ready.'],
    comparison: {
      sourceTitle: 'Late pupa', sourceDetail: 'Wing pattern beneath the retained casing',
      targetTitle: 'Newly emerged adult', targetDetail: 'Crumpled wings; empty shell retained',
      scope: 'Separate illustrated observations. The shell-opening movement is not shown.',
    },
    mobileTreatment: 'The late pupa and adult with spent shell remain complete in separate labeled portrait frames.',
    fallback: 'The hanging emergence plate with its spent shell.',
    rejection: 'A reveal edge joins an intact pupa to an empty shell, either support is cropped, or the comparison claims to show the opening movement.',
  },
  {
    ...base,
    id: 'tr-10-11', from: 'ch-10', to: 'ch-11', method: 'meadow-return',
    anchor: { id: 'wing-leaf-edge', label: 'The orange-black wing edge and familiar leaf margin', x: 68, y: 53, mobileX: 56, mobileY: 54 },
    stages: ['The established wing pattern holds.', 'The view widens toward the habitat.', 'Wing and leaf share the composition.', 'The butterfly belongs to the larger meadow.', 'The leaf and complete life cycle resolve the story.'],
    sourceScale: [1, 0.98, 0.96, 0.94, 0.92],
    targetScale: [1.1, 1.08, 1.05, 1.02, 1],
    sourceX: [0, 0.3, 0.6, 0.9, 1.2],
    targetX: [-1.2, -0.9, -0.6, -0.3, 0],
    mobileTreatment: 'Two habitat plates retain the adult-and-milkweed relationship.',
    fallback: 'The adult and milkweed habitat plate followed by the lifecycle key.',
    rejection: 'The adult changes species, a swarm replaces the individual, or the milkweed disappears.',
  },
] as const;

export interface TransitionSnapshot {
  index: number;
  id: string;
  from: string;
  to: string;
  method: TransitionMethod;
  progress: number;
  visualProgress: number;
  stage: 0 | 25 | 50 | 75 | 100;
  stageIndex: number;
  stageLabel: string;
  presentation: 'occlusion' | 'paired-study';
  poseMode: 'source' | 'comparison' | 'target' | null;
  srcScale: number;
  dstScale: number;
  srcX: number;
  srcY: number;
  dstX: number;
  dstY: number;
  reveal: number;
  clip: string;
  anchor: TransitionAnchor;
  captionOwner: 'source' | 'bridge' | 'target';
  sourceTextOpacity: number;
  targetTextOpacity: number;
  sourceVisible: boolean;
  targetVisible: boolean;
  /** Continuous paired-study blend: both poses stay in layout and cross-fade, so nothing appears or leaves in one frame. */
  pairBlend: { sourceOpacity: number; targetOpacity: number; spread: number };
  fallbackChapter: string;
  reducedMotion: boolean;
}

/** Saturating progress is intentional: Infinity means end; NaN means start. */
export function clampProgress(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function sample(values: FiveNumbers, progress: number): number {
  const position = progress * 4;
  const left = Math.min(3, Math.floor(position));
  const fraction = position - left;
  return values[left]! + (values[left + 1]! - values[left]!) * fraction;
}

function percent(value: number): string {
  return `${Number(value.toFixed(5))}%`;
}

function clipFor(method: TransitionMethod, p: number, anchor: TransitionAnchor): string {
  if (p === 0) return 'inset(0 100% 0 0)';
  if (p === 1) return 'inset(0 0 0 0)';
  const remain = percent((1 - p) * 100);
  switch (method) {
    case 'vein-pullback':
      return `ellipse(${percent(p * 145)} ${percent(p * 130)} at ${anchor.x}% ${anchor.y}%)`;
    case 'vein-magnifier': {
      const edge = 118 - p * 136;
      return `inset(0 0 0 ${percent(Math.min(100, Math.max(0, edge - 9)))})`;
    }
    case 'leaf-margin':
      return `inset(0 0 0 ${remain})`;
    case 'specimen-register': {
      const edge = 108 - p * 116;
      return `inset(${percent(Math.min(100, Math.max(0, edge - 4)))} 0 0 0)`;
    }
    case 'stem-descent':
      return `inset(0 0 ${remain} 0)`;
    case 'skin-release':
      return 'inset(0 0 0 0)';
    case 'illustrated-section':
      return `inset(0 ${remain} 0 0)`;
    case 'pigment-reveal':
      return `ellipse(${percent(p * 120)} ${percent(p * 150)} at ${anchor.x}% 58%)`;
    case 'shell-seam':
      return 'inset(0 0 0 0)';
    case 'meadow-return':
      return `ellipse(${percent(p * 150)} ${percent(p * 120)} at ${anchor.x}% ${anchor.y}%)`;
  }
}

const softStep = (a: number, b: number, x: number): number => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Source alone, both poses side by side, target alone: one continuous blend instead of two stepped switches. */
function pairBlend(p: number, reduced: boolean): { sourceOpacity: number; targetOpacity: number; spread: number } {
  if (reduced) return { sourceOpacity: p < 0.5 ? 1 : 0, targetOpacity: p < 0.5 ? 0 : 1, spread: 1 };
  return {
    sourceOpacity: 1 - softStep(0.8, 0.97, p),
    targetOpacity: softStep(0.03, 0.2, p),
    spread: softStep(0.03, 0.2, p) * (1 - softStep(0.8, 0.97, p)),
  };
}

/** Pure evaluation; call in any order, including reverse and direct midpoint. */
export function evaluateTransition(index: number, progress: number, reducedMotion = false, mobile = false): TransitionSnapshot {
  const safeIndex = Number.isFinite(index) ? Math.min(transitions.length - 1, Math.max(0, Math.floor(index))) : 0;
  const definition = transitions[safeIndex]!;
  const anchor: TransitionAnchor = {
    ...definition.anchor,
    x: mobile ? definition.anchor.mobileX : definition.anchor.x,
    y: mobile ? definition.anchor.mobileY : definition.anchor.y,
  };
  const p = clampProgress(progress);
  const visualProgress = reducedMotion ? (p < 0.5 ? 0 : 1) : p;
  // Native scroll offsets can round a requested quarter stop slightly down.
  // Snap only the caption checkpoint (within 0.5%); never alter image geometry.
  const nearestQuarter = Math.round(p * 4) / 4;
  const captionProgress = Math.abs(p - nearestQuarter) <= 0.005 + Number.EPSILON ? nearestQuarter : p;
  const stageIndex = Math.min(4, Math.floor(captionProgress * 4));
  const poseMode: TransitionSnapshot['poseMode'] = definition.comparison
    ? reducedMotion ? (p < 0.5 ? 'source' : 'target') : p < 0.125 ? 'source' : p > 0.875 ? 'target' : 'comparison'
    : null;
  const sourceTextOpacity = poseMode ? (poseMode === 'source' ? 1 : 0)
    : reducedMotion ? (p < 0.5 ? 1 : 0) : clampProgress(1 - p / 0.3);
  const targetTextOpacity = poseMode ? (poseMode === 'target' ? 1 : 0)
    : reducedMotion ? (p < 0.5 ? 0 : 1) : clampProgress((p - 0.7) / 0.3);
  const stageLabel = definition.comparison && reducedMotion
    ? definition.stages[poseMode === 'source' ? 0 : 4]!
    : definition.stages[stageIndex]!;
  return {
    index: safeIndex, id: definition.id, from: definition.from, to: definition.to,
    method: definition.method, progress: p, visualProgress,
    stage: (stageIndex * 25) as TransitionSnapshot['stage'],
    stageIndex, stageLabel,
    presentation: definition.comparison ? 'paired-study' : 'occlusion', poseMode,
    srcScale: reducedMotion ? 1 : sample(definition.sourceScale, p),
    dstScale: reducedMotion ? 1 : sample(definition.targetScale, p),
    srcX: reducedMotion ? 0 : sample(definition.sourceX, p),
    srcY: reducedMotion ? 0 : sample(definition.sourceY, p),
    dstX: reducedMotion ? 0 : sample(definition.targetX, p),
    dstY: reducedMotion ? 0 : sample(definition.targetY, p),
    reveal: visualProgress,
    clip: poseMode ? (poseMode === 'source' ? 'inset(0 100% 0 0)' : 'inset(0 0 0 0)') : clipFor(definition.method, visualProgress, anchor),
    anchor,
    captionOwner: sourceTextOpacity > 0 ? 'source' : targetTextOpacity > 0 ? 'target' : 'bridge',
    sourceTextOpacity, targetTextOpacity,
    pairBlend: pairBlend(p, reducedMotion),
    sourceVisible: poseMode ? poseMode !== 'target' : visualProgress < 1,
    targetVisible: poseMode ? poseMode !== 'source' : visualProgress > 0,
    fallbackChapter: definition.to, reducedMotion,
  };
}
