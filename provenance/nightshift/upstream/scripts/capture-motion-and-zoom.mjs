import { chromium } from 'playwright';
import { preview } from 'vite';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, writeFile, copyFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.NIGHTSHIFT_MOTION_PORT || 4331);
const origin = `http://127.0.0.1:${port}/`;
const evidenceRoot = path.join(root, 'evidence');
const frameDirectory = await mkdtemp(path.join(os.tmpdir(), 'nightshift-screencast-'));
const videoRelative = 'evidence/recordings/high-risk-transitions.mp4';
const selectedDirectory = path.join(evidenceRoot, 'motion-frames');
const zoomDirectory = path.join(evidenceRoot, 'zoom');
await Promise.all([mkdir(path.join(evidenceRoot, 'recordings'), { recursive: true }), mkdir(path.join(evidenceRoot, 'records'), { recursive: true }), mkdir(selectedDirectory, { recursive: true }), mkdir(zoomDirectory, { recursive: true })]);
const report = {
  status: 'IN PROGRESS', startedAt: new Date().toISOString(),
  method: 'Actual headless Chromium CDP screencast JPEG frames, timestamped and concatenated as variable-duration frames; native scripted scroll; actual keyboard zoom attempts and separately labeled equivalent reflow checks.',
  browser: null, viewport: { width: 1440, height: 900 }, devicePixelRatio: 1,
  environment: 'Virtualized Linux, underlying hardware unknown; --disable-gpu headless fixture. No physical-device or GPU-frame-rate claim.',
  motion: null, trueBrowserZoom: [], equivalentReflow: [], errors: [],
  visualReview: { status: 'NOT TESTED', note: 'Capture and programmatic image-state checks are not aesthetic acceptance. Review actual retained frames and the movie separately.' },
};
let server;
let browser;

async function fingerprint() {
  const files = ['index.html', ...(await readdir(path.join(root, 'dist/assets'))).filter(name => /\.(js|css)$/.test(name)).map(name => `assets/${name}`)];
  return Promise.all(files.sort().map(async file => ({ file, sha256: createHash('sha256').update(await readFile(path.join(root, 'dist', file))).digest('hex') })));
}

async function runProcess(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve({ stdout, stderr }) : reject(new Error(`${command} exited ${code}: ${stderr.slice(-3500)}`)));
  });
}

async function ready(page) {
  await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.querySelectorAll('#stage img')].filter(img => !img.closest('[hidden]')).every(img => img.complete && img.naturalWidth > 0));
}

async function seek(page, id, progress) {
  await page.evaluate(({ id, progress }) => {
    const rect = document.getElementById(id).getBoundingClientRect();
    const start = rect.top + scrollY - innerHeight * .70;
    const end = rect.bottom + scrollY - innerHeight * .12;
    scrollTo(0, Math.ceil(start + (end - start) * progress));
  }, { id, progress });
  await page.waitForTimeout(150);
  await ready(page);
}

async function metrics(page) {
  return page.evaluate(() => ({
    innerWidth, innerHeight, outerWidth, outerHeight, devicePixelRatio,
    visualViewport: visualViewport ? { width: visualViewport.width, height: visualViewport.height, scale: visualViewport.scale, offsetLeft: visualViewport.offsetLeft, offsetTop: visualViewport.offsetTop } : null,
  }));
}

async function layoutSnapshot(page, label, headingSelector = null) {
  return page.evaluate(({ label, headingSelector }) => {
    const rect = headingSelector ? document.querySelector(headingSelector)?.getBoundingClientRect() : null;
    const heading = rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom } : null;
    const viewportWidth = innerWidth;
    return {
      label, viewport: { width: innerWidth, height: innerHeight }, dpr: devicePixelRatio,
      scrollY, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth,
      noHorizontalOverflow: document.documentElement.scrollWidth <= viewportWidth && document.body.scrollWidth <= viewportWidth,
      heading,
      headingWithinHorizontalViewport: !heading || (heading.x >= -.5 && heading.right <= viewportWidth + .5),
      headingFullyWithinViewport: !heading || (heading.x >= -.5 && heading.y >= -.5 && heading.right <= viewportWidth + .5 && heading.bottom <= innerHeight + .5),
      chapter: document.body.dataset.chapter, transition: document.body.dataset.transition, progress: document.body.dataset.transitionProgress,
      imageState: [...document.querySelectorAll('#stage img')].filter(img => !img.closest('[hidden]')).map(img => ({ key: img.parentElement?.dataset.key, complete: img.complete, width: img.naturalWidth })),
    };
  }, { label, headingSelector });
}

async function riskChecks(page, label, screenshotPrefix) {
  const states = [];
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await ready(page);
  states.push(await layoutSnapshot(page, 'Hero', '#hero-title'));
  await page.screenshot({ path: path.join(zoomDirectory, `${screenshotPrefix}-hero.jpg`), type: 'jpeg', quality: 83 });

  await page.goto(`${origin}#ch-06`);
  await ready(page);
  await page.waitForFunction(() => document.body.dataset.chapter === 'ch-06');
  states.push(await layoutSnapshot(page, 'Long primary title', '#title-ch-06'));

  await seek(page, 'tr-06-07', .5);
  states.push(await layoutSnapshot(page, 'Rail to water midpoint'));
  await page.screenshot({ path: path.join(zoomDirectory, `${screenshotPrefix}-rail-water.jpg`), type: 'jpeg', quality: 83 });

  await page.goto(`${origin}#ch-05`);
  await ready(page);
  await page.locator('[data-compare="after"]').click();
  const afterValue = await page.locator('#curb-range').inputValue();
  await page.locator('[data-compare="reset"]').click();
  const resetValue = await page.locator('#curb-range').inputValue();
  const comparison = await layoutSnapshot(page, 'Curb comparison controls');
  comparison.afterValue = afterValue;
  comparison.resetValue = resetValue;
  comparison.controlsWork = afterValue === '100' && resetValue === '50';
  states.push(comparison);

  await page.goto(`${origin}#ch-11`);
  await ready(page);
  await page.waitForFunction(() => document.body.dataset.chapter === 'ch-11');
  states.push(await layoutSnapshot(page, 'Dawn', '#title-ch-11'));
  await page.locator('[data-trace="market"]').click();
  const dialog = await page.locator('#dialog-trace').boundingBox();
  const size = await metrics(page);
  const dialogFits = Boolean(dialog && dialog.x >= -.5 && dialog.y >= -.5 && dialog.x + dialog.width <= size.innerWidth + .5 && dialog.y + dialog.height <= size.innerHeight + .5);
  await page.screenshot({ path: path.join(zoomDirectory, `${screenshotPrefix}-dawn-dialog.jpg`), type: 'jpeg', quality: 83 });
  await page.keyboard.press('Escape');
  return {
    label, states, dialog, dialogFits,
    status: states.every(state => state.noHorizontalOverflow && state.headingWithinHorizontalViewport && state.headingFullyWithinViewport && state.controlsWork !== false) && dialogFits ? 'PASS' : 'FAIL',
    scope: 'Programmatic overflow, primary-heading bounds, comparison endpoint/reset behavior and dawn-dialog bounds. Separate screenshot review is still required for visual judgment.',
    screenshots: [`evidence/zoom/${screenshotPrefix}-hero.jpg`, `evidence/zoom/${screenshotPrefix}-rail-water.jpg`, `evidence/zoom/${screenshotPrefix}-dawn-dialog.jpg`],
  };
}

async function captureMovie() {
  const context = await browser.newContext({ viewport: report.viewport, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(origin, { waitUntil: 'networkidle' });
  await ready(page);
  const ids = ['tr-01-02', 'tr-05-06', 'tr-06-07'];
  for (const id of ids) { await seek(page, id, .5); await seek(page, id, .999); }
  await seek(page, ids[0], .001);
  const cdp = await context.newCDPSession(page);
  const frames = [];
  const writes = [];
  const writeErrors = [];
  cdp.on('Page.screencastFrame', event => {
    const index = frames.length;
    const name = `frame-${String(index).padStart(6, '0')}.jpg`;
    frames.push({ index, name, timestampSeconds: event.metadata.timestamp, source: 'CDP screencast', bytes: Buffer.byteLength(event.data, 'base64'), metadata: event.metadata });
    writes.push(writeFile(path.join(frameDirectory, name), Buffer.from(event.data, 'base64')).catch(error => writeErrors.push(error.message)));
    void cdp.send('Page.screencastFrameAck', { sessionId: event.sessionId }).catch(error => writeErrors.push(error.message));
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 76, maxWidth: 1440, maxHeight: 900, everyNthFrame: 1 });
  const segments = [];
  const settledFrames = [];
  for (const id of ids) {
    await seek(page, id, .001);
    await page.waitForTimeout(550);
    const segment = await page.evaluate(async id => {
      const rect = document.getElementById(id).getBoundingClientRect();
      const start = rect.top + scrollY - innerHeight * .70;
      const end = rect.bottom + scrollY - innerHeight * .12;
      const directionDurationMs = 3600;
      const probes = [];
      const startEpochMs = performance.timeOrigin + performance.now();
      async function travel(reverse) {
        let began = 0, checkpoint = -1;
        await new Promise(resolve => {
          const step = time => {
            if (!began) began = time;
            const t = Math.min(1, (time - began) / directionDurationMs);
            const p = reverse ? 1 - t : t;
            scrollTo(0, Math.ceil(start + (end - start) * Math.max(.0005, Math.min(.9995, p))));
            const nextCheckpoint = Math.floor(t * 4);
            if (checkpoint !== nextCheckpoint) {
              checkpoint = nextCheckpoint;
              probes.push({
                direction: reverse ? 'reverse' : 'forward', requestedProgress: p,
                epochMs: performance.timeOrigin + performance.now(), scrollY,
                transition: document.body.dataset.transition, observedProgress: document.body.dataset.transitionProgress,
                source: document.getElementById('stage')?.dataset.source, target: document.getElementById('stage')?.dataset.target,
                visibleImagesComplete: [...document.querySelectorAll('#stage img')].filter(img => !img.closest('[hidden]')).every(img => img.complete && img.naturalWidth > 0),
              });
            }
            if (t >= 1) resolve(); else requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        });
      }
      await travel(false);
      await new Promise(resolve => setTimeout(resolve, 650));
      await travel(true);
      await new Promise(resolve => setTimeout(resolve, 550));
      return { id, startEpochMs, endEpochMs: performance.timeOrigin + performance.now(), startY: start, endY: end, directionDurationMs, probes };
    }, id);
    segments.push(segment);
    // A full browser screenshot preserves the final static repaint even if CDP
    // does not emit another changed frame once the reverse hold becomes still.
    const screenshotStartedSeconds = Date.now() / 1000;
    const heldScreenshot = await page.screenshot({ type: 'jpeg', quality: 76, animations: 'allow' });
    const screenshotFinishedSeconds = Date.now() / 1000;
    const index = frames.length;
    const name = `frame-${String(index).padStart(6, '0')}.jpg`;
    frames.push({ index, name, timestampSeconds: (screenshotStartedSeconds + screenshotFinishedSeconds) / 2, source: 'Actual settled browser screenshot', bytes: heldScreenshot.length, timestampUncertaintyMs: (screenshotFinishedSeconds - screenshotStartedSeconds) * 1000 });
    writes.push(writeFile(path.join(frameDirectory, name), heldScreenshot));
    const relative = `evidence/motion-frames/${id}-reverse-held.jpg`;
    await writeFile(path.join(root, relative), heldScreenshot);
    settledFrames.push({ boundary: id, path: relative, actualFrameIndex: index, captureStartedSeconds: screenshotStartedSeconds, captureFinishedSeconds: screenshotFinishedSeconds });
    console.log(`Recorded ${id} forward and reverse.`);
  }
  await cdp.send('Page.stopScreencast');
  await Promise.all(writes);
  if (writeErrors.length) throw new Error(`Screencast frame write/ack errors: ${writeErrors.join('; ')}`);
  if (frames.length < 15) throw new Error(`Only ${frames.length} actual frames were captured.`);

  const validFrames = frames.filter(frame => Number.isFinite(frame.timestampSeconds)).sort((a, b) => a.timestampSeconds - b.timestampSeconds);
  let concat = 'ffconcat version 1.0\n';
  const durations = [];
  for (let i = 0; i < validFrames.length; i++) {
    const seconds = i < validFrames.length - 1 ? Math.max(.001, validFrames[i + 1].timestampSeconds - validFrames[i].timestampSeconds) : .10;
    durations.push(seconds);
    concat += `file '${validFrames[i].name}'\noption framerate 1000\nduration ${seconds.toFixed(6)}\n`;
  }
  concat += `file '${validFrames.at(-1).name}'\noption framerate 1000\n`;
  const concatPath = path.join(frameDirectory, 'frames.ffconcat');
  await writeFile(concatPath, concat);
  const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
  const version = await runProcess(ffmpeg, ['-version']);
  await runProcess(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', concatPath, '-fps_mode', 'vfr', '-enc_time_base', '1:1000', '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-pix_fmt', 'yuv420p', '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', '-video_track_timescale', '1000', '-movflags', '+faststart', path.join(root, videoRelative)]);
  const encodedInfo = JSON.parse((await runProcess(process.env.FFPROBE_PATH || 'ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,width,height,duration,nb_frames,avg_frame_rate', '-show_entries', 'format=duration,size', '-of', 'json', path.join(root, videoRelative)])).stdout);

  const selectedFrames = [];
  for (const segment of segments) {
    for (const probe of segment.probes) {
      const nearest = validFrames.reduce((best, frame) => Math.abs(frame.timestampSeconds * 1000 - probe.epochMs) < Math.abs(best.timestampSeconds * 1000 - probe.epochMs) ? frame : best, validFrames[0]);
      const name = `${segment.id}-${probe.direction}-${String(Math.round(probe.requestedProgress * 100)).padStart(3, '0')}.jpg`;
      await copyFile(path.join(frameDirectory, nearest.name), path.join(selectedDirectory, name));
      selectedFrames.push({ path: `evidence/motion-frames/${name}`, boundary: segment.id, direction: probe.direction, requestedProgress: probe.requestedProgress, actualFrameIndex: nearest.index, frameTimeOffsetSeconds: nearest.timestampSeconds - validFrames[0].timestampSeconds, sampleTimeErrorMs: Math.abs(nearest.timestampSeconds * 1000 - probe.epochMs) });
    }
  }
  await writeFile(path.join(frameDirectory, 'frames-index.json'), JSON.stringify(validFrames));
  let frameAnalysis = null;
  try {
    const analysis = await runProcess(process.env.PYTHON_PATH || 'python3', ['-c', `import json,sys,statistics\nfrom pathlib import Path\nfrom PIL import Image,ImageStat\np=Path(sys.argv[1]); frames=json.loads((p/'frames-index.json').read_text()); out=[]\nfor row in frames:\n im=Image.open(p/row['name']).convert('L').resize((96,60)); st=ImageStat.Stat(im); pixels=list(im.getdata()); out.append({'index':row['index'],'meanLuma':round(st.mean[0],3),'stddevLuma':round(st.stddev[0],3),'nearBlackPixelFraction':round(sum(x<5 for x in pixels)/len(pixels),4)})\nsuspects=[x for x in out if x['meanLuma']<5 and x['stddevLuma']<3]\nprint(json.dumps({'framesAnalyzed':len(out),'lowestMeanLuma':min(x['meanLuma'] for x in out),'lowestLumaStddev':min(x['stddevLuma'] for x in out),'nearUniformBlackFrameIndices':[x['index'] for x in suspects],'method':'Downsampled luminance scan of actual captured frames; only a near-uniform black-frame heuristic, not visual motion acceptance.'}))`, frameDirectory]);
    frameAnalysis = JSON.parse(analysis.stdout);
  } catch (error) { frameAnalysis = { status: 'UNAVAILABLE', reason: error.message }; }
  const bytes = await readFile(path.join(root, videoRelative));
  report.motion = {
    video: videoRelative, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'),
    ffmpegVersion: version.stdout.split('\n')[0],
    frameSource: 'CDP Page.startScreencast actual JPEG frames; everyNthFrame=1; quality=76; plus one actual full browser screenshot after each final reverse hold. No synthesized or interpolated visual frames.',
    capturedFrameCount: frames.length, timestampedFrameCount: validFrames.length,
    screencastFrameCount: frames.filter(frame => frame.source === 'CDP screencast').length,
    settledScreenshotCount: settledFrames.length,
    encodedInfo,
    capturedSpanSeconds: validFrames.at(-1).timestampSeconds - validFrames[0].timestampSeconds,
    concatenatedDurationSeconds: durations.reduce((sum, duration) => sum + duration, 0),
    timing: 'Each real frame is held until the next captured timestamp. FFmpeg variable-frame-rate encoding uses millisecond time bases. The final frame is repeated once to encode its hold; no motion interpolation is applied. Settled screenshot times use the midpoint of their measured capture interval.',
    segmentCuts: 'The three different boundaries are connected by explicit native-scroll jumps; each individual forward/reverse pass is continuous.',
    segments, selectedFrames, settledFrames, frameAnalysis, runtimeErrors: pageErrors,
    missingImageProbeCount: segments.flatMap(segment => segment.probes).filter(probe => !probe.visibleImagesComplete).length,
  };
  await context.close();
}

async function zoomChecks() {
  const context = await browser.newContext({ viewport: report.viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(origin);
  await ready(page);
  await page.keyboard.press('Control+0');
  await page.waitForTimeout(200);
  const baseline = await metrics(page);
  for (const [percent, steps] of [[125, 2], [150, 3], [200, 5]]) {
    await page.keyboard.press('Control+0');
    for (let i = 0; i < steps; i++) await page.keyboard.press('Control+Equal');
    await page.waitForTimeout(300);
    const actual = await metrics(page);
    const widthRatio = baseline.innerWidth / actual.innerWidth;
    const dprRatio = actual.devicePixelRatio / baseline.devicePixelRatio;
    const expected = percent / 100;
    const applied = Math.abs(widthRatio - expected) < .045 && Math.abs(dprRatio - expected) < .045;
    const record = {
      requestedPercent: percent, method: `Trusted Control+0, then ${steps} Control+Equal keyboard shortcuts`, baseline, actual, observedWidthRatio: widthRatio, observedDprRatio: dprRatio,
      status: applied ? 'APPLIED' : 'BLOCKED',
      reason: applied ? 'Both the CSS viewport and device pixel ratio changed consistently with the requested browser zoom.' : 'Trusted browser zoom shortcuts did not produce the requested CSS viewport/DPR change in this headless Chromium shell. No CSS zoom or viewport emulation is substituted as true browser zoom.',
    };
    if (applied) record.checks = await riskChecks(page, `True browser zoom ${percent}%`, `true-${percent}`);
    report.trueBrowserZoom.push(record);
  }
  await context.close();

  for (const [percent, width, height, dpr] of [[125, 1152, 720, 1.25], [150, 960, 600, 1.5], [200, 720, 450, 2]]) {
    const reflowContext = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr });
    const reflowPage = await reflowContext.newPage();
    const runtimeErrors = [];
    reflowPage.on('pageerror', error => runtimeErrors.push(error.message));
    const result = await riskChecks(reflowPage, `Equivalent reflow for ${percent}% at a fixed 1440×900 device-pixel area`, `reflow-${percent}`);
    report.equivalentReflow.push({ equivalentPercent: percent, viewport: { width, height }, devicePixelRatio: dpr, isTrueBrowserZoom: false, ...result, runtimeErrors });
    await reflowContext.close();
    console.log(`Measured ${percent}% equivalent reflow: ${result.status}.`);
  }
}

try {
  report.buildBefore = await fingerprint();
  server = await preview({ root, preview: { host: '127.0.0.1', port, strictPort: true } });
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'], headless: true });
  report.browser = browser.version();
  console.log('Recording actual high-risk transition frames...');
  await captureMovie();
  console.log('Attempting actual browser zoom and measuring equivalent reflow separately...');
  await zoomChecks();
  report.buildAfter = await fingerprint();
  report.buildUnchangedDuringRun = JSON.stringify(report.buildBefore) === JSON.stringify(report.buildAfter);
  if (!report.buildUnchangedDuringRun) report.errors.push('Production output changed during this run. Repeat affected checks against a stable build.');
  report.status = report.errors.length ? 'INCOMPLETE' : 'RECORDED';
} catch (error) {
  report.status = 'INCOMPLETE';
  report.errors.push(error.stack || String(error));
  process.exitCode = 1;
} finally {
  report.finishedAt = new Date().toISOString();
  await writeFile(path.join(evidenceRoot, 'records/motion-zoom.json'), JSON.stringify(report, null, 2) + '\n');
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.httpServer.close(resolve));
  if (report.motion) await rm(frameDirectory, { recursive: true, force: true });
  console.log(JSON.stringify({ status: report.status, video: report.motion?.video, frames: report.motion?.capturedFrameCount, trueBrowserZoom: report.trueBrowserZoom.map(row => ({ percent: row.requestedPercent, status: row.status })), equivalentReflow: report.equivalentReflow.map(row => ({ percent: row.equivalentPercent, status: row.status })), errors: report.errors }, null, 2));
}
