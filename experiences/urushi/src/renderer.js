import * as THREE from 'three';
import { createVesselData, pointOnFront } from './geometry.js';
import { makeMaterialField } from './material-textures.js';
import { getCameraState, getCameraFrame } from './camera.js';
import vesselVertex from './shaders/vessel.vert.glsl?raw';
import lacquerFragment from './shaders/lacquer.frag.glsl?raw';
import backgroundVertex from './shaders/background.vert.glsl?raw';
import backgroundFragment from './shaders/background.frag.glsl?raw';
import floorVertex from './shaders/floor.vert.glsl?raw';
import floorFragment from './shaders/floor.frag.glsl?raw';
import goldVertex from './shaders/gold.vert.glsl?raw';
import goldFragment from './shaders/gold.frag.glsl?raw';

const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const materialFields=['wood','ground','coat','cure','abrasion','abradeFront','layers','vermilion','polish','gold','goldVeil','goldReveal','chamber','section','reflectionShift','recoatMode','recoat'];
const uniformName=field=>'u'+field[0].toUpperCase()+field.slice(1);
const defaults={wood:0,ground:1,coat:1,cure:1,abrasion:0,abradeFront:1,layers:1,vermilion:0,polish:.9,gold:0,goldVeil:0,goldReveal:0,chamber:0,section:0,reflectionShift:0,recoatMode:0,recoat:0,phase:0,...getCameraState(0)};

function makeUniforms(){
  const uniforms={
    uTime:{value:0},uLight:{value:.5},uPointer:{value:new THREE.Vector2()},
    uDpr:{value:1},uResolution:{value:new THREE.Vector2(1,1)},
  };
  for(const field of materialFields)uniforms[uniformName(field)]={value:defaults[field]};
  return uniforms;
}

function meshGeometry(data){
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(data.positions,3));
  geometry.setAttribute('normal',new THREE.BufferAttribute(data.normals,3));
  geometry.setAttribute('uv',new THREE.BufferAttribute(data.uvs,2));
  geometry.setIndex(new THREE.BufferAttribute(data.indices,1));
  geometry.computeBoundingSphere();
  geometry.name='Original persistent elliptical lacquer vessel';
  return geometry;
}

function powderGeometry(profile,count=840){
  let seed=0x4d414b49;
  const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;};
  const positions=[],normals=[],arrivals=[],sizes=[],seeds=[];
  for(let i=0;i<count;){
    const x=random()*2.22-1.42;
    const branch=Math.floor(random()*3);
    let rise=clamp((x+1.00)/1.56);rise=rise*rise*(3-2*rise);
    const center=[.075,.097,.120][branch]+[.300,.315,.330][branch]*rise;
    const surface=pointOnFront(profile,x,center+(random()-.5)*.021);
    if(!surface||surface.position[1]>.395)continue;
    const {position,normal}=surface;
    positions.push(...position);normals.push(...normal);
    arrivals.push(clamp(((x+1.8)/3.6+.12)/1.24+(random()-.5)*.035,.035,.96));
    sizes.push(.70+random()*.85);seeds.push(random());i++;
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('aNormal',new THREE.Float32BufferAttribute(normals,3));
  geometry.setAttribute('aArrival',new THREE.Float32BufferAttribute(arrivals,1));
  geometry.setAttribute('aSize',new THREE.Float32BufferAttribute(sizes,1));
  geometry.setAttribute('aSeed',new THREE.Float32BufferAttribute(seeds,1));
  geometry.computeBoundingSphere();
  geometry.boundingSphere.radius+=.36;
  geometry.name='Fixed-seed surface-bound maki-e deposition';
  return geometry;
}

/**
 * One scene, one object, one material journey. The host owns the only RAF.
 * Every authored process is evaluated directly from state, including gold.
 */
export class LacquerRenderer {
  constructor(canvas,{onContextLost,onContextRestored}={}){
    if(!canvas)throw new Error('A canvas is required for the lacquer surface.');
    this.canvas=canvas;
    this.width=canvas.clientWidth||1;this.height=canvas.clientHeight||1;
    this.quality='auto';this.ready=false;this.contextLost=false;this.disposed=false;
    this.lastState={...defaults};this.resources=[];
    this.onContextLost=onContextLost;this.onContextRestored=onContextRestored;
    this.handleContextLost=event=>{
      event.preventDefault();this.contextLost=true;this.onContextLost?.();
    };
    this.handleContextRestored=()=>{
      // Three's own restore listener is registered later. The host's next
      // animation tick follows its reinitialization and owns the first draw.
      this.contextLost=false;this.needsRestoreResize=true;this.onContextRestored?.();
    };
    canvas.addEventListener('webglcontextlost',this.handleContextLost,false);
    canvas.addEventListener('webglcontextrestored',this.handleContextRestored,false);
  }

  async init(){
    if(this.ready||this.disposed)return;
    const modelURL=new URL(`${import.meta.env.BASE_URL}urushi/models/vessel-profile.json`,document.baseURI);
    const response=await fetch(modelURL);
    if(!response.ok)throw new Error(`The original vessel profile could not be read (${response.status}).`);
    this.profile=await response.json();
    if(this.disposed)return;
    this.renderer=new THREE.WebGLRenderer({canvas:this.canvas,antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:false});
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.0;
    this.renderer.setClearColor(0x0a0908,1);
    this.renderer.autoClear=true;
    this.scene=new THREE.Scene();
    this.camera=new THREE.PerspectiveCamera(32,1,.05,40);
    this.uniforms=makeUniforms();
    this.materialField=makeMaterialField(256);
    this.uniforms.uMaterialField={value:this.materialField};
    this.resources.push(this.materialField);

    const backgroundGeometry=new THREE.PlaneGeometry(2,2);
    const backgroundMaterial=new THREE.ShaderMaterial({
      uniforms:this.uniforms,vertexShader:backgroundVertex,fragmentShader:backgroundFragment,
      depthTest:false,depthWrite:false,toneMapped:true,
    });
    this.background=new THREE.Mesh(backgroundGeometry,backgroundMaterial);
    this.background.name='Quiet photographic room';
    this.background.frustumCulled=false;this.background.renderOrder=-100;
    this.scene.add(this.background);
    this.resources.push(backgroundGeometry,backgroundMaterial);

    this.object=new THREE.Group();
    this.object.name='Persistent object — never replaced or disassembled';
    this.scene.add(this.object);
    const geometry=meshGeometry(createVesselData(this.profile));
    const material=new THREE.ShaderMaterial({uniforms:this.uniforms,vertexShader:vesselVertex,fragmentShader:lacquerFragment,toneMapped:true});
    material.name='Original non-metallic lacquer progression';
    this.vessel=new THREE.Mesh(geometry,material);this.vessel.renderOrder=1;
    this.object.add(this.vessel);
    this.resources.push(geometry,material);

    const floorGeometry=new THREE.PlaneGeometry(12,12);
    const floorMaterial=new THREE.ShaderMaterial({uniforms:this.uniforms,vertexShader:floorVertex,fragmentShader:floorFragment,transparent:true,depthWrite:false,toneMapped:true});
    this.floor=new THREE.Mesh(floorGeometry,floorMaterial);
    this.floor.rotation.x=-Math.PI/2;this.floor.position.y=-.560;
    this.floor.renderOrder=0;
    this.object.add(this.floor);
    this.resources.push(floorGeometry,floorMaterial);

    const powder=powderGeometry(this.profile);
    const powderMaterial=new THREE.ShaderMaterial({uniforms:this.uniforms,vertexShader:goldVertex,fragmentShader:goldFragment,transparent:true,depthWrite:false,depthTest:true,toneMapped:true});
    this.powder=new THREE.Points(powder,powderMaterial);
    this.powder.renderOrder=2;this.powder.visible=false;
    this.object.add(this.powder);
    this.resources.push(powder,powderMaterial);
    this.ready=true;
    this.resize(this.width,this.height);
  }

  resize(width,height){
    this.width=Math.max(1,Math.round(Number(width)||1));
    this.height=Math.max(1,Math.round(Number(height)||1));
    if(!this.renderer)return;
    const mobile=this.width<760;
    const nativeDpr=globalThis.devicePixelRatio||1;
    const cap=this.quality==='high'?(mobile?2:1.75):this.quality==='low'?1:(mobile?1.6:1.35);
    const pixelBudget=this.quality==='high'?8900000:this.quality==='low'?1500000:4600000;
    this.dpr=Math.max(.5,Math.min(nativeDpr,cap,Math.sqrt(pixelBudget/(this.width*this.height))));
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(this.width,this.height,false);
    this.camera.aspect=this.width/this.height;
    this.camera.updateProjectionMatrix();
    this.uniforms.uResolution.value.set(this.width*this.dpr,this.height*this.dpr);
    this.uniforms.uDpr.value=this.dpr;
    this.powder.geometry.setDrawRange(0,this.quality==='low'?280:mobile?560:840);
    this.mobile=mobile;
  }

  render(state,timeSeconds=0,pointer={x:0,y:0},light=.5){
    if(!this.ready||this.contextLost||this.disposed)return false;
    if(this.needsRestoreResize){this.resize(this.width,this.height);this.needsRestoreResize=false;}
    const current={...defaults,...state};
    this.lastState=current;
    for(const field of materialFields){
      const value=Number(current[field]);
      this.uniforms[uniformName(field)].value=Number.isFinite(value)?value:defaults[field];
    }
    this.uniforms.uTime.value=Number.isFinite(timeSeconds)?timeSeconds:0;
    this.uniforms.uLight.value=clamp(Number(light)||0);
    this.uniforms.uPointer.value.set(clamp(pointer.x||0,-1,1),clamp(pointer.y||0,-1,1));

    const frame=getCameraFrame(current,this.width,this.height);
    this.camera.position.fromArray(frame.position);
    this.camera.lookAt(0,0,0);
    this.object.position.fromArray(frame.objectPosition);
    this.object.rotation.set(0,Number(current.turn)||0,0);
    this.object.scale.setScalar(frame.scale);
    this.powder.visible=current.gold>0&&current.gold<.999&&current.goldVeil<.02;
    const previousFrame=this.renderer.info.render.frame;
    this.renderer.render(this.scene,this.camera);
    return this.renderer.info.render.frame>previousFrame&&this.renderer.info.render.calls>0;
  }

  setQuality(quality='auto'){
    this.quality=['auto','high','low'].includes(quality)?quality:'auto';
    this.resize(this.width,this.height);
  }

  getDiagnostics(){
    const info=this.renderer?.info;
    return {
      initialized:this.ready,contextLost:this.contextLost,disposed:this.disposed,
      quality:this.quality,width:this.width,height:this.height,pixelRatio:this.dpr||1,
      drawingWidth:Math.round(this.width*(this.dpr||1)),drawingHeight:Math.round(this.height*(this.dpr||1)),
      phase:this.lastState.phase??0,renderFrame:info?.render.frame??0,drawCalls:info?.render.calls??0,triangles:info?.render.triangles??0,
      points:info?.render.points??0,geometries:info?.memory.geometries??0,textures:info?.memory.textures??0,
      programs:info?.programs?.length??0,webgl2:!!this.renderer?.capabilities.isWebGL2,
      material:'authored non-metallic lacquer shader',model:this.profile?.id??null,
      deterministic:true,
    };
  }

  dispose(){
    if(this.disposed)return;
    this.disposed=true;this.ready=false;
    this.canvas.removeEventListener('webglcontextlost',this.handleContextLost);
    this.canvas.removeEventListener('webglcontextrestored',this.handleContextRestored);
    for(const resource of this.resources)resource.dispose?.();
    this.resources.length=0;
    this.renderer?.dispose();
    this.scene?.clear();
  }
}
