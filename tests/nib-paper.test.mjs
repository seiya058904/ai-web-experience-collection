import test from 'node:test';
import assert from 'node:assert/strict';
import { PaperScenes } from '../experiences/nib/src/paper-scenes.js';
const viewports=[[390,844],[768,1024],[1440,900],[1920,1080],[2560,1440],[3840,2160]];
function make(w,h){const paper=new PaperScenes();Object.assign(paper,{w,h,mobile:w<=800});return paper;}
function pose(paper,q){return paper.geometry({w:paper.w,h:paper.h,mobile:paper.mobile,q});}
function finite(value){if(value&&typeof value==='object')for(const item of Object.values(value))finite(item);else assert.ok(Number.isFinite(value));}
test('all authored paper phases have finite geometry and a positive camera scale at six viewport sizes',()=>{
 for(const [w,h] of viewports){const paper=make(w,h);for(let i=0;i<=800;i++){const g=pose(paper,6+i*.005);finite(g);assert.ok(g.camera.scale>=1&&g.camera.scale<=7.2);assert.ok(g.end>=0&&g.end<=1);}}
});
test('the nib contact follows the same deposited stroke endpoint before lifting',()=>{
 for(const [w,h] of viewports){const paper=make(w,h);for(let i=0;i<=540;i++){const g=pose(paper,6.315+i*.005);assert.equal(g.lift,0);assert.equal(g.tip.x,g.point.x);assert.equal(g.tip.y,g.point.y);}}
});
test('the deposited stroke starts at contact, holds during absorption, and completes before Trace',()=>{
 const paper=make(1440,900);assert.equal(pose(paper,6.315).end,0);assert.equal(pose(paper,6.84).end,.285);assert.equal(pose(paper,8).end,.285);assert.equal(pose(paper,8.94).end,1);assert.equal(pose(paper,9.99).end,1);
 let previous=0;for(let i=0;i<=1000;i++){const end=pose(paper,6+i*.004).end;assert.ok(end>=previous);previous=end;}
});
test('camera magnification preserves the shared endpoint in paper coordinates during absorption',()=>{
 for(const [w,h] of viewports){const paper=make(w,h);const points=[6.84,7.05,7.2,7.65,8].map(q=>{const g=pose(paper,q);return {x:(g.point.x-g.camera.x)/g.camera.scale,y:(g.point.y-g.camera.y)/g.camera.scale};});for(const point of points){assert.ok(Math.abs(point.x-points[0].x)<1e-9);assert.ok(Math.abs(point.y-points[0].y)<1e-9);}}
});
test('reversing and arbitrary resampling cannot alter an authored paper pose',()=>{
 for(const [w,h] of viewports){const paper=make(w,h);const phases=[6,6.25,6.315,6.84,7,7.17,7.65,8,8.15,8.94,9,9.42,9.99];const before=phases.map(q=>pose(paper,q));for(const q of [...phases].reverse())pose(paper,q);for(const q of [9.8,6.91,8.44,7.31,6.06])pose(paper,q);assert.deepEqual(phases.map(q=>pose(paper,q)),before);}
});
test('Contact, Absorb, Write and Trace chapter handoffs keep continuous geometry',()=>{
 for(const [w,h] of viewports){const paper=make(w,h);for(const boundary of [7,8,9]){const a=pose(paper,boundary-1e-7),b=pose(paper,boundary+1e-7);assert.ok(Math.hypot(a.point.x-b.point.x,a.point.y-b.point.y)<.01);assert.ok(Math.hypot(a.tip.x-b.tip.x,a.tip.y-b.tip.y)<.01);assert.ok(Math.abs(a.camera.scale-b.camera.scale)<1e-5);assert.ok(Math.abs(a.end-b.end)<1e-6);}}
});
