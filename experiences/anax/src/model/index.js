// Assembles the dragonfly and owns the two things that move it:
// the disassembly pose (a pure function of progress) and the running mechanism (a function of crank angle).
import * as THREE from 'three';
import { evalTrack, smooth, lerp } from '../kinematics.js';
import { createContext } from './context.js';
import { buildThorax } from './thorax.js';
import { buildDrive } from './drive.js';
import { buildWingModules } from './wingmodule.js';
import { buildHead } from './head.js';
import { buildAbdomen } from './abdomen.js';
import { buildLegs } from './legs.js';

const SAMPLES = [0, 0.15, 0.3, 0.45, 0.62, 0.8, 1];

export function buildAnax(M) {
  const ctx = createContext(M);
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const thorax = buildThorax(ctx);
  body.add(thorax.thorax);
  const drive = buildDrive(ctx, thorax);
  const wings = buildWingModules(ctx, thorax);
  const head = buildHead(ctx, thorax.thorax);
  const abdomen = buildAbdomen(ctx, thorax.thorax);
  const legs = buildLegs(ctx, thorax.carrier);

  // ---- components: every mesh belongs to one named, selectable component ------------------------
  const comps = new Map();
  root.traverse((node) => {
    if (!node.isMesh || !node.userData.comp) return;
    if (!comps.has(node.userData.comp)) comps.set(node.userData.comp, { meshes: [], anchor: null });
    comps.get(node.userData.comp).meshes.push(node);
    node.userData.base = node.material;
  });
  // Where a component's label and focus point sit. Repeated components use their first instance.
  const firstWith = (object, comp) => { let found = null; object.traverse((n) => { if (!found && n.isMesh && n.userData.comp === comp) found = n; }); return found; };
  const anchors = {
    shell: thorax.anchors.shell,
    frame: thorax.anchors.frame,
    eye: firstWith(head.pose, 'eye')?.parent,
    head: head.pose,
    forewing: wings.wings[0].pitch,
    hindwing: wings.wings[1].pitch,
    hinge: wings.wings[0].swing.children[0],
    servo: firstWith(wings.wings[0].module, 'servo')?.parent,
    rod: drive.anchors.rod,
    crank: drive.anchors.crank,
    motor: drive.anchors.motor,
    core: drive.anchors.core,
    leg: legs.anchor,
    cells: abdomen.segments[2].node,
    abdomen: abdomen.segments[4].node,
    spine: abdomen.segments[6].node,
    tail: firstWith(abdomen.segments[9].node, 'tail')?.parent,
  };
  for (const [id, object] of Object.entries(anchors)) if (comps.has(id) && object) comps.get(id).anchor = object;

  // ---- disassembly pose ------------------------------------------------------------------------
  const scratch = new Float64Array(6);
  let posed = -1;
  function setProgress(p) {
    if (p === posed) return false;
    posed = p;
    const parts = ctx.parts;
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i];
      if (!part.steps.length) continue;
      evalTrack(part.steps, p, scratch);
      part.node.position.set(part.rest.x + scratch[0], part.rest.y + scratch[1], part.rest.z + scratch[2]);
      if (part.spin) part.node.rotation.set(part.restRot.x + scratch[3], part.restRot.y + scratch[4], part.restRot.z + scratch[5]);
    }
    return true;
  }

  // Leader lines from where a part belongs to where it has travelled.
  const guided = ctx.parts.filter((part) => part.guide);
  const guidePositions = new Float32Array(guided.length * 6);
  const guideDistances = new Float32Array(guided.length * 2);
  const guideGeometry = new THREE.BufferGeometry();
  guideGeometry.setAttribute('position', new THREE.BufferAttribute(guidePositions, 3));
  guideGeometry.setAttribute('lineDistance', new THREE.BufferAttribute(guideDistances, 1));
  const guideMaterial = new THREE.LineDashedMaterial({ color: 0xcfd6e0, transparent: true, opacity: 0, depthWrite: false, dashSize: 0.09, gapSize: 0.07 });
  const guides = new THREE.LineSegments(guideGeometry, guideMaterial);
  guides.frustumCulled = false;
  guides.renderOrder = 2;
  root.add(guides);
  const va = new THREE.Vector3(); const vb = new THREE.Vector3();
  const inverse = new THREE.Matrix4();
  function updateGuides(p) {
    const opacity = 0.34 * smooth(0.06, 0.3, p);
    guides.visible = opacity > 0.002;
    if (!guides.visible) return;
    guideMaterial.opacity = opacity;
    inverse.copy(root.matrixWorld).invert();
    for (let i = 0; i < guided.length; i += 1) {
      const part = guided[i];
      const parent = part.node.parent;
      va.copy(part.rest).applyMatrix4(parent.matrixWorld).applyMatrix4(inverse);
      vb.copy(part.node.position).applyMatrix4(parent.matrixWorld).applyMatrix4(inverse);
      guidePositions.set([va.x, va.y, va.z, vb.x, vb.y, vb.z], i * 6);
      guideDistances[i * 2 + 1] = va.distanceTo(vb);
    }
    guideGeometry.attributes.position.needsUpdate = true;
    guideGeometry.attributes.lineDistance.needsUpdate = true;
  }

  // ---- the running machine ---------------------------------------------------------------------
  function animate({ theta, omega, time, delta, p, still }) {
    drive.update(theta);
    wings.update(theta, still ? 0 : omega);
    head.update(delta, p, still);
    abdomen.update(time, p, still);
    legs.update(time, p, still);
    // Hover: a slow drift with a small heave on every beat, fading out as the machine opens.
    const live = still ? 0 : 1 - smooth(0.0, 0.14, p);
    root.position.y = live * (0.1 * Math.sin(time * 0.9) + 0.035 * Math.sin(theta + 0.9));
    root.position.x = live * 0.05 * Math.sin(time * 0.53 + 1);
    body.rotation.z = live * (0.018 * Math.sin(time * 0.7 + 0.4) + 0.006 * Math.sin(theta));
    body.rotation.x = live * 0.02 * Math.sin(time * 0.61);
    drive.glow.intensity = 0.9 + 0.12 * Math.sin(time * 2.1);
  }

  // ---- framing: how big the whole thing is at each stage of opening ---------------------------
  const frames = [];
  const box = new THREE.Box3();
  function measure() {
    for (const p of SAMPLES) {
      setProgress(p);
      animate({ theta: 0, omega: 0, time: 0, delta: 0, p, still: true });
      root.updateMatrixWorld(true);
      box.setFromObject(body);
      const size = box.getSize(new THREE.Vector3());
      frames.push({ p, centre: box.getCenter(new THREE.Vector3()), radius: Math.max(size.x, size.y, size.z) / 2, low: box.min.y });
    }
    setProgress(0);
  }
  const frameCentre = new THREE.Vector3();
  function frameAt(p) {
    let i = 1;
    while (i < frames.length - 1 && frames[i].p < p) i += 1;
    const a = frames[i - 1]; const b = frames[i];
    const t = Math.min(1, Math.max(0, (p - a.p) / (b.p - a.p)));
    return { centre: frameCentre.copy(a.centre).lerp(b.centre, t), radius: lerp(a.radius, b.radius, t), low: lerp(a.low, b.low, t) };
  }

  /** World-space bounds of a component's anchor, for focusing and labelling. */
  const focusBox = new THREE.Box3();
  function boundsOf(id, sphere) {
    const comp = comps.get(id);
    if (!comp) return null;
    if (comp.anchor) focusBox.setFromObject(comp.anchor);
    else { focusBox.makeEmpty(); for (const mesh of comp.meshes) focusBox.expandByObject(mesh); }
    return focusBox.getBoundingSphere(sphere);
  }

  return { root, body, comps, parts: ctx.parts, setProgress, updateGuides, animate, measure, frameAt, boundsOf };
}
