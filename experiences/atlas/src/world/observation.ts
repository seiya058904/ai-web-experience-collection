/**
 * Late, authored change of observing scale, around the unchanged geographic
 * origin. The earlier landscape and the route retain the complete dataset.
 * Reconstruction of the reviewed refinement after transient workspace loss.
 */
export function observationRadius(progress: number, baseSpan: number): number {
  if (progress < 0.815 || !Number.isFinite(baseSpan) || baseSpan <= 1) return 50;
  const t = Math.min(1, Math.max(0, Math.log(baseSpan) / Math.log(5)));
  const eased = t * t * t * (t * (6 * t - 15) + 10);
  return 50 + (10.9 - 50) * eased;
}

/** Fragment-only field. All feathering is inside the stated world radius. */
export const observationFragment = /* glsl */ `
uniform float uObservationRadius;
float observationExposure(vec2 groundPosition){
  float radius=length(groundPosition);
  float feather=max(uObservationRadius*0.035,fwidth(radius)*1.5);
  return 1.0-smoothstep(uObservationRadius-feather,uObservationRadius,radius);
}`;
