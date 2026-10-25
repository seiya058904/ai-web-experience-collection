import { clamp } from './math.ts';

/** Viewport travel belongs to the reading/experiment and the authored exchange.
 * Keep the original 2.5-screen handoffs; only shorten low-change reading holds. */
export const CHAPTER_RHYTHM = [
  { name: 'Zero', reading: .85, experiment: 0, exchange: 2.496 },
  { name: 'System', reading: .7, experiment: 0, exchange: 2.496 },
  { name: 'International', reading: .6, experiment: 0, exchange: 2.496 },
  { name: 'Basel / Tension', reading: 1.2, experiment: 0, exchange: 2.496 },
  { name: 'Type as image', reading: .8, experiment: 0, exchange: 2.496 },
  { name: 'Editorial', reading: 1.35, experiment: 0, exchange: 2.496 },
  { name: 'Raw', reading: .65, experiment: 0, exchange: 2.496 },
  { name: 'Electronic', reading: .8, experiment: 0, exchange: 2.496 },
  { name: 'Interface', reading: .4, experiment: 1.004, exchange: 2.496 },
  { name: 'Variable', reading: .4, experiment: 1.004, exchange: 2.496 },
  { name: 'Synthesis', reading: 1, experiment: 0, exchange: 2.496 },
  { name: 'No grid', reading: 0, experiment: 0, exchange: 0 },
] as const;

const span = (index: number) => {
  const chapter = CHAPTER_RHYTHM[index];
  return chapter.reading + chapter.experiment + chapter.exchange;
};
export const TOTAL_TRAVEL = CHAPTER_RHYTHM.reduce((sum, _, index) => sum + span(index), 0);

export function coordinateToTravel(coordinate: number): number {
  const p = clamp(coordinate, 0, 11), index = Math.floor(p), local = p - index;
  let start = 0;
  for (let i = 0; i < index; i++) start += span(i);
  if (index === 11) return start;
  const chapter = CHAPTER_RHYTHM[index], hold = chapter.reading + chapter.experiment;
  return start + (local <= .36 ? hold * local / .36 : hold + chapter.exchange * (local - .36) / .64);
}

export function travelToCoordinate(travel: number): number {
  if (travel <= 0) return 0;
  if (travel >= TOTAL_TRAVEL) return 11;
  let remaining = clamp(travel, 0, TOTAL_TRAVEL);
  for (let i = 0; i < 11; i++) {
    if (remaining > span(i)) { remaining -= span(i); continue; }
    const chapter = CHAPTER_RHYTHM[i], hold = chapter.reading + chapter.experiment;
    return i + (remaining <= hold ? .36 * remaining / hold : .36 + .64 * (remaining - hold) / chapter.exchange);
  }
  return 11;
}
