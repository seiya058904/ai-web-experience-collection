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
    body: 'A wooden form. Open to the light.', bodyZh: '木的形体，尚未收拢光。',
    note: 'Wood → Ground', noteZh: '木胎 → 地层' },
  { id: 'first-coat', name: 'First coat', zh: '初涂', height: 1.65,
    title: 'A thin\nbeginning.', titleZh: '薄薄一层，\n由此开始。',
    body: 'The surface darkens. Light starts to gather.', bodyZh: '表面沉暗，光开始聚拢。',
    note: 'A controlled, liquid film', noteZh: '缓慢而受控的薄膜' },
  { id: 'cure', name: 'Cure', zh: '固化', height: 1.65,
    title: 'Stillness\ndoes the work.', titleZh: '静候，\n也是工序。',
    body: 'Moisture, air, and time.', bodyZh: '湿度、空气与时间。',
    detail: 'A liquid film becomes a network.', detailZh: '液态漆膜，逐渐形成网络。',
    note: 'Within the humid chamber', noteZh: '湿润的荫室之中' },
  { id: 'abrade', name: 'Abrade', zh: '研磨', height: 1.6,
    title: 'Lose the shine.\nRefine the surface.', titleZh: '暂失光泽，\n再近一分。',
    body: 'Charcoal passes. The reflection breaks.', bodyZh: '炭轻轻经过，倒影随之散开。',
    note: 'Wet abrasion', noteZh: '以炭湿磨' },
  { id: 'layers', name: 'Layers', zh: '层积', height: 2.5,
    title: 'Depth is\naccumulated\ntime.', titleZh: '所谓深度，\n是时间\n的层积。',
    body: 'Coat. Cure. Abrade. Return.', bodyZh: '涂。固化。研磨。再来。',
    note: 'A rhythm, repeated', noteZh: '反复，让表面更深' },
  { id: 'vermilion', name: 'Vermilion', zh: '朱', height: 1.6,
    title: 'A colour\nheld close.', titleZh: '一抹朱，\n藏在深处。',
    body: 'Vermilion, beneath the same light.', bodyZh: '同一道光，落在朱色之上。',
    note: 'Colour held in lacquer', noteZh: '颜色，凝在漆里' },
  { id: 'polish', name: 'Polish', zh: '抛光', height: 2.2,
    title: 'Light finds\ncontinuity.', titleZh: '光，\n终于连成一线。',
    body: 'A reflection becomes whole.', bodyZh: '细痕渐退，倒影完整。',
    note: 'A first clarity', noteZh: '初次清晰' },
  { id: 'maki-e', name: 'Maki-e', zh: '莳绘', height: 2.1,
    title: 'Gold, held\nby lacquer.', titleZh: '金，\n被漆留住。',
    body: 'A measured fall. A surface that remembers.', bodyZh: '细粉落下，表面将它留下。',
    note: 'Powder meets a tacky design', noteZh: '金粉，附着于漆绘' },
  { id: 'reveal', name: 'Reveal', zh: '研出', height: 2.35,
    title: 'What disappears\ncan return.', titleZh: '隐去的，\n再次显现。',
    body: 'Covered. Cured. Polished into view.', bodyZh: '覆漆。固化。研磨显露。',
    note: 'Hide → Polish → Reveal', noteZh: '遮蔽 → 研磨 → 显现' },
  { id: 'depth', name: 'Depth', zh: '深处', height: 1.8,
    title: 'The surface\nhas become\nthe depth.', titleZh: '表面，\n已成深处。',
    body: 'Stay with the reflection.', bodyZh: '留在光的倒影里。',
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
  zoom: 1, turn: 0, lift: 0, reflectionShift: 0,
};

// Sparse art-direction keys. A key inherits the previous state; every blend is
// continuous, and the final value is independent of travel direction.
const keyChanges = [
  [0, {}],
  [0.38, { reflectionShift: 0.025 }],
  [0.98, { wood: 1, ground: 0, coat: 0, cure: 0, layers: 0, polish: 0, zoom: 0.87, turn: -0.055, reflectionShift: -0.025 }],
  [1.40, {}],
  [1.95, { ground: 1, wood: 0.35, zoom: 0.92, turn: -0.03 }],
  [2.02, {}],
  [2.92, { wood: 0, coat: 1, polish: 0.28, layers: 0.14, zoom: 1.03, reflectionShift: 0.055 }],
  [3.12, { chamber: 1, zoom: 0.77, lift: -0.025 }],
  [3.88, { cure: 1, polish: 0.2, reflectionShift: 0.02 }],
  [4.02, { chamber: 0, zoom: 1.13, lift: 0, turn: 0.025, abradeFront: 0 }],
  [4.85, { abrasion: 1, abradeFront: 1, polish: 0.06, zoom: 1.18 }],
  [5, { layers: 0.22, zoom: 1.05, turn: 0.035 }],
  [5.98, { layers: 0.92, abrasion: 0.64, polish: 0.16, zoom: 1.12, turn: 0.05 }],
  [6.08, { abrasion: 0.08, polish: 0.36 }],
  [6.62, { vermilion: 1, polish: 0.52, reflectionShift: -0.04, zoom: 1.12 }],
  [6.87, {}],
  [7.08, { vermilion: 0.17, abrasion: 0.88, polish: 0.02, abradeFront: 1, zoom: 1.17, turn: 0.04 }],
  [7.92, { abrasion: 0, polish: 1, layers: 1, reflectionShift: 0.08, zoom: 1.17 }],
  [8.03, { zoom: 1.11, turn: 0.045 }],
  [8.84, { gold: 1, reflectionShift: -0.02 }],
  [9.0, { gold: 1, goldVeil: 0, goldReveal: 0 }],
  [9.3, { goldVeil: 1, abrasion: 0.3, polish: 0.2, reflectionShift: 0.015 }],
  [9.43, {}],
  [9.9, { goldReveal: 1, abrasion: 0, polish: 1, reflectionShift: 0.07 }],
  [10.18, { zoom: 0.84, turn: -0.045, lift: 0.015, reflectionShift: 0.035 }],
  [10.66, { zoom: 0.95, turn: -0.025, reflectionShift: -0.035 }],
  [11, { zoom: 1.02, reflectionShift: 0.045 }],
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

  // Three compressed, reversible coating / curing / abrasion rhythms. Their
  // envelope joins the neighboring scene states without a hard reset.
  if (phase > 5 && phase < 6) {
    const u = phase - 5;
    const envelope = smooth(0, 0.09, u) * (1 - smooth(0.9, 1, u));
    const rhythm = 0.5 - 0.5 * Math.cos(u * Math.PI * 6);
    state.abrasion = mix(state.abrasion, rhythm * 0.92, envelope);
    state.polish = mix(state.polish, 0.1 + (1 - rhythm) * 0.56, envelope);
    state.section = smooth(0.18, 0.30, u) * (1 - smooth(0.63, 0.79, u));
    state.reflectionShift += Math.sin(u * Math.PI * 6) * 0.017 * envelope;
  }

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
