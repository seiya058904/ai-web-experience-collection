import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const { fonts } = JSON.parse(await readFile(new URL('../../provenance/collection/font-subsets.json', import.meta.url)));
test.use({ reducedMotion: 'reduce' });

test('Collection subsets cover rendered copy and retain original text geometry', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => document.fonts.ready);
  const problems = await page.evaluate(async fonts => {
    const problems = [], references = new Map();
    const rules = [...document.styleSheets].flatMap(sheet => [...sheet.cssRules]);
    for (const [i, font] of fonts.entries()) {
      const rule = rules.find(rule => rule instanceof CSSFontFaceRule &&
        rule.style.fontFamily.replace(/["']/g, '') === font.cssFamily);
      if (!rule) { problems.push(`No face declaration: ${font.cssFamily}`); continue; }
      const family = `CollectionOriginal${i}`;
      const reference = new FontFace(family, `url(${new URL(font.source, location.href)})`, {
        weight: rule.style.fontWeight || 'normal', style: rule.style.fontStyle || 'normal',
        stretch: rule.style.fontStretch || 'normal',
      });
      document.fonts.add(await reference.load());
      references.set(font.cssFamily, { family, covered: new Set(font.characters + font.originalFallbackCharacters), count: 0 });
    }
    const walker = document.createTreeWalker(document.querySelector('.worlds'), NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent.trim()) continue;
      const parent = node.parentElement, style = getComputedStyle(parent);
      const family = style.fontFamily.split(',')[0].trim().replace(/["']/g, '');
      const reference = references.get(family);
      if (!reference) continue;
      reference.count++;
      let text = node.textContent.replace(/\s+/g, ' ');
      if (style.textTransform === 'uppercase') text = text.toUpperCase();
      if (style.textTransform === 'lowercase') text = text.toLowerCase();
      for (const char of text) if (!reference.covered.has(char)) problems.push(`${family}: missing ${JSON.stringify(char)}`);
      const range = document.createRange(); range.selectNodeContents(node);
      const measure = () => [...range.getClientRects()].map(r => [r.x, r.y, r.width, r.height]);
      const actual = measure(), previous = parent.style.fontFamily;
      parent.style.fontFamily = `"${reference.family}"`;
      const original = measure(); parent.style.fontFamily = previous;
      if (actual.length !== original.length || actual.some((rect, i) => rect.some((n, j) => Math.abs(n - original[i][j]) > .03))) {
        problems.push(`${family}: geometry changed for ${text}`);
      }
    }
    for (const [family, reference] of references) if (!reference.count) problems.push(`No rendered specimen for ${family}`);
    return problems;
  }, fonts);
  expect(problems).toEqual([]);
});
