export const CHAPTERS = [
  ['the-volume', 'The volume', 'I'], ['sheet', 'Sheet', 'II'],
  ['fold', 'Fold', 'III'], ['gather', 'Gather', 'IV'],
  ['sew', 'Sew', 'V'], ['spine', 'Spine', 'VI'],
  ['marble', 'Marble', 'VII'], ['case', 'Case', 'VIII'],
  ['impression', 'Impression', 'IX'], ['codex', 'Codex', 'X'],
];

export const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
export const mix = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, n) => { const t = clamp((n - a) / (b - a)); return t * t * (3 - 2 * t); };

const PAPER = [238, 233, 221];
const BLACK = [21, 21, 19];
const MARBLE = [36, 42, 35];
const INK = [36, 37, 31];
const LIGHT = [238, 233, 221];
const PALETTE = [BLACK, PAPER, PAPER, PAPER, PAPER, PAPER, MARBLE, PAPER, BLACK, BLACK];
const isDark = (i) => [0, 6, 8, 9].includes(i);

export function sampleTimeline(position) {
  const pos = clamp(position, 0, 9.9999);
  const chapter = Math.floor(pos);
  const progress = pos - chapter;
  const next = Math.min(chapter + 1, 9);
  const handoff = smooth(0.79, 1, progress);
  const fromInk = isDark(chapter) ? LIGHT : INK;
  const toInk = isDark(next) ? LIGHT : INK;
  const fromMuted = isDark(chapter) ? [186, 181, 167] : [101, 98, 88];
  const toMuted = isDark(next) ? [186, 181, 167] : [101, 98, 88];
  const cssColor = (a, b) => `rgb(${a.map((v, i) => Math.round(mix(v, b[i], handoff))).join(' ')})`;
  const ground = PALETTE[chapter].map((v, i) => mix(v, PALETTE[next][i], handoff));
  const marbleAlpha = smooth(-0.18, 0.01, pos - 6) * (1 - smooth(0.87, 1.03, pos - 6));
  const effectiveGround = ground.map((v, i) => mix(v, MARBLE[i], marbleAlpha));
  const linear = value => { const c = value / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const luminance = effectiveGround.map(linear).reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
  // Fixed navigation never fades through the same gray as its background.
  const uiInk = luminance > 0.42 ? '#24251f' : luminance > 0.179 ? '#000000' : luminance > 0.09 ? '#ffffff' : '#eee9dd';
  return {
    position: pos, chapter, progress, handoff,
    background: cssColor(PALETTE[chapter], PALETTE[next]),
    ink: cssColor(fromInk, toInk), muted: cssColor(fromMuted, toMuted),
    uiInk,
    total: clamp(pos / 9.9999),
  };
}

export function copyOpacity(position, index) {
  const p = position - index;
  if (index === 9 && p >= 0) return 1;
  return smooth(-0.08, 0.04, p) * (1 - smooth(0.72, 0.91, p));
}
