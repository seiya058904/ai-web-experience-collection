import './style.css';
import 'lenis/dist/lenis.css';
import Lenis from 'lenis';
import { pageMarkup, arrow } from './content.ts';
import { CourtScene, FlightScene, createRallySVG } from './scenes.ts';
import { ContactScene, BounceScene, HandoffScene } from './contact-scenes.ts';
import { branches, mainTrajectory, comparisonTrajectories, sampleReplay } from './physics.ts';
import type { ReturnChoice, SpinPreset } from './physics.ts';
import { createState, chooseReturn, setComparison, seekReplay, advanceReplay, persistedState } from './state.ts';
import { RallyAudio } from './audio.ts';
import { softText } from '../../shared/soft-swap.ts';

const $ = <T extends Element = HTMLElement>(selector: string): T => {
  const element = document.querySelector<T>(selector); if (!element) throw new Error(`Missing interface element: ${selector}`); return element;
};
const all = <T extends Element = HTMLElement>(selector: string) => Array.from(document.querySelectorAll<T>(selector));
const clamp = (n:number,lo=0,hi=1)=>Math.min(hi,Math.max(lo,n));
const app = $('#app'); app.innerHTML = pageMarkup();
const storageKey = 'rally-the-space-between-v1';
let stored: unknown = null;
try { stored = localStorage.getItem(storageKey); } catch { /* Private/blocked storage is optional. */ }
let state = createState(stored);
const abort = new AbortController(), signal = abort.signal;
const audio = new RallyAudio();
const mediaMotion = matchMedia('(prefers-reduced-motion: reduce)');
let reduced = state.motion === 'reduced' || mediaMotion.matches;
let lenis: Lenis | null = null;
/** Preparation caption state; a dead band around the half-way point keeps it steady. */
let preparing = true;
let frame = 0, lastFrame = 0, previousScroll = -1, dirty = true, currentChapter = 1;
let heroVisited = false, heroDeparted = false, previousEvent = -1, lastSave = 0;
let contactState: 'before'|'contact'|'after' = 'before', bounceState: 'before'|'contact'|'after' = 'before';
let spinProgress = 1, spinPlaying = false, showSpace = false;
let netProgress: number | null = null, exitReplayTime = state.replayTime, finalCompleted = false;
const born = performance.now();
const hero = $('#ch01'), story = $('#story');
const chapters = all<HTMLElement>('.chapter');
const bridgeElements = all<HTMLElement>('.handoff');
let chapterBounds: {top:number;height:number}[] = [];
let bridgeBounds: {top:number;height:number}[] = [];
const courts = {
  prepare:new CourtScene($('#prepare-court'),'prepare'),
  space:new CourtScene($('#space-court'),'space'),
  choice:new CourtScene($('#choice-court'),'choice'),
  replay:new CourtScene($('#replay-court'),'replay'),
  final:new CourtScene($('#final-court'),'final'),
};
const flights = {comparison:new FlightScene($('#comparison-flight'),'comparison'),net:new FlightScene($('#net-flight'),'net')};
const contact = new ContactScene($('#contact-scene'));
const bounce = new BounceScene($('#bounce-scene'));
const handoffs = bridgeElements.map((_,i)=>new HandoffScene($(`#handoff-${i+1}`),i+1));
const timeline = $<HTMLInputElement>('#replay-timeline');
const playButton = $<HTMLButtonElement>('#replay-play');
let replayButtonState = '';
const soundButton = $<HTMLButtonElement>('#sound-toggle');
const menu = $<HTMLDialogElement>('#chapters-dialog');
const about = $<HTMLDialogElement>('#about-dialog');
let dialogOpener: HTMLElement | null = null;

function measure() {
  chapterBounds = chapters.map(e=>({top:e.offsetTop,height:e.offsetHeight}));
  bridgeBounds = bridgeElements.map(e=>({top:e.offsetTop,height:e.offsetHeight}));
  lenis?.resize(); dirty=true;
}
function configureMotion() {
  reduced = state.motion === 'reduced' || mediaMotion.matches;
  document.documentElement.classList.toggle('no-motion',reduced);
  document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
  lenis?.destroy(); lenis=null;
  if (!reduced) lenis = new Lenis({autoRaf:false,lerp:.14,smoothWheel:true,syncTouch:false,anchors:false});
  if (menu.open || about.open) lenis?.stop();
  if (reduced) { state={...state,playing:false}; spinPlaying=false; spinProgress=1; }
  const button=$<HTMLButtonElement>('#motion-toggle');
  button.setAttribute('aria-pressed',String(reduced));
  button.textContent=reduced?'Reduced motion on':'Reduce motion';
  if (mediaMotion.matches) button.title='Your operating system requests reduced motion.'; else button.removeAttribute('title');
  dirty=true; updateReplayUI();
}
function persist() { try { localStorage.setItem(storageKey,JSON.stringify(persistedState(state))); } catch { /* The complete experience works without persistence. */ } }
function setPressed(selector:string,value:string,attribute:string) { all<HTMLButtonElement>(`button${selector}`).forEach(b=>b.setAttribute('aria-pressed',String(b.getAttribute(attribute)===value))); }
function updateViewUI() {
  all<HTMLButtonElement>('[data-view-toggle]').forEach(b=>{b.innerHTML=`See from ${state.view==='A'?'B':'A'}’s side ${arrow}`;b.setAttribute('aria-label',`See the same court from ${state.view==='A'?'B':'A'}’s side`);});
  all('.view-caption').forEach(e=>softText(e,`Looking from ${state.view}’s side. A and B keep their identities.`,{instant:reduced}));
  $('#print-choice').textContent=`${state.returnChoice==='line'?'Down the line':'Crosscourt'} / ${state.view}’s view`;
  story.dataset.view=state.view;
}
function updateSpinUI() {
  setPressed('[data-spin]',state.comparisonSpinPreset,'data-spin');
  softText($('#spin-result'),state.comparisonSpinPreset==='topspin'?'Topspin bends the descent. This preset lands inside B’s baseline.':'With no spin, this same launch travels beyond B’s baseline. The result is long.',{instant:reduced});
  story.dataset.comparison=state.comparisonSpinPreset;
}
function updateStudyCaptions() {
  softText($('#replay-consequence'),state.returnChoice==='line'?'A changes direction to reach the sideline, then sends the ball back to B. A different opening remains on A’s left.':'A travels diagonally, sends a reply, then begins to recover. The opening remains on A’s right.',{instant:reduced});
  softText($('#contact-caption'),{before:'Before contact. The ball approaches A’s strings.',contact:'Contact. A short compression at the same point on the strings.',after:'After contact. A’s fixed topspin shot leaves diagonally toward B.'}[contactState],{instant:reduced});
  softText($('#bounce-caption'),{before:'Before the bounce. The ball descends toward the same marked point.',contact:'Contact. The ball’s bottom meets the clay; the shadow closes in.',after:'After the bounce. A small mark remains as the ball rises toward B.'}[bounceState],{instant:reduced});
  if(netProgress!==null) softText($('#net-caption'),netProgress===mainTrajectory.netCrossing!.t/mainTrajectory.duration?'The same ball clears the tape. Its landing is still ahead.':netProgress===1?'The ball lands inside B’s half. Now the ground answers.':'A sends the validated topspin shot toward B.',{instant:reduced});
}
function updateChoiceUI() {
  const line=state.returnChoice==='line';
  setPressed('[data-choice]',state.returnChoice,'data-choice');
  $('#choice-status').textContent=line?'Down the line selected. A moves the other way, leaving an opening to A’s left.':'Crosscourt selected. An opening remains to A’s right.';
  $('#replay-branch-label').textContent=line?'Down-the-line return':'Crosscourt return';
  updateStudyCaptions();
  $('#event-list').innerHTML=branches[state.returnChoice].events.map((event,i)=>`<li><button type="button" data-event="${i}" aria-label="Show moment ${i+1}: ${event.label}"><span>${String(i+1).padStart(2,'0')}</span><span>${event.label}</span></button></li>`).join('');
  story.dataset.returnChoice=state.returnChoice;
  updateViewUI(); updateReplayUI();
}
function updateReplayUI() {
  const branch=branches[state.returnChoice], at=sampleReplay(state.returnChoice,state.replayTime);
  const progress=clamp(state.replayTime/branch.duration);
  timeline.value=String(Math.round(progress*1000));
  timeline.setAttribute('aria-valuetext',`${Math.round(progress*100)} percent. ${at.event.label}.`);
  const percent=`${Math.round(progress*100)}%`;
  if ($('#replay-percent').textContent!==percent) $('#replay-percent').textContent=percent;
  const buttonState=reduced?'step':state.playing?'playing':'paused';
  if (buttonState!==replayButtonState) {
    playButton.innerHTML=reduced?`Next moment ${arrow}`:state.playing?'Pause rally <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3v14H7zm7 0h3v14h-3z" fill="currentColor"/></svg>':'Play rally <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7z" fill="currentColor"/></svg>';
    playButton.setAttribute('aria-pressed',String(state.playing));
    replayButtonState=buttonState;
  }
  if (previousEvent!==at.eventIndex || dirty) {
    softText($('#event-actor'),at.event.id==='a-bounce'?'The clay on A’s side':`${at.event.actor}’s ${at.event.id==='b-stop'?'receive':'racket'}`,{instant:reduced});
    softText($('#event-title'),at.event.label,{instant:reduced});
    softText($('#event-description'),at.event.description,{instant:reduced});
    all<HTMLButtonElement>('[data-event]').forEach((b,i)=>{if(i===at.eventIndex)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
    previousEvent=at.eventIndex;
  }
  $('#ch09').dataset.replayTime=state.replayTime.toFixed(4);
  $('#ch09').dataset.playing=String(state.playing);
}
function renderCourts() {
  const common={choice:state.returnChoice,view:state.view};
  const y=window.scrollY,h=innerHeight;
  const local=(i:number)=>clamp((y+h*.55-chapterBounds[i]!.top)/(chapterBounds[i]!.height*.65));
  courts.prepare.render({...common,progress:reduced?1:local(1),showSpace});
  courts.space.render({...common,progress:reduced?1:local(6),showSpace:true});
  courts.choice.render({...common,progress:1,showSpace:true});
  courts.replay.render({...common,time:state.replayTime,showSpace:true});
  courts.final.render({...common,progress:reduced||finalCompleted?1:local(9),showSpace:false});
}
function renderStory(scrollY:number) {
  const viewport=innerHeight;
  // Freeze the actual current playhead as the final bridge starts, rather than
  // waiting for chapter 10 (which would replay a stale B-strike position).
  const finalBridge=bridgeBounds[8]!;
  if(scrollY+viewport*.45>=finalBridge.top && scrollY<chapterBounds[9]!.top && state.playing){state={...state,playing:false};updateReplayUI();}
  exitReplayTime=state.replayTime;
  const probe=scrollY+Math.min(viewport*.42,350);
  let next=1;
  chapterBounds.forEach((b,i)=>{if(probe>=b.top)next=i+1;});
  if (next!==currentChapter) {
    if(currentChapter===9){exitReplayTime=state.replayTime;state={...state,playing:false};updateReplayUI();}
    if(currentChapter===4){spinPlaying=false;spinProgress=1;flights.comparison.render({spin:state.comparisonSpinPreset,progress:1});}
    currentChapter=next;
    $('.current-number').textContent=`${String(next).padStart(2,'0')} / 10`;
    story.dataset.chapter=String(next);
    all<HTMLAnchorElement>('#chapters-dialog nav a').forEach((a,i)=>{if(i+1===next)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
  }
  const progress=clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-viewport));
  state={...state,storyProgress:progress};
  $('.reading-progress>span').style.transform=`scaleX(${progress})`;
  if(scrollY>90){heroDeparted=true;hero.dataset.heroState='scroll';}
  else if(heroDeparted){hero.dataset.heroState='return';}
  else {const age=performance.now()-born;hero.dataset.heroState=age<450?'first-view':age<1100?'reveal':age<2000?'composed':'hold';}
  if(scrollY<90)heroVisited=true;
  const common={choice:state.returnChoice,view:state.view};
  chapterBounds.forEach((b,i)=>{
    if(b.top>scrollY+viewport*1.5 || b.top+b.height<scrollY-viewport*.5)return;
    const local=clamp((scrollY+viewport*.55-b.top)/(b.height*.65));
    chapters[i]!.dataset.progress=local.toFixed(3);
    if(i===1){courts.prepare.render({...common,progress:reduced?1:local,showSpace});preparing=!reduced&&local<(preparing?.54:.46);softText($('#preparation-state'),preparing?'A is preparing.<br>B remains across the net.':'A has found the contact position.<br>The next touch belongs to A.',{html:true,instant:reduced});}
    if(i===6)courts.space.render({...common,progress:reduced?1:local,showSpace:true});
    if(i===7)courts.choice.render({...common,progress:1,showSpace:true});
    if(i===8)courts.replay.render({...common,time:state.replayTime,showSpace:true});
    if(i===9)courts.final.render({...common,progress:reduced||finalCompleted?1:local,showSpace:false});
    if(i===4){const p=netProgress??(reduced?mainTrajectory.netCrossing!.t/mainTrajectory.duration:local);flights.net.render({spin:'topspin',progress:p});}
  });
  bridgeBounds.forEach((b,i)=>{
    if(b.top>scrollY+viewport*1.2 || b.top+b.height<scrollY-viewport*.5)return;
    const p=clamp((scrollY+viewport*.45-b.top)/Math.max(1,b.height*.8));
    const evaluated=reduced?.5:p;
    bridgeElements[i]!.dataset.progress=evaluated.toFixed(4);
    handoffs[i]!.render(evaluated,state.returnChoice,state.view,exitReplayTime);
  });
}
function redraw() {dirty=true;updateViewUI();updateSpinUI();updateStudyCaptions();updateReplayUI();renderCourts();flights.comparison.render({spin:state.comparisonSpinPreset,progress:spinProgress});contact.render(contactState);bounce.render(bounceState);}
function goTo(hash:string,smooth=true,historyMode:'push'|'none'='push') {
  if(!/^#ch(?:0[1-9]|10)$/.test(hash))return;
  const target=$(hash);
  const top=target.getBoundingClientRect().top+scrollY-parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header'));
  if(historyMode==='push'&&location.hash!==hash){try{history.pushState({chapter:hash},'',hash);}catch{/* Sandboxed/offline embedded previews can scroll without History API access. */}}
  if(lenis&&smooth&&!reduced)lenis.scrollTo(Math.max(0,top),{duration:.85});
  else if(lenis)lenis.scrollTo(Math.max(0,top),{immediate:true});
  else window.scrollTo({top:Math.max(0,top),behavior:'instant'});
  dirty=true;
}
function openDialog(dialog:HTMLDialogElement,opener:HTMLElement) {dialogOpener=opener;dialog.showModal();lenis?.stop();}
function closeDialog(dialog:HTMLDialogElement,restore=true) {
  dialog.close();
  // A chapter link navigates in this task, before the queued close event.
  if(!menu.open&&!about.open)lenis?.start();
  if(restore)dialogOpener?.focus({preventScroll:true});
}
function stepReplay() {
  const events=branches[state.returnChoice].events;
  const next=events.find(e=>e.time>state.replayTime+.0001);
  state=seekReplay(state,next?.time??0);dirty=true;updateReplayUI();courts.replay.render({choice:state.returnChoice,view:state.view,time:state.replayTime,showSpace:true});persist();
}

document.addEventListener('click',event=>{
  const target=event.target instanceof Element?event.target:null;if(!target)return;
  const link=target.closest<HTMLAnchorElement>('a[href^="#"]');
  if(link && /^#ch(?:0[1-9]|10)$/.test(link.hash)) {
    event.preventDefault(); if(menu.open)closeDialog(menu,false); goTo(link.hash);
    if(link.id==='watch-rally'){state=seekReplay(state,0);previousEvent=-1;dirty=true;updateReplayUI();}
    return;
  }
  const button=target.closest<HTMLButtonElement>('button');if(!button)return;
  if(button.id==='menu-open')openDialog(menu,button);
  else if(button.id==='about-open')openDialog(about,button);
  else if(button.classList.contains('close-dialog'))closeDialog(button.closest('dialog')!);
  else if(button.id==='hero-positions') {const open=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(open));$('.hero-labels').hidden=!open;button.innerHTML=`${open?'Hide':'Explore'} the positions <span>${open?'−':'+'}</span>`;}
  else if(button.id==='space-toggle'){showSpace=!showSpace;button.setAttribute('aria-pressed',String(showSpace));button.innerHTML=`${showSpace?'Hide':'Show'} the open court <span>${showSpace?'−':'+'}</span>`;dirty=true;}
  else if(button.hasAttribute('data-contact')){contactState=button.dataset.contact as typeof contactState;setPressed('[data-contact]',contactState,'data-contact');contact.render(contactState);updateStudyCaptions();}
  else if(button.hasAttribute('data-bounce')){bounceState=button.dataset.bounce as typeof bounceState;setPressed('[data-bounce]',bounceState,'data-bounce');bounce.render(bounceState);updateStudyCaptions();}
  else if(button.hasAttribute('data-spin')||button.id==='reset-comparison'){state=setComparison(state,(button.dataset.spin??'topspin') as SpinPreset);spinProgress=reduced?1:0;spinPlaying=!reduced;updateSpinUI();flights.comparison.render({spin:state.comparisonSpinPreset,progress:spinProgress});dirty=true;persist();}
  else if(button.hasAttribute('data-flight')){netProgress=button.dataset.flight==='net'?(mainTrajectory.netCrossing!.t/mainTrajectory.duration):Number(button.dataset.flight);setPressed('[data-flight]',button.dataset.flight!,'data-flight');flights.net.render({spin:'topspin',progress:netProgress});updateStudyCaptions();dirty=true;}
  else if(button.hasAttribute('data-choice')){const choice=button.dataset.choice as ReturnChoice;state=chooseReturn(state,choice);exitReplayTime=state.replayTime;finalCompleted=false;previousEvent=-1;updateChoiceUI();redraw();persist();$('#export-status').textContent='A vector keepsake. No account needed.';}
  else if(button.hasAttribute('data-view-toggle')){state={...state,view:state.view==='A'?'B':'A'};redraw();persist();}
  else if(button.id==='replay-play'){
    if(reduced){stepReplay();return;}
    if(!state.playing&&state.replayTime>=branches[state.returnChoice].duration-.0001)state=seekReplay(state,0);
    const starting=!state.playing&&state.replayTime===0;state={...state,playing:!state.playing};lastFrame=performance.now();if(starting)audio.impact('racket');updateReplayUI();dirty=true;
  }
  else if(button.id==='replay-step')stepReplay();
  else if(button.id==='replay-reset'){state=seekReplay(state,0);dirty=true;updateReplayUI();courts.replay.render({choice:state.returnChoice,view:state.view,time:0,showSpace:true});persist();}
  else if(button.hasAttribute('data-event')){state=seekReplay(state,branches[state.returnChoice].events[Number(button.dataset.event)]!.time);dirty=true;updateReplayUI();courts.replay.render({choice:state.returnChoice,view:state.view,time:state.replayTime,showSpace:true});persist();}
  else if(button.id==='motion-toggle'){state={...state,motion:state.motion==='reduced'?'system':'reduced'};configureMotion();redraw();persist();}
  else if(button.id==='save-rally'){
    try {finalCompleted=true;courts.final.render({choice:state.returnChoice,view:state.view,progress:1});const svg=createRallySVG(state.returnChoice,state.view);const blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`RALLY-${state.returnChoice}-${state.view.toLowerCase()}-view.svg`;a.hidden=true;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);$('#export-status').textContent='Your SVG is ready. Check your browser’s downloads.';}
    catch{$('#export-status').textContent='The download could not start. Your rally is still here; please try again.';}
  }
},{signal});
soundButton.addEventListener('click',async()=>{soundButton.disabled=true;const desired=!state.sound;const enabled=await audio.setEnabled(desired);state={...state,sound:desired&&enabled};soundButton.setAttribute('aria-pressed',String(state.sound));soundButton.querySelector('span')!.textContent=state.sound?'Sound on':desired&&!enabled?'Sound unavailable':'Sound off';soundButton.disabled=false;},{signal});
timeline.addEventListener('input',()=>{state=seekReplay(state,Number(timeline.value)/1000*branches[state.returnChoice].duration);dirty=true;updateReplayUI();courts.replay.render({choice:state.returnChoice,view:state.view,time:state.replayTime,showSpace:true});},{signal});
timeline.addEventListener('change',persist,{signal});
for(const dialog of [menu,about]) {
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog(dialog);},{signal});
  dialog.addEventListener('close',()=>{if(!menu.open&&!about.open)lenis?.start();dialogOpener?.focus({preventScroll:true});},{signal});
}
window.addEventListener('scroll',()=>{dirty=true;},{passive:true,signal});
window.addEventListener('resize',()=>{measure();},{passive:true,signal});
window.addEventListener('popstate',()=>{goTo(location.hash||'#ch01',false,'none');},{signal});
window.addEventListener('hashchange',()=>{goTo(location.hash,false,'none');},{signal});
window.addEventListener('pagehide',()=>{state={...state,playing:false};persist();audio.suspend();},{signal});
window.addEventListener('pageshow',()=>{lastFrame=0;measure();dirty=true;},{signal});
mediaMotion.addEventListener('change',()=>{configureMotion();redraw();},{signal});
document.addEventListener('visibilitychange',()=>{
  state={...state,playing:false};spinPlaying=false;spinProgress=1;flights.comparison.render({spin:state.comparisonSpinPreset,progress:1});updateReplayUI();persist();
  if(document.hidden){cancelAnimationFrame(frame);audio.suspend();}else{lastFrame=0;audio.resume();dirty=true;frame=requestAnimationFrame(tick);}
},{signal});
all<HTMLImageElement>('img').forEach(img=>{
  const onFailure=()=>{img.classList.add('media-failed');const parent=img.closest('.hero-art')??img.parentElement;parent?.classList.add('image-unavailable');measure();};
  img.addEventListener('error',onFailure,{signal});
  img.addEventListener('load',()=>{img.classList.remove('media-failed');img.closest('.image-unavailable')?.classList.remove('image-unavailable');measure();},{signal});
  if(img.complete && !img.naturalWidth)onFailure();
});

function tick(now:number) {
  if(document.hidden)return;
  const dt=lastFrame?Math.min(.1,(now-lastFrame)/1000):0;lastFrame=now;
  lenis?.raf(now);
  const y=window.scrollY;
  if(state.playing){
    const bounds=chapterBounds[8]!;
    const replayVisible=bounds.top<y+innerHeight && bounds.top+bounds.height>y+76;
    if(replayVisible && !menu.open && !about.open){
      const prior=state.replayTime;state=advanceReplay(state,dt*.31);
      for(const e of branches[state.returnChoice].events)if(e.time>prior&&e.time<=state.replayTime)audio.impact(e.id==='a-bounce'?'ground':e.id==='b-stop'?'catch':'racket');
      courts.replay.render({choice:state.returnChoice,view:state.view,time:state.replayTime,showSpace:true});updateReplayUI();
    }else{state={...state,playing:false};updateReplayUI();}
  }
  if(spinPlaying && currentChapter===4){spinProgress=clamp(spinProgress+dt*.52);flights.comparison.render({spin:state.comparisonSpinPreset,progress:spinProgress});if(spinProgress===1)spinPlaying=false;}
  if(dirty||y!==previousScroll||(!heroDeparted&&now-born<2200)){renderStory(y);previousScroll=y;dirty=false;}
  if(now-lastSave>1000){persist();lastSave=now;}
  frame=requestAnimationFrame(tick);
}

measure();configureMotion();updateChoiceUI();updateSpinUI();redraw();
setPressed('[data-flight]','','data-flight');
// Set all static alternatives before the first frame; direct entry never needs prior chapters.
handoffs.forEach(h=>h.render(reduced?.5:0,state.returnChoice,state.view,exitReplayTime));
flights.net.render({spin:'topspin',progress:.5});
const resizeObserver=new ResizeObserver(()=>measure());resizeObserver.observe(story);
void document.fonts.ready.then(()=>{measure();});
const navigation=performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined;
requestAnimationFrame(()=>{
  measure();
  if(navigation?.type==='reload' && state.storyProgress>.001){const top=state.storyProgress*Math.max(0,document.documentElement.scrollHeight-innerHeight);if(lenis)lenis.scrollTo(top,{immediate:true});else window.scrollTo(0,top);}
  else if(location.hash)goTo(location.hash,false,'none');
  frame=requestAnimationFrame(tick);
  app.dataset.ready='true';performance.mark('rally-interactive');
});
if(import.meta.hot)import.meta.hot.dispose(()=>{abort.abort();resizeObserver.disconnect();cancelAnimationFrame(frame);lenis?.destroy();audio.dispose();});
