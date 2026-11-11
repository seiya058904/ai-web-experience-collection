import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
const roots = ['src', 'docs', 'index.html', 'README.md', 'VISUAL-BIBLE.md', 'DESIGN.md', 'PRODUCT.md', 'public/reading.html', 'art/asset-provenance.json'];
const failures = [];
let checked = 0;
const cjk = /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/u;
async function visit(path) {
  try {
    const entries = await readdir(path, { withFileTypes: true });
    for (const entry of entries) await visit(join(path, entry.name));
  } catch (error) {
    if (error.code === 'ENOENT') return;
    if (error.code !== 'ENOTDIR') throw error;
    if (!/\.(?:html|ts|js|css|md|json)$/i.test(path)) return;
    const text = await readFile(path, 'utf8');
    checked += 1;
    if (cjk.test(text)) failures.push(path);
  }
}
for (const root of roots) await visit(root);
if (failures.length) {
  console.error('Unexpected CJK characters:', failures.join(', '));
  process.exitCode = 1;
} else console.log(`English-only character guard: ${checked} authored text files checked.`);
