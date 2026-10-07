export const scenes = [
  { id: 'desire', name: 'Desire', duration: 1.48, image: 'pastry-hero', tone: 'dark', title: '', italic: '', caption: 'Scroll to feel', description: 'A golden butter croissant, close enough to see every fragile layer.' },
  { id: 'heat', name: 'Heat', duration: 1.32, image: 'scallop-seared', tone: 'dark', title: 'You can see', italic: 'the heat.', caption: 'Matte. Moist. Shimmer.', description: 'Tiny bubbles gather where clarified butter meets a warm seared edge.' },
  { id: 'brown', name: 'Brown', duration: 1.6, image: 'scallop-seared', tone: 'dark', title: 'Gold.', italic: 'Then deeper.', caption: 'Gold. Amber. Chestnut.', description: 'A surface takes on warm, uneven depths of amber and chestnut.' },
  { id: 'crust', name: 'Crust', duration: 1.85, image: 'pastry-hero', tone: 'dark', title: 'So thin.', italic: 'So fragile.', caption: 'Wait for the crack.', description: 'A thin, brittle skin separates to reveal the softer layers within.' },
  { id: 'inside', name: 'Inside', duration: 1.3, image: 'pastry-inside', tone: 'light', title: 'A softer', italic: 'world.', caption: 'Crisp gives way.', description: 'Pale, moist, irregular air pockets and delicate inner membranes.' },
  { id: 'melt', name: 'Melt', duration: 1.75, image: 'chocolate', tone: 'dark', title: '', italic: 'Give in.', caption: 'Slow enough to feel its weight.', description: 'A viscous chocolate ribbon folds and settles under its own weight.' },
  { id: 'glaze', name: 'Glaze', duration: 1.48, image: 'tart-glaze', tone: 'dark', title: 'A surface', italic: 'made of light.', caption: 'Flow. Coat. Reflect.', description: 'A thin caramel coating follows the soft curves of warm apple.' },
  { id: 'steam', name: 'Steam', duration: 1.45, image: 'tart-steam', tone: 'light', title: 'Still', italic: 'warm.', caption: 'A little heat, held in the air.', description: 'A few translucent wisps rise from a warm pastry edge, then disappear.' },
  { id: 'plate', name: 'Plate', duration: 1.38, image: 'tart-plate', tone: 'light', title: 'A little', italic: 'distance.', caption: 'Material becomes a dish.', description: 'For the first time, the complete tart rests on an open ivory plate.' },
  { id: 'cut', name: 'Cut', duration: 1.85, image: 'tart-plate', tone: 'light', title: 'The smallest', italic: 'surrender.', caption: 'Edge. Pressure. Separation.', description: 'An edge presses through caramel, soft apple and thin pastry. A piece separates.' },
  { id: 'bite', name: 'Before the first bite', duration: 1.35, image: 'tart-bitten', tone: 'light', title: 'The rest', italic: 'is yours.', caption: 'Once more', description: 'A fresh wedge is missing. A few crumbs and a little caramel remain. The first bite happens off screen.' },
];

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

export function frameFor(index, progress, mobile, controls) {
  const s = scenes[index];
  const p = clamp(progress);
  const frame = { image: s.image, zoom: 1, focus: [0.5, 0.5], effect: s.id === 'bite' ? 'end' : s.id, value: p, light: 0.35 };
  if (mobile) frame.focus = [0.68, 0.48];
  switch (index) {
    case 0:
      frame.zoom = lerp(1, mobile ? 1.04 : 1.13, smooth(0.1, 0.82, p));
      frame.focus = mobile ? [0.56, 0.42] : [lerp(0.5, 0.54, p), 0.51];
      frame.light = 0.22;
      break;
    case 1:
      frame.zoom = lerp(1, 1.09, p);
      frame.focus = mobile ? [0.68, 0.48] : [0.53, 0.5];
      frame.light = 0.28;
      break;
    case 2:
      frame.zoom = lerp(1.09, 1.2, p);
      frame.focus = mobile ? [0.67, 0.41] : [0.45, 0.45];
      frame.value = controls.browning ?? smooth(0.05, 0.68, p);
      break;
    case 3:
      frame.zoom = mobile ? 1.12 : 1.24;
      frame.focus = mobile ? [0.59, 0.56] : [0.55, 0.58];
      frame.light = 0.16;
      break;
    case 4:
      frame.zoom = lerp(1.02, 1.09, p);
      frame.focus = mobile ? [0.68, 0.53] : [0.5, 0.5];
      frame.light = 0.12;
      break;
    case 5:
      frame.zoom = lerp(1, 1.05, p);
      frame.focus = mobile ? [0.66, 0.44] : [0.5, 0.5];
      frame.light = 0.38;
      frame.value = controls.flow;
      break;
    case 6:
      frame.zoom = lerp(1, 1.08, p);
      frame.focus = mobile ? [0.68, 0.55] : [0.51, 0.5];
      frame.light = 0.32;
      break;
    case 7:
      frame.zoom = lerp(1.07, 1, p);
      frame.focus = mobile ? [0.63, 0.38] : [0.5, 0.5];
      frame.light = 0.15;
      break;
    case 8:
      frame.zoom = mobile ? lerp(1, 1.05, smooth(0.52, 0.95, p)) : lerp(1, 1.38, smooth(0.45, 0.95, p));
      frame.focus = mobile ? [0.72, 0.49] : [lerp(0.5, 0.58, smooth(0.45, 0.95, p)), 0.5];
      frame.light = 0.15;
      break;
    case 9:
      frame.zoom = mobile ? 1.05 : 1.38;
      frame.focus = mobile ? [0.69, 0.49] : [0.58, 0.5];
      frame.light = 0.15;
      break;
    case 10:
      frame.zoom = mobile ? 1.05 : lerp(1.38, 1.2, p);
      frame.focus = mobile ? [0.69, 0.49] : [0.58, 0.5];
      frame.light = 0.12;
      break;
  }
  return frame;
}

export function renderState(index, p, mobile, controls, reduced) {
  const current = frameFor(index, p, mobile, controls);
  const nextIndex = Math.min(scenes.length - 1, index + 1);
  const next = frameFor(nextIndex, 0, mobile, controls);
  let blend = index < scenes.length - 1 ? smooth(0.77, 1, p) : 0;
  let transition = ['edge', 'edge', 'edge', 'fracture', 'flow', 'flow', 'air', 'air', 'edge', 'cut'][index] || 'edge';

  // The crack and cut are authored internal events, not entrance animations.
  if (index === 3) {
    const reveal = frameFor(4, 0, mobile, controls);
    const fracture = p < 0.46 ? smooth(0.32, 0.46, p) * 0.018 : 0.018 + smooth(0.46, 0.52, p) * 0.982;
    return { current, next: reveal, blend: reduced ? (p >= 0.48 ? 1 : 0) : fracture, transition: 'fracture' };
  }
  if (index === 9 && p < 0.78) {
    return { current, next: { ...current, image: 'tart-cut', effect: 'cut' }, blend: reduced ? (p >= 0.48 ? 1 : 0) : smooth(0.38, 0.59, p), transition: 'cut' };
  }
  if (index === 9) {
    current.image = 'tart-cut';
    blend = smooth(0.78, 1, p);
  }
  if (reduced) blend = p >= 0.92 ? 1 : 0;
  return { current, next, blend, transition };
}
