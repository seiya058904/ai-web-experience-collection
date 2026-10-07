import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';
import assert from 'node:assert/strict';

const root = resolve('dist');
const home = await readFile(join(root, 'index.html'), 'utf8');
const base = home.match(/href="([^"]*)f1\/"/)?.[1];
assert(base?.startsWith('/'), 'Collection links must carry the configured absolute base');
for (const file of ['index.html', 'credits.html', 'f1/index.html', 'verdant/index.html', 'orbital/index.html', 'glaze/index.html', 'kage/index.html', 'chronos/index.html', 'interval/index.html', 'form/index.html', 'fusion/index.html', 'glasshouse/index.html', 'veil/index.html', 'optic/index.html', 'inkscape/index.html', 'facet/index.html', 'silicon/index.html', 'atlas/index.html', 'thrust/index.html', 'resonance/index.html', 'aeterna/index.html', 'parallax/index.html', 'luthier/index.html', 'codex/index.html', 'magma/index.html', 'fossil/index.html', 'sitemap.xml', 'licenses.txt', 'third-party-licenses.md']) {
  assert((await stat(join(root, file))).size > 0, `Missing output: ${file}`);
}
const site = `https://seiya058904.github.io${base}`;
const routes = ['f1', 'verdant', 'orbital', 'glaze', 'kage', 'chronos', 'interval', 'form', 'fusion', 'glasshouse', 'veil', 'optic', 'inkscape', 'facet', 'silicon', 'atlas', 'thrust', 'resonance', 'aeterna', 'parallax', 'luthier', 'codex', 'magma', 'fossil'];
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
  ['thrust/index.html', 'thrust/', 'THRUST — Anatomy of a Jet Engine'],
  ['resonance/index.html', 'resonance/', 'RESONANCE — Sound Made Visible'],
  ['aeterna/index.html', 'aeterna/', 'AETERNA — Rome in Marble and Memory'],
  ['parallax/index.html', 'parallax/', 'PARALLAX — The Museum of Impossible Forms'],
  ['luthier/index.html', 'luthier/', 'LUTHIER — The Anatomy of a Violin'],
  ['codex/index.html', 'codex/', 'CODEX — The Anatomy of a Book'],
  ['magma/index.html', 'magma/', 'MAGMA — Stone Before Stone'],
  ['fossil/index.html', 'fossil/', 'FOSSIL — Deep Time in Stone'],
  ['atlas/index.html', 'atlas/', 'ATLAS — The World in Layers'],
  ['silicon/index.html', 'silicon/', 'SILICON — From Sand to Signal'],
  ['facet/index.html', 'facet/', 'FACET — The Light Within'],
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
for (const file of ["facet/LICENSE", "facet/THIRD_PARTY_NOTICES.md", "facet/fonts/dm-sans-medium.woff2", "facet/fonts/dm-sans-regular.woff2", "facet/fonts/instrument-serif-italic.woff2", "facet/fonts/instrument-serif-regular.woff2", "facet/licenses/DM-Sans-OFL.txt", "facet/licenses/GSAP-Standard-License.md", "facet/licenses/Instrument-Serif-OFL.txt", "facet/licenses/LENIS-LICENSE.txt", "facet/licenses/Noto-Serif-SC-OFL.txt", "facet/licenses/THREE-LICENSE.txt", "facet/licenses/THREE-TYPES-LICENSE.txt", "facet/licenses/TYPESCRIPT-LICENSE.txt", "facet/licenses/TYPESCRIPT-ThirdPartyNoticeText.txt", "facet/licenses/VITE-LICENSE.md", "silicon/ATTRIBUTION.md", "silicon/LICENSE", "silicon/fonts/ibm-plex-mono-latin-400-normal.woff2", "silicon/fonts/manrope-latin-wght-normal.woff2", "silicon/licenses/GSAP-NOTICE.txt", "silicon/licenses/IBM-PLEX-MONO-OFL.txt", "silicon/licenses/LENIS-LICENSE.txt", "silicon/licenses/LTC-LICENSE.txt", "silicon/licenses/MANROPE-OFL.txt", "silicon/licenses/THREE-LICENSE.txt", "silicon/licenses/TYPES-THREE-LICENSE.txt", "silicon/licenses/TYPESCRIPT-LICENSE.txt", "silicon/licenses/TYPESCRIPT-THIRD-PARTY-NOTICES.txt", "silicon/licenses/VITE-LICENSE.md", "atlas/ATTRIBUTION.md", "atlas/LICENSE", "atlas/fonts/cormorant-garamond-latin-400-italic.woff2", "atlas/fonts/ibm-plex-mono-latin-400-normal.woff2", "atlas/fonts/manrope-latin-wght-normal.woff2", "atlas/licenses/Cormorant-Garamond-OFL-1.1.txt", "atlas/licenses/Earcut-ISC.txt", "atlas/licenses/GSI-TERMS-ja.txt", "atlas/licenses/IBM-Plex-Mono-OFL-1.1.txt", "atlas/licenses/Manrope-OFL-1.1.txt", "atlas/licenses/Natural-Earth-PUBLIC-DOMAIN.txt", "atlas/licenses/PDL-1.0-ja.txt", "atlas/licenses/README.md", "atlas/licenses/Three-MIT.txt", "atlas/licenses/Types-Three-MIT.txt", "atlas/licenses/TypeScript-Apache-2.0.txt", "atlas/licenses/TypeScript-THIRD-PARTY.txt", "atlas/licenses/Vite-MIT-and-third-party.txt", "thrust/ATTRIBUTION.md", "thrust/LICENSE", "thrust/fonts/barlow-condensed-latin-600-normal.woff2", "thrust/fonts/manrope-latin-400-normal.woff2", "thrust/fonts/manrope-latin-500-normal.woff2", "thrust/licenses/Barlow-Condensed-OFL.txt", "thrust/licenses/Manrope-OFL.txt", "thrust/licenses/rolldown-MIT.txt", "thrust/licenses/rolldown-third-party.txt", "thrust/licenses/three-MIT.txt", "thrust/licenses/vite-MIT-and-notices.txt"]) {
  assert((await stat(join(root, file))).size > 0, `Missing supplied resource: ${file}`);
}
for (const file of ["atlas/data/city-aerial-1024.webp", "atlas/data/city-aerial-2048.webp", "atlas/data/city-elevation-129.bin", "atlas/data/city-elevation-257.bin", "atlas/data/city-raster.json", "atlas/data/contours-100m.json", "atlas/data/contours-mobile.json", "atlas/data/elevation-1025.bin", "atlas/data/elevation-129.bin", "atlas/data/elevation-257.bin", "atlas/data/elevation-513.bin", "atlas/data/satellite-1024.webp", "atlas/data/satellite-2048.webp", "atlas/data/terrain.json", "atlas/data/vectors/city-buildings-mobile.geojson", "atlas/data/vectors/city-buildings.geojson", "atlas/data/vectors/city-roads.geojson", "atlas/data/vectors/city-water.geojson", "atlas/data/vectors/globe-land.geojson", "atlas/data/vectors/metadata.json", "atlas/data/vectors/region-roads.geojson", "atlas/data/vectors/region-water.geojson", "atlas/data/vectors/route.geojson"]) {
  assert((await stat(join(root, file))).size > 0, `Missing geographic resource: ${file}`);
}
for (const file of ['resonance/ATTRIBUTION.md', 'resonance/licenses/manrope-latin-OFL.txt', 'resonance/licenses/cormorant-garamond-latin-italic-OFL.txt', 'resonance/fonts/manrope-latin.woff2', 'resonance/fonts/cormorant-garamond-latin-italic.woff2', 'resonance/social.jpg']) {
  assert((await stat(join(root, file))).size > 0, `Missing supplied resource: ${file}`);
}
for (const file of ['aeterna/ATTRIBUTION.md','aeterna/MUSEUM_ASSETS.md','aeterna/CURATORIAL_NOTES.md','aeterna/AI_ASSETS.json','aeterna/licenses/bodoni-moda-OFL.txt','aeterna/licenses/manrope-OFL.txt','aeterna/models/herakles-fragments.glb','aeterna/models/roman-wellhead.glb','aeterna/models/draco/LICENSE.txt','aeterna/models/draco/draco_decoder.js','aeterna/models/draco/draco_decoder.wasm','aeterna/models/draco/draco_wasm_wrapper.js','aeterna/fonts/bodoni-moda-latin-400-normal.woff2','aeterna/fonts/bodoni-moda-latin-400-italic.woff2','aeterna/fonts/manrope-latin-400-normal.woff2','aeterna/fonts/manrope-latin-500-normal.woff2']) {
  assert((await stat(join(root, file))).size > 0, `Missing AETERNA resource: ${file}`);
}
for (const file of ['parallax/ATTRIBUTION.md', 'parallax/assets/basalt.png', 'parallax/assets/gallery-ivory.png', 'parallax/assets/gallery-museum.png', 'parallax/assets/hero-form.png', 'parallax/assets/mark.svg', 'parallax/fonts/bodoni-moda-latin-400-normal.woff2', 'parallax/fonts/manrope-latin-400-normal.woff2', 'parallax/fonts/manrope-latin-500-normal.woff2', 'parallax/licenses/BODONI-MODA-LICENSE.txt', 'parallax/licenses/MANROPE-LICENSE.txt', 'parallax/licenses/THREE-LICENSE.txt', 'parallax/models/impossible-form.glb', 'parallax/models/impossible-form.json', 'parallax/social.jpg']) {
  assert((await stat(join(root, file))).size > 0, `Missing PARALLAX resource: ${file}`);
}
for (const file of ['luthier/LICENSE.txt', 'luthier/NOTICE.md', 'luthier/fonts/cormorant-300.woff2', 'luthier/fonts/cormorant-300-italic.woff2', 'luthier/poster.webp', 'luthier/social.jpg']) {
  assert((await stat(join(root, file))).size > 0, `Missing LUTHIER resource: ${file}`);
}
for (const file of ['magma/NOTICE.md', 'magma/licenses/Archivo-OFL.txt', 'magma/licenses/Lenis-MIT.txt', 'magma/fonts/archivo-latin-variable.woff2', 'magma/poster.webp', 'magma/social.jpg', 'fossil/LICENSE.txt', 'fossil/NOTICE.md', 'fossil/licenses/README.md', 'fossil/assets/fonts/bodoni-moda.woff2', 'fossil/assets/fonts/cormorant-garamond.woff2', 'fossil/assets/fonts/manrope.woff2', 'fossil/data/fossil-volume.js', 'fossil/data/ammonite-density.u8', 'fossil/data/sections/section-071.png', 'fossil/models/MARCHING_CUBES_LICENSE.txt', 'fossil/models/ammonite-interpretive.obj', 'fossil/poster.webp', 'fossil/social.jpg']) {
  assert((await stat(join(root, file))).size > 0, `Missing supplied resource: ${file}`);
}
for (const file of ['codex/NOTICE.md', 'codex/licenses/Cormorant-Garamond-OFL.txt', 'codex/licenses/Manrope-OFL.txt', 'codex/licenses/dependencies/lenis--LICENSE', 'codex/licenses/dependencies/three--LICENSE', 'codex/fonts/cormorant-garamond-latin-variable.woff2', 'codex/fonts/cormorant-garamond-italic-latin-variable.woff2', 'codex/fonts/manrope-latin-variable.woff2', 'codex/poster.webp', 'codex/social.jpg']) {
  assert((await stat(join(root, file))).size > 0, `Missing CODEX resource: ${file}`);
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
