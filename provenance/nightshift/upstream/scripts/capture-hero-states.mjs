import { chromium } from 'playwright';
import { preview } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const output = path.resolve('evidence/screenshots');
await mkdir(output, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 4324, strictPort: true } });
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
const records = [], errors = [];

async function record(page, device, state) {
  const name = `${device}-hero-${state}.jpg`;
  await page.screenshot({ path: path.join(output, name), quality: 87, type: 'jpeg' });
  records.push({ file: `evidence/screenshots/${name}`, expected: state, ...(await page.evaluate(() => ({
    observed: document.body.dataset.heroState, chapter: document.body.dataset.chapter || 'boot', scrollY,
    viewport: { width: innerWidth, height: innerHeight }, dpr: devicePixelRatio,
    source: document.querySelector('.stage-layer--base')?.getAttribute('data-key'),
    image: [...document.querySelectorAll('.stage-layer--base img')].map(img => ({ source: new URL(img.currentSrc).pathname, width: img.naturalWidth, loaded: img.complete })),
    title: document.querySelector('h1')?.textContent,
    exposure: document.querySelector('.hero-exposure')?.style.opacity,
  }))) });
}

try {
  for (const [device, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: device === 'mobile', hasTouch: device === 'mobile' });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push({ device, message: e.message }));
    // Deliberately delay the application to verify the real HTML first frame.
    await page.route('**/assets/*.js', async route => { await new Promise(resolve => setTimeout(resolve, 900)); await route.continue(); });
    await page.goto('http://127.0.0.1:4324/', { waitUntil: 'commit' });
    await page.waitForFunction(() => { const image = document.querySelector('.stage-layer--base img'); return image?.complete && image.naturalWidth > 512; });
    await record(page, device, 'first-meaningful');
    await page.waitForFunction(() => document.body.dataset.heroState === 'reveal');
    await record(page, device, 'reveal');
    await page.waitForFunction(() => document.body.dataset.heroState === 'complete-composition');
    await record(page, device, 'complete-composition');
    await page.waitForFunction(() => document.body.dataset.heroState === 'living-hold');
    await record(page, device, 'living-hold');
    await page.evaluate(() => {
      const r = document.querySelector('#tr-01-02').getBoundingClientRect();
      const start = r.top + scrollY - innerHeight * .70;
      const end = r.bottom + scrollY - innerHeight * .12;
      scrollTo(0, (start + end) / 2);
    });
    await page.waitForFunction(() => document.body.dataset.heroState === 'first-scroll');
    await page.waitForFunction(() => [...document.querySelectorAll('#stage img')].filter(img => !img.closest('[hidden]')).every(img => img.complete && img.naturalWidth > 512));
    await record(page, device, 'first-scroll');
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForFunction(() => document.body.dataset.heroState === 'return' && scrollY === 0);
    await record(page, device, 'return');
    await context.close();
  }
  await writeFile('evidence/records/hero-states.json', JSON.stringify({ browser: browser.version(), status: errors.length ? 'FAIL' : 'PASS', method: 'Actual production browser captures; application JavaScript delayed by 900 ms for the HTML first frame. The optional reveal adjusts photographic exposure, not independent character geometry. Living traffic is disabled on phone and in reduced motion.', records, errors }, null, 2));
  console.log(JSON.stringify({ states: records.length, errors, firstFrames: records.filter(r => r.expected === 'first-meaningful').map(r => ({device:r.viewport,observed:r.observed,title:r.title})) }));
} finally {
  await browser.close(); await new Promise(resolve => server.httpServer.close(resolve));
}
