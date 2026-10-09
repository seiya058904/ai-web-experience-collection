import { isPortraitComposition } from './framing.js';
import { sampleFallback, paneStops, RAY_STOPS, PAINTER_ORDER } from './fallback-scene.js';
import { createSVGDiagram } from './fallback-svg.js';

/** Original diagram interpretation when WebGL is unavailable. Both backends
 * share the same reversible geometry, finishes, beam and daylight state. */
export function createFallback(canvas) {
  let ctx;
  try { ctx = canvas.getContext('2d', { alpha: false }); } catch { ctx = null; }
  const svg = ctx ? null : createSVGDiagram(canvas);
  let w = 1, h = 1, ratio = 1, last, frame, disposed = false;
  const path = points => {
    ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
  };
  const gradient = (x1, y1, x2, y2, stops) => {
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    stops.forEach(([at, color]) => g.addColorStop(at, color));
    return g;
  };
  function update(view, time, state) {
    if (disposed) return;
    last = { view, time, state };
    frame = sampleFallback(view, time, state, w, h, isPortraitComposition(w, h));
  }
  function render() {
    if (disposed || !frame) return false;
    if (svg) return svg.render(frame);
    const f = frame;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgb(${f.base.join(',')})`; ctx.fillRect(0, 0, w, h);
    const a = f.ambient, ambient = ctx.createRadialGradient(a.fx, a.cy, 0, a.cx, a.cy, a.radius);
    ambient.addColorStop(0, `rgba(255,255,255,${a.alpha})`);
    ambient.addColorStop(1, 'rgba(125,150,164,.08)');
    ctx.fillStyle = ambient; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = gradient(0, f.floor.y, 0, h, [[0, `rgba(110,132,145,${f.floor.a})`], [1, `rgba(50,72,90,${f.floor.b})`]]);
    ctx.fillRect(0, f.floor.y, w, h - f.floor.y);
    ctx.globalAlpha = f.word.opacity;
    ctx.font = `500 ${f.word.size}px Manrope, sans-serif`;
    ctx.fillStyle = '#253c48'; ctx.fillText(f.word.text, f.word.x, f.word.y);
    for (const id of PAINTER_ORDER) {
      const p = f.panes[id];
      if (p.life <= 0) continue;
      ctx.globalAlpha = p.life;
      path(p.points);
      ctx.fillStyle = gradient(p.points[0][0], 0, p.points[2][0], h, paneStops(p.alpha)); ctx.fill();
      ctx.strokeStyle = f.darkness > .5 ? 'rgba(209,238,249,.7)' : 'rgba(34,71,90,.4)';
      ctx.lineWidth = 1; ctx.stroke();
      ctx.save(); ctx.translate(3, 1.5); path(p.points); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.stroke(); ctx.restore();
      ctx.save(); path(p.points); ctx.clip();
      ctx.fillStyle = gradient(p.rayX - 30, 0, p.rayX + 30, h, RAY_STOPS); ctx.fillRect(0, 0, w, h); ctx.restore();
    }
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = f.beam.opacity; path(f.beam.incoming); ctx.fillStyle = '#f8fcff'; ctx.fill();
    ctx.globalAlpha = .48 * f.beam.opacity;
    for (const b of f.beam.outgoing) { path(b.points); ctx.fillStyle = b.color; ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    return true;
  }
  function resize(width, height) {
    w = Math.max(1, width); h = Math.max(1, height);
    if (svg) svg.resize(w, h);
    else {
      ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      const bw = Math.round(w * ratio), bh = Math.round(h * ratio);
      if (canvas.width !== bw) canvas.width = bw;
      if (canvas.height !== bh) canvas.height = bh;
    }
    if (last) update(last.view, last.time, last.state);
  }
  return {
    element: svg ? svg.element : canvas, update, render, resize,
    warmup: async () => {}, lowerQuality: () => {},
    dispose() { if (disposed) return; disposed = true; frame = last = null; svg?.dispose(); },
    get info() { return { mode: svg ? 'svg-diagram' : 'canvas-2d', panes: 8 }; },
  };
}
