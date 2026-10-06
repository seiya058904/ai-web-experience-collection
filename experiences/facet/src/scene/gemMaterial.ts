import {
  Color,
  FrontSide,
  Matrix3,
  Matrix4,
  ShaderMaterial,
  Vector3,
  Vector4,
  type ColorRepresentation,
  type Texture,
} from 'three';

export type GemPresetName = 'diamond' | 'ruby' | 'sapphire' | 'emerald';

export interface GemPreset {
  color: ColorRepresentation;
  absorption: [number, number, number];
  ior: number;
  dispersion: number;
  exposure: number;
}

/** IOR is representative; absorption is an authored exhibition-lighting choice. */
export const GEM_PRESETS: Record<GemPresetName, GemPreset> = {
  diamond: { color: '#e8edf1', absorption: [0.022, 0.015, 0.01], ior: 2.417, dispersion: 0.008, exposure: 1.28 },
  ruby: { color: '#d2163d', absorption: [0.065, 2.30, 1.45], ior: 1.762, dispersion: 0.003, exposure: 1.4 },
  sapphire: { color: '#2458d6', absorption: [1.8, 0.76, 0.055], ior: 1.768, dispersion: 0.002, exposure: 1.4 },
  emerald: { color: '#31b87c', absorption: [1.65, 0.075, 0.78], ior: 1.58, dispersion: 0.003, exposure: 1.35 },
};

export interface GemMaterialOptions {
  preset?: GemPresetName;
  /** 2 on modest devices, 4 for the primary exhibition object. */
  bounces?: 2 | 3 | 4;
  /** Optional linear equirectangular radiance texture, stored locally by the app. */
  environment?: Texture;
  environmentMix?: number;
  polish?: number;
  opacity?: number;
  exposure?: number;
}

const vertexShader = /* glsl */ `
  varying vec3 vLocalPosition;
  varying vec3 vLocalNormal;
  void main() {
    vLocalPosition = position;
    vLocalNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform vec4 uPlanes[GEM_PLANE_COUNT];
  uniform vec3 uCameraLocal;
  uniform mat3 uLocalToWorld;
  uniform vec3 uColor;
  uniform vec3 uAbsorption;
  uniform float uIor;
  uniform float uDispersion;
  uniform float uPolish;
  uniform float uTime;
  uniform float uLightRotation;
  uniform float uExposure;
  uniform float uOpacity;
  #ifdef GEM_ENVIRONMENT
    uniform sampler2D uEnvironment;
    uniform float uEnvironmentMix;
  #endif

  varying vec3 vLocalPosition;
  varying vec3 vLocalNormal;
  const float PI = 3.141592653589793;
  const float RAY_EPSILON = 0.00008;

  // Rectangular area lights are angular shapes, not painted facet colors. Every
  // reflection and exit ray samples the same quiet, high-contrast studio.
  float softbox(vec3 direction, vec3 center, vec2 size, float feather) {
    vec3 axis = normalize(center);
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), axis));
    vec3 up = cross(axis, right);
    float facing = dot(direction, axis);
    vec2 position = vec2(dot(direction, right), dot(direction, up)) / max(facing, 0.001);
    vec2 rectangle = 1.0 - smoothstep(size - feather, size + feather, abs(position));
    vec2 relative = position / size;
    // A real diffuser has a luminance roll-off. A flat white rectangle made
    // the broad reflection faces read as opaque silver plates.
    vec2 falloff = relative * vec2(0.68, 0.43);
    float diffuser = 0.28 + 0.72 / (1.0 + dot(falloff, falloff));
    float gradient = mix(0.52, 1.0, clamp(relative.y * 0.38 + 0.5, 0.0, 1.0));
    return rectangle.x * rectangle.y * diffuser * gradient * smoothstep(0.0, 0.05, facing);
  }

  vec3 studio(vec3 localDirection, vec3 localPoint) {
    vec3 d = normalize(uLocalToWorld * localDirection);
    // Finite studio distance gives exit rays parallax across a face. The ray's
    // actual exit point now matters, making successive internal surfaces read
    // as depth instead of a collection of uniformly painted triangles.
    float objectScale = max(length(uLocalToWorld[0]), 0.0001);
    vec3 point = uLocalToWorld * localPoint / objectScale;
    float along = dot(point, d);
    float travel = -along + sqrt(max(along * along + 20.25 - dot(point, point), 0.001));
    d = normalize(point + d * travel);
    float rotation = uLightRotation + uTime * 0.008;
    float cs = cos(rotation);
    float sn = sin(rotation);
    d.xz = mat2(cs, -sn, sn, cs) * d.xz;

    vec3 radiance = mix(vec3(0.02, 0.026, 0.035), vec3(0.074, 0.086, 0.105), smoothstep(-0.5, 0.85, d.y));
    // The floor remains visible through the gem, without turning it into metal.
    radiance += vec3(0.14, 0.133, 0.12) * (1.0 - smoothstep(-0.75, 0.15, d.y));
    radiance += vec3(0.055, 0.063, 0.078) * exp(-pow((d.y - 0.05) / 0.28, 2.0));
    radiance += vec3(0.16, 0.18, 0.22) * pow(max(dot(d, normalize(vec3(0.35, 0.3, -1.0))), 0.0), 3.0);
    radiance += vec3(2.1, 2.20, 2.36) * softbox(d, vec3(-0.8, 0.65, 0.85), vec2(0.37, 0.8), 0.085);
    radiance += vec3(3.9, 3.75, 3.50) * softbox(d, vec3(0.15, 1.0, 0.33), vec2(1.4, 0.085), 0.038);
    radiance += vec3(4.2, 4.36, 4.6) * softbox(d, vec3(0.95, 0.32, -0.2), vec2(0.05, 0.8), 0.026);
    radiance += vec3(1.75, 1.82, 1.93) * softbox(d, vec3(-0.25, 0.15, -1.0), vec2(0.45, 0.53), 0.14);
    radiance += vec3(2.7, 2.55, 2.30) * softbox(d, vec3(-0.92, -0.22, -0.25), vec2(0.025, 0.34), 0.017);
    // A narrow dark flag interrupts the key and creates the characteristic
    // black / white distinction of a clear gem in exhibition photography.
    float flag = softbox(d, vec3(-0.76, 0.64, 0.88), vec2(0.028, 0.86), 0.004);
    radiance *= 1.0 - flag * 0.91;
    #ifdef GEM_ENVIRONMENT
      vec2 uv = vec2(atan(d.z, d.x) / (2.0 * PI) + 0.5, asin(clamp(d.y, -1.0, 1.0)) / PI + 0.5);
      radiance = mix(radiance, texture2D(uEnvironment, uv).rgb, uEnvironmentMix);
    #endif
    return radiance;
  }

  float fresnel(float cosine, float ior) {
    float f0 = (ior - 1.0) / (ior + 1.0);
    f0 *= f0;
    return f0 + (1.0 - f0) * pow(1.0 - clamp(cosine, 0.0, 1.0), 5.0);
  }

  float internalFresnelValue(float cosine, float transmittedCosine) {
    float s = (uIor * cosine - transmittedCosine) / (uIor * cosine + transmittedCosine);
    float p = (cosine - uIor * transmittedCosine) / (cosine + uIor * transmittedCosine);
    return clamp((s * s + p * p) * 0.5, 0.0, 1.0);
  }

  bool boundary(vec3 origin, vec3 direction, out vec3 hitNormal, out float hitDistance) {
    hitDistance = 10000.0;
    hitNormal = vec3(0.0, 1.0, 0.0);
    for (int planeIndex = 0; planeIndex < GEM_PLANE_COUNT; planeIndex++) {
      vec4 plane = uPlanes[planeIndex];
      float denominator = dot(plane.xyz, direction);
      if (denominator > 0.000001) {
        float distance = (plane.w - dot(plane.xyz, origin)) / denominator;
        if (distance > RAY_EPSILON * 0.2 && distance < hitDistance) {
          hitDistance = distance;
          hitNormal = plane.xyz;
        }
      }
    }
    return hitDistance < 9999.0;
  }

  vec3 spectralExit(vec3 incident, vec3 normal, vec3 greenExit, vec3 point) {
    // Three exit directions share the internal path. This bounded approximation
    // keeps dispersion at bright edges without tripling the plane traversal.
    vec3 center = studio(greenExit, point);
    // The faint, colored fire matters at a bright source, not in the dark field.
    // Corundum's subtler dispersion uses the central sample to bound fragment cost.
    if (uDispersion < 0.004 || max(center.r, max(center.g, center.b)) < 0.4) return center;
    vec3 redExit = refract(incident, -normal, max(1.001, uIor - uDispersion));
    vec3 blueExit = refract(incident, -normal, uIor + uDispersion);
    if (dot(redExit, redExit) < 0.001) redExit = greenExit;
    if (dot(blueExit, blueExit) < 0.001) blueExit = greenExit;
    return vec3(studio(redExit, point).r, center.g, studio(blueExit, point).b);
  }

  vec3 traceGem(vec3 surface, vec3 incident, vec3 normal) {
    float entryFresnel = fresnel(dot(-incident, normal), uIor);
    vec3 result = studio(reflect(incident, normal), surface) * entryFresnel;
    vec3 direction = refract(incident, normal, 1.0 / uIor);
    vec3 origin = surface + direction * RAY_EPSILON;
    vec3 throughput = vec3(1.0 - entryFresnel);
    vec3 hitNormal;
    float distance;

    for (int bounce = 0; bounce < GEM_BOUNCES; bounce++) {
      if (!boundary(origin, direction, hitNormal, distance)) {
        result += throughput * studio(direction, origin);
        throughput = vec3(0.0);
        break;
      }
      throughput *= exp(-uAbsorption * distance);
      vec3 point = origin + direction * distance;
      vec3 exitDirection = refract(direction, -hitNormal, uIor);
      bool totalInternalReflection = dot(exitDirection, exitDirection) < 0.00001;
      float internalFresnel = totalInternalReflection ? 1.0 : internalFresnelValue(dot(direction, hitNormal), dot(exitDirection, hitNormal));
      if (!totalInternalReflection) {
        result += throughput * (1.0 - internalFresnel) * spectralExit(direction, hitNormal, exitDirection, point);
      }
      throughput *= internalFresnel;
      direction = reflect(direction, hitNormal);
      origin = point + direction * RAY_EPSILON;
      if (max(throughput.r, max(throughput.g, throughput.b)) < 0.009) {
        throughput = vec3(0.0);
        break;
      }
    }
    // A restrained terminal estimate prevents a finite bounce budget from
    // introducing a visibly black cut-off in paths still trapped by TIR.
    result += throughput * studio(direction, origin) * 0.34;
    return result;
  }

  float grain(vec3 point) {
    return fract(sin(dot(point, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
  }

  void main() {
    vec3 normal = normalize(vLocalNormal);
    vec3 incident = normalize(vLocalPosition - uCameraLocal);
    vec3 optical = traceGem(vLocalPosition, incident, normal);

    // One continuous polish front travels across the object. The rough surface
    // and the optical interior share the very same cut; no image swap is used.
    float polish = smoothstep(0.0, 0.2, clamp(uPolish, 0.0, 1.0) * 1.2 - (vLocalPosition.x * 0.5 + 0.5));
    vec3 worldNormal = normalize(uLocalToWorld * normal);
    float diffuse = 0.16 + 0.4 * max(dot(worldNormal, normalize(vec3(-0.65, 0.9, 0.8))), 0.0);
    float microtexture = grain(floor(vLocalPosition * 170.0));
    vec3 roughColor = mix(vec3(0.38, 0.4, 0.42), uColor, 0.77) * diffuse;
    roughColor *= 0.83 + microtexture * 0.25;
    roughColor += vec3(pow(max(dot(reflect(incident, normal), normalize(vec3(-0.5, 0.8, 0.6))), 0.0), 9.0)) * 0.08;
    vec3 color = mix(roughColor, optical, polish) * uExposure;
    gl_FragColor = vec4(color, uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/**
 * A single front-surface draw performs bounded ray / convex-plane traversal.
 * It models entry refraction, Fresnel reflection, internal reflection, path
 * absorption and chromatic exit rays. It is intentionally an exhibition shader,
 * not spectral path tracing or a gemological instrument.
 */
export function createGemMaterial(
  planes: readonly Vector4[],
  presetOrOptions: GemPresetName | GemMaterialOptions = 'diamond',
): ShaderMaterial {
  if (planes.length < 4 || planes.length > 80) {
    throw new RangeError('Gem optics requires a closed convex hull of 4–80 planes.');
  }
  const options = typeof presetOrOptions === 'string' ? { preset: presetOrOptions } : presetOrOptions;
  const preset = GEM_PRESETS[options.preset ?? 'diamond'];
  const inverseWorld = new Matrix4();
  const cameraWorld = new Vector3();
  const material = new ShaderMaterial({
    name: `FACET / Optical ${options.preset ?? 'diamond'}`,
    defines: {
      GEM_PLANE_COUNT: planes.length,
      GEM_BOUNCES: options.bounces ?? 4,
      ...(options.environment ? { GEM_ENVIRONMENT: 1 } : {}),
    },
    uniforms: {
      uPlanes: { value: planes.map((plane) => plane.clone()) },
      uCameraLocal: { value: new Vector3(0, 0, 5) },
      uLocalToWorld: { value: new Matrix3() },
      uColor: { value: new Color(preset.color) },
      uAbsorption: { value: new Vector3(...preset.absorption) },
      uIor: { value: preset.ior },
      uDispersion: { value: preset.dispersion },
      uPolish: { value: options.polish ?? 1 },
      uTime: { value: 0 },
      uLightRotation: { value: 0 },
      uExposure: { value: options.exposure ?? preset.exposure },
      uOpacity: { value: options.opacity ?? 1 },
      uEnvironment: { value: options.environment ?? null },
      uEnvironmentMix: { value: options.environmentMix ?? 0.7 },
    },
    vertexShader,
    fragmentShader,
    side: FrontSide,
    transparent: true,
    depthWrite: true,
    toneMapped: true,
  });
  material.onBeforeRender = (_renderer, _scene, camera, _geometry, object) => {
    inverseWorld.copy(object.matrixWorld).invert();
    cameraWorld.setFromMatrixPosition(camera.matrixWorld);
    material.uniforms.uCameraLocal.value.copy(cameraWorld).applyMatrix4(inverseWorld);
    material.uniforms.uLocalToWorld.value.setFromMatrix4(object.matrixWorld);
    // This material may be shared by exhibition stones in the same frame.
    material.uniformsNeedUpdate = true;
  };
  return material;
}

export function applyGemPreset(material: ShaderMaterial, name: GemPresetName): void {
  const preset = GEM_PRESETS[name];
  material.uniforms.uColor.value.set(preset.color);
  material.uniforms.uAbsorption.value.set(...preset.absorption);
  material.uniforms.uIor.value = preset.ior;
  material.uniforms.uDispersion.value = preset.dispersion;
  material.uniforms.uExposure.value = preset.exposure;
  material.name = `FACET / Optical ${name}`;
}
