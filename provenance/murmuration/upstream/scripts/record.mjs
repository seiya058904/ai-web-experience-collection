import fs from 'node:fs';
import { gzipSync } from 'node:zlib';
import { Flock, digest } from '../src/model.js';
import { pack, unpack } from '../src/recording.js';
const base=new URL('../',import.meta.url);
const count=2400,seed=8419,warmup=420,steps=480,every=4;
const flock=new Flock({count,seed});
for(let t=0;t<warmup;t++)flock.step();
const q=new Int16Array(count*6);pack(flock.data,q);unpack(q,flock.data);
let selected=0,best=Infinity;
for(let i=0;i<count;i++) {const j=i*6,d=flock.data,score=Math.abs(d[j]+17)*.5+Math.abs(d[j+1]+10)*.5+Math.abs(d[j+2]-12)*4;if(score<best){best=score;selected=i;}}
const initial=flock.snapshot();
const peers=flock.neighbors(selected);
const perturbation={x:flock.data[selected*6],y:flock.data[selected*6+1],radius:5.5,turn:1.85};
const meta={version:1,count,seed,warmup,steps,every,frames:steps/every+1,selected,peers,perturbation,positionScale:64,velocityScale:512};
const baseline=new Flock({count,seed,state:initial});
const recording=new Int16Array(meta.frames*count*6);pack(flock.data,recording);
flock.queueRipple(perturbation.x,perturbation.y,perturbation.radius,perturbation.turn);
let slot=1;const propagation=[];
for(let t=1;t<=steps;t++) {
 flock.step();baseline.step();
 if(t%every===0){pack(flock.data,recording,slot++*count*6);}
 if([1,30,60,120,240,480].includes(t)) {
  let changed=0;
  for(let i=0;i<count;i++) { const j=i*6+3; if(Math.hypot(flock.data[j]-baseline.data[j],flock.data[j+1]-baseline.data[j+1],flock.data[j+2]-baseline.data[j+2])>0.4)changed++; }
  propagation.push({ticksAfterPerturbation:t,changedHeadings:changed,thresholdVelocityDifference:0.4});
 }
}
const initialRecord={...initial,data:Array.from(initial.data).map(v=>Math.round(v*65536)/65536),meta};
fs.writeFileSync(new URL('src/hero.json',base),JSON.stringify(initialRecord));
fs.writeFileSync(new URL('public/records/flight.bin.gz',base),gzipSync(Buffer.from(recording.buffer),{level:9}));
fs.writeFileSync(new URL('public/records/meta.json',base),JSON.stringify(meta,null,2));
fs.writeFileSync(new URL('docs/evidence/recording-evidence.json',base),JSON.stringify({meta,propagation,initialDigest:digest(initial.data),finalDigest:digest(unpack(recording,new Float32Array(count*6),(meta.frames-1)*count*6)),uncompressedBytes:recording.byteLength,compressedBytes:fs.statSync(new URL('public/records/flight.bin.gz',base)).size},null,2));
console.log(JSON.stringify({meta,propagation,compressedBytes:fs.statSync(new URL('public/records/flight.bin.gz',base)).size},null,2));
