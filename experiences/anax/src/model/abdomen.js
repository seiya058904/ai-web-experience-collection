// Abdomen: ten overlapping segments on a flexible spine. The forward segments carry power cells,
// the middle ones the shape-memory coils that bend the tail, the last one the sensor and claspers.
import * as THREE from 'three';
import { Kit, panel, onSurface, crossPlate, sleeve, cyl, coil, tube, ball, block, circlePath, at, V } from '../geo.js';
import { clamp, lerp, smooth, EASE } from '../kinematics.js';
import { THORAX } from './thorax.js';

const LENGTH = [0.42, 0.56, 0.74, 0.78, 0.78, 0.76, 0.72, 0.6, 0.46, 0.34];
const FRONT = [0.46, 0.43, 0.36, 0.3, 0.27, 0.255, 0.25, 0.265, 0.27, 0.22];
const REAR = [0.43, 0.36, 0.3, 0.27, 0.255, 0.25, 0.265, 0.27, 0.22, 0.15];
// Resting curve: a slight sag behind the thorax, then a lift toward the tip.
const REST = [0.045, 0.03, 0.012, 0, -0.012, -0.022, -0.03, -0.032, -0.03, -0.02];
const GAP = 0.27;

export function buildAbdomen(ctx, thorax) {
  const { M } = ctx;
  const abdomen = new THREE.Group();
  abdomen.position.set(THORAX.x0 - 0.03, 0.02, 0);
  thorax.add(abdomen);
  ctx.part(abdomen, [{ a: 0.3, b: 0.58, v: [-1.35, 0, 0] }], { guide: true });

  const segments = [];
  for (let i = 0; i < LENGTH.length; i += 1) {
    const L = LENGTH[i];
    const rf = FRONT[i]; const rr = REAR[i];
    const radius = (x) => {
      const s = clamp(-x / L);
      return lerp(rf, rr, s) + 0.012 * Math.sin(Math.PI * s) - 0.014 * (1 - smooth(0, 0.12, s)) + 0.012 * smooth(0.86, 1, s);
    };
    const surf = (x, th, out) => { const r = radius(x); return out.set(x, r * Math.cos(th) * 1.05, r * Math.sin(th)); };
    const node = new THREE.Group();
    abdomen.add(node);
    const a = Math.min(0.76, 0.64 + i * 0.014);
    const b = Math.min(0.99, a + 0.22);

    // Tergite: the dorsal plate, with a darker trailing band that overlaps the next segment.
    let kit = new Kit();
    kit.add(panel({ surf, u0: -L, u1: 0, nu: 22, t0: -2.02, t1: 2.02, nt: 44, thick: 0.026, bevel: 0.008, uvU: 0.6, uvV: 1 }), i % 2 ? M.shell.satin : M.shell.titanium);
    kit.add(panel({ surf, u0: -L, u1: -L * 0.84, nu: 5, t0: -2.02, t1: 2.02, nt: 44, thick: 0.02, bevel: 0.006, lift: 0.007 }), M.shell.gun);
    kit.add(panel({ surf, u0: -L * 0.8, u1: -L * 0.16, nu: 10, t0: -0.045 / rf, t1: 0.045 / rf, nt: 4, thick: 0.02, bevel: 0.005, lift: 0.01 }), M.shell.dark);
    const tergite = ctx.make(node, kit, 'abdomen', [{ a, b, v: [0, 0.82, 0] }]);
    for (const side of [1, -1]) {
      const s = onSurface(surf, -L * 0.5, side * 1.76);
      ctx.fastener(tergite, 'abdomen', s.point, s.normal, { a: a - 0.07, b: a - 0.01, size: 0.02, lift: 0.18 });
    }

    // Sternite: the ventral strip.
    kit = new Kit();
    kit.add(panel({ surf, u0: -L, u1: 0, nu: 18, t0: 2.12, t1: Math.PI * 2 - 2.12, nt: 18, thick: 0.024, bevel: 0.007 }), M.shell.dark);
    for (const k of [0.3, 0.5, 0.7]) {
      kit.add(panel({ surf, u0: -L * k - 0.03, u1: -L * k + 0.03, nu: 4, t0: Math.PI - 0.22, t1: Math.PI + 0.22, nt: 6, thick: 0.016, bevel: 0.004, lift: 0.008 }), M.shell.gun);
    }
    ctx.make(node, kit, 'abdomen', [{ a, b, v: [0, -0.58, 0] }]);

    // Inside: spine tube, vertebra plates, tendons, and whatever this segment is for.
    kit = new Kit();
    kit.add(cyl(0.045, L + 0.05, 'x', 16), M.carbon, at(-L / 2, 0, 0));
    for (const k of [0.1, 0.9]) {
      const r = (lerp(rf, rr, k) - 0.03) * 0.92;
      const disc = new THREE.Shape();
      disc.absarc(0, 0, r, 0, Math.PI * 2, false);
      disc.holes.push(circlePath(0, 0, 0.045));
      for (let q = 0; q < 4; q += 1) {
        const ang = Math.PI / 4 + (q * Math.PI) / 2;
        disc.holes.push(circlePath(Math.cos(ang) * r * 0.72, Math.sin(ang) * r * 0.72, 0.018));
        disc.holes.push(circlePath(Math.cos(ang + Math.PI / 4) * r * 0.5, Math.sin(ang + Math.PI / 4) * r * 0.5, r * 0.2));
      }
      kit.add(crossPlate(disc, 0.022, 0.004, 24), M.gunmetal, at(-L * k, 0, 0));
    }
    const rm = (rf + rr) / 2 - 0.03;
    for (let q = 0; q < 4; q += 1) {
      const ang = Math.PI / 4 + (q * Math.PI) / 2;
      const y = Math.sin(ang) * rm * 0.66; const z = Math.cos(ang) * rm * 0.66;
      kit.add(cyl(0.008, L + 0.04, 'x', 6), M.copper, at(-L / 2, y, z));
    }
    const inner = ctx.make(node, kit, 'spine', []);

    kit = new Kit();
    let comp = 'spine';
    if (i >= 1 && i <= 3) {
      comp = 'cells';
      const rc = Math.min(0.1, rm * 0.27);
      for (let q = 0; q < 4; q += 1) {
        const ang = (q * Math.PI) / 2;
        const y = Math.sin(ang) * rm * 0.5; const z = Math.cos(ang) * rm * 0.5;
        kit.add(cyl(rc, L * 0.6, 'x', 20), M.gold, at(-L / 2, y, z));
        for (const e of [-1, 1]) kit.add(cyl(rc * 1.03, L * 0.045, 'x', 20), M.dark, at(-L / 2 + e * L * 0.31, y, z));
        kit.add(cyl(rc * 0.35, 0.02, 'x', 10), M.steel, at(-L * 0.17, y, z));
      }
    } else if (i >= 4 && i <= 7) {
      comp = 'spine';
      for (let q = 0; q < 4; q += 1) {
        const ang = Math.PI / 4 + (q * Math.PI) / 2;
        const y = Math.sin(ang) * rm * 0.66; const z = Math.cos(ang) * rm * 0.66;
        kit.add(coil(0.026, 0.0075, L * 0.56, 11, 6), M.copper, at(-L / 2, y, z));
        for (const e of [-1, 1]) kit.add(cyl(0.03, 0.03, 'x', 10), M.ceramic, at(-L / 2 + e * L * 0.3, y, z));
      }
      kit.add(block(L * 0.34, 0.012, rm * 0.7, 0.003), M.board, at(-L / 2, rm * 0.3, 0));
      kit.add(block(L * 0.1, 0.02, rm * 0.3, 0.003), M.dark, at(-L / 2, rm * 0.3 + 0.014, 0));
    } else if (i === 0) {
      kit.add(sleeve(rm * 0.8, rm * 0.55, L * 0.4, 32), M.brass, at(-L / 2, 0, 0));
      for (let q = 0; q < 8; q += 1) {
        const ang = (q / 8) * Math.PI * 2;
        kit.add(cyl(0.014, L * 0.5, 'x', 8), M.gold, at(-L / 2, Math.sin(ang) * rm * 0.42, Math.cos(ang) * rm * 0.42));
      }
    } else if (i === 8) {
      kit.add(cyl(rm * 0.62, L * 0.5, 'x', 24), M.gunmetal, at(-L / 2, 0, 0));
      kit.add(sleeve(rm * 0.7, rm * 0.62, L * 0.12, 24), M.gold, at(-L / 2, 0, 0));
    }
    if (kit.buckets.size) inner.add(kit.build(comp));

    // Joint: a ribbed gaiter in a bright retaining ring, at the front of every segment.
    kit = new Kit();
    kit.add(sleeve(rf - 0.028, rf - 0.1, 0.07, 36, 0.01), M.rubber, at(0.005, 0, 0));
    kit.add(sleeve(rf - 0.022, rf - 0.05, 0.016, 36, 0.003), M.polished, at(-0.03, 0, 0));
    for (const x of [-0.012, 0.012]) kit.add(new THREE.TorusGeometry(rf - 0.03, 0.01, 6, 36).rotateY(Math.PI / 2), M.rubber, at(x, 0, 0));
    inner.add(kit.build('spine'));

    segments.push({ node, length: L, index: i });
  }

  // Tail: end cap, a small rear sensor, and the claspers.
  {
    const last = segments[segments.length - 1];
    const L = last.length;
    const kit = new Kit();
    const r = REAR[REAR.length - 1];
    kit.add(cyl(r * 0.6, 0.05, 'x', 24, r * 0.9), M.gunmetal, at(-L - 0.02, 0, 0));
    kit.add(ball(0.05, 14), M.lens, at(-L - 0.05, 0, 0));
    for (const z of [-1, 1]) {
      kit.add(tube([[-L - 0.02, 0.02, z * 0.09], [-L - 0.2, 0.05, z * 0.14], [-L - 0.4, 0.03, z * 0.1], [-L - 0.52, -0.01, z * 0.045]], 0.02, 8, 18), M.polished);
      kit.add(ball(0.03, 10), M.brass, at(-L - 0.02, 0.02, z * 0.09));
    }
    kit.add(tube([[-L - 0.03, -0.06, 0], [-L - 0.16, -0.08, 0], [-L - 0.26, -0.05, 0]], 0.014, 6, 10), M.steel);
    ctx.make(last.node, kit, 'tail', [{ a: 0.7, b: 0.92, v: [-0.45, 0, 0] }]);
  }

  // The chain. Each joint adds its resting angle, its share of the idle flex, and its gap when opened.
  function update(time, p, still) {
    const live = still ? 0 : 1 - smooth(0.02, 0.22, p);
    let x = 0; let y = 0; let angle = 0;
    for (let i = 0; i < segments.length; i += 1) {
      const seg = segments[i];
      const gap = i === 0 ? 0 : GAP * EASE.inOut(clamp((p - (0.36 + i * 0.012)) / 0.22));
      const flex = live * (0.006 + i * 0.0032) * Math.sin(time * 1.25 - i * 0.55);
      angle += REST[i] * (1 - 0.55 * smooth(0.3, 0.62, p)) + flex;
      x -= Math.cos(angle) * gap;
      y -= Math.sin(angle) * gap;
      seg.node.position.set(x, y, 0);
      seg.node.rotation.z = angle;
      x -= Math.cos(angle) * seg.length;
      y -= Math.sin(angle) * seg.length;
    }
  }
  update(0, 0, true);

  return { abdomen, segments, update };
}
