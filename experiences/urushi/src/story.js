import { getCameraState } from './camera.js';

/**
 * The journey is a pure function of position. Its numbers are art direction,
 * never workshop measurements. No event history or wall-clock curing state.
 */
export const chapters = [
  { id: 'beginning', name: 'Black without edge', zh: '无边之黑', height: 1.45,
    title: 'Surface\nbecoming\ndepth.', titleZh: '表面，\n渐入深处。',
    body: 'Layers of lacquer.', bodyZh: '漆，一层又一层。',
    note: 'Wood to reflection', noteZh: '从木胎，到倒影' },
  { id: 'core', name: 'Core', zh: '木胎', height: 1.6,
    title: 'Before depth,\ngrain.', titleZh: '深度之前，\n是木纹。',
    body: "Open grain scatters the light. Ground fills what the wood leaves open.", bodyZh: "木纹散开光。漆地慢慢填平孔隙。",
    detail: "The same vessel begins here.",
    detailZh: "始终是同一件器物。",
    note: 'Wood → Ground', noteZh: '木胎 → 地层' },
  { id: 'first-coat', name: 'First coat', zh: '初涂', height: 1.65,
    title: 'A thin\nbeginning.', titleZh: '薄薄一层，\n由此开始。',
    body: "A wet film crosses the prepared surface. Reflection follows its edge.", bodyZh: "湿润的漆膜覆过漆地，倒影沿着边缘聚拢。",
    note: 'A controlled, liquid film', noteZh: '缓慢而受控的薄膜' },
  { id: 'cure', name: 'Cure', zh: '固化', height: 1.65,
    title: 'Stillness\ndoes the work.', titleZh: '静候，\n也是工序。',
    body: "Moisture, air, and time. The wet surface grows still.", bodyZh: "湿度、空气与时间。湿润的漆面，渐渐安定。",
    detail: "Hardening prepares the film for the next pass.", detailZh: "漆膜渐固，为下一次研磨留下基础。",
    note: 'Within the humid chamber', noteZh: '湿润的荫室之中' },
  { id: 'abrade', name: 'Abrade', zh: '研磨', height: 1.6,
    title: 'Lose the shine.\nRefine the surface.', titleZh: '暂失光泽，\n再近一分。',
    body: "Fine charcoal passes interrupt the reflection. A flatter surface remains.", bodyZh: "细密的炭磨截断倒影，留下更平整的表面。",
    note: 'Wet abrasion', noteZh: '以炭湿磨' },
  { id: 'layers', name: 'Layers', zh: '层积', height: 2.5,
    title: 'Depth is\naccumulated\ntime.', titleZh: '所谓深度，\n是时间\n的层积。',
    body: "Coat. Cure. Abrade. Each return leaves more behind.", bodyZh: "涂。固化。研磨。每次再来，都留下新的一层。",
    detail: "A magnified section. Thickness is interpretive.",
    detailZh: "放大的层积剖面，厚度为示意。",
    note: 'A rhythm, repeated', noteZh: '反复，让表面更深' },
  { id: 'vermilion', name: 'Vermilion', zh: '朱', height: 1.6,
    title: 'A colour\nheld close.', titleZh: '一抹朱，\n藏在深处。',
    body: "A veil of red enters the layers. Black gathers over it.", bodyZh: "朱色进入漆层，黑漆又将它收拢。",
    detail: "Colour remains beneath the final dark.",
    detailZh: "一线朱色，留在黑的深处。",
    note: 'Colour held in lacquer', noteZh: '颜色，凝在漆里' },
  { id: 'polish', name: 'Polish', zh: '抛光', height: 2.2,
    title: 'Light finds\ncontinuity.', titleZh: '光，\n终于连成一线。',
    body: "Fine traces recede. One uninterrupted reflection returns.", bodyZh: "细痕渐退，一道连续的倒影重新出现。",
    detail: "A first clarity, before the decoration.",
    detailZh: "莳绘之前，先让漆面清晰。",
    note: 'A first clarity', noteZh: '初次清晰' },
  { id: 'maki-e', name: 'Maki-e', zh: '莳绘', height: 2.1,
    title: 'Gold, held\nby lacquer.', titleZh: '金，\n被漆留住。',
    body: "Fine gold catches on the lacquered lines. Each grain stays with the surface.", bodyZh: "细金粉被漆绘留住，一粒粒贴近表面。",
    note: 'Powder meets a tacky design', noteZh: '金粉，附着于漆绘' },
  { id: 'reveal', name: 'Reveal', zh: '研出', height: 2.35,
    title: 'What disappears\ncan return.', titleZh: '隐去的，\n再次显现。',
    body: "A new coat buries the gold. Polishing brings the same lines back into view.", bodyZh: "新漆隐去金纹，研磨让原来的线条再次显现。",
    detail: "The design returns flush with the lacquer.",
    detailZh: "金纹与漆面，渐成一体。",
    note: 'Hide → Polish → Reveal', noteZh: '遮蔽 → 研磨 → 显现' },
  { id: 'depth', name: 'Depth', zh: '深处', height: 1.8,
    title: 'The surface\nhas become\nthe depth.', titleZh: '表面，\n已成深处。',
    body: "Wood, labour and light, held in one surface.", bodyZh: "木、工序与光，终于留在同一个表面。",
    note: 'An end. A beginning.', noteZh: '也是终点，也是起点。' },
];

export const clamp = (value, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, value));
export const smooth = (lo, hi, value) => {
  const t = clamp((value - lo) / (hi - lo));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;

const initial = {
  wood: 0, ground: 1, coat: 1, cure: 1,
  abrasion: 0, abradeFront: 1, layers: 1,
  vermilion: 0, polish: 0.9, gold: 0, goldVeil: 0,
  goldReveal: 0, chamber: 0, section: 0,
  recoatMode: 0, recoat: 0, reflectionShift: 0,
};

// Sparse art-direction keys. A key inherits the previous state; every blend is
// continuous; process fronts reset only between equivalent material states.
// The final value is independent of travel direction.
const keyChanges = [
  [0, {}],
  [0.38, { reflectionShift: 0.025 }],
  [0.98, { wood: 1, ground: 0, coat: 0, cure: 0, layers: 0, polish: 0, reflectionShift: -0.025 }],
  [1.40, {}],
  [1.95, { ground: 1, wood: 0.35 }],
  [2.02, {}],
  [2.92, { wood: 0, coat: 1, polish: 0.28, layers: 0.14, reflectionShift: 0.055 }],
  [3.12, { chamber: 1 }],
  [3.88, { cure: 1, polish: 0.2, reflectionShift: 0.02 }],
  [4.02, { chamber: 0, abradeFront: 0 }],
  [4.85, { abrasion: 1, abradeFront: 1, polish: 0.06 }],
  [5, { layers: 0.22, abrasion: 0.82, polish: 0.08 }],
  [6, { layers: 1, abrasion: 0.82, polish: 0.08, cure: 1, abradeFront: 1 }],
  [6.08, { abrasion: 0.08, polish: 0.36 }],
  [6.62, { vermilion: 1, polish: 0.52, reflectionShift: -0.04 }],
  [6.87, {}],
  [7.08, { vermilion: 0.17, abrasion: 0.88, polish: 0.02, abradeFront: 1 }],
  [7.92, { abrasion: 0, polish: 1, layers: 1, reflectionShift: 0.08 }],
  [8.03, {}],
  [8.84, { gold: 1, reflectionShift: -0.02 }],
  [9.0, { gold: 1, goldVeil: 0, goldReveal: 0 }],
  [9.3, { goldVeil: 1, abrasion: 0.3, polish: 0.2, reflectionShift: 0.015 }],
  [9.43, {}],
  [9.9, { goldReveal: 1, abrasion: 0, polish: 1, reflectionShift: 0.07 }],
  [10.18, { reflectionShift: 0.035 }],
  [10.66, { reflectionShift: -0.035 }],
  [11, { reflectionShift: 0.045 }],
];

let previous = { ...initial };
const keys = keyChanges.map(([position, changes]) => {
  previous = { ...previous, ...changes };
  return { position, values: { ...previous } };
});

export function getStoryState(position) {
  const phase = Number.isFinite(position) ? clamp(position, 0, 11) : 0;
  let right = keys.findIndex(key => key.position >= phase);
  if (right < 0) right = keys.length - 1;
  const b = keys[right], a = keys[Math.max(0, right - 1)];
  const t = a === b ? 0 : smooth(a.position, b.position, phase);
  const state = { phase, chapter: Math.min(10, Math.floor(phase)), local: phase >= 11 ? 1 : phase % 1 };
  for (const field of Object.keys(initial)) state[field] = mix(a.values[field], b.values[field], t);

  // A new cycle starts on the cured, abraded preceding film. Its front
  // resets only when both sides resolve to that same material (see shader).
  // The retained layer count never resets or decreases.
  if (phase >= 5 && phase < 6) {
    const u = phase - 5;
    const cycle = Math.min(2, Math.floor(u * 3));
    const t = u * 3 - cycle;
    state.recoatMode = 1;
    state.recoat = smooth(0.04, 0.34, t);
    state.cure = smooth(0.38, 0.64, t);
    state.abradeFront = smooth(0.68, 0.98, t);
    state.abrasion = 0.82 * state.abradeFront;
    state.polish = 0.08;
    state.layers = 0.22 + 0.78 * (cycle + state.recoat) / 3;
    state.section = smooth(0.18, 0.30, u) * (1 - smooth(0.63, 0.79, u));
    state.reflectionShift += Math.sin(u * Math.PI * 6) * 0.009 * smooth(0, 0.09, u) * (1 - smooth(0.9, 1, u));
  }
  Object.assign(state, getCameraState(phase));

  // The gold chapter owns deposition. It may never leak into earlier scenes,
  // including during reverse scroll, resize, direct chapter jumps or reload.
  if (phase <= 8.03) state.gold = 0;
  return state;
}

export function positionFromScroll(scroll, sections, viewportHeight) {
  const last = sections.length - 1;
  for (let i = last; i >= 0; i--) {
    if (scroll >= sections[i].top || i === 0) {
      const end = i === last ? sections[i].bottom - viewportHeight : sections[i + 1].top;
      return i + clamp((scroll - sections[i].top) / Math.max(1, end - sections[i].top));
    }
  }
  return 0;
}
