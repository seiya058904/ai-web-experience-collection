import { clamp, mix } from './journey.js';

// An authored diagram of the six studies, not a physical optical simulation.
// Each pane keeps its identity through the same from/to/blend as the WebGL world.
export const PAINTER_ORDER = [6, 5, 4, 3, 2, 1, 0, 7];
const POSES = [
  // Light
  [
    {"points":[[0.62,0.47],[0.95,0.4],[0.95,0.72],[0.62,0.79]],"life":1,"finish":"clear"},
    {"points":[[0.57,0.09],[0.85,0.32],[0.85,0.72],[0.57,0.78]],"life":1,"finish":"clear"},
    {"points":[[0.41,0.18],[0.61,0.3],[0.61,0.74],[0.41,0.69]],"life":1,"finish":"clear"},
    {"points":[[0.80475,0.475],[0.80475,0.475],[0.80475,0.475],[0.80475,0.475]],"life":0,"finish":"clear"},
    {"points":[[0.828,0.48250000000000004],[0.828,0.48250000000000004],[0.828,0.48250000000000004],[0.828,0.48250000000000004]],"life":0,"finish":"clear"},
    {"points":[[0.8512500000000001,0.49000000000000005],[0.8512500000000001,0.49000000000000005],[0.8512500000000001,0.49000000000000005],[0.8512500000000001,0.49000000000000005]],"life":0,"finish":"clear"},
    {"points":[[0.8745,0.4975],[0.8745,0.4975],[0.8745,0.4975],[0.8745,0.4975]],"life":0,"finish":"clear"},
    {"points":[[0.645,0.265],[0.645,0.265],[0.645,0.265],[0.645,0.265]],"life":0,"finish":"clear"}
  ],
  // Surface
  [
    {"points":[[0.75,0.18],[0.89,0.12],[0.89,0.66],[0.75,0.72]],"life":1,"finish":"mirror"},
    {"points":[[0.5700000000000001,0.18],[0.7100000000000001,0.12],[0.7100000000000001,0.66],[0.5700000000000001,0.72]],"life":1,"finish":"selected"},
    {"points":[[0.39,0.18],[0.53,0.12],[0.53,0.66],[0.39,0.72]],"life":1,"finish":"frosted"},
    {"points":[[0.80475,0.475],[0.80475,0.475],[0.80475,0.475],[0.80475,0.475]],"life":0,"finish":"clear"},
    {"points":[[0.828,0.48250000000000004],[0.828,0.48250000000000004],[0.828,0.48250000000000004],[0.828,0.48250000000000004]],"life":0,"finish":"clear"},
    {"points":[[0.8512500000000001,0.49000000000000005],[0.8512500000000001,0.49000000000000005],[0.8512500000000001,0.49000000000000005],[0.8512500000000001,0.49000000000000005]],"life":0,"finish":"clear"},
    {"points":[[0.8745,0.4975],[0.8745,0.4975],[0.8745,0.4975],[0.8745,0.4975]],"life":0,"finish":"clear"},
    {"points":[[0.645,0.265],[0.645,0.265],[0.645,0.265],[0.645,0.265]],"life":0,"finish":"clear"}
  ],
  // Refraction
  [
    {"points":[[0.8200000000000001,0.42],[0.8200000000000001,0.42],[0.8200000000000001,0.42],[0.8200000000000001,0.42]],"life":0,"finish":"clear"},
    {"points":[[0.7,0.14],[0.795,0.45],[0.89,0.76],[0.48,0.71]],"life":1,"finish":"clear"},
    {"points":[[0.46,0.42],[0.46,0.42],[0.46,0.42],[0.46,0.42]],"life":0,"finish":"clear"},
    {"points":[[0.80475,0.475],[0.80475,0.475],[0.80475,0.475],[0.80475,0.475]],"life":0,"finish":"clear"},
    {"points":[[0.828,0.48250000000000004],[0.828,0.48250000000000004],[0.828,0.48250000000000004],[0.828,0.48250000000000004]],"life":0,"finish":"clear"},
    {"points":[[0.8512500000000001,0.49000000000000005],[0.8512500000000001,0.49000000000000005],[0.8512500000000001,0.49000000000000005],[0.8512500000000001,0.49000000000000005]],"life":0,"finish":"clear"},
    {"points":[[0.8745,0.4975],[0.8745,0.4975],[0.8745,0.4975],[0.8745,0.4975]],"life":0,"finish":"clear"},
    {"points":[[0.645,0.265],[0.645,0.265],[0.645,0.265],[0.645,0.265]],"life":0,"finish":"clear"}
  ],
  // Reflection
  [
    {"points":[[0.61,0.11],[0.86,0.14],[0.86,0.76],[0.61,0.8]],"life":1,"finish":"mirror"},
    {"points":[[0.643,0.14500000000000002],[0.8735,0.17500000000000002],[0.8735,0.74],[0.643,0.78]],"life":1,"finish":"mirror"},
    {"points":[[0.6759999999999999,0.18],[0.8869999999999999,0.21],[0.8869999999999999,0.72],[0.6759999999999999,0.76]],"life":1,"finish":"mirror"},
    {"points":[[0.709,0.21500000000000002],[0.9005,0.24500000000000002],[0.9005,0.7],[0.709,0.74]],"life":1,"finish":"mirror"},
    {"points":[[0.742,0.25],[0.9139999999999999,0.28],[0.9139999999999999,0.68],[0.742,0.7200000000000001]],"life":1,"finish":"mirror"},
    {"points":[[0.775,0.28500000000000003],[0.9275,0.31500000000000006],[0.9275,0.66],[0.775,0.7000000000000001]],"life":1,"finish":"mirror"},
    {"points":[[0.808,0.32],[0.9410000000000001,0.35],[0.9410000000000001,0.64],[0.808,0.68]],"life":1,"finish":"mirror"},
    {"points":[[0.645,0.265],[0.645,0.265],[0.645,0.265],[0.645,0.265]],"life":0,"finish":"clear"}
  ],
  // Layers
  [
    {"points":[[0.61,0.11],[0.86,0.14],[0.86,0.76],[0.61,0.8]],"life":1,"finish":"clear"},
    {"points":[[0.643,0.14500000000000002],[0.8735,0.17500000000000002],[0.8735,0.74],[0.643,0.78]],"life":1,"finish":"clear"},
    {"points":[[0.6759999999999999,0.18],[0.8869999999999999,0.21],[0.8869999999999999,0.72],[0.6759999999999999,0.76]],"life":1,"finish":"clear"},
    {"points":[[0.709,0.21500000000000002],[0.9005,0.24500000000000002],[0.9005,0.7],[0.709,0.74]],"life":1,"finish":"clear"},
    {"points":[[0.742,0.25],[0.9139999999999999,0.28],[0.9139999999999999,0.68],[0.742,0.7200000000000001]],"life":1,"finish":"clear"},
    {"points":[[0.775,0.28500000000000003],[0.9275,0.31500000000000006],[0.9275,0.66],[0.775,0.7000000000000001]],"life":1,"finish":"clear"},
    {"points":[[0.808,0.32],[0.9410000000000001,0.35],[0.9410000000000001,0.64],[0.808,0.68]],"life":1,"finish":"clear"},
    {"points":[[0.645,0.265],[0.645,0.265],[0.645,0.265],[0.645,0.265]],"life":0,"finish":"clear"}
  ],
  // Glasshouse
  [
    {"points":[[0.39,0.3],[0.54,0.2],[0.54,0.69],[0.39,0.79]],"life":1,"finish":"clear"},
    {"points":[[0.477,0.283],[0.627,0.195],[0.627,0.688],[0.477,0.77]],"life":1,"finish":"clear"},
    {"points":[[0.5640000000000001,0.266],[0.7140000000000001,0.19],[0.7140000000000001,0.6859999999999999],[0.5640000000000001,0.75]],"life":1,"finish":"clear"},
    {"points":[[0.651,0.249],[0.801,0.185],[0.801,0.6839999999999999],[0.651,0.73]],"life":1,"finish":"clear"},
    {"points":[[0.738,0.23199999999999998],[0.888,0.18000000000000002],[0.888,0.6819999999999999],[0.738,0.7100000000000001]],"life":1,"finish":"clear"},
    {"points":[[0.825,0.21499999999999997],[0.975,0.17500000000000002],[0.975,0.6799999999999999],[0.825,0.6900000000000001]],"life":1,"finish":"clear"},
    {"points":[[0.8745,0.4975],[0.8745,0.4975],[0.8745,0.4975],[0.8745,0.4975]],"life":0,"finish":"clear"},
    {"points":[[0.32,0.31],[0.78,0.11],[0.98,0.21],[0.5,0.43]],"life":1,"finish":"clear"}
  ]
];

const finish = (name, material) => {
  const value = name === 'selected' ? material : name;
  return [value === 'frosted' ? 1 : 0, value === 'mirror' ? 1 : 0];
};
const weight = (view, index) => (view.from === index ? 1 - view.blend : 0)
  + (view.to === index ? view.blend : 0);

/** Pure progress/state sampling shared by both diagram backends. */
export function sampleFallback(view, time, state, width, height, portrait) {
  const w = Math.max(1, width), h = Math.max(1, height);
  const from = POSES[view.from], to = POSES[view.to], t = clamp(view.blend);
  const surface = weight(view, 1), refraction = weight(view, 2), house = weight(view, 5);
  const darkness = clamp(view.darkness);
  const sunlight = Math.sin((state.daylight || 0) * Math.PI / 180) * house;
  // Reserve the lower reading zone. Do not stretch the illustrative word with
  // the panes: the old shared mobile transform put its first glyph offscreen.
  const project = ([x, y]) => [w * (portrait ? x * 1.8 - .7 : x), h * (portrait ? y * .7 + .02 : y)];
  const panes = from.map((a, id) => {
    const b = to[id], af = finish(a.finish, state.material), bf = finish(b.finish, state.material);
    const frost = mix(af[0], bf[0], t), mirror = mix(af[1], bf[1], t);
    return {
      id, points: a.points.map((p, i) => project([mix(p[0], b.points[i][0], t), mix(p[1], b.points[i][1], t)])),
      life: mix(a.life, b.life, t), alpha: .075 + .405 * frost + .775 * mirror,
      rayX: (Math.sin(time * .1 + id) * .08 + .7 + sunlight * .22) * w,
    };
  });
  const angle = (state.lightAngle || 0) * .004;
  return {
    width: w, height: h, darkness, sunlight, panes,
    base: [Math.round(mix(233, 20, darkness)) - 3, Math.round(mix(233, 20, darkness)), Math.round(mix(233, 20, darkness)) + 3],
    ambient: { cx: w * (.65 + sunlight * .22), fx: w * (.77 + sunlight * .22), cy: h * .3, radius: w * .8, alpha: mix(.85, .05, darkness) },
    floor: { y: h * .61, a: mix(.03, .09, darkness), b: mix(.12, .32, darkness) },
    word: { text: 'UNSEEN', x: w * (portrait ? .065 : .31), y: h * (portrait ? .405 : .52), size: w * (portrait ? .13 : .09), opacity: surface },
    beam: { opacity: refraction, incoming: [[.02, .12 + angle], [.7, .43], [.02, .115 + angle]].map(project),
      outgoing: ['#e7a3a0', '#eacf99', '#b3d4ac', '#a6d7e8', '#baa4d0'].map((color, i) => ({ color, points: [[.7, .43], [1, .64 + i * .018 - angle], [1, .65 + i * .018 - angle]].map(project) })) },
  };
}

export function paneStops(alpha) {
  return [[0, `rgba(200,226,239,${alpha})`], [.45, `rgba(240,250,255,${alpha * .45})`],
    [.49, `rgba(255,255,255,${Math.min(1, alpha + .1)})`], [.53, `rgba(80,111,130,${alpha * .4})`], [1, `rgba(179,213,227,${alpha})`]];
}
export const RAY_STOPS = [[0, 'rgba(255,255,255,0)'], [.48, 'rgba(255,255,255,.02)'], [.5, 'rgba(255,255,255,.48)'], [.52, 'rgba(255,255,255,.02)'], [1, 'rgba(255,255,255,0)']];
