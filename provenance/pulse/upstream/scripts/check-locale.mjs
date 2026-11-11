#!/usr/bin/env node
/** English-only source guard. This is not an English grammar checker. */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const externalDirectories = new Set([
  'node_modules', 'vendor', 'vendors', 'third-party', 'third_party',
  'dist', 'coverage', '.git', '.cache', 'evidence', 'generated_images',
]);
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.html', '.svg', '.json']);
const unintendedScript = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu;

export function findLocaleIssues(text, filename) {
  const issues = [];
  const lines = text.split(/\r?\n/);
  for (let line = 0; line < lines.length; line += 1) {
    for (const match of lines[line].matchAll(unintendedScript)) {
      issues.push({
        file: filename,
        line: line + 1,
        column: match.index + 1,
        reason: `Unexpected non-English script U+${match[0].codePointAt(0).toString(16).toUpperCase()}`,
      });
    }
  }
  return issues;
}

function collectFiles(path) {
  if (!existsSync(path)) return [];
  const stat = statSync(path);
  if (!stat.isDirectory()) return sourceExtensions.has(extname(path)) ? [path] : [];
  const result = [];
  for (const entry of readdirSync(path, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    // Do not follow external/package symlinks into unrelated source trees.
    if (entry.isSymbolicLink() || externalDirectories.has(entry.name)) continue;
    if (entry.isDirectory()) result.push(...collectFiles(join(path, entry.name)));
    else if (sourceExtensions.has(extname(entry.name))) result.push(join(path, entry.name));
  }
  return result;
}

export function scanProject(root) {
  const filenames = [...new Set([
    ...collectFiles(join(root, 'src')),
    ...collectFiles(join(root, 'public')),
    ...collectFiles(join(root, 'index.html')),
  ])].sort();
  const issues = [];
  for (const filename of filenames) {
    const text = readFileSync(filename, 'utf8');
    const displayName = relative(root, filename).split('\\').join('/');
    issues.push(...findLocaleIssues(text, displayName));
    if (filename === join(root, 'index.html') && !/<html\b[^>]*\blang\s*=\s*['"]en['"]/i.test(text)) {
      issues.push({ file: displayName, line: 1, column: 1, reason: 'The root HTML element must declare lang="en".' });
    }
  }
  return {
    status: issues.length === 0 ? 'PASS' : 'FAIL',
    filesScanned: filenames.length,
    htmlChecked: existsSync(join(root, 'index.html')),
    files: filenames.map(f => relative(root, f).split('\\').join('/')),
    issues,
    limitation: 'Source-script guard only. Real visible text, metadata, alt/aria strings, and English prose still require browser review.',
  };
}

const executedDirectly = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (executedDirectly) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const report = scanProject(root);
  if (process.argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(`English source guard: ${report.status} (${report.filesScanned} authored public files).\n`);
    for (const issue of report.issues) {
      process.stderr.write(`${issue.file}:${issue.line}:${issue.column} ${issue.reason}\n`);
    }
    if (!report.htmlChecked) process.stdout.write('Root index.html is not present; the HTML language check has not run yet.\n');
    process.stdout.write(`${report.limitation}\n`);
  }
  process.exitCode = report.issues.length > 0 ? 1 : 0;
}
