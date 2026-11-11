import { chromium } from 'playwright';
import { preview } from 'vite';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.NIGHTSHIFT_PERFORMANCE_PORT || 4330);
const origin = `http://127.0.0.1:${port}/`;
const output = path.join(root, 'evidence/records/performance.json');
const round = value => Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
const percentile = (values, fraction) => values.length ? [...values].sort((a, b) => a - b)[Math.min(values.length - 1, Math.floor((values.length - 1) * fraction))] : null;
const fallbackReason = 'The Browser extension failed to navigate to the shared preview with net::ERR_HTTP_RESPONSE_CODE_FAILURE. The cloud browser initially returned NIGHTSHIFT content but subsequently displayed a different project on the shared preview port. This isolated Playwright fixture therefore serves Vite and Chromium inside the same Node process, as permitted by the build brief. The ordinary Chromium download was corrupt; this run may use an explicitly supplied Chromium executable instead.';

async function buildFingerprint() {
  const files = ['index.html'];
  for (const entry of await readdir(path.join(root, 'dist/assets'), { withFileTypes: true })) {
    if (entry.isFile() && /\.(js|css)$/.test(entry.name)) files.push(`assets/${entry.name}`);
  }
  const records = [];
  for (const file of files.sort()) {
    const bytes = await readFile(path.join(root, 'dist', file));
    records.push({ file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
  return records;
}

function installObservers() {
  const record = window.__nightshiftPerf = {
    supportedEntryTypes: PerformanceObserver.supportedEntryTypes,
    paints: [], lcp: [], shifts: [], longTasks: [], events: [],
    firstArt: null, fullHeroArt: null, observerErrors: [],
  };
  const observe = (type, consume, extra = {}) => {
    if (!PerformanceObserver.supportedEntryTypes.includes(type)) return;
    try {
      const observer = new PerformanceObserver(list => list.getEntries().forEach(consume));
      observer.observe({ type, buffered: true, ...extra });
    } catch (error) { record.observerErrors.push(`${type}: ${error.message}`); }
  };
  observe('paint', entry => record.paints.push({ name: entry.name, startTime: entry.startTime }));
  observe('largest-contentful-paint', entry => record.lcp.push({
    startTime: entry.startTime, renderTime: entry.renderTime, loadTime: entry.loadTime,
    size: entry.size, tag: entry.element?.tagName || null,
    elementId: entry.element?.id || null,
    url: entry.url ? new URL(entry.url, location.href).pathname : null,
  }));
  observe('layout-shift', entry => record.shifts.push({ startTime: entry.startTime, value: entry.value, hadRecentInput: entry.hadRecentInput }));
  observe('longtask', entry => record.longTasks.push({ startTime: entry.startTime, duration: entry.duration, name: entry.name }));
  observe('event', entry => record.events.push({ name: entry.name, startTime: entry.startTime, duration: entry.duration, processingStart: entry.processingStart, processingEnd: entry.processingEnd, interactionId: entry.interactionId }), { durationThreshold: 16 });

  const watched = new WeakSet();
  const decoding = new WeakSet();
  const twoFrames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  async function inspectImage(img) {
    if (!img.isConnected || !img.complete || !img.naturalWidth || decoding.has(img)) return;
    const url = img.currentSrc || img.src;
    if (!/\/hero(?:-mobile)?\.webp(?:\?|$)/.test(url)) return;
    decoding.add(img);
    try {
      await img.decode();
      if (!img.isConnected || (img.currentSrc || img.src) !== url) return;
      const decodedAtMs = performance.now();
      await twoFrames();
      if (!img.isConnected || (img.currentSrc || img.src) !== url) return;
      const item = {
        path: new URL(url, location.href).pathname,
        compactFallback: url.includes('/fallback/'),
        decodedAtMs,
        twoAnimationFramesAfterDecodeMs: performance.now(),
        intrinsicWidth: img.naturalWidth,
        intrinsicHeight: img.naturalHeight,
      };
      if (!record.firstArt) record.firstArt = item;
      if (!item.compactFallback && !record.fullHeroArt) record.fullHeroArt = item;
      if (record.firstArt && record.fullHeroArt) mutationObserver.disconnect();
    } catch (error) {
      record.observerErrors.push(`Hero decode: ${error.message}`);
    } finally { decoding.delete(img); }
  }
  const scan = () => {
    const img = document.querySelector('#stage .stage-layer--base img');
    if (!img) return;
    if (!watched.has(img)) {
      watched.add(img);
      img.addEventListener('load', () => { void inspectImage(img); });
    }
    void inspectImage(img);
  };
  const mutationObserver = new MutationObserver(scan);
  mutationObserver.observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcset'] });
  document.addEventListener('DOMContentLoaded', scan, { once: true });
  scan();
}

async function ready(page, timeout = 30000) {
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true', null, { timeout });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.querySelectorAll('#stage img')]
    .filter(img => !img.closest('[hidden]'))
    .every(img => img.complete && img.naturalWidth > 0), null, { timeout });
}

async function metricSnapshot(page) {
  return page.evaluate(() => {
    const data = window.__nightshiftPerf;
    const shifts = data.shifts.filter(entry => !entry.hadRecentInput);
    let cls = 0, totalShift = 0, windowValue = 0, windowStart = 0, previousTime = -Infinity;
    for (const entry of shifts) {
      totalShift += entry.value;
      if (entry.startTime - previousTime > 1000 || entry.startTime - windowStart > 5000) {
        windowStart = entry.startTime;
        windowValue = 0;
      }
      windowValue += entry.value;
      cls = Math.max(cls, windowValue);
      previousTime = entry.startTime;
    }
    const imageState = [...document.querySelectorAll('#stage img')]
      .filter(img => !img.closest('[hidden]'))
      .map(img => ({ path: new URL(img.currentSrc || img.src, location.href).pathname, complete: img.complete, naturalWidth: img.naturalWidth }));
    const resources = performance.getEntriesByType('resource').map(entry => ({
      path: new URL(entry.name, location.href).pathname,
      initiatorType: entry.initiatorType,
      startTime: entry.startTime,
      responseEnd: entry.responseEnd,
      duration: entry.duration,
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
      decodedBodySize: entry.decodedBodySize,
    }));
    return {
      observedUntilMs: performance.now(),
      navigation: performance.getEntriesByType('navigation')[0]?.toJSON(),
      firstPaintMs: data.paints.find(entry => entry.name === 'first-paint')?.startTime ?? null,
      firstContentfulPaintMs: data.paints.find(entry => entry.name === 'first-contentful-paint')?.startTime ?? null,
      firstArt: data.firstArt,
      fullHeroArt: data.fullHeroArt,
      applicationReadyMarkMs: performance.getEntriesByName('nightshift-interactive')[0]?.startTime ?? null,
      largestContentfulPaintCandidate: data.lcp.at(-1) || null,
      largestContentfulPaintCandidates: data.lcp,
      cumulativeLayoutShiftLargestSession: cls,
      totalUnexpectedLayoutShift: totalShift,
      layoutShifts: data.shifts,
      longTasks: data.longTasks,
      supportedEntryTypes: data.supportedEntryTypes,
      observerErrors: data.observerErrors,
      chapterCount: document.querySelectorAll('section[data-chapter]').length,
      allChapterPrimaryTextPresent: [...document.querySelectorAll('section[data-chapter]')].every(section => Boolean(section.querySelector('h2')?.textContent?.trim()) && Boolean(section.querySelector('p')?.textContent?.trim())),
      activeChapter: document.body.dataset.chapter,
      visibleStageImages: imageState,
      activeImagesComplete: imageState.length > 0 && imageState.every(img => img.complete && img.naturalWidth > 0),
      fontStatus: document.fonts.status,
      resources,
      totalTransferredBytes: resources.reduce((sum, entry) => sum + entry.transferSize, 0),
      totalEncodedResourceBytes: resources.reduce((sum, entry) => sum + entry.encodedBodySize, 0),
      environment: { userAgent: navigator.userAgent, platform: navigator.platform, reportedHardwareConcurrency: navigator.hardwareConcurrency, reportedDeviceMemoryGiB: navigator.deviceMemory ?? null, viewport: { width: innerWidth, height: innerHeight }, devicePixelRatio },
    };
  });
}

async function interactionProbe(page) {
  await page.evaluate(() => {
    window.__nightshiftInteractionProbe = null;
    document.addEventListener('click', function record(event) {
      if (!event.target.closest('[data-open-dialog="chapters"]')) return;
      document.removeEventListener('click', record, true);
      const began = performance.now();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.__nightshiftInteractionProbe = {
          eventToTwoAnimationFramesMs: performance.now() - began,
          chapterDialogOpen: Boolean(document.querySelector('#dialog-chapters[open]')),
        };
      }));
    }, true);
  });
  await page.locator('[data-open-dialog="chapters"]').first().click();
  await page.waitForFunction(() => window.__nightshiftInteractionProbe !== null);
  const result = await page.evaluate(() => ({ ...window.__nightshiftInteractionProbe, observedEventEntries: window.__nightshiftPerf.events }));
  await page.keyboard.press('Escape');
  return result;
}

const report = {
  status: 'IN PROGRESS',
  startedAt: new Date().toISOString(),
  method: 'Isolated local Vite production preview and headless Chromium in the same Node process.',
  browserFallbackReason: fallbackReason,
  environment: {
    browser: null,
    playwrightVersion: JSON.parse(await readFile(path.join(root, 'node_modules/playwright/package.json'), 'utf8')).version,
    host: `${process.platform} ${process.arch}; virtualized host hardware unknown`,
    node: process.version,
    viewport: { width: 1440, height: 900 },
    devicePixelRatio: 1,
    rendering: 'Headless Chromium launched with --disable-gpu; software-oriented test fixture, not physical-device evidence.',
    server: 'Loopback HTTP production preview; same-process launch; no external hosting or CDN.',
    compression: 'Response Content-Encoding and Resource Timing byte counts are recorded below; no compressed network proxy was configured.',
    coldRunDefinition: 'New browser context for each run, HTTP cache disabled through CDP; same browser process and local server, so this is not an operating-system cold start.',
  },
  caveats: [
    'First-art timestamps are image decode readiness followed by two animation-frame callbacks, not pixel-level proof of a completed display paint.',
    'The nightshift-interactive mark records application initialization, not a standardized Time to Interactive or INP measurement.',
    'LCP and CLS are laboratory observations within the recorded window, not field Core Web Vitals certification.',
    'The dialog probe records a trusted click to two subsequent animation frames and dialog state; it is not a complete INP assessment.',
    'The throttled run is one CDP network/CPU simulation, not a real mobile device or real 4G connection.',
    'Frame samples measure requestAnimationFrame callback intervals during scripted native scrolling; they are not GPU frame rates or a real-device FPS claim.',
    'The headless process may contend with other tasks on this shared host.',
    'Forced-GC JS heap samples omit image decode memory, browser/native allocations and GPU resources; three round trips cannot prove the absence of a leak.',
  ],
  buildBefore: await buildFingerprint(),
  coldUnthrottledRuns: [],
  simulatedSlow4G: null,
  railWaterFramePacing: null,
  roundTripMemory: null,
  errors: [],
};

let server;
let browser;

async function startupRun(label, throttle = false) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  const runtimeErrors = [];
  const encodings = new Set();
  page.on('pageerror', error => runtimeErrors.push(error.message));
  page.on('response', response => {
    const encoding = response.headers()['content-encoding'];
    encodings.add(encoding || 'identity (no Content-Encoding header)');
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (throttle) {
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750, connectionType: 'cellular4g' });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  }
  await page.addInitScript(installObservers);
  const began = Date.now();
  try {
    await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await ready(page, 90000);
    await page.waitForFunction(() => Boolean(window.__nightshiftPerf.fullHeroArt), null, { timeout: 90000 });
    await page.waitForTimeout(throttle ? 2000 : 1400);
    const snapshot = await metricSnapshot(page);
    const interaction = await interactionProbe(page);
    return {
      label,
      wallDurationMs: Date.now() - began,
      network: throttle ? { kind: 'Simulated slow 4G', addedLatencyMs: 150, downloadBitsPerSecond: 1600000, uploadBitsPerSecond: 750000, cpuSlowdownMultiplier: 4 } : { kind: 'Unthrottled loopback', cpuSlowdownMultiplier: 1 },
      responseContentEncodings: [...encodings],
      ...snapshot,
      interactionProbe: interaction,
      runtimeErrors,
    };
  } finally { await context.close(); }
}

async function heavyAndMemoryProbe() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(origin, { waitUntil: 'networkidle' });
    await ready(page);
    await page.evaluate(() => {
      const target = document.getElementById('ch-06');
      scrollTo(0, target.getBoundingClientRect().top + scrollY + 80);
    });
    await page.waitForTimeout(700);
    await ready(page);
    const pacing = await page.evaluate(async () => {
      const rect = document.getElementById('tr-06-07').getBoundingClientRect();
      const startY = rect.top + scrollY - innerHeight * .70;
      const endY = rect.bottom + scrollY - innerHeight * .12;
      scrollTo(0, startY);
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const samples = [];
      const checkpoints = [];
      const duration = 6000;
      let began = 0, previous = 0, lastCheckpoint = -1;
      await new Promise(resolve => {
        const step = now => {
          if (!began) { began = now; previous = now; }
          else { samples.push(now - previous); previous = now; }
          const elapsed = Math.min(now - began, duration);
          const leg = elapsed < duration / 2 ? 'forward' : 'reverse';
          const progress = leg === 'forward' ? elapsed / (duration / 2) : 1 - (elapsed - duration / 2) / (duration / 2);
          scrollTo(0, startY + (endY - startY) * progress);
          const checkpoint = Math.floor(elapsed / 750);
          if (checkpoint !== lastCheckpoint) {
            lastCheckpoint = checkpoint;
            checkpoints.push({ elapsedMs: elapsed, leg, requestedProgress: progress, scrollY, observedTransition: document.body.dataset.transition, observedProgress: document.body.dataset.transitionProgress, source: document.getElementById('stage')?.dataset.source, target: document.getElementById('stage')?.dataset.target });
          }
          if (elapsed >= duration) resolve();
          else requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
      return { transition: 'tr-06-07', requestedDurationMs: duration, measuredDurationMs: previous - began, startY, endY, intervalsMs: samples, checkpoints, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches, mode: document.body.dataset.motion };
    });
    report.railWaterFramePacing = {
      ...pacing,
      sampleCount: pacing.intervalsMs.length,
      p50IntervalMs: round(percentile(pacing.intervalsMs, .50)),
      p95IntervalMs: round(percentile(pacing.intervalsMs, .95)),
      maximumIntervalMs: round(Math.max(...pacing.intervalsMs)),
      longGapThresholdMs: 50,
      gapsOver50Ms: pacing.intervalsMs.filter(value => value > 50).length,
      gapsOver100Ms: pacing.intervalsMs.filter(value => value > 100).length,
    };

    const cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');
    let gcAvailable = true;
    try { await cdp.send('HeapProfiler.enable'); await cdp.send('HeapProfiler.collectGarbage'); }
    catch { gcAvailable = false; }
    async function roundTrip() {
      await page.evaluate(async () => {
        const targets = [...document.querySelectorAll('section[data-chapter]')].map(section => Math.max(0, section.getBoundingClientRect().top + scrollY + 80));
        for (const y of [...targets, ...targets.toReversed()]) {
          scrollTo(0, y);
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        }
        scrollTo(0, 0);
      });
      await page.waitForLoadState('networkidle');
      await ready(page);
    }
    async function memorySample(label) {
      if (gcAvailable) await cdp.send('HeapProfiler.collectGarbage');
      const raw = await cdp.send('Performance.getMetrics');
      const wanted = new Set(['JSHeapUsedSize', 'JSHeapTotalSize', 'Documents', 'Nodes', 'Frames', 'LayoutCount', 'RecalcStyleCount', 'TaskDuration', 'ScriptDuration']);
      const metrics = Object.fromEntries(raw.metrics.filter(metric => wanted.has(metric.name)).map(metric => [metric.name, metric.value]));
      let domCounters;
      try { domCounters = await cdp.send('Memory.getDOMCounters'); } catch { domCounters = null; }
      return { label, forcedGarbageCollection: gcAvailable, metrics, domCounters };
    }
    await roundTrip();
    const samples = [await memorySample('After one full warm-up round trip')];
    for (let i = 1; i <= 3; i++) {
      await roundTrip();
      samples.push(await memorySample(`After measured round trip ${i}`));
    }
    report.roundTripMemory = {
      warmupRoundTrips: 1,
      measuredRoundTrips: 3,
      traversal: 'All eleven chapter holds from top to bottom and back, using native scrollTo and two rAF callbacks per stop; network idle and active-image readiness before sampling.',
      garbageCollectionAvailable: gcAvailable,
      samples,
      jsHeapUsedDeltaBytes: samples.at(-1).metrics.JSHeapUsedSize - samples[0].metrics.JSHeapUsedSize,
      runtimeErrors: errors,
    };
  } finally { await context.close(); }
}

try {
  server = await preview({ root, preview: { host: '127.0.0.1', port, strictPort: true } });
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'], headless: true });
  report.environment.browser = browser.version();
  for (let i = 1; i <= 3; i++) {
    console.log(`Measuring fresh-context unthrottled run ${i}/3...`);
    report.coldUnthrottledRuns.push(await startupRun(`Cold context ${i}`));
  }
  console.log('Measuring one simulated slow-4G / 4x-CPU run...');
  report.simulatedSlow4G = await startupRun('One simulated slow-4G run', true);
  console.log('Sampling rail-to-water rAF pacing and three memory round trips...');
  await heavyAndMemoryProbe();
  report.buildAfter = await buildFingerprint();
  report.buildUnchangedDuringRun = JSON.stringify(report.buildBefore) === JSON.stringify(report.buildAfter);
  if (!report.buildUnchangedDuringRun) report.errors.push('The production build changed during measurement. Repeat this script against a stable build.');
  report.status = report.errors.length ? 'INCOMPLETE' : 'MEASURED';
  report.coldUnthrottledSummary = {
    runs: report.coldUnthrottledRuns.length,
    medianFirstContentfulPaintMs: round(percentile(report.coldUnthrottledRuns.map(run => run.firstContentfulPaintMs).filter(value => value !== null), .5)),
    medianFirstArtTwoRafMs: round(percentile(report.coldUnthrottledRuns.map(run => run.firstArt?.twoAnimationFramesAfterDecodeMs).filter(Number.isFinite), .5)),
    medianFullHeroTwoRafMs: round(percentile(report.coldUnthrottledRuns.map(run => run.fullHeroArt?.twoAnimationFramesAfterDecodeMs).filter(Number.isFinite), .5)),
    medianApplicationReadyMarkMs: round(percentile(report.coldUnthrottledRuns.map(run => run.applicationReadyMarkMs).filter(Number.isFinite), .5)),
    medianObservedLcpMs: round(percentile(report.coldUnthrottledRuns.map(run => run.largestContentfulPaintCandidate?.startTime).filter(Number.isFinite), .5)),
    maximumObservedCls: Math.max(...report.coldUnthrottledRuns.map(run => run.cumulativeLayoutShiftLargestSession)),
    longTaskCounts: report.coldUnthrottledRuns.map(run => run.longTasks.length),
  };
} catch (error) {
  report.status = 'INCOMPLETE';
  report.errors.push(error.stack || String(error));
  process.exitCode = 1;
} finally {
  report.finishedAt = new Date().toISOString();
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.httpServer.close(resolve));
  console.log(JSON.stringify({ status: report.status, output: 'evidence/records/performance.json', summary: report.coldUnthrottledSummary, errors: report.errors }, null, 2));
}
