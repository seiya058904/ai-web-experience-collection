import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from '../vendor/three/three.module.js';
import { createMasterModel, MASTER_SPEC } from '../src/model.js';

// Standard glTF 2.0 / GLB export without a browser, GPU, package install or plugin.
// The eighteen structural parts remain named meshes. The physical luminous seam
// becomes an extra primitive in its owning part; runtime glow/edge helpers stay out.
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const outputRoot = path.join(projectRoot, 'models');
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const numeric = (value) => Number(value.toFixed(9));
const usedExtensions = new Set();
const chunks = [];
let byteLength = 0;
let triangleCount = 0;

const gltf = {
  asset: {
    version: '2.0',
    generator: `PARALLAX procedural model exporter / Three.js r${THREE.REVISION}`,
    copyright: 'Original PARALLAX sculpture, created for this project.',
    extras: { units: 'metres by glTF convention; artistic scene scale', upAxis: 'Y' },
  },
  scene: 0,
  scenes: [{ name: 'The Impossible Form — assembled master', nodes: [0] }],
  nodes: [{ name: 'THE_IMPOSSIBLE_FORM', children: [] }],
  meshes: [],
  materials: [],
  textures: [{ name: 'Polished basalt', sampler: 0, source: 0 }],
  samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }],
  images: [],
  accessors: [],
  bufferViews: [],
  buffers: [],
};

function appendBuffer(bytes, target) {
  const padding = (4 - byteLength % 4) % 4;
  if (padding) { chunks.push(Buffer.alloc(padding)); byteLength += padding; }
  const buffer = Buffer.from(bytes);
  const index = gltf.bufferViews.length;
  gltf.bufferViews.push({ buffer: 0, byteOffset: byteLength, byteLength: buffer.length, ...(target ? { target } : {}) });
  chunks.push(buffer);
  byteLength += buffer.length;
  return index;
}

function accessor(array, itemSize, componentType, target, includeBounds = false) {
  const bytes = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
  const result = {
    bufferView: appendBuffer(bytes, target),
    byteOffset: 0,
    componentType,
    count: array.length / itemSize,
    type: { 1: 'SCALAR', 2: 'VEC2', 3: 'VEC3', 4: 'VEC4' }[itemSize],
  };
  if (includeBounds) {
    result.min = Array(itemSize).fill(Infinity);
    result.max = Array(itemSize).fill(-Infinity);
    for (let i = 0; i < array.length; i++) {
      if (!Number.isFinite(array[i])) throw new Error('Model contains a non-finite vertex.');
      const axis = i % itemSize;
      result.min[axis] = Math.min(result.min[axis], array[i]);
      result.max[axis] = Math.max(result.max[axis], array[i]);
    }
  }
  const index = gltf.accessors.length;
  gltf.accessors.push(result);
  return index;
}

function floatAttribute(attribute) {
  const array = new Float32Array(attribute.count * attribute.itemSize);
  for (let i = 0; i < attribute.count; i++) {
    for (let j = 0; j < attribute.itemSize; j++) array[i * attribute.itemSize + j] = attribute.getComponent(i, j);
  }
  return array;
}

function appendGeometry(geometry, materialIndices, primitives) {
  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  const uv = geometry.getAttribute('uv');
  const attributes = { POSITION: accessor(floatAttribute(position), 3, 5126, 34962, true) };
  if (normal) attributes.NORMAL = accessor(floatAttribute(normal), 3, 5126, 34962);
  if (uv) {
    const coordinates = floatAttribute(uv);
    // Source TextureLoader uses flipY=true; glTF images use top-left texture
    // coordinates. Convert V, preserving the visible source texture mapping.
    for (let i = 1; i < coordinates.length; i += 2) coordinates[i] = 1 - coordinates[i];
    attributes.TEXCOORD_0 = accessor(coordinates, 2, 5126, 34962);
  }
  const drawCount = geometry.index ? geometry.index.count : position.count;
  const groups = geometry.groups.length ? geometry.groups : [{ start: 0, count: drawCount, materialIndex: 0 }];
  for (const group of groups) {
    if (!group.count) continue;
    if (group.count % 3 !== 0) throw new Error('Expected triangulated mesh geometry.');
    const IndexArray = position.count > 65535 ? Uint32Array : Uint16Array;
    const indices = new IndexArray(group.count);
    for (let i = 0; i < group.count; i++) {
      indices[i] = geometry.index ? geometry.index.getX(group.start + i) : group.start + i;
    }
    primitives.push({
      attributes,
      indices: accessor(indices, 1, IndexArray === Uint32Array ? 5125 : 5123, 34963),
      material: materialIndices[group.materialIndex] ?? materialIndices[0],
      mode: 4,
    });
    triangleCount += group.count / 3;
  }
}

function physicalMaterial(material, useTexture = false) {
  const entry = {
    name: material.name,
    pbrMetallicRoughness: {
      baseColorFactor: [...material.color.toArray().map(numeric), material.opacity],
      metallicFactor: material.metalness,
      roughnessFactor: material.roughness,
      ...(useTexture ? { baseColorTexture: { index: 0 } } : {}),
    },
    doubleSided: material.side === THREE.DoubleSide,
  };
  if (material.clearcoat > 0) {
    usedExtensions.add('KHR_materials_clearcoat');
    entry.extensions = { KHR_materials_clearcoat: {
      clearcoatFactor: material.clearcoat,
      clearcoatRoughnessFactor: material.clearcoatRoughness,
    } };
  }
  return entry;
}

function padded(buffer, value = 0) {
  const padding = (4 - buffer.length % 4) % 4;
  return padding ? Buffer.concat([buffer, Buffer.alloc(padding, value)]) : buffer;
}

function packGlb(document, binary) {
  const json = padded(Buffer.from(JSON.stringify(document)), 0x20);
  const bin = padded(binary);
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + json.length + 8 + bin.length, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(json.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binaryHeader = Buffer.alloc(8);
  binaryHeader.writeUInt32LE(bin.length, 0);
  binaryHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, json, binaryHeader, bin]);
}

const texture = new THREE.Texture();
texture.colorSpace = THREE.SRGBColorSpace;
texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
const model = createMasterModel({ stoneMap: texture });

try {
  const basalt = await readFile(path.join(projectRoot, 'public/assets/basalt.png'));
  gltf.images.push({ name: 'Polished basalt albedo', bufferView: appendBuffer(basalt), mimeType: 'image/png' });
  gltf.materials.push(physicalMaterial(model.materials.stone, true));
  gltf.materials.push(physicalMaterial(model.materials.chrome));
  usedExtensions.add('KHR_materials_unlit');
  gltf.materials.push({
    name: model.materials.slit.name,
    pbrMetallicRoughness: {
      baseColorFactor: [...model.materials.slit.color.toArray().map(numeric), 1],
      metallicFactor: 0,
      roughnessFactor: 1,
    },
    extensions: { KHR_materials_unlit: {} },
  });

  const names = new Set();
  for (const fragment of model.fragments) {
    if (!fragment.name || names.has(fragment.name)) throw new Error('Fragment names must be present and unique.');
    names.add(fragment.name);
    const primitives = [];
    appendGeometry(fragment.geometry, [0, 1], primitives);
    for (const child of fragment.children) {
      if (!child.isMesh || child.material !== model.materials.slit) continue;
      child.updateMatrix();
      const geometry = child.geometry.clone().applyMatrix4(child.matrix);
      appendGeometry(geometry, [2], primitives);
      geometry.dispose();
    }
    const meshIndex = gltf.meshes.length;
    gltf.meshes.push({ name: fragment.name, primitives });
    const nodeIndex = gltf.nodes.length;
    gltf.nodes.push({
      name: fragment.name,
      mesh: meshIndex,
      translation: fragment.position.toArray(),
      rotation: fragment.quaternion.toArray(),
      scale: fragment.scale.toArray(),
      extras: {
        fragmentId: fragment.userData.fragmentId,
        restPosition: fragment.userData.restPosition,
        rayScale: fragment.userData.spec.rayScale,
        authoredSpecification: fragment.userData.spec,
      },
    });
    gltf.nodes[0].children.push(nodeIndex);
  }
  gltf.nodes[0].extras = { masterSpec: MASTER_SPEC, fragmentCount: model.fragments.length };
  gltf.extensionsUsed = [...usedExtensions].sort();
  gltf.buffers.push({ byteLength });
  const binary = Buffer.concat(chunks);
  const glb = packGlb(gltf, binary);
  const modelSource = await readFile(path.join(projectRoot, 'src/model.js'));
  const bounds = new THREE.Box3().setFromObject(model.group);
  const manifest = {
    format: 'PARALLAX procedural master model',
    export: 'models/impossible-form.glb',
    formatVersion: 'glTF 2.0 / binary GLB',
    modelSource: 'src/model.js',
    exporterSource: 'scripts/export-model.mjs',
    modelSourceSha256: sha256(modelSource),
    exportSha256: sha256(glb),
    exportBytes: glb.length,
    threeRevision: THREE.REVISION,
    structuralPartCount: model.fragments.length,
    structuralPartNames: [...names],
    triangleCount,
    sourceBounds: { min: bounds.min.toArray(), max: bounds.max.toArray() },
    coordinates: 'Y-up, right-handed; assembled source pose; artistic scene units',
    masterSpec: MASTER_SPEC,
    fragments: model.specs,
    materials: gltf.materials,
    texture: { source: 'public/assets/basalt.png', sha256: sha256(basalt), embeddedInGlb: true },
    representation: {
      geometry: 'Source beveled geometry, normals and named part transforms. UV V is converted to glTF texture convention while preserving the source mapping.',
      materials: 'PBR base colour, roughness, metalness, clearcoat and a physical unlit luminous seam.',
      runtimeOnly: ['height-based bump shading', 'environment lighting', 'moving planar reflection', 'membrane refraction', 'chapter animation', 'edge glow helpers'],
      runtimeSources: ['src/spatial.js', 'src/spatial-math.js', 'src/optics.js', 'src/timeline.js'],
    },
  };
  await mkdir(outputRoot, { recursive: true });
  await writeFile(path.join(outputRoot, 'impossible-form.glb'), glb);
  await writeFile(path.join(outputRoot, 'impossible-form.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Exported ${model.fragments.length} named structural parts and ${triangleCount} triangles.`);
  console.log(`Standalone GLB, with embedded basalt texture: ${glb.length} bytes.`);
  console.log(`Model source SHA-256: ${manifest.modelSourceSha256}`);
  console.log(`GLB SHA-256: ${manifest.exportSha256}`);
} finally {
  model.dispose();
  texture.dispose();
}
