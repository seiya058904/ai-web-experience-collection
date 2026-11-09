import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve, dirname, relative, extname } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const mime = { '.webp':'image/webp', '.woff2':'font/woff2', '.svg':'image/svg+xml' };
const projectPackage = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const runtimeNotices = await Promise.all([
  ['lenis', 'MIT', 'docs/third-party/lenis/LICENSE'],
  ['@fontsource-variable/manrope', 'OFL-1.1', 'docs/third-party/fontsource-variable__manrope/LICENSE'],
].map(async ([name, license, path]) => {
  const notice = await readFile(resolve(root, path), 'utf8');
  return { name, version: projectPackage.dependencies[name], license, notice, sha256: createHash('sha256').update(notice).digest('hex') };
}));
// Inert, readable metadata keeps the exact runtime/font notices with the standalone file.
const noticeJSON = JSON.stringify({ thirdPartyNotices: runtimeNotices }, null, 2).replaceAll('<', '\\u003c');
const data = async path => `data:${mime[extname(path)]};base64,${(await readFile(path)).toString('base64')}`;
async function walk(directory) {
  const paths = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, item.name);
    if (item.isDirectory()) paths.push(...await walk(path));
    else paths.push(path);
  }
  return paths;
}

const embedded = {};
for (const path of (await walk(dist)).filter(path=>extname(path)==='.webp').sort()) {
  embedded[relative(dist,path).replaceAll('\\','/')] = await data(path);
}
let html = await readFile(resolve(dist,'index.html'),'utf8');
for (const match of [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)]) {
  const href = match[0].match(/href="([^"]+)"/)?.[1];
  if (!href) throw new Error('Missing CSS href.');
  const path = resolve(dist,href);
  let css = await readFile(path,'utf8');
  for (const asset of [...css.matchAll(/url\((?:"|')?([^)'"\s]+)(?:"|')?\)/g)]) {
    if (asset[1].startsWith('data:')) continue;
    css = css.replace(asset[0],`url("${await data(resolve(dirname(path),asset[1]))}")`);
  }
  html = html.replace(match[0],()=>`<style>${css.replaceAll('</style','<\\/style')}</style>`);
}
for (const match of [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)]) {
  const js = await readFile(resolve(dist,match[1]),'utf8');
  const inlineJS = js.replace(/<\/(script|body|html|head|style)(?=[\s>])/gi,(_,tag)=>`<\\/${tag}`);
  const syntax = spawnSync(process.execPath,['--input-type=module','--check'],{input:inlineJS,encoding:'utf8'});
  if(syntax.status!==0)throw new Error('Portable bundle syntax check failed: '+syntax.stderr.split('\n').slice(-8).join('\n'));
  html = html.replace(match[0],()=>`<script type="module">${inlineJS}</script>`);
}
html = html.replace(/<link\b[^>]*rel="preload"[^>]*>/g,'');
html = html.replace(/<link\b[^>]*rel="icon"[^>]*>/,`<link rel="icon" href="${await data(resolve(dist,'favicon.svg'))}">`);
html = html.replaceAll('./frames/landscape/even-24.webp',embedded['frames/landscape/even-24.webp']);
html = html.replace('<head>',()=>`<head>\n<script id="frame-third-party-notices" type="application/json">${noticeJSON}</script>\n<script id="frame-embedded-assets" type="application/json">${JSON.stringify(embedded)}</script>\n<meta name="frame-build" content="self-contained">`);
await writeFile(resolve(root,'FRAME.html'),html);

// The test harness is served beside the portable file; its iframe keeps real CSS dimensions.
let harness = await readFile(resolve(root,'public/qa.html'),'utf8');
harness = harness.replace('src="./"','src="./FRAME.html"');
harness = harness.replace("product.src = new URL('./', location.href).href;", "product.src = new URL('./FRAME.html', location.href).href;");
await writeFile(resolve(root,'QA-PREVIEW.html'),harness);
const metadata = {
  artifact:'FRAME.html', builtFrom:'dist/index.html', embeddedRasterFiles:Object.keys(embedded).length,
  embeddedThirdPartyNotices:runtimeNotices.map(({name,version,license,sha256})=>({name,version,license,sha256})),
  bytes:Buffer.byteLength(html), sha256:createHash('sha256').update(html).digest('hex'),
  note:'Same production application bundle, with local image/font bytes embedded. No runtime CDN or server required.'
};
await writeFile(resolve(root,'docs/offline-build.json'),JSON.stringify(metadata,null,2)+'\n');
console.log(JSON.stringify(metadata));
