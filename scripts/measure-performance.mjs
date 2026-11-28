import { createServer } from 'node:http';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { gzipSync } from 'node:zlib';
import { chromium } from '@playwright/test';

const [directory, output] = process.argv.slice(2);
if (!directory || !output) throw new Error('Usage: node scripts/measure-performance.mjs BUILD_DIR RESULT.json');

const root = resolve(directory);
const base = '/ai-web-experience-collection/';
const routes = ['', ...(await readdir(root, { withFileTypes: true }))
  .filter(entry => entry.isDirectory()).map(entry => entry.name + '/')
  .filter(route => !process.env.COLLECTION_PERF_ROUTES || process.env.COLLECTION_PERF_ROUTES.split(',').includes(route.slice(0, -1)))];
const pages = [];
for (const route of routes) {
  if (await stat(join(root, route, 'index.html')).catch(() => null)) pages.push(route);
}
if (!process.env.COLLECTION_PERF_ROUTES && await stat(join(root, 'credits.html')).catch(() => null)) pages.push('credits.html');
if (process.env.COLLECTION_PERF_ROUTES === 'credits') pages.splice(0, pages.length, 'credits.html');
const mime = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.avif': 'image/avif', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.webm': 'video/webm',
};
const compressed = new Map();
const server = createServer(async (request, response) => {
  try {
    const { pathname } = new URL(request.url, 'http://localhost');
    const file = resolve(root, decodeURIComponent(pathname.slice(base.length)) + (pathname.endsWith('/') ? 'index.html' : ''));
    if (!pathname.startsWith(base) || !file.startsWith(root + sep)) throw new Error('Outside build');
    const extension = extname(file);
    const headers = { 'Content-Type': mime[extension] ?? 'application/octet-stream', 'Cache-Control': 'public, max-age=600' };
    let body = await readFile(file);
    const range = /^bytes=(\d+)-(\d*)$/.exec(request.headers.range ?? '');
    if (range) {
      const start = Number(range[1]);
      const end = range[2] ? Math.min(body.length - 1, Number(range[2])) : body.length - 1;
      if (start > end) {
        response.writeHead(416, { 'Content-Range': `bytes */${body.length}` }).end();
        return;
      }
      headers['Content-Range'] = `bytes ${start}-${end}/${body.length}`;
      headers['Accept-Ranges'] = 'bytes';
      body = body.subarray(start, end + 1);
    } else if (/\b(?:html|javascript|css|json|svg\+xml)$/.test(headers['Content-Type']) && /\bgzip\b/.test(request.headers['accept-encoding'] ?? '')) {
      if (!compressed.has(file)) compressed.set(file, gzipSync(body));
      body = compressed.get(file);
      headers['Content-Encoding'] = 'gzip';
    }
    response.writeHead(range ? 206 : 200, { ...headers, 'Content-Length': body.length }).end(body);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((ready, reject) => server.once('error', reject).listen(0, '127.0.0.1', ready));
const origin = `http://127.0.0.1:${server.address().port}`;
const profiles = [
  { name: 'desktop', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, cpu: 1, mbps: 50, latency: 15 },
  { name: 'constrained-mobile', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, cpu: 4, mbps: 12, latency: 60 },
];
const selected = profiles.filter(profile => !process.env.COLLECTION_PERF_PROFILE || profile.name === process.env.COLLECTION_PERF_PROFILE);
if (!selected.length) throw new Error('Unknown COLLECTION_PERF_PROFILE');
const screenshots = process.env.COLLECTION_PERF_SCREENSHOTS;
if (screenshots) await mkdir(screenshots, { recursive: true });
const quantile = (values, q) => values.length ? +values.toSorted((a, b) => a - b)[Math.ceil(values.length * q) - 1].toFixed(2) : null;
const milliseconds = (before, after, key) => Math.round(((after[key] ?? 0) - (before[key] ?? 0)) * 1000);
const browser = await chromium.launch({ channel: 'chromium', args: ['--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const browserSession = await browser.newBrowserCDPSession();
const { gpu } = await browserSession.send('SystemInfo.getInfo');
const results = {
  chromium: browser.version(), profiles: selected,
  gpu: { renderer: gpu.auxAttributes?.glRenderer, features: gpu.featureStatus },
  pages: [],
};

async function measure(route, profile) {
  const { name, cpu, mbps, latency, ...viewportOptions } = profile;
  const context = await browser.newContext(viewportOptions);
  const page = await context.newPage();
  const session = await context.newCDPSession(page);
  const errors = [];
  const requests = new Map();
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  session.on('Network.responseReceived', ({ requestId, type }) => requests.set(requestId, { type, delivered: 0 }));
  session.on('Network.loadingFinished', ({ requestId, encodedDataLength }) => {
    const request = requests.get(requestId);
    if (request) request.delivered = encodedDataLength;
  });
  await session.send('Network.enable');
  await session.send('Network.emulateNetworkConditions', { offline: false, latency, downloadThroughput: mbps * 125_000, uploadThroughput: mbps * 125_000 });
  if (cpu > 1) await session.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  await session.send('Performance.enable');
  const metrics = async () => Object.fromEntries((await session.send('Performance.getMetrics')).metrics.map(({ name, value }) => [name, value]));
  const network = () => {
    const bytes = [...requests.values()].reduce((sum, request) => sum + request.delivered, 0);
    return { bytes, requests: requests.size };
  };
  await page.addInitScript(() => {
    window.measurement = { lcp: 0, cls: 0, longTasks: [], intervals: [], phase: null };
    for (const [type, update] of [
      ['largest-contentful-paint', entry => { window.measurement.lcp = entry.startTime; }],
      ['layout-shift', entry => { if (!entry.hadRecentInput) window.measurement.cls += entry.value; }],
      ['longtask', entry => window.measurement.longTasks.push(entry.duration)],
    ]) {
      new PerformanceObserver(list => list.getEntries().forEach(update)).observe({ type, buffered: true });
    }
    let previous = null;
    function sample(time) {
      if (previous !== null && window.measurement.phase) window.measurement.intervals.push([window.measurement.phase, time - previous]);
      previous = time;
      requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  });
  try {
    await page.goto(`${origin}${base}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.evaluate(() => Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 1400))]));
    await page.waitForTimeout(550);
    const cold = await page.evaluate(() => ({
      lcp: Math.round(window.measurement.lcp),
      fcp: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0),
      dcl: Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd),
      title: document.title,
      lcpWindowMs: Math.round(performance.now()),
    }));
    const coldNetwork = network();
    const before = await metrics();
    await page.evaluate(() => { window.measurement.phase = 'idle'; });
    await page.waitForTimeout(400);
    const idle = await metrics();
    await page.evaluate(() => { window.measurement.phase = 'input'; });
    const { width, height } = viewportOptions.viewport;
    await page.mouse.move(width * .38, height * .57);
    if (viewportOptions.hasTouch) {
      const x = Math.round(width * .45);
      const y = Math.round(height * .72);
      for (const direction of [-1, 1]) {
        await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
        for (let i = 1; i <= 5; i++) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + direction * i * 28 }] });
        await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await page.waitForTimeout(170);
      }
    } else {
      for (const delta of [120, 420, 900, -240]) {
        await page.mouse.wheel(0, delta);
        await page.waitForTimeout(110);
      }
    }
    for (const fraction of [.2, .44, .68, .88, 1, 0]) {
      await page.evaluate(value => {
        const element = document.scrollingElement;
        window.scrollTo({ top: (element.scrollHeight - element.clientHeight) * value, behavior: 'instant' });
      }, fraction);
      await page.waitForTimeout(175);
    }
    const after = await metrics();
    const observed = await page.evaluate(() => {
      window.measurement.phase = null;
      return {
        ...window.measurement,
        canvasPixels: [...document.querySelectorAll('canvas')].reduce((sum, canvas) => sum + canvas.width * canvas.height, 0),
        headings: document.querySelectorAll('h1,h2').length, scrollHeight: document.scrollingElement.scrollHeight,
      };
    });
    const totalNetwork = network();
    if (screenshots) await page.screenshot({ path: join(screenshots, `${name}-${route.replace(/\/$/, '') || 'collection'}.png`), timeout: 8000 });
    return {
      route: route || '/', profile: name, ...cold, cold: coldNetwork, total: totalNetwork,
      cls: +observed.cls.toFixed(4), longTasks: observed.longTasks.length,
      blockingMs: Math.round(observed.longTasks.reduce((sum, time) => sum + Math.max(0, time - 50), 0)),
      idleP95: quantile(observed.intervals.filter(([phase]) => phase === 'idle').map(([, time]) => time), .95),
      inputP95: quantile(observed.intervals.filter(([phase]) => phase === 'input').map(([, time]) => time), .95),
      inputFrames: observed.intervals.filter(([phase]) => phase === 'input').length,
      idleTaskMs: milliseconds(before, idle, 'TaskDuration'), inputTaskMs: milliseconds(idle, after, 'TaskDuration'),
      inputScriptMs: milliseconds(idle, after, 'ScriptDuration'), inputLayoutMs: milliseconds(idle, after, 'LayoutDuration'),
      heapStart: before.JSHeapUsedSize, heapEnd: after.JSHeapUsedSize,
      nodesStart: before.Nodes, nodesEnd: after.Nodes,
      canvasPixels: observed.canvasPixels, headings: observed.headings, scrollHeight: observed.scrollHeight, errors,
    };
  } finally {
    await context.close();
  }
}

try {
  for (const profile of selected) {
    for (const route of pages) {
      let result;
      try {
        result = await measure(route, profile);
      } catch (error) {
        result = { route: route || '/', profile: profile.name, failure: error instanceof Error ? error.message : String(error) };
      }
      results.pages.push(result);
      if (result.failure || result.errors.length) process.exitCode = 1;
      await writeFile(output, JSON.stringify(results, null, 2) + '\n');
      process.stdout.write(`${profile.name} ${result.route} ${result.failure ?? `LCP ${result.lcp} ms, input p95 ${result.inputP95} ms, ${result.errors.length} errors`}\n`);
    }
  }
} finally {
  await browser.close();
  server.close();
}
