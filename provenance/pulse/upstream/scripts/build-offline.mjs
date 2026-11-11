import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const mime = { '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const cache = new Map();
async function inline(path) {
  const local = path.replace(/^\.\//, '').replace(/^\//, '');
  if (!cache.has(local)) {
    const bytes = await readFile(resolve(dist, local));
    cache.set(local, `data:${mime[extname(local)] || 'application/octet-stream'};base64,${bytes.toString('base64')}`);
  }
  return cache.get(local);
}
let html = await readFile(resolve(dist, 'index.html'), 'utf8');
for (const match of [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)]) {
  const href = match[0].match(/href="([^"]+)"/)?.[1];
  if (!href) continue;
  let css = await readFile(resolve(dist, href.replace(/^\.\//, '')), 'utf8');
  for (const url of new Set([...css.matchAll(/url\(([^)]+)\)/g)].map(m=>m[1].replace(/["']/g,'')))) {
    if (url.startsWith('data:') || url.startsWith('#')) continue;
    const asset = url.startsWith('/') || url.startsWith('./assets/') ? url : './assets/' + url.replace(/^\.\//, '');
    css = css.split(url).join(await inline(asset));
  }
  html = html.replace(match[0], `<style>${css}</style>`);
}
for (const match of [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)]) {
  const js = await readFile(resolve(dist, match[1].replace(/^\.\//, '')), 'utf8');
  html = html.replace(match[0], `<script type="module">${js.replaceAll('</script', '<\\/script')}</script>`);
}
// Preload hints are unnecessary once the same assets are embedded in the file.
html = html.replace(/<link\b[^>]*rel="(?:preload|modulepreload)"[^>]*>/g, '');
for (const asset of new Set([...html.matchAll(/\.\/art\/[a-z0-9-]+\.webp/g)].map(m=>m[0]))) html = html.split(asset).join(await inline(asset));
html = html.replace('./favicon.svg', await inline('./favicon.svg'));
const notices = await Promise.all((await readdir(resolve(root, 'docs/licenses'))).map(async name => ({ name, content: await readFile(resolve(root, 'docs/licenses', name), 'utf8') })));
html = html.replace('</body>', `<script id="third-party-notices" type="application/json">${JSON.stringify(notices).replaceAll('<', '\\u003c')}</script></body>`);
await mkdir(resolve(root, 'preview'), { recursive: true });
await writeFile(resolve(root, 'preview/pulse.html'), html);
console.log(`Offline production preview: preview/pulse.html (${(Buffer.byteLength(html)/1024/1024).toFixed(2)} MiB). All media and fonts are embedded.`);
