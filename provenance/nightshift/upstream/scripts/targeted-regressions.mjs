import assert from 'node:assert/strict';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';
import { chromium } from 'playwright';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const recordPath = join(root, 'evidence/records/targeted-regressions.json');
const screenshotPath = join(root, 'evidence/screenshots/targeted-platform-4k-complete.png');
const port = Number(process.env.NIGHTSHIFT_TARGETED_PORT || 4326);
const results = [];
const started = Date.now();
const report = {
  startedAtUtc: new Date().toISOString(),
  purpose: 'Narrow regressions after the adaptive first-service arrival change. The complete earlier browser report remains separate.',
  buildScripts: (await readdir(join(root, 'dist/assets'))).filter(name => name.endsWith('.js')),
  conditions: { browser: '', headless: true, deviceScaleFactor: 1, network: 'Local production preview; no throttling except explicitly failed requests.', physicalDevice: false },
  results,
};

await mkdir(dirname(recordPath), { recursive: true });
await mkdir(dirname(screenshotPath), { recursive: true });
const server = await preview({ root, preview: { host: '127.0.0.1', port, strictPort: true } });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});
report.conditions.browser = await browser.version();

async function poll(read, accept, label, timeout = 8000) {
  const deadline = Date.now() + timeout;
  let value;
  do {
    value = await read();
    if (accept(value)) return value;
    await new Promise(resolve => setTimeout(resolve, 40));
  } while (Date.now() < deadline);
  throw new Error(`${label}: ${JSON.stringify(value)}`);
}

async function openPage(width, height, hash) {
  const context = await browser.newContext({
    viewport: { width, height }, deviceScaleFactor: 1,
    isMobile: width === 390, hasTouch: width === 390,
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${port}/#${hash}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('html[data-ready="true"]');
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.waitForLoadState('load');
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  return { context, page, errors };
}

async function snapshot(page) {
  return page.evaluate(() => {
    const stage = document.querySelector('#stage');
    const base = stage.querySelector('.stage-layer--base');
    const next = stage.querySelector('.stage-layer--next');
    return {
      y: scrollY, chapter: document.body.dataset.chapter,
      transition: document.body.dataset.transition,
      phase: stage.dataset.phase, progress: Number(stage.dataset.platformProgress),
      source: stage.dataset.source, target: stage.dataset.target,
      baseKey: base.dataset.key, nextKey: next.dataset.key,
      baseReady: Boolean(base.querySelector('img')?.naturalWidth),
      nextReady: Boolean(next.querySelector('img')?.naturalWidth),
      nextHidden: next.hidden, clip: next.style.clipPath,
    };
  });
}

async function seek(page, y) {
  const target = Math.round(y);
  await page.evaluate(value => window.scrollTo({ top: value, behavior: 'instant' }), target);
  await poll(() => page.evaluate(() => scrollY), value => Math.abs(value - target) < 2, `Native seek must settle at ${target}`);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  return snapshot(page);
}

async function run(name, action) {
  const before = Date.now();
  try {
    const evidence = await action();
    results.push({ name, status: 'PASS', durationMs: Date.now() - before, ...evidence });
    console.log(`PASS ${name}`);
  } catch (error) {
    results.push({ name, status: 'FAIL', durationMs: Date.now() - before, error: error instanceof Error ? error.message : String(error) });
    console.log(`FAIL ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

try {
  for (const [width, height] of [[1440, 900], [390, 844], [3840, 2160]]) {
    await run(`First-service arrival: first, midpoint, complete, reverse at ${width} x ${height}`, async () => {
      const { context, page, errors } = await openPage(width, height, 'ch-10');
      try {
        // A real chapter action takes ownership from the cold fragment bootstrap
        // before test-driven native seeks. Otherwise a still-pending load restore
        // can correctly restore the initial hash over a programmatic-only seek.
        await page.locator('.site-header [data-open-dialog="chapters"]').click();
        await page.locator('#dialog-chapters a[href="#ch-10"]').click();
        await poll(() => page.locator('#title-ch-10').evaluate(element => element === document.activeElement), Boolean, 'Chapter link must complete with heading focus');
        const first = await poll(() => snapshot(page), value => value.phase === 'platform-arrival' && value.progress === 0 && value.baseReady, 'Complete first-service first hold');
        assert.equal(first.source, 'platform-before');
        assert.equal(first.target, 'platform');
        assert.equal(first.nextHidden, true);
        const geometry = await page.evaluate(() => {
          const chapter = document.querySelector('#ch-10').getBoundingClientRect();
          const outgoing = document.querySelector('#tr-10-11').getBoundingClientRect();
          return { top: chapter.top + scrollY, chapterHeight: chapter.height, outgoingStart: outgoing.top + scrollY - innerHeight * .70 };
        });
        let low = geometry.top;
        let high = geometry.outgoingStart - 4;
        let middle;
        // Find the visible half-arrival without reproducing the app's duration formula.
        for (let probe = 0; probe < 15; probe++) {
          middle = await seek(page, (low + high) / 2);
          assert.equal(middle.transition, '');
          assert.equal(middle.phase, 'platform-arrival');
          if (Math.abs(middle.progress - .5) < .003) break;
          if (middle.progress < .5) low = middle.y;
          else high = middle.y;
        }
        assert.ok(Math.abs(middle.progress - .5) < .006, `Midpoint was ${middle.progress}`);
        await poll(() => snapshot(page), value => value.baseReady && value.nextReady, 'Both authored platform images must load');
        const clipNumbers = middle.clip.match(/[\d.]+/g).map(Number);
        assert.ok(Math.abs(clipNumbers.at(-1) - 50) < 1, `Half-arrival clip was ${middle.clip}`);
        await page.waitForTimeout(220);
        const paused = await snapshot(page);
        assert.equal(paused.y, middle.y);
        assert.equal(paused.progress, middle.progress);
        assert.equal(paused.clip, middle.clip);
        const complete = await seek(page, geometry.outgoingStart - 4);
        assert.equal(complete.transition, '', 'Arrival must complete before the outgoing transition begins');
        assert.equal(complete.phase, 'platform-arrival');
        assert.equal(complete.progress, 1);
        assert.equal(complete.nextHidden, false);
        assert.equal(Number(complete.clip.match(/[\d.]+/g).at(-1)), 0);
        if (width === 3840) await page.screenshot({ path: screenshotPath });
        const reverse = await seek(page, middle.y);
        assert.equal(reverse.progress, middle.progress);
        assert.equal(reverse.clip, middle.clip);
        assert.equal(reverse.source, 'platform-before');
        assert.equal(reverse.target, 'platform');
        assert.deepEqual(errors, []);
        return { viewport: { width, height }, geometry, first, middle, paused, complete, reverse,
          ...(width === 3840 ? { screenshot: 'evidence/screenshots/targeted-platform-4k-complete.png' } : {}) };
      } finally { await context.close(); }
    });
  }

  await run('Expanded phone water diagram remeasures following chapter for native scrolling', async () => {
    const { context, page, errors } = await openPage(390, 844, 'ch-07');
    try {
      const nextTop = () => page.locator('#ch-08').evaluate(element => element.getBoundingClientRect().top + scrollY);
      const beforeTop = await nextTop();
      await page.locator('[data-water]').tap();
      await poll(() => page.locator('[data-water]').getAttribute('aria-expanded'), value => value === 'true', 'Water diagram opens');
      const expandedTop = await poll(nextTop, value => value > beforeTop + 40, 'Expanding the diagram must change the following geometry');
      await page.evaluate(() => document.querySelector('#ch-08').scrollIntoView({ block: 'start', behavior: 'instant' }));
      const following = await poll(() => snapshot(page), value => value.chapter === 'ch-08' && value.baseKey === 'utility' && !value.transition, 'Following chapter must own its scene after expansion');
      await page.evaluate(() => document.querySelector('#ch-07').scrollIntoView({ block: 'start', behavior: 'instant' }));
      await page.locator('[data-water]').tap();
      const collapsedTop = await poll(nextTop, value => Math.abs(value - beforeTop) < 2, 'Collapsing restores following geometry');
      await page.evaluate(() => document.querySelector('#ch-08').scrollIntoView({ block: 'start', behavior: 'instant' }));
      const collapsedFollowing = await poll(() => snapshot(page), value => value.chapter === 'ch-08' && value.baseKey === 'utility' && !value.transition, 'Following chapter must own its scene after collapse');
      assert.deepEqual(errors, []);
      return { viewport: { width: 390, height: 844 }, beforeTop, expandedTop, collapsedTop, following, collapsedFollowing };
    } finally { await context.close(); }
  });

  await run('Opening a modal cancels a large pending Lenis wheel movement and freezes background position', async () => {
    const { context, page, errors } = await openPage(1440, 900, 'ch-01');
    try {
      await page.mouse.wheel(0, 1600);
      await page.locator('.site-header [data-open-dialog="chapters"]').click();
      await page.waitForSelector('#dialog-chapters[open]');
      const samples = [await page.evaluate(() => scrollY)];
      for (let i = 0; i < 4; i++) {
        await page.waitForTimeout(80);
        samples.push(await page.evaluate(() => scrollY));
      }
      await page.mouse.move(12, 200);
      await page.mouse.wheel(0, 1000);
      await page.waitForTimeout(140);
      samples.push(await page.evaluate(() => scrollY));
      assert.ok(Math.max(...samples) - Math.min(...samples) <= 1, `Background moved while modal was open: ${samples}`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(140);
      const afterClose = await page.evaluate(() => scrollY);
      assert.ok(Math.abs(afterClose - samples[0]) <= 1, 'Closing must not resume the old wheel motion');
      assert.equal(await page.locator('.site-header [data-open-dialog="chapters"]').evaluate(element => element === document.activeElement), true);
      await page.mouse.wheel(0, 220);
      const resumedY = await poll(() => page.evaluate(() => scrollY), value => value > afterClose + 30, 'New wheel input must work after closing');
      assert.deepEqual(errors, []);
      return { viewport: { width: 1440, height: 900 }, samples, afterClose, resumedY };
    } finally { await context.close(); }
  });

  await run('Failed bakery variant and failed local still recover to Before without a lingering notice', async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const errors = [];
    const failures = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route(/\/media\/(?:fallback\/)?bakery-after\.webp$/, route => {
      failures.push(new URL(route.request().url()).pathname);
      return route.abort('failed');
    });
    try {
      await page.goto(`http://127.0.0.1:${port}/#ch-03`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('html[data-ready="true"]');
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      await page.locator('[data-bakery="after"]').tap();
      await poll(() => page.locator('#bakery-detail-image').evaluate(image => image.hidden), Boolean, 'The failed variant must not show an obsolete image');
      await poll(() => page.locator('.preparation-panel .media-notice').evaluateAll(nodes => nodes.filter(node => !node.hidden).length), value => value > 0, 'A real recoverable error must be visible');
      assert.ok(failures.includes('/media/bakery-after.webp'));
      assert.ok(failures.includes('/media/fallback/bakery-after.webp'));
      await page.locator('[data-bakery="before"]').tap();
      const recovered = await poll(() => page.locator('#bakery-detail-image').evaluate(image => ({ hidden: image.hidden, key: image.dataset.mediaKey, ready: image.complete && image.naturalWidth > 0, src: new URL(image.src).pathname })),
        value => !value.hidden && value.key === 'bakery-before' && value.ready, 'The Before variant must load again');
      await poll(() => page.locator('.media-notice').evaluateAll(nodes => nodes.filter(node => !node.hidden).length), value => value === 0, 'The previous error notice must clear');
      await poll(() => page.locator('#scene-status').evaluate(element => element.hidden), Boolean, 'The stage error must clear for the recovered variant');
      assert.equal(await page.locator('[data-bakery="before"]').getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('[data-bakery="after"]').getAttribute('aria-pressed'), 'false');
      assert.deepEqual(errors, []);
      return { viewport: { width: 390, height: 844 }, failedRequests: failures, recovered, visibleErrorNoticesAfterRecovery: 0 };
    } finally { await context.close(); }
  });
} finally {
  report.durationMs = Date.now() - started;
  report.summary = { passed: results.filter(item => item.status === 'PASS').length, failed: results.filter(item => item.status === 'FAIL').length };
  await writeFile(recordPath, JSON.stringify(report, null, 2) + '\n');
  await browser.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
if (report.summary.failed) process.exitCode = 1;
console.log(JSON.stringify({ report: 'evidence/records/targeted-regressions.json', ...report.summary, durationMs: report.durationMs }));
