#!/usr/bin/env node
/**
 * BACKSTAGE browser acceptance harness.
 *
 * Runs actual Chromium against exact production bytes fulfilled by Playwright.
 * It does not publish a server, mutate production files, or replace WebGL with
 * screenshots. Screenshot/DOM evidence is collected for human visual review.
 *
 * Usage:
 *   node scripts/acceptance.mjs --group smoke
 *   node scripts/acceptance.mjs --group all --out qa/acceptance-final
 *   node scripts/acceptance.mjs --group viewports --viewports 320x700,3840x2160
 *   node scripts/acceptance.mjs --group resilience --match context-loss
 *
 * Portable overrides: --project PATH --dist PATH --out PATH --browsers PATH.
 * When copied to project/scripts/, it also locates the adjacent package.json.
 */
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const key = process.argv[i];
  if (!key.startsWith('--')) throw new Error(`Unknown argument: ${key}`);
  args[key.slice(2)] = process.argv[i + 1]?.startsWith('--') || !process.argv[i + 1] ? true : process.argv[++i];
}
const defaultProject = existsSync(path.resolve(here, '../backstage/package.json'))
  ? path.resolve(here, '../backstage') : path.resolve(here, '..');
const project = path.resolve(String(args.project || defaultProject));
const dist = path.resolve(String(args.dist || path.join(project, 'dist')));
const out = path.resolve(String(args.out || path.join(project, 'qa-results', `acceptance-${new Date().toISOString().replace(/[:.]/g, '-')}`)));
const groups = new Set(String(args.group || 'all').split(','));
const allowedGroups = new Set(['all', 'smoke', 'viewports', 'transitions', 'interactions', 'resilience', 'typography', 'performance']);
for (const group of groups) if (!allowedGroups.has(group)) throw new Error(`Unknown group: ${group}`);
const match = args.match ? new RegExp(String(args.match), 'i') : null;
const requestedViewports = String(args.viewports || '320x700,360x640,390x844,768x1024,1440x900,1920x1080,2560x1440,3840x2160')
  .split(',').map(v => { const [width, height] = v.split('x').map(Number); if (!width || !height) throw new Error(`Invalid viewport ${v}`); return { width, height }; });
if (args.browsers) process.env.PLAYWRIGHT_BROWSERS_PATH = path.resolve(String(args.browsers));

const require = createRequire(path.join(project, 'package.json'));
const { chromium } = require('playwright');
const origin = 'http://backstage.test';
const actAnchors = [0, .29, .55, .735, .985];
const selectedActs=args.acts?new Set(String(args.acts).split(',').map(Number)):null;
const sceneWorld = { room: 0, sea: 1, night: 2 };
const performanceDuration = Number(args['sample-ms'] || 6000);
if (!Number.isFinite(performanceDuration) || performanceDuration < 1000 || performanceDuration > 20000) throw new Error('--sample-ms must be between 1000 and 20000.');
const mime = { html: 'text/html', js: 'application/javascript', css: 'text/css', png: 'image/png', svg: 'image/svg+xml', woff2: 'font/woff2', webp: 'image/webp', json: 'application/json' };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function deadline(promise, milliseconds, label) {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label} exceeded ${milliseconds}ms`)), milliseconds); })]); }
  finally { clearTimeout(timer); }
}
const slug = value => String(value).replace(/[^a-z0-9_.-]+/gi, '-').replace(/^-|-$/g, '');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
await fs.mkdir(path.join(out, 'screenshots'), { recursive: true });
const indexBytes = await fs.readFile(path.join(dist, 'index.html'));
const entryMatch = indexBytes.toString().match(/<script\b(?=[^>]*type=["']module["'])[^>]*\bsrc=["']([^"']+)["'][^>]*>/i);
if (!entryMatch) throw new Error('Cannot identify the production entry module in dist/index.html.');
const entryBasename = path.basename(entryMatch[1].split('?')[0]);
const report = {
  started: new Date().toISOString(), finished: null,
  environment: { node: process.version, platform: os.platform(), release: os.release(), architecture: os.arch(), logicalCPUs: os.cpus().length, project, dist, browser: null, defaultDeviceScaleFactor: 1, zoomMethod: 'Fresh browser context per factor z: CSS viewport round(1440/z) × round(900/z), deviceScaleFactor z; layout plus DPR emulation, not native Chrome UI zoom', rendering: 'Headless Chromium with ANGLE SwiftShader software WebGL', serving: 'Exact dist bytes via Playwright request fulfillment; no public server or deployment', indexSHA256: hash(indexBytes) },
  requested: { groups: [...groups], viewports: requestedViewports, filter: args.match || null },
  limitations: [
    'Software WebGL in this Linux environment is not a Windows GPU, Safari, Firefox, or a physical phone.',
    'Request routing disables the normal HTTP cache. Same-session reload is tested, but a true browser HTTP cache-hit run is NOT covered by this route.',
    'Screenshots and pixel checks prove rendered output, not aesthetic approval or absence of every possible 3D intersection. Human review is required.',
    'Font-delay and slow-resource scenarios use controlled local response delays, not a measured real-world network.',
    'Zoom coverage uses a smaller CSS viewport plus increased DPR in a fresh context at 125/150/200 percent. This exercises responsive media queries and keeps physical screenshots approximately 1440×900; it is layout plus DPR zoom emulation, not native Chrome UI zoom or OS text scaling.',
  ],
  cases: [], summary: null,
};
let browser, currentCase;
const stageSamples = new Map();
const sessionEvidence = s => s.evidence || { viewport: s.viewport, deviceScaleFactor: s.deviceScaleFactor, zoomEmulation: s.zoomEmulation, basePath: s.basePath, faults: s.faults, faultCount: s.faultCount, requests: s.requests, logs: s.logs };
const writeReport = async () => fs.writeFile(path.join(out, 'results.json'), JSON.stringify({ ...report, cases: report.cases.map(c => ({ ...c, sessions: c.sessions.map(sessionEvidence) })) }, null, 2));
function check(id, pass, detail = null) { currentCase.checks.push({ id, pass: Boolean(pass), detail }); return Boolean(pass); }
function note(message) { currentCase.notes.push(message); }

// Decode Chromium's real PNG bytes with Node's standard library. Only RGB/RGBA
// 8-bit PNGs are needed; unsupported encodings are reported, never guessed.
function decodePNG(bytes) {
  if (bytes.subarray(1, 4).toString() !== 'PNG') throw new Error('Not a PNG screenshot');
  let offset = 8, width, height, depth, color, interlace;
  const chunks = [];
  while (offset + 12 <= bytes.length) {
    const size = bytes.readUInt32BE(offset), type = bytes.toString('ascii', offset + 4, offset + 8);
    const data = bytes.subarray(offset + 8, offset + 8 + size);
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); depth = data[8]; color = data[9]; interlace = data[12]; }
    if (type === 'IDAT') chunks.push(data);
    offset += 12 + size;
  }
  if (depth !== 8 || ![2, 6].includes(color) || interlace) throw new Error(`Unsupported PNG encoding depth=${depth}, color=${color}, interlace=${interlace}`);
  const bpp = color === 6 ? 4 : 3, stride = width * bpp, raw = inflateSync(Buffer.concat(chunks));
  const data = Buffer.alloc(stride * height);
  const paeth = (a, b, c) => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; };
  for (let y = 0, r = 0; y < height; y++) {
    const filter = raw[r++];
    for (let x = 0; x < stride; x++, r++) {
      const at = y * stride + x, left = x >= bpp ? data[at - bpp] : 0, above = y ? data[at - stride] : 0, corner = y && x >= bpp ? data[at - stride - bpp] : 0;
      const predictor = filter === 0 ? 0 : filter === 1 ? left : filter === 2 ? above : filter === 3 ? Math.floor((left + above) / 2) : filter === 4 ? paeth(left, above, corner) : NaN;
      if (!Number.isFinite(predictor)) throw new Error(`Unknown PNG filter ${filter}`);
      data[at] = (raw[r] + predictor) & 255;
    }
  }
  return { width, height, bpp, data };
}
function samplePixels(png, rect, viewport) {
  const image = decodePNG(png), scaleX = image.width / viewport.width, scaleY = image.height / viewport.height;
  const left = Math.max(0, rect.x), right = Math.min(viewport.width, rect.right), top = Math.max(0, rect.y), bottom = Math.min(viewport.height, rect.bottom);
  if (right <= left || bottom <= top) return { error: 'Stage is outside the screenshot viewport', width: image.width, height: image.height };
  const values = new Uint8Array(64 * 64 * 3), colors = new Set();
  let nonPaper = 0, luminanceSum = 0, square = 0, redCandidates = 0;
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const px = Math.min(image.width - 1, Math.floor((left + (x + .5) / 64 * (right - left)) * scaleX));
    const py = Math.min(image.height - 1, Math.floor((top + (y + .5) / 64 * (bottom - top)) * scaleY));
    const at = (py * image.width + px) * image.bpp, to = (y * 64 + x) * 3;
    const r = image.data[at], g = image.data[at + 1], b = image.data[at + 2];
    values.set([r, g, b], to);
    colors.add(`${r >> 4},${g >> 4},${b >> 4}`);
    if (Math.abs(r - 243) + Math.abs(g - 238) + Math.abs(b - 229) > 35) nonPaper++;
    if (r > 95 && r > g * 1.55 && r > b * 1.4) redCandidates++;
    const lum = .2126 * r + .7152 * g + .0722 * b; luminanceSum += lum; square += lum * lum;
  }
  const mean = luminanceSum / 4096;
  return { values, width: image.width, height: image.height, sampleSHA256: hash(values), quantizedColors: colors.size, nonPaperFraction: nonPaper / 4096, luminanceMean: mean, luminanceStdDev: Math.sqrt(Math.max(0, square / 4096 - mean * mean)), redCandidatePixels: redCandidates, visibleStageFraction: ((right - left) * (bottom - top)) / Math.max(1, rect.width * rect.height) };
}
function pixelDifference(a, b) {
  const aa = stageSamples.get(a), bb = stageSamples.get(b);
  if (!aa || !bb || aa.length !== bb.length) return null;
  let total = 0, changed = 0;
  for (let i = 0; i < aa.length; i++) { const d = Math.abs(aa[i] - bb[i]); total += d; if (d > 4) changed++; }
  return { meanAbsoluteChannelDifference: total / aa.length, changedChannelFraction: changed / aa.length };
}

async function openSession(options = {}) {
  const viewport = options.viewport || { width: 1440, height: 900 };
  const deviceScaleFactor = options.deviceScaleFactor ?? 1;
  const basePath = options.basePath || '/';
  const context = await browser.newContext({ viewport, deviceScaleFactor, reducedMotion: options.reducedMotion ? 'reduce' : 'no-preference', javaScriptEnabled: options.javaScriptEnabled !== false, hasTouch: options.touch === true, isMobile: options.touch === true, serviceWorkers: 'block' });
  const session = { context, page: null, cdp: null, viewport, deviceScaleFactor, zoomEmulation: options.zoomEmulation || null, basePath, faults: options.faults || {}, logs: [], requests: [], faultCount: 0, closing: false, diagnosticsAtStart: 0 };
  if (session.faults.fontHold) session.fontGate = new Promise(resolve => { session.releaseFonts = resolve; });
  currentCase.sessions.push(session);
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    const rec = { path: url.pathname, type: request.resourceType(), method: request.method(), fault: null, status: null };
    session.requests.push(rec);
    if (url.origin !== origin || !url.pathname.startsWith(basePath)) { rec.status = 'blocked-external'; await route.abort('blockedbyclient'); return; }
    let pathname;
    try { pathname = decodeURIComponent(url.pathname.slice(basePath.length)); } catch { rec.status = 400; await route.fulfill({ status: 400, body: 'Bad path' }); return; }
    if (!pathname || pathname.endsWith('/')) pathname += 'index.html';
    const file = path.resolve(dist, pathname);
    if (!file.startsWith(dist + path.sep)) { rec.status = 403; await route.fulfill({ status: 403, body: 'Outside dist' }); return; }
    const fault = session.faults;
    const blocked = fault.main && path.basename(pathname) === entryBasename ? 'main-bundle'
      : fault.renderer && /(?:^|\/)theatre-[^/]+\.js$/.test(pathname) ? 'renderer-chunk'
      : fault.fonts && /\.woff2?$/.test(pathname) ? 'font'
      : fault.posters && /(?:posters\/|room-).*\.png$/.test(pathname) ? 'poster' : null;
    if (blocked) { rec.fault = blocked; rec.status = 'aborted'; session.faultCount++; await route.abort('failed'); return; }
    const delay = path.basename(pathname) === entryBasename && fault.mainDelay ? fault.mainDelay : /\.woff2?$/.test(pathname) ? (fault.fontDelay || 0) : /\.js$/.test(pathname) ? (fault.scriptDelay || 0) : /\.css$/.test(pathname) ? (fault.cssDelay || 0) : /\.(png|webp)$/.test(pathname) ? (fault.imageDelay || 0) : 0;
    if (delay) { rec.delayMs = delay; await sleep(delay); }
    if (/\.woff2?$/.test(pathname) && fault.fontHold) {
      rec.fontGate = 'waiting for first screenshot';
      try { await deadline(session.fontGate, 60_000, 'font response hold'); rec.fontGate = 'released by test after first screenshot'; }
      catch { rec.fontGate = '60-second safety deadline'; }
    }
    try {
      const body = await fs.readFile(file);
      rec.status = 200; rec.bytes = body.length;
      if (!session.closing) await route.fulfill({ status: 200, body, contentType: mime[path.extname(file).slice(1)] || 'application/octet-stream', headers: { 'Cache-Control': 'public, max-age=3600' } });
    } catch (error) {
      if (session.closing) return;
      rec.status = 404; rec.error = error.message;
      if (!session.closing) await route.fulfill({ status: 404, body: 'Not found' }).catch(() => {});
    }
  });
  const page = session.page = await context.newPage();
  await page.bringToFront();
  page.setDefaultTimeout(15_000);
  page.on('pageerror', error => session.logs.push({ kind: 'pageerror', message: error.message }));
  page.on('console', message => { if (['warning', 'error'].includes(message.type())) session.logs.push({ kind: message.type(), message: message.text() }); });
  page.on('requestfailed', request => session.logs.push({ kind: 'requestfailed', url: request.url(), message: request.failure()?.errorText }));
  session.cdp = await context.newCDPSession(page);
  // Screenshot restoration uses the capture session's own emulation state.
  // Mirror the context DPR here so direct CDP captures preserve that DPR and
  // return physical pixels without a clip.scale override changing it afterward.
  if (deviceScaleFactor !== 1) await session.cdp.send('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor, mobile: options.touch === true });
  await page.goto(`${origin}${basePath}${options.suffix || ''}`, { waitUntil: options.commitOnly ? 'commit' : 'domcontentloaded' });
  if (options.live !== false) await waitLive(session);
  return session;
}
async function waitLive(session) {
  await session.page.waitForFunction(() => {
    const stage = document.querySelector('#stage'), canvas = document.querySelector('#theatre');
    let info; try { info = JSON.parse(stage?.dataset.renderInfo || 'null'); } catch { return false; }
    return stage?.classList.contains('is-ready') && info && !info.contextLost && canvas && Number(getComputedStyle(canvas).opacity) > .98;
  }, undefined, { timeout: 55_000 });
  await session.page.waitForTimeout(160);
}
async function actualFrames(session, count = 2) {
  await deadline(session.page.evaluate(count => new Promise(resolve => {
    let remaining = count;
    function frame() { if (--remaining <= 0) resolve(); else requestAnimationFrame(frame); }
    requestAnimationFrame(frame);
  }), count), 30_000, `${count} actual animation frames`);
}
async function waitObservedPose(session, expected) {
  await session.page.waitForFunction(expected => {
    const stage = document.querySelector('#stage');
    let pose; try { pose = JSON.parse(stage?.dataset.renderInfo || '{}').lastPose; } catch { return false; }
    return pose && Object.entries(expected).every(([key, value]) =>
      Math.abs(Number(stage.dataset[key]) - value) < .0001 && Math.abs(Number(pose[key]) - value) < .0001);
  }, expected, { timeout: 20_000 });
}
async function waitStableLayout(session) {
  let previous, stable = 0;
  for (let attempt = 0; attempt < 10; attempt++) {
    await actualFrames(session, 1);
    const layout = await session.page.evaluate(() => ({
      productionHeight: document.querySelector('#production').getBoundingClientRect().height,
      storyExtent: document.querySelector('#story').getBoundingClientRect().height - innerHeight,
    }));
    stable = previous && Object.keys(layout).every(key => Math.abs(layout[key] - previous[key]) < .5) ? stable + 1 : 0;
    if (stable >= 2) return layout;
    previous = layout;
  }
  throw new Error('Production height/story extent did not stabilize across two actual frames.');
}
async function setProgress(session, p, settle = 130) {
  await session.page.evaluate(p => {
    const story = document.querySelector('#story'), rect = story.getBoundingClientRect();
    const start = rect.top + scrollY, end = rect.bottom + scrollY - innerHeight;
    window.scrollTo({ top: Math.ceil(start + p * (end - start)), behavior: 'instant' });
  }, p);
  // A same-progress resize used to pass on the previous frame's dataset.
  // Let the real scroll event, GSAP ticker and layout observer run first.
  await actualFrames(session);
  await session.page.waitForFunction(p => Math.abs(Number(document.querySelector('#story')?.dataset.progress) - p) < .002, p, { timeout: 15_000 });
  if (settle) await session.page.waitForTimeout(settle);
}
async function waitScene(session, scene) {
  await session.page.waitForFunction(({ scene, world }) => {
    const stage = document.querySelector('#stage');
    let info; try { info = JSON.parse(stage?.dataset.renderInfo || '{}'); } catch { return false; }
    return stage?.dataset.scene === scene && Math.abs(Number(stage.dataset.world) - world) < .0001 && info.lastPose?.target === scene && Math.abs(info.lastPose.world - world) < .0001 && !info.lastPose.busy;
  }, { scene, world: sceneWorld[scene] }, { timeout: 55_000 });
}
async function chooseScene(session, scene) {
  await session.page.locator(`button[data-scene="${scene}"]`).click();
  await waitScene(session, scene);
}
async function metrics(session) {
  return session.page.evaluate(() => {
    const rect = element => {
      const r = element.getBoundingClientRect();
      return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    };
    const rendered = element => {
      if (!element.getBoundingClientRect().width || !element.getBoundingClientRect().height) return false;
      for (let el = element; el && el.nodeType === 1; el = el.parentElement) {
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) < .15) return false;
      }
      return true;
    };
    const selector = '.wordmark,.masthead-note span,.header-cue,.act h1,.act h2,.act p,.act .text-link,.scene-options button,.scene-control legend,.range-control label,.range-ends span,.reset-button,.act-label,.chapter-nav a,.motion-toggle,.stage-caption span';
    const elements = [...document.querySelectorAll(selector)].filter(rendered);
    const boxes = elements.map((el, index) => ({ index, selector: el.id ? `#${el.id}` : el.tagName.toLowerCase() + '.' + String(el.className).split(' ').join('.'), text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 120), ...rect(el), font: getComputedStyle(el).fontFamily, fontSize: getComputedStyle(el).fontSize, lineHeight: getComputedStyle(el).lineHeight, inert: Boolean(el.closest('[inert]')) }));
    const onScreen = b => b.right > 0 && b.x < innerWidth && b.bottom > 0 && b.y < innerHeight;
    const overlaps = [];
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      if (elements[i].contains(elements[j]) || elements[j].contains(elements[i]) || !onScreen(boxes[i]) || !onScreen(boxes[j])) continue;
      const a = boxes[i], b = boxes[j], w = Math.min(a.right, b.right, innerWidth) - Math.max(a.x, b.x, 0), h = Math.min(a.bottom, b.bottom, innerHeight) - Math.max(a.y, b.y, 0);
      if (w > 1 && h > 1 && w * h > 6) overlaps.push({ a: a.text, b: b.text, width: w, height: h, area: w * h });
    }
    const stage = document.querySelector('#stage'), canvas = document.querySelector('#theatre'), poster = document.querySelector('#stage-poster');
    let renderInfo = null; try { renderInfo = JSON.parse(stage?.dataset.renderInfo || 'null'); } catch {}
    const stageRect = stage ? rect(stage) : null;
    const anchor = point => point && stageRect ? { x: stageRect.x + point.x, y: stageRect.y + point.y, inViewport: stageRect.x + point.x >= 0 && stageRect.x + point.x <= innerWidth && stageRect.y + point.y >= 0 && stageRect.y + point.y <= innerHeight } : null;
    return {
      title: document.title, url: location.href, viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio }, visualViewport: visualViewport ? { width: visualViewport.width, height: visualViewport.height, scale: visualViewport.scale } : null, cssZoom: getComputedStyle(document.documentElement).zoom, responsiveMedia: { max849: matchMedia('(max-width:849px)').matches, max389: matchMedia('(max-width:389px)').matches }, scroll: { x: scrollX, y: scrollY, width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
      progress: Number(document.querySelector('#story')?.dataset.progress || 0), stage: stageRect,
      live: stage?.classList.contains('is-ready') || false, staticMode: document.body.classList.contains('static-mode'), bootFallback: document.body.classList.contains('boot-fallback'), controllerReady: document.body.dataset.controllerReady === 'true',
      world: Number(stage?.dataset.world), view: Number(stage?.dataset.view), light: Number(stage?.dataset.light), lamp: Number(stage?.dataset.lamp), scene: stage?.dataset.scene, mode: stage?.dataset.mode,
      snapshotId: document.querySelector('#production')?.dataset.snapshotId, renderInfo,
      projectedAnchors: { door: anchor(renderInfo?.doorScreen), lantern: anchor(renderInfo?.lanternScreen) },
      poster: { complete: poster?.complete, width: poster?.naturalWidth, source: poster?.currentSrc, opacity: poster ? getComputedStyle(poster).opacity : null },
      canvas: canvas ? { ...rect(canvas), width: canvas.width, height: canvas.height, opacity: getComputedStyle(canvas).opacity } : null,
      activeElement: { tag: document.activeElement?.tagName, id: document.activeElement?.id, text: document.activeElement?.textContent?.trim().slice(0, 80), insideInert: Boolean(document.activeElement?.closest('[inert]')) },
      selectedScenes: [...document.querySelectorAll('button[data-scene][aria-pressed="true"]')].map(b => b.dataset.scene),
      controlsInert: document.querySelector('#controls')?.inert, controlsVisible: document.querySelector('#controls') ? rendered(document.querySelector('#controls')) : false,
      fontStatus: document.fonts?.status, fontsAvailable: { fraunces: document.fonts?.check('48px Fraunces'), sourceSans: document.fonts?.check('16px "Source Sans 3"') },
      textBoxes: boxes, overlaps,
      horizontalTextClips: boxes.filter(b => onScreen(b) && (b.x < -1 || b.right > innerWidth + 1)),
      verticalTextClipsForReview: boxes.filter(b => onScreen(b) && (b.y < -1 || b.bottom > innerHeight + 1)),
      brokenVisibleImages: [...document.images].filter(img => rendered(img) && img.complete && img.naturalWidth === 0).map(img => img.currentSrc || img.src),
      paints: performance.getEntriesByType('paint').map(p => ({ name: p.name, startTime: p.startTime })),
    };
  });
}
async function capture(session, label, { validate = true, fast = true, requireLive = true } = {}) {
  const id = `${slug(currentCase.name)}--${slug(label)}`;
  const data = await metrics(session);
  let png;
  if (fast) {
    png = Buffer.from((await deadline(session.cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false }), 45_000, 'CDP screenshot')).data, 'base64');
  }
  else png = await session.page.screenshot({ fullPage: false, animations: 'allow', timeout: 45_000 });
  const filename = `screenshots/${id}.png`;
  await fs.writeFile(path.join(out, filename), png);
  let pixels;
  try { pixels = samplePixels(png, data.stage, data.viewport); if (pixels.values) { stageSamples.set(id, pixels.values); delete pixels.values; } }
  catch (error) { pixels = { error: error.message }; }
  const record = { id, label, screenshot: filename, screenshotAPI: fast ? 'CDP Page.captureScreenshot (actual current surface)' : 'Playwright page.screenshot', screenshotSHA256: hash(png), pixels, ...data, visualReview: 'REQUIRED: inspect model, occlusion, framing, text and transition continuity in this real screenshot.' };
  currentCase.captures.push(record);
  console.log(`[FRAME] ${currentCase.name} / ${label}: p=${Number(data.progress).toFixed(5)}, ${data.live ? 'WebGL' : data.staticMode ? 'reading edition' : 'poster'}`);
  if (validate) {
    check(`${label}: no horizontal document overflow`, data.scroll.width <= data.viewport.width + 1, { scrollWidth: data.scroll.width, viewport: data.viewport.width });
    check(`${label}: visible important text does not overlap`, data.overlaps.length === 0, data.overlaps);
    check(`${label}: important text is not horizontally clipped`, data.horizontalTextClips.length === 0, data.horizontalTextClips);
    check(`${label}: correct page identity`, data.title.includes('BACKSTAGE'));
    if (requireLive) {
      check(`${label}: live canvas is active`, data.live && data.renderInfo?.renderer === 'Three.js WebGL 2' && Number(data.canvas?.opacity) > .95);
      check(`${label}: actual screenshot contains rendered scenery`, !pixels.error && pixels.quantizedColors > 12 && pixels.nonPaperFraction > .008 && pixels.luminanceStdDev > 2, pixels);
      if (data.projectedAnchors.door && data.projectedAnchors.lantern) check(`${label}: projected door and lantern remain in viewport`, data.projectedAnchors.door.inViewport && data.projectedAnchors.lantern.inViewport, data.projectedAnchors);
    }
  }
  await writeReport();
  return record;
}
function identity(record) {
  const i = record.renderInfo;
  return i ? { door: i.doorId, lantern: i.lanternId, parent: i.doorParent, lanternParent: i.lanternParent, waves: i.waveIds } : null;
}
function sameIdentity(a, b) { return JSON.stringify(identity(a)) === JSON.stringify(identity(b)); }
function structural(record) { return { world: record.world, view: record.view, light: record.light, lamp: record.lamp, scene: record.scene }; }
function nearPose(a, b, tolerance = .001) { return ['world', 'view', 'light', 'lamp'].every(k => Math.abs(a[k] - b[k]) < tolerance) && a.scene === b.scene; }

async function runCase(name, fn) {
  if (match && !match.test(name)) return;
  currentCase = { name, started: new Date().toISOString(), status: 'RUNNING', checks: [], notes: [], captures: [], sessions: [] };
  report.cases.push(currentCase);
  console.log(`[RUN] ${name}`);
  const started = Date.now();
  await writeReport();
  try { await fn(); }
  catch (error) {
    currentCase.exception = { name: error.name, message: error.message, stack: error.stack?.split('\n').slice(0, 7).join('\n') };
    check('scenario completed without exception', false, error.message);
    const latest = currentCase.sessions.at(-1);
    if (latest?.page && !latest.page.isClosed()) await capture(latest, 'failure', { validate: false, fast: true, requireLive: false }).catch(() => {});
  }
  for (const session of currentCase.sessions) {
    const unexpectedRequests = session.requests.filter(r => r.status === 404 || r.status === 403 || r.status === 'blocked-external');
    const pageErrors = session.logs.filter(l => l.kind === 'pageerror');
    const unexpectedConsole = session.logs.filter(l => ['error', 'warning'].includes(l.kind) &&
      !(/GPU stall|ReadPixels|Automatic fallback to software WebGL|deprecated.*software WebGL/i.test(l.message)) &&
      !(session.faults.contextLoss && /CONTEXT_LOST_WEBGL|WebGL.*context lost/i.test(l.message)) &&
      !(session.faults.graphicsUnavailable && /WebGLRenderer:.*(?:Error creating WebGL context|A WebGL context could not be created)/i.test(l.message)) &&
      !(session.faultCount && /Failed to load resource|net::ERR_FAILED|Failed to fetch dynamically imported module/i.test(l.message)));
    check('no unintended missing/external resources', unexpectedRequests.length === 0, unexpectedRequests);
    check('no uncaught page errors', pageErrors.length === 0, pageErrors);
    check('no unexplained console warnings/errors', unexpectedConsole.length === 0, unexpectedConsole);
    session.closing = true;
    session.releaseFonts?.();
    await session.context.close().catch(() => {});
    session.evidence = { viewport: session.viewport, deviceScaleFactor: session.deviceScaleFactor, zoomEmulation: session.zoomEmulation, basePath: session.basePath, faults: session.faults, faultCount: session.faultCount, requests: session.requests, logs: session.logs };
  }
  currentCase.sessions = currentCase.sessions.map(s => s.evidence);
  currentCase.finished = new Date().toISOString(); currentCase.durationMs = Date.now() - started;
  currentCase.status = currentCase.checks.some(c => !c.pass) ? 'FAIL' : currentCase.notCovered ? 'NOT_COVERED' : 'PASS';
  console.log(`[${currentCase.status}] ${name}: ${currentCase.checks.filter(c => c.pass).length}/${currentCase.checks.length} checks; ${currentCase.captures.length} screenshots; ${(currentCase.durationMs / 1000).toFixed(1)}s`);
  await writeReport();
}
const wants = group => groups.has('all') || groups.has(group);

try {
  browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'] });
  report.environment.browser = await browser.version();

  if (wants('smoke')) await runCase('smoke/first-path', async () => {
    const s = await openSession();
    let first;
    for (const [label, p] of [['room', 0], ['reveal-half', .19], ['wings', .29], ['change-half', .43], ['sea', .55]]) {
      await setProgress(s, p);
      const image = await capture(s, label); first ||= image;
      check(`${label}: persistent prop identity`, sameIdentity(first, image));
    }
  });

  if (wants('viewports')) for (const viewport of requestedViewports) await runCase(`viewports/${viewport.width}x${viewport.height}`, async () => {
    const s = await openSession({ viewport });
    const expected = [{ world: 0, view: 0, lamp: 0 }, { world: 0, view: 1, lamp: 0 }, { world: 1, view: .12, lamp: .7 }, { world: 2, view: 0, lamp: 1 }, { world: 2, view: 0, lamp: 0 }];
    let first;
    for (let i = 0; i < actAnchors.length; i++) {
      if(selectedActs&&!selectedActs.has(i+1))continue;
      await setProgress(s, actAnchors[i]);
      const image = await capture(s, `act-${i + 1}`); first ||= image;
      check(`act ${i + 1}: canonical stable pose`, ['world', 'view', 'lamp'].every(k => Math.abs(image[k] - expected[i][k]) < .001), { expected: expected[i], actual: structural(image) });
      check(`act ${i + 1}: same original door and lantern`, sameIdentity(first, image));
      check(`act ${i + 1}: props share the turntable`, image.renderInfo?.doorParent === image.renderInfo?.lanternParent);
      if (image.renderInfo?.waveParents) check(`act ${i + 1}: waves share the turntable`, image.renderInfo.waveParents.every(p => p === image.renderInfo.doorParent));
    }
  });

  if (wants('transitions')) await runCase('transitions/all-handoffs-both-directions', async () => {
    const s = await openSession();
    const handoffs = [['audience-to-wings', .12, .26], ['room-to-sea', .34, .52], ['sea-to-night', .60, .68], ['director-to-ending', .82, .94]];
    let first;
    for (const [label, a, b] of handoffs) {
      if(args.handoff&&label!==args.handoff)continue;
      await setProgress(s,a-.004);await capture(s,`${label}-before`);
      const forward = [];
      for (let i = 0; i < 5; i++) {
        const p = a + (b - a) * i / 4; await setProgress(s, p);
        const image = await capture(s, `${label}-forward-${i * 25}`); first ||= image; forward.push(image);
        check(`${label} ${i * 25}%: same props`, sameIdentity(first, image));
      }
      for (let i = 4; i >= 0; i--) {
        await setProgress(s, a + (b - a) * i / 4);
        const image = await capture(s, `${label}-reverse-${i * 25}`);
        check(`${label} ${i * 25}%: reverse structural pose`, nearPose(forward[i], image, .006), { forward: structural(forward[i]), reverse: structural(image) });
        check(`${label} reverse: same props`, sameIdentity(first, image));
      }
      await setProgress(s,b+.004);await capture(s,`${label}-after`);
    }
    note('Living wave and lantern motion remains active in these screenshots; identical structural poses do not imply identical image bytes. Human transition review remains required.');
  });

  if (wants('interactions')) {
    await runCase('interactions/six-scene-pairs-and-retarget', async () => {
      const s = await openSession(); await setProgress(s, .735);
      const first = await capture(s, 'default-night');
      for (const from of Object.keys(sceneWorld)) for (const to of Object.keys(sceneWorld)) if (from !== to) {
        await chooseScene(s, from); const before = await capture(s, `${from}-to-${to}-before`);
        await chooseScene(s, to); const after = await capture(s, `${from}-to-${to}-after`);
        check(`${from} to ${to}: persistent props`, sameIdentity(first, after));
        check(`${from} to ${to}: pressed control agrees`, after.selectedScenes.length === 1 && after.selectedScenes[0] === to);
        const delta = pixelDifference(before.id, after.id);
        check(`${from} to ${to}: actual stage pixels change`, delta?.meanAbsoluteChannelDifference > .25, delta);
      }
      for (const scene of ['room', 'night', 'sea', 'room', 'sea', 'night', 'room']) await s.page.locator(`button[data-scene="${scene}"]`).click();
      await waitScene(s, 'room'); const final = await capture(s, 'rapid-retarget-final-room');
      check('latest target wins without rebuilding props', final.scene === 'room' && final.world === 0 && sameIdentity(first, final));
    });
    await runCase('interactions/view-light-and-reset', async () => {
      const s = await openSession(); await setProgress(s, .735); await chooseScene(s, 'room');
      await s.page.locator('#view').press('Home'); const front = await capture(s, 'audience');
      await s.page.locator('#view').press('End'); await s.page.waitForTimeout(650); const wings = await capture(s, 'wings');
      check('keyboard range changes real camera', wings.view > .99 && JSON.stringify(front.renderInfo?.camera) !== JSON.stringify(wings.renderInfo?.camera));
      const viewDelta = pixelDifference(front.id, wings.id); check('view changes rendered stage', viewDelta?.meanAbsoluteChannelDifference > .5, viewDelta);
      await s.page.locator('#view').press('Home'); await s.page.locator('#light').press('Home'); await s.page.waitForTimeout(650); const low = await capture(s, 'low-light');
      await s.page.locator('#light').press('End'); await s.page.waitForTimeout(650); const high = await capture(s, 'high-light');
      check('light changes real key position', low.light === 0 && high.light === 1 && JSON.stringify(low.renderInfo?.key) !== JSON.stringify(high.renderInfo?.key));
      const lightDelta = pixelDifference(low.id, high.id); check('light changes actual stage pixels', lightDelta?.meanAbsoluteChannelDifference > .25, lightDelta);
      for (const selector of ['#view', '#light']) {
        await s.page.locator(selector).focus();
        const outline = await s.page.locator(selector).evaluate(el => {
          const r=el.getBoundingClientRect(), labels=el.nextElementSibling.getBoundingClientRect(), css=getComputedStyle(el);
          const outset=parseFloat(css.outlineOffset)+parseFloat(css.outlineWidth);
          return { focused:document.activeElement===el, visible:el.matches(':focus-visible')&&css.outlineStyle!=='none'&&parseFloat(css.outlineWidth)>0, ring:{left:r.left-outset,right:r.right+outset,top:r.top-outset,bottom:r.bottom+outset}, labelTop:labels.top, viewport:{width:innerWidth,height:innerHeight}, offset:css.outlineOffset };
        });
        check(`${selector}: visible focus ring clears endpoint labels`, outline.focused&&outline.visible&&outline.ring.bottom<=outline.labelTop+.5, outline);
        check(`${selector}: focus ring remains in viewport`, outline.ring.left>=-.5&&outline.ring.top>=-.5&&outline.ring.right<=outline.viewport.width+.5&&outline.ring.bottom<=outline.viewport.height+.5, outline.ring);
      }
      const p = high.progress; await s.page.locator('#reset-production').click(); await waitScene(s, 'night');
      const reset = await capture(s, 'reset'); check('reset restores production without scrolling', reset.world === 2 && reset.view === 0 && Math.abs(reset.light - .55) < .001 && Math.abs(reset.progress - p) < .001);
    });
    await runCase('interactions/exit-snapshot-pause-reverse-reentry', async () => {
      const s = await openSession(); await setProgress(s, .735); await s.page.locator('#view').press('End');
      await s.page.locator('#light').press('Home'); await s.page.locator('#light').press('ArrowRight');
      await s.page.locator('button[data-scene="room"]').click();
      await s.page.waitForFunction(() => { const w = Number(document.querySelector('#stage').dataset.world); return w < 1.9 && w > .6; });
      await setProgress(s, .8205, 650); const start = await capture(s, 'snapshot-start');
      const forward = [];
      for (const p of [.85, .88, .91, .94]) { await setProgress(s, p, 650); forward.push(await capture(s, `forward-${p}`)); }
      for (let i = 3; i >= 0; i--) { await setProgress(s, [.85, .88, .91, .94][i], 650); const image = await capture(s, `reverse-${i}`); check(`reverse sample ${i}: same captured path`, nearPose(forward[i], image)); check(`reverse sample ${i}: snapshot is not recaptured`, image.snapshotId === start.snapshotId); }
      await setProgress(s, .88, 650); const paused = await capture(s, 'paused-before'); await s.page.waitForTimeout(1000); const pausedAfter = await capture(s, 'paused-after');
      check('stopped scroll freezes structural cue', nearPose(paused, pausedAfter, .0001), { before: structural(paused), after: structural(pausedAfter) });
      await setProgress(s, .8195, 0); const reentry = await metrics(s);
      check('IV reentry restores choices and pending target', reentry.scene === 'room' && reentry.view > .99 && reentry.light < .02 && reentry.world > .1, structural(reentry));
      await setProgress(s, .735); await waitScene(s, 'room'); await setProgress(s, .985); const end = await capture(s, 'selected-room-ending');
      check('ending retains selected room and low light', end.world === 0 && end.lamp === 0 && end.view === 0 && end.light < .02 && end.scene === 'room');
      await s.page.locator('#begin-again').click();
      const restartFrames = [];
      for (let i = 0; i < 12; i++) { const m = await metrics(s); restartFrames.push({ p: m.progress, world: m.world }); await s.page.waitForTimeout(70); }
      check('Begin again does not flash NIGHT in the ending', restartFrames.filter(f => f.p >= .82).every(f => Math.abs(f.world) < .001), restartFrames);
      await s.page.waitForFunction(() => Number(document.querySelector('#story').dataset.progress) < .002); await capture(s, 'begin-again');
    });
    await runCase('interactions/keyboard-wheel-and-focus', async () => {
      const s = await openSession(); await s.page.locator('.skip-link').focus(); await s.page.keyboard.press('Enter');
      await s.page.waitForFunction(() => document.activeElement?.id === 'title-four');
      check('keyboard skip focuses the active heading', (await metrics(s)).activeElement.id === 'title-four');
      await s.page.keyboard.press('Tab'); check('next tab reaches an active Scene control', await s.page.evaluate(() => document.activeElement?.matches('button[data-scene]') && !document.activeElement.closest('[inert]')));
      await setProgress(s, .89); check('leaving IV does not strand focus inside inert controls', !(await metrics(s)).activeElement.insideInert);
      await setProgress(s, 0); const box = await s.page.locator('#stage').boundingBox(); await s.page.mouse.move(box.x + box.width / 2, box.y + Math.min(box.height / 2, 150));
      await s.page.mouse.wheel(0, 170); await s.page.waitForTimeout(450); const slow = (await metrics(s)).progress;
      await s.page.mouse.wheel(0, 2600); await s.page.waitForTimeout(850); const fast = (await metrics(s)).progress;
      await s.page.mouse.wheel(0, -1400); await s.page.waitForTimeout(850); const reverse = (await metrics(s)).progress;
      check('native wheel input supports slow, fast and reverse travel', slow > 0 && fast > slow && reverse < fast, { slow, fast, reverse });
      await capture(s, 'wheel-reverse');
    });
    await runCase('interactions/touch-native-scroll-and-controls', async () => {
      const s = await openSession({ viewport: { width: 390, height: 844 }, touch: true });
      await s.cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 500 }] });
      for (let i = 1; i <= 12; i++) { await s.cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: 500 - i * 24 }] }); await sleep(16); }
      await s.cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await s.page.waitForTimeout(700);
      check('emulated touch swipe advances the real document', (await metrics(s)).progress > .005);
      await s.page.locator('.chapter-nav a[href="#cue"]').tap(); await s.page.waitForFunction(() => Math.abs(Number(document.querySelector('#story').dataset.progress) - .735) < .003);
      await s.page.locator('button[data-scene="sea"]').tap(); await waitScene(s, 'sea');
      const range = await s.page.locator('#view').boundingBox(); await s.page.touchscreen.tap(range.x + range.width * .8, range.y + range.height / 2); await s.page.waitForTimeout(650);
      const result = await capture(s, 'touch-sea-view'); check('touch controls affect scene and view', result.world === 1 && result.view > .6);
      note('These are Chromium touch-emulation events, not a physical Android device.');
    });
  }

  if (wants('resilience')) {
    await runCase('resilience/context-loss-and-retry', async () => {
      const s = await openSession(); await setProgress(s, .735); await chooseScene(s, 'sea'); const before = await capture(s, 'before');
      s.faults.contextLoss = true;
      const supported = await s.page.evaluate(() => { const ext = document.querySelector('#theatre').getContext('webgl2')?.getExtension('WEBGL_lose_context'); if (!ext) return false; ext.loseContext(); return true; });
      if (!supported) { currentCase.notCovered = true; note('WEBGL_lose_context extension unavailable; recovery was not simulated.'); return; }
      await s.page.locator('#recovery').waitFor({ state: 'visible' });
      await s.page.waitForFunction(() => { const poster = document.querySelector('#stage-poster'); return poster.complete && poster.naturalWidth > 0 && Number(getComputedStyle(poster).opacity) > .98; });
      const lost = await capture(s, 'lost-poster', { requireLive: false });
      check('context loss shows an actual local poster', !lost.live && lost.poster.complete && lost.poster.width > 0 && Number(lost.poster.opacity) > .95);
      await s.page.locator('#retry').click(); await waitLive(s); const after = await capture(s, 'restored');
      check('context recovery retains same selected stage', after.scene === 'sea' && after.world === 1 && sameIdentity(before, after));
    });
    for (const kind of ['renderer', 'main']) await runCase(`resilience/${kind}-bundle-failure`, async () => {
      const s = await openSession({ faults: { [kind]: true }, live: false });
      await s.page.waitForFunction(kind => kind === 'main' ? document.body.classList.contains('boot-fallback') : document.body.classList.contains('static-mode'), kind, { timeout: 12_000 });
      const first = await capture(s, 'reading-fallback', { requireLive: false });
      check('specified bundle failure was actually injected', s.faultCount > 0);
      check('fallback poster is a decoded local image', first.poster.complete && first.poster.width > 0);
      check('unavailable live controls are hidden', !await s.page.locator('#controls').isVisible());
      if (kind === 'main') {
        const flow = await s.page.locator('.act').evaluateAll(els => els.map(el => ({ top: el.getBoundingClientRect().top, bottom: el.getBoundingClientRect().bottom, inert: el.inert, ariaHidden: el.getAttribute('aria-hidden'), display: getComputedStyle(el).display, visibility: getComputedStyle(el).visibility })));
        check('main failure exposes all acts accessibly in document flow', flow.every((e, i) => !e.inert && e.ariaHidden !== 'true' && e.display !== 'none' && e.visibility !== 'hidden' && (!i || e.top >= flow[i - 1].bottom)), flow);
      }
      for (let i = 0; i < 4; i++) { const img = s.page.locator('#static-gallery img').nth(i); await img.scrollIntoViewIfNeeded(); await img.evaluate(el => el.decode()); }
      check('all four fallback views decode', await s.page.locator('#static-gallery img').evaluateAll(imgs => imgs.every(img => img.complete && img.naturalWidth > 0)));
      await capture(s, 'static-gallery', { validate: false, requireLive: false });
    });
    await runCase('resilience/main-slow-start', async () => {
      const s = await openSession({ commitOnly: true, live: false, faults: { scriptDelay: 2200, cssDelay: 350, imageDelay: 500 } });
      await s.page.locator('#stage-poster').waitFor({ state: 'visible' }); await s.page.waitForFunction(() => document.querySelector('#stage-poster')?.naturalWidth > 0);
      const first = await capture(s, 'poster-before-live', { requireLive: false, fast: true });
      check('slow scripts still give a visible theatre poster', first.poster.width > 0 && Number(first.poster.opacity) > .95);
      await waitLive(s); await capture(s, 'live-after-delays');
    });
    await runCase('resilience/main-arrives-after-six-second-fallback', async () => {
      const s = await openSession({ commitOnly: true, live: false, faults: { mainDelay: 7500 } });
      await s.page.waitForFunction(() => document.body.classList.contains('boot-fallback'), undefined, { timeout: 10_000 });
      const before = await capture(s, 'six-second-reading-fallback', { requireLive: false, fast: true });
      check('delayed main actually enters the independent reading edition', before.bootFallback && !before.controllerReady);
      await waitLive(s);
      const after = await capture(s, 'late-main-live');
      check('late main clears its fallback layout', after.controllerReady && !after.bootFallback && !after.staticMode);
      const flags = await s.page.evaluate(() => ({ controls: document.querySelector('#controls').hidden, status: document.querySelector('#cue-status').hidden, note: document.querySelector('#static-controls-note').hidden, gallery: document.querySelector('#static-gallery').hidden, boot: document.documentElement.getAttribute('data-boot') }));
      check('late main restores coherent live visibility flags', !flags.controls && !flags.status && flags.note && flags.gallery && flags.boot === null, flags);
      await setProgress(s, .735); await chooseScene(s, 'room');
      const cue = await capture(s, 'late-main-working-controls');
      check('late boot leaves real director controls usable', cue.world === 0 && cue.scene === 'room');
    });
    await runCase('resilience/poster-resource-failure', async () => {
      const s = await openSession({ faults: { posters: true } }); const shot = await capture(s, 'live-with-missing-poster');
      check('poster fault was injected while live scene still renders', s.faultCount > 0 && shot.live);
    });
    await runCase('resilience/resize-and-orientation', async () => {
      const s = await openSession({ viewport: { width: 390, height: 844 } }); await setProgress(s, .735); await chooseScene(s, 'sea'); await s.page.locator('#view').press('End');
      await waitObservedPose(s, { world: 1, view: 1 });
      const first = await capture(s, 'portrait');
      for (const viewport of [{ width: 844, height: 390 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
        await s.page.setViewportSize(viewport); await s.page.waitForTimeout(450); await waitStableLayout(s); await setProgress(s, .735);
        await waitObservedPose(s, { world: 1, view: 1 });
        const shot = await capture(s, `${viewport.width}x${viewport.height}`); check('resize preserves production and prop identities', shot.scene === 'sea' && shot.world === 1 && shot.view === 1 && sameIdentity(first, shot));
      }
      note('After each resize, the test waits for stable production height/story extent, then deliberately returns to Act IV. It proves retained director choices and object identities, not preservation of the exact scroll phase during orientation change.');
    });
    await runCase('resilience/reduced-motion-and-keyboard-focus', async () => {
      const s = await openSession({ reducedMotion: true }); await s.page.locator('.skip-link').focus(); await s.page.keyboard.press('Enter');
      await s.page.waitForFunction(() => document.activeElement?.id === 'title-four'); check('instant reduced-motion navigation moves focus', (await metrics(s)).activeElement.id === 'title-four');
      await chooseScene(s, 'room'); await s.page.locator('#view').press('End'); await s.page.locator('#light').press('Home');
      await waitObservedPose(s, { world: 0, view: 1, light: 0 });
      const cue = await capture(s, 'reduced-room-wings'); check('all director controls remain functional', cue.world === 0 && cue.view === 1 && cue.light === 0);
      await setProgress(s, .985); const end = await capture(s, 'reduced-ending'); check('reduced ending preserves the selected world and light', end.world === 0 && end.light === 0 && end.lamp === 0);
    });
    await runCase('resilience/history-reload-and-direct-ending', async () => {
      const s = await openSession(); await s.page.locator('.chapter-nav a[href="#cue"]').click(); await s.page.waitForFunction(() => Math.abs(Number(document.querySelector('#story').dataset.progress) - .735) < .003);
      await chooseScene(s, 'sea'); await s.page.locator('#light').press('End'); await s.page.locator('#cue a[href="#again"]').click(); await s.page.waitForFunction(() => Number(document.querySelector('#story').dataset.progress) > .97); await s.page.waitForTimeout(400);
      const end = await capture(s, 'before-back'); await s.page.goBack(); await s.page.waitForFunction(() => Math.abs(Number(document.querySelector('#story').dataset.progress) - .735) < .003);
      const back = await capture(s, 'history-back'); check('history returns to saved director choices', back.scene === 'sea' && back.world === 1 && back.light === 1);
      await s.page.goForward(); await s.page.waitForFunction(() => Number(document.querySelector('#story').dataset.progress) > .97); await s.page.waitForTimeout(400); await s.page.reload({ waitUntil: 'domcontentloaded' }); await waitLive(s);
      const reload = await capture(s, 'reload-ending'); check('reload restores ending choices', reload.scene === end.scene && reload.world === end.world && reload.light === end.light && reload.lamp === 0);
      note('Reload is a same-session state-restoration check, not an HTTP cache-hit claim.');
      const fresh = await openSession({ suffix: '#again' }); const direct = await capture(fresh, 'fresh-direct-ending'); check('fresh direct ending uses canonical NIGHT', direct.world === 2 && direct.scene === 'night' && direct.lamp === 0);
    });
    await runCase('resilience/no-js-reading-edition', async () => {
      const s = await openSession({ javaScriptEnabled: false, live: false }); await s.page.locator('#stage-poster').evaluate(el => el.decode());
      const accessibility = await s.page.locator('.act').evaluateAll(els => els.map(el => ({ inert: el.inert, ariaHidden: el.getAttribute('aria-hidden'), visible: getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none' })));
      check('no-JS story exposes every act', accessibility.length === 5 && accessibility.every(e => e.visible && !e.inert && e.ariaHidden !== 'true'), accessibility);
      check('no-JS edition hides real-time controls', !await s.page.locator('#controls').isVisible()); await capture(s, 'no-js-first-view', { requireLive: false });
    });
    await runCase('resilience/nested-base-and-invalid-hash', async () => {
      const s = await openSession({ basePath: '/nested/backstage/', suffix: '#constructor' }); const shot = await capture(s, 'nested-base');
      check('unknown hash does not corrupt progress', shot.progress < .002 && Number.isFinite(shot.world));
      check('local production fonts decode under a nested base', shot.fontsAvailable.fraunces && shot.fontsAvailable.sourceSans);
    });
    await runCase('resilience/real-webgl-unavailable', async () => {
      const originalBrowser = browser;
      let unavailableBrowser;
      try {
        unavailableBrowser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-webgl', '--disable-webgl2'] });
        browser = unavailableBrowser;
        const s = await openSession({ live: false, faults: { graphicsUnavailable: true } });
        await s.page.waitForFunction(() => document.body.classList.contains('static-mode'), undefined, { timeout: 15_000 });
        const capabilities = await s.page.evaluate(() => ({
          webgl2: Boolean(document.createElement('canvas').getContext('webgl2')),
          webgl: Boolean(document.createElement('canvas').getContext('webgl')),
          canvas2d: Boolean(document.createElement('canvas').getContext('2d')),
        }));
        check('native WebGL APIs are genuinely unavailable while 2D still works', !capabilities.webgl2 && !capabilities.webgl && capabilities.canvas2d, capabilities);
        await s.page.locator('#stage-poster').evaluate(img => img.decode());
        const first = await capture(s, 'native-api-unavailable-reading-edition', { requireLive: false });
        check('graphics failure reaches a decoded local poster', first.staticMode && !first.live && first.poster.complete && first.poster.width > 0 && Number(first.poster.opacity) > .95);
        check('graphics failure hides unavailable real-time controls', !await s.page.locator('#controls').isVisible());
        for (let i = 0; i < 4; i++) { const img = s.page.locator('#static-gallery img').nth(i); await img.scrollIntoViewIfNeeded(); await img.evaluate(el => el.decode()); }
        const images = await s.page.locator('#static-gallery img').evaluateAll(imgs => imgs.map(img => ({ source: img.currentSrc, complete: img.complete, width: img.naturalWidth, height: img.naturalHeight })));
        check('all four static views decode with native WebGL disabled', images.length === 4 && images.every(img => img.complete && img.width > 0 && img.height > 0), images);
        await capture(s, 'native-api-unavailable-static-gallery', { validate: false, requireLive: false });
        note('A fresh Chromium process used --disable-webgl --disable-webgl2. No JavaScript graphics stub or synthetic context event was substituted. Three.js context-creation console messages are expected for this deliberately unavailable capability.');
      } finally {
        browser = originalBrowser;
        await unavailableBrowser?.close().catch(() => {});
      }
    });
    await runCase('resilience/background-tab', async () => {
      const s = await openSession(); await setProgress(s, .735); await s.page.locator('button[data-scene="room"]').click();
      const other = await s.context.newPage(); await other.goto('about:blank'); await other.bringToFront();
      const hidden = await s.page.evaluate(() => document.hidden);
      if (!hidden) { currentCase.notCovered = true; note('This headless Chromium backend keeps both pages visible. No synthetic visibility event was substituted; real background-tab pausing remains unverified here.'); await other.close(); return; }
      const a = await metrics(s); await sleep(1100); const b = await metrics(s); check('real hidden tab does not advance its cue', nearPose(a, b, .0001));
      await s.page.bringToFront(); await other.close(); await capture(s, 'returned-tab');
    });
  }

  if (wants('typography')) {
    for (const zoom of [1.25, 1.5, 2]) await runCase(`typography/layout-dpr-zoom-${Math.round(zoom * 100)}`, async () => {
      const viewport = { width: Math.round(1440 / zoom), height: Math.round(900 / zoom) };
      const s = await openSession({ viewport, deviceScaleFactor: zoom, zoomEmulation: { factor: zoom, physicalTarget: { width: 1440, height: 900 }, method: 'layout plus DPR emulation; not native Chrome UI zoom' } });
      for (const [label, p] of [['hero', 0], ['controls', .735]]) {
        await setProgress(s, p); const shot = await capture(s, `${Math.round(zoom * 100)}-${label}`);
        check(`${label}: zoom emulation has the intended CSS viewport and DPR`, shot.viewport.width === viewport.width && shot.viewport.height === viewport.height && shot.viewport.dpr === zoom && Number(shot.cssZoom) === 1, { viewport: shot.viewport, cssZoom: shot.cssZoom, media: shot.responsiveMedia });
        check(`${label}: physical screenshot remains approximately 1440 by 900`, Math.abs(shot.pixels.width - 1440) <= 1 && Math.abs(shot.pixels.height - 900) <= 1, { width: shot.pixels.width, height: shot.pixels.height });
      }
      note('No CSS zoom is applied. Each factor uses an independent context with reduced CSS viewport dimensions and increased DPR, so responsive media queries participate. Native browser UI zoom remains unverified by this emulation.');
    });
    await runCase('typography/delayed-font-and-loaded-font', async () => {
      const s = await openSession({ live: false, commitOnly: true, faults: { fontDelay: 4500, fontHold: true } });
      await s.page.locator('.wordmark').waitFor({ state: 'visible' }); await s.page.waitForFunction(() => parseFloat(getComputedStyle(document.querySelector('.wordmark')).fontSize) > 30, undefined, { polling: 100, timeout: 30_000 });
      const fallback = await capture(s, 'font-pending', { requireLive: false, fast: true });
      check('first font screenshot is actually captured before requested fonts load', fallback.fontStatus === 'loading' && !fallback.fontsAvailable.fraunces && !fallback.fontsAvailable.sourceSans, { status: fallback.fontStatus, fonts: fallback.fontsAvailable });
      note(`Actual font status at pending capture: ${fallback.fontStatus}; availability: ${JSON.stringify(fallback.fontsAvailable)}.`);
      note('Font responses wait at least 4.5 seconds and remain held until the pending-font screenshot is collected (60-second safety deadline). This isolates real fallback font layout from variable software-renderer startup time.');
      s.releaseFonts();
      await deadline(s.page.evaluate(() => document.fonts.ready), 30_000, 'font loading after gate release'); await waitLive(s); await capture(s, 'font-loaded');
      await setProgress(s, .735); await capture(s, 'loaded-controls');
    });
    await runCase('typography/font-resource-failure', async () => {
      const s = await openSession({ faults: { fonts: true } }); const hero = await capture(s, 'fallback-font-hero');
      check('font failure was actually injected', s.faultCount > 0); note(`FontFaceSet availability after failure: ${JSON.stringify(hero.fontsAvailable)}.`);
      await setProgress(s, .735); await capture(s, 'fallback-font-controls');
    });
  }

  if (wants('performance')) await runCase('performance/software-rendering-sample', async () => {
    const s = await openSession(); await setProgress(s, .55); await s.page.waitForTimeout(500);
    await s.cdp.send('Performance.enable'); const before = await s.cdp.send('Performance.getMetrics');
    const sample = await s.page.evaluate(duration => new Promise(resolve => {
      const intervals = []; let start = performance.now(), previous = start, finished = false;
      const timer = setTimeout(() => { finished = true; resolve({ elapsedMs: performance.now() - start, intervals, timedOut: true }); }, duration + 15_000);
      function frame(now) { if (finished) return; intervals.push(now - previous); previous = now; if (now - start < duration) requestAnimationFrame(frame); else { finished = true; clearTimeout(timer); resolve({ elapsedMs: now - start, intervals, timedOut: false }); } }
      requestAnimationFrame(frame);
    }), performanceDuration);
    check('animation frame sample completed before its finite deadline', !sample.timedOut && sample.intervals.length > 1, { timedOut: sample.timedOut, frames: sample.intervals.length });
    const after = await s.cdp.send('Performance.getMetrics');
    const sorted = sample.intervals.slice(1).sort((a, b) => a - b), sum = sorted.reduce((a, b) => a + b, 0);
    currentCase.performance = { sampleInterval: `SEA stable hold, requested ${performanceDuration}ms, real software WebGL`, requestedDurationMs: performanceDuration, frameIntervalsMs: sample.intervals, elapsedMs: sample.elapsedMs, frames: sample.intervals.length, meanFrameMs: sum / sorted.length, medianFrameMs: sorted[Math.floor(sorted.length * .5)], p95FrameMs: sorted[Math.floor(sorted.length * .95)], approximateFPS: 1000 / (sum / sorted.length), cdpBefore: before.metrics, cdpAfter: after.metrics, stage: (await metrics(s)).renderInfo };
    await capture(s, 'sea-performance-sample'); note('No 60 FPS pass threshold is imposed on virtual software rendering. No Lighthouse, Web Vitals, real GPU, or device claims are inferred from this sample.');
  });
} catch (error) {
  report.fatal = { message: error.message, stack: error.stack };
  console.error(`[BLOCKED] ${error.message}`);
} finally {
  if (browser) await browser.close().catch(() => {});
  report.finished = new Date().toISOString();
  const cases = report.cases;
  report.summary = { cases: cases.length, passed: cases.filter(c => c.status === 'PASS').length, failed: cases.filter(c => c.status === 'FAIL').length, notCovered: cases.filter(c => c.status === 'NOT_COVERED').length, screenshots: cases.reduce((n, c) => n + c.captures.length, 0), visualReview: 'Pending human review of saved screenshots; automated success does not certify final art direction.', functionalStatus: report.fatal ? 'BLOCKED' : !cases.length ? 'NO_CASES_SELECTED' : cases.some(c => c.status === 'FAIL') ? 'FAIL' : cases.some(c => c.status === 'NOT_COVERED') ? 'PASS_WITH_UNCOVERED_ITEMS' : 'PASS' };
  await writeReport();
  console.log(JSON.stringify({ output: out, summary: report.summary }, null, 2));
  if (report.fatal || report.summary.failed || !cases.length) process.exitCode = 1;
}
