import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export interface SceneState {
  progress: number;
  time: number;
  delta: number;
  reduced: boolean;
  active: boolean;
  gate: number;
  spread: number;
  power: number;
  exposure: number;
  quality: number;
}

export interface ExhibitModel {
  group: THREE.Group;
  update: (state: SceneState) => void;
  anchors: Record<string, THREE.Vector3>;
  dispose?: () => void;
}

export const palette = {
  silicon: 0x606c76, silver: 0xb9c5cd, dark: 0x1b252b,
  copper: 0xb98960, gold: 0xd8b78a, oxide: 0x8395a0,
  violet: 0xc3a8ee, signal: 0xb5ded1, warm: 0xe3a271,
};

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export function metal(color: THREE.ColorRepresentation = palette.silver, roughness = .27, metalness = .88) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, envMapIntensity: 1.25 });
}

export function block(w: number, h: number, d: number, material: THREE.Material, radius = .035) {
  const geometry = radius > 0
    ? new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, h / 3, w / 3, d / 3))
    : new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

export function line(points: THREE.Vector3[], color: THREE.ColorRepresentation, opacity = 1) {
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({color, transparent: opacity < 1, opacity}));
}

export function pipe(points: THREE.Vector3[], radius: number, material: THREE.Material) {
  const path = new THREE.CurvePath<THREE.Vector3>();
  for (let i = 1; i < points.length; i++) path.add(new THREE.LineCurve3(points[i - 1], points[i]));
  return new THREE.Mesh(new THREE.TubeGeometry(path, Math.max(8, points.length * 3), radius, 6, false), material);
}

export function seededRandom(seed = 42) {
  return () => { seed = (Math.imul(1664525, seed) + 1013904223) | 0; return (seed >>> 0) / 4294967296; };
}

/** A deterministic authored circuit surface. Text is not baked into runtime UI. */
export function circuitTexture(size = 1024, seed = 23, copper = false): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const rand = seededRandom(seed);
  ctx.fillStyle = copper ? '#141d20' : '#434c52';
  ctx.fillRect(0, 0, size, size);
  const unit = size / 32;
  ctx.lineWidth = size / 1600;
  for (let i = 0; i < 190; i++) {
    const x = Math.floor(rand() * 30 + 1) * unit;
    const y = Math.floor(rand() * 30 + 1) * unit;
    const width = unit * (1 + Math.floor(rand() * 6));
    const height = unit * (1 + Math.floor(rand() * 4));
    ctx.strokeStyle = copper ? `rgba(190,143,97,${.25 + rand() * .5})` : `rgba(190,203,211,${.12 + rand() * .3})`;
    ctx.strokeRect(x + 3, y + 3, width - 6, height - 6);
    const step = size / 220;
    for (let n = 1; n < 5 + rand() * 12; n++) {
      ctx.beginPath(); ctx.moveTo(x + n * step, y + 5);
      ctx.lineTo(x + n * step, y + height * .4);
      ctx.lineTo(x + width * .5, y + height * .4 + n * step);
      ctx.lineTo(x + width - 4, y + height * .4 + n * step); ctx.stroke();
    }
  }
  ctx.strokeStyle = copper ? '#c1996c' : '#9aabb2';
  ctx.lineWidth = size / 950;
  ctx.strokeRect(size * .018, size * .018, size * .964, size * .964);
  for (let i = 0; i < 36; i++) {
    const d = size * (.03 + i * .026);
    ctx.fillStyle = copper ? '#997954' : '#7f8990';
    ctx.fillRect(d, size * .006, size * .014, size * .006);
    ctx.fillRect(d, size * .988, size * .014, size * .006);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function disposeTree(root: THREE.Object3D) {
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse(object => {
    const mesh = object as THREE.Mesh;
    mesh.geometry?.dispose();
    if (mesh.material) for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) materials.add(m);
  });
  for (const material of materials) {
    for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    material.dispose();
  }
  for (const texture of textures) texture.dispose();
}
