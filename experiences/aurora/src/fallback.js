import { RE_KM, RIBBONS, cameraAt, elevationAt, magnetopause, projectPoint, writeRibbons } from './model.js';

// The same relationships drawn with Canvas 2D, for browsers without WebGL2.
export class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.kind = 'canvas';
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) throw new Error('Canvas unavailable');
    this.data = new Float32Array(RIBBONS.width * RIBBONS.count * 4);
    this.stars = Array.from({ length: 420 }, (_, i) => [((i * 7919) % 1000) / 1000, ((i * 104729) % 1000) / 1000, 0.2 + ((i * 31) % 10) / 12]);
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.ratio = Math.min(devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.round(width * this.ratio);
    this.canvas.height = Math.round(height * this.ratio);
  }

  adapt() {}

  requestEarth() {}

  draw(frame) {
    const { ctx } = this;
    ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    if (frame.scene.sky >= 0.5) this.drawSky(frame);
    else this.drawSpace(frame);
  }

  drawSky(frame) {
    const { ctx, width: w, height: h } = this;
    const { scene, view } = frame;
    const focal = 1 / Math.tan(((w / h < 1 ? 74 : 58) * Math.PI) / 360);
    const horizon = h / 2 + (Math.tan((scene.pitch * Math.PI) / 180) * focal * h) / 2;
    const toY = (elevation) => h / 2 - (Math.tan(elevation - (scene.pitch * Math.PI) / 180) * focal * h) / 2;
    const sky = ctx.createLinearGradient(0, 0, 0, Math.max(horizon, 1));
    sky.addColorStop(0, '#04070f');
    sky.addColorStop(1, '#0b1722');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    for (const [x, y, b] of this.stars) {
      ctx.fillStyle = `rgba(226,235,255,${b * 0.7})`;
      ctx.fillRect(x * w, y * Math.min(h, horizon), 1.2, 1.2);
    }
    writeRibbons(this.data, frame.time, view.kp);
    ctx.globalCompositeOperation = 'lighter';
    const columns = Math.min(420, Math.round(w / 3));
    const [greenOn, redOn] = view.iso;
    for (let r = 0; r < 3; r += 1) {
      for (let c = 0; c < columns; c += 1) {
        const u = c / columns;
        const i = (r * RIBBONS.width + Math.floor(u * (RIBBONS.width - 1))) * 4;
        const gain = this.data[i + 1];
        if (gain < 0.01) continue;
        const reach = Math.max(1, view.distanceKm + this.data[i] * 100);
        const bottom = toY(elevationAt(reach / RE_KM, this.data[i + 3] * 100));
        const top = toY(elevationAt(reach / RE_KM, this.data[i + 2] * 100 + 60));
        const redTop = toY(elevationAt(reach / RE_KM, 300));
        const x = u * w + Math.sin(u * 40 + r) * 10;
        const g = ctx.createLinearGradient(0, bottom, 0, redTop);
        const mix = Math.min(0.8, gain * 0.5);
        g.addColorStop(0, `rgba(70,255,140,${greenOn * mix})`);
        g.addColorStop(Math.min(0.99, Math.max(0.01, (bottom - top) / Math.max(1, bottom - redTop))), `rgba(60,200,110,${greenOn * mix * 0.25})`);
        g.addColorStop(1, `rgba(255,50,70,${redOn * mix * 0.28})`);
        ctx.fillStyle = g;
        ctx.fillRect(x, redTop, Math.max(2, w / columns), bottom - redTop);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#04070c';
    ctx.fillRect(0, Math.min(h, horizon), w, h);
  }

  drawSpace(frame) {
    const { ctx, width: w, height: h } = this;
    const { scene, view } = frame;
    ctx.fillStyle = '#05080f';
    ctx.fillRect(0, 0, w, h);
    const cam = cameraAt(scene, view.equator + 3);
    const at = (x, y, z) => projectPoint(cam, [x, y, z], w, h);
    const stroke = (points, color, width = 1) => {
      ctx.beginPath();
      let started = false;
      for (const p of points) {
        if (!p) continue;
        if (started) ctx.lineTo(p.x, p.y);
        else ctx.moveTo(p.x, p.y);
        started = true;
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    };
    if (scene.diagram > 0.02) {
      ctx.globalAlpha = scene.diagram;
      for (const sign of [1, -1]) {
        const boundary = [];
        for (let t = 0; t < 2.75; t += 0.04) {
          const r = magnetopause(t, view.r0, view.alpha);
          boundary.push(at(Math.cos(t) * r, 0, sign * Math.sin(t) * r));
        }
        stroke(boundary, '#dbeeff', 1.5);
        for (const shell of [2.5, 4, 6, 8]) {
          const line = [];
          for (let lat = -1.25; lat <= 1.25; lat += 0.05) {
            const r = shell * Math.cos(lat) ** 2;
            line.push(at(sign * Math.cos(lat) * r, 0, Math.sin(lat) * r));
          }
          stroke(line, 'rgba(110,160,215,.55)');
        }
      }
      for (let i = -5; i <= 5; i += 1) {
        const y = i * 3.6;
        stroke([at(30, 0, y), at(view.r0 * 1.5, 0, y * 1.15)], 'rgba(190,205,225,.35)');
      }
      ctx.globalAlpha = 1;
    }
    const center = at(0, 0, 0);
    const edge = at(1, 0, 0);
    if (center && edge) {
      const radius = Math.hypot(edge.x - center.x, edge.y - center.y) || 1;
      const sphere = ctx.createRadialGradient(center.x - radius * 0.6, center.y, radius * 0.1, center.x, center.y, radius);
      sphere.addColorStop(0, '#4a77b5');
      sphere.addColorStop(0.55, '#102039');
      sphere.addColorStop(1, '#050a13');
      ctx.fillStyle = sphere;
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    const ring = (lat, color, width, dash = []) => {
      const c = Math.sin(((90 - lat) * Math.PI) / 180);
      const z = Math.cos(((90 - lat) * Math.PI) / 180);
      const points = [];
      for (let a = 0; a <= 6.3; a += 0.05) points.push(at(c * Math.cos(a), c * Math.sin(a), z));
      ctx.setLineDash(dash);
      stroke(points, color, width);
      ctx.setLineDash([]);
    };
    if (scene.tilt > 0.1) {
      ring(view.equator + 3, `rgba(90,255,150,${0.35 + view.kp * 0.06})`, Math.max(3, (h / 40) * (scene.tilt / 1.57)));
      ring(view.latitude, `rgba(255,255,255,${scene.ring})`, 1.2, [6, 6]);
    }
  }

  dispose() {}
}
