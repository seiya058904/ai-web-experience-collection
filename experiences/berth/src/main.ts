import './styles.css';
import 'lenis/dist/lenis.css';
import './critical.css';
import {heroPreview,heroMobilePreview} from './critical-art.ts';
import { renderStory } from './render.ts';
import { loadState } from './state.ts';
import { setupInteractions } from './interactions.ts';
import { setupScroll } from './scroll.ts';

const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML=renderStory();
const heroPicture=app.querySelector<HTMLElement>('.hero-art picture');
heroPicture?.style.setProperty('--hero-preview',`url("${heroPreview}")`);
heroPicture?.style.setProperty('--hero-preview-mobile',`url("${heroMobilePreview}")`);
const firstArt=new Image();
firstArt.src=matchMedia('(max-width:720px)').matches?heroMobilePreview:heroPreview;
firstArt.decode().then(()=>requestAnimationFrame(()=>performance.mark('berth:meaningful-visual'))).catch(()=>{});
const {state}=loadState();
let director:ReturnType<typeof setupScroll>|undefined;
const interactions=setupInteractions(state,next=>director?.update(next));
director=setupScroll(state);
performance.mark('berth:interactive');
app.dataset.interactive='true';

// Each picture owns its recovery generation. Network/body decoding is bounded;
// neither a cached failure nor an obsolete portrait request can strand the UI.
type AssetEntry={name:string;previewDataUri?:string};
type ImageQuality='full'|'small'|'recovery-preview';
let manifest:Promise<AssetEntry[]>|undefined;
let manifestController:AbortController|undefined;
const fallbackManifest=():Promise<AssetEntry[]>=>{
 if(manifest)return manifest;
 const request=(async()=>{
 const controller=new AbortController();
 manifestController=controller;
 const timer=window.setTimeout(()=>controller.abort(),4000);
 try{
   const response=await fetch(`${import.meta.env.BASE_URL}berth/assets/manifest.json`,{signal:controller.signal});
   if(!response.ok)return [];
   const data:unknown=await response.json();
   if(!data || typeof data!=='object' || !('format' in data) || data.format!=='berth-assets-v1' || !('assets' in data) || !Array.isArray(data.assets))return [];
   return data.assets.filter((entry):entry is AssetEntry=>Boolean(entry && typeof entry.name==='string' && typeof entry.previewDataUri==='string' && /^data:image\/(?:webp|png|jpeg);base64,/.test(entry.previewDataUri)));
 }catch{return [];}
 finally{clearTimeout(timer);if(manifestController===controller)manifestController=undefined;}
 })();
 manifest=request;
 // An unrelated HTML response or timeout must not poison all later retries.
 void request.then(items=>{if(items.length===0&&manifest===request)manifest=undefined;});
 return request;
};
const resetManifest=()=>{manifestController?.abort();manifestController=undefined;manifest=undefined;};
window.addEventListener('online',resetManifest);
let heroMarked=false;
const listeners:Array<()=>void>=[()=>{window.removeEventListener('online',resetManifest);resetManifest();}];
const portraitMedia=matchMedia('(max-width:720px)');
const absolute=(url:string)=>{try{return new URL(url,document.baseURI).href;}catch{return url;}};

for(const img of document.querySelectorAll<HTMLImageElement>('picture img')){
 const picture=img.closest<HTMLPictureElement>('picture')!;
 const isHero=Boolean(picture.closest('.hero-art'));
 const description=img.alt||'A quiet moment in the same night-train compartment. The complete story remains below.';
 const original={src:img.getAttribute('src')??'',srcset:img.getAttribute('srcset')??'',loading:img.loading,visibility:img.style.visibility,role:picture.getAttribute('role'),label:picture.getAttribute('aria-label'),sources:[...picture.querySelectorAll('source')].map(el=>({el,srcset:el.getAttribute('srcset')??'',media:el.media}))};
 let epoch=0;
 let disposed=false;
 let phase:'primary'|'small'|'manifest'|'preview'|'ready'|'failed'='primary';
 let nativeSources=true;
 let activeUrl='';
 let activeQuality:ImageQuality='full';
 let cancelCandidate:(()=>void)|undefined;
 let inspectFrame=0;
 const assetName=()=>portraitMedia.matches&&picture.dataset.mobile?picture.dataset.mobile:picture.dataset.asset??'';
 let target=assetName();
 const current=(ticket:number,name:string)=>!disposed&&img.isConnected&&ticket===epoch&&name===assetName();
 const hasSettled=()=>phase==='ready';
 const sourceUrl=()=>img.currentSrc?absolute(img.currentSrc):'';
 const nativeMatches=()=>{
   const selected=original.sources.find(source=>!source.media||matchMedia(source.media).matches);
   const candidates=(selected?.srcset??original.srcset).split(',').map(item=>item.trim().split(/\s+/)[0]).filter(Boolean).map(absolute);
   if(!selected)candidates.push(absolute(original.src));
   return !img.currentSrc||candidates.includes(sourceUrl());
 };
 const unavailable=()=>{
   // Hide the broken <img> before waiting for any other event or network request.
   img.style.visibility='hidden';
   picture.classList.add('image-failed');
   picture.classList.remove('image-preview');
   picture.dataset.fallbackDescription=isHero?'':description;
   picture.setAttribute('role','img');picture.setAttribute('aria-label',description);
   if(isHero){
     // The embedded poster keeps its responsive composition and never acquires
     // the generic failure card's padding or a second text layer over the title.
     picture.style.backgroundImage=portraitMedia.matches?'var(--hero-preview-mobile)':'var(--hero-preview)';
     picture.style.display='block';picture.style.padding='0';picture.style.minHeight='0';
   }
 };
 const reveal=(quality:ImageQuality)=>{
   if(disposed||!img.complete||img.naturalWidth===0||target!==assetName())return;
   phase='ready';activeQuality=quality;
   img.style.visibility=original.visibility;
   img.loading=original.loading;
   picture.classList.remove('image-failed');
   picture.classList.toggle('image-preview',quality==='recovery-preview');
   delete picture.dataset.fallbackDescription;
   for(const [name,value]of [['role',original.role],['aria-label',original.label]] as const){if(value===null)picture.removeAttribute(name);else picture.setAttribute(name,value);}
   if(isHero){
     for(const property of ['background-image','display','padding','min-height'])picture.style.removeProperty(property);
     app.dataset.heroReady='true';app.dataset.heroQuality=quality;
     if(!heroMarked){heroMarked=true;performance.mark('berth:hero-ready');}
   }
 };
 const loadCandidate=(url:string,ticket:number,name:string,timeout:number):Promise<boolean>=>new Promise(resolve=>{
   const expected=absolute(url);
   activeUrl=expected;
   let finished=false;
   let frame=0;
   const finish=(ok:boolean)=>{
     if(finished)return;finished=true;
     clearTimeout(timer);if(frame)cancelAnimationFrame(frame);
     img.removeEventListener('load',check);img.removeEventListener('error',check);
     if(cancelCandidate===cancel)cancelCandidate=undefined;
     resolve(ok);
   };
   const cancel=()=>finish(false);
   const check=()=>{
     if(!current(ticket,name)){finish(false);return;}
     if(!img.complete)return;
     if(sourceUrl()!==expected && !(img.currentSrc===''&&absolute(img.src)===expected))return;
     finish(img.naturalWidth>0);
   };
   const timer=window.setTimeout(()=>finish(false),timeout);
   cancelCandidate=cancel;
   img.addEventListener('load',check);img.addEventListener('error',check);
   img.loading='eager';
   img.src=url;
   // Setting an already failed URL need not dispatch another error event.
   queueMicrotask(check);frame=requestAnimationFrame(check);
 });
 const recover=async(failedUrl:string)=>{
   if(disposed||!nativeSources||target!==assetName())return;
   const ticket=epoch,name=target;
   nativeSources=false;
   unavailable();
   original.sources.forEach(({el})=>el.removeAttribute('srcset'));
   img.removeAttribute('srcset');
   const small=portraitMedia.matches&&img.dataset.fallbackMobile?img.dataset.fallbackMobile:img.dataset.fallback;
   if(small&&absolute(small)!==failedUrl){
     phase='small';activeQuality='small';
     const ok=await loadCandidate(small,ticket,name,5000);
     if(!current(ticket,name))return;
     if(ok){reveal('small');return;}
   }
   phase='manifest';
   const embedded=name==='hero'?heroPreview:name==='hero-mobile'?heroMobilePreview:(await fallbackManifest()).find(entry=>entry.name===name)?.previewDataUri;
   if(!current(ticket,name)||hasSettled())return;
   if(embedded){
     phase='preview';activeQuality='recovery-preview';
     const ok=await loadCandidate(embedded,ticket,name,2000);
     if(!current(ticket,name))return;
     if(ok){reveal('recovery-preview');return;}
   }
   phase='failed';unavailable();
 };
 const inspect=()=>{
   if(disposed||target!==assetName()||!img.complete)return;
   if(nativeSources){
     if(!nativeMatches())return;
     if(img.naturalWidth>0)reveal(/-small\.webp(?:[?#]|$)/.test(img.currentSrc)?'small':'full');
     else void recover(sourceUrl());
   }else if((phase==='manifest'||phase==='failed')&&img.naturalWidth>0&&sourceUrl()===activeUrl){
     // A timed-out candidate may still decode later. Upgrade only the same
     // generation's still-current URL, never an obsolete responsive candidate.
     reveal(activeQuality);
   }
 };
 const scheduleInspect=()=>{if(inspectFrame)cancelAnimationFrame(inspectFrame);inspectFrame=requestAnimationFrame(()=>{inspectFrame=0;inspect();});};
 const retry=()=>{
   if(disposed)return;
   epoch++;cancelCandidate?.();
   target=assetName();phase='primary';nativeSources=true;activeUrl='';
   // Keep the semantic/embedded fallback until a replacement is actually valid.
   img.style.visibility='hidden';
   if(picture.classList.contains('image-failed'))unavailable();
   original.sources.forEach(({el,srcset})=>el.setAttribute('srcset',srcset));
   img.srcset=original.srcset;img.src=original.src;
   if(picture.classList.contains('image-failed'))img.loading='eager';
   queueMicrotask(inspect);scheduleInspect();
 };
 img.addEventListener('error',inspect);img.addEventListener('load',inspect);
 window.addEventListener('online',retry);
 window.addEventListener('resize',scheduleInspect,{passive:true});
 if(picture.dataset.mobile)portraitMedia.addEventListener('change',retry);
 if(isHero)img.style.visibility='hidden';
 inspect();scheduleInspect();
 listeners.push(()=>{
   disposed=true;epoch++;cancelCandidate?.();if(inspectFrame)cancelAnimationFrame(inspectFrame);
   img.removeEventListener('error',inspect);img.removeEventListener('load',inspect);
   window.removeEventListener('online',retry);window.removeEventListener('resize',scheduleInspect);
   portraitMedia.removeEventListener('change',retry);
 });
}
if(import.meta.hot)import.meta.hot.dispose(()=>{director?.destroy();interactions.destroy();listeners.forEach(fn=>fn());});
