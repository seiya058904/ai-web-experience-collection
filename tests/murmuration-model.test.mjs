import nodeTest from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { Flock, PRESETS, digest, STEP } from '../experiences/murmuration/src/model.js';
import { FieldSession } from '../experiences/murmuration/src/session.js';
import { sampleRecord, pack } from '../experiences/murmuration/src/recording.js';

const test = nodeTest;

test('same seed, ticks and input log produce identical state',()=>{
 const a=new Flock({count:320,seed:42}),b=new Flock({count:320,seed:42});
 for(let tick=0;tick<240;tick++){
  for(const f of [a,b]){if(tick===35)f.setRules(PRESETS.Cohere);if(tick===80)f.queueRipple(-50,0,30,1.2);if(tick===150)f.setRules(PRESETS.Scatter);f.step();}
 }
 assert.deepEqual(a.data,b.data);assert.equal(a.tick,b.tick);assert.equal(digest(a.data),digest(b.data));
});
for(const key of ['space','heading','together'])test(`${key} changes trajectories, not just control text`,()=>{
 const a=new Flock({count:400,seed:714}),b=new Flock({count:400,seed:714});b.setRules({[key]:2.5});
 for(let t=0;t<160;t++){a.step();b.step();}
 let moved=0;for(let i=0;i<a.count;i++){const j=i*6;if(Math.hypot(a.data[j]-b.data[j],a.data[j+1]-b.data[j+1],a.data[j+2]-b.data[j+2])>.05)moved++;}
 assert.ok(moved>200,`${moved} changed agents`);
});
test('checkpoint includes speeds, rules, pause and pending ripple; a different constructor seed resumes exactly',()=>{
 const a=new Flock({count:280,seed:18});for(let t=0;t<50;t++)a.step();a.setRules(PRESETS.Scatter);a.paused=true;a.queueRipple(0,0,30,.8);
 const b=new Flock({count:280,seed:9999,state:a.snapshot()});assert.deepEqual(a.snapshot(),b.snapshot());a.step();b.step();assert.deepEqual(a.data,b.data);
});
test('all presets and slider extremes remain finite and within the disclosed soft bounds',()=>{
 for(const rules of [...Object.values(PRESETS),{space:0,heading:0,together:0},{space:2.5,heading:2.5,together:2.5}]){
  const f=new Flock({count:2400,seed:412});f.setRules(rules);
  for(let t=0;t<600;t++){if(t%160===0)f.queueRipple(100,20,40,1.8);f.step();}
  assert.ok(f.data.every(Number.isFinite));
  for(let i=0;i<f.count;i++){const j=i*6;assert.ok(Math.abs(f.data[j])<210);assert.ok(Math.abs(f.data[j+1])<120);assert.ok(Math.abs(f.data[j+2])<75);assert.ok(Math.hypot(...f.data.slice(j+3,j+6))<24);}
 }
});
test('spatial queries are local, bounded and exclude the subject',()=>{
 const f=new Flock({count:500,seed:4});f.refreshNeighbors();
 for(let i=0;i<f.count;i++){
  const peers=f.peers.slice(i*7,i*7+7).filter(p=>p>=0);assert.ok(peers.length<=7);assert.ok(!peers.includes(i));
  for(const p of peers){const j=i*6,q=p*6;assert.ok(Math.hypot(f.data[j]-f.data[q],f.data[j+1]-f.data[q+1],f.data[j+2]-f.data[q+2])<25.001);}
 }
});
test('five live exits and entries restore exact state without resource growth',()=>{
 const initial=new Flock({count:200,seed:13}).snapshot(),s=new FieldSession(initial);const identity=s.flock;
 for(let i=0;i<5;i++){
  s.enter();s.flock.setRules({space:i*.4});s.advance(STEP*2);s.leave();const saved=s.saved;
  s.advance(20);assert.deepEqual(s.flock.snapshot(),saved);s.enter();assert.deepEqual(s.flock.snapshot(),saved);assert.equal(s.flock,identity);s.leave();
 }
 assert.equal(s.flock.count,200);
});
test('held edits do not move agents; explicit step and reset have distinct semantics',()=>{
 const s=new FieldSession(new Flock({count:220,seed:13}).snapshot());s.enter();s.hold();const held=s.flock.data.slice();
 s.flock.setRules(PRESETS.Cohere);s.advance(5);assert.deepEqual(s.flock.data,held);s.stepOnce();assert.notDeepEqual(s.flock.data,held);
 s.reset();assert.deepEqual(s.flock.data,new Float32Array(s.initial.data));assert.equal(s.flock.paused,true);assert.deepEqual(s.flock.rules,PRESETS.Drift);
});
test('blocked and background time never catches up; compensation is at most three steps',()=>{
 const s=new FieldSession(new Flock({count:140,seed:1}).snapshot());s.enter();const t=s.flock.tick;
 s.advance(100,true);assert.equal(s.flock.tick,t);assert.equal(s.advance(100),3);assert.equal(s.flock.tick,t+3);
});
test('reduced motion starts held and can be stepped explicitly',()=>{
 const s=new FieldSession(new Flock({count:140}).snapshot(),null,true);s.enter();s.advance(10);assert.equal(s.flock.tick,0);s.stepOnce();assert.equal(s.flock.tick,1);
});
test('arbitrary forward/reverse recording samples preserve identity and quantized endpoint continuity',()=>{
 const h=JSON.parse(fs.readFileSync(new URL('../experiences/murmuration/src/hero.json',import.meta.url))),bytes=gunzipSync(fs.readFileSync(new URL('../public/murmuration/records/flight.bin.gz',import.meta.url)));
 const r=new Int16Array(bytes.buffer,bytes.byteOffset,bytes.byteLength/2),out=new Float32Array(h.count*6),expected=new Map();
 for(const p of [0,.13,.25,.5,.75,.9,1])expected.set(p,digest(sampleRecord(r,h.meta,p,out)));
 for(const p of [1,.75,.5,0,.9,.13,.25])assert.equal(digest(sampleRecord(r,h.meta,p,out)),expected.get(p));
 assert.deepEqual(Array.from(sampleRecord(r,h.meta,0,out)),h.data);
 let maxDelta=0;const before=sampleRecord(r,h.meta,.52,new Float32Array(out.length));sampleRecord(r,h.meta,.5201,out);
 for(let i=0;i<h.count;i++)maxDelta=Math.max(maxDelta,Math.hypot(out[i*6]-before[i*6],out[i*6+1]-before[i*6+1],out[i*6+2]-before[i*6+2]));
 assert.ok(maxDelta<.04,`subframe movement ${maxDelta}`);
});
test('network-failure reconstruction matches the shipped record byte for byte',()=>{
 const h=JSON.parse(fs.readFileSync(new URL('../experiences/murmuration/src/hero.json',import.meta.url))),m=h.meta;
 const f=new Flock({count:m.count,seed:m.seed,state:h}),out=new Int16Array(m.frames*m.count*6);pack(f.data,out);
 f.queueRipple(m.perturbation.x,m.perturbation.y,m.perturbation.radius,m.perturbation.turn);let frame=1;
 for(let t=1;t<=m.steps;t++){f.step();if(t%m.every===0)pack(f.data,out,frame++*m.count*6);}
 const expected=gunzipSync(fs.readFileSync(new URL('../public/murmuration/records/flight.bin.gz',import.meta.url)));
 assert.deepEqual(Buffer.from(out.buffer),expected);
});
