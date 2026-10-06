/** Deterministic scroll state. Geometry and instruments read the same values. */
export const chapters = [
  { id: 'ignition', name: 'Ignition', word: 'CURRENT', status: 'The first filament' },
  { id: 'machine', name: 'The machine', word: 'STRUCTURE', status: 'A chamber for the impossible' },
  { id: 'confinement', name: 'Confinement', word: 'FIELD', status: 'Magnetic geometry established' },
  { id: 'plasma', name: 'Plasma', word: 'HEAT', status: 'Auxiliary heating engaged' },
  { id: 'instability', name: 'Instability', word: 'DEVIATION', status: 'Boundary mode detected' },
  { id: 'control', name: 'Control', word: 'RESPONSE', status: 'Feedback response active' },
  { id: 'star', name: 'Star', word: 'EQUILIBRIUM', status: 'A star, held in place' },
  { id: 'future', name: 'Future', word: 'POSSIBILITY', status: 'The work continues' },
] as const;

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export type Key = readonly [number, number];
export function sample(keys: readonly Key[], p: number): number {
  if (p <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (p <= keys[i][0]) {
      const a = keys[i - 1], b = keys[i];
      return mix(a[1], b[1], smooth(a[0], b[0], p));
    }
  }
  return keys[keys.length - 1][1];
}

const energy: Key[] = [[0,.32],[.7,.44],[1.2,.24],[1.7,.31],[2.2,.5],[2.75,.7],[3.25,1],[3.85,1],[4.3,.88],[4.8,.84],[5.4,.85],[5.8,1],[6.5,1],[7.35,.7],[8,.54]];
const field: Key[] = [[0,.22],[.65,.36],[1.2,.45],[1.8,.68],[2.3,1],[3.5,.94],[4.55,.72],[5.65,1],[8,1]];
const heat: Key[] = [[0,.07],[.7,.1],[1.8,.15],[2.65,.35],[3.35,1],[4.6,.89],[5.65,1],[8,1]];
const assembly: Key[] = [[0,.86],[.8,1],[1.3,1],[1.75,.6],[2.4,.12],[3.05,0],[4.5,0],[5.4,.1],[5.85,.25],[6.65,.35],[7.5,.94],[8,.95]];
const cutaway: Key[] = [[0,.35],[.6,.4],[1.35,.85],[1.8,1],[4.7,1],[5.8,.72],[6.6,.6],[7.6,.2],[8,.2]];
const disturbance: Key[] = [[0,0],[3.65,.035],[4.15,.43],[4.7,.86],[5.05,.78],[5.65,.025],[8,.012]];
const response: Key[] = [[0,0],[4.9,0],[5.2,.35],[5.75,1],[8,1]];

export interface UserControls {
  heatInput: number;
  feedback: number;
  pulse: number;
  sectionOpen: boolean;
  sectionAmount?: number;
}

export function deriveState(p: number, time: number, controls: UserControls) {
  p = clamp(p, 0, 8);
  const inHeat = smooth(2.75, 3.15, p) * (1 - smooth(3.75, 4.15, p));
  const inControl = smooth(4.95, 5.2, p) * (1 - smooth(5.8, 6.15, p));
  const inUnstable = smooth(3.8, 4.2, p) * (1 - smooth(4.8, 5.2, p));
  const inMachine = smooth(.85, 1.1, p) * (1 - smooth(1.96, 2.14, p));
  const heatFactor = mix(1, .55 + controls.heatInput * .45, inHeat);
  const live = Math.sin(time * 1.2) * .25 + Math.sin(time * .47) * .12;
  const h = sample(heat, p) * heatFactor;
  const control = sample(response, p) * mix(1, controls.feedback, inControl);
  const instability = clamp(sample(disturbance, p) + inControl * (1 - controls.feedback) * .72 + inUnstable * controls.pulse * .3);
  return {
    p,
    chapter: Math.min(7, Math.floor(p)),
    energy: clamp(sample(energy, p) * heatFactor),
    field: sample(field, p),
    heat: h,
    assembly: sample(assembly, p),
    cutaway: mix(sample(cutaway, p), mix(.25, 1, clamp(controls.sectionAmount ?? (controls.sectionOpen ? 1 : 0))), inMachine),
    instability,
    control,
    temperature: Math.max(0, 150 * h + live * h),
    deviation: instability * 18 + .16 + Math.abs(live) * .6,
    excitation: clamp(sample(field, p) + control * .015) * 100,
  };
}

/** Enter → stable → living hold → handoff. UI is fully present for ~60% of each chapter. */
export function chapterOpacity(p: number, index: number): number {
  if (index === 0) return 1 - smooth(.72, 1.02, p);
  const enter = smooth(index - .12, index + .16, p);
  const exit = index === 7 ? 0 : smooth(index + .73, index + 1.02, p);
  return enter * (1 - exit);
}
