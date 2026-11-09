# PAS — requirements and evidence plan

Internal planning document. Status: proposed acceptance coverage only. No item below is a completed test, generated asset or verified performance claim.

## Non-negotiable scope

- Ten substantive chapters, two distinct narrative beats each; nine reversible adjacent transitions.
- Eight distinct real AI-generated image results before production scene/layout work: three meaningful Hero viewpoints, a refined desktop frame, a separately composed portrait frame, CH-04 and CH-08 frames, TR-06-07 middle frame. Prompts alone do not satisfy this requirement.
- Every visible built-in string, alternative text, accessible name, loading/error/fallback state, metadata and exported fixed copy is English. Names are **Cen** and **Cheng**.
- Original adult fictional dancers and original choreography. Cen wears rust red; Cheng wears sand grey. Both wear charcoal trousers and are barefoot. Identity follows each dancer after crossing.
- Matte floor, visible floor/background relation, readable support shadows. No proscenium, curtain, audience, theatrical light machinery or environmental spectacle.
- A functional Lenis instance, one authoritative narrative progress value, reversible scene evaluation and real chapter navigation.
- Independent local project with complete runnable source ZIP. No deployment, publishing, push, PR, Release or Collection edit is authorized.

## Highest-risk invariants

| Priority | Invariant | Evidence required | Failure signature |
| --- | --- | --- | --- |
| P0 | Grip before counterweight | CH-03 → CH-04 five transition samples, full bodies plus hand close-up | Outward load while palms merely touch; detached grip; fused fingers |
| P0 | Recover weight before release | CH-04 → CH-05 and CH-08 → CH-09 samples | Hands release while bodies still lean on the connection |
| P0 | Feet planted during support | CH-02 / CH-04 / CH-07 dense pose sampling + visual filmstrip | Floor penetration, hovering, lateral skate, knee inversion |
| P0 | Deterministic pose at arbitrary progress | Forward, reverse and direct-evaluation equality of joint/contact state | onEnter-based missing pose; direct jump differs from slow scroll |
| P0 | Only one owner writes narrative time | Scroll while local playback runs; pause, mode switch, exit, back/forward | DOM and body drift; echo continues in a contact chapter; snapping on exit |
| P0 | Both characters remain anatomically distinct | Crossing and back-contact screenshots at 0/25/50/75/100% | Body interpenetration; sleeve/skin/hand role swap; incorrect depth ordering |
| P0 | Both full bodies survive mobile composition | 390×844 and 320×700, CH-04 / CH-07 / CH-08 | Cropped support foot, second dancer outside the frame, unreadably small pair |
| P0 | Meaningful fallback remains chapter-correct | Missing image, no WebGL/context loss, direct jump to CH-08 | Old chapter image under new heading; blank black scene; inert controls |
| P1 | Unison / Echo changes actual independent movement | Sample same normalized time in both modes; playback and replay | Label-only switch; identical actor phases; second actor never finishes |
| P1 | Both modes share start and end | Compare endpoint pose arrays in both modes | Jump into CH-06; different root positions after echo |
| P1 | Contact-free timing sandbox | Mode switch outside CH-05, fast scroll into/out of CH-05 | Echo phase splits a grip/back contact |
| P1 | Hero opening is interruptible | Cold start, mid-reveal scroll, return to CH-01 | Forced intro, text/pose disagree, replay after return |
| P1 | End pose resembles but differs from opening | CH-01 / CH-10 full-view comparison | Reused same pose; only heading changes; empty end screen |
| P1 | Rebuild/lifecycle is bounded | Repeated resize, reduced-motion changes, several full returns | Accumulating RAF/listeners/materials; offscreen animation persists |

## Chapter-to-evidence map

| Chapter | Beat A | Beat B | Interaction proof | Required body evidence |
| --- | --- | --- | --- | --- |
| CH-01 Between | Cen offers a hand | Cheng notices, then lifts a hand | Pause stillness; direct chapter jump | Both full bodies, fixed feet, hands apart; distinct first/response order |
| CH-02 Ground | Each stands independently | Cen shifts weight and settles | Floor-contact toggle; full overview | Support remains consistent across ankle/knee/torso; both dancers' feet present |
| CH-03 One Palm | Light palm contact forms | Cen changes direction; Cheng's elbow/shoulder respond | Look at the contact; step controls | Two separate palms and fingers, clear directional response beyond wrist |
| CH-04 Counterweight | One-hand grip forms | Small outward lean and recovery | Before/during comparison | Grip, grounded feet, balanced free hands, no stretching proportions |
| CH-05 Unison / Echo | Same independent phrase together | Same phrase with delayed answer | Both modes; play/pause/replay/reset | No contact; same complete phrase; equal start/end pose |
| CH-06 Make Room | Paths approach | Cheng yields; both pass | Actual travelled path toggle | Stable identities after exchanging sides; stepping, no gliding or crossing bodies |
| CH-07 Lower Together | Backs meet after turning | Shared descent and readiness to rise | Reverse observation; steps; pause | Separate back surfaces, planted feet, plausible knee/hip fold, no neck support |
| CH-08 A Complete Phrase | Rise/release/parallel-to-staggered | One waits, other passes and meets hand | Whole-phrase play/pause/exit | New continuous phrase with all four key relations, no hidden cuts or missing feet |
| CH-09 Let Go | Independent support then finger release | Small gesture still receives answer | Watch Cen / Watch Cheng | Hand topology preserved, both visible, focus changes annotation only |
| CH-10 Here, Again | Comparable opening/end stance | Revisit from either attention prompt | Opening/end comparison; links to CH-03/04/05 | Different hands/shoulders; same floor/light/scale; saved time mode retained |

## Transition sampling

Each transition gets five local samples (0%, 25%, 50%, 75%, 100%), both directions, plus just-before/just-after boundary values. A five-frame filmstrip proves sampled poses only; it does not prove temporal continuity. Observe at least one continuous slow pass and one fast/reversed pass through every boundary with motion enabled.

| Transition | Essential order | Visual risk |
| --- | --- | --- |
| TR-01-02 | Hands hold → camera lowers → feet read clearly | Dancer seems to shrink; camera crops feet; first-frame/rig mismatch |
| TR-02-03 | Forearm rises → body view returns → palms approach/contact | Hand appears late; hand belongs to wrong character |
| TR-03-04 | Light touch → grip → full support visible → slight outward lean | Palm-only tensile support; fingers fused; grip breaks during zoom |
| TR-04-05 | Recover → independent stance → release → independent timing controls | Control active while weight is shared; mode changes contact pose |
| TR-05-06 | Common ending → gaze turn → first step → paths meet | Echo unfinished; lingering playback; feet slide |
| TR-06-07 | Passed positions → turn with gap → backs approach → contact → ready low | Identity swaps; hidden interpenetration; backs teleport together |
| TR-07-08 | Low support → coordinated rise → weight recovered → backs release → parallel step | Knees cross; torso collision; release too early |
| TR-08-09 | Phrase settles → hands meet → readable full-body tension → detail view | Different hand asset/skin/sleeve; second body lost |
| TR-09-10 | Release → actual steps apart → reciprocal shoulder/arm gesture → comparable opening frame | Root translation without footsteps; same opening pose reused |

## Functional browser cases

The primary flow is: load PAS → scroll all ten chapters → compare Unison and Echo → watch and exit the complete phrase → reach the ending → revisit a chapter → return to the opening.

1. **Desktop 1440×900 and mobile 390×844 full path:** use actual user scrolling/navigation, not only injected progress. Confirm every chapter's heading, both content beats, view, controls and exit.
2. **Hero:** cold load with immediate meaningful image/title; delayed assets; begin scrolling during reveal; pause micro-motion; long hold; leave and return without forced replay.
3. **Arbitrary navigation:** opening → CH-08 → CH-03 → ending → opening; direct `#ch-08` load; refresh; history back/forward; scrollbar drag; fast reverse scroll.
4. **CH-05:** switch modes repeatedly while idle, playing and paused; inspect actual different actor phases; restart; reset to Unison; move outside chapter and confirm loop stops; revisit and confirm selection is retained.
5. **CH-08:** start user-initiated playback; pause at intermediate pose; exit; confirm scroll is synchronized to visible pose and current chapter; scrolling during playback hands control back immediately.
6. **Keyboard:** Tab order, visible focus, Enter/Space buttons, Escape menu/modal, correct focus restoration, chapter anchors, semantic heading order and accessible names. Hidden views must not retain keyboard focus.
7. **Reduced motion:** system preference and manual selection; no automatic breathing or spatial travel; all ten chapters; real named step changes; both time modes compared with corresponding frames; preferences and current position preserved.
8. **Anomalies:** block/fail a late image; a delayed B response after A→B→C must not replace C; fail fonts; WebGL unavailable/context loss if WebGL is used; background/resume; resize; network recovery.
9. **Geometry/visual checks:** desktop/mobile paired screenshots, content-control-body collision checks, long title, safe areas, no clipped text, fixed UI doesn't cover supports.
10. **Console:** no relevant application error or framework overlay; console observations recorded with browser/version, viewport, DPR and known device/throttling details.

### Additional viewport checks

320×700, 360×640, 768×1024, 1920×1080, 2560×1440, 3840×2160; plus 844×390 short landscape, actual responsive breakpoints on both sides, and browser zoom 125% / 150% / 200%. Check Hero, longest heading, complex contact transition and ending. Simulated viewports are not physical devices. Record unsupported zoom/device checks as unverified.

## Build/package gate

- Locked dependency versions and lockfile; official API verification recorded for Lenis and any rendering dependency actually used.
- Source ZIP includes entry, styles, renderer/shaders, configs, legal distributable formal assets, English README with real commands, concise Visual Bible, image-adoption log, chapter/transition ledger, verification summary and evidence. Seed or unreported image parameters must not be invented.
- Windows launcher/instructions fail visibly and do not assume a private machine path. Explain network is needed for initial dependency install.
- ZIP excludes node_modules, credentials, browser data, unrelated work, transient caches and failed art piles.
- Extract ZIP into a separate directory. Run documented install/build/preview; verify main path and shipped assets/subpath handling against extracted source.
- Compute SHA-256 after final ZIP contents are frozen. Any later change requires a new hash.

## Report vocabulary

Use **implemented**, **verified**, **unverified** and **blocked** as separate statuses. A build pass is not visual approval. A generated pose is not professionally validated biomechanics. A still-frame test is not continuous-transition testing. An image-generation result is not a runtime animation. No full-pass claim if required generation, reproducibility, core interaction or normal-scroll continuity remains broken.
