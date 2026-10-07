import { clamp, lerp, smoothstep, cover } from './math.js';
import { FluidScenes } from './fluid-scenes.js';
import { PaperScenes } from './paper-scenes.js';

/** One compositor. All motion arrives from the application's single clock. */
export class MaterialRenderer {
  constructor(canvas, images) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!this.ctx) throw new Error('Canvas 2D is unavailable.');
    this.images = images;
    this.fluid = new FluidScenes();
    this.paper = new PaperScenes();
    this.paper.prepare(images);
    this.gloss = document.createElement('canvas');
    this.gloss.width = 836; this.gloss.height = 471;
    this.glossCtx = this.gloss.getContext('2d');
    this.width = 0; this.height = 0;
  }

  resize(w, h, mobile, dpr) {
    if (this.disposed) return;
    this.width = w; this.height = h; this.mobile = mobile; this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.fluid.resize(w, h, mobile, dpr);
    this.paper.resize(w, h, mobile, dpr);
  }

  render({ q, time, pointer, reduced }) {
    if (this.disposed) return;
    const ctx = this.ctx, w = this.width, h = this.height;
    const mobile = this.mobile;
    const sceneQ = reduced ? (q >= 9 ? 9.82 : Math.floor(q) + .46) : q;
    const s = { w, h, time: reduced ? 0 : time, pointer: reduced ? { x: 0, y: 0 } : pointer, reduced, mobile, images: this.images, q: sceneQ, local: 0, opacity: 1 };
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#080a0d'; ctx.fillRect(0, 0, w, h);
    const light = ctx.createRadialGradient(w * .58, h * .34, 0, w * .55, h * .42, Math.max(w, h) * .8);
    light.addColorStop(0, '#15191d'); light.addColorStop(.58, '#0a0c10'); light.addColorStop(1, '#06080a');
    ctx.fillStyle = light; ctx.fillRect(0, 0, w, h);

    const paperMix = smoothstep(5.65, 5.97, sceneQ);
    if (paperMix > 0) {
      ctx.save(); ctx.globalAlpha = paperMix;
      ctx.fillStyle = '#f1ebdf'; ctx.fillRect(0, 0, w, h);
      cover(ctx, this.images.paper, w, h);
      ctx.restore();
    }
    const current = Math.min(9, Math.floor(sceneQ));
    const local = sceneQ - current;
    const handoff = reduced ? 0 : smoothstep(.64, 1, local);
    // Paper shares one geometric model: draw it once even during chapter handoffs.
    if (sceneQ >= 6) {
      const draw = current <= 6 ? 'contact' : current === 7 ? 'absorb' : current === 8 ? 'write' : 'trace';
      this.paper[draw](ctx, { ...s, local });
    } else if (current === 5 && !reduced) {
      this.enterPaper(ctx, { ...s, local });
    } else {
      this.scene(current, { ...s, local, opacity: 1 - handoff });
      if (current < 9 && handoff > 0) this.scene(current + 1, { ...s, local: local - 1, opacity: handoff });
      if (!reduced && current < 5 && handoff > 0) this.inkHandoff(ctx, s, current, handoff);
    }
    ctx.globalAlpha = 1;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.paper.dispose(); this.fluid.dispose();
    this.gloss.width = this.gloss.height = 0;
    this.canvas.width = this.canvas.height = 0;
    this.images = {};
  }

  scene(index, s) {
    const ctx = this.ctx;
    if (s.opacity < .0001) return;
    ctx.save(); ctx.globalAlpha = s.opacity;
    switch (index) {
      case 0: this.metal(ctx, s); break;
      case 1: this.fluid.reservoir(ctx, s); break;
      case 2: this.fluid.feed(ctx, s); break;
      case 3: this.fluid.balance(ctx, s); break;
      case 4: this.slit(ctx, s); break;
      case 5: this.meniscus(ctx, s); break;
      case 6: this.paper.contact(ctx, s); break;
      default: break;
    }
    ctx.restore();
  }

  sheen(ctx, image, box, time, amount) {
    const layer = this.glossCtx;
    if (!layer || !image?.width) return;
    const lw = this.gloss.width, lh = this.gloss.height;
    layer.clearRect(0, 0, lw, lh);
    layer.globalCompositeOperation = 'source-over';
    layer.drawImage(image, 0, 0, lw, lh);
    layer.globalCompositeOperation = 'source-in';
    const x = (.40 + .17 * Math.sin(time * .29)) * lw;
    const gradient = layer.createLinearGradient(x - lw * .20, 0, x + lw * .20, 0);
    gradient.addColorStop(0, 'rgba(180,202,219,0)'); gradient.addColorStop(.44, 'rgba(214,229,238,.09)');
    gradient.addColorStop(.52, 'rgba(244,247,241,.6)'); gradient.addColorStop(.58, 'rgba(214,229,238,.10)'); gradient.addColorStop(1, 'rgba(180,202,219,0)');
    layer.fillStyle = gradient; layer.fillRect(0, 0, lw, lh);
    layer.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha *= amount;
    ctx.drawImage(this.gloss, box.x, box.y, box.w, box.h); ctx.restore();
  }

  metal(ctx, s) {
    const { w, h, mobile, local, pointer, time, reduced } = s;
    const travel = reduced ? 0 : smoothstep(.40, 1, local);
    if (mobile) {
      const portrait = h > w;
      const image = portrait ? this.images.heroMobile : this.images.contact;
      const dh = (portrait ? w * image.height / image.width : h * .76) * (1 + travel * 1.35);
      const dw = dh * image.width / image.height;
      const tx = w * .465 - travel * w * .05, ty = h * .57 + travel * h * .40;
      const box = { x: tx - dw * (portrait ? .448 : .512) + pointer.x * 3, y: ty - dh * (portrait ? .592 : .9), w: dw, h: dh };
      ctx.drawImage(image, box.x, box.y, box.w, box.h);
      if (!reduced) this.sheen(ctx, image, box, time, .22);
      return;
    }
    const image = this.images.hero;
    const scale = 1 + travel * 2.2;
    const dw = h * image.width / image.height * scale, dh = h * scale;
    const tx = lerp(w * .627, w * .67, travel) + pointer.x * 4;
    const ty = lerp(h * .777, h * 1.1, travel) + pointer.y * 2;
    const box = { x: tx - dw * .622, y: ty - dh * .777, w: dw, h: dh };
    ctx.drawImage(image, box.x, box.y, box.w, box.h);
    if (!reduced) this.sheen(ctx, image, box, time + pointer.x * .5, .19);
    // Surface awareness: reflection moves, the held ink volume does not grow.
    if (travel < .7) {
      ctx.save(); ctx.globalAlpha *= .30 * (1 - travel);
      ctx.strokeStyle = '#c4d8e5'; ctx.lineWidth = .7;
      ctx.beginPath(); ctx.ellipse(tx + Math.sin(time * .4) * 1.4, ty - 8, 11, 15, .1, .1, 1.2); ctx.stroke(); ctx.restore();
    }
  }

  slit(ctx, s) {
    const { w, h, local, mobile, pointer, time } = s;
    const image = this.images.slit;
    const travel = smoothstep(.05, .95, local);
    const scale = mobile ? 1.02 : 1.04 + .14 * travel;
    const rw = mobile ? h * 1.45 : Math.max(w, h * image.width / image.height) * scale;
    const rh = rw * image.height / image.width;
    const dx = mobile ? w * .56 - rw * .50 : (w - rw) * .66 + pointer.x * 2;
    const dy = mobile ? h * .40 - rh * .25 : (h - rh) * .66 - travel * h * .02;
    ctx.drawImage(image, dx, dy, rw, rh);
    const path = new Path2D();
    path.moveTo(dx + .791 * rw, dy - .02 * rh);
    path.bezierCurveTo(dx + .67 * rw, dy + .27 * rh, dx + .565 * rw, dy + .56 * rh, dx + .449 * rw, dy + .843 * rh);
    ctx.save();
    const band = ctx.createLinearGradient(dx + .80 * rw, dy, dx + .44 * rw, dy + .85 * rh);
    band.addColorStop(0, 'rgba(141,182,207,0)'); band.addColorStop(.35, 'rgba(147,185,211,.16)'); band.addColorStop(.8, 'rgba(202,222,236,.55)'); band.addColorStop(1, 'rgba(141,182,207,0)');
    ctx.strokeStyle = band; ctx.lineWidth = Math.max(.7, rw * .0010); ctx.stroke(path);
    ctx.setLineDash([rw * .025, rw * .26]); ctx.lineDashOffset = time * rw * .018 + local * rw * .28;
    ctx.strokeStyle = 'rgba(192,218,233,.55)'; ctx.lineWidth = Math.max(.6, rw * .0007); ctx.stroke(path); ctx.restore();
    if (mobile) { const fade = ctx.createLinearGradient(0, h * .23, 0, h * .5); fade.addColorStop(0, '#080a0d'); fade.addColorStop(1, 'rgba(8,10,13,0)'); ctx.fillStyle = fade; ctx.fillRect(0, 0, w, h * .5); }
  }

  meniscus(ctx, s) {
    const { w, h, local, mobile, pointer, time, reduced } = s;
    const image = this.images.meniscus;
    const dw = mobile ? w * 1.82 : Math.min(w * 1.12, h * 2.22);
    const dh = dw * image.height / image.width;
    const tx = (mobile ? .53 : .675) * w;
    const ty = (mobile ? .72 : .735) * h;
    ctx.save();
    const box = { x: tx - dw * .528 + pointer.x * 1.4, y: ty - dh * .824, w: dw, h: dh };
    // The volume stays attached and constant. A separately generated liquid-only
    // optical plate supplies refraction; code registers it to the slit and re-lights it.
    // This lets the liquid and metal share a camera without becoming one flattened image.
    ctx.beginPath();
    ctx.moveTo(tx - dw * .002, ty - dh * .73);
    ctx.lineTo(tx + dw * .002, ty - dh * .73);
    ctx.lineTo(tx + dw * .005, ty - dh * .23);
    ctx.lineTo(tx - dw * .005, ty - dh * .23);
    ctx.closePath(); ctx.fillStyle = '#071322'; ctx.fill();
    const liquidBox = { x: box.x + dw * .016, y: box.y + dh * .064, w: dw, h: dh };
    const liquid = this.images.meniscusFluid;
    if (liquid) {
      ctx.drawImage(liquid, liquidBox.x, liquidBox.y, liquidBox.w, liquidBox.h);
      if (!reduced) this.sheen(ctx, liquid, liquidBox, time * .8 + pointer.x * .3, .28);
    }
    ctx.drawImage(image, box.x, box.y, box.w, box.h);
    if (!reduced) this.sheen(ctx, image, box, time, .10);
    ctx.restore();
    if (mobile) { ctx.save(); const shade = ctx.createLinearGradient(0, h * .36, 0, h * .50); shade.addColorStop(0, '#080a0d'); shade.addColorStop(1, 'rgba(8,10,13,0)'); ctx.fillStyle = shade; ctx.fillRect(0, 0, w, h * .50); ctx.restore(); }
  }

  enterPaper(ctx, s) {
    const { w, h, local, mobile, time } = s;
    if (local <= .56) { this.scene(5, s); return; }
    if (local >= .82) { this.paper.contact(ctx, s); return; }
    // Travel through the actual held liquid interface. The same optical
    // volume fills the lens between macro and oblique poses, so silhouettes
    // never cross-fade or collapse. All scale and exposure is reversible.
    const entering = local < .72;
    const travel = entering ? smoothstep(.56, .72, local) : 1 - smoothstep(.72, .82, local);
    const lensX = w * .53, lensY = h * .56;
    let ox, oy, zoom;
    if (entering) {
      const dw = mobile ? w * 1.82 : Math.min(w * 1.12, h * 2.22);
      const dh = dw * this.images.meniscus.height / this.images.meniscus.width;
      ox = (mobile ? .53 : .675) * w; oy = (mobile ? .72 : .735) * h - dh * .043;
      zoom = Math.exp(travel * Math.log(mobile ? 40 : 23));
    } else {
      const g = this.paper.geometry(s, 6);
      ox = g.tip.x; oy = g.tip.y - h * (mobile ? .005 : .012);
      zoom = Math.exp(travel * Math.log(mobile ? 110 : 65));
    }
    const cx = lerp(ox, lensX, travel), cy = lerp(oy, lensY, travel);
    ctx.save(); ctx.translate(cx, cy); ctx.scale(zoom, zoom); ctx.translate(-ox, -oy);
    if (entering) this.scene(5, { ...s, local: .5 });
    else this.paper.contact(ctx, s);
    ctx.restore();
    // At the change of viewing angle, the liquid itself occupies the lens.
    // This registered refractive plate is material, not a generic screen wipe.
    const immersion = smoothstep(.52, .84, travel);
    if (immersion > 0) {
      const size = Math.max(w, h) * lerp(1.9, 5.4, travel);
      ctx.save(); ctx.globalAlpha *= immersion;
      ctx.drawImage(this.images.meniscusFluid, 724, 491, 267, 256, lensX - size * .51, lensY - size * .63, size, size * .959);
      ctx.restore();
    }
  }

  inkHandoff(ctx, s, index, amount) {
    const { w, h, mobile } = s;
    const poses = mobile ? [
      [.87, .22, .72, .36, .58, .48, .465, .57], [0, .60, .3, .60, .7, .60, 1, .60],
      [0, .99, .3, .82, .7, .59, 1, .44], [.42, .42, .42, .6, .42, .8, .42, 1.1],
      [.99, .42, .86, .62, .66, .8, .43, .94], [.53, .48, .53, .6, .53, .66, .53, .72]
    ] : [
      [.627, .22, .627, .4, .627, .62, .627, .777], [0, .55, .33, .54, .67, .54, 1, .55],
      [0, 1.02, .33, .72, .66, .40, 1.02, .03], [.60, -.1, .60, .28, .60, .72, .60, 1.1],
      [.80, -.04, .68, .29, .56, .57, .45, .84], [.675, .43, .675, .57, .675, .67, .675, .735]
    ];
    const a = poses[index], b = poses[index + 1];
    if (!a || !b) return;
    const p = a.map((v, i) => lerp(v, b[i], amount) * (i % 2 ? h : w));
    ctx.save(); ctx.globalAlpha = Math.sin(amount * Math.PI) * .43;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.bezierCurveTo(...p.slice(2));
    ctx.strokeStyle = '#071426'; ctx.lineWidth = lerp(2, 4, Math.sin(amount * Math.PI)); ctx.stroke();
    ctx.strokeStyle = '#b1c5d5'; ctx.lineWidth = .65; ctx.stroke(); ctx.restore();
  }
}
