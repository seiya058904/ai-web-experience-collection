import { chapters, sources, instars, emergenceStages } from './content.js';
import { hatchDiagram, feedingDiagram, instarDiagram, emergenceDiagram } from './diagrams.ts';
import { escapeHTML as e, alts } from './media.ts';
import { setPicture } from './image-loader.ts';
import type { ScrollController } from './scroll-controller.ts';

const $=<T extends HTMLElement=HTMLElement>(selector:string)=>document.querySelector<T>(selector)!;
let statusTimer:number|undefined;
export function announce(message:string):void{window.clearTimeout(statusTimer);$('#status-message').textContent=message;statusTimer=window.setTimeout(()=>{$('#status-message').textContent='';},6000);}
export function initializeInteractions(controller:ScrollController):()=>void{
  const returnFocus=new WeakMap<HTMLDialogElement,HTMLElement>();
  let requestedReduced=false;let stills=false;let departed=false;
  try{requestedReduced=localStorage.getItem('chrysalis-motion')==='reduced';stills=localStorage.getItem('chrysalis-view')==='stills';}catch{/* Preferences are optional in private browsing. */}
  function syncMode():void{
    document.documentElement.dataset.view=stills?'stills':'immersive';
    controller.setReduced(stills||requestedReduced);
    document.querySelectorAll<HTMLButtonElement>('.motion-button').forEach(b=>{b.textContent=controller.reduced?'Motion: Reduced':'Motion: On';b.setAttribute('aria-pressed',String(controller.reduced));});
    document.querySelectorAll<HTMLButtonElement>('.stills-button').forEach(b=>{b.textContent=stills?'Return to immersive view':'View as stills';b.setAttribute('aria-pressed',String(stills));});
  }
  function open(id:string,trigger:HTMLElement):void{const d=$<HTMLDialogElement>(`#${id}`);if(!d||d.open)return;returnFocus.set(d,trigger);d.showModal();}
  function close(d:HTMLDialogElement,focus=true):void{d.close();if(focus){const target=returnFocus.get(d);if(target?.isConnected)target.focus({preventScroll:true});}}
  document.querySelectorAll<HTMLDialogElement>('dialog').forEach(d=>{
    d.addEventListener('cancel',()=>{requestAnimationFrame(()=>returnFocus.get(d)?.focus({preventScroll:true}));});
    d.addEventListener('click',event=>{if(event.target===d){const r=d.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close(d);}});
  });
  function select(group:string,value:string):void{
    const control=document.querySelector<HTMLElement>(`[data-control-group="${group}"]`);if(!control)return;
    control.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.value===value)));
    const chapter=control.closest<HTMLElement>('.chapter');if(chapter)chapter.dataset.mode=value;
    if(group==='hatching'){
      const n=Number(value);$('#hatching-diagram').innerHTML=hatchDiagram(n);
      $('#hatching-caption').textContent=['The ridged shell rests on the leaf; the body has not emerged.','A narrow opening changes the contour of the same shell.','A tiny pale larva is clear of the shell. The leaf remains its first landscape.'][n];
    }else if(group==='feeding'){
      const after=value==='after';$('#feeding-diagram').innerHTML=feedingDiagram(after);$('#feeding-caption').textContent=after?'A small crescent is missing exactly at the feeding point beside the head.':'An intact leaf edge sits directly beside the young larva.';
    }else if(group==='instar'){
      const n=Number(value);$('#instar-diagram').innerHTML=instarDiagram(n);
      $('#instar-name').textContent=n?`${instars[n-1].label} · ${instars[n-1].title}`:'Five distinct stages';
      $('#instar-caption').textContent=n?instars[n-1].description:'Pale first instars, emerging bands, longer filaments and more pronounced markings. Select a stage to look closer.';
      $('#instar-all-notes').hidden=n!==0;
    }else if(group==='pupation'){
      const skin=value==='skin';setPicture($<HTMLPictureElement>('#ch-07 .cinematic-art'),skin?'ai-11-j-hang':'ai-06-jade',alts[skin?5:6]);
      $('#pupation-caption').textContent=skin?'The hanging larva still wears the final larval skin. This is the stage before the pupa.':'An opaque green pupa, still attached to the same silk pad.';
    }else if(group==='inside'){
      const inside=value==='inside';$('#inside-exterior').hidden=inside;$('#inside-reconstruction').hidden=!inside;
      $('#inside-caption').textContent=inside?'Illustrative reconstruction. Simplified folded wing regions, not photographed tissue.':'The natural opaque exterior is the reference view.';
    }else if(group==='maturation'){
      const early=value==='early';setPicture($<HTMLPictureElement>('#ch-09 .cinematic-art'),early?'ai-06-jade':'ai-08-pattern',alts[early?6:8]);
      $('#maturation-caption').textContent=early?'The earlier green exterior holds its opaque jade appearance.':'Developing wing-scale pigmentation makes the pattern visible beneath the retained casing.';
    }else if(group==='emergence'){
      const n=Number(value);$('#emergence-diagram').innerHTML=emergenceDiagram(n);$('#emergence-name').textContent=emergenceStages[n].label;$('#emergence-caption').textContent=emergenceStages[n].description;
      setPicture($<HTMLPictureElement>('#ch-10 .cinematic-art'),n===0?'ai-07-emergence':'ai-15-unfolding',n===0?alts[9]:'An illustrated monarch hanging from the same spent chrysalis, with its wings expanded.');
    }
    controller.refresh();
  }
  function click(event:MouseEvent):void{
    const target=event.target instanceof Element?event.target.closest<HTMLElement>('button,a'):null;if(!target)return;
    if(target.dataset.dialog){open(target.dataset.dialog,target);return;}
    if(target.hasAttribute('data-close')){close(target.closest('dialog')!);return;}
    if(target.hasAttribute('data-chapter-link')){event.preventDefault();document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(d=>close(d,false));controller.navigate((target as HTMLAnchorElement).hash);return;}
    if(target.hasAttribute('data-source-chapter')){
      const c=chapters[Number(target.dataset.sourceChapter)];
      $('#chapter-sources-content').innerHTML=`<p>${e(c.title)}</p><p>${e(c.illustrationNote)}</p><p class="dialog-disclaimer">${e(c.notes)}</p><ol class="sources-list">${c.sources.map(id=>sources.find(s=>s.id===id)!).map(s=>`<li><a href="${e(s.url)}" target="_blank" rel="noopener noreferrer">${e(s.title)}</a><br>${e(s.scope)}</li>`).join('')}</ol>`;open('sources-dialog',target);return;
    }
    if(target.classList.contains('motion-button')){
      requestedReduced=!controller.reduced;syncMode();try{localStorage.setItem('chrysalis-motion',requestedReduced?'reduced':'full');}catch{}
      if(!requestedReduced&&controller.reduced)announce('Your device requests reduced motion. That preference remains respected.');return;
    }
    if(target.classList.contains('stills-button')){
      const current=document.documentElement.dataset.activeChapter??'ch-01';stills=!stills;syncMode();try{localStorage.setItem('chrysalis-view',stills?'stills':'immersive');}catch{}
      requestAnimationFrame(()=>{controller.refresh();controller.navigate(current,{updateHistory:false,focus:false,immediate:true});});return;
    }
    if(target.classList.contains('sound-button')){announce('Audio is unavailable in this version.');return;}
    if(target.dataset.select){select(target.dataset.select,target.dataset.value!);return;}
    if(target.id==='inside-reset'){select('inside','exterior');return;}
    if(target.id==='emergence-reset'){select('emergence','0');return;}
    if(target.id==='host-toggle'){
      const panel=$('#host-study');panel.hidden=!panel.hidden;target.setAttribute('aria-expanded',String(!panel.hidden));target.innerHTML=`${panel.hidden?'Show the host plant':'Hide the host outline'} <svg viewBox="0 0 28 20" aria-hidden="true"><path d="M1 10h24M18 3l7 7-7 7"/></svg>`;controller.refresh();return;
    }
    if(target.id==='flight-toggle'){
      departed=!departed;$('#ch-11').dataset.mode=departed?'departed':'resting';$('#flight-butterfly').classList.toggle('departed',departed);
      target.setAttribute('aria-pressed',String(departed));target.innerHTML=`${departed?'Return the butterfly':'Watch the first flight'} <svg viewBox="0 0 28 20" aria-hidden="true"><path d="M1 10h24M18 3l7 7-7 7"/></svg>`;
      $('#flight-message').textContent=departed?'The butterfly leaves. The leaf remains.':'The wings are established. The leaf is still here.';
      if(target.dataset.stillFlight)setPicture($<HTMLPictureElement>('.finale-backdrop'),departed?'ai-13-meadow':'ai-12-adult',departed?'The original milkweed leaves remain after the butterfly departs.':alts[10]);
    }
  }
  function keys(event:KeyboardEvent):void{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    const target=event.target;if(!(target instanceof HTMLButtonElement)||!target.dataset.select)return;
    const buttons=[...target.closest('.segmented-control')!.querySelectorAll<HTMLButtonElement>('button')];const index=buttons.indexOf(target);
    const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
    event.preventDefault();buttons[next].focus();select(buttons[next].dataset.select!,buttons[next].dataset.value!);
  }
  document.addEventListener('click',click);document.addEventListener('keydown',keys);
  const query=matchMedia('(prefers-reduced-motion:reduce)');query.addEventListener('change',syncMode);syncMode();
  return()=>{document.removeEventListener('click',click);document.removeEventListener('keydown',keys);query.removeEventListener('change',syncMode);};
}
