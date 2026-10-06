import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';
import assert from 'node:assert/strict';

const root = resolve('dist');
const home = await readFile(join(root, 'index.html'), 'utf8');
const base = home.match(/href="([^"]*)f1\/"/)?.[1];
assert(base?.startsWith('/'), 'Collection links must carry the configured absolute base');
for (const file of ['index.html', 'credits.html', 'f1/index.html', 'verdant/index.html', 'orbital/index.html', 'glaze/index.html', 'kage/index.html', 'chronos/index.html', 'interval/index.html', 'form/index.html', 'fusion/index.html', 'sitemap.xml', 'licenses.txt', 'third-party-licenses.md']) {
  assert((await stat(join(root, file))).size > 0, `Missing output: ${file}`);
}
const site = `https://seiya058904.github.io${base}`;
const routes = ['f1', 'verdant', 'orbital', 'glaze', 'kage', 'chronos', 'interval', 'form', 'fusion'];
assert(!/<iframe\b/i.test(home), 'Collection must use independent documents');
for (const route of routes) {
  assert(home.includes(`href="${base}${route}/"`), `Missing gallery entrance: ${route}`);
  const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8');
  assert(sitemap.includes(`<loc>${site}${route}/</loc>`), `Missing sitemap route: ${route}`);
}
for (const file of ['glaze/LICENSE.txt', 'glaze/licenses/Archivo-OFL.txt', 'kage/LICENSE', 'kage/licenses/THIRD-PARTY-NOTICES.md', 'chronos/LICENSE', 'chronos/licenses/Cormorant-Garamond-OFL.txt', 'shared/fonts/dm-sans-latin-400-normal.woff2', 'shared/fonts/dm-sans-latin-500-normal.woff2', 'interval/LICENSE', 'interval/fonts/Bodoni-Moda-OFL.txt', 'interval/fonts/Manrope-OFL.txt', 'interval/licenses/GSAP-NOTICE.txt', 'interval/licenses/Lenis-LICENSE.txt', 'form/LICENSE', 'form/ATTRIBUTION.md', 'form/fonts/dm-sans-latin-variable.woff2', 'form/fonts/ibm-plex-mono-latin-400-normal.woff2', 'form/licenses/GSAP-STANDARD-LICENSE.txt', 'fusion/LICENSE', 'fusion/ATTRIBUTION.md', 'fusion/SOURCES.md', 'fusion/fonts/manrope-latin-wght-normal.woff2', 'fusion/fonts/ibm-plex-mono-latin-400-normal.woff2', 'fusion/licenses/GSAP-Standard.txt']) {
  assert((await stat(join(root, file))).size > 0, `Missing supplied notice: ${file}`);
}
for (const [file, route, title] of [
  ['index.html', '', 'AI Web Experience Collection'],
  ['credits.html', 'credits.html', 'About & credits — AI Web Experience Collection'],
  ['f1/index.html', 'f1/', 'F1 / Beyond the Limit — 速度之外'],
  ['verdant/index.html', 'verdant/', 'VERDANT — A living spring'],
  ['orbital/index.html', 'orbital/', 'ORBITAL — Beyond Earth'],
  ['glaze/index.html', 'glaze/', 'GLAZE — Color Fired Into Form'],
  ['kage/index.html', 'kage/', 'KAGE / VOID — A Moving Sculpture of Space'],
  ['chronos/index.html', 'chronos/', 'CHRONOS — The Architecture of Time'],
  ['interval/index.html', 'interval/', 'INTERVAL — Architecture Between Light &amp; Space'],
  ['form/index.html', 'form/', 'FORM — Objects in Space'],
  ['fusion/index.html', 'fusion/', 'FUSION — Building a Star'],
]) {
  const html = await readFile(join(root, file), 'utf8');
  assert(html.includes(`<title>${title}</title>`), `Incorrect document identity: ${file}`);
  assert(html.includes(`rel="canonical" href="${site}${route}"`), `Incorrect canonical URL: ${file}`);
  assert(html.includes(`property="og:url" content="${site}${route}"`), `Incorrect social URL: ${file}`);
  assert(html.includes('property="og:site_name" content="AI Web Experience Collection"'), `Missing Collection identity: ${file}`);
  assert(/name="description"\s+content="[^"]+"/.test(html), `Missing description: ${file}`);
  assert(/property="og:description"\s+content="[^"]+"/.test(html), `Missing social description: ${file}`);
  for (const attribute of ['property="og:image"', 'name="twitter:image"']) {
    const url = html.match(new RegExp(`${attribute} content="([^"]+)"`))?.[1];
    assert(url?.startsWith(site), `Social image escaped deployment base: ${file}`);
    assert((await stat(join(root, url.slice(site.length)))).size > 0, `Missing social image: ${file}`);
  }
}
let checked = 0;
for (const relative of await readdir(root, { recursive: true })) {
  if (!['.html', '.css'].includes(extname(relative))) continue;
  const source = await readFile(join(root, relative), 'utf8');
  assert(!source.includes('%BASE_URL%'), `Unresolved base in ${relative}`);
  const urls = [...source.matchAll(/(?:src|href|poster)="([^"]+)"|url\(\s*["']?([^"')\s]+)["']?\s*\)/g)].map(m => m[1] || m[2]);
  for (const match of source.matchAll(/srcset="([^"]+)"/g)) {
    urls.push(...match[1].split(',').map(candidate => candidate.trim().split(/\s+/)[0]));
  }
  for (const url of urls) {
    if (/^(?:https?:|data:|#|mailto:)/.test(url)) continue;
    const pathname = new URL(url, `https://collection.test${base}${relative.replaceAll('\\', '/')}`).pathname;
    assert(pathname.startsWith(base), `Escaped deployment base: ${relative} -> ${url}`);
    const target = resolve(root, decodeURIComponent(pathname.slice(base.length)), pathname.endsWith('/') ? 'index.html' : '');
    assert(target.startsWith(root), `Escaped output: ${url}`);
    await stat(target).catch(() => { throw new Error(`Missing local reference: ${relative} -> ${url}`); });
    checked++;
  }
}
console.log(`Production routes and ${checked} HTML/CSS asset references verified at ${base}`);
