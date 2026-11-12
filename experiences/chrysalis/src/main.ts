import './styles.css';
import './scenes.css';
import './study-refinements.css';
import { chapters } from './content.js';
import { evaluateTransition } from './transitions.ts';
import { softText } from '../../shared/soft-swap.ts';
import { applyReveal } from '../../shared/soft-reveal.ts';
import { createScrollController } from './scroll-controller.ts';
import type { StorySnapshot } from './story.ts';
import { renderChapter, renderTransition, renderDialogs, renderFooter, beats } from './ui.ts';
import { initializeImages } from './image-loader.ts';
import { initializeInteractions } from './interactions.ts';

const root=document.documentElement;
const story=document.querySelector<HTMLElement>('#story')!;
document.querySelector('#hero-observations')!.innerHTML=beats(0)+'<div class="hero-source"><button class="quiet-button source-link" data-source-chapter="0">Sources &amp; illustration notes</button></div>';
story.insertAdjacentHTML('beforeend',chapters.slice(1).map((_,i)=>renderTransition(i)+renderChapter(i+1)).join(''));
document.querySelector('#dialogs')!.innerHTML=renderDialogs();
story.insertAdjacentHTML('afterend',renderFooter());
document.body.insertAdjacentHTML('beforeend',`<nav class="chapter-nav-rail" aria-label="Chapter progress">${chapters.map(c=>`<a href="#${c.id}" aria-label="${c.number}. ${c.title}" ${c.number===1?'aria-current="step"':''}></a>`).join('')}</nav>`);

const header=document.querySelector<HTMLElement>('.site-header')!;
const frames=[...document.querySelectorAll<HTMLElement>('.transition-wrap')].map(wrapper=>({
  wrapper,index:Number(wrapper.dataset.transition),marker:wrapper.querySelector<HTMLElement>('.chapter-transition')!,
  source:wrapper.querySelector<HTMLElement>('.transition-source .transition-inner')!,
  sourceMask:wrapper.querySelector<HTMLElement>('.transition-source')!,
  target:wrapper.querySelector<HTMLElement>('.transition-target .transition-inner')!,
  targetMask:wrapper.querySelector<HTMLElement>('.transition-target')!,
  stage:wrapper.querySelector<HTMLElement>('.transition-stage')!,
  register:wrapper.querySelector<HTMLElement>('.transition-register')!,
  lastProgress:NaN,lastReduced:false,lastStage:-1,lastLabel:'',lastMobile:null as boolean|null,
}));

function render(snapshot:StorySnapshot):void{
  header.classList.toggle('is-scrolled',snapshot.scrollY>80);
  // Read all layout first, then derive every visual from one actual scroll snapshot.
  const positions=frames.map(frame=>{const box=frame.marker.getBoundingClientRect();return {top:box.top+snapshot.scrollY,height:Math.max(box.height,1)};});
  frames.forEach((frame,i)=>{
    const box=positions[i];const p=Math.max(0,Math.min(1,(snapshot.probeY-box.top)/box.height));
    frame.wrapper.classList.toggle('is-active',p>0&&p<1&&!snapshot.reducedMotion);
    if(Math.abs(p-frame.lastProgress)<0.00001&&frame.lastReduced===snapshot.reducedMotion&&frame.lastMobile===snapshot.mobile)return;
    const motionChanged=frame.lastReduced!==snapshot.reducedMotion;
    const t=evaluateTransition(frame.index,p,snapshot.reducedMotion,snapshot.mobile);frame.lastProgress=p;frame.lastReduced=snapshot.reducedMotion;
    if(frame.lastMobile!==snapshot.mobile){
      frame.lastMobile=snapshot.mobile;
      frame.source.style.transformOrigin=frame.target.style.transformOrigin=`${t.anchor.x}% ${t.anchor.y}%`;
      const x=t.anchor.x*10,y=t.anchor.y*7;
      frame.register.querySelector('path')?.setAttribute('d',`M ${x} ${y} C 580 490, 420 470, 160 560`);
      frame.register.querySelector('circle')?.setAttribute('cx',String(x));frame.register.querySelector('circle')?.setAttribute('cy',String(y));
    }
    // Stationary clip, independently framed inner plate; 8% overscan prevents exposed edges.
    frame.source.style.transform=`translate(${t.srcX}%,${t.srcY}%) scale(${t.srcScale})`;
    frame.target.style.transform=`translate(${t.dstX}%,${t.dstY}%) scale(${t.dstScale})`;
    if(t.presentation==='paired-study'){
      // Both poses stay in the two-up layout while scrolling (the single-column layout would stack them and push one out of the frame); only reduced motion switches layouts.
      frame.wrapper.dataset.poseMode=snapshot.reducedMotion?t.poseMode!:'comparison';
      if(snapshot.reducedMotion){
        frame.sourceMask.hidden=!t.sourceVisible;frame.targetMask.hidden=!t.targetVisible;
        for(const layer of [frame.sourceMask,frame.targetMask]){layer.style.opacity='';layer.style.transform='';}
      }else{
        // Both poses stay in layout; they cross-fade and slide apart instead of switching on and off.
        frame.sourceMask.hidden=false;frame.targetMask.hidden=false;
        const row=Math.abs(frame.sourceMask.offsetTop-frame.targetMask.offsetTop)<4;
        const shift=row?(1-t.pairBlend.spread)*50:0;
        frame.sourceMask.style.opacity=String(t.pairBlend.sourceOpacity);
        frame.targetMask.style.opacity=String(t.pairBlend.targetOpacity);
        frame.sourceMask.style.transform=shift?`translateX(calc(${shift}% + ${shift*.14}px))`:'';
        frame.targetMask.style.transform=shift?`translateX(calc(${-shift}% - ${shift*.14}px))`:'';
      }
      // Complete supported poses occupy separate frames; never cut one anatomy
      // against another with a reveal mask or transparency.
      applyReveal(frame.targetMask,'none');
    }else{
      applyReveal(frame.targetMask,t.clip);
      frame.sourceMask.style.opacity='';frame.targetMask.style.opacity='';frame.sourceMask.style.transform='';frame.targetMask.style.transform='';
    }
    frame.wrapper.style.setProperty('--transition-progress',String(p));
    frame.wrapper.dataset.progress=p.toFixed(5);
    frame.wrapper.dataset.owner=t.captionOwner;
    frame.wrapper.dataset.stage=String(t.stage);
    frame.register.style.opacity=String(snapshot.reducedMotion||t.presentation==='paired-study'?0:Math.sin(p*Math.PI)*.75);
    if(frame.lastLabel!==t.stageLabel||motionChanged){softText(frame.stage,t.stageLabel,{instant:snapshot.reducedMotion});frame.lastLabel=t.stageLabel;frame.lastStage=t.stageIndex;}
  });
}

const disposeImages=initializeImages();
const controller=createScrollController({
  onUpdate:render,
  onChapterChange(id){document.querySelectorAll<HTMLAnchorElement>('.chapter-nav-rail a').forEach(a=>{if(a.hash===`#${id}`)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});},
});
const disposeInteractions=initializeInteractions(controller);
document.fonts.ready.then(()=>controller.refresh());
root.dataset.ready='true';performance.mark('chrysalis-ready');
addEventListener('pagehide',(event:PageTransitionEvent)=>{if(!event.persisted){disposeImages();disposeInteractions();controller.destroy();}},{once:true});
if(import.meta.hot)import.meta.hot.dispose(()=>{disposeImages();disposeInteractions();controller.destroy();});
