import test from 'node:test';
import assert from 'node:assert/strict';
import { createEngine } from '../experiences/thrust/src/engine.js';
import { createBlade } from '../experiences/thrust/src/blade.js';
import { createAircraft } from '../experiences/thrust/src/flight.js';

test('original machine maintains rotor/stator roles and reverses its exploded pose',()=>{
  const engine=createEngine({quality:'low'});
  assert.equal(engine.stats.fanBlades,22);assert.equal(engine.stats.compressorRotors,12);assert.equal(engine.stats.turbineRotors,7);
  const pose=()=>{const out=[];engine.group.traverse(o=>out.push([o.name,...o.position.toArray(),...o.rotation.toArray(),o.visible]));return out;};
  engine.update(4,{cutaway:0,explode:0});const initial=pose();
  engine.update(4,{cutaway:1,explode:1});engine.update(4,{cutaway:0,explode:0});assert.deepEqual(pose(),initial);
  const stators=[];engine.group.traverse(o=>{if(/Stationary|stator/i.test(o.name))stators.push([o,o.rotation.z]);});
  engine.update(10);assert.ok(stators.length>=19);for(const[o,z]of stators)assert.equal(o.rotation.z,z);
  engine.dispose();
});
test('macro and airliner geometry contain no invalid vertex or normal coordinates',()=>{
  for(const object of [createBlade(),createAircraft()]){
    object.group.traverse(o=>{if(o.geometry)for(const name of ['position','normal']){const a=o.geometry.getAttribute(name);if(a)for(const v of a.array)assert.ok(Number.isFinite(v));}});
    object.dispose();
  }
});
