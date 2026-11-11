// Six legs hung from the carrier under the thorax, held in the loose basket a dragonfly flies with.
// Each is a chain: coxa -> femur -> tibia -> tarsus, pinned at every joint.
import * as THREE from 'three';
import { Kit, rod, cyl, ball, sleeve, block, tube, at, V } from '../geo.js';
import { smooth } from '../kinematics.js';
import { CARRIER_Y } from './thorax.js';
import { mirrored } from './context.js';

// x on the carrier, heading in the horizontal plane (towards +x from straight out), lengths, resting angles.
const LEGS = [
  { x: 0.84, heading: 0.72, femur: 0.8, tibia: 0.86, tarsus: 0.42, pose: [-0.62, -2.62, -1.75] },
  { x: 0.48, heading: 0.12, femur: 0.95, tibia: 1.0, tarsus: 0.47, pose: [-0.7, -2.7, -1.85] },
  { x: 0.12, heading: -0.5, femur: 1.14, tibia: 1.24, tarsus: 0.52, pose: [-0.76, -2.78, -1.95] },
];

export function buildLegs(ctx, carrier) {
  const { M } = ctx;
  const joints = [];
  const left = mirrored();
  const right = new THREE.Group();
  carrier.add(right, left);

  for (const side of [right, left]) {
    LEGS.forEach((spec, index) => {
      const root = new THREE.Group();
      root.position.set(spec.x, CARRIER_Y - 0.03, 0.54);
      // Local +X points along the leg's heading.
      root.rotation.y = -(Math.PI / 2 - spec.heading);
      side.add(root);
      ctx.part(root, [{ a: 0.64, b: 0.86, v: [Math.sin(spec.heading) * 0.6, -0.1, 1.05] }]);

      // Coxa: the socket bolted to the carrier.
      let kit = new Kit();
      kit.add(cyl(0.085, 0.06, 'y', 20), M.gunmetal, at(0, 0.02, 0));
      kit.add(sleeve(0.095, 0.07, 0.02, 20, 0.004).rotateZ(Math.PI / 2), M.polished, at(0, 0.0, 0));
      kit.add(ball(0.066, 18), M.steel, at(0, -0.02, 0));
      root.add(kit.build('leg'));

      // Femur: a tapered strut with its actuator rod alongside.
      const femur = new THREE.Group();
      femur.position.set(0, -0.02, 0);
      root.add(femur);
      ctx.part(femur, [{ a: 0.72, b: 0.94, v: [0.2, -0.06, 0] }]);
      kit = new Kit();
      const F = spec.femur;
      kit.add(rod(V(0.03, 0, 0), V(F - 0.04, 0, 0), 0.05, 14, 0.034), M.gunmetal);
      kit.add(sleeve(0.056, 0.047, 0.05, 14).translate(0.13, 0, 0), M.polished);
      kit.add(sleeve(0.047, 0.038, 0.04, 14).translate(F - 0.16, 0, 0), M.polished);
      kit.add(rod(V(0.13, 0.062, 0), V(F - 0.16, 0.05, 0), 0.011, 8), M.steel);
      kit.add(rod(V(0.13, 0.062, 0), V(F * 0.45, 0.058, 0), 0.02, 10), M.titanium);
      for (const x of [0.13, F - 0.16]) kit.add(block(0.03, 0.05, 0.03, 0.004), M.gunmetal, at(x, 0.04, 0));
      kit.add(cyl(0.046, 0.1, 'z', 16), M.titanium, at(F, 0, 0));
      kit.add(cyl(0.022, 0.116, 'z', 12), M.brass, at(F, 0, 0));
      femur.add(kit.build('leg'));

      // Tibia: slender, with the row of spines that makes the catching basket.
      const tibia = new THREE.Group();
      tibia.position.set(F, 0, 0);
      femur.add(tibia);
      ctx.part(tibia, [{ a: 0.74, b: 0.96, v: [0.22, 0, 0] }]);
      kit = new Kit();
      const T = spec.tibia;
      kit.add(rod(V(0.02, 0, 0), V(T, 0, 0), 0.03, 12, 0.015), M.titanium);
      kit.add(sleeve(0.036, 0.029, 0.05, 12).translate(0.1, 0, 0), M.polished);
      const spines = 9;
      for (let i = 0; i < spines; i += 1) {
        const x = 0.2 + ((T - 0.3) * i) / (spines - 1);
        for (const z of [-1, 1]) {
          const base = V(x, 0, z * 0.012);
          kit.add(rod(base, V(x + 0.05, 0.02, z * 0.085), 0.006, 5, 0.0012), M.steel);
        }
      }
      kit.add(cyl(0.022, 0.06, 'z', 12), M.brass, at(T, 0, 0));
      tibia.add(kit.build('leg'));

      // Tarsus: three short links and a pair of claws.
      const tarsus = new THREE.Group();
      tarsus.position.set(T, 0, 0);
      tibia.add(tarsus);
      ctx.part(tarsus, [{ a: 0.76, b: 0.98, v: [0.2, 0, 0] }]);
      kit = new Kit();
      const S = spec.tarsus;
      let x = 0.01;
      for (const [k, r] of [[0.4, 0.014], [0.3, 0.012], [0.22, 0.01]]) {
        kit.add(rod(V(x, 0, 0), V(x + S * k - 0.012, 0, 0), r, 8, r * 0.8), M.dark);
        kit.add(ball(r * 1.25, 8), M.steel, at(x + S * k - 0.004, 0, 0));
        x += S * k;
      }
      for (const z of [-1, 1]) {
        kit.add(tube([[x - 0.01, 0, 0], [x + 0.04, 0.006, z * 0.02], [x + 0.07, -0.02, z * 0.03], [x + 0.08, -0.05, z * 0.03]], 0.006, 5, 8), M.steel);
      }
      tarsus.add(kit.build('leg'));

      joints.push({ femur, tibia, tarsus, pose: spec.pose, seed: index * 1.7 + (side === left ? 0.9 : 0) });
    });
  }

  function update(time, p, still) {
    const live = still ? 0 : 1 - smooth(0.02, 0.22, p);
    // Opened out, the legs relax a little straighter so the chain reads clearly.
    const open = smooth(0.64, 0.9, p);
    for (const j of joints) {
      const a1 = j.pose[0] + live * 0.03 * Math.sin(time * 0.9 + j.seed) + open * 0.34;
      const a2 = j.pose[1] + live * 0.05 * Math.sin(time * 1.15 + j.seed * 1.7) + open * 1.5;
      const a3 = j.pose[2] + live * 0.06 * Math.sin(time * 1.4 + j.seed * 2.3) + open * 1.2;
      j.femur.rotation.z = a1;
      j.tibia.rotation.z = a2 - a1;
      j.tarsus.rotation.z = a3 - a2;
    }
  }
  update(0, 0, true);

  return { update, anchor: joints[0].femur };
}
