# FRAME — requirement and evidence ledger

Date: 2026-11-09. Baseline: the supplied `06-frame(1).md` execution brief.

This document is the planning baseline, not a test report. Every implementation and browser claim below starts **planned / unverified**. The delivery report must point to actual evidence and explicitly retain any unverified items. Source research is recorded separately in `sources.md`.

## Scope and identity

Build an original, English-language digital stop-motion experience, with ten substantive chapters and nine adjacent transitions. Boop attempts to push a watermelon-red block into a butter-yellow outline, overshoots, notices, gently pulls back, and settles into restrained satisfaction. The visitor changes real frame spacing and two holds, previews the resulting sequence, and downloads a storyboard PNG plus a self-contained replay HTML file.

The work is digital artwork, not a record of physical clay photography. Do not copy Aardman characters, props, compositions, logos, or supplied reference-page media. Do not deploy, publish, push, create a PR or release, or add the work to an existing Collection without separate authorization. Ordinary implementation decisions can proceed autonomously.

### Identity invariants

| Element | Required invariant | Status |
| --- | --- | --- |
| Boop | Asymmetric mauve soft square; small fold at the upper right; two short arms; two cream feet; two black eyes; shallow mouth; fixed lower-left thumbprint | Planned / unverified |
| Palette | Mint `#AED0C4`; mauve `#9D87B7`; watermelon `#D66B66`; butter `#E4D88B`; text `#403D49` | Planned / unverified |
| Material | Small stable imperfections; soft body and firmer block; no per-frame random texture, changing identity, glossy plastic, or arbitrary flicker | Planned / unverified |
| Light and support | Stable soft upper-left/front illumination; aligned contact shadows; credible feet and hand contact | Planned / unverified |
| Task | Block roughly half the body's height; outline larger than the block footprint; visible margin at final alignment | Planned / unverified |
| Language | `lang="en"`; all authored visible, accessible, fallback, metadata, and exported fixed text in English; user text preserved | Planned / unverified |

## Proposed English editorial system

This is suggested copy for adoption before UI implementation. Once chosen, use the same terms across teaching chapters, editor, premiere, and export.

Brand: **FRAME**. Hero line: **Let stillness breathe.** Character: **Boop**. Prop: **the block**. Destination: **the outline**. Frame terminology: **frame** for a distinct pose, **beat** for a playback slot, **hold** for additional beats displaying the same frame.

Preset names: **Even**, **Slow, then quick**, **Quick, then slow**. Accessible preset descriptions must explain the motion, rather than depend on these labels alone. Holds: **Before the push · Frame 06** and **The second look · Frame 18**. Supporting duration copy: **One extra beat holds the same frame for 1/12 second.** Avoid calling a repeated hold a newly created frame.

Common actions: **Watch Boop try**, **Previous frame**, **Next frame**, **Show previous frame**, **Play**, **Pause**, **Continue**, **Replay**, **Undo**, **Reset rhythm**, **View all 24 frames**, **Back to the editing table**, **Download storyboard**, **Download your film**. Use native buttons and links with visible focus.

## Ten chapters

| ID and proposed title | First meaningful beat | Second meaningful beat | Interaction and stable composition | Required evidence | Status |
| --- | --- | --- | --- | --- | --- |
| CH-01 · Almost alive | “One small block. One place it wants to be.” The entire task is readable before interaction. | “A tiny change is already a decision.” Two adjacent real poses reveal the first acting choice. | Optional short preview; this/next frame; complete Boop, block, and outline; untouched tutorial configuration | Cold Hero, clicked preview, two-frame change, return state; desktop and independently composed portrait | Planned / unverified |
| CH-02 · This frame. The next. | “Look at the feet. Then the hands.” Compare genuine adjacent frames from the same performance. | “The next frame gives this one a direction.” Read them as a brief sequence. | Previous/next; optional low-opacity previous-frame comparison, off by default; two clear image regions; stacked phone comparison | Changed body/limbs/block, matching identity, working onion comparison, keyboard access | Planned / unverified |
| CH-03 · A little space changes everything | “Same start. Same finish.” Establish six frames with equal distance. | “Move the middle, change the feeling.” Compare changing spacing without changing beat rate. | Three real pose variants for frames 07–12; six true position marks and one large preview on phone | Same endpoints/count/timing; different intermediate poses; whole-body/hand/foot/shadow coherence; frame 12→13 raccord | Planned / unverified |
| CH-04 · The art of doing nothing | “A pause gives us time to notice.” A repeated pose gains duration. | “How long should a second look last?” Compare no added hold with the edited hold. | Two separately identified ± controls, each 0–12 beats; truthful timeline markers for frame 06 and frame 18 | Duration changes; repeated frame identity; correct hold positions; no background accumulation | Planned / unverified |
| CH-05 · Before the first push | “First, the eyes arrive.” Read the glance toward the outline. | “Then the body gets ready.” Read the small crouch and planted feet. | Deliberate full-quality close composition; before/ready comparison; hands, feet, fold, and print retained | Identity/material close-up; genuine anticipation; portrait composition retaining foot support | Planned / unverified |
| CH-06 · Give it a little weight | “Touch comes first.” Hand establishes contact. | “The body yields. The block follows.” Soft and firm materials respond differently. | Just touching/pushing pose sequence; hand/block/ground together; small whole-scene context on phone | No hand penetration, unexplained sliding, late shadows, or prop teleportation | Planned / unverified |
| CH-07 · Keep the almost | “A little too far.” Overshoot and outline remain visible. | “That second look makes it Boop.” See hesitation and careful correction. | Original/without-second-look comparison; frame stepping; overshoot, glance, and correction readable in silence | Actual sequence difference; correct comparison label; visible contact during pullback; no reset of saved rhythm | Planned / unverified |
| CH-08 · Find your rhythm | “Choose the space between.” Apply a real spacing preset. | “Leave a little time.” Apply two holds and preview their combined result. | One large preview; three presets; two ± holds; step/play/reset/undo; expandable 24-frame sequence; selected frame handed onward | All controls work; edit-during-play pauses validly; undo/reset restore frames and duration; keyboard/touch; portrait control flow | Planned / unverified |
| CH-09 · A very small premiere | “Your rhythm. Boop's small adventure.” Watch the exact current sequence. | “There. Just right.” Finish with aligned block and restrained satisfaction. | Active play/continue/replay and step controls; quiet wide scene; selected frame preserved on entrance; independent portrait framing | Start/end/duration/current preset match editor; ends on 24; leaves and background pause; return does not autoplay | Planned / unverified |
| CH-10 · A little film, to keep | “A few frames, arranged your way.” Review current keyframes and holds. | “Take this little moment with you.” Download a truthful playable artifact. | Current-version storyboard and settings; PNG and embedded-frame HTML; return to editor; quiet Boop beside completed task | Decode PNG; open exported HTML independently/offline; verify current pose variant, holds, final alignment, and accessible controls; failure/retry | Planned / unverified |

Each chapter requires an entrance, two substantive beats, a stable composition, an exit, and equivalent phone content. A footer, transition-only region, or repeated image with a new heading does not count.

## Hero six-state ledger

| State | Required result | Evidence target | Status |
| --- | --- | --- | --- |
| First view | Real title and polished task scene visible without waiting for all chapters | Cold desktop/phone/wide screenshot | Planned / unverified |
| Reveal | Optional preview clarifies eyes and hands; no click is required to understand or scroll | Clicked preview plus early scroll | Planned / unverified |
| Complete composition | Boop, block, feet, hands, and outline remain clear and uncropped | Representative widths and short landscape | Planned / unverified |
| Dwell | A deliberate anticipation pose and adjacent-frame comparison; no attention-stealing loop | Still state and selected next frame | Planned / unverified |
| First scroll | Current scene opens into two explicit image regions with trackable prop positions | TR-01-02 progress samples and continuous scroll | Planned / unverified |
| Return | Saved selection survives; no forced replay; any preview can stop immediately on a valid frame | Bottom→top and navigation return | Planned / unverified |

## Nine transition ledgers

Progress values below are local to each boundary. The user may enter at any percentage, scroll backward, jump chapters, or receive resources late. State must be computed from present progress and explicit selection, not depend on earlier events having fired.

| Boundary and anchor | 0% | 25% | 50% | 75% | 100% | Principal risk / phone rule | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TR-01-02 · Current frame | Hero task | Scene boundary appears | Current and next occupy separate complete regions | Comparison copy arrives | Two-frame observation | Phone expands vertically; duplication only within explicitly framed comparisons | Planned / unverified |
| TR-02-03 · Block center | Two frames | Two block centers identified | Six push positions share a reading axis | Presets arrive | Six-position relationship | Real coordinates; one large phone preview, not six tiny thumbnails | Planned / unverified |
| TR-03-04 · Timeline location | Push frame 12 | Preview becomes numbered strip | Explicit selection moves backward to frame 06; 12 remains marked | Hold 06 and entry to hold 18 arrive | Anticipation hold view | This is an observation jump, not continuous reverse action; never edit hold 12 by mistake | Planned / unverified |
| TR-04-05 · Glance and frame 06 | Current hold view | Select 06 while preserving both hold values | Ready pose enlarges with position reminder | Strip recedes | Finished anticipation still | Feet stay visible; no different-face substitute while loading | Planned / unverified |
| TR-05-06 · Weight and hand contact | Anticipation | Attention follows arm | Hand, block, ground visible together | Contact sequence becomes focus | Stable push detail | Match actual contact point and light; less phone camera travel | Planned / unverified |
| TR-06-07 · Block direction | Contact detail | Pull out enough to show outline | Visible overshoot with supported Boop | Looking back becomes focus | Error/correction composition | No block crossing through outline solely because the camera changes | Planned / unverified |
| TR-07-08 · Looking-back frame | Looking-back still | Same pose becomes selected editor frame | Other essential poses and timing appear | Simple controls enter | Usable editing table | Keep large phone preview first; all controls refer to current configuration | Planned / unverified |
| TR-08-09 · Selected frame | Editing table | Surrounding markers retreat | Same selected frame expands into premiere | Essential player controls remain | Stable premiere, awaiting play | Highest-risk prototype; no exposure, view, position, edge, or identity jump | Planned / unverified |
| TR-09-10 · Final frame and outline | Aligned ending | Ending shifts beside task | Current storyboard and settings enter | Download controls arrive | Full local-result ending | Phone stacks naturally; export uses actual current configuration | Planned / unverified |

For every boundary collect 0/25/50/75/100% evidence, both sides of limits, and continuous slow/fast forward/reverse observation. Static samples alone do not establish motion quality. Only one layer owns an unframed character identity in the intermediate state; do not hide missing transitions with black frames.

## Deterministic animation contract

| Rule | Acceptance check | Status |
| --- | --- | --- |
| Exactly 24 distinct story frames | Frames 01–06 anticipation, 07–12 push, 13–16 overshoot, 17–20 glance/correction, 21–24 settle | Planned / unverified |
| Exactly 12 playback beats per second | Player time indexes a deterministic beat table; DOM and scrolling retain ordinary refresh | Planned / unverified |
| Base sequence is 36 beats | Every frame once, plus 6 extra opening beats and 6 extra closing beats; base duration 3 s | Planned / unverified |
| Two optional holds | 0–12 additional beats at 06 and 18 independently; length `36 + hold06 + hold18`; duration `length / 12`; range 3–5 s | Planned / unverified |
| Three real spacing presets | Same 07 and 12 endpoints and six-frame count; changed complete intermediate poses; non-push phases unchanged | Planned / unverified |
| Complete contact-aware frames | Arms, feet, shadow and prop updated together; no sliding a body bitmap while leaving its limbs behind | Planned / unverified |
| One source of truth | Editor, stepper, playback, summary, PNG, HTML all consume the same normalized configuration and timeline | Planned / unverified |
| Separate narrative/playback state | Scrolling selects chapter/camera only; user input edits configuration; player selects beat/frame | Planned / unverified |
| Edit during play | Pause immediately on valid frame before accepting new configuration; explicit continue or replay | Planned / unverified |
| Lifecycle | Pause when out of premiere/editor region and on hidden document; background return never catches up elapsed hidden time | Planned / unverified |
| Resource race handling | Late B after A→B→C may cache but may not replace C; matching chapter fallback remains visible | Planned / unverified |

## Eight actual image deliverables

| ID | Distinct purpose | Required record | Status |
| --- | --- | --- | --- |
| IMG-01 | Hero A, character-eye-level three-quarter task | Actual file, real tool, prompt, choice rationale | Planned / unverified |
| IMG-02 | Hero B, overhead worktable and three pose references | Actual file, real tool, prompt, choice rationale | Planned / unverified |
| IMG-03 | Hero C, hesitant close-up with visible motivation | Actual file, real tool, prompt, choice rationale | Planned / unverified |
| IMG-04 | Chosen desktop direction and locked character identity | Actual file, actual adoption/use, comparison screenshot | Planned / unverified |
| IMG-05 | Independently rearranged portrait task | Actual file, actual adoption/use, portrait comparison | Planned / unverified |
| IMG-06 | Chapter 05 anticipation close composition | Actual file, actual adoption/use, chapter comparison | Planned / unverified |
| IMG-07 | Chapter 08 overhead timing table | Actual file, actual adoption/use, chapter comparison | Planned / unverified |
| IMG-08 | TR-08-09 midpoint with one coherent selected frame | Actual file, actual adoption/use, transition comparison | Planned / unverified |

Generate before production scene/layout work or long modeling. Do not count prompt text, one asset in two roles, a downloaded photo, or a low-resolution contact sheet as eight individual results. Animation frames must come from a controlled unified character production route, not 24 unrelated random generations. If generation is unavailable, retain the blocker explicitly and continue independent work without claiming full compliance.

## Engineering and accessibility gates

| Gate | Required evidence | Status |
| --- | --- | --- |
| Actual Lenis integration | Exact installed dependency, recommended CSS, one RAF owner; coherent narrative progress; natural anchors and scrollbars | Planned / unverified |
| Reduced motion | All ten chapters and controls retained; no forced loops; native scroll or disabled smoothing; preference changes preserve current chapter/configuration | Planned / unverified |
| Layout | Normal-flow explanatory copy; semantic headings; adequate text/contrast; keyboard focus; native controls; no hidden layer intercepting input | Planned / unverified |
| Phone | Distinct scene framing and shortened/recomposed task distance; full target and feet; no horizontal squash/crop substitute | Planned / unverified |
| Local assets | Necessary fonts and final frames bundled; no runtime remote API or cross-origin canvas taint; no expiring asset URLs | Planned / unverified |
| Failure paths | Correct chapter fallback for failed images/model/font; no empty task area; clear export error and retry | Planned / unverified |
| Full paths | Home→end→home; direct late chapter→reverse; anchors, refresh, history return, scrollbar dragging, and scroll during opening preview | Planned / unverified |
| Lifecycle and performance | Cold first meaningful image, complete Hero, interactivity; complex chapter; repeated return trips; listener/resource counts; production build | Planned / unverified |
| Export | PNG decodes with current selected frames and settings; HTML embeds frames/time table and works in a clean offline independent context | Planned / unverified |
| Packaging | Source ZIP extracted into a clean directory; README install/build/preview run; local and subpath resources work | Planned / unverified |

Required full browser paths: 390×844 and 1440×900. Additional representative checks: 320×700, 360×640, 768×1024, 1920×1080, 2560×1440, 3840×2160, breakpoints, and short landscape. Check 125%, 150%, and 200% zoom. Record browser/version, CSS viewport, DPR, available device information, and any throttling. Simulated viewport checks are not physical-device claims. Do not invent Lighthouse scores or measured FPS.

## Evidence discipline and delivery

Keep functional and visual results separate. Build success is not browser acceptance. Browser control success is not character/material acceptance. A concept image is not an implemented screenshot. Tests with transitions disabled cannot establish transition quality.

For every actual defect record location, conditions, reproduction, root cause, fix, and affected-path retest. Refine the two weakest chapters and weakest boundary identified from real inspection. Do not keep polishing without a concrete remaining deficiency.

Deliver the complete source and lockfile, bundled legal assets, README including Windows-friendly commands, Visual Bible, chapter/transition ledger, real image-generation records, source/license notes, real test summary and selected evidence, and ZIP SHA-256. Exclude secrets, browser profiles, `node_modules`, caches, unrelated files, and large failed-generation collections. A final report must distinguish **implemented**, **verified**, **unverified**, and **blocked**. Missing required generation, unreproducible source, broken core editing/export, or normal-scroll black flashes prevent a full-pass claim.
