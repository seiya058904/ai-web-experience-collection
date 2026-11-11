import { chapters, transitions, type Chapter } from './story-data';
import { DEFAULT_CONTAINER_STATE, renderContainerFallback, type ContainerState } from './container-fallback';
import { evaluateTransition } from './story-state';

const MEDIA = `${import.meta.env.BASE_URL}cargo/media/`;

export const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.5"/></svg>';
export const plus = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.5"/></svg>';
export const minus = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" stroke-width="1.5"/></svg>';
const close = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.5"/></svg>';
const pad = (n: number) => String(n).padStart(2, '0');

export function chapterState(n: number): ContainerState {
  const state: ContainerState = { ...DEFAULT_CONTAINER_STATE, packed: n !== 1 && n !== 2 };
  if (n === 2) { state.mode = 'interior'; state.doorsOpen = 1; }
  if (n === 3) state.mode = 'doors';
  if (n === 4 || n === 5 || n === 10) state.mode = 'road';
  if (n === 6) state.mode = 'rail';
  if (n === 8) { state.mode = 'lift'; state.progress = .72; }
  if (n === 11) { state.mode = 'destination'; state.doorsOpen = 1; }
  return state;
}

export function modelSlot(id: string, state: ContainerState, extra = '') {
  return `<div class="model-slot ${extra}" data-model-slot="${id}" data-container-id="BOX-001"><div class="model-still">${renderContainerFallback(state)}</div></div>`;
}

function picture(c: Chapter, extra = '') {
  const hero = c.number === 1;
  const src = c.media === 'warehouse' ? 'warehouse' : c.media;
  const light = [1, 4, 6, 10].includes(c.number);
  return `<figure class="photograph ${hero ? 'hero-photograph' : ''} ${light ? 'light-photo' : 'dark-photo'} ${extra}" data-photo="${c.number}">
    <picture>${hero ? `<source media="(max-width: 700px)" srcset="${MEDIA}hero-mobile.webp" />` : ''}<img src="${MEDIA}${src}.webp" ${hero ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" width="1584" height="992" alt="${c.alt}" data-scene-image="${src}" /></picture>
    <div class="photo-shade" aria-hidden="true"></div>
    <div class="scene-fallback" hidden>${modelSlot(`failure-${c.id}`, chapterState(c.number))}<p>This scene could not load. The story remains available in still view.</p><button class="text-button retry-image" type="button">Retry ${arrow}</button></div>
    ${hero ? '<div class="hero-atmosphere" aria-hidden="true"></div>' : ''}
    <div class="scene-copy"><div class="chapter-location">${!hero ? `<span>${pad(c.number)}</span><span>${c.name}</span>` : ''}</div>
      <${hero ? 'h1' : 'h2'} id="title-${c.id}" tabindex="-1">${hero ? 'One box.<br>Many worlds.' : c.heading}</${hero ? 'h1' : 'h2'}>
      <p class="scene-lead">${c.lead}</p>
      ${hero ? `<a class="button button-red" href="#ch-02">Follow the container ${arrow}</a>` : ''}
    </div>
    <div class="photo-marker" hidden role="status"><span class="marker-cross"></span><span class="marker-text">CARGO / BOX-001<small>Fictional exhibit ID</small></span></div>
    <figcaption class="photo-caption"><span>${hero ? 'The same box, a changing world' : c.name}</span><span>${pad(c.number)} / 11</span></figcaption>
  </figure>`;
}

function group(label: string, buttons: { label: string; value: string; active?: boolean }[], action: string) {
  return `<div class="segmented" role="group" aria-label="${label}">${buttons.map(b => `<button type="button" data-action="${action}" data-value="${b.value}" aria-pressed="${Boolean(b.active)}">${b.label}</button>`).join('')}</div>`;
}

function controls(c: Chapter) {
  if (c.number === 2) return group('Packing view', [{label:'Empty',value:'empty',active:true},{label:'Packed',value:'packed'}], 'packing') + '<p class="interaction-result" aria-live="polite">Empty interior. The wall, floor and doorway define a finite space.</p>';
  if (c.number === 3) return group('Door view', [{label:'Open',value:'open'},{label:'Closed',value:'closed',active:true}], 'doors') + '<p class="interaction-result" aria-live="polite">Closed doors. Illustrative seal recorded for BOX-001.</p>';
  if (c.number === 5) return group('Carrier view', [{label:'Road',value:'road',active:true},{label:'Rail',value:'rail'}], 'carrier') + `<button class="text-button" data-action="compare-supports" type="button" aria-pressed="false">Compare supports ${plus}</button><button class="text-button" data-action="reset-carrier" type="button">Reset carrier</button><p class="interaction-result" aria-live="polite">Road chassis selected. The same box rests at its corner interfaces.</p>`;
  if (c.number === 11) return group('Destination doors', [{label:'Open',value:'open',active:true},{label:'Closed',value:'closed'}], 'doors') + '<p class="interaction-result" aria-live="polite">Open again. The same six timber blocks are still inside.</p>';
  return `<button class="text-button primary-action" data-action="${c.number === 10 ? 'ports' : [1,4,8].includes(c.number) ? 'inspect' : 'locate'}" type="button" aria-expanded="false">${c.actionLabel} ${plus}</button><p class="interaction-result" aria-live="polite"></p>`;
}

function inspection(c: Chapter) {
  if (c.number === 10) return `<div class="port-comparison" hidden><h4>Two shores. One object.</h4><p>Illustrative locations</p><div class="port-pair"><figure><img src="${MEDIA}yard-small.webp" loading="lazy" width="800" height="501" alt="The fictional departure terminal under cool morning fog."/><figcaption>Departure · cool morning light</figcaption></figure><figure><img src="${MEDIA}shore-small.webp" loading="lazy" width="800" height="501" alt="The fictional destination port under warmer coastal light."/><figcaption>Arrival · another shore</figcaption></figure></div><button data-action="ports" class="text-button" type="button">Close ${close}</button></div>`;
  if (![1, 4, 8].includes(c.number)) return '';
  return `<div class="inspection" hidden><div class="inspection-copy"><h4>${c.number === 1 ? 'The details that stay.' : c.number === 4 ? 'Where the two meet.' : 'An attached assembly.'}</h4><p>${c.number === 1 ? 'A diagonal scratch. Two door bars. Eight corner fittings. Our fictional exhibit mark belongs to this one container.' : c.number === 4 ? 'The chassis carries the box at its lower corner interfaces. The wheels carry the chassis on the road.' : 'Taut vertical cables connect to the spreader. The spreader meets the container at its four top corner locations.'}</p>${group('Container identity lens', [{label:'Identify BOX-001',value:'identity',active:true},{label:'Corner fittings',value:'corners'},{label:'Doors',value:'doors'}], 'highlight')}<button class="text-button" data-action="reset-view" type="button">Reset view</button>${c.number === 8 ? '<label class="lift-range">Inspect the lift position<input type="range" min="0" max="100" value="72" step="1" aria-label="Lift position" data-action="lift-position"/><span>Grounded · engaged · raised</span></label>' : ''}<p class="study-note">Schematic geometry · not a handling guide</p></div>${modelSlot(`inspect-${c.id}`, { ...chapterState(c.number), highlight:'identity' })}</div>`;
}

function reading(c: Chapter) {
  return `<div class="chapter-reading" data-beat="B"><div class="reading-title"><span class="chapter-index">${pad(c.number)} — ${c.name}</span><h3>${c.beatTitle}</h3></div><div class="reading-body"><p>${c.beatBody}</p><div class="chapter-controls">${controls(c)}</div><p class="detail-note">${c.detail}</p></div>${inspection(c)}</div>`;
}

function technical(c: Chapter) {
  const notes = c.number === 2 ? ['6.058 m','Length'] : c.number === 3 ? ['BOX-001','Fictional transfer record'] : c.number === 5 ? ['One envelope','Two carriers'] : ['Same cargo','New destination'];
  return `<div class="technical-sheet" data-beat="A"><div class="technical-intro"><div class="chapter-location"><span>${pad(c.number)}</span><span>${c.name}</span></div><h2 id="title-${c.id}" tabindex="-1">${c.heading}</h2><p class="scene-lead">${c.lead}</p><div class="spec-stamp"><strong>${notes[0]}</strong><span>${notes[1]}</span></div></div><div class="technical-figure"><div class="study-header"><span>CARGO / BOX-001</span><span>Interface study</span></div>${modelSlot(c.id, chapterState(c.number))}<div class="dimension-rule"><span>20-foot standard general-purpose</span><span>6.058 × 2.438 × 2.591 m</span></div><p class="figure-note">Nominal external envelope · <button type="button" class="inline-button" data-dialog="about">Sources & interpretation</button></p></div></div>`;
}

function recap() {
  const steps = [[4,'On road'],[6,'On rail'],[7,'At port'],[9,'At sea'],[11,'At destination']] as const;
  return `<nav class="journey-recap" aria-label="Journey recap"><div class="recap-intro"><h3>Every handoff.<br>The same box.</h3><p>A fictional route, told through real interfaces.</p></div><ol>${steps.map(([n,label])=>`<li><a href="#ch-${pad(n)}"><span>${pad(n)}</span><strong>${label}</strong>${arrow}</a></li>`).join('')}</ol><a href="#ch-01" class="button button-red">Replay the route ${arrow}</a></nav>`;
}

function chapter(c: Chapter) {
  return `<section class="chapter chapter-${c.number} ${c.kind}" id="${c.id}" aria-labelledby="title-${c.id}" data-chapter="${c.number}">${c.kind === 'photo' ? picture(c) : technical(c)}${reading(c)}${c.number === 11 ? recap() : ''}</section>`;
}

const cornerArt = '<svg viewBox="0 0 700 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path d="M0 0h700v500H0z" fill="#47545a"/><path d="M110 65h470v370H110z" fill="#718084"/><path d="M110 65h470l-55 40H155z" fill="#9ba8a7"/><path d="M580 65v370l-55-35V105z" fill="#313e44"/><rect x="175" y="143" width="340" height="210" rx="74" fill="#263238"/><path d="M195 160h300v178H195z" fill="#17272f"/><path d="M110 380h470M110 119h470" stroke="#a8b2ae" stroke-width="3"/><g fill="#263238" stroke="#99a5a5" stroke-width="4"><circle cx="140" cy="95" r="12"/><circle cx="550" cy="95" r="12"/><circle cx="140" cy="405" r="12"/><circle cx="550" cy="405" r="12"/></g></svg>';

function boundary(index: number) {
  const t = transitions[index];
  return `<section class="handoff" id="${t.id}" aria-label="${t.name} handoff" data-transition="${index}"><div class="handoff-hold"><div class="handoff-top"><span>${chapters[index].name}</span><span class="handoff-line"></span>${arrow}<span>${chapters[index+1].name}</span></div><div class="handoff-layout"><div class="handoff-copy"><p class="small-label">The point of connection</p><h3>${t.name.replace(' / ', '<br><span>/</span> ')}</h3><p class="anchor-name">${t.anchor}</p><p class="stage-caption">${t.stages[0]}</p><div class="stage-select" role="group" aria-label="Explore ${t.name} stages">${t.stages.map((stage,i)=>`<button type="button" data-transition-stage="${index}:${i}" aria-label="Stage ${i+1} of 5: ${stage}" aria-pressed="${i===0}"><span></span></button>`).join('')}</div><a class="text-button handoff-skip" href="#${t.to}">Continue ${arrow}</a></div><div class="handoff-art" data-environment="${evaluateTransition(index,0).environment}"><div class="environment-lines" aria-hidden="true"></div>${modelSlot(t.id, evaluateTransition(index,0).container)}<div class="mechanical-occluder ${t.occluder}" aria-hidden="true">${cornerArt}</div><div class="handoff-annotation"><span class="contact-dot"></span><span>One continuous identity</span><strong>BOX-001</strong></div></div></div><p class="handoff-note">Conceptual transfer · scroll or select a stage</p></div></section>`;
}

export function renderApp() {
  return `<a class="skip-link" href="#main">Skip to the story</a>
    <header class="masthead"><a class="wordmark" href="#ch-01" aria-label="CARGO — Back to beginning">CARGO<span class="wordmark-box" aria-hidden="true"></span></a><span class="header-subtitle">The same box,<br>a changing world.</span><nav aria-label="Main navigation"><a class="collection-return" href="${import.meta.env.BASE_URL}#world-cargo" aria-label="Return to Collection" title="Return to Collection"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7"/></svg><span>Collection</span></a><button class="utility about-button" data-dialog="about" type="button">About this experience</button><button class="utility motion-button" id="motion-toggle" type="button" aria-pressed="false">Motion: On</button><button class="chapter-menu-button" data-dialog="chapters" type="button">Chapters <span class="menu-lines" aria-hidden="true"></span></button></nav></header>
    <nav class="chapter-rail" aria-label="Chapter progress"><span class="rail-status">01 / 11 · One Box</span>${chapters.map(c=>`<a href="#${c.id}" aria-label="${pad(c.number)} ${c.name}" title="${c.name}"><span>${pad(c.number)}</span></a>`).join('')}<button class="rail-menu" data-dialog="chapters" type="button">Chapters <span class="menu-lines" aria-hidden="true"></span></button></nav>
    <main id="main">${chapters.map((c,i)=>chapter(c)+(i<10?boundary(i):'')).join('')}</main>
    <footer class="endmatter"><div><p>The same box, a changing world.</p><a class="footer-wordmark" href="#ch-01">CARGO${arrow}</a></div><div class="footer-links"><button class="text-button" data-dialog="chapters" type="button">Explore the chapters again ${arrow}</button><button class="text-button" data-dialog="about" type="button">Sources & interpretation ${arrow}</button><button class="text-button" id="sound-toggle" type="button">Sound: Off</button></div><div class="footer-bottom"><span>An independent digital exhibit · 2026</span><span>Fictional journey. Real curiosity.</span><a href="#ch-01">Back to beginning ↑</a></div></footer>
    <dialog id="chapters-dialog" aria-labelledby="chapters-title"><div class="dialog-heading"><h2 id="chapters-title">The journey.</h2><button class="close-dialog" aria-label="Close chapters" type="button">${close}</button></div><p class="dialog-lead">Enter anywhere. Follow the same box.</p><nav class="chapter-list" aria-label="All chapters">${chapters.map(c=>`<a href="#${c.id}"><span>${pad(c.number)}</span><strong>${c.name}</strong>${arrow}</a>`).join('')}</nav><button class="text-button" id="stills-toggle" type="button">View as stills ${arrow}</button></dialog>
    <dialog id="about-dialog" aria-labelledby="about-title"><div class="dialog-heading"><h2 id="about-title">A story of<br>standardization.</h2><button class="close-dialog" aria-label="Close about this experience" type="button">${close}</button></div><div class="about-content"><p>CARGO follows one fictional 20-foot container through eleven moments of an intermodal journey. The route, ports, operator and cargo are invented. The subject is the interface: how one object can move between different systems.</p><h3>One defined envelope</h3><p>Our standard general-purpose container has a nominal external envelope of <strong>6.058 × 2.438 × 2.591 m</strong>. CARGO / BOX-001 is a fictional exhibit identity, not a BIC registration or a safety approval.</p><h3>Images and mechanisms</h3><p>The photographs are original AI-generated fictional illustrations. Interactive views use shared schematic geometry. Fitting details, supports, interior clearances and terminal handling are explanatory approximations, not manufacturing drawings or operational instructions.</p><p>A door seal is shown only as an illustrative custody detail. No universal security guarantee is implied. No real shipment is being tracked.</p><h3>Sources reviewed · 9 November 2026</h3><ul class="source-links"><li><a href="https://www.iso.org/standard/76912.html" target="_blank" rel="noopener noreferrer">ISO 668:2020 — classification, dimensions and ratings ${arrow}</a></li><li><a href="https://www.iso.org/standard/86404.html" target="_blank" rel="noopener noreferrer">ISO 1161:2026 — corner and intermediate fittings ${arrow}</a></li><li><a href="https://www.imo.org/en/About/Conventions/Pages/International-Convention-for-Safe-Containers-(CSC).aspx" target="_blank" rel="noopener noreferrer">IMO — Convention for Safe Containers ${arrow}</a></li><li><a href="https://www.bic-code.org/marking-of-containers/" target="_blank" rel="noopener noreferrer">BIC — container markings ${arrow}</a></li><li><a href="https://static-cf.hapag-lloyd.com/content/dam/website/downloads/local_info/HPL-CONTAINER_SPECIFICATION.pdf" target="_blank" rel="noopener noreferrer">Hapag-Lloyd — nominal external dimensions ${arrow}</a></li></ul><h3>Make it your pace</h3><p>Use the chapter menu, scroll in either direction, or choose the five stages in each handoff. Motion can be reduced at any time. Still view keeps the complete story and every interaction. Audio is unavailable in this version.</p></div></dialog>
    <div class="toast" role="status" aria-live="polite"></div>`;
}
