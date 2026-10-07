import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import {WaveWorld} from './world.js';
import {ResonanceAudio} from './audio.js';
import {clamp,locateScene,panelOpacity,scrollPositionFor} from './scroll-state.js';

const $=selector=>document.querySelector(selector);
const acts=[...document.querySelectorAll('.act')];
const panels=[...document.querySelectorAll('.scene-panel')];
const rail=[...document.querySelectorAll('.chapter-rail>a')];
const names=['Silence','Vibration','Propagation','Interference','Resonance','Harmonics','Memory','Return'];
const headings=panels.map(panel=>panel.querySelector('h1,h2'));
const root=document.documentElement;
const soundButton=$('#sound-toggle');
const dialog=$('#index-dialog');
const audio=new ResonanceAudio();
const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
let savedMotion=null;
try{const value=localStorage.getItem('resonance-calm');if(value!==null)savedMotion=value==='true';}catch{/* Privacy mode may disable local storage. */}
let reducedMotion=savedMotion??motionQuery.matches;
let wheelDirection=0;
const lenis=new Lenis({
  lerp:.105,smoothWheel:!reducedMotion,syncTouch:false,
  autoRaf:false,respectReducedMotion:false,
  prevent:node=>Boolean(node.closest('dialog')),
  virtualScroll:({deltaY,event})=>{
    if(event.type!=='wheel'||event.ctrlKey||!deltaY)return true;
    const direction=Math.sign(deltaY);
    if(wheelDirection&&direction!==wheelDirection&&lenis.isScrolling==='smooth')
      lenis.scrollTo(lenis.animatedScroll,{immediate:true});
    wheelDirection=direction;
    return true;
  },
});
let scrollClock=0;
let world;
try{
  world=new WaveWorld($('#world'),{onFallback:()=>{$('#graphics-mode').textContent='A lighter visual field is active on this device.';}});
}catch(error){
  // Retain a complete semantic, navigable exhibition if graphics cannot start.
  root.classList.remove('js');
  $('#graphics-mode').textContent='The text exhibition is available. This browser could not start the visual field.';
}

const state={time:0,scene:0,rawProgress:0,phase:Math.PI/4,frequency:110,mode:1,impulse:0,impulseAge:100,pointer:{x:0,y:0},reducedMotion,playing:false,captureProgress:0,ending:0};
let offsets=[],documentHeight=0,width=0,height=0,needsMeasure=true,preserveOnMeasure=false;
let frameId=0,lastTimestamp=0,lastAct=-1,selectedMode=1,targetPointer={x:0,y:0};
let captureStarted=-1,captureBusy=false,noticeUntil=-1,lastCaptureSecond=-1,pendingFocus=-1;
let previousPlaying=false,pendingRoute=null;
let spectrum=[1,.5,.25,.125];

function announce(message,duration=4){$('#notice').textContent=message;$('#notice').hidden=false;noticeUntil=state.time+duration;}
function syncAudio(){audio.setState({scene:state.scene,frequency:state.frequency,phase:state.phase,harmonics:spectrum});}
function updateSoundUI(){
  soundButton.setAttribute('aria-pressed',String(audio.enabled));
  soundButton.setAttribute('aria-label',audio.enabled?'Mute sound':'Enable sound');
  soundButton.querySelector('span').textContent=audio.enabled?'Sound on':'Sound off';
  soundButton.querySelector('use').setAttribute('href',audio.enabled?'#i-sound':'#i-mute');
}
function exciteVisual(strength=1){state.impulse=clamp(strength);state.impulseAge=0;}
function excite(strength=1){exciteVisual(strength);audio.excite(strength);}
function measure(){
  const old=offsets.length?locateScene(scrollY,offsets,height,documentHeight):null;
  width=innerWidth;height=innerHeight;
  offsets=acts.map(el=>el.offsetTop);
  documentHeight=document.documentElement.scrollHeight;
  world?.resize(width,height,Math.min(devicePixelRatio||1,1.75));
  if(preserveOnMeasure&&old){lenis.resize();lenis.scrollTo(scrollPositionFor(old.raw,offsets,height,documentHeight),{immediate:true,force:true});}
  if(lenis.isScrolling!=='smooth')lenis.resize();
  preserveOnMeasure=false;needsMeasure=false;
}
function goTo(index,{smooth=true,focus=false,updateHash=true}={}){
  index=Math.round(clamp(index,0,7));
  if(needsMeasure)measure();
  if(dialog.open)dialog.close();
  lenis.start();
  pendingFocus=focus?index:-1;
  if(updateHash)history.replaceState(null,'',`#${acts[index].id}`);
  lenis.resize();
  lenis.scrollTo(offsets[index],{immediate:!smooth||reducedMotion});
}
function setMotion(value,persist=false){
  reducedMotion=Boolean(value);state.reducedMotion=reducedMotion;
  lenis.options.smoothWheel=!reducedMotion;
  lenis.scrollTo(scrollY,{immediate:true,force:true});
  root.classList.toggle('calm-motion',reducedMotion);
  $('#motion-toggle').setAttribute('aria-pressed',String(reducedMotion));
  if(persist){savedMotion=reducedMotion;try{localStorage.setItem('resonance-calm',String(reducedMotion));}catch{}}
}
function updatePanels(position){
  for(let i=0;i<8;i++){
    const opacity=panelOpacity(position.scene,i);
    const visible=opacity>.001;
    const panel=panels[i];
    panel.classList.toggle('is-active',visible);
    panel.style.opacity=opacity.toFixed(4);
    panel.style.transform=`translateX(${((i-position.scene)*-24*(reducedMotion?.25:1)).toFixed(2)}px)`;
    panel.inert=i!==position.act||opacity<.25;
    panel.setAttribute('aria-hidden',String(i!==position.act));
  }
  const copy=panels[7].querySelector('.scene-copy');
  const copyOpacity=1-clamp((position.ending-.13)/.62);
  copy.style.opacity=copyOpacity.toFixed(3);
  copy.inert=copyOpacity<.15;
  $('.closing-line').style.opacity=clamp((position.ending-.55)/.3).toFixed(3);
  if(position.act!==lastAct){
    lastAct=position.act;
    root.dataset.scene=acts[lastAct].id;
    for(let i=0;i<8;i++){
      rail[i].classList.toggle('is-current',i===lastAct);
      if(i===lastAct)rail[i].setAttribute('aria-current','step');else rail[i].removeAttribute('aria-current');
    }
    $('#mobile-scene-label').textContent=`0${lastAct+1} / ${names[lastAct]}`;
    $('#continue').hidden=lastAct===7;
    $('#continue span').textContent=lastAct===0?'Scroll to begin':'Continue the wave';
    syncAudio();
  }
  $('#rail-progress').style.transform=`scaleX(${clamp(position.scene/7)})`;
  if(pendingFocus===position.act&&Math.abs(position.scene-position.act)<.03){
    const heading=headings[pendingFocus];
    // Removing inert can defer descendant visibility until the next frame.
    // Keep keyboard focus pending on this same owned clock until it succeeds.
    if(getComputedStyle(heading).visibility==='visible'){
      heading.focus({preventScroll:true});
      if(document.activeElement===heading)pendingFocus=-1;
    }
  }
}
function updateCapture(){
  if(captureStarted<0)return;
  const elapsed=state.time-captureStarted;
  state.captureProgress=clamp(elapsed/3);
  const second=Math.min(3,Math.floor(elapsed));
  if(second!==lastCaptureSecond){$('#capture-status').textContent=`Etching the tone · ${second} / 3 s`;lastCaptureSecond=second;}
  if(elapsed>=3){
    captureStarted=-1;captureBusy=false;
    $('#capture').disabled=false;
    $('#capture>span').textContent='Capture again';
    $('#capture-status').textContent=`Tone held · ${audio.capture?.frequency??state.frequency} Hz · 3 s`;
    $('#download-tone').hidden=false;
  }
}
function tick(timestamp){
  frameId=0;
  if(document.hidden)return;
  // Analytic motion keeps real active time even on a slow frame. Visibility
  // handlers reset the baseline when the tab is suspended.
  const delta=lastTimestamp?Math.max(0,(timestamp-lastTimestamp)/1000):0;
  lastTimestamp=timestamp;
  state.time+=delta;state.impulseAge+=delta;
  if(needsMeasure)measure();
  if(pendingRoute!==null){goTo(pendingRoute,{smooth:false,updateHash:false});pendingRoute=null;}
  scrollClock+=Math.min(delta,.05)*1000;
  lenis.raf(scrollClock);
  const position=locateScene(scrollY,offsets,height,documentHeight);
  state.scene=position.scene;state.rawProgress=position.raw;state.ending=position.ending;
  state.mode+=(selectedMode-state.mode)*(1-Math.exp(-delta*4.2));
  if(Math.abs(selectedMode-state.mode)<.0001)state.mode=selectedMode;
  state.pointer.x+=(targetPointer.x-state.pointer.x)*(1-Math.exp(-delta*3));
  state.pointer.y+=(targetPointer.y-state.pointer.y)*(1-Math.exp(-delta*3));
  state.playing=audio.playing;
  if(state.playing!==previousPlaying){
    previousPlaying=state.playing;
    $('#playback>span:last-child').textContent=state.playing?'Let it fall quiet':'Release the signal';
    $('#playback use').setAttribute('href',state.playing?'#i-pause':'#i-play');
    $('#playback').setAttribute('aria-pressed',String(state.playing));
    updateSoundUI();
  }
  updateCapture();
  if(noticeUntil>=0&&state.time>=noticeUntil){$('#notice').hidden=true;noticeUntil=-1;}
  if(world){updatePanels(position);if(!dialog.open)world.render(state);}
  frameId=requestAnimationFrame(tick);
}
function start(){if(!frameId&&!document.hidden){lastTimestamp=0;frameId=requestAnimationFrame(tick);}}
function stop(){if(frameId)cancelAnimationFrame(frameId);frameId=0;lastTimestamp=0;}

document.addEventListener('click',event=>{
  const link=event.target.closest('a[href^="#"]');
  if(!link||link.classList.contains('skip-link'))return;
  const id=link.getAttribute('href').slice(1);
  const index=acts.findIndex(act=>act.id===id);
  if(index<0)return;
  event.preventDefault();goTo(index,{focus:event.detail===0});
});
$('#begin').addEventListener('click',()=>{excite(1);goTo(1);});
$('#pluck').addEventListener('click',()=>excite(1));
$('#continue').addEventListener('click',event=>goTo(lastAct+1,{focus:event.detail===0}));
$('#restart').addEventListener('click',()=>{audio.stopPlayback();goTo(0);});
soundButton.addEventListener('click',async()=>{
  soundButton.disabled=true;
  try{
    const enabled=await audio.setEnabled(!audio.enabled);
    updateSoundUI();
    if(enabled){syncAudio();excite(.4);}
    else if(audio.lastError)announce('Sound could not start. Try the sound control again.');
  }catch{announce('Sound is unavailable in this browser. The visual journey is ready.');}
  finally{soundButton.disabled=false;}
});
$('#phase').addEventListener('input',event=>{
  const value=Number(event.target.value);state.phase=value*Math.PI/180;
  $('#phase-value').textContent=`${value}°`;
  event.target.setAttribute('aria-valuetext',`${value} degrees phase difference`);
  event.target.style.setProperty('--value',`${value/1.8}%`);syncAudio();
});
$('#phase').style.setProperty('--value','25%');
$('#frequency').addEventListener('input',event=>{
  state.frequency=Number(event.target.value);
  $('#frequency-value').textContent=`${state.frequency} Hz`;
  event.target.setAttribute('aria-valuetext',`${state.frequency} hertz`);
  event.target.style.setProperty('--value',`${(state.frequency-110)/2.2}%`);syncAudio();
});
for(const button of document.querySelectorAll('[data-mode]'))button.addEventListener('click',()=>{
  selectedMode=Number(button.dataset.mode);
  for(const peer of document.querySelectorAll('[data-mode]'))peer.setAttribute('aria-pressed',String(peer===button));
  spectrum=[1,.35+selectedMode*.15,.25,.125];syncAudio();excite(.6);
});
$('#capture').addEventListener('click',async()=>{
  if(captureBusy)return;
  captureBusy=true;$('#capture').disabled=true;
  try{
    await audio.captureTone({frequency:state.frequency,harmonics:spectrum,duration:3});
    captureStarted=state.time;lastCaptureSecond=-1;
    $('#capture>span').textContent='Etching the tone';
    $('#capture-details').hidden=false;$('#download-tone').hidden=true;excite(.4);
  }catch{
    captureBusy=false;$('#capture').disabled=false;
    announce('The tone could not be captured. Please try again.');
  }
});
$('#download-tone').addEventListener('click',()=>{
  try{
    const blob=audio.exportWav();if(!blob){announce('Capture a tone first.');return;}
    const url=URL.createObjectURL(blob);const link=document.createElement('a');
    link.href=url;link.download=`resonance-${audio.capture.frequency}hz.wav`;link.hidden=true;
    document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
  }catch{announce('Capture a tone before saving it.');}
});
$('#playback').addEventListener('click',async()=>{
  if(audio.playing){audio.stopPlayback();return;}
  const button=$('#playback');button.disabled=true;
  try{
    // Start the audio context in the direct user gesture, including on Safari.
    const enabled=await audio.setEnabled(true);updateSoundUI();
    if(!enabled){announce('Sound could not start. Try enabling sound above.');return;}
    if(!audio.capture)await audio.captureTone({frequency:state.frequency,harmonics:spectrum,duration:3});
    const playing=await audio.playCapture();
    // Replay the retained signal without layering a new live-parameter pluck.
    if(playing)exciteVisual(1);else announce('The signal could not play. Please try again.');
  }catch{announce('Playback is unavailable. You can still save your captured tone.');}
  finally{button.disabled=false;}
});
$('#index-toggle').addEventListener('click',()=>{lenis.stop();dialog.showModal();document.body.classList.add('menu-open');});
$('#index-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{lenis.start();document.body.classList.remove('menu-open');needsMeasure=true;});
dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();}});
$('#motion-toggle').addEventListener('click',()=>setMotion(!reducedMotion,true));
motionQuery.addEventListener('change',event=>{if(savedMotion===null)setMotion(event.matches);});
addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;targetPointer={x:clamp(event.clientX/innerWidth,0,1)*2-1,y:clamp(event.clientY/innerHeight,0,1)*2-1};},{passive:true});
document.addEventListener('pointerleave',()=>{targetPointer={x:0,y:0};});
addEventListener('resize',()=>{preserveOnMeasure=innerWidth!==width;needsMeasure=true;},{passive:true});
document.fonts.ready.then(()=>{needsMeasure=true;});
document.addEventListener('visibilitychange',()=>{
  void audio.setVisibility(document.hidden).catch(()=>{});
  if(document.hidden){lenis.scrollTo(scrollY,{immediate:true,force:true});stop();}else{needsMeasure=true;start();}
});
addEventListener('pagehide',event=>{lenis.scrollTo(scrollY,{immediate:true,force:true});stop();if(!event.persisted)lenis.destroy();void audio.setVisibility(true).catch(()=>{});});
addEventListener('pageshow',()=>{needsMeasure=true;void audio.setVisibility(document.hidden).catch(()=>{});start();});
addEventListener('hashchange',()=>{const i=acts.findIndex(act=>`#${act.id}`===location.hash);if(i>=0)goTo(i,{smooth:false,updateHash:false});});
const navEntry=performance.getEntriesByType('navigation')[0];
if(location.hash&&navEntry?.type==='navigate'){
  const i=acts.findIndex(act=>`#${act.id}`===location.hash);if(i>=0)pendingRoute=i;
}
setMotion(reducedMotion);syncAudio();
if(world){root.classList.add('ready');clearTimeout(window.__resonanceBoot);}
start();
