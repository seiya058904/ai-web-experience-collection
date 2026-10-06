import type { StageSettings } from './stage';
import { smooth } from './shared';

/** Original, deterministic 2.5D geometry preserves the exhibition if a GPU context is unavailable. */
export class FallbackStage {
  private canvas = document.createElement('canvas');
  private ctx: CanvasRenderingContext2D;
  private w = 1;
  private h = 1;
  constructor(container: HTMLElement) {
    this.canvas.className = 'artwork-canvas fallback-canvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    container.append(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
    this.resize(container.clientWidth, container.clientHeight);
  }
  resize(w: number, h: number) {
    this.w = w; this.h = h;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    this.canvas.width = w * dpr; this.canvas.height = h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  render(progress: number, time: number, settings: StageSettings) {
    const c = this.ctx, w = this.w, h = this.h, compactLandscape = h <= 500 && w / h >= 1.5, mobile = w < 760 && !compactLandscape;
    const index = Math.min(7, Math.floor(progress));
    if(settings.reduced)progress=index+(index===0?0:index===7?.57:.5);
    const unit = compactLandscape ? Math.min(w / 18, h / 11.5) : mobile ? w / 10 : Math.min(w / 18, h / 10);
    const cx = w * (compactLandscape ? .70 : mobile ? .5 : .68), cy = h * (mobile ? .55 : .53);
    c.clearRect(0, 0, w, h);
    const project = (x: number, y: number, z: number): [number,number] => [cx + (x-z*.52)*unit, cy+(x*.18+z*.38-y)*unit];
    const poly = (points: number[][], fill: string, stroke='#a6b3b7') => {
      c.beginPath(); points.forEach(([x,y,z],i)=>{ const [a,b]=project(x,y,z); i?c.lineTo(a,b):c.moveTo(a,b); });
      c.closePath(); c.fillStyle=fill;c.fill();c.strokeStyle=stroke;c.lineWidth=.6;c.stroke();
    };
    const plate=(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:string)=>{
      poly([[x,y,z],[x+sx,y,z],[x+sx,y,z+sz],[x,y,z+sz]],color);
      poly([[x,y,z+sz],[x+sx,y,z+sz],[x+sx,y-sy,z+sz],[x,y-sy,z+sz]],'#242f36','#626e76');
      poly([[x+sx,y,z],[x+sx,y,z+sz],[x+sx,y-sy,z+sz],[x+sx,y-sy,z]],'#38434a','#72828b');
    };
    if(index<2){
      c.save();c.translate(cx,cy);c.rotate(-.17);c.scale(1,.53);
      const r=unit*(index===0?5.4:3.6);
      const gradient=c.createLinearGradient(-r,-r,r,r);
      gradient.addColorStop(0,'#415767');gradient.addColorStop(.32,'#b8bdc1');gradient.addColorStop(.49,'#ab8995');gradient.addColorStop(.6,'#9991b0');gradient.addColorStop(1,'#4d606b');
      c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fillStyle=gradient;c.fill();c.strokeStyle='#c3b8aa';c.lineWidth=2;c.stroke();c.clip();
      c.strokeStyle='#26343e';c.lineWidth=.65;
      for(let i=-15;i<16;i++){const p=i*r/15;c.beginPath();c.moveTo(-r,p);c.lineTo(r,p);c.moveTo(p,-r);c.lineTo(p,r);c.stroke();}
      c.strokeStyle='#94a2ab';c.lineWidth=.24;
      for(let i=-15;i<15;i++)for(let j=-15;j<15;j++)c.strokeRect(i*r/15+2,j*r/15+2,r/15-4,r/15-4);
      c.restore();
      if(index===1){
        const nodes=[[-1,3.8,0],[2,2.7,0],[-1,1.7,0],[0,0,0]];
        c.strokeStyle='#c3aceb';c.lineWidth=1.5;c.beginPath();nodes.forEach(([x,y,z],i)=>{const[a,b]=project(x,y,z);i?c.lineTo(a,b):c.moveTo(a,b)});c.stroke();
        nodes.slice(0,3).forEach(([x,y,z])=>{const[a,b]=project(x,y,z);c.beginPath();c.ellipse(a,b,unit*.65,unit*.19,-.3,0,Math.PI*2);c.fillStyle='#9da7b0';c.fill();c.strokeStyle='#e4e8e8';c.stroke()});
        const amount = settings.exposure < 0 ? smooth(.08,.73,progress-index) : settings.exposure;
        const scan = -1.3 + amount*2.6;
        const a=project(-1.4,.06,scan),b=project(1.4,.06,scan);
        c.strokeStyle='#dfc6f1';c.lineWidth=2;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();
      }
      return;
    }
    if(index===3){
      plate(-3,-.6,-2,6,.35,4,'#788893');
      for(const x of [-2.4,1.7])plate(x,1.5,-.8,.7,2,1.6,'#b4bec3');
      for(let k=0;k<3;k++)plate(-1.8,k*.55+.1,-.65,3.7,.16,1.3,settings.gate>.5?'#a5c9c5':'#6a7a83');
      plate(-.7,2,-1.1,1.4,.4,2.2,'#b38962');
    }else if(index===2||index===4){
      plate(-3,-1.3,-2.4,6,.3,4.8,'#667580');
      for(let layer=0;layer<6;layer++){
        const separation=settings.spread<0?.45:settings.spread;
        const y=-.9+layer*(index===4?.34+separation*.48:.56);
        if(index===2)plate(-2.6,y,-2.1,5.2,.12,4.2,layer%2?'#9c8067':'#7c8e9b');
        else for(let j=0;j<8;j++){const d=-2.45+j*.7;layer%2?plate(d,y,-2.2,.15,.14,4.4,'#ba946e'):plate(-2.7,y,d,5.4,.14,.15,'#b88e62');}
      }
    }else{
      const local=progress-index;
      const spread=index===5?(settings.spread<0?1-smooth(.56,.94,local):settings.spread):0;
      plate(-3.5,-1.3,-2.7,7,.4,5.4,'#29343c');
      plate(-3.15,-.6+spread,-2.45,6.3,.15,4.9,'#66737c');
      const y=-.3+spread*2;
      for(const x of [-1.6,.15])plate(x,y,-1,1.5,.2,2,'#26383d');
      for(const x of [-2.9,2])for(const z of [-1.8,.6])for(let k=0;k<5;k++)plate(x,y+k*.16,z,.85,.1,1.2,'#566570');
      if(index===7)plate(-3,1,-2.35,6,.3,4.7,'#b6bec4');
      if(index===6){const powered=settings.power<0?1:settings.power;c.strokeStyle=powered>.01?'#d0ae83':'#586265';c.lineWidth=1;c.beginPath();for(let k=0;k<5;k++){const[a,b]=project(-3+k*1.5,-.39,Math.sin(k)*1.2);k?c.lineTo(a,b):c.moveTo(a,b)}c.stroke();if(powered>.01){const phase=settings.reduced?3:time*.8%6;const[a,b]=project(-3+phase,-.38,.3);c.fillStyle='#e0f1e4';c.beginPath();c.arc(a,b,2,0,7);c.fill();}}
    }
  }
  dispose(){this.canvas.remove();}
}
