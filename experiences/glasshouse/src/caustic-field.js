/**
 * Original, fragment-only GLSL for a small patch of focused optical light.
 *
 * Inject this string once, before the shader's main(), then call:
 *   float light = glassCaustic(localLightCoordinates, timeInSeconds);
 *
 * Coordinates are material-local, not screen UVs. The useful support is an
 * ellipse around the origin, roughly x = -3.3…3.3, y = -2.6…2.6. It fades to
 * exactly zero outside it. A scale of 2.0–3.0 coordinates per world unit gives
 * a restrained patch on a large pane. Move the origin toward the illuminated
 * corner or foot of the pane; do not repeat/tile it over every glass face.
 *
 * The result is LINEAR intensity in [0, 2.2], mostly zero, with fine focused
 * peaks. Suggested additive radiance before tone mapping: result × 0.08…0.30
 * on glass; result × 0.15…0.45 on the floor, with an additional light mask.
 * A nearly neutral vec3(1.0, 0.97, 0.90) gives very pale sunlight. Modulate
 * this contribution by the chapter, incidence, and actual lit region.
 *
 * A catastrophe-style cusp supplies two converging folds and a focus. Three
 * differently oriented, locally warped cusps make open irregular branches;
 * this is an art-directed caustic approximation, not ray-traced illumination.
 * No texture, Voronoi cells, loop, extra uniform, or high-frequency animation
 * is required. fwidth provides a small screen-footprint antialiasing filter.
 */
export const glassCausticGLSL = /* glsl */`
#ifndef GLASSHOUSE_CAUSTIC_FIELD
#define GLASSHOUSE_CAUSTIC_FIELD

float ghcHash(vec2 p) {
  vec3 h = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  h += dot(h, h.yzx + 33.33);
  return fract((h.x + h.y) * h.z);
}

float ghcNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 s = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(ghcHash(i), ghcHash(i + vec2(1.0, 0.0)), s.x),
    mix(ghcHash(i + vec2(0.0, 1.0)), ghcHash(i + vec2(1.0)), s.x),
    s.y
  );
}

float ghcCusp(vec2 q, float pixel, float focusBias) {
  // y² = a·x³ is an open fold pair converging at a cusp. Dividing its
  // implicit field by the gradient approximates material-space distance.
  float x = max(q.x, 0.0);
  float x2 = x * x;
  float implicitField = q.y * q.y - 0.72 * x2 * x;
  float gradient = sqrt(4.6656 * x2 * x2 + 4.0 * q.y * q.y + 0.0015);
  float distanceToFold = abs(implicitField) / gradient;

  float width = 0.011 + 0.009 * smoothstep(0.0, 1.8, x);
  float coreDistance = distanceToFold / (width + pixel);
  float haloDistance = distanceToFold / (width * 4.8 + pixel);
  float core = exp2(-1.70 * coreDistance * coreDistance);
  float skirt = 0.095 * exp2(-1.25 * haloDistance * haloDistance);

  // The focus has a small area, not a hard point or a decorative star flare.
  vec2 focalPosition = q * vec2(6.2, 8.8);
  float focus = exp2(-dot(focalPosition, focalPosition)) * focusBias;
  float start = smoothstep(-0.075, 0.10, q.x);
  float end = 1.0 - smoothstep(0.85, 1.92, x);
  float concentration = 1.0 / (0.84 + x * 0.36);
  return (core + skirt) * start * end * concentration + focus;
}

float glassCaustic(vec2 p, float time) {
  // Compute derivatives before varying masks. Time progresses gently in the
  // noise field, so a hold breathes without the lines swimming like water.
  float pixel = clamp(length(fwidth(p)) * 0.38, 0.0015, 0.07);
  vec2 ellipse = p * vec2(0.78, 1.0);
  float envelope = 1.0 - smoothstep(1.40, 2.55, length(ellipse));
  float drift = time * 0.012;
  vec2 warp = vec2(
    ghcNoise(p * 1.73 + vec2(2.73 + drift, 7.19)),
    ghcNoise(p * 1.61 + vec2(13.47, 3.62 - drift * 0.73))
  ) - 0.5;
  vec2 q = p + warp * 0.64;

  vec2 first = mat2(0.858, -0.514, 0.514, 0.858)
    * (q - vec2(-1.05, 0.25));
  vec2 second = mat2(-0.416, 0.909, -0.909, -0.416)
    * (q - vec2(0.71, -0.69)) * 1.09;
  vec2 third = mat2(0.219, 0.976, -0.976, 0.219)
    * (q - vec2(0.58, 1.17)) * 1.31;

  float a = ghcCusp(first, pixel, 0.32);
  float b = ghcCusp(second, pixel * 1.09, 0.22) * 0.76;
  float c = ghcCusp(third, pixel * 1.31, 0.18) * 0.46;

  // Slow spatial focus variation breaks the remaining continuity. Keep the
  // envelope external to the sum, avoiding a rectangular texture boundary.
  float interrupted = smoothstep(0.16, 0.61,
    ghcNoise(q * 1.61 + vec2(19.3, 6.7) + drift * 0.23));
  float light = (a + b + c) * mix(0.20, 1.0, interrupted);
  return clamp(light * envelope, 0.0, 2.2);
}

#endif
`;

export default glassCausticGLSL;
