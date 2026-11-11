/**
 * Soft-edged reveals for scroll-scrubbed handoffs.
 *
 * A hard `clip-path` wipe shows the new picture through a sharp-edged window,
 * which reads as a cut. These helpers turn the same `inset()`, `circle()` and
 * `ellipse()` shapes into a feathered `mask-image`, so the incoming picture
 * dissolves in along a moving band instead. The shapes keep their exact
 * endpoints: progress 0 shows none of the picture and progress 1 all of it,
 * and the band is derived from the same continuous progress as before (no
 * second easing layer, no timers).
 */

export interface RevealOptions {
  /** Width of the soft band for straight edges, as a percentage of the box. */
  feather?: number;
}

const FEATHER = 16;
const HIDE = 'linear-gradient(#0000,#0000)';

const num = (token: string): number => {
  const value = parseFloat(token);
  return Number.isFinite(value) ? value : 0;
};

const clamp = (value: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, value));
const fix = (value: number): string => String(Math.round(value * 100) / 100);

/** Gradient from a hidden edge; `hidden` is the hidden share (0-100) measured from that edge. */
function side(angle: number, hidden: number, feather: number): string {
  // hidden 100 -> everything transparent; hidden 0 -> everything opaque.
  const start = hidden * (100 + feather) / 100 - feather;
  return `linear-gradient(${angle}deg,#0000 0%,#0000 ${fix(start)}%,#000 ${fix(start + feather)}%)`;
}

function position(token: string): string {
  return /^-?[\d.]+(px|%)$/.test(token) ? token : '50%';
}

/**
 * Convert a clip-path string to a mask-image value.
 * Returns `null` for shapes that cannot be feathered (the caller should clip), `'none'` for a fully shown picture.
 */
export function revealMask(clip: string, width: number, height: number, options: RevealOptions = {}): string | null {
  const feather = options.feather ?? FEATHER;
  const text = clip.trim();
  if (!text || text === 'none') return 'none';
  const inset = text.match(/^inset\(([^)]*)\)$/);
  if (inset) {
    const t = inset[1].trim().split(/\s+/).map(num);
    const [top, right, bottom, left] = t.length === 1 ? [t[0], t[0], t[0], t[0]]
      : t.length === 2 ? [t[0], t[1], t[0], t[1]]
      : t.length === 3 ? [t[0], t[1], t[2], t[1]]
      : [t[0], t[1], t[2], t[3]];
    if (top >= 99.99 || right >= 99.99 || bottom >= 99.99 || left >= 99.99) return HIDE;
    const layers: string[] = [];
    // Each gradient starts at the hidden edge and turns opaque towards the revealed side.
    if (left > 0.001) layers.push(side(90, left, feather));
    if (right > 0.001) layers.push(side(270, right, feather));
    if (top > 0.001) layers.push(side(180, top, feather));
    if (bottom > 0.001) layers.push(side(0, bottom, feather));
    return layers.length ? layers.join(',') : 'none';
  }
  const circle = text.match(/^circle\(\s*([\d.]+)%\s+at\s+(\S+)\s+(\S+)\s*\)$/);
  if (circle) {
    const radius = num(circle[1]) / 100 * Math.sqrt((width * width + height * height) / 2);
    return radial(radius, radius, circle[2], circle[3], num(circle[1]));
  }
  const ellipse = text.match(/^ellipse\(\s*([\d.]+)%\s+([\d.]+)%\s+at\s+(\S+)\s+(\S+)\s*\)$/);
  if (ellipse) {
    const rx = num(ellipse[1]) / 100 * width, ry = num(ellipse[2]) / 100 * height;
    return radial(rx, ry, ellipse[3], ellipse[4], Math.max(num(ellipse[1]), num(ellipse[2])));
  }
  return null;
}

function radial(rx: number, ry: number, cx: string, cy: string, percent: number): string {
  if (rx <= 0.5 || ry <= 0.5) return HIDE;
  // A wide band while the circle is small, none once it has left the box.
  const band = 0.34 * clamp((150 - percent) / 70, 0, 1);
  const inner = fix((1 - band) * 100);
  return `radial-gradient(${fix(rx)}px ${fix(ry)}px at ${position(cx)} ${position(cy)},#000 0%,#000 ${inner}%,#0000 100%)`;
}

const sizes = new WeakMap<Element, { width: number; height: number }>();
let observer: ResizeObserver | null = null;
type Styled = HTMLElement | SVGElement;
function sizeOf(element: Styled): { width: number; height: number } {
  let size = sizes.get(element);
  if (!size) {
    const box = element.getBoundingClientRect();
    size = { width: box.width || innerWidth, height: box.height || innerHeight };
    sizes.set(element, size);
    if (typeof ResizeObserver === 'function') {
      observer ??= new ResizeObserver(entries => {
        for (const entry of entries) sizes.set(entry.target, { width: entry.contentRect.width || innerWidth, height: entry.contentRect.height || innerHeight });
      });
      observer.observe(element);
    }
  }
  return size;
}

const applied = new WeakMap<Element, string>();

/** Reveal an element through a soft mask, falling back to a hard clip for shapes that cannot be feathered. */
export function applyReveal(element: Styled | null | undefined, clip: string, options: RevealOptions = {}): void {
  if (!element) return;
  if (applied.get(element) === clip) return;
  applied.set(element, clip);
  const size = sizeOf(element);
  const mask = revealMask(clip, size.width, size.height, options);
  const style = element.style;
  if (mask === null) {
    style.clipPath = clip;
    style.maskImage = '';
    style.setProperty('-webkit-mask-image', '');
    return;
  }
  style.clipPath = '';
  const value = mask === 'none' ? '' : mask;
  style.maskImage = value;
  style.setProperty('-webkit-mask-image', value);
  const composite = /\),linear-gradient/.test(value) ? 'intersect' : '';
  style.maskComposite = composite;
  style.setProperty('-webkit-mask-composite', composite ? 'source-in' : '');
  style.maskRepeat = value ? 'no-repeat' : '';
  style.setProperty('-webkit-mask-repeat', value ? 'no-repeat' : '');
  style.maskSize = value ? '100% 100%' : '';
  style.setProperty('-webkit-mask-size', value ? '100% 100%' : '');
}
