// The drive: motor, planetary gearhead, twin counter-rotating crankshafts, connecting rods, and the core capsule.
// Power path: rotor -> sun gear -> planets -> output gear -> driven gear -> right crankshaft <-> left crankshaft
// -> crank pins -> connecting rods -> wing rockers.
import * as THREE from 'three';
import { Kit, crossPlate, gear, gearShape, cyl, sleeve, turned, block, circlePath, windowPath, slotPath, linkShape, at } from '../geo.js';
import { rocker, meshAngle } from '../kinematics.js';
import { STATION, LINK, GEAR, PLANET, HEAD_RATIO, MOTOR, PLANE, HIND_LEAD } from '../spec.js';
import { THORAX } from './thorax.js';

export const CAPSULE_Y = -0.385;

export function buildDrive(ctx, { thorax, right, left }) {
  const { M } = ctx;
  const B = THORAX.bulkhead;

  // ---- crankshafts ---------------------------------------------------------------------------
  const cranks = [];
  for (const side of [right, left]) {
    const isRight = side === right;
    const lift = new THREE.Group();
    lift.position.set(0, LINK.cy, LINK.cz);
    side.add(lift);
    ctx.part(lift, [{ a: 0.64, b: 0.84, v: [0, 0.9, 0] }]);
    const spin = new THREE.Group();
    lift.add(spin);
    cranks.push(spin);

    let kit = new Kit();
    kit.add(cyl(0.035, B * 2 - 0.1, 'x', 20), M.steel);
    for (const x of [-B + 0.02, B - 0.02]) kit.add(cyl(0.03, 0.1, 'x', 20), M.polished, at(x, 0, 0));
    ctx.make(spin, kit, 'crank', []);

    for (const [station, phase, slide] of [[STATION.fore, 0, 0.44], [STATION.hind, HIND_LEAD, -0.44]]) {
      const web = new THREE.Shape();
      web.absarc(0, 0, 0.17, 0, Math.PI * 2, false);
      web.holes.push(circlePath(0, 0, 0.035));
      web.holes.push(windowPath(0.07, 0.14, phase + 0.52, phase + 1.36));
      web.holes.push(windowPath(0.07, 0.14, phase - 1.36, phase - 0.52));
      kit = new Kit();
      const x = station - 0.06;
      kit.add(crossPlate(web, 0.05, 0.006, 28), M.steel, at(x, 0, 0));
      kit.add(sleeve(0.062, 0.035, 0.09), M.gunmetal, at(x - 0.02, 0, 0));
      const py = Math.sin(phase) * LINK.r;
      const pz = Math.cos(phase) * LINK.r;
      kit.add(cyl(0.028, 0.095, 'x', 18), M.polished, at(station + 0.005, py, pz));
      kit.add(cyl(0.04, 0.012, 'x', 18), M.steel, at(station + 0.05, py, pz));
      ctx.make(spin, kit, 'crank', [{ a: 0.72, b: 0.94, v: [slide, 0, 0] }]);
    }

    // Timing gear. The left one is cut half a tooth round so the pair meshes on the centre line.
    kit = new Kit();
    const timing = gear(GEAR.sync, GEAR.module, 0.07, { bore: 0.035, windows: 5, hub: 0.075 });
    if (!isRight) timing.rotateX(-Math.PI / GEAR.sync);
    kit.add(timing, M.brass, at(PLANE.sync, 0, 0));
    kit.add(sleeve(0.06, 0.035, 0.11), M.steel, at(PLANE.sync, 0, 0));
    ctx.make(spin, kit, 'crank', [{ a: 0.72, b: 0.94, v: [0.14, 0, 0] }]);

    if (isRight) {
      kit = new Kit();
      kit.add(gear(GEAR.driven, GEAR.module, 0.08, { bore: 0.035, windows: 4, hub: 0.07 }), M.gunmetal, at(PLANE.drive, 0, 0));
      kit.add(sleeve(0.058, 0.035, 0.12), M.steel, at(PLANE.drive, 0, 0));
      ctx.make(spin, kit, 'crank', [{ a: 0.72, b: 0.94, v: [-0.16, 0, 0] }]);
    }
  }

  // ---- connecting rods -----------------------------------------------------------------------
  const rods = [];
  const rodShape = () => {
    const L = LINK.rod;
    const s = linkShape(0, 0, 0.052, 0, L, 0.042);
    s.holes.push(circlePath(0, 0, 0.034));
    s.holes.push(circlePath(0, L, 0.027));
    s.holes.push(slotPath(0, L * 0.3, 0, L * 0.68, 0.0065));
    return s;
  };
  for (const side of [right, left]) {
    for (const [station, phase] of [[STATION.fore, 0], [STATION.hind, HIND_LEAD]]) {
      const travel = new THREE.Group();
      side.add(travel);
      ctx.part(travel, [
        { a: 0.34, b: 0.6, v: [Math.sign(station) * 0.1, 0.6, 0.62] },
        { a: 0.64, b: 0.84, v: [0, 0.3, 0] },
      ]);
      const kit = new Kit();
      kit.add(crossPlate(rodShape(), 0.036, 0.005, 20), M.polished);
      kit.add(sleeve(0.034, 0.028, 0.044, 20), M.bronze);
      kit.add(sleeve(0.027, 0.022, 0.044, 20), M.bronze, at(0, LINK.rod, 0));
      const link = kit.build('rod');
      link.position.x = station;
      travel.add(link);
      rods.push({ link, phase });
    }
  }

  // ---- motor and gearhead --------------------------------------------------------------------
  const motor = new THREE.Group();
  motor.position.set(0, MOTOR.y, MOTOR.z);
  thorax.add(motor);
  ctx.part(motor, [
    { a: 0.38, b: 0.54, v: [0, -1.55, 0] },
    { a: 0.52, b: 0.64, v: [-0.8, 0, 0] },
  ], { guide: true });
  const late = (dx) => [{ a: 0.66, b: 0.92, v: [dx, 0, 0] }];

  // Stator: end bell, laminated core and nine copper windings left open to view.
  let kit = new Kit();
  kit.add(turned([[0, -0.98], [0.15, -0.98], [0.2, -0.955], [0.2, -0.9], [0, -0.9]], 40), M.dark);
  kit.add(cyl(0.055, 0.03, 'x', 20), M.polished, at(-0.992, 0, 0));
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2;
    kit.add(cyl(0.012, 0.012, 'x', 8), M.steel, at(-0.982, Math.cos(a) * 0.12, Math.sin(a) * 0.12));
  }
  kit.add(cyl(0.1, 0.1, 'x', 28), M.dark, at(-0.85, 0, 0));
  for (let i = 0; i < 9; i += 1) {
    const a = (i / 9) * Math.PI * 2;
    kit.add(cyl(0.036, 0.086, 'x', 12), M.copper, at(-0.852, Math.cos(a) * 0.14, Math.sin(a) * 0.14));
    kit.add(block(0.03, 0.05, 0.1, 0.004), M.gunmetal, at(-0.852, Math.cos(a) * 0.105, Math.sin(a) * 0.105, a));
  }
  // The strap that closes the saddle under the motor.
  kit.add(new THREE.TorusGeometry(0.212, 0.014, 8, 28, Math.PI).rotateY(Math.PI / 2).rotateX(Math.PI), M.polished, at(-B, 0, 0));
  ctx.make(motor, kit, 'motor', late(-0.5));

  // Rotor bell with the sun gear on its shaft.
  const rotorPart = new THREE.Group();
  motor.add(rotorPart);
  ctx.part(rotorPart, late(-0.14));
  kit = new Kit();
  kit.add(sleeve(0.2, 0.172, 0.26, 44), M.gunmetal, at(-0.67, 0, 0));
  for (const x of [-0.775, -0.565]) kit.add(sleeve(0.204, 0.198, 0.022, 44), M.polished, at(x, 0, 0));
  const face = new THREE.Shape();
  face.absarc(0, 0, 0.198, 0, Math.PI * 2, false);
  face.holes.push(circlePath(0, 0, 0.024));
  for (let i = 0; i < 5; i += 1) face.holes.push(windowPath(0.06, 0.15, (i / 5) * Math.PI * 2 + 0.16, ((i + 1) / 5) * Math.PI * 2 - 0.16));
  kit.add(crossPlate(face, 0.02, 0.004, 24), M.gunmetal, at(-0.545, 0, 0));
  kit.add(cyl(0.025, 0.5, 'x', 16), M.steel, at(-0.6, 0, 0));
  // Uneven balance marks, so the eye can follow the rotor rather than see a wheel.
  for (const a of [0.2, 1.5, 3.9]) kit.add(cyl(0.014, 0.008, 'y', 10), M.amber, at(-0.67, Math.cos(a) * 0.2, Math.sin(a) * 0.2, a));
  kit.add(gear(PLANET.sun, PLANET.module, 0.07, { bore: 0 }), M.brass, at(-0.37, 0, 0));
  const rotor = kit.build('motor');
  rotorPart.add(rotor);

  // Gearhead housing with the fixed ring gear cut into it.
  kit = new Kit();
  kit.add(sleeve(0.212, 0.198, 0.235, 48, 0.008), M.titanium, at(-0.382, 0, 0));
  const ring = new THREE.Shape();
  ring.absarc(0, 0, 0.2, 0, Math.PI * 2, false);
  ring.holes.push(new THREE.Path(gearShape(PLANET.ring, PLANET.module).getPoints(2)));
  kit.add(crossPlate(ring, 0.09, 0.003, 40), M.steel, at(-0.37, 0, 0));
  kit.add(sleeve(0.218, 0.2, 0.03, 48), M.polished, at(-0.49, 0, 0));
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2;
    kit.add(block(0.2, 0.012, 0.02, 0.003), M.gunmetal, at(-0.38, Math.cos(a) * 0.214, Math.sin(a) * 0.214, a + Math.PI / 2));
  }
  ctx.make(motor, kit, 'motor', late(0.06));

  // Planet carrier and its three planets.
  const carrierPart = new THREE.Group();
  motor.add(carrierPart);
  ctx.part(carrierPart, late(0.42));
  const carrier = new THREE.Group();
  carrierPart.add(carrier);
  kit = new Kit();
  const plateShape = new THREE.Shape();
  plateShape.absarc(0, 0, 0.196, 0, Math.PI * 2, false);
  kit.add(crossPlate(plateShape, 0.018, 0.004, 32), M.gunmetal, at(-0.268, 0, 0));
  kit.add(cyl(0.04, 0.2, 'x', 18), M.steel, at(-0.19, 0, 0));
  const orbit = ((PLANET.sun + PLANET.planet) * PLANET.module) / 2;
  const planets = [];
  for (let i = 0; i < 3; i += 1) {
    const a = (i / 3) * Math.PI * 2;
    const y = Math.sin(a) * orbit; const z = Math.cos(a) * orbit;
    kit.add(cyl(0.016, 0.1, 'x', 12), M.steel, at(-0.32, y, z));
    kit.add(cyl(0.024, 0.008, 'x', 12), M.polished, at(-0.257, y, z));
    const planetKit = new Kit();
    planetKit.add(gear(PLANET.planet, PLANET.module, 0.06, { bore: 0.016 }), M.brass);
    const planet = planetKit.build('motor');
    planet.position.set(-0.37, y, z);
    carrier.add(planet);
    planets.push({ node: planet, angle: a });
  }
  carrier.add(kit.build('motor'));

  // Output gear.
  const outPart = new THREE.Group();
  motor.add(outPart);
  ctx.part(outPart, late(0.72));
  kit = new Kit();
  kit.add(gear(GEAR.out, GEAR.module, 0.08, { bore: 0.04, windows: 3, hub: 0.075 }), M.brass, at(PLANE.drive, 0, 0));
  kit.add(sleeve(0.062, 0.04, 0.12), M.steel, at(PLANE.drive, 0, 0));
  kit.add(cyl(0.02, 0.012, 'x', 6), M.polished, at(PLANE.drive + 0.062, 0, 0));
  const outGear = kit.build('motor');
  outPart.add(outGear);

  // ---- core capsule --------------------------------------------------------------------------
  const capsule = new THREE.Group();
  capsule.position.set(0, CAPSULE_Y, 0);
  thorax.add(capsule);
  ctx.part(capsule, [
    { a: 0.34, b: 0.5, v: [0, -1.55, 0] },
    { a: 0.5, b: 0.62, v: [0.5, 0, 0] },
  ], { guide: true });

  kit = new Kit();
  kit.add(turned([[0, 0.24], [0.14, 0.24], [0.18, 0.27], [0.18, 0.345], [0.166, 0.345], [0.166, 0.365], [0, 0.365]], 44), M.gunmetal);
  kit.add(sleeve(0.186, 0.179, 0.03, 44, 0.003), M.polished, at(0.3, 0, 0));
  kit.add(cyl(0.05, 0.02, 'x', 16), M.dark, at(0.232, 0, 0));
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2;
    kit.add(cyl(0.008, 0.014, 'x', 8), M.gold, at(0.222, Math.cos(a) * 0.03, Math.sin(a) * 0.03));
  }
  ctx.make(capsule, kit, 'core', late(-0.34));

  kit = new Kit();
  kit.add(sleeve(0.18, 0.168, 0.5, 48, 0.004), M.glass, at(0.6, 0, 0));
  ctx.make(capsule, kit, 'core', late(0.78), { cast: false });

  kit = new Kit();
  for (let i = 0; i < 5; i += 1) {
    const x = 0.42 + i * 0.09;
    kit.add(sleeve(0.152, 0.07, 0.012, 36, 0.002), M.board, at(x, 0, 0));
    kit.add(sleeve(0.156, 0.15, 0.008, 36, 0.001), M.gold, at(x, 0, 0));
    for (let k = 0; k < 3; k += 1) {
      const a = (k / 3) * Math.PI * 2 + i * 0.7;
      kit.add(block(0.014, 0.05, 0.04, 0.003), M.dark, at(x + 0.012, Math.cos(a) * 0.105, Math.sin(a) * 0.105, a));
      kit.add(block(0.01, 0.02, 0.02, 0.002), M.gold, at(x + 0.01, Math.cos(a + 1) * 0.11, Math.sin(a + 1) * 0.11, a + 1));
    }
  }
  for (let k = 0; k < 3; k += 1) {
    const a = (k / 3) * Math.PI * 2 + 0.5;
    kit.add(cyl(0.01, 0.44, 'x', 8), M.brass, at(0.6, Math.cos(a) * 0.135, Math.sin(a) * 0.135));
  }
  // The cell at the centre and the two status rings that light the capsule from within.
  kit.add(cyl(0.062, 0.34, 'x', 28), M.gold, at(0.6, 0, 0));
  for (const x of [0.44, 0.76]) kit.add(sleeve(0.066, 0.058, 0.018, 28, 0.002), M.dark, at(x, 0, 0));
  for (const x of [0.385, 0.815]) kit.add(sleeve(0.13, 0.11, 0.014, 36, 0.002), M.amber, at(x, 0, 0));
  const stack = ctx.make(capsule, kit, 'core', []);
  const glow = new THREE.PointLight(0xff9b45, 0.9, 2.4, 2);
  glow.position.set(0.6, 0, 0);
  stack.add(glow);

  kit = new Kit();
  kit.add(turned([[0, 0.835], [0.166, 0.835], [0.166, 0.855], [0.18, 0.855], [0.18, 0.9], [0.12, 0.94], [0, 0.94]], 44), M.gunmetal);
  kit.add(sleeve(0.186, 0.179, 0.03, 44, 0.003), M.polished, at(0.885, 0, 0));
  kit.add(cyl(0.035, 0.03, 'x', 16), M.gold, at(0.945, 0, 0));
  ctx.make(capsule, kit, 'core', late(1.2));

  // ---- motion --------------------------------------------------------------------------------
  const toMotor = Math.atan2(MOTOR.y - LINK.cy, MOTOR.z - LINK.cz);

  function update(theta) {
    for (const crank of cranks) crank.rotation.x = -theta;
    const out = meshAngle(theta, GEAR.driven, GEAR.out, toMotor);
    outGear.rotation.x = -out;
    carrier.rotation.x = -out;
    const sun = out * HEAD_RATIO;
    rotor.rotation.x = -sun;
    for (const planet of planets) {
      const absolute = meshAngle(sun, PLANET.sun, PLANET.planet, planet.angle + out);
      planet.node.rotation.x = -(absolute - out);
    }
    for (let i = 0; i < rods.length; i += 1) {
      const r = rods[i];
      const s = rocker(theta + r.phase);
      r.link.position.y = s.py;
      r.link.position.z = s.pz;
      r.link.rotation.x = Math.atan2(s.qz - s.pz, s.qy - s.py);
    }
  }

  return { update, glow, anchors: { motor, core: capsule, crank: cranks[0].parent, rod: rods[0].link } };
}
