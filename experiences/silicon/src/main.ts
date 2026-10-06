import 'lenis/dist/lenis.css';
import './style.css';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { chapters, references } from './content';
import { clamp, smooth } from './scene/shared';
import type { SiliconStage } from './scene/stage';

const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.2"/></svg>';
const down = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4v15m-6-6 6 6 6-6" stroke="currentColor" stroke-width="1.2"/></svg>';
const close = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" stroke="currentColor" stroke-width="1.2"/></svg>';
const mark = '<svg viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M14 2a12 12 0 1 0 3.8 23.4l-.8-2.3 2.2-1.2 1.5 2A12 12 0 0 0 14 2Z" stroke="currentColor" stroke-width="1"/><path d="M7 8h14M4 14h20M7 20h14M8 5v18M14 2v24M20 5v17" stroke="currentColor" stroke-width=".55" opacity=".6"/></svg>';

function slider(id: string, label: string, value: number) {
  return `<div class="inspection"><div class="inspection-label"><label for="${id}">${label}</label><output for="${id}" id="${id}-value">${value}%</output></div><input id="${id}" type="range" min="0" max="100" value="${value}" aria-describedby="${id}-hint"><div class="inspection-footer"><span id="${id}-hint">Scroll to follow · drag to inspect</span><button class="auto-control" data-auto="${id}" disabled>Auto</button></div></div>`;
}

function controls(index: number) {
  if (index === 0) return `<button class="text-action begin" data-go="1">Begin the process ${down}</button>`;
  if (index === 1) return slider('exposure', 'Exposure', 25);
  if (index === 2) return `<div class="process-verbs" aria-label="Process cycle"><span data-step="0">Deposit</span><i></i><span data-step="1">Pattern</span><i></i><span data-step="2">Etch</span><i></i><span data-step="3">Repeat</span></div>`;
  if (index === 3) return `<button class="switch-control" id="gate-control" role="switch" aria-checked="true"><span class="switch-track"><i></i></span><span>Gate <b id="gate-state">on</b></span><span class="switch-caption" id="channel-state">Channel open</span></button>`;
  if (index === 4) return slider('layers', 'Layer separation', 45);
  if (index === 5) return slider('assembly', 'Layer separation', 100);
  if (index === 6) return `<button class="switch-control" id="signal-control" role="switch" aria-checked="true"><span class="switch-track"><i></i></span><span>Power <b id="power-state">on</b></span><span class="switch-caption" id="activity-state">Circuit active</span></button>`;
  return `<div class="closing-actions"><button class="text-action" data-go="0">Experience again ${arrow}</button><button class="quiet-action" data-dialog="about">About this exhibit</button></div>`;
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <a class="skip-link" href="#chapter-navigation">Skip to chapter navigation</a>
  <header class="site-header">
    <button class="wordmark" data-go="0" aria-label="SILICON, return to material">${mark}<span>SILICON</span></button>
    <nav class="header-nav" aria-label="Exhibit"><a class="collection-return" href="${import.meta.env.BASE_URL}" aria-label="Return to Collection" title="Return to Collection"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7"/></svg><span>Collection</span></a><button data-dialog="process">The process <svg class="nav-cross" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1"/></svg></button><button data-dialog="about">About</button></nav>
  </header>
  <main id="journey" class="journey" aria-label="From sand to signal, an eight-scene exhibition">
    <div class="exhibit-stage">
      <div class="stage-atmosphere" aria-hidden="true"></div>
      <div id="artwork" class="artwork" role="img" aria-label="A mirror-polished silicon wafer with a repeated die array."></div>
      <div class="hero-lettering" aria-hidden="true">SILICON</div>
      <div class="scenes">
        ${chapters.map((chapter, index) => `<section class="scene-copy ${index===0?'scene-hero':''} ${index===7?'scene-final':''}" data-scene="${index}" aria-labelledby="title-${chapter.id}" ${index?'aria-hidden="true" inert':''}>
          ${index===0?`<h1 id="title-material" class="sr-only">SILICON — From Sand to Signal</h1><div class="hero-bottom"><h2>From sand to signal.</h2><p>A journey through the architecture of computation.</p>${controls(0)}</div>`:`<div class="copy-block"><h2 id="title-${chapter.id}">${chapter.title}</h2><p>${chapter.description}</p><div class="scene-controls">${controls(index)}</div></div>`}
          <div class="scene-note">${chapter.note}</div>
        </section>`).join('')}
      </div>
      <div class="annotation annotation-wafer" aria-hidden="true"><span></span><em>300 mm</em><span></span></div>
      <div class="structure-caption" aria-hidden="true"><i></i><span id="structure-label">Mirror-polished silicon</span></div>
      <div class="view-status" role="status" hidden>A lighter view is active.</div>
      <div class="chapter-status" aria-live="polite" aria-atomic="true"><span class="sr-only" id="chapter-announcement">Chapter 1 of 8, Material</span></div>
      <div class="scroll-cue" aria-hidden="true"><span>Scroll to explore</span><i></i></div>
    </div>
  </main>
  <footer class="journey-footer">
    <div class="footer-meta"><span id="current-chapter"><b>01</b> Material</span><button id="motion-control" class="motion-control" aria-pressed="false" aria-label="Pause ambient motion"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M7 5v10M13 5v10" stroke="currentColor" stroke-width="1.2"/></svg><span>Motion on</span></button></div>
    <nav class="chapter-navigation" id="chapter-navigation" aria-label="Manufacturing chapters" tabindex="-1">${chapters.map((ch,i)=>`<button class="chapter-link ${i===0?'is-active':''}" data-go="${i}" aria-label="Chapter ${i+1}: ${ch.name}" ${i===0?'aria-current="step"':''}><span class="chapter-name"><b>${String(i+1).padStart(2,'0')}</b> ${ch.name}</span><span class="chapter-track"><i></i></span></button>`).join('')}</nav>
  </footer>
  <dialog id="process-dialog" class="process-dialog" aria-labelledby="process-heading"><div class="dialog-shell"><div class="dialog-top"><span class="dialog-brand">SILICON</span><button class="icon-button" data-close aria-label="Close the process">${close}</button></div><div class="process-heading"><h2 id="process-heading">From matter.<br>To possibility.</h2><p>Eight moments in the making.<br>Enter anywhere. Follow the connection.</p></div><nav class="process-index" aria-label="Choose a chapter">${chapters.map((ch,i)=>`<button data-go="${i}"><span class="index-no">${String(i+1).padStart(2,'0')}</span><span>${ch.name}</span>${arrow}</button>`).join('')}</nav><div class="dialog-bottom"><span>Layers. Light. Connections. Information.</span><span>01—08</span></div></div></dialog>
  <dialog id="about-dialog" class="about-dialog" aria-labelledby="about-heading"><div class="dialog-shell"><div class="dialog-top"><span class="dialog-brand">ABOUT THE EXHIBIT</span><button class="icon-button" data-close aria-label="Close about">${close}</button></div><h2 id="about-heading">The extraordinary,<br>inside the ordinary.</h2><p class="about-intro">An original digital exhibition about the architecture of a microchip. A continuous journey through silicon, light, microscopic structures and the connections that make computation possible.</p><div class="about-section"><h3>A considered abstraction</h3><p>The geometry is an illustrative synthesis, not a foundry blueprint or a model to scale. The nanosheet transistor and chiplet package are selected examples; actual devices and processes vary.</p><p>Violet makes invisible EUV light legible. Traveling pulses represent electrical activity, not electron speed. The thermal colour is expressive, not a measured temperature.</p></div><div class="about-section"><h3>Explore at your own pace</h3><p>Scroll in either direction. Stop at any point. Open the process index to move between scenes. Exposure, the gate and layer separation can also be adjusted directly.</p><button class="preference-toggle" id="reduced-control" role="switch" aria-checked="false"><span>Reduce motion</span><span class="switch-track"><i></i></span></button></div><div class="about-section"><h3>Research & references</h3><p>Original geometry, informed by primary technical sources.</p><div class="reference-list">${references.map(([name, title, url])=>`<a href="${url}" target="_blank" rel="noopener noreferrer"><span><b>${name}</b>${title}</span>${arrow}</a>`).join('')}</div></div><details class="transcript"><summary>Read the eight moments</summary>${chapters.map((ch,i)=>`<section><h3>${String(i+1).padStart(2,'0')} — ${ch.name}</h3><p>${ch.description}</p></section>`).join('')}</details><div class="about-colophon"><span>SILICON</span><span>From sand to signal.</span></div></div></dialog>
`;

const journey = document.querySelector<HTMLElement>('#journey')!;
const artwork = document.querySelector<HTMLElement>('#artwork')!;
const sceneElements = [...document.querySelectorAll<HTMLElement>('.scene-copy')];
const chapterButtons = [...document.querySelectorAll<HTMLButtonElement>('.chapter-link')];
const dialogs = [...document.querySelectorAll<HTMLDialogElement>('dialog')];
const heroLettering = document.querySelector<HTMLElement>('.hero-lettering')!;
const waferDimension = document.querySelector<HTMLElement>('.annotation-wafer')!;
const structureCaption = document.querySelector<HTMLElement>('.structure-caption')!;
const scrollCue = document.querySelector<HTMLElement>('.scroll-cue')!;
const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let reduced = reducedQuery.matches;
let paused = false;
let activeChapter = 0;
let progress = 0;
let resizeAnchor: number | null = null;
let resizeTimer: ReturnType<typeof setTimeout>;
let navigationTarget: number | null = null;
let navigationSequence = 0;
let stage: SiliconStage | undefined;
let disposed = false;
let lastDialogTrigger: HTMLElement | null = null;
let gate = true;
let power = true;
const manual = { exposure: false, layers: false, assembly: false };
const userValues = { exposure: .25, layers: .45, assembly: 1 };
const modelDescriptions = [
  'A mirror-polished silicon wafer with a repeated die array and alignment notch.',
  'A reflective reticle and three metal mirrors guide a folded EUV optical path to a photoresist-coated wafer.',
  'Films and patterned structures grow above a silicon foundation, revealing a layered cutaway.',
  'Three horizontal silicon nanosheets connect source and drain. An opened surrounding gate reveals their channels.',
  'Alternating metal routes are connected vertically through vias, forming a three-dimensional interconnect stack.',
  'Two logic chiplets and four stacks of high-bandwidth memory sit above a silicon interposer and package substrate.',
  'Electrical activity travels between logic and memory over the connected package routes.',
  'An assembled silicon package with a brushed-metal heat spreader, etched SILICON lettering and a quiet edge reflection.',
];
const structureLabels = ['Mirror-polished silicon','Reflective optical column','Patterned thin films','Three silicon channels','Metal routes + vertical vias','Logic + stacked memory','Information in motion','Precision, assembled'];

gsap.registerPlugin(ScrollTrigger);
const lenis = new Lenis({ lerp: .13, smoothWheel: !reduced, syncTouch: false, autoRaf: false, anchors: false });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.lagSmoothing(0);

function autoValues(index: number, local: number) {
  return { exposure: smooth(.08,.73,local), layers: .45, assembly: 1-smooth(.56,.94,local) };
}

function updateView(value: number) {
  progress = clamp(value,0,7.999);
  const index = Math.min(7,Math.floor(progress)), local = progress-index;
  if(index!==activeChapter) {
    activeChapter=index;
    for(const key of Object.keys(manual) as (keyof typeof manual)[]) manual[key]=false;
    stage?.setSettings({spread:-1,exposure:-1,power:-1});
    power=true;
    updateSwitch('signal-control',true);
    document.querySelector('#power-state')!.textContent='on';
    document.querySelector('#activity-state')!.textContent='Circuit active';
    document.querySelector('#current-chapter')!.innerHTML=`<b>${String(index+1).padStart(2,'0')}</b> ${chapters[index].name}`;
    document.querySelector('#chapter-announcement')!.textContent=`Chapter ${index+1} of 8, ${chapters[index].name}`;
    artwork.setAttribute('aria-label',modelDescriptions[index]);
    document.querySelector('#structure-label')!.textContent=structureLabels[index];
    document.body.dataset.chapter=chapters[index].id;
  }
  sceneElements.forEach((el,i)=>{
    const sceneP=progress-i;
    let alpha=i===0 ? 1-smooth(.43,.72,progress) : smooth(-.045,.13,sceneP)*(i===7?1:1-smooth(.76,.98,sceneP));
    if(reduced) alpha=i===index?1:0;
    el.style.opacity=String(alpha);
    el.style.visibility=alpha>.001?'visible':'hidden';
    el.inert=i!==index;
    el.setAttribute('aria-hidden',String(i!==index));
  });
  const heroOpacity=1-smooth(.39,.72,progress);
  heroLettering.style.opacity=String(heroOpacity);
  heroLettering.style.transform=`translateY(${-smooth(.25,.85,progress)*48}px)`;
  waferDimension.style.opacity=String(heroOpacity*.8);
  scrollCue.style.opacity=String(1-smooth(.05,.24,progress));
  structureCaption.style.opacity=String(index===0?0:(smooth(.16,.32,local)*(index===7?1:1-smooth(.73,.96,local))));
  chapterButtons.forEach((button,i)=>{
    button.classList.toggle('is-active',i===index);
    if(i===index)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
    button.style.setProperty('--progress',`${clamp(progress-i)*100}%`);
  });
  const values=autoValues(index,reduced?(index===0?0:index===7?.57:.5):local);
  for(const key of Object.keys(manual) as (keyof typeof manual)[]){
    const input=document.querySelector<HTMLInputElement>(`#${key}`)!;
    const amount=manual[key]?userValues[key]:values[key];
    input.value=String(Math.round(amount*100));
    input.style.setProperty('--value',`${amount*100}%`);
    document.querySelector(`#${key}-value`)!.textContent=`${Math.round(amount*100)}%`;
    document.querySelector<HTMLButtonElement>(`[data-auto="${key}"]`)!.disabled=!manual[key];
  }
  document.querySelectorAll<HTMLElement>('[data-step]').forEach(el=>el.classList.toggle('is-current',Number(el.dataset.step)===Math.min(3,Math.floor(local*4))));
  stage?.setProgress(progress);
}

const trigger=ScrollTrigger.create({
  trigger:journey,start:'top top',end:()=>`+=${journey.offsetHeight-window.innerHeight}`,
  invalidateOnRefresh:true,
  onUpdate:self=>{if(resizeAnchor===null)updateView(self.progress*7.999);},
  onRefresh:self=>{if(resizeAnchor===null)updateView(self.progress*7.999);},
});

function closeDialogs() { dialogs.forEach(dialog=>{if(dialog.open){dialog.dataset.navigating='true';dialog.close();}}); }
function goTo(index: number) {
  clearTimeout(resizeTimer);
  resizeAnchor = null;
  closeDialogs();
  lenis.start();
  stage?.resize(); lenis.resize(); ScrollTrigger.refresh();
  const p=index===0?0:index===7?7.57:index+.50;
  navigationTarget=p;
  const sequence=++navigationSequence;
  const target=trigger.start+(p/7.999)*(trigger.end-trigger.start);
  lenis.scrollTo(target,{immediate:reduced,duration:1.25,force:true,onComplete:()=>{
    if(sequence===navigationSequence)navigationTarget=null;
  }});
  history.replaceState(null,'',`${location.pathname}${location.search}${index===0?'':`#${chapters[index].id}`}`);
}

document.querySelectorAll<HTMLButtonElement>('[data-go]').forEach(button=>button.addEventListener('click',()=>goTo(Number(button.dataset.go))));
document.querySelectorAll<HTMLButtonElement>('[data-dialog]').forEach(button=>button.addEventListener('click',()=>{
  const dialog=document.querySelector<HTMLDialogElement>(`#${button.dataset.dialog}-dialog`)!;
  lastDialogTrigger=button;
  lenis.stop();
  dialog.showModal();
  dialog.querySelector<HTMLButtonElement>('[data-close]')?.focus();
}));
dialogs.forEach(dialog=>{
  dialog.addEventListener('close',()=>{
    if(dialog.dataset.navigating){delete dialog.dataset.navigating;return;}
    lenis.start();lastDialogTrigger?.focus({preventScroll:true});
  });
  dialog.querySelector('[data-close]')?.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  dialog.setAttribute('data-lenis-prevent','');
});

function updateSwitch(id: string, checked: boolean) {document.querySelector(`#${id}`)!.setAttribute('aria-checked',String(checked));}
document.querySelector('#gate-control')!.addEventListener('click',()=>{
  gate=!gate;updateSwitch('gate-control',gate);
  document.querySelector('#gate-state')!.textContent=gate?'on':'off';
  document.querySelector('#channel-state')!.textContent=gate?'Channel open':'Channel closed';
  stage?.setSettings({gate:gate?1:0});
});
document.querySelector('#signal-control')!.addEventListener('click',()=>{
  power=!power;updateSwitch('signal-control',power);
  document.querySelector('#power-state')!.textContent=power?'on':'off';
  document.querySelector('#activity-state')!.textContent=power?'Circuit active':'Circuit at rest';
  stage?.setSettings({power:power?1:0});
});
for(const key of Object.keys(manual) as (keyof typeof manual)[]){
  document.querySelector<HTMLInputElement>(`#${key}`)!.addEventListener('input',event=>{
    const input=event.target as HTMLInputElement;
    manual[key]=true;userValues[key]=Number(input.value)/100;
    stage?.setSettings(key==='exposure'?{exposure:userValues[key]}:{spread:userValues[key]});
    updateView(progress);
  });
  document.querySelector(`[data-auto="${key}"]`)!.addEventListener('click',()=>{
    manual[key]=false;
    stage?.setSettings(key==='exposure'?{exposure:-1}:{spread:-1});updateView(progress);
  });
}

const motionButton=document.querySelector<HTMLButtonElement>('#motion-control')!;
motionButton.addEventListener('click',()=>{
  paused=!paused;stage?.setSettings({paused});
  motionButton.setAttribute('aria-pressed',String(paused));
  motionButton.setAttribute('aria-label',paused?'Resume ambient motion':'Pause ambient motion');
  motionButton.querySelector('span')!.textContent=paused?'Motion paused':'Motion on';
  motionButton.querySelector('svg')!.innerHTML=paused?'<path d="m7 4 8 6-8 6V4Z" stroke="currentColor" stroke-width="1.2"/>':'<path d="M7 5v10M13 5v10" stroke="currentColor" stroke-width="1.2"/>';
});

function setReduced(value: boolean) {
  reduced=value;document.body.classList.toggle('reduced-motion',reduced);
  updateSwitch('reduced-control',reduced);
  lenis.options.smoothWheel=!reduced;
  stage?.setSettings({reduced});
  updateView(progress);
}
document.querySelector('#reduced-control')!.addEventListener('click',()=>setReduced(!reduced));
reducedQuery.addEventListener('change',event=>setReduced(event.matches));

window.addEventListener('pointermove',event=>{
  if(event.pointerType==='mouse'&&!dialogs.some(d=>d.open))stage?.setPointer((event.clientX/window.innerWidth-.5)*2,(event.clientY/window.innerHeight-.5)*2);
},{passive:true});
document.addEventListener('pointerleave',()=>stage?.setPointer(0,0));
function takeScrollControl() {
  navigationTarget=null; navigationSequence++;
  if(resizeAnchor!==null){clearTimeout(resizeTimer);resizeAnchor=null;lenis.resize();ScrollTrigger.refresh();}
}
window.addEventListener('wheel',takeScrollControl,{passive:true});
window.addEventListener('touchstart',takeScrollControl,{passive:true});
window.addEventListener('keydown',event=>{
  if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)&&!(event.target instanceof HTMLInputElement))takeScrollControl();
});
function restoreViewport() {
  clearTimeout(resizeTimer); resizeAnchor=null; navigationTarget=null; navigationSequence++;
  stage?.resize(); stage?.invalidate(); lenis.resize(); ScrollTrigger.refresh();
  if(!document.hidden&&!dialogs.some(dialog=>dialog.open))lenis.start();
}
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){
    gsap.ticker.remove(frame);
    clearTimeout(resizeTimer);resizeAnchor=null;navigationTarget=null;navigationSequence++;
    lenis.stop();stage?.invalidate();
  }else if(!disposed){gsap.ticker.add(frame);restoreViewport();}
});
window.addEventListener('pageshow',()=>{if(!disposed){gsap.ticker.add(frame);restoreViewport();}});
window.addEventListener('pagehide',event=>{
  gsap.ticker.remove(frame);clearTimeout(resizeTimer);
  if(!event.persisted)dispose();
});
window.addEventListener('resize',()=>{
  if(resizeAnchor===null)resizeAnchor=navigationTarget??progress;
  stage?.resize();
  clearTimeout(resizeTimer);
  resizeTimer=setTimeout(()=>{
    const anchor=navigationTarget??resizeAnchor??progress;
    lenis.resize();ScrollTrigger.refresh();
    const target=journey.getBoundingClientRect().top+window.scrollY+(anchor/7.999)*(journey.offsetHeight-window.innerHeight);
    lenis.scrollTo(target,{immediate:true,force:true});
    resizeAnchor=null;navigationTarget=null;navigationSequence++;updateView(anchor);ScrollTrigger.update();
  },120);
},{passive:true});

const frame=(time:number)=>{if(disposed||document.hidden)return;lenis.raf(time*1000);stage?.tick(time);};
gsap.ticker.add(frame);
setReduced(reduced);
updateView(0);

// Render text immediately; geometry is prepared without a full-screen loader.
const { SiliconStage: Stage }=await import('./scene/stage');
if(!disposed){
stage=new Stage(artwork,fallback=>{document.querySelector<HTMLElement>('.view-status')!.hidden=!fallback;});
stage.setSettings({reduced,paused,gate:gate?1:0});
stage.setProgress(progress);
document.body.classList.add('is-ready');
await document.fonts.ready;
if(!disposed){
lenis.resize();ScrollTrigger.refresh();
const initialChapter=chapters.findIndex(ch=>`#${ch.id}`===location.hash);
if(initialChapter>0&&window.scrollY<8)goTo(initialChapter);

// A read-only diagnostics snapshot is useful for local verification and never enters the UI.
if(import.meta.env.DEV)Object.defineProperty(window,'siliconExhibit',{value:{
  snapshot:()=>({ ...stage?.getDiagnostics(), activeChapter:chapters[activeChapter].id, gate, power, manual:{...manual}, scrollY:window.scrollY, maxScroll:journey.offsetHeight-window.innerHeight, dialog:dialogs.find(d=>d.open)?.id??null }),
},writable:false,configurable:true});
}
}

function dispose(){
  if(disposed)return;disposed=true;
  clearTimeout(resizeTimer);gsap.ticker.remove(frame);trigger.kill();lenis.destroy();stage?.dispose();stage=undefined;
}
if(import.meta.hot){import.meta.hot.dispose(dispose);}
