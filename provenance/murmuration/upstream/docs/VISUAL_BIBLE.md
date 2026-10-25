# MURMURATION — Visual Bible

## Decision / 24 October 2026

The selected opening direction is **A / The Wide Fold**. The subject is the flock, not a control panel. Charcoal individuals make an irregular, porous fold over a warm, spacious sky. The lower-left heading has its own clear territory. B is retained as a scale reference, not the opening: its foreground birds are too dominant and would break the sense of one observable model on a narrow screen. C establishes the ochre observation accent. D and E extend the same world into a functional experiment and a quiet conclusion.

All flock positions in the shipped experience come from the simulation. Concept photographs are **reference only**; they never substitute for interactive agents. The generated empty sky is the sole final raster background. UI text is HTML, and bird geometry is lightweight code. Photorealistic feather detail in B and C is intentionally translated to directional silhouettes: the medium must support thousands of independently moving agents.

## Image inventory

| File | Disposition | Purpose and selection |
| --- | --- | --- |
| concepts/A-wide-fold.jpg | reference only | Accepted opening: diagonal long fold, generous low-left type territory, density with open edges. |
| concepts/B-flock-edge.jpg | reference only | Alternate hero, not selected. Near/far relationship informs a few foreground individuals; oversized birds would compete with the whole. |
| concepts/C-local-world.jpg | reference only | One ochre individual, sparse neighbors, single-rule directional explanation. No all-to-all network. |
| concepts/D-live-field.jpg | reference only | Reading band + three sliders, compact preset row, direct sky interaction. |
| concepts/E-shape-left.jpg | reference only | Pull back from the user's actual saved shape; spare closing typography and two clear actions. |
| ../public/sky.webp | final asset | Empty natural sky and distant wetland. No generated birds or text in production media. |

## Color, material, type

- Sky: warm grey-white, with pale grey-peach horizon. Charcoal `#242523`; secondary ink `#595a53`; ochre `#9a5632`. No bloom, artificial noise, neon or star-field motif.
- Display: Anton for the opening; Cormorant Garamond for observational headings; DM Sans for body and controls. All font files are shipped locally with their licenses.
- Layout: open sky, editorial reading regions, thin rules, understated rectangular buttons. No card grid or stacked dashboard containers.
- Bird marks: directional body, pointed head, separate tapered wings, asynchronous wing phase; depth changes size and atmospheric contrast. No point-sprite dots as the only representation.

## The five compositions

| Act | Stable frame | Time and hold | Exit |
| --- | --- | --- | --- |
| I — The Many | Fold across upper and middle sky; large condensed title lower left. | Positions sampled from a selected real recorded tick. Wing motion is a separate small cue. | Title leaves before the camera approaches a marked individual. |
| II — A Local World | Selected identity in right half; a few neighbors; short rule copy in left band. | Local rules illustrated one at a time, observation remains pausable. | Arrows recede, recorded local perturbation begins. |
| III — A Turn Travels | Wider camera shows a local response propagating through the recorded model. | Scroll samples real trajectory checkpoints, forward or backward. | Observation ends at an exact simulation checkpoint. |
| IV — The Live Field | Continuous real flock in a bounded visible region; separate control band. | Fixed-step simulation, user pause, native sliders, three presets, localized ripple. | Capture full state before receding to the final composition. |
| V — The Shape You Left | Saved shape recedes into wider sky; final line arrives after control exit. | No simulation; exact saved state available for return or Fieldprint. | User controls return, reset and exit. |

## Handoff contract

| Boundary | Start | Midpoint | End / reverse |
| --- | --- | --- | --- |
| I → II | Title recedes; one ID becomes ochre. | Same coordinates; camera eases toward selected neighborhood. | Local relationship overlay appears only after type clears. Reverse evaluates the same camera and data. |
| II → III | Directional overlay leaves. | Model record shows only locally initiated change; camera retreats. | Wider real response, no simultaneous whole-flock rotation. |
| III → IV | Exact final recorded checkpoint. | Initial entry uses it directly. On revisit, a labeled saved observation window distinguishes preserved live time from the narrative record. | Saved experiment restores before simulation resumes. |
| IV → V | Capture positions, velocities, seed, tick, rule weights and pause state. | One frozen flock; camera pulls back while controls leave. | Closing words enter a separate region. Returning restores this exact snapshot before stepping. |

Each boundary is sampled at 0/25/50/75/100 percent, forward and reverse. No full-screen fade or occlusion masks a state change.

## Mobile and accessibility

The world is rotated and reframed, not re-seeded: portrait shows a slanted vertical plume. The hero title fits one line above its subtitle. Local observation occupies the upper portion and reading text a separate lower band. Live controls enter normal flow below a visible sky window; 320px screens retain 44px control heights and an independently scrollable control band; compact chapter targets are 33×44px. Short landscape screens use a compact two-column arrangement. Reduced motion uses fixed observations and user-requested simulation steps; continuous flight requires explicit activation. A single Canvas 2D renderer makes WebGL absence immaterial.

## Production fidelity criteria

Compare composition, palette, title footprint, serif/sans hierarchy, control layout, wing recognizability, negative space and mobile reading order against A/C/D/E. Do not claim the same arbitrary flock contour as a generated image: that would require target choreography, prohibited by the brief. Evaluate model-derived equivalent scale and visual quality instead. Concrete discrepancies and repairs belong in the QA report.

## Final visual review against the accepted references

The accepted concepts and the real 1440×900, 390×844 and 3840×2160 frames were viewed together after implementation. This is a separate art/motion review from the state and geometry checks.

| Criterion | Actual result and decision |
| --- | --- |
| Opening subject and scale | An upper-sky, irregular long fold fills the frame before explanation. The shape comes from tick 420 of the actual model. It has lower density and larger gaps than A's imagined photographic flock; that difference is retained rather than introducing a target silhouette or fake background birds. |
| Title footprint and negative space | A strong condensed title occupies the lower left, with a distinct subtitle and a clear scroll cue. Anton is broader and shorter than the concept's extremely tall face. Its final size gives the heading adequate weight without crossing the real flock. |
| Palette and horizon | Warm grey sky, a restrained peach horizon, charcoal agents and one ochre observation accent carry through all five acts. The final generated sky has a more noticeable low cloud band than the reference; it stays below the principal reading areas. |
| Local observation | The same marked ID and seven recorded nearby identities remain legible against atmospheric background birds. C's photographic feathers are translated into tapered code-drawn wings and a pointed body. The selected group is smaller than C's close-up; the result preserves its real neighborhood coordinates and avoids oversized background birds entering the reading band. |
| Rule explanation | Only one local direction cue is shown. The ochre underline follows the selected concept. The annotation clears before the turn begins. No network of decorative lines is added. |
| Live experiment | D's open left control band and right-hand flock are preserved. Presets precede the sliders for faster entry; a Step action appears while held. The observing camera was enlarged after review found this act too small. Its actual bounds remain separated from the controls. |
| Ending | The exact saved field retreats into the upper-right sky and the closing serif line enters lower left. The final shape can be more open or clustered than E. The user-created result determines it; no idealized finale shape is imposed. |
| Portrait hierarchy | The flock turns into a diagonal vertical plume. The opening title was enlarged after a first review. Local text occupies the lower reading region; live controls use a scrollable band below the flock. The saved branch enters the upper right on phones, away from the outgoing title. |
| 4K behavior | Real 3840×2160 output keeps the same hierarchy and individual wings. The background is intentionally atmospheric rather than a native 4K photograph. The backing pixel ratio is capped at one; no unmeasured high-frame-rate claim is made. |
| Motion and handoff | Narrative identity and position remain reversible. The live branch has an explicit framed entrance, and the ending retains the saved shape. Continuous video and dense mobile sampling exposed and resolved label/reading-band collisions that stable screenshots had missed. |

The weakest early compositions were the live and ending flock scale. Their camera framing was corrected before final acceptance. Remaining differences from the concepts are medium, density and exact emergent contour—not missing acts or substitute screenshots for interaction. The work is intentionally a real, bounded local-rule observation with a photographic sky and authored bird silhouettes.
