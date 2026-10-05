import * as THREE from 'three';
import {
  TRAIN, TRAIN_BY_ID, MODULE, BALANCE_CENTER, BALANCE_RADIUS, FORK_CENTER, FORK_AXIS_ANGLE,
  createMechanicalPose, writeMechanicalPose,
} from '../mechanics';
import type { TrainId } from '../mechanics';
import {
  annulusGeometry, bridgeGeometry, cylinderGeometry, escapeGeometry, gearGeometry,
  handGeometry, roundedRectGeometry, SpringRibbon,
} from './geometry';
import { createWatchMaterials, labelTexture } from './materials';
import type { WatchMaterials } from './materials';
import { batchAssembly } from './batch';
import { createStudioEnvironment } from './studio';
import { portraitLayout } from '../narrative';

export interface WatchFrame {
  /** One reversible narrative coordinate. Chapter centres are 0,.2,.4,.6,.8,1. */
  progress: number;
  /** Already integrated active mechanical seconds; presentation rate is owned by the app. */
  time: number;
  slow: boolean;
  reduced: boolean;
  pointerX: number;
  pointerY: number;
  /** Open the photographed face before its aperture reveals the live interior. */
  entranceReveal?: number;
}

type FadeSet = { group: THREE.Group; materials: THREE.Material[] };
type ScrewSpec = { x: number; y: number; z: number; scale?: number; angle?: number };
type Stage = { x: number; y: number; z: number; span: number; rx: number; ry: number; rz: number; explode: number };
const TAU = Math.PI * 2;
const STAGES: readonly Stage[] = [
  { x: 0, y: 0, z: .26, span: 4.70, rx: .22, ry: -.34, rz: -.22, explode: 0 },
  { x: TRAIN_BY_ID.barrel.x, y: TRAIN_BY_ID.barrel.y, z: -.06, span: 2.52, rx: .53, ry: .28, rz: -.17, explode: 0 },
  { x: -.02, y: -.04, z: .62, span: 7.05, rx: .78, ry: .30, rz: -.24, explode: 1 },
  { x: BALANCE_CENTER.x + .10, y: BALANCE_CENTER.y + .12, z: .61, span: 2.65, rx: .45, ry: -.25, rz: .17, explode: 0 },
  { x: TRAIN_BY_ID.third.x + .03, y: TRAIN_BY_ID.third.y, z: .75, span: 2.02, rx: .63, ry: .10, rz: -.19, explode: 0 },
  { x: 0, y: .02, z: .26, span: 8.35, rx: .20, ry: .30, rz: -.15, explode: 0 },
];
const clamp = (n: number, low = 0, high = 1) => Math.max(low, Math.min(high, n));
const smooth = (low: number, high: number, n: number) => {
  const t = clamp((n - low) / (high - low));
  return t * t * (3 - 2 * t);
};
const lerp = THREE.MathUtils.lerp;

/**
 * A single original calibre, rendered for every chapter. No RAF, scroll listener,
 * asset fetch, or app state lives here. All chapter transformations reverse exactly.
 */
export class WatchScene {
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(30, 1, .075, 100);
  private readonly model = new THREE.Group();
  private readonly caseGroup = new THREE.Group();
  private readonly dialGroup = new THREE.Group();
  private readonly strapGroup = new THREE.Group();
  private readonly bridgeGroup = new THREE.Group();
  private readonly balanceBridgeGroup = new THREE.Group();
  private readonly capGroup = new THREE.Group();
  private readonly balance = new THREE.Group();
  private readonly fork = new THREE.Group();
  private readonly hairspringGroup = new THREE.Group();
  private readonly barrelSpringGroup = new THREE.Group();
  private readonly axisGroup = new THREE.Group();
  private readonly wheelGroups = new Map<TrainId, THREE.Group>();
  private readonly materials: WatchMaterials;
  private readonly geometries = new Map<string, THREE.BufferGeometry>();
  private readonly extraTextures: THREE.Texture[] = [];
  private environment: THREE.Texture;
  private environmentTarget: THREE.WebGLRenderTarget | null;
  private readonly hairSpring = new SpringRibbon(.095, .525, 8.5, .025, .0065, 680);
  private readonly mainSpring = new SpringRibbon(.125, .674, 6.55, .165, .013, 640);
  private readonly pose = createMechanicalPose();
  private readonly focus = new THREE.Vector3();
  private readonly worldPoint = new THREE.Vector3();
  private readonly projectVector = new THREE.Vector3();
  private readonly dummy = new THREE.Object3D();
  private readonly fades: FadeSet[] = [];
  private dialFade!: FadeSet;
  private strapFade!: FadeSet;
  private capFade!: FadeSet;
  private bridgeFade!: FadeSet;
  private hourHand!: THREE.Mesh;
  private minuteHand!: THREE.Mesh;
  private secondHand!: THREE.Mesh;
  private craftBearing!: THREE.Group;
  private readonly keyLight: THREE.DirectionalLight;
  private width = 1;
  private height = 1;
  private aspect = 1;
  private dpr = 1;
  private mobile = false;
  private disposed = false;
  private lost = false;
  private lastSpringWind = NaN;
  private lastBalance = NaN;
  private lastProgress = 0;
  private readonly contextLost = (event: Event) => {
    event.preventDefault();
    this.lost = true;
    // Release the old target while its context is lost; disposing it after
    // restoration would send stale GPU handles to the replacement context.
    this.scene.environment = null;
    this.environmentTarget?.dispose();
    this.environmentTarget = null;
    this.canvas.dispatchEvent(new CustomEvent('chronos:webgl-lost'));
  };
  private readonly contextRestored = () => {
    if (this.disposed) return;
    this.renderer.resetState();
    try {
      // Render-target textures have no CPU pixels to upload after context loss.
      // Rebuild the small procedural HDR studio before announcing recovery.
      const target = createStudioEnvironment(this.renderer);
      this.environmentTarget = target;
      this.environment = target.texture;
      this.scene.environment = this.environment;
      this.scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach(material => { material.needsUpdate = true; });
        }
      });
      this.lost = false;
      this.canvas.dispatchEvent(new CustomEvent('chronos:webgl-restored'));
    } catch {
      this.lost = true;
      this.canvas.dispatchEvent(new CustomEvent('chronos:webgl-lost'));
    }
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true,
      powerPreference: 'high-performance', stencil: false, depth: true, preserveDrawingBuffer: false });
    this.renderer.setClearColor(0x080907, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = .89;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.materials = createWatchMaterials();
    this.environmentTarget = createStudioEnvironment(this.renderer);
    this.environment = this.environmentTarget.texture;
    this.scene.environment = this.environment;
    this.scene.environmentIntensity = 1.0;
    this.scene.environmentRotation.set(0, 0, 0);
    this.scene.add(this.model);
    this.model.name = 'CHRONOS · calibre C.01';
    this.model.add(this.caseGroup, this.strapGroup, this.dialGroup, this.bridgeGroup,
      this.balanceBridgeGroup, this.capGroup, this.balance, this.fork,
      this.hairspringGroup, this.barrelSpringGroup, this.axisGroup);
    const ambient = new THREE.HemisphereLight(0xc8d1d1, 0x070a08, .16);
    this.scene.add(ambient);
    this.keyLight = new THREE.DirectionalLight(0xfff5e7, 1.8);
    this.keyLight.position.set(-3.5, 5.5, 7.5);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    Object.assign(this.keyLight.shadow.camera, { left: -4.8, right: 4.8, top: 5, bottom: -5, near: .2, far: 20 });
    this.keyLight.shadow.bias = -.00018;
    this.keyLight.shadow.normalBias = .011;
    this.keyLight.shadow.radius = 3;
    this.scene.add(this.keyLight);
    const rim = new THREE.DirectionalLight(0xe4edf4, 1.3);
    rim.position.set(5, -.3, 3);
    const fill = new THREE.DirectionalLight(0xddd5c6, .25);
    fill.position.set(-4, -3, 4);
    this.scene.add(rim, fill);
    this.buildCase();
    this.buildStrap();
    this.buildTrain();
    this.buildBalance();
    this.buildBridges();
    this.buildDial();
    const movingHands = new Set<THREE.Object3D>([this.hourHand, this.minuteHand, this.secondHand]);
    for (const group of [this.caseGroup, this.strapGroup, this.bridgeGroup, this.balanceBridgeGroup,
      this.capGroup, this.balance, this.fork]) batchAssembly(group);
    for (const group of this.wheelGroups.values()) batchAssembly(group);
    batchAssembly(this.dialGroup, movingHands);
    this.dialFade = this.fadeSet(this.dialGroup);
    this.strapFade = this.fadeSet(this.strapGroup);
    this.capFade = this.fadeSet(this.capGroup);
    this.bridgeFade = this.fadeSet(this.bridgeGroup);
    this.canvas.addEventListener('webglcontextlost', this.contextLost, false);
    this.canvas.addEventListener('webglcontextrestored', this.contextRestored, false);
    this.resize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight,
      window.devicePixelRatio || 1);
  }

  private cached(key: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry {
    let geometry = this.geometries.get(key);
    if (!geometry) { geometry = make(); this.geometries.set(key, geometry); }
    return geometry;
  }

  private mesh(geometry: THREE.BufferGeometry, material: THREE.Material | THREE.Material[], parent: THREE.Object3D,
    x = 0, y = 0, z = 0, castShadow = true): THREE.Mesh {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  private torus(parent: THREE.Object3D, radius: number, tube: number, material: THREE.Material,
    x: number, y: number, z: number): THREE.Mesh {
    return this.mesh(this.cached(`torus-${radius}-${tube}`, () => new THREE.TorusGeometry(radius, tube, 10, 96)),
      material, parent, x, y, z);
  }

  private label(parent: THREE.Object3D, text: string, x: number, y: number, z: number, width: number,
    color = '#b9b5a5', serif = false): THREE.Mesh {
    const texture = labelTexture(text, { color, serif, tracking: serif ? 12 : 9 });
    this.extraTextures.push(texture);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: .83,
      depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    return this.mesh(new THREE.PlaneGeometry(width, width / 8), material, parent, x, y, z, false);
  }

  private screwGeometry(): THREE.BufferGeometry {
    return this.cached('slotted-screw', () => {
      const shape = new THREE.Shape();
      shape.absarc(0, 0, .067, 0, TAU, false);
      const slot = new THREE.Path();
      slot.moveTo(-.051, -.006); slot.lineTo(-.051, .006);
      slot.lineTo(.051, .006); slot.lineTo(.051, -.006); slot.closePath();
      shape.holes.push(slot);
      return new THREE.ExtrudeGeometry(shape, { depth: .024, bevelEnabled: true, bevelThickness: .004,
        bevelSize: .003, bevelSegments: 2, curveSegments: 18, steps: 1 });
    });
  }

  /** Fasteners are instanced by assembly, retaining independent explosion transforms. */
  private screws(parent: THREE.Object3D, specs: readonly ScrewSpec[], material = this.materials.blue): void {
    if (!specs.length) return;
    const heads = new THREE.InstancedMesh(this.screwGeometry(), material, specs.length);
    const seats = new THREE.InstancedMesh(this.cached('screw-seat', () => annulusGeometry(.048, .082, .012, .003, 48)),
      this.materials.polished, specs.length);
    const wells = new THREE.InstancedMesh(this.cached('screw-well', () => cylinderGeometry(.059, .014, 36)),
      this.materials.darkSteel, specs.length);
    for (let i = 0; i < specs.length; i++) {
      const s = specs[i], scale = s.scale ?? 1;
      this.dummy.position.set(s.x, s.y, s.z);
      this.dummy.rotation.set(0, 0, s.angle ?? ((i * 1.731 + s.x) % Math.PI));
      this.dummy.scale.setScalar(scale); this.dummy.updateMatrix();
      heads.setMatrixAt(i, this.dummy.matrix);
      this.dummy.position.z = s.z - .009 * scale; this.dummy.updateMatrix();
      seats.setMatrixAt(i, this.dummy.matrix);
      this.dummy.position.z = s.z - .014 * scale; this.dummy.updateMatrix();
      wells.setMatrixAt(i, this.dummy.matrix);
    }
    heads.castShadow = true; heads.receiveShadow = true;
    seats.castShadow = true; seats.receiveShadow = true;
    parent.add(wells, seats, heads);
  }

  private jewel(parent: THREE.Object3D, x: number, y: number, z: number, scale = 1): THREE.Group {
    const jewel = new THREE.Group(); jewel.position.set(x, y, z); jewel.scale.setScalar(scale); parent.add(jewel);
    this.mesh(this.cached('chaton', () => annulusGeometry(.072, .113, .025, .005, 64)),
      [this.materials.brass, this.materials.brassEdge], jewel);
    this.torus(jewel, .101, .006, this.materials.polished, 0, 0, .033);
    const stone = this.torus(jewel, .053, .025, this.materials.ruby, 0, 0, .037);
    stone.scale.z = .67;
    this.mesh(this.cached('ruby-inner', () => annulusGeometry(.025, .053, .018, .003, 48)),
      this.materials.ruby, jewel, 0, 0, .025);
    this.mesh(this.cached('pivot', () => cylinderGeometry(.022, .033, 32)),
      this.materials.polished, jewel, 0, 0, .015);
    this.mesh(this.cached('pivot-eye', () => cylinderGeometry(.006, .0015, 18)),
      this.materials.darkSteel, jewel, 0, 0, .049, false);
    return jewel;
  }

  private buildCase(): void {
    const { titanium, silver, polished, darkSteel } = this.materials;
    this.caseGroup.name = 'Titanium case and movement plate';
    this.mesh(annulusGeometry(2.278, 2.355, 1.18, .012, 128), [titanium, polished], this.caseGroup, 0, 0, -.39);
    this.mesh(annulusGeometry(2.11, 2.37, .09, .018, 128), [silver, polished], this.caseGroup, 0, 0, -.05);
    this.torus(this.caseGroup, 2.355, .025, polished, 0, 0, .048);
    this.torus(this.caseGroup, 2.14, .018, darkSteel, 0, 0, .061);
    this.mesh(annulusGeometry(2.075, 2.14, .066, .009, 128), polished, this.caseGroup, 0, 0, -.08);
    const plateShape = new THREE.Shape(); plateShape.absarc(0, 0, 2.065, 0, TAU, false);
    for (const wheel of TRAIN) {
      const hole = new THREE.Path(); hole.absarc(wheel.x, wheel.y, wheel.id === 'barrel' ? .746 : .073, 0, TAU, true); plateShape.holes.push(hole);
    }
    const windows = [[1.60, -.90, .18], [1.55, 1.00, .18], [-1.74, -.30, .12], [.40, 1.73, .10]];
    for (const [x, y, r] of windows) {
      const hole = new THREE.Path(); hole.absarc(x, y, r, 0, TAU, true); plateShape.holes.push(hole);
    }
    this.mesh(new THREE.ExtrudeGeometry(plateShape, { depth: .105, bevelEnabled: true, bevelSize: .006,
      bevelThickness: .007, bevelSegments: 2, curveSegments: 32 }), this.materials.plate, this.caseGroup, 0, 0, -.25);
    this.mesh(cylinderGeometry(2.025, .025, 128), darkSteel, this.caseGroup, 0, 0, -.29);
    // Circular turning marks catch the grazing studio light at the outside edge.
    for (let i = 0; i < 7; i++) this.torus(this.caseGroup, 2.105 + i * .025, .0025, i % 2 ? titanium : polished, 0, 0, -.033);
    const screws: ScrewSpec[] = [];
    for (let i = 0; i < 10; i++) {
      const a = TAU * i / 10 + .14;
      screws.push({ x: Math.cos(a) * 1.94, y: Math.sin(a) * 1.94, z: -.102, scale: .78 });
    }
    this.screws(this.caseGroup, screws);
    // Lug forms continue the case curvature into a gently bowed leather strap.
    const lugGeometry = roundedRectGeometry(.32, .86, .28, .13, .025);
    for (const side of [-1, 1]) for (const edge of [-1, 1]) {
      const lug = this.mesh(lugGeometry, [titanium, polished], this.caseGroup, edge * .92, side * 2.29, -.27);
      lug.rotation.z = -side * edge * .12;
    }
    const crown = new THREE.Group(); crown.position.set(2.28, .02, .22); crown.rotation.y = Math.PI / 2; this.caseGroup.add(crown);
    this.mesh(cylinderGeometry(.115, .29, 48), polished, crown, 0, 0, -.08);
    this.mesh(gearGeometry({ teeth: 48, radius: .287, depth: .34, module: .012, spokes: 0, holeRadius: .085 }),
      [titanium, polished], crown, 0, 0, .14);
    this.mesh(cylinderGeometry(.272, .035, 80), polished, crown, 0, 0, .48);
    this.torus(crown, .235, .009, titanium, 0, 0, .519);
    const crownMark = this.mesh(roundedRectGeometry(.073, .073, .006, .004, .002), darkSteel, crown, 0, 0, .52);
    crownMark.rotation.z = Math.PI / 4;
    this.label(this.caseGroup, 'CALIBRE C.01  ·  MANUAL WIND', .34, -1.80, -.128, 1.48, '#66695f');
  }

  private buildStrap(): void {
    const shape = new THREE.Shape();
    shape.moveTo(-.80, 0); shape.lineTo(.80, 0); shape.lineTo(.72, 3.65);
    shape.quadraticCurveTo(.68, 3.88, .47, 4.0); shape.lineTo(-.47, 4.0);
    shape.quadraticCurveTo(-.68, 3.88, -.72, 3.65); shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: .14, bevelEnabled: true, bevelSize: .026,
      bevelThickness: .025, bevelSegments: 3, curveSegments: 12, steps: 18 });
    const pos = geometry.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i); pos.setZ(i, pos.getZ(i) - .09 * y * y);
    }
    geometry.computeVertexNormals();
    for (const side of [-1, 1]) {
      const half = new THREE.Group(); half.position.set(0, side * 2.29, -.21);
      if (side < 0) half.rotation.z = Math.PI;
      this.strapGroup.add(half);
      this.mesh(geometry, this.materials.strap, half);
      const stitchGeometry = roundedRectGeometry(.016, .045, .007, .004, .001);
      const stitches = new THREE.InstancedMesh(stitchGeometry, this.materials.stitch, 70);
      let count = 0;
      for (const edge of [-1, 1]) for (let i = 0; i < 35; i++) {
        const y = .12 + i * .10;
        this.dummy.position.set(edge * (.706 - y * .020), y, .17 - .09 * y * y);
        this.dummy.rotation.set(0, 0, -.12 * edge); this.dummy.scale.setScalar(1); this.dummy.updateMatrix();
        stitches.setMatrixAt(count++, this.dummy.matrix);
      }
      half.add(stitches);
      if (side < 0) {
        for (let i = 0; i < 6; i++) this.mesh(cylinderGeometry(.043, .001, 24), this.materials.darkSteel,
          half, 0, 1.25 + i * .29, .172 - .09 * Math.pow(1.25 + i * .29, 2), false);
      }
    }
  }

  private buildTrain(): void {
    const { brass, brassEdge, polished, darkSteel, spring } = this.materials;
    for (let i = 0; i < TRAIN.length; i++) {
      const wheel = TRAIN[i];
      const group = new THREE.Group(); group.name = wheel.label;
      group.position.set(wheel.x, wheel.y, wheel.z); this.model.add(group); this.wheelGroups.set(wheel.id, group);
      if (wheel.id === 'barrel') {
        const gear = this.mesh(gearGeometry({ teeth: wheel.teeth, radius: wheel.pitchRadius, depth: .052,
          module: MODULE, annular: true }), [brass, brassEdge], group, 0, 0, -.026);
        gear.rotation.z = wheel.wheelPhase;
        this.mesh(cylinderGeometry(.702, .029, 100), darkSteel, group, 0, 0, -.275);
        this.mesh(annulusGeometry(.682, .730, .215, .009, 112), [this.materials.silver, polished], group, 0, 0, -.230);
        this.torus(group, .709, .013, polished, 0, 0, -.003);
        this.torus(group, .702, .009, brassEdge, 0, 0, -.228);
        for (let j = 0; j < 3; j++) this.torus(group, .730, .0024, darkSteel, 0, 0, -.169 + .042 * j);
        this.mesh(annulusGeometry(.043, .129, .034, .006, 64), [brass, brassEdge], group, 0, 0, -.229);
        this.mesh(cylinderGeometry(.045, .315, 40), polished, group, 0, 0, -.290);
        this.barrelSpringGroup.position.set(wheel.x, wheel.y, wheel.z - .222);
        this.mesh(this.mainSpring.geometry, spring, this.barrelSpringGroup);
        this.capGroup.position.set(wheel.x, wheel.y, wheel.z + .030);
        this.mesh(cylinderGeometry(.731, .035, 112), this.materials.silver, this.capGroup);
        this.torus(this.capGroup, .704, .009, polished, 0, 0, .039);
        this.mesh(annulusGeometry(.05, .144, .018, .005, 64), [brass, brassEdge], this.capGroup, 0, 0, .036);
        this.screws(this.capGroup, [{ x: -.38, y: -.34, z: .042, scale: .64 }, { x: .38, y: .34, z: .042, scale: .64 }]);
        this.label(this.capGroup, 'CHRONOS', 0, .31, .041, .79, '#3b3d37');
        this.label(this.capGroup, 'MAINSPRING', 0, -.32, .041, .63, '#56584e');
      } else {
        const gear = this.mesh(wheel.id === 'escape' ? escapeGeometry(wheel.visualRadius) : gearGeometry({
          teeth: wheel.teeth, radius: wheel.pitchRadius, module: MODULE, depth: .052,
          spokes: wheel.id === 'fourth' ? 5 : 4,
        }), wheel.id === 'escape' ? [this.materials.silver, polished] : [brass, brassEdge], group, 0, 0, -.026);
        gear.rotation.z = wheel.wheelPhase;
        const pinion = this.mesh(gearGeometry({ teeth: wheel.pinion, radius: wheel.pinionRadius,
          module: MODULE, depth: .051, spokes: 0, holeRadius: .023 }), [polished, darkSteel], group,
          0, 0, wheel.pinionZ - wheel.z - .0255);
        pinion.rotation.z = wheel.pinionPhase;
        const bearingZ = wheel.id === 'centre' ? .544 : wheel.id === 'third' ? .616 : wheel.id === 'fourth' ? .706 : .704;
        this.mesh(cylinderGeometry(.032, bearingZ - wheel.z + .145, 36), polished, group, 0, 0, -.10);
        this.mesh(annulusGeometry(.032, wheel.id === 'escape' ? .083 : .122, .032, .007, 64),
          [brass, brassEdge], group, 0, 0, .031);
        if (wheel.id !== 'escape') {
          this.torus(group, wheel.pitchRadius * .85, .006, brassEdge, 0, 0, .031);
          this.torus(group, wheel.pitchRadius * .812, .0025, this.materials.darkSteel, 0, 0, .030);
          this.torus(group, .144, .0035, brassEdge, 0, 0, .032);
        }
      }
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(wheel.x, wheel.y, -.18), new THREE.Vector3(wheel.x, wheel.y, 2.35),
      ]);
      const line = new THREE.Line(lineGeometry, new THREE.LineDashedMaterial({ color: 0xbfb8a5,
        transparent: true, opacity: .15, dashSize: .035, gapSize: .048, depthWrite: false }));
      line.computeLineDistances(); this.axisGroup.add(line);
    }
  }

  private buildBalance(): void {
    const { brass, brassEdge, polished, blue, silver } = this.materials;
    this.balance.position.set(BALANCE_CENTER.x, BALANCE_CENTER.y, BALANCE_CENTER.z);
    this.balance.name = '4 Hz balance wheel';
    this.mesh(annulusGeometry(BALANCE_RADIUS - .055, BALANCE_RADIUS, .042, .009, 128), [brass, brassEdge], this.balance);
    this.torus(this.balance, BALANCE_RADIUS - .017, .010, brassEdge, 0, 0, .047);
    this.torus(this.balance, BALANCE_RADIUS - .049, .007, polished, 0, 0, .025);
    const spokeGeometry = bridgeGeometry([[.06, 0], [.27, .02], [BALANCE_RADIUS - .036, 0]], .060, .029);
    for (let i = 0; i < 3; i++) {
      const spoke = this.mesh(spokeGeometry, [brass, brassEdge], this.balance, 0, 0, .005);
      spoke.rotation.z = i * TAU / 3;
    }
    this.mesh(cylinderGeometry(.102, .087, 64), polished, this.balance, 0, 0, -.004);
    this.mesh(cylinderGeometry(.028, .410, 36), polished, this.balance, 0, 0, -.015);
    this.mesh(annulusGeometry(.039, .129, .020, .004, 64), [brass, brassEdge], this.balance, 0, 0, .07);
    const weights: ScrewSpec[] = [];
    for (let i = 0; i < 12; i++) {
      const a = i * TAU / 12 + .08;
      weights.push({ x: Math.cos(a) * .663, y: Math.sin(a) * .663, z: .043, scale: .43, angle: a });
    }
    this.screws(this.balance, weights, this.materials.brassEdge);
    this.hairspringGroup.position.set(BALANCE_CENTER.x, BALANCE_CENTER.y, BALANCE_CENTER.z + .134);
    this.mesh(this.hairSpring.geometry, blue, this.hairspringGroup);
    // The outer terminal is physically stationary while the collet follows the balance.
    const outerAngle = -.45 * Math.PI + TAU * this.hairSpring.turns;
    const ox = Math.cos(outerAngle) * this.hairSpring.outer;
    const oy = Math.sin(outerAngle) * this.hairSpring.outer;
    this.mesh(roundedRectGeometry(.10, .085, .036, .017, .004), silver, this.hairspringGroup,
      ox, oy, -.012).rotation.z = outerAngle;
    this.screws(this.hairspringGroup, [{ x: ox, y: oy, z: .027, scale: .59 }]);
    this.fork.position.set(FORK_CENTER.x, FORK_CENTER.y, FORK_CENTER.z - .032);
    this.fork.rotation.z = FORK_AXIS_ANGLE;
    const forkShape = new THREE.Shape();
    forkShape.moveTo(-.18, -.223); forkShape.lineTo(-.08, -.186); forkShape.lineTo(.01, -.045);
    forkShape.lineTo(.19, -.032); forkShape.lineTo(.28, -.074); forkShape.lineTo(.29, -.050);
    forkShape.lineTo(.24, 0); forkShape.lineTo(.29, .050); forkShape.lineTo(.28, .074);
    forkShape.lineTo(.19, .032); forkShape.lineTo(.01, .045); forkShape.lineTo(-.08, .186);
    forkShape.lineTo(-.18, .223); forkShape.lineTo(-.17, .174); forkShape.lineTo(-.07, .04);
    forkShape.lineTo(-.055, -.04); forkShape.lineTo(-.17, -.174); forkShape.closePath();
    this.mesh(new THREE.ExtrudeGeometry(forkShape, { depth: .028, bevelEnabled: true, bevelSize: .007,
      bevelThickness: .006, bevelSegments: 2, curveSegments: 8 }), [silver, polished], this.fork);
    for (const side of [-1, 1]) {
      const jewel = this.mesh(roundedRectGeometry(.065, .045, .037, .006, .004), this.materials.ruby,
        this.fork, -.165, side * .205, .015);
      jewel.rotation.z = side * .4;
    }
    this.mesh(cylinderGeometry(.042, .10, 40), polished, this.fork, 0, 0, -.027);
  }

  private buildBridges(): void {
    const { silver, polished, titanium } = this.materials;
    const bridgeMat = [silver, polished];
    this.bridgeGroup.name = 'Striped and hand-bevelled movement bridges';
    const supports = [
      [-1.73, 1.045, .45], [1.61, 1.018, .45], [1.69, .718, .53],
      [1.75, -.66, .53], [-1.68, -.73, .61], [1.38, -1.28, .61],
    ];
    const pillars = new THREE.InstancedMesh(cylinderGeometry(.069, 1, 40), titanium, supports.length);
    for (let i = 0; i < supports.length; i++) {
      const [x, y, top] = supports[i];
      this.dummy.position.set(x, y, -.143); this.dummy.rotation.set(0, 0, 0);
      this.dummy.scale.set(1, 1, top + .143); this.dummy.updateMatrix();
      pillars.setMatrixAt(i, this.dummy.matrix);
    }
    pillars.castShadow = true; pillars.receiveShadow = true; this.bridgeGroup.add(pillars);
    this.mesh(bridgeGeometry([[-1.75, 1.04], [-1.17, 1.42], [-.43, 1.46], [.06, .856], [.70, .75], [1.63, 1.02]], .25, .085),
      bridgeMat, this.bridgeGroup, 0, 0, .45);
    this.mesh(bridgeGeometry([[1.71, .73], [1.47, .51], [.774, .168], [1.33, -.27], [1.76, -.67]], .255, .08),
      bridgeMat, this.bridgeGroup, 0, 0, .53);
    this.mesh(bridgeGeometry([[-1.68, -.73], [-1.17, -.46], [-.69, -.49], [.41, -.69], [1.39, -1.29]], .235, .084),
      bridgeMat, this.bridgeGroup, 0, 0, .61);
    this.mesh(bridgeGeometry([[-.10, -1.91], [.38, -1.64], [1.33, -1.47]], .18, .075),
      [titanium, polished], this.bridgeGroup, 0, 0, .48);
    this.screws(this.bridgeGroup, [
      { x: -1.73, y: 1.045, z: .54 }, { x: -.45, y: 1.45, z: .54 }, { x: 1.61, y: 1.018, z: .54 },
      { x: 1.69, y: .718, z: .62 }, { x: 1.75, y: -.66, z: .62 },
      { x: -1.67, y: -.724, z: .704 }, { x: 1.38, y: -1.28, z: .704 },
      { x: -.08, y: -1.895, z: .564, scale: .82 }, { x: 1.30, y: -1.47, z: .564, scale: .82 },
    ]);
    this.jewel(this.bridgeGroup, TRAIN_BY_ID.centre.x, TRAIN_BY_ID.centre.y, .544, 1.07);
    this.craftBearing = this.jewel(this.bridgeGroup, TRAIN_BY_ID.third.x, TRAIN_BY_ID.third.y, .616, 1.12);
    this.jewel(this.bridgeGroup, TRAIN_BY_ID.fourth.x, TRAIN_BY_ID.fourth.y, .706, 1.10);
    this.jewel(this.bridgeGroup, TRAIN_BY_ID.escape.x, TRAIN_BY_ID.escape.y, .704, .79);
    this.label(this.bridgeGroup, 'CALIBRE  C.01', .81, -1.40, .574, .91, '#343a36');
    this.label(this.bridgeGroup, 'CHRONOS', .88, .785, .545, .63, '#3e423b');
    this.balanceBridgeGroup.name = 'Balance cock and fixed ruby bearing';
    this.mesh(bridgeGeometry([[-1.94, -1.00], [-1.58, -1.10], [-1.04, -1.15], [-.59, -1.47]], .16, .058),
      bridgeMat, this.balanceBridgeGroup, 0, 0, .711);
    this.mesh(annulusGeometry(.121, .156, .062, .006, 64), [silver, polished], this.balanceBridgeGroup,
      BALANCE_CENTER.x, BALANCE_CENTER.y, .706);
    this.jewel(this.balanceBridgeGroup, BALANCE_CENTER.x, BALANCE_CENTER.y, .779, 1.07);
    this.screws(this.balanceBridgeGroup, [
      { x: -1.895, y: -.997, z: .779, scale: .93 }, { x: -.61, y: -1.45, z: .779, scale: .93 },
      { x: -1.26, y: -1.093, z: .779, scale: .62 },
    ]);
    const regulator = this.mesh(bridgeGeometry([[0, 0], [.21, -.095], [.33, -.03]], .038, .018), polished,
      this.balanceBridgeGroup, BALANCE_CENTER.x, BALANCE_CENTER.y, .77);
    regulator.rotation.z = .35;
  }

  private buildDial(): void {
    const { polished, brassEdge, dial, blue } = this.materials;
    this.dialGroup.name = 'Open worked dial, sapphire crystal and time display';
    this.mesh(annulusGeometry(1.724, 2.205, .056, .014, 128), dial, this.dialGroup, 0, 0, .817);
    this.mesh(annulusGeometry(2.203, 2.347, .062, .014, 128), polished, this.dialGroup, 0, 0, .820);
    this.torus(this.dialGroup, 1.727, .012, polished, 0, 0, .883);
    this.torus(this.dialGroup, 2.212, .014, polished, 0, 0, .889);
    const markerGeometry = roundedRectGeometry(.035, .117, .02, .008, .004);
    const ticks = new THREE.InstancedMesh(markerGeometry, polished, 60);
    const hourGeometry = roundedRectGeometry(.061, .233, .028, .011, .005);
    const hours = new THREE.InstancedMesh(hourGeometry, brassEdge, 12);
    for (let i = 0; i < 60; i++) {
      const a = i * TAU / 60;
      this.dummy.position.set(Math.sin(a) * 2.087, Math.cos(a) * 2.087, .878);
      this.dummy.rotation.set(0, 0, -a); this.dummy.scale.set(.42, .45, .55); this.dummy.updateMatrix();
      ticks.setMatrixAt(i, this.dummy.matrix);
      if (i % 5 === 0) {
        this.dummy.position.set(Math.sin(a) * 1.987, Math.cos(a) * 1.987, .885);
        this.dummy.scale.setScalar(1); this.dummy.updateMatrix(); hours.setMatrixAt(i / 5, this.dummy.matrix);
      }
    }
    this.dialGroup.add(ticks, hours);
    this.label(this.dialGroup, 'CHRONOS', 0, 1.68, .891, 1.20, '#d1c9b5', true);
    this.label(this.dialGroup, 'MECHANICAL  ·  C.01', 0, -1.82, .891, .93, '#85877b');
    this.hourHand = this.mesh(handGeometry(1.29, .105, .18), [polished, brassEdge], this.dialGroup, 0, 0, .956);
    this.minuteHand = this.mesh(handGeometry(1.805, .083, .23), [polished, brassEdge], this.dialGroup, 0, 0, .990);
    this.secondHand = this.mesh(handGeometry(1.86, .020, .38, false), blue, this.dialGroup, 0, 0, 1.027);
    this.mesh(cylinderGeometry(.115, .042, 64), polished, this.dialGroup, 0, 0, 1.006);
    this.mesh(cylinderGeometry(.067, .018, 48), blue, this.dialGroup, 0, 0, 1.051);
    this.mesh(cylinderGeometry(2.20, .012, 128), this.materials.glass, this.dialGroup, 0, 0, 1.098, false);
  }

  private fadeSet(group: THREE.Group): FadeSet {
    const map = new Map<THREE.Material, THREE.Material>();
    group.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const clone = (original: THREE.Material) => {
        let copy = map.get(original);
        if (!copy) {
          copy = original.clone(); copy.transparent = true;
          copy.userData.originalOpacity = original.opacity;
          copy.userData.originalDepthWrite = original.depthWrite;
          map.set(original, copy);
        }
        return copy;
      };
      object.material = Array.isArray(object.material) ? object.material.map(clone) : clone(object.material);
    });
    const fade = { group, materials: Array.from(map.values()) };
    this.fades.push(fade);
    return fade;
  }

  private fade(fade: FadeSet, opacity: number): void {
    fade.group.visible = opacity > .002;
    for (const material of fade.materials) {
      material.opacity = opacity * (material.userData.originalOpacity ?? 1);
      material.depthWrite = opacity > .97 && (material.userData.originalDepthWrite ?? true);
    }
  }

  resize(width: number, height: number, dpr = 1): void {
    if (this.disposed) return;
    this.width = Math.max(1, width); this.height = Math.max(1, height);
    this.aspect = this.width / this.height;
    this.mobile = portraitLayout(this.width, this.height);
    this.dpr = Math.min(1.5, Math.max(.75, dpr), Math.sqrt(2_050_000 / (this.width * this.height)));
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(this.width, this.height, false);
    const mapSize = this.mobile ? 512 : 1024;
    if (this.keyLight.shadow.mapSize.x !== mapSize) {
      this.keyLight.shadow.mapSize.set(mapSize, mapSize);
      this.keyLight.shadow.map?.dispose(); this.keyLight.shadow.map = null;
    }
  }

  render(frame: WatchFrame): void {
    if (this.disposed || this.lost) return;
    const p = clamp(Number.isFinite(frame.progress) ? frame.progress : 0);
    this.lastProgress = p;
    const interval = Math.min(4, Math.floor(p * 5));
    const blend = smooth(0, 1, p * 5 - interval);
    const a = STAGES[interval], b = STAGES[interval + 1];
    const explode = lerp(a.explode, b.explode, blend);
    const drift = frame.reduced ? 0 : Math.sin(frame.time * .61) * .010;
    const px = frame.reduced ? 0 : clamp(frame.pointerX || 0, -1, 1);
    const py = frame.reduced ? 0 : clamp(frame.pointerY || 0, -1, 1);
    this.model.rotation.set(lerp(a.rx, b.rx, blend) + drift + py * .013,
      lerp(a.ry, b.ry, blend) + px * .021, lerp(a.rz, b.rz, blend) + drift * .35);
    const interior = Math.max(clamp(frame.entranceReveal ?? 0), smooth(.035, .145, p) * (1 - smooth(.845, .970, p)));
    this.fade(this.dialFade, 1 - interior);
    this.fade(this.strapFade, 1 - interior);
    this.dialGroup.position.z = interior * (1.28 + explode * .65);
    this.strapGroup.position.z = -interior * .30;
    this.caseGroup.position.z = -explode * .18;
    const capOpen = smooth(.03, .17, p) * (1 - smooth(.84, .966, p));
    this.capGroup.position.z = TRAIN_BY_ID.barrel.z + .030 + capOpen * (.85 + explode * .45);
    this.fade(this.capFade, 1 - capOpen);
    const energy = smooth(.035, .15, p) * (1 - smooth(.22, .32, p));
    this.bridgeGroup.position.z = explode * 1.40 + energy * 1.25;
    this.fade(this.bridgeFade, 1 - smooth(.20, .82, energy));
    this.balanceBridgeGroup.position.z = explode * 1.50;
    this.axisGroup.visible = explode > .07;
    this.axisGroup.children.forEach(line => {
      ((line as THREE.Line).material as THREE.LineDashedMaterial).opacity = explode * .18;
    });
    writeMechanicalPose(frame.time, frame.slow, frame.reduced, this.pose);
    for (let i = 0; i < TRAIN.length; i++) {
      const wheel = TRAIN[i], group = this.wheelGroups.get(wheel.id)!;
      group.rotation.z = this.pose[wheel.id];
      group.position.z = wheel.z + explode * (.10 + i * .26) + (i > 0 ? energy * (.33 + i * .07) : 0);
    }
    this.balance.position.z = BALANCE_CENTER.z + explode * 1.12;
    this.hairspringGroup.position.z = BALANCE_CENTER.z + .134 + explode * 1.12;
    this.fork.position.z = FORK_CENTER.z - .032 + explode * 1.03;
    this.balance.rotation.z = this.pose.balance;
    this.fork.rotation.z = FORK_AXIS_ANGLE + this.pose.fork;
    if (Math.abs(this.pose.balance - this.lastBalance) > .0002 || !Number.isFinite(this.lastBalance)) {
      this.hairSpring.update(this.pose.balance, 0, this.pose.balance * .0023);
      this.lastBalance = this.pose.balance;
    }
    // The barrel's outer terminal follows its actual slow shaft; scroll exposes
    // a small, reversible change in stored spring tension during the opening.
    const winding = energy * .64 + this.pose.barrel;
    if (Math.abs(winding - this.lastSpringWind) > .0001 || !Number.isFinite(this.lastSpringWind)) {
      this.mainSpring.update(energy * -.86, this.pose.barrel, -.007 * energy);
      this.lastSpringWind = winding;
    }
    this.barrelSpringGroup.position.z = TRAIN_BY_ID.barrel.z - .222 + explode * .10;
    this.hourHand.rotation.z = .96 + this.pose.centre / 12;
    this.minuteHand.rotation.z = -1.05 + this.pose.centre;
    this.secondHand.rotation.z = -2.19 + this.pose.fourth;
    let span = lerp(a.span, b.span, blend);
    if (this.mobile) {
      // The mechanism fits the viewport width and rests below the text block.
      const subjectWidth = lerp(interval === 0 ? 3.6 : interval === 1 ? 2.52 : interval === 2 ? 5.0 : interval === 3 ? 2.48 : 1.80,
        interval === 0 ? 2.52 : interval === 1 ? 5.0 : interval === 2 ? 2.48 : interval === 3 ? 1.80 : 5.3, blend);
      span = Math.max(span * .88, subjectWidth / this.aspect);
    }
    this.camera.aspect = this.aspect;
    this.camera.updateProjectionMatrix();
    this.focus.set(lerp(a.x, b.x, blend), lerp(a.y, b.y, blend), lerp(a.z, b.z, blend) + explode * .18);
    this.model.updateMatrixWorld(true);
    this.worldPoint.copy(this.focus).applyMatrix4(this.model.matrixWorld);
    const entryAnchor = 1 - smooth(.035, .145, p);
    const offsetX = span * this.aspect * (this.mobile ? entryAnchor * .05 : lerp(.197, .24, entryAnchor));
    const offsetY = this.mobile ? span * .13 : -span * .005;
    const distance = span / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)));
    this.camera.position.set(this.worldPoint.x - offsetX, this.worldPoint.y + offsetY, this.worldPoint.z + distance);
    this.camera.lookAt(this.worldPoint.x - offsetX, this.worldPoint.y + offsetY, this.worldPoint.z);
    this.renderer.render(this.scene, this.camera);
  }

  /** Pixel positions for optional app-owned callouts. No labels are baked into the renderer. */
  projectPart(id: TrainId | 'balance' | 'ruby'): { x: number; y: number; visible: boolean } {
    const object = id === 'ruby' ? this.craftBearing : id === 'balance' ? this.balance : this.wheelGroups.get(id)!;
    // The photographic handoff follows the stone's front surface, not its wheel shaft.
    this.projectVector.set(0, 0, id === 'ruby' ? .037 : 0).applyMatrix4(object.matrixWorld).project(this.camera);
    return { x: (this.projectVector.x * .5 + .5) * this.width,
      y: (-this.projectVector.y * .5 + .5) * this.height,
      visible: Math.abs(this.projectVector.x) <= 1 && Math.abs(this.projectVector.y) <= 1 };
  }

  getDiagnostics(): { ready: boolean; contextLost: boolean; drawCalls: number; triangles: number;
    pixelRatio: number; width: number; height: number; progress: number; geometries: number; textures: number } {
    return { ready: !this.disposed && !this.lost, contextLost: this.lost,
      drawCalls: this.renderer.info.render.calls, triangles: this.renderer.info.render.triangles,
      pixelRatio: this.dpr, width: this.width, height: this.height, progress: this.lastProgress,
      geometries: this.renderer.info.memory.geometries, textures: this.renderer.info.memory.textures };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.canvas.removeEventListener('webglcontextlost', this.contextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.contextRestored);
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    this.scene.traverse(object => {
      const renderable = object as THREE.Mesh;
      if (renderable.geometry) geometries.add(renderable.geometry);
      if (renderable.material) {
        const list = Array.isArray(renderable.material) ? renderable.material : [renderable.material];
        list.forEach(material => materials.add(material));
      }
    });
    for (const geometry of this.geometries.values()) geometries.add(geometry);
    for (const material of Object.values(this.materials)) if (material instanceof THREE.Material) materials.add(material);
    for (const fade of this.fades) for (const material of fade.materials) materials.add(material);
    geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose());
    this.materials.textures.forEach(texture => texture.dispose());
    this.extraTextures.forEach(texture => texture.dispose());
    this.environmentTarget?.dispose();
    this.renderer.dispose();
  }
}

export default WatchScene;
