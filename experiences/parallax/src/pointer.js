/** Keep the authored 60 Hz response while using the existing RAF's elapsed time. */
export function pointerResponse(deltaMs) {
  const elapsed = Number.isFinite(deltaMs) ? Math.max(0, Math.min(50, deltaMs)) : 0;
  return 1 - Math.pow(1 - .135, elapsed / (1000 / 60));
}
