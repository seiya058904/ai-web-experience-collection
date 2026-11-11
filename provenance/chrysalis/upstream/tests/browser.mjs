/**
 * Reproducible real-browser checks for the privately served production build.
 * Start `npm run preview -- --port 4173` separately. This runner never starts,
 * publishes, changes, or deploys a server. It never uses a personal browser.
 *
 * CHRYSALIS_TEST_URL selects an already-running authorized preview.
 * CHRYSALIS_QA_OUTPUT selects a result directory (default evidence/browser).
 * CHROMIUM_EXECUTABLE_PATH optionally selects an installed test Chromium.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(project, process.env.CHRYSALIS_QA_OUTPUT || 'evidence/browser');
const url = process.env.CHRYSALIS_TEST_URL || 'http://127.0.0.1:4173/';
const ids = Array.from({ length: 11 }, (_, i) => `ch-${String(i + 1).padStart(2, '0')}`);
const report = {
  status: 'IN PROGRESS', startedAt: new Date().toISOString(), finishedAt: null,
  url, runtime: process.version, playwrightVersion: null, browserVersion: null,
  conditions: { browser: 'Isolated headless Chromium', defaultNetwork: 'Unthrottled local preview', physicalDevice: false },
  viewports: [], checks: [], captures: [], console: [], performance: [],
  limitations: ['CSS viewport emulation is not physical-device coverage.', 'Effective CSS reflow sizes approximate zoom layout; true browser UI zoom is not claimed.', 'Mobile tap emulation is tested; physical touch scrolling and pinch gestures are not claimed.', 'Screenshot checkpoints cannot establish the absence of all one-frame artifacts. Continuous motion must also be inspected.'],
};
let browser;
let playwright;

async function saveReport() {
  report.finishedAt = new Date().toISOString();
  await fs.mkdir(output, { recursive: true });
  await fs.writeFile(path.join(output, 'results.json'), JSON.stringify(report, null, 2));
}
async function check(id, action) {
  const start = performance.now();
  try {
    const evidence = await action();
    report.checks.push({ id, status: 'PASS', durationMs: Math.round(performance.now() - start), evidence: evidence ?? null });
  } catch (error) {
    report.checks.push({ id, status: 'FAIL', durationMs: Math.round(performance.now() - start), error: String(error.message ?? error) });
    console.error(`FAIL ${id}: ${error.message ?? error}`);
  }
}
async function capture(page, name) {
  const filename = `${name.replace(/[^a-zA-Z0-9_-]/g, '-')}.jpg`;
  await page.screenshot({ path: path.join(output, filename), type: 'jpeg', quality: 76, fullPage: false });
  report.captures.push({ file: filename, viewport: page.viewportSize(), url: page.url() });
  return filename;
}
async function settle(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForTimeout(70);
}
async function ready(page, target = url) {
  const response = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 30000 });
  assert.ok(response && response.ok(), `Preview response was ${response?.status() ?? 'missing'}`);
  await page.waitForSelector('#ch-11', { timeout: 10000 });
  await page.evaluate(() => document.fonts.ready);
  await settle(page);
  return response.status();
}
async function scrollTo(page, target, realWheel = false) {
  const position = await page.evaluate(value => Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, value)), target);
  if (realWheel) {
    await page.mouse.move(Math.round(page.viewportSize().width * .5), Math.round(page.viewportSize().height * .5));
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const current = await page.evaluate(() => scrollY);
      if (Math.abs(current - position) < 1.5) break;
      await page.mouse.wheel(0, position - current);
      try { await page.waitForFunction(y => Math.abs(scrollY - y) < 1.5, position, { timeout: 4000 }); } catch { /* one corrective wheel is permitted */ }
    }
  } else {
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), position);
  }
  await page.waitForFunction(y => Math.abs(scrollY - y) < 2, position, { timeout: 5000 });
  await settle(page);
  return page.evaluate(() => scrollY);
}
async function chapter(page, id) {
  const target = await page.locator(`#${id}`).evaluate(el => el.getBoundingClientRect().top + scrollY - 84);
  await scrollTo(page, target);
  return page.locator(`#${id}`);
}
async function transition(page, index, progress, realWheel = false) {
  const selector = `.chapter-transition[data-from="${ids[index]}"][data-to="${ids[index + 1]}"]`;
  const target = await page.locator(selector).evaluate((el, p) => { const rect = el.getBoundingClientRect(); return rect.top + scrollY + rect.height * p - innerHeight / 2; }, progress);
  await scrollTo(page, target, realWheel);
  await page.waitForFunction(selector => [...document.querySelector(selector).closest('.transition-wrap').querySelectorAll('img')].every(img => (img.complete && img.naturalWidth > 0) || img.closest('.is-failed')), selector, { timeout: 7000 });
  const state = await page.locator(selector).evaluate(el => {
    const rect = el.getBoundingClientRect(); const wrap = el.closest('.transition-wrap');
    const p = Math.max(0, Math.min(1, (innerHeight / 2 - rect.top) / rect.height));
    const rendered = parseFloat(getComputedStyle(wrap).getPropertyValue('--transition-progress'));
    const media = [...wrap.querySelectorAll('img')].map(img => ({ src: img.currentSrc, loaded: img.complete && img.naturalWidth > 0, fallback: Boolean(img.closest('.is-failed')) }));
    return { actualProgress: p, renderedProgress: Number.isFinite(rendered) ? rendered : null, caption: wrap.querySelector('.transition-stage')?.textContent.trim(), media, scrollY };
  });
  assert.ok(Math.abs(state.actualProgress - progress) < .025, `Expected ${progress}, received ${state.actualProgress}`);
  if (state.renderedProgress !== null) assert.ok(Math.abs(state.renderedProgress - state.actualProgress) < .025, 'Rendered progress is stale.');
  assert.ok(state.caption, 'Transition stage caption is missing.');
  assert.ok(state.media.every(item => item.loaded || item.fallback), 'A transition plate is unavailable without fallback.');
  return state;
}
async function bounds(page, scope = 'body') {
  const result = await page.locator(scope).evaluate(element => {
    const offenders = [...element.querySelectorAll('h1,h2,h3,p,button')].filter(el => {
      const rect = el.getBoundingClientRect(); const css = getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight && css.display !== 'none' && css.visibility !== 'hidden' && !el.closest('[hidden]') && (rect.left < -2 || rect.right > innerWidth + 2);
    }).map(el => ({ text: el.textContent.trim().slice(0, 90), left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right }));
    return { scrollWidth: document.documentElement.scrollWidth, viewport: innerWidth, offenders };
  });
  assert.ok(result.scrollWidth <= result.viewport + 2, `Horizontal overflow: ${result.scrollWidth} > ${result.viewport}`);
  assert.deepEqual(result.offenders, [], 'Visible text or controls exceed the viewport.');
  return result;
}
async function english(page) {
  const result = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    text: document.body.innerText + '\n' + [...document.querySelectorAll('[alt],[aria-label],meta[content]')].map(el => `${el.getAttribute('alt') || ''} ${el.getAttribute('aria-label') || ''} ${el.getAttribute('content') || ''}`).join('\n'),
  }));
  assert.equal(result.lang, 'en');
  assert.ok(!/[\u3400-\u4DBF\u4E00-\u9FFF\u3040-\u30FF]/u.test(result.text), 'Unintended CJK text was found.');
  return { lang: result.lang, charactersInspected: result.text.length };
}
async function verifyChapter(page, id) {
  const section = await chapter(page, id);
  assert.ok(await section.locator('h1,h2').count(), `${id} lacks a semantic heading.`);
  assert.ok(await section.locator('.beat').count() >= 2, `${id} lacks two content beats.`);
  await bounds(page, `#${id}`);
  return { id, title: await section.locator('h1,h2').first().innerText(), beats: await section.locator('.beat').count() };
}
async function installObservers(context) {
  await context.addInitScript(() => {
    window.__chrysalisPerformance = { lcpMs: null, cls: 0, longTasks: [], firstInputDurationMs: null };
    const state = window.__chrysalisPerformance;
    for (const type of ['largest-contentful-paint', 'layout-shift', 'longtask', 'first-input']) {
      try {
        new PerformanceObserver(list => { for (const entry of list.getEntries()) {
          if (type === 'largest-contentful-paint') state.lcpMs = entry.startTime;
          else if (type === 'layout-shift' && !entry.hadRecentInput) state.cls += entry.value;
          else if (type === 'longtask') state.longTasks.push({ startTime: entry.startTime, duration: entry.duration });
          else if (type === 'first-input') state.firstInputDurationMs = entry.duration;
        }}).observe({ type, buffered: true });
      } catch { /* unsupported entries remain null, never fabricated */ }
    }
  });
}
async function coreInteractions(page, label, touch = false) {
  await check(`${label} / hero CTA, hash and focus`, async () => {
    await ready(page);
    await page.getByRole('link', { name: 'Begin the transformation', exact: true }).click();
    await page.waitForURL('**/#ch-02');
    await page.waitForFunction(() => document.activeElement?.id === 'title-ch-02');
    return { hash: await page.evaluate(() => location.hash), focused: await page.evaluate(() => document.activeElement.id) };
  });
  await check(`${label} / chapter dialog, native Escape and focus return`, async () => {
    const opener = page.getByRole('button', { name: 'Chapters', exact: true });
    await opener.click();
    assert.equal(await page.locator('#chapters-dialog').evaluate(el => el.open), true);
    assert.equal(await page.locator('#chapters-dialog a[href^="#ch-"]').count(), 11);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#chapters-dialog').evaluate(el => el.open), false);
    assert.equal(await opener.evaluate(el => document.activeElement === el), true);
    return { links: 11, escaped: true, focusReturned: true };
  });
  await check(`${label} / five distinct instars and Show all`, async () => {
    const section = await chapter(page, 'ch-05'); const signatures = [];
    for (let i = 1; i <= 5; i += 1) {
      const button = section.getByRole('button', { name: `Instar ${i}`, exact: true });
      if (touch) { const rect = await button.boundingBox(); assert.ok(rect); await page.touchscreen.tap(rect.x + rect.width / 2, rect.y + rect.height / 2); }
      else await button.click();
      assert.equal(await button.getAttribute('aria-pressed'), 'true');
      signatures.push(await section.locator('#instar-diagram').innerHTML() + await section.locator('#instar-caption').innerText());
    }
    assert.equal(new Set(signatures).size, 5);
    await section.getByRole('button', { name: 'Show all', exact: true }).click();
    const reset = await section.getByRole('button', { name: 'Show all', exact: true }).getAttribute('aria-pressed');
    assert.ok(reset === 'true' || await section.getAttribute('data-mode') === 'all');
    await capture(page, `${label}-instars`);
    return { distinctStates: 5, input: touch ? 'Emulated touchscreen taps' : 'Mouse clicks' };
  });
  await check(`${label} / exterior, reconstruction and reset`, async () => {
    const section = await chapter(page, 'ch-08');
    await section.getByRole('button', { name: 'Illustrated inside', exact: true }).click();
    assert.equal(await section.locator('#inside-reconstruction').evaluate(el => el.hidden), false);
    assert.equal(await section.locator('#inside-exterior').evaluate(el => el.hidden), true);
    assert.ok((await section.innerText()).includes('Illustrative reconstruction'));
    await capture(page, `${label}-inside`);
    await section.getByRole('button', { name: 'Reset view', exact: true }).click();
    assert.equal(await section.locator('#inside-reconstruction').evaluate(el => el.hidden), true);
    assert.equal(await section.locator('#inside-exterior').evaluate(el => el.hidden), false);
    return { exteriorRestored: true };
  });
  await check(`${label} / emergence stages and reset`, async () => {
    const section = await chapter(page, 'ch-10'); const states = [];
    for (const name of ['Leaving the shell', 'Wings unfolding', 'Ready for flight']) {
      const button = section.getByRole('button', { name, exact: true }); await button.click();
      assert.equal(await button.getAttribute('aria-pressed'), 'true');
      states.push(await section.locator('#emergence-diagram').innerHTML() + await section.locator('picture[data-asset]').first().getAttribute('data-asset'));
    }
    assert.equal(new Set(states).size, 3);
    await capture(page, `${label}-emergence`);
    await section.getByRole('button', { name: 'Back to stage one', exact: true }).click();
    assert.equal(await section.getByRole('button', { name: 'Leaving the shell', exact: true }).getAttribute('aria-pressed'), 'true');
    return { distinctStates: 3, reset: true };
  });
  await check(`${label} / native PageDown, End and Home`, async () => {
    await scrollTo(page, 0); await page.locator('body').click({ position: { x: 10, y: 140 } });
    await page.keyboard.press('PageDown'); await page.waitForFunction(() => scrollY > 20);
    const moved = await page.evaluate(() => scrollY);
    await page.keyboard.press('End'); await page.waitForFunction(() => document.documentElement.dataset.activeChapter === 'ch-11');
    await page.keyboard.press('Home'); await page.waitForFunction(() => scrollY < 2);
    return { pageDownMoved: moved, endReached: 'ch-11', homeReturned: true };
  });
}
async function pathMatrix(viewport, mobile) {
  const label = `${viewport.width}x${viewport.height}`;
  const context = await browser.newContext({ viewport, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  await installObservers(context);
  const page = await context.newPage(); const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', msg => { if (['error', 'warning'].includes(msg.type())) report.console.push({ viewport: label, type: msg.type(), text: msg.text() }); });
  await ready(page); report.viewports.push({ ...viewport, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  await check(`${label} / identity and completeness`, async () => {
    assert.equal(await page.title(), 'CHRYSALIS — The architecture of becoming');
    assert.equal(await page.locator('.chapter').count(), 11);
    assert.equal(await page.locator('.chapter-transition').count(), 10);
    return english(page);
  });
  await check(`${label} / hero composition`, async () => { await bounds(page, '#ch-01'); const shot=await capture(page, `${label}-hero`); report.performance.push({viewport:label,phase:'Initial hero',values:await page.evaluate(()=>({observed:window.__chrysalisPerformance,navigation:performance.getEntriesByType('navigation').map(entry=>({domContentLoadedMs:entry.domContentLoadedEventEnd,loadMs:entry.loadEventEnd,responseEndMs:entry.responseEnd}))})),caveat:'Headless local observation; hardware unknown. First-input duration is not INP.'}); return { capture:shot }; });
  for (const id of ids) await check(`${label} / ${id}`, () => verifyChapter(page, id));
  for (let index = 0; index < 10; index += 1) {
    for (const progress of [0, .25, .5, .75, 1]) {
      await check(`${label} / transition ${index + 1} at ${progress}`, async () => {
        const state = await transition(page, index, progress); await bounds(page);
        return { ...state, capture: await capture(page, `${label}-tr${String(index + 1).padStart(2, '0')}-${Math.round(progress * 100)}`) };
      });
    }
    await check(`${label} / transition ${index + 1} reverse and direct midpoint`, async () => {
      const reverse = await transition(page, index, .5, true);
      await scrollTo(page, 0); const direct = await transition(page, index, .5);
      assert.equal(reverse.caption, direct.caption);
      assert.ok(Math.abs(reverse.actualProgress - direct.actualProgress) < .01);
      return { reverse, direct };
    });
  }
  for (let cycle = 1; cycle <= 3; cycle += 1) {
    await check(`${label} / hero first scroll and return ${cycle}`, async () => {
      await scrollTo(page, 0, true); const frames = [];
      for (const progress of [.25, .5, .75, .5, .25, 0]) frames.push(await transition(page, 0, progress, true));
      await scrollTo(page, 0, true);
      assert.equal(await page.locator('.hero-art img').getAttribute('src'), './assets/ai-04-hero.webp');
      return { frames, returnedCapture: await capture(page, `${label}-hero-return-${cycle}`) };
    });
  }
  await coreInteractions(page, label, mobile);
  await check(`${label} / direct hash and reload`, async () => {
    await ready(page, new URL('#ch-08', url).href);
    await page.waitForFunction(() => document.documentElement.dataset.activeChapter === 'ch-08');
    await chapter(page, 'ch-09'); const before = await page.evaluate(() => scrollY);
    await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForSelector('#ch-11'); await settle(page);
    const after = await page.evaluate(() => scrollY); assert.ok(Math.abs(before - after) < 80, `${before} → ${after}`);
    return { before, after };
  });
  await check(`${label} / history back and forward`, async () => {
    await ready(page); await page.getByRole('link', { name: 'Begin the transformation', exact: true }).click();
    await page.waitForFunction(() => document.activeElement?.id === 'title-ch-02');
    await page.getByRole('button', { name: 'Chapters', exact: true }).click();
    await page.locator('#chapters-dialog a[href="#ch-05"]').click();
    await page.waitForURL('**/#ch-05'); await page.goBack(); await page.waitForURL('**/#ch-02');
    await page.goForward(); await page.waitForURL('**/#ch-05');
    return { back: 'ch-02', forward: 'ch-05' };
  });
  await check(`${label} / no runtime exception`, () => { assert.deepEqual(errors, []); return { pageErrors: errors }; });
  report.performance.push({ viewport: label, values: await page.evaluate(() => window.__chrysalisPerformance), caveat: 'Headless local run. LCP/CLS entries are observational; first-input duration is not INP. Hardware is unknown.' });
  await context.close();
}
async function riskViewports() {
  const sizes = [[320,700],[360,640],[768,1024],[1920,1080],[2560,1440],[3840,2160],[844,390],[699,900],[701,900],[1099,900],[1101,900],[1152,720],[960,600],[720,450]];
  const context = await browser.newContext(); const page = await context.newPage();
  for (const [width, height] of sizes) {
    const label = `${width}x${height}`; await page.setViewportSize({ width, height }); await ready(page);
    report.viewports.push({ width, height, kind: [1152,960,720].includes(width) ? 'Effective CSS reflow size, not native browser zoom' : 'Risk-based CSS viewport' });
    await check(`${label} / hero English and bounds`, async () => { await english(page); await bounds(page); return { capture: await capture(page, `${label}-hero`) }; });
    await check(`${label} / longest comparison`, () => verifyChapter(page, 'ch-05'));
    for (const index of [5,8]) await check(`${label} / high-risk midpoint ${index+1}`, async () => {const state=await transition(page,index,.5);await bounds(page);return state;});
    await check(`${label} / ending`, () => verifyChapter(page, 'ch-11'));
  }
  await context.close();
}
async function recoveryMatrix() {
  await check('OS reduced motion / all chapters and interactive result', async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', isMobile: true, hasTouch: true });
    const page = await context.newPage(); await ready(page);
    assert.equal(await page.locator('html').getAttribute('data-motion'), 'reduced');
    for (const id of ids) await verifyChapter(page,id);
    const section = await chapter(page,'ch-05'); await section.getByRole('button',{name:'Instar 4',exact:true}).click();
    assert.equal(await section.getByRole('button',{name:'Instar 4',exact:true}).getAttribute('aria-pressed'),'true');
    const captureName=await capture(page,'reduced-motion-instar'); await context.close();return {chapters:11,capture:captureName};
  });
  await check('failed WebP resources / full story and embedded fallback', async () => {
    const context=await browser.newContext({viewport:{width:1440,height:900}});let failing=true;
    await context.route('**/assets/**/*.webp',route=>failing?route.abort('failed'):route.continue());
    await context.route('**/assets/*.webp',route=>failing?route.abort('failed'):route.continue());
    const page=await context.newPage();await ready(page);
    await page.waitForSelector('.scene-media.is-failed, .scene-fallback', { timeout:10000 });
    assert.equal(await page.locator('.chapter').count(),11);
    await chapter(page,'ch-07');const fallbackCapture=await capture(page,'failed-assets-ch07');
    assert.ok((await page.locator('#ch-07').innerText()).length>120);
    failing=false;const retry=page.locator('#ch-07').getByRole('button',{name:'Retry',exact:true});const retryAvailable=(await retry.count())>0;
    if(retryAvailable){await retry.first().click();await page.waitForFunction(()=>[...document.querySelectorAll('#ch-07 img')].some(img=>img.complete&&img.naturalWidth>0));}
    await context.close();return {fallbackCapture,retryAvailable};
  });
  await check('slow images and delayed fonts / correct late scene ownership', async () => {
    const context=await browser.newContext({viewport:{width:1440,height:900}});
    await context.route(/\.(?:webp|woff2)(?:\?.*)?$/,async route=>{await new Promise(resolve=>setTimeout(resolve,700));await route.continue();});
    const page=await context.newPage();await ready(page);
    await chapter(page,'ch-10');const section=page.locator('#ch-10');
    await section.getByRole('button',{name:'Leaving the shell',exact:true}).click();
    await section.getByRole('button',{name:'Ready for flight',exact:true}).click();
    const selection=await section.getAttribute('data-mode');await page.waitForTimeout(1000);
    assert.equal(await section.getAttribute('data-mode'),selection);
    assert.equal(await section.getByRole('button',{name:'Ready for flight',exact:true}).getAttribute('aria-pressed'),'true');
    await bounds(page);const shot=await capture(page,'slow-loading-final-selection');await context.close();return {delayPerMediaRequestMs:700,finalSelection:selection,capture:shot};
  });
  await check('WebGL unavailable / complete story remains independent of it', async () => {
    const context=await browser.newContext({viewport:{width:1440,height:900}});
    await context.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...rest){if(/webgl/i.test(type))return null;return get.call(this,type,...rest);};});
    const page=await context.newPage();await ready(page);assert.equal(await page.locator('.chapter').count(),11);await chapter(page,'ch-11');const shot=await capture(page,'webgl-unavailable-ending');await context.close();return {chapters:11,capture:shot};
  });
  await check('JavaScript unavailable / standalone reading edition', async () => {
    const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});const page=await context.newPage();
    const response=await page.goto(new URL('reading.html',url).href,{waitUntil:'load'});assert.ok(response?.ok());
    assert.ok(await page.locator('section').count()>=11,'Reading edition lacks eleven sections.');await english(page);const shot=await capture(page,'no-javascript-reading');await context.close();return {capture:shot};
  });
}

try {
  await fs.mkdir(output,{recursive:true});
  try { playwright=require('playwright'); report.playwrightVersion=require('playwright/package.json').version; }
  catch(error){if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw error;const runtimeRequire=createRequire(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'index.js'));playwright=runtimeRequire('playwright');report.playwrightVersion=runtimeRequire('playwright/package.json').version;}
  browser=await playwright.chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
  report.browserVersion=browser.version();
  await pathMatrix({width:1440,height:900},false);
  await pathMatrix({width:390,height:844},true);
  await riskViewports();
  await recoveryMatrix();
  report.status=report.checks.some(item=>item.status==='FAIL')?'FAIL':'PASS';
} catch(error) {
  report.status=browser?'FAIL':'BLOCKED';
  report.blocker=String(error.stack??error);
} finally {
  if(browser)await browser.close();
  await saveReport();
  console.log(JSON.stringify({status:report.status,passed:report.checks.filter(item=>item.status==='PASS').length,total:report.checks.length,report:path.join(output,'results.json')}));
  process.exitCode=report.status==='PASS'?0:report.status==='BLOCKED'?2:1;
}
