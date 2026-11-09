import './style.css';
import Lenis from 'lenis';
import { appMarkup, chapters } from './content.ts';
import { enumeratePaths, binomialCoefficients, expectedCounts, experimentSVG, prefixExperiment, type Experiment, type SamplePath } from './engine.ts';
import { restoreState, serializeState, reduceState, currentPersonal, teachingRounds, heroDemo, type AppAction, type LayerCount, type RightProbability, type SampleCount } from './state.ts';
import { evaluateNarrative, type NarrativeFrame } from './narrative.ts';
import { renderScene, type PlaybackView, type SceneResult } from './scene.ts';
import { softText } from '../../shared/soft-swap.ts';

const STORAGE_KEY='odds.playground.v1';
const $=<T extends Element=HTMLElement>(selector:string):T=>{const el=document.querySelector<T>(selector);if(!el)throw new Error(`Missing interface element: ${selector}`);return el;};
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
let saved:string|null=null,storageAvailable=true;
try{saved=localStorage.getItem(STORAGE_KEY);}catch{storageAvailable=false;}
let state=restoreState(saved);
$('#app').innerHTML=appMarkup();
const svg=$<SVGSVGElement>('#scene'),canvas=$<HTMLCanvasElement>('#portrait'),art=$('#stage-art'),menu=$<HTMLDialogElement>('#chapter-menu');
const sections=Array.from(document.querySelectorAll<HTMLElement>('.chapter'));
const motionMedia=matchMedia('(prefers-reduced-motion: reduce)');
const mobileMedia=matchMedia('(max-width: 760px)');
let reduced=false, lenis:Lenis|null=null, dirty=true, anchors:number[]=[], measureFrame=0, loopId=0, lastFrameTime=0;
let activeFrame:NarrativeFrame={chapter:0,next:0,progress:0,transition:null};
let sceneResult:SceneResult={label:'',foot:'',dots:[],canvasActive:false};
let endpoint:number|null=null,prefix='',selectedRoute:string|null=null,branchIndex=3,ballSlot:number|null=null;
let playback:(PlaybackView & {playing:boolean;duration:number})|null=null;
let audioContext:AudioContext|null=null;
let lastAnnounce='';
let canvasAvailable=true;
try{canvasAvailable=!!canvas.getContext('2d');}catch{canvasAvailable=false;}

function html(selector:string,value:string):void{const el=$(selector);if(el.innerHTML!==value)el.innerHTML=value;}
function announce(message:string):void{if(message!==lastAnnounce){$('#announcement').textContent=message;lastAnnounce=message;}}
function tokens(path:SamplePath|undefined,current=-1):string{return path?`<div class="path-tokens" aria-label="${path.directions.map(d=>d==='L'?'Left':'Right').join(', ')}">${path.directions.map((d,i)=>`<b class="${d==='R'?'right ':''}${i===current?'current':''}">${d}</b>`).join('')}</div>`:'';}
function pathReadout(round:Experiment):string{const p=round.paths.at(-1);return p?tokens(p)+`<div class="path-caption"><span>Ball ${round.N} · ${p.k} right ${p.k===1?'turn':'turns'}</span><span>Endpoint ${p.k}</span></div>`:'';}
function dataTable(round:Experiment,label:string):string{
  const expected=expectedCounts(round.n,round.p,round.N);
  return `<div class="data-scroll" data-lenis-prevent><table><caption>${escape(label)} · n=${round.n}, p=${round.p.toFixed(2)}, N=${round.N}<br>Seed: ${escape(round.seed)}</caption><thead><tr><th scope="col">Endpoint</th><th scope="col">Observed</th><th scope="col">Expected</th><th scope="col">Observed %</th><th scope="col">Theory %</th></tr></thead><tbody>${round.counts.map((count,k)=>`<tr><th scope="row">${k}</th><td>${count}</td><td>${expected[k].toFixed(3)}</td><td>${round.N?(count/round.N*100).toFixed(2):'0.00'}%</td><td>${(expected[k]/Math.max(1,round.N)*100).toFixed(2)}%</td></tr>`).join('')}</tbody><tfoot><tr><th scope="row">Total</th><td>${round.N}</td><td>${round.N.toFixed(3)}</td><td>${round.N?'100.00':'0.00'}%</td><td>100.00%</td></tr></tfoot></table></div>`;
}
function syncBallChoices():void{
  const paths=teachingRounds[1].paths;
  const visible=paths.map((p,index)=>({p,index})).filter(({p})=>ballSlot===null||p.k===ballSlot);
  const select=$<HTMLSelectElement>('#ball-select');
  select.innerHTML=visible.length?visible.map(({p,index})=>`<option value="${index}">Ball ${index+1} · endpoint ${p.k}</option>`).join(''):'<option value="">No balls in this endpoint</option>';
  select.disabled=!visible.length;
  const isVisible=visible.some(v=>v.index===state.selectedBall);
  if(visible.length&&!isVisible){state=reduceState(state,{type:'select-ball',index:visible[0].index});persist();}
  select.value=String(state.selectedBall);
  for(const action of ['ball-previous','ball-next'])$<HTMLButtonElement>(`[data-action="${action}"]`).disabled=visible.length<2;
}
function syncRoutes():void{
  const filtered=enumeratePaths(4).filter(p=>(endpoint===null||p.k===endpoint)&&p.directions.join('').startsWith(prefix));
  if(selectedRoute&&!filtered.some(p=>p.directions.join('')===selectedRoute))selectedRoute=null;
  html('#routes-result',`<p>${filtered.length} ${filtered.length===1?'route':'routes'}${endpoint!==null?` to endpoint ${endpoint}`:''}${prefix?` beginning ${prefix}`:''}.</p>`+filtered.map(p=>`<button type="button" class="route-button ${selectedRoute===p.directions.join('')?'active':''}" data-route="${p.directions.join('')}" aria-pressed="${selectedRoute===p.directions.join('')}" aria-label="Inspect route ${p.directions.join(' ')} to endpoint ${p.k}">${p.directions.join('')}</button>`).join(''));
  dirty=true;
}
function syncBranch():void{
  const sequence=state.branch.paths.map(p=>p.directions[0]);
  html('#branch-path',sequence.map((d,i)=>`<b class="${d==='R'?'right ':''}${i===branchIndex?'current':''}">${d}</b>`).join(''));
  $('#branch-path').setAttribute('aria-label',`Four independent choices: ${sequence.join(', ')}. Inspecting choice ${branchIndex+1}: ${sequence[branchIndex]==='L'?'left':'right'}. Use left and right arrow keys to inspect.`);
  $('#branch-result').textContent=`${state.branch.seed==='odds-branch-demo'?'Saved teaching example':'Four fresh independent choices'} · inspecting choice ${branchIndex+1}: ${sequence[branchIndex]==='L'?'left':'right'}.`;
}
function syncCopy():void{
  const hero=state.hero??heroDemo;
  $<HTMLButtonElement>('#hero-drop').innerHTML=`${state.hero?'Drop another ball':'Drop the first ball'} <span class="button-ball" aria-hidden="true"></span>`;
  $<HTMLButtonElement>('#hero-drop').disabled=hero.N>=10000;
  const entranceSummary=state.hero?`<strong>${state.hero.N} ${state.hero.N===1?'ball':'balls'} in your entrance round.</strong> Eight choices each, p = 0.50. The demonstration was kept separate.`:'The six balls in the tray are a labelled demonstration. Your first drop starts a separate round.';
  const workbenchSummary=state.personal?`<br><strong>${state.personal.seed.startsWith('odds-workbench-demo')?'Workbench demonstration continuation':'Saved workbench round'}</strong> · n = ${state.personal.n} · p = ${state.personal.p.toFixed(2)} · N = ${state.personal.N}. Kept separate from the entrance round.`:'';
  html('#hero-result',entranceSummary+workbenchSummary);
  html('#hero-path',state.hero?pathReadout(state.hero):'');
  syncBranch();
  const counts=binomialCoefficients(8);
  html('#theory-data',`<div class="data-scroll"><table><caption>Exact enumeration · n = 8, p = 0.50</caption><thead><tr><th>Endpoint</th><th>Paths</th><th>Probability</th></tr></thead><tbody>${counts.map((c,k)=>`<tr><th>${k}</th><td>${c}</td><td>${(c/256*100).toFixed(5)}%</td></tr>`).join('')}</tbody><tfoot><tr><th>Total</th><td>256</td><td>100%</td></tr></tfoot></table></div>`);
  html('#small-result',`Round A: <strong>${state.small[0].counts[4]}</strong> in the middle. Round B: <strong>${state.small[1].counts[4]}</strong>. Each contains exactly 16 balls.`);
  html('#small-data',state.small.map((r,i)=>dataTable(r,`Round ${i?'B':'A'}`)).join(''));
  $<HTMLButtonElement>('#small-undo').disabled=!state.previousSmall;
  document.querySelectorAll<HTMLButtonElement>('[data-action="bias-run"]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.p)===state.bias.p)));
  html('#bias-result',`Saved round: <strong>n = 8 · p = ${state.bias.p.toFixed(2)} · N = 64.</strong><br>Theoretical mean endpoint: ${(8*state.bias.p).toFixed(0)}. Any individual ball can still take another route.`);
  html('#bias-data',dataTable(state.bias,'Bias experiment'));
  $<HTMLButtonElement>('#bias-undo').disabled=!state.previousBias;
  document.querySelectorAll<HTMLButtonElement>('[data-action="comparison-size"]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.n)===state.comparisonN)));
  $('#comparison-result').textContent=`${state.comparisonN} balls in each saved evening. All earlier sample IDs and paths are preserved. The middle evening continues to 256 in the next chapter.`;
  html('#comparison-data',teachingRounds.map((r,i)=>dataTable(prefixExperiment(r,state.comparisonN),`Evening ${i+1}`)).join(''));
  syncBallChoices();
  const selected=teachingRounds[1].paths[state.selectedBall];
  html('#ball-detail',`<div class="ticket-title"><span>Ball ${state.selectedBall+1}</span><span>Endpoint ${selected.k}</span></div>${tokens(selected)}<div class="sample-id">${selected.id}</div>`);
  html('#portrait-data',dataTable(teachingRounds[1],'The middle evening · complete portrait'));
  const personal=currentPersonal(state),demo=personal.seed.startsWith('odds-workbench-demo');
  html('#personal-result',`<strong>${demo?'Labelled demonstration'+(personal.N>64?' continuation':''):'Your saved result'} · ${personal.N} balls.</strong><br>n = ${personal.n} · p = ${personal.p.toFixed(2)} · ${personal.n+1} endpoints.<br><span class="saved-seed">Seed: ${escape(personal.seed)}</span>`);
  html('#personal-data',dataTable(personal,demo?'Demonstration result':'Personal experiment'));
  $<HTMLButtonElement>('#personal-undo').disabled=!state.previousPersonal;
  html('#ending-result',`<strong>${personal.N} balls · ${personal.n} choices · p = ${personal.p.toFixed(2)}.</strong><br>${demo?'Continuing the labelled demonstration. Your next click adds exactly one ball.':'Your next click adds exactly one ball to this saved round.'}`);
  html('#ending-path',pathReadout(personal));
  $<HTMLButtonElement>('#next-ball').disabled=personal.N>=10000;
  $<HTMLButtonElement>('#next-ball').innerHTML=personal.N>=10000?'This round has reached 10,000 balls':`Drop the next ball <span class="button-ball" aria-hidden="true"></span>`;
  const soundButton=$<HTMLButtonElement>('#sound-toggle');soundButton.setAttribute('aria-pressed',String(state.sound));soundButton.setAttribute('aria-label',state.sound?'Turn sound off':'Turn sound on');soundButton.querySelector('span')!.textContent=state.sound?'Sound on':'Sound off';
  $('#story').dataset.personalN=String(personal.N);$('#story').dataset.personalLayers=String(personal.n);$('#story').dataset.personalSeed=personal.seed;
  $('#story').dataset.heroN=String(state.hero?.N??0);
  syncDraftNote();syncPlaybar();scheduleMeasure();dirty=true;
}
function persist():void{try{localStorage.setItem(STORAGE_KEY,serializeState(state));}catch{storageAvailable=false;showStorageNotice();}}
function showStorageNotice():void{const el=$('#storage-notice');el.hidden=false;el.textContent='Browser storage is unavailable. This visit still works; download an SVG to keep your result.';}
function dispatch(action:AppAction,message?:string):void{state=reduceState(state,action);persist();syncCopy();if(message)announce(message);}

function knock():void{
  if(!state.sound)return;
  try{audioContext??=new AudioContext();void audioContext.resume();const t=audioContext.currentTime,osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='sine';osc.frequency.setValueAtTime(390,t);osc.frequency.exponentialRampToValueAtTime(140,t+.09);gain.gain.setValueAtTime(.045,t);gain.gain.exponentialRampToValueAtTime(.001,t+.12);osc.connect(gain);gain.connect(audioContext.destination);osc.start(t);osc.stop(t+.13);}catch{announce('Sound is unavailable in this browser. Every experiment remains fully visible.');}
}
function startPlayback(section:number,round:Experiment,mode:'path'|'round'='path'):void{
  playback={section,round,mode,progress:reduced?1:0,playing:!reduced,duration:mode==='round'?Math.min(5500,Math.max(1400,round.N*45)):round.n*175+250};
  syncPlaybar();dirty=true;knock();
}
function syncPlaybar():void{
  document.querySelectorAll<HTMLElement>('[data-playbar]').forEach(bar=>{const active=!!playback&&Number(bar.dataset.playbar)===playback.section;bar.hidden=!active;if(!active||!playback)return;
    const toggle=bar.querySelector<HTMLButtonElement>('[data-action="play-toggle"]')!;toggle.textContent=playback.progress>=1?'Replay':playback.playing?'Pause':'Play';
    bar.querySelector<HTMLButtonElement>('[data-action="play-step"]')!.disabled=playback.progress>=1;
    const total=playback.mode==='round'?playback.round.N:playback.round.n;
    bar.querySelector('.play-progress')!.textContent=`${Math.floor(playback.progress*total)} / ${total} ${playback.mode==='round'?'balls':'choices'} shown`;
  });
}
function download():void{
  const round=currentPersonal(state),blob=new Blob([experimentSVG(round)],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`ODDS-n${round.n}-p${round.p.toFixed(2)}-N${round.N}.svg`;document.body.append(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),30000);announce(`Saved an SVG for this ${round.N}-ball round, with its current seed, rules and exact counts.`);
}

document.addEventListener('click',event=>{
  const target=event.target instanceof Element?event.target:null;if(!target)return;
  const route=target.closest<HTMLButtonElement>('[data-route]');
  if(route){selectedRoute=route.dataset.route!;syncRoutes();document.querySelector<HTMLButtonElement>(`[data-route="${selectedRoute}"]`)?.focus({preventScroll:true});return;}
  const button=target.closest<HTMLButtonElement>('[data-action]');if(!button||button.disabled)return;
  const action=button.dataset.action;
  switch(action){
    case 'hero-drop':dispatch({type:'hero-drop'},'One ball added to your separate entrance round.');startPlayback(0,state.hero!);break;
    case 'branch-draw':branchIndex=3;dispatch({type:'branch-draw'},'Four independent one-step choices saved.');knock();break;
    case 'routes-reset':endpoint=null;prefix='';selectedRoute=null;$<HTMLSelectElement>('#endpoint').value='all';$<HTMLSelectElement>('#prefix').value='';syncRoutes();break;
    case 'small-new':dispatch({type:'small-new'},'Two new independent 16-ball rounds saved. The previous pair can be restored.');knock();break;
    case 'small-undo':dispatch({type:'small-undo'},'The previous pair of rounds has been restored.');break;
    case 'bias-run':dispatch({type:'bias-run',p:Number(button.dataset.p) as RightProbability},'A separate 64-ball round has been saved with the chosen probability.');knock();break;
    case 'bias-undo':dispatch({type:'bias-undo'},'The previous bias round and its rules are restored.');break;
    case 'comparison-size':dispatch({type:'comparison-size',N:Number(button.dataset.n) as 16|64|128},'The saved teaching sequences are shown at the selected sample size. No results were redrawn.');break;
    case 'ball-previous':case 'ball-next':{
      const visible=teachingRounds[1].paths.map((p,index)=>({p,index})).filter(({p})=>ballSlot===null||p.k===ballSlot);const current=visible.findIndex(v=>v.index===state.selectedBall),sign=action==='ball-next'?1:-1;
      if(visible.length){const index=visible[(current+sign+visible.length)%visible.length].index;dispatch({type:'select-ball',index},`Selected ball ${index+1}, endpoint ${teachingRounds[1].paths[index].k}.`);}break;
    }
    case 'personal-replay':startPlayback(8,currentPersonal(state),'round');announce('Replaying the saved round. Its seed and results remain unchanged.');break;
    case 'personal-new':dispatch({type:'personal-new'},'A new round with the same saved rules is ready.');syncDraftFromSaved();startPlayback(8,currentPersonal(state),'round');break;
    case 'personal-undo':dispatch({type:'personal-undo'},'The previous complete round has been restored.');syncDraftFromSaved();playback=null;syncPlaybar();break;
    case 'personal-next':dispatch({type:'personal-next'},'Exactly one ball has been appended to the current saved round.');startPlayback(9,currentPersonal(state));break;
    case 'download':download();break;
    case 'play-toggle':if(playback&&Number(button.dataset.section)===playback.section){if(playback.progress>=1){playback.progress=0;playback.playing=!reduced;if(reduced)playback.progress=1;}else playback.playing=!playback.playing;syncPlaybar();dirty=true;}break;
    case 'play-step':if(playback){playback.playing=false;playback.progress=Math.min(1,playback.progress+1/(playback.mode==='round'?playback.round.N:playback.round.n));syncPlaybar();dirty=true;}break;
    case 'play-end':if(playback){playback.progress=1;playback.playing=false;syncPlaybar();dirty=true;}break;
  }
});

$<HTMLFormElement>('#experiment-form').addEventListener('submit',event=>{
  event.preventDefault();const n=Number($<HTMLSelectElement>('#layers').value) as LayerCount,p=Number($<HTMLSelectElement>('#probability').value) as RightProbability,N=Number($<HTMLSelectElement>('#sample-count').value) as SampleCount;
  dispatch({type:'personal-run',n,p,N},`Saved a new ${N}-ball round with ${n} choices and right-turn probability ${p.toFixed(2)}.`);syncDraftFromSaved();startPlayback(8,currentPersonal(state),'round');
});
function syncDraftNote():void{
  const r=currentPersonal(state),n=Number($<HTMLSelectElement>('#layers').value),p=Number($<HTMLSelectElement>('#probability').value),N=Number($<HTMLSelectElement>('#sample-count').value);
  $('#draft-note').textContent=n===r.n&&p===r.p&&N===r.N?'The saved result below uses these rules. Run again to start a new round.':`Saved result: n = ${r.n}, p = ${r.p.toFixed(2)}, N = ${r.N}. The settings above apply only when you run a new round.`;
}
function syncDraftFromSaved():void{const r=currentPersonal(state);$<HTMLSelectElement>('#layers').value=String(r.n);$<HTMLSelectElement>('#probability').value=String(r.p);$<HTMLSelectElement>('#sample-count').value=String([16,64,256].includes(r.N)?r.N:256);syncDraftNote();}
for(const id of ['layers','probability','sample-count'])$( '#'+id).addEventListener('change',syncDraftNote);
$('#endpoint').addEventListener('change',event=>{const value=(event.target as HTMLSelectElement).value;endpoint=value==='all'?null:Number(value);syncRoutes();});
$('#prefix').addEventListener('change',event=>{prefix=(event.target as HTMLSelectElement).value;syncRoutes();});
$('#branch-path').addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();branchIndex=(branchIndex+(event.key==='ArrowLeft'?3:1))%4;syncBranch();dirty=true;}});
$('#ball-slot').addEventListener('change',event=>{const v=(event.target as HTMLSelectElement).value;ballSlot=v==='all'?null:Number(v);syncCopy();});
$('#ball-select').addEventListener('change',event=>{const index=Number((event.target as HTMLSelectElement).value);dispatch({type:'select-ball',index},`Selected ball ${index+1}, endpoint ${teachingRounds[1].paths[index].k}.`);});
canvas.addEventListener('click',event=>{
  if(!sceneResult.canvasActive)return;const rect=canvas.getBoundingClientRect(),scale=Math.min(rect.width/1000,rect.height/900),x=(event.clientX-rect.left-(rect.width-1000*scale)/2)/scale,y=(event.clientY-rect.top-(rect.height-900*scale)/2)/scale;
  const nearest=sceneResult.dots.map(d=>({dot:d,distance:Math.hypot(x-d.x,y-d.y)})).filter(v=>v.distance<=Math.max(v.dot.r*1.5,8)).sort((a,b)=>a.distance-b.distance)[0]?.dot;
  if(nearest){ballSlot=null;$<HTMLSelectElement>('#ball-slot').value='all';dispatch({type:'select-ball',index:nearest.index},`Selected ball ${nearest.index+1}, endpoint ${nearest.k}.`);}
});

$('#menu-toggle').addEventListener('click',()=>{menu.showModal();});
$('#menu-close').addEventListener('click',()=>{menu.close();$('#menu-toggle').focus({preventScroll:true});});
menu.addEventListener('click',event=>{if(event.target===menu){const r=menu.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)menu.close();}});
menu.addEventListener('close',()=>{$('#menu-toggle').focus({preventScroll:true});});
$('#sound-toggle').addEventListener('click',()=>{dispatch({type:'sound',enabled:!state.sound},state.sound?'Sound is off.':'Soft sound is on.');if(state.sound)knock();});
$('#motion-toggle').addEventListener('click',()=>{dispatch({type:'motion',value:state.motion==='reduced'?'system':'reduced'});configureMotion();announce(reduced?'Reduced motion is active. All chapters and experiments are available.':'System motion preference restored.');});

function configureMotion():void{
  reduced=state.motion==='reduced'||motionMedia.matches;document.documentElement.dataset.motion=reduced?'reduced':'full';
  lenis?.destroy();lenis=null;
  if(!reduced)lenis=new Lenis({autoRaf:false,autoResize:true,lerp:.13,smoothWheel:true,syncTouch:false,anchors:false,respectReducedMotion:true,stopInertiaOnNavigate:true,prevent:node=>!!node.closest('dialog,[data-lenis-prevent]')});
  if(reduced&&playback){playback.progress=1;playback.playing=false;syncPlaybar();}
  const b=$<HTMLButtonElement>('#motion-toggle');b.setAttribute('aria-pressed',String(reduced));b.textContent=state.motion==='reduced'?'Use system motion':motionMedia.matches?'Reduced by system':'Less motion';dirty=true;
}
motionMedia.addEventListener('change',configureMotion);

function measure():void{
  measureFrame=0;
  // The mobile opening keeps its heading in normal flow, above the apparatus.
  // Once it scrolls past, the shared scene pins below the header as usual.
  if(mobileMedia.matches){const top=$('#title-01').getBoundingClientRect().bottom+window.scrollY+12;$('#story').style.setProperty('--mobile-art-start',`${Math.round(top)}px`);}
  else $('#story').style.removeProperty('--mobile-art-start');
  anchors=sections.map(el=>el.offsetTop);dirty=true;
}
function scheduleMeasure():void{if(!measureFrame)measureFrame=requestAnimationFrame(measure);}
const resizeObserver=new ResizeObserver(scheduleMeasure);resizeObserver.observe($('#story'));
window.addEventListener('resize',scheduleMeasure,{passive:true});mobileMedia.addEventListener('change',scheduleMeasure);
document.fonts.ready.then(scheduleMeasure).catch(()=>{});
document.querySelectorAll('details').forEach(el=>el.addEventListener('toggle',scheduleMeasure));
window.addEventListener('scroll',()=>{dirty=true;},{passive:true});

function gotoHash(hash:string,instant=false):void{
  const target=document.getElementById(hash.slice(1));if(!target)return;
  if(target instanceof HTMLDetailsElement)target.open=true;
  measure();const destination=target.classList.contains('chapter')?target.offsetTop:target.getBoundingClientRect().top+window.scrollY-(mobileMedia.matches?innerHeight*.42+90:120);
  if(lenis)lenis.scrollTo(destination,{immediate:instant,duration:.85,lock:false});else window.scrollTo({top:destination,behavior:'instant'});
  const focus=target.querySelector<HTMLElement>('h1,h2')??target;focus.tabIndex=-1;focus.focus({preventScroll:true});dirty=true;
}
document.addEventListener('click',event=>{
  const target=event.target instanceof Element?event.target.closest<HTMLAnchorElement>('a[href^="#"]'):null;
  if(!target)return;const href=target.getAttribute('href')!;if(!document.getElementById(href.slice(1)))return;event.preventDefault();
  if(menu.open)menu.close();history.pushState(null,'',href);gotoHash(href);
});
window.addEventListener('popstate',()=>{if(location.hash)gotoHash(location.hash,true);else{lenis?.scrollTo(0,{immediate:true});window.scrollTo(0,0);dirty=true;}});
window.addEventListener('pageshow',()=>{scheduleMeasure();dirty=true;});

let visibleChapter=-1;
function draw():void{
  if(anchors.length!==10)return;
  activeFrame=evaluateNarrative(window.scrollY,anchors,reduced);
  sceneResult=renderScene(svg,canvas,state,activeFrame,{mobile:mobileMedia.matches,endpoint,prefix,route:selectedRoute,playback,canvasAvailable,branchIndex});
  softText($('#scene-label'),sceneResult.label,{instant:reduced});softText($('#scene-foot'),sceneResult.foot,{instant:reduced});art.classList.toggle('portrait-active',sceneResult.canvasActive);
  // A dead band around the half-way point keeps the header on one chapter while the reader rests there.
  const crossing=activeFrame.next!==activeFrame.chapter&&visibleChapter===activeFrame.next?.42:.58;
  const visible=activeFrame.progress>crossing?activeFrame.next:activeFrame.chapter;visibleChapter=visible;
  softText($('#chapter-count'),`${String(visible+1).padStart(2,'0')} / 10`,{instant:reduced});softText($('#current-chapter-title'),chapters[visible].short,{instant:reduced});
  document.querySelectorAll<HTMLAnchorElement>('.chapter-dots a').forEach((a,i)=>{if(i===visible)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});
  dirty=false;
}
function loop(time:number):void{
  if(document.hidden){loopId=0;return;}
  const dt=lastFrameTime?Math.min(50,time-lastFrameTime):0;lastFrameTime=time;lenis?.raf(time);
  if(playback?.playing){
    const inView=activeFrame.chapter===playback.section&&activeFrame.transition===null;
    if(inView){playback.progress=Math.min(1,playback.progress+dt/playback.duration);if(playback.progress>=1)playback.playing=false;syncPlaybar();dirty=true;}
  }
  if(dirty)draw();loopId=requestAnimationFrame(loop);
}
document.addEventListener('visibilitychange',()=>{lastFrameTime=0;if(document.hidden){if(playback)playback.playing=false;syncPlaybar();cancelAnimationFrame(loopId);loopId=0;void audioContext?.suspend();}else{dirty=true;if(!loopId)loopId=requestAnimationFrame(loop);}});
window.addEventListener('pagehide',()=>{if(loopId)cancelAnimationFrame(loopId);loopId=0;});
window.addEventListener('pageshow',()=>{lastFrameTime=0;if(!loopId)loopId=requestAnimationFrame(loop);});

configureMotion();syncCopy();syncRoutes();syncDraftFromSaved();measure();draw();
if(!storageAvailable)showStorageNotice();
if(location.hash)requestAnimationFrame(()=>gotoHash(location.hash,true));
loopId=requestAnimationFrame(loop);
performance.mark('odds-interactive');
