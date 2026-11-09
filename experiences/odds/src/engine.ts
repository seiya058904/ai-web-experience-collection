/**
 * ODDS — deterministic, ideal independent-branch model.
 * Animation never chooses outcomes. The same seed and rules replay the same
 * finite pseudo-random sequence; this is neither measured collision physics
 * nor a cryptographically secure source of random outcomes.
 *
 * Model: https://www.itl.nist.gov/div898/handbook/eda/section3/eda366i.htm
 * Independence: https://online.stat.psu.edu/stat504/Lesson01
 */
export type Direction = 'L' | 'R';
export interface SamplePath { id: string; directions: Direction[]; k: number }
export interface Experiment {
  seed: string;
  n: number;
  p: number;
  N: number;
  paths: SamplePath[];
  counts: number[];
}

const MAX_N = 10_000;
const MAX_LAYERS = 32;
const MAX_ENUMERATION_LAYERS = 16;

function assertLayers(n: number, max = MAX_LAYERS): void {
  if (!Number.isInteger(n) || n < 1 || n > max) {
    throw new RangeError(`The number of layers must be an integer from 1 to ${max}.`);
  }
}
function assertProbability(p: number): void {
  if (!Number.isFinite(p) || p < 0 || p > 1) {
    throw new RangeError('The probability of a right turn must be from 0 to 1.');
  }
}
function assertCount(N: number): void {
  if (!Number.isInteger(N) || N < 0 || N > MAX_N) {
    throw new RangeError(`The sample count must be an integer from 0 to ${MAX_N}.`);
  }
}
function assertSeed(seed: string): void {
  if (typeof seed !== 'string' || seed.length < 1 || seed.length > 256 || /[\u0000-\u001f\u007f-\u009f]/u.test(seed)) {
    throw new TypeError('The seed must contain 1 to 256 printable characters.');
  }
}

/** FNV-1a-derived 32-bit string seed, followed by Mulberry32. */
function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}
function randomStream(seed: string): () => number {
  let state = hashSeed(seed);
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function identityPrefix(seed: string, n: number, p: number): string {
  return `odds-${hashSeed(JSON.stringify([seed, n, p])).toString(16).padStart(8, '0')}`;
}

export function createExperiment(seed: string, n: number, p: number, N: number): Experiment {
  assertSeed(seed);
  assertLayers(n);
  assertProbability(p);
  assertCount(N);
  const random = randomStream(seed);
  const prefix = identityPrefix(seed, n, p);
  const paths: SamplePath[] = [];
  const counts = Array<number>(n + 1).fill(0);
  for (let index = 0; index < N; index++) {
    const directions: Direction[] = [];
    let k = 0;
    for (let layer = 0; layer < n; layer++) {
      const right = random() < p;
      directions.push(right ? 'R' : 'L');
      if (right) k++;
    }
    paths.push({ id: `${prefix}-${String(index + 1).padStart(5, '0')}`, directions, k });
    counts[k]++;
  }
  return { seed, n, p, N, paths, counts };
}

/** Derive a prefix of the same stream. Increasing N safely extends that stream. */
export function prefixExperiment(round: Experiment, N: number): Experiment {
  if (!validateExperiment(round)) throw new TypeError('This saved experiment is not valid.');
  return createExperiment(round.seed, round.n, round.p, N);
}

export function appendExperiment(round: Experiment, extra = 1): Experiment {
  if (!Number.isInteger(extra) || extra < 0) throw new RangeError('The added sample count must be a non-negative integer.');
  return prefixExperiment(round, round.N + extra);
}

export function enumeratePaths(n: number): SamplePath[] {
  assertLayers(n, MAX_ENUMERATION_LAYERS);
  return Array.from({ length: 2 ** n }, (_, index) => {
    const directions: Direction[] = [];
    let k = 0;
    for (let layer = n - 1; layer >= 0; layer--) {
      const right = ((index >>> layer) & 1) === 1;
      directions.push(right ? 'R' : 'L');
      if (right) k++;
    }
    return { id: `route-${n}-${String(index + 1).padStart(5, '0')}`, directions, k };
  });
}

export function binomialCoefficients(n: number): number[] {
  assertLayers(n);
  const row = [1];
  for (let k = 1; k <= n; k++) row.push(Math.round(row[k - 1] * (n - k + 1) / k));
  return row;
}

export function probabilities(n: number, p: number): number[] {
  assertLayers(n);
  assertProbability(p);
  if (p === 0) return Array.from({ length: n + 1 }, (_, k) => k === 0 ? 1 : 0);
  if (p === 1) return Array.from({ length: n + 1 }, (_, k) => k === n ? 1 : 0);
  return binomialCoefficients(n).map((coefficient, k) => coefficient * p ** k * (1 - p) ** (n - k));
}

export function expectedCounts(n: number, p: number, N: number): number[] {
  assertCount(N);
  return probabilities(n, p).map(probability => N * probability);
}

/** Only the seed is newly chosen. Outcomes always come from the saved PRNG. */
export function freshSeed(): string {
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    return `odds-${Array.from(globalThis.crypto.getRandomValues(new Uint32Array(2)), value => value.toString(16).padStart(8, '0')).join('')}`;
  }
  return `odds-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Rejects malformed, edited, and inconsistent saved data; never silently repairs it. */
export function validateExperiment(value: unknown): value is Experiment {
  try {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    const candidate = value as Experiment;
    assertSeed(candidate.seed);
    assertLayers(candidate.n);
    assertProbability(candidate.p);
    assertCount(candidate.N);
    if (!Array.isArray(candidate.paths) || candidate.paths.length !== candidate.N ||
        !Array.isArray(candidate.counts) || candidate.counts.length !== candidate.n + 1) return false;
    const replay = createExperiment(candidate.seed, candidate.n, candidate.p, candidate.N);
    for (let k = 0; k <= candidate.n; k++) {
      if (candidate.counts[k] !== replay.counts[k]) return false;
    }
    for (let index = 0; index < candidate.N; index++) {
      const path = candidate.paths[index];
      const exact = replay.paths[index];
      if (typeof path !== 'object' || path === null || path.id !== exact.id || path.k !== exact.k ||
          !Array.isArray(path.directions) || path.directions.length !== candidate.n) return false;
      for (let layer = 0; layer < candidate.n; layer++) {
        if (path.directions[layer] !== exact.directions[layer]) return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

function xml(value: string | number): string {
  return String(value).toWellFormed().replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[character]!));
}
function decimal(value: number): string {
  return Number(value.toFixed(4)).toString();
}

/** Self-contained original artwork. All plotted heights use the same ball-count axis. */
export function experimentSVG(round: Experiment): string {
  if (!validateExperiment(round)) throw new TypeError('Only a valid current experiment can be exported.');
  const expected = expectedCounts(round.n, round.p, round.N);
  const probability = probabilities(round.n, round.p);
  const width = Math.max(1200, (round.n + 1) * 65 + 180);
  const height = 1070;
  const left = 100;
  const plotWidth = width - 180;
  const baseline = 620;
  const plotHeight = 300;
  const scaleTop = Math.max(5, Math.ceil(Math.max(...round.counts, ...expected) / 5) * 5);
  const cell = plotWidth / (round.n + 1);
  const barWidth = Math.min(54, cell * 0.54);
  const x = (k: number) => left + (k + 0.5) * cell;
  const y = (count: number) => baseline - count / scaleTop * plotHeight;
  const grid = Array.from({ length: 6 }, (_, i) => {
    const value = scaleTop * i / 5;
    return `<line x1="${left}" y1="${y(value)}" x2="${left + plotWidth}" y2="${y(value)}" stroke="#252827" stroke-opacity="0.12"/><text x="${left - 18}" y="${y(value) + 5}" text-anchor="end" font-size="15">${decimal(value)}</text>`;
  }).join('');
  const bars = round.counts.map((count, k) => `<g data-slot="${k}" data-observed="${count}" data-expected="${expected[k]}"><rect x="${x(k) - barWidth / 2}" y="${y(count)}" width="${barWidth}" height="${baseline - y(count)}" rx="5" fill="#244AB8"/><text x="${x(k)}" y="${y(count) - 13}" text-anchor="middle" font-size="19" font-weight="700">${count}</text><text x="${x(k)}" y="${baseline + 27}" text-anchor="middle" font-size="16">${k}</text></g>`).join('');
  const expectedPoints = expected.map((count, k) => `${x(k)},${y(count)}`).join(' ');
  const expectedMarkers = expected.map((count, k) => `<circle cx="${x(k)}" cy="${y(count)}" r="5" fill="#F2EDDF" stroke="#607A63" stroke-width="2"/>`).join('');
  const rows = round.counts.map((count, k) => `<text x="${x(k)}" y="756" text-anchor="middle" font-size="16">${count}</text><text x="${x(k)}" y="788" text-anchor="middle" font-size="14" fill="#506652">${decimal(expected[k])}</text><text x="${x(k)}" y="820" text-anchor="middle" font-size="13">${decimal(probability[k] * 100)}%</text><text x="${x(k)}" y="852" text-anchor="middle" font-size="13">${decimal(round.N ? count / round.N * 100 : 0)}%</text>`).join('');
  const seedChunks = Array.from(round.seed.matchAll(/.{1,100}/gu), match => match[0]);
  const seedLines = seedChunks.map((part, index) => `<text x="60" y="${223 + index * 19}" font-size="13" fill="#5D625B">${index === 0 ? 'Seed: ' : ''}${xml(part)}</text>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description" lang="en">
<title id="title">ODDS — your experiment, ${round.N} balls</title>
<desc id="description">An ideal independent-branch model, generated with a replayable pseudorandom sequence. n=${round.n}; p=${round.p}; N=${round.N}; seed=${xml(round.seed)}. Observed counts, by number of right turns: ${round.counts.join(', ')}. Expected counts: ${expected.map(decimal).join(', ')}. Expected counts are not guaranteed results.</desc>
<metadata>${xml(JSON.stringify({ model: 'ideal independent Bernoulli branches; replayable pseudorandom sampling', version: 1, seed: round.seed, n: round.n, p: round.p, N: round.N, counts: round.counts, expected }))}</metadata>
<rect width="${width}" height="${height}" fill="#F2EDDF"/>
<g font-family="Arial, Helvetica, sans-serif" fill="#252827">
<text x="60" y="77" font-size="28" font-weight="800" letter-spacing="-1">ODDS</text><circle cx="153" cy="66" r="8" fill="#E87942"/>
<text x="60" y="145" font-size="46" font-weight="700" letter-spacing="-1.8">Every chance leaves a place.</text>
<text x="60" y="189" font-size="20">${round.n} layers · ${xml(round.p)} chance of a right turn · ${round.N} balls</text>
${seedLines}
<text x="${left}" y="294" font-size="14">Number of balls</text>
<rect x="${width - 390}" y="278" width="15" height="15" rx="3" fill="#244AB8"/><text x="${width - 366}" y="291" font-size="14">Observed</text><line x1="${width - 246}" y1="286" x2="${width - 214}" y2="286" stroke="#607A63" stroke-width="3" stroke-dasharray="6 4"/><text x="${width - 203}" y="291" font-size="14">Expected</text>
${grid}${bars}<polyline points="${expectedPoints}" fill="none" stroke="#607A63" stroke-width="3" stroke-dasharray="8 6"/>${expectedMarkers}
<text x="${left + plotWidth / 2}" y="677" text-anchor="middle" font-size="17">Endpoint k — number of right turns</text>
<line x1="60" y1="713" x2="${width - 60}" y2="713" stroke="#252827" stroke-opacity="0.18"/>
<text x="10" y="756" font-size="12">Observed</text><text x="10" y="788" font-size="12">Expected</text><text x="10" y="820" font-size="12">Theory %</text><text x="10" y="852" font-size="12">Round %</text>${rows}
<text x="60" y="915" font-size="16">Expected count = N × C(n,k) × p^k × (1−p)^(n−k). Values in the table are rounded to four decimal places.</text>
<text x="60" y="951" font-size="16">An ideal independent probability model, using replayable pseudorandom sampling.</text>
<text x="60" y="978" font-size="16">These are simulated outcomes, not measured collisions. The next ball is not promised a destination.</text>
<text x="60" y="1027" font-size="13" fill="#5D625B">Mathematical reference: NIST/SEMATECH e-Handbook — Binomial Distribution</text>
</g></svg>`;
}
