/** Shared scroll vocabulary. One document scroll position drives every scene. */
export const chapters = [
  {
    id: "light",
    name: "Light",
    line: "The architecture of an image.",
    duration: 1.45,
    mobile: 1.25,
  },
  {
    id: "optics",
    name: "Optics",
    line: "Glass bends it.",
    duration: 2.3,
    mobile: 1.95,
  },
  {
    id: "focus",
    name: "Focus",
    line: "Focus decides.",
    duration: 1.65,
    mobile: 1.65,
  },
  {
    id: "aperture",
    name: "Aperture",
    line: "The shape of light.",
    duration: 1.95,
    mobile: 1.8,
  },
  {
    id: "shutter",
    name: "Shutter",
    line: "Time opens.",
    duration: 1.65,
    mobile: 1.65,
  },
  {
    id: "sensor",
    name: "Sensor",
    line: "Light, remembered.",
    duration: 2.15,
    mobile: 1.95,
  },
  {
    id: "stability",
    name: "Stability",
    line: "Still. In a moving world.",
    duration: 1.7,
    mobile: 1.65,
  },
  {
    id: "machine",
    name: "Machine",
    line: "A thousand decisions. One image.",
    duration: 2.9,
    mobile: 2.55,
  },
  {
    id: "image",
    name: "Image",
    line: "So we can see.",
    duration: 1.65,
    mobile: 1.55,
  },
];

export const clamp = (value, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, value) => {
  const t = clamp((value - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const ease = (t) => t * t * (3 - 2 * t);

export function makeTimeline(mobile = false) {
  let offset = 0;
  const scenes = chapters.map((chapter, index) => {
    const length = mobile ? chapter.mobile : chapter.duration;
    const scene = {
      ...chapter,
      index,
      start: offset,
      length,
      end: offset + length,
      holdStart: offset + length * 0.25,
      holdEnd: offset + length * 0.71,
    };
    offset += length;
    return scene;
  });
  return { scenes, total: offset };
}

export function sampleTimeline(timeline, position) {
  const u = clamp(position, 0, timeline.total);
  const scenes = timeline.scenes;
  // Integer document pixels can round an exact chapter boundary a few ULPs
  // below its summed duration. A mathematical start belongs to that chapter.
  const epsilon = Number.EPSILON * Math.max(1, timeline.total) * 4;
  const active = scenes.find((scene) => u < scene.end - epsilon) || scenes.at(-1);
  const weights = Array(scenes.length).fill(0);
  let from = 0,
    to = 0,
    mix = 0;
  for (let i = 0; i < scenes.length; i++) {
    if (u <= scenes[i].holdEnd || i === scenes.length - 1) {
      from = to = i;
      weights[i] = 1;
      break;
    }
    if (u < scenes[i + 1].holdStart) {
      from = i;
      to = i + 1;
      mix = smooth(scenes[i].holdEnd, scenes[i + 1].holdStart, u);
      weights[from] = 1 - mix;
      weights[to] = mix;
      break;
    }
  }
  const locals = scenes.map((scene) => clamp((u - scene.start) / scene.length));
  return {
    u,
    active: active.index,
    local: locals[active.index],
    locals,
    weights,
    from,
    to,
    mix,
    normalized: u / timeline.total,
  };
}

export function apertureLight(fNumber) {
  return (1.4 / clamp(fNumber, 1.4, 16)) ** 2;
}

export function apertureFromProgress(t) {
  const stops = [1.4, 2.8, 8, 16];
  const position = clamp((t - 0.16) / 0.62) * 3;
  const index = Math.min(2, Math.floor(position));
  return lerp(stops[index], stops[index + 1], ease(position - index));
}

export function focusDistance(t) {
  return t > 0.99 ? "∞" : `${(0.7 / (1 - t * 0.97)).toFixed(1)} m`;
}

export function sensorMagnification(local, reduced = false) {
  const amount = smooth(0.44, 0.67, local);
  return reduced ? Number(amount >= 0.5) : amount;
}

export function bayerColor(x, y) {
  return y % 2 === 0 ? (x % 2 === 0 ? "R" : "G") : x % 2 === 0 ? "G" : "B";
}
