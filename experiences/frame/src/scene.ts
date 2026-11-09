import { FrameAssets, assetPath, resolveLocalAsset, type Camera } from './assets';
import { getPose, normalizeFrame, type SpacingPreset } from './timeline';

export function cameraForWidth(): Camera { return matchMedia('(max-width: 620px)').matches ? 'portrait' : 'landscape'; }
export type SceneShot = 'hero' | 'preparation' | 'contact' | 'ending';
export function shotAssetURL(shot:SceneShot|null,frame:number,preset:SpacingPreset,camera:Camera):string{
  const normal=assetPath(frame,preset,camera),f=normalizeFrame(frame);
  if(shot==='hero')return resolveLocalAsset(normal.replace(/frames\/(?:landscape|portrait)\/[^/]+$/,`frames/${camera==='portrait'?'hero-portrait':'hero'}/even-${String(f).padStart(2,'0')}.webp`));
  const still=shot==='preparation'?(f===2?'glance':f===6?'preparation':null)
    :shot==='contact'?(f===6?'contact':f===9?'pushing':null)
    :shot==='ending'&&f===24?'resting':null;
  return resolveLocalAsset(still?normal.replace(/frames\/(?:landscape|portrait)\/[^/]+$/,`stills/${still}-${camera}.webp`):normal);
}
export function fitImage(ctx: CanvasRenderingContext2D, image: CanvasImageSource & {width?:number;height?:number;naturalWidth?:number;naturalHeight?:number}, x:number,y:number,w:number,h:number){
  const iw=image.naturalWidth||image.width||1280, ih=image.naturalHeight||image.height||800;
  const s=Math.min(w/iw,h/ih);ctx.drawImage(image,x+(w-iw*s)/2,y+(h-ih*s)/2,iw*s,ih*s);
}
export class Scene {
  readonly element: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  readonly picture: HTMLElement;
  private fallback: HTMLImageElement;
  private source: HTMLSourceElement;
  private context: CanvasRenderingContext2D | null;
  private revision=0;
  private lastImage:HTMLImageElement|null=null;
  private onion=false;
  private shot:SceneShot|null=null;
  private shotProviders=new Map<SceneShot,FrameAssets>();
  frame:number;
  preset:SpacingPreset='even';
  visible=false;
  camera:Camera=cameraForWidth();
  constructor(element:HTMLElement,private assets:FrameAssets){
    this.element=element;this.frame=Number(element.dataset.frame)||1;
    this.canvas=element.querySelector('canvas')!;
    this.picture=element.querySelector('.scene-picture')!;
    this.fallback=element.querySelector('img')!;this.source=element.querySelector('source')!;
    this.context=this.canvas.getContext('2d',{alpha:false});
    this.fallback.addEventListener('error',()=>this.showError());
    this.element.dataset.camera=this.camera;
    const shot=element.dataset.shot;
    if(shot==='hero'||shot==='preparation'||shot==='contact'||shot==='ending')this.setShot(shot);
  }
  private currentAssets():FrameAssets{
    if(!this.shot)return this.assets;
    let provider=this.shotProviders.get(this.shot);
    if(!provider){const shot=this.shot,size=shot==='hero'?32:8;provider=new FrameAssets({maxDecoded:size,maxEncoded:size,resolveURL:(frame,preset,camera)=>shotAssetURL(shot,frame,preset,camera)});this.shotProviders.set(shot,provider);}
    return provider;
  }
  setShot(shot:SceneShot|null){
    if(shot===this.shot)return;
    this.shot=shot;
    if(shot)this.element.dataset.shot=shot;else delete this.element.dataset.shot;
    this.lastImage=null;
    this.setTarget(this.frame,this.preset);
  }
  preload(frames:readonly number[],preset:SpacingPreset=this.preset):Promise<void>{
    const camera=cameraForWidth();return this.currentAssets().preload(frames,preset,camera);
  }
  setTarget(frame:number,preset:SpacingPreset=this.preset){
    const next=normalizeFrame(frame),camera=cameraForWidth();
    if(next===this.frame&&preset===this.preset&&camera===this.camera&&this.lastImage){if(this.visible)this.draw();return;}
    this.frame=next;this.preset=preset;this.camera=camera;this.lastImage=null;
    this.revision++;this.element.dataset.frame=String(next);this.element.dataset.preset=preset;this.element.dataset.camera=camera;
    const pose=getPose(next,preset);
    const description=this.shot==='ending'&&next===24?'Boop sits quietly beside the aligned red block and yellow outline.':pose.description;
    const desc=this.element.querySelector('.frame-description');if(desc)desc.textContent=description;
    const n=this.element.querySelector('.frame-number');if(n)n.textContent=`FRAME ${String(next).padStart(2,'0')}`;
    this.fallback.alt=description;
    this.source.srcset=shotAssetURL(this.shot,next,preset,'portrait');this.fallback.src=shotAssetURL(this.shot,next,preset,'landscape');
    const cached=this.currentAssets().getCached(next,preset,camera);
    if(cached){this.lastImage=cached;this.clearError();if(this.visible)this.draw();}
    else {this.clearError('loading');this.canvas.classList.remove('ready');this.picture.classList.remove('canvas-ready');if(this.visible)void this.prepare();}
  }
  async prepare(){
    const revision=this.revision;const frame=this.frame,preset=this.preset,camera=this.camera;
    try{
      const image=await this.currentAssets().load(frame,preset,camera);
      if(revision!==this.revision)return;
      this.lastImage=image;this.clearError();if(this.visible)this.draw();
    }catch{if(revision===this.revision)this.showError();}
  }
  setOnion(enabled:boolean){this.onion=enabled;if(enabled&&this.frame>1)void this.currentAssets().load(this.frame-1,this.preset,this.camera).then(()=>this.draw()).catch(()=>{});this.draw();}
  resize(){const camera=cameraForWidth();if(camera!==this.camera)this.setTarget(this.frame,this.preset);else if(this.visible)this.draw();}
  draw(){
    if(!this.visible||!this.lastImage||!this.context)return;
    const rect=this.picture.getBoundingClientRect();if(!rect.width||!rect.height)return;
    const dpr=Math.min(devicePixelRatio||1,1.5);
    const width=Math.max(1,Math.round(rect.width*dpr)),height=Math.max(1,Math.round(rect.height*dpr));
    if(this.canvas.width!==width||this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height;}
    const ctx=this.context;ctx.fillStyle='#AED0C4';ctx.fillRect(0,0,width,height);
    fitImage(ctx,this.lastImage,0,0,width,height);
    if(this.onion&&this.frame>1){const prev=this.currentAssets().getCached(this.frame-1,this.preset,this.camera);if(prev){ctx.save();ctx.globalAlpha=.2;fitImage(ctx,prev,0,0,width,height);ctx.restore();}}
    this.canvas.classList.add('ready');this.picture.classList.add('canvas-ready');
    this.element.dataset.renderedFrame=String(this.frame);this.element.dataset.renderedPreset=this.preset;
    this.element.dataset.renderedCamera=this.camera;this.element.dataset.renderedShot=this.shot??'sequence';
    if(this.element.dataset.scene==='hero'&&!document.body.dataset.heroReady)document.body.dataset.heroReady=performance.now().toFixed(1);
  }
  private showError(){const notice=this.element.querySelector<HTMLElement>('.scene-notice');if(notice){notice.hidden=false;notice.querySelector('span')!.textContent='This pose could not load. Its description is still available.';}this.element.dataset.resourceState='error';}
  private clearError(state:'ready'|'loading'='ready'){const notice=this.element.querySelector<HTMLElement>('.scene-notice');if(notice)notice.hidden=true;this.element.dataset.resourceState=state;}
  retry(){this.revision++;void this.prepare();}
}
