import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createBrilliantCut, createStepCut, disposeGemGeometry, type GemGeometryData } from './gemGeometry';
import { createGemMaterial, GEM_PRESETS } from './gemMaterial';
import { createJadeStone, createAgateStone, createQuartzCluster } from './organicStones';
import { traceConvexRay } from './optics';
import { clamp, mix, smooth, chapterBlend, type NarrativeState } from '../narrative';

export interface ExhibitionControls {
  cut:number|null; polish:number|null; corundum:'auto'|'ruby'|'sapphire'; organic:'auto'|'jade'|'agate';
  translucency:number; angle:number; blueOverride:number|null; agateOverride:number|null; selected:number|null; inspect:number; dragX:number; dragY:number;
  reduced:boolean; ambientPaused:boolean; pointerX:number; pointerY:number;
}
export interface ExhibitionReadout {
  theme:number; cut:number; polish:number; blue:number; agate:number;
  labels:{ x:number;y:number }[]; facetLabels:{x:number;y:number}[];
}
interface Pose { x:number; y:number; z:number; scale:number; rx:number; ry:number; rz:number }
const DARK=new THREE.Color('#080b0e');
const LIGHT=new THREE.Color('#e5e8e2');
const tempColor=new THREE.Color();
const TAU=Math.PI*2;

function setOpacity(root:THREE.Object3D,opacity:number,layers=1):void{
  root.visible=opacity>0.001;
  // A five-slice object must fade as one specimen. Repeating the full alpha on
  // every slice would leave an opaque ghost long after its scene had handed off.
  const alpha=layers>1?1-Math.pow(1-clamp(opacity),1/layers):opacity;
  root.traverse(object=>{
    if(!(object instanceof THREE.Mesh))return;
    const materials=Array.isArray(object.material)?object.material:[object.material];
    for(const material of materials){
      if(material instanceof THREE.ShaderMaterial && material.uniforms.uOpacity) material.uniforms.uOpacity.value=alpha;
      else { material.transparent=alpha<.999; material.opacity=alpha; }
      material.depthWrite=alpha>.995;
    }
  });
}
function pose(root:THREE.Object3D,p:Pose):void{
 root.position.set(p.x,p.y,p.z);root.rotation.set(p.rx,p.ry,p.rz);root.scale.setScalar(Math.max(.0001,p.scale));
}
function blendPose(a:Pose,b:Pose,t:number):Pose{
 return {x:mix(a.x,b.x,t),y:mix(a.y,b.y,t),z:mix(a.z,b.z,t),scale:mix(a.scale,b.scale,t),rx:mix(a.rx,b.rx,t),ry:mix(a.ry,b.ry,t),rz:mix(a.rz,b.rz,t)};
}
function applyOpticalMix(material:THREE.ShaderMaterial,t:number):void{
 const r=GEM_PRESETS.ruby,b=GEM_PRESETS.sapphire;
 material.uniforms.uColor.value.set(r.color).lerp(tempColor.set(b.color),t);
 material.uniforms.uAbsorption.value.set(mix(r.absorption[0],b.absorption[0],t),mix(r.absorption[1],b.absorption[1],t),mix(r.absorption[2],b.absorption[2],t));
 material.uniforms.uIor.value=mix(r.ior,b.ior,t);
 material.uniforms.uDispersion.value=mix(r.dispersion,b.dispersion,t);
 material.uniforms.uExposure.value=mix(r.exposure,b.exposure,t);
}

function makeSplit(cut:GemGeometryData,material:THREE.ShaderMaterial):{group:THREE.Group;tiers:THREE.Group[];wireMaterials:THREE.LineBasicMaterial[]}{
 const group=new THREE.Group();group.name='Crown / girdle / pavilion';
 const bins:THREE.BufferGeometry[][]=[[],[],[]];
 for(const f of cut.facets){
  const tier=f.kind==='girdle'?1:f.kind.startsWith('pavilion')||f.kind==='lower-girdle'||f.kind==='culet'?2:0;
  bins[tier].push(f.geometry.clone().translate(f.center.x,f.center.y,f.center.z));
 }
 // The separated tiers are solid sections, not three open shells. Their cut
 // surfaces share the exact sixteen-sided girdle boundary of the source cut.
 const girdle=cut.facets.filter(f=>f.kind==='girdle').flatMap(f=>f.vertices);
 const top=Math.max(...girdle.map(v=>v.y)),bottom=Math.min(...girdle.map(v=>v.y));
 function cap(y:number,normalY:number):THREE.BufferGeometry{
  const unique=new Map<string,THREE.Vector3>();
  girdle.filter(v=>Math.abs(v.y-y)<1e-6).forEach(v=>unique.set(`${v.x.toFixed(6)},${v.z.toFixed(6)}`,v));
  const ring=Array.from(unique.values()).sort((a,b)=>Math.atan2(a.z,a.x)-Math.atan2(b.z,b.x));
  if(normalY>0)ring.reverse();
  const positions:number[]=[],normals:number[]=[],ids:number[]=[],centers:number[]=[],uv:number[]=[];
  for(let i=0;i<ring.length;i++)for(const v of [new THREE.Vector3(0,y,0),ring[i],ring[(i+1)%ring.length]]){
   positions.push(v.x,v.y,v.z);normals.push(0,normalY,0);ids.push(74);centers.push(0,y,0);uv.push(v.x*.5+.5,v.z*.5+.5);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  g.setAttribute('facetIndex',new THREE.Float32BufferAttribute(ids,1));g.setAttribute('facetCenter',new THREE.Float32BufferAttribute(centers,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  return g;
 }
 bins[0].push(cap(top,-1));bins[1].push(cap(top,1),cap(bottom,-1));bins[2].push(cap(bottom,1));
 const wireMaterials:THREE.LineBasicMaterial[]=[];
 const tiers=bins.map((geometries,index)=>{
  const tier=new THREE.Group();tier.name=['Crown','Girdle','Pavilion'][index];
  const geometry=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());
  const mesh=new THREE.Mesh(geometry,material);tier.add(mesh);
  const wireMat=new THREE.LineBasicMaterial({color:'#d5e4ec',transparent:true,opacity:.45,depthWrite:false});
  wireMaterials.push(wireMat);
  const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,1),wireMat);tier.add(edges);group.add(tier);
  return tier;
 });
 return {group,tiers,wireMaterials};
}

function makeConstruction():THREE.Group{
 const group=new THREE.Group();group.name='Cut construction';
 const mat=new THREE.LineBasicMaterial({color:'#a0b4bc',transparent:true,opacity:.27,depthWrite:false});
 for(const radius of [1.27,1.48]){
  const points=Array.from({length:145},(_,i)=>new THREE.Vector3(Math.cos(i/144*TAU)*radius,Math.sin(i/144*TAU)*radius-.18,0));
  group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),mat));
 }
 const positions:number[]=[];
 for(let i=0;i<32;i++){
  const a=i/32*TAU;
  const r=i%4===0?1.52:1.495;
  positions.push(Math.cos(a)*1.48,Math.sin(a)*1.48-.18,0,Math.cos(a)*r,Math.sin(a)*r-.18,0);
 }
 positions.push(-1.6,-.18,0,1.6,-.18,0,0,-1.85,0,0,1.48,0);
 group.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(positions,3)),mat));
 return group;
}

function floorMaterial():THREE.ShaderMaterial{
 return new THREE.ShaderMaterial({
  uniforms:{uTheme:{value:0},uLight:{value:.5},uTime:{value:0},uAnchor:{value:new THREE.Vector2(2,0)},uBand:{value:0}},
  vertexShader:`varying vec2 vFloor; void main(){vFloor=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`
  varying vec2 vFloor; uniform float uTheme; uniform float uLight; uniform float uTime; uniform vec2 uAnchor; uniform float uBand;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  void main(){
   vec2 p=vFloor;vec2 q=p-uAnchor;float field=exp(-dot(q*vec2(.19,.14),q*vec2(.19,.14)));
   float texture=hash(floor(p*175.))*.004;
   vec3 dark=vec3(.012,.016,.019)+field*vec3(.013,.017,.019)+texture;
   vec3 pale=vec3(.58,.62,.56)+field*.12+texture;
   vec3 color=mix(dark,pale,uTheme);
   float shadow=exp(-dot(q*vec2(1.02,1.55),q*vec2(1.02,1.55)));
   color*=1.-shadow*mix(.67,.23,uTheme);
   vec2 c=q*vec2(.65,1.5);float a=atan(c.y,c.x);float r=length(c);
   float ribbon=pow(max(0.,sin(r*13.+sin(a*5.)*.6+sin(a*9.+uTime*.1)*.16)),36.);
   float shell=exp(-pow((r-1.3)/.75,2.));
   float streak=pow(max(0.,sin(a*7.+r*3.)),11.);
   color+=vec3(.31,.35,.37)*ribbon*shell*streak*uLight*.55*(1.-uTheme*.75);
   color+=vec3(.13,.105,.067)*pow(max(0.,sin(r*20.+sin(a*3.))),25.)*exp(-r*.65)*uBand;
   float horizon=1.-smoothstep(2.,18.,length(p));
   color=mix(mix(vec3(.0024,.0033,.0044),vec3(.785,.807,.755),uTheme),color,horizon);
   gl_FragColor=vec4(color,horizon);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`,toneMapped:true,transparent:true,depthWrite:false,
 });
}

export class Exhibition {
 readonly renderer:THREE.WebGLRenderer;
 readonly scene=new THREE.Scene();
 readonly camera=new THREE.PerspectiveCamera(37,1,.1,70);
 private brilliant=createBrilliantCut();
 private step=createStepCut();
 private mainMaterial:THREE.ShaderMaterial;
 private stepMaterial:THREE.ShaderMaterial;
 private rubyMaterial:THREE.ShaderMaterial;
 private mainRoot=new THREE.Group();
 private stepRoot=new THREE.Group();
 private rubyRoot=new THREE.Group();
 private solid:THREE.Mesh;
 private split:ReturnType<typeof makeSplit>;
 private construction=makeConstruction();
 private outerWire:THREE.LineSegments;
 private depthRings=new THREE.Group();
 private jade=createJadeStone();
 private agate=createAgateStone();
 private quartz=createQuartzCluster();
 private floorMat=floorMaterial();
 private floor:THREE.Mesh;
 private environment:THREE.WebGLRenderTarget;
 private plinths:THREE.Mesh[]=[];
 private specimens:THREE.Group[]=[];
 private rayGroup=new THREE.Group();
 private rayLines:THREE.Line[]=[];
 private spectralLines:THREE.Line[]=[];
 private rayPoint=new THREE.Mesh();
 private picker=new THREE.Raycaster();
 private width=1;private height=1;private mobile=false;private dpr=1;private worldWidth=10;
 private lastRayKey='';private disposed=false;private frames=0;
 private background=new THREE.Color('#080b0e');
 private galleryPoses:Pose[]=[];
 private lastReadout:ExhibitionReadout={theme:0,cut:0,polish:1,blue:0,agate:0,labels:[],facetLabels:[]};

 constructor(canvas:HTMLCanvasElement){
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance',stencil:false,depth:true});
  this.renderer.setClearColor(DARK,1);
  this.renderer.outputColorSpace=THREE.SRGBColorSpace;
  this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
  this.renderer.toneMappingExposure=1.05;
  this.renderer.info.autoReset=true;
  this.scene.background=this.background;
  this.camera.position.set(0,.65,8.8);this.camera.lookAt(0,0,0);
  const pmrem=new THREE.PMREMGenerator(this.renderer);
  const room=new RoomEnvironment();
  this.environment=pmrem.fromScene(room,.04);this.scene.environment=this.environment.texture;
  room.dispose();pmrem.dispose();
  this.scene.environmentIntensity=.65;
  const key=new THREE.DirectionalLight('#f2f5ee',3.7);key.position.set(-3,5,6);this.scene.add(key);
  const fill=new THREE.DirectionalLight('#dbe6ec',1.65);fill.position.set(4,1,3);this.scene.add(fill);
  const rim=new THREE.DirectionalLight('#f9fff1',2.3);rim.position.set(-1,2,-4);this.scene.add(rim);
  this.scene.add(new THREE.AmbientLight('#91a29e',.12));
  this.mainMaterial=createGemMaterial(this.brilliant.planes,{preset:'diamond',bounces:4});
  this.stepMaterial=createGemMaterial(this.step.planes,{preset:'ruby',bounces:4});
  this.rubyMaterial=createGemMaterial(this.brilliant.planes,{preset:'ruby',bounces:3});
  this.solid=new THREE.Mesh(this.brilliant.geometry,this.mainMaterial);this.solid.name='Brilliant cut';this.mainRoot.add(this.solid);
  this.split=makeSplit(this.brilliant,this.mainMaterial);this.mainRoot.add(this.split.group);
  this.outerWire=new THREE.LineSegments(this.brilliant.wireGeometry,new THREE.LineBasicMaterial({color:'#d6e3ee',transparent:true,opacity:.055,depthWrite:false}));this.mainRoot.add(this.outerWire);
  this.scene.add(this.mainRoot,this.stepRoot,this.rubyRoot);
  this.stepRoot.add(new THREE.Mesh(this.step.geometry,this.stepMaterial));
  this.rubyRoot.add(new THREE.Mesh(this.brilliant.geometry,this.rubyMaterial));
  const stepEdges=new THREE.LineSegments(this.step.wireGeometry,new THREE.LineBasicMaterial({color:'#8aa6d0',transparent:true,opacity:.055,depthWrite:false}));this.stepRoot.add(stepEdges);
  this.buildDepth();this.stepRoot.add(this.depthRings);
  this.scene.add(this.jade.group,this.agate.group,this.quartz.group,this.construction);
  this.floor=new THREE.Mesh(new THREE.PlaneGeometry(60,60),this.floorMat);this.floor.rotation.x=-Math.PI/2;this.floor.position.y=-1.82;this.floor.renderOrder=-2;this.scene.add(this.floor);
  this.buildRays();
  this.specimens=[this.rubyRoot,this.stepRoot,this.mainRoot,this.jade.group,this.agate.group,this.quartz.group];
  for(let i=0;i<6;i++){
   const profile=[new THREE.Vector2(0,-.15),new THREE.Vector2(.965,-.15),new THREE.Vector2(1,-.125),new THREE.Vector2(1,.125),new THREE.Vector2(.965,.15),new THREE.Vector2(0,.15)];
   const m=new THREE.Mesh(new THREE.LatheGeometry(profile,80),new THREE.MeshPhysicalMaterial({color:'#101719',roughness:.90,metalness:0,specularIntensity:.08,envMapIntensity:.03,transparent:true,opacity:0}));
   m.name=`Exhibit plinth ${i+1}`;this.plinths.push(m);this.scene.add(m);
  }
  this.rayGroup.renderOrder=6;this.scene.add(this.rayGroup);
  this.resize();
 }

 private buildDepth():void{
  const cut=this.step;
  const table=cut.facets.find(f=>f.kind==='table')!;
  for(let i=0;i<5;i++){
   const points=table.vertices.map(v=>new THREE.Vector3(v.x*(1-i*.11),v.y-i*.16,v.z*(1-i*.11)));
   points.push(points[0].clone());
   const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#a5c5ff',transparent:true,opacity:.08,depthTest:false,depthWrite:false}));
   this.depthRings.add(line);
  }
  const points:THREE.Vector3[]=[];
  for(let i=0;i<6;i++){
   const a=i*2.43;
   points.push(new THREE.Vector3(Math.sin(a)*.48,-.04+Math.cos(a)*.1,Math.cos(a)*.45),new THREE.Vector3(Math.sin(a+.1)*.48+.16,-.16,Math.cos(a+.1)*.45-.25));
  }
  const inclusions=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#d9e1f1',transparent:true,opacity:.12,depthTest:false,depthWrite:false}));
  this.depthRings.add(inclusions);
 }

 private buildRays():void{
  for(let i=0;i<2;i++){
   const geometry=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array((i?2:12)*3),3));
   geometry.setDrawRange(0,2);
   const line=new THREE.Line(geometry,new THREE.LineBasicMaterial({color:i?'#becfdc':'#eef8fc',transparent:true,opacity:i?.22:.62,depthTest:false,depthWrite:false}));
   line.frustumCulled=false;
   this.rayLines.push(line);this.rayGroup.add(line);
  }
  ['#ff5545','#ffa548','#ecdf83','#9bc89b','#80c3d8','#7795e8','#b5a0de'].forEach(color=>{
   const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineBasicMaterial({color,transparent:true,opacity:.6,depthTest:false,depthWrite:false}));
   this.spectralLines.push(line);this.rayGroup.add(line);
  });
  const geometry=new THREE.SphereGeometry(.018,12,8);
  this.rayPoint=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:'#f4fbff',transparent:true,opacity:.9,depthTest:false}));this.rayGroup.add(this.rayPoint);
 }

 resize():void{
  this.width=Math.max(1,window.innerWidth);this.height=Math.max(1,window.innerHeight);this.mobile=this.width<=700||(this.width<=1100&&this.width<=this.height);
  // A bounded pixel budget keeps 4K layout sharp without unbounded fragment work.
  const cap=this.mobile?1.55:1.4;
  this.dpr=Math.min(window.devicePixelRatio||1,cap,Math.sqrt(4200000/(this.width*this.height)));
  this.renderer.setPixelRatio(this.dpr);this.renderer.setSize(this.width,this.height,false);
  this.camera.aspect=this.width/this.height;this.camera.updateProjectionMatrix();
  this.worldWidth=2*Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2))*8.8*this.camera.aspect;
  this.lastRayKey='';this.layoutGallery();
 }

 private layoutGallery():void{
  const x=this.mobile?[-.31,0,.31,-.31,0,.31]:[-.405,-.25,-.075,.105,.285,.445];
  const s=this.mobile?[.32,.3,.37,.32,.32,.34]:[.58,.54,.77,.65,.63,.61];
  const rots=[[1.13,.04,-.14],[1.32,-.13,.12],[1.19,.04,-.18],[.03,-.28,-.1],[.06,-.29,.04],[0,.12,.02]];
  this.galleryPoses=x.map((fraction,i)=>({x:fraction*this.worldWidth,y:this.mobile?(i<3?.64:-.78):[-.86,-1.02,-.68,-.84,-.82,-.91][i],z:this.mobile?0:[-.22,.22,-.22,.2,-.04,-.35][i],scale:s[i]*(this.mobile?Math.min(1,this.worldWidth/2.55):1),rx:rots[i][0],ry:rots[i][1],rz:rots[i][2]}));
  this.plinths.forEach((plinth,i)=>{
   const p=this.galleryPoses[i];
   const radius=this.mobile?.4*(this.worldWidth/2.75):i===2?.97:.79;
   plinth.scale.set(radius,this.mobile?.5:1,radius*.85);
   plinth.position.set(p.x,this.mobile?(i<3?.15:-1.29):[-1.44,-1.58,-1.42,-1.55,-1.55,-1.58][i],p.z);
  });
 }

 private screen(v:THREE.Vector3):{x:number;y:number}{v.project(this.camera);return {x:(v.x*.5+.5)*this.width,y:(-.5*v.y+.5)*this.height};}
 private poseFor(index:number):Pose{
  if(this.mobile){
   const w=Math.min(1.12,this.worldWidth*.395);
   const a:Pose[]=[
    {x:0,y:.13,z:0,scale:w,rx:1.01,ry:.1,rz:-.3},
    {x:-.13,y:.2,z:0,scale:w*.81,rx:.27,ry:.18,rz:-.035},
    {x:0,y:.18,z:.1,scale:w*1.01,rx:1.12,ry:.16,rz:-.42},
    {x:.16,y:.10,z:.3,scale:w*1.04,rx:1.38,ry:.09,rz:-.17},
    {x:-.18,y:.22,z:0,scale:w*.92,rx:.09,ry:-.3,rz:-.15},
    {x:0,y:.2,z:0,scale:w*.94,rx:.4,ry:.08,rz:0},
    this.galleryPoses[2],
   ];return a[index];
  }
  const w=this.worldWidth;
  return [
   {x:w*.205,y:.16,z:0,scale:2.05,rx:1.04,ry:.14,rz:-.37},
   {x:w*.205,y:.22,z:0,scale:1.68,rx:.25,ry:.22,rz:0},
   {x:-w*.205,y:.18,z:.15,scale:1.93,rx:1.16,ry:.18,rz:-.36},
   {x:w*.235,y:.08,z:.15,scale:1.89,rx:1.43,ry:.14,rz:-.18},
   {x:-w*.17,y:.07,z:0,scale:1.92,rx:.02,ry:-.3,rz:-.15},
   {x:w*.12,y:.25,z:0,scale:1.89,rx:.37,ry:.06,rz:0},
   this.galleryPoses[2],
  ][index];
 }

 render(state:NarrativeState,controls:ExhibitionControls,time:number):ExhibitionReadout{
  if(this.disposed)return this.lastReadout;
  const p=state.position;
  const ambient=controls.reduced?0:time;
  const w=Array.from({length:7},(_,i)=>chapterBlend(p,i));
  const exhibition=w[6];
  const theme=smooth(.12,.94,w[4]);
  this.camera.position.set(0,mix(.65,1.05,exhibition),mix(8.8,9.1,exhibition));
  this.camera.lookAt(0,-.73*exhibition,0);this.camera.updateMatrixWorld(true);
  const cut=controls.cut??smooth(.99,1.45,p)*(1-smooth(1.72,2.1,p));
  const polish=controls.polish??smooth(2.06,2.8,p);
  const blue=controls.blueOverride??(controls.corundum==='auto'?smooth(3.30,3.72,p):controls.corundum==='sapphire'?1:0);
  const agate=controls.agateOverride??(controls.organic==='auto'?smooth(4.42,4.78,p):controls.organic==='agate'?1:0);
  this.background.copy(DARK).lerp(LIGHT,theme);
  this.floorMat.uniforms.uTheme.value=theme;
  this.floorMat.uniforms.uTime.value=ambient;
  this.floorMat.uniforms.uLight.value=w[0]*.45+w[2]*.25+w[5]*.85+exhibition*.25;
  this.floorMat.uniforms.uBand.value=smooth(4.5,4.77,p)*(1-smooth(5.03,5.35,p))*.85;
  let current=this.poseFor(0);
  // Every handoff reuses the current world-space pose; the smooth intervals are shared.
  for(let i=1;i<7;i++)current=blendPose(current,this.poseFor(i),smooth(i-.24,i+.16,p));
  const breath=ambient?Math.sin(ambient*.21)*.025:0;
  current.ry+=breath+controls.dragX;
  current.rx+=controls.dragY;
  current.y+=ambient?Math.sin(ambient*.32)*.013:0;
  pose(this.mainRoot,current);
  this.mainMaterial.uniforms.uTime.value=ambient;
  this.mainMaterial.uniforms.uLightRotation.value=p*.22+controls.pointerX*.075;
  this.mainMaterial.uniforms.uPolish.value=1-w[2]*(1-polish);
  this.mainMaterial.uniforms.uExposure.value=1.28;
  this.mainMaterial.uniforms.uOpacity.value=clamp(w[0]+w[1]+w[2]+w[5]+exhibition);
  this.mainRoot.visible=this.mainMaterial.uniforms.uOpacity.value>.001;
  this.mainMaterial.depthWrite=this.mainMaterial.uniforms.uOpacity.value>.995;
  const explosion=controls.cut===null?cut:cut*w[1];
  this.solid.visible=explosion<.006;
  this.split.group.visible=!this.solid.visible;
  this.outerWire.visible=this.solid.visible;
  (this.outerWire.material as THREE.LineBasicMaterial).opacity=.055+w[1]*.15;
  this.split.tiers[0].position.y=explosion*.48;
  this.split.tiers[1].position.y=0;
  this.split.tiers[2].position.y=-explosion*.48;
  this.split.wireMaterials.forEach(m=>m.opacity=.18+w[1]*.26);
  this.construction.visible=w[1]>.01;
  this.construction.position.set(this.poseFor(1).x,this.poseFor(1).y-.05,-.35);
  this.construction.scale.setScalar(this.poseFor(1).scale);
  this.construction.traverse(o=>{if(o instanceof THREE.Line)(o.material as THREE.LineBasicMaterial).opacity=w[1]*.28;});

  let stepPose=blendPose(this.poseFor(2),this.poseFor(3),smooth(2.76,3.16,p));
  stepPose.scale*=1+smooth(3.22,3.74,p)*.11;
  stepPose=blendPose(stepPose,this.poseFor(4),smooth(3.74,4.10,p));
  stepPose.ry+=breath*.65+controls.dragX;stepPose.rx+=controls.dragY;
  pose(this.stepRoot,stepPose);
  this.stepRoot.visible=w[3]>.002||exhibition>.002;
  this.stepMaterial.uniforms.uOpacity.value=w[3];this.stepMaterial.depthWrite=w[3]>.995;
  this.stepMaterial.uniforms.uTime.value=ambient;
  this.stepMaterial.uniforms.uLightRotation.value=.25+p*.16;
  applyOpticalMix(this.stepMaterial,exhibition>.02?1:blue);
  this.depthRings.visible=w[3]>.02;
  this.depthRings.children.forEach((o,i)=>{
   (o as THREE.Line).material instanceof THREE.LineBasicMaterial&&((o as THREE.Line<THREE.BufferGeometry,THREE.LineBasicMaterial>).material.opacity=w[3]*(i<5?.08:.1)*smooth(3.15,3.4,p));
   o.position.y=smooth(3.23,3.72,p)*(5-i)*.035;
  });

  const organicPose=blendPose(this.poseFor(4),this.poseFor(5),smooth(4.76,5.16,p));
  const jp={...organicPose};
  jp.x-=agate*(this.mobile?.6:this.worldWidth*.11);
  jp.scale*=1-agate*.44;jp.ry-=agate*.6;
  jp.rx+=controls.dragY;jp.ry+=controls.dragX+breath;
  pose(this.jade.group,jp);
  setOpacity(this.jade.group,w[4]*(1-smooth(.35,.84,agate)));
  const ap={...organicPose};
  ap.x+=mix(this.mobile?.64:this.worldWidth*.225,.15,agate);
  ap.scale*=mix(.70,1.05,agate);ap.ry=mix(-1.37,-.38,agate)+controls.dragX;
  ap.rx+=controls.dragY;ap.rz=.02;
  pose(this.agate.group,ap);
  this.agate.group.scale.z*=mix(.2,1,agate);
  setOpacity(this.agate.group,w[4]*mix(.86,1,agate),5);
  this.jade.update({time:ambient,light:controls.translucency,translucency:controls.translucency,reducedMotion:controls.reduced});
  this.agate.update({time:ambient,light:exhibition>.001?.7:controls.translucency,open:exhibition>.001?(controls.selected===4?controls.inspect*.45:0):agate*(.10+smooth(4.63,4.86,p)*.42),reducedMotion:controls.reduced});
  this.rubyRoot.visible=exhibition>.002;
  this.quartz.group.visible=exhibition>.002;
  this.quartz.update({time:ambient,light:.62,reducedMotion:controls.reduced});

  const labels:{x:number;y:number}[]=[];
  if(exhibition>.001){
   this.specimens.forEach((root,i)=>{
    const target={...this.galleryPoses[i]};
    target.ry+=(ambient?Math.sin(ambient*.19+i)*.018:0);
    const inspecting=controls.selected!==null;
    const selected=controls.selected===i;
    if(selected){
     const inspect:Pose={x:this.mobile?0:this.worldWidth*.17,y:this.mobile?.04:.05,z:.15,scale:(this.mobile?Math.min(1.18,this.worldWidth*.39):2.07)*(i===5?.95:1),rx:target.rx,ry:target.ry,rz:target.rz};
     Object.assign(target,blendPose(target,inspect,controls.inspect));
     target.ry+=controls.dragX;target.rx+=controls.dragY;
    }
    if(inspecting&&!selected)target.scale*=1-controls.inspect;
    if(i===2){
     const from={...current};
     pose(root,blendPose(from,target,exhibition));
     this.mainMaterial.uniforms.uOpacity.value=inspecting&&!selected?1-controls.inspect:1;
     root.visible=target.scale>.0001;
    }else{
     target.scale*=exhibition;
     pose(root,target);
     setOpacity(root,exhibition*(inspecting&&!selected?1-controls.inspect:1),i===4?5:1);
    }
    if(i===1)this.stepMaterial.uniforms.uOpacity.value=exhibition*(inspecting&&!selected?1-controls.inspect:1);
    // Place each specimen above its own plinth using its actual rotated hull.
    // This keeps portrait, brilliant and crystal cuts at the same contact gap.
    if(controls.inspect<.999){
     root.updateMatrixWorld(true);
     let minimum=Infinity;
     root.traverseVisible(object=>{
      if(!(object instanceof THREE.Mesh))return;
      const vertices=object.geometry.getAttribute('position');
      const matrix=object.matrixWorld.elements;
      for(let vertex=0;vertex<vertices.count;vertex++){
       const y=matrix[1]*vertices.getX(vertex)+matrix[5]*vertices.getY(vertex)+matrix[9]*vertices.getZ(vertex)+matrix[13];
       minimum=Math.min(minimum,y);
      }
     });
     const top=this.plinths[i].position.y+this.plinths[i].scale.y*.15;
     if(Number.isFinite(minimum))root.position.y+=(top+.025-minimum)*exhibition*(1-controls.inspect);
    }
    this.plinths[i].visible=exhibition>.001;
    (this.plinths[i].material as THREE.MeshStandardMaterial).opacity=exhibition*(1-controls.inspect);
    const label=this.plinths[i].position.clone();label.y-=this.mobile?.25:.28;label.z+=.1;
    labels.push(this.screen(label));
   });
   this.depthRings.visible=false;
   this.mainMaterial.uniforms.uPolish.value=1;
   this.solid.visible=true;this.split.group.visible=false;
  }else{
   this.plinths.forEach(o=>o.visible=false);
  }
  this.mainRoot.updateMatrixWorld(true);
  const beamWeight=w[0]*.6+w[5];
  this.rayGroup.visible=beamWeight>.01&&controls.selected===null;
  if(this.rayGroup.visible){
   this.updateRays(controls.angle,w[5]>.2,beamWeight);
   this.rayLines.forEach((l,i)=>(l.material as THREE.LineBasicMaterial).opacity=beamWeight*(i?.35:.55));
   this.spectralLines.forEach(l=>(l.material as THREE.LineBasicMaterial).opacity=beamWeight*(w[5]>.2?.68:.2));
  }
  this.floorMat.uniforms.uAnchor.value.set(exhibition>.5?0:current.x,0);
  this.scene.environmentIntensity=mix(.65,.88,theme);
  this.renderer.render(this.scene,this.camera);
  this.frames++;
  const fbase=this.poseFor(1);
  const facetLabels=[.4+explosion*.45,.0,-.55-explosion*.5].map(y=>{
   const local=new THREE.Vector3(1.03,y,0).applyEuler(new THREE.Euler(fbase.rx,fbase.ry,fbase.rz)).multiplyScalar(fbase.scale).add(new THREE.Vector3(fbase.x,fbase.y,fbase.z));
   const pt=this.screen(local);
   return {x:Math.min(pt.x,this.width-(this.mobile?78:148)),y:pt.y};
  });
  this.lastReadout={theme,cut:explosion,polish,blue,agate,labels,facetLabels};
  return this.lastReadout;
 }

 /** Exact hull picking; the adjacent native buttons remain keyboard targets. */
 pickSpecimen(clientX:number,clientY:number):number|null{
  this.picker.setFromCamera(new THREE.Vector2(clientX/this.width*2-1,1-clientY/this.height*2),this.camera);
  const targets:THREE.Object3D[]=[];
  this.specimens.forEach(root=>root.traverseVisible(object=>{if(object instanceof THREE.Mesh)targets.push(object);}));
  const hits=this.picker.intersectObjects(targets,false);
  for(const hit of hits){
   let object:THREE.Object3D|null=hit.object;
   while(object){
    const index=this.specimens.indexOf(object as THREE.Group);
    if(index>=0&&object.visible)return index;
    object=object.parent;
   }
  }
  return null;
 }

 private updateRays(angle:number,spectrum:boolean,weight:number):void{
  const matrix=this.mainRoot.matrixWorld;
  const rayKey=`${angle.toFixed(2)}:${spectrum}:${matrix.elements.map(n=>n.toFixed(3)).join(',')}`;
  if(rayKey===this.lastRayKey)return;
  this.lastRayKey=rayKey;
  const center=new THREE.Vector3(0,-.1,0).applyMatrix4(matrix);
  const theta=THREE.MathUtils.degToRad(angle);
  const worldDirection=new THREE.Vector3(Math.cos(theta),-Math.sin(theta),-.07).normalize();
  const worldOrigin=center.clone().addScaledVector(worldDirection,-12);
  const inverse=matrix.clone().invert();
  const origin=worldOrigin.clone().applyMatrix4(inverse);
  const direction=worldDirection.clone().transformDirection(inverse);
  const trace=traceConvexRay(origin,direction,this.brilliant.planes,2.417,10);
  const points=trace.points.map(v=>v.applyMatrix4(matrix));
  if(points.length<2){this.rayGroup.visible=false;return;}
  const pathGeometry=this.rayLines[0].geometry;
  const pathPosition=pathGeometry.getAttribute('position') as THREE.BufferAttribute;
  points.forEach((v,i)=>pathPosition.setXYZ(i,v.x,v.y,v.z));
  pathPosition.needsUpdate=true;pathGeometry.setDrawRange(0,points.length);
  this.rayPoint.position.copy(points[1]);
  (this.rayPoint.material as THREE.MeshBasicMaterial).opacity=weight*.85;
  if(trace.exited){
   const exit=points[points.length-1];
   const directionOut=trace.direction.clone().transformDirection(matrix);
   this.rayLines[1].visible=true;
   this.rayLines[1].geometry.setFromPoints([exit,exit.clone().addScaledVector(directionOut,11)]);
  }else this.rayLines[1].visible=false;
  this.spectralLines.forEach((line,i)=>{
   const ri=2.417+(i-3)*(spectrum?.006:.002);
   const channel=traceConvexRay(origin,direction,this.brilliant.planes,ri,10);
   line.visible=channel.exited;
   if(!channel.exited)return;
   const exit=channel.points[channel.points.length-1].clone().applyMatrix4(matrix);
   const out=channel.direction.clone().transformDirection(matrix);
   line.geometry.setFromPoints([exit,exit.clone().addScaledVector(out,13)]);line.geometry.computeBoundingSphere();
  });
 }

 get diagnostics(){return {frames:this.frames,drawCalls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,dpr:this.dpr,width:this.width,height:this.height,webgl:true};}
 dispose():void{
  if(this.disposed)return;this.disposed=true;
  const geometries=new Set<THREE.BufferGeometry>();const materials=new Set<THREE.Material>();
  this.scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
  disposeGemGeometry(this.brilliant);disposeGemGeometry(this.step);
  this.environment.dispose();this.renderer.dispose();
 }
}
