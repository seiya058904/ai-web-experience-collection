import { clamp, lerp, smooth, transitionState, fishPosition } from './state';
import type { ObservationState, Pattern } from './state';

export interface Bounds { x: number; y: number; w: number; h: number }
type Art = { image: HTMLImageElement; ambient: HTMLCanvasElement; surface: HTMLCanvasElement };
const BASE = import.meta.env.BASE_URL;
export const artUrl = (name: string) => BASE + 'pelagic/art/' + name;
const LURE = { x: .35, y: .875 };

function surface(image: HTMLImageElement, strength: number, sideLight: boolean, pattern?: Pattern) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = pixels.data;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const at = (y * canvas.width + x) * 4;
      if (!data[at + 3]) continue;
      const directional = sideLight ? .63 + .37 * Math.max(0, 1 - x / canvas.width) : 1;
      const amount = strength * directional;
      data[at] = Math.round(data[at] * amount * .93);
      data[at + 1] = Math.round(data[at + 1] * amount);
      data[at + 2] = Math.round(data[at + 2] * amount);
    }
  }
  ctx.putImageData(pixels, 0, 0);
  if (pattern) {
    ctx.save(); ctx.scale(canvas.width / 1024, canvas.height / 1536);
    ctx.globalCompositeOperation = 'source-atop';
    pigment(ctx, pattern, .82);
    ctx.restore();
  }
  return canvas;
}

// Both fields are calculated on the same specimen surface. They are not
// screenshots, signal translations, or interchangeable backgrounds.
export function pigment(ctx: CanvasRenderingContext2D, pattern: Pattern, opacity: number) {
  ctx.save();
  if (pattern === 'A') {
    const shade = ctx.createLinearGradient(200, 300, 750, 500);
    shade.addColorStop(0, 'rgba(24,33,30,' + opacity + ')');
    shade.addColorStop(.76, 'rgba(34,41,35,' + opacity + ')');
    shade.addColorStop(1, 'rgba(54,60,47,' + opacity * .5 + ')');
    ctx.fillStyle = shade;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(765, 0);
    ctx.bezierCurveTo(740, 200, 655, 440, 562, 670);
    ctx.bezierCurveTo(528, 775, 506, 990, 460, 1536);
    ctx.lineTo(0, 1536); ctx.closePath(); ctx.fill();
  } else {
    const shade = ctx.createLinearGradient(300, 0, 920, 900);
    shade.addColorStop(0, 'rgba(28,34,29,' + opacity + ')');
    shade.addColorStop(.55, 'rgba(34,42,34,' + opacity * .95 + ')');
    shade.addColorStop(.73, 'rgba(59,66,49,' + opacity * .58 + ')');
    shade.addColorStop(1, 'rgba(59,66,49,0)');
    ctx.fillStyle = shade;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1024, 0); ctx.lineTo(1024, 380);
    ctx.bezierCurveTo(800, 360, 745, 565, 652, 785);
    ctx.bezierCurveTo(595, 900, 513, 1080, 0, 1140);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image(); image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Local artwork unavailable: ' + src));
    image.src = src;
  });
}

export class SceneRenderer {
  private ctx: CanvasRenderingContext2D | null;
  private colony?: Art;
  private squid?: Art;
  private squidPatterns = new Map<Pattern, { ambient: HTMLCanvasElement; surface: HTMLCanvasElement; back: HTMLCanvasElement }>();
  private w = 1;
  private h = 1;
  private dpr = 1;
  private bounds: Bounds[] = [];
  private forcedSvg = new URLSearchParams(location.search).get('renderer') === 'svg';
  private lastSvg = '';
  private ready = false;
  private failed = false;
  private lastLure = { x: 0, y: 0 };
  private svgRoot: HTMLElement;

  constructor(private canvas: HTMLCanvasElement, private stage: HTMLElement) {
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.svgRoot = document.querySelector('#svg-scene')!;
    this.resize();
    this.setMode();
  }
  async load() {
    const loaded = await Promise.allSettled([loadImage(artUrl('colony-asset.webp')), loadImage(artUrl('squid-asset.webp'))]);
    if (!this.ctx) {
      this.failed = loaded.some(v => v.status === 'rejected');
      this.stage.dataset.assets = this.failed ? 'illustrated-fallback' : 'ready';
      this.stage.dataset.ready = 'true';
      this.setMode();
      return;
    }
    if (loaded[0].status === 'fulfilled') {
      const image = loaded[0].value;
      this.colony = { image, ambient: surface(image, .24, false), surface: surface(image, .92, true) };
    }
    if (loaded[1].status === 'fulfilled') {
      const image = loaded[1].value;
      this.squid = { image, ambient: surface(image, .22, false), surface: surface(image, .86, true) };
      for (const pattern of ['A', 'B'] as Pattern[]) {
        this.squidPatterns.set(pattern, {
          ambient: surface(image, .22, false, pattern),
          surface: surface(image, .88, true, pattern),
          back: surface(image, .65, false, pattern),
        });
      }
    }
    this.failed = loaded.some(v => v.status === 'rejected');
    this.ready = !!this.colony;
    this.stage.dataset.assets = this.failed ? 'illustrated-fallback' : 'ready';
    this.stage.dataset.ready = 'true';
    this.setMode();
  }
  resize() {
    const r = this.stage.getBoundingClientRect();
    this.w = r.width; this.h = r.height;
    // Bound high-density rendering. Tissue buffers retain their 1024 × 1536
    // source size; the display canvas never exceeds a 4K pixel budget.
    this.dpr = Math.min(window.devicePixelRatio || 1, this.w > 2000 ? 1 : 1.5, 3840 / this.w, 2160 / this.h);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.bounds = Array.from(document.querySelectorAll<HTMLElement>('.scene-space')).map(el => {
      const box = el.getBoundingClientRect();
      return { x: box.x - r.x, y: box.y - r.y, w: box.width, h: box.height };
    });
    this.lastSvg = '';
  }
  private setMode() {
    const svg = this.forcedSvg || !this.ctx || this.failed;
    this.canvas.style.display = svg ? 'none' : 'block';
    this.svgRoot.style.display = svg ? 'block' : 'none';
    this.stage.dataset.renderer = svg ? 'svg' : 'canvas2d';
    return svg;
  }
  toggleMode() { this.forcedSvg = !this.forcedSvg; this.lastSvg = ''; return this.setMode(); }
  get isSvg() { return this.forcedSvg || !this.ctx || this.failed; }
  get squidUnavailable() { return this.failed && !this.squid; }
  get lure() { return this.lastLure; }
  private box(state: ObservationState) {
    const index = Math.min(3, Math.floor(state.progress));
    const t = smooth(.58, 1, state.progress - index);
    const a = this.bounds[index] || { x: this.w * .45, y: this.h * .15, w: this.w * .5, h: this.h * .65 };
    const b = this.bounds[index + 1] || a;
    return { x: lerp(a.x,b.x,t),y:lerp(a.y,b.y,t),w:lerp(a.w,b.w,t),h:lerp(a.h,b.h,t) };
  }
  private specimenRect(box: Bounds, scale = 1, xOffset = 0) {
    const mobile = this.w <= 760;
    let height = Math.max(80, box.h * (mobile ? 1.02 : 1.015)) * scale;
    let width = height * 2 / 3;
    const maxWidth = box.w * (mobile ? .98 : 1.08);
    if (width > maxWidth) { width = maxWidth; height = width * 1.5; }
    return { x: box.x + (box.w - width) / 2 + xOffset, y: box.y + (box.h - height) / 2 - (mobile ? 0 : 8), w: width, h: height };
  }
  render(state: ObservationState) {
    const b = this.box(state), t = transitionState(state.progress);
    const introScale = 1 - .012 * smooth(0, 2.4, state.time);
    const colonyScale = (1 - .115 * t.pullback) * (1 - .3 * smooth(0, .72, t.species)) * introScale;
    const colonyOffset = b.w * 1.6 * Math.pow(t.species, 3);
    const col = this.specimenRect(b, colonyScale, colonyOffset);
    const sq = this.specimenRect(b, .86 + .14 * t.species, -b.w * Math.pow(1 - t.species, 2));
    const returned = this.specimenRect(b, introScale, 0);
    if (this.isSvg) {
      this.renderSvg(state, b, col, sq, returned);
      return;
    }
    const ctx = this.ctx!;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    this.drawWaterSpecks(ctx, state);
    if (state.progress < 3.58) {
      if (t.species < 1 && this.colony) this.drawColony(ctx, col, state, 1 - smooth(.8, 1, t.species));
      if (t.species > 0 && this.squid) this.drawSquid(ctx, sq, state, smooth(0, .25, t.species));
      if (t.fishAlpha > 0) this.drawFish(ctx, col, state, t.fishAlpha);
    } else {
      const wipe = lerp(b.x + b.w + 25, b.x - 25, t.returnEdit);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, wipe, this.h); ctx.clip();
      if (this.squid) this.drawSquid(ctx, sq, state, 1); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(wipe, 0, this.w - wipe, this.h); ctx.clip();
      if (this.colony) this.drawColony(ctx, returned, state, 1); ctx.restore();
      if (t.returnEdit > .01 && t.returnEdit < .99) {
        ctx.strokeStyle = 'rgba(157,190,187,.3)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(wipe, b.y + 12); ctx.lineTo(wipe, b.y + b.h - 12); ctx.stroke();
      }
    }
  }
  private drawWaterSpecks(ctx: CanvasRenderingContext2D, state: ObservationState) {
    // Eight faint, finite water particles, not an infinite starfield.
    ctx.save();
    for (let i=0;i<8;i++) {
      const x = this.w * (.52 + ((i * 37) % 43) / 100);
      const y = this.h * (.2 + ((i * 19) % 56) / 100) + Math.sin(state.time * .12 + i) * 3;
      ctx.fillStyle = 'rgba(157,190,187,' + (.06 + (i%3)*.018) + ')';
      ctx.beginPath(); ctx.ellipse(x, y, .65, .9, .3, 0, Math.PI*2); ctx.fill();
    } ctx.restore();
  }
  private driftY(state: ObservationState) { return Math.sin(state.time * .25) * (this.w < 761 ? 1 : 2.5); }
  private stripOffset(y: number, state: ObservationState) {
    return Math.sin(state.time * .42 + y * 3.8) * (this.w < 761 ? .9 : 2.2) * Math.pow(y, .8);
  }
  private drawStrips(ctx: CanvasRenderingContext2D, source: CanvasImageSource, rect: Bounds, state: ObservationState, alpha = 1) {
    const sourceHeight = (source as HTMLCanvasElement).height;
    const sourceWidth = (source as HTMLCanvasElement).width;
    const steps = this.w < 761 ? 22 : 38;
    const step = sourceHeight / steps;
    ctx.save(); ctx.globalAlpha *= alpha;
    for(let i=0;i<steps;i++) {
      const sourceY = i * step, actualHeight = Math.min(step + .65, sourceHeight - sourceY);
      const shift = this.stripOffset(i / steps, state);
      ctx.drawImage(source, 0, sourceY, sourceWidth, actualHeight,
        rect.x + shift, rect.y + i * rect.h / steps + this.driftY(state), rect.w, actualHeight / sourceHeight * rect.h);
    } ctx.restore();
  }
  private drawColony(ctx: CanvasRenderingContext2D, rect: Bounds, state: ObservationState, alpha: number) {
    if(!this.colony) return;
    ctx.save(); ctx.globalAlpha = alpha;
    this.drawStrips(ctx, this.colony.ambient, rect, state);
    this.drawStrips(ctx, this.colony.surface, rect, state, state.light);
    this.drawLure(ctx, rect, state);
    ctx.restore();
  }
  private lurePoint(rect: Bounds, state: ObservationState) {
    const flick = Math.sin(state.encounter.position * Math.PI * 3) * .014;
    return { x: rect.x + rect.w * (LURE.x + flick) + this.stripOffset(LURE.y, state),
      y: rect.y + rect.h * LURE.y + this.driftY(state) };
  }
  private drawLure(ctx: CanvasRenderingContext2D, rect: Bounds, state: ObservationState) {
    const point = this.lurePoint(rect,state); this.lastLure = point;
    const start = { x: rect.x + rect.w * .53, y: rect.y + rect.h * .57 + this.driftY(state) };
    ctx.save();
    ctx.strokeStyle = 'rgba(157,190,187,' + (.25 + state.light * .3) + ')';
    ctx.lineWidth = this.w < 761 ? .65 : .85;
    ctx.beginPath(); ctx.moveTo(start.x,start.y);
    ctx.bezierCurveTo(start.x - rect.w*.23, start.y + rect.h*.07, point.x - rect.w*.06, point.y - rect.h*.055, point.x,point.y); ctx.stroke();
    const radius = clamp(rect.h * .007, 2.7, 7);
    const glow = ctx.createRadialGradient(point.x,point.y,0,point.x,point.y,radius*7);
    glow.addColorStop(0,'rgba(224,116,66,.52)');
    glow.addColorStop(.22,'rgba(190,81,66,.16)');
    glow.addColorStop(.66,'rgba(190,81,66,.025)');
    glow.addColorStop(1,'rgba(190,81,66,0)');
    ctx.fillStyle=glow;ctx.fillRect(point.x-radius*7,point.y-radius*7,radius*14,radius*14);
    const bulb=ctx.createRadialGradient(point.x-radius*.18,point.y-radius*.3,0,point.x,point.y,radius*1.7);
    bulb.addColorStop(0,'#ffe5ba');bulb.addColorStop(.2,'#f6bf85');bulb.addColorStop(.48,'#c97650');bulb.addColorStop(1,'#9b443e');
    ctx.fillStyle=bulb;ctx.beginPath();ctx.ellipse(point.x,point.y,radius*.68,radius*1.25,-.25,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(228,156,112,.55)';ctx.lineWidth=.55;
    ctx.beginPath();ctx.ellipse(point.x,point.y,radius*.85,radius*1.45,-.25,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }
  private drawSquid(ctx: CanvasRenderingContext2D, rect: Bounds, state: ObservationState, alpha: number) {
    const pattern = this.squidPatterns.get(state.pattern); if(!pattern) return;
    ctx.save(); ctx.globalAlpha=alpha;
    this.drawStrips(ctx,pattern.ambient,rect,state);
    if(state.backlight) this.drawStrips(ctx,pattern.back,rect,state,.72);
    this.drawStrips(ctx,pattern.surface,rect,state,state.light*.85);
    ctx.restore();
  }
  private drawFish(ctx: CanvasRenderingContext2D, rect: Bounds, state: ObservationState, alpha: number) {
    const point=this.lurePoint(rect,state), p=fishPosition(state.encounter.position);
    const x=point.x+p.x*rect.w, y=point.y+p.y*rect.h*.25;
    const len=clamp(rect.w*.17,30,88), tailBeat=Math.sin(state.time*2.5)*.07;
    ctx.save();ctx.translate(x,y);ctx.rotate(p.angle);ctx.scale(len/90,len/90);ctx.globalAlpha=alpha;
    const gradient=ctx.createLinearGradient(0,-12,0,13);
    gradient.addColorStop(0,'#738d89');gradient.addColorStop(.45,'#536e70');gradient.addColorStop(1,'#233c48');
    ctx.fillStyle=gradient;ctx.strokeStyle='rgba(157,190,187,.45)';ctx.lineWidth=.7;
    ctx.beginPath();ctx.moveTo(42,0);ctx.bezierCurveTo(19,-18,-8,-14,-25,-4);
    ctx.lineTo(-43,-14+tailBeat*50);ctx.quadraticCurveTo(-36,0,-43,14+tailBeat*50);
    ctx.lineTo(-25,4);ctx.bezierCurveTo(-8,15,19,16,42,0);ctx.fill();ctx.stroke();
    ctx.fillStyle='#29434b';ctx.beginPath();ctx.moveTo(-5,-11);ctx.lineTo(2,-23);ctx.lineTo(20,-10);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#8a9f92';ctx.beginPath();ctx.moveTo(27,-7);ctx.quadraticCurveTo(19,0,27,8);ctx.stroke();
    ctx.fillStyle='#aebcac';ctx.beginPath();ctx.arc(29,-2,2.9,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#071923';ctx.beginPath();ctx.arc(29.7,-2,1.7,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  private renderSvg(state: ObservationState,b:Bounds,col:Bounds,sq:Bounds,returned:Bounds) {
    // SVG is a complete alternate renderer. Geometry and controls share state;
    // no WebGL-only dependencies or motion timers exist.
    const ts=transitionState(state.progress);
    const quant=(v:number)=>Math.round(v*100)/100;
    const key=[quant(state.progress),quant(state.light),quant(state.encounter.position),state.pattern,state.backlight,quant(col.w),this.w,this.h].join('|');
    if(key===this.lastSvg)return;this.lastSvg=key;
    const emitted=this.lurePoint(ts.returnEdit>0?returned:col,state);this.lastLure=emitted;
    const colMarkup=(r:Bounds)=>colonySVG(r,state,this.failed&&!this.colony,'col');
    const sqMarkup=(r:Bounds)=>squidSVG(r,state.pattern,state.light,state.backlight,'live',this.failed&&!this.squid);
    let bodies='';
    if(state.progress<3.58){
      if(ts.species<1)bodies+='<g opacity="'+(1-smooth(.8,1,ts.species))+'">'+colMarkup(col)+'</g>';
      if(ts.species>0)bodies+='<g opacity="'+smooth(0,.25,ts.species)+'">'+sqMarkup(sq)+'</g>';
      if(ts.fishAlpha>0){
        const p=fishPosition(state.encounter.position),x=emitted.x+p.x*col.w,y=emitted.y+p.y*col.h*.25;
        const scale=clamp(col.w*.17,30,88)/90;
        bodies+='<g data-fish="single" opacity="'+ts.fishAlpha+'" transform="translate('+x+' '+y+') rotate('+(p.angle*180/Math.PI)+') scale('+scale+')"><path d="M42 0C19-18-8-14-25-4L-43-14Q-36 0-43 14L-25 4C-8 15 19 16 42 0Z" fill="#6c8583" stroke="#9dbebb" stroke-width=".8"/><path d="M-5-11 2-23 20-10Z" fill="#35505a"/><circle cx="29" cy="-2" r="3" fill="#b8c7b5"/><circle cx="30" cy="-2" r="1.7" fill="#071923"/></g>';
      }
    }else{
      const line=lerp(b.x+b.w+25,b.x-25,ts.returnEdit);
      bodies='<defs><clipPath id="old-view"><rect width="'+line+'" height="'+this.h+'"/></clipPath><clipPath id="return-view"><rect x="'+line+'" width="'+(this.w-line)+'" height="'+this.h+'"/></clipPath></defs><g clip-path="url(#old-view)">'+sqMarkup(sq)+'</g><g clip-path="url(#return-view)">'+colMarkup(returned)+'</g>';
      if(ts.returnEdit>.01&&ts.returnEdit<.99)bodies+='<path d="M'+line+' '+(b.y+12)+'V'+(b.y+b.h-12)+'" stroke="#9dbebb" opacity=".3"/>';
    }
    this.svgRoot.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+this.w+' '+this.h+'" fill="none">'+bodies+'</svg>';
  }
  dispose(){this.canvas.width=1;this.canvas.height=1;this.colony=undefined;this.squid=undefined;this.squidPatterns.clear();this.svgRoot.replaceChildren();}
}

function fallbackColony() {
  let body='<path d="M690 90C720 250 650 430 560 600S390 840 330 1010" fill="none" stroke="#a6c5bc" stroke-width="6"/>';
  for(let i=0;i<12;i++){
    const x=690-i*i*2.5,y=100+i*64,side=i%2?1:-1;
    body+='<g transform="translate('+x+' '+y+') rotate('+(side*15)+')"><path d="M0-20C'+(side*115)+'-65 '+(side*140)+' 75 0 59Q'+(side*27)+' 13 0-20Z" fill="#557678" fill-opacity=".25" stroke="#afc8bf" stroke-width="1.4"/><path d="M4-9Q'+(side*30)+' 13 7 39Q-7 24 4-9Z" fill="#a9987b" opacity=".65"/></g>';
    if(i>3)body+='<path d="M'+x+' '+y+'C'+(x-160)+' '+(y+140)+' '+(x+90)+' '+(y+300)+' '+(x-150)+' '+(y+405)+'" stroke="#8baca6" stroke-width="1.2" fill="none"/>';
  }
  return body;
}

export function colonySVG(r:Bounds,state:ObservationState,fallback=false,id='colony'){
  const bright=.24+state.light*.67;
  const flick=Math.sin(state.encounter.position*Math.PI*3)*.014;
  const lx=(LURE.x+flick)*1024,ly=LURE.y*1536;
  const specimen=fallback?fallbackColony():'<image href="'+artUrl('colony-asset.webp')+'" width="1024" height="1536"/>';
  return '<defs><filter id="'+id+'-light" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="linear" slope="'+bright*.93+'"/><feFuncG type="linear" slope="'+bright+'"/><feFuncB type="linear" slope="'+bright+'"/></feComponentTransfer></filter><radialGradient id="'+id+'-lure"><stop stop-color="#e0a471" stop-opacity=".7"/><stop offset=".2" stop-color="#be5142" stop-opacity=".3"/><stop offset="1" stop-color="#be5142" stop-opacity="0"/></radialGradient></defs><g transform="translate('+r.x+' '+r.y+') scale('+r.w/1024+' '+r.h/1536+')"><g filter="url(#'+id+'-light)">'+specimen+'</g><path d="M543 876C307 984 '+(lx-60)+' '+(ly-85)+' '+lx+' '+ly+'" fill="none" stroke="#92a9a0" stroke-opacity=".45" stroke-width="1.6"/><circle cx="'+lx+'" cy="'+ly+'" r="66" fill="url(#'+id+'-lure)"/><ellipse cx="'+lx+'" cy="'+ly+'" rx="7" ry="13" transform="rotate(-14 '+lx+' '+ly+')" fill="#edaf7f"/><ellipse cx="'+(lx-1)+'" cy="'+(ly-3)+'" rx="3" ry="7" fill="#ffe5ba"/></g>';
}

export function squidSVG(r:Bounds,pattern:Pattern,light:number,backlight:boolean,id='squid',fallback=false){
  const brightness=.19+light*.49+(backlight?.34:0);
  const src=artUrl('squid-asset.webp');
  const fallbackShape='<path d="M730 40 925 240 735 300C710 470 630 650 540 756Q600 820 560 900L720 1220Q685 1280 650 1190L530 955 555 1450Q520 1490 510 1400L490 990 365 1420Q320 1460 350 1370L450 940 240 1180Q180 1190 240 1120L420 870Q380 795 460 730C460 420 600 220 730 40Z" fill="#b6b8a3"/><ellipse cx="450" cy="800" rx="21" ry="28" fill="#31505a"/><ellipse cx="553" cy="830" rx="21" ry="28" fill="#31505a"/>';
  const body=fallback?fallbackShape:'<image href="'+src+'" width="1024" height="1536"/>';
  const patternPath=pattern==='A'
    ?'<path d="M0 0H765C740 200 655 440 562 670S506 990 460 1536H0Z" fill="#172b2c" opacity=".78"/>'
    :'<path d="M0 0H1024V380C800 360 745 565 652 785S513 1080 0 1140Z" fill="url(#'+id+'-pigment)" opacity=".88"/>';
  return '<defs><mask id="'+id+'-alpha" mask-type="alpha">'+body+'</mask><linearGradient id="'+id+'-pigment" x1="20%" y1="0%" x2="85%" y2="90%"><stop stop-color="#162b2b"/><stop offset=".6" stop-color="#23392f"/><stop offset="1" stop-color="#23392f" stop-opacity="0"/></linearGradient><filter id="'+id+'-lit" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="linear" slope="'+brightness*.95+'"/><feFuncG type="linear" slope="'+brightness+'"/><feFuncB type="linear" slope="'+brightness*.93+'"/></feComponentTransfer></filter></defs><g transform="translate('+r.x+' '+r.y+') scale('+r.w/1024+' '+r.h/1536+')"><g filter="url(#'+id+'-lit)">'+body+'</g><g mask="url(#'+id+'-alpha)">'+patternPath+'</g></g>';
}

export function stillMarkup(pattern:Pattern,light:number,backlight:boolean,fallback=false){
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 440" role="img" aria-label="Pattern '+pattern+' under the selected light">'+squidSVG({x:3,y:0,w:293,h:440},pattern,light,backlight,'still-'+pattern,fallback)+'</svg>';
}

export function combMarkup(light:number){
  let rows='';
  for(let i=0;i<8;i++){
    const a=(i/8)*Math.PI*2,side=Math.sin(a),front=.35+.65*((Math.cos(a)+1)/2);
    let path='';
    for(let j=0;j<=36;j++){
      const t=j/36,y=32+t*235,x=180+Math.sin(t*Math.PI)*83*side;
      path+=(j?'L':'M')+x+' '+y;
    }
    rows+='<path d="'+path+'" stroke="#92b7b0" stroke-width="1" opacity="'+front*.25+'"/>';
    for(let j=1;j<30;j++){
      const t=j/30,y=32+t*235,x=180+Math.sin(t*Math.PI)*83*side;
      const hue=(j*14+i*19)%360;
      rows+='<path d="M'+(x-3)+' '+y+'q3-2 6 0" stroke="hsl('+hue+' 65% 69%)" stroke-width="1.8" opacity="'+light*front+'"/>';
    }
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 300"><defs><radialGradient id="comb-tissue"><stop stop-color="#6e9690" stop-opacity=".12"/><stop offset=".7" stop-color="#31535b" stop-opacity=".1"/><stop offset="1" stop-color="#9dbebb" stop-opacity=".3"/></radialGradient></defs><path d="M180 30C275 44 299 195 180 270 61 195 85 44 180 30Z" fill="url(#comb-tissue)" stroke="#809f9b" stroke-width="1" stroke-opacity=".5"/>'+rows+'<path d="M180 44V255" stroke="#9dbebb" stroke-width="1" stroke-opacity=".16"/></svg>';
}
