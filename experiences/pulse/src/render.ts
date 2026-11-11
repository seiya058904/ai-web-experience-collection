import { chapters, sources, heroCopy, sharedNotes, type Chapter } from './content.ts';
import { renderDiagram, renderTransitionAnchor } from './diagrams.ts';
import { transitionSpecs } from './story.ts';

export const escapeHtml = (text: string) => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
const e = escapeHtml;
export const icon = (name: string) => {
  const paths: Record<string, string> = {
    arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
    down: '<path d="M12 4v15m-6-6 6 6 6-6"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    sound: '<path d="M11 5 6 9H3v6h3l5 4V5Zm4 3c3 2 3 6 0 8m3-11c5 4 5 10 0 14"/>',
    motion: '<path d="M3 12h4m3-5v10m4-14v18m4-14v10m3-5h1"/>',
    restart: '<path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/>',
    outward: '<path d="M6 18 18 6M6 6h12v12"/>',
  };
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
};
const media = (name: string, alt = '', cls = '', eager = false, portrait = false) => `<picture class="art-picture ${cls}">
  ${portrait ? '<source media="(max-width: 640px)" srcset="./art/hero-mobile.webp">' : ''}
  <source srcset="./art/${name}-960.webp 960w, ./art/${name}.webp 1536w" sizes="(max-width: 640px) 100vw, 100vw">
  <img src="./art/${name}.webp" width="1536" height="1024" alt="${e(alt)}" ${eager ? 'fetchpriority="high" loading="eager"' : 'loading="lazy"'} decoding="async">
  </picture>`;

const meta = (ch: Chapter) => `<div class="chapter-meta"><span class="chapter-number">${String(ch.number).padStart(2, '0')}</span><span>${e(ch.shortTitle)}</span><span class="meta-line" aria-hidden="true"></span></div>`;
const heading = (ch: Chapter) => `<div class="chapter-heading">${meta(ch)}<h2 id="${ch.slug}-title" tabindex="-1">${e(ch.title)}</h2><p class="chapter-lead">${e(ch.lead)}</p></div>`;
const beats = (ch: Chapter) => `<div class="content-beats">${ch.beats.map((beat, i) => `<div class="beat" data-beat="${i + 1}"><span class="beat-number" aria-hidden="true">0${i + 1}</span><div><h3>${e(beat.title)}</h3><p>${e(beat.body)}</p></div></div>`).join('')}</div>`;
const note = (ch: Chapter) => `<div class="plate-notes"><p>${e(ch.diagramNote)}</p><a href="#sources" class="source-ref">Sources ${ch.sourceIds.map(id => String(sources.findIndex(s => s.id === id) + 1).padStart(2, '0')).join(', ')} ${icon('outward')}</a></div>`;
const textAlternative = (ch: Chapter) => `<details class="text-alternative"><summary>Read the diagram</summary><dl>${ch.interaction.options.map(op => `<dt>${e(op.label)}</dt><dd>${e(op.result)}</dd>`).join('')}</dl></details>`;
const controls = (ch: Chapter) => `<div class="interaction" data-interaction="${ch.number}" data-initial="${ch.interaction.initialValue}">
  <div class="interaction-heading"><h3>${e(ch.interaction.title)}</h3><p>${e(ch.interaction.description)}</p></div>
  <div class="interaction-options js-only" role="group" aria-label="${e(ch.interaction.title)}">${ch.interaction.options.map(op => `<button type="button" data-select="${op.value}" aria-pressed="${op.value === ch.interaction.initialValue}" aria-controls="diagram-${ch.number} result-${ch.number}">${e(op.label)}</button>`).join('')}</div>
  <div class="result-row"><p class="interaction-result" id="result-${ch.number}" aria-live="polite" aria-atomic="true">${e(ch.interaction.options.find(op => op.value === ch.interaction.initialValue)?.result || ch.interaction.description)}</p><button type="button" class="text-button reset-button js-only" data-reset>${icon('restart')} ${e(ch.interaction.resetLabel)}</button></div>
  ${[3, 11].includes(ch.number) ? '<details class="legend"><summary>Show legend</summary><p><span class="legend-signal" aria-hidden="true"></span>Gold dots: electrical activation in tissue.</p><p><span class="legend-flow" aria-hidden="true"></span>Solid arrows: blood through chambers and vessels.</p><p>Slate is a diagram convention. Oxygen-poor blood is dark red.</p><p>The electrical sequence and a circulation route do not share one clock.</p></details>' : ''}
  ${textAlternative(ch)}
</div>`;
const kinds = ['chambers', 'chambers', 'signal', 'return', 'valves', 'lungs', 'exchange', 'pulmonary-return', 'walls', 'systemic', 'overview'];
const signalReading = `<div class="signal-reading"><ol class="signal-steps" aria-label="Electrical sequence"><li><span class="signal-step-number">01</span><div><strong>SA origin</strong><small>Sinoatrial node<br>Right atrium</small></div></li><li><span class="signal-step-number">02</span><div><strong>AV delay</strong><small>Atrioventricular node<br>Before ventricular activation</small></div></li><li><span class="signal-step-number">03</span><div><strong>Ventricular activation</strong><small>Conduction through<br>heart tissue</small></div></li></ol><p class="signal-blood-reading">Body → right heart → lungs → left heart → body.</p><p class="signal-clock-note">Electrical activation and blood transport are different processes, with different timescales. This is not an ECG.</p></div>`;
const diagram = (ch: Chapter, extra = '') => `<figure class="atlas-plate ${extra} ${ch.number === 3 ? 'signal-plate' : ''}" id="diagram-${ch.number}" data-mode="${ch.interaction.initialValue}">
  <div class="plate-topline"><span>${[6,7,10].includes(ch.number) ? (ch.number === 7 ? 'Schematic scale' : 'Schematic route') : 'Anterior cutaway'}</span><span>Illustrated anatomy</span></div>
  <div class="diagram-wrap">${renderDiagram(kinds[ch.number - 1], `plate-${ch.number}`, ch.interaction.initialValue)}</div>
  ${ch.number === 3 ? signalReading : ''}
  <figcaption>${[2,3,4,8,9,11].includes(ch.number) ? 'Anatomical right is on your left. Posterior connections are exposed schematically.' : e(ch.diagramNote)}</figcaption>
</figure>`;

function hero(): string {
  const ch = chapters[0];
  return `<section class="chapter first-chapter" id="${ch.slug}" data-chapter="1" aria-labelledby="hero-title">
  <div class="hero" id="beginning" data-hero-state="first-frame">
    <div class="hero-fallback media-fallback" aria-hidden="true">${renderDiagram('chambers', 'hero-fallback', 'all')}</div>
    ${media('hero-desktop', heroCopy.alt, 'hero-art', true, true)}
    <div class="hero-copy"><h1 id="hero-title">Every beat<br>has a <em>direction.</em></h1><p>${e(heroCopy.lead)}</p><a class="primary-link" href="#four-chambers">${e(heroCopy.cta)}<span>${icon('arrow')}</span></a></div>
    <div class="hero-footer"><p>Human heart<br><span>Anterior view · authored illustration</span></p><a href="#living-form-observation" class="scroll-cue">Scroll to discover ${icon('down')}</a><span class="hero-edition">An atlas of one heartbeat</span></div>
  </div>
  <div class="opening-observation section-container" id="living-form-observation">
    <div class="opening-copy">${heading(ch)}${beats(ch)}</div>
    <div class="opening-visual"><figure class="torso-figure">${media('torso', 'An authored translucent torso illustration locating the heart between the lungs, mostly to the person’s left.')}<figcaption>Located between the lungs. An illustration, not a patient scan.</figcaption></figure>${diagram(ch, 'orientation-plate')}${controls(ch)}</div>
    ${note(ch)}
  </div>
  </section>`;
}

function regularChapter(ch: Chapter): string {
  const light = [2, 5, 8, 10].includes(ch.number);
  const reverse = [4, 10].includes(ch.number);
  const wide = ch.number === 5;
  return `<section class="chapter ${light ? 'chapter-light' : 'chapter-dark'} ${reverse ? 'layout-reverse' : ''} ${wide ? 'layout-wide' : ''}" id="${ch.slug}" data-chapter="${ch.number}" aria-labelledby="${ch.slug}-title">
  <div class="section-container">
    <div class="chapter-composition">${heading(ch)}<div class="chapter-visual">${diagram(ch)}${controls(ch)}</div></div>
    ${beats(ch)}${note(ch)}
  </div></section>`;
}

function materialChapter(ch: Chapter): string {
  const name = ch.number === 7 ? 'alveolus' : 'ventricle';
  const alt = ch.number === 7 ? 'Artist reconstruction of an air-filled alveolus next to a separate blood-filled capillary.' : 'Artist reconstruction of a thick left ventricular wall with papillary muscles and fine valve supports.';
  return `<section class="chapter chapter-dark chapter-material" id="${ch.slug}" data-chapter="${ch.number}" aria-labelledby="${ch.slug}-title">
    <div class="material-scene"><div class="material-fallback media-fallback" aria-hidden="true">${renderDiagram(kinds[ch.number - 1], `material-fallback-${ch.number}`, 'both')}</div>${media(name, alt, 'material-art')}<div class="section-container material-copy">${heading(ch)}</div><p class="art-note">Authored material study · ${ch.number === 7 ? 'not microscopy' : 'not a patient scan'}</p></div>
    <div class="section-container material-detail"><div class="material-reading">${beats(ch)}<p class="margin-note">${ch.number === 7 ? 'Air and blood remain separate. Only the gases cross the tissue barrier.' : 'The muscle surrounds the chamber. Inflow and outflow remain distinct.'}</p></div><div class="chapter-visual">${diagram(ch)}${controls(ch)}</div>${note(ch)}</div>
  </section>`;
}

function ending(ch: Chapter): string {
  return `<section class="chapter chapter-dark final-chapter" id="${ch.slug}" data-chapter="${ch.number}" aria-labelledby="${ch.slug}-title">
    <div class="ending-scene"><div class="ending-fallback media-fallback" aria-hidden="true">${renderDiagram('overview', 'ending-fallback', 'both')}</div>${media('hero-desktop', heroCopy.alt, 'ending-art', false, true)}<div class="section-container ending-copy">${heading(ch)}<a class="primary-link" href="#beginning">Explore the chapters again <span>${icon('restart')}</span></a></div></div>
    <div class="section-container final-atlas"><div class="final-reading">${beats(ch)}<p class="margin-note">${e(sharedNotes.timing)}</p></div><div class="chapter-visual">${diagram(ch)}${controls(ch)}</div>${note(ch)}</div>
  </section>`;
}

function transition(index: number): string {
  const spec = transitionSpecs[index];
  return `<section class="story-transition transition-${spec.variant}" id="${spec.id.toLowerCase()}" data-transition="${index}" aria-label="${e(spec.title)}">
    <div class="transition-inner">
      <div class="transition-label"><span>${String(index + 1).padStart(2,'0')} <span aria-hidden="true">/</span> ${String(index + 2).padStart(2,'0')}</span><p>${e(spec.representationLabel)}</p></div>
      <div class="transition-stage">${index === 5 ? media('magnification', '', 'transition-material') : ''}${renderTransitionAnchor(index, `bridge-${index}`)}</div>
      <div class="transition-caption"><p class="transition-source">${e(chapters[index].shortTitle)}</p><p class="transition-target">${e(chapters[index + 1].shortTitle)}</p><p class="anchor-caption">${e(spec.anchor)}</p></div>
      <p class="transition-stage-label">${e(spec.stages[0])}</p>
      <a class="transition-continue" href="#${chapters[index + 1].slug}" aria-label="Continue to ${e(chapters[index + 1].shortTitle)}">Continue ${icon('down')}</a>
    </div>
  </section>`;
}

const sourceList = () => `<ol class="source-list">${sources.map((s, i) => `<li id="source-${s.id}"><span class="source-num">${String(i + 1).padStart(2, '0')}</span><div><a href="${e(s.url)}" target="_blank" rel="noopener noreferrer">${e(s.title)} ${icon('outward')}</a><p>${e(s.organization)} · ${e(s.scope)}</p></div></li>`).join('')}</ol>`;

export function renderPage(): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#130c10"><title>${e('PULSE — An atlas of one heartbeat')}</title><meta name="description" content="${e(heroCopy.metaDescription)}"><meta property="og:title" content="PULSE — An atlas of one heartbeat"><meta property="og:description" content="${e(heroCopy.metaDescription)}"><meta property="og:type" content="website"><link rel="icon" type="image/svg+xml" href="./favicon.svg"><link rel="preload" as="image" href="./art/hero-desktop.webp" media="(min-width: 641px)" imagesrcset="./art/hero-desktop-960.webp 960w, ./art/hero-desktop.webp 1536w" imagesizes="100vw"><link rel="preload" as="image" href="./art/hero-mobile.webp" media="(max-width: 640px)"><script type="module" src="./src/main.ts"></script></head>
<body><a href="#main" class="skip-link">Skip to the atlas</a>
<header class="site-header"><a class="wordmark" href="#beginning" aria-label="PULSE — Back to beginning"><svg viewBox="0 0 32 32" aria-hidden="true" fill="none"><path d="M7 8c9-8 24 1 17 13C17 33 4 20 7 8Z" stroke="currentColor"/><path d="M11 6c-2 7 9 8 6 17M21 8c-5 2-4 6-3 10" stroke="currentColor"/></svg>PULSE</a><p class="brand-subtitle">An atlas of one heartbeat</p><nav class="header-actions" aria-label="Experience controls"><button class="header-button about-button js-only" type="button" data-open="about-dialog">About this experience</button><button class="header-button motion-button js-only" type="button" data-motion>${icon('motion')}<span>Motion: On</span></button><button class="header-button sound-button js-only" type="button" data-sound aria-pressed="false">${icon('sound')}<span>Sound: Off</span></button><button class="header-button chapters-button js-only" type="button" data-open="chapters-dialog">Chapters ${icon('menu')}</button><a class="no-js" href="#chapter-index">Chapters</a></nav></header>
<main id="main">${hero()}${chapters.slice(1).map((ch, i) => transition(i) + ([7,9].includes(ch.number) ? materialChapter(ch) : ch.number === 11 ? ending(ch) : regularChapter(ch))).join('')}</main>
<footer class="site-footer"><div class="section-container"><div class="footer-top"><a class="footer-brand" href="#beginning">PULSE</a><div><h2>Understanding begins with looking.</h2><p>${e(sharedNotes.scope)}</p><a href="#beginning" class="text-button">Back to beginning ${icon('arrow')}</a></div></div><div id="chapter-index" class="footer-index"><h3>The chapters</h3><nav aria-label="All chapters">${chapters.map(ch=>`<a href="#${ch.slug}"><span>${String(ch.number).padStart(2,'0')}</span>${e(ch.shortTitle)}</a>`).join('')}</nav></div><section class="sources-section" id="sources" aria-labelledby="sources-title"><h3 id="sources-title" tabindex="-1">Sources & illustration notes</h3><p>${e(sharedNotes.review)}</p><p>Generated material studies and original schematic drawings explain healthy anatomy. Scale, depth and proportions are simplified. The sources support the factual text; their artwork has not been reused.</p>${sourceList()}</section><div class="footer-bottom"><span>PULSE · An atlas of one heartbeat</span><span>Illustrated with care. Made for curiosity.</span></div></div></footer>
<div class="chapter-progress js-only" aria-label="Chapter navigation"><div class="progress-current"><span data-current-number>01</span><span data-current-title>The Living Form</span></div><nav class="chapter-dots" aria-label="Jump to chapter">${chapters.map(ch=>`<a href="#${ch.slug}" data-dot="${ch.number}" aria-label="Chapter ${ch.number}: ${e(ch.shortTitle)}" ${ch.number===1?'aria-current="location"':''}><span></span></a>`).join('')}</nav><span class="chapter-total">11 chapters</span><div class="progress-line" aria-hidden="true"><span></span></div></div>
<dialog id="chapters-dialog" class="chapters-dialog" aria-labelledby="chapters-dialog-title" data-lenis-prevent><div class="dialog-top"><p>Explore the atlas</p><button class="icon-button" data-close type="button" aria-label="Close">${icon('close')}</button></div><h2 id="chapters-dialog-title">One organ.<br>Eleven observations.</h2><nav aria-label="Choose a chapter">${chapters.map(ch=>`<a href="#${ch.slug}"><span>${String(ch.number).padStart(2,'0')}</span><strong>${e(ch.shortTitle)}</strong>${icon('arrow')}</a>`).join('')}</nav><div class="dialog-options"><button type="button" class="text-button" data-open="about-dialog">About this experience</button><button type="button" class="text-button" data-motion>${icon('motion')}<span>Motion: On</span></button></div><p class="dialog-footnote">Take the guided route, or begin with a question.</p></dialog>
<dialog id="about-dialog" class="about-dialog" aria-labelledby="about-dialog-title" data-lenis-prevent><div class="dialog-top"><p>About this experience</p><button class="icon-button" data-close type="button" aria-label="Close">${icon('close')}</button></div><h2 id="about-dialog-title">A closer look<br>at a living system.</h2><p>${e(sharedNotes.scope)}</p><p>${e(sharedNotes.illustration)} ${e(sharedNotes.review)}</p><h3>How to read the atlas</h3><p>${e(sharedNotes.orientation)}</p><p>${e(sharedNotes.bloodColor)}</p><p>${e(sharedNotes.timing)} ${e(sharedNotes.electrical)}</p><h3>Motion & sound</h3><p>Scroll freely, use the chapter links, or read every plate as a still. All diagram controls work with a keyboard. Press Escape to close this panel.</p><p>${e(sharedNotes.sound)}</p><div class="about-actions"><button class="primary-button" type="button" data-stills>View as stills ${icon('arrow')}</button><a class="text-button" href="#sources">Read the sources ${icon('outward')}</a></div></dialog>
<p class="global-status sr-only" role="status" aria-live="polite"></p><noscript><p class="noscript-note">The complete illustrated story is available. Interactive overlays, smooth scrolling and optional sound require JavaScript. Open “Read the diagram” to read every selectable result.</p></noscript>
</body></html>`;
}
