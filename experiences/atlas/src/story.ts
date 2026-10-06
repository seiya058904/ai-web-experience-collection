import { clamp, mix, smooth } from "./geo";

export const CHAPTERS = [
  {
    id: "coordinate",
    name: "Coordinate",
    position: 0,
    title: "",
    italic: "",
    note: "Every place begins as a coordinate.",
  },
  {
    id: "grid",
    name: "Grid",
    position: 0.075,
    title: "A point.",
    italic: "A possibility.",
    note: "POSITION BECOMES PROPORTION",
  },
  {
    id: "contour",
    name: "Contour",
    position: 0.155,
    title: "A world,",
    italic: "written in lines.",
    note: "100 M CONTOUR INTERVAL",
  },
  {
    id: "relief",
    name: "Relief",
    position: 0.34,
    title: "Lines become",
    italic: "landscape.",
    note: "FUJI / FIVE LAKES",
  },
  {
    id: "water",
    name: "Water",
    position: 0.465,
    title: "Water finds",
    italic: "another way.",
    note: "LAKES, SPRINGS & MAPPED WATERWAYS",
  },
  {
    id: "satellite",
    name: "Satellite",
    position: 0.555,
    title: "The colour",
    italic: "of a place.",
    note: "LANDSAT / A REGISTERED MOSAIC",
  },
  {
    id: "city",
    name: "City",
    position: 0.695,
    title: "A place,",
    italic: "inhabited.",
    note: "FUJIYOSHIDA / YAMANASHI",
  },
  {
    id: "route",
    name: "Route",
    position: 0.785,
    title: "The world,",
    italic: "within reach.",
    note: "ONE ROUTE. REAL STREETS.",
  },
  {
    id: "time",
    name: "Time",
    position: 0.837,
    title: "The same place.",
    italic: "Another hour.",
    note: "AN AUTHORED LIGHT STUDY",
  },
  {
    id: "orbit",
    name: "Orbit",
    position: 0.928,
    title: "A little further.",
    italic: "Then everything.",
    note: "THE COORDINATE REMAINS",
  },
  {
    id: "atlas",
    name: "Atlas",
    position: 0.991,
    title: "One place.",
    italic: "Every scale.",
    note: "The world in layers.",
  },
] as const;

const thresholds = [
  0, 0.046, 0.122, 0.245, 0.422, 0.512, 0.625, 0.747, 0.813, 0.863, 0.972,
];
export function chapterAt(p: number) {
  let i = 0;
  for (let j = 1; j < thresholds.length; j++) if (p >= thresholds[j]) i = j;
  return i;
}

type Pose = {
  p: number;
  span: number;
  pitch: number;
  yaw: number;
  x: number;
  y: number;
  z: number;
};
const POSES: Pose[] = [
  { p: 0, span: 42, pitch: 0.005, yaw: 0, x: 0, y: 0, z: 0 },
  { p: 0.08, span: 44, pitch: 0.015, yaw: 0, x: -5, y: 0, z: 6 },
  { p: 0.15, span: 43, pitch: 0.025, yaw: -0.06, x: -11, y: 0, z: 6 },
  { p: 0.225, span: 42, pitch: 0.1, yaw: -0.08, x: -11, y: 0, z: 7 },
  { p: 0.29, span: 38, pitch: 0.69, yaw: -0.31, x: -12, y: 0.4, z: 8 },
  { p: 0.345, span: 25, pitch: 1.14, yaw: -0.38, x: -11, y: 1.0, z: 11.5 },
  { p: 0.405, span: 23, pitch: 1.16, yaw: -0.32, x: -9.5, y: 1.0, z: 11 },
  { p: 0.455, span: 24, pitch: 0.92, yaw: -0.18, x: -4, y: 0.8, z: 4 },
  { p: 0.505, span: 21, pitch: 0.67, yaw: -0.08, x: -3, y: 0.8, z: 3 },
  { p: 0.555, span: 23, pitch: 0.48, yaw: -0.06, x: -6, y: 0.8, z: 5 },
  { p: 0.598, span: 8, pitch: 0.3, yaw: -0.08, x: -1.2, y: 0.78, z: 0.5 },
  { p: 0.638, span: 3.7, pitch: 0.2, yaw: -0.1, x: -0.85, y: 0.78, z: 0.1 },
  { p: 0.685, span: 2.1, pitch: 0.94, yaw: -0.34, x: -0.65, y: 0.78, z: 0.08 },
  { p: 0.735, span: 1.85, pitch: 1.04, yaw: -0.38, x: -0.55, y: 0.78, z: 0.08 },
  { p: 0.787, span: 0.21, pitch: 1.28, yaw: -0.2, x: -0.18, y: 0.79, z: 0.14 },
  { p: 0.833, span: 0.24, pitch: 1.27, yaw: -0.12, x: -0.25, y: 0.79, z: 0.1 },
  { p: 0.863, span: 1.25, pitch: 1.02, yaw: -0.1, x: -0.32, y: 0.79, z: 0.1 },
  { p: 0.903, span: 42, pitch: 0.38, yaw: -0.08, x: -8, y: 0, z: 4 },
  { p: 0.934, span: 610, pitch: 0.22, yaw: 0.02, x: -110, y: -15, z: 0 },
  { p: 0.957, span: 6800, pitch: 0.15, yaw: 0.04, x: -1050, y: -1500, z: 0 },
  { p: 0.979, span: 15000, pitch: 0.16, yaw: 0.1, x: -2850, y: -6371, z: 500 },
  { p: 1, span: 14800, pitch: 0.17, yaw: 0.1, x: -2850, y: -6371, z: 500 },
];

export function evaluateStory(p: number, mobile: boolean) {
  p = clamp(p);
  let i = 0;
  while (i < POSES.length - 2 && p > POSES[i + 1].p) i++;
  const a = POSES[i],
    b = POSES[i + 1],
    t = smooth(a.p, b.p, p);
  const span = Math.exp(mix(Math.log(a.span), Math.log(b.span), t));
  const pose = {
    span,
    pitch: mix(a.pitch, b.pitch, t),
    yaw: mix(a.yaw, b.yaw, t),
    x: mix(a.x, b.x, t),
    y: mix(a.y, b.y, t),
    z: mix(a.z, b.z, t),
  };
  if (mobile) {
    const city = smooth(0.6, 0.66, p) * (1 - smooth(0.87, 0.905, p));
    const globe = smooth(0.94, 0.98, p);
    pose.span *= mix(1.23, 2.45, globe);
    pose.x = mix(pose.x * 0.42, -200, globe);
    pose.x -= 1.9 * smooth(0.505, 0.54, p) * (1 - smooth(0.582, 0.615, p));
    pose.z += mix(2.4, 0.25, city) * (1 - globe);
    pose.yaw *= 0.6;
  }
  const lift = smooth(0.225, 0.335, p);
  const orbit = smooth(0.895, 0.978, p);
  return {
    p,
    pose,
    chapter: chapterAt(p),
    lift,
    grid: smooth(0.012, 0.075, p) * (1 - smooth(0.1, 0.19, p)),
    morph: smooth(0.075, 0.17, p),
    lines:
      smooth(0.016, 0.12, p) * (1 - smooth(0.53, 0.615, p)) +
      0.12 * smooth(0.885, 0.9, p) * (1 - smooth(0.925, 0.94, p)),
    surface: smooth(0.245, 0.315, p),
    water: smooth(0.412, 0.475, p),
    drape: smooth(0.512, 0.576, p),
    aerial: smooth(0.583, 0.628, p),
    city: smooth(0.625, 0.682, p),
    extrude: smooth(0.66, 0.717, p),
    route: smooth(0.744, 0.802, p),
    night: smooth(0.817, 0.852, p) * (1 - smooth(0.87, 0.91, p)),
    orbit,
    globe: smooth(0.917, 0.934, p),
    terrainVisibility: 1 - smooth(0.93, 0.955, p),
    cityVisibility: smooth(0.608, 0.652, p) * (1 - smooth(0.885, 0.918, p)),
    curvature: smooth(0.9, 0.93, p),
  };
}
export type StoryState = ReturnType<typeof evaluateStory>;
