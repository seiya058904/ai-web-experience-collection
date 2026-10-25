/* COUNTERFORM — one scroll clock, real type, deterministic scene state. */
(() => {
  'use strict';
  const root = document.documentElement;
  const stage = document.getElementById('stage');
  const scenes = [...document.querySelectorAll('.scene')];
  const beats = [...document.querySelectorAll('.beat')];
  const slugs = scenes.map(scene => scene.dataset.chapter);
  const dialog = document.getElementById('chapter-index');
  const canvas = document.getElementById('material-canvas');
  const materialLayer = document.getElementById('material-layer');
  const bridge = document.getElementById('handoff-counter');
  const bridgeLine = document.getElementById('handoff-baseline');
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const defaultType = Object.freeze({weight:650, width:100, optical:72, words:'Give type room to breathe.'});
  const palette = [[238,234,225],[203,195,180],[238,234,225],[238,234,225],[238,234,225],[122,141,149],[32,33,30]];
  const inputs = {weight:document.getElementById('axis-weight'),width:document.getElementById('axis-width'),optical:document.getElementById('axis-optical'),words:document.getElementById('specimen-words')};
  const outputs = {weight:document.getElementById('value-weight'),width:document.getElementById('value-width'),optical:document.getElementById('value-optical')};
  const printButton = document.getElementById('print-page');
  const samples = [...document.querySelectorAll('.variable-sample')];
  const space = {glyph:document.querySelector('.space-r'),trace:document.querySelector('.space-trace'),caption:document.querySelector('.counter-caption')};
  const serifSample=document.querySelector('.sample-serif > svg');
  const anatomyDrawing=document.querySelector('.anatomy-drawing');
  const sansSample=document.querySelector('.sample-sans');
  const anatomyNotes=[...document.querySelectorAll('.anatomy-guide,.anatomy-callout,.feature-mark')];
  const typeHandoff=window.CounterformTypeHandoff?.create({stage,from:samples[0],to:samples[1]});
  const contourLength=Number(document.querySelector('#serif-counter path').getAttribute('pathLength'));
  space.trace.style.setProperty('--contour-length',contourLength);
  const state = {type:{...defaultType},fontStatus:'loading',reading:false,active:0,progress:0,blend:0,feature:'counter',anatomyManual:false,manualMotion:null};
  let lenis = null, materials = null, raf = 0, dirty = true, typeDirty = true;
  let boundaries = [], viewH = innerHeight, viewW = innerWidth, lastY = -1, lastActive = -1;
  let resizeTimer = 0, suspended = document.hidden, dialogOpener = null, materialKey = '';
  let animationTime = 1, lastFrameTime = null, pendingFocus = null, navigation = null;
  let editingHeight = 0, keyboardOpen = false;
  let printing = false, printPosition = null;
  let materialRects={},materialTransform=null;
  const clamp = (value, low=0, high=1) => Math.max(low, Math.min(high, value));
  const smooth = (a,b,value) => {const x=clamp((value-a)/(b-a));return x*x*(3-2*x);};
  const mix = (a,b,t) => a+(b-a)*t;
  const rgb = values => `rgb(${values.map(Math.round).join(' ')})`;
  const escapeHash = () => {try{return decodeURIComponent(location.hash.slice(1));}catch{return '';}};

  function restoreType() {
    try {
      const saved=JSON.parse(sessionStorage.getItem('counterform-type-v1') || 'null');
      if(!saved || typeof saved !== 'object') return;
      for(const key of ['weight','width','optical']) {
        if(Number.isFinite(saved[key])) state.type[key]=clamp(saved[key],Number(inputs[key].min),Number(inputs[key].max));
      }
      if(typeof saved.words==='string') state.type.words=saved.words.slice(0,72);
    } catch { /* Private sessions and malformed saved state keep the usable defaults. */ }
  }
  function saveType() {try{sessionStorage.setItem('counterform-type-v1',JSON.stringify(state.type));}catch{}}
  function wake() {dirty=true;if(!raf&&!suspended) raf=requestAnimationFrame(frame);}

  function setFontStatus(status, message='') {
    state.fontStatus=status;
    const available=status==='ready';
    printButton.hidden=false;
    printButton.disabled=!available;
    printButton.title=available?'Print a clean specimen or save it as a PDF. Your text stays on this device.':'Available when Roboto Flex has loaded.';
    for(const key of ['weight','width','optical'])inputs[key].disabled=!available;
    const notice=document.getElementById('font-status');
    if(notice){notice.hidden=available;notice.textContent=message;}
    const identity=document.getElementById('font-identity');
    if(identity)identity.innerHTML=available?'Roboto Flex<br>/ 3 exposed axes':status==='loading'?'Loading font<br>/ Axes pending':'Fallback type<br>/ Axes unavailable';
    typeDirty=true;wake();
  }
  function loadVariableFont() {
    const failed='Roboto Flex could not load. Reload to retry; words and Reset still work.';
    setFontStatus('loading','Loading Roboto Flex. Your words are already editable.');
    if(!document.fonts || typeof document.fonts.load!=='function') {
      setFontStatus('unavailable',failed);return;
    }
    // A settled FontFaceSet.ready promise does not prove a face loaded successfully.
    // A slow request may still recover after the bounded fallback notice appears.
    const timeout=setTimeout(()=>{
      if(state.fontStatus==='loading')setFontStatus('unavailable','Roboto Flex is still loading. Words work; axes will unlock when it is ready.');
    },8000);
    Promise.resolve().then(()=>document.fonts.load('650 32px "Roboto Flex"','Rag')).then(faces=>{
      clearTimeout(timeout);
      const loaded=faces.some(face=>face.status==='loaded' && face.family.replace(/["']/g,'').trim()==='Roboto Flex');
      setFontStatus(loaded?'ready':'unavailable',loaded?'':failed);
    },()=>{clearTimeout(timeout);setFontStatus('unavailable',failed);});
  }

  function measure(preserve=false) {
    if(printing)return;
    const previous = locate(window.scrollY);
    viewW=innerWidth; viewH=innerHeight;
    root.style.setProperty('--view-h',`${viewH}px`);
    let cursor=0;
    boundaries=beats.map(beat=>{
      const span=Number(beat.dataset.span);
      beat.style.setProperty('--span',span);
      const entry={start:cursor,length:span*viewH};cursor+=entry.length;return entry;
    });
    lenis?.resize();
    if(preserve && !state.reading && previous && boundaries[previous.index]) {
      const target=boundaries[previous.index].start+previous.progress*boundaries[previous.index].length;
      if(lenis)lenis.scrollTo(target,{immediate:true,force:true});else window.scrollTo(0,target);
    }
    typeDirty=true;materialKey='';typeHandoff?.invalidate();wake();
  }
  function locate(y) {
    if(!boundaries.length)return {index:0,progress:0};
    let index=0;
    for(let i=1;i<boundaries.length;i++){if(y>=boundaries[i].start-.1)index=i;else break;}
    return {index,progress:clamp((y-boundaries[index].start)/boundaries[index].length)};
  }
  function createLenis() {
    if(state.reading || !window.Lenis || lenis)return;
    lenis=new window.Lenis({autoRaf:false,autoResize:false,lerp:.11,smoothWheel:true,syncTouch:false,anchors:false,overscroll:true,prevent:node=>Boolean(node.closest?.('dialog,[data-lenis-prevent]'))});
    lenis.on('scroll',wake);
  }
  function setMode(reading, retain=true) {
    const current=state.active;
    state.reading=reading;
    navigation=null;pendingFocus=null;
    lenis?.destroy();lenis=null;
    lastFrameTime=null;
    root.classList.toggle('reading',reading);
    root.classList.toggle('enhanced',!reading);
    document.getElementById('motion-toggle').setAttribute('aria-pressed',String(!reading));
    document.getElementById('motion-value').textContent=reading?'off':'on';
    scenes.forEach(scene=>{
      scene.style.opacity=reading?'1':'';scene.style.transform='';scene.style.visibility='';scene.style.removeProperty('--copy-opacity');
      scene.inert=false;scene.removeAttribute('aria-hidden');scene.classList.remove('is-visible','is-active');
    });
    document.querySelector('.counter-caption').style.opacity=reading?'1':'';
    if(reading){materialLayer.style.opacity='0';root.style.setProperty('--foreground','var(--ink)');}
    createLenis();measure(false);
    if(retain)goTo(slugs[current],{instant:true,history:false,focus:false,closeIndex:false});
    if(dialog.open)lenis?.stop();
    wake();
  }
  function shouldRead() {return state.manualMotion===null?(reducedQuery.matches || innerHeight<700):!state.manualMotion;}

  function goTo(slug, options={}) {
    const index=slugs.indexOf(slug);if(index<0)return;
    const located=locate(window.scrollY);
    const from={index:state.active,progress:state.active===located.index?located.progress:0};
    pendingFocus=null;
    navigation=null;
    const instant=Boolean(options.instant || reducedQuery.matches || state.reading);
    if(options.history!==false && location.hash!==`#${slug}`) {
      try{history.pushState({counterform:true,chapter:slug},'',`#${slug}`);}catch{}
    }
    if(dialog.open && options.closeIndex!==false){dialogOpener=null;dialog.close();}
    if(state.reading) {
      scenes[index].scrollIntoView({behavior:'instant',block:'start'});
      state.active=index;
    } else {
      // Choose the chapter immediately; the same director dissolves the two
      // compositions over 480ms rather than racing through every intervening beat.
      const target=boundaries[index].start;
      if(!instant && from.index!==index)navigation={from,to:index,start:animationTime,duration:480};
      if(lenis){lenis.start();lenis.scrollTo(target,{immediate:true,force:true});}
      else window.scrollTo({top:target,behavior:'instant'});
    }
    if(options.focus) {
      const heading=scenes[index].querySelector('h1,h2');heading.setAttribute('tabindex','-1');
      pendingFocus={heading,index};
    }
    wake();
  }
  function syncNavigation(active) {
    if(active===lastActive)return;
    lastActive=active;
    document.querySelectorAll('.desktop-nav a,.chapter-rail a,.index-links a').forEach(link=>{
      if(link.getAttribute('href')===`#${slugs[active]}`)link.setAttribute('aria-current','step');else link.removeAttribute('aria-current');
    });
    stage.dataset.active=slugs[active];
    // Navigation keeps an opaque surface and a matched foreground. It never
    // fades ink and paper through the same grey as the exhibition background.
    root.style.setProperty('--nav-surface',rgb(palette[active]));
    root.style.setProperty('--nav-foreground',active===6?'var(--paper)':'var(--ink)');
  }

  function updateType() {
    const {type}=state;
    for(const key of ['weight','width','optical']) {
      inputs[key].value=String(type[key]);outputs[key].value=String(type[key]);outputs[key].textContent=String(type[key]);
      inputs[key].style.setProperty('--fill',`${100*(type[key]-Number(inputs[key].min))/(Number(inputs[key].max)-Number(inputs[key].min))}%`);
    }
    if(inputs.words.value!==type.words)inputs.words.value=type.words;
    root.style.setProperty('--weight',type.weight);
    root.style.setProperty('--width',`${type.width}%`);
    root.style.setProperty('--optical',type.optical);
    samples.forEach(sample=>{sample.textContent=type.words.trim() || defaultType.words;});
    document.getElementById('final-values').textContent=state.fontStatus==='ready'
      ?`Weight ${type.weight} / Width ${type.width} / Optical size ${type.optical}`
      :state.fontStatus==='loading'?'Variable font loading; axis settings are waiting.':'Variable axes unavailable; your words are preserved.';
    syncPrintSpecimen();
    fitType();typeHandoff?.invalidate();typeDirty=false;
  }
  function syncPrintSpecimen() {
    const {weight,width,optical,words}=state.type;
    const specimen=document.getElementById('print-words');
    specimen.textContent=words.trim() || defaultType.words;
    specimen.style.setProperty('--weight',weight);
    specimen.style.setProperty('--width',`${width}%`);
    specimen.style.setProperty('--optical',optical);
    document.getElementById('print-values').textContent=`Weight ${weight} / Width ${width} / Optical size ${optical}`;
  }
  function fitType() {
    // Font size is fitted to real line boxes only when the layout would overflow.
    // Glyph width and weight always come from the actual variable font, never transforms.
    samples.forEach(sample=>{
      const box=sample.parentElement;
      const bounds=box.getBoundingClientRect();
      const width=bounds.width,height=bounds.height;
      if(width<10 || height<10)return;
      const maximum=viewW<=850?Math.min(viewW*.29,height*.56):viewW*(sample.classList.contains('final-sample')?.124:.132);
      const fits=size=>{sample.style.fontSize=`${size}px`;return sample.scrollWidth<=width+.25&&sample.getBoundingClientRect().height<=height+.25;};
      if(fits(maximum))return;
      let low=18,high=maximum;
      for(let i=0;i<11;i++){const mid=(low+high)/2;if(fits(mid))low=mid;else high=mid;}
      sample.style.fontSize=`${Math.floor(low*10)/10}px`;
    });
  }
  function setFeature(feature, manual=false) {
    if(!['counter','bowl','serif'].includes(feature))return;
    state.feature=feature;if(manual)state.anatomyManual=true;
    document.getElementById('anatomy').dataset.focus=feature;
    document.getElementById('anatomy').classList.toggle('manual-feature',state.anatomyManual);
    document.querySelectorAll('[data-feature]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.feature===feature)));
  }

  function baseMaterialRect(scene) {
    if(viewW<=520)return scene==='mark'?[0,viewH*.42,viewW,viewH*.48]:[viewW*.03,viewH*.36,viewW*.94,viewH*.38];
    if(viewW<=850)return scene==='mark'?[viewW*.25,viewH*.4,viewW*.75,viewH*.51]:[viewW*.04,viewH*.34,viewW*.92,viewH*.44];
    return scene==='mark'?[viewW*.43,viewH*.09,viewW*.57,viewH*.83]:[viewW*.035,viewH*.265,viewW*.93,viewH*.535];
  }
  function getMaterialRect(scene) {return materialRects[scene]||baseMaterialRect(scene);}
  function renderMaterial(candidates) {
    if(!materials?.ready || state.reading)return;
    const paired=Boolean(materialRects.mark);
    const layers=candidates.filter(c=>(c.index===1||c.index===2)&&(paired||c.alpha>.001)).map(c=>({...c,scene:slugs[c.index],rect:getMaterialRect(slugs[c.index])}));
    if(!layers.length){materialLayer.style.opacity='0';return;}
    // A fixed composition surface lets the cached stone travel toward the die
    // without reallocating or redrawing either material at each scroll position.
    const dual=layers.length===2;
    const [x,y,width,height]=dual?[0,0,viewW,viewH]:layers[0].rect;
    const key=`${layers.map(c=>c.scene).join('+')}/${width}/${height}`;
    Object.assign(materialLayer.style,{left:`${x}px`,top:`${y}px`,width:`${width}px`,height:`${height}px`});
    if(key!==materialKey){
      materials.resize(width,height,Math.min(devicePixelRatio||1,viewW>2200?1:1.5));materialKey=key;
    }
    materialLayer.style.opacity=layers.length===1?String(layers[0].alpha):'1';
    const okay=layers.length===1
      ?materials.render({scene:layers[0].scene,progress:clamp(layers[0].progress/.78),reduced:false})
      :materials.renderLayers({layers:layers.map(c=>({scene:c.scene,progress:clamp(c.progress/.78),opacity:c.alpha,rect:[c.rect[0]-x,c.rect[1]-y,c.rect[2],c.rect[3]],sourceSize:baseMaterialRect(c.scene).slice(2)}))});
    if(materialTransform)applyGlobalTransform(materialLayer,materialTransform,[x,y]);
    if(okay===false){root.classList.remove('has-materials');materialLayer.style.opacity='0';}
  }
  function counterMatrix(index,progress,role) {
    if((index===1||index===2)&&materials?.ready&&root.classList.contains('has-materials')&&materials.counterMatrix) {
      const rect=getMaterialRect(slugs[index]);
      const matrix=materials.counterMatrix({scene:slugs[index],progress:clamp(progress/.78),width:rect[2],height:rect[3],role});
      if(matrix){matrix[4]+=rect[0];matrix[5]+=rect[1];return index===2&&materialTransform?multiplyMatrix(materialTransform,matrix):matrix;}
    }
    const selectors=['.space-r','.mark-art svg',role==='entry'?'.type-die svg':'.printed-sheet svg','.sample-serif > svg','.anatomy-drawing','.live-signature','.final-signature'];
    const matrix=document.querySelector(selectors[index])?.getScreenCTM();
    return matrix?[matrix.a,matrix.b,matrix.c,matrix.d,matrix.e,matrix.f]:null;
  }
  function multiplyMatrix(a,b) {
    return [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
  }
  function inverseMatrix(m) {
    const determinant=m[0]*m[3]-m[1]*m[2];
    if(Math.abs(determinant)<1e-10)return null;
    return [m[3]/determinant,-m[1]/determinant,-m[2]/determinant,m[0]/determinant,(m[2]*m[5]-m[3]*m[4])/determinant,(m[1]*m[4]-m[0]*m[5])/determinant];
  }
  function applyGlobalTransform(element,matrix,origin) {
    const rect=origin?null:element.getBoundingClientRect();
    const [x,y]=origin||[rect.left,rect.top];
    const local=multiplyMatrix([1,0,0,1,-x,-y],multiplyMatrix(matrix,[1,0,0,1,x,y]));
    element.style.transformOrigin='0px 0px';
    element.style.transform=`matrix(${local.join(',')})`;
  }
  function resetHandoffGeometry() {
    materialRects={};materialTransform=null;
    for(const element of [space.glyph,serifSample,anatomyDrawing,materialLayer]){element.style.transform='';element.style.transformOrigin='';}
    sansSample.style.opacity='';
    anatomyNotes.forEach(element=>element.style.opacity='');
    samples.forEach(sample=>{sample.style.visibility='';sample.style.opacity='';});
    typeHandoff?.hide();
  }
  function matchArtwork(element,index,next,t,progress,nextProgress,end=.40) {
    const a=counterMatrix(index,progress,'exit'),b=counterMatrix(next,nextProgress,'entry');
    const inverse=a&&inverseMatrix(a);if(!inverse||!b)return;
    const amount=smooth(0,end,t),destination=a.map((value,i)=>mix(value,b[i],amount));
    applyGlobalTransform(element,multiplyMatrix(destination,inverse));
  }
  function stageMaterialHandoff(index,next,t,progress,nextProgress) {
    if(!materials?.ready||!root.classList.contains('has-materials'))return;
    const a=counterMatrix(index,progress,'exit'),b=counterMatrix(next,nextProgress,'entry');
    if(!a||!b)return;
    if(index===1&&next===2) {
      const rect=baseMaterialRect('mark');
      const project=m=>[m[0]*723.069+m[2]*439.384+m[4],m[1]*723.069+m[3]*439.384+m[5]];
      const source=project(a),target=project(b);
      const ratio=clamp(Math.hypot(b[2],b[3])/Math.hypot(a[2],a[3]),.1,2);
      const destination=[target[0]-(source[0]-rect[0])*ratio,target[1]-(source[1]-rect[1])*ratio,rect[2]*ratio,rect[3]*ratio];
      materialRects.mark=rect.map((value,i)=>mix(value,destination[i],smooth(0,.50,t)));
    } else if(index===2&&next===3) {
      const inverse=inverseMatrix(a);if(!inverse)return;
      const destination=a.map((value,i)=>mix(value,b[i],smooth(0,.48,t)));
      materialTransform=multiplyMatrix(destination,inverse);
    }
  }
  function placeCounterCaption() {
    const matrix=space.glyph.getScreenCTM();if(!matrix)return;
    const mobile=viewW<=520,x=mobile?520:650,y=mobile?400:420;
    const point={x:matrix.a*x+matrix.c*y+matrix.e,y:matrix.b*x+matrix.d*y+matrix.f};
    const figure=space.glyph.parentElement.getBoundingClientRect();
    const label=space.caption.lastElementChild.getBoundingClientRect();
    const gutter=document.querySelector('.masthead').getBoundingClientRect().left;
    const gap=mobile?6:12;
    const width=mobile?6:Math.max(12,viewW-gutter-label.width-point.x-gap);
    Object.assign(space.caption.style,{left:`${point.x-figure.left}px`,right:'auto',top:`${point.y-figure.top-label.height/2}px`});
    space.caption.firstElementChild.style.width=`${width}px`;
  }
  function renderBridge(index,next,t,progress,nextProgress) {
    const alpha=Math.sin(Math.PI*t)*.66;
    if(alpha<.001){bridge.style.opacity='0';bridgeLine.style.opacity='0';return;}
    const a=counterMatrix(index,progress,'exit'),b=counterMatrix(next,nextProgress,'entry');
    if(!a||!b){bridge.style.opacity='0';bridgeLine.style.opacity='0';return;}
    const eased=smooth(.08,.92,t),matrix=a.map((v,i)=>mix(v,b[i],eased));
    bridge.setAttribute('viewBox',`0 0 ${viewW} ${viewH}`);
    bridge.querySelector('use').setAttribute('transform',`matrix(${matrix.join(' ')})`);
    bridge.style.opacity=String(alpha);
    const baseline=clamp(matrix[3]*1400+matrix[5],viewH*.35,viewH*.86);
    bridgeLine.style.top=`${baseline}px`;
    bridgeLine.style.transform=`scaleX(${.7+.3*Math.sin(Math.PI*t)})`;
    bridgeLine.style.opacity=String(alpha*.32);
  }
  function render() {
    if(typeDirty)updateType();
    resetHandoffGeometry();
    if(state.reading) {
      let nearest=0;
      scenes.forEach((scene,i)=>{if(scene.getBoundingClientRect().top<viewH*.5)nearest=i;});
      state.active=nearest;syncNavigation(nearest);return;
    }
    const position=locate(window.scrollY);
    let {index,progress}=position;
    let next=Math.min(index+1,scenes.length-1),nextProgress=0;
    let t=index<6?smooth(.78,1,progress):0;
    const navigating=Boolean(navigation);
    if(navigation) {
      index=navigation.from.index;progress=navigation.from.progress;next=navigation.to;
      t=smooth(0,1,(animationTime-navigation.start)/navigation.duration);
      if(t>=1)navigation=null;
    }
    // Each adjacent pair has a landing point. The old specimen approaches it
    // before the next surface appears; titles have their own shorter departure.
    const adjacent=!navigating&&next===index+1;
    let into=index===next?0:smooth(.06,.94,t),out=1-into;
    if(adjacent&&(index===0||index===3)){into=smooth(.30,.93,t);out=1-into;}
    if(adjacent&&index===1){into=smooth(.40,.94,t);out=1-into;}
    if(adjacent&&index===2){into=smooth(.42,.95,t);out=1-smooth(.45,.95,t);}
    if(adjacent&&index===4){into=smooth(.42,1,t);out=1-smooth(.55,1,t);}
    const copyOut=1-smooth(.04,adjacent&&(index===2||index===3)?.18:.48,t),copyIn=smooth(.46,.94,t);
    const active=into>out?next:index;
    state.active=active;state.progress=progress;state.blend=t;syncNavigation(active);
    const skin=palette[index].map((value,i)=>mix(value,palette[next][i],t));
    root.style.setProperty('--surface',rgb(skin));
    const luminance=values=>values.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
    const light=luminance(skin),ink=luminance(palette[6]),paper=luminance(palette[0]);
    root.style.setProperty('--foreground',(paper+.05)/(light+.05)>(light+.05)/(ink+.05)?'var(--paper)':'var(--ink)');
    scenes.forEach((scene,i)=>{
      const alpha=i===index?out:i===next?into:0;
      const copy=i===index?copyOut:i===next?copyIn:0;
      const visible=alpha>.001;
      const interactive=i===active&&alpha>=.6&&copy>=.65;
      scene.classList.toggle('is-visible',visible);scene.classList.toggle('is-active',interactive);
      scene.style.opacity=String(alpha);scene.style.transform='';
      scene.style.setProperty('--copy-opacity',String(alpha>.001?Math.min(1,copy/alpha):0));
      scene.style.setProperty('--copy-shift',`${i===index?-smooth(0,.5,t)*8:i===next?(1-smooth(.46,1,t))*10:0}px`);
      scene.inert=!interactive;scene.setAttribute('aria-hidden',String(i!==active));
    });
    if(index===0||next===0) {
      const reveal=smooth(0,.30,index===0?progress:nextProgress);
      space.glyph.style.transform=`scale(${mix(1.025,1,reveal)})`;
      space.trace.style.setProperty('--contour-offset',contourLength*(1-reveal)*.48);
    }
    if(adjacent&&t>0&&t<1) {
      if(index===0)matchArtwork(space.glyph,index,next,t,progress,nextProgress);
      if(index===1||index===2)stageMaterialHandoff(index,next,t,progress,nextProgress);
      if(index===3) {
        matchArtwork(serifSample,index,next,t,progress,nextProgress);
        sansSample.style.opacity=String(1-smooth(.04,.58,t));
      }
      if(index===4) {
        matchArtwork(anatomyDrawing,index,next,t,progress,nextProgress,.68);
        anatomyNotes.forEach(element=>element.style.opacity=String(1-smooth(0,.32,t)));
      }
    }
    if(index===0||next===0)placeCounterCaption();
    // A single native text layer bridges the two different final line layouts.
    // The accessible original headings retain their measured layout underneath.
    samples.forEach(sample=>sample.style.opacity='var(--copy-opacity,1)');
    if(((index===5&&next===6)||(index===6&&next===5))&&t>0&&t<1&&typeHandoff?.render(smooth(.08,.92,index===5?t:1-t))) {
      samples.forEach(sample=>sample.style.visibility='hidden');
    }
    if(index===2 || (next===2 && into>.001)) {
      const press=clamp((index===2?progress:0)/.78);
      document.querySelectorAll('[data-press-step]').forEach((item,i)=>item.classList.toggle('is-current',i===(press<.36?0:press<.63?1:2)));
      document.querySelector('.pressure-rule').style.transform=`scaleX(${.25+.75*smooth(.3,.8,press)})`;
    }
    if((index===4 || (next===4 && into>.001))&&!state.anatomyManual) {
      const anatomyProgress=index===4?progress:0;
      setFeature(anatomyProgress<.32?'counter':anatomyProgress<.55?'bowl':'serif');
    }
    renderMaterial([{index,alpha:out,progress},{index:next,alpha:into,progress:nextProgress}]);
    renderBridge(index,next,t,progress,nextProgress);
    stage.dataset.phase=navigation?'navigate':navigating?'enter':progress<.18?'enter':progress<.78?'hold':'handoff';
    stage.dataset.source=slugs[index];stage.dataset.destination=slugs[next];
  }
  function frame(time) {
    raf=0;if(suspended||printing){lastFrameTime=null;return;}
    if(printPosition!==null){
      // Print media removes the journey from layout. Restore only once screen
      // layout is back, using this same owned clock and the original position.
      if(matchMedia('print').matches){wake();return;}
      const target=printPosition;printPosition=null;
      measure(false);
      if(lenis){if(!dialog.open)lenis.start();lenis.scrollTo(target,{immediate:true,force:true});}
      else window.scrollTo({top:target,behavior:'instant'});
    }
    // Advance the one scroll clock only while this RAF loop is active.
    // The first frame after idle/resume establishes an anchor, never an idle-sized step.
    if(lastFrameTime!==null)animationTime+=Math.max(0,time-lastFrameTime);
    lastFrameTime=time;
    lenis?.raf(animationTime);
    if(navigation)dirty=true;
    if(window.scrollY!==lastY)dirty=true;
    if(dirty){render();lastY=window.scrollY;dirty=false;}
    if(pendingFocus&&!navigation&&!lenis?.isScrolling){
      const target=pendingFocus;pendingFocus=null;
      if(state.active===target.index&&!dialog.open)target.heading.focus({preventScroll:true});
    }
    if(lenis?.isScrolling || typeDirty || navigation)wake();
    if(!raf)lastFrameTime=null;
  }

  function syncEditingViewport() {
    if(printing||printPosition!==null)return false;
    const viewport=window.visualViewport;
    const height=viewport?.height||innerHeight;
    const editing=document.activeElement===inputs.words;
    const open=!state.reading&&editing&&viewW<=850&&height<(editingHeight||viewH)-100;
    const wasOpen=keyboardOpen;keyboardOpen=open;
    root.classList.toggle('keyboard-open',open);
    if(open) {
      root.style.setProperty('--keyboard-height',`${height}px`);
      root.style.setProperty('--keyboard-offset',`${viewport?.offsetTop||0}px`);
      document.getElementById('type-controls').setAttribute('data-lenis-prevent','');
      if(!wasOpen) {
        navigation=null;pendingFocus=null;
        if(lenis){lenis.scrollTo(boundaries[5].start,{immediate:true,force:true});lenis.stop();}
        else window.scrollTo(0,boundaries[5].start);
      }
      wake();
    } else if(wasOpen) {
      document.getElementById('type-controls').removeAttribute('data-lenis-prevent');
      if(!dialog.open)lenis?.start();
      const reading=shouldRead();
      if(reading!==state.reading)setMode(reading);else measure(!state.reading);
    }
    return open;
  }

  // A visitor taking over a control owns focus immediately. There is no delayed
  // timeout left behind by navigation to pull them back to a heading.
  document.addEventListener('pointerdown',event=>{
    pendingFocus=null;
    if(navigation&&event.target.closest('.scene')===scenes[navigation.to]){navigation=null;render();wake();}
  },{capture:true,passive:true});
  document.addEventListener('keydown',event=>{
    if(pendingFocus)pendingFocus=null;
    if(navigation&&['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)){navigation=null;wake();}
  },{capture:true});
  const interruptNavigation=()=>{pendingFocus=null;if(navigation){navigation=null;wake();}};
  addEventListener('wheel',interruptNavigation,{passive:true});
  addEventListener('touchstart',interruptNavigation,{passive:true});
  inputs.words.addEventListener('focus',()=>{editingHeight=viewH;syncEditingViewport();});
  inputs.words.addEventListener('blur',()=>setTimeout(()=>{syncEditingViewport();editingHeight=0;},0));
  window.visualViewport?.addEventListener('resize',syncEditingViewport,{passive:true});
  window.visualViewport?.addEventListener('scroll',syncEditingViewport,{passive:true});

  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href^="#"]');if(!link)return;
    const slug=link.getAttribute('href').slice(1);if(!slugs.includes(slug))return;
    event.preventDefault();goTo(slug,{focus:event.detail===0});
  });
  function openIndex(credits=false) {
    pendingFocus=null;navigation=null;
    dialogOpener=document.activeElement;
    document.getElementById('source-notes').open=credits;
    dialog.showModal();lenis?.stop();
    if(!credits)dialog.scrollTop=0;
    if(credits)document.getElementById('source-notes').scrollIntoView({block:'center'});
  }
  document.getElementById('index-open').addEventListener('click',()=>openIndex());
  document.getElementById('credits-open').addEventListener('click',()=>openIndex(true));
  printButton.addEventListener('click',()=>{
    if(state.fontStatus!=='ready')return;
    updateType();
    window.print();
  });
  addEventListener('beforeprint',()=>{
    if(!printing)printPosition=window.scrollY;
    printing=true;navigation=null;pendingFocus=null;
    lenis?.stop();syncPrintSpecimen();
  });
  addEventListener('afterprint',()=>{printing=false;lastFrameTime=null;wake();});
  document.getElementById('index-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{lenis?.start();if(dialogOpener?.isConnected)dialogOpener.focus({preventScroll:true});wake();});
  document.getElementById('motion-toggle').addEventListener('click',()=>{state.manualMotion=state.reading;setMode(!state.reading);});
  document.getElementById('trace-counters').addEventListener('click',event=>{
    const pressed=event.currentTarget.getAttribute('aria-pressed')==='true';
    event.currentTarget.setAttribute('aria-pressed',String(!pressed));
    event.currentTarget.firstChild.textContent=pressed?'Trace the counters ':'Hide counter traces ';
    document.getElementById('divide').classList.toggle('counters-traced',!pressed);wake();
  });
  document.querySelectorAll('[data-feature]').forEach(button=>{button.disabled=false;button.addEventListener('click',()=>{setFeature(button.dataset.feature,true);wake();});});
  document.getElementById('type-controls').addEventListener('submit',event=>event.preventDefault());
  for(const [key,input] of Object.entries(inputs))input.addEventListener('input',()=>{
    state.type[key]=key==='words'?input.value:clamp(Number(input.value),Number(input.min),Number(input.max));
    typeDirty=true;saveType();wake();
  });
  document.getElementById('type-controls').addEventListener('reset',event=>{event.preventDefault();state.type={...defaultType};typeDirty=true;saveType();wake();});
  addEventListener('scroll',wake,{passive:true});addEventListener('wheel',wake,{passive:true});addEventListener('touchmove',wake,{passive:true});
  addEventListener('keydown',wake,{passive:true});
  addEventListener('resize',()=>{
    clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{
      if(printing||printPosition!==null)return;
      // Keep the chapter still and place the editing panel inside the visible
      // viewport while a mobile keyboard occupies the rest of the screen.
      if(innerWidth===viewW&&syncEditingViewport())return;
      const nextMode=shouldRead();if(nextMode!==state.reading)setMode(nextMode);else measure(!state.reading);
    },100);
  });
  reducedQuery.addEventListener('change',()=>{state.manualMotion=null;setMode(shouldRead());});
  addEventListener('popstate',()=>{const slug=escapeHash();goTo(slugs.includes(slug)?slug:'space',{instant:true,history:false});});
  addEventListener('pageshow',()=>{suspended=document.hidden;lastFrameTime=null;measure(false);wake();});
  document.addEventListener('visibilitychange',()=>{
    suspended=document.hidden;
    lastFrameTime=null;
    if(suspended){if(raf)cancelAnimationFrame(raf);raf=0;}
    else{lenis?.resize();materialKey='';wake();}
  });
  canvas.addEventListener('counterform:materials-lost',()=>{root.classList.remove('has-materials');wake();});
  canvas.addEventListener('counterform:materials-restored',()=>{if(materials?.ready)root.classList.add('has-materials');materialKey='';wake();});
  addEventListener('pagehide',()=>{saveType();suspended=true;lastFrameTime=null;if(raf)cancelAnimationFrame(raf);raf=0;});

  restoreType();
  loadVariableFont();
  setMode(shouldRead(),false);
  try {
    materials=window.CounterformMaterials?.create(canvas) || null;
    if(materials?.ready)root.classList.add('has-materials');
  } catch {materials=null;}
  document.body.classList.add('ready');
  document.fonts?.ready.then(()=>{typeDirty=true;measure(false);wake();});
  const initial=escapeHash();
  if(slugs.includes(initial))goTo(initial,{instant:true,history:false});
  wake();
})();
