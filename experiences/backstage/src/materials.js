import * as THREE from 'three';

/**
 * Original, deterministic scenic painting. These textures are paint on real
 * surfaces, not photographs replacing scenery. No fetched assets or image
 * generation output is used as interactive geometry.
 */
function random(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function canvas(width, height = width) {
  const element = document.createElement('canvas');
  element.width = width;
  element.height = height;
  return { canvas: element, ctx: element.getContext('2d', { alpha: false }) };
}

function flecks(ctx, width, height, seed, count = 6000, alpha = .045) {
  const rnd = random(seed);
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = i % 2 ? `rgba(255,247,224,${rnd() * alpha})` : `rgba(22,35,32,${rnd() * alpha})`;
    ctx.fillRect(rnd() * width, rnd() * height, .4 + rnd() * 1.3, .5 + rnd() * 2.2);
  }
}

function paintTexture() {
  const { canvas: image, ctx } = canvas(512);
  const rnd = random(107);
  ctx.fillStyle = '#f3f0e9';
  ctx.fillRect(0, 0, 512, 512);
  // Sparse long brush filaments: visible at the wings, quiet from the audience.
  for (let i = 0; i < 370; i++) {
    const x = rnd() * 512, y = rnd() * 512;
    ctx.strokeStyle = i % 3 ? `rgba(65,57,39,${.015 + rnd() * .045})` : `rgba(255,255,247,${.08 + rnd() * .08})`;
    ctx.lineWidth = .4 + rnd() * 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + 2, y + 30, x - 1.5, y + 60, x + rnd() * 2, y + 75 + rnd() * 100);
    ctx.stroke();
  }
  flecks(ctx, 512, 512, 31, 9000, .055);
  return image;
}

function timberTexture() {
  const { canvas: image, ctx } = canvas(1024, 512);
  const rnd = random(827);
  ctx.fillStyle = '#e8e3da';
  ctx.fillRect(0, 0, 1024, 512);
  // Long grain, with local swells rather than an obvious repeated stripe tile.
  for (let i = 0; i < 310; i++) {
    const y = rnd() * 512, phase = rnd() * 6.28;
    ctx.beginPath();
    for (let x = -10; x <= 1034; x += 12) {
      const yy = y + Math.sin(x * .008 + phase) * (1.2 + rnd() * 1.6)
        + 7 * Math.sin(x * .002 + phase) * Math.exp(-Math.pow((x - 620) / 140, 2));
      x === -10 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
    }
    ctx.lineWidth = .2 + rnd() * .55;
    ctx.strokeStyle = i % 4 ? `rgba(92,65,42,${.015 + rnd() * .06})` : `rgba(255,253,239,${.035 + rnd() * .055})`;
    ctx.stroke();
  }
  // Two modest knots. The miniature is cared for, not distressed or rotten.
  for (const [x, y, scale] of [[280, 163, 1], [790, 393, .7]]) {
    for (let r = 3; r < 21; r += 2.7) {
      ctx.beginPath();
      ctx.ellipse(x, y, r * 2.2 * scale, r * .34 * scale, -.08, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(102,73,48,.065)';
      ctx.lineWidth = .5;
      ctx.stroke();
    }
  }
  flecks(ctx, 1024, 512, 89, 12500, .06);
  return image;
}

function clothTexture() {
  const { canvas: image, ctx } = canvas(256);
  ctx.fillStyle = '#eeeae1';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 256; i += 2) {
    ctx.fillStyle = i % 4 ? 'rgba(43,38,34,.032)' : 'rgba(255,255,249,.12)';
    ctx.fillRect(i, 0, 1, 256);
    ctx.fillStyle = 'rgba(43,38,34,.028)';
    ctx.fillRect(0, i, 256, 1);
  }
  flecks(ctx, 256, 256, 77, 2500, .035);
  return image;
}

function cloud(ctx, x, y, width, height, color, rnd) {
  // Broad, translucent scumbled paint. One joined irregular contour replaces
  // overlapping circles, whose edges read as cartoon bubbles at stage scale.
  const phase = rnd() * Math.PI * 2;
  ctx.save();
  ctx.globalAlpha = .48;
  ctx.filter = `blur(${Math.max(1, height * .055)}px)`;
  for (let layer = 0; layer < 3; layer++) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i <= 64; i++) {
      const t = i / 64;
      const envelope = Math.pow(Math.max(0, Math.sin(t * Math.PI)), .9);
      const loft = envelope * (.42 + .12 * Math.sin(t * 17 + phase) + .06 * Math.sin(t * 43));
      const px = x + t * width, py = y - loft * height + layer * height * .075;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    for (let i = 64; i >= 0; i--) {
      const t = i / 64;
      ctx.lineTo(x + t * width, y + Math.sin(t * Math.PI) * height * (.12 + layer * .025));
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.filter = 'none';
  ctx.globalAlpha = .16;
  for (let i = 0; i < 35; i++) {
    const t = .1 + rnd() * .8;
    const px = x + t * width, py = y - Math.sin(t * Math.PI) * height * rnd() * .27;
    ctx.strokeStyle = color;
    ctx.lineWidth = .35 + rnd() * .75;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.quadraticCurveTo(px + width * .035, py - 1, px + width * (.04 + rnd() * .075), py + 1);
    ctx.stroke();
  }
  ctx.restore();
}

function skyTexture(isNight = false) {
  const { canvas: image, ctx } = canvas(1024, 512);
  const rnd = random(isNight ? 902 : 118);
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, isNight ? '#142C46' : '#88a6ab');
  grad.addColorStop(.7, isNight ? '#233d54' : '#bfc9bf');
  grad.addColorStop(1, isNight ? '#375064' : '#e7d8b7');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);
  for (const [x, y, w, h] of [[-70, 111, 360, 93], [410, 70, 470, 78], [720, 240, 330, 85], [85, 330, 480, 70]]) {
    cloud(ctx, x, y, w, h, isNight ? 'rgba(116,139,154,.055)' : 'rgba(244,231,204,.25)', rnd);
    cloud(ctx, x + 13, y + 14, w * .92, h * .65, isNight ? 'rgba(12,32,50,.08)' : 'rgba(241,228,203,.17)', rnd);
  }
  // Brush grain remains subtle enough that the moon and lantern lead.
  flecks(ctx, 1024, 512, isNight ? 401 : 603, 19000, isNight ? .045 : .05);
  return image;
}

function coastTexture() {
  const { canvas: image, ctx } = canvas(512, 768);
  const rnd = random(430);
  const gradient = ctx.createLinearGradient(0, 0, 0, 768);
  gradient.addColorStop(0, '#94afb1');
  gradient.addColorStop(.56, '#d4d5bf');
  gradient.addColorStop(.57, '#759da3');
  gradient.addColorStop(1, '#31646e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 768);
  cloud(ctx, -70, 146, 470, 100, 'rgba(242,230,201,.36)', rnd);
  cloud(ctx, 190, 76, 300, 71, 'rgba(242,230,201,.25)', rnd);
  // The shallow headland is a painting; its flatness is meant to be revealed.
  const ridge = [[0, 430], [80, 409], [153, 359], [208, 373], [259, 312], [313, 334], [365, 241], [421, 213], [470, 248], [512, 233]];
  ctx.beginPath();
  ridge.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.lineTo(512, 666); ctx.lineTo(0, 476); ctx.closePath();
  ctx.fillStyle = '#617c79'; ctx.fill();
  ctx.save(); ctx.clip();
  for (let i = 0; i < 320; i++) {
    const x = rnd() * 512, y = 200 + rnd() * 470;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x - 16 + rnd() * 24, y + 45 + rnd() * 95);
    ctx.lineWidth = 1 + rnd() * 8;
    ctx.strokeStyle = i % 3 ? `rgba(213,204,166,${.04 + rnd() * .2})` : `rgba(31,70,71,${.05 + rnd() * .19})`;
    ctx.stroke();
  }
  ctx.restore();
  for (let i = 0; i < 120; i++) {
    const x = rnd() * 512, y = 470 + rnd() * 298;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 7 + rnd() * 46, y - 1 + rnd() * 2);
    ctx.strokeStyle = `rgba(233,223,191,${.06 + rnd() * .23})`;
    ctx.lineWidth = .5 + rnd() * 1.3; ctx.stroke();
  }
  flecks(ctx, 512, 768, 95, 14000, .08);
  return image;
}

function moonTexture() {
  const { canvas: image, ctx } = canvas(512);
  const rnd = random(212);
  ctx.fillStyle = '#f6dfaa';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 95; i++) {
    const x = rnd() * 512, y = rnd() * 512, radius = 6 + rnd() * 39;
    const shade = ctx.createRadialGradient(x, y, 0, x, y, radius);
    shade.addColorStop(0, `rgba(125,123,93,${.045 + rnd() * .13})`);
    shade.addColorStop(.72, 'rgba(138,131,102,.07)');
    shade.addColorStop(1, 'rgba(138,131,102,0)');
    ctx.fillStyle = shade;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  flecks(ctx, 512, 512, 115, 8000, .035);
  return image;
}

function waveTexture() {
  const { canvas: image, ctx } = canvas(1024, 256);
  const rnd = random(731);
  ctx.fillStyle = '#e6ebdf';
  ctx.fillRect(0, 0, 1024, 256);
  for (let row = 0; row < 9; row++) {
    ctx.beginPath();
    for (let x = -20; x <= 1044; x += 5) {
      const y = row * 31 + 14 * Math.sin(x * .024 + row * .38);
      x === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = row % 3 ? 'rgba(255,247,210,.32)' : 'rgba(52,87,83,.12)';
    ctx.lineWidth = row % 3 ? .8 : 2;
    ctx.stroke();
  }
  for (let i = 0; i < 230; i++) {
    const x = rnd() * 1024, y = rnd() * 256;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 13, y - 2, x + 28 + rnd() * 31, y + 1);
    ctx.strokeStyle = `rgba(255,248,216,${.07 + rnd() * .2})`; ctx.lineWidth = .5 + rnd(); ctx.stroke();
  }
  flecks(ctx, 1024, 256, 113, 12000, .1);
  return image;
}

/** All returned materials are independently mutable; maps are intentionally shared. */
export function createMaterials() {
  const textures = new Set();
  const materials = new Set();
  const makeTexture = (source, name, repeat = false) => {
    const texture = new THREE.CanvasTexture(source);
    texture.name = name;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    if (repeat) texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.userData.provenance = 'Original deterministic canvas painting for BACKSTAGE';
    textures.add(texture);
    return texture;
  };
  const paint = makeTexture(paintTexture(), 'fine matte brushwork', true);
  const wood = makeTexture(timberTexture(), 'long timber grain', true);
  const cloth = makeTexture(clothTexture(), 'fine woven cloth', true);
  const coast = makeTexture(coastTexture(), 'painted coastal headland');
  const sky = makeTexture(skyTexture(), 'painted daylight sky');
  const night = makeTexture(skyTexture(true), 'painted night sky');
  const moon = makeTexture(moonTexture(), 'painted flat moon disc');
  const wave = makeTexture(waveTexture(), 'brushpainted sea board', true);
  const standard = (name, color, map = paint, options = {}) => {
    const material = new THREE.MeshStandardMaterial({ color, map, roughness: .93, metalness: 0, ...options });
    material.name = name;
    materials.add(material);
    return material;
  };
  const basic = (name, map) => {
    const material = new THREE.MeshBasicMaterial({ map });
    material.name = name;
    materials.add(material);
    return material;
  };
  return {
    wood: standard('warm matte timber', '#C7AF8C', wood, { bumpMap: wood, bumpScale: .006 }),
    woodDark: standard('timber edge and understructure', '#735338', wood, { bumpMap: wood, bumpScale: .006 }),
    cream: standard('cream painted proscenium', '#F2E5CB', paint, { bumpMap: paint, bumpScale: .009 }),
    creamDark: standard('cream moulding recess', '#DDCCAA'),
    brass: standard('aged matte brass', '#C2A16B', paint, { metalness: .55, roughness: .84 }),
    metal: standard('blackened hardware', '#777A70', paint, { metalness: .08, roughness: .86 }),
    teal: standard('teal scenic room', '#2C5B5D', paint, { bumpMap: paint, bumpScale: .012 }),
    tealTrim: standard('teal room raised trim', '#457274'),
    curtain: standard('teal wool curtain', '#183D3E', cloth, { bumpMap: cloth, bumpScale: .009, side: THREE.DoubleSide }),
    paper: standard('warm ivory paper lantern', '#FFF1CD', cloth, { emissive: '#FFE0A1', emissiveIntensity: .65, side: THREE.DoubleSide }),
    red: standard('vermilion door', '#D84A35', paint, { bumpMap: paint, bumpScale: .01 }),
    redInset: standard('recessed vermilion panels', '#B73E2D'),
    coast: standard('painted coastal reverse', '#FFFFFF', coast),
    sky: basic('painted daylight backcloth', sky),
    night: basic('painted night backcloth', night),
    moon: standard('painted moon card', '#FFF1CE', moon, { emissive: '#BFA46A', emissiveIntensity: .2 }),
    waves: ['#345F78', '#3B7088', '#548899'].map((color, i) => standard(`paper sea row ${i + 1}`, color, wave)),
    rail: standard('fine bronze floor rail', '#655C42', paint, { metalness: .5, roughness: .85 }),
    dispose() {
      for (const material of materials) material.dispose();
      for (const texture of textures) texture.dispose();
      materials.clear();
      textures.clear();
    }
  };
}
