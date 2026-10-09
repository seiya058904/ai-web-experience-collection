import type { Design } from './scenes.ts';
import { mix, range, smooth } from './math.ts';
import { gridAdvanceEm } from './type-metrics.ts';

// Metrics from the three unchanged local fonts (cap height / units per em).
// Roboto Flex MVAR leaves its cap height invariant across these four axes.
const CAPS = [1456 / 2048, .720, .698];
const ASCENT_MINUS_DESCENT = [1400 / 2048, .680, .750];

/** Change typographic rules at a readable, proportionate proof size. */
export function transitionType(d: Design, a: Design, b: Design, t: number): Design {
  if (t <= 0 || t >= 1) return d;
  const envelope = smooth(range(.16, .38, t)) * (1 - smooth(range(.62, .86, t)));
  const { w: W, h: H, mobile } = d.viewport;
  for (const key of ['title', 'number'] as const) {
    const from = a.parts[key], to = b.parts[key], p = d.parts[key];
    if (from.family === to.family) continue;
    const authoredSize = p.size;
    const capLimit = key === 'title' ? Math.min(W * .125, H * .21, mobile ? 64 : 160) : Math.min(W * .055, H * .08, 52);
    const cap = Math.min(capLimit, from.size * CAPS[from.family], to.size * CAPS[to.family], authoredSize * Math.min(CAPS[from.family], CAPS[to.family]));
    const advance = key === 'title'
      ? p.family === 0 ? gridAdvanceEm(d.axes, p.tracking) : (p.family === 1 ? 1.813 : 2.4) + 4 * p.tracking
      : (p.family === 1 ? .893 : p.family === 2 ? 1.2 : 1.35) + 2 * p.tracking;
    const width = key === 'title' ? Math.min(W * .68, W - p.x - 8) : Math.max(24, p.w);
    const proofSize = Math.min(cap / CAPS[p.family], width / Math.max(.25, advance));
    p.size = mix(authoredSize, proofSize, envelope);
    // Hold the visible capital's top through the discrete family exchange.
    // Neither axis is flattened, and the same semantic node stays present.
    const inkTop = p.leading / 2 + ASCENT_MINUS_DESCENT[p.family] / 2 - CAPS[p.family];
    p.y += envelope * (proofSize * CAPS[p.family] * .058 - proofSize * inkTop);
  }
  return d;
}
