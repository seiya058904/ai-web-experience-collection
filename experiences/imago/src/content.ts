import { art, imageMarkup as img } from './media';

export const chapters = [
  ['01', 'A name still folded'], ['02', 'A small light beneath a leaf'],
  ['03', 'A leaf, changed'], ['04', 'Outgrowing the old shape'],
  ['05', 'The weight of a thread'], ['06', 'A quiet reconstruction'],
  ['07', 'Color arrives first'], ['08', 'Leaving a former shape'],
  ['09', 'Open, then ready'], ['10', 'Leave the sky to it'],
];
export const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>';
const down = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v17m-6-6 6 6 6-6"/></svg>';
const choices = (key: string, values: Array<[string, string]>, label: string) => `<div class="choices" role="group" aria-label="${label}" data-choice-group>${values.map(([value, text]) => `<button type="button" data-state-key="${key}" data-state-value="${value}" aria-pressed="false">${text}</button>`).join('')}</div>`;
const chapterHead = (n: string, label: string, title: string, text: string) => `<div class="chapter-heading"><div class="chapter-title"><h2 id="title-${n}">${title}</h2><p class="chapter-index"><span>${n}</span><span>${label}</span></p></div><p class="chapter-intro">${text}</p></div>`;
const caption = (name: string, text: string) => `<figcaption><span class="caption-rule"></span><span data-caption="${name}">${text}</span></figcaption>`;
const next = (n: string, title: string) => `<a class="next-chapter" href="#chapter-${n}"><span>${title}</span>${arrow}</a>`;

const transitionData = [
  ['01-02','hero-desktop','egg','Earlier, beneath a leaf.','The branch leads us back to a beginning.','branch'],
  ['02-03','egg','caterpillar','A small life begins to feed.','From a pale hatchling to a striped third instar.','leaf'],
  ['03-04','caterpillar','molt','Growth asks for a new surface.','The bands remain; the outer skin is shed.','bands'],
  ['04-05','molt','hanging-j','The search becomes a stillness.','A body finds its point of support.','arc'],
  ['05-06','hero-desktop','hero-desktop','Outside, almost nothing.','Inside, development continues.','silk'],
  ['06-07','hero-desktop','pupa-late','A pattern becomes visible.','An abstract idea gives way to an outward sign.','pattern'],
  ['07-08','pupa-late','emerged','An opening. A different body.','The attachment remains as everything below it changes.','emergence'],
  ['08-09','emerged','adult','Room for a new shape.','Folded wings expand before they are ready for flight.','wing'],
  ['09-10','adult','empty-shell','The world opens around it.','The shell remains at its old attachment.','sky'],
];

const handoffFrames = [
  ['hero-desktop','branch-to-leaf','branch-to-leaf','egg','egg'],
  ['egg','hatchling','caterpillar','caterpillar','caterpillar'],
  ['caterpillar','caterpillar','molt','molt','molt'],
  ['molt','molt','hanging-j','hanging-j','hanging-j'],
  ['hero-desktop','hero-desktop','hero-desktop','hero-desktop','hero-desktop'],
  ['hero-desktop','hero-desktop','pupa-late','pupa-late','pupa-late'],
  ['pupa-late','opening','emerging','gripping','emerged'],
  ['emerged','emerged','expanding','adult','adult'],
  ['adult','adult','empty-shell','empty-shell','empty-shell'],
];
const handoffCaptions = [
  ['A chrysalis, now.','Follow the branch toward the leaf.','Earlier: the branch meets the egg-bearing leaf.','One egg comes into view.','The beginning, held by a leaf.'],
  ['A single pale egg.','Just hatched: a pale body.','Later: third instar.','The striped caterpillar feeds.','A small absence at the leaf edge.'],
  ['A growing caterpillar.','A familiar pattern, a changing body.','Before and after a molt.','The old skin remains behind.','A new surface has room to grow.'],
  ['After a molt.','Later, a search for support.','A new position beneath a branch.','Hanging by the rear end.','The silk pad carries the weight.'],
  ['A settled green chrysalis.','The attachment stays in view.','Surface and development: two ways of looking.','Inside, development continues.','An exterior beside a labelled developmental schematic.'],
  ['The surface hides much of the change.','Return to what can be seen.','Later, the wing pattern is recognizable.','Orange, black, and white.','Compare distinct stages in the next chapter.'],
  ['The late chrysalis.','The covering begins to open.','The body emerges partway.','Finding a grip beneath the shell.','Resting, with the wings still folded.'],
  ['Folded wings beneath the shell.','The folded edges show a new direction.','The wings expand while the adult hangs.','The complete wing pattern becomes readable.','Open wings; time to dry and become ready.'],
  ['An adult, prepared for flight.','The world extends beyond this branch.','The butterfly and the shell share one last view.','A departure, leaving the attachment behind.','The empty shell remains.'],
];

const instarRowBounds: ReadonlyArray<readonly [number, number]> = [
  [60, 175], [190, 330], [340, 513], [520, 713], [720, 965],
];

function developmentBridge(id: string): string {
  return `<figure class="handoff-development-bridge">
    <svg viewBox="100 58 200 200" role="img" aria-labelledby="bridge-title-${id} bridge-desc-${id}">
      <title id="bridge-title-${id}">Continuity of development</title>
      <desc id="bridge-desc-${id}">Abstract wing-shaped outlines connect pupal reorganization with adult structures. They indicate a relationship, not the measured locations of organs.</desc>
      <g fill="none" stroke="currentColor" stroke-width="1.5">
        <path class="bridge-envelope" d="M200 64c-38 15-61 42-61 83 0 61 28 101 61 105 33-4 61-44 61-105 0-41-23-68-61-83Z"/>
        <g class="bridge-wings" stroke-dasharray="4 5"><path d="M195 125c-41-48-83-56-74-4 8 43 36 65 74 70M205 125c41-48 83-56 74-4-8 43-36 65-74 70"/><path d="M195 165c-35 4-51 30-32 45 13 10 24 1 32-19M205 165c35 4 51 30 32 45-13 10-24 1-32-19"/></g>
        <path class="bridge-axis" d="M200 121v89"/>
      </g>
    </svg>
    <figcaption><span>Developmental schematic — not measured internal imagery.</span><ol class="bridge-stages"><li>Larval growth</li><li>Pupal reorganization</li><li>Adult structures</li></ol></figcaption>
  </figure>`;
}

export function handoff(index: number): string {
  const [id, from, to, title, description, kind] = transitionData[index];
  const hasDevelopmentBridge = kind === 'silk' || kind === 'pattern';
  return `<section class="handoff handoff--${kind}${hasDevelopmentBridge ? ' handoff--development' : ''}" data-boundary="${id}" aria-label="Between chapters ${id}">
    <div class="handoff__stage" data-step="0">
      <div class="handoff__art" aria-hidden="true">
        ${handoffFrames[index].map((name,i)=>img(name,'',`class="handoff-frame" data-handoff-frame="${i}" ${i?'hidden':''}`)).join('')}
        ${kind==='bands'?`<div class="handoff-pair">${img(from,'')}${img(to,'')}</div>`:''}
        ${kind==='sky'?img('flight','','class="handoff-flight"'):''}
      </div>
      <div class="handoff__words"><p>${title}</p><span>${description}</span><div class="handoff-caption">${handoffCaptions[index].map((text,i)=>`<span data-handoff-caption="${i}" ${i?'hidden':''}>${text}</span>`).join('')}</div>${hasDevelopmentBridge ? developmentBridge(id) : ''}</div>
      <div class="handoff__line" aria-hidden="true"><i></i></div>
      <span class="handoff__note">${kind === 'branch' ? 'Looking back in time' : kind === 'emergence' || kind === 'wing' || kind === 'leaf' ? 'Separate moments, one life' : 'Continue observing'}</span>
    </div>
  </section>`;
}

export function pageMarkup(): string {
  return `
  <a href="#chapter-01" class="skip-link">Skip to the story</a>
  <header class="site-header">
    <a class="wordmark" href="#chapter-01" aria-label="IMAGO — return to the beginning">IMAGO<span class="wordmark-dot" aria-hidden="true"></span></a>
    <nav class="stage-nav" aria-label="Life stages"><a href="#chapter-02">Egg</a><a href="#chapter-03">Caterpillar</a><a href="#chapter-05">Chrysalis</a><a href="#chapter-08">Adult</a></nav>
    <div class="header-actions"><a class="collection-return" href="${import.meta.env.BASE_URL}#world-imago" aria-label="Return to Collection" title="Return to Collection"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7"/></svg><span>Collection</span></a><button type="button" class="quiet-button motion-button" data-motion-toggle aria-label="Motion preference: automatic">Motion: auto</button><button type="button" class="quiet-button" data-menu-open aria-haspopup="dialog">Chapters <span class="menu-symbol" aria-hidden="true"><i></i><i></i></span></button></div>
    <div class="reading-track" aria-hidden="true"><i data-reading-progress></i></div>
  </header>
  <dialog class="chapter-menu" aria-labelledby="menu-title" data-menu data-lenis-prevent>
    <div class="menu-top"><h2 id="menu-title">One life.<br><em>Ten chapters.</em></h2><button type="button" class="close-button" data-menu-close aria-label="Close chapters">${'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>'}</button></div>
    <nav aria-label="All chapters">${chapters.map(([n,t]) => `<a data-chapter-link href="#chapter-${n}"><span>${n}</span><span>${t}</span>${arrow}</a>`).join('')}</nav>
    <p>Take your time. Every stage is worth a closer look.</p><a class="text-link" href="#field-notes" data-close-menu>Field notes & sources</a>
  </dialog>
  <main>
    <section class="chapter hero" id="chapter-01" aria-labelledby="hero-title">
      <div class="hero-art">
        <picture><source media="(max-width: 700px)" srcset="${art('hero-mobile',true)}"><img src="${art('hero-desktop')}" width="1536" height="1024" alt="A jade-green monarch chrysalis hangs from a small silk pad beneath a slender branch." fetchpriority="high" decoding="sync" data-art="hero-desktop" class="hero-original"></picture>
        <div class="hero-layers" aria-hidden="true"><img data-layer-src="${art('hero-background')}" alt="" width="1536" height="1024"><img data-layer-src="${art('hero-subject')}" alt="" width="1536" height="1024" class="hero-subject"><img data-layer-src="${art('foreground')}" alt="" width="1536" height="1024" class="hero-foreground"></div>
      </div>
      <div class="hero-copy"><h1 id="hero-title">IMAGO</h1><p class="hero-subtitle">Wings within.</p><p class="hero-line">Change sometimes begins <br>in almost perfect stillness.</p>
        <a class="story-link" href="#chapter-02">Look back to the beginning ${down}</a>
      </div>
      <div class="hero-bottom"><div><span class="small-label">One life. Many shapes.</span><span class="species"><i>Danaus plexippus</i> · Monarch butterfly</span></div><span class="hero-chapter">01 <span>/ 10</span></span></div>
      <div class="hero-observation"><details><summary>Where are we? <span aria-hidden="true">+</span></summary><p>A small green shape hangs beneath a branch. This is a chrysalis: one chapter in a monarch’s life. Before it came an egg and a caterpillar. After it, another body will meet the same world.</p><div class="life-stages"><a href="#chapter-02"><b>Egg</b><span>A beginning on milkweed.</span></a><a href="#chapter-03"><b>Caterpillar</b><span>Feeding, growing, molting.</span></a><a href="#chapter-05" aria-current="step"><b>Chrysalis</b><span>We begin here.</span></a><a href="#chapter-08"><b>Adult</b><span>A body with wings.</span></a></div><p class="fine-print">Four distinct stages, one continuous life. Scrolling revisits its stages; it does not model the speed of development.</p></details></div>
    </section>
    ${handoff(0)}
    <section class="chapter chapter--leaf" id="chapter-02" aria-labelledby="title-02">
      <div class="leaf-layout"><div class="leaf-copy">${chapterHead('02','Egg','A small light<br><em>beneath a leaf.</em>','Earlier, the story rested beneath a milkweed leaf. A single pale egg, ribbed from tip to base, held the beginning. The leaf was more than a place to wait: it would become food for the caterpillar.')}
      ${choices('eggZoom',[['false','The whole leaf'],['true','Look closer']],'Egg observation scale')}<p class="tool-note">The same egg, in the same place.</p></div>
      <figure class="egg-figure"><div class="egg-view" data-egg-view>${img('egg','One pale, ribbed monarch egg among the veins of a milkweed leaf.')}<span class="egg-target" aria-hidden="true"></span></div>${caption('egg','One egg beneath a milkweed leaf. A host, and a future food source.')}</figure></div>
      <div class="chapter-foot"><p>The beginning is small.<br>The leaf is a whole world.</p>${next('03','Follow the leaf’s edge')}</div>
    </section>
    ${handoff(1)}
    <section class="chapter chapter--feeding" id="chapter-03" aria-labelledby="title-03">
      <div class="chapter-split">${chapterHead('03','Caterpillar','A leaf,<br><em>changed.</em>','The newly hatched caterpillar is pale, without the bold stripes we recognize. Later, in its third instar, those bands are clear. As it feeds along the leaf’s edge, its growing body leaves a small absence behind.')}
      <div class="observation-copy">${choices('larvaStage',[['hatchling','Just hatched'],['third','Later · third instar']],'Caterpillar stage')}<p>An <em>instar</em> is a stage between molts.<br>These views show different moments.</p></div></div>
      <figure class="panorama"><div class="media-stack" data-media="larva">${img('hatchling','A newly hatched pale caterpillar beside an opened eggshell on milkweed.','data-frame="hatchling" hidden')}${img('caterpillar','A striped third-instar monarch grips the edge of a milkweed leaf beside an eaten notch.','data-frame="third"')}<span class="media-status" data-media-status></span></div>${caption('larva','Later · third instar. Bands are clear; the leaf edge now carries a notch.')}</figure>
      ${next('04','Watch a body outgrow its surface')}
    </section>
    ${handoff(2)}
    <section class="chapter chapter--molt" id="chapter-04" aria-labelledby="title-04">
      <div class="molt-layout"><figure>${img('molt','A newly molted monarch caterpillar on a leaf, with its small collapsed shed skin behind it.')}${caption('molt','A new surface, with the shed skin beside it.')}</figure><div>${chapterHead('04','Growth & molting','Outgrowing<br><em>the old shape.</em>','Growth asks for more than a larger outline. The caterpillar sheds an outer skin that no longer fits, revealing a soft new surface. Across successive instars, its body changes while the life within it continues.')}
      <div class="instar-study"><h3>Five instars. A changing body.</h3>${choices('instar',[['1','I'],['2','II'],['3','III'],['4','IV'],['5','V']],'Compare larval instars')}<p data-instar-detail>In the fifth instar, feeding and growth precede the search for a place to pupate.</p><p class="fine-print">A stage guide, not a measuring scale.</p></div></div></div>
      <div class="instar-gallery" aria-label="Five instars, shown as separate moments">${[['I','First instar','A pale body, a small dark head.'],['II','Bands appear','Small filaments and clear bands.'],['III','A stronger pattern','Longer filaments, a growing body.'],['IV','A fuller shape','More robust segments and gripping prolegs.'],['V','Before pupation','A stout body, ready for its next change.']].map(([roman,label,note],i)=>{const [top,bottom]=instarRowBounds[i];return `<figure><div class="instar-row" style="--row-top:${top/1024*100}%;--row-bottom:${(1024-bottom)/1024*100}%;--row-center:${(top+bottom)/2/1024*100}%">${img('instars',`Instar ${roman}: ${note}`)}</div><figcaption><b>${roman}</b><span><strong>${label}</strong>${note}</span></figcaption></figure>`;}).join('')}</div><p class="instar-scale-note fine-print">Different moments of one life. Relative display sizes are schematic; this is not a measured growth chart.</p>
    </section>
    ${handoff(3)}
    <section class="chapter chapter--silk" id="chapter-05" aria-labelledby="title-05">
      <div class="silk-intro">${chapterHead('05','Pupation','The weight<br><em>of a thread.</em>','Feeding gives way to a search for support. The caterpillar makes a small silk pad, then hangs in a J. Its final larval skin is shed, revealing the green pupa beneath. The attachment remains the center of everything.')}
      ${choices('pupationStage',[['j','Hanging in a J'],['forming','Forming a chrysalis'],['pupa','The green pupa']],'Observe pupation')}<p class="tool-note">A sequence of separate observed stages.</p></div>
      <figure class="silk-figure"><div class="media-stack" data-media="pupation">${img('hanging-j','The monarch caterpillar hangs by its rear end in a J shape beneath a silk pad.','data-frame="j"')}${img('forming','A pale green pupa is revealed below a small bundle of shed larval skin.','data-frame="forming" hidden')}${img('hero-desktop','The settled green chrysalis remains secured at the same branch attachment.','data-frame="pupa" hidden')}<span class="media-status" data-media-status></span></div>${caption('pupation','Hanging from its rear end, the caterpillar curls its head upward.')}</figure>
      <aside class="silk-note"><span class="anchor-mark" aria-hidden="true"></span><div><h3>A very small point of trust.</h3><p>The chrysalis is secured to the silk pad by a hooked structure called the <em>cremaster</em>. This is a pupa, not a silken cocoon.</p></div></aside>
    </section>
    ${handoff(4)}
    <section class="chapter chapter--rebuilding" id="chapter-06" aria-labelledby="title-06">
      ${chapterHead('06','Development','A quiet<br><em>reconstruction.</em>','The outside offers little to watch. Inside, development continues. Adult structures take shape as tissues change and reorganize. This is a connected process, already underway before the chrysalis formed—not an entire animal disappearing and starting again.')}
      <div class="development-layout"><figure class="development-specimen">${img('hero-desktop','The same monarch chrysalis, apparently still from the outside.')}<figcaption>The outer shape offers few clues.</figcaption></figure><div class="development-panel">
      ${choices('developmentView',[['surface','See the surface'],['schematic','See the schematic']],'Surface and development')}
      <div data-development-surface><h3>Stillness is an appearance.</h3><p>The outline holds. The attachment holds. Development does not pause just because we cannot see it.</p><div class="surface-line" aria-hidden="true"></div><p class="fine-print">The next chapter returns to changes visible from the outside.</p></div>
      <div data-development-schematic hidden><svg class="development-diagram" viewBox="0 0 400 320" role="img" aria-labelledby="diagram-title diagram-desc"><title id="diagram-title">Continuity of development</title><desc id="diagram-desc">A schematic links larval growth, pupal reorganization, and adult structures. Abstract wing-shaped outlines show a relationship, not the measured locations of organs.</desc><g fill="none" stroke="currentColor" stroke-width="1.2"><path d="M200 32v32m0 188v36M200 64c-38 15-61 42-61 83 0 61 28 101 61 105 33-4 61-44 61-105 0-41-23-68-61-83Z"/><path d="M195 125c-41-48-83-56-74-4 8 43 36 65 74 70M205 125c41-48 83-56 74-4-8 43-36 65-74 70" stroke-dasharray="4 5"/><path d="M195 165c-35 4-51 30-32 45 13 10 24 1 32-19M205 165c35 4 51 30 32 45-13 10-24 1-32-19" stroke-dasharray="4 5"/><path d="M200 121v89M123 140H56M276 140h68M159 221l-24 30M241 221l24 30"/></g><circle cx="200" cy="36" r="3" fill="currentColor"/><circle cx="200" cy="287" r="3" fill="currentColor"/></svg><ol class="development-stages"><li>Larval growth</li><li>Pupal reorganization</li><li>Adult structures</li></ol><p class="schematic-label">Developmental schematic — not measured internal imagery.</p></div></div></div>
    </section>
    ${handoff(5)}
    <section class="chapter chapter--observer" id="chapter-07" aria-labelledby="title-07">
      <div class="observer-heading">${chapterHead('07','The observation table','Color<br><em>arrives first.</em>','Near the end of this stage, orange, black, and white become recognizable beneath the covering. Pigment develops in the wing scales. The familiar outline remains, while the pattern of the adult begins to announce itself.')}<p class="observer-aside">Separate moments, <br>aligned for observation.</p></div>
      <div class="observer-table">
        <div class="observer-controls">${choices('observationStage',[['early','Early'],['middle','Middle'],['late','Late']],'Chrysalis observation stage')}<div class="observer-actions"><button type="button" class="text-button" data-state-key="comparison" data-state-value="true" aria-pressed="false">Side by side</button><button type="button" class="text-button" data-state-key="comparison" data-state-value="false" aria-pressed="true">Single view</button><button type="button" class="text-button" data-reset-observation>Reset observation</button></div></div>
        <div data-observer-single><figure class="observer-single"><div class="media-stack" data-media="observer">${img('pupa-early','Early pale-green chrysalis at the fixed branch attachment.','data-frame="early" hidden')}${img('hero-desktop','Middle-stage green chrysalis at the fixed branch attachment.','data-frame="middle"')}${img('pupa-late','Late chrysalis with orange and black wing pattern visible through the textured covering.','data-frame="late" hidden')}<span class="media-status" data-media-status></span></div>${caption('observer','Middle. The familiar green covering; little outward change to see.')}</figure></div>
        <div class="comparison-panel" data-comparison-panel hidden><div class="side-by-side"><figure>${img('hero-desktop','Middle-stage green chrysalis.')}<figcaption>Middle</figcaption></figure><figure>${img('pupa-late','Late patterned chrysalis.')}<figcaption>Late</figcaption></figure></div><details class="reveal-details"><summary>Reveal the aligned comparison</summary><div class="reveal-view" data-reveal-view style="--reveal:50%">${img('hero-desktop','Middle stage, behind the comparison.')}<div class="reveal-overlay">${img('pupa-late','Late stage, revealed across the matching outline.')}</div><span class="reveal-divider" aria-hidden="true"></span><span class="reveal-label reveal-label--left">Late</span><span class="reveal-label reveal-label--right">Middle</span></div><label class="range-label">Reveal the comparison<input type="range" min="0" max="100" value="50" data-reveal></label></details></div>
        <p class="table-note">Your selection changes the view, not the animal’s age. These are artistic reconstructions of distinct stages.</p>
      </div>
    </section>
    ${handoff(6)}
    <section class="chapter chapter--emergence" id="chapter-08" aria-labelledby="title-08">
      <div class="emergence-copy">${chapterHead('08','Emergence','Leaving<br><em>a former shape.</em>','The adult emerges through an opening in the pupal covering. It finds a grip and hangs beneath the empty shell. Its wings are still soft and folded. Leaving the chrysalis is a beginning, not an immediate invitation to fly.')}</div>
      <figure class="emergence-main"><div class="media-stack" data-media="emergence">${img('opening','The first opening in the covering; the adult’s head begins to show.','data-frame="0"')}${img('emerging','The adult emerges partway, with its supporting feet at the shell.','data-frame="1" hidden')}${img('gripping','The adult has pulled clear and establishes its grip under the empty shell.','data-frame="2" hidden')}${img('emerged','The newly emerged adult hangs beneath the empty shell with folded wings.','data-frame="3" hidden')}<span class="media-status" data-media-status></span></div>${caption('emergence','The covering opens.')}</figure>
      <div class="sequence-nav"><button type="button" class="round-button" data-emergence-prev aria-label="Previous emergence view">${arrow}</button><span data-emergence-count>1 / 4</span><button type="button" class="round-button" data-emergence-next aria-label="Next emergence view">${arrow}</button></div>
      <div class="emergence-contact" role="group" aria-label="Four emergence views" data-choice-group>${[['opening','The covering opens'],['emerging','The body emerges'],['gripping','Finding a grip'],['emerged','Resting beneath the shell']].map(([name,label],i)=>`<button type="button" data-state-key="emergenceStep" data-state-value="${i}" aria-pressed="${i===0}">${img(name,'')}<span><b>0${i+1}</b>${label}</span></button>`).join('')}</div>
      <p class="sequence-note">Four complete views. No rush between them.</p>
    </section>
    ${handoff(7)}
    <section class="chapter chapter--wings" id="chapter-09" aria-labelledby="title-09">
      <div class="wing-heading">${chapterHead('09','Expansion & preparation','Open,<br><em>then ready.</em>','The new wings unfold as the butterfly pumps hemolymph into them. They gain their shape, then need time to dry and stiffen. Forewings and hindwings become readable as distinct forms, carrying a surface of overlapping scales.')}<p class="wing-note">Not yet flight. <br>First, the work of opening.</p></div>
      ${choices('wingStage',[['folded','Folded'],['expanding','Expanding'],['open','Open wings']],'Wing expansion stage')}
      <div class="wing-layout"><figure class="wing-main"><div class="media-stack" data-media="wing">${img('emerged','Freshly emerged monarch with small folded wings.','data-frame="folded" hidden')}${img('expanding','The monarch’s wings are partly expanded while it remains supported.','data-frame="expanding" hidden')}${img('adult','A supported monarch with two larger forewings and two rounded hindwings open.','data-frame="open"')}<span class="media-status" data-media-status></span></div>${caption('wing','Two forewings and two hindwings meet at the thorax.')}</figure>
      <aside class="wing-study"><h3>A closer observation.</h3>${choices('wingDetail',[['whole','Whole'],['forewing','Forewing'],['hindwing','Hindwing'],['body','Body']],'Observe adult structure')}<div class="wing-window" data-wing-window data-detail="whole">${img('adult','A detail from the same adult image, selected by the observation controls.')}</div><p data-wing-detail-copy>Two forewings and two hindwings meet at the thorax.</p><p class="fine-print">The window uses the same image. Wing texture is an artistic macro reconstruction.</p></aside></div>
    </section>
    ${handoff(8)}
    <section class="chapter chapter--ending" id="chapter-10" aria-labelledby="title-10">
      <figure class="ending-scene" data-departure-scene data-departure-state="resting">${img('departure-resting','An adult monarch with open wings grips the rim of its empty chrysalis beneath the branch.','class="ending-resting"')}${img('empty-shell','The empty chrysalis remains on the branch above a softly focused milkweed meadow.','class="ending-empty" hidden')}${img('flight','','class="departure-butterfly" hidden aria-hidden="true"')}<figcaption class="sr-only">The branch and its empty shell remain after the butterfly leaves.</figcaption></figure>
      <div class="ending-copy">${chapterHead('10','Departure','Leave the sky<br><em>to it.</em>','At last, the branch no longer holds the whole story. When the butterfly leaves, the empty chrysalis remains at its old attachment. Return to any stage and the shapes seem less separate: each belonged to this one imagined life.')}
        <div class="departure-controls"><button type="button" class="story-link" data-watch-departure>Watch it leave ${arrow}</button><button type="button" class="text-button" data-show-final>See the final view</button><button type="button" class="text-button" data-reset-departure>Return to the branch</button></div>
      </div>
      <div class="closing-line"><p>The shape left behind<br><em>is a trace of having been here.</em></p><a href="#chapter-01" class="story-link" data-look-again>Look again ${arrow}</a></div>
      <nav class="stage-revisit" aria-label="Revisit the life stages">${[['02','egg','Egg','A beginning on milkweed.'],['03','caterpillar','Caterpillar','A growing body.'],['07','hero-desktop','Chrysalis','A quiet reconstruction.'],['09','adult','Adult','A different way to meet the world.']].map(([id,asset,label,sub])=>`<a href="#chapter-${id}" data-revisit="${id}">${img(asset,'')}<span><b>${label}</b><span>${sub}</span></span>${arrow}</a>`).join('')}</nav>
    </section>
  </main>
  <footer id="field-notes" class="field-notes">
    <div class="notes-intro"><a class="wordmark" href="#chapter-01">IMAGO</a><p>An illustrated natural history.<br>One life, patiently observed.</p><button type="button" class="text-button" data-sound-toggle aria-pressed="false">Ambient sound: off</button><p class="fine-print sound-note">An optional, softly composed air soundscape.</p></div>
    <div class="notes-detail"><h2>Field notes & sources</h2><p>These AI-generated images are artistic reconstructions of one imagined monarch’s life. Its setting, light, and visual continuity are creative decisions. The order of development is informed by the sources below.</p><p>Internal development is shown only as a labeled schematic. Scroll distance is not elapsed biological time.</p><div class="source-links"><a href="https://monarchjointventure.org/monarch-biology/life-cycle" target="_blank" rel="noreferrer">Monarch Joint Venture · Life cycle ${arrow}</a><a href="https://www.amnh.org/exhibitions/butterflies/metamorphosis" target="_blank" rel="noreferrer">American Museum of Natural History · Metamorphosis ${arrow}</a><a href="https://monarchwatch.org/biology/" target="_blank" rel="noreferrer">Monarch Watch · Biology ${arrow}</a><a href="https://monarchwatch.org/rear/" target="_blank" rel="noreferrer">Monarch Watch · Development observations ${arrow}</a><a href="https://www.fws.gov/species/monarch-danaus-plexippus" target="_blank" rel="noreferrer">U.S. Fish & Wildlife Service · Monarch ${arrow}</a><a href="https://gardens.si.edu/learn/for-educators/cultivating-habitat/butterfly-gardening/about-butterflies/" target="_blank" rel="noreferrer">Smithsonian Gardens · Wings & scales ${arrow}</a></div><p class="fine-print">Independent creative work. No source photographs are reproduced. No account, tracking, or external runtime service is required.</p></div>
    <div class="footer-bottom"><span>Wings within.</span><span>Made for a slower kind of looking.</span><a href="#chapter-01">Back to the beginning ${arrow}</a></div>
  </footer>
  <div class="sr-only" role="status" aria-live="polite" data-observation-status></div>
  <div class="chapter-position" aria-hidden="true"><span data-current-number>01</span><i></i><span>10</span></div>`;
}
