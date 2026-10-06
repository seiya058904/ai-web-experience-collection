/** The complete film is a pure function of scroll position. No queued tweens. */
export const CHAPTERS = [
  { id: 'outline', name: 'Outline', title: 'Objects in Space', lines: ['Objects in Space'], description: 'A study of what makes a thing.', note: 'A line becomes a possibility.', object: 'ARC / CHAIR', detail: 'Bent plywood · Aluminium' },
  { id: 'proportion', name: 'Proportion', title: 'A question of balance.', lines: ['A question', 'of balance.'], description: 'Not too much. Not too little.\nEvery distance has a purpose.', note: 'A line becomes a measure.', object: 'ARC / CHAIR', detail: '570 × 840 × 680 mm' },
  { id: 'structure', name: 'Structure', title: 'Nothing without a reason.', lines: ['Nothing', 'without', 'a reason.'], description: 'A surface. A support. A connection.\nThe logic beneath the silhouette.', note: 'A measure becomes a structure.', object: 'ARC / CHAIR', detail: 'Shell / Frame / Connection' },
  { id: 'material', name: 'Material', title: 'The same form. A different feeling.', lines: ['The same form.', 'A different feeling.'], description: 'A surface is never just a surface.', note: 'A structure becomes a feeling.', object: 'ARC / SURFACE STUDY', detail: 'Plywood · 7 layers · Satin finish' },
  { id: 'light', name: 'Light', title: 'Light makes volume.', lines: ['Light', 'makes', 'volume.'], description: 'A curve catches the light.\nA shadow gives it somewhere to go.', note: 'A curve becomes a source.', object: 'ORB / LAMP', detail: 'Spun aluminium · Stone · Light' },
  { id: 'detail', name: 'Detail', title: 'The quiet work of detail.', lines: ['The quiet', 'work of detail.'], description: 'What is barely seen\nis still carefully considered.', note: 'An edge becomes an explanation.', object: 'ORB / SECTION STUDY', detail: 'Shell / Diffuser / Collar' },
  { id: 'assembly', name: 'Assembly', title: 'Separate parts. One thought.', lines: ['Separate parts.', 'One thought.'], description: 'Three materials. A shared geometry.\nEverything finds its place.', note: 'A plane becomes a whole.', object: 'PLANE / SIDE TABLE', detail: 'Limestone · Aluminium · 3 supports' },
  { id: 'form', name: 'Form', title: 'Everything, in its place.', lines: ['Everything,', 'in its place.'], description: 'Objects in conversation.\nA space, quietly made.', note: 'And a thing becomes a world.', object: 'ARC / ORB / PLANE', detail: 'Three objects. One family.' }
];

export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, Number.isFinite(x) ? x : a));
export const mix = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const windowed = (a, b, c, d, x) => smooth(a, b, x) * (1 - smooth(c, d, x));

// Full poses at the holds, and the same geometric anchors across each handoff.
// c*: chair; l*: lamp; t*: table. Rotations are radians, distances are metres.
const BASE = {
  cx: .47, cy: 0, cz: 0, cs: 1, cr: -.62, ce: 0,
  lx: 1.6, ly: 0, lz: -.02, ls: .001, lr: 0, le: 0, cut: 0,
  tx: 1.6, ty: 0, tz: 0, ts: .001, tr: 0, te: 0,
  span: 1.42, lookY: .40, pitch: .25, dark: 0, grid: 0, room: 0
};
const pose = (t, patch) => ({ t, ...BASE, ...patch });
export const KEYFRAMES = [
  pose(0, {}),
  pose(.62, { cx: .46, cr: -.52, pitch: .27 }),
  pose(1.16, { cx: .16, cr: -.08, span: 1.40, lookY: .43, grid: .65, pitch: .16 }),
  pose(1.68, { cx: .16, cr: .04, span: 1.40, lookY: .43, grid: .65, pitch: .18 }),
  pose(2.18, { cx: .44, cr: -.40, ce: 1, span: 1.74, lookY: .53, pitch: .22, grid: .40 }),
  pose(2.64, { cx: .44, cr: -.49, ce: 1, span: 1.73, lookY: .53, pitch: .25, grid: .35 }),
  pose(3.18, { cx: .34, cy: -.32, cr: -.39, span: .77, lookY: .11, pitch: .17 }),
  pose(3.62, { cx: .32, cy: -.32, cr: -.32, lx: .40, span: .76, lookY: .11, pitch: .20 }),
  pose(3.91, { cx: .92, cy: -.12, cr: -.9, cs: .72, lx: .40, ls: 1.1, span: 1.18, dark: .72, pitch: .18 }),
  pose(4.18, { cx: 2.6, cs: .001, lx: .40, ls: 2.03, span: 1.12, lookY: .40, dark: 1, pitch: .03 }),
  pose(4.68, { cx: 2.6, cs: .001, lx: .42, ls: 2.03, lr: -.06, span: 1.12, lookY: .40, dark: 1, pitch: .04 }),
  pose(5.17, { cx: 2.6, cs: .001, lx: .52, ly: -.26, ls: 3.24, lr: -.74, span: 1.06, lookY: .49, dark: 1, pitch: -.05, cut: .87 }),
  pose(5.63, { cx: 2.6, cs: .001, lx: .51, ly: -.26, ls: 3.24, lr: -.66, tx: .40, span: 1.06, lookY: .49, dark: 1, pitch: -.02, cut: .94 }),
  pose(5.90, { cx: 2.6, cs: .001, lx: .41, ly: .2, ls: .25, lr: -.1, tx: .40, ts: 1.16, te: 1, span: 1.17, lookY: .43, dark: .45, pitch: .17 }),
  pose(6.16, { cx: 2.6, cs: .001, lx: 1.9, ls: .001, tx: .53, ts: 1.55, tr: .18, te: 1, span: 1.56, lookY: .43, pitch: .28, grid: .35 }),
  pose(6.66, { cx: -.16, cs: .001, lx: .53, ly: .6665, ls: .001, tx: .53, ts: 1.55, tr: .29, te: 0, span: 1.45, lookY: .39, pitch: .30, grid: .25 }),
  pose(6.83, { cx: -.16, cs: .4, lx: .43, ly: .4945, ls: .32, tx: .43, ts: 1.15, tr: .26, span: 1.25, lookY: .43, pitch: .23, grid: .20, room: .1 }),
  pose(7.18, { cx: .015, cy: 0, cs: 1, cr: .28, lx: .75, ly: .43, lz: -.04, ls: 1, lr: -.12, tx: .75, tz: -.04, ts: 1, tr: .18, span: 1.48, lookY: .47, pitch: .20, grid: .1, room: 1 }),
  pose(7.68, { cx: .015, cy: 0, cs: 1, cr: .22, lx: .75, ly: .43, lz: -.04, ls: 1, lr: -.12, tx: .75, tz: -.04, ts: 1, tr: .18, span: 1.50, lookY: .47, pitch: .21, room: 1 }),
  pose(8, { cx: .015, cy: 0, cs: 1, cr: .22, lx: .75, ly: .43, lz: -.04, ls: 1, lr: -.12, tx: .75, tz: -.04, ts: 1, tr: .18, span: 1.50, lookY: .47, pitch: .21, room: 1 })
];

export function chapterAt(progress) { return Math.min(7, Math.floor(clamp(progress, 0, 8))); }
export function chapterProgress(progress) { return clamp(progress - chapterAt(progress)); }

export function samplePose(progress, mobile = false, reduced = false) {
  const p = clamp(progress, 0, 8);
  const q = reduced ? (chapterAt(p) === 0 ? .62 : chapterAt(p) + .40) : p;
  let i = 0;
  while (i < KEYFRAMES.length - 2 && KEYFRAMES[i + 1].t < q) i++;
  const a = KEYFRAMES[i], b = KEYFRAMES[i + 1];
  const f = smooth(a.t, b.t, q);
  const out = {};
  for (const k of Object.keys(BASE)) out[k] = mix(a[k], b[k], f);
  out.progress = p;
  out.chapter = chapterAt(p);
  out.local = chapterProgress(p);
  out.dimensions = reduced ? +(out.chapter === 1) : windowed(.75, 1.10, 1.72, 2.0, p);
  out.structure = reduced ? +(out.chapter === 2) : windowed(1.85, 2.14, 2.66, 2.91, p);
  out.material = reduced ? +(out.chapter === 3) : windowed(2.85, 3.13, 3.66, 3.91, p);
  out.light = reduced ? +(out.chapter === 4) : windowed(3.91, 4.14, 4.71, 4.98, p);
  out.detail = reduced ? +(out.chapter === 5) : windowed(4.89, 5.13, 5.67, 5.88, p);
  out.assembly = reduced ? +(out.chapter === 6) : windowed(5.9, 6.14, 6.68, 6.92, p);
  out.final = reduced ? +(out.chapter === 7) : smooth(6.89, 7.18, p);
  out.copy = out.chapter === 0 ? 1 - smooth(.67, .98, p) : out.chapter === 7 ? smooth(7, 7.15, p) : windowed(0, .14, .72, 1, out.local);
  if (reduced) out.copy = 1;
  // Portrait is recomposed, not a smaller wide layout. Objects have their own lower stage.
  if (mobile) {
    const material = windowed(2.83, 3.15, 3.62, 3.94, q);
    const light = windowed(3.91, 4.14, 4.71, 4.98, q);
    const detail = windowed(4.89, 5.13, 5.67, 5.88, q);
    const finale = smooth(6.82, 7.15, q);
    const sceneShift = mix(.22, .04, material);
    out.span = mix(out.span * 1.42 * (1 + .12 * material), 2.56, finale);
    out.lookY += sceneShift - .07 * light + .08 * detail;
    out.cx = mix(out.cx * .08, -.24, finale);
    out.lx = mix(out.lx > 1.2 ? out.lx : out.lx * .12, .30, finale) - .035 * light;
    out.tx = mix(out.tx > 1.2 ? out.tx : out.tx * .12, .30, finale);
    out.cs *= mix(.91, .86, finale);
    out.ts *= mix(.95, .80, finale);
    out.ls *= mix(.92, .80, finale) * (1 - .10 * light);
    out.lr += .25 * detail;
    out.ly = mix(out.ly, .344, finale);
    out.pitch += .035;
  }
  return out;
}

export function chapterPosition(id) {
  const index = CHAPTERS.findIndex(c => c.id === id);
  return index < 0 ? null : (index === 0 ? 0 : index + .25);
}
