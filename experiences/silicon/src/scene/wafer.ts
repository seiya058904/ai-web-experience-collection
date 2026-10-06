import * as THREE from 'three';
import { block, clamp, line, metal, mix, palette, pipe, seededRandom, smooth, type ExhibitModel, type SceneState } from './shared';

export interface WaferModel extends ExhibitModel {
  setOptics(amount: number): void;
}

function waferShape(radius: number) {
  const shape = new THREE.Shape();
  const segments = 256;
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const notch = Math.abs(a - Math.PI * 1.5) < .035 ? .13 : 0;
    const r = radius - notch;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

const DIE_COUNT = 26;
const SELECTED_CELL = { x: 11, y: 14 };

interface SurfaceMaps { color: THREE.CanvasTexture; detail: THREE.CanvasTexture; }

function surfaceCanvases(size: number) {
  const color = document.createElement('canvas');
  const detail = document.createElement('canvas');
  color.width = color.height = detail.width = detail.height = size;
  return { color, detail, ink: color.getContext('2d')!, relief: detail.getContext('2d')! };
}

function surfaceMaps(color: HTMLCanvasElement, detail: HTMLCanvasElement): SurfaceMaps {
  const colorMap = new THREE.CanvasTexture(color);
  colorMap.colorSpace = THREE.SRGBColorSpace;
  const detailMap = new THREE.CanvasTexture(detail);
  // One linear texture carries height in R and roughness in G. Neither
  // channel contains painted illumination or a reflection.
  detailMap.colorSpace = THREE.NoColorSpace;
  for (const texture of [colorMap, detailMap]) {
    texture.anisotropy = 8;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
  }
  return { color: colorMap, detail: detailMap };
}

/** Draw at the final atlas scale: a hierarchy of memory banks, a logic core,
 * I/O regions and routed buses, with no miniature intermediate bitmap. */
function drawDieFloorplan(
  ink: CanvasRenderingContext2D, relief: CanvasRenderingContext2D,
  x: number, y: number, width: number, height: number, variant: number, mask = false,
) {
  for (const ctx of [ink, relief]) {
    ctx.save(); ctx.translate(x, y); ctx.scale(width / 80, height / 80);
    ctx.lineCap = 'square'; ctx.lineJoin = 'miter';
  }
  const rect = (rx: number, ry: number, w: number, h: number, color: string, elevation = 140, roughness = 228) => {
    ink.fillStyle = color; ink.fillRect(rx, ry, w, h);
    relief.fillStyle = `rgb(${elevation},${roughness},0)`; relief.fillRect(rx, ry, w, h);
  };
  const route = (points: number[][], color: string, lineWidth = 1.15, elevation = 153, roughness = 194) => {
    for (const [ctx, stroke] of [[ink, color], [relief, `rgb(${elevation},${roughness},0)`]] as const) {
      ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.beginPath();
      points.forEach((point, index) => index ? ctx.lineTo(point[0], point[1]) : ctx.moveTo(point[0], point[1]));
      ctx.stroke();
    }
  };
  const field = mask ? '#28343c' : ['#535d65', '#515b64', '#56616a', '#505b63'][variant];
  const bankColor = mask ? '#18252e' : '#35434d';
  const cells = mask ? '#a7b2b6' : '#73818a';
  const routing = mask ? '#c1c8c7' : '#a28e76';
  const secondary = mask ? '#89979d' : '#79878e';
  rect(0, 0, 80, 80, '#29333b', 117, 243);
  rect(1.15, 1.15, 77.7, 77.7, field, 137, 231);
  route([[3.3, 3.3], [76.7, 3.3], [76.7, 76.7], [3.3, 76.7], [3.3, 3.3]], mask ? '#73818a' : '#7f888a', .7, 142, 220);

  const bank = (bx: number, by: number, w: number, h: number) => {
    rect(bx, by, w, h, bankColor, 131, 237);
    const rows = 5, columns = 3;
    for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
      rect(bx + 1.5 + col * (w - 3) / columns, by + 1.6 + row * (h - 3) / rows,
        (w - 3) / columns - 1.15, 1.05, cells, 150, 201);
    }
    route([[bx + 1.2, by + h - 1.5], [bx + w - 1.2, by + h - 1.5]], routing, .95);
    if (mask) {
      // The same floorplan can carry its finer routing on the enlarged mask.
      for (let row = 0; row < rows; row++) {
        route([[bx + 1.5, by + 2.9 + row * (h - 3) / rows], [bx + w - 1.5, by + 2.9 + row * (h - 3) / rows]], '#586b76', .22, 146, 211);
      }
    }
  };
  bank(6.2, 7, 23.3, 17.6);
  bank(50.5, 7, 23.3, 17.6);
  bank(6.2, 55.4, 23.3, 17.6);
  bank(50.5, 55.4, 23.3, 17.6);

  rect(31.4, 27.3, 17.2, 25.4, '#36434c', 135, 238);
  const logic = [[32.8, 28.7, 6.5, 7.1], [40.6, 28.7, 6.5, 4.7], [40.6, 34.7, 6.5, 10.8], [32.8, 37.3, 6.5, 10.2], [35, 49, 12.1, 2.2]];
  logic.forEach((cell, index) => rect(cell[0], cell[1], cell[2], cell[3],
    mask ? (index % 2 ? '#a7b0b2' : '#6d808a') : (index % 2 ? '#75828a' : '#5e6d77'), 144 + index * 2, 206 + index * 4));
  for (const bx of [7, 54]) {
    rect(bx, 29.2, 19, 21.4, mask ? '#334650' : '#414f59', 138, 225);
    for (let row = 0; row < 6; row++) {
      rect(bx + 1.6, 31 + row * 3.05, 5.3 + (row % 2) * 2.7, 1.25, secondary, 151, 199);
      rect(bx + 12.5, 31 + row * 3.05, 4.8, 1.25, routing, 154, 186);
    }
  }

  // Routing is wide enough to survive the approximately forty-pixel hero die.
  route([[14, 26.5], [30, 26.5], [30, 20.5], [39, 20.5], [39, 6.7]], routing, 1.3);
  route([[66, 26.5], [50, 26.5], [50, 20.5], [43, 20.5], [43, 6.7]], secondary, 1.05);
  route([[14, 53.3], [30, 53.3], [30, 59.5], [39, 59.5], [39, 73.3]], secondary, 1.15);
  route([[66, 53.3], [50, 53.3], [50, 59.5], [43, 59.5], [43, 73.3]], routing, 1.3);
  for (let i = 0; i < 3; i++) {
    route([[26, 33 + i * 4.5], [28 + i * .8, 33 + i * 4.5], [28 + i * .8, 36 + i * 4.5], [31.4, 36 + i * 4.5]], secondary, .95);
    route([[48.6, 32 + i * 5], [51 - i * .75, 32 + i * 5], [51 - i * .75, 35 + i * 5], [54, 35 + i * 5]], routing, .95);
  }
  route([[6.3, 27.3], [4.8, 27.3], [4.8, 52.7], [6.3, 52.7]], routing, 1);
  route([[73.7, 27.3], [75.2, 27.3], [75.2, 52.7], [73.7, 52.7]], secondary, 1);
  for (let i = 0; i < 14; i++) {
    const px = 5.3 + i * 5.25;
    rect(px, .45, 1.7, 1.35, routing, 153, 185);
    rect(px, 78.2, 1.7, 1.35, routing, 153, 185);
  }
  // Three small registration features repeat on the die and its reticle.
  for (let i = 0; i < 3; i++) rect(34 + i * 4.4, 74.4, 2.1, 1.3, routing, 155, 190);
  for (const ctx of [ink, relief]) ctx.restore();
}

function waferSurfaceMaps() {
  const { color, detail, ink, relief } = surfaceCanvases(2048);
  ink.fillStyle = '#10191f'; ink.fillRect(0, 0, 2048, 2048);
  relief.fillStyle = 'rgb(75,250,0)'; relief.fillRect(0, 0, 2048, 2048);
  const pitch = 2048 / DIE_COUNT;
  const scribe = 2.2;
  for (let x = 0; x < DIE_COUNT; x++) for (let y = 0; y < DIE_COUNT; y++) {
    drawDieFloorplan(ink, relief, x * pitch + scribe / 2, y * pitch + scribe / 2,
      pitch - scribe, pitch - scribe, (x + y * 2) % 4);
  }
  return surfaceMaps(color, detail);
}

function reticleSurfaceMaps() {
  const { color, detail, ink, relief } = surfaceCanvases(1024);
  drawDieFloorplan(ink, relief, 0, 0, 1024, 1024, (SELECTED_CELL.x + SELECTED_CELL.y * 2) % 4, true);
  return surfaceMaps(color, detail);
}

/** Regenerate the selected atlas cell at inspection resolution. The scribe
 * margin, floorplan and variant are identical to its wafer-scale source. */
function selectedDieSurfaceMaps() {
  const size = 1024;
  const { color, detail, ink, relief } = surfaceCanvases(size);
  ink.fillStyle = '#10191f'; ink.fillRect(0, 0, size, size);
  relief.fillStyle = 'rgb(75,250,0)'; relief.fillRect(0, 0, size, size);
  const scribe = size * 2.2 / (2048 / DIE_COUNT);
  drawDieFloorplan(ink, relief, scribe / 2, scribe / 2, size - scribe, size - scribe,
    (SELECTED_CELL.x + SELECTED_CELL.y * 2) % 4);
  return surfaceMaps(color, detail);
}

/** Shallow rotational face with an unchanged central hit point and tangent.
 * Its normals, rather than a painted gradient, bend the studio reflection. */
function concaveMirrorGeometry(radius = .90, sag = .045) {
  const segments = 96, rings = 24;
  const positions: number[] = [], normals: number[] = [], uvs: number[] = [], tangents: number[] = [];
  const indices: number[] = [];
  const vertex = (r: number, angle: number) => {
    const x = Math.cos(angle) * r, z = Math.sin(angle) * r;
    positions.push(x, sag * (r / radius) ** 2, z);
    const normal = new THREE.Vector3(-2 * sag * x / (radius * radius), 1, -2 * sag * z / (radius * radius)).normalize();
    normals.push(normal.x, normal.y, normal.z);
    uvs.push(x / (radius * 2) + .5, z / (radius * 2) + .5);
    tangents.push(-Math.sin(angle), 0, Math.cos(angle), 1);
  };
  vertex(0, 0);
  for (let ring = 1; ring <= rings; ring++) for (let segment = 0; segment <= segments; segment++) {
    vertex(radius * ring / rings, segment / segments * Math.PI * 2);
  }
  for (let segment = 0; segment < segments; segment++) indices.push(0, segment + 2, segment + 1);
  for (let ring = 0; ring < rings - 1; ring++) for (let segment = 0; segment < segments; segment++) {
    const inner = 1 + ring * (segments + 1) + segment;
    const outer = inner + segments + 1;
    indices.push(inner, inner + 1, outer, inner + 1, outer + 1, outer);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('tangent', new THREE.Float32BufferAttribute(tangents, 4));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

function brushedMirrorMaterial() {
  const size = 512, data = new Uint8Array(size * size * 4);
  const random = seededRandom(744);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const r = Math.hypot((x + .5) / size - .5, (y + .5) / size - .5);
    const rings = Math.sin(r * 780) * .72 + Math.sin(r * 1460) * .18;
    const noise = random() - .5;
    const offset = (y * size + x) * 4;
    data[offset] = Math.round(128 + rings * 5 + noise * 2);
    data[offset + 1] = Math.round(223 + rings * 13 + noise * 7);
    data[offset + 2] = 0; data[offset + 3] = 255;
  }
  const finish = new THREE.DataTexture(data, size, size);
  finish.colorSpace = THREE.NoColorSpace;
  finish.magFilter = THREE.LinearFilter;
  finish.minFilter = THREE.LinearMipmapLinearFilter;
  finish.generateMipmaps = true; finish.anisotropy = 8; finish.needsUpdate = true;
  return new THREE.MeshPhysicalMaterial({
    color: 0xbac2c8, metalness: .96, roughness: .245, envMapIntensity: 1,
    roughnessMap: finish, bumpMap: finish, bumpScale: .0012,
    anisotropy: .58, anisotropyRotation: 0, clearcoat: 0,
  });
}

export function createWaferModel(): WaferModel {
  const group = new THREE.Group();
  const wafer = new THREE.Group();
  const optics = new THREE.Group();
  group.add(wafer, optics);
  const radius = 4.05;
  const shape = waferShape(radius);
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: .09, bevelEnabled: true, bevelSize: .012, bevelThickness: .012, bevelSegments: 2, steps: 1 }), metal(0x8b9193, .17));
  body.rotation.x = -Math.PI / 2;
  body.position.y = -.09;
  wafer.add(body);
  const topGeometry = new THREE.ShapeGeometry(shape);
  const positions = topGeometry.attributes.position;
  const uv = topGeometry.attributes.uv;
  for (let i = 0; i < positions.count; i++) uv.setXY(i, positions.getX(i) / (radius * 2) + .5, positions.getY(i) / (radius * 2) + .5);
  const waferMaps = waferSurfaceMaps();
  const film = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: .98, roughness: .115, envMapIntensity: 1.15,
    map: waferMaps.color, roughnessMap: waferMaps.detail, bumpMap: waferMaps.detail, bumpScale: .00045,
    iridescence: .16, iridescenceIOR: 1.38, iridescenceThicknessRange: [290, 355],
    clearcoat: .08, clearcoatRoughness: .09,
  });
  const uniforms = { pattern: { value: .96 }, exposure: { value: 0 }, optics: { value: 0 } };
  film.onBeforeCompile = shader => {
    shader.uniforms.uPattern = uniforms.pattern;
    shader.uniforms.uExposure = uniforms.exposure;
    shader.uniforms.uOptics = uniforms.optics;
    shader.fragmentShader = `uniform float uPattern; uniform float uExposure; uniform float uOptics;\n` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      float waferExposed = 1.0 - smoothstep(uExposure - .012, uExposure + .012, vMapUv.y);
      float waferResist = uOptics * (1.0 - waferExposed);
      float patternVisibility = mix(uPattern, 1.0, uOptics);
      // The reveal retains the authored dark floorplan. These are linear
      // base values; exposure changes the resist response, never radiance.
      diffuseColor.rgb = mix(vec3(.025,.032,.038), diffuseColor.rgb, patternVisibility);
      diffuseColor.rgb *= mix(vec3(1.0), vec3(.78,.80,.88), waferResist);
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', `
      #include <roughnessmap_fragment>
      roughnessFactor = clamp(roughnessFactor + waferResist * .020, .075, .20);
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <lights_physical_fragment>', `
      #include <lights_physical_fragment>
      #ifdef USE_IRIDESCENCE
        // A real material-thickness variation enters the native Fresnel model.
        // Warm and violet highlight placement is supplied by the studio.
        material.iridescenceThickness = mix(290.0, 355.0, clamp(vMapUv.x * .72 + vMapUv.y * .28, 0.0, 1.0));
        material.iridescence *= mix(1.0, .72, waferResist);
      #endif
    `);
  };
  film.customProgramCacheKey = () => 'silicon-patterned-film-v4';
  const top = new THREE.Mesh(topGeometry, film);
  top.rotation.x = -Math.PI / 2;
  top.position.y = .025;
  wafer.add(top);

  const edgePoints = shape.getPoints(256).map(p => new THREE.Vector3(p.x, .032, -p.y));
  const brightRim = line(edgePoints, 0xd8c6b0, .52);
  wafer.add(brightRim);

  // This exact atlas cell also supplies the physical PATTERN → BUILD carrier.
  // Its +Y tangent and footprint remain registered after the wafer transforms.
  const pitch = radius * 2 / DIE_COUNT;
  const selectedDie = new THREE.Group();
  selectedDie.name = 'handoff-selected-die';
  selectedDie.position.set(-1.5 * pitch, .031, 1.5 * pitch);
  const dieGeometry = new THREE.PlaneGeometry(pitch, pitch);
  const dieUv = dieGeometry.attributes.uv;
  for (let i = 0; i < dieUv.count; i++) {
    dieUv.setXY(i, (SELECTED_CELL.x + dieUv.getX(i)) / DIE_COUNT,
      (DIE_COUNT - SELECTED_CELL.y - 1 + dieUv.getY(i)) / DIE_COUNT);
  }
  const selectedSurface = new THREE.Mesh(dieGeometry, film);
  selectedSurface.name = 'Selected patterned silicon surface';
  selectedSurface.rotation.x = -Math.PI / 2;
  selectedDie.add(selectedSurface);
  const halfPitch = pitch / 2;
  const selected = line([
    new THREE.Vector3(-halfPitch, .021, -halfPitch), new THREE.Vector3(halfPitch, .021, -halfPitch),
    new THREE.Vector3(halfPitch, .021, halfPitch), new THREE.Vector3(-halfPitch, .021, halfPitch), new THREE.Vector3(-halfPitch, .021, -halfPitch),
  ], 0xefc499);
  selectedDie.add(selected);
  selectedDie.userData.footprint = { width: pitch, depth: pitch };
  selectedDie.userData.atlasCell = { ...SELECTED_CELL, count: DIE_COUNT };
  selectedDie.userData.surface = selectedSurface;
  selectedDie.userData.outline = selected;
  selectedDie.userData.makeLargeSurface = selectedDieSurfaceMaps;
  wafer.add(selectedDie);
  group.userData.handoffSelectedDie = selectedDie;

  // The wafer chuck appears only as the material enters the optical column.
  const chuck = new THREE.Group();
  const chuckBody = new THREE.Mesh(new THREE.CylinderGeometry(3.17, 3.25, .24, 96), metal(0x272e33, .28));
  chuckBody.position.y = -1.49;
  chuck.add(chuckBody);
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const fixing = block(.19, .1, .3, metal(0xabb1b4, .21), .025);
    fixing.position.set(Math.cos(angle) * 3.12, -1.34, Math.sin(angle) * 3.12);
    fixing.rotation.y = -angle;
    chuck.add(fixing);
  }
  optics.add(chuck);

  const points = [
    new THREE.Vector3(2.6, 4.3, -1.6),
    new THREE.Vector3(1.55, 3.3, -.85),
    new THREE.Vector3(-1.7, 2.25, -.35),
    new THREE.Vector3(1.3, 1.1, -.45),
    new THREE.Vector3(-.72, .05, .3),
    new THREE.Vector3(.5, -1.2, .4),
  ];
  const reticle = new THREE.Group();
  reticle.position.copy(points[1]);
  const mask = block(2.5, .10, 1.7, metal(0x9fa8b1, .2), .04);
  reticle.add(mask);
  const maskMaps = reticleSurfaceMaps();
  const maskSurface = block(2.25, .012, 1.45, new THREE.MeshStandardMaterial({
    color: 0xe7edf0, map: maskMaps.color, metalness: .90, roughness: .31, envMapIntensity: 1,
    roughnessMap: maskMaps.detail, bumpMap: maskMaps.detail, bumpScale: .0012,
  }), .003);
  maskSurface.position.y = .06; reticle.add(maskSurface);
  const reticleNormal = points[0].clone().sub(points[1]).normalize().add(points[2].clone().sub(points[1]).normalize()).normalize().negate();
  reticle.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), reticleNormal);
  optics.add(reticle);

  const mirrorGroups: THREE.Group[] = [];
  const mirrorGeometry = concaveMirrorGeometry();
  const mirrorMaterial = brushedMirrorMaterial();
  const mirrorEdgeMaterial = metal(0x8f989e, .24, .94);
  for (let i = 2; i < 5; i++) {
    const assembly = new THREE.Group();
    assembly.position.copy(points[i]);
    const normal = points[i-1].clone().sub(points[i]).normalize().add(points[i+1].clone().sub(points[i]).normalize()).normalize();
    if (i === 3) normal.negate();
    assembly.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(.94, .98, .17, 80), metal(0x202a31, .28));
    housing.position.y = -.105; assembly.add(housing);
    const mirror = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
    mirror.name = `Concave optical face ${i - 1}`;
    assembly.add(mirror);
    const mirrorEdge = new THREE.Mesh(new THREE.CylinderGeometry(.90, .915, .072, 96, 1, true), mirrorEdgeMaterial);
    mirrorEdge.position.y = .009; assembly.add(mirrorEdge);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.915, .014, 6, 80), metal(0xe1e3e4, .17));
    ring.rotation.x = Math.PI / 2; ring.position.y = .045;
    assembly.add(ring);
    for (let j = 0; j < 8; j++) {
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .08, 8), metal(0x89959d, .24));
      const a = j * Math.PI / 4;
      bolt.position.set(Math.cos(a) * .963, -.06, Math.sin(a) * .963);
      assembly.add(bolt);
    }
    optics.add(assembly); mirrorGroups.push(assembly);
  }

  const lightCore = new THREE.MeshBasicMaterial({color: 0xe9daff, toneMapped: false});
  const lightOuter = new THREE.MeshBasicMaterial({color: 0xc1a6f0, transparent: true, opacity: .085, depthWrite: false, toneMapped: false});
  const beam = pipe(points, .009, lightCore);
  const aura = pipe(points, .033, lightOuter);
  optics.add(beam, aura);
  const photon = new THREE.Mesh(new THREE.SphereGeometry(.031, 10, 8), new THREE.MeshBasicMaterial({color: 0xffffff, toneMapped: false}));
  optics.add(photon);
  const beamCurve = new THREE.CurvePath<THREE.Vector3>();
  for (let i = 1; i < points.length; i++) beamCurve.add(new THREE.LineCurve3(points[i-1], points[i]));
  const sweepMaterial = new THREE.MeshBasicMaterial({ color: palette.violet, transparent: true, opacity: .32, side: THREE.DoubleSide, depthWrite: false });
  const sweep = new THREE.Mesh(new THREE.PlaneGeometry(1.5, .025), sweepMaterial);
  sweep.rotation.x = -Math.PI/2; sweep.position.set(.3, -1.185, 0);
  optics.add(sweep);
  const field = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ color: 0xb995e8, transparent: true, opacity: .065, depthWrite: false, side: THREE.DoubleSide }));
  field.rotation.x = -Math.PI/2; field.position.set(.3, -1.192, .2);
  optics.add(field);

  let opticalAmount = 0;
  return {
    group,
    anchors: { wafer: new THREE.Vector3(2.1, -.04, 2.2), reticle: points[1], optics: points[3], resist: points[5] },
    setOptics(amount) { opticalAmount = clamp(amount); },
    update(state: SceneState) {
      const p = opticalAmount;
      wafer.scale.setScalar(mix(1.49, .76, p));
      wafer.position.y = mix(-.12, -1.23, p);
      wafer.rotation.y = mix(-.24, -.04, p) + (state.reduced ? 0 : Math.sin(state.time * .08) * .009);
      wafer.rotation.z = mix(-.05, 0, p);
      optics.visible = p > .001;
      optics.rotation.y = -.65;
      const enter = smooth(0, .9, p);
      reticle.position.y = points[1].y + (1 - enter) * 4;
      mirrorGroups.forEach((m, i) => {
        m.position.copy(points[i+2]);
        m.position.x += (1 - smooth(i * .08, .55 + i * .15, p)) * (i % 2 ? 4 : -4);
        m.scale.setScalar(Math.max(.001, smooth(.08, .6, p)));
      });
      chuck.scale.setScalar(Math.max(.001, p));
      const illuminated = smooth(.48, .92, p);
      beam.visible = aura.visible = photon.visible = illuminated > .001;
      beam.geometry.setDrawRange(0, Math.floor(beam.geometry.index!.count * illuminated / 3) * 3);
      aura.geometry.setDrawRange(0, Math.floor(aura.geometry.index!.count * illuminated / 3) * 3);
      if (photon.visible) photon.position.copy(beamCurve.getPointAt(state.reduced ? .72 : (state.time * .17) % 1));
      uniforms.optics.value = smooth(.8, 1, p);
      // Initial grid is an anticipatory surface study; manufacturing state is described in the exhibit notes.
      uniforms.pattern.value = p < .1 ? mix(.96, 1, smooth(0, .55, state.progress)) : 1;
      const exposure = state.exposure >= 0 ? state.exposure : smooth(.08, .73, state.progress);
      uniforms.exposure.value = p > .9 ? exposure : 0;
      sweep.visible = field.visible = p > .9;
      sweep.position.z = -.55 + exposure * 1.5;
      sweepMaterial.opacity = state.reduced ? .28 : .24 + Math.sin(state.time * 1.3) * .04;
      selected.visible = p < .8 || (p > .98 && state.progress > .56);
      (selected.material as THREE.LineBasicMaterial).opacity = .65 + (state.reduced ? 0 : Math.sin(state.time) * .14);
    },
  };
}
