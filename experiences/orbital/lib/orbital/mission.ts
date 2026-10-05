export const CHAPTERS = [
  { id: 'earth', name: 'Earth', label: 'Our point of departure', title: ['BEYOND', 'EARTH.'], description: 'Every great journey begins with the courage to leave.' },
  { id: 'ignition', name: 'Ignition', label: 'The first impossible second', title: ['DEFY', 'GRAVITY.'], description: 'Controlled fire. Uncompromising power. The journey begins at zero.' },
  { id: 'ascent', name: 'Ascent', label: 'Through the atmosphere', title: ['THROUGH', 'THE BLUE.'], description: 'The air gets thinner. The horizon gets wider. There is only one way forward.' },
  { id: 'stage', name: 'Stage', label: 'A moment of separation', title: ['LET GO.', 'GO FURTHER.'], description: 'An empty stage has done its job. Letting it go gives the next stage the freedom to climb.' },
  { id: 'machine', name: 'Machine', label: 'Anatomy of a launch vehicle', title: ['EVERY PART.', 'ONE PURPOSE.'], description: 'Thousands of decisions. One extraordinary machine.' },
  { id: 'orbit', name: 'Orbit', label: 'A new perspective', title: ['FALLING.', 'FOREVER.'], description: 'Orbit is a continuous fall that never meets the ground.' },
  { id: 'mars', name: 'Mars', label: 'The next horizon', title: ['A LITTLE', 'FURTHER.'], description: 'Beyond the familiar. Toward another world.' },
  { id: 'beyond', name: 'Beyond', label: 'The journey continues', title: ['THIS IS', 'ONLY THE', 'BEGINNING.'], description: 'Our home is Earth. Our future is out there.' },
] as const;

export type Destination = 'moon' | 'mars';
export type Subsystem = 'propulsion' | 'structure' | 'guidance' | 'payload';
export const SUBSYSTEMS: { id: Subsystem; name: string; description: string; value: string; label: string }[] = [
  { id: 'propulsion', name: 'Propulsion', description: 'Propellant becomes momentum. A cluster of engines turns controlled combustion into the force that lifts the vehicle.', value: 'ACTION / REACTION', label: 'The principle of thrust' },
  { id: 'structure', name: 'Structure', description: 'Strong enough to carry the load. Light enough to leave it behind. Tanks and airframe work as one load-bearing system.', value: 'STRENGTH / MASS', label: 'A careful balance' },
  { id: 'guidance', name: 'Guidance', description: 'Sensors measure the journey. Flight computers adjust the engine direction to keep the vehicle on its planned trajectory.', value: 'SENSE / CORRECT', label: 'Precision in motion' },
  { id: 'payload', name: 'Payload', description: 'The reason for the flight. A protective fairing carries instruments and spacecraft through the atmosphere, then opens to space.', value: 'PROTECT / DEPLOY', label: 'A mission within the mission' },
];
export const SOURCES = [
  { title: 'Flight to orbit & staging', publisher: 'NASA Glenn', url: 'https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/flight-to-orbit/' },
  { title: 'Dynamic pressure & Max-Q', publisher: 'NASA Glenn', url: 'https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/dynamic-pressure-2/' },
  { title: 'Gravity & microgravity', publisher: 'NASA', url: 'https://www.nasa.gov/centers-and-facilities/glenn/what-is-microgravity/' },
  { title: 'Low Earth orbit reference', publisher: 'NASA Technical Reports', url: 'https://ntrs.nasa.gov/api/citations/20160012062/downloads/20160012062.pdf' },
  { title: 'Earth–Mars distance & light time', publisher: 'NASA Science', url: 'https://science.nasa.gov/mars/mars-relay-network/' },
  { title: 'Moon facts', publisher: 'NASA Science', url: 'https://science.nasa.gov/moon/facts/' },
  { title: 'Blue Marble Earth texture', publisher: 'NASA / Goddard SVS', url: 'https://svs.gsfc.nasa.gov/2915' },
  { title: 'Lunar surface texture', publisher: 'NASA / Goddard SVS', url: 'https://svs.gsfc.nasa.gov/4720/' },
];

export const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));
export const smooth = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };

/** Eight complete slots. The first and last compositions remain visible at endpoints. */
export function chapterVisibility(progress: number, index: number) {
  const t = progress - index;
  if (index === 0 && t < .72) return 1;
  if (index === 7 && t >= .18) return 1;
  if (t < 0 || t >= .96) return 0;
  if (t < .18) return smooth(t / .18);
  if (t <= .72) return 1;
  return 1 - smooth((t - .72) / .24);
}

export function sceneBlend(progress: number) {
  const p = clamp(progress, 0, 8);
  const i = Math.min(7, Math.floor(p));
  const t = p - i;
  if (i > 0 && t < .18) return { from: i - 1, to: i, mix: smooth((t + .28) / .46) };
  if (i < 7 && t > .72) return { from: i, to: i + 1, mix: smooth((t - .72) / .46) };
  return { from: i, to: i, mix: 0 };
}
