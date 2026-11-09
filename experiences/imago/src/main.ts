import './style.css';
import { pageMarkup } from './content';
import { createNarrativeEngine } from './engine';
import { initObservationTools } from './widgets';
import { initMediaRecovery } from './media';
import { updateObservationState } from './state';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = pageMarkup();
const engine = createNarrativeEngine();
let widgets = initObservationTools();
const disposeMedia = initMediaRecovery();
const cleanup: Array<() => void> = [];
function listen(target: EventTarget, event: string, handler: EventListener) {
  target.addEventListener(event, handler);
  cleanup.push(() => target.removeEventListener(event, handler));
}

const menu = document.querySelector<HTMLDialogElement>('[data-menu]')!;
const openMenu = document.querySelector<HTMLButtonElement>('[data-menu-open]')!;
function closeMenu() { menu.close(); openMenu.focus({ preventScroll: true }); }
listen(openMenu,'click',()=> { menu.showModal(); });
listen(document.querySelector('[data-menu-close]')!,'click',closeMenu);
listen(menu,'click',(event)=> {
  const el=event.target as Element;
  if(el.closest('a[href^="#"]')) menu.close();
  if(el===menu && (event as MouseEvent).offsetX<0) closeMenu();
});
listen(menu,'cancel',()=> { requestAnimationFrame(()=>openMenu.focus({preventScroll:true})); });

const motion = document.querySelector<HTMLButtonElement>('[data-motion-toggle]')!;
const motionModes = ['auto','reduced','full'] as const;
function updateMotionLabel() {const m=engine.getMotion();motion.textContent=`Motion: ${m==='reduced'?'still':m}`;motion.setAttribute('aria-label',`Motion preference: ${m}. Activate to change.`);}
updateMotionLabel();
listen(motion,'click',()=>engine.setMotion(motionModes[(motionModes.indexOf(engine.getMotion())+1)%3]));
listen(window,'imago:motion',updateMotionLabel);
const boundaries = new Map(Array.from(document.querySelectorAll<HTMLElement>('.handoff')).map(el=>[el.dataset.boundary,el]));
const currentNumber=document.querySelector('[data-current-number]')!;
listen(window,'imago:progress',((event: WindowEventMap['imago:progress'])=> {
  currentNumber.textContent=event.detail.chapterId.slice(-2);
  for(const el of boundaries.values()) {
    const p=Number(el.style.getPropertyValue('--progress'));
    const stage=el.querySelector<HTMLElement>('.handoff__stage')!;
    const next=String(Math.min(4,Math.max(0,Math.round(p*4))));
    if(stage.dataset.step!==next) {
      stage.dataset.step=next;
      stage.querySelectorAll<HTMLElement>('[data-handoff-frame]').forEach(frame=>{frame.hidden=frame.dataset.handoffFrame!==next;});
      stage.querySelectorAll<HTMLElement>('[data-handoff-caption]').forEach(caption=>{caption.hidden=caption.dataset.handoffCaption!==next;});
    }
  }
}) as EventListener);

// A settled photograph is the critical image. Layer upgrades cannot replace it
// until all three matching layers are decoded, and never restart the entrance.
const heroArt=document.querySelector<HTMLElement>('.hero-art')!;
let disposed=false;
const layerImages=Array.from(document.querySelectorAll<HTMLImageElement>('[data-layer-src]'));
async function enhanceHero() {
  if(matchMedia('(max-width:700px)').matches) return;
  try {
    await Promise.all(layerImages.map(image=>{image.src=image.dataset.layerSrc!;return image.decode();}));
    if(!disposed) heroArt.classList.add('is-layered');
  } catch { /* Keep the complete original photograph. */ }
}
if(document.readyState==='complete') void enhanceHero();
else listen(window,'load',()=>void enhanceHero());

// Revisit links restore the intended content state, without changing other observations.
listen(document,'click',(event)=> {
  const link=(event.target as Element).closest<HTMLAnchorElement>('[data-revisit]');
  if(!link) return;
  const id=link.dataset.revisit;
  if(id==='02') updateObservationState({eggZoom:false});
  if(id==='03') updateObservationState({larvaStage:'third'});
  if(id==='07') updateObservationState({observationStage:'middle',comparison:false,reveal:50});
  if(id==='09') updateObservationState({wingStage:'open',wingDetail:'whole'});
  widgets.destroy();widgets=initObservationTools();
});

// A quiet, composed air soundscape. It is explicitly optional and never implies
// that generated insect images were accompanied by field-recorded audio.
const soundButton=document.querySelector<HTMLButtonElement>('[data-sound-toggle]')!;
let audio:AudioContext|null=null;
let soundEnabled=false;
let source:AudioBufferSourceNode|null=null;
listen(soundButton,'click',async()=> {
  if(soundEnabled){soundEnabled=false;await audio?.suspend();}
  else {
    try {
      if(!audio){
        audio=new AudioContext();
        const buffer=audio.createBuffer(1,audio.sampleRate*8,audio.sampleRate);
        const data=buffer.getChannelData(0);let seed=71354;let previous=0;
        for(let i=0;i<data.length;i++){seed=(seed*1664525+1013904223)>>>0;const white=(seed/4294967296)*2-1;previous=(previous+.018*white)/1.018;data[i]=previous*2.8;}
        source=audio.createBufferSource();source.buffer=buffer;source.loop=true;
        const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=460;
        const gain=audio.createGain();gain.gain.value=.09;
        source.connect(filter).connect(gain).connect(audio.destination);source.start();
      }
      await audio.resume();soundEnabled=true;
    } catch {soundButton.textContent='Ambient sound unavailable';return;}
  }
  soundButton.textContent=`Ambient sound: ${soundEnabled?'on':'off'}`;soundButton.setAttribute('aria-pressed',String(soundEnabled));
});
listen(document,'visibilitychange',()=>{if(document.hidden) void audio?.suspend();else if(soundEnabled) void audio?.resume();});

// Useful real performance milestones, recorded only when observed.
performance.mark('imago-interactive');
document.querySelector<HTMLImageElement>('.hero-original')?.decode().then(()=>performance.mark('imago-hero-ready')).catch(()=>{});

if(import.meta.hot) import.meta.hot.dispose(()=>{
  disposed=true;engine.destroy();widgets.destroy();disposeMedia();cleanup.forEach(fn=>fn());source?.stop();void audio?.close();
});
