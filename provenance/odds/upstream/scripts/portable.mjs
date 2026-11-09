import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';

// Package the already-built app without changing its behavior. No remote assets.
const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
let html = await readFile(resolve(dist, 'index.html'), 'utf8');
const script = html.match(/<script[^>]*src="([^"]+)"[^>]*><\/script>/);
const sheet = html.match(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/);
if (!script || !sheet) throw new Error('Build the application before packaging the offline edition.');
const scriptPath = resolve(dist, script[1]);
const sheetPath = resolve(dist, sheet[1]);
let js = await readFile(scriptPath, 'utf8');
let css = await readFile(sheetPath, 'utf8');
const urls = [...css.matchAll(/url\(([^)]+)\)/g)];
for (const item of urls) {
  const path = item[1].replace(/['"]/g, '');
  if (/^(data:|https?:)/.test(path)) continue;
  const bytes = await readFile(resolve(dirname(sheetPath), path));
  css = css.replace(item[0], `url(data:font/woff2;base64,${bytes.toString('base64')})`);
}
const material = await readFile(resolve(dist, 'art/material.webp'));
js = js.replaceAll('./art/material.webp', `data:image/webp;base64,${material.toString('base64')}`);
const icon = await readFile(resolve(dist, 'favicon.svg'));
const fontLicense = await readFile(resolve(root, 'node_modules/@fontsource-variable/manrope/LICENSE'), 'utf8');
const lenisLicense = await readFile(resolve(root, 'node_modules/lenis/LICENSE'), 'utf8');
html = html.replace(script[0], `<script type="module">${js.replaceAll('</script', '<\\/script')}</script>`);
html = html.replace(sheet[0], `<style>${css}</style>`);
html = html.replace('href="./favicon.svg"', `href="data:image/svg+xml;base64,${icon.toString('base64')}"`);
html = html.replace('</body>', `<script type="text/plain" id="third-party-notices">Bundled font notice (Manrope)\n${fontLicense}\nBundled Lenis notice\n${lenisLicense}</script>\n</body>`);
const output = resolve(root, 'ODDS-Offline.html');
await writeFile(output, html);

// Offline browser evidence fixture, same document and native CSS viewport.
// srcdoc inherits the harness origin, allowing actual document scrolling.
const harness = await readFile(resolve(root, 'tests/browser-harness.html'), 'utf8');
const harnessOffline = harness.replace('src="/"', '')
  .replace('<script>\nconst frame=', `<script id="app-source" type="application/json">${JSON.stringify(html).replaceAll('<', '\\u003c')}</script>\n<script>\nconst frame=`)
  .replace("document.getElementById('chapter').innerHTML", "frame.srcdoc=JSON.parse(document.getElementById('app-source').textContent);\ndocument.getElementById('chapter').innerHTML");
await mkdir(resolve(root, 'evidence'), { recursive: true });
await writeFile(resolve(root, 'evidence/viewport-harness.html'), harnessOffline);
console.log(`${basename(output)}: ${Buffer.byteLength(html)} bytes; all runtime resources embedded.`);
