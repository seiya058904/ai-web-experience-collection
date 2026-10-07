/** An original, opt-in sound texture. No media, samples, microphones or network. */
export default class Soundscape {
  constructor(){this.disposed=false;this.context=null;this.enabled=false;this.lastUpdate=0;}
  async toggle(){
    if(this.disposed)return false;
    if(!this.context)this.create();
    const c=this.context;
    if(!this.enabled){await c.resume();if(this.disposed||c.state==='closed')return false;this.enabled=true;this.master.gain.setTargetAtTime(.055,c.currentTime,.3);}
    else{this.enabled=false;this.master.gain.setTargetAtTime(0,c.currentTime,.12);}
    if(document.hidden)await this.suspend();
    return this.enabled;
  }
  create(){
    if(this.disposed)return;
    const AudioCtx=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtx)throw new Error('Web Audio is unavailable');
    const c=this.context=new AudioCtx({latencyHint:'interactive'});
    this.master=c.createGain();this.master.gain.value=0;this.master.connect(c.destination);
    this.pump=c.createOscillator();this.pump.type='sine';this.pump.frequency.value=52;
    this.pumpGain=c.createGain();this.pumpGain.gain.value=.15;this.pump.connect(this.pumpGain);this.pumpGain.connect(this.master);this.pump.start();
    this.harmonic=c.createOscillator();this.harmonic.type='sine';this.harmonic.frequency.value=104;
    this.harmonicGain=c.createGain();this.harmonicGain.gain.value=.025;this.harmonic.connect(this.harmonicGain);this.harmonicGain.connect(this.master);this.harmonic.start();
    const n=c.sampleRate*6,b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);let seed=90210,last=0;
    for(let i=0;i<n;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const white=(seed/4294967296)*2-1;last=(last+.02*white)/1.02;d[i]=last*3.5;}
    this.noise=c.createBufferSource();this.noise.buffer=b;this.noise.loop=true;
    this.filter=c.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=330;this.filter.Q.value=.5;
    this.noiseGain=c.createGain();this.noiseGain.gain.value=.14;this.noise.connect(this.filter);this.filter.connect(this.noiseGain);this.noiseGain.connect(this.master);this.noise.start();
  }
  update(stage,time){
    if(this.disposed||!this.context||!this.enabled||time-this.lastUpdate<.12)return;this.lastUpdate=time;
    const c=this.context,t=c.currentTime;
    const pressure=Math.max(0,1-Math.abs(stage-4.6)/2.5),stream=Math.max(0,1-Math.abs(stage-8)/1.1);
    this.pump.frequency.setTargetAtTime(50+pressure*8,t,.2);this.harmonic.frequency.setTargetAtTime(100+pressure*16,t,.2);
    this.pumpGain.gain.setTargetAtTime(.025+pressure*.27,t,.3);this.noiseGain.gain.setTargetAtTime(.05+pressure*.12+stream*.32,t,.35);
    this.filter.frequency.setTargetAtTime(200+pressure*850+stream*1400,t,.3);
  }
  async suspend(){if(this.context&&this.context.state==='running')await this.context.suspend();}
  async resume(){if(!this.disposed&&!document.hidden&&this.enabled&&this.context?.state==='suspended')await this.context.resume();}
  dispose(){if(this.disposed)return;this.disposed=true;this.enabled=false;this.context?.close().catch(()=>{});}
}
