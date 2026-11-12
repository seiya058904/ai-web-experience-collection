import { test, expect } from '@playwright/test';

const errorsByPage = new WeakMap();
test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  // Keep the assertion in teardown so a navigated-away document is covered too.
  errorsByPage.set(page, errors);
});
test.afterEach(async ({ page }) => {
  expect(errorsByPage.get(page), 'No application errors across the journey').toEqual([]);
});

async function ready(page, route) {
  await page.goto(route);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('main, #app').first()).toBeVisible();
  await expect(page.locator('vite-error-overlay')).toHaveCount(0);
}

async function settleScroll(page) {
  await page.evaluate(() => new Promise(resolve => {
    let previous = scrollY, stable = 0;
    const sample = () => {
      stable = Math.abs(previous - scrollY) < .1 ? stable + 1 : 0;
      previous = scrollY;
      if (stable >= 5) resolve(); else requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }));
}

// Negative input assertions must observe the whole native scroll animation,
// rather than pass on the first frame before a default key action begins.
async function expectStationary(page, action) {
  const before = await page.evaluate(() => scrollY);
  await action();
  await page.waitForTimeout(350);
  await settleScroll(page);
  expect(Math.abs(await page.evaluate(() => scrollY) - before)).toBeLessThanOrEqual(1);
}

for (const motion of ['no-preference', 'reduce']) {
  test.describe(motion === 'reduce' ? 'reduced' : 'normal', () => {
    test.use({ reducedMotion: motion });

    for (const [name, route, opener, dialog] of [
      ['SILLAGE', 'sillage/', '#index-toggle', '#chapter-index'],
      ['ODDS', 'odds/', '#menu-toggle', '#chapter-menu'],
      ['RALLY', 'rally/', '#menu-open', '#chapters-dialog'],
    ]) {
      test(`${name} directory contains input and returns focus`, async ({ page }) => {
        await ready(page, route);
        await expect(page).toHaveTitle(new RegExp(name));
        await page.locator(opener).click();
        await expect(page.locator(dialog)).toBeVisible();
        await settleScroll(page);
        await expectStationary(page, () => page.keyboard.press('PageDown'));
        await expectStationary(page, async () => {
          await page.mouse.move(3, 3); // Modal backdrop.
          await page.mouse.wheel(0, 500);
        });
        // Rebuilding Lenis for an OS preference change must keep the open
        // modal authoritative, including the edition that has no Lenis.
        await page.emulateMedia({ reducedMotion: motion === 'reduce' ? 'no-preference' : 'reduce' });
        await expectStationary(page, () => page.keyboard.press('PageDown'));
        await page.emulateMedia({ reducedMotion: motion });
        // A short viewport makes the actual directory overflow. Its own wheel
        // must still work while the document underneath remains stationary.
        const viewport = page.viewportSize();
        await page.setViewportSize({ width: viewport.width, height: 320 });
        const directory = page.locator(dialog);
        const bounds = await directory.boundingBox();
        await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        await expectStationary(page, () => page.mouse.wheel(0, 400));
        await expect.poll(() => directory.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
        await page.setViewportSize(viewport);
        await page.keyboard.press('Escape');
        await expect(directory).not.toBeVisible();
        await expect(page.locator(opener)).toBeFocused();
        const before = await page.evaluate(() => scrollY);
        await page.mouse.move(viewport.width / 2, viewport.height / 2);
        await page.mouse.wheel(0, 400);
        await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before + 50);
        await settleScroll(page);
        await page.locator(opener).click();
        const chapterLink = directory.locator('a[href^="#"]').nth(1);
        const hash = await chapterLink.getAttribute('href');
        await chapterLink.click();
        await expect(directory).not.toBeVisible();
        await expect.poll(() => page.evaluate(() => location.hash)).toBe(hash);
        await settleScroll(page);
        const top = await page.locator(hash).evaluate(el => el.getBoundingClientRect().top);
        expect(top).toBeGreaterThan(-400);
        expect(top).toBeLessThan(viewport.height * .7);
      });
    }

    test('ODDS table keeps vertical reading and horizontal access', async ({ page }) => {
      await ready(page, 'odds/#chapter-05');
      await page.waitForFunction(() => performance.getEntriesByName('odds-interactive').length > 0);
      await page.locator('#chapter-05 summary').click();
      const table = page.locator('#small-data .data-scroll').first();
      await table.scrollIntoViewIfNeeded();
      await settleScroll(page);
      await table.locator('td').nth(5).hover();
      const before = await page.evaluate(() => scrollY);
      await page.mouse.wheel(0, 350);
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before + 50);

      await page.setViewportSize({ width: 320, height: 844 });
      // Enlarged reading text creates a real overflow even when the default
      // compact table fits the phone. This changes no application data.
      await table.locator('table').evaluate(el => { el.style.fontSize = '20px'; });
      await table.scrollIntoViewIfNeeded();
      await settleScroll(page);
      await table.locator('td').nth(5).hover();
      await settleScroll(page);
      expect(await table.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);
      const narrowBefore = await page.evaluate(() => scrollY);
      await page.mouse.wheel(0, 200);
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(narrowBefore + 50);
      await table.locator('td').nth(5).hover();
      await settleScroll(page);
      await expectStationary(page, () => page.mouse.wheel(300, 0));
      await expect.poll(() => table.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);

      // Resize back to a fitting table; a stale scroll guard must not survive.
      await page.setViewportSize({ width: 1440, height: 900 });
      await table.locator('table').evaluate(el => { el.style.fontSize = ''; });
      await table.scrollIntoViewIfNeeded();
      await settleScroll(page);
      await table.hover();
      const restored = await page.evaluate(() => scrollY);
      await page.mouse.wheel(0, 350);
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(restored + 50);
    });

    test('Collection entry and explicit return preserve the source and focus', async ({ page }) => {
      await ready(page, './');
      await expect(page).toHaveTitle('AI Web Experience Collection');
      await expect(page.locator('.world[id]')).toHaveCount(55);
      await page.locator('.collection-index summary').click();
      await page.locator('.collection-index a[href="#world-sillage"]').click();
      await settleScroll(page);
      const world = page.locator('#world-sillage');
      const top = await world.evaluate(el => el.getBoundingClientRect().top);
      await world.click({ position: { x: 30, y: 100 } });
      await expect(page).toHaveURL(/\/ai-web-experience-collection\/sillage\/\?collection-journey=/);
      await page.locator('.collection-return').click();
      await expect(page).toHaveURL(/#world-sillage$/);
      await page.evaluate(() => document.fonts.ready);
      await expect(world).toBeFocused();
      expect(Math.abs(await world.evaluate(el => el.getBoundingClientRect().top) - top)).toBeLessThan(2);
    });

    test('BERTH fitting directory does not trap the page wheel', async ({ page }) => {
      await ready(page, 'berth/');
      await page.locator('#chapter-menu-button').click();
      const nav = page.locator('#chapter-menu nav');
      await expect(nav).toBeVisible();
      expect(await nav.evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
      await nav.locator('a').nth(2).hover();
      const before = await page.evaluate(() => scrollY);
      await page.mouse.wheel(0, 350);
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before + 50);
      await settleScroll(page);
      const viewport = page.viewportSize();
      await page.setViewportSize({ width: viewport.width, height: 320 });
      await expect.poll(() => nav.evaluate(el => el.scrollHeight > el.clientHeight + 1)).toBe(true);
      await nav.hover();
      await expectStationary(page, () => page.mouse.wheel(0, 350));
      await expect.poll(() => nav.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
      await page.setViewportSize(viewport);
      await nav.locator('a').nth(2).hover();
      await settleScroll(page);
      const restored = await page.evaluate(() => scrollY);
      await page.mouse.wheel(0, 350);
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(restored + 50);
    });
  });
}

test('Collection directory and native work links remain usable without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto(baseURL);
    await page.locator('.collection-index summary').click();
    await page.locator('.collection-index a[href="#world-sillage"]').click();
    await expect(page).toHaveURL(/#world-sillage$/);
    await page.locator('#world-sillage').click({ position: { x: 30, y: 100 } });
    await expect(page).toHaveURL(/\/ai-web-experience-collection\/sillage\/$/);
  } finally { await context.close(); }
});
