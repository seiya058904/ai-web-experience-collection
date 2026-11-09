#!/usr/bin/env node
/** Portable integrity check. No original PNGs or image utilities are required. */
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestBytes = await readFile(path.join(root, 'public/assets/manifest.json'));
const manifest = JSON.parse(manifestBytes.toString('utf8'));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
let checkedImageFiles = 0;
let checkedEmbeddedPreviews = 0;
const checkedPaths = new Set();

async function checkFile(file, metadata) {
  if (checkedPaths.has(file)) throw new Error(`Duplicate manifest image path: ${file}`);
  checkedPaths.add(file);
  const bytes = await readFile(file);
  if (bytes.length !== metadata.bytes) throw new Error(`Byte count mismatch: ${metadata.path}`);
  if (sha256(bytes) !== metadata.sha256) throw new Error(`SHA-256 mismatch: ${metadata.path}`);
  if (bytes.subarray(0, 4).toString() !== 'RIFF' || bytes.subarray(8, 12).toString() !== 'WEBP') {
    throw new Error(`Not a WebP image: ${metadata.path}`);
  }
  checkedImageFiles += 1;
}

for (const asset of manifest.assets) {
  for (const variant of ['full', 'small', 'preview']) {
    const metadata = asset[variant];
    if (!metadata || !/^assets\/[a-z0-9-]+\.webp$/.test(metadata.path)) throw new Error(`Invalid ${variant} path for ${asset.name}`);
    await checkFile(path.join(root, 'public', metadata.path), metadata);
  }
  if (Math.max(asset.preview.width, asset.preview.height) !== 480 || asset.previewQuality !== 80) {
    throw new Error(`Unexpected recovery preview preparation: ${asset.name}`);
  }
  const prefix = 'data:image/webp;base64,';
  if (!asset.previewDataUri?.startsWith(prefix)) throw new Error(`Missing embedded preview: ${asset.name}`);
  const embedded = Buffer.from(asset.previewDataUri.slice(prefix.length), 'base64');
  if (embedded.length !== asset.preview.bytes || sha256(embedded) !== asset.preview.sha256) {
    throw new Error(`Embedded preview differs from prepared file: ${asset.name}`);
  }
  checkedEmbeddedPreviews += 1;
}

for (const concept of manifest.concepts) {
  if (!/^docs\/concepts\/[a-z0-9-]+\.webp$/.test(concept.path)) throw new Error(`Invalid concept path: ${concept.path}`);
  await checkFile(path.join(root, concept.path), concept);
}
for (let number = 1; number <= 8; number += 1) {
  const id = `IMG-${String(number).padStart(2, '0')}`;
  if (manifest.concepts.filter((concept) => concept.id === id).length !== 1) throw new Error(`Required concept missing or duplicated: ${id}`);
}
for (const name of await readdir(path.join(root, 'public/assets'))) {
  if (name.endsWith('.pending.webp')) throw new Error(`Incomplete conversion remains: ${name}`);
}
if (manifest.criticalArt?.path !== 'src/critical-art.ts') throw new Error('Missing critical Hero preview module metadata.');
const criticalArt = await readFile(path.join(root, manifest.criticalArt.path));
if (criticalArt.length !== manifest.criticalArt.bytes || sha256(criticalArt) !== manifest.criticalArt.sha256) {
  throw new Error('critical-art.ts differs from the prepared module.');
}
for (const [exportName, imageName] of [['heroPreview', 'hero'], ['heroMobilePreview', 'hero-mobile']]) {
  const match = criticalArt.toString('utf8').match(new RegExp(`export const ${exportName} = ("[^"\\n]+");`));
  if (!match || JSON.parse(match[1]) !== manifest.assets.find((asset) => asset.name === imageName)?.previewDataUri) {
    throw new Error(`Critical preview differs from the selected image: ${exportName}`);
  }
}

console.log(JSON.stringify({
  checkedImageFiles,
  checkedEmbeddedPreviews,
  runtimeAssets: manifest.assets.length,
  requiredConcepts: manifest.concepts.length,
  generationCounts: manifest.generationCounts,
  fullBytes: manifest.assets.reduce((sum, asset) => sum + asset.full.bytes, 0),
  smallBytes: manifest.assets.reduce((sum, asset) => sum + asset.small.bytes, 0),
  previewBytes: manifest.assets.reduce((sum, asset) => sum + asset.preview.bytes, 0),
  conceptBytes: manifest.concepts.reduce((sum, concept) => sum + concept.bytes, 0),
  manifestBytes: manifestBytes.length,
  manifestSha256: sha256(manifestBytes),
  criticalArtBytes: criticalArt.length,
  criticalArtSha256: sha256(criticalArt),
}, null, 2));
