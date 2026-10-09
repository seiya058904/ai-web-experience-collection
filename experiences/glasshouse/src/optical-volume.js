/** The original closed solids share these dimensions with their optical hulls. */
export const PRISM = Object.freeze({ halfWidth: 2.42, bottom: -2.2, top: 3.1, halfDepth: .6 });

export const PANE_PLANES = Object.freeze([
  [1, 0, 0, 1.5], [-1, 0, 0, 1.5], [0, 1, 0, 2.5],
  [0, -1, 0, 2.5], [0, 0, 1, .13], [0, 0, -1, .13]
].map(Object.freeze));

/**
 * Supporting planes of the actual bevelled prism vertices. The finite convex
 * hull is an optical approximation of its rounded edges, not an SDF/ray tracer.
 */
export function prismHullPlanes(positions) {
  const height = PRISM.top - PRISM.bottom;
  const normals = [[height, PRISM.halfWidth, 0], [-height, PRISM.halfWidth, 0],
    [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  return normals.map(normal => {
    let support = -Infinity;
    for (let i = 0; i < positions.length; i += 3) {
      support = Math.max(support, normal[0] * positions[i]
        + normal[1] * positions[i + 1] + normal[2] * positions[i + 2]);
    }
    return [...normal, support + .00001];
  });
}

/**
 * A choreographed light path with both ports attached to the same real facets.
 * It describes participating air for this installation, not exact multi-bounce
 * prism optics. The material's screen-space refraction remains a separate pass.
 */
export function prismBeamPorts(angle, sideSupport) {
  const radians = Math.max(-50, Math.min(50, Number.isFinite(angle) ? angle : 0)) * Math.PI / 180;
  const entryY = .80 + Math.sin(radians) * .22;
  const exitY = .30 - Math.sin(radians) * .18;
  const height = PRISM.top - PRISM.bottom;
  return {
    entry: [-(sideSupport - PRISM.halfWidth * entryY) / height, entryY, .28],
    exit: [(sideSupport - PRISM.halfWidth * exitY) / height, exitY, .28]
  };
}

export const finiteOpticPathGLSL = /* glsl */`
  float glassExitDistance(vec3 origin, vec3 localRay, out vec3 exitNormal) {
    float distance = 24.0;
    float secondDistance = 10000.0;
    vec3 firstNormal = vec3(0.0, 0.0, 1.0);
    vec3 secondNormal = firstNormal;
    for (int face = 0; face < 6; face++) {
      if (face >= uOpticPlaneCount) break;
      vec4 plane = uOpticPlanes[face];
      float outward = dot(plane.xyz, localRay);
      if (outward > .000001) {
        float crossing = max(0.0, plane.w - dot(plane.xyz, origin)) / outward;
        vec3 boundaryNormal = normalize(plane.xyz);
        if (crossing < distance) {
          secondDistance = distance;
          secondNormal = firstNormal;
          distance = crossing;
          firstNormal = boundaryNormal;
        } else if (crossing < secondDistance) {
          secondDistance = crossing;
          secondNormal = boundaryNormal;
        }
      }
    }
    // The visible solid has rounded cuts. Blend adjacent hull normals over a
    // narrow world-distance interval instead of snapping at a support-plane tie.
    float corner = 0.5 * (1.0 - smoothstep(0.0, 0.05, secondDistance - distance));
    exitNormal = normalize(mix(firstNormal, secondNormal, corner));
    return clamp(distance, 0.0, 24.0);
  }
`;
