import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import './math.js';
import './geology.js';
import './imaging.js';
/* FOSSIL — one clock, one scroll authority, ten continuous compositions. */
function initializeFossil() {
  'use strict';
  const M = window.FossilMath;
  if (!M) return;
  const { clamp, lerp, smooth, weights, mixColor } = M;
  const $ = id => document.getElementById(id);
  const chapters = Array.from(document.querySelectorAll('.chapter'));
  const compositions = Array.from(document.querySelectorAll('.composition'));
  const visuals = Array.from(document.querySelectorAll('.visual'));
  const names = ['Specimen','Strata','Burial','Preservation','Exposure','Amber','Scan','Reconstruct','Archive','Deep Time'];
  const grounds = ['#141512','#ddd4c4','#282b24','#e5ddcc','#e5dece','#141410','#141512','#bfc1b9','#e5dece','#141512'];
  const lightChapters = new Set([1,3,4,7,8]);
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = window.matchMedia('(pointer: coarse)');
  let paused = false;
  try { paused = localStorage.getItem('fossil:ambient-paused') === 'true'; } catch (_) { /* Local file privacy mode. */ }
  let w = innerWidth, h = innerHeight, span = h * 1.8, dpr = 1;
  let active = -1, position = 0, lastPosition = -1, lastDraw = 0, raf = 0, force = true;
  let initialDestination = null;
  let imageReady = false, imaging = null, geologies = [], dirtyPointer = false, disposed = false;
  const recordUrls = new Set();
  const geologyKeys = ['', '', '', ''];
  let inspect = false, revealOverride = null, preserveOverride = null, sectionOverride = null, volumeMode = 'volume';
  let renderedSection = 35, renderedReveal = .5, renderedMode = 0, renderedMix = 0;
  const pointer = { x: .5, y: .5, sx: .5, sy: .5, px: 0, py: 0, down: false, inside: false };
  const images = {};
  const assetPaths = { specimen:'specimen',strata:'strata',preservation:'preservation',exposure:'exposure' };
  const geoCanvasIds = ['strata-canvas','burial-canvas','preservation-canvas','exposure-canvas'];
  const preserveDescriptions = [
    'Minerals enter the pores.<br>The structure holds a new material.',
    'Original material gives way.<br>Minerals carry the surviving form.',
    'The shell is gone.<br>Its impression remains in the matrix.',
    'A space takes in sediment or minerals.<br>A positive form can remain.'
  ];
  const lenis = new Lenis({
    autoRaf:false, lerp:.105, smoothWheel:!preference.matches, wheelMultiplier:1,
    syncTouch:false, anchors:false, respectReducedMotion:true,
    virtualScroll:({deltaY,event}) => {
      if(event.ctrlKey)return false;
      if(!preference.matches && event.type==='wheel' && (deltaY*lenis.velocity<0 || deltaY*(lenis.targetScroll-lenis.actualScroll)<0)){lenis.stop();lenis.start();}
      return true;
    },
    prevent:node => Boolean(node.closest && node.closest('dialog'))
  });

  document.documentElement.classList.add('js');
  document.body.dataset.ready = 'false';
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  function mobile() { return w <= 700; }
  function motion() { return !paused && !preference.matches; }
  function rectFor(scene) {
    if (mobile()) {
      if (scene === 2) return { x:w*.08, y:h*.40, width:w*.94, height:h*.47 };
      if (scene === 3) return { x:w*.10, y:h*.355, width:w*1.02, height:h*.505 };
      if (scene === 4) return { x:w*.075, y:h*.39, width:w*1.04, height:h*.395 };
      if (scene === 6) return { x:w*.055, y:h*.32, width:w*.93, height:h*.47 };
      if (scene === 7) return { x:w*.035, y:h*.36, width:w*.94, height:h*.46 };
      return {x:0,y:0,width:w,height:h};
    }
    if (scene === 2) return { x:w*.35, y:h*.16, width:w*.65, height:h*.76 };
    if (scene === 3) return { x:w*.36, y:h*.02, width:w*.69, height:h*.91 };
    if (scene === 4) return { x:w*.36, y:h*.04, width:w*.70, height:h*.88 };
    if (scene === 6) return { x:w*.355, y:h*.055, width:w*.62, height:h*.82 };
    if (scene === 7) return { x:w*.35, y:h*.065, width:w*.64, height:h*.84 };
    return {x:0,y:0,width:w,height:h};
  }
  function layout() {
    w = innerWidth; h = innerHeight;
    const oldSpan = span;
    const readingPosition = window.scrollY / oldSpan;
    span = h * (mobile() ? 1.52 : 1.8);
    document.documentElement.style.setProperty('--chapter-span', span + 'px');
    dpr = Math.min(devicePixelRatio || 1, mobile() ? 1.5 : 1.35, Math.sqrt(2800000 / (w * h)));
    geologies.forEach(g => g.resize(w,h,dpr));
    geologyKeys.fill('');
    if (imaging) imaging.resize(w,h,dpr);
    ['amber-contour','ending-contour'].forEach(id => {
      const c = $(id); c.width = Math.round(w*dpr); c.height = Math.round(h*dpr);
      c.getContext('2d').setTransform(dpr,0,0,dpr,0,0);
    });
    if (lenis) {
      lenis.resize();
      if (oldSpan !== span) lenis.scrollTo(readingPosition * span,{immediate:true,force:true});
    }
    force = true;
  }
  function loadImage(name, filename) {
    return new Promise(resolve => {
      const im = new Image();
      im.onload = () => { images[name] = im; resolve(im); };
      im.onerror = () => { resolve(null); };
      im.src = import.meta.env.BASE_URL + 'fossil/assets/images/' + filename + '.webp';
    });
  }
  async function prepare() {
    await Promise.all(Object.entries(assetPaths).map(pair => loadImage(pair[0],pair[1])));
    if (disposed) return;
    if (typeof FossilGeology === 'function') {
      geologies = geoCanvasIds.map(id => new FossilGeology({
        canvas:$(id), specimenImage:images.specimen, strataImage:images.strata,
        preservationImage:images.preservation, exposureImage:images.exposure
      }));
    }
    if (typeof FossilImaging === 'function') {
      imaging = new FossilImaging({
        scanCanvas:$('scan-canvas'), volumeCanvas:$('volume-canvas'),
        thumbs:Array.from(document.querySelectorAll('.scan-contact-sheet canvas')),
        onReady:() => { force = true; }
      });
    }
    imageReady = true;
    layout();
    document.body.dataset.ready = 'true';
    force = true;
  }
  function setActive(index) {
    if (active === index) return;
    if (active === 4 && index !== 4) setInspect(false);
    active = index;
    document.body.dataset.chapter = String(index);
    document.body.dataset.theme = lightChapters.has(index) ? 'light' : 'dark';
    $('chapter-number').textContent = String(index+1).padStart(2,'0');
    $('chapter-name').textContent = names[index];
    $('chapter-current').href = '#chapter-' + String(index+1).padStart(2,'0');
    document.querySelector('meta[name="theme-color"]').content = grounds[index];
    document.querySelectorAll('.chapter-ticks a').forEach((el,i) => {
      if (i === index) el.setAttribute('aria-current','step'); else el.removeAttribute('aria-current');
    });
    compositions.forEach((el,i) => { el.inert = i !== index; el.setAttribute('aria-hidden',String(i !== index)); });
    document.querySelectorAll('.index-list a').forEach((el,i) => {
      if (i === index) el.setAttribute('aria-current','step'); else el.removeAttribute('aria-current');
    });
  }
  function setPreserve(mode, manual) {
    mode = clamp(Math.round(mode),0,3);
    if (manual) preserveOverride = mode;
    renderedMode = mode;
    document.querySelectorAll('[data-preserve-mode]').forEach(el => el.setAttribute('aria-pressed',String(+el.dataset.preserveMode === mode)));
    $('preservation-description').innerHTML = preserveDescriptions[mode];
    force = true;
  }
  function setInspect(on) {
    inspect = Boolean(on);
    pointer.down = false;
    document.body.classList.toggle('is-inspecting',inspect);
    $('inspect-surface').setAttribute('aria-pressed',String(inspect));
    $('inspect-surface').textContent = inspect ? 'Finish inspection' : 'Inspect the surface';
    $('brush-note').textContent = inspect ? 'Drag lightly to clear loose dust.' : 'A little. Pause. Look again.';
    $('brush-cursor').style.opacity = '0';
    if (inspect && revealOverride === null) revealOverride = renderedReveal;
    $('reset-reveal').hidden = revealOverride === null;
    force = true;
  }
  function setSection(section, manual) {
    section = clamp(Math.round(section),0,71);
    if (manual) sectionOverride = section;
    renderedSection = section;
    $('section-range').value = String(section+1);
    $('section-output').textContent = String(section+1).padStart(3,'0');
    const bounds=window.FOSSIL_VOLUME&&FOSSIL_VOLUME.sliceBounds&&FOSSIL_VOLUME.sliceBounds[section];
    $('scan-status').textContent=bounds&&(bounds[2]<=bounds[0]||bounds[3]<=bounds[1])?'Outside the preserved volume.':'';
    $('resume-scan').hidden = sectionOverride === null;
    document.querySelectorAll('[data-slice]').forEach(el => el.setAttribute('aria-pressed',String(+el.dataset.slice === section)));
    force = true;
  }
  function setVolume(mode) {
    volumeMode = mode === 'outline' ? 'outline' : 'volume';
    document.querySelectorAll('[data-volume-mode]').forEach(el => el.setAttribute('aria-pressed',String(el.dataset.volumeMode === volumeMode)));
    force = true;
  }
  function showDialog(id) {
    document.querySelectorAll('dialog[open]').forEach(d => d.close());
    const d = $(id);
    d.showModal();
    d.scrollTop = 0;
    if (lenis) lenis.stop();
    pointer.down = false;
    $('brush-cursor').style.opacity = '0';
    force = true;
  }
  function closeDialogs() { document.querySelectorAll('dialog[open]').forEach(d => d.close()); }
  function navigate(index, updateHistory = true, immediate = false) {
    index = clamp(index,0,9);
    closeDialogs();
    const hash = '#chapter-' + String(index+1).padStart(2,'0');
    if (updateHistory && location.hash !== hash) history.pushState(null,'',hash);
    const hold = index===9 ? .16 : index===6 ? .62 : index===7 ? .55 : index>0 ? .29 : 0;
    const target = chapters[index].offsetTop + span*hold;
    if (lenis) lenis.scrollTo(target,{immediate:immediate || preference.matches,duration:1.65,force:true});
    else window.scrollTo({top:target,behavior:'instant'});
    force = true;
  }
  function refreshMotion() {
    if (lenis) lenis.options.smoothWheel = !preference.matches;
    const button = $('motion-toggle');
    button.disabled = preference.matches;
    button.textContent = preference.matches ? 'Reduced motion is active' : paused ? 'Resume ambient motion' : 'Pause ambient motion';
    button.setAttribute('aria-pressed',String(paused || preference.matches));
    document.body.dataset.motion = motion() ? 'on' : 'off';
    force = true;
  }
  function setImageTransform(element, x, y, scale, prefix = '') {
    element.style.transform = prefix + ' translate3d('+x.toFixed(2)+'px,'+y.toFixed(2)+'px,0) scale('+scale.toFixed(4)+')';
  }
  function drawAmber(p,time) {
    const ctx = $('amber-contour').getContext('2d'); ctx.clearRect(0,0,w,h);
    // A short geological registration line shifts into an enclosure annotation.
    // It is diagrammatic, never a guessed photographic silhouette.
    if (mobile()) return;
    const a = smooth(.22,.47,p)*(1-smooth(.74,.94,p));
    if (a < .01) return;
    ctx.globalAlpha = a*.38; ctx.strokeStyle = '#d9b974';ctx.lineWidth=.6;
    const x=w*.80, y=h*.71;
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w*.045,y+h*.03);ctx.lineTo(x+w*.11,y+h*.03);ctx.stroke();
    ctx.beginPath();ctx.arc(x,y,2.2,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
  }
  function drawEnding(p,time) {
    const ctx = $('ending-contour').getContext('2d');ctx.clearRect(0,0,w,h);
    if (!imaging || !imaging.drawContour) return;
    const a = (1 - smooth(.0,.09,p))*.08;
    if (a <= .001 || preference.matches) return;
    imaging.drawContour(ctx,{rect:{x:w*.29,y:h*.07,width:w*.47,height:h*.65},progress:1,color:'#d7d5cc',alpha:a});
  }
  function render(time) {
    const reduced = preference.matches;
    const pos = clamp(window.scrollY/span,0,9.8);
    position = pos;
    const index = clamp(Math.floor(pos+.10),0,9);
    setActive(index);
    const ww = reduced ? names.map((_,i) => i===index ? 1 : 0) : weights(pos);
    const left = clamp(Math.floor(pos),0,9);
    const bgT = reduced ? 0 : smooth(.58,1.08,pos-left);
    const bg = reduced ? grounds[index] : mixColor(grounds[left],grounds[Math.min(left+1,9)],bgT);
    document.body.style.setProperty('--ground',bg);
    $('overall-progress').style.transform = 'scaleX('+clamp(pos/9.2)+')';
    const dx = motion() ? (pointer.sx-.5)*5 + Math.sin(time*.00013)*1.8 : 0;
    const dy = motion() ? (pointer.sy-.5)*3 + Math.cos(time*.00011)*1.3 : 0;
    for (let i=0;i<10;i++) {
      const visible = ww[i] > .002;
      visuals[i].style.opacity = String(ww[i]);
      visuals[i].style.visibility = visible ? 'visible' : 'hidden';
      const copyAlpha=reduced?ww[i]:(i===0?1:smooth(i-.18,i+.20,pos))*(i===9?1:1-smooth(i+.54,i+.96,pos));
      compositions[i].style.opacity = String(copyAlpha);
      compositions[i].style.visibility = copyAlpha>.002 ? 'visible' : 'hidden';
      if (!visible) continue;
      const p = reduced ? .43 : clamp(pos-i);
      if (i===0) {
        setImageTransform($('hero-slab'),dx-p*w*.018,dy+p*h*.011,1+p*.018,mobile()?'translateX(-66%)':'');
      } else if (i>=1 && i<=4 && imageReady && geologies[i-1]) {
        const g = geologies[i-1];
        let mode = renderedMode, reveal = renderedReveal;
        if (i===3) {
          // Four preservation states, each held and then blended into the next.
          // The old Math.floor() snapped between them inside a single frame; the
          // blend now occupies most of each segment so the material morphs.
          const segment = clamp((p-.10)/.84);
          const unit = Math.min(3.9999, segment*4);
          const form = Math.min(3, Math.floor(unit));
          mode = preserveOverride !== null ? preserveOverride
            : Math.min(3, form + smooth(.38,1,clamp(unit-form)));
          if (renderedMode!==Math.round(mode)) setPreserve(mode,false);
          renderedMix = mode;
        }
        if (i===4) {
          reveal = revealOverride !== null ? revealOverride : reduced ? .70 : .16 + smooth(.06,.85,p)*.72;
          renderedReveal = reveal;
          $('reveal-range').value = String(Math.round(reveal*100));
          $('reveal-output').textContent = Math.round(reveal*100)+'%';
        }
        // Material plates are retained between meaningful changes. Repainting
        // hundreds of clipped grains on an unchanged surface wastes GPU work.
        const geoKey = i===3 ? mode.toFixed(3) : i===4 ? Math.round(reveal*500)+'/'+g.getStatus().brushMarks : Math.round(p*500)+'/'+motion();
        if (geologyKeys[i-1]!==geoKey) {
          g.clear();
          g.render({scene:i,progress:p,rect:rectFor(i),alpha:1,motion:motion(),time:time/1000,reveal,mode,pointer:{x:pointer.x,y:pointer.y,down:false}});
          geologyKeys[i-1]=geoKey;
        }
        g.canvas.style.transform=motion()?'translate3d('+(dx*.18).toFixed(2)+'px,'+(dy*.15).toFixed(2)+'px,0) scale(1.002)':'none';
      } else if (i===5) {
        setImageTransform($('amber-object'),dx*.8,dy*.7,1+smooth(.1,.8,p)*.026,mobile()?'translateX(-66%)':'');
        drawAmber(p,time);
      } else if (i===6 && imaging) {
        const r = rectFor(6);
        const section = sectionOverride!==null ? sectionOverride : reduced ? 35 : Math.round(lerp(12,60,smooth(.08,.82,p)));
        if (section!==renderedSection) setSection(section,false);
        const manual=sectionOverride!==null;
        const sliceAlpha=reduced||manual?1:smooth(.39,.62,p);
        imaging.renderScan({progress:p,section,alpha:sliceAlpha,rect:r,motion:motion(),time:time/1000});
        const contourAlpha=reduced||manual?0:smooth(.20,.34,p)*(1-smooth(.48,.64,p))*.78;
        if(contourAlpha>.002) imaging.drawContour($('scan-canvas').getContext('2d'),{rect:r,progress:1,alpha:contourAlpha,color:'#d7d8cf'});
        const surface=$('scan-surface'), plane=$('scan-plane');
        surface.style.left=r.x+'px';surface.style.top=r.y+'px';surface.style.width=r.width+'px';surface.style.height=r.height+'px';
        surface.style.clipPath = 'none';
        surface.style.opacity = reduced||manual?'0':String(1-smooth(.16,.32,p));
        // The photo and authored volume are distinct evidence representations.
        // Read the complete surface, register its contour, then enter sections.
        const edge = r.x+r.width*lerp(.12,.89,smooth(.03,.55,p));
        $('scan-canvas').style.clipPath = 'none';
        plane.style.left=edge+'px';plane.style.top=(r.y+h*.005)+'px';plane.style.height=(r.height-h*.008)+'px';
        plane.style.opacity = reduced||manual?'0':String(smooth(.01,.1,p)*(1-smooth(.48,.64,p))*.68);
      } else if (i===7 && imaging) {
        imaging.renderVolume({progress:reduced?.76:clamp(.13+p*.98),mode:volumeMode,alpha:1,rect:rectFor(7),motion:motion(),time:time/1000,pointer:{x:pointer.sx,y:pointer.sy}});
      } else if (i===8) {
        const rise = reduced ? 0 : (1-smooth(0,.28,p))*h*.07;
        setImageTransform($('archive-drawer'),0,rise,1);
        document.querySelector('.physical-record').style.opacity = String(reduced?1:smooth(.04,.28,p));
      } else if (i===9) {
        setImageTransform($('closing-specimen'),dx*.35,dy*.4,1);
        drawEnding(p,time);
      }
    }
    lastPosition=pos;force=false;dirtyPointer=false;
  }
  function frame(time) {
    if (disposed || document.hidden) { raf=0;return; }
    if (initialDestination !== null) { navigate(initialDestination,false,true); initialDestination = null; }
    if (lenis) lenis.raf(time);
    pointer.sx=lerp(pointer.sx,pointer.x,.045);pointer.sy=lerp(pointer.sy,pointer.y,.045);
    const pos=window.scrollY/span;
    const moving=Math.abs(pos-lastPosition)>.00004;
    const dialogOpen=Boolean(document.querySelector('dialog[open]'));
    const ambient=motion()&&!dialogOpen;
    const fpsGap=moving?14:(mobile()?66:40);
    if (!dialogOpen && (force || moving || (ambient && time-lastDraw>fpsGap) || dirtyPointer)) {
      render(time);lastDraw=time;
    }
    raf=requestAnimationFrame(frame);
  }

  document.addEventListener('click',event => {
    const anchor=event.target.closest('a[href^="#chapter-"]');
    if (!anchor) return;
    const match=anchor.getAttribute('href').match(/chapter-(\d+)/);
    if (!match) return;
    event.preventDefault();navigate(Number(match[1])-1);
  });
  $('open-index').addEventListener('click',()=>showDialog('index-dialog'));
  document.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',() => $(el.dataset.close).close()));
  document.querySelectorAll('.open-record').forEach(el=>el.addEventListener('click',()=>showDialog('record-dialog')));
  document.querySelectorAll('dialog').forEach(d => {
    d.addEventListener('close',()=>{if(lenis && !document.querySelector('dialog[open]'))lenis.start();force=true;});
    d.addEventListener('click',e=>{if(e.target===d){const b=d.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)d.close();}});
  });
  document.querySelectorAll('[data-preserve-mode]').forEach(el=>el.addEventListener('click',()=>setPreserve(+el.dataset.preserveMode,true)));
  $('reveal-range').addEventListener('input',e=>{revealOverride=+e.target.value/100;$('reset-reveal').hidden=false;force=true;});
  $('inspect-surface').addEventListener('click',()=>setInspect(!inspect));
  $('reset-reveal').addEventListener('click',()=>{revealOverride=null;setInspect(false);if(geologies[3])geologies[3].resetBrush();$('reset-reveal').hidden=true;force=true;});
  $('section-range').addEventListener('input',e=>setSection(+e.target.value-1,true));
  $('resume-scan').addEventListener('click',()=>{sectionOverride=null;$('resume-scan').hidden=true;force=true;});
  document.querySelectorAll('[data-slice]').forEach(el=>el.addEventListener('click',()=>setSection(+el.dataset.slice,true)));
  document.querySelectorAll('[data-volume-mode]').forEach(el=>el.addEventListener('click',()=>setVolume(el.dataset.volumeMode)));
  $('motion-toggle').addEventListener('click',()=>{paused=!paused;try{localStorage.setItem('fossil:ambient-paused',String(paused));}catch(_){}refreshMotion();});
  preference.addEventListener('change',refreshMotion);
  $('save-record').addEventListener('click',()=>{
    const data={title:'FOSSIL — Deep Time in Stone',study:'FSL—001',object:'Interpretive ammonite specimen',status:'Authored digital exhibit; not an accessioned museum object',imagery:'AI generated',imaging:'Synthetic density field, 72 virtual sections',reconstruction:'Procedural, intentionally incomplete',locality:null,geologicalAge:null,measurementUnits:'normalized',sources:Array.from(document.querySelectorAll('.record-sources a')).map(a=>({title:a.textContent,url:a.href}))};
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'}));
    recordUrls.add(url);
    const a=document.createElement('a');a.href=url;a.download='FOSSIL-study-001.json';document.body.append(a);a.click();a.remove();
    window.setTimeout(()=>{URL.revokeObjectURL(url);recordUrls.delete(url);},30000);$('save-status').textContent='Study record prepared for download.';
  });
  window.addEventListener('pointermove',event=>{
    pointer.x=event.clientX/w;pointer.y=event.clientY/h;pointer.px=event.clientX;pointer.py=event.clientY;
    if (event.pointerType==='mouse') dirtyPointer=true;
    if (inspect && active===4 && event.target===$('exposure-canvas')) {
      $('brush-cursor').style.transform='translate3d('+event.clientX+'px,'+event.clientY+'px,0)';
      $('brush-cursor').style.opacity=event.pointerType==='mouse'?'1':'0';
      if(pointer.down && geologies[3]){geologies[3].brush(event.clientX,event.clientY,mobile()?24:34);force=true;}
    } else $('brush-cursor').style.opacity='0';
  },{passive:true});
  $('exposure-canvas').addEventListener('pointerdown',event=>{
    if(!inspect)return;pointer.down=true;
    if(geologies[3])geologies[3].brush(event.clientX,event.clientY,mobile()?24:34);
    if(event.pointerType==='mouse')event.currentTarget.setPointerCapture(event.pointerId);
    force=true;
  });
  window.addEventListener('pointerup',()=>{pointer.down=false;});
  window.addEventListener('pointercancel',()=>{pointer.down=false;});
  window.addEventListener('scroll',()=>{force=true;},{passive:true});
  let resizeTimer;
  window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(layout,100);},{passive:true});
  window.addEventListener('popstate',()=>{const match=location.hash.match(/chapter-(\d+)/);if(match)navigate(+match[1]-1,false,true);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{force=true;if(!disposed && !raf)raf=requestAnimationFrame(frame);}});
  function dispose(){
    if(disposed)return;disposed=true;
    cancelAnimationFrame(raf);raf=0;clearTimeout(resizeTimer);
    lenis.destroy();imaging?.dispose();geologies.forEach(g=>g.dispose());
    recordUrls.forEach(url=>URL.revokeObjectURL(url));recordUrls.clear();
    preference.removeEventListener('change',refreshMotion);
  }
  window.addEventListener('pagehide',event=>{if(!event.persisted)dispose();else{cancelAnimationFrame(raf);raf=0;}});
  if(import.meta.hot)import.meta.hot.dispose(dispose);
  window.addEventListener('pageshow',()=>{force=true;if(!disposed && !raf)raf=requestAnimationFrame(frame);});
  window.FossilExperience=Object.freeze({
    navigate:index=>navigate(index),
    getState:()=>({chapter:active,position,ready:imageReady,motion:motion(),reducedMotion:preference.matches,section:renderedSection,reveal:renderedReveal,preservationMode:renderedMode,preservationMix:Number(renderedMix.toFixed(3)),volumeMode,inspecting:inspect,scrollAuthority:lenis?'Lenis':'native fallback',imagingReady:Boolean(imaging&&imaging.ready),geology:geologies.map(g=>g.getStatus?g.getStatus():null)})
  });
  function staticFallback(error) {
    // Keep the complete semantic exhibit available even when Canvas is disabled.
    dispose();
    document.documentElement.classList.remove('js');
    document.body.dataset.ready='fallback';
    compositions.forEach(element=>{element.style.opacity='';element.style.visibility='';element.inert=false;});
    console.warn('FOSSIL is using its static exhibit fallback:',error.message);
  }
  try {
    layout();refreshMotion();setPreserve(0,false);setSection(35,false);setVolume('volume');render(0);
    const initial=location.hash.match(/chapter-(\d+)/);
    if(initial)initialDestination=+initial[1]-1;
    if(initial)navigate(+initial[1]-1,false,true);else window.scrollTo(0,0);
    raf=requestAnimationFrame(frame);
    prepare().catch(staticFallback);
  } catch(error) { staticFallback(error); }
}
// Module execution may precede a linked stylesheet in development. Measure the
// authored chapter span only after its HTML-owned stylesheet is available.
const experienceStyleLink = document.getElementById('fossil-styles');
if (experienceStyleLink && !experienceStyleLink.sheet) {
  experienceStyleLink.addEventListener('load', initializeFossil, { once: true });
  experienceStyleLink.addEventListener('error', initializeFossil, { once: true });
} else initializeFossil();
