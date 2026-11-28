import test from 'node:test';
import assert from 'node:assert/strict';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

test('the shared ORBITAL and AURORA texture is smaller and decodes to the original pixels', async () => {
  const png = fileURLToPath(new URL('../public/orbital/media/earth-texture.png', import.meta.url));
  const webp = fileURLToPath(new URL('../public/orbital/media/earth-texture.webp', import.meta.url));
  const [source, compressed] = await Promise.all([png, webp].map(path => sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true })));
  assert.equal(compressed.info.width, source.info.width);
  assert.equal(compressed.info.height, source.info.height);
  assert.ok(compressed.data.equals(source.data));
  const [sourceSize, compressedSize] = await Promise.all([png, webp].map(path => stat(path)));
  assert.ok(compressedSize.size < sourceSize.size);
});
