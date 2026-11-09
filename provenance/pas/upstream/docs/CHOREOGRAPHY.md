# PAS — choreography and continuity ledger

**Status: implementation-aligned choreography ledger.** This document describes the authored action and its review criteria. Numerical checks are recorded in the motion score; rendered and browser observations belong in the verification report. It does not claim that every transition has passed visual review or that the work has been validated by professional dancers.

## People and physical world

Cen and Cheng are adult fictional dancers. Cen has dark hair tied low, a rust-red practice shirt, charcoal trousers and bare feet. Cheng has short curls, a sand-grey practice shirt, charcoal trousers and bare feet. Their body proportions, clothes, skin, hands and identity remain consistent when they exchange screen positions.

Cen initiates the first offered hand and the directional changes in One Palm and Let Go. Cheng makes room in Make Room. During A Complete Phrase, Cen waits while Cheng passes through a half-body-length arc, then looks back before their hands briefly meet.

The modeled contact pair is **Cen's anatomical right hand and Cheng's anatomical left hand**. This follows the actual model's local axes: the model's anatomical left lies along positive local X. The other hands remain free to balance. User-facing captions normally refer to the contact without naming a side, since neither dancer belongs permanently to screen-left or screen-right.

The floor and observation axis remain stable. Light touch does not support tensile counterweight: a clearly formed grip precedes outward weight transfer. Each dancer recovers independent support before the hold releases. Back contact occurs below the neck, and the shared low position is deliberately modest. These are construction constraints for an imagined duet, not measured forces or a dance lesson.

## Progress contract

The narrative coordinate is `t ∈ [0, 10]`. Chapter `n` occupies `[n−1, n]`. Its principal content occupies local progress `0.00–0.76`; local `0.76–1.00` hands the scene to the next chapter. Chapter 10 has no outgoing transition. Boundary evaluation is a pure function of the requested progress and explicit viewer state, with no required history of earlier chapter visits.

All body, contact, camera and narrative text states consume the same progress. Unison and Echo affect only the independent phrase in Chapter 5. They must share exactly the same preparation and ending poses. Local playback temporarily becomes the single progress owner; pausing preserves the displayed state, while returning to scrolling first synchronizes the scroll position to that state. Actual wheel, touch, keyboard or chapter navigation immediately takes over without a forced completion.

Support/contact chapters cannot be phase-shifted by a timing-mode choice. Decorative breathing, if enabled, may add only a small non-narrative chest movement and must stop in reduced-motion mode or when the viewer pauses it.

## Ten movements

| Chapter | First relation | Second relation | Intended held view |
| --- | --- | --- | --- |
| 01 · Between | Cen offers a hand into the gap | Cheng notices before answering | Two full bodies, both feet, hands still apart |
| 02 · Ground | Each finds independent support | Cen shifts slightly and settles while Cheng watches | Feet, ankles and knees, with the other dancer's support still legible |
| 03 · One Palm | The palms approach and touch lightly | Cen redirects the forearm; Cheng receives it through elbow and shoulder | Separate palms/fingers, both arms traceable to their bodies |
| 04 · Counterweight | One-hand grip is established | A small outward lean returns to independent support | Grip, knees and all support feet visible together |
| 05 · Unison / Echo | An independent lift–turn–return phrase occurs together | The same phrase is answered after a delay | No contact; a fixed view makes the temporal difference visible |
| 06 · Make Room | Their paths approach | Cheng shortens a step and moves into depth; both pass | Recently opened space and clearly preserved clothing identity |
| 07 · Lower Together | Settling steps establish back contact after the exchange | Both descend through knees/hips, then prepare to rise | Separate body edges, planted feet, modest shared low position |
| 08 · A Complete Phrase | Rise, recover weight, release backs, turn side by side | Cheng passes as Cen waits; a brief hand contact closes the phrase | A new extended relation with both bodies and feet intact |
| 09 · Let Go | Independent support precedes the final finger release | A small movement still receives an answer across the gap | Both separate bodies with their attention legible |
| 10 · Here, Again | A comparable distance returns with changed hands and shoulders | Viewer revisits a contact, counterweight or timing moment | A complete ending image, with no bow, triumph pose or empty stage |

The ending is comparable to the opening in spacing and visual grammar. It does not require the same screen-side assignment. If any implementation restores original sides, it must include actual stepping and collision-safe paths rather than translating bodies over planted feet.

The implemented crossing already leaves the dancers facing away from each other. The handover into Lower Together uses small settling steps to establish back contact; it does not add a separate axial turn. The ending intentionally retains the exchanged sides.

## Nine adjacent transitions

Every local five-frame checkpoint below is a planned review target. The five stills and continuous forward/reverse observation must be recorded separately; passing one does not prove the other.

| Boundary | 0% | 25% | 50% | 75% | 100% |
| --- | --- | --- | --- | --- | --- |
| TR-01-02 | Both bodies hold the offered/answered gesture | Hands remain steady as the view lowers | Full bodies remain identifiable; feet gain emphasis | Legs and floor become the main detail | Both dancers' support is clear |
| TR-02-03 | Foot support detail | A forearm rises into the existing view | The view returns to the body; feet remain locatable | Palms approach with a visible gap | Light contact and forearm ownership are clear |
| TR-03-04 | Light palm contact | A clear grip forms; elbow/shoulder context returns | The grip and both sets of feet are visible before outward loading | A small outward transfer begins with the grip intact | Full counterweight shape is established |
| TR-04-05 | Supported outward lean | Weight returns towards each dancer's own feet | Both stand independently while hands remain held | The contact releases into phrase preparation | The independent timing experiment can begin |
| TR-05-06 | Either timing mode has reached its identical ending | Attention turns towards travel | One first step begins while Cheng prepares to yield | Both real paths become legible | The approaching encounter is established |
| TR-06-07 | Both have passed | Small settling steps preserve clothing identity | Their backs approach with an actual gap | Back contact forms after feet settle | The shared descent can begin |
| TR-07-08 | Shared low support | Both rise in coordination | Each recovers weight as back contact starts to release | The first side-by-side step begins | The new continuous phrase unfolds |
| TR-08-09 | The complete phrase reaches its ending | Hands approach while both bodies settle | A brief contact is established within the full-body relation | The view moves towards the hands; an overview remains | Let Go begins from the same hand/body state |
| TR-09-10 | Final contact is released | Separate steps widen the distance | Shoulder/arm response remains visible across the gap | The opening-like composition returns | The final pose, ending line and revisit links are present |

### Transition invariants

- Contact belongs to the same anatomical hands throughout. Fingers do not fuse, change count or appear/disappear under a fade.
- No loaded support foot may slide, hover, penetrate the floor or lose its shadow. Root movement during travel must agree with a swing/stance gait.
- The two actors must not pass through one another in Make Room or while settling into back contact. The viewed axis is not crossed to disguise that problem.
- Full-body and close views use the same model state. If any alternate pre-render is used, silhouette, scale, lens, exposure, skin, sleeve, shadow and hand pose require explicit matching.
- Mobile reduces horizontal distance and uses depth/diagonal placement while preserving both dancers and the narrative fact that Cheng yields.
- Missing or late assets cannot change the active chapter or replace a newer scene. A fallback must match the requested chapter and preserve its semantic content and functional controls.

## Timing-specific design commitments

The passing and settling sequence spans `t = 4.76–6.00`, including the outgoing edge of Unison / Echo, all of Make Room and the arrival into Lower Together. It is authored as one continuous stepped track, without root teleports.

The shared descent occupies `t = 6.08–6.45`, followed by a low hold until `t = 6.76`. Coordinated rising then occupies the outgoing transition `t = 6.76–7.00`. These are normalized narrative coordinates, not seconds or required scrolling durations.

`src/content.ts` is the canonical source for visible observation-step times and still aliases. The motion-score table lists those same positions. CH-08's final Meet step is `7.98`, after the final fingertip contact is established; CH-04 Return is `3.90`, before release; CH-09 Answer is `8.61`, at Cheng's response. A title or caption is never evidence that the described motion actually occurred.

## Verification record

Numerical motion evidence and the isolated CH-03 wrist correction are recorded in `motion-score.md`; real mesh evidence is recorded in `CHARACTER-VERIFICATION.md`. These checks do not by themselves establish visual correctness throughout all nine transitions.

The final verification report must separately identify observed results and exact environments for nine five-frame transition strips; continuous slow/fast forward and reverse observation; desktop and mobile complete paths; local-playback ownership; reduced-motion key poses; camera/actor/text overlap; resource failures; and pack-and-extract reproducibility. Keep untested environments and artistic limitations explicit. A successful build or numerical assertion suite is not a blanket visual pass.
