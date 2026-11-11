import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chapters, routes, morningTraces, aboutCopy } from '../src/content.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const errors = [];
let checks = 0;
const check = (condition, message) => { checks++; if (!condition) errors.push(message); };
const escapeHtml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const expectedHeadings = [
  'Someone is still awake.', 'Different places. One night.', 'The first loaf starts in darkness.',
  'Care has no closing hour.', 'Morning has to be made.', 'The interval belongs to the workers.',
  'The city carries water in silence.', 'Continuity is a kind of care.', 'Color arrives by hand.',
  'The first passengers arrive.', 'By morning, the traces remain.',
];
const ids = new Set(chapters.map(chapter => chapter.id));
check(chapters.length === 11 && ids.size === 11, 'The content must contain eleven unique chapters.');
check(new Set(chapters.map(chapter => chapter.heading)).size === 11, 'Primary chapter headings must be distinct.');
check(new Set(chapters.map(chapter => chapter.body)).size === 11, 'Primary chapter bodies must be distinct.');
chapters.forEach((chapter, index) => {
  check(chapter.id === `ch-${String(index + 1).padStart(2, '0')}`, `Chapter order is incorrect at ${index + 1}.`);
  check(chapter.heading === expectedHeadings[index], `Required primary heading changed: ${chapter.id}.`);
  check(Boolean(chapter.body && chapter.beatTitle && chapter.beatBody && chapter.alt), `A chapter is missing a meaningful beat or image alternative: ${chapter.id}.`);
});
check(routes.length === 6 && routes[0].id === 'all', 'Expected All routes plus five category filters.');
check(new Set(routes.map(route => route.id)).size === 6, 'Route identifiers must be unique.');
for (const route of routes) {
  check(ids.has(route.chapterId), `Unknown route target: ${route.id}.`);
  check(route.chapterIds.length > 0 && route.chapterIds.every(id => ids.has(id)), `Unknown matching chapter in route: ${route.id}.`);
  check(route.points.length > 0 && route.points.every(point => point.x >= 0 && point.x <= 1000 && point.y >= 0 && point.y <= 650 && point.label), `Invalid atlas coordinates or labels: ${route.id}.`);
}
check(morningTraces.length === 6 && new Set(morningTraces.map(trace => trace.id)).size === 6, 'Expected six unique morning traces.');
morningTraces.forEach(trace => check(ids.has(trace.chapterId) && trace.before && trace.after, `Incomplete morning trace: ${trace.id}.`));
check(aboutCopy.some(copy => copy.includes('fictional')), 'The fictional context must be explicit.');

const sources = new Map();
async function collect(relative) {
  const absolute = path.join(root, relative);
  let info;
  try { info = await stat(absolute); } catch { check(false, `Missing authored file or directory: ${relative}.`); return; }
  if (info.isDirectory()) {
    for (const entry of await readdir(absolute, { withFileTypes: true })) {
      if (entry.isDirectory() || /\.(?:ts|css|html|md|json|svg|mjs)$/i.test(entry.name)) await collect(path.join(relative, entry.name));
    }
  } else sources.set(relative.split(path.sep).join('/'), await readFile(absolute, 'utf8'));
}
for (const relative of ['src', 'index.html', 'public/story.html', 'docs', 'README.md']) await collect(relative);
const cjk = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
for (const [name, text] of sources) {
  check(!cjk.test(text), `Unexpected CJK text in ${name}.`);
  if (name.startsWith('src/') || name === 'index.html' || name === 'public/story.html') {
    check(!/(?:src|srcset|poster)\s*=\s*["']\s*(?:https?:)?\/\//i.test(text), `External runtime media URL in ${name}.`);
    check(!/url\(\s*["']?\s*(?:https?:)?\/\//i.test(text), `External CSS asset URL in ${name}.`);
    check(!/<link\b[^>]*href\s*=\s*["']\s*(?:https?:)?\/\//i.test(text), `External runtime stylesheet or font URL in ${name}.`);
    for (const match of text.matchAll(/<(input|select|textarea)\b[^>]*>/gi)) {
      const tag = match[0];
      if (/type\s*=\s*["']hidden["']/i.test(tag)) continue;
      const id = tag.match(/\bid\s*=\s*["']([^"']+)["']/i)?.[1];
      const hasAccessibleName = /aria-(?:label|labelledby)\s*=\s*["'][^"']+["']/i.test(tag) || (id && text.includes(`for="${id}"`));
      check(Boolean(hasAccessibleName), `A form field lacks an explicit label in ${name}: ${tag}.`);
    }
  }
}

const still = sources.get('public/story.html') || '';
check(/<html\s+lang="en"/.test(still), 'The still edition must declare English.');
check(/<html\s+lang="en"/.test(sources.get('index.html') || ''), 'The interactive entry must declare English.');
check(!/<script\b/i.test(still), 'The still edition must not require or include JavaScript.');
check([...still.matchAll(/<section\b[^>]*\bid="ch-\d{2}"/g)].length === 11, 'The generated still edition must contain eleven chapter sections.');
for (const chapter of chapters) {
  check(still.includes(`id="${chapter.id}"`), `Still chapter anchor missing: ${chapter.id}.`);
  check(still.includes(escapeHtml(chapter.heading)) && still.includes(escapeHtml(chapter.body)), `Primary copy missing from still edition: ${chapter.id}.`);
  check(still.includes(escapeHtml(chapter.beatTitle)) && still.includes(escapeHtml(chapter.beatBody)), `Second beat missing from still edition: ${chapter.id}.`);
}
for (const route of routes.filter(route => route.id !== 'all')) check(still.includes(escapeHtml(route.sentence)) && still.includes(`href="#${route.chapterId}"`), `Still route outcome missing: ${route.id}.`);
for (const trace of morningTraces) check(still.includes(escapeHtml(trace.before)) && still.includes(escapeHtml(trace.after)) && still.includes(`id="trace-${trace.id}"`), `Still morning trace missing: ${trace.id}.`);
const stillIds = new Set([...still.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
for (const match of still.matchAll(/href="#([^"]+)"/g)) check(stillIds.has(match[1]), `Broken still-edition fragment: #${match[1]}.`);
for (const match of still.matchAll(/<img\b[^>]*>/g)) check(/\balt="[^"]+"/.test(match[0]), 'A still-edition image has no meaningful alternative text.');
check(still.includes('./media/hero-mobile.webp'), 'The still edition needs the authored portrait hero.');

const mediaKeys = new Set([...chapters.map(chapter => chapter.image), ...morningTraces.map(trace => trace.image), 'hero-mobile', 'bakery-after', 'curb-after', 'market-after', 'rail-water-midpoint']);
for (const [name, text] of sources) if (name.startsWith('src/') || name === 'index.html' || name === 'public/story.html') {
  for (const match of text.matchAll(/(?:\.\/|\/)?media\/([a-z0-9-]+)\.webp/g)) mediaKeys.add(match[1]);
}
const publicMedia = path.join(root, 'public/media');
for (const entry of await readdir(publicMedia, { withFileTypes: true })) if (entry.isFile() && entry.name.endsWith('.webp')) mediaKeys.add(entry.name.slice(0, -5));
for (const key of mediaKeys) {
  for (const relative of [`public/media/${key}.webp`, `public/media/fallback/${key}.webp`]) {
    try {
      const bytes = await readFile(path.join(root, relative));
      check(bytes.length > 20 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP', `Invalid or empty WebP: ${relative}.`);
    } catch { check(false, `Missing local media or target-specific fallback: ${relative}.`); }
  }
}
for (const key of ['bakery-before', 'bakery-after', 'curb-before', 'curb-after', 'market', 'market-after']) check(still.includes(`./media/${key}.webp`), `Still comparison state missing: ${key}.`);

const result = {
  status: errors.length ? 'FAIL' : 'PASS',
  scope: 'Static source, content, asset-presence and generated still-edition checks only.',
  browserVerification: 'NOT RUN by this script; use the separate browser evidence.',
  checks,
  authoredFilesScanned: sources.size,
  chapters: chapters.length,
  routeFilters: routes.length,
  morningTraces: morningTraces.length,
  mediaKeysWithFallbacksChecked: mediaKeys.size,
  errors,
};
console.log(JSON.stringify(result, null, 2));
if (errors.length) process.exitCode = 1;
