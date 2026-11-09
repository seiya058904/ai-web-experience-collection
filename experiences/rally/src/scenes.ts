import {
  COURT, aReady, bReady, bContact, branches, comparisonTrajectories,
  mainRallyPreset, mainTrajectory, mainRebound, handbacks, netHeightAt, samplePath, sampleReplay,
  type Vec3, type Trajectory, type PathSample, type ReturnChoice, type SpinPreset,
} from './physics.ts';

export type CourtMode = 'prepare' | 'space' | 'choice' | 'replay' | 'final';
export type CourtView = 'A' | 'B';
export type CourtOptions = { choice: ReturnChoice; view: CourtView; time?: number; progress?: number; showSpace?: boolean };
type Point = { x: number; y: number };
const clamp = (n: number) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
const smooth = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
const mix = (a: Vec3, b: Vec3, t: number): Vec3 => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });
const f = (n: number) => Number.isFinite(n) ? n.toFixed(2) : '0';
const escape = (s: string) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const svgNS = 'http://www.w3.org/2000/svg';
let sceneSequence = 0;

/** Shared orthographic oblique projection. Perspective changes never change identity. */
function project(p: Vec3, view: CourtView = 'A'): Point {
  const direction = view === 'A' ? 1 : -1;
  return { x: 340 + direction * p.x * 31, y: 350 - direction * p.y * 22.2 - p.z * 17.5 };
}
function ground(x: number, y: number): Vec3 { return { x, y, z: 0 }; }
function feetAt(contact: Vec3, actor: CourtView): Vec3 {
  return { x: contact.x + (actor === 'A' ? .25 : -.25), y: contact.y + (actor === 'A' ? -.4 : .4), z: 0 };
}
function pointsPath(points: readonly Vec3[], view: CourtView = 'A', floor = false): string {
  return points.map((p, i) => {
    const q = project(floor ? { ...p, z: 0 } : p, view);
    return `${i ? 'L' : 'M'}${f(q.x)},${f(q.y)}`;
  }).join(' ');
}
function sampledPoints(path: Trajectory, elapsed = path.duration): readonly Vec3[] {
  const t = Math.max(0, Math.min(path.duration, elapsed));
  if (t <= 0) return [path.samples[0]!];
  const points: Vec3[] = [];
  // Retain the actual solver samples and the exact interpolated playhead endpoint.
  for (const s of path.samples) { if (s.t > t) break; points.push(s); }
  const endpoint = samplePath(path, t);
  if (!points.length || (points[points.length - 1] as PathSample).t !== endpoint.t) points.push(endpoint);
  return points;
}
function fullLeg(first: Trajectory, second?: Trajectory): readonly Vec3[] {
  return second ? [...first.samples, ...second.samples.slice(1)] : first.samples;
}
function route(d: string, color: string, width = 2.6, dash = '', opacity = 1): string {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${dash ? ` stroke-dasharray="${dash}"` : ''} opacity="${opacity}"/>`;
}
/** A branch's line style is identity, not selected/unselected UI state. */
const returnDash = (choice: ReturnChoice): string => choice === 'line' ? '5 7' : '';
function circleMarker(position: Vec3, view: CourtView, color: string, radius = 5): string {
  const p = project({ ...position, z: 0 }, view);
  return `<ellipse cx="${f(p.x)}" cy="${f(p.y)}" rx="${radius}" ry="${f(radius * .72)}" fill="${color}" fill-opacity=".18" stroke="${color}" stroke-width="1.4"/>`;
}

function definitions(id: string): string {
  return `<defs>
    <linearGradient id="${id}-clay" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d18460"/><stop offset=".5" stop-color="#c56e4e"/><stop offset="1" stop-color="#ae593f"/></linearGradient>
    <radialGradient id="${id}-ball" cx=".32" cy=".26"><stop stop-color="#edf59b"/><stop offset=".58" stop-color="#ddea54"/><stop offset="1" stop-color="#a4b535"/></radialGradient>
    <pattern id="${id}-claygrain" width="64" height="64" patternUnits="userSpaceOnUse"><g fill="#f4f0e4" opacity=".12"><circle cx="8" cy="11" r=".65"/><circle cx="36" cy="3" r=".7"/><circle cx="22" cy="38" r=".7"/><circle cx="57" cy="48" r=".9"/><circle cx="46" cy="24" r=".6"/><path d="M4 52h2m23-31h2m18 37h2" stroke="#f4f0e4" stroke-width=".7"/></g><g fill="#713c2d" opacity=".12"><circle cx="28" cy="12" r=".6"/><circle cx="6" cy="33" r=".7"/><circle cx="42" cy="45" r=".8"/><circle cx="60" cy="16" r=".8"/></g></pattern>
  </defs>`;
}
function courtFloor(id: string): string {
  const line = (a: Vec3, b: Vec3, width = 1.55) => route(pointsPath([a, b]), '#f4f0e4', width, '', .9);
  const w = COURT.halfWidth, l = COURT.halfLength, s = COURT.serviceLine;
  const boundary = [ground(-w, -l), ground(w, -l), ground(w, l), ground(-w, l), ground(-w, -l)];
  return `<rect width="680" height="700" fill="url(#${id}-clay)"/>
    <rect width="680" height="700" fill="url(#${id}-claygrain)"/>
    <path d="M0 85Q240 45 680 116M0 617Q360 659 680 601" fill="none" stroke="#f4f0e4" stroke-opacity=".045" stroke-width="42"/>
    ${route(pointsPath(boundary), '#f4f0e4', 1.7, '', .94)}
    ${line(ground(-w, s), ground(w, s))}${line(ground(-w, -s), ground(w, -s))}
    ${line(ground(0, -s), ground(0, s))}
    ${line(ground(0, -l), ground(0, -l + .16), 2.1)}${line(ground(0, l), ground(0, l - .16), 2.1)}
    <path d="M180 118q-9 26-1 43m328 385q-8 28-1 49M242 623q31 9 52 2" fill="none" stroke="#75402d" stroke-opacity=".08" stroke-width="2"/>`;
}
function netMarkup(view: CourtView = 'A'): string {
  const width = COURT.netHalfWidth;
  const top: Vec3[] = [];
  for (let i = 0; i <= 40; i++) { const x = -width + i / 40 * width * 2; top.push({ x, y: 0, z: netHeightAt(x) }); }
  const bottom: Vec3[] = [{ x: width, y: 0, z: 0 }, { x: -width, y: 0, z: 0 }];
  const shadow = [ground(-width, .08), ground(width, .08), ground(width + .36, -.48), ground(-width + .36, -.48)];
  let threads = '';
  for (let x = -width; x <= width; x += .16) threads += route(pointsPath([{ x, y: 0, z: 0 }, { x, y: 0, z: netHeightAt(x) }], view), '#20343b', .55, '', .55);
  for (let z = .14; z < COURT.netHeight; z += .14) threads += route(pointsPath([{ x: -width, y: 0, z }, { x: width, y: 0, z }], view), '#20343b', .55, '', .55);
  return `<g aria-hidden="true"><path d="${pointsPath(shadow, view)}Z" fill="#243840" opacity=".13"/>
    <path d="${pointsPath([...top, ...bottom], view)}Z" fill="#243840" opacity=".13"/>${threads}
    ${route(pointsPath(top, view), '#f4f0e4', 2.5)}
    ${route(pointsPath([{ x: -width, y: 0, z: 0 }, { x: -width, y: 0, z: COURT.netPostHeight + .07 }], view), '#56625d', 4)}
    ${route(pointsPath([{ x: width, y: 0, z: 0 }, { x: width, y: 0, z: COURT.netPostHeight + .07 }], view), '#56625d', 4)}
    ${route(pointsPath([{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: COURT.netHeight }], view), '#f4f0e4', 2)}
  </g>`;
}
function playerMarkup(actor: CourtView, base: string): string {
  // The cutouts have different framing. Anchor each image at its actual shoe midpoint,
  // not at the image centre, so both sprite feet and world ground shadows stay together.
  const sprite = actor === 'A' ? { x: -27.8, y: -66.8, width: 75, height: 75 } : { x: -46.3, y: -66.3, width: 75, height: 78.93 };
  return `<g data-player="${actor}" aria-hidden="true">
    <ellipse data-player-shadow cx="8" cy="3" rx="22" ry="6.5" fill="#243840" opacity=".18" transform="rotate(-18)"/>
    <g data-player-image>
      <g data-player-fallback visibility="hidden" fill="${actor === 'A' ? '#243840' : '#f4f0e4'}" stroke="${actor === 'A' ? '#f4f0e4' : '#243840'}" stroke-width="1.2"><circle cx="0" cy="-26" r="6.5"/><path d="M-12-12Q0-24 12-12L10 1H-10Z"/></g>
      <image href="${escape(base)}art/player-${actor.toLowerCase()}.webp" x="${sprite.x}" y="${sprite.y}" width="${sprite.width}" height="${sprite.height}" preserveAspectRatio="xMidYMid meet"/>
    </g>
    <g data-player-label transform="translate(0 27)"><circle r="13" fill="${actor === 'A' ? '#243840' : '#f4f0e4'}"/><text y="6.3" text-anchor="middle" fill="${actor === 'A' ? '#f4f0e4' : '#243840'}" font-size="18" font-weight="700">${actor}</text></g>
  </g>`;
}
function ballMarkup(id: string): string {
  return `<ellipse data-ball-shadow cx="0" cy="0" rx="5" ry="2.7" fill="#243840" opacity=".24"/>
  <g data-ball="true" aria-hidden="true"><circle r="6.8" fill="url(#${id}-ball)" stroke="#e8ef9c" stroke-width=".5"/>
  <g data-seam fill="none" stroke="#f4f0e4" stroke-width="1.1"><path d="M-5.6-3.8Q1-1.5-2.2 6.2M3.8-5.6Q-.2.7 6.5 1.6"/></g></g>`;
}
function setPlayer(node: SVGGElement, position: Vec3, view: CourtView): void {
  const p = project(position, view);
  node.setAttribute('transform', `translate(${f(p.x)} ${f(p.y)})`);
  node.dataset.worldX = f(position.x); node.dataset.worldY = f(position.y);
  node.querySelector('[data-player-image]')!.setAttribute('transform', view === 'B' ? 'rotate(180)' : 'rotate(0)');
  node.querySelector('[data-player-label]')!.setAttribute('transform', view === 'B' ? 'translate(0 -28)' : 'translate(0 27)');
  node.querySelector('[data-player-shadow]')!.setAttribute('transform', view === 'B' ? 'rotate(162)' : 'rotate(-18)');
}
function setBall(svg: SVGSVGElement, position: Vec3, view: CourtView, rotation = 0): void {
  const p = project(position, view), shadow = project({ ...position, z: 0 }, view);
  const ball = svg.querySelector<SVGGElement>('[data-ball]')!;
  ball.setAttribute('transform', `translate(${f(p.x)} ${f(p.y)})`);
  ball.dataset.worldX = f(position.x); ball.dataset.worldY = f(position.y); ball.dataset.worldZ = f(position.z);
  ball.querySelector('[data-seam]')!.setAttribute('transform', `rotate(${f(rotation)})`);
  const shade = svg.querySelector<SVGEllipseElement>('[data-ball-shadow]')!;
  shade.setAttribute('cx', f(shadow.x)); shade.setAttribute('cy', f(shadow.y));
  shade.setAttribute('rx', f(4.2 + position.z * 1.2)); shade.setAttribute('ry', f(2.4 + position.z * .55));
  shade.setAttribute('opacity', f(.32 / (1 + position.z * .45)));
}

/** DOM controls live outside the scene; render is a pure evaluation of explicit state. */
export class CourtScene {
  readonly svg: SVGSVGElement;
  private readonly mode: CourtMode;
  private readonly id = `rally-court-${++sceneSequence}`;
  private readonly traces: SVGGElement;
  private readonly markers: SVGGElement;
  private readonly spaces: SVGGElement;
  private readonly playerA: SVGGElement;
  private readonly playerB: SVGGElement;
  private traceKey = '';
  private renderedView: CourtView | undefined;
  constructor(host: HTMLElement, mode: CourtMode) {
    this.mode = mode;
    const base = `${import.meta.env.BASE_URL}rally/`;
    host.innerHTML = `<svg class="court-svg" viewBox="0 0 680 700" xmlns="${svgNS}" role="img" aria-labelledby="${this.id}-title ${this.id}-desc" style="display:block;width:100%;height:auto;font-family:Arial,Helvetica,sans-serif">
      <title id="${this.id}-title">The shared singles court</title><desc id="${this.id}-desc">A begins at the near end, B at the far end. Court lines, players, ball and paths share the same coordinates.</desc>
      ${definitions(this.id)}${courtFloor(this.id)}<g data-space></g><g data-traces></g><g data-markers></g><g data-net>${netMarkup()}</g>
      ${playerMarkup('A', base)}${playerMarkup('B', base)}${ballMarkup(this.id)}
      <text data-near-end x="340" y="676" text-anchor="middle" fill="#f4f0e4" fill-opacity=".7" font-size="16" letter-spacing="3">A’S END</text>
      <text x="26" y="676" fill="#f4f0e4" fill-opacity=".7" font-size="14">Ball enlarged</text>
    </svg>`;
    this.svg = host.querySelector('svg')!;
    this.traces = this.svg.querySelector('[data-traces]')!;
    this.markers = this.svg.querySelector('[data-markers]')!;
    this.spaces = this.svg.querySelector('[data-space]')!;
    this.playerA = this.svg.querySelector('[data-player="A"]')!;
    this.playerB = this.svg.querySelector('[data-player="B"]')!;
    for (const player of [this.playerA, this.playerB]) {
      const image = player.querySelector('image')!;
      const fallback = player.querySelector('[data-player-fallback]')!;
      image.addEventListener('error', () => {
        image.setAttribute('visibility', 'hidden');
        fallback.setAttribute('visibility', 'visible');
        player.dataset.assetState = 'fallback';
      });
      image.addEventListener('load', () => {
        image.removeAttribute('visibility');
        fallback.setAttribute('visibility', 'hidden');
        player.dataset.assetState = 'photograph';
      });
    }
    this.render({ choice: 'crosscourt', view: 'A', progress: 1 });
  }
  render(options: CourtOptions): void {
    const { choice, view } = options, branch = branches[choice];
    const progress = clamp(options.progress ?? 1);
    let a: Vec3 = aReady, b: Vec3 = feetAt(bContact, 'B'), ball: Vec3 = bContact;
    let rotation = 0;
    if (this.mode === 'prepare') {
      a = mix(aReady, feetAt(mainRallyPreset.origin, 'A'), smooth(progress)); b = bReady; ball = mainRallyPreset.origin;
    } else if (this.mode === 'space') {
      a = mix(feetAt(mainRallyPreset.origin, 'A'), aReady, smooth(progress));
      b = mix(bReady, feetAt(bContact, 'B'), smooth(progress));
      ball = samplePath(mainRebound, progress * mainRebound.duration); rotation = progress * 180;
    } else if (this.mode === 'replay') {
      const frame = sampleReplay(choice, options.time ?? 0);
      a = frame.a; b = frame.b; ball = frame.ball; rotation = frame.time * 290;
    } else if (this.mode === 'final') {
      const frame = sampleReplay(choice, branch.duration);
      a = mix(frame.a, aReady, smooth(progress));
      b = mix(frame.b, bReady, smooth(progress));
      ball = samplePath(handbacks[choice], progress * handbacks[choice].duration);
    }
    setPlayer(this.playerA, a, view); setPlayer(this.playerB, b, view); setBall(this.svg, ball, view, rotation);
    this.svg.querySelector('[data-near-end]')!.textContent = `${view}’S END`;
    this.svg.dataset.choice = choice; this.svg.dataset.view = view; this.svg.dataset.mode = this.mode;
    const now = Math.max(0, Math.min(branch.duration, options.time ?? 0));
    const key = `${choice}|${view}|${this.mode === 'replay' ? now.toFixed(4) : ''}`;
    if (key !== this.traceKey) {
      this.traceKey = key;
      this.drawRoutes(choice, view, now);
    }
    if (view !== this.renderedView) {
      this.renderedView = view;
      this.svg.querySelector('[data-net]')!.innerHTML = netMarkup(view);
    }
    const show = options.showSpace ?? (this.mode === 'space');
    if (show) {
      const p = project(branch.openSpace, view);
      this.spaces.innerHTML = `<ellipse cx="${f(p.x)}" cy="${f(p.y)}" rx="37" ry="53" fill="#f4f0e4" fill-opacity=".055" stroke="#f4f0e4" stroke-opacity=".6" stroke-width="1.1" stroke-dasharray="4 6"/><text x="${f(p.x)}" y="${f(p.y + 4)}" text-anchor="middle" fill="#f4f0e4" font-size="17">Open space</text>`;
    } else this.spaces.replaceChildren();
    const title = this.mode === 'choice' ? `B’s two possible returns; ${branch.label.toLowerCase()} selected` : this.mode === 'replay' ? `${branch.label} replay: ${sampleReplay(choice, now).event.label}` : this.mode === 'final' ? (progress < 1 ? 'B gently returns the ball to A' : `Your ${branch.label.toLowerCase()} rally; the ball is back with A`) : this.mode === 'space' ? 'B moves towards the ball; A recovers' : 'A prepares to strike; B waits at the other end';
    this.svg.querySelector('title')!.textContent = title;
    this.svg.querySelector('desc')!.textContent = `Viewed from ${view}’s end. A and B keep their original identities. The ball marker is enlarged for visibility; its center follows the exact model trajectory. ${this.mode === 'choice' || this.mode === 'replay' || this.mode === 'final' ? branch.spaceDescription : 'The yellow ball, its ground shadow and the clay contact mark use the same court coordinates.'}`;
  }
  private drawRoutes(choice: ReturnChoice, view: CourtView, now: number): void {
    const branch = branches[choice];
    let paths = '', markers = '';
    if (this.mode === 'prepare') {
      // This quiet preparation frame contains no invented incoming trajectory.
    } else if (this.mode === 'space') {
      paths = route(pointsPath(fullLeg(mainTrajectory, mainRebound), view), '#f4f0e4', 2, '3 7', .64);
      markers = circleMarker(mainTrajectory.landing!, view, '#f4f0e4', 6);
    } else if (this.mode === 'choice') {
      for (const key of ['crosscourt', 'line'] as const) {
        const active = key === choice, item = branches[key];
        paths += `<g data-return-route="${key}">${route(pointsPath(item.returnFlight.samples, view), active ? '#ddea54' : '#f4f0e4', active ? 3.3 : 2, returnDash(key), active ? 1 : .62)}</g>`;
        markers += circleMarker(item.returnFlight.landing!, view, active ? '#ddea54' : '#f4f0e4', active ? 6 : 4.8);
      }
    } else if (this.mode === 'replay') {
      paths = route(pointsPath(sampledPoints(branch.returnFlight, now), view), '#ddea54', 3, returnDash(choice));
      if (now >= branch.returnFlight.duration) {
        paths += route(pointsPath(sampledPoints(branch.rebound, now - branch.returnFlight.duration), view), '#ddea54', 3, returnDash(choice));
        markers += circleMarker(branch.returnFlight.landing!, view, '#ddea54', 6);
      }
      if (now >= branch.events[2]!.time) paths += route(pointsPath(sampledPoints(branch.responseFlight, now - branch.events[2]!.time), view), '#c6e2e7', 2.8);
      markers += circleMarker(mainTrajectory.landing!, view, '#f4f0e4', 4);
    } else {
      paths = route(pointsPath(fullLeg(mainTrajectory, mainRebound), view), '#f4f0e4', 2, '3 6', .75)
        + route(pointsPath(fullLeg(branch.returnFlight, branch.rebound), view), '#ddea54', 3, returnDash(choice))
        + route(pointsPath(branch.responseFlight.samples, view), '#c6e2e7', 2.7);
      markers = circleMarker(mainTrajectory.landing!, view, '#f4f0e4', 5) + circleMarker(branch.returnFlight.landing!, view, '#ddea54', 6);
    }
    this.traces.innerHTML = paths; this.markers.innerHTML = markers;
  }
}

const side = (p: Vec3): Point => ({ x: 76 + (p.y + COURT.halfLength) * 21, y: 306 - p.z * 67 });
function sidePath(points: readonly Vec3[]): string {
  return points.map((p, i) => { const q = side(p); return `${i ? 'L' : 'M'}${f(q.x)},${f(q.y)}`; }).join(' ');
}
export class FlightScene {
  readonly svg: SVGSVGElement;
  private readonly mode: 'comparison' | 'net';
  private readonly id = `rally-flight-${++sceneSequence}`;
  private readonly paths: SVGGElement;
  constructor(host: HTMLElement, mode: 'comparison' | 'net') {
    this.mode = mode;
    const net = side({ x: mainTrajectory.netCrossing!.x, y: 0, z: netHeightAt(mainTrajectory.netCrossing!.x) });
    const baseline = side(ground(0, COURT.halfLength));
    const start = side(mainTrajectory.origin);
    const cream = mode === 'comparison' ? '#f4f0e4' : '#243840';
    host.innerHTML = `<svg class="flight-svg" viewBox="0 0 680 400" xmlns="${svgNS}" role="img" aria-labelledby="${this.id}-title ${this.id}-desc" style="display:block;width:100%;height:auto;font-family:Arial,Helvetica,sans-serif">
      <title id="${this.id}-title">${mode === 'comparison' ? 'Only spin changes' : 'A’s topspin ball clears the net'}</title>
      <desc id="${this.id}-desc">${mode === 'comparison' ? 'Both flights begin with identical position and complete initial velocity. The no-spin ball lands beyond B’s baseline; topspin brings this preset inside.' : 'The main topspin preset crosses above the net and lands inside B’s half.'}</desc>
      ${definitions(this.id)}
      <path d="M48 306H632" stroke="${cream}" stroke-opacity=".45" stroke-width="1.3"/>
      <path d="M76 300v12M${f(baseline.x)} 300v12" stroke="${cream}" stroke-opacity=".6" stroke-width="1.5"/>
      <path d="M${f(net.x)} 306V${f(net.y)}" stroke="${cream}" stroke-opacity=".65" stroke-width="2.2"/>
      <path d="M${f(net.x - 5)} ${f(net.y)}h10" stroke="${cream}" stroke-width="3"/>
      <g data-flight-paths></g>
      <path d="M${f(start.x - 5)} ${f(start.y)}h10m-5-5v10" stroke="${cream}" stroke-width="1.4"/>
      <text x="${f(start.x)}" y="${f(start.y + 32)}" fill="${cream}" font-size="20">A</text>
      <text x="${f(net.x)}" y="346" text-anchor="middle" fill="${cream}" fill-opacity=".8" font-size="21">Net</text>
      <text x="${f(baseline.x)}" y="379" text-anchor="middle" fill="${cream}" fill-opacity=".7" font-size="20">B’s baseline</text>
      <text x="76" y="379" fill="${cream}" fill-opacity=".7" font-size="18">Ball enlarged</text>
      <g data-clearance></g>
      <g data-flight-ball><circle r="7.5" fill="url(#${this.id}-ball)" stroke="#f4f0e4" stroke-width=".6"/><path d="M-6-4Q1-1-2 7M4-6Q0 1 7 2" fill="none" stroke="#f4f0e4" stroke-width="1.1"/></g>
    </svg>`;
    this.svg = host.querySelector('svg')!; this.paths = this.svg.querySelector('[data-flight-paths]')!;
    this.render({ spin: 'topspin', progress: .5 });
  }
  render(options: { spin: SpinPreset; progress: number }): void {
    const spin = this.mode === 'net' ? 'topspin' : options.spin;
    const path = comparisonTrajectories[spin], progress = clamp(options.progress);
    const selected = samplePath(path, progress * path.duration), p = side(selected);
    this.svg.querySelector('[data-flight-ball]')!.setAttribute('transform', `translate(${f(p.x)} ${f(p.y)})`);
    this.svg.dataset.spin = spin; this.svg.dataset.progress = f(progress);
    const primary = this.mode === 'comparison' ? '#ddea54' : '#58714a';
    if (this.mode === 'comparison') {
      this.paths.innerHTML = route(sidePath(comparisonTrajectories.none.samples), '#c6e2e7', spin === 'none' ? 3.3 : 2, '7 7', spin === 'none' ? 1 : .56)
        + route(sidePath(mainTrajectory.samples), primary, spin === 'topspin' ? 3.3 : 2, '', spin === 'topspin' ? 1 : .56)
        + `<text x="76" y="52" fill="#f4f0e4" font-size="21">Same start. Same launch. Different spin.</text>`
        + `<path d="M76 82h32" stroke="#ddea54" stroke-width="3"/><text x="120" y="89" fill="#f4f0e4" font-size="21">Topspin · inside</text>`
        + `<path d="M376 82h32" stroke="#c6e2e7" stroke-width="3" stroke-dasharray="6 5"/><text x="420" y="89" fill="#f4f0e4" font-size="21">No spin · long</text>`;
    } else {
      this.paths.innerHTML = route(sidePath(mainTrajectory.samples), primary, 3)
        + `<text x="76" y="52" fill="#243840" font-size="22">Back to this rally: A’s topspin ball</text>`;
      const crossing = mainTrajectory.netCrossing!, c = side(crossing);
      const n = side({ x: crossing.x, y: 0, z: netHeightAt(crossing.x) });
      const labelX = c.x + 24, labelY = (c.y + n.y) / 2;
      this.svg.querySelector('[data-clearance]')!.innerHTML = `<path d="M${f(c.x + 10)} ${f(c.y + COURT.ballRadius * 67)}V${f(n.y)}m-4 0h8M${f(c.x + 6)} ${f(c.y + COURT.ballRadius * 67)}h8" fill="none" stroke="#243840" stroke-opacity=".6" stroke-width="1.3"/><text x="${f(labelX)}" y="${f(labelY + 6)}" fill="#243840" font-size="20">Clearance</text>`;
    }
  }
}

/** A complete, portable vector result; no embedded scripts, fonts or remote images. */
export function createRallySVG(choice: ReturnChoice, view: CourtView = 'A'): string {
  const branch = branches[choice], id = 'rally-export';
  const end = { a: aReady, b: bReady, ball: samplePath(handbacks[choice], handbacks[choice].duration) };
  const marker = (actor: CourtView, point: Vec3) => {
    const p = project(point, view), dark = actor === 'A';
    return `<g transform="translate(${f(p.x)} ${f(p.y)})"><circle r="13" fill="${dark ? '#243840' : '#f4f0e4'}"/><text y="6" text-anchor="middle" font-size="18" font-weight="700" fill="${dark ? '#f4f0e4' : '#243840'}">${actor}</text></g>`;
  };
  const ball = project(end.ball, view), shadow = project({ ...end.ball, z: 0 }, view);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="${svgNS}" width="1020" height="1350" viewBox="0 0 680 900" role="img" aria-labelledby="title desc" font-family="Arial,Helvetica,sans-serif">
  <title id="title">RALLY — ${escape(branch.label)} / ${view}’s view</title>
  <desc id="desc">An original fictional practice rally. White dotted line: A’s opening topspin. Yellow line: B’s selected ${escape(branch.label.toLowerCase())} return. Blue line: A’s answer, received by B. After the practice, B gently returned the ball to A. Every route and contact is sampled from the same demonstration model as the website. ${escape(branch.spaceDescription)}</desc>
  ${definitions(id)}<rect width="680" height="900" fill="#f4f0e4"/>
  <text x="34" y="57" fill="#243840" font-size="45" font-weight="700" letter-spacing="-2">RALLY</text>
  <text x="646" y="42" fill="#243840" font-size="14" text-anchor="end" letter-spacing="2">THE SPACE BETWEEN</text>
  <text x="646" y="66" fill="#243840" font-size="16" text-anchor="end">${escape(branch.label)} / ${view}’s view</text>
  <g transform="translate(0 93)">${courtFloor(id)}
    ${route(pointsPath(fullLeg(mainTrajectory, mainRebound), view), '#f4f0e4', 2, '3 6', .8)}
    ${route(pointsPath(fullLeg(branch.returnFlight, branch.rebound), view), '#ddea54', 3, returnDash(choice))}
    ${route(pointsPath(branch.responseFlight.samples, view), '#c6e2e7', 2.7)}
    ${circleMarker(mainTrajectory.landing!, view, '#f4f0e4', 5)}${circleMarker(branch.returnFlight.landing!, view, '#ddea54', 6)}${netMarkup(view)}
    ${marker('A', end.a)}${marker('B', end.b)}
    <ellipse cx="${f(shadow.x)}" cy="${f(shadow.y)}" rx="5" ry="2.7" fill="#243840" opacity=".25"/>
    <circle cx="${f(ball.x)}" cy="${f(ball.y)}" r="6.8" fill="url(#${id}-ball)" stroke="#f4f0e4" stroke-width=".6"/>
  </g>
  <text x="34" y="827" fill="#243840" font-size="17">${escape(branch.spaceDescription)}</text>
  <text x="34" y="858" fill="#243840" fill-opacity=".7" font-size="13">A begins near. B begins far. Their identities stay the same in either view.</text>
  <text x="34" y="880" fill="#243840" fill-opacity=".6" font-size="12">Original fictional rally · Simplified demonstration model · Not a professional training simulation</text>
</svg>`;
}
