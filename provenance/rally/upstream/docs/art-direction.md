# RALLY — Art Direction

## A ball gives the court a reason to exist

RALLY is a ten-chapter study of one practice exchange between two people. The visual story moves from anticipation to contact, from contact to space, and from a return choice to its consequences. The court is a physical relationship, not a decorative backdrop. The final third deserves the same photographic and editorial care as the opening.

The language of the site, its controls, alternative text, metadata, explanations and exported result is English. A is always the original near-side player in dark navy. B is always the original far-side player in cream. A camera change does not exchange their identities.

## Selected visual direction

**Select the H-A low-angle direction, developed into H-D for desktop and H-M for phones.** It establishes the single felt ball, real net and distant opponent in one readable frame. Large quiet areas support real HTML titles without making the photograph carry text. The enlarged foreground ball is an editorial frozen instant, not a claim about its physical size on court.

| Candidate | Decision | Reason |
| --- | --- | --- |
| H-A: low camera across the net | Selected direction | The foreground ball and distant B express the subject immediately; quiet clay gives the title a natural home. |
| H-B: elevated full court | Retained as an alternative/reference, rejected as the primary hero | It explains court geometry and both players well, but the ball is too small to deliver the intended hero silhouette and tactile presence. |
| H-C: sideline contact detail | Retained for close-up language, rejected as the primary hero | Felt, shoe and racquet are convincing and immediate, but the relationship with the distant opponent is weaker. |
| H-D: refined desktop | Adopted production still | Develops the chosen low-angle composition, large ball, quiet title field and near/far relationship. |
| H-M: independent portrait | Adopted production still | A newly generated vertical composition preserves the ball, net and B on a narrow screen; it is not a crop of H-D. |

K-04 establishes the central explanatory scale change. K-08 establishes the late-story overhead space. T-05-06 establishes the net-to-ground handoff. The transparent player and ball cutouts supply photographic material to programmatic scenes without substituting low-poly people or an untextured generic sphere.

## Visual Bible

| Element | Rule |
| --- | --- |
| Clay | `#C96D4C` is the largest warm field. Use granular, matte ground and subtle shoe traces. |
| Cream | `#F4F0E4` carries court lines, calm text and the ball seam. |
| Cool air | `#C6E2E7` belongs to distant atmosphere and secondary comparison information. |
| Yellow | `#DDEA54` belongs to the ball and its immediate identity; it is not a general decoration color. |
| Navy | `#243840` supplies readable type, dark kit and quiet explanation fields. |
| Light | Morning light comes from upper left, with cool fill and restrained warm reflections from clay. Avoid bloom, neon and synthetic light trails. |
| Type | Use narrow, strong English display type with a readable sans-serif text face. Real DOM text must have room for fallback fonts and natural wrapping. |
| Detail | Felt, cream seams, clay grains and net mesh explain scale. No brand marks, scoreboards, fabricated statistics or famous-player likenesses. |
| Camera | Keep the court axis legible. A known ball, shadow, line, racquet edge or bounce mark anchors each camera or medium change. |
| Motion | Contact is brief; flight is continuous; observation is stable. Decorative motion must not change a shot or move its landing point. |

## Scene hierarchy

| Chapter | Image and spatial emphasis | Stable observation |
| --- | --- | --- |
| 01 — Between two people | H-D/H-M photograph, one ball, near/far relationship | Quiet title, net, ball seam and B |
| 02 — Before contact | H-C close-up language and readable preparation | A, racquet face and the space before impact |
| 03 — A single instant | Programmatic contact using the ball cutout and racquet geometry | Before/after contact; finite illustrative compression |
| 04 — See the spin | K-04 explanatory macro plus exact programmatic comparison | Two trajectories with identical launch conditions and different spin |
| 05 — A little room | Main-rally side view with net and landing relation | Explicit return to A's fixed topspin shot |
| 06 — The ground answers | T-05-06 material reference and programmatic bounce | Before/contact/after with one shared landing point |
| 07 — See the opening | Exact overhead geometry, photographic player layers | B's receiving position and A's available space |
| 08 — Where to return | K-08 art reference, two precise selectable routes | One B contact point, two destinations in A's half |
| 09 — Your rally | Selected deterministic route and player positions | Four contact events, repeatable step controls |
| 10 — Give it back | Quiet court, the selected trace and a real SVG result | Closing exchange and a clear way to try the other return |

These are integration intentions and acceptance targets. This document is not evidence that a browser-rendered chapter or transition has passed visual review.

## Photographs and exact geometry

Generated photographs establish composition, light, material and authored poses. They are not measurement sources. The court, net, ball, landing marks, shadows, players and trajectory overlays in interactive scenes must share the program's coordinate system. The physics module is authoritative for state and events; an attractive raster must never correct a failed shot by hiding it.

A source photograph containing a ball is a complete static state. Do not add a second moving main ball over it. When changing to a programmatic scene, hand off a known anchor and show only the active representation. The giant K-04 ball is explicitly an enlarged explanatory object; it does not change the main rally's physical scale.

The player cutouts are authored still postures, not a captured running sequence. Place them at interpretable positions and support movement with controlled state changes or keyframes. Do not imply believable footwork by sliding a frozen body across clay. Sprite views are photographic oblique overhead views, not exact orthographic scans.

## Small screens and low motion

Use H-M as the portrait hero. Pair close detail with a legible full court; shrinking two players into indistinguishable dots is not an equivalent mobile composition. Keep the two route buttons large, stacked when needed, and outside the playing field. Place replay events and exported-result explanation below the court when width is limited.

Reduced motion preserves all ten chapters and both branches. Use stable key states, side-by-side comparison or explicit stepping in place of long travel and repeated impact. Default audio is off. Every contact must remain understandable without sound.

## Review boundary

The image sources were generated and inspected. Their prompts and roles are recorded in [asset-provenance.md](asset-provenance.md). Browser fidelity, responsive text placement, ball ownership at handoffs and interaction correctness require separate evidence. Do not turn the existence of the source images into an assertion of final-page fidelity.
