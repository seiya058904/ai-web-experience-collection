#!/usr/bin/env node
/**
 * Controlled browser-fault fixture generation for BERTH.
 * Run AFTER `npm run build`: node scripts/prepare-qa.mjs
 *
 * These sibling HTML files load the unchanged production bundle and stylesheet.
 * CSP or an early inline script injects specific, deliberate failures. This is
 * controlled fault injection, NOT native OS permission/device/network simulation.
 * No application markup, success state, or error outcome is manufactured here.
 * The normal dist/index.html and every compiled asset remain untouched.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDirectory = path.join(projectRoot, 'dist');
const indexPath = path.join(distDirectory, 'index.html');
const qaDirectory = path.join(distDirectory, 'qa');

const deniedStorageAndClipboard = `<script>
(() => {
  'use strict';
  // Controlled fixture only: no stored values are read, changed, or deleted.
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    get() {
      throw new DOMException('Storage blocked by the BERTH QA fixture.', 'SecurityError');
    }
  });
  const deniedClipboard = Object.freeze({
    writeText() {
      return Promise.reject(new DOMException('Clipboard write denied by the BERTH QA fixture.', 'NotAllowedError'));
    }
  });
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    get() { return deniedClipboard; }
  });
})();
</script>`;

const scenarios = [
  {
    filename: 'fail-images.html',
    label: 'All image loads denied by CSP',
    injection: '<meta http-equiv="Content-Security-Policy" content="img-src \'none\'">',
  },
  {
    filename: 'fail-fonts.html',
    label: 'Downloaded fonts denied by CSP',
    injection: '<meta http-equiv="Content-Security-Policy" content="font-src \'none\'">',
  },
  {
    filename: 'fail-storage-clipboard.html',
    label: 'Storage access throws and clipboard writes reject',
    injection: deniedStorageAndClipboard,
  },
];

async function prepare() {
  let html;
  try {
    html = await readFile(indexPath, 'utf8');
  } catch (error) {
    throw new Error('Cannot read dist/index.html. Run npm run build before preparing QA fixtures.', { cause: error });
  }

  const head = /<head\b[^>]*>/i.exec(html);
  const closingHead = /<\/head\s*>/i.exec(html);
  if (!head || !closingHead || closingHead.index <= head.index) {
    throw new Error('The production HTML does not contain a usable head element; no fixtures were written.');
  }
  const headStart = head.index + head[0].length;
  const headContents = html.slice(headStart, closingHead.index);
  if (/<base\b/i.test(headContents)) {
    throw new Error('The production HTML already contains a base element; inspect its URL behavior before generating fixtures.');
  }
  if (!/<script\b[^>]*\btype=["']module["'][^>]*\bsrc=/i.test(headContents)) {
    throw new Error('No compiled production module was found in dist/index.html; run the standard build first.');
  }

  // Leave the charset declaration early; insert before preload/script/style URLs.
  const charset = /<meta\b[^>]*\bcharset\s*=[^>]*>/i.exec(headContents);
  const insertion = charset ? headStart + charset.index + charset[0].length : headStart;
  if (/<(?:script|link|style)\b/i.test(html.slice(headStart, insertion))) {
    throw new Error('A production resource precedes the safe fixture insertion point; no fixtures were written.');
  }

  const outputs = scenarios.map(({ filename, label, injection }) => ({
    filename,
    content: html.slice(0, insertion)
      + `\n  <!-- BERTH controlled QA fixture: ${label}. Not native OS simulation. -->\n`
      + '  <base href="../">\n  '
      + injection
      + html.slice(insertion),
  }));

  await mkdir(qaDirectory, { recursive: true });
  for (const output of outputs) {
    await writeFile(path.join(qaDirectory, output.filename), output.content, 'utf8');
  }
  for (const output of outputs) console.log(`Prepared dist/qa/${output.filename}`);
  console.log('Controlled fault fixtures prepared. No browser scenarios were executed by this command.');
}

prepare().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
