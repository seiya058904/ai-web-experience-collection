import { readFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const failures = [];
const manifest = [];

async function checkFile(relative) {
  try {
    const bytes = await readFile(path.join(root, relative));
    if (!bytes.length) throw new Error('Empty file');
    if (relative.endsWith('.webp') && (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP')) {
      throw new Error('Invalid WebP signature');
    }
    manifest.push({ path: relative, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  } catch (error) {
    failures.push({ path: relative, error: error.message });
  }
}

const assets = (await readdir(path.join(root, 'public/media'))).filter(name => name.endsWith('.webp')).sort();
for (const name of assets) {
  await checkFile(`public/media/${name}`);
  await checkFile(`dist/media/${name}`);
  const source = manifest.find(item => item.path === `public/media/${name}`);
  const built = manifest.find(item => item.path === `dist/media/${name}`);
  if (source && built && source.sha256 !== built.sha256) failures.push({ path: built.path, error: 'Build copy differs from source' });
}

const generation = JSON.parse(await readFile(path.join(root, 'art-direction/generation-record.json'), 'utf8'));
for (const name of (await readdir(path.join(root, 'art-direction'))).filter(name => name.endsWith('.webp') || name.endsWith('.prompt.txt')).sort()) {
  await checkFile(`art-direction/${name}`);
}

const index = await readFile(path.join(root, 'dist/index.html'), 'utf8');
for (const match of index.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)) await checkFile(`dist/${match[1].slice(2)}`);
for (const name of (await readdir(path.join(root, 'dist/assets'))).filter(name => name.endsWith('.css'))) {
  const css = await readFile(path.join(root, 'dist/assets', name), 'utf8');
  for (const match of css.matchAll(/url\(\s*["']?(\.\/[^"')]+)["']?\s*\)/g)) {
    await checkFile(`dist/assets/${match[1].slice(2)}`);
  }
}
for (const name of ['hero.webp', 'hero-mobile.webp', 'road.webp', 'rail.webp', 'yard.webp', 'lift.webp', 'sea.webp', 'shore.webp']) {
  if (!assets.includes(name)) failures.push({ path: `public/media/${name}`, error: 'Required runtime composition missing' });
}
const unique = [...new Map(manifest.map(item => [item.path, item])).values()];
const result = {
  status: failures.length ? 'FAIL' : 'PASS',
  scope: 'Local asset existence, file signatures, production-copy hashes, entry references and bundled font paths. Not HTTP or browser validation.',
  retainedImageCount: unique.filter(item => item.path.startsWith('art-direction/') && item.path.endsWith('.webp')).length,
  productionMediaCount: assets.length,
  productionMediaBytes: unique.filter(item => item.path.startsWith('public/media/')).reduce((sum, item) => sum + item.bytes, 0),
  generationRecordPresent: Boolean(generation),
  filesChecked: unique.length,
  failures,
  files: unique,
};
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 1;
