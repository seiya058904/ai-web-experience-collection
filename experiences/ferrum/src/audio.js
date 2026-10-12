/** Original synthesized soundscape. Created only after an explicit user gesture. */
export function createSoundscape() {
  let context, master, rumbleGain, airGain, waterGain;
  let desiredEnabled=false, hidden=false, audible=false, disposed=false;
  let generation=0, suspendTimer, transition=Promise.resolve();
  const listeners=new Set();
  const notify=()=>listeners.forEach(fn=>fn(desiredEnabled));
  function initialize(){
    const AudioContext=window.AudioContext || window.webkitAudioContext;
    if(!AudioContext)throw new Error('Audio is unavailable in this browser.');
    context=new AudioContext({latencyHint:'interactive'});
    master=context.createGain();master.gain.value=0;master.connect(context.destination);
    const buffer=context.createBuffer(1,context.sampleRate*4,context.sampleRate);
    const data=buffer.getChannelData(0);let seed=71283;
    for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=seed/2147483648-1;}
    const noise=()=>{const source=context.createBufferSource();source.buffer=buffer;source.loop=true;source.start();return source;};
    const airFilter=context.createBiquadFilter();airFilter.type='lowpass';airFilter.frequency.value=520;
    airGain=context.createGain();airGain.gain.value=.008;noise().connect(airFilter).connect(airGain).connect(master);
    const waterFilter=context.createBiquadFilter();waterFilter.type='bandpass';waterFilter.frequency.value=1500;waterFilter.Q.value=.6;
    waterGain=context.createGain();waterGain.gain.value=0;noise().connect(waterFilter).connect(waterGain).connect(master);
    rumbleGain=context.createGain();rumbleGain.gain.value=.018;rumbleGain.connect(master);
    for(const [frequency,gain] of [[48,.62],[72,.15],[96,.08]]){
      const oscillator=context.createOscillator(),level=context.createGain();oscillator.type='sine';oscillator.frequency.value=frequency;level.gain.value=gain;oscillator.connect(level).connect(rumbleGain);oscillator.start();
    }
  }
  function clearSuspendTimer(){clearTimeout(suspendTimer);suspendTimer=undefined;}
  function muteNow(){
    audible=false;
    if(!context||!master)return;
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setValueAtTime(0,context.currentTime);
  }
  function synchronize(){
    // Serialize context operations: a late suspend must not overtake a newer resume.
    const next=transition.catch(()=>{}).then(async()=>{
      if(disposed||!context)return false;
      const token=generation;
      if(!desiredEnabled||hidden){
        muteNow();
        if(context.state!=='suspended'&&context.state!=='closed')await context.suspend();
        return desiredEnabled;
      }
      try{
        await context.resume();
        // Visibility and click intent may both have changed while resume was pending.
        if(disposed||token!==generation||!desiredEnabled||hidden)return desiredEnabled;
        master.gain.cancelScheduledValues(context.currentTime);
        master.gain.setTargetAtTime(.45,context.currentTime,.18);
        audible=true;
        return desiredEnabled;
      }catch(error){
        if(disposed||token!==generation)return desiredEnabled;
        desiredEnabled=false;generation++;clearSuspendTimer();muteNow();notify();
        throw error;
      }
    });
    transition=next;
    return next;
  }
  return {
    async toggle(){
      if(disposed)return false;
      const token=++generation;
      desiredEnabled=!desiredEnabled;
      clearSuspendTimer();
      try{
        if(desiredEnabled&&!context)initialize();
      }catch(error){
        desiredEnabled=false;generation++;muteNow();
        context?.close().catch(()=>{});context=undefined;master=undefined;
        notify();throw error;
      }
      notify();
      if(!desiredEnabled){
        if(audible&&!hidden){
          audible=false;
          master.gain.cancelScheduledValues(context.currentTime);
          master.gain.setTargetAtTime(0,context.currentTime,.06);
          // Retain the existing fade-out timer; every new intent cancels it.
          suspendTimer=setTimeout(()=>{
            suspendTimer=undefined;
            if(!disposed&&!desiredEnabled&&token===generation){muteNow();synchronize().catch(()=>{});}
          },300);
          return false;
        }
        muteNow();
      }
      return synchronize();
    },
    update(state){
      if(!desiredEnabled||hidden||!audible||!context)return;
      const now=context.currentTime;
      rumbleGain.gain.setTargetAtTime(.016+.04*state.heat,now,.1);
      airGain.gain.setTargetAtTime(.006+.055*state.heat,now,.1);
      waterGain.gain.setTargetAtTime(.045*state.water,now,.1);
    },
    strike(strength=1){
      if(!desiredEnabled||hidden||!audible||!context)return;
      const now=context.currentTime,hit=context.createOscillator(),gain=context.createGain();
      hit.type='sine';hit.frequency.setValueAtTime(185,now);hit.frequency.exponentialRampToValueAtTime(48,now+.24);
      gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.14*strength,now+.004);gain.gain.exponentialRampToValueAtTime(.0001,now+.5);
      hit.connect(gain).connect(master);hit.start(now);hit.stop(now+.55);hit.onended=()=>{hit.disconnect();gain.disconnect();};
    },
    async setHidden(value){
      if(disposed||hidden===Boolean(value))return;
      hidden=Boolean(value);generation++;clearSuspendTimer();
      if(hidden)muteNow();
      if(context)return synchronize();
    },
    get enabled(){return desiredEnabled;},
    get status(){return !context?'uninitialized':context.state;},
    subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
    dispose(){disposed=true;generation++;desiredEnabled=false;clearSuspendTimer();muteNow();listeners.clear();if(context)context.close().catch(()=>{});}
  };
}
