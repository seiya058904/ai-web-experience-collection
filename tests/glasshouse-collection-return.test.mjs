import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

/** The interactive UI is assembled from a single root.innerHTML template. */
async function interactiveMarkup() {
  const source = await read('experiences/glasshouse/src/ui.js');
  const marker = 'root.innerHTML = `';
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, 'ui.js must build the interface through the root.innerHTML template');
  const body = source.slice(start + marker.length);
  const end = body.indexOf('`;');
  assert.notEqual(end, -1, 'the root.innerHTML template must terminate');
  return { source, template: body.slice(0, end) };
}

test('the interactive GLASSHOUSE header exposes a Collection exit that returns to the collection root', async () => {
  // Regression guard: integration commit 0c6329d deleted this anchor from the
  // rendered header, leaving only the <noscript> fallback. Without the entry the
  // user cannot leave GLASSHOUSE from the normal interactive state, so this test
  // must fail against that implementation.
  const { template } = await interactiveMarkup();

  const headerStart = template.indexOf('<header class="site-header">');
  const headerEnd = template.indexOf('</header>');
  assert.notEqual(headerStart, -1, 'the interactive template must contain the site header');
  assert.notEqual(headerEnd, -1, 'the site header must be closed');
  const header = template.slice(headerStart, headerEnd);

  const link = header.match(/<a class="collection-return"[^>]*>/);
  assert.ok(link, 'the interactive header must expose a .collection-return link');
  const [openingTag] = link;

  // The exit is namespace-safe: it is derived from the deployment base, never
  // from a root-absolute path that would escape the project subpath.
  assert.match(
    openingTag,
    /href="\$\{import\.meta\.env\.BASE_URL\}"/,
    'the Collection exit must resolve through import.meta.env.BASE_URL',
  );
  assert.match(openingTag, /aria-label="Return to Collection"/, 'the exit needs an accessible name');
  assert.match(header, /M19 12H5m7-7-7 7 7 7/, 'the exit must keep the shared return-arrow glyph');
  assert.doesNotMatch(template, /href="\/[^"]*"/, 'no anchor in the interactive UI may use a root-absolute href');

  // Nav order: it lives inside the header actions, before the existing controls.
  const navStart = header.indexOf('<nav class="header-actions"');
  const navEnd = header.indexOf('</nav>');
  const linkStart = header.indexOf('class="collection-return"');
  assert.ok(navStart < linkStart && linkStart < navEnd, 'the exit belongs to the header actions group');
  assert.ok(
    header.indexOf('motion-toggle') > linkStart && header.indexOf('index-toggle') > linkStart,
    'the exit precedes Motion and Index so it cannot cover them',
  );
});

test('the Collection exit resolves to the collection homepage under any deployment base', async () => {
  const { template } = await interactiveMarkup();
  const openingTag = template.match(/<a class="collection-return"[^>]*>/)[0];
  const hrefExpression = openingTag.match(/href="([^"]+)"/)[1];
  const resolve = base => hrefExpression.replace('${import.meta.env.BASE_URL}', base);

  const deployed = resolve('/ai-web-experience-collection/');
  assert.equal(deployed, '/ai-web-experience-collection/', 'the Pages subpath build must land on the collection index');
  assert.ok(deployed.startsWith('/ai-web-experience-collection/'), 'the resolved URL must not escape the project base');
  assert.equal(resolve('/'), '/', 'a root deployment must still reach the collection index');
});

test('the Collection exit participates in the dynamic ink system at both viewports', async () => {
  const { source } = await interactiveMarkup();
  assert.match(
    source,
    /\[root\.querySelector\('\.header-actions \.collection-return'\), 'actions'\]/,
    'the exit must be registered as an ink region so the animated sky cannot wash it out',
  );
  assert.match(
    source,
    /interfacePalette\(darkness, region, renderMode, portrait, state\.buttonThresholds\)/,
    'the ink system must remain the single source of the exit colour',
  );
});

test('the previously orphaned return stylesheet is wired into the experience entry', async () => {
  // 0c6329d added src/collection-return.css but dropped the import, so the exit
  // rendered unstyled (and a phone-sized icon collapse never applied).
  const entry = await read('experiences/glasshouse/src/main.js');
  assert.match(entry, /import '\.\/collection-return\.css';/, 'main.js must import the Collection exit styles');

  const styles = await read('experiences/glasshouse/src/collection-return.css');
  assert.match(styles, /\.collection-return\{/, 'the stylesheet must define the exit');
  assert.match(styles, /\.collection-return:focus-visible/, 'the exit must keep a keyboard focus affordance');
  assert.match(
    styles,
    /@media\(max-width:760px\)\{\.collection-return\{font-size:0/,
    'the exit must collapse to an icon on small viewports so it cannot crowd the controls',
  );
});

test('the no-JavaScript fallback keeps a base-relative Collection exit too', async () => {
  const page = await read('pages/glasshouse/index.html');
  const fallback = page.match(/<noscript>[\s\S]*?<\/noscript>/);
  assert.ok(fallback, 'the page must keep its no-JavaScript fallback');
  assert.match(fallback[0], /class="collection-return"[^>]*href="%BASE_URL%"/, 'the fallback exit must stay base-relative');
});
