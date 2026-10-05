import * as THREE from 'three';
import { mergeGeometries, toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';

/** Bake static local details by surface material, retaining each assembly's transform.
 * Instanced fasteners and the few independently moving hands stay separate. */
export function batchAssembly(group: THREE.Group, excluded: ReadonlySet<THREE.Object3D> = new Set()): void {
  const byMaterial = new Map<THREE.Material, { geometries: THREE.BufferGeometry[]; cast: boolean; receive: boolean }>();
  const originals: THREE.Mesh[] = [];
  group.updateWorldMatrix(true, true);
  const inverse = group.matrixWorld.clone().invert();
  const transform = new THREE.Matrix4();
  group.traverse(object => {
    if (!(object instanceof THREE.Mesh) || object instanceof THREE.InstancedMesh || excluded.has(object)) return;
    originals.push(object);
    let geometry: THREE.BufferGeometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
    if (object.geometry.type === 'ExtrudeGeometry') {
      // Cap triangulation can span most of a bridge or plate. Its normals must
      // stay exactly planar; averaging a rim normal into those vertices creates
      // enormous false triangular reflection gradients over the flat face.
      const capNormals = (geometry.getAttribute('normal').array as Float32Array).slice();
      const capRanges = geometry.groups.filter(range => range.materialIndex === 0);
      const creased = toCreasedNormals(geometry, .62);
      if (creased !== geometry) geometry.dispose();
      geometry = creased;
      const normals = geometry.getAttribute('normal') as THREE.BufferAttribute;
      for (const range of capRanges) {
        const start = range.start * 3, end = (range.start + range.count) * 3;
        (normals.array as Float32Array).set(capNormals.subarray(start, end), start);
      }
    }
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const ranges = Array.isArray(object.material) && geometry.groups.length
      ? geometry.groups
      : [{ start: 0, count: geometry.getAttribute('position').count, materialIndex: 0 }];
    transform.copy(inverse).multiply(object.matrixWorld);
    for (const range of ranges) {
      const material = materials[range.materialIndex ?? 0];
      if (!material || range.count === 0) continue;
      const part = new THREE.BufferGeometry();
      for (const name of ['position', 'normal', 'uv']) {
        const source = geometry.getAttribute(name) as THREE.BufferAttribute | undefined;
        if (!source) {
          if (name === 'uv') part.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(range.count * 2), 2));
          continue;
        }
        const start = range.start * source.itemSize;
        const end = (range.start + range.count) * source.itemSize;
        const values = (source.array as Float32Array).slice(start, end);
        part.setAttribute(name, new THREE.BufferAttribute(values, source.itemSize, source.normalized));
      }
      part.applyMatrix4(transform);
      let entry = byMaterial.get(material);
      if (!entry) {
        entry = { geometries: [], cast: false, receive: false };
        byMaterial.set(material, entry);
      }
      entry.geometries.push(part);
      entry.cast ||= object.castShadow;
      entry.receive ||= object.receiveShadow;
    }
    geometry.dispose();
  });
  for (const original of originals) original.removeFromParent();
  for (const [material, entry] of byMaterial) {
    const geometry = mergeGeometries(entry.geometries, false);
    if (!geometry) continue;
    geometry.computeBoundingSphere();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = entry.cast;
    mesh.receiveShadow = entry.receive;
    mesh.name = 'Batched machined surfaces';
    group.add(mesh);
    entry.geometries.forEach(part => part.dispose());
  }
}
