import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createHandoff, lightingForState } from '../experiences/dose/src/handoff.js';

function pair() {
  const parentA = new THREE.Group(), parentB = new THREE.Group();
  parentA.position.set(2, -1, .3); parentA.rotation.set(.24, -.13, 0); parentA.scale.setScalar(.6);
  parentB.position.set(3, -2, 0); parentB.scale.setScalar(1.8);
  const a = new THREE.Object3D(), b = new THREE.Object3D();
  a.position.set(.1, .5, 0); a.rotation.set(.75, -.09, .5); a.scale.setScalar(.9);
  b.rotation.set(.58, -.12, .15);
  parentA.add(a); parentB.add(b); a.updateWorldMatrix(true, false); b.updateWorldMatrix(true, false);
  return { a, b, start: a.matrixWorld.clone(), end: b.matrixWorld.clone() };
}
const close = (a,b) => a.elements.every((value,i)=>Math.abs(value-b.elements[i])<1e-9);
test('tablet representations share a registered frame across transformed parents',()=>{
  for(const t of [0,.15,.5,.85,1]) {
    const {a,b,start,end}=pair();createHandoff()(a,b,t);
    assert.ok(close(a.matrixWorld,b.matrixWorld));
    if(t===0)assert.ok(close(a.matrixWorld,start));
    if(t===1)assert.ok(close(b.matrixWorld,end));
  }
});
test('arbitrary forward and reverse handoff samples reconstruct the same pose',()=>{
  const samples=[.8,.2,.5,.9,.5];const matrices=samples.map(t=>{const {a,b}=pair();createHandoff()(a,b,t);return a.matrixWorld.clone()});
  assert.ok(close(matrices[2],matrices[4]));
});
test('macro and evidence lighting meet every next chapter without a step',()=>{
  for(let scene=0;scene<6;scene++)assert.deepEqual(lightingForState(scene,1),lightingForState(scene+1,0));
  assert.deepEqual(lightingForState(6,0),lightingForState(6,1));
});
