import { PIECE_IDS } from './fragments.ts';
import { frameFor } from './scene-renderer.ts';
import { WIND_BLADE_PATH, WIND_WHEEL_PIVOT, miraGroup, miraJoints, type MiraJoints } from './stage-props.ts';
import { carrierPose, miraPlacement, piecePoseInCarrier, renderCarrierBody, renderCarrierPiece, scenePiecePose, sourceFixturePose, type PaperPose } from './carrier.ts';
import { clamp01, smoothstep, type StoryMemory } from './story-state.ts';

/** Physical foreground details for the ten zero-based chapter boundaries.
 * The root owns scene replacement and the one joined sun. Indices4–6 own one
 * canonical puppet, carrier and each found ID while both scene copies are
 * hidden. These props never grant a piece, start a clock or read prior frames.
 * Ground changes occur under registered opaque paper rather than an alpha fade.
 */
type XY = Readonly<{ x: number; y: number }>;
const n = (value: number) => Number((Number.isFinite(value) ? value : 0).toFixed(3));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const between = (a: XY, b: XY, p: number): XY => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) });
const hold = (p: number, start = 0, end = 1, edge = .15) => smoothstep((p - start) / edge) * smoothstep((end - p) / edge);
const tint = (from: string, to: string, p: number) => '#' + [1, 3, 5].map(offset => Math.round(lerp(parseInt(from.slice(offset, offset + 2), 16), parseInt(to.slice(offset, offset + 2), 16), p)).toString(16).padStart(2, '0')).join('');

/** The clip and its physical frame share one registered arched opening. */
export function windowHandoff(progress: number, width: number, height: number, mobile: boolean) {
  const p = clamp01(progress), q = smoothstep(p);
  const city = frameFor(0, width, height), room = frameFor(1, width, height);
  const from = { x: city.left + (mobile ? 674 : 1408) * city.scale, y: city.top + (mobile ? 1415 : 792) * city.scale };
  const to = { x: room.left + 1415 * room.scale, y: room.top + 600 * room.scale };
  const center = between(from, to, q), growth = Math.pow(p, 1.5);
  const rx = 18 + (width + Math.max(from.x, to.x) + 100) * growth;
  const ry = 28 + (height + Math.max(from.y, to.y) + 100) * growth;
  const path = (edge: number) => { const x = rx + edge, y = ry + edge; return `M${n(center.x - x)} ${n(center.y - y * .35)}Q${n(center.x)} ${n(center.y - y * 1.65)} ${n(center.x + x)} ${n(center.y - y * .35)}L${n(center.x + x)} ${n(center.y + y)}L${n(center.x - x)} ${n(center.y + y)}Z`; };
  return { inner: path(0), outer: path(Math.max(9, width * .009)), center, dx: (from.x - to.x) * (1 - q), dy: (from.y - to.y) * (1 - q) };
}

function definitions(id: string, width: number, height: number, mobile: boolean, stageTop?: number): string {
  // A hard stage boundary protects the desktop reading column. On phones,
  // the extra physical props stay in the lower artwork observation area.
  const x = mobile ? 0 : width * .46;
  const y = mobile ? stageTop ?? height * .44 : 0;
  return `<defs>
    <clipPath id="${id}-stage"><rect x="${n(x)}" y="${n(y)}" width="${n(width - x)}" height="${n(height - y)}"/></clipPath>
    <pattern id="${id}-fiber" width="43" height="37" patternUnits="userSpaceOnUse"><path d="M3 9l8-2m13 9l9 1M9 31l8-3m15-19 7-3" fill="none" stroke="#F0E1C7" stroke-opacity=".15" stroke-width=".65"/><path d="M8 17l5 2m15 12 8-2M18 3l5 1" fill="none" stroke="#0C1A30" stroke-opacity=".17" stroke-width=".75"/></pattern>
    <linearGradient id="${id}-blue" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#5E7494"/><stop offset=".55" stop-color="#354A69"/><stop offset="1" stop-color="#1D2E49"/></linearGradient>
    <linearGradient id="${id}-cream" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#EEDFC2"/><stop offset="1" stop-color="#B7A080"/></linearGradient>
    <radialGradient id="${id}-brass" cx=".3" cy=".25"><stop stop-color="#F0DFBC"/><stop offset=".4" stop-color="#AB9169"/><stop offset="1" stop-color="#4C453A"/></radialGradient>
    <radialGradient id="${id}-amber"><stop stop-color="#EDB76C" stop-opacity=".32"/><stop offset="1" stop-color="#EDB76C" stop-opacity="0"/></radialGradient>
    <filter id="${id}-shadow" x="-28%" y="-28%" width="165%" height="165%"><feDropShadow dx="3" dy="5" stdDeviation="3" flood-color="#08121F" flood-opacity=".45"/></filter>
  </defs>`;
}

function paper(path: string, fill: string, id: string, edge = '#8B96A2'): string {
  return `<g filter="url(#${id}-shadow)"><path d="${path}" fill="${fill}" stroke="${edge}" stroke-width="1.1" stroke-linejoin="round"/><path d="${path}" fill="url(#${id}-fiber)"/></g>`;
}

function pin(point: XY, id: string, radius = 5): string {
  const { x, y } = point;
  return `<g class="transition-pin"><circle cx="${n(x + 2)}" cy="${n(y + 3)}" r="${n(radius + 1)}" fill="#07111E" opacity=".4"/><circle cx="${n(x)}" cy="${n(y)}" r="${n(radius)}" fill="url(#${id}-brass)" stroke="#685941" stroke-width=".9"/><path d="M${n(x - radius * .4)} ${n(y - radius * .3)}l${n(radius * .6)} ${n(-radius * .17)}" stroke="#F7E6BE" stroke-width="1" stroke-linecap="round"/></g>`;
}

function thread(path: string, width = 2.4, opacity = 1): string {
  return `<g class="transition-linen" opacity="${n(opacity)}"><path d="${path}" fill="none" stroke="#09131F" stroke-opacity=".38" stroke-width="${n(width + 2)}" transform="translate(1.5 2.5)"/><path d="${path}" fill="none" stroke="#A94F45" stroke-width="${n(width)}" stroke-linecap="round"/><path d="${path}" fill="none" stroke="#DA8A70" stroke-opacity=".7" stroke-width="${n(width * .25)}" stroke-dasharray="1.5 3.7"/></g>`;
}

const placed = (pose: PaperPose, content: string, attributes = '') => `<g ${attributes} transform="translate(${n(pose.x)} ${n(pose.y)}) scale(${n(pose.scale)})">${content}</g>`;
const mixPose = (a: PaperPose, b: PaperPose, p: number): PaperPose => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), scale: lerp(a.scale, b.scale, p) });

/** The shared puppet, free-hand holder and every discovered ID have exactly
 * one transition owner. Screen poses come from the same native chapter poses. */
function journeyHandoff(index: number, p: number, mobile: boolean, width: number, height: number, memory: Readonly<StoryMemory>, id: string): { actor: string; rim: string } {
  const source = miraPlacement(index, memory, mobile), target = miraPlacement(index + 1, memory, mobile);
  if (!source || !target) return { actor: '', rim: '' };
  const screen = (scene: number, pose: PaperPose): PaperPose => { const f = frameFor(scene, width, height); return { x: f.left + pose.x * f.scale, y: f.top + pose.y * f.scale, scale: pose.scale * f.scale }; };
  const sourceActor = screen(index, source), targetActor = screen(index + 1, target);
  let move = smoothstep(p), clip = '', rim = '', support = 'moving';
  if (index === 5) {
    // CSS circle percentages use the normalized viewport diagonal. Keep this
    // circle identical to the scene mask: the same paper edge covers the wind
    // ridge before it exposes the valley floor. No unsupported flight joins
    // those different physical surfaces.
    const f = frameFor(5, width, height), cx = f.left + WIND_WHEEL_PIVOT.x * f.scale, cy = f.top + WIND_WHEEL_PIVOT.y * f.scale;
    const unit = 1.45 * Math.hypot(width, height) / Math.SQRT2;
    type Bounds = { left: number; top: number; right: number; bottom: number };
    const boundsAt = (pose: PaperPose, left: number, top: number, right: number, bottom: number): Bounds => ({ left: pose.x + left * pose.scale, top: pose.y + top * pose.scale, right: pose.x + right * pose.scale, bottom: pose.y + bottom * pose.scale });
    const boundsFor = (scene: number, actor: PaperPose): Bounds[] => {
      const boxes = [boundsAt(actor, 0, 0, 195, 285), boundsAt(screen(scene, carrierPose(scene, memory, mobile)!), -155, 0, 4, 88)];
      for (const piece of PIECE_IDS) { const pose = scenePiecePose(scene, piece, memory, mobile); if (pose) boxes.push(boundsAt(screen(scene, pose), 14, 14, 186, 186)); }
      return boxes;
    };
    const oldBounds = boundsFor(index, sourceActor), newBounds = boundsFor(index + 1, targetActor);
    const coveredAt = Math.max(...oldBounds.flatMap(b => [b.left, b.right].flatMap(x => [b.top, b.bottom].map(y => Math.hypot(x - cx, y - cy) / unit))));
    // Distance to a rectangle, not only its corners: this also covers a large
    // fixture whose middle could otherwise emerge before its corner samples.
    const nearTarget = Math.min(...newBounds.map(b => Math.hypot(Math.max(b.left - cx, 0, cx - b.right), Math.max(b.top - cy, 0, cy - b.bottom))));
    const lipEnvelope = (progress: number) => smoothstep(progress / .18) * (1 - smoothstep((progress - .65) / .25));
    const minimumReveal = Math.min(.78, coveredAt + .075);
    const thickness = Math.max(width * (mobile ? .52 : .12), (unit * minimumReveal - nearTarget + 2) / Math.max(.01, lipEnvelope(minimumReveal)));
    const lipAt = (progress: number) => thickness * lipEnvelope(progress);
    let lo = coveredAt, hi = .97;
    for (let iteration = 0; iteration < 24; iteration++) { const mid = (lo + hi) / 2; if (Math.max(0, unit * mid - lipAt(mid)) >= nearTarget) hi = mid; else lo = mid; }
    const start = coveredAt + .006, end = Math.min(hi - .006, start + .045);
    move = smoothstep((p - start) / Math.max(.008, end - start));
    support = p < start ? 'wind-ridge' : p > end ? 'valley-floor' : 'behind-solid-rim';
    const outer = unit * p, inner = Math.max(0, outer - lipAt(p));
    clip = `<defs><mask id="${id}-old-support" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="white"/><circle cx="${cx}" cy="${cy}" r="${outer}" fill="black"/></mask><clipPath id="${id}-new-support"><circle cx="${cx}" cy="${cy}" r="${inner}"/></clipPath><clipPath id="${id}-covered-support"><rect width="0" height="0"/></clipPath><mask id="${id}-solid-rim" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="black"/><circle cx="${cx}" cy="${cy}" r="${outer}" fill="white"/><circle cx="${cx}" cy="${cy}" r="${inner}" fill="black"/></mask></defs>`;
    rim = `<g class="registered-valley-rim" data-covered-at="${n(coveredAt)}" data-reveal-at="${n(hi)}" mask="url(#${id}-solid-rim)"><rect width="${width}" height="${height}" fill="url(#${id}-blue)"/><rect width="${width}" height="${height}" fill="url(#${id}-fiber)"/><circle cx="${cx}" cy="${cy}" r="${outer}" fill="none" stroke="#A8AEAC" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="${inner}" fill="none" stroke="#0E1B2C" stroke-width="5"/></g>`;
    clip += `<g ${p < start ? `mask="url(#${id}-old-support)"` : p > end ? `clip-path="url(#${id}-new-support)"` : `clip-path="url(#${id}-covered-support)"`}>`;
  } else if (index === 6) {
    // The valley floor and bridge deck are different support planes. The
    // source stays grounded until the actual ellipse has covered its bounds.
    // A solid rim of that SAME ellipse hides the re-registration, then opens
    // onto the grounded target. Its thickness changes geometrically, never
    // by opacity, and all edge radii come from the scene-mask contract.
    const cx = width, cy = height * .78, ax = width * 1.55, ay = height * 1.25;
    const actorBounds = (actor: PaperPose): PaperPose[] => [
      { x: actor.x, y: actor.y, scale: 0 }, { x: actor.x + 195 * actor.scale, y: actor.y, scale: 0 },
      { x: actor.x, y: actor.y + 285 * actor.scale, scale: 0 }, { x: actor.x + 195 * actor.scale, y: actor.y + 285 * actor.scale, scale: 0 },
    ];
    const holderBounds = (scene: number): PaperPose[] => { const h = screen(scene, carrierPose(scene, memory, mobile)!); return [-155, 4].flatMap(x => [0, 88].map(y => ({ x: h.x + x * h.scale, y: h.y + y * h.scale, scale: 0 }))); };
    const sourceBounds = [...actorBounds(sourceActor), ...holderBounds(index)];
    for (const piece of PIECE_IDS) { const pose = scenePiecePose(index, piece, memory, mobile); if (pose) { const v = screen(index, pose); for (const x of [14, 186]) for (const y of [14, 186]) sourceBounds.push({ x: v.x + x * v.scale, y: v.y + y * v.scale, scale: 0 }); } }
    const targetBounds = [...actorBounds(targetActor), ...holderBounds(index + 1)];
    const coveredAt = Math.max(...sourceBounds.map(point => Math.hypot((cx - point.x) / ax, (cy - point.y) / ay)));
    let thickness = width * (mobile ? .60 : .13);
    const lipAt = (progress: number) => thickness * smoothstep(progress / .18) * (1 - smoothstep((progress - .65) / .25));
    const exposedAt = () => {
      let lo = coveredAt, hi = .96;
      for (let iteration = 0; iteration < 24; iteration++) { const mid = (lo + hi) / 2, rx = Math.max(.001, ax * mid - lipAt(mid)), ry = Math.max(.001, ay * mid - lipAt(mid)); const exposed = targetBounds.some(point => ((point.x - cx) / rx) ** 2 + ((point.y - cy) / ry) ** 2 <= 1); if (exposed) hi = mid; else lo = mid; }
      return hi;
    };
    for (let attempt = 0; attempt < 5 && exposedAt() - coveredAt < .045; attempt++) thickness += width * .035;
    const start = coveredAt + .006, end = Math.min(exposedAt() - .006, start + .045);
    move = smoothstep((p - start) / Math.max(.008, end - start));
    support = p < start ? 'valley-floor' : p > end ? 'bridge-deck' : 'behind-solid-rim';
    const rx = ax * p, ry = ay * p, innerX = Math.max(0, rx - lipAt(p)), innerY = Math.max(0, ry - lipAt(p));
    clip = `<defs><mask id="${id}-old-support" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="white"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="black"/></mask><clipPath id="${id}-new-support"><ellipse cx="${cx}" cy="${cy}" rx="${innerX}" ry="${innerY}"/></clipPath><clipPath id="${id}-covered-support"><rect width="0" height="0"/></clipPath><mask id="${id}-solid-rim" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="black"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="white"/><ellipse cx="${cx}" cy="${cy}" rx="${innerX}" ry="${innerY}" fill="black"/></mask></defs>`;
    rim = `<g class="registered-bridge-rim" data-covered-at="${n(coveredAt)}" data-reveal-at="${n(exposedAt())}" mask="url(#${id}-solid-rim)"><rect width="${width}" height="${height}" fill="url(#${id}-blue)"/><rect width="${width}" height="${height}" fill="url(#${id}-fiber)"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#A8AEAC" stroke-width="2"/><ellipse cx="${cx}" cy="${cy}" rx="${innerX}" ry="${innerY}" fill="none" stroke="#0E1B2C" stroke-width="5"/></g>`;
    clip += `<g ${p < start ? `mask="url(#${id}-old-support)"` : p > end ? `clip-path="url(#${id}-new-support)"` : `clip-path="url(#${id}-covered-support)"`}>`;
  }
  const actor = mixPose(sourceActor, targetActor, move), fromJoints = miraJoints(source.pose), toJoints = miraJoints(target.pose);
  const joints = Object.fromEntries(Object.keys(fromJoints).map(key => [key, lerp(fromJoints[key as keyof MiraJoints], toJoints[key as keyof MiraJoints], move)])) as MiraJoints;
  const angle = joints.backArm * Math.PI / 180;
  const holder = { x: actor.x + (65 - 16 * Math.cos(angle) - 64 * Math.sin(angle)) * actor.scale, y: actor.y + (130 - 16 * Math.sin(angle) + 64 * Math.cos(angle)) * actor.scale, scale: actor.scale * .8 };
  let content = placed(actor, miraGroup({ id: `${id}-mira`, pose: move < .5 ? source.pose : target.pose, lamp: true, joints, compactShadow: index === 6 }), 'class="mira-stage-position journey-actor" data-puppet-owner="transition"');
  content += placed(holder, renderCarrierBody(`${id}-held`), 'class="journey-carrier"');
  for (const piece of PIECE_IDS.filter(piece => memory.found.includes(piece))) {
    const a = scenePiecePose(index, piece, memory, mobile), b = scenePiecePose(index + 1, piece, memory, mobile);
    if (!a || !b) continue;
    const bag = piecePoseInCarrier(piece, holder);
    let pose = bag;
    if (index === 5 || index === 6) pose = mixPose(screen(index, a), screen(index + 1, b), move);
    else if (sourceFixturePose(index, piece, memory)) pose = mixPose(screen(index, a), bag, smoothstep(p / .5));
    else if (sourceFixturePose(index + 1, piece, memory)) pose = mixPose(bag, screen(index + 1, b), smoothstep((p - .5) / .5));
    content += placed(pose, renderCarrierPiece(piece, id), `data-transition-piece="${piece}"`);
  }
  return { actor: `<g class="journey-handoff" data-support="${support}" data-carried-ids="${memory.found.join('')}">${clip}${content}${index >= 5 ? '</g>' : ''}</g>`, rim };
}

/** Return a complete inert SVG. Index 0 is CH-01→02; index 9 is CH-10→11.
 * Endpoints return the empty string so settled chapters own their exact art.
 * Pixel registration uses the same frameFor function as the scene renderer.
 */
export function renderTransitionProp(
  index: number,
  progress: number,
  mobile: boolean,
  width: number,
  height: number,
  memory: Readonly<StoryMemory>,
): string {
  const p = clamp01(progress);
  if (!Number.isInteger(index) || index < 0 || index > 9 || p <= .001 || p >= .999 || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return '';
  // The actual pinned note owns this reveal. A detached duplicate corner or
  // full-width generic edge would break its paper continuity.
  if (index === 1) return '';
  const id = `paper-transition-${index}`;
  const s = Math.max(.5, Math.min(width / 1440, height / 900));
  const q = smoothstep(p);
  const envelope = hold(p);
  const native = (scene: number, x: number, y: number): XY => {
    const f = frameFor(scene, width, height);
    return { x: f.left + x * f.scale, y: f.top + y * f.scale };
  };
  const safe = (point: XY): XY => ({
    x: Math.max(width * (mobile ? .22 : .52), Math.min(width * .94, point.x)),
    y: Math.max(height * (mobile ? .50 : .12), Math.min(height * .88, point.y)),
  });
  let body = '';
  let anchor = '';

  if (index === 0) {
    anchor = 'The amber attic window';
    const window = windowHandoff(p, width, height, mobile);
    body = `<g fill-rule="evenodd">${paper(`${window.outer} ${window.inner}`, `url(#${id}-blue)`, id, '#B4AA95')}</g><path d="${window.inner}" fill="none" stroke="#D3C4A6" stroke-width="1.6"/>`;
  } else if (index === 1) {
    anchor = 'The note corner and brass pin';
    const destination = safe(native(2, mobile ? 879 : 890, mobile ? 393 : 164));
    const c = { x: destination.x + (1 - q) * 70 * s, y: destination.y + (1 - q) * 220 * s };
    const scale = (mobile ? .55 : .8) * s;
    body = `<g transform="translate(${n(c.x)} ${n(c.y)}) rotate(${n(-11 * (1 - q))}) scale(${n(scale)})">${paper('M-24-22l126-3 50 4-2 17-135 3 1 154-23-7-15-113Z', `url(#${id}-cream)`, id, '#AE9674')}${pin({ x: 3, y: 2 }, id, 7)}${thread('M5 10Q34 58 16 101T58 174', 2.3)}<path d="M11-8l119-1M-9 18l1 97" stroke="#FFF0D3" stroke-width="1" opacity=".72"/></g>`;
  } else if (index === 2) {
    anchor = 'The red thread and three roof pins';
    const note = safe(native(2, mobile ? 1056 : 1176, mobile ? 715 : 684));
    const roof = mobile
      ? [native(3, 159, 1286), native(3, 398, 1316), native(3, 647, 1451)]
      : [native(3, 881, 638), native(3, 1085, 583), native(3, 1320, 504)];
    const points = roof.map((point, i) => between(note, safe(point), smoothstep((p - i * .07) / .76)));
    const a = points[0], b = points[1], c = points[2];
    body = thread(`M${n(a.x)} ${n(a.y)}Q${n((a.x + b.x) / 2)} ${n(Math.max(a.y, b.y) + 22 * s)} ${n(b.x)} ${n(b.y)}T${n(c.x)} ${n(c.y)}`, 2.7) + points.map(point => pin(point, id, 5 * s)).join('');
  } else if (index === 3) {
    anchor = 'The market awning edge';
    const edgeY = height * p * 1.2;
    const startX = mobile ? width * .18 : width * .48;
    const segment = (width - startX) / 4;
    let d = `M${n(startX - 10)} ${n(edgeY - 31 * s)}L${n(width + 10)} ${n(edgeY - 29 * s)}L${n(width + 10)} ${n(edgeY + 9 * s)}`;
    for (let i = 4; i > 0; i--) {
      const x = startX + (i - 1) * segment;
      d += `Q${n(x + segment * .6)} ${n(edgeY + 42 * s)} ${n(x)} ${n(edgeY + (i % 2 ? 8 : 13) * s)}`;
    }
    d += 'Z';
    body = paper(d, `url(#${id}-blue)`, id, '#A7A390') + thread(`M${n(startX)} ${n(edgeY - 18 * s)}Q${n(width * .76)} ${n(edgeY - 3 * s)} ${n(width)} ${n(edgeY - 20 * s)}`, 2);
  } else if (index === 4) {
    anchor = 'A paper banner and the carried first piece';
    const x = width * (1 - p), drift = width * .18 * Math.sin(p * Math.PI), thick = Math.max(22, width * .045) * Math.sin(p * Math.PI);
    const d = `M${n(x - drift - thick)} -10L${n(x - drift + thick)} -10L${n(x + drift + thick)} ${n(height + 10)}L${n(x + drift - thick)} ${n(height + 10)}Z`;
    body = paper(d, '#263A56', id, '#77849A') + thread(`M${n(x - drift + thick * .38)} 0L${n(x + drift + thick * .38)} ${n(height)}`, 2);
  } else if (index === 5) {
    anchor = 'The same six-blade wheel at its registered axle';
    const f = frameFor(5, width, height);
    const c = native(5, WIND_WHEEL_PIVOT.x, WIND_WHEEL_PIVOT.y);
    const scale = f.scale * (1 + .45 * smoothstep(p / .55));
    const angle = memory.wheelSteady ? 0 : 27;
    const exit = smoothstep((p - .55) / .37), radius = 226 * scale;
    const x = c.x + (width - c.x + radius + 40) * exit;
    const shade = smoothstep((p - .035) / .36);
    // The wheel stays opaque. Its pin is fixed for the first half; then the
    // camera passes it and the whole cutout exits through the right edge.
    // Lighting changes the paper tint without revealing the valley through it.
    body = `<defs><linearGradient id="${id}-wheel-paper" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${tint('#F5E8CE', '#5E7494', shade)}"/><stop offset=".55" stop-color="${tint('#D9C8A8', '#354A69', shade)}"/><stop offset="1" stop-color="${tint('#B5A184', '#1D2E49', shade)}"/></linearGradient></defs><g class="wheel-handoff" data-pivot-x="${n(c.x)}" data-pivot-y="${n(c.y)}" data-camera-offset="${n(x - c.x)}" transform="translate(${n(x)} ${n(c.y)}) scale(${n(scale)}) rotate(${angle})">${Array.from({ length: 6 }, (_, i) => `<g data-wheel-blade="${i}" transform="rotate(${i * 60})">${paper(WIND_BLADE_PATH, `url(#${id}-wheel-paper)`, id, tint('#BCA98A', '#71839D', shade))}</g>`).join('')}${pin({ x: 0, y: 0 }, id, 16)}</g>`;
  } else if (index === 6) {
    anchor = 'The red route to the bridge and separately carried pieces';
    const valley = native(6, 1090, 885), bridge = native(7, 1196, 506), nextPost = native(7, 1320, 476);
    const a = between(valley, bridge, q), b = between(valley, nextPost, q);
    // The scene's opaque reveal and photographed bridge own the arch. The
    // guide terminates on real bridge posts, not a second floating ribbon.
    body = thread(`M${n(a.x)} ${n(a.y)}Q${n((a.x + b.x) / 2)} ${n(Math.max(a.y, b.y) + 24 * frameFor(7, width, height).scale)} ${n(b.x)} ${n(b.y)}`, 2.8);
  } else if (index === 7) {
    anchor = 'The blue bridge arch and red thread at the workroom';
    // A true solid arch rim in front of the already-authored midpoint plate.
    // It does not pretend the outdoor bridge mesh becomes an indoor desk.
    const f = frameFor(11, width, height);
    const offset = (1 - q) * 58 - q * 36;
    // Keep the matched 25/50/75% arch positions. At the ends, move the
    // solid paper rim through the viewport edges instead of ghosting it.
    const travel = width * (1 - smoothstep(p / .20)) - width * smoothstep((p - .78) / .20);
    const d = 'M718 1030L718 778Q704 282 1118-75L1247-75Q831 302 849 788L852 1030Z';
    body = `<g class="bridge-arch-handoff" data-camera-offset="${n(travel)}" transform="translate(${n(f.left + offset * f.scale + travel)} ${n(f.top)}) scale(${n(f.scale)})">${paper(d, `url(#${id}-blue)`, id, '#8490A0')}<path d="M848 995L846 788Q829 303 1241-61" fill="none" stroke="#C4B799" stroke-width="3" opacity=".72"/>${thread('M562 622Q667 629 748 634T922 633Q1030 642 1116 628', 3.5)}</g>`;
  } else if (index === 8) {
    anchor = 'The red lifting rig; the sun belongs to the root';
    const tableFrame = frameFor(8, width, height), skyFrame = frameFor(9, width, height);
    const table = { x: tableFrame.left + 1095 * tableFrame.scale, y: tableFrame.top + 650 * tableFrame.scale, r: 140 * tableFrame.scale };
    const sky = mobile
      ? { x: skyFrame.left + 586 * skyFrame.scale, y: skyFrame.top + 578 * skyFrame.scale, r: 213 * skyFrame.scale }
      : { x: skyFrame.left + 1226 * skyFrame.scale, y: skyFrame.top + 250 * skyFrame.scale, r: 198 * skyFrame.scale };
    const c = between(table, sky, q), r = lerp(table.r, sky.r, q);
    const attachmentY = c.y - r * 100 / 86, spread = r * 37 / 86;
    const railY = Math.min(attachmentY - 24 * s, height * (mobile ? .44 : .08));
    body = thread(`M${n(c.x - spread - 9 * s * (1 - q))} ${n(railY)}Q${n(c.x - spread - 13 * s * (1 - q))} ${n((railY + attachmentY) / 2)} ${n(c.x - spread)} ${n(attachmentY)}M${n(c.x + spread + 9 * s * (1 - q))} ${n(railY)}Q${n(c.x + spread + 13 * s * (1 - q))} ${n((railY + attachmentY) / 2)} ${n(c.x + spread)} ${n(attachmentY)}`, 2.2);
    body += pin({ x: c.x - spread - 9 * s * (1 - q), y: railY }, id, 4 * s) + pin({ x: c.x + spread + 9 * s * (1 - q), y: railY }, id, 4 * s);
  } else {
    anchor = 'The same roof edge and lamp remain';
    const x = width * (mobile ? .16 : .51), y = height * (.91 + q * .035), w = width - x;
    const d = `M${n(x)} ${n(y + 7 * s)}L${n(x + w * .18)} ${n(y - 3 * s)}L${n(x + w * .31)} ${n(y + 3 * s)}L${n(x + w * .58)} ${n(y - 8 * s)}L${n(width)} ${n(y + 2 * s)}L${n(width)} ${n(y + 18 * s)}L${n(x)} ${n(y + 23 * s)}Z`;
    body = paper(d, '#263953', id, '#77849A');
  }

  if (index >= 4 && index <= 6) {
    const journey = journeyHandoff(index, p, mobile, width, height, memory, id);
    body = index === 5 ? journey.actor + journey.rim + body : journey.actor + body + journey.rim;
  }
  return `<svg class="transition-prop" data-transition-prop="${index}" data-anchor="${anchor}" data-progress="${n(p)}" viewBox="0 0 ${n(width)} ${n(height)}" width="${n(width)}" height="${n(height)}" preserveAspectRatio="none" aria-hidden="true" focusable="false" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:hidden">${definitions(id, width, height, mobile, index === 5 ? frameFor(5, width, height).top : undefined)}<g ${index === 0 || index === 5 ? '' : `clip-path="url(#${id}-stage)"`} opacity="${index >= 4 && index <= 7 ? '1' : n(envelope)}">${body}</g></svg>`;
}
