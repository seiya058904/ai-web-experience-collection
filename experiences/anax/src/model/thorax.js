// Thorax: the outer shell panels, the airframe they bolt to, and the leg carrier underneath.
import * as THREE from 'three';
import { Kit, panel, onSurface, plate, crossPlate, cyl, sleeve, tube, block, slotPath, circlePath, screw, rod, at, V } from '../geo.js';
import { lerp, smooth } from '../kinematics.js';
import { STATION, MOTOR, LINK } from '../spec.js';
import { mirrored } from './context.js';

export const THORAX = { x0: -1.42, x1: 1.36, plateZ: 0.66, bulkhead: 0.96 };
export const CARRIER_Y = -0.605;

/** The thorax pod: a superellipse section that swells behind the head and tapers to the abdomen. */
export function thoraxSurf(x, th, out) {
  const u = Math.min(1, Math.max(0, (x - THORAX.x0) / (THORAX.x1 - THORAX.x0)));
  const k = Math.sin(Math.PI * u) ** 0.38;
  const hump = Math.sin(Math.PI * u ** 1.14) ** 0.5;
  const w = lerp(lerp(0.5, 0.4, u), 0.86, k);
  const top = lerp(lerp(0.5, 0.42, u), 0.8, hump);
  const bottom = lerp(lerp(0.46, 0.4, u), 0.72, k);
  const s = Math.sin(th);
  const c = Math.cos(th);
  return out.set(x, 0.02 + (c >= 0 ? top : bottom) * Math.sign(c) * Math.abs(c) ** 0.8, w * Math.sign(s) * Math.abs(s) ** 0.8);
}

// The shell opens around each wing root so the hinge can work in the clear.
const notch = (x) => Math.max(1 - smooth(0.3, 0.38, Math.abs(x - STATION.fore)), 1 - smooth(0.3, 0.38, Math.abs(x - STATION.hind)));
const dorsalEdge = (x) => 0.98 - 0.36 * notch(x);
const cowlTop = (x) => 1.0 + 0.5 * notch(x);
// Forward of the middle the cowl stops short, leaving a bay for the legs.
const cowlBottom = (x) => lerp(2.74, 2.2, smooth(-0.24, -0.04, x));
const PAN = 2.76;

export function buildThorax(ctx) {
  const { M } = ctx;
  const thorax = new THREE.Group();
  const surf = thoraxSurf;
  const left = mirrored();
  const right = new THREE.Group();
  thorax.add(right, left);

  const anchors = {};
  // ---- shell ---------------------------------------------------------------------------------
  const xa = THORAX.x0 + 0.06;
  const xb = 0.965;

  let kit = new Kit();
  kit.add(panel({ surf, u0: xa, u1: xb, nu: 132, t0: (x) => -dorsalEdge(x), t1: dorsalEdge, nt: 46, thick: 0.034, bevel: 0.009, uvU: 2, uvV: 1 }), M.shell.titanium);
  const carapace = ctx.make(thorax, kit, 'shell', [
    { a: 0.05, b: 0.27, v: [0, 2.3, 0] },
    { a: 0.34, b: 0.6, v: [0, 0.8, 0] },
  ], { guide: true });

  kit = new Kit();
  kit.add(panel({ surf, u0: -1.16, u1: 0.78, nu: 60, t0: -0.06, t1: 0.06, nt: 6, thick: 0.03, bevel: 0.006, lift: 0.016 }), M.shell.dark);
  // Sensor blisters along the spine.
  for (const x of [-0.9, -0.3, 0.3]) {
    const s = onSurface(surf, x, 0);
    kit.add(new THREE.SphereGeometry(0.035, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.shell.satin, at(s.point.x, s.point.y + 0.012, 0));
  }
  ctx.make(carapace, kit, 'shell', [{ a: 0.66, b: 0.86, v: [0, 0.45, 0] }]);

  for (const [x, t] of [[-1.24, 0.3], [-1.24, 0.82], [0.0, 0.84], [0.86, 0.3], [0.86, 0.82]]) {
    for (const side of [1, -1]) {
      const s = onSurface(surf, x, t * side);
      ctx.fastener(carapace, 'shell', s.point, s.normal, { a: 0, b: 0.065 + Math.abs(x) * 0.006, size: 0.028 });
    }
  }

  kit = new Kit();
  kit.add(panel({ surf, u0: 0.98, u1: THORAX.x1 - 0.03, nu: 24, t0: -2.2, t1: 2.2, nt: 72, thick: 0.034, bevel: 0.009, uvU: 0.4, uvV: 2 }), M.shell.satin);
  const collar = ctx.make(thorax, kit, 'shell', [
    { a: 0.08, b: 0.28, v: [0.45, 1.55, 0] },
    { a: 0.34, b: 0.6, v: [0.8, 0.3, 0] },
  ]);
  for (const t of [-1.5, -0.5, 0.5, 1.5]) {
    const s = onSurface(surf, 1.14, t);
    ctx.fastener(collar, 'shell', s.point, s.normal, { a: 0.02, b: 0.09, size: 0.024 });
  }

  for (const side of [right, left]) {
    kit = new Kit();
    kit.add(panel({ surf, u0: xa, u1: xb, nu: 132, t0: cowlTop, t1: cowlBottom, nt: 34, thick: 0.034, bevel: 0.009, uvU: 2, uvV: 1 }), M.shell.gun);
    // Louvres let the drive breathe and break up the flank.
    for (let i = 0; i < 5; i += 1) {
      const x = -0.34 + i * 0.085;
      kit.add(panel({ surf, u0: x, u1: x + 0.045, nu: 4, t0: 1.5, t1: 1.86, nt: 10, thick: 0.02, bevel: 0.006, lift: 0.012 }), M.shell.dark);
    }
    const cowl = ctx.make(side, kit, 'shell', [
      { a: 0.1, b: 0.29, v: [0, -0.2, 1.25] },
      { a: 0.34, b: 0.6, v: [0, -0.95, 1.15] },
    ]);
    for (const [x, t] of [[-1.24, 1.2], [-1.24, 2.5], [0.0, 1.22], [0.86, 1.2], [0.86, 2.0]]) {
      const s = onSurface(surf, x, t);
      ctx.fastener(cowl, 'shell', s.point, s.normal, { a: 0.03, b: 0.11, size: 0.026 });
    }
  }

  kit = new Kit();
  kit.add(panel({ surf, u0: xa, u1: THORAX.x1 - 0.03, nu: 96, t0: PAN, t1: Math.PI * 2 - PAN, nt: 26, thick: 0.034, bevel: 0.009, uvU: 2, uvV: 0.6 }), M.shell.dark);
  for (let i = 0; i < 4; i += 1) {
    const x = -1.1 + i * 0.16;
    kit.add(panel({ surf, u0: x, u1: x + 0.07, nu: 4, t0: Math.PI - 0.2, t1: Math.PI + 0.2, nt: 8, thick: 0.02, bevel: 0.006, lift: 0.012 }), M.shell.gun);
  }
  const pan = ctx.make(thorax, kit, 'shell', [
    { a: 0.12, b: 0.3, v: [0, -1.7, 0] },
    { a: 0.34, b: 0.62, v: [0, -2.5, 0] },
  ], { guide: true });
  for (const [x, t] of [[-1.24, PAN + 0.12], [0.1, PAN + 0.1], [1.2, PAN + 0.1]]) {
    for (const side of [1, -1]) {
      const s = onSurface(surf, x, side > 0 ? t : Math.PI * 2 - t);
      ctx.fastener(pan, 'shell', s.point, s.normal, { a: 0.05, b: 0.13, size: 0.026 });
    }
  }

  // ---- airframe ------------------------------------------------------------------------------
  const frame = new THREE.Group();
  thorax.add(frame);
  const B = THORAX.bulkhead;

  // Side plates: lightened beams that carry the wing hinges on their top edge.
  for (const side of [right, left]) {
    const outline = new THREE.Shape();
    outline.moveTo(-0.84, -0.36);
    outline.lineTo(0.84, -0.36);
    outline.lineTo(1.02, -0.2);
    outline.lineTo(1.02, 0.02);
    outline.lineTo(0.92, 0.12);
    outline.lineTo(-0.92, 0.12);
    outline.lineTo(-1.02, 0.02);
    outline.lineTo(-1.02, -0.2);
    outline.closePath();
    for (let i = 0; i < 6; i += 1) {
      const x = -0.7 + i * 0.28;
      const lean = i % 2 ? 0.07 : -0.07;
      outline.holes.push(slotPath(x - lean, -0.24, x + lean, 0.0, 0.062));
    }
    for (const [x, y] of [[-0.92, -0.1], [0.92, -0.1], [0, -0.3], [-0.46, 0.065], [0.46, 0.065]]) outline.holes.push(circlePath(x, y, 0.02));
    kit = new Kit();
    kit.add(plate(outline, 0.05, 0.006), M.frame, at(0, 0, THORAX.plateZ));
    const bolt = screw(0.022, 0.014, 0.01, 0.03);
    for (const [x, y] of [[-0.97, -0.09], [-0.97, -0.02], [0.97, -0.09], [0.97, -0.02]]) kit.add(bolt.clone(), M.steel, at(x, y, THORAX.plateZ + 0.025, Math.PI / 2));
    const sidePlate = ctx.make(side, kit, 'frame', [{ a: 0.64, b: 0.86, v: [0, 0, 1.1] }]);
    if (side === right) anchors.frame = sidePlate;
  }

  // Bulkheads close the box, seat the crankshaft bearings and carry the spine rail on a mast.
  const bulkhead = (rear) => {
    const s = new THREE.Shape();
    const my = MOTOR.y;
    s.moveTo(-0.66, -0.24);
    s.lineTo(-0.3, -0.56);
    if (rear) {
      // Saddle for the motor, open below so the drive can be dropped out.
      s.lineTo(-0.215, -0.56);
      s.lineTo(-0.215, my);
      s.absarc(0, my, 0.215, Math.PI, 0, true);
      s.lineTo(0.215, -0.56);
    }
    s.lineTo(0.3, -0.56);
    s.lineTo(0.66, -0.24);
    s.lineTo(0.66, 0.02);
    s.lineTo(0.56, 0.12);
    s.lineTo(0.1, 0.12);
    s.lineTo(0.1, 0.5);
    s.lineTo(0.04, 0.57);
    s.lineTo(-0.04, 0.57);
    s.lineTo(-0.1, 0.5);
    s.lineTo(-0.1, 0.12);
    s.lineTo(-0.56, 0.12);
    s.lineTo(-0.66, 0.02);
    s.closePath();
    for (const z of [-LINK.cz, LINK.cz]) s.holes.push(circlePath(z, LINK.cy, 0.064));
    for (const z of [-0.52, 0.52]) s.holes.push(circlePath(z, -0.13, 0.06));
    s.holes.push(circlePath(0, 0.3, 0.05));
    if (!rear) s.holes.push(circlePath(0, -0.36, 0.13));
    return s;
  };
  for (const rear of [false, true]) {
    const x = rear ? -B : B;
    const dir = rear ? -1 : 1;
    kit = new Kit();
    kit.add(crossPlate(bulkhead(rear), 0.05, 0.006), M.frame, at(x, 0, 0));
    // Crankshaft bearings: steel race, bronze cage.
    for (const z of [-LINK.cz, LINK.cz]) {
      kit.add(sleeve(0.075, 0.06, 0.07), M.steel, at(x, LINK.cy, z));
      kit.add(sleeve(0.06, 0.04, 0.05), M.bronze, at(x, LINK.cy, z));
    }
    // Bezel ring where the shell meets the neck or the abdomen, stood off the bulkhead on four posts.
    const ringX = rear ? THORAX.x0 + 0.02 : THORAX.x1 - 0.02;
    const ro = rear ? 0.515 : 0.435;
    kit.add(sleeve(ro, ro - 0.085, 0.1, 56, 0.012), M.polished, at(ringX, 0.02, 0));
    kit.add(sleeve(ro - 0.085, ro - 0.14, 0.06, 56), M.dark, at(ringX - dir * 0.01, 0.02, 0));
    for (const [y, z] of [[0.3, 0.26], [0.3, -0.26], [-0.24, 0.3], [-0.24, -0.3]]) {
      kit.add(rod(V(x + dir * 0.02, y * 0.7, z), V(ringX - dir * 0.04, y, z * 1.05), 0.018, 10), M.gunmetal);
    }
    ctx.make(frame, kit, 'frame', [{ a: 0.64, b: 0.86, v: [dir * 0.8, 0, 0] }]);
  }

  // Rails: one spine rail on the masts, two lower rails, and the hangers for the leg carrier.
  kit = new Kit();
  kit.add(cyl(0.03, B * 2 + 0.1, 'x', 16), M.carbon, at(0, 0.5, 0));
  for (const z of [-0.585, 0.585]) kit.add(cyl(0.022, B * 2 + 0.06, 'x', 14), M.carbon, at(0, -0.3, z));
  for (const x of [-B, B]) {
    kit.add(sleeve(0.045, 0.03, 0.09), M.polished, at(x, 0.5, 0));
    for (const z of [-0.585, 0.585]) kit.add(sleeve(0.036, 0.022, 0.08), M.polished, at(x, -0.3, z));
  }
  // Clips that hold the wiring to the spine rail.
  for (const x of [-0.62, -0.2, 0.2, 0.62]) kit.add(sleeve(0.05, 0.03, 0.04), M.brass, at(x, 0.5, 0));
  ctx.make(frame, kit, 'frame', []);

  // Wiring loom. Sheathed runs from the core capsule to each consumer, tied to the rails.
  kit = new Kit();
  const run = (points, r = 0.013, material = M.rubber) => kit.add(tube(points, r, 6, points.length * 8), material);
  const plug = (p, axis = 'x') => kit.add(cyl(0.022, 0.05, axis, 10), M.gold, at(p[0], p[1], p[2]));
  for (const side of [1, -1]) {
    for (const [station, lead] of [[STATION.fore, 0.035], [STATION.hind, -0.035]]) {
      // Capsule -> up the inside of the frame -> spine rail -> out to the wing servo.
      const path = [[0.3, -0.26, side * 0.14], [0.26 + lead, -0.02, side * 0.52], [station * 0.55 + lead, 0.3, side * 0.2], [station * 0.8, 0.52, side * 0.07], [station - 0.14, 0.55, side * 0.3], [station - 0.16, 0.56, side * 0.6]];
      run(path, 0.011, station > 0 ? M.rubber : M.copper);
      plug(path[path.length - 1], 'z');
    }
    // Phase leads to the motor, laid along the lower rail.
    const phase = [[0.26, -0.44, side * 0.1], [0.1, -0.5, side * 0.44], [-0.3, -0.36, side * 0.56], [-0.72, -0.32, side * 0.5], [-0.9, -0.34, side * 0.2]];
    run(phase, 0.014, side > 0 ? M.copper : M.rubber);
    plug(phase[phase.length - 1], 'z');
  }
  // Bus to the head and to the abdomen.
  run([[0.9, -0.36, 0], [1.05, -0.34, 0.02], [1.2, -0.1, 0.04], [1.36, 0.0, 0.03]], 0.02);
  run([[0.3, -0.52, 0], [-0.3, -0.6, -0.04], [-0.9, -0.5, -0.05], [-1.2, -0.2, -0.03], [-1.4, 0.0, 0]], 0.018);
  ctx.make(frame, kit, 'loom', []);

  // ---- leg carrier ---------------------------------------------------------------------------
  const carrier = new THREE.Group();
  thorax.add(carrier);
  ctx.part(carrier, [{ a: 0.3, b: 0.56, v: [0, -2.9, 0] }]);
  {
    const s = new THREE.Shape();
    s.moveTo(0.02, -0.5); s.lineTo(0.9, -0.62); s.lineTo(1.02, -0.5); s.lineTo(1.02, 0.5); s.lineTo(0.9, 0.62); s.lineTo(0.02, 0.5); s.lineTo(-0.08, 0.3); s.lineTo(-0.08, -0.3);
    s.closePath();
    for (const x of [0.14, 0.42, 0.7]) s.holes.push(slotPath(x, -0.2, x, 0.2, 0.07));
    kit = new Kit();
    kit.add(plate(s, 0.045, 0.006).rotateX(Math.PI / 2), M.gunmetal, at(0, CARRIER_Y, 0));
    for (const x of [0.02, 0.9]) for (const z of [-0.6, 0.6]) {
      kit.add(rod(V(x, CARRIER_Y, z * 0.86), V(x, -0.34, z * 1.02), 0.02, 10), M.steel);
      kit.add(sleeve(0.034, 0.02, 0.05), M.polished, at(x, -0.33, z * 1.02, 0, 0, Math.PI / 2));
    }
    ctx.make(carrier, kit, 'frame', []);
  }

  anchors.shell = carapace;
  return { thorax, frame, right, left, carrier, surf, anchors };
}
