/**
 * Shared container state and an exact-coordinate, readable SVG alternative.
 * Coordinates are metres. Small mechanical details are schematic, not a
 * manufacturing drawing or a statement of certified lifting compatibility.
 */
export type ContainerMode = 'identity' | 'interior' | 'doors' | 'road' | 'rail' | 'lift' | 'destination';
export type ContainerHighlight = 'none' | 'corners' | 'doors' | 'identity';

export interface ContainerState {
  mode: ContainerMode;
  progress: number;
  packed: boolean;
  doorsOpen: number;
  highlight: ContainerHighlight;
  reduced: boolean;
}

export const CONTAINER_DIMENSIONS = Object.freeze({ length: 6.058, width: 2.438, height: 2.591 });
export const DEFAULT_CONTAINER_STATE: Readonly<ContainerState> = Object.freeze({
  mode: 'identity', progress: 0, packed: false, doorsOpen: 0, highlight: 'none', reduced: false,
});

/** The same authored arrangement is used at packing and arrival. */
export const CARGO_BLOCKS = Object.freeze([
  { x: -2.12, z: -0.56, width: 1.13, depth: 0.91, height: 0.96 },
  { x: -0.80, z: -0.56, width: 1.13, depth: 0.91, height: 0.96 },
  { x: 0.52, z: -0.56, width: 1.13, depth: 0.91, height: 0.96 },
  { x: -2.12, z: 0.55, width: 1.13, depth: 0.91, height: 0.96 },
  { x: -0.80, z: 0.55, width: 1.13, depth: 0.91, height: 0.96 },
  { x: 0.52, z: 0.55, width: 1.13, depth: 0.91, height: 0.96 },
]);

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

export function normalizeContainerState(state: Partial<ContainerState>, previous: ContainerState = { ...DEFAULT_CONTAINER_STATE }): ContainerState {
  return { ...previous, ...state, progress: clamp(state.progress ?? previous.progress), doorsOpen: clamp(state.doorsOpen ?? previous.doorsOpen) };
}

/** Contact happens before lift. This pure function is also used by Three. */
export function getContainerPose(state: ContainerState) {
  const inLift = state.mode === 'lift';
  const contact = inLift && state.progress >= 0.45;
  const lift = inLift ? clamp((state.progress - 0.45) / 0.55) * 1.55 : 0;
  const base = state.mode === 'road' ? 1.15 : state.mode === 'rail' ? 1.00 : lift;
  const gap = inLift ? (1 - clamp(state.progress / 0.45)) * 0.92 : 0;
  return { base, lift, gap, contact, spreaderY: CONTAINER_DIMENSIONS.height + base + gap };
}

export function describeContainerState(state: ContainerState): string {
  const mode: Record<ContainerMode, string> = {
    identity: 'A corrugated red container with eight corner fittings and two rear doors.',
    interior: 'A cutaway reveals the floor, wall thickness and finite interior.',
    doors: state.doorsOpen > 0.5 ? 'The two doors turn outward on their original hinges.' : 'The two doors are closed, with one locking rod on each door.',
    road: 'The same red container is seated on a road chassis, above its wheels.',
    rail: 'The same red container is seated on a rail wagon, above wheels and rails.',
    lift: getContainerPose(state).contact ? 'The spreader is engaged at all four top corners; the box and spreader rise together on taut cables.' : 'The box remains grounded while a spreader aligns above its top corners.',
    destination: 'The original doors reveal the same packing arrangement at the destination.',
  };
  return `CARGO / BOX-001. Fictional exhibit ID. ${mode[state.mode]} ${state.packed ? 'Six illustrative timber packing blocks are present.' : 'The interior is empty.'} Schematic geometry; not a handling guide.`;
}

type Point = readonly [number, number, number];
type Shade = readonly [string, string, string];
const PAINT: Shade = ['#ad5846', '#793b31', '#bf7160'];
const STEEL: Shade = ['#556169', '#2f3c44', '#8d999b'];
const WOOD: Shade = ['#bfaa81', '#8d7550', '#d7c39b'];
const HIGHLIGHT: Shade = ['#dfaa57', '#a16d2b', '#f2ce8d'];

/** A stable isometric projection of metre-based geometry, never a photo stand-in. */
export function renderContainerFallback(input: Partial<ContainerState> = {}): string {
  const state = normalizeContainerState(input);
  const { length: L, width: W, height: H } = CONTAINER_DIMENSIONS;
  const pose = getContainerPose(state);
  const lift = state.mode === 'lift';
  const endView = state.mode === 'doors' || state.mode === 'destination';
  const bounds = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity };
  const project = ([x, y, z]: Point): readonly [number, number] => {
    // A lower view into the doorway keeps the retained packing visible.
    const px = endView ? 400 + x * 24 - z * 72 : 400 + (x - z) * 56;
    const py = endView ? 330 - y * 64 + x * 7 + z * 16 : (lift ? 378 : 330) - y * 62 + (x + z) * 20;
    bounds.left = Math.min(bounds.left, px); bounds.right = Math.max(bounds.right, px);
    bounds.top = Math.min(bounds.top, py); bounds.bottom = Math.max(bounds.bottom, py);
    return [px, py];
  };
  const p = (v: Point) => project(v).map(n => n.toFixed(2)).join(',');
  const poly = (points: readonly Point[], fill: string, stroke = '#452e29', width = 0.8) => `<polygon points="${points.map(p).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
  const line = (a: Point, b: Point, color: string, width = 1.2, extra = '') => `<line x1="${project(a)[0]}" y1="${project(a)[1]}" x2="${project(b)[0]}" y2="${project(b)[1]}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" ${extra}/>`;
  const solid = (x: number, y: number, z: number, w: number, h: number, d: number, colors: Shade, transform = (q: Point): Point => q) => {
    const raw: Point[] = [[x,y,z],[x+w,y,z],[x+w,y,z+d],[x,y,z+d],[x,y+h,z],[x+w,y+h,z],[x+w,y+h,z+d],[x,y+h,z+d]];
    const corners: Point[] = raw.map(transform);
    return poly([corners[3],corners[2],corners[6],corners[7]],colors[0]) + poly([corners[1],corners[2],corners[6],corners[5]],colors[1]) + poly([corners[4],corners[5],corners[6],corners[7]],colors[2]);
  };
  const label = (text: string, x: number, y: number, extra = '') => `<text x="${x}" y="${y}" fill="#283138" font-family="Arial, sans-serif" font-size="22" ${extra}>${text}</text>`;
  let art = '';
  const wheel = (x: number, y: number, z: number, r: number) => {
    const pts: Point[] = Array.from({ length: 28 }, (_, i) => [x+Math.cos(i/28*Math.PI*2)*r, y+Math.sin(i/28*Math.PI*2)*r,z] as Point);
    return poly(pts, '#273138', '#1c252a', 2) + `<ellipse cx="${project([x,y,z])[0]}" cy="${project([x,y,z])[1]}" rx="7" ry="10" fill="#99a1a0"/>`;
  };
  art += `<ellipse cx="400" cy="${lift ? 392 : 364}" rx="${endView ? 190 : 258}" ry="${endView ? 22 : 35}" fill="#283138" opacity="0.075"/>`;
  if (state.mode === 'rail') {
    for (let x = -4.5; x < 4.8; x += 0.58) art += solid(x,0,-1.45,0.15,0.10,2.9,['#8a8f89','#626c69','#a3aaa4']);
    for (const z of [-0.85,0.85]) art += solid(-5,0.08,z-0.04,10,0.12,0.08,STEEL);
    for (const z of [-1.05,1.05]) for (const x of [-2.4,-1.68,1.68,2.4]) art += wheel(x,0.49,z,0.29);
    art += solid(-3.32,0.79,-1.14,6.64,0.21,2.28,STEEL);
  }
  if (state.mode === 'road') {
    for (const z of [-1.1,1.1]) for (const x of [-2.28,1.45,2.33]) art += wheel(x,0.42,z,0.42);
    for (const z of [-0.91,0.91]) art += solid(-3.3,0.86,z-0.1,6.6,0.25,0.2,STEEL);
    for (const x of [-2.94,2.94]) art += solid(x-0.10,1.08,-1.16,0.2,0.07,2.32,STEEL);
  }
  const base = pose.base;
  const fitting = (x: number, y: number, z: number) => {
    let result = solid(x,y,z,0.17,0.18,0.17,state.highlight==='corners'?HIGHLIGHT:STEEL);
    const hole=project([x+0.171,y+0.09,z+0.085]);
    result += `<ellipse cx="${hole[0]}" cy="${hole[1]}" rx="3" ry="4.3" fill="#1c262d"/>`;
    return result;
  };
  // Back wall and far wall appear behind the unchanged cargo arrangement.
  art += solid(-L/2,base+0.16,-W/2,0.09,H-0.25,W,PAINT);
  art += solid(-L/2,base+0.16,-W/2,L,H-0.25,0.07,PAINT);
  // The rear, far post must be occluded by the roof and near wall in a closed
  // view. Drawing every post last would incorrectly make this one transparent.
  art += solid(-L/2,base,-W/2,0.1,H,0.1,PAINT);
  art += fitting(-L/2,base,-W/2) + fitting(-L/2,base+H-0.18,-W/2);
  art += solid(-L/2,base,-W/2,L,0.17,W,STEEL);
  for(let z=-W/2+0.11;z<W/2-0.1;z+=0.26) art += solid(-L/2+0.1,base+0.17,z,L-0.2,0.04,0.235,WOOD);
  if (state.packed) for (const [index, c] of CARGO_BLOCKS.entries()) {
    // World metadata and the visible faces share the same x/y/z inputs.
    const center: Point = [c.x,base+0.21+c.height/2,c.z];
    const size: Point = [c.width,c.height,c.depth];
    art += `<g data-cargo-id="BOX-001-CARGO-${String(index+1).padStart(2,'0')}" data-cargo-center="${center.join(',')}" data-cargo-size="${size.join(',')}" data-cargo-units="m">`;
    art += solid(center[0]-size[0]/2,center[1]-size[1]/2,center[2]-size[2]/2,size[0],size[1],size[2],WOOD);
    for(const dx of [-0.35,0.35]) art += line([c.x+dx,base+0.22,c.z+c.depth/2+0.005],[c.x+dx,base+0.21+c.height,c.z+c.depth/2+0.005],'#6d614a',2.7);
    art += '</g>';
  }
  const cutaway = state.mode === 'interior';
  if (!cutaway) {
    art += solid(-L/2,base+0.16,W/2-0.07,L,H-0.25,0.07,PAINT);
    for(let x=-L/2+0.22;x<L/2-0.18;x+=0.235) art += solid(x,base+0.22,W/2-0.055,0.075,H-0.43,0.055,['#b76250','#74392e','#c97a64']);
    art += solid(-L/2,base+H-0.07,-W/2,L,0.07,W,PAINT);
    for(let x=-L/2+0.2;x<L/2-0.2;x+=0.235) art += line([x,base+H+0.004,-W/2+0.12],[x,base+H+0.004,W/2-0.12],'#cf8874',0.9);
  }
  // The same structural perimeter remains present in the cutaway.
  for(const x of [-L/2,L/2-0.1]) for(const z of [-W/2,W/2-0.1]) {
    if(x===-L/2 && z===-W/2) continue;
    art += solid(x,base,z,0.1,H,0.1,PAINT);
  }
  for(const z of [-W/2,W/2-0.09]) art += solid(-L/2,base+H-0.10,z,L,0.10,0.09,PAINT);
  for(const y of [base,base+H-0.11]) art += solid(L/2-0.11,y,-W/2,0.11,0.11,W,PAINT);
  const doorWidth = W/2-0.105;
  for(const sign of [-1,1]) {
    const angle=-sign*state.doorsOpen*Math.PI*0.59;
    const hingeZ=sign*(W/2-0.09);
    const tx=(q: Point): Point => [L/2-0.055 + Math.cos(angle)*q[0]+Math.sin(angle)*q[2],base+q[1],hingeZ-Math.sin(angle)*q[0]+Math.cos(angle)*q[2]];
    const z0=sign===1 ? -doorWidth : 0;
    art += solid(0,0.15,z0,0.055,H-0.29,doorWidth, state.highlight === 'doors' ? HIGHLIGHT : PAINT, tx);
    for(const y of [0.35,0.91,1.54,2.2]) art += line(tx([0.062,y,z0+0.05]),tx([0.062,y,z0+doorWidth-0.05]),'#ca8972',2.3);
    const rodZ=z0+doorWidth/2;
    art += line(tx([0.095,0.24,rodZ]),tx([0.095,H-0.18,rodZ]),'#d5d7ca',4.0);
    art += line(tx([0.12,0.53,rodZ]),tx([0.12,0.53,rodZ+sign*0.21]),'#d5d7ca',3.0);
    if(sign===-1) art += line(tx([0.068,1.80,doorWidth*0.18]),tx([0.068,2.28,doorWidth*0.68]),'#debc82',3.5);
  }
  for(const x of [-L/2,L/2-0.17]) for(const z of [-W/2,W/2-0.17]) for(const y of [0,H-0.18]) {
    if(x===-L/2 && z===-W/2) continue;
    art += fitting(x,base+y,z);
  }
  if (lift) {
    const y=pose.spreaderY;
    for(const z of [-W/2+0.09,W/2-0.09]) art += solid(-L/2+0.02,y+0.18,z-0.07,L-0.04,0.18,0.14,HIGHLIGHT);
    for(const x of [-L/2+0.08,L/2-0.08]) {
      art += solid(x-0.08,y+0.18,-W/2+0.02,0.16,0.18,W-0.04,HIGHLIGHT);
      for(const z of [-W/2+0.09,W/2-0.09]) art += solid(x-0.07,y,z-0.07,0.14,0.20,0.14,STEEL);
    }
    for(const x of [-2.50,2.50]) for(const z of [-0.92,0.92]) art += line([x,y+0.36,z],[x,6.38,z],'#59666a',2.2);
    art += solid(-3.6,6.38,-1.08,7.2,0.28,2.16,STEEL);
  }
  // Keep the floor plane in frame while a lift raises the box. Fit only the
  // diagram into a fixed viewport; identity and explanatory text remain clear.
  for(const x of [-L/2,L/2]) for(const z of [-W/2,W/2]) project([x,0,z]);
  const diagramScale = Math.min(1.18,736/(bounds.right-bounds.left),304/(bounds.bottom-bounds.top));
  const diagramX = 400-(bounds.left+bounds.right)/2*diagramScale;
  const diagramY = 264-(bounds.top+bounds.bottom)/2*diagramScale;
  art = `<g transform="translate(${diagramX.toFixed(3)} ${diagramY.toFixed(3)}) scale(${diagramScale.toFixed(5)})">${art}</g>`;
  const selected = state.highlight==='identity' ? ' stroke="#c48b3e" stroke-width="2"' : '';
  art += `<rect x="32" y="24" width="270" height="72" rx="0" fill="#e8ebe6"${selected}/>`;
  art += label('CARGO / BOX-001',48,54,'font-weight="700"');
  art += label('Fictional exhibit ID',48,80,'style="font-size:18px"');
  const captions: Record<ContainerMode,string> = { identity:'A common external envelope',interior:state.packed?'Packed · same six authored blocks':'Empty · wall and floor thickness',doors:state.doorsOpen>0.5?'Open · two original door pivots':'Closed · two locking rods',road:'Road chassis · supported at the corners',rail:'Rail wagon · supported at the corners',lift:pose.contact?'Engaged spreader · taut vertical cables':'Grounded box · aligning spreader',destination:state.doorsOpen>0.5?'Open again · the original cargo':'The same doors at destination' };
  art += label(captions[state.mode],32,445,'font-weight="500"');
  art += `<text x="32" y="473" fill="#526169" font-family="Arial, sans-serif" font-size="18">Schematic geometry · not a handling guide</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%" role="img" aria-label="${describeContainerState(state)}" data-container-id="BOX-001" data-mode="${state.mode}" data-packed="${state.packed}" data-doors-open="${state.doorsOpen.toFixed(3)}" data-lift-contact="${pose.contact}"><title>CARGO / BOX-001 — ${captions[state.mode]}</title>${art}</svg>`;
}
