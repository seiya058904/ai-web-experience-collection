/**
 * Browser-resident verification for a same-origin production iframe.
 *
 * Import or inline this module in the local QA harness, then call
 * runSuite(iframe, row => renderResult(row)). No external runner is required.
 * DOM activation and CSS-viewport checks are reported as such; this suite does
 * not certify aesthetics, physical touch/keyboard use, or field performance.
 */
export async function runSuite(frame, report = () => {}) {
  const results = [];
  const originalSize = { width: frame.style.width, height: frame.style.height };
  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  const startedAt = performance.now();
  const titles = [
    'Not a symbol. An organ.', 'Four rooms, two directions.',
    'Before the push, a signal.', 'A return from the body.',
    'Doors that answer to pressure.', 'The short journey outward.',
    'Where air meets blood—across a barrier.', 'The return is different now.',
    'The wall built for distance.', 'One beat, many destinations.',
    'The story has no final beat.',
  ];
  const slugs = [
    'living-form', 'four-chambers', 'the-signal', 'the-return', 'one-way-gates',
    'toward-the-lungs', 'exchange', 'the-way-back', 'the-stronger-wall',
    'around-the-body', 'beat-again',
  ];

  async function emit(name, status, details) {
    const row = { name, status, details };
    results.push(row);
    try { await report(row); } catch { /* The returned results remain available. */ }
    return row;
  }
  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }
  async function check(name, action) {
    try {
      const details = await action();
      return await emit(name, 'PASS', details ?? 'Expected state observed.');
    } catch (error) {
      try { await closeDialogs(); } catch { /* Keep a failed modal from poisoning later cases. */ }
      return await emit(name, 'FAIL', error instanceof Error ? error.message : String(error));
    }
  }
  const q = selector => doc.querySelector(selector);
  const qa = selector => [...doc.querySelectorAll(selector)];
  const chapters = () => qa('main > section.chapter[data-chapter]');
  const transitions = () => qa('main > section.story-transition[data-transition]');
  const cleanText = element => element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

  // The timeout is deliberate: hidden or stalled iframe rAF must not hang the
  // parent QA page forever. Poll deadlines still reject missing app updates.
  async function raf(count = 2) {
    for (let i = 0; i < count; i += 1) {
      await new Promise(resolve => {
        let complete = false;
        const finish = () => {
          if (complete) return;
          complete = true;
          clearTimeout(timer);
          resolve();
        };
        const timer = setTimeout(finish, 120);
        win.requestAnimationFrame(finish);
      });
    }
  }
  async function until(predicate, label, timeout = 2400) {
    const deadline = performance.now() + timeout;
    let lastError;
    while (performance.now() < deadline) {
      try { if (predicate()) return; } catch (error) { lastError = error; }
      await raf(1);
    }
    throw new Error(`${label} timed out.${lastError ? ` ${lastError.message}` : ''}`);
  }
  const visible = element => {
    if (!element || !element.getClientRects().length) return false;
    if (element.closest('dialog:not([open])')) return false;
    const style = win.getComputedStyle(element);
    const bounds = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && bounds.width > 0 && bounds.height > 0;
  };
  async function closeDialogs() {
    for (let i = 0; i < 3; i += 1) {
      const close = q('dialog[open] button[data-close]');
      if (!close) break;
      close.click();
      await raf(1);
    }
  }
  async function setMotion(mode) {
    if (doc.documentElement.dataset.motion === mode) return;
    let control = qa('button[data-motion]').find(visible);
    let usedDialog = false;
    if (!control) {
      const opener = q('button[data-open="chapters-dialog"]');
      assert(visible(opener), 'No visible route to the motion control.');
      opener.click();
      await until(() => q('#chapters-dialog')?.open, 'Chapter menu opening');
      usedDialog = true;
      control = qa('button[data-motion]').find(visible);
    }
    assert(control, 'Motion button is absent.');
    control.click();
    await until(() => doc.documentElement.dataset.motion === mode, `Motion ${mode}`);
    if (usedDialog) await closeDialogs();
    await raf();
  }
  async function resize(width, height) {
    frame.style.width = `${width}px`;
    frame.style.height = `${height}px`;
    await until(() => win.innerWidth === width && win.innerHeight === height,
      `Iframe viewport ${width}×${height}`, 1800);
    await raf(3);
  }
  async function scroll(top) {
    const max = Math.max(0, doc.documentElement.scrollHeight - win.innerHeight);
    const target = Math.min(max, Math.max(0, Math.ceil(top)));
    win.scrollTo({ top: target, left: 0, behavior: 'instant' });
    await until(() => Math.abs(win.scrollY - target) <= 1.2, 'Native scroll settlement');
    await raf(2);
    return target;
  }
  const topOf = element => element.getBoundingClientRect().top + win.scrollY;
  async function show(element, offset = 110) {
    assert(element, 'Target section is missing.');
    await scroll(topOf(element) - offset);
  }
  async function imagesIn(element, timeout = 1800) {
    const images = [...element.querySelectorAll('img')];
    if (!images.length) return { images: 0, loaded: 0, failed: 0 };
    await until(() => images.every(img => img.complete), 'Images settling', timeout);
    const failed = images.filter(img => !img.naturalWidth);
    for (const img of failed) {
      assert(img.closest('picture')?.dataset.assetState === 'failed', 'An image failed without a recoverable state.');
    }
    return { images: images.length, loaded: images.length - failed.length, failed: failed.length };
  }
  function textBounds(scope = doc.body) {
    const problems = [];
    for (const element of scope.querySelectorAll('h1,h2,h3,p,button,summary')) {
      if (!visible(element) || element.closest('.sr-only,.skip-link')) continue;
      const bounds = element.getBoundingClientRect();
      const style = win.getComputedStyle(element);
      if (bounds.left < -1.1 || bounds.right > doc.documentElement.clientWidth + 1.1) {
        problems.push({ text: cleanText(element).slice(0, 70), left: Number(bounds.left.toFixed(2)), right: Number(bounds.right.toFixed(2)) });
      }
      if (['hidden', 'clip'].includes(style.overflowX) && element.scrollWidth > element.clientWidth + 1) {
        problems.push({ text: cleanText(element).slice(0, 70), reason: 'Text is horizontally clipped.' });
      }
      if (['hidden', 'clip'].includes(style.overflowY) && element.scrollHeight > element.clientHeight + 1) {
        problems.push({ text: cleanText(element).slice(0, 70), reason: 'Text is vertically clipped.' });
      }
    }
    return problems;
  }
  const computedOpacity = element => Number(win.getComputedStyle(element).opacity);
  function verifyCoreVisualState(number, value, figure) {
    const svg = figure.querySelector('.anatomy-svg');
    assert(svg, `CH-${number}: SVG missing.`);
    if (number === 2 && ['ra', 'rv', 'la', 'lv'].includes(value)) {
      const chosen = svg.querySelector(`[data-chamber="${value}"]`);
      assert(chosen && parseFloat(win.getComputedStyle(chosen).strokeWidth) >= 4.9, `CH-02 ${value}: chamber highlight is not rendered.`);
      const other = [...svg.querySelectorAll('[data-chamber]')].find(e => e.dataset.chamber !== value);
      assert(other && computedOpacity(other) <= 0.33, 'CH-02: unselected chambers did not recede.');
    }
    if ([3, 11].includes(number)) {
      const blood = svg.querySelector('[data-layer="blood"]');
      const signal = svg.querySelector('[data-layer="electrical"]');
      assert(blood && signal, `CH-${number}: a required explanatory layer is absent.`);
      if (value === 'electrical') assert(computedOpacity(blood) < 0.01, `CH-${number}: blood layer still visible in signal-only mode.`);
      if (value === 'blood') assert(computedOpacity(signal) < 0.01, `CH-${number}: signal layer still visible in blood-only mode.`);
      if (value === 'both') assert(computedOpacity(blood) > 0.9 && computedOpacity(signal) > 0.9, `CH-${number}: both layers are not visible.`);
    }
    if (number === 5) {
      const av = svg.querySelector('.valve-family--av');
      const outflow = svg.querySelector('.valve-family--outflow');
      assert(av && outflow, 'CH-05: valve family missing.');
      assert(win.getComputedStyle(value === 'outflow' ? av : outflow).display === 'none', 'CH-05: inactive valve family is not hidden.');
      assert(win.getComputedStyle(value === 'outflow' ? outflow : av).display !== 'none', 'CH-05: selected valve family is hidden.');
    }
    if (number === 6 && value !== 'both') {
      const other = svg.querySelector(`[data-route="${value === 'right-lung' ? 'left-lung' : 'right-lung'}"]`);
      assert(other && computedOpacity(other) < 0.2, 'CH-06: the opposite lung branch did not recede.');
    }
    if (number === 7 && value !== 'both') {
      const shown = svg.querySelector(`[data-gas="${value}"]`);
      const hidden = svg.querySelector(`[data-gas="${value === 'oxygen' ? 'carbon' : 'oxygen'}"]`);
      assert(shown && hidden, 'CH-07: a gas-arrow group is missing.');
      assert(computedOpacity(shown) > 0.9 && computedOpacity(hidden) < 0.2, 'CH-07: selected gas direction did not become distinct.');
    }
    if (number === 10 && value !== 'both') {
      const other = svg.querySelector(`[data-route="${value === 'arterial' ? 'venous' : 'arterial'}"]`);
      assert(other && computedOpacity(other) < 0.2, 'CH-10: the opposite systemic route did not recede.');
    }
  }

  if (!doc || !win) {
    await emit('Iframe availability', 'BLOCKED', 'The same-origin iframe document or window is not available.');
    return results;
  }
  if (doc.hidden) {
    await emit('Browser foreground state', 'BLOCKED', 'The production iframe is hidden. Activate its browser tab before running the suite.');
    return results;
  }
  const originalMotion = doc.documentElement.dataset.motion === 'reduced' ? 'reduced' : 'on';

  try {
    await check('Application readiness and browser environment', async () => {
      await until(() => doc.documentElement.classList.contains('js') && doc.documentElement.dataset.chapter, 'Application startup', 4000);
      if (doc.fonts) await Promise.race([doc.fonts.ready, new Promise(resolve => setTimeout(resolve, 3500))]);
      await raf(3);
      assert(!q('vite-error-overlay'), 'A Vite error overlay is present.');
      assert(doc.documentElement.lang === 'en', 'HTML language is not en.');
      assert(doc.title === 'PULSE — An atlas of one heartbeat', `Wrong page identity: ${doc.title}`);
      const heroImages = await imagesIn(q('.hero'));
      return { title: doc.title, userAgent: win.navigator.userAgent, viewport: [win.innerWidth, win.innerHeight], dpr: win.devicePixelRatio, fonts: doc.fonts?.status ?? 'unavailable', heroImages, activationMethod: 'Browser-resident DOM control activation and native scroll' };
    });

    await check('Eleven chapters, exact headings, twenty-two complete beats', () => {
      const items = chapters();
      assert(items.length === 11, `Expected 11 chapter sections; observed ${items.length}.`);
      assert(transitions().length === 10, `Expected 10 transition sections; observed ${transitions().length}.`);
      assert(qa('main .chapter .beat').length === 22, 'The DOM does not contain exactly 22 content beats.');
      items.forEach((section, index) => {
        assert(section.id === slugs[index], `Unexpected chapter order at ${index + 1}: ${section.id}`);
        assert(cleanText(section.querySelector('.chapter-heading h2')) === titles[index], `Wrong editorial heading in chapter ${index + 1}.`);
        const beats = [...section.querySelectorAll('.beat')];
        assert(beats.length === 2 && beats.every(beat => cleanText(beat.querySelector('p')).split(/\s+/).length >= 25), `Chapter ${index + 1} does not have two substantive beats.`);
        assert(section.querySelector('.plate-notes .source-ref'), `Chapter ${index + 1} has no source access.`);
        assert(section.querySelector('.text-alternative summary'), `Chapter ${index + 1} has no diagram text alternative.`);
      });
      const hero = cleanText(q('#hero-title'));
      assert(hero.replace(/\s/g, '') === 'Everybeathasadirection.', `Unexpected hero title: ${hero}`);
      return { chapters: 11, transitions: 10, beats: 22, exactHeadings: true };
    });

    await check('Public text, metadata and accessible labels use English', () => {
      const strings = [doc.title, doc.body.textContent, q('meta[name="description"]')?.content ?? ''];
      for (const element of qa('[alt],[aria-label],[title]')) {
        for (const attribute of ['alt', 'aria-label', 'title']) strings.push(element.getAttribute(attribute) ?? '');
      }
      const text = strings.join('\n');
      assert(!/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(text), 'Unexpected CJK text appears in public copy or labels.');
      assert(!/lorem ipsum|coming soon|undefined|\[object Object\]/i.test(text), 'Placeholder or broken string appears in public copy.');
      assert(/Oxygen-poor blood is dark red/.test(text), 'The blood-color convention is missing.');
      assert(/not.*patient scan/.test(text), 'The illustration qualification is missing.');
      assert(/not show a complete circulation in one heartbeat/.test(text), 'The circulation-timescale qualification is missing.');
      return { checkedStrings: strings.length, caveat: 'Automated locale/content guard; prose and artwork still need visual review.' };
    });

    await check('Chapter dialog opens, closes and returns focus', async () => {
      await closeDialogs();
      const opener = q('button[data-open="chapters-dialog"]');
      assert(visible(opener), 'The chapter-menu opener is not visible.');
      opener.focus();
      opener.click();
      await until(() => q('#chapters-dialog')?.open, 'Chapter dialog');
      assert(q('#chapters-dialog nav').querySelectorAll('a').length === 11, 'Chapter menu does not contain all eleven destinations.');
      q('#chapters-dialog button[data-close]').click();
      await until(() => !q('#chapters-dialog').open, 'Chapter dialog close');
      await raf(2);
      assert(doc.activeElement === opener, 'Closing the chapter dialog did not return focus to its opener.');
      return 'Real dialog state and focus return verified by DOM activation.';
    });

    await check('Hero CTA changes hash, section and focus', async () => {
      await scroll(0);
      const cta = q('.hero .primary-link');
      assert(cta && cleanText(cta).includes('Enter the heart'), 'Hero CTA is missing.');
      cta.click();
      await until(() => win.location.hash === '#four-chambers', 'CTA hash');
      await until(() => doc.activeElement?.id === 'four-chambers-title', 'CTA focus');
      await until(() => Math.abs(q('#four-chambers').getBoundingClientRect().top - 105) <= 3, 'CTA scroll position');
      return { hash: win.location.hash, focus: doc.activeElement.id, sectionTop: q('#four-chambers').getBoundingClientRect().top };
    });

    await check('Reduced motion preserves complete interactive story', async () => {
      await setMotion('reduced');
      assert(chapters().length === 11 && transitions().length === 10, 'Reduced mode removed story content.');
      assert(qa('button[data-motion] span').every(element => cleanText(element) === 'Motion: Reduced'), 'Motion labels disagree.');
      return 'Reduced mode enabled through the visible interface; all chapters retained.';
    });

    for (const section of chapters()) {
      const number = Number(section.dataset.chapter);
      await check(`CH-${String(number).padStart(2, '0')} all options and reset`, async () => {
        const interaction = section.querySelector('[data-interaction]');
        const figure = q(`#diagram-${number}`);
        assert(interaction && figure, 'Interaction or associated figure is absent.');
        await show(interaction, 130);
        const options = [...interaction.querySelectorAll('button[data-select]')];
        const observed = [];
        for (const option of options) {
          const value = option.dataset.select;
          option.click();
          await raf(1);
          assert(figure.dataset.mode === value, `Figure mode did not become ${value}.`);
          assert([...figure.querySelectorAll('.anatomy-svg')].every(svg => svg.dataset.mode === value), `SVG mode did not become ${value}.`);
          assert(option.getAttribute('aria-pressed') === 'true', `${value} is not announced as selected.`);
          assert(options.filter(button => button.getAttribute('aria-pressed') === 'true').length === 1, 'More than one mutually exclusive option is selected.');
          const result = cleanText(interaction.querySelector('.interaction-result'));
          assert(result.split(/\s+/).length >= 8, `${value} has no meaningful explanatory result.`);
          assert(!observed.some(item => item.result === result), `${value} repeats another option's result.`);
          verifyCoreVisualState(number, value, figure);
          observed.push({ value, result });
        }
        const reset = interaction.querySelector('button[data-reset]');
        assert(reset, 'Reset control is missing.');
        reset.click();
        await raf(1);
        const initial = interaction.dataset.initial;
        assert(figure.dataset.mode === initial, `Reset did not restore ${initial}.`);
        const expectedSelected = options.some(button => button.dataset.select === initial) ? 1 : 0;
        assert(options.filter(button => button.getAttribute('aria-pressed') === 'true').length === expectedSelected, 'Reset leaves incorrect selected-state announcements.');
        return { options: observed.length, reset: initial, computedVisualStates: [2, 3, 5, 6, 7, 10, 11].includes(number), method: 'Real DOM controls; motion reduced for deterministic computed-style checks.' };
      });
    }

    await check('Motion change retains selected anatomy and source text', async () => {
      const interaction = q('[data-interaction="2"]');
      interaction.querySelector('[data-select="lv"]').click();
      const result = cleanText(q('#result-2'));
      await setMotion('on');
      assert(q('#diagram-2').dataset.mode === 'lv', 'Changing motion reset the selected chamber.');
      assert(cleanText(q('#result-2')) === result, 'Changing motion changed the selected factual result.');
      assert(qa('button[data-motion] span').every(element => cleanText(element) === 'Motion: On'), 'Motion labels disagree.');
      interaction.querySelector('[data-reset]').click();
      return 'Selected chamber/result survive the motion setting change.';
    });

    const boundaryCapture = element => ({
      p: Number(element.dataset.progress),
      stage: Number(element.dataset.stage),
      label: cleanText(element.querySelector('.transition-stage-label')),
      sourceOpacity: element.querySelector('.anchor-source')?.style.opacity ?? '',
      targetOpacity: element.querySelector('.anchor-target')?.style.opacity ?? '',
      sourceClip: element.querySelector('.anchor-source')?.style.clipPath ?? '',
      targetClip: element.querySelector('.anchor-target')?.style.clipPath ?? '',
      sourceCaption: Number(element.querySelector('.transition-source').style.opacity),
      targetCaption: Number(element.querySelector('.transition-target').style.opacity),
    });
    function verifyTransitionBounds(element) {
      const tolerance = 2;
      const stage = element.querySelector('.transition-stage');
      const anchor = stage?.querySelector('svg.transition-anchor');
      assert(stage && anchor, `${element.id}: transition stage or anchor SVG is absent.`);
      const stageBox = stage.getBoundingClientRect();
      const anchorBox = anchor.getBoundingClientRect();
      const rounded = value => Number(value.toFixed(2));
      const rectangle = box => ({
        left: rounded(box.left), top: rounded(box.top),
        right: rounded(box.right), bottom: rounded(box.bottom),
        width: rounded(box.width), height: rounded(box.height),
      });
      assert(stageBox.width > 1 && stageBox.height > 1, `${element.id}: the transition art stage collapsed.`);
      assert(anchorBox.width > 1 && anchorBox.height > 1, `${element.id}: the transition SVG collapsed.`);
      const artwork = [anchor, ...stage.querySelectorAll('.transition-material, .transition-material img')];
      const boxes = artwork.map(art => ({ name: art.tagName.toLowerCase(), box: art.getBoundingClientRect() }));
      for (const { name, box } of boxes) {
        const contained = box.left >= stageBox.left - tolerance
          && box.top >= stageBox.top - tolerance
          && box.right <= stageBox.right + tolerance
          && box.bottom <= stageBox.bottom + tolerance;
        assert(contained, `${element.id}: ${name} artwork exceeds its stage (2 px tolerance). Art ${JSON.stringify(rectangle(box))}; stage ${JSON.stringify(rectangle(stageBox))}.`);
      }
      // A valid progress attribute does not prove a composed image. In
      // particular, height:auto on a wide SVG can paint into the caption rows.
      // Check local layout regions, not the fixed site header which content
      // legitimately passes beneath while the native document scrolls.
      const captions = [...element.querySelectorAll('.transition-label, .transition-caption, .transition-stage-label, .transition-continue')];
      for (const caption of captions) {
        const captionBox = caption.getBoundingClientRect();
        if (captionBox.width <= 0 || captionBox.height <= 0) continue;
        for (const { name, box } of [{ name: 'stage', box: stageBox }, ...boxes]) {
          const overlapX = Math.min(box.right, captionBox.right) - Math.max(box.left, captionBox.left);
          const overlapY = Math.min(box.bottom, captionBox.bottom) - Math.max(box.top, captionBox.top);
          assert(overlapX <= tolerance || overlapY <= tolerance,
            `${element.id}: ${name} overlaps ${caption.className} by ${rounded(overlapX)}×${rounded(overlapY)} CSS px. Art ${JSON.stringify(rectangle(box))}; caption ${JSON.stringify(rectangle(captionBox))}.`);
        }
      }
      return {
        stageSize: [rounded(stageBox.width), rounded(stageBox.height)],
        anchorSize: [rounded(anchorBox.width), rounded(anchorBox.height)],
        clearances: {
          left: rounded(anchorBox.left - stageBox.left), top: rounded(anchorBox.top - stageBox.top),
          right: rounded(stageBox.right - anchorBox.right), bottom: rounded(stageBox.bottom - anchorBox.bottom),
        },
        captionRegions: captions.length,
        toleranceCssPx: tolerance,
      };
    }
    async function seekBoundary(element, progress) {
      const height = element.offsetHeight;
      const top = topOf(element);
      await scroll(top + progress * height - win.innerHeight / 2);
      const expected = Math.min(1, Math.max(0, (win.scrollY + win.innerHeight / 2 - top) / height));
      await until(() => Math.abs(Number(element.dataset.progress) - expected) < 0.003, `${element.id} progress update`);
      const capture = boundaryCapture(element);
      assert(Math.abs(capture.p - progress) <= 0.005, `${element.id}: expected ${progress}, observed ${capture.p}.`);
      assert(capture.label.length > 12, `${element.id}: stage caption missing.`);
      assert(capture.sourceCaption * capture.targetCaption < 0.0001, `${element.id}: outgoing and incoming captions overlap.`);
      assert(visible(element.querySelector('.anchor-caption')), `${element.id}: continuity anchor caption is absent.`);
      capture.geometry = verifyTransitionBounds(element);
      return capture;
    }

    for (const [width, height] of [[1440, 900], [390, 844]]) {
      await check(`Full path viewport ${width}×${height}`, async () => {
        await resize(width, height);
        await setMotion('on');
        return { innerWidth: win.innerWidth, innerHeight: win.innerHeight, dpr: win.devicePixelRatio };
      });
      for (const section of chapters()) {
        await check(`${width}×${height} ${section.id} reading hold`, async () => {
          await show(section, 105);
          const errors = textBounds(section);
          assert(errors.length === 0, `Horizontal/clipped text: ${JSON.stringify(errors.slice(0, 8))}`);
          assert(section.querySelectorAll('.beat').length === 2, 'Both content beats are not present.');
          const interaction = section.querySelector('[data-interaction]');
          for (const button of interaction.querySelectorAll('button[data-select]')) {
            const box = button.getBoundingClientRect();
            assert(box.width >= 43.5 && box.height >= 43.5, `Interaction target is smaller than 44 CSS px: ${cleanText(button)} (${box.width}×${box.height}).`);
          }
          return { title: cleanText(section.querySelector('.chapter-heading h2')), beats: 2, textBounds: 'within viewport', interactionTargets: 'at least 44 CSS px' };
        });
      }
      for (const [index, element] of transitions().entries()) {
        await check(`${width}×${height} ${element.id} five stages and reverse`, async () => {
          const captures = [];
          for (const p of [0, 0.25, 0.5, 0.75, 1]) {
            const capture = await seekBoundary(element, p);
            assert(capture.stage === Math.min(4, Math.floor(p * 4)), `${element.id}: stage ${capture.stage} does not match quarter ${p}.`);
            const expectedChapter = index + (p < 0.5 ? 1 : 2);
            assert(Number(doc.documentElement.dataset.chapter) === expectedChapter, `${element.id}: active chapter does not match boundary ownership.`);
            captures.push(capture);
          }
          for (const p of [0.75, 0.5, 0.25]) {
            const reverse = await seekBoundary(element, p);
            const forward = captures[Math.round(p * 4)];
            assert(reverse.stage === forward.stage && reverse.label === forward.label, 'Reverse visit changes stage identity.');
            for (const key of ['sourceOpacity', 'targetOpacity', 'sourceClip', 'targetClip']) {
              assert(reverse[key] === forward[key], `Reverse visit changes ${key}.`);
            }
          }
          const neighbors = [];
          // Keep the probes farther than one CSS scroll pixel from a threshold.
          for (const p of [0.005, 0.245, 0.255, 0.495, 0.505, 0.745, 0.755, 0.995]) {
            const neighbor = await seekBoundary(element, p);
            assert(neighbor.stage === Math.floor(p * 4), `${element.id}: stage is stale next to threshold ${p}.`);
            neighbors.push({ progress: neighbor.p, stage: neighbor.stage });
          }
          await scroll(0);
          const direct = await seekBoundary(element, 0.5);
          assert(direct.stage === captures[2].stage && direct.targetClip === captures[2].targetClip && direct.sourceClip === captures[2].sourceClip, 'Direct midpoint differs from sequential playback.');
          return { stages: captures.map(c => ({ progress: c.p, stage: c.stage, label: c.label, geometry: c.geometry })), thresholdNeighbors: neighbors, reverse: 'matched', directMidpoint: 'matched', artworkContainment: 'within stage; separated from caption rows', visualQuality: 'requires screenshot review' };
        });
      }
    }

    const viewports = [
      [320, 700], [360, 640], [390, 844], [768, 1024], [1440, 900],
      [1920, 1080], [2560, 1440], [3840, 2160], [844, 390],
    ];
    // Read actual authored media rules instead of guessing the breakpoints.
    const breakpoints = new Set();
    function readRules(rules) {
      for (const rule of rules) {
        if (rule.conditionText) {
          for (const match of rule.conditionText.matchAll(/(?:min|max)-width\s*:\s*(\d+)px/g)) breakpoints.add(Number(match[1]));
        }
        if (rule.cssRules) readRules(rule.cssRules);
      }
    }
    for (const sheet of [...doc.styleSheets]) {
      try { readRules(sheet.cssRules); } catch { /* Cross-origin sheets are not queried. */ }
    }
    for (const width of [...breakpoints].sort((a, b) => a - b)) {
      if (width > 300 && width < 2000) {
        viewports.push([width - 1, 900], [width + 1, 900]);
      }
    }
    const visitedSizes = new Set();
    for (const [width, height] of viewports) {
      const key = `${width}×${height}`;
      if (visitedSizes.has(key)) continue;
      visitedSizes.add(key);
      await check(`Responsive bounds ${key}`, async () => {
        await resize(width, height);
        await closeDialogs();
        await scroll(0);
        assert(doc.documentElement.scrollWidth <= doc.documentElement.clientWidth + 1, `Horizontal page overflow: ${doc.documentElement.scrollWidth} > ${doc.documentElement.clientWidth} content pixels.`);
        const errors = textBounds();
        assert(errors.length === 0, `Text bounds failed: ${JSON.stringify(errors.slice(0, 10))}`);
        const riskSections = ['living-form', 'one-way-gates', 'exchange', 'around-the-body', 'beat-again'];
        for (const id of riskSections) {
          const section = doc.getElementById(id);
          assert(section.offsetHeight > 100, `${id} collapsed at ${key}.`);
          assert(section.querySelectorAll('.beat').length === 2, `${id} lost content at ${key}.`);
        }
        const exchange = q('#diagram-7');
        assert(exchange.offsetWidth <= win.innerWidth + 1, 'The gas-exchange plate exceeds the viewport.');
        const media = q('.hero picture img');
        assert(media && media.getBoundingClientRect().width > 100, 'Hero art has no composed image rectangle.');
        return { cssViewport: [win.innerWidth, win.innerHeight], dpr: win.devicePixelRatio, contentWidth: doc.documentElement.clientWidth, scrollWidth: doc.documentElement.scrollWidth, textBounds: 'clear', riskSections };
      });
    }

    await check('Narrow phone can reach motion and about controls', async () => {
      await resize(320, 700);
      await closeDialogs();
      q('button[data-open="chapters-dialog"]').click();
      await until(() => q('#chapters-dialog').open, 'Narrow menu opening');
      const motion = q('#chapters-dialog button[data-motion]');
      const about = q('#chapters-dialog button[data-open="about-dialog"]');
      assert(visible(motion) && visible(about), 'Narrow layout has no visible route to Motion/About.');
      about.click();
      await until(() => q('#about-dialog').open, 'About dialog opening');
      assert(!q('#chapters-dialog').open, 'Opening About left another modal open.');
      const errors = textBounds(q('#about-dialog'));
      assert(errors.length === 0, `About dialog text overflow: ${JSON.stringify(errors)}`);
      await closeDialogs();
      return 'Both controls remain available from the phone chapter menu.';
    });

    await check('Reduced-motion transition and interaction results', async () => {
      await resize(390, 844);
      await setMotion('reduced');
      for (const element of transitions()) {
        const before = await seekBoundary(element, 0.25);
        const after = await seekBoundary(element, 0.75);
        assert(before.sourceOpacity === '1' && before.targetOpacity === '0', 'Reduced source plate is not complete.');
        assert(after.sourceOpacity === '0' && after.targetOpacity === '1', 'Reduced target plate is not complete.');
      }
      const oxygen = q('[data-interaction="7"] [data-select="oxygen"]');
      oxygen.click();
      await raf(1);
      verifyCoreVisualState(7, 'oxygen', q('#diagram-7'));
      assert(cleanText(q('#result-7')).includes('alveolar air → tissue barrier → capillary blood'), 'Reduced motion lost the oxygen direction result.');
      q('[data-interaction="7"] [data-reset]').click();
      return { transitionPlates: 20, gasDirection: 'retained', chapters: chapters().length };
    });

    await check('Late chapter link and return to the identical opening', async () => {
      await resize(1440, 900);
      await setMotion('on');
      const originalHeroSrc = q('.hero picture img').currentSrc;
      q('.footer-index a[href="#beat-again"]').click();
      await until(() => win.location.hash === '#beat-again' && doc.activeElement?.id === 'beat-again-title', 'Ending navigation');
      assert(q('#beat-again .ending-art img').getAttribute('src') === q('.hero-art img').getAttribute('src'), 'Ending does not reuse the same hero image identity.');
      q('#beat-again .primary-link').click();
      await until(() => win.location.hash === '#beginning' && win.scrollY <= 1, 'Opening return');
      assert(q('.hero picture img').currentSrc === originalHeroSrc, 'Opening return selected a different hero image.');
      assert(doc.activeElement?.id === 'hero-title', 'Opening return did not restore title focus.');
      assert(cleanText(q('#hero-title')).replace(/\s/g, '') === 'Everybeathasadirection.', 'Opening text changed during the journey.');
      return { hash: win.location.hash, focus: doc.activeElement.id, imageIdentity: 'retained' };
    });

    await emit('Coverage limits of this automated iframe suite', 'NOT TESTED', {
      requiresSeparateReview: [
        'Aesthetic fidelity, screenshot inspection, and scientific illustration review',
        'Continuous-motion recording and one-frame visual artifacts',
        'Physical or browser-native keyboard, pointer, wheel, touch and scrollbar interactions',
        '125%, 150% and 200% actual browser zoom',
        'Browser history traversal, reload and background/resume outside this isolated iframe',
        'Resource failure, deliberately slow network and late-font injection',
        'Audio output quality and immediate audible silence',
        'Field Core Web Vitals, real hardware frame pacing, Safari and physical devices',
      ],
      reason: 'These checks require capabilities or human visual evidence beyond DOM activation in an isolated production iframe. Shared parent history is deliberately not traversed.',
    });
  } finally {
    try {
      await closeDialogs();
      await setMotion(originalMotion);
      frame.style.width = originalSize.width;
      frame.style.height = originalSize.height;
      await raf(3);
      await scroll(0);
    } catch (error) {
      await emit('Harness state restoration', 'FAIL', error instanceof Error ? error.message : String(error));
    }
    await emit('Automated suite totals', results.some(row => row.status === 'FAIL') ? 'FAIL' : 'PASS', {
      passed: results.filter(row => row.status === 'PASS').length,
      failed: results.filter(row => row.status === 'FAIL').length,
      blocked: results.filter(row => row.status === 'BLOCKED').length,
      notTested: results.filter(row => row.status === 'NOT TESTED').length,
      elapsedMs: Math.round(performance.now() - startedAt),
      caveat: 'These totals summarize only the recorded automated cases, not H1–H9 acceptance.',
    });
  }
  return results;
}
