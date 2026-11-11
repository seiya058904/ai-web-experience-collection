/**
 * Original explanatory SVG drawings, informed by docs/sources.md.
 * These are explicitly schematic: no dimensions, timing or photographed anatomy
 * are implied. No external assets, filters, random values or document-wide IDs.
 */

const ink = '#E7E7CF';
const gold = '#D1B974';
const green = '#9DB28A';
const dark = '#173924';
const copper = '#C8703A';

function figure(title: string, description: string, drawing: string, viewBox = '0 0 700 300'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${title}" class="scientific-diagram" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <title>${title}</title><desc>${description}</desc>
    ${drawing}
  </svg>`;
}

function line(x1: number, y1: number, x2: number, y2: number, color = ink, width = 1.2, opacity = 1): string {
  return `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${color}" stroke-width="${width}" opacity="${opacity}"/>`;
}

function dot(x: number, y: number, radius = 2, color = gold): string {
  return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}"/>`;
}

function bracket(x: number, y: number, width: number): string {
  return `<path d="M${x} ${y - 4}v8m0-4h${width}m0-4v8" stroke="${green}" stroke-width="1" opacity=".5"/>`;
}

/** The same gently curved leaf vein is repeated as an orientation landmark. */
function leafGround(): string {
  return `<path d="M55 227C178 198 410 216 651 187" stroke="${green}" stroke-width="1.4" opacity=".65"/>
    <path d="M111 217l-28-30m92 25l-38-48m101 46l-34-41m96 42l42-47m16 46l39 29m23-32l44-49m19 45l49 23m17-29l45-43" stroke="${green}" stroke-width=".8" opacity=".38"/>`;
}

type Specimen = {
  profile: number[];
  head: number;
  headRaise: number;
  frontFilament: number;
  rearFilament: number;
  bands: number;
  belly: number;
  pale: boolean;
};

// Each instar has an independently authored profile and anatomical emphasis.
// The arrays are drawing units, not a measurement series or a growth dataset.
const specimens: Specimen[] = [
  { profile: [7, 8, 9, 8.5, 9, 8.5, 8, 7.5, 7, 6.8, 6, 5, 3.8], head: 10.5, headRaise: 0, frontFilament: 2, rearFilament: 1, bands: 0, belly: 0.62, pale: true },
  { profile: [10, 11, 12, 13, 13, 12.5, 12, 11.6, 11, 10, 8.6, 7.2, 5], head: 11, headRaise: 1, frontFilament: 6, rearFilament: 2.5, bands: 1, belly: 0.68, pale: false },
  { profile: [11, 12.5, 13, 16, 17, 18, 17, 16.5, 15, 13, 11.5, 9, 6], head: 12.5, headRaise: 2, frontFilament: 17, rearFilament: 10, bands: 2, belly: 0.72, pale: false },
  { profile: [13, 15, 17, 19, 20, 21, 21, 20, 18, 16, 13, 10.5, 7], head: 13, headRaise: 1, frontFilament: 29, rearFilament: 17, bands: 3, belly: 0.76, pale: false },
  { profile: [15, 18, 21, 24, 26, 27, 27, 26, 23, 21, 17, 12, 8], head: 14, headRaise: 0, frontFilament: 38, rearFilament: 23, bands: 4, belly: 0.84, pale: false },
];

function caterpillar(stage: number, x: number, y: number, length: number, visualScale = 1): string {
  const s = specimens[Math.max(0, Math.min(4, stage - 1))];
  const step = length / 13;
  const centers = s.profile.map((radius, i) => ({
    x: x + step * (i + .55),
    y: y - Math.sin((i / 12) * Math.PI) * (stage > 3 ? 5 : stage),
    r: radius * visualScale,
  }));
  const start = centers[0];
  const end = centers[12];
  const top = centers.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${(p.y - p.r).toFixed(2)}`).join('');
  const bottom = [...centers].reverse().map(p => `L${p.x.toFixed(2)} ${(p.y + p.r * s.belly).toFixed(2)}`).join('');
  let parts = `<path d="${top}Q${end.x + step * .75} ${end.y} ${end.x} ${end.y + end.r * s.belly}${bottom}Q${start.x - step * .8} ${start.y} ${start.x} ${start.y - start.r}Z" fill="${s.pale ? ink : dark}" fill-opacity="${s.pale ? '.3' : '.95'}" stroke="${ink}" stroke-width="1.2"/>`;
  centers.forEach((p, i) => {
    const topY = p.y - p.r + 1.2;
    const lowerY = p.y + p.r * s.belly - 1.2;
    const bend = step * .2;
    const bandPath = `M${p.x - step * .16} ${topY}Q${p.x + bend} ${p.y} ${p.x - step * .1} ${lowerY}`;
    if (s.bands) {
      const thoraxSoft = stage === 3 && i < 3;
      parts += `<path d="${bandPath}" stroke="${gold}" stroke-width="${(stage === 5 ? 3.2 : 1.8) * visualScale}" opacity="${thoraxSoft ? '.35' : '.95'}"/>`;
      parts += `<path d="M${p.x + step * .2} ${topY + .8}Q${p.x + step * .43} ${p.y} ${p.x + step * .25} ${lowerY}" stroke="${ink}" stroke-width="${(stage > 3 ? 3 : 1.7) * visualScale}" opacity="${thoraxSoft ? '.5' : '.95'}"/>`;
    } else {
      parts += `<path d="${bandPath}" stroke="${green}" stroke-width=".8" opacity=".55"/>`;
      if (i % 2 === 0) parts += line(p.x, topY, p.x - 2, topY - 4 * visualScale, ink, .7, .5);
    }
    if (i < 3) {
      // Three pairs of true legs on the thorax; this side view shows one per pair.
      const short = i === 0 && stage >= 3 ? .65 : 1;
      const legLength = (5 + stage) * visualScale * short;
      parts += `<path d="M${p.x - 1} ${lowerY}l${-3 * visualScale} ${legLength}l${-3 * visualScale} ${2 * visualScale}" stroke="${ink}" stroke-width="1.2"/>`;
    }
    // Four middle abdominal proleg pairs and the terminal anal prolegs.
    if ([5, 6, 7, 8, 12].includes(i)) {
      const legWidth = (stage > 3 ? 4 : 2.6) * visualScale;
      const legDepth = (stage > 3 ? 7.5 : 4.5) * visualScale;
      parts += `<path d="M${p.x - legWidth} ${lowerY}l1 ${legDepth}q${legWidth} ${2 * visualScale} ${legWidth * 1.8} 0l1 ${-legDepth}" fill="${dark}" stroke="${ink}" stroke-width=".9"/>`;
      if (stage >= 4) parts += dot(p.x + legWidth * .1, lowerY + legDepth * .55, stage === 5 ? 1.5 * visualScale : 1 * visualScale, ink);
    }
  });
  const headX = x - s.head * visualScale * .18;
  const headY = y + s.headRaise;
  const hr = s.head * visualScale;
  parts += `<ellipse cx="${headX}" cy="${headY}" rx="${hr * .87}" ry="${hr}" fill="${stage === 1 ? '#202822' : dark}" stroke="${ink}" stroke-width="1.2"/>`;
  if (stage >= 2) {
    parts += `<path d="M${headX - hr * .3} ${headY - hr * .6}l${hr * .65} ${hr * .7}l${-hr * .62} ${hr * .35}Z" fill="${gold}" fill-opacity=".85"/>
      <path d="M${headX + hr * .35} ${headY - hr * .7}q${hr * .45} ${hr * .75} ${hr * .05} ${hr * 1.3}" stroke="${gold}" stroke-width="1.1"/>`;
  }
  // Tiny true antennae at the head are distinct from the long body filaments.
  parts += `<path d="M${headX - hr * .65} ${headY - hr * .25}l${-4 * visualScale} ${-3 * visualScale}m${hr * .1} ${hr * .55}l${-3 * visualScale} ${2 * visualScale}" stroke="${ink}" stroke-width=".8"/>`;
  const front = centers[1];
  const rear = centers[11];
  parts += `<path d="M${front.x} ${front.y - front.r}q${-6 * visualScale} ${-s.frontFilament * visualScale * .5} ${-3 * visualScale} ${-s.frontFilament * visualScale}" stroke="${ink}" stroke-width="${Math.max(1, 2.2 * visualScale)}"/>
    <path d="M${rear.x} ${rear.y - rear.r}q${6 * visualScale} ${-s.rearFilament * visualScale * .5} ${4 * visualScale} ${-s.rearFilament * visualScale}" stroke="${ink}" stroke-width="${Math.max(1, 1.8 * visualScale)}"/>`;
  return parts;
}

export function instarDiagram(stage: number): string {
  const n = Number.isFinite(stage) ? Math.max(0, Math.min(5, Math.round(stage))) : 0;
  if (n === 0) {
    const lengths = [58, 74, 89, 103, 117];
    const drawings = lengths.map((length, i) => {
      const x = 35 + i * 133;
      return `<g aria-label="Instar ${i + 1}"><title>Instar ${i + 1}</title>${caterpillar(i + 1, x + 8, 163, length, .66)}${bracket(x, 213, 112)}${Array.from({ length: i + 1 }, (_, dotIndex) => dot(x + 47 + dotIndex * 6 - i * 3, 240, 1.6)).join('')}</g>`;
    }).join('');
    const overview = figure('Five monarch instars — comparative illustration', 'From left to right, five independently drawn larval stages differ in head-to-body proportion, body contour, band clarity, filament length and proleg markings. Display sizes are illustrative, not a measured scale.', leafGround() + drawings);
    const features = [
      'A pale body, a dark head and barely visible filaments.',
      'Clearer bands and a yellow triangle on the head.',
      'Stronger abdominal bands and longer filaments.',
      'Distinct thoracic bands and white proleg markings.',
      'A plumper body, broad bands and conspicuous proleg dots.',
    ];
    // Two responsive presentations of the same five authored specimens. CSS
    // removes the inactive subtree from both layout and the accessibility tree.
    // The transition plate retains the compact overview at every breakpoint.
    const rows = features.map((feature, i) => `<figure class="instar-comparison-row">
      <figcaption><span class="instar-row-label">Instar ${i + 1}</span><span class="instar-row-feature">${feature}</span></figcaption>
      ${figure(`Instar ${i + 1} — enlarged comparative illustration`, `A side-view drawing with the head at the left. ${feature} This specimen is enlarged separately for comparison; its display length is not a measurement.`, `${leafGround()}${caterpillar(i + 1, 146, 156, 360, 1.3)}`, '110 65 430 165')}
    </figure>`).join('');
    return `<div class="instar-comparison" role="group" aria-label="Five monarch instars — illustrative comparison">
      <div class="instar-comparison-overview">${overview}</div>
      <div class="instar-comparison-rows">${rows}<p class="instar-row-disclaimer">Each specimen is enlarged separately. Display sizes are illustrative, not a measured growth scale.</p></div>
    </div>`;
  }
  const frontX = 146 + 300 / 13 * 1.55;
  return figure(`Instar ${n} — illustrative specimen`, `Monarch larval instar ${n}, shown as a side-view explanatory drawing. The head is at the left. Three thoracic legs and abdominal prolegs are shown on the visible side. ${[
    'The body is pale, with a relatively large dark head and only small filament bumps.',
    'Clear bands and a yellow head triangle distinguish the second instar.',
    'Abdominal bands are stronger than thoracic bands; the filaments are longer.',
    'Thoracic bands and white proleg markings become distinct.',
    'The body is plumper, with broad dark bands, long filaments and conspicuous proleg dots.',
  ][n - 1]} This drawing has no measurement scale.`, `
    ${leafGround()}
    ${caterpillar(n, 146, 156, 360, 1.3)}
    <path d="M105 95h-28v24m460 78h27v-23" stroke="${green}" stroke-width="1" opacity=".45"/>
    <path d="M${frontX + 18} 54h70" stroke="${gold}" opacity=".65"/>
    <path d="M${frontX + 18} 54l-15 20" stroke="${gold}" opacity=".65"/>
    ${dot(frontX + 3, 74, 2)}
    ${bracket(141, 249, 370)}
  `);
}

function egg(x: number, baseY: number, width: number, height: number, state = 0): string {
  const left = x - width / 2;
  const right = x + width / 2;
  const top = baseY - height;
  let shell = state < 2
    ? `<path d="M${left} ${baseY}C${left - width * .08} ${top + height * .6} ${x - width * .33} ${top} ${x} ${top}C${x + width * .33} ${top} ${right + width * .08} ${top + height * .6} ${right} ${baseY}Z" fill="${ink}" fill-opacity=".16" stroke="${ink}" stroke-width="1.5"/>`
    : `<path d="M${left} ${baseY}Q${left - 2} ${top + height * .5} ${x - width * .22} ${top + height * .24}l${width * .12} 4l${width * .12} -6l${width * .1} 8l${width * .17} -2l${width * .12} 9Q${right + 3} ${top + height * .65} ${right} ${baseY}Z" fill="${ink}" fill-opacity=".1" stroke="${ink}" stroke-width="1.5"/>`;
  for (let i = -3; i <= 3; i++) {
    const f = i / 3;
    const startY = state === 2 ? top + height * .45 : top + Math.abs(f) * height * .1 + 2;
    shell += `<path d="M${x + f * width * .15} ${startY}Q${x + f * width * .42} ${top + height * .58} ${x + f * width * .41} ${baseY - 1}" stroke="${ink}" stroke-width=".75" opacity=".7"/>`;
  }
  if (state === 1) shell += `<path d="M${x + width * .2} ${top + height * .22}l4 5l-3 7l4 4l-3 6" stroke="${dark}" stroke-width="3.5"/><path d="M${x + width * .2} ${top + height * .22}l4 5l-3 7l4 4l-3 6" stroke="${gold}" stroke-width="1.1"/>`;
  return shell;
}

export function hostDiagram(): string {
  return figure('Milkweed host — botanical illustration', 'A stem supports two broad, smooth-edged leaves. Branching veins lead to one small ridged egg on the underside of the larger leaf. This is a schematic habitat reference, not a plant-identification key.', `
    <path d="M494 273C493 207 500 130 487 29" stroke="${green}" stroke-width="4"/>
    <path d="M497 157C422 77 260 50 112 92C229 179 377 209 497 157Z" fill="${green}" fill-opacity=".08" stroke="${green}" stroke-width="1.7"/>
    <path d="M497 157C383 134 231 110 112 92" stroke="${ink}" stroke-width="1.5"/>
    <path d="M193 105l34-26m-4 31l-5 31m44-24l40-43m-6 47l6 58m17-54l41-37m-5 42l10 61m31-54l30-25m-2 33l6 34" stroke="${green}" opacity=".75"/>
    <path d="M497 157C532 99 595 76 650 90C625 147 566 181 497 157Z" fill="${green}" fill-opacity=".06" stroke="${green}" stroke-width="1.4"/>
    <path d="M497 157L650 90M540 138l6-25m14 17l27 9m-2-25l7-20m13 13l20 1" stroke="${green}" stroke-width="1" opacity=".7"/>
    ${egg(307, 163, 16, 24)}
    <path d="M305 168l-28 53h-86" stroke="${gold}" stroke-width="1.1"/>
    ${dot(307, 165, 2.5)}
    <path d="M194 221h-29m-8 0h-7" stroke="${gold}" opacity=".5"/>
    ${bracket(111, 253, 385)}
  `);
}

export function hatchDiagram(stage: number): string {
  const n = Number.isFinite(stage) ? Math.max(0, Math.min(2, Math.round(stage))) : 0;
  const pose = n === 0 ? 'Intact egg' : n === 1 ? 'The first opening' : 'Newly emerged larva';
  const larva = n === 2 ? caterpillar(1, 373, 180, 99, .48) : '';
  return figure(`${pose} — hatching illustration`, `Stage ${n + 1} of three selected hatching poses. The egg base and leaf remain in the same positions. ${n === 0 ? 'A ridged casing is intact.' : n === 1 ? 'A small opening appears in the side near the top of the casing.' : 'An opened casing remains at left and a tiny pale larva with a dark head rests on the adjacent leaf.'} This is a schematic sequence, not timed footage.`, `
    ${leafGround()}
    <path d="M96 216Q213 174 340 199Q469 221 607 193" stroke="${green}" stroke-width="1.1" opacity=".35"/>
    ${egg(284, 200, 52, 83, n)}
    ${n === 1 ? `<ellipse cx="300" cy="145" rx="5" ry="6" fill="${dark}" stroke="${gold}" stroke-width=".9"/>` : ''}
    ${larva}
    <path d="M284 216v15m-7 0h14" stroke="${gold}" opacity=".75"/>
    ${n === 2 ? `<path d="M326 156h37m-7-5l7 5l-7 5" stroke="${gold}" stroke-width="1.2" opacity=".75"/>` : ''}
  `);
}

export function feedingDiagram(after: boolean): string {
  const outline = after
    ? 'M142 210Q238 145 328 151C335 163 340 173 352 170C362 168 369 158 374 152Q489 151 612 199Q379 284 142 210Z'
    : 'M142 210Q239 145 328 151Q468 141 612 199Q379 284 142 210Z';
  return figure(`${after ? 'After' : 'Before'} feeding — leaf comparison`, `The same young caterpillar and leaf are shown ${after ? 'with a small curved loss of tissue beside the mouth' : 'before the illustrated bite'}. The mouth is at the left end of the larva, directly beside the changing leaf margin. No feeding rate or measured amount is implied.`, `
    <path d="${outline}" fill="${green}" fill-opacity=".08" stroke="${green}" stroke-width="1.5"/>
    <path d="M142 210Q374 195 612 199M218 205l56-39m-13 37l46 39m21-41l63-42m-8 42l64 34m-6-35l38-31m-2 30l51 15" stroke="${green}" stroke-width=".9" opacity=".65"/>
    ${caterpillar(1, 355, 153, 135, .65)}
    <path d="M344 159l-4 6" stroke="${ink}" stroke-width="1.3"/>
    <path d="M341 167l-45-43h-72" stroke="${gold}" stroke-width="1.1"/>
    ${dot(341, 167, 2.5)}
    ${after ? '<path d="M330 153Q346 165 370 154" stroke="#D1B974" stroke-width="1" stroke-dasharray="2 5" opacity=".55"/>' : ''}
    ${bracket(142, 271, 470)}
  `);
}

function silkPad(x = 350, y = 58): string {
  let silk = `<path d="M${x - 83} ${y - 16}Q${x} ${y - 25} ${x + 103} ${y - 18}" stroke="${green}" stroke-width="6"/>
    <path d="M${x - 83} ${y - 19}Q${x} ${y - 28} ${x + 103} ${y - 21}" stroke="${ink}" stroke-width=".8" opacity=".35"/>`;
  for (let i = 0; i < 7; i++) silk += `<path d="M${x - 12 + i * 4} ${y - 20}Q${x - 9 + i * 2.5} ${y - 5} ${x - 4 + i * 1.4} ${y}" stroke="${ink}" stroke-width=".65" opacity=".7"/>`;
  return silk;
}

export function attachmentDiagram(): string {
  const centers = [
    [350, 79, 0], [344, 95, 10], [337, 111, 12], [332, 128, 8],
    [329, 146, 0], [331, 164, -15], [336, 182, -29], [346, 197, -45],
    [361, 209, -65], [378, 212, -95], [394, 207, -120], [405, 196, -140],
  ];
  const bands = centers.map(([x, y, a], i) => `<g transform="rotate(${a} ${x} ${y})"><path d="M${x - 9} ${y}Q${x} ${y + 3} ${x + 9} ${y}" stroke="${i % 2 ? gold : ink}" stroke-width="3"/></g>`).join('');
  return figure('Silk attachment and J posture — illustrative diagram', 'The rear prolegs of a mature larva attach to a silk pad beneath a stable support. Its body curves down into a J, with the head at the lower right. The silk is a small contact pad, not a long rope. Observe wild animals without handling them.', `
    ${silkPad()}
    <path d="M346 58l-3 14m11-14l-2 15" stroke="${ink}" stroke-width="1.4"/>
    <path d="M350 74C338 105 322 152 337 183C353 221 393 222 410 185" stroke="${ink}" stroke-width="24"/>
    <path d="M350 74C338 105 322 152 337 183C353 221 393 222 410 185" stroke="${dark}" stroke-width="21"/>
    ${bands}
    <path d="M331 130l12 2m-15 14l13 2m-12 14l13-3m-9 18l12-6" stroke="${ink}" stroke-width="2.5"/>
    <ellipse cx="412" cy="180" rx="11" ry="14" transform="rotate(20 412 180)" fill="${dark}" stroke="${ink}" stroke-width="1.3"/>
    <path d="M410 171l6 11l-8 2Z" fill="${gold}"/>
    <path d="M401 194q18 0 22 10m-16-4l9 12m-49-7l-4 8m-12-14l-5 9" stroke="${ink}" stroke-width="1"/>
    <path d="M404 199q14 7 24 2m-80-112q-14-5-10-15" stroke="${ink}" stroke-width="2"/>
    <path d="M345 59l-47 34h-87" stroke="${gold}" stroke-width="1"/>
    ${dot(345, 59, 2.7)}
    <path d="M496 117v79m-5-9l5 9l5-9" stroke="${green}" opacity=".55"/>
  `);
}

function chrysalisOutline(): string {
  return 'M347 65C339 79 321 85 313 107C302 137 309 173 318 202C323 220 334 235 350 238C370 231 382 210 387 183C395 143 389 111 378 95C369 81 359 76 355 65Z';
}

export function insideDiagram(): string {
  return figure('Illustrative reconstruction — developing adult structures', 'A deliberately simplified explanatory diagram uses a general chrysalis outline and silk support as reference points. It is not registered to the exact geometry of the exterior artwork. Two narrow folded wing regions are indicated within a general developing-adult contour. This is not microscopy, a dissection or an exact organ map; no transparent living shell is implied.', `
    ${silkPad()}
    <path d="M350 57v10" stroke="${ink}" stroke-width="2"/>
    <path d="${chrysalisOutline()}" stroke="${ink}" stroke-width="1.6" fill="${dark}" fill-opacity=".55"/>
    <path d="M350 79v147" stroke="${gold}" stroke-width=".8" stroke-dasharray="3 5" opacity=".6"/>
    <path d="M321 107Q350 120 383 107" stroke="${gold}" stroke-width="1.2"/>
    <path d="M339 120C323 130 319 164 329 198C331 206 338 211 342 215C347 181 347 153 339 120Z" fill="${gold}" fill-opacity=".12" stroke="${gold}" stroke-width="1.3"/>
    <path d="M361 120C377 132 381 163 372 196C369 205 364 211 358 215C353 180 354 151 361 120Z" fill="${gold}" fill-opacity=".12" stroke="${gold}" stroke-width="1.3"/>
    <path d="M340 120Q350 109 360 120M343 218Q350 225 358 215" stroke="${ink}" stroke-width="1" opacity=".7"/>
    <path d="M331 143l8 13m-10-1l11 17m-10-2l10 17m23-40l9-11m-10 27l10-13m-11 29l11-15" stroke="${gold}" stroke-width=".65" opacity=".5"/>
    <path d="M328 161l-52-29h-89m185 46l57-14h78" stroke="${gold}" stroke-width="1"/>
    ${dot(328, 161, 2.3)}${dot(372, 178, 2.3)}
    <path d="M306 86h-12v151h12m87 0h12V86h-12" stroke="${green}" stroke-width=".85" opacity=".5"/>
  `, '160 20 380 250');
}

function spentShell(): string {
  return `<path d="M349 48C341 58 327 66 326 85L331 105L339 98L345 106L352 97L359 103L370 91C373 70 360 57 353 48Z" fill="${ink}" fill-opacity=".06" stroke="${ink}" stroke-width="1.2"/>
    <path d="M337 67l-1 21m8-26l-1 28m9-29l1 29m8-22l2 19" stroke="${ink}" stroke-width=".7" opacity=".45"/>`;
}

function butterflyWings(stage: number): string {
  let fore = '';
  let hind = '';
  let veins = '';
  let spots = '';
  if (stage === 0) {
    fore = 'M345 141C331 143 320 156 326 166L323 174L331 181L330 192L339 195C345 181 348 159 345 141Z';
    hind = 'M345 151C330 162 334 176 330 181L337 190L335 201L342 204C349 188 350 164 345 151Z';
    veins = 'M343 146l-9 15l3 14l-2 15m10-35l-5 20l2 17';
    spots = `${dot(329, 164, 1.3, ink)}${dot(330, 177, 1.4, ink)}${dot(334, 189, 1.3, ink)}`;
  } else if (stage === 1) {
    fore = 'M345 141C327 136 299 148 287 166C287 180 295 185 292 199L303 213L307 227C329 214 346 179 345 141Z';
    hind = 'M346 156C326 169 309 194 308 213C309 223 316 233 326 237C340 220 350 183 346 156Z';
    veins = 'M342 144L305 172L300 198m42-49l-21 39l-12 30m36-61l-16 38l-7 31';
    spots = [[291, 169], [295, 183], [298, 199], [305, 212], [315, 226], [324, 231]].map(([x, y]) => dot(x, y, 1.7, ink)).join('');
  } else {
    fore = 'M345 141C318 119 279 105 239 108C230 137 247 170 275 184C304 193 327 174 345 141Z';
    hind = 'M344 150C313 164 286 172 275 185C271 208 286 231 308 239C334 226 345 193 344 150Z';
    veins = 'M342 142L245 116m93 29l-78-13m74 17l-61-2m55 8l-45 14m53-10l-38 49m40-39l-21 59m20-47l-3 39M270 121l1 25m16-21l-2 25m22-17l-7 20M290 181l17 17m-25 0l19 13';
    spots = [[242, 119], [243, 134], [250, 149], [260, 164], [272, 175], [283, 190], [286, 207], [296, 222], [307, 231]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="${i < 5 ? 2.3 : 2}" ry="3" fill="${ink}"/>`).join('');
  }
  const wingPair = `<path d="${hind}" fill="${copper}" fill-opacity=".24" stroke="${ink}" stroke-width="1.5"/>
    <path d="${fore}" fill="${copper}" fill-opacity=".38" stroke="${ink}" stroke-width="1.6"/>
    <path d="${veins}" stroke="${ink}" stroke-width="1.1" opacity=".9"/>
    ${spots}`;
  return `<g>${wingPair}</g><g transform="translate(700 0) scale(-1 1)">${wingPair}</g>`;
}

export function emergenceDiagram(stage: number): string {
  const n = Number.isFinite(stage) ? Math.max(0, Math.min(2, Math.round(stage))) : 0;
  const labels = ['Leaving the shell', 'Wings unfolding', 'Ready for flight'];
  const abdomenWidth = [9, 7, 5][n];
  const abdomenBottom = [202, 198, 194][n];
  return figure(`${labels[n]} — illustrative emergence pose`, `Selected pose ${n + 1} of three. One monarch hangs below its empty casing, which remains attached to the support. ${[
    'Small wrinkled wings hang close to the body, and the abdomen is relatively full.',
    'The wings are longer and unfolding, with some folded margins still present.',
    'Four expanded wings show the monarch pattern. The animal is still supported; this pose does not imply instant flight.',
  ][n]} The drawing is explanatory, not a measured time-lapse or an anatomical specimen.`, `
    ${silkPad(350, 43)}
    <path d="M350 42v8" stroke="${ink}" stroke-width="1.6"/>
    ${spentShell()}
    ${butterflyWings(n)}
    <path d="M346 142C${350 - abdomenWidth} 159 ${350 - abdomenWidth} 184 350 ${abdomenBottom}C${350 + abdomenWidth} 184 ${350 + abdomenWidth} 159 354 142Z" fill="${dark}" stroke="${ink}" stroke-width="1.2"/>
    <path d="M344 169h12m-11 8h10m-9 8h8" stroke="${ink}" stroke-width=".6" opacity=".6"/>
    <ellipse cx="350" cy="140" rx="7" ry="13" fill="${dark}" stroke="${ink}" stroke-width="1.3"/>
    <circle cx="350" cy="120" r="6" fill="${dark}" stroke="${ink}" stroke-width="1.2"/>
    <path d="M347 116q-10-10-12-18m18 18q10-10 12-18" stroke="${ink}" stroke-width="1"/>
    ${dot(335, 98, 1.5, ink)}${dot(365, 98, 1.5, ink)}
    <path d="M345 136l-12-13l3-20m19 33l12-13l-3-21m-19 44l-20-16l3-23m27 39l20-16l-4-24m-22 29l-5-4m7 4l5-4" stroke="${ink}" stroke-width="1.1"/>
    <path d="M401 77h51m-9-5l9 5l-9 5" stroke="${green}" stroke-width="1" opacity=".6"/>
    ${bracket(236, 270, 228)}
  `);
}

export function cycleDiagram(): string {
  const circle = (x: number) => `<circle cx="${x}" cy="145" r="50" stroke="${green}" stroke-width="1" fill="${green}" fill-opacity=".04"/>`;
  return figure('Monarch life cycle — four stages', 'A four-stage cycle: egg, larva, pupa and adult. Arrows connect the stages, and a lower return path connects the adult to the next generation of eggs. The same individual does not turn back into an egg.', `
    ${[95, 265, 435, 605].map(circle).join('')}
    <g role="img" aria-label="Egg"><title>Egg</title>${egg(95, 164, 24, 40)}</g>
    <g role="img" aria-label="Larva"><title>Larva</title>${caterpillar(4, 236, 144, 64, .48)}</g>
    <g role="img" aria-label="Pupa"><title>Pupa</title>
      <path d="M419 112h32m-16 0v8M435 120C416 135 418 165 435 177C451 167 454 135 435 120Z" stroke="${ink}" stroke-width="1.4" fill="${green}" fill-opacity=".1"/>
      <path d="M423 138q12 5 25 0" stroke="${gold}" stroke-width="1.4"/>
    </g>
    <g role="img" aria-label="Adult"><title>Adult</title>
      <path d="M605 141C593 119 575 118 572 126C570 140 582 151 599 150C579 150 575 163 588 174C600 174 604 158 605 146C608 158 611 174 623 174C636 163 632 150 612 150C629 151 641 140 639 126C636 118 618 119 605 141Z" fill="${copper}" fill-opacity=".25" stroke="${ink}" stroke-width="1.2"/>
      <path d="M605 137v28m-2-31l-4-6m8 6l4-6M603 144l-23-15m24 18l-24-1m24 6l-15 14m18-22l23-15m-23 18l24-1m-24 6l15 14" stroke="${ink}" stroke-width=".8"/>
    </g>
    <path d="M153 145h52m-7-5l7 5l-7 5m125-5h52m-7-5l7 5l-7 5m125-5h52m-7-5l7 5l-7 5" stroke="${gold}" stroke-width="1.1"/>
    <path d="M605 205v24Q605 244 584 244H115Q95 244 95 224v-19m-5 8l5-8l5 8" stroke="${green}" stroke-width="1" stroke-dasharray="3 5" opacity=".8"/>
  `);
}
