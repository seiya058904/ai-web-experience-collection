import type * as Three from 'three';
import {
  CARGO_BLOCKS, CONTAINER_DIMENSIONS, DEFAULT_CONTAINER_STATE,
  describeContainerState, getContainerPose, normalizeContainerState, renderContainerFallback,
  type ContainerState,
} from './container-fallback';

export type { ContainerState, ContainerMode, ContainerHighlight } from './container-fallback';

export interface ContainerSceneController {
  /** One caller owns time. This method contains no easing or private RAF. */
  setState(state: Partial<ContainerState>): void;
  resize(): void;
  dispose(): void;
}

type Model = {
  scene: Three.Scene;
  camera: Three.OrthographicCamera;
  renderer: Three.WebGLRenderer;
  box: Three.Group;
  nearWall: Three.Object3D;
  roof: Three.Object3D;
  cargo: Three.Group;
  doors: readonly [Three.Group, Three.Group];
  road: Three.Group;
  rail: Three.Group;
  crane: Three.Group;
  spreader: Three.Group;
  cables: Three.Mesh[];
  fittings: Three.Mesh[];
  paint: Three.MeshStandardMaterial;
  doorPaint: Three.MeshStandardMaterial;
  fittingMaterial: Three.MeshStandardMaterial;
  geometries: Set<Three.BufferGeometry>;
  materials: Set<Three.Material>;
  textures: Set<Three.Texture>;
  vector: Three.Vector3;
  width: number;
  height: number;
};

/**
 * Starts immediately with the complete SVG study. Three is a lazy enhancement;
 * failed imports, absent WebGL and lost contexts retain the current real state.
 */
export function createContainerScene(host: HTMLElement): ContainerSceneController {
  let state = { ...DEFAULT_CONTAINER_STATE } as ContainerState;
  let model: Model | undefined;
  let disposed = false;
  let lost = false;
  let lastKey = '';
  let fallbackKey = '';
  const stage = document.createElement('div');
  stage.className = 'container-study';
  stage.style.cssText = 'position:relative;isolation:isolate;width:100%;height:100%;min-height:260px;overflow:hidden;';
  const fallback = document.createElement('div');
  fallback.className = 'container-study__fallback';
  fallback.style.cssText = 'position:absolute;inset:0;';
  const caption = document.createElement('div');
  caption.className = 'container-study__identity';
  caption.style.cssText = 'position:absolute;left:16px;bottom:16px;z-index:2;display:none;max-width:calc(100% - 32px);padding:9px 12px;background:#e8ebe6;color:#283138;font-family:inherit;font-size:12px;font-weight:500;line-height:1.5;pointer-events:none;';
  caption.innerHTML = '<strong style="display:block;font-size:13px;letter-spacing:.07em;">CARGO / BOX-001</strong><span style="font-size:11px;">Fictional exhibit ID · schematic geometry</span>';
  stage.append(fallback, caption);
  host.append(stage);
  host.dataset.containerId = 'BOX-001';
  host.dataset.containerRenderer = 'svg';

  function keyOf(s: ContainerState) {
    return [s.mode,s.progress.toFixed(4),s.packed,s.doorsOpen.toFixed(4),s.highlight,s.reduced].join('|');
  }

  function showFallback() {
    const key = keyOf(state);
    if (fallbackKey !== key) {
      fallback.innerHTML = renderContainerFallback(state);
      fallbackKey = key;
    }
    fallback.hidden = false;
    caption.style.display = 'none';
    if (model) model.renderer.domElement.style.visibility = 'hidden';
    host.dataset.containerRenderer = 'svg';
  }

  function applyState() {
    if (disposed) return;
    const pose = getContainerPose(state);
    host.dataset.containerMode = state.mode;
    host.dataset.containerPacked = String(state.packed);
    host.dataset.containerDoorsOpen = state.doorsOpen.toFixed(3);
    host.dataset.containerLiftContact = String(pose.contact);
    host.dataset.containerLift = pose.lift.toFixed(3);
    host.dataset.containerSpreaderGap = pose.gap.toFixed(3);
    stage.setAttribute('aria-label', describeContainerState(state));
    if (!model || lost || state.reduced) { showFallback(); return; }
    const { box, nearWall, roof, cargo, doors, road, rail, crane, spreader, cables, camera } = model;
    box.position.y = pose.base;
    nearWall.visible = state.mode !== 'interior';
    roof.visible = state.mode !== 'interior';
    cargo.visible = state.packed;
    doors[0].rotation.y = state.doorsOpen * Math.PI * 0.59;
    doors[1].rotation.y = -state.doorsOpen * Math.PI * 0.59;
    road.visible = state.mode === 'road';
    rail.visible = state.mode === 'rail';
    crane.visible = state.mode === 'lift';
    spreader.position.y = pose.spreaderY;
    const cableBottom = pose.spreaderY + 0.36;
    cables.forEach(cable => {
      cable.scale.y = 6.38 - cableBottom;
      cable.position.y = (6.38 + cableBottom) / 2;
    });
    model.doorPaint.color.set(state.highlight === 'doors' ? '#bd8844' : '#a64b3b');
    model.fittingMaterial.color.set(state.highlight === 'corners' ? '#e4aa4c' : '#5e6057');
    const focusY = state.mode === 'lift' ? 2.9 : (state.mode === 'road' || state.mode === 'rail') ? 1.55 : 1.23;
    const doorStudy = state.mode === 'doors' || state.mode === 'destination';
    camera.position.set(doorStudy ? 12.5 : 10.5, doorStudy ? 6.0 : 7.8, doorStudy ? 5.6 : 10.8);
    camera.lookAt(0.15, focusY, 0);
    const aspect = Math.max(0.2, model.width / model.height);
    const minWidth = state.mode === 'lift' ? 10.9 : state.mode === 'rail' ? 11.9 : state.mode === 'road' ? 10.5 : state.doorsOpen > 0.2 ? 10.5 : 9.8;
    const minHeight = state.mode === 'lift' ? 7.8 : state.mode === 'rail' || state.mode === 'road' ? 5.9 : 5.3;
    const frameHeight = Math.max(minHeight, minWidth / aspect);
    camera.left = -frameHeight * aspect / 2;
    camera.right = frameHeight * aspect / 2;
    camera.top = frameHeight / 2;
    camera.bottom = -frameHeight / 2;
    camera.updateProjectionMatrix();
    try {
      model.renderer.render(model.scene,camera);
      fallback.hidden = true;
      model.renderer.domElement.style.visibility = 'visible';
      caption.style.display = 'block';
      caption.style.outline = state.highlight === 'identity' ? '2px solid #b67a32' : 'none';
      host.dataset.containerRenderer = 'webgl';
      stage.setAttribute('role','img');
    } catch {
      lost = true;
      showFallback();
    }
  }

  function resize() {
    if (disposed) return;
    const width = Math.max(1,host.clientWidth);
    const height = Math.max(260,host.clientHeight);
    if (model && (model.width !== width || model.height !== height)) {
      model.width = width;
      model.height = height;
      model.renderer.setSize(width,height,false);
    }
    applyState();
  }

  function onLost(event: Event) {
    event.preventDefault();
    lost = true;
    showFallback();
  }
  function onRestored() {
    if (disposed) return;
    lost = false;
    applyState();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(host);
  showFallback();

  // Import resolution never changes the currently selected chapter or mode.
  void import('three').then(THREE => {
    if (disposed) return;
    try {
      model = buildModel(THREE,Math.max(1,host.clientWidth),Math.max(260,host.clientHeight));
      const canvas = model.renderer.domElement;
      canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
      canvas.setAttribute('aria-hidden','true');
      canvas.addEventListener('webglcontextlost',onLost,false);
      canvas.addEventListener('webglcontextrestored',onRestored,false);
      stage.insertBefore(canvas,caption);
      applyState();
    } catch {
      // Missing or denied GPU support is an expected alternate presentation.
      showFallback();
    }
  }).catch(() => { if (!disposed) showFallback(); });

  return {
    setState(next) {
      state = normalizeContainerState(next,state);
      const key = keyOf(state);
      if (key === lastKey) return;
      lastKey = key;
      applyState();
    },
    resize,
    dispose() {
      if (disposed) return;
      disposed = true;
      observer.disconnect();
      if (model) {
        const canvas = model.renderer.domElement;
        canvas.removeEventListener('webglcontextlost',onLost,false);
        canvas.removeEventListener('webglcontextrestored',onRestored,false);
        model.geometries.forEach(geometry => geometry.dispose());
        model.materials.forEach(material => material.dispose());
        model.textures.forEach(texture => texture.dispose());
        model.renderer.dispose();
        model.renderer.forceContextLoss();
      }
      stage.remove();
      delete host.dataset.containerRenderer;
    },
  };
}

function buildModel(THREE: typeof Three,width: number,height: number): Model {
  const { length: L,width: W,height: H } = CONTAINER_DIMENSIONS;
  const geometries = new Set<Three.BufferGeometry>();
  const materials = new Set<Three.Material>();
  const textures = new Set<Three.Texture>();
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ alpha:true,antialias:true,powerPreference:'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,1.6));
  renderer.setSize(width,height,false);
  renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const camera = new THREE.OrthographicCamera(-6,6,4,-4,0.1,70);

  function material(color: string,roughness = .7,metalness = .15) {
    const value = new THREE.MeshStandardMaterial({ color,roughness,metalness });
    materials.add(value);
    return value;
  }
  const paint = material('#a64b3b',.78,.18);
  const doorPaint = material('#a64b3b',.78,.18);
  const framePaint = material('#803c31',.8,.28);
  const fittingMaterial = material('#5e6057',.65,.63);
  const steel = material('#777e78',.42,.8);
  const darkSteel = material('#35424a',.75,.50);
  const deep = material('#202c2f',.9,.15);
  const tire = material('#252a2b',.99,0);
  const wood = material('#b9a078',.92,0);
  const woodDark = material('#7e6e53',.94,0);
  const amber = material('#bd8a46',.64,.43);
  const scratch = material('#d0a46b',.93,.10);
  const floorMaterials = ['#b6a383','#aa987d','#bcaa8b','#a6977b'].map(c => material(c,.95,0));

  // Deterministic, authored surface variation; no photographs or baked text.
  const texCanvas = document.createElement('canvas');
  texCanvas.width=128; texCanvas.height=128;
  const ctx=texCanvas.getContext('2d');
  if(ctx) {
    let seed=1977;
    const random=() => { seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; };
    const pixels=ctx.createImageData(128,128);
    for(let i=0;i<pixels.data.length;i+=4) {
      const n=220+Math.floor(random()*35);
      pixels.data[i]=n; pixels.data[i+1]=n; pixels.data[i+2]=n; pixels.data[i+3]=255;
    }
    ctx.putImageData(pixels,0,0);
    ctx.strokeStyle='rgba(55,40,30,.13)';
    for(let i=0;i<23;i++) { const x=random()*128; const y=random()*128; ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+random()*1.5,y+random()*30);ctx.stroke(); }
    const texture=new THREE.CanvasTexture(texCanvas);
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
    texture.repeat.set(2,1);
    texture.colorSpace=THREE.SRGBColorSpace;
    textures.add(texture);
    paint.map=texture;doorPaint.map=texture;
  }
  const box = new THREE.Group();
  box.name='BOX-001';
  box.userData={ id:'BOX-001',fictional:true,units:'m',dimensions:CONTAINER_DIMENSIONS };
  scene.add(box);
  function mesh(geometry: Three.BufferGeometry,mat: Three.Material,parent: Three.Object3D=box) {
    geometries.add(geometry);
    const value=new THREE.Mesh(geometry,mat);
    value.castShadow=true;value.receiveShadow=true;parent.add(value);return value;
  }
  function block(parent: Three.Object3D,x: number,y: number,z: number,sx: number,sy: number,sz: number,mat: Three.Material) {
    const value=mesh(new THREE.BoxGeometry(sx,sy,sz),mat,parent);value.position.set(x,y,z);return value;
  }
  function rod(parent: Three.Object3D,a: Three.Vector3,b: Three.Vector3,r: number,mat: Three.Material) {
    const delta=new THREE.Vector3().subVectors(b,a);
    const value=mesh(new THREE.CylinderGeometry(r,r,delta.length(),10),mat,parent);
    value.position.copy(a).add(b).multiplyScalar(.5);
    value.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return value;
  }

  // Corrugations are one measured sheet mesh per long wall, with actual depth.
  function corrugatedWall(z: number): Three.Mesh {
    const positions:number[]=[];
    const count=24;
    const start=-L/2+.15,end=L/2-.15;
    const pitch=(end-start)/count;
    const sign=Math.sign(z);
    for(let rib=0;rib<count;rib++) {
      const base=start+rib*pitch;
      const xx=[base,base+pitch*.25,base+pitch*.40,base+pitch*.75,base+pitch*.90,base+pitch];
      const zz=[z,z,z+sign*.043,z+sign*.043,z,z];
      for(let k=0;k<5;k++) {
        const a=[xx[k],.18,zz[k]],b=[xx[k+1],.18,zz[k+1]],c=[xx[k+1],H-.18,zz[k+1]],d=[xx[k],H-.18,zz[k]];
        positions.push(...a,...b,...c,...a,...c,...d);
      }
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.computeVertexNormals();
    const mat=paint.clone();mat.side=THREE.DoubleSide;materials.add(mat);
    return mesh(geometry,mat);
  }
  const nearWall=corrugatedWall(W/2-.045);
  corrugatedWall(-W/2+.045);
  block(box,-L/2+.045,H/2,0,.09,H-.2,W-.13,paint);
  for(const z of [-W/2+.055,W/2-.055]) {
    block(box,0,.11,z,L,.22,.11,framePaint);
    block(box,0,H-.07,z,L,.14,.11,framePaint);
  }
  for(const x of [-L/2+.065,L/2-.065]) {
    for(const z of [-W/2+.065,W/2-.065]) block(box,x,H/2,z,.13,H,.13,framePaint);
    block(box,x,H-.075,0,.13,.15,W,framePaint);
    block(box,x,.09,0,.13,.18,W,framePaint);
  }
  const roof=new THREE.Group();box.add(roof);
  block(roof,0,H-.055,0,L-.17,.055,W-.15,paint);
  for(let x=-L/2+.22;x<L/2-.16;x+=.24) block(roof,x,H-.025,0,.045,.025,W-.18,framePaint);
  block(box,0,.12,0,L-.17,.14,W-.14,darkSteel);
  for(let i=0;i<8;i++) block(box,0,.205,-W/2+.19+i*(W-.26)/8,L-.19,.055,(W-.26)/8-.012,floorMaterials[i%4]);

  const fittings:Three.Mesh[]=[];
  // Apertures are schematic cast-fitting openings, not claimed ISO tolerances.
  const apertureShape=new THREE.Shape();
  apertureShape.moveTo(-.085,-.09);apertureShape.lineTo(.085,-.09);apertureShape.lineTo(.085,.09);apertureShape.lineTo(-.085,.09);apertureShape.closePath();
  const aperture=new THREE.Path();aperture.absellipse(0,0,.034,.056,0,Math.PI*2,true,0);apertureShape.holes.push(aperture);
  const castingGeometry=new THREE.ExtrudeGeometry(apertureShape,{ depth:.055,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.006,bevelThickness:.004 });
  geometries.add(castingGeometry);
  for(const x of [-L/2+.09,L/2-.09]) for(const z of [-W/2+.09,W/2-.09]) for(const y of [.09,H-.09]) {
    const core=block(box,x,y,z,.10,.17,.10,fittingMaterial);fittings.push(core);
    const opening=mesh(castingGeometry,fittingMaterial);opening.rotation.y=x>0?Math.PI/2:-Math.PI/2;opening.position.set(x+(x>0?.03:-.03),y,z);fittings.push(opening);
    const recess=block(box,x+(x>0?.052:-.052),y,z,.003,.12,.073,deep);recess.castShadow=false;
    const sideOpening=mesh(castingGeometry,fittingMaterial);sideOpening.rotation.y=z>0?0:Math.PI;sideOpening.position.set(x,y,z+(z>0?.03:-.03));fittings.push(sideOpening);
    const sideRecess=block(box,x,y,z+(z>0?.052:-.052),.075,.12,.003,deep);sideRecess.castShadow=false;
  }

  const doors:Three.Group[]=[];
  for(const sign of [-1,1]) {
    const door=new THREE.Group();door.position.set(L/2-.055,0,sign*(W/2-.09));box.add(door);doors.push(door);
    const doorWidth=W/2-.105;
    const midZ=-sign*doorWidth/2;
    block(door,.005,H/2,midZ,.072,H-.29,doorWidth,doorPaint);
    for(const y of [.32,.92,1.52,2.21]) block(door,.048,y,midZ,.026,.055,doorWidth-.06,framePaint);
    const rodZ=midZ;
    rod(door,new THREE.Vector3(.108,.24,rodZ),new THREE.Vector3(.108,H-.18,rodZ),.022,steel);
    for(const y of [.32,.80,1.5,2.28]) block(door,.111,y,rodZ,.044,.055,.085,steel);
    rod(door,new THREE.Vector3(.137,.51,rodZ),new THREE.Vector3(.137,.51,rodZ+sign*.23),.019,steel);
    for(const y of [.46,1.30,2.13]) {
      rod(door,new THREE.Vector3(.015,y-.07,0),new THREE.Vector3(.015,y+.07,0),.031,steel);
      block(door,.044,y,-sign*.1,.025,.065,.23,framePaint);
    }
    if(sign===-1) {
      rod(door,new THREE.Vector3(.049,1.80,doorWidth*.18),new THREE.Vector3(.049,2.28,doorWidth*.68),.012,scratch);
      rod(door,new THREE.Vector3(.052,1.94,doorWidth*.30),new THREE.Vector3(.052,2.20,doorWidth*.57),.005,woodDark);
    }
  }
  const cargo=new THREE.Group();box.add(cargo);
  for(const c of CARGO_BLOCKS) {
    block(cargo,c.x,.235+c.height/2,c.z,c.width,c.height,c.depth,wood);
    for(const dx of [-.35,.35]) {
      block(cargo,c.x+dx,.235+c.height/2,c.z+c.depth/2+.008,.035,c.height,.013,woodDark);
      block(cargo,c.x+dx,.235+c.height+.006,c.z,.035,.012,c.depth,woodDark);
    }
    for(const dz of [-.32,.32]) block(cargo,c.x,.22,c.z+dz,c.width+.01,.09,.08,woodDark);
  }

  function wheel(parent: Three.Group,x: number,z: number,radius: number,centerY: number,railWheel=false) {
    const body=mesh(new THREE.CylinderGeometry(radius,radius,railWheel?.13:.23,24),railWheel?darkSteel:tire,parent);
    body.rotation.x=Math.PI/2;body.position.set(x,centerY,z);
    const hub=mesh(new THREE.CylinderGeometry(radius*.46,radius*.46,railWheel?.15:.25,16),steel,parent);hub.rotation.x=Math.PI/2;hub.position.copy(body.position);
    if(railWheel) {const flange=mesh(new THREE.CylinderGeometry(radius+.035,radius+.035,.028,24),steel,parent);flange.rotation.x=Math.PI/2;flange.position.set(x,centerY,z-Math.sign(z)*.07);}
  }
  const road=new THREE.Group();scene.add(road);
  for(const z of [-.91,.91]) block(road,0,.975,z,6.60,.25,.2,darkSteel);
  for(const x of [-2.94,2.94]) {
    block(road,x,1.10,0,.2,.08,2.32,darkSteel);
    for(const z of [-1.13,1.13]) block(road,x,1.145,z,.12,.01,.12,steel);
  }
  for(const x of [-2.28,1.45,2.33]) {
    rod(road,new THREE.Vector3(x,.42,-1.16),new THREE.Vector3(x,.42,1.16),.06,darkSteel);
    for(const z of [-1.10,1.10]) wheel(road,x,z,.42,.42);
  }
  block(road,-3.32,.91,0,.45,.14,.50,steel);
  const rail=new THREE.Group();scene.add(rail);
  for(let x=-5.1;x<5.2;x+=.59) block(rail,x,.055,0,.16,.11,2.9,woodDark);
  for(const z of [-.85,.85]) {
    block(rail,0,.16,z,10.8,.09,.065,steel);
    block(rail,0,.11,z,10.8,.045,.13,darkSteel);
  }
  block(rail,0,.895,0,6.64,.21,2.28,darkSteel);
  for(const x of [-2.40,-1.68,1.68,2.40]) {
    rod(rail,new THREE.Vector3(x,.495,-1.02),new THREE.Vector3(x,.495,1.02),.06,steel);
    for(const z of [-.85,.85]) wheel(rail,x,z,.29,.495,true);
  }
  for(const x of [-2.04,2.04]) for(const z of [-1.02,1.02]) block(rail,x,.62,z,1.1,.25,.10,steel);
  for(const x of [-2.94,2.94]) for(const z of [-1.13,1.13]) block(rail,x,.995,z,.12,.01,.12,steel);

  const crane=new THREE.Group();scene.add(crane);
  const spreader=new THREE.Group();crane.add(spreader);
  for(const z of [-W/2+.09,W/2-.09]) block(spreader,0,.27,z,L-.04,.18,.14,amber);
  for(const x of [-L/2+.09,L/2-.09]) {
    block(spreader,x,.27,0,.16,.18,W-.04,amber);
    for(const z of [-W/2+.09,W/2-.09]) block(spreader,x,.10,z,.14,.20,.14,darkSteel);
  }
  block(spreader,0,.32,0,1.12,.30,1.30,darkSteel);
  const cables:Three.Mesh[]=[];
  for(const x of [-2.5,2.5]) for(const z of [-.92,.92]) {
    const cable=mesh(new THREE.CylinderGeometry(.012,.012,1,8),steel,crane);
    cable.position.set(x,5,z);cables.push(cable);
  }
  block(crane,0,6.52,0,7.2,.28,2.16,darkSteel);
  for(const x of [-3.40,3.40]) for(const z of [-.90,.90]) block(crane,x,6.73,z,.30,.14,.30,steel);

  scene.add(new THREE.HemisphereLight('#e2ece8','#55504a',2.1));
  const light=new THREE.DirectionalLight('#fff0d2',3.3);
  light.position.set(3,9,6);light.castShadow=true;
  light.shadow.mapSize.set(1024,1024);
  light.shadow.camera.left=-7;light.shadow.camera.right=7;light.shadow.camera.top=8;light.shadow.camera.bottom=-7;
  light.shadow.camera.near=.1;light.shadow.camera.far=30;light.shadow.bias=-.0006;light.shadow.normalBias=.025;
  scene.add(light);
  const fill=new THREE.DirectionalLight('#c4d9e3',1.1);fill.position.set(-6,4,-3);scene.add(fill);
  const shadowMat=new THREE.ShadowMaterial({ color:'#283138',opacity:.16 });materials.add(shadowMat);
  const ground=mesh(new THREE.PlaneGeometry(30,30),shadowMat,scene);ground.rotation.x=-Math.PI/2;ground.position.y=-.015;ground.castShadow=false;ground.receiveShadow=true;

  return { scene,camera,renderer,box,nearWall,roof,cargo,doors:doors as [Three.Group,Three.Group],road,rail,crane,spreader,cables,fittings,paint,doorPaint,fittingMaterial,geometries,materials,textures,vector:new THREE.Vector3(),width,height };
}
