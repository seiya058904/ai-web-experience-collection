import { clamp01, escapeXml, normalizeShares, phaseShares } from './state.ts';
import type { ComponentIndex, Phase, Shares } from './state.ts';

/**
 * Three individually authored ribbons traced from the selected SILLAGE study.
 * Inner contours are invariant; shares change the outer contours, fold position
 * and relief depth. The empty centre and its upper-left nick keep their identity.
 * This is an original visual translation, not a quantitative scent model.
 */
export const IMPRINT_VIEWBOX = '0 0 1000 780';
export const HOLLOW_ID = 'sillage-open-hollow-v1';

export interface ImprintOptions {
  /** Unique per DOM instance when several imprints are visible together. */
  id?: string;
  phase?: Phase;
  missing?: ComponentIndex | null;
  /** 0 = one chord; 1 = three separated, independently readable surfaces. */
  separation?: number;
  /** A texture atlas with Brightness, Spice, Warmth in three horizontal rows. */
  textureHref?: string;
  mode?: 'detail' | 'flat';
  label?: string;
}

type Point = readonly [number, number];
interface Cubic { c1: Point; c2: Point; end: Point }
interface Curve { start: Point; segments: readonly Cubic[] }
type ComponentName = 'brightness' | 'spice' | 'warmth';

export interface ComponentMetrics {
  index: ComponentIndex;
  name: ComponentName;
  share: number;
  present: boolean;
  /** Sampled area of the exact closed contour, in viewBox square units. */
  area: number;
  /** Share-driven position of the material's crease, in viewBox units. */
  edgeRhythm: number;
  /** The same depth used for the rendered shadow and edge treatment. */
  depth: number;
  path: string;
}

export interface ImprintMetrics {
  effectiveShares: Shares;
  components: [ComponentMetrics, ComponentMetrics, ComponentMetrics];
  hollowId: typeof HOLLOW_ID;
  hollowPath: string;
}

export interface ImprintMarkup {
  defs: string;
  body: string;
  viewBox: typeof IMPRINT_VIEWBOX;
  metrics: ImprintMetrics;
}

// This fixed boundary incorporates the recognizable small upper-left nick.
// It is a mask (empty space), never an invented remaining yellow component.
export const HOLLOW_PATH = [
  'M -60 460',
  'C 45 375 136 300 220 261',
  'C 252 246 277 238 297 235',
  'C 316 245 334 237 340 210',
  'C 363 132 481 85 594 77',
  'C 648 69 704 77 738 99',
  'C 651 126 545 171 516 229',
  'C 479 287 536 305 594 330',
  'C 655 358 701 393 696 437',
  'C 686 488 626 513 559 535',
  'C 510 551 478 577 455 602',
  'C 424 635 376 610 330 589',
  'C 306 569 295 555 285 555',
  'C 248 554 228 590 197 633',
  'C 161 676 121 711 80 740',
  'L -60 740 Z',
].join(' ');

const NAMES: readonly ComponentName[] = ['brightness', 'spice', 'warmth'];
const BASE: Shares = [45, 20, 35];
const COLORS = ['#E7B353', '#594051', '#8A6750'] as const;
const OFFSETS: readonly Point[] = [[-40, -35], [36, -8], [-28, 28]];
const ART_SCALE = 0.91;

// Every pair has matching segment counts. At a very small share the outer
// contour approaches the inner contour, rather than shrinking a generic shape.
const BRIGHT_INNER: Curve = {
  start: [145, 425], segments: [
    { c1: [163, 344], c2: [226, 266], end: [297, 235] },
    { c1: [316, 245], c2: [334, 237], end: [340, 210] },
    { c1: [363, 132], c2: [481, 85], end: [594, 77] },
    { c1: [756, 55], c2: [905, 132], end: [940, 265] },
    { c1: [972, 390], c2: [945, 492], end: [868, 551] },
    { c1: [820, 591], c2: [745, 611], end: [693, 637] },
    { c1: [649, 659], c2: [613, 686], end: [579, 712] },
  ],
};
const BRIGHT_OUTER: Curve = {
  start: [145, 425], segments: [
    { c1: [163, 341], c2: [225, 264], end: [297, 233] },
    { c1: [318, 246], c2: [338, 238], end: [350, 202] },
    { c1: [376, 116], c2: [488, 49], end: [637, 19] },
    { c1: [800, -2], c2: [943, 111], end: [970, 270] },
    { c1: [1000, 418], c2: [970, 524], end: [901, 580] },
    { c1: [845, 621], c2: [771, 632], end: [710, 645] },
    { c1: [655, 665], c2: [613, 686], end: [579, 712] },
  ],
};

const SPICE_INNER: Curve = {
  start: [738, 99], segments: [
    { c1: [651, 126], c2: [545, 171], end: [516, 229] },
    { c1: [479, 287], c2: [536, 305], end: [594, 330] },
    { c1: [655, 358], c2: [701, 393], end: [696, 437] },
    { c1: [686, 488], c2: [626, 513], end: [559, 535] },
    { c1: [510, 551], c2: [478, 577], end: [455, 602] },
    { c1: [424, 635], c2: [376, 610], end: [330, 589] },
  ],
};
const SPICE_OUTER: Curve = {
  start: [738, 99], segments: [
    { c1: [826, 122], c2: [907, 184], end: [936, 250] },
    { c1: [956, 294], c2: [966, 348], end: [949, 401] },
    { c1: [930, 464], c2: [885, 506], end: [830, 535] },
    { c1: [778, 568], c2: [715, 587], end: [658, 616] },
    { c1: [598, 651], c2: [550, 684], end: [478, 680] },
    { c1: [425, 680], c2: [367, 623], end: [330, 589] },
  ],
};
const SPICE_FOLD: Curve = {
  start: [738, 99], segments: [
    { c1: [651, 126], c2: [545, 171], end: [516, 229] },
    { c1: [478, 291], c2: [658, 285], end: [714, 340] },
    { c1: [772, 384], c2: [850, 414], end: [810, 452] },
    { c1: [785, 493], c2: [743, 529], end: [691, 564] },
    { c1: [645, 623], c2: [550, 689], end: [478, 680] },
    { c1: [425, 680], c2: [367, 623], end: [330, 589] },
  ],
};

const WARM_INNER: Curve = {
  start: [80, 740], segments: [
    { c1: [121, 711], c2: [161, 676], end: [197, 633] },
    { c1: [228, 590], c2: [248, 554], end: [285, 555] },
    { c1: [348, 554], c2: [379, 622], end: [432, 649] },
    { c1: [500, 699], c2: [572, 650], end: [638, 620] },
    { c1: [702, 590], c2: [740, 570], end: [802, 548] },
    { c1: [864, 530], c2: [922, 490], end: [947, 430] },
  ],
};
const WARM_OUTER: Curve = {
  start: [80, 740], segments: [
    { c1: [140, 705], c2: [191, 720], end: [244, 718] },
    { c1: [303, 720], c2: [353, 749], end: [413, 750] },
    { c1: [497, 761], c2: [555, 727], end: [638, 722] },
    { c1: [703, 718], c2: [760, 737], end: [816, 725] },
    { c1: [882, 712], c2: [921, 659], end: [940, 587] },
    { c1: [951, 532], c2: [954, 496], end: [947, 430] },
  ],
};

const INNER = [BRIGHT_INNER, SPICE_INNER, WARM_INNER] as const;
const OUTER = [BRIGHT_OUTER, SPICE_OUTER, WARM_OUTER] as const;

const num = (value: number): string => String(Math.round(value * 1000) / 1000);
const pt = (point: Point): string => `${num(point[0])} ${num(point[1])}`;

function pointBetween(a: Point, b: Point, t: number, bounded = false): Point {
  const x = a[0] + (b[0] - a[0]) * t;
  const y = a[1] + (b[1] - a[1]) * t;
  return bounded ? [Math.max(40, Math.min(1015, x)), Math.max(-12, Math.min(795, y))] : [x, y];
}

function between(a: Curve, b: Curve, t: number, bounded = false): Curve {
  return {
    start: pointBetween(a.start, b.start, t, bounded),
    segments: a.segments.map((segment, index) => ({
      c1: pointBetween(segment.c1, b.segments[index].c1, t, bounded),
      c2: pointBetween(segment.c2, b.segments[index].c2, t, bounded),
      end: pointBetween(segment.end, b.segments[index].end, t, bounded),
    })),
  };
}

function reversed(curve: Curve): Curve {
  const starts = [curve.start, ...curve.segments.map(segment => segment.end)];
  return {
    start: starts[starts.length - 1],
    segments: curve.segments.map((segment, index) => ({
      c1: segment.c2, c2: segment.c1, end: starts[index],
    })).reverse(),
  };
}

function commands(curve: Curve): string {
  return curve.segments.map(segment => `C ${pt(segment.c1)} ${pt(segment.c2)} ${pt(segment.end)}`).join(' ');
}

function linePath(curve: Curve): string { return `M ${pt(curve.start)} ${commands(curve)}`; }

function ribbonPath(inner: Curve, outer: Curve): string {
  const back = reversed(outer);
  return `M ${pt(inner.start)} ${commands(inner)} L ${pt(back.start)} ${commands(back)} Z`;
}

function sampleCurve(curve: Curve): Point[] {
  const points: Point[] = [curve.start];
  let start = curve.start;
  for (const segment of curve.segments) {
    for (let step = 1; step <= 24; step++) {
      const t = step / 24;
      const u = 1 - t;
      points.push([
        u ** 3 * start[0] + 3 * u ** 2 * t * segment.c1[0] + 3 * u * t ** 2 * segment.c2[0] + t ** 3 * segment.end[0],
        u ** 3 * start[1] + 3 * u ** 2 * t * segment.c1[1] + 3 * u * t ** 2 * segment.c2[1] + t ** 3 * segment.end[1],
      ]);
    }
    start = segment.end;
  }
  return points;
}

function ribbonArea(inner: Curve, outer: Curve): number {
  const points = [...sampleCurve(inner), ...sampleCurve(reversed(outer))];
  let area = 0;
  for (let index = 0; index < points.length; index++) {
    const a = points[index];
    const b = points[(index + 1) % points.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(area / 2) * ART_SCALE ** 2;
}

function expansion(share: number, index: ComponentIndex): number {
  const base = BASE[index];
  // Strong linear control below the reference composition. Above it, a
  // restrained expansion keeps the complete silhouette inside its artboard.
  if (share <= base) return share / base;
  return 1 + (share - base) / (100 - base) * (index === 0 ? 0.48 : 0.42);
}

interface ComponentGeometry {
  metrics: ComponentMetrics;
  inner: Curve;
  outer: Curve;
  fold: Curve;
}

function geometry(shares: Readonly<Shares>, options: ImprintOptions): {
  metrics: ImprintMetrics;
  layers: [ComponentGeometry, ComponentGeometry, ComponentGeometry];
} {
  const effective = phaseShares(normalizeShares(shares), options.phase ?? 'unfolding');
  if (options.missing !== undefined && options.missing !== null) effective[options.missing] = 0;
  const layers = effective.map((share, i) => {
    const index = i as ComponentIndex;
    const inner = INNER[index];
    const outer = between(inner, OUTER[index], expansion(share, index), true);
    const foldAt = (index === 1 ? 0.38 : 0.60) + share / 100 * (index === 1 ? 0.22 : 0.12);
    const fold = index === 1
      ? between(inner, SPICE_FOLD, expansion(share, index) * (0.93 + share / 100 * .35), true)
      : between(inner, outer, foldAt);
    return {
      inner, outer, fold,
      metrics: {
        index, name: NAMES[index], share, present: share > 0,
        area: share > 0 ? ribbonArea(inner, outer) : 0,
        edgeRhythm: share > 0 ? foldAt * 100 : 0,
        depth: share > 0 ? 3 + Math.sqrt(share / 100) * (index === 1 ? 13 : 7) : 0,
        path: share > 0 ? ribbonPath(inner, outer) : '',
      },
    };
  }) as [ComponentGeometry, ComponentGeometry, ComponentGeometry];
  return {
    layers,
    metrics: {
      effectiveShares: effective,
      components: layers.map(layer => layer.metrics) as ImprintMetrics['components'],
      hollowId: HOLLOW_ID,
      hollowPath: HOLLOW_PATH,
    },
  };
}

export function geometryMetrics(shares: Readonly<Shares>, options: ImprintOptions = {}): ImprintMetrics {
  return geometry(shares, options).metrics;
}

function safeId(id: string): string {
  return `sil-${id.replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 90) || 'imprint'}`;
}

function gradient(id: string, index: ComponentIndex): string {
  if (index === 0) {
    return `<linearGradient id="${id}-surface" x1=".22" y1="0" x2=".82" y2="1"><stop stop-color="#F8CD76"/><stop offset=".38" stop-color="#E7B353"/><stop offset=".78" stop-color="#D39A3F"/><stop offset="1" stop-color="#F1C879"/></linearGradient>
      <linearGradient id="${id}-under" x1=".15" y1="0" x2=".7" y2="1"><stop stop-color="#D99E44"/><stop offset=".6" stop-color="#BD8234"/><stop offset="1" stop-color="#E6B361"/></linearGradient>
      <linearGradient id="${id}-edge" x1=".12" y1=".04" x2=".9" y2="1"><stop stop-color="#FFE2A3"/><stop offset=".54" stop-color="#F4C266"/><stop offset="1" stop-color="#D3A15B"/></linearGradient>`;
  }
  if (index === 1) {
    return `<linearGradient id="${id}-surface" x1=".18" y1=".05" x2=".86" y2=".92"><stop stop-color="#927184"/><stop offset=".28" stop-color="#765267"/><stop offset=".60" stop-color="#594051"/><stop offset=".86" stop-color="#76596B"/><stop offset="1" stop-color="#A17C8E"/></linearGradient>
      <radialGradient id="${id}-under" cx=".58" cy=".48" r=".8"><stop stop-color="#30212B"/><stop offset=".46" stop-color="#49313F"/><stop offset=".78" stop-color="#6C4A5E"/><stop offset="1" stop-color="#927084"/></radialGradient>
      <linearGradient id="${id}-edge" x1=".2" y1=".02" x2=".9" y2=".92"><stop stop-color="#BB93A2"/><stop offset=".4" stop-color="#977381"/><stop offset="1" stop-color="#745565"/></linearGradient>`;
  }
  return `<linearGradient id="${id}-surface" x1=".08" y1="0" x2=".7" y2="1"><stop stop-color="#B59572"/><stop offset=".4" stop-color="#9F7A57"/><stop offset=".76" stop-color="#8A6750"/><stop offset="1" stop-color="#AF8863"/></linearGradient>
    <linearGradient id="${id}-under" x1=".1" y1="0" x2=".8" y2="1"><stop stop-color="#9E7E5D"/><stop offset="1" stop-color="#72523C"/></linearGradient>
    <linearGradient id="${id}-edge" x1=".1" y1="0" x2=".8" y2="1"><stop stop-color="#D4B18B"/><stop offset=".6" stop-color="#AD8965"/><stop offset="1" stop-color="#896950"/></linearGradient>`;
}

function texture(id: string, index: ComponentIndex, href: string): string {
  // Normalizing the full atlas to a square makes each sample an exact third,
  // regardless of the encoded raster dimensions. The other rows stay clipped.
  const rowHeight = 1000 / 3;
  const rowTop = index * rowHeight;
  const inset = 3;
  // Fill the same viewport from the row's interior, excluding the generated
  // mixed-colour boundary pixels without changing the pattern or geometry.
  const scale = rowHeight / (rowHeight - inset * 2);
  const imageTop = rowTop - (rowTop + inset) * scale;
  return `<pattern id="${id}-texture" patternUnits="userSpaceOnUse" width="1000" height="333.333"><svg x="0" y="0" width="1000" height="333.333" viewBox="0 ${num(rowTop)} 1000 ${num(rowHeight)}" preserveAspectRatio="xMidYMid slice" overflow="hidden"><image href="${escapeXml(href)}" x="0" y="${num(imageTop)}" width="1000" height="${num(1000 * scale)}" preserveAspectRatio="none"/></svg></pattern>`;
}

export function imprintMarkup(shares: Readonly<Shares>, options: ImprintOptions = {}): ImprintMarkup {
  const model = geometry(shares, options);
  const id = safeId(options.id ?? `${shares.join('-')}-${options.phase ?? 'unfolding'}-${options.missing ?? 'all'}`);
  const detailed = options.mode !== 'flat';
  const separation = clamp01(options.separation ?? 0);
  const defs: string[] = [
    `<mask id="${id}-hollow" maskUnits="userSpaceOnUse" x="-150" y="-150" width="1400" height="1100"><rect x="-150" y="-150" width="1400" height="1100" fill="white"/><path d="${HOLLOW_PATH}" fill="black"/></mask>`,
  ];
  const bodies: string[] = [];

  // Brown is the low support; plum folds above it; the thin ochre lip is last.
  for (const index of [2, 1, 0] as ComponentIndex[]) {
    const layer = model.layers[index];
    const { metrics } = layer;
    if (!metrics.present) continue;
    const layerId = `${id}-${metrics.name}`;
    const clip = `${layerId}-clip`;
    defs.push(`<clipPath id="${clip}"><path d="${metrics.path}"/></clipPath>`);
    if (detailed) {
      defs.push(gradient(layerId, index));
      defs.push(`<filter id="${layerId}-shadow" x="-25%" y="-25%" width="150%" height="160%" color-interpolation-filters="sRGB"><feDropShadow dx="${num(metrics.depth * .17)}" dy="${num(metrics.depth * .64)}" stdDeviation="${num(metrics.depth * .68)}" flood-color="#29211E" flood-opacity="${index === 1 ? '.20' : '.15'}"/></filter>`);
      if (options.textureHref) defs.push(texture(layerId, index, options.textureHref));
    }

    const offset = OFFSETS[index];
    const attributes = `data-component="${metrics.name}" data-component-index="${index}" data-share="${num(metrics.share)}" data-contour-area="${num(metrics.area)}" data-relief-depth="${num(metrics.depth)}"`;
    const fill = detailed ? `url(#${layerId}-surface)` : COLORS[index];
    const details: string[] = [];
    if (detailed) {
      if (index === 1) {
        // Two connected, exact facets create the curled fold. There are no
        // duplicate silhouettes or opacity crossfades between different shapes.
        details.push(`<path data-facet="inner" d="${ribbonPath(layer.inner, layer.fold)}" fill="url(#${layerId}-under)"/>`);
      } else if (index === 0) {
        const lip = between(layer.inner, layer.outer, 0.13);
        details.push(`<path data-facet="lip" d="${ribbonPath(layer.inner, lip)}" fill="url(#${layerId}-under)" opacity=".75"/>`);
      }
      if (options.textureHref) {
        details.push(`<path data-material="${metrics.name}" d="${metrics.path}" fill="url(#${layerId}-texture)" opacity="${index === 2 ? '.62' : index === 1 ? '.32' : '.58'}"/>`);
      }
      const crease = index === 1 ? layer.fold : layer.inner;
      details.push(`<path data-edge="${metrics.name}" d="${linePath(crease)}" fill="none" stroke="url(#${layerId}-edge)" stroke-width="${num(index === 0 ? .8 + metrics.share / 100 : index === 1 ? .9 + metrics.share / 80 : .7)}" stroke-linecap="round" opacity="${index === 2 ? '.5' : '.82'}"/>`);
      if (index === 1) {
        details.push(`<path d="${linePath(between(layer.fold, layer.outer, .035))}" fill="none" stroke="#33242E" stroke-width="${num(.6 + metrics.share / 100)}" opacity=".18"/>`);
      }
    }
    bodies.push(`<g ${attributes} transform="translate(${num(offset[0] * separation)} ${num(offset[1] * separation)})"${detailed ? ` filter="url(#${layerId}-shadow)"` : ''}><g mask="url(#${id}-hollow)"><path data-surface="${metrics.name}" d="${metrics.path}" fill="${fill}"/><g clip-path="url(#${clip})">${details.join('')}</g></g></g>`);
  }

  return {
    defs: defs.join('\n'),
    body: `<g data-imprint-root="" transform="translate(28 27) scale(${ART_SCALE})">${bodies.join('\n')}<path data-neutral-hollow="${HOLLOW_ID}" d="${HOLLOW_PATH}" fill="none" stroke="none" pointer-events="none"/></g>`,
    viewBox: IMPRINT_VIEWBOX,
    metrics: model.metrics,
  };
}

export function imprintSVG(shares: Readonly<Shares>, options: ImprintOptions = {}): string {
  const markup = imprintMarkup(shares, options);
  const id = safeId(options.id ?? `${shares.join('-')}-${options.phase ?? 'unfolding'}-${options.missing ?? 'all'}`);
  const values = markup.metrics.effectiveShares.map(value => Math.round(value));
  const label = options.label ?? `An original visual imprint: Brightness ${values[0]}, Spice ${values[1]}, Warmth ${values[2]}.`;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${markup.viewBox}" width="1000" height="780" role="img" aria-labelledby="${id}-title" data-sillage-imprint=""><title id="${id}-title">${escapeXml(label)}</title><defs>${markup.defs}</defs>${markup.body}</svg>`;
}
