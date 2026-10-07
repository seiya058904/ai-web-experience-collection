// WebGL 1 / GLSL ES 1.00. A single composite pass plus optional split surfaces.
export const vertexSource = `
precision highp float;
attribute vec2 aPosition;
attribute float aSide;
attribute float aDistance;
attribute vec2 aSeamNormal;
attribute float aHeight;
attribute vec2 aNormal;
uniform float uMeshPass;
uniform vec4 uCoverA;
uniform float uZoom;
uniform vec2 uCamera;
uniform float uSplit;
uniform float uRelief;
uniform vec2 uPointer;
varying vec2 vUv;
varying vec3 vNormal;
varying float vRim;
void main() {
  vec2 screen = aPosition;
  vNormal = vec3(0.0, 0.0, 1.0);
  vRim = 0.0;
  if (uMeshPass > 0.5) {
    screen = ((aPosition - uCoverA.zw) / uCoverA.xy - 0.5) * uZoom + 0.5 - uCamera;
    vUv = screen;
    float border = smoothstep(0.0, 0.075, aPosition.x)
      * smoothstep(0.0, 0.075, 1.0 - aPosition.x)
      * smoothstep(0.0, 0.07, aPosition.y)
      * smoothstep(0.0, 0.07, 1.0 - aPosition.y);
    float pressure = exp(-aDistance * 6.0) * border;
    screen += aSeamNormal * aSide * uSplit * 0.0085 * pressure / uCoverA.xy;
    vec2 reliefView = vec2(0.025 + uPointer.x * 0.012, -0.014 + uPointer.y * 0.006);
    screen += aHeight * uRelief * reliefView / uCoverA.xy;
    vNormal = normalize(vec3(aNormal * uRelief * 0.45, 1.0));
    vRim = exp(-aDistance * 150.0) * uSplit * border;
  } else {
    vUv = screen;
  }
  gl_Position = vec4(screen.x * 2.0 - 1.0, 1.0 - screen.y * 2.0, 0.0, 1.0);
}
`;

export const fragmentSource = `
precision highp float;
uniform sampler2D uImageA;
uniform sampler2D uImageB;
uniform sampler2D uSeams;
uniform vec4 uCoverA;
uniform vec4 uCoverB;
uniform vec4 uMaterialA; // retention, cooling-front, flow, pulse
uniform vec4 uMaterialB;
uniform vec4 uTexel; // source A pixel size.xy / source B pixel size.zw
uniform vec2 uModes;
uniform float uMix;
uniform float uTime;
uniform float uMotion;
uniform float uZoom;
uniform vec2 uCamera;
uniform vec2 uPointer;
uniform float uGlass;
uniform float uMeshPass;
uniform float uSurfaceMode;
uniform float uSplit;
uniform float uRelief;
uniform float uQuality;
varying vec2 vUv;
varying vec3 vNormal;
varying float vRim;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
}
float thermalMask(vec3 c) {
  // Colour separation follows the plate's actual incandescent fissures. Neutral
  // ash, white reflections and the black silhouette cannot create orange light.
  float red = smoothstep(0.027, 0.16, c.r - c.b);
  float warm = smoothstep(0.025, 0.14, c.r - c.g * 0.80);
  return red * warm;
}
float coolingHeatMask(sampler2D image, vec2 uv, vec3 colour, vec2 texel,
  float baseMask, bool coolingActive) {
  if (!coolingActive || baseMask >= 0.98) return baseMask;
  float brightness = dot(colour, vec3(0.2126, 0.7152, 0.0722));
  if (brightness <= 0.60 || colour.b - colour.r > 0.012) return baseMask;
  // White-hot centres lose chromatic separation. Require nearby warm evidence;
  // four extra samples are reserved for these bright, weak-mask candidates.
  vec2 reach = texel * 7.0;
  float nearbyWarm = max(
    thermalMask(texture2D(image, uv + vec2(reach.x, 0.0)).rgb),
    thermalMask(texture2D(image, uv - vec2(reach.x, 0.0)).rgb)
  );
  nearbyWarm = max(nearbyWarm, max(
    thermalMask(texture2D(image, uv + vec2(0.0, reach.y)).rgb),
    thermalMask(texture2D(image, uv - vec2(0.0, reach.y)).rgb)
  ));
  float whiteCore = smoothstep(0.07, 0.28, nearbyWarm)
    * smoothstep(0.50, 0.74, brightness);
  return max(baseMask, whiteCore);
}
vec2 plateUV(vec2 screen, vec4 cover) {
  return ((screen + uCamera - 0.5) / uZoom + 0.5) * cover.xy + cover.zw;
}
vec3 plate(sampler2D image, vec2 uv, vec4 settings, float mode, vec2 texel) {
  vec2 sampledUV = clamp(uv, vec2(0.001), vec2(0.999));
  vec3 original = texture2D(image, sampledUV).rgb;
  bool hotPlate = mode < 4.5;
  if (hotPlate) {
    float mask = thermalMask(original);
    if (mask > 0.0001 && settings.z > 0.001 && uMotion > 0.001) {
      // Slow, spatially coherent strain, attached only to hot folds. Not water.
      float phase = uTime * 0.145;
      vec2 drift = vec2(
        sin(uv.y * 11.0 + uv.x * 3.5 - phase),
        cos(uv.x * 8.0 - uv.y * 4.5 - phase * 0.81)
      );
      sampledUV = clamp(uv + drift * (0.0028 * settings.z * uMotion * mask * uQuality), vec2(0.001), vec2(0.999));
      original = texture2D(image, sampledUV).rgb;
      mask = thermalMask(original);
    }
    // Resolve once, after any advection, so sampled white cores cannot fall
    // back to the colour-only mask. At most four neighbour reads per pixel.
    bool coolingActive = settings.x < 0.995 || settings.y > 0.0;
    mask = coolingHeatMask(image, sampledUV, original, texel, mask, coolingActive);
    if (mask < 0.0001) return original;
    float frontCoordinate = uv.x * 0.62 + uv.y * 0.38;
    float geology = (noise(uv * 9.0) - 0.5) * 0.095;
    float microDetail = 0.88;
    if (uQuality > 0.8) {
      geology += (noise(uv * 31.0) - 0.5) * 0.022;
      microDetail = 0.75 + noise(uv * 77.0) * 0.25;
    }
    float skin = smoothstep(frontCoordinate - 0.035, frontCoordinate + 0.035, settings.y + geology);
    float frontEdge = (1.0 - smoothstep(0.006, 0.04, abs(frontCoordinate - settings.y - geology)));
    float retained = settings.x * (1.0 - skin * 0.97);
    float luminance = dot(original, vec3(0.2126, 0.7152, 0.0722));
    float coldDetail = (0.025 + luminance * 0.066) * microDetail;
    vec3 crust = vec3(coldDetail * 0.97, coldDetail, coldDetail * 1.015);
    vec3 colour = mix(original, crust, mask * (1.0 - retained));
    float heartbeat = sin(uTime * 0.77 + uv.y * 4.2) * 0.6
      + sin(uTime * 0.31 + uv.x * 6.0) * 0.4;
    float pulse = settings.w * heartbeat * uMotion * retained;
    colour += original * mask * pulse;
    // The advancing boundary briefly retains heat already present in the plate.
    colour += original * mask * frontEdge * retained * 0.035;
    return max(colour, vec3(0.0));
  }
  if (mode > 4.5 && mode < 6.5 && uGlass > 0.001) {
    float luminance = dot(original, vec3(0.2126, 0.7152, 0.0722));
    vec2 d = uv - vec2(0.72, 0.32);
    float bend = atan(d.y * 1.25, d.x);
    float lightAngle = 1.25 + uPointer.x * 0.35 + uPointer.y * 0.12
      + sin(uTime * 0.17) * 0.025 * uMotion;
    float light = pow(max(0.0, cos(bend - lightAngle)), 12.0);
    float face = smoothstep(0.024, 0.24, luminance) * (1.0 - smoothstep(0.73, 1.0, luminance));
    original += vec3(0.97, 0.99, 1.0) * light * face * uGlass * 0.047;
  }
  if (mode > 6.5 && mode < 7.5 && uMotion > 0.001) {
    // A quiet, travelling reflection crosses only already-bright mineral faces.
    // The ground and grain stay fixed: no noise, displacement or global pulse.
    float luminance = dot(original, vec3(0.2126, 0.7152, 0.0722));
    float mineral = smoothstep(0.24, 0.48, luminance)
      * (1.0 - smoothstep(0.86, 0.98, luminance));
    if (mineral > 0.0001) {
      // The portrait plate places its geological surface below the dark field.
      float portrait = 1.0 - step(1.0, texel.y / texel.x);
      vec2 ground = vec2(uv.x, mix(uv.y, (uv.y - 0.50) * 2.0, portrait));
      float shoulder = ground.x * 0.84 + ground.y * 0.22
        + ground.y * ground.y * 0.045;
      // A 64-second cycle also meets the renderer's 4096-second time wrap.
      float lightTrack = 0.36 + sin(uTime * 0.0981747704) * 0.18;
      float ribbon = 1.0 - smoothstep(0.008, 0.032, abs(shoulder - lightTrack));
      float region = smoothstep(0.05, 0.20, ground.y)
        * (1.0 - smoothstep(0.84, 1.0, ground.y))
        * smoothstep(0.02, 0.12, ground.x)
        * (1.0 - smoothstep(0.66, 0.90, ground.x));
      original += vec3(0.87, 0.93, 1.0) * mineral * ribbon * region * 0.038 * uMotion;
    }
  }
  return original;
}
float curveValue(float mode, vec2 uv) {
  if (mode < 5.0) {
    vec2 encoded = texture2D(uSeams, vec2(clamp(uv.y, 0.0, 1.0), 0.5)).rg;
    return dot(encoded, vec2(0.99610895, 0.00389105));
  }
  vec2 encoded = texture2D(uSeams, vec2(clamp(uv.x, 0.0, 1.0), 0.5)).ba;
  return dot(encoded, vec2(0.99610895, 0.00389105));
}
void main() {
  vec2 uvA = plateUV(vUv, uCoverA);
  vec2 uvB = plateUV(vUv, uCoverB);
  vec3 colour;
  float transition = uMix;
  if (uMix <= 0.0001) {
    colour = plate(uImageA, uvA, uMaterialA, uModes.x, uTexel.xy);
  } else if (uMix >= 0.9999) {
    colour = plate(uImageB, uvB, uMaterialB, uModes.y, uTexel.zw);
  } else {
    vec3 a = plate(uImageA, uvA, uMaterialA, uModes.x, uTexel.xy);
    vec3 b = plate(uImageB, uvB, uMaterialB, uModes.y, uTexel.zw);
    // Material front handoffs preserve a stable image at both exact endpoints.
    if (uModes.x < 4.5 && uModes.y < 4.5 && uModes.y > 0.5) {
      float field = vUv.x * 0.56 + vUv.y * 0.44 + (noise(vUv * 6.0) - 0.5) * 0.055;
      transition = smoothstep(field - 0.30, field + 0.30, uMix * 1.6 - 0.30);
      transition = mix(uMix, transition, 0.7);
    }
    colour = mix(a, b, transition);
  }
  if (uSurfaceMode > 0.5 && uSplit > 0.001 && uMeshPass < 0.5) {
    float seam = curveValue(uSurfaceMode, uvA);
    float distance = uSurfaceMode < 5.0 ? abs(uvA.x - seam) : abs(uvA.y - seam);
    float cavity = 1.0 - smoothstep(0.008, 0.027, distance);
    colour *= 1.0 - cavity * uSplit * 0.88;
    if (uSurfaceMode < 5.0) {
      // This internal light is only exposed by the separate crack surfaces.
      float existingHeat = thermalMask(texture2D(uImageA, uvA).rgb);
      colour += vec3(0.62, 0.09, 0.006) * cavity * existingHeat * uSplit * 0.11;
    }
  }
  if (uMeshPass > 0.5 && uSurfaceMode > 5.0) {
    vec3 light = normalize(vec3(-0.4 + uPointer.x * 0.2, -0.45 + uPointer.y * 0.12, 1.0));
    float spec = pow(max(dot(normalize(vNormal), light), 0.0), 38.0);
    float surface = smoothstep(0.025, 0.17, dot(colour, vec3(0.2126, 0.7152, 0.0722)));
    colour += vec3(0.96, 0.98, 1.0) * surface * (spec * uRelief * 0.018 + vRim * 0.017);
  }
  gl_FragColor = vec4(clamp(colour, 0.0, 1.0), 1.0);
}
`;
