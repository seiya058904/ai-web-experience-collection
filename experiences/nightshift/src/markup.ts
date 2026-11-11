import { chapters, routes, morningTraces, aboutCopy, type Chapter } from './content';
import { atlasSvg, railSectionSvg, waterPathSvg, utilitySvg } from './diagrams';
import { icon } from './icons';

const chapterLink = (id: string, label: string, cls = 'text-link') => `<a class="${cls}" href="#${id}" data-chapter-link>${label}${icon('arrow')}</a>`;
const image = (key: string, alt: string, id = '', cls = '') => `<img ${id ? `id="${id}"` : ''} class="editorial-image ${cls}" src="${import.meta.env.BASE_URL}nightshift/media/${key}.webp" data-media-key="${key}" data-local-image width="1586" height="992" loading="lazy" decoding="async" alt="${alt}" />`;
const chapterHead = (ch: Chapter) => `<div class="chapter-copy"><div class="chapter-context"><span>${ch.number} / ${ch.name}</span><time>${ch.time}</time></div><h2 id="title-${ch.id}" tabindex="-1">${ch.heading}</h2><p class="chapter-lead">${ch.body}</p></div>`;
const beat = (ch: Chapter, extra = '', cls = '') => `<div class="second-beat ${cls}" data-beat="2"><span class="fine-rule"></span><h3>${ch.beatTitle}</h3><p>${ch.beatBody}</p>${extra}</div>`;
const section = (ch: Chapter, content: string, cls: string) => `<section class="chapter chapter--${cls}" id="${ch.id}" data-chapter="${ch.number}" aria-labelledby="title-${ch.id}"><div class="chapter-still">${image(ch.image, ch.alt)}</div>${content}</section>`;

function hero() {
  const ch = chapters[0];
  return `<section class="chapter chapter--hero" id="ch-01" data-chapter="01" aria-labelledby="hero-title">
    <div class="hero-intro"><h1 id="hero-title" tabindex="-1">While the city <em>sleeps</em></h1><div class="hero-lead"><p>Quiet tasks carry an ordinary<br class="desktop-break" /> night into morning.</p>${chapterLink('ch-02', 'Follow the night', 'hero-cta')}</div></div>
    <div class="hero-caption"><span class="window-symbol">${icon('window')}</span><div><h2 id="title-ch-01" tabindex="-1">${ch.heading}</h2><p>${ch.body}</p></div></div>
    <div class="hero-observation" data-beat="2"><h3>${ch.beatTitle}</h3><p>${ch.beatBody}</p><button type="button" class="quiet-button" data-note="fiction">Is this a real city? ${icon('plus')}</button></div>
    <div class="hero-bottom"><span>Meridian City · an imagined night</span><span class="scroll-cue">Scroll to follow ${icon('down')}</span></div>
  </section>`;
}

function atlas() {
  const ch = chapters[1];
  return section(ch, `<div class="atlas-layout"><div class="atlas-intro">${chapterHead(ch)}${beat(ch)}<p class="fiction-label">Illustrative city · not a service map</p></div><div class="atlas-work"><div class="atlas-chart">${atlasSvg()}</div><div class="route-filters" role="group" aria-label="Choose a night route">${routes.map((r) => `<button type="button" data-route-filter="${r.id}" aria-pressed="${r.id === 'all'}">${r.label}</button>`).join('')}</div><div class="route-result"><p id="route-description" aria-live="polite">${routes[0].sentence}</p><a id="route-link" class="text-link" href="#ch-03" data-chapter-link>Follow this route ${icon('arrow')}</a></div></div></div>`, 'atlas');
}

function bakery() {
  const ch = chapters[2];
  return section(ch, `<div class="bakery-main">${chapterHead(ch)}<p class="scene-aside">A little flour.<br />A little warmth.<br /><em>A beginning.</em></p></div><div class="preparation-panel">${image('bakery-before', 'Hands working dough at the same bakery bench before the prepared portions are arranged.', 'bakery-detail-image')}<div class="preparation-copy">${beat(ch)}<div class="segmented" role="group" aria-label="Bakery preparation"><button data-bakery="before" aria-pressed="true">Before preparation</button><button data-bakery="after" aria-pressed="false">After preparation</button></div><p class="image-caption" data-bakery-caption>Hands work the flour into the dough.</p></div></div>`, 'bakery');
}

function care() {
  const ch = chapters[3];
  return section(ch, `<div class="care-main">${chapterHead(ch)}<div class="care-mark" aria-hidden="true"><span></span><span></span><span></span></div></div><div class="care-detail">${beat(ch, `<button class="text-link" type="button" data-note="care">Read the scene ${icon('plus')}</button>`)}<div class="care-crop">${image('care', 'Hands place a glass of water beside folded linen at a quiet care station.')}</div></div>`, 'care');
}

function street() {
  const ch = chapters[4];
  return section(ch, `<div class="street-intro">${chapterHead(ch)}<p class="editorial-note">A change small enough<br />to walk past.</p></div><div class="street-work"><figure class="comparison" style="--reveal:50%"><div class="comparison-before">${image('curb-before', 'Before sweeping: leaves, grit and paper gathered along the wet curb.')}</div><div class="comparison-after">${image('curb-after', 'After sweeping: the same curb with leaves and grit removed, revealing the worn paving and gutter.')}</div><div class="comparison-line" aria-hidden="true"><span>${icon('compare')}</span></div><span class="comparison-label before-label">Before</span><span class="comparison-label after-label">After</span><figcaption class="sr-only">Compare the same curb before and after sweeping. The amount of the after image shown is controlled by the slider below.</figcaption></figure><div class="comparison-controls"><label for="curb-range">Compare <output id="comparison-value" for="curb-range">50%</output></label><input id="curb-range" type="range" min="0" max="100" value="50" aria-label="Amount of the after-sweeping scene revealed" /><div class="comparison-buttons"><button data-compare="before">Before</button><button data-compare="after">After</button><button class="reset-link" data-compare="reset">Reset comparison</button></div></div>${beat(ch)}</div>`, 'street');
}

function rail() {
  const ch = chapters[5];
  return section(ch, `<div class="rail-main">${chapterHead(ch)}</div><div class="rail-observation"><div class="rail-copy">${beat(ch)}<div class="segmented" role="group" aria-label="Rail detail view"><button data-rail="surface" aria-pressed="true">Surface</button><button data-rail="section" aria-pressed="false">Section</button></div></div><div class="rail-detail"><div id="rail-surface">${image('rail', 'Close foreground rails, fasteners, sleepers and ballast in the quiet fictional tunnel.')}<p class="image-caption">Worn surfaces, held in place by many small parts.</p></div><div id="rail-section" hidden>${railSectionSvg()}</div></div></div>`, 'rail');
}

function water() {
  const ch = chapters[6];
  return section(ch, `<div class="water-main">${chapterHead(ch)}</div><div class="water-detail"><div class="water-crop">${image('water', 'Condensation and bolts around a substantial pipe flange, with supports continuing into the gallery.')}</div><div>${beat(ch, `<button class="text-link" data-water aria-expanded="false" aria-controls="water-diagram">Trace the path ${icon('plus')}</button>`)}<div id="water-diagram" class="inline-diagram" hidden>${waterPathSvg()}<p class="image-caption">Illustrative only. Separate facilities, simplified relationships.</p></div></div></div>`, 'water');
}

function utility() {
  const ch = chapters[7];
  return section(ch, `<div class="utility-main">${chapterHead(ch)}<div class="lamp-rule" aria-hidden="true"></div></div><div class="utility-detail">${beat(ch, `<button class="text-link" data-utility aria-expanded="false" aria-controls="utility-diagram">What stays on? ${icon('plus')}</button>`)}<div id="utility-diagram" class="inline-diagram" hidden>${utilitySvg()}<p class="image-caption">An editorial illustration of ordinary uses, not a grid diagram.</p></div></div>`, 'utility');
}

function market() {
  const ch = chapters[8];
  return section(ch, `<div class="market-main">${chapterHead(ch)}<p class="market-quote">Before the first<br />conversation,<br /><em>there are hands.</em></p></div><div class="market-detail">${image('market', 'Anonymous gloved hands sort loose flower stems into a worn crate before the market opens.', 'market-detail-image')}<div class="market-copy">${beat(ch)}<div class="segmented" role="group" aria-label="Market preparation"><button data-market="night" aria-pressed="true">Night</button><button data-market="first-light" aria-pressed="false">First light</button></div><p class="image-caption" data-market-caption>Loose stems are still being sorted under the canopy.</p></div></div>`, 'market');
}

function platform() {
  const ch = chapters[9];
  return section(ch, `<div class="platform-main">${chapterHead(ch)}</div><div class="platform-still-pair"><figure>${image('platform-before', 'The same prepared platform before the first vehicle, with empty rails and three anonymous waiting passengers.')}<figcaption class="image-caption">Before service: the platform is ready.</figcaption></figure><figure>${image('platform', 'The first tram stands at the same platform with an open door as one anonymous passenger begins to board.')}<figcaption class="image-caption">First service: a door opens onto the morning.</figcaption></figure></div><div class="platform-recall">${beat(ch)}<details class="night-recall"><summary>Trace this night ${icon('plus')}</summary><nav aria-label="Earlier work behind first service">${[chapters[2], chapters[4], chapters[5], chapters[7]].map((c) => chapterLink(c.id, c.name)).join('')}</nav></details></div>`, 'platform');
}

function dawn() {
  const ch = chapters[10];
  return section(ch, `<div class="dawn-main">${chapterHead(ch)}<p class="dawn-note">The window is quiet now.<br /><em>The work is still here.</em></p></div><div class="morning-atlas"><div class="morning-intro">${beat(ch)}<p>See the morning trace</p></div><div class="trace-list">${morningTraces.map((t, i) => `<button class="trace-button" data-trace="${t.id}"><span class="trace-number">${String(i + 1).padStart(2, '0')}</span><span>${t.label}</span>${icon('plus')}</button>`).join('')}</div></div><div class="ending"><p>The city does not sleep at once.</p>${chapterLink('ch-01', 'Return to midnight', 'ending-cta')}<button class="text-link" data-open-dialog="chapters">Explore the chapters again ${icon('menu')}</button></div>`, 'dawn');
}

const boundaryNames = ['A light becomes a route', 'A route finds a doorway', 'Through another pane', 'The light reaches the street', 'Between the parallel lines', 'Beyond the tunnel wall', 'Around the next corner', 'One working light to another', 'Toward the first platform', 'The windows of morning'];
function transition(index: number) {
  const from = String(index + 1).padStart(2, '0');
  const to = String(index + 2).padStart(2, '0');
  return `<div class="transition" id="tr-${from}-${to}" data-transition="${index}" aria-hidden="true"><div class="transition-caption"><span></span>${boundaryNames[index]}</div></div>`;
}

export function renderApp() {
  const chaptersHtml = [hero(), atlas(), bakery(), care(), street(), rail(), water(), utility(), market(), platform(), dawn()];
  return `<a class="skip-link" href="#ch-02" data-chapter-link>Skip to the night atlas</a><header class="site-header"><a class="wordmark" href="#ch-01" data-chapter-link aria-label="NIGHTSHIFT — Back to beginning"><span class="brand-window" aria-hidden="true"></span>NIGHTSHIFT<span class="brand-period">.</span></a><span class="header-subtitle">The city does not sleep at once</span><div class="header-actions"><a class="collection-return" href="${import.meta.env.BASE_URL}#world-nightshift" aria-label="Return to Collection" title="Return to Collection"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7"/></svg><span>Collection</span></a><button class="about-button" data-open-dialog="about">About this experience</button><button class="chapters-button" data-open-dialog="chapters">Chapters ${icon('menu')}</button></div></header>
  <main id="main">${chaptersHtml.map((html, i) => html + (i < 10 ? transition(i) : '')).join('')}</main>
  <nav class="chapter-rail" aria-label="Quick chapter navigation">${chapters.map((c) => `<a href="#${c.id}" data-chapter-link aria-label="${c.number}. ${c.name}" title="${c.name}"><span></span></a>`).join('')}</nav>
  <aside class="story-toolbar" aria-label="Experience controls"><div class="story-position"><span id="current-time">00:07</span><span class="toolbar-divider"></span><span id="current-chapter">One Light Left On</span><span class="story-count" id="chapter-count">01 / 11</span></div><div class="toolbar-options"><button data-motion-toggle aria-pressed="false">Motion: On</button><button data-sound aria-pressed="false">Sound: Off</button></div><div class="story-progress" aria-hidden="true"><span></span></div></aside>
  <div id="scene-status" class="scene-status" role="status" hidden><p>This scene could not load. The story remains available in still view.</p><button data-retry>Retry</button><button data-stills>View as stills</button></div>
  <div id="sound-status" class="sr-only" role="status"></div>
  <footer class="site-footer"><span>NIGHTSHIFT</span><p>An original portrait of an imagined city.</p><button data-open-dialog="about">About this experience</button>${chapterLink('ch-01', 'Back to beginning')}</footer>
  <dialog id="dialog-chapters" class="chapters-dialog" data-lenis-prevent aria-labelledby="chapters-dialog-title"><div class="dialog-top"><h2 id="chapters-dialog-title">Follow any light.</h2><button class="dialog-close icon-button" aria-label="Close chapters">${icon('close')}</button></div><p class="dialog-intro">One imagined night. Eleven ways to see it.</p><nav class="chapter-menu" aria-label="All chapters">${chapters.map((c) => `<a href="#${c.id}" data-chapter-link><span class="menu-number">${c.number}</span><span>${c.name}</span><time>${c.time}</time>${icon('arrow')}</a>`).join('')}</nav><p class="fiction-label">Times and places are fictional narrative markers.</p></dialog>
  <dialog id="dialog-about" data-lenis-prevent aria-labelledby="about-title"><div class="dialog-top"><h2 id="about-title">About this experience</h2><button class="dialog-close icon-button" aria-label="Close about this experience">${icon('close')}</button></div>${aboutCopy.map((p) => `<p>${p}</p>`).join('')}<p>All scenes are original AI-generated artwork. People, places and timestamps are invented. No identifiable patients, real service data, worker testimony or operating instructions are represented.</p><div class="about-controls"><button data-stills>View as stills</button><a href="${import.meta.env.BASE_URL}nightshift/story.html">Read the still edition ${icon('arrow')}</a></div><h3>Reading and motion</h3><p>Scroll at your own pace, choose a chapter, or reduce motion at any time. Sound is optional, quiet and synthesized locally. It starts off.</p><h3>Context consulted</h3><p>The work was informed by the public descriptions of <a href="https://www.nyc.gov/site/dsny/careers/sanitation-workers.page" target="_blank" rel="noreferrer">sanitation duties</a> and <a href="https://www.mta.info/planned-service-changes" target="_blank" rel="noreferrer">planned transit service changes</a>. These sources do not establish Meridian City’s fictional timetable.</p><p class="image-caption">Reviewed November 9, 2026. Full source and image provenance accompany the project.</p></dialog>
  <dialog id="dialog-note" data-lenis-prevent aria-labelledby="note-title"><div class="dialog-top"><h2 id="note-title">Read the scene</h2><button class="dialog-close icon-button" aria-label="Close scene note">${icon('close')}</button></div><div id="note-body"></div></dialog>
  <dialog id="dialog-trace" class="trace-dialog" data-lenis-prevent aria-labelledby="trace-title"><div class="dialog-top"><h2 id="trace-title">A morning trace</h2><button class="dialog-close icon-button" aria-label="Close morning trace">${icon('close')}</button></div><img id="trace-image" width="1586" height="992" alt="" /><div class="trace-pair"><div><span>During the night</span><p id="trace-before"></p></div><div><span>By morning</span><p id="trace-after"></p></div></div><div class="trace-actions"><a id="trace-return" href="#ch-03" data-chapter-link class="text-link">Return to chapter ${icon('arrow')}</a><button class="dialog-close">Back to dawn</button></div></dialog>`;
}
