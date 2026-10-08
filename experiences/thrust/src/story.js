export const CHAPTERS = [
  { id: 'intake', name: 'Intake', length: 1.8, mobile: 1.35 },
  { id: 'fan', name: 'Fan', length: 1.65, mobile: 1.3 },
  { id: 'bypass', name: 'Bypass', length: 2.15, mobile: 1.65 },
  { id: 'compression', name: 'Compression', length: 2.8, mobile: 2.1 },
  { id: 'combustion', name: 'Combustion', length: 2.35, mobile: 1.8 },
  { id: 'turbine', name: 'Turbine', length: 2.45, mobile: 1.85 },
  { id: 'blade', name: 'Blade', length: 2.25, mobile: 1.8 },
  { id: 'machine', name: 'Machine', length: 3.25, mobile: 2.45 },
  { id: 'thrust', name: 'Thrust', length: 2.25, mobile: 1.75 },
  { id: 'flight', name: 'Flight', length: 1.25, mobile: 1.1 },
];

export const clamp = (v, low = 0, high = 1) => Math.min(high, Math.max(low, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

export function chapterAt(y, bounds) {
  if (!bounds.length) return 0;
  for (let i = bounds.length - 1; i >= 0; i--) {
    if (y >= bounds[i].top) return Math.min(9.999, i + clamp((y - bounds[i].top) / bounds[i].span));
  }
  return 0;
}

export function sceneState(p) {
  p = clamp(Number.isFinite(p) ? p : 0, 0, 9.999);
  const index = Math.floor(p);
  return {
    index, local: p - index, p,
    cutaway: smooth(1.5, 2.05, p) * (1 - smooth(7.72, 8.12, p)),
    heat: smooth(3.88, 4.48, p) * (1 - smooth(8.72, 9.1, p)),
    // The turbine-to-blade handoff used to resolve inside ~0.23 of a chapter:
    // the blade scaled from 7.5% to 155% while the engine cut out, which read as
    // a snap. Both windows are wider now, so the single blade grows into the
    // frame and the core fades instead of swapping.
    energy: smooth(4.85, 5.5, p) * (1 - smooth(5.76, 6.26, p)),
    explode: smooth(6.98, 7.35, p) * (1 - smooth(7.70, 8.03, p)),
    blade: smooth(5.86, 6.28, p) * (1 - smooth(6.84, 7.07, p)),
    bladeCut: smooth(6.18, 6.58, p) * (1-smooth(6.80, 7.03, p)),
    sky: smooth(8.55, 9.03, p),
    aircraft: smooth(8.55, 8.93, p),
    flow: 1 - smooth(8.75, 9.05, p),
    pressure: p < 4 ? lerp(.13, .89, smooth(2.7, 3.85, p)) : p < 5 ? lerp(.89, .84, smooth(4, 4.75, p)) : lerp(.84, .17, smooth(5, 8.5, p)),
    temperature: p < 4 ? lerp(.12, .40, smooth(2.8, 3.85, p)) : p < 5 ? lerp(.40, .96, smooth(4.05, 4.6, p)) : lerp(.96, .30, smooth(5, 8.5, p)),
  };
}

// Every anchor is an authored shot; smooth interpolation is reversible and has no integrated scroll state.
// Position and target use one engine coordinate system: +Z follows the working fluid.
export const SHOTS = [
  [0.00, [-3.6, 1.35, -6.9], [2.15, .3, .35], 38],
  [0.70, [-3.3, 1.15, -6.15], [1.90, .2, .5], 40],
  [1.10, [-1.55, .80, -3.5], [.50, .12, .25], 65],
  [1.68, [-.85, .70, -1.65], [.10, .22, 2.15], 72],
  [2.10, [-10.8, 4.5, -.5], [1.0, .3, 4.75], 43],
  [2.72, [-10.4, 3.65, 2.0], [1.0, .2, 4.95], 42],
  [3.13, [-2.65, 2.30, 1.60], [-.05, .35, 5.20], 54],
  [3.43, [-1.65, 1.90, 1.70], [-.05, .55, 5.70], 60],
  [3.73, [-1.60, 1.55, 3.70], [-.05, .35, 6.30], 60],
  [4.12, [-2.65, 1.80, 5.10], [.90, -.25, 6.0], 56],
  [4.66, [-2.20, 1.40, 5.80], [.70, -.23, 6.70], 57],
  [4.90, [-1.65, 1.45, 7.10], [.25, .45, 8.90], 62],
  [5.16, [-3.70, 2.0, 7.25], [.62, .05, 9.15], 55],
  [5.67, [-11.9, 4.3, 5.7], [1.0, .2, 5.8], 43],
  [6.15, [4.10, 1.00, 14.7], [-.8, .15, 8.2], 37],
  [6.76, [4.55, 1.15, 13.6], [-.50, .20, 8.2], 38],
  [7.18, [-18.9, 10.0, -10.0], [0, 2.1, 6.7], 41],
  [7.70, [-20.0, 9.2, -9.5], [0, 2.1, 7.0], 39],
  [8.15, [-4.1, 2.3, 17.1], [1.5, .25, 10.0], 46],
  [8.65, [-7.5, 4.5, 24.2], [.9, .3, 8.5], 44],
  [9.15, [-169, 72, 236], [-72, 32, 8], 42],
  [9.999, [-204, 86, 305], [-78, 35, 7], 40],
];

function mobileOffset(p) {
  const offsets = [
    [-1.65,-.40,17],[-1.15,-.40,13],[0,.65,21],[0,.12,10],[0,-.65,11],
    [0,.55,21],[1.35,-.55,10],[0,.7,24],[0,-1.90,10],[37,10,13],
  ];
  let index = Math.floor(clamp(p,0,9));
  const blend = smooth(index-.28, index+.26, p);
  if (index > 0 && p < index+.26) return offsets[index-1].map((v,i)=>lerp(v,offsets[index][i],blend));
  const next = Math.min(9,index+1);
  const intoNext = smooth(next-.28,next+.26,p);
  return offsets[index].map((v,i)=>lerp(v,offsets[next][i],intoNext));
}

export function mobileRoll(p) {
  return [[2,-.55],[5,-.75],[7,-.75]].reduce((sum,[index,angle])=>sum + angle * smooth(index-.18,index+.15,p)*(1-smooth(index+.78,index+1.13,p)),0);
}

// Portrait shots are authored separately: full assemblies fit above or below
// the copy instead of losing both ends to a narrow crop of the desktop shot.
const PORTRAIT = new Map([
  [2.10, [[-17.20,12.90,-18.20],[1.80,-3.20,1.50],48]],
  [2.72, [[-15.30,11.90,-16.20],[2.00,-3.20,1.50],49]],
  [3.13, [[-2.6,2.9,1.1],[.15,-.75,5.3],73]],
  [3.43, [[-2.0,2.45,1.5],[.15,-.65,5.6],76]],
  [3.73, [[-2.0,2.05,3.4],[.15,-.65,6.1],74]],
  [5.16, [[-5.0,3.2,6.8],[0,-.6,8.9],65]],
  [5.67, [[-22.80,14.8,-12.1],[1.94,-3.94,1.73],54]],
  [7.18, [[-23.5,18.2,-23.0],[0,3.35,4.60],49]],
  [7.70, [[-24.0,17.885,-20.919],[-.001,3.285,4.581],49]],
]);

function portraitAnchor(anchor) {
  const [p, pos, target, fov] = anchor;
  const authored = PORTRAIT.get(p);
  if (authored) return [p,...authored];
  const offset = mobileOffset(p);
  return [p,pos,[target[0]+offset[0],target[1]+offset[1],target[2]],fov+offset[2]];
}

export function sampleShot(p, mobile = false) {
  let a = SHOTS[0], b = SHOTS[1];
  for (let i = 0; i < SHOTS.length - 1; i++) { if (p >= SHOTS[i][0]) { a = SHOTS[i]; b = SHOTS[i + 1]; } }
  if (mobile) { a = portraitAnchor(a); b = portraitAnchor(b); }
  const t = smooth(a[0], b[0], p);
  const pos = a[1].map((v, i) => lerp(v, b[1][i], t));
  const target = a[2].map((v, i) => lerp(v, b[2][i], t));
  const fov = lerp(a[3], b[3], t);
  return { pos, target, fov };
}
