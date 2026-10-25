import { clamp, mix, smoothstep } from './field';

/** One reversible progress value. These boundaries are also in the Visual Bible. */
export const HANDOFFS = [[.10, .24], [.35, .48], [.60, .72], [.84, .97]] as const;
export const STOPS = [0, .28, .53, .77, 1] as const;
export const CHAPTERS = [
  ['opening', 'The weight of air'], ['airflow', 'What keeps it alive'],
  ['section', 'A section through the sky'], ['wind', 'A change in the wind'],
  ['still', 'Still moving'],
] as const;

export function evaluateStory(progress: number, reduced = false) {
  const raw = clamp(progress);
  let active = 0;
  HANDOFFS.forEach(([a, b], i) => { if (raw >= (a + b) / 2) active = i + 1; });
  const p = reduced ? STOPS[active] : raw;
  const weights = CHAPTERS.map((_, i) => {
    let w = 1;
    if (i > 0) { const [a, b] = HANDOFFS[i - 1]; w *= smoothstep(mix(a, b, i===4?.80:.54), b, p); }
    if (i < 4) { const [a, b] = HANDOFFS[i]; w *= 1 - smoothstep(a, mix(a, b, .46), p); }
    return w;
  });
  const approach = smoothstep(.10, .24, p);
  const interior = smoothstep(.35, .48, p) * (1 - smoothstep(.84, .96, p));
  const finale = smoothstep(.84, .97, p);
  return {
    p, raw, active, weights, interior, finale,
    flow: smoothstep(.13, .24, p) * (1 - smoothstep(.36, .47, p)),
    flowLabels: smoothstep(.13, .24, p) * (1 - smoothstep(.35, .415, p)),
    shear: smoothstep(.60, .72, p) * (1 - smoothstep(.84, .90, p)),
    scale: 1 + approach * .035 - finale * .026,
    shiftX: -interior * .055,
    shiftY: -approach * .004 + finale * .004,
    plane: smoothstep(.35, .46, p) * (1 - smoothstep(.86, .95, p)),
    detach: smoothstep(.39, .48, p) * (1 - smoothstep(.84, .94, p)),
  };
}
export type Story = ReturnType<typeof evaluateStory>;
