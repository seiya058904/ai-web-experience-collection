import * as THREE from 'three';
import {
  violinOutline, soundHole, archedSurface, plateEdge, archHeight,
  ribSurface, rimCurve, fingerboardGeometry, bridgeGeometry, taperedBarGeometry,
} from './model-geometry';

const ease = (value: number) => { const t = THREE.MathUtils.clamp(value, 0, 1); return t * t * (3 - 2 * t); };

/**
 * One selective, original structural study. The caller owns time and rendering.
 * No RAF, scroll listener or competing render loop is created here.
 */
export class ViolinStudy {
  readonly available: boolean;
  /** Resolves after every material image is loaded and its texture is initialized. */
  readonly ready: Promise<void>;
  readonly model = new THREE.Group();
  private renderer?: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-5, 5, 4, -4, .1, 60);
  private front = new THREE.Group();
  private back = new THREE.Group();
  private body = new THREE.Group();
  private movingLight?: THREE.PointLight;
  private textures = new Set<THREE.Texture>();
  private environment?: THREE.WebGLRenderTarget;
  private disposed = false;
  private contextLost = false;
  private width = 1;
  private height = 1;
  private materialReady: Promise<void>[] = [];
  private materialsLoaded = false;
  private interiorMaterials: {material: THREE.MeshStandardMaterial; color: THREE.Color}[] = [];
  private lost = (event: Event) => { event.preventDefault(); this.contextLost = true; };
  private restored = () => { this.contextLost = false; };

  constructor(container: HTMLElement) {
    this.model.name = 'LUTHIER — Original structural study';
    this.model.userData = {
      author: 'LUTHIER project',
      description: 'Original procedural violin. Structural interpretation, not measured engineering geometry.',
      units: 'Body length = 7.04 design units. No scale or instrument-specific dimensions claimed.',
    };
    try {
      this.renderer = new THREE.WebGLRenderer({alpha: true, antialias: true, powerPreference: 'low-power'});
    } catch {
      this.available = false;
      this.ready = Promise.resolve();
      return;
    }
    this.available = true;
    const r = this.renderer;
    r.setClearColor(0x000000, 0);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.18;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    r.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;';
    r.domElement.setAttribute('aria-hidden', 'true');
    r.domElement.addEventListener('webglcontextlost', this.lost);
    r.domElement.addEventListener('webglcontextrestored', this.restored);
    container.appendChild(r.domElement);
    this.camera.position.set(0, .48, 18);
    this.camera.lookAt(0, .48, 0);
    this.scene.add(this.model);
    this.model.add(this.back, this.body, this.front);
    this.front.name = 'Spruce top and playing assembly';
    this.back.name = 'Arched maple back';
    this.body.name = 'Bent ribs and interior';
    this.addLighting();
    this.buildInstrument();
    this.ready = Promise.all(this.materialReady).then(() => {
      if (this.disposed) throw new Error('The violin study was disposed before its materials loaded.');
      // Upload the decoded images before a caller replaces the photographic fallback.
      // This does not render a frame or create another scheduling authority.
      for (const texture of this.textures) r.initTexture(texture);
      this.materialsLoaded = true;
    });
    const bounds = container.getBoundingClientRect();
    this.resize(bounds.width || 800, bounds.height || 800);
  }

  private texture(path: string, srgb = true): THREE.Texture {
    const loader = new THREE.TextureLoader();
    let resolve!: () => void;
    let reject!: (error: Error) => void;
    this.materialReady.push(new Promise<void>((done, fail) => { resolve = done; reject = fail; }));
    const map = loader.load(new URL(`${import.meta.env.BASE_URL}luthier/assets/${path}`, window.location.origin).href,
      () => resolve(), undefined, () => reject(new Error(`Unable to load the violin material: ${path}`)));
    map.name = path;
    if (srgb) map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.anisotropy = Math.min(4, this.renderer!.capabilities.getMaxAnisotropy());
    this.textures.add(map);
    return map;
  }

  private addLighting(): void {
    // A painted studio environment supplies broad varnish reflections without a remote HDRI.
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#16120f'; ctx.fillRect(0, 0, 512, 256);
    const glow = (x: number, y: number, rx: number, ry: number, color: string) => {
      ctx.save(); ctx.translate(x, y); ctx.scale(rx, ry);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      g.addColorStop(0, color); g.addColorStop(.42, color); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(-1, -1, 2, 2); ctx.restore();
    };
    glow(120, 70, 74, 51, '#f6d3a0');
    glow(355, 116, 24, 83, '#ffecd1');
    glow(268, 22, 98, 22, '#a8adb1');
    const map = new THREE.CanvasTexture(canvas);
    map.mapping = THREE.EquirectangularReflectionMapping;
    map.colorSpace = THREE.SRGBColorSpace;
    const generator = new THREE.PMREMGenerator(this.renderer!);
    this.environment = generator.fromEquirectangular(map);
    this.scene.environment = this.environment.texture;
    map.dispose(); generator.dispose();
    this.scene.add(new THREE.HemisphereLight(0xfff1da, 0x241408, 1.65));
    const key = new THREE.DirectionalLight(0xffdfba, 3.6);
    key.position.set(-5, 5, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -5.5; key.shadow.camera.right = 5.5;
    key.shadow.camera.top = 8; key.shadow.camera.bottom = -5;
    key.shadow.camera.near = .5; key.shadow.camera.far = 25;
    key.shadow.bias = -.00015; key.shadow.normalBias = .025;
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xffe9d1, 2.1);
    rim.position.set(5, 0, -2); this.scene.add(rim);
    const cool = new THREE.DirectionalLight(0xc4ced6, 1.0);
    cool.position.set(2, 6, 4); this.scene.add(cool);
    this.movingLight = new THREE.PointLight(0xffc487, 8, 20, 2);
    this.movingLight.position.set(-2.7, 1, 4.5);
    this.scene.add(this.movingLight);
  }

  private buildInstrument(): void {
    const spruceMap = this.texture('spruce-texture.webp');
    spruceMap.center.set(.5, .5);
    spruceMap.rotation = .30;
    spruceMap.repeat.set(3, 1.3);
    spruceMap.wrapS = spruceMap.wrapT = THREE.MirroredRepeatWrapping;
    const mapleMap = this.texture('maple-texture.webp');
    const ebonyMap = this.ebonyTexture();
    const varnish = new THREE.MeshPhysicalMaterial({
      color: 0xb1713e, map: spruceMap, bumpMap: spruceMap, bumpScale: .004, roughness: .31, metalness: 0,
      clearcoat: 1, clearcoatRoughness: .17, ior: 1.48,
      envMapIntensity: 1.12, vertexColors: true,
    });
    const maple = new THREE.MeshPhysicalMaterial({
      color: 0x9d642f, map: mapleMap, bumpMap: mapleMap, bumpScale: .003, roughness: .31, metalness: 0,
      clearcoat: .92, clearcoatRoughness: .18, ior: 1.47, envMapIntensity: .95,
    });
    const raw = new THREE.MeshStandardMaterial({color: 0xe4c18a, map: spruceMap, roughness: .85, side: THREE.DoubleSide});
    const innerMaple = new THREE.MeshStandardMaterial({color: 0xcca473, map: mapleMap, roughness: .80, side: THREE.DoubleSide});
    this.interiorMaterials.push({material: raw, color: raw.color.clone()}, {material: innerMaple, color: innerMaple.color.clone()});
    const ebony = new THREE.MeshPhysicalMaterial({color: 0x191610, map: ebonyMap, roughness: .29, clearcoat: .55, clearcoatRoughness: .23, envMapIntensity: 1.1});
    const inlay = new THREE.MeshStandardMaterial({color: 0x25190e, roughness: .47});
    const edgeAmber = new THREE.MeshPhysicalMaterial({color: 0x975d30, roughness: .34, clearcoat: .9, clearcoatRoughness: .2});
    const metal = new THREE.MeshStandardMaterial({color: 0xc8c1a7, metalness: .88, roughness: .29});
    const fineMetal = new THREE.MeshStandardMaterial({color: 0xddceb0, metalness: .78, roughness: .39});
    const bridgeMaple = new THREE.MeshStandardMaterial({color: 0xdac597, roughness: .78, bumpMap: spruceMap, bumpScale: .003});
    for (const [material, name] of [[varnish, 'Amber varnish over spruce'], [maple, 'Varnished figured maple'],
      [raw, 'Unfinished spruce'], [innerMaple, 'Unfinished maple'], [ebony, 'Polished ebony'],
      [inlay, 'Dark purfling'], [edgeAmber, 'Varnished edge'], [metal, 'Wound string metal'],
      [fineMetal, 'Fine string metal'], [bridgeMaple, 'Pale maple bridge']] as const) material.name = name;
    const add = (group: THREE.Group, g: THREE.BufferGeometry, m: THREE.Material | THREE.Material[], name: string) => {
      const mesh = new THREE.Mesh(g, m); mesh.name = name;
      mesh.castShadow = true; mesh.receiveShadow = true;
      group.add(mesh); return mesh;
    };
    const tube = (group: THREE.Group, curve: THREE.Curve<THREE.Vector3>, radius: number, material: THREE.Material, name: string, segments = 224) =>
      add(group, new THREE.TubeGeometry(curve, segments, radius, 5, curve instanceof THREE.CatmullRomCurve3 && curve.closed), material, name);

    // The arched plates have real f-hole apertures, separate unfinished undersides and cut edges.
    const topShape = violinOutline();
    topShape.holes.push(soundHole(-1), soundHole(1));
    add(this.front, archedSurface(topShape), varnish, 'Carved spruce — varnished top');
    add(this.front, archedSurface(topShape, false, true), raw, 'Spruce — unfinished underside');
    add(this.front, plateEdge(topShape), maple, 'Varnished spruce edge and f-hole cut walls');
    const backShape = violinOutline();
    const backMaterial = maple.clone(); backMaterial.vertexColors = true;
    add(this.back, archedSurface(backShape, true), backMaterial, 'Figured maple — arched outer back');
    add(this.back, archedSurface(backShape, true, true), innerMaple, 'Maple — unfinished inner back');
    add(this.back, plateEdge(backShape, true), maple, 'Thin maple plate edge');
    for (const [group, z] of [[this.front, 'top'], [this.back, 'back']] as const) {
      tube(group, rimCurve(.992, z), .018, edgeAmber, 'Rounded varnished edge');
      tube(group, rimCurve(.953, z), .014, inlay, 'Purfling — outer dark inlay');
      tube(group, rimCurve(.938, z), .010, inlay, 'Purfling — inner dark inlay');
    }

    add(this.body, ribSurface(), maple, 'Bent flamed-maple ribs — outside');
    add(this.body, ribSurface(true), innerMaple, 'Bent maple ribs — interior');
    for (const z of [-.40, .397]) {
      tube(this.body, rimCurve(.963, z), .034, raw, 'Spruce lining at the rib edge');
      tube(this.body, rimCurve(.980, z), .017, edgeAmber, 'Rib edge');
    }
    // Six structural blocks remain low and quiet inside the shell.
    for (const [x, y, sx, sy] of [[0, 3.25, .55, .34], [0, -3.30, .64, .28],
      [-1.47, 1.05, .24, .23], [1.47, 1.05, .24, .23], [-1.55, -.91, .26, .22], [1.55, -.91, .26, .22]]) {
      const block = add(this.body, new THREE.BoxGeometry(sx, sy, .74), raw, 'Interior spruce block');
      block.position.set(x, y, 0);
    }
    const postTop = archHeight(.58, -.41) - .064, postBottom = archHeight(.58, -.41, true) + .064;
    const soundPost = add(this.body, new THREE.CylinderGeometry(.065, .065, postTop - postBottom, 16), raw, 'Sound post — treble side, behind the bridge');
    soundPost.rotation.x = Math.PI / 2;
    soundPost.position.set(.58, -.41, (postTop + postBottom) * .5);
    soundPost.userData = {description: 'Un-glued spruce post. Position is illustrative; treble side, behind bridge.'};
    const bassBar = add(this.front, taperedBarGeometry(), raw, 'Bass bar — under the bass side of the spruce top');
    bassBar.userData = {description: 'Longitudinal tapered spruce bar attached to the underside of the top.'};

    const bridge = add(this.front, bridgeGeometry(), bridgeMaple, 'Carved maple bridge');
    bridge.position.set(0, -.20, .63);
    // Maple at the neck is polished by use, a little paler than the body varnish.
    const neckMaterial = maple.clone(); neckMaterial.color.set(0xd1a16a); neckMaterial.roughness = .38;
    const neck = add(this.front, new THREE.CapsuleGeometry(.275, 2.32, 5, 12), neckMaterial, 'Maple neck');
    neck.position.set(0, 4.62, .70); neck.scale.set(1, 1, .68);
    const heel = add(this.front, new THREE.SphereGeometry(.36, 18, 14), neckMaterial, 'Carved neck heel');
    heel.position.set(0, 3.37, .42); heel.scale.set(1, 1.48, 1.02);
    const boardShape = new THREE.Shape();
    boardShape.moveTo(-.43, .76); boardShape.quadraticCurveTo(0, .68, .43, .76);
    boardShape.lineTo(.245, 5.68); boardShape.lineTo(-.245, 5.68); boardShape.closePath();
    const boardBase = new THREE.ExtrudeGeometry(boardShape, {depth: .12, bevelEnabled: true, bevelThickness: .022, bevelSize: .018, bevelSegments: 2, steps: 1, curveSegments: 10});
    const bpos = boardBase.getAttribute('position');
    for (let i = 0; i < bpos.count; i++) bpos.setZ(i, bpos.getZ(i) + .785 + (bpos.getY(i) - .76) / 4.92 * .115);
    boardBase.computeVertexNormals();
    add(this.front, boardBase, ebony, 'Ebony fingerboard — tapered solid base');
    add(this.front, fingerboardGeometry(), ebony, 'Ebony fingerboard — curved playing surface');
    const nut = add(this.front, new THREE.BoxGeometry(.51, .072, .072), ebony, 'Ebony nut');
    nut.position.set(0, 5.68, 1.07);

    // A compact hollow pegbox and twin carved scroll spirals. The scroll may extend beyond the shot.
    for (const side of [-1, 1]) {
      const cheek = add(this.front, new THREE.BoxGeometry(.087, 1.32, .37), maple, 'Maple pegbox cheek');
      cheek.position.set(side * .233, 6.27, .75); cheek.rotation.x = -.085;
    }
    const pegFloor = add(this.front, new THREE.BoxGeometry(.46, 1.32, .072), neckMaterial, 'Pegbox back');
    pegFloor.position.set(0, 6.26, .568); pegFloor.rotation.x = -.085;
    for (let i = 0; i < 4; i++) {
      const y = 5.86 + i * .28, side = i % 2 === 0 ? -1 : 1;
      const shaft = add(this.front, new THREE.CylinderGeometry(.052, .041, .80, 12), ebony, 'Ebony tuning peg shaft');
      shaft.rotation.z = Math.PI / 2; shaft.position.set(side * .1, y, .78);
      const grip = add(this.front, new THREE.SphereGeometry(.17, 16, 10), ebony, 'Oval ebony tuning peg');
      grip.scale.set(.36, 1, .68); grip.position.set(side * .59, y, .78);
      const collar = add(this.front, new THREE.TorusGeometry(.062, .012, 5, 14), ebony, 'Peg collar');
      collar.rotation.y = Math.PI / 2; collar.position.set(side * .29, y, .78);
    }
    const scrollCore = add(this.front, new THREE.SphereGeometry(.34, 20, 16), maple, 'Carved volute core');
    scrollCore.scale.set(.79, 1.18, .82); scrollCore.position.set(0, 7.04, .59);
    for (const side of [-1, 1]) {
      const pts = Array.from({length: 96}, (_, i) => {
        const t = i / 95, a = -.65 + t * Math.PI * 3.9, radius = .345 * (1 - t) + .032;
        return new THREE.Vector3(side * (.27 + .018 * t), 7.05 + Math.sin(a) * radius, .62 + Math.cos(a) * radius);
      });
      tube(this.front, new THREE.CatmullRomCurve3(pts), .031, edgeAmber, 'Hand-carved scroll spiral', 96);
    }

    const tailShape = new THREE.Shape();
    tailShape.moveTo(-.40, -1.40);
    tailShape.bezierCurveTo(-.40, -1.31, .40, -1.31, .40, -1.40);
    tailShape.bezierCurveTo(.36, -1.94, .27, -2.58, .19, -2.80);
    tailShape.quadraticCurveTo(0, -2.98, -.19, -2.80);
    tailShape.bezierCurveTo(-.27, -2.58, -.36, -1.94, -.40, -1.40);
    const tail = add(this.front, new THREE.ExtrudeGeometry(tailShape, {depth: .10, bevelEnabled: true, bevelSegments: 3, bevelSize: .048, bevelThickness: .044, curveSegments: 12, steps: 1}), ebony, 'Carved ebony tailpiece');
    tail.position.z = .87;
    const saddle = add(this.front, new THREE.BoxGeometry(.56, .09, .14), ebony, 'Ebony saddle');
    saddle.position.set(0, -3.45, .47);
    for (const side of [-1, 1]) {
      const tailGut = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * .12, -2.75, .93), new THREE.Vector3(side * .11, -3.46, .52),
        new THREE.Vector3(side * .10, -3.59, -.02),
      ]);
      tube(this.front, tailGut, .017, inlay, 'Tailgut', 32);
    }
    const endpin = add(this.body, new THREE.CylinderGeometry(.105, .08, .18, 18), ebony, 'Ebony endpin');
    endpin.rotation.x = Math.PI / 2; endpin.rotation.z = Math.PI / 2;
    endpin.position.set(0, -3.57, -.01); endpin.rotation.set(0, 0, 0);
    const endButton = add(this.body, new THREE.SphereGeometry(.13, 16, 10), ebony, 'Endpin button');
    endButton.scale.set(1, .45, 1); endButton.position.set(0, -3.68, -.01);
    // Four real strings, each a very small swept cylinder; no transparent planes or fake glow.
    for (let i = 0; i < 4; i++) {
      const side = i - 1.5, nutX = side * .12, bridgeX = side * .18, tailX = side * .16;
      const bridgeZ = 1.441 - Math.abs(side) * .016;
      const points = [new THREE.Vector3(tailX, -1.43, 1.03), new THREE.Vector3(bridgeX, -.245, bridgeZ), new THREE.Vector3(nutX, 5.68, 1.12)];
      const stringPath = new THREE.CurvePath<THREE.Vector3>();
      stringPath.add(new THREE.LineCurve3(points[0], points[1]));
      stringPath.add(new THREE.LineCurve3(points[1], points[2]));
      tube(this.front, stringPath, .0063 - i * .00065, i < 2 ? metal : fineMetal, ['G string', 'D string', 'A string', 'E string'][i], 72);
      const tuner = add(this.front, new THREE.SphereGeometry(.033, 10, 6), metal, 'String seat');
      tuner.scale.set(1, 1.5, .55); tuner.position.set(tailX, -1.43, 1.045);
    }
  }

  private ebonyTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#817965'; ctx.fillRect(0, 0, 128, 512);
    let seed = 9123;
    const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < 240; i++) {
      const x = rand() * 128;
      ctx.strokeStyle = `rgba(35,27,16,${.04 + rand() * .10})`;
      ctx.lineWidth = .3 + rand() * .65;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.bezierCurveTo(x - 2, 140, x + 2, 370, x + rand() * 2 - 1, 512); ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.name = 'Original procedural ebony grain';
    texture.colorSpace = THREE.SRGBColorSpace; texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    this.textures.add(texture); return texture;
  }

  resize(width: number, height: number): void {
    if (!this.renderer || this.disposed) return;
    this.width = Math.max(1, width); this.height = Math.max(1, height);
    const aspect = this.width / this.height;
    const short = Math.min(this.width, this.height);
    const dpr = Math.min(window.devicePixelRatio || 1, short < 650 ? 1.45 : 1.65,
      Math.sqrt(3_200_000 / (this.width * this.height)));
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(this.width, this.height, false);
    const halfHeight = aspect < .8 ? 3.92 : 4.13;
    this.camera.left = -halfHeight * aspect; this.camera.right = halfHeight * aspect;
    this.camera.top = halfHeight; this.camera.bottom = -halfHeight;
    this.camera.updateProjectionMatrix();
  }

  render(local: number, time: number, reduced = false): void {
    if (!this.renderer || this.disposed || this.contextLost || !this.materialsLoaded) return;
    const progress = THREE.MathUtils.clamp(local, 0, 1);
    const opening = reduced ? .75 : ease((progress - .07) / .76);
    const breathing = reduced ? 0 : Math.sin(time * .28) * .007;
    // A closed wooden cavity excludes the studio fill; gently admit that light as the plate lifts.
    const cavityLight = .025 + .975 * ease(opening);
    for (const {material, color} of this.interiorMaterials) material.color.copy(color).multiplyScalar(cavityLight);
    this.front.position.z = opening * .75;
    this.front.position.y = opening * .075;
    this.front.rotation.x = opening * -.045;
    this.back.position.z = -.025 * opening;
    this.model.rotation.set(-.58 - opening * .055, -.21 - opening * .11 + breathing, -.09);
    const aspect = this.width / this.height;
    const scale = aspect < .82 ? Math.min(1.03, aspect / .67) : 1.08;
    this.model.scale.setScalar(scale);
    this.model.position.set(aspect < .82 ? .02 : -.03, -.22, 0);
    if (this.movingLight) this.movingLight.position.set(-2.7 + (reduced ? 0 : Math.sin(time * .21) * .25), 1.0 + opening * 1.1, 4.5);
    this.renderer.render(this.scene, this.camera);
  }

  /** Export the authored geometry/materials, excluding the camera, studio and animated staging. */
  async exportGLB(): Promise<ArrayBuffer> {
    if (!this.available || this.disposed) throw new Error('The violin study is unavailable.');
    await this.ready;
    const copy = this.model.clone(true);
    const materialCopies = new Map<THREE.Material, THREE.Material>();
    const intrinsicColors = new Map(this.interiorMaterials.map(({material, color}) => [material.uuid, color]));
    copy.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const cloneMaterial = (original: THREE.Material) => {
        let material = materialCopies.get(original);
        if (!material) {
          material = original.clone();
          const color = intrinsicColors.get(original.uuid);
          if (color && material instanceof THREE.MeshStandardMaterial) material.color.copy(color);
          materialCopies.set(original, material);
        }
        return material;
      };
      object.material = Array.isArray(object.material) ? object.material.map(cloneMaterial) : cloneMaterial(object.material);
    });
    copy.position.set(0, 0, 0); copy.rotation.set(0, 0, 0); copy.scale.setScalar(1);
    const front = copy.getObjectByName('Spruce top and playing assembly');
    if (front) { front.position.set(0, 0, 0); front.rotation.set(0, 0, 0); }
    const back = copy.getObjectByName('Arched maple back');
    if (back) back.position.set(0, 0, 0);
    const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
    const exporter = new GLTFExporter();
    try {
      return await exporter.parseAsync(copy, {binary: true, onlyVisible: true, maxTextureSize: 1024}) as ArrayBuffer;
    } finally {
      for (const material of materialCopies.values()) material.dispose();
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
    this.model.traverse(object => {
      const mesh = object as THREE.Mesh;
      if (mesh.geometry) geometries.add(mesh.geometry);
      if (mesh.material) for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) materials.add(material);
    });
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    for (const texture of this.textures) texture.dispose();
    this.environment?.dispose();
    if (this.renderer) {
      this.renderer.domElement.removeEventListener('webglcontextlost', this.lost);
      this.renderer.domElement.removeEventListener('webglcontextrestored', this.restored);
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }
  }
}

export default ViolinStudy;
