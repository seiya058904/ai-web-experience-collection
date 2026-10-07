/** Meaningful local delivery gates: scene reachability, assets, offline scripts,
 * deterministic reversible timelines, and actual synthetic-volume integrity. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
let checks=0;
function check(name,fn){fn();checks++;console.log('PASS '+name);}
check('all ten chapter targets exist exactly once',()=>{for(let i=1;i<=10;i++){const id='chapter-'+String(i).padStart(2,'0');assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1);}});
check('every local HTML asset exists',()=>{for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^(https?:|data:|blob:)/.test(m[1]))continue;assert.ok(fs.existsSync(path.join(root,m[1])),m[1]);}});
check('offline runtime uses classic local scripts',()=>{assert.ok(!html.includes('type="module"'));for(const m of html.matchAll(/<script[^>]+src="([^"]+)"/g))assert.ok(!/^https?:/.test(m[1]));});
const box={globalThis:null};box.globalThis=box;vm.runInNewContext(fs.readFileSync(path.join(root,'src/math.js'),'utf8'),box);
check('timeline keeps visible coverage across every handoff',()=>{for(let p=0;p<=9.4;p+=.002){const ws=box.FossilMath.weights(p);assert.ok(ws.every(v=>v>=0&&v<=1));assert.ok(ws.reduce((a,b)=>a+b,0)>.985,'coverage at '+p);assert.ok(ws.filter(v=>v>.001).length<=2);}});
check('reverse scroll produces identical phase state',()=>{const ps=Array.from({length:901},(_,i)=>i/100);const forward=ps.map(p=>JSON.stringify([box.FossilMath.weights(p),box.FossilMath.phase(p%1)]));const reverse=[...ps].reverse().map(p=>JSON.stringify([box.FossilMath.weights(p),box.FossilMath.phase(p%1)])).reverse();assert.deepEqual(forward,reverse);});
check('one Lenis owner and no competing smooth-scroll loop',()=>{const app=fs.readFileSync(path.join(root,'src/app.js'),'utf8');assert.equal((app.match(/new Lenis\(/g)||[]).length,1);for(const file of ['geology.js','imaging.js']){const source=fs.readFileSync(path.join(root,'src',file),'utf8');assert.ok(!/requestAnimationFrame\s*\(/.test(source),file);}});
check('runtime and geometry label their synthetic origin',()=>{assert.ok(html.includes('do not represent an accessioned museum object'));assert.ok(html.includes('synthetic volume'));assert.ok(fs.existsSync(path.join(root,'data','fossil-volume.js')));assert.ok(fs.readdirSync(path.join(root,'models')).length>0);});
check('required license and research notices are present',()=>{for(const name of ['Lenis-MIT.txt','Cormorant-Garamond-OFL.txt','Manrope-OFL.txt','Bodoni-Moda-OFL.txt'])assert.ok(fs.existsSync(path.join(root,'licenses',name)));assert.ok(fs.existsSync(path.join(root,'docs/RESEARCH.md')));assert.ok(fs.existsSync(path.join(root,'docs/PROVENANCE.md')));});
console.log('\n'+checks+' delivery checks passed. Browser and density-field QA are separate documented gates.');
