import { chapters, OPENING_OPTIONS, DEFAULT_OPENING, LIN_NOTE, HANDOUT_TITLE, HANDOUT_REMINDER, ABANDONED_OPENINGS, CLOSING_LINE } from './story.ts';
import type { Chapter } from './story.ts';

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';
const down = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v15M6 13l6 6 6-6"/></svg>';
const clip = '<svg class="paperclip" viewBox="0 0 38 90" aria-hidden="true"><path d="M26 26v44c0 15-24 15-24 0V18C2-2 36-2 36 18v46c0 9-17 9-17 0V23" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
const asset = (name: string) => `${import.meta.env.BASE_URL}berth/assets/${name}`;
export function picture(name: string, alt: string, {mobile = '', eager = false, className = ''} = {}): string {
  return `<picture class="art ${className}" data-asset="${name}"${mobile ? ` data-mobile="${mobile}"` : ''}>${mobile ? `<source media="(max-width: 720px)" srcset="${asset(mobile+'-small.webp')} 600w, ${asset(mobile+'.webp')} 941w" sizes="100vw">` : ''}<img src="${asset(name+'.webp')}" srcset="${asset(name+'-small.webp')} 840w, ${asset(name+'.webp')} 1672w" sizes="(max-width:720px) 100vw, (max-width:1200px) 80vw, 1400px" alt="${esc(alt)}" width="1672" height="941" ${eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"'} decoding="async" data-fallback="${asset(name+'-small.webp')}"${mobile ? ` data-fallback-mobile="${asset(mobile+'-small.webp')}"` : ''} /></picture>`;
}
function meta(c: Chapter): string { return `<div class="chapter-meta"><span>Chapter ${String(c.number).padStart(2,'0')}</span><span class="meta-rule"></span><time>${c.time}</time></div>`; }
function heading(c: Chapter): string { return `${meta(c)}<h2 id="${c.id}-title">${esc(c.title)}</h2>`; }
function paras(c: Chapter): string { return c.paragraphs.map((p,i)=>`<p data-beat="${i+1}">${esc(p)}</p>`).join(''); }
function quote(c: Chapter): string { return c.quote ? `<blockquote><p>“${esc(c.quote.text)}”</p><cite>${esc(c.quote.speaker)}</cite></blockquote>` : ''; }
function start(c: Chapter, cls: string): string { return `<section id="${c.id}" class="chapter ${cls}" data-chapter="${c.number}" aria-labelledby="${c.id}-title">`; }
function cards(prefix = ''): string { return `<div class="two-notes" aria-label="The two cards Ning took with her"><article class="note note--ning">${clip}<span class="note-owner">Ning’s first line <time>02:10</time></span><p><bdi data-user-line lang="" dir="auto">${esc(DEFAULT_OPENING)}</bdi></p><span class="note-foot">For the morning</span></article><article class="note note--lin"><span class="note-owner">Ms. Lin’s note <time>23:06</time></span><p>${esc(LIN_NOTE)}</p><span class="note-foot">A small thing to remember</span></article></div>${prefix ? `<div class="note-actions"><button type="button" data-copy-line>${arrow}<span>Copy your first line</span></button><a href="#ch-07">Edit your line</a></div><div class="copy-feedback"><p data-copy-status class="copy-status" role="status" aria-live="polite"></p><textarea data-copy-fallback class="copy-fallback" aria-label="Select your first line to copy it manually" readonly hidden></textarea></div>` : ''}`; }

type TransitionFrame = { asset: string; caption: string; focus?: string; wipe?: 'left' | 'right' | 'up' | 'down' };
type TransitionSpec = { label: string; kind: string; frames: TransitionFrame[]; sequence?: boolean };
const transitionNames: TransitionSpec[] = [
  { label: 'A little room for one another', kind: 'door', frames: [
    { asset: 'hero', caption: 'Ning steps into the small compartment.' },
    { asset: 'shared-light', caption: 'Ms. Lin makes a little room in the light.', focus: '64% center' },
  ] },
  { label: 'A little light on the page', kind: 'table', frames: [
    { asset: 'shared-light', caption: 'A little of the light, offered to Ning.', focus: '64% center' },
    { asset: 'table', caption: 'Twelve pages, and an opening still to write.' },
  ] },
  { label: 'Back to this night', kind: 'door-reverse', frames: [
    { asset: 'table', caption: 'The pages stay on the little table.' },
    { asset: 'corridor', caption: 'Ning takes her cup into the corridor.', focus: '40% center' },
  ] },
  { label: 'The same small pool of light', kind: 'door', frames: [
    { asset: 'corridor', caption: 'She returns with water in her cup.', focus: '40% center' },
    { asset: 'night-talk', caption: 'Two travellers, each with a different tomorrow.' },
  ] },
  { label: 'The room grows quiet', kind: 'bunk', sequence: true, frames: [
    { asset: 'night-talk', caption: 'One card for each of them. A little longer in the light.' },
    { asset: 'climb', caption: 'Ning takes her pages and her own card up the ladder.', focus: '78% center', wipe: 'down' },
    { asset: 'sleep', caption: 'Her card by the pillow. Ms. Lin’s card and glasses below.', focus: '60% center', wipe: 'up' },
  ] },
  { label: 'One thought, still awake', kind: 'paper', frames: [
    { asset: 'sleep', caption: 'Both travellers have settled for the night.', focus: '60% center' },
    { asset: 'pillow', caption: 'Beside Ning’s pillow, a small beginning.', focus: '53% center' },
  ] },
  { label: 'The hours pass through the window', kind: 'dawn', frames: [
    { asset: 'blue-hour', caption: 'The same window before the morning.', focus: '65% center' },
    { asset: 'dawn', caption: 'First light. Their things are still where they left them.' },
  ] },
  { label: 'Two sentences, kept together', kind: 'cards', sequence: true, frames: [
    { asset: 'morning-note', caption: 'Ms. Lin hands over the note she wrote in the night.' },
    { asset: 'paper-binding', caption: 'The same clip, keeping two cards together.', wipe: 'up' },
    { asset: 'packing', caption: 'The two cards go into Ning’s canvas bag.', focus: '60% center' },
  ] },
  { label: 'Two separate mornings', kind: 'departure', sequence: true, frames: [
    { asset: 'packing', caption: 'Their bags are packed. The morning is waiting.', focus: '60% center' },
    { asset: 'lin-departure', caption: 'Ms. Lin goes first, her travel bag in hand.', focus: '41% center' },
    { asset: 'ning-departure', caption: 'Ning follows, carrying her pages and the two cards.', focus: '43% center', wipe: 'right' },
    { asset: 'empty', caption: 'Only daylight remains in the compartment.' },
  ] },
];
export function transition(index: number): string {
 const spec=transitionNames[index-1];
 const {label,kind,frames,sequence=false}=spec;
 const mobileAssets: Record<string,string>={hero:'hero-mobile','night-talk':'night-talk-mobile',dawn:'dawn-mobile',empty:'empty-mobile'};
 const bindingMarkup=`<div class="paper-binding"><div class="binding-heading"><span class="paper-detail-label">A small thing to take with her</span><h3>Two cards.<br>One familiar clip.</h3></div><fieldset class="binding-controls"><legend>Look at the two moments</legend><input type="radio" name="binding-moment" id="binding-before" value="before"><label for="binding-before">Before</label><input type="radio" name="binding-moment" id="binding-after" value="after" checked><label for="binding-after">After</label></fieldset><div class="binding-board"><div class="binding-notes"><article class="binding-card binding-card--ning"><span class="binding-owner">Ning’s first line</span><p class="binding-text" data-binding-readable data-lenis-prevent><bdi data-user-line lang="" dir="auto">${esc(DEFAULT_OPENING)}</bdi></p></article><article class="binding-card binding-card--lin"><span class="binding-owner">Ms. Lin’s note</span><p class="binding-text" data-binding-readable data-lenis-prevent>${esc(LIN_NOTE)}</p></article></div><div class="binding-manuscript"><span>Her twelve pages</span><p>${esc(HANDOUT_TITLE)}</p><span class="binding-page-lines" aria-hidden="true"></span></div>${clip.replace('class="paperclip"','class="binding-clip"')}</div><p class="binding-action-copy"><span data-binding-caption>The clip still belongs to the handout.</span><span class="binding-before-copy">The handout has the clip. The two cards are separate.</span><span class="binding-after-copy">The pages are free. The same clip now holds both cards.</span></p></div>`;
 const frameMarkup=frames.map((frame,i)=>{
   const mobile=mobileAssets[frame.asset] ?? '';
   const binding=frame.asset==='paper-binding';
   const classes=`transition-frame ${i===0?'transition-from':i===frames.length-1?'transition-to':'transition-between'}${sequence && i>0?' transition-action-layer':''}${binding?' transition-paper-frame':''}`;
   return `<figure class="${classes}" data-sequence-frame="${i}" data-frame-caption="${esc(frame.caption)}" data-wipe="${frame.wipe ?? 'left'}"${mobile?' data-mobile-portrait="true"':''} style="--frame-focus:${frame.focus ?? 'center'}">${binding?bindingMarkup:picture(frame.asset,sequence?frame.caption:'',{mobile})}${sequence && !binding?`<figcaption class="transition-still-caption">${esc(frame.caption)}</figcaption>`:''}</figure>`;
 }).join('');
 return `<div class="transition transition--${kind}${sequence?' transition--sequence':''}" data-transition="${index}" data-kind="${kind}" data-label="${esc(label)}"${sequence?` data-sequence="${frames.length}"`:''} aria-label="${esc(label)}"><div class="transition-sticky"><div class="transition-stage"${sequence?'':' aria-hidden="true"'}>${frameMarkup}<span class="transition-edge" aria-hidden="true"></span>${kind==='dawn'?'<div class="window-anchor" aria-hidden="true"></div>':''}</div><div class="transition-caption"><span class="tiny-line"></span><p data-transition-caption>${esc(sequence?frames[0].caption:label)}</p><span class="tiny-line"></span></div></div></div>`;
}

function hero(c: Chapter): string {
 return `${start(c,'chapter--opening')}<div class="hero"><div class="hero-art">${picture('hero','A warm lamp, a blank handout and a silver-haired traveller in a small night-train compartment.',{mobile:'hero-mobile',eager:true})}</div><div class="hero-content"><h1>BERTH</h1><p class="hero-subtitle">One night.<br><em>Ten quiet moments.</em></p><a class="begin-link" href="#begin-story"><span class="circle-arrow">${down}</span><span>Begin this night</span></a></div><div class="hero-bottom"><span>A fictional night-train story.</span><span class="hero-hours"><time>20:48</time><span></span><time>06:37</time></span></div></div><div id="begin-story" class="intro wrapper"><div class="intro-title">${heading(c)}<p class="chapter-deck">${esc(c.subtitle)}</p></div><div class="intro-prose prose">${paras(c)}<div class="opening-fragment"><span class="manuscript-title">${esc(HANDOUT_TITLE)}</span><span class="blank-line"><span>Opening</span><span></span></span></div></div></div></section>`;
}
function shared(c: Chapter): string {
 return `${start(c,'chapter--shared wrapper')}<div class="split-layout"><div class="reading-column">${heading(c)}${quote(c)}<div class="prose">${paras(c)}</div></div><figure class="scene scene--portrait-crop">${picture('shared-light',c.imageAlt)}<figcaption>Only the shade moves. The lamp stays where it is.</figcaption></figure></div></section>`;
}
function table(c: Chapter): string {
 return `${start(c,'chapter--table wrapper')}<div class="table-heading">${heading(c)}<p class="chapter-deck">She has prepared twelve pages.<br>Only the first sentence is missing.</p></div><div class="desk-layout"><div class="desk-scene" data-lamp-view data-mode="soft"><figure class="scene">${picture('table','An orange-red wire paper clip holds twelve blank pages beneath the brass reading lamp. Ning’s hand rests at the table edge.')}<div class="lamp-shade-overlay" aria-hidden="true"></div><div class="lamp-pool" aria-hidden="true"></div><div class="lamp-reflection" aria-hidden="true"></div><div class="lamp-sleeve" aria-hidden="true"></div></figure><div class="handout-detail"><span class="paper-detail-label">From her handout</span><h3>${esc(HANDOUT_TITLE)}</h3><p class="handout-reminder">${esc(HANDOUT_REMINDER)}</p><div class="crossed-lines">${ABANDONED_OPENINGS.map(x=>`<p><s>${esc(x)}</s></p>`).join('')}</div><p class="tentative-line">Good morning<span class="unfinished-dots">…</span></p></div></div><div class="desk-reading"><div class="prose">${paras(c)}</div><fieldset class="lamp-controls"><legend>Observe different lighting</legend><div class="segmented">${['reading','soft','off'].map((v,i)=>`<button type="button" data-lamp="${v}" aria-pressed="${v==='soft'}">${['Reading','Soft','Off'][i]}</button>`).join('')}</div><p>The light on this table is yours to compare. Beyond it, the night keeps its own light.</p><span id="lamp-status" class="sr-only" role="status"></span></fieldset></div></div></section>`;
}
function corridor(c: Chapter): string {
 return `${start(c,'chapter--corridor wrapper')}<div class="passage-heading">${heading(c)}</div><div class="passage-layout"><figure class="scene">${picture('corridor','Ning holds a cup of water in the narrow corridor. A small station passes outside the left window; her compartment’s warm doorway is on the right.')}<figcaption>A platform. A few waiting people. Another evening going on.</figcaption></figure><div class="reading-column">${quote(c)}<div class="prose">${paras(c)}</div></div></div></section>`;
}
function talk(c: Chapter): string {
 return `${start(c,'chapter--talk')}<div class="talk-title wrapper">${heading(c)}<p class="chapter-deck">One first day. <br>Another kind of first day.</p></div><figure class="scene talk-scene">${picture('night-talk',c.imageAlt,{mobile:'night-talk-mobile'})}<figcaption>Two cards from the canvas bag. One for each of them.</figcaption></figure><div class="talk-reading wrapper"><div class="prose">${paras(c)}</div><div class="talk-quote">${quote(c)}<details class="aside"><summary>A small coincidence ${arrow}</summary><p>One is about to stand in front of a class for the first time. The other no longer has to hurry to one.</p></details></div></div></section>`;
}
function sleep(c: Chapter): string {
 return `${start(c,'chapter--sleep wrapper')}<div class="sleep-heading">${heading(c)}<p class="chapter-deck">Nothing more needs to be said tonight.</p></div><figure class="scene sleep-scene">${picture('sleep',c.imageAlt)}<figcaption>Her pages and her card upstairs. Ms. Lin’s card and glasses below.</figcaption></figure><div class="sleep-reading prose">${paras(c)}</div></section>`;
}
function write(c: Chapter): string {
 return `${start(c,'chapter--write wrapper')}<div class="writing-layout"><div class="writing-story">${heading(c)}<figure class="scene pillow-scene">${picture('pillow','A blank card and the clipped handout beside Ning’s upper-berth pillow, in the quiet blue light of the sleeping compartment.')}</figure><div class="prose">${paras(c)}</div></div><div class="writing-work"><form id="opening-form" class="writing-paper"><span class="paper-detail-label">The card beside her pillow</span><h3>A first line<br>for the morning.</h3><label for="opening-input">What could Shen Ning say?</label><textarea id="opening-input" rows="3" maxlength="240" spellcheck="true" aria-describedby="opening-help opening-count save-status">${esc(DEFAULT_OPENING)}</textarea><div class="writing-meta"><span id="opening-help">A short beginning is enough.</span><span id="opening-count">${Array.from(DEFAULT_OPENING).length} / 120</span></div><button type="submit" class="keep-button"><span>Keep this line</span>${arrow}</button><p id="save-status" class="save-status" role="status" aria-live="polite">Kept only in this browser. Never sent anywhere.</p></form><div class="suggestions"><p>Or borrow a beginning</p>${OPENING_OPTIONS.map((text,i)=>`<button type="button" data-preset="${i}" aria-pressed="${i===0}"><span class="preset-mark"></span><span>${esc(text)}</span></button>`).join('')}</div><div class="editing-actions"><button type="button" id="undo-line" disabled>Undo</button><button type="button" data-reset-line>Restore the simple greeting</button></div></div></div></section>`;
}
function dawn(c: Chapter): string {
 return `${start(c,'chapter--dawn')}<div class="dawn-heading wrapper">${heading(c)}<p class="chapter-deck">The same room, <br>seen by another light.</p></div><figure class="scene dawn-scene">${picture('dawn','Dawn enters the same compartment. Ning’s clipped pages and her card are still on the upper berth; Ms. Lin’s glasses and face-down card remain on the table.',{mobile:'dawn-mobile'})}<figcaption>05:38 — Before either of them has moved her things.</figcaption></figure><div class="dawn-reading wrapper"><div class="prose"><p data-beat="1">${esc(c.paragraphs[0])}</p></div><div class="arrival-note"><span class="note-owner">A note from Ms. Lin</span><blockquote><p>“${esc(LIN_NOTE)}”</p></blockquote></div><figure class="scene morning-note-scene">${picture('morning-note','After Ning brings her pages and card down the ladder, Ms. Lin offers the separate card she wrote during the night. Her glasses rest on the table.')}<figcaption>Only after Ning comes down do the two cards meet.</figcaption></figure><div class="prose morning-note-copy"><p data-beat="2">${esc(c.paragraphs[1])}</p></div></div></section>`;
}
function packing(c: Chapter): string {
 return `${start(c,'chapter--packing wrapper')}<div class="packing-heading">${heading(c)}<p class="chapter-deck">A small thing to take into the day.</p></div><div class="keepsake-layout">${cards('packing')}<div class="prose"><p data-beat="1">${esc(c.paragraphs[0])}</p></div></div><div class="packing-scene-layout"><figure class="scene">${picture('packing','Ms. Lin and Ning gather their separate bags in the morning compartment. The two cards and manuscript are packed in Ning’s canvas bag.')}</figure><div class="prose"><p data-beat="2">${esc(c.paragraphs[1])}</p>${quote(c)}</div></div></section>`;
}
function ending(c: Chapter): string {
 return `${start(c,'chapter--ending')}<div class="ending-scene"><div class="ending-art">${picture('empty','The compartment in daylight, from the original doorway. Both travellers and their belongings are gone; only the fixed lamp remains on the clear table.',{mobile:'empty-mobile'})}</div><div class="ending-title">${heading(c)}<p class="chapter-deck">The room is empty.<br>The words have gone with her.</p></div></div><div class="ending-reading wrapper"><div class="prose">${paras(c)}</div><p class="closing-line">${esc(CLOSING_LINE)}</p></div><div class="last-notes wrapper"><details class="kept-notes" open><summary><span>The cards she took with her</span>${down}</summary>${cards('ending')}</details><p id="copy-status" class="copy-status" role="status" aria-live="polite"></p><textarea id="copy-fallback" class="copy-fallback" aria-label="Select your first line to copy it manually" readonly hidden></textarea><div class="final-reset"><button type="button" data-reset-line>Restore the simple greeting</button></div><nav class="revisit" aria-label="Revisit the journey"><a href="#ch-05"><span>23:06</span>Return to the night conversation ${arrow}</a><a href="#ch-08"><span>05:38</span>Return to first light ${arrow}</a><a href="#ch-01"><span>20:48</span>Read from the beginning ${arrow}</a></nav></div></section>`;
}
export function renderStory(): string {
 const renderers=[hero,shared,table,corridor,talk,sleep,write,dawn,packing,ending];
 return `<a class="skip-link" href="#begin-story">Skip to the story</a><header class="site-header"><a href="#ch-01" class="wordmark" aria-label="BERTH — return to the beginning">BERTH<span class="wordmark-dot"></span></a><div class="header-controls"><a class="collection-return" href="${import.meta.env.BASE_URL}#world-berth" aria-label="Return to Collection" title="Return to Collection"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7"/></svg><span>Collection</span></a><button type="button" id="sound-toggle" aria-pressed="false">Sound off</button><button type="button" id="motion-toggle" aria-pressed="true">Pause motion</button><details id="chapter-menu" class="chapter-menu"><summary id="chapter-menu-button"><span>Chapters</span><span id="chapter-count" aria-hidden="true">01 / 10</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 6h14M3 13h14"/></svg></summary><nav aria-label="Chapters" data-lenis-prevent><p class="menu-title">This one night</p>${chapters.map(c=>`<a href="#${c.id}" data-nav-chapter="${c.number}"><span class="menu-number">${String(c.number).padStart(2,'0')}</span><span>${esc(c.shortTitle)}</span><time>${c.time}</time></a>`).join('')}<p class="menu-note">Move at your own pace.</p></nav></details></div></header><main>${chapters.map((c,i)=>renderers[i](c)+(i<9?transition(i+1):'')).join('')}</main><footer class="site-footer wrapper"><a class="footer-brand" href="#ch-01">BERTH</a><p>An original, fictional night-train story.<br>Made to be read at your own pace.</p><span>One night. Ten quiet moments.</span></footer><div class="reading-progress" aria-hidden="true"><span></span></div>`;
}
