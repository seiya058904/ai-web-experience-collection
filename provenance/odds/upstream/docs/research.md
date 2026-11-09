# ODDS — primary-source research and implementation decisions

Research date: **9 November 2026 (Asia/Tokyo)**. The sources below were retrieved through web search/open. They are research references, not copied page assets. No external photographs, museum artwork, or source-page text are redistributed as production imagery.

## Probability model

[NIST, Binomial Distribution](https://www.itl.nist.gov/div898/handbook/eda/section3/eda366i.htm) gives the binomial probability mass function for a fixed number of binary trials with a constant success probability, and its mean `np`. For ODDS, “success” means “right”, `n` is the number of forks, and `K` is the number of right turns:

```text
P(K=k) = C(n,k) p^k (1-p)^(n-k),  k=0,...,n
```

[Penn State STAT 504, Introduction to Discrete Data, section 1.3](https://online.stat.psu.edu/stat504/Lesson01) explicitly identifies the binomial as the sum of independent, identically distributed Bernoulli variables. It also distinguishes cases where independence or constant probability fails. Its direct page fetch failed during this research, but its official-domain indexed full-text result exposed the relevant Bernoulli and binomial section. No source from an unrelated domain was substituted.

**Design consequence:** each completed ball has a fixed number of independent ideal choices under one unchanged `p`. Changing `n` or `p` starts a new round. The display must not combine old and new conditions into a single ordinary binomial chart. The path animation does not determine the result, and a physical-looking peg does not imply a measured collision probability.

**Derived exact values:** at `n=4`, there are `2^4=16` direction strings and `C(4,2)=6` routes to the central endpoint. At `n=8`, the coefficients are `1,8,28,56,70,56,28,8,1`, totaling 256. With `p=0.5`, divide these by 256 to obtain probabilities. A 16-ball round's central expected count is `16×70/256=4.375`. An observed count is an integer; an expectation need not be. The coefficients do not prescribe the outcome of a random 256-ball round.

**Unit rule:** chapter 4 may show path multiplicity. Comparisons with a sampled round use observed `counts[k]` against `N×P(K=k)` on a ball-count axis; alternatively both quantities must be proportions. Every axis and exported result must say which representation it uses.

## A visible mechanism, with an original form

[Exploratorium, Marble Machines](https://www.exploratorium.edu/tinkering/projects/marble-machines) describes ball runs with tracks, tubes, funnels, bumpers and a final catch, and frames adjustment and construction as ways to make thinking visible. ODDS adopts that understandable action–observation relationship. It does not copy an exhibit's silhouette, claim museum endorsement, or simulate museum equipment. Research used the page text and available static imagery context; **the embedded video was not viewed**.

## Lenis integration: checked against the available release

`npm view lenis version` returned **1.3.27** during this task. The [official Lenis README](https://github.com/darkroomengineering/lenis) also used 1.3.27 in its CDN examples. This records the retrieved version, not proof of the application's eventual installed version; the package manifest and lockfile are authoritative for the delivered build.

The README recommends `import 'lenis/dist/lenis.css'`. Choose either `autoRaf:true` or a manual loop calling `raf(time)` in milliseconds; do not run both. `autoResize:true` uses `ResizeObserver`; otherwise call `resize()` when dimensions change. Enable anchor support with `anchors:true`, or handle real anchor links with `scrollTo`. Its target may be a pixel value, selector, or element; `immediate` bypasses interpolation, while `lock` prevents scrolling during the move. Leave locking disabled here. `destroy()` removes instance events. The documented `respectReducedMotion:true` default honors the preference live, disables smoothing and makes programmatic navigation instant; this does not automatically remove the application's own motion. The documented GSAP integration uses its ticker and converts seconds to milliseconds. ODDS does not need GSAP if one application RAF already drives both Lenis and the scene.

## Proposed state architecture — project reasoning

This section is an implementation recommendation derived from the brief, not an external library guarantee.

1. Keep mathematical state separate from visual presentation. A round contains `{seed,n,p,N,paths,counts}`. Derive all charts, route labels and SVG exports from the same object.
2. Keep separate state for the fixed Hero example, single-fork demonstration, small-sample pair plus previous pair, bias round plus previous round, three full teaching rounds, portrait selection, and visitor round plus previous round. Hero/ending may show a compact visitor-round summary without overwriting a teaching example.
3. Use one scroll position to evaluate `scene(chapter, localProgress, layout, interactionState, resourceState)`. Do not create rounds in scroll callbacks, render functions, resize handlers, animation completion handlers, or chapter-entry hooks.
4. Compute a complete path before animating it. A pause, skipped animation, background tab, or instant result changes only revealed progress. Counts come from the committed round rather than animation callbacks.
5. Resolve resource results by their target identifier. A late image may enter a cache; it cannot overwrite a different active chapter or reset its data.
6. Measure section bounds on real layout changes, batch the measurement, and render from cached geometry. Rebuild breakpoint-dependent layout without adding another RAF or listener set.
7. On a reduced-motion change, retain the same round, selection and current chapter. Either use Lenis's native reduced-motion behavior or destroy the instance and use native scrolling. Render readable neighboring still states, not missing content. Manual motion preference must also control scene movement.
8. Keep controls in normal document flow and use native buttons, selects, headings and anchors. A graphic can be decorative or an enhancement; sample identities, parameters, counts and selected directions must remain available in DOM text.

## Boundary architecture and highest-risk details

| Boundary | Practical reversible implementation |
| --- | --- |
| 01→02 | Use the same first-node coordinates in full and close-up views. Interpolate one view transform, not independently timed board and route transforms. Preserve the entry ball's ID. |
| 02→03 | Reveal additional edges by a deterministic progress mask; keep four-level geometry and valid route strings precomputed. Endpoint selection is independent of the reveal. |
| 03→04 | Preserve the first four levels as a prefix. Explicitly label “extending from 4 to 8 forks” while additional rows are revealed. Treat the old endpoint row as interior nodes once extension begins; suppress final statistical claims until a valid final structure is displayed. |
| 04→05 | Stage the unit conversion explicitly: path count → probability → expected ball count. Interpolate geometry only within a labelled unit stage; do not label interpolated path heights as ball counts. |
| 05→06 | Reposition existing sample trays into a previous-round summary and reveal the new-condition controls. Scrolling submits nothing. |
| 06→07 | Keep the user's bias round intact; introduce a separate labelled p=0.5 teaching comparison. All three round charts use one common vertical extent. |
| 07→08 | Identify the middle seed once. Both views read the same sample IDs and slot centers. If changing renderers, align coordinates at the seam and give each ball exactly one active owner. Additional balls are a revealed prefix of that seed, never a merge of three rounds. |
| 08→09 | Choose a valid sample by ID, display its actual path, and move the detail into a result slip. Hide no keyboard focus inside a disappearing visual layer. |
| 09→10 | Compact the controls visually while retaining the active parameters and round. Build the ending board from active n so 4 and 12 forks do not collapse into a false nine-slot illustration. |

**Most likely factual failures:** stale exports after appending; random draws on render/resize; seed-prefix changes when N changes; mixing path-count and ball-count axes; per-tray autoscaling; old four-step endpoints left labelled as final endpoints during eight-step expansion; duplicate middle-round balls during renderer overlap; a selected sample ID absent after restoring a different round; invalid saved data treated as trusted state.

**Most likely visual/input failures:** small-screen side slots clipped, long titles entering the board, a pinned visual intercepting controls, controls retained in the tab order after hiding, and delayed image arrival replacing the current scene. These require browser evidence, not only mathematical tests.

## Research limitations and current status

- Primary-source mathematical definitions and current Lenis usage were checked. No live application verification is claimed by this document.
- Version-specific GitHub/raw README URLs were attempted but could not be fetched by the retrieval service. The current official README and the actual npm registry result agreed on 1.3.27; inspect the installed package before relying on an API absent from its types.
- This project does not require physical marble calibration, a numerical physics solver, external runtime APIs, or an account service.
- Browser/device coverage, image-generation completion, build reproducibility and transition quality remain governed by the actual acceptance report.
