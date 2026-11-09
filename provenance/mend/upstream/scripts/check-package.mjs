#!/usr/bin/env node
/** Static package integrity checks. These do not claim browser or visual QA. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const html = read('index.html');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
const errors = [];
const idSet = new Set(ids);
if (idSet.size !== ids.length) errors.push('Duplicate HTML IDs.');
if (!/<html\s+lang="en"/.test(html)) errors.push('Missing English document language.');
if ((html.match(/<section class="chapter\b/g) || []).length !== 10) errors.push('Expected ten chapters.');
for (const match of html.matchAll(/\b(?:aria-labelledby|aria-controls)="([^"]+)"/g)) {
  for (const id of match[1].split(/\s+/)) if (!idSet.has(id)) errors.push('Unknown accessible ID: ' + id);
}
const main = read('src/main.ts');
for (const match of main.matchAll(/\$(?:<[^>]+>)?\(\s*['"]([^'"]+)['"]\s*\)/g)) {
  if (!idSet.has(match[1])) errors.push('Unknown controller ID: ' + match[1]);
}
for (const name of ['index.html', 'src/main.ts', 'src/state.ts', 'src/diagrams.ts']) {
  if (/[\u3400-\u9fff]/u.test(read(name))) errors.push('Unexpected CJK in authored UI source: ' + name);
}
const dist = path.join(root, 'dist');
const outputHtml = read('dist/index.html');
const resourceFiles = new Set();
function resource(value, base) {
  if (!value || /^(?:data:|blob:|https?:|#)/i.test(value)) return;
  const target = path.resolve(base, value.replace(/[?#].*$/, ''));
  if (!target.startsWith(dist + path.sep)) errors.push('Resource escapes dist: ' + value);
  else if (!fs.existsSync(target)) errors.push('Missing resource: ' + path.relative(root, target));
  else resourceFiles.add(target);
}
for (const tag of outputHtml.matchAll(/<(?:img|source|script|link)\b[^>]*>/g)) {
  for (const attr of tag[0].matchAll(/\b(?:src|srcset|href)="([^"]+)"/g)) resource(attr[1], dist);
}
for (const name of fs.readdirSync(path.join(dist, 'assets')).filter(n => n.endsWith('.css'))) {
  const file = path.join(dist, 'assets', name);
  const css = fs.readFileSync(file, 'utf8');
  for (const match of css.matchAll(/url\(["']?([^\s)'";]+)["']?\)/g)) resource(match[1], path.dirname(file));
}
for (const name of ['hero-desktop', 'hero-mobile', 'inspection', 'underside', 'repair-A', 'repair-B', 'long-road', 'long-road-B', 'paint-texture']) {
  resource('art/' + name + '.webp', dist);
}
const report = {
  scope: 'Static source and packaged-asset integrity; not rendered verification',
  pass: errors.length === 0, chapters: 10, uniqueHtmlIds: idSet.size,
  localResourcesChecked: resourceFiles.size, errors,
};
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
