import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

// Focused diagnostic: preserve actual browser defaults and record the order
// of native keyboard scrolling, app scroll calls and hash navigation.
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'docs/evidence');
const label = (process.env.PAPERSUN_QA_LABEL || 'input-probe').replace(/[^a-zA-Z0-9_-]/g, '-');
const port = Number(process.env.PAPERSUN_QA_PORT || 4195);
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['scripts/serve.mjs'], { cwd: root, env: { ...process.env, HOST: '127.0.0.1', PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] });
await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); server.once('exit', code => reject(new Error(`Preview exited ${code}`))); });
await mkdir(output, { recursive: true });
const report = { started: new Date().toISOString(), method: 'Real Playwright wheel/keyboard/history/hash actions against production dist; scroll calls and native events are observed without overriding their result.', cases: [] };
const frame = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const read = page => page.evaluate(() => ({ y: scrollY, transition: document.documentElement.dataset.transition, chapter: document.documentElement.dataset.activeChapter, hash: location.hash, focus: document.activeElement?.outerHTML.slice(0, 160), classes: document.documentElement.className }));
async function go(page, number) {
  const id = `ch-${String(number).padStart(2, '0')}`;
  await page.getByRole('button', { name: 'Chapters', exact: true }).click();
  await page.locator(`#story-dialog a[href="#${id}"]`).click();
  await page.waitForFunction(id => Math.abs(scrollY - document.getElementById(id).offsetTop) < 2, id);
  await frame(page);
}
async function probe(name, task) {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PAPERSUN_BROWSER_PATH || undefined, args: JSON.parse(process.env.PAPERSUN_BROWSER_ARGS || '[]'), env: { ...process.env, ...JSON.parse(process.env.PAPERSUN_BROWSER_ENV || '{}') } });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  await page.addInitScript(() => {
    window.__inputTrace = [];
    const add = (event, extra = {}) => {
      const records = window.__inputTrace;
      records.push({ time: performance.now(), event, y: scrollY, hash: location.hash, classes: document.documentElement.className, ...extra });
      if (records.length > 2000) records.shift();
    };
    const original = window.scrollTo;
    window.scrollTo = function (...args) { add('window.scrollTo', { args }); return original.apply(this, args); };
    for (const event of ['scroll', 'scrollend', 'hashchange', 'popstate']) window.addEventListener(event, () => add(event));
    for (const event of ['keydown', 'keyup']) document.addEventListener(event, e => add(event, { key: e.key, defaultPrevented: e.defaultPrevented, target: e.target?.tagName }), true);
  });
  const result = { name, browser: browser.version(), started: new Date().toISOString(), errors: [] };
  page.on('pageerror', error => result.errors.push(error.message));
  try { result.observations = await task(page); result.status = 'CAPTURED'; }
  catch (error) { result.status = 'ERROR'; result.error = error.message; }
  result.final = await read(page).catch(() => null);
  result.trace = await page.evaluate(() => window.__inputTrace).catch(() => []);
  await page.screenshot({ path: path.join(output, `${label}-${name}.jpg`), type: 'jpeg', quality: 82 }).catch(() => undefined);
  report.cases.push(result);
  await browser.close();
  await writeFile(path.join(output, `${label}-results.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ name, status: result.status, observations: result.observations, final: result.final, error: result.error }));
}

try {
  for (let attempt = 1; attempt <= 3; attempt++) {
    await probe(`home-arrow-${attempt}`, async page => {
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.mouse.move(700, 400);
      await page.mouse.wheel(0, 650);
      await page.waitForFunction(() => scrollY > 250);
      await page.keyboard.press('Home');
      await page.waitForFunction(() => scrollY < 2);
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(500);
      const afterFirstArrow = await read(page);
      await page.waitForTimeout(800);
      const afterSettling = await read(page);
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(500);
      return { afterFirstArrow, afterSettling, afterSecondArrow: await read(page) };
    });
  }
  await probe('pageup-hash', async page => {
    await page.goto(base, { waitUntil: 'networkidle' });
    await go(page, 5);
    await page.getByRole('button', { name: 'Repair the lantern', exact: true }).click();
    await go(page, 7);
    await page.goBack(); await page.waitForFunction(() => document.documentElement.dataset.activeChapter === '5');
    await page.goForward(); await page.waitForFunction(() => document.documentElement.dataset.activeChapter === '7');
    await go(page, 6);
    await page.setViewportSize({ width: 390, height: 844 }); await frame(page);
    await page.setViewportSize({ width: 1440, height: 900 }); await frame(page);
    const before = await page.evaluate(() => scrollY);
    await page.keyboard.press('PageDown');
    await page.waitForFunction(y => scrollY > y + 50, before);
    await page.keyboard.press('PageUp');
    await page.goto(`${base}/#tr-08-09@50`, { waitUntil: 'networkidle' });
    await frame(page);
    const immediate = await read(page);
    await page.waitForTimeout(700);
    const settled = await read(page);
    const desired = await page.evaluate(() => document.querySelector('#ch-09').offsetTop - innerHeight / 2);
    return { before, immediate, settled, desired };
  });
  await probe('space-button-and-page-keys', async page => {
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.mouse.click(700, 250);
    await page.keyboard.press('Home'); await frame(page);
    const home = await read(page); assert.equal(home.y, 0);
    await page.keyboard.press('Space'); await frame(page);
    const space = await read(page); assert.equal(space.y, 810);
    await page.keyboard.press('Shift+Space'); await frame(page);
    const shiftSpace = await read(page); assert.equal(shiftSpace.y, 0);
    await page.getByRole('button', { name: 'Chapters', exact: true }).focus();
    await page.keyboard.press('Space'); await frame(page);
    assert.equal(await page.locator('#story-dialog').evaluate(dialog => dialog.open), true);
    const button = await read(page); assert.equal(button.y, 0);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#story-dialog').evaluate(dialog => dialog.open), false);
    assert.equal(await page.evaluate(() => document.activeElement?.textContent?.trim()), 'Chapters');
    await page.mouse.click(700, 250);
    await page.keyboard.press('PageDown'); await frame(page);
    const down = await read(page); assert.equal(down.y, 810);
    await page.keyboard.press('PageUp'); await frame(page);
    const up = await read(page); assert.equal(up.y, 0);
    await page.keyboard.press('End'); await frame(page);
    const end = await read(page); assert.equal(end.chapter, '11');
    await page.keyboard.press('Home'); await frame(page);
    const finalHome = await read(page); assert.equal(finalHome.y, 0);
    return { assertions: 'PASS', home, space, shiftSpace, focusedButtonSpace: button, pageDown: down, pageUp: up, end, finalHome };
  });
} finally {
  report.finished = new Date().toISOString();
  await writeFile(path.join(output, `${label}-results.json`), JSON.stringify(report, null, 2));
  server.kill();
}
