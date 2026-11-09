import { imprintSVG } from './artwork.ts';
import { displayTitle } from './state.ts';
import type { PersonalState, Phase } from './state.ts';

let texturePromise: Promise<string | undefined> | null = null;
function readTexture(): Promise<string | undefined> {
  if (texturePromise) return texturePromise;
  const signal = AbortSignal.timeout(6000);
  const pending = fetch(new URL('./art/material-atlas.webp', document.baseURI), { signal }).then(response => {
    if (!response.ok) throw new Error('Texture unavailable');
    return response.blob();
  }).then(blob => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    const clean = () => {
      signal.removeEventListener('abort', abort);
      reader.onload = null;
      reader.onerror = null;
      reader.onabort = null;
    };
    const abort = () => {
      clean();
      if (reader.readyState === FileReader.LOADING) reader.abort();
      reject(new Error('Texture preparation timed out.'));
    };
    if (signal.aborted) { abort(); return; }
    signal.addEventListener('abort', abort, { once: true });
    reader.onload = () => { clean(); resolve(String(reader.result)); };
    reader.onerror = () => { const error = reader.error; clean(); reject(error); };
    reader.onabort = () => { clean(); reject(new Error('Texture reading was interrupted.')); };
    try { reader.readAsDataURL(blob); }
    catch (error) { clean(); reject(error); }
  })).catch(() => undefined);
  texturePromise = pending;
  // Missing texture is optional. A later attempt may retry after recovery.
  void pending.then(texture => {
    if (texture === undefined && texturePromise === pending) texturePromise = null;
  });
  return pending;
}
function imageFromSVG(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([source], {type:'image/svg+xml;charset=utf-8'}));
    const image = new Image();
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
      URL.revokeObjectURL(url);
      if (error) {
        image.removeAttribute('src');
        reject(error);
      } else resolve(image);
    };
    const timer = window.setTimeout(() => finish(new Error('Image preparation timed out. Please try again.')), 8000);
    image.onload = () => finish();
    image.onerror = () => finish(new Error('The image could not be rendered. Please try again.'));
    image.src = url;
  });
}

function prepareFonts(): Promise<void> {
  if (!document.fonts) return Promise.resolve();
  return new Promise(resolve => {
    const timer = window.setTimeout(resolve, 3000);
    // allSettled consumes late font failures even after the timeout has allowed
    // the explicit serif/sans-serif fallbacks to continue the export.
    void Promise.allSettled([
      document.fonts.load('400 88px "Cormorant Garamond"'),
      document.fonts.load('400 28px "DM Sans"'),
    ]).then(() => { window.clearTimeout(timer); resolve(); });
  });
}

/** Wrap by measured characters: preserves user language and unbroken titles. */
export function wrapTitle(context: CanvasRenderingContext2D, title: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const char of Array.from(title)) {
    if (line && context.measureText(line + char).width > maxWidth) { lines.push(line); line = char; }
    else line += char;
  }
  if (line) lines.push(line);
  return lines;
}

export async function createPrint(getCurrent: () => PersonalState): Promise<{ blob: Blob; dataUrl: string; filename: string }> {
  const texture = await readTexture();
  await prepareFonts();
  for (let attempt = 0; attempt < 2; attempt++) {
    // Capture after assets are ready; a delayed asset may never export old shares.
    const state = structuredClone(getCurrent());
    const identity = JSON.stringify(state);
    const phases: Phase[] = ['arrival', 'unfolding', 'afterglow'];
    const pictures = await Promise.all(phases.map((phase, i) => imageFromSVG(imprintSVG(state.shares, {
      id:'print-' + i, phase, textureHref:texture, label:phase,
    }))));
    if (JSON.stringify(getCurrent()) !== identity) continue;
    const canvas = document.createElement('canvas');
    canvas.width = 2400; canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('This browser cannot prepare an image.');
    ctx.fillStyle = '#F3EDE1'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#CABEAD'; ctx.lineWidth = 2; ctx.strokeRect(45, 45, 2310, 1510);
    ctx.fillStyle = '#29211E'; ctx.font = '400 31px "DM Sans", sans-serif';
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; ctx.fillText('S I L L A G E', 110, 130);
    ctx.textAlign = 'right'; ctx.font = '400 24px "DM Sans", sans-serif'; ctx.fillStyle = '#65564D';
    ctx.fillText('A personal impression', 2290, 130);
    const title = displayTitle(state);
    let titleSize = 98;
    ctx.font = '400 ' + titleSize + 'px "Cormorant Garamond", Georgia, serif';
    let lines = wrapTitle(ctx, title, 2080);
    while (lines.length > 2 && titleSize > 40) {
      titleSize -= 2;
      ctx.font = '400 ' + titleSize + 'px "Cormorant Garamond", Georgia, serif';
      lines = wrapTitle(ctx, title, 2080);
    }
    ctx.fillStyle = '#29211E'; ctx.textAlign = 'center';
    const baseline = lines.length > 1 ? 300 : 350;
    lines.forEach((line, i) => ctx.fillText(line, 1200, baseline + i * titleSize * 1.14));
    pictures.forEach((picture, i) => {
      ctx.drawImage(picture, 80 + 770 * i, 540, 700, 546);
      ctx.font = '400 26px "DM Sans", sans-serif'; ctx.fillStyle = '#65564D';
      ctx.fillText(['Arrival', 'Unfolding', 'Trace'][i], 430 + 770 * i, 1170);
    });
    ctx.beginPath(); ctx.moveTo(110, 1325); ctx.lineTo(2290, 1325); ctx.stroke();
    ctx.textAlign = 'left'; ctx.fillStyle = '#29211E'; ctx.font = '400 28px "DM Sans", sans-serif';
    ctx.fillText('Brightness ' + state.shares[0] + ' / Spice ' + state.shares[1] + ' / Warmth ' + state.shares[2], 110, 1400);
    ctx.textAlign = 'right'; ctx.fillText('The shape of scent.', 2290, 1400);
    ctx.font = '400 21px "DM Sans", sans-serif'; ctx.fillStyle = '#65564D'; ctx.textAlign = 'left';
    ctx.fillText('Visual shares. An original artistic interpretation.', 110, 1470);
    if (JSON.stringify(getCurrent()) !== identity) continue;
    const dataUrl = canvas.toDataURL('image/png');
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(result => {
      if (result) resolve(result); else reject(new Error('The image could not be saved.'));
    }, 'image/png'));
    if (JSON.stringify(getCurrent()) !== identity) continue;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 45) || 'your-impression';
    return {blob, dataUrl, filename:'sillage-' + slug + '.png'};
  }
  throw new Error('Your composition changed while the image was being prepared. Please try again.');
}
