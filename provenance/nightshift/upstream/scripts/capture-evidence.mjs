import { chromium } from 'playwright';
import { preview } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'evidence/screenshots');
await mkdir(out, { recursive: true });
await mkdir(path.join(root, 'evidence/records'), { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 4322, strictPort: true } });
const origin = 'http://127.0.0.1:4322/';
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
const errors = [], records = [];

async function settle(page) {
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.querySelectorAll('#stage img')].filter(img => !img.closest('[hidden]')).every(img => img.complete && img.naturalWidth > 512 && !img.currentSrc.includes('/fallback/')));
}

async function capture(page, name) {
  await settle(page);
  if (name.endsWith('ch-01')) await page.waitForFunction(() => ['complete-composition','living-hold','return'].includes(document.body.dataset.heroState));
  await page.evaluate(async () => { await Promise.all([...document.querySelectorAll('#stage img')].filter(img => !img.closest('[hidden]')).map(img => img.decode())); await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
  await page.screenshot({ path: path.join(out, `${name}.jpg`), type: 'jpeg', quality: 84 });
  records.push({ name, ...(await page.evaluate(() => ({
    title: document.title, width: innerWidth, height: innerHeight, dpr: devicePixelRatio,
    scrollY, pageWidth: document.documentElement.scrollWidth,
    chapter: document.body.dataset.chapter,
    transition: document.body.dataset.transition,
    progress: document.body.dataset.transitionProgress,
    images: [...document.querySelectorAll('#stage img')].filter(img => !img.closest('[hidden]')).map(img => ({src: new URL(img.currentSrc).pathname, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight})),
    source: document.querySelector('#stage')?.getAttribute('data-source'),
    target: document.querySelector('#stage')?.getAttribute('data-target'),
    headings: [...document.querySelectorAll('h1,h2')].filter(el => { const r = el.getBoundingClientRect(); return r.bottom > 90 && r.top < innerHeight - 58; }).map(el => ({ text: el.textContent, rect: el.getBoundingClientRect().toJSON() })),
  }))) });
}

try {
  for (const [device, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: device === 'mobile', hasTouch: device === 'mobile' });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push({ device, message: e.message }));
    await page.goto(origin, { waitUntil: 'networkidle' });
    await capture(page, `${device}-ch-01`);
    for (let i = 2; i <= 11; i++) {
      const id = `ch-${String(i).padStart(2, '0')}`;
      await page.goto(`${origin}#${id}`);
      await page.waitForFunction(id => document.body.dataset.chapter === id && !document.body.dataset.transition, id);
      await capture(page, `${device}-${id}`);
    }
    for (let i = 0; i < 10; i++) {
      const id = `tr-${String(i + 1).padStart(2, '0')}-${String(i + 2).padStart(2, '0')}`;
      const stages = [0, .25, .5, .75, 1];
      for (const p of stages) {
        await page.evaluate(({ id, p }) => {
          const r = document.getElementById(id).getBoundingClientRect();
          const top = r.top + scrollY - innerHeight * .70;
          const end = r.bottom + scrollY - innerHeight * .12;
          scrollTo(0, top + (end - top) * p);
        }, { id, p });
        await page.waitForTimeout(100);
        await capture(page, `${device}-${id}-${String(Math.round(p * 100)).padStart(3, '0')}`);
      }
    }
    await context.close();
  }
  await writeFile(path.join(root, 'evidence/records/captures.json'), JSON.stringify({ browser: browser.version(), method: 'Local production build; headless Chromium through Playwright; native scroll positions; JPEG screenshots.', records, errors }, null, 2));
  console.log(JSON.stringify({ browser: browser.version(), captures: records.length, errors, overflow: records.filter(r => r.pageWidth > r.width).map(r => r.name) }));
} finally {
  await browser.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
