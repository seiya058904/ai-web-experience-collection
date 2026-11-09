#!/usr/bin/env node
/**
 * Build the unchanged RALLY application as one offline HTML file.
 * Only generated files under .build/portable and portable/RALLY.html are written.
 * Vite's transform hooks replace known asset templates in memory, never on disk.
 */
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative, dirname, extname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { build, normalizePath } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const outDir = resolve(root, '.build/portable');
const destination = resolve(root, 'portable/RALLY.html');
const virtualId = 'virtual:rally-inline-assets';
const resolvedVirtualId = `\0${virtualId}`;
const mimeTypes = {
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.avif': 'image/avif', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf',
};
const replacements = new Map([
  [normalizePath(resolve(root, 'src/content.ts')), [
    ['${base}art/${name}.webp', '${inlineAssets[name + ".webp"]}'],
    ['${base}art/hero-mobile.webp', '${inlineAssets["hero-mobile.webp"]}'],
    ['${base}art/hero-desktop.webp', '${inlineAssets["hero-desktop.webp"]}'],
  ]],
  [normalizePath(resolve(root, 'src/scenes.ts')), [
    ['${escape(base)}art/player-${actor.toLowerCase()}.webp', '${inlineAssets["player-" + actor.toLowerCase() + ".webp"]}'],
  ]],
  [normalizePath(resolve(root, 'src/contact-scenes.ts')), [
    ['${escape(base)}art/ball.webp', '${inlineAssets["ball.webp"]}'],
    ['${escape(base)}art/player-${actor.toLowerCase()}.webp', '${inlineAssets["player-" + actor.toLowerCase() + ".webp"]}'],
  ]],
]);

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function replaceExactlyOnce(source, needle, replacement, label) {
  const count = source.split(needle).length - 1;
  requireCondition(count === 1, `${label}: expected one known template, found ${count}: ${needle}`);
  return source.replace(needle, () => replacement);
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2] ?? null;
}

function dataURL(bytes, extension) {
  const mime = mimeTypes[extension.toLowerCase()];
  requireCondition(Boolean(mime), `Unsupported embedded asset type: ${extension}`);
  return `data:${mime};base64,${bytes.toString('base64')}`;
}

/** Resolve only a file produced by this build, regardless of the host OS. */
function outputFile(reference, referringFile) {
  requireCondition(!/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(reference), `External output reference is not portable: ${reference}`);
  const pathname = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
  const absolute = pathname.startsWith('/')
    ? resolve(outDir, `.${pathname}`)
    : resolve(dirname(referringFile), pathname);
  const local = relative(outDir, absolute);
  requireCondition(local !== '..' && !local.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) && !isAbsolute(local), `Asset escaped the generated output directory: ${reference}`);
  return absolute;
}

async function main() {
  const artDir = resolve(root, 'public/art');
  const entries = (await readdir(artDir, { withFileTypes: true }))
    .filter(entry => entry.isFile() && /^\.(?:webp|png|jpe?g|avif|svg)$/i.test(extname(entry.name)))
    .map(entry => entry.name).sort();
  requireCondition(entries.length > 0, 'No production art assets were found.');
  const imageRecords = await Promise.all(entries.map(async name => {
    const bytes = await readFile(resolve(artDir, name));
    return { name, bytes: bytes.length, url: dataURL(bytes, extname(name)) };
  }));
  const assets = Object.fromEntries(imageRecords.map(record => [record.name, record.url]));
  for (const name of ['hero-mobile.webp', 'hero-desktop.webp', 'player-a.webp', 'player-b.webp', 'ball.webp']) {
    requireCondition(Boolean(assets[name]), `Required production image is missing: ${name}`);
  }
  const favicon = dataURL(await readFile(resolve(root, 'public/favicon.svg')), '.svg');
  const transformed = new Set();
  let removedPreloads = 0;

  const built = await build({
    root,
    configFile: false,
    base: './',
    publicDir: false,
    plugins: [{
      name: 'rally-portable-assets',
      enforce: 'pre',
      resolveId(id) { if (id === virtualId) return resolvedVirtualId; },
      load(id) {
        if (id === resolvedVirtualId) return `export const inlineAssets = Object.freeze(${JSON.stringify(assets)});`;
      },
      transform(source, id) {
        const file = normalizePath(id.split('?')[0]);
        const edits = replacements.get(file);
        if (!edits) return;
        let code = source;
        for (const [needle, replacement] of edits) code = replaceExactlyOnce(code, needle, replacement, relative(root, file));
        requireCondition(!/\}\s*art\//.test(code), `Unconverted runtime image template in ${relative(root, file)}`);
        transformed.add(file);
        return { code: `import { inlineAssets } from '${virtualId}';\n${code}`, map: null };
      },
      transformIndexHtml: {
        order: 'pre',
        handler(source) {
          let html = source.replace(/<link\b[^>]*>/gi, tag => {
            if (attribute(tag, 'rel') === 'preload' && /^\.\/art\//.test(attribute(tag, 'href') ?? '')) {
              removedPreloads++; return '';
            }
            return tag;
          });
          html = replaceExactlyOnce(html, 'href="./favicon.svg"', `href="${favicon}"`, 'index favicon');
          return html;
        },
      },
    }],
    build: {
      outDir,
      emptyOutDir: true,
      copyPublicDir: false,
      target: 'es2022',
      sourcemap: false,
      assetsInlineLimit: 0,
      cssCodeSplit: false,
      modulePreload: false,
      chunkSizeWarningLimit: 6000,
    },
  });

  requireCondition(transformed.size === replacements.size, 'The build did not transform all three expected source modules.');
  requireCondition(removedPreloads === 2, `Expected two original Hero preloads; removed ${removedPreloads}.`);
  const bundles = Array.isArray(built) ? built : [built];
  const outputs = bundles.flatMap(bundle => {
    requireCondition(Array.isArray(bundle.output), 'Unexpected watch-mode result from the portable build.');
    return bundle.output;
  });
  const chunks = outputs.filter(output => output.type === 'chunk');
  requireCondition(chunks.length === 1 && chunks[0].isEntry, `Portable output requires one entry chunk; found ${chunks.length}.`);
  requireCondition(chunks[0].imports.length === 0 && chunks[0].dynamicImports.length === 0, 'The portable JavaScript still imports another file.');

  const htmlPath = resolve(outDir, 'index.html');
  let html = await readFile(htmlPath, 'utf8');
  let scriptCount = 0;
  const scriptTags = [...html.matchAll(/<script\b[^>]*>\s*<\/script>/gi)].map(match => match[0]);
  for (const tag of scriptTags) {
    const src = attribute(tag, 'src');
    if (!src) continue;
    const jsPath = outputFile(src, htmlPath);
    const javascript = await readFile(jsPath, 'utf8');
    requireCondition(!/(?:["'`]|\})\s*(?:\.\/)?art\//.test(javascript), 'JavaScript retains a runtime art-file path.');
    requireCondition(!/\bimport\s*\(/.test(javascript), 'JavaScript retains a dynamic import.');
    for (const record of imageRecords) requireCondition(javascript.includes(record.url), `Bundled asset map is missing ${record.name}.`);
    const safeJavaScript = javascript.replace(/<\/script/gi, '<\\/script');
    html = html.replace(tag, () => `<script type="module">\n${safeJavaScript}\n</script>`);
    scriptCount++;
  }
  requireCondition(scriptCount === 1, `Expected one application script; embedded ${scriptCount}.`);

  const fontFiles = new Map();
  let cssCount = 0;
  const linkTags = [...html.matchAll(/<link\b[^>]*>/gi)].map(match => match[0]);
  for (const tag of linkTags) {
    const rel = attribute(tag, 'rel');
    if (rel === 'modulepreload' || rel === 'preload') { html = html.replace(tag, ''); continue; }
    if (rel !== 'stylesheet') continue;
    const href = attribute(tag, 'href');
    requireCondition(Boolean(href), 'A stylesheet link has no href.');
    const cssPath = outputFile(href, htmlPath);
    let css = await readFile(cssPath, 'utf8');
    const urlPattern = /url\(\s*(?:(["'])(.*?)\1|([^)]*))\s*\)/gi;
    const urls = [...css.matchAll(urlPattern)].map(match => ({ token: match[0], url: (match[2] ?? match[3]).trim() }));
    for (const item of urls) {
      if (item.url.startsWith('data:') || item.url.startsWith('#')) continue;
      const assetPath = outputFile(item.url, cssPath);
      let embedded = fontFiles.get(assetPath);
      if (!embedded) {
        const bytes = await readFile(assetPath);
        embedded = { url: dataURL(bytes, extname(assetPath)), bytes: bytes.length };
        fontFiles.set(assetPath, embedded);
      }
      css = css.replaceAll(item.token, `url("${embedded.url}")`);
    }
    requireCondition(!/@import\b/i.test(css), 'A CSS import remains in the offline stylesheet.');
    for (const match of css.matchAll(urlPattern)) {
      const url = (match[2] ?? match[3]).trim();
      requireCondition(url.startsWith('data:') || url.startsWith('#'), `An external CSS resource remains: ${url}`);
    }
    html = html.replace(tag, () => `<style>\n${css.replace(/<\/style/gi, '<\\/style')}\n</style>`);
    cssCount++;
  }
  requireCondition(cssCount === 1, `Expected one combined stylesheet; embedded ${cssCount}.`);

  const licenseDir = resolve(root, 'public/licenses');
  const licenseNames = (await readdir(licenseDir)).filter(name => name.endsWith('.txt')).sort();
  const licenses = Object.fromEntries(await Promise.all(licenseNames.map(async name => [name, await readFile(resolve(licenseDir, name), 'utf8')])));
  const licenseJSON = JSON.stringify(licenses, null, 2).replace(/</g, '\\u003c');
  html = html.replace('</body>', () => `<script type="application/json" id="rally-license-notices">${licenseJSON}</script>\n</body>`);

  // Validate resource-bearing HTML separately from the JavaScript's DOM strings.
  const shell = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  requireCondition(!/<script\b[^>]*\bsrc\s*=/i.test(html), 'External script tag remains.');
  for (const match of shell.matchAll(/<(?:link|img|source|image|audio|video|iframe)\b[^>]*>/gi)) {
    const tag = match[0];
    for (const attr of ['src', 'href', 'srcset', 'poster']) {
      const value = attribute(tag, attr);
      if (value) requireCondition(value.startsWith('data:') || value.startsWith('#'), `Runtime HTML resource is not embedded: ${tag}`);
    }
  }
  requireCondition(!/\.\/art\/|\.\/assets\/|\/src\/main\.ts/.test(shell), 'A generated runtime file reference remains in the HTML shell.');
  requireCondition(html.includes('data:font/woff2;base64,'), 'The portable file has no embedded WOFF2 fonts.');
  requireCondition(html.includes('data:image/svg+xml;base64,'), 'The portable file has no embedded favicon.');
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, html, 'utf8');
  const bytes = Buffer.byteLength(html, 'utf8');
  const summary = {
    output: relative(root, destination).split('\\').join('/'),
    bytes,
    sha256: createHash('sha256').update(html).digest('hex'),
    embeddedImages: imageRecords.length,
    sourceImageBytes: imageRecords.reduce((sum, record) => sum + record.bytes, 0),
    embeddedFontFiles: fontFiles.size,
    embeddedFontBytes: [...fontFiles.values()].reduce((sum, record) => sum + record.bytes, 0),
    licenseNotices: licenseNames,
    transformedSourceModules: [...transformed].map(file => relative(root, file).split('\\').join('/')).sort(),
    externalRuntimeResourceReferences: 0,
    browserVerification: 'Not performed by this build script.',
  };
  await writeFile(resolve(outDir, 'portable-summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  console.log(`\nPortable build: ${summary.output}`);
  console.log(`${bytes.toLocaleString('en-US')} bytes; ${imageRecords.length} images; ${fontFiles.size} embedded font files.`);
  console.log(`SHA-256: ${summary.sha256}`);
  console.log('Static resource checks passed. Browser behavior requires separate verification.');
}

main().catch(error => {
  console.error(`\nPortable build failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
