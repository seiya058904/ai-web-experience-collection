#!/usr/bin/env node
/** Local-only cache/lifecycle complement to the routed browser harness. */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const key = process.argv[i];
  if (!key.startsWith('--') || !process.argv[i + 1]) throw new Error(`Invalid argument: ${key}`);
  args[key.slice(2)] = process.argv[++i];
}
const defaultProject = existsSync(path.resolve(here, '../backstage/package.json'))
  ? path.resolve(here, '../backstage') : path.resolve(here, '..');
const project = path.resolve(args.project || defaultProject);
const dist = path.resolve(args.dist || path.join(project, 'dist'));
const out = path.resolve(args.out || path.join(project, 'qa-results', 'http'));
const headed = args.headed === 'true';
if(args.browsers)process.env.PLAYWRIGHT_BROWSERS_PATH=path.resolve(args.browsers);
const require = createRequire(path.join(project, 'package.json'));
const { chromium } = require('playwright');
const hash = buffer => createHash('sha256').update(buffer).digest('hex');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
if (args.phase === 'dev-smoke') {
  await devSmoke();
  process.exit(process.exitCode || 0);
}
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2' };
await fs.mkdir(out, { recursive: true });

// Freeze exact current build bytes before the server starts. Later builds cannot
// make one run accidentally contain a mixture of old and new asset versions.
const files = new Map();
async function snapshot(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) await snapshot(absolute);
    else if (entry.isFile()) {
      const bytes = await fs.readFile(absolute), stat = await fs.stat(absolute);
      const pathname = '/' + path.relative(dist, absolute).split(path.sep).join('/');
      files.set(pathname, { bytes, sha256: hash(bytes), modified: stat.mtime.toUTCString(), mime: mime[path.extname(entry.name)] || 'application/octet-stream' });
    }
  }
}
await snapshot(dist);
if (!files.has('/index.html')) throw new Error('dist/index.html is missing');

let server, browser, context, cdp, page, phase = 'setup';
const serverRequests = [], network = [], logs = [];
const report = {
  started: new Date().toISOString(), finished: null,
  environment: {
    node: process.version, platform: os.platform(), architecture: os.arch(),
    browser: null, viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1,
    renderer: `${headed ? 'Headed Chromium on an isolated virtual display' : 'Headless Chromium'} / ANGLE SwiftShader software WebGL`,
    headless: !headed,
    focusEmulation: 'Disabled on Playwright\u2019s original CDP session so browser tab visibility is genuine, not forced visible by automation',
    serving: 'Ephemeral 127.0.0.1 HTTP server; exact in-memory snapshot of current dist; no request routing and no external deployment',
    browserFallback: 'Browser extension navigation to the private local preview timed out twice. The cloud browser loaded the preview but its GL_RENDERER was Disabled and WebGL context creation failed. Explicit browser QA therefore uses installed Chromium with SwiftShader.',
    project, dist, indexSHA256: files.get('/index.html').sha256,
  },
  buildFiles: [...files].map(([pathname, value]) => ({ path: pathname, bytes: value.bytes.length, sha256: value.sha256 })),
  cache: {}, lifecycle: {}, checks: [], logs,
  limitations: [
    'This is one Chromium software-WebGL environment, not a physical phone, Windows GPU, Firefox or Safari.',
    'The HTTP cache is genuine browser cache under explicit local Cache-Control headers; it does not assert the behavior of a deployed host.',
    'Lifecycle frozen/active via CDP is recorded separately from document.hidden. A headless tab that remains visible is not described as a successful true-background test.',
  ],
};
function check(id, pass, detail = null) { report.checks.push({ id, pass: Boolean(pass), detail }); }
async function useRealBrowserFocus(targetPage) {
  // The installed Playwright 1.56.1 crPage.js enables focus emulation on its
  // own session. Emulation is session-scoped: a second CDP session cannot clear
  // that override. Use its inspected in-process bridge to send only the public
  // CDP disable command to the owning session. No document property is patched.
  const owner = targetPage._connection?.toImpl?.(targetPage)?.delegate?._mainFrameSession?._client;
  if (!owner) throw new Error('This lifecycle probe requires the pinned in-process Playwright 1.56.1 focus-session bridge.');
  await owner.send('Emulation.setFocusEmulationEnabled', { enabled: false });
}
async function devSmoke() {
  const result = { started: new Date().toISOString(), source: project, environment: 'Isolated programmatic Vite development server on ephemeral loopback port; Chromium with ANGLE SwiftShader', checks: [], logs: [] };
  let vite, devBrowser, devContext;
  const verify = (id, pass, detail = null) => result.checks.push({ id, pass: Boolean(pass), detail });
  await fs.mkdir(out, { recursive: true });
  try {
    const { createServer: createViteServer } = await import(require.resolve('vite'));
    vite = await createViteServer({ root: project, server: { host: '127.0.0.1', port: 0, strictPort: true, hmr: false } });
    await vite.listen();
    result.origin = `http://127.0.0.1:${vite.httpServer.address().port}`;
    result.mainSHA256 = hash(await fs.readFile(path.join(project, 'src/main.js')));
    devBrowser = await chromium.launch({ headless: !headed, args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
    result.browser = devBrowser.version();
    devContext = await devBrowser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const target = await devContext.newPage();
    target.on('pageerror', error => result.logs.push({ kind: 'pageerror', text: error.message }));
    target.on('console', message => { if (message.type() === 'error') result.logs.push({ kind: 'console-error', text: message.text() }); });
    target.on('requestfailed', request => result.logs.push({ kind: 'requestfailed', url: request.url(), text: request.failure()?.errorText }));
    console.log('Development QA: isolated Vite source server, live graphics, and one director cue.');
    await target.goto(result.origin + '/', { waitUntil: 'load', timeout: 45_000 });
    result.title = await target.title();
    if (!result.title.startsWith('BACKSTAGE')) throw new Error('Unexpected application title; development smoke test stopped.');
    await target.waitForFunction(() => document.querySelector('#stage')?.classList.contains('is-ready') && document.querySelector('#stage')?.dataset.renderInfo, undefined, { timeout: 45_000 });
    await target.evaluate(() => document.fonts.ready);
    const read = () => target.evaluate(() => {
      const stage = document.querySelector('#stage'), info = JSON.parse(stage.dataset.renderInfo || '{}');
      return { ready: stage.classList.contains('is-ready'), static: document.body.classList.contains('static-mode'), bootFallback: document.body.classList.contains('boot-fallback'), world: Number(stage.dataset.world), target: stage.dataset.scene, view: Number(stage.dataset.view), light: Number(stage.dataset.light), mode: stage.dataset.mode, doorId: info.doorId, lanternId: info.lanternId, fonts: [...document.fonts].map(font => ({ family: font.family, status: font.status })), viteModuleLoaded: performance.getEntriesByType('resource').some(entry => entry.name.includes('/@vite/client')) };
    });
    result.initial = await read();
    verify('development-live-stage', result.initial.ready && !result.initial.static && !result.initial.bootFallback && result.initial.viteModuleLoaded);
    verify('development-fonts-loaded', result.initial.fonts.length === 4 && result.initial.fonts.every(font => font.status === 'loaded'));
    await target.screenshot({ path: path.join(out, 'dev-ready-1440x900.png') });
    await target.evaluate(() => { const rect = document.querySelector('#story').getBoundingClientRect(); scrollTo({ top: Math.ceil(rect.top + scrollY + .735 * (rect.height - innerHeight)), behavior: 'instant' }); });
    await target.waitForFunction(() => document.querySelector('#stage').dataset.mode === 'director', undefined, { timeout: 20_000 });
    await target.locator('[data-scene="sea"]').click();
    await target.waitForFunction(() => Number(document.querySelector('#stage').dataset.world) < 1.99, undefined, { timeout: 20_000 });
    result.midCue = await read();
    verify('development-real-cue-started', result.midCue.target === 'sea' && result.midCue.world > 1 && result.midCue.world < 2);
    await target.waitForFunction(() => Math.abs(Number(document.querySelector('#stage').dataset.world) - 1) < .0001, undefined, { timeout: 55_000 });
    result.settled = await read();
    verify('development-cue-completed', result.settled.target === 'sea' && result.settled.world === 1);
    verify('development-same-props', result.initial.doorId === result.settled.doorId && result.initial.lanternId === result.settled.lanternId);
    verify('development-no-runtime-errors', result.logs.length === 0, result.logs);
    await target.screenshot({ path: path.join(out, 'dev-cue-sea-1440x900.png') });
  } catch (error) { result.fatal = { message: error.message, stack: error.stack }; process.exitCode = 1; }
  finally {
    await devContext?.close().catch(() => {});
    await devBrowser?.close().catch(() => {});
    await vite?.close().catch(() => {});
    result.finished = new Date().toISOString();
    result.summary = { checks: result.checks.length, passed: result.checks.filter(check => check.pass).length, failed: result.checks.filter(check => !check.pass).length };
    if (result.summary.failed) process.exitCode = 1;
    await fs.writeFile(path.join(out, 'results.json'), JSON.stringify(result, null, 2));
    console.log('Development QA evidence:', path.join(out, 'results.json'));
  }
}
function requestPath(raw) {
  let decoded;
  try { decoded = decodeURIComponent(String(raw || '/').split('?')[0]); } catch { return null; }
  if (!decoded.startsWith('/') || decoded.includes('\0') || decoded.includes('\\') || decoded.split('/').includes('..')) return null;
  const normalized = path.posix.normalize(decoded);
  return normalized === '/' ? '/index.html' : normalized;
}
function createServer() {
  return http.createServer((req, res) => {
    const pathname = requestPath(req.url), file = pathname && files.get(pathname);
    const record = { phase, method: req.method, path: pathname, status: 0, bytes: 0 };
    serverRequests.push(record);
    if (!['GET', 'HEAD'].includes(req.method)) { record.status = 405; res.writeHead(405).end(); return; }
    if (!pathname) { record.status = 400; res.writeHead(400).end('Bad path'); return; }
    if (!file) { record.status = 404; res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found'); return; }
    const isHTML = pathname.endsWith('.html');
    const headers = {
      'Content-Type': file.mime, 'Cache-Control': isHTML ? 'no-store' : 'public, max-age=3600',
      'ETag': `"${file.sha256}"`, 'Last-Modified': file.modified, 'X-Content-Type-Options': 'nosniff',
    };
    if (!isHTML && req.headers['if-none-match'] === headers.ETag) {
      record.status = 304; res.writeHead(304, headers).end(); return;
    }
    record.status = 200; record.bytes = req.method === 'HEAD' ? 0 : file.bytes.length;
    res.writeHead(200, { ...headers, 'Content-Length': file.bytes.length });
    res.end(req.method === 'HEAD' ? undefined : file.bytes);
  });
}
async function ready() {
  await page.waitForFunction(() => {
    const stage = document.querySelector('#stage');
    let info; try { info = JSON.parse(stage?.dataset.renderInfo || 'null'); } catch { return false; }
    return stage?.classList.contains('is-ready') && info && !info.contextLost && Number(getComputedStyle(document.querySelector('#theatre')).opacity) > .98;
  }, undefined, { timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
}
async function metrics() {
  return page.evaluate(() => {
    const stage = document.querySelector('#stage'), story = document.querySelector('#story');
    let info = {}; try { info = JSON.parse(stage?.dataset.renderInfo || '{}'); } catch {}
    return {
      title: document.title, url: location.href, hidden: document.hidden, visibility: document.visibilityState,
      ready: stage?.classList.contains('is-ready'), controllerReady: document.body.dataset.controllerReady,
      static: document.body.classList.contains('static-mode'), bootFallback: document.body.classList.contains('boot-fallback'),
      world: Number(stage?.dataset.world), target: stage?.dataset.scene, view: Number(stage?.dataset.view), light: Number(stage?.dataset.light),
      lamp: Number(stage?.dataset.lamp), mode: stage?.dataset.mode, progress: Number(story?.dataset.progress),
      doorId: info.doorId, lanternId: info.lanternId, fontStatus: document.fonts.status,
      fonts: [...document.fonts].map(f => ({ family: f.family, weight: f.weight, status: f.status })),
      fontChecks: { fraunces: document.fonts.check('500 32px Fraunces'), sourceSans: document.fonts.check('400 16px "Source Sans 3"') },
      resources: performance.getEntriesByType('resource').map(e => ({ name: new URL(e.name).pathname, initiatorType: e.initiatorType, transferSize: e.transferSize, encodedBodySize: e.encodedBodySize, decodedBodySize: e.decodedBodySize, duration: e.duration })),
    };
  });
}
function cacheSummary(name) {
  const responses = network.filter(e => e.phase === name && e.type === 'response');
  const served = network.filter(e => e.phase === name && e.type === 'served-from-cache');
  return {
    serverRequests: serverRequests.filter(e => e.phase === name),
    responses,
    requestServedFromCache: served,
    diskCacheResponses: responses.filter(e => e.fromDiskCache),
    memoryOrOtherLocalCache: served.filter(e => !responses.some(r => r.requestId === e.requestId && r.fromDiskCache)),
  };
}
async function setProgress(p) {
  await page.evaluate(p => {
    const rect = document.querySelector('#story').getBoundingClientRect();
    const start = rect.top + scrollY, end = rect.bottom + scrollY - innerHeight;
    scrollTo({ top: Math.ceil(start + p * (end - start)), behavior: 'instant' });
  }, p);
  await page.waitForFunction(p => Math.abs(Number(document.querySelector('#story').dataset.progress) - p) < .002, p);
}
try {
  server = createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  report.environment.origin = origin;
  browser = await chromium.launch({ headless: !headed,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    ignoreDefaultArgs: ['--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding'],
  });
  report.environment.browser = browser.version();
  context = await browser.newContext({ viewport: report.environment.viewport, deviceScaleFactor: 1, serviceWorkers: 'block', reducedMotion: 'no-preference' });
  page = await context.newPage();
  await useRealBrowserFocus(page);
  page.setDefaultTimeout(20_000);
  page.on('pageerror', error => logs.push({ phase, kind: 'pageerror', text: error.message }));
  page.on('console', message => { if (['warning', 'error', 'info'].includes(message.type())) logs.push({ phase, kind: message.type(), text: message.text() }); });
  page.on('requestfailed', request => logs.push({ phase, kind: 'requestfailed', url: request.url(), text: request.failure()?.errorText }));
  cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: false });
  await cdp.send('Network.clearBrowserCache');
  const urls = new Map();
  cdp.on('Network.requestWillBeSent', e => urls.set(e.requestId, e.request.url));
  cdp.on('Network.requestServedFromCache', e => network.push({ phase, type: 'served-from-cache', requestId: e.requestId, url: urls.get(e.requestId) || null }));
  cdp.on('Network.responseReceived', e => network.push({
    phase, type: 'response', requestId: e.requestId, url: e.response.url, resourceType: e.type,
    status: e.response.status, fromDiskCache: Boolean(e.response.fromDiskCache), fromPrefetchCache: Boolean(e.response.fromPrefetchCache),
    fromServiceWorker: Boolean(e.response.fromServiceWorker), encodedDataLength: e.response.encodedDataLength,
    cacheControl: e.response.headers['Cache-Control'] || e.response.headers['cache-control'] || null,
  }));

  phase = 'cold';
  console.log('HTTP QA: cold navigation, browser cache explicitly empty.');
  await page.goto(origin + '/', { waitUntil: 'load', timeout: 30_000 });
  await ready();
  const cold = await metrics();
  if (args.phase !== 'lifecycle') await page.screenshot({ path: path.join(out, 'cold-ready-1440x900.png') });
  report.cache.cold = { ...cacheSummary('cold'), metrics: cold };
  check('cold-live-stage', cold.ready && !cold.static && !cold.bootFallback && cold.title.startsWith('BACKSTAGE'));
  check('cold-local-fonts-loaded', cold.fontStatus === 'loaded' && cold.fontChecks.fraunces && cold.fontChecks.sourceSans);
  check('cold-no-cache-hit', report.cache.cold.diskCacheResponses.length === 0 && report.cache.cold.requestServedFromCache.length === 0);

  if (args.phase !== 'lifecycle') {
  phase = 'between';
  await page.goto('about:blank');
  phase = 'warm';
  console.log('HTTP QA: repeat navigation in the same context; cache remains enabled.');
  await page.goto(origin + '/', { waitUntil: 'load', timeout: 30_000 });
  await ready();
  const warm = await metrics();
  await page.screenshot({ path: path.join(out, 'warm-ready-1440x900.png') });
  report.cache.warm = { ...cacheSummary('warm'), metrics: warm };
  check('warm-live-stage', warm.ready && !warm.static && !warm.bootFallback);
  check('warm-local-fonts-loaded', warm.fontStatus === 'loaded' && warm.fontChecks.fraunces && warm.fontChecks.sourceSans);
  check('warm-actual-cache-hit', report.cache.warm.diskCacheResponses.length + report.cache.warm.requestServedFromCache.length > 0);
  const coldAssets = report.cache.cold.serverRequests.filter(r => r.path !== '/index.html' && r.status === 200);
  const warmAssets = report.cache.warm.serverRequests.filter(r => r.path !== '/index.html' && r.status === 200);
  check('warm-fewer-server-asset-requests', warmAssets.length < coldAssets.length, { cold: coldAssets.length, warm: warmAssets.length });
  check('html-revalidated-by-navigation', report.cache.warm.serverRequests.some(r => r.path === '/index.html' && r.status === 200));
  }

  phase = 'visibility';
  console.log('HTTP QA: checking genuine browser tab visibility with automation focus emulation disabled.');
  const foreground = await page.evaluate(() => ({ hidden: document.hidden, visibility: document.visibilityState }));
  const other = await context.newPage();
  await useRealBrowserFocus(other);
  await other.goto('about:blank');
  await other.bringToFront();
  await sleep(250);
  const behind = await page.evaluate(() => ({ hidden: document.hidden, visibility: document.visibilityState }));
  await page.bringToFront();
  report.lifecycle.visibilityAttempt = { foreground, otherTabBroughtToFront: behind, trueBackgroundObserved: behind.hidden };
  if (!behind.hidden) report.limitations.push('Bringing another headless tab to the front left document.hidden=false; true background-tab visibility was not exercised in this environment.');
  check('true-background-tab-observed', behind.hidden && behind.visibility === 'hidden');

  phase = 'freeze';
  await setProgress(.735);
  await page.locator('#view').focus(); await page.keyboard.press('End');
  await page.locator('#light').focus(); await page.keyboard.press('Home');
  await page.waitForFunction(() => Number(document.querySelector('#stage').dataset.view) === 1 && Number(document.querySelector('#stage').dataset.light) === 0);
  await page.evaluate(() => {
    const read = () => {
      const stage = document.querySelector('#stage');
      return { at: performance.now(), hidden: document.hidden, visibility: document.visibilityState,
        world: Number(stage.dataset.world), target: stage.dataset.scene, view: Number(stage.dataset.view), light: Number(stage.dataset.light), lamp: Number(stage.dataset.lamp), mode: stage.dataset.mode };
    };
    const log = window.__backstageLifecycleQA = { events: [], mutations: [], timerTicks: 0, lastTick: 0, rafTicks: 0, lastRAF: 0, resumed: false };
    for (const type of ['freeze', 'resume', 'visibilitychange']) document.addEventListener(type, () => {
      log.events.push({ type, ...read(), timerTicks: log.timerTicks, rafTicks: log.rafTicks });
      if (type === 'resume') log.resumed = true;
    });
    setInterval(() => { log.timerTicks++; log.lastTick = performance.now(); }, 50);
    function recordRAF(time) { log.rafTicks++; log.lastRAF = time; requestAnimationFrame(recordRAF); }
    requestAnimationFrame(recordRAF);
    new MutationObserver(() => {
      if (log.resumed && log.mutations.length < 20) log.mutations.push(read());
    }).observe(document.querySelector('#stage'), { attributes: true, attributeFilter: ['data-world'] });
  });
  await page.locator('[data-scene="room"]').click();
  await page.waitForFunction(() => {
    const value = Number(document.querySelector('#stage').dataset.world);
    return value < 1.99 && value > .1;
  });
  const before = await metrics();
  await other.bringToFront();
  const backgroundStart = await metrics();
  const backgroundAt = Date.now();
  await sleep(1500);
  const backgroundEnd = await metrics();
  report.lifecycle.background = { method: 'Actual second tab brought to front', requestedHiddenMs: 1500, hiddenWallMs: Date.now() - backgroundAt, before: backgroundStart, after: backgroundEnd };
  check('background-cue-paused', backgroundStart.hidden && backgroundEnd.hidden && backgroundStart.world === backgroundEnd.world);
  check('background-director-choices-preserved', backgroundStart.target === backgroundEnd.target && backgroundStart.view === backgroundEnd.view && backgroundStart.light === backgroundEnd.light);
  report.lifecycle.freezeRestore = { method: 'CDP Page.setWebLifecycleState frozen -> active', requestedFreezeMs: 3500, before };
  console.log('HTTP QA: freeze an in-progress scene cue for 3.5 seconds, then restore.');
  await cdp.send('Page.setWebLifecycleState', { state: 'frozen' });
  const frozenAt = Date.now();
  await sleep(3500);
  await cdp.send('Page.setWebLifecycleState', { state: 'active' });
  const frozenWallMs = Date.now() - frozenAt;
  report.lifecycle.freezeRestore.frozenWallMs = frozenWallMs;
  report.lifecycle.freezeRestore.immediateEventLog = await page.evaluate(() => window.__backstageLifecycleQA);
  await page.bringToFront();
  await page.waitForFunction(() => window.__backstageLifecycleQA?.mutations.length > 0);
  const after = await metrics();
  const lifecycle = await page.evaluate(() => window.__backstageLifecycleQA);
  const freezeEvent = lifecycle.events.find(e => e.type === 'freeze');
  const resumeEvent = lifecycle.events.find(e => e.type === 'resume');
  const firstMutation = lifecycle.mutations[0];
  report.lifecycle.freezeRestore = { method: 'CDP Page.setWebLifecycleState frozen -> active', requestedFreezeMs: 3500, frozenWallMs, before, immediatelyAfter: after, eventLog: lifecycle, freezeEvent, resumeEvent, firstMutation };
  check('lifecycle-freeze-resume-events', Boolean(freezeEvent && resumeEvent));
  check('frozen-structural-state-preserved', freezeEvent && resumeEvent && Math.abs(freezeEvent.world - resumeEvent.world) < 1e-7 && freezeEvent.target === resumeEvent.target && freezeEvent.view === resumeEvent.view && freezeEvent.light === resumeEvent.light);
  check('frozen-page-timer-paused', freezeEvent && resumeEvent && freezeEvent.timerTicks === resumeEvent.timerTicks);
  check('no-full-cue-catchup-on-resume', freezeEvent && firstMutation && firstMutation.world > .001 && Math.abs(firstMutation.world - freezeEvent.world) < .065, { before: freezeEvent?.world, firstFrame: firstMutation?.world });
  check('same-props-after-freeze', before.doorId === after.doorId && before.lanternId === after.lanternId);
  check('director-choices-retained', after.target === 'room' && after.view === 1 && after.light === 0);
  await page.waitForFunction(() => Number(document.querySelector('#stage').dataset.world) < .0001, undefined, { timeout: 55_000 });
  await page.waitForTimeout(200);
  report.lifecycle.settled = await metrics();
  check('cue-finishes-after-resume', report.lifecycle.settled.target === 'room' && report.lifecycle.settled.world < .0001 && report.lifecycle.settled.ready);
  await page.screenshot({ path: path.join(out, 'freeze-restored-room-1440x900.png') });
  await other.close();
  check('no-app-runtime-errors', !logs.some(e => e.kind === 'pageerror' || e.kind === 'requestfailed' || e.kind === 'error'), logs);
  console.log(`HTTP QA: ${report.checks.filter(c => c.pass).length}/${report.checks.length} checks passed.`);
} catch (error) {
  report.fatal = { message: error.message, stack: error.stack };
  if (page && !page.isClosed()) {
    report.failureState = await metrics().catch(captureError => ({ error: captureError.message }));
    report.failureDOM = await page.evaluate(() => ({
      bodyClasses: document.body.className,
      stageClasses: document.querySelector('#stage')?.className,
      canvasOpacity: document.querySelector('#theatre') && getComputedStyle(document.querySelector('#theatre')).opacity,
      canvasRect: document.querySelector('#theatre')?.getBoundingClientRect().toJSON(),
      renderInfo: document.querySelector('#stage')?.dataset.renderInfo,
      recoveryText: document.querySelector('#recovery')?.innerText,
      cueStatus: document.querySelector('#cue-status')?.innerText,
      lifecycleQA: window.__backstageLifecycleQA,
      productionRect: document.querySelector('#production')?.getBoundingClientRect().toJSON(),
    })).catch(captureError => ({ error: captureError.message }));
    await page.screenshot({ path: path.join(out, `failure-${phase}-1440x900.png`), timeout: 15_000 }).catch(() => {});
  }
  process.exitCode = 1;
  console.error('HTTP QA failed:', error.message);
} finally {
  phase = 'cleanup';
  await context?.close().catch(() => {});
  await browser?.close().catch(() => {});
  if (server) {
    server.closeAllConnections?.();
    await new Promise(resolve => server.close(resolve));
  }
  report.finished = new Date().toISOString();
  report.summary = { checks: report.checks.length, passed: report.checks.filter(c => c.pass).length, failed: report.checks.filter(c => !c.pass).length };
  report.serverRequests = serverRequests;
  report.networkEvents = network;
  for (const name of ['cold', 'warm']) {
    if (!report.cache[name] && serverRequests.some(e => e.phase === name)) report.cache[name] = cacheSummary(name);
  }
  await fs.writeFile(path.join(out, 'results.json'), JSON.stringify(report, null, 2));
  if (report.summary.failed) process.exitCode = 1;
  console.log('HTTP QA evidence:', path.join(out, 'results.json'));
}
