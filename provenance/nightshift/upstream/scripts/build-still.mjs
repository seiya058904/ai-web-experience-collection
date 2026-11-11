import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chapters, routes, morningTraces, aboutCopy } from '../src/content.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(await readFile(path.join(root, 'docs/media-manifest.json'), 'utf8'));
const dimensions = new Map(manifest.map(asset => [asset.key, asset]));
const escapeHtml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

function img(key, alt, eager = false) {
  const asset = dimensions.get(key);
  if (!asset) throw new Error(`No intrinsic dimensions recorded for ${key}.`);
  return `<img src="./media/${escapeHtml(key)}.webp" alt="${escapeHtml(alt)}" width="${asset.width}" height="${asset.height}" loading="${eager ? 'eager' : 'lazy'}" decoding="async"${eager ? ' fetchpriority="high"' : ''}>`;
}

function figure(key, alt, caption) {
  return `<figure>${img(key, alt)}<figcaption>${escapeHtml(caption)}</figcaption></figure>`;
}

const pairs = {
  'ch-10': [
    ['platform-before', 'The same prepared platform with empty rails and three anonymous waiting passengers.', 'Before service — the platform is ready.'],
    ['platform', 'The first tram stands at the same platform with an open door as a passenger begins to board.', 'First service — a door opens onto the morning.'],
  ],
  'ch-03': [
    ['bakery-before', 'Hands work flour and dough at the bakery bench before the portions are arranged.', 'Before preparation — hands work the flour into the dough.'],
    ['bakery-after', 'The same bakery bench after dough portions and tools have been arranged for the first bake.', 'After preparation — the first dough portions are arranged.'],
  ],
  'ch-05': [
    ['curb-before', 'Before sweeping: leaves, grit and small scraps lie along the wet curb.', 'Before — leaves and grit interrupt the street edge.'],
    ['curb-after', 'After sweeping: the same curb with debris cleared, revealing the paving and gutter.', 'After — the same curb, with leaves and grit removed.'],
  ],
  'ch-09': [
    ['market', 'Hands sort loose flower stems into a worn crate beneath market canopy lamps.', 'Night — loose stems are still being sorted.'],
    ['market-after', 'The same market work area at first light, with sorted stems and crates arranged for opening.', 'First light — the first crates are arranged for opening.'],
  ],
};

function chapterMedia(chapter) {
  if (chapter.id === 'ch-01') {
    return `<figure class="opening-image"><picture><source media="(max-width: 639px)" srcset="./media/hero-mobile.webp">${img('hero', chapter.alt, true)}</picture><figcaption>One room, still awake in an imagined city.</figcaption></figure>`;
  }
  if (pairs[chapter.id]) {
    return `<div class="comparison-pair" aria-label="${escapeHtml(chapter.name)}: two states">${pairs[chapter.id].map(pair => figure(...pair)).join('')}</div>`;
  }
  return figure(chapter.image, chapter.alt, chapter.name);
}

function chapterExtra(chapter) {
  if (chapter.id === 'ch-01') return `<aside class="editorial-note"><h3>Is this a real city?</h3><p>Meridian City is an original fictional composite. Its people, streets and times are invented.</p></aside>`;
  if (chapter.id === 'ch-02') return `<aside class="editorial-note"><h3>Illustrative city</h3><p>${escapeHtml(routes[0].sentence)}</p><ul class="route-list">${routes.filter(route => route.id !== 'all').map(route => `<li><a href="#${route.chapterId}">${escapeHtml(route.label)}</a><p>${escapeHtml(route.sentence)}</p>${route.chapterIds.length > 1 ? `<p class="related">Also in this route: ${route.chapterIds.slice(1).map(id => `<a href="#${id}">${escapeHtml(chapters.find(item => item.id === id).name)}</a>`).join(', ')}.</p>` : ''}</li>`).join('')}</ul><p class="fine-print">This is an editorial plan, not a real service map. The categories do not represent one central control system.</p></aside>`;
  if (chapter.id === 'ch-04') return `<aside class="editorial-note"><h3>Read the scene</h3><p>This is an invented vignette of overnight care. No patient, medical record or real institution is represented. Water, linen and quiet light are observations within the story, not clinical instructions or a worker’s testimony.</p></aside>`;
  if (chapter.id === 'ch-06') return `<aside class="editorial-note"><h3>Surface / Section</h3><p>The conceptual rail section distinguishes the broad head, narrow upright web and wider foot. Below it are a sleeper and ballast. The image draws attention to material and support, without giving dimensions or a maintenance procedure.</p><p class="fine-print">Conceptual section — not an inspection guide. Not to scale.</p></aside>`;
  if (chapter.id === 'ch-07') return `<aside class="editorial-note"><h3>Trace the path</h3><p>Stored water. Treatment. Distribution. Everyday use. These are four ideas in an editorial diagram, connected to the imagined places below the street and the ordinary tap above.</p><p class="fine-print">Illustrative only. Not a real network, a prescribed process order, or operational guidance.</p></aside>`;
  if (chapter.id === 'ch-08') return `<aside class="editorial-note"><h3>What stays on?</h3><ul><li>A lamp above a working bakery table.</li><li>A light along a quiet care corridor.</li><li>A streetlamp over an empty curb.</li><li>A light waiting above the first platform.</li></ul><p class="fine-print">Connections within this fictional night, not a live power network.</p></aside>`;
  if (chapter.id === 'ch-10') return `<aside class="editorial-note"><h3>Trace this night</h3><nav aria-label="Earlier work behind first service"><ul>${['ch-03', 'ch-04', 'ch-05', 'ch-06', 'ch-08'].map(id => `<li><a href="#${id}">${escapeHtml(chapters.find(item => item.id === id).name)}</a></li>`).join('')}</ul></nav></aside>`;
  if (chapter.id === 'ch-11') return `<aside class="morning-traces"><h3>See the morning trace</h3>${morningTraces.map(trace => `<article class="trace" id="trace-${trace.id}"><h4>${escapeHtml(trace.label)}</h4><dl><div><dt>During the night</dt><dd>${escapeHtml(trace.before)}</dd></div><div><dt>By morning</dt><dd>${escapeHtml(trace.after)}</dd></div></dl><a href="#${trace.chapterId}">Return to chapter: ${escapeHtml(chapters.find(item => item.id === trace.chapterId).name)}</a></article>`).join('')}<p><a href="#ch-01">Return to midnight</a> <span aria-hidden="true">·</span> <a href="#chapters">Explore the chapters again</a></p></aside>`;
  return '';
}

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#0B1421">
  <meta name="description" content="The complete still edition of NIGHTSHIFT: eleven chapters of an imagined city, readable without JavaScript or motion.">
  <title>NIGHTSHIFT — The complete still edition</title>
  <link rel="icon" href="./favicon.svg" type="image/svg+xml">
  <style>
    :root{color-scheme:dark;background:#0B1421;color:#E5EAE9;font-family:Arial,Helvetica,sans-serif;font-synthesis:none}*{box-sizing:border-box}body{margin:0}a{color:#E9A85F;text-underline-offset:.22em;text-decoration-thickness:1px}a:hover{color:#fff}a:focus-visible{outline:2px solid #E9A85F;outline-offset:5px}p,li,dd{font-size:clamp(1rem,.93rem + .3vw,1.15rem);line-height:1.75}h1,h2,h3,h4{font-family:Georgia,'Times New Roman',serif;font-weight:400;text-wrap:balance}h1{font-size:clamp(3.25rem,8vw,7rem);line-height:.98;max-width:10ch;margin:1.6rem 0}h2{font-size:clamp(2.1rem,4.5vw,4.7rem);line-height:1.08;margin:1rem 0 1.5rem;max-width:20ch}h3{font-size:clamp(1.65rem,2.8vw,2.7rem);line-height:1.15;margin:0 0 1rem}h4{font-size:1.6rem;line-height:1.2;margin:0 0 1rem}figure{margin:0}img{display:block;width:100%;height:auto;background:#203545}figcaption{color:#B2C2C4;font-size:.9rem;line-height:1.5;margin-top:.8rem}header,main,footer{max-width:1160px;margin:auto;padding-inline:clamp(1.25rem,5vw,4rem)}header{padding-top:2rem;padding-bottom:4.5rem}.topline{display:flex;justify-content:space-between;gap:1.5rem;flex-wrap:wrap;align-items:center}.brand{font-size:.85rem;letter-spacing:.22em;font-weight:600;color:#E5EAE9;text-decoration:none}.edition-label{color:#B2C2C4;font-size:.85rem}.opening-lead{max-width:35rem;margin-bottom:2rem}.skip-link{position:fixed;z-index:10;top:.6rem;left:.6rem;transform:translateY(-160%);background:#E9A85F;color:#0B1421;padding:.8rem 1rem}.skip-link:focus{transform:none}.contents{border-top:1px solid #344851;border-bottom:1px solid #344851;padding-block:2rem;margin-block:3rem}.contents h2{font-family:Arial,Helvetica,sans-serif;font-size:1rem;letter-spacing:.1em;text-transform:uppercase;margin:0 0 1.5rem}.contents ol{columns:2;column-gap:3rem;margin:0;padding-left:1.7rem}.contents li{break-inside:avoid;padding:0 0 .6rem .2rem;font-size:.95rem}.chapter{padding-block:clamp(3.5rem,8vw,7rem);border-top:1px solid #344851;scroll-margin-top:1.5rem}.context{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;color:#B2C2C4;font-size:.8rem;letter-spacing:.08em;text-transform:uppercase}.chapter-lead{max-width:43rem;margin-bottom:2.3rem}.second-beat{max-width:43rem;padding-top:2.3rem;margin-left:auto}.second-beat:before{content:'';display:block;width:3rem;border-top:1px solid #E9A85F;margin-bottom:1.5rem}.comparison-pair{display:grid;grid-template-columns:1fr 1fr;gap:1.3rem}.editorial-note{margin-top:2.7rem;padding:1.7rem clamp(1.2rem,3vw,2.3rem);border-left:1px solid #85ABB3;background:#13212C}.editorial-note h3{font-size:1.6rem}.editorial-note p:last-child{margin-bottom:0}.editorial-note ul{padding-left:1.2rem}.route-list{list-style:none;padding:0!important;margin:1.5rem 0}.route-list li{padding:1rem 0;border-top:1px solid #344851}.route-list p{margin:.45rem 0 0}.route-list a{font-size:1.1rem}.related,.fine-print{color:#B2C2C4;font-size:.9rem}.morning-traces{padding-top:3rem}.trace{padding:1.7rem 0;border-bottom:1px solid #344851}dl{display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin:0 0 1rem}dt{font-size:.78rem;color:#B2C2C4;text-transform:uppercase;letter-spacing:.08em;margin-bottom:.6rem}dd{margin:0}.chapter-navigation{display:flex;justify-content:space-between;gap:1.5rem;margin-top:2.5rem;font-size:.9rem}.about{padding-block:3rem}.about p{max-width:46rem}footer{border-top:1px solid #344851;padding-top:2rem;padding-bottom:3rem}footer p{font-size:.9rem;color:#B2C2C4}@media(max-width:640px){.contents ol{columns:1}.comparison-pair,dl{grid-template-columns:1fr}.comparison-pair{gap:2rem}.second-beat{margin-left:0}.chapter-navigation{flex-wrap:wrap}.opening-image img{max-height:none}.edition-label{width:100%}}@media print{:root{color-scheme:light;background:white;color:#18252F}a{color:#334D5C}.skip-link,.topline>a:last-child{display:none}header,main,footer{max-width:none;padding-inline:0}.chapter{break-before:page}.editorial-note{background:#F0F3F3}.context,.fine-print,figcaption,dt{color:#415B65}img{max-height:70vh;object-fit:contain}a[href^='#']:after{content:''}}
  </style>
</head>
<body>
<a class="skip-link" href="#chapters">Skip to chapters</a>
<header>
  <div class="topline"><a class="brand" href="./index.html">NIGHTSHIFT</a><span class="edition-label">The complete still edition</span><a href="./index.html">Return to the interactive experience</a></div>
  <h1>While the city sleeps</h1>
  <p class="opening-lead">Quiet tasks carry an ordinary night into morning.</p>
  <p class="fine-print">An imagined night in Meridian City. All places, people and times are fictional narrative markers. This edition contains the complete story and every editorial interaction outcome, without JavaScript, sound or animation.</p>
  <nav id="chapters" class="contents" aria-label="All eleven chapters"><h2>Chapters</h2><ol>${chapters.map(chapter => `<li><a href="#${chapter.id}">${escapeHtml(chapter.name)}</a></li>`).join('')}</ol></nav>
</header>
<main>
${chapters.map((chapter, index) => `<section id="${chapter.id}" class="chapter" data-chapter="${chapter.number}" aria-labelledby="title-${chapter.id}">
  <div class="context"><span>${chapter.number} / ${escapeHtml(chapter.name)}</span><span>${escapeHtml(chapter.time)} · fictional time</span></div>
  <h2 id="title-${chapter.id}">${escapeHtml(chapter.heading)}</h2>
  <p class="chapter-lead" data-beat="1">${escapeHtml(chapter.body)}</p>
  ${chapterMedia(chapter)}
  <div class="second-beat" data-beat="2"><h3>${escapeHtml(chapter.beatTitle)}</h3><p>${escapeHtml(chapter.beatBody)}</p></div>
  ${chapterExtra(chapter)}
  <nav class="chapter-navigation" aria-label="Navigation after ${escapeHtml(chapter.name)}"><a href="#chapters">Back to chapters</a>${index < chapters.length - 1 ? `<a href="#${chapters[index + 1].id}">Continue: ${escapeHtml(chapters[index + 1].name)}</a>` : '<a href="#ch-01">Back to beginning</a>'}</nav>
</section>`).join('\n')}
<aside class="about" aria-labelledby="about-title"><h2 id="about-title">About this experience</h2>${aboutCopy.map(copy => `<p>${escapeHtml(copy)}</p>`).join('')}<p>The images are original AI-generated illustrations. The people, buildings and materials belong to an invented story. No identifiable patients, personal records, real service data, worker testimony or operational instructions are represented.</p><p>Public context: <a href="https://www.nyc.gov/site/dsny/careers/sanitation-workers.page">NYC sanitation duties</a> and <a href="https://www.mta.info/planned-service-changes">MTA planned service changes</a>. These sources do not establish the fictional timetable. Reviewed November 9, 2026.</p></aside>
</main>
<footer><p>The city does not sleep at once.</p><a href="./index.html">Return to the interactive experience</a> <span aria-hidden="true">·</span> <a href="#ch-01">Back to beginning</a></footer>
</body>
</html>
`;

await mkdir(path.join(root, 'public'), { recursive: true });
await writeFile(path.join(root, 'public/story.html'), html, 'utf8');
console.log(`Generated public/story.html: ${chapters.length} chapters, ${Object.keys(pairs).length} image comparisons, ${morningTraces.length} morning traces, no JavaScript.`);
