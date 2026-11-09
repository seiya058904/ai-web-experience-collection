import {
  DECISION_PROGRESS,
  WIND_LAYERS,
  getBranchRoute,
  getLanding,
  getRoute,
  readPreference,
} from './journey.ts';
import type { RoutePoint, WindLayer } from './journey.ts';

/** All geometry comes from the authored journey. No external SVG resources. */
const PALETTE = {
  pearl: '#F6F1E8',
  slate: '#334253',
  apricot: '#EAB7A1',
  sage: '#A6B5A0',
  navy: '#43536D',
  honey: '#A77848',
  muted: '#828A86',
};

const LAYERS: WindLayer[] = ['low', 'middle', 'high'];

interface Point2 {
  x: number;
  z: number;
}

interface Projection {
  scale: number;
  translateX: number;
  translateY: number;
  project: (point: Point2) => { x: number; y: number };
}

function escapeXML(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  }[character]!));
}

function number(value: number, precision = 4): string {
  return Number(value.toFixed(precision)).toString();
}

/** Every selection uses bounds from all three routes, so the shared part stays put. */
function projection(left: number, top: number, width: number, height: number): Projection {
  const all = LAYERS.flatMap((layer) => getRoute(layer));
  const minX = Math.min(...all.map((point) => point.x));
  const maxX = Math.max(...all.map((point) => point.x));
  const minZ = Math.min(...all.map((point) => point.z));
  const maxZ = Math.max(...all.map((point) => point.z));
  const scale = Math.min(width / (maxX - minX), height / (maxZ - minZ));
  const translateX = left + (width - (maxX - minX) * scale) / 2 - minX * scale;
  const translateY = top + (height - (maxZ - minZ) * scale) / 2 + maxZ * scale;
  return {
    scale,
    translateX,
    translateY,
    project: (point) => ({ x: translateX + point.x * scale, y: translateY - point.z * scale }),
  };
}

function squaredDistanceToSegment(point: Point2, start: Point2, end: Point2): number {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const denominator = dx * dx + dz * dz;
  const t = denominator === 0 ? 0 : Math.max(0, Math.min(1,
    ((point.x - start.x) * dx + (point.z - start.z) * dz) / denominator,
  ));
  return (point.x - start.x - t * dx) ** 2 + (point.z - start.z - t * dz) ** 2;
}

/**
 * Douglas–Peucker reduces redundant integration samples with at most 0.04 SVG
 * pixels of geometric error. The first/last point of every path is always kept;
 * common and branch portions are simplified separately, retaining the decision.
 */
function simplify(points: readonly Readonly<RoutePoint>[], scale: number): Point2[] {
  if (points.length <= 2) return points.map(({ x, z }) => ({ x, z }));
  const toleranceSquared = (0.04 / scale) ** 2;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length > 0) {
    const [start, end] = stack.pop()!;
    let furthest = -1;
    let distance = toleranceSquared;
    for (let i = start + 1; i < end; i += 1) {
      const candidate = squaredDistanceToSegment(points[i]!, points[start]!, points[end]!);
      if (candidate > distance) {
        distance = candidate;
        furthest = i;
      }
    }
    if (furthest !== -1) {
      keep[furthest] = 1;
      stack.push([start, furthest], [furthest, end]);
    }
  }
  return points.filter((_, index) => keep[index]).map(({ x, z }) => ({ x, z }));
}

function pointsAttribute(points: readonly Readonly<RoutePoint>[], scale: number): string {
  return simplify(points, scale).map(({ x, z }) => `${number(x)},${number(z)}`).join(' ');
}

function commonPoints(): readonly Readonly<RoutePoint>[] {
  return getRoute('middle').filter((point) => point.progress <= DECISION_PROGRESS);
}

function routeLine(
  layer: WindLayer,
  role: 'selected' | 'alternative' | 'preview',
  transform: Projection,
  width: number,
): string {
  const definition = WIND_LAYERS[layer];
  const opacity = role === 'alternative' ? 0.23 : 1;
  const dashed = role === 'preview' ? ' stroke-dasharray="3 7"' : '';
  return `<polyline data-route-layer="${layer}" data-route-role="${role}" points="${pointsAttribute(getBranchRoute(layer), transform.scale)}" fill="none" stroke="${definition.color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" vector-effect="non-scaling-stroke"${dashed}/>`;
}

function sharedLine(transform: Projection, width: number): string {
  return `<polyline data-route-role="common" points="${pointsAttribute(commonPoints(), transform.scale)}" fill="none" stroke="${PALETTE.muted}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
}

function worldGroup(transform: Projection, contents: string): string {
  return `<g data-coordinate-system="fictional-x-z" transform="translate(${number(transform.translateX)} ${number(transform.translateY)}) scale(${number(transform.scale, 8)} ${number(-transform.scale, 8)})">${contents}</g>`;
}

function marker(x: number, y: number, radius: number, fill: string, attributes = ''): string {
  return `<circle cx="${number(x)}" cy="${number(y)}" r="${radius}" fill="${fill}" ${attributes}/>`;
}

/** Ground accents are placed around the true landing locations, not vice versa. */
function meadowAccents(transform: Projection): string {
  return LAYERS.map((layer) => {
    const point = transform.project(getLanding(layer));
    return `<g data-landscape="${layer}" opacity="0.22"><ellipse cx="${number(point.x)}" cy="${number(point.y)}" rx="34" ry="17" fill="${PALETTE.sage}" transform="rotate(-13 ${number(point.x)} ${number(point.y)})"/><path d="M ${number(point.x - 39)} ${number(point.y + 11)} Q ${number(point.x - 4)} ${number(point.y + 25)} ${number(point.x + 36)} ${number(point.y + 4)}" fill="none" stroke="${PALETTE.sage}" stroke-width="0.8"/></g>`;
  }).join('');
}

function balloonIcon(x: number, y: number, scale: number): string {
  const height = 92;
  const radiusAt = (fraction: number) =>
    43 * Math.sin(Math.PI * fraction) ** 0.8 * (1.24 - 0.55 * fraction) + 4 * fraction;
  const edge = (angle: number) => Array.from({ length: 25 }, (_, i) => {
    const fraction = i / 24;
    return { x: Math.sin(angle) * radiusAt(fraction), y: height * fraction };
  });
  const gorePath = (index: number) => {
    const left = edge(-Math.PI / 2 + index * Math.PI / 8);
    const right = edge(-Math.PI / 2 + (index + 1) * Math.PI / 8).reverse();
    return [...left, ...right].map((point, i) => `${i === 0 ? 'M' : 'L'}${number(point.x, 2)} ${number(point.y, 2)}`).join(' ') + 'Z';
  };
  // Back gores are drawn first and occluded by the eight visible front gores.
  // The icon represents a 16-gore volume, not a 16-stripe flat hemisphere.
  const drawOrder = [...Array.from({ length: 8 }, (_, i) => i + 8), ...Array.from({ length: 8 }, (_, i) => i)];
  const gores = drawOrder.map((index) =>
    `<path data-gore="${index + 1}" d="${gorePath(index)}" fill="${index % 2 === 0 ? PALETTE.pearl : PALETTE.apricot}" stroke="#CBAF98" stroke-width="0.35"/>`,
  ).join('');
  return `<g data-balloon-gores="16" transform="translate(${x} ${y}) scale(${scale})" aria-hidden="true">${gores}<path data-balloon-part="navy-crown" d="M-13 6 Q0-4 13 6 Q1 10-13 6Z" fill="${PALETTE.navy}"/><path d="M-4 92L-6 107M4 92L6 107M-2 92L3 107M2 92L-3 107" fill="none" stroke="${PALETTE.slate}" stroke-width="0.75"/><path data-balloon-part="basket" d="M-7 107H7L6 119H-6Z" fill="${PALETTE.honey}"/><path d="M-8 106H8V110H-8ZM-6 115H6" fill="none" stroke="#795535" stroke-width="1.3"/></g>`;
}

/**
 * A complete, portable 720×900 SVG. It has no image/font URLs, scripts, external
 * references, user data or real-world coordinates in its visible copy.
 */
export function createKeepsakeSVG(layer: WindLayer): string {
  const selected = readPreference(layer);
  const definition = WIND_LAYERS[selected];
  const transform = projection(94, 348, 532, 294);
  const takeoff = transform.project(getRoute(selected)[0]!);
  const decision = transform.project(getBranchRoute(selected)[0]!);
  const landing = transform.project(getLanding(selected));
  const title = `AER keepsake: ${definition.label} to ${definition.destination}`;
  const routeGeometry = worldGroup(transform,
    sharedLine(transform, 1.7) + routeLine(selected, 'selected', transform, 2.7),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="900" viewBox="0 0 720 900" role="img" aria-label="${escapeXML(title)}" data-selected-layer="${selected}">
<title>${escapeXML(title)}</title>
<desc>A keepsake from a fictional balloon journey. The shared beginning leads to a choice of wind. ${escapeXML(definition.label)} carries this route to ${escapeXML(definition.destination)}. This is an imagined landscape, not a flight record.</desc>
<rect width="720" height="900" fill="${PALETTE.pearl}"/>
<rect x="24" y="24" width="672" height="852" fill="none" stroke="#BFC4BA" stroke-width="0.65"/>
<g fill="${PALETTE.slate}">
<text x="360" y="68" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" letter-spacing="8">AER</text>
<text x="360" y="139" text-anchor="middle" font-family="Georgia, serif" font-size="44" font-weight="400">Carried by air</text>
<path d="M64 174H656" fill="none" stroke="#BFC4BA" stroke-width="0.65"/>
${balloonIcon(360, 198, 0.88)}
<text x="360" y="326" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" letter-spacing="2.6">THE PATH OF YOUR MORNING</text>
${meadowAccents(transform)}
${routeGeometry}
${marker(takeoff.x, takeoff.y, 4.3, PALETTE.pearl, `stroke="${PALETTE.slate}" stroke-width="1.4" data-route-mark="takeoff"`)}
${marker(decision.x, decision.y, 3.3, PALETTE.slate, 'data-route-mark="decision"')}
${marker(landing.x, landing.y, 6, definition.color, 'data-route-mark="landing"')}
${marker(landing.x, landing.y, 10, 'none', `stroke="${definition.color}" stroke-width="0.8" opacity="0.6"`)}
<g font-family="Arial, sans-serif" font-size="10.5">
<text x="${number(takeoff.x + 13)}" y="${number(takeoff.y + 4)}">Lift-off</text>
<text x="${number(decision.x - 13)}" y="${number(decision.y + 3)}" text-anchor="end">Choose the air</text>
<text x="${number(landing.x + 16)}" y="${number(landing.y + 4)}">Landing</text>
</g>
<g font-family="Arial, sans-serif" font-size="9.5" fill="#68736F">
<path d="M222 679H244" stroke="${PALETTE.muted}" stroke-width="1.7"/>
<text x="252" y="682">Shared beginning</text>
<path d="M378 679H400" stroke="${definition.color}" stroke-width="2.7"/>
<text x="408" y="682">Your wind</text>
</g>
<path d="M64 710H656" fill="none" stroke="#BFC4BA" stroke-width="0.65"/>
<text x="360" y="742" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" letter-spacing="2">${escapeXML(definition.label.toUpperCase())}</text>
<text x="360" y="783" text-anchor="middle" font-family="Georgia, serif" font-size="31">${escapeXML(definition.destination)}</text>
<text x="360" y="818" text-anchor="middle" font-family="Georgia, serif" font-size="13" font-style="italic">An imagined journey. A real moment of pause.</text>
<text x="360" y="853" text-anchor="middle" font-family="Arial, sans-serif" font-size="9.5" fill="#68736F">Fictional landscape · Not a flight record.</text>
</g>
</svg>`;
}

export function keepsakeFilename(layer: WindLayer, extension: 'svg' | 'png'): string {
  const selected = readPreference(layer);
  const destination = WIND_LAYERS[selected].destination.toLowerCase().replace(/\s+/g, '-');
  return `aer-${selected}-${destination}.${extension === 'png' ? 'png' : 'svg'}`;
}

/**
 * Accessible inline route art. Titles use native SVG naming plus aria-label,
 * without document-global IDs or references that can collide when repeated.
 * Preview is purely a dotted overlay; it cannot change selected route metadata.
 */
export function createRouteDiagramSVG(
  layer: WindLayer,
  options: { preview?: WindLayer; compact?: boolean } = {},
): string {
  const selected = readPreference(layer);
  const candidate = options.preview === undefined ? undefined : readPreference(options.preview);
  const preview = candidate === selected ? undefined : candidate;
  const compact = options.compact === true;
  const width = compact ? 500 : 720;
  const height = compact ? 300 : 420;
  const transform = projection(compact ? 28 : 48, compact ? 47 : 59,
    compact ? 444 : 624, compact ? 185 : 283);
  const definition = WIND_LAYERS[selected];
  const takeoff = transform.project(getRoute(selected)[0]!);
  const decision = transform.project(getBranchRoute(selected)[0]!);
  const title = `${definition.label} route to ${definition.destination}`;
  const previewDescription = preview
    ? ` Dotted preview: ${WIND_LAYERS[preview].label} to ${WIND_LAYERS[preview].destination}. Your selected wind stays ${definition.label.toLowerCase()}.`
    : '';
  const paths = LAYERS.filter((entry) => entry !== selected).map((entry) =>
    routeLine(entry, 'alternative', transform, 1.5),
  ).join('') + sharedLine(transform, 1.8) + routeLine(selected, 'selected', transform, 3) +
    (preview ? routeLine(preview, 'preview', transform, 2.7) : '');
  const landingMarks = LAYERS.map((entry) => {
    const point = transform.project(getLanding(entry));
    const isSelected = entry === selected;
    const isPreview = entry === preview;
    const color = WIND_LAYERS[entry].color;
    const label = compact ? WIND_LAYERS[entry].label.replace(' layer', '') : WIND_LAYERS[entry].destination;
    const anchor = entry === 'high' ? 'end' : 'start';
    const labelX = point.x + (entry === 'high' ? -12 : 12);
    return `<g data-destination-layer="${entry}" opacity="${isSelected || isPreview ? 1 : 0.53}">${marker(point.x, point.y, isSelected ? 5.7 : 3.7, isSelected ? color : PALETTE.pearl, `stroke="${color}" stroke-width="${isSelected ? 0 : 1.3}"`)}${isPreview ? marker(point.x, point.y, 8.4, 'none', `stroke="${color}" stroke-width="1" stroke-dasharray="2 3"`) : ''}<text x="${number(labelX)}" y="${number(point.y + 4)}" text-anchor="${anchor}" font-weight="${isSelected ? 600 : 400}">${escapeXML(label)}</text></g>`;
  }).join('');
  const previewLabel = preview
    ? `Preview: ${WIND_LAYERS[preview].label} · Your choice stays ${definition.label.toLowerCase()}`
    : 'One shared beginning. Three different ways home.';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXML(title + previewDescription)}" data-selected-layer="${selected}" data-preview-layer="${preview ?? ''}">
<title>${escapeXML(title)}</title>
<desc>Three routes share one takeoff and one decision point. The solid colored line is your selected ${escapeXML(definition.label.toLowerCase())}.${escapeXML(previewDescription)} Fictional landscape, not a flight record.</desc>
<rect width="${width}" height="${height}" fill="${PALETTE.pearl}"/>
<text x="${width / 2}" y="${compact ? 23 : 27}" text-anchor="middle" fill="${PALETTE.slate}" font-family="Arial, sans-serif" font-size="${compact ? 8.5 : 9}" letter-spacing="1.7">THE WIND WRITES THE WAY</text>
${meadowAccents(transform)}
${worldGroup(transform, paths)}
${marker(takeoff.x, takeoff.y, 4, PALETTE.pearl, `stroke="${PALETTE.slate}" stroke-width="1.4" data-route-mark="takeoff"`)}
${marker(decision.x, decision.y, 3.2, PALETTE.slate, 'data-route-mark="decision"')}
<g font-family="Arial, sans-serif" font-size="${compact ? 10 : 11}" fill="${PALETTE.slate}">
${landingMarks}
<text x="${number(takeoff.x + 12)}" y="${number(takeoff.y + 4)}">Lift-off</text>
<text x="${number(decision.x - 12)}" y="${number(decision.y + 4)}" text-anchor="end">${compact ? 'Choice' : 'A shared decision'}</text>
</g>
<g font-family="Arial, sans-serif" font-size="${compact ? 9.5 : 10.5}" fill="${PALETTE.slate}">
<text x="${width / 2}" y="${height - 31}" text-anchor="middle">${escapeXML(previewLabel)}</text>
<text x="${width / 2}" y="${height - 13}" text-anchor="middle" font-size="${compact ? 8 : 9}" fill="#68736F">Fictional landscape · Not a flight record.</text>
</g>
</svg>`;
}
