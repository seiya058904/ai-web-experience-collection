import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.__transitionErrors = errors;
});
test.afterEach(async ({ page }) => {
  expect(page.__transitionErrors, 'No application errors during interaction').toEqual([]);
});

async function open(page, route, title) {
  await page.goto(route);
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveTitle(new RegExp(title));
  await expect(page.locator('vite-error-overlay')).toHaveCount(0);
}

async function finished(locator) {
  await expect.poll(() => locator.evaluate(element => element.getAnimations().length)).toBe(0);
}

test('AER shape reversal keeps its frame and both static alternatives', async ({ page }) => {
  await open(page, 'aer/#ch-02', 'AER');
  const held = page.locator('.shape-state').filter({ has: page.locator('#shape-held') });
  const rest = page.locator('.shape-state').filter({ has: page.locator('#shape-rest') });
  if (page.viewportSize().width <= 680) {
    await expect(page.locator('[data-shape="held"]')).toBeHidden();
    await expect(held).toHaveAttribute('aria-hidden', 'false');
    await expect(rest).toHaveAttribute('aria-hidden', 'false');
    const a = await rest.boundingBox(), b = await held.boundingBox();
    expect(b.y).toBeGreaterThanOrEqual(a.y + a.height);
    return;
  }
  const box = page.locator('.shape-images');
  const height = (await box.boundingBox()).height;
  await page.locator('[data-shape="held"]').click();
  // Sample the actual browser transition, not just a declared CSS duration.
  await expect.poll(() => held.evaluate(e => Number(getComputedStyle(e).opacity))).toBeGreaterThan(0);
  expect(await held.evaluate(e => Number(getComputedStyle(e).opacity))).toBeLessThan(1);
  expect(await rest.evaluate(e => Number(getComputedStyle(e).opacity))).toBe(1);
  await page.locator('[data-shape="rest"]').click();
  await page.locator('[data-shape="held"]').click();
  await expect(page.locator('#shape-caption')).toContainText('Held open,');
  await finished(page.locator('#shape-caption'));
  await expect(held).toHaveCSS('opacity', '1');
  await page.locator('[data-shape="held"]').click();
  await expect(page.locator('[data-shape="held"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(box).not.toHaveAttribute('aria-pressed');
  expect(Math.abs((await box.boundingBox()).height - height)).toBeLessThan(1);
  await expect(held).toHaveAttribute('aria-hidden', 'false');
  await expect(rest).toHaveAttribute('aria-hidden', 'true');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(held).toHaveAttribute('aria-hidden', 'false');
  await expect(rest).toHaveAttribute('aria-hidden', 'false');
  expect((await held.boundingBox()).y).toBeGreaterThan((await rest.boundingBox()).y);
});

test('RALLY rapid contact choices fade to the latest caption and settle on reduced motion', async ({ page }) => {
  await open(page, 'rally/#ch03', 'RALLY');
  const caption = page.locator('#contact-caption');
  await page.locator('[data-contact="contact"]').click();
  await expect.poll(() => caption.evaluate(e => e.getAnimations().length)).toBe(1);
  await page.locator('[data-contact="after"]').click();
  await expect(caption).toContainText('After contact.');
  await finished(caption);
  await expect(page.locator('[data-contact="after"]')).toHaveAttribute('aria-pressed', 'true');
  // Start another swap and change the OS preference before its fade-out ends.
  await page.locator('[data-contact="before"]').click();
  await expect.poll(() => caption.evaluate(e => e.getAnimations().length)).toBe(1);
  await caption.evaluate(e => e.getAnimations().forEach(animation => animation.pause()));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
  expect(await caption.textContent()).toContain('Before contact.');
  expect(await caption.evaluate(e => e.getAnimations().length)).toBe(0);
  await page.locator('[data-contact="contact"]').click();
  expect(await caption.textContent()).toContain('Contact. A short compression');
  expect(await caption.evaluate(e => e.getAnimations().length)).toBe(0);
});

test('RALLY replay retains its button contents between state changes', async ({ page }) => {
  await open(page, 'rally/#ch09', 'RALLY');
  await page.locator('#replay-reset').click();
  await page.locator('#replay-play').click();
  await expect(page.locator('#ch09')).toHaveAttribute('data-playing', 'true');
  const result = await page.locator('#replay-play').evaluate(button => new Promise(resolve => {
    const icon = button.querySelector('svg');
    const start = Number(document.querySelector('#ch09').dataset.replayTime);
    const observer = new MutationObserver(records => mutations += records.length);
    let mutations = 0, frames = 0;
    observer.observe(button, { childList: true, subtree: true });
    const sample = () => {
      if (++frames < 12) { requestAnimationFrame(sample); return; }
      observer.disconnect();
      resolve({ mutations, sameIcon: icon === button.querySelector('svg'), advanced: Number(document.querySelector('#ch09').dataset.replayTime) > start });
    };
    requestAnimationFrame(sample);
  }));
  expect(result).toEqual({ mutations: 0, sameIcon: true, advanced: true });
  await page.locator('#replay-play').click();
  await expect(page.locator('#ch09')).toHaveAttribute('data-playing', 'false');
  await expect(page.locator('#replay-play')).toContainText('Play rally');
});

test('CHRYSALIS settles an unchanged stage label when motion is reduced mid-transition', async ({ page }) => {
  await open(page, 'chrysalis/', 'CHRYSALIS');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const wrapper = page.locator('.transition-wrap').first();
  const stage = wrapper.locator('.transition-stage');
  await finished(stage);
  await wrapper.locator('.chapter-transition').evaluate(marker => {
    const box = marker.getBoundingClientRect();
    scrollTo({ top: scrollY + box.top + box.height * .35 - innerHeight * .5, behavior: 'instant' });
  });
  await expect(wrapper).toHaveAttribute('data-stage', '25');
  await expect.poll(() => stage.evaluate(e => e.getAnimations().length)).toBe(1);
  await stage.evaluate(e => e.getAnimations().forEach(animation => animation.pause()));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
  await expect(wrapper).toHaveAttribute('data-stage', '25');
  await expect(stage).toHaveText('The view backs away along the vein.');
  expect(await stage.evaluate(e => e.getAnimations().length)).toBe(0);
});
