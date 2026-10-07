import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createPaperGeometry, seededRandom } from './model/paper.js';

const W = 3.4, H = 4.8, D = 0.66, SPINE = -W / 2;
const BOARD = 0.055, OVERHANG = 0.055, GAP = 0.012;
const RADII = [0.025, 0.0187, 0.0124, 0.0061];
const TAPE_STATIONS = [-1.28, 0, 1.28];
const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, n) => { const t = clamp((n - a) / (b - a)); return t * t * (3 - 2 * t); };
const spineX = (z) => SPINE - 0.018 * Math.cos(z / D * Math.PI);

function canvas(width, height = width) {
  const element = document.createElement('canvas');
  element.width = width; element.height = height;
  return element;
}

function paperCanvases(size) {
  const color = canvas(size), relief = canvas(size);
  const context = color.getContext('2d'), bump = relief.getContext('2d');
  const image = context.createImageData(size, size), height = bump.createImageData(size, size);
  const random = seededRandom(17081926);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const fiber = (random() - 0.5) * 13;
    const cloud = Math.sin(x * 0.018) * Math.sin(y * 0.013) * 2.4;
    image.data[i] = 244 + fiber + cloud;
    image.data[i + 1] = 237 + fiber + cloud;
    image.data[i + 2] = 219 + fiber + cloud;
    image.data[i + 3] = 255;
    const n = 126 + fiber * 2.5;
    height.data[i] = height.data[i + 1] = height.data[i + 2] = n;
    height.data[i + 3] = 255;
  }
  context.putImageData(image, 0, 0); bump.putImageData(height, 0, 0);
  for (let i = 0; i < size * 7; i++) {
    const x = random() * size, y = random() * size;
    const length = 2.5 + random() * 11, angle = (random() - 0.5) * 1.2;
    context.strokeStyle = i % 3 ? 'rgba(255,255,247,.22)' : 'rgba(133,120,94,.15)';
    context.lineWidth = 0.35 + random() * 0.6;
    context.beginPath(); context.moveTo(x, y); context.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length); context.stroke();
    bump.strokeStyle = i % 3 ? 'rgba(220,220,220,.28)' : 'rgba(55,55,55,.2)';
    bump.lineWidth = context.lineWidth;
    bump.beginPath(); bump.moveTo(x, y); bump.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length); bump.stroke();
  }
  return [color, relief];
}

function weaveCanvas(size = 512, linen = false) {
  const result = canvas(size), context = result.getContext('2d');
  const pixels = context.createImageData(size, size), random = seededRandom(linen ? 911 : 920);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const pitch = linen ? 11 : 5;
    const a = Math.cos(x / pitch * Math.PI * 2), b = Math.cos(y / pitch * Math.PI * 2);
    const over = (Math.floor(x / pitch) + Math.floor(y / pitch)) % 2;
    const value = 123 + (over ? a * 22 + b * 7 : a * 7 + b * 22) + (random() - 0.5) * 12;
    pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value; pixels.data[i + 3] = 255;
  }
  context.putImageData(pixels, 0, 0);
  return result;
}

function edgeCanvas() {
  const result = canvas(128, 1024), context = result.getContext('2d'), random = seededRandom(4101);
  context.fillStyle = '#e6dbc3'; context.fillRect(0, 0, 128, 1024);
  for (let y = 0; y < 1024; y++) {
    const n = random();
    const dark = y % 9 === 0 ? 0.17 : y % 3 === 0 ? 0.065 : 0.024;
    context.fillStyle = `rgba(111,93,59,${dark * (0.55 + n * 0.45)})`;
    context.fillRect(0, y, 128, 1);
    if (y % 9 === 1) { context.fillStyle = 'rgba(255,255,243,.35)'; context.fillRect(0, y, 128, 1); }
  }
  return result;
}

function spacedText(context, text, x, y, tracking) {
  let width = Math.max(0, text.length - 1) * tracking;
  for (const letter of text) width += context.measureText(letter).width;
  let left = x - width / 2;
  for (const letter of text) { context.fillText(letter, left, y); left += context.measureText(letter).width + tracking; }
}

function typeMask(spine = false) {
  const result = canvas(spine ? 256 : 1024, spine ? 1536 : 1536);
  const context = result.getContext('2d');
  context.fillStyle = '#000'; context.fillRect(0, 0, result.width, result.height);
  context.fillStyle = '#fff'; context.textBaseline = 'middle';
  if (spine) {
    context.translate(128, 768); context.rotate(-Math.PI / 2);
    context.font = '500 84px Cormorant'; spacedText(context, 'CODEX', 0, 0, 19);
  } else {
    context.font = '500 104px Cormorant'; spacedText(context, 'CODEX', 512, 646, 31);
    context.font = '500 18px Manrope'; spacedText(context, 'THE ANATOMY OF A BOOK', 512, 765, 4.2);
  }
  return result;
}

function ribbonGeometry(path, width) {
  const position = [], normal = [], uv = [], index = [];
  for (let i = 0; i < path.length; i++) {
    const before = path[Math.max(0, i - 1)], after = path[Math.min(path.length - 1, i + 1)];
    const dx = after[0] - before[0], dz = after[2] - before[2], inv = 1 / Math.hypot(dx, dz);
    for (let edge = 0; edge < 2; edge++) {
      position.push(path[i][0], path[i][1] + (edge - 0.5) * width, path[i][2]);
      normal.push(-dz * inv, 0, dx * inv); uv.push(i / (path.length - 1), edge);
    }
    if (i < path.length - 1) { const a = i * 2; index.push(a, a + 1, a + 3, a, a + 3, a + 2); }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normal, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geometry.setIndex(index);
  return geometry;
}

export async function createBook({ renderer, mobile = false } = {}) {
  const group = new THREE.Group(); group.name = 'CODEX · procedural sewn case binding';
  const geometries = new Set(), materials = new Set(), textures = new Set();
  const textureFallbacks = [];
  const keepGeometry = (g) => { geometries.add(g); return g; };
  const keepMaterial = (m) => { materials.add(m); return m; };
  const keepTexture = (t) => { textures.add(t); return t; };
  const anisotropy = Math.min(mobile ? 4 : 8, renderer?.capabilities.getMaxAnisotropy() || 4);
  function texture(source, color = false, repeatX = 1, repeatY = 1) {
    const t = keepTexture(new THREE.CanvasTexture(source));
    t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeatX, repeatY); t.anisotropy = anisotropy;
    return t;
  }
  async function imageTexture(file, fallback) {
    try {
      const url = new URL(`${import.meta.env.BASE_URL}codex/textures/${file}`, document.baseURI).href;
      const t = keepTexture(await new THREE.TextureLoader().loadAsync(url));
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = anisotropy; return t;
    } catch {
      textureFallbacks.push(file); return texture(fallback(), true);
    }
  }
  const [paperColor, paperRelief] = paperCanvases(mobile ? 512 : 1024);
  const paperBump = texture(paperRelief, false, 1, 1);
  const clothBump = texture(weaveCanvas(), false, 1.4, 1.8);
  const linenBump = texture(weaveCanvas(256, true), false, 3, 1);
  const [clothMap, marbleMap, paperMap] = await Promise.all([
    imageTexture('cloth-albedo.webp', () => weaveCanvas()),
    imageTexture('marbled-endpaper.webp', () => paperColor),
    imageTexture('paper-albedo.webp', () => paperColor),
  ]);
  clothMap.wrapS = clothMap.wrapT = THREE.RepeatWrapping; clothMap.repeat.set(1.25, 1.8);
  // Marbled pastedowns deliberately retain the entire original plate UV range.
  marbleMap.wrapS = marbleMap.wrapT = THREE.ClampToEdgeWrapping; marbleMap.repeat.set(1, 1);
  const edgeMap = texture(edgeCanvas(), true);
  const titleMap = texture(typeMask(), false), spineTitleMap = texture(typeMask(true), false);

  const paperMaterial = keepMaterial(new THREE.MeshPhysicalMaterial({
    color: '#f5f1e8', map: paperMap, bumpMap: paperBump, bumpScale: 0.034,
    roughness: 0.96, metalness: 0, sheen: 0.15, sheenRoughness: 1, sheenColor: '#fff8de', side: THREE.FrontSide,
  }));
  const edgeMaterial = keepMaterial(new THREE.MeshStandardMaterial({ color: '#fff9e9', map: edgeMap, bumpMap: edgeMap,
    bumpScale: 0.004, roughness: 0.91, transparent: true,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
  const threadMaterial = keepMaterial(new THREE.MeshStandardMaterial({ color: '#c2ab7e', bumpMap: linenBump,
    bumpScale: 0.009, roughness: 0.83, metalness: 0 }));
  const tapeMaterial = keepMaterial(new THREE.MeshStandardMaterial({ color: '#c2b79c', bumpMap: linenBump,
    bumpScale: 0.009, roughness: 0.98, side: THREE.DoubleSide, forceSinglePass: true, transparent: true }));
  const liningMaterial = keepMaterial(new THREE.MeshStandardMaterial({ color: '#e2d9c5', map: paperMap,
    bumpMap: linenBump, bumpScale: 0.006, roughness: 1, side: THREE.DoubleSide, forceSinglePass: true, transparent: true }));
  const clothMaterial = keepMaterial(new THREE.MeshPhysicalMaterial({ color: '#77746b', map: clothMap, bumpMap: clothBump,
    bumpScale: 0.010, roughness: 0.88, metalness: 0, sheen: 0.24, sheenRoughness: 0.9, sheenColor: '#686457', transparent: true }));
  const coreMaterial = keepMaterial(new THREE.MeshStandardMaterial({ color: '#a7987d', map: paperMap,
    bumpMap: paperBump, bumpScale: 0.012, roughness: 1, transparent: true }));
  const marbleMaterial = keepMaterial(new THREE.MeshStandardMaterial({ color: '#f4efe1', map: marbleMap,
    bumpMap: paperBump, bumpScale: 0.004, roughness: 0.82, side: THREE.FrontSide, transparent: true }));
  const goldMaterial = keepMaterial(new THREE.MeshStandardMaterial({ color: '#bd9853', metalness: 0.93, roughness: 0.34,
    transparent: true }));
  const stampUniform = { value: 0 };
  const coverMaterial = keepMaterial(clothMaterial.clone());
  coverMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.codexStamp = stampUniform;
    shader.uniforms.codexTitle = { value: titleMap };
    shader.uniforms.codexGold = { value: new THREE.Color('#c1a366') };
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 codexUv;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\ncodexUv = uv;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>',
      '#include <common>\nvarying vec2 codexUv;\nuniform sampler2D codexTitle;\nuniform float codexStamp;\nuniform vec3 codexGold;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        float codexInk = texture2D(codexTitle, codexUv).r * codexStamp;
        diffuseColor.rgb = mix(diffuseColor.rgb, codexGold, codexInk);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.34, codexInk);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = mix(metalnessFactor, 0.93, codexInk);')
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        normal = perturbNormalArb(-vViewPosition, normal,
          -vec2(dFdx(codexInk), dFdy(codexInk)) * 0.032, faceDirection);`);
  };
  coverMaterial.customProgramCacheKey = () => 'codex-physical-recessed-foil-v1';
  const spineLetterMaterial = keepMaterial(new THREE.MeshStandardMaterial({ color: '#bd9853', alphaMap: spineTitleMap,
    metalness: 0.9, roughness: 0.36, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true,
    polygonOffsetFactor: -1, side: THREE.DoubleSide, forceSinglePass: true }));
  const caseMaterials = [clothMaterial, coverMaterial, coreMaterial, marbleMaterial];
  function mesh(geometry, material, parent = group) {
    const m = new THREE.Mesh(keepGeometry(geometry), material); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }

  // I–III. A continuous sheet folds, and more sheets nest around the same axis.
  const folding = new THREE.Group(); folding.name = 'sheet / centre fold / nested gathering'; group.add(folding);
  const foldedSheets = RADII.map((radius, index) => {
    const sheet = createPaperGeometry({ width: W, height: H, radius, outerRadius: RADII[0], thickness: 0.0048, macro: true });
    const material = keepMaterial(paperMaterial.clone()); material.transparent = true;
    const object = mesh(sheet.geometry, material, folding); object.frustumCulled = false;
    object.name = `continuous thin sheet ${index + 1}`;
    return { ...sheet, object, material };
  });
  const guideMaterial = keepMaterial(new THREE.LineDashedMaterial({ color: '#626052', dashSize: 0.037, gapSize: 0.055,
    transparent: true, opacity: 0.36 }));
  const guide = new THREE.Line(keepGeometry(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(SPINE + RADII[0], -H / 2 + 0.1, 0.038), new THREE.Vector3(SPINE + RADII[0], H / 2 - 0.1, 0.038),
  ])), guideMaterial); guide.computeLineDistances(); folding.add(guide);

  // IV onward. Four concentric U-folded sheets per signature share one buffer.
  const body = new THREE.Group(); body.name = 'gathered text block'; group.add(body);
  const staticSheets = RADII.map((radius) => createPaperGeometry({ width: W, height: H, radius, outerRadius: RADII[0], thickness: 0.0048 }).geometry);
  const signatureGeometry = keepGeometry(mergeGeometries(staticSheets));
  staticSheets.forEach((g) => g.dispose());
  const signatureCount = mobile ? 8 : 12;
  const signaturePitch = D / signatureCount;
  const signatures = new THREE.InstancedMesh(signatureGeometry, paperMaterial, signatureCount);
  signatures.instanceMatrix.setUsage(THREE.DynamicDrawUsage); signatures.castShadow = signatures.receiveShadow = true;
  signatures.frustumCulled = false; signatures.name = 'repeated four-sheet signatures'; body.add(signatures);
  const instance = new THREE.Object3D();

  // Dense trimmed edges hide no assembly geometry during gathering. They arrive
  // only when the sections have been brought into contact, as a fine cut surface.
  const trimmed = new THREE.Group(); trimmed.name = 'trimmed folio edges'; body.add(trimmed);
  const fore = mesh(new THREE.PlaneGeometry(H, D, 1, 32), edgeMaterial, trimmed);
  fore.rotation.y = Math.PI / 2; fore.rotation.z = Math.PI / 2; fore.position.x = W / 2 + 0.001;
  const head = mesh(new THREE.PlaneGeometry(W, D, 1, 32), edgeMaterial, trimmed);
  head.rotation.x = -Math.PI / 2; head.position.y = H / 2 + 0.001;
  const tail = mesh(new THREE.PlaneGeometry(W, D, 1, 32), edgeMaterial, trimmed);
  tail.rotation.x = Math.PI / 2; tail.position.y = -H / 2 - 0.001;
  // The cut surfaces sit a hair outside the real sheet solids. Their own relief
  // supplies the page lines; receiving almost coincident leaf shadows adds acne.
  for (const edge of [fore, head, tail]) edge.receiveShadow = false;

  // V. Tape supports sit across the spine. Thread leaves the centre of each
  // gathering, goes around a tape, then returns through the adjacent fold hole.
  const sewing = new THREE.Group(); sewing.name = 'through-fold sewing on three tapes'; group.add(sewing);
  const tapes = new THREE.Group(); sewing.add(tapes);
  for (const station of TAPE_STATIONS) {
    const path = [[SPINE + 0.23, station, D / 2 + 0.011], [SPINE + 0.035, station, D / 2 + 0.011],
      [SPINE - 0.025, station, D / 2 - 0.02]];
    for (let j = 0; j <= 16; j++) {
      const z = D / 2 - 0.025 - j / 16 * (D - 0.05);
      path.push([spineX(z) - 0.023, station, z]);
    }
    path.push([SPINE - 0.025, station, -D / 2 + 0.02], [SPINE + 0.035, station, -D / 2 - 0.011],
      [SPINE + 0.23, station, -D / 2 - 0.011]);
    mesh(ribbonGeometry(path, 0.205), tapeMaterial, tapes);
  }
  const sewingPoints = [], holeRecords = [];
  const stationHoles = [-2.08, -1.425, -1.135, -0.145, 0.145, 1.135, 1.425, 2.08];
  for (let i = 0; i < signatureCount; i++) {
    const z = (i - (signatureCount - 1) / 2) * signaturePitch;
    const outerX = spineX(z) - 0.020, innerX = SPINE + 0.062;
    const ys = i % 2 ? [...stationHoles].reverse() : stationHoles;
    for (let j = 0; j < ys.length; j++) {
      const y = ys[j]; holeRecords.push([spineX(z) - 0.0008, y, z]);
      if (j === 0) {
        sewingPoints.push(new THREE.Vector3(outerX - 0.025, y, z), new THREE.Vector3(innerX, y, z));
      } else if (j === ys.length - 1) {
        sewingPoints.push(new THREE.Vector3(innerX, y, z), new THREE.Vector3(outerX - 0.012, y, z));
      } else if (j % 2 === 1) {
        sewingPoints.push(new THREE.Vector3(innerX, y, z), new THREE.Vector3(outerX - 0.012, y, z));
      } else {
        sewingPoints.push(new THREE.Vector3(outerX - 0.012, y, z), new THREE.Vector3(innerX, y, z));
      }
    }
    if (i < signatureCount - 1) {
      const endY = ys[ys.length - 1], nextZ = z + signaturePitch;
      sewingPoints.push(new THREE.Vector3(outerX - 0.047, endY + (i % 2 ? -0.05 : 0.05), z + signaturePitch * 0.48),
        new THREE.Vector3(outerX - 0.022, endY, nextZ));
    }
  }
  const sewCurve = new THREE.CatmullRomCurve3(sewingPoints, false, 'centripetal', 0.15);
  const threadSegments = signatureCount * 52;
  const sewnGeometry = keepGeometry(new THREE.TubeGeometry(sewCurve, threadSegments, 0.0062, 5, false));
  const sewnThread = mesh(sewnGeometry, threadMaterial, sewing); sewnThread.name = 'one continuous needle path';
  const threadTipSamples = new Float32Array((threadSegments + 1) * 3), tipVector = new THREE.Vector3();
  for (let i = 0; i <= threadSegments; i++) {
    sewCurve.getPointAt(i / threadSegments, tipVector); threadTipSamples[i * 3] = tipVector.x;
    threadTipSamples[i * 3 + 1] = tipVector.y; threadTipSamples[i * 3 + 2] = tipVector.z;
  }
  const loose = new THREE.Group(); sewing.add(loose);
  const looseCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(-0.18, 0.03, 0.11), new THREE.Vector3(-0.62, 0.15, 0.3),
    new THREE.Vector3(-1.02, -0.12, 0.53), new THREE.Vector3(-1.34, -0.22, 0.68),
  ]);
  mesh(new THREE.TubeGeometry(looseCurve, 64, 0.006, 5, false), threadMaterial, loose);
  const holeMaterial = keepMaterial(new THREE.MeshStandardMaterial({ color: '#70634c', roughness: 1, side: THREE.DoubleSide }));
  const holes = new THREE.InstancedMesh(keepGeometry(new THREE.CircleGeometry(0.0102, 10)), holeMaterial, holeRecords.length);
  for (let i = 0; i < holeRecords.length; i++) {
    instance.position.set(...holeRecords[i]); instance.rotation.set(0, -Math.PI / 2, 0); instance.scale.setScalar(1); instance.updateMatrix();
    holes.setMatrixAt(i, instance.matrix);
  }
  holes.frustumCulled = false; sewing.add(holes);

  // VI. A following paper lining and hand-sewn headbands become the spine.
  const spineStructure = new THREE.Group(); spineStructure.name = 'spine lining and wound endbands'; group.add(spineStructure);
  const liningGeometry = keepGeometry(new THREE.PlaneGeometry(D + 0.085, H - 0.10, 12, 28));
  const lining = mesh(liningGeometry, liningMaterial, spineStructure);
  const liningPosition = liningGeometry.attributes.position, liningNormal = liningGeometry.attributes.normal;
  const liningUV = liningGeometry.attributes.uv;
  const endbands = [];
  for (const sign of [-1, 1]) {
    const points = [];
    const turns = mobile ? 20 : 28;
    for (let i = 0; i <= turns * 5; i++) {
      const t = i / (turns * 5), a = t * turns * Math.PI * 2;
      points.push(new THREE.Vector3(SPINE + 0.015 + Math.cos(a) * 0.024,
        sign * (H / 2 - 0.009) + Math.sin(a) * 0.024, -D / 2 + t * D));
    }
    const geometry = keepGeometry(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), turns * 5, 0.0072, 4, false));
    const colors = new Float32Array(geometry.attributes.position.count * 3);
    const cream = new THREE.Color('#dfd3af'), dark = new THREE.Color('#777765');
    for (let i = 0; i < geometry.attributes.uv.count; i++) {
      const which = Math.floor(geometry.attributes.uv.getX(i) * turns) % 2 ? cream : dark;
      colors[i * 3] = which.r; colors[i * 3 + 1] = which.g; colors[i * 3 + 2] = which.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const material = keepMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92 }));
    const object = mesh(geometry, material, spineStructure); endbands.push(object);
  }

  // VIII. The separately made case has actual board hinges and folding turn-ins.
  const caseGroup = new THREE.Group(); caseGroup.name = 'separate cloth case'; group.add(caseGroup);
  function createBoard(front) {
    const pivot = new THREE.Group(); caseGroup.add(pivot);
    pivot.name = front ? 'front board · spine hinge' : 'rear board · spine hinge';
    const width = W + OVERHANG * 2, height = H + OVERHANG * 2;
    mesh(new RoundedBoxGeometry(width, height, BOARD, 2, 0.018), coreMaterial, pivot).position.x = W / 2;
    const skin = mesh(new RoundedBoxGeometry(width + 0.007, height + 0.007, 0.007, 1, 0.003),
      front ? [clothMaterial, clothMaterial, clothMaterial, clothMaterial, coverMaterial, clothMaterial] : clothMaterial, pivot);
    skin.position.x = W / 2;
    const inside = mesh(new THREE.BoxGeometry(width - 0.17, height - 0.17, 0.004), marbleMaterial, pivot);
    inside.position.set(W / 2 + 0.022, 0, front ? -BOARD / 2 - 0.0035 : BOARD / 2 + 0.0035);
    const flaps = [];
    for (const edge of ['fore', 'spine', 'head', 'tail']) {
      const hinge = new THREE.Group(); pivot.add(hinge);
      const vertical = edge === 'fore' || edge === 'spine';
      const flap = mesh(new THREE.BoxGeometry(vertical ? 0.15 : width, vertical ? height : 0.15, 0.003), clothMaterial, hinge);
      if (edge === 'fore') { hinge.position.x = W / 2 + width / 2; flap.position.x = 0.075; }
      if (edge === 'spine') { hinge.position.x = W / 2 - width / 2; flap.position.x = -0.075; }
      if (edge === 'head') { hinge.position.set(W / 2, height / 2, 0); flap.position.y = 0.075; }
      if (edge === 'tail') { hinge.position.set(W / 2, -height / 2, 0); flap.position.y = -0.075; }
      flaps.push({ hinge, edge });
    }
    const wrappedEdges = new THREE.Group(); pivot.add(wrappedEdges);
    for (const sign of [-1, 1]) {
      const edge = mesh(new THREE.BoxGeometry(0.007, height, BOARD + 0.008), clothMaterial, wrappedEdges);
      edge.position.x = W / 2 + sign * (width / 2 + 0.002);
      const end = mesh(new THREE.BoxGeometry(width, 0.007, BOARD + 0.008), clothMaterial, wrappedEdges);
      end.position.set(W / 2, sign * (height / 2 + 0.002), 0);
    }
    const joint = mesh(new THREE.BoxGeometry(0.045, height - 0.035, 0.013), clothMaterial, pivot);
    joint.position.set(0.035, 0, front ? BOARD / 2 + 0.010 : -BOARD / 2 - 0.010);
    return { pivot, skin, inside, flaps, wrappedEdges, front };
  }
  const frontBoard = createBoard(true), rearBoard = createBoard(false);
  const boards = [frontBoard, rearBoard];
  const caseSpineGeometry = keepGeometry(new THREE.PlaneGeometry(D + BOARD * 2 + GAP * 2, H + OVERHANG * 2, 24, 4));
  // The open spine ribbon needs two-sided shading; the closed cloth solids do
  // not. Keep its material separate so that they do not inherit double passes.
  const spineClothMaterial = keepMaterial(clothMaterial.clone());
  spineClothMaterial.side = THREE.DoubleSide; spineClothMaterial.forceSinglePass = true;
  caseMaterials.push(spineClothMaterial);
  const caseSpine = mesh(caseSpineGeometry, spineClothMaterial, caseGroup);
  const spineLettersGeometry = keepGeometry(caseSpineGeometry.clone());
  const spineLetters = mesh(spineLettersGeometry, spineLetterMaterial, caseGroup);
  spineLetters.castShadow = false;
  const caseSpineUV = caseSpineGeometry.attributes.uv;
  const flyleafPivot = new THREE.Group(); flyleafPivot.position.set(SPINE + 0.045, 0, D / 2 + 0.007); group.add(flyleafPivot);
  const flyleaf = mesh(new THREE.BoxGeometry(W - 0.055, H - 0.025, 0.004), marbleMaterial, flyleafPivot);
  flyleaf.position.x = (W - 0.055) / 2;

  // IX. The die contacts the cloth; a shader-local impression changes colour,
  // roughness, metalness and the normal at the letter edge on the board itself.
  const press = new THREE.Group(); press.name = 'small dark stamping die'; group.add(press);
  const steel = keepMaterial(new THREE.MeshStandardMaterial({ color: '#56584f', metalness: 0.86, roughness: 0.31, transparent: true }));
  mesh(new RoundedBoxGeometry(2.05, 0.84, 0.12, 1, 0.018), steel, press);
  const stem = mesh(new THREE.CylinderGeometry(0.105, 0.125, 0.64, 16), steel, press);
  stem.rotation.x = Math.PI / 2; stem.position.z = 0.37;
  const dieLetterMaterial = keepMaterial(new THREE.MeshStandardMaterial({ color: '#909184', alphaMap: titleMap,
    transparent: true, alphaTest: 0.05, depthWrite: false, metalness: 0.75, roughness: 0.32, side: THREE.DoubleSide, forceSinglePass: true }));
  const dieLetters = mesh(new THREE.PlaneGeometry(3.4, 4.8), dieLetterMaterial, press);
  dieLetters.position.set(-0.12, -0.24, -0.061); dieLetters.rotation.y = Math.PI;
  dieLetters.castShadow = false;
  const gild = new THREE.Group(); gild.name = 'one fine gilded fore-edge'; group.add(gild);
  mesh(new THREE.BoxGeometry(0.004, H - 0.055, 0.006), goldMaterial, gild).position.set(W / 2 + 0.003, 0, D / 2 - 0.130);
  mesh(new THREE.BoxGeometry(W - 0.08, 0.004, 0.005), goldMaterial, gild).position.set(0.025, H / 2 + 0.002, D / 2 - 0.010);

  const state = { chapter: 0, progress: 0, foldAngle: Math.PI, sewn: 1, lining: 1, case: 1, stamp: 1, open: 0 };
  function stackPose(progress, gathering, isMobile) {
    const align = gathering ? smooth(0.28, 0.88, progress) : 1;
    const emergence = gathering ? smooth(0, 0.19, progress) : 1;
    const heroIndex = Math.floor(signatureCount / 2);
    for (let i = 0; i < signatureCount; i++) {
      const offset = i - (signatureCount - 1) / 2;
      const z = offset * signaturePitch;
      const spread = (1 - align) * emergence;
      const born = i === heroIndex ? 1 : smooth(0.008 + Math.abs(i - heroIndex) * 0.008, 0.16 + Math.abs(i - heroIndex) * 0.008, progress);
      const scale = gathering ? born : 1;
      instance.position.set((spineX(z) - SPINE) * emergence + spread * offset * (isMobile ? 0.017 : 0.09),
        spread * offset * (isMobile ? 0.16 : 0.047),
        gathering ? z * (1 + spread * 3.2) * emergence : z);
      instance.rotation.set(0, spread * offset * 0.009, spread * offset * 0.002);
      instance.scale.set(Math.max(0.0001, scale), Math.max(0.0001, scale), Math.max(0.0001, scale) * mix(1, signaturePitch / 0.057, emergence));
      instance.updateMatrix(); signatures.setMatrixAt(i, instance.matrix);
    }
    signatures.instanceMatrix.needsUpdate = true;
  }

  function spinePose(amount) {
    for (let i = 0; i < liningPosition.count; i++) {
      const u = liningUV.getX(i), v = liningUV.getY(i);
      const z = (u - 0.5) * (D + 0.085);
      const lay = smooth(0.06, 0.83, amount - (1 - v) * 0.17);
      const lift = 1 - lay;
      const x = spineX(clamp(z, -D / 2, D / 2)) - 0.037 - lift * (0.56 + 0.10 * Math.sin(v * Math.PI));
      const y = (v - 0.5) * (H - 0.10) + lift * 0.22;
      liningPosition.setXYZ(i, x, y, z + lift * Math.sin(v * Math.PI) * 0.08);
      liningNormal.setXYZ(i, -1, lift * 0.12, (u - 0.5) * 0.08);
    }
    liningPosition.needsUpdate = liningNormal.needsUpdate = true;
    lining.visible = amount > 0.001; liningMaterial.opacity = smooth(0, 0.1, amount);
    for (const band of endbands) {
      const drawn = smooth(0.30, 0.76, amount);
      band.visible = drawn > 0;
      band.geometry.setDrawRange(0, Math.floor((band.geometry.index.count * drawn) / 6) * 6);
    }
  }

  function casePose(amount, openness, alpha) {
    const close = smooth(0.35, 0.94, amount), wrap = smooth(0.18, 0.62, amount);
    for (const board of boards) {
      const sign = board.front ? 1 : -1;
      board.pivot.position.set(SPINE, 0, sign * (D / 2 + BOARD / 2 + GAP + (1 - close) * 0.69));
      board.pivot.rotation.y = board.front ? -mix(0.28, 0, close) - openness * 1.745329 : mix(0.16, 0, close);
      board.skin.position.z = sign * (BOARD / 2 + 0.004 + (1 - wrap) * 0.075);
      board.inside.visible = wrap > 0.50;
      board.wrappedEdges.visible = wrap > 0.65;
      for (const flap of board.flaps) {
        flap.hinge.position.z = sign * (BOARD / 2 + 0.003 - BOARD * wrap);
        const angle = wrap * Math.PI * sign;
        flap.hinge.rotation.set(flap.edge === 'head' ? -angle : flap.edge === 'tail' ? angle : 0,
          flap.edge === 'fore' ? angle : flap.edge === 'spine' ? -angle : 0, 0);
      }
    }
    for (let i = 0; i < caseSpineGeometry.attributes.position.count; i++) {
      const u = caseSpineUV.getX(i), v = caseSpineUV.getY(i);
      const z = (u - 0.5) * (D + BOARD * 2 + GAP * 2);
      const x = SPINE - 0.024 - Math.sin(u * Math.PI) * 0.061 - (1 - close) * 0.43;
      const y = (v - 0.5) * (H + OVERHANG * 2);
      caseSpineGeometry.attributes.position.setXYZ(i, x, y, z);
      caseSpineGeometry.attributes.normal.setXYZ(i, -1, 0, (u - 0.5) * 0.32);
      spineLettersGeometry.attributes.position.setXYZ(i, x - 0.0008, y, z);
      spineLettersGeometry.attributes.normal.setXYZ(i, -1, 0, (u - 0.5) * 0.32);
    }
    caseSpineGeometry.attributes.position.needsUpdate = caseSpineGeometry.attributes.normal.needsUpdate = true;
    spineLettersGeometry.attributes.position.needsUpdate = spineLettersGeometry.attributes.normal.needsUpdate = true;
    for (const material of caseMaterials) { material.opacity = alpha; material.depthWrite = alpha > 0.98; }
    flyleafPivot.visible = alpha > 0.001;
    flyleafPivot.rotation.y = -openness * 0.22;
  }

  function update({ chapter = 0, progress = 0, time = 0, reducedMotion = false, mobile: isMobile = mobile, open = 0 } = {}) {
    const c = Math.floor(clamp(chapter, 0, 9)), p = clamp(progress), finished = c === 0 || c === 9;
    const wave = reducedMotion ? 0 : Math.sin(time * 0.34) * 0.003;
    state.chapter = c; state.progress = p; state.open = c === 9 ? clamp(open) : 0;
    folding.visible = c === 1 || c === 2;
    body.visible = c >= 3 || finished;
    sewing.visible = c >= 4 || finished;
    spineStructure.visible = c >= 5 || finished;
    caseGroup.visible = c >= 7 || finished;
    const pressAlpha = c === 8 ? smooth(0.025, 0.12, p) * (1 - smooth(0.81, 0.95, p)) : 0;
    press.visible = pressAlpha > 0.001;
    steel.opacity = dieLetterMaterial.opacity = pressAlpha; steel.depthWrite = pressAlpha > 0.98;
    const caseAmount = c === 7 ? p : 1;
    const caseAlpha = c === 7 ? smooth(0.005, 0.16, p) : c >= 8 || finished ? 1 : 0;
    if (folding.visible) {
      const angle = c === 1 ? 0 : smooth(0.025, 0.88, p) * Math.PI;
      state.foldAngle = angle;
      folding.position.x = (W / 2 - RADII[0]) * (1 - angle / Math.PI);
      guide.visible = c === 2 && p < 0.74; guideMaterial.opacity = 0.34 * smooth(0, 0.1, p) * (1 - smooth(0.54, 0.74, p));
      for (let i = 0; i < foldedSheets.length; i++) {
        const s = foldedSheets[i], alpha = i === 0 ? 1 : c === 1 ? 0 : smooth(0.16 + i * 0.08, 0.38 + i * 0.08, p);
        s.object.visible = alpha > 0.001; s.material.opacity = alpha;
        s.object.castShadow = alpha > 0.6;
        const nestedAngle = angle - i * 0.18 * Math.sin(angle);
        const nestingAir = c === 2 ? i * 0.022 * Math.sin(angle) * (1 - smooth(0.68, 0.94, p)) : 0;
        s.object.position.z = s.radius * (1 - nestedAngle / Math.PI) + nestingAir;
        const flex = c === 1 ? mix(0.16, 0.095, smooth(0, 1, p)) + wave : (0.095 * (1 - angle / Math.PI) + wave * Math.sin(angle));
        s.update(nestedAngle, flex);
      }
    }
    if (body.visible) stackPose(p, c === 3, isMobile);
    trimmed.visible = body.visible && (c !== 3 || p > 0.69);
    edgeMaterial.opacity = c === 3 ? smooth(0.69, 0.96, p) : 1;
    const sewn = c === 4 ? smooth(0.08, 0.91, p) : 1;
    state.sewn = sewn;
    tapeMaterial.opacity = c === 4 ? smooth(0, 0.14, p) : 1;
    const sewnSegments = Math.floor(threadSegments * sewn);
    sewnGeometry.setDrawRange(0, sewnSegments * 5 * 6);
    holes.count = c === 4 ? Math.min(holeRecords.length, Math.ceil(holeRecords.length * sewn)) : holeRecords.length;
    loose.visible = c === 4 && p > 0.025 && sewn < 0.995;
    if (loose.visible) {
      const i = Math.min(threadSegments - 1, sewnSegments), f = sewn * threadSegments - i;
      loose.position.set(mix(threadTipSamples[i * 3], threadTipSamples[(i + 1) * 3], f),
        mix(threadTipSamples[i * 3 + 1], threadTipSamples[(i + 1) * 3 + 1], f),
        mix(threadTipSamples[i * 3 + 2], threadTipSamples[(i + 1) * 3 + 2], f));
      const tension = 1 - smooth(0.90, 1, sewn);
      loose.scale.set(tension, mix(0.45, 1, tension), tension);
    }
    const liningAmount = c === 5 ? smooth(0.02, 0.92, p) : 1;
    state.lining = liningAmount;
    if (spineStructure.visible) spinePose(liningAmount);
    state.case = caseAmount;
    casePose(caseAmount, state.open, caseAlpha);
    const stamp = c === 8 ? smooth(0.41, 0.57, p) : finished ? 1 : 0;
    state.stamp = stamp; stampUniform.value = stamp; spineLetterMaterial.opacity = stamp * caseAlpha;
    const pressure = smooth(0.07, 0.39, p) * (1 - smooth(0.59, 0.91, p));
    press.position.set(0.12, 0.24, D / 2 + BOARD + GAP + 0.069 + (1 - pressure) * 1.45);
    if (c >= 8 || finished) frontBoard.pivot.position.z = D / 2 + BOARD / 2 + GAP - (c === 8 ? pressure * 0.006 : 0);
    const giltAmount = c === 8 ? smooth(0.60, 0.85, p) : finished ? 1 : 0;
    gild.visible = giltAmount > 0.001; goldMaterial.opacity = giltAmount;
  }
  update({ chapter: 0, progress: 0 });

  function diagnostics() {
    let visibleTriangles = 0;
    group.traverse((object) => {
      if (!object.isMesh || !object.geometry) return;
      let ancestor = object;
      while (ancestor && ancestor !== group) { if (!ancestor.visible) return; ancestor = ancestor.parent; }
      const geometry = object.geometry;
      const count = Math.min(geometry.index?.count ?? geometry.attributes.position.count, geometry.drawRange.count);
      visibleTriangles += count / 3 * (object.isInstancedMesh ? object.count : 1);
    });
    return {
      signatureCount, sheetsPerSignature: 4, representedLeaves: signatureCount * 8,
      visibleModelTriangles: visibleTriangles,
      modelGeometries: geometries.size, modelMaterials: materials.size, modelTextures: textures.size,
      textureFallbacks: [...textureFallbacks], bookState: { ...state },
      coordinateSystem: '+Z front; −X spine; Y long axis',
      geometrySystems: ['continuous-thickness fold', 'instanced nested signatures', 'through-fold sewing',
        'transverse linen tapes', 'laid spine lining', 'wound endbands', 'hinged boards and turn-ins', 'physical foil / deboss'],
    };
  }
  function dispose() {
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose()); textures.forEach((t) => t.dispose()); group.clear();
  }
  return { group, update, dispose, diagnostics };
}
