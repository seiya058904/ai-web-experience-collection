/**
 * FRAME's deterministic performance data. Frame numbers are deliberately 1-based:
 * the two editable holds belong to actual frames 6 and 18, never to array indices.
 * Positions are world coordinates, y points up, and the tabletop is y = 0.
 */
export const FRAMES = 24;
export const FPS = 12;
export const MAX_HOLD = 12;
export const OPENING_HOLD = 6;
export const ENDING_HOLD = 6;
export const BLOCK_WIDTH = 0.8;
export const BLOCK_HEIGHT = 0.72;
export const TARGET_X = 1.35;
export const BLOCK_START_X = -1.6;
export const PRESETS = ['even', 'ease-in', 'ease-out'] as const;

export type SpacingPreset = (typeof PRESETS)[number];
export type Preset = SpacingPreset;
export type Phase = 'prepare' | 'push' | 'overshoot' | 'repair' | 'settle';

export interface TimelineConfig {
  readonly preset: SpacingPreset;
  /** Additional display beats of the same preparation pose. */
  readonly hold6: number;
  /** Additional display beats of the same looking-back pose. */
  readonly hold18: number;
}

export const DEFAULT_CONFIG: Readonly<TimelineConfig> = Object.freeze({
  preset: 'even',
  hold6: 0,
  hold18: 0,
});

export const PRESET_LABELS: Readonly<Record<SpacingPreset, string>> = Object.freeze({
  even: 'Even steps',
  'ease-in': 'Slow, then quick',
  'ease-out': 'Quick, then slow',
});

export interface Point3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface FootPose extends Point3 {
  /** Radians about the lateral foot axis. */
  readonly rotation: number;
  /** y = 0 denotes the sole's tabletop contact, not the mesh center. */
  readonly planted: boolean;
}

export interface HandPose extends Point3 {
  readonly contact: boolean;
  readonly surface: 'left' | 'top' | 'front' | null;
}

export interface Pose {
  readonly frame: number;
  readonly phase: Phase;
  readonly blockX: number;
  /** Center of the block; its lower face stays on the table. */
  readonly blockY: number;
  readonly boopX: number;
  readonly bodyY: number;
  readonly scaleX: number;
  readonly scaleY: number;
  /** Body rotation in radians around the z axis. Negative leans toward the block. */
  readonly lean: number;
  /** A small adjustment to the same permanent upper-right fold. */
  readonly fold: number;
  /** Relative gaze direction, not a different face or a translated eye socket. */
  readonly eyes: Readonly<{ x: number; y: number; openness: number }>;
  /** -1: concern, 0: neutral pressed mouth, +1: a restrained smile. */
  readonly mouth: number;
  readonly leftFoot: FootPose;
  readonly rightFoot: FootPose;
  readonly leftHand: HandPose;
  readonly rightHand: HandPose;
  readonly contact: boolean;
  readonly description: string;
}

export interface FrameSegment {
  readonly frame: number;
  readonly beats: number;
  /** Inclusive first beat index. */
  readonly startBeat: number;
  /** Exclusive end beat index. */
  readonly endBeat: number;
  readonly startMs: number;
  readonly durationMs: number;
}

export interface Timeline {
  readonly config: Readonly<TimelineConfig>;
  readonly fps: typeof FPS;
  /** Every entry points to an existing, independently authored pose. */
  readonly beats: readonly number[];
  readonly segments: readonly FrameSegment[];
  readonly totalBeats: number;
  readonly duration: number;
  readonly durationMs: number;
}

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));

const finiteInteger = (value: unknown, fallback: number, low: number, high: number) =>
  typeof value === 'number' && Number.isFinite(value)
    ? clamp(Math.round(value), low, high)
    : fallback;

export function normalizeFrame(value: unknown): number {
  return finiteInteger(value, 1, 1, FRAMES);
}

export function sanitizeConfig(value: unknown = DEFAULT_CONFIG): Readonly<TimelineConfig> {
  const candidate = value && typeof value === 'object'
    ? (value as Partial<TimelineConfig>)
    : DEFAULT_CONFIG;
  const preset = PRESETS.includes(candidate.preset as SpacingPreset)
    ? (candidate.preset as SpacingPreset)
    : DEFAULT_CONFIG.preset;
  return Object.freeze({
    preset,
    hold6: finiteInteger(candidate.hold6, DEFAULT_CONFIG.hold6, 0, MAX_HOLD),
    hold18: finiteInteger(candidate.hold18, DEFAULT_CONFIG.hold18, 0, MAX_HOLD),
  });
}

export function configsEqual(a: TimelineConfig, b: TimelineConfig): boolean {
  return a.preset === b.preset && a.hold6 === b.hold6 && a.hold18 === b.hold18;
}

/** Exactly six positions, with exactly the same endpoints for all three takes. */
export function pushPositions(preset: SpacingPreset = 'even'): readonly number[] {
  const selected = PRESETS.includes(preset) ? preset : 'even';
  return Object.freeze(Array.from({ length: 6 }, (_, index) => {
    if (index === 0) return BLOCK_START_X;
    if (index === 5) return TARGET_X;
    const t = index / 5;
    const fraction = selected === 'ease-in' ? t * t
      : selected === 'ease-out' ? 1 - (1 - t) * (1 - t) : t;
    return BLOCK_START_X + (TARGET_X - BLOCK_START_X) * fraction;
  }));
}

interface PoseDraft {
  blockX: number;
  boopX: number;
  bodyY: number;
  scaleY: number;
  lean: number;
  gazeX: number;
  gazeY: number;
  openness: number;
  mouth: number;
  fold: number;
  contact: boolean;
  leftLift?: number;
  rightLift?: number;
  leftX?: number;
  rightX?: number;
  handDrop?: number;
}

const descriptions = [
  'Boop notices the yellow outline beyond the red block.',
  'A small glance from the block to the empty outline.',
  'Boop brings both hands closer and settles its feet.',
  'The body lowers a little; the eyes return to the block.',
  'Boop plants both feet and gathers its weight.',
  'Ready: both hands meet the block before it moves.',
  'The push begins from the same starting position in every take.',
  'Boop advances with the block; one foot supports the body.',
  'The next complete pose carries the hands, feet, body and block together.',
  'The push continues with the chosen distance between poses.',
  'Boop approaches the outline, keeping its hands on the block.',
  'The block reaches the shared push endpoint at the outline.',
  'A little too much momentum carries the block beyond the outline.',
  'Boop follows through, still touching the block.',
  'The hands release as Boop notices the overshoot.',
  'The block stops just beyond the yellow outline.',
  'Boop checks the block, then starts to look back.',
  'A quiet look back gives the mistake time to register.',
  'Boop grips the block again and draws it gently back.',
  'A smaller pulling pose brings the block close to its place.',
  'The correction slows as the block approaches the center.',
  'The block rests inside the outline, with a little room around it.',
  'Boop lets go and allows a small smile.',
  'Just right: the block is aligned, and Boop is quietly pleased.',
] as const;

function phaseFor(frame: number): Phase {
  if (frame <= 6) return 'prepare';
  if (frame <= 12) return 'push';
  if (frame <= 16) return 'overshoot';
  if (frame <= 20) return 'repair';
  return 'settle';
}

/** Authored poses outside the variable push segment are shared between takes. */
function baseDraft(frame: number): PoseDraft {
  const base: PoseDraft = {
    blockX: BLOCK_START_X,
    boopX: -2.9,
    bodyY: 0.96,
    scaleY: 1,
    lean: 0,
    gazeX: 0.7,
    gazeY: 0.08,
    openness: 1,
    mouth: 0,
    fold: 0,
    contact: false,
  };
  const preparation = [
    { gazeX: 0.75, gazeY: 0.1, handDrop: 0.16 },
    { gazeX: 0.9, gazeY: 0.13, lean: -0.015, handDrop: 0.12 },
    { gazeX: 0.55, gazeY: 0.02, boopX: -2.88, bodyY: 0.945, handDrop: 0.075 },
    { gazeX: 0.45, gazeY: -0.08, bodyY: 0.92, scaleY: 0.965, lean: -0.035, handDrop: 0.04 },
    { gazeX: 0.4, gazeY: -0.12, bodyY: 0.895, scaleY: 0.93, lean: -0.055, fold: -0.025, handDrop: 0.018 },
    { gazeX: 0.45, gazeY: -0.1, boopX: -2.85, bodyY: 0.9, scaleY: 0.935, lean: -0.07, fold: -0.035, contact: true },
  ];
  if (frame <= 6) return {
    ...base, ...preparation[frame - 1],
    // Preparation shifts weight above stable feet rather than sliding both soles.
    leftX: -3.09, rightX: -2.45,
  };
  if (frame <= 12) {
    const index = frame - 7;
    const x = pushPositions('even')[index];
    return {
      ...base, blockX: x, boopX: x - 1.25, bodyY: 0.925 + (index % 2) * 0.018,
      scaleY: 0.96 + (index % 2) * 0.018,
      lean: -0.07 + index * 0.004, gazeX: 0.55, gazeY: -0.05,
      fold: -0.025 + index * 0.003, contact: true,
      // The common endpoint catches the right foot and lifts the old support.
      // Every take can therefore hand over to it without teleporting a planted sole.
      leftLift: index === 0 ? 0 : index % 2 === 1 ? 0.075 : 0,
      rightLift: index === 0 || index === 5 ? 0 : index % 2 === 0 ? 0.075 : 0,
      rightX: index === 0 ? -2.45 : undefined,
    };
  }
  const ending: Record<number, Partial<PoseDraft>> = {
    13: { blockX: 1.48, boopX: 0.23, bodyY: 0.955, scaleY: 0.99, lean: -0.04, gazeX: 0.65, contact: true, rightLift: 0.04 },
    14: { blockX: 1.64, boopX: 0.39, bodyY: 0.96, scaleY: 1, lean: -0.025, gazeX: 0.7, contact: true, leftLift: 0.05 },
    15: { blockX: 1.75, boopX: 0.45, bodyY: 0.97, scaleY: 1.015, lean: 0.025, gazeX: 0.55, openness: 1.05, mouth: -0.16, handDrop: 0.025, leftLift: 0.035, rightX: 0.63 },
    16: { blockX: 1.8, boopX: 0.47, bodyY: 0.965, scaleY: 1.01, lean: 0.045, gazeX: 0.25, openness: 1.08, mouth: -0.28, handDrop: 0.05, rightX: 0.63 },
    17: { blockX: 1.8, boopX: 0.47, bodyY: 0.955, scaleY: 0.995, lean: 0.025, gazeX: -0.1, gazeY: -0.1, mouth: -0.24, handDrop: 0.08, rightX: 0.63 },
    18: { blockX: 1.8, boopX: 0.47, bodyY: 0.95, scaleY: 0.99, lean: 0.015, gazeX: -0.65, gazeY: -0.16, mouth: -0.17, fold: 0.025, handDrop: 0.095, rightX: 0.63 },
    19: { blockX: 1.66, boopX: 0.39, bodyY: 0.925, scaleY: 0.965, lean: 0.07, gazeX: 0.15, gazeY: -0.1, contact: true, rightLift: 0.045, mouth: -0.08, leftX: 0.23 },
    20: { blockX: 1.48, boopX: 0.21, bodyY: 0.935, scaleY: 0.975, lean: 0.055, gazeX: 0.05, gazeY: -0.08, contact: true, leftLift: 0.04 },
    21: { blockX: 1.37, boopX: 0.1, bodyY: 0.95, scaleY: 0.99, lean: 0.025, gazeX: 0.2, gazeY: -0.07, contact: true, mouth: 0.12, rightLift: 0.04 },
    22: { blockX: TARGET_X, boopX: 0.08, bodyY: 0.96, scaleY: 1, lean: 0.005, gazeX: 0.3, gazeY: -0.04, contact: true, mouth: 0.25, leftX: -0.14, rightX: 0.32 },
    23: { blockX: TARGET_X, boopX: 0.04, bodyY: 0.95, scaleY: 0.99, lean: 0, gazeX: 0.3, gazeY: 0, mouth: 0.5, handDrop: 0.13, leftX: -0.14, rightX: 0.32 },
    24: { blockX: TARGET_X, boopX: 0.02, bodyY: 0.94, scaleY: 0.98, lean: -0.008, gazeX: 0.4, gazeY: 0.035, openness: 0.88, mouth: 0.65, fold: 0.015, handDrop: 0.18, leftX: -0.14, rightX: 0.32 },
  };
  return { ...base, ...ending[frame] };
}

function finishPose(frame: number, draft: PoseDraft): Readonly<Pose> {
  const leftY = draft.leftLift ?? 0;
  const rightY = draft.rightLift ?? 0;
  const handX = draft.contact ? draft.blockX - BLOCK_WIDTH / 2 : draft.boopX + 0.72;
  const handY = 0.44 - (draft.handDrop ?? 0);
  const pulling = draft.contact && frame >= 19 && frame <= 22;
  return Object.freeze({
    frame,
    phase: phaseFor(frame),
    blockX: draft.blockX,
    blockY: BLOCK_HEIGHT / 2,
    boopX: draft.boopX,
    bodyY: draft.bodyY,
    scaleX: 1 + (1 - draft.scaleY) * 0.55,
    scaleY: draft.scaleY,
    lean: draft.lean,
    fold: draft.fold,
    eyes: Object.freeze({ x: draft.gazeX, y: draft.gazeY, openness: draft.openness }),
    mouth: draft.mouth,
    leftFoot: Object.freeze({
      x: draft.leftX ?? draft.boopX - 0.24, y: leftY, z: 0.28,
      rotation: leftY ? -0.12 : 0, planted: leftY === 0,
    }),
    rightFoot: Object.freeze({
      x: draft.rightX ?? draft.boopX + 0.24, y: rightY, z: 0.16,
      rotation: rightY ? 0.12 : 0, planted: rightY === 0,
    }),
    leftHand: Object.freeze({
      x: pulling ? draft.blockX - 0.29 : handX,
      y: handY,
      z: pulling ? BLOCK_WIDTH / 2 : draft.contact ? 0.33 : 0.24,
      contact: draft.contact, surface: pulling ? 'front' : draft.contact ? 'left' : null,
    }),
    rightHand: Object.freeze({
      x: draft.contact ? draft.blockX - 0.3 : handX,
      y: draft.contact ? BLOCK_HEIGHT : handY,
      z: draft.contact ? -0.13 : -0.24,
      contact: draft.contact, surface: draft.contact ? 'top' : null,
    }),
    contact: draft.contact,
    description: descriptions[frame - 1],
  });
}

const basePoses = Array.from({ length: FRAMES }, (_, index) => finishPose(index + 1, baseDraft(index + 1)));

function buildTake(preset: SpacingPreset): readonly Readonly<Pose>[] {
  const positions = pushPositions(preset);
  return Object.freeze(basePoses.map((base, index) => {
    const frame = index + 1;
    // Shared objects guarantee an exact pose match at both push endpoints and
    // throughout every unedited story phase; there is no random per-frame noise.
    if (frame <= 7 || frame >= 12) return base;
    const pushIndex = frame - 7;
    const draft = baseDraft(frame);
    const blockX = positions[pushIndex];
    const boopX = blockX - 1.25;
    const previousBodyX = positions[pushIndex - 1] - 1.25;
    const stepDistance = positions[pushIndex] - positions[pushIndex - 1];
    const previousDistance = pushIndex > 1
      ? positions[pushIndex - 1] - positions[pushIndex - 2] : stepDistance;
    draft.blockX = blockX;
    draft.boopX = boopX;
    // Weight, support and arm endpoints are regenerated with each spacing take.
    // A planted foot retains the preceding pose's support coordinate. The other
    // foot travels; its lift communicates that movement rather than a foot slide.
    if (pushIndex % 2 === 1) {
      draft.rightX = pushIndex === 1 ? basePoses[6].rightFoot.x : previousBodyX + 0.24;
      // Swing ahead before becoming the next pose's support. Planting behind the
      // body here made the fastest take require an implausibly long trailing leg.
      draft.leftX = boopX + 0.2;
    } else {
      draft.leftX = previousBodyX + 0.2;
      draft.rightX = boopX + 0.24;
    }
    const effort = clamp(stepDistance / (TARGET_X - BLOCK_START_X), 0, 0.4);
    const acceleration = (stepDistance - previousDistance) / (TARGET_X - BLOCK_START_X);
    draft.scaleY -= effort * 0.045 + acceleration * 0.035;
    draft.bodyY -= effort * 0.025 + acceleration * 0.015;
    draft.lean -= effort * 0.055 + acceleration * 0.03;
    draft.fold -= effort * 0.018 + acceleration * 0.012;
    return finishPose(frame, draft);
  }));
}

const takes: Readonly<Record<SpacingPreset, readonly Readonly<Pose>[]>> = Object.freeze({
  even: buildTake('even'),
  'ease-in': buildTake('ease-in'),
  'ease-out': buildTake('ease-out'),
});

export function getPose(frame: number, preset: SpacingPreset = 'even'): Readonly<Pose> {
  const selected = PRESETS.includes(preset) ? preset : 'even';
  return takes[selected][normalizeFrame(frame) - 1];
}

export function makeTimeline(value: unknown = DEFAULT_CONFIG): Readonly<Timeline> {
  const config = sanitizeConfig(value);
  const beats: number[] = [];
  const segments: FrameSegment[] = [];
  for (let frame = 1; frame <= FRAMES; frame += 1) {
    const additional = frame === 1 ? OPENING_HOLD
      : frame === FRAMES ? ENDING_HOLD
      : frame === 6 ? config.hold6
      : frame === 18 ? config.hold18 : 0;
    const count = 1 + additional;
    const startBeat = beats.length;
    for (let repeat = 0; repeat < count; repeat += 1) beats.push(frame);
    segments.push(Object.freeze({
      frame, beats: count, startBeat, endBeat: startBeat + count,
      startMs: startBeat * 1000 / FPS,
      durationMs: count * 1000 / FPS,
    }));
  }
  return Object.freeze({
    config, fps: FPS, beats: Object.freeze(beats), segments: Object.freeze(segments),
    totalBeats: beats.length, duration: beats.length / FPS,
    durationMs: beats.length * 1000 / FPS,
  });
}

export function frameAtBeat(timeline: Timeline, beat: number): number {
  const selected = finiteInteger(beat, 0, 0, timeline.totalBeats - 1);
  return timeline.beats[selected];
}

export function beatForFrame(timeline: Timeline, frame: number): number {
  return timeline.segments[normalizeFrame(frame) - 1].startBeat;
}

export function frameAtTime(timeline: Timeline, elapsedMs: number): number {
  const time = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  const beat = Math.min(timeline.totalBeats - 1, Math.floor(time * FPS / 1000));
  return timeline.beats[beat];
}

export function stepFrame(frame: number, direction: -1 | 1): number {
  return clamp(normalizeFrame(frame) + direction, 1, FRAMES);
}

export interface ConfigHistory {
  readonly current: Readonly<TimelineConfig>;
  readonly undo: readonly Readonly<TimelineConfig>[];
}

export function createHistory(initial: unknown = DEFAULT_CONFIG): Readonly<ConfigHistory> {
  return Object.freeze({ current: sanitizeConfig(initial), undo: Object.freeze([]) });
}

/** A no-op edit preserves the history object and cannot consume an undo step. */
export function editHistory(history: ConfigHistory, patch: Partial<TimelineConfig>): Readonly<ConfigHistory> {
  const current = sanitizeConfig({ ...history.current, ...patch });
  if (configsEqual(current, history.current)) return history;
  return Object.freeze({
    current,
    undo: Object.freeze([...history.undo.slice(-63), history.current]),
  });
}

export function undoHistory(history: ConfigHistory): Readonly<ConfigHistory> {
  if (!history.undo.length) return history;
  return Object.freeze({
    current: history.undo[history.undo.length - 1],
    undo: Object.freeze(history.undo.slice(0, -1)),
  });
}

export function resetHistory(history: ConfigHistory): Readonly<ConfigHistory> {
  return editHistory(history, DEFAULT_CONFIG);
}
