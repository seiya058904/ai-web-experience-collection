/* COUNTERFORM material scenes. All letter geometry is derived from the local
 * Fraunces font. This file owns no animation clock and makes no network requests.
 * Three.js is provided by the Collection's pinned root dependency. */
import * as THREE from 'three';

const FONT = {"bounds":[70.152,0,1348.858,1400],"location":{"wght":600,"opsz":100,"SOFT":0,"WONK":1},"outer":"M1245.911 911.197Q1245.911 1059.229 1165.388 1169.062Q1084.864 1278.894 934.009 1339.447Q783.154 1400 571.477 1400H82.267Q76.17 1400 73.161 1397.592Q70.152 1395.184 70.152 1391.627Q70.152 1384.25 83.641 1381.879L163.262 1369.459Q183.304 1366.447 192.959 1359.674Q202.613 1352.902 202.613 1340.389V72.172Q202.613 52.808 193.244 43.656Q183.875 34.505 163.262 30.54L83.641 18.121Q70.152 15.75 70.152 8.373Q70.152 5.245 73.161 2.622Q76.17 0 82.267 0H604.712Q616.827 0 616.827 8.373Q616.827 12.899 613.827 14.997Q610.827 17.095 603.337 18.121L523.136 30.54Q502.639 34.515 493.357 43.661Q484.075 52.808 484.075 72.172V562.274Q495.916 556.155 508.399 550.783Q552.925 531.624 611.414 521.877Q650.269 515.402 697.565 513.229L940.154 93.934Q957.989 63.034 952.235 48.187Q946.48 33.34 922.045 25.834L880.282 17.463Q873.818 14.841 870.62 13.725Q867.421 12.609 867.421 8.373Q867.421 0 879.479 0H1336.666Q1342.781 0 1345.82 2.622Q1348.858 5.245 1348.858 8.373Q1348.858 12.899 1345.742 14.431Q1342.626 15.963 1334.807 18.14Q1305.233 24.876 1281.84 37.169Q1258.448 49.463 1237.573 82.86L960.561 542.979Q1024.168 563.074 1075.397 596.344Q1156.676 649.129 1201.294 729.704Q1245.911 810.278 1245.911 911.197Z","counters":["M484.075 585.959V1377.143H572.068Q683.399 1377.143 771.58 1315.419Q859.762 1253.695 910.912 1145.716Q962.063 1037.737 962.063 899.205Q962.063 718.885 883.888 631.487Q805.713 544.09 675.727 544.09Q630.285 544.09 588.206 551.099Q546.126 558.109 508.211 574.303Q495.903 579.56 484.075 585.959Z"]};
const clamp = x => Math.min(1, Math.max(0, Number.isFinite(x) ? x : 0));
const ease = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const DPR_LIMIT = 1.65;

// A deliberately small parser for the absolute M/L/H/V/Q/Z commands exported
// by fontTools/Skia PathOps. Curves remain quadratic curves until tessellation.
function outline(d, height = 1, Type = THREE.Path) {
  const tokens = d.match(/[MLHVQZ]|[-+]?(?:\d*\.\d+|\d+)(?:e[-+]?\d+)?/gi);
  const p = new Type();
  const [x0, y0, x1, y1] = FONT.bounds;
  const sc = height / (y1 - y0), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  let i = 0, command = '', x = 0, y = 0;
  const xx = v => (v - cx) * sc, yy = v => (v - cy) * sc;
  const n = () => Number(tokens[i++]);
  while (i < tokens.length) {
    if (/^[a-z]$/i.test(tokens[i])) command = tokens[i++].toUpperCase();
    if (command === 'Z') { p.closePath(); command = ''; continue; }
    if (command === 'M') { x = n(); y = n(); p.moveTo(xx(x), yy(y)); command = 'L'; }
    else if (command === 'L') { x = n(); y = n(); p.lineTo(xx(x), yy(y)); }
    else if (command === 'H') { x = n(); p.lineTo(xx(x), yy(y)); }
    else if (command === 'V') { y = n(); p.lineTo(xx(x), yy(y)); }
    else if (command === 'Q') { const qx = n(), qy = n(); x = n(); y = n(); p.quadraticCurveTo(xx(qx), yy(qy), xx(x), yy(y)); }
    else throw new Error('Unsupported font path command: ' + command);
  }
  return p;
}

function glyphShape(height) {
  const shape = outline(FONT.outer, height, THREE.Shape);
  for (const d of FONT.counters) shape.holes.push(outline(d, height));
  return shape;
}

function rectangle(width, height, radius = 0.02) {
  const x = -width / 2, y = -height / 2, r = radius;
  const p = new THREE.Shape();
  p.moveTo(x + r, y); p.lineTo(x + width - r, y);
  p.quadraticCurveTo(x + width, y, x + width, y + r);
  p.lineTo(x + width, y + height - r);
  p.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  p.lineTo(x + r, y + height);
  p.quadraticCurveTo(x, y + height, x, y + height - r);
  p.lineTo(x, y + r); p.quadraticCurveTo(x, y, x + r, y); p.closePath();
  return p;
}

function stoneOutline() {
  // Only the outside of the stone is irregular. The typographic contour is
  // unchanged: these small chips belong to the substrate, not the typeface.
  const points = [
    [-1.78,-1.75],[-1.02,-1.746],[-.28,-1.754],[.44,-1.75],[1.09,-1.741],[1.77,-1.75],
    [1.823,-1.695],[1.827,-.96],[1.818,-.16],[1.825,.71],[1.820,1.66],[1.767,1.746],
    [1.11,1.745],[.32,1.754],[-.46,1.749],[-1.18,1.74],[-1.766,1.751],
    [-1.818,1.69],[-1.826,.88],[-1.819,.17],[-1.824,-.63],[-1.819,-1.68],
  ];
  const shape = new THREE.Shape();
  points.forEach(([x,y],i) => i ? shape.lineTo(x,y) : shape.moveTo(x,y));
  shape.closePath(); return shape;
}

function softContactShadow(width, height, opacity = .16) {
  const size = 128, pixels = new Uint8Array(size * size * 4), padding = .8;
  for (let y=0;y<size;y++) for (let x=0;x<size;x++) {
    const px=(x/(size-1)-.5)*(width+padding), py=(y/(size-1)-.5)*(height+padding);
    const dx=Math.max(Math.abs(px)-(width/2-.06),0),dy=Math.max(Math.abs(py)-(height/2-.06),0);
    const a=opacity*Math.exp(-(dx*dx+dy*dy)/.016), i=(y*size+x)*4;
    pixels[i]=66; pixels[i+1]=57; pixels[i+2]=43; pixels[i+3]=Math.round(a*255);
  }
  const map=new THREE.DataTexture(pixels,size,size,THREE.RGBAFormat);
  map.colorSpace=THREE.SRGBColorSpace; map.magFilter=map.minFilter=THREE.LinearFilter;map.needsUpdate=true;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width+padding,height+padding),new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,toneMapped:false}));
  mesh.userData.ownedTexture=map; return mesh;
}

function extrusion(shape, depth, bevel, material, z = 0) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth, steps: 1, curveSegments: 24,
    bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel,
    bevelSegments: 3,
  });
  const mesh = new THREE.Mesh(g, material); mesh.position.z = z;
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}

function seeded(seed) { let n = seed >>> 0; return () => { n = (1664525 * n + 1013904223) >>> 0; return n / 4294967296; }; }
function hash(x, y) { let n = Math.imul(x, 374761393) + Math.imul(y, 668265263); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
function noise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return lerp(lerp(hash(ix, iy), hash(ix + 1, iy), u), lerp(hash(ix, iy + 1), hash(ix + 1, iy + 1), u), v);
}

// Bitmap material maps contain only deterministic grain, never glyphs or text.
function texture(kind, size = 512) {
  const pixels = new Uint8Array(size * size * 4), random = seeded(1972);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4, grain = random();
    const coarse = noise(x / 100, y / 100), medium = noise(x / 17, y / 17);
    let r, g, b, alpha = 255;
    if (kind === 'stone') {
      let light = 0.90 + coarse * .035 + medium * .055 + grain * .12;
      if (grain < .018) light -= .17;
      r = 197 * light; g = 187 * light; b = 166 * light;
    } else if (kind === 'metal') {
      let light = .60 + coarse * .28 + medium * .15 + grain * .18;
      const scratch = noise(x / 2, y / 240);
      if (scratch > .70) light += .12;
      if (grain < .016) light *= .64;
      r = 174 * light; g = 173 * light; b = 169 * light;
    } else if (kind === 'paper') {
      const fiber = noise(x / 1.5, y / 55) * .032;
      const light = .92 + coarse * .038 + medium * .016 + grain * .024 + fiber;
      r = 251 * light; g = 245 * light; b = 229 * light;
    } else {
      const light = 13 + medium * 3 + grain * 8;
      r = light; g = light * .93; b = light * .84;
      if (grain > .992 || (medium > .84 && grain > .93)) alpha = Math.floor(lerp(40, 190, random()));
    }
    pixels[i] = r; pixels[i + 1] = g; pixels[i + 2] = b; pixels[i + 3] = alpha;
  }
  const t = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = true; t.needsUpdate = true;
  return t;
}

function studioEnvironment(renderer) {
  const w = 512, h = 256, data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h, i = (y * w + x) * 4;
    let value = 35 + 78 * Math.sin(Math.PI * v);
    if (u > .15 && u < .35 && v > .12 && v < .72) value = 239;
    if (u > .59 && u < .66 && v > .20 && v < .68) value = 182;
    if (v < .10) value = 166;
    data[i] = value; data[i + 1] = value * .975; data[i + 2] = value * .91; data[i + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace; tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.needsUpdate = true;
  const generator = new THREE.PMREMGenerator(renderer);
  try { return generator.fromEquirectangular(tex); }
  finally { tex.dispose(); generator.dispose(); }
}

function lightScene(scene, environment, kind) {
  scene.environment = environment;
  const hemi = new THREE.HemisphereLight(0xf7efdc, 0x55504a, kind === 'mark' ? 1.4 : 1.5);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff4df, kind === 'mark' ? 3.3 : 3.1);
  // The press has a tall lift, so a more frontal light keeps its shadow inside
  // the specimen viewport throughout the travel rather than cutting it off.
  key.position.set(kind === 'mark' ? -3.6 : -2.5, kind === 'mark' ? 5.5 : 3.0, kind === 'mark' ? 2.8 : 11.0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -4.5; key.shadow.camera.right = 4.5;
  key.shadow.camera.top = 4.5; key.shadow.camera.bottom = -4.5;
  key.shadow.camera.near = .1; key.shadow.camera.far = 18;
  key.shadow.bias = -.00012; key.shadow.normalBias = .006;
  key.shadow.radius = 3;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xc9d1d2, .42);
  fill.position.set(4, -1, 5); scene.add(fill);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(15, 15), new THREE.ShadowMaterial({ color: 0x47392a, opacity: .075 }));
  shadow.position.z = kind === 'mark' ? -.34 : -.055;
  if (kind === 'mark') shadow.visible=false;
  shadow.receiveShadow = true; scene.add(shadow);
  return { key, shadow };
}

function makeMark(maps, environment) {
  const scene = new THREE.Scene();
  const lighting = lightScene(scene, environment, 'mark');
  const contact=softContactShadow(3.65,3.50,.18);
  contact.position.set(.055,-.075,-.34);contact.rotation.z=-.025;scene.add(contact);
  const slab = new THREE.Group(); scene.add(slab);
  const top = new THREE.MeshStandardMaterial({ map: maps.stone, roughness: .96, metalness: .015, bumpMap: maps.stone, bumpScale: .025, envMapIntensity: .2 });
  const side = top.clone(); side.color.set(0x9f9685); side.bumpScale = .016;
  const bottom = top.clone(); bottom.color.set(0x655d4f); bottom.bumpScale = .035;
  const height = 2.80;
  const plate = stoneOutline();
  plate.holes.push(outline(FONT.outer, height));
  // The R is a real opening in the upper solid. The counter is an intact stone
  // island; the darker floor is recessed 0.22 units below the uncut surface.
  slab.add(extrusion(plate, .23, .012, [top, side], -.08));
  let counterMesh;
  for (const d of FONT.counters) {
    const island = extrusion(outline(d, height, THREE.Shape), .23, .012, [top, side], -.08);
    slab.add(island); counterMesh ||= island;
  }
  slab.add(extrusion(stoneOutline(), .105, .015, [bottom, side], -.205));
  // Unfilled floor directly beneath the carving gives both a cavity and a
  // material shadow while preserving the exact contour above.
  slab.rotation.set(-.13, -.17, -.035);
  slab.position.y = .02;
  return { scene, slab, counterMesh, lighting, width: 4.12, height: 4.03 };
}

function makePress(maps, environment) {
  const scene = new THREE.Scene();
  const lighting = lightScene(scene, environment, 'press');
  const paper = new THREE.Group(); scene.add(paper); paper.position.set(1.45, .02, -.023);
  const paperTop = new THREE.MeshStandardMaterial({ map: maps.paper, roughness: .98, metalness: 0, bumpMap: maps.paper, bumpScale: .014, envMapIntensity: .1 });
  const paperEdge = paperTop.clone(); paperEdge.color.set(0xcbbf9f);
  paper.add(extrusion(rectangle(2.85, 3.00, .028), .025, .008, [paperTop, paperEdge]));

  const inkMaterial = new THREE.MeshStandardMaterial({ map: maps.ink, color: 0xf7f4ec, roughness: .99, metalness: 0, transparent: true, opacity: 0, depthWrite: false, envMapIntensity: .05, side: THREE.DoubleSide });
  const ink = new THREE.Mesh(new THREE.ShapeGeometry(glyphShape(2.16), 26), inkMaterial);
  ink.position.z = .035; ink.receiveShadow = true; paper.add(ink);

  const die = new THREE.Group(); scene.add(die);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x636564, map: maps.metal, metalness: .76, roughness: .59, bumpMap: maps.metal, bumpScale: .025, envMapIntensity: 1.3 });
  const faceMaterial = new THREE.MeshStandardMaterial({ color: 0xc8cbca, map: maps.metal, metalness: .88, roughness: .39, bumpMap: maps.metal, bumpScale: .015, envMapIntensity: 1.75 });
  const wallMaterial = faceMaterial.clone(); wallMaterial.color.set(0x535655); wallMaterial.roughness = .52;
  die.add(extrusion(rectangle(2.37, 2.58, .045), .29, .025, bodyMaterial, -.205));
  const baseMaterial = bodyMaterial.clone(); baseMaterial.color.set(0x322d26); baseMaterial.roughness = .71;
  die.add(extrusion(rectangle(2.28, 2.49, .024), .034, .006, baseMaterial, .112));
  const rim = rectangle(2.36, 2.57, .034); rim.holes.push(rectangle(2.26, 2.47, .020));
  die.add(extrusion(rim, .033, .004, faceMaterial, .105));
  const reversed = new THREE.Group(); reversed.scale.x = -1; die.add(reversed);
  const face = extrusion(glyphShape(2.16), .148, .0065, [faceMaterial, wallMaterial], .150);
  reversed.add(face);
  // Side scoring provides evidence of a metal body without inventing type or
  // rasterized lettering on the artefact.
  const grooveMaterial = new THREE.MeshStandardMaterial({ color: 0x312e28, metalness: .48, roughness: .69 });
  for (const z of [-.13, -.085, -.045]) {
    const score = new THREE.Mesh(new THREE.BoxGeometry(2.32, .008, .005), grooveMaterial);
    score.position.set(0, -1.304, z); die.add(score);
  }
  return { scene, lighting, die, face, paper, ink, inkMaterial, width: 6.4, height: 3.85 };
}

function failed(reason) {
  return { ready: false, info: { available: false, reason, fallback: 'Use the native SVG/HTML scene.' }, render() { return false; }, renderLayers() { return false; }, counterMatrix() { return null; }, resize() {}, dispose() {} };
}

function create(canvas) {
  if (!canvas || typeof canvas.getContext !== 'function') return failed('A canvas is required.');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power', preserveDrawingBuffer: false, failIfMajorPerformanceCaveat: false });
  } catch (error) { return failed(String(error?.message || 'WebGL2 is unavailable.')); }
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  const maps = { stone: texture('stone'), metal: texture('metal'), paper: texture('paper'), ink: texture('ink') };
  let environment, mark, press;
  try {
    environment = studioEnvironment(renderer);
    mark = makeMark(maps, environment.texture);
    press = makePress(maps, environment.texture);
  } catch (error) {
    Object.values(maps).forEach(x => x.dispose()); environment?.dispose(); renderer.dispose();
    return failed('Material initialization: ' + String(error?.message || error));
  }
  const camera = new THREE.OrthographicCamera(-3, 3, 2, -2, .1, 30);
  camera.position.set(0, 0, 10); camera.lookAt(0, 0, 0);
  let width = 1, height = 1, density = 1, dead = false, lost = false, last = null;
  let compositor = null;
  const info = {
    available: true, renderer: 'Three.js r180 / WebGL2', dprLimit: DPR_LIMIT,
    glyph: 'Fraunces R', axes: FONT.location,
    geometry: 'Exact nonzero outer contour and counter from docs/font-spec.json; quadratic curves tessellated at 24 segments.',
    contactProgress: [.40, .46], stableImpressionProgress: .72, ownsAnimationFrame: false,
    composition: 'One renderer; up to two cached GPU framebuffer textures; premultiplied screen-space composition.',
  };

  function prepareScene(name, p, w, h) {
    const selected = name === 'press' ? press : mark;
    const aspect = w / h;
    const viewH = Math.max(selected.height, selected.width / aspect);
    camera.left = -viewH * aspect / 2; camera.right = viewH * aspect / 2;
    camera.top = viewH / 2; camera.bottom = -viewH / 2; camera.updateProjectionMatrix();
    if (name === 'mark') {
      const t = ease(.05, .7, p);
      mark.slab.rotation.set(lerp(-.16, -.10, t), lerp(-.19, -.10, t), lerp(-.039, -.020, t));
      mark.lighting.key.position.x = lerp(-3.6, -2.9, t);
    } else {
      const move = ease(.10, .30, p), returnMove = ease(.50, .72, p);
      const flip = ease(.15, .31, p) * (1 - ease(.54, .72, p));
      const lift = ease(.10, .22, p), down = ease(.29, .40, p), up = ease(.46, .57, p), settle = ease(.65, .72, p);
      const active = move * (1 - returnMove);
      press.die.position.x = lerp(-1.46, press.paper.position.x, active);
      press.die.position.y = lerp(-.055, press.paper.position.y, active);
      press.die.position.z = .63 + lift * .97 - down * 1.2895 + up * 1.2895 - settle * .97;
      press.die.rotation.set(lerp(-.16, 0, active), Math.PI * flip - .20 * (1 - active), -.055 * (1 - active));
      press.inkMaterial.opacity = ease(.40, .422, p);
      press.ink.visible = press.inkMaterial.opacity > 0;
      // Light pressure changes the paper by less than 1% of its depth.
      press.paper.position.z = -.023 - .006 * ease(.39, .41, p) * (1 - ease(.46, .48, p));
      info.pressState = p < .10 ? 'reverse' : p < .40 ? 'approach' : p <= .46 ? 'contact' : p < .72 ? 'separate' : 'impression';
      info.impressionOpacity = press.inkMaterial.opacity;
    }
    return selected.scene;
  }

  function disposeCompositor() {
    if (!compositor) return;
    for (const pass of compositor.passes) { pass.texture.dispose(); pass.quad.material.dispose(); }
    compositor.geometry.dispose(); compositor = null;
    delete info.compositeTargets;
  }

  function getCompositor() {
    if (compositor) return compositor;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
    camera.position.z = 1;
    const geometry = new THREE.PlaneGeometry(2, 2);
    const passes = [];
    for (let i = 0; i < 2; i++) {
      const texture = new THREE.FramebufferTexture(1, 1);
      texture.minFilter = texture.magFilter = THREE.LinearFilter;
      // Capture the already tone-mapped default framebuffer entirely on the
      // GPU. A floating-point render target would change the order of ink
      // transparency and tone mapping, causing a color jump at the handoff.
      // These pixels already contain premultiplied display-space color.
      const material = new THREE.ShaderMaterial({
        uniforms: { image: { value: texture }, layerOpacity: { value: 1 } },
        vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
        fragmentShader: `
          uniform sampler2D image;
          uniform float layerOpacity;
          varying vec2 vUv;
          void main(){
            gl_FragColor=texture2D(image,vUv)*layerOpacity;
          }`,
        transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false,
        toneMapped: false,
      });
      const quad = new THREE.Mesh(geometry, material);
      quad.renderOrder = i; quad.frustumCulled = false; scene.add(quad);
      passes.push({ texture, quad, key: null });
    }
    compositor = { scene, camera, geometry, passes };
    return compositor;
  }

  function renderFailure(error) {
    renderer.setRenderTarget(null);
    renderer.setViewport(0, 0, width, height);
    info.available = false; info.reason = String(error?.message || error);
    canvas.dispatchEvent(new CustomEvent('counterform:materials-lost', { bubbles: true, detail: { reason: info.reason } }));
    return false;
  }

  const onLost = event => {
    event.preventDefault(); lost = true; info.available = false;
    canvas.dispatchEvent(new CustomEvent('counterform:materials-lost', { bubbles: true, detail: { reason: 'WebGL context lost' } }));
  };
  const onRestore = () => {
    if (dead) return;
    try {
      // CPU-backed surface maps can be re-uploaded by Three.js. The PMREM is
      // different: its pixels existed only in a render target lost with the
      // context. Rebuild those pixels before allowing the canvas to replace
      // the native fallback, or metallic reflections return visibly darker.
      const restoredEnvironment = studioEnvironment(renderer);
      const previousEnvironment = environment;
      environment = restoredEnvironment;
      mark.scene.environment = press.scene.environment = environment.texture;
      previousEnvironment.dispose();
      disposeCompositor();
      renderer.shadowMap.needsUpdate = true;
      lost = false; info.available = true; delete info.reason; last = null;
      canvas.dispatchEvent(new CustomEvent('counterform:materials-restored', { bubbles: true }));
    } catch (error) {
      lost = true; info.available = false;
      info.reason = 'Material restoration: ' + String(error?.message || error);
      canvas.dispatchEvent(new CustomEvent('counterform:materials-lost', { bubbles: true, detail: { reason: info.reason } }));
    }
  };
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestore);

  const controller = {
    ready: true, info,
    resize(w, h, dpr = window.devicePixelRatio || 1) {
      if (dead) return;
      width = Math.max(1, Math.round(w)); height = Math.max(1, Math.round(h));
      // Keep both a density cap and a pixel-count cap for large 4K viewports.
      density = Math.max(.25, Math.min(DPR_LIMIT, Number(dpr) || 1, Math.sqrt(3_300_000 / (width * height))));
      renderer.setPixelRatio(density); renderer.setSize(width, height, false); last = null;
      info.drawingBuffer = { width: canvas.width, height: canvas.height, dpr: density };
    },
    counterMatrix({ scene = 'mark', progress = 0, width: w = width, height: h = height, role = 'entry' } = {}) {
      if (dead || !Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
      const name = scene === 'press' ? 'press' : 'mark';
      // Sample the same actual object hierarchy and pose used for the render.
      // Restore it afterwards: this read-only projection must not change the
      // current press state or interfere with cached offscreen frames.
      const saved = {
        markRotation: mark.slab.rotation.clone(), lightX: mark.lighting.key.position.x,
        diePosition: press.die.position.clone(), dieRotation: press.die.rotation.clone(), paperZ: press.paper.position.z,
        inkOpacity: press.inkMaterial.opacity, inkVisible: press.ink.visible,
        pressState: info.pressState, impressionOpacity: info.impressionOpacity,
        camera: [camera.left, camera.right, camera.top, camera.bottom],
      };
      try {
        prepareScene(name, clamp(progress), w, h);
        const object = name === 'mark' ? mark.counterMesh : role === 'exit' ? press.ink : press.face;
        object.updateWorldMatrix(true, false); camera.updateMatrixWorld();
        const options = object.geometry.parameters.options;
        const z = options ? options.depth + (options.bevelEnabled ? options.bevelThickness : 0) : 0;
        const scale = (name === 'mark' ? 2.80 : 2.16) / 1400;
        const cx = (FONT.bounds[0] + FONT.bounds[2]) / 2;
        const project = (x, y) => {
          const v = new THREE.Vector3((x - cx) * scale, (700 - y) * scale, z);
          object.localToWorld(v); v.project(camera);
          return [(v.x + 1) * w / 2, (1 - v.y) * h / 2];
        };
        const a = project(0, 0), b = project(1400, 0), c = project(0, 1400);
        return [(b[0] - a[0]) / 1400, (b[1] - a[1]) / 1400, (c[0] - a[0]) / 1400, (c[1] - a[1]) / 1400, a[0], a[1]];
      } finally {
        mark.slab.rotation.copy(saved.markRotation); mark.lighting.key.position.x = saved.lightX;
        press.die.position.copy(saved.diePosition); press.die.rotation.copy(saved.dieRotation); press.paper.position.z = saved.paperZ;
        press.inkMaterial.opacity = saved.inkOpacity; press.ink.visible = saved.inkVisible;
        if (saved.pressState === undefined) delete info.pressState; else info.pressState = saved.pressState;
        if (saved.impressionOpacity === undefined) delete info.impressionOpacity; else info.impressionOpacity = saved.impressionOpacity;
        [camera.left, camera.right, camera.top, camera.bottom] = saved.camera; camera.updateProjectionMatrix();
      }
    },
    render({ scene = 'mark', progress = 0, reduced = false } = {}) {
      if (dead || lost) return false;
      const name = scene === 'press' ? 'press' : 'mark';
      const p = reduced ? 1 : clamp(progress);
      const state = `single:${name}:${p.toFixed(6)}:${width}:${height}`;
      if (state === last) return true;
      const selected = prepareScene(name, p, width, height);
      renderer.setRenderTarget(null);
      renderer.setViewport(0, 0, width, height);
      renderer.shadowMap.needsUpdate = true;
      try { renderer.render(selected, camera); last = state; info.renderMode = 'single'; return true; }
      catch (error) { return renderFailure(error); }
    },
    renderLayers({ layers = [] } = {}) {
      if (dead || lost) return false;
      const visible = (Array.isArray(layers) ? layers : []).slice(0, 2).map(layer => ({
        scene: layer.scene === 'press' ? 'press' : 'mark', progress: clamp(layer.progress),
        opacity: clamp(layer.opacity ?? 1), rect: layer.rect,
        sourceSize: Array.isArray(layer.sourceSize) && layer.sourceSize.length === 2 && layer.sourceSize.every(value => Number.isFinite(value) && value > 0) ? layer.sourceSize : null,
      })).filter(layer => layer.opacity > .00001 && Array.isArray(layer.rect) && layer.rect.length === 4 && layer.rect.every(Number.isFinite) && layer.rect[2] > 0 && layer.rect[3] > 0);
      const state = `layers:${width}:${height}:${JSON.stringify(visible)}`;
      if (state === last) return true;
      try {
        const composite = getCompositor();
        for (let i = 0; i < 2; i++) {
          const pass = composite.passes[i], layer = visible[i];
          pass.quad.visible = Boolean(layer);
          if (!layer) continue;
          const [x, y, w, h] = layer.rect;
          const [sourceW, sourceH] = layer.sourceSize || [w, h];
          const sourceX = layer.sourceSize ? 0 : x, sourceY = layer.sourceSize ? 0 : y;
          // Two RGBA8 textures cost at most twice the capped drawing buffer
          // (about 26.4 MB total at 4K). Whole-buffer copies preserve fractional
          // viewport placement and never sample outside a clipped rectangle.
          if (pass.texture.image.width !== canvas.width || pass.texture.image.height !== canvas.height) {
            pass.texture.dispose(); pass.texture = new THREE.FramebufferTexture(canvas.width, canvas.height);
            pass.texture.minFilter = pass.texture.magFilter = THREE.LinearFilter;
            pass.quad.material.uniforms.image.value = pass.texture; pass.key = null;
          }
          // A fixed sourceSize separates the expensive material capture from
          // its authored screen-space motion. Moving or scaling rect then
          // changes only the quad; the camera, texture and shadow stay cached.
          const key = `${layer.scene}:${layer.progress.toFixed(6)}:${sourceX}:${sourceY}:${sourceW}:${sourceH}`;
          if (key !== pass.key) {
            const scene = prepareScene(layer.scene, layer.progress, sourceW, sourceH);
            // Round the top inset and the extent separately in device pixels.
            // Rounding height-y-h instead can move a fractional-height layer
            // one full pixel when switching from its standalone canvas.
            const px = Math.round(sourceX * density), py = canvas.height - Math.round(sourceY * density) - Math.round(sourceH * density);
            renderer.setRenderTarget(null); renderer.setViewport(px / density, py / density, Math.round(sourceW * density) / density, Math.round(sourceH * density) / density);
            renderer.shadowMap.needsUpdate = true;
            renderer.render(scene, camera); renderer.copyFramebufferToTexture(pass.texture); pass.key = key;
          }
          if (layer.sourceSize) {
            const sx = w / sourceW, sy = h / sourceH;
            pass.quad.scale.set(sx, sy, 1);
            pass.quad.position.set(2 * x / width + sx - 1, 1 - 2 * y / height - sy, 0);
          } else {
            pass.quad.scale.set(1, 1, 1); pass.quad.position.set(0, 0, 0);
          }
          pass.quad.material.uniforms.layerOpacity.value = layer.opacity;
        }
        renderer.setRenderTarget(null); renderer.setViewport(0, 0, width, height);
        renderer.render(composite.scene, composite.camera);
        info.renderMode = 'layers';
        info.compositeTargets = composite.passes.map(pass => ({ width: pass.texture.image.width, height: pass.texture.image.height, bytesPerPixel: 4 }));
        last = state; return true;
      } catch (error) { return renderFailure(error); }
    },
    dispose() {
      if (dead) return; dead = true;
      canvas.removeEventListener('webglcontextlost', onLost); canvas.removeEventListener('webglcontextrestored', onRestore);
      const geometries = new Set(), materials = new Set();
      for (const graph of [mark.scene, press.scene]) graph.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.userData.ownedTexture) object.userData.ownedTexture.dispose();
        if (object.material) for (const m of Array.isArray(object.material) ? object.material : [object.material]) materials.add(m);
        if (object.shadow) object.shadow.dispose();
      });
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
      Object.values(maps).forEach(t => t.dispose()); environment.dispose(); disposeCompositor(); renderer.dispose();
      info.available = false;
    },
  };
  controller.resize(canvas.clientWidth || 900, canvas.clientHeight || 600);
  return controller;
}

window.CounterformMaterials = Object.freeze({ create, version: '1.1.0', threeRevision: '180' });
