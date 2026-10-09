import { clamp, contrast, cssColor, colorMix, mix, readable, range, smooth } from './math.ts';
import type { RGB } from './math.ts';
import { CONTENT_KEYS } from './scenes.ts';
import type { ContentKey, Design, Frame, View } from './scenes.ts';
import { PhotoRaster } from './raster.ts';
import { isWideShort } from './layout-short.ts';

const NS = 'http://www.w3.org/2000/svg';
export const FAMILIES = ['"Roboto Flex", Arial, sans-serif', '"Instrument Serif", Georgia, serif', '"IBM Plex Mono", monospace'];
const fixed = (v: number) => Math.round(v * 1000) / 1000;
const px = (v: number) => `${fixed(v)}px`;
type PartElement = HTMLElement | SVGSVGElement;

/** Writes a complete state. No layout reads, animation clock, or accumulated transforms. */
export class Renderer {
  readonly article = document.querySelector<HTMLElement>('#specimen')!;
  readonly parts = Object.fromEntries(CONTENT_KEYS.map(key => [key, this.article.querySelector<PartElement>(`[data-content="${key}"]`)!])) as Record<ContentKey, PartElement>;
  private readonly root = document.documentElement;
  private readonly stage = document.querySelector<HTMLElement>('#stage')!;
  private readonly guide = document.querySelector<SVGSVGElement>('#guides')!;
  private readonly vertical: SVGPathElement[] = [];
  private readonly horizontal: SVGPathElement[] = [];
  private readonly image = document.querySelector<HTMLImageElement>('#source-photo')!;
  private readonly canvas = document.querySelector<HTMLCanvasElement>('#raster')!;
  private readonly raster = new PhotoRaster(this.canvas, this.image);
  private readonly photoEvents = new AbortController();
  private readonly frame = document.querySelector<HTMLElement>('#frame-outline')!;
  private readonly panel = document.querySelector<HTMLElement>('#raw-panel')!;
  private readonly labels = document.querySelector<HTMLElement>('#measure-labels')!;
  private readonly columnLabel = document.querySelector<HTMLElement>('#column-label')!;
  private readonly baselineLabel = document.querySelector<HTMLElement>('#baseline-label')!;
  private readonly invitation = document.querySelector<HTMLElement>('#zero-invitation')!;
  private readonly letters = Array.from(this.parts.title.querySelectorAll<HTMLElement>('span'));
  private readonly markCircle = this.parts.mark.querySelector('circle')!;
  private readonly markCross = this.parts.mark.querySelector('path')!;
  private view: View = {w: 1, h: 1, mobile: false};
  // A handful of properties are expensive to invalidate — a colour scheme swap,
  // an image filter, a clipped display word. They are written only on change,
  // so a still system costs nothing while it holds.
  private scheme = '';
  private phosphor = '';
  private imageFilter = '';
  private clipPath = '';
  private textStroke = '';
  private textFill = '';

  constructor() {
    for (let i = 0; i <= 48; i++) this.vertical.push(this.makeLine());
    for (let i = 0; i <= 24; i++) this.horizontal.push(this.makeLine());
    const photoState = () => {
      (this.parts.image as HTMLElement).dataset.photoState = this.image.complete
        ? this.image.naturalWidth > 0 ? 'ready' : 'unavailable'
        : 'loading';
    };
    this.image.addEventListener('load', photoState, { signal: this.photoEvents.signal });
    this.image.addEventListener('error', photoState, { signal: this.photoEvents.signal });
    photoState();
  }

  dispose() {
    this.raster.dispose();
    this.photoEvents.abort();
    this.vertical.forEach(line => line.remove());
    this.horizontal.forEach(line => line.remove());
  }

  resize(view: View) {
    this.view = view;
    this.guide.setAttribute('viewBox', `0 0 ${view.w} ${view.h}`);
    this.stage.dataset.proportion = isWideShort(view) ? 'wide-short' : 'regular';
  }

  nativeFrame(frame: Frame) {
    const s = this.article.style;
    s.setProperty('--frame-left', px(frame.x));
    s.setProperty('--frame-top', px(frame.y));
    s.setProperty('--frame-width', px(frame.w));
    s.setProperty('--frame-height', px(frame.h));
    const padding = this.article.dataset.shortFrame === 'true' ? 8 : clamp(frame.w * .026, 12, 40);
    s.setProperty('--frame-padding', px(padding));
    this.article.dataset.format = frame.w - padding * 2 <= 380 ? 'phone' : frame.w - padding * 2 <= 650 ? 'tablet' : 'desktop';
  }

  render(d: Design, coordinate: number, native?: Frame) {
    const {w: W, h: H} = this.view;
    const short = isWideShort(this.view);
    const ink = cssColor(d.ink), paper = cssColor(d.paper);
    const accent = cssColor(d.accent), legibleAccent = cssColor(readable(d.accent, d.paper));
    const uiStrength = Math.min(smooth(range(7.36, 8, coordinate)), 1 - smooth(range(8.36, 9, coordinate)));
    const rawOpacity = d.rawPanel * (1 - smooth(range(.15, .5, d.raster)));
    const backgroundAt = (x: number, y: number): RGB => {
      let surface = d.paper;
      const f = native || d.frame;
      if (x >= f.x && x <= f.x + f.w && y >= f.y && y <= f.y + f.h) surface = colorMix(surface, [248, 248, 243], uiStrength * f.opacity);
      if (x >= 0 && x <= W * (this.view.mobile ? 1 : short ? .72 : .64) && y >= H * (short ? .57 : .53) && y <= H * (this.view.mobile ? .92 : short ? 1 : .93)) surface = colorMix(surface, [244, 240, 231], rawOpacity);
      return surface.map(Math.round) as RGB;
    };
    const rs = this.root.style;
    rs.setProperty('--paper', paper);
    rs.setProperty('--ink', ink);
    rs.setProperty('--accent', legibleAccent);
    rs.setProperty('--muted', cssColor(readable(colorMix(d.ink, d.paper, .32), d.paper)));
    rs.setProperty('--line', cssColor(colorMix(d.ink, d.paper, .76)));
    rs.setProperty('--grid-columns', String(Math.round(d.cols)));
    rs.setProperty('--canvas-paper', native ? '#f8f8f3' : paper);
    const scheme = coordinate >= 6.8 && coordinate < 7.65 ? 'dark' : 'light';
    if (scheme !== this.scheme) { this.scheme = scheme; this.root.style.colorScheme = scheme; }
    this.stage.dataset.scene = String(Math.round(coordinate));
    this.article.classList.toggle('native-layout', Boolean(native));
    if (native) this.nativeFrame(native);

    for (const key of CONTENT_KEYS) {
      const b = d.parts[key], element = this.parts[key], s = element.style;
      const actionY = key === 'action' ? Math.min(b.y, H - 48) : b.y;
      s.transform = `translate3d(${px(b.x)},${px(actionY)},0) rotate(${fixed(b.rotate)}deg) scale(${fixed(b.sx)},${fixed(b.sy)})`;
      s.width = px(b.w);
      s.height = key === 'image' || key === 'mark' ? px(b.h)
        : key === 'action' && uiStrength > 0 ? px(mix(40, b.h, uiStrength)) : 'auto';
      s.fontSize = px(Math.max(1, b.size));
      s.fontFamily = FAMILIES[b.family];
      s.fontWeight = String(b.family === 0 ? Math.round(b.weight) : 400);
      s.fontVariationSettings = b.family === 0
        ? `'wght' ${fixed(key === 'title' ? d.axes.wght : b.weight)}, 'wdth' ${fixed(key === 'title' ? d.axes.wdth : 100)}, 'slnt' ${fixed(key === 'title' ? d.axes.slnt : 0)}, 'opsz' ${fixed(key === 'title' ? d.axes.opsz : clamp(b.size, 8, 144))}`
        : 'normal';
      s.lineHeight = String(fixed(b.leading));
      s.letterSpacing = `${fixed(b.tracking)}em`;
      const layer = Math.round(b.z);
      s.zIndex = String(layer >= 3 ? layer + 1 : layer);
      s.opacity = String(fixed(b.opacity));
      s.borderWidth = px(b.border);
      const desired = colorMix(d.ink, d.accent, clamp(b.accent));
      s.color = cssColor((key === 'title' || key === 'number' || key === 'mark') ? desired : readable(desired, d.paper));
      if (['subtitle', 'body', 'meta', 'place', 'action'].includes(key)) {
        const height = Math.max(b.h, b.size * b.leading);
        const surfaces = [[b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + height], [b.x + b.w, b.y + height], [b.x + b.w / 2, b.y + height / 2]].map(([x, y]) => backgroundAt(x, y));
        const candidates: RGB[] = [desired, [0, 0, 0], [255, 255, 255]];
        const candidate = candidates.find(c => surfaces.every(surface => contrast(c, surface) >= 4.5));
        // A reading region that crosses two incompatible surfaces keeps its own paper.
        s.background = candidate ? 'none' : paper;
        s.color = cssColor(candidate || readable(desired, d.paper));
      }
    }

    const title = this.parts.title;
    const stroke = d.outline > .001 ? `${fixed(d.outline * 1.3)}px ${ink}` : '0px';
    const fill = d.outline > .001 ? `rgb(${d.ink.map(Math.round).join(' ')} / ${fixed(1 - d.outline)})` : 'currentColor';
    if (stroke !== this.textStroke) { this.textStroke = stroke; title.style.setProperty('-webkit-text-stroke', stroke); }
    if (fill !== this.textFill) { this.textFill = fill; title.style.setProperty('-webkit-text-fill-color', fill); }
    title.classList.toggle('electronic-type', !native && d.raster > .72);
    const phosphor = cssColor(readable(d.accent, d.paper, 3));
    if (phosphor !== this.phosphor) { this.phosphor = phosphor; title.style.setProperty('--phosphor', phosphor); }
    const lowerLine = .82 * smooth(range(0, .40, d.stack));
    // An exiting crop must include the lower row until it reaches the baseline.
    // At typeCrop=1 the authored aperture is unchanged; at zero there is no clip.
    const lowerInset = (d.parts.title.size * d.parts.title.leading - d.parts.title.h) * d.typeCrop
      - lowerLine * d.parts.title.size * (1 - d.typeCrop);
    const upperInset = short ? -2 * d.parts.title.size * (1 - d.typeCrop) : -1000;
    const clip = d.typeCrop > .001 ? `inset(${fixed(upperInset)}px -4000px ${fixed(lowerInset)}px -4000px)` : 'none';
    if (clip !== this.clipPath) { this.clipPath = clip; title.style.clipPath = clip; }
    this.parts.subtitle.classList.toggle('editorial-mode', d.parts.subtitle.family === 1 && (coordinate >= 4.65 || native !== undefined));
    this.letters.forEach((letter, i) => {
      // Unstack along the lower line before lifting to the shared baseline.
      // Reversal lowers I/D before sliding them back beneath G/R.
      const stackX = i > 1 ? -1.325 * smooth(range(.45, 1, d.stack)) : 0;
      const stackY = i > 1 ? lowerLine : 0;
      // The shallow Type-as-image aperture samples counters and stems. Keep
      // its authored scale; release the pan when the word fits its proof.
      const cropPan = short ? .28 * d.typeCrop * smooth(range(1.1, 1.8,
        d.parts.title.size * (1456 / 2048) / Math.max(1, d.parts.title.h))) : 0;
      const offset = [0, .012, -.018, .006][i] * d.tension;
      const rotation = [0, -.7, 1.2, 0][i] * d.tension;
      letter.style.transform = `translate(${fixed(stackX)}em,${fixed(stackY + offset - cropPan)}em) rotate(${fixed(rotation)}deg)`;
    });
    const number = this.parts.number;
    // Establish the outline before removing its interior. The former simultaneous
    // colour/alpha interpolation made the folio disappear on the orange handoff.
    const numberFill = colorMix(colorMix(d.ink, d.accent, clamp(d.parts.number.accent)),
      d.ink, smooth(range(0, .22, d.numberOutline)));
    const numberFillAlpha = 1 - smooth(range(.75, 1, d.numberOutline));
    number.style.setProperty('-webkit-text-stroke', d.numberOutline > .001 ? `${fixed(d.numberOutline * 1.25)}px ${accent}` : '0px');
    number.style.setProperty('-webkit-text-fill-color', d.numberOutline > .001 ? `rgb(${numberFill.map(Math.round).join(' ')} / ${fixed(numberFillAlpha)})` : 'currentColor');
    if (d.raster > .72) number.style.color = '#e9bd66';

    this.image.style.objectPosition = `${fixed(d.cropX)}% ${fixed(d.cropY)}%`;
    this.image.style.transform = `scale(${fixed(d.zoom)})`;
    const imageFilter = d.rawPanel > .01 ? `contrast(${fixed(1 + d.rawPanel * .15)})` : 'none';
    if (imageFilter !== this.imageFilter) { this.imageFilter = imageFilter; this.image.style.filter = imageFilter; }
    if (!native && d.raster > .01) {
      this.raster.render({width: d.parts.image.w, height: d.parts.image.h, cropX: d.cropX, cropY: d.cropY, zoom: d.zoom, progress: range(6.36, 7.36, coordinate), intensity: d.raster});
      this.canvas.style.opacity = String(clamp(d.raster * 2));
    } else this.canvas.hidden = true;
    // The original img always stays in place underneath the procedural treatment.
    this.image.style.opacity = '1';

    const markSize = Math.min(d.parts.mark.w, d.parts.mark.h);
    const dotRadius = markSize <= 8 ? 31 : Math.max(3, 300 / markSize);
    this.markCircle.setAttribute('r', String(fixed(mix(31, dotRadius, d.point))));
    this.markCircle.style.fill = d.point > .001 ? `rgb(${d.ink.map(Math.round).join(' ')} / ${fixed(d.point)})` : 'none';
    this.markCircle.style.strokeWidth = String(fixed(mix(1.7, 0, d.point)));
    this.markCross.style.opacity = String(fixed(1 - d.point));
    this.markCross.style.strokeWidth = '1.7';
    this.panel.style.opacity = String(fixed(rawOpacity));

    const f = native || d.frame;
    this.frame.style.transform = `translate3d(${px(f.x)},${px(f.y)},0)`;
    this.frame.style.width = px(f.w);
    this.frame.style.height = px(f.h);
    this.frame.style.opacity = String(fixed(f.opacity));
    this.frame.style.borderWidth = px(f.border);
    this.frame.style.background = uiStrength > .001 ? `rgb(248 248 243 / ${fixed(uiStrength)})` : 'transparent';
    const action = this.parts.action.style;
    action.padding = `${fixed(d.parts.action.paddingY)}px ${fixed(d.parts.action.paddingX)}px`;
    action.setProperty('--action-underline', String(fixed(1 - uiStrength)));
    action.justifyContent = uiStrength > .5 ? 'space-between' : 'flex-start';
    if (uiStrength > .001) {
      const b = d.parts.action, y = Math.min(b.y, H - 48);
      const buttonSurfaces = [0, .5, 1].map(fraction => colorMix(backgroundAt(b.x + b.w * fraction, y + 20), [25, 79, 219], uiStrength));
      const candidates: RGB[] = [uiStrength > .65 ? [255, 255, 255] : d.accent, [0, 0, 0], [255, 255, 255]];
      const candidate = candidates.find(c => buttonSurfaces.every(surface => contrast(c, surface) >= 4.5));
      action.background = candidate ? `rgb(25 79 219 / ${fixed(uiStrength)})` : '#194fdb';
      action.color = cssColor(candidate || [255, 255, 255]);
    }
    // Withdraw the guides as the native reading frame forms, then reveal them
    // from the same scroll state after it releases. The frame's stacking change
    // must not uncover a fully opaque grid at either native-layout boundary.
    this.guide.style.opacity = String(fixed(1 - uiStrength));
    this.drawGuides(d, coordinate);
    this.labels.style.opacity = String(clamp(d.guide * 4) * (coordinate < .6 ? 0 : 1));
    this.columnLabel.textContent = `${String(Math.round(d.cols)).padStart(2, '0')} columns`;
    this.baselineLabel.textContent = `${Math.round(H / Math.max(1, d.rows))} px / baseline`;
    this.invitation.style.opacity = String(1 - smooth(range(.04, .4, coordinate)));
    this.invitation.style.visibility = coordinate < .4 ? 'visible' : 'hidden';
  }

  private makeLine() {
    const line = document.createElementNS(NS, 'path');
    line.setAttribute('vector-effect', 'non-scaling-stroke');
    this.guide.append(line);
    return line;
  }

  private drawGuides(d: Design, p: number) {
    const {w: W, h: H} = this.view;
    const cols = Math.max(1, d.cols), rows = Math.max(1, d.rows);
    const skew = Math.tan(d.skew * Math.PI / 180) * H;
    const origin = W * 2 / 3;
    this.guide.style.color = cssColor(d.ink);
    this.guide.style.strokeWidth = d.raster > .5 ? '.5px' : '.65px';
    this.vertical.forEach((line, i) => {
      const x = i * W / cols;
      const exists = clamp(cols - i + 1);
      const opening = p < .36 ? 0 : p < 1 ? smooth(range(.38 + (i % 12) * .023, .73 + (i % 12) * .016, p)) : 1;
      const leaving = p >= 10.36 ? clamp(d.guide / .21 * 1.8 - i / 48 * .8) : 1;
      line.setAttribute('d', `M${fixed(x - skew / 2)} 0L${fixed(x + skew / 2)} ${fixed(H * opening)}`);
      line.style.opacity = String(fixed(d.guide * exists * opening * leaving));
    });
    this.horizontal.forEach((line, i) => {
      let y = i * H / rows;
      let length = 1;
      if (p < .36) {y = H * (this.view.mobile ? .32 : isWideShort(this.view) ? .26 : .44) + 3; length = smooth(range(.015, .33, p));}
      const exists = p < .36 ? (i === 0 ? 1 : 0) : clamp(rows - i + 1);
      const leaving = p >= 10.36 ? clamp(d.guide / .21 * 1.8 - i / 24 * .8) : 1;
      line.setAttribute('d', `M${fixed(mix(origin, 0, length))} ${fixed(y)}H${fixed(mix(origin, W, length))}`);
      line.style.opacity = String(fixed(d.guide * exists * leaving));
    });
  }
}
