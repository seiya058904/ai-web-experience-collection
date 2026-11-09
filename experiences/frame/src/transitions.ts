import { FrameAssets, assetURL, type Camera } from './assets';
import { cameraForWidth,fitImage,shotAssetURL } from './scene';
import { getPose,pushPositions,type TimelineConfig } from './timeline';
export const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
const smooth=(p:number)=>{const t=clamp(p);return t*t*(3-2*t);};
export interface HandoffState { readonly config:TimelineConfig;readonly heroFrame:number;readonly selectedFrame:number;readonly reduced:boolean; }
/** Every handoff is a pure present-state composition, never an event chain. */
export class Handoff {
  readonly element:HTMLElement;
  readonly kind:number;
  private canvas:HTMLCanvasElement;
  private context:CanvasRenderingContext2D|null;
  private media:HTMLElement;
  private fallback:HTMLImageElement;
  private targetKey='';
  private heroAssets:FrameAssets|null=null;
  private pending=new Set<string>();
  progress=0;
  visible=false;
  constructor(el:HTMLElement,private assets:FrameAssets,private current:()=>HandoffState){this.element=el;this.kind=Number(el.dataset.transition);this.canvas=el.querySelector('canvas')!;this.context=this.canvas.getContext('2d',{alpha:false});this.media=el.querySelector('.handoff-media')!;this.fallback=this.media.querySelector('img')!;}
  update(){
    const r=this.element.getBoundingClientRect(),vh=innerHeight;
    this.visible=r.bottom>0&&r.top<vh;if(!this.visible)return;
    this.progress=this.current().reduced?.5:clamp((vh*.75-r.top)/(r.height+vh*.5));
    this.element.dataset.progress=this.progress.toFixed(4);this.element.style.setProperty('--progress',String(this.progress));this.draw();
  }
  private frameURL(frame:number,preset:TimelineConfig['preset'],camera:Camera){return this.kind===1?shotAssetURL('hero',frame,preset,camera):assetURL(frame,preset,camera);}
  private frameAssets():FrameAssets{
    if(this.kind!==1)return this.assets;
    return this.heroAssets??=new FrameAssets({maxDecoded:8,maxEncoded:8,resolveURL:(frame,preset,camera)=>shotAssetURL('hero',frame,preset,camera)});
  }
  private request(frame:number,preset:TimelineConfig['preset'],camera:Camera){const key=this.frameURL(frame,preset,camera);if(this.pending.has(key))return;this.pending.add(key);void this.frameAssets().load(frame,preset,camera).then(()=>{this.pending.delete(key);if(this.visible)this.draw();}).catch(()=>{this.pending.delete(key);if(key===this.targetKey)this.element.dataset.resourceState='error';});}
  private requiredFrames(state:HandoffState,p:number):number[]{
    if(this.kind===1)return[state.heroFrame,...(smooth((p-.15)/.65)>.02?[Math.min(24,state.heroFrame+1)]:[])];
    if(this.kind===2)return[9];
    if(this.kind===3)return[p<.48?12:6];
    if(this.kind===4)return[6];
    if(this.kind===5)return[p<.55?6:9];
    if(this.kind===6)return[p<.35?12:p<.65?16:18];
    if(this.kind===7)return[18,...(smooth((p-.15)/.7)>.1?[6,12,24]:[])];
    if(this.kind===8)return[state.selectedFrame,...(smooth((p-.15)/.75)<.85?[1,6,12,24]:[])];
    return[24,...(smooth((p-.12)/.72)>.1?[1,6,12,18]:[])];
  }
  draw(){
    if(!this.visible||!this.context)return;
    const state=this.current(),camera=cameraForWidth(),p=this.progress,s=smooth(p),r=this.media.getBoundingClientRect();
    const ratio=Math.min(devicePixelRatio||1,1.5),w=Math.round(r.width*ratio),h=Math.round(r.height*ratio);if(!w||!h)return;
    const preset=this.kind===1?'even':state.config.preset;
    const required=[...new Set(this.requiredFrames(state,p))],primary=required[0];
    this.targetKey=this.frameURL(primary,preset,camera);
    if(this.fallback.getAttribute('src')!==this.targetKey)this.fallback.src=this.targetKey;
    this.fallback.alt=getPose(primary,preset).description;
    this.fallback.width=camera==='portrait'?720:this.kind===1?1000:1280;this.fallback.height=this.kind===1&&camera==='landscape'?900:800;
    this.element.dataset.frame=String(primary);this.element.dataset.preset=preset;this.element.dataset.camera=camera;
    const prepared=new Map<number,HTMLImageElement>();let missing=false;
    const assets=this.frameAssets();
    for(const frame of required){const image=assets.getCached(frame,preset,camera);if(image)prepared.set(frame,image);else{missing=true;this.request(frame,preset,camera);}}
    if(missing){
      // Do not resize, clear or partially repaint a previously valid composition.
      // The fallback now represents this exact frame, take and responsive camera.
      this.canvas.classList.remove('ready');this.media.classList.remove('canvas-ready');
      this.element.dataset.resourceState='loading';return;
    }
    if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
    const ctx=this.context;const dark=this.kind===8;
    const bg=this.kind===2||this.kind===5?'#F4F3ED':this.kind===3||this.kind===6||this.kind===7?'#E5DEEB':dark?'#403D49':this.kind===9?'#E9E2B6':'#AED0C4';
    ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    const panel=(frame:number,x:number,y:number,pw:number,ph:number,angle=0,alpha=1,label=true)=>{
      const image=prepared.get(frame)!;
      ctx.save();ctx.globalAlpha=alpha;ctx.translate(x+pw/2,y+ph/2);ctx.rotate(angle);ctx.fillStyle='#F4F3ED';ctx.shadowColor='rgba(40,37,46,.10)';ctx.shadowBlur=12*ratio;ctx.shadowOffsetY=8*ratio;ctx.fillRect(-pw/2,-ph/2,pw,ph);ctx.shadowColor='transparent';
      const inset=Math.max(3,pw*.015);ctx.fillStyle='#AED0C4';ctx.fillRect(-pw/2+inset,-ph/2+inset,pw-inset*2,ph-inset*2-(label?18*ratio:0));
      fitImage(ctx,image,-pw/2+inset,-ph/2+inset,pw-inset*2,ph-inset*2-(label?18*ratio:0));
      if(label){ctx.fillStyle='#403D49';ctx.font=`${Math.max(9,10*ratio)}px ui-monospace,monospace`;ctx.textAlign='center';ctx.fillText(`FRAME ${String(frame).padStart(2,'0')}`,0,ph/2-6*ratio);}
      ctx.restore();
    };
    const portrait=camera==='portrait';
    if(this.kind===1){
      const a=state.heroFrame,b=Math.min(24,a+1),split=smooth((p-.15)/.65);
      if(portrait){const ph=mix(h*.88,h*.47,split),pw=mix(w*.95,w*.92,split);panel(a,(w-pw)/2,mix(h*.06,0,split),pw,ph);if(split>.02)panel(b,(w-pw)/2,mix(h*1.2,h*.52,split),pw,ph);}
      else {const pw=mix(w*.96,w*.47,split);panel(a,mix(w*.02,0,split),h*.04,pw,h*.88,-.012*split);if(split>.02)panel(b,mix(w*1.05,w*.53,split),h*.04,w*.47,h*.88,.012*split);}
    }else if(this.kind===2){
      panel(9,w*.2,mix(h*.03,h*.04,s),w*.6,mix(h*.92,h*.66,s));
      const points=pushPositions(state.config.preset);ctx.strokeStyle='#403D49';ctx.lineWidth=ratio;ctx.beginPath();ctx.moveTo(w*.09,h*.87);ctx.lineTo(w*.91,h*.87);ctx.stroke();
      points.forEach((x,i)=>{const nx=w*(.09+.82*(x+1.6)/2.95);ctx.beginPath();ctx.fillStyle=i===2?'#D66B66':'#403D49';ctx.arc(nx,h*.87,4.5*ratio,0,Math.PI*2);ctx.fill();ctx.textAlign='center';ctx.font=`${10*ratio}px ui-monospace,monospace`;ctx.fillText(String(i+7).padStart(2,'0'),nx,h*.96);});
    }else if(this.kind===3){
      const frame=p<.48?12:6;panel(frame,w*.19,h*.02,w*.62,h*.74);
      ctx.strokeStyle='#403D4944';ctx.lineWidth=ratio;ctx.beginPath();ctx.moveTo(w*.1,h*.86);ctx.lineTo(w*.9,h*.86);ctx.stroke();
      [6,12,18].forEach((f,i)=>{const x=w*(.19+i*.31);ctx.fillStyle=f===frame?'#D66B66':'#403D49';ctx.beginPath();ctx.arc(x,h*.86,(f===frame?6:3)*ratio,0,Math.PI*2);ctx.fill();ctx.font=`${11*ratio}px ui-monospace,monospace`;ctx.textAlign='center';ctx.fillText(`FRAME ${String(f).padStart(2,'0')}`,x,h*.97);});
    }else if(this.kind===4){
      panel(6,mix(w*.2,w*.015,s),mix(h*.1,h*.02,s),mix(w*.6,w*.97,s),mix(h*.72,h*.96,s),0,1,p<.7);
    }else if(this.kind===5){
      panel(p<.55?6:9,w*.02,h*.02,w*.96,h*.96,0,1,false);
      ctx.strokeStyle='#E4D88B';ctx.lineWidth=2*ratio;ctx.beginPath();ctx.moveTo(w*.12,h*.91);ctx.lineTo(mix(w*.25,w*.82,s),h*.91);ctx.stroke();
    }else if(this.kind===6){
      panel(p<.35?12:p<.65?16:18,w*.02,h*.02,w*.96,h*.96,0,1,false);
    }else if(this.kind===7){
      const shrink=smooth((p-.15)/.7);panel(18,mix(w*.015,w*.12,shrink),0,mix(w*.97,w*.76,shrink),mix(h*.97,h*.7,shrink));
      if(shrink>.1){const fw=w*.21;[6,12,24].forEach((f,i)=>panel(f,w*(.12+i*.28),mix(h*1.1,h*.75,shrink),fw,h*.23,0,1,false));}
    }else if(this.kind===8){
      const grow=smooth((p-.15)/.75);const frame=state.selectedFrame;
      if(grow<.85)[1,6,12,24].forEach((f,i)=>panel(f,w*(.05+i*.235),h*.77+grow*h*.3,w*.195,h*.2,0,1,false));
      panel(frame,mix(w*.15,w*.015,grow),mix(h*.02,0,grow),mix(w*.7,w*.97,grow),mix(h*.68,h*.98,grow),0,1,grow<.6);
    }else{
      const shrink=smooth((p-.12)/.72);
      panel(24,mix(w*.015,w*.36,shrink),mix(h*.02,h*.04,shrink),mix(w*.97,w*.61,shrink),mix(h*.96,h*.65,shrink));
      if(shrink>.1)[1,6,12,18].forEach((f,i)=>panel(f,w*(.03+i*.24),mix(h*1.15,h*.75,shrink),w*.21,h*.22,0,1,false));
    }
    this.canvas.classList.add('ready');this.media.classList.add('canvas-ready');this.element.dataset.resourceState='ready';
    this.element.dataset.renderedFrame=String(primary);this.element.dataset.renderedPreset=preset;this.element.dataset.renderedCamera=camera;
  }
}
