import fallbackData from './fallbacks.json';
import { asset, alts } from './media.ts';

const fallbacks:Record<string,string>=fallbackData;
const versions=new WeakMap<HTMLPictureElement,number>();
const registered=new WeakSet<HTMLPictureElement>();

/** Every image owns its request token; a late result can never repaint another chapter. */
export function setPicture(picture:HTMLPictureElement,name:string,alt?:string):void{
  const image=picture.querySelector('img');if(!image)return;
  const token=(versions.get(picture)??0)+1;versions.set(picture,token);
  picture.dataset.asset=name;
  picture.style.backgroundImage=fallbacks[`${name}.webp`]?`url("${fallbacks[`${name}.webp`]}")`:'';
  picture.classList.remove('is-failed');picture.classList.add('is-loading');
  picture.querySelector('.asset-error')?.remove();
  image.alt=alt??image.alt;
  image.onload=()=>{if(versions.get(picture)!==token)return;picture.classList.remove('is-loading','is-failed');picture.dataset.loaded='true';picture.querySelector('.asset-error')?.remove();};
  image.onerror=()=>{if(versions.get(picture)!==token)return;showError(picture);};
  image.src=asset(name);
  // A cached responsive source can finish before the next load event.
  queueMicrotask(()=>{if(versions.get(picture)===token&&image.complete){if(image.naturalWidth){picture.classList.remove('is-loading','is-failed');picture.dataset.loaded='true';picture.querySelector('.asset-error')?.remove();}else showError(picture);}});
}
function showError(picture:HTMLPictureElement):void{
  picture.classList.remove('is-loading');picture.classList.add('is-failed');picture.dataset.loaded='false';
  if(picture.closest('.transition-layer')||picture.querySelector('.asset-error'))return;
  const notice=document.createElement('div');notice.className='asset-error';
  const text=document.createElement('span');text.textContent='This scene could not load. The story remains available in still view.';
  const retry=document.createElement('button');retry.type='button';retry.textContent='Retry';retry.addEventListener('click',()=>setPicture(picture,picture.dataset.asset!));
  notice.append(text,retry);picture.append(notice);
}
export function initializeImages():()=>void{
  const dispose:Array<()=>void>=[];
  document.querySelectorAll<HTMLPictureElement>('picture.scene-media').forEach(picture=>{
    if(registered.has(picture))return;registered.add(picture);
    const image=picture.querySelector('img');if(!image)return;
    const isHero=picture.classList.contains('hero-art');
    const name=picture.dataset.asset??(isHero?'ai-04-hero':'');picture.dataset.asset=name;
    const previewName=isHero&&matchMedia('(max-width:700px)').matches?'ai-05-mobile':name;
    const fallback=fallbacks[`${previewName}.webp`];if(fallback)picture.style.backgroundImage=`url("${fallback}")`;
    versions.set(picture,0);
    const onLoad=()=>{picture.classList.remove('is-failed','is-loading');picture.dataset.loaded='true';if(isHero){document.documentElement.dataset.heroReady='true';if(!performance.getEntriesByName('chrysalis-hero-ready').length)performance.mark('chrysalis-hero-ready');}};
    image.onload=onLoad;image.onerror=()=>showError(picture);
    if(image.complete){if(image.naturalWidth)onLoad();else if(image.currentSrc)showError(picture);}else picture.classList.add('is-loading');
    if(picture.querySelector('source[media]')){
      const portrait=matchMedia('(max-width:700px)');
      const refreshResponsive=()=>setPicture(picture,portrait.matches?'ai-05-mobile':'ai-04-hero');
      portrait.addEventListener('change',refreshResponsive);
      dispose.push(()=>portrait.removeEventListener('change',refreshResponsive));
    }
  });
  // The alpha layer has a complete matching adult still as a graceful fallback.
  const butterfly=document.querySelector<HTMLImageElement>('#flight-butterfly');
  const alphaError=()=>{
    if(!butterfly)return;butterfly.hidden=true;
    const back=document.querySelector<HTMLPictureElement>('.finale-backdrop');
    if(back)setPicture(back,'ai-12-adult',alts[10]);
    const control=document.querySelector<HTMLButtonElement>('#flight-toggle');
    if(control){control.textContent='Return to the leaf';control.dataset.stillFlight='true';}
  };
  butterfly?.addEventListener('error',alphaError);
  dispose.push(()=>butterfly?.removeEventListener('error',alphaError));
  return()=>dispose.forEach(fn=>fn());
}
