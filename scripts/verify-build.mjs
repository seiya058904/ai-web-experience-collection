import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';
import assert from 'node:assert/strict';

const root = resolve('dist');
const home = await readFile(join(root, 'index.html'), 'utf8');
const base = home.match(/href="([^"]*)f1\/"/)?.[1];
assert(base?.startsWith('/'), 'Collection links must carry the configured absolute base');
for (const file of ['index.html', 'credits.html', 'f1/index.html', 'verdant/index.html', 'orbital/index.html', 'glaze/index.html', 'kage/index.html', 'chronos/index.html', 'interval/index.html', 'form/index.html', 'fusion/index.html', 'glasshouse/index.html', 'veil/index.html', 'optic/index.html', 'inkscape/index.html', 'sitemap.xml', 'licenses.txt', 'third-party-licenses.md']) {
  assert((await stat(join(root, file))).size > 0, `Missing output: ${file}`);
}
const site = `https://seiya058904.github.io${base}`;
const routes = ['f1', 'verdant', 'orbital', 'glaze', 'kage', 'chronos', 'interval', 'form', 'fusion', 'glasshouse', 'veil', 'optic', 'inkscape'];
assert(!/<iframe\b/i.test(home), 'Collection must use independent documents');
for (const route of routes) {
  assert(home.includes(`href="${base}${route}/"`), `Missing gallery entrance: ${route}`);
  const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8');
  assert(sitemap.includes(`<loc>${site}${route}/</loc>`), `Missing sitemap route: ${route}`);
}
for (const file of ['glaze/LICENSE.txt', 'glaze/licenses/Archivo-OFL.txt', 'kage/LICENSE', 'kage/licenses/THIRD-PARTY-NOTICES.md', 'chronos/LICENSE', 'chronos/licenses/Cormorant-Garamond-OFL.txt', 'shared/fonts/dm-sans-latin-400-normal.woff2', 'shared/fonts/dm-sans-latin-500-normal.woff2', 'interval/LICENSE', 'interval/fonts/Bodoni-Moda-OFL.txt', 'interval/fonts/Manrope-OFL.txt', 'interval/licenses/GSAP-NOTICE.txt', 'interval/licenses/Lenis-LICENSE.txt', 'form/LICENSE', 'form/ATTRIBUTION.md', 'form/fonts/dm-sans-latin-variable.woff2', 'form/fonts/ibm-plex-mono-latin-400-normal.woff2', 'form/licenses/GSAP-STANDARD-LICENSE.txt', 'fusion/LICENSE', 'fusion/ATTRIBUTION.md', 'fusion/SOURCES.md', 'fusion/fonts/manrope-latin-wght-normal.woff2', 'fusion/fonts/ibm-plex-mono-latin-400-normal.woff2', 'fusion/licenses/GSAP-Standard.txt']) {
  assert((await stat(join(root, file))).size > 0, `Missing supplied notice: ${file}`);
}
for (const file of ['glasshouse/LICENSE', 'glasshouse/ATTRIBUTION.md', 'glasshouse/licenses/MANROPE-OFL.txt', 'glasshouse/licenses/GSAP-LICENSE-NOTICE.txt', 'glasshouse/fonts/manrope-latin-wght-normal.woff2', 'glasshouse/media/focused-light.png', 'veil/LICENSE', 'veil/ATTRIBUTION.md', 'veil/licenses/CORMORANT-GARAMOND-OFL.txt', 'veil/licenses/MANROPE-OFL.txt', 'veil/licenses/GSAP-STANDARD-LICENSE.txt', 'veil/fonts/cormorant-garamond-latin-300-normal.woff2', 'veil/fonts/cormorant-garamond-latin-400-normal.woff2', 'veil/fonts/manrope-latin-400-normal.woff2', 'veil/fonts/manrope-latin-500-normal.woff2', 'veil/images/cloth-study.webp', 'veil/images/light-study.webp', 'veil/images/silk-macro.webp']) {
  assert((await stat(join(root, file))).size > 0, `Missing supplied resource: ${file}`);
}
for (const file of ['optic/LICENSE', 'optic/THIRD_PARTY_NOTICES.md', 'optic/licenses/THREE-LICENSE.txt', 'optic/licenses/Manrope-OFL.txt', 'optic/licenses/Cormorant-Garamond-OFL.txt', 'optic/fonts/manrope-latin-wght-normal.woff2', 'optic/fonts/cormorant-garamond-latin-400-italic.woff2', 'optic/assets/coast-of-light.webp', 'inkscape/LICENSE', 'inkscape/ATTRIBUTION.md', 'inkscape/licenses/GSAP.txt', 'inkscape/licenses/Lenis.txt', 'inkscape/fonts/OFL-Manrope.txt', 'inkscape/fonts/OFL-Cormorant.txt', 'inkscape/fonts/OFL-IBM-Plex.txt', 'inkscape/fonts/CormorantGaramond-Light.woff2', 'inkscape/fonts/CormorantGaramond-Regular.woff2', 'inkscape/fonts/CormorantGaramond-Italic.woff2', 'inkscape/fonts/Manrope-Variable.woff2', 'inkscape/fonts/IBMPlexMono-Regular.woff2', ...['ink-bloom', 'paper-fibers', 'ink-wash', 'brush-stroke', 'paper-sheet', 'ink-gesture'].map(name => 'inkscape/art/' + name + '.webp')]) {
  assert((await stat(join(root, file))).size > 0, 'Missing supplied resource: ' + file);
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
  ['glasshouse/index.html', 'glasshouse/', 'GLASSHOUSE — Light Through Matter'],
  ['veil/index.html', 'veil/', 'VEIL — Fabric in Motion'],
  ['optic/index.html', 'optic/', 'OPTIC — The Architecture of an Image'],
  ['inkscape/index.html', 'inkscape/', 'INKSCAPE — Paper, Water, Ink'],
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
