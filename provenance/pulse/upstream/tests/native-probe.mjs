/** Test-page recorder, injected before the production module. No network calls. */
(() => {
  const build = JSON.parse(document.getElementById('pulse-native-review-build').textContent);
  const entries = [];
  const performanceEntries = { paint: [], 'largest-contentful-paint': [], longtask: [] };
  const observers = [];
  const support = {};
  const round = value => Number(value.toFixed(2));
  const limit = (array, value, maximum = 300) => { array.push(value); if (array.length > maximum) array.shift(); };
  let toolbar, output, measureButton, initialized = false, measuring = false, lastContentFocus = null;
  const resourceName = value => value?.startsWith('data:') ? `${value.slice(0, value.indexOf(',') + 1)} [${value.length} characters]` : value;
  const elementInfo = element => element ? { tag: element.tagName, id: element.id || null, text: element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 100), tabindex: element.getAttribute('tabindex') } : null;
  const imageInfo = img => ({
    picture: img.closest('picture')?.className, asset: img.closest('picture')?.dataset.assetId ?? null,
    state: img.closest('picture')?.dataset.assetState ?? 'not set', complete: img.complete,
    naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, currentSrc: resourceName(img.currentSrc || img.src),
  });
  const memory = () => performance.memory ? {
    usedJSHeapSize: performance.memory.usedJSHeapSize, totalJSHeapSize: performance.memory.totalJSHeapSize,
    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
  } : null;
  function record(name, details, announce = false) {
    const entry = { name, status: 'OBSERVED', atMs: round(performance.now()), details };
    limit(entries, entry, 600);
    if (announce && output) output.textContent = JSON.stringify(entry, null, 2);
    return entry;
  }
  for (const type of Object.keys(performanceEntries)) {
    try {
      if (!PerformanceObserver.supportedEntryTypes.includes(type)) {
        support[type] = 'unavailable: entry type not supported';
        continue;
      }
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          const details = { name: entry.name, startTime: round(entry.startTime), duration: round(entry.duration) };
          if (type === 'largest-contentful-paint') Object.assign(details, {
            size: entry.size, renderTime: entry.renderTime, loadTime: entry.loadTime,
            url: resourceName(entry.url), element: elementInfo(entry.element),
          });
          limit(performanceEntries[type], details);
          record(`Performance entry: ${type}`, details);
        }
      });
      observer.observe({ type, buffered: true });
      observers.push(observer); support[type] = 'observer registered';
    } catch (error) { support[type] = `unavailable: ${error.message}`; }
  }
  record('Recorder initialized before app module', { build, observerSupport: support, readyState: document.readyState });
  for (const name of ['load', 'error']) document.addEventListener(name, event => {
    if (event.target instanceof HTMLImageElement) record(`Image ${name} event`, imageInfo(event.target));
  }, true);

  function inspect() {
    const images = [...document.images].map(imageInfo);
    return record('Current native document state', {
      href: location.href, hash: location.hash, historyLength: history.length,
      scroll: [round(scrollX), round(scrollY)], chapter: document.documentElement.dataset.chapter ?? null,
      focus: elementInfo(document.activeElement), lastContentFocus,
      imagesReady: images.filter(img => img.complete && img.naturalWidth > 0).length, images,
      viewport: [innerWidth, innerHeight], clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth, dpr: devicePixelRatio,
      visibility: document.visibilityState, documentHasFocus: document.hasFocus(), topLevel: window.top === window,
      hero: document.querySelector('.hero')?.dataset.heroState ?? null,
    }, true);
  }

  async function measureTransition() {
    if (measuring) return record('Pacing measurement already active', {});
    const transition = document.getElementById('tr-06-07');
    if (!transition || document.hidden) return record('Pacing measurement not started', { reason: !transition ? 'TR-06-07 is absent.' : 'The document is hidden.' }, true);
    measuring = true;
    if (measureButton) measureButton.disabled = true;
    if (output) output.textContent = 'Measuring a 4.8-second native scroll sweep…';
    const duration = 4800;
    const top = transition.getBoundingClientRect().top + scrollY;
    const height = transition.offsetHeight;
    const startScroll = Math.max(0, top - innerHeight / 2);
    const start = performance.now();
    const memoryBefore = memory();
    const viewport = [innerWidth, innerHeight];
    const intervals = [], samples = [];
    let previous, frameId, timer;
    scrollTo({ top: startScroll, behavior: 'instant' });
    const details = await new Promise(resolve => {
      let finished = false;
      const finish = reason => {
        if (finished) return;
        finished = true;
        cancelAnimationFrame(frameId); clearTimeout(timer);
        document.removeEventListener('visibilitychange', visibility);
        const end = performance.now();
        const sorted = [...intervals].sort((a, b) => a - b);
        const percentile = fraction => sorted.length ? round(sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)]) : null;
        resolve({
          reason, requestedDurationMs: duration, observedDurationMs: round(end - start), viewport,
          endingViewport: [innerWidth, innerHeight], dpr: devicePixelRatio,
          visibility: document.visibilityState, documentHasFocus: document.hasFocus(),
          frames: samples.length, intervalCount: intervals.length, medianMs: percentile(0.5), p95Ms: percentile(0.95),
          largestMs: sorted.length ? round(sorted.at(-1)) : null,
          intervalsOver50Ms: intervals.filter(value => value > 50).length,
          timeSinceLastFrameMs: previous === undefined ? null : round(end - previous), intervalsMs: intervals.map(round), samples,
          longTasks: support.longtask === 'observer registered' ? performanceEntries.longtask.filter(entry => entry.startTime + entry.duration >= start && entry.startTime <= end) : null,
          memoryBefore, memoryAfter: memory(),
          method: 'Native window.scrollTo traverses TR-06-07 forward then reverse, driven by requestAnimationFrame for 4.8 seconds; a 6.8-second watchdog bounds normal event-loop operation.',
          limits: 'Intervals describe this document and browser session. No cause is assigned. JS heap memory is a nonstandard browser estimate, not total or GPU memory. These are not field Core Web Vitals or a cold-network benchmark.',
        });
      };
      const visibility = () => { if (document.hidden) finish('document became hidden'); };
      document.addEventListener('visibilitychange', visibility);
      timer = setTimeout(() => finish('watchdog reached'), 6800);
      const sample = now => {
        if (finished) return;
        if (previous !== undefined) limit(intervals, now - previous, 2048);
        previous = now;
        const elapsed = Math.max(0, now - start);
        const fraction = Math.min(1, elapsed / duration);
        const requestedProgress = fraction <= 0.5 ? fraction * 2 : (1 - fraction) * 2;
        limit(samples, {
          elapsedMs: round(elapsed), requestedProgress: round(requestedProgress), scrollY: round(scrollY),
          renderedProgress: transition.dataset.progress ?? null, stage: transition.dataset.stage ?? null,
        }, 2048);
        scrollTo({ top: top + height * requestedProgress - innerHeight / 2, behavior: 'instant' });
        if (fraction >= 1) finish('completed'); else frameId = requestAnimationFrame(sample);
      };
      frameId = requestAnimationFrame(sample);
    });
    measuring = false;
    if (measureButton) measureButton.disabled = false;
    return record('Measured native TR-06-07 pacing', details, true);
  }

  const snapshot = () => ({
    schema: 'pulse-native-review-v1', build, savedAt: new Date().toISOString(),
    context: { userAgent: navigator.userAgent, url: location.href, topLevel: window.top === window, timeOrigin: performance.timeOrigin, observerSupport: support },
    interpretation: 'All entries are observations, not automatic pass results. Paint and LCP entries are observed local candidates; this log does not certify final field Core Web Vitals.',
    performanceEntries, entries,
  });
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot(), null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'pulse-native-review-log.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function initialize() {
    if (initialized || !document.body) return;
    initialized = true;
    let heroSignature = '';
    const observeHero = () => {
      const hero = document.querySelector('.hero');
      if (!hero) return;
      const signature = `${hero.dataset.heroState}:${hero.dataset.heroAsset}`;
      if (signature === heroSignature) return;
      heroSignature = signature;
      record('Hero state observed', { state: hero.dataset.heroState, asset: hero.dataset.heroAsset ?? 'not set', progress: hero.dataset.heroProgress ?? null, scrollY: round(scrollY), image: imageInfo(hero.querySelector('img')) });
    };
    const mutation = new MutationObserver(records => {
      for (const target of new Set(records.map(entry => entry.target))) {
        if (target.matches('.hero')) observeHero();
        else if (target.tagName === 'PICTURE' && target.querySelector('img')) record('Image readiness state observed', imageInfo(target.querySelector('img')));
      }
    });
    mutation.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-hero-state', 'data-hero-asset', 'data-asset-state'] });
    observeHero();
    record('Images at document initialization', [...document.images].map(imageInfo));
    const style = document.createElement('style');
    style.textContent = '#pulse-native-tools{position:fixed;z-index:2147483647;right:12px;bottom:24px;width:min(370px,calc(100vw - 24px));box-sizing:border-box;padding:10px;background:#16141a;color:#fff;border:1px solid #9a896a;border-radius:8px;font:12px/1.4 system-ui,sans-serif;box-shadow:0 4px 24px #0006}#pulse-native-tools header{display:flex;align-items:center;justify-content:space-between;gap:8px}#pulse-native-tools button{appearance:auto;border:1px solid #8f836f;border-radius:4px;background:#29252e;color:#fff;padding:5px 8px;font:inherit;cursor:pointer}#pulse-native-tools button:focus-visible{outline:2px solid #f7ce80;outline-offset:2px}#pulse-native-tools button:disabled{opacity:.6;cursor:wait}#pulse-native-tools .probe-controls{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}#pulse-native-tools pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:160px;overflow:auto;margin:6px 0 0;font:11px/1.4 monospace}#pulse-native-tools [hidden]{display:none!important}#pulse-native-tools p{font:inherit;margin:6px 0;color:#ded7cb}';
    document.head.append(style);
    toolbar = document.createElement('aside');
    toolbar.id = 'pulse-native-tools'; toolbar.setAttribute('aria-label', 'Native review diagnostics');
    toolbar.innerHTML = '<header><strong>PULSE · Native review</strong><button type="button" aria-expanded="true">Hide</button></header><div class="probe-panel"><div class="probe-controls"><button type="button">Inspect state</button><button type="button">Measure TR-06-07</button><button type="button">Download log</button></div><p>Observed measurements only. This toolbar belongs to the test page.</p><pre aria-live="polite">Ready. Use native browser keys and history normally.</pre></div>';
    document.body.append(toolbar);
    const [hide, inspectButton, pacing, downloadButton] = toolbar.querySelectorAll('button');
    output = toolbar.querySelector('pre'); measureButton = pacing;
    hide.addEventListener('click', () => {
      const panel = toolbar.querySelector('.probe-panel'); panel.hidden = !panel.hidden;
      hide.textContent = panel.hidden ? 'Show probe' : 'Hide'; hide.setAttribute('aria-expanded', String(!panel.hidden));
    });
    inspectButton.addEventListener('click', inspect);
    pacing.addEventListener('click', measureTransition);
    downloadButton.addEventListener('click', download);
  }
  document.addEventListener('readystatechange', () => { if (document.readyState !== 'loading') initialize(); });
  document.addEventListener('DOMContentLoaded', initialize, { once: true });
  if (document.readyState !== 'loading') initialize();
  document.addEventListener('focusin', event => { if (!event.target.closest('#pulse-native-tools')) lastContentFocus = elementInfo(event.target); });
  document.addEventListener('keydown', event => {
    if (['Tab', 'Escape', 'Home', 'End', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp'].includes(event.key)) record('Native key event observed', { key: event.key, trusted: event.isTrusted, target: elementInfo(event.target), scrollY: round(scrollY) });
  }, true);
  for (const name of ['popstate', 'hashchange', 'pageshow', 'pagehide']) window.addEventListener(name, event => record(`Browser ${name} observed`, { hash: location.hash, scrollY: round(scrollY), persisted: event.persisted ?? null, focus: elementInfo(document.activeElement) }));
  window.addEventListener('load', () => record('Window load observed', { navigation: performance.getEntriesByType('navigation')[0]?.toJSON() ?? null }), { once: true });
  window.__pulseNativeProbe = { build, entries, performanceEntries, inspect, measure: measureTransition, snapshot, download };
})();
