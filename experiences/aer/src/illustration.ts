import { DECISION_PROGRESS, sceneAt, terrainHeight, WIND_LAYERS } from './journey';
import type { SceneState, WindLayer } from './journey';

/** Lightweight, deliberately illustrative equivalents for unavailable WebGL. */
const number = (value: number) => Number.isFinite(value) ? value.toFixed(2) : '0';
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const escape = (value: string) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]!);

/** Stable DOM-fragment names; never depend on render order or a global counter. */
function hash(value: string): string {
  let result = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    result = Math.imul(result ^ value.charCodeAt(i), 0x01000193);
  }
  return (result >>> 0).toString(36);
}

const progressId = (value: number) => String(value).replace(/[^A-Za-z0-9_-]/g, (character) => `_${character.charCodeAt(0).toString(16)}_`);
const instanceId = (value: string) => `${value.replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 24) || 'scene'}-${hash(value)}`;

type Point = readonly [number, number];

function curve(points: readonly Point[], move = true): string {
  let d = move ? `M${number(points[0]![0])},${number(points[0]![1])}` : `L${number(points[0]![0])},${number(points[0]![1])}`;
  for (let i = 1; i < points.length; i += 1) {
    const p0 = points[Math.max(0, i - 2)]!;
    const p1 = points[i - 1]!;
    const p2 = points[i]!;
    const p3 = points[Math.min(points.length - 1, i + 1)]!;
    d += `C${number(p1[0] + (p2[0] - p0[0]) / 6)},${number(p1[1] + (p2[1] - p0[1]) / 6)} ${number(p2[0] - (p3[0] - p1[0]) / 6)},${number(p2[1] - (p3[1] - p1[1]) / 6)} ${number(p2[0])},${number(p2[1])}`;
  }
  return d;
}

/** Eight front-facing gores of the sixteen-gore envelope. */
function balloon(prefix: string): string {
  const profile: readonly Point[] = [[12, 7], [18, 28], [34, 50], [57, 64], [82, 68], [107, 60], [132, 44], [154, 28], [172, 15], [180, 10]];
  const edge = (angle: number): Point[] => profile.map(([y, radius]) => [80 + Math.sin(angle) * radius, y]);
  let gores = '';
  for (let i = 0; i < 8; i += 1) {
    const a = edge(-Math.PI / 2 + i * Math.PI / 8);
    const b = edge(-Math.PI / 2 + (i + 1) * Math.PI / 8).reverse();
    gores += `<path d="${curve(a)}${curve(b, false)}Z" fill="${i % 2 ? '#EAB7A1' : '#F6F1E8'}" stroke="#AC8E7B" stroke-opacity=".27" stroke-width=".45"/>`;
  }
  const outline = curve(edge(-Math.PI / 2)) + curve(edge(Math.PI / 2).reverse(), false) + 'Z';
  return `<defs><linearGradient id="${prefix}-volume"><stop stop-color="#fffaf0" stop-opacity=".3"/><stop offset=".44" stop-color="#fff8e8" stop-opacity="0"/><stop offset="1" stop-color="#5c493c" stop-opacity=".31"/></linearGradient><linearGradient id="${prefix}-basket" x2="0" y2="1"><stop stop-color="#BD8D53"/><stop offset="1" stop-color="#81582F"/></linearGradient></defs><g>${gores}<path d="${outline}" fill="url(#${prefix}-volume)"/><path d="M61,14 Q80,4 99,14 Q81,19 61,14Z" fill="#4F5D7F"/><ellipse cx="80" cy="179.5" rx="10" ry="2.1" fill="#795E43"/><g stroke="#7F735F" stroke-width=".9" fill="none"><path d="M70,180 L71,201 M76,181 L76,201 M84,181 L84,201 M90,180 L89,201"/></g><path d="M68,200 L92,200 L90,218 Q80,221 70,218Z" fill="url(#${prefix}-basket)" stroke="#79552F" stroke-width=".75"/><path d="M68,201H92 M70,206H91 M70,211H90 M71,216H89 M74,202V218 M80,202V219 M86,202V218" fill="none" stroke="#E8B97E" stroke-width=".65" stroke-opacity=".6"/><path d="M67,200Q80,197 93,200" fill="none" stroke="#79552F" stroke-width="2.2"/></g>`;
}

/** Decorative logo-scale balloon; callers supply a text label if it is a control. */
export function balloonMark(instance = 'mark'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 220" aria-hidden="true" focusable="false">${balloon(`aer-mark-${instanceId(instance)}`)}</svg>`;
}

function tree(x: number, y: number, scale: number): string {
  return `<g transform="translate(${number(x)} ${number(y)}) scale(${number(scale)})"><path d="M0,0L-1,-31M-1,-17L-11,-30M-1,-22L9,-35" fill="none" stroke="#6E6C54" stroke-width="3"/><path d="M-25,-31C-34,-49 -14,-63 -2,-58C11,-71 35,-51 25,-37C35,-24 8,-16 0,-23C-12,-12 -32,-18 -25,-31Z" fill="#78856E"/><path d="M-24,-38C-29,-53 -10,-59 -1,-55C10,-65 29,-50 24,-42C8,-45 -9,-39 -24,-38Z" fill="#9AA68C"/></g>`;
}

function person(x: number, y: number, size: number): string {
  return `<g transform="translate(${number(x)} ${number(y)}) scale(${number(size)})" fill="#515C58" stroke="#515C58" stroke-width="2" stroke-linecap="round"><circle cx="0" cy="-17" r="2.5"/><path d="M0,-13L0,-5M0,-11L-4,-7M0,-11L4,-8M0,-5L-3,0M0,-5L3,0" fill="none"/></g>`;
}

function landmarks(state: SceneState, mobile: boolean): string {
  // Never consult saved preference: sceneAt has already resolved temporal scope.
  if (!state.branchActive) return tree(1220, 702, .6) + tree(1249, 701, .45);
  const center = mobile ? 720 : 1030;
  if (state.layer === 'low') {
    let result = `<path d="M${center - 250},785Q${center - 80},667 ${center + 190},718L${center + 270},783Z" fill="#B2BDA0"/>`;
    for (let i = 0; i < 5; i += 1) {
      result += tree(center - 225 + i * 43, 782 - i * 14, 1.1 - i * .1);
      result += tree(center + 230 - i * 29, 780 - i * 16, .98 - i * .08);
    }
    return result;
  }
  if (state.layer === 'high') {
    let result = `<path d="M${center - 340},745Q${center},650 ${center + 250},730L${center + 360},800Q${center},716 ${center - 340},745" fill="#BCC3A8"/>`;
    for (let i = 0; i < 9; i += 1) result += tree(center + 80 + i * 14, 710 + Math.sin(i / 8 * Math.PI) * 9, .43 + Math.sin(i) * .05);
    return result;
  }
  let result = '';
  for (let i = 0; i < 6; i += 1) {
    const x = center - 120 + i * 38;
    const y = 705 - Math.sin(i) * 11;
    result += `<path d="M${number(x)},${number(y)}v-27h28v27Z" fill="${i % 2 ? '#D9D1BE' : '#E9DECC'}"/><path d="M${number(x - 3)},${number(y - 27)}l17,-13 17,13Z" fill="#8B8176"/><path d="M${number(x + 11)},${number(y)}v-12h6v12" fill="#8D8D82"/>`;
  }
  return result + tree(center - 143, 707, .65) + tree(center + 121, 717, .73);
}

/**
 * SVG is an explicitly simplified scene, not a photographic replacement or map.
 * Plate mode is the current route's basket-level panorama without a second ball.
 */
export function fallbackScene(state: SceneState, { mobile = false, plate = false, instance = 'scene' }: { mobile?: boolean; plate?: boolean; instance?: string } = {}): string {
  // Supply a distinct instance name when the same state appears twice in one DOM.
  // Exact progress also separates chapter-local stills, including 3 and 3.8.
  const prefix = `aer-${instanceId(instance)}-${state.layer}-${mobile ? 'm' : 'd'}-${plate ? 'p' : 's'}-${progressId(state.progress)}`;
  const sky = '#A7B8D5';
  const center = mobile ? 720 : 1000;
  const perspective = mobile ? .48 : .8;
  const x = center + clamp(state.position.x * perspective - state.position.z * .13, -105, 120);
  const ground = 811 - clamp(state.position.z * .21, 0, 75) - terrainHeight(state.position.x, state.position.z) * 3;
  const scaleProgress = clamp((state.progress - 2.7) / .8, 0, 1);
  const scaleBlend = scaleProgress * scaleProgress * (3 - 2 * scaleProgress);
  const size = mobile ? 2.28 + (1.65 - 2.28) * scaleBlend : 3.1 + (2.02 - 3.1) * scaleBlend;
  const lift = state.agl * (mobile ? 3.7 : 3.35);
  const balloonTop = ground - lift - 220 * size;
  const shadowX = x + (state.shadow.x - state.position.x) * (mobile ? 1.5 : 2.3);
  const shadowY = ground - (state.shadow.z - state.position.z) * .55;
  const title = state.branchActive ? `${WIND_LAYERS[state.layer].destination}, ${state.groundContact ? 'basket on the ground' : 'balloon drifting above the fields'}` : (state.groundContact ? 'The balloon and basket on the common departure field' : 'The shared journey before choosing a wind layer');
  const label = `Simplified scene illustration. ${title}.${state.chapter >= 9 && state.groundContact && !plate ? ' Ground crew and a coiled rope wait beside the basket.' : ''}`;
  const landmarkBlend = clamp((state.progress - DECISION_PROGRESS) / .8, 0, 1);
  const landmarkArt = state.branchActive
    ? `<g opacity="${number(1 - landmarkBlend)}">${landmarks({ ...state, branchActive: false }, mobile)}</g><g opacity="${number(landmarkBlend)}">${landmarks(state, mobile)}</g>`
    : landmarks(state, mobile);
  let art = `<defs><linearGradient id="${prefix}-sky" x2="0" y2="1"><stop stop-color="${sky}"/><stop offset="1" stop-color="#ECE4D9"/></linearGradient><linearGradient id="${prefix}-ground" x2="0" y2="1"><stop stop-color="#ABB6A1"/><stop offset="1" stop-color="#91A18B"/></linearGradient><radialGradient id="${prefix}-shadow"><stop stop-color="#536054" stop-opacity="${number(state.shadow.opacity)}"/><stop offset=".7" stop-color="#536054" stop-opacity="${number(state.shadow.opacity * .75)}"/><stop offset="1" stop-color="#536054" stop-opacity="0"/></radialGradient><linearGradient id="${prefix}-rim" x2="0" y2="1"><stop stop-color="#CAA16B"/><stop offset=".45" stop-color="#A77842"/><stop offset="1" stop-color="#815D37"/></linearGradient></defs><path d="M0,0H1440V900H0Z" fill="url(#${prefix}-sky)"/><path d="M0,621Q95,579 214,611T457,601T704,619T958,588T1200,615T1440,598V900H0Z" fill="#8E9AB2" opacity=".55"/><path d="M0,662Q180,608 340,648T690,639T1002,661T1440,631V900H0Z" fill="#A7B2A2"/><path d="M0,710Q220,649 463,706T881,689T1440,707V900H0Z" fill="url(#${prefix}-ground)"/><path d="M0,820Q240,724 508,796T1032,766T1440,802V900H0Z" fill="#AEB79C"/><path d="M1440,735Q1110,700 805,803T313,900" fill="none" stroke="#91A08B" stroke-width="2"/><path d="M104,900C287,835 365,835 474,781S607,732 642,718S617,692 677,678" fill="none" stroke="#EDE3CC" stroke-width="13"/><path d="M104,900C287,835 365,835 474,781S607,732 642,718S617,692 677,678" fill="none" stroke="#CECFB7" stroke-width="2"/>${landmarkArt}`;
  if (plate) {
    art += `<path d="M0,845Q720,807 1440,845V900H0Z" fill="url(#${prefix}-rim)"/><path d="M0,853Q720,816 1440,853" fill="none" stroke="#E1BA84" stroke-width="11"/><g fill="none" stroke="#D9AD72" stroke-width="3" opacity=".65"><path d="M0,878H1440M0,893H1440"/><path d="M80,860V900M240,847V900M400,840V900M560,835V900M720,832V900M880,835V900M1040,840V900M1200,847V900M1360,860V900"/></g><path d="M1394,0L1375,846" fill="none" stroke="#8C795A" stroke-width="6"/><path d="M1220,0Q1346,85 1440,135V0Z" fill="#EAB7A1"/><path d="M1310,0Q1384,83 1440,101V0Z" fill="#F6F1E8"/>`;
  } else {
    art += `<ellipse cx="${number(shadowX)}" cy="${number(shadowY)}" rx="${number(83 * size * state.shadow.scale)}" ry="${number(19 * size)}" transform="rotate(-8 ${number(shadowX)} ${number(shadowY)})" fill="url(#${prefix}-shadow)"/>`;
    if (state.groundContact) art += `<ellipse cx="${number(x)}" cy="${number(ground)}" rx="${number(size * 15)}" ry="${number(size * 3)}" fill="#52634F" opacity=".23"/>`;
    if (state.chapter >= 9 && state.groundContact) {
      art += `<g fill="none" stroke="#9B815C" stroke-width="${number(size * 1.15)}"><path d="M${number(x + size * 12)},${number(ground - 2)}C${number(x + size * 25)},${number(ground + size * 12)} ${number(x + size * 36)},${number(ground + size * 1)} ${number(x + size * 48)},${number(ground + size * 4)}"/><ellipse cx="${number(x + size * 61)}" cy="${number(ground + size * 5)}" rx="${number(size * 17)}" ry="${number(size * 5)}"/><ellipse cx="${number(x + size * 61)}" cy="${number(ground + size * 5)}" rx="${number(size * 12)}" ry="${number(size * 3.3)}"/><ellipse cx="${number(x + size * 61)}" cy="${number(ground + size * 5)}" rx="${number(size * 7)}" ry="${number(size * 1.7)}"/></g>`;
    }
    if (state.chapter < 4 || state.chapter >= 8) art += person(x - size * 24, ground, size * .65) + person(x + size * 24, ground - 1, size * .65);
    art += `<g transform="translate(${number(x - 80 * size)} ${number(balloonTop)}) scale(${number(size)})">${balloon(prefix)}</g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${escape(label)}"><title>${escape(label)}</title>${art}</svg>`;
}

/** Fixed stage diagrams evaluate the same world, including its causal prefix. */
export function stillFrame(progress: number, layer: WindLayer, label: string): string {
  const state = sceneAt(progress, layer);
  const svg = fallbackScene(state, { instance: `still-${progressId(progress)}-${hash(label)}` });
  return svg.replace('</svg>', `<g font-family="system-ui, sans-serif" fill="#334253"><text x="54" y="69" font-size="26">${escape(label)}</text><text x="54" y="105" font-size="17">${state.groundContact ? 'In contact with the ground' : 'The basket and its shadow separate'}</text></g></svg>`);
}
