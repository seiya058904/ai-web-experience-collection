import { smooth } from './story.ts';

export type PortalPoint = { x: number; y: number };
export type HoleProjection = { outline: PortalPoint[]; anchor: PortalPoint };

/** Expand the actual aperture about an interior point until it contains the stage. */
export function portalContour(hole: HoleProjection, width: number, height: number, story: number): PortalPoint[] {
  const { outline, anchor } = hole;
  let clearance = Infinity;
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i], b = outline[(i + 1) % outline.length];
    const dx = b.x - a.x, dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((anchor.x - a.x) * dx + (anchor.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    clearance = Math.min(clearance, Math.hypot(anchor.x - a.x - dx * t, anchor.y - a.y - dy * t));
  }
  const radius = Math.hypot(Math.max(anchor.x, width - anchor.x), Math.max(anchor.y, height - anchor.y));
  const coverScale = Math.max(1, radius / Math.max(.1, clearance) + 1);
  const progress = smooth(2.80, 3.14, story);
  const scale = 1 + (coverScale - 1) * progress ** 3;
  return outline.map(p => ({x: anchor.x + (p.x - anchor.x) * scale, y: anchor.y + (p.y - anchor.y) * scale}));
}

/** Copy has its own short visual pause, independent of material compositing. */
export function craftInsideCopy(story: number) {
  return { craft: 1 - smooth(2.84, 2.90, story), inside: smooth(2.98, 3.10, story) };
}
