import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';
import { chromium } from 'playwright';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const reportPath = join(root, 'evidence/records/input-lifecycle.json');
const port = Number(process.env.NIGHTSHIFT_INPUT_PORT || 4328);
const origin = `http://127.0.0.1:${port}`;
const started = Date.now();
const results = [];
const entryHtml = await readFile(join(root, 'dist/index.html'), 'utf8');
const chapterKeys = ['hero', 'atlas', 'bakery-before', 'care', 'curb-before', 'rail', 'water', 'utility', 'market', 'platform-before', 'dawn'];
const report = {
  startedAtUtc: new Date().toISOString(),
  purpose: 'Separate native input, no-JavaScript and lifecycle evidence. Does not replace or overwrite the full browser suite.',
  buildFiles: (await readdir(join(root, 'dist/assets'))).filter(name => /\.(?:js|css)$/.test(name)),
  entryHtmlResources: [...entryHtml.matchAll(/(?:src|href)="(\.\/assets\/[^\"]+\.(?:js|css))"/g)].map(match => match[1]),
  conditions: {
    browser: '', headless: true, deviceScaleFactor: 1, physicalDevice: false,
    origin, productionBuild: true,
    validationPath: 'Task explicitly requested local Playwright and CDP validation in the production-preview process namespace.',
    scrollbarConfiguration: 'Playwright default --hide-scrollbars is omitted so native scrollbars can be tested if Chromium exposes them.',
    audioScope: 'Actual AudioContext state is instrumented; headless audio output is not an audibility test.',
  },
  results,
};
await mkdir(dirname(reportPath), { recursive: true });
const server = await preview({ root, preview: { host: '127.0.0.1', port, strictPort: true } });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
  ignoreDefaultArgs: ['--hide-scrollbars'],
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});
report.conditions.browser = await browser.version();

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function poll(read, accept, label, timeout = 8000) {
  let value;
  const deadline = Date.now() + timeout;
  do {
    value = await read();
    if (accept(value)) return value;
    await sleep(40);
  } while (Date.now() < deadline);
  throw new Error(`${label}: ${JSON.stringify(value)}`);
}

async function run(name, classification, action) {
  const start = Date.now();
  try {
    const evidence = await action();
    const status = evidence.status || 'PASS';
    results.push({ name, classification, status, durationMs: Date.now() - start, ...evidence });
    console.log(`${status} ${name}${evidence.reason ? `: ${evidence.reason}` : ''}`);
  } catch (error) {
    results.push({ name, classification, status: 'FAIL', durationMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error) });
    console.log(`FAIL ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function installLifecycleAudit() {
  const audit = window.__inputLifecycleAudit = {
    events: [], audio: [], touch: [],
    initial: { time: performance.now(), epochMs: Date.now(), visibility: document.visibilityState, hidden: document.hidden },
  };
  for (const type of ['visibilitychange', 'freeze', 'resume', 'pageshow', 'pagehide']) {
    const target = type === 'pageshow' || type === 'pagehide' ? window : document;
    target.addEventListener(type, event => audit.events.push({
      type, time: performance.now(), epochMs: Date.now(), trusted: event.isTrusted,
      visibility: document.visibilityState, hidden: document.hidden,
      y: scrollY, chapter: document.body?.dataset.chapter || '',
    }), { capture: true });
  }
  for (const type of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) {
    document.addEventListener(type, event => audit.touch.push({
      type, trusted: event.isTrusted, time: performance.now(), epochMs: Date.now(), y: scrollY,
    }), { passive: true, capture: true });
  }
  const NativeAudioContext = window.AudioContext;
  if (NativeAudioContext) {
    window.AudioContext = new Proxy(NativeAudioContext, {
      construct(Target, args) {
        const context = Reflect.construct(Target, args);
        audit.audio.push(context);
        return context;
      },
    });
  }
}

async function makePage({ width = 1440, height = 900, hash = 'ch-01', mobile = false, audit = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  if (audit) await context.addInitScript(installLifecycleAudit);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${origin}/#${hash}`, { waitUntil: 'load' });
  await page.waitForSelector('html[data-ready="true"]');
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(await page.locator('.chapter').count(), 11);
  assert.match(await page.title(), /NIGHTSHIFT/i);
  assert.equal(await page.locator('vite-error-overlay').count(), 0);
  return { context, page, errors };
}

async function enterChapter(page, id, mobile = false) {
  const opener = page.locator('.site-header [data-open-dialog="chapters"]');
  if (mobile) await opener.tap(); else await opener.click();
  const link = page.locator(`#dialog-chapters a[href="#${id}"]`);
  if (mobile) await link.tap(); else await link.click();
  await poll(() => page.evaluate(() => ({ id: document.body.dataset.chapter, focused: document.activeElement?.id })),
    value => value.id === id && value.focused === (id === 'ch-01' ? 'hero-title' : `title-${id}`), 'Chapter navigation must settle and focus its heading');
  return stableScene(page);
}

async function rawScene(page) {
  return page.evaluate(() => {
    const stage = document.querySelector('#stage');
    const base = stage.querySelector('.stage-layer--base');
    const next = stage.querySelector('.stage-layer--next');
    const imageReady = layer => {
      const image = layer.querySelector('img');
      return Boolean(image && !image.hidden && image.complete && image.naturalWidth > 0);
    };
    return {
      y: scrollY, maxY: document.documentElement.scrollHeight - innerHeight,
      chapter: document.body.dataset.chapter, transition: document.body.dataset.transition,
      transitionProgress: document.body.dataset.transitionProgress,
      railCurrent: document.querySelector('.chapter-rail a[aria-current="location"]')?.getAttribute('href'),
      source: stage.dataset.source, target: stage.dataset.target, phase: stage.dataset.phase,
      baseKey: base.dataset.key, nextKey: next.dataset.key,
      baseReady: imageReady(base), nextReady: imageReady(next), nextHidden: next.hidden,
      visibility: document.visibilityState, hidden: document.hidden,
      viewport: { width: innerWidth, height: innerHeight },
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
}

async function stableScene(page) {
  let lastY = -1;
  let unchanged = 0;
  const snapshot = await poll(async () => {
    const value = await rawScene(page);
    unchanged = Math.abs(value.y - lastY) < .2 ? unchanged + 1 : 0;
    lastY = value.y;
    return value;
  }, value => unchanged >= 5 && value.baseReady && (value.nextHidden || value.nextReady), 'Scroll and authored image must settle');
  assert.match(snapshot.chapter, /^ch-(?:0[1-9]|1[01])$/);
  assert.equal(snapshot.railCurrent, `#${snapshot.chapter}`);
  assert.equal(snapshot.baseKey, snapshot.source);
  assert.equal(snapshot.horizontalOverflow, false);
  if (!snapshot.nextHidden) assert.equal(snapshot.nextKey, snapshot.target);
  if (!snapshot.transition) {
    let expected = chapterKeys[Number(snapshot.chapter.slice(3)) - 1];
    if (snapshot.chapter === 'ch-01' && snapshot.viewport.width < 640) expected = 'hero-mobile';
    assert.equal(snapshot.baseKey, expected);
  } else {
    const match = snapshot.transition.match(/^tr-(\d\d)-(\d\d)$/);
    assert.ok(match, `Invalid transition ${snapshot.transition}`);
    assert.ok([`ch-${match[1]}`, `ch-${match[2]}`].includes(snapshot.chapter));
    assert.ok(Number(snapshot.transitionProgress) >= 0 && Number(snapshot.transitionProgress) <= 1);
  }
  return snapshot;
}

async function audioState(page) {
  return page.evaluate(() => ({
    visibility: document.visibilityState, hidden: document.hidden,
    time: performance.now(), epochMs: Date.now(), y: scrollY,
    chapter: document.body.dataset.chapter,
    states: window.__inputLifecycleAudit.audio.map(context => context.state),
    optedIn: document.querySelector('[data-sound]')?.getAttribute('aria-pressed'),
  }));
}

let actualBackgroundBlocked = false;
try {
  await run('Native Home, End, PageDown, PageUp and Arrow keys scroll and restore scene identity', 'actual-keyboard', async () => {
    const { context, page, errors } = await makePage({ hash: 'ch-05' });
    try {
      const initial = await enterChapter(page, 'ch-05');
      const steps = [];
      let before = initial;
      for (const [key, condition] of [
        ['Home', 'top'], ['End', 'bottom'], ['Home', 'top'],
        ['PageDown', 'page-down'], ['PageUp', 'page-up'], ['ArrowDown', 'down'], ['ArrowUp', 'up'],
      ]) {
        await page.keyboard.press(key);
        await poll(() => page.evaluate(() => scrollY), value => {
          if (condition === 'top') return value <= 1;
          if (condition === 'bottom') return value >= before.maxY - 2;
          return condition.includes('down') ? value > before.y + 2 : value < before.y - 2;
        }, `${key} must move the document using native keyboard input`);
        const after = await stableScene(page);
        if (condition === 'top') { assert.ok(after.y <= 1); assert.equal(after.chapter, 'ch-01'); }
        if (condition === 'bottom') { assert.ok(after.y >= after.maxY - 2); assert.equal(after.chapter, 'ch-11'); }
        if (condition === 'page-down') assert.ok(after.y - before.y > 250);
        if (condition === 'page-up') assert.ok(before.y - after.y > 250);
        if (condition === 'down') assert.ok(after.y > before.y + 2);
        if (condition === 'up') assert.ok(after.y < before.y - 2);
        steps.push({ key, beforeY: before.y, after });
        before = after;
      }
      assert.deepEqual(errors, []);
      return { viewport: { width: 1440, height: 900 }, method: 'Playwright keyboard.press; no programmatic scroll during the key sequence.', initial, steps };
    } finally { await context.close(); }
  });

  await run('Browser touch swipes scroll across a chapter and reverse under phone emulation', 'actual-cdp-touch-input', async () => {
    const { context, page, errors } = await makePage({ width: 390, height: 844, mobile: true, hash: 'ch-07', audit: true });
    try {
      const initial = await enterChapter(page, 'ch-07', true);
      const cdp = await context.newCDPSession(page);
      const steps = [];
      async function swipe(startY, endY) {
        const x = 310;
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: startY, radiusX: 5, radiusY: 5, force: 1, id: 1 }] });
        for (let step = 1; step <= 12; step++) {
          await sleep(24);
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: startY + (endY - startY) * step / 12, radiusX: 5, radiusY: 5, force: 1, id: 1 }] });
        }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      }
      let before = initial;
      for (let i = 0; i < 3; i++) {
        await swipe(720, 240);
        await poll(() => page.evaluate(() => scrollY), value => value > before.y + 150, 'Upward finger swipe must move the document forward');
        const after = await stableScene(page);
        steps.push({ gesture: 'finger-up', beforeY: before.y, after });
        before = after;
      }
      assert.notEqual(before.chapter, initial.chapter, 'Repeated real swipes must cross a chapter boundary');
      await swipe(240, 720);
      await poll(() => page.evaluate(() => scrollY), value => value < before.y - 150, 'Downward finger swipe must reverse the document');
      const reverse = await stableScene(page);
      steps.push({ gesture: 'finger-down', beforeY: before.y, after: reverse });
      const touchEvents = await page.evaluate(() => window.__inputLifecycleAudit.touch);
      assert.ok(touchEvents.filter(event => event.type === 'touchstart' && event.trusted).length >= 4);
      assert.ok(touchEvents.some(event => event.type === 'touchmove' && event.trusted));
      assert.deepEqual(errors, []);
      return { viewport: { width: 390, height: 844 }, method: 'CDP Input.dispatchTouchEvent touchStart/move/end at timed points, native browser scrolling; not physical-device touch.', initial, steps, touchEvents };
    } finally { await context.close(); }
  });

  await run('Native renderer text finding reveals matched chapter text and scene', 'native-window-find', async () => {
    const { context, page, errors } = await makePage();
    try {
      await enterChapter(page, 'ch-01');
      const steps = [];
      for (const [text, id] of [['The city carries water in silence.', 'ch-07'], ['Someone is still awake.', 'ch-01']]) {
        const found = await page.evaluate(text => {
          getSelection()?.removeAllRanges();
          const found = window.find(text, false, false, true, false, false, false);
          const selection = getSelection();
          const parent = selection?.anchorNode?.parentElement;
          return { found, selected: selection?.toString(), section: parent?.closest('.chapter')?.id };
        }, text);
        if (!found.found) {
          const appControl = await page.evaluate(() => ({
            exactText: document.querySelector('#title-ch-07').innerText,
            shortText: document.querySelector('#title-ch-08').innerText,
            uniqueWordFound: window.find('Continuity'),
            anotherWordFound: window.find('fastener'),
            visibility: getComputedStyle(document.querySelector('#title-ch-07')).visibility,
          }));
          const controlPage = await context.newPage();
          await controlPage.setContent('<!doctype html><title>Native find capability control</title><main><p>Native find capability sentinel</p></main>');
          const plainControl = await controlPage.evaluate(() => ({
            text: document.body.innerText, query: 'capability',
            found: window.find('capability'), selected: getSelection().toString(),
            method: String(window.find), hidden: document.hidden,
          }));
          await controlPage.close();
          if (!plainControl.found) return {
            status: 'BLOCKED',
            reason: 'This native window.find implementation returns false even for a visible one-paragraph control page. Native text finding cannot be exercised in this headless runtime.',
            attemptedQuery: text, found, appControl, plainControl,
            method: 'window.find native renderer API; full heading and unique short-word probes. No JavaScript selection/scroll substitute was used. Browser-chrome Ctrl+F was not exercised.',
          };
        }
        assert.equal(found.found, true, `Native find must locate ${JSON.stringify(text)}`);
        assert.equal(found.selected, text);
        assert.equal(found.section, id);
        await poll(() => page.locator('body').getAttribute('data-chapter'), value => value === id, 'Find must resolve the matching chapter identity');
        const scene = await stableScene(page);
        const selectionBounds = await page.evaluate(() => {
          const range = getSelection().getRangeAt(0);
          const bounds = range.getBoundingClientRect();
          const parent = range.startContainer.parentElement;
          return { top: bounds.top, bottom: bounds.bottom, left: bounds.left, right: bounds.right,
            viewportHeight: innerHeight, viewportWidth: innerWidth,
            visibility: getComputedStyle(parent).visibility,
            chapterVisibility: getComputedStyle(parent.closest('.chapter')).visibility };
        });
        assert.ok(selectionBounds.bottom > 0 && selectionBounds.top < selectionBounds.viewportHeight);
        assert.equal(selectionBounds.visibility, 'visible');
        assert.equal(selectionBounds.chapterVisibility, 'visible');
        steps.push({ query: text, found, scene, selectionBounds });
      }
      assert.deepEqual(errors, []);
      return { method: 'window.find invokes Chromium renderer native text finding and its native reveal/selection. Browser-chrome Ctrl+F interface was not exercised.', steps };
    } finally { await context.close(); }
  });

  await run('Native scrollbar thumb drag moves and reverses the document', 'actual-scrollbar-mouse-drag', async () => {
    const { context, page, errors } = await makePage();
    try {
      const initial = await enterChapter(page, 'ch-01');
      const geometry = await page.evaluate(() => ({ width: innerWidth, clientWidth: document.documentElement.clientWidth, height: innerHeight, scrollHeight: document.documentElement.scrollHeight }));
      const gutter = geometry.width - geometry.clientWidth;
      if (gutter < 3) return { status: 'BLOCKED', reason: 'This headless browser exposes no measurable native scrollbar gutter; an overlay or hidden bar cannot be reliably thumb-dragged here.', geometry, initial, method: 'No programmatic scrolling is substituted for a native scrollbar drag.' };
      const x = geometry.clientWidth + gutter / 2;
      await page.mouse.move(x, 20);
      await page.mouse.down();
      await page.mouse.move(x, 650, { steps: 24 });
      await poll(() => page.evaluate(() => scrollY), value => value > 1000, 'Dragging the exposed native thumb must scroll the document');
      const forward = await stableScene(page);
      await page.mouse.move(x, 300, { steps: 18 });
      await page.mouse.up();
      await poll(() => page.evaluate(() => scrollY), value => value < forward.y - 1000, 'Reversing the same held scrollbar thumb must reverse scrolling');
      const reverse = await stableScene(page);
      assert.deepEqual(errors, []);
      return { geometry, gutter, pointer: { x, startY: 20, forwardY: 650, reverseY: 300 }, initial, forward, reverse,
        method: 'Actual Playwright mouse down/move/up on the exposed native scrollbar gutter; no DOM scroll assignment.' };
    } finally { await page.mouse.up().catch(() => undefined); await context.close(); }
  });

  for (const [width, height] of [[1440, 900], [390, 844]]) {
    await run(`JavaScript-disabled full still edition at ${width} x ${height}`, 'javascript-disabled-browser', async () => {
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, javaScriptEnabled: false });
      const page = await context.newPage();
      try {
        await page.goto(`${origin}/`, { waitUntil: 'load' });
        await page.locator('noscript a[href="./story.html"]').click();
        await page.waitForURL('**/story.html');
        assert.match(await page.title(), /NIGHTSHIFT/i);
        assert.equal(await page.locator('section.chapter').count(), 11);
        assert.equal(await page.locator('section.chapter [data-beat="1"]').count(), 11);
        assert.equal(await page.locator('section.chapter [data-beat="2"]').count(), 11);
        assert.equal(await page.locator('.comparison-pair').count(), 4);
        assert.equal(await page.locator('script').count(), 0);
        const chapters = [];
        for (let number = 1; number <= 11; number++) {
          const id = `ch-${String(number).padStart(2, '0')}`;
          await page.locator(`.contents a[href="#${id}"]`).click();
          const chapter = await page.locator(`#${id}`).evaluate(section => {
            const heading = section.querySelector('h2');
            const bounds = heading.getBoundingClientRect();
            return { id: section.id, hash: location.hash, y: scrollY, heading: heading.textContent.trim(),
              beats: [...section.querySelectorAll('[data-beat]')].map(beat => beat.textContent.trim()),
              context: section.querySelector('.context').textContent.trim(),
              headingBounds: { top: bounds.top, bottom: bounds.bottom, left: bounds.left, right: bounds.right },
              viewport: { width: innerWidth, height: innerHeight },
              overflow: document.documentElement.scrollWidth > innerWidth };
          });
          assert.equal(chapter.hash, `#${id}`);
          assert.ok(chapter.heading && chapter.context && chapter.beats.every(beat => beat.length > 25));
          assert.equal(chapter.beats.length, 2);
          assert.ok(chapter.headingBounds.top >= 0 && chapter.headingBounds.bottom <= height);
          assert.ok(chapter.headingBounds.left >= 0 && chapter.headingBounds.right <= width);
          assert.equal(chapter.overflow, false);
          chapters.push(chapter);
        }
        const pairs = await page.locator('.comparison-pair').evaluateAll(elements => elements.map(pair => ({
          chapter: pair.closest('.chapter').id,
          images: [...pair.querySelectorAll('img')].map(image => ({ key: image.getAttribute('src').split('/').at(-1).replace('.webp', ''), alt: image.alt, ready: image.complete && image.naturalWidth > 0 })),
          captions: [...pair.querySelectorAll('figcaption')].map(caption => caption.textContent.trim()),
        })));
        assert.deepEqual(pairs.map(pair => pair.images.map(image => image.key)), [
          ['bakery-before', 'bakery-after'], ['curb-before', 'curb-after'], ['market', 'market-after'], ['platform-before', 'platform'],
        ]);
        for (const pair of pairs) {
          assert.ok(pair.images.every(image => image.ready && image.alt.length > 20));
          assert.ok(pair.captions.every(caption => caption.length > 20));
          assert.notEqual(pair.images[0].alt, pair.images[1].alt);
        }
        const links = await page.locator('a').evaluateAll(elements => elements.map(link => {
          const href = link.getAttribute('href');
          return { text: link.textContent.trim(), href, targetExists: href.startsWith('#') ? Boolean(document.getElementById(href.slice(1))) : null };
        }));
        assert.ok(links.every(link => link.text && link.href && link.href !== '#'));
        assert.ok(links.filter(link => link.targetExists !== null).every(link => link.targetExists));
        assert.ok(links.some(link => link.href === './index.html'));
        return { viewport: { width, height }, javaScriptEnabled: false, entry: 'Main noscript link → story.html → all eleven native contents anchors', chapters, pairs, links };
      } finally { await context.close(); }
    });
  }

  await run('Actual second-tab foreground and return with visibility timestamps and opted-in audio', 'actual-tab-background-attempt', async () => {
    const { context, page, errors } = await makePage({ hash: 'ch-07', audit: true });
    try {
      const initial = await enterChapter(page, 'ch-07');
      assert.deepEqual((await audioState(page)).states, []);
      await page.locator('[data-sound]').click();
      const before = await poll(() => audioState(page), value => value.states[0] === 'running', 'Opted-in audio must run before backgrounding');
      const other = await context.newPage();
      await other.goto('data:text/html,<title>Lifecycle foreground control</title><p>Foreground control tab</p>');
      await other.bringToFront();
      await sleep(350);
      const behindOtherTab = await audioState(page);
      if (!behindOtherTab.hidden) actualBackgroundBlocked = true;
      else await poll(() => audioState(page), value => value.states[0] === 'suspended', 'A genuinely hidden document must suspend opted-in sound');
      await page.bringToFront();
      await poll(() => audioState(page), value => !value.hidden && value.states[0] === 'running', 'Visible return must restore opted-in sound');
      const returned = await stableScene(page);
      assert.equal(returned.chapter, initial.chapter);
      assert.ok(Math.abs(returned.y - initial.y) <= 1);
      await page.locator('[data-sound]').click();
      await poll(() => audioState(page), value => value.states[0] === 'suspended' && value.optedIn === 'false', 'Sound turns off');
      await other.bringToFront();
      await sleep(180);
      const offBehind = await audioState(page);
      await page.bringToFront();
      const offReturned = await audioState(page);
      assert.equal(offReturned.states[0], 'suspended');
      assert.equal(offReturned.optedIn, 'false');
      const visibilityEvents = await page.evaluate(() => window.__inputLifecycleAudit.events);
      assert.deepEqual(errors, []);
      return {
        ...(actualBackgroundBlocked ? { status: 'BLOCKED', reason: 'newPage plus bringToFront did not make the original headless document hidden. Actual background visibility/audio suspension cannot be claimed from this environment.' } : {}),
        method: 'Real second tab creation, navigation and bringToFront, then bringToFront on the story tab. No visibility property override in this case.',
        initial, before, behindOtherTab, returned, offBehind, offReturned, visibilityEvents,
        limitation: 'This is a browser-tab attempt, not OS app backgrounding or a physical-device suspend/resume test.',
      };
    } finally { await context.close(); }
  });

  await run('CDP browser lifecycle frozen to active preserves reading position', 'cdp-lifecycle-freeze-resume', async () => {
    const { context, page, errors } = await makePage({ hash: 'ch-07', audit: true });
    try {
      const initial = await enterChapter(page, 'ch-07');
      const cdp = await context.newCDPSession(page);
      const protocolEvents = [];
      await cdp.send('Page.enable');
      await cdp.send('Page.setLifecycleEventsEnabled', { enabled: true });
      cdp.on('Page.lifecycleEvent', event => protocolEvents.push({ name: event.name, timestamp: event.timestamp }));
      try {
        await cdp.send('Page.setWebLifecycleState', { state: 'frozen' });
      } catch (error) {
        return { status: 'BLOCKED', reason: `CDP Page.setWebLifecycleState unsupported: ${error.message}`, initial };
      }
      await sleep(260);
      await cdp.send('Page.setWebLifecycleState', { state: 'active' });
      await page.bringToFront();
      const returned = await stableScene(page);
      const events = await page.evaluate(() => window.__inputLifecycleAudit.events);
      assert.equal(returned.chapter, initial.chapter);
      assert.ok(Math.abs(returned.y - initial.y) <= 1);
      assert.deepEqual(errors, []);
      const freezeObserved = events.some(event => event.type === 'freeze' && event.trusted);
      const resumeObserved = events.some(event => event.type === 'resume' && event.trusted);
      if (!freezeObserved && !resumeObserved) return {
        status: 'BLOCKED',
        reason: 'CDP accepts frozen/active but delivers neither trusted freeze nor resume events in the visible headless tab. The requested lifecycle branch was not reached.',
        initial, returned, events, protocolEvents,
        method: 'Page.setWebLifecycleState command acceptance alone is not treated as proof of freezing or background restoration.',
      };
      assert.ok(freezeObserved, 'Browser must deliver a trusted freeze event');
      assert.ok(resumeObserved, 'Browser must deliver a trusted resume event');
      return { initial, returned, events, protocolEvents,
        method: 'Actual CDP Page.setWebLifecycleState frozen/active. This is a browser lifecycle test, not an OS-background or physical-device lifecycle test.' };
    } finally { await context.close(); }
  });

  if (actualBackgroundBlocked) {
    await run('Synthetic visibility branch refreshes current chapter and respects audio opt-in', 'synthetic-controller-branch-only', async () => {
      const { context, page, errors } = await makePage({ hash: 'ch-07', audit: true });
      try {
        const initial = await enterChapter(page, 'ch-07');
        await page.locator('[data-sound]').click();
        await poll(() => audioState(page), value => value.states[0] === 'running', 'Sound is explicitly enabled');
        await page.evaluate(() => {
          Object.defineProperty(document, 'hidden', { configurable: true, value: true });
          Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
          document.dispatchEvent(new Event('visibilitychange'));
        });
        const hidden = await poll(() => audioState(page), value => value.states[0] === 'suspended', 'Synthetic hidden branch suspends the audio graph');
        await page.evaluate(() => {
          const target = document.querySelector('#ch-11').getBoundingClientRect().top + scrollY;
          window.scrollTo({ top: target, behavior: 'instant' });
        });
        const whileHidden = await rawScene(page);
        assert.equal(whileHidden.chapter, initial.chapter, 'Renderer intentionally does not update its visible story while hidden');
        assert.ok(whileHidden.y > initial.y + 1000);
        await page.evaluate(() => {
          delete document.hidden;
          delete document.visibilityState;
          document.dispatchEvent(new Event('visibilitychange'));
        });
        const restored = await stableScene(page);
        assert.equal(restored.chapter, 'ch-11');
        assert.equal(restored.baseKey, 'dawn');
        const onRestored = await poll(() => audioState(page), value => value.states[0] === 'running' && value.optedIn === 'true', 'Visible branch resumes sound only because it was opted in');
        await page.locator('[data-sound]').click();
        await poll(() => audioState(page), value => value.states[0] === 'suspended' && value.optedIn === 'false', 'Sound is explicitly disabled');
        await page.evaluate(() => {
          Object.defineProperty(document, 'hidden', { configurable: true, value: true });
          Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
          document.dispatchEvent(new Event('visibilitychange'));
          delete document.hidden;
          delete document.visibilityState;
          document.dispatchEvent(new Event('visibilitychange'));
        });
        const offRestored = await audioState(page);
        assert.equal(offRestored.states[0], 'suspended');
        assert.equal(offRestored.optedIn, 'false');
        const visibilityEvents = await page.evaluate(() => window.__inputLifecycleAudit.events.filter(event => event.type === 'visibilitychange'));
        assert.ok(visibilityEvents.length >= 4);
        assert.ok(visibilityEvents.every(event => !event.trusted));
        assert.deepEqual(errors, []);
        return { initial, hidden, whileHidden, restored, onRestored, offRestored, visibilityEvents,
          method: 'TEST-ONLY document.hidden/visibilityState own-property override plus untrusted synthetic visibilitychange events. No application source changes.',
          limitation: 'PASS covers controller/interactions visibility branches only. It is explicitly not evidence of actual tab or OS background restoration.' };
      } finally { await context.close(); }
    });
  }
} finally {
  report.durationMs = Date.now() - started;
  report.summary = {
    passed: results.filter(result => result.status === 'PASS').length,
    failed: results.filter(result => result.status === 'FAIL').length,
    blocked: results.filter(result => result.status === 'BLOCKED').length,
    syntheticPasses: results.filter(result => result.classification.startsWith('synthetic') && result.status === 'PASS').length,
  };
  report.scope = {
    H5: 'Actual keyboard, browser touch and exposed native scrollbar input are recorded separately. Any BLOCKED native find check remains unverified and cannot be counted as H5 acceptance. This record does not replace the existing wheel/link/hash/history suite or physical-device testing.',
    H8: actualBackgroundBlocked
      ? 'Actual tab background visibility remains BLOCKED in headless Chromium. CDP freeze/resume and any explicitly synthetic visibility branch are separate evidence, not substitutes for OS/physical-device background testing.'
      : 'Actual browser-tab visibility was observed where recorded. OS app backgrounding, physical-device lifecycle and other browsers remain untested.',
    browserFind: 'window.find covers renderer text matching, native selection and reveal; the Ctrl+F browser chrome interface is not asserted.',
  };
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  await browser.close();
  await new Promise(resolve => server.httpServer.close(resolve));
  console.log(JSON.stringify({ report: 'evidence/records/input-lifecycle.json', ...report.summary, durationMs: report.durationMs }));
  if (report.summary.failed) process.exitCode = 1;
}
