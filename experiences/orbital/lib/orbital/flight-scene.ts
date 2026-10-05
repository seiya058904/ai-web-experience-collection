import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { POSES, MOBILE, COMPACT, type Pose } from './poses';
import { createRasterFlightScene } from './raster-scene';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { sceneBlend, clamp, smooth, type Destination, type Subsystem } from './mission';

export interface FlightScene {render:(progress:number,time:number,reduced:boolean,destination:Destination,subsystem:Subsystem)=>void;resize:(width:number,height:number)=>void;destroy:()=>void;stats:()=>{drawCalls:number;triangles:number;dpr:number};}

export function createFlightScene(canvas: HTMLCanvasElement, onStatus:(status:string)=>void): FlightScene | null {
  let renderer: THREE.WebGLRenderer;
  try { const context=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'high-performance'}); if(!context)return createRasterFlightScene(canvas,onStatus); renderer=new THREE.WebGLRenderer({canvas,context,alpha:true,antialias:true,powerPreference:'high-performance'}); }
  catch { return createRasterFlightScene(canvas,onStatus); }
  renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(36,1,.1,220);camera.position.set(0,0,26);camera.lookAt(0,0,0);
  let width=1,height=1,mobile=false,disposed=false,contextLost=false,pixelRatio=1;
  let compatibilityScene:FlightScene|null=null;let compatibilityCanvas:HTMLCanvasElement|null=null;
  function activateCompatibility(){if(compatibilityScene||disposed)return;compatibilityCanvas=document.createElement('canvas');compatibilityCanvas.className=canvas.className;canvas.parentNode?.insertBefore(compatibilityCanvas,canvas.nextSibling);compatibilityScene=createRasterFlightScene(compatibilityCanvas,onStatus);compatibilityScene?.resize(width,height);canvas.style.visibility='hidden';}
  const worldHeight=2*Math.tan(THREE.MathUtils.degToRad(18))*26;
  const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;room.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xc3e0ff,0x10151f,2.2));
  const sun=new THREE.DirectionalLight(0xe0edff,4.5);sun.position.set(-5,8,12);scene.add(sun);
  const rim=new THREE.DirectionalLight(0xffad76,2.6);rim.position.set(8,0,-3);scene.add(rim);
  const fill=new THREE.DirectionalLight(0x7ba8d3,1.4);fill.position.set(-9,-5,5);scene.add(fill);

  // One persistent engineering object survives all eight chapters.
  const vehicle=new THREE.Group();scene.add(vehicle);
  const body=new THREE.Group();vehicle.add(body);
  const groups:Record<string,THREE.Object3D>={};
  const materials: {material:THREE.MeshStandardMaterial;group:string}[]=[];
  const loader=new GLTFLoader();
  loader.load((import.meta.env.BASE_URL + 'orbital/media/launch-vehicle.glb'),gltf=>{
    if(disposed){disposeObject(gltf.scene);return;}
    body.add(gltf.scene);
    for(const key of ['booster','interstage','upperstage','fairing','engines']){const part=gltf.scene.getObjectByName(key);if(part)groups[key]=part;}
    gltf.scene.traverse(obj=>{if(obj instanceof THREE.Mesh){const m=obj.material;if(m instanceof THREE.MeshStandardMaterial){obj.material=m.clone();const own=obj.material as THREE.MeshStandardMaterial;own.envMapIntensity=1.4;let g=obj.parent;while(g&&!(g.name in groups))g=g.parent;materials.push({material:own,group:g?.name||''});}}});
    lastSubsystem='';onStatus('webgl');
  },undefined,()=>onStatus('partial'));

  // Refractive-looking, bounded exhaust. No full-screen blur or post-processing.
  const flameUniforms={uTime:{value:0},uIntensity:{value:0}};
  const flameMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,uniforms:flameUniforms,
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'varying vec2 vUv; uniform float uTime; uniform float uIntensity; void main(){float f=sin(vUv.y*52.0-uTime*14.0)*.05+sin(vUv.x*32.0+uTime*8.0)*.03;float end=smoothstep(0.0,.25,vUv.y);float side=pow(max(0.0,1.0-abs(vUv.x-.5)*1.7),1.3);float alpha=end*side*(.72+f)*uIntensity;vec3 hot=mix(vec3(1.0,.19,.015),vec3(1.0,.92,.72),pow(vUv.y,2.0));gl_FragColor=vec4(hot,alpha);}'
  });
  const flame=new THREE.Mesh(new THREE.CylinderGeometry(.36,.02,3.8,28,8,true),flameMaterial);flame.position.y=-7.6;vehicle.add(flame);
  const coreMaterial=new THREE.MeshBasicMaterial({color:0xb5ddff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
  const core=new THREE.Mesh(new THREE.CylinderGeometry(.16,.015,1.5,20,1,true),coreMaterial);core.position.y=-6.48;vehicle.add(core);
  const engineLight=new THREE.PointLight(0xff6b23,0,14,2);engineLight.position.set(0,-5.7,1);vehicle.add(engineLight);

  const textureLoader=new THREE.TextureLoader();
  const earthMap=textureLoader.load((import.meta.env.BASE_URL + 'orbital/media/earth-texture.png'),()=>{if(!disposed)onStatus('webgl');});earthMap.colorSpace=THREE.SRGBColorSpace;earthMap.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  const earthRoot=new THREE.Group();scene.add(earthRoot);
  const earthMaterial=new THREE.MeshPhongMaterial({map:earthMap,color:0xcddded,shininess:9,specular:0x243e56,transparent:true,opacity:1});
  const earth=new THREE.Mesh(new THREE.SphereGeometry(1,80,56),earthMaterial);earthRoot.add(earth);
  const cloudMap=textureLoader.load((import.meta.env.BASE_URL + 'orbital/media/cloud-texture.jpg'),()=>{if(!disposed)onStatus('webgl');});
  const cloudMaterial=new THREE.MeshPhongMaterial({alphaMap:cloudMap,color:0xf4f7fa,transparent:true,opacity:.87,depthWrite:false,shininess:0});
  const clouds=new THREE.Mesh(new THREE.SphereGeometry(1.007,72,48),cloudMaterial);earthRoot.add(clouds);
  const atmosphereMaterial=new THREE.ShaderMaterial({transparent:true,side:THREE.BackSide,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uOpacity:{value:1}},vertexShader:'varying vec3 vN;varying vec3 vP;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vN=normalize(normalMatrix*normal);vP=mv.xyz;gl_Position=projectionMatrix*mv;}',fragmentShader:'varying vec3 vN;varying vec3 vP;uniform float uOpacity;void main(){float f=pow(1.0-abs(dot(normalize(vN),normalize(-vP))),3.5);gl_FragColor=vec4(.19,.52,.92,f*.52*uOpacity);}'});
  const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(1.026,64,40),atmosphereMaterial);earthRoot.add(atmosphere);
  const moonMap=textureLoader.load((import.meta.env.BASE_URL + 'orbital/media/moon-texture.jpg'),()=>{if(!disposed)onStatus('webgl');});moonMap.colorSpace=THREE.SRGBColorSpace;
  const moonMaterial=new THREE.MeshPhongMaterial({map:moonMap,color:0xc4c9cf,shininess:1,transparent:true});
  const moon=new THREE.Mesh(new THREE.SphereGeometry(1,64,44),moonMaterial);scene.add(moon);

  // True 3D orbital paths are occluded by the globe on their far side.
  const orbitRoot=new THREE.Group();scene.add(orbitRoot);
  const orbitMaterials:THREE.LineBasicMaterial[]=[];
  for(let i=0;i<3;i++){
    const points=[];for(let j=0;j<=220;j++){const a=j/220*Math.PI*2;points.push(new THREE.Vector3(Math.cos(a)*(6.5+i*.35),0,Math.sin(a)*(6.5+i*.35)));}
    const mat=new THREE.LineBasicMaterial({color:i===0?0xd4e5ed:0x5b8396,transparent:true,opacity:0,depthWrite:false});orbitMaterials.push(mat);
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),mat);line.rotation.z=.24+i*.55;line.rotation.x=.18+i*.18;orbitRoot.add(line);
  }
  const beacon=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),new THREE.MeshBasicMaterial({color:0xe7f5ff}));orbitRoot.add(beacon);

  let seed=108;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
  const starCount=1250;const starPositions=new Float32Array(starCount*3);const starSizes=new Float32Array(starCount);
  for(let i=0;i<starCount;i++){starPositions[i*3]=(random()-.5)*100;starPositions[i*3+1]=(random()-.5)*70;starPositions[i*3+2]=-5-random()*70;starSizes[i]=.55+Math.pow(random(),5)*2.5;}
  const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.BufferAttribute(starPositions,3));starGeometry.setAttribute('aSize',new THREE.BufferAttribute(starSizes,1));
  const starMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uOpacity:{value:.4},uDpr:{value:1}},vertexShader:'attribute float aSize;uniform float uDpr;varying float vSize;void main(){vSize=aSize;vec4 p=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*p;gl_PointSize=aSize*uDpr*1.1;}',fragmentShader:'uniform float uOpacity;varying float vSize;void main(){float d=length(gl_PointCoord-.5);float a=1.0-smoothstep(.08,.5,d);gl_FragColor=vec4(.77,.85,.95,a*uOpacity*(.45+vSize*.23));}'});
  const stars=new THREE.Points(starGeometry,starMaterial);scene.add(stars);
  const trailPoints=[];for(let i=0;i<=150;i++){const t=i/150;trailPoints.push(new THREE.Vector3(-8+t*15,2.6-Math.pow(t,2)*4.1,-1));}
  const trailMaterial=new THREE.LineBasicMaterial({color:0x8ba4b6,transparent:true,opacity:0});const trail=new THREE.Line(new THREE.BufferGeometry().setFromPoints(trailPoints),trailMaterial);scene.add(trail);

  let lastSubsystem='';let destinationMix=0;let lastTime=0;
  function resize(w:number,h:number){width=Math.max(1,w);height=Math.max(1,h);mobile=width<=760;pixelRatio=Math.min(window.devicePixelRatio||1,mobile?1.5:1.5,Math.sqrt(4200000/(width*height)));renderer.setPixelRatio(pixelRatio);renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();starMaterial.uniforms.uDpr.value=pixelRatio;starGeometry.setDrawRange(0,mobile?600:starCount);compatibilityScene?.resize(width,height);}
  function render(progress:number,time:number,reduced:boolean,destination:Destination,subsystem:Subsystem){
    if(disposed)return;if(compatibilityScene){compatibilityScene.render(progress,time,reduced,destination,subsystem);return;}if(contextLost)return;
    const b=sceneBlend(progress);const from={...POSES[b.from],...(mobile?MOBILE[b.from]:height<500?COMPACT[b.from]:{})};const to={...POSES[b.to],...(mobile?MOBILE[b.to]:height<500?COMPACT[b.to]:{})};
    const pose={} as Pose;for(const key of Object.keys(from) as (keyof Pose)[])pose[key]=THREE.MathUtils.lerp(from[key],to[key],b.mix);
    const dt=Math.min(.05,Math.max(0,time-lastTime));lastTime=time;
    const ambient=reduced?0:time;
    const wFactor=mobile?1:Math.min(1.3,camera.aspect/1.776);
    vehicle.position.set(pose.x*wFactor,pose.y+(reduced?0:Math.sin(ambient*.24)*.035),0);vehicle.scale.setScalar(pose.scale);vehicle.rotation.set(.035,pose.ry+(reduced?0:Math.sin(ambient*.09)*.06),pose.rz);
    const orbitFlight=smooth((progress-4.95)/.33)*(1-smooth((progress-5.76)/.55));
    if(orbitFlight>0){const angle=(progress-5.0)*2.0+(mobile?-2.95:-.15);const ox=pose.ex+Math.cos(angle)*pose.er*1.26;const oy=pose.ey-Math.sin(angle)*pose.er*.47;vehicle.position.x=THREE.MathUtils.lerp(vehicle.position.x,ox*wFactor,orbitFlight);vehicle.position.y=THREE.MathUtils.lerp(vehicle.position.y,oy,orbitFlight);vehicle.position.z=Math.sin(angle)*pose.er*.55*orbitFlight;vehicle.rotation.z=THREE.MathUtils.lerp(pose.rz,-angle-1.85,orbitFlight);}
    const upperOnly=smooth((progress-4.72)/.55);
    if(groups.booster){groups.booster.position.y=-pose.split*1.1;groups.booster.position.x=-pose.split*.25*(1-upperOnly);groups.booster.visible=upperOnly<.995;}
    if(groups.engines){groups.engines.position.y=-pose.split*1.6;groups.engines.position.x=-pose.split*.25*(1-upperOnly);groups.engines.visible=upperOnly<.995;}
    if(groups.interstage){groups.interstage.position.y=-pose.split*.4;groups.interstage.visible=upperOnly<.995;}
    if(groups.upperstage)groups.upperstage.position.y=pose.split*.8;
    if(groups.fairing)groups.fairing.position.y=pose.split*1.55;
    body.position.y=upperOnly*-2.6;
    for(const item of materials){if(['booster','engines','interstage'].includes(item.group)){item.material.opacity=1-upperOnly;item.material.transparent=upperOnly>.001;item.material.depthWrite=upperOnly<.1;}}
    flame.position.y=upperOnly>0.5?-3.2:-7.6-pose.split*1.6;flame.scale.y=1+Math.sin(ambient*13)*.04;flameUniforms.uTime.value=ambient;flameUniforms.uIntensity.value=pose.flame;flame.visible=pose.flame>.005;
    coreMaterial.opacity=pose.flame*.5;core.position.y=upperOnly>0.5?-2.4:-6.48-pose.split*1.6;core.visible=pose.flame>.005;engineLight.intensity=pose.flame*6;
    if(subsystem!==lastSubsystem){lastSubsystem=subsystem;for(const item of materials){const chosen=subsystem==='propulsion'?item.group==='engines':subsystem==='structure'?item.group==='booster':subsystem==='guidance'?item.group==='interstage':item.group==='fairing';item.material.emissive.set(chosen?0x092a38:0x000000);item.material.emissiveIntensity=chosen?.35:0;}}
    earthRoot.visible=pose.earth>.002;earthRoot.position.set(pose.ex*wFactor,pose.ey,-2.3);earthRoot.scale.setScalar(pose.er);earth.rotation.y=.2+progress*.045+ambient*.0007;earth.rotation.z=.10;earthMaterial.opacity=pose.earth;cloudMaterial.opacity=pose.earth*.87;clouds.rotation.copy(earth.rotation);atmosphereMaterial.uniforms.uOpacity.value=pose.earth;
    orbitRoot.position.copy(earthRoot.position);orbitRoot.scale.setScalar(pose.er/5.3);orbitRoot.visible=pose.orbit>.005;for(let i=0;i<orbitMaterials.length;i++)orbitMaterials[i].opacity=pose.orbit*(i===0?.8:.37);beacon.position.set(Math.cos(progress*1.1)*6.5,0,Math.sin(progress*1.1)*6.5);beacon.visible=pose.orbit>.25;
    const target=destination==='moon'?1:0;destinationMix=reduced?target:THREE.MathUtils.lerp(destinationMix,target,1-Math.exp(-dt*7));
    const destinationWindow=smooth((progress-5.74)/.45)*(1-smooth((progress-6.72)/.46));
    moon.visible=destinationWindow*destinationMix>.001;moonMaterial.opacity=destinationWindow*destinationMix;moon.position.set(mobile?1.7:6.1*wFactor,mobile?-3.0:0,-2);moon.scale.setScalar(mobile?3.8:5.25);moon.rotation.y=2.5+ambient*.003;
    starMaterial.uniforms.uOpacity.value=pose.star;stars.rotation.y=(progress*.006)+(reduced?0:ambient*.00025);stars.rotation.z=progress*-.006;
    trailMaterial.opacity=smooth((progress-6.75)/.5)*.26;trail.visible=trailMaterial.opacity>.001;
    rim.intensity=2.0+pose.flame*3.2;
    renderer.render(scene,camera);
  }
  function lost(event:Event){event.preventDefault();contextLost=true;activateCompatibility();}
  function restored(){contextLost=false;compatibilityScene?.destroy();compatibilityScene=null;compatibilityCanvas?.remove();compatibilityCanvas=null;canvas.style.visibility='';resize(width,height);onStatus('webgl');}
  canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('webglcontextrestored',restored);
  function destroy(){disposed=true;compatibilityScene?.destroy();compatibilityCanvas?.remove();canvas.style.visibility='';canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('webglcontextrestored',restored);disposeObject(scene);earthMap.dispose();moonMap.dispose();cloudMap.dispose();environment.dispose();renderer.dispose();}
  return{render,resize,destroy,stats:()=>compatibilityScene?.stats()??({drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,dpr:pixelRatio})};
}
function disposeObject(object:THREE.Object3D){const geometries=new Set<THREE.BufferGeometry>();const mats=new Set<THREE.Material>();object.traverse(item=>{if(item instanceof THREE.Mesh||item instanceof THREE.Line||item instanceof THREE.Points){geometries.add(item.geometry);for(const m of Array.isArray(item.material)?item.material:[item.material])mats.add(m);}});geometries.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());}
