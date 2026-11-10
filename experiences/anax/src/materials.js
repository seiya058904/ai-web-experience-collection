// The material library: titanium and gunmetal, a few warm mechanical accents, and the wing film.
import * as THREE from 'three';
import { seeded } from './geo.js';

function canvasTexture(width, height, draw, { repeat = false, color = false } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.wrapS = texture.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  texture.anisotropy = 8;
  return texture;
}

/** Long fine streaks: the grain of a brushed surface, stored as a roughness multiplier. */
function brushedTexture(seed, base = 205, spread = 50) {
  const random = seeded(seed);
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = `rgb(${base},${base},${base})`;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i += 1) {
      const v = Math.round(base + (random() - 0.5) * spread * 2);
      ctx.strokeStyle = `rgba(${v},${v},${v},${0.25 + random() * 0.4})`;
      ctx.lineWidth = 0.5 + random() * 1.2;
      const y = random() * h;
      const x = random() * w;
      const len = 60 + random() * 320;
      ctx.beginPath();
      ctx.moveTo(x, y); ctx.lineTo(x + len, y);
      ctx.moveTo(x - w, y); ctx.lineTo(x + len - w, y);
      ctx.stroke();
    }
  }, { repeat: true });
}

/**
 * The fine cells of a wing film. Two maps from one cell layout:
 * one varies the film thickness cell by cell (each cell catches a different colour),
 * the other raises opacity along the cell walls.
 */
function wingTextures(seed) {
  const random = seeded(seed);
  const W = 1024; const H = 256;
  const cols = 64; const rows = 14;
  const sites = [];
  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      sites.push({ x: (i + 0.5 + (random() - 0.5) * 0.82) / cols, y: (j + 0.5 + (random() - 0.5) * 0.82) / rows, v: random() });
    }
  }
  const thickness = new Uint8ClampedArray(W * H * 4);
  const alpha = new Uint8ClampedArray(W * H * 4);
  const aspect = (W / H) * 0.62;
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const fx = x / W; const fy = y / H;
      const ci = Math.floor(fx * cols); const cj = Math.floor(fy * rows);
      let best = 9; let second = 9; let value = 0;
      for (let dj = -1; dj <= 1; dj += 1) {
        for (let di = -2; di <= 2; di += 1) {
          const i = ci + di; const j = cj + dj;
          if (i < 0 || j < 0 || i >= cols || j >= rows) continue;
          const s = sites[j * cols + i];
          const dx = (s.x - fx) * aspect; const dy = s.y - fy;
          const d = dx * dx + dy * dy;
          if (d < best) { second = best; best = d; value = s.v; } else if (d < second) second = d;
        }
      }
      const wall = Math.sqrt(second) - Math.sqrt(best);
      const line = 1 - Math.min(1, wall / 0.012);
      // A slow gradient across span and chord keeps neighbouring cells related, like a real film.
      const drift = 0.5 + 0.5 * Math.sin(fx * 9 + fy * 3.2);
      const t = Math.round((0.2 + 0.2 * value + 0.6 * drift) * 255);
      const k = (y * W + x) * 4;
      thickness[k] = thickness[k + 1] = thickness[k + 2] = t; thickness[k + 3] = 255;
      const a = Math.round((0.5 + 0.5 * line * line) * 255);
      alpha[k] = alpha[k + 1] = alpha[k + 2] = a; alpha[k + 3] = 255;
    }
  }
  const make = (data) => canvasTexture(W, H, (ctx) => ctx.putImageData(new ImageData(data, W, H), 0, 0));
  return { thickness: make(thickness), alpha: make(alpha) };
}

// Bright reflections on a transparent surface should stay bright. Colour is written premultiplied:
// the body of the surface is scaled by its opacity, the light it reflects is added whole, and alpha rises
// with that reflection. Glass and wing film keep their highlights while their body stays clear.
// `cap` limits how bright that reflection may get. A thin film seen edge-on mirrors a studio light
// almost whole, and uncapped that one patch burns out and blooms.
function withReflectiveAlpha(material, amount, vertexPatch, cap = 9) {
  const uniforms = material.userData.uniforms ?? (material.userData.uniforms = {});
  uniforms.uSpecAlpha = uniforms.uSpecAlpha ?? { value: amount };
  uniforms.uSpecCap = uniforms.uSpecCap ?? { value: cap };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uSpecAlpha;\nuniform float uSpecCap;')
      .replace('#include <opaque_fragment>', `{
        float baseAlpha = diffuseColor.a;
        vec3 reflected = max(outgoingLight - totalDiffuse - totalEmissiveRadiance, vec3(0.0));
        reflected *= min(1.0, uSpecCap / max(max(reflected.r, max(reflected.g, reflected.b)), 1e-4));
        outgoingLight = totalDiffuse * baseAlpha + totalEmissiveRadiance + reflected;
        diffuseColor.a = clamp(baseAlpha + dot(reflected, vec3(0.3333)) * uSpecAlpha, 0.0, 1.0);
      }
      #include <opaque_fragment>`);
    if (vertexPatch) vertexPatch(shader);
  };
  material.customProgramCacheKey = () => `reflective-alpha${vertexPatch ? '-bend' : ''}`;
  material.blending = THREE.CustomBlending;
  material.blendSrc = THREE.OneFactor;
  material.blendDst = THREE.OneMinusSrcAlphaFactor;
  material.blendSrcAlpha = THREE.OneFactor;
  material.blendDstAlpha = THREE.OneMinusSrcAlphaFactor;
  return material;
}

// Wings bow along their span as they beat. The bend is a per-wing uniform, so each wing has its own materials.
function bendPatch(shader) {
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nuniform float uBend;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.y += uBend * transformed.z * transformed.z;');
}

export function createMaterials() {
  const brushed = brushedTexture(7);
  const brushedFine = brushedTexture(19, 220, 30);
  brushed.repeat.set(2, 1);
  brushedFine.repeat.set(3, 3);
  const wingTex = wingTextures(41);

  const metal = (color, roughness, extra = {}) => new THREE.MeshStandardMaterial({ color, metalness: 1, roughness, ...extra });
  const physical = (options) => new THREE.MeshPhysicalMaterial(options);

  // Outer shell. These are the only materials the shell modes touch.
  const shellOptions = { metalness: 1, roughnessMap: brushed, side: THREE.FrontSide };
  const shell = {
    titanium: physical({ ...shellOptions, color: 0xb4b6ba, roughness: 0.52 }),
    satin: physical({ ...shellOptions, color: 0xc9cbce, roughness: 0.33 }),
    gun: physical({ ...shellOptions, color: 0x4b4f57, roughness: 0.5 }),
    dark: physical({ ...shellOptions, color: 0x23252a, roughness: 0.5 }),
  };
  for (const material of Object.values(shell)) {
    withReflectiveAlpha(material, 0);
    material.userData.shell = true;
  }

  const M = {
    shell,
    titanium: metal(0xc2c4c7, 0.36, { roughnessMap: brushedFine }),
    polished: metal(0xd2d4d7, 0.2),
    gunmetal: metal(0x555a62, 0.42, { roughnessMap: brushedFine }),
    frame: metal(0x3d4148, 0.5, { roughnessMap: brushedFine }),
    dark: metal(0x191a1d, 0.55),
    steel: metal(0xc3c6ca, 0.26),
    brass: metal(0xcfa55b, 0.3, { roughnessMap: brushedFine }),
    bronze: metal(0x9a6c3c, 0.38),
    copper: metal(0xd07c4e, 0.34),
    gold: metal(0xe2bd6e, 0.22),
    carbon: physical({ color: 0x15171a, metalness: 0.35, roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.18 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x0c0c0d, metalness: 0, roughness: 0.82 }),
    ceramic: new THREE.MeshStandardMaterial({ color: 0xe9e6df, metalness: 0, roughness: 0.38 }),
    board: physical({ color: 0x0f2a25, metalness: 0.2, roughness: 0.5, clearcoat: 0.6, clearcoatRoughness: 0.3 }),
    amber: new THREE.MeshStandardMaterial({ color: 0x2a1404, emissive: 0xff9a3c, emissiveIntensity: 2.4, roughness: 0.4 }),
    // Compound eye: a field of small coated lenses under a clear dome.
    lens: physical({ color: 0x1c3a3c, metalness: 0.85, roughness: 0.16, iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [220, 520], clearcoat: 1, clearcoatRoughness: 0.22 }),
    eyeBed: metal(0x0b0d0f, 0.6),
    dome: withReflectiveAlpha(physical({ color: 0x0c1a1e, metalness: 0, roughness: 0.12, transparent: true, opacity: 0.2, depthWrite: false, ior: 1.52, envMapIntensity: 1.5, specularIntensity: 1 }), 1.5),
    glass: withReflectiveAlpha(physical({ color: 0x9fb4c0, metalness: 0, roughness: 0.12, transparent: true, opacity: 0.1, depthWrite: false, ior: 1.5, envMapIntensity: 1.4 }), 1.4),
  };
  M.dome.userData.cast = false;
  M.glass.userData.cast = false;
  M.amber.userData.cast = false;

  /** Each wing owns a film, a vein and a root material so its bend can differ from the others. */
  M.wingSet = () => {
    const uniforms = { uBend: { value: 0 }, uSpecAlpha: { value: 0.9 } };
    const film = physical({
      color: 0xc9dcea, metalness: 0, roughness: 0.16, transparent: true, opacity: 0.11, alphaMap: wingTex.alpha, depthWrite: false, side: THREE.DoubleSide,
      ior: 1.56, specularIntensity: 1, envMapIntensity: 1.3,
      iridescence: 0.72, iridescenceIOR: 1.33, iridescenceThicknessRange: [240, 560], iridescenceThicknessMap: wingTex.thickness,
    });
    film.userData.uniforms = uniforms;
    film.userData.cast = false;
    film.userData.receive = false;
    withReflectiveAlpha(film, 0.9, bendPatch, 1.1);
    const bent = (material, key) => {
      material.userData.uniforms = { uBend: uniforms.uBend };
      material.onBeforeCompile = (shader) => { Object.assign(shader.uniforms, material.userData.uniforms); bendPatch(shader); };
      material.customProgramCacheKey = () => `bend-${key}`;
      return material;
    };
    const veinMaterial = bent(metal(0x7d858e, 0.34), 'vein');
    const stigma = bent(metal(0x6b4a2a, 0.3, { side: THREE.DoubleSide }), 'stigma');
    return { film, vein: veinMaterial, stigma, uniforms };
  };

  M.shellList = Object.values(shell);
  return M;
}

/**
 * Lit versions of a material for hover and selection. A part keeps its surface and gains a warm glow,
 * so a highlighted mechanism still reads as metal.
 */
const variants = new WeakMap();
const lit = { hover: [], select: [] };
export function litVariant(material, kind) {
  let entry = variants.get(material);
  if (!entry) variants.set(material, (entry = {}));
  if (entry[kind]) return entry[kind];
  const copy = material.clone();
  copy.userData = { ...material.userData };
  // The glow gathers on the edges that turn away from the viewer and thins on the faces looking at
  // them, so the part is outlined in light while its own metal stays readable.
  const inherited = material.onBeforeCompile;
  copy.onBeforeCompile = (shader, renderer) => {
    inherited?.call(copy, shader, renderer);
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      {
        float facing = clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);
        float edge = 1.0 - facing;
        totalEmissiveRadiance *= mix(0.3, 1.7, edge * edge);
      }`);
  };
  const key = material.customProgramCacheKey ? material.customProgramCacheKey() : material.type;
  copy.customProgramCacheKey = () => `${key}-lit`;
  copy.clippingPlanes = material.clippingPlanes;
  copy.emissive = new THREE.Color(0xffa544);
  // Clear surfaces take only a trace of the glow, or they would turn into solid amber.
  const clear = material.transparent && material.opacity < 0.5;
  copy.emissiveIntensity = (kind === 'select' ? 0.3 : 0.15) * (clear ? 0.12 : 1);
  copy.userData.litBase = copy.emissiveIntensity;
  copy.userData.source = material;
  lit[kind].push(copy);
  entry[kind] = copy;
  return copy;
}

/** Breathe the selection glow. */
export function pulseLit(time) {
  const k = 0.82 + 0.18 * Math.sin(time * 2.6);
  for (const material of lit.select) material.emissiveIntensity = material.userData.litBase * k;
}

/** Keep lit copies of shell materials in step with the shell mode. */
export function syncLit(material) {
  const entry = variants.get(material);
  if (!entry) return;
  for (const copy of Object.values(entry)) {
    copy.transparent = material.transparent;
    copy.opacity = material.opacity;
    copy.depthWrite = material.depthWrite;
    copy.clippingPlanes = material.clippingPlanes;
    copy.needsUpdate = true;
  }
}
