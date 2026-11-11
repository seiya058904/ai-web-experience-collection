import { FRAGMENTS, PIECE_IDS, type PieceId } from './fragments.ts';
import { carrierPose, carrierPiecesForScene, miraPlacement, piecePoseInCarrier, renderCarrierBody, renderCarrierPiece } from './carrier.ts';
import type { StoryMemory } from './story-state.ts';

/** All positions use the same 1586 × 992 stage. The caller registers artwork
 * and props in one art plane, including its portrait crop. No separate clock. */
const STAGE = '0 0 1586 992';
const PORTRAIT_STAGE = '0 0 853 1844';
const portraitCity = (index: number) => [0, 3, 9, 10].includes(index);
const safeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '-');
/** One native blade contour and axle, shared by the live wheel and its
 * foreground silhouette during the journey into the valley. */
export const WIND_BLADE_PATH = 'M-9-3C-80-32-123-93-99-159C-81-201-43-211-29-226C-40-177-1-160 10-116C18-79 5-34-9-3Z';
export const WIND_WHEEL_PIVOT = { x: 1065, y: 255 } as const;
const pin = (x: number, y: number, prefix: string, r = 6) => `<g class="paper-pin"><circle cx="${x + 2}" cy="${y + 3}" r="${r + 1}" fill="#050b14" opacity=".45"/><circle cx="${x}" cy="${y}" r="${r}" fill="url(#${prefix}-brass)" stroke="#746044" stroke-width="1"/><path d="M${x - r * .45} ${y - r * .3}l${r * .6} ${-r * .2}" stroke="#F6E7BE" stroke-width="1.3" stroke-linecap="round"/></g>`;

function definitions(prefix: string): string {
  return `<defs>
    <linearGradient id="${prefix}-ivory" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#F5E8CE"/><stop offset=".55" stop-color="#D9C8A8"/><stop offset="1" stop-color="#B5A184"/></linearGradient>
    <linearGradient id="${prefix}-coat" x1="0" x2="1"><stop stop-color="#C77866"/><stop offset=".52" stop-color="#B55D50"/><stop offset="1" stop-color="#87453E"/></linearGradient>
    <linearGradient id="${prefix}-blue" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#637A9D"/><stop offset=".5" stop-color="#405575"/><stop offset="1" stop-color="#1A2A47"/></linearGradient>
    <linearGradient id="${prefix}-glass" x1="0" x2="1"><stop stop-color="#E6A147"/><stop offset=".5" stop-color="#FFF1B1"/><stop offset="1" stop-color="#E1A34A"/></linearGradient>
    <radialGradient id="${prefix}-brass" cx=".3" cy=".2"><stop stop-color="#E9D6AE"/><stop offset=".45" stop-color="#A28B62"/><stop offset=".8" stop-color="#6B5940"/><stop offset="1" stop-color="#403E36"/></radialGradient>
    <radialGradient id="${prefix}-glow"><stop stop-color="#F6BE5A" stop-opacity=".30"/><stop offset="1" stop-color="#F6BE5A" stop-opacity="0"/></radialGradient>
    <filter id="${prefix}-shadow" x="-35%" y="-35%" width="180%" height="180%"><feDropShadow dx="6" dy="10" stdDeviation="5" flood-color="#050B17" flood-opacity=".56"/></filter>
    <filter id="${prefix}-fiber" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".68" numOctaves="3" seed="17" stitchTiles="stitch" result="noise"/><feColorMatrix in="noise" type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".17"/></feComponentTransfer><feComposite in2="SourceGraphic" operator="in"/><feBlend in2="SourceGraphic" mode="multiply"/></filter>
    <pattern id="${prefix}-rotor-fibers" width="43" height="37" patternUnits="userSpaceOnUse"><g fill="none" stroke="#F7EAD1" stroke-opacity=".49" stroke-width=".35" stroke-linecap="round"><path d="M3 6q4.6 2.1 8.5.2M24 4l6-1.2M17 19q4-1.3 7 .3M31 28l7-1.5M5 33l5.1 1.2"/></g><g fill="none" stroke="#8E7F68" stroke-opacity=".27" stroke-width=".3"><path d="M10 10l5-1M29 15l6 1.4M13 28l4.6-.8M2 21l4 1"/></g></pattern>
    <pattern id="${prefix}-fibers" width="71" height="53" patternUnits="userSpaceOnUse"><path d="M4 8l13-3m18 21l9 3m-21 18l8-2m23-32l10-5M2 36l7 2m40 9l14-2" fill="none" stroke="#F4E4C8" stroke-opacity=".14" stroke-width=".7"/><path d="M17 19l9 3m32 14l6-3m-25-17l11-2" fill="none" stroke="#07162B" stroke-opacity=".12" stroke-width=".7"/></pattern>
  </defs>`;
}

function lampBody(prefix: string, lit = true): string {
  return `<g class="amber-lamp${lit ? ' is-lit' : ''}">
    ${lit ? `<ellipse cx="44" cy="77" rx="83" ry="95" fill="url(#${prefix}-glow)"/>` : ''}
    <ellipse cx="46" cy="129" rx="35" ry="7" fill="#09121D" opacity=".35"/>
    <path d="M31 24C16 1 63-5 57 22" fill="none" stroke="#354155" stroke-width="5"/>
    <path d="M39 19l12-1 1 11-14 1Z" fill="#B7A17B"/>
    <g filter="url(#${prefix}-shadow)"><path d="M10 48l28-22 16 1 26 23-10 7-50 1Z" fill="#33415A" stroke="#13233A" stroke-width="2"/>
    <path d="M19 56l52-1-2 67-47 2Z" fill="${lit ? `url(#${prefix}-glass)` : '#A69478'}" stroke="#473E36" stroke-width="3"/>
    <path d="M21 58l46-1-1 62-43 2Z" fill="url(#${prefix}-fibers)"/>
    <path d="M20 55l4 68M68 55l-1 68M43 55l1 68M22 88l45-1" fill="none" stroke="#40424A" stroke-width="4"/>
    <path d="M13 120l62-1 1 12-65 1Z" fill="#35435A" stroke="#1D2D42" stroke-width="2"/>
    ${lit ? '<path d="M42 107q-10-10 3-24 9 17 1 24Z" fill="#FFF6C3"/>' : '<path d="M43 105q7-12-3-17" fill="none" stroke="#4A372A" stroke-width="2"/>'}
    </g><path d="M16 48l23-17" stroke="#A4A6A2" stroke-opacity=".55" stroke-width="1.3"/>
  </g>`;
}

export type LampOptions = { id?: string; className?: string; lit?: boolean; width?: number; height?: number };
export function lampSvg(options: LampOptions = {}): string {
  const prefix = safeId(options.id ?? 'shared-lamp');
  return `<svg class="${safeId(options.className ?? 'paper-lamp')}" viewBox="-40 -12 170 160" width="${options.width ?? 85}" height="${options.height ?? 80}" aria-hidden="true" focusable="false">${definitions(prefix)}${lampBody(prefix, options.lit ?? true)}</svg>`;
}

export type MiraPose = 'stand' | 'walk' | 'reach' | 'mend';
export type MiraJoints = { leftLeg: number; rightLeg: number; frontArm: number; backArm: number };
export function miraJoints(pose: MiraPose): MiraJoints {
  const walking = pose === 'walk';
  const reaching = pose === 'reach' || pose === 'mend';
  return { leftLeg: walking ? -14 : 3, rightLeg: walking ? 13 : -3, frontArm: reaching ? -33 : 7, backArm: walking ? 11 : -8 };
}
export type MiraOptions = { id?: string; className?: string; pose?: MiraPose; lamp?: boolean; width?: number; height?: number; joints?: MiraJoints; compactShadow?: boolean };
function miraBody(prefix: string, pose: MiraPose = 'stand', carryLamp = true, compactShadow = false, joints = miraJoints(pose)): string {
  const { leftLeg, rightLeg, frontArm: arm, backArm } = joints;
  return `<g class="mira-puppet pose-${pose}" data-puppet="mira">
    <ellipse class="mira-contact-shadow" cx="88" cy="268" rx="${compactShadow ? 38 : 52}" ry="${compactShadow ? 5 : 9}" fill="#081423" opacity="${compactShadow ? '.45' : '.36'}"/>
    <g class="mira-left-leg" transform="rotate(${leftLeg} 72 211)"><path d="M61 204l24 1-5 45-18 3Z" fill="#424251" stroke="#222C3F" stroke-width="1.5"/><path d="M62 243l18-2 4 15 12 5-1 7-38-1Z" fill="#182236" stroke="#0C1525" stroke-width="2"/><path d="M61 265l31 1" stroke="#7D7770" stroke-width="1.3"/></g>
    <g class="mira-right-leg" transform="rotate(${rightLeg} 106 211)"><path d="M95 204l24 1-1 47-19-2Z" fill="#393A4B" stroke="#202B3D" stroke-width="1.5"/><path d="M99 243l18 1 1 11 18 7-1 7-40-1Z" fill="#20283B" stroke="#0C1525" stroke-width="2"/><path d="M100 266l31 1" stroke="#7D7770" stroke-width="1.3"/></g>
    <g class="mira-back-arm" transform="rotate(${backArm} 65 130)"><path d="M62 125l16 6-22 57-14-5Z" fill="#9E534B" stroke="#713D39" stroke-width="1.5"/><path d="M43 179l14 6-6 13-7 3-8-8Z" fill="#DCC6A3" stroke="#B79D7B" stroke-width="1.3"/></g>
    <path class="mira-coat" d="M66 114l46 2 11 11 27 97-9 6-27-4-20 4-23-4-27 1 3-12 10-62Z" fill="url(#${prefix}-coat)" stroke="#793E3B" stroke-width="2" filter="url(#${prefix}-shadow)"/>
    <path d="M66 114l46 2 11 11 27 97-9 6-27-4-20 4-23-4-27 1 3-12 10-62Z" fill="url(#${prefix}-fibers)"/>
    <path d="M91 128l1 96M52 218q41 9 88 1" fill="none" stroke="#E5A58A" stroke-width="1.1" stroke-dasharray="2 4"/>
    <path d="M65 115l18 24 9-13 11 12 11-21-20-5Z" fill="#E7D8BC" stroke="#B6A68C" stroke-width="1.2"/>
    <path d="M108 174l21-1 3 19-21 1Z" fill="#A8574C" stroke="#DB9078" stroke-width="1.1"/><path d="M109 176l21-1" stroke="#ECD0AA" stroke-opacity=".7"/>
    <circle cx="93" cy="154" r="2.1" fill="#D6C099"/><circle cx="93" cy="176" r="2.1" fill="#D6C099"/>
    <path d="M81 96l23 1-1 23-18 4-5-5Z" fill="#D5BA94" stroke="#AE9271" stroke-width="1.4"/>
    <path d="M52 64q-4-35 32-42 37-3 47 30l-1 45-10 13-57-6-12-15Z" fill="#1A2435" stroke="#0C1626" stroke-width="2" filter="url(#${prefix}-shadow)"/>
    <path d="M67 57q15-17 40-9l14 20-4 29-17 14-19-3-14-15-4-22Z" fill="#E5D2AE" stroke="#B69B78" stroke-width="1.4"/>
    <path d="M56 62q5-34 33-34 33 1 37 28l-16-5-13 7-11-10-10 15-7 17-10 1Z" fill="#202A3C"/>
    <path d="M58 58q8-24 29-25" fill="none" stroke="#5E6574" stroke-opacity=".6" stroke-width="2"/>
    <path d="M61 75l7 4 5 19-10 3-7-11Z" fill="#202A3C"/>
    <circle cx="108" cy="74" r="2.1" fill="#39404A"/><path d="M119 78l5 7-7 2" fill="#E5D2AE" stroke="#B69B78" stroke-width="1.2"/>
    <ellipse cx="107" cy="88" rx="5" ry="3.2" fill="#BB7769" opacity=".42"/><path d="M109 98l5-1" stroke="#96725D" stroke-width="1.2" stroke-linecap="round"/>
    <g class="mira-front-arm" transform="rotate(${arm} 116 131)"><path d="M112 123l17 8 18 38-12 9-18-30Z" fill="#B86354" stroke="#793F3A" stroke-width="1.7"/><path d="M136 165l11-1 11 12-5 9-9 1-10-9Z" fill="#E0CAA5" stroke="#AD9472" stroke-width="1.3"/>${pin(120, 134, prefix, 3.7)}
      ${carryLamp ? `<g transform="translate(125 183) scale(.45)">${lampBody(prefix, true)}</g>` : ''}
    </g>${pin(69, 132, prefix, 3.4)}${pin(73, 219, prefix, 2.8)}${pin(109, 219, prefix, 2.8)}
  </g>`;
}

export function miraSvg(options: MiraOptions = {}): string {
  const prefix = safeId(options.id ?? 'shared-mira');
  return `<svg class="${safeId(options.className ?? 'mira-cutout')}" viewBox="0 0 195 285" width="${options.width ?? 195}" height="${options.height ?? 285}" aria-hidden="true" focusable="false">${definitions(prefix)}${miraBody(prefix, options.pose, options.lamp ?? true, options.compactShadow, options.joints)}</svg>`;
}

/** The same pinned puppet can be placed inside a registered transition SVG. */
export function miraGroup(options: MiraOptions = {}): string {
  const prefix = safeId(options.id ?? 'shared-mira');
  return `${definitions(prefix)}${miraBody(prefix, options.pose, options.lamp ?? true, options.compactShadow, options.joints)}`;
}

function placedMira(x: number, y: number, scale: number, prefix: string, pose: MiraPose, lamp = false, compactShadow = false): string {
  return `<g class="mira-stage-position" transform="translate(${x} ${y}) scale(${scale})">${miraBody(prefix, pose, lamp, compactShadow)}</g>`;
}

function exactPiece(id: PieceId, x: number, y: number, scale: number, prefix: string, outline = false): string {
  const piece = FRAGMENTS[id];
  return `<g class="exact-piece piece-${id.toLowerCase()}" data-piece="${id}" transform="translate(${x} ${y}) scale(${scale})" filter="url(#${prefix}-shadow)"><path d="${piece.path}" fill="${outline ? '#E2C58A' : piece.color}" fill-opacity="${outline ? '.18' : '1'}" stroke="${outline ? '#9D7943' : '#986527'}" stroke-width="1.4" stroke-linejoin="round"/><path d="${piece.path}" fill="url(#${prefix}-fibers)"/></g>`;
}

function thread(path: string, traced = true): string {
  return `<g class="red-thread"><path d="${path}" fill="none" stroke="#070C17" stroke-width="6" opacity=".3" transform="translate(2 4)"/><path d="${path}" fill="none" stroke="#A94F45" stroke-width="3.5" stroke-linecap="round" ${traced ? '' : 'stroke-opacity=".36"'}/><path d="${path}" fill="none" stroke="#E08C70" stroke-width=".7" stroke-dasharray="2 4" opacity=".7"/></g>`;
}

function note(prefix: string, mobile: boolean, desk = false): string {
  // Non-city phone scenes still use the 1586 × 992 artwork coordinates.
  // Keep the complete note inside the visible native span, not at a guessed
  // half-width coordinate that the shared art-plane crop would hide.
  const x = desk ? 1125 : mobile ? 855 : 850, y = desk ? 722 : mobile ? 375 : 135;
  const sx = desk ? .15 : mobile ? 400 / 650 : 1, sy = desk ? .075 : sx;
  return `<g class="${desk ? 'desk-note-outline' : 'quest-note'}" transform="translate(${x} ${y}) scale(${sx} ${sy})">
    <path d="M11 8l176-5 149 4 166-2 134 7 6 138-3 176 6 166-9 198-143 5-174-3-167 4-143-9 4-137-5-184 6-185Z" fill="url(#${prefix}-ivory)" stroke="#A99575" stroke-width="2" filter="url(#${prefix}-shadow)"/>
    <path d="M11 8l176-5 149 4 166-2 134 7 6 138-3 176 6 166-9 198-143 5-174-3-167 4-143-9 4-137-5-184 6-185Z" fill="url(#${prefix}-fibers)"/>
    <path d="M49 45l550-2M51 643l543 2" stroke="#A28B67" stroke-opacity=".35" stroke-width="1"/>
    <circle cx="326" cy="306" r="172" fill="none" stroke="#997C51" stroke-opacity=".45" stroke-width="1.7" stroke-dasharray="4 8"/>
    ${exactPiece('A', 173, 136, 1.75, prefix, true)}
    ${exactPiece('B', 151, 163, 1.75, prefix, true)}
    ${exactPiece('C', 129, 134, 1.75, prefix, true)}
    <path d="M155 534l56-36m115 39 1-43m165 40-54-36" fill="none" stroke="#A94F45" stroke-width="2" stroke-dasharray="2 5"/>
    <circle cx="146" cy="546" r="6" fill="#BC645B"/><circle cx="326" cy="549" r="6" fill="#6D81A1"/><circle cx="502" cy="546" r="6" fill="#5A4D73"/>
    ${pin(39, 29, prefix, 8)}${pin(608, 28, prefix, 8)}
    ${thread('M326 552Q344 622 263 658T366 736')}
  </g>`;
}

function windWheel(prefix: string, memory: StoryMemory, mobile: boolean): string {
  const { x: cx, y: cy } = WIND_WHEEL_PIVOT, scale = 1;
  // The phone camera crops the same clean plate. Its real post and pin remain
  // at these native coordinates; moving only the rotor creates a second axle.
  return `<g class="wind-wheel" transform="translate(${cx} ${cy}) scale(${scale})">
    <g class="wind-rotor${memory.wheelSteady ? ' is-steady' : ''}" data-pivot="0 0" transform="rotate(${memory.wheelSteady ? 0 : 27})" filter="url(#${prefix}-shadow)">
      ${Array.from({ length: 6 }, (_, i) => `<g transform="rotate(${i * 60})"><path d="${WIND_BLADE_PATH}" fill="url(#${prefix}-ivory)" stroke="#BCA98A" stroke-width=".9"/><path d="${WIND_BLADE_PATH}" fill="url(#${prefix}-rotor-fibers)"/><path d="M-8-4Q-52-80-46-140" fill="none" stroke="#8E7B5E" stroke-width="1.1" opacity=".18"/><path d="M-9-3Q-53-79-47-139" fill="none" stroke="#F5E5C9" stroke-width=".8" opacity=".45"/></g>`).join('')}
    </g>${memory.wheelSteady ? `<path class="released-piece-thread" d="M9 12Q42 126 125 200" fill="none" stroke="#A94F45" stroke-width="2.5"/><g class="source-discovery-piece" data-discovery-piece="B">${exactPiece('B', 30, 105, .95, prefix)}</g>` : ''}<circle cx="0" cy="0" r="24" fill="#7A6041" stroke="#BCA37C" stroke-width="2"/>${pin(0, 0, prefix, 16)}
    ${memory.wheelSteady ? '<path class="wheel-tie" d="M-11 19q-23 23 4 31 26-10 15-27" fill="none" stroke="#A94F45" stroke-width="3"/>' : ''}
  </g>`;
}

function valleyShade(prefix: string, memory: StoryMemory, mobile: boolean): string {
  // Register to the preserved pin in the clean valley plate on every device.
  const x = 985, y = 375, scale = 1;
  return `<g class="valley-reveal" transform="translate(${x} ${y}) scale(${scale})">
    <ellipse cx="188" cy="205" rx="158" ry="140" fill="url(#${prefix}-glow)" opacity="${memory.shadeLifted ? '1' : '.14'}"/>
    ${memory.shadeLifted ? `<g class="source-discovery-piece" data-discovery-piece="C">${exactPiece('C', 70, 110, 1.32, prefix)}</g>` : ''}
    <g class="valley-shade${memory.shadeLifted ? ' is-lifted' : ''}" data-pivot="375 0" transform="rotate(${memory.shadeLifted ? -66 : 0} 375 0)">
      <path d="M0 319l39-136 62-97 83-54 97-20 92-12-5 120-21 133-57 26-103 17-106 24Z" fill="url(#${prefix}-blue)" stroke="#7486A0" stroke-width="2.2" filter="url(#${prefix}-shadow)"/>
      <path d="M0 319l39-136 62-97 83-54 97-20 92-12-5 120-21 133-57 26-103 17-106 24Z" fill="url(#${prefix}-fibers)"/>
      <path d="M1 317l80 2 106-25 103-17 55-26" fill="none" stroke="#D1BE9E" stroke-width="2" opacity=".72"/>
    </g>${pin(375, 0, prefix, 12)}
  </g>`;
}

function sceneCarrier(index: number, prefix: string, memory: StoryMemory, mobile: boolean): string {
  const holder = carrierPose(index, memory, mobile);
  if (!holder) return '';
  const pieces = carrierPiecesForScene(index, memory);
  return `<g class="carried-pieces" data-carrier-scene="${index}" data-carried-ids="${pieces.join('')}"><g transform="translate(${holder.x} ${holder.y}) scale(${holder.scale})">${renderCarrierBody(prefix)}</g>${pieces.map(id => { const pose = piecePoseInCarrier(id, holder); return `<g transform="translate(${pose.x} ${pose.y}) scale(${pose.scale})">${renderCarrierPiece(id, prefix)}</g>`; }).join('')}</g>`;
}

function journeyMira(index: number, prefix: string, memory: StoryMemory, mobile: boolean): string {
  const placement = miraPlacement(index, memory, mobile);
  return placement ? placedMira(placement.x, placement.y, placement.scale, prefix, placement.pose, placement.lamp, index === 7) : '';
}

/** A short folded-paper roof crossing supports Mira's native boot span.
 * Its two braces terminate on the neighboring roof and chimney planes. */
function roofWalkway(prefix: string): string {
  return `<g class="roof-walkway">
    <path d="M981 600l8 1 7 88-8 1Z" fill="#2A3B55" stroke="#8993A0" stroke-width="1.4"/>
    <path d="M1094 582l9-1 13 67-9 3Z" fill="#2A3B55" stroke="#8993A0" stroke-width="1.4"/>
    <path d="M988 672l89-78M1109 641l-67-49" fill="none" stroke="#3D526F" stroke-width="6"/>
    <path d="M963 589l149-19 16 11-149 20Z" fill="url(#${prefix}-blue)" stroke="#ACAEAA" stroke-width="1.5"/>
    <path d="M979 601l149-20-1 8-147 20Z" fill="#243752" stroke="#66788F" stroke-width="1.2"/>
    <path d="M966 589l144-18M981 601l143-19" fill="none" stroke="#D3C6AD" stroke-opacity=".67" stroke-width="1.3"/>
    <path d="M988 596l9-13m13 10 8-13m15 10 8-14m13 12 8-14m14 11 8-14" fill="none" stroke="#17283F" stroke-opacity=".35" stroke-width="1.2"/>
    <path d="M963 589l149-19 16 11-149 20Z" fill="url(#${prefix}-fibers)"/>
    ${pin(989, 603, prefix, 2.8)}${pin(1103, 586, prefix, 2.8)}
  </g>`;
}

function sceneProps(index: number, memory: StoryMemory, mobile: boolean, prefix: string): string {
  const center = 1095;
  switch (index) {
    case 0:
      return '';
    case 1:
      return `${placedMira(mobile ? 950 : 880, mobile ? 500 : 440, mobile ? .80 : 1.02, prefix, 'mend')}
        ${note(prefix, mobile, true)}`;
    case 2:
      return note(prefix, mobile);
    case 3:
      return `${thread(mobile ? 'M573 784Q645 768 688 655T802 614Q858 607 911 541T1017 505' : 'M686 773Q835 752 879 641T1085 583Q1191 573 1320 504T1574 491', memory.tracedRoute)}
        ${pin(mobile ? 690 : 881, mobile ? 650 : 638, prefix, 7)}${pin(mobile ? 802 : 1085, mobile ? 614 : 583, prefix, 7)}${pin(mobile ? 913 : 1320, mobile ? 540 : 504, prefix, 7)}
        ${mobile ? '' : roofWalkway(prefix)}${placedMira(mobile ? 698 : 969, mobile ? 460 : 380, mobile ? .65 : .75, prefix, 'walk', true, true)}`;
    case 4:
      return `${memory.marketRepaired ? `<g class="market-repair-result" transform="translate(1180 535)"><ellipse cx="50" cy="58" rx="130" ry="156" fill="url(#${prefix}-glow)"/><path d="M0 0l74-2 2 124-75 1Z" fill="url(#${prefix}-glass)" opacity=".78"/><g class="source-discovery-piece" data-discovery-piece="A">${exactPiece('A', -9, 12, .55, prefix)}</g><path d="M-6-4l92 1M-3 126l85-1M-3 0l3 126M77 0l-1 123" stroke="#35435B" stroke-width="8" fill="none"/></g>` : ''}
        ${journeyMira(index, prefix, memory, mobile)}${sceneCarrier(index, prefix, memory, mobile)}`;
    case 5:
      return `${windWheel(prefix, memory, mobile)}${journeyMira(index, prefix, memory, mobile)}${sceneCarrier(index, prefix, memory, mobile)}`;
    case 6:
      return `${valleyShade(prefix, memory, mobile)}${journeyMira(index, prefix, memory, mobile)}${sceneCarrier(index, prefix, memory, mobile)}`;
    case 7:
      return `${journeyMira(index, prefix, memory, mobile)}${sceneCarrier(index, prefix, memory, mobile)}`;
    case 8:
      return `<g class="repair-target"><circle cx="${center}" cy="650" r="140" fill="#342D2B" fill-opacity=".14" stroke="#E7D2AA" stroke-width="2" stroke-dasharray="4 7"/><circle cx="${center}" cy="650" r="145" fill="none" stroke="#5B4631" stroke-opacity=".22" stroke-width="1"/>${pin(center - 150, 795, prefix, 6)}${pin(center + 150, 795, prefix, 6)}</g>${placedMira(mobile ? 920 : 804, mobile ? 520 : 455, mobile ? .55 : .95, prefix, 'mend')}${sceneCarrier(index, prefix, memory, mobile)}`;
    case 9:
      return '';
    case 10:
      return placedMira(mobile ? 765 : 1231, mobile ? 704 : 688, mobile ? .34 : .35, prefix, 'stand');
    default:
      return '';
  }
}

/** The portrait city is an authored composition, not a wide scene stretched
 * into a tall viewport. Its opening is registered to AI-05 in native pixels. */
function portraitCityProps(index: number, memory: StoryMemory, prefix: string): string {
  if (index === 3) {
    return `${thread('M5 1315Q111 1319 159 1286T242 1310Q276 1381 330 1336T434 1324Q480 1350 507 1420T647 1451', memory.tracedRoute)}
      ${pin(159, 1286, prefix, 5)}${pin(398, 1316, prefix, 5)}${pin(647, 1451, prefix, 5)}
      ${placedMira(423, 1175, .54, prefix, 'walk', true)}`;
  }
  if (index === 10) return placedMira(572, 1368, .4, prefix, 'stand');
  // The root owns the only joined sun in opening-return, sunrise and ending.
  return '';
}

function portraitFallback(index: number, memory: StoryMemory): string {
  const prefix = `fallback-${index + 1}-portrait`;
  const morning = index >= 9 && memory.daylight;
  const sky = morning ? '#ADBBB8' : '#18233B';
  const far = morning ? '#8B9BA6' : '#394D6C';
  const middle = morning ? '#768BA2' : '#304764';
  const near = morning ? '#617A98' : '#2A3E5D';
  const front = morning ? '#4A6486' : '#203650';
  const background = `<rect width="853" height="1844" fill="${sky}"/>
    <circle cx="590" cy="585" r="219" fill="#071323" opacity=".42"/>
    <circle cx="586" cy="578" r="219" fill="#B5A68A"/>
    <circle class="fallback-aperture" cx="586" cy="578" r="213" fill="${morning ? '#708398' : '#0B1528'}" stroke="#32435E" stroke-width="1.5"/>
    <path d="M405 458Q438 392 507 374" fill="none" stroke="#E5CDA5" stroke-width="2" opacity=".7"/>
    <g filter="url(#${prefix}-shadow)">
      <path d="M0 1360V1242l68-28 58 24 61-81 50 33 52-91 72 31 49-114 64 40 46-155 37 14 30 125 54-58 44 22 54-109 51 15 63-125v1059Z" fill="${far}" stroke="#71849C" stroke-width="2"/>
      <path d="M486 1058V936l23-92 24 92v122Z" fill="#8C99A8"/><path d="M491 936l18-78 18 78" fill="none" stroke="#BEBDAD" stroke-width="2"/>
      <path d="M596 1002q-7-71 25-83 33 13 26 83Z" fill="#647B98" stroke="#A9B0B5" stroke-width="2"/>
      <path d="M781 869V790h31v89" fill="#B9B1A0" stroke="#D7C9AC" stroke-width="3"/>
      <path d="M0 1460V1341l122-116 83 93 85-112 112 88 122-167 117 91 91-133 121 95v764Z" fill="${middle}" stroke="#8292A7" stroke-width="2"/>
      <path d="M188 1311l102-129 113 111-14 17-98-94-89 114Z" fill="#4F6584" stroke="#A0A9AF" stroke-width="2"/>
      <path d="M398 1291l126-180 121 108-17 17-101-89-113 159Z" fill="#4A617F" stroke="#9EA7AD" stroke-width="3"/>
      <path d="M365 1201v-74h24v83M399 1202v-68h23v77" fill="#B8AD98" stroke="#D0BFA0" stroke-width="3"/>
      <path d="M720 1098v-125h25v115M749 1100V970h24v116" fill="#BBAF97" stroke="#D5C3A1" stroke-width="3"/>
      <path d="M0 1612V1428l98-111 125 48 88-157 126 96 113-43 119-91 184 93v581Z" fill="${near}" stroke="#7589A2" stroke-width="2"/>
      <path d="M0 1442l96-141 128 50-6 24-113-42L20 1460Z" fill="#3A5272" stroke="#9CA5AC" stroke-width="2"/>
      <path d="M224 1371l85-180 133 103-17 22-109-81-71 153Z" fill="#455F80" stroke="#A5ACAE" stroke-width="2"/>
      <path d="M0 1844v-225l122-111 113 88 110-134 123 101 132-152 125 94 128-41v380Z" fill="${front}" stroke="#627C9A" stroke-width="2"/>
      <path d="M0 1735l122-245 119 112-20 25-94-91-102 218Z" fill="#536D8B" stroke="#A6ABA8" stroke-width="3"/>
      <path d="M210 1607l131-163 137 104-18 24-114-88-115 148Z" fill="#3C5575" stroke="#91A2B1" stroke-width="3"/>
      <path d="M530 1483l69-185 69-87 75 77 77 192-16 18-272 3Z" fill="#3D5576" stroke="#8092A7" stroke-width="3"/>
      <path d="M611 1479v-116q1-56 67-71 66 17 66 71v116Z" fill="#B6A487" stroke="#D8C2A0" stroke-width="4"/>
      <path d="M633 1466v-100q0-40 46-53 44 14 44 53v100Z" fill="url(#${prefix}-glass)" stroke="#C0A177" stroke-width="4"/>
      <path d="M679 1319v148M636 1398h85" stroke="#B08D60" stroke-width="9"/>
      <path d="M592 1354l77-143 94 141-20 15-75-108-57 107Z" fill="#4C6688" stroke="#D0BD9E" stroke-width="3"/>
      <path d="M619 1473l124-1 4 16-132 1Z" fill="#CDBB9C" stroke="#968771" stroke-width="2"/>
      <path d="M53 1483v-92h23v101M86 1477v-77h22v87" fill="#B7AB94" stroke="#D8C3A0" stroke-width="3"/>
      <path d="M553 1774v-126h25v134M584 1766v-111h25v119" fill="#B4A68D" stroke="#D8C3A0" stroke-width="3"/>
    </g>
    <g fill="none" stroke="#A8B2BB" stroke-opacity=".25" stroke-width="1.5">
      <path d="M0 1491l108-139 104 32M252 1391l68-131 91 63M282 1432l67-126 91 63M29 1680l102-108 73 63M34 1713l98-108 75 62M559 1458l48-103M769 1366l33 97"/>
      <path d="M18 1588l65-64M438 1581l51-40M772 1603l64-24M363 1739l127-78M348 1774l129-76"/>
    </g>
    ${thread('M5 1315Q111 1319 159 1286T242 1310Q276 1381 330 1336T434 1324Q480 1350 507 1420T647 1451')}
    <rect width="853" height="1844" fill="url(#${prefix}-fibers)"/>`;
  return `<svg class="paper-fallback fallback-ch-${String(index + 1).padStart(2, '0')} is-portrait" viewBox="${PORTRAIT_STAGE}" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true" focusable="false" style="pointer-events:none">${definitions(prefix)}${background}${portraitCityProps(index, memory, prefix)}</svg>`;
}

/** Decorative live props. The single assembled sun is owned by the caller. */
export function renderProps(index: number, memory: StoryMemory, mobile: boolean): string {
  const prefix = `props-${index + 1}${mobile ? '-portrait' : '-wide'}`;
  if (mobile && portraitCity(index)) {
    return `<svg class="paper-props props-ch-${String(index + 1).padStart(2, '0')} is-portrait" viewBox="${PORTRAIT_STAGE}" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true" focusable="false" style="pointer-events:none">${definitions(prefix)}${portraitCityProps(index, memory, prefix)}</svg>`;
  }
  return `<svg class="paper-props props-ch-${String(index + 1).padStart(2, '0')}${mobile ? ' is-portrait' : ''}" viewBox="${STAGE}" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true" focusable="false" style="pointer-events:none">${definitions(prefix)}${sceneProps(index, memory, mobile, prefix)}</svg>`;
}

function cityBackdrop(prefix: string, morning: boolean, mobile: boolean): string {
  const colors = morning ? ['#AAB1AB', '#8B9BA4', '#6D8297', '#4B6383'] : ['#31415E', '#344866', '#293B58', '#1A2A44'];
  const apertureX = mobile ? 793 : 1226, apertureY = mobile ? 260 : 250, apertureR = mobile ? 145 : 198;
  return `<rect width="1586" height="992" fill="${morning ? '#B9BDB0' : '#18233B'}"/>
    <circle class="fallback-aperture" cx="${apertureX + 5}" cy="${apertureY + 9}" r="${apertureR + 3}" fill="#41516A" opacity=".65"/><circle cx="${apertureX}" cy="${apertureY}" r="${apertureR}" fill="${morning ? '#768594' : '#0A1427'}" stroke="#44526A" stroke-width="2"/>
    <g filter="url(#${prefix}-shadow)"><path d="M0 697l95-76 74 44 89-110 92 74 61-111 118 95 81-154 111 91 63-129 123 126 115-91 106 99 118-123 83 87 99-51 58 73v451H0Z" fill="${colors[0]}"/>
    <path d="M0 781l154-131 133 105 101-151 143 123 111-92 123 109 107-153 165 142 140-104 120 81 133-117 156 139v260H0Z" fill="${colors[1]}"/>
    <path d="M0 850l164-139 182 151 153-168 138 153 167-117 159 131 144-193 177 162 144-74 158 141v150H0Z" fill="${colors[2]}"/>
    <path d="M0 939l250-122 194 144 203-109 238 120 210-102 153 79 190-88 148 105v100H0Z" fill="${colors[3]}"/></g>
    <path d="M980 754l126-117 121 135-18 12-108-114-105 101Z" fill="#283852" stroke="#758299" stroke-width="2"/>
    <path d="M1053 735l59-1 1 64-59 1Z" fill="#E0AC59" stroke="#1B2A43" stroke-width="8"/><path d="M1083 734v62M1054 766h58" stroke="#26374D" stroke-width="5"/>
    ${thread(mobile ? 'M568 908Q716 876 780 818T1009 790' : 'M270 912Q699 813 1058 794T1558 854')}
    <rect width="1586" height="992" fill="url(#${prefix}-fibers)"/>`;
}

function atticBackdrop(prefix: string, mobile: boolean): string {
  return `<rect width="1586" height="992" fill="#19263E"/>
    <path d="M658 655V342L1059 40l505 311v641H678Z" fill="#AFA086" filter="url(#${prefix}-shadow)"/>
    <path d="M704 651V349L1062 95l459 284v613H704Z" fill="#D5C3A1"/>
    <path d="M663 345L1061 39l505 307-19 31-486-291-372 293Z" fill="#6C665E" stroke="#CAB99B" stroke-width="3"/>
    <path d="M1084 236q90-151 185 0v223h-185Z" fill="#314360" stroke="#B09D7D" stroke-width="17"/><path d="M1177 171v290M1084 317h185" stroke="#263651" stroke-width="10"/>
    <path d="M727 490h318v13H726Zm25 12h17v154h-17Zm263 0h17v154h-17Z" fill="#9B896C"/>
    <path d="M791 512l128-2 4 102-134 2Z" fill="#5C6E89" stroke="#374C69" stroke-width="3"/><path d="M941 560l66-3 3 55-69 4Z" fill="#B7A385"/>
    <path d="M618 648l966-6 1 175-964 5Z" fill="url(#${prefix}-ivory)" stroke="#B19B79" stroke-width="3" filter="url(#${prefix}-shadow)"/>
    <path d="M639 817h946v174H637Z" fill="#4C5C73"/><path d="M687 844h431v114H686Zm477 0h371v114h-370Z" fill="#54657E" stroke="#344760" stroke-width="6"/>
    ${pin(898, 902, prefix, 15)}${pin(1352, 902, prefix, 15)}
    <g transform="translate(${mobile ? 908 : 1386} ${mobile ? 653 : 550}) scale(${mobile ? .8 : 1.3})">${lampBody(prefix)}</g>
    <path d="M1252 742l127 31" stroke="#5C5A54" stroke-width="3"/><ellipse cx="1371" cy="768" rx="8" ry="3" fill="none" stroke="#7D7B6D" stroke-width="2"/>
    ${thread('M1005 792Q1115 761 1193 716T1326 741')}
    <rect width="1586" height="992" fill="url(#${prefix}-fibers)"/>`;
}

function marketBackdrop(prefix: string, mobile: boolean, repaired: boolean): string {
  const stalls = [
    { x: 690, y: 538, s: .55 }, { x: 1007, y: 500, s: .65 }, { x: 1282, y: 452, s: 1.15 },
  ];
  return `<rect width="1586" height="992" fill="#1A273F"/><path d="M619 883L1050 539l536 324v129H0Z" fill="#8B816D"/>
    ${stalls.map(s => `<g transform="translate(${s.x} ${s.y}) scale(${s.s})" filter="url(#${prefix}-shadow)"><path d="M-80 32L36-38l234 21 69 82-25 17-28-9-29 18-34-10-37 12-31-13-32 10-30-16-30 10-31-14-30 4Z" fill="#49607E" stroke="#8292A7" stroke-width="3"/><path d="M-45 67v312M296 75v299" stroke="#CEB896" stroke-width="15"/><path d="M-59 289l365-4 8 91-374 2Z" fill="#B7A485" stroke="#D9C7A6" stroke-width="3"/></g>`).join('')}
    <path d="M670 168Q1050 275 1586 75M713 381Q1105 462 1586 290" fill="none" stroke="#C8B391" stroke-width="3"/>
    ${[{ x: 842, y: 203, s: .7 }, { x: 1110, y: 172, s: .85 }, { x: 1420, y: 91, s: 1 }, { x: 925, y: 395, s: .42 }, { x: 1197, y: 387, s: .5 }].map(l => `<g transform="translate(${l.x} ${l.y}) scale(${l.s})">${lampBody(prefix)}</g>`).join('')}
    <g transform="translate(${mobile ? 787 : 1180} ${mobile ? 466 : 515}) scale(1.25)">${lampBody(prefix, repaired)}</g>
    ${thread('M5 916Q279 761 509 864T1026 737Q1117 724 1182 507')}
    <rect width="1586" height="992" fill="url(#${prefix}-fibers)"/>`;
}

function hillBackdrop(prefix: string, mobile: boolean): string {
  return `<rect width="1586" height="992" fill="#506783"/>
    <g filter="url(#${prefix}-shadow)"><path d="M0 848Q337 693 549 662T1057 538Q1380 386 1586 352v640H0Z" fill="#BCAC8B"/>
    <path d="M0 916Q354 683 623 746T1182 609Q1450 485 1586 554v438H0Z" fill="#8290A1"/>
    <path d="M0 994Q350 738 645 838T1159 733Q1394 630 1586 685v307Z" fill="#405A7A"/>
    <path d="M0 992Q318 824 529 947T1133 845Q1387 720 1586 801v191Z" fill="#253B5A"/></g>
    ${Array.from({ length: 24 }, (_, i) => { const x = 200 + i * 62, y = 800 - i * 13; return `<path d="M${x} ${y}q-17-79 20-137-16 83-9 132q18-87 63-111-33 58-51 120Z" fill="${i % 2 ? '#DDC8A1' : '#B8A382'}" stroke="#E8D4AF" stroke-width="1"/>`; }).join('')}
    ${mobile ? '' : '<path d="M1057 251l20 1 11 367-29 5Z" fill="#8F775B" stroke="#BDA17A" stroke-width="3"/>'}
    ${thread('M0 944Q370 799 590 886T1131 799Q1375 709 1586 771')}
    <g transform="translate(1279 647) scale(.8)">${lampBody(prefix)}</g><rect width="1586" height="992" fill="url(#${prefix}-fibers)"/>`;
}

function valleyBackdrop(prefix: string, mobile: boolean): string {
  return `<rect width="1586" height="992" fill="#101A31"/>
    <g filter="url(#${prefix}-shadow)"><path d="M0 992V679l107-42 108 35 71-80 93 71 112-136 62 36 101-137 69 22 91-151 84 93 87-116 104 103 126-119 81 120 91-47 139 73v593Z" fill="#353B5F"/>
    <path d="M0 992V772l188-87 150 52 120-102 149 78 169-55 115-127 142 56 143-69 205 59 205-85v500Z" fill="#4A526E"/>
    <path d="M806 927Q823 349 1121 207Q1405 83 1563 284L1586 932h-152Q1448 350 1242 325Q991 296 961 928Z" fill="url(#${prefix}-blue)" stroke="#B5B2A5" stroke-width="5"/>
    <path d="M0 993V904l251-78 201 41 212-91 164 85 150-14 170 46 217-130 221 62v167Z" fill="#263B59"/></g>
    ${thread('M0 962Q380 859 567 922T1041 841Q1190 805 1184 744')}
    <rect width="1586" height="992" fill="url(#${prefix}-fibers)"/>`;
}

function bridgeBackdrop(prefix: string): string {
  return `<rect width="1586" height="992" fill="#273752"/>
    <path d="M0 993V683l189-83 142 52 223-179 153 99 227-120 183 75 138-131 331 138v458Z" fill="#455773"/>
    <path d="M0 992V842l227-103 219 88 194-102 225 116 237-163 251 93 233-121v342Z" fill="#1C2D49"/>
    <path d="M236 936Q825 345 1508 652L1509 721Q849 440 278 991Z" fill="#778EAE" stroke="#C1CAD0" stroke-width="4" filter="url(#${prefix}-shadow)"/>
    <path d="M277 992Q850 435 1508 720L1507 856Q868 537 412 992Z" fill="#3D597B" stroke="#283C5B" stroke-width="3"/>
    <path d="M251 921Q838 362 1501 669" fill="none" stroke="#ACBDD0" stroke-width="7"/>
    <path d="M1347 624V367l83-70 84 70v287Z" fill="#687D97"/><path d="M1320 372l109-99 111 101-15 15-95-79-98 80Z" fill="#213653"/>
    <path d="M1404 370h49v65h-49Z" fill="#DEAA56" stroke="#293C55" stroke-width="7"/><path d="M1429 371v64M1406 403h46" stroke="#435268" stroke-width="4"/>
    ${thread('M249 919Q825 376 1502 665')}
    <rect width="1586" height="992" fill="url(#${prefix}-fibers)"/>`;
}

/** Complete authored still for an image failure. Hide the ordinary props layer
 * while displaying this: it already contains the same current prop state.
 * The caller keeps its one shared sun above this still in chapters 9–11. */
export function renderFallback(index: number, memory: StoryMemory, mobile: boolean): string {
  if (mobile && portraitCity(index)) return portraitFallback(index, memory);
  const prefix = `fallback-${index + 1}${mobile ? '-portrait' : '-wide'}`;
  let background: string;
  if (index === 1 || index === 8) background = atticBackdrop(prefix, false);
  else if (index === 2) background = `<rect width="1586" height="992" fill="#26354C"/><path d="M669 773l917-73v292H626Z" fill="#A18C6C"/><rect width="1586" height="992" fill="url(#${prefix}-fibers)"/>`;
  else if (index === 4) background = marketBackdrop(prefix, false, memory.marketRepaired);
  else if (index === 5) background = hillBackdrop(prefix, false);
  else if (index === 6) background = valleyBackdrop(prefix, false);
  else if (index === 7) background = bridgeBackdrop(prefix);
  else background = cityBackdrop(prefix, index >= 9 && memory.daylight, false);
  return `<svg class="paper-fallback fallback-ch-${String(index + 1).padStart(2, '0')}${mobile ? ' is-portrait' : ''}" viewBox="${STAGE}" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true" focusable="false" style="pointer-events:none">${definitions(prefix)}${background}${sceneProps(index, memory, mobile, prefix)}</svg>`;
}
