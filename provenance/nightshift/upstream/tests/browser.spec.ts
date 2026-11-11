import { test, expect, type Page, type Locator } from '@playwright/test';

const CHAPTERS = [
  ['ch-01', 'Someone is still awake.', 'hero'],
  ['ch-02', 'Different places. One night.', 'atlas'],
  ['ch-03', 'The first loaf starts in darkness.', 'bakery-before'],
  ['ch-04', 'Care has no closing hour.', 'care'],
  ['ch-05', 'Morning has to be made.', 'curb-before'],
  ['ch-06', 'The interval belongs to the workers.', 'rail'],
  ['ch-07', 'The city carries water in silence.', 'water'],
  ['ch-08', 'Continuity is a kind of care.', 'utility'],
  ['ch-09', 'Color arrives by hand.', 'market'],
  ['ch-10', 'The first passengers arrive.', 'platform'],
  ['ch-11', 'By morning, the traces remain.', 'dawn'],
] as const;

const ROUTES = [
  ['bakery', 'ch-03'], ['care', 'ch-04'], ['streets', 'ch-05'],
  ['transit', 'ch-06'], ['utilities', 'ch-07'],
] as const;

const TRACES = [
  ['bakery', 'The bakery', 'ch-03'],
  ['care', 'The quiet corridor', 'ch-04'],
  ['streets', 'The curb', 'ch-05'],
  ['transit', 'The first service', 'ch-06'],
  ['water', 'The rooms below', 'ch-07'],
  ['market', 'The market', 'ch-09'],
] as const;

const pageErrors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const errors: string[] = [];
  pageErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
});
test.afterEach(async ({ page }, info) => {
  const errors = pageErrors.get(page) ?? [];
  if (errors.length) await info.attach('uncaught-page-errors', { body: JSON.stringify(errors, null, 2), contentType: 'application/json' });
  expect(errors, 'The actual browser must not raise an uncaught application error.').toEqual([]);
});

async function activate(locator: Locator): Promise<void> {
  if (test.info().project.name === 'mobile') await locator.tap();
  else await locator.click();
}

async function ready(page: Page, hash = '', waitForFonts = true): Promise<void> {
  await page.goto(`/${hash ? `#${hash}` : ''}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  if (waitForFonts) await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await expect(page.locator('.chapter')).toHaveCount(11);
}

function chapterHeading(page: Page, id: string): Locator {
  return page.locator(id === 'ch-01' ? '#hero-title' : `#title-${id}`);
}

async function goChapter(page: Page, id: string, keyboard = false): Promise<void> {
  const opener = page.locator('.site-header [data-open-dialog="chapters"]');
  if (keyboard) {
    await opener.focus();
    await opener.press('Enter');
  } else await activate(opener);
  await expect(page.locator('#dialog-chapters')).toBeVisible();
  const link = page.locator(`#dialog-chapters a[href="#${id}"]`);
  if (keyboard) {
    await link.focus();
    await link.press('Enter');
  } else await activate(link);
  await expect(page.locator('#dialog-chapters')).not.toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-chapter', id);
  await expect(chapterHeading(page, id)).toBeFocused();
}

async function loadedImage(locator: Locator): Promise<void> {
  await expect(locator).toHaveCount(1);
  await expect.poll(() => locator.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
}

async function sceneKey(page: Page, key: string): Promise<void> {
  await expect(page.locator('.stage-layer--base')).toHaveAttribute('data-key', key);
  await loadedImage(page.locator('.stage-layer--base img'));
  await expect(page.locator('.stage-layer--base img')).toHaveAttribute('src', new RegExp(`/${key}\\.webp$`));
}

async function noHorizontalOverflow(page: Page): Promise<void> {
  const size = await page.evaluate(() => ({
    viewport: innerWidth,
    root: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    offenders: [...document.querySelectorAll('main *, header *, footer *, dialog[open] *')]
      .filter(element => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && (rect.left < -1 || rect.right > innerWidth + 1);
      })
      .slice(0, 12)
      .map(element => ({ tag: element.tagName, id: element.id, class: element.getAttribute('class'), text: element.textContent?.trim().slice(0, 60) })),
  }));
  expect(size.root, JSON.stringify(size)).toBeLessThanOrEqual(size.viewport);
  expect(size.body, JSON.stringify(size)).toBeLessThanOrEqual(size.viewport);
}

async function headingFits(page: Page, locator: Locator): Promise<void> {
  await expect(locator).toBeVisible();
  const bounds = await locator.boundingBox();
  const viewport = page.viewportSize()!;
  expect(bounds).not.toBeNull();
  expect(bounds!.width).toBeGreaterThan(0);
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width + .5);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height + .5);
}

async function noHeadingCollision(page: Page): Promise<void> {
  const overlaps = await page.evaluate(() => {
    const headings = [...document.querySelectorAll<HTMLElement>('main h1, .chapter h2')]
      .map(element => ({ id: element.id, rect: element.getBoundingClientRect(), opacity: Number(getComputedStyle(element).opacity) }))
      .filter(item => item.opacity > 0 && item.rect.bottom > 0 && item.rect.top < innerHeight && item.rect.width > 0);
    const pairs: string[] = [];
    for (let a = 0; a < headings.length; a++) {
      for (let b = a + 1; b < headings.length; b++) {
        const x = Math.min(headings[a].rect.right, headings[b].rect.right) - Math.max(headings[a].rect.left, headings[b].rect.left);
        const y = Math.min(headings[a].rect.bottom, headings[b].rect.bottom) - Math.max(headings[a].rect.top, headings[b].rect.top);
        if (x > 1 && y > 1) pairs.push(`${headings[a].id} / ${headings[b].id}`);
      }
    }
    return pairs;
  });
  expect(overlaps, 'Distinct active chapter headings must not overlap.').toEqual([]);
}

async function seekTransition(page: Page, index: number, progress: number): Promise<{ actual: number; id: string }> {
  const id = `tr-${String(index + 1).padStart(2, '0')}-${String(index + 2).padStart(2, '0')}`;
  const position = await page.locator(`#${id}`).evaluate((element, p) => {
    const rect = element.getBoundingClientRect();
    const start = rect.top + scrollY - innerHeight * .70;
    const end = rect.bottom + scrollY - innerHeight * .12;
    // Browser scroll coordinates can round to CSS pixels. Keep endpoint probes
    // inside the measured boundary and midpoint probes on the target side.
    const requested = p === 0 ? start + .75 : p === 1 ? end - .75 : start + (end - start) * p;
    return { y: p === 1 ? Math.floor(requested) : Math.ceil(requested), start, end };
  }, progress);
  await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), position.y);
  await expect(page.locator('body')).toHaveAttribute('data-transition', id);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(position.y, 0);
  await expect.poll(async () => Number(await page.locator('body').getAttribute('data-transition-progress'))).toBeCloseTo(progress, 2);
  return { actual: Number(await page.locator('body').getAttribute('data-transition-progress')), id };
}

async function assertTransitionPicture(page: Page, index: number, actual: number): Promise<void> {
  const hero = (page.viewportSize()?.width ?? 1440) < 640 ? 'hero-mobile' : 'hero';
  const source = index === 0 ? hero : CHAPTERS[index][2];
  const target = index === 8 ? 'platform-before' : CHAPTERS[index + 1][2];
  const stage = page.locator('#stage');
  if (index === 5) {
    // The displayed progress is rounded to four decimals. At exactly the
    // reported midpoint either adjacent phase may own the fractional pixel.
    const phase = await stage.getAttribute('data-phase');
    expect(['source-to-midpoint', 'midpoint-to-target']).toContain(phase);
    if (actual < .499) expect(phase).toBe('source-to-midpoint');
    if (actual > .501) expect(phase).toBe('midpoint-to-target');
    await expect(stage).toHaveAttribute('data-source', phase === 'source-to-midpoint' ? source : 'rail-water-midpoint');
    await expect(stage).toHaveAttribute('data-target', phase === 'source-to-midpoint' ? 'rail-water-midpoint' : target);
  } else {
    await expect(stage).toHaveAttribute('data-source', source);
    await expect(stage).toHaveAttribute('data-target', target);
  }
  await loadedImage(page.locator('.stage-layer--base img'));
  if (actual > 0) {
    await loadedImage(page.locator('.stage-layer--next img'));
  }
  const picture = await page.locator('#stage').evaluate(element => {
    const base = element.querySelector<HTMLElement>('.stage-layer--base')!;
    const next = element.querySelector<HTMLElement>('.stage-layer--next')!;
    const baseImage = base.querySelector('img');
    const nextImage = next.querySelector('img');
    const rect = base.getBoundingClientRect();
    return {
      width: rect.width, height: rect.height,
      viewportWidth: innerWidth, viewportHeight: innerHeight,
      baseOpacity: getComputedStyle(base).opacity,
      nextOpacity: getComputedStyle(next).opacity,
      clip: next.style.clipPath,
      baseReady: Boolean(baseImage?.complete && baseImage.naturalWidth),
      nextReady: Boolean(nextImage?.complete && nextImage.naturalWidth),
    };
  });
  expect(picture.width).toBeGreaterThanOrEqual(picture.viewportWidth);
  expect(picture.height).toBeGreaterThanOrEqual(picture.viewportHeight);
  expect(picture.baseOpacity).toBe('1');
  expect(picture.nextOpacity).toBe('1');
  expect(picture.baseReady || picture.nextReady).toBe(true);
  expect(picture.clip).toMatch(/^inset\(/);
  expect(picture.clip).not.toContain('NaN');
  await noHeadingCollision(page);
}

test('eleven complete English chapters, real anchors, meaningful hero, and primary CTA', async ({ page }) => {
  await ready(page);
  await expect(page).toHaveTitle('NIGHTSHIFT — The city does not sleep at once');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#hero-title')).toHaveText('While the city sleeps');
  await sceneKey(page, test.info().project.name === 'mobile' ? 'hero-mobile' : 'hero');
  for (const [id, heading] of CHAPTERS) {
    await expect(page.locator(`#${id} h2`).first()).toHaveText(heading);
    await expect(page.locator(`#${id} [data-beat="2"]`)).toHaveCount(1);
    expect((await page.locator(`#${id} [data-beat="2"] h3`).innerText()).trim().length).toBeGreaterThan(8);
    expect((await page.locator(`#${id} [data-beat="2"] p`).first().innerText()).trim().length).toBeGreaterThan(40);
    expect((await page.locator(`#${id}`).innerText()).trim().length).toBeGreaterThan(120);
  }
  const audit = await page.evaluate(() => ({
    missingTargets: [...document.querySelectorAll<HTMLAnchorElement>('a[data-chapter-link]')]
      .filter(link => !document.getElementById(link.hash.slice(1)))
      .map(link => link.getAttribute('href')),
    cjk: /[\u3400-\u9fff]/.test(document.body.innerText + [...document.querySelectorAll('[alt], [aria-label]')]
      .map(element => `${element.getAttribute('alt') ?? ''} ${element.getAttribute('aria-label') ?? ''}`).join(' ')),
  }));
  expect(audit.missingTargets).toEqual([]);
  expect(audit.cjk).toBe(false);
  await noHorizontalOverflow(page);
  await headingFits(page, page.locator('#hero-title'));
  await activate(page.getByRole('link', { name: 'Follow the night', exact: true }));
  await expect(page.locator('body')).toHaveAttribute('data-chapter', 'ch-02');
  await expect(page.locator('#title-ch-02')).toBeFocused();
});

test('chapter menu navigates all eleven chapters with keyboard focus and real scene ownership', async ({ page }) => {
  await ready(page);
  for (const [id, , image] of CHAPTERS) {
    await goChapter(page, id, true);
    const key = id === 'ch-01' && test.info().project.name === 'mobile' ? 'hero-mobile'
      : id === 'ch-10' ? 'platform-before' : image;
    await sceneKey(page, key);
    await expect(page.locator(`.chapter-rail a[href="#${id}"]`)).toHaveAttribute('aria-current', 'location');
  }
  await goChapter(page, 'ch-01');
  await expect(page.locator('#hero-title')).toBeFocused();
});

test('hero-to-atlas can be paused and returned three times without replay or an empty scene', async ({ page }) => {
  await ready(page);
  const key = test.info().project.name === 'mobile' ? 'hero-mobile' : 'hero';
  const original = await page.locator('.stage-layer--base img').getAttribute('src');
  for (let round = 0; round < 3; round++) {
    await page.mouse.wheel(0, 160);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
    for (const p of [.25, .5, .75, .5, .25]) {
      const state = await seekTransition(page, 0, p);
      await assertTransitionPicture(page, 0, state.actual);
    }
    await goChapter(page, 'ch-01');
    await sceneKey(page, key);
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    await expect(page.locator('#hero-title')).toBeVisible();
    const restored = await page.locator('.stage-layer--base img').getAttribute('src');
    expect(restored?.endsWith(`/${key}.webp`)).toBe(true);
    expect(original?.endsWith(`/${key}.webp`)).toBe(true);
  }
});

test('all ten transitions render five stages, direct midpoints, and reversible high-risk seams', async ({ page }) => {
  test.setTimeout(120_000);
  // A fresh transition hash must establish the midpoint without prior playback.
  await ready(page, 'tr-01-02');
  await expect(page.locator('body')).toHaveAttribute('data-transition', 'tr-01-02');
  await expect.poll(async () => Number(await page.locator('body').getAttribute('data-transition-progress'))).toBeCloseTo(.5, 2);
  await expect(page.locator('.transition[data-transition]')).toHaveCount(10);
  for (let index = 0; index < 10; index++) {
    const direct = await seekTransition(page, index, .5);
    await assertTransitionPicture(page, index, direct.actual);
    await expect(page.locator('body')).toHaveAttribute('data-chapter', CHAPTERS[index + 1][0]);
    for (const p of [0, .25, .5, .75, 1]) {
      const state = await seekTransition(page, index, p);
      await assertTransitionPicture(page, index, state.actual);
      if (p === .5) await expect(page.locator('body')).toHaveAttribute('data-chapter', CHAPTERS[index + 1][0]);
    }
    const reverse = await seekTransition(page, index, .25);
    await assertTransitionPicture(page, index, reverse.actual);
  }
  for (const index of [0, 4, 5]) {
    for (const p of [.49, .51, .5, .49]) {
      const state = await seekTransition(page, index, p);
      await assertTransitionPicture(page, index, state.actual);
    }
  }
});

test('atlas filters keep other routes visible, explain each choice, and navigate to its chapter', async ({ page }) => {
  await ready(page, 'ch-02');
  for (const [route, chapter] of ROUTES) {
    await activate(page.locator(`[data-route-filter="${route}"]`));
    await expect(page.locator(`[data-route-filter="${route}"]`)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator(`.route-layer[data-route="${route}"]`)).toHaveCSS('opacity', '1');
    await expect(page.locator('#route-link')).toHaveAttribute('href', `#${chapter}`);
    expect((await page.locator('#route-description').innerText()).length).toBeGreaterThan(40);
    const opacities = await page.locator('.route-layer').evaluateAll(layers => layers.map(layer => Number(getComputedStyle(layer).opacity)));
    expect(opacities.every(opacity => opacity > 0)).toBe(true);
    expect(opacities.filter(opacity => opacity === 1)).toHaveLength(1);
  }
  const all = page.locator('[data-route-filter="all"]');
  await activate(all);
  await expect(all).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#route-link')).toHaveAttribute('href', '#ch-03');
  await all.focus();
  await all.press('ArrowRight');
  await expect(page.locator('[data-route-filter="bakery"]')).toBeFocused();
  await expect(page.locator('[data-route-filter="bakery"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-route-filter="bakery"]').press('End');
  await expect(page.locator('[data-route-filter="utilities"]')).toBeFocused();
  await activate(page.locator('#route-link'));
  await expect(page.locator('#title-ch-07')).toBeFocused();
  await sceneKey(page, 'water');
});

test('curb comparison uses different images and supports buttons, arrow keys, reset, and return', async ({ page }) => {
  await ready(page, 'ch-05');
  const range = page.locator('#curb-range');
  await loadedImage(page.locator('.comparison-before img'));
  await loadedImage(page.locator('.comparison-after img'));
  const sources = await page.locator('.comparison img').evaluateAll(images => images.map(image => (image as HTMLImageElement).src));
  expect(sources[0]).not.toBe(sources[1]);
  await activate(page.locator('[data-compare="before"]'));
  await expect(range).toHaveValue('0');
  await expect(page.locator('.comparison')).toHaveCSS('--reveal', '0%');
  await activate(page.locator('[data-compare="after"]'));
  await expect(range).toHaveValue('100');
  await expect(page.locator('.comparison')).toHaveCSS('--reveal', '100%');
  await range.focus();
  await range.press('ArrowLeft');
  await expect(range).toHaveValue('99');
  await expect(range).toHaveAttribute('aria-valuetext', '99% After, 1% Before');
  await activate(page.locator('[data-compare="reset"]'));
  await expect(range).toHaveValue('50');
  await range.focus();
  await range.press('ArrowRight');
  await range.press('ArrowRight');
  await range.press('ArrowRight');
  await expect(range).toHaveValue('53');
  await goChapter(page, 'ch-06');
  await goChapter(page, 'ch-05');
  await expect(range).toHaveValue('53');
  await activate(page.locator('[data-compare="reset"]'));
  await expect(range).toHaveValue('50');
});

test('bakery and market change real variants while rail, water, utility, and recall controls reveal their content', async ({ page }) => {
  await ready(page, 'ch-03');
  for (const value of ['after', 'before']) {
    await activate(page.locator(`[data-bakery="${value}"]`));
    await expect(page.locator(`[data-bakery="${value}"]`)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#bakery-detail-image')).toHaveAttribute('data-media-key', `bakery-${value}`);
    await loadedImage(page.locator('#bakery-detail-image'));
    await expect(page.locator('#bakery-detail-image')).toHaveAttribute('src', new RegExp(`/bakery-${value}\\.webp$`));
  }
  await goChapter(page, 'ch-06');
  await activate(page.locator('[data-rail="section"]'));
  await expect(page.locator('#rail-section')).toBeVisible();
  await expect(page.locator('#rail-surface')).toBeHidden();
  await expect(page.locator('#rail-section')).toContainText(/conceptual|illustrative/i);
  await activate(page.locator('[data-rail="surface"]'));
  await expect(page.locator('#rail-surface')).toBeVisible();
  await expect(page.locator('#rail-section')).toBeHidden();
  for (const [id, button, panel] of [
    ['ch-07', '[data-water]', '#water-diagram'],
    ['ch-08', '[data-utility]', '#utility-diagram'],
  ]) {
    await goChapter(page, id);
    await activate(page.locator(button));
    await expect(page.locator(button)).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator(panel)).toBeVisible();
    await activate(page.locator(button));
    await expect(page.locator(button)).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator(panel)).toBeHidden();
  }
  await goChapter(page, 'ch-09');
  for (const [value, key] of [['first-light', 'market-after'], ['night', 'market']]) {
    await activate(page.locator(`[data-market="${value}"]`));
    await expect(page.locator(`[data-market="${value}"]`)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#market-detail-image')).toHaveAttribute('data-media-key', key);
    await loadedImage(page.locator('#market-detail-image'));
    await expect(page.locator('#market-detail-image')).toHaveAttribute('src', new RegExp(`/${key}\\.webp$`));
  }
  await goChapter(page, 'ch-10');
  await sceneKey(page, 'platform-before');
  await expect(page.locator('#stage')).toHaveAttribute('data-target', 'platform');
  await expect(page.locator('#stage')).toHaveAttribute('data-platform-progress', '0.0000');
  await expect(page.locator('.stage-layer--next')).toBeHidden();
  const arrivalPosition = await page.locator('#ch-10').evaluate(element => ({ top: element.getBoundingClientRect().top + scrollY, height: innerHeight }));
  const arrivalMiddle = Math.ceil(arrivalPosition.top + arrivalPosition.height * .375);
  await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), arrivalMiddle);
  await expect.poll(async () => Number(await page.locator('#stage').getAttribute('data-platform-progress'))).toBeCloseTo(.5, 2);
  await loadedImage(page.locator('.stage-layer--next img'));
  await expect(page.locator('.stage-layer--next')).toHaveAttribute('data-key', 'platform');
  const middleClip = await page.locator('.stage-layer--next').evaluate(element => (element as HTMLElement).style.clipPath);
  const pausedArrival = await page.locator('#stage').getAttribute('data-platform-progress');
  await page.waitForTimeout(250);
  await expect(page.locator('#stage')).toHaveAttribute('data-platform-progress', pausedArrival!);
  await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), Math.ceil(arrivalPosition.top + arrivalPosition.height * .66));
  await expect(page.locator('#stage')).toHaveAttribute('data-platform-progress', '1.0000');
  await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), arrivalMiddle);
  await expect.poll(async () => Number(await page.locator('#stage').getAttribute('data-platform-progress'))).toBeCloseTo(.5, 2);
  expect(await page.locator('.stage-layer--next').evaluate(element => (element as HTMLElement).style.clipPath)).toBe(middleClip);
  await activate(page.locator('.night-recall summary'));
  await expect(page.locator('.night-recall')).toHaveAttribute('open', '');
  await activate(page.locator('.night-recall a[href="#ch-06"]'));
  await expect(page.locator('#title-ch-06')).toBeFocused();
});

test('fiction, care, and about dialogs close with Escape and return focus without moving the page', async ({ page }) => {
  await ready(page);
  for (const [chapter, kind, expected] of [
    ['ch-01', 'fiction', 'Meridian City is an original fictional composite.'],
    ['ch-04', 'care', 'without showing patients'],
  ]) {
    await goChapter(page, chapter);
    const opener = page.locator(`[data-note="${kind}"]`);
    await opener.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => scrollY);
    await activate(opener);
    await expect(page.locator('#dialog-note')).toBeVisible();
    await expect(page.locator('#note-body')).toContainText(expected);
    await expect(page.locator('body')).toHaveAttribute('data-dialog-open', 'true');
    await page.keyboard.press('Tab');
    const focus = await page.evaluate(() => ({
      inside: Boolean(document.activeElement?.closest('#dialog-note')),
      browserChrome: document.activeElement === document.body && !document.hasFocus(),
    }));
    // A native one-button modal may Tab to browser chrome (BODY + no document
    // focus), which is not background-page focus leakage. Reverse Tab must
    // return to the modal, and no background page control may receive focus.
    expect(focus.inside || focus.browserChrome).toBe(true);
    await page.keyboard.press('Shift+Tab');
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest('#dialog-note')))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.locator('#dialog-note')).toBeHidden();
    await expect(opener).toBeFocused();
    expect(Math.abs(await page.evaluate(() => scrollY) - before)).toBeLessThanOrEqual(2);
  }
  const about = test.info().project.name === 'mobile'
    ? page.locator('.site-footer [data-open-dialog="about"]')
    : page.locator('.site-header [data-open-dialog="about"]');
  await activate(about);
  await expect(page.locator('#dialog-about')).toBeVisible();
  await expect(page.locator('#dialog-about')).toContainText('fictional composite');
  await page.keyboard.press('Escape');
  await expect(about).toBeFocused();
  await expect(page.locator('body')).toHaveAttribute('data-dialog-open', 'false');
});

test('all six morning traces work from a direct finale visit and restore the exact invoker', async ({ page }) => {
  await ready(page, 'ch-11');
  await expect(page.locator('body')).toHaveAttribute('data-chapter', 'ch-11');
  await sceneKey(page, 'dawn');
  for (const [id, label, chapter] of TRACES) {
    const opener = page.locator(`[data-trace="${id}"]`);
    await opener.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => scrollY);
    await activate(opener);
    await expect(page.locator('#dialog-trace')).toBeVisible();
    await expect(page.locator('#trace-title')).toHaveText(label);
    expect((await page.locator('#trace-before').innerText()).length).toBeGreaterThan(20);
    expect((await page.locator('#trace-after').innerText()).length).toBeGreaterThan(20);
    await expect(page.locator('#trace-return')).toHaveAttribute('href', `#${chapter}`);
    await loadedImage(page.locator('#trace-image'));
    await activate(page.getByRole('button', { name: 'Back to dawn', exact: true }));
    await expect(page.locator('#dialog-trace')).toBeHidden();
    await expect(opener).toBeFocused();
    expect(Math.abs(await page.evaluate(() => scrollY) - before)).toBeLessThanOrEqual(2);
  }
  await activate(page.locator('[data-trace="transit"]'));
  await activate(page.locator('#trace-return'));
  await expect(page.locator('#dialog-trace')).toBeHidden();
  await expect(page.locator('#title-ch-06')).toBeFocused();
});

test('sound is opt-in and actually suspends; reduced motion retains complete content and interactions', async ({ page }) => {
  await page.addInitScript(() => {
    const contexts: AudioContext[] = [];
    (window as unknown as { __nightshiftAudioContexts: AudioContext[] }).__nightshiftAudioContexts = contexts;
    const NativeAudio = window.AudioContext;
    if (NativeAudio) window.AudioContext = class extends NativeAudio {
      constructor(options?: AudioContextOptions) { super(options); contexts.push(this); }
    };
  });
  await ready(page);
  const audioStates = () => page.evaluate(() => (window as unknown as { __nightshiftAudioContexts: AudioContext[] }).__nightshiftAudioContexts.map(context => context.state));
  await expect(page.locator('[data-sound]')).toHaveText('Sound: Off');
  expect(await audioStates()).toEqual([]);
  await activate(page.locator('[data-sound]'));
  await expect(page.locator('[data-sound]')).toHaveText('Sound: On');
  await expect.poll(audioStates).toEqual(['running']);
  await activate(page.locator('[data-sound]'));
  await expect(page.locator('[data-sound]')).toHaveText('Sound: Off');
  await expect.poll(audioStates).toEqual(['suspended']);
  await activate(page.locator('[data-motion-toggle]'));
  await expect(page.locator('body')).toHaveAttribute('data-motion', 'reduced');
  await expect(page.locator('.chapter')).toHaveCount(11);
  await expect(page.locator('[data-beat="2"]')).toHaveCount(11);
  await goChapter(page, 'ch-05');
  await activate(page.locator('[data-compare="after"]'));
  await expect(page.locator('#curb-range')).toHaveValue('100');
  await activate(page.locator('[data-compare="reset"]'));
  await expect(page.locator('#curb-range')).toHaveValue('50');
  await goChapter(page, 'ch-02');
  await activate(page.locator('[data-route-filter="care"]'));
  await expect(page.locator('#route-link')).toHaveAttribute('href', '#ch-04');
  await goChapter(page, 'ch-10');
  await sceneKey(page, 'platform');
  await expect(page.locator('.stage-layer--next')).toBeHidden();
  await goChapter(page, 'ch-11');
  await activate(page.locator('[data-trace="water"]'));
  await expect(page.locator('#trace-return')).toHaveAttribute('href', '#ch-07');
  await page.keyboard.press('Escape');
  await activate(page.locator('[data-motion-toggle]'));
  await expect(page.locator('body')).toHaveAttribute('data-motion', 'full');
});

test('hash reload, history, fast jumps, and responsive resize preserve chapter and media identity', async ({ page }) => {
  await ready(page, 'ch-07');
  await expect(page.locator('body')).toHaveAttribute('data-chapter', 'ch-07');
  await sceneKey(page, 'water');
  const initialY = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 180);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(initialY + 30);
  await expect.poll(() => page.evaluate(() => Math.abs((history.state?.nightshift?.y ?? -1000) - scrollY))).toBeLessThan(2);
  const savedY = await page.evaluate(() => history.state.nightshift.y as number);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('body')).toHaveAttribute('data-chapter', 'ch-07');
  await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(savedY, 0);
  await goChapter(page, 'ch-03');
  await goChapter(page, 'ch-09');
  await page.goBack();
  await expect(page.locator('body')).toHaveAttribute('data-chapter', 'ch-03');
  await sceneKey(page, 'bakery-before');
  await page.goForward();
  await expect(page.locator('body')).toHaveAttribute('data-chapter', 'ch-09');
  await sceneKey(page, 'market');
  await page.evaluate(() => { location.hash = 'ch-02'; location.hash = 'ch-06'; location.hash = 'ch-11'; });
  await expect(page.locator('body')).toHaveAttribute('data-chapter', 'ch-11');
  await sceneKey(page, 'dawn');
  await page.setViewportSize(test.info().project.name === 'desktop' ? { width: 390, height: 844 } : { width: 768, height: 1024 });
  // Observe identity after the resize debounce, rather than accepting the old
  // dataset value synchronously before the controller has remeasured anything.
  await page.waitForTimeout(300);
  await expect.poll(() => page.locator('body').getAttribute('data-chapter')).toBe('ch-11');
  await sceneKey(page, 'dawn');
  await noHorizontalOverflow(page);
});

test('failed primary imagery uses the correct local still and Retry restores the same scene', async ({ page }) => {
  await page.route('**/media/water.webp', route => route.abort('failed'));
  await ready(page, 'ch-07');
  await expect(page.locator('body')).toHaveAttribute('data-chapter', 'ch-07');
  await sceneKey(page, 'water');
  await expect(page.locator('.stage-layer--base img')).toHaveAttribute('src', /\/media\/fallback\/water\.webp$/);
  await expect(page.locator('#scene-status')).toBeVisible();
  await expect(page.locator('#scene-status')).toContainText('The story remains available in still view.');
  await page.unroute('**/media/water.webp');
  await activate(page.locator('[data-retry]'));
  await expect(page.locator('.stage-layer--base img')).toHaveAttribute('src', /\/media\/water\.webp$/);
  await loadedImage(page.locator('.stage-layer--base img'));
  await expect(page.locator('#scene-status')).toBeHidden();
});

test('all-image failure preserves all text and interactions, including the still-view escape', async ({ page }) => {
  await page.route('**/media/**', route => route.abort('failed'));
  await ready(page, 'ch-06');
  await expect(page.locator('#title-ch-06')).toBeVisible();
  await expect(page.locator('#scene-status')).toBeVisible();
  await activate(page.locator('[data-rail="section"]'));
  await expect(page.locator('#rail-section')).toBeVisible();
  await activate(page.locator('#scene-status [data-stills]'));
  await expect(page.locator('body')).toHaveAttribute('data-motion', 'stills');
  await expect(page.locator('.chapter')).toHaveCount(11);
  await expect(page.locator('[data-beat="2"]')).toHaveCount(11);
  await goChapter(page, 'ch-02');
  await activate(page.locator('[data-route-filter="utilities"]'));
  await expect(page.locator('#route-description')).toContainText('Beyond the road');
  await goChapter(page, 'ch-05');
  await activate(page.locator('[data-compare="after"]'));
  await expect(page.locator('#curb-range')).toHaveValue('100');
  await goChapter(page, 'ch-11');
  await expect(page.locator('[data-trace]')).toHaveCount(6);
  await activate(page.locator('[data-trace="care"]'));
  await expect(page.locator('#trace-before')).toContainText('Water and linen');
  await expect(page.locator('#trace-after')).toContainText('ready when needed');
  await page.keyboard.press('Escape');
  await noHorizontalOverflow(page);
});

test('system reduced motion and unavailable WebGL preserve the complete narrative', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null;
      return original.call(this, type as '2d', ...args as [CanvasRenderingContext2DSettings]);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await ready(page);
  await expect(page.locator('body')).toHaveAttribute('data-motion', 'reduced');
  await expect(page.locator('[data-motion-toggle]')).toHaveText('Motion: Reduced');
  for (const id of ['ch-01', 'ch-06', 'ch-11']) {
    await goChapter(page, id);
    await expect(chapterHeading(page, id)).toBeVisible();
    await loadedImage(page.locator('.stage-layer--base img'));
  }
  await goChapter(page, 'ch-02');
  await activate(page.locator('[data-route-filter="transit"]'));
  await expect(page.locator('#route-link')).toHaveAttribute('href', '#ch-06');
  await expect(page.locator('.chapter')).toHaveCount(11);
});

test('delayed fonts and art keep the first image readable; late older variants cannot replace a newer chapter', async ({ page }) => {
  let releaseFonts!: () => void;
  let releaseHero!: () => void;
  let releaseBakery!: () => void;
  const fontGate = new Promise<void>(resolve => { releaseFonts = resolve; });
  const heroGate = new Promise<void>(resolve => { releaseHero = resolve; });
  const bakeryGate = new Promise<void>(resolve => { releaseBakery = resolve; });
  let bakeryRequests = 0;
  await page.route(/\.woff2?(?:\?|$)/, async route => { await fontGate; await route.continue(); });
  await page.route(/\/media\/hero(?:-mobile)?\.webp$/, async route => { await heroGate; await route.continue(); });
  await page.route('**/media/bakery-after.webp', async route => { bakeryRequests++; await bakeryGate; await route.continue(); });
  try {
    await ready(page, '', false);
    await headingFits(page, page.locator('#hero-title'));
    await loadedImage(page.locator('.stage-layer--base img'));
    await expect(page.locator('.stage-layer--base img')).toHaveAttribute('src', /\/media\/fallback\/hero(?:-mobile)?\.webp$/);
    await noHorizontalOverflow(page);
    releaseFonts();
    releaseHero();
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    await headingFits(page, page.locator('#hero-title'));
    await goChapter(page, 'ch-03');
    await activate(page.locator('[data-bakery="after"]'));
    await expect.poll(() => bakeryRequests).toBeGreaterThan(0);
    await expect(page.locator('#bakery-detail-image')).toHaveAttribute('src', /\/media\/fallback\/bakery-after\.webp$/);
    await goChapter(page, 'ch-09');
    await activate(page.locator('[data-market="first-light"]'));
    await loadedImage(page.locator('#market-detail-image'));
    await expect(page.locator('#market-detail-image')).toHaveAttribute('src', /\/media\/market-after\.webp$/);
    // Re-enter the reading hold while retaining its selected first-light variant.
    await goChapter(page, 'ch-09');
    await sceneKey(page, 'market-after');
    const response = page.waitForResponse(/\/media\/bakery-after\.webp$/);
    releaseBakery();
    await (await response).finished();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toHaveAttribute('data-chapter', 'ch-09');
    await sceneKey(page, 'market-after');
    await expect(page.locator('#market-detail-image')).toHaveAttribute('data-media-key', 'market-after');
    await goChapter(page, 'ch-03');
    await sceneKey(page, 'bakery-after');
  } finally {
    releaseFonts(); releaseHero(); releaseBakery();
  }
});

test('supplemental viewport and breakpoint risk sweep has no overflow or clipped primary text', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'The desktop project owns this supplemental viewport sweep; mobile has its own full path.');
  test.setTimeout(180_000);
  const viewports = [
    [320, 700], [360, 640], [768, 1024], [1920, 1080], [2560, 1440], [3840, 2160],
    [800, 450], [638, 844], [640, 844], [799, 900], [801, 900],
  ];
  for (const [width, height] of viewports) {
    await test.step(`${width} x ${height} CSS pixels`, async () => {
      await page.setViewportSize({ width, height });
      await ready(page);
      await noHorizontalOverflow(page);
      await headingFits(page, page.locator('#hero-title'));
      await goChapter(page, 'ch-06');
      await headingFits(page, page.locator('#title-ch-06'));
      const midpoint = await seekTransition(page, 5, .5);
      await assertTransitionPicture(page, 5, midpoint.actual);
      await noHorizontalOverflow(page);
      await goChapter(page, 'ch-05');
      await activate(page.locator('[data-compare="after"]'));
      await expect(page.locator('#curb-range')).toHaveValue('100');
      await activate(page.locator('[data-compare="reset"]'));
      await expect(page.locator('#curb-range')).toHaveValue('50');
      await noHorizontalOverflow(page);
      await goChapter(page, 'ch-11');
      await headingFits(page, page.locator('#title-ch-11'));
      await activate(page.locator('[data-trace="market"]'));
      const dialog = await page.locator('#dialog-trace').boundingBox();
      expect(dialog).not.toBeNull();
      expect(dialog!.x).toBeGreaterThanOrEqual(0);
      expect(dialog!.x + dialog!.width).toBeLessThanOrEqual(width + .5);
      expect(dialog!.y).toBeGreaterThanOrEqual(0);
      expect(dialog!.y + dialog!.height).toBeLessThanOrEqual(height + .5);
      await page.keyboard.press('Escape');
      await noHorizontalOverflow(page);
    });
  }
});
