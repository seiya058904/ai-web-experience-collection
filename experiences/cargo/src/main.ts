import 'lenis/dist/lenis.css';
import './style.css';
import Lenis from 'lenis';
import gsap from 'gsap';
import { softText } from '../../shared/soft-swap.ts';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { chapters, transitions } from './story-data';
import { renderApp, chapterState, plus, minus } from './render';
import { evaluateStory, evaluateTransition, clamp, type SegmentMetric } from './story-state';
import { createContainerScene, type ContainerSceneController } from './container-scene';
import { renderContainerFallback, type ContainerState, type ContainerHighlight } from './container-fallback';

gsap.registerPlugin(ScrollTrigger);
document.querySelector<HTMLDivElement>('#app')!.innerHTML = renderApp();

const root = document.documentElement;
const chapterElements = [...document.querySelectorAll<HTMLElement>('.chapter')];
const boundaryElements = [...document.querySelectorAll<HTMLElement>('.handoff')];
const menu = document.querySelector<HTMLDialogElement>('#chapters-dialog')!;
const about = document.querySelector<HTMLDialogElement>('#about-dialog')!;
const motionButton = document.querySelector<HTMLButtonElement>('#motion-toggle')!;
const states = new Map(chapters.map(c => [c.number, chapterState(c.number)]));
const transitionSelections = new Map<number, number>();
const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let savedMotion: string | null = null;
try { savedMotion = localStorage.getItem('cargo-motion'); } catch { /* Reading remains available. */ }
let reduced = new URLSearchParams(location.search).has('stills') || (savedMotion ? savedMotion === 'reduced' : mediaQuery.matches);
let lenis!: Lenis;
let segments: SegmentMetric[] = [];
let metricsDirty = true;
let currentChapter = -1;
let activeSlot: HTMLElement | null = null;
let lastLiveState: ContainerState | null = null;
let scene: ContainerSceneController | null = null;
let sharedHost: HTMLDivElement | null = null;
let opener: HTMLElement | null = null;
let toastTimer = 0;
let lastFrame = '';

function makeLenis() {
  lenis = new Lenis({ autoRaf: false, smoothWheel: !reduced, syncTouch: false, duration: .8, anchors: false, prevent: node => node.closest('dialog') !== null });
  lenis.on('scroll', ScrollTrigger.update);
}

function measure() {
  segments = [...document.querySelectorAll<HTMLElement>('.chapter, .handoff')].map(el => ({
    id: el.id, top: el.getBoundingClientRect().top + window.scrollY, height: el.offsetHeight,
    kind: el.classList.contains('chapter') ? 'chapter' as const : 'transition' as const,
    index: el.classList.contains('chapter') ? Number(el.dataset.chapter) - 1 : Number(el.dataset.transition),
  }));
  lenis?.resize();
  metricsDirty = false;
}

function showToast(message: string) {
  const toast = document.querySelector<HTMLDivElement>('.toast')!;
  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 4200);
}

function retainActiveModelPose() {
  if (!activeSlot) return;
  const still = activeSlot.querySelector<HTMLElement>('.model-still');
  if (still && lastLiveState) still.innerHTML = renderContainerFallback(lastLiveState);
  activeSlot.dataset.live = 'false';
}

function activateModel(slot: HTMLElement | null, state?: ContainerState) {
  if (!slot || !state) {
    retainActiveModelPose();
    if (sharedHost) sharedHost.hidden = true;
    activeSlot = null;
    lastLiveState = null;
    return;
  }
  if (!sharedHost) {
    sharedHost = document.createElement('div');
    sharedHost.className = 'shared-model';
    slot.append(sharedHost);
    scene = createContainerScene(sharedHost);
  }
  if (activeSlot !== slot) {
    retainActiveModelPose();
    slot.append(sharedHost);
    sharedHost.hidden = false;
    slot.dataset.live = 'true';
    activeSlot = slot;
    scene!.resize();
  }
  lastLiveState = { ...state, reduced };
  scene!.setState(lastLiveState);
}

function updateStatic(c: number) {
  const state = { ...states.get(c)!, reduced };
  const id = `ch-${String(c).padStart(2,'0')}`;
  document.querySelectorAll<HTMLElement>(`#${id} .model-slot`).forEach(slot => {
    const still = slot.querySelector<HTMLElement>('.model-still');
    if (still) still.innerHTML = renderContainerFallback(state);
  });
  lastFrame = '';
}

function setMotion(value: boolean, persist = true) {
  reduced = value;
  root.dataset.motion = reduced ? 'reduced' : 'full';
  motionButton.textContent = reduced ? 'Motion: Reduced' : 'Motion: On';
  motionButton.setAttribute('aria-pressed', String(reduced));
  if (persist) try { localStorage.setItem('cargo-motion', reduced ? 'reduced' : 'full'); savedMotion = reduced ? 'reduced' : 'full'; } catch { /* Preference is optional. */ }
  if (lenis) lenis.destroy();
  makeLenis();
  chapters.forEach(c => updateStatic(c.number));
  boundaryElements.forEach((el, i) => {
    const p = reduced ? transitionSelections.get(i) ?? 1 : 0;
    el.querySelector<HTMLElement>('.model-still')!.innerHTML = renderContainerFallback(evaluateTransition(i,p,reduced).container);
    el.querySelector<HTMLElement>('.stage-caption')!.textContent = transitions[i].stages[Math.min(4,Math.floor(p*4))];
    el.querySelectorAll<HTMLButtonElement>('[data-transition-stage]').forEach((b,j)=>b.setAttribute('aria-pressed',String(j===Math.min(4,Math.floor(p*4)))));
  });
  metricsDirty = true;
  ScrollTrigger.refresh();
}

function closeDialog(dialog: HTMLDialogElement, restoreFocus = true) {
  if (!dialog.open) return;
  dialog.close();
  root.classList.remove('dialog-open');
  if (restoreFocus) opener?.focus({ preventScroll: true });
}

function openDialog(name: string, button: HTMLElement) {
  const dialog = name === 'chapters' ? menu : about;
  opener = button;
  dialog.showModal();
  root.classList.add('dialog-open');
  dialog.querySelector<HTMLButtonElement>('.close-dialog')!.focus();
}

function navigate(id: string, immediate = reduced, addHistory = true) {
  const target = document.getElementById(id);
  if (!target) return;
  closeDialog(menu, false); closeDialog(about, false);
  if (addHistory && location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
  if (metricsDirty) measure();
  const focus = () => {
    const heading = target.querySelector<HTMLElement>('h1, h2');
    if (heading) heading.focus({ preventScroll: true });
    else if (id === 'main') { target.tabIndex = -1; target.focus({preventScroll:true}); }
  };
  lenis.scrollTo(target, { offset: id === 'ch-01' ? 0 : -72, immediate, duration: .85, onComplete: focus });
  if (immediate) focus();
}

function transitionStage(index: number, stage: number) {
  const p = stage / 4;
  transitionSelections.set(index,p);
  if (reduced) {
    const el = boundaryElements[index];
    const frame = evaluateTransition(index,p,true);
    el.querySelector<HTMLElement>('.model-still')!.innerHTML = renderContainerFallback(frame.container);
    el.querySelector<HTMLElement>('.stage-caption')!.textContent = transitions[index].stages[stage];
    el.querySelectorAll<HTMLButtonElement>('[data-transition-stage]').forEach((b,j)=>b.setAttribute('aria-pressed',String(j===stage)));
    lastFrame = '';
  } else {
    if (metricsDirty) measure();
    const m = segments.find(x=>x.id===transitions[index].id)!;
    lenis.scrollTo(m.top + p * Math.max(1,m.height-innerHeight), {immediate:true});
  }
}

function setPressed(container: Element, action: string, value: string) {
  container.querySelectorAll<HTMLButtonElement>(`[data-action="${action}"]`).forEach(button=>button.setAttribute('aria-pressed', String(button.dataset.value===value)));
}

function result(section: HTMLElement, value: string) {
  section.querySelector<HTMLElement>('.interaction-result')!.textContent = value;
}

document.addEventListener('click', event => {
  const origin = event.target as Element;
  const anchor = origin.closest<HTMLAnchorElement>('a[href^="#"]');
  if (anchor) {
    event.preventDefault(); navigate(anchor.hash.slice(1)); return;
  }
  const button = origin.closest<HTMLButtonElement>('button');
  if (!button) return;
  if (button.dataset.dialog) { openDialog(button.dataset.dialog,button); return; }
  if (button.classList.contains('close-dialog')) { closeDialog(button.closest('dialog')!); return; }
  if (button.id === 'motion-toggle') { setMotion(!reduced); return; }
  if (button.id === 'stills-toggle') { setMotion(true); closeDialog(menu); showToast('Still view is on. Every chapter and interaction remains available.'); return; }
  if (button.id === 'sound-toggle') { showToast('Audio is unavailable in this version.'); return; }
  if (button.dataset.transitionStage) {
    const [index,stage] = button.dataset.transitionStage.split(':').map(Number); transitionStage(index,stage); return;
  }
  if (button.classList.contains('retry-image')) {
    const figure = button.closest<HTMLElement>('.photograph')!;
    const image = figure.querySelector<HTMLImageElement>('img')!;
    const retry = String(Date.now());
    const retryUrl = (src: string) => {
      const url = new URL(src, document.baseURI);
      url.searchParams.set('retry', retry);
      return url.href;
    };
    const retrySrcset = (srcset: string) => srcset.split(',').map(candidate => {
      const [src, ...descriptor] = candidate.trim().split(/\s+/);
      return [retryUrl(src), ...descriptor].join(' ');
    }).join(', ');
    figure.querySelectorAll<HTMLSourceElement>('picture source[srcset]').forEach(source => {
      source.srcset = retrySrcset(source.srcset);
    });
    if (image.srcset) image.srcset = retrySrcset(image.srcset);
    image.src = retryUrl(image.src);
    return;
  }
  const section = button.closest<HTMLElement>('.chapter');
  if (!section) return;
  const number = Number(section.dataset.chapter);
  const state = states.get(number)!;
  const action = button.dataset.action;
  const value = button.dataset.value;
  if (action === 'packing') {
    state.packed = value === 'packed';
    setPressed(section,'packing',value!);
    result(section,state.packed ? 'Packed interior. The same six timber blocks will appear at the destination.' : 'Empty interior. The wall, floor and doorway define a finite space.');
  } else if (action === 'doors') {
    state.doorsOpen = value === 'open' ? 1 : 0;
    setPressed(section,'doors',value!);
    result(section,state.doorsOpen ? number === 11 ? 'Open again. The same six timber blocks are still inside.' : 'Open doors. The illustrative seal is not applied.' : 'Closed doors. Illustrative seal recorded for BOX-001.');
  } else if (action === 'carrier' || action === 'reset-carrier') {
    state.mode = action === 'reset-carrier' ? 'road' : value === 'rail' ? 'rail' : 'road';
    state.highlight = 'none';
    setPressed(section,'carrier',state.mode);
    section.querySelector('[data-action="compare-supports"]')?.setAttribute('aria-pressed','false');
    result(section,`${state.mode === 'road' ? 'Road chassis' : 'Rail wagon'} selected. The same box rests at its corner interfaces.`);
  } else if (action === 'compare-supports') {
    state.highlight = state.highlight === 'corners' ? 'none' : 'corners';
    button.setAttribute('aria-pressed',String(state.highlight==='corners'));
    result(section,state.highlight==='corners' ? 'Corner interfaces highlighted. Select Road or Rail to compare the carrier beneath the unchanged box.' : 'The complete carrier view is restored.');
  } else if (action === 'inspect') {
    const panel = section.querySelector<HTMLElement>('.inspection')!;
    panel.hidden = !panel.hidden;
    button.setAttribute('aria-expanded',String(!panel.hidden));
    section.querySelector<HTMLElement>('.photo-marker')!.hidden = panel.hidden;
    state.highlight = 'identity';
    result(section,panel.hidden ? 'Inspection closed.' : 'BOX-001 identified. The interface study is open below.');
    if (!panel.hidden) lenis.scrollTo(panel,{offset:-92,immediate:reduced,duration:.65});
  } else if (action === 'highlight') {
    state.highlight = value as ContainerHighlight;
    setPressed(section,'highlight',value!);
    result(section,value==='corners' ? 'The corner fittings are highlighted in the same physical locations.' : value==='doors' ? 'The two original doors and locking bars are highlighted.' : 'CARGO / BOX-001 is a fictional exhibit ID.');
  } else if (action === 'reset-view') {
    states.set(number,chapterState(number));
    setPressed(section,'highlight','none');
    section.querySelector<HTMLElement>('.photo-marker')!.hidden = true;
    const input = section.querySelector<HTMLInputElement>('input[type="range"]');
    if (input) input.value='72';
    result(section,'The original view is restored.');
  } else if (action === 'locate') {
    const marker = section.querySelector<HTMLElement>('.photo-marker')!;
    marker.hidden = !marker.hidden;
    button.setAttribute('aria-expanded',String(!marker.hidden));
    button.innerHTML = marker.hidden ? `${chapters[number-1].actionLabel} ${plus}` : `Reset view ${minus}`;
    result(section,marker.hidden ? 'The complete composition is restored.' : 'BOX-001 is marked in the illustration. This is not a live position.');
    if (!marker.hidden) lenis.scrollTo(section,{offset:-72,immediate:reduced,duration:.65});
  } else if (action === 'ports') {
    const panel = section.querySelector<HTMLElement>('.port-comparison')!;
    panel.hidden = !panel.hidden;
    section.querySelector('.primary-action')!.setAttribute('aria-expanded',String(!panel.hidden));
    result(section,panel.hidden ? 'Port comparison closed.' : 'Departure and arrival are shown together. Both locations are illustrative.');
    if (!panel.hidden) lenis.scrollTo(panel,{offset:-92,immediate:reduced,duration:.65});
  }
  updateStatic(number);
  metricsDirty = true;
});

document.addEventListener('input', event => {
  const input = event.target as HTMLInputElement;
  if (input.dataset.action !== 'lift-position') return;
  const section = input.closest<HTMLElement>('.chapter')!;
  const state = states.get(8)!;
  state.progress = clamp(Number(input.value)/100);
  result(section,state.progress<.45 ? 'The box remains grounded while the spreader approaches.' : 'The spreader is engaged. Box and spreader move together.');
  updateStatic(8);
});

for (const dialog of [menu,about]) {
  dialog.addEventListener('cancel',()=>{root.classList.remove('dialog-open');opener?.focus({preventScroll:true});});
  dialog.addEventListener('click',event=>{ if(event.target===dialog) { const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) closeDialog(dialog); }});
}

document.querySelectorAll<HTMLImageElement>('[data-scene-image]').forEach(image => {
  const figure = image.closest<HTMLElement>('.photograph')!;
  const failed = () => { figure.classList.add('asset-failed'); figure.querySelector<HTMLElement>('.scene-fallback')!.hidden=false; metricsDirty=true; };
  image.addEventListener('error',failed);
  image.addEventListener('load',()=>{figure.classList.remove('asset-failed');figure.querySelector<HTMLElement>('.scene-fallback')!.hidden=true;metricsDirty=true;});
  if (image.complete && image.naturalWidth===0) failed();
});

function update(t: number) {
  if (document.hidden) return;
  lenis.raf(t*1000);
  if (metricsDirty) measure();
  const snapshot = evaluateStory({scrollY:window.scrollY,viewport:{width:innerWidth,height:innerHeight},segments,reduced});
  root.style.setProperty('--story-progress',String(snapshot.overall));
  root.dataset.activeChapter=String(snapshot.chapterIndex+1);
  root.dataset.activeTransition=String(snapshot.transitionIndex);
  root.dataset.transitionProgress=snapshot.transitionProgress.toFixed(4);
  if (snapshot.chapterIndex!==currentChapter) {
    currentChapter=snapshot.chapterIndex;
    const mobileStatus=document.querySelector<HTMLElement>('.rail-status');
    softText(mobileStatus,`${String(currentChapter+1).padStart(2,'0')} / 11 · ${chapters[currentChapter]?.name ?? 'One Box'}`,{instant:reduced});
    document.querySelectorAll<HTMLAnchorElement>('.chapter-rail a, .chapter-list a').forEach(a=>{
      if(a.hash===`#${chapters[currentChapter]?.id}`)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');
    });
  }
  if (snapshot.transitionIndex>=0) {
    const index=snapshot.transitionIndex;
    const p=reduced ? transitionSelections.get(index)??1 : snapshot.transitionProgress;
    const frame=evaluateTransition(index,p,reduced);
    const el=boundaryElements[index];
    const key=`${index}:${p.toFixed(4)}:${reduced}`;
    if(key!==lastFrame) {
      lastFrame=key;
      el.dataset.stage=String(frame.stage);
      el.dataset.support=frame.support;
      el.dataset.progress=p.toFixed(4);
      softText(el.querySelector<HTMLElement>('.stage-caption'),transitions[index].stages[frame.stage],{instant:reduced});
      el.querySelectorAll<HTMLButtonElement>('[data-transition-stage]').forEach((b,j)=>b.setAttribute('aria-pressed',String(j===frame.stage)));
      const art=el.querySelector<HTMLElement>('.handoff-art')!;
      art.dataset.environment=frame.environment;
      art.style.setProperty('--occlusion',String(reduced?0:frame.occlusion));
      art.style.setProperty('--camera-scale',String(reduced?1:frame.cameraScale));
      art.style.setProperty('--camera-x',`${reduced?0:frame.cameraX}%`);
      activateModel(el.querySelector<HTMLElement>('.model-slot'),frame.container);
    }
  } else {
    lastFrame='';
    const chapter=chapterElements[snapshot.chapterIndex];
    let chosen: HTMLElement|null=null;
    chapter?.querySelectorAll<HTMLElement>('.model-slot').forEach(slot=>{
      if(slot.closest('[hidden]') || slot.closest('.scene-fallback') && !slot.closest('.asset-failed'))return;
      const rect=slot.getBoundingClientRect();
      if(rect.bottom>90&&rect.top<innerHeight-40)chosen=slot;
    });
    activateModel(chosen,states.get(snapshot.chapterIndex+1));
  }
  // Photograph motion is bounded and uses the exact same current scroll snapshot.
  const photo=chapterElements[snapshot.chapterIndex]?.querySelector<HTMLElement>('.photograph');
  if(photo){
    const y=photo.getBoundingClientRect().top;
    photo.style.setProperty('--photo-shift',`${reduced||innerWidth<701?0:clamp(-y/innerHeight,-1,1)*16}px`);
  }
}

setMotion(reduced,false);
const masterTrigger=ScrollTrigger.create({start:0,end:'max',onRefresh:()=>{metricsDirty=true;}});
gsap.ticker.add(update);
gsap.ticker.lagSmoothing(0);
const observer=new ResizeObserver(()=>{metricsDirty=true;});
observer.observe(document.body);
window.addEventListener('resize',()=>{metricsDirty=true;lastFrame='';scene?.resize();ScrollTrigger.refresh();});
window.addEventListener('popstate',()=>{if(location.hash)navigate(location.hash.slice(1),true,false);else lenis.scrollTo(0,{immediate:true});});
window.addEventListener('hashchange',()=>{if(location.hash)navigate(location.hash.slice(1),true,false);});
mediaQuery.addEventListener('change',event=>{if(!savedMotion)setMotion(event.matches,false);});
document.addEventListener('visibilitychange',()=>{root.classList.toggle('page-hidden',document.hidden);if(!document.hidden){metricsDirty=true;lastFrame='';scene?.resize();ScrollTrigger.refresh();}});
document.fonts.ready.then(()=>{metricsDirty=true;ScrollTrigger.refresh();root.dataset.fonts='ready';});
window.addEventListener('pagehide',()=>{
  try{sessionStorage.setItem('cargo-position',JSON.stringify({path:location.pathname,hash:location.hash,y:scrollY}));}catch{/* Optional restoration. */}
});
window.addEventListener('pageshow',()=>{metricsDirty=true;lastFrame='';});
window.addEventListener('beforeunload',()=>{masterTrigger.kill();gsap.ticker.remove(update);lenis.destroy();scene?.dispose();observer.disconnect();});

measure();
const navigation=performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined;
let restored=false;
if(navigation?.type==='reload')try{
  const saved=JSON.parse(sessionStorage.getItem('cargo-position')??'null');
  if(saved&&saved.path===location.pathname&&saved.hash===location.hash){lenis.scrollTo(saved.y,{immediate:true});restored=true;}
}catch{/* Ignore invalid optional storage. */}
if(!restored&&location.hash)navigate(location.hash.slice(1),true,false);
if(!reduced&&!location.hash)gsap.fromTo('.hero-photograph .scene-copy',{y:12,opacity:.88},{y:0,opacity:1,duration:1.1,ease:'power2.out'});
root.dataset.ready='true';
