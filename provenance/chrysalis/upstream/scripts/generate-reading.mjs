/** Regenerate the portable, script-free reading edition from the shared content. */
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chapters, sources, hero, instars, emergenceStages, aboutText } from '../src/content.js';
import { assetNames, alts } from '../src/media.ts';
import {
  instarDiagram, hostDiagram, hatchDiagram, feedingDiagram,
  attachmentDiagram, insideDiagram, emergenceDiagram, cycleDiagram,
} from '../src/diagrams.ts';

const escape = (value) => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const widthOf = (name) => name === 'ai-02-host' ? 1536 : ['ai-11-j-hang', 'ai-15-unfolding'].includes(name) ? 1660 : 1659;
const heightOf = (name) => name === 'ai-02-host' ? 1024 : 948;
const image = (name, alt, eager = false, mobile = false) => `<picture>${mobile ? '<source media="(max-width: 600px)" srcset="./assets/ai-05-mobile.webp" width="948" height="1659">' : ''}<img src="./assets/${name}.webp" alt="${escape(alt)}" width="${widthOf(name)}" height="${heightOf(name)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async" ${eager ? 'fetchpriority="high"' : ''}></picture>`;
const diagramCard = (title, svg, caption) => `<figure class="diagram-card"><div class="diagram-surface">${svg}</div><figcaption><strong>${escape(title)}</strong><span>${escape(caption)}</span></figcaption></figure>`;
const imageCard = (title, name, alt, caption) => `<figure class="image-card">${image(name, alt)}<figcaption><strong>${escape(title)}</strong><span>${escape(caption)}</span></figcaption></figure>`;

function inspection(index) {
  switch (index) {
    case 0: return `<aside class="field-note"><h3>What am I seeing?</h3><p><i>Danaus plexippus</i>, the monarch butterfly. The opening artwork enlarges one egg and its milkweed setting. It is a digital interpretation, with no measured scale.</p></aside>`;
    case 1: return diagramCard('The host plant', hostDiagram(), 'Follow the broad leaf into its stem. The egg marks the larval food plant; this schematic is not a plant-identification guide.');
    case 2: return `<div class="stage-cards">${[
      ['Intact casing', 'The ridged shell rests at the same point on the leaf.'],
      ['A first opening', 'A small opening changes the contour near the upper shell.'],
      ['The hatchling', 'The young larva and the opened shell are shown together.'],
    ].map(([label, caption], n) => diagramCard(label, hatchDiagram(n), caption)).join('')}</div>`;
    case 3: return `<div class="stage-cards">${diagramCard('Before feeding', feedingDiagram(false), 'The mouth meets the intact leaf margin.')}${diagramCard('After feeding', feedingDiagram(true), 'A small crescent of tissue is absent beside the mouth. The comparison gives no feeding rate.')}</div>`;
    case 4: return `<p class="interpretation">Five instars, five distinct drawings. Display sizes are illustrative, not a measured growth scale.</p><div class="stage-cards">${instars.map(s => diagramCard(`${s.label} — ${s.title}`, instarDiagram(s.number), s.description)).join('')}</div>`;
    case 5: return diagramCard('The attachment', attachmentDiagram(), 'The rear of the larva meets a silk pad. The head lies at the lower curve of the J. A nearby support is a composed story setting.');
    case 6: return `<div class="stage-cards">${diagramCard('Larval posture', attachmentDiagram(), 'The final larval posture precedes the shedding event.')}${imageCard('Chrysalis', 'ai-06-jade', alts[6], 'The new pupal surface remains physically attached. These are selected states, not a continuous recording of shedding.')}</div>`;
    case 7: return `<p class="interpretation"><strong>Illustrative reconstruction.</strong> Compare the exterior image above with the intentionally simplified diagram below.</p>${diagramCard('Developing adult structures', insideDiagram(), 'Folded wing regions indicate development within the retained shell outline. This is not microscopy, dissection or a complete organ map.')}`;
    case 8: return `<div class="stage-cards">${imageCard('Early pupa', 'ai-06-jade', alts[6], 'The jade exterior provides the reference.')}${imageCard('Late pupa', 'ai-08-pattern', alts[8], 'Late wing pigmentation changes the visible pattern beneath the casing. No universal countdown is implied.')}</div>`;
    case 9: return `<p class="interpretation">Three selected moments. They are separate explanatory poses, not equal time intervals.</p><div class="stage-cards">${emergenceStages.map((s, n) => diagramCard(s.label, emergenceDiagram(n), s.description)).join('')}</div>${imageCard('Wings unfolding — macro illustration', 'ai-15-unfolding', 'A hanging monarch with longer, partly expanded orange-and-black wings below its spent chrysalis. An illustration.', 'This second macro view complements the three schematic poses. The repeated plant and attachment preserve the illustrated setting.')}`;
    case 10: return `${imageCard('The habitat remains', 'ai-13-meadow', 'Milkweed leaves and a stem in a quiet meadow after the illustrated butterfly has left the frame.', 'The final view recalls the plant where the story began.')}${diagramCard('Egg · Larva · Pupa · Adult', cycleDiagram(), 'The return arrow represents a new generation. An adult butterfly does not become an egg again.')}`;
    default: return '';
  }
}

function readingCopy(value) {
  return value
    .replace('Select each specimen to see the differences, then bring all five back into view.', 'The five specimens below show those differences together.')
    .replace('before switching to the explanatory view.', 'while comparing it with the explanatory view below.');
}

const chapterHTML = chapters.map((ch, i) => `<section class="chapter" id="${ch.id}" aria-labelledby="heading-${ch.id}">
  <header class="chapter-heading"><p class="eyebrow">Chapter ${String(ch.number).padStart(2, '0')} / ${escape(ch.title)}</p><h2 id="heading-${ch.id}">${escape(ch.heading)}</h2><p class="lead">${escape(ch.lead)}</p></header>
  <figure class="chapter-image">${image(assetNames[i], alts[i], i === 0, i === 0)}<figcaption>${escape(ch.illustrationNote)}</figcaption></figure>
  <div class="beats">${ch.beats.map(beat => `<div class="beat"><h3>${escape(beat.title)}</h3><p>${escape(readingCopy(beat.body))}</p></div>`).join('')}</div>
  <div class="inspection">${inspection(i)}</div>
  <p class="chapter-note">${escape(ch.notes)}</p>
  <p class="chapter-sources">Source notes: ${ch.sources.map(id => `<a href="#source-${id}">${escape(sources.find(s => s.id === id).title.split(' — ')[0])}</a>`).join(' · ')}</p>
  <nav class="chapter-links" aria-label="Chapter ${ch.number} navigation"><a href="#contents">Chapter index</a>${i < chapters.length - 1 ? `<a href="#${chapters[i + 1].id}">Continue to ${escape(chapters[i + 1].title)} <span aria-hidden="true">→</span></a>` : '<a href="#ch-01">Back to beginning <span aria-hidden="true">↑</span></a>'}<a href="./#${ch.id}">Open this chapter in the interactive experience</a></nav>
</section>`).join('\n');

const document = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#173924">
  <meta name="description" content="The complete, script-free reading edition of CHRYSALIS: eleven illustrated chapters through the monarch butterfly life cycle, with scientific sources.">
  <title>CHRYSALIS — Complete reading edition</title>
  <link rel="icon" href="./favicon.svg" type="image/svg+xml">
  <style>
    :root{color-scheme:light;--paper:#f3f1e5;--ink:#173924;--muted:#4b5d48;--rule:#bdc5ab;--gold:#74612f}
    *{box-sizing:border-box}html{scroll-behavior:auto}body{margin:0;background:var(--paper);color:var(--ink);font:1.125rem/1.7 ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow-wrap:break-word}
    a{color:inherit;text-decoration-thickness:.075em;text-underline-offset:.22em}a:hover{text-decoration-thickness:.14em}a:focus-visible,summary:focus-visible{outline:3px solid #966c20;outline-offset:5px}
    .skip-link{position:absolute;top:-6rem;left:1rem;z-index:2;padding:.7rem 1rem;background:var(--paper)}.skip-link:focus{top:1rem}
    .masthead{display:flex;align-items:center;justify-content:space-between;gap:1.5rem;padding:1.5rem max(1.5rem,calc((100vw - 1120px)/2));border-bottom:1px solid var(--rule);font-size:.9rem}.brand{font-weight:600;letter-spacing:.2em;text-decoration:none}.masthead span{color:var(--muted)}
    main{width:min(1120px,calc(100% - 3rem));margin-inline:auto}.opening{padding:5.5rem 0 4rem;max-width:850px}.eyebrow{font-size:.78rem;letter-spacing:.13em;text-transform:uppercase;font-weight:600;color:var(--muted);margin:0 0 1rem}.opening h1{font:400 clamp(3.2rem,8vw,6.2rem)/1.03 Georgia,"Times New Roman",serif;letter-spacing:-.04em;margin:.2rem 0 1.5rem;max-width:12ch}.opening .subtitle{font-family:Georgia,"Times New Roman",serif;font-size:1.4rem;font-style:italic}.opening p{max-width:67ch}.lead{font-size:clamp(1.15rem,2.1vw,1.45rem);line-height:1.6;max-width:64ch}
    .reading-note{border-left:2px solid var(--gold);padding:.15rem 0 .15rem 1.25rem;color:var(--muted);font-size:1rem}.contents{border-block:1px solid var(--rule);padding:2rem 0 2.3rem;margin-bottom:2rem}.contents h2{font:400 1.7rem/1.2 Georgia,serif;margin:0 0 1.5rem}.contents ol{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.4rem 2rem;padding-left:1.8rem;margin:0}.contents li{padding:.3rem 0}.contents a{display:inline-block;min-height:2rem}.index-note{font-size:.94rem;color:var(--muted);margin:1rem 0 0}
    .chapter{padding:4.5rem 0 4rem;border-bottom:1px solid var(--rule);scroll-margin-top:2rem}.chapter-heading h2{font:400 clamp(2.15rem,5vw,3.7rem)/1.08 Georgia,"Times New Roman",serif;letter-spacing:-.025em;margin:0 0 1.25rem;max-width:22ch}.chapter-heading .lead{margin-bottom:2rem}
    figure{margin:0}picture{display:block}img{display:block;width:100%;height:auto;background:#173924;color:#f3f1e5}figcaption{font-size:.94rem;line-height:1.6;color:var(--muted);padding:.9rem 0 0;max-width:90ch}.chapter-image{margin:2rem 0}.beats{display:grid;grid-template-columns:1fr 1fr;gap:1rem 3rem;margin:2.5rem 0}.beat h3{font:400 1.5rem/1.3 Georgia,serif;margin:0 0 .6rem}.beat p{margin:0;max-width:54ch}
    .inspection{margin:2rem 0}.stage-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1.5rem;margin:1.5rem 0}.diagram-surface{background:#10271c;padding:.5rem;border:1px solid #34513a}.scientific-diagram{display:block;width:100%;height:auto;max-width:850px;margin:auto}.diagram-card{margin:1.5rem 0}.stage-cards .diagram-card{margin:0}.diagram-card figcaption,.image-card figcaption{padding:.9rem .1rem 0}.diagram-card figcaption strong,.image-card figcaption strong{display:block;font-size:1.05rem;font-weight:600;color:var(--ink);margin-bottom:.3rem}.diagram-card figcaption span,.image-card figcaption span{display:block}.image-card{margin:2rem 0}.stage-cards .image-card{margin:0}.interpretation{font-size:1rem;max-width:70ch;border-left:2px solid var(--gold);padding-left:1.1rem}.field-note{max-width:70ch;padding:1.25rem 1.5rem;border:1px solid var(--rule)}.field-note h3{font:400 1.5rem/1.3 Georgia,serif;margin:0 0 .6rem}.field-note p{margin:0}.chapter-note{font-size:1rem;color:var(--muted);max-width:80ch}.chapter-sources{font-size:.9rem;color:var(--muted);margin-top:1.5rem}.chapter-links{display:flex;flex-wrap:wrap;gap:.65rem 1.5rem;border-top:1px solid var(--rule);padding-top:1.25rem;margin-top:2rem;font-size:.95rem}.chapter-links a{min-height:2rem}
    .endnotes{padding:4rem 0}.endnotes h2{font:400 2.5rem/1.2 Georgia,serif;margin:0 0 1.5rem}.endnotes h3{font:400 1.5rem/1.3 Georgia,serif;margin:2.5rem 0 1rem}.endnotes p{max-width:75ch}.sources{padding-left:1.5rem;max-width:85ch}.sources li{padding:0 0 1.2rem .4rem}.sources strong{font-size:1rem}.sources p{font-size:.95rem;margin:.3rem 0 0;color:var(--muted)}.source-url{display:block;font-size:.85rem;overflow-wrap:anywhere;color:var(--muted)}footer{border-top:1px solid var(--rule);padding:2rem 1.5rem;text-align:center;font-size:.94rem}
    @media(max-width:700px){.masthead{align-items:flex-start;flex-direction:column;gap:.7rem;padding:1.25rem 1.25rem}.masthead span{display:none}main{width:calc(100% - 2.5rem)}.opening{padding:3.3rem 0 2.5rem}.opening h1{font-size:clamp(3rem,14vw,4.4rem)}.contents ol,.beats,.stage-cards{grid-template-columns:1fr}.contents li{padding:.4rem 0}.chapter{padding:3rem 0}.beats{gap:1.6rem;margin:2rem 0}.stage-cards{gap:1.8rem}.chapter-links{display:grid;gap:1rem}.chapter-links a{min-height:2.4rem}.endnotes h2{font-size:2rem}.field-note{padding:1rem}.diagram-surface{padding:.2rem}}
    @media print{body{font:11pt/1.5 Georgia,serif;background:white;color:black}.masthead,.contents,.chapter-links,.skip-link,footer{display:none}main{width:100%;margin:0}.opening{padding:0 0 1rem}.opening h1{font-size:34pt}.chapter{padding:1.5rem 0;break-before:page}.chapter-heading h2{font-size:26pt}.chapter-image img{max-height:300px;object-fit:contain;background:white}.stage-cards{grid-template-columns:1fr 1fr}.diagram-card,.image-card,.beat{break-inside:avoid}.diagram-surface{print-color-adjust:exact;-webkit-print-color-adjust:exact}.chapter-note,.chapter-sources,figcaption,.sources p{color:#333}.endnotes{break-before:page}.sources a{overflow-wrap:anywhere}}
  </style>
</head>
<body>
  <a class="skip-link" href="#contents">Skip to chapter index</a>
  <header class="masthead"><a class="brand" href="./">CHRYSALIS</a><span>The architecture of becoming</span><a href="./">Return to interactive experience</a></header>
  <main>
    <header class="opening"><p class="eyebrow">Complete reading edition · Eleven chapters</p><h1>${escape(hero.title)}</h1><p class="subtitle">The architecture of becoming</p><p class="lead">${escape(hero.lead)}</p><p class="reading-note">Read the complete story at your own pace. All chapter text, specimen comparisons and explanatory stages are present here without scripts or animation. Images and diagrams accompany the text; the written story remains available if an image cannot load.</p></header>
    <nav class="contents" id="contents" aria-label="All eleven chapters"><h2>Eleven ways of looking closer</h2><ol>${chapters.map(ch => `<li><a href="#${ch.id}">${escape(ch.title)}</a></li>`).join('')}</ol><p class="index-note"><a href="#sources">Scientific sources</a> · <a href="#interpretation">About the illustrations</a></p></nav>
    ${chapterHTML}
    <section class="endnotes" id="interpretation" aria-labelledby="interpretation-heading"><h2 id="interpretation-heading">About this experience</h2><p>${escape(aboutText)}</p><p>The macro scenes are AI-assisted illustrations. The line drawings are authored educational schematics. The leaf, egg, support and wing pattern are continuity devices for a single imagined animal. In nature, the location and duration of development vary.</p><p>The inside view is explicitly an <strong>illustrative reconstruction</strong>. Apparent transparency in that diagram is a drawing convention. The late patterned chrysalis is described through wing pigmentation, while the emergence views distinguish leaving the casing from expanding the wings.</p><p>Scientific references support the biology. They do not imply institutional endorsement or permission to reproduce source photographs. No source photograph, logo or original scientific figure has been reused here.</p></section>
    <section class="endnotes" id="sources" aria-labelledby="sources-heading"><h2 id="sources-heading">Sources &amp; further observation</h2><p>Reviewed on <time datetime="2026-11-09">9 November 2026</time>. Each chapter points to the relevant entries below.</p><ol class="sources">${sources.map(s => `<li id="source-${s.id}"><strong><a href="${escape(s.url)}">${escape(s.title)}</a></strong><p>${escape(s.scope)}</p><span class="source-url">${escape(s.url)}</span></li>`).join('')}</ol><p>Observe wild larvae and pupae without moving or handling them. The story is for learning and close attention; it is not a rearing protocol or a diagnosis guide.</p><p><a href="#contents">Explore the chapters again</a></p></section>
  </main>
  <footer><a href="#ch-01">Back to beginning</a> · <a href="./">Return to interactive experience</a><p>CHRYSALIS — The architecture of becoming</p></footer>
</body>
</html>
`;

const target = fileURLToPath(new URL('../public/reading.html', import.meta.url));
await fs.writeFile(target, document);
console.log(`Generated public/reading.html: ${chapters.length} chapters, ${chapters.reduce((sum, ch) => sum + ch.beats.length, 0)} content beats, no runtime JavaScript.`);
