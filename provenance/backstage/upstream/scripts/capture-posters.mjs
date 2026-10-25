#!/usr/bin/env node
/**
 * Capture the four fallback posters from the actual built WebGL theatre.
 *
 *   node scripts/capture-posters.mjs --dist dist --out ../qa/posters-final
 *   node scripts/capture-posters.mjs --project . --browsers /path/to/playwright-browsers
 *
 * Uses the project's installed Playwright. Install its Chromium separately with
 * `npx playwright install chromium` if needed. No private browser path is required.
 * The default output is a sibling qa/posters-final directory; public assets are
 * never replaced automatically. Inspect the images and manifest before copying.
 *
 * The normal authored motion preference preserves the exact audience, wings and
 * sea camera poses. No production state, animation clock or renderer is replaced.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

const here = path.dirname(fileURLToPath(import.meta.url));
const options = {};
for (let i = 2; i < process.argv.length; i++) {
  const name = process.argv[i];
  if (!['--project', '--dist', '--out', '--browsers'].includes(name)) throw new Error(`Unknown option: ${name}`);
  const value = process.argv[++i];
  if (!value || value.startsWith('--')) throw new Error(`Missing value for ${name}`);
  options[name.slice(2)] = value;
}
const project = path.resolve(options.project || path.join(here, '..'));
const dist = path.resolve(options.dist || path.join(project, 'dist'));
const out = path.resolve(options.out || path.join(project, '..', 'qa', 'posters-final'));
if (options.browsers) process.env.PLAYWRIGHT_BROWSERS_PATH = path.resolve(options.browsers);
const require = createRequire(path.join(project, 'package.json'));
const { chromium } = require('playwright');
const origin = 'http://poster-capture.local:4173';
const viewport = { width: 1440, height: 900 };
const targets = [
  { name: 'room', p: 0, world: 0, view: 0, lamp: 0 },
  { name: 'wings', p: .29, world: 0, view: 1, lamp: 0 },
  { name: 'sea', p: .55, world: 1, view: .12, lamp: .7 },
  { name: 'night', p: .735, world: 2, view: 0, lamp: 1 },
];
const mime = { html: 'text/html', js: 'application/javascript', css: 'text/css', png: 'image/png', svg: 'image/svg+xml', woff2: 'font/woff2', webp: 'image/webp', json: 'application/json' };
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
async function deadline(promise, timeout, label) {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label} exceeded ${timeout}ms`)), timeout); })]); }
  finally { clearTimeout(timer); }
}

await fs.mkdir(out, { recursive: true });
const index = await fs.readFile(path.join(dist, 'index.html'));
const manifest = {
  status: 'RUNNING', started: new Date().toISOString(), finished: null,
  source: { project, dist, indexSHA256: sha256(index) },
  environment: { browser: null, viewport, deviceScaleFactor: 1, reducedMotion: false, rendering: 'Actual Three.js WebGL 2 via Chromium / ANGLE SwiftShader', serving: 'Exact built files fulfilled locally; no server deployment or image substitution' },
  capture: { method: 'CDP Page.captureScreenshot with the actual canvas document rectangle', scope: 'Only #theatre canvas pixels; page copy, controls and stage caption are excluded', timeoutMs: 45_000, postProcessing: 'None' },
  images: [], requests: [], console: [], errors: [],
  limitations: ['These four canonical static states do not test animation timing, every camera pose or cross-browser rendering.'],
};
const saveManifest = () => fs.writeFile(path.join(out, 'capture-manifest.json'), JSON.stringify(manifest, null, 2));
await saveManifest();
let browser;
try {
  browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'] });
  manifest.environment.browser = await browser.version();
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'no-preference', serviceWorkers: 'block' });
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    const entry = { path: url.pathname, type: route.request().resourceType(), status: null };
    manifest.requests.push(entry);
    if (url.origin !== origin) { entry.status = 'blocked external'; await route.abort('blockedbyclient'); return; }
    let relative;
    try { relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html'; }
    catch { entry.status = 400; await route.fulfill({ status: 400, body: 'Bad path' }); return; }
    const file = path.resolve(dist, relative);
    if (!file.startsWith(dist + path.sep)) { entry.status = 403; await route.fulfill({ status: 403, body: 'Outside build' }); return; }
    try {
      const bytes = await fs.readFile(file);
      entry.status = 200; entry.bytes = bytes.length; entry.sha256 = sha256(bytes);
      await route.fulfill({ status: 200, body: bytes, contentType: mime[path.extname(file).slice(1)] || 'application/octet-stream' });
    } catch (error) {
      entry.status = 404; entry.error = error.message;
      await route.fulfill({ status: 404, body: 'Not found' }).catch(() => {});
    }
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30_000);
  page.on('pageerror', error => manifest.errors.push({ type: 'pageerror', message: error.message }));
  page.on('console', message => { if (['warning', 'error'].includes(message.type())) manifest.console.push({ type: message.type(), message: message.text() }); });
  const cdp = await context.newCDPSession(page);
  // The screenshot session must own these metrics so capture restoration cannot
  // fall back to a different DPR than the context.
  await cdp.send('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1, mobile: false });
  await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForFunction(() => {
    const stage = document.querySelector('#stage'), canvas = document.querySelector('#theatre');
    let info; try { info = JSON.parse(stage?.dataset.renderInfo || 'null'); } catch { return false; }
    return stage?.classList.contains('is-ready') && canvas && Number(getComputedStyle(canvas).opacity) > .98 && info?.renderer === 'Three.js WebGL 2' && !info.contextLost;
  }, undefined, { polling: 100, timeout: 30_000 });
  await deadline(page.evaluate(() => document.fonts.ready), 30_000, 'Local fonts');
  // Observe sufficient rendered time for the opening light to settle, including
  // software-renderer frames. This waits; it never changes production delta time.
  await deadline(page.evaluate(() => new Promise(resolve => {
    let previous = performance.now(), observed = 0;
    function frame(now) {
      observed += Math.min(.05, Math.max(0, (now - previous) / 1000)); previous = now;
      if (observed >= 1.05) resolve(); else requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })), 45_000, 'Opening light settling');
  let originalIdentity;
  for (const target of targets) {
    console.log(`[CAPTURE] ${target.name} at p=${target.p}`);
    await page.evaluate(p => {
      const rect = document.querySelector('#story').getBoundingClientRect();
      const start = rect.top + scrollY, end = rect.bottom + scrollY - innerHeight;
      scrollTo({ top: Math.ceil(start + p * (end - start)), behavior: 'instant' });
    }, target.p);
    await page.waitForFunction(target => {
      const stage = document.querySelector('#stage');
      let info; try { info = JSON.parse(stage?.dataset.renderInfo || 'null'); } catch { return false; }
      const pose = info?.lastPose;
      return stage?.classList.contains('is-ready') && !info.contextLost && pose && !pose.busy &&
        Math.abs(Number(document.querySelector('#story').dataset.progress) - target.p) < .002 &&
        Math.abs(pose.world - target.world) < .0001 && Math.abs(pose.view - target.view) < .0001 && Math.abs(pose.lamp - target.lamp) < .0001;
    }, target, { polling: 100, timeout: 30_000 });
    const frame = await page.evaluate(() => {
      const canvas = document.querySelector('#theatre'), rect = canvas.getBoundingClientRect(), stage = document.querySelector('#stage');
      const renderInfo = JSON.parse(stage.dataset.renderInfo);
      return {
        title: document.title, progress: Number(document.querySelector('#story').dataset.progress),
        viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio }, scroll: { x: scrollX, y: scrollY },
        canvas: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom, bufferWidth: canvas.width, bufferHeight: canvas.height, opacity: Number(getComputedStyle(canvas).opacity) },
        clip: { x: rect.x + scrollX, y: rect.y + scrollY, width: rect.width, height: rect.height, scale: 1 },
        stageState: { world: Number(stage.dataset.world), view: Number(stage.dataset.view), light: Number(stage.dataset.light), lamp: Number(stage.dataset.lamp), scene: renderInfo.lastPose.scene, selectedTarget: stage.dataset.scene, mode: stage.dataset.mode },
        renderInfo, fonts: { status: document.fonts.status, fraunces: document.fonts.check('48px Fraunces'), sourceSans: document.fonts.check('16px "Source Sans 3"') },
      };
    });
    if (frame.viewport.dpr !== 1 || frame.canvas.opacity < .98) throw new Error(`${target.name}: canvas or DPR changed before capture`);
    if (frame.canvas.x < -1 || frame.canvas.y < -1 || frame.canvas.right > viewport.width + 1 || frame.canvas.bottom > viewport.height + 1) throw new Error(`${target.name}: canvas is not fully inside the viewport`);
    const identity = { door: frame.renderInfo.doorId, lantern: frame.renderInfo.lanternId, doorParent: frame.renderInfo.doorParent, lanternParent: frame.renderInfo.lanternParent, waves: frame.renderInfo.waveIds };
    originalIdentity ||= identity;
    if (JSON.stringify(identity) !== JSON.stringify(originalIdentity)) throw new Error(`${target.name}: the stage props were rebuilt between captures`);
    if (identity.doorParent !== identity.lanternParent) throw new Error(`${target.name}: props do not share their original turntable`);
    const result = await deadline(cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false, clip: frame.clip }), 45_000, `${target.name} canvas capture`);
    const png = Buffer.from(result.data, 'base64');
    if (png.subarray(1, 4).toString() !== 'PNG') throw new Error(`${target.name}: Chromium did not return a PNG`);
    const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
    if (Math.abs(width - frame.canvas.width) > 1 || Math.abs(height - frame.canvas.height) > 1) throw new Error(`${target.name}: screenshot dimensions do not match the canvas`);
    const filename = `${target.name}.png`;
    await fs.writeFile(path.join(out, filename), png);
    manifest.images.push({ name: target.name, filename, capturedAt: new Date().toISOString(), width, height, bytes: png.length, sha256: sha256(png), target, identity, ...frame, visualReview: 'Pending inspection of the saved canvas-only PNG' });
    await saveManifest();
    console.log(`[SAVED] ${filename}: ${width}×${height}, ${png.length} bytes`);
  }
  const missing = manifest.requests.filter(r => r.status !== 200);
  const unexpectedConsole = manifest.console.filter(m => !/GPU stall|ReadPixels|Automatic fallback to software WebGL|deprecated.*software WebGL/i.test(m.message));
  if (missing.length) throw new Error(`Build requested ${missing.length} missing or external resources`);
  if (manifest.errors.length || unexpectedConsole.length) throw new Error('Page errors or unexplained console messages occurred; see manifest');
  manifest.status = 'CAPTURED';
  manifest.identityPreserved = true;
} catch (error) {
  manifest.status = 'FAILED';
  manifest.errors.push({ type: 'capture', message: error.message, stack: error.stack?.split('\n').slice(0, 7).join('\n') });
  process.exitCode = 1;
  console.error(`[FAILED] ${error.message}`);
} finally {
  if (browser) await browser.close().catch(error => manifest.errors.push({ type: 'cleanup', message: error.message }));
  manifest.finished = new Date().toISOString();
  await saveManifest();
  console.log(JSON.stringify({ status: manifest.status, output: out, images: manifest.images.map(i => ({ file: i.filename, width: i.width, height: i.height })), manifest: 'capture-manifest.json' }, null, 2));
}
