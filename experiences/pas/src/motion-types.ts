/** All scene positions are world-space metres. +Y is up; viewers look from +Z. */
export type Vec3 = [number, number, number];
export type DancerId = 'cen' | 'cheng';
export type Side = 'left' | 'right';
export type TimingMode = 'unison' | 'echo';
export type JointName =
  | 'pelvis' | 'spine' | 'chest' | 'neck' | 'head' | 'headTop' | 'nose'
  | 'leftShoulder' | 'leftElbow' | 'leftWrist' | 'leftHand'
  | 'rightShoulder' | 'rightElbow' | 'rightWrist' | 'rightHand'
  | 'leftHip' | 'leftKnee' | 'leftAnkle' | 'leftToe'
  | 'rightHip' | 'rightKnee' | 'rightAnkle' | 'rightToe';

export interface HandPose {
  /** Palm centre, not an invented extra joint. */
  position: Vec3;
  /** Unit vector pointing from the wrist through the middle finger. */
  forward: Vec3;
  /** Unit vector pointing out of the palm; perpendicular to forward. */
  normal: Vec3;
  /** Thumb, index, middle, ring, little. 0 = open; 1 = closed. */
  fingers: [number, number, number, number, number];
  curl: number;
  spread: number;
  contact: boolean;
}

export interface FootPose {
  ankle: Vec3;
  toe: Vec3;
  yaw: number;
  planted: boolean;
  /** 0..1 through the current swing; zero during stance. */
  swing: number;
}

export interface BodyPose {
  id: DancerId;
  root: Vec3;
  rootYaw: number;
  chestYaw: number;
  headYaw: number;
  joints: Record<JointName, Vec3>;
  hands: Record<Side, HandPose>;
  feet: Record<Side, FootPose>;
  /** Small world displacement of chest relative to neutral posture. */
  lean: Vec3;
  phrasePhase: number;
}

export interface DanceContact {
  kind: 'none' | 'palm' | 'grip' | 'back' | 'fingertips';
  strength: number;
  point: Vec3 | null;
  /** Cen RIGHT / Cheng LEFT, chosen from the actual model's anatomy. */
  hands: readonly ['right', 'left'] | null;
}

export interface CameraPose {
  target: Vec3;
  position: Vec3;
  /** The main view stays legible; detail is also available as a separate inset. */
  detail: 'full' | 'feet' | 'hands';
  detailTarget: Vec3;
  detailMix: number;
}

export interface DanceFrame {
  t: number;
  chapter: number;
  local: number;
  segment: 'chapter' | 'transition';
  transition: number | null;
  transitionProgress: number;
  poses: Record<DancerId, BodyPose>;
  contact: DanceContact;
  camera: CameraPose;
  timingMode: TimingMode;
  timingEnabled: boolean;
  /** Actual root trajectory up to the current t, used for the optional path trace. */
  travelled: Record<DancerId, Vec3[]>;
}

export interface DanceOptions {
  mode?: TimingMode;
  layout?: 'wide' | 'narrow';
  /** Optional bounded chest breath. It never moves feet or a contact hand. */
  breath?: number;
}

export interface CharacterMetrics {
  height: number;
  joints: Record<JointName, Vec3>;
  lengths: {
    upperArm: number;
    forearm: number;
    palm: number;
    thigh: number;
    shin: number;
    foot: number;
  };
  hipHalfWidth: number;
  shoulderHalfWidth: number;
  ankleHeight: number;
  palmToMcp: number;
}
