import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import './styles.css';
import { ACTS, TOTAL_TRAVEL, sampleStory, progressForAct, clamp, smoothstep } from './story.js';
import { createSoundscape } from './audio.js';

const root=document.documentElement;
const stage=document.querySelector('.stage');
const canvas=document.querySelector('#world');
const story=document.querySelector('#story');
const chapters=[...document.querySelectorAll('.chapter')];
const chapterLinks=[...document.querySelectorAll('.chapter-nav a')];
const dialogs=[...document.querySelectorAll('dialog')];
const progressTrack=document.querySelector('.progress-track');
const progressFill=document.querySelector('#progress-fill');
const soundButton=document.querySelector('#sound-toggle');
const soundLabel=document.querySelector('#sound-label');
const fallbackImage=document.querySelector('#fallback-image');
const fallbackMobile=document.querySelector('#fallback-mobile');
const motionSelect=document.querySelector('#motion-select');
const qualitySelect=document.querySelector('#quality-select');
const media=matchMedia('(prefers-reduced-motion: reduce)');
const sound=createSoundscape();
const params=new URLSearchParams(location.search);
const assetUrl=path=>`${import.meta.env.BASE_URL}ferrum/assets/${path}`;
const qaEnabled=params.has('qa');
const isCapture=params.get('capture')==='1';
let prefs={motion:'system',quality:'auto'};
try {const saved=JSON.parse(localStorage.getItem('ferrum:preferences:v1'));if(saved&&['system','full','reduced'].includes(saved.motion)&&['auto','high','low','still'].includes(saved.quality))prefs=saved;}catch{}
if(params.has('quality')&&['high','low','still'].includes(params.get('quality')))prefs.quality=params.get('quality');
let reduceMotion=false,resolvedQuality='high',lenis,scene=null,sceneReady=false,contextLost=false;
let width=innerWidth,height=innerHeight,stableHeight=height,maxScroll=height*TOTAL_TRAVEL;
let pendingResize=true,frameId=0,lastNow=0,ambient=0,frozenTime=0,freeze=qaEnabled,lastIndex=-1,lastProgress=0,previousState=null;
let averageFrame=16,slowFrames=0,frameCount=0,statusTimer,skipAudioUntil=0,importFailed=false,sceneFailed=false;
let progress=0,state=sampleStory(0),dialogSource=null;
const pointer={x:0,y:0},pointerTarget={x:0,y:0};
const stillCache=new Map();

function announce(message){const element=document.querySelector('#status-message');element.textContent=message;element.classList.add('is-visible');clearTimeout(statusTimer);statusTimer=setTimeout(()=>element.classList.remove('is-visible'),4200);}
function savePreferences(){try{localStorage.setItem('ferrum:preferences:v1',JSON.stringify(prefs));}catch{}}
function measureStableHeight(){const probe=document.createElement('div');probe.style.cssText='position:fixed;left:0;top:0;width:0;height:100svh;visibility:hidden;pointer-events:none';document.body.append(probe);const value=probe.getBoundingClientRect().height;probe.remove();return value||innerHeight;}
function configureScroll(){
  const wasReduced=reduceMotion;
  reduceMotion=prefs.motion==='reduced'||(prefs.motion==='system'&&media.matches);
  root.classList.toggle('is-reduced',reduceMotion);
  if(lenis){lenis.destroy();lenis=null;}
  if(!reduceMotion && !isCapture){lenis=new Lenis({autoRaf:false,lerp:.085,smoothWheel:true,syncTouch:false,anchors:false,overscroll:false,prevent:node=>Boolean(node.closest?.('dialog'))});}
  if(dialogs.some(dialog=>dialog.open))lenis?.stop();
  motionSelect.value=prefs.motion;qualitySelect.value=prefs.quality;
  resolvedQuality=prefs.quality==='low'?'low':'high';
  if(wasReduced!==reduceMotion){pointer.x=pointer.y=pointerTarget.x=pointerTarget.y=0;}
  pendingResize=true;
}
function applyResize(){
  const oldWidth=width,oldHeight=height;
  const preserved=clamp(scrollY/Math.max(1,maxScroll));
  width=innerWidth;height=innerHeight;
  const realResize=Math.abs(width-oldWidth)>2;
  if(realResize||!frameCount)stableHeight=measureStableHeight();
  maxScroll=stableHeight*TOTAL_TRAVEL;
  story.style.height=`${maxScroll+height}px`;
  lenis?.resize();
  if(realResize){lenis?lenis.scrollTo(preserved*maxScroll,{immediate:true,force:true}):window.scrollTo(0,preserved*maxScroll);}
  scene?.resize(width,height,resolvedQuality);
  if(width!==oldWidth||height!==oldHeight)setFallback(lastIndex<0?0:lastIndex);
  pendingResize=false;
}
function preloadStill(index,mobile=height>width){
  const id=`${String(index).padStart(2,'0')}-${mobile?'mobile':'desktop'}`;
  if(stillCache.has(id))return stillCache.get(id);
  const img=new Image();img.decoding='async';img.src=assetUrl(`stills/${id}.webp`);
  const item={img,ready:img.decode().then(()=>true).catch(()=>false)};stillCache.set(id,item);return item;
}
function setFallback(index){
  const id=String(index).padStart(2,'0');
  fallbackMobile.srcset=assetUrl(`stills/${id}-mobile.webp`);
  fallbackImage.src=assetUrl(`stills/${id}-desktop.webp`);
  fallbackImage.dataset.chapter=String(index);
  preloadStill(index);
  if(index<5)preloadStill(index+1);
  if(index>0)preloadStill(index-1);
}
function updateFallback(){stage.classList.toggle('is-fallback',!sceneReady||contextLost||prefs.quality==='still');}
function updateUI(current){
  if(lastIndex!==current.index){
    lastIndex=current.index;
    root.dataset.act=String(lastIndex);
    for(let i=0;i<chapters.length;i++){
      const active=i===lastIndex;
      chapters[i].dataset.active=String(active);chapters[i].setAttribute('aria-hidden',String(!active));chapters[i].inert=!active;
      if(active)chapterLinks[i].setAttribute('aria-current','step');else chapterLinks[i].removeAttribute('aria-current');
    }
    setFallback(lastIndex);
    if(!isCapture&&(!location.hash||location.hash!==`#${chapters[lastIndex].id}`))history.replaceState(null,'',`#${chapters[lastIndex].id}`);
  }
  for(let i=0;i<chapters.length;i++){
    let opacity=0,offset=0;
    if(i===current.index){
      opacity=reduceMotion?1:(i===0?1:smoothstep(0,.15,current.local));
      if(i!==5&&!reduceMotion)opacity*=1-smoothstep(.77,.97,current.local);
      offset=reduceMotion?0:(1-opacity)*12;
    }
    chapters[i].style.opacity=opacity.toFixed(4);chapters[i].style.setProperty('--title-offset',`${offset.toFixed(2)}px`);
  }
  progressFill.style.transform=`scaleX(${current.progress})`;
  if(frameCount%10===0||current.progress===1)progressTrack.setAttribute('aria-valuenow',String(Math.round(current.progress*100)));
}
function goToAct(index,{instant=false,historyEntry=true}={}){
  const actIndex=clamp(Number(index),0,5),target=actIndex===0?0:progressForAct(actIndex);
  for(const dialog of dialogs)if(dialog.open)dialog.close();
  root.classList.remove('dialog-open');
  lenis?.start();
  const hash=`#${chapters[actIndex].id}`;
  if(historyEntry&&hash!==location.hash)history.pushState(null,'',hash);
  skipAudioUntil=performance.now()+1800;
  if(lenis)lenis.scrollTo(target*maxScroll,{immediate:instant,duration:1.15,easing:t=>1-Math.pow(1-t,3),force:true});
  else window.scrollTo({top:target*maxScroll,behavior:'instant'});
}
function navigateHash(instant=true){const index=chapters.findIndex(section=>`#${section.id}`===location.hash);if(index>=0)goToAct(index,{instant,historyEntry:false});}
function frame(now){
  frameId=0;if(document.hidden)return;
  const delta=lastNow?Math.min(64,now-lastNow):16;lastNow=now;
  if(pendingResize)applyResize();
  lenis?.raf(now);
  progress=clamp(scrollY/Math.max(1,maxScroll));
  state=sampleStory(progress,{reducedMotion:reduceMotion});
  if(!freeze&&!reduceMotion&&!dialogs.some(dialog=>dialog.open))ambient+=delta/1000;
  const response=reduceMotion||freeze?1:1-Math.exp(-delta/140);
  pointer.x+=(pointerTarget.x-pointer.x)*response;pointer.y+=(pointerTarget.y-pointer.y)*response;
  updateUI(state);
  if(scene&&!importFailed&&!sceneFailed&&prefs.quality!=='still'){
    try { scene.update(state,{time:freeze?frozenTime:ambient,pointer:reduceMotion?{x:0,y:0}:pointer,width,height,quality:resolvedQuality,reducedMotion:reduceMotion}); }
    catch(error) { sceneFailed=true;sceneReady=false;updateFallback(); }
  }
  sound.update(state);
  if(previousState&&now>skipAudioUntil&&progress>lastProgress&&progress-lastProgress<.015){
    for(let i=0;i<state.strikePulses.length;i++)if(previousState.strikePulses[i].age<0&&state.strikePulses[i].age>=0)sound.strike(i?.82:1);
  }
  if(!qaEnabled&&!reduceMotion&&prefs.quality==='auto'&&sceneReady&&frameCount>150){
    averageFrame=averageFrame*.98+delta*.02;
    if(averageFrame>30)slowFrames++;else slowFrames=Math.max(0,slowFrames-1);
    if(slowFrames>100&&resolvedQuality!=='low'){resolvedQuality='low';scene.resize(width,height,resolvedQuality);}
  }
  previousState=state;lastProgress=progress;frameCount++;
  frameId=requestAnimationFrame(frame);
}
function start(){if(!frameId&&!document.hidden){lastNow=0;frameId=requestAnimationFrame(frame);}}
async function initializeScene(){
  try{
    const {createScene}=await import('./scene.js');
    scene=createScene(canvas,{
      onReady(){sceneReady=true;contextLost=false;stage.classList.add('is-ready');updateFallback();},
      onContextLost(){contextLost=true;updateFallback();announce('The still edition is ready while the scene recovers.');},
      onContextRestored(){contextLost=false;sceneFailed=false;sceneReady=true;pendingResize=true;updateFallback();},
      onError(error){console.error('FERRUM scene:',error);sceneFailed=true;sceneReady=false;updateFallback();announce('The still edition is ready. You can explore every chapter.');}
    });
    scene.resize(width,height,resolvedQuality);updateFallback();
  }catch(error){importFailed=true;sceneReady=false;updateFallback();console.warn('FERRUM: using the still edition.',error?.message||error);announce('The still edition is ready. You can explore every chapter.');}
}

root.classList.add('enhanced');
stableHeight=measureStableHeight();configureScroll();applyResize();setFallback(0);updateFallback();
const initialHash=location.hash;
const navigationEntry=performance.getEntriesByType('navigation')[0];
if(initialHash&&navigationEntry?.type!=='reload')navigateHash(true);
updateUI(sampleStory(clamp(scrollY/maxScroll),{reducedMotion:reduceMotion}));
start();initializeScene();

window.addEventListener('resize',()=>{pendingResize=true;},{passive:true});
window.addEventListener('orientationchange',()=>{pendingResize=true;},{passive:true});
window.addEventListener('pointermove',event=>{if(event.pointerType==='touch'||reduceMotion||freeze)return;pointerTarget.x=clamp(event.clientX/innerWidth*2-1,-1,1);pointerTarget.y=clamp(event.clientY/innerHeight*2-1,-1,1);},{passive:true});
window.addEventListener('pointerout',event=>{if(!event.relatedTarget)pointerTarget.x=pointerTarget.y=0;},{passive:true});
window.addEventListener('popstate',()=>navigateHash(true));
window.addEventListener('hashchange',()=>navigateHash(true));
media.addEventListener('change',()=>{if(prefs.motion==='system')configureScroll();});

document.addEventListener('click',event=>{
  const opener=event.target.closest('[data-open]');
  if(opener){dialogSource=opener;const dialog=document.getElementById(opener.dataset.open);lenis?.stop();root.classList.add('dialog-open');dialog.showModal();return;}
  const closer=event.target.closest('[data-close]');if(closer){closer.closest('dialog').close();return;}
  const next=event.target.closest('[data-next]');if(next){goToAct(Number(next.dataset.next));return;}
  const anchor=event.target.closest('a[href^="#"]');if(anchor){const index=chapters.findIndex(section=>`#${section.id}`===anchor.getAttribute('href'));if(index>=0){event.preventDefault();goToAct(index);}}
});
for(const dialog of dialogs){
  dialog.addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;
    const controls=[...dialog.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')]
      .filter(element=>!element.disabled&&element.tabIndex>=0&&element.getClientRects().length&&getComputedStyle(element).visibility!=='hidden');
    const first=controls[0],last=controls.at(-1);
    if(!first){event.preventDefault();return;}
    if(event.shiftKey&&(document.activeElement===first||!dialog.contains(document.activeElement))){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&(document.activeElement===last||!dialog.contains(document.activeElement))){event.preventDefault();first.focus();}
  });
  dialog.addEventListener('close',()=>{root.classList.remove('dialog-open');lenis?.start();dialogSource?.focus({preventScroll:true});dialogSource=null;});
}
motionSelect.addEventListener('change',()=>{prefs.motion=motionSelect.value;savePreferences();configureScroll();});
qualitySelect.addEventListener('change',()=>{prefs.quality=qualitySelect.value;resolvedQuality=prefs.quality==='low'?'low':'high';slowFrames=0;savePreferences();pendingResize=true;updateFallback();});
soundButton.addEventListener('click',async()=>{try{await sound.toggle();}catch{announce('Sound is not available in this browser.');}});
sound.subscribe(enabled=>{soundButton.setAttribute('aria-pressed',String(enabled));soundLabel.textContent=enabled?'Sound on':'Sound off';});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){if(frameId)cancelAnimationFrame(frameId);frameId=0;lastNow=0;sound.setHidden(true).catch(()=>{});}
  else{pendingResize=true;sound.setHidden(false).catch(()=>{});start();}
});
window.addEventListener('pagehide',()=>{if(frameId)cancelAnimationFrame(frameId);frameId=0;sound.setHidden(true).catch(()=>{});});
window.addEventListener('pageshow',()=>{pendingResize=true;if(!document.hidden)sound.setHidden(false).catch(()=>{});start();});

if(qaEnabled){
  window.__FERRUM_QA__={
    getState:()=>JSON.parse(JSON.stringify(state)),
    getDiagnostics:()=>({ready:sceneReady,contextLost,importFailed,sceneFailed,frames:frameCount,rafScheduled:Boolean(frameId),progress,maxScroll,width,height,stableHeight,quality:resolvedQuality,preferenceQuality:prefs.quality,reducedMotion:reduceMotion,soundEnabled:sound.enabled,audioState:sound.status,scene:scene?.getStats?.()}),
    seek(value){const target=clamp(value)*maxScroll;lenis?lenis.scrollTo(target,{immediate:true,force:true}):window.scrollTo(0,target);},
    seekAct(index,local){this.seek(progressForAct(index,local));},
    setFrozen(value=true){if(value&&!freeze)frozenTime=ambient;freeze=Boolean(value);pointer.x=pointer.y=pointerTarget.x=pointerTarget.y=0;},
    setTime(value){ambient=Math.max(0,Number(value)||0);frozenTime=ambient;},
    getActs:()=>ACTS.map(act=>({...act})),
    captureMode(value=true){stage.classList.toggle('capture-only',value);root.classList.toggle('capture-only',value);},
  };
}
