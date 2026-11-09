import './style.css';
import Lenis from 'lenis';
import { page,chapters } from './content';
import { icon } from './icons';
import { FrameAssets,assetURL } from './assets';
import { Scene } from './scene';
import { FilmPlayer,type PlaybackSnapshot,type PlayOptions } from './player';
import { Handoff } from './transitions';
import { createHistory,editHistory,undoHistory,resetHistory,sanitizeConfig,makeTimeline,PRESET_LABELS,pushPositions,DEFAULT_CONFIG,normalizeFrame,type TimelineConfig,type SpacingPreset } from './timeline';
import { exportFilm,exportStoryboard,exportFilename } from './export';

const $=<T extends Element=HTMLElement>(selector:string)=>document.querySelector<T>(selector)!;
const $$=<T extends Element=HTMLElement>(selector:string)=>Array.from(document.querySelectorAll<T>(selector));
const app=$<HTMLElement>('#app');app.innerHTML=page();
const STORE='frame-boop-v1';
let saved:{config?:unknown;selected?:number;hero?:number;motion?:boolean}={};
try{const raw=localStorage.getItem(STORE);const value=raw?JSON.parse(raw):null;if(value&&typeof value==='object'&&!Array.isArray(value))saved=value;}catch{saved={};}
let history=createHistory(saved.config??DEFAULT_CONFIG);
const initialSelected=normalizeFrame(saved.selected??18);
let selected=initialSelected;
let heroFrame=normalizeFrame(saved.hero??1);
let observe:6|18=6;
const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
let motionOverride=typeof saved.motion==='boolean'?saved.motion:undefined;
let reduced=motionOverride??motionQuery.matches;
const assets=new FrameAssets({maxDecoded:48,maxEncoded:64});
const scenes:Record<string,Scene>={};
$$<HTMLElement>('[data-scene]').forEach(el=>{scenes[el.dataset.scene!]=new Scene(el,assets);});
const handoffs=$$<HTMLElement>('[data-transition]').map(el=>new Handoff(el,assets,()=>({config:history.current,heroFrame,selectedFrame:selected,reduced})));
const playerScene:Record<string,string>={hero:'hero',compare:'compare-after',spacing:'spacing',hold:'hold',contact:'contact',mistake:'mistake',editor:'editor',premiere:'premiere'};
const players:Record<string,FilmPlayer>={};
const requests:Record<string,number>={};
const resumable:Record<string,boolean>={};
let editorLocation:'editor'|'premiere'='editor';
let configuring=false;
let raf=0,scrollDirty=true;
let lenis:Lenis|null=null;
let disposed=false;
let audioEnabled=false,audioContext:AudioContext|null=null;
let previousSoundFrame=0;
function persist(){try{localStorage.setItem(STORE,JSON.stringify({config:history.current,selected,hero:heroFrame,...(motionOverride===undefined?{}:{motion:motionOverride})}));}catch{/* Storage denial never blocks the film. */}}
function announce(text:string){$('#global-status').textContent=text;}
function setStatus(text:string){$('#editor-message').textContent=text;announce(text);}
function displayPlayerButton(name:string,snapshot:PlaybackSnapshot){
  $$<HTMLButtonElement>(`[data-play="${name}"]`).forEach(button=>{
    if(!button.dataset.originalLabel)button.dataset.originalLabel=button.querySelector('span')?.textContent||'Play';
    const key=name==='premiere'?'editor':name;
    const label=snapshot.playing?'Pause':snapshot.complete?'Watch again':resumable[key]&&snapshot.elapsedMs>0?'Continue':button.dataset.originalLabel;
    button.innerHTML=`${icon(snapshot.playing?'pause':'play')}<span>${label}</span>`;
    button.setAttribute('aria-pressed',String(snapshot.playing));
    button.dataset.state=snapshot.playing?'playing':snapshot.complete?'complete':'paused';
  });
  $$<HTMLOutputElement>(`[data-player-frame="${name}"]`).forEach(el=>el.textContent=`${String(snapshot.frame).padStart(2,'0')} / 24`);
  $$<HTMLButtonElement>(`[data-step^="${name}:"]`).forEach(button=>{button.disabled=button.dataset.step!.endsWith(':-1')?snapshot.frame<=1:snapshot.frame>=24;});
}
function sound(frame:number){
  if(!audioEnabled||!audioContext||frame===previousSoundFrame)return;previousSoundFrame=frame;
  if(![7,9,11,13,19,21,24].includes(frame))return;
  const ctx=audioContext,t=ctx.currentTime,osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type='sine';osc.frequency.setValueAtTime(frame===24?240:95,t);osc.frequency.exponentialRampToValueAtTime(frame===24?140:42,t+.085);
  gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(frame===24?.075:.045,t+.006);gain.gain.exponentialRampToValueAtTime(.0001,t+.11);
  osc.connect(gain);gain.connect(ctx.destination);osc.start(t);osc.stop(t+.13);
}
function onPlayer(name:string,snapshot:PlaybackSnapshot){
  if(snapshot.playing)resumable[name]=true;
  if(snapshot.complete)resumable[name]=false;
  displayPlayerButton(name,snapshot);
  if(name==='hero'){
    heroFrame=snapshot.frame;scenes.hero.setTarget(snapshot.frame,'even');
    $$<HTMLButtonElement>('[data-hero-frame]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.heroFrame)===heroFrame)));
    if(!snapshot.playing)persist();
  }else if(name==='compare'){
    scenes['compare-after'].setTarget(snapshot.frame,'even');scenes['compare-before'].setTarget(Math.max(1,snapshot.frame-1),'even');
  }else if(name==='editor'){
    selected=snapshot.frame;scenes.editor.setTarget(selected,history.current.preset);scenes.premiere.setTarget(selected,history.current.preset);
    displayPlayerButton('premiere',snapshot);syncSelected();
    if(snapshot.complete){$('#premiere-ending').textContent='There. Just right.';setStatus('Your take is complete. A little film, shaped by you.');}
    else if(snapshot.playing)$('#premiere-ending').textContent='A small adventure, in your own time.';
    if(!snapshot.playing)persist();
  }else scenes[playerScene[name]].setTarget(snapshot.frame,history.current.preset);
  if(snapshot.playing)sound(snapshot.frame);
  if(!configuring){scrollDirty=true;requestLoop();}
}
for(const name of ['hero','compare','spacing','hold','contact','mistake','editor'])players[name]=new FilmPlayer(s=>onPlayer(name,s));
players.premiere=players.editor;
function pauseAll(){for(const [name,p]of Object.entries(players)){requests[name]=(requests[name]||0)+1;p.pause();}previousSoundFrame=0;}
function syncSelected(){
  const seek=$<HTMLInputElement>('#editor-seek');seek.value=String(selected);seek.setAttribute('aria-valuetext',`Frame ${selected} of 24`);
  $$<HTMLButtonElement>('[data-select-frame]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.selectFrame)===selected)));
  $('#your-worktable').setAttribute('data-selected-frame',String(selected));
}
function renderConfig(){
  const config=history.current,t=makeTimeline(config);
  document.body.dataset.preset=config.preset;document.body.dataset.hold6=String(config.hold6);document.body.dataset.hold18=String(config.hold18);document.body.dataset.filmDuration=t.duration.toFixed(4);
  $$<HTMLButtonElement>('button[data-preset]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.preset===config.preset)));
  $$('#app [data-duration]').forEach(el=>el.textContent=`${t.totalBeats} beats · ${t.duration.toFixed(2)} s`);
  $$('[data-hold-value]').forEach(el=>el.textContent=String(Number((el as HTMLElement).dataset.holdValue)===6?config.hold6:config.hold18));
  $$<HTMLButtonElement>('[data-hold]').forEach(b=>{const[f,d]=b.dataset.hold!.split(':').map(Number);const n=f===6?config.hold6:config.hold18;b.disabled=d<0?n===0:n===12;});
  $$<HTMLButtonElement>('[data-undo]').forEach(b=>b.disabled=history.undo.length===0);
  $$('[data-summary-preset]').forEach(el=>el.textContent=PRESET_LABELS[config.preset]);
  $$('[data-summary-holds]').forEach(el=>el.textContent=`${config.hold6} extra preparation beats · ${config.hold18} extra look-back beats`);
  const explanations:Record<SpacingPreset,string>={even:'Each step travels the same distance. Steady, certain, a little matter-of-fact.','ease-in':'Small steps open into larger ones. Boop gathers courage, then a little too much speed.','ease-out':'Big steps become smaller ones. The push arrives more carefully, with a gentler finish.'};
  $('#spacing-explanation').textContent=explanations[config.preset];
  const positions=pushPositions(config.preset),svg=$<SVGElement>('#spacing-track');
  svg.innerHTML=`<title id="track-title">${PRESET_LABELS[config.preset]}: six true block positions with identical endpoints</title><path d="M24 28H636" fill="none" stroke="#403D49" stroke-opacity=".35"/>`+positions.map((x,i)=>{const cx=24+(x+1.6)/2.95*612;return`<circle cx="${cx.toFixed(2)}" cy="28" r="${i===2?7:5}" fill="${i===2?'#D66B66':'#403D49'}"/><text x="${cx.toFixed(2)}" y="62" text-anchor="middle" font-family="ui-monospace,monospace" font-size="13" fill="#403D49">${String(i+7).padStart(2,'0')}</text>`;}).join('');
  $$<HTMLButtonElement>('[data-select-frame]').forEach(button=>{const f=Number(button.dataset.selectFrame);button.querySelector<HTMLImageElement>('img')!.src=assetURL(f,config.preset,'landscape');const count=f===6?config.hold6:f===18?config.hold18:0;button.querySelector('.hold-indicator')!.textContent=count?`+${count}`:'';});
  $$<HTMLImageElement>('[data-summary-frame]').forEach(img=>img.src=assetURL(Number(img.dataset.summaryFrame),config.preset,'landscape'));
  const count=observe===6?config.hold6:config.hold18;
  $('#hold-tape').innerHTML=Array.from({length:count+1},(_,i)=>`<span class="${i?'extra':''}">${String(observe).padStart(2,'0')}</span>`).join('');
  $('#hold-tape').setAttribute('aria-label',`Frame ${observe} is shown for ${count+1} beats: one original beat plus ${count} held beats.`);
  syncSelected();persist();scrollDirty=true;
}
function edit(patch:Partial<TimelineConfig>,focusFrame?:number){
  pauseAll();Object.keys(resumable).forEach(k=>resumable[k]=false);history=editHistory(history,patch);configuring=true;
  for(const name of ['spacing','hold','contact','mistake','editor'])players[name].configure(history.current);
  configuring=false;
  for(const id of ['spacing','hold','preparation','contact','mistake','editor','premiere'])scenes[id].setTarget(scenes[id].frame,history.current.preset);
  if(focusFrame)players.editor.setFrame(focusFrame);
  if(patch.preset)players.spacing.setFrame(9);
  renderConfig();setStatus('Rhythm updated. Your film is paused and ready to play.');requestLoop();
}
function restoreHistory(next:typeof history,message:string){pauseAll();Object.keys(resumable).forEach(k=>resumable[k]=false);history=next;configuring=true;for(const name of ['spacing','hold','contact','mistake','editor'])players[name].configure(history.current);configuring=false;for(const id of ['spacing','hold','preparation','contact','mistake','editor','premiere'])scenes[id].setTarget(scenes[id].frame,history.current.preset);renderConfig();setStatus(message);requestLoop();}
function actuallyVisible(scene:Scene){const r=scene.picture.getBoundingClientRect();return r.bottom>80&&r.top<innerHeight-50&&Math.min(r.bottom,innerHeight)-Math.max(r.top,0)>Math.min(100,r.height*.2);}
async function reveal(scene:Scene){
  if(actuallyVisible(scene))return;
  if(lenis&&!reduced){await new Promise<void>(resolve=>{let done=false;const finish=()=>{if(!done){done=true;resolve();}};lenis!.scrollTo(scene.element,{offset:-Math.max(30,(innerHeight-scene.picture.clientHeight)/2),duration:.65,onComplete:finish});setTimeout(finish,900);});}
  else scene.element.scrollIntoView({block:'center',behavior:'instant'});
}
async function startPlayer(name:string,options:PlayOptions={},baseline=false,forceRestart=false){
  const player=players[name],scene=scenes[playerScene[name]];if(player.state.playing&&!forceRestart){player.pause();return;}
  pauseAll();if(name==='contact')scene.setShot(null);const request=(requests[name]||0)+1;requests[name]=request;
  if(name==='premiere'||name==='editor')editorLocation=name;
  const button=$<HTMLButtonElement>(`[data-play="${name}"]`);if(button){button.disabled=true;button.dataset.loading='true';}
  try{
    await reveal(scene);if(requests[name]!==request||document.hidden)return;
    const config=name==='hero'||name==='compare'?DEFAULT_CONFIG:baseline?sanitizeConfig({...history.current,hold6:0,hold18:0}):history.current;
    const from=options.from??1,to=options.to??24;
    await scene.preload(Array.from({length:to-from+1},(_,i)=>from+i),config.preset);
    if(requests[name]!==request||document.hidden||!actuallyVisible(scene))return;
    if(name==='hold'||baseline)player.configure(config);
    if(audioEnabled&&audioContext?.state==='suspended')await audioContext.resume();
    if(requests[name]!==request||document.hidden||!actuallyVisible(scene))return;
    player.play(options);requestLoop();
  }catch(error){const message=error instanceof Error?error.message:'The frames could not load.';setStatus(`${message} Please try Play again.`);announce(message);}
  finally{if(button){button.disabled=false;delete button.dataset.loading;}}
}
function defaultOptions(name:string):PlayOptions{
  if(name==='compare')return{from:6,to:12,restart:true};
  if(name==='spacing')return{from:7,to:12,restart:true};
  if(name==='hold')return{from:observe===6?5:17,to:observe===6?8:20,restart:true};
  if(name==='contact')return{from:5,to:10,restart:true};
  if(name==='mistake')return{from:13,to:24,omitLookback:false,restart:true};
  const p=players[name],key=name==='premiere'?'editor':name;return !resumable[key]||p.state.complete?{restart:true}:{};
}
$$<HTMLButtonElement>('[data-play]').forEach(b=>b.addEventListener('click',()=>{const name=b.dataset.play!;void startPlayer(name,defaultOptions(name));}));
$$<HTMLButtonElement>('[data-step]').forEach(b=>b.addEventListener('click',()=>{pauseAll();const[name,d]=b.dataset.step!.split(':');resumable[name==='premiere'?'editor':name]=false;players[name].setFrame(players[name].state.frame+Number(d));if(name==='editor'||name==='premiere')editorLocation=name;}));
$$<HTMLButtonElement>('[data-hero-frame]').forEach(b=>b.addEventListener('click',()=>{pauseAll();resumable.hero=false;players.hero.setFrame(Number(b.dataset.heroFrame));}));
$$<HTMLButtonElement>('button[data-preset]').forEach(b=>b.addEventListener('click',()=>edit({preset:b.dataset.preset as SpacingPreset},9)));
$$<HTMLButtonElement>('[data-hold]').forEach(b=>b.addEventListener('click',()=>{const[f,d]=b.dataset.hold!.split(':').map(Number);const key=f===6?'hold6':'hold18';observe=f as 6|18;edit({[key]:history.current[key]+d},f);players.hold.setFrame(f);syncObserve();}));
function syncObserve(){scenes.hold.setTarget(observe,history.current.preset);$$<HTMLButtonElement>('[data-observe]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.observe)===observe)));renderConfig();}
$$<HTMLButtonElement>('[data-observe]').forEach(b=>b.addEventListener('click',()=>{pauseAll();observe=Number(b.dataset.observe) as 6|18;players.hold.setFrame(observe);syncObserve();}));
$<HTMLButtonElement>('[data-hold-baseline]').addEventListener('click',()=>{void startPlayer('hold',defaultOptions('hold'),true,true);});
$<HTMLInputElement>('#onion-skin').addEventListener('change',e=>scenes['compare-after'].setOnion((e.target as HTMLInputElement).checked));
$$<HTMLButtonElement>('[data-preparation]').forEach(b=>b.addEventListener('click',()=>{scenes.preparation.setTarget(Number(b.dataset.preparation),history.current.preset);$$<HTMLButtonElement>('[data-preparation]').forEach(o=>o.setAttribute('aria-pressed',String(o===b)));}));
$$<HTMLButtonElement>('[data-contact]').forEach(b=>b.addEventListener('click',()=>{pauseAll();scenes.contact.setShot('contact');players.contact.setFrame(Number(b.dataset.contact));$$<HTMLButtonElement>('[data-contact]').forEach(o=>o.setAttribute('aria-pressed',String(o===b)));}));
$<HTMLButtonElement>('[data-without-look]').addEventListener('click',()=>{void startPlayer('mistake',{from:13,to:24,omitLookback:true,restart:true},false,true);});
$$<HTMLButtonElement>('[data-select-frame]').forEach(b=>b.addEventListener('click',()=>{pauseAll();resumable.editor=false;players.editor.setFrame(Number(b.dataset.selectFrame));setStatus(`Frame ${String(selected).padStart(2,'0')} selected. This same frame will enter the premiere.`);}));
$<HTMLInputElement>('#editor-seek').addEventListener('input',e=>{pauseAll();resumable.editor=false;players.editor.setFrame(Number((e.target as HTMLInputElement).value));});
$$<HTMLButtonElement>('[data-undo]').forEach(b=>b.addEventListener('click',()=>restoreHistory(undoHistory(history),'Your previous rhythm is restored.')));
$$<HTMLButtonElement>('[data-reset]').forEach(b=>b.addEventListener('click',()=>restoreHistory(resetHistory(history),'The original rhythm is restored: even steps, no extra holds.')));
$$<HTMLButtonElement>('[data-replay]').forEach(b=>b.addEventListener('click',()=>{void startPlayer(b.dataset.replay!,{restart:true},false,true);}));
$$<HTMLButtonElement>('[data-retry]').forEach(b=>b.addEventListener('click',()=>scenes[b.dataset.retry!].retry()));

const menu=$<HTMLElement>('#chapter-menu'),menuToggle=$<HTMLButtonElement>('.menu-toggle');let menuReturn:HTMLElement=menuToggle;
function openMenu(){menuReturn=document.activeElement as HTMLElement||menuToggle;menu.hidden=false;menuToggle.setAttribute('aria-expanded','true');menu.querySelector<HTMLButtonElement>('.menu-close')!.focus();}
function closeMenu(restore=true){menu.hidden=true;menuToggle.setAttribute('aria-expanded','false');if(restore)menuReturn.focus();}
menuToggle.addEventListener('click',()=>menu.hidden?openMenu():closeMenu());$('.menu-close').addEventListener('click',()=>closeMenu());$('[data-open-menu]').addEventListener('click',openMenu);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){e.preventDefault();closeMenu();}});
document.addEventListener('pointerdown',e=>{if(!menu.hidden&&!menu.contains(e.target as Node)&&!menuToggle.contains(e.target as Node))closeMenu(false);});
$$<HTMLAnchorElement>('a[href^="#"]').forEach(a=>a.addEventListener('click',()=>{pauseAll();if(!menu.hidden)closeMenu(false);const id=a.hash.slice(1);const heading=document.getElementById(id)?.querySelector<HTMLElement>('h1,h2');if(heading){heading.tabIndex=-1;setTimeout(()=>heading.focus({preventScroll:true}),reduced?0:700);}scrollDirty=true;requestLoop();}));
function configureMotion(){
  pauseAll();lenis?.destroy();lenis=null;document.documentElement.classList.toggle('reduced-motion',reduced);$<HTMLInputElement>('#less-motion').checked=reduced;
  if(!reduced)lenis=new Lenis({autoRaf:false,lerp:.13,smoothWheel:true,syncTouch:false,anchors:{offset:-24}});
  lenis?.on('scroll',()=>{scrollDirty=true;});scrollDirty=true;requestLoop();
}
$<HTMLInputElement>('#less-motion').addEventListener('change',e=>{motionOverride=(e.target as HTMLInputElement).checked;reduced=motionOverride;persist();configureMotion();announce(reduced?'Less motion is on. All frames and controls remain available.':'Smooth transitions are on.');});
motionQuery.addEventListener('change',()=>{if(motionOverride===undefined){reduced=motionQuery.matches;configureMotion();}});
$('#sound-toggle').addEventListener('click',async()=>{
  if(!audioEnabled){try{audioContext??=new AudioContext();await audioContext.resume();audioEnabled=true;}catch{announce('Sound is not available in this browser. The complete story works in silence.');return;}}
  else{audioEnabled=false;void audioContext?.suspend();}
  $('#sound-toggle').innerHTML=`${icon(audioEnabled?'volume':'mute')}<span>${audioEnabled?'Sound on':'Sound off'}</span>`;$('#sound-toggle').setAttribute('aria-pressed',String(audioEnabled));
});

const sceneObserver=new IntersectionObserver(entries=>{for(const entry of entries){const el=entry.target as HTMLElement;const scene=scenes[el.dataset.scene!];scene.visible=entry.isIntersecting;if(scene.visible){void scene.prepare();scene.draw();}}},{rootMargin:'280px 0px'});
Object.values(scenes).forEach(scene=>sceneObserver.observe(scene.element));
function updateScroll(){
  handoffs.forEach(h=>h.update());
  for(const[name,p]of Object.entries(players)){
    if(name==='premiere')continue;
    const actual=name==='editor'?editorLocation:name;
    if(p.state.playing&&!actuallyVisible(scenes[playerScene[actual]])){p.pause();requests[actual]=(requests[actual]||0)+1;}
  }
  const current=chapters.find(([id])=>{const r=document.getElementById(id)!.getBoundingClientRect();return r.top<innerHeight*.52&&r.bottom>innerHeight*.25;});
  if(current){document.body.dataset.chapter=current[0];$$<HTMLAnchorElement>('#chapter-menu a').forEach(a=>a.setAttribute('aria-current',String(a.hash===`#${current[0]}`)));}
}
function loop(time:number){
  raf=0;if(document.hidden||disposed)return;lenis?.raf(time);
  for(const[name,p]of Object.entries(players))if(name!=='premiere')p.tick(time);
  if(scrollDirty){scrollDirty=false;updateScroll();}
  const active=Object.entries(players).some(([name,p])=>name!=='premiere'&&p.state.playing);
  if((lenis||active)&&!raf)raf=requestAnimationFrame(loop);
}
function requestLoop(){if(!raf&&!document.hidden&&!disposed)raf=requestAnimationFrame(loop);}
window.addEventListener('scroll',()=>{scrollDirty=true;requestLoop();},{passive:true});
let resizeTimer=0;
window.addEventListener('resize',()=>{pauseAll();clearTimeout(resizeTimer);resizeTimer=window.setTimeout(()=>{lenis?.resize();Object.values(scenes).forEach(scene=>scene.resize());scrollDirty=true;requestLoop();},90);},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){pauseAll();if(raf)cancelAnimationFrame(raf);raf=0;void audioContext?.suspend();}else{lenis?.resize();scrollDirty=true;requestLoop();}});
window.addEventListener('pagehide',()=>{pauseAll();persist();if(raf)cancelAnimationFrame(raf);raf=0;});
window.addEventListener('pageshow',()=>{scrollDirty=true;requestLoop();});
window.addEventListener('online',()=>{Object.values(scenes).filter(s=>s.visible).forEach(s=>s.retry());});
window.addEventListener('hashchange',()=>{scrollDirty=true;requestLoop();});

type ExportKind='html'|'png';
interface PreparedDownload {url:string;filename:string;config:Readonly<TimelineConfig>;}
const preparedDownloads:Partial<Record<ExportKind,PreparedDownload>>={};
const preparedLinks=document.createElement('div');preparedLinks.className='download-actions';preparedLinks.id='prepared-downloads';preparedLinks.hidden=true;preparedLinks.style.marginBottom='24px';preparedLinks.setAttribute('aria-label','Prepared files');$('#download-status').after(preparedLinks);
function renderPreparedDownloads(){
  const links:HTMLAnchorElement[]=[],downloads:Partial<Record<ExportKind,HTMLAnchorElement>>={};
  for(const kind of ['html','png'] as const){
    const file=preparedDownloads[kind];if(!file)continue;
    const title=`${PRESET_LABELS[file.config.preset]} · ${makeTimeline(file.config).duration.toFixed(2)} seconds`;
    if(kind==='html'){
      const open=document.createElement('a');open.className='text-link';open.href=file.url;open.target='_blank';open.rel='noopener';open.title=title;open.innerHTML=`Open prepared film ${icon('arrow')}`;links.push(open);
    }
    const download=document.createElement('a');download.className='text-link';download.href=file.url;download.download=file.filename;download.title=title;download.innerHTML=`${kind==='html'?'Download prepared film':'Download prepared storyboard'} ${icon('download')}`;links.push(download);downloads[kind]=download;
  }
  preparedLinks.replaceChildren(...links);preparedLinks.hidden=links.length===0;return downloads;
}
async function download(kind:'html'|'png'){
  pauseAll();const config=sanitizeConfig(history.current),status=$('#download-status'),buttons=[$<HTMLButtonElement>('#download-film'),$<HTMLButtonElement>('#download-storyboard')];
  buttons.forEach(b=>b.disabled=true);status.classList.remove('error');status.textContent=kind==='html'?'Preparing your film, with every frame inside…':'Arranging your twenty-four frames…';
  try{
    const blob=kind==='html'?await exportFilm(config,assets):await exportStoryboard(config,assets);
    const url=URL.createObjectURL(blob),previous=preparedDownloads[kind];
    preparedDownloads[kind]={url,filename:exportFilename(config,kind),config};
    const links=renderPreparedDownloads();
    // Preserve prepared files through later interaction and BFCache restoration.
    // Only a successful replacement of this same kind releases its previous URL.
    if(previous)URL.revokeObjectURL(previous.url);
    document.body.dataset.lastExport=JSON.stringify({kind,config,beats:makeTimeline(config).totalBeats,bytes:blob.size});
    status.textContent=kind==='html'?'Your film is prepared. If the download did not start, open or download it using the links below.':'Your storyboard is prepared. If the download did not start, use “Download prepared storyboard” below.';
    try{links[kind]?.click();}catch{/* A direct click on the prepared link remains available. */}
  }catch(error){status.classList.add('error');status.textContent=`The file could not be prepared. ${error instanceof Error?error.message:'Please check the connection and try again.'}`;}
  finally{buttons.forEach(b=>b.disabled=false);}
}
$('#download-film').addEventListener('click',()=>{void download('html');});$('#download-storyboard').addEventListener('click',()=>{void download('png');});

configuring=true;
for(const name of ['spacing','hold','contact','mistake','editor'])players[name].configure(history.current);
players.hero.setFrame(heroFrame);players.compare.setFrame(7);players.spacing.setFrame(9);players.hold.setFrame(6);players.contact.setFrame(6);players.mistake.setFrame(18);players.editor.setFrame(initialSelected);
configuring=false;
Object.entries(players).forEach(([name,p])=>displayPlayerButton(name,p.state));renderConfig();
scenes.hero.visible=true;void scenes.hero.prepare();
configureMotion();
document.body.dataset.interactive=performance.now().toFixed(1);
if(document.fonts)void document.fonts.ready.then(()=>{lenis?.resize();scrollDirty=true;requestLoop();});
