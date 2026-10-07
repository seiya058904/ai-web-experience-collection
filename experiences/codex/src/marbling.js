/**
 * A reversible marbling study built from the selected, unlettered endpaper.
 *
 * The caller owns requestAnimationFrame, visibility, scrolling and pointer input.
 * `progress` is chapter-local [0, 1], and pointer x/y are normalized [-1, 1].
 * There is deliberately no simulation clock or accumulated deformation: returning
 * to an earlier progress/pointer pair restores the same material immediately.
 */

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;
const finite = (value, fallback) => Number.isFinite(value) ? value : fallback;

function smoothRange(start, end, value) {
  const t = clamp((value - start) / (end - start));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function context2d(canvas, options) {
  const context = canvas.getContext('2d', options);
  if (!context) throw new Error('CODEX: Canvas 2D is unavailable for the marbling study.');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  return context;
}

async function loadMaterial(document) {
  const image = document.createElement('img');
  image.decoding = 'async';
  const base = import.meta.env?.BASE_URL || './';
  const url = new URL(`${base}codex/textures/marbled-endpaper.webp`, document.baseURI);
  await new Promise((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('CODEX: the marbled endpaper texture could not be loaded.'));
    image.src = url.href;
  });
  image.onload = null;
  image.onerror = null;
  if (image.decode) await image.decode().catch(() => {});
  return image;
}

/**
 * @param {HTMLCanvasElement} canvas A transparent, caller-positioned stage canvas.
 * @returns {Promise<{
 *   update: Function, resize: Function, dispose: Function,
 *   getState: Function, getTexture: Function
 * }>}
 */
export async function createMarbling(canvas) {
  if (!canvas?.ownerDocument) throw new TypeError('CODEX: createMarbling needs a canvas element.');

  const document = canvas.ownerDocument;
  const context = context2d(canvas, { alpha: true });
  let plate = await loadMaterial(document);
  const rowBuffer = document.createElement('canvas');
  const columnBuffer = document.createElement('canvas');
  const rowContext = context2d(rowBuffer, { alpha: false });
  const columnContext = context2d(columnBuffer, { alpha: false });

  let width = 1;
  let height = 1;
  let requestedDpr = 1;
  let dpr = 1;
  let mobile = false;
  let disposed = false;
  let dirty = true;
  let previousInput = null;
  let drawCount = 0;
  let state = {
    ready: true,
    progress: 0,
    deformation: 0,
    transfer: 0,
    frozen: true,
    reducedMotion: false,
    pointer: { x: 0, y: 0 },
    surface: null,
  };

  function sizeBuffers() {
    // Material space is independent of the screen DPR. Two bounded buffers keep
    // the fine veins intact without allocating full 4K surfaces for both passes.
    const bufferWidth = Math.min(plate.naturalWidth, mobile ? 1024 : 1536);
    const bufferHeight = Math.round(bufferWidth * plate.naturalHeight / plate.naturalWidth);
    if (rowBuffer.width === bufferWidth && rowBuffer.height === bufferHeight) return;
    for (const buffer of [rowBuffer, columnBuffer]) {
      buffer.width = bufferWidth;
      buffer.height = bufferHeight;
    }
    for (const bufferContext of [rowContext, columnContext]) {
      bufferContext.imageSmoothingEnabled = true;
      bufferContext.imageSmoothingQuality = 'high';
    }
    dirty = true;
  }

  function resize(nextWidth, nextHeight, nextDpr = requestedDpr) {
    if (disposed) return;
    const nextW = Math.max(1, finite(nextWidth, width));
    const nextH = Math.max(1, finite(nextHeight, height));
    requestedDpr = clamp(finite(nextDpr, 1), 0.5, 3);
    const nextEffectiveDpr = Math.min(requestedDpr, mobile || nextW < 760 ? 1.25 : 1.5,
      Math.sqrt(4_194_304 / (nextW * nextH)));
    if (width === nextW && height === nextH && dpr === nextEffectiveDpr && !dirty) return;
    width = nextW;
    height = nextH;
    dpr = nextEffectiveDpr;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    sizeBuffers();
    dirty = true;
  }

  function deformMaterial(progress, pointer, strength) {
    if (strength <= 0.00001) return plate;

    const bw = rowBuffer.width;
    const bh = rowBuffer.height;
    const rows = mobile ? 72 : 112;
    const columns = mobile ? 72 : 112;
    const amplitudeX = bw * 0.014 * strength;
    const amplitudeY = bh * 0.009 * strength;
    const overscanX = amplitudeX * 1.3 + strength * 2;
    const overscanY = amplitudeY * 1.3 + strength * 2;
    const phase = progress * Math.PI * 4.8;

    // The original pigment veins themselves are combed. No new decorative blobs
    // or synthetic line layer obscure the selected material.
    const rowOffset = (v) => amplitudeX * (
      Math.sin(v * 8.2 + phase) * 0.56
      + Math.sin(v * 23.2 - phase * 0.58) * 0.22
      + pointer.x * Math.sin(v * Math.PI) * 0.16
    );
    const columnOffset = (u) => amplitudeY * smoothRange(0.18, 0.74, u) * (
      Math.sin(u * 9.6 - phase) * 0.58
      + Math.sin(u * 24.2 + phase * 0.6) * 0.16
      + pointer.y * Math.sin(u * Math.PI) * 0.20
    );

    rowContext.setTransform(1, 0, 0, 1, 0, 0);
    rowContext.fillStyle = '#232720';
    rowContext.fillRect(0, 0, bw, bh);
    for (let i = 0; i < rows; i += 1) {
      const y0 = bh * i / rows;
      const y1 = bh * (i + 1) / rows;
      const stripHeight = Math.min(y1 - y0 + 0.6, bh - y0);
      const offset0 = rowOffset(y0 / bh);
      const offset1 = rowOffset(y1 / bh);
      const shear = (offset1 - offset0) / (y1 - y0);
      // Affine shear joins adjacent bands continuously instead of stepping each
      // row sideways. The subpixel overlap closes rasterization hairlines.
      rowContext.setTransform(1, 0, shear, 1, offset0 - shear * y0, 0);
      rowContext.drawImage(
        plate,
        0, y0 / bh * plate.naturalHeight,
        plate.naturalWidth, stripHeight / bh * plate.naturalHeight,
        -overscanX, y0, bw + overscanX * 2, stripHeight,
      );
    }

    columnContext.setTransform(1, 0, 0, 1, 0, 0);
    columnContext.fillStyle = '#232720';
    columnContext.fillRect(0, 0, bw, bh);
    for (let i = 0; i < columns; i += 1) {
      const x0 = bw * i / columns;
      const x1 = bw * (i + 1) / columns;
      const stripWidth = Math.min(x1 - x0 + 0.6, bw - x0);
      const offset0 = columnOffset(x0 / bw);
      const offset1 = columnOffset(x1 / bw);
      const shear = (offset1 - offset0) / (x1 - x0);
      columnContext.setTransform(1, shear, 0, 1, 0, offset0 - shear * x0);
      columnContext.drawImage(
        rowBuffer,
        x0, 0, stripWidth, bh,
        x0, -overscanY, stripWidth, bh + overscanY * 2,
      );
    }
    return columnBuffer;
  }

  function drawSurface(material, transfer, reducedMotion) {
    // These target coordinates match the Three.js case handoff. Full image UVs
    // are retained on the final portrait sheet and on the book's endpaper.
    const surface = {
      x: lerp(width * 0.5, width * (mobile ? 0.5 : 0.70), transfer),
      y: lerp(height * 0.5, height * (mobile ? 0.61 : 0.52), transfer),
      width: lerp(width, width * (mobile ? 0.58 : 0.28), transfer),
      height: lerp(height, height * (mobile ? 0.40 : 0.58), transfer),
      rotation: reducedMotion ? 0 : -0.035 * transfer,
    };

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    context.save();
    context.translate(surface.x, surface.y);
    context.rotate(surface.rotation);
    const left = -surface.width / 2;
    const top = -surface.height / 2;
    const edge = 1.15 * transfer;

    if (transfer > 0.001) {
      // A thin physical edge and cast shadow appear only as the sheet lifts out
      // of the bath. The area outside the sheet remains transparent for handoff.
      context.shadowColor = `rgba(0, 0, 0, ${0.21 * transfer})`;
      context.shadowBlur = 24 * transfer;
      context.shadowOffsetY = 9 * transfer;
      context.fillStyle = '#ddd3bc';
      context.fillRect(left - edge, top - edge, surface.width + edge * 2, surface.height + edge * 2);
      context.shadowColor = 'transparent';
      context.shadowBlur = 0;
      context.shadowOffsetY = 0;
    }

    context.beginPath();
    context.rect(left, top, surface.width, surface.height);
    context.clip();
    context.drawImage(material, left, top, surface.width, surface.height);
    context.restore();
    return surface;
  }

  function update(options = {}) {
    if (disposed) return;
    const nextMobile = options.mobile ?? finite(options.width, width) < 760;
    if (mobile !== nextMobile) {
      mobile = nextMobile;
      dirty = true;
    }
    if (options.width || options.height || dirty) {
      resize(finite(options.width, width), finite(options.height, height), requestedDpr);
    }

    const progress = clamp(finite(options.progress, 0));
    const reducedMotion = Boolean(options.reducedMotion);
    const pointer = {
      x: reducedMotion ? 0 : clamp(finite(options.pointer?.x, 0), -1, 1),
      y: reducedMotion ? 0 : clamp(finite(options.pointer?.y, 0), -1, 1),
    };
    const strength = reducedMotion ? 0
      : smoothRange(0.035, 0.18, progress) * (1 - smoothRange(0.52, 0.78, progress));
    const transfer = reducedMotion ? (progress >= 0.9 ? 1 : 0)
      : smoothRange(0.74, 1, progress);
    const input = [progress, pointer.x, pointer.y, reducedMotion, width, height, mobile];

    // Stable holds do not redraw identical material. No time throttling means a
    // fast scroll or direct chapter jump always receives its exact latest frame.
    if (!dirty && previousInput?.every((value, index) => value === input[index])) return;
    const material = deformMaterial(progress, pointer, strength);
    const surface = drawSurface(material, transfer, reducedMotion);
    drawCount += 1;
    state = {
      ready: true,
      progress,
      deformation: strength,
      transfer,
      frozen: strength <= 0.00001,
      reducedMotion,
      pointer,
      surface,
    };
    previousInput = input;
    dirty = false;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    rowBuffer.width = 1;
    rowBuffer.height = 1;
    columnBuffer.width = 1;
    columnBuffer.height = 1;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    plate = null;
    previousInput = null;
    state = { ...state, ready: false };
  }

  resize(canvas.clientWidth || 1, canvas.clientHeight || 1, 1);

  return {
    update,
    resize,
    dispose,
    getTexture: () => plate,
    getState: () => ({
      ...state,
      pointer: { ...state.pointer },
      surface: state.surface ? { ...state.surface } : null,
      width,
      height,
      dpr,
      mobile,
      drawCount,
      bufferWidth: rowBuffer.width,
      bufferHeight: rowBuffer.height,
      disposed,
    }),
  };
}
