#!/usr/bin/env node
/**
 * Local production-browser acceptance runner. No server is started and no
 * browser is installed. Every observation is written only after execution.
 * Screenshots require an independent visual review before artistic acceptance.
 */
import assert from 'node:assert/strict';
import { mkdir, writeFile, appendFile, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chapters, transitions } from '../src/story-data.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const EXPECTED_TITLE = 'CARGO — The same box, a changing world';
const BATCHES = ['smoke', 'desktop', 'mobile', 'viewports', 'breakpoints', 'interactions', 'reduced', 'recovery', 'zoom'];
const VIEWPORTS = [
  [320, 700], [360, 640], [390, 844], [768, 1024],
  [1440, 900], [1920, 1080], [2560, 1440], [3840, 2160],
];
const BREAKPOINTS = [
  [359, 700], [361, 700], [699, 900], [701, 900], [999, 900], [1001, 900],
  [1899, 1080], [1901, 1080], [2799, 1440], [2801, 1440], [844, 390], [701, 599], [701, 601],
];
const flags = Object.fromEntries(process.argv.slice(2).filter(arg => arg.startsWith('--')).map(arg => {
  const [name, ...rest] = arg.slice(2).split('=');
  return [name, rest.length ? rest.join('=') : true];
}));
if (flags.help) {
  console.log('Usage: node tests/browser.mjs --batch=smoke|desktop|mobile|viewports|breakpoints|interactions|reduced|recovery|zoom|all');
  console.log('Options: --out=PATH --budget-ms=600000 --case-timeout-ms=45000 --headed --no-video --list');
  console.log('Environment: CARGO_BASE_URL, CARGO_BROWSER_EXECUTABLE, CARGO_BROWSER_CHANNEL, CARGO_TEST_DIST. No installation or server startup is performed.');
  process.exit(0);
}
const requested = String(flags.batch ?? 'smoke').split(',');
const selected = requested.includes('all') ? BATCHES : requested;
for (const batch of selected) if (!BATCHES.includes(batch)) throw new Error(`Unknown batch: ${batch}`);
const stamp = new Date().toISOString().replace(/[:.]/gu, '-');
const OUT = path.resolve(ROOT, String(flags.out ?? `docs/evidence/browser/${stamp}-${selected.join('-')}`));
const TEST_DIST = process.env.CARGO_TEST_DIST ? path.resolve(ROOT, process.env.CARGO_TEST_DIST) : null;
const BASE = new URL(TEST_DIST ? 'http://cargo.test/' : process.env.CARGO_BASE_URL ?? 'http://127.0.0.1:4173/');
if (!['http:', 'https:'].includes(BASE.protocol)) throw new Error('CARGO_BASE_URL must be an HTTP(S) production preview.');
const budgetMs = Number(flags['budget-ms'] ?? 600000);
const caseTimeoutMs = Number(flags['case-timeout-ms'] ?? 45000);
if (!Number.isFinite(budgetMs) || budgetMs < 1000 || !Number.isFinite(caseTimeoutMs) || caseTimeoutMs < 1000) throw new Error('Timeouts must be finite milliseconds of at least 1000.');

const planned = [];
const plan = (id, batch, description, viewport) => planned.push({ id, batch, description, ...(viewport ? { viewport } : {}), status: 'NOT TESTED', evidence: [] });
plan('smoke.identity', 'smoke', 'Exact CARGO page identity, complete semantic story, no framework overlay', [1440, 900]);
plan('smoke.hero', 'smoke', 'Observed first art, settled hero, real CTA and performance observations', [1440, 900]);
plan('smoke.keyboard', 'smoke', 'Keyboard menu, Escape, focus restoration and chapter target focus', [1440, 900]);
plan('smoke.inputs', 'smoke', 'Wheel, PageDown, Home/End and return to the opening', [1440, 900]);
for (const batch of ['desktop', 'mobile']) {
  const viewport = batch === 'desktop' ? [1440, 900] : [390, 844];
  for (const chapter of chapters) plan(`${batch}.${chapter.id}`, batch, 'Actual first/second beats, initial control state and readable layout', viewport);
  for (const transition of transitions) plan(`${batch}.${transition.id}`, batch, 'Five checkpoints, reverse, direct midpoint, threshold neighbors and identity', viewport);
  plan(`${batch}.hero-cycles`, batch, 'Three first-scroll/return cycles with quarter/mid/three-quarter stops', viewport);
  plan(`${batch}.continuous`, batch, 'Continuous high-risk scroll observation recorded for independent review', viewport);
  plan(`${batch}.history`, batch, 'Chapter jumps, history, refresh, rapid navigation and reverse return', viewport);
  if (batch === 'mobile') plan('mobile.touch', batch, 'Touch-emulated chapter menu and native vertical gesture', viewport);
}
for (const viewport of VIEWPORTS) plan(`viewports.${viewport.join('x')}`, 'viewports', 'Hero, long heading, hard handoff, carrier interaction and ending', viewport);
for (const viewport of BREAKPOINTS) plan(`breakpoints.${viewport.join('x')}`, 'breakpoints', 'Both sides of actual layout boundaries and short landscape', viewport);
for (const name of ['identity', 'packing', 'doors', 'road', 'carrier', 'locators', 'lift', 'ports', 'ending', 'sound']) {
  plan(`interactions.${name}`, 'interactions', `Initial/select/change/reset and accessible outcome: ${name}`, [1440, 900]);
}
plan('reduced.os', 'reduced', 'OS reduced-motion preference preserves all chapters, five stages and controls', [390, 844]);
plan('reduced.ui', 'reduced', 'Motion setting and View as stills preserve meaningful results', [1440, 900]);
for (const [name, viewport] of [
  ['desktop-image-retry', [1440, 900]], ['mobile-picture-retry', [390, 844]],
  ['target-asset-failures', [390, 844]], ['slow-and-late-assets', [1440, 900]],
  ['font-failure', [390, 844]], ['no-webgl', [390, 844]], ['webgl-loss', [1440, 900]],
  ['resize-and-restore', [1440, 900]], ['scrollbar', [1440, 900]],
]) plan(`recovery.${name}`, 'recovery', name.replaceAll('-', ' '), viewport);
for (const factor of [1.25, 1.5, 2]) plan(`zoom.${factor}`, 'zoom', 'Attempt real browser zoom; block if browser chrome does not change layout metrics', [1440, 900]);

if (flags.list) {
  console.log(JSON.stringify({ baseURL: BASE.href, selected, cases: planned.filter(item => selected.includes(item.batch)) }, null, 2));
  process.exit(0);
}

const report = {
  format: 'cargo-browser-evidence-v1', startedAt: new Date().toISOString(), finishedAt: null,
  baseURL: BASE.href, selectedBatches: selected, automatedStatus: 'NOT TESTED', visualAcceptance: 'NOT TESTED',
  environment: { node: process.version, platform: process.platform, architecture: process.arch, browser: null, headless: !flags.headed, physicalHardware: 'Unknown', dpr: 1, transport: TEST_DIST ? 'File-backed Playwright request fulfillment; not a production HTTP preview' : 'Normal production-preview HTTP', distDirectory: TEST_DIST },
  caveats: [
    'This runner does not install a browser or start a server.',
    'A screenshot existing is not a visual-quality PASS. Independent review remains required.',
    'CSS viewport and touch emulation are not physical-device tests.',
    'Performance entries are local observations, not field INP or guaranteed Core Web Vitals.',
    'Actual browser zoom is reported BLOCKED if browser shortcuts do not change layout metrics.',
    'No Safari, physical high-refresh-rate hardware or real mobile network coverage is implied.',
    ...(TEST_DIST ? ['CARGO_TEST_DIST is active. HTML, scripts, fonts and images are fulfilled from local build files. Browser behavior is real; production HTTP routing and wire-network performance are not verified.'] : []),
  ], cases: planned, contexts: [], blockers: [],
};
const started = Date.now();
let wrongTargetReason = null;
class Blocked extends Error {}
const findCase = id => {
  const item = planned.find(entry => entry.id === id);
  if (!item) throw new Error(`Unplanned test case ${id}`);
  return item;
};
async function persist() {
  const executed = planned.filter(item => selected.includes(item.batch));
  report.counts = Object.fromEntries(['PASS', 'FAIL', 'BLOCKED', 'NOT TESTED'].map(status => [status, executed.filter(item => item.status === status).length]));
  await writeFile(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
}
async function shot(page, item, label) {
  const name = `${item.id}-${label}`.replace(/[^a-zA-Z0-9_.-]/gu, '-');
  const filename = path.join(OUT, 'screenshots', `${name}.jpg`);
  await page.screenshot({ path: filename, type: 'jpeg', quality: 86, fullPage: false, animations: 'allow' });
  const evidence = { kind: 'screenshot', path: path.relative(OUT, filename).split(path.sep).join('/'), label, viewport: page.viewportSize() };
  item.evidence.push(evidence);
  return evidence;
}
async function record(id, page, fn) {
  const item = findCase(id);
  if (Date.now() - started > budgetMs) { item.reason = 'Run budget exhausted before this case.'; await persist(); return; }
  if (page?.isClosed()) { item.status = 'BLOCKED'; item.reason = 'Browser context closed after an earlier blocker or timeout.'; await persist(); return; }
  const begin = Date.now();
  let timer;
  try {
    const result = await Promise.race([
      fn(item),
      new Promise((_, reject) => { timer = setTimeout(() => { void page?.close().catch(() => {}); reject(new Blocked(`Case exceeded ${caseTimeoutMs} ms; its page was closed.`)); }, caseTimeoutMs); }),
    ]);
    item.status = 'PASS';
    if (result !== undefined) item.observations = result;
  } catch (error) {
    item.status = error instanceof Blocked ? 'BLOCKED' : 'FAIL';
    item.reason = error instanceof Error ? error.message : String(error);
    item.stack = error instanceof Error ? error.stack : undefined;
    if (page && !page.isClosed() && page.__cargoIdentityVerified) {
      try { await shot(page, item, 'failure'); } catch { /* The failure itself remains recorded. */ }
    }
  } finally {
    clearTimeout(timer);
    item.durationMs = Date.now() - begin;
    item.completedAt = new Date().toISOString();
    await appendFile(path.join(OUT, 'results.jsonl'), `${JSON.stringify(item)}\n`);
    console.log(JSON.stringify({ id, status: item.status, durationMs: item.durationMs, reason: item.reason }));
    await persist();
  }
}

async function makeContext(browser, viewport = [1440, 900], options = {}) {
  const { recordVideo = false, ...extra } = options;
  const context = await browser.newContext({
    viewport: { width: viewport[0], height: viewport[1] }, deviceScaleFactor: 1,
    isMobile: viewport[0] <= 700, hasTouch: viewport[0] <= 700, reducedMotion: 'no-preference',
    ...(recordVideo && !flags['no-video'] ? { recordVideo: { dir: path.join(OUT, 'videos'), size: { width: Math.min(viewport[0], 1440), height: Math.min(viewport[1], 900) } } } : {}),
    ...extra,
  });
  const info = { viewport, conditions: extra, console: [], pageErrors: [], failedRequests: [], videoRequested: recordVideo, videoEnabled: recordVideo && !flags['no-video'], transport: TEST_DIST ? 'intercepted local dist files' : 'production HTTP' };
  report.contexts.push(info);
  if (TEST_DIST) {
    let distRoot;
    try { distRoot = await realpath(TEST_DIST); }
    catch (error) { await context.close(); throw new Blocked(`CARGO_TEST_DIST cannot be read: ${error.message}`); }
    const mime = {
      '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
      '.mjs': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp',
      '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon',
      '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
      '.wasm': 'application/wasm', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
    };
    // Later failure/delay routes call fallback(), which returns here. A continue()
    // call would bypass this fulfillment and incorrectly hit the external network.
    await context.route('http://cargo.test/**', async route => {
      const request = route.request();
      if (!['GET', 'HEAD'].includes(request.method())) { await route.fulfill({status:405,headers:{allow:'GET, HEAD'},body:'Method not allowed'}); return; }
      let pathname;
      try { pathname = decodeURIComponent(new URL(request.url()).pathname); }
      catch { await route.fulfill({status:400,body:'Invalid path encoding'}); return; }
      if (pathname.includes('\0') || pathname.includes('\\') || pathname.split('/').some(segment=>segment==='..')) { await route.fulfill({status:403,body:'Forbidden path'}); return; }
      if (pathname.endsWith('/')) pathname += 'index.html';
      const candidate = path.resolve(distRoot, `.${pathname}`);
      if (!candidate.startsWith(`${distRoot}${path.sep}`)) { await route.fulfill({status:403,body:'Forbidden path'}); return; }
      try {
        const resolved = await realpath(candidate);
        if (!resolved.startsWith(`${distRoot}${path.sep}`)) { await route.fulfill({status:403,body:'Forbidden symlink'}); return; }
        const body = await readFile(resolved);
        await route.fulfill({status:200,headers:{'content-type':mime[path.extname(resolved).toLowerCase()]??'application/octet-stream','cache-control':'no-store'},body:request.method()==='HEAD'?Buffer.alloc(0):body});
      } catch { await route.fulfill({status:404,body:'Not found'}); }
    });
  }
  await context.addInitScript(() => {
    const metrics = { lcp: null, cls: 0, longTasks: [], imageLoads: [], readyAt: null, visibility: [] };
    window.__cargoQa = metrics;
    for (const type of ['largest-contentful-paint', 'layout-shift', 'longtask']) {
      if (!PerformanceObserver.supportedEntryTypes.includes(type)) continue;
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (type === 'largest-contentful-paint') metrics.lcp = entry.startTime;
          if (type === 'layout-shift' && !entry.hadRecentInput) metrics.cls += entry.value;
          if (type === 'longtask') metrics.longTasks.push({ start: entry.startTime, duration: entry.duration });
        }
      }).observe({ type, buffered: true });
    }
    document.addEventListener('load', event => {
      const image = event.target;
      if (image instanceof HTMLImageElement && image.matches('[data-scene-image]')) metrics.imageLoads.push({ scene: image.dataset.sceneImage, at: performance.now(), source: image.currentSrc });
    }, true);
    document.addEventListener('visibilitychange', () => metrics.visibility.push({ state: document.visibilityState, at: performance.now() }));
    new MutationObserver(() => {
      if (document.documentElement?.dataset.ready === 'true' && metrics.readyAt === null) metrics.readyAt = performance.now();
    }).observe(document, { attributes: true, subtree: true, attributeFilter: ['data-ready'] });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  page.setDefaultNavigationTimeout(15000);
  page.on('console', message => { if (['error', 'warning'].includes(message.type()) && info.console.length < 200) info.console.push({ type: message.type(), text: message.text() }); });
  page.on('pageerror', error => info.pageErrors.push(error.message));
  page.on('requestfailed', request => { if (info.failedRequests.length < 200) info.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }); });
  return { context, page, info };
}
async function open(page, hash = '') {
  page.__cargoIdentityVerified = false;
  if (wrongTargetReason) throw new Blocked(wrongTargetReason);
  const url = new URL(BASE.href); url.hash = hash;
  try { await page.goto(url.href, { waitUntil: 'domcontentloaded' }); }
  catch (error) { throw new Blocked(`Production preview could not be opened: ${error.message}`); }
  const actualTitle = await page.title();
  if (actualTitle !== EXPECTED_TITLE) {
    wrongTargetReason = `Wrong preview routing: expected ${JSON.stringify(EXPECTED_TITLE)}, observed ${JSON.stringify(actualTitle)} at ${page.url()}. No application controls were used.`;
    throw new Blocked(wrongTargetReason);
  }
  try { await page.locator('html[data-ready="true"]').waitFor(); }
  catch (error) { throw new Error(`CARGO did not initialize: ${error.message}`); }
  assert.equal(await page.locator('.chapter').count(), 11);
  assert.equal(await page.locator('.handoff').count(), 10);
  page.__cargoIdentityVerified = true;
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  assert.equal(await page.locator('vite-error-overlay, nextjs-portal').count(), 0);
}
async function settled(page) {
  await page.evaluate(() => new Promise(resolve => {
    let last = scrollY, stable = 0, frames = 0;
    function frame() {
      stable = Math.abs(scrollY - last) < 0.15 ? stable + 1 : 0;
      last = scrollY;
      if (++frames >= 120 || (frames >= 12 && stable >= 4)) resolve(null);
      else requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }));
}
async function goChapter(page, number, expectFocus = true) {
  const id = `ch-${String(number).padStart(2, '0')}`;
  if (page.viewportSize().width <= 700) {
    const railMenu = page.locator('.rail-menu');
    if (await railMenu.count()) await railMenu.click();
    else await page.locator('.chapter-menu-button').click();
    await page.locator(`#chapters-dialog .chapter-list a[href="#${id}"]`).click();
  } else await page.locator(`.chapter-rail a[href="#${id}"]`).click();
  await page.waitForFunction(n => document.documentElement.dataset.activeChapter === String(n), number);
  await settled(page);
  assert.equal(new URL(page.url()).hash, `#${id}`);
  if (expectFocus) await page.waitForFunction(target => document.activeElement?.id === `title-${target}`, id);
}
async function stateOf(page, number) {
  return page.locator(`#ch-${String(number).padStart(2, '0')} .model-still svg`).first().evaluate(svg => ({ ...svg.dataset }));
}
async function checkpoint(page, index, stage) {
  const id = transitions[index].id;
  await page.locator(`[data-transition-stage="${index}:${stage}"]`).click();
  await settled(page);
  await page.waitForFunction(({ id, stage }) => document.getElementById(id)?.dataset.stage === String(stage), { id, stage });
  const observed = await page.locator(`#${id}`).evaluate(el => ({
    stage: el.dataset.stage, progress: Number(el.dataset.progress), support: el.dataset.support,
    caption: el.querySelector('.stage-caption')?.textContent,
    active: document.documentElement.dataset.activeTransition,
    id: el.querySelector('.model-slot')?.dataset.containerId,
    selected: el.querySelectorAll('.stage-select [aria-pressed="true"]').length,
  }));
  assert.equal(observed.id, 'BOX-001');
  assert.equal(observed.active, String(index));
  assert.equal(observed.caption, transitions[index].stages[stage]);
  assert.equal(observed.selected, 1);
  assert.ok(Math.abs(observed.progress - stage / 4) <= 0.004, 'Browser progress must be within a small CSS-pixel rounding tolerance of the requested stop');
  return observed;
}
async function directBoundary(page, index, fraction) {
  await page.evaluate(({ id, fraction }) => {
    const el = document.getElementById(id);
    const top = el.getBoundingClientRect().top + scrollY;
    window.scrollTo({ top: top + fraction * Math.max(1, el.offsetHeight - innerHeight), behavior: 'instant' });
  }, { id: transitions[index].id, fraction });
  await settled(page);
  await page.waitForFunction(i => document.documentElement.dataset.activeTransition === String(i), index);
  return page.locator(`#${transitions[index].id}`).evaluate(el => ({ ...el.dataset }));
}
async function auditLayout(page, selector) {
  const result = await page.evaluate(selector => {
    const scope = document.querySelector(selector);
    const clipped = [];
    const overlaps = [];
    const visible = el => {
      const rect = el.getBoundingClientRect(); const css = getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && css.visibility !== 'hidden' && css.display !== 'none' && !el.closest('[hidden]');
    };
    for (const el of scope.querySelectorAll('h1,h2,h3,h4,p,button,a,label,figcaption,svg text')) {
      if (!visible(el) || !el.textContent.trim()) continue;
      const box = el.getBoundingClientRect();
      for (let parent = el.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
        const css = getComputedStyle(parent), outer = parent.getBoundingClientRect();
        const clipsX = ['hidden', 'clip'].includes(css.overflowX), clipsY = ['hidden', 'clip'].includes(css.overflowY);
        if ((clipsX && (box.left < outer.left - 2 || box.right > outer.right + 2)) || (clipsY && (box.top < outer.top - 2 || box.bottom > outer.bottom + 2))) {
          clipped.push({ text: el.textContent.trim().slice(0, 100), element: el.tagName, ancestor: parent.className?.baseVal ?? String(parent.className) }); break;
        }
      }
    }
    const note = scope.querySelector('.handoff-note'), annotation = scope.querySelector('.handoff-annotation');
    if (note && annotation && visible(note) && visible(annotation)) {
      const a = note.getBoundingClientRect(), b = annotation.getBoundingClientRect();
      if (Math.min(a.right,b.right)-Math.max(a.left,b.left)>2 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2) overlaps.push('Handoff note overlaps the identity annotation');
    }
    return { horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - innerWidth), clipped, overlaps, text: scope.innerText.slice(0, 20000), viewport: [innerWidth, innerHeight], dpr: devicePixelRatio };
  }, selector);
  assert.ok(result.horizontalOverflow <= 2, `Horizontal document overflow: ${result.horizontalOverflow}px`);
  assert.deepEqual(result.clipped, [], 'Meaningful text must not be clipped by a hidden/clip ancestor');
  assert.deepEqual(result.overlaps, [], 'Handoff labels must not overlap');
  assert.doesNotMatch(result.text, /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u);
  delete result.text;
  return result;
}
async function performanceSnapshot(page) {
  return page.evaluate(() => ({
    ...window.__cargoQa, observedAt: performance.now(), navigation: performance.getEntriesByType('navigation')[0]?.toJSON(),
    paints: performance.getEntriesByType('paint').map(entry => entry.toJSON()),
    memory: performance.memory ? { usedJSHeapSize: performance.memory.usedJSHeapSize, totalJSHeapSize: performance.memory.totalJSHeapSize } : null,
    userAgent: navigator.userAgent, viewport: [innerWidth,innerHeight], dpr: devicePixelRatio,
  }));
}
async function withSession(browser, viewport, fn, options = {}) {
  const session = await makeContext(browser, viewport, options);
  try { await fn(session); }
  finally {
    const video = session.page.video();
    await session.context.close();
    if (video) {
      try { session.info.video = path.relative(OUT, await video.path()).split(path.sep).join('/'); }
      catch (error) { session.info.videoError = error.message; }
    }
    await persist();
  }
}

async function smoke(browser) {
  await withSession(browser, [1440,900], async ({ page, info }) => {
    await record('smoke.identity', page, async item => { await open(page); await shot(page,item,'first-meaningful-observed'); return { title: await page.title(), url: page.url(), chapters: 11, boundaries: 10 }; });
    if (!page.__cargoIdentityVerified) return;
    await record('smoke.hero', page, async item => {
      await page.waitForFunction(() => { const img = document.querySelector('.hero-photograph img'); return img?.complete && img.naturalWidth > 0; });
      await auditLayout(page,'#ch-01'); await shot(page,item,'complete-composition');
      const metrics = await performanceSnapshot(page);
      await page.locator('.hero-photograph a[href="#ch-02"]').click(); await settled(page);
      await page.waitForFunction(() => document.activeElement?.id === 'title-ch-02');
      assert.equal(new URL(page.url()).hash,'#ch-02'); await shot(page,item,'cta-target'); return metrics;
    });
    await record('smoke.keyboard', page, async item => {
      await open(page);
      await page.keyboard.press('Tab'); assert.equal(await page.locator('.skip-link').evaluate(el=>el===document.activeElement),true);
      for(let i=0;i<12 && !(await page.locator('.chapter-menu-button').evaluate(el=>el===document.activeElement));i++) await page.keyboard.press('Tab');
      assert.equal(await page.locator('.chapter-menu-button').evaluate(el=>el===document.activeElement),true);
      await page.keyboard.press('Enter'); await page.locator('#chapters-dialog[open]').waitFor();
      assert.equal(await page.locator('#chapters-dialog .close-dialog').evaluate(el=>el===document.activeElement),true);
      for(let i=0;i<16;i++){await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>Boolean(document.activeElement?.closest('#chapters-dialog'))),true);}
      await shot(page,item,'keyboard-menu'); await page.keyboard.press('Escape');
      assert.equal(await page.locator('#chapters-dialog').evaluate(el=>el.open),false);
      assert.equal(await page.locator('.chapter-menu-button').evaluate(el=>el===document.activeElement),true);
      await goChapter(page,8); await shot(page,item,'focused-target');
    });
    await record('smoke.inputs', page, async item => {
      await goChapter(page,1); const initial=await page.evaluate(()=>scrollY);
      await page.mouse.wheel(0,500); await settled(page); assert.ok(await page.evaluate(()=>scrollY)>initial);
      const afterWheel=await page.evaluate(()=>scrollY); await page.keyboard.press('PageDown');await settled(page);assert.ok(await page.evaluate(()=>scrollY)>afterWheel);
      await page.keyboard.press('End');await settled(page);assert.ok(await page.evaluate(()=>scrollY)>afterWheel+1000);
      await page.keyboard.press('Home');await settled(page);assert.ok(await page.evaluate(()=>scrollY)<3);
      await shot(page,item,'returned-opening');assert.deepEqual(info.pageErrors,[],'No unhandled application exceptions');
    });
  });
}
async function fullPath(browser,batch) {
  const viewport=batch==='desktop'?[1440,900]:[390,844];
  await withSession(browser,viewport,async ({page,info,context})=>{
    for(const chapter of chapters) await record(`${batch}.${chapter.id}`,page,async item=>{
      if(!page.__cargoIdentityVerified)await open(page);
      await goChapter(page,chapter.number);await shot(page,item,'beat-a');
      const reading=page.locator(`#${chapter.id} .chapter-reading`);await reading.scrollIntoViewIfNeeded();await settled(page);
      assert.ok((await reading.innerText()).includes(chapter.beatBody));
      const layout=await auditLayout(page,`#${chapter.id}`);await shot(page,item,'beat-b');return layout;
    });
    if(!page.__cargoIdentityVerified)return;
    for(let index=0;index<10;index++)await record(`${batch}.${transitions[index].id}`,page,async item=>{
      const stages=[];for(let stage=0;stage<5;stage++){const frame=await checkpoint(page,index,stage);await auditLayout(page,`#${transitions[index].id}`);await shot(page,item,`p${stage*25}`);stages.push(frame);}
      for(const stage of [4,3,2,1,0]){const reverse=await checkpoint(page,index,stage);assert.equal(reverse.support,stages[stage].support);assert.equal(reverse.caption,stages[stage].caption);}
      await goChapter(page,11);const direct=await directBoundary(page,index,.5);assert.ok(Math.abs(Number(direct.progress)-.5)<.004);await shot(page,item,'direct-midpoint');
      const neighbors=[];for(const p of [.001,.249,.251,.499,.501,.749,.751,.999])neighbors.push(await directBoundary(page,index,p));
      return {stages,neighbors,direct};
    });
    await record(`${batch}.hero-cycles`,page,async item=>{
      const cycles=[];for(let cycle=1;cycle<=3;cycle++){await goChapter(page,1);const frames=[];for(const stage of [1,2,3])frames.push(await checkpoint(page,0,stage));await goChapter(page,11);await goChapter(page,1);await shot(page,item,`return-${cycle}`);cycles.push(frames);}return {cycles};
    });
    await record(`${batch}.continuous`,page,async item=>{
      const samples=[];
      for(const index of [0,6,7]){
        await checkpoint(page,index,0);
        const distance=await page.locator(`#${transitions[index].id}`).evaluate(el=>Math.max(1,el.offsetHeight-innerHeight));
        await page.evaluate(()=>{window.__cargoQaFrameDeltas=[];window.__cargoQaFrameRunning=true;let last=performance.now();function tick(now){window.__cargoQaFrameDeltas.push(now-last);last=now;if(window.__cargoQaFrameRunning)requestAnimationFrame(tick);}requestAnimationFrame(tick);});
        // Intentional cadence for a continuous motion recording, not a settling workaround.
        for(let step=0;step<12;step++){await page.mouse.wheel(0,distance/12);await page.waitForTimeout(120);}
        await settled(page);
        const deltas=await page.evaluate(()=>{window.__cargoQaFrameRunning=false;return window.__cargoQaFrameDeltas;});
        samples.push({boundary:transitions[index].id,frameDeltasMs:deltas});
        await shot(page,item,`${transitions[index].id}-end`);
        for(let step=0;step<6;step++){await page.mouse.wheel(0,-distance/6);await page.waitForTimeout(80);}
        await settled(page);
      }
      const observations={samples,review:'Context video must be watched for flashes, unsupported motion, title collisions and identity changes. No FPS guarantee is inferred.'};
      if(flags['no-video']){item.observations=observations;throw new Blocked('Continuous input samples were collected, but video was disabled. Continuous visual acceptance remains untested.');}
      return observations;
    });
    await record(`${batch}.history`,page,async item=>{
      await goChapter(page,2);await goChapter(page,7);await goChapter(page,9);await page.goBack();await settled(page);assert.equal(new URL(page.url()).hash,'#ch-07');
      await page.goForward();await settled(page);assert.equal(new URL(page.url()).hash,'#ch-09');
      await page.reload({waitUntil:'domcontentloaded'});await page.locator('html[data-ready="true"]').waitFor();await settled(page);assert.equal(await page.locator('html').getAttribute('data-active-chapter'),'9');
      for(const n of [11,2,7,9,1])await goChapter(page,n);
      await shot(page,item,'round-trip-return');assert.deepEqual(info.pageErrors,[]);return await performanceSnapshot(page);
    });
    if(batch==='mobile')await record('mobile.touch',page,async item=>{
      await goChapter(page,1);const menu=page.locator('.rail-menu');const rect=await menu.boundingBox();assert.ok(rect&&rect.height>=44&&rect.width>=44);
      await page.touchscreen.tap(rect.x+rect.width/2,rect.y+rect.height/2);await page.locator('#chapters-dialog[open]').waitFor();
      const link=page.locator('#chapters-dialog a[href="#ch-06"]');const lr=await link.boundingBox();await page.touchscreen.tap(lr.x+lr.width/2,lr.y+lr.height/2);await settled(page);
      assert.equal(new URL(page.url()).hash,'#ch-06');
      const before=await page.evaluate(()=>scrollY);const cdp=await context.newCDPSession(page);await cdp.send('Input.synthesizeScrollGesture',{x:195,y:650,yDistance:-350,gestureSourceType:'touch',speed:600});await settled(page);assert.ok(await page.evaluate(()=>scrollY)>before);await cdp.detach();await shot(page,item,'after-touch-gesture');
    });
  },{recordVideo:true});
}
async function riskMatrix(browser,batch,viewports) {
  for(const viewport of viewports)await withSession(browser,viewport,async({page})=>{
    await record(`${batch}.${viewport.join('x')}`,page,async item=>{
      await open(page);const layouts=[];layouts.push(await auditLayout(page,'#ch-01'));await shot(page,item,'hero');
      await goChapter(page,6);layouts.push(await auditLayout(page,'#ch-06'));await shot(page,item,'long-heading');
      await checkpoint(page,6,2);layouts.push(await auditLayout(page,'#tr-07-08'));await shot(page,item,'hard-midpoint');
      await goChapter(page,5);await page.locator('#ch-05 [data-action="carrier"][data-value="rail"]').click();assert.equal((await stateOf(page,5)).mode,'rail');layouts.push(await auditLayout(page,'#ch-05'));await shot(page,item,'carrier');
      await goChapter(page,11);layouts.push(await auditLayout(page,'#ch-11'));await page.locator('.journey-recap').scrollIntoViewIfNeeded();await shot(page,item,'ending');return {layouts};
    });
  });
}
async function interactions(browser) {
  await withSession(browser,[1440,900],async({page})=>{
    const ready=async()=>{if(!page.__cargoIdentityVerified)await open(page);};
    await record('interactions.identity',page,async item=>{await ready();await goChapter(page,1);await page.locator('#ch-01 [data-action="inspect"]').click();await page.locator('#ch-01 .inspection:not([hidden])').waitFor();for(const value of ['corners','doors','identity']){await page.locator(`#ch-01 [data-action="highlight"][data-value="${value}"]`).click();assert.equal(await page.locator(`#ch-01 [data-action="highlight"][data-value="${value}"]`).getAttribute('aria-pressed'),'true');}await shot(page,item,'identified');await page.locator('#ch-01 [data-action="reset-view"]').click();assert.equal((await stateOf(page,1)).doorsOpen,'0.000');await page.locator('#ch-01 [data-action="inspect"]').click();assert.equal(await page.locator('#ch-01 .inspection').isVisible(),false);});
    await record('interactions.packing',page,async item=>{await ready();await goChapter(page,2);for(const value of ['packed','empty','packed']){await page.locator(`#ch-02 [data-action="packing"][data-value="${value}"]`).click();assert.equal((await stateOf(page,2)).packed,String(value==='packed'));}await shot(page,item,'same-six-blocks');await page.locator('#ch-02 [data-value="empty"]').click();});
    await record('interactions.doors',page,async item=>{await ready();await goChapter(page,3);for(const value of ['open','closed']){await page.locator(`#ch-03 [data-action="doors"][data-value="${value}"]`).click();assert.equal((await stateOf(page,3)).doorsOpen,value==='open'?'1.000':'0.000');await shot(page,item,value);}assert.match(await page.locator('#ch-03 .interaction-result').innerText(),/Illustrative seal/u);});
    await record('interactions.road',page,async item=>{await ready();await goChapter(page,4);await page.locator('#ch-04 [data-action="inspect"]').click();await page.locator('#ch-04 [data-value="corners"]').click();assert.equal((await stateOf(page,4)).mode,'road');assert.match(await page.locator('#ch-04 .interaction-result').innerText(),/corner fittings/u);await shot(page,item,'connection');await page.locator('#ch-04 [data-action="reset-view"]').click();});
    await record('interactions.carrier',page,async item=>{await ready();await goChapter(page,5);for(const value of ['rail','road']){await page.locator(`#ch-05 [data-action="carrier"][data-value="${value}"]`).click();const state=await stateOf(page,5);assert.equal(state.mode,value);assert.equal(state.packed,'true');assert.equal(state.doorsOpen,'0.000');await page.locator('#ch-05 [data-action="compare-supports"]').click();assert.equal(await page.locator('#ch-05 [data-action="compare-supports"]').getAttribute('aria-pressed'),'true');await shot(page,item,value);}await page.locator('#ch-05 [data-action="reset-carrier"]').click();assert.equal((await stateOf(page,5)).mode,'road');});
    await record('interactions.locators',page,async item=>{await ready();for(const number of [6,7,9]){await goChapter(page,number);const id=`#ch-${String(number).padStart(2,'0')}`;await page.locator(`${id} [data-action="locate"]`).click();assert.equal(await page.locator(`${id} .photo-marker`).isVisible(),true);await shot(page,item,`box-${number}`);await page.locator(`${id} [data-action="locate"]`).click();assert.equal(await page.locator(`${id} .photo-marker`).isVisible(),false);}});
    await record('interactions.lift',page,async item=>{await ready();await goChapter(page,8);await page.locator('#ch-08 [data-action="inspect"]').click();const range=page.locator('#ch-08 input[type="range"]');await range.focus();await page.keyboard.press('Home');assert.equal((await stateOf(page,8)).liftContact,'false');assert.match(await page.locator('#ch-08 .interaction-result').innerText(),/grounded/u);await shot(page,item,'grounded');await page.keyboard.press('End');assert.equal((await stateOf(page,8)).liftContact,'true');await page.keyboard.press('ArrowLeft');assert.equal(await range.inputValue(),'99');await shot(page,item,'engaged');await page.locator('#ch-08 [data-action="reset-view"]').click();assert.equal(await range.inputValue(),'72');});
    await record('interactions.ports',page,async item=>{await ready();await goChapter(page,10);await page.locator('#ch-10 .primary-action').click();const panel=page.locator('#ch-10 .port-comparison');assert.equal(await panel.isVisible(),true);assert.match(await panel.innerText(),/Illustrative locations/u);assert.equal(await panel.locator('img').count(),2);await shot(page,item,'two-ports');await panel.getByRole('button',{name:'Close',exact:true}).click();assert.equal(await panel.isVisible(),false);});
    await record('interactions.ending',page,async item=>{await ready();await goChapter(page,11);for(const value of ['closed','open']){await page.locator(`#ch-11 [data-action="doors"][data-value="${value}"]`).click();assert.equal((await stateOf(page,11)).packed,'true');assert.equal((await stateOf(page,11)).doorsOpen,value==='open'?'1.000':'0.000');}await shot(page,item,'original-cargo');for(const target of ['ch-04','ch-06','ch-07','ch-09','ch-11']){await goChapter(page,11);await page.locator(`.journey-recap a[href="#${target}"]`).click();await settled(page);assert.equal(new URL(page.url()).hash,`#${target}`);}await page.locator('.journey-recap a[href="#ch-01"]').click();await settled(page);assert.equal(new URL(page.url()).hash,'#ch-01');});
    await record('interactions.sound',page,async item=>{await ready();await page.locator('#sound-toggle').click();await page.locator('.toast.visible').waitFor();assert.equal(await page.locator('.toast').innerText(),'Audio is unavailable in this version.');await shot(page,item,'audio-unavailable');});
  });
}
async function reduced(browser) {
  await withSession(browser,[390,844],async({page})=>{await record('reduced.os',page,async item=>{
    await open(page);assert.equal(await page.locator('html').getAttribute('data-motion'),'reduced');
    for(const chapter of chapters){await goChapter(page,chapter.number);assert.ok(await page.locator(`#${chapter.id} .chapter-reading`).count());}
    for(let index=0;index<10;index++)for(const stage of [0,1,2,3,4]){await page.locator(`[data-transition-stage="${index}:${stage}"]`).click();await page.locator(`#${transitions[index].id} .handoff-hold`).scrollIntoViewIfNeeded();await settled(page);assert.equal(await page.locator(`[data-transition-stage="${index}:${stage}"]`).getAttribute('aria-pressed'),'true');if(stage===2)await shot(page,item,`${transitions[index].id}-still-midpoint`);}
    await goChapter(page,2);await page.locator('#ch-02 [data-value="packed"]').click();assert.equal((await stateOf(page,2)).packed,'true');await goChapter(page,5);await page.locator('#ch-05 [data-value="rail"]').click();assert.equal((await stateOf(page,5)).mode,'rail');await goChapter(page,11);await page.locator('#ch-11 [data-value="closed"]').click();assert.equal((await stateOf(page,11)).doorsOpen,'0.000');await page.locator('#ch-11 [data-value="open"]').click();await shot(page,item,'full-ending');
  });},{reducedMotion:'reduce'});
  await withSession(browser,[1440,900],async({page})=>{await record('reduced.ui',page,async item=>{await open(page);await page.locator('#motion-toggle').click();assert.equal(await page.locator('html').getAttribute('data-motion'),'reduced');await page.reload();await page.locator('html[data-ready="true"]').waitFor();assert.equal(await page.locator('html').getAttribute('data-motion'),'reduced');await page.locator('#motion-toggle').click();assert.equal(await page.locator('html').getAttribute('data-motion'),'full');await page.locator('.chapter-menu-button').click();await page.locator('#stills-toggle').click();assert.equal(await page.locator('html').getAttribute('data-motion'),'reduced');assert.equal(await page.locator('#chapters-dialog').evaluate(el=>el.open),false);await shot(page,item,'stills-setting');});});
}
async function recovery(browser) {
  for(const mobile of [false,true])await withSession(browser,mobile?[390,844]:[1440,900],async({page,context})=>{
    const id=`recovery.${mobile?'mobile-picture-retry':'desktop-image-retry'}`;
    await record(id,page,async item=>{
      let fail=true;const requests=[];const filename=mobile?'hero-mobile.webp':'hero.webp';
      await context.route(new RegExp(`/media/${filename.replace('.', '\\.')}([?].*)?$`,'u'),route=>{requests.push(route.request().url());return fail?route.abort('failed'):route.fallback();});
      await open(page);await page.locator('.hero-photograph.asset-failed .scene-fallback:not([hidden])').waitFor();await shot(page,item,'fallback');const before=requests.length;fail=false;
      await page.locator('.hero-photograph .retry-image').click();await page.waitForFunction(()=>{const image=document.querySelector('.hero-photograph img');return image?.complete&&image.naturalWidth>0&&!image.closest('.asset-failed');});
      assert.ok(requests.length>before,'Retry must issue a new request for the actually selected responsive source');const currentSrc=await page.locator('.hero-photograph img').evaluate(img=>img.currentSrc);assert.ok(currentSrc.includes(filename));await shot(page,item,'recovered');return {requests,currentSrc};
    });
  });
  await withSession(browser,[390,844],async({page,context})=>{await record('recovery.target-asset-failures',page,async item=>{
    await context.route(/\/media\/(road|rail|yard|lift|sea|shore)\.webp(?:\?|$)/u,route=>route.abort('failed'));await open(page);
    for(const number of [4,6,7,8,9,10]){await goChapter(page,number);const id=`#ch-${String(number).padStart(2,'0')}`;await page.locator(`${id} .photograph.asset-failed`).waitFor();assert.equal(await page.locator(`${id} .scene-fallback .model-slot`).getAttribute('data-container-id'),'BOX-001');assert.ok((await page.locator(`${id} .chapter-reading`).innerText()).length>150);await shot(page,item,`fallback-${number}`);}
    for(let index=0;index<10;index++){await checkpoint(page,index,2);assert.equal(await page.locator(`#${transitions[index].id} .model-slot`).getAttribute('data-container-id'),'BOX-001');}
  });});
  await withSession(browser,[1440,900],async({page,context})=>{await record('recovery.slow-and-late-assets',page,async item=>{
    const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:120,downloadThroughput:350000,uploadThroughput:125000});
    let release;const gate=new Promise(resolve=>{release=resolve;});await context.route(/\/media\/rail\.webp(?:\?|$)/u,async route=>{await gate;try{await route.fallback();}catch{/* Closing a bounded test may cancel the pending request. */}});
    try{await open(page);await goChapter(page,6);await goChapter(page,9);await goChapter(page,11);release();await settled(page);assert.equal(await page.locator('html').getAttribute('data-active-chapter'),'11');assert.equal((await stateOf(page,11)).mode,'destination');await shot(page,item,'late-asset-does-not-replace-destination');return await performanceSnapshot(page);}finally{release();await cdp.detach();}
  });});
  await withSession(browser,[390,844],async({page,context})=>{await record('recovery.font-failure',page,async item=>{await context.route(/\.(woff2?|ttf)(?:\?|$)/u,route=>route.abort('failed'));await open(page);await auditLayout(page,'#ch-01');await shot(page,item,'fallback-font-hero');await goChapter(page,6);await auditLayout(page,'#ch-06');await shot(page,item,'fallback-font-long-title');await checkpoint(page,6,2);await auditLayout(page,'#tr-07-08');await shot(page,item,'fallback-font-midpoint');});});
  await withSession(browser,[390,844],async({page,context})=>{await record('recovery.no-webgl',page,async item=>{
    await context.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){if(['webgl','webgl2','experimental-webgl'].includes(kind))return null;return original.call(this,kind,...args);};});await open(page);
    for(const number of [2,5,8,11]){await goChapter(page,number);if(number===8)await page.locator('#ch-08 [data-action="inspect"]').click();await page.waitForFunction(()=>document.querySelector('.shared-model')?.dataset.containerRenderer==='svg');await shot(page,item,`svg-${number}`);}
    await page.locator('#ch-11 [data-value="closed"]').click();assert.equal((await stateOf(page,11)).doorsOpen,'0.000');await page.locator('#ch-11 [data-value="open"]').click();assert.equal((await stateOf(page,11)).packed,'true');
  });});
  await withSession(browser,[1440,900],async({page})=>{await record('recovery.webgl-loss',page,async item=>{
    await open(page);await goChapter(page,2);try{await page.locator('.shared-model[data-container-renderer="webgl"]').waitFor({timeout:6000});}catch{throw new Blocked('This browser did not provide a working WebGL renderer. The separate no-WebGL test covers its SVG alternative; genuine context loss remains untested.');}
    const available=await page.evaluate(()=>{const canvas=document.querySelector('.shared-model canvas');const gl=canvas?.getContext('webgl2')??canvas?.getContext('webgl');const extension=gl?.getExtension('WEBGL_lose_context');if(!extension)return false;window.__cargoQaLostContext=extension;extension.loseContext();return true;});if(!available)throw new Blocked('WEBGL_lose_context is unavailable; no synthetic event is substituted for real context loss.');
    await page.locator('.shared-model[data-container-renderer="svg"]').waitFor();await page.locator('#ch-02 [data-value="packed"]').click();assert.equal((await stateOf(page,2)).packed,'true');await shot(page,item,'context-lost-current-state');await goChapter(page,11);assert.equal((await stateOf(page,11)).mode,'destination');await page.evaluate(()=>window.__cargoQaLostContext.restoreContext());await settled(page);await shot(page,item,'after-restore');
  });});
  await withSession(browser,[1440,900],async({page,context})=>{await record('recovery.resize-and-restore',page,async item=>{
    await open(page);await goChapter(page,8);await page.setViewportSize({width:390,height:844});await settled(page);await goChapter(page,8);await auditLayout(page,'#ch-08');await shot(page,item,'portrait-resize');await page.setViewportSize({width:844,height:390});await settled(page);await goChapter(page,11);await auditLayout(page,'#ch-11');await shot(page,item,'landscape');
    const other=await context.newPage();await other.goto('about:blank');await other.bringToFront();await page.bringToFront();await other.close();await settled(page);const states=await page.evaluate(()=>window.__cargoQa.visibility);await shot(page,item,'foreground-restored');
    const observations={visibilityEvents:states,resizeAndOrientation:'PASS',backgroundObserved:states.some(state=>state.state==='hidden')};
    if(!observations.backgroundObserved){item.observations=observations;throw new Blocked('Resize and orientation checks completed, but headless focus did not produce a hidden visibility state; real background/resume remains untested.');}
    return observations;
  });});
  await withSession(browser,[1440,900],async({page})=>{await record('recovery.scrollbar',page,async item=>{
    await open(page);const geometry=await page.evaluate(()=>({width:innerWidth,viewport:innerHeight,scrollbar:innerWidth-document.documentElement.clientWidth}));if(geometry.scrollbar<4)throw new Blocked('The browser exposes no draggable native scrollbar width. Native scrollbar drag requires a headed/visible browser.');
    await page.mouse.move(geometry.width-geometry.scrollbar/2,18);await page.mouse.down();await page.mouse.move(geometry.width-geometry.scrollbar/2,geometry.viewport*.62,{steps:12});await page.mouse.up();await settled(page);assert.ok(await page.evaluate(()=>scrollY)>1000);await shot(page,item,'native-scrollbar-drag');
  });});
}
async function zoom(browser) {
  for(const factor of [1.25,1.5,2])await withSession(browser,[1440,900],async({page})=>{await record(`zoom.${factor}`,page,async item=>{
    await open(page);const modifier=process.platform==='darwin'?'Meta':'Control';await page.keyboard.press(`${modifier}+0`);const before=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,scale:visualViewport?.scale??1}));
    for(let step=0;step<({1.25:2,1.5:3,2:5}[factor]);step++)await page.keyboard.press(`${modifier}+Equal`);await settled(page);const after=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,scale:visualViewport?.scale??1}));
    const actual=before.width/after.width;if(Math.abs(actual-factor)>.08||Math.abs(after.scale-before.scale)>.02)throw new Blocked(`Real browser zoom was not established (requested ${factor}, observed layout ratio ${actual.toFixed(3)}). Use browser UI manually; CSS/pinch scaling is not substituted.`);
    await auditLayout(page,'#ch-01');await shot(page,item,'zoomed-hero');await goChapter(page,6);await auditLayout(page,'#ch-06');await shot(page,item,'zoomed-long-heading');return {before,after,actual};
  });});
}

await mkdir(path.join(OUT,'screenshots'),{recursive:true});
await mkdir(path.join(OUT,'videos'),{recursive:true});
let browser;
try {
  let chromium;
  try { ({chromium}=await import('@playwright/test')); }
  catch(error){throw new Blocked(`Playwright dependency is unavailable: ${error.message}. Install the lockfile dependencies before this runner.`);}
  const launch={headless:!flags.headed};
  if(process.env.CARGO_BROWSER_EXECUTABLE)launch.executablePath=process.env.CARGO_BROWSER_EXECUTABLE;
  else if(process.env.CARGO_BROWSER_CHANNEL)launch.channel=process.env.CARGO_BROWSER_CHANNEL;
  try { browser=await chromium.launch(launch); }
  catch(error){throw new Blocked(`No usable Chromium browser could launch: ${error.message}. No browser installation was attempted.`);}
  report.environment.browser=browser.version();
  for(const batch of selected){
    if(Date.now()-started>budgetMs)break;
    try {
      if(batch==='smoke')await smoke(browser);
      if(batch==='desktop'||batch==='mobile')await fullPath(browser,batch);
      if(batch==='viewports')await riskMatrix(browser,batch,VIEWPORTS);
      if(batch==='breakpoints')await riskMatrix(browser,batch,BREAKPOINTS);
      if(batch==='interactions')await interactions(browser);
      if(batch==='reduced')await reduced(browser);
      if(batch==='recovery')await recovery(browser);
      if(batch==='zoom')await zoom(browser);
    }catch(error){report.blockers.push({batch,message:error.message});for(const item of planned.filter(item=>item.batch===batch&&item.status==='NOT TESTED')){item.status='BLOCKED';item.reason=error.message;}await persist();}
  }
} catch(error) {
  report.blockers.push({message:error.message});
  for(const item of planned.filter(item=>selected.includes(item.batch)&&item.status==='NOT TESTED')){item.status='BLOCKED';item.reason=error.message;}
} finally {
  await browser?.close().catch(error=>report.blockers.push({message:`Browser cleanup: ${error.message}`}));
  const cases=planned.filter(item=>selected.includes(item.batch));
  report.automatedStatus=cases.some(item=>item.status==='FAIL')?'FAIL':cases.some(item=>item.status==='BLOCKED')?'BLOCKED':cases.some(item=>item.status==='NOT TESTED')?'NOT TESTED':'PASS';
  report.finishedAt=new Date().toISOString();report.durationMs=Date.now()-started;
  await persist();
  const rows=cases.map(item=>`| ${item.id} | ${item.status} | ${(item.reason??'').replaceAll('|','/').replaceAll('\n',' ')} |`).join('\n');
  await writeFile(path.join(OUT,'summary.md'),`# CARGO browser execution\n\nAutomated batch status: **${report.automatedStatus}**. Independent visual acceptance: **NOT TESTED**.\n\nStarted: ${report.startedAt}. Finished: ${report.finishedAt}.\n\nSelected batches: ${selected.join(', ')}.\n\n| Case | Actual status | Notes |\n| --- | --- | --- |\n${rows}\n\nReview report.json, the referenced screenshots and context videos before assigning visual acceptance. Unselected cases remain NOT TESTED.\n`);
  console.log(JSON.stringify({status:report.automatedStatus,visualAcceptance:report.visualAcceptance,report:path.join(OUT,'report.json'),counts:report.counts}));
  process.exitCode=report.automatedStatus==='PASS'?0:report.automatedStatus==='FAIL'?1:2;
}
