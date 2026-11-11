// Build context shared by every assembly: the material library and the register of movable parts.
import * as THREE from 'three';
import { aim, screw, V } from '../geo.js';

export function createContext(M) {
  const parts = [];
  const screwCache = new Map();

  const ctx = {
    M,
    parts,
    /** Things that move every frame (wings, cranks, joints). Assemblies add their own update here. */
    updates: [],

    /**
     * Register a node as a part that travels during disassembly.
     * `steps` is its track in the parent's frame; see evalTrack in kinematics.js.
     */
    part(node, steps = [], { guide = false } = {}) {
      parts.push({ node, steps, rest: node.position.clone(), restRot: node.rotation.clone(), guide, spin: steps.some((s) => s.r) });
      return node;
    },

    /** Merge a kit into one part, attach it and register its track. */
    make(parent, kit, comp, steps, options = {}) {
      const node = kit.build(comp, options);
      if (options.at) node.position.copy(options.at);
      parent.add(node);
      if (steps) ctx.part(node, steps, options);
      return node;
    },

    /**
     * A screw that backs out along its own axis before the panel it holds moves.
     * It turns as it rises; the turn is a child of the travel so the axis stays true.
     */
    fastener(parent, comp, point, normal, { a = 0, b = 0.07, lift = 0.26, size = 0.03, material = M.steel, turns = 3 } = {}) {
      const key = size.toFixed(4);
      if (!screwCache.has(key)) screwCache.set(key, screw(size, size * 0.72, size * 0.46, size * 1.6));
      const travel = new THREE.Group();
      travel.applyMatrix4(aim(point, normal));
      const spin = new THREE.Group();
      const mesh = new THREE.Mesh(screwCache.get(key), material);
      mesh.castShadow = false; mesh.receiveShadow = true;
      mesh.userData.comp = comp;
      spin.add(mesh);
      travel.add(spin);
      parent.add(travel);
      const n = V().copy(normal).normalize();
      ctx.part(travel, [{ a, b, v: [n.x * lift, n.y * lift, n.z * lift], e: 'out' }]);
      ctx.part(spin, [{ a, b, r: [0, Math.PI * 2 * turns, 0], e: 'out' }]);
      return travel;
    },
  };
  return ctx;
}

/** A group mirrored across the body's centre plane. Build the right side inside it to get the left. */
export function mirrored() {
  const group = new THREE.Group();
  group.scale.z = -1;
  return group;
}
