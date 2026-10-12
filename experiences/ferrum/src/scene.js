import * as THREE from 'three';
import { clamp, smoothstep, sampleStrikeParticles } from './story.js';

const lerp = (a, b, t) => a + (b - a) * t;
const random = n => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return v - Math.floor(v);
};

/** A billet and its finished form share every vertex and the same scar. */
function createMetalGeometry() {
  // Cross sections are [height, breadth]. Separate strips keep the bevel crisp.
  const raw = [
    [.95, -1], [1, -.94], [1, -.28], [1, .25], [1, .94], [.95, 1],
    [-.95, 1], [-1, .94], [-1, .28], [-1, -.25], [-1, -.94], [-.95, -1],
  ];
  const refined = [
    [.025, -1], [.42, -.85], [.88, -.30], [1, .03], [.61, .66], [.025, 1],
    [-.025, 1], [-.35, .83], [-.73, .28], [-.82, -.03], [-.50, -.68], [-.025, -1],
  ];
  const segments = 68;
  const source = [], target = [], uv = [], along = [], bevelWeights = [], indices = [];
  const bevels = [1, .18, .06, .12, 1, .25, .85, .16, .06, .12, .95, .22];
  function vertex(t, side, finish) {
    const p = (finish ? refined : raw)[side];
    const width = finish ? .85 : 1.05;
    let taper = 1;
    if (finish) taper = 1 - smoothstep(.76, 1, t) * .996;
    else taper = .93 + .07 * Math.sin(Math.PI * t);
    const baseRound = .92 + .08 * smoothstep(0, .025, t);
    const grain = finish ? .00025 : .003;
    const irregular = (Math.sin(t * 13 + side * 2.7) * .55 + Math.sin(t * 39 + side * .8) * .28) * grain;
    const x = (t - .5) * (finish ? 9.65 : 5.55);
    const scar = Math.exp(-Math.pow((t - .305) / .013, 2)) * Math.exp(-Math.pow((side / 12 - .31) / .12, 2)) * (finish ? .0006 : .004);
    const y = p[0] * (finish ? .145 : .60) * taper * baseRound + irregular - scar * Math.max(0, p[0]);
    const z = p[1] * width * taper * baseRound + irregular * .5;
    return [x, y, z];
  }
  for (let side = 0; side < raw.length; side++) {
    const next = (side + 1) % raw.length;
    const offset = source.length / 3;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      for (const s of [side, next]) {
        source.push(...vertex(t, s, false));
        target.push(...vertex(t, s, true));
        uv.push(t, s === 0 && next === 0 ? 1 : s / raw.length);
        along.push(t);
        bevelWeights.push(bevels[side]);
      }
    }
    for (let i = 0; i < segments; i++) {
      const a = offset + i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  // Closed ends prevent a hollow silhouette in grazing and reverse views.
  for (const end of [0, 1]) {
    const offset = source.length / 3;
    source.push((end - .5) * 5.55, 0, 0);
    target.push((end - .5) * 9.65, 0, 0);
    uv.push(.5, .5);
    along.push(end);
    bevelWeights.push(.10);
    for (let side = 0; side < raw.length; side++) {
      source.push(...vertex(end, side, false));
      target.push(...vertex(end, side, true));
      uv.push(raw[side][0] * .5 + .5, raw[side][1] * .5 + .5);
      along.push(end);
      bevelWeights.push(.10);
    }
    for (let side = 0; side < raw.length; side++) {
      const a = offset + 1 + side, b = offset + 1 + (side + 1) % raw.length;
      if (end) indices.push(offset, a, b); else indices.push(offset, b, a);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(source, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setAttribute('aFerrumAlong', new THREE.Float32BufferAttribute(along, 1));
  geometry.setAttribute('aFerrumBevel', new THREE.Float32BufferAttribute(bevelWeights, 1));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const finished = new THREE.BufferGeometry();
  finished.setAttribute('position', new THREE.Float32BufferAttribute(target, 3));
  finished.setIndex(indices);
  finished.computeVertexNormals();
  geometry.morphAttributes.position = [finished.getAttribute('position')];
  geometry.morphAttributes.normal = [finished.getAttribute('normal')];
  geometry.computeBoundingSphere();
  geometry.name = 'One metal, from billet to sculptural edge';
  return geometry;
}

function surfaceTexture() {
  const width = 512, height = 256;
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const coarse = random(Math.floor(x / 7) * 23 + Math.floor(y / 5) * 61);
      const fine = random(x * 7 + y * 211);
      const scratch = Math.pow(random(y * 33), 14) * (.45 + .55 * random(Math.floor(x / 35) + y));
      const value = clamp(.53 + (coarse - .5) * .30 + (fine - .5) * .20 - scratch * .25);
      const v = Math.floor(value * 255);
      data[i] = v; data[i + 1] = Math.floor(lerp(.58, .99, value) * 255); data[i + 2] = v; data[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 2;
  texture.needsUpdate = true;
  texture.name = 'Original seeded scale and grinding grain';
  return texture;
}

function metalMaterial(texture) {
  const uniforms = {
    ferrumHeat: { value: 0 }, ferrumPolish: { value: 0 }, ferrumOxide: { value: 1 },
    ferrumHotspot: { value: .65 },
    ferrumCooling: { value: 0 }, ferrumWaterLevel: { value: -1 },
    ferrumForgedMap: { value: texture }, ferrumPolishedMap: { value: texture },
    ferrumDetailReady: { value: 0 },
  };
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x9ca5a6, metalness: 1, roughness: .42,
    roughnessMap: texture, bumpMap: texture, bumpScale: .033,
    envMapIntensity: 1.15, clearcoat: 0, dithering: true,
  });
  material.name = 'FERRUM / forged and ground steel';
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aFerrumAlong;\nattribute float aFerrumBevel;\nvarying vec2 vFerrumUV;\nvarying float vFerrumAlong;\nvarying float vFerrumBevel;\nvarying float vFerrumWorldY;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFerrumUV = uv;\nvFerrumAlong = aFerrumAlong;\nvFerrumBevel = aFerrumBevel;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvFerrumWorldY = (modelMatrix * vec4(transformed, 1.)).y;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec2 vFerrumUV;
        varying float vFerrumAlong;
        varying float vFerrumBevel;
        varying float vFerrumWorldY;
        uniform float ferrumHeat;
        uniform float ferrumPolish;
        uniform float ferrumOxide;
        uniform float ferrumHotspot;
        uniform float ferrumCooling;
        uniform float ferrumWaterLevel;
        uniform sampler2D ferrumForgedMap;
        uniform sampler2D ferrumPolishedMap;
        uniform float ferrumDetailReady;
        float ferrumHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
        float ferrumNoise(vec2 p) {
          vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
          return mix(mix(ferrumHash(i), ferrumHash(i+vec2(1.,0.)), f.x),
                     mix(ferrumHash(i+vec2(0.,1.)), ferrumHash(i+vec2(1.,1.)), f.x), f.y);
        }
        float ferrumRaw(vec2 p) { return texture2D(ferrumForgedMap, p * vec2(2.0, 4.0)).r; }
        float ferrumGround(vec2 p) { return texture2D(ferrumPolishedMap, p.yx * vec2(5.5, 2.0)).r; }
        float ferrumFinish() { return ferrumPolish * (1. - (1. - smoothstep(.055, .10, vFerrumBevel)) * .82); }
        float ferrumHeight(vec2 p) {
          float finish = ferrumFinish();
          return mix(ferrumRaw(p), ferrumGround(p), finish) * mix(1., 3., ferrumPolish - finish);
        }
      `)
      .replace('#include <bumpmap_pars_fragment>', THREE.ShaderChunk.bumpmap_pars_fragment
        .replaceAll('texture2D( bumpMap, vBumpMapUv ).x', 'ferrumHeight(vBumpMapUv)')
        .replaceAll('texture2D( bumpMap, vBumpMapUv + dSTdx ).x', 'ferrumHeight(vBumpMapUv + dSTdx)')
        .replaceAll('texture2D( bumpMap, vBumpMapUv + dSTdy ).x', 'ferrumHeight(vBumpMapUv + dSTdy)'))
      .replace('#include <color_fragment>', `#include <color_fragment>
        float rawDetail = ferrumRaw(vFerrumUV);
        float groundDetail = ferrumGround(vFerrumUV);
        float scaleNoise = mix(ferrumNoise(vFerrumUV * vec2(52., 30.)), clamp(rawDetail * 2., 0., 1.), ferrumDetailReady);
        float cloud = ferrumNoise(vFerrumUV * vec2(13., 9.));
        float seamDistance = abs(vFerrumAlong - (.305 + .006*sin(vFerrumUV.y*23.)));
        float seam = (1. - smoothstep(.00035, .0014, seamDistance)) * (1. - smoothstep(.035,.11,abs(vFerrumUV.y - .31)));
        float scalePatch = smoothstep(.36, .63, cloud) * ferrumOxide;
        float thermalField = ferrumNoise(vec2(vFerrumAlong * 54., vFerrumUV.y * 126.)) * .62
          + ferrumNoise(vec2(vFerrumAlong * 110., vFerrumUV.y * 250.)) * .28
          + ferrumNoise(vec2(vFerrumAlong * 237., vFerrumUV.y * 520.)) * .10;
        float oxidePlate = smoothstep(.61, .76, thermalField);
        float zoneFinish = ferrumFinish();
        diffuseColor.rgb *= mix(mix(.10, .68, scaleNoise), .80 + groundDetail * .35, zoneFinish);
        diffuseColor.rgb *= 1. - seam * mix(.14, .07, ferrumPolish);
        diffuseColor.rgb *= 1. - ferrumPolish * (1. - vFerrumBevel) * .28;
        diffuseColor.rgb *= 1. - ferrumHeat * oxidePlate * .18;
      `)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = clamp(mix(.65 + (1.-scaleNoise)*.21, .17 + groundDetail*.10 + (1.-vFerrumBevel)*.10, zoneFinish) + seam*.045, .15, .88);
      `)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float hotShape = exp(-pow((vFerrumAlong - ferrumHotspot) / .235, 2.));
        float localHeat = ferrumHeat * hotShape;
        vec3 temperatureColor = mix(vec3(1.50,.10,.003), vec3(2.20,.60,.065), smoothstep(.58,.93,localHeat));
        float grainTemperature = .85 + .30 * clamp(rawDetail * 2., 0., 1.);
        // Heat is a continuous axial field. Oxide only covers small solid
        // islands; no noise threshold is used as a luminous contour.
        totalEmissiveRadiance += temperatureColor * pow(localHeat,2.4) * mix(1.,.38,oxidePlate) * grainTemperature;
      `)
      .replace('#include <opaque_fragment>', `
        float beneathWater = ferrumCooling * (1. - smoothstep(ferrumWaterLevel - .28, ferrumWaterLevel + .035, vFerrumWorldY));
        outgoingLight *= mix(vec3(1.), vec3(.11,.19,.24), beneathWater);
        #include <opaque_fragment>
      `);
  };
  material.customProgramCacheKey = () => 'ferrum-surface-v5';
  return { material, uniforms };
}

function beveledBox(width, height, depth, bevel = .08) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2 + bevel, -height / 2);
  shape.lineTo(width / 2 - bevel, -height / 2);
  shape.quadraticCurveTo(width / 2, -height / 2, width / 2, -height / 2 + bevel);
  shape.lineTo(width / 2, height / 2 - bevel);
  shape.quadraticCurveTo(width / 2, height / 2, width / 2 - bevel, height / 2);
  shape.lineTo(-width / 2 + bevel, height / 2);
  shape.quadraticCurveTo(-width / 2, height / 2, -width / 2, height / 2 - bevel);
  shape.lineTo(-width / 2, -height / 2 + bevel);
  shape.quadraticCurveTo(-width / 2, -height / 2, -width / 2 + bevel, -height / 2);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: bevel * .7, bevelThickness: bevel * .7, curveSegments: 3 });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

function disposeTree(root) {
  const geometries = new Set(), materials = new Set();
  root.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    if (object.material) for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}

function createEnvironment(renderer) {
  const room = new THREE.Scene();
  room.background = new THREE.Color(.015, .018, .02);
  const box = new THREE.Mesh(new THREE.BoxGeometry(32, 24, 32), new THREE.MeshBasicMaterial({ color: 0x080b0d, side: THREE.BackSide }));
  room.add(box);
  const strip = (width, height, position, radiance) => {
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(...radiance), side: THREE.DoubleSide, toneMapped: false });
    const light = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    light.position.set(...position);
    light.lookAt(0, 0, 0);
    room.add(light);
  };
  strip(15, .48, [0, 5.0, -4], [5.4, 5.7, 5.9]);
  strip(10, .46, [-1, .4, 7], [1.6, 1.8, 1.9]);
  strip(.65, 9, [-7, 1.4, -.4], [1.1, 1.2, 1.3]);
  strip(.8, 8, [7, 1.0, 2], [2.6, 2.8, 3.0]);
  const generator = new THREE.PMREMGenerator(renderer);
  const target = generator.fromScene(room, .032, .1, 70, { size: 128 });
  generator.dispose();
  disposeTree(room);
  target.texture.name = 'Original four-strip photographic studio';
  return target;
}

function createForge(texture) {
  const group = new THREE.Group();
  group.name = 'Furnace / coal and refractory surfaces';
  const materials = [];
  const coalMaterial = new THREE.MeshStandardMaterial({ color: 0x171b1c, roughness: .88, metalness: .28, bumpMap: texture, bumpScale: .032, envMapIntensity: .025, transparent: true, opacity: 0, depthWrite: false });
  const glowUniform = { value: 0 };
  coalMaterial.onBeforeCompile = shader => {
    shader.uniforms.ferrumCoalHeat = glowUniform;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aCoalGlow;\nvarying float vCoalGlow;\nvarying float vCoalHeight;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCoalGlow=aCoalGlow;\nvCoalHeight=position.y/.22;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform float ferrumCoalHeat;\nvarying float vCoalGlow;\nvarying float vCoalHeight;').replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      float coalCrevice = pow(max(0., .39 - texture2D(bumpMap, vBumpMapUv).r) * 2.5, 3.);
      float footHeat = 1. - smoothstep(-.8, .08, vCoalHeight);
      totalEmissiveRadiance += vec3(3.6,.28,.012) * coalCrevice * footHeat * vCoalGlow * ferrumCoalHeat * .40;
    `);
  };
  coalMaterial.customProgramCacheKey = () => 'ferrum-coal-v3';
  materials.push(coalMaterial);
  const coalGeometry = new THREE.IcosahedronGeometry(.22, 2);
  const coalVertices = coalGeometry.attributes.position;
  for (let i = 0; i < coalVertices.count; i++) {
    const x = coalVertices.getX(i), y = coalVertices.getY(i), z = coalVertices.getZ(i);
    const organic = .88 + .13 * Math.sin(x * 23 + y * 17) * Math.cos(z * 31 - y * 19);
    coalVertices.setXYZ(i, x * organic, y * organic, z * organic);
  }
  coalGeometry.computeVertexNormals();
  // IcosahedronGeometry is nonindexed: average duplicated corner normals so
  // charcoal retains rounded broken surfaces instead of flat low-poly faces.
  const normalGroups = new Map(), coalNormals = coalGeometry.attributes.normal;
  for (let i = 0; i < coalVertices.count; i++) {
    const key = [coalVertices.getX(i), coalVertices.getY(i), coalVertices.getZ(i)].map(v => Math.round(v * 1e5)).join(',');
    let item = normalGroups.get(key);
    if (!item) { item = { sum: new THREE.Vector3(), indices: [] }; normalGroups.set(key, item); }
    item.sum.add(new THREE.Vector3(coalNormals.getX(i), coalNormals.getY(i), coalNormals.getZ(i)));
    item.indices.push(i);
  }
  for (const item of normalGroups.values()) { item.sum.normalize(); for (const i of item.indices) coalNormals.setXYZ(i, item.sum.x, item.sum.y, item.sum.z); }
  coalGeometry.setAttribute('aCoalGlow', new THREE.InstancedBufferAttribute(new Float32Array(Array.from({ length: 96 }, (_, i) => random(i + 773) > .68 ? .55 + random(i + 774) * .45 : .025)), 1));
  const coals = new THREE.InstancedMesh(coalGeometry, coalMaterial, 96);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 96; i++) {
    dummy.position.set((random(i + 11) - .5) * 7.7 + .7, -1.13 + random(i + 122) * .19, (random(i + 13) - .5) * 2.8);
    dummy.rotation.set(random(i + 21) * 2, random(i + 32) * 3, random(i + 4) * 2);
    dummy.scale.set(.65 + random(i + 6) * 1.25, .6 + random(i + 61) * .75, .70 + random(i + 9) * 1.15);
    dummy.updateMatrix();
    coals.setMatrixAt(i, dummy.matrix);
  }
  group.add(coals);
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x0b0c0b, roughness: 1, bumpMap: texture, bumpScale: .022, envMapIntensity: .018, transparent: true, opacity: 0, depthWrite: false });
  wallMaterial.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vCoalFloorUV;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvCoalFloorUV=uv;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vCoalFloorUV;').replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.a *= 1. - smoothstep(.16,.47,length(vCoalFloorUV-.5));');
  };
  wallMaterial.customProgramCacheKey = () => 'ferrum-coal-ground-v1';
  materials.push(wallMaterial);
  const base = new THREE.Mesh(new THREE.CircleGeometry(5.8, 64), wallMaterial);
  base.rotation.x = -Math.PI / 2;
  base.position.set(.7, -1.40, 0);
  group.add(base);
  return { group, materials, glowUniform };
}

function createAnvil(texture) {
  const group = new THREE.Group();
  group.name = 'Anvil and a single weighted hammer';
  const material = new THREE.MeshPhysicalMaterial({ color: 0x262d31, metalness: .89, roughness: .78, bumpMap: texture, bumpScale: .032, envMapIntensity: .18, transparent: true, opacity: 0, depthWrite: false });
  const topMaterial = material.clone();
  topMaterial.color.set(0x657074);
  topMaterial.roughness = .62;
  topMaterial.envMapIntensity = .48;
  const top = new THREE.Mesh(beveledBox(7.7, .44, 2.65, .11), topMaterial);
  top.position.set(.5, -.83, 0);
  const waist = new THREE.Mesh(beveledBox(4.65, 1.8, 2.25, .16), material);
  waist.position.set(.75, -1.94, -.05);
  const foot = new THREE.Mesh(beveledBox(6.8, .5, 3, .12), material);
  foot.position.set(.55, -3.05, 0);
  const hammerMaterial = material.clone();
  hammerMaterial.color.set(0x3d484e);
  hammerMaterial.roughness = .60;
  hammerMaterial.envMapIntensity = .30;
  const hammer = new THREE.Group();
  const head = new THREE.Mesh(beveledBox(1.95, 1.20, 1.95, .055), hammerMaterial);
  const face = new THREE.Mesh(beveledBox(1.69, .10, 1.73, .04), hammerMaterial);
  face.position.y = -.68;
  const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: .88, bumpMap: texture, bumpScale: .016, transparent: true, opacity: 0, depthWrite: false });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(.125, .16, 3.8, 12), handleMaterial);
  handle.position.y = 2.32;
  hammer.add(head, face, handle);
  const body = new THREE.Group();
  body.name = 'Anvil body / clear beneath the rotating metal';
  body.add(top, waist, foot);
  top.geometry.computeBoundingBox();
  const supportTop = top.position.y + top.geometry.boundingBox.max.y;
  group.add(body, hammer);
  return { group, body, supportTop, hammer, handle, materials: [material, hammerMaterial, handleMaterial, topMaterial] };
}

function createCooling() {
  const group = new THREE.Group();
  group.name = 'Cooling / a dark water surface and fine steam';
  const waterUniforms = { ferrumQuench: { value: 0 }, ferrumWaterTime: { value: 0 } };
  const material = new THREE.MeshPhysicalMaterial({ color: 0x14242b, roughness: .28, metalness: .52, envMapIntensity: .32, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, waterUniforms);
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vWaterUV;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWaterUV = uv;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec2 vWaterUV; uniform float ferrumQuench; uniform float ferrumWaterTime;
        float waterHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
        float waterNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
          return mix(mix(waterHash(i),waterHash(i+vec2(1.,0.)),f.x),mix(waterHash(i+vec2(0.,1.)),waterHash(i+vec2(1.)),f.x),f.y);}
      `)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        vec2 ripplePoint = (vWaterUV - .5) * vec2(16.,7.5);
        float rippleHeight = waterNoise(ripplePoint*vec2(1.1,7.2)+vec2(0.,ferrumWaterTime*.012))*.014
          + waterNoise(ripplePoint*vec2(2.7,17.))* .003;
        rippleHeight *= exp(-pow(ripplePoint.x/3.2,4.)-pow((ripplePoint.y+.18)/1.7,2.));
        vec3 waterDx = dFdx(-vViewPosition), waterDy = dFdy(-vViewPosition);
        vec3 waterR1 = cross(waterDy,normal), waterR2 = cross(normal,waterDx);
        float waterDet = dot(waterDx,waterR1);
        vec3 waterGradient = sign(waterDet)*(dFdx(rippleHeight)*waterR1+dFdy(rippleHeight)*waterR2);
        normal = normalize(abs(waterDet)*normal-waterGradient);
      `)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        vec2 waterPoint = (vWaterUV - .5) * vec2(16.,7.5);
        float fragmentNoise = waterNoise(vec2(waterPoint.x * 1.7,2.8));
        float bandOffset = sin(waterPoint.x*.74)*.065 + (waterNoise(waterPoint*1.3)-.5)*.055;
        float bandWidth = .040 + fragmentNoise*.065;
        float reflectedLine = exp(-pow((waterPoint.y-bandOffset)/bandWidth,2.)) * exp(-pow(waterPoint.x/2.30,4.));
        reflectedLine *= .05 + .95 * smoothstep(.38,.68,fragmentNoise);
        float softSheen = exp(-pow((waterPoint.y+.18)/1.48,2.)) * exp(-pow(waterPoint.x/2.6,4.));
        float reflectedFacet = .12 + .88*smoothstep(.30,.75,waterNoise(waterPoint*vec2(.90,5.4)+vec2(0.,ferrumWaterTime*.012)));
        reflectedFacet *= .38+.62*waterNoise(waterPoint*vec2(1.7,12.));
        float waterRadius = length(waterPoint*vec2(1.,1.15));
        float angle = atan(waterPoint.y,waterPoint.x);
        float wake = 0.;
        for(int i=0;i<3;i++){
          float fi=float(i);
          float radius=.72+fi*.56+ferrumQuench*.12;
          float distortion=sin(angle*3.+fi*1.7)*.065+(waterNoise(waterPoint*2.1)-.5)*.040;
          float sector=pow(max(0.,cos(angle-(-1.9+fi*.37))),5.);
          float broken=.18+.82*smoothstep(.31,.66,waterNoise(waterPoint*2.+fi*4.));
          wake+=exp(-pow((waterRadius-radius-distortion)/(.014+fi*.003),2.))*sector*broken*exp(-fi*.55);
        }
        // A shallow patch of broken reflections makes the horizontal surface
        // readable at a grazing view without a horizon line or closed rings.
        totalEmissiveRadiance += vec3(.070,.077,.080)*reflectedLine
          + vec3(.046,.051,.054)*softSheen*(.10+reflectedFacet)
          + vec3(.032,.035,.036)*wake;
      `)
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec2 waterEdge = abs(vWaterUV - .5);
        diffuseColor.a *= (1. - smoothstep(.23, .67, length(waterEdge)))
          * (1. - smoothstep(.32, .49, max(waterEdge.x, waterEdge.y)));
      `);
  };
  material.customProgramCacheKey = () => 'ferrum-water-v5';
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(16, 7.5), material);
  surface.rotation.x = -Math.PI / 2;
  surface.position.set(.5, -.40, 0);
  group.add(surface);
  const mistPositions = new Float32Array(28 * 3);
  const sizes = new Float32Array(28);
  for (let i = 0; i < 28; i++) {
    const rise = random(i * 13 + 8);
    mistPositions[i * 3] = (random(i * 17) - .5) * (.8 + rise * 1.0);
    mistPositions[i * 3 + 1] = .08 + rise * .75;
    mistPositions[i * 3 + 2] = (random(i * 21 + 8) - .5) * .65;
    sizes[i] = .50 + random(i * 41 + 9) * .85;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(mistPositions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  const mistMaterial = new THREE.ShaderMaterial({
    uniforms: { opacity: { value: 0 }, time: { value: 0 }, pixelScale: { value: 600 } },
    vertexShader: `attribute float size; uniform float time; uniform float pixelScale; varying float vSeed;
      void main() { vec3 p = position; p.x += sin(time*.12 + p.y*7.)*.06; p.y += sin(time*.10+p.x)*.045;
        vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp(size*pixelScale / -mv.z,1.,220.); vSeed=position.x*7.; }`,
    fragmentShader: `uniform float opacity; varying float vSeed;
      void main() { vec2 p=gl_PointCoord-.5; float d=length(p*vec2(1.,1.2));
        float cloud=.65+.35*sin(p.x*13.+vSeed)*sin(p.y*9.-vSeed);
        float a=pow(max(0.,1.-d*2.),2.4)*opacity*cloud;
        gl_FragColor=vec4(.61,.68,.71,a); }`,
    transparent: true, depthWrite: false, blending: THREE.NormalBlending,
  });
  const mist = new THREE.Points(geometry, mistMaterial);
  mist.frustumCulled = false;
  group.add(mist);
  return { group, surface, mist, material, mistMaterial, waterUniforms };
}

function createSparkTrails() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(128 * 6), 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(128 * 6), 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setDrawRange(0, 0);
  const material = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .96, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const lines = new THREE.LineSegments(geometry, material);
  lines.frustumCulled = false;
  lines.name = 'Two deterministic showers of directional sparks';
  return { lines, geometry, material };
}

function createDust() {
  const positions = new Float32Array(33 * 3);
  for (let i = 0; i < 33; i++) {
    positions[i * 3] = (random(i + 404) - .5) * 13;
    positions[i * 3 + 1] = (random(i + 819) - .5) * 5.1;
    positions[i * 3 + 2] = (random(i + 533) - .5) * 6;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0xa09b8c, size: .016, sizeAttenuation: true, transparent: true, opacity: .18, depthWrite: false });
  return new THREE.Points(geometry, material);
}

function createGround(texture) {
  const material = new THREE.MeshPhysicalMaterial({ color: 0x12191c, roughness: .74, metalness: .73, bumpMap: texture, bumpScale: .026, envMapIntensity: .045, transparent: true, opacity: 1, depthWrite: false });
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vGroundUV;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvGroundUV = uv;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vGroundUV;').replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.a *= 1. - smoothstep(.12, .5, length(vGroundUV - .5));');
  };
  material.customProgramCacheKey = () => 'ferrum-floor-v1';
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(18, 14), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(1, -1.4, 0);
  mesh.name = 'A dark photographic ground with a soft edge';
  return { mesh, material };
}

function createContactShadow() {
  const material = new THREE.ShaderMaterial({
    uniforms: { opacity: { value: 0 } },
    vertexShader: 'varying vec2 vShadowUV; void main(){ vShadowUV=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `varying vec2 vShadowUV; uniform float opacity;
      void main(){ vec2 p=vShadowUV-.5; float d=length(vec2(max(abs(p.x)-.27,0.),p.y*1.4));
        float a=exp(-d*d*66.)*opacity; gl_FragColor=vec4(0.,0.,0.,a); }`,
    transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(10.7, 3.1), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.name = 'Soft contact beneath the same metal';
  mesh.renderOrder = 1;
  return { mesh, material };
}

function createWarmHalo() {
  const material = new THREE.ShaderMaterial({
    uniforms: { opacity: { value: 0 } },
    vertexShader: 'varying vec2 vHaloUV; void main(){vHaloUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec2 vHaloUV; uniform float opacity;
      void main(){float d=length((vHaloUV-.5)*vec2(1.,1.25));
        float a=exp(-d*d*12.)*(1.-smoothstep(.15,.50,d))*opacity;
        gl_FragColor=vec4(1.,.16,.012,a);}`,
    transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.7), material);
  mesh.name = 'Small heat halo, occluded by the physical metal';
  return { mesh, material };
}

/** No RAF lives here. The controller evaluates and renders all motion once. */
export function createScene(canvas, { onReady, onContextLost, onContextRestored, onError } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  } catch (error) { onError?.(error); throw error; }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .88;
  renderer.setClearColor(0x070a0a, 0);
  const scene = new THREE.Scene();
  const world = new THREE.Group();
  scene.add(world);
  const camera = new THREE.PerspectiveCamera(30, 1, .08, 100);
  const texture = surfaceTexture();
  const surface = metalMaterial(texture);
  const metal = new THREE.Mesh(createMetalGeometry(), surface.material);
  metal.name = 'The same piece of metal';
  metal.frustumCulled = false;
  world.add(metal);
  const ground = createGround(texture);
  const contactShadow = createContactShadow();
  const warmHalo = createWarmHalo();
  world.add(ground.mesh, contactShadow.mesh, warmHalo.mesh);
  const key = new THREE.DirectionalLight(0xe4f1f8, 2.0);
  key.position.set(-3.6, 5, 4.5);
  const rim = new THREE.DirectionalLight(0xf3f4ee, 1.8);
  rim.position.set(3, 2.1, -5);
  const warm = new THREE.PointLight(0xff5820, 0, 10, 2);
  const furnaceLight = new THREE.PointLight(0xff470e, 0, 12, 2);
  furnaceLight.position.set(.4, -.35, -1.1);
  const ambient = new THREE.HemisphereLight(0x425361, 0x10100d, .08);
  // A finite source gives the broad steel planes a spatially fading highlight.
  // It is placed from the actual view and normal, including portrait framing.
  const grazing = new THREE.SpotLight(0xe6f0f7, 0, 15, .37, .90, 2);
  const toolFill = new THREE.PointLight(0xc4b0a0, 0, 12, 2);
  scene.add(key, rim, warm, furnaceLight, ambient, grazing, grazing.target, toolFill);
  const sparks = createSparkTrails();
  const dust = createDust();
  world.add(sparks.lines, dust);

  let forge = null, anvil = null, cooling = null;
  const detailMaps = {}, detailTextures = new Set(), requestedDetails = new Set(), detailFailures = new Set();
  let environmentTarget = null, environmentPending = true;
  let width = 1, height = 1, quality = 'high', dpr = 1;
  let ready = false, lost = false, disposed = false, restoring = false;
  let frameCount = 0, lastState = null, lastOptions = {}, activeParticles = 0, shaderError = null;
  const lookAt = new THREE.Vector3();
  const lightFocus = new THREE.Vector3(), viewDirection = new THREE.Vector3();
  const surfaceNormal = new THREE.Vector3(), reflectedView = new THREE.Vector3();
  const coolingAxis = new THREE.Vector3();
  const floorRotation = new THREE.Matrix4();

  function bindEnvironment(root) {
    root.traverse(object => {
      const materials = object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
      for (const material of materials) {
        if (!material.isMeshStandardMaterial || material.envMap === environmentTarget.texture) continue;
        // Three r186 replaces material intensity with scene.environmentIntensity
        // when envMap is null. Explicit binding keeps the floor and oxide dark.
        material.envMap = environmentTarget.texture;
        material.needsUpdate = true;
      }
    });
  }
  function requestDetail(kind) {
    if (requestedDetails.has(kind) || disposed) return;
    requestedDetails.add(kind);
    const path = `${import.meta.env.BASE_URL}ferrum/assets/textures/${kind}-steel.webp`;
    new THREE.TextureLoader().load(path, loaded => {
      if (disposed) { loaded.dispose(); return; }
      loaded.wrapS = loaded.wrapT = THREE.MirroredRepeatWrapping;
      loaded.anisotropy = 4;
      loaded.name = `Original ${kind} material study / imagegen`;
      detailMaps[kind] = loaded;
      detailTextures.add(loaded);
      if (kind === 'forged') {
        surface.uniforms.ferrumForgedMap.value = loaded;
        surface.uniforms.ferrumDetailReady.value = 1;
        ground.material.bumpMap = loaded;
        for (const set of [forge, anvil]) if (set) for (const material of set.materials) if (material.bumpMap) material.bumpMap = loaded;
      } else surface.uniforms.ferrumPolishedMap.value = loaded;
    }, undefined, () => {
      // The generated procedural material is a complete local fallback.
      detailFailures.add(kind);
    });
  }
  requestDetail('forged');
  renderer.debug.onShaderError = (gl, program) => {
    shaderError = new Error(`FERRUM material could not compile: ${gl.getProgramInfoLog(program) || 'unknown shader error'}`);
  };

  const contextLost = event => {
    event.preventDefault(); lost = true;
    // Retire the PMREM while its context is still lost. Three replaces its
    // resource caches on restore; late disposal would delete old GPU handles.
    environmentTarget?.dispose();
    environmentTarget = null;
    scene.environment = null;
    environmentPending = true;
    onContextLost?.();
  };
  const contextRestored = () => {
    lost = false; restoring = true; environmentPending = true; shaderError = null;
    texture.needsUpdate = true;
    // Render before releasing the poster. This also works when the controller
    // deliberately suspends updates throughout context loss.
    if (lastState) {
      try { update(lastState, lastOptions); } catch { /* update already reports the failure */ }
    } else { restoring = false; onContextRestored?.(); }
  };
  canvas.addEventListener('webglcontextlost', contextLost, false);
  canvas.addEventListener('webglcontextrestored', contextRestored, false);

  function resize(nextWidth, nextHeight, nextQuality = quality) {
    if (disposed) return;
    width = Math.max(1, Math.round(nextWidth || 1));
    height = Math.max(1, Math.round(nextHeight || 1));
    quality = nextQuality === 'low' ? 'low' : 'high';
    const portrait = width / height < .85;
    const hardwareDpr = Math.max(1, globalThis.devicePixelRatio || 1);
    const cap = quality === 'low' ? 1 : portrait ? 1.25 : 1.5;
    const pixelBudget = quality === 'low' ? 1_800_000 : 4_200_000;
    dpr = Math.min(hardwareDpr, cap, Math.sqrt(pixelBudget / (width * height)));
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function update(state, options = {}) {
    if (disposed) return;
    lastState = state;
    lastOptions = options;
    if (lost) return;
    try {
      if (options.width && (options.width !== width || options.height !== height || (options.quality && options.quality !== quality))) resize(options.width, options.height, options.quality);
      else if (options.quality && options.quality !== quality) resize(width, height, options.quality);
      if (state.index >= 3) requestDetail('polished');
      const reducedMotion = !!(options.reducedMotion || state.reducedMotion);
      const time = reducedMotion ? 0 : (Number.isFinite(options.time) ? options.time : 0);
      const pointer = reducedMotion ? { x: 0, y: 0 } : options.pointer || { x: 0, y: 0 };
      const portrait = 1 - smoothstep(.65, 1.20, width / height);
      const scale = lerp(1, state.portrait.scale, portrait);
      world.scale.setScalar(scale);
      world.position.y = state.portrait.worldY * portrait;

      if (environmentPending) {
        environmentTarget?.dispose();
        environmentTarget = createEnvironment(renderer);
        scene.environment = environmentTarget.texture;
        bindEnvironment(world);
        environmentPending = false;
      }
      // Current + immediately needed sets are built once; no network gate exists.
      if (!forge && state.lights.furnace > .002) { forge = createForge(detailMaps.forged || texture); world.add(forge.group); bindEnvironment(forge.group); }
      if (!anvil && state.lights.strike > .002) { anvil = createAnvil(detailMaps.forged || texture); world.add(anvil.group); bindEnvironment(anvil.group); }
      if (!cooling && state.lights.cooling > .002) { cooling = createCooling(); world.add(cooling.group); bindEnvironment(cooling.group); }

      const [px, py, pz] = state.object.position;
      metal.position.set(px * lerp(1, .10, portrait), py, pz);
      metal.rotation.set(...state.object.rotation.map((angle, i) => lerp(angle, state.portrait.rotation[i], portrait)));
      metal.scale.set(...state.object.scale);
      metal.morphTargetInfluences[0] = state.shape;
      surface.uniforms.ferrumHeat.value = state.heat;
      surface.uniforms.ferrumPolish.value = state.polish;
      surface.uniforms.ferrumOxide.value = state.oxide;
      surface.uniforms.ferrumHotspot.value = lerp(.67, .5 + state.hammer.contactX / lerp(5.55, 9.65, state.shape), state.lights.strike);
      const waterLevel = lerp(-.85, -2.5, portrait);
      surface.uniforms.ferrumCooling.value = state.lights.cooling;
      surface.uniforms.ferrumWaterLevel.value = waterLevel * scale + world.position.y;
      surface.material.roughness = lerp(.42, .20, state.polish);
      surface.material.bumpScale = lerp(.024, .0025, state.polish);
      const hotStage = clamp(state.lights.furnace + state.lights.strike);
      const coldWeight = 1 - hotStage * .90;
      surface.material.envMapIntensity = lerp(.76, .25, state.polish) * coldWeight;
      surface.material.envMapRotation.set(.08 + portrait * .12, state.reflection * .65 + clamp(pointer.x || 0, -1, 1) * .045, portrait * .72);
      renderer.toneMappingExposure = .88;

      const cameraPosition = state.camera.position;
      camera.position.set(...cameraPosition.map((value, i) => lerp(value, state.portrait.camera[i], portrait)));
      const target = state.camera.target;
      lookAt.set(...target.map((value, i) => lerp(value, state.portrait.target[i], portrait)));
      camera.fov = lerp(state.camera.fov, state.portrait.fov, portrait);
      camera.lookAt(lookAt);
      camera.updateProjectionMatrix();
      key.position.x = -3.6 + state.reflection * 2 + clamp(pointer.x || 0, -1, 1) * .50;
      key.position.y = 5 + clamp(pointer.y || 0, -1, 1) * .30;
      key.intensity = .65 * coldWeight;
      rim.intensity = lerp(.55, .85, state.lights.reveal) * coldWeight;
      ambient.intensity = .045 * coldWeight;
      world.updateMatrixWorld(true);
      lightFocus.set(lerp(-.8, 1.0, (state.reflection + 1) * .5) + clamp(pointer.x || 0, -1, 1) * .55, lerp(.5, .13, state.shape), -.1).applyMatrix4(metal.matrixWorld);
      surfaceNormal.set(0, lerp(.99, .953, state.polish), lerp(.14, .303, state.polish)).transformDirection(metal.matrixWorld);
      viewDirection.copy(camera.position).sub(lightFocus).normalize();
      reflectedView.copy(surfaceNormal).multiplyScalar(2 * viewDirection.dot(surfaceNormal)).sub(viewDirection).normalize();
      grazing.position.copy(lightFocus).addScaledVector(reflectedView, 4.8);
      grazing.target.position.copy(lightFocus);
      grazing.intensity = lerp(50, 48, state.lights.reveal) * coldWeight;
      grazing.angle = lerp(.44, .22, state.lights.reveal);
      const breath = reducedMotion ? 1 : 1 + Math.sin(time * 1.40) * .018 + Math.sin(time * 2.11) * .009;
      warm.position.set(metal.position.x + lerp(.65, state.hammer.contactX, state.lights.strike), metal.position.y + .55, .65).applyMatrix4(world.matrixWorld);
      warm.intensity = state.heat * state.heat * 6.0 * breath * hotStage;
      furnaceLight.position.set(.4, -.35, -1.1).applyMatrix4(world.matrixWorld);
      furnaceLight.intensity = state.lights.furnace * 8.0 * breath;
      warmHalo.mesh.visible = hotStage > .001;
      warmHalo.mesh.position.set((surface.uniforms.ferrumHotspot.value - .5) * lerp(5.55, 9.65, state.shape), 0, 0).applyMatrix4(metal.matrix);
      warmHalo.mesh.quaternion.copy(camera.quaternion);
      warmHalo.material.uniforms.opacity.value = state.heat * state.heat * hotStage * .16 * breath;
      const groundWeight = (1 - state.lights.furnace) * (1 - state.lights.strike) * (1 - state.lights.cooling) * (1 - state.lights.reveal);
      ground.mesh.visible = groundWeight > .001;
      ground.material.opacity = groundWeight;
      floorRotation.makeRotationFromEuler(metal.rotation);
      const r = floorRotation.elements;
      const rawPositions = metal.geometry.attributes.position.array;
      const finalPositions = metal.geometry.morphAttributes.position[0].array;
      let lowestY = Infinity, contactX = metal.position.x, contactZ = metal.position.z;
      // The portrait object can stand diagonally. Find its actual lowest point
      // so no photographic ground plane can cut through the persistent mesh.
      for (let i = 0; i < rawPositions.length; i += 3) {
        const x = lerp(rawPositions[i], finalPositions[i], state.shape) * metal.scale.x;
        const y = lerp(rawPositions[i + 1], finalPositions[i + 1], state.shape) * metal.scale.y;
        const z = lerp(rawPositions[i + 2], finalPositions[i + 2], state.shape) * metal.scale.z;
        const worldY = r[1] * x + r[5] * y + r[9] * z + metal.position.y;
        if (worldY < lowestY) {
          lowestY = worldY;
          contactX = r[0] * x + r[4] * y + r[8] * z + metal.position.x;
          contactZ = r[2] * x + r[6] * y + r[10] * z + metal.position.z;
        }
      }
      ground.mesh.position.y = lowestY - .025;
      contactShadow.mesh.visible = groundWeight > .001;
      contactShadow.material.uniforms.opacity.value = groundWeight * lerp(.69, .45, portrait);
      contactShadow.mesh.position.set(lerp(metal.position.x, contactX, portrait), ground.mesh.position.y + .016, lerp(metal.position.z, contactZ, portrait));
      contactShadow.mesh.rotation.set(-Math.PI / 2, 0, -metal.rotation.y);
      contactShadow.mesh.scale.set(lerp(lerp(.68, 1, state.shape), .27, portrait), lerp(1, .55, portrait), 1);

      if (forge) {
        forge.group.visible = state.lights.furnace > .001;
        for (const material of forge.materials) material.opacity = state.lights.furnace;
        forge.materials[0].depthWrite = state.lights.furnace > .995;
        forge.glowUniform.value = state.lights.furnace * .92 * breath;
      }
      if (anvil) {
        anvil.group.visible = state.lights.strike > .001;
        // Withdraw the body below the complete rotated form during the handoff.
        // A thickness-only support is valid only while the metal is horizontal.
        anvil.body.position.y = Math.min(0, lowestY - anvil.supportTop - .008);
        for (const material of anvil.materials) { material.opacity = state.lights.strike; material.depthWrite = state.lights.strike > .995; }
        anvil.hammer.position.set(metal.position.x + state.hammer.contactX, state.hammer.contactY + .73 + state.hammer.height * lerp(1, .40, portrait), 0);
        anvil.hammer.rotation.z = state.hammer.tilt;
        anvil.handle.scale.y = lerp(1, .12, portrait);
        anvil.handle.position.y = lerp(2.32, .80, portrait);
        anvil.materials[0].envMapIntensity = .22;
        anvil.materials[1].envMapIntensity = .50;
        toolFill.position.set(anvil.hammer.position.x - 2.0, anvil.hammer.position.y + .8, 3.8).applyMatrix4(world.matrixWorld);
      }
      toolFill.intensity = state.lights.strike * 28 * scale * scale;
      if (cooling) {
        cooling.group.visible = state.lights.cooling > .001;
        cooling.material.opacity = state.water * .74;
        coolingAxis.set(1, 0, 0).applyEuler(metal.rotation);
        const intercept = Math.abs(coolingAxis.y) > .08 ? clamp((waterLevel - metal.position.y) / coolingAxis.y, -4.5, 4.5) : 0;
        cooling.surface.position.set(metal.position.x + coolingAxis.x * intercept, waterLevel, metal.position.z + coolingAxis.z * intercept);
        cooling.mist.position.copy(cooling.surface.position);
        cooling.waterUniforms.ferrumQuench.value = state.quench;
        cooling.waterUniforms.ferrumWaterTime.value = time;
        cooling.mistMaterial.uniforms.opacity.value = state.mist * (quality === 'low' ? .16 : .22);
        cooling.mistMaterial.uniforms.time.value = time;
        cooling.mistMaterial.uniforms.pixelScale.value = height * dpr * .82;
      }

      const particles = reducedMotion ? [] : sampleStrikeParticles(state, quality === 'low' ? 18 : 34);
      activeParticles = particles.length;
      const positions = sparks.geometry.attributes.position.array;
      const colors = sparks.geometry.attributes.color.array;
      const mobileOffset = metal.position.x - state.object.position[0];
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i], offset = i * 6;
        positions.set(p.previous, offset); positions.set(p.position, offset + 3);
        positions[offset] += mobileOffset; positions[offset + 3] += mobileOffset;
        const a = p.brightness;
        colors.set([a * .15, a * .022, 0, a * 2.6, a * .80, a * .13], offset);
      }
      sparks.geometry.attributes.position.needsUpdate = true;
      sparks.geometry.attributes.color.needsUpdate = true;
      sparks.geometry.setDrawRange(0, particles.length * 2);
      sparks.lines.visible = particles.length > 0;
      dust.visible = !reducedMotion && quality !== 'low';
      dust.material.opacity = .13 + state.lights.furnace * .06;
      dust.rotation.y = Math.sin(time * .016) * .05;
      dust.position.y = Math.sin(time * .038) * .08;

      renderer.render(scene, camera);
      if (shaderError) throw shaderError;
      frameCount++;
      if (!ready) { ready = true; onReady?.(); }
      if (restoring) { restoring = false; onContextRestored?.(); }
    } catch (error) {
      onError?.(error);
      throw error;
    }
  }

  function getStats() {
    return {
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      points: renderer.info.render.points,
      lines: renderer.info.render.lines,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
      programs: renderer.info.programs?.length || 0,
      width, height, dpr: Math.round(dpr * 1000) / 1000, quality,
      ready, contextLost: lost, frameCount, activeParticles,
      metalVertices: metal.geometry.attributes.position.count,
      detailMaps: Object.keys(detailMaps),
      detailFailures: [...detailFailures],
      act: lastState?.act.id || 'before-form',
    };
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    canvas.removeEventListener('webglcontextlost', contextLost);
    canvas.removeEventListener('webglcontextrestored', contextRestored);
    disposeTree(scene);
    texture.dispose();
    for (const detail of detailTextures) detail.dispose();
    environmentTarget?.dispose();
    renderer.dispose();
  }

  return { update, resize, dispose, getStats };
}
