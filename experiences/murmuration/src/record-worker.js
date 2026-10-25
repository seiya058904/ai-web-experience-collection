import { Flock } from './model.js';
import { pack } from './recording.js';
self.onmessage=({data:initial})=>{
  const m=initial.meta,flock=new Flock({count:m.count,seed:m.seed,state:initial});
  const buffer=new Int16Array(m.frames*m.count*6);pack(flock.data,buffer);
  const r=m.perturbation;flock.queueRipple(r.x,r.y,r.radius,r.turn);
  let frame=1;
  for(let t=1;t<=m.steps;t++){flock.step();if(t%m.every===0)pack(flock.data,buffer,frame++*m.count*6);}
  self.postMessage(buffer.buffer,[buffer.buffer]);
};
