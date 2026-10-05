export const CHAPTERS = [
  { id: "arrival", name: "Arrival", note: "The threshold", hold: 0, end: 1.9 },
  { id: "understory", name: "Understory", note: "A closer look", hold: 2.68, end: 4.05 },
  { id: "architecture", name: "Architecture", note: "A place for nature", hold: 4.68, end: 6.2 },
  { id: "water", name: "Water", note: "A softer reflection", hold: 6.85, end: 8.35 },
  { id: "open-air", name: "Open air", note: "Room to breathe", hold: 9.05, end: 10.75 },
  { id: "coda", name: "Coda", note: "Stay a little longer", hold: 11.65, end: 12.6 },
] as const;
export const STORY_DURATION = 12.6;
export const numberOf = (index: number) => String(index + 1).padStart(2, "0");
export function chapterAt(time: number) {
  const index = CHAPTERS.findIndex((chapter) => time < chapter.end);
  return index < 0 ? CHAPTERS.length - 1 : index;
}
