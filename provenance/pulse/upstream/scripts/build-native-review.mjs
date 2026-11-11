import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [snapshot, probe] = await Promise.all([
  readFile(resolve(root, 'preview/pulse.html'), 'utf8'),
  readFile(resolve(root, 'tests/native-probe.mjs'), 'utf8'),
]);
const build = {
  offlineSha256: createHash('sha256').update(snapshot).digest('hex'),
  createdAt: new Date().toISOString(),
  mode: 'Top-level production snapshot with test-only native diagnostics',
};
const charset = /<meta\s+charset=["']UTF-8["']\s*\/?>/i;
if (!charset.test(snapshot)) throw new Error('Expected an early UTF-8 charset declaration in the offline snapshot.');
const metadata = JSON.stringify(build).replaceAll('<', '\\u003c');
const recorder = probe.replace(/<\/script/gi, '<\\/script');
// Keep the charset first for file:// decoding, then register observers before
// the deferred production module. Replacement callbacks preserve literal $.
const html = snapshot.replace(charset, match => `${match}\n<script id="pulse-native-review-build" type="application/json">${metadata}</script>\n<script>${recorder}</script>`);
await mkdir(resolve(root, 'dist'), { recursive: true });
await writeFile(resolve(root, 'dist/pulse-native-review.html'), html);
console.log(`Created dist/pulse-native-review.html from offline SHA-256 ${build.offlineSha256}. Measurements are NOT TESTED until the page is opened and its controls are used.`);
