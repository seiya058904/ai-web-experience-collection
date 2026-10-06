import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, chapterAt, sceneState, sampleShot, mobileRoll } from '../experiences/thrust/src/story.js';

test('all ten chapters remain reachable, including restored bottom positions',()=>{
  const bounds=CHAPTERS.map((_,i)=>({top:i*1800,span:1800}));
  for(let i=0;i<10;i++) assert.equal(Math.floor(chapterAt(i*1800+900,bounds)),i);
  assert.equal(chapterAt(-100,bounds),0); assert.equal(chapterAt(999999,bounds),9.999);
});
test('continuous camera and mobile framing do not jump at chapter boundaries',()=>{
  for(const mobile of [false,true])for(let i=1;i<10;i++){
    const a=sampleShot(i-0.00001,mobile),b=sampleShot(i+0.00001,mobile);
    for(const key of ['pos','target'])for(let j=0;j<3;j++)assert.ok(Math.abs(a[key][j]-b[key][j])<.05,`${mobile} ${i} ${key}`);
    assert.ok(Math.abs(a.fov-b.fov)<.01);
    assert.ok(Math.abs(mobileRoll(i-.00001)-mobileRoll(i+.00001))<.001);
  }
});
test('reversal reproduces all mechanical scene states exactly',()=>{
  const samples=Array.from({length:301},(_,i)=>i/300*9.999);
  const first=samples.map(sceneState);
  samples.toReversed().forEach(p=>sceneState(p));
  samples.forEach((p,i)=>assert.deepEqual(sceneState(p),first[i]));
});
test('all scene fields and camera coordinates are finite and bounded',()=>{
  for(let p=0;p<10;p+=.013){
    const state=sceneState(p);
    for(const key of ['cutaway','heat','energy','explode','blade','bladeCut','sky','aircraft','flow','pressure','temperature'])assert.ok(Number.isFinite(state[key])&&state[key]>=0&&state[key]<=1,key);
    for(const mobile of [false,true]){const shot=sampleShot(p,mobile);assert.ok([...shot.pos,...shot.target,shot.fov].every(Number.isFinite));assert.ok(shot.fov>20&&shot.fov<110);}
  }
});
test('combustion heats the core without falsely increasing total pressure',()=>{
  const entry=sceneState(4.02),exit=sceneState(4.72);
  assert.ok(exit.temperature>entry.temperature);assert.ok(exit.pressure<entry.pressure);
  assert.ok(sceneState(5.7).energy>.8);assert.equal(sceneState(9.3).flow,0);
});
