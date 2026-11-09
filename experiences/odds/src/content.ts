export const chapters = [
  { title: 'A ball, not yet fallen', short: 'The first ball' },
  { title: 'Left. Or right.', short: 'The fork' },
  { title: 'More paths than places.', short: 'Sixteen paths' },
  { title: 'The middle has more ways in.', short: 'The shape of possibility' },
  { title: 'Small samples have character.', short: 'Sixteen at a time' },
  { title: 'A different leaning.', short: 'Change the chance' },
  { title: 'Same rules. Different evenings.', short: 'Three evenings' },
  { title: 'A portrait of 256.', short: 'Every little journey' },
  { title: 'Give chance a set of rules.', short: 'Your apparatus' },
  { title: 'Still worth watching.', short: 'The next ball' },
];

export const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
export const down = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16m-6-6 6 6 6-6"/></svg>';
export const soundIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m11 5-5 4H3v6h3l5 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>';
export const playbar = (section: number) => `<div class="playbar" data-playbar="${section}" hidden>
  <button type="button" data-action="play-toggle" data-section="${section}">Pause</button>
  <button type="button" data-action="play-step" data-section="${section}">One step</button>
  <button type="button" data-action="play-end" data-section="${section}">Show result</button>
  <span class="play-progress"></span>
</div>`;

export function appMarkup(): string {
  return `<header class="site-header">
    <a class="wordmark" href="#chapter-01" aria-label="ODDS, back to the beginning">odds<span class="brand-dot"></span></a>
    <span class="site-note">A playground for chance</span>
    <nav aria-label="Main navigation">
      <a class="collection-return" href="${import.meta.env.BASE_URL}#world-odds" aria-label="Return to Collection" title="Return to Collection"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7"/></svg><span>Collection</span></a>
      <a class="workbench-link" href="#chapter-09">Your apparatus ${arrow}</a>
      <button class="quiet-button" id="sound-toggle" type="button" aria-pressed="false" aria-label="Turn sound on">${soundIcon}<span>Sound off</span></button>
      <button class="quiet-button chapters-button" id="menu-toggle" type="button" aria-haspopup="dialog">Chapters <span class="menu-lines" aria-hidden="true"></span></button>
    </nav>
  </header>
  <main id="story">
    <div class="stage-rail" aria-hidden="true">
      <div class="stage-wrap">
        <div class="stage-caption"><span id="scene-label">Eight choices. Nine places to land.</span><span id="chapter-count">01 / 10</span></div>
        <div class="stage-art" id="stage-art">
          <svg id="scene" viewBox="0 0 1000 900" xmlns="http://www.w3.org/2000/svg"></svg>
          <canvas id="portrait" width="1000" height="900"></canvas>
        </div>
        <div class="stage-foot"><span id="scene-foot">Demonstration sample · 6 balls</span><span class="material-note">A small study in possibility</span></div>
      </div>
    </div>
    <div class="chapters">
      <section class="chapter chapter-hero" id="chapter-01" data-chapter="0" aria-labelledby="title-01">
        <div class="chapter-copy">
          <h1 id="title-01">Every chance<br>leaves a <span class="serif-word">trace.</span></h1>
          <p class="lede">One little ball. Eight little choices.<br>A place it has never been promised.</p>
          <div class="actions"><button class="primary" type="button" data-action="hero-drop" id="hero-drop">Drop the first ball <span class="button-ball" aria-hidden="true"></span></button></div>
          <div class="result-note" id="hero-result">The six balls in the tray are a labelled demonstration. Your first drop starts a separate round.</div>
          ${playbar(0)}
          <div id="hero-path" class="path-readout"></div>
          <a class="continue-link" href="#chapter-02">Follow the possibility ${down}</a>
          <p class="micro model-intro">An ideal probability model, made tangible.<br><a href="#model-notes">How the apparatus works</a></p>
        </div>
      </section>
      <section class="chapter" id="chapter-02" data-chapter="1" aria-labelledby="title-02">
        <div class="chapter-copy">
          <h2 id="title-02">Left.<br>Or right.</h2>
          <p>At this fork, both ways have the same chance. The ball chooses once. The next ball gets a fresh choice.</p>
          <div class="rule-line"><span>Left <strong>50%</strong></span><span>Right <strong>50%</strong></span></div>
          <p class="aside">Three left turns do not make the apparatus owe you a right.</p>
          <div class="sequence-example"><span>An example, not a prediction</span><div class="path-tokens"><b>L</b><b>L</b><b>L</b><b class="unknown">?</b></div></div>
          <button class="primary" type="button" data-action="branch-draw">Watch four fresh choices ${arrow}</button>
          <div id="branch-result" class="result-note"></div>
          <div class="path-tokens" id="branch-path" tabindex="0" role="group" aria-label="Four independent choices. Use left and right arrow keys to inspect."></div>
          <p class="micro">This one-step demonstration stays separate from your main experiment. Arrow keys inspect; they never change a result.</p>
        </div>
      </section>
      <section class="chapter" id="chapter-03" data-chapter="2" aria-labelledby="title-03">
        <div class="chapter-copy">
          <h2 id="title-03">More paths<br>than places.</h2>
          <p>For a moment, take just four forks. There are sixteen ways to choose left or right, but only five places to arrive.</p>
          <p>Choose the middle. Six different journeys share the very same ending.</p>
          <label class="control-label" for="endpoint">Look at an endpoint</label>
          <select id="endpoint"><option value="all">All 16 paths</option>${Array.from({length:5},(_,i)=>`<option value="${i}">Endpoint ${i}${i===2?' — the middle':''}</option>`).join('')}</select>
          <label class="control-label" for="prefix">Or follow the first two choices</label>
          <select id="prefix"><option value="">Any beginning</option><option>LL</option><option>LR</option><option>RL</option><option>RR</option></select>
          <div class="route-list" id="routes-result" aria-live="polite"></div>
          <button class="text-button" type="button" data-action="routes-reset">Show all paths again</button>
          <p class="micro">Exact enumeration · 4 choices · 16 sequences.<br>These are possible routes, not sampled balls.</p>
        </div>
      </section>
      <section class="chapter chapter-theory" id="chapter-04" data-chapter="3" aria-labelledby="title-04">
        <div class="chapter-copy">
          <h2 id="title-04">The middle has<br>more ways in.</h2>
          <p>Give the same idea eight forks. Now 256 direction sequences lead to nine endpoints.</p>
          <p><strong>Seventy</strong> paths reach the middle. Only one reaches either edge. That is the shape of possibility, before a single experiment.</p>
          <div class="equation-note"><span>70 of 256 paths</span><strong>27.34375%</strong><span>chance of the middle, when p = 0.50</span></div>
          <details class="data-details"><summary>See the exact path counts</summary><div id="theory-data"></div></details>
          <details class="model-details" id="model-notes"><summary>What this model means</summary>
            <p>At each level, the program makes an independent left-or-right choice. <em>p</em> is the chance of turning right. Animation shows the chosen result; it is not a calibrated simulation of collisions.</p>
            <p>The number of right turns, K, follows the binomial model when the number of levels and p stay fixed. Theory describes probabilities, not a promised sample.</p>
            <p class="formula">P(K = k) = C(n, k) pᵏ (1 − p)ⁿ⁻ᵏ</p>
            <p>Samples use a saved pseudorandom seed for repeatable playback. They are not hardware randomness, measured data, or predictions of future physical events.</p>
            <p><a href="https://www.itl.nist.gov/div898/handbook/eda/section3/eda366i.htm" target="_blank" rel="noopener noreferrer">NIST: the binomial distribution</a><br><a href="https://online.stat.psu.edu/stat504/Lesson01" target="_blank" rel="noopener noreferrer">Penn State: independent Bernoulli trials</a></p>
          </details>
        </div>
      </section>
      <section class="chapter" id="chapter-05" data-chapter="4" aria-labelledby="title-05">
        <div class="chapter-copy">
          <h2 id="title-05">Small samples<br>have character.</h2>
          <p>Two rounds. Sixteen balls each. Exactly the same rules, and no obligation to look alike.</p>
          <p>The quiet dashed line is the expected count. The orange balls are what this round actually did.</p>
          <div class="legend"><span><i class="observed"></i>Observed balls</span><span><i class="expected"></i>Expected count</span></div>
          <div class="actions"><button class="primary" type="button" data-action="small-new">Try another pair ${arrow}</button><button class="text-button" type="button" data-action="small-undo" id="small-undo" disabled>Undo</button></div>
          <div id="small-result" class="result-note"></div>
          <details class="data-details"><summary>Compare the numbers</summary><div id="small-data"></div></details>
          <p class="aside">The middle expects 4.375 balls out of 16.<br>A real round can only contain whole balls.</p>
        </div>
      </section>
      <section class="chapter" id="chapter-06" data-chapter="5" aria-labelledby="title-06">
        <div class="chapter-copy">
          <h2 id="title-06">A different<br>leaning.</h2>
          <p>What if right were more likely? Change the chance at every fork, then watch a new 64-ball round take shape.</p>
          <p>You are changing the rule, not rewriting the journeys already taken.</p>
          <fieldset class="segmented"><legend>Chance of a right turn · starts a new round</legend><div>${[.25,.5,.75].map(p=>`<button type="button" data-action="bias-run" data-p="${p}" aria-pressed="${p===.5}">${p.toFixed(2)}</button>`).join('')}</div></fieldset>
          <div id="bias-result" class="result-note"></div>
          <button class="text-button" type="button" data-action="bias-undo" id="bias-undo" disabled>Restore the previous round</button>
          <details class="data-details"><summary>Inspect this round</summary><div id="bias-data"></div></details>
          <p class="micro">The next chapter uses a separate, fair teaching comparison at p = 0.50. Your chosen rule stays saved here.</p>
        </div>
      </section>
      <section class="chapter" id="chapter-07" data-chapter="6" aria-labelledby="title-07">
        <div class="chapter-copy">
          <h2 id="title-07">Same rules.<br>Different evenings.</h2>
          <p>Three saved rounds, each with eight fair choices. Add more of each round's own sequence and see what stays, and what changes.</p>
          <fieldset class="segmented"><legend>Balls in each round</legend><div>${[16,64,128].map(N=>`<button type="button" data-action="comparison-size" data-n="${N}" aria-pressed="${N===128}">${N}</button>`).join('')}</div></fieldset>
          <p class="aside">More samples usually steady the shape. The next ball does not have to bring it closer to the dashed line.</p>
          <div id="comparison-result" class="result-note"></div>
          <details class="data-details"><summary>Compare all three rounds</summary><div id="comparison-data"></div></details>
          <a class="continue-link" href="#chapter-08">Stay with the middle evening ${arrow}</a>
        </div>
      </section>
      <section class="chapter chapter-portrait" id="chapter-08" data-chapter="7" aria-labelledby="title-08">
        <div class="chapter-copy">
          <h2 id="title-08">A portrait<br>of <span class="serif-word">256.</span></h2>
          <p>The middle evening, continued. Every ball belongs to that one saved sequence. The other two rounds have stepped aside.</p>
          <p>Pick a ball. Inside the whole is still one small, particular journey.</p>
          <div class="ball-selection"><label for="ball-slot">Endpoint</label><select id="ball-slot"><option value="all">All endpoints</option>${Array.from({length:9},(_,i)=>`<option value="${i}">Endpoint ${i}</option>`).join('')}</select><label for="ball-select">Ball</label><select id="ball-select"></select></div>
          <div class="actions"><button class="secondary" type="button" data-action="ball-previous">Previous ball</button><button class="secondary" type="button" data-action="ball-next">Next ball</button></div>
          <div class="journey-ticket" id="ball-detail"></div>
          <details class="data-details"><summary>See all nine counts</summary><div id="portrait-data"></div></details>
          <p class="micro">256 unique sample IDs. Selecting a ball changes the spotlight, never the data.</p>
        </div>
      </section>
      <section class="chapter chapter-workbench" id="chapter-09" data-chapter="8" aria-labelledby="title-09">
        <div class="chapter-copy">
          <h2 id="title-09">Give chance<br>a set of rules.</h2>
          <p>This is your apparatus now. Pick the rules, run a round, and keep the actual answer.</p>
          <form id="experiment-form">
            <div class="parameter-row"><label for="layers">Choices per ball <span>n</span></label><select id="layers" name="layers"><option value="4">4 choices</option><option value="8" selected>8 choices</option><option value="12">12 choices</option></select></div>
            <div class="parameter-row"><label for="probability">Chance of turning right <span>p</span></label><select id="probability" name="probability"><option value="0.25">0.25</option><option value="0.5" selected>0.50</option><option value="0.75">0.75</option></select></div>
            <div class="parameter-row"><label for="sample-count">Number of balls <span>N</span></label><select id="sample-count" name="sample-count"><option value="16">16 balls</option><option value="64" selected>64 balls</option><option value="256">256 balls</option></select></div>
            <p class="draft-note" id="draft-note">Changes take effect when you run the round.</p>
            <button class="primary" type="submit">Run this round ${arrow}</button>
          </form>
          <div id="personal-result" class="result-note"></div>
          <div class="workbench-actions"><button class="text-button" type="button" data-action="personal-replay">Replay this round</button><button class="text-button" type="button" data-action="personal-new">New round, same rules</button><button class="text-button" type="button" data-action="personal-undo" id="personal-undo" disabled>Restore previous round</button></div>
          ${playbar(8)}
          <button class="secondary download" type="button" data-action="download">Keep this result <span>SVG ${arrow}</span></button>
          <details class="data-details"><summary>Inspect the saved result</summary><div id="personal-data"></div></details>
        </div>
      </section>
      <section class="chapter chapter-ending" id="chapter-10" data-chapter="9" aria-labelledby="title-10">
        <div class="chapter-copy">
          <h2 id="title-10">Still worth<br><span class="serif-word">watching.</span></h2>
          <p class="closing-line">After many journeys, a shape.<br>For the next one, an open question.</p>
          <p>Your whole round is still here. Let one more ball find its place, under exactly the same rules.</p>
          <div id="ending-result" class="result-note"></div>
          <button class="primary" type="button" data-action="personal-next" id="next-ball">Drop the next ball <span class="button-ball" aria-hidden="true"></span></button>
          ${playbar(9)}
          <div id="ending-path" class="path-readout"></div>
          <div class="ending-links"><button class="text-button" type="button" data-action="download">Take this round with you ${arrow}</button><a href="#chapter-09">Back to your apparatus ${arrow}</a><a href="#chapter-01">See the beginning again ${arrow}</a></div>
          <div class="end-note"><span class="wordmark">odds<span class="brand-dot"></span></span><p>Made for another look.<br>All experiments stay in this browser.</p></div>
        </div>
      </section>
    </div>
  </main>
  <div class="bottom-rail"><span id="current-chapter-title">The first ball</span><div class="chapter-dots" aria-label="Chapter navigation">${chapters.map((c,i)=>`<a href="#chapter-${String(i+1).padStart(2,'0')}" aria-label="Chapter ${i+1}: ${c.short}" ${i===0?'aria-current="step"':''}><span></span></a>`).join('')}</div><button id="motion-toggle" type="button" aria-pressed="false">Less motion</button></div>
  <dialog id="chapter-menu" aria-labelledby="menu-title"><div class="menu-head"><h2 id="menu-title">A little way through.</h2><button class="quiet-button" type="button" id="menu-close" aria-label="Close chapter menu">Close <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div><nav aria-label="All ten chapters">${chapters.map((c,i)=>`<a href="#chapter-${String(i+1).padStart(2,'0')}"><span>${String(i+1).padStart(2,'0')}</span>${c.short}${arrow}</a>`).join('')}</nav><p>Take your time. Every chapter is ready when you are.</p></dialog>
  <div id="announcement" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>
  <div id="storage-notice" class="storage-notice" role="status" hidden></div>`;
}
