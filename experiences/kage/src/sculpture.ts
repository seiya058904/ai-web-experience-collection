import {
  ACESFilmicToneMapping, BoxGeometry, BufferAttribute, BufferGeometry, Color,
  DirectionalLight, Fog, Group, HemisphereLight, Line, LineBasicMaterial,
  Mesh, MeshBasicMaterial, MeshStandardMaterial, PCFShadowMap,
  PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial, SRGBColorSpace,
  Vector3, WebGLRenderer,
} from 'three';
import { CHAPTERS, clamp, getChapterIndex, mix, samplePose } from './score.ts';
import type { FramePose } from './score.ts';

interface Portal {
  group: Group;
  bars: Mesh<BoxGeometry, MeshStandardMaterial>[];
  edge: Mesh<BoxGeometry, MeshBasicMaterial>;
  innerEdges: Mesh<BoxGeometry, MeshBasicMaterial>[];
}

/** The renderer never owns a clock. main.ts supplies scroll and elapsed time. */
export class Sculpture {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(40, 1, 0.08, 180);
  private readonly material: MeshStandardMaterial;
  private readonly edgeMaterial: MeshBasicMaterial;
  private readonly apertureMaterial = new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, toneMapped: false });
  private readonly floorMaterial: MeshStandardMaterial;
  private readonly geometry = new BoxGeometry(1, 1, 1);
  private readonly portals: Portal[] = [];
  private readonly light = new DirectionalLight(0xffffff, 4);
  private readonly ambient = new HemisphereLight(0xffffff, 0x777777, 1.5);
  private readonly floor: Mesh<PlaneGeometry, MeshStandardMaterial>;
  private readonly beam: Mesh<BufferGeometry, ShaderMaterial>;
  private readonly trace: Line<BufferGeometry, LineBasicMaterial>;
  private readonly target = new Vector3();
  private readonly edgeOffset = new Vector3();
  private readonly bg = new Color();
  private readonly veil = new Group();
  private readonly veilGeometry = new PlaneGeometry(1, 1);
  private readonly veilMaterial = new MeshBasicMaterial({ color: 0x050505, depthTest: false, depthWrite: false, toneMapped: false });
  private readonly veilEdgeMaterial = new MeshBasicMaterial({ color: 0xe8e8e8, depthTest: false, depthWrite: false, toneMapped: false });
  private readonly farDoor: Mesh<PlaneGeometry, MeshBasicMaterial>;
  private width = 1;
  private height = 1;
  private mobile = false;
  private disposed = false;
  private adaptive = 1;
  private frameAverage = 16.7;
  private qualityFrames = 0;
  private previousTick = 0;
  private lastReducedPose = -1;
  private dirty = true;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({
      canvas, antialias: true, alpha: false,
      powerPreference: 'high-performance', stencil: false,
    });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.22;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.scene.background = this.bg;
    this.scene.fog = new Fog(0xfafafa, 24, 75);

    this.material = new MeshStandardMaterial({
      color: 0x151515, roughness: 0.76, metalness: 0.09,
    });
    // Original procedural microstructure: no texture download, no screen filter.
    this.material.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vSculpturePosition;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSculpturePosition = position;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vSculpturePosition;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          float grain = fract(sin(dot(vSculpturePosition * 1750.0, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
          diffuseColor.rgb *= 0.976 + grain * 0.024;`);
    };
    this.material.customProgramCacheKey = () => 'kage-mineral-v1';
    this.edgeMaterial = new MeshBasicMaterial({ color: 0xe9e9e9, transparent: true, opacity: 0.38 });
    this.floorMaterial = new MeshStandardMaterial({ color: 0xefefef, roughness: 1, metalness: 0 });
    this.floor = new Mesh(new PlaneGeometry(240, 240), this.floorMaterial);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = -3.34;
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);

    for (let i = 0; i < 5; i++) {
      const group = new Group();
      const bars = Array.from({ length: 4 }, () => {
        const bar = new Mesh(this.geometry, this.material);
        bar.castShadow = true;
        bar.receiveShadow = true;
        group.add(bar);
        return bar;
      });
      const edge = new Mesh(this.geometry, this.edgeMaterial);
      group.add(edge);
      const innerEdges = bars.map(bar => {
        const innerEdge = new Mesh(this.geometry, this.apertureMaterial);
        bar.add(innerEdge);
        return innerEdge;
      });
      this.scene.add(group);
      this.portals.push({ group, bars, edge, innerEdges });
    }

    this.light.castShadow = true;
    this.light.shadow.mapSize.set(2048, 2048);
    this.light.shadow.camera.left = -19;
    this.light.shadow.camera.right = 19;
    this.light.shadow.camera.top = 19;
    this.light.shadow.camera.bottom = -19;
    this.light.shadow.camera.near = 0.5;
    this.light.shadow.camera.far = 65;
    this.light.shadow.bias = -0.00012;
    this.light.shadow.normalBias = 0.022;
    this.light.shadow.radius = 1.4;
    this.light.target.position.set(0, -1, -2);
    this.scene.add(this.light, this.light.target, this.ambient);

    const beamGeometry = new BufferGeometry();
    beamGeometry.setAttribute('position', new BufferAttribute(new Float32Array([
      -1.65, 0, -23, 1.65, 0, -23, 13.5, 0, 22, -1.5, 0, 22,
    ]), 3));
    beamGeometry.setAttribute('uv', new BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2));
    beamGeometry.setIndex([0, 2, 1, 0, 3, 2]);
    const beamMaterial = new ShaderMaterial({
      transparent: true, depthWrite: false, toneMapped: false,
      uniforms: { uOpacity: { value: 0 } },
      vertexShader: `varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec2 vUv; uniform float uOpacity;
        void main() {
          float edge = smoothstep(0.0, 0.008, vUv.x) * (1.0 - smoothstep(0.992, 1.0, vUv.x));
          float distanceFade = mix(0.9, 0.12, smoothstep(0.1, 1.0, vUv.y));
          gl_FragColor = vec4(vec3(0.98), edge * distanceFade * uOpacity);
        }`,
    });
    this.beam = new Mesh(beamGeometry, beamMaterial);
    this.beam.position.y = -3.315;
    this.beam.renderOrder = 1;
    this.scene.add(this.beam);

    const traceGeometry = new BufferGeometry();
    traceGeometry.setAttribute('position', new BufferAttribute(new Float32Array(18), 3));
    this.trace = new Line(traceGeometry, new LineBasicMaterial({
      color: 0x111111, transparent: true, opacity: 0, depthWrite: false,
    }));
    this.scene.add(this.trace);

    this.farDoor = new Mesh(new PlaneGeometry(4.0, 6.7), this.apertureMaterial);
    this.farDoor.position.set(0, 0, -26.5);
    this.scene.add(this.farDoor);

    const cut = new Mesh(this.veilGeometry, this.veilMaterial);
    cut.renderOrder = 10000;
    this.veil.add(cut);
    for (const side of [-1, 1]) {
      const seam = new Mesh(this.veilGeometry, this.veilEdgeMaterial);
      seam.position.x = side * 0.5;
      seam.scale.x = 0.0015;
      seam.renderOrder = 10001;
      this.veil.add(seam);
    }
    this.camera.add(this.veil);
    this.scene.add(this.camera);
    this.resize(window.innerWidth, window.innerHeight);
    this.render(0, 0, false, { x: 0, y: 0 });
  }

  get quality(): string { return this.adaptive >= 0.95 ? 'full' : 'adaptive'; }

  async prepare(): Promise<void> {
    if (this.renderer.getContext().getExtension('KHR_parallel_shader_compile')) {
      await this.renderer.compileAsync(this.scene, this.camera);
    } else {
      this.renderer.compile(this.scene, this.camera);
    }
  }

  resize(width: number, height: number): void {
    if (this.disposed) return;
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.mobile = width / height < 0.85;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.updateBuffer();
    this.dirty = true;
  }

  private updateBuffer(): void {
    // Typography stays at native resolution; cap only the continuous 3D stage.
    const budget = this.mobile ? 1_900_000 : 3_600_000;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.75,
      Math.sqrt(budget / (this.width * this.height))) * this.adaptive;
    this.renderer.setPixelRatio(Math.max(0.35, ratio));
    this.renderer.setSize(this.width, this.height, false);
  }

  private composePortal(portal: Portal, pose: FramePose, index: number, elapsed: number, reduced: boolean): void {
    const { width: w, height: h, depth: d, bar: requestedBar, spread, fold } = pose;
    const bar = Math.min(requestedBar, w * 0.495, h * 0.495);
    const drift = reduced ? 0 : Math.sin(elapsed * 0.24 + index * 1.1) * 0.008;
    portal.group.position.set(...pose.position);
    portal.group.rotation.set(pose.rotation[0], pose.rotation[1] + drift, pose.rotation[2]);
    portal.group.scale.setScalar(pose.scale);

    const [left, right, top, bottom] = portal.bars;
    left.position.set(-(w - bar) / 2 - spread * 0.4, spread * 0.2, spread * 0.8);
    right.position.set((w - bar) / 2 + spread * 0.42, -spread * 0.18, -spread * 0.7);
    top.position.set(spread * 0.18, (h - bar) / 2 + spread * 0.36, -spread * 0.26);
    bottom.position.set(-spread * 0.24, -(h - bar) / 2 - spread * 0.23, spread * 0.4);
    left.scale.set(bar, h, d);
    right.scale.set(bar, h, d);
    top.scale.set(Math.max(0.002, w - 2 * bar), bar, d);
    bottom.scale.copy(top.scale);
    left.rotation.set(0, fold, fold * 0.12);
    right.rotation.set(fold * 0.12, -fold * 0.78, -fold * 0.1);
    top.rotation.set(-fold * 0.60, fold * 0.2, fold * 0.12);
    bottom.rotation.set(fold * 0.74, -fold * 0.13, -fold * 0.12);

    // One bright arris carries the visual thread through each transformation.
    this.edgeOffset.set(-bar * 0.5 + 0.003, 0, d * 0.5 + 0.003).applyQuaternion(right.quaternion);
    portal.edge.position.copy(right.position).add(this.edgeOffset);
    portal.edge.scale.set(Math.min(0.009, bar * 0.20), h, 0.007);
    portal.edge.rotation.copy(right.rotation);
    for (let i = 0; i < 4; i++) {
      const inner = portal.innerEdges[i];
      if (i < 2) {
        inner.position.set(i === 0 ? 0.498 : -0.498, 0, 0.505);
        inner.scale.set(Math.min(0.016 / bar, 0.35), 1, 0.010 / d);
      } else {
        inner.position.set(0, i === 2 ? -0.498 : 0.498, 0.505);
        inner.scale.set(1, Math.min(0.016 / bar, 0.35), 0.010 / d);
      }
    }
  }

  render(progress: number, elapsed: number, reduced: boolean, pointer: { x: number; y: number }): void {
    if (this.disposed || this.renderer.getContext().isContextLost()) return;
    const p = clamp(Number.isFinite(progress) ? progress : 0);
    const stillAt = CHAPTERS[getChapterIndex(p)].at;
    if (reduced && !this.dirty && this.lastReducedPose === stillAt) return;
    this.lastReducedPose = reduced ? stillAt : -1;
    this.dirty = false;

    const pose = samplePose(p, this.mobile, reduced);
    const breathe = reduced ? 0 : Math.sin(elapsed * 0.26) * 0.13;
    const px = reduced || this.mobile ? 0 : clamp(pointer.x, -1, 1) * 0.14;
    const py = reduced || this.mobile ? 0 : clamp(pointer.y, -1, 1) * 0.07;
    this.camera.position.set(pose.camera[0] + px, pose.camera[1] - py, pose.camera[2]);
    this.target.set(...pose.target);
    this.camera.up.set(Math.sin(pose.roll), Math.cos(pose.roll), 0);
    this.camera.lookAt(this.target);
    if (Math.abs(this.camera.fov - pose.fov) > 0.001) {
      this.camera.fov = pose.fov;
      this.camera.updateProjectionMatrix();
    }
    this.bg.setScalar(pose.background);
    (this.scene.fog as Fog).color.copy(this.bg);
    this.floorMaterial.color.setScalar(pose.floor);
    this.material.color.setScalar(pose.ink);
    this.material.emissive.setScalar(pose.emission);
    this.material.emissiveIntensity = 0.8;
    this.edgeMaterial.opacity = mix(0.34, 0.04, pose.emission);
    this.ambient.intensity = pose.ambient;
    this.light.intensity = pose.lightPower;
    this.light.position.set(pose.light[0] + breathe, pose.light[1], pose.light[2] + breathe * 0.45);
    this.light.shadow.intensity = pose.shadow;

    for (let i = 0; i < this.portals.length; i++) {
      this.composePortal(this.portals[i], pose.frames[i], i, elapsed, reduced);
    }
    this.beam.material.uniforms.uOpacity.value = pose.beam;
    this.beam.visible = pose.beam > 0.001;
    this.beam.rotation.y = Math.sin(p * Math.PI * 3) * 0.10;
    const apertureLight = clamp((pose.beam - 0.27) / 0.58);
    this.apertureMaterial.opacity = apertureLight;
    this.farDoor.visible = apertureLight > 0.001;

    this.veil.visible = pose.wipe >= 0;
    if (this.veil.visible) {
      const planeHeight = 2 * Math.tan(this.camera.fov * Math.PI / 360) * 1.2;
      const planeWidth = planeHeight * this.camera.aspect;
      this.veil.position.set((1 - 2 * pose.wipe) * planeWidth * 1.6, 0, -1.2);
      this.veil.scale.set(planeWidth * 1.8, planeHeight * 2.2, 1);
      this.veil.rotation.z = this.mobile ? -0.025 : -0.12;
    }

    const tracePosition = this.trace.geometry.attributes.position as BufferAttribute;
    const center = pose.frames[0].position;
    const x = center[0] + pose.frames[0].width / 2;
    const points = [-24, -3.30, 3, x, -3.30, 3, x, -3.30, -6,
      x, 7.2, -6, 21, 7.2, -6, 25, 7.2, -6];
    tracePosition.array.set(points);
    tracePosition.needsUpdate = true;
    this.trace.geometry.computeBoundingSphere();
    this.trace.material.color.setScalar(mix(0.92, 0.018, clamp((pose.background - 0.15) / 0.50)));
    this.trace.material.opacity = pose.trace * 0.45;
    this.trace.visible = pose.trace > 0.001;

    this.renderer.shadowMap.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
    this.adaptQuality(reduced);
  }

  private adaptQuality(reduced: boolean): void {
    const now = performance.now();
    const delta = now - this.previousTick;
    this.previousTick = now;
    if (reduced || delta < 1 || delta > 180) return;
    this.frameAverage = mix(this.frameAverage, delta, 0.035);
    this.qualityFrames++;
    if (this.qualityFrames < 150) return;
    this.qualityFrames = 0;
    let next = this.adaptive;
    if (this.frameAverage > 28) next = Math.max(0.55, this.adaptive - 0.12);
    if (this.frameAverage < 18.5) next = Math.min(1, this.adaptive + 0.06);
    if (next !== this.adaptive) {
      this.adaptive = next;
      this.updateBuffer();
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.geometry.dispose();
    this.material.dispose();
    this.edgeMaterial.dispose();
    this.apertureMaterial.dispose();
    this.floor.geometry.dispose();
    this.floorMaterial.dispose();
    this.beam.geometry.dispose();
    this.beam.material.dispose();
    this.trace.geometry.dispose();
    this.trace.material.dispose();
    this.farDoor.geometry.dispose();
    this.veilGeometry.dispose();
    this.veilMaterial.dispose();
    this.veilEdgeMaterial.dispose();
    this.light.shadow.map?.dispose();
    this.renderer.dispose();
  }
}
