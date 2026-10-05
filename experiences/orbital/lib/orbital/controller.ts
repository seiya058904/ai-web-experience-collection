import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { createFlightScene, type FlightScene } from './flight-scene';
import { CHAPTERS, chapterVisibility, clamp, smooth, type Destination, type Subsystem } from './mission';
import { MissionAudio } from './audio';

export interface MissionController {goTo:(chapter:number)=>void;setLocked:(locked:boolean)=>void;setReduced:(value:boolean)=>void;setDestination:(value:Destination)=>void;setSubsystem:(value:Subsystem)=>void;toggleSound:()=>Promise<boolean>;destroy:()=>void;}

export function createMission(root:HTMLElement,onChapter:(chapter:number)=>void,onReduced:(value:boolean)=>void):MissionController {
  gsap.registerPlugin(ScrollTrigger);
  const track=root.querySelector<HTMLElement>('[data-scroll-track]')!;
  const viewport=root.querySelector<HTMLElement>('.mission-viewport')!;
  const canvas=root.querySelector<HTMLCanvasElement>('[data-universe]')!;
  const chapters=Array.from(root.querySelectorAll<HTMLElement>('[data-chapter]'));
  const earth=root.querySelector<HTMLElement>('.earth-background')!;
  const launch=root.querySelector<HTMLElement>('.launch-background')!;
  const mars=root.querySelector<HTMLElement>('.mars-background')!;
  const technical=root.querySelector<HTMLElement>('[data-technical]')!;
  const ascentScale=root.querySelector<HTMLElement>('[data-ascent-scale]')!;
  const timeline=root.querySelector<HTMLElement>('[data-timeline-progress]')!;
  const speedNodes=Array.from(root.querySelectorAll<HTMLElement>('[data-flight-speed]'));
  const altitudeNodes=Array.from(root.querySelectorAll<HTMLElement>('[data-flight-altitude]'));
  const crosses=Array.from(root.querySelectorAll<HTMLElement>('.orbital-crosshair'));
  const reducedMedia=window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced=reducedMedia.matches;let destroyed=false;let progress=0;let totalTravel=1;let step=1;let active=-1;let ambient=0;let resizeTimer:ReturnType<typeof setTimeout>|undefined;let measured=false;let locked=false;
  let destination:Destination='mars';let destinationMix=0;let subsystem:Subsystem='propulsion';let lastSpeed='',lastAltitude='';let previousY=-1;let dirty=true;let lastStamp=0;let sceneVisible=true;let navigationGoal:number|null=null;let navigationSerial=0;
  const audio=new MissionAudio();
  let pendingReadyMeasure=false;
  const lenis=new Lenis({autoRaf:false,smoothWheel:!reduced,lerp:.105,syncTouch:false,wheelMultiplier:1,anchors:false,autoResize:true});
  const scene:FlightScene|null=createFlightScene(canvas,status=>{root.dataset.renderer=status;dirty=true;lastStamp=-1;});
  if(!scene)root.dataset.renderer='fallback';
  const viewportObserver=new IntersectionObserver(entries=>{sceneVisible=entries[0]?.isIntersecting??true;audio.visibility(document.hidden||!sceneVisible);if(sceneVisible){dirty=true;lastStamp=-1;}},{threshold:0});viewportObserver.observe(viewport);
  root.dataset.reduced=String(reduced);onReduced(reduced);

  function measure(preserve=true){
    if(destroyed)return;
    const previousProgress=progress;const resumeNavigation=navigationGoal;
    const h=viewport.clientHeight;const w=viewport.clientWidth;
    step=Math.max(w<=760?760:1050,h*(reduced?1.06:1.65));totalTravel=step*CHAPTERS.length;
    track.style.height=(totalTravel+h)+'px';
    scene?.resize(w,h);lenis.resize();
    if(measured&&preserve&&!location.hash.includes('mission-reading'))lenis.scrollTo(previousProgress/8*totalTravel,{immediate:true,force:true});
    measured=true;ScrollTrigger.refresh();dirty=true;lastStamp=-1;if(resumeNavigation!==null)goTo(resumeNavigation);
  }
  measure(false);
  const trigger=ScrollTrigger.create({trigger:track,start:'top top',end:()=>'+='+totalTravel,invalidateOnRefresh:true,onUpdate:self=>{progress=clamp(self.progress)*8;dirty=true;}});
  lenis.on('scroll',()=>ScrollTrigger.update());
  gsap.ticker.lagSmoothing(0);

  function updateDom(delta:number){
    const current=Math.min(7,Math.max(0,Math.floor(progress)));
    const local=progress-current;
    const phase=current===0&&local<.72||current===7&&local>=.18?'hold':local<.18?'enter':local>.72?'exit':'hold';
    root.dataset.phase=phase;root.dataset.progress=progress.toFixed(4);
    if(current!==active){active=current;root.dataset.scene=CHAPTERS[current].id;onChapter(current);}
    for(let i=0;i<chapters.length;i++){
      const el=chapters[i];const v=chapterVisibility(progress,i);const visible=v>.001;const t=progress-i;
      el.style.opacity=v.toFixed(4);el.style.visibility=visible?'visible':'hidden';el.inert=!(visible&&v>.15);
      if(!reduced){const entering=t<.18;const shift=entering?(1-v)*3.1:-(1-v)*2.0;const scale=entering?1+(1-v)*.028:1-(1-v)*.022;el.style.transform='translate3d('+shift+'vw,0,0) scale('+scale+')';}
      else el.style.transform='none';
    }
    // The Earth plate stays opaque behind the incoming launch layer; no double-faded dissolve.
    const launchIn=smooth((progress-.56)/.59);const launchOut=1-smooth((progress-1.72)/.54);const launchAlpha=launchIn*launchOut;
    const earthHero=1-smooth((progress-1.42)/.5);const earthReturn=smooth((progress-1.72)/.54)*(1-smooth((progress-4.76)/.5));
    earth.style.opacity=String(Math.max(earthHero,earthReturn*.72));
    const heroTravel=smooth((progress-.60)/.62);const returnMix=smooth((progress-1.55)/.7);const returnScale=1+heroTravel*.45*(1-returnMix);
    const earthY=heroTravel*19*(1-returnMix)+(24+Math.max(0,progress-3)*7)*returnMix;
    earth.style.transform=reduced?'none':'translate3d(0,'+earthY+'%,0) scale('+returnScale+')';
    launch.style.opacity=String(launchAlpha);launch.style.transform=reduced?'none':'translate3d(0,'+(-Math.max(0,progress-1.4)*19)+'%,0) scale('+(1+Math.max(0,progress-1)*.11)+')';
    const target=destination==='moon'?1:0;destinationMix=reduced?target:destinationMix+(target-destinationMix)*(1-Math.exp(-delta*7));
    const marsIn=smooth((progress-5.74)/.46);const marsOut=1-smooth((progress-6.74)/.5);
    mars.style.opacity=String(marsIn*marsOut*(1-destinationMix));
    const marsMove=1-marsIn;const marsEnd=smooth((progress-6.75)/.5);
    mars.style.transform=reduced?'none':'translate3d('+((marsMove*16)+(marsEnd*28))+'%,0,0) scale('+(1.06-marsEnd*.12)+')';
    const machineAmount=smooth((progress-3.76)/.42)*(1-smooth((progress-4.74)/.45));technical.style.opacity=String(machineAmount*.35);
    technical.style.transform=reduced?'none':'translate3d('+((1-machineAmount)*5)+'%,0,0)';
    ascentScale.style.opacity=String(smooth((progress-1.89)/.32)*(1-smooth((progress-2.72)/.35))*.78);
    const orbitAmount=smooth((progress-4.84)/.43)*(1-smooth((progress-5.72)/.45));crosses.forEach(c=>c.style.opacity=String(orbitAmount*.8));
    timeline.style.transform='scaleX('+clamp(progress/7.45)+')';
    const velocity=progress<1?0:progress<2?Math.round(smooth(progress-1)*400):progress<3?Math.round(400+smooth(progress-2)*2000):Math.round(2400+smooth((progress-3)/2)*5300);
    const altitude=progress<1?0:progress<2?Math.round(smooth(progress-1)*12):progress<3?Math.round(12+smooth(progress-2)*70):Math.round(82+smooth((progress-3)/2)*318);
    const speed=String(velocity).padStart(4,'0');const alt=String(altitude).padStart(3,'0');
    if(speed!==lastSpeed){speedNodes.forEach(el=>el.textContent=speed);lastSpeed=speed;}
    if(alt!==lastAltitude){altitudeNodes.forEach(el=>el.textContent=alt);lastAltitude=alt;}
    if(root.dataset.renderer==='fallback'){earth.style.opacity=String(Math.max(Number(earth.style.opacity),current===5?1:0));technical.style.opacity=String(current===3||current===4?.45:0);}
    audio.update(progress);
  }

  function tick(time:number,deltaMS:number){
    if(destroyed||document.hidden)return;
    const delta=Math.min(.05,Math.max(.001,deltaMS/1000));
    if(!locked)lenis.raf(time*1000);
    if(pendingReadyMeasure&&!locked&&Math.abs(lenis.velocity)<.1&&Math.abs(lenis.targetScroll-lenis.animatedScroll)<1){pendingReadyMeasure=false;measure(true);}
    const y=window.scrollY;if(y!==previousY){previousY=y;ScrollTrigger.update();dirty=true;}
    if(!sceneVisible)return;
    if(!reduced)ambient+=delta;
    const shouldPaint=dirty||lastStamp!==progress||Math.abs(destinationMix-(destination==='moon'?1:0))>.001;
    if(shouldPaint){updateDom(delta);dirty=false;}
    // Static mode renders only on a changed state, and all motion shares this one clock.
    if(!reduced||shouldPaint){scene?.render(reduced?Math.min(7,Math.floor(progress))+.36:progress,ambient,reduced,destination,subsystem);lastStamp=progress;}
  }
  gsap.ticker.add(tick);
  updateDom(1/60);scene?.render(reduced?Math.min(7,Math.floor(progress))+.36:progress,0,reduced,destination,subsystem);

  function cancelNavigation(){const wasNavigating=navigationGoal!==null;navigationGoal=null;navigationSerial++;if(wasNavigating)lenis.scrollTo(window.scrollY,{immediate:true,force:true});}
  function navigationKey(event:KeyboardEvent){if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key))cancelNavigation();}
  window.addEventListener('wheel',cancelNavigation,{passive:true,capture:true});window.addEventListener('touchstart',cancelNavigation,{passive:true,capture:true});window.addEventListener('pointerdown',cancelNavigation,{passive:true,capture:true});window.addEventListener('keydown',navigationKey,true);
  function resize(){clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>measure(true),160);}
  function visibility(){audio.visibility(document.hidden||!sceneVisible);if(!document.hidden){lenis.scrollTo(window.scrollY,{immediate:true,force:true});ScrollTrigger.update();dirty=true;lastStamp=-1;}}
  function readingChange(){if(destroyed)return;lenis.resize();ScrollTrigger.refresh();if(location.hash==='#mission-reading'){const reading=root.querySelector<HTMLElement>('#mission-reading')!;lenis.scrollTo(reading,{immediate:true,force:true});reading.querySelector<HTMLElement>('h2')?.focus({preventScroll:true});}}
  function readingFocus(event:FocusEvent){if((event.target as HTMLElement)?.closest('#mission-reading'))lenis.resize();}
  window.addEventListener('hashchange',readingChange);root.addEventListener('focusin',readingFocus);
  function motionChange(){setReduced(reducedMedia.matches);}
  const sizeObserver=new ResizeObserver(resize);sizeObserver.observe(viewport);
  window.addEventListener('resize',resize);document.addEventListener('visibilitychange',visibility);reducedMedia.addEventListener('change',motionChange);
  void document.fonts.ready.then(()=>{if(!destroyed)pendingReadyMeasure=true;});
  void Promise.allSettled(Array.from(root.querySelectorAll<HTMLImageElement>('.scene-background')).map(img=>img.decode())).then(()=>{if(!destroyed)pendingReadyMeasure=true;});
  function setReduced(value:boolean){reduced=value;root.dataset.reduced=String(value);onReduced(value);lenis.options.smoothWheel=!value;measure(true);dirty=true;lastStamp=-1;}
  function goTo(index:number){
    const i=clamp(Math.round(index),0,7);if(location.hash==='#mission-reading'){history.replaceState(null,'',location.pathname+location.search);root.querySelector<HTMLElement>('.wordmark')?.focus({preventScroll:true});lenis.resize();ScrollTrigger.refresh();}
    lenis.start();locked=false;navigationGoal=i;const serial=++navigationSerial;const target=(i===0?0:i+.36)*step;
    lenis.scrollTo(target,{duration:reduced?0:Math.min(2.2,.85+Math.abs(progress-i)*.16),immediate:reduced,force:true,easing:t=>1-Math.pow(1-t,3),onComplete:()=>{if(serial===navigationSerial)navigationGoal=null;}});
  }
  return{goTo,setLocked(value){locked=value;if(value){cancelNavigation();lenis.stop();}else lenis.start();},setReduced,setDestination(value){destination=value;dirty=true;lastStamp=-1;},setSubsystem(value){subsystem=value;dirty=true;lastStamp=-1;},toggleSound:()=>audio.toggle(),destroy(){destroyed=true;viewportObserver.disconnect();sizeObserver.disconnect();window.removeEventListener('wheel',cancelNavigation,true);window.removeEventListener('touchstart',cancelNavigation,true);window.removeEventListener('pointerdown',cancelNavigation,true);window.removeEventListener('keydown',navigationKey,true);clearTimeout(resizeTimer);window.removeEventListener('hashchange',readingChange);root.removeEventListener('focusin',readingFocus);window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);reducedMedia.removeEventListener('change',motionChange);gsap.ticker.remove(tick);trigger.kill();lenis.destroy();audio.destroy();scene?.destroy();chapters.forEach(c=>{c.inert=false;});}};
}
