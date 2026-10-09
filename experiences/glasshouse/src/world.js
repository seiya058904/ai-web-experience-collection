import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { createEnvironment, createGlassMaterial, createAtmosphereFloor, createLightBeam } from './optics.js';
import { layeredGlass, createOpticalPass } from './optical-pass.js';
import { createTypePlane } from './type-plane.js';
import { atmosphereGLSL } from './atmosphere.js';
import { isPortraitComposition } from './framing.js';
import { PRISM, prismHullPlanes, prismBeamPorts } from './optical-volume.js';
const focusedLightUrl = `${import.meta.env.BASE_URL}glasshouse/media/focused-light.png`;
import { mix, smooth, clamp } from './journey.js';

const FLOOR = -2.3;
const ZERO = [0, 0, 0, 0.001, 0.001, 0.001, 0, 0, 0];
// x, y, z, width, height, thickness, Euler x/y/z. The same eight physical
// panes persist through all six studies. There are no scene swaps.
const POSES = [
  [
    [-1.55, 0.17, 0.7, 3.45, 4.94, 0.40, 0, -0.53, 0.03],
    [2.26, 0.67, -0.7, 3.4, 5.94, 0.42, 0, -0.68, -0.035],
    [4.02, -0.80, 1.25, 4.1, 3.0, 0.35, 0, 0.22, 0.07],
    ZERO, ZERO, ZERO, ZERO, ZERO
  ],
  [
    [-0.16, 0.22, 0.3, 2.0, 5.04, 0.25, 0, -0.25, 0],
    [2.24, 0.22, 0.5, 2.0, 5.04, 0.30, 0, -0.25, 0],
    [4.58, 0.22, -0.65, 2.0, 5.04, 0.22, 0, -0.25, 0],
    ZERO, ZERO, ZERO, ZERO, ZERO
  ],
  [
    [2.9 - 1.21 * Math.cos(.52), .45, .1 - 1.21 * Math.sin(.52), .02, Math.hypot(2.42, 5.3), .16, 0, -.52, -Math.atan2(2.42, 5.3)],
    [2.9 + 1.21 * Math.cos(.52), .45, .1 + 1.21 * Math.sin(.52), .02, Math.hypot(2.42, 5.3), .16, 0, -.52, Math.atan2(2.42, 5.3)],
    [2.9, -2.2, .1, 4.84, .02, .16, 0, -.52, 0],
    ZERO, ZERO, ZERO, ZERO, ZERO
  ],
  [
    [0.75, 0.35, 1.35, 1.90, 5.30, 0.13, 0, -0.26, 0],
    [2.42, 0.35, -0.60, 1.82, 5.30, 0.13, 0, -0.26, 0],
    [4.06, 0.35, -2.55, 1.70, 5.30, 0.13, 0, -0.26, 0],
    [5.4, 0.35, -4.5, 1.60, 5.30, 0.13, 0, -0.26, 0],
    [6.7, 0.35, -6.5, 1.50, 5.30, 0.13, 0, -0.26, 0],
    ZERO, ZERO, ZERO
  ],
  [
    [3.65, 0.35, 2.10, 3.65, 5.30, 0.21, 0, -0.42, 0],
    [2.95, 0.35, 0.65, 3.65, 5.30, 0.20, 0, -0.37, 0],
    [2.25, 0.35, -0.80, 3.65, 5.30, 0.19, 0, -0.32, 0],
    [1.55, 0.35, -2.25, 3.65, 5.30, 0.18, 0, -0.27, 0],
    [0.85, 0.35, -3.70, 3.65, 5.30, 0.17, 0, -0.22, 0],
    [0.15, 0.35, -5.15, 3.65, 5.30, 0.16, 0, -0.17, 0],
    [-0.55, 0.35, -6.60, 3.65, 5.30, 0.15, 0, -0.12, 0],
    [-1.25, 0.35, -8.05, 3.65, 5.30, 0.14, 0, -0.07, 0]
  ],
  [
    [-0.15, 0.28, -0.9, 4.9, 5.10, 0.13, 0, Math.PI / 2, 0],
    [1.05, 0.28, -0.9, 4.9, 5.10, 0.13, 0, Math.PI / 2, 0],
    [2.25, 0.28, -0.9, 4.9, 5.10, 0.13, 0, Math.PI / 2, 0],
    [3.45, 0.28, -0.9, 4.9, 5.10, 0.13, 0, Math.PI / 2, 0],
    [4.65, 0.28, -0.9, 4.9, 5.10, 0.13, 0, Math.PI / 2, 0],
    [5.85, 0.28, -0.9, 4.9, 5.10, 0.13, 0, Math.PI / 2, 0],
    [2.85, 0.28, -3.35, 7.9, 5.10, 0.12, 0, 0, 0],
    [2.85, 2.90, -0.9, 8.0, 6.0, 0.14, Math.PI / 2, 0, 0]
  ]
];

const CAMERAS = [
  { p: [0.45, -0.30, 13.1], t: [0.05, 0.25, 0], f: 37 },
  { p: [0.50, 0.50, 12.8], t: [0.30, -0.03, -0.2], f: 37 },
  { p: [0.45, 0.20, 13.8], t: [0.15, -0.08, 0], f: 38 },
  { p: [0.15, 0.25, 12.6], t: [0.60, 0.55, -2.4], f: 39 },
  { p: [0.25, 0.40, 13.0], t: [0.05, 0.65, -2.8], f: 39 },
  { p: [8.8, 0.40, 13.8], t: [0.5, 0.75, -0.1], f: 38 }
];

const MOBILE_CAMERAS = [
  { p: [0.45, 2.20, 18.6], t: [1.85, 0.85, 0], f: 43 },
  { p: [0.20, 2.4, 20.5], t: [2.1, -0.6, -0.4], f: 41 },
  { p: [0.55, 1.2, 18.0], t: [2.85, -1.30, -0.3], f: 40 },
  { p: [-0.4, 1.8, 18.5], t: [2.2, -0.1, -2.0], f: 40 },
  { p: [-0.25, 2.1, 18.8], t: [1.8, -0.25, -2.3], f: 40 },
  { p: [12.4, 1.8, 25.0], t: [2.5, -2.25, -0.5], f: 40 }
];

const edgeVertex = `
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;
const edgeFragment = `
  uniform float uTime;
  uniform float uDark;
  uniform float uAlpha;
  uniform float uWedge;
  uniform float uLife;
  varying vec3 vWorld;
  void main() {
    float moving = pow(max(0., sin(vWorld.y * .85 + vWorld.x * .2 - uTime * .24)), 15.);
    vec3 edge = mix(vec3(.13,.25,.29), vec3(.61,.72,.74), uDark);
    edge += vec3(moving * .07);
    gl_FragColor = vec4(edge, (uAlpha + moving * .025) * uLife);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function makeWord(text, { color = '#182126', weight = 400 } = {}) {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 512;
  const ctx = c.getContext('2d');
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const material = new THREE.MeshBasicMaterial({ map: texture, alphaTest: .001, transparent: true, depthWrite: false, opacity: 1 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(13.2, 3.3), material);
  mesh.userData.texture = texture;
  mesh.userData.redraw = () => {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = color;
    ctx.font = `${weight} 390px Manrope, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const metric = ctx.measureText(text);
    const fit = Math.min(1, 1990 / Math.max(1, metric.width));
    const inkValue = (name, fallback) => Number.isFinite(metric[name]) ? metric[name] : fallback;
    mesh.userData.ink = {
      left: ((1024 - inkValue('actualBoundingBoxLeft', metric.width / 2) * fit) / 2048 - .5) * 13.2,
      right: ((1024 + inkValue('actualBoundingBoxRight', metric.width / 2) * fit) / 2048 - .5) * 13.2,
      top: (.5 - (280 - inkValue('actualBoundingBoxAscent', 195)) / 512) * 3.3,
      bottom: (.5 - (280 + inkValue('actualBoundingBoxDescent', 195)) / 512) * 3.3
    };
    ctx.fillText(text, 1024, 280, 1990);
    texture.needsUpdate = true;
  };
  mesh.userData.redraw();
  return mesh;
}

export function createWorld(canvas, initial = {}) {
  let disposed = false;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.transmissionResolutionScale = 0.68;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setSize(innerWidth, innerHeight, false);
  const scene = new THREE.Scene();
  const bg = new THREE.Color('#e6e9ed');
  const bright = new THREE.Color('#e6e9ed');
  const dark = new THREE.Color('#11161a');
  scene.background = bg;
  scene.fog = new THREE.Fog(bg, 36, 98);
  const camera = new THREE.PerspectiveCamera(37, 1, 0.15, 150);
  const target = new THREE.Vector3();
  const environment = createEnvironment(renderer);
  scene.environment = environment.texture;
  scene.environmentIntensity = 1;
  // This optional projection enriches an already usable analytic light field.
  // It must not freeze the installation at its first frame while loading.
  const lightChanged = () => { if (!disposed) initial.onInvalidate?.(); };
  const lightTexture = new THREE.TextureLoader().load(focusedLightUrl, lightChanged, undefined, lightChanged);
  lightTexture.colorSpace = THREE.SRGBColorSpace;
  lightTexture.anisotropy = 4;

  const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: {
      uDark: { value: 0 },
      uPale: { value: bright.clone() },
      uNight: { value: dark.clone() },
      uSilver: { value: new THREE.Color('#8297a7') },
      uWhite: { value: new THREE.Color('#f6f7f7') }
    },
    vertexShader: `varying vec2 vUv; void main(){vUv=uv; gl_Position=vec4(position.xy,.99999,1.);}`,
    fragmentShader: `varying vec2 vUv; uniform float uDark; uniform vec3 uPale;
      uniform vec3 uNight; uniform vec3 uSilver; uniform vec3 uWhite;
      ${atmosphereGLSL}
      void main(){
        vec3 color=sampleAtmosphere(vUv,uDark,uPale,uNight,uSilver,uWhite);
        gl_FragColor=vec4(color,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    depthTest: false,
    depthWrite: false
  }));
  sky.frustumCulled = false;
  sky.renderOrder = -100;
  scene.add(sky);

  const key = new THREE.DirectionalLight('#fff9ec', 3.5);
  key.position.set(-4, 10, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -12;
  key.shadow.camera.right = 12;
  key.shadow.camera.top = 10;
  key.shadow.camera.bottom = -10;
  key.shadow.normalBias = 0.02;
  key.shadow.bias = -0.0001;
  scene.add(key);
  const fill = new THREE.DirectionalLight('#c4dce8', 1.5);
  fill.position.set(6, 3, -3);
  scene.add(fill);
  const hemi = new THREE.HemisphereLight('#edf4ff', '#7e8993', 1.0);
  scene.add(hemi);
  key.layers.enableAll();
  fill.layers.enableAll();
  hemi.layers.enableAll();

  const floor = createAtmosphereFloor({ lightTexture });
  scene.add(floor.mesh);
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ color: '#293c46', opacity: 0.14 }));
  catcher.rotation.x = -Math.PI / 2;
  catcher.position.y = FLOOR + 0.005;
  catcher.receiveShadow = true;
  scene.add(catcher);

  const geometry = new RoundedBoxGeometry(3, 5, 0.26, 4, 0.052);
  const edgeGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(3.001, 5.001, 0.261));
  const panes = [];
  const materials = [];
  const edges = [];
  const reflectionRoot = new THREE.Group();
  reflectionRoot.position.y = FLOOR * 2;
  reflectionRoot.scale.y = -1;
  const groundMirrors = [];
  const groundMaterial = new THREE.MeshPhysicalMaterial({ color: '#9aaebc', metalness: .80, roughness: .20, envMapIntensity: .9, transparent: true, opacity: .18, depthWrite: false, depthTest: false });
  groundMaterial.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying float vReflectedHeight;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvReflectedHeight=(modelMatrix*vec4(transformed,1.)).y;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vReflectedHeight;')
      .replace('#include <opaque_fragment>', '#include <opaque_fragment>\ngl_FragColor.a*=exp(-abs(vReflectedHeight+2.3)*1.15);');
  };
  const shadowPlanes = [];
  for (let i = 0; i < 8; i++) {
    const material = layeredGlass(createGlassMaterial({ thickness: 0.5, color: 0xffffff }));
    material.userData.optical.tOpticGobo.value = lightTexture;
    const group = new THREE.Group();
    const paneGeometry = geometry.clone();
    const wedgeGeometry = geometry.clone();
    const positions = wedgeGeometry.attributes.position;
    const normals = wedgeGeometry.attributes.normal;
    const transformedNormal = new THREE.Vector3();
    for (let j = 0; j < positions.count; j++) {
      const x = positions.getX(j), y = positions.getY(j);
      const k = .22 + .78 * (1.5 - x) / 3;
      transformedNormal.fromBufferAttribute(normals, j);
      transformedNormal.x += .26 * (y + 2.5) / k * transformedNormal.y;
      transformedNormal.y /= k;
      transformedNormal.normalize();
      normals.setXYZ(j, transformedNormal.x, transformedNormal.y, transformedNormal.z);
      positions.setY(j, -2.5 + (y + 2.5) * k);
    }
    paneGeometry.morphAttributes.position = [wedgeGeometry.attributes.position.clone()];
    paneGeometry.morphAttributes.normal = [wedgeGeometry.attributes.normal.clone()];
    wedgeGeometry.dispose();
    const mesh = new THREE.Mesh(paneGeometry, material);
    mesh.layers.set(i + 1);
    mesh.renderOrder = 2 + i;
    group.add(mesh);
    const edge = new THREE.LineSegments(edgeGeometry, new THREE.ShaderMaterial({
      vertexShader: edgeVertex.replace('varying vec3 vWorld;', 'varying vec3 vWorld; uniform float uWedge;').replace('vec4 world = modelMatrix * vec4(position, 1.0);', `vec3 p=position;
        p.y=mix(p.y,-2.5+(p.y+2.5)*(.22+.78*(1.5-p.x)/3.),uWedge);
        vec4 world=modelMatrix*vec4(p,1.0);`), fragmentShader: edgeFragment,
      transparent: true, depthWrite: false,
      uniforms: { uTime: { value: 0 }, uDark: { value: 0 }, uAlpha: { value: 0.32 }, uWedge: { value: 0 }, uLife: { value: 1 } }
    }));
    edge.renderOrder = 25 + i;
    edge.layers.set(i + 1);
    group.add(edge);
    scene.add(group);
    panes.push(group);
    materials.push(material);
    edges.push(edge);
    const ghostMaterial = i === 0 ? groundMaterial : groundMaterial.clone();
    ghostMaterial.onBeforeCompile = groundMaterial.onBeforeCompile;
    const ghost = new THREE.Mesh(paneGeometry, ghostMaterial);
    ghost.renderOrder = 2;
    reflectionRoot.add(ghost);
    groundMirrors.push(ghost);
    const shadowGeometry = new THREE.BufferGeometry();
    shadowGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
    shadowGeometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0,0,1,0,1,1,0,1]), 2));
    shadowGeometry.setIndex([0,1,2,0,2,3]);
    const shadow = new THREE.Mesh(shadowGeometry, new THREE.ShaderMaterial({
      uniforms: { uStrength: { value: .1 } },
      vertexShader: `varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `uniform float uStrength; varying vec2 vUv;
        void main(){float side=smoothstep(0.,.014,vUv.x)*(1.-smoothstep(.986,1.,vUv.x));
          float taper=1.-smoothstep(.38,1.,vUv.y);
          gl_FragColor=vec4(.055,.083,.102,uStrength*side*(.34+.66*taper));
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    }));
    shadow.renderOrder = 10;
    shadow.frustumCulled = false;
    scene.add(shadow);
    shadowPlanes.push(shadow);
  }
  scene.add(reflectionRoot);

  const triangle = new THREE.Shape();
  triangle.moveTo(-PRISM.halfWidth, PRISM.bottom);
  triangle.lineTo(PRISM.halfWidth, PRISM.bottom);
  triangle.lineTo(0, PRISM.top);
  triangle.closePath();
  const prismGeometry = new THREE.ExtrudeGeometry(triangle, { depth: PRISM.halfDepth * 2, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.052, bevelThickness: 0.045, curveSegments: 1 });
  prismGeometry.translate(0, 0, -PRISM.halfDepth);
  const prismPlanes = prismHullPlanes(prismGeometry.attributes.position.array);
  const prismMaterial = layeredGlass(createGlassMaterial({ thickness: 2.8, roughness: 0.018, ior: 1.52, color: 0xffffff }), { prism: true, planes: prismPlanes });
  prismMaterial.userData.optical.tOpticGobo.value = lightTexture;
  prismMaterial.dispersion = 0.55;
  prismMaterial.envMapIntensity = 1.1;
  const prism = new THREE.Mesh(prismGeometry, prismMaterial);
  prism.position.set(2.90, 0, 0.10);
  prism.rotation.y = -0.28;
  prism.renderOrder = 12;
  prism.layers.set(9);
  scene.add(prism);
  const prismEdges = new THREE.LineSegments(new THREE.EdgesGeometry(prismGeometry, 25), new THREE.LineBasicMaterial({ color: '#eaf5fc', transparent: true, opacity: 0.38, depthWrite: false }));
  prism.add(prismEdges);
  prismEdges.layers.set(9);

  const beam = createLightBeam();
  scene.add(beam.group);

  const words = [makeWord('UNSEEN', { weight: 500 }), makeWord('BETWEEN', { weight: 350 })];
  words[0].position.set(1.8, -0.3, -3.8);
  words[1].position.set(1.8, 0.6, -9.5);
  scene.add(...words);
  const openingType = createTypePlane(document.getElementById('title-light'));
  scene.add(openingType.mesh);
  document.documentElement.classList.add('optical-type');

  // A real planar reflection sees a letterform located behind the viewer.
  // Ordinary DOM text never enters the optical render pipeline.
  const mirrorWord = makeWord('ECHO', { color: '#eaf4f6', weight: 300 });
  mirrorWord.position.set(-1.8, 0.9, 7.0);
  mirrorWord.rotation.y = Math.PI;
  mirrorWord.scale.setScalar(0.26);
  scene.add(mirrorWord);
  const mirrors = [];
  for (let i = 0; i < 3; i++) {
    const mirror = new Reflector(new THREE.PlaneGeometry(2.96, 4.95), {
      color: 0xaebbc0, textureWidth: 640, textureHeight: 640, clipBias: 0.001, multisample: 0
    });
    mirror.position.z = .139;
    mirror.visible = false;
    mirror.material.transparent = true;
    mirror.material.depthWrite = false;
    mirror.material.uniforms.uReveal = { value: 0 };
    mirror.material.fragmentShader = mirror.material.fragmentShader.replace(
      'uniform vec3 color;', 'uniform vec3 color; uniform float uReveal;'
    ).replace('vec4( blendOverlay( base.rgb, color ), 1.0 )', 'vec4( blendOverlay( base.rgb, color ), uReveal )');
    const drawMirror = mirror.onBeforeRender;
    mirror.onBeforeRender = function (...args) {
      const visibility = mirrors.map(other => other.visible);
      mirrors.forEach(other => { if (other !== this) other.visible = false; });
      drawMirror.apply(this, args);
      mirrors.forEach((other, index) => { other.visible = visibility[index]; });
    };
    panes[i].add(mirror);
    mirrors.push(mirror);
  }

  const portalGroup = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: '#5c6970', metalness: 0.85, roughness: 0.22, transparent: true, depthWrite: false });
  const barGeometry = new THREE.BoxGeometry(1, 1, 1);
  for (let i = 0; i < 7; i++) {
    const frame = new THREE.Group();
    const w = 4.4, h = 5.5, s = 0.045;
    for (const [x, y, sx, sy] of [[-w / 2, 0, s, h], [w / 2, 0, s, h], [0, h / 2, w, s], [0, -h / 2, w, s]]) {
      const bar = new THREE.Mesh(barGeometry, metal);
      bar.position.set(x, y, 0);
      bar.scale.set(sx, sy, s);
      frame.add(bar);
    }
    frame.position.set(3.4, 0.45, -5.4 - i * 1.8);
    portalGroup.add(frame);
  }
  scene.add(portalGroup);

  // A luminous doorway beyond the viewer. It faces the mirror and is culled
  // from the main camera: the mirror reveals a space we otherwise cannot see.
  const reflectedRoom = new THREE.Group();
  const reflectedFrameMaterials = [];
  const luminous = new THREE.MeshBasicMaterial({ color: '#f3f7f8', side: THREE.FrontSide });
  const wallTone = new THREE.MeshBasicMaterial({ color: '#0a1014', side: THREE.FrontSide });
  const roomWall = new THREE.Mesh(new THREE.PlaneGeometry(18, 10), wallTone);
  roomWall.position.set(-2.2, .7, 18.5);
  roomWall.rotation.y = Math.PI;
  reflectedRoom.add(roomWall);
  const doorway = new THREE.Mesh(new THREE.PlaneGeometry(.50, 6.4), luminous);
  doorway.position.set(-2.6, .8, 18.35);
  doorway.rotation.y = Math.PI;
  reflectedRoom.add(doorway);
  for (let i = 0; i < 6; i++) {
    const frame = new THREE.Group();
    const frameMaterial = luminous.clone();
    reflectedFrameMaterials.push(frameMaterial);
    const w = 4.3 + i * 0.6, h = 5.2, s = 0.025;
    for (const [x, y, sx, sy] of [[-w/2, 0, s, h], [w/2, 0, s, h], [0, h/2, w, s]]) {
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(sx, sy), frameMaterial);
      strip.position.set(x, y, 0);
      strip.rotation.y = Math.PI;
      frame.add(strip);
    }
    frame.position.set(-1.8 - i * 1.0, 0.3, 5.5 + i * 2.3);
    reflectedRoom.add(frame);
  }
  scene.add(reflectedRoom);

  const base = new THREE.Mesh(new RoundedBoxGeometry(8.3, 0.05, 6.3, 2, 0.012), new THREE.MeshStandardMaterial({ color: '#b9c3c9', metalness: 0.32, roughness: 0.34 }));
  base.position.set(2.85, FLOOR + 0.04, -0.9);
  base.receiveShadow = true;
  scene.add(base);
  const bench = new THREE.Mesh(new RoundedBoxGeometry(2.8, 0.35, 0.65, 2, 0.02), new THREE.MeshStandardMaterial({ color: '#697171', metalness: 0.14, roughness: 0.32 }));
  bench.position.set(2.8, FLOOR + 0.34, -1.2);
  bench.castShadow = true;
  scene.add(bench);
  const opticalPass = createOpticalPass(renderer, scene, camera);
  const opticalObjects = [...panes, prism];

  let mobile = Boolean(initial.mobile);
  let portrait = isPortraitComposition(innerWidth, innerHeight);
  let width = 1, height = 1;
  let qualityScale = 1;
  let lastState;
  let lastTime = 0;
  const shadowPoint = new THREE.Vector3();
  const reflectedEye = new THREE.Vector3();
  const planeNormal = new THREE.Vector3();
  const eyeOffset = new THREE.Vector3();
  const beamEntry = new THREE.Vector3(), beamExit = new THREE.Vector3();
  const drawingSize = new THREE.Vector2();
  const framingCamera = new THREE.PerspectiveCamera(37, 1, .15, 150);
  const framingPoint = new THREE.Vector3();
  let surfaceWordX = 1.8;

  function frameSurfaceWord() {
    surfaceWordX = 1.8;
    if (width <= 760 || height > 450) return;
    const heading = document.getElementById('title-surface');
    if (!heading) return;
    const range = document.createRange();
    range.selectNodeContents(heading);
    const rects = [...range.getClientRects()];
    if (!rects.length) return;
    const captionOffset = parseFloat(document.getElementById('ui').style.getPropertyValue('--caption-offset')) || 0;
    const readingEdge = Math.max(...rects.map(rect => rect.right)) - captionOffset + 24;
    const shot = CAMERAS[1], ink = words[0].userData.ink;
    framingCamera.aspect = width / height;
    framingCamera.position.fromArray(shot.p);
    framingCamera.lookAt(...shot.t);
    framingCamera.updateProjectionMatrix();
    framingCamera.updateMatrixWorld();
    const projectedLeft = x => {
      let left = Infinity;
      for (const gx of [ink.left, ink.right]) for (const gy of [ink.top, ink.bottom]) {
        framingPoint.set(x + gx, -.3 + gy, -3.8).project(framingCamera);
        left = Math.min(left, (framingPoint.x * .5 + .5) * width);
      }
      return left;
    };
    // Two bounded secant steps account for the slight perspective yaw. This is
    // a cached layout calculation, never a per-frame collision correction.
    for (let i = 0; i < 2; i++) {
      const left = projectedLeft(surfaceWordX);
      const pixelsPerUnit = projectedLeft(surfaceWordX + 1) - left;
      if (left >= readingEdge || pixelsPerUnit <= 0) break;
      surfaceWordX = Math.min(5.8, surfaceWordX + (readingEdge - left) / pixelsPerUnit);
    }
  }

  function refreshTypography() {
    if (disposed) return;
    [...words, mirrorWord].forEach(word => word.userData.redraw());
    openingType.resize();
    frameSurfaceWord();
  }

  function weight(view, index) {
    return (view.from === index ? 1 - view.blend : 0) + (view.to === index ? view.blend : 0);
  }

  function update(view, time, state = {}) {
    lastState = { view, state };
    lastTime = time;
    const { from, to, blend, darkness } = view;
    const light = weight(view, 0);
    // A sine that ran 0→1→0 inside every chapter used to nudge the camera 0.16
    // units closer and back and swing the panes with it. On screen that read as
    // the whole scene zooming in and out after each chapter. The hold keeps the
    // slow incidence drift below; the camera itself no longer pulses.
    const surface = weight(view, 1);
    const refraction = weight(view, 2);
    const reflection = weight(view, 3);
    const layers = weight(view, 4);
    const house = weight(view, 5);
    // Each control owns its study; the shared light interpolates through the
    // handoff. A prism adjustment must not offset the house's labelled sun.
    const lightAngle = refraction * (state.lightAngle || 0) + house * (state.daylight || 0);
    const angleR = lightAngle * Math.PI / 180;
    const ambient = state.reduced ? 0 : Math.sin(time * 0.18);
    bg.copy(bright).lerp(dark, darkness);
    sky.material.uniforms.uDark.value = darkness;
    scene.fog.color.copy(bg);
    scene.environmentRotation.y = angleR * 0.25 + ambient * 0.02 + house * 0.3;
    scene.environmentIntensity = mix(1.1, 0.73, darkness);
    renderer.toneMappingExposure = mix(1.04, 1.0, darkness);
    hemi.intensity = mix(1.0, 0.26, darkness);
    key.intensity = mix(3.0, 1.75, darkness);
    key.position.set(-6 + Math.sin(angleR) * 6, 9.5, -7 + Math.cos(angleR) * 2);
    fill.intensity = mix(1.2, 1.6, darkness);

    const chosen = ['clear', 'frosted', 'mirror'].indexOf(state.material || 'clear');
    const order = [(chosen + 1) % 3, chosen, (chosen + 2) % 3];
    for (let i = 0; i < panes.length; i++) {
      const a = POSES[from][i], b = POSES[to][i];
      const pose = a.map((v, n) => mix(v, b[n], blend));
      const pane = panes[i];
      const layerLife = mobile && i >= 4 && i < 7 ? 1 - smooth(.12, .92, layers) : 1;
      pane.visible = pose[3] > 0.025 && pose[4] > 0.025 && layerLife > .002;
      pane.position.set(pose[0], pose[1], pose[2]);
      pane.scale.set(Math.max(0.0001, pose[3] / 3), Math.max(0.0001, pose[4] / 5), Math.max(0.0001, pose[5] / 0.26));
      pane.rotation.set(pose[6], pose[7], pose[8]);
      // Tiny changes of incidence sustain a hold without orbiting the artwork.
      pane.rotation.y += ambient * 0.013 * (1 - house) * (i % 2 === 0 ? 1 : -1);
      pane.position.z += layers * (state.reduced ? 0 : Math.sin(time * 0.16 + i * 0.22) * 0.035);
      pane.children[0].morphTargetInfluences[0] = i < 2 ? light : 0;
      edges[i].material.uniforms.uWedge.value = i < 2 ? light : 0;
      const finish = i < 3 ? order[i] : 0;
      const frost = finish === 1 ? surface : 0;
      const mirrorAmount = i < 3 ? Math.max(finish === 2 ? surface : 0, reflection * [1, .72, .48][i]) : 0;
      const silver = i < 3 ? 0 : reflection * .07;
      materials[i].roughness = mix(0.036, 0.48, frost) + silver * 0.03;
      materials[i].metalness = silver * 0.97;
      materials[i].transmission = 0;
      materials[i].thickness = mix(0.56, 1.5, frost);
      materials[i].envMapIntensity = mix(1.30, 1.85, darkness);
      materials[i].color.set('#ffffff');
      const optical = materials[i].userData.optical;
      optical.uOpticLife.value = layerLife;
      const wedge = i < 2 ? light : 0;
      optical.uOpticPlanes.value[2].set(1.3 * wedge, 1, 0, 2.5 - 1.95 * wedge);
      optical.uOpticFrost.value = frost;
      optical.uOpticSilver.value = silver;
      optical.uOpticDark.value = darkness;
      optical.uOpticTime.value = time;
      optical.uOpticAngle.value = angleR * .62;
      // One lit interface is transmitted through its neighbours. Repeating the
      // same projection on every pane flattens depth and repeats expensive work.
      optical.uOpticGlow.value = light * (i === 1 ? .80 : .25)
        + layers * (i === 0 ? .065 : 0) + house * (i === 2 ? .14 : 0);
      edges[i].material.uniforms.uTime.value = time + i * 1.2;
      edges[i].material.uniforms.uDark.value = darkness;
      // Daylight needs a legible dark edge; the mirror room keeps its restrained
      // light edge. Receding interfaces remain subordinate to the first panes.
      edges[i].material.uniforms.uAlpha.value = mix(.29, .24, darkness) * (i > 4 ? .58 : 1);
      edges[i].material.uniforms.uLife.value = layerLife;
      if (i < 3) {
        mirrors[i].visible = mirrorAmount > .005;
        mirrors[i].material.uniforms.uReveal.value = mirrorAmount;
      }
      const ghost = groundMirrors[i];
      ghost.visible = pane.visible;
      ghost.position.copy(pane.position);
      ghost.quaternion.copy(pane.quaternion);
      ghost.scale.copy(pane.scale);
      ghost.material.opacity = .18 * layerLife;
      ghost.morphTargetInfluences[0] = pane.children[0].morphTargetInfluences[0];
      pane.updateMatrix();
      const shadow = shadowPlanes[i];
      shadow.visible = pane.visible;
      shadow.material.uniforms.uStrength.value = (.14 + mirrorAmount * .08 + frost * .08) * (1 - darkness * .6) * layerLife;
      const corners = [[-1.5,-2.5],[1.5,-2.5],[1.5,2.5],[-1.5,2.5]];
      const shadowPositions = shadow.geometry.attributes.position;
      for (let c = 0; c < 4; c++) {
        const [x,y] = corners[c];
        const wedgeY = -2.5 + (y + 2.5) * (.22 + .78 * (1.5 - x) / 3);
        shadowPoint.set(x, mix(y, wedgeY, i < 2 ? light : 0), 0).applyMatrix4(pane.matrix);
        const lift = Math.max(0, shadowPoint.y - FLOOR);
        shadowPositions.setXYZ(c, shadowPoint.x + lift * Math.cos(.89 + angleR*.62) * .95, FLOOR + .012 + i*.0001, shadowPoint.z + lift * Math.sin(.89 + angleR*.62) * .95);
      }
      shadowPositions.needsUpdate = true;
    }
    const prismScale = smooth(0.03, 0.94, refraction);
    prism.visible = prismScale > 0.006;
    // The prism recedes through the incoming planes rather than collapsing
    // into a tiny triangle at the centre of the next composition.
    prism.scale.setScalar(.96 + prismScale * .04);
    prism.position.z = .10 - (1 - prismScale) * 2.8;
    prismMaterial.userData.optical.uOpticLife.value = prismScale;
    prismEdges.material.opacity = .16 * prismScale;
    prism.rotation.y = -0.52 + angleR * 0.2 + ambient * 0.012;
    prismMaterial.userData.optical.uOpticTime.value = time;
    prismMaterial.userData.optical.uOpticAngle.value = angleR * .62;
    prismMaterial.userData.optical.uOpticDark.value = darkness;
    prismMaterial.userData.optical.uOpticGlow.value = refraction * .14;
    prism.position.x = 2.90;
    const ports = prismBeamPorts(lightAngle, prismPlanes[0][3]);
    prism.updateMatrixWorld(true);
    beamEntry.fromArray(ports.entry).applyMatrix4(prism.matrixWorld);
    beamExit.fromArray(ports.exit).applyMatrix4(prism.matrixWorld);
    beam.update({ time, opacity: Math.max(refraction, weight(view, 0) * 0.15), angle: lightAngle, spectrum: refraction, darkness, entry: beamEntry, exit: beamExit });
    beam.group.visible = refraction > 0.015 || weight(view, 0) > 0.01;

    words[0].visible = surface > 0.035;
    words[0].position.x = surfaceWordX;
    words[0].material.opacity = surface * 0.88;
    words[0].scale.y = Math.max(.001, surface);
    words[1].visible = layers > 0.035;
    words[1].material.opacity = layers * 0.90;
    words[1].scale.y = Math.max(.001, layers);
    mirrorWord.visible = reflection > .005 || surface > .005;
    reflectedRoom.visible = mirrorWord.visible;
    mirrorWord.material.color.set(darkness > .5 ? '#ffffff' : '#1b272d');
    luminous.color.set(darkness > .5 ? '#f3f7f8' : '#263840');
    reflectedFrameMaterials.forEach((material, index) => material.color.copy(luminous.color).multiplyScalar(.66 * Math.exp(-index * .27)));
    wallTone.color.set(darkness > .5 ? '#0a1014' : '#c4d0d6');
    portalGroup.visible = reflection > 0.03;
    portalGroup.position.z = -(1 - reflection) * 7;
    metal.opacity = smooth(.03, .85, reflection);
    base.visible = house > 0.02;
    bench.visible = house > 0.12;
    base.scale.set(1, Math.max(0.01, house), Math.max(0.01, house));
    bench.scale.setScalar(Math.max(0.001, house));
    floor.update({ time, darkness, lightAngle, energy: mix(0.70, 1.1, house) + refraction * 0.25, chapter: from + blend });

    const shots = portrait ? MOBILE_CAMERAS : CAMERAS;
    const c1 = shots[from], c2 = shots[to];
    const pointerX = state.reduced ? 0 : (state.pointer?.x || 0);
    const pointerY = state.reduced ? 0 : (state.pointer?.y || 0);
    camera.position.set(
      mix(c1.p[0], c2.p[0], blend) + pointerX * (portrait ? 0 : 0.14),
      mix(c1.p[1], c2.p[1], blend) + pointerY * (portrait ? 0 : 0.085),
      mix(c1.p[2], c2.p[2], blend) + ambient * 0.024
    );
    target.set(mix(c1.t[0], c2.t[0], blend), mix(c1.t[1], c2.t[1], blend), mix(c1.t[2], c2.t[2], blend));
    camera.fov = mix(c1.f, c2.f, blend);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    openingType.update(camera, view, width, height);
    const primaryMirror = surface > reflection ? Math.max(0, order.indexOf(2)) : 0;
    const mirrorPane = panes[primaryMirror];
    planeNormal.set(0,0,1).applyQuaternion(mirrorPane.quaternion);
    eyeOffset.copy(camera.position).sub(mirrorPane.position);
    reflectedEye.copy(camera.position).addScaledVector(planeNormal, -2 * eyeOffset.dot(planeNormal));
    const fraction = (7 - reflectedEye.z) / (mirrorPane.position.z - reflectedEye.z);
    mirrorWord.position.x = reflectedEye.x + (mirrorPane.position.x - reflectedEye.x) * fraction;
    reflectedRoom.position.x = mirrorWord.position.x + 1.8;
  }

  function render() {
    if (!disposed && !renderer.getContext().isContextLost()) opticalPass.render(opticalObjects);
  }

  function resize(w, h, isMobile = w <= 760) {
    width = Math.max(1, w);
    height = Math.max(1, h);
    mobile = isMobile;
    portrait = isPortraitComposition(width, height);
    const budget = mobile ? 1_600_000 : 3_400_000;
    const deviceRatio = window.devicePixelRatio || 1;
    const requestedRatio = mobile ? Math.min(deviceRatio, 1.65) : Math.min(Math.max(deviceRatio, 1.25), 1.5);
    const pixelRatio = Math.min(requestedRatio, Math.sqrt(budget / (width * height))) * qualityScale;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    renderer.transmissionResolutionScale = mobile ? 0.5 : 0.68;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    opticalPass.resize();
    renderer.getDrawingBufferSize(drawingSize);
    mirrors.forEach((mirror, index) => {
      const coverage = [.70, .46, .38][index];
      const bounded = Math.min(coverage, 1536 / Math.max(drawingSize.x, drawingSize.y));
      mirror.getRenderTarget().setSize(Math.max(640, Math.round(drawingSize.x * bounded)), Math.max(640, Math.round(drawingSize.y * bounded)));
    });
    openingType.resize();
    frameSurfaceWord();
    if (lastState) update(lastState.view, lastTime, lastState.state);
  }

  async function warmup() {
    if (disposed) return;
    // Three's compile traverses all drawable objects, including hidden ones.
    // Only lights use traverseVisible; all installation lights are already
    // enabled on the base layer. Do not mutate a live scene while awaiting it.
    if (renderer.extensions.has('KHR_parallel_shader_compile')) await renderer.compileAsync(scene, camera);
    else renderer.compile(scene, camera);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    floor.dispose();
    beam.dispose();
    opticalPass.dispose();
    const geometries = new Set(), mats = new Set(), textures = new Set();
    scene.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) for (const material of Array.isArray(object.material) ? object.material : [object.material]) mats.add(material);
      if (object.userData.texture) textures.add(object.userData.texture);
    });
    geometries.forEach(g => g.dispose());
    mats.forEach(m => m.dispose());
    textures.forEach(t => t.dispose());
    mirrors.forEach(mirror => mirror.dispose());
    environment.dispose();
    lightTexture.dispose();
    renderer.dispose();
    document.documentElement.classList.remove('optical-type');
  }

  return {
    update, render, resize, warmup, dispose, refreshTypography,
    lowerQuality() { qualityScale = Math.max(0.65, qualityScale * 0.85); resize(width, height, mobile); },
    get info() { return { mode: 'webgl', framing: portrait ? 'portrait' : 'landscape', calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, pixelRatio: renderer.getPixelRatio(), geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures }; }
  };
}
