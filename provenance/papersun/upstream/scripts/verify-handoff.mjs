#!/usr/bin/env node
/** Validate an extracted handoff without changing its source or evidence.
 * Run from the extracted project root:
 *   node scripts/verify-handoff.mjs --out /absolute/external/directory --http-only
 *   node scripts/verify-handoff.mjs --out /absolute/external/directory --port 4197
 * Browser overrides match qa-browser.mjs. HTTP-only mode uses Node built-ins
 * exclusively and never resolves or imports Playwright, Vite or npm packages.
 */
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, mkdir, readFile, readdir, realpath, rename, stat, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import path from 'node:path';

const usage = 'Usage: node scripts/verify-handoff.mjs --out /absolute/directory [--port 4197] [--http-only]';
function options(argv) {
  const result = { port: 4197, httpOnly: false };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') { console.log(usage); process.exit(0); }
    if (arg === '--http-only') { result.httpOnly = true; continue; }
    const match = /^--(out|port)(?:=(.*))?$/.exec(arg);
    if (!match) throw new Error(`Unknown argument: ${arg}. ${usage}`);
    const value = match[2] ?? argv[++index];
    if (!value || value.startsWith('--')) throw new Error(`Missing --${match[1]} value. ${usage}`);
    result[match[1]] = match[1] === 'port' ? Number(value) : value;
  }
  if (!result.out || !path.isAbsolute(result.out)) throw new Error(`--out must be an absolute directory. ${usage}`);
  if (!Number.isInteger(result.port) || result.port < 1 || result.port > 65535) throw new Error('--port must be an integer from 1 to 65535.');
  return result;
}

const opts = options(process.argv.slice(2));
const root = await realpath(process.cwd());
const dist = path.join(root, 'dist');
const within = (base, candidate) => candidate === base || candidate.startsWith(base + path.sep);
async function resolvedDestination(directory) {
  let existing = path.resolve(directory);
  const missing = [];
  while (true) {
    try { return path.resolve(await realpath(existing), ...missing.reverse()); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const parent = path.dirname(existing);
      if (parent === existing) throw error;
      missing.push(path.basename(existing)); existing = parent;
    }
  }
}
const out = await resolvedDestination(opts.out);
if (within(root, out)) throw new Error('--out must be outside the extracted project, including through symlinks.');
await mkdir(out, { recursive: true });
const runId = new Date().toISOString().replace(/[:.]/g, '-');
const prefix = `handoff-${opts.httpOnly ? 'http' : 'browser'}-${runId}`;
const reportFile = path.join(out, `${prefix}.json`);
const logFile = path.join(out, `${prefix}.log`);
const origin = `http://127.0.0.1:${opts.port}`;
const logLines = [];
const log = message => { const line = `${new Date().toISOString()} ${message}`; logLines.push(line); console.log(line); };
const report = {
  schema: 1, runId, startedAt: new Date().toISOString(), finishedAt: null,
  mode: opts.httpOnly ? 'http-only' : 'browser', projectRoot: root, outputDirectory: out,
  origin, node: process.version, platform: process.platform,
  scope: 'Extracted-package integrity, contained static build references, actual Node-only HTTP preview, and optional three-state Chromium smoke check. No application source or existing evidence is changed.',
  manifest: { path: 'docs/package-manifest.json', status: 'NOT_RUN', files: [] },
  references: { status: 'NOT_RUN', scope: 'HTML src/href, CSS url/import, static JS module/URL/source-map references; dynamic art filenames are checked explicitly.', entries: [] },
  http: { status: 'NOT_RUN', serverCommand: [process.execPath, 'scripts/serve.mjs'], resources: [] },
  browser: { status: opts.httpOnly ? 'NOT_RUN' : 'PENDING', reason: opts.httpOnly ? 'Explicit --http-only mode; no Playwright lookup is performed.' : null, cases: [], errors: [] },
  failures: [], reportFile, logFile,
};
function fail(scope, message, detail = {}) { report.failures.push({ scope, message, ...detail }); log(`FAIL [${scope}] ${message}`); }
const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function digest(file) {
  const before = await stat(file), hash = createHash('sha256'); let bytes = 0;
  for await (const chunk of createReadStream(file)) { hash.update(chunk); bytes += chunk.length; }
  const after = await stat(file);
  if (before.size !== after.size || before.mtimeMs !== after.mtimeMs || bytes !== after.size) throw new Error('File changed while it was being hashed.');
  return { bytes, sha256: hash.digest('hex') };
}

async function ordinaryFile(base, relative) {
  if (typeof relative !== 'string' || !relative || relative.includes('\\') || relative.includes('\0') || path.posix.isAbsolute(relative) || /^[A-Za-z]:/.test(relative) || relative.split('/').includes('..')) throw new Error(`Unsafe relative file path: ${String(relative)}`);
  const full = path.resolve(base, relative);
  if (!within(base, full) || full === base) throw new Error(`Path leaves its root: ${relative}`);
  const info = await lstat(full);
  if (!info.isFile() || info.isSymbolicLink()) throw new Error(`Not an ordinary file: ${relative}`);
  if (!within(base, await realpath(full))) throw new Error(`File resolves outside its root: ${relative}`);
  return full;
}

async function verifyManifest() {
  const raw = await readFile(path.join(root, report.manifest.path));
  const manifest = JSON.parse(raw);
  const entries = manifest.files ?? manifest.entries;
  if (!Array.isArray(entries) || !entries.length) throw new Error('Manifest must contain a nonempty files array of {path,bytes,sha256}.');
  report.manifest.sha256 = createHash('sha256').update(raw).digest('hex');
  report.manifest.expectedFileCount = entries.length;
  const seen = new Set();
  for (let start = 0; start < entries.length; start += 8) {
    const batch = await Promise.all(entries.slice(start, start + 8).map(async entry => {
      const record = { path: entry.path, expectedBytes: entry.bytes ?? entry.size, expectedSha256: entry.sha256, status: 'FAIL' };
      try {
        if (seen.has(entry.path)) throw new Error('Duplicate manifest path.');
        seen.add(entry.path);
        if (entry.path === report.manifest.path) throw new Error('The manifest must exclude itself from its hash inventory.');
        if (!Number.isSafeInteger(record.expectedBytes) || record.expectedBytes < 0 || !/^[a-f0-9]{64}$/i.test(record.expectedSha256 ?? '')) throw new Error('Invalid byte count or SHA-256.');
        record.actual = await digest(await ordinaryFile(root, entry.path));
        if (record.actual.bytes !== record.expectedBytes || record.actual.sha256 !== record.expectedSha256.toLowerCase()) throw new Error('Manifest byte count or SHA-256 differs.');
        record.status = 'PASS';
      } catch (error) { record.error = error.message; fail('manifest', `${entry.path}: ${error.message}`); }
      return record;
    }));
    report.manifest.files.push(...batch);
  }
  for (const required of ['dist/index.html', 'dist/story.html', 'dist/favicon.svg', 'scripts/serve.mjs', 'package.json']) {
    if (!seen.has(required)) fail('manifest', `Required handoff file is absent from the inventory: ${required}`);
  }
  report.manifest.totalBytes = report.manifest.files.reduce((sum, entry) => sum + (entry.actual?.bytes ?? 0), 0);
  report.manifest.status = report.failures.some(item => item.scope === 'manifest') ? 'FAIL' : 'PASS';
  log(`Manifest: ${report.manifest.files.length} files, ${report.manifest.totalBytes} bytes, ${report.manifest.status}.`);
}

async function walk(directory, relative = '') {
  const files = [];
  for (const entry of await readdir(path.join(directory, relative), { withFileTypes: true })) {
    const name = path.posix.join(relative, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlink in dist: ${name}`);
    if (entry.isDirectory()) files.push(...await walk(directory, name));
    else if (entry.isFile()) files.push(name);
  }
  return files.sort();
}

function extractedReferences(file, contents) {
  const refs = [], add = (value, kind, resource = true) => refs.push({ value, kind, resource });
  if (file.endsWith('.html')) {
    const markup = contents.replace(/(<script\b[^>]*>)[\s\S]*?<\/script\s*>/gi, '$1</script>');
    for (const match of markup.matchAll(/<([a-z][\w:-]*)\b([^>]*?)>/gi)) {
      for (const attribute of match[2].matchAll(/\b(src|href)\s*=\s*(["'])(.*?)\2/gi)) add(attribute[3], `html-${match[1].toLowerCase()}-${attribute[1].toLowerCase()}`, !['a', 'area'].includes(match[1].toLowerCase()));
    }
  }
  if (/\.(?:css|html)$/.test(file)) {
    const css = file.endsWith('.css') ? contents : [...contents.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)].map(match => match[1]).concat([...contents.matchAll(/\bstyle\s*=\s*(["'])(.*?)\1/gi)].map(match => match[2])).join('\n');
    for (const match of css.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi)) add(match[2], 'css-url');
    for (const match of css.matchAll(/@import\s+(["'])(.*?)\1/gi)) add(match[2], 'css-import');
  }
  if (/\.(?:m?js)$/.test(file)) {
    for (const match of contents.matchAll(/\b(?:import|export)\s+(?:[^;\n"']*?\bfrom\s*)?["']([^"']+)["']/g)) add(match[1], 'js-module');
    for (const match of contents.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g)) add(match[1], 'js-dynamic-literal');
    for (const match of contents.matchAll(/\bnew\s+URL\(\s*["']([^"']+)["']\s*,\s*import\.meta\.url\s*\)/g)) add(match[1], 'js-url');
    for (const match of contents.matchAll(/\/\/[#@]\s*sourceMappingURL\s*=\s*(\S+)/g)) add(match[1], 'js-source-map');
  }
  return refs;
}

let distFiles = [];
const urlFiles = new Set(['index.html', 'story.html', 'favicon.svg']);
const artFiles = ['hero', 'hero-mobile', 'attic', 'market', 'wind', 'valley', 'bridge', 'transition-midpoint'].map(name => `art/${name}.webp`);
async function verifyReferences() {
  distFiles = await walk(dist);
  const manifestPaths = new Set(report.manifest.files.filter(file => file.status === 'PASS').map(file => file.path));
  for (const file of distFiles.filter(file => /\.(?:html|css|m?js)$/.test(file))) {
    for (const reference of extractedReferences(file, await readFile(path.join(dist, file), 'utf8'))) {
      const record = { source: file, ...reference, status: 'PASS' };
      try {
        if (!reference.value || reference.value.startsWith('#') || reference.value.startsWith('data:') || reference.value === 'about:blank') { record.status = 'INLINE'; }
        else {
          const parsed = new URL(reference.value.replace(/&amp;/g, '&'), `http://handoff.invalid/${file}`);
          if (parsed.origin !== 'http://handoff.invalid') {
            if (reference.resource) throw new Error(`Runtime resource is external: ${reference.value}`);
            record.status = 'EXTERNAL_NAVIGATION';
          } else {
            const name = decodeURIComponent(parsed.pathname).replace(/^\//, '') + (parsed.pathname.endsWith('/') ? 'index.html' : '');
            await ordinaryFile(dist, name);
            if (!manifestPaths.has(`dist/${name}`)) throw new Error(`Referenced build file is not covered by a passing manifest entry: dist/${name}`);
            record.target = name; urlFiles.add(name);
          }
        }
      } catch (error) { record.status = 'FAIL'; record.error = error.message; fail('references', `${file}: ${error.message}`); }
      report.references.entries.push(record);
    }
  }
  for (const file of [...artFiles, ...distFiles.filter(file => /\.(?:woff2?|ttf|otf|m?js|css)$/.test(file))]) urlFiles.add(file);
  for (const file of urlFiles) {
    try {
      await ordinaryFile(dist, file);
      if (!manifestPaths.has(`dist/${file}`)) throw new Error('Served file is not covered by a passing manifest entry.');
    } catch (error) { fail('references', `${file}: ${error.message}`); }
  }
  for (const [label, pattern] of [['font', /\.(?:woff2?|ttf|otf)$/], ['JavaScript', /\.(?:m?js)$/], ['stylesheet', /\.css$/]]) {
    if (![...urlFiles].some(file => pattern.test(file))) fail('references', `No ${label} file found in the prepared build.`);
  }
  report.references.status = report.failures.some(item => item.scope === 'references') ? 'FAIL' : 'PASS';
  log(`Build references: ${report.references.entries.length} references, ${urlFiles.size} URLs, ${report.references.status}.`);
}

let server, browser;
const serverLines = [];
async function startServer() {
  await ordinaryFile(root, 'scripts/serve.mjs');
  server = spawn(process.execPath, ['scripts/serve.mjs'], { cwd: root, env: { ...process.env, HOST: '127.0.0.1', PORT: String(opts.port) }, stdio: ['ignore', 'pipe', 'pipe'] });
  let startupError;
  server.on('error', error => { startupError = error; });
  for (const [stream, label] of [[server.stdout, 'stdout'], [server.stderr, 'stderr']]) stream.on('data', chunk => serverLines.push({ stream: label, text: chunk.toString() }));
  for (let attempt = 0; attempt < 100; attempt++) {
    if (startupError) throw startupError;
    if (server.exitCode !== null || server.signalCode !== null) throw new Error(`Owned preview server exited with ${server.exitCode ?? server.signalCode}: ${serverLines.map(line => line.text).join('').slice(-1200)}`);
    if (serverLines.some(line => line.text.includes('PAPERSUN production preview:'))) { log(`Started included Node-only server at ${origin}.`); return; }
    await sleep(50);
  }
  throw new Error('Owned preview server did not announce readiness within five seconds.');
}

const mimePatterns = { '.html': /^text\/html\b/, '.js': /^(?:text|application)\/(?:javascript|ecmascript)\b/, '.mjs': /^(?:text|application)\/(?:javascript|ecmascript)\b/, '.css': /^text\/css\b/, '.svg': /^image\/svg\+xml\b/, '.webp': /^image\/webp\b/, '.woff': /^font\/woff\b/, '.woff2': /^font\/woff2\b/ };
async function verifyHTTP() {
  for (const file of [...urlFiles].sort()) {
    const url = `${origin}/${file.split('/').map(encodeURIComponent).join('/')}`;
    const record = { path: file, url, status: 'FAIL' };
    try {
      const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(10000) });
      record.httpStatus = response.status; record.contentType = response.headers.get('content-type');
      const bytes = Buffer.from(await response.arrayBuffer());
      record.bytes = bytes.length; record.sha256 = createHash('sha256').update(bytes).digest('hex');
      if (response.status !== 200) throw new Error(`HTTP ${response.status}.`);
      const expected = await digest(await ordinaryFile(dist, file));
      if (record.bytes !== expected.bytes || record.sha256 !== expected.sha256) throw new Error('Served body does not match the extracted file.');
      const mime = mimePatterns[path.extname(file)];
      if (mime && !mime.test(record.contentType ?? '')) throw new Error(`Unexpected content type: ${record.contentType}`);
      if (file === 'story.html') {
        record.storyChapterIds = [...bytes.toString('utf8').matchAll(/<section\b[^>]*\bid=["'](ch-\d\d)["']/g)].map(match => match[1]);
        if (new Set(record.storyChapterIds).size !== 11) throw new Error('Static story does not contain eleven chapter sections.');
      }
      record.status = 'PASS';
    } catch (error) { record.error = error.message; fail('http', `${file}: ${error.message}`); }
    report.http.resources.push(record);
  }
  report.http.artFiles = artFiles;
  report.http.status = report.failures.some(item => item.scope === 'http') ? 'FAIL' : 'PASS';
  log(`HTTP: ${report.http.resources.length} resources checked, ${report.http.status}.`);
}

async function verifyBrowser() {
  // Deliberately lazy: this line is unreachable in --http-only mode.
  const require = createRequire(import.meta.url);
  const { chromium } = require(process.env.PAPERSUN_PLAYWRIGHT_MODULE || 'playwright');
  const args = process.env.PAPERSUN_BROWSER_ARGS ? JSON.parse(process.env.PAPERSUN_BROWSER_ARGS) : [];
  const extraEnv = process.env.PAPERSUN_BROWSER_ENV ? JSON.parse(process.env.PAPERSUN_BROWSER_ENV) : {};
  if (!Array.isArray(args) || args.some(arg => typeof arg !== 'string')) throw new Error('PAPERSUN_BROWSER_ARGS must be a JSON array of strings.');
  if (!extraEnv || Array.isArray(extraEnv) || typeof extraEnv !== 'object' || Object.values(extraEnv).some(value => typeof value !== 'string')) throw new Error('PAPERSUN_BROWSER_ENV must be a JSON object of strings.');
  const launchOptions = { headless: true, executablePath: process.env.PAPERSUN_BROWSER_PATH || undefined, args, env: { ...process.env, ...extraEnv }, timeout: 30000 };
  report.browser.launchRetries = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    try { browser = await chromium.launch(launchOptions); break; }
    catch (error) {
      report.browser.launchRetries.push({ attempt, at: new Date().toISOString(), error: String(error.stack || error), sameConfiguration: true, beforePageExists: true });
      log(`Browser launch attempt ${attempt} failed before a page existed${attempt < 2 ? '; retrying the same configuration once' : ''}.`);
      if (attempt === 2) throw error;
      await sleep(250);
    }
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, hasTouch: false, isMobile: false, locale: 'en-US', timezoneId: 'UTC' });
  const page = await context.newPage(); page.setDefaultTimeout(5000);
  report.browser.conditions = { browserVersion: browser.version(), viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, hasTouch: false, isMobile: false, launchArgs: args, executableOverride: process.env.PAPERSUN_BROWSER_PATH || null, environmentKeys: Object.keys(extraEnv), scope: 'Three real Chromium CSS-viewport screenshots; no physical-device, touch, cross-browser, performance or native-zoom claim.' };
  page.on('pageerror', error => report.browser.errors.push({ type: 'pageerror', message: error.message, url: page.url() }));
  page.on('console', message => { if (message.type() === 'error') report.browser.errors.push({ type: 'console', message: message.text(), url: page.url() }); });
  const frames = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const states = [{ id: 'first', hash: '', chapter: 1 }, { id: 'transition-midpoint', hash: '#tr-08-09@50', chapter: 9, transition: '8:0.500' }, { id: 'ending', hash: '#ch-11', chapter: 11 }];
  for (const state of states) {
    const sample = { id: state.id, requested: state, status: 'FAIL', screenshot: null, errors: [] };
    const errorStart = report.browser.errors.length;
    try {
      await page.goto(`${origin}/${state.hash}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForSelector('.chapter');
      await page.waitForFunction(() => document.fonts.status === 'loaded', null, { timeout: 5000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(() => [...document.querySelectorAll('#scene-from,#scene-to')].length === 2 && [...document.querySelectorAll('#scene-from,#scene-to')].every(scene => scene.dataset.ready === 'true' && scene.querySelector('img')?.complete && scene.querySelector('img')?.naturalWidth > 0), null, { timeout: 5000 });
      await frames();
      sample.metrics = await page.evaluate(() => {
        const chapters = [...document.querySelectorAll('.chapter')], heading = document.querySelector(Number(document.documentElement.dataset.activeChapter) === 1 ? '#title-ch-01' : `#ch-${String(document.documentElement.dataset.activeChapter).padStart(2, '0')} h2`);
        const range = document.createRange(); if (heading) range.selectNodeContents(heading);
        const textRects = heading ? [...range.getClientRects()].filter(rect => rect.width > 0 && rect.height > 0).map(rect => ({ x: rect.x, y: rect.y, width: rect.width, height: rect.height })) : [];
        const beats = chapters.map(chapter => chapter.querySelectorAll('.beats p').length);
        return { url: location.href, hash: location.hash, chapterCount: chapters.length, beats, totalBeats: beats.reduce((sum, count) => sum + count, 0), activeChapter: Number(document.documentElement.dataset.activeChapter), transition: document.documentElement.dataset.transition ?? null, heading: heading?.textContent.trim() ?? '', textRects, fontsStatus: document.fonts.status, fontFaces: [...document.fonts].map(font => ({ family: font.family, status: font.status })), userAgent: navigator.userAgent, maxTouchPoints: navigator.maxTouchPoints, viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio }, images: [...document.querySelectorAll('#scene-from img,#scene-to img')].map(image => ({ source: image.currentSrc, complete: image.complete, width: image.naturalWidth, height: image.naturalHeight })), documentWidth: document.documentElement.scrollWidth };
      });
      const m = sample.metrics;
      if (m.chapterCount !== 11 || m.totalBeats !== 22 || m.beats.some(count => count !== 2)) sample.errors.push('Expected eleven chapters with two beats each, twenty-two total.');
      if (m.activeChapter !== state.chapter) sample.errors.push(`Expected chapter ${state.chapter}, observed ${m.activeChapter}.`);
      if (state.hash && m.hash !== state.hash) sample.errors.push(`Expected hash ${state.hash}, observed ${m.hash}.`);
      if (state.transition) { const [index, progress] = String(m.transition).split(':').map(Number); if (index !== 8 || Math.abs(progress - .5) > .002) sample.errors.push(`Expected transition 8 at 50%, observed ${m.transition}.`); }
      if (!m.textRects.length || m.fontsStatus !== 'loaded' || m.fontFaces.some(font => font.status === 'error')) sample.errors.push('Readable text/font readiness was not established.');
      if (m.documentWidth > m.viewport.width + 1) sample.errors.push('Document horizontal overflow.');
      sample.screenshot = path.join(out, `${prefix}-${state.id}.jpg`);
      await page.screenshot({ path: sample.screenshot, type: 'jpeg', quality: 88, fullPage: false, scale: 'css', timeout: 15000 });
      await frames();
      sample.errors.push(...report.browser.errors.slice(errorStart).map(error => `${error.type}: ${error.message}`));
      sample.status = sample.errors.length ? 'FAIL' : 'PASS_MEASURED';
    } catch (error) { sample.errors.push(error.message); }
    if (sample.status === 'FAIL') fail('browser', `${state.id}: ${sample.errors.join(' | ')}`);
    report.browser.cases.push(sample); log(`Browser ${state.id}: ${sample.status}.`);
  }
  if (report.browser.errors.length) fail('browser', `${report.browser.errors.length} page/console errors were observed.`);
  report.browser.status = report.failures.some(item => item.scope === 'browser') ? 'FAIL' : 'PASS_MEASURED';
  report.browser.humanVisualReview = 'Not performed by this script. Inspect its actual screenshots before visual acceptance.';
}

try {
  log(`Verifying ${root} in ${report.mode} mode. Output: ${out}`);
  for (const [scope, task] of [['manifest', verifyManifest], ['references', verifyReferences]]) {
    try { await task(); } catch (error) { report[scope].status = 'FAIL'; fail(scope, error.message); }
  }
  await startServer();
  await verifyHTTP();
  if (!opts.httpOnly) { try { await verifyBrowser(); } catch (error) { report.browser.status = 'FAIL'; fail('browser', error.message); } }
} catch (error) { fail('runner', error.message); }
finally {
  if (browser) { try { await browser.close(); } catch (error) { fail('cleanup', error.message); } }
  if (server && server.exitCode === null && server.signalCode === null) {
    server.kill('SIGTERM');
    for (let attempt = 0; attempt < 40 && server.exitCode === null && server.signalCode === null; attempt++) await sleep(50);
    if (server.exitCode === null && server.signalCode === null) server.kill('SIGKILL');
  }
  report.http.serverLog = serverLines;
  report.finishedAt = new Date().toISOString();
  report.status = report.failures.length ? 'FAIL' : opts.httpOnly ? 'PASS_HTTP_ONLY' : 'PASS_MEASURED';
  log(`${report.status}; ${report.failures.length} failures. Report: ${reportFile}`);
  await writeFile(`${reportFile}.tmp`, JSON.stringify(report, null, 2) + '\n');
  await rename(`${reportFile}.tmp`, reportFile);
  await writeFile(logFile, logLines.join('\n') + '\n\nNODE PREVIEW SERVER\n' + serverLines.map(line => `[${line.stream}] ${line.text}`).join(''));
  if (report.failures.length) process.exitCode = 1;
}
