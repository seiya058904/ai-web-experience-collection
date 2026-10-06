import {
  Color,
  DataTexture,
  DoubleSide,
  LinearFilter,
  LinearMipmapLinearFilter,
  MeshPhysicalMaterial,
  NoColorSpace,
  RepeatWrapping,
  RGBAFormat,
  SRGBColorSpace,
  Vector2,
} from 'three';

export interface FabricUniforms {
  uTime: { value: number };
  uTension: { value: number };
  uSeam: { value: number };
  uWind: { value: Vector2 };
  uLayer: { value: number };
  uMovement: { value: number };
  uGauze: { value: number };
}

export interface FabricTextures {
  normal: DataTexture;
  color: DataTexture;
}

export function makeFabricTextures(maxAnisotropy: number): FabricTextures {
  const size = 512;
  const normalPixels = new Uint8Array(size * size * 4);
  const colorPixels = new Uint8Array(size * size * 4);
  const cells = 8;
  function height(x: number, y: number): number {
    const fx = x - Math.floor(x);
    const fy = y - Math.floor(y);
    const warp = Math.sqrt(Math.max(0, 1 - Math.pow((fx - 0.5) * 2.18, 2)));
    const weft = Math.sqrt(Math.max(0, 1 - Math.pow((fy - 0.5) * 2.18, 2)));
    const parity = ((Math.floor(x) + Math.floor(y)) & 1) === 0 ? 1 : -1;
    const h = Math.max(warp * 0.22 + parity * 0.095, weft * 0.22 - parity * 0.095);
    return h + Math.sin(x * Math.PI * 20) * 0.010 * warp
      + Math.sin(y * Math.PI * 18) * 0.008 * weft;
  }
  const d = cells / size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const id = (y * size + x) * 4;
      const u = (x + 0.5) / size * cells;
      const v = (y + 0.5) / size * cells;
      const dx = (height(u + d, v) - height(u - d, v)) * 7.5;
      const dy = (height(u, v + d) - height(u, v - d)) * 7.5;
      const length = Math.sqrt(dx * dx + dy * dy + 1);
      normalPixels[id] = Math.round(128 - dx / length * 127);
      normalPixels[id + 1] = Math.round(128 - dy / length * 127);
      normalPixels[id + 2] = Math.round(128 + 127 / length);
      normalPixels[id + 3] = 255;
      const grain = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
      const value = Math.min(255, Math.max(0, 246 + height(u, v) * 17 + grain * 2.5));
      colorPixels[id] = value;
      colorPixels[id + 1] = value;
      colorPixels[id + 2] = value;
      colorPixels[id + 3] = 255;
    }
  }
  function texture(pixels: Uint8Array, isColor: boolean): DataTexture {
    const tex = new DataTexture(pixels, size, size, RGBAFormat);
    tex.wrapS = tex.wrapT = RepeatWrapping;
    tex.repeat.set(30, 35);
    tex.colorSpace = isColor ? SRGBColorSpace : NoColorSpace;
    tex.magFilter = LinearFilter;
    tex.minFilter = LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
    tex.anisotropy = Math.min(8, maxAnisotropy);
    tex.needsUpdate = true;
    return tex;
  }
  return { normal: texture(normalPixels, false), color: texture(colorPixels, true) };
}

/** Longitudinal silk filaments for individual yarns, independent of the cloth weave. */
export function makeYarnTextures(maxAnisotropy: number): FabricTextures {
  const width = 256;
  const height = 512;
  const normalPixels = new Uint8Array(width * height * 4);
  const colorPixels = new Uint8Array(width * height * 4);
  const tau = Math.PI * 2;
  function phase(u: number, v: number): number {
    // The minute lateral drift never winds around the yarn like a coarse rope.
    return tau * (v * 14 + 0.045 * Math.sin(tau * u * 3)
      + 0.018 * Math.sin(tau * (u * 7 + v * 3)));
  }
  function relief(u: number, v: number): number {
    return 0.032 * Math.cos(phase(u, v))
      + 0.008 * Math.cos(tau * (v * 29 + 0.04 * Math.sin(tau * u * 5)))
      + 0.004 * Math.cos(tau * (v * 5 + u * 2));
  }
  const du = 1 / width;
  const dv = 1 / height;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const id = (y * width + x) * 4;
      const u = (x + 0.5) / width;
      const v = (y + 0.5) / height;
      const dx = (relief(u + du, v) - relief(u - du, v)) * 3;
      const dy = (relief(u, v + dv) - relief(u, v - dv)) * 18;
      const length = Math.sqrt(dx * dx + dy * dy + 1);
      normalPixels[id] = Math.round(128 - dx / length * 127);
      normalPixels[id + 1] = Math.round(128 - dy / length * 127);
      normalPixels[id + 2] = Math.round(128 + 127 / length);
      normalPixels[id + 3] = 255;
      const grain = Math.sin(tau * (u * 43 + v * 71))
        * Math.sin(tau * (u * 31 - v * 59));
      const value = Math.round(239 + 7 * Math.cos(phase(u, v))
        + 2 * Math.cos(tau * (v * 29 + u * 2))
        + 2 * Math.sin(tau * (u * 4 + v * 5)) + grain * 1.2);
      colorPixels[id] = colorPixels[id + 1] = colorPixels[id + 2] = value;
      colorPixels[id + 3] = 255;
    }
  }
  function texture(pixels: Uint8Array, isColor: boolean): DataTexture {
    const tex = new DataTexture(pixels, width, height, RGBAFormat);
    tex.wrapS = tex.wrapT = RepeatWrapping;
    // makeYarnGeometry already maps U to 0…15. Compensate here so each yarn
    // carries one longitudinal study and 14 fine filaments around its girth.
    tex.repeat.set(1 / 15, 1);
    tex.colorSpace = isColor ? SRGBColorSpace : NoColorSpace;
    tex.magFilter = LinearFilter;
    tex.minFilter = LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
    tex.anisotropy = Math.min(8, maxAnisotropy);
    tex.needsUpdate = true;
    return tex;
  }
  return { normal: texture(normalPixels, false), color: texture(colorPixels, true) };
}

export function makeFabricMaterial(textures: FabricTextures, layer: number): {
  material: MeshPhysicalMaterial;
  uniforms: FabricUniforms;
} {
  const uniforms: FabricUniforms = {
    uTime: { value: 0 },
    uTension: { value: 0.5 },
    uSeam: { value: 0 },
    uWind: { value: new Vector2() },
    uLayer: { value: layer },
    uMovement: { value: 1 },
    uGauze: { value: 0 },
  };
  const material = new MeshPhysicalMaterial({
    color: new Color('#e4e0d7'),
    map: textures.color,
    normalMap: textures.normal,
    normalScale: new Vector2(0.25, 0.25),
    metalness: 0.055,
    roughness: 0.51,
    sheen: 1.0,
    sheenColor: new Color('#fff7e7'),
    sheenRoughness: 0.42,
    anisotropy: 0.62,
    anisotropyRotation: Math.PI / 2,
    clearcoat: 0.04,
    clearcoatRoughness: 0.62,
    side: DoubleSide,
    transparent: true,
    opacity: 1,
    depthWrite: true,
    envMapIntensity: 0.76,
  });
  material.forceSinglePass = true;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
      uniform float uTime;
      uniform float uTension;
      uniform vec2 uWind;
      uniform float uLayer;
      uniform float uMovement;
      varying vec2 vFabricUv;`,
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <uv_vertex>',
      '#include <uv_vertex>\n vFabricUv = uv;',
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <defaultnormal_vertex>',
      `objectNormal.z /= mix(1.18, 0.76, uTension);
       #include <defaultnormal_vertex>`,
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <morphtarget_vertex>',
      `#include <morphtarget_vertex>
       float freeFall = 0.20 + 0.80 * sin(uv.y * 3.14159265);
       float windPhase = uTime * 0.34 + uv.y * 5.8 + uv.x * 3.4 + uLayer * 0.66;
       float windAmount = mix(0.10, 0.035, uTension) * uMovement;
       transformed.z *= mix(1.18, 0.76, uTension);
       transformed.z += sin(windPhase) * windAmount * freeFall;
       transformed.x += sin(windPhase * 0.71 + uv.y * 2.0) * windAmount * 0.50 * freeFall;
       transformed.y += cos(windPhase * 0.77 + uv.x * 3.0) * windAmount * 0.22;
       transformed.z += (uWind.x * (uv.x - 0.5) + uWind.y * (uv.y - 0.5)) * 0.09 * freeFall;`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
       varying vec2 vFabricUv;
       uniform float uSeam;
       uniform float uGauze;`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
       // The two seams follow the UV pattern through every fold and morph.
       float seamA = 0.255 + 0.055 * sin(vFabricUv.y * 3.14159265);
       float seamB = 0.755 - 0.042 * sin(vFabricUv.y * 4.4);
       float pixelWidth = max(fwidth(vFabricUv.x), 0.00035);
       float seamDistance = min(abs(vFabricUv.x - seamA), abs(vFabricUv.x - seamB));
       float stitch = (1.0 - smoothstep(pixelWidth * 0.40, pixelWidth * 1.0, seamDistance))
         * smoothstep(0.35, 0.43, fract(vFabricUv.y * 54.0));
       float hemDistance = min(min(vFabricUv.x, 1.0-vFabricUv.x), min(vFabricUv.y, 1.0-vFabricUv.y));
       float hem = 1.0 - smoothstep(0.0018, 0.0040, hemDistance);
       diffuseColor.rgb *= 1.0 - stitch * uSeam * 0.43;
       diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.10, hem * 0.62);`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `float grazing = 1.0 - abs(dot(normal, normalize(vViewPosition)));
       diffuseColor.a *= mix(1.0, 0.31 + 0.69 * pow(grazing, 0.62), uGauze);
       diffuseColor.a = mix(diffuseColor.a, min(0.92, diffuseColor.a * 1.30 + 0.06), hem * uGauze * 0.86);
       outgoingLight += vec3(0.14,0.145,0.135) * hem * uGauze;
       #include <opaque_fragment>`,
    );
  };
  material.customProgramCacheKey = () => 'veil-textile-physical-v1';
  return { material, uniforms };
}
