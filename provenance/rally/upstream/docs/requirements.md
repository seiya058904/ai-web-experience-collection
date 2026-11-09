# RALLY — requirements and evidence ledger

This ledger translates the supplied RALLY brief into reviewable requirements. It records the intended scene contract separately from verification. A source file, concept image, test count, or attractive still does not by itself establish that a rendered chapter or handoff passes. The current executed build, model, browser and package results are authoritative in [acceptance.md](acceptance.md); this planning ledger must not override a later recorded result with a stale blanket status. The implementation and its fidelity limits are documented in [fidelity-ledger.md](fidelity-ledger.md).

## Status vocabulary

- **Model verified**: the deterministic model or immutable-state behavior has an executed automated test.
- **Asset recorded**: an actual generated image exists with provenance; this is not a final-page visual pass.
- **Unverified**: browser, visual, input, or delivery evidence is still required.
- **Failed / fixed**: use only for a reproduced defect and its recorded correction, with a separate retest result.

## Non-negotiable identities

The work contains ten effective chapters, nine adjacent handoffs, six Hero states, eight distinct required image roles, and two complete B-to-A return branches. Navigation, loading, a footer, or a repeated picture with a different title does not count as a chapter.

A is the original near-side player in navy; B is the original far-side player in cream. A produces the fixed main topspin shot. B receives it and makes the one viewer-controlled return choice. A receives that selected return. B stops the final ball. Alternate camera views preserve the original world coordinates and identities.

All built-in visible text, alternative text, accessible names, navigation, errors, metadata, and fixed export text are English. User-supplied text, if any is added, is preserved as supplied.

## Ten chapters and their two substantive beats

| Chapter | Beat A | Beat B | Stable composition / handoff anchor | Required equivalent on a phone | Evidence status |
| --- | --- | --- | --- | --- | --- |
| CH-01 — Between two people | Recognize the foreground ball and far-side B | Reveal near-side A within the same court relationship | One ball, net, and near baseline | Independently composed H-M image; readable near/far relationship | H-D/H-M assets recorded; six-state CSS/DOM refinement implemented; final Hero visual retest Unverified |
| CH-02 — Before contact | Read B's position and the arrival direction | Read A's preparation, racket face, and expected contact | Near baseline to the racket edge | Two readable preparation states; no tiny whole-body tutorial | H-C and player assets recorded; interaction and body/racket evidence: acceptance record |
| CH-03 — A single instant | Observe before contact and finite illustrative compression | Observe departure into A's fixed topspin shot | Racket edge and the same cream ball seam | Before/after contact states with real controls | Fixed outgoing model verified; contact-rendering evidence: acceptance record |
| CH-04 — See the spin | Compare identical origin and full launch velocity while changing only spin | Read the resulting curve and landing difference | Enlarged explanatory ball plus two side-profile curves | Stacked comparisons with the same causal information | K-04 asset recorded; numerical comparison and isolation model verified; controls/visuals: acceptance record |
| CH-05 — A little room | Explicitly return to A's fixed topspin main shot | Distinguish clearance above the net from the landing in B's half | Main topspin curve and net band | Whole side-profile and readable net detail | Legal fixed main flight model verified; return-notice and rendering evidence: acceptance record |
| CH-06 — The ground answers | Reach the same B-side landing and show contact | Rebound while preserving one clay mark | Ground projection and contact ellipse | Before / contact / after states | Main landing-to-rebound continuity model verified; compression/mark evidence: acceptance record |
| CH-07 — See the opening | Show B reaching the receiving point | Show A's recovery and temporary open space | Existing landing mark, B contact, A sideline | One legible full-court view plus readable details | Shared B contact and positions available; view and scene-continuity evidence: acceptance record |
| CH-08 — Where to return | Compare crosscourt and down-the-line routes from the same B contact | Commit one route and begin its consequences for A | Selected route toward A; one physical ball | Large stacked choices and reachable landing targets | Both legal branches, different movement and space model verified; keyboard/touch UI evidence: acceptance record |
| CH-09 — Your rally | Observe A's reception and response | Revisit the full selected path and its spatial cost | Four contact events, ending with B's stopped ball | Court above a readable event sequence; explicit stepping | Four-event continuity, deterministic seek, invalidation and duration model verified; playback/audio evidence: acceptance record |
| CH-10 — Give it back | B gently returns the ball and both players remain identifiable | View and save the selected rally, or try the other choice | Quiet court and the real selected trace | Complete ending with the result beneath the court | Both closing handback models verified; rendered closing, actual download and control evidence: acceptance record |

Full entrance, two-beat, stable-hold, exit and phone coverage is assessed per chapter in the acceptance record. Partial observations must not be promoted to a complete chapter pass. The final three chapters receive the same composition and interaction standard as the opening.

## Hero six-state contract

| State | Required visible result | Review evidence |
| --- | --- | --- |
| First meaningful frame | Ball, net, B, and actual English title are already recognizable | Cold-start desktop, phone, and wide screenshots — Unverified |
| Reveal | The same ball's cream seam and B's preparation explain the relationship | Early-scroll interruption and normal reveal — Unverified |
| Complete composition | Foreground ball has the intended prominence; title and shadow remain legible | H-D/H-M-to-browser comparison — Unverified |
| Hold | Stable explanatory instant; no endless fake-speed rotation | Prolonged hold with optional position labels — Unverified |
| First scroll | The ball returns to real scene scale while the projection/baseline remains traceable | Forward Hero→CH-02 sequence — Unverified |
| Return | Initial observation returns while the selected return remains saved | End→Hero and reverse-scroll pass — Unverified |

No Hero state may lock the scroll, require a completed intro, or replay all opening actions after a return. Six-state CSS/DOM behavior has been implemented and source-checked; final visual retesting was interrupted. The still photograph does not animate B into a new pose, and the dedicated SVG bridge is not an exact photographic takeover. See the Hero section of the fidelity ledger for the implemented behavior and retained limits.

## Nine local handoffs

Percentages below refer to each handoff's own local interval, not equal lengths of the overall page. The current scroll position must determine the frame directly, in either direction.

| Handoff | Anchor | 0% | 25% | 50% | 75% | 100% | Evidence status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TR-01-02 | Ball and near baseline | Hero across the net | Ball begins to return to scene scale | Ball, baseline, and A's legs share one axis; title makes room | Preparation and racket frame lead | CH-02 hold | Five frames, forward/reverse input and mobile — Unverified |
| TR-02-03 | Racket edge near the ball | A's preparation | Move along the frame; old text exits | Racket edge remains identifiable; ball is before contact | Contact detail takes over | CH-03 hold | Five frames and no ball/racket penetration — Unverified |
| TR-03-04 | Fixed cream seam | Departing main ball | Racket recedes; seam stays known | Explicitly enlarged explanatory ball enters the profile study | Two same-origin curves establish | Full spin comparison | Five frames and no double-ball handoff — Unverified |
| TR-04-05 | Fixed main topspin path | Current saved comparison | Explicitly announce return to A's main topspin | Same main coordinates establish the court/net view | Scene-scale ball takes over | Legal net/landing view | Model isolation verified; visible five-frame handoff Unverified |
| TR-05-06 | Ground projection and landing | Post-net profile | Follow descent toward the surface | Net edge, ball, ground projection and white line are readable together | Ground detail and shadow lead | Before-contact hold | T-05-06 asset recorded; five-frame browser check Unverified |
| TR-06-07 | Clay contact mark | Rebound detail | Ball and ground projection stay at their actual event | Raise the view; the mark remains tied to the line | People and open space establish | CH-07 hold | Shared contact model verified; projected mark continuity Unverified |
| TR-07-08 | B contact and A sideline | B ready, A waiting | Move spatial commentary aside | Two preview routes begin at the same B point | Real controls appear outside the court | Return choice ready | Route origins model verified; five-frame/input review Unverified |
| TR-08-09 | Selected B-to-A route | Both preview options | Withdraw the unselected route | One ball begins the selected route from B | A-side bounce and replay controls establish | Four-event replay available | Branch invalidation model verified; no stale replay/double ball in browser Unverified |
| TR-09-10 | Last ball and selected trace | Current replay state | Stop local playback and use a bounded connection to the ending | Both people remain known; trace becomes fine | Result and operations enter free space | Quiet court and real result | Event endpoints model verified; mid-replay exit/ending continuity Unverified |

At all nine boundaries, the view retains a meaningful court, ball, or explicitly explanatory frame. A pure black frame is not an unimplemented transition. A missing or late resource must fall back to the target chapter, never an unrelated previous chapter.

## Interaction and state requirements

| Requirement | Model/source evidence | Browser check; executed status in acceptance record |
| --- | --- | --- |
| Independent `comparisonSpinPreset`; fixed `mainRallyPreset` | State and physics tests preserve complete launch inputs and main identity | Toggle no-spin, observe long result, continue to legal CH-05, revisit saved comparison |
| Crosscourt default and two real return branches | Both routes clear the net and land in A's half; A movement, open space and response differ | Select both routes with mouse, touch and keyboard; compare replay and export |
| Playback, pause, seek, step and reset | Pure samples, clamped seeking, end stop and branch invalidation tested | Controls operate without moving the main scroll or swallowing page input |
| View A / view B | World identities and coordinates are fixed | Camera change preserves identity, target and line direction |
| Audio opt-in | State starts and restores muted | Actual contact only; no seek/background/branch-change catch-up sounds |
| Reduced motion | Preference validation and persistence tested | Native scroll/discrete states; all ten chapters and outcomes remain |
| Persistence | Invalid storage is sanitized; playing/sound are never restored | Refresh, anchors, history return, unavailable storage and browser resize |
| SVG result | Selected branch paths and coordinates exist | Actual download; exported branch and landing positions match visible result; failure is reported honestly |

## Engineering and delivery gates

| Gate | Required result | Current evidence status |
| --- | --- | --- |
| G0 — Environment | Isolated local project, exact dependencies, requirement ledger | Project files and lockfile present; independent-package results: acceptance record |
| G1 — Art | Eight distinct required outputs, candidate rationale and portrait reconstruction | Asset provenance/art-direction records present; production-page evidence and limits: acceptance and fidelity records |
| G2 — High-risk studies | Hero→02, 03→04, 04→05, 05→06 and 08→09 work as real scenes | Physics/state parts verified; exact executed scene coverage: acceptance record; no full five-frame pass implied |
| G3 — Whole story | Ten substantive chapters, nine handoffs and complete final third | Chapters and bridge scenes implemented; complete-path browser coverage: acceptance record |
| G4 — Refinement | Record the weakest two chapters and one handoff, then correct observed defects | Source refinements recorded in fidelity ledger; observed weaknesses, corrections and actual retests: acceptance record |
| G5 — Acceptance | Executed browser matrix, production build and defect retests | Executed test counts, builds, browser checks and remaining gaps: acceptance record |
| G6 — Packaging | Clean ZIP extraction, install/build/preview, all formal assets, checksums | Actual extraction/install/build/preview and checksum results: acceptance record and final delivery report; not inferred from source presence |

See [acceptance.md](acceptance.md) for the executed checks and actual limitations. No deployment, publication, repository push, PR, Release, or collection modification is authorized by this local-only package.
