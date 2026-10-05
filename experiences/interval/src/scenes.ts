export type Rect = readonly [number, number, number, number];
export type Transition = "door" | "column" | "section" | "open";

export interface Scene {
  id: string;
  name: string;
  title: string;
  text: string;
  invitation: string;
  alt: string;
  ratio: number;
  focus: number;
  portal: Rect;
  transition: Transition;
  ambient: "water" | "light" | "shadow";
}

export const scenes: readonly Scene[] = [
  {
    id: "threshold",
    name: "Threshold",
    title: "Between here & elsewhere.",
    text: "Every space begins with a crossing.",
    invitation: "A narrow opening. An invitation to enter.",
    alt: "An original coastal concrete pavilion, with a narrow doorway at the end of a stone path across still water.",
    ratio: 1672 / 941,
    focus: 0.635,
    portal: [0.613, 0.353, 0.659, 0.624],
    transition: "door",
    ambient: "water",
  },
  {
    id: "light",
    name: "Light",
    title: "Light, given form.",
    text: "A wall gives daylight its shape.",
    invitation: "Follow the light. Find the next opening.",
    alt: "A tall concrete room lit by a long roof opening. A beam of sunlight crosses the stone floor toward a timber doorway.",
    ratio: 1586 / 992,
    focus: 0.666,
    portal: [0.655, 0.406, 0.716, 0.685],
    transition: "door",
    ambient: "light",
  },
  {
    id: "frame",
    name: "Frame",
    title: "An opening changes everything.",
    text: "A rhythm of timber. A glimpse of the world.",
    invitation: "The closer we move, the more the view unfolds.",
    alt: "A warm oak colonnade, with precise timber columns and sunlight, framing pines and sea through clear glass.",
    ratio: 1586 / 992,
    focus: 0.52,
    portal: [0.632, 0, 0.755, 0.785],
    transition: "column",
    ambient: "shadow",
  },
  {
    id: "matter",
    name: "Matter",
    title: "Time, held in a surface.",
    text: "Concrete. Timber. Stone.",
    invitation: "A surface remembers how it was made.",
    alt: "Close architectural detail: board-marked concrete meets an oak post, a glass edge, and a pale stone floor beside a courtyard.",
    ratio: 1586 / 992,
    focus: 0.53,
    portal: [0.535, 0, 0.697, 0.84],
    transition: "section",
    ambient: "light",
  },
  {
    id: "void",
    name: "Void",
    title: "Space to let the world in.",
    text: "A courtyard holds the sky.",
    invitation: "Water, a single tree, and room to breathe.",
    alt: "An open courtyard of warm concrete, a reflecting pool, a windswept pine and a narrow path to a doorway facing the sea.",
    ratio: 1586 / 992,
    focus: 0.6,
    portal: [0.552, 0.387, 0.621, 0.579],
    transition: "door",
    ambient: "water",
  },
  {
    id: "silence",
    name: "Silence",
    title: "Stay a little longer.",
    text: "The architecture recedes. The world remains.",
    invitation: "There is nothing more to arrive at.",
    alt: "A quiet open terrace, framed by a thin concrete roof and one column, looking over a sunlit sea and distant islands.",
    ratio: 1586 / 992,
    focus: 0.53,
    portal: [0, 0, 1, 1],
    transition: "open",
    ambient: "water",
  },
];

export const asset = (id: string, small = false) =>
  `${import.meta.env.BASE_URL}interval/images/${id}${small ? "-small" : ""}.webp`;
