import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createChair } from './chair.js';
import { createLamp, createTable } from './objects.js';
import { createMaterials } from './materials.js';
import { createDrafting } from './drafting.js';
import { clamp, mix, smooth } from '../director.js';

const WARM = new THREE.Color('#eeeae3');
const DARK = new THREE.Color('#22221f');

function falloffTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
  g.addColorStop(0, 'rgba(0,0,0,.38)');
  g.addColorStop(.25, 'rgba(0,0,0,.24)');
  g.addColorStop(.58, 'rgba(0,0,0,.08)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

function glowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,230,180,.9)');
  g.addColorStop(.35, 'rgba(255,226,172,.6)');
  g.addColorStop(.65, 'rgba(255,217,161,.18)');
  g.addColorStop(1, 'rgba(255,217,161,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** One renderer, one world, one camera. The application owns the only RAF. */
export class ObjectWorld {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = .95;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.localClippingEnabled = true;
    this.gl = this.renderer.getContext();
    this.frameFence = null;
    this.frameSubmittedAt = 0;
    this.slowFrames = 0;
    this.pixelBudget = 2800000;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(32, 1, .01, 60);
    this.projected = new THREE.Vector3();
    this.sceneColor = WARM.clone();
    this.materials = createMaterials(this.renderer);
    this.stageGroup = new THREE.Group();
    this.scene.add(this.stageGroup);
    this.chair = createChair(this.materials);
    this.lamp = createLamp(this.materials);
    this.table = createTable(this.materials);
    this.stageGroup.add(this.chair.group, this.lamp.group, this.table.group);
    this.setStudio();
    this.drafting = createDrafting({ scene: this.scene, chair: this.chair, lamp: this.lamp, table: this.table });
    this.width = 1; this.height = 1;
    this.resize();
  }

  setStudio() {
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const environment = new RoomEnvironment();
    this.environment = pmrem.fromScene(environment, .04);
    this.scene.environment = this.environment.texture;
    this.scene.environmentIntensity = .20;
    environment.dispose();
    pmrem.dispose();
    this.ambient = new THREE.HemisphereLight(0xfff5e4, 0x84786b, .25);
    this.scene.add(this.ambient);
    this.key = new THREE.DirectionalLight(0xfff6e9, 2.1);
    this.key.position.set(-1.7, 3.0, 2.2);
    this.key.target.position.set(0, .38, 0);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(2048, 2048);
    Object.assign(this.key.shadow.camera, { left: -2.2, right: 2.2, top: 2.3, bottom: -1.7, near: .1, far: 9 });
    this.key.shadow.bias = -.0002;
    this.key.shadow.normalBias = .0015;
    this.key.shadow.radius = 5;
    this.scene.add(this.key, this.key.target);
    this.fill = new THREE.DirectionalLight(0xe5edf5, .40);
    this.fill.position.set(2.5, 1.8, -.8);
    this.scene.add(this.fill);
    this.lampLight = new THREE.PointLight(0xffdc97, 0, 2.3, 2);
    this.scene.add(this.lampLight);
    this.shadowFloor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ color: 0x615347, opacity: .24 }));
    this.shadowFloor.rotation.x = -Math.PI / 2;
    this.shadowFloor.position.y = -.004;
    this.shadowFloor.receiveShadow = true;
    this.scene.add(this.shadowFloor);
    this.grid = new THREE.GridHelper(6, 30, 0x958b7d, 0xbbb2a5);
    this.grid.position.y = -.001;
    this.grid.material.transparent = true;
    this.grid.material.depthWrite = false;
    this.grid.material.opacity = 0;
    this.scene.add(this.grid);
    this.contactTexture = falloffTexture();
    this.contacts = ['chair', 'lamp', 'table'].map(name => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.contactTexture, transparent: true, opacity: .50, depthWrite: false }));
      mesh.name = `${name} / ambient contact`;
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = -.002;
      this.stageGroup.add(mesh);
      return mesh;
    });
    this.lightPoolTexture = glowTexture();
    this.lightPool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.lightPoolTexture, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.lightPool.rotation.x = -Math.PI / 2;
    this.lightPool.position.y = .001;
    this.stageGroup.add(this.lightPool);

    const roomMaterial = new THREE.MeshStandardMaterial({ color: 0xded7ca, roughness: 1, transparent: true, opacity: 0 });
    this.room = new THREE.Group();
    const vertical = new THREE.Mesh(new THREE.BoxGeometry(.045, 2.5, .7), roomMaterial);
    vertical.position.set(.92, .93, -.98);
    vertical.castShadow = true; vertical.receiveShadow = true;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(12, 5, .03), roomMaterial);
    wall.position.set(.2, 2.5, -1.40); wall.receiveShadow = true;
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(.8, .17, .5), roomMaterial);
    plinth.position.set(1.35, .081, -.94); plinth.castShadow = true; plinth.receiveShadow = true;
    this.room.add(wall, vertical, plinth);
    this.roomMaterial = roomMaterial;
    this.scene.add(this.room);
    this.roomFloor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ color: 0xe9e3d8, roughness: 1, transparent: true, opacity: 0 }));
    this.roomFloor.rotation.x = -Math.PI / 2;
    this.roomFloor.position.y = -.003;
    this.roomFloor.receiveShadow = true;
    this.scene.add(this.roomFloor);
    // Casters live on the shadow camera's layer, outside the viewer's layer.
    // They make a real studio-window shadow only in the final spatial hold.
    this.window = new THREE.Group();
    const windowMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
    for (const x of [-.8, -.15, .5]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(.055, .035, 3.0), windowMaterial);
      bar.position.set(x, 1.7, -.2);
      bar.castShadow = true;
      bar.layers.set(1);
      this.window.add(bar);
    }
    this.key.shadow.camera.layers.enable(1);
    this.scene.add(this.window);
  }

  resize() {
    this.width = this.canvas.clientWidth || window.innerWidth;
    this.height = this.canvas.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, this.width < 700 ? 1.6 : 1.5, Math.sqrt(this.pixelBudget / (this.width * this.height)));
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(this.width, this.height, false);
    this.pixelRatio = dpr;
  }

  canRender() {
    if (!this.frameFence) return true;
    // A nonblocking fence bounds work to one submitted GPU frame. Slow
    // devices discard intermediate poses instead of queuing obsolete views.
    const result = this.gl.clientWaitSync(this.frameFence, 0, 0);
    if (result === this.gl.TIMEOUT_EXPIRED) return false;
    this.gl.deleteSync(this.frameFence);
    this.frameFence = null;
    const elapsed = performance.now() - this.frameSubmittedAt;
    this.slowFrames = elapsed > 70 ? this.slowFrames + 1 : 0;
    if (this.slowFrames >= 4 && this.pixelBudget > 1100000) {
      this.pixelBudget = Math.max(1100000, this.pixelBudget * .78);
      this.slowFrames = 0;
      this.resize();
    }
    return result !== this.gl.WAIT_FAILED || !this.gl.isContextLost();
  }

  applyObject(object, x, y, z, scale, rotation) {
    object.group.position.set(x, y, z);
    object.group.rotation.set(0, rotation, 0);
    object.group.scale.setScalar(Math.max(.001, scale));
    object.group.visible = scale > .004;
  }

  update(state, controls, dt, time, intro = 1) {
    const s = state;
    this.stageGroup.rotation.y = (controls.orbit || 0) * s.final;
    const live = controls.reduced ? 0 : 1;
    const drift = Math.sin(time * .18) * .008 * live;
    this.applyObject(this.chair, s.cx, s.cy, s.cz, s.cs, s.cr + drift);
    this.applyObject(this.lamp, s.lx, s.ly, s.lz, s.ls, s.lr);
    this.applyObject(this.table, s.tx, s.ty, s.tz, s.ts, s.tr);
    this.chair.setExplode(s.ce * controls.structureFactor);
    // The surface study keeps the shell in the lens while the supporting
    // sleds continue down its assembly axis and leave the foreground.
    this.chair.frames.forEach(frame => { frame.position.y -= 1.4 * s.material; });
    this.chair.ties.position.y -= 1.4 * s.material;
    this.table.setExplode(controls.assemblyOpen === null ? s.te : controls.assemblyOpen * s.assembly);
    this.lamp.setExplode(s.le);
    this.chair.setReveal(s.chapter === 0 ? intro : 1);
    this.chair.outlines.visible = intro < 1 || s.dimensions > .01;
    this.chair.outlineMaterial.opacity = Math.max((1 - intro) * .75, s.dimensions * .075);
    const cut = (controls.section === null ? s.cut : controls.section / 100 * s.detail);
    this.lamp.setSection(cut);
    this.lamp.cable.visible = s.final < .1 && s.detail < .4;
    this.stageGroup.updateMatrixWorld(true);
    this.lamp.updateSectionPlane();
    this.materials.setFinish(controls.finish, controls.reduced ? 1 : 1 - Math.exp(-dt * 6));

    const aspect = this.width / this.height;
    // A compensating dolly preserves composition while the measuring chapter
    // approaches an orthographic lens. Perspective lets us see both a lamp's
    // underside and the floor it lights, as a real studio camera would.
    this.camera.fov = mix(32, 6, s.dimensions);
    this.camera.aspect = aspect;
    const distance = s.span / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)));
    this.camera.position.set(0, s.lookY + Math.sin(s.pitch) * distance, Math.cos(s.pitch) * distance);
    this.camera.lookAt(0, s.lookY, 0);
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();

    const lightTravel = (controls.light / 100 - .5) * 2.2 * s.light;
    const slowTravel = Math.sin(time * .13) * .16 * live;
    this.key.position.set(-1.7 + lightTravel + slowTravel + s.progress * .09, 3.0, 2.2);
    this.key.intensity = mix(2.1, 1.3, s.dark);
    this.ambient.intensity = mix(.25, .15, s.dark);
    this.fill.intensity = mix(.40, .50, s.dark);
    this.scene.environmentIntensity = mix(.20, .28, s.dark);
    this.scene.environmentRotation.y = .32 + lightTravel * .35 + Math.sin(time * .11) * .08 * live;
    this.sceneColor.copy(WARM).lerp(DARK, s.dark);
    this.shadowFloor.material.opacity = mix(.26, .55, s.dark) * (1 - s.room);
    this.shadowFloor.material.color.set(s.dark > .5 ? 0x000000 : 0x716050);
    this.grid.material.opacity = s.grid * .32;
    this.grid.visible = s.grid > .005;

    const sizes = [[.82, .70], [.28, .25], [.62, .57]];
    for (let i = 0; i < this.contacts.length; i++) {
      const obj = [this.chair, this.lamp, this.table][i].group;
      const shadow = this.contacts[i];
      shadow.visible = obj.visible;
      shadow.position.x = obj.position.x;
      shadow.position.z = obj.position.z;
      shadow.position.y = i === 1 ? Math.max(.001, obj.position.y + .001) : -.002;
      shadow.scale.set(sizes[i][0] * obj.scale.x, sizes[i][1] * obj.scale.x, 1);
      shadow.material.opacity = i === 1 ? .56 : .43;
    }
    this.lamp.diffuser.material.emissive.set('#ffd298');
    this.lamp.diffuser.material.emissiveIntensity = mix(.35, 1.1, s.dark) * (1 - .4 * s.detail);
    this.lampLight.position.copy(this.lamp.group.localToWorld(new THREE.Vector3(0, .23, 0)));
    this.lampLight.intensity = s.light * .9 + s.final * .12;
    this.lightPool.visible = s.light > .001;
    this.lightPool.position.set(s.lx + lightTravel * .08, .002, s.lz + .03);
    this.lightPool.scale.set(1.35 + controls.light / 400, 1.12, 1);
    this.lightPool.material.opacity = s.light * .48;
    this.room.visible = s.room > .001;
    this.roomMaterial.opacity = s.room;
    this.roomFloor.visible = s.room > .001;
    this.roomFloor.material.opacity = s.room;
    this.window.visible = s.room > .7;
    this.window.rotation.y = -.17 + slowTravel * .12;
    this.drafting.update({ ...s, ce: s.ce * controls.structureFactor, te: controls.assemblyOpen === null ? s.te : controls.assemblyOpen * s.assembly });
    this.renderer.render(this.scene, this.camera);
    this.frameFence = this.gl.fenceSync(this.gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    this.frameSubmittedAt = performance.now();
    this.gl.flush();
    return this.drafting.getAnnotations({ ...s, cut });
  }

  project(point) {
    this.projected.copy(point).project(this.camera);
    return { x: (this.projected.x * .5 + .5) * this.width, y: (-this.projected.y * .5 + .5) * this.height, visible: this.projected.z > -1 && this.projected.z < 1 };
  }

  dispose() {
    if (this.frameFence) { this.gl.deleteSync(this.frameFence); this.frameFence = null; }
    this.drafting.dispose();
    this.chair.dispose(); this.lamp.dispose(); this.table.dispose();
    this.materials.dispose();
    this.environment.dispose();
    this.contactTexture.dispose(); this.lightPoolTexture.dispose();
    const geometry = new Set(), materials = new Set();
    this.scene.traverse(o => { if (o.geometry) geometry.add(o.geometry); if (o.material) for (const m of [o.material].flat()) materials.add(m); });
    geometry.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
    this.renderer.dispose();
  }
}
