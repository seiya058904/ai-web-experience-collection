import 'lenis/dist/lenis.css';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DEFAULT_HEIGHT, DEFAULT_SHEAR, clamp, contourSegments, sampleSlice, cloudCenter, rainCenter, sectionPoint, sectionFlow, flowPoint, smoothstep, updraftExists } from './field';
import { CHAPTERS, STOPS, evaluateStory, type Story } from './story';
import { WeatherRenderer } from './weather';
import { WindAudio } from './audio';
import { DESKTOP_POSTER, MOBILE_POSTER } from './posters';

const $ = <T extends Element = HTMLElement>(selector:string) => document.querySelector<T>(selector)!;
const $$ = <T extends Element = HTMLElement>(selector:string) => Array.from(document.querySelectorAll<T>(selector));
const root=document.documentElement;
const abort=new AbortController();const eventOptions={signal:abort.signal};
const media=matchMedia('(prefers-reduced-motion: reduce)');
const nativeTouch=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
let viewportWidth=innerWidth,viewportHeight=innerHeight;
const state={p:0,u:DEFAULT_SHEAR,h:DEFAULT_HEIGHT,clock:0,paused:media.matches,reduced:media.matches,comparison:DEFAULT_SHEAR};
try{const saved=JSON.parse(sessionStorage.getItem('supercell-observation')||'{}');if(Number.isFinite(saved.u))state.u=clamp(saved.u);if(Number.isFinite(saved.h))state.h=clamp(saved.h);}catch{/* Storage can be unavailable in privacy mode. */}
const persist=()=>{try{sessionStorage.setItem('supercell-observation',JSON.stringify({u:state.u,h:state.h}));}catch{/* Controls remain usable. */}};
const inlinePoster=$('#inline-poster');
const setPoster=()=>{inlinePoster.style.backgroundImage=`url("${innerWidth<=700?MOBILE_POSTER:DESKTOP_POSTER}")`;};setPoster();

gsap.registerPlugin(ScrollTrigger);
const lenis=new Lenis({autoRaf:false,lerp:.12,smoothWheel:!media.matches,syncTouch:false,anchors:false,prevent:node=>!!node.closest('[data-lenis-prevent]')});
lenis.on('scroll',ScrollTrigger.update);
gsap.ticker.lagSmoothing(0);
const trigger=ScrollTrigger.create({trigger:'#journey',start:'top top',end:'bottom bottom',invalidateOnRefresh:true,onUpdate:self=>{if(innerWidth===viewportWidth&&innerHeight===viewportHeight)state.p=clamp(self.progress);}});
const weather=new WeatherRenderer($('#weather-canvas'),$('#fallback-canvas'),mode=>{root.dataset.renderer=mode;$('#render-mode').textContent=mode;});
const sound=new WindAudio();
const chapters=$$('.chapter');const section=$('#section-controls');const heightInput=$<HTMLInputElement>('#slice-height');const shearInput=$<HTMLInputElement>('#wind-shear');
let contoursDirty=true,layoutDirty=true,lastActive=-1,lastHeight=-1,lastShear=-1,lastTime=0,revealTime=0,disposed=false,lastAppliedP=-1;
let sectionRect={left:0,top:0,width:0,height:0};
let copyRect={left:0,top:0,width:0,height:0,right:0,bottom:0};
let returnFocus:HTMLElement|null=null;
let pendingFocus:number|null=null;
const navLinks=$$<HTMLAnchorElement>('[data-chapter]');
const pathMain=$<SVGPathElement>('#flow-main');const pathUnder=$<SVGPathElement>('#flow-under');
const diagram=$<SVGSVGElement>('#air-diagram');

function updateInputs(){
 heightInput.value=String(Math.round(state.h*100));shearInput.value=String(Math.round(state.u*100));
 heightInput.style.setProperty('--value',`${state.h*100}%`);shearInput.style.setProperty('--value',`${state.u*100}%`);
 $('#height-output').textContent=`${Math.round(state.h*100)}%`;
 $('#section-caption-value').textContent=`h / ${Math.round(state.h*100)}%`;
 const shearName=state.u<.34?'Gentler':state.u>.66?'More pronounced':'Reference';
 $('#shear-output').textContent=shearName;
 heightInput.setAttribute('aria-valuetext',`${Math.round(state.h*100)} percent of model height`);
 shearInput.setAttribute('aria-valuetext',`${Math.round(state.u*100)} percent model shear, ${shearName.toLowerCase()}`);
 $('#section-title').textContent=`Illustrated density and local airflow direction at ${Math.round(state.h*100)} percent model height, ${Math.round(state.u*100)} percent shear`;
 $('#reference-shear').classList.toggle('selected',Math.abs(state.u-.5)<.015);$('#change-shear').classList.toggle('selected',state.u>.8);
 root.dataset.height=state.h.toFixed(2);root.dataset.shear=state.u.toFixed(2);
 contoursDirty=true;layoutDirty=true;persist();
}
function announce(message:string){$('#live-status').textContent=message;}
function setHeight(h:number){state.h=clamp(h);updateInputs();announce(`Section at ${Math.round(state.h*100)} percent model height. ${updraftExists(state.h)?'Updraft intersects this plane.':'This plane misses the main updraft.'}`);}
function setShear(u:number){state.u=clamp(u);updateInputs();announce(`Model shear ${Math.round(state.u*100)} percent. Cloud tilt and precipitation position updated.`);}
heightInput.addEventListener('input',()=>setHeight(Number(heightInput.value)/100),eventOptions);
shearInput.addEventListener('input',()=>setShear(Number(shearInput.value)/100),eventOptions);
$('#lower-slice').addEventListener('click',()=>setHeight(state.h-.05),eventOptions);$('#raise-slice').addEventListener('click',()=>setHeight(state.h+.05),eventOptions);
$('#find-updraft').addEventListener('click',()=>setHeight(DEFAULT_HEIGHT),eventOptions);
$('#reference-shear').addEventListener('click',()=>{if(Math.abs(state.u-.5)>.001)state.comparison=state.u;setShear(.5);},eventOptions);
$('#change-shear').addEventListener('click',()=>{if(Math.abs(state.u-.9)>.001)state.comparison=state.u;setShear(.9);},eventOptions);
$('#return-shear').addEventListener('click',()=>{const previous=state.u;setShear(state.comparison);state.comparison=previous;},eventOptions);
for(const button of $$('.reset-storm'))button.addEventListener('click',()=>{state.u=DEFAULT_SHEAR;state.h=DEFAULT_HEIGHT;state.comparison=DEFAULT_SHEAR;updateInputs();announce('Storm reset. Your place in the observation is unchanged.');},eventOptions);

function closeDialogs(restoreFocus=true){for(const dialog of $$<HTMLDialogElement>('dialog'))if(dialog.open)dialog.close();lenis.start();if(restoreFocus)returnFocus?.focus({preventScroll:true});}
function showDialog(dialog:HTMLDialogElement){
 const focused=document.activeElement as HTMLElement;closeDialogs(false);returnFocus=focused.closest('dialog')?$<HTMLElement>('#index-toggle'):focused;lenis.stop();dialog.showModal();dialog.querySelector<HTMLElement>('.close-dialog')?.focus({preventScroll:true});
}
$('#index-toggle').addEventListener('click',()=>showDialog($('#index-dialog')),eventOptions);
for(const button of $$('.open-sources'))button.addEventListener('click',()=>showDialog($('#sources-dialog')),eventOptions);
for(const button of $$('.close-dialog'))button.addEventListener('click',()=>closeDialogs(),eventOptions);
for(const dialog of $$<HTMLDialogElement>('dialog')){
 dialog.addEventListener('cancel',()=>{lenis.start();returnFocus?.focus({preventScroll:true});},eventOptions);
 dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeDialogs();}},eventOptions);
}
function jump(index:number,initial=false){
 const i=Math.max(0,Math.min(4,index));closeDialogs(false);const max=$('#journey').offsetHeight-innerHeight;
 // Native touch inertia and a second smooth scroll must not compete after a tap.
 lenis.scrollTo(max*STOPS[i],{immediate:initial||state.reduced||nativeTouch,duration:1.15,onComplete:()=>{if(!initial)pendingFocus=i;}});
 if(!initial)history.replaceState(history.state,'',`#${CHAPTERS[i][0]}`);
}
for(const link of navLinks)link.addEventListener('click',event=>{event.preventDefault();jump(Number(link.dataset.chapter));},eventOptions);
for(const heading of $$('h1,h2'))heading.setAttribute('tabindex','-1');

function updateMotionButton(){const button=$('#motion-toggle');button.textContent=state.paused?'Resume motion':'Pause motion';button.setAttribute('aria-pressed',String(state.paused));root.dataset.motion=state.paused?'paused':'running';}
$('#motion-toggle').addEventListener('click',()=>{state.paused=!state.paused;updateMotionButton();},eventOptions);
media.addEventListener('change',event=>{state.reduced=event.matches;state.paused=event.matches;lenis.options.smoothWheel=!event.matches;updateMotionButton();layoutDirty=true;},eventOptions);
$('#sound-toggle').addEventListener('click',async()=>{try{const enabled=await sound.toggle();$('#sound-toggle').setAttribute('aria-pressed',String(enabled));$('#sound-toggle span').textContent=enabled?'Sound on':'Sound off';announce(enabled?'Quiet wind sound enabled.':'Sound off.');}catch{announce('Audio is unavailable. The full observation remains accessible.');}},eventOptions);
updateInputs();updateMotionButton();

function updateContours(){
 const contours=contourSegments(state.h,state.u,96,56);
 const markup=contours.map(c=>`<path d="${c.path}" opacity="${.25+c.level*.82}"/>`).join('');
 $('#section-contours').innerHTML=markup;$('#plane-contours').innerHTML=markup;$('#travel-plane').innerHTML=markup;
 const core=sectionPoint(cloudCenter(state.h,state.u));const rain=sectionPoint(rainCenter(state.h,state.u));
 const grid=sampleSlice(state.h,state.u,160,88);const raster=document.createElement('canvas');raster.width=grid.columns;raster.height=grid.rows;const ctx=raster.getContext('2d')!;const pixels=ctx.createImageData(grid.columns,grid.rows);
 for(let row=0;row<grid.rows;row++)for(let col=0;col<grid.columns;col++){
   const i=row*grid.columns+col;const x=col/(grid.columns-1)*400,z=row/(grid.rows-1)*220;
   const warm=Math.exp(-(((x-core.x)/43)**2+((z-core.y)/36)**2));const cool=Math.exp(-(((x-rain.x)/42)**2+((z-rain.y)/36)**2));
   pixels.data[i*4]=Math.round(197+warm*30-cool*57);pixels.data[i*4+1]=Math.round(202-warm*20-cool*29);pixels.data[i*4+2]=Math.round(201-warm*76-cool*10);pixels.data[i*4+3]=Math.round(grid.values[i]*150);
 }
 ctx.putImageData(pixels,0,0);$('#density-image').setAttribute('href',raster.toDataURL());
 $('#slice-updraft').setAttribute('cx',String(core.x));$('#slice-updraft').setAttribute('cy',String(core.y));
 $('#slice-rain').setAttribute('cx',String(rain.x));$('#slice-rain').setAttribute('cy',String(rain.y));
 $('#slice-updraft').setAttribute('opacity',updraftExists(state.h)?'1':'0');$('#slice-rain').setAttribute('opacity',state.h>.03&&state.h<.78?'1':'0');
 const flow=sectionFlow(state.h,state.u);const arrow=$<SVGPathElement>('#slice-flow');
 if(flow){const at=sectionPoint(flow);const length=Math.hypot(flow.dx*400,flow.dz*220);const dx=flow.dx*400/length,dz=flow.dz*220/length;const x=at.x+dx*16,y=at.y+dz*16;arrow.setAttribute('d',`M${at.x-dx*7},${at.y-dz*7}L${x},${y}M${x-dx*6-dz*3},${y-dz*6+dx*3}L${x},${y}L${x-dx*6+dz*3},${y-dz*6-dx*3}`);arrow.setAttribute('opacity','1');arrow.dataset.angle=String(Math.atan2(dz,dx));}else{arrow.setAttribute('d','');arrow.setAttribute('opacity','0');delete arrow.dataset.angle;}
 $('#empty-slice').hidden=updraftExists(state.h);
 $('#section-svg').setAttribute('data-height',state.h.toFixed(2));$('#section-svg').setAttribute('data-shear',state.u.toFixed(2));
 $('#section-svg').setAttribute('data-core-x',core.x.toFixed(4));
 $('#full-plane').setAttribute('data-height',state.h.toFixed(2));$('#full-plane').setAttribute('data-shear',state.u.toFixed(2));
 contoursDirty=false;layoutDirty=true;
}

function renderDiagram(story:Story){
 const flowGroup=$<SVGGElement>('#air-paths');flowGroup.style.opacity=String(story.flow);
 $('#flow-labels').style.opacity=String(story.flowLabels);$('#flow-labels').style.visibility=story.flowLabels>.01?'visible':'hidden';
 if(story.flow>.001){
   const points=Array.from({length:96},(_,i)=>{const v=flowPoint(i/95,state.u);return weather.project(v.x,v.h,v.z,story);});
   const d=points.map((v,i)=>`${i?'L':'M'}${v.x.toFixed(2)},${v.y.toFixed(2)}`).join('');pathMain.setAttribute('d',d);pathUnder.setAttribute('d',d);
   const t=clamp(.06+.77*smoothstep(.11,.35,story.p)+(state.paused?0:Math.sin(state.clock*.18)*.035));
   const parcel=flowPoint(t,state.u);const at=weather.project(parcel.x,parcel.h,parcel.z,story);
   for(const id of ['#parcel','#parcel-halo']){$(id).setAttribute('cx',String(at.x));$(id).setAttribute('cy',String(at.y));}
   const labels=[['#inflow-label',.17,16,-22],['#updraft-label',.49,17,-15],['#outflow-label',.88,-12,-25]] as const;
   for(const [id,t,x,y]of labels){const point=flowPoint(t,state.u);const at=weather.project(point.x,point.h,point.z,story);const element=$(id);let lx=clamp(at.x+x,20,innerWidth-element.offsetWidth-20),ly=clamp(at.y+y,112,innerHeight-105);if(lx<copyRect.right+10&&lx+element.offsetWidth>copyRect.left-10&&ly+18>copyRect.top-10&&ly<copyRect.bottom+10){ly=copyRect.top-27;lx=clamp(at.x,20,innerWidth-element.offsetWidth-20);}element.style.left=`${lx}px`;element.style.top=`${ly}px`;}
 }
 const fullPlane=$<SVGGElement>('#full-plane');fullPlane.style.opacity=String(story.plane);
 $('#travel-plane').style.opacity='0';
 if(story.plane>.001){
   const left=weather.project(0,state.h,-.5,story),right=weather.project(1,state.h,-.5,story),far=weather.project(0,state.h,.5,story);
   $('#plane-contours').setAttribute('transform',`matrix(${(right.x-left.x)/400} 0 0 ${(far.y-left.y)/220} ${left.x} ${left.y})`);
   const core=cloudCenter(state.h,state.u),at=weather.project(core.x,state.h,core.z,story);
   const from=weather.project(.30,state.h,0,story),to=weather.project(.94,state.h,0,story);
   $('#slice-line').setAttribute('d',`M${from.x},${from.y}L${to.x},${to.y}`);
   $('#plane-core').setAttribute('cx',String(at.x));$('#plane-core').setAttribute('cy',String(at.y));$('#plane-core').setAttribute('opacity',updraftExists(state.h)?'1':'0');
   const endX=sectionRect.left+sectionRect.width*.47,endY=sectionRect.top+sectionRect.height*.30;
   $('#plane-connector').setAttribute('d',`M${to.x},${to.y}L${endX},${endY}`);$('#plane-connector').setAttribute('opacity',String(story.detach*.6));
   fullPlane.setAttribute('data-core-screen-x',at.x.toFixed(4));
   // The detached sample physically returns to its matching observation plane.
   const returning=smoothstep(.84,.945,story.p);
   const entering=smoothstep(.395,.48,story.p);
   const travel=story.p>.8?returning:1-entering;
   if(travel>.001&&travel<.999){
     const box=sectionRect;const sectionScale=Math.min(box.width/400,box.height/220);
     const startX=box.left+(box.width-sectionScale*400)/2,startY=box.top+(box.height-sectionScale*220)/2;
     const a=sectionScale+((right.x-left.x)/400-sectionScale)*travel;
     const d=sectionScale+((far.y-left.y)/220-sectionScale)*travel;
     const x=startX+(left.x-startX)*travel,y=startY+(left.y-startY)*travel;
     $('#travel-plane').setAttribute('transform',`matrix(${a} 0 0 ${d} ${x} ${y})`);
     $('#travel-plane').style.opacity=String(story.plane*(1-smoothstep(.94,.96,story.p)));
   }
   $('#section-svg').style.opacity=story.p>.8?String(1-smoothstep(.84,.865,story.p)):String(entering);
 }
}

function applyStory(story:Story){
 root.dataset.progress=state.p.toFixed(5);root.dataset.chapter=String(story.active+1);root.style.setProperty('--interior',String(story.interior));
 chapters.forEach((element,i)=>{const w=story.weights[i];element.style.opacity=String(w);element.style.visibility=w>.001?'visible':'hidden';element.style.transform=`translateY(${(1-w)*15}px)`;element.inert=w<.7;element.setAttribute('aria-hidden',String(w<.01));});
 // Reading controls enter only after the outgoing copy has cleared its space.
 const panelOpacity=smoothstep(.415,.48,story.p)*(1-smoothstep(.84,.90,story.p));
 section.style.opacity=String(panelOpacity);section.style.visibility=panelOpacity>.001?'visible':'hidden';section.style.pointerEvents=panelOpacity>.8?'auto':'none';section.inert=panelOpacity<.8;section.setAttribute('aria-hidden',String(panelOpacity<.01));
 // Height detail gives up space continuously as the wind controls take over.
 const shearProgress=story.shear;const mobile=innerWidth<=700||innerHeight<=580;
 const shearBlock=$('#shear-block');shearBlock.style.gridTemplateRows=`${shearProgress}fr`;shearBlock.style.opacity=String(shearProgress);shearBlock.style.marginTop=`${shearProgress*(mobile?8:16)}px`;shearBlock.inert=shearProgress<.95;shearBlock.setAttribute('aria-hidden',String(shearProgress<.01));
 const detailHeight=innerHeight<=580?46:innerWidth>=2200?58:innerWidth<=700?53:49;
 const heightDetail=$('#height-detail');heightDetail.style.height=`${(1-shearProgress)*detailHeight}px`;heightDetail.style.opacity=String(1-shearProgress);heightDetail.inert=shearProgress>.05;heightDetail.setAttribute('aria-hidden',String(shearProgress>.99));
 if(story.p>.59&&story.p<.73||story.p>.83&&story.p<.95)layoutDirty=true;
 if(story.active!==lastActive){
   $('#chapter-counter').textContent=`0${story.active+1} / 05`;
   for(const link of $$('.chapter-dots a')){if(Number(link.dataset.chapter)===story.active)link.setAttribute('aria-current','step');else link.removeAttribute('aria-current');}
   lastActive=story.active;layoutDirty=true;
 }
 $('#progress-fill').style.width=`${state.p*100}%`;
  if(pendingFocus!==null&&story.weights[pendingFocus]>.99&&!chapters[pendingFocus].inert){chapters[pendingFocus].querySelector<HTMLElement>('h1,h2')?.focus({preventScroll:true});pendingFocus=null;}
}

function tick(seconds:number){
 if(disposed)return;lenis.raf(seconds*1000);
 if(document.hidden){lastTime=seconds;return;}
 const elapsed=lastTime?Math.max(0,seconds-lastTime):0;
 const delta=Math.min(.05,elapsed);lastTime=seconds;
 weather.observeFrame(elapsed);
 if(!state.paused)state.clock+=delta;
 revealTime=Math.min(1.3,revealTime+delta);
 const story=evaluateStory(state.p,state.reduced);
 const storyChanged=story.p!==lastAppliedP;
 const fieldChanged=contoursDirty||state.h!==lastHeight||state.u!==lastShear;
 if(storyChanged||layoutDirty||pendingFocus!==null){applyStory(story);lastAppliedP=story.p;}
 if(fieldChanged){updateContours();lastHeight=state.h;lastShear=state.u;}
 const layoutChanged=layoutDirty;
 if(layoutDirty){const rect=$('#section-svg').getBoundingClientRect();sectionRect={left:rect.left,top:rect.top,width:rect.width,height:rect.height};const copy=chapters[1].getBoundingClientRect();copyRect={left:copy.left,top:copy.top,width:copy.width,height:copy.height,right:copy.right,bottom:copy.bottom};const cut=$('#copy-cut');cut.setAttribute('x',String(copy.left-12));cut.setAttribute('y',String(copy.top-10));cut.setAttribute('width',String(copy.width+24));cut.setAttribute('height',String(copy.height+20));diagram.setAttribute('viewBox',`0 0 ${innerWidth} ${innerHeight}`);layoutDirty=false;}
 weather.render(story,state.u,state.h,state.clock,!state.paused,state.reduced?1:smoothstep(0,1.3,revealTime));
 if(storyChanged||fieldChanged||layoutChanged||(story.flow>.001&&!state.paused))renderDiagram(story);
 sound.update(false,story.finale);
}
gsap.ticker.add(tick);
let resizeTimer:ReturnType<typeof setTimeout>;
function refresh(retainProgress?:number){if(disposed)return;const retained=retainProgress??(innerWidth!==viewportWidth||innerHeight!==viewportHeight?state.p:undefined);viewportWidth=innerWidth;viewportHeight=innerHeight;setPoster();weather.resize();lenis.resize();ScrollTrigger.refresh();if(retained!==undefined){lenis.scrollTo(($('#journey').offsetHeight-innerHeight)*retained,{immediate:true});ScrollTrigger.update();}state.p=trigger.progress;layoutDirty=true;}
window.addEventListener('resize',()=>{const retained=state.p;clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>refresh(retained),120);},eventOptions);
document.fonts.ready.then(()=>refresh());
document.addEventListener('visibilitychange',()=>{lastTime=0;sound.update(document.hidden,evaluateStory(state.p).finale);if(!document.hidden)refresh();},eventOptions);
window.addEventListener('pageshow',event=>{if(event.persisted){lastTime=0;refresh();}},eventOptions);
window.addEventListener('hashchange',()=>{const i=CHAPTERS.findIndex(ch=>`#${ch[0]}`===location.hash);if(i>=0)jump(i,true);},eventOptions);
function dispose(){if(disposed)return;disposed=true;abort.abort();clearTimeout(resizeTimer);gsap.ticker.remove(tick);trigger.kill();lenis.destroy();weather.dispose();sound.dispose();}
window.addEventListener('pagehide',event=>{if(!event.persisted)dispose();else sound.update(true,0);},eventOptions);
if(import.meta.hot)import.meta.hot.dispose(dispose);
const startChapter=CHAPTERS.findIndex(ch=>`#${ch[0]}`===location.hash);if(startChapter>0)requestAnimationFrame(()=>jump(startChapter,true));
root.dataset.ready='true';
