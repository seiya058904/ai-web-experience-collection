/** Optional, locally synthesized wind. Never needed for understanding. */
export class WindAudio {
  private context:AudioContext|null=null;private gain:GainNode|null=null;private source:AudioBufferSourceNode|null=null;
  enabled=false;
  async toggle(){
    if(!this.context){
      this.context=new AudioContext();const ctx=this.context;const buffer=ctx.createBuffer(1,ctx.sampleRate*4,ctx.sampleRate);const data=buffer.getChannelData(0);let previous=0;
      for(let i=0;i<data.length;i++){previous=(previous+(Math.random()*2-1)*.018)/1.02;data[i]=previous*4;}
      const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;
      const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=430;filter.Q.value=.4;
      const gain=ctx.createGain();gain.gain.value=0;source.connect(filter);filter.connect(gain);gain.connect(ctx.destination);source.start();this.gain=gain;this.source=source;
    }
    await this.context.resume();this.enabled=!this.enabled;this.update(false,0);return this.enabled;
  }
  update(hidden:boolean,finale:number){if(!this.context||!this.gain)return;const target=this.enabled&&!hidden?.17*(1-finale*.35):0;this.gain.gain.setTargetAtTime(target,this.context.currentTime,.35);}
  dispose(){this.source?.stop();void this.context?.close();this.source=null;this.context=null;}
}
