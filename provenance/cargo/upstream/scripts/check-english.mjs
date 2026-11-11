import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DEFAULT_ROOT = fileURLToPath(new URL('..', import.meta.url));
const EXTENSIONS = new Set(['.html', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.css', '.md', '.json']);
const IGNORED_DIRECTORIES = new Set([
  'node_modules', 'dist', 'build', '.git', '.vite', '.cache', 'coverage',
  'evidence', 'screenshots', 'test-results', 'playwright-report', 'browser-profiles',
]);
const IGNORED_FILES = new Set(['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lock', 'bun.lockb']);
const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
// These catch unfinished user-facing copy, not arbitrary discussions in documentation.
const UNFINISHED_COPY = /\b(?:lorem\s+ipsum|coming\s+soon|TODO[_ :.-]*TRANSLAT(?:E|ION)|__MISSING_TRANSLATION__|UNTRANSLATED_TEXT)\b/iu;

async function collectFiles(directory, root, result) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isSymbolicLink()) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) await collectFiles(absolute, root, result);
    } else if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name).toLowerCase()) && !IGNORED_FILES.has(entry.name)) {
      result.push({ absolute, relative: path.relative(root, absolute).split(path.sep).join('/') });
    }
  }
}

/** A language guard only: English quality and image lettering still need visual review. */
export async function checkEnglish(root = DEFAULT_ROOT) {
  const absoluteRoot = path.resolve(root);
  const files = [];
  await collectFiles(absoluteRoot, absoluteRoot, files);
  const issues = [];
  for (const file of files) {
    const text = await readFile(file.absolute, 'utf8');
    const lines = text.split(/\r?\n/u);
    const isAuthoredInterface = /(?:^|\/)(?:src|public)\//u.test(file.relative) || file.relative === 'index.html';
    lines.forEach((line, index) => {
      if (CJK.test(line)) issues.push({ file: file.relative, line: index + 1, kind: 'Non-English CJK text', excerpt: line.trim().slice(0, 160) });
      if (isAuthoredInterface && UNFINISHED_COPY.test(line)) issues.push({ file: file.relative, line: index + 1, kind: 'Unfinished or untranslated interface copy', excerpt: line.trim().slice(0, 160) });
    });
    if (file.relative === 'index.html' && !/<html\b[^>]*\blang\s*=\s*["']en["']/iu.test(text)) {
      issues.push({ file: file.relative, line: 1, kind: 'Document language must be en', excerpt: 'Missing <html lang="en">.' });
    }
  }
  return { root: absoluteRoot, filesChecked: files.length, issues };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const result = await checkEnglish(process.argv[2] ?? DEFAULT_ROOT);
    if (!result.filesChecked) {
      console.error('CARGO English guard failed: no authored text files were found.');
      process.exitCode = 1;
    } else {
      for (const issue of result.issues) console.error(`${issue.file}:${issue.line}: ${issue.kind}\n  ${issue.excerpt}`);
      console.log(`CARGO English guard: ${result.filesChecked} authored files checked; ${result.issues.length} issues.`);
      console.log('This guard checks script and unfinished-copy patterns. English prose and image text also require human review.');
      if (result.issues.length) process.exitCode = 1;
    }
  } catch (error) {
    console.error(`CARGO English guard failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
