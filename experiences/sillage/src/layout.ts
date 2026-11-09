import { CHAPTERS, LEXICON, MEMORIES, PHASES, SITE } from './content.ts';
import { PRESETS, escapeXml } from './state.ts';
import { transitionMarkup } from './transitions.ts';
import type { TransitionIndex } from './transitions.ts';

export const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const down = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v17M6 14l6 6 6-6" stroke="currentColor" stroke-width="1.2"/></svg>';
const mark = '<svg class="wordmark-symbol" viewBox="0 0 40 36" aria-hidden="true"><path d="M5 20C8 4 32 0 35 17C36 29 25 34 10 28C26 30 30 20 23 15C16 10 10 16 5 20Z" fill="#594051"/><path d="M5 19C7 0 33 2 35 17C31 6 14 7 5 19Z" fill="#E7B353"/><path d="M4 27C12 20 17 34 33 24C29 35 11 35 4 27Z" fill="#8A6750"/></svg>';
const dot = (i: number) => '<span class="note-dot note-' + i + '" aria-hidden="true"></span>';
const art = (id: string, extra = '') => '<div id="' + id + '" class="artwork ' + extra + '"></div>';
const title = (i: number, extra = '') => {
  const c = CHAPTERS[i];
  return '<div class="chapter-heading ' + extra + '"><span class="chapter-number">' + c.number +
    '</span><div><h2 id="' + c.id + '-heading">' + c.title + '</h2><p class="chapter-lead">' + c.lead +
    '</p></div></div>';
};
const note = (i: number) => '<p class="art-note">' + CHAPTERS[i].note + '</p>';
const img = (name: string, alt: string, cls = '', eager = false) => '<img class="' + cls +
  '" src="./art/' + name + '.webp" alt="' + escapeXml(alt) + '" width="1536" height="1024" loading="' +
  (eager ? 'eager' : 'lazy') + '" decoding="async" />';
const section = (i: number, content: string, cls = '') => '<section id="' + CHAPTERS[i].id +
  '" class="chapter ' + cls + '" aria-labelledby="' + CHAPTERS[i].id + '-heading">' + content + '</section>';
const choices = (attribute: string, items: readonly {id: string; name: string}[], selected: string) =>
  '<div class="text-choices">' + items.map(item => '<button type="button" ' + attribute + '="' + item.id +
  '" aria-pressed="' + (item.id === selected) + '">' + item.name + '</button>').join('') + '</div>';

function hero(): string {
  return section(0,
    '<div class="hero-art"><picture><source media="(max-width:760px)" srcset="./art/hero-mobile-640.webp 640w, ./art/hero-mobile.webp 1024w" sizes="100vw" /><img src="./art/hero-desktop.webp" srcset="./art/hero-desktop-960.webp 960w, ./art/hero-desktop.webp 1536w" sizes="100vw" alt="' +
    CHAPTERS[0].alt + '" width="1536" height="1024" fetchpriority="high" decoding="async" /></picture>' +
    '<div id="hero-personal" class="hero-personal" hidden></div></div>' +
    '<div class="hero-copy"><h1 id="ch-01-heading">The shape <br>of <em>scent.</em></h1><p class="hero-intro">' +
    SITE.introduction + '</p><a class="line-link" href="#ch-02">Meet the three notes' + arrow +
    '</a><p class="hero-medium">An original visual interpretation.<br>No scent is transmitted.</p></div>' +
    '<div class="hero-foot"><div class="hero-legend" aria-label="The three visual vocabularies">' +
    LEXICON.map(n => '<button type="button" data-hero-note="' + n.index + '" aria-pressed="false">' + dot(n.index) + n.name + '</button>').join('') +
    '</div><a class="scroll-invitation" href="#ch-02">Scroll to unfold' + down + '</a></div>' +
    '<p id="hero-note-status" class="hero-note-status" aria-live="polite">Three edges. One quiet opening.</p>', 'hero');
}

function vocabulary(): string {
  return section(1, title(1) + '<div class="vocabulary-layout"><figure class="vocabulary-plate">' +
    '<div class="vocabulary-image">' + img('macro', 'A close study of the sharp apricot edge, the aubergine fold and the warm porous surface.') + '</div>' +
    '<figcaption>Close enough to see a feeling take shape.</figcaption></figure><div class="vocabulary-words">' +
    LEXICON.map(n => '<button type="button" class="vocabulary-choice" data-vocabulary="' + n.index + '" aria-pressed="false"><span class="vocabulary-line">' +
      dot(n.index) + '<span class="vocabulary-name">' + n.name + '</span><span class="small-arrow">' + arrow + '</span></span>' +
      '<span class="vocabulary-association">' + n.association + '</span><span class="vocabulary-phrase">' + n.phrase + '</span></button>').join('') +
    '<button class="quiet-button" id="vocabulary-all" type="button">See all three</button><div class="vocabulary-result">' +
    art('vocabulary-art') + '<p id="vocabulary-description" aria-live="polite">A fine ridge. A close fold. A place to rest.</p></div></div></div>' + note(1), 'vocabulary');
}

function stages(): string {
  return section(2, title(2) + '<p class="reading-copy">' + CHAPTERS[2].body + '</p><div class="phase-gallery">' +
    PHASES.map((p, i) => '<button type="button" class="phase-study" data-phase="' + p.id + '" aria-pressed="' +
      (p.id === 'unfolding') + '"><span class="phase-order">0' + (i + 1) + '</span>' + art('phase-' + p.id) +
      '<span class="phase-baseline"></span><span class="phase-name">' + p.name + '</span><span class="phase-copy">' + p.description + '</span></button>').join('') +
    '</div><p id="phase-status" class="result-line" aria-live="polite">Unfolding — the parts begin to answer one another.</p>' + note(2), 'stages');
}

function chord(): string {
  return section(3, title(3) + '<div class="chord-layout"><div class="chord-explainer"><p>' + CHAPTERS[3].body +
    '</p>' + choices('data-chord', [{id:'apart',name:'Read the parts'},{id:'together',name:'Bring them together'}], 'together') +
    '<p id="chord-status" class="result-line" aria-live="polite">One opening, held by three different edges.</p>' +
    '<p class="composition-name"><span>An original chord</span><em>After the Open Window</em></p></div>' +
    '<figure class="chord-plate">' + img('chord', CHAPTERS[3].alt) + '<div class="chord-live" aria-hidden="true">' + art('chord-art') +
    '</div><figcaption>Separate characters. A shared centre.</figcaption></figure></div>' + note(3), 'chord');
}

function absence(): string {
  return section(4, title(4) + '<p class="reading-copy">' + CHAPTERS[4].body + '</p><div class="comparison">' +
    '<figure>' + art('absence-full') + '<figcaption>The whole<span>45 / 20 / 35</span></figcaption></figure>' +
    '<figure>' + art('absence-part') + '<figcaption id="absence-caption">Without Brightness<span>A place left open</span></figcaption></figure></div>' +
    '<div class="text-choices absence-choices" aria-label="Remove a visual quality">' +
    LEXICON.map(n => '<button type="button" data-remove="' + n.index + '" aria-pressed="' + (n.index === 0) + '">' + dot(n.index) + 'Without ' + n.name + '</button>').join('') +
    '<button type="button" data-remove="none" aria-pressed="false">Restore the whole</button></div>' +
    '<p id="absence-status" class="result-line" aria-live="polite">' + LEXICON[0].absent + '</p>' + note(4), 'absence');
}

function distance(): string {
  return section(5, title(5) + '<div class="distance-intro"><p class="reading-copy">' + CHAPTERS[5].body + '</p>' +
    choices('data-distance', [{id:'near',name:'Near'},{id:'middle',name:'Between'},{id:'far',name:'Far'}], 'near') +
    '</div><div class="distance-trail"><svg class="trail-line" viewBox="0 0 1200 380" fill="none" aria-hidden="true"><path d="M25 290C210 360 240 90 445 180S770 290 1170 60" stroke="#C5B49B" stroke-width="1.5"/></svg>' +
    '<svg class="trail-line-mobile" viewBox="0 0 400 700" preserveAspectRatio="none" fill="none" aria-hidden="true"><path d="M85 120C210 65 110 280 260 325S325 485 245 610" stroke="#C5B49B" stroke-width="1.5"/></svg>' +
    ['near','middle','far'].map((id, i) => '<figure class="distance-print distance-' + id + '" data-distance-view="' + id + '">' +
    art('distance-' + id) + '<figcaption>' + ['The edges','The relationship','The trace'][i] + '</figcaption></figure>').join('') +
    '</div><p id="distance-status" class="result-line" aria-live="polite">Near — the ridge, fold and porous plane are distinct.</p>' + note(5), 'distance');
}

function memories(): string {
  return section(6, title(6) + '<p class="reading-copy">' + CHAPTERS[6].body + '</p><div class="memory-layout">' +
    MEMORIES.map((m, i) => '<article class="memory memory-' + m.id + '"><figure>' + img('memory-' + m.id, m.alt) +
    (i === 1 ? '<span class="note-date">17 September</span>' : '') + '</figure><div class="memory-copy"><span class="memory-letter">' +
    (i === 0 ? 'A' : 'B') + '</span><h3>' + m.title + '</h3><p>' + m.text + '</p><button type="button" class="line-link" data-memory="' + m.id +
    '" aria-pressed="false" aria-label="Choose ' + m.title + '">This feels closer' + arrow + '</button></div></article>').join('') +
    '<div class="memory-anchor">' + art('memory-imprint') + '<p>Same impression.<br>A different place to begin.</p><span>45 / 20 / 35</span></div></div>' +
    '<div class="memory-response"><p id="memory-status" aria-live="polite">Neither memory needs to be yours. You can simply keep going.</p><button type="button" id="memory-clear" class="quiet-button">Leave the memory open</button></div>' + note(6), 'memories');
}

function panorama(): string {
  return section(7, title(7, 'panorama-heading') + '<div class="panorama-scene"><picture><source media="(max-width:760px)" srcset="./art/panorama-mobile-640.webp 640w, ./art/panorama-mobile.webp 1024w" sizes="100vw" width="1024" height="1536" />' +
    '<img src="./art/panorama.webp" alt="' + CHAPTERS[7].alt + '" width="1536" height="1024" loading="lazy" decoding="async" /></picture>' +
    '<div class="panorama-points">' + PHASES.map((p, i) => '<button type="button" data-panorama="' + p.id + '" class="panorama-point point-' +
    i + '" aria-pressed="false"><span class="point-ring"></span><span>' + p.name + '</span></button>').join('') + '</div></div>' +
    '<div class="panorama-reflection"><p class="large-quote">What remains<br>is also <em>the space between.</em></p><div><p>' + CHAPTERS[7].body +
    '</p><p id="panorama-status" class="result-line" aria-live="polite">One path holds all three stages together.</p><button id="panorama-reset" class="quiet-button" type="button">Return to the whole</button></div></div>' +
    '<div class="panorama-static-phases" aria-label="Three stages in the complete relationship">' +
    PHASES.map(p => '<figure>' + art('panorama-' + p.id) + '<figcaption>' + p.name + '</figcaption></figure>').join('') + '</div>' + note(7), 'panorama');
}

function composer(): string {
  return section(8, title(8) + '<div class="composer-layout"><div class="composer-work"><div class="composition-stage" id="composition-stage">' +
    art('personal-art') + '<span class="artwork-hollow-label">Room for something of your own.</span></div><div class="composition-meta"><span id="composition-summary">Brightness 45 · Spice 20 · Warmth 35</span><span>Visual shares / 100</span></div></div>' +
    '<form class="composer-controls" id="composition-form"><p class="controls-intro">Give each quality a little more room.<br>The others will make space.</p>' +
    LEXICON.map(n => '<div class="share-control share-' + n.index + '"><div class="share-heading"><label for="share-' + n.index + '">' + dot(n.index) +
    n.name + '</label><div class="number-wrap"><input type="number" id="number-' + n.index + '" data-number="' + n.index + '" min="0" max="100" step="1" value="' +
    [45,20,35][n.index] + '" inputmode="numeric" aria-label="' + n.name + ' percentage" /><span>%</span></div></div>' +
    '<input type="range" id="share-' + n.index + '" data-share="' + n.index + '" min="0" max="100" step="1" value="' + [45,20,35][n.index] +
    '" aria-describedby="share-help-' + n.index + '" /><p id="share-help-' + n.index + '">' + n.shareHelp + '</p></div>').join('') +
    '<fieldset class="presets"><legend>A place to start</legend>' + PRESETS.map(p => '<button type="button" data-preset="' + p.id + '">' + p.name + '</button>').join('') +
    '</fieldset><div class="title-field"><label for="personal-title">Give it a name</label><input type="text" id="personal-title" value="After the Open Window" maxlength="128" autocomplete="off" spellcheck="true" dir="auto" /><span id="title-count">21 / 64</span></div>' +
    '<div class="composer-actions"><button type="button" id="composition-reset" class="quiet-button">Restore the original</button><span id="save-status">Kept on this device</span></div></form></div>' +
    '<div class="personal-stages"><p>Your composition, through three stages.</p><div class="personal-phase-row">' +
    PHASES.map(p => '<figure>' + art('personal-' + p.id) + '<figcaption>' + p.name + '</figcaption></figure>').join('') +
    '</div></div><a href="#ch-10" class="line-link finish-link">See what stays' + arrow + '</a>' + note(8), 'composer');
}

function ending(): string {
  return section(9, title(9) + '<p class="ending-thought">What stays is what<br>you choose to <em>leave behind.</em></p>' +
    '<div class="ending-comparison"><figure>' + art('ending-original') + '<figcaption>Where we began</figcaption></figure>' +
    '<span class="comparison-arrow">' + arrow + '</span><figure>' + art('ending-current') + '<figcaption>What you leave</figcaption></figure></div>' +
    '<div class="final-print" id="final-print"><div class="print-heading"><span>SILLAGE</span><span>A personal impression</span></div>' +
    '<h3 id="ending-title" dir="auto">After the Open Window</h3><div class="print-art-row">' +
    PHASES.map(p => '<figure>' + art('ending-' + p.id) + '<figcaption>' + p.name + '</figcaption></figure>').join('') +
    '</div><div class="print-footer"><span id="ending-shares">Brightness 45 / Spice 20 / Warmth 35</span><span>The shape of scent.</span></div></div>' +
    '<div class="ending-actions"><button type="button" class="primary-button" id="export-png">Keep your impression' + arrow +
    '</button><span class="export-detail">Download a PNG · made here, kept by you</span><a class="line-link" href="#ch-09">Compose again' + arrow +
    '</a><a class="quiet-button" href="#ch-01">Return to the beginning</a><button type="button" class="quiet-button" id="ending-reset">Restore the original</button></div>' +
    '<p id="export-status" class="result-line" aria-live="polite">Your current composition is ready to keep.</p>', 'ending');
}

export function renderLayout(): string {
  const chapters = [hero(), vocabulary(), stages(), chord(), absence(), distance(), memories(), panorama(), composer(), ending()];
  return '<a href="#main" class="skip-link">Skip to the story</a><header class="site-header"><a class="wordmark" href="#ch-01" aria-label="Sillage — return to the beginning">' +
    mark + '<span>SILLAGE</span></a><nav class="header-nav" aria-label="Primary"><a href="#ch-02">The story</a><a href="#ch-09">Your composition</a>' +
    '<a class="collection-return" href="' + import.meta.env.BASE_URL + '#world-sillage" aria-label="Return to Collection" title="Return to Collection"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7"/></svg><span>Collection</span></a>' +
    '<button type="button" id="index-toggle" aria-label="Open chapter index" aria-haspopup="dialog"><span>Index</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16M4 16h16" stroke="currentColor" stroke-width="1.2"/></svg></button></nav></header>' +
    '<main id="main" tabindex="-1">' + chapters.map((chapter, i) => chapter + (i < 9 ? transitionMarkup(i as TransitionIndex) : '')).join('') + '</main>' +
    '<footer class="colophon"><a href="#ch-01" class="wordmark">' + mark + '<span>SILLAGE</span></a><p>An invisible subject.<br>A small, personal trace.</p>' +
    '<details><summary>About this work</summary><div><p>' + SITE.about + '</p><p>All memories are original fiction. Your composition stays in this browser; you can export it without an account.</p>' +
    '<p>Context: <a href="https://www.nidcd.nih.gov/news/multimedia/journey-of-smell-to-brain-text-version" target="_blank" rel="noreferrer">The journey of smell, NIDCD</a> · <a href="https://www.fragonard.com/en-int/fragonard/fragonard-p-2906-o-1492.htm" target="_blank" rel="noreferrer">Layered scent descriptions, Fragonard</a>.</p>' +
    '<p>Art and writing created for SILLAGE. Visual parameters are artistic choices.</p></div></details></footer>' +
    '<div class="utility-bar"><button type="button" id="motion-toggle" aria-pressed="false">Motion: full</button><span aria-hidden="true">/</span><button type="button" id="sound-toggle" aria-pressed="false">Sound: off</button></div>' +
    '<a href="#ch-01" class="story-position" id="story-position" aria-label="Current chapter: Before a name"><span id="current-chapter">01</span><span class="position-line"><span id="position-fill"></span></span><span>10</span></a>' +
    '<dialog id="chapter-index" class="index-dialog" aria-labelledby="index-title" data-lenis-prevent><div class="index-top"><h2 id="index-title">The shape of a journey.</h2><button type="button" id="index-close" aria-label="Close chapter index"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19" stroke="currentColor" stroke-width="1.2"/></svg></button></div>' +
    '<nav aria-label="Chapters">' + CHAPTERS.map(c => '<a href="#' + c.id + '"><span>' + c.number + '</span><span>' + c.navLabel + '</span>' + arrow + '</a>').join('') +
    '</nav><p>Take your time. Every chapter can be revisited.</p></dialog><p id="live-region" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></p>';
}
