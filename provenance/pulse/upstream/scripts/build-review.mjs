import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const snapshot = await readFile(resolve(root, 'preview/pulse.html'), 'utf8');
let suite = '';
try { suite = (await readFile(resolve(root, 'tests/browser-suite.mjs'), 'utf8')).replace(/export\s+/g, ''); } catch { /* A review frame is useful before the suite exists. */ }
const buildInfo = { offlineSha256: createHash('sha256').update(snapshot).digest('hex'), createdAt: new Date().toISOString(), mode: 'embedded production HTML; true iframe CSS viewport' };
const payload = JSON.stringify(snapshot).replaceAll('<', '\\u003c');
const probes = (await readFile(resolve(root, 'tests/manual-probes.mjs'), 'utf8')).replace(/export\s+/g, '');
const template = await readFile(resolve(root, 'tests/browser-review-template.html'), 'utf8');
await writeFile(resolve(root, 'pulse-review.html'), template.replace('/*__SNAPSHOT__*/', payload).replace('/*__SUITE__*/', suite).replace('/*__BUILD__*/', JSON.stringify(buildInfo)).replace('/*__PROBES__*/', probes));
console.log('Created isolated HTTP review page with the complete production snapshot embedded.');

await mkdir(resolve(root, 'dist/qa-retry'), { recursive: true });
await writeFile(resolve(root, 'dist/qa-retry/hero-desktop.webp'), 'PULSE QA: initial image deliberately fails decoding.');
