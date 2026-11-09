import {
  FRAMES, FPS, PRESET_LABELS, getPose, makeTimeline,
  type SpacingPreset, type Timeline, type TimelineConfig,
} from './timeline.ts';

export type Camera = 'landscape' | 'portrait';

export interface FramesProvider {
  load(frame: number, preset: SpacingPreset, camera: Camera): Promise<HTMLImageElement>;
  /** Optional: preserve the original baked bytes instead of encoding a canvas. */
  dataURL?(frame: number, preset: SpacingPreset, camera: Camera): Promise<string>;
}

export interface EmbeddedFrames {
  readonly landscape: readonly string[];
  readonly portrait: readonly string[];
}

export interface FilmPayload {
  readonly version: 1;
  readonly title: 'FRAME';
  readonly config: Readonly<TimelineConfig>;
  readonly fps: typeof FPS;
  readonly beats: readonly number[];
  readonly duration: number;
  readonly durationMs: number;
  readonly descriptions: readonly string[];
  readonly frames: EmbeddedFrames;
}

const IMAGE_DATA_URL = /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

function validateFrames(frames: EmbeddedFrames): EmbeddedFrames {
  const validate = (camera: Camera) => {
    const images = frames?.[camera];
    if (!Array.isArray(images) || images.length !== FRAMES) {
      throw new Error(`The ${camera} film needs all ${FRAMES} frames before it can be exported.`);
    }
    images.forEach((source, index) => {
      if (typeof source !== 'string' || !IMAGE_DATA_URL.test(source)) {
        throw new Error(`Frame ${index + 1} in the ${camera} film is not an embedded image.`);
      }
    });
    return Object.freeze([...images]);
  };
  return Object.freeze({ landscape: validate('landscape'), portrait: validate('portrait') });
}

/** JSON embedded in HTML must not be able to close its containing script tag. */
function inlineJSON(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

export function createFilmPayload(config: unknown, frames: EmbeddedFrames): FilmPayload {
  const timeline = makeTimeline(config);
  return Object.freeze({
    version: 1,
    title: 'FRAME',
    config: timeline.config,
    fps: FPS,
    beats: timeline.beats,
    duration: timeline.duration,
    durationMs: timeline.durationMs,
    descriptions: Object.freeze(Array.from({ length: FRAMES }, (_, index) =>
      getPose(index + 1, timeline.config.preset).description)),
    frames: validateFrames(frames),
  });
}

const filmStyles = `
*{box-sizing:border-box}html{color-scheme:light}body{margin:0;background:#aed0c4;color:#403d49;font-family:ui-rounded,'Trebuchet MS',Arial,sans-serif;line-height:1.5}button,input{font:inherit}button,a,input{touch-action:manipulation}button{cursor:pointer}button:disabled{cursor:default;opacity:.45}button:focus-visible,input:focus-visible,a:focus-visible,summary:focus-visible{outline:3px solid #403d49;outline-offset:4px}.wrap{max-width:1056px;margin:auto;padding:48px 32px 64px}header{display:flex;justify-content:space-between;gap:24px;align-items:end;margin-bottom:28px}h1{font-size:clamp(44px,8vw,76px);letter-spacing:-.075em;line-height:.95;margin:0 0 14px;font-weight:800}header p{margin:0;max-width:36ch}h2{font-size:clamp(28px,4vw,40px);letter-spacing:-.045em;line-height:1.1;margin:0 0 18px}.take{font-size:14px;text-align:right}.take span{display:block}.viewer{margin:0}picture{display:block;border-radius:18px;overflow:hidden;background:#aed0c4;aspect-ratio:1280/800}#frame{display:block;width:100%;height:100%;object-fit:contain}figcaption{padding:14px 0;min-height:66px;font-size:16px;max-width:70ch}.transport{border-top:1px solid #403d4933;border-bottom:1px solid #403d4933;padding:18px 0}.buttons{display:flex;flex-wrap:wrap;gap:10px;align-items:center}.buttons button{min-height:46px;border:1px solid #403d4959;border-radius:999px;padding:10px 20px;background:transparent;color:inherit}.buttons .primary{background:#403d49;color:#f8f8f1;border-color:#403d49}.buttons .push{margin-left:auto}.seek{display:flex;gap:18px;align-items:center;margin-top:18px}.seek input{flex:1;min-width:80px;accent-color:#403d49;height:30px}.time{font:13px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:nowrap}#status{font-size:14px;margin:14px 0 0;min-height:22px}.notes{margin:32px 0 24px;max-width:66ch}.notes p{margin:8px 0}details{border-top:1px solid #403d4933;margin-top:32px;padding-top:20px}summary{cursor:pointer;font-size:20px;letter-spacing:-.025em}.storyboard{list-style:none;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px 18px}.storyboard li{min-width:0}.thumbnail{aspect-ratio:1280/800;border-radius:8px;overflow:hidden;margin-bottom:8px;background:#9fbfb4}.thumbnail img{display:block;width:100%;height:100%;object-fit:contain}.frame-label{display:flex;justify-content:space-between;gap:12px;font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;margin-bottom:5px}.storyboard p{font-size:14px;margin:0}footer{font-size:13px;margin-top:36px;border-top:1px solid #403d4933;padding-top:20px}noscript p{padding:16px;border:1px solid #403d49}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@media(max-width:600px){.wrap{padding:30px 20px 48px}header{display:block}.take{text-align:left;margin-top:18px}.take span{display:inline}.take span+span:before{content:' · '}picture{aspect-ratio:720/800}figcaption{font-size:15px;min-height:82px}.buttons{gap:8px}.buttons button{padding:10px 15px}.buttons .push{margin-left:0}.seek{display:block}.seek input{width:100%;display:block}.time{display:block;margin-top:6px}.storyboard{grid-template-columns:repeat(2,minmax(0,1fr));gap:24px 14px}.frame-label{display:block}.frame-label span{display:block}.storyboard p{font-size:13px}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation:none!important;transition:none!important}}
`;

/** Plain, dependency-free JavaScript shipped inside the downloadable film. */
const filmRuntime = `
(() => {
  'use strict';
  const data = JSON.parse(document.getElementById('frame-data').textContent);
  const image = document.getElementById('frame');
  const portrait = document.getElementById('portrait');
  const caption = document.getElementById('caption');
  const playButton = document.getElementById('play');
  const replayButton = document.getElementById('replay');
  const previousButton = document.getElementById('previous');
  const nextButton = document.getElementById('next');
  const seek = document.getElementById('seek');
  const time = document.getElementById('time');
  const status = document.getElementById('status');
  const storyboard = document.getElementById('storyboard');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const beatMs = 1000 / data.fps;
  let elapsed = 0;
  let beat = 0;
  let currentFrame = 1;
  let started = 0;
  let playing = false;
  let pending = false;
  let filmVisible = true;
  let request = 0;
  let animation = 0;
  let readiness = null;
  const preparedImages = [];
  const pad = value => String(value).padStart(2, '0');
  function announce(message) { status.textContent = message; }
  function render(index) {
    beat = Math.max(0, Math.min(data.beats.length - 1, Math.floor(index)));
    currentFrame = data.beats[beat];
    const position = currentFrame - 1;
    image.src = data.frames.landscape[position];
    portrait.srcset = data.frames.portrait[position];
    image.alt = data.descriptions[position];
    caption.textContent = data.descriptions[position];
    seek.value = String(beat);
    seek.setAttribute('aria-valuetext', 'Beat ' + (beat + 1) + ' of ' + data.beats.length + ', frame ' + currentFrame + ' of 24');
    time.textContent = 'Frame ' + pad(currentFrame) + '/24 · ' + (elapsed / 1000).toFixed(2) + ' / ' + data.duration.toFixed(2) + ' s';
    previousButton.disabled = currentFrame === 1;
    nextButton.disabled = currentFrame === 24;
  }
  function pause(message) {
    request += 1;
    pending = false;
    playing = false;
    cancelAnimationFrame(animation);
    playButton.textContent = 'Play film';
    playButton.setAttribute('aria-pressed', 'false');
    playButton.removeAttribute('aria-busy');
    if (message) announce(message);
  }
  function ensureFrames() {
    if (readiness) return readiness;
    readiness = Promise.all([...data.frames.landscape, ...data.frames.portrait].map(source => new Promise((resolve, reject) => {
      const frame = new Image();
      preparedImages.push(frame);
      frame.onload = () => resolve();
      frame.onerror = () => reject(new Error('A frame could not be decoded.'));
      frame.src = source;
      if (frame.complete && frame.naturalWidth) resolve();
    }))).catch(error => { readiness = null; throw error; });
    return readiness;
  }
  function tick(now) {
    if (!playing) return;
    if (document.hidden) { pause('Paused while this tab is hidden.'); return; }
    elapsed = Math.min(data.durationMs, Math.max(0, now - started));
    render(Math.floor(elapsed / beatMs));
    if (elapsed >= data.durationMs) {
      pause('Just right. Your film has finished.');
      return;
    }
    animation = requestAnimationFrame(tick);
  }
  async function play() {
    if (playing || pending) { pause('Paused on frame ' + currentFrame + '.'); return; }
    if (!filmVisible) {
      image.scrollIntoView({ behavior: motion.matches ? 'auto' : 'smooth', block: 'nearest' });
      announce('Bringing the film into view. Press Play film once you can see it.');
      return;
    }
    const ticket = ++request;
    pending = true;
    playButton.textContent = 'Cancel';
    playButton.setAttribute('aria-busy', 'true');
    announce('Preparing the frames inside this file…');
    try { await ensureFrames(); }
    catch (error) {
      if (ticket === request) pause('A frame could not be read. Press Play film to retry, or export the film again.');
      return;
    }
    if (ticket !== request || document.hidden || !filmVisible) {
      if (ticket === request) pause(document.hidden
        ? 'Ready. Press Play film when this tab is visible.'
        : 'Ready. Return to the film and press Play film to continue.');
      return;
    }
    pending = false;
    playing = true;
    if (elapsed >= data.durationMs) { elapsed = 0; render(0); }
    started = performance.now() - elapsed;
    playButton.textContent = 'Pause';
    playButton.setAttribute('aria-pressed', 'true');
    playButton.removeAttribute('aria-busy');
    announce('Playing your ' + data.duration.toFixed(2) + '-second film.');
    animation = requestAnimationFrame(tick);
  }
  function selectFrame(frame) {
    pause();
    const target = Math.max(1, Math.min(24, frame));
    const index = data.beats.indexOf(target);
    elapsed = index * beatMs;
    render(index);
    announce('Frame ' + target + ' of 24. ' + data.descriptions[target - 1]);
  }
  playButton.addEventListener('click', play);
  replayButton.addEventListener('click', () => { pause(); elapsed = 0; render(0); play(); });
  previousButton.addEventListener('click', () => selectFrame(currentFrame - 1));
  nextButton.addEventListener('click', () => selectFrame(currentFrame + 1));
  seek.addEventListener('input', () => {
    pause();
    const index = Number(seek.value);
    elapsed = index * beatMs;
    render(index);
  });
  seek.addEventListener('change', () => announce('Paused on frame ' + currentFrame + '.'));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && (playing || pending)) pause('Paused while this tab is hidden. Press Play film to continue.');
  });
  window.addEventListener('pagehide', () => pause());
  window.addEventListener('pageshow', event => { if (event.persisted) pause('Ready to continue from the same frame.'); });
  motion.addEventListener('change', () => pause('Motion preference updated. Frame controls remain available.'));
  if ('IntersectionObserver' in window) {
    const visibility = new IntersectionObserver(entries => {
      filmVisible = entries[0].isIntersecting;
      if (!filmVisible && (playing || pending)) pause('Paused while the film is out of view. Press Play film when it is visible.');
    }, { threshold: 0 });
    visibility.observe(image);
  }
  storyboard.addEventListener('toggle', () => {
    if (!storyboard.open || storyboard.dataset.loaded) return;
    storyboard.dataset.loaded = 'true';
    storyboard.querySelectorAll('.thumbnail').forEach(placeholder => {
      const index = Number(placeholder.dataset.frame) - 1;
      const thumbnail = new Image();
      thumbnail.src = data.frames.landscape[index];
      thumbnail.alt = data.descriptions[index];
      thumbnail.loading = 'lazy';
      placeholder.append(thumbnail);
    });
  });
  render(0);
})();
`;

export function createFilmHTML(config: unknown, frames: EmbeddedFrames): string {
  const payload = createFilmPayload(config, frames);
  const timeline = makeTimeline(payload.config);
  const storyboard = payload.descriptions.map((description, index) => {
    const segment = timeline.segments[index];
    const held = segment.beats > 1 ? ` · ${segment.beats - 1} extra held beats` : '';
    return `<li><div class="thumbnail" data-frame="${index + 1}"></div><div class="frame-label"><span>Frame ${String(index + 1).padStart(2, '0')}</span><span>${segment.beats} ${segment.beats === 1 ? 'beat' : 'beats'}${held}</span></div><p>${description}</p></li>`;
  }).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<meta name="description" content="An original digital stop-motion film of Boop, with your own spacing and pauses. All frames are included in this file.">
<title>FRAME — Your little film</title>
<style>${filmStyles}</style>
</head>
<body>
<main class="wrap">
<header><div><h1>FRAME</h1><p>A little move. A little pause. Your little film.</p></div><div class="take"><span>${PRESET_LABELS[payload.config.preset]}</span><span>${payload.duration.toFixed(2)} seconds · 24 poses</span></div></header>
<figure class="viewer">
<picture><source id="portrait" media="(max-width:600px)" srcset="${payload.frames.portrait[0]}"><img id="frame" src="${payload.frames.landscape[0]}" width="1280" height="800" alt="${payload.descriptions[0]}" decoding="sync"></picture>
<figcaption id="caption">${payload.descriptions[0]}</figcaption>
</figure>
<section class="transport" aria-label="Film playback">
<div class="buttons"><button id="play" class="primary" type="button" aria-pressed="false">Play film</button><button id="replay" type="button">Replay</button><button id="previous" class="push" type="button" disabled>Previous frame</button><button id="next" type="button">Next frame</button></div>
<div class="seek"><label class="sr-only" for="seek">Playback beat</label><input id="seek" type="range" min="0" max="${payload.beats.length - 1}" value="0" step="1"><output class="time" id="time" for="seek">Frame 01/24 · 0.00 / ${payload.duration.toFixed(2)} s</output></div>
<p id="status" role="status" aria-live="polite">Play when you are ready, or explore one frame at a time.</p>
</section>
<section class="notes" aria-labelledby="rhythm"><h2 id="rhythm">The rhythm you chose.</h2><p><strong>${PRESET_LABELS[payload.config.preset]}</strong> across the six pushing poses, with the same beginning and end.</p><p>Preparation, frame 06: <strong>+${payload.config.hold6} held beats</strong>. Looking back, frame 18: <strong>+${payload.config.hold18} held beats</strong>.</p><p>${payload.beats.length} display beats at 12 beats per second. The opening and ending each include six extra held beats.</p></section>
<details id="storyboard"><summary>Explore all 24 frames</summary><ol class="storyboard">${storyboard}</ol></details>
<noscript><p>Playback needs JavaScript. The complete frame descriptions above remain available.</p></noscript>
<footer>FRAME · An original digital stop-motion study. This file includes its own landscape and portrait frames and plays without a connection.</footer>
</main>
<script id="frame-data" type="application/json">${inlineJSON(payload)}</script>
<script>${filmRuntime}</script>
</body>
</html>`;
}

function canvasContext(width: number, height: number): {
  canvas: HTMLCanvasElement; context: CanvasRenderingContext2D;
} {
  if (typeof document === 'undefined') throw new Error('Image export needs a browser canvas.');
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser could not open an image canvas. Please try another browser.');
  return { canvas, context };
}

function imageDataURL(image: HTMLImageElement): string {
  if (!image.naturalWidth || !image.naturalHeight) throw new Error('One of the film frames has not finished loading. Please retry.');
  const { canvas, context } = canvasContext(image.naturalWidth, image.naturalHeight);
  try {
    context.drawImage(image, 0, 0);
    return canvas.toDataURL('image/webp', 0.9);
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

async function limitedMap<T, R>(values: readonly T[], concurrency: number, work: (value: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(values.length);
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor++;
      results[index] = await work(values[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, worker));
  return results;
}

export async function exportFilm(config: unknown, provider: FramesProvider): Promise<Blob> {
  // Freeze the click-time take before starting any asynchronous resource work.
  const snapshot = makeTimeline(config).config;
  const requests = (['landscape', 'portrait'] as const).flatMap(camera =>
    Array.from({ length: FRAMES }, (_, index) => ({ camera, frame: index + 1 })));
  const encoded = await limitedMap(requests, 4, async ({ camera, frame }) => {
    if (provider.dataURL) return provider.dataURL(frame, snapshot.preset, camera);
    return imageDataURL(await provider.load(frame, snapshot.preset, camera));
  });
  const html = createFilmHTML(snapshot, {
    landscape: encoded.slice(0, FRAMES),
    portrait: encoded.slice(FRAMES),
  });
  return new Blob([html], { type: 'text/html;charset=utf-8' });
}

const frameNames = [
  'Notice', 'A glance', 'Hands ready', 'Settle', 'Gather', 'Ready',
  'Begin', 'Push', 'Move', 'Carry', 'Almost', 'At the outline',
  'Too far', 'Follow through', 'Let go', 'Stop', 'Check', 'Look back',
  'Gently pull', 'A little closer', 'Slow down', 'Aligned', 'Let go', 'Just right',
];

/** A 4-column × 6-row portrait sheet containing every actual selected pose. */
export async function exportStoryboard(config: unknown, provider: FramesProvider): Promise<Blob> {
  const timeline = makeTimeline(config);
  const images = await limitedMap(Array.from({ length: FRAMES }, (_, index) => index + 1), 4,
    frame => provider.load(frame, timeline.config.preset, 'landscape'));
  if (images.some(image => !image.naturalWidth || !image.naturalHeight)) {
    throw new Error('One of the storyboard frames has not finished loading. Please retry.');
  }
  const { canvas, context: ctx } = canvasContext(1440, 1800);
  try {
    drawStoryboard(ctx, timeline, images);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('The storyboard image could not be saved. Please try again.'));
      }, 'image/png');
    });
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

function drawStoryboard(ctx: CanvasRenderingContext2D, timeline: Timeline, images: HTMLImageElement[]) {
  const ink = '#403D49';
  ctx.fillStyle = '#AED0C4';
  ctx.fillRect(0, 0, 1440, 1800);
  ctx.fillStyle = ink;
  ctx.font = 'bold 76px "Trebuchet MS", Arial, sans-serif';
  ctx.fillText('FRAME', 56, 112);
  ctx.font = '30px "Trebuchet MS", Arial, sans-serif';
  ctx.fillText('A little move. A little pause. Your little film.', 56, 160);
  ctx.font = '19px "Trebuchet MS", Arial, sans-serif';
  ctx.fillText(`${PRESET_LABELS[timeline.config.preset]}  /  ${timeline.totalBeats} beats  /  ${timeline.duration.toFixed(2)} seconds`, 56, 202);
  ctx.textAlign = 'right';
  ctx.fillText(`Preparation +${timeline.config.hold6}  ·  Looking back +${timeline.config.hold18}`, 1384, 202);
  ctx.textAlign = 'left';
  ctx.strokeStyle = '#403D4955';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(56, 220); ctx.lineTo(1384, 220); ctx.stroke();
  const columns = 4;
  const gap = 18;
  const width = (1440 - 112 - gap * 3) / columns;
  const height = width / 1.6;
  const rowHeight = 244;
  images.forEach((image, index) => {
    const x = 56 + (index % columns) * (width + gap);
    const y = 242 + Math.floor(index / columns) * rowHeight;
    ctx.fillStyle = '#A4C7BA';
    ctx.fillRect(x, y, width, height);
    // Fit, never crop: the target, supporting feet and hands remain visible.
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
    ctx.strokeStyle = '#403D492A';
    ctx.strokeRect(x, y, width, height);
    ctx.fillStyle = ink;
    ctx.font = 'bold 16px "Trebuchet MS", Arial, sans-serif';
    ctx.fillText(`${String(index + 1).padStart(2, '0')}  ${frameNames[index]}`, x, y + height + 24);
    const segment = timeline.segments[index];
    ctx.font = '14px "Trebuchet MS", Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${segment.beats} ${segment.beats === 1 ? 'beat' : 'beats'}`, x + width, y + height + 24);
    ctx.textAlign = 'left';
  });
  ctx.strokeStyle = '#403D4955';
  ctx.beginPath(); ctx.moveTo(56, 1720); ctx.lineTo(1384, 1720); ctx.stroke();
  ctx.font = '18px "Trebuchet MS", Arial, sans-serif';
  ctx.fillText('24 distinct poses · 12 display beats per second · Held poses repeat the same frame.', 56, 1756);
  ctx.font = '15px "Trebuchet MS", Arial, sans-serif';
  ctx.fillText('FRAME / An original digital stop-motion study.', 56, 1782);
}

export function exportFilename(config: unknown, extension: 'png' | 'html'): string {
  const snapshot = makeTimeline(config).config;
  return `frame-${snapshot.preset}-${String(snapshot.hold6).padStart(2, '0')}-${String(snapshot.hold18).padStart(2, '0')}.${extension}`;
}
