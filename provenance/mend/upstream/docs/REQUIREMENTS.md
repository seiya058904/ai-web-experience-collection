# MEND — Requirements and Evidence Ledger

This ledger distinguishes implemented requirements from verified behavior. **Browser unverified** means no rendered acceptance is claimed, even when a source or unit check passed. The delivery's actual checks, results, fixes, and limits are recorded separately in [ACCEPTANCE.md](ACCEPTANCE.md).

## Ten effective chapters

Every chapter needs its own purpose, two substantive beats, a stable readable composition, an outgoing anchor, and an equivalent mobile expression. Navigation, loading screens, empty transitions, and repeated images with different headings do not count as extra chapters.

| ID | Purpose and two required beats | Observable evidence | Verification |
| --- | --- | --- | --- |
| CH-01 | Meet Pip; read Lan's request to preserve the sun | Finished arrival art, readable request, one optional gentle-pull catch, usable first scroll and return | Initial fallback observed; final framing unverified |
| CH-02 | Identify the catching wheel; distinguish the chipped ear and worn paint from the fault | Three accurate accessible inspection controls; annotations do not change damage or disturb reading layout | Implemented; browser unverified |
| CH-03 | Find the underside sun; find exactly three marks from moves between homes | Same Pip, supported underside, fixed sun position, exactly three marks and explanatory text | Implemented; browser unverified |
| CH-04 | Show the inward-tilted wheel rubbing; show the body and other three wheels can remain | Controlled obstruction/clearance states with a small structural explanation | Implemented; browser unverified |
| CH-05 | Compare the two repair relationships; choose and preview a plan | Native A/B controls, explicit default A, no score or price, changeable preview and feedback | Implemented; browser unverified |
| CH-06 | Seat the selected new part; examine new and retained material together | Branch-specific component view; A has no removed wheel; B keeps its original wheel alongside | Implemented; browser unverified |
| CH-07 | Review the original catch; complete the same short path after repair | User-controlled start, before, and reset; position-linked wheel rotation and truthful result text | Implemented; browser unverified |
| CH-08 | Compare before/after in one registered pose; identify the retained ear, paint, and sun | Keyboard-operable comparison; chosen plan preserved; B's new wheel correctly described | Implemented; browser unverified |
| CH-09 | Move from the work mat into light; extend the cord toward the next owner | Full-table composition with grounded Pip, traceable route, and scroll-derived reversible progress | Implemented; browser unverified |
| CH-10 | Reveal Lan painted the sun; hand the string to He | Complete return composition, letter, branch-accurate props and record, working review/change links | Implemented; browser unverified |

## All nine adjacent handovers

For each boundary, inspect local progress **0%, 25%, 50%, 75%, and 100%**, the edges on either side, and continuous forward/reverse movement. Still frames and motion observations are separate evidence. Keep a table, a recognizable subject, and its contact relationship visible throughout.

| ID | Anchor | Critical intermediate condition | Verification |
| --- | --- | --- | --- |
| TR-01-02 | Red cord and right rear wheel | Request moves outward while the whole toy remains traceable; inspection points arrive on the correct parts | Progress math tested; visual/motion unverified |
| TR-02-03 | Belly edge | Support meets the toy before the body tilts and the sun appears; no unsupported float or arbitrary morph | Progress math tested; visual/motion unverified |
| TR-03-04 | Rear axle beside the sun | Sun, rear wheel, and real support are visible together; occlusion can conceal only a physically plausible seam | Progress math tested; visual/motion unverified |
| TR-04-05 | Right rear wheel center | Two alternative part previews appear in parallel; a single wheel does not turn into two mounted wheels | Progress math tested; visual/motion unverified |
| TR-05-06 | Selected component | Unselected preview leaves; selected part approaches along the axle; correct original-part position remains | Progress math tested; visual/motion unverified |
| TR-06-07 | Wheel rim and contact line | Trial path and full body become clear before any user-triggered motion begins | Progress math tested; visual/motion unverified |
| TR-07-08 | Current trial silhouette | Local playback freezes at its current pose and settles continuously into comparison | Progress math tested; visual/motion unverified |
| TR-08-09 | Repaired Pip and the sun-bearing body face | Before reference withdraws while the environment expands around the same repaired toy | Progress math tested; visual/motion unverified |
| TR-09-10 | Cord endpoint | Pip remains visible while the endpoint, branch-specific props, letter, and card establish the return | Progress math tested; visual/motion unverified |

## Hero's six states

| State | Acceptance condition | Verification |
| --- | --- | --- |
| First view | Finished desktop/mobile composition, real title, recognizable Pip; no gray-model opening | Implemented; browser unverified |
| Reveal | Wheel fault and Lan's request become readable; scrolling can interrupt at any time | Implemented; browser unverified |
| Full composition | Four-wheel structure, ear, cord, and request coexist without covering essential text or toy features | Implemented; browser unverified |
| Hold | Adequate reading time; no automatic repeated tug or living-animal acting | Implemented; browser unverified |
| First scroll | Cord and wheel lead into inspection; no lock, forced replay, or long lag | Implemented; browser unverified |
| Return | Arrival composition restored without deleting the repair choice or replaying an opening sequence | Implemented; browser unverified |

## Repair and interaction invariants

| ID | Required behavior | Verification |
| --- | --- | --- |
| ST-01 | `repairPlan`, story progress, inspection focus, and trial progress remain independent | State tests passed; browser integration unverified |
| ST-02 | A is a disclosed example until chosen; a visitor can reach the ending without selecting anything | State tests passed; browser integration unverified |
| ST-03 | A keeps the original rear wheel, adds the sleeve, and never produces a removed-wheel bag | State tests passed; browser integration unverified |
| ST-04 | B mounts a new wheel and returns exactly one original wheel; the final record matches | State tests passed; browser integration unverified |
| ST-05 | A changed plan updates CH-06–10 and clears old trial playback/result; reselecting the same plan preserves its state | State tests passed; browser integration unverified |
| ST-06 | Early chapters show the earlier damaged state without deleting a saved later choice | State tests passed; browser integration unverified |
| ST-07 | Trials start only on explicit action; before stops at the obstruction and repaired can reach the endpoint | State tests passed; browser integration unverified |
| ST-08 | Leaving the trial or hiding the page pauses at the current position; return does not consume hidden time | State tests passed; browser integration unverified |
| ST-09 | The final record never claims a user trial was completed when it was not run | State tests passed; browser integration unverified |
| ST-10 | Storage failure or invalid saved data leaves a complete usable visit; only validated choice data is restored | State tests passed; browser integration unverified |
| ST-11 | Late resource completion cannot replace a newer target chapter or repair branch | Source guard reviewed; runtime stress unverified |
| ST-12 | Repeated plan changes and navigation do not accumulate duplicate models or event handlers | Source guard reviewed; runtime stress unverified |

## Language and access

| ID | Required behavior | Verification |
| --- | --- | --- |
| AX-01 | Authored titles, narration, controls, alternative text, labels, errors, metadata, and fixed exported wording are English | Source inspected; browser/assistive technology unverified |
| AX-02 | The document declares `lang="en"`; unknown user-input language is not guessed | Source inspected; browser/assistive technology unverified |
| AX-03 | Names remain Pip, Lan, and He across all chapters and records | Source inspected; browser/assistive technology unverified |
| AX-04 | Necessary meaning is available in DOM text and semantic controls, including any Canvas/3D result | Source inspected; browser/assistive technology unverified |
| AX-05 | Keyboard can operate inspection, choices, trial, comparison, and chapter navigation; focus remains visible | Source inspected; browser/assistive technology unverified |
| AX-06 | Menus/dialogs close from the keyboard and restore reasonable focus; hidden layers cannot intercept input or focus | Source inspected; browser/assistive technology unverified |
| AX-07 | Reduced motion works on load and when the preference changes, preserving all chapters and choice outcomes | Source inspected; browser/assistive technology unverified |
| AX-08 | Mobile uses large targets and equivalent readable compositions; no tiny-hotspot-only interaction | Source inspected; browser/assistive technology unverified |
| AX-09 | Optional audio, if present, starts off and is user-controlled; silent use communicates every result | No audio; all meaning has a silent representation |

## Visual and resource gates

| ID | Required evidence | Verification |
| --- | --- | --- |
| AR-01 | Eight distinct accepted generation roles: H-A-v2, H-B, H-C, H-D, H-M, K-06, K-09, T-03-04 | Complete: eight required roles plus three auxiliary sources |
| AR-02 | Actual generation prompts/tool/files and adoption reasons recorded, with no invented seed | Actual logs included; seed not supplied by tool |
| AR-03 | Final Hero, repair close-up, long road, and difficult midpoint compared with their generated references | Final rendered fidelity unverified |
| AR-04 | Four mounted wheels, two axles, fixed chipped ear, fixed underside sun, and exactly three move marks | Source art and geometry inspected; browser unverified |
| AR-05 | A/B part appearance, returned-wheel presence, and repair-card text agree throughout | State/source checked; full rendered branches unverified |
| AR-06 | First meaningful visual, complete Hero, and interactivity timings measured separately under stated conditions | Unverified; no timing or FPS claims |
| AR-07 | Critical Hero assets are prioritized; distant chapter assets do not all compete at startup | Preload and neighbor-loading source inspected |
| AR-08 | Image/font/model failure or missing WebGL preserves target-specific content and usable controls | Initial no-WebGL fallback observed; other cases unverified |
| AR-09 | No full-black boundary, unrelated old fallback scene, or two transparent whole-toy silhouettes | No full browser transition run; unverified |
| AR-10 | Weakest two chapters and weakest handover identified from observed results, refined, and checked again | Source-based corrections made; visual ranking blocked |

## Technical and browser matrix

| Area | Actual check to record | Verification |
| --- | --- | --- |
| Lenis | Locked version, stylesheet, one RAF owner, correct anchor navigation, no second smoother or scroll lock | Version/style/RAF source checked; scrolling UX unverified |
| Main path | Start → ending → start using real input at 1440×900 and 390×844 | Unverified: managed preview route unstable |
| Nonlinear path | Direct late-chapter entry, fast jumps, reverse scroll, scrollbar movement, early scroll during reveal, hash refresh/history return | Source implemented; browser unverified |
| Branch race | B → late chapter → A, including a change while assets are loading | State tests/source target guards; network/browser unverified |
| Trial interruption | Mid-walk leave/reverse, background/return, plan change, reset, before/after switch | Pure-state tests passed; real input/background unverified |
| Static transition frames | Nine handovers × five local frames, plus both adjacent boundaries | Coordinates tested; 45 rendered frames unverified |
| Continuous transition motion | Slow/fast movement, forward/reverse; record separately from still-frame checks | Unverified: WebGL unavailable |
| Representative viewports | 320×700, 360×640, 390×844, 768×1024, 1440×900, 1920×1080, 2560×1440, 3840×2160 | Unverified; no simulated viewport pass claimed |
| Breakpoint stress | Actual breakpoint neighbors, short landscape, portrait/landscape changes, safe-area spacing | Responsive source implemented; rendered stress unverified |
| Browser zoom | 125%, 150%, and 200%; headings, controls, ending, and complex transitions remain readable | Unverified |
| Resource recovery | Blocked/slow imagery and fonts, unavailable graphics, delayed target assets, recovery without wrong-state replacement | Initial no-WebGL fallback observed; recovery unverified |
| Lifecycle | Repeated full traversals and resizes, offscreen/background pause, listener/model/resource growth | Source ownership/disposal reviewed; runtime growth unverified |
| Production | TypeScript check, production build, preview, console/network inspection | Build passes; limited initial fallback observation; full preview unverified |
| Archive reproduction | Clean extraction, `npm ci`, build, production preview, local assets, main path, and subpath handling | See evidence/archive-checks.json; browser path remains unverified |

CSS viewport simulation must be labeled as simulation. Do not infer a real phone, a real 4K display, another browser engine, frame rate, or network profile from one successful desktop run.

## Delivery contract

The source archive contains the application, configurations, dependency lockfile, formal resources, production build, README, local launch helpers, art records, source/license notes, requirement ledger, and actual acceptance report. Exclude secrets, personal browser data, `node_modules`, caches, unrelated files, and rejected art that is not needed for the record.

The SHA-256 is reported for the actual final ZIP. Windows launcher execution, clean-install reproduction, browser observations, and physical-device checks must be reported at their real verification level. Required image generation, broken core interaction, missing reproducibility, or ordinary-scroll black flashes cannot be described as a complete pass.

This task authorizes a local source delivery. Deployment, publication, pushes, pull requests, releases, and changes to the existing Collection are outside its scope.
