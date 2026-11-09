import * as THREE from 'three';
import { clothTexture, contactTexture, sunTexture, wheelTexture, woodTexture } from './materials';

export interface SceneFrame {
  story: number;
  repairPlan: 'A' | 'B';
  inspectionFocus: 'wheel' | 'ear' | 'paint';
  trialProgress: number;
  trialMode: 'before' | 'repaired';
  compareState: 'before' | 'after';
  reducedMotion: boolean;
  heroTug: number;
  chapterProgress?: number;
  roadProgress?: number;
  faultSmooth?: boolean;
  assemblyProgress?: number;
}

export interface PipScene {
  resize(width: number, height: number, mobile: boolean): void;
  render(frame: SceneFrame): void;
  projectPoint(id: 'wheel' | 'ear' | 'paint' | 'sun'): { x: number; y: number };
  dispose(): void;
}

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));
const smooth = (v: number) => { const t = clamp(v); return t * t * (3 - 2 * t); };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const radius = .45;
const frontX = -1.21;
const rearX = 1.25;
const axleZ = .48;

interface Pose { height: number; targetX: number; targetY: number; azimuth: number; elevation: number; roll: number; x: number; z: number; }
const poses: Pose[] = [
  { height: 4.45, targetX: -1.66, targetY: 1.04, azimuth: -.18, elevation: .20, roll: 0, x: 0, z: 0 },
  { height: 4.18, targetX: -1.54, targetY: .99, azimuth: -.23, elevation: .27, roll: 0, x: 0, z: 0 },
  { height: 4.12, targetX: -1.44, targetY: 1.02, azimuth: -.13, elevation: .20, roll: -1.03, x: 0, z: 0 },
  { height: 3.95, targetX: -1.22, targetY: .93, azimuth: -.12, elevation: .14, roll: 0, x: 0, z: 0 },
  { height: 4.55, targetX: -1.35, targetY: 1.0, azimuth: -.22, elevation: .29, roll: 0, x: 0, z: -.25 },
  { height: 4.08, targetX: -1.12, targetY: .98, azimuth: -.18, elevation: .24, roll: 0, x: -.1, z: 0 },
  { height: 4.20, targetX: -1.55, targetY: .83, azimuth: -.04, elevation: .105, roll: 0, x: .35, z: 0 },
  { height: 4.30, targetX: -1.50, targetY: .99, azimuth: -.18, elevation: .22, roll: -.10, x: 0, z: 0 },
  { height: 5.15, targetX: -1.67, targetY: .91, azimuth: -.36, elevation: .29, roll: 0, x: .65, z: -.3 },
  { height: 4.70, targetX: -1.40, targetY: .99, azimuth: -.22, elevation: .25, roll: 0, x: -.15, z: 0 },
];

function silhouette(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-2.11, 1.40);
  s.bezierCurveTo(-2.07, 1.54, -1.70, 1.55, -1.54, 1.78);
  s.bezierCurveTo(-1.39, 2.02, -1.21, 2.15, -.96, 2.14);
  s.bezierCurveTo(-.62, 2.12, -.62, 1.65, -.50, 1.48);
  s.bezierCurveTo(-.37, 1.28, -.20, 1.27, .07, 1.27);
  s.bezierCurveTo(.47, 1.27, 1.00, 1.32, 1.43, 1.32);
  s.bezierCurveTo(1.68, 1.32, 1.67, 1.71, 1.73, 1.91);
  s.bezierCurveTo(1.77, 2.07, 1.96, 2.02, 1.98, 1.85);
  s.bezierCurveTo(1.96, 1.64, 1.91, 1.42, 1.88, 1.20);
  s.bezierCurveTo(1.93, .97, 1.85, .64, 1.67, .54);
  s.bezierCurveTo(1.55, .47, 1.32, .48, 1.17, .51);
  s.lineTo(1.03, .67);
  s.bezierCurveTo(.39, .62, -.35, .62, -.86, .67);
  s.bezierCurveTo(-.97, .45, -1.21, .43, -1.39, .54);
  s.bezierCurveTo(-1.55, .63, -1.56, .87, -1.53, 1.02);
  s.bezierCurveTo(-1.52, 1.15, -1.57, 1.16, -1.73, 1.18);
  s.bezierCurveTo(-1.97, 1.20, -2.13, 1.25, -2.11, 1.40);
  s.closePath();
  return s;
}

function earShape(chipped: boolean) {
  const s = new THREE.Shape();
  s.moveTo(-1.12, 2.04);
  s.bezierCurveTo(-.84, 2.10, -.75, 1.88, -.75, 1.58);
  s.bezierCurveTo(-.75, 1.30, -.79, 1.08, -.96, 1.03);
  if (chipped) {
    s.lineTo(-1.01, 1.105);
    s.lineTo(-1.055, 1.035);
    s.lineTo(-1.09, 1.095);
    s.lineTo(-1.12, 1.04);
  }
  s.bezierCurveTo(-1.30, 1.09, -1.35, 1.32, -1.34, 1.58);
  s.bezierCurveTo(-1.33, 1.86, -1.29, 2.00, -1.12, 2.04);
  s.closePath();
  return s;
}

function extruded(shape: THREE.Shape, depth: number, bevel: number) {
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSegments: 5, steps: 1, bevelSize: bevel, bevelThickness: bevel, curveSegments: 40 });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox!;
  const positions = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (positions.getX(i) - bounds.min.x) / (bounds.max.x - bounds.min.x), (positions.getY(i) - bounds.min.y) / (bounds.max.y - bounds.min.y));
  }
  return geometry;
}

// These two rigid cradles are fitted to the actual beveled underside at -1.03 rad.
// Their sloping roofs stay 0.0015 world units below the contact surface. A narrow
// footprint leaves both the painted sun and the three move marks unobstructed.
interface SupportProfile { x: number; z: number; roofCenter: number; slopeX: number; localBottom: number; }
const supportProfiles: SupportProfile[] = [
  { x: -.55, z: -.81, roofCenter: .7460421826594017, slopeX: -.10382894686328248, localBottom: .5820275705564123 },
  { x: .56, z: -.81, roofCenter: .737735092396264, slopeX: .07623031888848164, localBottom: .5777509239420822 },
];
const supportHalfWidth = .06;
const supportHalfDepth = .06;
const supportFloor = .012;
const supportClearance = .0015;
const supportSlopeZ = Math.tan(1.03);

function supportSlide(roll: number, profile: SupportProfile) {
  const angle = clamp(-roll, 0, 1.03);
  if (angle < .00001) return 2;
  const cosine = Math.cos(angle);
  // The underside's X slope changes in world space as Pip tilts. Allow for the
  // higher edge of the rigid cradle, not merely its central contact line.
  const crossSlopeAllowance = Math.abs(profile.slopeX - profile.slopeX * Math.cos(1.03) / cosine) * supportHalfWidth;
  const contactHeight = profile.roofCenter + supportSlopeZ * supportHalfDepth + crossSlopeAllowance + supportClearance;
  return clamp((contactHeight - profile.localBottom / cosine) / Math.tan(angle) - (profile.z + supportHalfDepth + .58), 0, 2);
}

function supportCradle(profile: SupportProfile) {
  const w = supportHalfWidth, d = supportHalfDepth;
  const roof = (x: number, z: number) => profile.roofCenter + profile.slopeX * x + supportSlopeZ * z;
  const vertices = [
    [-w, supportFloor, -d], [w, supportFloor, -d], [w, supportFloor, d], [-w, supportFloor, d],
    [-w, roof(-w, -d), -d], [w, roof(w, -d), -d], [w, roof(w, d), d], [-w, roof(-w, d), d],
  ];
  const indices = [0, 1, 2, 0, 2, 3, 4, 7, 6, 4, 6, 5, 0, 4, 5, 0, 5, 1, 3, 2, 6, 3, 6, 7, 0, 3, 7, 0, 7, 4, 1, 5, 6, 1, 6, 2];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(indices.flatMap(index => vertices[index]), 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(indices.flatMap(index => [vertices[index][0] / .12 + .5, vertices[index][1]]), 2));
  geometry.computeVertexNormals();
  return geometry;
}

export function createPipScene(canvas: HTMLCanvasElement, onFailure: (reason: string) => void): PipScene {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (error) {
    onFailure('The live workbench is unavailable. The illustrated story is still complete.');
    throw error;
  }
  renderer.setClearColor('#f4ebdd', 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#f4ebdd', 17, 36);
  const camera = new THREE.OrthographicCamera(-5, 5, 3, -3, .1, 70);
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const ownGeometry = <T extends THREE.BufferGeometry>(g: T) => { geometries.add(g); return g; };
  const ownMaterial = <T extends THREE.Material>(m: T) => { materials.add(m); return m; };
  const ownTexture = <T extends THREE.Texture>(t: T) => { textures.add(t); return t; };
  const surface = (map: THREE.Texture, extra: THREE.MeshStandardMaterialParameters = {}) => ownMaterial(new THREE.MeshStandardMaterial({ map: ownTexture(map), roughness: .86, metalness: 0, bumpMap: map, bumpScale: .007, ...extra }));

  const paint = surface(woodTexture('paint'));
  const endgrain = surface(woodTexture('wood'), { color: '#e5c28b', bumpScale: .014 });
  const terra = surface(woodTexture('ear'));
  const wood = surface(woodTexture('wood'));
  const freshWood = surface(woodTexture('new'), { roughness: .74 });
  const dark = ownMaterial(new THREE.MeshStandardMaterial({ color: '#302923', roughness: .84 }));
  const cordMaterial = surface(woodTexture('ear'), { color: '#e5947b', roughness: 1, bumpScale: .012 });
  const sleeveMaterial = ownMaterial(new THREE.MeshStandardMaterial({ color: '#e5d5b7', roughness: .66 }));

  scene.add(new THREE.HemisphereLight('#fff9e9', '#998b72', 2.6));
  const light = new THREE.DirectionalLight('#fff3da', 3.3);
  light.position.set(-4.8, 7.8, -3.3);
  light.castShadow = true;
  light.shadow.mapSize.set(2048, 2048);
  light.shadow.camera.left = -8; light.shadow.camera.right = 8;
  light.shadow.camera.top = 6; light.shadow.camera.bottom = -6;
  light.shadow.camera.near = .5; light.shadow.camera.far = 24;
  light.shadow.bias = -.00035; light.shadow.normalBias = .025;
  light.shadow.radius = 4;
  light.target.position.set(0, 0, 0);
  scene.add(light, light.target);
  const fill = new THREE.DirectionalLight('#f6f4e8', .65);
  fill.position.set(3, 4, 7); scene.add(fill);

  const tableMap = ownTexture(woodTexture('table'));
  tableMap.repeat.set(4, 3);
  const table = new THREE.Mesh(ownGeometry(new THREE.PlaneGeometry(70, 40)), ownMaterial(new THREE.MeshStandardMaterial({ map: tableMap, bumpMap: tableMap, bumpScale: .014, roughness: .93 })));
  table.rotation.x = -Math.PI / 2; table.position.y = -.045; table.receiveShadow = true; scene.add(table);

  const matShape = new THREE.Shape();
  const mw = 5.7, mh = 2.85, rr = .10;
  matShape.moveTo(-mw / 2 + rr, -mh / 2);
  matShape.lineTo(mw / 2 - rr, -mh / 2);
  matShape.quadraticCurveTo(mw / 2, -mh / 2, mw / 2, -mh / 2 + rr);
  matShape.lineTo(mw / 2, mh / 2 - rr);
  matShape.quadraticCurveTo(mw / 2, mh / 2, mw / 2 - rr, mh / 2);
  matShape.lineTo(-mw / 2 + rr, mh / 2);
  matShape.quadraticCurveTo(-mw / 2, mh / 2, -mw / 2, mh / 2 - rr);
  matShape.lineTo(-mw / 2, -mh / 2 + rr);
  matShape.quadraticCurveTo(-mw / 2, -mh / 2, -mw / 2 + rr, -mh / 2);
  const matMap = ownTexture(clothTexture());
  const mat = new THREE.Mesh(ownGeometry(new THREE.ExtrudeGeometry(matShape, { depth: .025, steps: 1, bevelEnabled: true, bevelSize: .015, bevelThickness: .012, bevelSegments: 2 })), ownMaterial(new THREE.MeshStandardMaterial({ map: matMap, bumpMap: matMap, bumpScale: .012, roughness: 1, color: '#bdc6ac' })));
  mat.rotation.x = -Math.PI / 2; mat.position.set(.1, -.025, 0); mat.receiveShadow = true; scene.add(mat);

  const toy = new THREE.Group(); toy.name = 'Pip'; scene.add(toy);
  const rollPivot = new THREE.Group(); rollPivot.position.z = -.58; toy.add(rollPivot);
  const parts = new THREE.Group(); parts.position.z = .58; rollPivot.add(parts);
  const body = new THREE.Mesh(ownGeometry(extruded(silhouette(), .43, .065)), [paint, endgrain]);
  body.name = 'Pip-body'; body.castShadow = body.receiveShadow = true; parts.add(body);

  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(ownGeometry(extruded(earShape(side === 1), .085, .032)), [terra, endgrain]);
    ear.position.z = side * .315; ear.name = side === 1 ? 'Pip-right-ear-chipped' : 'Pip-left-ear';
    if (side === -1) ear.position.x = .04;
    ear.castShadow = ear.receiveShadow = true; parts.add(ear);
    const eye = new THREE.Mesh(ownGeometry(new THREE.SphereGeometry(.037, 20, 14)), dark);
    eye.position.set(-1.49, 1.69, side * .281); eye.scale.z = .19; eye.name = `Pip-eye-${side}`; parts.add(eye);
  }
  const nose = new THREE.Mesh(ownGeometry(new THREE.SphereGeometry(.115, 30, 20)), wood);
  nose.material = ownMaterial(new THREE.MeshStandardMaterial({ map: ownTexture(woodTexture('wood')), color: '#604632', roughness: .83 }));
  nose.scale.set(1.0, .90, 1.16); nose.position.set(-2.13, 1.42, .018); nose.rotation.z = .12; nose.castShadow = true; parts.add(nose);

  const axleGeo = ownGeometry(new THREE.CylinderGeometry(.067, .067, 1.28, 28));
  axleGeo.rotateX(Math.PI / 2);
  for (const x of [frontX, rearX]) {
    const axle = new THREE.Mesh(axleGeo, wood); axle.position.set(x, radius, 0); axle.name = x === frontX ? 'Pip-front-axle' : 'Pip-rear-axle'; axle.castShadow = true; parts.add(axle);
  }

  const wheelSideGeo = ownGeometry(new THREE.CylinderGeometry(radius, radius, .14, 72, 1, false));
  wheelSideGeo.rotateX(Math.PI / 2);
  // The caps use world X/Y UVs so their grain rotates with the wheel, not the camera.
  const blueFace = surface(wheelTexture(true), { bumpScale: .011 });
  const oldFace = surface(wheelTexture(false), { bumpScale: .010 });
  const newFace = surface(wheelTexture(false, true), { bumpScale: .006 });
  const blueSide = surface(woodTexture('blue'), { color: '#a7b8bd' });
  const hubGeo = ownGeometry(new THREE.CylinderGeometry(.075, .084, .035, 28)); hubGeo.rotateX(Math.PI / 2);
  const trimGeo = ownGeometry(new THREE.TorusGeometry(radius - .017, .016, 8, 72));
  const wheel = (front: boolean, fresh = false) => {
    const group = new THREE.Group();
    const face = fresh ? newFace : front ? blueFace : oldFace;
    const disk = new THREE.Mesh(wheelSideGeo, [front ? blueSide : fresh ? freshWood : wood, face, face]);
    disk.castShadow = disk.receiveShadow = true; group.add(disk);
    for (const z of [-.072, .072]) {
      const rim = new THREE.Mesh(trimGeo, front ? blueSide : fresh ? freshWood : wood); rim.position.z = z; rim.castShadow = true; group.add(rim);
      const hub = new THREE.Mesh(hubGeo, wood); hub.position.z = z * 1.35; hub.castShadow = true; group.add(hub);
    }
    return group;
  };
  const wheels: THREE.Group[] = [];
  for (const [x, z, name] of [[frontX, -axleZ, 'front-left'], [frontX, axleZ, 'front-right'], [rearX, -axleZ, 'rear-left'], [rearX, axleZ, 'rear-right-original']] as const) {
    const w = wheel(x === frontX); w.position.set(x, radius, z); w.name = `Pip-wheel-${name}`; parts.add(w); wheels.push(w);
  }
  const rightRear = wheels[3];
  const replacement = wheel(false, true); replacement.name = 'Pip-wheel-rear-right-new'; parts.add(replacement);
  const sleeve = new THREE.Mesh(ownGeometry(new THREE.TorusGeometry(.116, .036, 14, 40)), sleeveMaterial);
  sleeve.name = 'Pip-rear-sleeve'; sleeve.castShadow = true; parts.add(sleeve);

  const sunMap = ownTexture(sunTexture());
  const sun = new THREE.Mesh(ownGeometry(new THREE.PlaneGeometry(.55, .43)), ownMaterial(new THREE.MeshStandardMaterial({ map: sunMap, transparent: true, alphaTest: .04, roughness: 1, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1 })));
  sun.name = 'Pip-belly-sun'; sun.rotation.x = Math.PI / 2; sun.position.set(.07, .560, 0); parts.add(sun);
  const scratchMaterial = ownMaterial(new THREE.MeshStandardMaterial({ color: '#765539', roughness: 1 }));
  for (let i = 0; i < 3; i++) {
    const mark = new THREE.Mesh(ownGeometry(new THREE.BoxGeometry(.015, .004, .13 + i * .016)), scratchMaterial);
    mark.position.set(.64 + i * .085, [.578, .582, .586][i], .01); mark.rotation.y = (i - 1) * .12; mark.name = `Pip-move-mark-${i + 1}`; parts.add(mark);
  }

  const supports = new THREE.Group(); scene.add(supports);
  const supportMeshes = supportProfiles.map(profile => {
    const block = new THREE.Mesh(ownGeometry(supportCradle(profile)), freshWood);
    block.position.set(profile.x, 0, profile.z);
    block.castShadow = block.receiveShadow = true; supports.add(block);
    return block;
  });

  const bag = new THREE.Group(); bag.name = 'Return-bag-for-plan-B-only'; scene.add(bag);
  const oldReturn = wheel(false); oldReturn.name = 'Pip-returned-original-wheel'; oldReturn.position.set(0, .48, .02); bag.add(oldReturn);
  const paper = ownMaterial(new THREE.MeshStandardMaterial({ color: '#f1e4c9', transparent: true, opacity: .33, roughness: 1, side: THREE.DoubleSide, depthWrite: false }));
  const backPaper = new THREE.Mesh(ownGeometry(new THREE.PlaneGeometry(1.22, 1.32)), paper); backPaper.position.set(0, .65, -.16); bag.add(backPaper);
  const frontPaper = new THREE.Mesh(ownGeometry(new THREE.PlaneGeometry(1.22, 1.12)), paper); frontPaper.position.set(0, .55, .17); bag.add(frontPaper);
  const fold = new THREE.Mesh(ownGeometry(new THREE.PlaneGeometry(1.22, .18)), paper); fold.rotation.x = -.35; fold.position.set(0, 1.12, .13); bag.add(fold);
  const bagLineMaterial = ownMaterial(new THREE.LineBasicMaterial({ color: '#a79373', transparent: true, opacity: .4 }));
  const seam = new THREE.Line(ownGeometry(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.6, 1.12, .18), new THREE.Vector3(-.6, .02, .18), new THREE.Vector3(.6, .02, .18), new THREE.Vector3(.6, 1.12, .18)])), bagLineMaterial); bag.add(seam);
  bag.position.set(2.0, 0, 1.15); bag.rotation.y = -.16;

  const previews = new THREE.Group(); scene.add(previews);
  const previewSleeve = new THREE.Mesh(sleeve.geometry, sleeveMaterial); previewSleeve.position.set(.55, .17, 1.43); previewSleeve.rotation.x = -Math.PI / 2; previewSleeve.scale.setScalar(1.3); previews.add(previewSleeve);
  const previewWheel = wheel(false, true); previewWheel.position.set(1.68, .11, 1.43); previewWheel.rotation.x = -Math.PI / 2; previews.add(previewWheel);

  const rubGeometry = ownGeometry(new THREE.TorusGeometry(.39, .012, 8, 44, Math.PI * .44));
  const rub = new THREE.Mesh(rubGeometry, ownMaterial(new THREE.MeshBasicMaterial({ color: '#bd6551', transparent: true, opacity: .85 })));
  rub.position.set(rearX, radius, .385); rub.rotation.z = .78; parts.add(rub);

  // A stable shadow sheet supplements the real shadow at the four contact patches.
  const contactMap = ownTexture(contactTexture());
  const contact = new THREE.Mesh(ownGeometry(new THREE.PlaneGeometry(5.35, 1.75)), ownMaterial(new THREE.MeshBasicMaterial({ map: contactMap, transparent: true, opacity: .36, depthWrite: false })));
  contact.rotation.x = -Math.PI / 2; contact.position.y = .012; scene.add(contact);

  const track = new THREE.Group(); scene.add(track);
  const trackMaterial = ownMaterial(new THREE.MeshBasicMaterial({ color: '#8f8572', transparent: true, opacity: .16, depthWrite: false }));
  for (const z of [-axleZ, axleZ]) {
    const strip = new THREE.Mesh(ownGeometry(new THREE.PlaneGeometry(6.4, .012)), trackMaterial); strip.rotation.x = -Math.PI / 2; strip.position.set(-.2, .008, z); track.add(strip);
  }
  const markerMaterial = ownMaterial(new THREE.MeshBasicMaterial({ color: '#8e826b', transparent: true, opacity: .32 }));
  for (const x of [1.60, -1.45]) {
    const marker = new THREE.Mesh(ownGeometry(new THREE.PlaneGeometry(.013, 1.25)), markerMaterial); marker.rotation.x = -Math.PI / 2; marker.position.set(x, .01, 0); track.add(marker);
  }

  const ropeSegments = 90, ropeSides = 7;
  const ropePosition = new Float32Array((ropeSegments + 1) * ropeSides * 3);
  const ropeNormal = new Float32Array(ropePosition.length);
  const ropeUv = new Float32Array((ropeSegments + 1) * ropeSides * 2);
  const ropeIndices: number[] = [];
  for (let i = 0; i <= ropeSegments; i++) for (let j = 0; j < ropeSides; j++) {
    const index = i * ropeSides + j;
    ropeUv[index * 2] = j / ropeSides; ropeUv[index * 2 + 1] = i / ropeSegments * 18;
    if (i < ropeSegments) { const a = index, b = i * ropeSides + (j + 1) % ropeSides, c = a + ropeSides, d = b + ropeSides; ropeIndices.push(a, b, c, b, d, c); }
  }
  const ropeGeometry = ownGeometry(new THREE.BufferGeometry());
  ropeGeometry.setAttribute('position', new THREE.BufferAttribute(ropePosition, 3).setUsage(THREE.DynamicDrawUsage));
  ropeGeometry.setAttribute('normal', new THREE.BufferAttribute(ropeNormal, 3).setUsage(THREE.DynamicDrawUsage));
  ropeGeometry.setAttribute('uv', new THREE.BufferAttribute(ropeUv, 2)); ropeGeometry.setIndex(ropeIndices);
  const rope = new THREE.Mesh(ropeGeometry, cordMaterial); rope.castShadow = true; rope.frustumCulled = false; scene.add(rope);
  const anchor = new THREE.Vector3(-2.10, 1.36, .12);
  const curvePoints = Array.from({ length: 7 }, () => new THREE.Vector3());
  const curve = new THREE.CatmullRomCurve3(curvePoints, false, 'centripetal');
  const temp = new THREE.Vector3(), tangent = new THREE.Vector3(), binormal = new THREE.Vector3(), normal = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const target = new THREE.Vector3();
  const focusPoints: Record<'wheel' | 'ear' | 'paint' | 'sun', THREE.Vector3> = {
    wheel: new THREE.Vector3(rearX, radius + .14, axleZ + .10), ear: new THREE.Vector3(-1.06, 1.11, .38), paint: new THREE.Vector3(.62, 1.18, .28), sun: new THREE.Vector3(.07, .560, .02),
  };
  let width = 1, height = 1, mobile = false, lost = false, disposed = false;
  let lastFrame: SceneFrame | null = null;

  function onLost(event: Event) {
    event.preventDefault(); lost = true;
    onFailure('The live workbench paused. The illustrated chapter remains available.');
  }
  function onRestored() { lost = false; }
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);

  const api: PipScene = {
    resize(w, h, isMobile) {
      width = Math.max(1, w); height = Math.max(1, h); mobile = isMobile;
      const ratio = Math.min(window.devicePixelRatio || 1, mobile ? 1.7 : 2, Math.sqrt(2600000 / (width * height)));
      renderer.setPixelRatio(ratio); renderer.setSize(width, height, false);
    },
    render(frame) {
      lastFrame = { ...frame };
      if (lost || disposed) return;
      const story = clamp(frame.story, 0, 9);
      const i = Math.min(8, Math.floor(story));
      const t = smooth(story - i);
      const a = poses[i], b = poses[i + 1];
      const pose = {} as Pose;
      for (const k of Object.keys(a) as Array<keyof Pose>) pose[k] = mix(a[k], b[k], t);
      if (story === 9) Object.assign(pose, poses[9]);
      if (frame.reducedMotion) {
        Object.assign(pose, poses[Math.round(story)]);
        // A stationary underside still communicates the same complete story.
      }

      let displacement = 0;
      const trialWeight = story < 6 ? smooth((story - 5.5) / .5) : story <= 6.5 ? 1 : 1 - smooth((story - 6.5) / .5);
      displacement -= clamp(frame.trialProgress) * 1.65 * trialWeight;
      const roadInput = clamp(frame.roadProgress ?? (story === 8 ? frame.chapterProgress ?? 0 : story > 8 ? 1 : 0));
      const roadHold = frame.reducedMotion ? (roadInput < .5 ? 0 : 1) : roadInput;
      const roadWeight = story < 8 ? smooth(story - 7) : 1 - smooth(story - 8);
      displacement -= roadHold * 1.35 * roadWeight;
      const tug = clamp(frame.heroTug) * (1 - smooth(story * 2));
      displacement -= tug * .12;
      toy.position.set(pose.x + displacement, 0, pose.z);
      rollPivot.rotation.x = pose.roll;
      parts.updateMatrixWorld(true);

      const assembly = story < 4 ? 0 : story > 5 ? 1 : smooth((story - 4) * 1.05);
      const fitting = story >= 4.5 && story < 5.5 && frame.assemblyProgress !== undefined ? clamp(frame.assemblyProgress) : assembly;
      const beforeComparison = story >= 6.5 && story < 7.5 && frame.compareState === 'before';
      const beforeTrial = story >= 5.5 && story < 6.5 && frame.trialMode === 'before';
      const faultPreview = story >= 2.5 && story < 3.5 && frame.faultSmooth;
      const repaired = (story >= 4.7 && !beforeComparison && !beforeTrial) || faultPreview;
      const crooked = faultPreview ? 0 : repaired ? -.16 * (1 - fitting) : -.16;
      const spin = -displacement / radius;
      for (const w of wheels) { w.rotation.set(0, 0, spin); }
      rightRear.rotation.x = crooked;
      rightRear.position.set(rearX, radius * Math.cos(crooked), axleZ);
      const replace = frame.repairPlan === 'B' && story >= 4.42 && !beforeComparison && !beforeTrial;
      rightRear.visible = !replace;
      replacement.visible = replace;
      replacement.position.set(rearX, radius, axleZ + (1 - fitting) * .82);
      replacement.rotation.set(0, 0, spin);
      sleeve.visible = frame.repairPlan === 'A' && story >= 4.30 && !beforeComparison && !beforeTrial;
      sleeve.position.set(rearX, radius, axleZ + .093 + (1 - fitting) * .90);
      sleeve.rotation.z = spin;
      bag.visible = frame.repairPlan === 'B' && story >= 4.48 && !beforeComparison && !beforeTrial;
      bag.scale.setScalar(mix(.96, 1, smooth((story - 4.48) * 2)));
      bag.position.set(2.0 + pose.x * .35, 0, 1.15);
      previews.visible = story >= 3.75 && story < 4.4;
      previews.position.z = -.1;
      rub.visible = story >= 2.8 && story <= 3.6 && !frame.faultSmooth;
      supports.visible = story >= 1.1 && story <= 2.94;
      const supportAmount = clamp(Math.abs(pose.roll) / 1.03);
      supports.position.x = toy.position.x;
      supports.position.z = toy.position.z;
      supportMeshes.forEach((block, index) => { block.position.z = supportProfiles[index].z + supportSlide(pose.roll, supportProfiles[index]); });
      contact.position.x = toy.position.x;
      contact.position.z = toy.position.z;
      contact.scale.set(1, mix(1, .76, supportAmount), 1);
      (contact.material as THREE.MeshBasicMaterial).opacity = .29 * (1 - .35 * supportAmount);
      track.visible = story > 5.4 && story < 8.95;
      (trackMaterial as THREE.MeshBasicMaterial).opacity = story < 7 ? .15 : .09;
      mat.position.x = story > 7.5 ? mix(.1, 3.5, smooth((story - 7.5) / .5)) : .1;

      const aspect = width / height;
      const mobileWidth = frame.repairPlan === 'B' && story >= 4.4 ? 5.8 : 5.0;
      const viewHeight = mobile ? Math.max(3.45, mobileWidth / aspect) : Math.max(pose.height, 8.1 / aspect);
      camera.left = -viewHeight * aspect / 2; camera.right = viewHeight * aspect / 2;
      camera.top = viewHeight / 2; camera.bottom = -viewHeight / 2;
      const targetX = mobile ? toy.position.x * .16 : pose.targetX;
      target.set(targetX, mobile ? 1.0 : pose.targetY, 0);
      const azimuth = mobile ? pose.azimuth * .6 : pose.azimuth;
      const elevation = mobile ? Math.max(.20, pose.elevation) : pose.elevation;
      camera.position.set(target.x + Math.sin(azimuth) * 12, target.y + Math.sin(elevation) * 12, Math.cos(azimuth) * Math.cos(elevation) * 12);
      camera.lookAt(target); camera.updateProjectionMatrix();
      toy.updateMatrixWorld(true);

      temp.copy(anchor); parts.localToWorld(temp);
      const handover = smooth((story - 8) * 1.1);
      curvePoints[0].copy(temp);
      curvePoints[1].set(temp.x - .10, Math.max(.20, temp.y * .52), temp.z + .05);
      curvePoints[2].set(temp.x - .34, .040, temp.z + .29);
      curvePoints[3].set(temp.x - 1.12, .042, 1.18 - tug * .36);
      curvePoints[4].set(temp.x - 2.20, .040, 1.38 - handover * .43);
      curvePoints[5].set(temp.x - 2.87 + handover * .22, .042, .92);
      curvePoints[6].set(temp.x - 3.52 + handover * .6, .045, 1.10 - handover * .22);
      for (let n = 0; n <= ropeSegments; n++) {
        const u = n / ropeSegments;
        curve.getPoint(u, temp); curve.getTangent(u, tangent);
        binormal.crossVectors(tangent, up);
        if (binormal.lengthSq() < .001) binormal.set(1, 0, 0); else binormal.normalize();
        normal.crossVectors(binormal, tangent).normalize();
        for (let j = 0; j < ropeSides; j++) {
          const angle = j / ropeSides * Math.PI * 2 + u * Math.PI * 14;
          const ca = Math.cos(angle), sa = Math.sin(angle);
          const nx = normal.x * ca + binormal.x * sa, ny = normal.y * ca + binormal.y * sa, nz = normal.z * ca + binormal.z * sa;
          const k = (n * ropeSides + j) * 3;
          ropePosition[k] = temp.x + nx * .023; ropePosition[k + 1] = temp.y + ny * .023; ropePosition[k + 2] = temp.z + nz * .023;
          ropeNormal[k] = nx; ropeNormal[k + 1] = ny; ropeNormal[k + 2] = nz;
        }
      }
      ropeGeometry.attributes.position.needsUpdate = true; ropeGeometry.attributes.normal.needsUpdate = true;
      renderer.render(scene, camera);
    },
    projectPoint(id) {
      const point = focusPoints[id].clone(); parts.localToWorld(point); point.project(camera);
      return { x: (point.x + 1) * width / 2, y: (1 - point.y) * height / 2 };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      canvas.removeEventListener('webglcontextlost', onLost); canvas.removeEventListener('webglcontextrestored', onRestored);
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      for (const t of textures) t.dispose();
      light.shadow.map?.dispose();
      renderer.dispose();
    },
  };
  // One authored surface is shared by the same body through every chapter.
  // A failed or late image cannot change the repair branch or restart a pose.
  new THREE.TextureLoader().load(
    new URL('art/paint-texture.webp', document.baseURI).href,
    generatedPaint => {
      if (disposed) { generatedPaint.dispose(); return; }
      ownTexture(generatedPaint);
      generatedPaint.colorSpace = THREE.SRGBColorSpace;
      generatedPaint.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      paint.map = generatedPaint;
      paint.bumpMap = generatedPaint;
      paint.bumpScale = .008;
      paint.needsUpdate = true;
      if (lastFrame && !document.hidden) api.render(lastFrame);
    },
    undefined,
    () => { /* The complete seeded wood surface remains available. */ },
  );
  return api;
}
