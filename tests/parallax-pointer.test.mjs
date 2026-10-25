import test from 'node:test';
import assert from 'node:assert/strict';
import { pointerResponse } from '../experiences/parallax/src/pointer.js';

test('Pointer response agrees after equal elapsed time at 60, 120 and 144 Hz', () => {
  const values = [60,120,144].map(hz => {
    let position=0;
    for(let i=0;i<hz/2;i++) position+=(1-position)*pointerResponse(1000/hz);
    return position;
  });
  assert.ok(Math.abs(pointerResponse(1000/60)-.135)<1e-12);
  for(const value of values) assert.ok(Math.abs(value-values[0])<1e-12);
});
test('Pointer response bounds invalid and suspended-frame intervals', () => {
  for(const delta of [NaN,Infinity,-1,0])assert.equal(pointerResponse(delta),0);
  assert.equal(pointerResponse(60000),pointerResponse(50));
  assert.ok(pointerResponse(50)>0&&pointerResponse(50)<1);
});
