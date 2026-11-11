import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

// Optional arguments are additional output directories; the project dist is
// always written. No production assets or build outputs are regenerated.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const probe = await readFile(resolve(root, 'tests/native-probe.mjs'), 'utf8');
const geometry = {
  documentHeight: 28624,
  transitionId: 'tr-06-07',
  transitionTop: 13861.21875,
  transitionHeight: 730,
  referenceViewport: { width: 1363, height: 936 },
};
const metadata = {
  mode: 'Neutral top-level pacing control — not a production snapshot',
  controlId: 'neutral-static-scroll-v1',
  createdAt: new Date().toISOString(),
  geometry,
  samplerSha256: createHash('sha256').update(probe).digest('hex'),
  notes: 'The unchanged native review sampler runs on static white HTML with matching scroll geometry. No PULSE application module, images, fonts, animation, or network requests are included. Rendered transition progress and stage are intentionally absent.',
};
const html = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>PULSE — Neutral pacing control</title>
<script id="pulse-native-review-build" type="application/json">${JSON.stringify(metadata).replaceAll('<', '\\u003c')}</script>
<script>${probe.replace(/<\/script/gi, '<\\/script')}</script>
<style>
html{background:#fff;color:#222;scroll-behavior:auto}
body{margin:0;font:16px/1.5 Arial,sans-serif}
main{position:relative;height:${geometry.documentHeight}px;width:100%;box-sizing:border-box}
.control-intro{position:absolute;top:24px;left:24px;right:24px;max-width:760px}
h1{font-size:24px;margin:0 0 12px}p{margin:0 0 12px}
#${geometry.transitionId}{position:absolute;top:${geometry.transitionTop}px;left:0;right:0;height:${geometry.transitionHeight}px;box-sizing:border-box;background:#f4f4f4;border-top:1px solid #ddd;border-bottom:1px solid #ddd;padding:24px}
</style></head><body><main>
<header class="control-intro"><h1>Neutral pacing control</h1><p>Static white HTML with the same native scroll and frame-interval sampler. This is a diagnostic control, not the PULSE application.</p><p>Reference viewport: 1363 × 936 CSS pixels. Document height: 28624 pixels. Transition top: 13861.21875 pixels. Transition height: 730 pixels.</p><p>Use Measure TR-06-07 once, then Download log. Export the log before leaving or reloading this page.</p></header>
<section id="${geometry.transitionId}" aria-label="Neutral scroll measurement area"><strong>Neutral pacing control · TR-06-07 geometry</strong><p>This static region contains no artwork or animation.</p></section>
</main></body></html>`;
const directories = new Set([resolve(root, 'dist'), ...process.argv.slice(2).map(path => resolve(path))]);
for (const directory of directories) {
  await mkdir(directory, { recursive: true });
  await writeFile(resolve(directory, 'pulse-pacing-control.html'), html);
  console.log(`Created ${resolve(directory, 'pulse-pacing-control.html')}`);
}
console.log(`Unchanged native sampler SHA-256 ${metadata.samplerSha256}. Pacing measurement remains NOT TESTED until run in the browser.`);
