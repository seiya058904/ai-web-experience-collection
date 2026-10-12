import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createHandoff, lightingForState } from './handoff.js';
import {
  createTabletGeometry, createCutFaceGeometry, createGrainGeometry,
  createTabletTextures, createMetalTexture, createTabletFragments,
  tabletHalfHeightAt,
} from './geometry.js';

const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
function random(seed) { let n = seed >>> 0; return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; }; }
function material(base, patch = {}) {
  const m = base.clone(); Object.assign(m, patch); m.userData.baseOpacity = m.opacity;
  if (m.bumpMap?.name?.includes('compressed-powder')) {
    // Small pores occlude their own light. Keep this material cue in the shader
    // so that studio illumination cannot bleach the microscopic relief away.
    m.onBeforeCompile = shader => {
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
        #ifdef USE_BUMPMAP
          float dosePore = texture2D(bumpMap, vBumpMapUv).r;
          diffuseColor.rgb *= mix(0.62, 1.0, smoothstep(0.20, 0.535, dosePore));
        #endif`);
    };
    m.customProgramCacheKey = () => 'dose-powder-micro-occlusion-v1';
  }
  return m;
}
function makeRing(radius, color, opacity = .17, segments = 120) {
  const points = [];
  for (let i = 0; i < segments; i++) { const a = i / segments * TAU; points.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0)); }
  const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
  m.userData.baseOpacity = opacity;
  return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), m);
}
function punchGeometry(upper) {
  const r = upper ? .748 : .751, points = [], steps = 72;
  if (upper) {
    // A concave working end, cut from the very same shallow tablet crown.
    for (let i = 0; i <= steps; i++) { const x = r * i / steps;
      points.push(new THREE.Vector2(x, .75 * tabletHalfHeightAt(Math.min(1, x / .75), .23) - .1725)); }
    points.push(new THREE.Vector2(r, .66), new THREE.Vector2(0, .66));
  } else {
    points.push(new THREE.Vector2(0, -.39), new THREE.Vector2(r, -.39));
    for (let i = steps; i >= 0; i--) { const x = r * i / steps;
      points.push(new THREE.Vector2(x, .39 + .1725 - .75 * tabletHalfHeightAt(Math.min(1, x / .75), .23))); }
  }
  return new THREE.LatheGeometry(points, 112);
}
function shadowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 2, 64, 64, 64);
  g.addColorStop(0, 'rgba(25,32,28,.40)'); g.addColorStop(.3, 'rgba(25,32,28,.23)'); g.addColorStop(.65, 'rgba(25,32,28,.075)'); g.addColorStop(1, 'rgba(25,32,28,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
}

// This class owns no clock. All changes are pure functions of the outer scroll timeline.
class PowderCloud {
  constructor(owner, count, seed, kind = 'blend') {
    this.group = new THREE.Group(); this.kind = kind; this.count = count;
    this.items = []; this.meshes = []; this.materials = []; this.dummy = new THREE.Object3D();
    const rng = random(seed); const counts = [0, 0, 0];
    for (let i = 0; i < count; i++) {
      const p = rng(); const type = p < .15 ? 0 : p < .79 ? 1 : 2;
      const r = Math.sqrt((i + .5) / count) * .95, angle = i * 2.39996323;
      const tx = Math.cos(angle) * r, tz = Math.sin(angle) * r;
      const ty = (rng() - .5) * 1.25;
      const a = type / 3 * TAU + .4;
      const cx = Math.cos(a) * .43, cy = Math.sin(a) * .35;
      this.items.push({ type, index: counts[type]++, tx, ty, tz, sx: cx + (rng() - .5) * .68,
        sy: cy + (rng() - .5) * .54, sz: (rng() - .5) * .6, size: .037 + Math.pow(rng(), 1.9) * .061,
        rx: rng() * TAU, ry: rng() * TAU, rz: rng() * TAU, phase: rng() * TAU, jitter: rng() });
    }
    for (let i = 0; i < 3; i++) {
      const m = material(owner.grainMaterials[i]); this.materials.push(m);
      const mesh = new THREE.InstancedMesh(owner.grainGeometries[i], m, counts[i]);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.frustumCulled = false;
      this.group.add(mesh); this.meshes.push(mesh);
    }
    this.update(0, 0, false, 'high');
  }
  update(progress, time, motion, quality, press = null) {
    const low = quality === 'low', stride = low ? 3 : 1, used = [0, 0, 0];
    const d = this.dummy, t = smooth(.10, .65, progress);
    for (let i = 0; i < this.items.length; i += stride) {
      const p = this.items[i]; let x, y, z, sy = 1;
      if (this.kind === 'press') {
        x = p.tx * .73; z = p.tz * .73;
        y = (p.ty / 1.25 + .5) * mix(.61, .27, press?.compress || 0) + mix(-.64, -.51, press?.compress || 0);
        sy = mix(1, .65, press?.compress || 0);
      } else {
        x = mix(p.sx, p.tx, t); y = mix(p.sy, p.ty, t); z = mix(p.sz, p.tz, t);
        // The hold is almost still. The precomputed trajectory is reversible and does not orbit.
        if (motion) y += Math.sin(time * .32 + p.phase) * .004;
      }
      const s = p.size * (low ? 1.2 : 1) * (this.kind === 'press' ? .64 : 1);
      d.position.set(x, y, z); d.rotation.set(p.rx, p.ry + t * .22, p.rz);
      d.scale.set(s * (p.type === 0 ? .74 : 1), s * sy * (p.type === 0 ? 1.5 : .9), s);
      d.updateMatrix(); this.meshes[p.type].setMatrixAt(used[p.type]++, d.matrix);
    }
    this.meshes.forEach((m, i) => { m.count = used[i]; m.instanceMatrix.needsUpdate = true; });
    this.visibleCount = used[0] + used[1] + used[2];
  }
}

export class DoseScene {
  constructor(canvas, { onReady, onError, onQualityChange } = {}) {
    this.canvas = canvas; this.callbacks = { onReady, onError, onQualityChange };
    this.disposed = false; this.failed = false; this.currentQuality = 'high'; this.activeScene = 0;
    this.alignHandoff = createHandoff();
    this.width = 1; this.height = 1; this.mobile = false; this.pixelRatio = 1; this._cutDepth = -1;
    this._dummy = new THREE.Object3D(); this._cutNormal = new THREE.Vector3(-1, 0, 0); this._normalMatrix = new THREE.Matrix3();
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0); this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = .91;
    this.renderer.localClippingEnabled = true;
    this.scene = new THREE.Scene(); this.camera = new THREE.OrthographicCamera(-5, 5, 3, -3, .1, 60);
    this.camera.position.set(0, 0, 12); this.camera.lookAt(0, 0, 0);
    this._resources = [];
    const hemi = new THREE.HemisphereLight(0xfffdf4, 0x748078, .42);
    this.key = new THREE.DirectionalLight(0xfffcf3, 1.65); this.key.position.set(-4, 6, 8);
    this.fill = new THREE.DirectionalLight(0xe2eeea, .22); this.fill.position.set(5, 1, 5);
    this.rim = new THREE.DirectionalLight(0xffffff, 1.1); this.rim.position.set(2, 5, -5);
    this.scene.add(hemi, this.key, this.fill, this.rim);
    const room = new RoomEnvironment(); const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.environment = pmrem.fromScene(room, .055, .1, 40); this.scene.environment = this.environment.texture; this.scene.environmentIntensity = .30;
    room.dispose(); pmrem.dispose();
    this.textures = createTabletTextures(); this.metalTexture = createMetalTexture();
    this.tabletGeometry = createTabletGeometry();
    this.tabletMaterial = new THREE.MeshStandardMaterial({ color: 0xe6e4d9, map: this.textures.color,
      roughness: 1, roughnessMap: this.textures.roughness, metalness: 0, bumpMap: this.textures.bump,
      bumpScale: .02, normalMap: this.textures.normal, normalScale: new THREE.Vector2(.85, .85), envMap: this.environment.texture, envMapIntensity: .32 });
    this.grainGeometries = [createGrainGeometry(0, 0), createGrainGeometry(1, 1), createGrainGeometry(2, 0)];
    this.grainMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x8aa99a, roughness: .58, metalness: 0, envMap: this.environment.texture, envMapIntensity: .48, flatShading: true }),
      new THREE.MeshStandardMaterial({ color: 0xd2d0c1, roughness: 1, map: this.textures.color, bumpMap: this.textures.bump, bumpScale: .02, normalMap: this.textures.normal, normalScale: new THREE.Vector2(1.0, 1.0), envMap: this.environment.texture, envMapIntensity: .21 }),
      new THREE.MeshStandardMaterial({ color: 0xa6ad9f, roughness: .93, envMap: this.environment.texture, envMapIntensity: .27, flatShading: true }),
    ];
    this.metalMaterial = new THREE.MeshStandardMaterial({ color: 0xaeb7b6, metalness: 1, roughness: .30,
      roughnessMap: this.metalTexture, bumpMap: this.metalTexture, bumpScale: .018, envMap: this.environment.texture, envMapIntensity: .9 });
    this.shadowMap = shadowTexture(); this.stages = [];
    for (let i = 0; i < 7; i++) { const g = new THREE.Group(); g.visible = false; g.name = `dose-chapter-${i}`; g.userData.materials = []; this.scene.add(g); this.stages.push(g); }
    this._buildHero(); this._buildMaterials(); this._buildDistribution(); this._buildPress();
    this._buildSurface(); this._buildEvidence(); this._buildRelease();
    this.stages.forEach(g => { const set = new Set(); g.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => {
      if (m.userData.baseOpacity === undefined) m.userData.baseOpacity = m.opacity;
      set.add(m);
    }); }); g.userData.materials = [...set]; });
    this.resize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight, window.devicePixelRatio || 1);
    this.update({ scene: 0, local: 0, transition: 0, time: 0, pointer: { x: 0, y: 0 }, observeDepth: .35, motion: false, quality: 'high' });
    queueMicrotask(() => { if (!this.disposed) onReady?.(); });
  }
  _tablet(patch = {}) { return new THREE.Mesh(this.tabletGeometry, material(this.tabletMaterial, patch)); }
  _shadow(group, x = 0, y = -.88, width = 1.85, height = .31, opacity = .28) {
    const m = new THREE.MeshBasicMaterial({ map: this.shadowMap, transparent: true, opacity, depthWrite: false, toneMapped: false });
    m.userData.baseOpacity = opacity; const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m);
    mesh.position.set(x, y, -1.35); mesh.scale.set(width, height, 1); group.add(mesh); return mesh;
  }
  _buildHero() {
    const g = this.stages[0]; this.hero = this._tablet(); g.add(this.hero);
    this.heroRing = makeRing(1.10, 0x7c9e96, .19); this.heroRing.position.z = -.8; g.add(this.heroRing);
    this.heroShadow = this._shadow(g, .16, -.88, 1.95, .29, .34);
  }
  _buildMaterials() {
    const g = this.stages[1], rng = random(613); this.materialObjects = [];
    const specs = [
      [1, -.38, .36, -.12, .48], [0, .53, -.10, .16, .31], [1, .31, .57, -.34, .17],
      [0, -.70, -.35, .08, .17], [2, .12, -.53, .28, .16], [1, .50, -.57, -.13, .13],
    ];
    for (const [type, x, y, z, scale] of specs) {
      const geometry = createGrainGeometry(type, type === 1 ? 5 : type === 0 ? 4 : 1);
      const grainMaterial = type === 0 ? new THREE.MeshPhysicalMaterial({ color: 0x83a493, roughness: .33, metalness: 0,
        clearcoat: .13, clearcoatRoughness: .38, envMap: this.environment.texture, envMapIntensity: .65,
        normalMap: this.textures.normal, normalScale: new THREE.Vector2(.15, .15) })
        : material(this.grainMaterials[type], { normalScale: new THREE.Vector2(1.1, 1.1), bumpScale: .02 });
      const mesh = new THREE.Mesh(geometry, grainMaterial);
      mesh.position.set(x, y, z); mesh.rotation.set(rng() * 3, rng() * 3, rng() * 3);
      mesh.scale.set(scale, scale * (type === 0 ? 1.62 : 1.1), scale * (type === 0 ? .67 : 1));
      mesh.userData.start = mesh.position.clone(); mesh.userData.rotation = mesh.rotation.clone();
      g.add(mesh); this.materialObjects.push(mesh);
    }
    this.materialDust = new THREE.InstancedMesh(this.grainGeometries[2], material(this.grainMaterials[2]), 42);
    const d = this._dummy;
    for (let i = 0; i < 42; i++) { const a = rng() * TAU, r = .42 + rng() * .45, s = .016 + rng() * .04;
      d.position.set(Math.cos(a) * r, Math.sin(a) * r * .74 - .08, rng() * .4); d.rotation.set(rng() * 5, rng() * 5, rng() * 5); d.scale.setScalar(s); d.updateMatrix(); this.materialDust.setMatrixAt(i, d.matrix); }
    g.add(this.materialDust); this._shadow(g, -.14, -.78, 1.78, .19, .2);
  }
  _buildDistribution() {
    const g = this.stages[2]; this.blend = new PowderCloud(this, 1020, 91373); g.add(this.blend.group);
    this.blendRing = makeRing(1.05, 0x6d8a80, .16); this.blendRing.scale.y = .81; this.blendRing.position.z = -1.1; g.add(this.blendRing);
    this._shadow(g, .06, -.97, 1.9, .26, .24);
  }
  _buildPress() {
    const g = this.stages[3]; this.pressRig = new THREE.Group(); g.add(this.pressRig);
    const ringProfile = [[.78, -.74], [1.40, -.74], [1.45, -.69], [1.45, -.065], [1.41, -.02], [.81, -.02], [.78, -.052], [.78, -.74]].map(([x,y]) => new THREE.Vector2(x,y));
    this.die = new THREE.Mesh(new THREE.LatheGeometry(ringProfile, 112), material(this.metalMaterial));
    this.pressRig.add(this.die);
    // A true annulus: neither a flat disc painted dark, nor a solid cylinder with a decal.
    const edge = new THREE.Mesh(new THREE.TorusGeometry(1.41, .011, 6, 112), material(this.metalMaterial, { roughness: .18 }));
    edge.rotation.x = Math.PI / 2; edge.position.y = -.02; this.pressRig.add(edge);
    const inner = new THREE.Mesh(new THREE.TorusGeometry(.798, .009, 6, 100), material(this.metalMaterial, { roughness: .17 }));
    inner.rotation.x = Math.PI / 2; inner.position.y = -.021; this.pressRig.add(inner);
    this.lowerPunch = new THREE.Mesh(punchGeometry(false), material(this.metalMaterial, { roughness: .24 }));
    this.lowerPunch.position.y = -1.065; this.pressRig.add(this.lowerPunch);
    this.upperPunch = new THREE.Group();
    const tip = new THREE.Mesh(punchGeometry(true), material(this.metalMaterial, { roughness: .24 }));
    tip.position.y = 0; this.upperPunch.add(tip);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(.925, .925, .28, 96), material(this.metalMaterial, { roughness: .27 }));
    collar.position.y = .8; this.upperPunch.add(collar);
    const seam = new THREE.Mesh(new THREE.TorusGeometry(.92, .008, 6, 100), material(this.metalMaterial, { roughness: .18 }));
    seam.rotation.x = Math.PI / 2; seam.position.y = .66; this.upperPunch.add(seam);
    this.pressRig.add(this.upperPunch);
    this.pressPowder = new PowderCloud(this, 660, 8256, 'press'); this.pressRig.add(this.pressPowder.group);
    this.pressedTablet = this._tablet(); this.pressedTablet.scale.setScalar(.75); this.pressRig.add(this.pressedTablet);
    this._shadow(g, .08, -1.05, 2.9, .38, .28);
  }
  _buildSurface() {
    const g = this.stages[4];
    this.surfaceClips = [new THREE.Plane(new THREE.Vector3(1, 0, 0), 0), new THREE.Plane(new THREE.Vector3(0, -1, 0), 3), new THREE.Plane(new THREE.Vector3(0, 1, 0), 3)];
    this.surface = this._tablet({ bumpScale: .02, roughness: 1, normalScale: new THREE.Vector2(1.30, 1.30), clippingPlanes: this.surfaceClips }); g.add(this.surface);
    this.surfaceRing = makeRing(1.075, 0x889e93, .13); this.surfaceRing.position.z = -.65; g.add(this.surfaceRing);
    // A cropped macro field has no floating-object floor shadow.
    this.surfaceShadow = this._shadow(g, .16, -.93, 2.02, .29, .28); this.surfaceShadow.visible = false;
  }
  _buildEvidence() {
    const g = this.stages[5]; this.evidenceRig = new THREE.Group(); g.add(this.evidenceRig);
    this.cutPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), .4);
    this.cutTablet = this._tablet({ clippingPlanes: [this.cutPlane], clipShadows: false, side: THREE.DoubleSide, bumpScale: .025 });
    this.evidenceRig.add(this.cutTablet);
    this.cutFace = new THREE.Mesh(createCutFaceGeometry(.4), material(this.tabletMaterial, { color: new THREE.Color(0xc7cab5), bumpScale: .02, normalScale: new THREE.Vector2(1.25, 1.25), roughness: 1, side: THREE.DoubleSide }));
    this.evidenceRig.add(this.cutFace);
    this.cutGrains = new THREE.InstancedMesh(this.grainGeometries[1], material(this.grainMaterials[1], { color: new THREE.Color(0xd7d8c8), roughness: 1 }), 480);
    this.cutGrains.frustumCulled = false; this.evidenceRig.add(this.cutGrains);
    const rng = random(948274); this.cutSeeds = Array.from({ length: 480 }, () => ({ z: rng() * 2 - 1, y: rng() * 2 - 1, s: .004 + rng() * .013, a: rng() * TAU }));
    this.evidenceRing = makeRing(1.12, 0xc4d1b8, .27); this.evidenceRing.position.z = -.9; g.add(this.evidenceRing);
  }
  _buildRelease() {
    const g = this.stages[6]; this.releaseRig = new THREE.Group(); g.add(this.releaseRig);
    this.releaseTablet = this._tablet(); this.releaseRig.add(this.releaseTablet); this.fragments = [];
    const rng = random(9366);
    for (const { geometry, center } of createTabletFragments()) {
      const shell = material(this.tabletMaterial, { roughness: 1, bumpScale: .025 });
      const core = material(this.tabletMaterial, { color: new THREE.Color(0xcdcdbc), roughness: 1, bumpScale: .025, normalScale: new THREE.Vector2(1.15, 1.15) });
      const mesh = new THREE.Mesh(geometry, [shell, core]);
      mesh.userData.angle = Math.atan2(center.x, center.z); mesh.userData.seed = rng();
      mesh.userData.homeX = center.x; mesh.userData.homeZ = center.z;
      this.releaseRig.add(mesh); this.fragments.push(mesh);
    }
    this.releaseDust = new THREE.InstancedMesh(this.grainGeometries[1], material(this.grainMaterials[1]), 420);
    this.releaseDust.frustumCulled = false; this.releaseRig.add(this.releaseDust);
    this.releaseSeeds = Array.from({ length: 420 }, (_, i) => ({ a: i * 2.39996323, r: Math.sqrt(rng()) * .94,
      y: (rng() - .5) * .2, drift: .15 + rng() * .8, s: .014 + rng() * .028, phase: rng() * TAU }));
    this.releaseRings = [];
    for (let i = 0; i < 3; i++) { const r = makeRing(.75 + i * .23, 0x7caaa2, .11 - i * .025); r.scale.y = .32; r.position.set(0, -.73, -.85 - i * .02); g.add(r); this.releaseRings.push(r); }
    this._shadow(g, .04, -.80, 1.94, .28, .15);
  }
  _fadeStage(g, amount) {
    g.visible = amount > .0001; g.userData.weight = amount;
    if (!g.visible) return;
    for (const m of g.userData.materials) {
      const opacity = m.userData.baseOpacity * amount;
      m.opacity = opacity; const transparent = opacity < .999 || Boolean(m.map === this.shadowMap);
      if (m.transparent !== transparent) { m.transparent = transparent; m.needsUpdate = true; }
      m.depthWrite = opacity > .985 && m.map !== this.shadowMap;
    }
  }
  _setOpacity(mesh, amount, stageWeight = 1) {
    const materials = mesh.material, multiple = Array.isArray(materials); let visible = false;
    for (let i = 0, count = multiple ? materials.length : 1; i < count; i++) {
      const m = multiple ? materials[i] : materials;
      m.opacity = amount * stageWeight * m.userData.baseOpacity;
      const transparent = m.opacity < .999;
      if (m.transparent !== transparent) { m.transparent = transparent; m.needsUpdate = true; }
      m.depthWrite = m.opacity > .985; visible ||= m.opacity > .002;
    }
    mesh.visible = visible;
  }
  resize(width, height, dpr = 1) {
    if (this.disposed) return;
    this.width = Math.max(1, width); this.height = Math.max(1, height); this.mobile = this.width < 700; this.portrait = !this.mobile && this.height >= this.width;
    const aspect = this.width / this.height; this.aspect = aspect;
    this.camera.left = -3 * aspect; this.camera.right = 3 * aspect; this.camera.top = 3; this.camera.bottom = -3;
    this.camera.updateProjectionMatrix();
    this.pixelRatio = Math.min(dpr || 1, this.mobile ? 1.25 : 1.5, Math.sqrt(3000000 / (this.width * this.height)));
    this.renderer.setPixelRatio(this.pixelRatio); this.renderer.setSize(this.width, this.height, false);
    this.anchorX = this.mobile ? 0 : 1.2 * aspect;
    this.anchorY = this.mobile ? -.39 : -.045;
    this.subjectScale = this.mobile ? 2.46 * aspect : Math.min(2.52, 1.32 * aspect);
  }
  _poseStage(index, local, handoff, time, pointer, depth, motion, weight) {
    const g = this.stages[index], base = this.subjectScale, breathing = motion ? Math.sin(time * .42) * .008 : 0;
    g.position.set(this.anchorX, this.anchorY, 0); g.rotation.set(0, 0, 0); g.scale.setScalar(base);
    const px = motion ? clamp(pointer?.x || 0, -1, 1) : 0, py = motion ? clamp(pointer?.y || 0, -1, 1) : 0;
    if (index === 0) {
      this.hero.rotation.set(.82 + py * .025, -.07 + px * .028, .55 + px * .01);
      this.hero.scale.setScalar((1 + breathing) * (1 + handoff * .72));
      this.hero.position.set(handoff * .68, handoff * .04, handoff * .4);
      this.heroRing.visible = !this.mobile;
      this.heroRing.scale.setScalar(Math.min(1, 2.30 / (base * 1.10)) * (1 + handoff * .2)); this.heroRing.material.opacity = .19 * weight * (1 - handoff);
      this.heroShadow.material.opacity = .34 * weight * (1 - handoff * .8);
    } else if (index === 1) {
      if (this.mobile) g.position.y += .20;
      g.scale.setScalar(base * (1 - handoff * .14));
      for (let i = 0; i < this.materialObjects.length; i++) { const m = this.materialObjects[i], p = m.userData.start, r = m.userData.rotation;
        m.position.set(p.x * (1 - handoff * .3), p.y * (1 - handoff * .3) + (motion ? Math.sin(time * .3 + i) * .009 : 0), p.z);
        m.rotation.set(r.x + local * .10, r.y + local * .18, r.z); }
      g.rotation.z = -.03 + local * .02;
    } else if (index === 2) {
      this.blend.update(local, time, motion, this.currentQuality);
      this.blend.group.rotation.set(.16, local * .16, -.08);
      this.blend.group.scale.setScalar(1 - handoff * .51);
      this.blend.group.position.y = -handoff * .28;
      this.blendRing.material.opacity = .16 * weight * (1 - handoff);
    } else if (index === 3) {
      const scale = this.mobile ? Math.min(base * .56, .67) : base * .60;
      g.scale.setScalar(scale); g.position.y = this.mobile ? -.24 : -.12;
      this.pressRig.rotation.set(.24, -.13, 0);
      const approach = smooth(.12, .38, local), compress = smooth(.42, .54, local), eject = smooth(.66, .78, local), retract = smooth(.60, .70, local);
      this.upperPunch.position.y = mix(.59, .12, approach) - compress * .29 + retract * 1.25;
      const lowerTop = -.675 + compress * .16 + eject * .87;
      this.lowerPunch.position.y = lowerTop - .39;
      this.pressedTablet.position.y = lowerTop + .1725;
      const formed = smooth(.43, .56, local);
      this._setOpacity(this.pressedTablet, formed, weight);
      this.pressPowder.update(local, time, false, this.currentQuality, { compress });
      for (const m of this.pressPowder.materials) { m.opacity = weight * (1 - formed); const transparent = m.opacity < .999; if (m.transparent !== transparent) { m.transparent = transparent; m.needsUpdate = true; } m.depthWrite = m.opacity > .985; }
      this.pressPowder.group.visible = formed < .999;
      // The ejected tablet carries the circular composition to the macro surface view.
      this.pressedTablet.rotation.set(handoff * .75, handoff * -.09, handoff * .5);
      this.pressedTablet.position.y += handoff * .24;
      this.pressedTablet.scale.setScalar(.75 * (1 + handoff * .37));
    } else if (index === 4) {
      const magnification = mix(this.mobile ? 1.88 : 1.80, 1.08, handoff);
      g.scale.setScalar(base * magnification);
      g.position.x += base * (this.mobile ? .31 : .49) * (1 - handoff);
      g.position.y -= base * (this.mobile ? .04 : this.portrait ? .22 : .57) * (1 - handoff);
      this.surface.rotation.set(mix(.58, .82, handoff) + local * .018, -.12, mix(.15, .45, handoff));
      this.surface.scale.setScalar(1 + breathing * .2);
      this.surfaceClips[0].constant = this.mobile ? this.aspect * 3 : this.aspect * .42;
      this.surfaceClips[1].constant = this.mobile ? 1.02 : 2.58;
      this.surfaceClips[2].constant = this.mobile || this.portrait ? 1.30 : 2.22;
      this.surfaceRing.visible = false;
    } else if (index === 5) {
      if (this.mobile) { g.position.y = .19; g.scale.setScalar(base * .85); }
      this.evidenceRing.visible = !this.mobile;
      this.evidenceRing.scale.setScalar(Math.min(1, 1.49 / (base * 1.12)));
      this.evidenceRig.rotation.set(.83, -.69, .37);
      this.evidenceRig.scale.setScalar(.97);
      this._updateCutaway(depth);
      this.evidenceRing.rotation.z = .15; this.evidenceRing.material.opacity = .27 * weight;
    } else if (index === 6) {
      const broken = smooth(.10, .62, local), dispersed = smooth(.27, .82, local);
      g.scale.setScalar(base * (this.mobile ? .86 : .94));
      if (this.mobile) g.position.y = -.08;
      this.releaseRig.rotation.set(.88, -.12, .43);
      this.releaseRig.position.y = -.02;
      this._setOpacity(this.releaseTablet, 1 - smooth(.09, .24, local), weight);
      for (let i = 0; i < this.fragments.length; i++) {
        const mesh = this.fragments[i], a = mesh.userData.angle, seed = mesh.userData.seed;
        mesh.position.set(mesh.userData.homeX + Math.sin(a) * broken * (.045 + seed * .19), -broken * (.05 + seed * .10) - dispersed * .10,
          mesh.userData.homeZ + Math.cos(a) * broken * (.045 + seed * .19));
        mesh.rotation.set(broken * (seed - .5) * 1.15, broken * (seed - .5) * .75, broken * (seed - .5) * 1.1);
        mesh.scale.setScalar(1 - dispersed * (.44 + seed * .23));
        this._setOpacity(mesh, smooth(.08, .18, local) * (1 - dispersed * .45), weight);
      }
      const d = this._dummy, stride = this.currentQuality === 'low' ? 3 : 1; let count = 0;
      for (let i = 0; i < this.releaseSeeds.length; i += stride) { const p = this.releaseSeeds[i], spread = p.r + broken * p.drift * .18;
        d.position.set(Math.sin(p.a) * spread, p.y * (1 - dispersed) - dispersed * (.2 + p.drift * .15), Math.cos(p.a) * spread);
        d.rotation.set(p.phase + broken * .3, p.phase, p.phase * .5);
        const size = p.s * smooth(.14, .38, local) * (1 - dispersed * .25); d.scale.setScalar(size); d.updateMatrix(); this.releaseDust.setMatrixAt(count++, d.matrix); }
      this.releaseDust.count = count; this.releaseDust.instanceMatrix.needsUpdate = true;
      this._setOpacity(this.releaseDust, smooth(.16, .32, local) * .8, weight);
      this.releaseRings.forEach((r, i) => { const pulse = motion ? Math.sin(time * .5 - i) * .015 : 0; r.scale.x = 1 + broken * .1 + pulse;
        r.scale.y = .32 * r.scale.x; r.material.opacity = (.11 - i * .025) * weight * (.7 + dispersed * .3); });
    }
  }
  _updateCutaway(depth) {
    const value = clamp(depth ?? .35), cutX = mix(.91, -.52, value);
    if (Math.abs(value - this._cutDepth) > .0015) {
      this._cutDepth = value; this.cutFace.geometry.dispose(); this.cutFace.geometry = createCutFaceGeometry(cutX);
      const d = this._dummy, zSpan = Math.sqrt(Math.max(0, 1 - cutX * cutX));
      for (let i = 0; i < this.cutSeeds.length; i++) { const p = this.cutSeeds[i], z = p.z * zSpan * .98;
        const radius = Math.sqrt(cutX * cutX + z * z), h = tabletHalfHeightAt(radius, .23);
        d.position.set(cutX + .004, p.y * Math.max(.008, h - .006), z); d.rotation.set(p.a, p.a * .6, p.a * .3);
        d.scale.set(p.s * .26, p.s, p.s); d.updateMatrix(); this.cutGrains.setMatrixAt(i, d.matrix); }
      this.cutGrains.instanceMatrix.needsUpdate = true;
    }
    this.evidenceRig.updateWorldMatrix(true, false);
    this._normalMatrix.getNormalMatrix(this.evidenceRig.matrixWorld);
    this.cutPlane.set(this._cutNormal, cutX).applyMatrix4(this.evidenceRig.matrixWorld, this._normalMatrix);
  }
  update({ scene = 0, local = 0, transition = 0, time = 0, pointer, observeDepth = .35, motion = true, quality = 'high' } = {}) {
    if (this.disposed || this.failed) return;
    const nextQuality = quality === 'low' ? 'low' : 'high';
    if (nextQuality !== this.currentQuality) { this.currentQuality = nextQuality; this.callbacks.onQualityChange?.(nextQuality); }
    const index = clamp(Math.floor(scene), 0, 6), t = index < 6 ? clamp(transition) : 0;
    this.activeScene = index; this._lastTime = time;
    for (let i = 0; i < 7; i++) this._fadeStage(this.stages[i], i === index ? 1 - t : i === index + 1 ? t : 0);
    this._poseStage(index, clamp(local), t, time, pointer, observeDepth, motion, 1 - t);
    if (t > .0001 && index < 6) this._poseStage(index + 1, 0, 0, time, pointer, observeDepth, motion, t);
    if (t > .0001 && index < 6) {
      const subjects = [this.hero, this.stages[1], this.blend.group, this.pressedTablet,
        this.surface, this.evidenceRig, this.releaseRig];
      this.alignHandoff(subjects[index], subjects[index + 1], t);
      if (index === 3) {
        const machinery = (1 - t) * (1 - smooth(.02, .55, t));
        for (const part of this.pressRig.children) {
          if (part !== this.pressedTablet && part.material) this._setOpacity(part, 1, machinery);
        }
      }
      if (index === 4 || index === 5) this._updateCutaway(observeDepth);
    }
    const lighting = lightingForState(index, t);
    const macroLight = lighting.macro;
    this.key.position.set(mix(-4, -6, macroLight), mix(6, 2, macroLight), mix(8, 3, macroLight));
    this.key.intensity = lighting.key;
    this.rim.intensity = lighting.rim;
    this.scene.updateMatrixWorld();
  }
  render() {
    if (this.disposed || this.failed || this.renderer.getContext().isContextLost()) return;
    try { this.renderer.render(this.scene, this.camera); } catch (error) { this.failed = true; this.callbacks.onError?.(error); }
  }
  pause() { /* No private timers, integrators, or animation loops to suspend. */ }
  getStats() {
    return { webgl: true, quality: this.currentQuality, activeScene: this.activeScene, pixelRatio: this.pixelRatio,
      width: this.width, height: this.height, drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles, textures: this.renderer.info.memory.textures,
      geometries: this.renderer.info.memory.geometries, blendParticles: this.blend?.visibleCount || 0,
      renderWidth: this.renderer.domElement.width, renderHeight: this.renderer.domElement.height };
  }
  dispose() {
    if (this.disposed) return; this.disposed = true;
    const geometries = new Set(), materials = new Set(), textures = new Set();
    this.scene.traverse(o => { if (o.geometry) geometries.add(o.geometry); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m)); });
    materials.add(this.tabletMaterial); materials.add(this.metalMaterial); this.grainMaterials.forEach(m => materials.add(m));
    for (const m of materials) for (const value of Object.values(m)) if (value?.isTexture) textures.add(value);
    textures.delete(this.environment?.texture); this.environment?.dispose(); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); this.renderer.dispose();
  }
}
