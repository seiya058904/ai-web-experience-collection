import test from 'node:test';
import assert from 'node:assert/strict';
import { SCENES, layout, resolve } from '../experiences/grid/src/scenes.ts';

test('Persistent Variable controls cross the chapter boundary continuously and reconstruct on reverse', () => {
  for (const view of [{w:343,h:646,mobile:true},{w:1332,h:711,mobile:false}]) {
    const states = SCENES.map((_, index) => layout(index, view));
    for (const overrides of [{wght:1000,wdth:151,slnt:-10,opsz:144},{wdth:151}]) {
      const points = [9-1e-6,9,9+1e-6];
      const forward = points.map(point => resolve(point,states,overrides));
      const middle = forward[1];
      for (const [axis,value] of Object.entries(overrides)) assert.equal(middle.axes[axis],value);
      for (const state of forward) {
        for (const axis of Object.keys(middle.axes)) assert.ok(
          Math.abs(state.axes[axis]-middle.axes[axis]) < 1e-5,
          `${view.w}px / ${axis}: the incoming target retains the user's axis value`,
        );
        assert.ok(Math.abs(state.parts.title.size-middle.parts.title.size)<1e-5,
          'The incoming target also uses the fitted Variable heading size');
      }
      // Intervening forward travel must not introduce history-dependent state.
      resolve(9.25,states,overrides);
      for (let index=points.length-1;index>=0;index--) {
        assert.deepEqual(resolve(points[index],states,overrides),forward[index],
          `Reverse reconstruction at p=${points[index]} is identical`);
      }
    }
  }
});

test('The reported phone Basel overshoot keeps the reading action inside while display tension remains', () => {
  // Actual phone stage dimensions of the reported p=2.8 clipping case.
  const view = {w:343,h:646,mobile:true};
  const states = SCENES.map((_,index)=>layout(index,view));
  const state = resolve(2.8,states);
  const action = state.parts.action;
  assert.ok(action.x>=0,'The action starts inside the stage, preserving its first letter');
  assert.ok(action.x+action.w<=view.w,'The whole action remains in the reading area');
  assert.ok(state.parts.title.rotate<states[3].parts.title.rotate-.01,
    'The Basel display heading still briefly rotates beyond its settled angle');
  assert.ok(state.parts.title.x<states[3].parts.title.x,
    'Display motion keeps its authored overshoot instead of globally clamping the easing');
});
