import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  AmbientLight,
  Color,
  DirectionalLight,
  DoubleSide,
  Group,
  LineSegments,
  MathUtils,
  Mesh,
  MeshPhysicalMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makeClothGeometry, makeThreadGeometry, makeYarnGeometry } from './geometry';
import { makeFabricMaterial, makeFabricTextures, makeYarnTextures } from './material';
import type { FabricTextures, FabricUniforms } from './material';

export interface WorldState {
  progress: number;
  time: number;
  pointer: { x: number; y: number };
  reducedMotion: boolean;
  tension: number;
  light: number;
  weave: number;
}

const clamp = MathUtils.clamp;
const smooth = (x: number) => {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};
const bell = (x: number, center: number, radius: number) => smooth(1 - Math.abs(x - center) / radius);

function interpolateStage(values: readonly number[], progress: number): number {
  const a = Math.floor(progress);
  const b = Math.min(a + 1, values.length - 1);
  return MathUtils.lerp(values[a], values[b], smooth(progress - a));
}

/**
 * A single, reversible textile world. There is deliberately no RAF, scroll
 * listener, DOM layout measurement, loading, or global event handler here.
 * The application's one ticker supplies the clock and canonical progress.
 */
export class TextileWorld {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(32, 1, 0.1, 70);
  private readonly textiles = new Group();
  private readonly cloths: Mesh[] = [];
  private readonly fabrics: MeshPhysicalMaterial[] = [];
  private readonly uniforms: FabricUniforms[] = [];
  private readonly textures: FabricTextures;
  private readonly yarnTextures: FabricTextures;
  private readonly environment: WebGLRenderTarget;
  private readonly key: DirectionalLight;
  private readonly fill: DirectionalLight;
  private readonly rim: DirectionalLight;
  private readonly ambient: AmbientLight;
  private readonly threads: LineSegments;
  private readonly threadMaterial: ShaderMaterial;
  private readonly yarn: Mesh;
  private readonly yarnMaterial: MeshPhysicalMaterial;
  private readonly beam: Mesh;
  private readonly beamMaterial: ShaderMaterial;
  private readonly ground: Mesh;
  private readonly groundMaterial: ShaderMaterial;
  private readonly cameraTarget = new Vector3(0, 0, 0);
  private readonly mainColor = new Color().setRGB(0.48, 0.455, 0.405);
  private width = 1;
  private height = 1;
  private mobile = false;
  private disposed = false;
  private lastWeave = -1;
  private textilePhoto: Texture | null = null;

  constructor(canvas: HTMLCanvasElement, onInvalidate?: () => void) {
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      premultipliedAlpha: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.03;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFShadowMap;
    this.camera.position.set(0, 0.05, 14.0);
    this.camera.lookAt(this.cameraTarget);

    const pmrem = new PMREMGenerator(this.renderer);
    const studio = new RoomEnvironment();
    this.environment = pmrem.fromScene(studio, 0.045, 0.1, 40);
    this.scene.environment = this.environment.texture;
    studio.dispose();
    pmrem.dispose();

    this.ambient = new AmbientLight('#dce2e1', 0.37);
    this.scene.add(this.ambient);
    this.key = new DirectionalLight('#fff8e7', 3.25);
    this.key.position.set(-3.8, 7.4, 5.8);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(2048, 2048);
    this.key.shadow.camera.left = -8;
    this.key.shadow.camera.right = 8;
    this.key.shadow.camera.top = 7;
    this.key.shadow.camera.bottom = -7;
    this.key.shadow.camera.near = 0.5;
    this.key.shadow.camera.far = 25;
    this.key.shadow.bias = -0.00055;
    this.key.shadow.normalBias = 0.025;
    this.key.shadow.radius = 3.0;
    this.scene.add(this.key);
    this.fill = new DirectionalLight('#d1dce8', 0.88);
    this.fill.position.set(6, 1.5, 5);
    this.scene.add(this.fill);
    this.rim = new DirectionalLight('#fff8e9', 2.15);
    this.rim.position.set(2, 4, -5);
    this.scene.add(this.rim);

    this.textures = makeFabricTextures(this.renderer.capabilities.getMaxAnisotropy());
    for (let i = 0; i < 5; i++) {
      const geometry = makeClothGeometry(i === 0 ? 168 : 96, i === 0 ? 176 : 104, i);
      const fabric = makeFabricMaterial(this.textures, i);
      const mesh = new Mesh(geometry, fabric.material);
      mesh.frustumCulled = false;
      mesh.castShadow = i === 0;
      mesh.receiveShadow = i === 0;
      mesh.renderOrder = 10 - i;
      mesh.visible = i === 0;
      this.cloths.push(mesh);
      this.fabrics.push(fabric.material);
      this.uniforms.push(fabric.uniforms);
      this.textiles.add(mesh);
    }
    this.scene.add(this.textiles);
    // One generated, evenly lit textile sample supplies the irregular silk
    // filaments. Geometry, macro weave, normals, lighting and movement remain
    // authored in real time; the photograph is only the albedo of the cloth.
    new TextureLoader().load(`${import.meta.env.BASE_URL}veil/images/silk-macro.webp`, (texture) => {
      if (this.disposed) { texture.dispose(); return; }
      texture.colorSpace = SRGBColorSpace;
      texture.wrapS = texture.wrapT = RepeatWrapping;
      texture.repeat.set(18, 21);
      texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
      this.textilePhoto = texture;
      for (const material of this.fabrics) {
        material.map = texture;
        material.needsUpdate = true;
      }
      onInvalidate?.();
    }, undefined, () => { /* The complete procedural weave is the fallback. */ });

    this.threadMaterial = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uTension: { value: 0.5 },
        uColor: { value: new Color('#8b8172') },
      },
      vertexShader: `
        attribute vec2 aPhase;
        uniform float uTime;
        uniform float uTension;
        varying float vFade;
        varying float vPhase;
        void main() {
          vec3 p = position;
          float freeEdge = sin(aPhase.y * 3.14159265);
          p.y += sin(aPhase.y * 8.0 + uTime * 0.48 + aPhase.x) * freeEdge * mix(0.055,0.012,uTension);
          p.z += cos(aPhase.y * 6.0 + uTime * 0.31 + aPhase.x) * freeEdge * 0.035;
          vFade = smoothstep(0.0, 0.12, aPhase.y);
          vPhase = aPhase.x;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
        }`,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vFade;
        varying float vPhase;
        void main() {
          gl_FragColor = vec4(uColor + sin(vPhase * 8.0) * 0.05, uOpacity * vFade);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      transparent: true,
      depthWrite: false,
    });
    this.threads = new LineSegments(makeThreadGeometry(), this.threadMaterial);
    this.threads.frustumCulled = false;
    this.threads.visible = false;
    this.textiles.add(this.threads);

    this.yarnTextures = makeYarnTextures(this.renderer.capabilities.getMaxAnisotropy());
    this.yarnMaterial = new MeshPhysicalMaterial({
      color: '#c9c1b1',
      vertexColors: true,
      roughness: 0.67,
      metalness: 0.015,
      sheen: 1,
      sheenColor: '#fff7e9',
      sheenRoughness: 0.53,
      map: this.yarnTextures.color,
      normalMap: this.yarnTextures.normal,
      normalScale: new Vector2(0.65, 0.85),
      anisotropy: 0.47,
      transparent: true,
      opacity: 0,
      envMapIntensity: 0.16,
    });
    this.yarn = new Mesh(makeYarnGeometry(), this.yarnMaterial);
    this.yarn.position.set(2.7, 0, 0.03);
    this.yarn.rotation.set(0.055, 0.105, -0.23);
    this.yarn.frustumCulled = false;
    this.yarn.castShadow = true;
    this.yarn.receiveShadow = true;
    this.yarn.visible = false;
    this.textiles.add(this.yarn);

    this.beamMaterial = new ShaderMaterial({
      uniforms: {
        uOpacity: { value: 0 },
        uLight: { value: 0.5 },
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }`,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uOpacity;
        uniform float uLight;
        uniform float uTime;
        void main() {
          float slant = vUv.x - vUv.y * 0.47;
          float first = exp(-pow((slant-0.18-uLight*0.12)*12.0,2.0));
          float second = exp(-pow((slant-0.38-uLight*0.08)*20.0,2.0)) * 0.30;
          float boundary = smoothstep(0.0,0.15,vUv.y) * smoothstep(1.0,0.72,vUv.x);
          float breathing = 0.97+0.03*sin(uTime*0.18);
          gl_FragColor = vec4(0.83,0.87,0.80,(first+second)*boundary*uOpacity*breathing);
        }`,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
      toneMapped: false,
    });
    this.beam = new Mesh(new PlaneGeometry(17, 11), this.beamMaterial);
    this.beam.position.set(0, 0, -3.8);
    this.beam.renderOrder = -10;
    this.beam.visible = false;
    this.scene.add(this.beam);

    this.groundMaterial = new ShaderMaterial({
      uniforms: { uOpacity: { value: 0.17 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `varying vec2 vUv; uniform float uOpacity; void main(){ vec2 p=(vUv-0.5)*2.0; float a=exp(-dot(p,p)*5.8)*uOpacity; gl_FragColor=vec4(0.22,0.20,0.17,a); }`,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      side: DoubleSide,
    });
    this.ground = new Mesh(new PlaneGeometry(8.7, 7.0), this.groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -3.28;
    this.ground.position.x = 2.7;
    this.scene.add(this.ground);
    this.resize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight);
  }

  resize(width: number, height: number): void {
    if (this.disposed) return;
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.mobile = this.width < 700;
    // The 4K cap protects transparent overdraw and keeps the drawing buffer
    // below 5.2 Mpx; a high-DPI phone never allocates its native 3× buffer.
    const nativeDpr = Math.max(1, window.devicePixelRatio || 1);
    const pixelBudgetDpr = Math.sqrt(5_200_000 / (this.width * this.height));
    this.renderer.setPixelRatio(Math.min(this.mobile ? 1.35 : 1.5, nativeDpr, pixelBudgetDpr));
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  render(state: WorldState): void {
    if (this.disposed) return;
    const p = clamp(Number.isFinite(state.progress) ? state.progress : 0, 0, 6);
    const time = state.reducedMotion ? 0 : (Number.isFinite(state.time) ? state.time : 0);
    const tension = clamp(state.tension, 0, 1);
    const illumination = clamp(state.light, 0, 1);
    const weave = clamp(state.weave, 0, 1);
    const pointerX = state.reducedMotion ? 0 : clamp(state.pointer.x, -1, 1);
    const pointerY = state.reducedMotion ? 0 : clamp(state.pointer.y, -1, 1);
    const stage = Math.min(5, Math.floor(p));
    const blend = smooth(p - stage);
    const lightScene = bell(p, 3, 0.98);
    const finalScene = smooth((p - 5.23) / 0.77);
    const weaveScene = bell(p, 1, 0.9);
    const detailScene = bell(p, 5, 0.86);

    if (Math.abs(weave - this.lastWeave) > 0.005) {
      const repeat = 28 + weave * 20;
      this.textures.normal.repeat.set(repeat, repeat * 1.17);
      this.textures.color.repeat.copy(this.textures.normal.repeat);
      this.textilePhoto?.repeat.set(12 + weave * 12, 14 + weave * 14);
      this.lastWeave = weave;
    }

    const opacity = interpolateStage([1.0, 0.93, 1.0, 0.57, 1.0, 0.12, 0.62], p);
    const roughness = interpolateStage([0.48, 0.65, 0.57, 0.68, 0.53, 0.72, 0.70], p);
    const seam = interpolateStage([0.0, 0.13, 0.22, 0.03, 0.88, 0.0, 0.06], p);
    // Reused materials share textures and shader programs. Only uniforms,
    // scalar material properties, and existing morph weights change here.
    for (let i = 0; i < this.cloths.length; i++) {
      const mesh = this.cloths[i];
      const material = this.fabrics[i];
      const uniform = this.uniforms[i];
      const weights = mesh.morphTargetInfluences!;
      weights.fill(0);
      if (stage > 0) weights[stage - 1] = 1 - blend;
      weights[stage] = blend;
      // Releasing the couture fold returns the same surface to its flat
      // cutting pattern; restoring tension closes it into the original shell.
      const formFold = smooth((tension - 0.07) / 0.25);
      const releasedPattern = weights[3] * (1 - formFold);
      weights[3] -= releasedPattern;
      weights[0] += releasedPattern;
      const layerPresence = i === 0 ? 1 : (i < 3 ? lightScene : 0) + finalScene;
      mesh.visible = i === 0 || layerPresence > 0.007;
      material.opacity = i === 0 ? opacity
        : (i < 3 ? lightScene * 0.29 : 0) + finalScene * [0, 0.52, 0.37, 0.35, 0.40][i];
      material.depthWrite = i === 0 && opacity > 0.86;
      material.roughness = roughness + i * 0.025;
      material.color.copy(this.mainColor);
      material.sheen = 0.68;
      material.envMapIntensity = 0.19 - lightScene * 0.05;
      material.normalScale.setScalar((0.31 + weave * 0.28) * (1 - lightScene * 0.20));
      mesh.castShadow = i === 0 && lightScene < 0.4 && finalScene < 0.3;
      mesh.receiveShadow = i === 0 && opacity > 0.9;
      uniform.uTime.value = time;
      uniform.uTension.value = tension;
      uniform.uSeam.value = seam;
      uniform.uWind.value.set(pointerX, pointerY);
      uniform.uMovement.value = state.reducedMotion ? 0 : 1;
      uniform.uGauze.value = Math.max(lightScene, finalScene * 0.7);
    }

    const portraitScale = this.mobile
      ? (this.width / this.height < 0.6 ? 0.69 : 0.80) * (1 - finalScene * 0.34)
      : 1;
    this.textiles.scale.setScalar(portraitScale);
    if (this.mobile) {
      this.textiles.position.set(
        interpolateStage([-1.73, -1.72, -1.78, -1.44, -1.57, -1.82, 0.0], p),
        interpolateStage([0.70, 0.74, 0.68, 0.57, 0.66, 0.72, 0.66], p),
        0,
      );
    } else {
      const narrow = smooth((1.52 - this.camera.aspect) / 0.45);
      this.textiles.position.set(-narrow * 0.55, 0, 0);
    }

    this.threads.visible = weaveScene > 0.005;
    this.threadMaterial.uniforms.uTime.value = time;
    this.threadMaterial.uniforms.uTension.value = tension;
    this.threadMaterial.uniforms.uOpacity.value = weaveScene * 0.48;

    this.yarn.visible = detailScene > 0.005;
    this.yarnMaterial.opacity = smooth(detailScene) * 0.99;
    this.yarnMaterial.depthWrite = detailScene > 0.7;
    const yarnScale = 0.99 + weave * 0.055;
    this.yarn.scale.set(yarnScale, yarnScale * 0.94, 1.0 - tension * 0.12);
    this.yarn.rotation.x = 0.055 + (state.reducedMotion ? 0 : Math.sin(time * 0.18) * 0.013);
    this.yarn.rotation.y = 0.105 + pointerX * 0.025;

    this.beam.visible = lightScene > 0.008;
    this.beamMaterial.uniforms.uOpacity.value = lightScene * (0.055 + illumination * 0.08);
    this.beamMaterial.uniforms.uLight.value = illumination;
    this.beamMaterial.uniforms.uTime.value = time;

    this.key.intensity = 1.25 + illumination * 0.72 + lightScene * 1.10;
    this.key.position.set(-5.8 + illumination * 4.5, 7.0, 5.3 - lightScene * 3.2);
    this.fill.intensity = 0.24 + illumination * 0.22 - lightScene * 0.16;
    this.rim.intensity = 0.92 + lightScene * (2.0 + illumination * 1.8);
    this.rim.position.set(1.7 + illumination * 2.2, 3.8, -5.2);
    this.ambient.intensity = 0.12 - lightScene * 0.06;
    this.renderer.toneMappingExposure = 0.68 + illumination * 0.08 + lightScene * 0.17;
    this.groundMaterial.uniforms.uOpacity.value = interpolateStage([0.15, 0.07, 0.17, 0.0, 0.24, 0.07, 0.07], p);
    this.ground.visible = this.groundMaterial.uniforms.uOpacity.value > 0.005 && !this.mobile;

    this.camera.position.set(pointerX * 0.095, 0.04 + pointerY * 0.06, 14.0);
    this.camera.lookAt(this.cameraTarget);
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (let i = 0; i < this.cloths.length; i++) {
      this.cloths[i].geometry.dispose();
      this.fabrics[i].dispose();
    }
    this.threads.geometry.dispose();
    this.threadMaterial.dispose();
    this.yarn.geometry.dispose();
    this.yarnMaterial.dispose();
    this.yarnTextures.normal.dispose();
    this.yarnTextures.color.dispose();
    this.beam.geometry.dispose();
    this.beamMaterial.dispose();
    this.ground.geometry.dispose();
    this.groundMaterial.dispose();
    this.textures.normal.dispose();
    this.textures.color.dispose();
    this.textilePhoto?.dispose();
    this.environment.dispose();
    this.key.shadow.map?.dispose();
    this.renderer.dispose();
    this.scene.clear();
  }
}
