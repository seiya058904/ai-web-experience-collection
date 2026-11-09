/** Purpose-specific art, separate from the two canonical export cameras. */
import { normalizeFrame } from './timeline.ts';
import type { Camera } from './export.ts';

// Inside the Collection the work is served below <base>frame/; outside Vite (tests) the root is kept.
const viteBase = (import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env?.BASE_URL;
const baseURL = viteBase ? `${viteBase}frame/` : '/';
const path = (relative: string): string => `${baseURL.endsWith('/') ? baseURL : `${baseURL}/`}${relative}`;

export type StillName = 'glance' | 'preparation' | 'contact' | 'pushing' | 'overhead' | 'ending' | 'resting';
export const ART_DIMENSIONS = Object.freeze({
  landscape: { width: 1280, height: 800 },
  portrait: { width: 720, height: 800 },
  hero: { width: 1000, height: 900 },
});

export const STILL_BY_SCENE = Object.freeze({
  preparation: { 2: 'glance', 6: 'preparation' },
  contact: { 6: 'contact', 9: 'pushing' },
  ending: { 24: 'resting' },
  overhead: { 18: 'overhead' },
} as const);

export const STILL_DESCRIPTIONS: Readonly<Record<StillName, string>> = Object.freeze({
  glance: 'A close view of Boop looking from the block toward the yellow outline.',
  preparation: 'Boop lowers its soft body, plants both feet, and touches the block before moving.',
  contact: 'The front mitten touches the left face of the block; the rear palm rests on top.',
  pushing: 'Boop pushes the block with both hands while one foot supports the body and the other lifts.',
  overhead: 'An overhead view shows the block just beyond the outline as Boop looks back.',
  ending: 'The last film pose: the red block rests inside the yellow outline and Boop smiles.',
  resting: 'After the film, Boop sits quietly beside the red block, now inside the yellow outline.',
});

/** Matched stills are for stationary observation, never isolated swaps mid-playback. */
export function stillForScene(sceneId: string, frame: number, staticObservation = true): StillName | null {
  if (!staticObservation || !(sceneId in STILL_BY_SCENE)) return null;
  const byFrame = STILL_BY_SCENE[sceneId as keyof typeof STILL_BY_SCENE] as Partial<Record<number, StillName>>;
  return byFrame[normalizeFrame(frame)] ?? null;
}

export function stillAssetURL(name: StillName, camera: Camera = 'landscape'): string {
  return path(`stills/${name}-${camera === 'portrait' ? 'portrait' : 'landscape'}.webp`);
}

/** Hero is a complete, compactly staged version of the unchanged default performance. */
export function heroAssetURL(frame: number): string {
  return path(`frames/hero/even-${String(normalizeFrame(frame)).padStart(2, '0')}.webp`);
}
