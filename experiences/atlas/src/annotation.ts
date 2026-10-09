/** Scroll-state-owned DOM annotation placement; no camera, DOM or clock access. */
export interface AnnotationTextRect {
  left: number; top: number; right: number; bottom: number;
}
export interface CoordinateAnnotationInput {
  /** Already-projected geographic viewport point. Never modified. */
  point: { x: number; y: number };
  size: { width: number; height: number };
  viewport: { width: number; height: number };
  gap: number;
  /** Preferred absolute viewport TOP, not an offset from point.y. */
  preferredY: number;
  /** Actual header bottom; reserve another 12 CSS px below it. */
  headerBottom: number;
  /** Reserved height from viewport bottom, including the desired footer gap. */
  footerInset: number;
  /** Actual title/italic/note line boxes after current copy layout. */
  textRects: readonly AnnotationTextRect[];
}
export interface CoordinateAnnotationPlacement {
  /** Absolute viewport coordinates of the label's top-left corner. */
  left: number; top: number;
  /** True only when no tested candidate satisfies all spatial constraints. */
  constrained: boolean;
}
const EDGE = 18, HEADER_GAP = 12, TEXT_GAP = 14;
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
type Interval = [number, number];

function availableTopIntervals(left: number, width: number, height: number,
  low: number, high: number, rects: readonly AnnotationTextRect[]): Interval[] {
  // Endpoints touch the 14 px clearance boundary and are allowed.
  const forbidden: Interval[] = rects
    .filter(r => left < r.right + TEXT_GAP && left + width > r.left - TEXT_GAP)
    .map(r => [r.top - height - TEXT_GAP, r.bottom + TEXT_GAP] as Interval)
    .filter(([begin, end]) => begin < high && end > low)
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged: Interval[] = [];
  for (const interval of forbidden) {
    const last = merged.at(-1);
    if (last && interval[0] < last[1]) last[1] = Math.max(last[1], interval[1]);
    else merged.push([...interval]);
  }
  const free: Interval[] = [];
  let cursor = low;
  for (const [begin, end] of merged) {
    if (begin >= cursor) free.push([cursor, Math.min(begin, high)]);
    cursor = Math.max(cursor, end);
    if (cursor > high) break;
  }
  if (cursor <= high) free.push([cursor, high]);
  return free;
}

/**
 * Preserve the R7 right/left choice and 18 px side margin when possible.
 * While the chosen x touches text, prefer a stable band below its last line.
 * If that band cannot fit, search disjoint vertical slots, then the opposite
 * side and viewport edges. All positions depend solely on this input.
 * `constrained` is not a "moved" flag: false means all constraints are met;
 * true is a best-effort fallback, never a claim of zero collision.
 */
export function placeCoordinateAnnotation(input: CoordinateAnnotationInput): CoordinateAnnotationPlacement {
  const { point, size, viewport, gap, preferredY, headerBottom, footerInset } = input;
  const numbers = [point.x, point.y, size.width, size.height, viewport.width,
    viewport.height, gap, preferredY, headerBottom, footerInset];
  if (numbers.some(v => !Number.isFinite(v)) || size.width <= 0 || size.height <= 0 ||
      viewport.width <= 0 || viewport.height <= 0 || gap < 0 || footerInset < 0)
    throw new RangeError("Annotation metrics must be finite with positive dimensions.");
  const rects = input.textRects.filter(r => {
    if ([r.left, r.top, r.right, r.bottom].some(v => !Number.isFinite(v)))
      throw new RangeError("Annotation text rectangles must be finite.");
    return r.right > r.left && r.bottom > r.top;
  });
  const minX = EDGE, maxX = viewport.width - EDGE - size.width;
  const minY = Math.max(EDGE, headerBottom + HEADER_GAP);
  const maxY = viewport.height - footerInset - size.height;
  const right = point.x + gap, left = point.x - gap - size.width;
  const preferRight = right + size.width <= viewport.width - EDGE;
  const preferredX = preferRight ? right : left;
  const fallback = { left: clamp(preferredX, minX, Math.max(minX, maxX)),
    top: clamp(preferredY, minY, Math.max(minY, maxY)), constrained: true };
  if (maxX < minX || maxY < minY) return fallback;
  const candidates = [...new Set([clamp(preferredX, minX, maxX),
    clamp(preferRight ? left : right, minX, maxX), minX, maxX])];
  for (const x of candidates) {
    const overlapping = rects.filter(r => x < r.right + TEXT_GAP && x + size.width > r.left - TEXT_GAP);
    const below = overlapping.reduce((y, r) => Math.max(y, r.bottom + TEXT_GAP), minY);
    if (below <= maxY) return { left: x, top: clamp(preferredY, below, maxY), constrained: false };
    // Solve footer and text together. Never resolve text and then clamp upward
    // into the same line merely to respect the footer.
    const free = availableTopIntervals(x, size.width, size.height, minY, maxY, rects);
    let chosen: number | undefined, distance = Infinity;
    for (const [begin, end] of free) {
      const top = clamp(preferredY, begin, end), delta = Math.abs(top - preferredY);
      // Deterministic lower slot wins ties; no remembered above/below state.
      if (delta < distance || (delta === distance && (chosen === undefined || top > chosen))) {
        chosen = top; distance = delta;
      }
    }
    if (chosen !== undefined) return { left: x, top: chosen, constrained: false };
  }
  return fallback;
}
