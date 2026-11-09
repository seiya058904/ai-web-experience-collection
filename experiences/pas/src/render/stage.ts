import * as THREE from 'three';
import { loadCharacterAssets, createCharacter } from './character';
import type { DanceFrame, DancerId, Vec3 } from '../motion-types';

export interface StageOptions {
  ground: boolean;
  paths: boolean;
  contact: boolean;
  focus: DancerId | null;
  reduced: boolean;
  detail: boolean;
}

const vec = (p: Vec3) => new THREE.Vector3(...p);

/** A single scene and two optional cameras: close views never replace the hands. */
export class DanceStage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(31, 1, 0.04, 60);
  readonly closeCamera = new THREE.PerspectiveCamera(28, 1, 0.025, 40);
  private actors!: Record<DancerId, ReturnType<typeof createCharacter>>;
  private groundMarks: THREE.Mesh[] = [];
  private pathLines: THREE.Line[] = [];
  private contactMark: THREE.Mesh;
  private width = 0;
  private height = 0;
  private mobile = false;
  private lastFrame?: DanceFrame;
  private lost = false;
  private disposed = false;
  private assets?: Awaited<ReturnType<typeof loadCharacterAssets>>;
  private resizeObserver: ResizeObserver;
  private disposeCallbacks: Array<() => void> = [];

  constructor(private canvas: HTMLCanvasElement, private onFailure: (reason: string) => void) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.8));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.28;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene.background = new THREE.Color('#b6a38b');
    this.scene.fog = new THREE.Fog('#b6a38b', 9, 30);

    const sky = new THREE.HemisphereLight('#fff0d9', '#6c594c', 2.3);
    this.scene.add(sky);
    const key = new THREE.DirectionalLight('#fff0da', 3.25);
    key.position.set(-3.8, 5.2, 3.5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -3.8, right: 3.8, top: 3.8, bottom: -2.0, near: 0.1, far: 15 });
    key.shadow.bias = -0.00015; key.shadow.normalBias = 0.012;
    key.shadow.radius = 5;
    key.target.position.set(0, 0.8, 0); this.scene.add(key, key.target);
    const fill = new THREE.DirectionalLight('#d8c5ad', 0.65); fill.position.set(4, 2.3, 2); this.scene.add(fill);

    const grain = document.createElement('canvas'); grain.width = grain.height = 128;
    const ctx = grain.getContext('2d')!; const data = ctx.createImageData(128, 128);
    let seed = 140297;
    for (let i = 0; i < data.data.length; i += 4) {
      seed = (1664525 * seed + 1013904223) >>> 0;
      const v = 192 + ((seed >>> 24) / 255 - .5) * 18;
      data.data[i] = v; data.data[i + 1] = v; data.data[i + 2] = v; data.data[i + 3] = 255;
    }
    ctx.putImageData(data, 0, 0);
    const texture = new THREE.CanvasTexture(grain); texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(16, 16); texture.colorSpace = THREE.SRGBColorSpace;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: '#b4a18a', roughness: 1, map: texture, bumpMap: texture, bumpScale: 0.005 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = 0; floor.receiveShadow = true; this.scene.add(floor);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(80, 20), new THREE.MeshStandardMaterial({ color: '#bba88e', roughness: 1, map: texture, bumpMap: texture, bumpScale: 0.008 }));
    wall.position.set(0, 10, -2.7); wall.receiveShadow = true; this.scene.add(wall);
    this.disposeCallbacks.push(() => { floor.geometry.dispose(); (floor.material as THREE.Material).dispose(); wall.geometry.dispose(); (wall.material as THREE.Material).dispose(); texture.dispose(); });

    for (let i = 0; i < 4; i++) {
      const mark = new THREE.Mesh(new THREE.RingGeometry(.075, .081, 48), new THREE.MeshBasicMaterial({ color: i < 2 ? '#78362b' : '#615649', transparent: true, opacity: .75, depthWrite: false, side: THREE.DoubleSide }));
      mark.rotation.x = -Math.PI / 2; mark.scale.set(.72, 1.5, 1); mark.visible = false;
      this.scene.add(mark); this.groundMarks.push(mark);
    }
    for (const color of ['#893c30', '#f1e4d2']) {
      const geometry = new THREE.BufferGeometry();
      const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: .72, depthWrite: false }));
      line.visible = false; this.scene.add(line); this.pathLines.push(line);
    }
    this.contactMark = new THREE.Mesh(new THREE.SphereGeometry(.012, 16, 12), new THREE.MeshBasicMaterial({ color: '#f5ead8', transparent: true, opacity: .8, depthTest: false }));
    this.contactMark.visible = false; this.scene.add(this.contactMark);
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(canvas);
    canvas.addEventListener('webglcontextlost', this.onLost);
    canvas.addEventListener('webglcontextrestored', this.onRestored);
    this.resize();
  }

  async load() {
    this.assets = await loadCharacterAssets();
    if (this.disposed) { this.assets.dispose(); return; }
    this.actors = { cen: createCharacter('cen', this.assets), cheng: createCharacter('cheng', this.assets) };
    this.scene.add(this.actors.cen.group, this.actors.cheng.group);
  }

  private onLost = (event: Event) => { event.preventDefault(); this.lost = true; this.onFailure('context'); };
  private onRestored = () => { this.lost = false; this.canvas.dispatchEvent(new CustomEvent('pas-restored')); };

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    this.width = rect.width; this.height = rect.height; this.mobile = rect.width < 960 && rect.width / rect.height <= 1.25;
    this.renderer.setSize(rect.width, rect.height, false);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, this.mobile ? 1.5 : 1.8));
  }

  render(frame: DanceFrame, options: StageOptions) {
    if (this.lost || this.disposed || !this.actors) return;
    this.lastFrame = frame;
    this.actors.cen.update(frame.poses.cen); this.actors.cheng.update(frame.poses.cheng);

    const h = this.height, w = this.width;
    const viewportH = this.mobile ? h * .60 : h;
    const viewportY = this.mobile ? h * .065 : 0;
    const baseTarget = new THREE.Vector3(0, .91, 0);
    const cameraY = frame.t > 4.75 && frame.t < 6 ? 1.62 : 1.32;
    const distance = this.mobile ? 4.6 : Math.max(4.3, 5.5 - (w / h) * .45);
    this.camera.position.set(0.12, cameraY, distance);
    this.camera.aspect = w / viewportH;
    this.camera.clearViewOffset();
    if (!this.mobile) this.camera.setViewOffset(w, h, -w * .145, -h * .025, w, h);
    this.camera.lookAt(baseTarget); this.camera.updateProjectionMatrix();

    let footIndex = 0;
    for (const id of ['cen', 'cheng'] as const) for (const side of ['left', 'right'] as const) {
      const foot = frame.poses[id].feet[side]; const mark = this.groundMarks[footIndex++];
      mark.visible = options.ground && foot.planted;
      mark.position.set((foot.ankle[0] + foot.toe[0]) / 2, .003, (foot.ankle[2] + foot.toe[2]) / 2);
      mark.rotation.set(-Math.PI / 2, 0, -foot.yaw);
    }
    this.pathLines.forEach((line, i) => {
      line.visible = options.paths;
      if (options.paths) {
        const points = frame.travelled[i === 0 ? 'cen' : 'cheng'];
        line.geometry.dispose(); line.geometry = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(p[0], .006, p[2])));
      }
    });
    this.contactMark.visible = options.contact && frame.contact.point !== null;
    if (frame.contact.point) this.contactMark.position.copy(vec(frame.contact.point));

    this.renderer.setScissorTest(false); this.renderer.setViewport(0, 0, w, h); this.renderer.clear();
    if (this.mobile) { this.renderer.setScissorTest(true); this.renderer.setScissor(0, viewportY, w, viewportH); }
    this.renderer.setViewport(0, viewportY, w, viewportH); this.renderer.render(this.scene, this.camera);

    const autoDetail = (frame.camera.detail !== 'full' && frame.camera.detailMix > .6);
    const showDetail = !this.mobile && (options.detail || autoDetail);
    document.documentElement.classList.toggle('has-detail', showDetail);
    if (showDetail) {
      const detailFeet = !options.detail && frame.camera.detail === 'feet';
      const target = detailFeet ? new THREE.Vector3(0, .17, .06) : frame.contact.point ? vec(frame.contact.point) : vec(frame.camera.detailTarget);
      const detailW = Math.min(w * .24, 390), detailH = detailW * .64;
      const x = w - detailW - w * .045, y = h - detailH - h * .12;
      this.closeCamera.aspect = detailW / detailH;
      this.closeCamera.position.copy(target).add(new THREE.Vector3(.03, detailFeet ? .48 : .12, detailFeet ? 2.2 : 1.2));
      this.closeCamera.lookAt(target); this.closeCamera.updateProjectionMatrix();
      this.renderer.setScissorTest(true); this.renderer.setScissor(x, y, detailW, detailH); this.renderer.setViewport(x, y, detailW, detailH); this.renderer.clearDepth();
      this.renderer.render(this.scene, this.closeCamera);
    }
    this.renderer.setScissorTest(false);
  }

  exportFrame(width = 1400, height = 1000): string {
    if (!this.lastFrame) throw new Error('No observed frame is ready.');
    const originalW = this.width, originalH = this.height, originalMobile = this.mobile;
    this.width = width; this.height = height; this.mobile = false;
    this.renderer.setSize(width, height, false);
    this.render(this.lastFrame, { ground: false, paths: false, contact: false, focus: null, reduced: true, detail: false });
    const image = this.canvas.toDataURL('image/webp', .9);
    this.width = originalW; this.height = originalH; this.mobile = originalMobile; this.renderer.setSize(originalW, originalH, false);
    return image;
  }

  dispose() {
    this.disposed = true; this.resizeObserver.disconnect();
    this.canvas.removeEventListener('webglcontextlost', this.onLost); this.canvas.removeEventListener('webglcontextrestored', this.onRestored);
    if (this.actors) Object.values(this.actors).forEach(actor => actor.dispose());
    [...this.groundMarks, ...this.pathLines, this.contactMark].forEach(object => { object.geometry.dispose(); (object.material as THREE.Material).dispose(); });
    this.disposeCallbacks.forEach(dispose => dispose()); this.assets?.dispose(); this.renderer.dispose();
  }
}
