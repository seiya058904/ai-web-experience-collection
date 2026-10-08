import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { createWaferModel, type WaferModel } from './wafer';
import { createBuildModel, createInterconnectModel, createTransistorModel } from './micro';
import { createPackageModel, type PackageModel } from './package';
import { clamp, disposeTree, mix, smooth, type ExhibitModel, type SceneState } from './shared';
import { FallbackStage } from './fallback';
import { createStructuralHandoff, continuousSceneProgress, type StructuralHandoff } from './handoff';

export interface StageSettings { reduced: boolean; paused: boolean; gate: number; spread: number; exposure: number; power: number; }

export class SiliconStage {
  private renderer?: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(27, 1, .1, 100);
  private rig = new THREE.Group();
  private wafer!: WaferModel;
  private build!: ExhibitModel;
  private transistor!: ExhibitModel;
  private interconnect!: ExhibitModel;
  private package!: PackageModel;
  private models: ExhibitModel[] = [];
  private fallback?: FallbackStage;
  private environment?: THREE.WebGLRenderTarget;
  private handoff?: StructuralHandoff;
  private progress = 0;
  private elapsed = 0;
  private lastTime = 0;
  private lastRenderTime = 0;
  private dirty = true;
  private mobile = false;
  private compactLandscape = false;
  private width = 1;
  private height = 1;
  private pointer = new THREE.Vector2();
  private pointerTarget = new THREE.Vector2();
  private settings: StageSettings = { reduced: false, paused: false, gate: 1, spread: -1, exposure: -1, power: -1 };
  private quality = 1;
  private frameHistory: number[] = [];
  private qualitySamples = 0;
  readonly canvas: HTMLCanvasElement;

  constructor(private container: HTMLElement, private onViewMode: (fallback: boolean) => void) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'artwork-canvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    container.append(this.canvas);
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = .98;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFShadowMap;
      this.renderer.setClearColor(0x080a0b, 0);
      this.makeStudio();
      this.wafer = createWaferModel();
      this.build = createBuildModel();
      this.transistor = createTransistorModel();
      this.interconnect = createInterconnectModel();
      this.package = createPackageModel();
      this.models = [this.wafer, this.build, this.transistor, this.interconnect, this.package];
      for (const model of this.models) {
        model.group.traverse(object => {
          if (!(object instanceof THREE.Mesh)) return;
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          const physical = materials.some(material => material instanceof THREE.MeshStandardMaterial);
          object.castShadow = physical;
          object.receiveShadow = physical;
        });
        this.rig.add(model.group);
      }
      this.renderer.localClippingEnabled = true;
      this.handoff = createStructuralHandoff(this.rig, {
        wafer: this.wafer.group, build: this.build.group, transistor: this.transistor.group,
        interconnect: this.interconnect.group, package: this.package.group,
      });
      this.scene.add(this.rig);
      this.canvas.addEventListener('webglcontextlost', this.onContextLost);
      this.canvas.addEventListener('webglcontextrestored', this.onContextRestored);
    } catch (error) {
      console.info('SILICON: using the lightweight exhibit renderer.', error instanceof Error ? error.message : '3D unavailable');
      this.enableFallback();
    }
    this.resize();
  }

  private onContextLost = (event: Event) => {
    event.preventDefault();
    // Detach the previous generation's disposal listeners while its context is
    // lost. Restoring must never delete obsolete framebuffer/texture handles
    // through the new WebGL resource registry.
    this.scene.environment = null;
    this.environment?.dispose();
    this.environment = undefined;
    this.enableFallback();
  };

  private onContextRestored = () => {
    if (!this.renderer || !this.models.length) return;
    this.renderer.resetState();
    this.makeStudio(false);
    this.fallback?.dispose(); this.fallback = undefined;
    this.canvas.hidden = false;
    this.onViewMode(false); this.dirty = true;
  };

  private enableFallback() {
    if (!this.fallback) this.fallback = new FallbackStage(this.container);
    this.canvas.hidden = true;
    this.onViewMode(true);
    this.dirty = true;
  }

  private makeStudio(includeLights = true) {
    const renderer = this.renderer!;
    RectAreaLightUniformsLib.init();
    const studio = new THREE.Scene();
    studio.background = new THREE.Color(0x11151a);
    const softbox = (x: number, y: number, z: number, w: number, h: number, intensity: number, color: THREE.ColorRepresentation) => {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide, toneMapped: false }));
      panel.position.set(x, y, z); panel.lookAt(0, 0, 0); studio.add(panel);
    };
    // The visible top normals reflect into x=-5.7..-1.7, y=3.5..6.3
    // on the z=-10 plane. Separate strips and real dark gaps are crucial:
    // a broad card here turns every conductor into the same beige flat fill.
    softbox(-4.85, 5.15, -10, .58, 6.8, 5.0, 0xe8eef5);
    softbox(-2.35, 5.0, -10, .44, 6.5, 4.0, 0xf4c093);
    softbox(-6.20, 5.2, -10, .42, 6.0, 2.6, 0xd3baf0);
    // The raised lid's tilted normal sees below the horizon. Its own narrow
    // card continues the brushed reflection when that same lid is held open.
    softbox(-2.95, -.8, -10, .64, 3.4, 4.2, 0xeef2f5);
    softbox(-7, 2, 1, 1.25, 7, 1.3, 0xdbe4f3);
    softbox(-5, -3, 8, 2.5, 2, .42, 0xced8e0);
    softbox(7, -2, -7, 1.1, 5, 1.4, 0xf0dfc7);
    softbox(0, 11, 1, 3, 1, .32, 0xeef1f1);
    // The folded optical path looks down and right in reflection. These
    // cards illuminate its concave mirrors and reflective reticle directly.
    softbox(9, -4.5, -2, 1.5, 6, 2.0, 0xe6edf0);
    softbox(0, -8, 0, 5, 5, .65, 0xbfcad3);
    const pmrem = new THREE.PMREMGenerator(renderer);
    this.environment?.dispose();
    this.environment = pmrem.fromScene(studio, .004, .1, 60, { size: 512 });
    this.scene.environment = this.environment.texture;
    pmrem.dispose(); disposeTree(studio);
    if (!includeLights) return;
    // Finite area sources create spatial reflection falloff across long,
    // planar rails and caps; the PMREM supplies their surrounding studio.
    const area = (color: THREE.ColorRepresentation, intensity: number, width: number, height: number, x: number, y: number, z: number) => {
      const light = new THREE.RectAreaLight(color, intensity, width, height);
      light.position.set(x, y, z); light.lookAt(2.4, .4, -1.4); this.scene.add(light);
    };
    area(0xe6edf3, 4.0, .56, 3.5, 1.0, 3.5, -5.7);
    area(0xe8c298, 3.0, .65, 3.8, -.65, -1.4, 4.8);
    this.scene.add(new THREE.HemisphereLight(0xdde7f4, 0x14191d, .20));
    const key = new THREE.DirectionalLight(0xe4ecf1, .72);
    key.position.set(-5, 10, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: .5, far: 40 });
    key.shadow.bias = -.00015;
    key.shadow.normalBias = .014;
    key.shadow.radius = 3;
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xf1dfca, .62); rim.position.set(6, 3, -7); this.scene.add(rim);
    const fill = new THREE.DirectionalLight(0xc1cde3, .12); fill.position.set(0, 1, 7); this.scene.add(fill);
  }

  setProgress(progress: number) { this.progress = clamp(progress, 0, 7.999); this.dirty = true; }
  setSettings(settings: Partial<StageSettings>) {
    if (settings.paused !== undefined || settings.reduced !== undefined) this.invalidate();
    Object.assign(this.settings, settings); this.dirty = true;
  }
  setPointer(x: number, y: number) { this.pointerTarget.set(clamp(x, -1, 1), clamp(y, -1, 1)); }
  invalidate() { this.dirty = true; this.lastTime = 0; this.lastRenderTime = 0; this.frameHistory = []; }

  resize() {
    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || window.innerHeight;
    const aspect = this.width / this.height;
    this.compactLandscape = this.height <= 500 && aspect >= 1.5;
    this.mobile = this.width < 760 && !this.compactLandscape;
    // Portrait tablets retain the desktop text column but need enough horizontal
    // world space for the complete object at its authored right-hand position.
    const desktopFrustum = aspect < 1.2 ? 10.25 * 1.7 / aspect : (aspect > 2 ? 9.25 : 10.25);
    const frustum = this.compactLandscape ? 10.25 : this.mobile ? 9.15 / aspect : desktopFrustum;
    this.camera.position.set(9, this.mobile ? 14 : 10.5, 17);
    this.camera.lookAt(0, .5, 0);
    this.camera.aspect = aspect;
    this.camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(frustum / (2 * this.camera.position.distanceTo(new THREE.Vector3(0, .5, 0)))));
    this.camera.updateProjectionMatrix();
    this.setPixelRatio();
    this.renderer?.setSize(this.width, this.height, false);
    this.fallback?.resize(this.width, this.height);
    this.dirty = true;
  }

  private setPixelRatio() {
    const viewportBudget = Math.sqrt(4_600_000 / (this.width * this.height));
    const cap = this.mobile ? 1.6 : 1.65;
    this.renderer?.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap, viewportBudget) * this.quality);
  }

  tick(seconds: number) {
    if (document.hidden) { this.lastTime = 0; this.lastRenderTime = 0; return; }
    const delta = this.lastTime ? Math.min(.06, seconds - this.lastTime) : 1 / 60;
    this.lastTime = seconds;
    const still = this.settings.reduced || this.settings.paused;
    if (!still) this.elapsed += delta;
    if (still && !this.dirty) return;
    // A single clock drives rendering. Mobile is capped at 45 fps, desktop at 60.
    const minimumFrameTime = this.mobile ? 1 / 45 : 1 / 60;
    if (!this.dirty && seconds - this.lastRenderTime < minimumFrameTime - .001) return;
    const sinceRender = this.lastRenderTime ? seconds - this.lastRenderTime : 0;
    this.lastRenderTime = seconds;
    if (this.fallback) {
      this.fallback.render(this.progress, this.elapsed, this.settings);
      this.dirty = false; return;
    }
    if (!this.renderer) return;
    if (sinceRender > 0 && this.qualitySamples < 180 && !this.mobile && !still) {
      this.frameHistory.push(sinceRender); this.qualitySamples++;
      if (this.frameHistory.length === 90) {
        const average = this.frameHistory.reduce((a,b) => a+b, 0) / 90;
        if (average > .037 && this.quality > .71) { this.quality = .72; this.setPixelRatio(); }
        this.frameHistory = [];
      }
    }
    this.pointer.lerp(still ? new THREE.Vector2() : this.pointerTarget, Math.min(1, delta * 4));
    const index = Math.min(7, Math.floor(this.progress));
    // Reduced motion presents a complete, still composition per chapter.
    // Direct inspection controls remain available without sweeping the lens.
    const p = this.settings.reduced ? index + (index === 0 ? 0 : index === 7 ? .57 : .5) : this.progress;
    const local = p - index;
    const state: SceneState = {
      progress: local, time: this.elapsed, delta, reduced: this.settings.reduced, active: true,
      gate: this.settings.gate,
      spread: this.settings.spread < 0 ? (index === 5 ? 1 - smooth(.56, .94, local) : .48) : this.settings.spread,
      exposure: this.settings.exposure, power: this.settings.power < 0 ? (index === 6 ? smooth(.02,.2,local) : index === 7 ? mix(1,.2,smooth(0,.45,local)) : .15) : this.settings.power,
      quality: this.quality,
    };
    // A lower micro-scale lens opens the nanosheet cutaway, then eases back
    // into the package view without introducing another camera or renderer.
    const hero = 1 - smooth(.5, 1.0, p);
    if (!this.mobile) {
      const microLens = smooth(2.7, 3.05, p) * (1 - smooth(3.72, 4.05, p));
      this.camera.position.y = mix(mix(10.5, 9.2, hero), 8.8, microLens);
      this.camera.lookAt(0, .5, 0);
    }
    const screenRight = new THREE.Vector3(1,0,0).applyQuaternion(this.camera.quaternion);
    const screenUp = new THREE.Vector3(0,1,0).applyQuaternion(this.camera.quaternion);
    const horizontalPosition = this.compactLandscape ? (this.width / this.height) * 10.25 * .20 : this.mobile ? 0 : mix(2.9, 2.05, hero);
    this.rig.position.copy(screenRight.multiplyScalar(horizontalPosition));
    // Mobile gives the open cover its own vertical space below the prose.
    // The completed package returns to the closing composition as it seats.
    const openPackage = smooth(4.60, 5.05, p) * (1 - smooth(7.0, 7.45, p));
    const mobileRise = (this.height <= 740 ? -.32 : -.14) - (this.height <= 740 ? .40 : .45) * openPackage;
    const verticalPosition = this.compactLandscape ? mix(.40, .55, hero) : this.mobile ? mix(mobileRise, .05, hero) : mix(.10, .80, hero);
    this.rig.position.add(screenUp.multiplyScalar(verticalPosition));
    this.rig.rotation.y = this.pointer.x * .025;
    this.rig.rotation.x = this.pointer.y * .011;
    this.rig.scale.setScalar(this.compactLandscape ? .90 : this.mobile ? .8 : 1);

    // Release any prior relay's temporary ownership before the models compute
    // this frame's layer/instance transforms. A relay may then capture and
    // replace the freshly posed physical feature below, in either direction.
    this.handoff?.clear();
    for (const model of this.models) model.group.visible = false;
    if (p < 2) {
      this.wafer.group.visible = true;
      this.wafer.setOptics(smooth(.66, 1.10, p));
      this.wafer.update({ ...state, progress: p < 1 ? p : p - 1 });
      this.wafer.group.scale.setScalar(1);
      this.wafer.group.position.set(0, 0, 0);
      this.wafer.group.rotation.y = 0;
    }
    this.poseModel(this.build, 2, p, state, 'laminate');
    this.poseModel(this.transistor, 3, p, state, 'micro');
    this.poseModel(this.interconnect, 4, p, state, 'wiring');
    if (p >= 4.64) {
      this.package.group.visible = true;
      this.package.group.scale.setScalar(this.mobile ? mix(.98, this.height <= 740 ? .88 : .90, openPackage) : .98);
      this.package.group.position.set(0, 0, 0);
      this.package.group.rotation.y = -.09;
      const mode = p < 6 ? 'package' : p < 7 ? 'signal' : 'final';
      this.package.setMode(mode);
      this.package.update({ ...state, progress: p < 5 ? 0 : clamp(p - Math.floor(p)), spread: p < 5 ? 1 : index === 5 ? state.spread : 0 });
    }
    this.handoff?.update(p);
    this.scene.updateMatrixWorld();
    this.renderer.render(this.scene, this.camera);
    this.dirty = false;
  }

  private poseModel(model: ExhibitModel, chapter: number, p: number, state: SceneState, kind: string) {
    if (p < chapter - .36 || p >= chapter + 1) return;
    model.group.visible = true;
    model.group.scale.setScalar(kind === 'wiring' ? 1.12 : 1.20);
    model.group.position.set(0, 0, 0);
    model.group.rotation.y = kind === 'wiring' ? -.18 : -.1;
    model.update({ ...state, progress: continuousSceneProgress(p, chapter), spread: this.settings.spread < 0 ? (kind === 'laminate' ? .55 : kind === 'wiring' ? .45 : .55) : state.spread });
  }

  getDiagnostics() {
    return { renderer: this.fallback ? 'canvas' : 'webgl', scene: Math.min(7, Math.floor(this.progress)), progress: this.progress, quality: this.quality, calls: this.renderer?.info.render.calls ?? 0, triangles: this.renderer?.info.render.triangles ?? 0, width: this.width, height: this.height, paused: this.settings.paused, reduced: this.settings.reduced };
  }

  dispose() {
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored);
    this.fallback?.dispose();
    this.handoff?.dispose();
    disposeTree(this.scene);
    this.environment?.dispose();
    this.renderer?.dispose(); this.canvas.remove();
  }
}
