import { routes, type RouteId } from './content';

const ink = '#0B1421';
const muted = '#70858C';
const amber = '#E9A85F';
const sea = '#85ABB3';
const rose = '#DDA6A0';
const light = '#E5EAE9';

const escapeXml = (value: string): string => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const safePrefix = (value: string, fallback: string): string =>
  value.replace(/[^a-zA-Z0-9_-]/g, '-') || fallback;

/**
 * These diagrams explain fictional relationships, not operational systems.
 * Pass a distinct prefix when rendering a diagram more than once in a document.
 * Their controls and responsive text alternatives belong to the surrounding UI.
 */
export function atlasSvg(prefix = 'atlas'): string {
  const id = safePrefix(prefix, 'atlas');
  const routePaths: Record<Exclude<RouteId, 'all'>, string> = {
    bakery: 'M145 130H240V235H305',
    care: 'M565 140H650V235H710',
    streets: 'M180 390H395V455H455',
    transit: 'M650 330H720H840V470H905',
    utilities: 'M775 170V235H650V535H500',
  };
  const routeColors: Record<Exclude<RouteId, 'all'>, string> = {
    bakery: amber,
    care: rose,
    streets: sea,
    transit: '#A0B5C5',
    utilities: '#CDBA8C',
  };
  const blockRows = [
    [105, 172, 60, 40], [178, 172, 46, 40], [258, 172, 55, 40], [330, 172, 65, 40],
    [105, 256, 60, 50], [178, 256, 46, 50], [258, 256, 55, 50], [330, 256, 65, 50],
    [125, 345, 95, 28], [238, 345, 75, 28], [330, 345, 48, 28],
    [125, 411, 95, 28], [238, 411, 75, 28], [330, 411, 48, 28],
    [155, 470, 65, 30], [255, 470, 58, 30], [330, 470, 65, 30],
    [155, 535, 65, 35], [255, 535, 58, 35], [330, 535, 65, 35],
    [590, 170, 42, 45], [670, 170, 83, 45], [797, 170, 78, 45],
    [590, 257, 42, 50], [670, 257, 83, 50], [775, 257, 100, 50],
    [590, 351, 42, 80], [670, 351, 83, 80], [775, 351, 43, 80], [858, 351, 43, 80],
    [670, 490, 83, 64], [775, 490, 43, 64], [858, 490, 43, 64],
  ];
  const blocks = blockRows.map(([x, y, width, height]) =>
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="2"/>`,
  ).join('');

  const groups = routes.filter(route => route.id !== 'all').map(route => {
    const routeId = route.id as Exclude<RouteId, 'all'>;
    const color = routeColors[routeId];
    const points = route.points.map(point => {
      const leftLabel = point.x > 800;
      const labelX = point.x + (leftLabel ? -18 : 18);
      const anchor = leftLabel ? 'end' : 'start';
      const labelY = point.y + (point.label === 'Light on duty' ? -21 : -18);
      return `<g class="atlas-point" data-landmark="${escapeXml(point.label)}">
        <circle cx="${point.x}" cy="${point.y}" r="12" fill="${ink}" stroke="${color}" stroke-width="1" opacity=".9"/>
        <circle cx="${point.x}" cy="${point.y}" r="4" fill="${color}"/>
        <text x="${labelX}" y="${labelY}" text-anchor="${anchor}" fill="${light}" font-size="21" font-weight="400" paint-order="stroke" stroke="${ink}" stroke-width="6" stroke-linejoin="round">${escapeXml(point.label)}</text>
      </g>`;
    }).join('');
    return `<g class="route-layer" data-route="${routeId}">
      <path class="atlas-route" d="${routePaths[routeId]}" fill="none" stroke="${color}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
      ${points}
    </g>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" class="atlas-diagram" viewBox="0 0 1000 650" role="img" aria-labelledby="${id}-title ${id}-desc" focusable="false" font-family="Arial, Helvetica, sans-serif">
    <title id="${id}-title">Meridian City — an illustrative night atlas</title>
    <desc id="${id}-desc">A fictional city plan with bakery, care, street, transit and utility locations. Each named route marks an editorial connection, not a service route or a physical network. The market is also shown. Use the labeled route controls and chapter links beside the map.</desc>
    <defs>
      <clipPath id="${id}-bounds"><rect x="64" y="90" width="872" height="500" rx="2"/></clipPath>
    </defs>
    <text x="66" y="55" fill="${light}" font-size="25" letter-spacing="1">Meridian City</text>
    <text x="934" y="55" text-anchor="end" fill="${sea}" font-size="18">Illustrative city</text>
    <path d="M66 75H934" stroke="${muted}" stroke-opacity=".35"/>
    <g clip-path="url(#${id}-bounds)">
      <path d="M430 70C455 150 525 180 511 260S455 350 505 413S579 470 601 595" fill="none" stroke="#182D3C" stroke-width="48"/>
      <path d="M405 70C430 150 500 180 486 260S430 350 480 413S554 470 576 595M455 70C480 150 550 180 536 260S480 350 530 413S604 470 626 595" fill="none" stroke="${sea}" stroke-width="1" stroke-opacity=".25"/>
      <g fill="#203545" fill-opacity=".43" stroke="${muted}" stroke-opacity=".22" stroke-width=".8">${blocks}</g>
      <g fill="none" stroke="${muted}" stroke-linecap="round" stroke-linejoin="round">
        <path d="M84 130H440M94 235H930M95 330H929M110 390H430M112 455H930M125 520H430M132 585H905M565 140H925M565 470H933M565 570H925" stroke-width="1.3" stroke-opacity=".38"/>
        <path d="M94 112V340L145 585M240 115V585M320 130V585M405 130V570M565 110V570M650 105V585M765 112V585M840 115V585M925 140V570" stroke-width="1.3" stroke-opacity=".38"/>
        <path d="M75 316H936M75 341H936M113 443H935M113 468H935" stroke-width=".8" stroke-opacity=".18"/>
      </g>
      <path d="M452 330H554M501 455H612" fill="none" stroke="${sea}" stroke-width="7" stroke-opacity=".22"/>
      <path d="M452 330H554M501 455H612" fill="none" stroke="${ink}" stroke-width="3"/>
      <g fill="${sea}" opacity=".62" font-size="14" letter-spacing="3">
        <text x="144" y="115">WEST BANK</text>
        <text x="663" y="115">EAST BANK</text>
      </g>
      ${groups}
      <g class="atlas-context-point">
        <circle cx="235" cy="510" r="4" fill="${muted}"/>
        <text x="250" y="527" fill="${sea}" font-size="18" paint-order="stroke" stroke="${ink}" stroke-width="6" stroke-linejoin="round">The market</text>
      </g>
    </g>
    <path d="M66 604H934" stroke="${muted}" stroke-opacity=".35"/>
    <text x="66" y="632" fill="${sea}" font-size="16">Many places. One imagined night.</text>
    <text x="934" y="632" text-anchor="end" fill="${sea}" font-size="16">Not a service map</text>
  </svg>`;
}

export function railSectionSvg(prefix = 'rail-section'): string {
  const id = safePrefix(prefix, 'rail-section');
  return `<svg xmlns="http://www.w3.org/2000/svg" class="rail-diagram" viewBox="0 0 760 500" role="img" aria-labelledby="${id}-title ${id}-desc" focusable="false" font-family="Arial, Helvetica, sans-serif">
    <title id="${id}-title">A conceptual rail section</title>
    <desc id="${id}-desc">A simplified rail profile shows a broad head, a narrow upright web and a wide foot, resting above a sleeper and ballast. The illustration has no dimensions, settings or maintenance procedure. It is not to scale.</desc>
    <defs>
      <pattern id="${id}-ballast" patternUnits="userSpaceOnUse" width="48" height="34">
        <path d="M3 11L13 3L25 12L17 23ZM29 19L39 10L47 23L36 31M0 30L7 25L15 34" fill="none" stroke="${muted}" stroke-width="1" stroke-opacity=".55"/>
      </pattern>
      <linearGradient id="${id}-steel" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#203545"/><stop offset=".45" stop-color="#527480"/><stop offset=".52" stop-color="#385563"/><stop offset="1" stop-color="#1B2C3A"/>
      </linearGradient>
    </defs>
    <text x="40" y="45" fill="${light}" font-size="25">A closer look</text>
    <path d="M40 68H720" stroke="${muted}" stroke-opacity=".35"/>
    <path d="M120 350H640L685 421H75Z" fill="url(#${id}-ballast)" stroke="${muted}" stroke-opacity=".5"/>
    <path d="M150 326H610V357H150Z" fill="#30464E" stroke="${sea}" stroke-width="1.5"/>
    <path d="M260 309H500V324H260Z" fill="#172A38" stroke="${sea}" stroke-width="1.4"/>
    <path d="M321 139Q321 125 336 125H424Q439 125 439 139V168Q439 180 425 181L402 186L393 204V267Q393 280 415 288L467 303Q478 306 478 310H282Q282 306 293 303L345 288Q367 280 367 267V204L358 186L335 181Q321 180 321 168Z" fill="url(#${id}-steel)" stroke="${sea}" stroke-width="2"/>
    <path d="M335 127H425M369 205V264M293 307H467" fill="none" stroke="${light}" stroke-opacity=".6" stroke-width="1.5"/>
    <g fill="none" stroke="${amber}" stroke-width="1.2">
      <path d="M439 148H530L555 123H675"/><path d="M393 229H530L555 212H675"/>
      <path d="M478 306H550L575 289H675"/><path d="M150 341H112L85 314H40"/>
      <path d="M159 390H110L85 413H40"/>
    </g>
    <g fill="${light}" font-size="20">
      <text x="555" y="114">Head</text><text x="555" y="203">Web</text><text x="575" y="280">Foot</text>
      <text x="40" y="304">Sleeper</text><text x="40" y="442">Ballast</text>
    </g>
    <text x="40" y="480" fill="${sea}" font-size="17">Conceptual section — not an inspection guide</text>
    <text x="720" y="480" text-anchor="end" fill="${sea}" font-size="17">Not to scale</text>
  </svg>`;
}

export function waterPathSvg(prefix = 'water-path'): string {
  const id = safePrefix(prefix, 'water-path');
  const nodes = [
    { y: 115, label: 'Stored water', note: 'A place in the imagined story', icon: 'M111 103V127Q130 138 149 127V103M111 103Q130 93 149 103Q130 113 111 103M111 115Q130 125 149 115' },
    { y: 235, label: 'Treatment', note: 'Another room beyond the street', icon: 'M112 219H148V251H112ZM112 230H148M122 219V251M138 219V251' },
    { y: 355, label: 'Distribution', note: 'A connection to the neighborhood', icon: 'M112 355H148M130 339V371M112 339H120V347H112ZM140 363H148V371H140Z' },
    { y: 475, label: 'Everyday use', note: 'The ordinary tap at the end of a night', icon: 'M113 467H145V480M124 457H140M132 457V467M144 487Q150 494 144 498Q138 494 144 487' },
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" class="water-diagram" viewBox="0 0 640 610" role="img" aria-labelledby="${id}-title ${id}-desc" focusable="false" font-family="Arial, Helvetica, sans-serif">
    <title id="${id}-title">Water in the imagined city</title>
    <desc id="${id}-desc">Four labeled ideas: stored water, treatment, distribution and everyday use. Dotted editorial links connect these ideas. This is illustrative only, not a real system, a prescribed process order, or operating guidance.</desc>
    <text x="42" y="42" fill="${light}" font-size="25">Beyond the road</text>
    <text x="598" y="42" text-anchor="end" fill="${sea}" font-size="17">Illustrative only</text>
    <path d="M42 64H598" stroke="${muted}" stroke-opacity=".35"/>
    <path d="M130 150V200M130 270V320M130 390V440" fill="none" stroke="${sea}" stroke-width="1.4" stroke-dasharray="3 7" stroke-linecap="round"/>
    ${nodes.map(node => `<g>
      <circle cx="130" cy="${node.y}" r="35" fill="#203545" fill-opacity=".35" stroke="${sea}" stroke-width="1.2"/>
      <path d="${node.icon}" fill="none" stroke="${amber}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="195" y="${node.y - 5}" fill="${light}" font-size="25">${node.label}</text>
      <text x="195" y="${node.y + 23}" fill="${sea}" font-size="17">${node.note}</text>
    </g>`).join('')}
    <path d="M42 545H598" stroke="${muted}" stroke-opacity=".35"/>
    <text x="42" y="574" fill="${sea}" font-size="17">Editorial relationships, not a real network.</text>
    <text x="42" y="598" fill="${sea}" font-size="17">No operational sequence or settings are shown.</text>
  </svg>`;
}

export function utilitySvg(prefix = 'utility'): string {
  const id = safePrefix(prefix, 'utility');
  const places = [
    { x: 112, label: 'Street', path: 'M102 330H123M113 330V362M105 362H121M101 342H123' },
    { x: 290, label: 'Care', path: 'M276 340H304V360H276ZM276 347H304M279 335H287V342H279' },
    { x: 468, label: 'Bakery', path: 'M451 349Q451 335 468 335Q485 335 485 349V359H451ZM460 339L456 348M469 338L465 347M478 340L474 349' },
    { x: 646, label: 'Platform', path: 'M630 334H662V357H630ZM635 339H643V347H635ZM649 339H657V347H649ZM633 362H659' },
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" class="utility-diagram" viewBox="0 0 760 505" role="img" aria-labelledby="${id}-title ${id}-desc" focusable="false" font-family="Arial, Helvetica, sans-serif">
    <title id="${id}-title">What stays on in this fictional night</title>
    <desc id="${id}-desc">A steady lamp sits above four separate observations: a street, a care station, a bakery and a platform. The dotted links are editorial connections. This is not a live power grid or an electrical diagram.</desc>
    <text x="40" y="45" fill="${light}" font-size="25">A familiar light</text>
    <path d="M40 68H720" stroke="${muted}" stroke-opacity=".35"/>
    <path d="M380 96V125M359 125H401L425 171H335Z" fill="#203545" stroke="${sea}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M335 171H425" stroke="${amber}" stroke-width="3" stroke-linecap="round"/>
    <path d="M369 173Q380 190 391 173" fill="${amber}" fill-opacity=".55" stroke="${amber}" stroke-width="1.4"/>
    <path d="M353 190L342 207M380 197V216M407 190L418 207" fill="none" stroke="${amber}" stroke-width="1.4" stroke-linecap="round"/>
    <text x="380" y="246" text-anchor="middle" fill="${sea}" font-size="18">One light, four observations</text>
    <path d="M112 300V283H646V300M290 283V300M468 283V300M380 263V283" fill="none" stroke="${muted}" stroke-width="1.2" stroke-dasharray="3 6" stroke-linecap="round"/>
    ${places.map(place => `<g>
      <circle cx="${place.x}" cy="347" r="38" fill="#203545" fill-opacity=".32" stroke="${sea}" stroke-width="1.2"/>
      <path d="${place.path}" fill="none" stroke="${amber}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="${place.x}" y="418" text-anchor="middle" fill="${light}" font-size="21">${place.label}</text>
    </g>`).join('')}
    <path d="M40 449H720" stroke="${muted}" stroke-opacity=".35"/>
    <text x="380" y="480" text-anchor="middle" fill="${sea}" font-size="17">An editorial illustration — not a live power network</text>
  </svg>`;
}
