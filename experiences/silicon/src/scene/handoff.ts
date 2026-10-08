import * as THREE from 'three';
import { clamp, mix, smooth } from './shared';

export type HandoffModelName = 'wafer' | 'build' | 'transistor' | 'interconnect' | 'package';
export type HandoffModels = Record<HandoffModelName, THREE.Object3D>;

export interface HandoffDefinition {
  readonly from: HandoffModelName;
  readonly to: HandoffModelName;
  readonly start: number;
  readonly end: number;
  /** Normal, range and trace coordinates are in the shared exhibition rig. */
  readonly normal: readonly [number, number, number];
  readonly range: readonly [number, number];
  readonly colour: number;
  readonly trace: 'exposure' | 'layer' | 'contact' | 'routing';
}

/** Registered context sections beneath the persistent physical feature carriers. */
export const HANDOFFS: readonly HandoffDefinition[] = [
  { from: 'wafer', to: 'build', start: 1.64, end: 2, normal: [1, 0, 0], range: [-4.45, 4.45], colour: 0xd4c7e8, trace: 'exposure' },
  { from: 'build', to: 'transistor', start: 2.64, end: 3, normal: [0, 1, 0], range: [-2.05, 2.85], colour: 0xd3dcd9, trace: 'layer' },
  { from: 'transistor', to: 'interconnect', start: 3.64, end: 4, normal: [0, -1, 0], range: [-3.75, 2.05], colour: 0xddc7a8, trace: 'contact' },
  { from: 'interconnect', to: 'package', start: 4.64, end: 5, normal: [0, 0, 1], range: [-4.65, 3.45], colour: 0xddc09a, trace: 'routing' },
];

/**
 * Optional companion for model.update(). It begins construction during the
 * preceding cut and reaches 1 at the end of that chapter, with no reset where
 * the chapter title changes. Use for BUILD / TRANSISTOR / INTERCONNECT.
 */
export function continuousSceneProgress(globalProgress: number, chapter: number) {
  const phase = clamp((globalProgress - (chapter - .36)) / 1.36);
  // Wiring is already taking shape while contacts enter its upper vias.
  return chapter === 4 ? .20 + .80 * phase : phase;
}

type MaterialState = {
  material: THREE.Material;
  planes: THREE.Plane[] | null;
  clipShadows: boolean;
  clipIntersection: boolean;
  shader?: { vertex: string; fragment: string; clipping: boolean };
};

type ModelState = { plane: THREE.Plane; materials: MaterialState[] };

/**
 * Add native Three clipping chunks to the tiny custom heat shaders. Standard
 * materials already contain them. Existing uniforms and onBeforeCompile /
 * customProgramCacheKey callbacks are left completely intact.
 */
function prepareShader(material: THREE.ShaderMaterial): MaterialState['shader'] {
  const previous = { vertex: material.vertexShader, fragment: material.fragmentShader, clipping: material.clipping };
  const main = /void\s+main\s*\(\s*\)\s*\{/;
  if (!material.vertexShader.includes('clipping_planes_pars_vertex')) {
    material.vertexShader = '#include <clipping_planes_pars_vertex>\n' + material.vertexShader.replace(main, match => `${match}
      #if NUM_CLIPPING_PLANES > 0
        vec4 handoffLocalPosition = vec4(position, 1.0);
        #ifdef USE_INSTANCING
          handoffLocalPosition = instanceMatrix * handoffLocalPosition;
        #endif
        vClipPosition = -(modelViewMatrix * handoffLocalPosition).xyz;
      #endif
    `);
  }
  if (!material.fragmentShader.includes('clipping_planes_pars_fragment')) {
    material.fragmentShader = '#include <clipping_planes_pars_fragment>\n' + material.fragmentShader.replace(main, match => `${match}
      #include <clipping_planes_fragment>
    `);
  }
  material.clipping = true;
  return previous;
}

export interface StructuralHandoff {
  /** Attached to the rig; carriers include a short registered hold before/after each cut. */
  readonly group: THREE.Group;
  /** Call after model transforms/updates and before renderer.render(). No clock is owned here. */
  update(globalProgress: number): void;
  /** REQUIRED before native model.update(): restore borrowed features and clear cuts. */
  clear(): void;
  /** Restore original materials/geometry visibility and dispose owned carrier resources. */
  dispose(): void;
}

/** A real feature in an existing model, optionally one member of an instance field. */
type Feature = {
  object: THREE.Object3D;
  mesh?: THREE.Mesh;
  instance?: { mesh: THREE.InstancedMesh; index: number; dynamic: boolean };
  dimensions: THREE.Vector3;
  centre: THREE.Vector3;
  dynamicVisibility: boolean;
};
type FeaturePose = { position: THREE.Vector3; rotation: THREE.Quaternion; size: THREE.Vector3 };
type Suppression = { feature: Feature; visible?: boolean; matrix?: THREE.Matrix4 };
type RouteLanding = { object: THREE.Mesh; points: THREE.Vector3[]; width: number };

function newPose(): FeaturePose {
  return { position: new THREE.Vector3(), rotation: new THREE.Quaternion(), size: new THREE.Vector3(1, 1, 1) };
}
function materialOf(mesh: THREE.Mesh) {
  return (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial;
}
function meshFeature(mesh: THREE.Mesh, dynamicVisibility = false, index?: number, dynamicMatrix = false): Feature {
  mesh.geometry.computeBoundingBox();
  const box = mesh.geometry.boundingBox!;
  return {
    object: mesh, mesh, dimensions: box.getSize(new THREE.Vector3()), centre: box.getCenter(new THREE.Vector3()), dynamicVisibility,
    instance: index === undefined ? undefined : { mesh: mesh as THREE.InstancedMesh, index, dynamic: dynamicMatrix },
  };
}
function isSized(mesh: THREE.Object3D, width: number, height: number, depth: number): mesh is THREE.Mesh {
  if (!(mesh instanceof THREE.Mesh) || mesh instanceof THREE.InstancedMesh) return false;
  const p = (mesh.geometry as THREE.BoxGeometry).parameters;
  return !!p && Math.abs(p.width - width) < .002 && Math.abs(p.height - height) < .002 && Math.abs(p.depth - depth) < .002;
}

/**
 * The clipped model shells supply context. Unclipped physical features supply
 * continuity: the selected die becomes a deposited film, three retained ribs
 * become the three nanosheets, terminal contacts lengthen into real upper vias,
 * and four existing top conductors fan into four actual interposer buses.
 *
 * Each feature is the visible author of its own transfer. Its matching source /
 * target child is temporarily suppressed, never its model group. The carrier
 * matches native geometry before and after its journey, including current
 * parent and instance matrices. There are no opacity crossfades or loose lines.
 */
export function createStructuralHandoff(frame: THREE.Object3D, models: HandoffModels): StructuralHandoff {
  const states = new Map<HandoffModelName, ModelState>();
  const owners = new Map<THREE.Material, HandoffModelName>();
  for (const name of Object.keys(models) as HandoffModelName[]) {
    const state: ModelState = { plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 100000), materials: [] };
    const seen = new Set<THREE.Material>();
    models[name].traverse(object => {
      const renderable = object as THREE.Mesh;
      if (!renderable.material) return;
      for (const material of Array.isArray(renderable.material) ? renderable.material : [renderable.material]) {
        if (seen.has(material)) continue;
        seen.add(material);
        const owner = owners.get(material);
        if (owner && owner !== name) throw new Error(`SILICON: shared handoff material in ${owner} / ${name}.`);
        owners.set(material, name);
        const previous: MaterialState = { material, planes: material.clippingPlanes, clipShadows: material.clipShadows, clipIntersection: material.clipIntersection };
        if (material instanceof THREE.ShaderMaterial) previous.shader = prepareShader(material);
        material.clippingPlanes = [...(material.clippingPlanes ?? []), state.plane];
        material.clipIntersection = false; material.clipShadows = true; material.needsUpdate = true;
        state.materials.push(previous);
      }
    });
    states.set(name, state);
  }

  const group = new THREE.Group(); group.name = 'persistent-manufacturing-carriers'; group.visible = false; frame.add(group);
  const ownGeometries = new Set<THREE.BufferGeometry>();
  const ownMaterials = new Set<THREE.Material>();
  const ownTextures = new Set<THREE.Texture>();
  const carriers: THREE.Object3D[] = [];
  const suppressions: Suppression[] = [];
  const inverseFrame = new THREE.Matrix4();
  const localMatrix = new THREE.Matrix4(), instanceMatrix = new THREE.Matrix4(), hiddenMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
  const decomposedScale = new THREE.Vector3();
  const sourcePose = newPose(), destinationPose = newPose(), blendedPose = newPose();
  const localPlane = new THREE.Plane();
  const normal = new THREE.Vector3();
  let disposed = false;

  function cloneMaterial(original: THREE.Material) {
    const copy = original.clone();
    copy.onBeforeCompile = original.onBeforeCompile;
    copy.customProgramCacheKey = original.customProgramCacheKey;
    copy.clippingPlanes = null; copy.clipShadows = false;
    ownMaterials.add(copy);
    return copy;
  }
  function carrierFor(feature: Feature) {
    const geometry = feature.mesh!.geometry.clone();
    geometry.translate(-feature.centre.x, -feature.centre.y, -feature.centre.z);
    geometry.scale(1 / feature.dimensions.x, 1 / feature.dimensions.y, 1 / feature.dimensions.z);
    ownGeometries.add(geometry);
    const mesh = new THREE.Mesh(geometry, cloneMaterial(materialOf(feature.mesh!)));
    mesh.name = 'continuous-physical-feature'; mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.frustumCulled = false; mesh.visible = false; group.add(mesh); carriers.push(mesh);
    return mesh;
  }
  function readPose(feature: Feature, pose: FeaturePose) {
    localMatrix.copy(inverseFrame).multiply(feature.object.matrixWorld);
    if (feature.instance) {
      feature.instance.mesh.getMatrixAt(feature.instance.index, instanceMatrix);
      localMatrix.multiply(instanceMatrix);
    }
    localMatrix.decompose(pose.position, pose.rotation, decomposedScale);
    pose.position.copy(feature.centre).applyMatrix4(localMatrix);
    pose.size.copy(feature.dimensions).multiply(decomposedScale).set(Math.abs(pose.size.x), Math.abs(pose.size.y), Math.abs(pose.size.z));
  }
  function suppress(feature: Feature) {
    if (feature.instance) {
      const record: Suppression = { feature, matrix: new THREE.Matrix4() };
      feature.instance.mesh.getMatrixAt(feature.instance.index, record.matrix!);
      feature.instance.mesh.setMatrixAt(feature.instance.index, hiddenMatrix);
      feature.instance.mesh.instanceMatrix.needsUpdate = true;
      suppressions.push(record);
    } else {
      suppressions.push({ feature, visible: feature.object.visible }); feature.object.visible = false;
    }
  }
  function restorePrevious(includeDynamic: boolean) {
    for (const entry of suppressions) {
      const instance = entry.feature.instance;
      if (instance) {
        // Animated via matrices have already been regenerated by model.update.
        // Static top-routing matrices need explicit restoration before reading.
        if (includeDynamic || !instance.dynamic) {
          instance.mesh.setMatrixAt(instance.index, entry.matrix!); instance.mesh.instanceMatrix.needsUpdate = true;
        }
      } else if (includeDynamic || !entry.feature.dynamicVisibility) {
        entry.feature.object.visible = entry.visible!;
      }
    }
    suppressions.length = 0;
  }
  function blendPose(a: FeaturePose, b: FeaturePose, t: number) {
    blendedPose.position.lerpVectors(a.position, b.position, t);
    blendedPose.rotation.slerpQuaternions(a.rotation, b.rotation, t);
    blendedPose.size.lerpVectors(a.size, b.size, t);
    return blendedPose;
  }
  function place(mesh: THREE.Mesh, pose: FeaturePose) {
    mesh.position.copy(pose.position); mesh.quaternion.copy(pose.rotation); mesh.scale.copy(pose.size);
  }
  function matchFinish(mesh: THREE.Mesh, from: Feature, to: Feature, t: number) {
    const output = materialOf(mesh), a = materialOf(from.mesh!), b = materialOf(to.mesh!);
    if (a.color && b.color && output.color) output.color.copy(a.color).lerp(b.color, t);
    output.roughness = mix(a.roughness ?? .3, b.roughness ?? .3, t);
    output.metalness = mix(a.metalness ?? .8, b.metalness ?? .8, t);
    if (output.emissive && b.emissive) {
      output.emissive.copy(b.emissive); output.emissiveIntensity = (b.emissiveIntensity ?? 0) * t;
    }
  }

  const selected = models.wafer.userData.handoffSelectedDie as THREE.Group | undefined;
  const selectedSurface = selected?.userData.surface as THREE.Mesh | undefined;
  const footprint = selected?.userData.footprint as { width: number; depth: number } | undefined;
  const filmGroup = models.build.getObjectByName('Silicon patterned film 0');
  const blanket = filmGroup?.children.find(object => isSized(object, 5.03, .134, 3.53)) as THREE.Mesh | undefined;
  const filmDestination = blanket ? meshFeature(blanket, true) : undefined;
  const dieSource: Feature | undefined = selected && selectedSurface && footprint ? {
    object: selected, mesh: selectedSurface, centre: new THREE.Vector3(), dimensions: new THREE.Vector3(footprint.width, .002, footprint.depth), dynamicVisibility: false,
  } : undefined;
  const filmCarrier = filmDestination ? carrierFor(filmDestination) : undefined;
  let patternedSurface: THREE.Mesh | undefined;
  let patternedOutline: THREE.Line | undefined;
  if (selectedSurface && filmCarrier) {
    // Preserve the exact selected floorplan at inspection resolution. The
    // wafer factory redraws the same atlas cell, including its scribe margin.
    patternedSurface = selectedSurface.clone(); patternedSurface.material = cloneMaterial(materialOf(selectedSurface));
    const makeLargeSurface = selected?.userData.makeLargeSurface as (() => { color: THREE.Texture; detail: THREE.Texture }) | undefined;
    if (makeLargeSurface && footprint) {
      const maps = makeLargeSurface(); ownTextures.add(maps.color); ownTextures.add(maps.detail);
      const geometry = new THREE.PlaneGeometry(footprint.width, footprint.depth); ownGeometries.add(geometry);
      patternedSurface.geometry = geometry;
      const material = materialOf(patternedSurface);
      material.map = maps.color; material.roughnessMap = maps.detail; material.bumpMap = maps.detail;
      material.needsUpdate = true;
    }
    patternedSurface.name = 'selected-die-pattern-carried-into-film'; patternedSurface.visible = false;
    patternedSurface.frustumCulled = false; group.add(patternedSurface); carriers.push(patternedSurface);
    const sourceOutline = selected?.userData.outline as THREE.Line | undefined;
    if (sourceOutline) {
      patternedOutline = sourceOutline.clone();
      patternedOutline.material = cloneMaterial(Array.isArray(sourceOutline.material) ? sourceOutline.material[0] : sourceOutline.material);
      patternedOutline.frustumCulled = false; patternedOutline.visible = false;
      group.add(patternedOutline); carriers.push(patternedOutline);
    }
  }

  const precursors: THREE.Mesh[] = [], channels: THREE.Mesh[] = [], caps: THREE.Mesh[] = [];
  models.build.traverse(object => { if (object.name === 'Retained channel precursor' && object instanceof THREE.Mesh) precursors.push(object); });
  models.transistor.traverse(object => {
    if (isSized(object, 3.52, .11, 1.43)) channels.push(object);
    if (isSized(object, .97, .073, 1.85)) caps.push(object);
  });
  precursors.sort((a, b) => (a.parent?.name ?? '').localeCompare(b.parent?.name ?? ''));
  channels.sort((a, b) => a.position.y - b.position.y);
  caps.sort((a, b) => (a.parent?.position.x ?? 0) - (b.parent?.position.x ?? 0));
  const sheetPairs = precursors.slice(0, 3).map((source, index) => {
    if (!channels[index]) return undefined;
    const from = meshFeature(source, true), to = meshFeature(channels[index]);
    return { from, to, mesh: carrierFor(to) };
  }).filter((pair): pair is NonNullable<typeof pair> => !!pair);

  const viaFields = models.interconnect.children.filter((object): object is THREE.InstancedMesh => {
    if (!(object instanceof THREE.InstancedMesh) || !(object.geometry instanceof THREE.CylinderGeometry)) return false;
    const p = object.geometry.parameters; return p.radiusTop === 1 && p.radiusBottom === 1 && p.height === 1;
  });
  const upperVia = viaFields[4];
  const contactPairs = upperVia ? caps.slice(0, 2).map((source, index) => {
    const from = meshFeature(source), to = meshFeature(upperVia, false, 0, true);
    const mesh = carrierFor(to);
    // A rounded rectangular terminal continuously becomes the circular section
    // of a via; the same metal feature also narrows and elongates vertically.
    const shape = new THREE.CylinderGeometry(.5, .5, 1, 32);
    const original = new Float32Array(shape.attributes.position.array);
    ownGeometries.add(shape); mesh.geometry = shape;
    return { from, to, mesh, shape, original, side: index === 0 ? -1 : 1 };
  }) : [];

  const topLevel = models.interconnect.getObjectByName('Metal level 6 · Z routing');
  const topRails = topLevel?.children.find(object => object instanceof THREE.InstancedMesh) as THREE.InstancedMesh | undefined;
  const landings = (models.package.userData.handoffRoutes ?? []) as RouteLanding[];
  const routeGeometry = new THREE.BoxGeometry(1, 1, 1); ownGeometries.add(routeGeometry);
  const routePairs = topRails ? landings.slice(0, 4).map((landing, index) => {
    const from = meshFeature(topRails, false, index), to = meshFeature(landing.object);
    const material = cloneMaterial(materialOf(landing.object));
    const segments = Array.from({ length: landing.points.length - 1 }, () => {
      const segment = new THREE.Mesh(routeGeometry, material); segment.castShadow = true; segment.receiveShadow = true;
      segment.name = `top-metal-${index + 1}-to-interposer-bus`; segment.visible = false; segment.frustumCulled = false;
      group.add(segment); carriers.push(segment); return segment;
    });
    return { from, to, landing, segments, points: landing.points.map(() => new THREE.Vector3()) };
  }) : [];
  group.userData.carrierCounts = { film: filmCarrier && dieSource ? 1 : 0, retainedSheets: sheetPairs.length, contacts: contactPairs.length, routedBuses: routePairs.length };
  const routeSource = new THREE.Vector3(), routeTarget = new THREE.Vector3(), routeDirection = new THREE.Vector3();
  const sourceTransform = new THREE.Matrix4(), targetTransform = new THREE.Matrix4();
  const patternRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
  const surfaceOffset = new THREE.Vector3();

  function activePhase(definition: HandoffDefinition, progress: number) {
    if (progress < definition.start - .10 || progress > definition.end + .10) return null;
    return smooth(definition.start, definition.end, progress);
  }
  function pairPose(from: Feature, to: Feature, t: number) {
    // Never inspect a not-yet-updated incoming model during the prelude. After
    // the cut, only the destination's current matrix is authoritative.
    if (t <= 0) { readPose(from, sourcePose); return sourcePose; }
    if (t >= 1) { readPose(to, destinationPose); return destinationPose; }
    readPose(from, sourcePose); readPose(to, destinationPose);
    return blendPose(sourcePose, destinationPose, t);
  }
  function updateFilm(progress: number) {
    // The enlarged pattern stays on the first film through a visible landing
    // hold. Later native layers deposit above it; the first etch finally
    // removes the unprotected face. Identity is never hidden under its own film.
    const t = progress < HANDOFFS[0].start - .10 || progress > 2.47
      ? null : smooth(HANDOFFS[0].start, HANDOFFS[0].end, progress);
    if (t === null || !dieSource || !filmDestination || !filmCarrier || !patternedSurface || !footprint) return;
    const pose = pairPose(dieSource, filmDestination, t);
    const nativeFilmVisible = filmDestination.object.visible;
    filmCarrier.visible = t < 1 || nativeFilmVisible;
    if (!filmCarrier.visible) return;
    place(filmCarrier, pose); matchFinish(filmCarrier, dieSource, filmDestination, t);
    patternedSurface.visible = true;
    surfaceOffset.set(0, pose.size.y / 2 + .0022, 0).applyQuaternion(pose.rotation);
    patternedSurface.position.copy(pose.position).add(surfaceOffset);
    patternedSurface.quaternion.copy(pose.rotation).multiply(patternRotation);
    patternedSurface.scale.set(pose.size.x / footprint.width, pose.size.z / footprint.depth, 1);
    if (patternedOutline) {
      patternedOutline.visible = true;
      patternedOutline.position.copy(pose.position).add(surfaceOffset);
      patternedOutline.quaternion.copy(pose.rotation);
      patternedOutline.scale.set(pose.size.x / footprint.width, 1, pose.size.z / footprint.depth);
    }
    if (t < 1) suppress(dieSource);
    if (t > 0) suppress(filmDestination);
    group.visible = true;
  }
  function updateSheets(progress: number) {
    const t = activePhase(HANDOFFS[1], progress);
    if (t === null) return;
    for (const pair of sheetPairs) {
      place(pair.mesh, pairPose(pair.from, pair.to, t)); matchFinish(pair.mesh, pair.from, pair.to, t);
      pair.mesh.visible = true;
      if (t < 1) suppress(pair.from);
      if (t > 0) suppress(pair.to);
    }
    group.visible ||= sheetPairs.length > 0;
  }
  function updateContacts(progress: number) {
    const t = activePhase(HANDOFFS[2], progress);
    if (t === null || !upperVia) return;
    for (const pair of contactPairs) {
      if (t > 0) {
        // Choose an actual upper-level via nearest the corresponding terminal,
        // using only fixed X/Z geometry so the choice is navigation independent.
        let closest = 0, distance = Infinity;
        for (let i = 0; i < upperVia.count; i++) {
          upperVia.getMatrixAt(i, instanceMatrix);
          const score = (instanceMatrix.elements[12] - pair.side * 2.05) ** 2 + instanceMatrix.elements[14] ** 2;
          if (score < distance) { distance = score; closest = i; }
        }
        pair.to.instance!.index = closest;
      }
      place(pair.mesh, pairPose(pair.from, pair.to, t)); matchFinish(pair.mesh, pair.from, pair.to, t);
      const attributes = pair.shape.attributes.position as THREE.BufferAttribute;
      const exponent = 2 / mix(14, 2, t);
      for (let vertex = 0; vertex < attributes.count; vertex++) {
        const x = pair.original[vertex * 3], z = pair.original[vertex * 3 + 2];
        const radius = Math.hypot(x, z);
        if (radius > .001) attributes.setXYZ(vertex,
          .5 * Math.sign(x) * Math.pow(Math.abs(x / radius), exponent),
          pair.original[vertex * 3 + 1],
          .5 * Math.sign(z) * Math.pow(Math.abs(z / radius), exponent));
      }
      attributes.needsUpdate = true; pair.shape.computeVertexNormals();
      pair.mesh.visible = true;
      if (t < 1) suppress(pair.from);
      if (t > 0) suppress(pair.to);
    }
    group.visible ||= contactPairs.length > 0;
  }
  function updateRoutes(progress: number) {
    const t = activePhase(HANDOFFS[3], progress);
    if (t === null) return;
    for (const pair of routePairs) {
      if (t < 1) {
        sourceTransform.copy(inverseFrame).multiply(pair.from.object.matrixWorld);
        pair.from.instance!.mesh.getMatrixAt(pair.from.instance!.index, instanceMatrix); sourceTransform.multiply(instanceMatrix);
      }
      if (t > 0) targetTransform.copy(inverseFrame).multiply(pair.landing.object.matrixWorld);
      // Source rail endpoints and target polyline vertices are real conductive
      // geometry. Subdividing the straight source preserves vertex identity as
      // its four broad routes become four individually escaped fan-out buses.
      const vertices = pair.points.length;
      for (let i = 0; i < vertices; i++) {
        if (t < 1) routeSource.set(0, 0, mix(-pair.from.dimensions.z / 2, pair.from.dimensions.z / 2, i / (vertices - 1))).applyMatrix4(sourceTransform);
        if (t > 0) routeTarget.copy(pair.landing.points[i]).applyMatrix4(targetTransform);
        if (t <= 0) pair.points[i].copy(routeSource);
        else if (t >= 1) pair.points[i].copy(routeTarget);
        else pair.points[i].lerpVectors(routeSource, routeTarget, t);
      }
      const sourceWidth = t < 1 ? pair.from.dimensions.x * Math.hypot(sourceTransform.elements[0], sourceTransform.elements[1], sourceTransform.elements[2]) : 0;
      const sourceHeight = t < 1 ? pair.from.dimensions.y * Math.hypot(sourceTransform.elements[4], sourceTransform.elements[5], sourceTransform.elements[6]) : 0;
      const targetWidth = t > 0 ? pair.landing.width * Math.hypot(targetTransform.elements[0], targetTransform.elements[1], targetTransform.elements[2]) : 0;
      const width = mix(sourceWidth, targetWidth, t);
      const thickness = mix(sourceHeight, .0006, t);
      pair.segments.forEach((segment, index) => {
        const a = pair.points[index], b = pair.points[index + 1]; routeDirection.subVectors(b, a);
        segment.position.copy(a).add(b).multiplyScalar(.5);
        segment.rotation.set(0, -Math.atan2(routeDirection.z, routeDirection.x), 0);
        segment.scale.set(Math.max(.0001, routeDirection.length() + .001), thickness, width);
        matchFinish(segment, pair.from, pair.to, t); segment.visible = true;
      });
      if (t < 1) suppress(pair.from);
      if (t > 0) suppress(pair.to);
    }
    group.visible ||= routePairs.length > 0;
  }

  function resetPlanes() {
    for (const state of states.values()) { state.plane.normal.set(0, 1, 0); state.plane.constant = 100000; }
  }
  function clear() {
    restorePrevious(true); resetPlanes(); group.visible = false; carriers.forEach(carrier => { carrier.visible = false; });
  }
  function update(globalProgress: number) {
    if (disposed) return;
    // stage.clear() runs before native controllers; this normally has nothing
    // left to restore. The static-only fallback also protects older callers.
    restorePrevious(false); resetPlanes(); group.visible = false;
    carriers.forEach(carrier => { carrier.visible = false; });
    // Native controllers have just updated their dynamic features. Resolve all
    // actual child/instance transforms before capturing a transfer endpoint.
    frame.updateWorldMatrix(true, true); inverseFrame.copy(frame.matrixWorld).invert();
    const definition = HANDOFFS.find(candidate => globalProgress >= candidate.start && globalProgress < candidate.end);
    if (definition) {
      const t = smooth(definition.start, definition.end, globalProgress);
      normal.set(...definition.normal);
      localPlane.set(normal, -mix(definition.range[0], definition.range[1], t));
      states.get(definition.from)!.plane.copy(localPlane).applyMatrix4(frame.matrixWorld);
      states.get(definition.to)!.plane.copy(states.get(definition.from)!.plane).negate();
    }
    updateFilm(globalProgress); updateSheets(globalProgress); updateContacts(globalProgress); updateRoutes(globalProgress);
  }
  function dispose() {
    if (disposed) return;
    clear(); disposed = true;
    for (const state of states.values()) for (const previous of state.materials) {
      const m = previous.material;
      m.clippingPlanes = previous.planes; m.clipShadows = previous.clipShadows; m.clipIntersection = previous.clipIntersection;
      if (previous.shader && m instanceof THREE.ShaderMaterial) {
        m.vertexShader = previous.shader.vertex; m.fragmentShader = previous.shader.fragment; m.clipping = previous.shader.clipping;
      }
      m.needsUpdate = true;
    }
    group.removeFromParent(); ownGeometries.forEach(geometry => geometry.dispose()); ownMaterials.forEach(material => material.dispose()); ownTextures.forEach(texture => texture.dispose());
  }
  return { group, update, clear, dispose };
}
