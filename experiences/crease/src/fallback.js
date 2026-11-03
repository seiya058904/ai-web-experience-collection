// The same exact geometry as flat SVG polygons, for browsers without WebGL.
const SVG = 'http://www.w3.org/2000/svg';
const rad = (d) => (d * Math.PI) / 180;
const LIGHT = (() => {
  const v = [-2.4, -1.6, 4.6];
  const l = Math.hypot(...v);
  return v.map((x) => x / l);
})();
const mix = (a, b, t) => a.map((x, i) => Math.round(x + (b[i] - x) * t));
const COBALT = [[14, 29, 104], [39, 72, 226]];
const PAPER = [[176, 181, 196], [248, 249, 250]];

export class FlatRenderer {
  constructor(canvas) {
    this.kind = 'svg';
    this.svg = document.createElementNS(SVG, 'svg');
    this.svg.id = canvas.id;
    this.svg.setAttribute('role', canvas.getAttribute('role'));
    this.svg.setAttribute('aria-label', canvas.getAttribute('aria-label'));
    canvas.replaceWith(this.svg);
    this.canvas = this.svg;
    this.facets = [];
    this.view = { elevation: 60, azimuth: 0, distance: 3.5, shiftX: 0, shiftY: 0 };
  }

  setCreases() {}

  setFacets(result) {
    this.facets = result.facets;
  }

  setView(view) {
    this.view = view;
  }

  // An orthographic view at the same elevation and azimuth as the WebGL camera.
  basis() {
    const e = rad(this.view.elevation);
    const a = rad(this.view.azimuth);
    const back = [Math.cos(e) * Math.sin(a), -Math.cos(e) * Math.cos(a), Math.sin(e)];
    const right = [Math.cos(a), Math.sin(a), 0];
    const up = [back[1] * right[2] - back[2] * right[1], back[2] * right[0] - back[0] * right[2], back[0] * right[1] - back[1] * right[0]];
    return { back, right, up, scale: this.height / (this.view.distance * 0.536) };
  }

  project(p) {
    const { right, up, scale } = this.basis();
    const z = (this.view.targetZ || 0) * up[2];
    return {
      x: this.width * (0.5 + this.view.shiftX) + (p[0] * right[0] + p[1] * right[1] + p[2] * right[2]) * scale,
      y: this.height * (0.5 + this.view.shiftY) - (p[0] * up[0] + p[1] * up[1] + p[2] * up[2] - z) * scale,
    };
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }

  render() {
    const { back } = this.basis();
    const rows = this.facets.map((facet) => {
      const p = facet.points;
      let nx = 0;
      let ny = 0;
      let nz = 0;
      let depth = 0;
      for (let i = 0; i < p.length; i += 1) {
        const a = p[i];
        const b = p[(i + 1) % p.length];
        nx += (a[1] - b[1]) * (a[2] + b[2]);
        ny += (a[2] - b[2]) * (a[0] + b[0]);
        nz += (a[0] - b[0]) * (a[1] + b[1]);
        depth += a[0] * back[0] + a[1] * back[1] + a[2] * back[2];
      }
      const l = Math.hypot(nx, ny, nz) || 1;
      const n = [nx / l, ny / l, nz / l];
      const facing = n[0] * back[0] + n[1] * back[1] + n[2] * back[2] >= 0;
      const lit = Math.abs(n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
      const [low, high] = facing ? COBALT : PAPER;
      const color = mix(low, high, lit);
      return { depth: depth / p.length, d: `M${p.map((q) => { const s = this.project(q); return `${s.x.toFixed(1)} ${s.y.toFixed(1)}`; }).join('L')}Z`, color };
    }).sort((a, b) => a.depth - b.depth);
    this.svg.innerHTML = rows.map((r) => `<path d="${r.d}" fill="rgb(${r.color})" stroke="rgb(${r.color})" stroke-width=".6"/>`).join('');
  }

  dispose() {}
}
