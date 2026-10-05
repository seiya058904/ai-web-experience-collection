import * as THREE from 'three';

export interface WatchMaterials {
  titanium: THREE.MeshPhysicalMaterial;
  plate: THREE.MeshPhysicalMaterial;
  silver: THREE.MeshPhysicalMaterial;
  polished: THREE.MeshPhysicalMaterial;
  darkSteel: THREE.MeshPhysicalMaterial;
  brass: THREE.MeshPhysicalMaterial;
  brassEdge: THREE.MeshPhysicalMaterial;
  spring: THREE.MeshPhysicalMaterial;
  blue: THREE.MeshPhysicalMaterial;
  ruby: THREE.MeshPhysicalMaterial;
  dial: THREE.MeshPhysicalMaterial;
  strap: THREE.MeshStandardMaterial;
  stitch: THREE.MeshStandardMaterial;
  glass: THREE.MeshPhysicalMaterial;
  line: THREE.LineBasicMaterial;
  textures: THREE.Texture[];
}

/** Small deterministic surface maps; no downloaded texture or baked mechanism. */
export function createWatchMaterials(): WatchMaterials {
  const textures: THREE.Texture[] = [];
  let seed = 1719;
  const noise = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const brushedCanvas = document.createElement('canvas');
  brushedCanvas.width = 512; brushedCanvas.height = 512;
  const ctx = brushedCanvas.getContext('2d')!;
  const pixels = ctx.createImageData(512, 512);
  for (let y = 0; y < 512; y++) {
    const stripe = 202 + Math.sin(y * 1.8) * 14 + (noise() - .5) * 27;
    for (let x = 0; x < 512; x++) {
      const n = stripe + (noise() - .5) * 13 + Math.sin(x * .038 + y * .031) * 3;
      const p = (y * 512 + x) * 4;
      pixels.data[p] = n; pixels.data[p + 1] = n; pixels.data[p + 2] = n;
      pixels.data[p + 3] = 255;
    }
  }
  ctx.putImageData(pixels, 0, 0);
  const brushed = new THREE.CanvasTexture(brushedCanvas);
  brushed.wrapS = brushed.wrapT = THREE.RepeatWrapping;
  brushed.repeat.set(.75, 1.6);
  brushed.anisotropy = 4;
  textures.push(brushed);

  const stripedCanvas = document.createElement('canvas');
  stripedCanvas.width = 512; stripedCanvas.height = 512;
  const sctx = stripedCanvas.getContext('2d')!;
  sctx.fillStyle = '#bdbdbd'; sctx.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y++) {
    const band = ((y % 92) / 92);
    const value = Math.round(166 + 43 * Math.sin(band * Math.PI) + (noise() - .5) * 21);
    sctx.fillStyle = `rgb(${value},${value},${value})`;
    sctx.fillRect(0, y, 512, 1);
  }
  for (let i = 0; i < 460; i++) {
    sctx.strokeStyle = `rgba(255,255,255,${.025 + noise() * .045})`;
    sctx.lineWidth = .4;
    sctx.beginPath();
    const y = noise() * 512;
    sctx.moveTo(0, y); sctx.lineTo(512, y + noise() * 1.5); sctx.stroke();
  }
  const striped = new THREE.CanvasTexture(stripedCanvas);
  striped.wrapS = striped.wrapT = THREE.RepeatWrapping;
  striped.repeat.set(.6, 1.0); striped.anisotropy = 4;
  textures.push(striped);

  const perlageCanvas = document.createElement('canvas');
  perlageCanvas.width = 512; perlageCanvas.height = 512;
  const pctx = perlageCanvas.getContext('2d')!;
  pctx.fillStyle = '#c2c2c2'; pctx.fillRect(0, 0, 512, 512);
  for (let row = -1; row < 15; row++) for (let col = -1; col < 15; col++) {
    const x = col * 42 + (row % 2) * 21, y = row * 38;
    pctx.fillStyle = '#bdbdbd'; pctx.beginPath(); pctx.arc(x, y, 31, 0, Math.PI * 2); pctx.fill();
    for (let r = 2; r < 31; r += 1.75) {
      const shade = Math.round(178 + noise() * 38);
      pctx.strokeStyle = `rgba(${shade},${shade},${shade},.5)`;
      pctx.lineWidth = .7; pctx.beginPath(); pctx.arc(x, y, r, 0, Math.PI * 2); pctx.stroke();
    }
  }
  const perlage = new THREE.CanvasTexture(perlageCanvas);
  perlage.wrapS = perlage.wrapT = THREE.RepeatWrapping;
  perlage.repeat.set(.7, .7); perlage.anisotropy = 4; textures.push(perlage);

  const leatherCanvas = document.createElement('canvas');
  leatherCanvas.width = 256; leatherCanvas.height = 256;
  const lctx = leatherCanvas.getContext('2d')!;
  lctx.fillStyle = '#55524e'; lctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4500; i++) {
    const shade = Math.round(54 + noise() * 70);
    lctx.strokeStyle = `rgba(${shade},${shade},${shade},.45)`;
    lctx.lineWidth = .7 + noise();
    const x = noise() * 256, y = noise() * 256;
    lctx.beginPath(); lctx.moveTo(x, y); lctx.lineTo(x + noise() * 5, y + noise() * 3); lctx.stroke();
  }
  const leather = new THREE.CanvasTexture(leatherCanvas);
  leather.wrapS = leather.wrapT = THREE.RepeatWrapping;
  leather.repeat.set(3, 5); leather.anisotropy = 4;
  textures.push(leather);

  const titanium = new THREE.MeshPhysicalMaterial({ color: 0x454b46, metalness: 1, roughness: .47,
    roughnessMap: brushed, bumpMap: brushed, bumpScale: .010, envMapIntensity: 1.0, clearcoat: .08 });
  const plate = new THREE.MeshPhysicalMaterial({ color: 0x626b61, metalness: 1, roughness: .62,
    map: perlage, roughnessMap: perlage, bumpMap: perlage, bumpScale: .0025,
    envMapIntensity: .95 });
  const silver = new THREE.MeshPhysicalMaterial({ color: 0x9fa69e, metalness: 1, roughness: .43, map: striped,
    roughnessMap: striped, bumpMap: brushed, bumpScale: .008, envMapIntensity: 1.10,
    anisotropy: .7, anisotropyRotation: Math.PI / 2 });
  const polished = new THREE.MeshPhysicalMaterial({ color: 0xcbd0c7, metalness: 1, roughness: .115,
    envMapIntensity: 1.05, clearcoat: .4, clearcoatRoughness: .08 });
  const darkSteel = new THREE.MeshPhysicalMaterial({ color: 0x202721, metalness: 1, roughness: .38,
    roughnessMap: brushed, bumpMap: brushed, bumpScale: .003, envMapIntensity: .75 });
  const brass = new THREE.MeshPhysicalMaterial({ color: 0xae9159, metalness: 1, roughness: .37, map: brushed,
    roughnessMap: brushed, bumpMap: brushed, bumpScale: .0065, envMapIntensity: 1.20,
    anisotropy: .5, anisotropyRotation: Math.PI / 3 });
  const brassEdge = new THREE.MeshPhysicalMaterial({ color: 0xc6af7c, metalness: 1, roughness: .17,
    envMapIntensity: 1.05, clearcoat: .18 });
  const spring = new THREE.MeshPhysicalMaterial({ color: 0x8a928b, metalness: 1, roughness: .34,
    roughnessMap: brushed, bumpMap: brushed, bumpScale: .004, envMapIntensity: 1.2, side: THREE.DoubleSide });
  const blue = new THREE.MeshPhysicalMaterial({ color: 0x0d2c3d, metalness: .98, roughness: .19,
    clearcoat: .25, clearcoatRoughness: .11, envMapIntensity: 1.1 });
  const ruby = new THREE.MeshPhysicalMaterial({ color: 0x4e0820, metalness: .12, roughness: .12,
    clearcoat: 1, clearcoatRoughness: .045, envMapIntensity: 1.6, ior: 1.77,
    emissive: 0x19020a, emissiveIntensity: .06 });
  const dial = new THREE.MeshPhysicalMaterial({ color: 0x10120f, metalness: .76, roughness: .44,
    roughnessMap: brushed, bumpMap: brushed, bumpScale: .002, envMapIntensity: .7 });
  const strap = new THREE.MeshStandardMaterial({ color: 0x151412, roughness: .85, metalness: .05,
    bumpMap: leather, bumpScale: .032, roughnessMap: leather });
  const stitch = new THREE.MeshStandardMaterial({ color: 0x625a4b, roughness: .91, metalness: 0 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xf6fcff, metalness: .02, roughness: .025,
    transparent: true, opacity: .035, depthWrite: false, clearcoat: 1,
    clearcoatRoughness: .02, envMapIntensity: .12, side: THREE.DoubleSide });
  const line = new THREE.LineBasicMaterial({ color: 0x8a877b, transparent: true, opacity: .16,
    depthTest: true, depthWrite: false });
  return { titanium, plate, silver, polished, darkSteel, brass, brassEdge, spring, blue, ruby,
    dial, strap, stitch, glass, line, textures };
}

export function labelTexture(text: string, options: { color?: string; serif?: boolean; tracking?: number } = {}): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 1024, 128);
  ctx.fillStyle = options.color ?? '#b9b5a5';
  ctx.font = `${options.serif ? '400' : '500'} 58px ${options.serif ? 'Georgia, serif' : 'Arial, sans-serif'}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const tracking = options.tracking ?? 9;
  const chars = Array.from(text);
  const widths = chars.map(c => ctx.measureText(c).width);
  const total = widths.reduce((sum, n) => sum + n, 0) + tracking * (chars.length - 1);
  let x = (1024 - total) / 2;
  chars.forEach((char, i) => { ctx.fillText(char, x + widths[i] / 2, 66); x += widths[i] + tracking; });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4;
  return texture;
}
