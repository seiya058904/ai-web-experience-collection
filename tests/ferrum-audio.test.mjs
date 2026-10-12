import test from 'node:test';
import assert from 'node:assert/strict';
import { createSoundscape } from '../experiences/ferrum/src/audio.js';

function deferred(){
  let resolve,reject;
  const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
  return {promise,resolve,reject};
}

async function until(predicate){
  for(let i=0;i<30;i++){
    if(predicate())return;
    await Promise.resolve();
  }
  assert.ok(predicate(),'audio operation did not reach its expected state');
}

function fixture(t,{deferResume=false,deferSuspend=false}={}){
  const contexts=[];
  const previousWindow=globalThis.window;
  class Parameter{
    value=0;events=[];
    setTargetAtTime(value){this.value=value;this.events.push({type:'target',value});}
    setValueAtTime(value){this.value=value;this.events.push({type:'value',value});}
    cancelScheduledValues(){}
    exponentialRampToValueAtTime(){}
    linearRampToValueAtTime(){}
  }
  class AudioNode{
    gain=new Parameter();frequency=new Parameter();Q=new Parameter();
    connect(next){return next;}
    start(){}stop(){}disconnect(){}
  }
  class FakeAudioContext{
    sampleRate=16;currentTime=0;state='suspended';destination={};
    gains=[];resumeRequests=[];suspendRequests=[];resumeCalls=0;suspendCalls=0;oscillators=0;
    constructor(){contexts.push(this);}
    createGain(){const node=new AudioNode();this.gains.push(node);return node;}
    createBuffer(channels,size){return {getChannelData:()=>new Float32Array(size)};}
    createBufferSource(){return new AudioNode();}
    createBiquadFilter(){return new AudioNode();}
    createOscillator(){this.oscillators++;return new AudioNode();}
    resume(){
      this.resumeCalls++;
      if(!deferResume){this.state='running';return Promise.resolve();}
      const request=deferred();this.resumeRequests.push(request);
      return request.promise.then(()=>{this.state='running';});
    }
    suspend(){
      this.suspendCalls++;
      if(!deferSuspend){this.state='suspended';return Promise.resolve();}
      const request=deferred();this.suspendRequests.push(request);
      return request.promise.then(()=>{this.state='suspended';});
    }
    async close(){this.state='closed';}
  }
  globalThis.window={AudioContext:FakeAudioContext};
  const sound=createSoundscape();
  t.after(()=>{sound.dispose();if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;});
  return {sound,contexts,master:()=>contexts[0].gains[0].gain};
}

test('visibility, updates and strikes do not create audio before a click',async t=>{
  const {sound,contexts}=fixture(t);
  await sound.setHidden(true);await sound.setHidden(false);
  sound.update({heat:1,water:1});sound.strike();
  assert.equal(contexts.length,0);
  assert.equal(sound.enabled,false);
  assert.equal(sound.status,'uninitialized');
});

test('a second click cancels a pending first resume without ever unmuting',async t=>{
  const {sound,contexts,master}=fixture(t,{deferResume:true});
  const on=sound.toggle();
  assert.equal(sound.enabled,true,'click intent is synchronous');
  await until(()=>contexts[0].resumeRequests.length===1);
  const off=sound.toggle();
  assert.equal(sound.enabled,false,'the second click reverses the pending intent');
  assert.equal(master().value,0);
  contexts[0].resumeRequests[0].resolve();
  await Promise.all([on,off]);
  assert.equal(sound.enabled,false);
  assert.equal(sound.status,'suspended');
  assert.equal(master().events.some(event=>event.value>0),false);
});

test('hiding during a pending resume keeps gain zero and pauses the context',async t=>{
  const {sound,contexts,master}=fixture(t,{deferResume:true});
  const on=sound.toggle();
  await until(()=>contexts[0].resumeRequests.length===1);
  const hidden=sound.setHidden(true);
  assert.equal(master().value,0,'background muting does not wait for resume');
  contexts[0].resumeRequests[0].resolve();
  await Promise.all([on,hidden]);
  assert.equal(sound.enabled,true,'backgrounding preserves the user preference');
  assert.equal(sound.status,'suspended');
  assert.equal(master().events.some(event=>event.value>0),false);
  const oscillatorCount=contexts[0].oscillators;
  sound.strike();assert.equal(contexts[0].oscillators,oscillatorCount);
  const visible=sound.setHidden(false);
  await until(()=>contexts[0].resumeRequests.length===2);
  assert.equal(master().value,0,'foreground audio still waits for resume');
  contexts[0].resumeRequests[1].resolve();await visible;
  assert.equal(sound.status,'running');assert.equal(master().value,.45);
});

test('normal on/off publishes state, fades out and then suspends',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  const {sound,contexts,master}=fixture(t);
  const notifications=[];sound.subscribe(value=>notifications.push(value));
  assert.equal(await sound.toggle(),true);
  assert.equal(sound.status,'running');assert.equal(master().value,.45);
  assert.equal(await sound.toggle(),false);
  assert.equal(master().events.at(-1).value,0);
  t.mock.timers.tick(300);
  await until(()=>sound.status==='suspended');
  assert.deepEqual(notifications,[true,false]);
  assert.equal(contexts[0].suspendCalls,1);
});

test('a failed current resume clears the intent and leaves a later click retryable',async t=>{
  const {sound,contexts,master}=fixture(t,{deferResume:true});
  const notifications=[];sound.subscribe(value=>notifications.push(value));
  const on=sound.toggle();
  const rejected=assert.rejects(on,/resume denied/);
  await until(()=>contexts[0].resumeRequests.length===1);
  contexts[0].resumeRequests[0].reject(new Error('resume denied'));await rejected;
  assert.equal(sound.enabled,false);assert.equal(sound.status,'suspended');
  assert.equal(master().value,0);assert.deepEqual(notifications,[true,false]);
  const retry=sound.toggle();
  await until(()=>contexts[0].resumeRequests.length===2);
  contexts[0].resumeRequests[1].resolve();await retry;
  assert.equal(sound.enabled,true);assert.equal(master().value,.45);
});

test('a stale failed resume cannot erase a newer on intent',async t=>{
  const {sound,contexts,master}=fixture(t,{deferResume:true});
  const first=sound.toggle();
  await until(()=>contexts[0].resumeRequests.length===1);
  const off=sound.toggle();const latest=sound.toggle();
  contexts[0].resumeRequests[0].reject(new Error('stale resume denied'));
  await until(()=>contexts[0].resumeRequests.length===2);
  assert.equal(sound.enabled,true);assert.equal(master().value,0);
  contexts[0].resumeRequests[1].resolve();
  await until(()=>contexts[0].resumeRequests.length===3);
  contexts[0].resumeRequests[2].resolve();
  await Promise.all([first,off,latest]);
  assert.equal(sound.enabled,true);assert.equal(sound.status,'running');assert.equal(master().value,.45);
});

test('a new on request waits for an already pending suspend before resuming',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  const {sound,contexts,master}=fixture(t,{deferSuspend:true});
  await sound.toggle();await sound.toggle();
  t.mock.timers.tick(300);
  await until(()=>contexts[0].suspendRequests.length===1);
  const on=sound.toggle();
  assert.equal(sound.enabled,true);assert.equal(master().value,0);
  assert.equal(contexts[0].resumeCalls,1,'resume cannot overtake the pending suspend');
  contexts[0].suspendRequests[0].resolve();await on;
  assert.equal(contexts[0].resumeCalls,2);
  assert.equal(sound.status,'running');assert.equal(master().value,.45);
});
