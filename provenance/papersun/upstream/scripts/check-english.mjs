import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve from this script, so the check has the same coverage from any cwd.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const roots = ['src', 'docs', 'public/story.html', 'index.html', 'README.md', 'VISUAL-BIBLE.md'];
const textExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.html', '.md', '.json', '.svg', '.txt']);
const files = [];
const failures = [];
const cjk = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af\uff65-\uff9f]/u;
const dummy = /\b(?:lorem\s+ipsum|dolor\s+sit\s+amet|coming\s+soon|tbd|your\s+(?:company|name|headline)\s+here|(?:insert|replace)\s+(?:your\s+)?(?:text|copy|content)\s+here|sample\s+headline)\b|\bto[ -]?do\s*:/iu;
// Match a literal unfinished UI value, while allowing prose to name the check.
const placeholderValue = /(?:["'>]\s*|\[\s*)placeholder\s+(?:text|copy)\s*(?:["'<]|\])/iu;

async function collect(relative) {
  const absolute = path.join(root, relative);
  let info;
  try { info = await stat(absolute); }
  catch (error) {
    if (error.code === 'ENOENT' && ['README.md', 'VISUAL-BIBLE.md'].includes(relative)) return;
    throw error;
  }
  if (info.isDirectory()) {
    const entries = await readdir(absolute, { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.isSymbolicLink()) continue;
      await collect(path.join(relative, entry.name));
    }
  } else if (info.isFile() && textExtensions.has(path.extname(relative))) {
    files.push(relative);
  }
}

function decodeCharacterReferences(line) {
  return line
    .replace(/\\u\{([0-9a-f]{1,6})\}|\\u([0-9a-f]{4})/gi, (match, braced, short) => {
      const code = Number.parseInt(braced ?? short, 16);
      return code <= 0x10ffff ? String.fromCodePoint(code) : match;
    })
    .replace(/&#x([0-9a-f]+);|&#(\d+);/gi, (match, hex, decimal) => {
      const code = Number.parseInt(hex ?? decimal, hex ? 16 : 10);
      return code <= 0x10ffff ? String.fromCodePoint(code) : match;
    });
}

for (const relative of roots) await collect(relative);
for (const relative of files) {
  const text = await readFile(path.join(root, relative), 'utf8');
  for (const [index, line] of text.split(/\r?\n/u).entries()) {
    const decoded = decodeCharacterReferences(line);
    if (cjk.test(decoded)) failures.push(`${relative}:${index + 1}: unintended CJK text`);
    const marker = decoded.match(dummy) ?? decoded.match(placeholderValue);
    if (marker) failures.push(`${relative}:${index + 1}: unfinished copy marker (${marker[0]})`);
  }
  if (relative === 'index.html' || relative === 'public/story.html') {
    if (!/<html\b[^>]*\blang\s*=\s*["']en["']/iu.test(text)) failures.push(`${relative}: document language must be en`);
  }
}

if (failures.length) {
  console.error(`English content check failed: ${failures.length} issue${failures.length === 1 ? '' : 's'} in ${files.length} files.`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`English content check passed: ${files.length} files; no unintended CJK or unfinished copy markers; both documents declare lang="en".`);
  console.log('This automated guard complements, and does not replace, English proofreading.');
}
