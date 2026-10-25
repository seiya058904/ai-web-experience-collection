import { Flock, DEFAULT_RULES, STEP } from './model.js';
/** Separate live time from reversible observation time. */
export class FieldSession {
  constructor(initial,stored=null,reduced=false) {
    this.initial=structuredClone(initial);this.initial.paused=reduced;
    this.flock=new Flock({count:initial.count,seed:initial.seed,state:this.initial});
    this.accumulator=0;this.active=false;this.entered=false;this.transitions=0;
    if(stored) {try{this.flock.restore(stored);this.entered=true;}catch{/* Invalid storage uses the known checkpoint. */}}
    if(reduced)this.flock.paused=true;
    this.saved=this.flock.snapshot();
  }
  enter() { if(this.active)return; this.flock.restore(this.saved);this.accumulator=0;this.active=true;this.entered=true;this.transitions++; }
  leave() { if(!this.active)return;this.saved=this.flock.snapshot();this.active=false;this.accumulator=0; }
  checkpoint(){this.saved=this.flock.snapshot();return this.saved;}
  advance(delta,blocked=false) {
    if(!this.active||this.flock.paused||blocked){this.accumulator=0;return 0;}
    this.accumulator+=Math.min(Math.max(delta,0),STEP*3);
    let steps=0;
    while(this.accumulator>=STEP&&steps<3){this.flock.step();this.accumulator-=STEP;steps++;}
    return steps;
  }
  reset(){const paused=this.flock.paused;this.flock.restore(this.initial);this.flock.paused=paused;this.flock.setRules(DEFAULT_RULES);this.accumulator=0;this.checkpoint();}
  hold(){this.flock.paused=!this.flock.paused;this.accumulator=0;this.checkpoint();}
  stepOnce(){this.flock.step();this.checkpoint();}
}
