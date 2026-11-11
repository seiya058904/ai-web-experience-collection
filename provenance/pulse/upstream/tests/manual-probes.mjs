/** Optional measurements for the local review page, never shipped into the app. */
export function installManualProbes(frame, record) {
  let observer;
  frame.addEventListener('load', () => {
    observer?.disconnect();
    const doc = frame.contentDocument;
    const win = frame.contentWindow;
    const hero = doc.querySelector('.hero');
    if (!hero) return;
    let lastState = '';
    const observeHero = () => {
      const state = hero.dataset.heroState;
      if (lastState === state) return;
      lastState = state;
      const picture = hero.querySelector('img');
      record({ name: `Hero state observed: ${state}`, status: 'OBSERVED', details: {
        timeSinceNavigationMs: Math.round(win.performance.now()),
        viewport: [win.innerWidth, win.innerHeight],
        state, asset: hero.dataset.heroAsset ?? 'static HTML',
        naturalImageWidth: picture?.naturalWidth ?? 0,
        title: hero.querySelector('h1')?.textContent,
        titleOpacity: win.getComputedStyle(hero.querySelector('h1')).opacity,
        imageTransform: picture ? win.getComputedStyle(picture).transform : '',
        note: 'Observed state and DOM geometry; visual evidence is recorded separately.',
      } });
    };
    observer = new win.MutationObserver(observeHero);
    observer.observe(hero, { attributes: true, attributeFilter: ['data-hero-state'] });
    observeHero();
  });

  document.getElementById('pacing').addEventListener('click', async event => {
    const button = event.currentTarget;
    button.disabled = true;
    const win = frame.contentWindow;
    const doc = frame.contentDocument;
    const transition = doc.querySelector('[data-transition="5"]');
    const top = transition.getBoundingClientRect().top + win.scrollY;
    const height = transition.offsetHeight;
    const intervals = [];
    const longTasks = [];
    const memoryBefore = win.performance.memory?.usedJSHeapSize ?? null;
    let taskObserver;
    try {
      taskObserver = new win.PerformanceObserver(list => {
        for (const entry of list.getEntries()) longTasks.push({ startTime: entry.startTime, duration: entry.duration });
      });
      taskObserver.observe({ type: 'longtask', buffered: false });
    } catch { /* Unsupported metrics remain explicitly unavailable. */ }
    let previous;
    let started;
    await new Promise(resolve => {
      const sample = now => {
        started ??= now;
        if (previous !== undefined) intervals.push(now - previous);
        previous = now;
        const p = Math.min(1, (now - started) / 4800);
        const path = p < 0.5 ? p * 2 : (1 - p) * 2;
        win.scrollTo({ top: top + height * path - win.innerHeight / 2, behavior: 'instant' });
        if (p < 1) win.requestAnimationFrame(sample); else resolve();
      };
      win.requestAnimationFrame(sample);
    });
    taskObserver?.disconnect();
    const sorted = [...intervals].sort((a, b) => a - b);
    const percentile = p => Number((sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0).toFixed(2));
    record({ name: 'Measured TR-06-07 frame intervals', status: 'OBSERVED', details: {
      method: '4.8-second browser-resident native-scroll sweep, forward then reverse; warm embedded production snapshot',
      cssViewport: [win.innerWidth, win.innerHeight], dpr: win.devicePixelRatio,
      frames: intervals.length, medianMs: percentile(0.5), p95Ms: percentile(0.95), largestMs: percentile(1),
      intervalsOver50Ms: intervals.filter(value => value > 50).length,
      longTasks: taskObserver ? longTasks : 'unsupported',
      memoryBeforeBytes: memoryBefore, memoryAfterBytes: win.performance.memory?.usedJSHeapSize ?? null,
      caveat: 'Remote Chromium, hardware unknown, no throttling configured. This is not cold-network timing, field Core Web Vitals, physical input, or a recorded video.',
    } });
    button.disabled = false;
  });
}
