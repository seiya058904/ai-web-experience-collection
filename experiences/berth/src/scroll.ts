import Lenis from 'lenis';
import { resolveStoryState } from './state.ts';
import type { UserState } from './state.ts';
import { softText } from '../../shared/soft-swap.ts';

type Box = { element: HTMLElement; top: number; height: number; stickyHeight: number };
const clamp = (v: number, min=0, max=1) => Math.min(max,Math.max(min,v));
const ease = (v: number) => { const x=clamp(v); return x*x*(3-2*x); };

/** One scroll clock. All scene properties are evaluated from measured position,
 * never accumulated or inferred from a previously visited chapter. */
export function setupScroll(initialState: UserState) {
 let user = initialState;
 let lenis: Lenis | null = null;
 let raf = 0;
 let dirty = true;
 let needsMeasure = true;
 let lastY = -1;
 let height = window.innerHeight;
 let fullHeight = document.documentElement.scrollHeight;
 let active = 0;
 let chapters: Box[] = [];
 let transitions: Box[] = [];
 let effectiveMotion = false;
 let disposed = false;
 const root = document.documentElement;
 const header = document.querySelector<HTMLElement>('.site-header');
 const counter = document.querySelector('#chapter-count');
 const nav = [...document.querySelectorAll<HTMLAnchorElement>('[data-nav-chapter]')];
 const app = document.querySelector<HTMLElement>('#app')!;
 const menu = document.querySelector<HTMLDetailsElement>('#chapter-menu');
 const menuPane = menu?.querySelector<HTMLElement>('nav');
 const cleanups: Array<()=>void> = [];
 function listen(target: EventTarget, type: string, listener: EventListener, options?: AddEventListenerOptions) {
   target.addEventListener(type,listener,options); cleanups.push(()=>target.removeEventListener(type,listener,options));
 }
 function measure() {
   const y=window.scrollY; height=window.innerHeight;
   if(menuPane) {
     const scrollable=Boolean(menu?.open) && menuPane.scrollHeight>menuPane.clientHeight+1;
     menuPane.toggleAttribute('data-lenis-prevent',scrollable);
     menuPane.style.overscrollBehavior=scrollable?'contain':'auto';
   }
   const box=(el:HTMLElement):Box=>({element:el,top:el.getBoundingClientRect().top+y,height:el.offsetHeight,stickyHeight:el.querySelector<HTMLElement>('.transition-sticky')?.offsetHeight ?? 0});
   chapters=[...document.querySelectorAll<HTMLElement>('section[data-chapter]')].map(box);
   transitions=[...document.querySelectorAll<HTMLElement>('[data-transition]')].map(box);
   fullHeight=document.documentElement.scrollHeight; needsMeasure=false; dirty=true;
   lenis?.resize();
 }
 function render(y:number) {
   root.style.setProperty('--reading-progress',String(clamp(y/Math.max(1,fullHeight-height))));
   header?.classList.toggle('scrolled',y>50);
   let index=0;
   for(let i=0;i<chapters.length;i++) if(chapters[i].top <= y+height*.32) index=i;
   if(index!==active || dirty) {
     active=index;
     softText(counter,`${String(index+1).padStart(2,'0')} / 10`,{instant:!effectiveMotion});
     nav.forEach((n,i)=>i===index?n.setAttribute('aria-current','location'):n.removeAttribute('aria-current'));
     root.dataset.currentChapter=String(index+1);
   }
   for(const box of chapters) {
     const local=clamp((y+height*.18-box.top)/Math.max(1,box.height-height*.42));
     if(box.top>y+height*1.6 || box.top+box.height<y-height*.6) continue;
     const story=resolveStoryState(Number(box.element.dataset.chapter),local,user);
     box.element.dataset.storyStage=story.stage;
     box.element.dataset.storyLamp=story.lamp;
     box.element.dataset.ningCard=story.objects.ningCard;
     box.element.dataset.linCard=story.objects.linCard;
     box.element.dataset.manuscript=story.objects.manuscript;
     box.element.dataset.clipOn=story.paperclipOn;
     box.element.dataset.localProgress=local.toFixed(4);
   }
   for(const box of transitions) {
     if(box.top>y+height*1.3 || box.top+box.height<y-height*.4) continue;
     const sticky = box.element.querySelector<HTMLElement>('.transition-sticky');
     const stickyTop=sticky ? parseFloat(getComputedStyle(sticky).top) || 0 : 0;
     const range=Math.max(120,box.height-box.stickyHeight);
     const p=clamp((y-(box.top-stickyTop))/range);
     const kind=box.element.dataset.kind;
     const q=effectiveMotion?ease(p):1;
     const reveal=kind==='dawn'?ease((p-.42)/.58):q;
     box.element.dataset.progress=p.toFixed(4);
     box.element.style.setProperty('--reveal',`${(effectiveMotion?reveal:1)*100}%`);
     box.element.style.setProperty('--edge',`${(kind==='door-reverse'?1-q:q)*100}%`);
     box.element.style.setProperty('--edge-opacity',String(Math.sin(Math.PI*p)*.96));
     box.element.style.setProperty('--drift',`${effectiveMotion?(q-.5)*(innerWidth<=720?4:9):0}px`);
     box.element.style.setProperty('--scale',effectiveMotion?'1.012':'1');
     if(box.element.dataset.sequence){
       // Each action has a genuine image. These windows expose the next image
       // behind a spatial edge, without alpha-blending two people together.
       // Every mask depends only on p, so a jump or reverse resolves identically.
       const frames=[...box.element.querySelectorAll<HTMLElement>('[data-sequence-frame]')];
       const windows=kind==='cards'
         ? [[.04,.18],[.8,.96]]
         : frames.length===4
           ? [[.08,.26],[.36,.58],[.72,.94]]
           : [[.12,.4],[.62,.9]];
       let visible=0;
       let edgeReveal=0;
       let edgeOpacity=0;
       let edgeDirection='left';
       frames.forEach((frame,i)=>{
         const [start,end]=windows[i-1] ?? [0,1];
         const raw=i===0?1:clamp((p-start)/(end-start));
         const bedHandover=box.element.dataset.transition==='5' && i===1;
         const railHalf=innerWidth<=720?.15:.18;
         // The first TR05 change repositions both people. A thin horizontal
         // image wipe can expose Lin twice; an opaque near bed rail covers
         // their displaced face regions before the next pose is revealed.
         // Its centre starts/ends outside the image, never fading through a face.
         const railCentre=-railHalf+(1+2*railHalf)*ease(raw);
         const amount=i===0 || !effectiveMotion?1:bedHandover?clamp(railCentre):ease(raw);
         frame.style.setProperty('--frame-reveal',`${amount*100}%`);
         // The stable caption provides the animated sequence's accessible text.
         // In the static layout each complete figure and caption is readable.
         frame.setAttribute('aria-hidden',effectiveMotion?'true':'false');
         // A dead band around the half-way point keeps one caption while the reader rests there.
         const shown=Number(box.element.dataset.visibleAction);
         if(i>0 && raw>=(Number.isFinite(shown) && i<=shown?.42:.58)) visible=i;
         if(i>0 && raw>0 && raw<1){
           edgeReveal=ease(raw);
           edgeOpacity=Math.sin(Math.PI*raw)*.96;
           edgeDirection=frame.dataset.wipe ?? 'left';
           if(bedHandover){
             edgeOpacity=1;
             box.element.style.setProperty('--rail-position',`${railCentre*100}%`);
             box.element.style.setProperty('--rail-half',`${railHalf*100}%`);
           }
         }
       });
       box.element.dataset.visibleAction=effectiveMotion?String(visible):'all';
       box.element.dataset.wipe=edgeDirection;
       box.element.style.setProperty('--edge',`${(edgeDirection==='right'?1-edgeReveal:edgeReveal)*100}%`);
       box.element.style.setProperty('--edge-opacity',effectiveMotion?String(edgeOpacity):'0');
       const caption=box.element.querySelector<HTMLElement>('[data-transition-caption]');
       const text=effectiveMotion?frames[visible]?.dataset.frameCaption:box.element.dataset.label;
       if(text) softText(caption,text,{instant:!effectiveMotion});
     }
     if(kind==='cards'){
       const paper=box.element.querySelector<HTMLElement>('.transition-paper-frame');
       const board=paper?.querySelector<HTMLElement>('.binding-board');
       const notes=board?.querySelector<HTMLElement>('.binding-notes');
       const manuscript=board?.querySelector<HTMLElement>('.binding-manuscript');
       const ning=notes?.querySelector<HTMLElement>('.binding-card--ning');
       const lin=notes?.querySelector<HTMLElement>('.binding-card--lin');
       if(paper && board && notes && manuscript && ning && lin){
         if(!paper.dataset.controlsBound){
           paper.dataset.controlsBound='true';
           listen(paper,'change',(()=>{dirty=true;request();}) as EventListener);
           cleanups.push(()=>{delete paper.dataset.controlsBound;});
         }
         const before=paper.querySelector<HTMLInputElement>('#binding-before')?.checked ?? false;
         const join=effectiveMotion?ease((p-.25)/.45):before?0:1;
         const narrow=innerWidth<=720;
         // Untransformed layout positions keep the one wire clip anchored to
         // real paper edges, even after a font/viewport/custom-text change.
         const fromX=manuscript.offsetLeft+8;
         const fromY=manuscript.offsetTop-16;
         const toX=notes.offsetLeft+ning.offsetLeft+(narrow?8:ning.offsetWidth-12);
         const toY=notes.offsetTop+ning.offsetTop+(narrow?ning.offsetHeight-30:Math.max(0,lin.offsetTop-ning.offsetTop)-16);
         board.style.setProperty('--clip-start-x',`${fromX}px`);
         board.style.setProperty('--clip-start-y',`${fromY}px`);
         board.style.setProperty('--clip-end-x',`${toX}px`);
         board.style.setProperty('--clip-end-y',`${toY}px`);
         board.style.setProperty('--binding-join',String(join));
         board.style.setProperty('--clip-x',`${fromX+(toX-fromX)*join}px`);
         board.style.setProperty('--clip-y',`${fromY+(toY-fromY)*join-Math.sin(Math.PI*join)*55}px`);
         board.style.setProperty('--clip-turn',`${-12+join*18+Math.sin(Math.PI*join)*16}deg`);
         paper.dataset.clipOn=join===0?'manuscript':join===1?'two-cards':'in-hand';
         const readable=!effectiveMotion || (p>=.18 && p<=.8);
         paper.setAttribute('aria-hidden',String(!readable));
         paper.toggleAttribute('inert',!readable);
         for(const text of paper.querySelectorAll<HTMLElement>('[data-binding-readable]')){
           // Only a card that really overflows may keep the wheel; otherwise a
           // resting pointer over its words would stop the page from scrolling.
           const scrollable=text.scrollHeight>text.clientHeight+1;
           text.tabIndex=readable && scrollable?0:-1;
           text.toggleAttribute('data-lenis-prevent',scrollable);
           text.style.overscrollBehavior=scrollable?'':'auto';
         }
         const caption=paper.querySelector<HTMLElement>('[data-binding-caption]');
         const message=join<.08?'The clip still belongs to the handout.':join<.88?'She lifts it off the pages.':'Two cards, held by the same clip.';
         softText(caption,message,{instant:!effectiveMotion});
       }
     }
     if(box.element.dataset.transition==='3'){
       const level=user.lamp==='off'?.48:user.lamp==='reading'?1.1:.9;
       box.element.style.setProperty('--handover-light',String(level+(1-level)*ease(p*2)));
     }
     if(kind==='dawn') box.element.style.setProperty('--transition-brightness',String(.46+.54*ease(p*2.4)));
   }
   lastY=y; dirty=false;
 }
 function tick(time:number) {
   raf=0;
   if(disposed || document.hidden) return;
   if(needsMeasure) measure();
   lenis?.raf(time);
   const y=lenis?lenis.animatedScroll:window.scrollY;
   if(dirty || Math.abs(y-lastY)>.05) render(y);
   if(effectiveMotion || dirty || needsMeasure) raf=requestAnimationFrame(tick);
 }
 function request() { if(!raf && !document.hidden && !disposed) raf=requestAnimationFrame(tick); }
 function refreshMotion(preserve:boolean) {
   const next=root.dataset.motion==='on';
   if(next===effectiveMotion && chapters.length) {dirty=true;request();return;}
   const anchor=chapters[active];
   const offset=anchor?window.scrollY-anchor.top:0;
   lenis?.destroy(); lenis=null;
   effectiveMotion=next;
   if(next) lenis=new Lenis({autoRaf:false,lerp:.16,smoothWheel:true,syncTouch:false,anchors:false,prevent:(node)=>Boolean(node.closest('[data-lenis-prevent],textarea'))});
   measure();
   if(preserve && anchor) {
     const updated=chapters.find(c=>c.element===anchor.element);
     if(updated) {
       const target=clamp(updated.top+offset,0,Math.max(0,fullHeight-height));
       if(lenis) lenis.scrollTo(target,{immediate:true,force:true}); else window.scrollTo({top:target,behavior:'instant'});
     }
   }
   dirty=true; request();
 }
 function jump(target:HTMLElement, smooth:boolean, focus:boolean) {
   needsMeasure=true;measure();
   const offset=target.id==='ch-01'?0:-(header?.offsetHeight??72)-20;
   const y=target.getBoundingClientRect().top+window.scrollY+offset;
   if(focus) {
     const heading=target.matches('section')?target.querySelector<HTMLElement>('h1,h2'):target;
     if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}
   }
   if(lenis) lenis.scrollTo(y,{duration:.72,immediate:!smooth,force:true});
   else window.scrollTo({top:y,behavior:'instant'});
   dirty=true;request();
 }
 listen(document,'click',((event:MouseEvent)=>{
   if(event.defaultPrevented || event.button!==0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
   const link=(event.target as Element)?.closest<HTMLAnchorElement>('a[href^="#"]');
   if(!link) return;
   const hash=link.getAttribute('href')!;
   const target=document.getElementById(hash.slice(1));
   if(!target) return;
   event.preventDefault();
   if(location.hash!==hash) history.pushState(null,'',hash);
   jump(target,effectiveMotion,true);
 }) as EventListener);
 listen(window,'scroll',(()=>request()) as EventListener,{passive:true});
 listen(window,'resize',(()=>{needsMeasure=true;request();}) as EventListener,{passive:true});
 if(menu)listen(menu,'toggle',(()=>{needsMeasure=true;request();}) as EventListener);
 listen(window,'hashchange',(()=>{const target=document.getElementById(location.hash.slice(1));if(target)jump(target,false,false);}) as EventListener);
 listen(window,'pageshow',(()=>{needsMeasure=true;dirty=true;lenis?.scrollTo(window.scrollY,{immediate:true,force:true});request();}) as EventListener);
 listen(document,'visibilitychange',(()=>{
   if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;}
   else{needsMeasure=true;lenis?.scrollTo(window.scrollY,{immediate:true,force:true});dirty=true;request();}
 }) as EventListener);
 const resizeObserver=new ResizeObserver(()=>{needsMeasure=true;request();});resizeObserver.observe(app);
 document.fonts.ready.then(()=>{if(!disposed){needsMeasure=true;request();}}).catch(()=>{});
 refreshMotion(false);
 requestAnimationFrame(()=>{
   if(disposed)return;
   const target=location.hash&&document.getElementById(location.hash.slice(1));
   if(target)jump(target,false,false);else{needsMeasure=true;request();}
 });
 return {
   update(state:UserState){user=state;refreshMotion(true);dirty=true;request();},
   destroy(){disposed=true;if(raf)cancelAnimationFrame(raf);lenis?.destroy();resizeObserver.disconnect();cleanups.forEach(fn=>fn());}
 };
}
