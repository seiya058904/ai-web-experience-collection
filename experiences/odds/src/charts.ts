import { expectedCounts, type Experiment } from './engine.ts';

export type Dot = { id: string; index: number; k: number; x: number; y: number; r: number };
export type ChartBox = { x: number; y: number; width: number; height: number };
export type TrayOptions = ChartBox & {
  maxCount?: number;
  label?: string;
  selectedId?: string;
  showTheory?: boolean;
  opacity?: number;
  /** True when the overlaid Canvas owns all spheres. The tray and counts remain. */
  omitDots?: boolean;
};
export type HistogramOptions = ChartBox & {
  label?: string;
  /** Let a transition layer own the observed bars, shadows and count labels. */
  omitBars?: boolean;
};
export type PortraitOptions = {
  box: ChartBox;
  maxCount?: number;
  selectedId?: string;
  dpr?: number;
  opacity?: number;
};

const COLUMNS = [0, -1, 1] as const;
const PITCH = 2.35;
const q = (value: number): string => String(Number(value.toFixed(5)));
const escape = (value: string): string => value.toWellFormed().replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[character]!));

function inspectBox(box: ChartBox): void {
  if (![box.x, box.y, box.width, box.height].every(Number.isFinite) || box.width <= 0 || box.height <= 0) {
    throw new RangeError('A chart needs a finite position and a positive width and height.');
  }
}

function geometry(round: Experiment, box: ChartBox, maxCount?: number) {
  inspectBox(box);
  const observedMax = Math.max(0, ...round.counts);
  if (maxCount !== undefined && (!Number.isFinite(maxCount) || maxCount < observedMax || maxCount < 0)) {
    throw new RangeError('The shared maxCount must cover every observed slot count.');
  }
  const capacity = Math.max(1, maxCount ?? Math.max(observedMax, ...expectedCounts(round.n, round.p, round.N)));
  const rows = Math.max(1, Math.ceil(capacity / 3));
  const laneWidth = box.width / (round.n + 1);
  const radius = Math.min(laneWidth / 8, box.height / (rows * PITCH + 0.2));
  const pitch = radius * PITCH;
  const baseline = box.y + box.height;
  return {
    capacity, rows, laneWidth, radius, pitch, baseline,
    slotX: (k: number) => box.x + (k + 0.5) * laneWidth,
    countY: (count: number) => baseline - count * pitch / 3,
  };
}

/**
 * Stable bottom-up lattice: three balls per row in each endpoint lane.
 * Pass the SAME maxCount for all comparisons and both SVG/Canvas owners.
 * IDs and positions of an existing prefix then survive any change in N.
 * Box y+height is the count baseline; the shallow tray extends below it.
 */
export function dotLayout(round: Experiment, box: ChartBox, maxCount?: number): Dot[] {
  const layout = geometry(round, box, maxCount);
  const occupied = Array<number>(round.n + 1).fill(0);
  return round.paths.map((path, index) => {
    const ordinal = occupied[path.k]++;
    return {
      id: path.id,
      index,
      k: path.k,
      x: layout.slotX(path.k) + COLUMNS[ordinal % 3] * layout.pitch,
      y: layout.baseline - (Math.floor(ordinal / 3) + 0.5) * layout.pitch,
      r: layout.radius,
    };
  });
}

function sphereSVG(dot: Dot, round: Experiment, selectedId?: string): string {
  const selected = dot.id === selectedId;
  const path = round.paths[dot.index];
  return `<g class="sample-dot${selected ? ' is-selected' : ''}" data-sample-id="${escape(dot.id)}" data-index="${dot.index}" data-slot="${dot.k}">
<title>Ball ${dot.index + 1}; endpoint ${dot.k}; ${path.directions.join(' ')}</title>
<ellipse cx="${q(dot.x + dot.r * 0.26)}" cy="${q(dot.y + dot.r * 0.7)}" rx="${q(dot.r * 1.06)}" ry="${q(dot.r * 0.48)}" fill="#382A20" opacity="0.16"/>
${selected ? `<circle cx="${q(dot.x)}" cy="${q(dot.y)}" r="${q(dot.r + Math.max(1.8, dot.r * 0.22))}" fill="none" stroke="#252827" stroke-width="${q(Math.max(1, dot.r * 0.14))}"/>` : ''}
<circle cx="${q(dot.x)}" cy="${q(dot.y)}" r="${q(dot.r)}" fill="url(#ball)" stroke="#A8421E" stroke-opacity="0.22" stroke-width="${q(Math.max(0.3, dot.r * 0.035))}"/>
</g>`;
}

/**
 * SVG fragment in the 1000×900 shared stage. Provide #ball, #tray and
 * #soft-shadow in the owner's defs. Main title is 30 units above the box;
 * endpoint labels end 48 units below its baseline. Keep those margins clear.
 */
export function traySVG(round: Experiment, options: TrayOptions): string {
  const { x, y, width, height, label = '', selectedId, showTheory = true, omitDots = false } = options;
  const layout = geometry(round, options, options.maxCount);
  const expected = expectedCounts(round.n, round.p, round.N);
  const dots = omitDots ? [] : dotLayout(round, options, options.maxCount);
  const opacity = Math.max(0, Math.min(1, options.opacity ?? 1));
  const { baseline, laneWidth, slotX, countY } = layout;
  const frontDepth = Math.min(28, Math.max(18, width * 0.03));
  const rimHeight = Math.min(25, Math.max(12, width * 0.03));
  const floorTop = baseline - rimHeight;
  const axisStep = Math.max(3, Math.ceil(layout.capacity / 12) * 3);
  const ticks: string[] = [];
  for (let count = 0; count <= layout.capacity; count += axisStep) {
    ticks.push(`<g class="count-tick"><line x1="${q(x - 5)}" y1="${q(countY(count))}" x2="${q(x)}" y2="${q(countY(count))}" stroke="#81877B" stroke-width="1"/><text x="${q(x - 10)}" y="${q(countY(count) + 4)}" text-anchor="end" fill="#656C60" font-size="11">${count}</text></g>`);
  }
  const lanes = round.counts.map((count, k) => {
    const start = x + k * laneWidth;
    const wallX = start + laneWidth - 2.3;
    return `<g data-tray-slot="${k}" data-observed="${count}">
<rect x="${q(start + 3)}" y="${q(floorTop + 4)}" width="${q(Math.max(0.5, laneWidth - 6))}" height="${q(rimHeight - 2)}" rx="2" fill="#183A91"/>
<path d="M${q(start + 3)} ${q(floorTop + 4)} H${q(wallX - 2)}" fill="none" stroke="#6680CF" stroke-opacity="0.55" stroke-width="1"/>
<path d="M${q(wallX)} ${q(floorTop)} V${q(baseline + 4)}" fill="none" stroke="#5576CF" stroke-width="3.5"/>
<text x="${q(slotX(k))}" y="${q(baseline + frontDepth * 0.68)}" text-anchor="middle" fill="#F2EDDF" font-size="${q(Math.min(16, laneWidth * 0.3))}" font-weight="600">${count}</text>
<text x="${q(slotX(k))}" y="${q(baseline + frontDepth + 20)}" text-anchor="middle" fill="#5D635B" font-size="12">${k}</text>
</g>`;
  }).join('');
  const theory = showTheory ? `<g class="expected-outline" data-units="expected number of balls">
<polyline points="${expected.map((count, k) => `${q(slotX(k))},${q(countY(count))}`).join(' ')}" fill="none" stroke="#6D866F" stroke-width="2" stroke-dasharray="6 5" stroke-linejoin="round"/>
${expected.map((count, k) => `<circle data-expected-slot="${k}" data-expected="${count}" cx="${q(slotX(k))}" cy="${q(countY(count))}" r="2.5" fill="#F2EDDF" stroke="#6D866F" stroke-width="1.5"/>`).join('')}
</g>` : '';
  return `<g class="sample-tray" data-N="${round.N}" data-scale-max="${layout.capacity}" data-units="number of balls" opacity="${q(opacity)}" role="img" aria-label="${escape(`${label ? `${label}. ` : ''}${round.N} observed balls; ${round.n + 1} endpoints. Three balls per row.${showTheory ? ' Dashed line: expected number of balls.' : ''}`)}">
${label ? `<text x="${q(x)}" y="${q(y - 31)}" fill="#252827" font-size="17" font-weight="600">${escape(label)}</text>` : ''}
<text x="${q(x)}" y="${q(y - 11)}" fill="#656C60" font-size="11">Number of balls · 3 per row</text>
${showTheory ? `<text x="${q(x + width)}" y="${q(y - 11)}" fill="#5A725D" text-anchor="end" font-size="11">Expected — dashed</text>` : ''}
${ticks.join('')}
<g class="tray-plinth" filter="url(#soft-shadow)">
<rect x="${q(x - 4)}" y="${q(floorTop - 1)}" width="${q(width + 8)}" height="${q(rimHeight + frontDepth + 1)}" rx="4" fill="#163581"/>
<rect x="${q(x - 4)}" y="${q(floorTop - 1)}" width="${q(width + 8)}" height="${q(rimHeight + 5)}" rx="4" fill="url(#tray)"/>
<path d="M${q(x - 2)} ${q(baseline + 4)} H${q(x + width + 2)}" stroke="#5D7AD0" stroke-opacity="0.6" stroke-width="1"/>
</g>${lanes}${theory}${dots.map(dot => sphereSVG(dot, round, selectedId)).join('')}
</g>`;
}

/**
 * Observed bars and expected outline share an explicitly labelled count axis.
 * omitBars retains that axis, endpoint labels, theory and summary, while the
 * transition owner renders the sole observed bars and their numeric labels.
 */
export function histogramSVG(round: Experiment, options: HistogramOptions): string {
  inspectBox(options);
  const { x, y, width, height, label = 'This round', omitBars = false } = options;
  const expected = expectedCounts(round.n, round.p, round.N);
  const maximum = Math.max(1, ...round.counts, ...expected);
  const step = Math.max(1, Math.ceil(maximum / 4));
  const ceiling = step * 4;
  const baseline = y + height;
  const laneWidth = width / (round.n + 1);
  const barWidth = Math.min(52, laneWidth * 0.6);
  const slotX = (k: number) => x + (k + 0.5) * laneWidth;
  const countY = (count: number) => baseline - height * count / ceiling;
  const grid = Array.from({ length: 5 }, (_, i) => {
    const count = step * i;
    return `<line x1="${q(x)}" y1="${q(countY(count))}" x2="${q(x + width)}" y2="${q(countY(count))}" stroke="#252827" stroke-opacity="${i === 0 ? '0.26' : '0.1'}"/><text x="${q(x - 12)}" y="${q(countY(count) + 4)}" text-anchor="end" fill="#656C60" font-size="12">${count}</text>`;
  }).join('');
  const bars = round.counts.map((count, k) => `<g data-histogram-slot="${k}" data-observed="${count}" data-expected="${expected[k]}">
${omitBars ? '' : `<rect x="${q(slotX(k) - barWidth / 2 + 3)}" y="${q(countY(count) + 3)}" width="${q(barWidth)}" height="${q(Math.max(0, baseline - countY(count) - 3))}" rx="3" fill="#182E69" opacity="0.12"/>
<rect x="${q(slotX(k) - barWidth / 2)}" y="${q(countY(count))}" width="${q(barWidth)}" height="${q(baseline - countY(count))}" rx="3" fill="${k === round.paths[round.paths.length - 1]?.k ? '#E87942' : 'url(#tray)'}"/>
<text x="${q(slotX(k))}" y="${q(countY(count) - 10)}" text-anchor="middle" fill="#252827" font-size="${q(Math.min(16, laneWidth * 0.35))}" font-weight="600">${count}</text>`}
<text x="${q(slotX(k))}" y="${q(baseline + 24)}" text-anchor="middle" fill="#5D635B" font-size="12">${k}</text>
</g>`).join('');
  return `<g class="round-histogram" data-N="${round.N}" data-scale-max="${ceiling}" data-units="number of balls" role="img" aria-label="${escape(`${label}. ${round.N} balls. ${omitBars ? '' : 'Solid bars: observed counts. '}Dashed line: expected counts. ${round.n + 1} endpoints.`)}">
<text x="${q(x)}" y="${q(y - 38)}" fill="#252827" font-size="20" font-weight="600">${escape(label)}</text>
<text x="${q(x)}" y="${q(y - 15)}" fill="#656C60" font-size="12">Number of balls</text>
<text x="${q(x + width)}" y="${q(y - 15)}" text-anchor="end" fill="#5A725D" font-size="12">${round.N} observed · expected — dashed</text>
${grid}${bars}
<polyline points="${expected.map((count, k) => `${q(slotX(k))},${q(countY(count))}`).join(' ')}" fill="none" stroke="#6D866F" stroke-width="2.5" stroke-dasharray="7 5" stroke-linejoin="round"/>
${expected.map((count, k) => `<circle cx="${q(slotX(k))}" cy="${q(countY(count))}" r="3.2" fill="#F2EDDF" stroke="#6D866F" stroke-width="1.8"/>`).join('')}
<text x="${q(x + width / 2)}" y="${q(baseline + 49)}" text-anchor="middle" fill="#656C60" font-size="12">Endpoint — number of right turns</text>
</g>`;
}

/**
 * Canvas owns ONLY sphere pixels. The owner places it directly over a shared
 * 1000×900 SVG with traySVG({omitDots:true}); no duplicated balls at handoff.
 * Calls do not schedule animation, sample data, or attach listeners.
 * Throws on missing 2D context so the owner can retain its complete SVG view.
 */
export function paintPortrait(canvas: HTMLCanvasElement, round: Experiment, options: PortraitOptions): Dot[] {
  const dots = dotLayout(round, options.box, options.maxCount);
  const requestedDpr = options.dpr ?? (typeof window === 'undefined' ? 1 : window.devicePixelRatio);
  const dpr = Math.max(1, Math.min(3, Number.isFinite(requestedDpr) ? requestedDpr : 1));
  const pixelWidth = Math.round(1000 * dpr);
  const pixelHeight = Math.round(900 * dpr);
  if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
  if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas rendering is unavailable; retain the SVG sphere layer.');
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, 1000, 900);
  context.save();
  context.globalAlpha = Math.max(0, Math.min(1, options.opacity ?? 1));
  for (const dot of dots) {
    context.beginPath();
    context.ellipse(dot.x + dot.r * 0.26, dot.y + dot.r * 0.7, dot.r * 1.06, dot.r * 0.48, 0, 0, Math.PI * 2);
    context.fillStyle = 'rgba(56,42,32,0.16)';
    context.fill();
    if (dot.id === options.selectedId) {
      context.beginPath();
      context.arc(dot.x, dot.y, dot.r + Math.max(1.8, dot.r * 0.22), 0, Math.PI * 2);
      context.strokeStyle = '#252827';
      context.lineWidth = Math.max(1, dot.r * 0.14);
      context.stroke();
    }
    const gradient = context.createRadialGradient(dot.x - dot.r * 0.36, dot.y - dot.r * 0.46, 0, dot.x - dot.r * 0.36, dot.y - dot.r * 0.46, dot.r * 1.5);
    gradient.addColorStop(0, '#F9AA70');
    gradient.addColorStop(0.45, '#E87942');
    gradient.addColorStop(1, '#A8421E');
    context.beginPath();
    context.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
    context.fillStyle = gradient;
    context.fill();
    context.strokeStyle = 'rgba(168,66,30,0.22)';
    context.lineWidth = Math.max(0.3, dot.r * 0.035);
    context.stroke();
  }
  context.restore();
  return dots;
}
