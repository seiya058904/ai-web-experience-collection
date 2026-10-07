import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { CHAPTERS, sampleNarrative, chapterTarget, captionOpacity, clamp, type NarrativeState } from './narrative';
import { Exhibition, type ExhibitionControls, type ExhibitionReadout } from './scene/Exhibition';
import { applyLanguage, translate, specimenNames, type Language } from './i18n';

document.documentElement.classList.remove('no-js');
gsap.registerPlugin(ScrollTrigger);
// This fixed stage has one refresh owner. An additional delayed plugin resize
// refresh can restore a stale native scroll position after our anchored resize.
ScrollTrigger.config({autoRefreshEvents:'none'});
gsap.ticker.lagSmoothing(0);
const $=<T extends HTMLElement>(selector:string):T=>document.querySelector<T>(selector)!;
const body=document.body;
const canvas=$<HTMLCanvasElement>('#exhibition-canvas');
const dialog=$<HTMLDialogElement>('#chapter-index');
const panel=$<HTMLDivElement>('#inspect-panel');
const interaction=$<HTMLDivElement>('#gem-interaction');
const track=$<HTMLDivElement>('#scroll-track');
const loading=$<HTMLDivElement>('#loading-note');
const reduceQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
const navigationType=(performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined)?.type;
const restoringDocument=navigationType==='reload'||navigationType==='back_forward';
const scenes=Array.from(document.querySelectorAll<HTMLElement>('.scene-panel'));
const inputs=Array.from(document.querySelectorAll<HTMLInputElement>('input[type=range]'));
let language:Language='en';
try {language=localStorage.getItem('facet-language')==='zh'?'zh':'en';}catch{/* Optional preference storage. */}
let position=0;
let viewportWidth=window.innerWidth,viewportHeight=window.innerHeight;
let resizeAnchor:number|null=null;
let state: NarrativeState=sampleNarrative(0);
let readout:ExhibitionReadout={theme:0,cut:0,polish:1,blue:0,agate:0,labels:[],facetLabels:[]};
let artwork:Exhibition|null=null;
let activeIndex=-1;
let ambientTime=0;
let lastTime=0;
let lastRenderSignature='';
let refreshTimer:ReturnType<typeof setTimeout>|undefined;
let wasLight=false;
let lastOrganic=false;
let initialised=false;
let disposed=false;
let storedPosition=typeof history.state?.facetPosition==='number'?history.state.facetPosition:null;
let initialHash=location.hash;
let originalSelected:number|null=null;
const controls:ExhibitionControls={cut:null,polish:null,corundum:'auto',organic:'auto',translucency:.65,angle:48,blueOverride:null,agateOverride:null,selected:null,inspect:0,dragX:0,dragY:0,reduced:reduceQuery.matches,ambientPaused:false,pointerX:0,pointerY:0};
track.style.height=`calc(100svh + ${controls.reduced?840:1550}svh)`;
body.classList.toggle('is-reduced',controls.reduced);

const lenis=new Lenis({autoRaf:false,lerp:.105,smoothWheel:!controls.reduced,syncTouch:false,touchMultiplier:1,wheelMultiplier:.85,anchors:false,stopInertiaOnNavigate:true});
lenis.on('scroll',ScrollTrigger.update);
const trigger=ScrollTrigger.create({trigger:'#exhibition',start:'top top',end:()=>ScrollTrigger.maxScroll(window),invalidateOnRefresh:true,onUpdate:self=>{
 if(innerWidth!==viewportWidth||innerHeight!==viewportHeight){resizeAnchor??=position;return;}
 position=clamp(self.progress)*6.999;
}});

function rangeFill(input:HTMLInputElement):void{
 input.style.setProperty('--range-fill',`${(Number(input.value)-Number(input.min))/(Number(input.max)-Number(input.min))*100}%`);
}
inputs.forEach(rangeFill);
function navMarkup():void{
 const rail=$<HTMLElement>('.chapter-rail');
 const index=$<HTMLElement>('.index-chapters');
 rail.replaceChildren();index.replaceChildren();
 CHAPTERS.forEach((chapter,i)=>{
  const name=language==='zh'?chapter.zh:chapter.name;
  const link=document.createElement('a');link.href=`#${chapter.id}`;link.dataset.chapter=String(i);link.setAttribute('aria-label',`${String(i+1).padStart(2,'0')} — ${name}`);
  const caption=document.createElement('span');caption.className='rail-label';caption.textContent=name;link.append(caption);rail.append(link);
  const chapterLink=document.createElement('a');chapterLink.href=`#${chapter.id}`;chapterLink.dataset.chapter=String(i);
  const number=document.createElement('span');number.className='index-number';number.textContent=String(i+1).padStart(2,'0');
  const title=document.createElement('span');title.className='index-name';title.textContent=name;
  const subtitle=document.createElement('span');subtitle.className='index-subtitle';subtitle.textContent=language==='zh'?chapter.name:['An arrival','A structure','A transformation','An interior','A sensation','An unfolding','A collection'][i];
  chapterLink.append(number,title,subtitle);index.append(chapterLink);
 });
}
function setLanguage(next:Language):void{
 language=next;applyLanguage(language);navMarkup();
 updateMotionLabel();updateInspectionCopy();
 try{localStorage.setItem('facet-language',language);}catch{/* Browsing without storage is supported. */}
 if(artwork===null&&initialised)loading.textContent=translate(language,'still');
 lastOrganic=!Boolean(readout.agate>=.5);activeIndex=-1;
}
function updateMotionLabel():void{
 const paused=controls.ambientPaused||controls.reduced;
 const button=$<HTMLButtonElement>('#motion-toggle');
 button.textContent=translate(language,paused?'resumeMotion':'pauseMotion');button.setAttribute('aria-pressed',String(paused));
}
function updateInspectionCopy():void{
 if(controls.selected===null)return;
 const name=specimenNames[controls.selected];
 $('#inspect-title').textContent=translate(language,name);
 $('#inspect-description').textContent=translate(language,`inspect.${name}`);
}
setLanguage(language);

function closeIndex():void{
 if(!dialog.open)return;
 dialog.close();
 // Resume before a navigation tween starts. The native close event is queued;
 // starting Lenis there alone would reset and cancel the new scroll tween.
 lenis.start();
}
function goPosition(next:number,immediate=false,historyMode:'push'|'replace'|'none'='push'):void{
 if(resizeAnchor!==null){clearTimeout(refreshTimer);refresh();}
 if(controls.selected!==null)closeInspection(true,false);
 closeIndex();
 next=clamp(next,0,6.999);
 const chapter=CHAPTERS[Math.min(6,Math.floor(next))];
 if(historyMode==='push')history.replaceState({facetPosition:position},'',`#${CHAPTERS[Math.min(6,Math.floor(position))].id}`);
 if(historyMode!=='none')history[historyMode==='push'?'pushState':'replaceState']({facetPosition:next},'',`#${chapter.id}`);
 lenis.scrollTo((next/6.999)*ScrollTrigger.maxScroll(window),{
  duration:controls.reduced?0:1.1,immediate:immediate||controls.reduced,force:true,
  onComplete:()=>{if(Math.abs(position-next)<.05)history.replaceState({facetPosition:next},'',`#${chapter.id}`);},
 });
 if(immediate||controls.reduced){ScrollTrigger.update();position=next;}
}
function goChapter(index:number,immediate=false):void{goPosition(chapterTarget(index),immediate);}

// Delegation covers both the visible links and freshly translated index links.
document.addEventListener('click',event=>{
 const link=(event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
 if(!link)return;
 const id=link.getAttribute('href')!.slice(1);
 const index=CHAPTERS.findIndex(chapter=>chapter.id===id);
 if(index<0)return;
 event.preventDefault();
 if(link.classList.contains('skip-link')){
  goChapter(index,true);syncDOM();$('#light').focus({preventScroll:true});
 }else goChapter(index);
});
$('#previous-chapter').addEventListener('click',()=>goChapter(Math.max(0,state.index-1)));
$('#next-chapter').addEventListener('click',()=>goChapter(Math.min(6,state.index+1)));
$('#lang-en').addEventListener('click',()=>setLanguage('en'));
$('#lang-zh').addEventListener('click',()=>setLanguage('zh'));
$('#index-toggle').addEventListener('click',()=>{
 dialog.showModal();dialog.dataset.lenisPrevent='';lenis.stop();$('#close-index').focus({preventScroll:true});
});
$('#close-index').addEventListener('click',closeIndex);
dialog.addEventListener('close',()=>{lenis.start();$('#index-toggle').focus({preventScroll:true});});
dialog.addEventListener('click',event=>{
 if(event.target!==dialog)return;
 const rect=dialog.getBoundingClientRect();
 if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeIndex();
});
$('#motion-toggle').addEventListener('click',()=>{
 if(controls.reduced){controls.reduced=false;controls.ambientPaused=false;body.classList.remove('is-reduced');lenis.options.smoothWheel=true;}
 else controls.ambientPaused=!controls.ambientPaused;
 updateMotionLabel();
});

$('#cut-range').addEventListener('input',event=>{const input=event.target as HTMLInputElement;controls.cut=Number(input.value)/100;rangeFill(input);});
$('#polish-range').addEventListener('input',event=>{const input=event.target as HTMLInputElement;controls.polish=Number(input.value)/100;rangeFill(input);});
$('#translucency-range').addEventListener('input',event=>{const input=event.target as HTMLInputElement;controls.translucency=Number(input.value)/100;rangeFill(input);});
$('#angle-range').addEventListener('input',event=>{const input=event.target as HTMLInputElement;controls.angle=Number(input.value);rangeFill(input);$('#angle-value').textContent=`${controls.angle}°`;});
document.querySelectorAll<HTMLButtonElement>('[data-reset]').forEach(button=>button.addEventListener('click',()=>{
 if(button.dataset.reset==='cut')controls.cut=null;else controls.polish=null;
}));
document.querySelectorAll<HTMLButtonElement>('[data-corundum]').forEach(button=>button.addEventListener('click',()=>{
 controls.blueOverride=readout.blue;controls.corundum=button.dataset.corundum as 'ruby'|'sapphire';
 gsap.to(controls,{blueOverride:controls.corundum==='sapphire'?1:0,duration:controls.reduced?0:.8,ease:'power2.inOut',overwrite:'auto'});
}));
document.querySelectorAll<HTMLButtonElement>('[data-organic]').forEach(button=>button.addEventListener('click',()=>{
 controls.agateOverride=readout.agate;controls.organic=button.dataset.organic as 'jade'|'agate';
 gsap.to(controls,{agateOverride:controls.organic==='agate'?1:0,duration:controls.reduced?0:.9,ease:'power2.inOut',overwrite:'auto'});
}));

function inspectSpecimen(index:number):void{
 controls.selected=index;originalSelected=index;controls.inspect=0;controls.dragX=0;controls.dragY=0;
 body.classList.add('is-inspecting');panel.hidden=false;$('#specimen-labels').inert=true;$('.exhibit-invitation').inert=true;
 updateInspectionCopy();$('#close-inspect').focus({preventScroll:true});
 gsap.to(controls,{inspect:1,duration:controls.reduced?0:1.1,ease:'power3.inOut',overwrite:'auto'});
}
function closeInspection(immediate=false,restoreFocus=true):void{
 if(controls.selected===null)return;
 gsap.killTweensOf(controls,'inspect');
 const finish=()=>{
  controls.selected=null;controls.inspect=0;controls.dragX=0;controls.dragY=0;
  panel.hidden=true;body.classList.remove('is-inspecting');$('#specimen-labels').inert=false;$('.exhibit-invitation').inert=false;
  if(restoreFocus&&originalSelected!==null)document.querySelector<HTMLButtonElement>(`[data-specimen="${originalSelected}"]`)?.focus({preventScroll:true});
 };
 if(immediate||controls.reduced)finish();
 else gsap.to(controls,{inspect:0,duration:.85,ease:'power3.inOut',onComplete:finish});
}
document.querySelectorAll<HTMLButtonElement>('[data-specimen]').forEach(button=>button.addEventListener('click',()=>inspectSpecimen(Number(button.dataset.specimen))));
canvas.addEventListener('click',event=>{
 if(state.index!==6||controls.selected!==null)return;
 const selected=artwork?.pickSpecimen(event.clientX,event.clientY);
 if(selected!==undefined&&selected!==null)inspectSpecimen(selected);
});
let lastPick=0;
canvas.addEventListener('pointermove',event=>{
 if(state.index!==6||controls.selected!==null||event.pointerType==='touch')return;
 if(event.timeStamp-lastPick<70)return;lastPick=event.timeStamp;
 canvas.style.cursor=(artwork?.pickSpecimen(event.clientX,event.clientY)??null)!==null?'pointer':'default';
});
$('#close-inspect').addEventListener('click',()=>closeInspection());
$('#reset-view').addEventListener('click',()=>gsap.to(controls,{dragX:0,dragY:0,duration:controls.reduced?0:.7,ease:'power2.out'}));
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&controls.selected!==null&&!dialog.open){closeInspection();return;}
});

let pointerActive=false,previousX=0,previousY=0;
interaction.addEventListener('pointerdown',event=>{
 if(event.button!==0)return;
 pointerActive=true;previousX=event.clientX;previousY=event.clientY;interaction.setPointerCapture(event.pointerId);
});
interaction.addEventListener('pointermove',event=>{
 if(!pointerActive)return;
 controls.dragX+=(event.clientX-previousX)*.006;
 if(event.pointerType==='mouse')controls.dragY=clamp(controls.dragY+(event.clientY-previousY)*.004,-.55,.55);
 previousX=event.clientX;previousY=event.clientY;
});
const endPointer=(event:PointerEvent)=>{pointerActive=false;if(interaction.hasPointerCapture(event.pointerId))interaction.releasePointerCapture(event.pointerId);};
interaction.addEventListener('pointerup',endPointer);interaction.addEventListener('pointercancel',endPointer);
interaction.addEventListener('keydown',event=>{
 if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();controls.dragX+=event.key==='ArrowLeft'?-.14:.14;}
 if(event.key==='Home'){event.preventDefault();controls.dragX=0;controls.dragY=0;}
});
window.addEventListener('pointermove',event=>{
 if(event.pointerType==='touch')return;
 controls.pointerX=(event.clientX/window.innerWidth-.5)*2;controls.pointerY=(event.clientY/window.innerHeight-.5)*2;
},{passive:true});

function refresh(preserve=true):void{
 if(disposed)return;
 const saved=resizeAnchor??position;
 const restore=preserve||resizeAnchor!==null;
 viewportWidth=innerWidth;viewportHeight=innerHeight;
 lastRenderSignature='';
 artwork?.resize();lenis.resize();ScrollTrigger.refresh();
 if(restore&&initialised)lenis.scrollTo(saved/6.999*ScrollTrigger.maxScroll(window),{immediate:true,force:true});
 resizeAnchor=null;
 ScrollTrigger.update();
}
window.addEventListener('resize',()=>{resizeAnchor??=position;clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>refresh(),100);},{passive:true});
reduceQuery.addEventListener('change',event=>{
 const saved=position;controls.reduced=event.matches;body.classList.toggle('is-reduced',controls.reduced);
 lenis.options.smoothWheel=!controls.reduced;
 track.style.height=`calc(100svh + ${controls.reduced?840:1550}svh)`;
 position=saved;updateMotionLabel();refresh();
});
window.addEventListener('popstate',event=>{
 const hashIndex=CHAPTERS.findIndex(chapter=>location.hash===`#${chapter.id}`);
 const next=typeof event.state?.facetPosition==='number'?event.state.facetPosition:chapterTarget(Math.max(0,hashIndex));
 goPosition(next,controls.reduced,'none');
});
window.addEventListener('pagehide',event=>{
 history.replaceState({facetPosition:position},'',location.href);
 gsap.ticker.remove(tick);clearTimeout(refreshTimer);
 if(!event.persisted)dispose();
});
window.addEventListener('pageshow',event=>{if(event.persisted&&!disposed){lastTime=0;gsap.ticker.add(tick);refresh(false);}});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){gsap.ticker.remove(tick);clearTimeout(refreshTimer);}
 else if(!disposed){lastTime=0;gsap.ticker.add(tick);refresh(false);}
});

function syncDOM():void{
 state=sampleNarrative(position);
 body.dataset.position=position.toFixed(4);
 body.dataset.phase=state.phase;
 scenes.forEach((scene,index)=>{
  const opacity=captionOpacity(position,index);
  scene.style.opacity=opacity.toFixed(4);
  scene.style.visibility=opacity>.001?'visible':'hidden';
  const active=index===state.index;
  if(scene.inert===active)scene.inert=!active;
  scene.setAttribute('aria-hidden',String(!active));
 });
 if(activeIndex!==state.index){
  activeIndex=state.index;body.dataset.scene=String(activeIndex);
  $('#current-chapter').textContent=String(activeIndex+1).padStart(2,'0');
  $('#scene-announcement').textContent=`${String(activeIndex+1).padStart(2,'0')} — ${language==='zh'?CHAPTERS[activeIndex].zh:CHAPTERS[activeIndex].name}`;
  $<HTMLButtonElement>('#previous-chapter').disabled=activeIndex===0;
  $<HTMLButtonElement>('#next-chapter').disabled=activeIndex===6;
  if(controls.selected!==null&&activeIndex!==6)closeInspection(true,false);
  if(initialised&&!dialog.open)history.replaceState({facetPosition:position},'',`#${CHAPTERS[activeIndex].id}`);
  document.querySelectorAll<HTMLAnchorElement>('[data-chapter]').forEach(link=>{
   if(Number(link.dataset.chapter)===activeIndex)link.setAttribute('aria-current','step');else link.removeAttribute('aria-current');
  });
 }
 document.querySelectorAll<HTMLElement>('.chapter-rail a').forEach((link,index)=>link.style.setProperty('--fill',String(clamp(position-index))));
 const isLight=readout.theme>.53;
 if(isLight!==wasLight){wasLight=isLight;body.classList.toggle('is-light',isLight);}
 if(controls.cut===null){const input=$<HTMLInputElement>('#cut-range');input.value=String(Math.round(readout.cut*100));rangeFill(input);}
 if(controls.polish===null){const input=$<HTMLInputElement>('#polish-range');input.value=String(Math.round(readout.polish*100));rangeFill(input);}
 document.querySelectorAll<HTMLButtonElement>('[data-corundum]').forEach(button=>button.setAttribute('aria-pressed',String((readout.blue>=.5)===(button.dataset.corundum==='sapphire'))));
 document.querySelectorAll<HTMLButtonElement>('[data-organic]').forEach(button=>button.setAttribute('aria-pressed',String((readout.agate>=.5)===(button.dataset.organic==='agate'))));
 const organicActive=readout.agate>=.5;
 if(organicActive!==lastOrganic){lastOrganic=organicActive;$('#color-description').textContent=translate(language,organicActive?'color.agate':'color.body');}
 const labels=Array.from(document.querySelectorAll<HTMLElement>('.specimen-label'));
 readout.labels.forEach((point,index)=>{labels[index].style.left=`${point.x}px`;labels[index].style.top=`${point.y}px`;});
 ['#label-crown','#label-girdle','#label-pavilion'].forEach((id,index)=>{
  const point=readout.facetLabels[index];if(!point)return;
  $(id).style.left=`${point.x}px`;$(id).style.top=`${point.y}px`;
 });
 if(!artwork){
  const width=window.innerWidth;
  labels.forEach((label,index)=>{
   label.style.left=`${width*(width<=700?(.18+(index%3)*.32):(.10+index*.16))}px`;
   label.style.top=width<=700?`${62+Math.floor(index/3)*7}%`:'68%';
  });
 }
}

function tick(time:number):void{
 if(disposed||document.hidden)return;
 lenis.raf(time*1000);
 const delta=lastTime?Math.min(.08,time-lastTime):0;lastTime=time;
 if(document.hidden)return;
 if(!controls.ambientPaused&&!controls.reduced)ambientTime+=delta;
 // The scroll state is read directly after Lenis; no secondary chase tween.
 state=sampleNarrative(position);
 if(artwork){
  const signature=[position,controls.cut,controls.polish,controls.translucency,controls.angle,controls.blueOverride,controls.agateOverride,controls.selected,controls.inspect,controls.dragX,controls.dragY,controls.pointerX,innerWidth,innerHeight].join(':');
  try{
   if((!controls.ambientPaused&&!controls.reduced)||signature!==lastRenderSignature){
    readout=artwork.render(state,controls,ambientTime);lastRenderSignature=signature;
   }
  }
  catch(error){console.error('FACET rendering failed:',error);enableFallback();}
 }
 syncDOM();
}
function enableFallback():void{
 body.classList.remove('has-webgl');body.classList.add('gpu-fallback');
 artwork?.dispose();artwork=null;loading.textContent=translate(language,'still');loading.classList.remove('is-hidden');
}
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();enableFallback();});
canvas.addEventListener('webglcontextrestored',()=>{
 try{artwork=new Exhibition(canvas);lastRenderSignature='';body.classList.remove('gpu-fallback');body.classList.add('has-webgl');loading.classList.add('is-hidden');}catch{enableFallback();}
});

try{
 artwork=new Exhibition(canvas);
 readout=artwork.render(state,controls,0);
 body.classList.add('has-webgl');loading.classList.add('is-hidden');
}catch(error){console.warn('FACET is using its still-art fallback.',error);enableFallback();}
gsap.ticker.add(tick);
Promise.allSettled([document.fonts.ready]).then(()=>{
 if(disposed)return;
 refresh(false);
 const hashIndex=CHAPTERS.findIndex(chapter=>initialHash===`#${chapter.id}`);
 // On reload/document Back the browser restores the latest native stop. The
 // saved history target can still be the earlier chapter navigation point.
 if(!restoringDocument){
  if(storedPosition!==null)goPosition(storedPosition,true,'none');
  else if(hashIndex>0)goPosition(chapterTarget(hashIndex),true,'none');
 }
 initialised=true;activeIndex=-1;
});

if(import.meta.env.DEV){
 Object.defineProperty(window,'__FACET__',{value:{get state(){return {...state};},get controls(){return Object.fromEntries(Object.entries(controls).filter(([key])=>!key.startsWith('_')));},get diagnostics(){return artwork?.diagnostics??{webgl:false};}},configurable:true});
}
function dispose():void{
 if(disposed)return;disposed=true;
 clearTimeout(refreshTimer);gsap.ticker.remove(tick);gsap.killTweensOf(controls);
 trigger.kill();lenis.destroy();artwork?.dispose();artwork=null;
}
if(import.meta.hot){import.meta.hot.dispose(dispose);}
