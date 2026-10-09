import { paneStops, RAY_STOPS, PAINTER_ORDER } from './fallback-scene.js';

const NS = 'http://www.w3.org/2000/svg';
const attrs = (node, values) => { for (const [name, value] of Object.entries(values)) node.setAttribute(name, String(value)); return node; };
const make = (tag, values, parent) => { const el = attrs(document.createElementNS(NS, tag), values); parent?.append(el); return el; };
const polygon = points => `M${points.map(p => p.join(',')).join('L')}Z`;

/** Native SVG is the minimum diagram path if the 2D context is also denied.
 * Nodes/defs are allocated once; only existing attributes follow main's clock. */
export function createSVGDiagram(canvas) {
  const element = make('svg', { id: canvas.id, class: canvas.className, 'aria-hidden': 'true', preserveAspectRatio: 'none' });
  const defs = make('defs', {}, element);
  const gradient = (id, kind = 'linearGradient', stops = []) => {
    const node = make(kind, { id: `glasshouse-diagram-${id}`, gradientUnits: 'userSpaceOnUse' }, defs);
    const children = stops.map(([offset, color]) => make('stop', { offset, 'stop-color': color }, node));
    return { node, children, url: `url(#glasshouse-diagram-${id})` };
  };
  const stops = (g, values) => values.forEach(([offset, color], i) => attrs(g.children[i], { offset, 'stop-color': color }));
  const base = make('rect', {}, element);
  const ambient = gradient('ambient', 'radialGradient', [[0, '#fff'], [1, 'rgba(125,150,164,.08)']]);
  const ambientRect = make('rect', { fill: ambient.url }, element);
  const floor = gradient('floor', 'linearGradient', [[0, '#000'], [1, '#000']]);
  const floorRect = make('rect', { fill: floor.url }, element);
  const word = make('text', { fill: '#253c48', 'font-family': 'Manrope, sans-serif', 'font-weight': 500 }, element); word.textContent = 'UNSEEN';
  const panes = Array.from({ length: 8 }, (_, id) => {
    const fill = gradient(`pane-${id}`, 'linearGradient', paneStops(.075));
    const ray = gradient(`ray-${id}`, 'linearGradient', RAY_STOPS);
    const clip = make('clipPath', { id: `glasshouse-diagram-clip-${id}`, clipPathUnits: 'userSpaceOnUse' }, defs);
    const clipPath = make('path', {}, clip);
    const group = make('g', {}, null);
    const body = make('path', { fill: fill.url, 'stroke-width': 1 }, group);
    const rim = make('path', { fill: 'none', stroke: 'rgba(255,255,255,.85)', 'stroke-width': 1, transform: 'translate(3 1.5)' }, group);
    const rayRect = make('rect', { fill: ray.url, 'clip-path': `url(#glasshouse-diagram-clip-${id})` }, group);
    return { group, body, rim, fill, ray, clipPath, rayRect };
  });
  PAINTER_ORDER.forEach(id => element.append(panes[id].group));
  const beam = make('g', { style: 'mix-blend-mode:screen' }, element);
  const incoming = make('path', { fill: '#f8fcff' }, beam);
  const outgoing = Array.from({ length: 5 }, () => make('path', { opacity: .48 }, beam));
  canvas.replaceWith(element);
  let disposed = false;
  return {
    element,
    resize(width, height) { attrs(element, { viewBox: `0 0 ${width} ${height}` }); },
    render(f) {
      if (disposed) return false;
      const w = f.width, h = f.height, a = f.ambient;
      attrs(base, { width: w, height: h, fill: `rgb(${f.base.join(',')})` });
      attrs(ambient.node, { cx: a.cx, cy: a.cy, fx: a.fx, fy: a.cy, r: a.radius });
      attrs(ambient.children[0], { 'stop-color': `rgba(255,255,255,${a.alpha})` });
      attrs(ambientRect, { width: w, height: h });
      attrs(floor.node, { x1: 0, y1: f.floor.y, x2: 0, y2: h });
      stops(floor, [[0, `rgba(110,132,145,${f.floor.a})`], [1, `rgba(50,72,90,${f.floor.b})`]]);
      attrs(floorRect, { x: 0, y: f.floor.y, width: w, height: h - f.floor.y });
      attrs(word, { x: f.word.x, y: f.word.y, 'font-size': f.word.size, opacity: f.word.opacity });
      for (const p of f.panes) {
        const node = panes[p.id], d = polygon(p.points);
        attrs(node.group, { opacity: p.life });
        attrs(node.body, { d, stroke: f.darkness > .5 ? 'rgba(209,238,249,.7)' : 'rgba(34,71,90,.4)' });
        attrs(node.rim, { d }); attrs(node.clipPath, { d });
        attrs(node.fill.node, { x1: p.points[0][0], y1: 0, x2: p.points[2][0], y2: h }); stops(node.fill, paneStops(p.alpha));
        attrs(node.ray.node, { x1: p.rayX - 30, y1: 0, x2: p.rayX + 30, y2: h });
        attrs(node.rayRect, { x: 0, y: 0, width: w, height: h });
      }
      attrs(beam, { opacity: f.beam.opacity }); attrs(incoming, { d: polygon(f.beam.incoming) });
      f.beam.outgoing.forEach((b, i) => attrs(outgoing[i], { d: polygon(b.points), fill: b.color }));
      return true;
    },
    dispose() { if (disposed) return; disposed = true; element.remove(); },
  };
}
