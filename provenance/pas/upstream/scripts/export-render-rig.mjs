/** Export the actual PAS character rig for offline OpenGL rendering.
 * Node >=22, no DOM, browser, canvas, animation replacement or external assets.
 * node --experimental-strip-types scripts/export-render-rig.mjs --out ../offline-render/rig --times 3.42
 * node --experimental-strip-types scripts/export-render-rig.mjs --out ../offline-render/rig --range 0:10:.005 --mode unison
 */
import * as THREE from 'three';
import { createCharacter } from '../src/render/character.ts';
import { evaluateDance } from '../src/motion.ts';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=Object.fromEntries(process.argv.slice(2).reduce((pairs,v,i,a)=>v.startsWith('--')?[...pairs,[v.slice(2),a[i+1]]]:pairs,[]));
const out=path.resolve(args.out||path.join(root,'../offline-render/rig'));
fs.mkdirSync(out,{recursive:true});
const mode=args.mode==='echo'?'echo':'unison';
let times=(args.times||'3.42').split(',').map(Number);
if(args.range){const [start,end,step]=args.range.split(':').map(Number);times=Array.from({length:Math.round((end-start)/step)+1},(_,i)=>Math.min(end,start+i*step));}
if(times.some(t=>!Number.isFinite(t)||t<0||t>10))throw Error('All sample times must be in [0,10].');
const texture=(name)=>path.join(root,'public/assets/textures',name);
const models={};
const colors={cen:{body:'#fff3e5',shirt:'#b95b43',pants:'#302c29',hair:'#47352a'},cheng:{body:'#d9b18b',shirt:'#d9c7ae',pants:'#302c29',hair:'#38291d'}};
for(const id of ['cen','cheng']){
 const data=JSON.parse(fs.readFileSync(path.join(root,'public/assets/models',id+'.json'),'utf8'));
 const bytes=fs.readFileSync(path.join(root,'public/assets/models',id+'.bin'));
 const buffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
 const geometries=new Map(),materials=new Map();
 for(const mesh of data.meshes){
  const geometry=new THREE.BufferGeometry();
  for(const key of ['position','normal','uv','skinIndex','skinWeight','index']){
   const a=mesh.attributes[key]; const values=a.type==='<f4'?new Float32Array(buffer,a.offset,a.length):a.type==='<u2'?new Uint16Array(buffer,a.offset,a.length):new Uint32Array(buffer,a.offset,a.length);
   const attr=new THREE.BufferAttribute(values,a.itemSize);if(key==='index')geometry.setIndex(attr);else geometry.setAttribute(key,attr);
  }
  geometries.set(mesh.name,geometry);
  const material=new THREE.MeshStandardMaterial({color:colors[id][mesh.name],roughness:mesh.name==='hair'?.94:mesh.name==='body'?.88:.98,side:mesh.name==='body'?THREE.FrontSide:THREE.DoubleSide,alphaTest:mesh.name==='hair'?.42:0});
  material.userData.texturePath=mesh.name==='body'?texture(id+'-skin.webp'):mesh.name==='shirt'?texture('cotton.webp'):mesh.name==='hair'?texture(id+'-hair.webp'):null;
  material.userData.bumpPath=mesh.name==='shirt'?texture('cotton-bump.webp'):null;
  materials.set(mesh.name,material);
 }
 models[id]={data,geometries,materials};
}
const assets={models,dispose(){for(const m of Object.values(models)){for(const g of m.geometries.values())g.dispose();for(const mat of m.materials.values())mat.dispose();}}};
const actors={cen:createCharacter('cen',assets),cheng:createCharacter('cheng',assets)};
const chunks=[];let byteOffset=0;
function append(array,itemSize,type){
 const view=Buffer.from(array.buffer,array.byteOffset,array.byteLength);const spec={offset:byteOffset,length:array.length,itemSize,type};chunks.push(view);byteOffset+=view.byteLength;return spec;
}
const meshes=[],objects=[],skeletons={};
const instanceMatrix=new THREE.Matrix4(),normalMatrix=new THREE.Matrix3(),point=new THREE.Vector3(),normal=new THREE.Vector3(),instanceColor=new THREE.Color();
for(const [id,actor]of Object.entries(actors)){
 actor.group.updateMatrixWorld(true);
 let unnamed=0;
 actor.group.traverse(object=>{
  if(!object.isMesh)return;
  const g=object.geometry;const p=g.getAttribute('position'),n=g.getAttribute('normal'),uv=g.getAttribute('uv');
  const instances=object.isInstancedMesh?object.count:1;
  const count=p.count*instances;
  const positions=new Float32Array(count*3),normals=new Float32Array(count*3),uvs=new Float32Array(count*2),colors=new Float32Array(count*3),skinIndex=new Float32Array(count*4),skinWeight=new Float32Array(count*4);
  colors.fill(1);
  const indexCount=g.index?g.index.count:p.count;
  const indices=new Uint32Array(indexCount*instances);
  for(let inst=0;inst<instances;inst++){
   if(object.isInstancedMesh){object.getMatrixAt(inst,instanceMatrix);normalMatrix.getNormalMatrix(instanceMatrix);if(object.instanceColor)object.getColorAt(inst,instanceColor);else instanceColor.set(0xffffff);}else {instanceMatrix.identity();normalMatrix.identity();instanceColor.set(0xffffff);}
   for(let vi=0;vi<p.count;vi++){
    const dest=inst*p.count+vi;point.fromBufferAttribute(p,vi).applyMatrix4(instanceMatrix);point.toArray(positions,dest*3);
    normal.fromBufferAttribute(n,vi).applyMatrix3(normalMatrix).normalize().toArray(normals,dest*3);
    if(uv){uvs[dest*2]=uv.getX(vi);uvs[dest*2+1]=uv.getY(vi);}
    instanceColor.toArray(colors,dest*3);
    if(object.isSkinnedMesh){const si=g.getAttribute('skinIndex'),sw=g.getAttribute('skinWeight');for(let k=0;k<4;k++){skinIndex[dest*4+k]=si.array[vi*4+k];skinWeight[dest*4+k]=sw.array[vi*4+k];}}
   }
   for(let ii=0;ii<indexCount;ii++)indices[inst*indexCount+ii]=(g.index?g.index.getX(ii):ii)+inst*p.count;
  }
  const name=object.name||`${id}-detail-${unnamed++}`;object.name=name;
  const mat=object.material;
  const attributes={position:append(positions,3,'f32'),normal:append(normals,3,'f32'),uv:append(uvs,2,'f32'),color:append(colors,3,'f32')};
  if(object.isSkinnedMesh){attributes.skinIndex=append(skinIndex,4,'f32');attributes.skinWeight=append(skinWeight,4,'f32');skeletons[id]={boneCount:object.skeleton.bones.length,boneNames:object.skeleton.bones.map(b=>b.name)};}
  meshes.push({name,actor:id,vertexCount:count,indexCount:indices.length,attributes,index:append(indices,1,'u32'),skeleton:object.isSkinnedMesh?id:null,material:{color:mat.color.toArray(),map:mat.userData.texturePath||null,bumpMap:mat.userData.bumpPath||null,alphaTest:mat.alphaTest,doubleSided:mat.side===THREE.DoubleSide,roughness:mat.roughness}});
  objects.push(object);
 });
}
fs.writeFileSync(path.join(out,'rig.bin'),Buffer.concat(chunks));
const frameChunks=[];let frameOffset=0;
function frameAppend(array,itemSize=16){const spec={offset:frameOffset,length:array.length,itemSize,type:'f32'};const bytes=Buffer.from(array.buffer,array.byteOffset,array.byteLength);frameChunks.push(bytes);frameOffset+=bytes.byteLength;return spec;}
const frames=[];
for(const t of times){
 const frame=evaluateDance(t,{mode});
 for(const id of ['cen','cheng'])actors[id].update(frame.poses[id]);
 const rigFrames={};
 for(const id of ['cen','cheng']){
  const skinned=objects.find(o=>o.isSkinnedMesh&&o.name.startsWith(id+'-'));
  rigFrames[id]=frameAppend(skinned.skeleton.boneMatrices.slice());
 }
 const transforms=frameAppend(new Float32Array(objects.flatMap(o=>o.matrixWorld.elements)));
 frames.push({t,camera:frame.camera,contact:frame.contact,poses:Object.fromEntries(Object.entries(frame.poses).map(([id,p])=>[id,{root:p.root,feet:p.feet,hands:p.hands}])),skeletons:rigFrames,transforms});
}
fs.writeFileSync(path.join(out,`frames-${mode}.bin`),Buffer.concat(frameChunks));
const manifest={version:1,units:'metres',up:'Y',forward:'Z',matrixLayout:'column-major',binary:'rig.bin',skeletons,meshes};
fs.writeFileSync(path.join(out,'rig.json'),JSON.stringify(manifest));
fs.writeFileSync(path.join(out,`frames-${mode}.json`),JSON.stringify({version:1,binary:`frames-${mode}.bin`,mode,meshNames:meshes.map(m=>m.name),frames}));
console.log(JSON.stringify({out,mode,frames:frames.length,staticBytes:byteOffset,frameBytes:frameOffset,meshes:meshes.map(m=>({name:m.name,vertices:m.vertexCount,triangles:m.indexCount/3}))},null,2));
for(const actor of Object.values(actors))actor.dispose();assets.dispose();
