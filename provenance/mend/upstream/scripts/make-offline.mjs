#!/usr/bin/env node
/**
 * Produce an optional, self-contained file from an already successful Vite build.
 * Does not change index.html, the normal bundles, or any source files.
 *
 * Usage: node scripts/make-offline.mjs [--dist dist] [--out dist/MEND-Offline.html]
 * No dependencies and no network access are used by this packaging step.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const options = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i];
  if (!['--dist', '--out'].includes(key) || !process.argv[i + 1]) {
    throw new Error('Usage: node scripts/make-offline.mjs [--dist dist] [--out dist/MEND-Offline.html]');
  }
  if (options.has(key)) throw new Error(`Duplicate option: ${key}`);
  options.set(key, process.argv[i + 1]);
}
const dist = path.resolve(project, options.get('--dist') || 'dist');
const output = path.resolve(project, options.get('--out') || path.join(dist, 'MEND-Offline.html'));
const index = path.join(dist, 'index.html');
if (output === index) throw new Error('The offline output must not overwrite the normal index.html.');
if (!fs.existsSync(index)) throw new Error('No dist/index.html found. Run npm run build successfully first.');

const sha256 = value => createHash('sha256').update(value).digest('hex');
const relative = value => path.relative(dist, value).split(path.sep).join('/');
const sourceFiles = new Map();
const dataCache = new Map();
const moduleCache = new Map();
const activeModules = new Set();
const sourceSnapshots = new Map();
const stats = { modules: 0, dynamicImports: 0, assetResolvers: 0, cssFiles: 0, cssUrls: 0, htmlAssets: 0, removedPreloads: 0 };
const mimeTypes = {
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.mp4': 'video/mp4',
  '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
};

function read(file) {
  const absolute = path.resolve(file);
  if (absolute !== dist && !absolute.startsWith(dist + path.sep)) throw new Error(`Resource escaped dist: ${file}`);
  const bytes = fs.readFileSync(absolute);
  sourceFiles.set(relative(absolute), { bytes: bytes.length, sha256: sha256(bytes) });
  sourceSnapshots.set(absolute, bytes);
  return bytes;
}

function resolveResource(value, fromFile) {
  if (/^(?:data:|blob:|#)/i.test(value)) return null;
  if (/^(?:https?:)?\/\//i.test(value)) throw new Error(`External automatic resource is not permitted in the offline file: ${value}`);
  if (/[?#]/.test(value)) throw new Error(`Versioned resource URL needs an explicit packaging rule: ${value}`);
  const candidates = value.startsWith('/')
    ? [path.resolve(dist, '.' + value)]
    : [path.resolve(path.dirname(fromFile), value), path.resolve(dist, value)];
  for (const candidate of candidates) {
    if (!candidate.startsWith(dist + path.sep)) continue;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  throw new Error(`Missing build resource ${JSON.stringify(value)} referenced by ${relative(fromFile)}`);
}

function dataUri(file) {
  if (dataCache.has(file)) return dataCache.get(file);
  const mime = mimeTypes[path.extname(file).toLowerCase()];
  if (!mime) throw new Error(`No MIME type declared for ${relative(file)}`);
  const value = `data:${mime};base64,${read(file).toString('base64')}`;
  dataCache.set(file, value);
  return value;
}

const artDirectory = path.join(dist, 'art');
if (!fs.existsSync(artDirectory)) throw new Error('No built art directory found.');
const art = Object.fromEntries(fs.readdirSync(artDirectory).filter(name => name.endsWith('.webp')).sort().map(name => [name.slice(0, -5), dataUri(path.join(artDirectory, name))]));
for (const required of ['hero-desktop', 'hero-mobile', 'inspection', 'underside', 'repair-A', 'repair-B', 'long-road', 'paint-texture']) {
  if (!art[required]) throw new Error(`Required art is missing: ${required}.webp`);
}

function inlineCss(file) {
  stats.cssFiles++;
  let css = read(file).toString('utf8');
  if (/@import\b/i.test(css)) throw new Error(`CSS @import is not supported; let Vite bundle it first: ${relative(file)}`);
  css = css.replace(/url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/g, (_whole, _quote, value) => {
    const resource = resolveResource(value, file);
    if (!resource) return `url("${value}")`;
    stats.cssUrls++;
    return `url("${dataUri(resource)}")`;
  });
  if (/<\/style/i.test(css)) throw new Error('A CSS closing style tag requires an explicit escaping rule.');
  return css;
}

function inlineModule(file) {
  if (moduleCache.has(file)) return moduleCache.get(file);
  if (activeModules.has(file)) throw new Error(`Cyclic built modules need a separate bundling rule: ${relative(file)}`);
  activeModules.add(file);
  stats.modules++;
  let source = read(file).toString('utf8');
  const original = source;
  let resolverCount = 0;
  if (/(['"`])long-road-B\1/.test(original) && !art['long-road-B']) {
    throw new Error('The built application requests long-road-B.webp, but that art is missing.');
  }

  // Match the actual compiled asset(name) expression, independent of its minified name.
  // A changed build pattern fails the final count check instead of shipping broken paths.
  source = source.replace(/(['"`])(?:\.\/)?art\/\1\s*\+\s*([A-Za-z_$][\w$]*)\s*\+\s*(['"`])\.webp\3/g, (_whole, _prefixQuote, parameter) => {
    resolverCount++;
    stats.assetResolvers++;
    return `__MEND_OFFLINE_ART__[${parameter}]`;
  });

  // Vite emits a literal dynamic import for the complete Three.js scene chunk.
  // Recursively embed any future literal child chunks, and reject cycles.
  source = source.replace(/\bimport\s*\(\s*(['"`])([^'"`]+)\1\s*\)/g, (_whole, _quote, specifier) => {
    const child = resolveResource(specifier, file);
    if (!child || path.extname(child) !== '.js') throw new Error(`Unsupported dynamic module: ${specifier}`);
    const childSource = inlineModule(child);
    stats.dynamicImports++;
    return `import(${JSON.stringify('data:text/javascript;base64,' + Buffer.from(childSource).toString('base64'))})`;
  });

  // Fixed material URLs, preloading arrays, and static imports use quoted build paths.
  // Only simple path literals ending in a supported resource extension are candidates.
  source = source.replace(/(['"`])((?:\.?\.?\/)?[A-Za-z0-9_./-]+\.(?:js|css|webp|png|jpe?g|svg|woff2?|mp3|wav|ogg|mp4))\1/g, (_whole, _quote, value) => {
    const resource = resolveResource(value, file);
    if (!resource) return JSON.stringify(value);
    const extension = path.extname(resource);
    if (extension === '.js') return JSON.stringify('data:text/javascript;base64,' + Buffer.from(inlineModule(resource)).toString('base64'));
    if (extension === '.css') return JSON.stringify('data:text/css;base64,' + Buffer.from(inlineCss(resource)).toString('base64'));
    return JSON.stringify(dataUri(resource));
  });

  // Fail closed on a changed dynamic resolver or a non-literal dynamic import.
  if (/(['"`])(?:\.\/)?art\/\1\s*\+/.test(source)) throw new Error(`An art resolver was not embedded in ${relative(file)}`);
  const imports = [...source.matchAll(/\bimport\s*\(/g)].length;
  const dataImports = [...source.matchAll(/\bimport\s*\(\s*"data:text\/javascript;base64,/g)].length;
  if (imports !== dataImports) throw new Error(`A non-literal or unresolved dynamic import remains in ${relative(file)}`);
  for (const match of source.matchAll(/\b(?:import|export)\s+(?:\{[^}]*\}|\*(?:\s+as\s+[\w$]+)?|[\w$]+)\s*from\s*(['"`])([^'"`]+)\1/g)) {
    if (!match[2].startsWith('data:text/javascript;base64,')) throw new Error(`An unresolved static import remains in ${relative(file)}: ${match[2]}`);
  }
  for (const match of source.matchAll(/\bimport\s*(['"`])([^'"`]+)\1/g)) {
    if (!match[2].startsWith('data:text/javascript;base64,')) throw new Error(`An unresolved side-effect import remains in ${relative(file)}: ${match[2]}`);
  }
  if (resolverCount) source = `const __MEND_OFFLINE_ART__=Object.freeze(${JSON.stringify(art)});\n` + source;
  source = source.replace(/<\/script/gi, '<\\/script');
  if (!source || !original) throw new Error(`An empty module was encountered: ${relative(file)}`);
  activeModules.delete(file);
  moduleCache.set(file, source);
  return source;
}

let html = read(index).toString('utf8');
const scripts = [...html.matchAll(/<script\b([^>]*\bsrc\s*=\s*(['"])([^'"]+)\2[^>]*)>\s*<\/script>/gi)];
if (scripts.length !== 1 || !/type\s*=\s*['"]module['"]/i.test(scripts[0][1])) {
  throw new Error('Expected exactly one built external module entry in dist/index.html.');
}
const entry = resolveResource(scripts[0][3], index);
const entrySource = inlineModule(entry);
if (stats.assetResolvers !== 1) throw new Error(`Expected one compiled art resolver; found ${stats.assetResolvers}. Update the packaging rule for this build.`);
if (stats.dynamicImports < 1) throw new Error('Expected the scene dynamic import; the bundle shape changed.');
html = html.replace(scripts[0][0], () => `<script type="module">\n${entrySource}\n</script>`);

// Embedded assets need no speculative preloads; removing these avoids duplicate bytes.
html = html.replace(/<link\b[^>]*\brel\s*=\s*['"](?:preload|modulepreload)['"][^>]*>\s*/gi, () => { stats.removedPreloads++; return ''; });
html = html.replace(/<link\b([^>]*\brel\s*=\s*['"]stylesheet['"][^>]*)>/gi, (_whole, attributes) => {
  const href = attributes.match(/\bhref\s*=\s*(['"])([^'"]+)\1/i);
  if (!href) throw new Error('A built stylesheet link has no href.');
  return `<style>\n${inlineCss(resolveResource(href[2], index))}\n</style>`;
});

// Operate on tags only, never on an inline module's strings.
const scriptStart = html.indexOf('<script type="module">');
const scriptEnd = html.indexOf('</script>', scriptStart) + '</script>'.length;
if (scriptStart < 0 || scriptEnd < scriptStart) throw new Error('The inline module was not retained.');
const inlineScript = html.slice(scriptStart, scriptEnd);
html = html.slice(0, scriptStart) + '<!-- MEND_OFFLINE_MODULE -->' + html.slice(scriptEnd);
html = html.replace(/<(?:img|source|link|video|audio)\b[^>]*>/gi, tag => {
  return tag.replace(/\b(src|poster|srcset|href)\s*=\s*(['"])([^'"]*)\2/gi, (attribute, name, quote, value) => {
    if (!value) return attribute;
    if (name.toLowerCase() === 'srcset') {
      if (value.startsWith('data:')) return attribute;
      const values = value.split(',').map(item => {
        const parts = item.trim().split(/\s+/);
        const file = resolveResource(parts[0], index);
        stats.htmlAssets++;
        return [file ? dataUri(file) : parts[0], ...parts.slice(1)].join(' ');
      });
      return `${name}=${quote}${values.join(', ')}${quote}`;
    }
    const file = resolveResource(value, index);
    if (!file) return attribute;
    stats.htmlAssets++;
    return `${name}=${quote}${dataUri(file)}${quote}`;
  });
});

const remainingTags = [...html.matchAll(/<(?:img|source|link|script|video|audio|iframe)\b[^>]*>/gi)];
for (const [tag] of remainingTags) {
  for (const match of tag.matchAll(/\b(?:src|poster|srcset|href)\s*=\s*(['"])([^'"]*)\1/gi)) {
    if (match[2] && !/^(?:data:|blob:|#)/i.test(match[2])) throw new Error(`Unembedded HTML resource: ${match[2]}`);
  }
}
html = html.replace('<!-- MEND_OFFLINE_MODULE -->', () => inlineScript);
html = html.replace('<head>', '<head>\n  <!-- Self-contained MEND build: images, fonts, styles and modules are embedded. -->');

// A concurrent rebuild must never produce a mixture of old and new resources.
for (const [file, bytes] of sourceSnapshots) {
  if (!fs.existsSync(file) || !fs.readFileSync(file).equals(bytes)) throw new Error(`Build changed while packaging: ${relative(file)}. Retry after the build finishes.`);
}

const outputBytes = Buffer.from(html, 'utf8');
const report = {
  format: 'MEND self-contained HTML v1',
  output: path.basename(output),
  bytes: outputBytes.length,
  sha256: sha256(outputBytes),
  validation: 'Static reference checks passed. Runtime/browser validation is separate.',
  embedded: stats,
  sourceFiles: Object.fromEntries([...sourceFiles.entries()].sort(([a], [b]) => a.localeCompare(b))),
};
fs.mkdirSync(path.dirname(output), { recursive: true });
const temporary = output + '.tmp';
fs.writeFileSync(temporary, outputBytes);
fs.renameSync(temporary, output);
const manifest = output.replace(/\.html$/i, '') + '.manifest.json';
fs.writeFileSync(manifest, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ output, manifest, bytes: report.bytes, sha256: report.sha256, validation: report.validation, embedded: stats }, null, 2));
