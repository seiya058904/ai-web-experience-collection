/** The sky and distant floor meet in the same linear-light field. */
export const atmosphereGLSL = `
  vec3 sampleAtmosphere(vec2 uv, float darkness, vec3 pale, vec3 night,
                        vec3 silver, vec3 dayWhite) {
    float height = smoothstep(.36, 1., uv.y);
    float aperture = uv.x - uv.y * .49 - .31;
    float windowLight = smoothstep(-.03, .04, aperture);
    vec3 daylight = mix(silver, dayWhite, windowLight);
    daylight *= 1. - exp(-abs(aperture + .035) * 24.) * .18;
    vec3 color = mix(pale, daylight, height * .82);
    return mix(color, night * (.80 + .35 * uv.y), darkness);
  }
`;
