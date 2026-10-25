import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import 'lenis/dist/lenis.css';
import { createDirector, clamp, smooth } from './state.js';

gsap.registerPlugin(ScrollTrigger);
const $ = selector => document.querySelector(selector);
const story=$('#story'),production=$('#production'),stage=$('#stage'),canvas=$('#theatre');
const poster=$('#stage-poster'),panels=[...document.querySelectorAll('[data-act]')];
const chapters=[...document.querySelectorAll('.chapter-nav a')];
const sceneButtons=[...document.querySelectorAll('[data-scene]')];
const media=matchMedia('(prefers-reduced-motion: reduce)');
const storageKey='backstage.production.v1';
const safeRead=key=>{try{return sessionStorage.getItem(key);}catch{return null;}};
const safeWrite=(key,value)=>{try{sessionStorage.setItem(key,value);}catch{/* Storage is optional, including private browsing. */}};
const director=createDirector(safeRead(storageKey));
let manualStill=safeRead('backstage.still')==='true', reduced=media.matches||manualStill;
let progress=0,lastTime=0,environmentTime=0,opening=0,stageRenderer=null,alive=true,visible=true;
let staticMode=new URLSearchParams(location.search).get('static')==='1',contextLost=false,lastStatus='',lastUIAct=0,lastInspect=0;
let refreshTimer=0,saveTimer=0,lastPoster='room',frameHeight=0,pendingFocus=null,restoreTimer=0;
const anchors={believe:0,wings:.29,change:.55,cue:.735,again:.985};
const actNames=['Believe','The Other Side','Change the World','Call the Cue','Believe Again'];
const romans=['I','II','III','IV','V'];
const listeners=[];
function listen(target,type,handler,options){target.addEventListener(type,handler,options);listeners.push(()=>target.removeEventListener(type,handler,options));}

// A single Lenis instance. The sole GSAP ticker drives Lenis, state and drawing.
const lenis=new Lenis({autoRaf:false,lerp:.13,smoothWheel:!reduced,syncTouch:false,
  prevent:node=>node instanceof HTMLElement && (!!node.closest('.controls') || node.tagName==='INPUT')});
lenis.on('scroll',ScrollTrigger.update);
const trigger=ScrollTrigger.create({trigger:story,start:'top top',end:'bottom bottom',invalidateOnRefresh:true,onUpdate:self=>{progress=self.progress;},onRefresh:self=>{progress=self.progress;}});
gsap.ticker.lagSmoothing(0);

function refreshLayout(){
  if(!alive)return;
  const h=production.getBoundingClientRect().height;
  if(Math.abs(h-frameHeight)>.5){frameHeight=h;document.documentElement.style.setProperty('--frame-height',h+'px');}
  const rect=canvas.getBoundingClientRect();
  stageRenderer?.resize(rect.width,rect.height);
  lenis.resize();ScrollTrigger.refresh();
}
function queueRefresh(){clearTimeout(refreshTimer);refreshTimer=setTimeout(refreshLayout,110);}
const observer=new ResizeObserver(queueRefresh);observer.observe(production);observer.observe(stage);
const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;lastTime=0;});intersection.observe(production);
document.fonts?.ready.then(queueRefresh);
listen(window,'orientationchange',queueRefresh);
listen(window,'resize',queueRefresh);
listen(window,'pageshow',()=>{lastTime=0;queueRefresh();});
listen(document,'visibilitychange',()=>{lastTime=0;if(document.hidden)save();else queueRefresh();});

function save(){clearTimeout(saveTimer);safeWrite(storageKey,JSON.stringify(director.serialize()));}
function scheduleSave(){clearTimeout(saveTimer);saveTimer=setTimeout(save,250);}
function navigate(id,{instant=false,history=true,focus=false,onComplete=null}={}){
  if(!Object.hasOwn(anchors,id))return;
  const y=trigger.start+anchors[id]*(trigger.end-trigger.start);
  if(history)window.history.pushState({act:id},'',`#${id}`);
  lenis.scrollTo(y,{immediate:instant||reduced,duration:1.25,force:true,onComplete:()=>{
    if(focus)pendingFocus=id;
    onComplete?.();
    save();
  }});
}
for(const link of document.querySelectorAll('a[href^="#"]')){
  const id=link.getAttribute('href').slice(1);
  if(!Object.hasOwn(anchors,id))continue;
  listen(link,'click',event=>{event.preventDefault();navigate(id,{focus:event.detail===0});});
}
listen(window,'popstate',()=>{const id=location.hash.slice(1);navigate(Object.hasOwn(anchors,id)?id:'believe',{instant:true,history:false});});
listen(window,'hashchange',()=>{const id=location.hash.slice(1);if(Object.hasOwn(anchors,id))navigate(id,{instant:true,history:false});});
listen($('#begin-again'),'click',()=>{navigate('believe',{onComplete:()=>{director.reset();syncControls();save();}});});
function canDirect(){return progress>=.68&&progress<.82&&!staticMode&&!contextLost;}
for(const button of sceneButtons)listen(button,'click',()=>{
  if(!canDirect())return;
  director.setScene(button.dataset.scene);syncControls();scheduleSave();
});
listen($('#view'),'input',event=>{if(canDirect()){director.setView(Number(event.target.value)/100);syncControls();scheduleSave();}});
listen($('#light'),'input',event=>{if(canDirect()){director.setLight(Number(event.target.value)/100);syncControls();scheduleSave();}});
listen($('#reset-production'),'click',()=>{if(canDirect()){director.reset();syncControls();save();}});
function syncControls(){
  const state=director.inspect();
  for(const button of sceneButtons)button.setAttribute('aria-pressed',String(button.dataset.scene===state.target));
  $('#view').value=Math.round(state.view*100);
  $('#light').value=Math.round(state.light*100);
  $('#view').setAttribute('aria-valuetext',state.view<.01?'Audience':state.view>.99?'Wings':`${Math.round(state.view*100)} percent toward the wings`);
  $('#light').setAttribute('aria-valuetext',`${Math.round(state.light*100)} percent, ${state.light<.33?'low':state.light>.66?'high':'middle'} sidelight`);
}
function setMotion(){
  reduced=media.matches||manualStill;
  document.documentElement.dataset.still=String(reduced);
  $('#motion-toggle').setAttribute('aria-pressed',String(reduced));
  $('#motion-toggle').textContent=reduced?'Still mode on':'Still mode';
  $('#motion-toggle').title=media.matches?'Your system prefers reduced motion.':'Reduce motion while keeping all three controls.';
  lenis.options.smoothWheel=!reduced;
  if(reduced)lenis.scrollTo(window.scrollY,{immediate:true});
}
listen($('#motion-toggle'),'click',()=>{manualStill=!manualStill;safeWrite('backstage.still',String(manualStill));setMotion();});
listen(media,'change',setMotion);
setMotion();syncControls();

function showPoster(name){
  if(name===lastPoster)return;
  // Public assets live at the same portable base in dev and production.
  poster.src=new URL(`posters/${name}.png`,document.baseURI).href;
  poster.alt={room:'The teal room, red door and paper lantern seen from the audience.',wings:'The same miniature from the wings, showing its timber supports, red door and paper lantern.',sea:'The same red door and paper lantern among layered painted waves and coastal flats.',night:'A suspended painted moon and stars above the red door, with the paper lantern on its floor rail.'}[name]||'The original miniature theatre.';
  lastPoster=name;
}
function enableStatic(message='The static edition is ready.'){
  staticMode=true;document.body.classList.add('static-mode');stage.classList.remove('is-ready');
  const old=stageRenderer;stageRenderer=null;old?.dispose();
  $('#static-gallery').hidden=false;$('#controls').hidden=true;$('#static-controls-note').hidden=false;
  $('#cue-status').textContent=message;$('#recovery').hidden=true;clearTimeout(restoreTimer);queueRefresh();
}
async function launchStage(){
  if(staticMode){enableStatic();return;}
  try{
    const {createTheatre}=await import('./theatre.js');
    if(!alive)return;
    stageRenderer?.dispose();stageRenderer=null;
    stageRenderer=createTheatre(canvas,status=>{
      if(staticMode)return;
      contextLost=status==='lost';
      stage.classList.toggle('is-ready',!contextLost);
      $('#recovery').hidden=!contextLost;
      if(contextLost){showPoster(director.inspect().pose?.scene||'room');save();}
      else{clearTimeout(restoreTimer);lastTime=0;refreshLayout();}
    });
    refreshLayout();
    const pose=director.tick(progress,0,{reducedMotion:reduced,visible:true});
    stageRenderer.update(pose,0,reduced,1);
    stage.classList.add('is-ready');document.body.dataset.ready='true';
  }catch(error){
    stageRenderer?.dispose();stageRenderer=null;
    enableStatic();
    console.info('BACKSTAGE: live graphics unavailable; the static reading edition is active.',error instanceof Error?error.message:String(error));
  }
}
listen($('#retry'),'click',()=>{
  if(contextLost&&stageRenderer){
    stageRenderer.restoreContext();
    $('#recovery p').textContent='Restoring the live stage…';
    clearTimeout(restoreTimer);restoreTimer=setTimeout(()=>{if(contextLost)enableStatic();},4500);
  }else launchStage();
});

function panelWeights(p){
  return [1-smooth(.125,.18,p),smooth(.20,.26,p)*(1-smooth(.34,.40,p)),smooth(.45,.52,p)*(1-smooth(.60,.65,p)),smooth(.655,.685,p)*(1-smooth(.82,.86,p)),smooth(.875,.94,p)];
}
function updateUI(pose){
  const weights=panelWeights(progress);
  panels.forEach((panel,index)=>{
    const weight=reduced?(pose.act===index+1?1:0):weights[index];
    panel.style.opacity=weight.toFixed(3);panel.style.visibility=weight>.001?'visible':'hidden';
    panel.style.transform=reduced?'none':`translateY(${((1-weight)*13).toFixed(2)}px)`;
    panel.style.pointerEvents=weight>.65?'auto':'none';
    const inaccessible=weight<.15;
    if(inaccessible&&panel.contains(document.activeElement))chapters[pose.act-1].focus({preventScroll:true});
    panel.inert=inaccessible;panel.setAttribute('aria-hidden',String(inaccessible));
  });
  if(!canDirect()&&$('#controls').contains(document.activeElement))chapters[pose.act-1].focus({preventScroll:true});
  $('#controls').inert=!canDirect();
  if(pose.act!==lastUIAct){
    lastUIAct=pose.act;
    chapters.forEach((a,i)=>{if(i===pose.act-1)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});
    $('#act-label').textContent=`${romans[pose.act-1]} · ${actNames[pose.act-1]}`;
  }
  const title=pose.target[0].toUpperCase()+pose.target.slice(1);
  const status=pose.busy?`Changing to ${title.toLowerCase()}…`:`${title} is ready.`;
  if(status!==lastStatus){$('#cue-status').textContent=status;lastStatus=status;if(!pose.busy)scheduleSave();}
  $('#scene-signature').textContent=`Your scene · ${title}`;
  const scene=pose.world<.5?'ROOM':pose.world<1.5?'SEA':'NIGHT';
  $('#stage-caption').textContent=`${scene} · ${pose.view>.65?'Wings':pose.view>.2?'Between audience and wings':'Audience view'}`;
  if(staticMode)showPoster(pose.view>.65?'wings':scene.toLowerCase());
  story.dataset.progress=progress.toFixed(5);
  stage.dataset.world=pose.world.toFixed(5);stage.dataset.view=pose.view.toFixed(5);stage.dataset.light=pose.light.toFixed(5);
  stage.dataset.lamp=pose.lamp.toFixed(5);stage.dataset.mode=pose.mode;stage.dataset.scene=pose.target;
}

function tick(time){
  if(!alive)return;
  lenis.raf(time*1000);
  const dt=lastTime?Math.min(.05,Math.max(0,time-lastTime)):0;lastTime=time;
  if(document.hidden||!visible)return;
  environmentTime+=reduced?0:dt;opening=Math.min(1,opening+dt);
  const pose=director.tick(progress,dt,{reducedMotion:reduced,visible:true});
  updateUI(pose);
  if(pendingFocus){const target=$(`#${pendingFocus} h1, #${pendingFocus} h2`);if(target&&!target.closest('[inert]')){target.setAttribute('tabindex','-1');target.focus({preventScroll:true});pendingFocus=null;}}
  if(!staticMode)stageRenderer?.update(pose,environmentTime,reduced,reduced?1:smooth(0,1,opening));
  if(stageRenderer&&time-lastInspect>.5){
    lastInspect=time;const info=stageRenderer.inspect();
    stage.dataset.renderInfo=JSON.stringify(info);
    production.dataset.snapshotId=String(director.inspect().exitSnapshot?.id||0);
  }
}
gsap.ticker.add(tick);
// A slow module may arrive after the independent six-second reading fallback.
// Restore one coherent live layout before measuring it; never leave hidden
// controls paired with an active renderer.
document.body.classList.remove('boot-fallback');
if(!staticMode){
  document.body.classList.remove('static-mode');
  $('#controls').hidden=false;$('#cue-status').hidden=false;
  $('#static-controls-note').hidden=true;$('#static-gallery').hidden=true;
}
document.body.dataset.controllerReady='true';
document.documentElement.removeAttribute('data-boot');
refreshLayout();
if(Object.hasOwn(anchors,location.hash.slice(1)))navigate(location.hash.slice(1),{instant:true,history:false});
launchStage();

function dispose(){
  if(!alive)return;alive=false;save();clearTimeout(refreshTimer);clearTimeout(saveTimer);clearTimeout(restoreTimer);
  gsap.ticker.remove(tick);trigger.kill();lenis.destroy();observer.disconnect();intersection.disconnect();listeners.forEach(remove=>remove());stageRenderer?.dispose();
}
listen(window,'pagehide',event=>{save();if(!event.persisted)dispose();});
if(import.meta.hot)import.meta.hot.dispose(dispose);
