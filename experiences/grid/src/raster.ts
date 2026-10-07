export type PhotoRasterOptions = {
  width: number;
  height: number;
  cropX: number;
  cropY: number;
  zoom: number;
  progress: number;
  intensity: number;
};

const MAX_WIDTH = 240;
const MAX_HEIGHT = 180;
const BAYER = new Uint8Array([
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
]);
const INK = [8, 13, 9] as const;
const PHOSPHOR = [142, 246, 159] as const;

function bounded(value: number, min: number, max: number, fallback: number): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

/** A deterministic, low-resolution treatment of the existing photograph. */
export class PhotoRaster {
  private readonly canvas: HTMLCanvasElement;
  private readonly image: HTMLImageElement;
  private context: CanvasRenderingContext2D | null = null;
  private lastKey = '';
  private lastSource = '';
  private blockedSource = '';
  private usable = false;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement, image: HTMLImageElement) {
    this.canvas = canvas;
    this.image = image;
    this.canvas.hidden = true;
    this.canvas.style.imageRendering = 'pixelated';
    try {
      this.context = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
    } catch {
      // The ordinary image remains available when Canvas cannot be created.
    }
  }

  get available(): boolean {
    return this.usable && !this.disposed;
  }

  render(opts: PhotoRasterOptions): void {
    const ctx = this.context;
    const frameWidth = opts.width;
    const frameHeight = opts.height;
    const naturalWidth = this.image.naturalWidth;
    const naturalHeight = this.image.naturalHeight;

    if (this.disposed || !ctx || !this.image.complete || naturalWidth <= 0 || naturalHeight <= 0 ||
        !Number.isFinite(frameWidth) || !Number.isFinite(frameHeight) || frameWidth <= 0 || frameHeight <= 0) {
      this.lastKey = '';
      this.hide();
      return;
    }

    const source = [this.image.currentSrc || this.image.src, this.image.crossOrigin, naturalWidth, naturalHeight].join('|');
    if (source === this.blockedSource) {
      this.hide();
      return;
    }

    const cropX = bounded(opts.cropX, 0, 100, 50) / 100;
    const cropY = bounded(opts.cropY, 0, 100, 50) / 100;
    const zoom = bounded(opts.zoom, 1, 1.1, 1);
    const progress = bounded(opts.progress, 0, 1, 0);
    const intensity = bounded(opts.intensity, 0, 1, 0);
    const sampleScale = Math.min(1, MAX_WIDTH / frameWidth, MAX_HEIGHT / frameHeight);
    const width = Math.max(1, Math.min(MAX_WIDTH, Math.round(frameWidth * sampleScale)));
    const height = Math.max(1, Math.min(MAX_HEIGHT, Math.round(frameHeight * sampleScale)));
    const scanRow = intensity > 0 ? Math.min(height - 1, Math.floor(progress * height)) : -1;
    const key = [source, frameWidth, frameHeight, width, height, cropX, cropY, zoom, intensity, scanRow].join('|');
    if (key === this.lastKey) {
      // The renderer may have hidden a still-valid frame while another system held.
      this.canvas.hidden = !this.usable;
      return;
    }
    this.lastKey = key;

    try {
      const widthStyle = frameWidth + 'px';
      const heightStyle = frameHeight + 'px';
      if (this.canvas.style.width !== widthStyle) this.canvas.style.width = widthStyle;
      if (this.canvas.style.height !== heightStyle) this.canvas.style.height = heightStyle;

      // Reset when the source changes too: a previous taint must not carry over.
      if (this.canvas.width !== width || this.canvas.height !== height || source !== this.lastSource) {
        this.canvas.width = width;
        this.canvas.height = height;
      }
      this.lastSource = source;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#080d09';
      ctx.fillRect(0, 0, width, height);

      // object-fit: cover, percentage object-position, then a centered CSS zoom.
      const coverScale = Math.max(frameWidth / naturalWidth, frameHeight / naturalHeight);
      const baseWidth = frameWidth / coverScale;
      const baseHeight = frameHeight / coverScale;
      const sourceWidth = baseWidth / zoom;
      const sourceHeight = baseHeight / zoom;
      const sourceX = (naturalWidth - baseWidth) * cropX + (baseWidth - sourceWidth) / 2;
      const sourceY = (naturalHeight - baseHeight) * cropY + (baseHeight - sourceHeight) / 2;
      ctx.drawImage(this.image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);

      // At most 43,200 pixels are read, irrespective of viewport size or DPR.
      const frame = ctx.getImageData(0, 0, width, height);
      const pixels = frame.data;
      for (let y = 0; y < height; y++) {
        const scanLift = y === scanRow ? 0.055 * intensity : 0;
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * 4;
          const luminance = Math.min(1, (pixels[index]! * 0.2126 + pixels[index + 1]! * 0.7152 + pixels[index + 2]! * 0.0722) / 255 + scanLift);
          const threshold = (BAYER[(y & 3) * 4 + (x & 3)]! + 0.5) / 16;
          const discrete = luminance >= threshold ? 1 : 0;
          // Change each pixel's quantization, never the opacity of the picture.
          const tone = luminance + (discrete - luminance) * intensity;
          pixels[index] = Math.round(INK[0] + (PHOSPHOR[0] - INK[0]) * tone);
          pixels[index + 1] = Math.round(INK[1] + (PHOSPHOR[1] - INK[1]) * tone);
          pixels[index + 2] = Math.round(INK[2] + (PHOSPHOR[2] - INK[2]) * tone);
          pixels[index + 3] = 255;
        }
      }
      ctx.putImageData(frame, 0, 0);
      this.usable = true;
      this.canvas.hidden = false;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'name' in error && error.name === 'SecurityError') {
        this.blockedSource = source;
      }
      this.hide();
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.lastKey = '';
    this.lastSource = '';
    this.blockedSource = '';
    this.hide();
    this.canvas.width = 1;
    this.canvas.height = 1;
    this.context = null;
  }

  private hide(): void {
    this.usable = false;
    this.canvas.hidden = true;
  }
}
