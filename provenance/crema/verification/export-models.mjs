/**
 * Export reusable glTF and PNG snapshots from the exact runtime CREMA assets.
 * Run from the project: node scripts/export-models.mjs
 * No browser, GPU, network requests, new dependencies, or source rewriting.
 */
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { deflateSync, inflateSync } from 'node:zlib';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = join(projectRoot, 'production', 'models');
const textureDirectory = join(projectRoot, 'production', 'textures');
const sourcePath = join(projectRoot, 'src', 'visuals', 'PorousWorld.js');
const snapshotStage = 2.65;
const sizeLimit = 5 * 1024 * 1024;
const hash = (data) => createHash('sha256').update(data).digest('hex');

const crcTable = new Uint32Array(256);
for (let index = 0; index < 256; index++) {
  let value = index;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  crcTable[index] = value >>> 0;
}
function crc32(data) {
  let value = 0xffffffff;
  for (const byte of data) value = crcTable[(value ^ byte) & 255] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}
function pngChunk(name, data = Buffer.alloc(0)) {
  const type = Buffer.from(name, 'ascii');
  const result = Buffer.alloc(data.length + 12);
  result.writeUInt32BE(data.length, 0);
  type.copy(result, 4);
  data.copy(result, 8);
  result.writeUInt32BE(crc32(Buffer.concat([type, data])), result.length - 4);
  return result;
}
function exactRGBAPNG(texture, isColor) {
  const { data, width, height } = texture.image;
  if (!(data instanceof Uint8Array) || data.length !== width * height * 4) {
    throw new Error('The procedural texture must contain unsigned-byte RGBA pixels.');
  }
  const pixels = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  const stride = width * 4;
  const scanlines = Buffer.alloc((stride + 1) * height);
  for (let row = 0; row < height; row++) {
    // PNG filter 0 preserves each source byte and the original row order.
    pixels.copy(scanlines, row * (stride + 1) + 1, row * stride, (row + 1) * stride);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6; // RGBA, including the source's opaque alpha channel.
  const compressed = deflateSync(scanlines, { level: 9 });
  if (!inflateSync(compressed).equals(scanlines)) throw new Error('PNG pixel data changed during compression.');
  return {
    buffer: Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      pngChunk('IHDR', header),
      // Colour pixels are sRGB. Height data must have no display transfer tag.
      ...(isColor ? [pngChunk('sRGB', Buffer.from([0]))] : []),
      pngChunk('IDAT', compressed),
      pngChunk('IEND'),
    ]),
    width, height, pixelSHA256: hash(pixels),
  };
}

// The texture-free binary export path only needs this small FileReader bridge.
// Node supplies Blob/ArrayBuffer itself. Browser APIs and image canvases are not
// required because none of the runtime textures is embedded in these models.
if (!globalThis.FileReader) {
  globalThis.FileReader = class NodeFileReader {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((result) => {
        this.result = result;
        this.onload?.({ target: this });
        this.onloadend?.({ target: this });
      }).catch((error) => this.onerror?.({ target: this, error }));
    }
    readAsDataURL(blob) {
      blob.arrayBuffer().then((result) => {
        this.result = `data:${blob.type || 'application/octet-stream'};base64,${Buffer.from(result).toString('base64')}`;
        this.onload?.({ target: this });
        this.onloadend?.({ target: this });
      }).catch((error) => this.onerror?.({ target: this, error }));
    }
  };
}

const sourceBefore = await readFile(sourcePath);
const sourceSHA256 = hash(sourceBefore);
const { default: PorousWorld } = await import(pathToFileURL(sourcePath).href);

// Supplying an environment avoids generating the runtime HDR reflection map.
// No rendering is needed: all the fragment vertices and packed-bed transforms
// are authored on the CPU by PorousWorld itself.
const unusedEnvironment = new THREE.Texture();
const rendererStub = {
  capabilities: { getMaxAnisotropy: () => 1 },
  render() {},
};
const world = new PorousWorld({
  renderer: rendererStub,
  assets: { environment: unusedEnvironment },
});
world.resize(1600, 900);
world.updatePacking(snapshotStage);

const owned = new Set();
const own = (value) => { owned.add(value); return value; };
const plainMaterial = own(new THREE.MeshStandardMaterial({
  name: 'CREMA / dry fractured coffee / standard PBR',
  color: 0x5b3b28,
  metalness: 0,
  roughness: .94,
}));

function portableGeometry(source) {
  const geometry = own(source.clone());
  // Runtime shader data is not an ordinary glTF vertex attribute. Geometry
  // positions, normals, indices and UVs remain exactly those of the runtime.
  for (const attribute of Object.keys(geometry.attributes)) {
    if (!['position', 'normal', 'uv', 'color', 'tangent'].includes(attribute)) {
      geometry.deleteAttribute(attribute);
    }
  }
  return geometry;
}

const fragmentScene = new THREE.Scene();
fragmentScene.name = 'CREMA / fractured granule';
const fragmentGeometry = portableGeometry(world.heroes[0].geometry);
const fragment = new THREE.Mesh(fragmentGeometry, plainMaterial);
fragment.name = 'Fractured_Coffee_Granule_01';
fragment.userData = {
  provenance: 'Original procedural CREMA geometry from PorousWorld.makeHeroFragments().',
  scale: 'Authored scene units; not a measured coffee particle.',
  material: 'Texture-free standard PBR snapshot. Runtime wetness and microdetail are not baked.',
};
fragmentScene.add(fragment);

const bedScene = new THREE.Scene();
bedScene.name = 'CREMA / packed dry bed';
const bedRoot = new THREE.Group();
bedRoot.name = 'Packed_Coffee_Bed';
bedRoot.userData = {
  provenance: 'Original deterministic PorousWorld particle packing; not micro-CT or measured particle data.',
  snapshotStage,
  axes: 'Y up. X across the section. Z into the section.',
  scale: 'Authored scene units; no metric particle-size claim.',
};
bedScene.add(bedRoot);
let instanceCount = 0;
const batches = [];
for (let index = 0; index < world.batches.length; index++) {
  const batch = world.batches[index];
  const geometry = portableGeometry(batch.mesh.geometry);
  geometry.name = `Coffee_Fragment_Form_${index + 1}`;
  const mesh = new THREE.InstancedMesh(geometry, plainMaterial, batch.mesh.count);
  mesh.name = `Particle_Size_Band_${index + 1}`;
  mesh.instanceMatrix.copy(batch.mesh.instanceMatrix);
  if (batch.mesh.instanceColor) mesh.instanceColor = batch.mesh.instanceColor.clone();
  mesh.userData = {
    sizeBand: index + 1,
    particleCount: mesh.count,
    note: 'Full desktop count. Original runtime geometry and deterministic packing matrices.',
  };
  bedRoot.add(mesh);
  instanceCount += mesh.count;
  batches.push({ band: index + 1, instances: mesh.count, verticesPerForm: geometry.attributes.position.count });
}

await mkdir(outputDirectory, { recursive: true });
const exporter = new GLTFExporter();

function glbJSON(buffer) {
  if (buffer.readUInt32LE(0) !== 0x46546c67 || buffer.readUInt32LE(4) !== 2) {
    throw new Error('Exporter did not produce a glTF 2.0 binary file.');
  }
  if (buffer.readUInt32LE(8) !== buffer.length) throw new Error('Incorrect GLB byte length.');
  const jsonLength = buffer.readUInt32LE(12);
  if (buffer.readUInt32LE(16) !== 0x4e4f534a) throw new Error('Missing GLB JSON chunk.');
  return JSON.parse(buffer.subarray(20, 20 + jsonLength).toString('utf8'));
}

async function exportAndCheck(filename, scene, expectedInstances) {
  scene.updateMatrixWorld(true);
  const arrayBuffer = await exporter.parseAsync(scene, {
    binary: true,
    onlyVisible: true,
    trs: false,
    copyright: 'CREMA. Original procedural geometry. MIT License.',
  });
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.length > sizeLimit) throw new Error(`${filename} exceeded the 5 MiB budget.`);
  const document = glbJSON(buffer);
  if (document.images?.length || document.textures?.length) {
    throw new Error('An unintended texture was embedded in the portable model.');
  }
  if ((document.buffers || []).some((entry) => entry.uri)) {
    throw new Error('Model unexpectedly depends on an external binary buffer.');
  }
  const loaded = await new GLTFLoader().parseAsync(arrayBuffer, '');
  let reloadedInstances = 0;
  let reloadedVertices = 0;
  loaded.scene.traverse((object) => {
    if (object.isMesh) reloadedVertices += object.geometry.attributes.position.count;
    if (object.isInstancedMesh) reloadedInstances += object.count;
  });
  if (reloadedInstances !== expectedInstances) {
    throw new Error(`${filename}: round-trip instance count changed (${reloadedInstances}).`);
  }
  if (!reloadedVertices) throw new Error(`${filename}: round-trip mesh has no vertices.`);
  const bounds = new THREE.Box3().setFromObject(loaded.scene);
  const boundsArray = [...bounds.min.toArray(), ...bounds.max.toArray()];
  if (!boundsArray.every(Number.isFinite)) throw new Error(`${filename}: model has invalid bounds.`);
  await writeFile(join(outputDirectory, filename), buffer);
  loaded.scene.traverse((object) => {
    object.geometry?.dispose();
    if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
    else object.material?.dispose();
  });
  return {
    filename,
    bytes: buffer.length,
    sha256: hash(buffer),
    extensionsRequired: document.extensionsRequired || [],
    geometryForms: document.meshes?.length || 0,
    instances: expectedInstances || 1,
    bounds: { min: bounds.min.toArray(), max: bounds.max.toArray() },
    verified: 'GLB header, embedded-buffer-only structure, no embedded textures, GLTFLoader round-trip, finite bounds and expected instance count.',
  };
}

try {
  const files = [];
  files.push(await exportAndCheck('fractured-coffee-granule.glb', fragmentScene, 0));
  files.push(await exportAndCheck('packed-coffee-bed.glb', bedScene, instanceCount));
  await mkdir(textureDirectory, { recursive: true });
  const textureFiles = [];
  for (const [key, filename, isColor] of [
    ['color', 'coffee-cellular-albedo.png', true],
    ['bump', 'coffee-cellular-height.png', false],
  ]) {
    const texture = world.textures[key];
    const encoded = exactRGBAPNG(texture, isColor);
    await writeFile(join(textureDirectory, filename), encoded.buffer);
    textureFiles.push({
      filename,
      bytes: encoded.buffer.length,
      sha256: hash(encoded.buffer),
      pixelSHA256: encoded.pixelSHA256,
      width: encoded.width,
      height: encoded.height,
      pixelFormat: 'RGBA8, lossless; source bytes and row order preserved',
      role: isColor ? 'Procedural colour/albedo map' : 'Procedural scalar cellular height map, identical R/G/B channels',
      colorSpace: isColor ? 'sRGB' : 'Non-colour data; no PNG gamma or sRGB tag',
      runtime: {
        flipY: texture.flipY,
        repeat: texture.repeat.toArray(),
        wrap: 'RepeatWrapping on both axes',
        sampling: 'Linear magnification, linear mipmap minification; generate mipmaps',
        projection: 'The runtime custom shader uses object-space triplanar mapping; ordinary UV texture transforms are ignored.',
      },
    });
  }
  const sourceAfter = await readFile(sourcePath);
  if (hash(sourceAfter) !== sourceSHA256) {
    throw new Error('PorousWorld changed during export. Run this command again for a coherent snapshot.');
  }
  const manifest = {
    title: 'CREMA — reusable procedural model snapshots',
    format: 'glTF 2.0 binary',
    license: 'MIT',
    generator: 'scripts/export-models.mjs using Three.js GLTFExporter',
    threeVersion: THREE.REVISION,
    canonicalSource: 'src/visuals/PorousWorld.js',
    canonicalSourceSHA256: sourceSHA256,
    snapshotStage,
    interpretation: 'Authored visual geometry. Not measured micro-CT, physical particle measurements, or CFD output.',
    batches,
    files,
  };
  await writeFile(join(outputDirectory, 'models-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(join(textureDirectory, 'textures-manifest.json'), `${JSON.stringify({
    title: 'CREMA — exact original procedural texture snapshots',
    license: 'MIT',
    generator: 'scripts/export-models.mjs; lossless PNG writer using Node built-in zlib',
    canonicalSource: 'src/visuals/PorousWorld.js / coffeeTextures()',
    canonicalSourceSHA256: sourceSHA256,
    provenance: 'Original code-generated seeded cellular pores and multiscale noise. No AI image, research figure or external texture is used in these two maps.',
    separateAIOverlay: 'public/assets/granule.webp; production/originals/granule-master.png',
    runtimeProjection: {
      source: 'src/visuals/PorousWorld.js / applyCoffeeShader()',
      coordinates: 'p = object-local position * 0.83 + particle seed * (3.13, 1.79, 0.67)',
      weights: 'abs(normalize(object-local vertex normal)) raised to power 8, divided by the sum',
      planes: 'Sample YZ, ZX and XY, weighted by X, Y and Z respectively',
      height: '88% pow(linear-RGB luminance of blended colour, 0.60) + 12% procedural height sampled at p * 2.60',
      cellularField: 'clamp(height * 1.60 - 0.10, 0, 1), shared by roughness, coating and cavity shading',
      relief: 'Height derivatives scaled by bumpScale * instance scale * group scale perturb the view-space normal',
      textureTransforms: 'RepeatWrapping applies; Texture.repeat, offset, rotation and ordinary geometry UVs are not used by this custom projection',
      portability: 'Plain UV-mapped PBR and the texture-free GLBs do not reproduce the runtime shader by themselves',
    },
    files: textureFiles,
  }, null, 2)}\n`);
  await writeFile(join(textureDirectory, 'README.md'), `# CREMA — original procedural textures\n\nThese PNGs preserve the **exact RGBA pixel bytes** generated by \`coffeeTextures()\` in \`src/visuals/PorousWorld.js\`. They are original code-native material assets: seeded cellular pores combined with multiscale noise. They contain no AI-generated pixels, external texture, research image or photographic scan.\n\n| File | Role | Resolution | Colour handling |\n|---|---|---|---|\n| \`coffee-cellular-albedo.png\` | The original procedural colour/albedo fallback, before the separate AI detail overlay loads. | 512 × 512 RGBA8 | sRGB; PNG includes an sRGB tag. |\n| \`coffee-cellular-height.png\` | The scalar height/bump map used by the runtime, including when the AI albedo overlay is present. R, G and B contain identical height values. | 512 × 512 RGBA8 | Raw non-colour data; no gamma or sRGB tag. |\n\nThese are height and colour maps, not measured topography or a tangent-space normal map. Higher height values represent the raised cellular material in the authored surface. The geometry silhouettes, particle packing and wetting shaders remain separate.\n\n## Loading portable maps\n\nThe PNG encoder preserves the original data-array row order without flipping, resampling or colour conversion. For a Three.js texture loaded from these files, set:\n\n\`\`\`js\nconst loader = new THREE.TextureLoader();\nconst albedo = loader.load('production/textures/coffee-cellular-albedo.png');\nconst height = loader.load('production/textures/coffee-cellular-height.png');\nalbedo.colorSpace = THREE.SRGBColorSpace;\nheight.colorSpace = THREE.NoColorSpace;\nfor (const texture of [albedo, height]) {\n  texture.flipY = false;\n  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;\n  texture.repeat.set(1.8, 1.8);\n  texture.minFilter = THREE.LinearMipmapLinearFilter;\n  texture.magFilter = THREE.LinearFilter;\n  texture.generateMipmaps = true;\n}\nconst material = new THREE.MeshPhysicalMaterial({\n  color: 0x6a4630,\n  map: albedo,\n  bumpMap: height,\n  bumpScale: 0.055,\n  metalness: 0,\n  roughness: 0.96\n});\n\`\`\`\n\nThis snippet loads the portable pixels with the correct colour spaces and filtering into an ordinary UV-mapped material. It is not a replacement for the runtime shader. The runtime varies the bump scale by particle band and macro fragment and uses the triplanar projection below. The texture pair alone does not reproduce the entire rendered material.\n\n## Runtime triplanar projection\n\nVersion 1.1 projects both colour and cellular height in each fragment's object-local space, avoiding the stretched poles of spherical UVs. Coordinates are position × 0.83 plus the particle seed multiplied by (3.13, 1.79, 0.67). Blending weights are the absolute normalized local vertex normal raised to power 8, then normalized by their sum. The three texture planes are YZ, ZX and XY.\n\nThe combined height is 88% of the blended colour's linear-RGB luminance raised to power 0.60 and 12% of this procedural height map sampled at 2.60 times those coordinates. The resulting cellular field also drives roughness, patchy wet coating and local cavity shading. Height derivatives perturb the view normal, scaled by bumpScale × instance scale × group scale so fines keep proportionate relief.\n\nRepeatWrapping still applies. The stored texture repeat, offset and rotation, and the geometry's ordinary UV coordinates, are deliberately ignored by this custom projection. To reproduce the actual material, use the canonical shader in PorousWorld.js together with these images and the separate AI colour map. The plain portable PBR example and texture-free model GLBs do not contain that shader.\n\n## Separate AI material detail\n\nThe curated AI surface-detail overlay remains at [granule.webp](../../public/assets/granule.webp); its full production master is [granule-master.png](../originals/granule-master.png). It is not duplicated here or embedded in the model GLBs. The runtime uses that separate image as the colour map after it loads. Its custom triplanar material derives most surface relief from that same colour image, with 12% original procedural height detail. The two independently sourced image assets remain separate; the runtime computes their combined field in the shader. AI prompts and image-production provenance are documented with the other production assets.\n\n## Reproduce and verify\n\nAfter \`npm ci\`, run from the project directory:\n\n\`\`\`sh\nnode scripts/export-models.mjs\n\`\`\`\n\nThe same command exports both portable geometry snapshots and these textures directly from the actual runtime class. PNG generation uses only Node built-ins, preserves source bytes, writes per-chunk CRCs, and verifies lossless compression. \`textures-manifest.json\` records encoded-file hashes, raw-pixel hashes, source hash and runtime mapping settings. No browser, GPU, network request or additional package is required.\n\n## Rights\n\nThese two procedural textures and their generator are original project assets, distributed under the project's **MIT License**. They require no third-party media attribution. The separate AI image retains the production provenance supplied elsewhere in the project.\n`);
  await writeFile(join(outputDirectory, 'README.md'), `# CREMA — reusable models\n\nThese two self-contained GLB files are exported from the same procedural geometry that the website renders. No external mesh, scan, scientific figure or measured coffee-particle dataset is used.\n\n| Model | Contents | Compatibility | Size |\n|---|---|---|---|\n| \`fractured-coffee-granule.glb\` | The first detailed macro fragment from \`PorousWorld.makeHeroFragments()\`, at its original authored scale. | Core glTF 2.0, standard PBR material. | ${(files[0].bytes / 1024).toFixed(1)} KiB |\n| \`packed-coffee-bed.glb\` | The complete ${instanceCount.toLocaleString('en-US')}-particle desktop bed, in five size bands, at stage ${snapshotStage}. | glTF 2.0 with \`EXT_mesh_gpu_instancing\`. | ${(files[1].bytes / 1024).toFixed(1)} KiB |\n\n## What is preserved\n\nFragment vertex positions, normals and UVs come directly from the runtime meshes. The bed retains the original deterministic particle positions, rotations, scales and instance colours. Its five geometries are shared by the particles, keeping the complete volume compact. The model is centred in its own material coordinates; the website's presentation camera, page offset and cinematic framing are omitted.\n\nThe packed bed requires a viewer or DCC importer that supports \`EXT_mesh_gpu_instancing\`. Importers without that extension may reject it or show only the base fragment forms. The single-fragment file requires no extensions.\n\n## What remains in the website\n\nThese files are portable **dry geometry snapshots** with a plain, texture-free rough brown standard PBR material. The website's cellular material detail, HDR lighting, advancing saturation front, changing roughness, pressure interpretation, tracer transport, path competition and extraction colour progression remain in \`src/visuals/PorousWorld.js\`. Those custom shaders are not glTF material features and are not claimed to be baked into these files. No HDR environment or production image is duplicated inside the GLBs.\n\nThe cinematic granule detail image is supplied separately at \`public/assets/granule.webp\`; its production master and provenance accompany the project. The exact original procedural albedo and height maps are supplied separately in production/textures; their generator remains in the canonical source.\n\n## Scale and scientific interpretation\n\nCoordinates use authored scene units, with **Y up**, X across the bed section and Z into it. They are not particle measurements in millimetres. The deliberately heterogeneous geometry and connected void space are an artistic interpretation of fractured porous coffee. The snapshots are **not measured micro-CT, a permeability prediction, or CFD output**.\n\n## Reproduce\n\nFrom the project directory, after \`npm ci\`:\n\n\`\`\`sh\nnode scripts/export-models.mjs\n\`\`\`\n\nThe command imports the actual runtime class, uses its CPU geometry and packing routines, and writes these models. It needs no browser, GPU, network access or extra packages. It also performs a glTF loader round-trip, confirms particle counts and finite bounds, and checks that the files have no external buffers or embedded textures. Each GLB is limited to 5 MiB.\n\n\`models-manifest.json\` records model hashes, bounds, counts and the SHA-256 of the canonical source used for this snapshot. Run the command again after any geometry changes.\n\n## Rights\n\nThe procedural geometries and export script are original project assets distributed under the project's **MIT License**. No third-party model attribution is required. Three.js and its exporter/loader are used under their MIT terms; the project's dependency notices cover them. AI production-image provenance is documented separately; no AI image is embedded in these GLBs.\n`);
  for (const file of files) {
    process.stdout.write(`${file.filename}: ${(file.bytes / 1024).toFixed(1)} KiB, ${file.instances} instance${file.instances === 1 ? '' : 's'}, round-trip verified\n`);
  }
  for (const file of textureFiles) {
    process.stdout.write(`${file.filename}: ${(file.bytes / 1024).toFixed(1)} KiB, ${file.width} × ${file.height}, exact source RGBA bytes\n`);
  }
} finally {
  for (const resource of owned) resource.dispose();
  world.dispose();
  unusedEnvironment.dispose();
}
