import * as THREE from 'three';

/**
 * FORM surface library.
 * Every texture below is original, deterministic procedural artwork. No image,
 * scan, stock material, external URL or third-party texture is used.
 *
 * The neutral face map is shared by all three finishes. Chair UVs follow the
 * developed shell, so the same fibres continue through the seat/back bend.
 * DOM access is deliberately confined to createMaterials(), allowing this
 * module to be imported by build and geometry checks without a browser.
 */
export function createMaterials(renderer) {
  const textures = new Set();
  const materials = new Set();
  const anisotropy = Math.min(8, renderer?.capabilities?.getMaxAnisotropy?.() ?? 4);
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const byte = (v) => Math.round(clamp(v) * 255);

  // Small cached value fields avoid an expensive hash calculation at every
  // octave and pixel. Integer seeds make exports and captures reproducible.
  function valueField(seed) {
    let state = seed >>> 0;
    const values = new Float32Array(256 * 256);
    for (let i = 0; i < values.length; i += 1) {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      values[i] = (state >>> 0) / 4294967295;
    }
    return (x, y) => {
      const ix = Math.floor(x);
      const iy = Math.floor(y);
      const fx = x - ix;
      const fy = y - iy;
      const sx = fx * fx * (3 - 2 * fx);
      const sy = fy * fy * (3 - 2 * fy);
      const x0 = ix & 255;
      const x1 = (ix + 1) & 255;
      const y0 = (iy & 255) * 256;
      const y1 = ((iy + 1) & 255) * 256;
      return lerp(lerp(values[y0 + x0], values[y0 + x1], sx),
        lerp(values[y1 + x0], values[y1 + x1], sx), sy);
    };
  }

  function canvas(width, height) {
    const element = document.createElement('canvas');
    element.width = width;
    element.height = height;
    const context = element.getContext('2d', { alpha: false });
    if (!context) throw new Error('FORM requires a 2D canvas to construct its surfaces.');
    return { element, context, pixels: context.createImageData(width, height) };
  }

  function texture(source, name, isColor = false) {
    source.context.putImageData(source.pixels, 0, 0);
    const result = new THREE.CanvasTexture(source.element);
    result.name = name;
    result.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    result.wrapS = THREE.RepeatWrapping;
    result.wrapT = THREE.RepeatWrapping;
    result.anisotropy = anisotropy;
    result.minFilter = THREE.LinearMipmapLinearFilter;
    result.magFilter = THREE.LinearFilter;
    result.generateMipmaps = true;
    textures.add(result);
    return result;
  }

  function material(parameters) {
    const result = new THREE.MeshPhysicalMaterial(parameters);
    materials.add(result);
    return result;
  }

  function woodTextures() {
    const width = 1024;
    const height = 2048;
    const face = canvas(width, height);
    const surface = canvas(width, height);
    const grain = valueField(0x4f524d21);
    const detail = valueField(0x713feb13);
    const a = face.pixels.data;
    const b = surface.pixels.data;
    let random = 0x31ea418d;

    for (let y = 0; y < height; y += 1) {
      const v = y / (height - 1);
      for (let x = 0; x < width; x += 1) {
        const u = x / (width - 1);
        const offset = (y * width + x) * 4;
        const flow = (grain(u * 2.1 + 11, v * 1.6 + 7) - 0.5) * 0.052
          + (grain(u * 6.6 + 33, v * 3.6) - 0.5) * 0.009;
        // A flat cut through off-axis growth rings: long, irregular cathedrals
        // with their centre outside the veneer. Never a repeating sine stripe.
        const cross = u - 0.43 + flow;
        const along = (v - 1.19) * 0.31;
        const radius = Math.sqrt(cross * cross + along * along);
        const ring = radius * 77 + grain(u * 4.1, v * 3.1 + 21) * 1.65;
        const growth = grain(ring, v * 1.5 + 37);
        const latewood = Math.pow(clamp((growth - 0.51) / 0.49), 2.2);
        const ribbon = grain((u + flow) * 47 + 19, v * 1.65 + 47);
        const fibres = detail((u + flow * 0.74) * 318 + 31, v * 5.1 + 11);
        const fineFibres = detail((u + flow * 0.43) * 855 + 9, v * 17.2 + 73);
        const cloud = grain(u * 4.3 + 69, v * 3.3 + 23);
        random ^= random << 13;
        random ^= random >>> 17;
        random ^= random << 5;
        const micro = (random >>> 0) / 4294967295;
        const pore = Math.pow(clamp((1 - fineFibres - 0.61) / 0.39), 3)
          * (0.35 + 0.65 * detail(u * 113 + 7, v * 46 + 27));

        const tone = 0.882 + (cloud - 0.5) * 0.082 + (ribbon - 0.5) * 0.073
          + (fibres - 0.5) * 0.063 + (fineFibres - 0.5) * 0.029
          - latewood * 0.155 - pore * 0.067 + (micro - 0.5) * 0.011;
        const value = byte(tone);
        a[offset] = value;
        a[offset + 1] = value;
        a[offset + 2] = value;
        a[offset + 3] = 255;

        // R is microscopic height; G is perceptual roughness. Sharing this
        // non-colour texture keeps the grain and finish perfectly registered.
        b[offset] = byte(0.51 + (fibres - 0.5) * 0.19
          + (fineFibres - 0.5) * 0.16 - pore * 0.15 + (micro - 0.5) * 0.028);
        b[offset + 1] = byte(0.9 + (fibres - 0.5) * 0.085
          + latewood * 0.026 + pore * 0.055);
        b[offset + 2] = 128;
        b[offset + 3] = 255;
      }
    }
    return {
      map: texture(face, 'Original / continuous neutral veneer grain', true),
      surface: texture(surface, 'Original / veneer microheight R · roughness G'),
    };
  }

  function edgeTexture() {
    const width = 1024;
    const height = 128;
    const target = canvas(width, height);
    const field = valueField(0x24eabc71);
    const data = target.pixels.data;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const u = x / width;
        const v = y / height;
        const fine = field(u * 13, v * 127);
        const endGrain = field(u * 130, v * 13);
        const value = byte(0.905 + (fine - 0.5) * 0.09 + (endGrain - 0.5) * 0.045);
        const offset = (y * width + x) * 4;
        data[offset] = value;
        data[offset + 1] = value;
        data[offset + 2] = value;
        data[offset + 3] = 255;
      }
    }
    return texture(target, 'Original / sanded laminate edge fibres', true);
  }

  function brushedSurface() {
    const width = 1024;
    const height = 256;
    const target = canvas(width, height);
    const field = valueField(0x513cab8f);
    const data = target.pixels.data;
    for (let y = 0; y < height; y += 1) {
      const v = y / height;
      for (let x = 0; x < width; x += 1) {
        const u = x / width;
        const brushing = field(u * 414, v * 4.4);
        const fine = field(u * 807 + 89, v * 11 + 31);
        const broad = field(u * 17 + 47, v * 7.6 + 18);
        const offset = (y * width + x) * 4;
        data[offset] = byte(0.5 + (brushing - 0.5) * 0.055 + (fine - 0.5) * 0.028);
        data[offset + 1] = byte(0.95 + (brushing - 0.5) * 0.022 + (broad - 0.5) * 0.008);
        data[offset + 2] = 128;
        data[offset + 3] = 255;
      }
    }
    return texture(target, 'Original / aluminium brushing microheight R · roughness G');
  }

  function stoneTextures() {
    const width = 512;
    const height = 512;
    const color = canvas(width, height);
    const surface = canvas(width, height);
    const field = valueField(0x38be95f1);
    const a = color.pixels.data;
    const b = surface.pixels.data;
    for (let y = 0; y < height; y += 1) {
      const v = y / height;
      for (let x = 0; x < width; x += 1) {
        const u = x / width;
        const offset = (y * width + x) * 4;
        const cloud = field(u * 5.3 + 17, v * 5.3 + 21);
        const mineral = field(u * 22.3 + cloud * 1.9, v * 18.1 + 83);
        const grain = field(u * 148.2 + 43, v * 148.2 + 97);
        const grit = field(u * 371 + 29, v * 371 + 11);
        const seam = Math.exp(-Math.abs(field(u * 2.8 + cloud * 0.8,
          v * 3.3 + 31) - 0.5) * 63);
        const pore = Math.pow(clamp((0.34 - grit) / 0.34), 4);
        const value = 0.922 + (cloud - 0.5) * 0.06 + (mineral - 0.5) * 0.041
          + (grain - 0.5) * 0.032 - seam * 0.018 - pore * 0.032;
        a[offset] = byte(value + (mineral - 0.5) * 0.007);
        a[offset + 1] = byte(value);
        a[offset + 2] = byte(value - (cloud - 0.5) * 0.009);
        a[offset + 3] = 255;
        b[offset] = byte(0.5 + (grain - 0.5) * 0.12 + (grit - 0.5) * 0.15 - pore * 0.08);
        b[offset + 1] = byte(0.93 + (mineral - 0.5) * 0.045 + pore * 0.027);
        b[offset + 2] = 128;
        b[offset + 3] = 255;
      }
    }
    return {
      map: texture(color, 'Original / honed limestone mineral field', true),
      surface: texture(surface, 'Original / limestone pores R · roughness G'),
    };
  }

  const grain = woodTextures();
  const edge = edgeTexture();
  const brushing = brushedSurface();
  const limestone = stoneTextures();

  const finishInfo = [
    {
      id: 'walnut', name: 'Walnut', label: 'Walnut', title: 'AMERICAN WALNUT',
      subtitle: 'Warm grain. Quiet character.', color: '#745b48', edgeColor: '#c8b292',
      roughness: 0.47, clearcoat: 0.24, clearcoatRoughness: 0.37, bumpScale: 0.00048,
    },
    {
      id: 'oak', name: 'Oak', label: 'Oak', title: 'NATURAL OAK',
      subtitle: 'Open grain. A lighter presence.', color: '#c6ad86', edgeColor: '#d0bc9a',
      roughness: 0.53, clearcoat: 0.16, clearcoatRoughness: 0.43, bumpScale: 0.00058,
    },
    {
      id: 'ink', name: 'Ink', label: 'Ink', title: 'INK-STAINED VENEER',
      subtitle: 'The same grain. A quieter tone.', color: '#303333', edgeColor: '#8e8170',
      roughness: 0.5, clearcoat: 0.21, clearcoatRoughness: 0.4, bumpScale: 0.00052,
    },
  ];

  const finishes = finishInfo.map((finish) => {
    const result = material({
      name: `FORM / ${finish.name} veneer preset`,
      color: finish.color,
      map: grain.map,
      metalness: 0,
      roughness: finish.roughness,
      roughnessMap: grain.surface,
      bumpMap: grain.surface,
      bumpScale: finish.bumpScale,
      clearcoat: finish.clearcoat,
      clearcoatRoughness: finish.clearcoatRoughness,
      clearcoatRoughnessMap: grain.surface,
      ior: 1.47,
      envMapIntensity: 0.92,
    });
    result.userData.finish = finish.id;
    return result;
  });
  // The visible material is independent of immutable target presets. Its
  // identity never changes during a transition, and meshes need no swapping.
  const wood = finishes[0].clone();
  wood.name = 'FORM / continuous shell — active finish';
  materials.add(wood);

  const woodEdge = material({
    name: 'FORM / exposed seven-ply edge',
    color: finishInfo[0].edgeColor,
    map: edge,
    roughness: 0.5,
    metalness: 0,
    clearcoat: 0.13,
    clearcoatRoughness: 0.44,
    envMapIntensity: 0.8,
  });

  const metal = material({
    name: 'FORM / satin-brushed aluminium',
    color: '#d9dbdb',
    metalness: 1,
    roughness: 0.36,
    roughnessMap: brushing,
    bumpMap: brushing,
    bumpScale: 0.00002,
    // The family includes revolved geometry whose tangents converge at a
    // pole. Fine mapped brushing remains coherent there; shader anisotropy
    // would exaggerate the UV convergence into visible radial fluting.
    anisotropy: 0,
    envMapIntensity: 1.1,
  });

  const darkMetal = material({
    name: 'FORM / bead-blasted graphite',
    color: '#454846',
    metalness: 0.82,
    roughness: 0.43,
    roughnessMap: brushing,
    bumpMap: brushing,
    bumpScale: 0.000015,
    envMapIntensity: 0.95,
  });

  const rubber = material({
    name: 'FORM / isolation elastomer',
    color: '#252725',
    roughness: 0.87,
    metalness: 0,
    envMapIntensity: 0.42,
  });

  const stone = material({
    name: 'FORM / honed warm limestone',
    color: '#d5ccbc',
    map: limestone.map,
    roughness: 0.66,
    roughnessMap: limestone.surface,
    bumpMap: limestone.surface,
    bumpScale: 0.00063,
    metalness: 0,
    ior: 1.5,
    envMapIntensity: 0.62,
  });

  const diffuser = material({
    name: 'FORM / opal light diffuser',
    color: '#f8f1de',
    roughness: 0.72,
    metalness: 0,
    emissive: '#ffe5b3',
    emissiveIntensity: 1,
    ior: 1.46,
    envMapIntensity: 0.45,
  });

  const edgeColors = finishInfo.map((finish) => new THREE.Color(finish.edgeColor));
  const transitionProperties = ['roughness', 'clearcoat', 'clearcoatRoughness', 'bumpScale'];

  /**
   * Move the shared shell material toward one target finish.
   * index: 0 = Walnut, 1 = Oak, 2 = Ink.
   * blend: interpolation fraction for THIS call; 1 snaps immediately.
   * For frame-rate-independent smoothing call once per frame with:
   *   setFinish(index, 1 - Math.exp(-5 * deltaSeconds)).
   * No textures, meshes, shaders or material identities are replaced.
   */
  function setFinish(index, blend = 1) {
    const targetIndex = clamp(Math.round(Number(index) || 0), 0, finishes.length - 1);
    const fraction = Number.isFinite(blend) ? clamp(blend) : 1;
    const target = finishes[targetIndex];
    wood.color.lerp(target.color, fraction);
    woodEdge.color.lerp(edgeColors[targetIndex], fraction);
    for (const property of transitionProperties) {
      wood[property] = lerp(wood[property], target[property], fraction);
    }
    wood.userData.finish = finishInfo[targetIndex].id;
    return wood;
  }

  function dispose() {
    for (const item of materials) item.dispose();
    for (const item of textures) item.dispose();
    materials.clear();
    textures.clear();
  }

  return {
    wood, woodEdge, metal, darkMetal, rubber, stone, diffuser,
    finishes, finishInfo, setFinish, dispose,
  };
}
