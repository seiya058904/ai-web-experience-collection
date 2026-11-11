# PULSE verification plan

> Historical implementation plan. The statuses below describe the time of authorship. See [the delivered acceptance record](acceptance.md) and [evidence index](../evidence/index.md) for actual later browser results, corrections and remaining limits.

Prepared: 2026-11-09. This plan distinguishes tests actually executed from browser work that remains to be performed. It is not a completion certificate.

## Current executable checks

| Check | Command | Observed result |
| --- | --- | --- |
| Story mathematics and ten transition contracts | `node --test tests/story.test.mjs` | PASS: 21 tests, 0 failures on Node v24.22.1 |
| Editorial completeness, meaningful interactions, source references, required anatomy statements | `node --test tests/content.test.mjs` | PASS: 21 tests, 0 failures on Node v24.22.1 |
| English-only source guard | `node scripts/check-locale.mjs` | PASS for the 2 source files present when this plan was created; root index.html did not yet exist |
| Production build, production browser review, extracted ZIP rebuild | Commands and procedures below | NOT TESTED by the author of this plan |

Rerun the locale guard after the complete application is written. A successful scan of two source files does not establish the language of a later rendered interface. The guard recursively checks authored text files in `src/`, `public/`, and root `index.html`, skips dependency/vendor/build trees and symlinks, reports positions for unexpected CJK script characters, and checks `lang="en"` when index.html exists. It is a source guard, not a grammar checker.

The Node test command imports TypeScript directly. Use the tested Node 24 runtime or a compatible runtime with default type stripping. Node 22.18.0 introduced default type stripping in the 22.x line: [official release note](https://nodejs.org/en/blog/release/v22.18.0). Do not promise that the unchanged command runs on Node 22.12 without an additional flag or transpilation.

## Browser flow under test

The flow under test is: a cold landing renders the heart and real English copy; Enter the heart opens Four Chambers; the visitor follows all eleven chapters, changes meaningful anatomical views, crosses ten reversible boundaries, and returns to the opening with the same organ identity and usable controls.

The primary agent will use the Browser plugin first. Use a supported local/private production preview only. If a required capability is unavailable, record the exact capability and the resulting untested case. A DOM-only check is not a substitute for screenshot inspection or continuous-motion review.

## Evidence record format

For each actual run, record:

- Timestamp, browser family and version, operating system if reported, CSS viewport, DPR, and zoom.
- Local production build identifier or package hash, entry URL/hash, motion setting, and whether cache was cold or warm.
- Network throttling or request-failure method, if used; otherwise explicitly say no throttling was applied.
- Input method used: wheel, keyboard, touch emulation, scrollbar, or chapter link.
- Expected state, observed state, PASS/FAIL/BLOCKED/NOT TESTED, and relevant screenshot/recording/log path.
- Defect reproduction, change made, and the affected retest result.

Do not equate a 3840×2160 CSS viewport with a physical 4K display. Do not label phone viewport testing as physical Android/iPhone testing. Browser-specific and assistive-technology coverage must be stated separately.

## Required viewport matrix

| CSS viewport | Required coverage | Status at plan creation |
| --- | --- | --- |
| 1440×900 | Complete 11-chapter/10-boundary path; all controls; forward/reverse; hero states | NOT TESTED |
| 390×844 | Complete 11-chapter/10-boundary path; portrait art; touch targets and touch-emulated controls | NOT TESTED |
| 320×700 | Hero, longest heading, gas-exchange control group, hardest boundary, ending | NOT TESTED |
| 360×640 | Hero and short-height layout; longest copy; menu; ending | NOT TESTED |
| 768×1024 | Tablet rhythm, layout breakpoint, chamber locator, lungs/exchange handoff | NOT TESTED |
| 1920×1080 | Image sharpness, reading measure, hero balance, late chapters | NOT TESTED |
| 2560×1440 | Maximum text measures, retained visual focus, diagrams, ending | NOT TESTED |
| 3840×2160 | CSS-layout scale, image treatment, readable full content and controls | NOT TESTED |
| 844×390 | Short landscape: header, menu, chapter content, interaction panel | NOT TESTED |
| One pixel below/above each actual CSS breakpoint | No dropped controls, jumpy media identities, or horizontal overflow | NOT TESTED |

Test representative desktop browser zoom levels of 125%, 150%, and 200%. Record actual browser zoom rather than calling a narrower viewport a zoom test. At 200%, headings, controls, dialogs, diagrams, and content must remain usable without disabling zoom or hiding overflow.

## Hero: six states and first-boundary prototype

| State | Action | Expected result | Status |
| --- | --- | --- | --- |
| First meaningful frame | Cold load with normal and constrained loading | Real English title and useful anatomical still/fallback; no blank scroll embargo | NOT TESTED |
| Reveal | Observe the initial material/light reveal; scroll immediately during it | Anatomical identity remains fixed; scrolling works throughout | NOT TESTED |
| Full composition | Stop at the initial desktop and portrait views | Title is selectable and readable; entire relevant vessel crown and ventricular contour fit | NOT TESTED |
| Living hold | Leave the opening visible; pause/reduce motion | Only restrained optional movement; labels remain stable; no autoplay audio | NOT TESTED |
| First scroll | Cross TR-01-02, pausing at 25/50/75% | Wall/section registration and anterior orientation persist; captions do not collide | NOT TESTED |
| Return | Return to the beginning after later chapters, three times | The same heart, title position, orientation, and media selection return | NOT TESTED |

Compare the actual desktop and phone screenshots directly with the retained selected image concepts. Inspect framing, silhouette, tissue material, light direction, palette, typography space, and crop boundaries. Record intentional deviations explicitly.

## Chapter content and observations

For every chapter at desktop and 390×844, inspect both content beats, the complete illustration note, source access, incoming/outgoing connection, and the chapter-specific interaction. Do not count the hero, menu, loading state, or transition plate as an extra chapter.

| Chapter | Specific visual/anatomical observation | Status |
| --- | --- | --- |
| CH-01 The Living Form | Recognizable human heart; anatomical right is viewer-left; both beats present | NOT TESTED |
| CH-02 Four Chambers | Four chambers, visible septum, correct right/left and differing ventricular wall structure | NOT TESTED |
| CH-03 The Signal | SA region in right atrium; distinct AV delay and ventricular conduction marks; no signal in lung vessels | NOT TESTED |
| CH-04 The Return | Both venae cavae enter right atrium; tricuspid route reaches right ventricle | NOT TESTED |
| CH-05 One-Way Gates | Correct inlet/outlet families; chordae belong to AV valves; no all-four-in-phase animation | NOT TESTED |
| CH-06 Toward the Lungs | Right ventricle → pulmonary valve → pulmonary arteries → lungs | NOT TESTED |
| CH-07 Exchange | Air/blood compartments separated by a visible barrier; gas directions correct; no blood cells in air | NOT TESTED |
| CH-08 The Way Back | Pulmonary veins → left atrium → mitral → left ventricle; posterior attachment explained | NOT TESTED |
| CH-09 The Stronger Wall | Thick left ventricular muscle; mitral inlet and aortic outlet remain distinct | NOT TESTED |
| CH-10 Around the Body | Aorta/arteries → tissues/capillaries → veins; no direct shortcut or one-beat transit claim | NOT TESTED |
| CH-11 Beat Again | Original heart restored; both circuits and signal remain separate; revisit action works | NOT TESTED |

After viewing the complete set, name the two weakest non-hero chapters and the weakest transition. Improve specific framing, diagram clarity, material, linework, layout, or copy issues; capture before/after evidence and retest affected interactions. Do not substitute a self-awarded aesthetic score for this review.

## Ten-boundary matrix

Use `docs/transition-contracts.md` for the five authored stages and rejection conditions of each boundary. The browser matrix must cover **every** TR-01-02 through TR-10-11:

| Probe | Method | Expected result | Status |
| --- | --- | --- | --- |
| Five stages | Capture actual rendered 0/25/50/75/100% boundary progress | Named anchor, ordered reveal, stable midpoints, and target-owned endpoint | NOT TESTED |
| Threshold neighbors | Inspect immediately before/after enter, quarter changes, midpoint ownership, and exit | No one-frame flash, clipped label, or stale source scene | NOT TESTED |
| Slow forward/reverse | Continuous actual scrolling with brief stops | Same masks and anchor registration in both directions | NOT TESTED |
| Fast jump | Jump across several chapters and return | Target content and artwork agree; no replay requirement | NOT TESTED |
| Direct midpoint | Enter the same measured midpoint without prior playback | Same composed frame as sequential scrolling | NOT TESTED |
| Target image failure | Fail the target raster through supported browser tooling | Complete target-specific SVG/still alternative and real text remain | NOT TESTED |
| Portrait and reduced motion | Repeat at 390×844 and with both motion preference/UI mode | Complete story, understandable staged stills, same interaction results | NOT TESTED |

Capture a short real scroll recording for the high-risk first boundary, valve survey, and pulmonary-artery-to-alveolus change. If recording is unavailable, retain actual observations but mark the recording requirement BLOCKED. A contact sheet alone cannot prove smooth continuous behavior.

## Active controls: expected outcomes

| Control/flow | Required exercise | Expected result | Status |
| --- | --- | --- | --- |
| Enter the heart | Click and keyboard activate | CH-02 is visible and receives predictable focus | NOT TESTED |
| Chapters | Open, choose early/middle/last chapter, reopen, Escape | Correct hash/section, focus handling, no hidden focusable menu contents | NOT TESTED |
| About this experience | Open, inspect sources and notes, close | Real informational content; focus returns to the invoking button | NOT TESTED |
| Orientation | Select both sides then Reset view | Anterior axis unchanged; correct side highlighted and described | NOT TESTED |
| Chamber locator | Select all four chambers and reset | Each unique chamber highlights; source-backed role text changes | NOT TESTED |
| Electrical/Blood/Both | Test CH-03 and CH-11, including keyboard | Distinct overlays and explanatory text; no shared physiological clock | NOT TESTED |
| Trace the return | Select body, cavae, atrium, ventricle, reset | Successive right-heart landmarks and descriptions change | NOT TESTED |
| Valve families | Select AV/outflow, leave chapter, return, reset | Correct pair and role retained; no contradictory state | NOT TESTED |
| Lung branches | Select right, left, both, reset | Correct anatomical branch changes; direction remains away from heart | NOT TESTED |
| Gas direction | Oxygen, carbon dioxide, both, reset | Opposite arrows cross the same barrier; text states each direction | NOT TESTED |
| Two returns | Body/lungs/both, reset | Correct receiving atrium and oxygen description | NOT TESTED |
| Compare walls | Right/left/outflow, reset | Qualitative wall comparison and distinct aortic outlet | NOT TESTED |
| Systemic circuit | Arterial/venous/both, reset | Outward and returning routes change with real meaning | NOT TESTED |
| Motion | Toggle On/Reduced; also test OS preference on first load | Full story persists; optional prolonged motion can stop | NOT TESTED |
| Sound | Initially off; opt in, turn off; background/restore | No autoplay; clear immediate stop; factual illustration note | NOT TESTED |
| Still view/retry | Invoke when offered after a real asset failure | Target remains usable; retry has a real result | NOT TESTED |
| Explore again/back to beginning | Activate from ending | Opening and focus return without stale diagrams | NOT TESTED |

Use touch emulation and keyboard controls in addition to pointer clicks. Verify visible focus, practical touch target sizes, selected state announcements, Space/Enter, Tab/Shift+Tab, and Escape. No essential result may depend only on hover, color, or animation.

## Recovery, navigation, and typography

| Scenario | Probe | Acceptance condition | Status |
| --- | --- | --- | --- |
| Hash and refresh | Load CH-02, CH-07, and CH-11 hashes; reload mid-page | Correct section, artwork and active navigation; no unnecessary journey replay | NOT TESTED |
| History | Chapter jump, Back, Forward | Hash, scroll position and target identity agree | NOT TESTED |
| Input continuity | Wheel, trackpad where available, scrollbar drag, arrows, PageUp/Down, Home/End, touch | Native movement remains available; no forced completion or scroll trap | NOT TESTED |
| Browser find | Find text from a later chapter | Real text is discoverable; correct section remains available | NOT TESTED |
| Resize | Resize at hero, valve view, TR-06-07 midpoint, and ending | Fresh measurements; portrait sources/labels stay correct | NOT TESTED |
| Background restoration | Background the page, restore, continue | No clock burst, stale visual, unwanted sound, or blank chapter | NOT TESTED |
| Slow network | Cold constrained load while moving early to late chapters | Complete text/fallback; no old image beneath a new chapter title | NOT TESTED |
| Failed raster | Block hero, exchange, and late-wall images independently | Appropriate authored fallback; readable recovery state | NOT TESTED |
| Late resources | Let an earlier scene image finish after a later selection | It cannot replace the later scene identity | NOT TESTED |
| Font fail/delay | Use supported interception or disable the local font request | Real fallback metrics remain readable; no destructive layout shift | NOT TESTED |
| WebGL unavailable | Disable if WebGL is used; otherwise verify no dependency | Full chapter text, diagrams and interactions continue | NOT TESTED |
| WebGL loss | Trigger through supported means if a context exists | Same-chapter alternative and preserved reading progress; otherwise document not applicable | NOT TESTED |
| Zoom and narrow text | Actual zoom plus required CSS viewport matrix | No text overlap, clipping, inaccessible fake lettering, or hidden prose | NOT TESTED |
| English-only UI | Extract all visible states plus alt/aria/meta strings, then proofread | Fluent English with no unexpected untranslated or dummy strings | NOT TESTED |

For typography, inspect computed bounds and actual screenshots together. Specifically check the longest Exchange title, multibutton controls, anatomy legends, sources, dialogs, intermediate transition lighting, and portrait header. Do not fix failures by reducing type below readability, removing prose, disabling zoom, or hiding whole-page overflow.

## Performance observations

Measure rather than infer. Record a cold run and a representative warm round trip with the exact browser, viewport, DPR, network conditions, and any unknown hardware limitations. Collect first meaningful art, complete hero, time to useful interaction, LCP/CLS where available, long tasks, and frame pacing during the hardest boundary. Memory observations should compare repeat journeys under the same conditions.

The brief's LCP ≤2.5 s, INP ≤200 ms, and CLS ≤0.1 values are targets. A local trace does not establish field Core Web Vitals, and a screenshot does not establish an FPS claim. Unsupported metrics remain NOT TESTED.

## Production and extracted-package acceptance

1. Run the locked dependency install, Node tests, locale guard, TypeScript check, and production build. Save actual output.
2. Open the production preview through the supported local browser route. Repeat page identity, meaningful content, runtime-console, key controls, first/middle/last chapter, and asset checks.
3. Package complete source, lockfile, final distributable assets, English documentation, actual evidence, and known limitations. Exclude secrets, profiles, dependencies, caches, rejected large art, and private absolute paths.
4. Extract the ZIP into a separate clean directory. Follow its README exactly, install from the lockfile, run checks/build, and start a production preview.
5. Verify extracted first, middle, and last chapters and all packaged media references. Record the ZIP SHA-256 and exact observed command results.

The final H1–H9 ledger must refer to the actual completed run artifacts. Any missing browser capability, required capture, image-generation outcome, or clean rebuild remains BLOCKED/NOT TESTED rather than being converted to PASS by successful unit tests.

## Integration risks to check before the browser run

- `evaluateStory` associates transition index i with chapter measurements i and i+1. Pass all measurements in narrative DOM order; do not derive the zero-based array index from a one-based chapter suffix without subtracting one.
- `chapterId` preserves the provided measurement ID; it may be a slug. Navigation code must use the same identifier scheme. `sourceChapter`/`targetChapter` in transition specs are the canonical CH IDs.
- Long chapter reading sections are native flow. Measure each transition's actual rectangle; do not assume every chapter has the same height or that viewport-height multiples locate a boundary.
- Initial values `all` in CH-01 and CH-02 are valid reset/unselected sentinels. A renderer must provide their general description instead of assuming every initial value matches an option button.
- The pure module has no active asset loader. Keep images owned by their actual section or check a target token before a shared asynchronous loader commits a result.
