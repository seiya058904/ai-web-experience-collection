import {
  COURT, aReady, bReady, bContact, branches, comparisonTrajectories,
  mainRallyPreset, mainTrajectory, mainRebound, samplePath, sampleReplay,
  type Vec3, type Trajectory, type ReturnChoice,
} from './physics';

type FocusState = 'before' | 'contact' | 'after';
type View = 'A' | 'B';
type Point = { x: number; y: number };
const NS = 'http://www.w3.org/2000/svg';
const cream = '#F4F0E4';
const navy = '#243840';
const blue = '#9fcbd3';
let sequence = 0;
const clamp = (n: number) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
const f = (n: number) => Number.isFinite(n) ? n.toFixed(3) : '0';
const escape = (s: string) => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const base = `${import.meta.env.BASE_URL}rally/`;
const ground = (x: number, y: number): Vec3 => ({ x, y, z: 0 });
const mix3 = (a: Vec3, b: Vec3, t: number): Vec3 => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t) });

function makeSVG(host: HTMLElement, id: string, title: string, description: string, content: string): SVGSVGElement {
  host.innerHTML = `<svg class="focus-svg" viewBox="0 0 800 600" xmlns="${NS}" role="img" aria-labelledby="${id}-title ${id}-description" style="display:block;width:100%;height:auto;overflow:visible">
    <title id="${id}-title">${title}</title><desc id="${id}-description">${description}</desc>${content}</svg>`;
  const svg = host.querySelector<SVGSVGElement>('svg')!;
  // SVG <image> is not covered by the page's HTML <img> fallback handlers.
  // Start with an aligned backplate, then let the actual resource event settle it.
  svg.querySelectorAll<SVGImageElement>('image[data-ball-photo]').forEach(photo => {
    const fallback = photo.parentElement!.querySelector<SVGGElement>('[data-ball-fallback]')!;
    photo.addEventListener('load', () => {
      photo.removeAttribute('visibility');
      fallback.setAttribute('display', 'none');
      svg.dataset.ballPhotoState = 'ready';
    });
    photo.addEventListener('error', () => {
      photo.setAttribute('visibility', 'hidden');
      fallback.removeAttribute('display');
      // Restore the exact unit radius on failure, preserving the ground pivot.
      fallback.setAttribute('transform', 'scale(1)');
      svg.dataset.ballPhotoState = 'fallback';
    });
  });
  svg.querySelectorAll<SVGGElement>('[data-bridge-player]').forEach(player => {
    const photo = player.querySelector<SVGImageElement>('image')!;
    const fallback = player.querySelector<SVGGElement>('[data-bridge-player-fallback]')!;
    const label = player.querySelector<SVGGElement>('[data-bridge-player-label]')!;
    photo.addEventListener('load', () => {
      photo.removeAttribute('visibility');
      fallback.setAttribute('visibility', 'hidden');
      label.setAttribute('visibility', 'hidden');
      player.dataset.photoState = 'ready';
    });
    photo.addEventListener('error', () => {
      photo.setAttribute('visibility', 'hidden');
      fallback.removeAttribute('visibility');
      label.removeAttribute('visibility');
      player.dataset.photoState = 'fallback';
    });
  });
  return svg;
}

/** Normalise the visible generated silhouette rather than its transparent padding. */
function photoBall(): string {
  return `<g data-focus-ball aria-hidden="true"><g data-ball-spin>
    <g data-ball-fallback transform="scale(.85)">
      <circle r="1" fill="#ddea54"/>
      <path d="M-.84-.52Q.14-.21-.32.94M.56-.82Q-.05.12.98.24" fill="none" stroke="#f4f0e4" stroke-width=".055" stroke-linecap="round"/>
      <path d="M-.76-.43Q-.57-.83-.15-.86" fill="none" stroke="#f2f6b2" stroke-width=".045" stroke-linecap="round" opacity=".7"/>
    </g>
    <image data-ball-photo href="${escape(base)}art/ball.webp" x="-1.1463" y="-1.13661" width="2.32222" height="2.28415" preserveAspectRatio="none"/>
  </g></g>`;
}

function ballPose(node: SVGGElement, p: Point, rx: number, ry = rx, angle = 0): void {
  node.setAttribute('transform', `translate(${f(p.x)} ${f(p.y)}) scale(${f(rx)} ${f(ry)})`);
  node.querySelector('[data-ball-spin]')!.setAttribute('transform', `rotate(${f(angle)})`);
}

function racketDefinitions(id: string): string {
  return `<defs>
    <clipPath id="${id}-strings-clip"><ellipse rx="91" ry="142"/></clipPath>
    <linearGradient id="${id}-frame" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#61716e"/><stop offset=".22" stop-color="#243840"/><stop offset=".65" stop-color="#192c35"/><stop offset="1" stop-color="#8d9990"/></linearGradient>
    <linearGradient id="${id}-grip" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#203038"/><stop offset=".5" stop-color="#506169"/><stop offset="1" stop-color="#172a32"/></linearGradient>
  </defs>`;
}

/** One believable frame, open throat, wound grip and independently bowed strings. */
function racketMarkup(id: string): string {
  let grip = '';
  for (let y = 224; y <= 319; y += 9) grip += `<path d="M-12 ${y}l24-6" stroke="#b5b6a3" stroke-width="1.1" opacity=".5"/>`;
  return `<g data-focus-racket aria-hidden="true">
    <path d="M-44 127L-9 209L9 209L44 127" fill="none" stroke="url(#${id}-frame)" stroke-width="10" stroke-linejoin="round"/>
    <path d="M-35 137L0 200L35 137" fill="none" stroke="#c6cebf" stroke-width="1.4" opacity=".7"/>
    <path d="M-10 204h20l3 120q-12 8-26 0Z" fill="url(#${id}-grip)"/>
    ${grip}<path d="M-13 322q13 5 26 0" stroke="#e6e1cf" stroke-width="5"/>
    <ellipse rx="102" ry="154" fill="#f4f0e4" fill-opacity=".025" stroke="url(#${id}-frame)" stroke-width="15"/>
    <ellipse rx="94" ry="146" fill="none" stroke="#ddd8c5" stroke-width="1.8" opacity=".9"/>
    <g data-strings clip-path="url(#${id}-strings-clip)" fill="none" stroke="#e6e0cc" stroke-width="1.3" opacity=".95"></g>
    <ellipse rx="107.5" ry="159.5" fill="none" stroke="#e9e4d3" stroke-width=".7" opacity=".5"/>
    <path d="M-80-105Q-97-71-102-22" fill="none" stroke="#c6e2e7" stroke-width="2.5" stroke-linecap="round" opacity=".65"/>
  </g>`;
}

function stringsMarkup(deform: number): string {
  let result = '';
  for (let x = -84; x <= 84; x += 12) {
    const reach = Math.sqrt(Math.max(0, 1 - x * x / (91 * 91))) * 143;
    const bend = deform * Math.exp(-((x - 38) ** 2) / 1800) * 11;
    result += `<path d="M${f(x)} ${f(-reach)}Q${f(x + bend)} -15 ${f(x)} ${f(reach)}"/>`;
  }
  for (let y = -132; y <= 132; y += 12) {
    const reach = Math.sqrt(Math.max(0, 1 - y * y / (142 * 142))) * 92;
    const bend = deform * Math.exp(-((y + 12) ** 2) / 2200) * 10;
    result += `<path d="M${f(-reach)} ${f(y)}Q38 ${f(y + bend)} ${f(reach)} ${f(y)}"/>`;
  }
  return result;
}

/** Explicit before/impact/departure states. No animation clocks or event handlers. */
export class ContactScene {
  readonly svg: SVGSVGElement;
  private readonly ball: SVGGElement;
  private readonly racket: SVGGElement;
  private readonly strings: SVGGElement;
  private readonly contactRing: SVGEllipseElement;
  private readonly trace: SVGPathElement;
  private previous: FocusState | null = null;
  constructor(host: HTMLElement) {
    const id = `rally-contact-${++sequence}`;
    this.svg = makeSVG(host, id, 'A single instant of contact',
      'An illustrative enlargement of A’s racquet and the same felt ball. Before, contact and after are discrete observations. Ball compression and string deflection are artistic illustrations, not measured finite-element deformation. The departure belongs to A’s fixed topspin main rally.',
      `${racketDefinitions(id)}
       <path d="M80 486L710 412" stroke="${cream}" stroke-width="2" opacity=".3"/>
       <path d="M608 331Q502 294 473 262Q560 202 678 151" data-focus-trace fill="none" stroke="${navy}" stroke-width="1.4" stroke-dasharray="3 8" opacity=".22"/>
       ${racketMarkup(id)}
       <ellipse data-contact-ring cx="475" cy="267" rx="49" ry="39" fill="${cream}" fill-opacity=".12" stroke="${cream}" stroke-width="1.2" opacity="0"/>
       ${photoBall()}`);
    this.ball = this.svg.querySelector('[data-focus-ball]')!;
    this.racket = this.svg.querySelector('[data-focus-racket]')!;
    this.strings = this.svg.querySelector('[data-strings]')!;
    this.contactRing = this.svg.querySelector('[data-contact-ring]')!;
    this.trace = this.svg.querySelector('[data-focus-trace]')!;
    this.render('before');
  }
  render(state: FocusState): void {
    if (state === this.previous) return;
    this.previous = state;
    const contact = state === 'contact';
    const after = state === 'after';
    this.racket.setAttribute('transform', `translate(${contact ? 414 : after ? 432 : 400} ${contact ? 278 : after ? 268 : 286}) rotate(${after ? -27 : contact ? -22 : -18})`);
    this.strings.innerHTML = stringsMarkup(contact ? 1 : 0);
    // All three observations stay on the receiving side of the projected string bed.
    const p = contact ? { x: 479, y: 265 } : after ? { x: 657, y: 157 } : { x: 610, y: 325 };
    ballPose(this.ball, p, contact ? 50 : 65, contact ? 69 : 65, after ? -35 : 0);
    this.contactRing.setAttribute('opacity', contact ? '.65' : '0');
    this.trace.setAttribute('opacity', after ? '.32' : '.14');
    this.svg.dataset.state = state;
    this.svg.dataset.actor = 'A';
    const physical = after ? samplePath(mainTrajectory, .045) : mainRallyPreset.origin;
    this.ball.dataset.worldX = f(physical.x);
    this.ball.dataset.worldY = f(physical.y);
    this.ball.dataset.worldZ = f(physical.z);
    this.svg.querySelector('desc')!.textContent = `${state === 'before' ? 'Before contact: the incoming ball has a clear gap from A’s racquet.' : contact ? 'Contact: the ball compresses against the front of the string bed; the nearby strings bow, and remain behind the ball.' : 'After contact: the ball has left A’s racquet on the fixed main-rally topspin shot. Its seam changes orientation.'} This is an illustrative enlargement; the limited compression and string bend are artistic, not measured deformation.`;
  }
}

const landing = mainTrajectory.landing!;
function bounceGround(p: Vec3): Point {
  return { x: 400 + (p.y - landing.y) * 85 + (p.x - landing.x) * 18, y: 450 + (p.x - landing.x) * 25 };
}

/** The landing, the rebound origin and the mark all use one physical coordinate. */
export class BounceScene {
  readonly svg: SVGSVGElement;
  private readonly ball: SVGGElement;
  private readonly shadow: SVGEllipseElement;
  private readonly mark: SVGGElement;
  private previous: FocusState | null = null;
  constructor(host: HTMLElement) {
    const id = `rally-bounce-${++sequence}`;
    const sidelineX = landing.x >= 0 ? COURT.halfWidth : -COURT.halfWidth;
    const lineA = bounceGround(ground(sidelineX, landing.y - 8));
    const lineB = bounceGround(ground(sidelineX, landing.y + 8));
    let scratches = '';
    for (let n = 0; n < 26; n++) {
      const x = 180 + ((n * 83) % 470), y = 451 + ((n * 17) % 86);
      scratches += `<path d="M${x} ${y}l${3 + n % 8} ${n % 3 - 1}" stroke="${n % 3 ? '#8f4c36' : cream}" stroke-width="${n % 3 ? '.8' : '.55'}" opacity=".2"/>`;
    }
    this.svg = makeSVG(host, id, 'The ground answers',
      'An illustrative enlarged close-up of A’s main-rally ball landing in B’s half. The descent and rebound are sampled from the same trajectories as the full court. The ground mark stays at their shared contact coordinate; the ball never passes below the ground.',
      `<defs><radialGradient id="${id}-dust"><stop stop-color="#995039" stop-opacity=".24"/><stop offset="1" stop-color="#995039" stop-opacity="0"/></radialGradient></defs>
       <ellipse cx="410" cy="458" rx="280" ry="62" fill="url(#${id}-dust)"/>
       ${scratches}
       <path d="M${f(lineA.x)} ${f(lineA.y)}L${f(lineB.x)} ${f(lineB.y)}" fill="none" stroke="${cream}" stroke-width="5" opacity=".8"/>
       <g data-bounce-mark aria-hidden="true" data-world-x="${f(landing.x)}" data-world-y="${f(landing.y)}">
         <ellipse cx="400" cy="450" rx="64" ry="13" fill="#985338" fill-opacity=".25" stroke="#8f4c36" stroke-width="1.3" stroke-opacity=".45"/>
         <path d="M340 450Q379 439 424 443M363 459Q410 466 448 452" fill="none" stroke="${cream}" stroke-opacity=".28" stroke-width="1.5"/>
       </g>
       <ellipse data-focus-shadow cx="400" cy="450" rx="58" ry="11" fill="${navy}" opacity=".2"/>
       ${photoBall()}`);
    this.ball = this.svg.querySelector('[data-focus-ball]')!;
    this.shadow = this.svg.querySelector('[data-focus-shadow]')!;
    this.mark = this.svg.querySelector('[data-bounce-mark]')!;
    this.render('before');
  }
  render(state: FocusState): void {
    if (state === this.previous) return;
    this.previous = state;
    const contact = state === 'contact', after = state === 'after';
    const point = contact ? landing : after ? samplePath(mainRebound, Math.min(.105, mainRebound.duration)) : samplePath(mainTrajectory, Math.max(0, mainTrajectory.duration - .078));
    const floor = bounceGround(point);
    const lift = Math.max(0, point.z - COURT.ballRadius);
    const ry = contact ? 43 : 62, rx = contact ? 73 : 62;
    // The bottom, not the centre, is the deformation pivot at contact.
    const ball = { x: floor.x, y: floor.y - ry - lift * 160 };
    ballPose(this.ball, ball, rx, ry, after ? -36 : 0);
    this.shadow.setAttribute('cx', f(floor.x));
    this.shadow.setAttribute('cy', f(floor.y));
    this.shadow.setAttribute('rx', f(52 + lift * 14));
    this.shadow.setAttribute('ry', f(9 + lift * 5));
    this.shadow.setAttribute('opacity', f(.3 / (1 + lift * 1.4)));
    this.mark.setAttribute('opacity', state === 'before' ? '0' : '1');
    this.svg.dataset.state = state;
    this.svg.dataset.half = 'B';
    this.ball.dataset.worldX = f(point.x);
    this.ball.dataset.worldY = f(point.y);
    this.ball.dataset.worldZ = f(point.z);
    this.ball.dataset.groundBottom = f(floor.y - lift * 160);
    this.svg.querySelector('desc')!.textContent = `${state === 'before' ? 'Before the bounce: A’s topspin ball descends into B’s half, above its approaching ground shadow.' : contact ? 'Ground contact in B’s half: the enlarged ball compresses about its ground-facing bottom. The contact mark is at the exact main-rally landing coordinate.' : 'After the bounce: the same ball rises on the main rebound trajectory; its ground mark remains where it landed.'} Enlarged illustrative scale. Positions come from the shared model; deformation and mark size are artistic.`;
  }
}

function project(p: Vec3, view: View): Point {
  const d = view === 'A' ? 1 : -1;
  return { x: 400 + d * p.x * 31, y: 300 - d * p.y * 19 - p.z * 25 };
}
function side(p: Vec3): Point { return { x: 400 + p.y * 25, y: 460 - p.z * 87 }; }
function pathOf(points: readonly Vec3[], projection: (p: Vec3) => Point): string {
  return points.map((p, i) => { const q = projection(p); return `${i ? 'L' : 'M'}${f(q.x)} ${f(q.y)}`; }).join(' ');
}
function linePath(path: string, color = cream, width = 1.8, dash = '', opacity = 1): string {
  return `<path d="${path}" fill="none" stroke="${color}" stroke-width="${width}" opacity="${opacity}" stroke-linejoin="round" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
}
function courtMarkup(view: View): string {
  const w = COURT.halfWidth, l = COURT.halfLength, s = COURT.serviceLine, p = (v: Vec3) => project(v, view);
  return linePath(pathOf([ground(-w, -l), ground(w, -l), ground(w, l), ground(-w, l), ground(-w, -l)], p))
    + [-s, s].map(y => linePath(pathOf([ground(-w, y), ground(w, y)], p))).join('')
    + linePath(pathOf([ground(0, -s), ground(0, s)], p));
}
function overheadNet(view: View): string {
  const p = (v: Vec3) => project(v, view);
  const x = COURT.netHalfWidth;
  let mesh = '';
  for (let v = -x; v <= x; v += .28) mesh += linePath(pathOf([{ x: v, y: 0, z: 0 }, { x: v, y: 0, z: COURT.netHeight }], p), navy, .6, '', .4);
  for (let z = .18; z <= COURT.netHeight; z += .18) mesh += linePath(pathOf([{ x: -x, y: 0, z }, { x, y: 0, z }], p), navy, .6, '', .4);
  return mesh + linePath(pathOf([{ x: -x, y: 0, z: COURT.netPostHeight }, { x: 0, y: 0, z: COURT.netHeight }, { x, y: 0, z: COURT.netPostHeight }], p), cream, 3);
}
function sideNet(): string {
  return `<path d="M400 460V380.482" fill="none" stroke="${navy}" stroke-width="4" opacity=".6"/><path d="M393 380.482h14" stroke="${cream}" stroke-width="4"/>`;
}
function player(actor: View): string {
  const fill = actor === 'A' ? navy : cream, stroke = actor === 'A' ? cream : navy;
  return `<g data-bridge-player="${actor}" aria-hidden="true">
    <ellipse cx="7" cy="7" rx="23" ry="7" fill="${navy}" opacity=".16"/>
    <g data-bridge-player-body>
      <g data-bridge-player-fallback visibility="hidden" fill="${fill}" stroke="${stroke}" stroke-width="1.3">
        <circle cx="0" cy="-27" r="6.5"/>
        <path d="M-11-16Q0-23 11-16L8-3H-8Z"/>
        <path d="M-4-3L-7 0M4-3L7 0M10-12L16-11" fill="none" stroke-linecap="round" stroke-width="2.5"/>
        <ellipse cx="19" cy="-16" rx="4.5" ry="7" fill="none"/>
      </g>
      <image href="${escape(base)}art/player-${actor.toLowerCase()}.webp" x="-34" y="-57" width="69" height="73" preserveAspectRatio="xMidYMid meet"/>
    </g>
    <g data-bridge-player-label visibility="hidden" transform="translate(0 24)">
      <circle r="11" fill="${fill}" stroke="${stroke}" stroke-width="1"/>
      <text y="4.5" fill="${stroke}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="13" font-weight="700">${actor}</text>
    </g>
  </g>`;
}
function key(values: readonly number[], progress: number): number {
  const scaled = clamp(progress) * (values.length - 1);
  const i = Math.min(values.length - 2, Math.floor(scaled));
  return lerp(values[i]!, values[i + 1]!, smooth(scaled - i));
}
function setOpacity(element: Element, opacity: number): void { element.setAttribute('opacity', f(clamp(opacity))); }

const bridgeTitles = [
  'The ball reveals the person waiting', 'Waiting resolves into contact',
  'The seam opens a spin comparison', 'The trajectory returns to the court',
  'The descending ball finds the ground', 'One small mark becomes a whole court',
  'The open court offers two replies', 'The selected reply becomes a result',
  'The rally becomes a memory',
];

/**
 * Nine independently evaluable bridges. Each uses five authored local key states.
 * Progress is a value, never an accumulated event history; reverse and direct seeks
 * generate the same one-ball geometry as forward traversal.
 */
export class HandoffScene {
  readonly svg: SVGSVGElement;
  readonly index: number;
  private readonly court: SVGGElement;
  private readonly net: SVGGElement;
  private readonly routes: SVGGElement;
  private readonly comparison: SVGGElement;
  private readonly mark: SVGGElement;
  private readonly world: SVGGElement;
  private readonly racket: SVGGElement;
  private readonly ball: SVGGElement;
  private readonly shadow: SVGEllipseElement;
  private readonly playerA: SVGGElement;
  private readonly playerB: SVGGElement;
  private readonly unselected: SVGGElement;
  private currentKey = '';
  constructor(host: HTMLElement, index: number) {
    this.index = Math.max(1, Math.min(9, Math.trunc(index)));
    const id = `rally-handoff-${this.index}-${++sequence}`;
    this.svg = makeSVG(host, id, bridgeTitles[this.index - 1]!,
      'A reversible local transition. A remains the original near player and B the far player. A single ball, a shared court and a known visual anchor connect adjacent chapters. Enlarged close views are explanatory.',
      `${racketDefinitions(id)}<g data-bridge-world>
        <g data-bridge-court></g><g data-bridge-routes></g><g data-bridge-unselected></g>
        <g data-bridge-comparison></g><g data-bridge-net></g>
        <g data-bridge-mark><ellipse rx="6.5" ry="3.5" fill="#8e4932" fill-opacity=".28" stroke="#8e4932" stroke-width=".8"/></g>
        ${player('A')}${player('B')}
      </g>
      ${racketMarkup(id)}
      <ellipse data-focus-shadow cx="0" cy="0" rx="8" ry="3" fill="${navy}" opacity=".2"/>
      ${photoBall()}`);
    this.world = this.svg.querySelector('[data-bridge-world]')!;
    this.court = this.svg.querySelector('[data-bridge-court]')!;
    this.net = this.svg.querySelector('[data-bridge-net]')!;
    this.routes = this.svg.querySelector('[data-bridge-routes]')!;
    this.comparison = this.svg.querySelector('[data-bridge-comparison]')!;
    this.mark = this.svg.querySelector('[data-bridge-mark]')!;
    this.racket = this.svg.querySelector('[data-focus-racket]')!;
    this.racket.querySelector('[data-strings]')!.innerHTML = stringsMarkup(0);
    this.ball = this.svg.querySelector('[data-focus-ball]')!;
    this.shadow = this.svg.querySelector('[data-focus-shadow]')!;
    this.playerA = this.svg.querySelector('[data-bridge-player="A"]')!;
    this.playerB = this.svg.querySelector('[data-bridge-player="B"]')!;
    this.unselected = this.svg.querySelector('[data-bridge-unselected]')!;
    this.render(0, 'crosscourt', 'A');
  }

  render(progress: number, choice: ReturnChoice, view: View, replayStartTime?: number): void {
    const t = clamp(progress), i = this.index, branch = branches[choice];
    const projection = (p: Vec3) => i === 4 || i === 5 ? side(p) : project(p, view);
    const cacheKey = `${choice}:${view}`;
    if (cacheKey !== this.currentKey) {
      this.currentKey = cacheKey;
      this.court.innerHTML = i === 4 || i === 5
        ? linePath('M55 460H745', cream, 2.3)
        : courtMarkup(view);
      this.net.innerHTML = i === 4 || i === 5 ? sideNet() : overheadNet(view);
      if (i === 3 || i === 4) {
        // CH-04 comparison stays visible as an independent annotation; the main
        // line always comes from mainTrajectory, never a mutable comparison state.
        const compareProjection = i === 3 ? (p: Vec3): Point => ({ x: 70 + (p.y + 11) * 14, y: 420 - p.z * 54 }) : side;
        this.routes.innerHTML = linePath(pathOf(mainTrajectory.samples, compareProjection), navy, 2.5);
        this.comparison.innerHTML = linePath(pathOf(comparisonTrajectories.none.samples, compareProjection), blue, 2, '6 6');
      } else if (i === 7 || i === 8) {
        // Route identity owns colour and line type; selection owns emphasis.
        const otherChoice: ReturnChoice = choice === 'crosscourt' ? 'line' : 'crosscourt';
        const other = branches[otherChoice];
        this.routes.innerHTML = `<g data-return-route="${choice}">${linePath(pathOf(branch.returnFlight.samples, projection), choice === 'crosscourt' ? '#ddea54' : '#c6e2e7', 2.8, choice === 'line' ? '7 6' : '')}</g>`;
        this.unselected.innerHTML = `<g data-return-route="${otherChoice}">${linePath(pathOf(other.returnFlight.samples, projection), otherChoice === 'crosscourt' ? '#ddea54' : '#c6e2e7', 2, otherChoice === 'line' ? '7 6' : '', .64)}</g>`;
      } else if (i === 9) {
        this.routes.innerHTML = linePath(pathOf(mainTrajectory.samples, projection), cream, 1.7, '', .55)
          + linePath(pathOf(branch.returnFlight.samples, projection), choice === 'crosscourt' ? '#ddea54' : '#c6e2e7', 2.2, choice === 'line' ? '7 6' : '')
          + linePath(pathOf(branch.responseFlight.samples, projection), cream, 1.7, '', .8);
      } else {
        this.routes.innerHTML = linePath(pathOf(mainTrajectory.samples, projection), navy, 1.5, '3 7', .6);
      }
      const mp = projection(landing);
      this.mark.setAttribute('transform', `translate(${f(mp.x)} ${f(mp.y)})`);
      this.mark.dataset.worldX = f(landing.x);
      this.mark.dataset.worldY = f(landing.y);
    }

    let a: Vec3 = aReady, b: Vec3 = bReady, point: Vec3 = mainRallyPreset.origin;
    let p = projection(point), radius = 7, scale = 1, tx = 0, ty = 0;
    let courtOpacity = 1, netOpacity = 1, routesOpacity = 0, comparisonOpacity = 0;
    let playersOpacity = 1, markOpacity = 0, racketOpacity = 0, unselectedOpacity = 0;
    let racketX = 400, racketY = 290, racketScale = 1, racketAngle = -20;

    if (i === 1) {
      const u = key([0, .16, .5, .85, 1], t), end = project(mainRallyPreset.origin, view);
      p = { x: lerp(560, end.x, u), y: lerp(280, end.y, u) };
      radius = key([103, 83, 38, 13, 7], t);
      playersOpacity = key([.2, .45, .7, 1, 1], t);
      courtOpacity = key([.3, .4, .65, 1, 1], t);
      a = mix3(aReady, { x: mainRallyPreset.origin.x + .25, y: mainRallyPreset.origin.y - .4, z: 0 }, u);
    } else if (i === 2) {
      const u = key([0, .2, .48, .8, 1], t), start = project(mainRallyPreset.origin, view);
      p = { x: lerp(start.x, 610, u), y: lerp(start.y, 325, u) };
      radius = key([7, 16, 30, 49, 65], t);
      racketX = lerp(start.x - 15, 400, u); racketY = lerp(start.y, 286, u);
      racketScale = lerp(.16, 1, u); racketAngle = lerp(-8, -18, u);
      racketOpacity = key([.7, 1, 1, 1, 1], t);
      courtOpacity = netOpacity = playersOpacity = key([1, .8, .4, .12, 0], t);
    } else if (i === 3) {
      const u = key([0, .12, .46, .78, 1], t);
      p = { x: lerp(657, 612, u), y: lerp(157, 230, u) };
      radius = key([65, 74, 91, 104, 110], t);
      courtOpacity = netOpacity = playersOpacity = 0;
      racketOpacity = key([1, .6, .12, 0, 0], t);
      racketX = 432; racketY = 268; racketAngle = -27;
      routesOpacity = comparisonOpacity = key([0, .1, .6, 1, 1], t);
    } else if (i === 4) {
      point = mainTrajectory.netCrossing ?? samplePath(mainTrajectory, mainTrajectory.duration * .5);
      const target = side(point), u = key([0, .17, .5, .84, 1], t);
      p = { x: lerp(612, target.x, u), y: lerp(230, target.y, u) };
      radius = key([110, 70, 29, 11, 7], t);
      courtOpacity = netOpacity = key([0, .25, .6, 1, 1], t);
      routesOpacity = 1;
      comparisonOpacity = key([1, .45, .18, .08, 0], t);
      playersOpacity = 0;
      markOpacity = key([0, 0, .3, .8, 1], t);
    } else if (i === 5) {
      const netTime = mainTrajectory.netCrossing?.t ?? mainTrajectory.duration * .5;
      const u = key([0, .2, .5, .78, 1], t);
      point = samplePath(mainTrajectory, lerp(netTime, mainTrajectory.duration, u));
      const target = side(landing);
      scale = key([1, 1.1, 1.3, 1.65, 2], t);
      tx = (400 - target.x) * (scale - 1) / 1;
      ty = (440 - target.y) * (scale - 1) / 1;
      // Anchor the landing under the camera while moving towards it.
      tx = lerp(0, 400 - target.x * scale, u);
      ty = lerp(0, 440 - target.y * scale, u);
      p = { x: projection(point).x * scale + tx, y: projection(point).y * scale + ty };
      radius = key([7, 10, 19, 34, 48], t);
      // Keep the enlarged sphere's bottom on the actual side-view surface.
      // Its physical radius is 0.0335 m, not the seven-pixel presentation size.
      p.y -= radius - COURT.ballRadius * 87 * scale;
      playersOpacity = 0;
      routesOpacity = key([1, .8, .55, .3, .12], t);
      netOpacity = key([1, 1, .8, .2, 0], t);
      markOpacity = key([0, 0, .1, .3, 1], t);
    } else if (i === 6) {
      const u = key([0, .2, .5, .8, 1], t), anchor = projection(landing);
      point = samplePath(mainRebound, mainRebound.duration * .45);
      scale = key([3.2, 2.6, 1.85, 1.2, 1], t);
      tx = lerp(400 - anchor.x * 3.2, 0, u); ty = lerp(400 - anchor.y * 3.2, 0, u);
      const q = projection(point); p = { x: q.x * scale + tx, y: q.y * scale + ty };
      radius = key([43, 29, 18, 10, 7], t);
      courtOpacity = key([.2, .45, .75, 1, 1], t);
      netOpacity = playersOpacity = key([0, .1, .5, .9, 1], t);
      markOpacity = 1;
      b = mix3(bReady, { x: bContact.x - .25, y: bContact.y + .4, z: 0 }, u);
    } else if (i === 7) {
      point = bContact; p = projection(point);
      b = { x: bContact.x - .25, y: bContact.y + .4, z: 0 };
      routesOpacity = unselectedOpacity = key([0, .15, .55, .9, 1], t);
      markOpacity = key([1, .7, .35, .15, 0], t);
    } else if (i === 8) {
      const u = key([0, .08, .38, .7, 1], t);
      const frame = sampleReplay(choice, branch.returnFlight.duration * u);
      point = frame.ball; p = projection(point); a = frame.a; b = frame.b;
      routesOpacity = 1; unselectedOpacity = key([1, .2, 0, 0, 0], t);
      markOpacity = key([0, 0, .1, .3, 1], t);
      const m = projection(branch.returnFlight.landing!);
      this.mark.setAttribute('transform', `translate(${f(m.x)} ${f(m.y)})`);
      this.mark.dataset.worldX = f(branch.returnFlight.landing!.x);
      this.mark.dataset.worldY = f(branch.returnFlight.landing!.y);
    } else {
      const start = replayStartTime === undefined || !Number.isFinite(replayStartTime)
        ? branch.duration : Math.max(0, Math.min(branch.duration, replayStartTime));
      const connectionTime = lerp(start, branch.duration, smooth(t * 2));
      const frame = sampleReplay(choice, connectionTime);
      a = frame.a; b = frame.b; point = frame.ball;
      // Resolve the captured replay frame to B's catch over the first half.
      // This is a pure view, not a write to the replay clock. CH-10 owns handback.
      p = projection(point);
      this.svg.dataset.replayTime = f(connectionTime);
      routesOpacity = key([.35, .55, .75, .9, 1], t);
      playersOpacity = 1;
      courtOpacity = key([1, 1, .9, .8, .7], t);
      netOpacity = key([1, 1, .9, .75, .65], t);
      radius = key([7, 7, 7, 6.7, 6.5], t);
    }

    this.world.setAttribute('transform', `translate(${f(tx)} ${f(ty)}) scale(${f(scale)})`);
    setOpacity(this.court, courtOpacity); setOpacity(this.net, netOpacity);
    setOpacity(this.routes, routesOpacity); setOpacity(this.comparison, comparisonOpacity);
    setOpacity(this.unselected, unselectedOpacity); setOpacity(this.mark, markOpacity);
    setOpacity(this.racket, racketOpacity);
    this.racket.setAttribute('transform', `translate(${f(racketX)} ${f(racketY)}) rotate(${f(racketAngle)}) scale(${f(racketScale)})`);
    for (const [node, position] of [[this.playerA, a], [this.playerB, b]] as const) {
      const pp = project(position, view);
      node.setAttribute('transform', `translate(${f(pp.x)} ${f(pp.y)})`);
      node.querySelector('[data-bridge-player-body]')!.setAttribute('transform', view === 'B' ? 'rotate(180)' : 'rotate(0)');
      node.querySelector('[data-bridge-player-label]')!.setAttribute('transform', view === 'B' ? 'translate(0 -24)' : 'translate(0 24)');
      setOpacity(node, playersOpacity);
    }
    ballPose(this.ball, p, radius, radius, -t * 55);
    const sh = projection({ ...point, z: 0 });
    const sx = i <= 3 || i === 4 ? p.x + radius * .2 : sh.x * scale + tx;
    const sy = i <= 3 || i === 4 ? p.y + radius * 1.3 : sh.y * scale + ty;
    this.shadow.setAttribute('cx', f(sx)); this.shadow.setAttribute('cy', f(sy));
    this.shadow.setAttribute('rx', f(radius * .83)); this.shadow.setAttribute('ry', f(Math.max(2, radius * .13)));
    setOpacity(this.shadow, i === 3 ? 0 : .17 / (1 + point.z * .3));
    this.ball.dataset.worldX = f(point.x); this.ball.dataset.worldY = f(point.y); this.ball.dataset.worldZ = f(point.z);
    this.svg.dataset.transition = String(i); this.svg.dataset.progress = f(t);
    this.svg.dataset.choice = choice; this.svg.dataset.view = view;
  }
}
