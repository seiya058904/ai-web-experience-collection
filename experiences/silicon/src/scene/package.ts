import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  block, clamp, disposeTree, metal, mix, palette, seededRandom, smooth,
  type ExhibitModel, type SceneState,
} from './shared';

/** One continuous assembly, used by the package, signal and closing scenes. */
export interface PackageModel extends ExhibitModel {
  setMode(mode: 'package' | 'signal' | 'final'): void;
}

type Route = { points: THREE.Vector3[]; length: number; lengths: number[]; phase: number };
const IP_WIDTH = 6.62;
const IP_DEPTH = 4.92;
const IP_Y = -.70;
const LOGIC_X = [-.91, .91];
const MEMORY_X = [-2.44, 2.44];
const MEMORY_Z = [-1.46, 1.46];

function canvasTexture(canvas: HTMLCanvasElement) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Authored buses connect the actual chiplet and memory landing areas. */
function makeInterposerTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048; canvas.height = 1536;
  const ctx = canvas.getContext('2d')!;
  const point = (x: number, z: number) => [(x / IP_WIDTH + .5) * canvas.width, (z / IP_DEPTH + .5) * canvas.height];
  const path = (points: number[][], shade: string, width = .8) => {
    ctx.strokeStyle = shade; ctx.lineWidth = width; ctx.beginPath();
    points.forEach((p, i) => { const [x, y] = point(p[0], p[1]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.stroke();
  };
  ctx.fillStyle = '#2c383d'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Fine orthogonal substrate grain; deliberately far quieter than the copper buses.
  ctx.lineWidth = .5; ctx.strokeStyle = '#344247';
  for (let i = 0; i < 140; i++) {
    const y = i * canvas.height / 140;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
  for (const sign of [-1, 1]) {
    for (const front of [-1, 1]) {
      // Bundled, individually escaped memory buses: 45-degree corners, exact endpoints.
      for (let i = 0; i < 32; i++) {
        const lane = (i - 15.5) * .024;
        const edge = 1.65 + (i % 4) * .013;
        path([
          [sign * (1.08 + lane * .76), front * 1.14],
          [sign * (1.08 + lane * .76), front * (1.28 + i * .010)],
          [sign * (edge - .20), front * (1.48 + i * .010)],
          [sign * (edge + .04), front * (1.48 + i * .010)],
          [sign * 1.89, front * (1.20 + i * .015)],
          [sign * 2.10, front * (1.20 + i * .015)],
        ], i % 6 === 0 ? '#d1aa78' : '#b28c60', i % 6 === 0 ? 1.35 : .92);
      }
      // Fan-out from the logic dies to the through-silicon connection field.
      for (let i = 0; i < 43; i++) {
        const x = sign * (.20 + i * .032);
        const outer = sign * (.30 + i * .052);
        path([[x, front * 1.14], [x, front * (1.75 - i * .010)], [outer, front * 2.18], [outer, front * 2.35]],
          i % 5 === 0 ? '#c39a6a' : '#957751', .92);
      }
    }
    // Fine power traces run around the perimeter; four quiet register marks anchor the drawing.
    for (let i = 0; i < 9; i++) {
      const pad = .05 + i * .027;
      path([[-3.23 + pad, sign * (2.37 - pad)], [3.23 - pad, sign * (2.37 - pad)]], '#806849', .8);
    }
  }
  // Wide, short inter-chiplet connections in the centre of the silicon interposer.
  for (let i = 0; i < 46; i++) {
    const z = -.95 + i * .042;
    path([[-.23, z], [.23, z]], i % 4 === 0 ? '#bca07a' : '#93744e', 1);
  }
  // Landing fields stay visible when their components lift. These are pads, not extra dies.
  for (const sx of MEMORY_X) for (const sz of MEMORY_Z) {
    for (let x = 0; x < 11; x++) for (let z = 0; z < 10; z++) {
      const p = point(sx - .47 + x * .094, sz - .45 + z * .10);
      ctx.fillStyle = (x + z) % 4 === 0 ? '#c9ae79' : '#807351';
      ctx.fillRect(p[0] - 1.4, p[1] - 1.4, 2.8, 2.8);
    }
  }
  for (const sx of LOGIC_X) for (let x = 0; x < 16; x++) for (let z = 0; z < 25; z++) {
    const p = point(sx - .64 + x * .084, -1.05 + z * .088);
    ctx.fillStyle = '#837e61'; ctx.fillRect(p[0] - 1, p[1] - 1, 2, 2);
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const [x, y] = point(sx * 3.13, sz * 2.28);
    ctx.strokeStyle = '#c3ad7d'; ctx.lineWidth = 1.6;
    ctx.strokeRect(x - 10, y - 10, 20, 20);
    ctx.beginPath(); ctx.moveTo(x - 17, y); ctx.lineTo(x + 17, y); ctx.moveTo(x, y - 17); ctx.lineTo(x, y + 17); ctx.stroke();
  }
  return canvasTexture(canvas);
}

/** A regular floorplan with memory banks, standard-cell rows and a restrained copper mesh. */
function makeLogicTexture(seed: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 1536;
  const ctx = canvas.getContext('2d')!;
  const rand = seededRandom(seed);
  ctx.fillStyle = '#65727a'; ctx.fillRect(0, 0, 1024, 1536);
  const drawMacro = (x: number, y: number, w: number, h: number, memory: boolean) => {
    ctx.fillStyle = memory ? '#78858a' : '#5c6971'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#c6c5b3'; ctx.lineWidth = 1.4; ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
    if (memory) {
      ctx.strokeStyle = '#a1afa8'; ctx.lineWidth = .95;
      for (let line = 7; line < h - 5; line += 7) {
        ctx.beginPath(); ctx.moveTo(x + 5, y + line); ctx.lineTo(x + w - 5, y + line); ctx.stroke();
      }
      ctx.strokeStyle = '#46545b';
      for (let line = 7; line < w - 5; line += 12) {
        ctx.beginPath(); ctx.moveTo(x + line, y + 4); ctx.lineTo(x + line, y + h - 4); ctx.stroke();
      }
    } else {
      for (let line = 7; line < h - 4; line += 8) {
        for (let px = 5; px < w - 8; px += 11 + Math.floor(rand() * 4)) {
          ctx.fillStyle = rand() > .55 ? '#a4b0ab' : '#7d908f';
          ctx.fillRect(x + px, y + line, 5 + rand() * 6, 2);
        }
      }
    }
  };
  // Mirrored banks flank four original compute islands.
  for (let row = 0; row < 6; row++) {
    drawMacro(37, 48 + row * 228, 186, 204, true);
    drawMacro(801, 48 + row * 228, 186, 204, true);
  }
  for (let row = 0; row < 4; row++) for (let col = 0; col < 2; col++) {
    drawMacro(259 + col * 259, 48 + row * 337, 224, 302, false);
  }
  ctx.strokeStyle = '#b5a584'; ctx.lineWidth = 1;
  for (let i = 0; i < 10; i++) {
    const y = 1420 + i * 7;
    ctx.beginPath(); ctx.moveTo(36, y); ctx.lineTo(988, y); ctx.stroke();
  }
  for (const x of [236, 248, 495, 506, 765, 779]) {
    ctx.strokeStyle = x % 2 === 0 ? '#a4a897' : '#7a8b8a';
    ctx.beginPath(); ctx.moveTo(x, 40); ctx.lineTo(x, 1450); ctx.stroke();
  }
  ctx.strokeStyle = '#c1c4b0'; ctx.lineWidth = 2; ctx.strokeRect(17, 17, 990, 1502);
  return canvasTexture(canvas);
}

function makeLidTextures() {
  const colour = document.createElement('canvas'); colour.width = 2048; colour.height = 1536;
  const bump = document.createElement('canvas'); bump.width = 2048; bump.height = 1536;
  const c = colour.getContext('2d')!; const b = bump.getContext('2d')!;
  const rand = seededRandom(1807);
  c.fillStyle = '#cdd2d2'; c.fillRect(0, 0, 2048, 1536);
  b.fillStyle = '#ababab'; b.fillRect(0, 0, 2048, 1536);
  // Actual material microstructure rather than a glow or a raster background scene.
  for (let i = 0; i < 3800; i++) {
    const y = rand() * 1536; const x = rand() * 1900;
    c.strokeStyle = `rgba(${rand() > .5 ? '240,244,242' : '40,47,53'},${.035 + rand() * .050})`;
    c.lineWidth = .4 + rand() * .55;
    c.beginPath(); c.moveTo(x, y); c.lineTo(Math.min(2048, x + 60 + rand() * 850), y + .25); c.stroke();
    b.strokeStyle = `rgba(255,255,255,${.01 + rand() * .045})`; b.lineWidth = .6;
    b.beginPath(); b.moveTo(x, y); b.lineTo(Math.min(2048, x + 200 + rand() * 1000), y); b.stroke();
  }
  const word = 'SILICON';
  const tracking = 124; const start = 1024 - ((word.length - 1) * tracking) / 2;
  c.font = '78px Arial, sans-serif'; b.font = '78px Arial, sans-serif';
  c.textAlign = b.textAlign = 'center'; c.textBaseline = b.textBaseline = 'middle';
  for (let i = 0; i < word.length; i++) {
    c.fillStyle = '#344044'; c.fillText(word[i], start + tracking * i, 778);
    b.fillStyle = '#303030'; b.fillText(word[i], start + tracking * i, 778);
  }
  c.font = '17px monospace'; c.fillStyle = '#727d80'; c.textAlign = 'left';
  c.fillText('S—01   /   FROM SAND TO SIGNAL', 146, 1320);
  c.font = '15px monospace'; c.textAlign = 'right'; c.fillText('COMPUTE ASSEMBLY', 1900, 1320);
  const map = canvasTexture(colour); const bumpMap = new THREE.CanvasTexture(bump); bumpMap.anisotropy = 4;
  return { map, bumpMap };
}

function surface(width: number, depth: number, material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

function instanceBoxes(geometry: THREE.BufferGeometry, material: THREE.Material, transforms: THREE.Matrix4[]) {
  const mesh = new THREE.InstancedMesh(geometry, material, transforms.length);
  transforms.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  return mesh;
}

function transform(x: number, y: number, z: number, sx = 1, sy = sx, sz = sx) {
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(sx, sy, sz));
}

function getRoute(points: number[][], phase = 0): Route {
  const vertices = points.map(point => new THREE.Vector3(...point as [number, number, number]));
  const lengths = [0]; let length = 0;
  for (let i = 1; i < vertices.length; i++) { length += vertices[i].distanceTo(vertices[i - 1]); lengths.push(length); }
  return { points: vertices, lengths, length, phase };
}

function sampleRoute(route: Route, amount: number, target: THREE.Vector3) {
  const distance = clamp(amount) * route.length;
  for (let i = 1; i < route.points.length; i++) {
    if (distance <= route.lengths[i]) return target.lerpVectors(route.points[i - 1], route.points[i],
      (distance - route.lengths[i - 1]) / (route.lengths[i] - route.lengths[i - 1]));
  }
  return target.copy(route.points[route.points.length - 1]);
}

function routeMesh(route: Route, material: THREE.Material, width = .008) {
  // Straight rectangular copper sections keep lithographic right angles crisp.
  const positions: number[] = [];
  for (let i = 1; i < route.points.length; i++) {
    const a = route.points[i - 1], b = route.points[i];
    const dx = b.x - a.x, dz = b.z - a.z;
    const len = Math.hypot(dx, dz);
    if (len < .0001) continue;
    const ox = -dz / len * width / 2, oz = dx / len * width / 2;
    const corners = [a.x + ox, a.y, a.z + oz, b.x + ox, b.y, b.z + oz, b.x - ox, b.y, b.z - oz,
      a.x + ox, a.y, a.z + oz, b.x - ox, b.y, b.z - oz, a.x - ox, a.y, a.z - oz];
    positions.push(...corners);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, material);
}

export function createPackageModel(): PackageModel {
  const group = new THREE.Group(); group.name = 'silicon-package-assembly';
  let mode: 'package' | 'signal' | 'final' = 'package';
  const graphite = metal(0x263137, .25, .90);
  const substrateMat = metal(0x17272b, .48, .45);
  const darkCeramic = metal(0x202629, .36, .42);
  const brushed = metal(0xc7cdd0, .18, .98);
  const copper = metal(0xb67c52, .17, .98);
  const contactGold = metal(0xc1a374, .15, .98);
  const solder = metal(0x788990, .21, .97);
  const dielectric = metal(0x172529, .51, .25);
  const anchors: Record<string, THREE.Vector3> = {
    substrate: new THREE.Vector3(3.3, -.96, 1.86),
    interposer: new THREE.Vector3(3.17, -.61, 1.58),
    compute: new THREE.Vector3(.9, -.35, -.2),
    hbm: new THREE.Vector3(2.44, .07, 1.46),
    lid: new THREE.Vector3(1.4, .34, .25),
    signal: new THREE.Vector3(0, -.62, .2),
  };

  // Organic package substrate: a genuine laminated edge, top pads and BGA underneath.
  const substrate = new THREE.Group(); substrate.name = 'laminated-package-substrate'; group.add(substrate);
  const base = block(7.2, .26, 5.6, substrateMat, .055); base.position.y = -1.035; substrate.add(base);
  const edgeA = block(7.17, .012, 5.57, copper, .02); edgeA.position.y = -1.137; substrate.add(edgeA);
  const edgeB = block(7.17, .009, 5.57, copper, .02); edgeB.position.y = -.972; substrate.add(edgeB);
  const baseTop = block(7.18, .037, 5.58, graphite, .021); baseTop.position.y = -.892; substrate.add(baseTop);
  const edgeFace = block(7.195, .055, 5.595, dielectric, .025); edgeFace.position.y = -1.055; substrate.add(edgeFace);

  const bgaTransforms: THREE.Matrix4[] = [];
  for (let row = 0; row < 25; row++) for (let col = 0; col < 33; col++) {
    // Four relief windows make the underside a designed manufacturing field.
    if ((row === 11 || row === 12 || row === 13) && (col > 8 && col < 13 || col > 19 && col < 24)) continue;
    bgaTransforms.push(transform((col - 16) * .209, -1.29, (row - 12) * .21, .082, .092, .082));
  }
  const bga = instanceBoxes(new THREE.SphereGeometry(1, 10, 7), solder, bgaTransforms); bga.name = 'ball-grid-array'; substrate.add(bga);

  const padTransforms: THREE.Matrix4[] = [];
  for (let i = 0; i < 58; i++) for (const sign of [-1, 1]) {
    padTransforms.push(transform(-3.38 + i * .1185, -1.025, sign * 2.798, .068, .070, .012));
  }
  for (let i = 0; i < 44; i++) for (const sign of [-1, 1]) {
    padTransforms.push(transform(sign * 3.598, -1.025, -2.58 + i * .120, .013, .070, .070));
  }
  substrate.add(instanceBoxes(new THREE.BoxGeometry(1, 1, 1), contactGold, padTransforms));

  // Individually modelled surface-mount capacitors on exposed substrate margins.
  const passiveBodies: THREE.Matrix4[] = [], passiveEnds: THREE.Matrix4[] = [], passivePads: THREE.Matrix4[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 20; i++) {
    if (i === 8 || i === 9 || i === 14) continue;
    const x = (i - 9.5) * .292, z = side * 2.59;
    passiveBodies.push(transform(x, -.841, z, .11, .054, .066));
    for (const edge of [-1, 1]) {
      passiveEnds.push(transform(x + edge * .047, -.841, z, .023, .057, .070));
      passivePads.push(transform(x + edge * .065, -.868, z, .053, .008, .095));
    }
  }
  substrate.add(instanceBoxes(new THREE.BoxGeometry(1, 1, 1), darkCeramic, passiveBodies));
  substrate.add(instanceBoxes(new THREE.BoxGeometry(1, 1, 1), brushed, passiveEnds));
  substrate.add(instanceBoxes(new THREE.BoxGeometry(1, 1, 1), contactGold, passivePads));
  for (const x of [-3.42, 3.42]) for (const z of [-2.62, 2.62]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.042, .008, 5, 18), contactGold);
    ring.rotation.x = Math.PI / 2; ring.position.set(x, -.868, z); substrate.add(ring);
  }

  // Silicon interposer is above the organic substrate, with a distinct solder interface.
  const interposer = new THREE.Group(); interposer.name = 'silicon-interposer'; interposer.position.y = IP_Y; group.add(interposer);
  const interposerBody = block(IP_WIDTH, .122, IP_DEPTH, brushed, .025); interposer.add(interposerBody);
  const interposerCore = block(IP_WIDTH + .008, .078, IP_DEPTH + .008, graphite, .014); interposerCore.position.y = -.009; interposer.add(interposerCore);
  const routingTexture = makeInterposerTexture();
  const routingMaterial = new THREE.MeshStandardMaterial({
    map: routingTexture, bumpMap: routingTexture, bumpScale: .0006,
    color: 0xffffff, metalness: .96, roughness: .17, envMapIntensity: 1.15,
  });
  const routingSurface = surface(IP_WIDTH - .068, IP_DEPTH - .068, routingMaterial); routingSurface.position.y = .0625; interposer.add(routingSurface);
  const interposerBumps: THREE.Matrix4[] = [];
  for (let x = 0; x < 30; x++) for (let z = 0; z < 22; z++) {
    if ((x > 10 && x < 18) && (z > 7 && z < 14)) continue;
    interposerBumps.push(transform((x - 14.5) * .203, -.116, (z - 10.5) * .203, .050, .056, .050));
  }
  interposer.add(instanceBoxes(new THREE.SphereGeometry(1, 8, 5), solder, interposerBumps));

  // Exactly two logic chiplets. The fine floorplan is generated, not an external image.
  const computeGroups: THREE.Group[] = [];
  const heatMaterials: THREE.ShaderMaterial[] = [];
  const chipletMaterial = metal(0x414d54, .16, .96);
  LOGIC_X.forEach((x, index) => {
    const die = new THREE.Group(); die.name = `compute-chiplet-${index + 1}`; die.position.set(x, .235, 0); interposer.add(die); computeGroups.push(die);
    const foundation = block(1.51, .025, 2.34, contactGold, .014); foundation.position.y = -.086; die.add(foundation);
    const siliconBody = block(1.48, .164, 2.31, chipletMaterial, .026); die.add(siliconBody);
    const logicTexture = makeLogicTexture(210 + index * 17);
    const topMaterial = new THREE.MeshPhysicalMaterial({
      map: logicTexture, bumpMap: logicTexture, bumpScale: .00035,
      color: 0xe3e8e1, metalness: .96, roughness: .13,
      clearcoat: .14, clearcoatRoughness: .09, iridescence: .065, iridescenceIOR: 1.48,
      iridescenceThicknessRange: [170, 250], envMapIntensity: 1.15,
    });
    const face = surface(1.445, 2.275, topMaterial); face.position.y = .083; die.add(face);
    const bumps: THREE.Matrix4[] = [];
    for (let col = 0; col < 15; col++) for (let row = 0; row < 24; row++) {
      bumps.push(transform((col - 7) * .088, -.133, (row - 11.5) * .09, .025, .032, .025));
    }
    die.add(instanceBoxes(new THREE.SphereGeometry(1, 7, 4), contactGold, bumps));
    const heat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.FrontSide,
      uniforms: { power: { value: 0 }, time: { value: 0 }, bias: { value: index * .65 } },
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: `varying vec2 vUv; uniform float power; uniform float time; uniform float bias;
        void main(){
          vec2 p=vUv; float a=exp(-dot((p-vec2(.43,.38))*vec2(4.2,5.6),(p-vec2(.43,.38))*vec2(4.2,5.6)));
          float b=exp(-dot((p-vec2(.63,.69))*vec2(5.1,6.5),(p-vec2(.63,.69))*vec2(5.1,6.5)));
          float breath=.92+.08*sin(time*.72+bias); float field=(a*.80+b*.58)*power*breath;
          gl_FragColor=vec4(vec3(.89,.36,.105),field*.15);
        }`,
    });
    heatMaterials.push(heat);
    const heatFace = surface(1.437, 2.267, heat); heatFace.position.y = .0845; heatFace.renderOrder = 2; die.add(heatFace);
  });

  // Four HBM memory assemblies; eight memory layers and a base die remain individually legible.
  const memoryGroups: THREE.Group[] = [];
  const plateTransforms: THREE.Matrix4[] = [], bondTransforms: THREE.Matrix4[] = [];
  const memoryPlateGeometry = new RoundedBoxGeometry(1.12, .044, 1.10, 2, .013);
  const memoryBondGeometry = new RoundedBoxGeometry(1.09, .012, 1.07, 1, .006);
  const memoryPlates = new THREE.InstancedMesh(memoryPlateGeometry, graphite, 32);
  const memoryBonds = new THREE.InstancedMesh(memoryBondGeometry, copper, 32);
  memoryPlates.name = 'thirty-two-stacked-memory-dies'; interposer.add(memoryPlates, memoryBonds);
  const memoryPositions: Array<{x: number; z: number}> = [];
  for (const x of MEMORY_X) for (const z of MEMORY_Z) {
    const hbm = new THREE.Group(); hbm.name = `hbm-memory-stack-${memoryGroups.length + 1}`; hbm.position.set(x, .165, z); interposer.add(hbm); memoryGroups.push(hbm);
    memoryPositions.push({x, z});
    const memoryBase = block(1.145, .100, 1.125, brushed, .015); hbm.add(memoryBase);
    const baseSilicon = block(1.13, .057, 1.11, darkCeramic, .012); baseSilicon.position.y = .035; hbm.add(baseSilicon);
    const bumps: THREE.Matrix4[] = [];
    for (let col = 0; col < 10; col++) for (let row = 0; row < 10; row++) {
      bumps.push(transform((col - 4.5) * .103, -.077, (row - 4.5) * .101, .025, .031, .025));
    }
    hbm.add(instanceBoxes(new THREE.SphereGeometry(1, 7, 4), contactGold, bumps));
    for (let layer = 0; layer < 8; layer++) {
      plateTransforms.push(transform(x, .275 + layer * .066, z));
      bondTransforms.push(transform(x, .243 + layer * .066, z));
    }
  }
  plateTransforms.forEach((matrix, index) => memoryPlates.setMatrixAt(index, matrix));
  bondTransforms.forEach((matrix, index) => memoryBonds.setMatrixAt(index, matrix));
  memoryPlates.instanceMatrix.setUsage(THREE.DynamicDrawUsage); memoryBonds.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  memoryPlates.frustumCulled = memoryBonds.frustumCulled = false;

  // TSV contacts appear as short aligned copper stitches at the stack edges.
  const tsvTransforms: THREE.Matrix4[] = [];
  memoryPositions.forEach(({x, z}) => {
    for (let i = 0; i < 8; i++) for (const sign of [-1, 1]) {
      tsvTransforms.push(transform(x + (i - 3.5) * .13, .494, z + sign * .536, .018, .43, .009));
    }
  });
  const tsvStitches = instanceBoxes(new THREE.BoxGeometry(1, 1, 1), copper, tsvTransforms);
  interposer.add(tsvStitches);

  // A recessed, physically bevelled heat spreader and visible underside thermal contact blocks.
  const lid = new THREE.Group(); lid.name = 'engraved-integrated-heat-spreader'; group.add(lid);
  const lidTextures = makeLidTextures();
  const lidTopMaterial = new THREE.MeshPhysicalMaterial({
    map: lidTextures.map, bumpMap: lidTextures.bumpMap, bumpScale: .006,
    roughnessMap: lidTextures.bumpMap, color: 0xf7f9f8,
    metalness: .98, roughness: .25, envMapIntensity: 1.15,
    anisotropy: .30, anisotropyRotation: Math.PI / 2,
  });
  const lidMaterials = [brushed, brushed, lidTopMaterial, brushed, brushed, brushed];
  const lidTop = new THREE.Mesh(new RoundedBoxGeometry(6.84, .145, 5.20, 5, .062), lidMaterials);
  lid.add(lidTop);
  const flange = block(7.02, .032, 5.40, brushed, .014); flange.position.y = -.085; lid.add(flange);
  const underplate = block(6.62, .030, 4.98, graphite, .012); underplate.position.y = -.116; lid.add(underplate);
  // A shallow rolled rim keeps the cover optically thin. Thermal pedestals meet
  // the lower logic backsides; there is no deep box obscuring the memory dies.
  for (const sign of [-1, 1]) {
    const wallX = block(.085, .085, 5.17, brushed, .020); wallX.position.set(sign * 3.365, -.116, 0); lid.add(wallX);
    const wallZ = block(6.63, .085, .085, brushed, .020); wallZ.position.set(0, -.116, sign * 2.55); lid.add(wallZ);
  }
  for (const x of LOGIC_X) {
    const pedestal = block(1.44, .42, 2.24, brushed, .025); pedestal.position.set(x, -.346, 0); lid.add(pedestal);
    const thermal = block(1.40, .020, 2.20, darkCeramic, .012); thermal.position.set(x, -.566, 0); lid.add(thermal);
  }
  // Recessed attachment details along the heat-spreader flange.
  for (const x of [-3.37, 3.37]) for (const z of [-2.56, 2.56]) {
    const recess = new THREE.Mesh(new THREE.CylinderGeometry(.036, .036, .004, 16), graphite);
    recess.position.set(x, -.077, z); lid.add(recess);
  }

  // Selected signal buses correspond to the physically printed interposer routes above.
  const routes: Route[] = [];
  const traceY = .067;
  routes.push(getRoute([[-.24, traceY, -.72], [.24, traceY, -.72]], .08));
  routes.push(getRoute([[.24, traceY, .64], [-.24, traceY, .64]], .57));
  for (const side of [-1, 1]) for (const front of [-1, 1]) {
    routes.push(getRoute([
      [side * 1.08, traceY, front * 1.14],
      [side * 1.08, traceY, front * 1.40],
      [side * 1.50, traceY, front * 1.65],
      [side * 1.72, traceY, front * 1.65],
      [side * 1.89, traceY, front * 1.44],
      [side * 2.10, traceY, front * 1.44],
    ], .15 + (side + 1) * .16 + (front + 1) * .15));
  }
  routes.push(getRoute([[-.56, traceY, 2.33], [-.56, traceY, 1.94], [-.88, traceY, 1.62], [-.88, traceY, 1.14]], .21));
  routes.push(getRoute([[.68, traceY, -2.33], [.68, traceY, -1.94], [.99, traceY, -1.63], [.99, traceY, -1.14]], .79));
  const signalRoutes = new THREE.Group(); signalRoutes.name = 'connected-signal-buses'; interposer.add(signalRoutes);
  const signalTraceMaterial = new THREE.MeshBasicMaterial({color: palette.signal, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false});
  const relayRoutes: Array<{ object: THREE.Mesh; points: THREE.Vector3[]; width: number }> = [];
  routes.forEach((route, index) => {
    const conductor = routeMesh(route, copper, .025);
    conductor.name = `interposer-conductive-route-${index}`;
    signalRoutes.add(conductor);
    if (index >= 2 && index <= 5) relayRoutes.push({ object: conductor, points: route.points, width: .025 });
    const active = routeMesh(route, signalTraceMaterial, .024); active.position.y = .0008; signalRoutes.add(active);
  });
  group.userData.handoffRoutes = relayRoutes;
  const pulseMaterial = new THREE.MeshBasicMaterial({color: 0xdcefe4, transparent: true, opacity: .92, depthWrite: false, toneMapped: false});
  const pulses = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 5), pulseMaterial, routes.length * 3);
  pulses.instanceMatrix.setUsage(THREE.DynamicDrawUsage); pulses.frustumCulled = false; signalRoutes.add(pulses);
  const pulsePoint = new THREE.Vector3(); const pulseMatrix = new THREE.Matrix4(); const pulseQuaternion = new THREE.Quaternion();
  const pulseScale = new THREE.Vector3();

  // One continuous, inspectable activity route: package input → first logic
  // die → inter-chiplet connection → second die → adjacent HBM landing field.
  // Its vertical sections are genuine edge contacts, not floating screen lines.
  const dieTraceY = .323;
  const primaryRoute = getRoute([
    [-.56, traceY, 2.33], [-.56, traceY, 1.94], [-.88, traceY, 1.62], [-.88, traceY, 1.14],
    [-.88, dieTraceY, 1.14], [-.88, dieTraceY, .80], [-.42, dieTraceY, .34], [-.42, dieTraceY, -.72],
    [-.155, dieTraceY, -.72], [-.155, traceY, -.72], [.155, traceY, -.72], [.155, dieTraceY, -.72],
    [.70, dieTraceY, -.72], [1.08, dieTraceY, -.34], [1.08, dieTraceY, 1.14], [1.08, traceY, 1.14],
    [1.08, traceY, 1.40], [1.50, traceY, 1.65], [1.72, traceY, 1.65], [1.89, traceY, 1.44], [2.10, traceY, 1.44],
  ]);
  const elevatedPoints = new Set([4, 5, 6, 7, 8, 11, 12, 13, 14]);
  const primaryMaterial = new THREE.MeshStandardMaterial({
    color: 0xacc9bb, metalness: .40, roughness: .28, emissive: 0xb9ead8, emissiveIntensity: 0,
  });
  const primaryGroup = new THREE.Group(); primaryGroup.name = 'input-to-compute-to-memory-path'; interposer.add(primaryGroup);
  const primarySegmentGeometry = new THREE.CylinderGeometry(.0175, .0175, 1, 8);
  const primarySegments: THREE.Mesh[] = [];
  for (let i = 1; i < primaryRoute.points.length; i++) {
    const segment = new THREE.Mesh(primarySegmentGeometry, primaryMaterial); primaryGroup.add(segment); primarySegments.push(segment);
  }
  const packetMaterial = new THREE.MeshBasicMaterial({ color: 0xe7fff3, transparent: true, opacity: 1, depthWrite: false, toneMapped: false });
  const primaryPacket = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 7), packetMaterial, 7);
  primaryPacket.instanceMatrix.setUsage(THREE.DynamicDrawUsage); primaryPacket.frustumCulled = false; primaryGroup.add(primaryPacket);
  const segmentDirection = new THREE.Vector3();
  const vertical = new THREE.Vector3(0, 1, 0);

  // A discreet edge current introduces and closes the signal sequence on the real substrate.
  const inputRoute = getRoute([
    [-2.93, -.867, 2.69], [-2.57, -.867, 2.69], [-2.29, -.867, 2.46],
    [-1.06, -.867, 2.46], [-.57, -.867, 2.66], [-.57, -.867, 2.40],
  ]);
  const inputTrace = routeMesh(inputRoute, copper, .013); substrate.add(inputTrace);
  const inputMaterial = new THREE.MeshBasicMaterial({color: 0xddaf7b, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide});
  const inputLight = routeMesh(inputRoute, inputMaterial, .012); inputLight.position.y = .001; substrate.add(inputLight);

  // Mutates internal assembly only. The parent retains exclusive control of group transforms.
  const update = (state: SceneState) => {
    const p = clamp(state.progress), inspection = clamp(state.spread);
    const closing = mode === 'final' ? smooth(0, .45, p) : 0;
    const separation = mode === 'package' ? inspection : mode === 'signal' ? inspection * .15 : (1 - closing) * inspection * .15;
    const interposerLift = .96 * separation;
    const computeLift = .45 * separation;
    const memoryLift = .48 * separation;
    // The cover waits aside throughout PACKAGE and SIGNAL. Consequently, changing
    // scenes at progress 1 -> 0 cannot suddenly cover or uncover the electronics.
    const open = mode === 'final' ? 1 - closing : 1;
    const quietTime = state.reduced ? 0 : state.time;
    interposer.position.y = IP_Y + interposerLift;
    computeGroups.forEach((die, i) => {
      die.position.y = .235 + computeLift;
      die.position.x = LOGIC_X[i] + (i === 0 ? -.05 : .05) * separation;
    });
    memoryGroups.forEach(hbm => { hbm.position.y = .165 + memoryLift; });
    memoryPositions.forEach(({x, z}, stack) => {
      for (let layer = 0; layer < 8; layer++) {
        const spread = layer * .013 * separation;
        const i = stack * 8 + layer;
        plateTransforms[i].makeTranslation(x, .275 + layer * .066 + memoryLift + spread, z);
        bondTransforms[i].makeTranslation(x, .243 + layer * .066 + memoryLift + spread, z);
        memoryPlates.setMatrixAt(i, plateTransforms[i]); memoryBonds.setMatrixAt(i, bondTransforms[i]);
      }
    });
    memoryPlates.instanceMatrix.needsUpdate = memoryBonds.instanceMatrix.needsUpdate = true;
    tsvStitches.position.y = memoryLift + .045 * separation;
    tsvStitches.scale.y = 1 + .20 * separation;
    // A shallow rearward tilt shows the finished engraved face. The rear/upward
    // translation preserves clear sight lines to all six upper modules.
    // Closing uses the same continuous transforms in either scroll direction.
    lid.position.set(.06 * open, .20 + 2.63 * open, -2.25 * open);
    lid.rotation.x = -.23 * open;
    lid.rotation.z = -.018 * open;
    if (!state.reduced) lid.position.y += .007 * Math.sin(quietTime * .40) * smooth(.25, 1, open);

    const power = clamp(state.power) * (mode === 'final' ? 1 - closing * .92 : 1);
    const activePower = mode === 'package' ? power * .22 : power;
    signalTraceMaterial.opacity = activePower * .44;
    inputMaterial.opacity = mode === 'final' ? .11 + .15 * (.5 + .5 * Math.sin(quietTime * .8)) : activePower * .52;
    pulses.visible = state.active && activePower > .015;
    pulseMaterial.opacity = .70 + activePower * .26;
    if (pulses.visible) {
      routes.forEach((route, index) => {
        const speed = state.reduced ? 0 : quietTime * (.10 + index * .006);
        const phase = (speed + p * .55 + route.phase) % 1;
        for (let tail = 0; tail < 3; tail++) {
          const q = (phase - tail * .055 + 1) % 1;
          sampleRoute(route, q, pulsePoint); pulsePoint.y += .008;
          const radius = (.038 - tail * .008) * activePower;
          pulseScale.set(radius, radius * .70, radius);
          pulseMatrix.compose(pulsePoint, pulseQuaternion, pulseScale); pulses.setMatrixAt(index * 3 + tail, pulseMatrix);
        }
      });
      pulses.instanceMatrix.needsUpdate = true;
    }
    primaryGroup.visible = mode !== 'package' && activePower > .008;
    primaryMaterial.emissiveIntensity = activePower * 1.40;
    primaryPacket.visible = mode !== 'package' && state.active && activePower > .015;
    primaryRoute.length = 0;
    primaryRoute.lengths[0] = 0;
    primaryRoute.points.forEach((point, index) => { point.y = elevatedPoints.has(index) ? dieTraceY + computeLift : traceY; });
    for (let i = 1; i < primaryRoute.points.length; i++) {
      const a = primaryRoute.points[i - 1], b = primaryRoute.points[i];
      segmentDirection.subVectors(b, a);
      const length = segmentDirection.length();
      const segment = primarySegments[i - 1];
      segment.position.copy(a).add(b).multiplyScalar(.5);
      segment.scale.y = Math.max(.001, length);
      segment.quaternion.setFromUnitVectors(vertical, segmentDirection.normalize());
      primaryRoute.length += length; primaryRoute.lengths[i] = primaryRoute.length;
    }
    if (primaryPacket.visible) {
      const phase = ((state.reduced ? .42 : quietTime * .075) + p * .18) % 1;
      for (let tail = 0; tail < 7; tail++) {
        const q = (phase - tail * .0065 + 1) % 1;
        sampleRoute(primaryRoute, q, pulsePoint); pulsePoint.y += .012;
        const radius = (.064 - tail * .0068) * (.55 + .45 * activePower);
        pulseScale.set(radius, radius * .72, radius);
        pulseMatrix.compose(pulsePoint, pulseQuaternion, pulseScale); primaryPacket.setMatrixAt(tail, pulseMatrix);
      }
      primaryPacket.instanceMatrix.needsUpdate = true;
    }
    heatMaterials.forEach(material => { material.uniforms.power.value = activePower; material.uniforms.time.value = quietTime; });
    anchors.interposer.set(3.17, IP_Y + interposerLift + .065, 1.58);
    anchors.compute.set(.91, IP_Y + interposerLift + .318 + computeLift, -.18);
    anchors.hbm.set(2.44, IP_Y + interposerLift + .759 + memoryLift + .091 * separation, 1.46);
    anchors.lid.set(lid.position.x + 1.3, lid.position.y + .10, lid.position.z + .35);
    anchors.signal.set(0, IP_Y + interposerLift + .07, .15);
  };

  return { group, anchors, update, setMode: value => { mode = value; }, dispose: () => disposeTree(group) };
}
