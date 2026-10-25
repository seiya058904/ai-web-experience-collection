#!/usr/bin/env node
/**
 * Real browser video and dense ROOM -> SEA -> ROOM evidence.
 *
 * Prepare/build first, then run when the GPU test slot is free:
 *   node scripts/dense-handoff.mjs --dist dist --out qa/dense-handoff-run
 *   node scripts/dense-handoff.mjs --browsers /path/to/playwright-browsers
 *
 * Optional: --project PATH --viewport 1280x800 --no-focus
 * Default viewport: 960x640, DPR 1; default focus tail: 844x390.
 * Requires the project's Playwright and its Chromium + FFmpeg installation.
 * Uses a fresh output directory. It never edits production files, fabricates
 * progress datasets, changes CSS/animation clocks, or assembles video from PNGs.
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const name = process.argv[i];
  if (name === '--no-focus') { args.noFocus = true; continue; }
  if (!['--project', '--dist', '--out', '--browsers', '--viewport'].includes(name)) throw new Error(`Unknown option: ${name}`);
  const value = process.argv[++i];
  if (!value || value.startsWith('--')) throw new Error(`Missing value for ${name}`);
  args[name.slice(2)] = value;
}
const project = path.resolve(args.project || (existsSync(path.join(here, '../backstage/package.json')) ? path.join(here, '../backstage') : path.join(here, '..')));
const dist = path.resolve(args.dist || path.join(project, 'dist'));
const out = path.resolve(args.out || path.join(project, 'qa', 'dense-handoff-run'));
const size = args.viewport || '960x640';
if (!['960x640', '1280x800'].includes(size)) throw new Error('--viewport must be 960x640 or 1280x800');
const [width, height] = size.split('x').map(Number), viewport = { width, height };
if (args.browsers) process.env.PLAYWRIGHT_BROWSERS_PATH = path.resolve(args.browsers);
const require = createRequire(path.join(project, 'package.json'));
const { chromium } = require('playwright');
const { mechanism } = await import(pathToFileURL(path.join(project, 'src/state.js')).href);
const { createTheatre } = await import(pathToFileURL(path.join(project, 'src/theatre.js')).href);
const layout = createTheatre.geometryLayout(), dimensions = layout.dimensions;
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const origin = 'http://dense-handoff.local:4173';
const mime = { html: 'text/html', js: 'application/javascript', css: 'text/css', png: 'image/png', svg: 'image/svg+xml', woff2: 'font/woff2', webp: 'image/webp', json: 'application/json' };
async function deadline(promise, milliseconds, label) {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label} exceeded ${milliseconds}ms`)), milliseconds); })]); }
  finally { clearTimeout(timer); }
}
if (existsSync(out) && (await fs.readdir(out)).length) throw new Error('Use an empty --out directory so earlier evidence cannot be mixed into this recording.');
await fs.mkdir(out, { recursive: true });
const indexBytes = await fs.readFile(path.join(dist, 'index.html'));
const sourceHashes = {};
for (const name of ['state.js', 'theatre.js']) sourceHashes[`src/${name}`] = sha256(await fs.readFile(path.join(project, 'src', name)));
const report = {
  status: 'PREPARING', started: new Date().toISOString(), finished: null,
  source: { project, dist, indexSHA256: sha256(indexBytes), geometrySourceSHA256: sourceHashes },
  environment: { browser: null, viewport, deviceScaleFactor: 1, reducedMotion: false, rendering: 'Actual Three.js WebGL 2 in Chromium / ANGLE SwiftShader' },
  method: {
    route: 'Exact frozen build bytes supplied locally; all external requests are blocked',
    progress: 'Native window.scrollTo; read-only story/stage diagnostics; 31 sampled poses each way, 30 scroll increments',
    rendering: 'Wait for actual progress, corresponding world and renderer pose, then at least two real requestAnimationFrame callbacks per sample',
    video: 'Playwright context.recordVideo: real browser WebM, renamed only after context/browser close; no frame synthesis or speed changes',
    stills: 'Only forward 25/50/75-percent PNGs; stable endpoints are held in the video',
    focusTail: args.noFocus ? 'Disabled by --no-focus' : 'After the return, resize to 844x390, enter IV, keyboard-focus chapter V without clicking, capture the native focus ring',
  },
  limitations: [
    'Video preserves actual software-renderer wall-clock time. It is not a real-GPU performance or frame-rate claim.',
    'The per-sample geometry checks evaluate the hashed source slot/lift plan at the observed world state. They supplement the video; they do not prove pixel clearance or every scenic-flat intersection.',
    'Video begins at page creation and includes the real load, endpoint holds and optional focus tail. Its timing has not been edited.',
  ],
  geometryPlan: { dimensions, deckSegments: layout.deck.length, floorPieces: layout.floor.length },
  requests: [], console: [], errors: [], checks: [], samples: [], stills: [], focus: null, video: null,
};
const save = () => fs.writeFile(path.join(out, 'dense-handoff.json'), JSON.stringify(report, null, 2));
const check = (name, pass, detail = null) => report.checks.push({ name, pass: Boolean(pass), detail });
await save();

function within(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
function sampledGeometry(world) {
  const m = mechanism(world), violations = [];
  let points = 0, minimumRimGap = Infinity, minimumBaseGap = Infinity, minimumGuideMargin = Infinity;
  for (const [rowIndex, row] of dimensions.rows.entries()) {
    const y = dimensions.parkedY + (dimensions.raisedY - dimensions.parkedY) * m.waves[rowIndex];
    minimumBaseGap = Math.min(minimumBaseGap, y + dimensions.boardBottom - dimensions.baseTop);
    minimumGuideMargin = Math.min(minimumGuideMargin, y + dimensions.sliderY - dimensions.sliderHeight / 2 - dimensions.guideBottom, dimensions.guideTop - (y + dimensions.sliderY + dimensions.sliderHeight / 2));
    for (let i = 0; i <= 24; i++) for (const sway of [-dimensions.horizontalTravel, dimensions.horizontalTravel]) for (const depth of [-dimensions.boardDepth / 2, dimensions.boardDepth / 2 + .014]) {
      const local = [-row.width / 2 + row.width * i / 24 + sway, row.z + depth];
      const fixed = [local[0] * Math.cos(m.turn) + local[1] * Math.sin(m.turn), -local[0] * Math.sin(m.turn) + local[1] * Math.cos(m.turn)];
      minimumRimGap = Math.min(minimumRimGap, dimensions.radius - Math.hypot(...local)); points++;
      if (layout.deck.some(poly => within(local, poly)) || layout.floor.some(part => within(fixed, part.polygon))) {
        if (violations.length < 5) violations.push({ row: rowIndex, local, fixed });
      }
    }
  }
  const bounded = m.flatAngles.every(x => Number.isFinite(x) && Math.abs(x) <= Math.PI + 1e-9) && m.waves.every(x => x >= 0 && x <= 1) && Math.abs(m.turn) <= dimensions.maximumTurn + 1e-9;
  return { sourcePlanOnly: true, mechanism: m, planPointsChecked: points, minimumRimGap, minimumBaseGap, minimumGuideMargin, violations, pass: bounded && !violations.length && minimumRimGap > .04 && minimumBaseGap >= .075 && minimumGuideMargin > 0 };
}

let browser, context, page, cdp, videoHandle, originalIdentity;
const wallStart = Date.now();
async function realFrames(count = 2) {
  return deadline(page.evaluate(count => new Promise(resolve => {
    let frames = 0;
    function next(now) { if (++frames >= count) resolve({ frames, lastRafTimestamp: now }); else requestAnimationFrame(next); }
    requestAnimationFrame(next);
  }), count), 55_000, `${count} real animation frames`);
}
async function scrollToProgress(p) {
  await page.evaluate(p => {
    const rect = document.querySelector('#story').getBoundingClientRect();
    const start = rect.top + scrollY, end = rect.bottom + scrollY - innerHeight;
    window.scrollTo({ top: Math.ceil(start + p * (end - start)), behavior: 'instant' });
  }, p);
  await page.waitForFunction(p => {
    const stage = document.querySelector('#stage');
    let info; try { info = JSON.parse(stage?.dataset.renderInfo || 'null'); } catch { return false; }
    const actual = Number(document.querySelector('#story')?.dataset.progress), world = Number(stage?.dataset.world);
    const q = Math.max(0, Math.min(1, (actual - .34) / .18)), expectedWorld = q * q * (3 - 2 * q);
    return stage?.classList.contains('is-ready') && info?.renderer === 'Three.js WebGL 2' && !info.contextLost && Math.abs(actual - p) < .002 && Math.abs(world - expectedWorld) < .0002 && Math.abs(info.lastPose.world - world) < .00002 && Math.abs(info.lastPose.lamp - Number(stage.dataset.lamp)) < .00002;
  }, p, { polling: 100, timeout: 55_000 });
  return realFrames(2);
}
async function readFrame() {
  return deadline(page.evaluate(() => {
    const stage = document.querySelector('#stage'), canvas = document.querySelector('#theatre'), rect = canvas.getBoundingClientRect();
    return { browserTimestampMs: performance.now(), browserTimeOrigin: performance.timeOrigin, progress: Number(document.querySelector('#story').dataset.progress), world: Number(stage.dataset.world), view: Number(stage.dataset.view), lamp: Number(stage.dataset.lamp), light: Number(stage.dataset.light), live: stage.classList.contains('is-ready'), viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio }, scroll: { x: scrollX, y: scrollY }, canvas: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, opacity: Number(getComputedStyle(canvas).opacity) }, renderInfo: JSON.parse(stage.dataset.renderInfo) };
  }), 55_000, 'Read actual rendered frame');
}
function identity(frame) {
  const i = frame.renderInfo;
  return { door: i.doorId, lantern: i.lanternId, doorParent: i.doorParent, lanternParent: i.lanternParent, waves: i.waveIds, waveParents: i.waveParents };
}
async function screenshot(name) {
  const result = await deadline(cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false }), 45_000, `${name} screenshot`);
  const bytes = Buffer.from(result.data, 'base64');
  if (bytes.subarray(1, 4).toString() !== 'PNG') throw new Error(`${name} is not a PNG`);
  await fs.writeFile(path.join(out, name), bytes);
  return { filename: name, width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), bytes: bytes.length, sha256: sha256(bytes), review: 'Requires inspection of the actual PNG' };
}

try {
  browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'] });
  report.environment.browser = await browser.version();
  context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'no-preference', serviceWorkers: 'block', recordVideo: { dir: out, size: viewport } });
  await context.route('**/*', async route => {
    const url = new URL(route.request().url()), item = { path: url.pathname, type: route.request().resourceType(), status: null };
    report.requests.push(item);
    if (url.origin !== origin) { item.status = 'blocked external'; await route.abort('blockedbyclient'); return; }
    let relative;
    try { relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html'; }
    catch { item.status = 400; await route.fulfill({ status: 400, body: 'Bad path' }); return; }
    const file = path.resolve(dist, relative);
    if (!file.startsWith(dist + path.sep)) { item.status = 403; await route.fulfill({ status: 403, body: 'Outside build' }); return; }
    try { const bytes = await fs.readFile(file); item.status = 200; item.bytes = bytes.length; item.sha256 = sha256(bytes); await route.fulfill({ status: 200, body: bytes, contentType: mime[path.extname(file).slice(1)] || 'application/octet-stream' }); }
    catch (error) { item.status = 404; item.error = error.message; await route.fulfill({ status: 404, body: 'Not found' }).catch(() => {}); }
  });
  page = await context.newPage(); videoHandle = page.video();
  if (!videoHandle) throw new Error('Playwright did not enable real browser recording');
  page.setDefaultTimeout(55_000);
  page.on('pageerror', error => report.errors.push({ type: 'pageerror', message: error.message }));
  page.on('console', message => { if (['warning', 'error'].includes(message.type())) report.console.push({ type: message.type(), message: message.text() }); });
  cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1, mobile: false });
  await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 55_000 });
  await page.waitForFunction(() => {
    const stage = document.querySelector('#stage'), canvas = document.querySelector('#theatre');
    let info; try { info = JSON.parse(stage?.dataset.renderInfo || 'null'); } catch { return false; }
    return stage?.classList.contains('is-ready') && info?.renderer === 'Three.js WebGL 2' && !info.contextLost && Number(getComputedStyle(canvas).opacity) > .98;
  }, undefined, { polling: 100, timeout: 55_000 });
  await deadline(page.evaluate(() => document.fonts.ready), 30_000, 'Local fonts');
  report.status = 'RECORDING'; await save();
  await scrollToProgress(.34); await page.waitForTimeout(1200);
  report.before = { capturedAt: new Date().toISOString(), ...await readFrame() };
  originalIdentity = identity(report.before);
  // Thirty increments, with exact quarter stills replacing the nearest base
  // samples. No extra jumps or artificial data updates are introduced.
  const fractions = Array.from({ length: 31 }, (_, i) => i / 30);
  fractions[8] = .25; fractions[23] = .75;
  for (const direction of ['forward', 'reverse']) {
    const pathFractions = direction === 'forward' ? fractions : [...fractions].reverse();
    let previousWorld = direction === 'forward' ? 0 : 1;
    for (const [step, q] of pathFractions.entries()) {
      const targetProgress = .34 + .18 * q;
      const raf = await scrollToProgress(targetProgress), frame = await readFrame();
      const actualIdentity = identity(frame), geometry = sampledGeometry(frame.renderInfo.lastPose.world);
      const persistent = JSON.stringify(actualIdentity) === JSON.stringify(originalIdentity);
      const monotonic = direction === 'forward' ? frame.world + .00002 >= previousWorld : frame.world - .00002 <= previousWorld;
      previousWorld = frame.world;
      const sample = { direction, step, fraction: q, requestedProgress: targetProgress, recordedAt: new Date().toISOString(), wallElapsedMs: Date.now() - wallStart, raf, ...frame, identity: actualIdentity, identityPreserved: persistent, monotonic, geometry };
      report.samples.push(sample);
      check(`${direction}/${step}: live renderer`, frame.live && frame.canvas.opacity > .98 && !frame.renderInfo.contextLost);
      check(`${direction}/${step}: persistent original props`, persistent && actualIdentity.doorParent === actualIdentity.lanternParent && actualIdentity.waveParents.every(p => p === actualIdentity.doorParent));
      check(`${direction}/${step}: monotonic world`, monotonic);
      check(`${direction}/${step}: sampled trap-slot path`, geometry.pass, geometry.violations);
      if (direction === 'forward' && [.25, .5, .75].includes(q)) {
        const still = await screenshot(`room-sea-${Math.round(q * 100)}.png`);
        report.stills.push({ ...still, sampleIndex: report.samples.length - 1, progress: frame.progress, world: frame.world });
      }
      await save();
      if (step % 5 === 0 || step === 30) console.log(`[SAMPLE] ${direction} ${step}/30 p=${frame.progress.toFixed(5)} world=${frame.world.toFixed(5)} lamp=${frame.lamp.toFixed(5)}`);
    }
    await page.waitForTimeout(1200);
    report[direction === 'forward' ? 'seaEndpoint' : 'returnedRoomEndpoint'] = { capturedAt: new Date().toISOString(), ...await readFrame() };
  }
  if (!args.noFocus) {
    console.log('[FOCUS] Native 844x390 keyboard outline proof');
    const focusViewport = { width: 844, height: 390 };
    await page.setViewportSize(focusViewport);
    await cdp.send('Emulation.setDeviceMetricsOverride', { ...focusViewport, deviceScaleFactor: 1, mobile: false });
    await page.waitForTimeout(450);
    await page.evaluate(() => {
      const rect = document.querySelector('#story').getBoundingClientRect(), start = rect.top + scrollY, end = rect.bottom + scrollY - innerHeight;
      window.scrollTo({ top: Math.ceil(start + .735 * (end - start)), behavior: 'instant' });
    });
    await page.waitForFunction(() => Math.abs(Number(document.querySelector('#story').dataset.progress) - .735) < .002 && document.querySelector('#stage').classList.contains('is-ready'), undefined, { polling: 100, timeout: 55_000 });
    await realFrames(2);
    await page.keyboard.press('Tab');
    await page.locator('.chapter-nav a[href="#again"]').focus();
    await realFrames(2);
    const focus = await page.locator('.chapter-nav a[href="#again"]').evaluate(el => {
      const r = el.getBoundingClientRect(), style = getComputedStyle(el), offset = parseFloat(style.outlineOffset), lineWidth = parseFloat(style.outlineWidth), outset = offset + lineWidth;
      const ring = { x: r.left - outset, y: r.top - outset, right: r.right + outset, bottom: r.bottom + outset };
      return { active: document.activeElement === el, focusVisible: el.matches(':focus-visible'), href: el.getAttribute('href'), outlineStyle: style.outlineStyle, outlineColor: style.outlineColor, outlineWidth: style.outlineWidth, outlineOffset: style.outlineOffset, outlineOffsetPx: offset, element: { x: r.x, y: r.y, right: r.right, bottom: r.bottom }, ring, ringWithinViewport: ring.x >= -.5 && ring.y >= -.5 && ring.right <= innerWidth + .5 && ring.bottom <= innerHeight + .5, viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio }, progress: Number(document.querySelector('#story').dataset.progress), browserTimestampMs: performance.now() };
    });
    report.focus = { recordedAt: new Date().toISOString(), videoTail: true, ...focus, screenshot: await screenshot('footer-focus-844x390.png') };
    check('focus tail: real keyboard-visible focus without navigating', focus.active && focus.focusVisible && Math.abs(focus.progress - .735) < .002);
    check('focus tail: expected inset outline', focus.outlineStyle !== 'none' && parseFloat(focus.outlineWidth) > 0 && Math.abs(focus.outlineOffsetPx + 3) < .001, { width: focus.outlineWidth, offset: focus.outlineOffset });
    check('focus tail: complete ring lies within actual viewport', focus.ringWithinViewport, focus.ring);
    check('focus tail: screenshot matches the actual 844x390 viewport', focus.viewport.width === 844 && focus.viewport.height === 390 && focus.viewport.dpr === 1 && report.focus.screenshot.width === 844 && report.focus.screenshot.height === 390);
    await page.waitForTimeout(600); await save();
  }
  check('dense route has all 31 poses in each direction', report.samples.filter(s => s.direction === 'forward').length === 31 && report.samples.filter(s => s.direction === 'reverse').length === 31);
  check('no unexpected missing or external resources', report.requests.every(r => r.status === 200), report.requests.filter(r => r.status !== 200));
  check('no uncaught page errors', report.errors.length === 0, report.errors);
  const unexplained = report.console.filter(m => !/GPU stall|ReadPixels|Automatic fallback to software WebGL|deprecated.*software WebGL/i.test(m.message));
  check('no unexplained console errors or warnings', !unexplained.length, unexplained);
  check('served index matches the frozen source read', report.requests.find(r => r.path === '/')?.sha256 === report.source.indexSHA256);
} catch (error) {
  report.errors.push({ type: 'scenario', message: error.message, stack: error.stack?.split('\n').slice(0, 7).join('\n') });
  console.error(`[FAILED] ${error.message}`);
} finally {
  if (context) await deadline(context.close(), 45_000, 'Video context close').catch(error => report.errors.push({ type: 'cleanup', message: error.message }));
  if (browser) await deadline(browser.close(), 45_000, 'Browser close').catch(error => report.errors.push({ type: 'cleanup', message: error.message }));
  if (videoHandle) {
    try {
      const original = await deadline(videoHandle.path(), 10_000, 'Finalized video path');
      const filename = 'room-to-sea-forward-reverse.webm';
      await fs.rename(original, path.join(out, filename));
      const bytes = await fs.readFile(path.join(out, filename));
      report.video = { filename, bytes: bytes.length, sha256: sha256(bytes), recordVideoSize: viewport, focusTailIncluded: !args.noFocus && Boolean(report.focus), wallElapsedMs: Date.now() - wallStart, method: 'Unedited actual Playwright browser recording; renamed after closure', visualReview: 'REQUIRED: inspect continuous flat rotations, wave lifts, camera travel, occlusion and reverse path' };
      check('real WebM recording exists', bytes.length > 0 && bytes.subarray(0, 4).toString('hex') === '1a45dfa3');
    } catch (error) { report.errors.push({ type: 'video', message: error.message }); }
  }
  report.finished = new Date().toISOString();
  report.status = report.errors.length || report.checks.some(c => !c.pass) || !report.video ? 'FAILED' : 'RECORDED';
  report.summary = { samples: report.samples.length, forward: report.samples.filter(s => s.direction === 'forward').length, reverse: report.samples.filter(s => s.direction === 'reverse').length, checks: report.checks.length, failedChecks: report.checks.filter(c => !c.pass).length, quarterPNGs: report.stills.length, focusPNG: Boolean(report.focus), video: report.video?.filename || null, visualReview: 'Pending review of actual video and saved PNGs' };
  await save();
  console.log(JSON.stringify({ status: report.status, output: out, summary: report.summary }, null, 2));
  if (report.status !== 'RECORDED') process.exitCode = 1;
}
