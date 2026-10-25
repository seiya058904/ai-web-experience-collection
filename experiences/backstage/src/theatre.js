import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createMaterials } from './materials.js';
import { mechanism, smooth, lerp, clamp } from './state.js';

const TAU = Math.PI * 2;
const up = new THREE.Vector3(0, 1, 0);
const scenicFlats = Object.freeze([[-3.88,.66,1.72,4.70,.64],[-2.32,-1.92,4.30,4.95,0],[3.30,-2.03,1.76,4.95,0],[4.60,1.50,1.48,4.70,-.95]].map(spec=>Object.freeze(spec)));

// These dimensions are shared by the actual meshes and the CPU clearance checks.
// Coordinates are artistic model units, not construction specifications.
const liftLayout = Object.freeze({
  radius: 3.72, deckBottom: .085, deckTop: .215,
  floorBottom: -.05, floorTop: .09, baseTop: -1.18,
  parkedY: -1.05, raisedY: .13, boardBottom: -.05, boardDepth: .075,
  horizontalTravel: .055, maximumTurn: .05,
  slotBack: -.16, slotFront: .10,
  guideZ: -.078, guideWidth: .028, guideBottom: -1.10, guideTop: .36,
  sliderY: .14, sliderHeight: .10, sliderInnerWidth: .16, sliderInnerDepth: .055,
  sliderOuterWidth: .20, sliderOuterDepth: .105,
  rows: Object.freeze([
    Object.freeze({ z: -.53, width: 6.9, notch: 1.37 }),
    Object.freeze({ z: .83, width: 5.4, notch: .94 }),
    Object.freeze({ z: 2.18, width: 5.6, notch: -.20 }),
  ]),
});

const cross2 = (a, b, p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
function clipHalfPlane(polygon, a, b, inside = true) {
  const out = [], sign = inside ? 1 : -1;
  for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i], q = polygon[(i + 1) % polygon.length];
    const dp = sign * cross2(a, b, p), dq = sign * cross2(a, b, q);
    const pin = dp >= -1e-10, qin = dq >= -1e-10;
    if (pin) out.push(p);
    if (pin !== qin) {
      const t = dp / (dp - dq);
      out.push([lerp(p[0], q[0], t), lerp(p[1], q[1], t)]);
    }
  }
  return out;
}
function convexHull(points) {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const lower = [], upper = [];
  for (const p of sorted) {
    while (lower.length > 1 && cross2(lower.at(-2), lower.at(-1), p) <= 0) lower.pop();
    lower.push(p);
  }
  for (const p of sorted.reverse()) {
    while (upper.length > 1 && cross2(upper.at(-2), upper.at(-1), p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop(); upper.pop();
  return [...lower, ...upper];
}
function subtractConvex(polygon, cut) {
  const remaining = [];
  let inside = polygon;
  for (let i = 0; i < cut.length && inside.length >= 3; i++) {
    const a = cut[i], b = cut[(i + 1) % cut.length];
    const outside = clipHalfPlane(inside, a, b, false);
    if (outside.length >= 3) remaining.push(outside);
    inside = clipHalfPlane(inside, a, b, true);
  }
  return remaining;
}
function geometryLayout() {
  const circle = Array.from({ length: 128 }, (_, i) => [
    Math.cos(i / 128 * TAU) * liftLayout.radius,
    Math.sin(i / 128 * TAU) * liftLayout.radius,
  ]);
  const deck = [];
  const intervals = [-liftLayout.radius];
  for (const row of liftLayout.rows) intervals.push(row.z + liftLayout.slotBack, row.z + liftLayout.slotFront);
  intervals.push(liftLayout.radius);
  for (let i = 0; i < intervals.length; i += 2) {
    let polygon = clipHalfPlane(circle, [-10, intervals[i]], [10, intervals[i]]);
    polygon = clipHalfPlane(polygon, [10, intervals[i + 1]], [-10, intervals[i + 1]]);
    if (polygon.length >= 3) deck.push(polygon);
  }
  // A convex swept opening includes every yaw between 0 and .05 radians.
  // The extra .04 margin absorbs the tiny arc/chord approximation and the
  // entire .055 horizontal motion. Every cut remains inside the circular deck.
  const cuts = liftLayout.rows.map(row => {
    const half = row.width / 2 + liftLayout.horizontalTravel + .04;
    const corners = [[-half, row.z + liftLayout.slotBack], [half, row.z + liftLayout.slotBack],
      [half, row.z + liftLayout.slotFront], [-half, row.z + liftLayout.slotFront]];
    const swept = [];
    for (let i = 0; i <= 2; i++) {
      const angle = i / 2 * liftLayout.maximumTurn;
      for (const [x, z] of corners) swept.push([x * Math.cos(angle) + z * Math.sin(angle), -x * Math.sin(angle) + z * Math.cos(angle)]);
    }
    return convexHull(swept);
  });
  const floor = [];
  for (let plank = 0; plank < 25; plank++) {
    const x = -6 + plank * .5;
    let pieces = [[[x - .238, -4], [x + .238, -4], [x + .238, 4], [x - .238, 4]]];
    for (const cut of cuts) pieces = pieces.flatMap(piece => subtractConvex(piece, cut));
    for (const polygon of pieces) floor.push({ plank, polygon });
  }
  return { dimensions: liftLayout, deck, floor, cuts };
}
function horizontalSolid(polygon, bottom, top) {
  const shape = new THREE.Shape(polygon.map(([x, z]) => new THREE.Vector2(x, z)));
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: top - bottom, bevelEnabled: false, steps: 1 });
  geometry.rotateX(Math.PI / 2); geometry.translate(0, top, 0);
  const uv = geometry.attributes.uv, pos = geometry.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + 6) / 4, (pos.getZ(i) + 4) / 4);
  return geometry;
}

/** A single persistent model. Only update() writes its articulated transforms. */
export function createTheatre(canvas, onContextChange = () => {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  // The recovery extension must be retained while the context is healthy.
  // A lost context cannot supply a previously uncached extension on demand.
  let contextControl=renderer.getContext().getExtension('WEBGL_lose_context');
  renderer.setClearColor(0xF3EEE5, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 100);
  const mat = createMaterials();
  const daylightPaint=new THREE.Color('#FFFFFF'),nightGel=new THREE.Color('#607F9E');
  const wavePaint=mat.waves.map(m=>m.color.clone());
  const geometries = new Set();
  const extraMaterials = new Set();
  const model = new THREE.Group();
  model.name = 'The one original theatre';
  scene.add(model);
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  geometries.add(boxGeo);
  function mesh(geo, material, parent = model, name = '') {
    geometries.add(geo);
    const m = new THREE.Mesh(geo, material);
    m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function box(w, h, d, x, y, z, material, parent = model, name = '') {
    const b = mesh(boxGeo, material, parent, name);
    b.scale.set(w, h, d); b.position.set(x, y, z);
    return b;
  }
  function bar(a, b, radius, material, parent = model) {
    const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b);
    const direction = bv.clone().sub(av);
    const m = mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 8), material, parent);
    m.position.copy(av.add(bv).multiplyScalar(.5));
    m.quaternion.setFromUnitVectors(up, direction.normalize());
    return m;
  }
  function pathTube(points, radius, material, parent, segments = 50) {
    return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), segments, radius, 6, false), material, parent);
  }
  function line(points, material, parent, radius = .02) {
    return pathTube(points.map(p => new THREE.Vector3(...p)), radius, material, parent, Math.max(12, points.length * 2));
  }
  function framedPanel(w, h, material, parent, z = 0, wood = mat.woodDark) {
    box(w, h, .095, 0, h / 2, z, material, parent);
    const off = z - .09;
    for (const x of [-w / 2 + .06, w / 2 - .06]) box(.095, h, .13, x, h / 2, off, wood, parent);
    for (const y of [.07, h * .46, h - .07]) box(w, .095, .13, 0, y, off, wood, parent);
  }

  // A soft studio contact shadow supports the object without obscuring its feet.
  const groundMat = new THREE.ShadowMaterial({ color: 0x433b2c, opacity: .08 });
  extraMaterials.add(groundMat);
  const ground = mesh(new THREE.PlaneGeometry(80, 80), groundMat, scene);
  ground.rotation.x = -Math.PI / 2; ground.position.y = -1.32; ground.castShadow = false;
  const groundTextureCanvas = document.createElement('canvas');
  groundTextureCanvas.width = groundTextureCanvas.height = 128;
  const ctx = groundTextureCanvas.getContext('2d');
  const shade = ctx.createRadialGradient(64,64,4,64,64,64);
  shade.addColorStop(0,'rgba(65,50,26,.20)'); shade.addColorStop(.65,'rgba(65,50,26,.06)'); shade.addColorStop(1,'rgba(65,50,26,0)');
  ctx.fillStyle = shade; ctx.fillRect(0,0,128,128);
  const contactTexture = new THREE.CanvasTexture(groundTextureCanvas);
  const contactMat = new THREE.MeshBasicMaterial({ map: contactTexture, transparent: true, depthWrite: false });
  extraMaterials.add(contactMat);
  const contact = mesh(new THREE.PlaneGeometry(18, 13), contactMat, scene);
  contact.rotation.x = -Math.PI / 2; contact.position.y = -1.30; contact.castShadow = contact.receiveShadow = false;

  // Timber chassis. Parking volume is genuinely empty: beams run outside the
  // lift swept volumes, and the base has .08 clearance below the parked boards.
  box(12.3, .10, 8.3, 0, liftLayout.baseTop - .05, 0, mat.woodDark);
  for (const x of [-5.8, 5.8]) {
    box(.20, 1.06, 7.8, x, -.58, 0, mat.woodDark);
    for (const z of [-3.55, 3.55]) box(.38, .12, .44, x, -1.27, z, mat.woodDark);
  }
  for (const z of [-3.6, 3.6]) box(11.6, .22, .20, 0, -.83, z, mat.woodDark);
  for (const x of [-4.85, 4.85]) for (const z of [-3.5, 0, 3.5]) box(.14, 1.1, .14, x, -.60, z, mat.woodDark);
  box(12.4, .87, .19, 0, -.57, 4.08, mat.cream);
  box(12.55, .11, .27, 0, -.09, 4.08, mat.creamDark);
  box(12.55, .11, .27, 0, -1.02, 4.08, mat.creamDark);
  for (const x of [-4.5,-1.5,1.5,4.5]) box(2.75,.54,.025,x,-.57,4.19,mat.creamDark);
  // Real plank gaps and polygonal swept trap openings, not painted grooves.
  const layout = geometryLayout(), floorBatches = [[], []];
  for (const { plank, polygon } of layout.floor) floorBatches[plank % 5 ? 0 : 1].push(horizontalSolid(polygon, liftLayout.floorBottom, liftLayout.floorTop));
  floorBatches.forEach((pieces, i) => {
    const combined = mergeGeometries(pieces, false);
    pieces.forEach(g => g.dispose());
    mesh(combined, mat.wood, model, 'Plank deck with real swept trap openings');
  });
  // Four circular deck segments leave three true through-slots. The rim,
  // shaft, scenic cues and lantern all use exactly the same (0, 0) axis.
  const revolve = new THREE.Group(); revolve.name = 'Revolve / shared prop coordinate system'; model.add(revolve);
  for (const polygon of layout.deck) mesh(horizontalSolid(polygon, liftLayout.deckBottom, liftLayout.deckTop), mat.wood, revolve, 'Segmented revolve deck / open trap edge');
  const rim = mesh(new THREE.TorusGeometry(liftLayout.radius, .018, 6, 96), mat.metal, revolve);
  rim.rotation.x = Math.PI / 2; rim.position.set(0,.224,0);
  bar([0,liftLayout.baseTop,0],[0,.12,0],.13,mat.metal);
  for (let i=0;i<16;i++) {
    const x=-3.5+i*.46, half=Math.sqrt(Math.max(0,3.68**2-x*x));
    let pieces=[[-half,half]];
    for (const row of liftLayout.rows) {
      const lo=row.z+liftLayout.slotBack,hi=row.z+liftLayout.slotFront;
      pieces=pieces.flatMap(([a,b])=>hi<=a||lo>=b?[[a,b]]:[[a,Math.min(b,lo)],[Math.max(a,hi),b]].filter(([s,e])=>e-s>.02));
    }
    for(const [a,b] of pieces)line([[x,.218,a],[x,.218,b]],mat.woodDark,revolve,.006);
  }

  // Cream stepped proscenium, with one continuous, shallow arched opening.
  function prosceniumShape() {
    const s = new THREE.Shape();
    s.moveTo(-5.62, 0); s.lineTo(-5.62, 6.48); s.lineTo(5.62, 6.48); s.lineTo(5.62, 0);
    s.lineTo(4.83,0); s.lineTo(4.83,5.20);
    s.quadraticCurveTo(4.83,5.65,4.35,5.72);
    s.quadraticCurveTo(0,6.12,-4.35,5.72);
    s.quadraticCurveTo(-4.83,5.65,-4.83,5.20);
    s.lineTo(-4.83,0); s.closePath();
    return s;
  }
  const frame = mesh(new THREE.ExtrudeGeometry(prosceniumShape(), {depth:.40,bevelEnabled:true,bevelSize:.04,bevelThickness:.04,bevelSegments:2,curveSegments:24}),mat.cream);
  frame.position.z = 3.13;
  for (const sign of [-1,1]) {
    const x=sign*5.21;
    box(.99,.31,.73,x,.16,3.42,mat.creamDark);
    box(.85,.18,.65,x,.41,3.41,mat.cream);
    box(.71,.11,.58,x,.56,3.43,mat.creamDark);
    box(.1,4.7,.12,x-sign*.22,2.98,3.64,mat.creamDark);
    box(.10,4.7,.12,x+sign*.22,2.98,3.64,mat.creamDark);
    box(.94,.18,.70,x,5.65,3.4,mat.creamDark);
    box(1.03,.18,.74,x,5.86,3.4,mat.cream);
  }
  box(11.65,.17,.72,0,6.45,3.35,mat.creamDark);
  box(11.85,.14,.82,0,6.64,3.35,mat.cream);
  box(11.35,.07,.11,0,6.24,3.60,mat.creamDark);
  const arch = [];
  for(let i=0;i<=60;i++){const x=-4.76+9.52*i/60;arch.push([x,5.59+.39*(1-(x/4.76)**2),3.61]);}
  line(arch,mat.creamDark,model,.032);
  // A little fan carving makes the frame recognizable without baroque ornament.
  for(let i=-4;i<=4;i++){
    const angle=i*.16;
    bar([0,6.13,3.69],[Math.sin(angle)*.34,6.14+Math.cos(angle)*.34,3.69],.017,mat.creamDark);
  }

  // Static folded fabric at the edge, not a simulated cloth protagonist.
  function curtain(w,h,x,y,z,folds,swag=false) {
    const geo = new THREE.PlaneGeometry(w,h,Math.ceil(w*30),18);
    const pos=geo.attributes.position;
    for(let i=0;i<pos.count;i++){
      const px=pos.getX(i), py=pos.getY(i), v=(py+h/2)/h;
      pos.setZ(i,Math.cos((px/w+.5)*TAU*folds)*.065);
      if(swag)pos.setY(i,py-.11*Math.sin((px/w+.5)*Math.PI));
      else pos.setX(i,px + Math.sign(x)*.12*Math.sin(v*Math.PI));
    }
    geo.computeVertexNormals();
    const c=mesh(geo,mat.curtain);c.position.set(x,y,z);return c;
  }
  curtain(.64,5.25,-4.55,2.71,3.06,5);
  curtain(.64,5.25,4.55,2.71,3.06,5);
  curtain(9.7,.43,0,5.55,3.0,42,true);
  for(const x of [-4.52,4.52]) line([[x-.33,1.7,3.14],[x,1.54,3.20],[x+.33,1.7,3.14]],mat.brass,model,.022);

  // Fly structure is supported by uprights; the moon and drop have connected lines.
  for(const x of [-5.35,5.35]){
    box(.085,7.5,.085,x,3.65,-3.36,mat.metal);
    box(.075,.075,6.5,x,7.34,-.13,mat.metal);
    bar([x,-.9,-3.36],[x,1.1,-2.8],.035,mat.metal);
  }
  for(const z of [-3.36,-1.55,.3])box(10.85,.07,.07,0,7.34,z,mat.metal);
  const dayBack = mesh(new THREE.BoxGeometry(9.85,5.5,.10),[mat.woodDark,mat.woodDark,mat.woodDark,mat.woodDark,mat.sky,mat.woodDark]);
  dayBack.position.set(0,2.91,-3.32);
  for(const x of [-4.8,0,4.8])box(.11,5.45,.11,x,2.9,-3.45,mat.woodDark);
  const nightDrop = new THREE.Group();nightDrop.name='Star cloth on a working roller';model.add(nightDrop);
  const nightSurface=mesh(new THREE.BoxGeometry(9.7,5.47,.085),[mat.woodDark,mat.woodDark,mat.woodDark,mat.woodDark,mat.night,mat.woodDark],nightDrop);
  nightSurface.position.set(0,2.91,-3.20);
  const dropBottom=box(9.8,.06,.10,0,6.03,-3.2,mat.metal,nightDrop);
  const dropRoll=mesh(new THREE.CylinderGeometry(.11,.11,9.8,18),mat.night,nightDrop);
  dropRoll.rotation.z=Math.PI/2;dropRoll.position.set(0,6.14,-3.2);
  for(const x of [-4.94,4.94])bar([x,.48,-3.2],[x,6.26,-3.2],.012,mat.metal,nightDrop);
  let seed=29;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const starMat=new THREE.MeshBasicMaterial({color:0xf9d89c});extraMaterials.add(starMat);
  const starGeo=new THREE.SphereGeometry(.018,5,4);geometries.add(starGeo);
  const stars=new THREE.InstancedMesh(starGeo,starMat,48);
  const matrix=new THREE.Matrix4(),starPositions=[];
  for(let i=0;i<48;i++){
    const x=-4.5+rnd()*9,y=.95+rnd()*4.35,size=.6+rnd()*.7;
    starPositions.push({x,y,size});
    matrix.makeScale(size,size,size);matrix.setPosition(x,y,-3.14);stars.setMatrixAt(i,matrix);
  }
  nightDrop.add(stars);

  // Four rigid, two-sided scenic flat assemblies. No identities are replaced.
  const flats=[];
  scenicFlats.forEach(([x,z,w,h,baseYaw],i)=>{
    const pivot=new THREE.Group();pivot.position.set(x,.20,z);pivot.name=`Double-sided scenic flat ${i+1}`;pivot.userData.baseYaw=baseYaw;model.add(pivot);
    framedPanel(w,h,mat.teal,pivot);
    // A shallow moulding pattern forms the forced-perspective room.
    for(const side of [-1,1])box(.032,h-.32,.022,side*(w/2-.17),h/2,.065,mat.tealTrim,pivot);
    for(const y of [.23,1.03,h-.18])box(w-.26,.033,.025,0,y,.064,mat.tealTrim,pivot);
    const innerBox=(a,b,c,d)=>{
      box(c,.024,.026,a,b-d/2,.069,mat.tealTrim,pivot);box(c,.024,.026,a,b+d/2,.069,mat.tealTrim,pivot);
      for(const xx of [-c/2,c/2])box(.024,d,.026,a+xx,b,.069,mat.tealTrim,pivot);
    };
    innerBox(0,.60,w-.46,.52);
    if(i!==0)innerBox(0,2.65,w-.46,2.55);
    // Coast painting mounted on the reverse, timber remains legible around it.
    const reverse=mesh(new THREE.PlaneGeometry(w-.22,h-.24),mat.coast,pivot);
    reverse.position.set(0,h/2,-.34);reverse.rotation.y=Math.PI;
    // Diagonal and hinged jack; attached to the rotating group.
    bar([-w/2+.12,.18,-.27],[w/2-.12,h-.2,-.27],.036,mat.woodDark,pivot);
    bar([0,.05,-.29],[0,2.30,-.29],.039,mat.woodDark,pivot);
    bar([0,2.30,-.29],[0,.05,-.60],.04,mat.woodDark,pivot);
    bar([0,.05,-.29],[0,.05,-.60],.04,mat.woodDark,pivot);
    const axle=mesh(new THREE.CylinderGeometry(.12,.12,.07,14),mat.metal,pivot);axle.position.y=.02;
    flats.push(pivot);
  });

  // Window made of geometry with a luminous pale sky behind its six panes.
  const windowGroup=new THREE.Group();windowGroup.position.set(0,2.87,.092);flats[0].add(windowGroup);
  const glassMat = new THREE.MeshStandardMaterial({color:0xecd9a4,emissive:0xedc37a,emissiveIntensity:.32,roughness:1});extraMaterials.add(glassMat);
  box(1.14,1.82,.03,0,0,0,glassMat,windowGroup);
  for(const x of [-.61,.61])box(.095,2.04,.10,x,0,.04,mat.creamDark,windowGroup);
  for(const y of [-1,1])box(1.31,.095,.10,0,y,.04,mat.creamDark,windowGroup);
  box(.045,1.87,.07,0,0,.065,mat.woodDark,windowGroup);
  for(const y of [-.32,.32])box(1.16,.041,.07,0,y,.065,mat.woodDark,windowGroup);
  box(1.43,.10,.27,0,-1.10,.02,mat.wood,windowGroup);

  // One red door, on a small raised landing. Local coordinates never change parents.
  const doorGroup=new THREE.Group();doorGroup.position.set(1.24,.35,-1.52);doorGroup.name='The one vermilion door';revolve.add(doorGroup);
  box(2.04,.14,1.10,0,-.02,0,mat.wood,doorGroup);
  box(2.12,.10,.23,0,-.11,.64,mat.wood,doorGroup);
  for(const x of [-.79,.79])box(.18,3.12,.25,x,1.56,0,mat.woodDark,doorGroup);
  box(1.95,.19,.31,0,3.13,0,mat.redInset,doorGroup);
  box(1.78,.08,.30,0,3.26,0,mat.red,doorGroup);
  const doorLeaf = new THREE.Group();doorLeaf.position.set(-.68,.12,0);doorGroup.add(doorLeaf);
  box(1.34,2.89,.13,.67,1.445,0,mat.red,doorLeaf,'One persistent door leaf');
  for(const y of [.62,2.04]){
    box(1.08,y<1? .83:1.45,.03,.67,y,.08,mat.redInset,doorLeaf);
    const ph=y<1?.83:1.45;
    for(const x of [.12,1.22])box(.038,ph,.045,x,y,.10,mat.red,doorLeaf);
    for(const yy of [y-ph/2,y+ph/2])box(1.14,.04,.045,.67,yy,.10,mat.red,doorLeaf);
  }
  box(.12,.28,.026,1.16,1.31,.10,mat.brass,doorLeaf);
  const knob=mesh(new THREE.SphereGeometry(.061,12,8),mat.brass,doorLeaf);knob.position.set(1.17,1.34,.18);
  const warmMat=new THREE.MeshBasicMaterial({color:0xffd18a});extraMaterials.add(warmMat);
  const doorGap=box(1.35,2.91,.035,0,1.58,-.07,warmMat,doorGroup);doorGap.visible=false;
  const doorLight=new THREE.PointLight(0xffb95b,0,4,2);doorLight.position.set(0,1.15,.32);doorGroup.add(doorLight);

  // A slender, uninterrupted curved rail on a timber jetty.
  const railCurve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.25,.42,-.76),new THREE.Vector3(1.35,.42,-.18),new THREE.Vector3(1.08,.42,.65),new THREE.Vector3(.42,.42,1.45),new THREE.Vector3(-.3,.42,2.27)
  ]);
  const railPoints=railCurve.getPoints(60);
  for(let i=0;i<40;i++){
    const t=i/39,p=railCurve.getPoint(t),tangent=railCurve.getTangent(t);
    const slat=box(.86,.09,.12,p.x,.31,p.z,mat.wood,revolve);
    slat.rotation.y=Math.atan2(tangent.x,tangent.z);
    if(i%8===0)for(const sign of [-1,1])box(.07,.45,.07,p.x+sign*.34,.04,p.z,mat.woodDark,revolve);
  }
  for(const side of [-1,1]){
    const points=railPoints.map((p,i)=>{
      const tangent=railCurve.getTangent(i/60);return new THREE.Vector3(p.x+tangent.z*.10*side,p.y,p.z-tangent.x*.10*side);
    });pathTube(points,.018,mat.rail,revolve);
  }
  // The same paper lantern and carriage follow the local track in every scene.
  const lantern=new THREE.Group();lantern.name='The one paper lantern';revolve.add(lantern);
  box(.45,.06,.35,0,0,0,mat.woodDark,lantern);
  for(const x of [-.17,.17])for(const z of [-.12,.12]){
    const wheel=mesh(new THREE.CylinderGeometry(.057,.057,.038,10),mat.metal,lantern);wheel.rotation.z=Math.PI/2;wheel.position.set(x,-.015,z);
  }
  const paperBody=mesh(new THREE.SphereGeometry(.31,24,18),mat.paper,lantern);paperBody.scale.y=1.32;paperBody.position.y=.43;
  const ribs=new THREE.Group();lantern.add(ribs);
  for(let i=-5;i<=5;i++){
    const y=i*.063,rad=.307*Math.sqrt(Math.max(0,1-(y/.409)**2));
    const ring=mesh(new THREE.TorusGeometry(rad,.006,4,32),mat.brass,ribs);ring.rotation.x=Math.PI/2;ring.position.y=.43+y;
  }
  for(const y of [.075,.80]){
    const cap=mesh(new THREE.CylinderGeometry(.125,.125,.037,20),mat.brass,lantern);cap.position.y=y;
  }
  const handle=mesh(new THREE.TorusGeometry(.17,.012,6,24,Math.PI),mat.brass,lantern);handle.position.y=.86;
  const lanternLight=new THREE.PointLight(0xffc774,7,3.4,2);lanternLight.position.y=.5;lantern.add(lanternLight);

  // Three solid scalloped wave boards rise from separate, visibly guided trap slots.
  const waves=[];
  for(let row=0;row<3;row++){
    const spec=liftLayout.rows[row],half=spec.width/2;
    const g=new THREE.Group();g.name=`Wave board ${row+1} / guided trap lift`;revolve.add(g);
    const s=new THREE.Shape();s.moveTo(-half,liftLayout.boardBottom);s.lineTo(half,liftLayout.boardBottom);
    const crest=[];
    for(let i=100;i>=0;i--){
      const x=-half+spec.width*i/100;
      let y=.61+Math.sin(x*3.2+row*1.1)*.14+Math.sin(x*6.4+row*.5)*.035;
      const cut=smooth(.40,.67,Math.abs(x-spec.notch));
      y=lerp(.08,y,cut);
      s.lineTo(x,y);crest.push([x,y,liftLayout.boardDepth/2+.005]);
    }
    s.closePath();
    const geo=new THREE.ExtrudeGeometry(s,{depth:liftLayout.boardDepth,bevelEnabled:false,steps:1});
    geo.translate(0,0,-liftLayout.boardDepth/2);
    // Normalize paint coordinates to the physical board, instead of stretching along world units.
    const uv=geo.attributes.uv,pos=geo.attributes.position;
    for(let i=0;i<uv.count;i++)uv.setXY(i,(pos.getX(i)+half)/spec.width,(pos.getY(i)+.05)/.85);
    mesh(geo,[mat.waves[row],mat.woodDark],g);
    line(crest,mat.creamDark,g,.009);
    for(const x of [-half+.30,half-.30]){
      const guideH=liftLayout.guideTop-liftLayout.guideBottom;
      box(liftLayout.guideWidth,guideH,liftLayout.guideWidth,x,(liftLayout.guideTop+liftLayout.guideBottom)/2,spec.z+liftLayout.guideZ,mat.metal,revolve,'Fixed wave guide');
      box(.13,.08,.12,x,liftLayout.baseTop+.04,spec.z-.11,mat.woodDark,revolve,'Grounded guide foot');
      // The captured block is hollow around its guide. Its horizontal opening
      // permits the authored .055 sway without losing the vertical rail.
      const side=(liftLayout.sliderOuterWidth-liftLayout.sliderInnerWidth)/2;
      const end=(liftLayout.sliderOuterDepth-liftLayout.sliderInnerDepth)/2;
      for(const sign of [-1,1]){
        box(side,liftLayout.sliderHeight,liftLayout.sliderOuterDepth,x+sign*(liftLayout.sliderInnerWidth+side)/2,liftLayout.sliderY,liftLayout.guideZ,mat.brass,g);
        box(liftLayout.sliderInnerWidth,liftLayout.sliderHeight,end,x,liftLayout.sliderY,liftLayout.guideZ+sign*(liftLayout.sliderInnerDepth+end)/2,mat.brass,g);
      }
    }
    g.position.set(0,liftLayout.parkedY,spec.z);waves.push(g);
  }

  // Painted disc, not a sphere: its edge and connected hanging lines tell the secret.
  const moon=new THREE.Group();moon.name='Painted moon on two lift lines';model.add(moon);
  const moonDisk=mesh(new THREE.CylinderGeometry(.58,.58,.085,64),[mat.creamDark,mat.moon,mat.moon],moon);
  moonDisk.rotation.x=Math.PI/2;
  const moonFace=mesh(new THREE.CircleGeometry(.58,64),mat.moon,moon);moonFace.position.z=.05;
  const moonLineGeo=new THREE.CylinderGeometry(.007,.007,1,5);geometries.add(moonLineGeo);
  const moonLines=[-1,1].map(sign=>{const m=mesh(moonLineGeo,mat.metal);m.position.x=1.24+sign*.32;m.position.z=-1.79;return m;});
  const moonBatten=box(1.15,.07,.07,1.24,7.32,-1.79,mat.metal);
  for(const x of [.92,1.56])bar([x,7.32,-1.55],[x,7.32,-1.79],.02,mat.metal);
  // A small side rigging pulley gives the wing view an intelligible connection.
  for(const x of [.92,1.56]){
    const pulley=mesh(new THREE.TorusGeometry(.065,.018,6,14),mat.metal);pulley.position.set(x,7.32,-1.79);
  }

  // Lighting: warm primary sidelight casts moving shadows; work light reveals backs.
  const ambient=new THREE.HemisphereLight(0xfff0d8,0x596057,2.15);scene.add(ambient);
  const studio=new THREE.DirectionalLight(0xfff7eb,1.8);studio.position.set(-5,12,8);studio.castShadow=false;
  studio.shadow.mapSize.set(1024,1024);studio.shadow.camera.left=-10;studio.shadow.camera.right=10;studio.shadow.camera.top=10;studio.shadow.camera.bottom=-10;studio.shadow.camera.near=.5;studio.shadow.camera.far=40;studio.shadow.normalBias=.04;scene.add(studio);
  const key=new THREE.SpotLight(0xffe7c5,160,35,.70,.46,2);key.castShadow=true;
  key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.00005;key.shadow.normalBias=.02;key.shadow.camera.near=.5;key.shadow.camera.far=35;
  key.target.position.set(.1,1.0,-.35);scene.add(key,key.target);
  const work=new THREE.DirectionalLight(0xf1f1e9,0);work.position.set(8,7,-1);scene.add(work);
  const rimLight=new THREE.DirectionalLight(0xaccbd6,.55);rimLight.position.set(-3,5,-5);scene.add(rimLight);
  const windowLight=new THREE.SpotLight(0xffd99b,45,16,.38,.14,2);
  windowLight.position.set(-3.65,3.2,1.04);windowLight.target.position.set(.6,.1,.35);scene.add(windowLight,windowLight.target);
  // Six restrained scenic highlights recall window panes on the floor.
  // The moving primary sidelight supplies the actual cast shadows.
  const patchMat=new THREE.MeshBasicMaterial({color:0xf5d69a,transparent:true,opacity:.12,depthWrite:false});extraMaterials.add(patchMat);
  const windowPatches=new THREE.Group();model.add(windowPatches);
  for(let x=0;x<2;x++)for(let z=0;z<3;z++){
    const patch=mesh(new THREE.PlaneGeometry(.43,.69),patchMat,windowPatches);patch.rotation.x=-Math.PI/2;patch.rotation.z=-.48;patch.position.set(-2.2+x*.49+z*.32,.235,.15+z*.63);patch.castShadow=patch.receiveShadow=false;
  }

  // Merge truly static repeated geometry by material after construction. Articulated
  // assemblies remain separate, preserving a single identity for every moving prop.
  function batchStatic(group) {
    const batches=new Map();
    for(const child of [...group.children]){
      if(!child.isMesh||Array.isArray(child.material)||child.isInstancedMesh||child===frame||child===doorGap||child===paperBody)continue;
      if(child.geometry===moonLineGeo||child===moonBatten)continue;
      if(child===dayBack)continue;
      const key=child.material.uuid+'-'+child.castShadow+'-'+child.receiveShadow;
      if(!batches.has(key))batches.set(key,[]);batches.get(key).push(child);
    }
    for(const children of batches.values()){
      if(children.length<3)continue;
      const geos=children.map(c=>{c.updateMatrix();let g=c.geometry.clone();if(g.index){const flat=g.toNonIndexed();g.dispose();g=flat;}g.applyMatrix4(c.matrix);g.deleteAttribute('uv1');g.clearGroups();return g;});
      const combined=mergeGeometries(geos,false);
      geos.forEach(g=>g.dispose());
      if(!combined)continue;
      const b=mesh(combined,children[0].material,group,'Batched static craft');b.castShadow=children[0].castShadow;b.receiveShadow=children[0].receiveShadow;
      children.forEach(c=>group.remove(c));
    }
  }
  // Batch only boxes (identical attributes) to avoid altering per-face painting.
  // Static base trim / planks are the dominant repeated geometry.
  const staticBoxes=model.children.filter(c=>c.isMesh&&c.geometry===boxGeo&&c!==moonBatten);
  const staticRoot=new THREE.Group();model.add(staticRoot);
  staticBoxes.forEach(c=>staticRoot.add(c));batchStatic(staticRoot);
  flats.forEach(f=>batchStatic(f));
  batchStatic(revolve);batchStatic(doorLeaf);batchStatic(doorGroup);batchStatic(ribs);batchStatic(lantern);

  let width=0,height=0,isPortrait=false,contextLost=false,lastPose=null;
  const onLost=e=>{e.preventDefault();contextLost=true;onContextChange('lost');};
  const onRestored=()=>{contextControl=renderer.getContext().getExtension('WEBGL_lose_context');contextLost=false;onContextChange('restored');};
  canvas.addEventListener('webglcontextlost',onLost);
  canvas.addEventListener('webglcontextrestored',onRestored);
  const look=new THREE.Vector3();
  function resize(w,h) {
    width=Math.max(1,w);height=Math.max(1,h);isPortrait=window.innerWidth<850;
    const maxPixels=window.innerWidth<850?1_200_000:2_500_000;
    const ratio=Math.min(window.devicePixelRatio||1,1.6,Math.sqrt(maxPixels/(width*height)));
    renderer.setPixelRatio(Math.max(.6,ratio));renderer.setSize(width,height,false);
    camera.aspect=width/height;camera.updateProjectionMatrix();
  }
  function update(pose,time=0,reduced=false,opening=1) {
    if(contextLost||!width)return;
    lastPose=pose;
    const m=mechanism(pose.world),night=clamp(pose.world-1);
    revolve.rotation.y=m.turn;
    flats.forEach((f,i)=>{f.rotation.y=f.userData.baseYaw+m.flatAngles[i];});
    waves.forEach((g,i)=>{
      g.position.y=lerp(liftLayout.parkedY,liftLayout.raisedY,m.waves[i]);
      g.position.x=reduced?0:Math.sin(time*.52+i*1.9)*liftLayout.horizontalTravel*m.waves[i];
    });
    // The cloth unrolls from the fixed upper roller: no full-size panel parks
    // above the model. A cropped paint region and stars move with the fabric.
    const dropHeight=5.47*m.stars;
    nightSurface.visible=m.stars>.001;
    nightSurface.scale.y=Math.max(.001,m.stars);
    nightSurface.position.y=6.03-dropHeight/2;
    dropBottom.position.y=6.03-dropHeight;
    dropRoll.rotation.x=-dropHeight/.11;
    if(mat.night.map){mat.night.map.repeat.y=Math.max(.001,m.stars);mat.night.map.offset.y=1-m.stars;}
    starPositions.forEach(({x,y,size},i)=>{
      const actualY=y+5.47*(1-m.stars),r=actualY<=6.01?size:0;
      matrix.makeScale(r,r,r);matrix.setPosition(x,actualY,-3.14);stars.setMatrixAt(i,matrix);
    });stars.instanceMatrix.needsUpdate=true;
    moon.position.set(1.24,lerp(6.68,4.37,m.moon),-1.79);
    moonLines.forEach(l=>{const lower=Math.min(7.30,moon.position.y+.4),len=Math.max(.01,7.3-lower);l.scale.y=len;l.position.y=lower+len/2;l.visible=m.moon>.06;});
    moon.visible=m.moon>.06;
    const lampPos=railCurve.getPoint(clamp(pose.lamp));
    lantern.position.copy(lampPos);
    const tangent=railCurve.getTangent(clamp(pose.lamp));lantern.rotation.y=Math.atan2(tangent.x,tangent.z);
    mat.paper.emissiveIntensity=(1.2+(reduced?0:Math.sin(time*1.35)*.055))*lerp(.5,1,opening);
    lanternLight.intensity=(2.1+night*1.0)*lerp(.35,1,opening);
    doorLeaf.rotation.y=-.18*pose.doorGlow;
    doorGap.visible=pose.doorGlow>.02;doorLight.intensity=1.7*pose.doorGlow;
    key.position.set(lerp(-5.2,-2.3,pose.light),lerp(2.2,8.4,pose.light),lerp(3.5,1.3,pose.light));
    key.intensity=lerp(140,205,pose.light)*(1-.22*night);
    ambient.intensity=lerp(1.42,.88,night);
    studio.intensity=lerp(1.85,1.05,night);
    // The same hand-painted faces under a blue evening gel. Map identity,
    // vertices and scenic supports remain unchanged throughout the cue.
    mat.coast.color.copy(daylightPaint).lerp(nightGel,night);
    mat.waves.forEach((material,i)=>material.color.copy(wavePaint[i]).multiplyScalar(lerp(1,.64,night)));
    work.intensity=pose.view*1.55;
    rimLight.intensity=.4+pose.view*.3+night*.15;
    windowLight.intensity=45*(1-smooth(0,.42,pose.world))*opening;
    windowPatches.visible=pose.world<.3;patchMat.opacity=.12*(1-smooth(0,.3,pose.world))*opening;

    // The only camera writer: one bounded arc, then the same arc reversed.
    const view=clamp(pose.view),angle=lerp(-.085,1.35,view);
    const fitWidth=13.4,fitHeight=9.2;
    const distance=Math.max(fitHeight/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))),fitWidth/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect));
    const radius=distance+4.2+view*4.1;
    const elevation=lerp(.15,.36,view);
    let eyeHeight=3.05+radius*elevation;
    // A tall desktop canvas needs a distant lens to fit the model width.
    // Keep the audience eye low enough to see the moon under the near valance;
    // retain the elevated working-side sightline at the end of the same arc.
    if(camera.aspect<1.1)eyeHeight=lerp(Math.min(eyeHeight,6.05),eyeHeight,view);
    camera.position.set(Math.sin(angle)*radius,eyeHeight,Math.cos(angle)*radius);
    look.set(0,2.40-.50*view,-.1);camera.lookAt(look);
    renderer.render(scene,camera);
  }
  function inspect() {
    scene.updateMatrixWorld(true);
    const dp=new THREE.Vector3(),lp=new THREE.Vector3();doorGroup.getWorldPosition(dp);lantern.getWorldPosition(lp);
    const screenPoint=object=>{
      const v=new THREE.Vector3();object.getWorldPosition(v);v.project(camera);
      return {x:(v.x*.5+.5)*width,y:(-.5*v.y+.5)*height};
    };
    return {renderer:'Three.js WebGL 2',contextLost,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,
      textures:renderer.info.memory.textures,geometries:renderer.info.memory.geometries,pixelRatio:renderer.getPixelRatio(),width,height,
      doorId:doorGroup.uuid,lanternId:lantern.uuid,doorParent:doorGroup.parent.uuid,lanternParent:lantern.parent.uuid,
      waveIds:waves.map(g=>g.uuid),waveParents:waves.map(g=>g.parent.uuid),
      door:dp.toArray(),lantern:lp.toArray(),doorScreen:screenPoint(doorGroup),lanternScreen:screenPoint(paperBody),
      camera:camera.position.toArray(),key:key.position.toArray(),lastPose};
  }
  function dispose() {
    canvas.removeEventListener('webglcontextlost',onLost);canvas.removeEventListener('webglcontextrestored',onRestored);
    stars.dispose();studio.shadow.dispose();key.shadow.dispose();
    geometries.forEach(g=>g.dispose());extraMaterials.forEach(m=>m.dispose());contactTexture.dispose();mat.dispose();renderer.dispose();
  }
  return {resize,update,inspect,dispose,restoreContext:()=>contextControl?contextControl.restoreContext():renderer.forceContextRestore()};
}

// CPU-only inspection of the same geometry plan. The stage factory's returned
// API remains unchanged; no browser, renderer or second animation is involved.
Object.defineProperty(createTheatre, 'geometryLayout', { value: geometryLayout });
Object.defineProperty(createTheatre, 'scenicLayout', { value: () => scenicFlats });
