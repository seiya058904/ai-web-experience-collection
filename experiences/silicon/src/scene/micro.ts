import * as THREE from 'three';
import {
  block, circuitTexture, clamp, disposeTree, metal, mix, palette, smooth,
  type ExhibitModel, type SceneState,
} from './shared';

/**
 * Original, deliberately scaled micro-architecture for the exhibit.
 * All geometry is authored here; dimensions are compositional, not a node claim.
 * The outer group is exclusively positioned by the common scene director.
 */

type BoxSpec = { x: number; y: number; z: number; w: number; h: number; d: number };
const UP = new THREE.Vector3(0, 1, 0);

/** Subtle, deterministic directional micro-finish. It only modulates PBR
 * roughness and surface height; no lighting or baked reflection is painted in. */
function precisionFinish(seed: number) {
  const size = 256;
  const roughnessData = new Uint8Array(size * size * 4);
  const heightData = new Uint8Array(size * size * 4);
  let state = seed | 0;
  const random = () => { state = (Math.imul(state, 1664525) + 1013904223) | 0; return (state >>> 0) / 4294967296; };
  const rows = Array.from({ length: size }, () => random());
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4;
      const fine = random();
      const drift = Math.sin(x * .033 + y * .043) * .035;
      const rough = Math.round(211 + rows[y] * 27 + fine * 13 + drift * 50);
      const height = Math.round(115 + rows[y] * 20 + fine * 5 + drift * 30);
      roughnessData[index] = roughnessData[index + 1] = roughnessData[index + 2] = rough;
      heightData[index] = heightData[index + 1] = heightData[index + 2] = height;
      roughnessData[index + 3] = heightData[index + 3] = 255;
    }
  }
  const roughness = new THREE.DataTexture(roughnessData, size, size);
  const height = new THREE.DataTexture(heightData, size, size);
  for (const texture of [roughness, height]) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
  }
  return (material: THREE.MeshStandardMaterial, relief = .0035) => {
    material.roughnessMap = roughness;
    material.bumpMap = height;
    material.bumpScale = relief;
    return material;
  };
}

function instancedBoxes(specs: BoxSpec[], material: THREE.Material, bevel = .025) {
  const geometry = block(1, 1, 1, material, bevel).geometry;
  const mesh = new THREE.InstancedMesh(geometry, material, specs.length);
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  specs.forEach((spec, index) => {
    matrix.compose(position.set(spec.x, spec.y, spec.z), quaternion, scale.set(spec.w, spec.h, spec.d));
    mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  return mesh;
}

function addTopArtwork(
  parent: THREE.Object3D, width: number, depth: number, y: number, seed: number,
  copper = false, roughness = .4,
) {
  const material = metal(copper ? 0xb3a18c : 0x9aabb7, roughness, .79);
  material.map = circuitTexture(1024, seed, copper);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  parent.add(mesh);
  return mesh;
}

function addFoundation(parent: THREE.Group, seed: number, width = 5.92, depth = 4.45) {
  const finish = precisionFinish(seed + 601);
  const silicon = finish(metal(0x727b82, .32, .75));
  const edge = finish(metal(0x414b53, .33, .8));
  const oxide = new THREE.MeshStandardMaterial({ color: 0x9aa8ad, roughness: .4, metalness: .16 });
  const base = block(width, .46, depth, silicon, .06);
  base.position.y = -1.24;
  parent.add(base);
  const lowerLip = block(width - .08, .04, depth - .08, edge, .01);
  lowerLip.position.y = -1.475;
  parent.add(lowerLip);
  const surface = block(width - .19, .09, depth - .19, oxide, .018);
  surface.position.y = -.968;
  parent.add(surface);
  const artwork = addTopArtwork(parent, width - .21, depth - .21, -.918, seed);
  finish(artwork.material);

  // Fine scribe contacts sit on the material itself, not in a HUD overlay.
  const pads: BoxSpec[] = [];
  for (let i = 0; i < 34; i++) {
    const x = -width * .456 + (i / 33) * width * .912;
    pads.push({ x, y: -.908, z: depth * .468, w: .067, h: .024, d: .11 });
    pads.push({ x, y: -.908, z: -depth * .468, w: .067, h: .024, d: .11 });
  }
  for (let i = 0; i < 24; i++) {
    const z = -depth * .43 + (i / 23) * depth * .86;
    pads.push({ x: width * .474, y: -.908, z, w: .085, h: .024, d: .055 });
    pads.push({ x: -width * .474, y: -.908, z, w: .085, h: .024, d: .055 });
  }
  parent.add(instancedBoxes(pads, metal(0x8b9b9f, .28, .83), .03));

  // A very restrained laminated cut edge gives the macro-to-micro object weight.
  for (let i = 0; i < 3; i++) {
    const seam = block(width - .15, .011, .012, edge, 0);
    seam.position.set(0, -1.16 - i * .08, depth * .5 + .003);
    parent.add(seam);
  }
}

function roundedRectangle(path: THREE.Shape | THREE.Path, width: number, height: number, radius: number) {
  const x = -width / 2;
  const y = -height / 2;
  path.moveTo(x + radius, y);
  path.lineTo(x + width - radius, y);
  path.quadraticCurveTo(x + width, y, x + width, y + radius);
  path.lineTo(x + width, y + height - radius);
  path.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  path.lineTo(x + radius, y + height);
  path.quadraticCurveTo(x, y + height, x, y + height - radius);
  path.lineTo(x, y + radius);
  path.quadraticCurveTo(x, y, x + radius, y);
  path.closePath();
}

function sheetSleeve(length: number, material: THREE.Material) {
  // The insulating sleeve is sectioned on the same plane as the metal gate.
  // Its removed half travels with the inspection section, revealing the real
  // silicon surface rather than placing a signal graphic over opaque oxide.
  const outline = new THREE.Shape();
  outline.moveTo(0, -.1095);
  outline.lineTo(.728, -.1095);
  outline.quadraticCurveTo(.805, -.1095, .805, -.0325);
  outline.lineTo(.805, .0325);
  outline.quadraticCurveTo(.805, .1095, .728, .1095);
  outline.lineTo(0, .1095);
  outline.lineTo(0, .058);
  outline.lineTo(.6755, .058);
  outline.quadraticCurveTo(.7225, .058, .7225, .0105);
  outline.lineTo(.7225, -.0105);
  outline.quadraticCurveTo(.7225, -.058, .6755, -.058);
  outline.lineTo(0, -.058);
  outline.closePath();
  const geometry = new THREE.ExtrudeGeometry(outline, {
    depth: length, bevelEnabled: false, curveSegments: 5, steps: 1,
  });
  geometry.rotateY(Math.PI / 2);
  geometry.translate(-length / 2, 0, 0);
  return new THREE.Mesh(geometry, material);
}

/** A solid half of a GAA metal gate, with three channel apertures in its section. */
function gateHalfGeometry() {
  const shape = new THREE.Shape();
  const back = 1.11;
  const apertureDepth = .822;
  shape.moveTo(0, -.79);
  shape.lineTo(back, -.79);
  shape.lineTo(back, 1.235);
  shape.lineTo(0, 1.235);
  for (const y of [.75, .2, -.35]) {
    shape.lineTo(0, y + .124);
    shape.lineTo(apertureDepth, y + .124);
    shape.lineTo(apertureDepth, y - .124);
    shape.lineTo(0, y - .124);
  }
  shape.lineTo(0, -.79);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 1.43, bevelEnabled: true, bevelThickness: .023,
    bevelSize: .019, bevelSegments: 2, curveSegments: 4, steps: 1,
  });
  geometry.rotateY(Math.PI / 2);
  geometry.translate(-1.43 / 2, 0, 0);
  return geometry;
}

function placeSegment(mesh: THREE.Mesh, start: THREE.Vector3, end: THREE.Vector3) {
  mesh.position.copy(start).add(end).multiplyScalar(.5);
  const length = start.distanceTo(end);
  mesh.scale.set(1, Math.max(.001, length), 1);
  mesh.quaternion.setFromUnitVectors(UP, new THREE.Vector3().subVectors(end, start).normalize());
}

export function createBuildModel(): ExhibitModel {
  const group = new THREE.Group();
  group.name = 'BUILD · deposited, patterned, selectively released';
  addFoundation(group, 241);

  const finish = precisionFinish(477);
  const silicon = finish(metal(0xa5adb2, .28, .8));
  const sacrificial = finish(metal(0x69777e, .33, .61));
  const copper = finish(metal(0xbfa080, .28, .86));
  const oxide = new THREE.MeshStandardMaterial({ color: 0x9ca9b0, roughness: .38, metalness: .12 });
  const etchAccent = new THREE.MeshStandardMaterial({
    color: 0x9fa2b4, emissive: 0x6f657f, emissiveIntensity: .12, roughness: .4, metalness: .22,
  });

  const foundationOxide = block(5.42, .145, 3.92, oxide, .014);
  foundationOxide.position.y = -.823;
  group.add(foundationOxide);

  // The lower deposited film is patterned into a connected damascene-like field.
  const underRoutes: BoxSpec[] = [];
  for (let i = 0; i < 11; i++) {
    const z = -1.67 + i * .334;
    underRoutes.push({ x: -.02, y: -.728, z, w: 4.87 - (i % 3) * .18, h: .039, d: .038 });
  }
  for (let i = 0; i < 10; i++) {
    underRoutes.push({ x: -2.17 + i * .481, y: -.728, z: i % 2 ? 1.4 : -1.4, w: .041, h: .039, d: .61 });
  }
  group.add(instancedBoxes(underRoutes, copper));

  type BuildLayer = {
    root: THREE.Group;
    blanket: THREE.Mesh;
    centre: THREE.Mesh;
    resist: THREE.Group;
    structure: THREE.Object3D[];
    index: number;
  };
  const layers: BuildLayer[] = [];
  const ribs = 9;
  for (let i = 0; i < 6; i++) {
    const root = new THREE.Group();
    root.name = i % 2 ? `Sacrificial patterned film ${i}` : `Silicon patterned film ${i}`;
    const material = i % 2 ? sacrificial : silicon;

    // A blanket film initially covers all openings. It contracts vertically as
    // unprotected material is etched, leaving the full-height patterned ribs.
    const blanket = block(5.03, .134, 3.53, material, .011);
    blanket.position.y = .002;
    root.add(blanket);

    const features: BoxSpec[] = [];
    for (let row = 0; row < ribs; row++) {
      if (row === 4) continue;
      const z = -1.48 + row * .37;
      const front = row > 4;
      const width = front ? 4.58 - (row % 3) * .12 : 4.84 - (row % 3) * .22;
      features.push({ x: 0, y: 0, z, w: width, h: .13, d: .173 });
      // Small, registered returns make the patterned film more than a comb.
      features.push({ x: row % 2 ? 1.91 : -1.91, y: 0, z: z + .066, w: .18, h: .13, d: .285 });
    }
    features.push({ x: -2.42, y: 0, z: -.65, w: .13, h: .13, d: 2.05 });
    features.push({ x: 2.42, y: 0, z: .65, w: .13, h: .13, d: 2.05 });
    // Registered bridges leave clearly readable rectangular etch apertures.
    // The selected central precursor remains isolated for the later release.
    for (let gap = 0; gap < 8; gap++) {
      const z = -1.295 + gap * .37;
      const positions = gap === 3 || gap === 4
        ? [-1.91, 1.91]
        : ((gap + i) % 2 ? [-1.91, -.67, .91] : [-.91, .67, 1.91]);
      for (const x of positions) features.push({ x, y: 0, z, w: .145, h: .13, d: .25 });
    }
    root.add(instancedBoxes(features, material, .035));

    if (!(i % 2)) {
      const filmDetail: BoxSpec[] = [];
      for (const row of [0, 2, 6, 8]) {
        const z = -1.48 + row * .37;
        filmDetail.push({ x: 0, y: .067, z: z - .039, w: 4.31, h: .008, d: .013 });
        filmDetail.push({ x: row < 4 ? -1.90 : 1.90, y: .067, z: z + .059, w: .018, h: .008, d: .274 });
      }
      root.add(instancedBoxes(filmDetail, copper));
    }

    const centre = block(3.58, .13, .228, material, .014);
    centre.name = i % 2 ? 'Selective-release sacrificial rib' : 'Retained channel precursor';
    root.add(centre);

    // Exposed perimeter dielectric is cut away through the central field.
    const rim = [
      { x: 0, y: -.078, z: -1.765, w: 5.03, h: .026, d: .083 },
      { x: 0, y: -.078, z: 1.765, w: 5.03, h: .026, d: .083 },
      { x: -2.515, y: -.078, z: 0, w: .083, h: .026, d: 3.53 },
      { x: 2.515, y: -.078, z: 0, w: .083, h: .026, d: 3.53 },
    ];
    root.add(instancedBoxes(rim, oxide));

    const resist = new THREE.Group();
    const masks: BoxSpec[] = [];
    for (let row = 0; row < ribs; row++) {
      masks.push({ x: 0, y: .085, z: -1.48 + row * .37, w: 4.49, h: .028, d: .171 });
    }
    resist.add(instancedBoxes(masks, etchAccent));
    root.add(resist);
    group.add(root);
    const structure = root.children.filter(child => child !== blanket && child !== resist);
    layers.push({ root, blanket, centre, resist, structure, index: i });
  }

  // A patterned top film with lithographic surface work gives a quiet crown.
  const crown = new THREE.Group();
  const crownSpecs: BoxSpec[] = [];
  for (let i = 0; i < 9; i++) {
    crownSpecs.push({ x: -2.23 + i * .556, y: 0, z: 0, w: .105, h: .049, d: 3.37 });
    crownSpecs.push({ x: -2.23 + i * .556, y: .032, z: 0, w: .031, h: .014, d: 3.34 });
  }
  crown.add(instancedBoxes(crownSpecs, copper));
  group.add(crown);

  const contactGeometry = new THREE.CylinderGeometry(.062, .062, 1, 10);
  const contactMesh = new THREE.InstancedMesh(contactGeometry, copper, 12);
  contactMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  contactMesh.frustumCulled = false;
  group.add(contactMesh);
  const contactMatrix = new THREE.Matrix4();
  const contactPosition = new THREE.Vector3();
  const contactScale = new THREE.Vector3();
  const contactQuaternion = new THREE.Quaternion();

  const scanningFilm = block(.027, .017, 3.29, new THREE.MeshStandardMaterial({
    color: 0xd5cce7, emissive: 0xb59dcc, emissiveIntensity: .8, roughness: .5, metalness: .15,
  }), .002);
  group.add(scanningFilm);

  const anchors = {
    substrate: new THREE.Vector3(-2.65, -1.13, 1.95),
    film: new THREE.Vector3(1.8, 1.2, -.15),
    etch: new THREE.Vector3(.3, .9, 1.45),
    channel: new THREE.Vector3(0, .6, 0),
  };

  function update(state: SceneState) {
    const p = clamp(state.progress);
    const inspection = clamp(state.spread) * smooth(.12, .40, p);
    const release = smooth(.78, .975, p);
    for (const layer of layers) {
      // The first film receives the selected wafer pattern. Keep that face
      // readable before later films sweep over it from the registered edge.
      const firstFilm = layer.index === 0;
      const start = firstFilm ? .012 : .28 + (layer.index - 1) * .020;
      const growth = smooth(start, start + .085, p);
      const etching = firstFilm ? smooth(.36, .55, p) : smooth(start + .12, start + .23, p);
      layer.root.visible = growth > .001;
      layer.root.position.y = -.615 + layer.index * (.246 + inspection * .19);
      layer.root.position.x = firstFilm ? 0 : -2.515 * (1 - growth);
      layer.root.scale.x = firstFilm ? 1 : Math.max(.002, growth);
      layer.root.scale.y = Math.max(.002, growth);
      layer.blanket.scale.y = Math.max(.001, 1 - etching);
      layer.blanket.position.y = -.065 + .067 * layer.blanket.scale.y;
      layer.blanket.visible = etching < .999;
      // The carrier owns the first patterned face while it grows. Native ribs
      // stay below that unbroken film until the subsequent etch reveals them;
      // a new resist pattern follows the die's landing hold instead of masking
      // its identity during magnification.
      const structureVisible = !firstFilm || p >= .36;
      for (const feature of layer.structure) feature.visible = structureVisible;
      const resistGrowth = firstFilm ? smooth(.28, .34, p) : smooth(start + .025, start + .08, p);
      const resistStrip = firstFilm ? smooth(.48, .58, p) : smooth(start + .19, start + .27, p);
      layer.resist.scale.y = Math.max(.001, (1 - resistStrip) * resistGrowth);
      layer.resist.visible = layer.resist.scale.y > .004;
      layer.centre.scale.y = layer.index % 2 ? Math.max(.001, 1 - release) : 1;
      layer.centre.visible = structureVisible && (!(layer.index % 2) || release < .999);
    }

    const topY = -.615 + 5 * (.246 + inspection * .19) + .15;
    crown.position.y = topY;
    crown.scale.y = Math.max(.001, smooth(.48, .58, p));
    crown.visible = p > .48;
    const fill = smooth(.46, .58, p);
    for (let i = 0; i < 12; i++) {
      const x = i % 2 ? 2.22 : -2.22;
      const z = -1.48 + Math.floor(i / 2) * .555;
      const bottom = -.721;
      const height = Math.max(.005, (topY - bottom) * fill);
      contactMatrix.compose(contactPosition.set(x, bottom + height / 2, z), contactQuaternion, contactScale.set(1, height, 1));
      contactMesh.setMatrixAt(i, contactMatrix);
    }
    contactMesh.instanceMatrix.needsUpdate = true;
    contactMesh.visible = fill > .002;

    const scanPhase = state.reduced ? .62 : ((state.time * .14) % 1);
    scanningFilm.position.set(mix(-2.23, 2.23, scanPhase), topY + .065, 0);
    scanningFilm.visible = state.active && p > .46 && p < .78 && !state.reduced;
    anchors.film.set(1.8, topY, -.15);
    anchors.etch.set(.3, layers[4].root.position.y, 1.45);
    anchors.channel.set(0, layers[2].root.position.y, 0);
  }

  return { group, update, anchors, dispose: () => disposeTree(group) };
}

export function createTransistorModel(): ExhibitModel {
  const group = new THREE.Group();
  group.name = 'TRANSISTOR · gate-all-around nanosheet cutaway';
  addFoundation(group, 634, 5.82, 4.34);

  const finish = precisionFinish(841);
  const silicon = finish(metal(0xacb3b7, .16, .96));
  const sourceMaterial = finish(metal(0x59646c, .22, .93));
  const contactsMaterial = finish(metal(0xc0a083, .15, .98));
  const gateMaterial = finish(metal(0xb78d6e, .17, .97));
  const gateFrontMaterial = finish(metal(0xbec6cb, .15, .98));
  const isolation = new THREE.MeshStandardMaterial({ color: 0x8e9fa6, metalness: .13, roughness: .34 });
  const dielectric = new THREE.MeshStandardMaterial({ color: 0xaec1c9, metalness: .13, roughness: .23 });
  const channelMaterial = silicon.clone();
  channelMaterial.emissive.set(palette.signal);
  channelMaterial.emissiveIntensity = 0;

  const activeBase = block(5.35, .16, 3.21, isolation, .025);
  activeBase.position.y = -.825;
  group.add(activeBase);
  const trenchFloor = block(4.86, .055, 2.87, metal(0x4b5c65, .42, .61), .009);
  trenchFloor.position.y = -.723;
  group.add(trenchFloor);

  const channelHeights = [-.35, .2, .75];
  for (const x of [-2.025, 2.025]) {
    const region = block(1.035, 1.84, 2.07, sourceMaterial, .055);
    region.position.set(x, .21, 0);
    group.add(region);

    const contact = block(1.06, .096, 2.085, contactsMaterial, .023);
    contact.position.set(x, 1.166, 0);
    group.add(contact);

    const terminal = new THREE.Group();
    terminal.position.set(x, 1.322, 0);
    const contactPosts: BoxSpec[] = [];
    for (const z of [-.67, 0, .67]) contactPosts.push({ x: 0, y: 0, z, w: .15, h: .19, d: .20 });
    terminal.add(instancedBoxes(contactPosts, metal(0xc9cdd0, .23, .88)));
    const cap = block(.97, .073, 1.85, contactsMaterial, .021);
    cap.position.y = .133;
    terminal.add(cap);
    const terminalEtching: BoxSpec[] = [];
    for (let i = 0; i < 9; i++) {
      terminalEtching.push({ x: -.354 + i * .089, y: .173, z: 0, w: .009, h: .007, d: 1.65 });
    }
    terminalEtching.push({ x: 0, y: .173, z: -.70, w: .78, h: .007, d: .011 });
    terminalEtching.push({ x: 0, y: .173, z: .70, w: .78, h: .007, d: .011 });
    terminal.add(instancedBoxes(terminalEtching, finish(metal(0x7e888d, .32, .79))));
    group.add(terminal);

    // Contact collars at the channel ends make the three retained connections readable.
    for (const y of channelHeights) {
      const collar = block(.063, .191, 1.69, silicon, .024);
      collar.position.set(x < 0 ? -1.499 : 1.499, y, 0);
      group.add(collar);
    }
  }

  const conductivePaths: THREE.Mesh[] = [];
  const removedSleeves: THREE.Mesh[] = [];
  const pathMaterial = new THREE.MeshStandardMaterial({
    color: 0xadc5bd, emissive: palette.signal, emissiveIntensity: 0,
    roughness: .34, metalness: .42,
  });
  for (const y of channelHeights) {
    const channel = block(3.52, .11, 1.43, channelMaterial, .037);
    channel.position.y = y;
    group.add(channel);
    const sleeve = sheetSleeve(1.535, dielectric);
    sleeve.position.y = y;
    group.add(sleeve);
    const removedSleeve = sleeve.clone();
    removedSleeve.scale.z = -1;
    removedSleeves.push(removedSleeve);
    const path = block(3.48, .009, .042, pathMaterial, .003);
    path.position.set(0, y + .062, .29);
    group.add(path);
    conductivePaths.push(path);
  }

  const gateGeometry = gateHalfGeometry();
  const rearGate = new THREE.Mesh(gateGeometry, gateMaterial);
  rearGate.name = 'Fixed gate half around the three insulated channels';
  group.add(rearGate);
  const frontGate = new THREE.Group();
  frontGate.name = 'Sectioned gate half · inspection opening';
  const frontShell = new THREE.Mesh(gateGeometry, gateFrontMaterial);
  frontShell.scale.z = -1;
  frontGate.add(frontShell);
  frontGate.add(...removedSleeves);
  group.add(frontGate);

  // Gate is contacted independently from source and drain.
  const gateFeed = block(.29, .425, .29, contactsMaterial, .033);
  gateFeed.position.set(0, 1.457, -.939);
  group.add(gateFeed);
  const gatePadMaterial = contactsMaterial.clone();
  gatePadMaterial.emissive.set(palette.violet);
  const gatePad = block(.72, .082, .50, gatePadMaterial, .027);
  gatePad.position.set(0, 1.697, -.939);
  group.add(gatePad);

  // A copper-revealed lip runs around the fixed gate's cut face. It is geometry
  // on the material boundary, kept separate from the insulating channel sleeves.
  const gateLip: BoxSpec[] = [
    { x: -.737, y: 1.21, z: -.55, w: .026, h: .027, d: 1.075 },
    { x: .737, y: 1.21, z: -.55, w: .026, h: .027, d: 1.075 },
    { x: -.737, y: -.765, z: -.55, w: .026, h: .027, d: 1.075 },
    { x: .737, y: -.765, z: -.55, w: .026, h: .027, d: 1.075 },
  ];
  group.add(instancedBoxes(gateLip, contactsMaterial));

  // Insulating inner spacers are distinct from the gate metal and S/D silicon.
  const spacerMaterial = new THREE.MeshStandardMaterial({ color: 0x768f9c, roughness: .37, metalness: .09 });
  for (const x of [-.887, .887]) {
    for (const y of [-.625, -.075, .475, 1.02]) {
      const spacer = block(.12, .205, 1.77, spacerMaterial, .015);
      spacer.position.set(x, y, 0);
      group.add(spacer);
    }
  }

  const carrierMaterial = new THREE.MeshStandardMaterial({
    color: 0xe4f4ee, emissive: 0xbce5d6, emissiveIntensity: 1.35, metalness: .25, roughness: .25,
  });
  const carrierMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(.033, 8, 6), carrierMaterial, 12);
  carrierMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  carrierMesh.frustumCulled = false;
  group.add(carrierMesh);
  const carrierMatrix = new THREE.Matrix4();
  const carrierPosition = new THREE.Vector3();
  const carrierScale = new THREE.Vector3();
  const carrierQuaternion = new THREE.Quaternion();

  // Machined isolation trenches are exposed around the active region.
  const isolationLines: BoxSpec[] = [];
  for (let i = 0; i < 17; i++) {
    const x = -2.48 + i * .31;
    isolationLines.push({ x, y: -.73, z: 1.452, w: .028, h: .015, d: .153 });
    isolationLines.push({ x, y: -.73, z: -1.452, w: .028, h: .015, d: .153 });
  }
  group.add(instancedBoxes(isolationLines, metal(0x71818c, .35, .7)));

  const anchors = {
    source: new THREE.Vector3(-2.03, 1.51, .3),
    drain: new THREE.Vector3(2.03, 1.51, .3),
    gate: new THREE.Vector3(.1, 1.71, -.98),
    channel: new THREE.Vector3(.82, .76, .53),
    dielectric: new THREE.Vector3(-.69, .30, .64),
  };

  function update(state: SceneState) {
    const opening = clamp(state.spread);
    // Withdraw, then fan the removed section toward an edge-on inspection view.
    // The centre stays open to the viewer instead of presenting a large wall.
    // At zero spread the two gate halves form the three full GAA apertures.
    const withdrawal = smooth(0, .28, opening);
    const fan = smooth(.13, .70, opening);
    frontGate.position.set(-fan * .18, fan * .055, withdrawal * 1.12);
    frontGate.rotation.set(0, -fan * Math.PI * .5, 0);

    const conduction = smooth(.28, .69, clamp(state.gate));
    channelMaterial.emissiveIntensity = conduction * .21;
    pathMaterial.emissiveIntensity = conduction * 1.35;
    pathMaterial.color.setHex(conduction > .01 ? 0xa9c9bd : 0x657c7b);
    conductivePaths.forEach(path => { path.visible = conduction > .006; });
    gatePadMaterial.emissiveIntensity = clamp(state.gate) * .16;

    const time = state.reduced ? 0 : state.time;
    for (let sheet = 0; sheet < 3; sheet++) {
      for (let dot = 0; dot < 4; dot++) {
        const index = sheet * 4 + dot;
        const phase = (time * (.25 + conduction * .18) + dot * .25 + sheet * .13) % 1;
        carrierMatrix.compose(
          carrierPosition.set(mix(-1.63, 1.63, phase), channelHeights[sheet] + .067, .29),
          carrierQuaternion,
          carrierScale.setScalar(.6 + conduction * .4),
        );
        carrierMesh.setMatrixAt(index, carrierMatrix);
      }
    }
    carrierMesh.instanceMatrix.needsUpdate = true;
    carrierMesh.visible = state.active && conduction > .015;
    carrierMaterial.emissiveIntensity = .22 + conduction * 1.2;
    anchors.channel.set(.84, .75 + .055, .60);
  }

  return { group, update, anchors, dispose: () => disposeTree(group) };
}

export function createInterconnectModel(): ExhibitModel {
  const group = new THREE.Group();
  group.name = 'INTERCONNECT · six metal levels and connected vias';
  addFoundation(group, 916, 6.10, 4.68);

  const finish = precisionFinish(1047);
  const copper = finish(metal(0xb97e55, .16, .98));
  const coolCopper = finish(metal(0x9f8672, .19, .97));
  const steel = finish(metal(0xa6afb5, .17, .97));
  const oxide = new THREE.MeshStandardMaterial({
    color: 0x81959e, roughness: .42, metalness: .08,
    transparent: true, opacity: .24, depthWrite: false,
  });
  const baseContactMaterial = finish(metal(0x697780, .3, .82));

  const cells: BoxSpec[] = [];
  for (let x = 0; x < 15; x++) {
    for (let z = 0; z < 11; z++) {
      cells.push({ x: -2.59 + x * .37, y: -.853, z: -1.83 + z * .366, w: .282, h: .098, d: .216 });
      cells.push({ x: -2.59 + x * .37, y: -.770, z: -1.83 + z * .366, w: .061, h: .068, d: .067 });
    }
  }
  group.add(instancedBoxes(cells, baseContactMaterial));

  type WiringLayer = { group: THREE.Group; coordinates: number[]; orientation: 'x' | 'z'; height: number; y: number };
  const definitions = [
    { orientation: 'x' as const, coordinates: Array.from({ length: 33 }, (_, i) => -1.68 + i * .105), width: .048, height: .071 },
    { orientation: 'z' as const, coordinates: Array.from({ length: 25 }, (_, i) => -2.64 + i * .22), width: .066, height: .084 },
    { orientation: 'x' as const, coordinates: Array.from({ length: 17 }, (_, i) => -1.60 + i * .2), width: .088, height: .103 },
    { orientation: 'z' as const, coordinates: Array.from({ length: 7 }, (_, i) => -2.4 + i * .8), width: .147, height: .124 },
    { orientation: 'x' as const, coordinates: [-1.5, -.75, 0, .75, 1.5], width: .192, height: .145 },
    { orientation: 'z' as const, coordinates: [-2.05, -.68, .68, 2.05], width: .222, height: .166 },
  ];
  const layers: WiringLayer[] = [];
  const seamMaterial = finish(metal(0xc1a482, .15, .98));
  definitions.forEach((definition, level) => {
    const root = new THREE.Group();
    root.name = `Metal level ${level + 1} · ${definition.orientation.toUpperCase()} routing`;
    const rails: BoxSpec[] = [];
    const inlays: BoxSpec[] = [];
    for (let i = 0; i < definition.coordinates.length; i++) {
      const coordinate = definition.coordinates[i];
      if (definition.orientation === 'x') {
        rails.push({ x: 0, y: 0, z: coordinate, w: 5.53, h: definition.height, d: definition.width });
        inlays.push({ x: 0, y: definition.height / 2 + .003, z: coordinate - definition.width * .24, w: 5.45, h: .008, d: .009 });
      } else {
        rails.push({ x: coordinate, y: 0, z: 0, w: definition.width, h: definition.height, d: 4.12 });
        inlays.push({ x: coordinate - definition.width * .24, y: definition.height / 2 + .003, z: 0, w: .009, h: .008, d: 4.04 });
      }
    }
    const railMaterial = level === 0 || level === 2 ? steel : level === 1 ? coolCopper : copper;
    // These repeated rails share their actual aspect-ratio geometry, preserving
    // a physically small bevel instead of stretching a cube's rounded corners.
    const railGeometry = block(
      definition.orientation === 'x' ? 5.53 : definition.width,
      definition.height,
      definition.orientation === 'x' ? definition.width : 4.12,
      railMaterial, .008 + level * .002,
    ).geometry;
    const railMesh = new THREE.InstancedMesh(railGeometry, railMaterial, rails.length);
    const railMatrix = new THREE.Matrix4();
    rails.forEach((rail, index) => {
      railMatrix.makeTranslation(rail.x, rail.y, rail.z);
      railMesh.setMatrixAt(index, railMatrix);
    });
    railMesh.instanceMatrix.needsUpdate = true;
    railMesh.computeBoundingSphere();
    root.add(railMesh);
    root.add(instancedBoxes(inlays, seamMaterial, .03));

    // Most dielectric is intentionally sectioned away. The surviving perimeter
    // and rear slice indicate insulation without hiding the physical wiring.
    const surround: BoxSpec[] = [
      { x: 0, y: -.095, z: -2.12, w: 5.74, h: .045, d: .16 },
      { x: -2.83, y: -.095, z: -.54, w: .10, h: .045, d: 3.34 },
      { x: 2.83, y: -.095, z: -.54, w: .10, h: .045, d: 3.34 },
    ];
    root.add(instancedBoxes(surround, oxide, .013));
    group.add(root);
    layers.push({ group: root, coordinates: definition.coordinates, orientation: definition.orientation, height: definition.height, y: 0 });
  });

  type ViaLevel = { mesh: THREE.InstancedMesh; pads: THREE.InstancedMesh; coordinates: { x: number; z: number }[]; upper: number };
  const viaLevels: ViaLevel[] = [];
  const viaMaterial = finish(metal(0xbb8a65, .16, .98));
  const viaGeometry = new THREE.CylinderGeometry(1, 1, 1, 10);
  const padGeometry = new THREE.CylinderGeometry(1, 1, .03, 12);
  const selectedConnections = [
    { x: -1.32, z: -1.68 },
    { x: -1.32, z: 0 },
    { x: .8, z: 0 },
    { x: .8, z: 1.5 },
    { x: 2.05, z: 1.5 },
  ];
  for (let upper = 1; upper < layers.length; upper++) {
    const lowerLayer = layers[upper - 1];
    const upperLayer = layers[upper];
    const xs = lowerLayer.orientation === 'z' ? lowerLayer.coordinates : upperLayer.coordinates;
    const zs = lowerLayer.orientation === 'x' ? lowerLayer.coordinates : upperLayer.coordinates;
    const coordinates: { x: number; z: number }[] = [];
    for (let xi = 0; xi < xs.length; xi++) {
      for (let zi = 0; zi < zs.length; zi++) {
        if ((xi * 7 + zi * 11 + upper * 3) % (upper > 3 ? 2 : 4) === 0) coordinates.push({ x: xs[xi], z: zs[zi] });
      }
    }
    // Every highlighted turn has an actual, co-located conductive via.
    const selected = selectedConnections[upper - 1];
    if (!coordinates.some(v => Math.abs(v.x - selected.x) < .001 && Math.abs(v.z - selected.z) < .001)) coordinates.push(selected);
    const mesh = new THREE.InstancedMesh(viaGeometry, viaMaterial, coordinates.length);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    const pads = new THREE.InstancedMesh(padGeometry, copper, coordinates.length * 2);
    pads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    pads.frustumCulled = false;
    group.add(mesh, pads);
    viaLevels.push({ mesh, pads, coordinates, upper });
  }

  const entryPins = new THREE.InstancedMesh(viaGeometry, steel, 34);
  entryPins.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  entryPins.frustumCulled = false;
  group.add(entryPins);

  const routeMaterial = new THREE.MeshStandardMaterial({
    color: 0xc2d1c5, roughness: .3, metalness: .6,
    emissive: 0xa8d6c4, emissiveIntensity: .55,
  });
  const segmentGeometry = new THREE.CylinderGeometry(.023, .023, 1, 8);
  const routeSegments: THREE.Mesh[] = [];
  for (let i = 0; i < 11; i++) {
    const mesh = new THREE.Mesh(segmentGeometry, routeMaterial);
    group.add(mesh);
    routeSegments.push(mesh);
  }
  const pulseMaterial = new THREE.MeshStandardMaterial({
    color: 0xe2f2e7, emissive: 0xc1e1d1, emissiveIntensity: 1.5, roughness: .25, metalness: .3,
  });
  const pulses = new THREE.InstancedMesh(new THREE.SphereGeometry(.047, 10, 7), pulseMaterial, 5);
  pulses.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  pulses.frustumCulled = false;
  group.add(pulses);

  const terminalMaterial = metal(0xd0b08b, .25, .91);
  const inputPad = block(.28, .034, .22, terminalMaterial, .01);
  const outputPad = block(.36, .045, .28, terminalMaterial, .012);
  group.add(inputPad, outputPad);

  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const routePoints = Array.from({ length: 12 }, () => new THREE.Vector3());
  const cumulative = new Float64Array(12);
  const anchors = {
    via: new THREE.Vector3(.8, 1.1, 1.5),
    layers: new THREE.Vector3(-2.5, 1.1, -.9),
    route: new THREE.Vector3(2.05, 1.8, -.8),
    signal: new THREE.Vector3(2.05, 1.8, -1.7),
  };

  function update(state: SceneState) {
    const lift = smooth(.035, .37, clamp(state.progress));
    const spread = clamp(state.spread);
    layers.forEach((layer, level) => {
      const assembled = -.54 + level * .425;
      const exploded = assembled + level * spread * .237;
      layer.y = mix(-.585 + level * .048, exploded, lift);
      layer.group.position.y = layer.y;
      layer.group.scale.y = mix(.16, 1, lift);
    });

    for (const vias of viaLevels) {
      const bottom = layers[vias.upper - 1].y;
      const top = layers[vias.upper].y;
      const radius = .030 + vias.upper * .0065;
      vias.coordinates.forEach((point, index) => {
        matrix.compose(position.set(point.x, (bottom + top) * .5, point.z), quaternion, scale.set(radius, Math.max(.01, top - bottom), radius));
        vias.mesh.setMatrixAt(index, matrix);
        matrix.compose(position.set(point.x, bottom + .025, point.z), quaternion, scale.set(radius * 1.32, 1, radius * 1.32));
        vias.pads.setMatrixAt(index * 2, matrix);
        matrix.compose(position.set(point.x, top - .025, point.z), quaternion, scale.set(radius * 1.32, 1, radius * 1.32));
        vias.pads.setMatrixAt(index * 2 + 1, matrix);
      });
      vias.mesh.instanceMatrix.needsUpdate = true;
      vias.pads.instanceMatrix.needsUpdate = true;
    }
    for (let i = 0; i < 34; i++) {
      const x = i % 2 ? 2.59 : -2.59;
      const z = -1.68 + Math.floor(i / 2) * .21;
      const bottom = -.755;
      matrix.compose(position.set(x, (bottom + layers[0].y) * .5, z), quaternion, scale.set(.031, layers[0].y - bottom, .031));
      entryPins.setMatrixAt(i, matrix);
    }
    entryPins.instanceMatrix.needsUpdate = true;

    const ys = layers.map(layer => layer.y + layer.height * layer.group.scale.y / 2 + .014);
    routePoints[0].set(-2.65, ys[0], -1.68);
    routePoints[1].set(-1.32, ys[0], -1.68);
    routePoints[2].set(-1.32, ys[1], -1.68);
    routePoints[3].set(-1.32, ys[1], 0);
    routePoints[4].set(-1.32, ys[2], 0);
    routePoints[5].set(.8, ys[2], 0);
    routePoints[6].set(.8, ys[3], 0);
    routePoints[7].set(.8, ys[3], 1.5);
    routePoints[8].set(.8, ys[4], 1.5);
    routePoints[9].set(2.05, ys[4], 1.5);
    routePoints[10].set(2.05, ys[5], 1.5);
    routePoints[11].set(2.05, ys[5], -1.70);
    cumulative[0] = 0;
    for (let i = 0; i < routeSegments.length; i++) {
      placeSegment(routeSegments[i], routePoints[i], routePoints[i + 1]);
      routeSegments[i].visible = lift > .045;
      cumulative[i + 1] = cumulative[i] + routePoints[i].distanceTo(routePoints[i + 1]);
    }
    const power = clamp(state.power);
    routeMaterial.emissiveIntensity = .1 + power * .70;
    inputPad.position.copy(routePoints[0]);
    outputPad.position.copy(routePoints[11]);
    inputPad.position.y -= .011;
    outputPad.position.y -= .009;

    const total = cumulative[cumulative.length - 1];
    for (let i = 0; i < 5; i++) {
      const phase = state.reduced ? (.10 + i * .17) : ((state.time * .115 + i * .2) % 1);
      const distance = phase * total;
      let segment = 0;
      while (segment < 10 && cumulative[segment + 1] < distance) segment++;
      const t = (distance - cumulative[segment]) / Math.max(.001, cumulative[segment + 1] - cumulative[segment]);
      position.copy(routePoints[segment]).lerp(routePoints[segment + 1], t);
      matrix.compose(position, quaternion, scale.setScalar(.7 + power * .3));
      pulses.setMatrixAt(i, matrix);
    }
    pulses.instanceMatrix.needsUpdate = true;
    pulses.visible = state.active && power > .015 && lift > .09;
    pulseMaterial.emissiveIntensity = .25 + power * 1.25;
    anchors.via.set(.8, (layers[3].y + layers[4].y) * .5, 1.5);
    anchors.layers.set(-2.5, layers[3].y, -.9);
    anchors.route.set(2.05, ys[5], -.8);
    anchors.signal.copy(routePoints[11]);
  }

  return { group, update, anchors, dispose: () => disposeTree(group) };
}
