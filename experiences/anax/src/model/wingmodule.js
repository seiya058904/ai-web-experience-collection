// Wing-root module: the hinge yoke, its pin, the rocker that the connecting rod drives,
// the feathering servo and the wing blade. Four of these, one per wing.
import * as THREE from 'three';
import { Kit, crossPlate, block, cyl, sleeve, gearZ, screw, linkShape, circlePath, slotPath, at } from '../geo.js';
import { rocker, leverRate, leverPeakRate, meshAngle } from '../kinematics.js';
import { LINK, PITCH, WING, STATION, HIND_LEAD } from '../spec.js';
import { buildWingBlade } from './wing.js';

const alongZ = (geometry) => geometry.rotateY(-Math.PI / 2);

export function buildWingModules(ctx, { right, left }) {
  const { M } = ctx;
  const wings = [];
  let seed = 11;

  for (const side of [right, left]) {
    for (const kind of ['fore', 'hind']) {
      const station = STATION[kind];
      const dir = Math.sign(station);
      const comp = kind === 'fore' ? 'forewing' : 'hindwing';
      const module = new THREE.Group();
      module.position.set(station, LINK.hy, LINK.hz);
      side.add(module);
      ctx.part(module, [{ a: 0.3, b: 0.58, v: [dir * 0.45, 0.9, 1.5] }], { guide: true });

      // Yoke: bolted to the top edge of the frame plate, two ears carrying the hinge pin in bronze bushes.
      let kit = new Kit();
      kit.add(block(0.46, 0.1, 0.2, 0.01), M.gunmetal, at(0, -0.23, -0.04));
      const ear = new THREE.Shape();
      ear.moveTo(-0.075, -0.19);
      ear.lineTo(0.075, -0.19);
      ear.lineTo(0.075, 0);
      ear.absarc(0, 0, 0.075, 0, Math.PI, false);
      ear.closePath();
      ear.holes.push(circlePath(0, 0, 0.04));
      for (const x of [-0.185, 0.185]) {
        kit.add(crossPlate(ear, 0.04, 0.006, 18), M.gunmetal, at(x, 0, 0));
        kit.add(sleeve(0.04, 0.028, 0.05, 20), M.bronze, at(x, 0, 0));
      }
      const bolt = screw(0.022, 0.014, 0.01, 0.04);
      for (const [x, z] of [[-0.17, -0.1], [0.17, -0.1], [0, -0.11]]) kit.add(bolt.clone(), M.steel, at(x, -0.18, z));
      ctx.make(module, kit, 'hinge', [{ a: 0.68, b: 0.9, v: [0, -0.44, -0.16] }]);

      // Hinge pin, drawn out along its own axis.
      kit = new Kit();
      kit.add(cyl(0.028, 0.5, 'x', 18), M.polished);
      kit.add(cyl(0.046, 0.016, 'x', 18), M.steel, at(dir * 0.258, 0, 0));
      kit.add(sleeve(0.04, 0.028, 0.012, 16, 0.002), M.dark, at(-dir * 0.236, 0, 0));
      ctx.make(module, kit, 'hinge', [{ a: 0.64, b: 0.84, v: [dir * 0.7, 0, 0] }]);

      // Rocker: barrel on the pin, lever arm inboard to the connecting rod.
      const rockerTravel = new THREE.Group();
      module.add(rockerTravel);
      ctx.part(rockerTravel, [{ a: 0.7, b: 0.92, v: [0, 0, 0.36] }]);
      const swing = new THREE.Group();
      rockerTravel.add(swing);
      kit = new Kit();
      kit.add(sleeve(0.066, 0.028, 0.3, 28, 0.008), M.titanium);
      const lever = linkShape(0, 0, 0.062, -LINK.arm, 0, 0.038);
      lever.holes.push(circlePath(0, 0, 0.03));
      lever.holes.push(slotPath(-LINK.arm * 0.36, 0, -LINK.arm * 0.72, 0, 0.012));
      kit.add(crossPlate(lever, 0.04, 0.006, 20), M.titanium, at(-0.05, 0, 0));
      kit.add(cyl(0.022, 0.108, 'x', 16), M.polished, at(-0.017, 0, -LINK.arm));
      kit.add(sleeve(0.032, 0.022, 0.01, 14, 0.002), M.dark, at(0.03, 0, -LINK.arm));
      swing.add(kit.build('hinge'));

      // Mount: the spar socket, set to the wing's dihedral and sweep.
      const mount = new THREE.Group();
      mount.rotation.set(-WING.dihedral, WING.sweep[kind], 0);
      swing.add(mount);
      kit = new Kit();
      kit.add(block(0.2, 0.13, 0.16, 0.012), M.titanium, at(0, 0, 0.115));
      kit.add(alongZ(sleeve(0.064, 0.043, 0.03, 24)), M.bronze, at(0, 0, WING.rootOffset));
      kit.add(alongZ(sleeve(0.074, 0.062, 0.016, 24)), M.polished, at(0, 0, WING.rootOffset - 0.002));
      mount.add(kit.build('hinge'));

      // Feathering servo: a pinion on its shaft turns the gear on the spar.
      const servo = new THREE.Group();
      mount.add(servo);
      ctx.part(servo, [{ a: 0.68, b: 0.9, v: [0, 0.55, 0] }]);
      const pinionY = ((PITCH.spar + PITCH.pinion) * PITCH.module) / 2;
      const gearPlane = WING.rootOffset + 0.045;
      kit = new Kit();
      kit.add(block(0.21, 0.115, 0.15, 0.01), M.dark, at(0, pinionY + 0.004, 0.11));
      kit.add(block(0.12, 0.006, 0.08, 0.002), M.titanium, at(0, pinionY + 0.064, 0.11));
      kit.add(block(0.27, 0.02, 0.05, 0.004), M.gunmetal, at(0, pinionY - 0.045, 0.11));
      for (const x of [-0.118, 0.118]) kit.add(bolt.clone(), M.steel, at(x, pinionY - 0.035, 0.11));
      kit.add(cyl(0.012, 0.09, 'z', 10), M.steel, at(0, pinionY, gearPlane - 0.03));
      kit.add(block(0.05, 0.03, 0.02, 0.003), M.gold, at(-0.06, pinionY + 0.02, 0.03));
      servo.add(kit.build('servo'));
      const pinionKit = new Kit();
      pinionKit.add(gearZ(PITCH.pinion, PITCH.module, 0.03, { bore: 0.01 }), M.brass);
      const pinion = pinionKit.build('servo');
      pinion.position.set(0, pinionY, gearPlane);
      servo.add(pinion);

      // Blade.
      const bladeTravel = new THREE.Group();
      bladeTravel.position.z = WING.rootOffset;
      mount.add(bladeTravel);
      ctx.part(bladeTravel, [{ a: 0.66, b: 0.92, v: [0, 0, 0.6] }]);
      const pitch = new THREE.Group();
      bladeTravel.add(pitch);
      const built = buildWingBlade(ctx, kind, comp, (seed += 17));
      pitch.add(built.blade);

      wings.push({ swing, pitch, pinion, uniforms: built.uniforms, phase: kind === 'hind' ? HIND_LEAD : 0, module, kind, mirrored: side === left });
    }
  }

  const peak = leverPeakRate();
  function update(theta, omega) {
    for (const wing of wings) {
      const t = theta + wing.phase;
      const rate = leverRate(t);
      wing.swing.rotation.x = rocker(t).beta;
      const feather = 0.05 - WING.feather * (rate / peak);
      wing.pitch.rotation.z = feather;
      wing.pinion.rotation.z = meshAngle(feather, PITCH.spar, PITCH.pinion, Math.PI / 2);
      // The blade trails its own motion: it bows up on the downstroke and down on the upstroke.
      wing.uniforms.uBend.value = 0.0021 * rate * omega;
    }
  }

  return { wings, update };
}
