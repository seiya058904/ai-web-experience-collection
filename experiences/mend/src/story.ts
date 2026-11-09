/** Pure scroll sampling. A saved repair choice never enters this calculation. */
export function evaluateStory(y: number, anchors: readonly number[], lastHeight: number, viewportHeight: number) {
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  let section = 0;
  while (section < anchors.length - 1 && y >= anchors[section + 1]) section++;
  const distance = section < 9 ? anchors[section + 1] - anchors[section] : Math.max(1, lastHeight - viewportHeight);
  const local = clamp((y - anchors[section]) / Math.max(1, distance));
  const holdProgress = clamp(local / .36);
  const pose = section < 9 ? section + clamp((local - .36) / .64) : 9;
  return {
    section, local, holdProgress, pose,
    chapter: Math.min(9, Math.round(pose)),
    roadProgress: section < 8 ? 0 : section > 8 ? 1 : holdProgress,
  };
}
