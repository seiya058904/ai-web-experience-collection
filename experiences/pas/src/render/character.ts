import * as THREE from 'three';
import type { BodyPose, DancerId, HandPose, JointName, Side, Vec3 } from '../motion-types';

interface AttributeSpec { offset: number; length: number; type: '<f4' | '<u2' | '<u4'; itemSize: number }
interface MeshSpec {
  name: 'body' | 'shirt' | 'pants' | 'hair';
  attributes: Record<string, AttributeSpec> & { vertexCount: number; triangleCount: number };
}
interface RestBone { name: string; head: Vec3; tail: Vec3; parent: string | null }
interface ModelFile {
  version: number;
  id: DancerId;
  bones: RestBone[];
  binary: string;
  metrics: { height: number; joints: Record<JointName, Vec3> };
  meshes: MeshSpec[];
}
interface ModelAsset {
  data: ModelFile;
  geometries: Map<string, THREE.BufferGeometry>;
  materials: Map<string, THREE.MeshStandardMaterial>;
}

export interface CharacterAssets {
  models: Record<DancerId, ModelAsset>;
  /** Called after all character instances have released their skeletons. */
  dispose(): void;
}

const up = new THREE.Vector3(0, 1, 0);
const forward = new THREE.Vector3(0, 0, 1);
const origin = new THREE.Vector3();
const v3 = (v: Vec3) => new THREE.Vector3(v[0], v[1], v[2]);
const clamp = THREE.MathUtils.clamp;

async function checkedFetch(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Character resource could not be read (${response.status}).`);
  return response;
}

function grainTexture(fabric: boolean) {
  const width = 256;
  const values = new Uint8Array(width * width * 4);
  let seed = 68317;
  for (let y = 0; y < width; y++) {
    for (let x = 0; x < width; x++) {
      seed = (1664525 * seed + 1013904223) >>> 0;
      const noise = ((seed >>> 24) / 255 - .5) * (fabric ? 28 : 38);
      const weave = fabric ? Math.sin(x * Math.PI / 2) * 15 + Math.cos(y * Math.PI / 2) * 15 : 0;
      const c = clamp(128 + noise + weave, 0, 255);
      const i = (y * width + x) * 4;
      values[i] = values[i + 1] = values[i + 2] = c;
      values[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(values, width, width, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(fabric ? 16 : 12, fabric ? 16 : 12);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

/** Shared immutable mesh and texture data; each visible body gets its own rig. */
export async function loadCharacterAssets(baseUrl = `${import.meta.env.BASE_URL}pas/`): Promise<CharacterAssets> {
  const prefix = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const loader = new THREE.TextureLoader();
  const ownedTextures: THREE.Texture[] = [];
  const ownedGeometries: THREE.BufferGeometry[] = [];
  const ownedMaterials: THREE.Material[] = [];
  const loadTexture = async (name: string, color = true) => {
    const texture = await loader.loadAsync(`${prefix}assets/textures/${name}`);
    texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.anisotropy = 4;
    ownedTextures.push(texture);
    return texture;
  };
  const dispose = () => {
    for (const geometry of ownedGeometries.splice(0)) geometry.dispose();
    for (const material of ownedMaterials.splice(0)) material.dispose();
    for (const texture of ownedTextures.splice(0)) texture.dispose();
  };
  try {
    // Wait for every sibling load before cleanup, so a late success cannot
    // allocate an orphaned texture after another request has already failed.
    const textureResults = await Promise.allSettled([
      loadTexture('cotton.webp'), loadTexture('cotton-bump.webp', false),
      loadTexture('cen-skin.webp'), loadTexture('cheng-skin.webp'),
      loadTexture('cen-hair.webp'), loadTexture('cheng-hair.webp'),
    ]);
    const failedTexture = textureResults.find(result => result.status === 'rejected');
    if (failedTexture?.status === 'rejected') throw failedTexture.reason;
    const [cotton, cottonBump, cenSkin, chengSkin, cenHair, chengHair] = textureResults.map(result => (result as PromiseFulfilledResult<THREE.Texture>).value);
    const skinGrain = grainTexture(false), clothGrain = grainTexture(true);
    ownedTextures.push(skinGrain, clothGrain);
    const readModel = async (id: DancerId): Promise<ModelAsset> => {
      const data = await (await checkedFetch(`${prefix}assets/models/${id}.json`)).json() as ModelFile;
      if (data.version !== 1 || data.id !== id) throw new Error('The character asset has an unsupported format.');
      const buffer = await (await checkedFetch(`${prefix}assets/models/${data.binary}`)).arrayBuffer();
      const geometries = new Map<string, THREE.BufferGeometry>();
      for (const mesh of data.meshes) {
        const geometry = new THREE.BufferGeometry();
        for (const key of ['position', 'normal', 'uv', 'skinIndex', 'skinWeight', 'index']) {
          const attr = mesh.attributes[key];
          const array = attr.type === '<f4' ? new Float32Array(buffer, attr.offset, attr.length)
            : attr.type === '<u2' ? new Uint16Array(buffer, attr.offset, attr.length)
              : new Uint32Array(buffer, attr.offset, attr.length);
          const attribute = new THREE.BufferAttribute(array, attr.itemSize);
          if (key === 'index') geometry.setIndex(attribute);
          else geometry.setAttribute(key, attribute);
        }
        geometry.computeBoundingSphere();
        geometries.set(mesh.name, geometry);
        ownedGeometries.push(geometry);
      }
      const materials = new Map<string, THREE.MeshStandardMaterial>([
        ['body', new THREE.MeshStandardMaterial({
          map: id === 'cen' ? cenSkin : chengSkin,
          color: id === 'cen' ? '#fff3e5' : '#d9b18b',
          roughness: .88, metalness: 0, bumpMap: skinGrain, bumpScale: .00034,
        })],
        ['shirt', new THREE.MeshStandardMaterial({
          map: cotton, bumpMap: cottonBump, bumpScale: .0015,
          color: id === 'cen' ? '#b95b43' : '#d9c7ae',
          roughness: .98, metalness: 0, side: THREE.DoubleSide,
        })],
        ['pants', new THREE.MeshStandardMaterial({
          color: '#302c29', bumpMap: clothGrain, bumpScale: .0012,
          roughness: .98, metalness: 0, side: THREE.DoubleSide,
        })],
        ['hair', new THREE.MeshStandardMaterial({
          map: id === 'cen' ? cenHair : chengHair,
          color: id === 'cen' ? '#47352a' : '#38291d',
          roughness: .94, metalness: 0, alphaTest: .42, side: THREE.DoubleSide,
        })],
      ]);
      for (const material of materials.values()) ownedMaterials.push(material);
      return { data, geometries, materials };
    };
    const modelResults = await Promise.allSettled([readModel('cen'), readModel('cheng')]);
    const failedModel = modelResults.find(result => result.status === 'rejected');
    if (failedModel?.status === 'rejected') throw failedModel.reason;
    const [cen, cheng] = modelResults.map(result => (result as PromiseFulfilledResult<ModelAsset>).value);
    return { models: { cen, cheng }, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}

/** A rigid map between a reference segment and the corresponding posed segment. */
class RigidMap {
  readonly q = new THREE.Quaternion();
  readonly from = new THREE.Vector3();
  readonly to = new THREE.Vector3();
  private restBasis = new THREE.Matrix4();
  private targetBasis = new THREE.Matrix4();
  private restQ = new THREE.Quaternion();
  private targetQ = new THREE.Quaternion();
  private a = new THREE.Vector3();
  private b = new THREE.Vector3();
  private c = new THREE.Vector3();

  private basis(axis: THREE.Vector3, normal: THREE.Vector3, matrix: THREE.Matrix4) {
    this.a.copy(axis).normalize();
    if (this.a.lengthSq() < 1e-8) this.a.copy(up);
    this.b.copy(normal).addScaledVector(this.a, -normal.dot(this.a));
    if (this.b.lengthSq() < 1e-8) {
      this.b.set(Math.abs(this.a.x) < .8 ? 1 : 0, Math.abs(this.a.x) < .8 ? 0 : 1, 0);
      this.b.addScaledVector(this.a, -this.b.dot(this.a));
    }
    this.b.normalize();
    this.c.crossVectors(this.a, this.b).normalize();
    matrix.makeBasis(this.c, this.a, this.b);
  }

  set(restStart: THREE.Vector3, restEnd: THREE.Vector3, targetStart: THREE.Vector3, targetEnd: THREE.Vector3, restNormal: THREE.Vector3, targetNormal: THREE.Vector3) {
    this.from.copy(restStart); this.to.copy(targetStart);
    const restAxis = restEnd.clone().sub(restStart);
    const targetAxis = targetEnd.clone().sub(targetStart);
    this.basis(restAxis, restNormal, this.restBasis);
    this.basis(targetAxis, targetNormal, this.targetBasis);
    this.restQ.setFromRotationMatrix(this.restBasis).invert();
    this.targetQ.setFromRotationMatrix(this.targetBasis);
    this.q.copy(this.targetQ).multiply(this.restQ).normalize();
    return this;
  }

  yaw(restAnchor: THREE.Vector3, targetAnchor: THREE.Vector3, angle: number) {
    this.from.copy(restAnchor); this.to.copy(targetAnchor);
    this.q.setFromAxisAngle(up, angle);
    return this;
  }

  point(source: THREE.Vector3, result = new THREE.Vector3()) {
    return result.copy(source).sub(this.from).applyQuaternion(this.q).add(this.to);
  }
}

interface BoneState { source: RestBone; bone: THREE.Bone; head: THREE.Vector3; tail: THREE.Vector3 }
type RestJoints = Record<JointName, THREE.Vector3>;

export interface Character {
  readonly group: THREE.Group;
  update(pose: BodyPose): void;
  dispose(): void;
}

/**
 * Drive genuine anatomical geometry from one immutable pose query.
 * Flat bone matrices avoid hidden animation mixers and order-dependent IK.
 * Source CC0 bind positions are used directly; no dance data is imported.
 */
export function createCharacter(id: DancerId, assets: CharacterAssets): Character {
  const asset = assets.models[id];
  const group = new THREE.Group(); group.name = id === 'cen' ? 'Cen' : 'Cheng';
  const rest = Object.fromEntries(Object.entries(asset.data.metrics.joints).map(([key, value]) => [key, v3(value)])) as RestJoints;
  const states: BoneState[] = asset.data.bones.map(source => {
    const bone = new THREE.Bone(); bone.name = source.name;
    bone.position.fromArray(source.head);
    group.add(bone);
    return { source, bone, head: v3(source.head), tail: v3(source.tail) };
  });
  const byName = new Map(states.map(b => [b.source.name, b]));
  const inverses = states.map(state => new THREE.Matrix4().makeTranslation(-state.head.x, -state.head.y, -state.head.z));
  const skeleton = new THREE.Skeleton(states.map(s => s.bone), inverses);
  const meshes: THREE.SkinnedMesh[] = [];
  for (const [name, geometry] of asset.geometries) {
    const mesh = new THREE.SkinnedMesh(geometry, asset.materials.get(name));
    mesh.name = `${id}-${name}`;
    mesh.frustumCulled = false;
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.bind(skeleton, new THREE.Matrix4());
    mesh.renderOrder = name === 'hair' ? 2 : 0;
    group.add(mesh); meshes.push(mesh);
  }

  const props = new THREE.Group(); props.name = `${id}-head-details`; group.add(props);
  const ownGeometries: THREE.BufferGeometry[] = [];
  const ownMaterials: THREE.Material[] = [];
  const skinEye = new THREE.MeshStandardMaterial({ color: '#c9c2b3', roughness: .62 });
  const irisMaterial = new THREE.MeshStandardMaterial({ color: '#33251b', roughness: .55 });
  const pupilMaterial = new THREE.MeshStandardMaterial({ color: '#100e0c', roughness: .5 });
  const hairDetailMaterial = new THREE.MeshStandardMaterial({ color: '#211914', roughness: .93, metalness: 0 });
  ownMaterials.push(skinEye, irisMaterial, pupilMaterial, hairDetailMaterial);
  const eyeGeometry = new THREE.SphereGeometry(.011, 24, 16);
  const irisGeometry = new THREE.SphereGeometry(.0052, 20, 12);
  const pupilGeometry = new THREE.SphereGeometry(.0025, 16, 10);
  ownGeometries.push(eyeGeometry, irisGeometry, pupilGeometry);
  for (const suffix of ['L', 'R']) {
    const eye = byName.get(`eye.${suffix}`)!;
    const center = eye.head.clone().sub(rest.head);
    const sclera = new THREE.Mesh(eyeGeometry, skinEye); sclera.position.copy(center); props.add(sclera);
    const iris = new THREE.Mesh(irisGeometry, irisMaterial); iris.scale.z = .18; iris.position.copy(center).add(new THREE.Vector3(0, 0, .0102)); props.add(iris);
    const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial); pupil.scale.z = .15; pupil.position.copy(center).add(new THREE.Vector3(0, 0, .0111)); props.add(pupil);
  }

  if (id === 'cen') {
    const bunGeometry = new THREE.SphereGeometry(1, 32, 20);
    const p = bunGeometry.getAttribute('position');
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const theta = Math.atan2(z, x);
      const groove = 1 + .045 * Math.sin(theta * 13 + y * 8);
      p.setXYZ(i, x * .038 * groove, y * .032, z * .034 * groove);
    }
    bunGeometry.computeVertexNormals(); ownGeometries.push(bunGeometry);
    const bun = new THREE.Mesh(bunGeometry, hairDetailMaterial);
    bun.position.set(0, -.083, -.128); bun.castShadow = true; props.add(bun);
    const tie = new THREE.Mesh(new THREE.TorusGeometry(.026, .003, 8, 32), hairDetailMaterial);
    tie.rotation.y = Math.PI / 2; tie.position.copy(bun.position); tie.position.z += .014;
    props.add(tie); ownGeometries.push(tie.geometry);
  } else {
    // Short, individually modelled curls sit on the fitted CC0 scalp. One
    // instanced draw call gives a distinct soft silhouette without a wig shell.
    const curlGeometry = new THREE.TorusGeometry(.008, .0026, 5, 10);
    ownGeometries.push(curlGeometry);
    const curls = new THREE.InstancedMesh(curlGeometry, hairDetailMaterial, 170);
    const dummy = new THREE.Object3D();
    let seed = 39821;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < 170; i++) {
      const y = .15 + random() * .84;
      const az = i * 2.3999632297;
      const radius = Math.sqrt(1 - y * y);
      const x = Math.cos(az) * radius, z = Math.sin(az) * radius;
      dummy.position.set(x * .093, y * .100 + .003, z * .095 - .017);
      dummy.quaternion.setFromUnitVectors(forward, new THREE.Vector3(x, y * .7, z).normalize());
      dummy.rotateZ(random() * Math.PI * 2);
      dummy.scale.setScalar(.78 + random() * .55); dummy.updateMatrix();
      curls.setMatrixAt(i, dummy.matrix);
      curls.setColorAt(i, new THREE.Color().setHSL(.071, .15, .6 + random() * .2));
    }
    curls.instanceMatrix.needsUpdate = true; curls.castShadow = true; props.add(curls);
  }

  const maps = {
    pelvis: new RigidMap(), lowerSpine: new RigidMap(), middleSpine: new RigidMap(), upperSpine: new RigidMap(), neck: new RigidMap(), head: new RigidMap(),
    left: { clavicle: new RigidMap(), upperArm: new RigidMap(), elbow: new RigidMap(), forearm: new RigidMap(), wristTwist: new RigidMap(), hand: new RigidMap(), thigh: new RigidMap(), shin: new RigidMap(), foot: new RigidMap() },
    right: { clavicle: new RigidMap(), upperArm: new RigidMap(), elbow: new RigidMap(), forearm: new RigidMap(), wristTwist: new RigidMap(), hand: new RigidMap(), thigh: new RigidMap(), shin: new RigidMap(), foot: new RigidMap() },
  };
  const restPalm: Record<Side, { forward: THREE.Vector3; normal: THREE.Vector3; across: THREE.Vector3 }> = {} as Record<Side, { forward: THREE.Vector3; normal: THREE.Vector3; across: THREE.Vector3 }>;
  for (const side of ['left', 'right'] as const) {
    const suffix = side === 'left' ? 'L' : 'R';
    const handForward = rest[`${side}Hand`].clone().sub(rest[`${side}Wrist`]).normalize();
    const across = byName.get(`finger2-1.${suffix}`)!.head.clone().sub(byName.get(`finger5-1.${suffix}`)!.head);
    const normal = handForward.clone().cross(across).normalize().multiplyScalar(side === 'left' ? 1 : -1);
    restPalm[side] = { forward: handForward, normal, across: handForward.clone().cross(normal).normalize() };
  }
  const target: RestJoints = Object.fromEntries(Object.keys(rest).map(k => [k, new THREE.Vector3()])) as RestJoints;
  const chestForward = new THREE.Vector3(), rootForward = new THREE.Vector3(), gaze = new THREE.Vector3();
  const tmp0 = new THREE.Vector3(), tmp1 = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  const referenceNormal = new THREE.Vector3(), targetNormal = new THREE.Vector3(), restNormal = new THREE.Vector3();
  const yawQ = new THREE.Quaternion();
  let disposed = false;

  const apply = (state: BoneState, map: RigidMap) => {
    map.point(state.head, state.bone.position);
    state.bone.quaternion.copy(map.q);
  };

  const armNormal = (side: Side, posed: RestJoints, result: THREE.Vector3) => {
    tmp0.copy(posed[`${side}Elbow`]).sub(posed[`${side}Shoulder`]).normalize();
    tmp1.copy(posed[`${side}Wrist`]).sub(posed[`${side}Elbow`]).normalize();
    return result.crossVectors(tmp0, tmp1);
  };

  const fingers = (side: Side, pose: HandPose) => {
    const suffix = side === 'left' ? 'L' : 'R';
    const hand = maps[side].hand;
    const palm = restPalm[side];
    for (let digit = 1; digit <= 5; digit++) {
      let previousRestTail: THREE.Vector3 | undefined;
      let previousTargetTail: THREE.Vector3 | undefined;
      const cumulative = new THREE.Quaternion();
      const curl = clamp(pose.fingers[digit - 1], 0, 1);
      const axis = digit === 1
        ? byName.get(`finger1-1.${suffix}`)!.tail.clone().sub(byName.get(`finger1-1.${suffix}`)!.head).normalize().cross(palm.normal).normalize()
        : palm.across;
      const opening = digit === 1 ? 0 : (digit - 3.3) * clamp(pose.spread, 0, 1) * .045;
      cumulative.setFromAxisAngle(palm.normal, opening * (side === 'left' ? 1 : -1));
      for (let segment = 1; segment <= 3; segment++) {
        const state = byName.get(`finger${digit}-${segment}.${suffix}`)!;
        if (previousRestTail && previousTargetTail) {
          state.bone.position.copy(state.head).sub(previousRestTail).applyQuaternion(cumulative).applyQuaternion(hand.q).add(previousTargetTail);
        } else {
          hand.point(state.head, state.bone.position);
        }
        const max = digit === 1 ? [0, .52, .68, .56][segment] : [0, .86, 1.10, .62][segment];
        cumulative.multiply(new THREE.Quaternion().setFromAxisAngle(axis, curl * max));
        state.bone.quaternion.copy(hand.q).multiply(cumulative).normalize();
        previousRestTail = state.tail;
        previousTargetTail = state.tail.clone().sub(state.head).applyQuaternion(state.bone.quaternion).add(state.bone.position);
      }
    }
  };

  function update(pose: BodyPose) {
    if (disposed) return;
    for (const key of Object.keys(target) as JointName[]) target[key].fromArray(pose.joints[key]);
    chestForward.set(Math.sin(pose.chestYaw), 0, Math.cos(pose.chestYaw));
    rootForward.set(Math.sin(pose.rootYaw), 0, Math.cos(pose.rootYaw));
    gaze.set(Math.sin(pose.headYaw), 0, Math.cos(pose.headYaw));
    maps.pelvis.yaw(rest.pelvis, target.pelvis, pose.rootYaw);
    maps.lowerSpine.set(rest.pelvis, rest.spine, target.pelvis, target.spine, forward, rootForward);
    maps.middleSpine.set(rest.spine, rest.chest, target.spine, target.chest, forward, chestForward);
    maps.upperSpine.set(rest.chest, rest.neck, target.chest, target.neck, forward, chestForward);
    maps.neck.set(rest.neck, rest.head, target.neck, target.head, forward, gaze);
    maps.head.from.copy(rest.head); maps.head.to.copy(target.head); maps.head.q.copy(maps.neck.q);

    for (const side of ['left', 'right'] as const) {
      const suffix = side === 'left' ? 'L' : 'R';
      const m = maps[side];
      const clavicleHead = byName.get(`clavicle.${suffix}`)!.head;
      maps.upperSpine.point(clavicleHead, tmp2);
      m.clavicle.set(clavicleHead, rest[`${side}Shoulder`], tmp2, target[`${side}Shoulder`], forward, chestForward);
      armNormal(side, rest, restNormal).normalize();
      yawQ.setFromAxisAngle(up, pose.chestYaw);
      referenceNormal.copy(restNormal).applyQuaternion(yawQ);
      armNormal(side, target, targetNormal);
      const bend = targetNormal.length();
      if (bend > 1e-7) targetNormal.normalize(); else targetNormal.copy(referenceNormal);
      // A nearly straight elbow has no stable plane. Blend to a body-fixed plane
      // there, so crossing the singularity cannot flip a sleeve by 180 degrees.
      targetNormal.lerp(referenceNormal, 1 - THREE.MathUtils.smoothstep(bend, .025, .16)).normalize();
      m.upperArm.set(rest[`${side}Shoulder`], rest[`${side}Elbow`], target[`${side}Shoulder`], target[`${side}Elbow`], restNormal, targetNormal);
      m.elbow.set(rest[`${side}Elbow`], rest[`${side}Wrist`], target[`${side}Elbow`], target[`${side}Wrist`], restNormal, targetNormal);
      m.forearm.set(rest[`${side}Elbow`], rest[`${side}Wrist`], target[`${side}Elbow`], target[`${side}Wrist`], restPalm[side].normal, v3(pose.hands[side].normal));
      // Preserve the elbow's bend plane, then distribute palm pronation along
      // the source's two forearm twist bones. Rotating the entire forearm to
      // the hand would collapse a blended elbow when the palm turns 180°.
      m.wristTwist.from.copy(m.elbow.from); m.wristTwist.to.copy(m.elbow.to);
      const relativeTwist = m.elbow.q.clone().invert().multiply(m.forearm.q);
      const restAxis = rest[`${side}Wrist`].clone().sub(rest[`${side}Elbow`]).normalize();
      const rawTwist = 2 * Math.atan2(relativeTwist.x * restAxis.x + relativeTwist.y * restAxis.y + relativeTwist.z * restAxis.z, relativeTwist.w);
      // The authored score has no full forearm revolution. Its anatomically
      // bounded range crosses ±180°, so shortest-path half-slerp would flip.
      // A fixed branch per identity makes this direct pose query continuous
      // without remembering, accumulating or depending on earlier frames.
      const centre = id === 'cen' ? Math.PI / 2 : -Math.PI / 2;
      const twist = centre + Math.atan2(Math.sin(rawTwist - centre), Math.cos(rawTwist - centre));
      m.wristTwist.q.copy(m.elbow.q).multiply(new THREE.Quaternion().setFromAxisAngle(restAxis, twist * .5)).normalize();
      m.hand.set(rest[`${side}Wrist`], rest[`${side}Hand`], target[`${side}Wrist`], target[`${side}Hand`], restPalm[side].normal, v3(pose.hands[side].normal));
      m.thigh.set(rest[`${side}Hip`], rest[`${side}Knee`], target[`${side}Hip`], target[`${side}Knee`], forward, rootForward);
      m.shin.set(rest[`${side}Knee`], rest[`${side}Ankle`], target[`${side}Knee`], target[`${side}Ankle`], forward, rootForward);
      m.foot.set(rest[`${side}Ankle`], rest[`${side}Toe`], target[`${side}Ankle`], target[`${side}Toe`], up, up);
    }

    for (const state of states) {
      const n = state.source.name;
      let map = maps.head;
      if (n === 'root' || n.startsWith('pelvis.')) map = maps.pelvis;
      else if (n === 'spine05' || n === 'spine04') map = maps.lowerSpine;
      else if (n === 'spine03' || n === 'spine02' || n.startsWith('breast.')) map = maps.middleSpine;
      else if (n === 'spine01') map = maps.upperSpine;
      else if (n.startsWith('neck')) map = maps.neck;
      else if (n.endsWith('.L') || n.endsWith('.R')) {
        const side = n.endsWith('.L') ? 'left' : 'right';
        const m = maps[side];
        if (n.startsWith('clavicle') || n.startsWith('shoulder')) map = m.clavicle;
        else if (n.startsWith('upperarm')) map = m.upperArm;
        else if (n.startsWith('lowerarm01')) map = m.elbow;
        else if (n.startsWith('lowerarm02')) map = m.wristTwist;
        else if (n.startsWith('wrist') || n.startsWith('metacarpal') || n.startsWith('finger')) map = m.hand;
        else if (n.startsWith('upperleg')) map = m.thigh;
        else if (n.startsWith('lowerleg')) map = m.shin;
        else if (n.startsWith('foot') || n.startsWith('toe')) map = m.foot;
      }
      apply(state, map);
    }
    fingers('left', pose.hands.left); fingers('right', pose.hands.right);
    props.position.copy(target.head); props.quaternion.copy(maps.head.q);
    group.updateMatrixWorld(true);
    skeleton.update();
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    group.removeFromParent();
    skeleton.dispose();
    for (const mesh of meshes) mesh.removeFromParent();
    group.traverse(object => { if (object instanceof THREE.InstancedMesh) object.dispose(); });
    for (const geometry of ownGeometries) geometry.dispose();
    for (const material of ownMaterials) material.dispose();
    group.clear();
    // Shared geometry and textures belong to CharacterAssets, not this rig.
  }

  return { group, update, dispose };
}
