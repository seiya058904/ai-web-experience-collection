/** The one source of truth for the three pieces and the opening they repair. */
export type PieceId = 'A' | 'B' | 'C';
export type Point = Readonly<{ x: number; y: number }>;
export const PIECE_IDS: readonly PieceId[] = ['A', 'B', 'C'];
export const SUN = Object.freeze({ cx: 100, cy: 100, r: 86, viewBox: '0 0 200 200' });
const CENTER: Point = { x: SUN.cx, y: SUN.cy };
const angles = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6] as const;

// Each seam is authored once, then traversed in opposite directions by its
// two neighbors. Offsets are fractions of the radius, measured perpendicular
// to the spoke. This keeps the little knife-cut notches inside their sectors.
const profiles = [
  [[0, 0], [.18, 0], [.32, 0], [.32, .095], [.48, .095], [.48, 0], [.64, 0], [.70, -.065], [.82, -.065], [.85, 0], [1, 0]],
  [[0, 0], [.20, 0], [.30, -.09], [.43, -.09], [.48, 0], [.64, 0], [.64, .07], [.78, .07], [.78, 0], [1, 0]],
  [[0, 0], [.20, 0], [.29, .075], [.42, .075], [.51, 0], [.63, 0], [.70, -.09], [.84, 0], [1, 0]],
] as const;

const round = (n: number) => Math.round(n * 1e8) / 1e8;
const xy = (point: Point) => `${point.x} ${point.y}`;
export const SEAM_POINTS: readonly (readonly Point[])[] = profiles.map((profile, i) => {
  const dx = Math.cos(angles[i]) * SUN.r;
  const dy = Math.sin(angles[i]) * SUN.r;
  return Object.freeze(profile.map(([t, offset]) => Object.freeze({
    x: round(CENTER.x + dx * t - dy * offset),
    y: round(CENTER.y + dy * t + dx * offset),
  })));
});
export const SEAMS: readonly string[] = SEAM_POINTS.map(points => `M ${points.map(xy).join(' L ')}`);

function sectorPath(index: number): string {
  const leading = SEAM_POINTS[index];
  const trailing = SEAM_POINTS[(index + 1) % 3];
  return `M ${leading.map(xy).join(' L ')} A ${SUN.r} ${SUN.r} 0 0 1 ${xy(trailing[trailing.length - 1])} L ${[...trailing].reverse().slice(1).map(xy).join(' L ')} Z`;
}

export const FRAGMENTS: Readonly<Record<PieceId, Readonly<{
  id: PieceId; path: string; label: string; location: string; color: string; centroid: Point;
}>>> = Object.freeze({
  A: Object.freeze({ id: 'A', path: sectorPath(0), label: 'Piece A — Lantern Market', location: 'The Lantern Market', color: '#E5B354', centroid: { x: 139, y: 77 } }),
  B: Object.freeze({ id: 'B', path: sectorPath(1), label: 'Piece B — Wind Hill', location: 'The Wind Hill', color: '#D9A149', centroid: { x: 100, y: 145 } }),
  C: Object.freeze({ id: 'C', path: sectorPath(2), label: 'Piece C — Shadow Valley', location: 'Valley of Shadows', color: '#F0C66D', centroid: { x: 61, y: 77 } }),
});

/** A polygon approximation used only for geometric verification, never rendering. */
export function outlinePolyline(id: PieceId, arcSegments = 240): Point[] {
  const index = PIECE_IDS.indexOf(id);
  const leading = SEAM_POINTS[index];
  const trailing = SEAM_POINTS[(index + 1) % 3];
  const arc: Point[] = [];
  for (let n = 1; n < arcSegments; n++) {
    const angle = angles[index] + (Math.PI * 2 / 3) * n / arcSegments;
    arc.push({ x: CENTER.x + Math.cos(angle) * SUN.r, y: CENTER.y + Math.sin(angle) * SUN.r });
  }
  return [...leading, ...arc, ...[...trailing].reverse()];
}

export function polygonArea(points: readonly Point[]): number {
  return Math.abs(points.reduce((total, point, i) => {
    const next = points[(i + 1) % points.length];
    return total + point.x * next.y - next.x * point.y;
  }, 0)) / 2;
}

/** Even/odd point-in-polygon; boundary points intentionally have no ownership rule. */
export function containsPoint(points: readonly Point[], point: Point): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i], b = points[j];
    if ((a.y > point.y) !== (b.y > point.y) &&
        point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

const escapeAttribute = (text: string) => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
let svgInstance = 0;
const materialId = (name: string) => `paper-${name.replace(/[^a-zA-Z0-9_-]/g, '-')}-${++svgInstance}`;

/** Material is clipped to the immutable piece paths. Relief changes the
 * surface light, never the tessellation or the opening's exact silhouette. */
function paperMaterial(prefix: string): string {
  return `<defs>
    <filter id="${prefix}-relief" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".54 .73" numOctaves="3" seed="29" stitchTiles="stitch" result="paper-noise"/>
      <feDiffuseLighting in="paper-noise" surfaceScale=".35" diffuseConstant="1.18" lighting-color="#fff5df" result="paper-light"><feDistantLight azimuth="225" elevation="57"/></feDiffuseLighting>
      <feComposite in="paper-light" in2="SourceAlpha" operator="in" result="clipped-light"/>
      <feBlend in="SourceGraphic" in2="clipped-light" mode="multiply"/>
    </filter>
    <linearGradient id="${prefix}-wash" x1="0" y1="0" x2=".85" y2="1"><stop stop-color="#FFF0BA" stop-opacity=".18"/><stop offset=".39" stop-color="#D7A14A" stop-opacity="0"/><stop offset="1" stop-color="#704C29" stop-opacity=".18"/></linearGradient>
    <pattern id="${prefix}-fibers" patternUnits="userSpaceOnUse" width="31" height="27"><g fill="none" stroke="#FCE6AC" stroke-opacity=".38" stroke-width=".17" stroke-linecap="round"><path d="M2 4q1.7.8 3.6-.2M19 3l2.8-.8M12 13q2.1-.4 3.4.5M24 19l3.7-1.1M5 24l2.7.4M27 8l1.4-.3"/></g><g fill="none" stroke="#8E682E" stroke-opacity=".21" stroke-width=".14"><path d="M8 6l2.3-.6M20 12l2.7.6M13 22l3.4-.7M2 17l1.9.5"/></g></pattern>
    ${PIECE_IDS.map(id => `<clipPath id="${prefix}-clip-${id}"><path d="${FRAGMENTS[id].path}"/></clipPath>`).join('')}
  </defs>`;
}

function materialLayers(id: PieceId, prefix: string): string {
  const path = FRAGMENTS[id].path;
  return `<g class="piece-paper-material" clip-path="url(#${prefix}-clip-${id})" pointer-events="none">
    <path d="${path}" fill="url(#${prefix}-wash)"/>
    <path d="${path}" fill="url(#${prefix}-fibers)"/>
    <path d="${path}" fill="none" stroke="#79552B" stroke-width="1.65" opacity=".24" transform="translate(.5 .8)"/>
    <path d="${path}" fill="none" stroke="#F5DDA2" stroke-width=".8" opacity=".5" transform="translate(-.3 -.45)"/>
  </g>`;
}

/** Small stitches cross the cut instead of tracing it as a dotted chart line. */
function linenStitches(): string {
  const stitches: string[] = [];
  for (const points of SEAM_POINTS) {
    const lengths = points.slice(1).map((point, i) => Math.hypot(point.x - points[i].x, point.y - points[i].y));
    const total = lengths.reduce((a, b) => a + b, 0);
    for (let distance = 7; distance < total - 5; distance += 8.2) {
      let segment = 0, before = 0;
      while (segment < lengths.length - 1 && before + lengths[segment] < distance) before += lengths[segment++];
      const start = points[segment], end = points[segment + 1], length = lengths[segment];
      const t = (distance - before) / length, tx = (end.x - start.x) / length, ty = (end.y - start.y) / length;
      const x = start.x + (end.x - start.x) * t, y = start.y + (end.y - start.y) * t;
      const ax = round(x - ty * 2.05 - tx * .4), ay = round(y + tx * 2.05 - ty * .4);
      const bx = round(x + ty * 2.05 + tx * .4), by = round(y - tx * 2.05 + ty * .4);
      const d = `M${ax} ${ay}Q${round(x + tx * .7)} ${round(y + ty * .7)} ${bx} ${by}`;
      stitches.push(`<g class="linen-stitch"><circle cx="${ax}" cy="${ay}" r=".48" fill="#64472D" opacity=".6"/><circle cx="${bx}" cy="${by}" r=".48" fill="#64472D" opacity=".6"/><path d="${d}" fill="none" stroke="#5D3C29" stroke-width="1.1" opacity=".28" transform="translate(.23 .35)"/><path d="${d}" fill="none" stroke="#9D4F3F" stroke-width=".78" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#D79B76" stroke-width=".19" stroke-linecap="round" opacity=".6" transform="translate(-.08 -.12)"/></g>`);
    }
  }
  return stitches.join('');
}

export type SvgOptions = { id?: string; className?: string; decorative?: boolean; title?: string; fill?: string; size?: number };
export function fragmentSvg(id: PieceId, options: SvgOptions = {}): string {
  const fragment = FRAGMENTS[id];
  const prefix = materialId(options.id ?? `fragment-${id}`);
  const label = options.title ?? fragment.label;
  const a11y = options.decorative ? 'aria-hidden="true"' : `role="img" aria-label="${escapeAttribute(label)}"`;
  const material = options.fill === 'none' || options.fill === 'transparent' ? '' : materialLayers(id, prefix);
  return `<svg viewBox="${SUN.viewBox}" ${a11y} class="${escapeAttribute(options.className ?? 'paper-fragment')}" width="${options.size ?? 120}" height="${options.size ?? 120}">${paperMaterial(prefix)}<path data-piece="${id}" d="${fragment.path}" fill="${escapeAttribute(options.fill ?? fragment.color)}" stroke="#956128" stroke-width="0.55" stroke-linejoin="round" filter="url(#${prefix}-relief)"/>${material}</svg>`;
}

export type SunSvgOptions = SvgOptions & { placed?: readonly PieceId[]; seams?: boolean; outline?: boolean; rig?: boolean };
export function sunSvg(options: SunSvgOptions = {}): string {
  const placed = options.placed ?? PIECE_IDS;
  const prefix = materialId(options.id ?? 'sun');
  const a11y = options.decorative ? 'aria-hidden="true"' : `role="img" aria-label="${escapeAttribute(options.title ?? 'The paper sun, made from three interlocking pieces with visible repaired seams.')}"`;
  const outline = options.outline ? `<circle cx="100" cy="100" r="86" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="3 4" opacity=".45"/>` : '';
  const pieces = PIECE_IDS.map(id => `<path data-piece="${id}" d="${FRAGMENTS[id].path}" fill="${placed.includes(id) ? FRAGMENTS[id].color : 'transparent'}" stroke="${placed.includes(id) ? '#956128' : 'currentColor'}" stroke-opacity="${placed.includes(id) ? '.5' : '.24'}" stroke-width=".55" ${placed.includes(id) ? `filter="url(#${prefix}-relief)"` : ''}/>${placed.includes(id) ? materialLayers(id, prefix) : ''}`).join('');
  const complete = PIECE_IDS.every(id => placed.includes(id));
  const seams = options.seams === false || !complete ? '' : `<g class="sun-seams">${SEAMS.map(d => `<path d="${d}" fill="none" stroke="#79512C" stroke-width=".55" opacity=".7"/>`).join('')}${linenStitches()}</g>`;
  const rig = options.rig ? '<path class="sun-rig" d="M 63 0 L 63 24 M 137 0 L 137 24" fill="none" stroke="#A94F45" stroke-width="1.3"/>' : '';
  return `<svg viewBox="${SUN.viewBox}" ${a11y} class="${escapeAttribute(options.className ?? 'paper-sun')}" width="${options.size ?? 200}" height="${options.size ?? 200}">${paperMaterial(prefix)}${outline}${pieces}${seams}${rig}</svg>`;
}
