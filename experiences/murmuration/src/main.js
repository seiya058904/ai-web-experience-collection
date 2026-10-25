import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import 'lenis/dist/lenis.css';
import './style.css';
import hero from './hero.json';
import { Renderer } from './renderer.js';
import { smooth, clamp, lerp, PRESETS, digest } from './model.js';
import { sampleRecord } from './recording.js';
import { FieldSession } from './session.js';

gsap.registerPlugin(ScrollTrigger);
const canvas=document.querySelector('#scene'),renderer=new Renderer(canvas,hero.meta);
const chapters=[...document.querySelectorAll('.chapter')],nav=[...document.querySelectorAll('.chapter-nav button')];
const motion=matchMedia('(prefers-reduced-motion: reduce)'),storageKey='murmuration-field-v1';
let still=motion.matches,progress=0,rule=0,ruleOverride=null,lastTime=0,record=null,worker=null,session=null;
let dirty=true,lastDraw=0,lastProgress=-1,lastDiagnostic=0,ripple=null,lastActive=-1,disposed=false;
let sampledResponse=-1;
const exportUrls=new Map();
renderer.onBackgroundChange=()=>{dirty=true;};
const data=new Float32Array(hero.data),note=document.querySelector('.load-note'),panelStates=[];
const savedLabel=document.querySelector('.saved-window-label'),status=document.querySelector('#field-status');
const dialog=document.querySelector('#about-dialog'),about=document.querySelector('#about-open');
const fieldControls=[...document.querySelectorAll('#field input,#field button')];
fieldControls.forEach(control=>{control.disabled=true;});
status.textContent='Preparing this observation…';
let focusReturn=about;
const life=new AbortController(),on=(el,type,fn,opts={})=>el.addEventListener(type,fn,{...opts,signal:life.signal});
const lenis=new Lenis({autoRaf:false,duration:.85,smoothWheel:!motion.matches,syncTouch:false,prevent:node=>Boolean(node.closest?.('dialog,[data-lenis-prevent]'))});
lenis.on('scroll',ScrollTrigger.update);
const track=ScrollTrigger.create({trigger:'#scroll-track',start:'top top',end:'bottom bottom',onUpdate:self=>{progress=self.progress;}});
gsap.ticker.lagSmoothing(0);
const resize=()=>{renderer.resize(innerWidth,innerHeight);lenis.resize();ScrollTrigger.refresh();dirty=true;};
resize();on(window,'resize',resize);on(window,'orientationchange',resize);
document.fonts.ready.then(()=>{if(!disposed){document.documentElement.classList.toggle('title-font-ready',document.fonts.check('400 16px Anton'));ScrollTrigger.refresh();dirty=true;}});
const anchors={many:0,local:.29,turn:.535,field:.72,shape:1};
function go(p,{instant=false,history=true}={}) {
  if(history){const name=Object.entries(anchors).reduce((a,b)=>Math.abs(b[1]-p)<Math.abs(a[1]-p)?b:a)[0];if(location.hash!==`#${name}`)window.history.pushState({chapter:name},'',`#${name}`);}
  lenis.scrollTo(clamp(p,0,1)*(document.documentElement.scrollHeight-innerHeight),{immediate:instant||motion.matches,duration:1.1});
}
document.querySelectorAll('[data-go]').forEach(b=>on(b,'click',()=>go(Number(b.dataset.go))));
on(window,'popstate',()=>go(anchors[location.hash.slice(1)]??0,{instant:true,history:false}));
on(window,'hashchange',()=>go(anchors[location.hash.slice(1)]??0,{instant:true,history:false}));
on(document.querySelector('.skip-link'),'click',e=>{e.preventDefault();go(.29);document.querySelector('#observation').focus({preventScroll:true});});
const descriptions=['A little room.<br/>Enough space for the next wingbeat.','A shared direction.<br/>Listen to the movement nearby.','A reason to stay.<br/>Close the distance without a destination.'];
function setRule(value) {rule=value;document.querySelectorAll('[data-rule]').forEach(b=>{b.classList.toggle('selected',Number(b.dataset.rule)===rule);b.setAttribute('aria-pressed',String(Number(b.dataset.rule)===rule));});document.querySelector('#rule-description').innerHTML=descriptions[rule];dirty=true;}
document.querySelectorAll('[data-rule]').forEach(b=>on(b,'click',()=>{ruleOverride=Number(b.dataset.rule);setRule(ruleOverride);}));
const motionButton=document.querySelector('#motion-toggle');
function syncMotion(){motionButton.textContent=still?'Animate wings':'Still wings';motionButton.setAttribute('aria-pressed',String(still));}
on(motionButton,'click',()=>{still=!still;syncMotion();dirty=true;});syncMotion();
on(motion,'change',e=>{still=e.matches;if(e.matches&&session){session.flock.paused=true;session.checkpoint();syncControls();}lenis.options.smoothWheel=!e.matches;syncMotion();dirty=true;});
function openNotes(button){focusReturn=button;lenis.stop();dialog.showModal();document.documentElement.classList.add('notes-open');lastTime=0;}
on(about,'click',()=>openNotes(about));
on(document.querySelector('#sources-open'),'click',e=>openNotes(e.currentTarget));
on(document.querySelector('#about-close'),'click',()=>dialog.close());
on(dialog,'close',()=>{document.documentElement.classList.remove('notes-open');lenis.start();lastTime=0;focusReturn.focus({preventScroll:true});dirty=true;});
on(dialog,'click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
function persist(){if(!session)return;try{sessionStorage.setItem(storageKey,JSON.stringify(session.checkpoint()));}catch{/* The in-memory field remains usable when storage is unavailable. */}}
function initializeField(){
  const initial={...hero,meta:undefined,data:Array.from(sampleRecord(record,hero.meta,1,new Float32Array(hero.count*6))),tick:hero.tick+hero.meta.steps,pending:[]};
  let stored=null;try{stored=JSON.parse(sessionStorage.getItem(storageKey)||'null');}catch{}
  session=new FieldSession(initial,stored,motion.matches);fieldControls.forEach(control=>{control.disabled=false;});syncControls();status.textContent=motion.matches?'Reduced motion. Resume or Step when you choose.':session.flock.paused?'Held in place. Change a rule, then Resume or Step.':'Click the open sky to stir the flock.';dirty=true;
}
async function loadRecording(){
 try{
  const response=await fetch(`${import.meta.env.BASE_URL}murmuration/records/flight.bin.gz`,{signal:life.signal});if(!response.ok)throw new Error('Unavailable recording');
  const raw=new Uint8Array(await response.arrayBuffer());
  const buffer=raw[0]===31&&raw[1]===139?await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer():raw.buffer;
  if(buffer.byteLength!==hero.meta.frames*hero.count*6*2)throw new Error('Invalid recording length');
  if(disposed)return;
  record=new Int16Array(buffer);note.textContent='';initializeField();
 }catch{
  if(disposed)return;
  note.textContent='Preparing a local observation…';
  worker=new Worker(new URL('./record-worker.js',import.meta.url),{type:'module'});
  worker.onmessage=e=>{if(disposed)return;record=new Int16Array(e.data);worker.terminate();worker=null;note.textContent='';initializeField();};
  worker.onerror=()=>{worker?.terminate();worker=null;note.textContent='The still observation is available. Reload to retry the moving study.';};
  worker.postMessage(hero);
 }
}
loadRecording();
const sliders=[...document.querySelectorAll('.sliders input')],hold=document.querySelector('#hold-button'),step=document.querySelector('#step-button');
function syncControls(){
  if(!session)return;const f=session.flock;
  sliders.forEach(input=>{input.value=f.rules[input.name].toFixed(1);input.nextElementSibling.textContent=f.rules[input.name].toFixed(1);});
  document.querySelectorAll('[data-preset]').forEach(b=>{const match=Object.entries(PRESETS[b.dataset.preset]).every(([k,v])=>Math.abs(v-f.rules[k])<.001);b.setAttribute('aria-pressed',String(match));});
  hold.textContent=f.paused?'Resume':'Hold';hold.setAttribute('aria-label',f.paused?'Resume the flock':'Hold the flock');
  step.hidden=!f.paused;document.querySelector('#flight-label').textContent=f.paused?'Held':'In flight';dirty=true;
}
sliders.forEach(input=>on(input,'input',()=>{if(!session)return;session.flock.setRules({[input.name]:Number(input.value)});session.checkpoint();syncControls();status.textContent=session.flock.paused?'Rule changed. It takes effect on Resume or Step.':'A rule changed. Watch the relationships unfold.';}));
document.querySelectorAll('[data-preset]').forEach(b=>on(b,'click',()=>{if(!session)return;session.flock.setRules(PRESETS[b.dataset.preset]);session.checkpoint();syncControls();status.textContent=session.flock.paused?`${b.dataset.preset} is ready. Resume or Step to observe.`:`${b.dataset.preset}. The flock keeps its history.`;}));
on(hold,'click',()=>{if(!session)return;session.hold();syncControls();status.textContent=session.flock.paused?'Held in place. Change a rule, then Resume or Step.':'In flight. Click the open sky to stir the flock.';persist();});
on(step,'click',()=>{if(!session||!session.flock.paused)return;session.stepOnce();dirty=true;status.textContent='One fixed step. The field is still held.';});
on(document.querySelector('#reset-button'),'click',()=>{if(!session)return;session.reset();ripple=null;syncControls();persist();status.textContent='The recorded initial field and Drift rules are restored.';});
function createRipple(point=null){
  if(!session)return;const f=session.flock,j=hero.meta.selected*6,pt=point||{x:f.data[j],y:f.data[j+1]};
  let affected=0;for(let i=0;i<f.count;i++)if(Math.hypot(f.data[i*6]-pt.x,f.data[i*6+1]-pt.y)<24)affected++;
  ripple={...pt,time:gsap.ticker.time};dirty=true;
  if(!affected){status.textContent='No birds were close enough. Try nearer the flock.';return;}
  f.queueRipple(pt.x,pt.y,24,1.5);session.checkpoint();
  status.textContent=f.paused?'Ripple queued. Resume or Step to see its effect.':'A local turn is moving through the field.';
}
on(document.querySelector('#ripple-button'),'click',()=>createRipple());
const hit=document.querySelector('.field-hit-area');let pointerStart=null;
on(hit,'pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY};});
on(hit,'pointerup',e=>{if(pointerStart&&Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)<9)createRipple(renderer.worldPoint(e.clientX,e.clientY));pointerStart=null;});
on(hit,'pointercancel',()=>{pointerStart=null;});
on(hit,'keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();createRipple();}});
on(document.querySelector('#export-button'),'click',async()=>{
  const feedback=document.querySelector('#export-status');if(!session){feedback.textContent='The observation is still preparing. Please try again shortly.';return;}
  const state=session.checkpoint();const output=document.createElement('canvas'),w=canvas.width,unit=clamp(w/64,11,36),compact=w<700,footer=Math.ceil(unit*(compact?11.5:7.7));
  output.width=w;output.height=canvas.height+footer;const c=output.getContext('2d');
  c.fillStyle='#eeece5';c.fillRect(0,0,output.width,output.height);c.drawImage(canvas,0,0);
  c.fillStyle='#242523';c.font=`${unit*1.8}px "DM Sans", sans-serif`;c.fillText('MURMURATION',unit*2,canvas.height+unit*2.5);
  c.fillStyle='#56574f';c.font=`${unit}px "DM Sans", sans-serif`;
  if(compact){['Keep Space','Match Heading','Stay Together'].forEach((label,i)=>c.fillText(`${label} ${state.rules[['space','heading','together'][i]].toFixed(1)}`,unit*2,canvas.height+unit*(4.3+i*1.4)));}
  else c.fillText(`Keep Space ${state.rules.space.toFixed(1)}  /  Match Heading ${state.rules.heading.toFixed(1)}  /  Stay Together ${state.rules.together.toFixed(1)}`,unit*2,canvas.height+unit*4.3);
  c.fillText(`Fieldprint · tick ${state.tick} · seed ${state.seed}`,unit*2,canvas.height+unit*(compact?9:5.9));
  try{
    const blob=await new Promise(resolve=>output.toBlob(resolve,'image/png'));if(!blob)throw new Error('No image');
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`murmuration-fieldprint-${state.tick}.png`;a.click();
    exportUrls.set(url,setTimeout(()=>{URL.revokeObjectURL(url);exportUrls.delete(url);},15000));feedback.textContent='Fieldprint saved. A moment from your field.';
    canvas.dataset.exportDigest=digest(state.data);canvas.dataset.exportTick=String(state.tick);
  }catch{feedback.textContent='The image could not be saved. Please try again.';}
  output.width=1;
});
function panel(index,opacity,y=0){
  const key=opacity.toFixed(3)+','+y.toFixed(2);if(panelStates[index]===key)return;panelStates[index]=key;
  const el=chapters[index],visible=opacity>.015;el.classList.toggle('active',visible);el.style.opacity=opacity;el.style.transform=`translateY(${y}px)`;el.setAttribute('aria-hidden',String(!visible));el.inert=!visible;
}
function frame(time) {
  if(disposed)return;lenis.raf(time*1000);if(progress>.001)canvas.classList.add('reveal-finished');const delta=lastTime?Math.min(time-lastTime,.05):0;lastTime=time;
  const p=progress,response=smooth(.445,.615,p),runningZone=p>=.675&&p<=.805;
  if(session){
    if(runningZone&&!session.active){session.enter();syncControls();dirty=true;}
    else if(!runningZone&&session.active){session.leave();persist();dirty=true;}
    else session.advance(delta,document.hidden||dialog.open);
  }
  if(record&&response!==sampledResponse){sampleRecord(record,hero.meta,response,data);sampledResponse=response;}
  let shown=data,clock=time,selected=smooth(.13,.20,p)*(1-smooth(.56,.61,p)),inset=null;
  if(session&&p>=.675){shown=session.flock.data;clock=session.flock.tick/60;selected=0;}
  else if(session&&!session.entered&&p>=.615){shown=session.flock.data;clock=session.flock.tick/60;selected=0;}
  if(session?.entered&&p>.545&&p<.675){
    const amount=smooth(.57,.675,p),entrance=smooth(.545,.57,p),w=innerWidth,h=innerHeight,portrait=w/h<.83;
    inset={x:lerp(lerp(w+20,w*.655,entrance),0,amount),y:lerp(h*(portrait?.10:.64),0,amount),w:lerp(w*.29,w,amount),h:lerp(h*.23,h,amount),amount,data:session.flock.data,time:session.flock.tick/60};
    savedLabel.hidden=entrance<.95||amount>.88;savedLabel.style.left=`${inset.x+12}px`;savedLabel.style.top=`${inset.y+(portrait?Math.max(12,inset.h-46):12)}px`;
  }else savedLabel.hidden=true;
  panel(0,1-smooth(.115,.165,p),-smooth(.115,.165,p)*40);
  panel(1,smooth(.205,.245,p)*(1-smooth(.407,.442,p)),(1-smooth(.205,.245,p))*26);
  panel(2,smooth(.465,.505,p)*(1-smooth(.585,.625,p)),(1-smooth(.465,.505,p))*26);
  panel(3,smooth(.645,.69,p)*(1-smooth(.812,.849,p)),(1-smooth(.645,.69,p))*24-smooth(.812,.849,p)*24);
  panel(4,smooth(.875,.925,p),(1-smooth(.875,.925,p))*24);
  if(p<.20||p>.445)ruleOverride=null;
  const nextRule=ruleOverride??clamp(Math.floor((p-.255)/.052),0,2);if(nextRule!==rule)setRule(nextRule);
  const active=p<.19?0:p<.445?1:p<.64?2:p<.855?3:4;
  if(active!==lastActive){nav.forEach((b,i)=>i===active?b.setAttribute('aria-current','step'):b.removeAttribute('aria-current'));lastActive=active;}
  document.querySelector('.record-progress span').style.transform=`scaleX(${response})`;
  const changed=p!==lastProgress,animate=!still&&(p<.675||(session?.active&&!session.flock.paused))&&!dialog.open;
  if(!document.hidden&&(dirty||changed||(session?.active&&!session.flock.paused)||animate||ripple)&&time-lastDraw>1/33){
    renderer.draw(shown,p,clock,{mark:selected,rule,reduced:still||dialog.open,ripple:ripple?{...ripple,time:ripple.time+clock-time}:null,inset});
    if(ripple&&time-ripple.time>1.2)ripple=null;
    canvas.classList.add('ready');document.querySelector('.opening-poster').classList.add('ready');lastDraw=time;dirty=false;
  }
  lastProgress=p;
  if(time-lastDiagnostic>.15||changed){
    canvas.dataset.progress=p.toFixed(5);canvas.dataset.phase=['many','local','turn','live','ending'][active];canvas.dataset.record=record?'ready':'loading';
    canvas.dataset.count=hero.count;canvas.dataset.tick=session?.flock.tick??hero.tick;canvas.dataset.state=digest(shown);
    canvas.dataset.running=String(Boolean(session?.active&&!session.flock.paused&&!dialog.open&&!document.hidden));
    canvas.dataset.instances='1';canvas.dataset.rules=JSON.stringify(session?.flock.rules??hero.rules);lastDiagnostic=time;
    document.querySelector('#ending-state').textContent=session?.entered?'Your field, held in place.':'An unaltered field, held for you.';
  }
}
gsap.ticker.add(frame);
on(document,'visibilitychange',()=>{lastTime=0;if(document.hidden)persist();else{dirty=true;session&&(session.accumulator=0);}});
on(window,'pagehide',()=>{persist();lastTime=0;});
on(window,'pageshow',()=>{lastTime=0;ScrollTrigger.refresh();dirty=true;});
if(location.hash&&anchors[location.hash.slice(1)]!==undefined)go(anchors[location.hash.slice(1)],{instant:true,history:false});
function dispose(){if(disposed)return;persist();disposed=true;gsap.ticker.remove(frame);track.kill();lenis.destroy();renderer.dispose();worker?.terminate();life.abort();exportUrls.forEach((timer,url)=>{clearTimeout(timer);URL.revokeObjectURL(url);});exportUrls.clear();}
if(import.meta.hot)import.meta.hot.dispose(dispose);
