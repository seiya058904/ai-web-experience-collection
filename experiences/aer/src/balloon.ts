import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** One reusable physical identity, shared by all chapters and every route. */
export const BALLOON_IDENTITY = Object.freeze({
  gores: 16,
  envelopeHeight: 24,
  envelopeWidth: 20.8,
  mouthHeight: 4.9,
  basketWidth: 2.2,
  basketDepth: 1.5,
  basketHeight: 1.08,
  suspensionPoints: 4,
  crown: '#485570',
});

const profile: readonly [number, number][] = [
  [0, 1.42], [0.08, 2.55], [0.19, 4.45], [0.33, 6.85],
  [0.47, 8.85], [0.60, 10.14], [0.70, 10.4], [0.79, 9.85],
  [0.87, 8.36], [0.93, 6.10], [0.975, 3.10], [1, 0.08],
];

/** Monotone cubic Hermite interpolation avoids an overhanging pear silhouette. */
export function envelopeRadius(t: number): number {
  const u = Math.max(0, Math.min(1, t));
  let i = 0;
  while (i < profile.length - 2 && u > profile[i + 1]![0]) i += 1;
  const [x1, y1] = profile[i]!;
  const [x2, y2] = profile[i + 1]!;
  const before = profile[Math.max(0, i - 1)]!;
  const after = profile[Math.min(profile.length - 1, i + 2)]!;
  const dx = x2 - x1;
  const secant = (y2 - y1) / dx;
  let m1 = i === 0 ? secant : (y2 - before[1]) / (x2 - before[0]);
  let m2 = i === profile.length - 2 ? secant : (after[1] - y1) / (after[0] - x1);
  if (secant === 0) { m1 = 0; m2 = 0; }
  else {
    if (m1 * secant < 0) m1 = 0;
    if (m2 * secant < 0) m2 = 0;
    const s = (m1 / secant) ** 2 + (m2 / secant) ** 2;
    if (s > 9) { const scale = 3 / Math.sqrt(s); m1 *= scale; m2 *= scale; }
  }
  const f = (u - x1) / dx;
  return (2 * f ** 3 - 3 * f ** 2 + 1) * y1
    + (f ** 3 - 2 * f ** 2 + f) * dx * m1
    + (-2 * f ** 3 + 3 * f ** 2) * y2
    + (f ** 3 - f ** 2) * dx * m2;
}

function clothTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d')!;
  const pixels = context.createImageData(256, 256);
  let seed = 3718;
  for (let y = 0; y < 256; y += 1) {
    for (let x = 0; x < 256; x += 1) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const weave = (x % 4 === 0 ? -6 : 0) + (y % 3 === 0 ? 5 : 0);
      const shade = 132 + weave + (seed / 4294967296 - 0.5) * 18;
      const k = (y * 256 + x) * 4;
      pixels.data[k] = pixels.data[k + 1] = pixels.data[k + 2] = shade;
      pixels.data[k + 3] = 255;
    }
  }
  context.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.5, 4);
  return texture;
}

function wickerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#b47b42';
  ctx.fillRect(0, 0, 256, 128);
  for (let row = 0; row < 16; row += 1) {
    ctx.fillStyle = row % 2 ? '#c58b4e' : '#b98246';
    ctx.fillRect(0, row * 8, 256, 6);
    ctx.fillStyle = '#82592f';
    ctx.fillRect(0, row * 8 + 6, 256, 1);
    for (let col = -1; col < 18; col += 1) {
      const x = col * 16 + (row % 2) * 8;
      ctx.fillStyle = '#9d6b39';
      ctx.fillRect(x, row * 8, 2, 6);
      ctx.fillStyle = '#d19b5d';
      ctx.fillRect(x + 3, row * 8 + 1, 12, 1);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.1, 0.95);
  texture.anisotropy = 4;
  return texture;
}

function goreGeometry(index: number, from = 0, to = 1): THREE.BufferGeometry {
  const vertical = 64;
  const horizontal = 8;
  const vertices: number[] = [];
  const uv: number[] = [];
  const indices: number[] = [];
  for (let j = 0; j <= vertical; j += 1) {
    const t = from + (to - from) * (j / vertical);
    const radius = envelopeRadius(t);
    for (let i = 0; i <= horizontal; i += 1) {
      const f = i / horizontal;
      const angle = ((index + f) / BALLOON_IDENTITY.gores) * Math.PI * 2;
      // Taut gores are very slightly fuller between the sewn load tapes.
      const rib = 1 + Math.sin(f * Math.PI) * Math.sin(t * Math.PI) * 0.009;
      const r = radius * rib;
      vertices.push(Math.sin(angle) * r, BALLOON_IDENTITY.mouthHeight + t * 24, Math.cos(angle) * r);
      uv.push(f, t);
      if (j < vertical && i < horizontal) {
        const a = j * (horizontal + 1) + i;
        const b = a + horizontal + 1;
        indices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function tubeBetween(points: THREE.Vector3[], radius: number, material: THREE.Material, segments = 24): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, segments, radius, 5, false), material);
}

function roundedRectangle(halfWidth: number, halfDepth: number, radius: number): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-halfWidth + radius, -halfDepth);
  s.lineTo(halfWidth - radius, -halfDepth);
  s.quadraticCurveTo(halfWidth, -halfDepth, halfWidth, -halfDepth + radius);
  s.lineTo(halfWidth, halfDepth - radius);
  s.quadraticCurveTo(halfWidth, halfDepth, halfWidth - radius, halfDepth);
  s.lineTo(-halfWidth + radius, halfDepth);
  s.quadraticCurveTo(-halfWidth, halfDepth, -halfWidth, halfDepth - radius);
  s.lineTo(-halfWidth, -halfDepth + radius);
  s.quadraticCurveTo(-halfWidth, -halfDepth, -halfWidth + radius, -halfDepth);
  return s;
}

export interface BalloonModel {
  group: THREE.Group;
  envelope: THREE.Group;
  basket: THREE.Group;
  setResting(resting: boolean): void;
}

export function createBalloon(): BalloonModel {
  const group = new THREE.Group();
  group.name = 'AER — one balloon, sixteen gores, four connections';
  const envelope = new THREE.Group();
  envelope.name = 'Envelope';
  const cloth = clothTexture();
  const cream = new THREE.MeshStandardMaterial({ color: '#F6F1E8', roughness: 0.94, metalness: 0, bumpMap: cloth, bumpScale: 0.018, side: THREE.DoubleSide });
  const apricot = new THREE.MeshStandardMaterial({ color: '#EAB7A1', roughness: 0.94, metalness: 0, bumpMap: cloth, bumpScale: 0.018, side: THREE.DoubleSide });
  const navy = new THREE.MeshStandardMaterial({ color: BALLOON_IDENTITY.crown, roughness: 0.97, bumpMap: cloth, bumpScale: 0.013, side: THREE.DoubleSide });
  const seamMaterial = new THREE.LineBasicMaterial({ color: '#B99E89', transparent: true, opacity: 0.35 });
  const creamParts: THREE.BufferGeometry[] = [];
  const apricotParts: THREE.BufferGeometry[] = [];
  const capParts: THREE.BufferGeometry[] = [];
  const seams: THREE.Vector3[] = [];
  for (let i = 0; i < BALLOON_IDENTITY.gores; i += 1) {
    (i % 2 === 0 ? creamParts : apricotParts).push(goreGeometry(i));
    const angle = (i / 16) * Math.PI * 2;
    const points = Array.from({ length: 65 }, (_, j) => {
      const t = j / 64;
      const r = envelopeRadius(t) + 0.012;
      return new THREE.Vector3(Math.sin(angle) * r, BALLOON_IDENTITY.mouthHeight + t * 24, Math.cos(angle) * r);
    });
    for (let j = 1; j < points.length; j += 1) seams.push(points[j - 1]!, points[j]!);
    const cap = goreGeometry(i, 0.979, 1);
    cap.scale(1.005, 1, 1.005);
    cap.translate(0, 0.012, 0);
    capParts.push(cap);
  }
  for (const [parts, material] of [[creamParts, cream], [apricotParts, apricot], [capParts, navy]] as const) {
    envelope.add(new THREE.Mesh(mergeGeometries(parts)!, material));
    for (const geometry of parts) geometry.dispose();
  }
  envelope.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(seams), seamMaterial));

  const ropeMaterial = new THREE.MeshStandardMaterial({ color: '#8C704F', roughness: 1 });
  const rimMaterial = new THREE.MeshStandardMaterial({ color: '#B7844D', roughness: 0.9 });
  const metal = new THREE.MeshStandardMaterial({ color: '#5A5E5C', roughness: 0.68, metalness: 0.4 });
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.05, 6, 48), rimMaterial);
  mouth.rotation.x = Math.PI / 2;
  mouth.position.y = BALLOON_IDENTITY.mouthHeight;
  envelope.add(mouth);
  group.add(envelope);

  const basket = new THREE.Group();
  basket.name = 'Deep honey wicker basket';
  const wicker = wickerTexture();
  const wickerMaterial = new THREE.MeshStandardMaterial({ color: '#D3B18A', map: wicker, bumpMap: wicker, bumpScale: 0.035, roughness: 1 });
  const wall = roundedRectangle(1.1, 0.75, 0.25);
  const hole = roundedRectangle(0.98, 0.63, 0.21);
  wall.holes.push(new THREE.Path(hole.getPoints(16).reverse()));
  const wallGeometry = new THREE.ExtrudeGeometry(wall, { depth: 1.02, bevelEnabled: false, curveSegments: 5 });
  wallGeometry.rotateX(-Math.PI / 2);
  const walls = new THREE.Mesh(wallGeometry, wickerMaterial);
  basket.add(walls);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(2.03, 0.12, 1.32), wickerMaterial);
  floor.position.y = 0.06;
  basket.add(floor);
  const rimPath = roundedRectangle(1.1, 0.75, 0.25).getPoints(16).map(p => new THREE.Vector3(p.x, 1.06, p.y));
  rimPath.push(rimPath[0]!.clone());
  basket.add(tubeBetween(rimPath, 0.085, rimMaterial, 64));
  for (const side of [-1, 1]) {
    for (const depth of [-1, 1]) {
      const start = new THREE.Vector3(side * 0.9, 1.04, depth * 0.55);
      const end = new THREE.Vector3(side * 1.03, BALLOON_IDENTITY.mouthHeight, depth * 0.96);
      basket.add(tubeBetween([start, start.clone().lerp(end, 0.48), end], 0.025, ropeMaterial, 12));
      const guard = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 1.38, 5), metal);
      guard.position.set(side * 0.8, 1.76, depth * 0.51);
      basket.add(guard);
    }
  }
  const heaterFrame = new THREE.Mesh(new THREE.BoxGeometry(1.63, 0.055, 1.06), metal);
  heaterFrame.position.y = 2.44;
  basket.add(heaterFrame);
  const heater = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.24, 0.5), metal);
  heater.position.y = 2.6;
  basket.add(heater);
  group.add(basket);

  // A deliberate second preset, never a timed rubber inflation morph.
  // The load tapes, colors and four suspension points remain the same identity.
  let isResting = false;
  return {
    group,
    envelope,
    basket,
    setResting(resting: boolean) {
      if (resting === isResting) return;
      isResting = resting;
      // Keep the mouth's X/Z coordinates unchanged: all four rigging ends
      // still meet their original attachment points in both static presets.
      // Only the envelope's vertical extent changes around that fixed mouth.
      envelope.scale.set(1, resting ? 0.64 : 1, 1);
      envelope.position.y = resting ? BALLOON_IDENTITY.mouthHeight * (1 - 0.64) : 0;
    },
  };
}

export function createPerson(coat = '#645F53'): THREE.Group {
  const person = new THREE.Group();
  const clothing = new THREE.MeshStandardMaterial({ color: coat, roughness: 1 });
  const trousers = new THREE.MeshStandardMaterial({ color: '#555B5A', roughness: 1 });
  const skin = new THREE.MeshStandardMaterial({ color: '#BA9C80', roughness: 1 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.4, 2, 5), clothing);
  torso.position.y = 1.1;
  person.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), skin);
  head.position.y = 1.6;
  person.add(head);
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.67, 5), trousers);
    leg.position.set(side * 0.105, 0.35, 0);
    person.add(leg);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.52, 5), clothing);
    arm.position.set(side * 0.24, 1.06, -0.015);
    arm.rotation.z = side * 0.12;
    person.add(arm);
  }
  return person;
}
