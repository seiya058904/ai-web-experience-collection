import { chapterVisibility, type Subsystem } from './mission.ts';

export type StudyPoint = readonly [number, number, number];
export type StudyPath = { points: StudyPoint[]; role: 'action' | 'reference' };
export interface SceneLayout { copyBottom: number; footerTop: number; machineBottom: number; }

/** Coordinates follow the supplied GLB and its existing axial separation.
 * These are explanatory paths, not computed flow, load or guidance solutions. */
export function engineeringStudy(system: Subsystem, split: number): StudyPath[] {
  const paths: StudyPath[] = [];
  const path = (points: StudyPoint[], role: StudyPath['role'] = 'action') => paths.push({ points, role });
  const point = (x: number, y: number): StudyPoint => [x, y, .72];
  const arrow = (x: number, from: number, to: number) => {
    path([point(x, from), point(x, to)]);
    const d = Math.sign(to - from) * .24;
    path([point(x - .18, to - d), point(x, to), point(x + .18, to - d)]);
  };
  const booster = -1.1 * split, engine = -1.6 * split;
  const boosterX = -.25 * split;
  const upper = .8 * split, fairing = 1.55 * split, guidance = -.4 * split;
  if (system === 'propulsion') {
    path([point(boosterX - .85, -.8 + booster), point(boosterX - .85, -4.6 + booster), point(boosterX, -5.6 + engine)]);
    arrow(boosterX, -5.6 + engine, -6.35 + engine);
    path([point(boosterX - .3, -.8 + booster), point(boosterX - .85, -.8 + booster)], 'reference');
  } else if (system === 'structure') {
    for (const x of [-.85, .85]) {
      arrow(x + boosterX, -5.15 + booster, .1 + booster);
      arrow(x, .6 + upper, 3.4 + upper);
      path([point(x + boosterX, .1 + booster), point(x, .6 + upper)], 'reference');
    }
    for (const y of [-5.15 + booster, .1 + booster]) path([point(boosterX - .85, y), point(boosterX + .85, y)], 'reference');
    for (const y of [.6 + upper, 3.4 + upper]) path([point(-.85, y), point(.85, y)], 'reference');
  } else if (system === 'guidance') {
    const y = .35 + guidance;
    path(Array.from({ length: 25 }, (_, i) => { const a = -.65 + i / 24 * Math.PI * 1.35; return point(Math.cos(a) * 1.45, y + Math.sin(a) * 1.45); }));
    const a = -.65 + Math.PI * 1.35;
    const tip = point(Math.cos(a) * 1.45, y + Math.sin(a) * 1.45);
    path([point(tip[0] + .3, tip[1] + .05), tip, point(tip[0] + .06, tip[1] + .3)]);
    path([point(0, y), point(1.45, y), point(1.45, -5.5 + engine), point(boosterX + .35, -5.5 + engine)], 'reference');
    path([point(-.3, y), point(.3, y)], 'reference');
  } else if (system === 'payload') {
    const y = 3.45 + fairing;
    path([point(-.85, y), point(-.85, y + 1.35), point(0, y + 2.12), point(.85, y + 1.35), point(.85, y), point(-.85, y)]);
    path([point(-.28, y + .28), point(-.28, y + 1.25), point(.28, y + 1.25), point(.28, y + .28), point(-.28, y + .28)], 'reference');
    path([point(-1.3, y + .75), point(-.85, y + .75)], 'reference');
    path([point(.85, y + .75), point(1.3, y + .75)], 'reference');
  }
  return paths;
}

export function studyAmount(progress: number, system: Subsystem) {
  return system === 'overview' ? 0 : chapterVisibility(progress, 4);
}

/** The same measured free space is used by WebGL and Canvas. */
export function mobileMoon(width: number, height: number, layout?: SceneLayout) {
  const top = Math.max(height * .4, (layout?.copyBottom ?? height * .62) + 12);
  const bottom = (layout?.footerTop ?? height - 70) - 12;
  const radius = Math.max(0, Math.min(width * .38, (bottom - top) / 2));
  return { x: width * .71, y: top + radius, radius };
}

export function mobileMachine(width: number, height: number, worldHeight: number, layout?: SceneLayout) {
  const unit = height / worldHeight;
  const top = (layout?.machineBottom ?? height * .53) + 14;
  const bottom = (layout?.footerTop ?? height - 70) - 14;
  const scale = Math.max(.08, Math.min(.42, width * .87 / (unit * 18 * .93), (bottom - top) / (unit * 8.2)));
  return { y: (height / 2 - (top + bottom) / 2) / unit, scale };
}
