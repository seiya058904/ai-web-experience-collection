import * as THREE from 'three';

/** Seeded, object-space surfaces. Nothing is randomized during a frame. */
function random(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223 | 0;
    return (s >>> 0) / 4294967296;
  };
}

function canvas(width: number, height: number) {
  const value = document.createElement('canvas');
  value.width = width;
  value.height = height;
  const context = value.getContext('2d');
  if (!context) throw new Error('The material canvas is unavailable.');
  return { canvas: value, ctx: context };
}

function texture(source: HTMLCanvasElement, repeat = false) {
  const result = new THREE.CanvasTexture(source);
  result.colorSpace = THREE.SRGBColorSpace;
  result.anisotropy = 8;
  if (repeat) result.wrapS = result.wrapT = THREE.RepeatWrapping;
  return result;
}

export function woodTexture(kind: 'paint' | 'ear' | 'blue' | 'wood' | 'new' | 'table'): THREE.CanvasTexture {
  const { canvas: source, ctx } = canvas(1024, 512);
  const rng = random({ paint: 739, ear: 183, blue: 510, wood: 208, new: 208, table: 993 }[kind]);
  const bases: Record<typeof kind, [number, number, number]> = {
    paint: [224, 193, 121], ear: [156, 77, 48], blue: [66, 100, 127],
    wood: [173, 125, 74], new: [213, 179, 126], table: [218, 196, 164],
  };
  const base = bases[kind];
  const pixels = ctx.createImageData(1024, 512);
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 1024; x++) {
      const f = Math.sin(y * .48 + Math.sin(x * .009) * 2.2) * 2.5
        + Math.sin(y * .083 + Math.sin(x * .0028) * 4) * 3.5
        + (rng() - .5) * 10;
      const i = (y * 1024 + x) * 4;
      pixels.data[i] = base[0] + f;
      pixels.data[i + 1] = base[1] + f;
      pixels.data[i + 2] = base[2] + f * .7;
      pixels.data[i + 3] = 255;
    }
  }
  ctx.putImageData(pixels, 0, 0);
  const painted = ['paint', 'blue', 'ear'].includes(kind);
  for (let i = 0; i < (painted ? 720 : 360); i++) {
    const x = rng() * 1024;
    const y = rng() * 512;
    const width = 3 + rng() * (painted ? 29 : 160);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + width * .3, y - 1.4, x + width * .7, y + 1.4, x + width, y - rng() * 1.3);
    ctx.lineWidth = .35 + rng() * 1.1;
    ctx.strokeStyle = painted ? `rgba(103,74,46,${.07 + rng() * .2})` : `rgba(100,65,33,${.035 + rng() * .12})`;
    ctx.stroke();
  }
  if (painted) {
    for (let i = 0; i < 240; i++) {
      const x = rng() * 1024;
      const y = rng() * 512;
      const r = 1.5 + rng() * 5;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(178,136,82,.63)' : 'rgba(124,91,56,.26)';
      ctx.beginPath();
      for (let j = 0; j < 7; j++) {
        const a = j / 7 * Math.PI * 2;
        const rr = r * (.55 + rng() * .6);
        const xx = x + Math.cos(a) * rr * 2;
        const yy = y + Math.sin(a) * rr * .5;
        if (j === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.closePath();
      ctx.fill();
    }
  }
  return texture(source, kind === 'table' || kind === 'wood' || kind === 'new');
}

export function wheelTexture(painted: boolean, fresh = false): THREE.CanvasTexture {
  const { canvas: source, ctx } = canvas(512, 512);
  const rng = random(painted ? 392 : 519);
  ctx.fillStyle = painted ? '#456a91' : fresh ? '#d8b987' : '#b18050';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 150; i++) {
    const y = rng() * 512;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(130, y + Math.sin(y) * 12, 350, y + Math.cos(y) * 10, 512, y - 8);
    ctx.strokeStyle = painted ? `rgba(48,64,73,${rng() * .18})` : `rgba(112,67,35,${rng() * (fresh ? .12 : .25)})`;
    ctx.lineWidth = .5 + rng() * 1.8;
    ctx.stroke();
  }
  for (let i = 0; i < 70; i++) {
    const radius = 12 + i * 3.6;
    ctx.beginPath();
    ctx.ellipse(254, 252, radius, radius * (.81 + Math.sin(i * .4) * .03), -.2, 0, Math.PI * 2);
    ctx.lineWidth = .45;
    ctx.strokeStyle = `rgba(96,66,43,${painted ? .035 : .08})`;
    ctx.stroke();
  }
  if (!fresh) {
    for (let i = 0; i < 280; i++) {
      const a = rng() * Math.PI * 2;
      const r = Math.sqrt(rng()) * 245;
      const x = 256 + Math.cos(a) * r;
      const y = 256 + Math.sin(a) * r;
      ctx.fillStyle = painted ? `rgba(188,151,98,${.2 + rng() * .65})` : 'rgba(87,59,38,.1)';
      ctx.beginPath();
      ctx.ellipse(x, y, 1 + rng() * 5, .4 + rng() * 1.3, rng() * .5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return texture(source);
}

export function clothTexture(): THREE.CanvasTexture {
  const { canvas: source, ctx } = canvas(256, 256);
  const rng = random(902);
  ctx.fillStyle = '#a9b7a2';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 256; i += 2) {
    ctx.strokeStyle = `rgba(70,84,65,${.03 + rng() * .15})`;
    ctx.lineWidth = .6;
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke();
    ctx.strokeStyle = `rgba(245,241,218,${.08 + rng() * .13})`;
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke();
  }
  const result = texture(source, true);
  result.repeat.set(8, 4);
  return result;
}

export function sunTexture(): THREE.CanvasTexture {
  const { canvas: source, ctx } = canvas(256, 256);
  const rng = random(813);
  ctx.translate(128, 128);
  ctx.rotate(-.1);
  ctx.fillStyle = '#c66c2b';
  ctx.beginPath();
  for (let i = 0; i < 70; i++) {
    const a = i / 70 * Math.PI * 2;
    const radius = 53 + Math.sin(i * 1.3) * 2 + rng() * 2;
    const x = Math.cos(a) * radius, y = Math.sin(a) * radius;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#c66c2b';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2 + rng() * .15;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 76, Math.sin(a) * 76);
    ctx.lineTo(Math.cos(a + .04) * (100 + rng() * 12), Math.sin(a + .04) * (100 + rng() * 12));
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = 'rgba(0,0,0,.22)';
  for (let i = 0; i < 140; i++) ctx.fillRect(rng() * 220 - 110, rng() * 220 - 110, 1 + rng() * 5, .5 + rng());
  return texture(source);
}

export function contactTexture(): THREE.CanvasTexture {
  const { canvas: source, ctx } = canvas(128, 128);
  const gradient = ctx.createRadialGradient(64, 64, 6, 64, 64, 63);
  gradient.addColorStop(0, 'rgba(47,35,25,.55)');
  gradient.addColorStop(.5, 'rgba(47,35,25,.19)');
  gradient.addColorStop(1, 'rgba(47,35,25,0)');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128);
  return texture(source);
}
