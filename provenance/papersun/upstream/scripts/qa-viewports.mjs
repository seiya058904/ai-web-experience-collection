#!/usr/bin/env node
/** Real-browser CSS viewport evidence. Run after npm run build.
 * Optional launch overrides, shared with qa-browser.mjs:
 * PAPERSUN_BROWSER_PATH; PAPERSUN_BROWSER_ARGS='["--flag"]';
 * PAPERSUN_BROWSER_ENV='{"NAME":"value"}'. No application APIs are used.
 */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const playwrightVersion = require('playwright/package.json').version;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidence = path.join(root, 'docs/evidence');
const evidenceLabel = (process.env.PAPERSUN_QA_LABEL || 'local').replace(/[^a-zA-Z0-9_-]/g, '-');
const origin = 'http://127.0.0.1:4191';
const reportPath = path.join(evidence, `${evidenceLabel}-viewport-results.json`);
const launchedAt = new Date().toISOString();
const parse = (name, fallback) => process.env[name] ? JSON.parse(process.env[name]) : fallback;
const browserArgs = parse('PAPERSUN_BROWSER_ARGS', []);
const browserEnv = parse('PAPERSUN_BROWSER_ENV', {});
if (!Array.isArray(browserArgs) || !browserArgs.every(x => typeof x === 'string')) throw new Error('PAPERSUN_BROWSER_ARGS must be a JSON array of strings.');
if (!browserEnv || Array.isArray(browserEnv) || typeof browserEnv !== 'object' || !Object.values(browserEnv).every(x => typeof x === 'string')) throw new Error('PAPERSUN_BROWSER_ENV must be a JSON object of strings.');
if (!existsSync(path.join(root, 'dist/index.html'))) throw new Error('Build first with npm run build.');
const readBuild = () => {
  const html = readFileSync(path.join(root, 'dist/index.html'), 'utf8');
  return { indexSha256: createHash('sha256').update(html).digest('hex'), assetReferences: [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(match => match[1]) };
};

const states = [
  { id: 'hero', hash: '#ch-01', chapter: 1 },
  { id: 'long-heading', hash: '#ch-04', chapter: 4 },
  { id: 'midpoint', hash: '#tr-08-09@50', chapter: 9 },
  { id: 'assembly', hash: '#ch-09', chapter: 9 },
  { id: 'ending', hash: '#ch-11', chapter: 11 },
];
const viewports = [
  [320, 700], [360, 640], [390, 844], [768, 1024], [1440, 900],
  [1920, 1080], [2560, 1440], [3840, 2160],
  [699, 900], [700, 900], [701, 900], [1100, 900], [1101, 900],
  [1899, 1080], [1900, 1080], [2799, 1440], [2800, 1440], [844, 390],
].map(([width, height]) => ({ id: `${width}x${height}`, width, height, zoom: 1, fallbackFont: false, states }));
const critical = states.filter(s => ['hero', 'assembly', 'ending'].includes(s.id));
const scenarios = [
  ...viewports,
  ...[1.25, 1.5, 2].map(zoom => ({ id: `1440x900-csszoom${zoom * 100}`, width: 1440, height: 900, zoom, fallbackFont: false, states: critical })),
  { id: '1440x900-fallbackfont', width: 1440, height: 900, zoom: 1, fallbackFont: true, states: critical },
  { id: '390x844-sunrise', width: 390, height: 844, zoom: 1, fallbackFont: false, states: [{ id: 'sunrise', hash: '#ch-10', chapter: 10 }] },
  { id: '1440x900-cold-ch04', width: 1440, height: 900, zoom: 1, fallbackFont: false, coldStart: '#ch-04', states: [{ id: 'cold-ch04', hash: '#ch-04', chapter: 4 }] },
];
// Optional focused rerun; omitted means the complete requested matrix.
const filters = process.env.PAPERSUN_VP_FILTER?.split(',').map(value => value.trim()).filter(Boolean);
const stateFilters = process.env.PAPERSUN_VP_STATES?.split(',').map(value => value.trim()).filter(Boolean);
const selected = (filters?.length ? scenarios.filter(s => filters.some(filter => filter.startsWith('=') ? s.id === filter.slice(1) : s.id.includes(filter))) : scenarios)
  .map(scenario => ({ ...scenario, states: stateFilters?.length ? scenario.states.filter(state => stateFilters.includes(state.id)) : scenario.states }))
  .filter(scenario => scenario.states.length);
if (!selected.length) throw new Error('PAPERSUN_VP_FILTER selected no scenarios.');
const report = {
  schema: 1, evidenceLabel, startedAt: launchedAt, finishedAt: null, origin, buildAtStart: readBuild(),
  scope: 'Actual Chromium browser, CSS viewports, normal hash navigation, DOM scroll and visible button clicks. No global application object or private application API.',
  disclaimers: [
    '3840x2160 is a CSS viewport at deviceScaleFactor1, not a verified physical 4K monitor.',
    'CSS content zoom changes document CSS zoom. It is NOT browser UI zoom.',
    'All contexts use isMobile:false and hasTouch:false. Narrow viewport coverage does not establish touch-device coverage.',
    'Footer intersections and partially clipped art are REVIEW indicators; long text may naturally continue below the viewport.',
    'Object visibility measurements are geometric; they do not fully evaluate SVG masks, ancestor clip paths or artistic readability.',
    'This script records real samples and layout evidence; it does not invent performance scores or claim human visual acceptance.',
  ],
  runtime: { playwrightVersion, pinnedPlaywrightVersion: '1.62.1', browserVersion: null, executableOverride: process.env.PAPERSUN_BROWSER_PATH || null, launchArgs: browserArgs, browserEnvironmentKeys: Object.keys(browserEnv), node: process.version, host: process.platform, deviceScaleFactor: 1, launchRetries: [] },
  requestedScenarios: selected.map(({ states: entries, ...s }) => ({ ...s, states: entries.map(x => x.id) })),
  profiles: [], cases: [], errors: [], summary: null,
};
let browser;
let server;
let serverLog = '';
const persist = async () => writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
const twoFrames = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

async function launchBrowser(scenario) {
  const options = { headless: true, ...(process.env.PAPERSUN_BROWSER_PATH ? { executablePath: process.env.PAPERSUN_BROWSER_PATH } : {}), args: browserArgs, env: { ...process.env, ...browserEnv } };
  try { return await chromium.launch(options); }
  catch (error) {
    // Preserve a real startup failure, then allow one new process. A launch
    // retry must not be reported as an application interaction failure.
    report.runtime.launchRetries.push({ scenario: scenario.id, at: new Date().toISOString(), error: String(error?.stack || error) });
    await new Promise(resolve => setTimeout(resolve, 250));
    return chromium.launch(options);
  }
}

async function startServer() {
  server = spawn(process.execPath, ['scripts/serve.mjs'], { cwd: root, env: { ...process.env, HOST: '127.0.0.1', PORT: '4191' }, stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Owned server did not start: ${serverLog}`)), 5000);
    server.once('error', error => { clearTimeout(timeout); reject(error); });
    server.once('exit', code => { clearTimeout(timeout); reject(new Error(`Owned server exited (${code}): ${serverLog}`)); });
    server.stdout.on('data', chunk => { serverLog = (serverLog + chunk).slice(-4000); if (serverLog.includes('production preview:')) { clearTimeout(timeout); resolve(); } });
    server.stderr.on('data', chunk => { serverLog = (serverLog + chunk).slice(-4000); });
  });
}

async function settle(page) {
  await twoFrames(page);
  let artReady = true;
  try {
    await page.waitForFunction(() => {
      const scenes = [...document.querySelectorAll('#scene-from,#scene-to')];
      return scenes.length === 2 && scenes.every(scene => {
        const image = scene.querySelector('.scene-image');
        return scene.dataset.ready === 'true' && image?.complete && image.naturalWidth > 0;
      });
    }, null, { timeout: 2000, polling: 'raf' });
  } catch { artReady = false; }
  await twoFrames(page);
  return artReady;
}

async function navigate(page, hash) {
  await page.evaluate(value => {
    if (location.hash !== value) location.hash = value;
    else if (/^#ch-\d\d$/.test(value)) {
      const chapter = document.querySelector(value);
      if (chapter) scrollTo({ top: chapter.getBoundingClientRect().top + scrollY, behavior: 'instant' });
    }
  }, hash);
  return settle(page);
}

async function measure(page, scenario, state) {
  return page.evaluate(({ scenario, state }) => {
    const round = n => Math.round(n * 100) / 100;
    const rect = element => {
      if (!element) return null;
      const r = element.getBoundingClientRect();
      return { left: round(r.left), top: round(r.top), right: round(r.right), bottom: round(r.bottom), width: round(r.width), height: round(r.height) };
    };
    const shown = element => {
      for (let node = element; node && node instanceof Element; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) < .01) return false;
      }
      return true;
    };
    const intersect = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    const viewport = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
    const chapter = document.querySelector(`#ch-${String(state.chapter).padStart(2, '0')}`);
    const heading = state.id === 'hero' ? chapter?.querySelector('h1') : chapter?.querySelector('h2');
    const copy = state.id === 'hero' ? chapter?.querySelector('.hero-reading') : chapter?.querySelector('.reading-copy');
    const body = [...(copy?.querySelectorAll('p') || [])];
    const textMeasure = el => {
      const range = document.createRange(); range.selectNodeContents(el);
      const boxes = [...range.getClientRects()].filter(r => r.width > 0 && r.height > 0);
      const r = rect(el);
      const visible = shown(el) && intersect(r, viewport) > 0;
      const outside = boxes.filter(b => b.left < -.75 || b.right > innerWidth + .75);
      return { tag: el.tagName, className: el.className, text: el.textContent.trim(), box: r, visible, fontFamily: getComputedStyle(el).fontFamily, fontSize: getComputedStyle(el).fontSize, lineHeight: getComputedStyle(el).lineHeight, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, horizontalOverflow: outside.length > 0 || el.scrollWidth > el.clientWidth + 1, outsideTextRects: outside.map(b => ({ left: round(b.left), right: round(b.right), top: round(b.top), bottom: round(b.bottom) })) };
    };
    const h = heading ? textMeasure(heading) : null;
    const paragraphs = body.map(textMeasure);
    const overlap = h?.visible ? paragraphs.filter(p => p.visible && intersect(h.box, p.box) > 1).map(p => p.text) : [];
    const footer = document.querySelector('.experience-toolbar');
    const footerBox = rect(footer);
    const headerBox = rect(document.querySelector('.site-header'));
    const footerIntersections = [h, ...paragraphs].filter(t => t?.visible && footerBox && intersect(t.box, footerBox) > 1).map(t => t.text);
    const objects = [...document.querySelectorAll('#journey-sun,.scene-props .mira-stage-position,.scene-props .quest-note,.scene-props .wind-wheel,.scene-props .valley-reveal,.scene-props .market-repair-result,.scene-props .carried-pieces,.scene-props .repair-target')].map(el => {
      const box = rect(el);
      // The sun SVG has fourteen percent transparent viewBox padding. Its
      // exact circular outline, not that padding, determines visible fit.
      const geometryBox = rect(el.id === 'journey-sun' ? el.querySelector(':scope > svg > circle') || el : el);
      const area = geometryBox.width * geometryBox.height;
      const fixedControlOverlap = [headerBox, footerBox].filter(Boolean).reduce((sum, controls) => sum + intersect(geometryBox, controls), 0);
      return { selector: el.id ? `#${el.id}` : `.${el.classList[0]}`, scene: el.closest('.scene')?.id || null, shown: shown(el), box, geometryBox, viewportAreaRatio: area > 0 ? round(intersect(geometryBox, viewport) / area) : 0, fixedControlOverlapArea: round(fixedControlOverlap), placed: el.dataset.placed || null };
    });
    const footControls = [...(footer?.querySelectorAll('button,#chapter-count') || [])].map(el => ({ text: el.textContent.trim(), box: rect(el), shown: shown(el) }));
    const visibleTextOverflow = [h, ...paragraphs].filter(t => t?.visible && t.horizontalOverflow).map(t => t.text);
    return {
      requested: { width: scenario.width, height: scenario.height, cssZoom: scenario.zoom, fallbackFont: scenario.fallbackFont },
      actual: { innerWidth, innerHeight, devicePixelRatio, visualViewport: window.visualViewport ? { width: round(visualViewport.width), height: round(visualViewport.height), scale: visualViewport.scale, offsetLeft: visualViewport.offsetLeft, offsetTop: visualViewport.offsetTop } : null, documentClientWidth: document.documentElement.clientWidth, documentScrollWidth: document.documentElement.scrollWidth, documentScrollHeight: document.documentElement.scrollHeight, cssZoom: getComputedStyle(document.documentElement).zoom, scrollX, scrollY, locationHash: location.hash, activeChapter: document.documentElement.dataset.activeChapter, transition: document.documentElement.dataset.transition, motion: document.documentElement.dataset.motion, maxTouchPoints: navigator.maxTouchPoints, pointerCoarse: matchMedia('(pointer:coarse)').matches },
      heading: h, paragraphs, objects,
      assemblyButtons: [...document.querySelectorAll('#ch-09 [data-action="place"]')].map(el => ({ piece: el.dataset.piece, pressed: el.getAttribute('aria-pressed'), text: el.textContent.trim() })),
      images: [...document.querySelectorAll('#scene-from .scene-image,#scene-to .scene-image')].map(el => ({ source: el.currentSrc, complete: el.complete, naturalWidth: el.naturalWidth, naturalHeight: el.naturalHeight, scene: el.closest('.scene')?.dataset.scene, ready: el.closest('.scene')?.dataset.ready })),
      checks: { documentHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, visibleTextOverflow, headingBodyOverlap: overlap, chapterMatchesRequested: Number(document.documentElement.dataset.activeChapter) === state.chapter, criticalSunVisible: ['assembly', 'ending', 'sunrise'].includes(state.id) ? objects.some(o => o.selector === '#journey-sun' && o.shown && o.viewportAreaRatio >= .99 && o.fixedControlOverlapArea <= 1) : null, coldHashAtLanding: state.id === 'cold-ch04' ? Math.abs(scrollY - chapter.offsetTop) <= 1 : null, chapterOffsetTop: chapter?.offsetTop ?? null },
      reviewIndicators: { footerIntersections, footerControls: footControls, partiallyVisibleObjects: objects.filter(o => o.shown && o.viewportAreaRatio > 0 && o.viewportAreaRatio < .98).map(o => ({ selector: o.selector, scene: o.scene, ratio: o.viewportAreaRatio })), textObjectIntersections: [h, ...paragraphs].filter(t => t?.visible).flatMap(t => objects.filter(o => o.shown && o.viewportAreaRatio > 0 && intersect(t.box, o.box) > 1).map(o => ({ text: t.text, object: o.selector, scene: o.scene, area: round(intersect(t.box, o.box)) }))), bodyBelowViewport: paragraphs.filter(p => p.box.top >= innerHeight).map(p => p.text), note: 'Indicators require visual/reachability review. They do not automatically fail an entire case.' },
    };
  }, { scenario: { width: scenario.width, height: scenario.height, zoom: scenario.zoom, fallbackFont: scenario.fallbackFont }, state });
}

try {
  await mkdir(evidence, { recursive: true });
  await startServer();
  for (const scenario of selected) {
    // A fresh process also supports serverless --single-process Chromium,
    // which cannot reliably create another incognito context after closing one.
    browser = await launchBrowser(scenario);
    report.runtime.browserVersion = browser.version();
    const context = await browser.newContext({ viewport: { width: scenario.width, height: scenario.height }, deviceScaleFactor: 1, isMobile: false, hasTouch: false, locale: 'en-US', timezoneId: 'UTC', reducedMotion: 'no-preference' });
    const page = await context.newPage();
    page.setDefaultTimeout(2000);
    const errors = [];
    page.on('pageerror', error => errors.push({ type: 'pageerror', message: error.message }));
    page.on('console', msg => { if (msg.type() === 'error') errors.push({ type: 'console', message: msg.text() }); });
    try {
      await page.goto(`${origin}/${scenario.coldStart || '#ch-01'}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.locator('#title-ch-01').waitFor({ timeout: 5000 });
      await page.waitForFunction(() => document.fonts.status === 'loaded', null, { timeout: 2000 });
      await page.evaluate(() => document.fonts.ready);
      if (scenario.zoom !== 1 || scenario.fallbackFont) {
        await page.addStyleTag({ content: `html{zoom:${scenario.zoom}!important}${scenario.fallbackFont ? ':root{--display:Georgia,"Times New Roman",serif!important}h1,h2,h3,.hero-reading h1,.reading-copy h2,.end-note{font-family:Georgia,"Times New Roman",serif!important}' : ''}` });
        // Dispatching the ordinary resize event lets layout recalculate after a
        // deliberate test stylesheet; this is not a hidden navigation API.
        await page.evaluate(() => dispatchEvent(new Event('resize')));
      }
      report.profiles.push({ scenario: scenario.id, ...(await page.evaluate(() => ({ userAgent: navigator.userAgent, platform: navigator.platform, language: navigator.language, hardwareConcurrency: navigator.hardwareConcurrency, deviceMemory: navigator.deviceMemory ?? null, screen: { width: screen.width, height: screen.height, colorDepth: screen.colorDepth, pixelDepth: screen.pixelDepth }, maxTouchPoints: navigator.maxTouchPoints, devicePixelRatio, webDriver: navigator.webdriver, fontsStatus: document.fonts.status, displayFontLoaded: document.fonts.check('16px "Cormorant Garamond"'), fontFaces: [...document.fonts].map(font => ({ family: font.family, status: font.status })) }))) });
      for (const state of scenario.states) {
        const sample = { id: `${scenario.id}-${state.id}`, scenario: scenario.id, state: state.id, hash: state.hash, build: readBuild(), startedAt: new Date().toISOString(), status: 'pending', image: null, metrics: null, errors: [] };
        const errorStart = errors.length;
        try {
          sample.artReady = state.id === 'cold-ch04' ? await settle(page) : await navigate(page, state.hash);
          if (state.id === 'assembly') {
            for (const piece of ['A', 'B', 'C']) {
              const control = page.locator(`#ch-09 button[data-action="place"][data-piece="${piece}"]`);
              if (await control.getAttribute('aria-pressed') !== 'true') await control.click();
              await twoFrames(page);
            }
            sample.artReady = (await navigate(page, '#ch-09')) && sample.artReady;
          }
          sample.metrics = await measure(page, scenario, state);
          const filename = `${evidenceLabel}-vp-${sample.id}.jpg`;
          await page.screenshot({ path: path.join(evidence, filename), type: 'jpeg', quality: 84, fullPage: false, timeout: 15000, scale: 'css' });
          sample.image = `docs/evidence/${filename}`;
          sample.errors = errors.slice(errorStart);
          const checks = sample.metrics.checks;
          sample.status = !sample.artReady || sample.errors.some(e => e.type === 'pageerror') ? 'FAIL' : checks.documentHorizontalOverflow || checks.visibleTextOverflow.length || checks.headingBodyOverlap.length ? 'LAYOUT_REVIEW' : 'PASS_MEASURED';
          if (!checks.chapterMatchesRequested || checks.criticalSunVisible === false || checks.coldHashAtLanding === false) {
            sample.status = 'FAIL';
            sample.errors.push({ type: 'scene-registration', message: `Requested chapter matches: ${checks.chapterMatchesRequested}; critical sun visible: ${checks.criticalSunVisible}; cold hash at landing: ${checks.coldHashAtLanding}. CSS zoom cases describe artificial CSS content zoom only, not browser UI zoom.` });
          }
          if (state.id === 'assembly' && sample.metrics.assemblyButtons.some(b => b.pressed !== 'true')) { sample.status = 'FAIL'; sample.errors.push({ type: 'interaction', message: 'Not all three assembly controls reached aria-pressed=true.' }); }
        } catch (error) { sample.status = 'FAIL'; sample.errors.push({ type: 'runner', message: String(error?.stack || error) }); }
        sample.finishedAt = new Date().toISOString();
        report.cases.push(sample);
        await writeFile(path.join(evidence, `${evidenceLabel}-vp-${sample.id}.json`), `${JSON.stringify(sample, null, 2)}\n`);
      }
      console.log(`${scenario.id}: ${report.cases.filter(c => c.scenario === scenario.id).map(c => `${c.state}=${c.status}`).join(', ')}`);
    } catch (error) { report.errors.push({ scenario: scenario.id, message: String(error?.stack || error) }); }
    finally { await context.close(); await browser.close(); browser = null; await persist(); }
  }
} catch (error) { report.errors.push({ scope: 'runner', message: String(error?.stack || error) }); }
finally {
  if (browser) await browser.close();
  if (server && server.exitCode === null) server.kill('SIGTERM');
  report.finishedAt = new Date().toISOString();
  report.summary = { scenarios: selected.length, expectedCases: selected.reduce((sum, s) => sum + s.states.length, 0), recordedCases: report.cases.length, measuredPasses: report.cases.filter(c => c.status === 'PASS_MEASURED').length, layoutReviews: report.cases.filter(c => c.status === 'LAYOUT_REVIEW').length, failures: report.cases.filter(c => c.status === 'FAIL').length, runnerErrors: report.errors.length, humanVisualReview: 'Not performed by this script.' };
  await persist();
  console.log(`Viewport evidence: ${reportPath}\n${JSON.stringify(report.summary)}`);
  if (report.summary.failures || report.errors.length || report.summary.recordedCases !== report.summary.expectedCases) process.exitCode = 1;
}
